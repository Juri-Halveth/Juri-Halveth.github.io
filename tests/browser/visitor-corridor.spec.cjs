'use strict';
const {test,expect}=require('@playwright/test');
test('example corridor works by keyboard in all languages, including a narrow viewport',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const lang of ['de','en','ru']){
  await page.setViewportSize({width:lang==='ru'?390:1280,height:800});
  const prefix=lang==='de'?'/':'/'+lang+'/';
  await page.goto(prefix);
  await page.locator('a[href$="arbeiten/#beispiel-scarlet"]').click();
  await expect(page).toHaveURL(prefix+'arbeiten/#beispiel-scarlet');
  const guide=page.locator('#beispiel-scarlet'),summary=guide.locator('summary');
  await summary.focus();await page.keyboard.press('Enter');
  await expect(guide).toHaveAttribute('open','');
  await expect(guide.locator('[data-depth]')).toHaveCount(4);
  for(const section of await guide.locator('[data-depth]').all())await expect(section).toBeVisible();
  await expect(guide.locator('a.button')).toHaveAttribute('href','https://juri-halveth.github.io/halveth-scarlet/?lang='+lang);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await guide.locator('a[href="#repositories"]').click();
  await expect(page).toHaveURL(prefix+'arbeiten/#repositories');
  await summary.focus();await page.keyboard.press('Enter');
  await expect(guide).not.toHaveAttribute('open','');
 }
 expect(errors).toEqual([]);
});
test('the guide and launch link remain available with JavaScript disabled',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
 await page.goto('http://127.0.0.1:4187/en/arbeiten/#beispiel-scarlet');
 const guide=page.locator('#beispiel-scarlet');await guide.locator('summary').click();
 await expect(guide.locator('a.button')).toBeVisible();
 await context.close();
});

