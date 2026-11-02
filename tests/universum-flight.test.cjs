'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const flight = require('../universum/flight-model.js');

test('flight model exposes the same API in a browser script context', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'universum', 'flight-model.js'), 'utf8');
  const browser = {};
  vm.runInNewContext(source, browser);
  assert.equal(browser.HALVETH_FLIGHT_MODEL.MAX_TRAVEL, flight.MAX_TRAVEL);
  assert.equal(browser.HALVETH_FLIGHT_MODEL.identity('halveth-scarlet').signature, 'halveth-scarlet');
});

test('scene identity order matches the published project and topic catalog', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'universum', 'data', 'catalog.js'), 'utf8');
  const browser = {window: {}};
  vm.runInNewContext(source, browser);
  const catalog = browser.window.HALVETH_CATALOG;
  const publicIds = Array.from(catalog.projects.filter((project) => project.visibility === 'public'), (project) => project.id);
  const topicIds = Array.from(catalog.categories, (topic) => topic.id);
  assert.deepEqual(publicIds, [...flight.PROJECT_IDS]);
  assert.deepEqual(topicIds, [...flight.TOPIC_IDS]);
});

test('each current project and topic has a stable distinct identity', () => {
  assert.equal(flight.PROJECT_IDS.length, 18);
  assert.equal(flight.TOPIC_IDS.length, 6);
  const projectMarks = flight.PROJECT_IDS.map((id, index) => flight.identity(id, index));
  const topicMarks = flight.TOPIC_IDS.map((id) => flight.topicIdentity(id));
  assert.equal(new Set(projectMarks.map((mark) => mark.glyph)).size, 18);
  assert.equal(new Set(projectMarks.map((mark) => mark.signature)).size, 18);
  assert.equal(new Set(topicMarks.map((mark) => mark.glyph)).size, 6);
  assert.equal(new Set(topicMarks.map((mark) => mark.signature)).size, 6);
  assert.deepEqual(projectMarks.map((mark) => mark.signature), [...flight.PROJECT_IDS]);
  assert.deepEqual(topicMarks.map((mark) => mark.signature), flight.TOPIC_IDS.map((id) => 'topic-' + id));
  assert.throws(() => flight.identity('unlisted-project'), /unknown project/);
  assert.throws(() => flight.topicIdentity('unlisted-topic'), /unknown topic/);
});

test('project and topic world points keep their own IDs and never wrap', () => {
  const projects = flight.PROJECT_IDS.map((_, index) => flight.projectWorld(index));
  const topics = flight.TOPIC_IDS.map((_, index) => flight.topicWorld(index));
  assert.deepEqual(projects.map((point) => point.id), [...flight.PROJECT_IDS]);
  assert.deepEqual(topics.map((point) => point.id), flight.TOPIC_IDS.map((id) => 'topic-' + id));
  assert.equal(new Set([...projects, ...topics].map((point) => point.id)).size, 24);
  assert(projects.every((point, index) => point.z === 40 + index * 11));
  assert(topics.every((point, index) => point.z === 30 + index * 36));
  assert(projects.every((point) => Math.hypot(point.x, point.y) > 2));
  assert(projects.at(-1).z < flight.MAX_TRAVEL);
  for (const width of [320, 390]) {
    for (const point of [...projects.slice(0, 4), ...topics.slice(0, 2)]) {
      const projection = flight.projectPoint(point, 0, width, 430);
      assert(projection.x > 24 && projection.x < width - 24, point.id + ' x at ' + width);
      assert(projection.y > 24 && projection.y < 406, point.id + ' y at ' + width);
    }
  }
  assert.throws(() => flight.projectWorld(18), /project index/);
  assert.throws(() => flight.topicWorld(6), /topic index/);
});

test('camera travel makes a project approach, pass, and reappear at the same projection in reverse', () => {
  const point = flight.projectWorld(5);
  const width = 900, height = 600;
  const far = flight.projectPoint(point, 10, width, height);
  const close = flight.projectPoint(point, point.z - 5, width, height);
  const center = { x: width / 2, y: height / 2 };
  assert(far && close);
  assert(close.depth < far.depth);
  assert(Math.hypot(close.x - center.x, close.y - center.y) > Math.hypot(far.x - center.x, far.y - center.y));
  assert.equal(flight.projectPoint(point, point.z - flight.NEAR_PLANE, width, height), null);
  assert.equal(flight.projectPoint(point, point.z + 3, width, height), null);
  assert.deepEqual(flight.projectPoint(point, 10, width, height), far);
});

test('the optical axis is fixed at screen center and travel is bounded', () => {
  const atAxis = { x: 0, y: 0, z: 80 };
  const projection = flight.projectPoint(atAxis, 10, 1000, 700);
  assert.equal(projection.x, 500);
  assert.equal(projection.y, 350);
  assert.equal(projection.depth, 70);
  assert(Math.abs(projection.scale - Math.min(980, 945) / 70) < 1e-10);
  assert.equal(flight.clampTravel(-8), 0);
  assert.equal(flight.clampTravel(999), flight.MAX_TRAVEL);
  assert.throws(() => flight.clampTravel(Number.NaN), /finite/);
  assert.throws(() => flight.projectPoint(atAxis, 0, 0, 700), /viewport/);
});

test('star and dust points are deterministic with stable identities', () => {
  const a = flight.stars(240, 2718);
  const b = flight.stars(240, 2718);
  assert.deepEqual(a, b);
  assert.equal(new Set(a.map((point) => point.id)).size, 240);
  assert(a.some((point) => point.kind === 'star'));
  assert(a.some((point) => point.kind === 'dust'));
  assert(a.some((point) => point.z > flight.MAX_TRAVEL));
  const point = a[0];
  const first = flight.projectPoint(point, 0, 800, 600);
  assert.deepEqual(flight.projectPoint(point, 0, 800, 600), first);
  assert.throws(() => flight.stars(4001), /star count/);
});
