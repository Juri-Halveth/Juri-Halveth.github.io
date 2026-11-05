'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const {fromSpace} = require('../universum/relation-model.js');

const route = path.join(__dirname, '..', 'universum');
const source = require('../universum/api/space.json');

test('public graph binds each edge to one explicit project-category membership', () => {
  const graph = fromSpace(source);
  const expected = source.projects.reduce((count, project) => count + project.categories.length, 0);
  assert.equal(graph.coverage.projectCount, source.projects.length);
  assert.equal(graph.coverage.relationCount, expected);
  assert.equal(graph.relations.length, expected);
  assert.equal(graph.nodes.length, source.projects.length + new Set(source.projects.flatMap(item => item.categories)).size);
  const ids = new Set(graph.nodes.map(node => node.id));
  for (const relation of graph.relations) {
    assert.equal(relation.type, 'PUBLIC_CATALOG_CATEGORY_MEMBERSHIP');
    assert.ok(ids.has(relation.from) && ids.has(relation.to));
    assert.equal(relation.evidence.indexRevision, source.revision);
    const project = source.projects.find(item => `project:${item.id}` === relation.from);
    assert.ok(project && project.categories.includes(relation.to.slice('category:'.length)));
    assert.equal(relation.evidence.contextSha256, project.sha256);
  }
  assert.equal(graph.coverage.temporalStatus, 'SNAPSHOT_NOT_LIVE_RUNTIME');
});

test('new projects and previously unseen categories enter without a fixed count', () => {
  const augmented = structuredClone(source);
  augmented.projects.push({id:'new-lab',title:'NEW LAB',state:'Browserlab',categories:['new-topic','models'],
    path:'api/projects/new-lab.json',bytes:12,sha256:'a'.repeat(64)});
  augmented.count = augmented.projects.length;
  augmented.revision = 'b'.repeat(64);
  const graph = fromSpace(augmented);
  assert.ok(graph.nodes.some(node => node.id === 'project:new-lab'));
  assert.ok(graph.nodes.some(node => node.id === 'category:new-topic'));
  assert.ok(graph.relations.some(edge => edge.from === 'project:new-lab' && edge.to === 'category:new-topic'));
  assert.equal(graph.coverage.projectCount, source.count + 1);
});

test('ambiguous or escaping source addresses and duplicate identities are rejected', () => {
  const bad = structuredClone(source);
  bad.projects[0].categories.push(bad.projects[0].categories[0]);
  assert.throws(() => fromSpace(bad), /Category ID/);
  bad.projects[0].categories.pop();
  bad.projects[0].path = 'api/projects/../private.json';
  assert.throws(() => fromSpace(bad), /context address/);
  bad.projects[0].path = source.projects[0].path;
  bad.projects.push(structuredClone(bad.projects[0]));
  bad.count++;
  assert.throws(() => fromSpace(bad), /Project ID/);
});

test('generated relation JSON and visible route are bound to the same public index', () => {
  const published = require('../universum/api/relations.json');
  assert.deepEqual(published, fromSpace(source));
  const html = fs.readFileSync(path.join(route, 'faden', 'index.html'), 'utf8');
  const document = new JSDOM(html).window.document;
  assert.ok(document.querySelector('canvas#network'));
  assert.ok(document.querySelector('#projectList'));
  const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content;
  assert.ok(csp?.includes("connect-src 'self'"));
  assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval/);
  for (const element of document.querySelectorAll('script[src],link[href]')) {
    const link = element.getAttribute('src') || element.getAttribute('href');
    const url = new URL(link, 'https://juri-halveth.github.io/universum/faden/');
    assert.equal(url.origin, 'https://juri-halveth.github.io');
    assert.ok(fs.existsSync(path.join(route, decodeURIComponent(url.pathname.slice('/universum/'.length)))));
  }
  assert.match(fs.readFileSync(path.join(route, 'index.html'), 'utf8'), /href="faden\/"/);
});

test('project list remains usable when the browser cannot create a canvas context', async () => {
  const html = fs.readFileSync(path.join(route, 'faden', 'index.html'), 'utf8');
  const dom = new JSDOM(html, {url: 'https://juri-halveth.github.io/universum/faden/', runScripts: 'outside-only'});
  const {window} = dom;
  window.HTMLCanvasElement.prototype.getContext = () => null;
  window.matchMedia = () => ({matches: true});
  window.requestAnimationFrame = () => 0;
  window.fetch = async () => ({ok: true, json: async () => source});
  window.HALVETH_RELATION_MODEL = {fromSpace};
  window.eval(fs.readFileSync(path.join(route, 'faden', 'app.js'), 'utf8'));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(window.document.querySelectorAll('#projectList button').length, source.count);
  assert.match(window.document.getElementById('status').textContent, /Projektliste bedienbar/);
  window.close();
});
