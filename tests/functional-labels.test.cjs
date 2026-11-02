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
  if(route==='modelle/'){
   assert.ok(doc.querySelector('#scene-lab'));
   assert.ok(doc.querySelector('script[src$="scene-stage.mjs"]'));
  }
 }
 const doc=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8')).window.document;
 doc.querySelector('h1').textContent='SCARLET';
 assert.throws(()=>checkLabels(doc),/SCARLET/);
});
test('the current directory keeps direct URLs and functional titles while withdrawn presentations stay out',()=>{
 const {validateRepositorySnapshot}=require('../tools/validate-projects.cjs');
 const data=JSON.parse(fs.readFileSync(path.join(root,'data/public-repositories.json'),'utf8'));
 const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/site-catalog.json'),'utf8'));
 const doc=new JSDOM(fs.readFileSync(path.join(root,'arbeiten/index.html'),'utf8')).window.document;
 const cards=[...doc.querySelectorAll('.directory-project')];
 assert.equal(cards.length,13);
 for(const card of cards){
  const project=catalog.projects.find(p=>p.id===card.dataset.project);assert.ok(project);
  assert.equal(project.site.editorial_state,'CURRENT');
  assert.equal(card.querySelector('h3').textContent,project.site.title.de);
  assert.equal(card.querySelector('.directory-actions a.button').getAttribute('href'),project.url);
 }
 assert.equal(doc.querySelectorAll('.directory-meta li').length,2);
 assert.equal(new Set(cards.map(card=>card.dataset.project)).size,13);
 const incomplete=structuredClone(data);delete incomplete.repositories[0].displayTitle.ru;
 assert.throws(()=>validateRepositorySnapshot(incomplete),/functional repository title/);
});
