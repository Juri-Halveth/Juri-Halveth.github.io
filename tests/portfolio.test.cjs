const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),{JSDOM}=require('jsdom');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/projects.json'),'utf8'));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('technical catalog is unique, source-pinned and records limited check states',()=>{
 assert.equal(data.projects.length,11);assert.equal(new Set(data.projects.map(x=>x.id)).size,11);
 for(const x of data.projects){assert.match(x.revision,/^[0-9a-f]{40}$/);assert.ok(x.source.includes(x.revision));assert.ok(['LOCAL_MODEL_TESTS','SOURCE_REVIEW_ONLY','HEAD_METADATA_ONLY'].includes(x.verification));}
});
test('all generated language entrances link only to available local files and anchors',()=>{
 for(const lang of ['','en/','ru/'])for(const page of ['','profil/','arbeiten/','koennen/','belege/','modelle/','audits/','lernen/','motion/','handbuch/','pulsar/','zertifikate/','werkzertifikate/','forschung/']){
  const raw=read(lang+page+'index.html'),doc=new JSDOM(raw).window.document;
  assert.equal(doc.querySelectorAll('h1').length,1,`${lang}${page}: exactly one main heading`);
  assert.ok(doc.querySelector('meta[http-equiv="Content-Security-Policy"]'));
  const ids=[...doc.querySelectorAll('[id]')].map(x=>x.id);assert.equal(ids.length,new Set(ids).size);
  for(const a of doc.querySelectorAll('[href],[src]')){
   const url=a.getAttribute('href')||a.getAttribute('src');if(!url)continue;
   if(url.startsWith('#')){assert.ok(doc.getElementById(url.slice(1)),url);continue;}
   if(/^[a-z][a-z0-9+.-]*:/i.test(url))continue;
   const name=decodeURIComponent(url.split(/[?#]/)[0]);
   const base=path.join(root,lang,page);
   const target=name.startsWith('/')?path.join(root,name.endsWith('/')?name+'index.html':name):path.resolve(base,name.endsWith('/')?name+'index.html':name);
   assert.ok(fs.existsSync(target),`${lang}${page}: ${url}`);
  }
 }
});
test('current public pages contain work samples without historical certificate or private project promotions',()=>{
 for(const lang of ['','en/','ru/'])for(const page of ['','profil/','koennen/','zertifikate/','werkzertifikate/']){
  const raw=read(lang+page+'index.html');assert.doesNotMatch(raw,/CLAIMED|CISSP|OSCE|ISTQB|xai-40m|these-zur-geburt|admon395|cannabis-reform|open-research-branches/i);
  assert.match(raw,/security@halveth\.de/);assert.doesNotMatch(raw,/<table/i);
 }
});
test('archive collectors cannot republish removed material',()=>{
 const workflows=fs.readdirSync(path.join(root,'.github/workflows'));assert.deepEqual(workflows,['pages.yml']);
 for(const p of ['schuelervz-halveth','werkzertifikate/2026-09-28-v1.1','data/claims.json'])assert.equal(fs.existsSync(path.join(root,p)),false);
});

test('the selected project list contains learning, tools and models with no withdrawn game category',()=>{
 assert.deepEqual([...new Set(data.projects.map(x=>x.category))].sort(),['learning','research','software']);
 assert.ok(data.projects.some(x=>x.id==='lernstudio'));
 assert.ok(data.projects.some(x=>x.id==='halveth-forschungslabor'));
 assert.ok(data.projects.some(x=>x.id==='halveth-tresor'));
});


test('additive material preview links preserve the existing portfolio and bound shared runtime',()=>{
 const preview=path.join(root,'modelle/material-20261117');
 for(const lang of ['','en/','ru/']){
  const raw=read(lang+'modelle/index.html'),doc=new JSDOM(raw).window.document,link=doc.querySelector('[data-material-preview] a.button');
  assert.ok(link,'preview link in every models language');
  const entry=new URL(link.getAttribute('href'),'https://preview.invalid/'+lang+'modelle/');
  assert.equal(entry.searchParams.get('modell'),'doppelacht');
  const target=path.join(root,entry.pathname);
  assert.equal(target,path.join(preview,'forschung.html'));
  assert.match(raw,/scene-stage\.mjs/,'existing interactive work sample preserved');
 }
 const binding=JSON.parse(read('modelle/material-20261117/SHARED_SOURCES.json'));
 assert.equal(binding.files.length,9);
 for(const file of binding.files){
  const bytes=fs.readFileSync(path.join(preview,file.path));
  assert.equal(bytes.length,file.bytes);
  assert.equal(require('node:crypto').createHash('sha256').update(bytes).digest('hex'),file.sha256);
 }
 assert.match(read('modelle/material-20261117/assets/material-engine.js'),/MIT License/);
 assert.match(read('modelle/material-20261117/materials-LICENSE-MIT.txt'),/Permission is hereby granted/);
 assert.match(read('LICENSES.md'),/assets\/narrative-channels\.js/);
 assert.match(read('universum/faden/app.js'),/HALVETH_RELATION_MODEL\.fromSpace/,'existing public graph retained');
 const material=require('../modelle/material-20261117/assets/material-model.js').create();
 assert.equal(material.snapshot().materialCells.length,960);
 const narrative=require('../modelle/material-20261117/assets/narrative-channels.js').create();
 assert.equal(narrative.snapshot().catalog.coverage.originalProjectCount,18);
});

test('additive preview keeps local assets and legacy laboratories within its own web path',()=>{
 const preview=path.join(root,'modelle/material-20261117');
 for(const name of ['forschung.html','Realitaet_Erste_Regel_Plus_Minus.html','studio/index.html','labore/beziehungsfaden.html','modules/knoten/KNOTEN.html','modules/sgra/VORSCHAU.html','modules/wirbel/WIRBEL.html'])assert.ok(fs.existsSync(path.join(preview,name)),name);
 function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?files(path.join(dir,x.name)):[path.join(dir,x.name)]);}
 for(const file of files(preview)){
  assert.doesNotMatch(file,/Rechtswege_FULL|Rechtswege_verbinden|Eingefügter Text|\.pdf$/i,'private source document excluded');
  if(!file.endsWith('.html'))continue;
  const raw=fs.readFileSync(file,'utf8');assert.doesNotMatch(raw,/(?:C|E):[\\/](?:Users|HALVETH_WORKSPACE)/,'no local machine path');
  const doc=new JSDOM(raw).window.document;
  for(const el of doc.querySelectorAll('script[src],link[rel=stylesheet][href],iframe[data-module-src]')){
   const href=el.getAttribute('src')||el.getAttribute('href')||el.getAttribute('data-module-src');
   if(/^[a-z][a-z0-9+.-]*:/i.test(href))continue;
   const target=path.resolve(path.dirname(file),href.split(/[?#]/)[0]);
   assert(target.startsWith(preview+path.sep),'preview asset must not escape its public folder: '+href);
   assert(fs.existsSync(target),path.relative(preview,file)+': '+href);
  }
 }
});
