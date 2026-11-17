'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {collectInventory, writeInventory, summarizeReadme, SOURCE} = require('../tools/refresh-network-inventory.cjs');
const date = '2026-11-17T23:00:00Z';
function fakeApi({missingReadme = false, foreignNext = false} = {}) {
  const calls = [];
  const repo = (name, id) => ({name, id, full_name: `Juri-Halveth/${name}`, html_url: `https://github.com/Juri-Halveth/${name}`, default_branch: 'main', private: false, visibility: 'public', fork: false, archived: false, has_pages: false, description: 'Public source description', homepage: '', created_at: date, updated_at: date, pushed_at: date});
  const records = [repo('fixture-one', 1), repo('fixture-two', 2)];
  const bytes = Buffer.from('# Example\n\nA public browser model with explicit source descriptions and local scope.\n\nGG24 and Gitcoin are example keywords.\n');
  const fetchImpl = async (url, options) => {
    calls.push({url, options});
    let body, next = null, status = 200;
    if (url === SOURCE) { body = [records[0]]; next = foreignNext ? 'https://example.com/private' : SOURCE + '&page=2'; }
    else if (url === SOURCE + '&page=2') body = [records[1]];
    else if (url.includes('/commits?')) body = [{sha: 'a'.repeat(40), commit: {committer: {date}}}];
    else if (url.includes('/readme?')) { if (missingReadme) status = 404; body = {type: 'file', encoding: 'base64', path: 'README.md', content: bytes.toString('base64'), size: bytes.length}; }
    else throw Error('Unexpected URL ' + url);
    return {ok: status === 200, status, headers: {get: name => name === 'link' && next ? `<${next}>; rel="next"` : null}, json: async () => body};
  };
  return {fetchImpl, calls};
}
test('anonymous census follows pagination and binds each public README to the observed default HEAD', async () => {
  const api = fakeApi();
  const inventory = await collectInventory({fetchImpl: api.fetchImpl, now: () => date, concurrency: 2});
  assert.equal(inventory.repositories.length, 2);
  assert.deepEqual(inventory.repositories.map(repo => repo.name), ['fixture-one', 'fixture-two']);
  for (const repo of inventory.repositories) { assert.equal(repo.readme.revision, repo.head.revision); assert.match(repo.readme.sha256, /^[a-f0-9]{64}$/); }
  for (const call of api.calls) { assert.equal(call.options.method, 'GET'); assert.equal(call.options.headers.Authorization, undefined); assert.equal(call.options.redirect, 'error'); }
});
test('missing README or foreign pagination fails closed and leaves the last snapshot unchanged', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'halveth-refresh-'));
  t.after(() => fs.rmSync(directory, {recursive: true, force: true}));
  const file = path.join(directory, 'inventory.json'), valid = await collectInventory({fetchImpl: fakeApi().fetchImpl, now: () => date});
  writeInventory(file, valid); const before = fs.readFileSync(file);
  await assert.rejects(collectInventory({fetchImpl: fakeApi({missingReadme: true}).fetchImpl, now: () => date}), /GET failed/);
  const foreign = fakeApi({foreignNext: true});
  await assert.rejects(collectInventory({fetchImpl: foreign.fetchImpl, now: () => date}), /pagination URL/);
  assert.equal(foreign.calls.length, 1);
  const bad = structuredClone(valid); bad.counts.repositories++;
  assert.throws(() => writeInventory(file, bad), /counts/);
  assert.deepEqual(fs.readFileSync(file), before);
  assert.deepEqual(fs.readdirSync(directory), ['inventory.json']);
});
test('automatic excerpts are bounded descriptions and topical aliases require actual README text', () => {
  const result = summarizeReadme('# Project\n\nA sufficiently long public description of the source and its observable browser model.\n\nGitcoin and GG24.\n');
  assert.ok(result.excerpt.length <= 480);
  assert.ok(result.aliases.includes('Gitcoin')); assert.ok(result.aliases.includes('GG24')); assert.ok(!result.aliases.includes('IMBA'));
  assert.deepEqual(summarizeReadme('# Private contact\n\nprivate@example.com and local private journal names never become the automatic short excerpt.').aliases, []);
});
