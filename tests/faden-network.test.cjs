'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const {fromNetwork, fromSpace} = require('../universum/relation-model.js');
const network = require('../universum/api/network.json');
const root = path.join(__dirname, '..', 'universum');

function addedRepository(input) {
  const copy = structuredClone(input);
  const original = copy.repositories.find(repo => repo.role === 'PROJECT_SOURCE');
  const repo = structuredClone(original);
  repo.id = 'repo:juri-halveth/faden-new-source';
  repo.name = 'faden-new-source';
  repo.fullName = 'Juri-Halveth/faden-new-source';
  repo.url = 'https://github.com/Juri-Halveth/faden-new-source';
  repo.head.url = repo.url + '/commit/' + repo.head.revision;
  repo.readme.url = repo.url + '/blob/' + repo.head.revision + '/README.md';
  repo.editorialState = 'CURRENT';
  copy.repositories.push(repo);
  copy.revision = 'a'.repeat(64);
  return copy;
}

test('current public network includes every repository and reviewed module without relying on the older space selection', () => {
  const graph = fromNetwork(network);
  assert.deepEqual(graph.nodes.filter(node => node.kind !== 'PUBLIC_MODULE').map(node => node.id), network.repositories.map(repo => repo.id));
  assert.equal(graph.coverage.repositoryCount, network.repositories.length);
  const modules = network.entries.filter(entry => entry.kind === 'module' &&
    network.repositories.find(repo => repo.id === entry.repositoryId)?.editorialState === 'CURRENT');
  assert.equal(graph.coverage.moduleCount, modules.length);
  assert.ok(graph.nodes.some(node => node.id === 'repo:juri-halveth/console-only'));
  assert.ok(graph.nodes.some(node => node.id === 'module:console-only:korridot'));
  assert.equal(graph.source.indexPath, 'api/network.json');
  assert.match(graph.coverage.temporalStatus, /NOT_LIVE_RUNTIME/);
  for (const edge of graph.relations) {
    assert.ok(edge.label && edge.sources.length);
    assert.equal(edge.claimCeiling, 'PUBLIC_SOURCE_REFERENCE_NOT_RUNTIME_CONNECTION');
    for (const source of edge.sources) assert.ok(source.url.includes(source.revision));
  }
  assert.equal(fromSpace(require('../universum/api/space.json')).source.indexPath, 'api/space.json', 'dated category adapter remains available');
});

test('public network adapter admits a new inventoried repository and rejects ambiguous identities, unbound relations and unsafe entry URLs', () => {
  const next = addedRepository(network);
  assert.equal(fromNetwork(next).coverage.repositoryCount, network.repositories.length + 1);
  const badIdentity = structuredClone(network);
  badIdentity.repositories.push(structuredClone(badIdentity.repositories[0]));
  assert.throws(() => fromNetwork(badIdentity), /identity/);
  const badEdge = structuredClone(network);
  badEdge.relations[0].to = 'repo:juri-halveth/not-in-this-inventory';
  assert.throws(() => fromNetwork(badEdge), /endpoint/);
  const badSource = structuredClone(network);
  const edge = badSource.relations.find(item => item.type === 'PUBLIC_README_LINK');
  edge.source.revision = 'b'.repeat(40);
  assert.throws(() => fromNetwork(badSource), /source binding/);
  for (const url of ['javascript:alert(1)', 'https://evil.example/', 'https://juri-halveth.github.io@evil.example/',
    'https://juri-halveth.github.io:8443/', 'https://github.com/Juri-Halveth/console-only/../../someone-else']) {
    const badUrl = structuredClone(network);
    badUrl.entries.find(entry => entry.id === 'module:console-only:korridot').url = url;
    assert.throws(() => fromNetwork(badUrl), /destination/, url);
  }
  const escapingSource = structuredClone(network);
  const sourceEntry = escapingSource.entries.find(entry => entry.kind === 'module');
  sourceEntry.source.url = sourceEntry.source.url + '/../../../../elsewhere';
  assert.throws(() => fromNetwork(escapingSource), /source binding/);
});

