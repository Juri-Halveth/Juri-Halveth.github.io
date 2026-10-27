'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const {renderFlagships,flagshipProjects}=require('../tools/render-flagships.cjs');
const {refresh}=require('../tools/refresh-public-heads.cjs');
const data=require('../data/projects.json'),snapshot=require('../data/public-repositories.json');
test('all language entrances lead with the four selected usable projects and separate contact channels',()=>{
 for(const prefix of ['','en/','ru/']){
  const doc=new JSDOM(fs.readFileSync(path.join(__dirname,'..',prefix,'index.html'),'utf8')).window.document;
  assert.deepEqual([...doc.querySelectorAll('[data-flagship]')].map(n=>n.dataset.flagship),['lucinet-seedspace','halveth-tresor','mein-lernportal','halveth-field-difference-lab']);
  assert.equal(doc.querySelector('.hero-actions a').getAttribute('href'),'#flagships');
  assert.ok(doc.querySelector('#flagships').compareDocumentPosition(doc.querySelector('.scene-wall'))&4);
  assert.ok(doc.querySelector('#contact a[href="mailto:juri@halveth.de"]'));
  assert.ok(doc.querySelector('a[href="mailto:security@halveth.de"]'));
  assert.equal(doc.querySelector('a[href*="leviathan-wallet-portal"]'),null);
 }
});
test('editorial selection cannot omit a flagship or silently substitute another project',()=>{
 const copy=structuredClone(data);copy.flagshipOrder.pop();assert.throws(()=>flagshipProjects(copy));
 const missing=structuredClone(data);missing.projects=missing.projects.filter(p=>p.id!=='lucinet-seedspace');assert.throws(()=>flagshipProjects(missing));
 const altered=structuredClone(data);altered.projects[0].description.de='<script>fixture</script>';
 const doc=new JSDOM(renderFlagships(altered,'de')).window.document;assert.equal(doc.querySelectorAll('script').length,0);assert.match(doc.body.textContent,/<script>/);
});
test('refresh moves source HEADs without claiming that earlier tests ran on new code',()=>{
 const metadata=Object.fromEntries([...data.projects.map(p=>p.id),...snapshot.repositories.map(p=>p.name)].map(name=>[name,{private:false,visibility:'public',sha:'a'.repeat(40)}]));
 const initial=structuredClone(data),tested=initial.projects.find(p=>p.id==='halveth-forschungslabor');
 tested.verification='LOCAL_MODEL_TESTS';tested.command='npm test';tested.verificationRecord={revision:tested.revision,command:tested.command,observedAt:'2026-10-24T13:00:00Z'};
 const before=JSON.stringify(initial),result=refresh(initial,snapshot,metadata,'2026-10-27T16:00:00Z');
 assert.equal(JSON.stringify(initial),before);
 const moved=result.projects.projects.find(p=>p.id===tested.id);assert.equal(moved.verification,'HEAD_METADATA_ONLY');assert.equal(moved.verificationRecord,undefined);
 assert.equal(result.projects.projects.find(p=>p.id==='halveth-tron-security-lab').revision,initial.projects.find(p=>p.id==='halveth-tron-security-lab').revision);
 metadata['lucinet-seedspace'].private=true;assert.throws(()=>refresh(initial,snapshot,metadata,'2026-10-27T16:00:00Z'),/public project/);
});
