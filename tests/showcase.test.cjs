'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),{renderShowcase}=require('../tools/render-showcase.cjs');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/projects.json')));
test('featured work offers three direct entries and a dated local receipt in every language',()=>{
 for(const lang of ['de','en','ru']){
  const doc=new JSDOM(renderShowcase(catalog.projects,lang)).window.document;
  assert.equal(doc.querySelectorAll('[data-feature]').length,3);
  const native=doc.querySelector('[data-feature="ashbound-native"]');
  assert.match(native.querySelector('.button').href,/releases\/tag\/ashbound-native-v0\.4\.2-portal-preview$/);
  assert.match(native.innerHTML,/b768ca093d9bd68b1453a8ccc5b6d02ecaa1eb07/);
  const lab=doc.querySelector('[data-feature="halveth-forschungslabor"]');
  assert.match(lab.textContent,/141 JavaScript \+ 49 Python/);
  assert.ok(lab.querySelector('a[href="/docs/WORK-SAMPLE-VALIDATION-2026-10-22.md"]'));
  assert.ok(doc.querySelector('[data-feature="scarlet-browser"] a[href$="/singularity-cannon/"]'));
  assert.ok(doc.querySelector('[data-feature="scarlet-browser"] img[alt][src="/assets/scarlet-cannon-live.jpg"]'));
 }
});
test('the public demo capture is bound to its actual bytes and observation scope',()=>{
 const records=JSON.parse(fs.readFileSync(path.join(root,'assets/ASSET-SOURCES.json'),'utf8')).records;
 const capture=records.find(x=>x.path==='assets/scarlet-cannon-live.jpg');
 assert.equal(capture.transfer,'BROWSER_SCREENSHOT');
 assert.equal(capture.sourceRevision,'UNKNOWN_FOR_LIVE_RESPONSE');
 assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,capture.path))).digest('hex'),capture.sha256);
});
test('a missing flagship or unpinned source fails rather than presenting a stale work sample',()=>{
 assert.throws(()=>renderShowcase(catalog.projects.filter(p=>p.id!=='ashbound-native'),'de'),/Source-bound/);
 const altered=structuredClone(catalog.projects);
 altered.find(p=>p.id==='halveth-forschungslabor').revision='main';
 assert.throws(()=>renderShowcase(altered,'de'),/Pinned/);
 assert.throws(()=>renderShowcase(catalog.projects,'unknown'),/Unknown/);
});
test('showcase text is escaped while links and native navigation remain usable without scripts',()=>{
 const altered=structuredClone(catalog.projects);
 altered.find(p=>p.id==='ashbound-native').imageAlt.de='<script>fake proof</script>';
 const doc=new JSDOM(renderShowcase(altered,'de')).window.document;
 assert.equal(doc.querySelectorAll('script,iframe').length,0);
 assert.equal(doc.querySelector('img').alt,'<script>fake proof</script>');
 assert.equal(doc.querySelectorAll('.route-grid a').length,3);
 assert.equal(new Set([...doc.querySelectorAll('[id]')].map(x=>x.id)).size,doc.querySelectorAll('[id]').length);
});
test('homepage hero and showcase use shared stylesheet and preserve both navigation routes',()=>{
 for(const lang of ['','en/','ru/']){
  const page=path.join(root,lang,'index.html');const doc=new JSDOM(fs.readFileSync(page,'utf8')).window.document;
  assert.equal(doc.querySelectorAll('h1').length,1);
  assert.equal(path.resolve(path.dirname(page),doc.querySelector('.hero-actions a').getAttribute('href')),path.join(root,lang,'belege'));
  assert.equal(path.resolve(path.dirname(page),doc.querySelector('.hero-actions a:nth-child(2)').getAttribute('href')),path.join(root,lang,'koennen'));
  assert.equal(path.resolve(path.dirname(page),doc.querySelector('link[href$="showcase.css"]').getAttribute('href')),path.join(root,'showcase.css'));
  assert.equal(doc.querySelectorAll('.hero-facts li').length,3);
 }
});
