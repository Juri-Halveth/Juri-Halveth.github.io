'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '../docs/review/2026-10-27');
const expectedZip = '7124f2b958f5bbbefe1d6554c98b8b9e7bc8b392ae8c2ee799e4ddf1366e5613';

test('the public checksum anchor binds the actual unchanged ZIP and published receipt bytes', () => {
  const lines = fs.readFileSync(path.join(root, 'SHA256SUMS.txt'), 'utf8').trimEnd().split('\n');
  assert.equal(lines.length, 2);
  const names = new Set();
  for (const line of lines) {
    const match = /^([a-f0-9]{64}) {2}([A-Za-z0-9_.-]+)$/.exec(line);
    assert.ok(match, 'Canonical checksum line required');
    const [, expected, name] = match;
    assert.equal(names.has(name), false);
    names.add(name);
    const actual = createHash('sha256').update(fs.readFileSync(path.join(root, name))).digest('hex');
    assert.equal(actual, expected, `${name}: bind canonical repository bytes, including line endings`);
    if (name.endsWith('.zip')) assert.equal(actual, expectedZip);
  }
  assert.deepEqual([...names].sort(), ['HALVETH_PRUEFPAKET_20261027.zip', 'LIVE_OBSERVATION_a0dd6c81.json']);
});
