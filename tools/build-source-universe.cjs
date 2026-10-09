'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = 'data/source-universe.json';
const EXCLUDED_OUTPUTS = new Set([
  OUTPUT,
  'universum/index.html',
  'en/universum/index.html',
  'ru/universum/index.html'
]);
const HISTORY_LIMIT = 160;
const REPOSITORY = 'Juri-Halveth/Juri-Halveth.github.io';
const TEXT_EXTENSIONS = new Set([
  '.cjs', '.css', '.html', '.js', '.json', '.md', '.mjs', '.ps1', '.py',
  '.sh', '.svg', '.toml', '.ts', '.tsx', '.txt', '.xml', '.yaml', '.yml'
]);

function git(args) {
  const result = spawnSync('git', args, { cwd: ROOT, maxBuffer: 32 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`git ${args[0]} failed: ${String(result.stderr || '').trim()}`);
  }
  return result.stdout;
}

function splitNul(buffer) {
  return buffer.toString('utf8').split('\0').filter(Boolean);
}

function kindFor(file) {
  if (file.startsWith('.github/workflows/')) return 'workflow';
  const ext = path.posix.extname(file).toLowerCase();
  if (/\.(?:js|cjs|mjs|ts|tsx|jsx|sh|ps1|py|rb|go|rs|java|cs|cpp|h)$/.test(ext)) return 'code';
  if (/\.(?:json|ya?ml|toml|ini|xml|csv)$/.test(ext)) return 'data';
  if (/\.(?:md|txt|rst|pdf)$/.test(ext)) return 'document';
  if (/\.(?:png|jpe?g|gif|svg|webp|mp4|webm|woff2?|ttf|otf|ico)$/.test(ext)) return 'media';
  if (/\.(?:css|html)$/.test(ext)) return 'interface';
  return 'other';
}

function addEdge(edges, seen, type, source, target, detail = '') {
  if (!source || !target || source === target) return;
  const key = `${type}\0${source}\0${target}\0${detail}`;
  if (seen.has(key)) return;
  seen.add(key);
  edges.push({ id: crypto.createHash('sha256').update(key).digest('hex').slice(0, 24), type, source, target, ...(detail ? { detail } : {}) });
}

