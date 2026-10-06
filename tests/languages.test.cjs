'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const pages=['zertifikate/index.html','modelle/index.html','index.html','arbeiten/index.html','profil/index.html','404.html','motion/index.html','werkzertifikate/index.html','schuelervz-halveth/index.html','schuelervz-halveth/people.html','schuelervz-halveth/archaeology.html','schuelervz-halveth/prestige.html'];
test('all language entrances keep source IDs, one selected language and their own canonical route',()=>{
 for(const source of pages){
  const original=new JSDOM(read(source)),ids=[...original.window.document.querySelectorAll('[id]')].map(n=>n.id);
  for(const language of ['en','ru']){
   const dom=new JSDOM(read(language+'/'+source)),doc=dom.window.document;
   assert.equal(doc.documentElement.lang,language);
   assert.deepEqual([...doc.querySelectorAll('[id]')].map(n=>n.id),ids);
   assert.equal(doc.querySelectorAll('.language-links a[aria-current="page"]').length,1);
   assert.match(doc.querySelector('link[rel=canonical]').href,new RegExp('github\\.io/'+language+'/'));
   for(const a of doc.querySelectorAll('.language-links a'))assert.ok(fs.existsSync(path.join(root,new URL(a.href,'https://juri-halveth.github.io').pathname,'index.html'))||/\.html$/.test(a.getAttribute('href')));
   assert.deepEqual([...doc.querySelectorAll('code,pre')].map(n=>n.textContent),[...original.window.document.querySelectorAll('code,pre')].map(n=>n.textContent));
   dom.window.close();
  }
  original.window.close();
 }
});
test('public source links and original raw assets stay exact in translated entry pages',()=>{
 const documents=require('../data/public-sources.json').research.documents;
 for(const lang of ['en','ru']){
  const html=read(lang+'/arbeiten/index.html');for(const d of documents)assert.ok(html.includes(d.url),d.path);
  assert.match(read(lang+'/profil/index.html'),/Juri Halveth/);
  assert.match(read(lang+'/profil/index.html'),/ISTQB|issuer|учреждениями/);
  assert.match(read(lang+'/profil/index.html'),new RegExp('/'+lang+'/profil/CV-Juri-Halveth\\.md'));
  assert.match(read(lang+'/motion/index.html'),/src="\/motion-core\.js"/);
 }
});
test('the shared runtime translates new UI text while retaining user input, source code and raw records',async()=>{
 for(const lang of ['de','en','ru']){
  const dom=new JSDOM('<!doctype html><html lang="de"><body><h1>Lernen</h1><input value="Lernen"><textarea>Lernen</textarea><code>Lernen</code><div data-user-content>Lernen</div><div class="trace-body">Lernen</div><a id="topic" href="https://juri-halveth.github.io/lernstudio/#T002">Lernen</a><a id="source" href="https://github.com/Juri-Halveth/lernstudio/blob/main/README.md">Lernen</a><a id="pdf" href="/original.pdf">Lernen</a></body></html>',{url:'https://juri-halveth.github.io/schuelervz-halveth/?lang='+lang,runScripts:'outside-only'});
  dom.window.eval(read('assets/hub-catalog.js'));dom.window.eval(read('assets/hub-language.js'));
  await new Promise(resolve=>setImmediate(resolve));
  const doc=dom.window.document,expected={de:'Lernen',en:'Learning',ru:'Обучение'}[lang];
  assert.equal(doc.querySelector('h1').textContent,expected);
  for(const selector of ['input','textarea'])assert.equal(doc.querySelector(selector).value,'Lernen');
  for(const selector of ['code','[data-user-content]','.trace-body'])assert.equal(doc.querySelector(selector).textContent,'Lernen');
  assert.equal(doc.getElementById('source').href,'https://github.com/Juri-Halveth/lernstudio/blob/main/README.md');
  assert.equal(new URL(doc.getElementById('topic').href).searchParams.get('lang'),lang);
  assert.equal(new URL(doc.getElementById('topic').href).hash,'#T002');
  assert.equal(new URL(doc.getElementById('pdf').href).pathname,'/original.pdf');
  const added=doc.createElement('p');added.textContent='Lernen';doc.body.append(added);
  await new Promise(resolve=>setImmediate(resolve));assert.equal(added.textContent,expected);
  const addedLink=doc.createElement('a');addedLink.href='/lernstudio/?course=git#T002';addedLink.textContent='Lernen';doc.body.append(addedLink);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(new URL(addedLink.href).searchParams.get('lang'),lang);
  assert.equal(new URL(addedLink.href).searchParams.get('course'),'git');
  assert.equal(new URL(addedLink.href).hash,'#T002');
  assert.ok(dom.window.HalvethHubLanguage.searchable('Lernen').includes('Обучение'));
  assert.equal(doc.querySelectorAll('[data-hub-navigation] a').length,4);
  dom.window.close();
 }
});
test('translated numerical facts retain the source digit sequence',()=>{
 const catalog=require('../data/languages.json').strings;
 for(const [source,pair] of Object.entries(catalog)){
  const digits=source.match(/\d+/g);if(!digits)continue;
  for(const value of Object.values(pair))assert.deepEqual(value.match(/\d+/g),digits,source);
 }
});
