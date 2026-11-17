'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{webcrypto}=require('node:crypto');
const {JSDOM}=require('jsdom');
const preview=path.join(__dirname,'../modelle/material-20261117');

async function host(){
 const dom=new JSDOM(fs.readFileSync(path.join(preview,'labore/beziehungsfaden.html'),'utf8'),{
  url:'https://local.invalid/labore/beziehungsfaden.html',runScripts:'outside-only'});
 const w=dom.window,pending=[];
 w.TextEncoder=TextEncoder;w.matchMedia=()=>({matches:true});w.requestAnimationFrame=()=>0;
 w.HALVETHMotionUI={label:key=>key};w.ResizeObserver=class{observe(){}};
 Object.defineProperty(w.crypto,'subtle',{value:{digest:(algorithm,bytes)=>new Promise((resolve,reject)=>{
  pending.push({complete:async()=>resolve(await webcrypto.subtle.digest(algorithm,bytes)),reject});
 })}});
 w.HTMLCanvasElement.prototype.getContext=function(){
  const gradient={addColorStop(){}};
  return new Proxy({canvas:this,createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,
   measureText:()=>({width:10})},{get:(target,key)=>key in target?target[key]:()=>{}});
 };
 const ready=new Promise(resolve=>w.addEventListener('DOMContentLoaded',resolve,{once:true}));
 w.eval(fs.readFileSync(path.join(preview,'assets/narrative-channels.js'),'utf8'));
 w.eval(w.document.querySelector('script:not([src])').textContent);await ready;
 return {w,pending,scene:w.HALVETHScenes[0],note:w.document.querySelector('#communication-note'),
  append:w.document.querySelector('#communication-append'),restart:w.document.querySelector('[data-motion-restart]'),
  notice:w.document.querySelector('#communication-notice'),close:()=>w.close()};
}

const settle=()=>new Promise(resolve=>setImmediate(resolve));

for(const editDraft of [false,true])test('restart waits for a pending note and preserves '+(editDraft?'the newer draft':'the completed note in its archive'),async()=>{
 const h=await host();try{
  h.note.value='A note awaiting its digest';h.append.click();assert.equal(h.pending.length,1);
  if(editDraft)h.note.value='The next draft must stay';
  h.restart.click();h.restart.click();
  assert.equal(h.scene.snapshot().runId,'COMM_RUN_001','restart must not discard the pending target model');
  h.append.click();assert.equal(h.pending.length,1,'a pending submission cannot be duplicated');
  await h.pending[0].complete();await settle();
  const saved=h.scene.snapshot();
  assert.equal(saved.runId,'COMM_RUN_002');assert.equal(saved.previousRuns.length,1);
  assert.equal(saved.previousRuns[0].notes.length,1);
  assert.equal(saved.previousRuns[0].notes[0].text,'A note awaiting its digest');
  assert.equal(saved.notes.length,0);
  assert.equal(h.note.value,editDraft?'The next draft must stay':'');
  assert.match(h.notice.textContent,/Lokale Notiz erhalten/);
  assert.equal(h.append.disabled,false);assert.equal(h.restart.disabled,false);
 }finally{h.close();}
});

test('a failed note digest retains its draft and still completes a requested restart',async()=>{
 const h=await host();try{
  h.note.value='Keep this draft if hashing fails';h.append.click();h.restart.click();
  h.pending[0].reject(Error('Synthetic digest failure'));await settle();
  const saved=h.scene.snapshot();
  assert.equal(saved.runId,'COMM_RUN_002');assert.equal(saved.previousRuns.length,1);
  assert.equal(saved.previousRuns[0].notes.length,0);
  assert.equal(h.note.value,'Keep this draft if hashing fails');
  assert.match(h.notice.textContent,/Synthetic digest failure/);
  assert.equal(h.append.disabled,false);assert.equal(h.restart.disabled,false);
 }finally{h.close();}
});
