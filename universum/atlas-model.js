(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HalvethAtlasModel = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CHECKS = Object.freeze(['source', 'tests', 'review', 'provenance', 'security']);
  const CLAIM_CEILING = 'Synthetic phase relationship, not a physical reality-layer transition.';

  function fail(message) { throw new RangeError(message); }

  function halfEven(value) {
    const whole = Math.floor(value);
    const fraction = value - whole;
    return fraction < 0.5 ? whole : fraction > 0.5 ? whole + 1 : whole % 2 === 0 ? whole : whole + 1;
  }

  function periodic(f, tau, sampleRate = 80, duration = 2) {
    if (![f, tau, sampleRate, duration].every(value => typeof value === 'number' && Number.isFinite(value))) {
      fail('Finite numeric phase inputs are required.');
    }
    if (!(f > 0 && f <= 20 && Math.abs(tau) <= 8 && sampleRate > 0 && sampleRate <= 2000 && duration > 0 && duration <= 15)) {
      fail('Phase inputs are outside the bounded ranges.');
    }
    const count = halfEven(sampleRate * duration);
    if (count < 8 || count > 4096) fail('Phase sample count must be between 8 and 4096.');

    const times = Array.from({length: count}, (_, index) => index / sampleRate);
    const reference = times.map(time => Math.sin(2 * Math.PI * f * time));
    const observation = times.map(time => Math.sin(2 * Math.PI * f * (time - tau)));
    const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
    const referenceMean = mean(reference), observationMean = mean(observation);
    const a = reference.map(value => value - referenceMean);
    const b = observation.map(value => value - observationMean);
    const norm = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0) *
      b.reduce((sum, value) => sum + value * value, 0));
    const correlation = norm > 1e-10
      ? a.reduce((sum, value, index) => sum + value * b[index], 0) / norm
      : null;
    const status = sampleRate <= 2 * f || correlation === null
      ? 'INDETERMINATE_SAMPLING'
      : correlation < -0.95 ? 'ANTIPHASE' : correlation > 0.95 ? 'IN_PHASE' : 'PHASE_SHIFTED';
    const phaseDeg = ((360 * f * tau) % 360 + 360) % 360;
    return Object.freeze({
      f_hz: f,
      tau_seconds: tau,
      sample_rate_hz: sampleRate,
      phase_deg: phaseDeg,
      correlation,
      status,
      times: Object.freeze(times),
      reference: Object.freeze(reference),
      observation: Object.freeze(observation),
      claim_ceiling: CLAIM_CEILING
    });
  }

  function gate(candidate, conflicts = []) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate) ||
      (Object.getPrototypeOf(candidate) !== Object.prototype && Object.getPrototypeOf(candidate) !== null)) {
      fail('Gate candidate must be a plain record.');
    }
    const keys = Object.keys(candidate);
    if (keys.length !== CHECKS.length || !CHECKS.every(key => Object.prototype.hasOwnProperty.call(candidate, key)) ||
      keys.some(key => !CHECKS.includes(key))) {
      fail('Gate candidate needs exactly five named checks.');
    }
    if (!CHECKS.every(key => candidate[key] === true || candidate[key] === false || candidate[key] === 'unknown')) {
      fail('Each gate check must be true, false, or unknown.');
    }
    if (!Array.isArray(conflicts) || new Set(conflicts).size !== conflicts.length ||
      !conflicts.every(key => typeof key === 'string' && CHECKS.includes(key))) {
      fail('Conflicts must be unique names from the five gate checks.');
    }
    if (CHECKS.some(key => candidate[key] === false)) return 'DEFLECT';
    if (conflicts.length > 0) return 'RESOLVE';
    if (CHECKS.some(key => candidate[key] === 'unknown')) return 'HOLD';
    return 'MERGE_PROPOSAL_ONLY';
  }

  return Object.freeze({CHECKS, periodic, gate});
}));
