'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');

const root = path.resolve(__dirname, '..');
const route = path.join(root, 'universum');
const catalog = require('../data/site-catalog.json');
const overview = require('../universum/api/space.json');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const {buildAgentSpace} = require('../tools/build-agent-space.cjs');

test('agent overview addresses exactly the public catalog with exact context bytes', () => {
  assert.equal(overview.schema, 'halveth.agent-space.v1');
  assert.equal(overview.count, 18);
  assert.deepEqual(overview.projects.map(p => p.id), catalog.projects.map(p => p.id));
  assert.equal(overview.access.mode, 'READ_PUBLIC');
  assert.equal(overview.access.writes, false);
  assert.equal(overview.catalogSha256, hash(fs.readFileSync(path.join(root, 'data/site-catalog.json'))));
  const paths = new Set();
  for (const project of overview.projects) {
    assert.match(project.path, /^api\/projects\/[A-Za-z0-9.-]+\.json$/);
    assert.ok(!paths.has(project.path)); paths.add(project.path);
    const bytes = fs.readFileSync(path.join(route, project.path));
    assert.equal(bytes.length, project.bytes, project.id);
    assert.equal(hash(bytes), project.sha256, project.id);
    const context = JSON.parse(bytes.toString('utf8'));
    const source = catalog.projects.find(p => p.id === project.id);
    assert.equal(context.id, project.id);
    assert.equal(context.publicEntry.url, source.url);
    assert.equal(context.source.url, source.source_url);
    assert.equal(context.source.revision, source.site.revision);
    for (const field of ['core', 'value', 'boundary']) assert.ok(context.capability[field].length > 25);
  }
});

test('FORTUNA browser, separate local, loopback and external goal remain distinct', () => {
  const fortuna = require('../universum/api/projects/fortuna.json');
  assert.match(fortuna.capability.core, /999\.999 Ziehungen je Serie/);
  assert.match(fortuna.capability.boundary, /keine fremden Spiel- oder Serverergebnisse/);
  assert.match(fortuna.separateLocalPrototype, /1\.000\.000 Ziehungen/);
  assert.equal(fortuna.separateLocalPrototypeEvidence.publicSource, false);
  assert.equal(fortuna.separateLocalPrototypeEvidence.drawsObserved, 999999);
  assert.match(fortuna.separateLoopbackPrototype, /zwei Serien/);
  assert.equal(fortuna.separateLoopbackPrototypeEvidence.testsPassed, 7);
  assert.equal(fortuna.separateLoopbackPrototypeEvidence.drawsObservedPerSeries, 999999);
  assert.equal(fortuna.separateLoopbackPrototypeEvidence.publicSource, false);
  assert.match(fortuna.userGoalNotYetPublished, /nicht veröffentlicht/);
  assert.equal(fortuna.evidenceLevel, 'PUBLIC_SOURCE_DESCRIPTION_PLUS_SEPARATE_LOCAL_TESTS_NOT_EXTERNAL_PROOF');
  assert.match(fs.readFileSync(path.join(route, 'llms.txt'), 'utf8'), /api\/space\.json/);
  assert.match(fs.readFileSync(path.join(root, 'llms.txt'), 'utf8'), /universum\/api\/space\.json/);
  for (const page of ['index.html', 'en/index.html', 'ru/index.html']) {
    assert.match(fs.readFileSync(path.join(root, page), 'utf8'), /rel="alternate" type="application\/json" title="HALVETH agent space"/);
  }
});

test('a newer catalog source cannot inherit reviewed project claims', () => {
  const changed = structuredClone(catalog);
  changed.projects[10].site.revision = 'a'.repeat(40);
  changed.projects[10].source_url = 'https://github.com/Juri-Halveth/fortuna/tree/' + 'a'.repeat(40);
  assert.throws(() => buildAgentSpace(root, changed), /Project brief source drift: fortuna/);
  assert.equal(overview.projects.length, 18);
});
