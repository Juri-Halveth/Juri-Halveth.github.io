'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),{validateSceneCatalog,renderHero,renderSceneShowcase}=require('../tools/render-showcase.cjs');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/scene-stage.json'),'utf8'));
test('the first screen presents two actual scene captures and an accessible demo entry in every language',()=>{
 for(const lang of ['de','en','ru']){
  const doc=new JSDOM(renderHero(catalog,lang)+renderSceneShowcase(catalog,lang)).window.document;
  assert.equal(doc.querySelectorAll('h1').length,1);assert.equal(doc.querySelectorAll('.scene-wall img').length,2);
  const primary=catalog.scenes.find(s=>s.id==='scarlet').href+(lang==='de'?'':'?lang='+lang);
  assert.equal(doc.querySelector('.hero-actions a').getAttribute('href'),primary);
  assert.equal(doc.querySelector('[data-scene="scarlet"]').getAttribute('href'),primary);
  assert.equal(doc.querySelector('[data-feature="halveth-scarlet"] a').getAttribute('href'),primary);
  assert.equal(doc.querySelector('.hero-actions a:nth-child(2)').getAttribute('href'),'#scene-lab');assert.ok(doc.getElementById('scene-lab'));
  assert.deepEqual([...doc.querySelectorAll('[data-scene]')].map(s=>s.dataset.scene),['scarlet','endeck']);
  assert.equal(doc.querySelector('.scene-mechanism summary').textContent,require('../tools/render-showcase.cjs').words[lang].mechanismTitle);
  for(const image of doc.querySelectorAll('.scene-wall img'))assert.ok(image.alt.length>10);
  assert.equal(doc.querySelectorAll('iframe,canvas').length,0);assert.equal(doc.querySelectorAll('[data-feature]').length,2);
  assert.equal(doc.querySelector('a[href*="halveth-unreal"]'),null);
 }
});
test('scene assets and the retained ENDECK model are byte-bound with a finite mobile payload',()=>{
 assert.equal(validateSceneCatalog(catalog,root),catalog);assert.ok(catalog.scenes.reduce((sum,s)=>sum+s.bytes,0)<400000);
 for(const scene of catalog.scenes)assert.notEqual(scene.sourceSha256,scene.sha256,'A conversion must not pretend to preserve original source bytes');
 const altered=structuredClone(catalog);altered.scenes[0].sha256='0'.repeat(64);assert.throws(()=>validateSceneCatalog(altered,root),/byte mismatch/);
 altered.scenes[0]=catalog.scenes[0];altered.model.sha256='0'.repeat(64);assert.throws(()=>validateSceneCatalog(altered,root),/Model byte mismatch/);
});
test('missing scenes, languages, source revisions and executable URLs fail closed',()=>{
 const changes=[x=>x.schema='halveth.scene-stage.v1',x=>x.scenes.pop(),x=>x.scenes[0].revision='main',x=>x.scenes[1].href='javascript:alert(1)',x=>x.scenes[1].image='/../private.webp',x=>x.scenes[1].image=x.scenes[0].image,x=>delete x.scenes[1].purpose.ru];
 for(const change of changes){const altered=structuredClone(catalog);change(altered);assert.throws(()=>validateSceneCatalog(altered));}
 assert.throws(()=>renderHero(catalog,'unknown'),/Unknown/);
});

test('scene identity and browser source stay coupled before HTML emission',()=>{
 for(const change of [d=>d.scenes[0].project='other" data-fixture="x',d=>d.scenes[0].revision='main',d=>d.scenes[1].source='https://juri-halveth.github.io/fortuna/']){
  const altered=structuredClone(catalog);change(altered);assert.throws(()=>validateSceneCatalog(altered));
 }
});
test('presentation strings are escaped while the model has native usable controls',()=>{
 const altered=structuredClone(catalog);altered.scenes[0].title.de='<script>fake proof</script>';
 const doc=new JSDOM(renderHero(altered,'de')+renderSceneShowcase(altered,'de')).window.document;
  assert.equal(doc.querySelectorAll('script,iframe').length,0);assert.equal(doc.querySelector('[data-scene="scarlet"] img').alt,catalog.scenes[0].alt.de);assert.equal(doc.querySelector('[data-scene="scarlet"] .scene-caption strong').textContent,'<script>fake proof</script>');
 assert.equal(doc.querySelectorAll('button').length,2);assert.equal(doc.querySelector('label[for="scene-time"]').htmlFor,'scene-time');
 assert.equal(doc.querySelectorAll('svg circle').length,8);
 assert.equal(new Set([...doc.querySelectorAll('[id]')].map(x=>x.id)).size,doc.querySelectorAll('[id]').length);
});
test('generated entrances use the model controller, translated routes and exactly one page title',()=>{
 for(const lang of ['','en/','ru/'])for(const route of ['','profil/']){
  const page=path.join(root,lang,route,'index.html'),doc=new JSDOM(fs.readFileSync(page,'utf8')).window.document;
  assert.equal(doc.querySelectorAll('h1').length,1);assert.equal(doc.querySelectorAll('script[type="module"][src$="scene-stage.mjs"]').length,1);
  assert.equal(doc.querySelectorAll('[data-ambient-motion]').length,0);
  assert.equal(path.resolve(path.dirname(page),doc.querySelector('.hero-actions a:nth-child(3)').getAttribute('href')),path.join(root,lang,'koennen'));
  const stylesheet=doc.querySelector('link[rel="stylesheet"][href*="showcase.css"]').getAttribute('href'),[stylesheetPath,stylesheetQuery]=stylesheet.split('?');
  assert.equal(path.resolve(path.dirname(page),stylesheetPath),path.join(root,'showcase.css'));
  assert.equal(new URLSearchParams(stylesheetQuery).get('v'),require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'showcase.css'),'utf8').replace(/\r\n/g,'\n')).digest('hex'));
 }
});
test('display order preserves every source packet exactly once and rejects incomplete or invented identities',()=>{
 const {presentationScenes}=require('../tools/render-showcase.cjs');
 assert.deepEqual(catalog.scenes.map(s=>s.id),['scarlet','endeck']);
 assert.deepEqual(presentationScenes(catalog).map(s=>s.id),['scarlet','endeck']);
 for(const order of [undefined,[],['scarlet'],['scarlet','scarlet'],['scarlet','unknown']]){
  const altered=structuredClone(catalog);altered.presentationOrder=order;
  assert.throws(()=>renderHero(altered,'de'),/presentation order/);
 }
});
test('the curated directory exposes each selected repository once without pretending a complete account inventory',()=>{
 const snapshot=JSON.parse(fs.readFileSync(path.join(root,'data/public-repositories.json'),'utf8'));assert.equal(snapshot.repositories.length,15);
 for(const lang of ['','en/','ru/']){
  const doc=new JSDOM(fs.readFileSync(path.join(root,lang,'arbeiten/index.html'),'utf8')).window.document;
  const links=[...doc.querySelectorAll('.repository-list a')];assert.equal(links.length,15);
  assert.deepEqual(links.map(a=>a.getAttribute('href')).sort(),snapshot.repositories.map(r=>r.url).sort());
 }
 assert.match(snapshot.coverage,/not a complete account inventory/);
});
