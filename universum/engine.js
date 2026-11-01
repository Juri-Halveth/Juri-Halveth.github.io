(function (root, factory) {
  "use strict";
  const engine = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = engine;
  } else {
    root.NETZ_ENGINE = engine;
  }
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";

  const SCHEMA = "halveth.netz.synthetic-trace.v1";
  const TYPES = new Set([
    "ROOT",
    "BRANCH_CREATED",
    "MODEL_TRANSITION",
    "OBSERVATION_GAP",
    "MERGE_PROPOSAL"
  ]);
  const ID = /^[A-Za-z][A-Za-z0-9_-]{0,79}$/;

  function isTick(value) {
    return Number.isSafeInteger(value) && value >= 0;
  }

  function isRecord(value) {
    return value !== null && typeof value === "object" &&
      !Array.isArray(value) &&
      (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
  }

  function isJsonData(value, depth = 0, ancestors = new WeakSet()) {
    if (depth > 24) return false;
    if (value === null || typeof value === "string" || typeof value === "boolean") return true;
    if (typeof value === "number") return Number.isFinite(value);
    if (typeof value !== "object") return false;
    if (ancestors.has(value)) return false;
    if (!Array.isArray(value) && !isRecord(value)) return false;
    ancestors.add(value);
    const children = Array.isArray(value) ? value : Object.values(value);
    const valid = children.every((child) => isJsonData(child, depth + 1, ancestors));
    ancestors.delete(value);
    return valid;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  /** An invented trace. Ticks are model coordinates, not dates or project history. */
  function demoTrace(projectId) {
    if (typeof projectId !== "string" || projectId.trim() === "") {
      throw new TypeError("projectId must be a non-empty string");
    }
    return {
      schema: SCHEMA,
      projectId,
      synthetic: true,
      tickUnit: "MODEL_TICK",
      provenance: {
        kind: "SYNTHETIC_DEMO",
        source: "NETZ_ENGINE.demoTrace",
        claimCeiling: "SYNTHETIC_MODEL_ONLY"
      },
      events: [
        {
          id: "root", tick: 0, type: "ROOT", branch: "main", parents: [],
          label: "Synthetischer Modellursprung"
        },
        {
          id: "branch_explore", tick: 1, type: "BRANCH_CREATED", branch: "explore",
          parents: ["root"], label: "Explorationszweig entsteht"
        },
        {
          id: "branch_verify", tick: 1, type: "BRANCH_CREATED", branch: "verify",
          parents: ["root"], label: "Prüfzweig entsteht"
        },
        {
          id: "transition_explore", tick: 2, type: "MODEL_TRANSITION", branch: "explore",
          parents: ["branch_explore"], label: "Modellschritt im Explorationszweig"
        },
        {
          id: "transition_verify", tick: 2, type: "MODEL_TRANSITION", branch: "verify",
          parents: ["branch_verify"], label: "Modellschritt im Prüfzweig"
        },
        {
          id: "gap_verify", tick: 3, type: "OBSERVATION_GAP", branch: "verify",
          parents: ["transition_verify"], label: "Beobachtungslücke im Prüfzweig",
          gap: { fromTick: 3, toTick: 3, reason: "NO_WITNESS_FOR_MODEL_TICK" }
        },
        {
          id: "proposal_join", tick: 4, type: "MERGE_PROPOSAL", branch: "main",
          parents: ["transition_explore", "transition_verify"],
          label: "Zusammenführung nur vorgeschlagen",
          proposal: { leftBranch: "explore", rightBranch: "verify", status: "PROPOSED_ONLY" }
        }
      ]
    };
  }

  /** Validate the closed, synthetic demo format. No external truth is inferred. */
  function validateTrace(trace) {
    const errors = [];
    if (!isJsonData(trace)) {
      return { ok: false, errors: ["trace must be finite, acyclic plain JSON data"] };
    }
    if (!isRecord(trace)) return { ok: false, errors: ["trace must be an object"] };
    if (trace.schema !== SCHEMA) errors.push("schema must be " + SCHEMA);
    if (typeof trace.projectId !== "string" || trace.projectId.trim() === "") {
      errors.push("projectId must be a non-empty string");
    }
    if (trace.synthetic !== true) errors.push("synthetic must be true");
    if (trace.tickUnit !== "MODEL_TICK") errors.push("tickUnit must be MODEL_TICK");
    if (!isRecord(trace.provenance) || trace.provenance.kind !== "SYNTHETIC_DEMO" ||
        trace.provenance.claimCeiling !== "SYNTHETIC_MODEL_ONLY") {
      errors.push("provenance must bind the synthetic demo claim ceiling");
    }
    if (!Array.isArray(trace.events) || trace.events.length === 0 || trace.events.length > 5000) {
      errors.push("events must contain 1 to 5000 entries");
      return { ok: false, errors };
    }

    const ids = new Map();
    const branches = new Set();
    let roots = 0;
    let previousTick = -1;
    trace.events.forEach((event, index) => {
      const at = "events[" + index + "]";
      if (!isRecord(event)) {
        errors.push(at + " must be an object");
        return;
      }
      if (typeof event.id !== "string" || !ID.test(event.id)) errors.push(at + ".id must be an ASCII ID");
      if (!isTick(event.tick)) errors.push(at + ".tick must be a non-negative safe integer");
      if (!TYPES.has(event.type)) errors.push(at + ".type is unknown");
      if (typeof event.branch !== "string" || !ID.test(event.branch)) {
        errors.push(at + ".branch must be an ASCII ID");
      }
      if (!Array.isArray(event.parents) || event.parents.some((parent) => typeof parent !== "string" || !ID.test(parent))) {
        errors.push(at + ".parents must be ASCII event IDs");
      }
      if (typeof event.label !== "string" || event.label.length === 0 || event.label.length > 200) {
        errors.push(at + ".label must contain 1 to 200 characters");
      }
      if (isTick(event.tick)) {
        if (event.tick < previousTick) errors.push(at + " is out of tick order");
        previousTick = event.tick;
      }
      if (typeof event.id === "string") {
        if (ids.has(event.id)) errors.push(at + ".id is duplicated");
        else ids.set(event.id, event);
      }
      if (Array.isArray(event.parents)) {
        for (const parentId of event.parents) {
          const parent = ids.get(parentId);
          if (!parent || parent === event) errors.push(at + " references an unseen parent " + parentId);
          else if (isTick(event.tick) && isTick(parent.tick) && parent.tick > event.tick) {
            errors.push(at + " has a parent from a later tick");
          }
        }
      }

      if (event.type === "ROOT") {
        roots += 1;
        if (index !== 0 || event.tick !== 0 || event.branch !== "main" ||
            !Array.isArray(event.parents) || event.parents.length !== 0) {
          errors.push(at + " must be the first event at tick 0 on main without parents");
        }
        branches.add("main");
      } else if (event.type === "BRANCH_CREATED") {
        if (branches.has(event.branch)) errors.push(at + " recreates an existing branch");
        if (!Array.isArray(event.parents) || event.parents.length !== 1) {
          errors.push(at + " must have one parent");
        }
        if (typeof event.branch === "string") branches.add(event.branch);
      } else if (!branches.has(event.branch)) {
        errors.push(at + " uses an unknown branch");
      }

      if (event.type === "OBSERVATION_GAP") {
        if (!isRecord(event.gap) || !isTick(event.gap.fromTick) ||
            !isTick(event.gap.toTick) || event.gap.fromTick > event.gap.toTick ||
            event.gap.toTick !== event.tick ||
            typeof event.gap.reason !== "string" || event.gap.reason.trim() === "") {
          errors.push(at + ".gap must end at its recorded tick and state a reason");
        }
      }
      if (event.type === "MERGE_PROPOSAL") {
        const p = event.proposal;
        if (!isRecord(p) || typeof p.leftBranch !== "string" ||
            typeof p.rightBranch !== "string" || p.leftBranch === p.rightBranch ||
            !branches.has(p.leftBranch) || !branches.has(p.rightBranch) ||
            p.status !== "PROPOSED_ONLY") {
          errors.push(at + ".proposal must name two existing branches and remain PROPOSED_ONLY");
        }
      }
    });
    if (roots !== 1) errors.push("trace must have exactly one root");
    return { ok: errors.length === 0, errors };
  }

  function checkedTrace(trace) {
    const result = validateTrace(trace);
    if (!result.ok) throw new TypeError("Invalid trace: " + result.errors.join("; "));
    return trace;
  }

  /** A bounded model snapshot. Returned objects do not alias the trace. */
  function stateAt(trace, tick) {
    checkedTrace(trace);
    if (!isTick(tick)) throw new RangeError("tick must be a non-negative safe integer");
    const visible = trace.events.filter((event) => event.tick <= tick);
    const branchState = new Map();
    const gaps = [];
    const proposals = [];
    for (const event of visible) {
      if (event.type === "ROOT" || event.type === "BRANCH_CREATED") {
        branchState.set(event.branch, {
          id: event.branch,
          createdAt: event.tick,
          headEventId: event.id,
          lastObservedTick: event.tick
        });
      } else if (event.type === "MODEL_TRANSITION") {
        const branch = branchState.get(event.branch);
        branch.headEventId = event.id;
        branch.lastObservedTick = event.tick;
      } else if (event.type === "OBSERVATION_GAP") {
        gaps.push({
          id: event.id, branch: event.branch,
          fromTick: event.gap.fromTick, toTick: event.gap.toTick,
          reason: event.gap.reason,
          status: event.gap.fromTick <= tick && tick <= event.gap.toTick ? "AT_TICK" : "IN_HISTORY"
        });
      } else if (event.type === "MERGE_PROPOSAL") {
        proposals.push({ eventId: event.id, tick: event.tick, ...clone(event.proposal) });
      }
    }
    const gapAtTick = gaps.filter((gap) => gap.status === "AT_TICK");
    const currentEvents = visible.filter((event) => event.tick === tick);
    const latestRecordedTick = trace.events[trace.events.length - 1].tick;
    let atTick = "NO_EVENT_AT_TICK";
    if (tick > latestRecordedTick) atTick = "AFTER_RECORDED_RANGE";
    else if (gapAtTick.length) atTick = "OBSERVATION_GAP";
    else if (currentEvents.some((event) => event.type === "MERGE_PROPOSAL")) atTick = "PROPOSAL_ONLY";
    else if (currentEvents.length) atTick = "MODEL_EVENT";

    return {
      schema: "halveth.netz.synthetic-state.v1",
      projectId: trace.projectId,
      tick,
      tickUnit: trace.tickUnit,
      synthetic: true,
      claimCeiling: "SYNTHETIC_MODEL_ONLY",
      events: clone(visible),
      branches: Array.from(branchState.values()),
      gaps,
      observation: {
        atTick,
        gapIds: gapAtTick.map((gap) => gap.id),
        hasEarlierGaps: gaps.some((gap) => gap.status === "IN_HISTORY")
      },
      proposals
    };
  }

  /** A proposal only. It neither changes the graph nor proves compatibility. */
  function previewMerge(trace, leftBranch, rightBranch) {
    checkedTrace(trace);
    if (typeof leftBranch !== "string" || typeof rightBranch !== "string" || leftBranch === rightBranch) {
      throw new TypeError("two different branch IDs are required");
    }
    const tick = trace.events[trace.events.length - 1].tick;
    const state = stateAt(trace, tick);
    const left = state.branches.find((branch) => branch.id === leftBranch);
    const right = state.branches.find((branch) => branch.id === rightBranch);
    if (!left || !right) throw new RangeError("branch is not present in trace");
    return {
      schema: "halveth.netz.merge-preview.v1",
      projectId: trace.projectId,
      synthetic: true,
      basedOnTick: tick,
      status: "PREVIEW_ONLY",
      eligibility: "NOT_EVALUATED",
      conflictStatus: "UNKNOWN",
      mutationClass: "NONE",
      rootEventId: trace.events[0].id,
      left: clone(left),
      right: clone(right),
      gapIds: state.gaps.map((gap) => gap.id),
      claimCeiling: "SYNTHETIC_MODEL_ONLY"
    };
  }

  /** Find a path whose contact times never decrease. Equal ticks are allowed. */
  function temporalReachable(contacts, from, to, startTick) {
    if (!Array.isArray(contacts) || contacts.some((contact) => !isRecord(contact) ||
        typeof contact.from !== "string" || contact.from === "" ||
        typeof contact.to !== "string" || contact.to === "" || !isTick(contact.tick))) {
      throw new TypeError("contacts must be an array of {from,to,tick} records");
    }
    if (typeof from !== "string" || from === "" || typeof to !== "string" || to === "") {
      throw new TypeError("from and to must be non-empty strings");
    }
    if (!isTick(startTick)) throw new RangeError("startTick must be a non-negative safe integer");
    if (from === to) return { reachable: true, arrivalTick: startTick, path: [] };

    const ordered = contacts.map((contact, index) => ({ ...contact, index }))
      .sort((a, b) => a.tick - b.tick || a.index - b.index);
    const arrival = new Map([[from, startTick]]);
    const witness = new Map();
    let offset = 0;
    while (offset < ordered.length) {
      const tick = ordered[offset].tick;
      let end = offset;
      while (end < ordered.length && ordered[end].tick === tick) end += 1;
      if (tick >= startTick) {
        let changed;
        do {
          changed = false;
          for (let i = offset; i < end; i += 1) {
            const contact = ordered[i];
            if (arrival.has(contact.from) && arrival.get(contact.from) <= tick &&
                (!arrival.has(contact.to) || tick < arrival.get(contact.to))) {
              arrival.set(contact.to, tick);
              witness.set(contact.to, { from: contact.from, to: contact.to, tick });
              changed = true;
            }
          }
        } while (changed);
      }
      offset = end;
    }
    if (!arrival.has(to)) {
      return { reachable: false, arrivalTick: null, path: [], reason: "NO_TIME_RESPECTING_PATH" };
    }
    const path = [];
    const seen = new Set();
    let node = to;
    while (node !== from) {
      if (seen.has(node) || !witness.has(node)) {
        throw new Error("internal temporal path reconstruction failed");
      }
      seen.add(node);
      const edge = witness.get(node);
      path.push(edge);
      node = edge.from;
    }
    path.reverse();
    return { reachable: true, arrivalTick: arrival.get(to), path };
  }

  return Object.freeze({
    demoTrace,
    validateTrace,
    stateAt,
    previewMerge,
    temporalReachable
  });
});
