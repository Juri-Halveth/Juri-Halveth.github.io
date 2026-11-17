'use strict';
const {test,expect}=require('@playwright/test');

test('public network search connects GG24, Lichtpunkt and external sites from a shareable URL',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/suche/?q=GG24');
 await expect(page.locator('[data-network-id="module:console-only:gg24"]')).toBeVisible();
 await expect(page.locator('[data-network-id="module:console-only:gg24"] h3 a')).toHaveAttribute('href',/console-only\/\?spur=gg24/);
 await page.locator('#network-query').fill('Lichtpunkt');
 await expect(page.locator('#network-results')).toContainText('Lichtpunkt');
 await expect(page).toHaveURL(/q=Lichtpunkt/);
 await page.locator('#network-query').fill('zzzz-unindexed-952739');
 await expect(page.locator('#network-empty')).toBeVisible();
 await page.locator('#network-clear').click();
 await page.locator('#network-kind').selectOption('site');
 await expect(page.locator('[data-network-id="site:gratis-lernen"]')).toBeVisible();
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 expect(errors).toEqual([]);
});

test('the current project filter also searches the network in every portfolio language',async({page})=>{
 for(const prefix of ['','en/','ru/']){
  await page.goto('/'+prefix+'arbeiten/');
  await page.locator('#project-search').fill('GG24');
  await expect(page.locator('[data-network-id="module:console-only:gg24"]')).toBeVisible();
  await page.locator('#project-clear').click();
  await expect(page.locator('[data-network-bridge-results] [data-network-id]')).toHaveCount(0);
  await expect(page.locator('[data-network-all]')).not.toHaveAttribute('href',/q=/);
  await expect(page.locator('[data-project]:visible')).toHaveCount(13);
  await page.locator('#project-search').fill('GG24');
  await expect(page.locator('[data-network-id="module:console-only:gg24"]')).toBeVisible();
  await page.locator('[data-network-all]').click();
  await expect(page).toHaveURL(new RegExp('/'+prefix+'suche/\\?q=GG24'));
  await expect(page.locator('#network-query')).toHaveValue('GG24');
 }
});
