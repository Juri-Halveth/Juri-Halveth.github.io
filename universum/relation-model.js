// Public catalog topology. The browser and build use the same pure adapter.
// Only explicit category membership becomes an edge; screen position is never evidence.
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
    for (const project of space.projects) {
      assert(project && typeof project.id === 'string' && ID.test(project.id) && !projects.has(project.id), 'Project ID invalid or repeated');
      assert(typeof project.title === 'string' && project.title.trim() && project.title.length <= 160 &&
        !/[\u0000-\u001f]/.test(project.title), 'Project title invalid');
      assert(PROJECT_PATH.exec(project.path)?.[1] === project.id && SHA.test(project.sha256) &&
        Number.isSafeInteger(project.bytes) && project.bytes > 0 && project.bytes <= 8192,
      'Project context address invalid');
      assert(Array.isArray(project.categories) && project.categories.length > 0 && project.categories.length <= 12,
        'Project categories invalid');
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
          direction: 'PROJECT_TO_CATEGORY',
          claimCeiling: 'DECLARED_PUBLIC_INDEX_MEMBERSHIP'
        });
      }
      projects.add(project.id);
      nodes.push({ id: `project:${project.id}`, kind: 'PUBLIC_PROJECT', label: project.title,
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
      coverage: { projectCount: projects.size, categoryCount: categories.size,
        relationCount: relations.length, visibility: 'PUBLIC_INDEX_ONLY',
        temporalStatus: 'SNAPSHOT_NOT_LIVE_RUNTIME' },
      nodes, relations
    };
  }

  return Object.freeze({ fromSpace });
}));
