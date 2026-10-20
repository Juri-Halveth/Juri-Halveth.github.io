'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const {validateWorkSamples,renderWorkSamples}=require('../tools/render-work-samples.cjs');
const root=path.resolve(__dirname,'..'),data=JSON.parse(fs.readFileSync(path.join(root,'data/work-samples.json'),'utf8'));
test('CI snapshots bind exactly the displayed source rather than a different successful commit',()=>{
 assert.equal(validateWorkSamples(data),data);
 const wrong=structuredClone(data);wrong.samples[0].ci.headSha='f'.repeat(40);
 assert.throws(()=>validateWorkSamples(wrong),/same revision/);
 const promoted=structuredClone(data);promoted.samples[1].localCheck='INDEPENDENT_AUDIT_PASSED';
 assert.throws(()=>validateWorkSamples(promoted),/check type/);
 const missing=structuredClone(data);delete missing.samples[0].de.counterexample;
 assert.throws(()=>validateWorkSamples(missing),/localized/);
});
test('three complete case studies expose implementation, counterexample and same-revision CI in each language',()=>{
 for(const lang of ['de','en','ru']){
  const doc=new JSDOM(renderWorkSamples(data,lang)).window.document;
  assert.equal(doc.querySelectorAll('.evidence-case').length,3);
  assert.equal(doc.querySelectorAll('.evidence-grid>div').length,18);
  assert.equal(doc.querySelectorAll('details').length,3);
  for(const s of data.samples){const item=doc.getElementById(s.id);assert.ok(item.querySelector(`a[href*="/blob/${s.revision}/"]`));assert.ok(item.querySelector(`a[href$="/actions/runs/${s.ci.id}"]`));}
 }
});
test('invalid paths and script-like presentation text do not become executable markup',()=>{
 const wrong=structuredClone(data);wrong.samples[0].sourcePath='../private';assert.throws(()=>validateWorkSamples(wrong),/relative/);
 const injected=structuredClone(data);injected.samples[1].demo='https://juri-halveth.github.io/" onclick="alert(1)';assert.throws(()=>validateWorkSamples(injected),/Owned demo/);
 const foreign=structuredClone(data);foreign.samples[1].demo='https://juri-halveth.github.io.attacker.example/';assert.throws(()=>validateWorkSamples(foreign),/Owned demo/);
 const text=structuredClone(data);text.samples[0].de.title='<script>alert(1)</script>';
 const doc=new JSDOM(renderWorkSamples(text,'de')).window.document;
 assert.equal(doc.querySelectorAll('script,iframe').length,0);
 assert.match(doc.querySelector('.evidence-case h2').textContent,/<script>/);
});
test('generated evidence entrances are present without JavaScript and preserve localized navigation',()=>{
 for(const lang of ['','en/','ru/']){
  const doc=new JSDOM(fs.readFileSync(path.join(root,lang,'belege/index.html'),'utf8')).window.document;
  assert.equal(doc.querySelectorAll('h1').length,1);
  assert.equal(doc.querySelectorAll('.project-card').length,0);
  assert.ok(doc.querySelector(`header a[href="/${lang}belege/"]`));
 }
});
