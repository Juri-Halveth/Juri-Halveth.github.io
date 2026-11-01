(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HalvethMissions = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SCHEMA = 'halveth.starship.missions.v1';
  const PROJECT_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/;
  const STAGES = ['NEW', 'ACTIVE', 'DONE'];
  const EVENT_CODES = ['MISSION_CREATED', 'COUNTERPART_CREATED', 'PAIR_STARTED', 'PAIR_RESOLVED'];
  const ACTION_TYPES = ['CREATE_COUNTERPART', 'START_PAIR', 'RESOLVE_PAIR'];

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function validTitle(value) {
    return typeof value === 'string' && value.trim().length > 0 && value.length <= 120;
  }

  function validateState(state) {
    assert(state && typeof state === 'object' && !Array.isArray(state), 'Mission state must be an object.');
    assert(state.schema === SCHEMA, 'Mission schema mismatch.');
    assert(typeof state.projectId === 'string' && PROJECT_ID.test(state.projectId), 'Invalid project ID.');
    assert(Number.isInteger(state.revision) && state.revision >= 0 && state.revision <= 3, 'Invalid revision.');
    assert(Array.isArray(state.items) && state.items.length === (state.revision === 0 ? 1 : 2), 'Invalid item count.');
    assert(Array.isArray(state.journal) && state.journal.length === state.revision + 1, 'Invalid journal length.');
    assert(state.nextNumber === state.items.length + 1 && state.nextSequence === state.journal.length + 1, 'Invalid counters.');

    const mission = state.items[0];
    const counterpart = state.items[1] || null;
    assert(mission && mission.id === 'P-000001' && mission.kind === 'MISSION' && validTitle(mission.title), 'Invalid mission item.');
    assert(STAGES.includes(mission.stage), 'Invalid mission stage.');
    if (!counterpart) {
      assert(mission.linkedId === null && mission.stage === 'NEW', 'Unpaired mission state is inconsistent.');
    } else {
      assert(counterpart.id === 'C-000002' && counterpart.kind === 'COUNTERPART' && validTitle(counterpart.title), 'Invalid counterpart item.');
      assert(counterpart.linkedId === mission.id && mission.linkedId === counterpart.id, 'Pair links are not reciprocal.');
      const expected = state.revision === 1 ? 'NEW' : state.revision === 2 ? 'ACTIVE' : 'DONE';
      assert(mission.stage === expected && counterpart.stage === expected, 'Pair stages are inconsistent.');
    }

    for (let index = 0; index < state.journal.length; index += 1) {
      const event = state.journal[index];
      const expectedIds = index === 0 ? [mission.id] : [mission.id, counterpart.id];
      assert(event && event.sequence === index + 1 && event.code === EVENT_CODES[index], 'Invalid journal sequence.');
      assert(Array.isArray(event.ids) && event.ids.length === expectedIds.length &&
        event.ids.every((id, offset) => id === expectedIds[offset]), 'Invalid journal IDs.');
    }
  }

  function create(projectId, title) {
    assert(typeof projectId === 'string' && PROJECT_ID.test(projectId), 'Invalid project ID.');
    assert(validTitle(title), 'Mission title must contain 1 to 120 characters.');
    return {
      schema: SCHEMA,
      projectId,
      revision: 0,
      nextNumber: 2,
      nextSequence: 2,
      items: [{id: 'P-000001', kind: 'MISSION', title, stage: 'NEW', linkedId: null}],
      journal: [{sequence: 1, code: 'MISSION_CREATED', ids: ['P-000001']}]
    };
  }

  function dispatch(state, action) {
    validateState(state);
    assert(action && typeof action === 'object' && !Array.isArray(action), 'Action must be an object.');
    assert(ACTION_TYPES.includes(action.type), 'Unknown mission action.');
    const allowed = action.type === 'CREATE_COUNTERPART'
      ? ['type', 'missionId', 'title']
      : ['type', 'missionId', 'counterpartId'];
    assert(Object.keys(action).every(key => allowed.includes(key)), 'Unexpected action field.');
    assert(action.missionId === state.items[0].id, 'Mission ID mismatch.');
    const next = {
      ...state,
      items: state.items.map(item => ({...item})),
      journal: state.journal.map(event => ({...event, ids: [...event.ids]}))
    };
    const mission = next.items[0];
    let code;

    if (action.type === 'CREATE_COUNTERPART') {
      assert(state.revision === 0, 'Counterpart already exists.');
      const title = action.title === undefined ? 'Gegenprüfung' : action.title;
      assert(validTitle(title), 'Counterpart title must contain 1 to 120 characters.');
      const counterpart = {id: 'C-000002', kind: 'COUNTERPART', title, stage: 'NEW', linkedId: mission.id};
      mission.linkedId = counterpart.id;
      next.items.push(counterpart);
      next.nextNumber += 1;
      code = 'COUNTERPART_CREATED';
    } else {
      const counterpart = next.items[1];
      assert(counterpart && action.counterpartId === counterpart.id, 'Counterpart ID mismatch.');
      if (action.type === 'START_PAIR') {
        assert(state.revision === 1, 'Pair can start only from NEW.');
        mission.stage = 'ACTIVE';
        counterpart.stage = 'ACTIVE';
        code = 'PAIR_STARTED';
      } else {
        assert(state.revision === 2, 'Pair can resolve only from ACTIVE.');
        mission.stage = 'DONE';
        counterpart.stage = 'DONE';
        code = 'PAIR_RESOLVED';
      }
    }

    next.revision += 1;
    const ids = next.items.map(item => item.id);
    next.journal.push({sequence: next.nextSequence, code, ids});
    next.nextSequence += 1;
    validateState(next);
    return next;
  }

  function previewPair(state) {
    validateState(state);
    const mission = state.items[0];
    const counterpart = state.items[1] || null;
    return {
      projectId: state.projectId,
      mission: {id: mission.id, title: mission.title, stage: mission.stage},
      counterpart: counterpart ? {id: counterpart.id, title: counterpart.title, stage: counterpart.stage} : null,
      relation: counterpart ? 'LINKED' : 'UNPAIRED',
      nextAction: ['CREATE_COUNTERPART', 'START_PAIR', 'RESOLVE_PAIR', null][state.revision],
      revision: state.revision
    };
  }

  return {create, dispatch, previewPair};
}));
