'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const workshop = require('../universum/workshop.js');

const recordedAt = '2026-11-01T00:00:00.000Z';

function fork(state) {
  return workshop.dispatch(state, {
    branchId: 'a1_main',
    label: 'Local synthetic branch',
    recordedAt,
    type: 'FORK'
  });
}

test('sequential workshop branch IDs remain valid from b2 through the 32-branch limit', () => {
  let state = workshop.create('sample', 'Local synthetic action', recordedAt);
  for (let number = 2; number <= workshop.limits.branches; number += 1) {
    const before = state;
    state = fork(state);
    assert.equal(state.events.at(-1).branchId, `a1_b${number}`);
    assert.deepEqual(state.events.slice(0, -1), before.events);
    assert.equal(workshop.inspect(state).branches.length, number);
  }
  assert.equal(workshop.project(state, state.events.length - 1).branches.at(-1).id, 'a1_b32');
  assert.throws(() => fork(state), /Cannot fork this branch/);
});

test('workshop replay rejects malformed branch IDs without changing the accepted prefix', () => {
  let state = workshop.create('sample', 'Local synthetic action', recordedAt);
  for (let number = 2; number <= 10; number += 1) state = fork(state);
  for (const branchId of ['a1_b1', 'a1_b01', 'a1_b010', 'a1_b0']) {
    const invalid = {
      ...state,
      events: [...state.events.slice(0, -1), {...state.events.at(-1), branchId}]
    };
    assert.throws(() => workshop.inspect(invalid), /Invalid event|Invalid branch creation/, branchId);
    assert.equal(state.events.at(-1).branchId, 'a1_b10');
  }
});
