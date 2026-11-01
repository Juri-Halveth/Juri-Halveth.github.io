import { IDs, source, project } from './vendor/endeck/model.mjs';

export const CLAIM_CEILING = 'LOCAL_ENDECK_GEOMETRIC_PATH_COUNTERMODEL_ONLY';
export const SOURCE_COMMIT = '2cb8eb38e4276b0b821731d4f1056cd06a8b8631';

function freezeDeep(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}

function verifyIds(points, axes, label) {
  if (!Array.isArray(points) || points.length !== IDs.length ||
      points.some((point, index) => !point || point.id !== IDs[index] ||
        axes.some(axis => !Number.isFinite(point[axis])))) {
    throw new TypeError(`${label} lost a bound ENDECK ID or coordinate.`);
  }
}

function samePoints(left, right, axes) {
  return left.length === right.length && left.every((point, index) =>
    point.id === right[index].id && axes.every(axis => Object.is(point[axis], right[index][axis])));
}

function distance(left, right, axes) {
  return Math.max(...left.map((point, index) =>
    Math.hypot(...axes.map(axis => point[axis] - right[index][axis]))));
}

function at(time, angle, path) {
  const origin = source('history', time, path);
  verifyIds(origin, ['x', 'y', 'z'], `${path} source`);
  const observed = origin.map(point => project(point, angle));
  verifyIds(observed, ['x', 'y'], `${path} projection`);
  return {source: origin, projection: observed};
}

/** Compare two source-defined geometry paths at the same model t and camera angle. */
export function pair(t, angle) {
  if (!Number.isFinite(t) || t < 0 || t > 1 || !Number.isFinite(angle) || angle < 0 || angle > 80) {
    throw new RangeError('ENDECK model time must be 0..1 and camera angle 0..80 degrees.');
  }
  const straight = at(t, angle, 'straight');
  const arc = at(t, angle, 'arc');
  const startStraight = at(0, angle, 'straight');
  const startArc = at(0, angle, 'arc');
  const endStraight = at(1, angle, 'straight');
  const endArc = at(1, angle, 'arc');
  const endpointAgreement = {
    atZero: {
      source: samePoints(startStraight.source, startArc.source, ['x', 'y', 'z']),
      projection: samePoints(startStraight.projection, startArc.projection, ['x', 'y'])
    },
    atOne: {
      source: samePoints(endStraight.source, endArc.source, ['x', 'y', 'z']),
      projection: samePoints(endStraight.projection, endArc.projection, ['x', 'y'])
    }
  };
  if (!endpointAgreement.atZero.source || !endpointAgreement.atZero.projection ||
      !endpointAgreement.atOne.source || !endpointAgreement.atOne.projection) {
    throw new TypeError('The pinned ENDECK path endpoints no longer agree.');
  }
  const sourceDiffers = !samePoints(straight.source, arc.source, ['x', 'y', 'z']);
  const projectionDiffers = !samePoints(straight.projection, arc.projection, ['x', 'y']);
  const intermediate = t > 0 && t < 1;
  const maxSourceDistance = distance(straight.source, arc.source, ['x', 'y', 'z']);
  const maxProjectedDistance = distance(straight.projection, arc.projection, ['x', 'y']);
  const displayResolution = 0.01;
  return freezeDeep({
    kind: 'ENDECK_GEOMETRIC_PATH_PAIR',
    modelMode: 'history',
    t,
    timeBasis: 'NORMALIZED_MODEL_PARAMETER',
    angleDegrees: angle,
    ids: [...IDs],
    straight,
    arc,
    endpointAgreement,
    difference: {
      intermediate,
      sourceDiffers,
      projectionDiffers,
      maxSourceDistance,
      maxProjectedDistance,
      displayResolution,
      precisionLimited: intermediate && (maxSourceDistance < displayResolution / 2 || maxProjectedDistance < displayResolution / 2)
    },
    sourceCommit: SOURCE_COMMIT,
    claimCeiling: CLAIM_CEILING,
    claim: 'Zwei Pfade desselben gepinnten lokalen ENDECK-Geometriemodells. Gleiche Endpunkte belegen weder gleiche Zwischenwege noch eine öffentliche Projekt- oder Git-Historie.'
  });
}
