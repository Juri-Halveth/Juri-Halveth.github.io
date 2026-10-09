'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const { build } = require('../tools/build-source-universe.cjs');
const core = require('../universum/core.js');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('source graph is deterministic, endpoint-closed and keeps file bytes out', () => {
  const first = build();
  const second = build();
  assert.deepEqual(first, second);
  assert.equal(first.schema, 'halveth.source-universe.v1');
  assert.equal(first.dataClass, 'PUBLIC_REPOSITORY_METADATA');
  assert.equal(first.coverage.contentsStored, false);
  assert.equal(first.coverage.untrackedFilesIncluded, false);
  assert.ok(first.coverage.trackedFiles > 0);

  const nodes = new Map(first.nodes.map(node => [node.id, node]));
  assert.equal(nodes.size, first.nodes.length, 'node IDs must be unique');
  assert.ok(nodes.has(first.repositoryNodeId));
  for (const relation of first.relations) {
    assert.match(relation.definition, /:v1$/);
    assert.equal(relation.direction, 'SOURCE_TO_TARGET');
    assert.equal(relation.scope, 'PUBLIC_GITHUB_REPOSITORY');
    assert.ok(relation.timeBasis?.kind);
    assert.ok(['OBSERVED', 'INFERRED'].includes(relation.evidenceState));
    for (const endpoint of [relation.source, relation.target]) {
      const target = nodes.get(endpoint.id);
      assert.ok(target, `missing endpoint ${endpoint.id}`);
      assert.equal(endpoint.kind, target.kind);
      assert.ok(endpoint.semanticAddress);
    }
  }

  for (const relation of first.relations.filter(item => item.type === 'SAME_SHA256')) {
    const file = nodes.get(relation.source.id), group = nodes.get(relation.target.id);
    assert.equal(file.sha256, group.sha256);
    assert.equal(relation.evidenceState, 'OBSERVED');
    assert.match(relation.evidenceBasis, /SHA256/);
  }
  for (const relation of first.relations.filter(item => ['IMPORTS_FILE','REFERENCES_FILE','USES_ACTION'].includes(item.type))) {
    assert.equal(relation.evidenceState, 'INFERRED');
  }
  assert.ok(first.relations.every(relation => relation.type !== 'CAUSES' && relation.type !== 'OWNS'));
});

test('untracked names and bytes cannot enter the public graph', () => {
  const markerName = '.source-universe-untracked-probe.txt';
  const markerBytes = 'PRIVATE_PROBE_CONTENT_SHOULD_NEVER_APPEAR';
  const markerPath = path.join(root, markerName);
  fs.writeFileSync(markerPath, markerBytes, { flag: 'wx' });
  try {
    const graph = build();
    const serialized = JSON.stringify(graph);
    assert.ok(!graph.nodes.some(node => node.path === markerName));
    assert.ok(!serialized.includes(markerName));
    assert.ok(!serialized.includes(markerBytes));
  } finally {
    fs.rmSync(markerPath);
  }
});

test('4D data projection is deterministic and W follows observed commit time', () => {
  const graph = build();
  const modelA = core.createModel(graph), modelB = core.createModel(graph);
  assert.deepEqual(modelA.nodes.map(node => node.position), modelB.nodes.map(node => node.position));
  const commit = modelA.commits[0];
  const commitNode = commit && modelA.byId.get(commit.id);
  assert.ok(commitNode);
  const viewOld = { yaw:0, pitch:0, zoom:1, timePosition:0 };
  const viewNew = { ...viewOld, timePosition:1 };
  const oldProjection = core.project(commitNode.position, viewOld, 1000, 600, 0);
  const newProjection = core.project(commitNode.position, viewNew, 1000, 600, 0);
  assert.ok(Number.isFinite(oldProjection.x) && Number.isFinite(oldProjection.y));
  assert.notDeepEqual(oldProjection, newProjection);
  assert.equal(core.visibleAtTime(commit, modelA.oldestEpoch), commit.epoch <= modelA.oldestEpoch);
  assert.equal(graph.history.fileStateAtHistoricalTime, 'NOT_RECONSTRUCTED');
});

test('site builds a localized universe route with a restrictive same-origin runtime', () => {
  for (const file of ['universum/index.html','en/universum/index.html','ru/universum/index.html']) {
    const html = read(file);
    assert.match(html, /universum\/core\.js/);
    assert.match(html, /universum\/app\.js/);
    assert.match(html, /source-universe/);
    assert.match(html, /connect-src &#39;self&#39;|connect-src 'self'/);
  }
  assert.match(read('sitemap.xml'), /\/universum\//);
  assert.match(read('templates/index.html'), /href="\/universum\/"/);
});

test('published rights, report route, owner routing and dependency maintenance are explicit', () => {
  assert.match(read('LICENSES.md'), /universum\/\*\*/);
  assert.match(read('LICENSES.md'), /only to the extent of rights actually held/);
  assert.match(read('.github/CODEOWNERS'), /@Juri-Halveth/);
  assert.match(read('.github/CODEOWNERS'), /does not establish copyright/);
  assert.match(read('SECURITY.md'), /security@halveth\.de/);
  assert.match(read('.github/dependabot.yml'), /package-ecosystem: github-actions/);
  assert.match(read('.github/dependabot.yml'), /package-ecosystem: npm/);
});

test('every third-party GitHub Action is pinned to a full commit SHA', () => {
  const workflows = fs.readdirSync(path.join(root, '.github/workflows')).filter(file => file.endsWith('.yml'));
  for (const file of workflows) {
    const content = read(`.github/workflows/${file}`);
    for (const match of content.matchAll(/^\s*uses:\s*([^\s#]+)(?:\s+#\s*(.*))?$/gm)) {
      if (match[1].startsWith('./')) continue;
      assert.match(match[1], /@[0-9a-f]{40}$/i, `${file}: ${match[1]} must use a full commit SHA`);
      assert.ok(match[2]?.trim(), `${file}: pinned action should retain a readable release comment`);
    }
  }
});
