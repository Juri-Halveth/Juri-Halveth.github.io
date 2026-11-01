// Copyright 2026 Juri Janovski. SPDX-License-Identifier: Apache-2.0
// Field Difference Lab — deterministic, dimensionless model functions.
export const CENTRAL = Object.freeze({
  model: 'SOFTENED_CENTRAL_FIELD', mu: 1, epsilon: 0.05,
  initialPosition: [1, 0], initialVelocity: [0, 0.72], duration: 3.3, dt: 0.01,
});

export const BOUNDARY = Object.freeze({
  model: 'PIECEWISE_UNIFORM_VERTICAL_FIELD', g: 0.45,
  initialPosition: [-2, 1.3], initialVelocity: [0.65, 0.7],
  kappaLeft: 0, kappaRight: 1.4, duration: 7,
});

function finite(value, label) {
  if (!Number.isFinite(value)) throw new TypeError(`${label} must be finite`);
}

export function centralAcceleration([x, y], kappa, mu = 1, epsilon = 0.05) {
  [x, y, kappa, mu, epsilon].forEach((v, i) => finite(v, `central input ${i}`));
  if (mu <= 0 || epsilon <= 0) throw new RangeError('mu and epsilon must be positive');
  const scale = -(1 - kappa) * mu / Math.pow(x * x + y * y + epsilon * epsilon, 1.5);
  return [scale * x, scale * y];
}

export function simulateCentral(kappa, options = CENTRAL) {
  finite(kappa, 'kappa');
  const {mu, epsilon, initialPosition, initialVelocity, duration, dt} = options;
  [mu, epsilon, duration, dt, ...initialPosition, ...initialVelocity].forEach((v, i) => finite(v, `central option ${i}`));
  const steps = Math.round(duration / dt);
  if (duration <= 0 || dt <= 0 || steps < 1 || steps > 1_000_000 ||
      Math.abs(steps * dt - duration) > 1e-9 * Math.max(1, duration)) {
    throw new RangeError('duration/dt must be a positive integer');
  }
  let [x, y] = initialPosition;
  let [vx, vy] = initialVelocity;
  let [ax, ay] = centralAcceleration([x, y], kappa, mu, epsilon);
  const result = [{t: 0, x, y, vx, vy, ax, ay}];
  for (let i = 1; i <= steps; i++) {
    x += vx * dt + 0.5 * ax * dt * dt;
    y += vy * dt + 0.5 * ay * dt * dt;
    const [nextAx, nextAy] = centralAcceleration([x, y], kappa, mu, epsilon);
    vx += 0.5 * (ax + nextAx) * dt;
    vy += 0.5 * (ay + nextAy) * dt;
    ax = nextAx;
    ay = nextAy;
    result.push({t: i * dt, x, y, vx, vy, ax, ay});
  }
  return result;
}

export function boundaryStateAt(t, options = BOUNDARY) {
  finite(t, 't');
  if (t < 0) throw new RangeError('t must be nonnegative');
  const {g, initialPosition: [x0, y0], initialVelocity: [vx0, vy0], kappaLeft, kappaRight} = options;
  [g, x0, y0, vx0, vy0, kappaLeft, kappaRight].forEach((v, i) => finite(v, `boundary option ${i}`));
  if (vx0 <= 0 || x0 >= 0 || g <= 0) throw new RangeError('model requires left-to-right crossing and positive g');
  const crossingTime = -x0 / vx0;
  const aLeft = -g * (1 - kappaLeft);
  const aRight = -g * (1 - kappaRight);
  if (t <= crossingTime) {
    return {t, x: x0 + vx0 * t, y: y0 + vy0 * t + 0.5 * aLeft * t * t,
      vx: vx0, vy: vy0 + aLeft * t, ax: 0, ay: aLeft,
      region: 'LEFT', crossingTime};
  }
  const tau = t - crossingTime;
  const yCross = y0 + vy0 * crossingTime + 0.5 * aLeft * crossingTime ** 2;
  const vyCross = vy0 + aLeft * crossingTime;
  return {t, x: x0 + vx0 * t, y: yCross + vyCross * tau + 0.5 * aRight * tau ** 2,
    vx: vx0, vy: vyCross + aRight * tau, ax: 0, ay: aRight,
    region: 'RIGHT', crossingTime};
}

export function simulateBoundary(options = BOUNDARY, dt = 0.01) {
  finite(dt, 'dt');
  finite(options.duration, 'duration');
  if (dt <= 0 || options.duration <= 0) throw new RangeError('dt and duration must be positive');
  const samples = [];
  const steps = Math.ceil(options.duration / dt);
  if (steps > 1_000_000) throw new RangeError('too many boundary samples');
  for (let i = 0; i < steps; i++) {
    samples.push(boundaryStateAt(i * dt, options));
  }
  samples.push(boundaryStateAt(options.duration, options));
  return samples;
}
