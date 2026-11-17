'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const {createHash} = require('node:crypto');
const {JSDOM} = require('jsdom');
const {stageDomain, PREVIEW_BASE, DOMAIN_BASE, SEARCH_URL} = require('../tools/stage-material-domain.cjs');
const root = path.resolve(__dirname, '..');
const preview = path.join(root, 'modelle/material-20261117');
const read = name => fs.readFileSync(path.join(preview, name), 'utf8');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

function htmlFiles(directory = preview) {
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? htmlFiles(file) : entry.name.endsWith('.html') ? [file] : [];
  });
}

test('material metadata identifies the actual preview document, including archived copies', () => {
  let canonicalDocuments = 0;
  for (const file of htmlFiles()) {
    const relative = path.relative(preview, file).split(path.sep).join('/');
    const dom = new JSDOM(fs.readFileSync(file, 'utf8'));
    try {
      const doc = dom.window.document;
      const canonicals = [...doc.querySelectorAll('link[rel="canonical"]')];
      if (doc.querySelector('nav#menu')) assert.equal(canonicals.length, 1, relative);
      if (canonicals.length) {
        canonicalDocuments++;
        assert.equal(canonicals.length, 1, relative);
        assert.equal(canonicals[0].getAttribute('href'), PREVIEW_BASE + relative, relative);
      }
      for (const meta of doc.querySelectorAll('meta[property="og:url"]')) {
        assert.equal(meta.getAttribute('content'), PREVIEW_BASE + relative, relative);
      }
    } finally { dom.window.close(); }
  }
  assert.ok(canonicalDocuments > 30, 'the archive metadata must also remain covered');
});

test('all current material entry pages offer shared search without requiring JavaScript', () => {
  let entryPages = 0;
  for (const file of htmlFiles()) {
    const dom = new JSDOM(fs.readFileSync(file, 'utf8'));
    try {
      const doc = dom.window.document;
      const nav = doc.querySelector('nav#menu');
      if (!nav) continue;
      entryPages++;
      const links = nav.querySelectorAll('a[data-network-search]');
      assert.equal(links.length, 1, file);
      assert.equal(links[0].getAttribute('href'), '/suche/', file);
      assert.equal(links[0].textContent, 'Netz durchsuchen', file);
      assert.ok(doc.querySelector('footer a[data-network-search]'), file);
      assert.ok(![...doc.querySelectorAll('a')].some(a => a.textContent === 'Navigation' && /404/.test(a.getAttribute('href'))), file);
    } finally { dom.window.close(); }
  }
  assert.equal(entryPages, 30);
  const communication = read('labore/beziehungsfaden.html');
  assert.ok(communication.includes('https://juri-halveth.github.io/universum/faden/'));
  assert.ok(!communication.includes('https://juri.halveth.de/universum/faden/'));
});

test('the audit heading and its translations describe the three actual evidence cards', () => {
  const dom = new JSDOM(read('audits.html'));
  try {
    const section = [...dom.window.document.querySelectorAll('section')].find(node => /Belegebenen/.test(node.querySelector('h2')?.textContent || ''));
    assert.ok(section);
    assert.equal(section.querySelector('h2').textContent, 'Die drei Belegebenen.');
    assert.equal(section.querySelectorAll('.triad > article').length, 3);
    const context = {};
    vm.runInNewContext(read('assets/translations-data.js'), context);
    const words = context.HALVETH_TRANSLATION_DATA['Die drei Belegebenen.'];
    assert.equal(words.en, 'The three evidence levels.');
    assert.equal(words.ru, 'Три уровня доказательств.');
    assert.equal(context.HALVETH_TRANSLATION_DATA['Netz durchsuchen'].en, 'Search the network');
  } finally { dom.window.close(); }
});

test('the preview sitemap resolves to its own current entries and excludes the error page', () => {
  const xml = new JSDOM(read('sitemap.xml'), {contentType: 'text/xml'});
  try {
    const urls = [...xml.window.document.querySelectorAll('loc')].map(node => node.textContent);
    assert.equal(new Set(urls).size, urls.length);
    for (const url of urls) {
      assert.ok(url.startsWith(PREVIEW_BASE), url);
      const relative = url.slice(PREVIEW_BASE.length);
      assert.notEqual(relative, '404.html');
      assert.ok(fs.existsSync(path.join(preview, relative)), url);
    }
    assert.ok(urls.includes(PREVIEW_BASE + 'labore/beziehungsfaden.html'));
    for (const file of htmlFiles()) {
      if (!fs.readFileSync(file, 'utf8').includes('id="menu"') || path.basename(file) === '404.html') continue;
      assert.ok(urls.includes(PREVIEW_BASE + path.relative(preview, file).split(path.sep).join('/')), file);
    }
    for (const relative of ['404.html', 'modules/spracharchiv/404.html']) {
      const page = new JSDOM(read(relative));
      assert.ok(page.window.document.querySelector('meta[name="robots"]').getAttribute('content').split(',').includes('noindex'));
      page.window.close();
    }
  } finally { xml.window.close(); }
});

test('custom-domain staging preserves source bytes and licences while changing only the publication target', t => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'halveth-domain-publication-'));
  t.after(() => fs.rmSync(temporary, {recursive: true, force: true}));
  const output = path.join(temporary, 'domain');
  assert.throws(() => stageDomain(path.join(root, 'must-not-stage-here')), /outside the repository/);
  const result = stageDomain(output);
  assert.equal(result.publicationStatus, 'STAGED_ONLY_NOT_UPLOADED');
  assert.throws(() => stageDomain(output), /already exists/);
  const staged = name => fs.readFileSync(path.join(output, name));
  const manifest = JSON.parse(staged('PUBLICATION-MANIFEST.json'));
  assert.equal(manifest.targetOrigin, DOMAIN_BASE);
  assert.equal(manifest.publicationStatus, 'STAGED_ONLY_NOT_UPLOADED');
  for (const file of manifest.files) {
    const bytes = staged(file.path);
    assert.equal(bytes.length, file.bytes, file.path);
    assert.equal(digest(bytes), file.sha256, file.path);
  }
  const dom = new JSDOM(staged('forschung.html').toString());
  try {
    assert.equal(dom.window.document.querySelector('link[rel="canonical"]').getAttribute('href'), DOMAIN_BASE + 'forschung.html');
    assert.equal(dom.window.document.querySelector('meta[property="og:url"]').getAttribute('content'), DOMAIN_BASE + 'forschung.html');
    assert.equal(dom.window.document.querySelector('a[data-network-search]').getAttribute('href'), SEARCH_URL);
  } finally { dom.window.close(); }
  assert.ok(!staged('sitemap.xml').toString().includes(PREVIEW_BASE));
  assert.ok(staged('robots.txt').toString().includes('Sitemap: ' + DOMAIN_BASE + 'sitemap.xml'));
  for (const name of ['assets/material-engine.js', 'assets/lab.js', 'assets/doppelacht.js', 'materials-LICENSE-MIT.txt', 'modules/sgra/LICENSE.txt', 'modules/wirbel/LICENSE.txt']) {
    assert.deepEqual(staged(name), fs.readFileSync(path.join(preview, name)), name);
  }
  assert.deepEqual(staged('LICENSE-HALVETH-PIRL-2.0.md'), fs.readFileSync(path.join(root, 'LICENSE-HALVETH-PIRL-2.0.md')));
  assert.ok(staged('LICENSES.md').toString().includes('/blob/' + manifest.sourceCommit + '/modelle/material-20261117/README.md'));
});
