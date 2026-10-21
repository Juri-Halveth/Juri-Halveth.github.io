'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { validateResearchIndex, renderResearchOS } = require('../tools/render-research-os.cjs');
const root = path.resolve(__dirname, '..');
const index = JSON.parse(fs.readFileSync(path.join(root, 'data/research-index.json'), 'utf8'));

test('pinned public index exposes four entities and only bound portfolio relations', () => {
  validateResearchIndex(index);
  assert.equal(index.entities.length, 4);
  assert.deepEqual(new Set(index.entities.map(entity => entity.id)), new Set(['urn:halveth:project:portfolio', 'urn:halveth:project:seedspace', 'urn:halveth:project:field-lab', 'urn:halveth:project:c-drohne']));
  assert.equal(index.relations.length, 2);
  assert.equal(index.evidence.length, 4);
  assert.equal(index.events.length, 4);
  assert.deepEqual(index.claims, []);
  for (const relation of index.relations) {
    assert.ok(index.entities.some(entity => entity.id === relation.left.id));
    assert.ok(index.entities.some(entity => entity.id === relation.right.id));
  }
});

test('tampered digest and mismatched evidence links cannot be rendered', () => {
  const tampered = structuredClone(index);
  tampered.entities[0].name.de = 'other';
  assert.throws(() => validateResearchIndex(tampered), /digest mismatch/);
  const broken = structuredClone(index);
  broken.events[0].sourceEvidenceId = 'urn:halveth:evidence:missing';
  // Recompute the overall digest to reach referential validation.
  const { createHash } = require('node:crypto');
  const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']' : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}' : JSON.stringify(value);
  const { digest: _, ...body } = broken;
  broken.digest = createHash('sha256').update(canonical(body)).digest('hex');
  assert.throws(() => validateResearchIndex(broken), /unresolved capture receipt/);
});

test('all three generated routes show linked sources and retained unknowns', () => {
  for (const [prefix, expected] of [['', 'Projekte'], ['en/', 'Projects'], ['ru/', 'Проекты']]) {
    const file = path.join(root, prefix, 'forschung/index.html');
    const doc = new JSDOM(fs.readFileSync(file, 'utf8')).window.document;
    assert.equal(doc.querySelectorAll('.ros-card').length, 4);
    assert.equal(doc.querySelectorAll('.ros-relation-list li').length, 2);
    assert.equal(doc.querySelectorAll('.ros-card details').length, 4);
    assert.match(doc.querySelector('.ros-counts').textContent, new RegExp(expected));
    assert.ok(doc.querySelector('link[href="/research-os.css"]'));
    assert.ok(doc.querySelector('a[href="/forschung/"]'));
    for (const card of doc.querySelectorAll('.ros-card')) {
      assert.ok(card.querySelector('a[href^="https://github.com/Juri-Halveth/"]'));
      assert.ok(card.querySelector('details li'));
    }
  }
});

test('rendered cards escape data text', () => {
  const injected = structuredClone(index);
  injected.entities[0].name.de = '<script>alert(1)</script>';
  const { createHash } = require('node:crypto');
  const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']' : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}' : JSON.stringify(value);
  const entity = injected.entities[0];
  const { digest: oldEntityDigest, ...entityBody } = entity;
  entity.digest = createHash('sha256').update(canonical(entityBody)).digest('hex');
  for (const relation of injected.relations) for (const endpoint of [relation.left, relation.right]) if (endpoint.id === entity.id) endpoint.digest = entity.digest;
  const { digest: oldIndexDigest, ...body } = injected;
  injected.digest = createHash('sha256').update(canonical(body)).digest('hex');
  const html = renderResearchOS(injected, 'de');
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});
