'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const {validateSiteCatalog}=require('../tools/site-catalog.cjs');
const root=path.resolve(__dirname,'..');
const catalog=require('../data/site-catalog.json');
const read=route=>new JSDOM(fs.readFileSync(path.join(root,route,'index.html'),'utf8')).window.document;

test('one public source binds 18 repository entries, 16 projects and the 13 active portfolio cards',()=>{
 assert.equal(validateSiteCatalog(catalog),catalog);
 const projects=catalog.projects.filter(p=>p.site.entry_type==='PROJECT');
 assert.equal(projects.length,16);
 assert.equal(catalog.projects.filter(p=>p.site.entry_type==='META').length,2);
 assert.deepEqual(projects.filter(p=>p.site.editorial_state==='WITHDRAWN_FROM_PORTFOLIO').map(p=>p.id).sort(),['halveth-morrowind-genesis','halveth-realms','halveth-unreal']);
 const lab=fs.readFileSync(path.join(root,'universum/data/catalog.js'),'utf8');
 assert.equal(lab,'window.HALVETH_CATALOG =\n'+JSON.stringify(catalog,null,2)+';\n');
 for(const lang of ['','en/','ru/']){
  const doc=read(lang+'arbeiten/');
  const cards=[...doc.querySelectorAll('.directory-project')];
  assert.equal(cards.length,13);
  assert.equal(new Set(cards.map(c=>c.dataset.project)).size,13);
  assert.equal(doc.querySelectorAll('.directory-meta li').length,2);
  assert.ok(doc.querySelector('.category-toggle summary'));
  for(const card of cards){
   const p=catalog.projects.find(row=>row.id===card.dataset.project);
   assert.equal(p.site.editorial_state,'CURRENT');
   const expected=p.id==='halveth-scarlet'&&lang?`${p.url}?lang=${lang.slice(0,2)}`:p.url;
   assert.equal(card.querySelector('.directory-actions .button').getAttribute('href'),expected);
   const source=card.querySelector('.directory-actions .text-link');
   assert.equal(source.getAttribute('href'),p.source_url);
   if(p.site.revision){assert.ok(source.textContent.includes(p.site.revision.slice(0,7)));assert.ok(source.textContent.includes(p.site.revision_observed_at));}
   else assert.ok(source.textContent.length>12);
   if(!lang&&p.site.status==='BROWSER_ENTRY')assert.equal(card.querySelector('.work-kind').textContent,'Im Browser verfügbar');
  }
 }
});

test('SCARLET direct actions preserve the requested language in the directory',()=>{
 for(const [route,lang] of [['arbeiten/','de'],['en/arbeiten/','en'],['ru/arbeiten/','ru']]){
  const doc=read(route);
  const url=new URL(doc.querySelector('[data-project="halveth-scarlet"] .directory-actions .button').getAttribute('href'));
  assert.equal(url.pathname,'/halveth-scarlet/');
  assert.equal(url.searchParams.get('lang'),lang==='de'?null:lang);
 }
});

test('catalog rejects duplicate identity, wrong source revision, URL origin and withdrawn reentry',()=>{
 const bad=change=>{const copy=structuredClone(catalog);change(copy);assert.throws(()=>validateSiteCatalog(copy));};
 bad(x=>x.projects[1].id=x.projects[0].id);
 bad(x=>x.projects[0].source_url='https://github.com/Juri-Halveth/halveth-scarlet/tree/main');
 bad(x=>x.projects[0].url='javascript:alert(1)');
 bad(x=>x.projects[0].site.status='SOURCE_AND_GUIDE');
 bad(x=>x.source_date='2026-02-30');
 bad(x=>x.projects[0].site.revision_observed_at='2026-02-30');
 bad(x=>x.projects.find(p=>p.id==='halveth-tresor').site.release_tag='v2.0.0');
 bad(x=>x.projects.find(p=>p.id==='halveth-tron-security-lab').site.pr_number=2);
 bad(x=>x.projects.find(p=>p.id==='halveth-realms').site.editorial_state='CURRENT');
});

