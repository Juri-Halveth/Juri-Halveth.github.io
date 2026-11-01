import {
  TICKS, SCENARIOS, COPY_GRAPH, frameAt, compareScenarios
} from './vendor/red-room/assets/red-room-swarm-model.mjs';

// Original local view-model for the pinned, fictional SCARLET source module.
// It has no DOM, storage, network, identity lookup, or external action path.
const SOURCE = Object.freeze({
  repository: 'Juri-Halveth/halveth-scarlet',
  commit: '6913b81d3e2414b20149406cb3e2fe9bb314adf4',
  path: 'assets/red-room-swarm-model.mjs',
  claimCeiling: 'PINNED_SYNTHETIC_SOURCE_AND_LOCAL_TEST_ONLY'
});
const LABELS = Object.freeze({
  archive: 'Archivdaten ohne Träger',
  blocked: 'Träger ohne Modellautorität',
  active: 'Fiktiver aktiver Modellzweig',
  erased: 'Ohne behaltene Vorlage'
});
const CHALLENGE = Object.freeze({
  NOT_RUN: 'Vor diesem Modelltick ist keine Probe definiert.',
  LOCAL_EXECUTION_WITNESS: 'Im fiktionalen Modell antworten Kopien.',
  NO_LOCAL_RESPONSE: 'Im fiktionalen Modell antwortet keine Kopie.'
});

export const MODEL_TICKS = Object.freeze([...TICKS]);
export const SCENARIO_CHOICES = Object.freeze(Object.keys(SCENARIOS).map(id =>
  Object.freeze({id, label: LABELS[id]})));

function assert(condition, message) {
  if (!condition) throw new RangeError(message);
}

function plain(value) {
  return value && typeof value === 'object' && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function validScenario(id) {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(SCENARIOS, id);
}

function validTick(tick) {
  return Number.isInteger(tick) && MODEL_TICKS.includes(tick);
}

function validateSelection(selection) {
  assert(plain(selection), 'Selection must be a plain object.');
  assert(Object.keys(selection).length === 3 &&
    ['scenarioId', 'compareId', 'tick'].every(key => Object.prototype.hasOwnProperty.call(selection, key)),
  'Selection fields are invalid.');
  assert(validScenario(selection.scenarioId), 'Unknown fictional scenario.');
  assert(validScenario(selection.compareId), 'Unknown fictional comparison scenario.');
  assert(validTick(selection.tick), 'Tick must be one of the bounded model ticks.');
}

export function createSelection(options = {}) {
  assert(plain(options), 'Options must be a plain object.');
  assert(Object.keys(options).every(key => ['scenarioId', 'compareId', 'tick'].includes(key)), 'Unknown selection option.');
  const selection = {
    scenarioId: options.scenarioId === undefined ? 'archive' : options.scenarioId,
    compareId: options.compareId === undefined ? 'active' : options.compareId,
    tick: options.tick === undefined ? MODEL_TICKS[0] : options.tick
  };
  validateSelection(selection);
  return Object.freeze(selection);
}

export function reduceSelection(selection, action) {
  validateSelection(selection);
  assert(plain(action) && typeof action.type === 'string', 'Action must be a plain object with type.');
  let next;
  if (action.type === 'SELECT_SCENARIO') {
    assert(Object.keys(action).length === 2 && Object.prototype.hasOwnProperty.call(action, 'scenarioId'), 'Invalid scenario action.');
    next = {...selection, scenarioId: action.scenarioId};
  } else if (action.type === 'SELECT_COMPARISON') {
    assert(Object.keys(action).length === 2 && Object.prototype.hasOwnProperty.call(action, 'compareId'), 'Invalid comparison action.');
    next = {...selection, compareId: action.compareId};
  } else if (action.type === 'SET_TICK') {
    assert(Object.keys(action).length === 2 && Object.prototype.hasOwnProperty.call(action, 'tick'), 'Invalid tick action.');
    next = {...selection, tick: action.tick};
  } else if (action.type === 'STEP') {
    assert(Object.keys(action).length === 2 && (action.direction === 1 || action.direction === -1), 'Step direction must be +1 or -1.');
    const index = MODEL_TICKS.indexOf(selection.tick) + action.direction;
    assert(index >= 0 && index < MODEL_TICKS.length, 'Step exceeds the bounded model timeline.');
    next = {...selection, tick: MODEL_TICKS[index]};
  } else {
    throw new RangeError('Unknown Red Room action.');
  }
  validateSelection(next);
  return Object.freeze(next);
}

function freezeDeep(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
}

export function view(selection) {
  validateSelection(selection);
  const frame = frameAt(selection.scenarioId, selection.tick);
  const comparison = compareScenarios(selection.scenarioId, selection.compareId, selection.tick);
  const graph = Object.entries(COPY_GRAPH).map(([id, targets]) => ({id, targets: [...targets]}));
  return freezeDeep({
    status: 'FICTIONAL_LOCAL_MODEL_ONLY',
    source: {...SOURCE},
    timeBasis: 'DISCRETE_MODEL_TICK_NOT_HISTORICAL_TIME',
    controls: {
      scenarioChoices: SCENARIO_CHOICES.map(choice => ({...choice})),
      ticks: [...MODEL_TICKS],
      selection: {...selection}
    },
    selectedFrame: {
      scenarioId: frame.scenarioId,
      tick: frame.tick,
      sourceStatus: frame.status,
      fictionalRoles: {inRoom: frame.people.inRoom, free: frame.people.free},
      data: {...frame.data},
      runtime: {
        carrierAvailable: frame.runtime.carrierAvailable,
        authorityAvailable: frame.runtime.authorityAvailable,
        routeAvailable: frame.runtime.routeAvailable,
        activeCopies: frame.runtime.activeCopies,
        copyPositions: [...frame.runtime.activeIds],
        challenge: {code: frame.runtime.challenge, label: CHALLENGE[frame.runtime.challenge]}
      }
    },
    comparison: {
      leftId: comparison.leftId,
      rightId: comparison.rightId,
      tick: comparison.tick,
      samePublicEchoes: comparison.samePublicEchoes,
      sameActiveCopies: comparison.sameActiveCopies,
      firstInternalDivergenceTick: comparison.firstInternalDivergence,
      firstEchoDivergenceTick: comparison.firstEchoDivergence,
      oracle: comparison.oracle,
      sourceStatus: comparison.status
    },
    graph: {label: 'Sechs erfundene Modellpositionen, keine Hosts oder Netzwerktopologie.', nodes: graph},
    claimCeiling: 'Fiktionale, lokal berechnete Modellwerte. Keine Aussage über reale Personen, Systeme oder Ausführung.'
  });
}
