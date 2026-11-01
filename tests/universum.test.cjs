// Site publication checks for the separately scoped Starship Lab route.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');

const route = path.join(__dirname, '..', 'universum');
const html = fs.readFileSync(path.join(route, 'index.html'), 'utf8');
const document = new JSDOM(html).window.document;

function listFiles(dir, prefix = '') {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    const name = path.posix.join(prefix, entry.name);
    return entry.isDirectory() ? listFiles(path.join(dir, entry.name), name) : [name];
  });
}

test('Starship site uses a restrictive CSP independent of the local Node server', () => {
  const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content;
  assert.ok(csp);
  for (const directive of ["default-src 'none'", "script-src 'self'", "style-src 'self'", "connect-src 'none'", "object-src 'none'", "base-uri 'none'", "form-action 'none'"]) {
    assert.ok(csp.includes(directive), directive);
  }
  assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval|https?:/);
});

test('Starship site includes only public runtime and license material', () => {
  const files = listFiles(route);
  assert.ok(files.includes('vendor/scarlet/core.js'));
  assert.ok(files.includes('vendor/realms/shared/world.mjs'));
  assert.ok(files.includes('vendor/field-difference/NOTICE'));
  assert.ok(files.includes('CREDITS.md'));
  for (const file of files) {
    assert.doesNotMatch(file, /(^|\/)(evidence|tests)(\/|$)|\.cmd$|(^|\/)server\.cjs$|\.sha256$/i);
  }
  const publishedText = files.filter(file => /\.(?:html|js|mjs|css|md|txt|json)$/.test(file))
    .map(file => fs.readFileSync(path.join(route, file), 'utf8')).join('\n');
  assert.doesNotMatch(publishedText, /C:\\Users\\|HALVETH-LUCINET-RUNTIME-v1|Dragonwilds|perspective-corridor\/0\.1\.0|HALVETH_PRO_ATLAS_V1/i);
});

test('Starship static document has no broken same-route resources or credits links', () => {
  const nodes = document.querySelectorAll('script[src], link[href], img[src], a[href]');
  for (const node of nodes) {
    const raw = node.getAttribute('src') || node.getAttribute('href');
    if (!raw || raw.startsWith('#') || /^(https?:|mailto:|data:|blob:)/i.test(raw)) continue;
    const url = new URL(raw, 'https://juri-halveth.github.io/universum/');
    assert.equal(url.origin, 'https://juri-halveth.github.io');
    assert.ok(url.pathname.startsWith('/universum/'), `${raw} escapes the route`);
    const target = path.join(route, decodeURIComponent(url.pathname.slice('/universum/'.length)));
    assert.ok(fs.existsSync(target), `Missing ${raw}`);
  }
});
