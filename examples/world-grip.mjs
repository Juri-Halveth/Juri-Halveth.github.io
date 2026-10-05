// A local game-state model of ordinary grasping. Coordinates are x/y/z metres;
// rotation is an Euler vector in radians. Rendering and physics integrate separately.
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const clone = value => structuredClone(value);
const freeze = value => {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};
const vector = value => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
const uniqueIds = values => values.every(value => typeof value.id === 'string' && value.id.length > 0)
  && new Set(values.map(value => value.id)).size === values.length;
const canonical = value => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
export const stateDigest = state => createHash('sha256').update(JSON.stringify(canonical(state))).digest('hex');

export function createGripWorld({ hand, objects, surfaces }) {
  if (!hand || typeof hand.id !== 'string' || !hand.id || !vector(hand.position)
      || !Array.isArray(objects) || !uniqueIds(objects)
      || !Array.isArray(surfaces) || !uniqueIds(surfaces)
      || new Set([hand.id, ...objects.map(o => o.id), ...surfaces.map(s => s.id)]).size !== 1 + objects.length + surfaces.length)
    throw new TypeError('Distinct IDs, a hand and explicit object/surface arrays are required');
  for (const object of objects) {
    if (!vector(object.position) || !vector(object.rotation)
        || typeof object.label !== 'string' || typeof object.material !== 'string'
        || !surfaces.some(surface => surface.id === object.supportId))
      throw new TypeError('Every object needs a pose, label, material and declared support');
  }
  const state = { hand: { ...clone(hand), heldObjectId: null }, objects: clone(objects), surfaces: clone(surfaces) };
  return freeze({ schema: 'halveth.ordinary-grip.v1', clock: 'SIMULATION_INPUT_SECONDS', frameId: 'frame-0', time: 0, state, history: [] });
}

// The same object ID survives taking, carrying, turning, looking and placing.
// Each action retains its predecessor and an exact before/after state digest.
export function act(world, action) {
  if (!action || !Number.isFinite(action.at) || action.at < world.time)
    throw new TypeError('An action needs an explicit forward simulation time');
  const state = clone(world.state), hand = state.hand;
  const object = state.objects.find(item => item.id === action.objectId);
  if (action.type !== 'MOVE_HAND' && !object) throw new TypeError('A declared object ID is required');
  switch (action.type) {
    case 'TAKE':
      if (hand.heldObjectId) throw new Error('The hand already carries an object');
      hand.heldObjectId = object.id;
      object.carrierId = hand.id;
      object.supportId = null;
      object.position = [...hand.position];
      break;
    case 'MOVE_HAND': {
      if (!vector(action.position)) throw new TypeError('An explicit finite x/y/z position is required');
      hand.position = [...action.position];
      const carried = state.objects.find(item => item.id === hand.heldObjectId);
      if (carried) carried.position = [...hand.position];
      break;
    }
    case 'TURN':
      if (hand.heldObjectId !== object.id || !vector(action.rotation))
        throw new TypeError('Turning needs the carried object and an explicit finite rotation');
      object.rotation = [...action.rotation];
      break;
    case 'LOOK':
      break;
    case 'PLACE':
      if (hand.heldObjectId !== object.id || !vector(action.position)
          || !state.surfaces.some(surface => surface.id === action.supportId))
        throw new TypeError('Placement needs the carried object, a pose and a declared support');
      hand.heldObjectId = null;
      object.carrierId = null;
      object.supportId = action.supportId;
      object.position = [...action.position];
      break;
    default:
      throw new TypeError('Unknown grasp action');
  }
  const event = {
    id: 'grip-' + (world.history.length + 1), parentFrameId: world.frameId,
    at: action.at, actorId: hand.id, action: clone(action),
    beforeDigest: stateDigest(world.state), afterDigest: stateDigest(state),
  };
  return freeze({ ...world, frameId: 'frame-' + (world.history.length + 1), time: action.at,
    state, history: [...world.history, event] });
}

export function look(world, objectId) {
  const object = world.state.objects.find(item => item.id === objectId);
  if (!object) throw new TypeError('A declared object ID is required');
  return freeze({ object: clone(object), hand: clone(world.state.hand),
    surroundings: { objects: clone(world.state.objects), surfaces: clone(world.state.surfaces) },
    frameId: world.frameId, at: world.time, history: clone(world.history) });
}

export function demo() {
  let world = createGripWorld({ hand: { id: 'hand', position: [0, 1.2, 0] },
    surfaces: [{ id: 'table', label: 'Table' }], objects: [
      { id: 'cup', label: 'Ceramic cup', material: 'ceramic', position: [1, 0.8, 0], rotation: [0, 0, 0], supportId: 'table' },
      { id: 'stone', label: 'Smooth stone', material: 'stone', position: [-1, 0.8, 0], rotation: [0, 0, 0], supportId: 'table' },
    ] });
  for (const action of [
    { type: 'TAKE', objectId: 'cup', at: 1 },
    { type: 'MOVE_HAND', position: [0.1, 1.5, 0.2], at: 2 },
    { type: 'TURN', objectId: 'cup', rotation: [0.2, 0.5, 0], at: 3 },
    { type: 'LOOK', objectId: 'cup', at: 4 },
    { type: 'PLACE', objectId: 'cup', supportId: 'table', position: [0.5, 0.8, 0], at: 5 },
  ]) {
    world = act(world, action);
    const cup = world.state.objects.find(object => object.id === 'cup');
    console.log(JSON.stringify({ frame: world.frameId, action: action.type, id: cup.id, position: cup.position, rotation: cup.rotation, carrier: cup.carrierId, support: cup.supportId }));
  }
  return world;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) demo();
