'use strict';
const {test, expect}=require('@playwright/test');

test('LUCINETA public laboratory: actual portal changes the worlds, reset restores control', async ({page})=>{
  await page.goto('/universum/lucineta/');
  await expect(page.locator('h1')).toContainText('LUCINETA');
  await expect(page.locator('#generation')).toHaveText('0');
  await expect(page.locator('#different')).toHaveText('0');
  await expect(page.locator('#portalState')).toHaveText('GESCHLOSSEN');

  await page.getByRole('button',{name:'Ein Schritt'}).click();
  await expect(page.locator('#generation')).toHaveText('1');
  await expect(page.locator('#different')).toHaveText('0');

  await page.getByRole('button',{name:'Auf Anfang'}).click();
  await page.getByRole('button',{name:'Portal öffnen'}).click();
  await page.getByRole('button',{name:'Ein Schritt'}).click();
  await expect(page.locator('#portalState')).toHaveText('OFFEN');
  await expect(page.locator('#firstDifference')).toHaveText('1');
  const difference=await page.locator('#different').innerText();
  expect(Number(difference)).toBeGreaterThan(0);

  await page.getByRole('button',{name:'Portal schließen'}).click();
  await page.getByRole('button',{name:'Ein Schritt'}).click();
  await expect(page.locator('#firstDifference')).toHaveText('1');
  await page.getByRole('button',{name:'Auf Anfang'}).click();
  await expect(page.locator('#generation')).toHaveText('0');
  await expect(page.locator('#portalState')).toHaveText('GESCHLOSSEN');
  await expect(page.locator('#different')).toHaveText('0');
});

test('LUCINETA mobile visitor: readable two-world navigation and accessible controls', async ({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/universum/lucineta/');
  await expect(page.locator('#canvasA')).toBeVisible();
  await expect(page.locator('#canvasB')).toBeVisible();
  await expect(page.getByRole('button',{name:'Portal öffnen'})).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.getByRole('button',{name:'Portal öffnen'}).click();
  await page.getByRole('button',{name:'Ein Schritt'}).click();
  await expect(page.locator('#firstDifference')).toHaveText('1');
});
