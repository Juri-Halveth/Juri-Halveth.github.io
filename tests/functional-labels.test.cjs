'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const aliases=/\b(?:SCARLET|ENDECK|ASTRALIS|ASHBOUND|FORTUNA|TRIAD)\b/i;
function checkLabels(doc){
 assert.doesNotMatch(doc.title,/\b(?:HALVETH|SCARLET|ENDECK|ASTRALIS|ASHBOUND|FORTUNA|TRIAD)\b/i);
 const main=doc.querySelector('main').cloneNode(true);
 // Exact source identities remain visible in explicitly technical evidence.
 main.querySelectorAll('pre,code,.map-evidence,.evidence-ci,.source-caption,.evidence-case>.eyebrow').forEach(e=>e.remove());
 const found=main.textContent.match(aliases);
 assert.equal(found,null,'Project alias in visible copy: '+(found?.[0]||''));
 for(const node of doc.querySelectorAll('h1,h2,h3,figcaption,.scene-caption,.repository-list a')){
  assert.doesNotMatch(node.textContent,aliases);
 }
 for(const image of doc.querySelectorAll('img'))assert.doesNotMatch(image.alt,aliases);
 for(const meta of doc.querySelectorAll('meta[name="description"],meta[property="og:title"],meta[property="og:description"]')){
  assert.doesNotMatch(meta.content,aliases);
 }
}
test('public entrances and cards describe functions in every language while retaining source identities',()=>{
 for(const prefix of ['','en/','ru/'])for(const route of ['','profil/','arbeiten/','koennen/','belege/','forschung/','modelle/','audits/','lernen/','motion/','handbuch/','pulsar/','zertifikate/','werkzertifikate/']){
  const doc=new JSDOM(fs.readFileSync(path.join(root,prefix,route,'index.html'),'utf8')).window.document;
  checkLabels(doc);
  if(!route){
   assert.deepEqual([...doc.querySelectorAll('[data-scene]')].map(e=>e.dataset.scene),['scarlet','endeck']);
   assert.match(doc.querySelector('[data-scene="scarlet"]').href,/\/halveth-scarlet\//);
  }
 }
 const doc=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8')).window.document;
 doc.querySelector('h1').textContent='SCARLET';
 assert.throws(()=>checkLabels(doc),/SCARLET/);
});
test('every repository keeps its URL but uses a complete functional display title',()=>{
 const {validateRepositorySnapshot}=require('../tools/validate-projects.cjs');
 const data=JSON.parse(fs.readFileSync(path.join(root,'data/public-repositories.json'),'utf8'));
 const doc=new JSDOM(fs.readFileSync(path.join(root,'arbeiten/index.html'),'utf8')).window.document;
 const links=[...doc.querySelectorAll('.repository-list a')];
 assert.equal(links.length,data.repositories.length);
 for(let i=0;i<links.length;i++){
  assert.equal(links[i].getAttribute('href'),data.repositories[i].url);
  assert.equal(links[i].textContent,data.repositories[i].displayTitle.de+' ↗');
 }
 const incomplete=structuredClone(data);delete incomplete.repositories[0].displayTitle.ru;
 assert.throws(()=>validateRepositorySnapshot(incomplete),/functional repository title/);
});
