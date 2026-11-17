'use strict';
// Additive public discovery layer; historic source files and portfolio selection stay intact.
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {validateInventory, repositoryId} = require('./refresh-network-inventory.cjs');
const withdrawn = new Set(['halveth-unreal', 'halveth-realms', 'halveth-morrowind-genesis']);
const meta = new Set(['Juri-Halveth', 'Juri-Halveth.github.io']);
const hash = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const localized = text => ({de: text, en: text, ru: text});
const assert = (condition, message) => { if (!condition) throw Error('Network index: ' + message); };
const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const flatten = object => typeof object === 'string' ? object : Object.values(object || {}).join(' ');
function https(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}
function validateDocument(document, repositories) {
  assert(document && typeof document.id === 'string' && /^[A-Za-z0-9:._/-]{1,220}$/.test(document.id), 'document ID invalid');
  assert(['repository', 'module', 'site', 'catalog-entry', 'research-snapshot', 'work-sample'].includes(document.kind), 'document kind invalid');
  for (const field of ['title', 'summary']) {
    assert(document[field] && typeof document[field] === 'object' && ['de', 'en', 'ru'].every(lang => typeof document[field][lang] === 'string' && document[field][lang].trim()), 'localized document text missing');
  }
  assert(typeof document.text === 'string' && document.text.length <= 10000 && Array.isArray(document.aliases) && document.aliases.every(term => typeof term === 'string' && term.length <= 240), 'bounded searchable text required');
  assert(typeof document.historical === 'boolean' && ['CURRENT', 'WITHDRAWN_FROM_PORTFOLIO', 'ARCHIVE'].includes(document.editorialState), 'document selection state required');
  assert(https(document.url) && https(document.source?.url) && validDate(document.source.observedAt) && typeof document.source.scope === 'string' && document.source.scope.length > 0, 'safe source and observation required');
  if (document.kind === 'site') {
    assert(document.repositoryId === null && document.visibility === 'public' && document.source.revision === null, 'independent public site must not invent repository evidence');
    assert(new URL(document.url).origin === new URL(document.source.url).origin && document.source.scope === 'PUBLIC_WEBSITE_DESCRIPTION_NO_COMMIT_BINDING', 'site source binding mismatch');
  } else {
    const repo = repositories.get(document.repositoryId);
    assert(repo, 'document repository outside current public allowlist');
    assert(document.source.url.startsWith(repo.url + '/') && (!document.source.revision || /^[a-f0-9]{40}$/.test(document.source.revision)), 'document source repository mismatch');
    if (document.source.revision) assert(document.source.url.startsWith(`${repo.url}/blob/${document.source.revision}/`) || document.source.url === `${repo.url}/tree/${document.source.revision}`, 'document source revision mismatch');
    assert(new URL(document.url).hostname === 'juri-halveth.github.io' || document.url === repo.url || document.url.startsWith(repo.url + '/') || (repo.name === 'Juri-Halveth' && document.url === 'https://github.com/Juri-Halveth'), 'document destination outside public project: ' + document.id);
    if (withdrawn.has(repo.name)) assert(document.editorialState === 'WITHDRAWN_FROM_PORTFOLIO', 'withdrawn presentation reintroduced');
  }
  return document;
}
function makeNetworkIndex(root) {
  const sources = [];
  function read(file, role) {
    const bytes = fs.readFileSync(path.join(root, file)); const value = JSON.parse(bytes);
    sources.push({path: file, sha256: hash(bytes), role}); return value;
  }
  const inventory = validateInventory(read('data/network-inventory.json', 'CURRENT_PUBLIC_INVENTORY'));
  const catalog = read('data/site-catalog.json', 'DATED_EDITORIAL_SELECTION');
  const briefs = read('data/project-briefs.json', 'DATED_REVIEWED_SOURCE_DESCRIPTIONS');
  const descriptions = read('data/network-readme-descriptions.json', 'REVIEWED_PUBLIC_README_DESCRIPTIONS');
  const entries = read('data/network-entries.json', 'REVIEWED_ADDITIVE_PUBLIC_ENTRIES');
  const research = read('data/research-index.json', 'DATED_RESEARCH_SNAPSHOT');
  const technical = read('data/technical-map.json', 'DATED_TECHNICAL_SAMPLES');
  const selected = read('data/projects.json', 'DATED_SELECTED_PROJECT_SNAPSHOT');
  const publicSubset = read('data/public-repositories.json', 'DATED_SELECTED_REPOSITORY_SNAPSHOT');
  const externalSites = fs.existsSync(path.join(root, 'data/network-sites.json')) ? read('data/network-sites.json', 'REVIEWED_INDEPENDENT_PUBLIC_SITES') : {schema: 'halveth.public-network-sites.v1', documents: []};
  assert(descriptions.schema === 'halveth.reviewed-public-descriptions.v1' && Array.isArray(descriptions.documents), 'reviewed README descriptions missing');
  assert(entries.schema === 'halveth.public-network-entries.v1' && Array.isArray(entries.documents) && Array.isArray(entries.sharedSources), 'reviewed public entries missing');
  assert(externalSites.schema === 'halveth.public-network-sites.v1' && Array.isArray(externalSites.documents), 'public site entries invalid');
  const repositories = new Map(inventory.repositories.map(repo => [repo.repositoryId, repo]));
  const byFullName = new Map(inventory.repositories.map(repo => [repo.fullName.toLowerCase(), repo]));
  const documents = [], seen = new Set();
  function add(candidate) {
    if (candidate.repositoryId && !repositories.has(candidate.repositoryId)) return; // Removed/private repositories leave the active index.
    const document = structuredClone(candidate), repo = repositories.get(document.repositoryId);
    if (repo && withdrawn.has(repo.name)) document.editorialState = 'WITHDRAWN_FROM_PORTFOLIO';
    else if (repo?.archived && document.kind === 'repository') { document.historical = true; document.editorialState = 'ARCHIVE'; }
    validateDocument(document, repositories);
    assert(!seen.has(document.id), 'duplicate document ID: ' + document.id); seen.add(document.id);
    document.freshness = {state: document.kind === 'site' ? 'NO_COMMIT_BINDING' : !document.source.revision ? 'UNPINNED_SOURCE' : document.source.revision === repo.head.revision ? 'MATCHES_OBSERVED_HEAD' : 'OLDER_REVIEWED_REVISION',
      observedHead: repo?.head.revision || null, inventoryObservedAt: inventory.observedAt};
    documents.push(document);
  }
  for (const repo of inventory.repositories) {
    const candidates = descriptions.documents.filter(doc => doc.repositoryId === repo.repositoryId);
    const reviewed = candidates.find(doc => doc.source?.revision === repo.head.revision);
    if (reviewed) add(reviewed);
    else add({id: `readme:${repo.repositoryId}:${repo.head.revision}`, repositoryId: repo.repositoryId, githubRepositoryId: repo.githubRepositoryId, kind: 'repository',
      title: localized(repo.name), summary: localized(repo.readme.excerpt), url: repo.url,
      source: {url: repo.readme.url, revision: repo.head.revision, observedAt: repo.readme.observedAt, scope: 'PUBLIC_README_AUTOMATIC_EXCERPT_NOT_EDITORIAL_REVIEW'},
      aliases: [repo.name, ...repo.readme.aliases], text: [repo.name, repo.description, repo.readme.excerpt, ...repo.readme.aliases].join(' '), historical: false,
      editorialState: withdrawn.has(repo.name) ? 'WITHDRAWN_FROM_PORTFOLIO' : 'CURRENT'});
    for (const old of candidates.filter(doc => doc !== reviewed)) add({...old, historical: true, editorialState: withdrawn.has(repo.name) ? 'WITHDRAWN_FROM_PORTFOLIO' : 'ARCHIVE'});
  }
  for (const entry of [...entries.documents, ...externalSites.documents]) add(entry);
  for (const project of catalog.projects) {
    const repo = byFullName.get(project.repository.toLowerCase()); if (!repo) continue;
    const brief = briefs.projects.find(row => row.id === project.id);
    add({id: `catalog:${repo.repositoryId}:${catalog.source_date}`, repositoryId: repo.repositoryId, kind: 'catalog-entry',
      title: project.site.title, summary: project.site.summary, url: project.url,
      source: {url: project.source_url, revision: project.site.revision, observedAt: project.site.revision_observed_at || catalog.source_date, reviewedAt: catalog.source_date, scope: 'DATED_EDITORIAL_CATALOG_DESCRIPTION'},
      aliases: [project.id, project.title, `project:${project.id}`],
      text: [project.title, project.tagline, project.description, ...Object.values(project.site.title), ...Object.values(project.site.summary), brief?.core, brief?.value, brief?.boundary,
        ...(project.site.subspaces || []).flatMap(space => [space.id, flatten(space.label), flatten(space.description)])].filter(Boolean).join(' '),
      historical: true, editorialState: withdrawn.has(repo.name) ? 'WITHDRAWN_FROM_PORTFOLIO' : 'ARCHIVE'});
  }
  for (const entity of research.entities) {
    const repo = byFullName.get(entity.source.repo.toLowerCase()); if (!repo || entity.source.visibility !== 'PUBLIC') continue;
    const title = {de: entity.name.de, en: entity.name.en || entity.name.de, ru: entity.name.ru || entity.name.de};
    add({id: `research:${entity.id}`, repositoryId: repo.repositoryId, kind: 'research-snapshot', title,
      summary: localized(entity.unknowns.join(' · ')), url: entity.source.url,
      source: {url: entity.source.url, revision: entity.source.revision, observedAt: entity.observedAt, scope: 'PINNED_RESEARCH_README_SNAPSHOT'},
      aliases: [entity.id, entity.name.de], text: [flatten(title), entity.maturity, ...entity.unknowns].join(' '), historical: true, editorialState: 'ARCHIVE'});
  }
  for (const item of technical.items) {
    const evidence = item.evidence.find(record => record.role === 'source' && byFullName.has(record.repository.toLowerCase())); if (!evidence) continue;
    const repo = byFullName.get(evidence.repository.toLowerCase());
    add({id: `sample:${item.id}:${technical.reviewedAt}`, repositoryId: repo.repositoryId, kind: 'work-sample', title: item.title, summary: item.summary, url: evidence.url,
      source: {url: evidence.url, revision: evidence.revision, observedAt: technical.reviewedAt, scope: 'DATED_TECHNICAL_SOURCE_SAMPLE'},
      aliases: [item.id, ...item.technologies], text: [flatten(item.title), flatten(item.summary), flatten(item.interface), flatten(item.scope), ...item.technologies].join(' '), historical: true, editorialState: 'ARCHIVE'});
  }
  documents.sort((a, b) => a.id.localeCompare(b.id, 'en'));
  const relations = [];
  for (const repo of inventory.repositories) {
    for (const name of repo.readme.mentionedRepositories.filter(name => name.toLowerCase() !== repo.name.toLowerCase())) relations.push({id: `readme-link:${repo.repositoryId}:${repositoryId(name)}`,
      type: 'PUBLIC_README_LINK', from: repo.repositoryId, to: repositoryId(name), source: {url: repo.readme.url, revision: repo.readme.revision, sha256: repo.readme.sha256, observedAt: repo.readme.observedAt}, claimCeiling: 'EXPLICIT_LINK_NOT_DEPENDENCY_OR_CAUSATION'});
  }
  for (const document of documents.filter(doc => doc.kind === 'module')) relations.push({id: `entry:${document.id}`, type: 'PUBLIC_ENTRY_OF_REPOSITORY', from: document.repositoryId, to: document.id, source: document.source, claimCeiling: 'REVIEWED_PUBLIC_NAVIGATION_ENTRY'});
  for (const binding of entries.sharedSources) {
    if (!binding.repositoryIds.every(id => repositories.has(id))) continue;
    assert(binding.repositoryIds.length === 2 && /^[a-f0-9]{64}$/.test(binding.sha256) && binding.sources.length === 2, 'shared source binding invalid');
    for (const [index, id] of binding.repositoryIds.entries()) {
      const source = binding.sources[index], repo = repositories.get(id);
      assert(source.url.startsWith(`${repo.url}/blob/${source.revision}/`) && /^[a-f0-9]{40}$/.test(source.revision), 'shared source repository mismatch');
    }
    relations.push({id: binding.id, type: 'SHARED_SOURCE_BYTES_AT_REVISIONS', from: binding.repositoryIds[0], to: binding.repositoryIds[1], sha256: binding.sha256, sources: binding.sources, observedAt: binding.observedAt, claimCeiling: binding.claimCeiling});
  }
  relations.sort((a, b) => a.id.localeCompare(b.id, 'en'));
  const counts = {repositories: inventory.repositories.length, forks: inventory.counts.forks, nonForkRepositories: inventory.repositories.length - inventory.counts.forks,
    metaRepositories: inventory.repositories.filter(repo => meta.has(repo.name)).length, pagesConfigured: inventory.counts.pagesConfigured,
    catalogEntries: catalog.projects.length, catalogProjectEntries: catalog.projects.filter(project => project.site.entry_type === 'PROJECT').length,
    portfolioCards: catalog.projects.filter(project => project.site.entry_type === 'PROJECT' && project.site.editorial_state === 'CURRENT').length,
    documents: documents.length, currentSearchDocuments: documents.filter(doc => !doc.historical && doc.editorialState === 'CURRENT').length,
    historicalDocuments: documents.filter(doc => doc.historical).length, defaultHiddenDocuments: documents.filter(doc => doc.historical || doc.editorialState !== 'CURRENT').length,
    withdrawnRepositoryEntries: inventory.repositories.filter(repo => withdrawn.has(repo.name)).length,
    uncataloguedPublicRepositories: inventory.repositories.filter(repo => !catalog.projects.some(project => project.id === repo.name)).length,
    modules: documents.filter(doc => doc.kind === 'module').length, independentSites: documents.filter(doc => doc.kind === 'site').length, relations: relations.length};
  const coverage = {mode: 'PUBLIC_METADATA_AND_REVIEWED_ENTRY_DESCRIPTIONS', repositoryScope: 'Complete public owner inventory at observedAt, including forks and metadata repositories; README bytes are anonymously accessible.',
    searchable: ['Public repository descriptions', 'Reviewed README descriptions or bounded automatic excerpts at an observed HEAD', 'Reviewed public entry points and independent sites', 'Dated catalog, research and technical sample descriptions when archive is enabled'],
    notIndexed: ['Full repository file contents', 'All Git branches or commit history', 'Private repositories, local journals and conversations', 'Unlisted external websites or their full text'],
    archiveDefault: false, inventoryObservedAt: inventory.observedAt, selectedProjectSnapshot: {date: selected.sourceDate, records: selected.projects.length},
    selectedRepositorySnapshot: {date: publicSubset.observedAt, records: publicSubset.repositories.length}, catalogSnapshot: {date: catalog.source_date, records: catalog.projects.length},
    researchSnapshot: {date: research.capturedAt, records: research.entities.length}, technicalSnapshot: {date: technical.reviewedAt, records: technical.items.length},
    runtimeVerified: false, sourceChangedDoesNotInvalidateHistoricalEvidence: true};
  const revision = hash(json({sources, documents, relations, counts}));
  const search = {schema: 'halveth.network-search.v1', revision, observedAt: inventory.observedAt, coverage, counts, documents};
  const network = {schema: 'halveth.public-network.v1', revision, observedAt: inventory.observedAt, coverage, counts, sources,
    search: {json: 'search.json', module: 'search.mjs', sha256: hash(json(search)), queryModule: '../../network-search.mjs'},
    repositories: inventory.repositories.map(repo => ({id: repo.repositoryId, githubRepositoryId: repo.githubRepositoryId, name: repo.name, fullName: repo.fullName, url: repo.url,
      role: meta.has(repo.name) ? 'META' : repo.fork ? 'FORK' : 'PROJECT_SOURCE', fork: repo.fork, archived: repo.archived, editorialState: withdrawn.has(repo.name) ? 'WITHDRAWN_FROM_PORTFOLIO' : 'CURRENT',
      head: repo.head, readme: {url: repo.readme.url, revision: repo.readme.revision, sha256: repo.readme.sha256, observedAt: repo.readme.observedAt},
      catalogSource: (() => {const old = catalog.projects.find(project => project.id === repo.name); return old ? {url: old.source_url, revision: old.site.revision, reviewedAt: catalog.source_date, freshness: old.site.revision === null ? 'UNPINNED_SOURCE' : old.site.revision === repo.head.revision ? 'MATCHES_OBSERVED_HEAD' : 'OLDER_REVIEWED_REVISION'} : null;})()})),
    entries: documents.filter(doc => ['module', 'site'].includes(doc.kind)).map(doc => ({id: doc.id, kind: doc.kind, repositoryId: doc.repositoryId, title: doc.title, url: doc.url, source: doc.source})),
    aliases: research.entities.map(entity => ({alias: entity.id, repositoryId: byFullName.get(entity.source.repo.toLowerCase())?.repositoryId})).filter(record => record.repositoryId), relations};
  return {network, search};
}
function buildNetworkIndex(root) {
  const result = makeNetworkIndex(root), output = path.join(root, 'universum/api');
  fs.mkdirSync(output, {recursive: true});
  fs.writeFileSync(path.join(output, 'network.json'), json(result.network));
  fs.writeFileSync(path.join(output, 'search.json'), json(result.search));
  fs.writeFileSync(path.join(output, 'search.mjs'), '// Generated from the public network sources. Source-available under LICENSES.md.\nexport default ' + JSON.stringify(result.search).replace(/</g, '\\u003c') + ';\n');
  return result;
}
if (require.main === module) { const result = buildNetworkIndex(path.resolve(__dirname, '..')); console.log(`Built public network index: ${result.network.counts.repositories} repositories, ${result.search.counts.documents} descriptions.`); }
module.exports = {makeNetworkIndex, buildNetworkIndex, validateDocument};
