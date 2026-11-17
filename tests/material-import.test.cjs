'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const preview=path.join(__dirname,'../modelle/material-20261117');

function host(studio=false){
 const file=path.join(preview,studio?'studio/index.html':'forschung.html');
 const dom=new JSDOM(fs.readFileSync(file,'utf8'),{url:'https://local.invalid/'+(studio?'studio/':'')+'?modell=doppelacht',runScripts:'outside-only'});
 const w=dom.window;
 w.structuredClone=structuredClone;w.matchMedia=()=>({matches:true,addEventListener(){}});
 w.requestAnimationFrame=()=>0;
 w.ResizeObserver=class{observe(){}};
 w.HTMLCanvasElement.prototype.getContext=function(){
  const canvas=this,gradient={addColorStop(){}};
  return new Proxy({canvas,createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,
   measureText:()=>({width:10}),createImageData:(width,height)=>({width,height,data:new Uint8ClampedArray(width*height*4)})},
   {get:(target,key)=>key in target?target[key]:()=>{}});
 };
 const excluded=new Set(['site.js','film.js','translations.js','translations-data.js']);
 for(const script of w.document.querySelectorAll('script[src]')){
  const name=path.basename(script.getAttribute('src'));if(excluded.has(name))continue;
  w.eval(fs.readFileSync(path.join(preview,'assets',name),'utf8'));
 }
 return {dom,w,scene:w.HALVETHScenes[0],close:()=>w.close()};
}

function packet(w,seconds=3){
 const model=w.HALVETHDoubleEight.create({count:24,layout:'shell'});
 for(let i=0;i<seconds;i++)model.step(1);
 return model.snapshot();
}

test('lab material import yields and restores the same cells without replacing state before verification',async()=>{
 const h=host();try{
  const saved=packet(h.w),before=h.scene.snapshot().particles;
  const pending=h.scene.replay(saved);
  assert.deepEqual(h.scene.snapshot().particles,before);
  let yielded=false;setTimeout(()=>{yielded=true;},0);
  await pending;
  assert.equal(yielded,true);
  assert.deepEqual(h.scene.snapshot().particles.materialCells,saved.materialCells);
  assert.equal(h.scene.snapshot().particles.tick,saved.tick);
 }finally{h.close();}
});

test('reset and a newer import cancel stale lab verification without overwriting the chosen model',async()=>{
 const h=host();try{
  const saved=packet(h.w,8);
  const reset=h.scene.replay(saved);h.scene.reset();await assert.rejects(reset,{name:'AbortError'});
  assert.equal(h.scene.snapshot().particles.tick,0);
  const first=h.scene.replay(saved),second=h.scene.replay(packet(h.w,1));
  await assert.rejects(first,{name:'AbortError'});await second;
  assert.equal(h.scene.snapshot().particles.tick,120);
  const changed=h.scene.replay(saved);h.scene.useModel('newton');await assert.rejects(changed,{name:'AbortError'});
  assert.equal(h.scene.snapshot().modelType,'newton');
 }finally{h.close();}
});

test('lab file reads cancelled by a restart cannot restore a stale scene later',async()=>{
 const h=host();try{
  const saved=JSON.stringify(packet(h.w));let finish;
  const input=h.w.document.querySelector('[data-replay-file]');
  Object.defineProperty(input,'files',{configurable:true,value:[{size:saved.length,text:()=>new Promise(resolve=>{finish=resolve;})}]});
  input.dispatchEvent(new h.w.Event('change'));h.scene.useModel('newton');finish(saved);
  await new Promise(resolve=>setTimeout(resolve,30));
  assert.equal(h.scene.snapshot().modelType,'newton');
 }finally{h.close();}
});

test('studio material imports yield and a model change prevents stale installation',async()=>{
 const h=host(true);try{
  const saved=JSON.stringify(packet(h.w,8)),input=h.w.document.querySelector('[data-d8-import]');
  Object.defineProperty(input,'files',{configurable:true,value:[{size:saved.length,text:async()=>saved}]});
  input.dispatchEvent(new h.w.Event('change'));
  await new Promise(resolve=>setTimeout(resolve,0));
  h.scene.useModel('newton');
  await new Promise(resolve=>setTimeout(resolve,50));
  assert.equal(h.scene.snapshot().particles.model,'newton');
  assert.equal(input.validationMessage,'');
 }finally{h.close();}
});

test('a source-bound pre-async shell export still imports, while changed source bindings are rejected',async()=>{
 const h=host();try{
  h.scene.advance(.1);const saved=JSON.parse(JSON.stringify(h.scene.snapshot()));
  saved.build=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/material-pre-async-build.json'),'utf8'));
  saved.particles.source=saved.build.sources['doppelacht.js'];
  h.scene.reset();await h.scene.replay(saved);
  assert.deepEqual(JSON.parse(JSON.stringify(h.scene.snapshot().particles.materialCells)),saved.particles.materialCells);
  assert.deepEqual(JSON.parse(JSON.stringify(h.scene.snapshot().view)),saved.view);
  const actual=JSON.stringify(h.scene.snapshot());
  saved.build.sources['lab.js']='0'.repeat(64);
  await assert.rejects(h.scene.replay(saved),/Unpassende Quellen/);
  assert.equal(JSON.stringify(h.scene.snapshot()),actual);
 }finally{h.close();}
});
