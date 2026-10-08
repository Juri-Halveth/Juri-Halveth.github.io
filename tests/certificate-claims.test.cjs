'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {JSDOM}=require('jsdom'),C=require('../tools/certificates.cjs'),V=require('../tools/visitor.cjs'),models=require('../data/models.json');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
test('the home page routes to the profile while certificate claims keep their evidence on profile pages',()=>{
 for(const lang of ['','en/','ru/']){
  const home=new JSDOM(read(lang+'index.html')).window.document;
  assert.equal(home.querySelectorAll('[data-claim]').length,0);
  assert.ok(home.querySelector('a[href="/'+lang+'profil/"]'));
  for(const page of ['zertifikate/index.html','profil/index.html']){
  const dom=new JSDOM(read(lang+page)),doc=dom.window.document;
  assert.equal(doc.querySelectorAll('[data-claim]').length,9);
  for(const c of C.claims.claims){
   const card=doc.querySelector('[data-claim="'+c.id+'"]');
   assert.equal(card.querySelector('.certificate-name').textContent,V.claim(c.id).name);
   assert.equal(card.querySelector('.certificate-name').getAttribute('title'),c.title);
   assert.match(card.querySelector('.claim-badge').textContent,/✓ CLAIMED/);
   assert.ok(card.textContent.includes(c.frameworkIssuer));
   const proof=V.claim(c.id).proof;
   assert.equal(card.querySelector('a').getAttribute('href'),proof.startsWith('/')?'/'+lang+proof.slice(1):proof);
   assert.ok([...card.querySelectorAll('a')].some(a=>a.href===c.dossier));
  }
  assert.match(doc.querySelector('.claim-definition').textContent,/Portfolio|portfolio|портфолио/);
  const firstTopic=doc.querySelector('[data-topic]'),claim=doc.querySelector('[data-claim]');
  if(firstTopic)assert.ok(claim.compareDocumentPosition(firstTopic)&dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
  dom.window.close();
  }
  home.defaultView.close();
 }
});
test('changing a portfolio claim into an issuer award cannot reuse this rendering contract',()=>{
 for(const axis of ['issuerAwardStatus','status','filingStatus']){
  const candidate=structuredClone(C.claims);
  if(axis==='issuerAwardStatus')candidate.issuerAwardStatus='AWARDED';
  else candidate.claims[0][axis]='AWARDED';
  assert.throws(()=>C.validateClaims(candidate));
 }
 const wrongSource=structuredClone(C.claims);wrongSource.claims[0].dossier='https://github.com/example/other';
 assert.throws(()=>C.validateClaims(wrongSource));
});
test('the published eye view is the source-bound browser artifact with a functioning standalone module graph',()=>{
 const eye=models.models.find(m=>m.id==='auge');
 for(const [file,digest] of Object.entries(eye.browserFileSha256)){
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'modelle/auge',file))).digest('hex'),digest);
 }
 assert.ok(read('modelle/auge/view.mjs').includes("from './model.mjs'"));
 assert.doesNotMatch(read('modelle/auge/view.mjs'),/window\.openai|fetch\(|localStorage/);
});
test('new model and certificate routes keep working file destinations and local anchors',()=>{
 for(const lang of ['','en/','ru/'])for(const page of ['zertifikate/index.html','modelle/index.html']){
  const doc=new JSDOM(read(lang+page)).window.document;
  for(const link of doc.querySelectorAll('a[href]')){
   const raw=link.getAttribute('href');if(!raw.startsWith('/')&&!raw.startsWith('#'))continue;
   const url=new URL(raw,'https://juri-halveth.github.io/'+lang+page);
   const file=path.join(root,url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname);
   assert.ok(fs.existsSync(file),raw);
   if(url.hash)assert.ok(read(path.relative(root,file)).includes('id="'+url.hash.slice(1)+'"'),raw);
  }
 }
});