test('withdrawn presentations retain their source repositories without reintroducing module destinations', () => {
  const copy = structuredClone(network);
  const entry = copy.entries.find(item => item.kind === 'module');
  copy.repositories.find(repo => repo.id === entry.repositoryId).editorialState = 'WITHDRAWN_FROM_PORTFOLIO';
  const graph = fromNetwork(copy);
  assert.ok(graph.nodes.some(node => node.id === entry.repositoryId));
  assert.ok(!graph.nodes.some(node => node.id === entry.id));
  assert.ok(!graph.relations.some(edge => edge.from === entry.id || edge.to === entry.id));
});

test('pull request entries remain explicitly proposals rather than deployed programs', () => {
  const copy = structuredClone(network);
  const entry = copy.entries.find(item => item.kind === 'module');
  const repo = copy.repositories.find(item => item.id === entry.repositoryId);
  entry.url = repo.url + '/pull/83';
  const node = fromNetwork(copy).nodes.find(item => item.id === entry.id);
  assert.equal(node.context.state, 'PULL REQUEST · QUELLVORSCHLAG');
  assert.match(node.context.publicEntry.label, /Pull Request/);
  entry.source.scope = 'PUBLIC_OPEN_DRAFT_NOT_PUBLISHED_OR_RUNTIME_INTEGRATION';
  const draft = fromNetwork(copy).nodes.find(item => item.id === entry.id);
  assert.equal(draft.context.state, 'ENTWURF · PULL REQUEST');
  assert.equal(draft.context.publicEntry.url, entry.url);
  assert.match(draft.context.capability.boundary, /Änderungsvorschlag/);
});

async function fixture(t) {
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'faden/index.html'), 'utf8'), {
    url: 'https://juri-halveth.github.io/universum/faden/', runScripts: 'outside-only'
  });
  t.after(() => dom.window.close());
  const {window} = dom;
  const state = {index: structuredClone(network), fail: false, requests: []};
  window.HTMLCanvasElement.prototype.getContext = () => null;
  window.document.querySelector('.stage').getBoundingClientRect = () => ({width: 1000, height: 650});
  window.document.querySelector('.stage').scrollIntoView = () => {};
  window.matchMedia = () => ({matches: true});
  window.requestAnimationFrame = () => 1;
  window.setTimeout = callback => { state.refresh = callback; return 1; };
  window.fetch = async address => {
    state.requests.push(address);
    assert.equal(address, '../api/network.json');
    return state.fail ? {ok: false, status: 503} : {ok: true, json: async () => state.index};
  };
  window.HALVETH_RELATION_MODEL = {fromNetwork, fromSpace};
  window.eval(fs.readFileSync(path.join(root, 'faden/app.js'), 'utf8'));
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(state.refresh);
  return {window, document: window.document, state};
}

test('Faden recovers from a failed refresh when the next successful index has the same revision', async t => {
  const {document, state} = await fixture(t);
  const initial = document.getElementById('status').textContent;
  assert.match(initial, /Repository-Einträge/);
  state.fail = true;
  await state.refresh();
  assert.match(document.getElementById('status').textContent, /gestört/);
  state.fail = false;
  await state.refresh();
  assert.equal(document.getElementById('status').textContent, initial);
  assert.ok(document.querySelectorAll('#projectList button').length > network.repositories.length);
});

test('Faden exposes source-linked module cards and updates the directory from the next network revision', async t => {
  const {document, state} = await fixture(t);
  assert.match(document.getElementById('status').textContent, /Grafik nicht verfügbar, Projektliste bedienbar/);
  const module = network.entries.find(item => item.id === 'module:console-only:korridot');
  const button = [...document.querySelectorAll('#projectList button')].find(item => item.dataset.nodeId === module.id);
  assert.ok(button);
  button.click();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(document.getElementById('detailOpen').href, module.url);
  assert.equal(document.getElementById('detailSource').href, module.source.url);
  assert.match(document.getElementById('detailRelations').textContent, /Moduleinstieg/);
  assert.ok(document.querySelector('#detailRelations a[href]'));
  state.index = addedRepository(state.index);
  await state.refresh();
  assert.ok([...document.querySelectorAll('#projectList button')].some(item => item.dataset.nodeId === 'repo:juri-halveth/faden-new-source'));
  assert.ok(state.requests.every(address => address === '../api/network.json'));
});
