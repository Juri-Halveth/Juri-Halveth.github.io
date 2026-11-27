'use strict';
const {test, expect} = require('@playwright/test');
const network = require('../../universum/api/network.json');
const {fromNetwork} = require('../../universum/relation-model.js');
const graph = fromNetwork(network);

for (const viewport of [{width: 1280, height: 900}, {width: 375, height: 812}]) {
  test('public Faden source graph and module navigation at ' + viewport.width + 'px', async ({page}) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({reducedMotion: 'reduce'});
    await page.goto('/universum/faden/');
    await expect(page.locator('#projectList button')).toHaveCount(graph.nodes.length);
    await expect(page.locator('#status')).toContainText(network.repositories.length + ' Repository-Einträge');
    await page.locator('button[data-node-id="module:console-only:korridot"]').click();
    await expect(page.locator('#detail')).toBeVisible();
    await expect(page.locator('#detailOpen')).toHaveAttribute('href', 'https://juri-halveth.github.io/console-only/');
    await expect(page.locator('#detailState')).toHaveText('VERZEICHNETER MODULEINSTIEG');
    await page.locator('.relation-details summary').click();
    await expect(page.locator('#detailRelations')).toContainText('Moduleinstieg');
    await expect(page.locator('#detailRelations a').first()).toHaveAttribute('href', /github\.com\/Juri-Halveth\/console-only\/blob\//);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('#close').click();
    await expect(page.locator('button[data-node-id="module:console-only:korridot"]')).toBeFocused();
  });
}

