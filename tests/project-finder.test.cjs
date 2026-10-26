'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom'),root=path.resolve(__dirname,'..');

test('a visitor can narrow real projects, get an honest empty result and recover in all three languages',async()=>{
 const {mountProjectFinder}=await import('../project-finder.mjs');
 for(const prefix of ['','en/','ru/']){
  const {window}=new JSDOM(fs.readFileSync(path.join(root,prefix,'arbeiten/index.html'),'utf8'));
  const doc=window.document,cards=[...doc.querySelectorAll('[data-project]')];
  assert.equal(cards.length,10);mountProjectFinder(doc);
  const input=doc.getElementById('project-search');
  input.value='nonsense-no-project';input.dispatchEvent(new window.Event('input'));
  assert.equal(cards.filter(card=>!card.hidden).length,0);assert.equal(doc.getElementById('project-empty').hidden,false);
  doc.getElementById('project-clear').click();assert.equal(cards.filter(card=>!card.hidden).length,10);
  doc.querySelector('[data-project-filter="learning"]').click();
  assert.equal(cards.filter(card=>!card.hidden).length,2);assert.ok(cards.filter(card=>!card.hidden).every(card=>card.dataset.category==='learning'));
  doc.querySelector('[data-project-filter="all"]').click();
  input.value='tReSoR';input.dispatchEvent(new window.Event('input'));
  assert.equal(cards.filter(card=>!card.hidden).length,1);assert.equal(cards.find(card=>!card.hidden).dataset.project,'halveth-tresor');
  window.close();
 }
});

test('the catalogue stays readable without JavaScript and generated pages load their actual filter',()=>{
 for(const prefix of ['','en/','ru/'])for(const route of ['','profil/','arbeiten/']){
  const doc=new JSDOM(fs.readFileSync(path.join(root,prefix,route,'index.html'),'utf8')).window.document;
  assert.equal(doc.querySelectorAll('[data-project]').length,10);
  assert.equal(doc.querySelectorAll('[data-project][hidden]').length,0);
  assert.ok(doc.querySelector('script[type="module"][src$="project-finder.mjs"]'));
 }
});
