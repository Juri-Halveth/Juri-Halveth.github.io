'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const M = require('../space-model.js');
const data = require('../data/juris-space.json');
const root = path.resolve(__dirname, '..');
test('all 15 owned public repositories and two Sites are represented with unique IDs', () => {
  assert.equal(M.validateData(data), true);
  assert.equal(data.repositoryCount, 15); assert.equal(data.siteCount, 2);
  assert.equal(new Set(data.projects.map(p=>p.id)).size,17);
});
test('public atlas rejects local, credential-bearing and foreign-host destinations', () => {
  for (const url of ['file:///C:/private.txt','http://127.0.0.1:4173','https://secret@github.com/private','https://example.org/']) {
    const copy = structuredClone(data); copy.projects[0].entry = url;
    assert.throws(() => M.validateData(copy));
  }
});
test('a stored project remains selected across language changes', () => {
  const raw = JSON.stringify({version:1, project:'FORTUNA',language:'de',theme:'dark'});
  assert.deepEqual(M.readSettings(data,raw,'en'),{version:1,project:'FORTUNA',language:'en',theme:'dark'});
});
test('invalid storage restores the explicit focus and graphite default', () => {
  for (const raw of ['broken','null','[]','{"version":1,"project":"OTHER","theme":"unknown","language":"xx"}','{"version":0,"project":"FORTUNA"}']) {
    assert.deepEqual(M.readSettings(data,raw,'invalid'),{version:1,project:'UNREAL',language:'de',theme:'dark'});
  }
});
test('query language takes precedence, saved language is used without a query', () => {
  const raw = JSON.stringify({version:1,language:'en'});
  assert.equal(M.readSettings(data,raw,'de').language,'de');
  assert.equal(M.readSettings(data,raw,null).language,'en');
});
test('unknown project choices and groups are rejected', () => {
  assert.throws(()=>M.select(data,'made-up')); assert.throws(()=>M.filter(data,'not-a-group',''));
});
test('search covers German, English and full repository names', () => {
  assert.equal(M.filter(data,'all','bodenkontakt')[0].id,'UNREAL');
  assert.equal(M.filter(data,'all','anatomical')[0].id,'UNREAL');
  assert.equal(M.filter(data,'all','Juri-Halveth/fortuna')[0].id,'FORTUNA');
  assert.equal(M.filter(data,'learning','anatomical').length,0);
});
test('every group partitions the same inventory without dropping a source', () => {
  const partitions = M.GROUPS.filter(g=>g!=='all').flatMap(g=>M.filter(data,g,''));
  assert.equal(partitions.length,17); assert.equal(new Set(partitions.map(p=>p.id)).size,17);
  assert.equal(M.filter(data,'all','').length,17);
});
test('time display is bound to Berlin and handles daylight and winter offsets', () => {
  assert.match(M.dateLabel('2026-10-04T19:43:15Z','de'),/21:43/);
  assert.match(M.dateLabel('2026-12-04T19:43:15Z','en'),/20:43/);
  assert.throws(()=>M.dateLabel('invalid','de'));
});
test('draft branches and merged Fortuna remain visibly different source states', () => {
  assert.equal(M.select(data,'UNREAL').prState,'OPEN_DRAFT');
  assert.equal(M.select(data,'MORROWIND').prState,'OPEN_DRAFT');
  assert.equal(M.select(data,'FORTUNA').prState,'MERGED');
  assert.match(M.field(M.select(data,'UNREAL'),'state','en'),/draft/);
});
test('generated script roundtrips the exact source atlas', () => {
  const context = {window:{}}; vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root,'space-data.js'),'utf8'),context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.window.JurisSpaceData)),data);
});
test('static fallback contains all project links and retains archive and licensing', () => {
  const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.equal((html.match(/<article class="project-card"/g)||[]).length,17);
  for (const p of data.projects) assert.ok(html.includes('data-project="'+p.id+'"'));
  for (const file of ['LICENSES.md','HALVETH-RIGHTS.md','werkzertifikate/index.html','schuelervz-halveth/index.html']) assert.ok(fs.existsSync(path.join(root,file)));
  assert.ok(html.includes('connect-src \'none\''));
  assert.ok(html.includes('security@halveth.de'));
});
