'use strict';
// Public, read-only inventory refresh. Existing editorial snapshots are never edited.
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const OWNER = 'Juri-Halveth';
const SOURCE = `https://api.github.com/users/${OWNER}/repos?type=owner&sort=full_name&per_page=100`;
const SHA = /^[a-f0-9]{40}$/;
const repositoryId = name => `repo:${OWNER.toLowerCase()}/${name.toLowerCase()}`;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const assert = (condition, message) => { if (!condition) throw Error(message); };

function plain(text) {
  return text.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, ' ').replace(/[*_`#>|]/g, ' ').replace(/\s+/g, ' ').trim();
}
function summarizeReadme(text) {
  const paragraphs = text.replace(/```[\s\S]*?```/g, '').split(/\n\s*\n/)
    .filter(value => !/^\s*(?:#|!\[|\||\[!|<!--)/.test(value))
    .filter(value => !/^\s*(?:\*\*)?(?:public HALVETH context|öffentlicher HALVETH-Kontext|finder|author|autor|автор)\s*:/iu.test(value))
    .map(plain)
    .filter(value => value.length >= 45 && !/(?:https?:\/\/|@|private|privat|confidential)/i.test(value));
  const excerpt = (paragraphs[0] || 'Public README observed; no suitable short description extracted.').slice(0, 480);
  const terms = ['NOVA', 'Seedspace', 'SCARLET', 'KORRIDOT', 'GG24', 'Gitcoin', 'Hypercerts', 'Ethereum', 'Cosmos', 'EVM', 'GTC', 'Leviathan', 'IMBA', 'Doppelacht', 'Lichtpunkt', '1001', 'EVE', 'Oraichain', 'Quellensuche', 'Materialzellen'];
  const aliases = terms.filter(term => new RegExp(`(^|[^\\p{L}\\p{N}])${term}([^\\p{L}\\p{N}]|$)`, 'iu').test(text));
  return {excerpt, aliases};
}
function mentionedRepositories(text, allowlist) {
  const names = new Map(allowlist.map(name => [name.toLowerCase(), name]));
  const found = new Set();
  const pattern = /https:\/\/(?:github\.com\/Juri-Halveth\/|juri-halveth\.github\.io\/)([A-Za-z0-9_.-]+)/gi;
  for (const match of text.matchAll(pattern)) {
    const name = names.get(match[1].replace(/\.git$/i, '').toLowerCase());
    if (name) found.add(name);
  }
  if (/https:\/\/juri-halveth\.github\.io\/(?:[\s)\]"<>]|$|(?:universum|arbeiten|modelle|forschung|belege|koennen|profil)(?:[\/#?\s)]|$))/i.test(text) && names.has('juri-halveth.github.io')) found.add(names.get('juri-halveth.github.io'));
  return [...found].sort((a, b) => a.localeCompare(b, 'en'));
}
function validateInventory(value) {
  assert(value?.schema === 'halveth.public-network-inventory.v1' && value.owner === OWNER && value.complete === true, 'Complete public network inventory required');
  assert(value.sourceUrl === SOURCE && validDate(value.observedAt), 'Inventory source or observation missing');
  assert(Array.isArray(value.repositories) && value.repositories.length > 0 && value.repositories.length <= 1000, 'Public repository list required');
  const names = new Set(), ids = new Set();
  for (const repo of value.repositories) {
    assert(typeof repo.name === 'string' && /^[A-Za-z0-9_.-]+$/.test(repo.name) && !names.has(repo.name.toLowerCase()), 'Repository identity duplicated or invalid');
    assert(Number.isSafeInteger(repo.githubRepositoryId) && repo.githubRepositoryId > 0 && !ids.has(repo.githubRepositoryId), 'GitHub repository ID duplicated or invalid');
    assert(repo.repositoryId === repositoryId(repo.name) && repo.fullName === `${OWNER}/${repo.name}` && repo.visibility === 'public', 'Public repository identity mismatch');
    assert(repo.url === `https://github.com/${repo.fullName}` && typeof repo.defaultBranch === 'string' && repo.defaultBranch.length > 0, 'Repository URL or default branch missing');
    assert(typeof repo.fork === 'boolean' && typeof repo.archived === 'boolean' && typeof repo.hasPages === 'boolean', 'Repository inventory flags required');
    assert(SHA.test(repo.head?.revision) && validDate(repo.head.observedAt) && repo.head.url === `${repo.url}/commit/${repo.head.revision}`, 'Bound HEAD required');
    const readme = repo.readme;
    assert(readme?.status === 'AVAILABLE' && typeof readme.path === 'string' && !readme.path.split('/').some(part => !part || part === '..' || part === '.') && !/[\\?#\x00-\x1f]/.test(readme.path), 'Public README path required');
    assert(readme.revision === repo.head.revision && /^[a-f0-9]{64}$/.test(readme.sha256) && Number.isSafeInteger(readme.bytes) && readme.bytes > 0 && readme.bytes <= 1048576, 'Bound README bytes required');
    assert(readme.url === `${repo.url}/blob/${readme.revision}/${readme.path.split('/').map(encodeURIComponent).join('/')}` && validDate(readme.observedAt), 'README source mismatch');
    assert(typeof readme.excerpt === 'string' && readme.excerpt.length > 0 && readme.excerpt.length <= 480 && Array.isArray(readme.aliases) && readme.aliases.every(term => typeof term === 'string' && term.length <= 80), 'Bound README description required');
    assert(Array.isArray(readme.mentionedRepositories), 'README link list required');
    names.add(repo.name.toLowerCase()); ids.add(repo.githubRepositoryId);
  }
  for (const repo of value.repositories) assert(repo.readme.mentionedRepositories.every(name => names.has(name.toLowerCase())), 'README links must stay inside the current public allowlist');
  assert(value.counts?.repositories === value.repositories.length && value.counts.forks === value.repositories.filter(repo => repo.fork).length && value.counts.pagesConfigured === value.repositories.filter(repo => repo.hasPages).length, 'Inventory counts do not match public records');
  return value;
}
async function mapLimited(values, limit, callback) {
  const result = new Array(values.length); let cursor = 0;
  await Promise.all(Array.from({length: Math.min(limit, values.length)}, async () => {
    while (cursor < values.length) { const index = cursor++; result[index] = await callback(values[index]); }
  }));
  return result;
}
async function collectInventory({fetchImpl = globalThis.fetch, now = () => new Date().toISOString(), concurrency = 3, apiToken = ''} = {}) {
  assert(Number.isSafeInteger(concurrency) && concurrency >= 1 && concurrency <= 4, 'Concurrency must be 1–4');
  assert(typeof apiToken === 'string' && !/[\s]/.test(apiToken), 'API token format invalid');
  async function get(url) {
    const parsed = new URL(url);
    assert(parsed.origin === 'https://api.github.com' && !parsed.username && !parsed.password, 'Only public GitHub API GETs are allowed');
    const headers = {Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'halveth-public-network-inventory'};
    if (apiToken) headers.Authorization = `Bearer ${apiToken}`;
    const response = await fetchImpl(url, {method: 'GET', headers, signal: AbortSignal.timeout(15000), redirect: 'error'});
    assert(response.ok, `Public inventory GET failed (${response.status}; rate-limit remaining=${response.headers?.get('x-ratelimit-remaining') ?? 'unknown'}): ${url}`);
    return response;
  }
  let url = SOURCE; const listed = [], visited = new Set();
  while (url) {
    assert(!visited.has(url) && visited.size < 10, 'Pagination loop or inventory bound exceeded'); visited.add(url);
    const parsed = new URL(url);
    assert(parsed.origin === 'https://api.github.com' && parsed.pathname === `/users/${OWNER}/repos`, 'Unexpected pagination URL');
    const response = await get(url), page = await response.json();
    assert(Array.isArray(page), 'Repository page is not an array'); listed.push(...page);
    const link = response.headers?.get('link') || '';
    url = /<([^>]+)>;\s*rel="next"/.exec(link)?.[1] || null;
  }
  // /users/{owner}/repos lists public repositories even with authentication.
  // Never use /user/repos, which also includes accessible private repositories.
  assert(listed.length > 0 && listed.every(repo => repo.private === false && repo.visibility === 'public' && repo.full_name === `${OWNER}/${repo.name}`), 'Public-owner allowlist incomplete or inconsistent');
  const allowlist = listed.map(repo => repo.name);
  const repositories = await mapLimited(listed, concurrency, async repo => {
    const base = `https://api.github.com/repos/${OWNER}/${encodeURIComponent(repo.name)}`;
    const commits = await (await get(`${base}/commits?sha=${encodeURIComponent(repo.default_branch)}&per_page=1`)).json();
    const commit = commits[0]; assert(commit && SHA.test(commit.sha), `Missing default-branch HEAD: ${repo.name}`);
    const headObservedAt = now();
    const readme = await (await get(`${base}/readme?ref=${commit.sha}`)).json();
    assert(readme.type === 'file' && readme.encoding === 'base64' && typeof readme.content === 'string', `Missing public README: ${repo.name}`);
    const bytes = Buffer.from(readme.content.replace(/\s/g, ''), 'base64');
    assert(bytes.length > 0 && bytes.length <= 1048576 && bytes.length === readme.size, `Incomplete README bytes: ${repo.name}`);
    if (apiToken) {
      assert(typeof readme.path === 'string' && !readme.path.split('/').some(part => !part || part === '..' || part === '.') && !/[\\?#\x00-\x1f]/.test(readme.path), 'Public README path required');
      const rawURL = `https://raw.githubusercontent.com/${OWNER}/${encodeURIComponent(repo.name)}/${commit.sha}/${readme.path.split('/').map(encodeURIComponent).join('/')}`;
      const publicResponse = await fetchImpl(rawURL, {method: 'GET', headers: {'User-Agent': 'halveth-public-network-inventory'}, signal: AbortSignal.timeout(15000), redirect: 'error'});
      assert(publicResponse.ok, `Anonymous README verification failed (${publicResponse.status}): ${repo.name}`);
      const publicBytes = Buffer.from(await publicResponse.arrayBuffer());
      assert(publicBytes.length <= 1048576 && publicBytes.equals(bytes), `Anonymous README bytes differ: ${repo.name}`);
    }
    const text = new TextDecoder('utf-8', {fatal: true}).decode(bytes);
    return {repositoryId: repositoryId(repo.name), githubRepositoryId: repo.id, name: repo.name, fullName: repo.full_name,
      url: repo.html_url, defaultBranch: repo.default_branch, visibility: 'public', fork: repo.fork, archived: repo.archived,
      description: repo.description || '', homepage: repo.homepage || '', hasPages: repo.has_pages,
      createdAt: repo.created_at, updatedAt: repo.updated_at, pushedAt: repo.pushed_at,
      head: {revision: commit.sha, url: `${repo.html_url}/commit/${commit.sha}`, observedAt: headObservedAt, committedAt: commit.commit?.committer?.date || null},
      readme: {status: 'AVAILABLE', path: readme.path, url: `${repo.html_url}/blob/${commit.sha}/${readme.path.split('/').map(encodeURIComponent).join('/')}`, revision: commit.sha,
        sha256: hash(bytes), bytes: bytes.length, observedAt: now(), ...summarizeReadme(text), mentionedRepositories: mentionedRepositories(text, allowlist)}};
  });
  repositories.sort((a, b) => a.name.localeCompare(b.name, 'en'));
  return validateInventory({schema: 'halveth.public-network-inventory.v1', owner: OWNER, observedAt: now(), sourceUrl: SOURCE,
    complete: true, access: apiToken ? 'PUBLIC_USER_LIST_WITH_ANONYMOUS_README_VERIFICATION' : 'ANONYMOUS_PUBLIC_GET_ONLY', claimCeiling: 'PUBLIC_METADATA_AND_README_BYTES_NOT_RUNTIME_OR_IMPACT_VERIFICATION',
    counts: {repositories: repositories.length, forks: repositories.filter(repo => repo.fork).length, pagesConfigured: repositories.filter(repo => repo.hasPages).length}, repositories});
}
function writeInventory(file, inventory) {
  validateInventory(inventory);
  const temporary = `${file}.tmp-${process.pid}`;
  fs.mkdirSync(path.dirname(file), {recursive: true});
  try { fs.writeFileSync(temporary, JSON.stringify(inventory, null, 2) + '\n'); fs.renameSync(temporary, file); }
  finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
}
async function main() {
  const file = path.resolve(__dirname, '../data/network-inventory.json');
  if (process.argv.includes('--check')) { validateInventory(JSON.parse(fs.readFileSync(file, 'utf8'))); console.log('Public network inventory is structurally valid; no remote refresh performed.'); return; }
  const inventory = await collectInventory({apiToken: process.env.NETWORK_PUBLIC_READ_TOKEN || ''});
  writeInventory(file, inventory);
  console.log(`Observed ${inventory.counts.repositories} public repositories (${inventory.counts.forks} forks); README bytes bound to each observed HEAD. Editorial snapshots unchanged.`);
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = {repositoryId, validateInventory, summarizeReadme, mentionedRepositories, collectInventory, writeInventory, SOURCE};
