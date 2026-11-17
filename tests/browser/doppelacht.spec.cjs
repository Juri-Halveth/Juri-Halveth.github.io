const {test,expect}=require('@playwright/test');
const route='/modelle/material-20261117/forschung.html?modell=doppelacht';
test('the spatial material starts moving and exposes four primary actions',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto(route);
  await page.waitForFunction(()=>globalThis.HALVETHScenes?.[0]?.snapshot().particles.tick>3);
  const initial=await page.evaluate(()=>HALVETHScenes[0].snapshot().particles);
  expect(initial.model).toBe('DOPPELACHT_3D_EXPERIMENT');
  expect(initial.materialCells).toHaveLength(960);
  await expect(page.locator('[data-motion-actions] button:visible')).toHaveCount(4);
});
test('camera changes, material replay and a rejected import preserve the paused spatial state',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto(route);
  await page.waitForFunction(()=>globalThis.HALVETHScenes?.length);
  const result=await page.evaluate(async()=>{
    const s=HALVETHScenes[0];s.advance(.5);
    const before=s.snapshot(),camera=document.querySelector('[data-d8-camera]');
    const hashes=[];
    for(const name of ['front','side','top','oblique']){
      camera.value=name;camera.dispatchEvent(new Event('change'));
      const pixels=s.canvas.getContext('2d').getImageData(0,0,s.canvas.width,s.canvas.height);
      const h=await crypto.subtle.digest('SHA-256',pixels.data);hashes.push([...new Uint8Array(h)].join('-'));
    }
    const afterCamera=s.snapshot();
    const packet=JSON.parse(JSON.stringify(before));await s.replay(packet);
    const valid=JSON.stringify(before)===JSON.stringify(s.snapshot());
    packet.inputHistory=null;let rejected=false;try{await s.replay(packet);}catch{rejected=true;}
    return {valid,rejected,preservedAfterRejection:JSON.stringify(before)===JSON.stringify(s.snapshot()),
      sameParticles:JSON.stringify(before.particles)===JSON.stringify(afterCamera.particles),images:new Set(hashes).size};
  });
  expect(result).toEqual({valid:true,rejected:true,preservedAfterRejection:true,sameParticles:true,images:4});
});
