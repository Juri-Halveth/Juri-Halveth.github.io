// Copyright 2026 Juri Janovski. SPDX-License-Identifier: Apache-2.0
// One declared synthetic state, observed through four different projections.

export const VIEW_NAMES = Object.freeze(['eye', 'vortex', 'corridor', 'thrust']);

function finite(value, label) {
  if (!Number.isFinite(value)) throw new TypeError(`${label} must be finite`);
}

function noise(n) {
  const x = Math.sin(n * 127.1 + 78.233) * 43758.5453123;
  return x - Math.floor(x);
}

export function makeState(time = 0, controls = {}) {
  finite(time, 'time');
  if (time < 0 || time > 20) throw new RangeError('time must be in [0, 20]');
  const inward = controls.inward ?? 0.55;
  const swirl = controls.swirl ?? 0.8;
  const axial = controls.axial ?? 0.5;
  for (const [name, value] of Object.entries({inward, swirl, axial})) {
    finite(value, name);
    if (value < 0 || value > 2) throw new RangeError(`${name} must be in [0, 2]`);
  }
  const points = [];
  for (let id = 0; id < 240; id++) {
    const u = noise(id + 1);
    const v = noise(id + 481);
    const w = noise(id + 977);
    const initialRadius = 0.2 + 1.55 * Math.sqrt(u);
    const radius = initialRadius * Math.exp(-0.16 * inward * time);
    const angle = 2 * Math.PI * v + (0.35 + swirl / (0.28 + initialRadius)) * time;
    // z is periodic only for display. IDs, initial parameters and dynamics remain shared.
    const z = ((2.6 * w + axial * time * (0.15 + 0.65 / (0.35 + initialRadius))) % 2.6) - 1.3;
    points.push(Object.freeze({id, x: radius * Math.cos(angle), y: radius * Math.sin(angle), z,
      radius, initialRadius, brightness: 0.45 + 0.55 * noise(id + 1500)}));
  }
  return Object.freeze({time, controls: Object.freeze({inward, swirl, axial}), points: Object.freeze(points)});
}

export function observe(state, view) {
  if (!VIEW_NAMES.includes(view)) throw new RangeError('unknown view');
  return state.points.map(point => {
    const {x, y, z} = point;
    let px, py, depth;
    if (view === 'eye') {
      px = x; py = y; depth = z;
    } else if (view === 'vortex') {
      px = 0.82 * x + 0.57 * z;
      py = 0.32 * x - 0.46 * z + 0.83 * y;
      depth = -0.47 * x + 0.69 * z + 0.55 * y;
    } else if (view === 'corridor') {
      const scale = 1.2 / (2.6 - z);
      px = x * scale; py = y * scale; depth = z;
    } else {
      px = z; py = y; depth = x;
    }
    return {id: point.id, x: px, y: py, depth, brightness: point.brightness};
  });
}

export function independentCountermodel(state, view) {
  const index = VIEW_NAMES.indexOf(view);
  if (index < 0) throw new RangeError('unknown view');
  // Similar-looking picture; labels now point to unrelated world points.
  return observe(state, view).map((point, i, all) => ({...point, id: all[(i + 17 * (index + 1)) % all.length].id}));
}

export function distance3D(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
