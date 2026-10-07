'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom'),E=require('../tools/code-evidence.cjs'),data=require('../data/competence-evidence.json');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('changed code, source versions and unsupported award claims fail the binding contract',()=>{
 assert.equal(E.validate(data),true);
 for(const mutate of [d=>d.proofs[0].source.excerpt+='changed',d=>d.proofs[0].source.url=d.proofs[0].source.url.replace(d.proofs[0].source.commit,'main'),d=>d.benchmarks[0].issuerAwardStatus='AWARDED',d=>d.benchmarks[0].authorityEffect='THIRD_PARTY_ACCESS',d=>d.projectCertificates[0].repository='another-project']){
  const d=structuredClone(data);mutate(d);assert.throws(()=>E.validate(d));
 }
});
test('a relation cannot silently import another function, endpoint digest or framework',()=>{
 for(const mutate of [d=>d.relations[0].left.id='F01',d=>d.relations[0].left.digest='0'.repeat(64),d=>d.relations[0].right.address='https://example.com/another-framework',d=>d.relations[0].authorityEffect='ADMIN']){
  const d=structuredClone(data);mutate(d);assert.throws(()=>E.validate(d));
 }
});
test('all source excerpts remain byte exact and inert through every language rendering',()=>{
 for(const lang of ['','en/','ru/']){
  const dom=new JSDOM(read(lang+'koennen/index.html')),doc=dom.window.document;
  assert.equal(doc.querySelectorAll('[data-proof]').length,19);
  assert.equal(doc.querySelectorAll('[data-benchmark]').length,9);
  assert.equal(doc.querySelectorAll('script,iframe,object').length,0);
  for(const p of data.proofs){
   const article=doc.getElementById(p.id);assert.equal(article.querySelector('pre code').textContent,p.source.excerpt);
   assert.ok([...article.querySelectorAll('a')].some(a=>a.href===p.source.url));
   assert.equal(article.querySelector('pre').getAttribute('tabindex'),'0');
  }
  dom.window.close();
 }
});
test('certificate and project entry links terminate at their declared concrete evidence',()=>{
 for(const lang of ['','en/','ru/']){
  const proof=new JSDOM(read(lang+'koennen/index.html')).window.document;
  for(const entry of ['index.html','zertifikate/index.html','profil/index.html']){
   const dom=new JSDOM(read(lang+entry)),doc=dom.window.document;
   for(const b of data.benchmarks){
    const link=doc.querySelector('[data-claim="'+b.id+'"] a');
    assert.equal(link.getAttribute('href'),'/'+lang+'koennen/#'+b.id.toLowerCase());
    const section=proof.getElementById(b.id.toLowerCase());
    assert.equal(section.querySelector('.benchmark-proof a').getAttribute('href'),'#'+b.primaryProof);
    assert.ok(proof.getElementById(b.primaryProof).querySelector('pre code'));
   }
   for(const c of data.projectCertificates){
    const link=doc.querySelector('.work-certificate-grid a[href="/'+lang+'koennen/#'+c.proof+'"]');
    if(entry!=='profil/index.html')assert.ok(link,c.repository);
    assert.ok(proof.getElementById(c.proof));
   }
   dom.window.close();
  }
 }
});
