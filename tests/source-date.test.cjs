'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { validateProjects } = require('../tools/validate-projects.cjs');
const data = require('../data/projects.json');
const root = path.resolve(__dirname, '..');

function htmlFiles(folder) {
  return fs.readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') return [];
    const target = path.join(folder, entry.name);
    return entry.isDirectory() ? htmlFiles(target) : entry.name.endsWith('.html') ? [target] : [];
  });
}

test('all generated portfolio footers retain the catalog source date across languages', () => {
  let count = 0;
  for (const file of htmlFiles(root)) {
    const document = new JSDOM(fs.readFileSync(file, 'utf8')).window.document;
    const footer = document.querySelector('.site-footer');
    if (!footer) continue;
    const stamp = footer.querySelector('time[data-project-source-date]');
    assert.ok(stamp, `Missing source date in ${path.relative(root, file)}`);
    assert.equal(stamp.dateTime, data.sourceDate, file);
    assert.equal(stamp.textContent, data.sourceDate, file);
    for (const flagshipStamp of document.querySelectorAll('.flagship-snapshot time')) {
      assert.equal(flagshipStamp.dateTime, stamp.dateTime, file);
    }
    count++;
    document.defaultView.close();
  }
  assert.ok(count >= 42, `Expected the generated multilingual portfolio, found ${count} pages`);
});

test('source dates are explicit calendar dates; invalid dates never become a fresh-looking footer', () => {
  for (const value of [undefined, null, '', '2026-2-3', '2026-02-29', '2026-02-31', '2026-13-01', '2026-10-27T12:00:00Z', '<b>today</b>']) {
    const altered = structuredClone(data);
    altered.sourceDate = value;
    assert.throws(() => validateProjects(altered), /source date/i, String(value));
  }
  for (const value of ['2028-02-29', '2027-03-04']) {
    const altered = structuredClone(data);
    altered.sourceDate = value;
    assert.equal(validateProjects(altered), altered);
  }
});
