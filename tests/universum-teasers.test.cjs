const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const route = path.join(root, 'universum');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/site-catalog.json'), 'utf8'));
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(route, 'teaser-manifest.js'), 'utf8'), context);
const manifest = context.window.HALVETH_TEASERS;

test('each catalog project has one distinct, local, attributed teaser and three source-scoped steps', () => {
  assert.equal(manifest.schema, 'halveth.teasers.v1');
  const ids = catalog.projects.map(project => project.id);
  assert.equal(ids.length, 18);
  assert.deepEqual(Object.keys(manifest.entries).sort(), ids.sort());
  const media = new Set();
  for (const project of catalog.projects) {
    const teaser = manifest.entries[project.id];
    assert.equal(teaser.id, project.id);
    assert.ok(teaser.title && teaser.title.length > 2);
    assert.equal(teaser.steps.length, 3, project.id);
    for (const step of teaser.steps) {
      assert.ok(step.title && step.detail && step.detail.length >= 12, project.id);
    }
    assert.match(teaser.media.src, /^assets\/(teasers|previews)\/[\w.-]+\.(svg|png|webp)$/);
    assert.ok(!media.has(teaser.media.src), `duplicate teaser media: ${teaser.media.src}`);
    media.add(teaser.media.src);
    assert.ok(fs.statSync(path.join(route, teaser.media.src)).size > 100);
    assert.ok(teaser.media.alt.length > 25 && teaser.media.label && teaser.media.credit);
    assert.match(teaser.media.source, /^https:\/\/github\.com\/Juri-Halveth\//);
    assert.ok(['screenshot', 'illustration'].includes(teaser.media.kind));
    assert.ok(!teaser.media.src.includes('system-banner'), project.id);
  }
});

test('new SVG teasers are static, self-contained project schematics', () => {
  const files = fs.readdirSync(path.join(route, 'assets/teasers')).filter(name => name.endsWith('.svg'));
  assert.equal(files.length, 13);
  for (const file of files) {
    const svg = fs.readFileSync(path.join(route, 'assets/teasers', file), 'utf8');
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(svg, /SCHEMATISCH · KEIN SCREENSHOT/);
    assert.doesNotMatch(svg, /<\s*(?:script|foreignObject|image|iframe)\b/i);
    assert.doesNotMatch(svg, /\b(?:href|xlink:href|onload|onclick|onerror)\s*=/i);
    assert.doesNotMatch(svg, /url\(\s*['"]?https?:/i);
  }
});

test('imported project images match the credited source or transformation digest', () => {
  const hash = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(route, file))).digest('hex');
  assert.equal(hash('assets/teasers/tresor-dashboard.png'), '28009d7b43cd79df34891fff0b64c20f795083f0b57f147e1630e7f7fad9d437');
  assert.equal(hash('assets/teasers/red-room-nightlight.webp'), 'ba09d05977bc42a59cfb224158ca8026737f5ca2e992f0a8dfcd334495cea516');
  assert.equal(hash('assets/teasers/cannabis-concept.webp'), '34af5a4feb694e63a876b9ebfdd2e62d90f6741843c47781ad1624bfea14c92c');
  const credits = fs.readFileSync(path.join(route, 'CREDITS.md'), 'utf8');
  assert.match(credits, /e1ca9830e84099f0e4a9a4bfdede919a5ab0eee6/);
  assert.match(credits, /f0b072571ccb1a7894a32b1ba03c9a8620995352/);
  assert.match(credits, /67e4145734cd81e9e7727e2a051da06f3145dc36/);
  assert.match(credits, /quality=82/);
});

test('screenshot source chips keep exact authors readable in the narrow project focus', () => {
  const authors = new Map([
    ['halveth-forschungslabor', 'HALVETH Open Research contributors'],
    ['halveth-tresor', 'Juri Janovski / HALVETH']
  ]);
  const screenshots = Object.values(manifest.entries).filter(entry => entry.media.kind === 'screenshot');
  assert.equal(screenshots.length, authors.size);
  for (const teaser of screenshots) {
    const {credit, source} = teaser.media;
    assert.equal(credit, `${authors.get(teaser.id)} ↗`, teaser.id);
    assert.ok(credit.length < 40, `credit must fit the 320px monospace chip: ${teaser.id}`);
    assert.match(source, /^https:\/\/github\.com\/Juri-Halveth\/[^/]+\/blob\/[0-9a-f]{40}\//);
  }
});
