'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
const {guideLink,renderVisitorCorridor}=require('../tools/render-visitor-corridor.cjs');
test('each homepage reaches a real native example in the same-language project directory',()=>{
 for(const lang of ['de','en','ru']){
  const prefix=lang==='de'?'':lang+'/';
  const home=new JSDOM(fs.readFileSync(prefix+'index.html','utf8'),{url:'https://juri-halveth.github.io/'+prefix}).window.document;
  const link=[...home.querySelectorAll('a')].find(a=>a.hash==='#beispiel-scarlet');
  assert.ok(link,'homepage must offer the example, not only a generic project list');
  assert.equal(link.pathname,'/'+prefix+'arbeiten/');
  const page=new JSDOM(fs.readFileSync(prefix+'arbeiten/index.html','utf8'),{url:'https://juri-halveth.github.io/'+prefix+'arbeiten/'}).window.document;
  const guide=page.getElementById('beispiel-scarlet');
  assert.equal(guide.tagName,'DETAILS');assert.ok(guide.querySelector('summary'));
  assert.deepEqual([...guide.querySelectorAll('[data-depth]')].map(x=>x.dataset.depth),['experience','understand','verify','build']);
  const launch=guide.querySelector('a.button');const url=new URL(launch.href);
  assert.equal(url.origin,'https://juri-halveth.github.io');
  assert.equal(url.pathname,'/halveth-scarlet/');assert.equal(url.searchParams.get('lang'),lang);
  for(const term of ['Meine erste Idee.','Meine erste Idee bekommt eine Fortsetzung.','zustaende-zeit.json','contentLedger.projection.states','parents[0].id','ecology.modelMs','1000'])assert.ok(guide.textContent.includes(term),term);
  assert.ok(page.getElementById(guide.querySelector('a[href="#repositories"]').hash.slice(1)));
 }
});
test('unsupported languages fail instead of silently showing another language',()=>{
 assert.throws(()=>renderVisitorCorridor('fr'),/Unsupported/);assert.throws(()=>guideLink('fr'),/Unsupported/);
});

