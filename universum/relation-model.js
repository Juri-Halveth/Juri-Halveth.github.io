// Public catalog and source topology. The browser and build use pure adapters.
// Only declared memberships or bound source relations become edges; screen position is never evidence.
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HALVETH_RELATION_MODEL = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/;
  const SHA = /^[0-9a-f]{64}$/;
  const PROJECT_PATH = /^api\/projects\/([A-Za-z0-9][A-Za-z0-9._-]{0,79})\.json$/;
  const SCHEMA = 'halveth.public-relation-graph.v1';

  function assert(condition, message) {
    if (!condition) throw new TypeError(message);
  }

  function fromSpace(space) {
    assert(space && typeof space === 'object' && !Array.isArray(space), 'Public index required');
    assert(space.schema === 'halveth.agent-space.v1' && SHA.test(space.revision), 'Public index revision invalid');
    assert(Array.isArray(space.projects) && space.projects.length > 0 && space.projects.length <= 256 &&
      space.count === space.projects.length, 'Public project count invalid');
    const projects = new Set();
    const categories = new Set();
    const nodes = [];
    const relations = [];
    let projectCount = 0, metaCount = 0, currentProjectCount = 0, withdrawnProjectCount = 0;
    for (const project of space.projects) {
      assert(project && typeof project.id === 'string' && ID.test(project.id) && !projects.has(project.id), 'Project ID invalid or repeated');
      assert(typeof project.title === 'string' && project.title.trim() && project.title.length <= 160 &&
        !/[\u0000-\u001f]/.test(project.title), 'Project title invalid');
      assert(PROJECT_PATH.exec(project.path)?.[1] === project.id && SHA.test(project.sha256) &&
        Number.isSafeInteger(project.bytes) && project.bytes > 0 && project.bytes <= 8192,
      'Project context address invalid');
      assert(Array.isArray(project.categories) && project.categories.length > 0 && project.categories.length <= 12,
        'Project categories invalid');
      // Keep older v1 snapshots readable while preserving the two known metadata identities.
      const entryType = project.entryType ?? (['Juri-Halveth', 'Juri-Halveth.github.io'].includes(project.id) ? 'META' : 'PROJECT');
      assert(['PROJECT', 'META'].includes(entryType), 'Repository entry type invalid');
      if (entryType === 'META') metaCount += 1;
      else { projectCount += 1; if (project.editorialState === 'CURRENT') currentProjectCount += 1; if (project.editorialState === 'WITHDRAWN_FROM_PORTFOLIO') withdrawnProjectCount += 1; }
      const ownCategories = new Set();
      for (const category of project.categories) {
        assert(typeof category === 'string' && ID.test(category) && !ownCategories.has(category), 'Category ID invalid or repeated');
        ownCategories.add(category);
        categories.add(category);
        relations.push({
          id: `membership:${project.id}:${category}`,
          type: 'PUBLIC_CATALOG_CATEGORY_MEMBERSHIP',
          from: `project:${project.id}`,
          to: `category:${category}`,
          evidence: { indexRevision: space.revision, contextPath: project.path, contextSha256: project.sha256 },
          direction: 'CATALOG_ENTRY_TO_CATEGORY',
          claimCeiling: 'DECLARED_PUBLIC_INDEX_MEMBERSHIP'
        });
      }
      projects.add(project.id);
      nodes.push({ id: `project:${project.id}`, kind: entryType === 'META' ? 'PUBLIC_META' : 'PUBLIC_PROJECT', entryType, editorialState: project.editorialState ?? 'UNKNOWN', label: project.title,
        contextPath: project.path, contextBytes: project.bytes, contextSha256: project.sha256 });
    }
    for (const category of [...categories].sort()) {
      nodes.push({ id: `category:${category}`, kind: 'PUBLIC_CATEGORY', label: category });
    }
    relations.sort((a, b) => a.id.localeCompare(b.id, 'en'));
    return {
      schema: SCHEMA,
      source: { indexPath: 'api/space.json', indexRevision: space.revision,
        sourceDate: space.sourceDate, claimCeiling: space.claimCeiling },
      coverage: { repositoryCount: projects.size, projectCount, metaCount, currentProjectCount, withdrawnProjectCount, categoryCount: categories.size,
        relationCount: relations.length, visibility: 'PUBLIC_INDEX_ONLY',
        temporalStatus: 'SNAPSHOT_NOT_LIVE_RUNTIME' },
      nodes, relations
    };
  }

  // The broader inventory records explicit public source relations. It does not
  // turn README links or shared source bytes into running software connections.
  function fromNetwork(network) {
    assert(network?.schema === 'halveth.public-network.v1' && SHA.test(network.revision), 'Public network revision invalid');
    assert(typeof network.observedAt === 'string' && Number.isFinite(Date.parse(network.observedAt)), 'Public network observation missing');
    assert(Array.isArray(network.repositories) && network.repositories.length > 0 && network.repositories.length <= 1000,
      'Public network repositories invalid');
    assert(Array.isArray(network.entries) && network.entries.length <= 2000 && Array.isArray(network.relations) && network.relations.length <= 10000,
      'Public network entries or relations invalid');
    const nodes = [], relations = [], repositories = new Map(), nodeIds = new Set();
    const revision = /^[0-9a-f]{40}$/;
    const title = value => typeof value === 'string' && value.trim() && value.length <= 240 && !/[\u0000-\u001f]/.test(value);
    function sourceFor(source, repo) {
      assert(source && revision.test(source.revision) && typeof source.url === 'string', 'Public relation source binding invalid');
      let url;
      try { url = new URL(source.url); } catch { throw new TypeError('Public relation source binding invalid'); }
      const repositoryPath = new URL(repo.url).pathname;
      assert(url.origin === 'https://github.com' && !url.username && !url.password && !url.search && !url.hash &&
        (url.pathname.startsWith(`${repositoryPath}/blob/${source.revision}/`) || url.pathname === `${repositoryPath}/tree/${source.revision}`), 'Public relation source binding invalid');
      return {url: url.href, revision: source.revision, observedAt: source.observedAt || network.observedAt};
    }
    function destination(value, repo) {
      try {
        const url = new URL(value);
        const repositoryPath = new URL(repo.url).pathname;
        assert(!url.username && !url.password &&
          (url.origin === 'https://juri-halveth.github.io' ||
            (url.origin === 'https://github.com' && (url.pathname === repositoryPath || url.pathname.startsWith(repositoryPath + '/')))), 'Public destination invalid');
        return url.href;
      } catch { throw new TypeError('Public destination invalid'); }
    }
    for (const repo of network.repositories) {
      assert(repo && typeof repo.name === 'string' && /^[A-Za-z0-9._-]{1,100}$/.test(repo.name) && !['.', '..'].includes(repo.name) &&
        repo.id === `repo:juri-halveth/${repo.name.toLowerCase()}` &&
        repo.url === `https://github.com/Juri-Halveth/${repo.name}` && !repositories.has(repo.id), 'Public repository identity invalid');
      assert(revision.test(repo.head?.revision) && repo.readme?.revision === repo.head.revision &&
        ['PROJECT_SOURCE', 'FORK', 'META'].includes(repo.role) &&
        ['CURRENT', 'WITHDRAWN_FROM_PORTFOLIO'].includes(repo.editorialState), 'Public repository metadata invalid');
      const source = sourceFor(repo.readme, repo);
      const withdrawn = repo.editorialState === 'WITHDRAWN_FROM_PORTFOLIO';
      const state = withdrawn ? 'ZURÜCKGEZOGENE PRÄSENTATION · ÖFFENTLICHE QUELLE' : repo.archived ? 'ARCHIVIERTES REPOSITORY' : 'ÖFFENTLICHER QUELLSTAND';
      nodes.push({id: repo.id, kind: repo.role === 'META' ? 'PUBLIC_META' : 'PUBLIC_PROJECT', label: repo.name,
        entryType: repo.role === 'META' ? 'META' : 'PROJECT', editorialState: repo.editorialState,
        context: {state, capability: {core: `${repo.role === 'FORK' ? 'Fork' : 'Repository'} ${repo.name}`,
          value: `Öffentliche README-Fassung ${repo.head.revision.slice(0, 12)}. Die Karte öffnet den Quellcode; eigene Module sind gesonderte Knoten.`,
          boundary: 'Öffentliche Inventur und Quellenverweise. Eine Laufzeitverbindung zu anderen Projekten wird daraus nicht abgeleitet.'},
          publicEntry: {url: repo.url, label: 'Repository öffnen ↗'}, source}});
      repositories.set(repo.id, repo); nodeIds.add(repo.id);
    }
    const omittedModules = new Set();
    for (const entry of network.entries) {
      if (entry.kind !== 'module') continue;
      const repo = repositories.get(entry.repositoryId);
      assert(repo && typeof entry.id === 'string' && /^module:[A-Za-z0-9:._/-]{1,210}$/.test(entry.id) &&
        !nodeIds.has(entry.id) && title(entry.title?.de), 'Public module identity invalid');
      const source = sourceFor(entry.source, repo);
      const url = destination(entry.url, repo);
      if (repo.editorialState !== 'CURRENT') { omittedModules.add(entry.id); continue; }
      const pullRequest = /\/pull\/[1-9][0-9]*(?:[/?#]|$)/.test(new URL(url).pathname);
      const draft = pullRequest && entry.source.scope === 'PUBLIC_OPEN_DRAFT_NOT_PUBLISHED_OR_RUNTIME_INTEGRATION';
      nodes.push({id: entry.id, kind: 'PUBLIC_MODULE', label: entry.title.de, repositoryId: repo.id,
        context: {state: draft ? 'ENTWURF · PULL REQUEST' : pullRequest ? 'PULL REQUEST · QUELLVORSCHLAG' : 'VERZEICHNETER MODULEINSTIEG', capability: {core: entry.title.de,
          value: `Öffentlicher Einstieg aus ${repo.name}; gebundene Quelle ${source.revision.slice(0, 12)}.`,
          boundary: pullRequest ? 'Dieser Einstieg öffnet einen Änderungsvorschlag im Repository. Er wird hier nicht als bereitgestelltes Programm ausgewiesen.' :
            'Der Index beschreibt einen Einstieg. Quellenstand und tatsächlich ausgelieferter Lauf können getrennte Fassungen sein.'},
          publicEntry: {url, label: pullRequest ? 'Pull Request öffnen ↗' : 'Moduleinstieg öffnen ↗'}, source}});
      nodeIds.add(entry.id);
    }
    const labels = {PUBLIC_README_LINK: 'README-Verweis', PUBLIC_ENTRY_OF_REPOSITORY: 'Moduleinstieg', SHARED_SOURCE_BYTES_AT_REVISIONS: 'Gleiche Quellbytes'};
    const edgeIds = new Set();
    for (const edge of network.relations) {
      assert(edge && typeof edge.id === 'string' && edge.id.length <= 500 && !edgeIds.has(edge.id) &&
        Object.hasOwn(labels, edge.type), 'Public relation identity or type invalid');
      edgeIds.add(edge.id);
      if (omittedModules.has(edge.to) || omittedModules.has(edge.from)) continue;
      assert(nodeIds.has(edge.from) && nodeIds.has(edge.to), 'Public relation endpoint missing');
      const from = repositories.get(edge.from), to = repositories.get(edge.to);
      let sources;
      if (edge.type === 'PUBLIC_ENTRY_OF_REPOSITORY') {
        assert(from && nodes.find(node => node.id === edge.to)?.repositoryId === edge.from, 'Public module relation mismatch');
        sources = [sourceFor(edge.source, from)];
      } else if (edge.type === 'PUBLIC_README_LINK') {
        assert(from && to, 'Public README relation mismatch'); sources = [sourceFor(edge.source, from)];
      } else {
        assert(from && to && SHA.test(edge.sha256) && Array.isArray(edge.sources) && edge.sources.length === 2, 'Shared source relation mismatch');
        sources = [sourceFor(edge.sources[0], from), sourceFor(edge.sources[1], to)];
      }
      relations.push({id: edge.id, type: edge.type, label: labels[edge.type], from: edge.from, to: edge.to, sources,
        ...(edge.sha256 ? {sha256: edge.sha256} : {}), claimCeiling: 'PUBLIC_SOURCE_REFERENCE_NOT_RUNTIME_CONNECTION'});
    }
    return {schema: SCHEMA, source: {indexPath: 'api/network.json', indexRevision: network.revision,
      sourceDate: network.observedAt, claimCeiling: 'PUBLIC_METADATA_AND_SOURCE_RELATIONS'},
      coverage: {repositoryCount: repositories.size, projectCount: nodes.filter(node => node.kind === 'PUBLIC_PROJECT').length,
        metaCount: nodes.filter(node => node.kind === 'PUBLIC_META').length, moduleCount: nodes.filter(node => node.kind === 'PUBLIC_MODULE').length,
        categoryCount: 0, relationCount: relations.length, omittedWithdrawnModules: omittedModules.size,
        visibility: 'PUBLIC_INDEX_ONLY', temporalStatus: 'OBSERVED_SOURCE_SNAPSHOT_NOT_LIVE_RUNTIME'}, nodes, relations};
  }

  return Object.freeze({ fromSpace, fromNetwork });
}));
