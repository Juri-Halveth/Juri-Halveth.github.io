'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),{validateSceneCatalog,renderHero,renderSceneShowcase}=require('../tools/render-showcase.cjs');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/scene-stage.json'),'utf8'));
test('the first screen presents three actual scene captures and an accessible demo entry in every language',()=>{
 for(const lang of ['de','en','ru']){
  const doc=new JSDOM(renderHero(catalog,lang)+renderSceneShowcase(catalog,lang)).window.document;
  assert.equal(doc.querySelectorAll('h1').length,1);assert.equal(doc.querySelectorAll('.scene-wall img').length,3);
  assert.equal(doc.querySelector('.hero-actions a').getAttribute('href'),'#scene-lab');assert.ok(doc.getElementById('scene-lab'));
  for(const image of doc.querySelectorAll('.scene-wall img'))assert.ok(image.alt.length>10);
  assert.equal(doc.querySelectorAll('iframe,canvas').length,0);assert.equal(doc.querySelectorAll('[data-feature]').length,3);
  assert.ok(doc.querySelector('a[href*="5c2260f85d5275c15082c5c7d38ae51a143a5688"]'));
 }
});
test('scene assets and the retained ENDECK model are byte-bound with a finite mobile payload',()=>{
 assert.equal(validateSceneCatalog(catalog,root),catalog);assert.ok(catalog.scenes.reduce((sum,s)=>sum+s.bytes,0)<400000);
 for(const scene of catalog.scenes)assert.notEqual(scene.sourceSha256,scene.sha256,'A conversion must not pretend to preserve original source bytes');
 const altered=structuredClone(catalog);altered.scenes[0].sha256='0'.repeat(64);assert.throws(()=>validateSceneCatalog(altered,root),/byte mismatch/);
 altered.scenes[0]=catalog.scenes[0];altered.model.sha256='0'.repeat(64);assert.throws(()=>validateSceneCatalog(altered,root),/Model byte mismatch/);
});
test('missing scenes, languages, source revisions and executable URLs fail closed',()=>{
 const changes=[x=>x.scenes.pop(),x=>x.scenes[0].revision='main',x=>x.scenes[1].href='javascript:alert(1)',x=>x.scenes[1].image='/../private.webp',x=>delete x.scenes[2].purpose.ru];
 for(const change of changes){const altered=structuredClone(catalog);change(altered);assert.throws(()=>validateSceneCatalog(altered));}
 assert.throws(()=>renderHero(catalog,'unknown'),/Unknown/);
});
test('presentation strings are escaped while the model has native usable controls',()=>{
 const altered=structuredClone(catalog);altered.scenes[0].title.de='<script>fake proof</script>';
 const doc=new JSDOM(renderHero(altered,'de')+renderSceneShowcase(altered,'de')).window.document;
 assert.equal(doc.querySelectorAll('script,iframe').length,0);assert.equal(doc.querySelector('img').alt,'<script>fake proof</script>');
 assert.equal(doc.querySelectorAll('button').length,2);assert.equal(doc.querySelector('label[for="scene-time"]').htmlFor,'scene-time');
 assert.equal(doc.querySelectorAll('svg circle').length,8);
 assert.equal(new Set([...doc.querySelectorAll('[id]')].map(x=>x.id)).size,doc.querySelectorAll('[id]').length);
});
test('generated entrances use the model controller, translated routes and exactly one page title',()=>{
 for(const lang of ['','en/','ru/'])for(const route of ['','profil/']){
  const page=path.join(root,lang,route,'index.html'),doc=new JSDOM(fs.readFileSync(page,'utf8')).window.document;
  assert.equal(doc.querySelectorAll('h1').length,1);assert.equal(doc.querySelectorAll('script[type="module"][src$="scene-stage.mjs"]').length,1);
  assert.equal(doc.querySelectorAll('[data-ambient-motion]').length,0);
  assert.equal(path.resolve(path.dirname(page),doc.querySelector('.hero-actions a:nth-child(2)').getAttribute('href')),path.join(root,lang,'koennen'));
  assert.equal(path.resolve(path.dirname(page),doc.querySelector('link[href$="showcase.css"]').getAttribute('href')),path.join(root,'showcase.css'));
 }
});
test('the full directory exposes each observed public repository once without pretending audit completion',()=>{
 const snapshot=JSON.parse(fs.readFileSync(path.join(root,'data/public-repositories.json'),'utf8'));assert.equal(snapshot.repositories.length,18);
 for(const lang of ['','en/','ru/']){
  const doc=new JSDOM(fs.readFileSync(path.join(root,lang,'arbeiten/index.html'),'utf8')).window.document;
  const links=[...doc.querySelectorAll('.repository-list a')];assert.equal(links.length,18);
  assert.deepEqual(links.map(a=>a.getAttribute('href')).sort(),snapshot.repositories.map(r=>r.url).sort());
 }
 assert.match(snapshot.coverage,/not a full security audit/);
});
