'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const {renderProjectEntrance}=require('../tools/render-project-entrance.cjs');
const {makeNetworkIndex}=require('../tools/build-network-index.cjs');
const root=path.resolve(__dirname,'..');

test('public entrance uses the inventory observation rather than relabelling the older curated snapshot',()=>{
 const {search}=makeNetworkIndex(root);
 for(const lang of ['de','en','ru']){
  const doc=new JSDOM(renderProjectEntrance(search,lang),{url:'https://juri-halveth.github.io/'}).window.document;
  assert.equal(doc.querySelector('.entrance-current strong').textContent,String(search.counts.repositories));
  assert.equal(doc.querySelector('.entrance-current time').dateTime,search.observedAt);
  assert.equal(new URL(doc.querySelector('[data-primary-entrance]').href).pathname,'/universum/');
  const prefix=lang==='de'?'/':`/${lang}/`;
  assert.ok(doc.querySelector(`a[href="${prefix}suche/"]`));
  assert.ok(doc.querySelector(`a[href="${prefix}profil/"]`));
  assert.ok(doc.querySelector('a[href="https://juri-halveth.github.io/console-only/"]'));
  assert.ok(doc.querySelector('a[href="/universum/faden/"]'));
  const page=new JSDOM(fs.readFileSync(path.join(root,prefix.slice(1),'index.html'),'utf8')).window.document;
  for(const id of ['contact','featured']) assert.ok(page.querySelector('a[href="#'+id+'"]') && page.getElementById(id), id);
  for(const code of ['de','en','ru','x-default']) assert.equal(page.querySelector(`link[hreflang="${code}"]`).href,'https://juri-halveth.github.io/'+(['de','x-default'].includes(code)?'':code+'/'));
  for(const file of ['impressum','datenschutz']) assert.ok(page.querySelector('footer a[href="https://halveth.de/'+file+'.html"]'));
 }
 const later=structuredClone(search);later.counts.repositories+=1;later.observedAt='2026-12-01T10:00:00Z';
 const doc=new JSDOM(renderProjectEntrance(later,'de')).window.document;
 assert.equal(doc.querySelector('.entrance-current strong').textContent,String(later.counts.repositories));
 assert.equal(doc.querySelector('time').dateTime,later.observedAt);
});

test('the historical evidence URL keeps its records and offers direct project and profile paths without scripting',()=>{
 const samples=require('../data/work-samples.json');
 for(const lang of ['','en/','ru/']){
  const doc=new JSDOM(fs.readFileSync(path.join(root,lang,'belege/index.html'),'utf8'),{url:`https://juri-halveth.github.io/${lang}belege/`}).window.document;
  assert.equal(doc.querySelectorAll('h1').length,1);
  assert.equal(new URL(doc.querySelector('.evidence-entry .button').href).pathname,'/universum/');
  assert.ok(doc.querySelector(`a[href="${lang?'../../'+lang:'../'}profil/"]`));
  for(const sample of samples.samples){
   const item=doc.getElementById(sample.id);
   assert.ok(item.querySelector('details.evidence-detail:not([open]) summary'));
   assert.ok(item.querySelector(`a[href*="/blob/${sample.revision}/"]`));
   assert.ok(item.querySelector(`a[href$="/actions/runs/${sample.ci.id}"]`));
  }
 }
});

test('visitor names find an existing corridor or the clearly unpublished LUCINETA draft',async()=>{
 const {searchNetwork}=await import('../network-search.mjs');
 const {search}=makeNetworkIndex(root);
 assert.ok(searchNetwork(search,'Korridor').some(row=>row.id==='module:console-only:korridot'));
 const draft=searchNetwork(search,'LUCINETA').find(row=>row.id==='module:website:lucineta-draft');
 assert.ok(draft);
 assert.equal(draft.url,'https://github.com/Juri-Halveth/Juri-Halveth.github.io/pull/83');
 assert.match(draft.summary.de,/noch nicht veröffentlicht/);
});
