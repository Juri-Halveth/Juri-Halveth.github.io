/* SPDX-License-Identifier: MIT. Autonomous artwork lifecycle contracts. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const M=require('../motion-core.js');
function fixture(calm=false){
  const queue=new Map(),rendered=[];let n=0,visible;
  const canvas={dataset:{},getContext(){return {};},getBoundingClientRect(){return {width:500,height:500};},closest(){return {classList:{add(){}}};}};
  const document={hidden:false,querySelectorAll(){return [canvas];},listeners:{},addEventListener(k,fn){this.listeners[k]=fn;}};
  const media={matches:calm,addEventListener(){}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../landing-motion.js'),'utf8'),{
    window:{JurisMotion:{...M,renderArtwork(ctx,w,h,t){rendered.push({w,h,time:t,state:M.artworkStateAt(t)});}},addEventListener(){}},
    document,devicePixelRatio:3,matchMedia(){return media;},
    requestAnimationFrame(fn){queue.set(++n,fn);return n;},
    IntersectionObserver:class{constructor(fn){visible=fn;}observe(){}},ResizeObserver:class{observe(){}}});
  return {canvas,document,rendered,queue,visibility(v){visible([{target:canvas,isIntersecting:v}]);},step(t){const entries=[...queue.values()];queue.clear();entries.forEach(fn=>fn(t));}};
}
test('the landing artwork starts by itself when visible and has no 20-second reset',()=>{
  const p=fixture();assert.equal(p.canvas.dataset.motionState,'running');assert.equal(p.rendered[0].w,750);
  p.visibility(true);p.step(0);p.step(40);assert.ok(p.rendered.at(-1).time>12);
  for(let i=2;i<=700;i++)p.step(i*40);
  assert.ok(p.rendered.at(-1).time>39);assert.notDeepEqual(M.artworkStateAt(20),M.artworkStateAt(40));
});
test('hidden and offscreen artwork yields computation and resumes without a clock leap',()=>{
  const p=fixture();p.visibility(true);p.step(0);p.step(40);const time=p.rendered.at(-1).time;
  p.visibility(false);p.step(80);assert.equal(p.queue.size,0);
  p.visibility(true);p.step(60000);assert.equal(p.rendered.at(-1).time,time);p.step(60040);
  assert.ok(Math.abs(p.rendered.at(-1).time-time-.04)<1e-9);
  p.document.hidden=true;p.document.listeners.visibilitychange();p.step(60100);assert.equal(p.queue.size,0);
});
test('system reduced-motion preference gets the lit composition with a calm clock',()=>{
  const p=fixture(true);p.visibility(true);assert.equal(p.queue.size,0);
  assert.equal(p.canvas.dataset.motionState,'calm');assert.equal(p.rendered.length,1);
});
test('artwork time accepts extended runtime and rejects invalid states explicitly',()=>{
  for(const t of [0,20,1000000])assert.ok(Number.isFinite(M.artworkStateAt(t).rotation));
  for(const t of [-1,Infinity,NaN,'2',null])assert.throws(()=>M.artworkStateAt(t));
});
