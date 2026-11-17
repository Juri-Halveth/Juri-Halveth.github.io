'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path');
const preview='/modelle/material-20261117/';
test.beforeEach(async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});await page.addInitScript(()=>{requestAnimationFrame=()=>0;});});

test('reference import restores controls and a second round trip preserves the same trajectory',async({page})=>{
 await page.goto(preview+'forschung.html');await page.waitForFunction(()=>globalThis.HALVETHScenes?.length,null,{polling:50});
 for(const model of ['newton','inspiral']){
  const data=await page.evaluate(async model=>{
   const scene=HALVETHScenes[0];scene.pause();scene.useModel(model);
   function set(selector,value){const e=document.querySelector(selector);e.value=String(value);e.dispatchEvent(new Event('change'));}
   set('[data-initial-separation]',3);set('[data-eccentricity]',model==='newton'?.2:0);scene.advance(.2);const first=scene.snapshot();
   set('[data-initial-separation]',4);if(model==='newton')set('[data-eccentricity]',.3);
   await scene.replay(first);const second=scene.snapshot(),controls={r0:Number(document.querySelector('[data-initial-separation]').value),eccentricity:Number(document.querySelector('[data-eccentricity]').value),enabled:!document.querySelector('[data-initial-separation]').disabled};
   await scene.replay(second);return{first:first.modelConfig,second:second.modelConfig,controls,actualR0:second.particles.parameters.r0,same:JSON.stringify(first.particles)===JSON.stringify(scene.snapshot().particles)};
  },model);
  expect(data.second).toEqual(data.first);expect(data.actualR0).toBe(3);expect(data.controls.r0).toBe(3);expect(data.controls.eccentricity).toBe(model==='newton'?.2:0);expect(data.controls.enabled).toBe(true);expect(data.same).toBe(true);
 }
});

test('display zoom changes all reference 2D views without changing the solver or allocating beyond the viewport',async({page})=>{
 await page.goto(preview+'forschung.html');await page.waitForFunction(()=>globalThis.HALVETHScenes?.length,null,{polling:50});
 const data=await page.evaluate(()=>{
  const scene=HALVETHScenes[0];scene.pause();const cases=[];
  for(const model of ['experimental','newton','inspiral']){
   scene.useModel(model);scene.advance(.1);
   for(const style of ['sharp','flow','raster','cells']){
    scene.setView({style,zoom:1});scene.draw();const bitmap=scene.canvas.toDataURL(),state=JSON.stringify(scene.snapshot().particles),input=document.querySelector('[data-display-zoom]');input.value='2';input.dispatchEvent(new Event('input'));scene.draw();cases.push({model,style,changed:bitmap!==scene.canvas.toDataURL(),same:state===JSON.stringify(scene.snapshot().particles)});
   }
  }
  const ctx=scene.canvas.getContext('2d'),original=ctx.createImageData.bind(ctx),allocations=[];
  ctx.createImageData=(w,h,...args)=>{allocations.push({w,h});if(w>scene.canvas.width||h>scene.canvas.height)throw Error('Offscreen allocation exceeds viewport');return original(w,h,...args);};
  try{scene.canvas.width+=2;scene.setView({style:'sharp',zoom:8});scene.draw();}finally{ctx.createImageData=original;}
  return{cases,allocations,canvas:{w:scene.canvas.width,h:scene.canvas.height}};
 });
 expect(data.cases).toHaveLength(12);expect(data.cases.every(c=>c.changed&&c.same)).toBe(true);expect(data.allocations.length).toBeGreaterThan(0);for(const a of data.allocations){expect(a.w).toBeLessThanOrEqual(data.canvas.w);expect(a.h).toBeLessThanOrEqual(data.canvas.h);}
});

test('model changes archive flight events before restarting their clock and allow a new visit',async({page})=>{
 await page.route('**/material-20261117/assets/studio.js',async route=>{
  const file=path.join(__dirname,'../../modelle/material-20261117/assets/studio.js'),code=fs.readFileSync(file,'utf8');
  const hook='globalThis.__reviewStudioCamera=x=>Object.assign(camera,x);';expect(code.split('})();')).toHaveLength(2);
  await route.fulfill({contentType:'text/javascript',body:code.replace('})();',hook+'})();')});
 });
 await page.goto(preview+'studio/index.html');await page.waitForFunction(()=>globalThis.HALVETHScenes?.length,null,{polling:50});
 const data=await page.evaluate(()=>{
  const scene=HALVETHScenes[0];scene.pause();document.querySelector('[data-studio=flight]').click();__reviewStudioCamera({x:0,y:0,z:-.5});scene.advance(1);const first=scene.snapshot();
  const select=document.getElementById('studio-model');select.value='newton';select.dispatchEvent(new Event('change'));const second=scene.snapshot();scene.advance(.1);const third=scene.snapshot();return{first,second,third};
 });
 expect(data.first.events).toHaveLength(1);expect(data.second.clock).toBe(0);expect(data.second.events).toHaveLength(0);expect(data.second.archivedRuns).toHaveLength(1);expect(data.second.archivedRuns[0].events).toEqual(data.first.events);expect(data.third.events).toHaveLength(1);expect(data.third.events[0].modelRunId).not.toBe(data.first.events[0].modelRunId);expect(data.third.events[0].modelType).toBe('newton');
 const download=page.waitForEvent('download');await page.locator('#studio-json').dispatchEvent('click');const file=await download,doc=JSON.parse(fs.readFileSync(await file.path(),'utf8'));expect(doc.archivedRuns[0].events).toEqual(data.first.events);
});
