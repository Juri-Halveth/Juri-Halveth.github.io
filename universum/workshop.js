(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.HALVETH_WORKSHOP = api;
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";

  const SCHEMA = "halveth.netz.local-workshop.v1";
  const CEILING = "USER_AUTHORED_SYNTHETIC_MODEL_ONLY";
  const PROJECT = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/;
  const ACTION = /^a[1-9][0-9]*$/;
  const BRANCH = /^a[1-9][0-9]*_(?:main|b(?:[2-9]|[1-9][0-9]+))$/;
  const TYPES = new Set(["ACTION_STARTED", "STEP", "GAP", "BRANCH_CREATED", "ACTION_COMPLETED", "NEXT_ACTION_STARTED"]);
  const MAX_EVENTS = 128;
  const MAX_ACTIONS = 16;
  const MAX_BRANCHES = 32;
  const EVENT_KEYS = ["actionId", "branchId", "id", "label", "parents", "recordedAt", "tick", "type"];
  const STATE_KEYS = ["claimCeiling", "events", "projectId", "schema", "synthetic"];

  function fail(message) { throw new TypeError(message); }
  function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value) &&
      (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
  }
  function exactKeys(value, keys) {
    return isRecord(value) && Object.keys(value).sort().join("|") === [...keys].sort().join("|");
  }
  function label(value) { return typeof value === "string" && value.trim() !== "" && value.length <= 120; }
  function clock(value) {
    if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)) return false;
    const parsed = new Date(value);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
  }
  function eventId(number) { return "e" + String(number).padStart(6, "0"); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  /** Replays the local declaration log. Checks structure and transition order, not the user's assertion. */
  function replay(state) {
    if (!exactKeys(state, STATE_KEYS) || state.schema !== SCHEMA || state.synthetic !== true ||
        state.claimCeiling !== CEILING || typeof state.projectId !== "string" || !PROJECT.test(state.projectId)) {
      fail("Invalid local workshop header");
    }
    if (!Array.isArray(state.events) || state.events.length < 1 || state.events.length > MAX_EVENTS) {
      fail("Workshop must contain 1..128 events");
    }
    const seen = new Map(), actions = new Map(), branches = new Map();
    for (let index = 0; index < state.events.length; index += 1) {
      const event = state.events[index];
      if (!exactKeys(event, EVENT_KEYS) || event.id !== eventId(index + 1) || event.tick !== index ||
          !TYPES.has(event.type) || !ACTION.test(event.actionId) || !BRANCH.test(event.branchId) ||
          !label(event.label) || !clock(event.recordedAt) || !Array.isArray(event.parents) ||
          event.parents.length > 1 || event.parents.some((id) => typeof id !== "string" || !seen.has(id))) {
        fail("Invalid event at tick " + index);
      }
      if (index > 0 && event.recordedAt < state.events[index - 1].recordedAt) {
        fail("Local recordedAt cannot precede the prior record");
      }
      if (index === 0) {
        if (event.type !== "ACTION_STARTED" || event.actionId !== "a1" || event.branchId !== "a1_main" || event.parents.length) {
          fail("First event must start action a1 at local model tick zero");
        }
        actions.set("a1", { id: "a1", label: event.label, rootEventId: event.id, parentCompletionId: null });
        branches.set("a1_main", { id: "a1_main", actionId: "a1", head: event.id, steps: 0, completed: false, childActionId: null, originId: null });
        seen.set(event.id, event);
        continue;
      }
      if (event.type === "ACTION_STARTED") fail("Only the first event may be ACTION_STARTED");
      if (event.parents.length !== 1) fail("Every later event needs one earlier parent");
      const parent = seen.get(event.parents[0]);
      if (event.type === "NEXT_ACTION_STARTED") {
        const parentBranch = branches.get(parent.branchId);
        const expectedId = "a" + (actions.size + 1);
        if (actions.size >= MAX_ACTIONS || parent.type !== "ACTION_COMPLETED" || !parentBranch ||
            parentBranch.childActionId !== null || event.actionId !== expectedId ||
            event.branchId !== expectedId + "_main") fail("Invalid next-action anchor");
        parentBranch.childActionId = expectedId;
        actions.set(expectedId, { id: expectedId, label: event.label, rootEventId: event.id, parentCompletionId: parent.id });
        branches.set(event.branchId, { id: event.branchId, actionId: expectedId, head: event.id, steps: 0, completed: false, childActionId: null, originId: parent.id });
      } else if (event.type === "BRANCH_CREATED") {
        const source = branches.get(parent.branchId);
        const branchCount = Array.from(branches.values()).filter((branch) => branch.actionId === event.actionId).length;
        const expectedId = event.actionId + "_b" + (branchCount + 1);
        if (branches.size >= MAX_BRANCHES || !source || source.actionId !== event.actionId ||
            source.head !== parent.id || source.completed || branches.has(event.branchId) || event.branchId !== expectedId) {
          fail("Invalid branch creation");
        }
        branches.set(event.branchId, { id: event.branchId, actionId: event.actionId, head: event.id, steps: 0, completed: false, childActionId: null, originId: parent.id });
      } else {
        const branch = branches.get(event.branchId);
        if (!branch || branch.actionId !== event.actionId || branch.head !== parent.id || branch.completed) {
          fail("Event does not extend an open branch head");
        }
        if (event.type === "STEP") branch.steps += 1;
        if (event.type === "ACTION_COMPLETED") {
          if (branch.steps < 1) fail("Completion requires an explicit intermediate step on this branch");
          branch.completed = true;
        }
        branch.head = event.id;
      }
      seen.set(event.id, event);
    }
    return { actions: Array.from(actions.values()), branches: Array.from(branches.values()) };
  }

  function create(projectId, title, recordedAt) {
    if (typeof projectId !== "string" || !PROJECT.test(projectId) || !label(title) || !clock(recordedAt)) {
      fail("A valid project ID, exact title (1..120) and ISO UTC clock are required");
    }
    const state = {
      schema: SCHEMA, projectId, synthetic: true, claimCeiling: CEILING,
      events: [{ id: eventId(1), tick: 0, type: "ACTION_STARTED", actionId: "a1", branchId: "a1_main", parents: [], label: title, recordedAt }]
    };
    replay(state);
    return state;
  }

  function dispatch(state, command) {
    const derived = replay(state);
    if (!exactKeys(command, ["branchId", "label", "recordedAt", "type"]) ||
        !["STEP", "GAP", "FORK", "COMPLETE", "NEXT_ACTION"].includes(command.type) ||
        !label(command.label) || !clock(command.recordedAt)) fail("Invalid local workshop command");
    if (state.events.length >= MAX_EVENTS) fail("Local workshop event limit reached");
    if (command.recordedAt < state.events.at(-1).recordedAt) fail("Local recordedAt cannot precede the prior record");
    const branch = derived.branches.find((item) => item.id === command.branchId);
    if (!branch) fail("Unknown branch");
    const head = state.events.find((event) => event.id === branch.head);
    let type = command.type, actionId = branch.actionId, branchId = branch.id;
    if (command.type === "NEXT_ACTION") {
      if (!branch.completed || branch.childActionId !== null || derived.actions.length >= MAX_ACTIONS) {
        fail("Choose a completed branch without a next-action child");
      }
      actionId = "a" + (derived.actions.length + 1);
      branchId = actionId + "_main";
      type = "NEXT_ACTION_STARTED";
    } else if (command.type === "FORK") {
      if (branch.completed || derived.branches.length >= MAX_BRANCHES) fail("Cannot fork this branch");
      const count = derived.branches.filter((item) => item.actionId === actionId).length;
      branchId = actionId + "_b" + (count + 1);
      type = "BRANCH_CREATED";
    } else {
      if (branch.completed) fail("Completed branch is closed to new steps");
      if (command.type === "COMPLETE") {
        if (branch.steps < 1) fail("Add an explicit intermediate step before completion");
        type = "ACTION_COMPLETED";
      }
    }
    const event = {
      id: eventId(state.events.length + 1), tick: state.events.length, type,
      actionId, branchId, parents: [head.id], label: command.label, recordedAt: command.recordedAt
    };
    const next = { ...state, events: [...state.events.map(clone), event] };
    replay(next);
    return next;
  }

  function project(state, tick) {
    replay(state);
    if (!Number.isSafeInteger(tick) || tick < 0 || tick >= state.events.length) fail("Tick outside recorded model range");
    const prefix = { ...state, events: state.events.slice(0, tick + 1).map(clone) };
    const derived = replay(prefix);
    return {
      schema: "halveth.netz.local-workshop-projection.v1", projectId: state.projectId,
      synthetic: true, claimCeiling: CEILING, tick, latestRecordedTick: state.events.length - 1,
      events: prefix.events, actions: derived.actions, branches: derived.branches,
      observation: "RECORDED_LOCAL_DECLARATION_ONLY"
    };
  }

  return Object.freeze({ create, dispatch, project, inspect: replay, limits: Object.freeze({ events: MAX_EVENTS, actions: MAX_ACTIONS, branches: MAX_BRANCHES }) });
});
