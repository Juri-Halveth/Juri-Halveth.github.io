(function (root, factory) {
  'use strict';
  const isNode = typeof module === 'object' && Boolean(module.exports);
  const history = isNode ? require('./history.js') : root.HalvethHistory;
  const sources = isNode ? {
    'halveth-scarlet': require('./data/scarlet-history.json'),
    'halveth-forschungslabor': require('./data/endeck-history.json'),
    'halveth-field-difference-lab': require('./data/field-difference-history.json')
  } : null;
  const api = factory(root, history, sources);
  if (isNode) module.exports = api;
  else root.HALVETH_SOURCE_NETZ = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root, history, sources) {
  'use strict';

  const SCHEMA = 'halveth.netz.source-selection.v1';
  const CLAIM_CEILING = 'PUBLIC_REPOSITORY_COMMIT_AND_CHANGED_FILES_ONLY';
  const LANE_ID = 'selected-public-commits';
  const GLOBALS = Object.freeze({
    'halveth-scarlet': 'HALVETH_SCARLET_HISTORY',
    'halveth-forschungslabor': 'HALVETH_ENDECK_HISTORY',
    'halveth-field-difference-lab': 'HALVETH_FIELD_DIFFERENCE_HISTORY'
  });
  const builtSelections = new WeakSet();

  function freezeDeep(value) {
    if (value && typeof value === 'object') {
      for (const child of Object.values(value)) freezeDeep(child);
      Object.freeze(value);
    }
    return value;
  }

  function requireHistory() {
    if (!history || typeof history.validate !== 'function' || typeof history.adapt !== 'function') {
      throw new Error('Public history validator unavailable.');
    }
  }

  function elapsedMilliseconds(current, previous) {
    const milliseconds = Date.parse(current.committerAt) - Date.parse(previous.committerAt);
    if (!Number.isSafeInteger(milliseconds) || milliseconds < 0) {
      throw new Error('Invalid selected-commit committer interval.');
    }
    return milliseconds;
  }

  function build(manifest, expectedProjectId) {
    requireHistory();
    if (typeof expectedProjectId !== 'string' || !Object.hasOwn(GLOBALS, expectedProjectId)) {
      throw new TypeError('Expected project must be one of the three packed public histories.');
    }
    const receipt = history.validate(manifest);
    const adapted = history.adapt(manifest);
    if (adapted.projectId !== expectedProjectId || receipt.digest !== adapted.integrity.digest) {
      throw new Error('Public history project or integrity mismatch.');
    }

    // Reorder by parsed metadata time: ISO strings with and without fractions do not
    // necessarily have the same lexicographic order within one second.
    const ordered = [...adapted.timeline].sort((left, right) =>
      Date.parse(left.commit.committerAt) - Date.parse(right.commit.committerAt) || left.id.localeCompare(right.id));
    const revisions = ordered.map((event, index) => {
      const previous = ordered[index - 1];
      return {
        kind: 'SOURCE_REVISION',
        id: event.id,
        title: event.title,
        summary: event.summary,
        sha: event.commit.sha,
        authorAt: event.commit.authorAt,
        committerAt: event.commit.committerAt,
        eventTime: event.eventTime,
        eventTimeBasis: event.eventTimeBasis,
        recordedAt: event.recordedAt,
        url: event.commit.url,
        evidence: event.evidence.map(item => ({path: item.path, status: item.status, url: item.url, note: item.note})),
        previousInSelection: previous ? {
          revisionId: previous.id,
          sha: previous.commit.sha,
          relation: 'PREVIOUS_SELECTED_REVISION_ONLY_NOT_GIT_PARENT',
          gitParentStatus: 'NOT_ASSERTED'
        } : null,
        elapsedFromPrevious: previous ? {
          milliseconds: elapsedMilliseconds(event.commit, previous.commit),
          basis: 'SELECTED_COMMITTER_TIMESTAMPS'
        } : null,
        claimCeiling: event.claimCeiling
      };
    });
    const selection = freezeDeep({
      schema: SCHEMA,
      kind: 'PUBLIC_SOURCE_REVISION_SELECTION',
      projectId: expectedProjectId,
      repository: adapted.repository,
      head: adapted.observedHead,
      retrievedAt: adapted.retrievedAt,
      integrity: {
        algorithm: receipt.algorithm,
        digest: receipt.digest,
        status: 'STRUCTURE_AND_DIGEST_VALIDATED_ONLY'
      },
      coverage: {
        selection: adapted.coverage.selection,
        source: adapted.coverage.source,
        notes: adapted.coverage.notes
      },
      laneId: LANE_ID,
      revisions,
      gaps: adapted.gaps.map(gap => ({
        id: gap.id, kind: gap.kind, scope: gap.scope,
        reason: gap.reason, reopenTrigger: gap.reopenTrigger
      })),
      claimCeiling: CLAIM_CEILING
    });
    builtSelections.add(selection);
    return selection;
  }

  function viewAt(selection, index) {
    if (!selection || typeof selection !== 'object' || !builtSelections.has(selection)) {
      throw new TypeError('Selection must be created by this source adapter.');
    }
    if (!Number.isInteger(index) || index < 0 || index >= selection.revisions.length) {
      throw new RangeError('Selected revision index out of range.');
    }
    return freezeDeep({
      kind: 'SOURCE_SELECTION_PREFIX_VIEW',
      selection,
      selectedIndex: index,
      selectedRevision: selection.revisions[index],
      prefix: selection.revisions.slice(0, index + 1),
      gaps: selection.gaps
    });
  }

  function forProject(projectId) {
    if (typeof projectId !== 'string' || !Object.hasOwn(GLOBALS, projectId)) return null;
    const manifest = sources ? sources[projectId] : root[GLOBALS[projectId]];
    if (!manifest) throw new Error('Selected public history manifest unavailable.');
    return build(manifest, projectId);
  }

  return Object.freeze({build, viewAt, forProject});
}));
