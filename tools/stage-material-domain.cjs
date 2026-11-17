'use strict';

// Prepare a separate custom-domain artifact. This module has no upload or network code.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const PREFIX = 'modelle/material-20261117/';
const PREVIEW_BASE = 'https://juri-halveth.github.io/' + PREFIX;
const DOMAIN_BASE = 'https://halveth.de/';
const SEARCH_URL = 'https://juri-halveth.github.io/suche/';
const REPOSITORY = 'https://github.com/Juri-Halveth/Juri-Halveth.github.io';
const inside = (parent, value) => value === parent || value.startsWith(parent + path.sep);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

function retargetHTML(html, relativePath) {
  const target = DOMAIN_BASE + relativePath;
  const attribute = (tag, name) => tag.replace(new RegExp('\\b' + name + '=("|\')[^"\']*\\1', 'i'),
    (_, quote) => name + '=' + quote + target + quote);
  return html
    .replace(/<link\b(?=[^>]*\brel=("|')canonical\1)[^>]*>/gi, tag => attribute(tag, 'href'))
    .replace(/<meta\b(?=[^>]*\bproperty=("|')og:url\1)[^>]*>/gi, tag => attribute(tag, 'content'))
    .replace(/(<a\b[^>]*\bhref=)("|')\/suche\/\2/gi, (_, start, quote) => start + quote + SEARCH_URL + quote);
}

function publicLicenceLinks(markdown, revision) {
  // The map describes repository paths. Keep those references bound to that repository,
  // rather than pretending all other portal folders were copied to the custom domain.
  return markdown.replace(/\]\(([^)]+)\)/g, (whole, href) => {
    if (/^(?:[a-z]+:|#)/i.test(href)) return whole;
    return '](' + REPOSITORY + '/blob/' + revision + '/' + href.replace(/^\.\//, '') + ')';
  });
}

function stageDomain(destination) {
  if (!destination || !path.isAbsolute(destination)) throw new Error('Provide an absolute output directory outside this repository.');
  const target = path.resolve(destination);
  const realRoot = fs.realpathSync(ROOT);
  let ancestor = path.dirname(target);
  while (!fs.existsSync(ancestor)) ancestor = path.dirname(ancestor);
  if (inside(ROOT, target) || inside(realRoot, fs.realpathSync(ancestor))) throw new Error('The staging directory must be outside the repository.');
  if (fs.existsSync(target)) throw new Error('The staging directory already exists; nothing was overwritten.');

  const revision = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: ROOT, encoding: 'utf8'}).trim();
  const tracked = execFileSync('git', ['ls-files', '-z', '--', PREFIX], {cwd: ROOT, encoding: 'utf8'}).split('\0').filter(Boolean);
  if (!tracked.length) throw new Error('The tracked public material source is missing.');
  const files = [];
  for (const repositoryPath of tracked) {
    const relativePath = repositoryPath.slice(PREFIX.length);
    const source = path.join(ROOT, repositoryPath);
    if (!relativePath || !fs.lstatSync(source).isFile() || !inside(fs.realpathSync(path.join(ROOT, PREFIX)), fs.realpathSync(source))) {
      throw new Error('Only ordinary tracked files within the public material directory can be staged: ' + repositoryPath);
    }
    let bytes = fs.readFileSync(source);
    if (relativePath.endsWith('.html')) bytes = Buffer.from(retargetHTML(bytes.toString('utf8'), relativePath));
    if (relativePath === 'sitemap.xml') bytes = Buffer.from(bytes.toString('utf8').split(PREVIEW_BASE).join(DOMAIN_BASE));
    if (relativePath === 'robots.txt') bytes = Buffer.from('User-agent: *\nAllow: /\nSitemap: ' + DOMAIN_BASE + 'sitemap.xml\n');
    if (relativePath === 'README.md') {
      bytes = Buffer.from(bytes.toString('utf8')
        .split('../../universum/faden/').join('https://juri-halveth.github.io/universum/faden/')
        .split('../../LICENSE-HALVETH-PIRL-2.0.md').join('LICENSE-HALVETH-PIRL-2.0.md')
        .split('../../LICENSES.md').join('LICENSES.md'));
    }
    files.push({relativePath, bytes, source: repositoryPath});
  }
  for (const name of ['LICENSE-HALVETH-PIRL-2.0.md', 'LICENSES.md', 'PUBLICATION-DOMAINS.md']) {
    let bytes = fs.readFileSync(path.join(ROOT, name));
    if (name === 'LICENSES.md') bytes = Buffer.from(publicLicenceLinks(bytes.toString('utf8'), revision));
    files.push({relativePath: name, bytes, source: name});
  }

  // Validate every input before creating any output. Never replace an existing directory.
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.mkdirSync(target);
  for (const file of files) {
    const output = path.join(target, file.relativePath);
    fs.mkdirSync(path.dirname(output), {recursive: true});
    fs.writeFileSync(output, file.bytes, {flag: 'wx'});
  }
  const manifest = {
    schema: 'halveth.custom-domain-staging.v1',
    publicationStatus: 'STAGED_ONLY_NOT_UPLOADED',
    targetOrigin: DOMAIN_BASE,
    previewOrigin: PREVIEW_BASE,
    repository: REPOSITORY,
    sourceCommit: revision,
    contentSource: 'WORKING_TREE_OF_TRACKED_PUBLIC_MATERIAL_FILES',
    note: 'File digests identify the staged bytes. The commit identifies the source baseline, not an assertion that the working tree was clean or that the domain was updated.',
    generatedAt: new Date().toISOString(),
    files: files.map(file => ({path: file.relativePath, source: file.source, bytes: file.bytes.length, sha256: digest(file.bytes)}))
  };
  fs.writeFileSync(path.join(target, 'PUBLICATION-MANIFEST.json'), JSON.stringify(manifest, null, 2) + '\n', {flag: 'wx'});
  return {directory: target, files: manifest.files.length, publicationStatus: manifest.publicationStatus};
}

if (require.main === module) {
  try {
    if (process.argv.length !== 3 || process.argv[2] === '--help') {
      console.log('Usage: node tools/stage-material-domain.cjs /absolute/new-directory-outside-repository');
      process.exitCode = process.argv[2] === '--help' ? 0 : 1;
    } else console.log(JSON.stringify(stageDomain(process.argv[2]), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {stageDomain, retargetHTML, PREVIEW_BASE, DOMAIN_BASE, SEARCH_URL};
