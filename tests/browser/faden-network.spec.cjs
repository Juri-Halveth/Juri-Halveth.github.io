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
    const moduleButton = page.locator('button[data-node-id="module:console-only:korridot"]');
    await moduleButton.press('Enter');
    await expect(page.locator('#detail')).toBeVisible();
    await expect(page.locator('#detailOpen')).toHaveAttribute('href', 'https://juri-halveth.github.io/console-only/');
    await expect(page.locator('#detailState')).toHaveText('VERZEICHNETER MODULEINSTIEG');
    await page.locator('.relation-details summary').click();
    await expect(page.locator('#detailRelations')).toContainText('Moduleinstieg');
    await expect(page.locator('#detailRelations a').first()).toHaveAttribute('href', /github\.com\/Juri-Halveth\/console-only\/blob\//);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('#close').press('Enter');
    await expect(moduleButton).toBeFocused();
    await expect(moduleButton).toBeInViewport({ratio: 1});

    const canvas = page.locator('#network');
    await canvas.scrollIntoViewIfNeeded();
    const point = await canvas.evaluate(surface => {
      const {width, height} = surface;
      const bounds = surface.getBoundingClientRect();
      const {data} = surface.getContext('2d').getImageData(0, 0, width, height);
      // Pick a painted project dot in this layout (#9af2f3), as a pointer visitor would.
      for (let pixel = Math.floor(height / 2) * width; pixel < width * height; pixel++) {
        const i = pixel * 4;
        if (data[i] === 154 && data[i + 1] === 242 && data[i + 2] === 243) {
          return {x: (pixel % width) * bounds.width / width, y: Math.floor(pixel / width) * bounds.height / height};
        }
      }
      throw new Error('No painted project dot found');
    });
    await canvas.click({position: point});
    const close = page.locator('#close');
    await close.scrollIntoViewIfNeeded();
    const graphScroll = await page.evaluate(() => scrollY);
    await close.click();
    await expect(page.locator('#detail')).toBeHidden();
    expect(await page.evaluate(() => scrollY)).toBe(graphScroll);
  });
}
