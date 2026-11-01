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
  assert.doesNotMatch(publishedText, /START\.cmd|privaten gepinnten Kern|konnte nicht lokal geladen werden/i);
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

test('filtered projects show the chosen topic first and retain each other topic once', async () => {
  const dom = new JSDOM(html, {url: 'https://juri-halveth.github.io/universum/', runScripts: 'outside-only'});
  const {window} = dom;
  window.HTMLCanvasElement.prototype.getContext = () => ({setTransform() {}});
  window.matchMedia = () => ({matches: true});
  window.requestAnimationFrame = () => 0;
  window.NETZ_ENGINE = {};
  window.eval(fs.readFileSync(path.join(route, 'data/catalog.js'), 'utf8'));
  window.eval(fs.readFileSync(path.join(route, 'app.js'), 'utf8'));
  const filter = window.document.getElementById('categoryFilter');
  filter.value = 'security';
  filter.dispatchEvent(new window.Event('change'));

  const catalog = window.HALVETH_CATALOG;
  const names = new Map(catalog.categories.map(category => [category.id, category.label]));
  const visible = [...window.document.querySelectorAll('#projectList .list-item')];
  assert.equal(visible.length, catalog.projects.filter(project => project.visibility === 'public' && project.categories.includes('security')).length);
  assert.equal(new Set(visible.map(row => row.dataset.projectId)).size, visible.length);
  for (const row of visible) {
    const project = catalog.projects.find(project => project.id === row.dataset.projectId);
    const labels = [...new Set(project.categories)].map(id => names.get(id));
    const expected = [names.get('security'), ...labels.filter(label => label !== names.get('security'))];
    assert.deepEqual(row.querySelector('small').textContent.split(' · '), expected, project.id);
    assert.equal(window.document.querySelector(`.portal[data-project-id="${project.id}"] .portal-kicker`).textContent, 'SICHERHEIT');
  }

  const selected = visible.find(row => row.dataset.projectId === 'halveth-forschungslabor');
  selected.click();
  await new Promise(resolve => setTimeout(resolve, 25));
  assert.equal(window.document.getElementById('inspectCategory').textContent, selected.querySelector('small').textContent.toUpperCase());
  dom.window.close();
});

test('portfolio entrances expose one working Starship Lab route and sitemap entry', () => {
  const root = path.join(__dirname, '..');
  for (const page of ['index.html', 'en/index.html', 'ru/index.html', 'arbeiten/index.html', 'en/arbeiten/index.html', 'ru/arbeiten/index.html']) {
    const doc = new JSDOM(fs.readFileSync(path.join(root, page), 'utf8')).window.document;
    const links = [...doc.querySelectorAll('header nav a')].filter(a => a.textContent === 'Starship Lab');
    assert.equal(links.length, 1, page);
    const target = new URL(links[0].getAttribute('href'), `https://juri-halveth.github.io/${page}`);
    assert.equal(target.pathname, '/universum/', page);
  }
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  assert.equal((sitemap.match(/<loc>https:\/\/juri-halveth\.github\.io\/universum\/<\/loc>/g) || []).length, 1);
});
