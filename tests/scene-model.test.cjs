'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const catalog=require('../data/scene-stage.json'),{renderSceneShowcase}=require('../tools/render-showcase.cjs');
async function fixture(){
 const {mountSceneDemo}=await import('../scene-stage.mjs');const doc=new JSDOM(renderSceneShowcase(catalog,'de'),{pretendToBeVisual:true}).window.document;
 const callbacks=new Map();let id=0,visibility;const media={matches:false,addEventListener(_,fn){this.change=fn;}};
 const host={matchMedia:()=>media,requestAnimationFrame(fn){callbacks.set(++id,fn);return id;},cancelAnimationFrame(id){callbacks.delete(id);},IntersectionObserver:class{constructor(fn){visibility=fn;}observe(){}}};
 const model=mountSceneDemo(doc,host);
 return {doc,model,callbacks,media,click:id=>doc.getElementById(id).click(),step(now){const values=[...callbacks.values()];callbacks.clear();for(const fn of values)fn(now);},visible(value){visibility([{isIntersecting:value}]);}};
}
test('the embedded source distinguishes one projected place from four spatial places',async()=>{
 const {viewAt}=await import('../scene-stage.mjs');
 for(let i=0;i<1000;i++){const s=viewAt(i/1000);assert.equal(s.imagePositions,4);assert.equal(s.spacePositions,4);assert.deepEqual(s.flat.map(p=>p.id),['A','B','C','D']);}
 assert.equal(viewAt(1).imagePositions,1);assert.equal(viewAt(1).spacePositions,4);
 for(const invalid of [-1,1.001,NaN,Infinity,'1',null])assert.throws(()=>viewAt(invalid));
});
test('the source-rendered static preview and first client frame use identical coordinates',async()=>{
 const {mountSceneDemo}=await import('../scene-stage.mjs');const doc=new JSDOM(renderSceneShowcase(catalog,'de')).window.document;
 const positions=()=>[...doc.querySelectorAll('svg circle')].map(n=>[n.getAttribute('cx'),n.getAttribute('cy'),n.getAttribute('data-point-ids')]);
 const before=positions();mountSceneDemo(doc,{matchMedia:()=>({matches:true,addEventListener(){}})});assert.deepEqual(positions(),before);
});
test('end, playback, pause and seek preserve identities and allow repeated interaction',async()=>{
 const p=await fixture();assert.equal(p.callbacks.size,0);p.click('scene-end');assert.equal(p.model.time,1);assert.equal(p.doc.getElementById('scene-demo').dataset.imagePositions,'1');
 assert.equal(p.doc.querySelector('#scene-flat circle').getAttribute('data-point-ids'),'A B C D');p.click('scene-play');assert.equal(p.model.time,0);p.step(0);p.step(100);assert.ok(p.model.time>0);
 p.click('scene-play');assert.equal(p.callbacks.size,0);const stopped=p.model.time;p.step(100000);assert.equal(p.model.time,stopped);
 const slider=p.doc.getElementById('scene-time');slider.value='500';slider.dispatchEvent(new p.doc.defaultView.Event('input'));assert.equal(p.model.time,.5);assert.equal(p.model.playing,false);
});
test('a finite sequence stops at its end and yields while hidden or outside the viewport',async()=>{
 const p=await fixture();p.click('scene-play');for(let i=0;i<90;i++)p.step(i*100);assert.equal(p.model.time,1);assert.equal(p.callbacks.size,0);assert.equal(p.model.playing,false);
 p.click('scene-play');p.step(10000);p.step(10100);p.visible(false);assert.equal(p.callbacks.size,0);p.visible(true);assert.equal(p.callbacks.size,0);
 p.click('scene-play');Object.defineProperty(p.doc,'hidden',{value:true,configurable:true});p.doc.dispatchEvent(new p.doc.defaultView.Event('visibilitychange'));assert.equal(p.model.playing,false);assert.equal(p.callbacks.size,0);
});
test('a reduced-motion change stops a deliberate sequence and an unrelated page stays inert',async()=>{
 const p=await fixture();p.click('scene-play');p.media.matches=true;p.media.change();assert.equal(p.callbacks.size,0);assert.equal(p.model.playing,false);
 const {mountSceneDemo}=await import('../scene-stage.mjs');assert.equal(mountSceneDemo(new JSDOM('<main></main>').window.document),null);
});