test('release, research PR and browser vault actions lead to their stated destinations',()=>{
 const tresor=catalog.projects.find(p=>p.id==='halveth-tresor');
 const tron=catalog.projects.find(p=>p.id==='halveth-tron-security-lab');
 const wallet=catalog.projects.find(p=>p.id==='leviathan-wallet-portal');
 assert.equal(tresor.site.status,'RELEASE_ENTRY');
 assert.equal(tresor.url,'https://github.com/Juri-Halveth/halveth-tresor/releases/tag/v1.8.0');
 assert.match(tresor.site.summary.de,/nicht code-signiert/);
 assert.equal(tron.site.status,'PR_ENTRY');
 assert.equal(tron.url,'https://github.com/Juri-Halveth/halveth-tron-security-lab/pull/1');
 assert.equal(wallet.site.status,'BROWSER_ENTRY');
 assert.equal(wallet.url,'https://juri-halveth.github.io/leviathan-wallet-portal/');
 assert.match(wallet.site.summary.de,/Wallet-Freigabe.*Netzwerkgebühren/);
 for(const lang of ['','en/','ru/']){
  const doc=read(lang+'arbeiten/');
  for(const [id,project] of [['halveth-tresor',tresor],['halveth-tron-security-lab',tron],['leviathan-wallet-portal',wallet]]){
   const card=doc.querySelector(`[data-project="${id}"]`);
   assert.equal(card.querySelector('.directory-actions .button').getAttribute('href'),project.url);
   assert.ok(card.textContent.includes(project.site.summary[lang?lang.slice(0,2):'de']));
   assert.ok(card.querySelector('.work-kind').textContent.trim());
  }
  assert.ok(doc.querySelector('[data-project="halveth-tresor"] .work-kind').textContent.includes('v1.8.0'));
  assert.ok(doc.querySelector('[data-project="halveth-tron-security-lab"] .work-kind').textContent.includes('#1'));
 }
});

test('home has one hero, four distinct direct cards and four primary navigation links in each language',()=>{
 for(const lang of ['','en/','ru/']){
  const doc=read(lang);
  assert.equal(doc.querySelectorAll('main .service-hero').length,1);
  assert.equal(doc.querySelectorAll('main h1').length,1);
  assert.equal(doc.querySelectorAll('main .universe-gateway,main .scene-hero,main .scene-demo-band,main .map-teaser').length,0);
  assert.equal(doc.querySelectorAll('header .primary-nav a').length,4);
  const cards=[...doc.querySelectorAll('[data-featured-project]')];
  assert.equal(cards.length,4);
  assert.equal(new Set(cards.map(c=>c.dataset.featuredProject)).size,4);
  for(const card of cards)assert.ok(card.querySelector('.service-card-actions a.button[href^="https://"]'));
 }
});

test('legacy routes retain distinct destinations and learning cards come from the canonical catalog',()=>{
 const destinations=['audits/','handbuch/','pulsar/','zertifikate/','werkzertifikate/'];
 for(const lang of ['','en/','ru/']){
  const headings=[];
  for(const route of destinations){
   const doc=read(lang+route);
   assert.equal(doc.querySelectorAll('main h1').length,1);
   assert.equal(doc.querySelectorAll('.legacy-destination').length,1);
   assert.ok(doc.querySelector('.legacy-destination a.button'));
   headings.push(doc.querySelector('main h1').textContent);
  }
  assert.equal(new Set(headings).size,destinations.length);
  const learning=read(lang+'lernen/');
  const cards=[...learning.querySelectorAll('.directory-project')];
  assert.equal(cards.length,2);
  assert.deepEqual(cards.map(c=>c.dataset.project).sort(),catalog.projects.filter(p=>p.site.primary_category==='learning'&&p.site.editorial_state==='CURRENT').map(p=>p.id).sort());
  assert.equal(learning.querySelector('.project-finder'),null);
 }
});

test('handbook command retains a bounded horizontal scroll container',()=>{
 const css=fs.readFileSync(path.join(root,'portfolio.css'),'utf8');
 assert.match(css,/\.legacy-destination pre\{[^}]*max-width:100%;overflow-x:auto/);
 assert.match(css,/\.legacy-destination pre code\{[^}]*max-width:100%;overflow-x:auto/);
 assert.match(css,/\.legacy-destination h1\{[^}]*overflow-wrap:anywhere/);
 for(const lang of ['','en/','ru/']){
  const doc=read(lang+'handbuch/');
  assert.ok(doc.querySelector('.legacy-destination pre code'));
 }
});
