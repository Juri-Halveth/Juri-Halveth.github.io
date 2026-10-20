const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),{JSDOM}=require('jsdom');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/projects.json'),'utf8'));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('technical catalog is unique, source-pinned and records limited check states',()=>{
 assert.equal(data.projects.length,13);assert.equal(new Set(data.projects.map(x=>x.id)).size,13);
 for(const x of data.projects){assert.match(x.revision,/^[0-9a-f]{40}$/);assert.ok(x.source.includes(x.revision));assert.ok(['LOCAL_MODEL_TESTS','SOURCE_REVIEW_ONLY'].includes(x.verification));}
});
test('all generated language entrances link only to available local files and anchors',()=>{
 for(const lang of ['','en/','ru/'])for(const page of ['','profil/','arbeiten/','koennen/','modelle/','audits/','lernen/','motion/','handbuch/','pulsar/','zertifikate/','werkzertifikate/']){
  const raw=read(lang+page+'index.html'),doc=new JSDOM(raw).window.document;
  assert.equal(doc.querySelectorAll('h1').length>0||doc.querySelectorAll('[data-project]').length>0,true);
  assert.ok(doc.querySelector('meta[http-equiv="Content-Security-Policy"]'));
  const ids=[...doc.querySelectorAll('[id]')].map(x=>x.id);assert.equal(ids.length,new Set(ids).size);
  for(const a of doc.querySelectorAll('[href],[src]')){
   const url=a.getAttribute('href')||a.getAttribute('src');if(!url)continue;
   if(url.startsWith('#')){assert.ok(doc.getElementById(url.slice(1)),url);continue;}
   if(!url.startsWith('/'))continue;
   const name=decodeURIComponent(url.split('#')[0]);const target=path.join(root,name.endsWith('/')?name+'index.html':name);
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
