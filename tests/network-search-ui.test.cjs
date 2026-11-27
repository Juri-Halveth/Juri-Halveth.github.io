'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const index=require('../universum/api/search.json');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('network search restores a shareable query and recovers from empty results in all languages',async()=>{
 const {mountNetworkSearch}=await import('../network-search-ui.mjs');
 for(const prefix of ['','en/','ru/']){
  const dom=new JSDOM(read(prefix+'suche/index.html'),{url:'https://juri-halveth.github.io/'+prefix+'suche/?q=GG24'});
  const doc=dom.window.document;mountNetworkSearch(doc,index);
  assert.equal(doc.getElementById('network-query').value,'GG24');
  assert.ok(doc.querySelector('[data-network-id="module:console-only:gg24"]'));
  doc.getElementById('network-query').value='nonexistent-unindexed-term-98236';
  doc.getElementById('network-query').dispatchEvent(new dom.window.Event('input'));
  assert.equal(doc.getElementById('network-empty').hidden,false);
  assert.equal(doc.querySelectorAll('[data-network-id]').length,0);
  doc.getElementById('network-clear').click();
  assert.equal(doc.getElementById('network-empty').hidden,true);
  assert.equal(new URL(dom.window.location.href).searchParams.has('q'),false);
  assert.equal(doc.activeElement.id,'network-query');
  assert.ok(doc.querySelectorAll('[data-network-id]').length>0);
  dom.window.close();
 }
});

test('the existing card search exposes GG24 from the wider network even with zero selected cards',async()=>{
 const {mountNetworkBridges}=await import('../network-search-ui.mjs');
 const {mountProjectFinder}=await import('../project-finder.mjs');
 for(const prefix of ['','en/','ru/']){
  const dom=new JSDOM(read(prefix+'arbeiten/index.html'),{url:'https://juri-halveth.github.io/'+prefix+'arbeiten/'});
  const doc=dom.window.document;mountNetworkBridges(doc,index);mountProjectFinder(doc);
  const input=doc.getElementById('project-search');input.value='GG24';input.dispatchEvent(new dom.window.Event('input'));
  assert.equal(doc.querySelectorAll('[data-project]:not([hidden])').length,0);
  assert.ok(doc.querySelector('[data-network-id="module:console-only:gg24"]'));
  assert.equal(new URL(doc.querySelector('[data-network-all]').href).searchParams.get('q'),'GG24');
  let resetInputs=0;input.addEventListener('input',()=>{if(input.value==='')resetInputs++;});
  doc.getElementById('project-clear').click();
  assert.equal(resetInputs,1);
  assert.equal(doc.querySelectorAll('[data-network-id]').length,0);
  assert.equal(new URL(doc.querySelector('[data-network-all]').href).searchParams.has('q'),false);
  assert.equal(doc.querySelectorAll('[data-project]:not([hidden])').length,13);
  dom.window.close();
 }
});

test('search data is rendered as text and unsafe result URLs are never activated',async()=>{
 const {mountNetworkSearch}=await import('../network-search-ui.mjs');
 const dom=new JSDOM(read('suche/index.html'),{url:'https://juri-halveth.github.io/suche/'});
 const hostile=structuredClone(index);const template=structuredClone(hostile.documents.find(d=>!d.historical));
 template.id='test:visible';template.title={de:'<img src=x onerror=alert(1)>',en:'Example',ru:'Example'};template.summary={de:'<script>alert(1)</script>'};
 hostile.documents=[template,{...template,id:'test:unsafe',url:'javascript:alert(1)'}];
 mountNetworkSearch(dom.window.document,hostile);
 assert.equal(dom.window.document.querySelectorAll('#network-results img,#network-results script').length,0);
 assert.equal(dom.window.document.querySelectorAll('[data-network-id="test:unsafe"]').length,0);
 assert.match(dom.window.document.querySelector('#network-results h3').textContent,/<img/);
 dom.window.close();
});

test('every generated language has canonical search, machine-readable sources and a no-script entry list',()=>{
 for(const prefix of ['','en/','ru/']){
  const dom=new JSDOM(read(prefix+'suche/index.html'),{url:'https://juri-halveth.github.io/'+prefix+'suche/'}),doc=dom.window.document;
  assert.equal(doc.querySelector('link[rel=canonical]').href,'https://juri-halveth.github.io/'+prefix+'suche/');
  assert.ok(doc.querySelector('noscript').textContent.includes('GG24'));
  assert.deepEqual([...doc.querySelectorAll('noscript a')].map(a=>a.getAttribute('href')).sort(),index.documents.filter(d=>!d.historical&&d.editorialState==='CURRENT').map(d=>d.url).sort());
  assert.ok(doc.querySelector('script[src$="network-search-ui.mjs"]'));
  assert.match(doc.querySelector('meta[http-equiv="Content-Security-Policy"]').content,/connect-src 'none'/);
  assert.ok(doc.querySelector('a[href$="universum/api/search.json"]'));
  dom.window.close();
 }
});

test('a translated product description keeps a visible revision link when its README advances',async()=>{
 const {mountNetworkSearch}=await import('../network-search-ui.mjs');
 const dom=new JSDOM(read('ru/suche/index.html'),{url:'https://juri-halveth.github.io/ru/suche/?q=NOVA'});
 const item=structuredClone(index.documents.find(d=>!d.historical && d.repositoryId==='repo:juri-halveth/lucinet-seedspace' && d.kind==='repository'));
 const revision=item.source.revision;
 item.priorDescription={title:{ru:'NOVA · Источники'},summary:{ru:'Проверенное описание проекта'},observedAt:'2026-11-17T18:00:00Z',revision,url:item.source.url};
 item.summary={de:'Fresh README excerpt',en:'Fresh README excerpt',ru:'Fresh README excerpt'};
 mountNetworkSearch(dom.window.document,{...index,documents:[item]});
 const article=dom.window.document.querySelector('article.network-result');
 assert.equal(article.querySelector('h3 a').textContent,'NOVA · Источники');
 assert.ok(article.textContent.includes('Проверенное описание проекта'));
 assert.ok([...article.querySelectorAll('a')].some(a=>a.href.includes(revision) && a.textContent.includes('2026-11-17')));
 assert.ok(article.querySelector('details').textContent.includes('Fresh README excerpt'));
 dom.window.close();
});
