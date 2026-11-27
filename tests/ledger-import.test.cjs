'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {webcrypto} = require('node:crypto');
const {JSDOM} = require('jsdom');
const root = path.join(__dirname, '..', 'universum');
const LIMIT = 4 * 1024 * 1024;

async function fixture(t) {
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), {
    url: 'https://juri-halveth.github.io/universum/', runScripts: 'outside-only'
  });
  t.after(() => dom.window.close());
  const w = dom.window;
  w.HALVETH_APP = {setStatus() {}};
  w.HALVETH_CATALOG = {categories: []};
  w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder; w.Blob = Blob;
  Object.defineProperty(w, 'crypto', {value: webcrypto});
  w.Date = class extends Date { constructor(...args) { super(...(args.length ? args : ['2026-11-27T16:00:00.000Z'])); } };
  w.requestAnimationFrame = () => 1;
  w.setTimeout = () => 1;
  let download;
  w.URL.createObjectURL = blob => { download = blob; return 'blob:ledger-test'; };
  w.URL.revokeObjectURL = () => {};
  w.HTMLAnchorElement.prototype.click = () => {};
  w.eval(fs.readFileSync(path.join(root, 'vendor/scarlet/core.js'), 'utf8'));
  w.eval(fs.readFileSync(path.join(root, 'lab.js'), 'utf8'));
  const el = id => w.document.getElementById(id);
  async function settled() {
    const deadline = Date.now() + 5000;
    while (el('ledgerImport').disabled) {
      assert.ok(Date.now() < deadline, 'ledger UI operation completed within five seconds');
      await new Promise(resolve => setImmediate(resolve));
    }
  }
  async function click(id) { el(id).click(); await settled(); }
  async function exported() {
    download = null; await click('ledgerExport');
    assert.ok(download, 'export creates a downloadable JSON blob');
    assert.ok(download.size <= LIMIT, 'actual exported byte size satisfies the import limit');
    const text = await download.text();
    assert.equal(new TextEncoder().encode(text).length, download.size);
    return JSON.parse(text);
  }
  async function importBytes(bytes, extra = {}) {
    const file = {name: 'ledger.json', size: bytes.byteLength, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), ...extra};
    Object.defineProperty(el('ledgerFile'), 'files', {value: [file], configurable: true});
    el('ledgerFile').dispatchEvent(new w.Event('change'));
    await settled();
    assert.equal(el('ledgerFile').value, '', 'same filename can be selected again');
  }
  const importValue = value => importBytes(new TextEncoder().encode(JSON.stringify(value)));
  await click('ledgerSeed');
  return {el, click, exported, importBytes, importValue};
}

test('UI export reopens in a separate session and produces the same next transition as uninterrupted continuation', async t => {
  const original = await fixture(t);
  original.el('ledgerVariantText').value = 'Erste neue Variante';
  await original.click('ledgerBranch');
  const saved = await original.exported();
  const resumed = await fixture(t);
  await resumed.importValue(saved);
  assert.match(resumed.el('ledgerStatus').textContent, /JSON geladen · Replay und Selbstkonsistenz geprüft/);
  assert.deepEqual(await resumed.exported(), saved);
  for (const ui of [original, resumed]) {
    ui.el('ledgerVariantText').value = 'Fortsetzung nach der Datei';
    await ui.click('ledgerBranch');
  }
  const continuing = await original.exported();
  assert.equal(continuing.projection.counts.states, 3);
  assert.deepEqual(await resumed.exported(), continuing);
});

test('tampered replay, malformed JSON and invalid UTF-8 leave the active ledger unchanged and allow retry', async t => {
  const ui = await fixture(t);
  const before = await ui.exported();
  const tampered = structuredClone(before);
  tampered.events[0].command.text = 'Nicht durch den vorhandenen Hash gebunden';
  await ui.importValue(tampered);
  assert.match(ui.el('ledgerStatus').textContent, /EVENT_REPLAY_MISMATCH/);
  assert.deepEqual(await ui.exported(), before);
  for (const bytes of [new TextEncoder().encode('{broken'), new Uint8Array([0xff, 0xfe])]) {
    await ui.importBytes(bytes);
    assert.match(ui.el('ledgerStatus').textContent, /Operation unterbrochen/);
    assert.deepEqual(await ui.exported(), before);
  }
  await ui.importValue(before);
  assert.match(ui.el('ledgerStatus').textContent, /JSON geladen/);
  assert.deepEqual(await ui.exported(), before);
});

test('4 MiB is an inclusive raw-file bound; oversized and inconsistent reads are rejected before adoption', async t => {
  const ui = await fixture(t);
  const before = await ui.exported();
  const source = new TextEncoder().encode(JSON.stringify(before));
  const atLimit = new Uint8Array(LIMIT).fill(32);
  atLimit.set(source);
  await ui.importBytes(atLimit);
  assert.match(ui.el('ledgerStatus').textContent, /JSON geladen/);
  assert.deepEqual(await ui.exported(), before);
  let read = false;
  await ui.importBytes(source, {size: LIMIT + 1, arrayBuffer: async () => { read = true; return source.buffer; }});
  assert.equal(read, false, 'over-limit file is rejected before reading its contents');
  assert.match(ui.el('ledgerStatus').textContent, /4194304 Bytes/);
  assert.deepEqual(await ui.exported(), before);
  await ui.importBytes(source, {size: source.byteLength + 1});
  assert.match(ui.el('ledgerStatus').textContent, /Dateigröße/);
  assert.deepEqual(await ui.exported(), before);
});
