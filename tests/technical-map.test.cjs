'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {JSDOM}=require('jsdom');
const {validateMap,renderTechnicalMap}=require('../tools/render-technical-map.cjs');
const root=path.resolve(__dirname,'..');
const bytes=fs.readFileSync(path.join(root,'data/technical-map.json'));
const data=JSON.parse(bytes),provenance=JSON.parse(fs.readFileSync(path.join(root,'data/technical-map-source.json'),'utf8'));
test('canonical map copy is bound to a profile revision and exact bytes',()=>{
 validateMap(data,provenance,bytes);
 assert.equal(provenance.sha256,crypto.createHash('sha256').update(bytes).digest('hex'));
 assert.throws(()=>validateMap(data,provenance,Buffer.concat([bytes,Buffer.from(' ')])),/differs from/);
});
test('mutable versions, mismatched URLs, invalid spans and runtime promotion fail closed',()=>{
 for(const mutate of [
  d=>d.items[0].evidence[0].revision='main',
  d=>d.items[0].evidence[0].url='https://example.invalid',
  d=>d.items[0].evidence[0].startLine=0,
  d=>d.items[0].review='PRODUCTION_VERIFIED',
  d=>d.connections[0].items.push('unknown-runtime')
 ]){
  const copy=structuredClone(data);mutate(copy);
  assert.throws(()=>validateMap(copy,provenance,bytes));
 }
});
test('each language renders all samples, bounded scopes and usable source links',()=>{
 for(const lang of ['de','en','ru']){
  const prefix=lang==='de'?'':lang+'/';
  const doc=new JSDOM(fs.readFileSync(path.join(root,prefix+'koennen/index.html'),'utf8')).window.document;
  assert.equal(doc.querySelectorAll('h1').length,1);
  assert.equal(doc.querySelectorAll('[data-sample]').length,data.items.length);
  assert.equal(doc.querySelectorAll('.map-area').length,data.areas.length);
  assert.equal(doc.querySelectorAll('.map-pattern-grid article').length,data.connections.length);
  assert.equal(doc.querySelectorAll('[data-project]').length,0,'map does not repeat the entire project catalog');
  for(const item of data.items){
   const card=doc.getElementById('sample-'+item.id);assert.ok(card);
   assert.ok(card.querySelector('details > summary'));
   assert.ok(card.textContent.includes(item.scope[lang]));
   for(const e of item.evidence)assert.ok([...card.querySelectorAll('a')].some(a=>a.href===e.url));
  }
  for(const a of doc.querySelectorAll('a[href^="#"]'))assert.ok(doc.getElementById(a.hash.slice(1)),a.href);
  assert.match(doc.querySelector('meta[http-equiv="Content-Security-Policy"]').content,/connect-src 'none'/);
 }
});
test('map text stays text and evidence remains available without JavaScript',()=>{
 const copy=structuredClone(data);copy.items[0].summary.de='<img src=x onerror=alert(1)>';
 const doc=new JSDOM(renderTechnicalMap(copy,'de',provenance)).window.document;
 assert.equal(doc.querySelectorAll('script,img').length,0);
 assert.ok(doc.querySelector('[data-sample]').textContent.includes('<img src=x'));
 assert.equal(doc.querySelectorAll('details').length,data.items.length);
});
test('profile and overview point to the map while keeping the project catalog',()=>{
 for(const prefix of ['','en/','ru/'])for(const route of ['','profil/']){
  const page=path.join(root,prefix+route+'index.html');const doc=new JSDOM(fs.readFileSync(page,'utf8')).window.document;
  assert.equal(path.resolve(path.dirname(page),doc.querySelector('.map-teaser a').getAttribute('href')),path.join(root,prefix,'koennen'));
  assert.equal(doc.querySelectorAll('[data-project]').length,14);
 }
});