function resolveLocalReference(sourcePath, reference, fileSet) {
  const spec = reference.trim().split(/[?#]/, 1)[0];
  if (!spec || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(spec)) return null;
  const raw = spec.startsWith('/')
    ? spec.slice(1)
    : path.posix.join(path.posix.dirname(sourcePath), spec);
  const normalized = path.posix.normalize(raw).replace(/^\.\//, '');
  if (normalized === '..' || normalized.startsWith('../')) return null;
  const candidates = [normalized];
  if (!path.posix.extname(normalized)) {
    candidates.push(...['.js', '.cjs', '.mjs', '.ts', '.tsx', '.css', '.html', '.json', '.md'].map(ext => normalized + ext));
    candidates.push(path.posix.join(normalized, 'index.js'), path.posix.join(normalized, 'index.html'));
  }
  return candidates.find(candidate => fileSet.has(candidate)) || null;
}

function referencesFor(file, text) {
  const refs = [];
  const add = (value, relation) => { if (value) refs.push({ value, relation }); };
  if (/\.(?:m?js|cjs|tsx?|jsx)$/i.test(file)) {
    for (const match of text.matchAll(/\b(?:import|export)\s+(?:[^'"\n]*?\s+from\s*)?['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)|\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      add(match[1] || match[2] || match[3], 'IMPORTS_FILE');
    }
  }
  if (/\.html?$/i.test(file)) {
    for (const match of text.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) add(match[1], 'REFERENCES_FILE');
  }
  if (/\.css$/i.test(file)) {
    for (const match of text.matchAll(/@import\s+(?:url\()?\s*["']?([^"'\s)]+)|url\(\s*["']?([^"')\s]+)/gi)) add(match[1] || match[2], 'REFERENCES_FILE');
  }
  if (/\.md$/i.test(file)) {
    for (const match of text.matchAll(/\]\(([^)]+)\)/g)) add(match[1], 'REFERENCES_FILE');
  }
  if (/\.ya?ml$/i.test(file)) {
    for (const match of text.matchAll(/^\s*uses:\s*["']?([^\s"'#]+)["']?\s*(?:#.*)?$/gmi)) {
      if (!match[1].startsWith('./')) add(match[1], 'USES_ACTION');
    }
  }
  if (/\.(?:sh|bash)$/i.test(file)) {
    for (const match of text.matchAll(/(?:^|\s)(?:source|\.)\s+["']?([^\s"']+\.(?:sh|bash))["']?/gm)) add(match[1], 'REFERENCES_FILE');
  }
  return refs;
}

function endpoint(node) {
  return {
    id: node.id,
    kind: node.kind,
    semanticAddress: node.path || node.sha || node.name || node.id,
    digest: node.sha256 || node.sha || null
  };
}

function evidenceFor(type) {
  if (type === 'IMPORTS_FILE' || type === 'REFERENCES_FILE' || type === 'USES_ACTION') {
    return { state: 'INFERRED', basis: 'STATIC_LITERAL_REFERENCE_IN_TRACKED_SOURCE' };
  }
  if (type === 'SAME_SHA256') return { state: 'OBSERVED', basis: 'MATCHING_SHA256_AND_BYTE_LENGTH' };
  if (type === 'COMMIT_TOUCHES_FILE') return { state: 'OBSERVED', basis: 'GIT_LOG_PATH_RECORD' };
  return { state: 'OBSERVED', basis: 'TRACKED_TREE_PATH_STRUCTURE' };
}

function build() {
  const head = git(['rev-parse', 'HEAD']).toString('utf8').trim();
  const headDate = git(['show', '-s', '--format=%cI', 'HEAD']).toString('utf8').trim();
  const tracked = new Set(splitNul(git(['ls-files', '--cached', '-z'])).map(file => file.replace(/\\/g, '/')));
  const files = [...tracked]
    .filter(file => !EXCLUDED_OUTPUTS.has(file))
    .filter(file => !file.startsWith('node_modules/') && !file.startsWith('.git/'))
    .sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  const fileSet = new Set(files);
  const changed = new Set([
    ...splitNul(git(['diff', '--name-only', '-z'])),
    ...splitNul(git(['diff', '--cached', '--name-only', '-z']))
  ].map(file => file.replace(/\\/g, '/')));

  const nodes = [{
    id: `repo:${REPOSITORY}`,
    kind: 'repository',
    name: REPOSITORY,
    defaultBranch: 'main',
    head,
    sourceUrl: `https://github.com/${REPOSITORY}`
  }];
  const edges = [];
  const edgeKeys = new Set();
  const fileNodes = new Map();
  const directories = new Set(['.']);
  const digestGroups = new Map();
  const lastChange = new Map();
  const commitRecords = [];

  const rawHistory = git(['log', '-n', String(HISTORY_LIMIT), '--no-renames', '-z', '--format=%H%x1e%cI%x1e%ct%x1e', '--name-only']);
  let currentCommit = null;
  for (const token of splitNul(rawHistory)) {
    if (token.includes('\x1e')) {
      const fields = token.split('\x1e');
      const sha = fields[0];
      if (!/^[0-9a-f]{40}$/i.test(sha)) continue;
      currentCommit = {
        id: `commit:${sha}`, kind: 'commit', sha, committedAt: fields[1] || '', epoch: Number(fields[2]) || 0,
        sourceUrl: `https://github.com/${REPOSITORY}/commit/${sha}`
      };
      commitRecords.push(currentCommit);
      nodes.push(currentCommit);
    } else if (currentCommit && fileSet.has(token)) {
      if (!lastChange.has(token)) lastChange.set(token, currentCommit);
      addEdge(edges, edgeKeys, 'COMMIT_TOUCHES_FILE', currentCommit.id, `file:${token}`);
    }
  }

  for (const file of files) {
    const absolute = path.join(ROOT, ...file.split('/'));
    let stat;
    try { stat = fs.lstatSync(absolute); } catch { continue; }
    const symlink = stat.isSymbolicLink();
    let bytes;
    if (symlink) bytes = Buffer.from(fs.readlinkSync(absolute), 'utf8');
    else if (stat.isFile()) bytes = fs.readFileSync(absolute);
    else continue;
    const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
    const gitBlob = crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes])).digest('hex');
    const last = lastChange.get(file);
    const node = {
      id: `file:${file}`,
      kind: 'file',
      fileKind: symlink ? 'symlink' : kindFor(file),
      path: file,
      name: path.posix.basename(file),
      size: bytes.length,
      sha256,
      gitBlob,
      sourceState: changed.has(file) ? 'WORKTREE_MODIFIED' : 'AT_HEAD',
      lastCommit: last?.sha || null,
      lastChangedAt: last?.committedAt || null,
      lastChangedEpoch: last?.epoch || 0,
      ...(changed.has(file) ? {} : { sourceUrl: `https://github.com/${REPOSITORY}/blob/${head}/${file.split('/').map(encodeURIComponent).join('/')}` })
    };
    nodes.push(node);
    fileNodes.set(file, node);
    const group = digestGroups.get(sha256) || [];
    group.push(node);
    digestGroups.set(sha256, group);
    let parent = path.posix.dirname(file);
    while (parent !== '.') {
      directories.add(parent);
      parent = path.posix.dirname(parent);
    }
  }

  nodes.push({ id: 'dir:.', kind: 'directory', path: '.' });
  addEdge(edges, edgeKeys, 'CONTAINS', `repo:${REPOSITORY}`, 'dir:.');
  for (const directory of [...directories].filter(value => value !== '.').sort((a, b) => a < b ? -1 : a > b ? 1 : 0)) {
    nodes.push({ id: `dir:${directory}`, kind: 'directory', path: directory });
    addEdge(edges, edgeKeys, 'CONTAINS', `dir:${path.posix.dirname(directory)}`, `dir:${directory}`);
  }
  for (const file of fileNodes.keys()) {
    addEdge(edges, edgeKeys, 'CONTAINS', `dir:${path.posix.dirname(file)}`, `file:${file}`);
  }

  const actions = new Map();
  for (const file of fileNodes.keys()) {
    const node = fileNodes.get(file);
    const absolute = path.join(ROOT, ...file.split('/'));
    const stat = fs.lstatSync(absolute);
    if (!stat.isFile() || stat.size > 2 * 1024 * 1024 || !TEXT_EXTENSIONS.has(path.posix.extname(file).toLowerCase())) continue;
    const text = fs.readFileSync(absolute, 'utf8');
    if (text.includes('\0')) continue;
    for (const ref of referencesFor(file, text)) {
      if (ref.relation === 'USES_ACTION') {
        const action = ref.value.split('#')[0];
        const match = action.match(/^([^/]+\/[^@]+)@(.+)$/);
        if (!match) continue;
        const [, name, refName] = match;
        const id = `action:${action}`;
        if (!actions.has(id)) {
          const pinned = /^[0-9a-f]{40}$/i.test(refName);
          actions.set(id, {
            id, kind: 'external-action', name, ref: refName,
            referenceState: pinned ? 'FULL_COMMIT_SHA' : 'MUTABLE_REF',
            sourceUrl: `https://github.com/${name}/tree/${encodeURIComponent(refName)}`
          });
        }
        addEdge(edges, edgeKeys, ref.relation, node.id, id, actions.get(id).referenceState);
      } else {
        const targetPath = resolveLocalReference(file, ref.value, fileSet);
        if (targetPath) addEdge(edges, edgeKeys, ref.relation, node.id, `file:${targetPath}`);
      }
    }
  }
  nodes.push(...actions.values());

  let sharedHashGroups = 0;
  for (const [sha256, group] of digestGroups) {
    if (group.length < 2) continue;
    const id = `content:${sha256}`;
    nodes.push({ id, kind: 'content-cluster', sha256, count: group.length });
    for (const node of group) addEdge(edges, edgeKeys, 'SAME_SHA256', node.id, id);
    sharedHashGroups++;
  }

  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const degree = new Map();
  for (const edge of edges) {
    degree.set(edge.source, (degree.get(edge.source) || 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) || 0) + 1);
  }
  for (const node of nodes) node.degree = degree.get(node.id) || 0;

  const relations = edges.map(edge => {
    const source = nodeById.get(edge.source), target = nodeById.get(edge.target);
    if (!source || !target) throw new Error(`Unbound relation endpoint: ${edge.id}`);
    const evidence = evidenceFor(edge.type);
    return {
      id: edge.id,
      definition: `${edge.type}:v1`,
      type: edge.type,
      direction: 'SOURCE_TO_TARGET',
      source: endpoint(source),
      target: endpoint(target),
      scope: 'PUBLIC_GITHUB_REPOSITORY',
      timeBasis: edge.type === 'COMMIT_TOUCHES_FILE'
        ? { kind: 'COMMIT_TIME', value: source.committedAt, epoch: source.epoch }
        : { kind: 'REPOSITORY_HEAD', value: head, committedAt: headDate },
      evidenceState: evidence.state,
      evidenceBasis: evidence.basis,
      ...(edge.detail ? { detail: edge.detail } : {})
    };
  });

  const data = {
    schema: 'halveth.source-universe.v1',
    dataClass: 'PUBLIC_REPOSITORY_METADATA',
    repository: REPOSITORY,
    head,
    headDate,
    capturedFrom: 'TRACKED_WORKTREE_FILES_ONLY',
    repositoryNodeId: `repo:${REPOSITORY}`,
    files: [...fileNodes.values()].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0),
    nodes,
    relations,
    history: {
      source: 'git log',
      commitsObserved: commitRecords.length,
      commitLimit: HISTORY_LIMIT,
      oldestCommitAt: commitRecords.at(-1)?.committedAt || null,
      newestCommitAt: commitRecords[0]?.committedAt || null,
      olderHistory: commitRecords.length === HISTORY_LIMIT ? 'OUTSIDE_SNAPSHOT' : 'NO_OLDER_COMMIT_RETURNED',
      fileStateAtHistoricalTime: 'NOT_RECONSTRUCTED'
    },
    coverage: {
      trackedFiles: fileNodes.size,
      untrackedFilesIncluded: false,
      nodeCount: nodes.length,
      relationCount: relations.length,
      sharedHashGroups,
      hashAlgorithm: 'SHA-256 over current tracked working-tree bytes',
      gitBlobAlgorithm: 'SHA-1 Git blob object digest over current tracked bytes',
      excludedGeneratedFiles: [...EXCLUDED_OUTPUTS].sort(),
      contentsStored: false,
      externalRequestsAtRuntime: false
    }
  };
  return data;
}

function write() {
  const data = build();
  fs.mkdirSync(path.dirname(path.join(ROOT, OUTPUT)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, OUTPUT), JSON.stringify(data, null, 2) + '\n');
  console.log(JSON.stringify({ state: 'SOURCE_UNIVERSE_BUILT', head: data.head, files: data.coverage.trackedFiles, nodes: data.nodes.length, relations: data.relations.length, commits: data.history.commitsObserved }));
  return data;
}

if (require.main === module) write();

module.exports = { build, write, kindFor, referencesFor, resolveLocalReference, EXCLUDED_OUTPUTS, HISTORY_LIMIT };
