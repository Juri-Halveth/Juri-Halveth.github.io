// Site publication checks for the separately scoped Starship Lab route.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
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

test('public history JSON matches browser manifests and both Node adapters load every selection', () => {
  const manifests = [
    ['halveth-scarlet', 'scarlet', 'HALVETH_SCARLET_HISTORY'],
    ['halveth-forschungslabor', 'endeck', 'HALVETH_ENDECK_HISTORY'],
    ['halveth-field-difference-lab', 'field-difference', 'HALVETH_FIELD_DIFFERENCE_HISTORY']
  ];
  const portalTime = require(path.join(route, 'portal-time.js'));
  const sourceNetz = require(path.join(route, 'source-netz.js'));
  for (const [projectId, filename, globalName] of manifests) {
    const json = JSON.parse(fs.readFileSync(path.join(route, 'data', `${filename}-history.json`), 'utf8'));
    const browser = {window: {}};
    vm.runInNewContext(fs.readFileSync(path.join(route, 'data', `${filename}-history-data.js`), 'utf8'), browser);
    assert.deepEqual(json, JSON.parse(JSON.stringify(browser.window[globalName])), projectId);
    assert.equal(portalTime.forProject(projectId).events.length, 4, projectId);
    assert.equal(sourceNetz.forProject(projectId).revisions.length, 4, projectId);
  }
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
  window.eval(fs.readFileSync(path.join(route, 'flight-model.js'), 'utf8'));
  window.eval(fs.readFileSync(path.join(route, 'teaser-manifest.js'), 'utf8'));
  window.eval(fs.readFileSync(path.join(route, 'data/briefs.js'), 'utf8'));
  window.eval(fs.readFileSync(path.join(route, 'app.js'), 'utf8'));
  assert.equal(window.document.getElementById('catalogCount').textContent, '18 EINSTIEGE · 6 THEMEN');
  const filter = window.document.getElementById('categoryFilter');
  filter.value = 'security';
  filter.dispatchEvent(new window.Event('change'));

  const catalog = window.HALVETH_CATALOG;
  const names = new Map(catalog.categories.map(category => [category.id, category.label]));
  assert.equal(window.document.getElementById('projectList').hasAttribute('role'), false);
  const visible = [...window.document.querySelectorAll('#projectList .list-item')];
  assert.equal(visible.length, catalog.projects.filter(project => project.visibility === 'public' && project.categories.includes('security')).length);
  assert.equal(new Set(visible.map(row => row.dataset.projectId)).size, visible.length);
  for (const row of visible) {
    const project = catalog.projects.find(project => project.id === row.dataset.projectId);
    assert.equal(row.tagName, 'BUTTON', project.id);
    assert.equal(row.type, 'button', project.id);
    assert.equal(row.hasAttribute('role'), false, project.id);
    assert.equal(row.getAttribute('aria-label'), `${project.title} · ${row.querySelector('small').textContent} · Projektportal öffnen`, project.id);
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

test('project focus grows from the selected entity and its own teaser leads into the local model', async () => {
  const dom = new JSDOM(html, {url: 'https://juri-halveth.github.io/universum/', runScripts: 'outside-only'});
  const {window} = dom;
  window.HTMLCanvasElement.prototype.getContext = () => ({setTransform() {}});
  window.matchMedia = () => ({matches: true});
  window.requestAnimationFrame = () => 0;
  window.NETZ_ENGINE = {};
  let scarletOpened = 0;
  window.HALVETH_SCARLET_ROOM = {open() { scarletOpened += 1; return true; }};
  const stage = window.document.getElementById('spaceStage');
  stage.getBoundingClientRect = () => ({left: 0, top: 0, right: 1280, bottom: 720, width: 1280, height: 720});
  for (const script of ['data/catalog.js', 'flight-model.js', 'teaser-manifest.js', 'data/briefs.js', 'app.js']) {
    window.eval(fs.readFileSync(path.join(route, script), 'utf8'));
  }
  window.eval(fs.readFileSync(path.join(route, 'portal-time-ui.js'), 'utf8'));
  assert.equal(window.document.getElementById('portalTime').closest('details')?.id, 'inspectDeep');
  const entry = window.HALVETH_TEASERS.entries['halveth-scarlet'];
  const tile = window.document.querySelector('.list-item[data-project-id="halveth-scarlet"]');
  tile.getBoundingClientRect = () => ({left: 240, right: 480, top: 120, bottom: 300});
  tile.click();
  await new Promise(resolve => setTimeout(resolve, 25));
  const focus = window.document.getElementById('inspectPanel');
  assert.equal(focus.hidden, false);
  assert.equal(focus.dataset.projectId, 'halveth-scarlet');
  const subspaces = window.document.getElementById('inspectSubspaces');
  assert.equal(subspaces.hidden, false);
  assert.deepEqual([...subspaces.querySelectorAll('a')].map(link=>new URL(link.href).pathname),
    ['/halveth-scarlet/entities/','/halveth-scarlet/entities/']);
  assert.equal(new URL(subspaces.querySelectorAll('a')[1].href).searchParams.get('view'),'chain');
  assert.equal(focus.style.getPropertyValue('--focus-origin-x'), '360.0px');
  assert.equal(focus.style.getPropertyValue('--focus-origin-y'), '210.0px');
  assert.equal(stage.inert, true);
  assert.equal(window.document.querySelector('.topbar').inert, true);
  assert.equal(window.document.getElementById('inspectImage').getAttribute('src'), entry.media.src);
  assert.equal(window.document.getElementById('inspectTeaserTitle').textContent, entry.steps[0].title);
  window.document.getElementById('inspectTeaserNext').click();
  assert.equal(window.document.getElementById('inspectTeaserTitle').textContent, entry.steps[1].title);
  assert.equal(window.document.getElementById('inspectTeaserIndex').textContent, '02 / 03');
  window.document.getElementById('inspectHeroModel').click();
  assert.equal(scarletOpened, 1);
  window.document.getElementById('closeInspect').click();
  assert.equal(focus.hidden, true);
  window.document.querySelector('.list-item[data-project-id="halveth-forschungslabor"]').click();
  await new Promise(resolve => setTimeout(resolve, 25));
  assert.equal(subspaces.hidden, true, 'unpublished 1001-door route is not offered in project focus');
  assert.equal(subspaces.childElementCount, 0);
  window.document.getElementById('closeInspect').click();
  assert.equal(stage.inert, true, 'returning to an open Atlas keeps the flight stage inert');
  assert.equal(window.document.getElementById('sideRail').inert, false);
  dom.window.close();
});

test('closing source and model dialogs restores the active project layer without exposing the flight controls', async () => {
  const dom = new JSDOM(html, {url: 'https://juri-halveth.github.io/universum/', runScripts: 'outside-only'});
  const {window} = dom;
  window.HTMLCanvasElement.prototype.getContext = () => ({setTransform() {}});
  window.matchMedia = () => ({matches: true});
  window.requestAnimationFrame = () => 0;
  window.NETZ_ENGINE = {};
  const stage = window.document.getElementById('spaceStage');
  stage.getBoundingClientRect = () => ({left: 0, top: 0, right: 1280, bottom: 720, width: 1280, height: 720});
  for (const script of [
    'data/catalog.js', 'flight-model.js', 'teaser-manifest.js', 'data/briefs.js',
    'history.js', 'data/scarlet-history-data.js', 'data/endeck-history-data.js',
    'data/field-difference-history-data.js', 'source-time.js', 'app.js', 'lab.js', 'source.js'
  ]) window.eval(fs.readFileSync(path.join(route, script), 'utf8'));

  const focus = window.document.getElementById('inspectPanel');
  const topbar = window.document.querySelector('.topbar');
  const rail = window.document.getElementById('sideRail');
  window.document.querySelector('.list-item[data-project-id="halveth-scarlet"]').click();
  await new Promise(resolve => setTimeout(resolve, 25));
  assert.equal(focus.hidden, false);
  window.document.getElementById('sourceButton').click();
  assert.equal(window.document.getElementById('sourcePanel').hidden, false);
  assert.equal(focus.inert, true);
  window.document.getElementById('closeSource').click();
  assert.equal(focus.inert, false, 'project focus must become operable again');
  assert.equal(stage.inert, true, 'flight stays unavailable behind project focus');
  assert.equal(topbar.inert, true);
  assert.equal(rail.inert, true);
  assert.equal(window.document.activeElement, window.document.getElementById('sourceButton'), 'focus returns to the source control');

  window.document.getElementById('closeInspect').click();
  assert.equal(topbar.inert, false, 'top bar returns after project focus closes');
  window.document.querySelector('.list-item[data-project-id="halveth-field-difference-lab"]').click();
  await new Promise(resolve => setTimeout(resolve, 25));
  // In JSDOM, dynamic import resolves relative to this test file, not the browser route.
  window.console.error = (message, error) => {
    assert.equal(message, 'Field Difference module load failed:');
    assert.equal(error?.code, 'ERR_MODULE_NOT_FOUND');
  };
  assert.equal(window.HALVETH_LAB.openField(window.document.getElementById('inspectHeroModel')), true);
  assert.equal(window.document.getElementById('labPanel').hidden, false);
  assert.equal(focus.inert, true);
  window.document.getElementById('closeLab').click();
  assert.equal(focus.inert, false);
  assert.equal(stage.inert, true);
  assert.equal(topbar.inert, true);
  assert.equal(rail.inert, true);
  assert.equal(window.document.activeElement, window.document.getElementById('inspectHeroModel'), 'focus returns to the model control');
  dom.window.close();
});

test('wheel, vertical swipe and pinch move only along depth and reverse to the same portal projection', () => {
  const dom = new JSDOM(html, {url: 'https://juri-halveth.github.io/universum/', runScripts: 'outside-only'});
  const {window} = dom;
  const gradient = {addColorStop() {}};
  const context = new Proxy({createRadialGradient: () => gradient}, {
    get(target, key) { return key in target ? target[key] : () => {}; }
  });
  window.HTMLCanvasElement.prototype.getContext = () => context;
  window.matchMedia = () => ({matches: true});
  let nextFrame;
  window.requestAnimationFrame = callback => { nextFrame = callback; return 1; };
  window.NETZ_ENGINE = {};
  const stage = window.document.getElementById('spaceStage');
  stage.getBoundingClientRect = () => ({left: 0, top: 0, right: 1280, bottom: 720, width: 1280, height: 720});
  window.eval(fs.readFileSync(path.join(route, 'data/catalog.js'), 'utf8'));
  window.eval(fs.readFileSync(path.join(route, 'flight-model.js'), 'utf8'));
  window.eval(fs.readFileSync(path.join(route, 'teaser-manifest.js'), 'utf8'));
  window.eval(fs.readFileSync(path.join(route, 'data/briefs.js'), 'utf8'));
  window.eval(fs.readFileSync(path.join(route, 'app.js'), 'utf8'));
  const frame = () => nextFrame(window.performance.now() + 1000);
  const position = window.document.getElementById('positionReadout');
  const scarlet = window.document.querySelector('.portal[data-project-id="halveth-scarlet"]');
  frame();
  const start = {left: scarlet.style.left, top: scarlet.style.top};
  assert.match(position.textContent, /^0\.0 \/ 240/);

  stage.dispatchEvent(new window.WheelEvent('wheel', {deltaY: 400, bubbles: true, cancelable: true}));
  frame();
  assert.match(position.textContent, /^14\.0 \/ 240/);
  assert.notEqual(scarlet.style.left, start.left);
  stage.dispatchEvent(new window.WheelEvent('wheel', {deltaY: -400, bubbles: true, cancelable: true}));
  frame();
  assert.match(position.textContent, /^0\.0 \/ 240/);
  assert.deepEqual({left: scarlet.style.left, top: scarlet.style.top}, start);

  const pointer = (type, id, x, y) => {
    const event = new window.Event(type, {bubbles: true});
    Object.defineProperties(event, {
      button: {value: 0}, pointerId: {value: id}, clientX: {value: x}, clientY: {value: y}
    });
    stage.dispatchEvent(event);
  };
  pointer('pointerdown', 1, 200, 300);
  pointer('pointermove', 1, 200, 220);
  frame();
  assert.match(position.textContent, /^6\.0 \/ 240/);
  pointer('pointermove', 1, 200, 300);
  pointer('pointerup', 1, 200, 300);
  frame();
  assert.match(position.textContent, /^0\.0 \/ 240/);
  assert.deepEqual({left: scarlet.style.left, top: scarlet.style.top}, start);

  pointer('pointerdown', 1, 100, 250);
  pointer('pointerdown', 2, 200, 250);
  pointer('pointermove', 2, 210, 250);
  pointer('pointermove', 2, 260, 250);
  frame();
  assert.match(position.textContent, /^5\.5 \/ 240/);
  pointer('pointermove', 2, 210, 250);
  pointer('pointerup', 2, 210, 250);
  pointer('pointerup', 1, 100, 250);
  frame();
  assert.match(position.textContent, /^0\.0 \/ 240/);
  assert.deepEqual({left: scarlet.style.left, top: scarlet.style.top}, start);
  dom.window.close();
});

test('profile source entry describes its own public destination', () => {
  const data = fs.readFileSync(path.join(route, 'data/catalog.js'), 'utf8');
  const profile = data.match(/"id": "Juri-Halveth"[\s\S]*?"description": "([^"]+)"/)?.[1];
  assert.ok(profile);
  assert.match(profile, /GitHub-Profilseite/);
  assert.match(profile, /eigener öffentlicher Einstieg/);
  assert.doesNotMatch(profile, /Der neue Entwurf ersetzt noch keine veröffentlichte Fassung/);
});

test('portfolio entrances retain an optional working Starship Lab route and sitemap entry', () => {
  const root = path.join(__dirname, '..');
  for (const page of ['index.html', 'en/index.html', 'ru/index.html', 'arbeiten/index.html', 'en/arbeiten/index.html', 'ru/arbeiten/index.html']) {
    const doc = new JSDOM(fs.readFileSync(path.join(root, page), 'utf8')).window.document;
    const links = [...doc.querySelectorAll('footer nav a')].filter(a => a.textContent.includes('Starship Lab'));
    assert.equal(links.length, 1, page);
    assert.equal(doc.querySelectorAll('header .primary-nav a').length, 4, page);
    const target = new URL(links[0].getAttribute('href'), `https://juri-halveth.github.io/${page}`);
    assert.equal(target.pathname, '/universum/', page);
  }
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  assert.equal((sitemap.match(/<loc>https:\/\/juri-halveth\.github\.io\/universum\/<\/loc>/g) || []).length, 1);
});

test('three language homepages lead with one service hero and direct project actions', () => {
  const root = path.join(__dirname, '..');
  const expectedTitles = {
    'index.html': 'Software bauen. Ergebnisse prüfen.',
    'en/index.html': 'Build software. Check results.',
    'ru/index.html': 'Создавать программы. Проверять результат.'
  };
  for (const [page, title] of Object.entries(expectedTitles)) {
    const doc = new JSDOM(fs.readFileSync(path.join(root, page), 'utf8'), {
      url: `https://juri-halveth.github.io/${page}`
    }).window.document;
    const main = doc.querySelector('main');
    const hero = main.firstElementChild;
    assert.ok(hero.classList.contains('service-hero'), page);
    assert.equal(hero.querySelector('h1')?.textContent, title, page);
    assert.equal(main.querySelectorAll('.service-hero').length,1,page);
    assert.equal(main.querySelectorAll('[data-featured-project]').length,4,page);
    assert.equal(main.querySelector('.universe-gateway'),null,page);
    assert.equal(main.querySelector('.scene-wall'),null,page);
    assert.ok(hero.querySelector('.service-card-first a.button')?.href.startsWith('https://'),page);
  }
});
