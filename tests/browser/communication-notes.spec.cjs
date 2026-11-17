'use strict';
const {test,expect}=require('@playwright/test');

test('restart waits for a note digest, archives the submitted text and preserves a newer draft',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>{
  const digest=crypto.subtle.digest.bind(crypto.subtle);
  globalThis.__releaseNoteDigests=[];
  crypto.subtle.digest=(...args)=>new Promise((resolve,reject)=>{
   __releaseNoteDigests.push(()=>digest(...args).then(resolve,reject));
  });
 });
 await page.goto('/modelle/material-20261117/labore/beziehungsfaden.html');
 await page.waitForFunction(()=>globalThis.HALVETHScenes?.[0]?.mode==='communication');
 await page.locator('[data-workshop-toggle]').click();
 const note=page.locator('#communication-note'),append=page.locator('#communication-append');
 await note.fill('Retain this note across the restart');await append.click();
 await page.waitForFunction(()=>__releaseNoteDigests.length===1);
 await note.fill('A newer draft stays editable');
 await page.locator('[data-motion-restart]').click();
 await expect(append).toBeDisabled();
 expect(await page.evaluate(()=>HALVETHScenes[0].snapshot().runId)).toBe('COMM_RUN_001');
 await page.evaluate(()=>__releaseNoteDigests.shift()());
 await page.waitForFunction(()=>HALVETHScenes[0].snapshot().runId==='COMM_RUN_002');
 const saved=await page.evaluate(()=>HALVETHScenes[0].snapshot());
 expect(saved.previousRuns).toHaveLength(1);
 expect(saved.previousRuns[0].notes).toHaveLength(1);
 expect(saved.previousRuns[0].notes[0].text).toBe('Retain this note across the restart');
 await expect(note).toHaveValue('A newer draft stays editable');
 await expect(append).toBeEnabled();
 await expect(page.locator('#communication-notice')).toHaveText('Lokale Notiz erhalten.');
});
