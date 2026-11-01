import {BOUNDARY, boundaryStateAt, simulateBoundary} from './vendor/field-difference/physics.js';

// A local one-factor comparison of the pinned, dimensionless boundary model.
// Each call reads source functions only. Importing this module runs no model step.
const SOURCE = Object.freeze({
  repository: 'Juri-Halveth/halveth-field-difference-lab',
  commit: '7ed3788aec2593bfbaa4d6433aec8870ccbc4ff7',
  path: 'physics.js',
  sha256: '2064cbd4786274f319c2ac134e2dc9939f6ec4c3cd4fbd2cf475f81450a26aa0',
  license: 'Apache-2.0'
});
export const CLAIM_CEILING = 'PINNED_DIMENSIONLESS_BOUNDARY_MODEL_ONLY';
export const KAPPA_PRESETS = Object.freeze([0, 0.5, 1, 1.4]);
const BASE = Object.freeze({
  ...BOUNDARY,
  initialPosition: Object.freeze([...BOUNDARY.initialPosition]),
  initialVelocity: Object.freeze([...BOUNDARY.initialVelocity])
});
export const CROSSING_TIME = -BASE.initialPosition[0] / BASE.initialVelocity[0];
export const DURATION = BASE.duration;

function freezeDeep(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}
function checkedKappa(kappa) {
  if (typeof kappa !== 'number' || !Number.isFinite(kappa) || !KAPPA_PRESETS.includes(kappa)) {
    throw new RangeError('Selected κ must be one of the four bounded model presets.');
  }
}
function checkedTime(t) {
  if (typeof t !== 'number' || !Number.isFinite(t) || t < 0 || t > DURATION) {
    throw new RangeError('Model t must be finite within 0..7.');
  }
}
function options(kappa) {
  return {
    control: BASE,
    leftOnly: {...BASE, kappaLeft: kappa},
    rightOnly: {...BASE, kappaRight: kappa}
  };
}
function sameState(a, b) {
  return a.t === b.t && a.x === b.x && a.y === b.y &&
    a.vx === b.vx && a.vy === b.vy && a.ax === b.ax && a.ay === b.ay &&
    a.region === b.region && a.crossingTime === b.crossingTime;
}
function checkCommon(states, t) {
  const {control, leftOnly, rightOnly} = states;
  if ([control, leftOnly, rightOnly].some(state =>
    state.t !== t || state.x !== control.x || state.vx !== control.vx ||
    state.crossingTime !== CROSSING_TIME ||
    state.region !== control.region)) {
    throw new TypeError('Pinned boundary source lost the common time, crossing or horizontal path.');
  }
}

/** Evaluate three source paths at exactly the same dimensionless model t. */
export function at(kappa, t) {
  checkedKappa(kappa);
  checkedTime(t);
  const selected = options(kappa);
  const states = {
    control: boundaryStateAt(t, selected.control),
    leftOnly: boundaryStateAt(t, selected.leftOnly),
    rightOnly: boundaryStateAt(t, selected.rightOnly)
  };
  checkCommon(states, t);
  if (t <= CROSSING_TIME && !sameState(states.control, states.rightOnly)) {
    throw new TypeError('Right-side factor changed the source before crossing.');
  }
  if (kappa === BASE.kappaLeft && !sameState(states.control, states.leftOnly)) {
    throw new TypeError('Neutral left factor changed the source.');
  }
  if (kappa === BASE.kappaRight && !sameState(states.control, states.rightOnly)) {
    throw new TypeError('Neutral right factor changed the source.');
  }
  const phase = t < CROSSING_TIME ? 'BEFORE_CROSSING' :
    t === CROSSING_TIME ? 'AT_CROSSING' : 'AFTER_CROSSING';
  return freezeDeep({
    kind: 'FIELD_BOUNDARY_ONE_FACTOR_COMPARISON',
    source: {...SOURCE, model: BASE.model},
    timeBasis: 'DIMENSIONLESS_MODEL_PARAMETER',
    t, phase, crossingTime: CROSSING_TIME, duration: DURATION,
    controls: {
      baseKappaLeft: BASE.kappaLeft,
      baseKappaRight: BASE.kappaRight,
      selectedKappa: kappa,
      leftOnly: 'Change kappaLeft; retain source kappaRight.',
      rightOnly: 'Change kappaRight; retain source kappaLeft.'
    },
    states,
    comparison: {
      leftFullStateMatchesControl: sameState(states.control, states.leftOnly),
      rightFullStateMatchesControl: sameState(states.control, states.rightOnly),
      leftPositionMatchesControl: states.control.x === states.leftOnly.x && states.control.y === states.leftOnly.y,
      rightPositionMatchesControl: states.control.x === states.rightOnly.x && states.control.y === states.rightOnly.y,
      leftDeltaY: states.leftOnly.y - states.control.y,
      rightDeltaY: states.rightOnly.y - states.control.y,
      leftDeltaVy: states.leftOnly.vy - states.control.vy,
      rightDeltaVy: states.rightOnly.vy - states.control.vy
    },
    claimCeiling: CLAIM_CEILING,
    claim: 'Drei berechnete Bahnen desselben gepinnten, dimensionslosen Grenzmodells. Gleiche Zeit und Anfangswerte; je Variante wird genau ein κ-Feld geändert. Keine Messung realer Kräfte oder Orte.'
  });
}

function exactCrossingTrack(sourceOptions) {
  const samples = simulateBoundary(sourceOptions, 0.01);
  const crossing = boundaryStateAt(CROSSING_TIME, sourceOptions);
  const index = samples.findIndex(point => point.t > CROSSING_TIME);
  if (index < 1 || samples[index - 1].t >= CROSSING_TIME ||
      samples.some(point => point.t === CROSSING_TIME)) {
    throw new TypeError('Pinned sample grid no longer brackets the exact boundary crossing.');
  }
  samples.splice(index, 0, crossing);
  return samples;
}

/** Fixed-size source paths plus one exact source-computed crossing sample. */
export function trajectories(kappa) {
  checkedKappa(kappa);
  const selected = options(kappa);
  const control = exactCrossingTrack(selected.control);
  const leftOnly = exactCrossingTrack(selected.leftOnly);
  const rightOnly = exactCrossingTrack(selected.rightOnly);
  if (control.length !== 702 || leftOnly.length !== control.length ||
      rightOnly.length !== control.length ||
      control.some((point, index) => point.t !== leftOnly[index].t || point.t !== rightOnly[index].t)) {
    throw new TypeError('Pinned boundary tracks lost aligned sample times.');
  }
  return freezeDeep({
    kind: 'FIELD_BOUNDARY_ONE_FACTOR_TRAJECTORIES',
    source: {...SOURCE, model: BASE.model},
    timeBasis: 'DIMENSIONLESS_MODEL_PARAMETER',
    kappa, crossingTime: CROSSING_TIME, duration: DURATION,
    countPerTrack: control.length,
    tracks: {control, leftOnly, rightOnly},
    claimCeiling: CLAIM_CEILING
  });
}
