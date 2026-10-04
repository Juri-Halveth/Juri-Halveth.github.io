/* SPDX-License-Identifier: MIT. Playback contracts in a small DOM fixture. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const M=require('../motion-core.js');
function player({reduced=false}={}){
  const elements=new Map(), renders=[], frames=new Map();let next=0,observer;
  const element=id=>{if(!elements.has(id))elements.set(id,{value:'1',checked:false,dataset:{},listeners:{},attributes:{},textContent:'',
    addEventListener(name,fn){this.listeners[name]=fn;},setAttribute(name,value){this.attributes[name]=value;},
    getBoundingClientRect(){return {width:640,height:360};},getContext(){return {};},
    fire(name){this.listeners[name]?.({target:this});}});return elements.get(id);};
  const chapter=element('chapter');chapter.dataset.motionTime='11';
  const root={lang:'de'}, document={documentElement:root,hidden:false,getElementById:element,querySelectorAll:()=>[chapter],
    listeners:{},addEventListener(name,fn){this.listeners[name]=fn;}};
  const media={matches:reduced,listeners:{},addEventListener(name,fn){this.listeners[name]=fn;}};
  const api={...M,render(ctx,w,h,t,options){renders.push({state:M.stateAt(t,options),language:options.language,width:w,height:h});}};
  const context={window:{JurisMotion:api,addEventListener(){}},document,devicePixelRatio:1,matchMedia:()=>media,
    requestAnimationFrame(fn){const id=++next;frames.set(id,fn);return id;},
    IntersectionObserver:class{constructor(fn){observer=fn;}observe(){}},
    ResizeObserver:class{constructor(){}observe(){}},MutationObserver:class{constructor(){}observe(){}}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../motion-player.js'),'utf8'),context);
  return {element,document,media,renders,frames,
    step(now){const entries=[...frames];frames.clear();for(const [,fn] of entries)fn(now);},
    visibility(value){observer([{isIntersecting:value}]);},
    last(){return renders.at(-1);}};
}
test('reduced motion opens a static meaningful frame and can be played deliberately',()=>{
  const p=player({reduced:true});assert.equal(p.last().state.time,10);assert.equal(p.frames.size,0);
  p.element('motion-play').fire('click');p.step(0);p.step(50);
  assert.ok(p.last().state.time>10);assert.equal(p.element('motion-play').attributes['aria-pressed'],'true');
});
test('seeking pauses and reverse playback moves away from the chosen time',()=>{
  const p=player();p.element('motion-time').value='8';p.element('motion-time').fire('input');
  p.step(0);assert.equal(p.last().state.time,8);assert.equal(p.frames.size,0);
  p.element('motion-reverse').fire('click');p.element('motion-play').fire('click');p.step(1000);p.step(1050);
  assert.ok(Math.abs(p.last().state.time-7.95)<1e-12);
  assert.equal(p.element('motion-reverse').attributes['aria-pressed'],'true');
});
test('quarter speed changes elapsed playback, glow changes rendered state, chapter navigation pauses',()=>{
  const p=player();p.step(0);p.element('motion-speed').value='0.25';p.element('motion-speed').fire('change');
  p.step(100);p.step(200);assert.equal(p.last().state.time,.025);
  p.element('motion-glow').value='1.75';p.element('motion-glow').fire('input');assert.equal(p.last().state.glow,1.75);
  p.element('chapter').fire('click');p.step(300);assert.equal(p.last().state.time,11);assert.equal(p.frames.size,0);
});
test('hidden and offscreen playback holds time, then resumes without accumulating the gap',()=>{
  const p=player();p.step(0);p.step(50);const before=p.last().state.time;
  p.visibility(false);p.step(100);p.step(20000);assert.equal(p.last().state.time,before);assert.equal(p.frames.size,0);
  p.visibility(true);p.step(25000);assert.equal(p.last().state.time,before);p.step(25050);
  assert.ok(Math.abs(p.last().state.time-before-.05)<1e-12);
  p.document.hidden=true;p.document.listeners.visibilitychange();p.step(26000);assert.equal(p.frames.size,0);
});
