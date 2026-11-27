'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {makeNetworkIndex, validateDocument} = require('../tools/build-network-index.cjs');
const root = path.resolve(__dirname, '..');
const inventory = require('../data/network-inventory.json');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
function fixture(t) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'halveth-network-'));
  fs.mkdirSync(path.join(temporary, 'data'));
  for (const file of ['network-inventory', 'site-catalog', 'project-briefs', 'network-readme-descriptions', 'network-entries', 'research-index', 'technical-map', 'projects', 'public-repositories', 'network-sites']) {
    const source = path.join(root, 'data', file + '.json');
    if (fs.existsSync(source)) fs.copyFileSync(source, path.join(temporary, 'data', file + '.json'));
  }
  t.after(() => fs.rmSync(temporary, {recursive: true, force: true}));
  return temporary;
}
function saveInventory(temporary, value) {
  value.counts = {repositories: value.repositories.length, forks: value.repositories.filter(repo => repo.fork).length, pagesConfigured: value.repositories.filter(repo => repo.hasPages).length};
  fs.writeFileSync(path.join(temporary, 'data/network-inventory.json'), JSON.stringify(value));
}
test('network generation preserves dated catalogs and computes typed counts from its public sources', () => {
  const files = ['site-catalog', 'projects', 'public-repositories', 'research-index', 'technical-map'];
  const before = files.map(file => sha(fs.readFileSync(path.join(root, 'data', file + '.json'))));
  const first = makeNetworkIndex(root), second = makeNetworkIndex(root);
  assert.deepEqual(first, second);
  assert.deepEqual(files.map(file => sha(fs.readFileSync(path.join(root, 'data', file + '.json')))), before);
  assert.deepEqual(first.network.repositories.map(repo => repo.id), inventory.repositories.map(repo => repo.repositoryId));
  assert.equal(first.network.counts.repositories, inventory.repositories.length);
  assert.equal(first.network.counts.forks, inventory.repositories.filter(repo => repo.fork).length);
  assert.equal(first.network.counts.modules, first.search.documents.filter(doc => doc.kind === 'module').length);
  assert.equal(first.network.counts.independentSites, first.search.documents.filter(doc => doc.kind === 'site').length);
  assert.equal(first.network.counts.portfolioCards, require('../data/site-catalog.json').projects.filter(row => row.site.entry_type === 'PROJECT' && row.site.editorial_state === 'CURRENT').length);
  assert.equal(first.network.coverage.runtimeVerified, false);
  assert.ok(first.network.coverage.notIndexed.includes('Full repository file contents'));
});
test('shared query finds recent entry points and keeps withdrawn presentations out by default', async () => {
  const {searchNetwork} = await import('../network-search.mjs');
  const {search} = makeNetworkIndex(root);
  for (const [query, id] of [['KORRIDOT', 'module:console-only:korridot'], ['GG24', 'module:console-only:gg24'], ['Lichtpunkt', 'module:website:lichtpunkt']]) assert.ok(searchNetwork(search, query).some(doc => doc.id === id), query);
  assert.equal(searchNetwork(search, 'NOVA')[0].repositoryId, 'repo:juri-halveth/lucinet-seedspace');
  for (const name of ['NOVA','Bio-Universe','JBL WAN']) {
    const product = searchNetwork(search, name)[0];
    assert.ok(product.primaryNames.includes(name));
    const reviewed = require('../data/network-readme-descriptions.json').documents.find(row => row.repositoryId === product.repositoryId && row.source.readmeSha256);
    assert.equal(new Set(Object.values(reviewed.summary)).size, 3);
  }
  assert.ok(searchNetwork(search, 'Leviathan').some(doc => doc.repositoryId === 'repo:juri-halveth/leviathan-wallet-portal'));
  assert.deepEqual(searchNetwork(search, 'missing-public-description-7d2731'), []);
  for (const name of ['halveth-unreal', 'halveth-realms', 'halveth-morrowind-genesis']) {
    assert.deepEqual(searchNetwork(search, name), []);
    assert.ok(searchNetwork(search, name, {includeArchive: true}).every(doc => doc.editorialState === 'WITHDRAWN_FROM_PORTFOLIO'));
  }
  assert.ok(searchNetwork(search, 'Förder Zeitspur').some(doc => doc.id === 'module:console-only:gg24'));
  assert.ok(searchNetwork(search, 'forder zeitspur').some(doc => doc.id === 'module:console-only:gg24'));
  assert.ok(searchNetwork(search, 'GG24', {kinds: ['module']}).every(doc => doc.kind === 'module'));
  assert.equal(searchNetwork(search, '', {limit: 2}).length, 2);
  assert.equal(searchNetwork(search, '', {limit: 500}).length, Math.min(500, search.counts.currentSearchDocuments));
});
test('a newer HEAD cannot inherit the old reviewed README description or test claims', t => {
  const temporary = fixture(t), value = structuredClone(inventory);
  const changed = value.repositories.find(repo => repo.name === 'halveth-scarlet');
  const reviewed = JSON.parse(fs.readFileSync(path.join(temporary, 'data/network-readme-descriptions.json'), 'utf8'));
  const oldRevision = reviewed.documents.find(doc => doc.repositoryId === changed.repositoryId).source.revision;
  const newRevision = 'e'.repeat(40);
  changed.head.revision = newRevision; changed.head.url = `${changed.url}/commit/${newRevision}`;
  changed.readme.revision = newRevision; changed.readme.url = `${changed.url}/blob/${newRevision}/README.md`;
  changed.readme.excerpt = 'A newly observed source description with an independent evidence boundary.';
  saveInventory(temporary, value);
  const {search} = makeNetworkIndex(temporary);
  const current = search.documents.find(doc => doc.kind === 'repository' && doc.repositoryId === changed.repositoryId && !doc.historical);
  assert.equal(current.source.revision, newRevision);
  assert.equal(current.source.scope, 'PUBLIC_README_AUTOMATIC_EXCERPT_NOT_EDITORIAL_REVIEW');
  assert.equal(current.summary.de, changed.readme.excerpt);
  const old = search.documents.find(doc => doc.kind === 'repository' && doc.repositoryId === changed.repositoryId && doc.source.revision === oldRevision);
  assert.equal(old.historical, true); assert.equal(old.freshness.state, 'OLDER_REVIEWED_REVISION');
  assert.equal(require('../data/site-catalog.json').source_date, '2026-11-02');
});
test('repositories removed from the public census cannot persist as active documents or graph endpoints', t => {
  const temporary = fixture(t), value = structuredClone(inventory);
  const removed = value.repositories.find(repo => repo.name === 'console-only');
  value.repositories = value.repositories.filter(repo => repo !== removed);
  for (const repo of value.repositories) repo.readme.mentionedRepositories = repo.readme.mentionedRepositories.filter(name => name !== removed.name);
  saveInventory(temporary, value);
  const {network, search} = makeNetworkIndex(temporary);
  assert.ok(!network.repositories.some(repo => repo.id === removed.repositoryId));
  assert.ok(!search.documents.some(doc => doc.repositoryId === removed.repositoryId));
  assert.ok(!network.relations.some(edge => edge.from === removed.repositoryId || edge.to === removed.repositoryId));
});
test('entry validation rejects unsupported identities, unsafe links and invented site commit bindings', () => {
  const repositories = new Map(inventory.repositories.map(repo => [repo.repositoryId, repo]));
  const original = require('../data/network-entries.json').documents[0];
  for (const mutate of [doc => {doc.url = 'javascript:alert(1)';}, doc => {doc.repositoryId = 'repo:juri-halveth/unknown';}, doc => {doc.source.revision = 'a'.repeat(40);}]) {
    const doc = structuredClone(original); mutate(doc); assert.throws(() => validateDocument(doc, repositories));
  }
  const site = { ...structuredClone(original), id: 'site:example', kind: 'site', repositoryId: null, visibility: 'public', url: 'https://example.com/', source: {url: 'https://example.com/', revision: null, observedAt: inventory.observedAt, scope: 'PUBLIC_WEBSITE_DESCRIPTION_NO_COMMIT_BINDING'}};
  assert.equal(validateDocument(site, repositories), site);
  site.source.revision = 'a'.repeat(40); assert.throws(() => validateDocument(site, repositories));
});
test('JSON and CSP-safe static module contain the same source-bound query data', async () => {
  const actual = JSON.parse(fs.readFileSync(path.join(root, 'universum/api/search.json')));
  const imported = (await import('../universum/api/search.mjs')).default;
  assert.deepEqual(imported, actual);
  assert.equal(require('../universum/api/network.json').search.sha256, sha(fs.readFileSync(path.join(root, 'universum/api/search.json'))));
});

test('a byte-identical README keeps its reviewed descriptions across commits', t => {
  const temporary = fixture(t), value = structuredClone(inventory);
  const repo = value.repositories.find(item => item.name === 'lucinet-seedspace');
  const bound = require('../data/network-readme-descriptions.json').documents.find(row => row.repositoryId === repo.repositoryId && row.source.readmeSha256);
  const previous = bound.source.revision, revision = 'a'.repeat(40);
  repo.head = {...repo.head, revision, url: `${repo.url}/commit/${revision}`};
  repo.readme = {...repo.readme, sha256: bound.source.readmeSha256, revision, url: `${repo.url}/blob/${revision}/README.md`};
  saveInventory(temporary, value);
  const current = () => makeNetworkIndex(temporary).search.documents.find(item => item.repositoryId === repo.repositoryId && item.kind === 'repository' && !item.historical);
  assert.equal(current().source.reviewedRevision, previous);
  assert.equal(current().source.revision, revision);
  repo.readme.sha256 = '3'.repeat(64);
  saveInventory(temporary, value);
  assert.equal(current().source.scope, 'PUBLIC_README_AUTOMATIC_EXCERPT_NOT_EDITORIAL_REVIEW');
});
