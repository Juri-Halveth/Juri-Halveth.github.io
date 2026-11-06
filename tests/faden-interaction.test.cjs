'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {webcrypto} = require('node:crypto');
const {JSDOM} = require('jsdom');
const {fromSpace} = require('../universum/relation-model.js');
const root = path.join(__dirname, '..', 'universum');
const source = require('../universum/api/space.json');

async function waitFor(predicate) {
  const deadline = Date.now() + 5000;
  while (!predicate() && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 10));
  assert.ok(predicate(), 'expected UI state before timeout');
}

async function fixture(t) {
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'faden/index.html'), 'utf8'), {
    url: 'https://juri-halveth.github.io/universum/faden/', runScripts: 'outside-only'
  });
  t.after(() => dom.window.close());
  const {window} = dom;
  const document = window.document;
  const style = document.createElement('style');
  style.textContent = fs.readFileSync(path.join(root, 'faden/style.css'), 'utf8');
  document.head.append(style);
  const state = {width: 1400, height: 700, index: structuredClone(source), arcs: [], pending: null};
  const drawing = {
    setTransform() {}, measureText(value) { return {width: value.length * 7}; },
    createLinearGradient() { return {addColorStop() {}}; }, beginPath() {}, moveTo() {},
    lineTo() {}, stroke() {}, arc(x, y, radius) { state.arcs.push({x, y, radius}); },
    fill() {}, fillRect() {}, fillText() {}
  };
  window.HTMLCanvasElement.prototype.getContext = () => drawing;
  document.querySelector('.stage').getBoundingClientRect = () => ({width: state.width, height: state.height});
  document.querySelector('.stage').scrollIntoView = () => {};
  window.matchMedia = () => ({matches: true});
  Object.defineProperty(window.crypto, 'subtle', {value: webcrypto.subtle});
  window.requestAnimationFrame = callback => { state.frame = callback; return 1; };
  window.setTimeout = callback => { state.refresh = callback; return 1; };
  window.fetch = async address => {
    if (address.includes('space.json')) return {ok: true, json: async () => state.index};
    if (state.pending) return state.pending;
    const bytes = fs.readFileSync(path.join(root, address.slice(3)));
    return {ok: true, arrayBuffer: async () => Uint8Array.from(bytes).buffer};
  };
  window.HALVETH_RELATION_MODEL = {fromSpace};
  window.eval(fs.readFileSync(path.join(root, 'faden/app.js'), 'utf8'));
  await waitFor(() => document.querySelectorAll('#projectList button').length === source.count);
  return {window, document, state};
}

test('project switch removes old destinations and keeps links hidden on pending or failed verification', async t => {
  const {document, window, state} = await fixture(t);
  document.querySelector('#projectList button').click();
  await waitFor(() => document.getElementById('detailOpen').hasAttribute('href'));
  let finish;
  state.pending = new Promise(resolve => { finish = resolve; });
  document.querySelectorAll('#projectList button')[1].click();
  for (const anchor of document.querySelectorAll('.detail-links a')) {
    assert.equal(window.getComputedStyle(anchor).display, 'none', 'pending links must be visually hidden');
    assert.equal(anchor.hasAttribute('href'), false, 'previous project destination must be cleared');
  }
  finish({ok: false, status: 503});
  await waitFor(() => document.getElementById('detailState').textContent.includes('NICHT VERIFIZIERT'));
  for (const anchor of document.querySelectorAll('.detail-links a')) {
    assert.equal(window.getComputedStyle(anchor).display, 'none');
    assert.equal(anchor.hasAttribute('href'), false);
  }
});

test('project selection and close restore usable focus, including index refresh and project removal', async t => {
  const {document, state} = await fixture(t);
  const first = document.querySelector('#projectList button');
  const id = first.dataset.nodeId;
  first.focus();
  first.click();
  assert.equal(document.activeElement.id, 'close', 'keyboard selection reaches the visible card');
  document.getElementById('close').click();
  assert.equal(document.activeElement.dataset.nodeId, id, 'close returns to the selected project');
  state.index.revision = 'b'.repeat(64);
  await state.refresh();
  assert.equal(document.activeElement.dataset.nodeId, id, 'refresh retains directory focus');
  document.activeElement.click();
  state.index.projects = state.index.projects.filter(p => `project:${p.id}` !== id);
  state.index.count = state.index.projects.length;
  state.index.revision = 'c'.repeat(64);
  await state.refresh();
  assert.equal(document.getElementById('detail').hidden, true);
  assert.ok(document.activeElement.matches('#projectList button'), 'removed project returns focus to the directory');
});

test('reduced-motion resize keeps every node visible and project hit targets usable', async t => {
  const {window, document, state} = await fixture(t);
  for (const [width, height] of [[375, 470], [768, 600], [320, 470]]) {
    state.width = width;
    state.height = height;
    window.dispatchEvent(new window.Event('resize'));
    state.arcs = [];
    state.frame(0);
    assert.equal(state.arcs.length, fromSpace(source).nodes.length * 2);
    for (const point of state.arcs) {
      assert.ok(point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height,
        `node outside ${width}x${height}: ${point.x},${point.y}`);
    }
    const point = state.arcs.find(item => item.radius === 5);
    document.getElementById('network').dispatchEvent(new window.MouseEvent('click', {
      clientX: point.x, clientY: point.y, bubbles: true
    }));
    assert.equal(document.getElementById('detail').hidden, false, 'resized project remains selectable');
    document.getElementById('close').click();
  }
});
