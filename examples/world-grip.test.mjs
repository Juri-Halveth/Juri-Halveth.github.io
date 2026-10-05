import test from 'node:test';
import assert from 'node:assert/strict';
import { createGripWorld, act, look, stateDigest } from './world-grip.mjs';

const source = () => ({ hand: { id: 'hand', position: [0, 1.2, 0] },
  surfaces: [{ id: 'table', label: 'Table' }], objects: [
    { id: 'cup', label: 'Cup', material: 'ceramic', position: [1, 0.8, 0], rotation: [0, 0, 0], supportId: 'table' },
    { id: 'stone', label: 'Stone', material: 'stone', position: [-1, 0.8, 0], rotation: [0, 0, 0], supportId: 'table' },
  ] });
const take = world => act(world, { type: 'TAKE', objectId: 'cup', at: 1 });
const cup = world => world.state.objects.find(item => item.id === 'cup');

test('ordinary taking works while source and previous world states remain intact', () => {
  const input = source(), original = structuredClone(input), world = createGripWorld(input), next = take(world);
  assert.deepEqual(input, original); assert.equal(world.state.hand.heldObjectId, null);
  assert.equal(next.state.hand.heldObjectId, 'cup'); assert.equal(cup(next).carrierId, 'hand');
  assert.equal(cup(next).supportId, null); assert.equal(cup(next).id, cup(world).id);
});
test('carrying moves the object with the hand while preserving its material and surroundings', () => {
  const world = take(createGripWorld(source())), next = act(world, { type: 'MOVE_HAND', position: [0.1, 1.5, 0.2], at: 2 });
  assert.deepEqual(cup(next).position, next.state.hand.position);
  assert.equal(cup(next).material, 'ceramic');
  assert.deepEqual(next.state.objects[1], world.state.objects[1]);
});
test('turning changes pose while retaining the object identity', () => {
  const world = take(createGripWorld(source())), next = act(world, { type: 'TURN', objectId: 'cup', rotation: [0.2, 0.5, 0], at: 2 });
  assert.notEqual(stateDigest(world.state), stateDigest(next.state));
  assert.equal(cup(world).id, cup(next).id); assert.deepEqual(cup(world).rotation, [0, 0, 0]);
});
test('looking retains the whole context and records an observation without changing the object state', () => {
  const world = take(createGripWorld(source())), next = act(world, { type: 'LOOK', objectId: 'cup', at: 2 }), view = look(next, 'cup');
  assert.equal(stateDigest(next.state), stateDigest(world.state));
  assert.equal(view.object.id, 'cup'); assert.equal(view.hand.heldObjectId, 'cup');
  assert.equal(view.surroundings.objects.length, 2); assert.equal(view.history.length, 2);
});
test('placing and taking again preserve the same object and the full transition chain', () => {
  const first = take(createGripWorld(source()));
  const placed = act(first, { type: 'PLACE', objectId: 'cup', position: [0.5, 0.8, 0], supportId: 'table', at: 2 });
  const again = act(placed, { type: 'TAKE', objectId: 'cup', at: 3 });
  assert.equal(placed.state.hand.heldObjectId, null); assert.equal(cup(placed).supportId, 'table');
  assert.equal(cup(again).id, 'cup'); assert.equal(again.history.length, 3);
  assert.equal(again.history[2].beforeDigest, again.history[1].afterDigest);
  assert.equal(again.history[2].parentFrameId, placed.frameId);
});
test('invalid actions preserve the predecessor instead of moving an unrelated object', () => {
  const world = take(createGripWorld(source())), before = structuredClone(world);
  for (const action of [
    { type: 'TAKE', objectId: 'stone', at: 2 },
    { type: 'TURN', objectId: 'stone', rotation: [0, 0, 0], at: 2 },
    { type: 'MOVE_HAND', position: [NaN, 1, 0], at: 2 },
    { type: 'PLACE', objectId: 'cup', position: [0, 0, 0], supportId: 'unknown', at: 2 },
    { type: 'LOOK', objectId: 'cup', at: -1 },
  ]) assert.throws(() => act(world, action));
  assert.deepEqual(world, before);
});
test('duplicate IDs and undeclared support are rejected before a world is created', () => {
  const duplicate = source(); duplicate.objects[1].id = 'cup'; assert.throws(() => createGripWorld(duplicate));
  const support = source(); support.objects[0].supportId = 'unknown'; assert.throws(() => createGripWorld(support));
});
