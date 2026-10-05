'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {JSDOM}=require('jsdom'),root=path.resolve(__dirname,'..'),data=require('../data/handbook.json');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const current=require('../data/handbook-current.json');
test('handbook binds the quoted run and preserves its five source versions',()=>{
 assert.equal(data.schema,'halveth.hub-handbook.v1');assert.equal(data.dataClass,'PUBLIC');
 assert.equal(data.verification.recordedAt,'2026-10-05T16:22:42.929Z');
 assert.deepEqual(data.projects.map(p=>p.id),['space','fortuna','scarlet','learning','bash']);
 assert.equal(data.verification.counts.spaceTests,30);assert.equal(data.verification.skippedTests,2);
 assert.equal(data.projects.flatMap(p=>p.pages).length,148);assert.equal(data.projects.flatMap(p=>[...p.sources,...p.tests]).length,63);
 for(const p of data.projects)assert.match(p.commit,/^[0-9a-f]{40}$/);
});
test('each source and page links its declared repository and immutable commit',()=>{
 for(const p of data.projects){
  const paths=new Set();
  for(const s of [...p.sources,...p.tests]){
   assert(!paths.has(s.path));paths.add(s.path);assert.match(s.sha256,/^[0-9a-f]{64}$/);assert(s.line>=1&&s.line<=s.lines);
   assert.equal(s.url,'https://github.com/'+p.repository+'/blob/'+p.commit+'/'+s.path+'#L'+s.line);
  }
  assert.equal(new Set(p.pages.map(page=>page.path)).size,p.pages.length);
  for(const page of p.pages){assert.equal(page.code,'https://github.com/'+p.repository+'/blob/'+p.commit+'/'+page.path);assert.match(page.sha256,/^[0-9a-f]{64}$/);assert(data.roles[page.role]);}
 }
 assert.equal(data.projects.find(p=>p.id==='scarlet').pages.length,86);
});
test('three handbook editions expose every source and page with working return and language routes',()=>{
 for(const lang of ['de','en','ru']){
  const prefix=lang==='de'?'':lang+'/',dom=new JSDOM(read(prefix+'handbuch/index.html'),{url:'https://juri-halveth.github.io/'+prefix+'handbuch/'}),doc=dom.window.document;
  assert.equal(doc.documentElement.lang,lang);assert.equal(doc.querySelector('link[rel=canonical]').href,'https://juri-halveth.github.io/'+prefix+'handbuch/');
  assert.equal(doc.querySelectorAll('[data-language-link][aria-current=page]').length,1);
  const ids=[...doc.querySelectorAll('[id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length);
  const links=[...doc.querySelectorAll('a')].map(a=>a.href);
  for(const p of current.projects){for(const s of [...p.sources,...p.tests])assert(links.includes(s.url));for(const page of p.pages){assert(links.includes(page.live));assert(links.includes(page.code));}}
  for(const el of doc.querySelectorAll('a,link[rel=stylesheet],script[src],img[src]')){
   const u=new URL(el.getAttribute(el.tagName==='SCRIPT'||el.tagName==='IMG'?'src':'href'),dom.window.location.href);
   assert.equal(u.username,'');assert.equal(u.password,'');assert.equal(u.protocol,'https:');
   if(u.hostname!=='juri-halveth.github.io'||/^\/(fortuna|halveth-scarlet|lernstudio|mein-lernportal)\//.test(u.pathname))continue;
   let dest=u.pathname.slice(1);if(!dest||dest.endsWith('/'))dest+='index.html';assert(fs.existsSync(path.join(root,dest)),dest);
   if(u.hash&&dest.endsWith('.html'))assert(read(dest).includes('id="'+u.hash.slice(1)+'"'),dest+' '+u.hash);
  }
  dom.window.close();
 }
});
test('handbook publishes source addresses and quoted counts without private host paths or credentials',()=>{
 const documents=[read('data/handbook.json'),read('docs/HANDBUCH.md'),read('handbuch/index.html'),read('en/handbuch/index.html'),read('ru/handbuch/index.html')];
 for(const text of documents){assert.doesNotMatch(text,/C:[\\/]|\/c\/Users\/|\.codex[\\/]|127\.0\.0\.1|0x[0-9a-fA-F]{64}|gh[pousr]_[A-Za-z0-9]+/);}
 for(const p of data.projects)for(const page of p.pages){const u=new URL(page.live);assert.equal(u.protocol,'https:');assert.equal(u.hostname,'juri-halveth.github.io');}
});
test('handbook rebuild preserves all three editions and the source-bound text guide exactly',()=>{
 const files=['handbuch/index.html','en/handbuch/index.html','ru/handbuch/index.html','docs/HANDBUCH.md','data/handbook.json'],before=files.map(read);
 cp.execFileSync(process.execPath,['tools/build-handbook.cjs'],{cwd:root});assert.deepEqual(files.map(read),before);
});
test('active navigation follows moving source branches and connects the Russian parent mode without frozen result counters',()=>{
 assert.equal(current.sourcePolicy,'MOVING_MAIN_LINKS_NOT_TEST_RESULTS');
 for(const project of current.projects){
  assert(!Object.hasOwn(project,'commit'));assert(!Object.hasOwn(project,'verification'));
  for(const source of [...project.sources,...project.tests]){assert.equal(source.url,'https://github.com/'+project.repository+'/blob/main/'+source.path);assert.doesNotMatch(source.role,/\b(?:69|70|702|105|75)\b/);}
 }
 for(const lang of ['de','en','ru']){
  const prefix=lang==='de'?'':lang+'/',html=read(prefix+'handbuch/index.html'),doc=new JSDOM(html).window.document;
  assert(doc.querySelector('a[href="https://juri-halveth.github.io/lernstudio/eltern/"]'));
  assert(doc.querySelector('a[href="/data/handbook-current.json"]'));
  assert(doc.querySelector('a[href="/data/handbook.json"]'),'Dated audit remains available');
  assert.doesNotMatch(doc.querySelector('.handbook-hero').textContent,/\b(?:148|63)\b/);
  assert.doesNotMatch(html,/702 Lektionen|702 lessons|702 урока|105 freigegebene|232 Tests|30 Tests/);
 }
});
