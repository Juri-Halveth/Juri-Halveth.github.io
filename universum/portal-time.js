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
  else root.HALVETH_PORTAL_TIME = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root, history, sources) {
  'use strict';

  const projects = Object.freeze({
    'halveth-scarlet': Object.freeze({ label: 'SCARLET', global: 'HALVETH_SCARLET_HISTORY' }),
    'halveth-forschungslabor': Object.freeze({ label: 'FORSCHUNGSLABOR', global: 'HALVETH_ENDECK_HISTORY' }),
    'halveth-field-difference-lab': Object.freeze({ label: 'FIELD DIFFERENCE', global: 'HALVETH_FIELD_DIFFERENCE_HISTORY' })
  });
  const gapLabels = Object.freeze({
    UNSELECTED_PUBLIC_HISTORY: 'Nicht ausgewählte öffentliche Commits',
    UNSELECTED_PUBLIC_HISTORY_AND_MODEL_FAMILIES: 'Ausgelassene Commits und getrennte Modellfamilien',
    NO_RUNTIME_VERIFICATION_IN_THIS_RECEIPT: 'Laufzeit in dieser Quellspur nicht geprüft',
    ORIGIN_AND_RUNTIME_NOT_VERIFIED: 'Ursprung und Laufzeit nicht geprüft',
    ORIGIN_CI_AND_RUNTIME_NOT_VERIFIED: 'Ursprung, CI und Laufzeit nicht geprüft'
  });

  function freezeDeep(value) {
    if (value && typeof value === 'object') {
      for (const child of Object.values(value)) freezeDeep(child);
      Object.freeze(value);
    }
    return value;
  }

  function durationLabel(milliseconds) {
    let seconds = Math.floor(milliseconds / 1000);
    const remainder = milliseconds % 1000;
    const days = Math.floor(seconds / 86400); seconds %= 86400;
    const hours = Math.floor(seconds / 3600); seconds %= 3600;
    const minutes = Math.floor(seconds / 60); seconds %= 60;
    const parts = [];
    if (days) parts.push(days + ' T');
    if (hours) parts.push(hours + ' h');
    if (minutes) parts.push(minutes + ' min');
    if (seconds || parts.length === 0) parts.push(seconds + ' s');
    if (remainder) parts.push(remainder + ' ms');
    return parts.join(' · ') + ' zwischen gewählten Commits';
  }

  function forProject(projectId) {
    if (typeof projectId !== 'string' || !Object.hasOwn(projects, projectId)) return null;
    if (!history || typeof history.adapt !== 'function') throw new Error('History validator unavailable.');
    const definition = projects[projectId];
    const manifest = sources ? sources[projectId] : root[definition.global];
    if (!manifest) throw new Error('Selected public history manifest unavailable.');
    const adapted = history.adapt(manifest); // Validates structure, project binding and canonical digest.
    if (adapted.projectId !== projectId) throw new Error('Public history project mismatch.');

    const events = adapted.timeline.map((event, index) => {
      const previous = adapted.timeline[index - 1];
      const milliseconds = previous ? Date.parse(event.eventTime) - Date.parse(previous.eventTime) : null;
      if (milliseconds !== null && (!Number.isSafeInteger(milliseconds) || milliseconds < 0)) {
        throw new Error('Invalid selected-commit interval.');
      }
      return {
        id: event.id,
        title: event.title,
        summary: event.summary,
        eventTime: event.eventTime,
        recordedAt: event.recordedAt,
        commit: event.commit.sha,
        url: event.commit.url,
        elapsedFromPrevious: milliseconds === null ? null : {
          milliseconds,
          label: durationLabel(milliseconds),
          basis: 'SELECTED_COMMITTER_TIMESTAMPS'
        }
      };
    });
    const gaps = adapted.gaps.map(gap => ({
      id: gap.id,
      label: Object.hasOwn(gapLabels, gap.kind) ? gapLabels[gap.kind] : 'Offene Beobachtungslücke',
      kind: gap.kind,
      scope: gap.scope,
      reason: gap.reason,
      reopenTrigger: gap.reopenTrigger
    }));
    return freezeDeep({
      projectId,
      label: definition.label,
      events,
      gaps,
      integrity: {
        algorithm: adapted.integrity.algorithm,
        digest: adapted.integrity.digest,
        status: 'STRUCTURE_AND_DIGEST_VALIDATED_ONLY'
      },
      coverage: {
        selection: adapted.coverage.selection,
        source: adapted.coverage.source,
        notes: adapted.coverage.notes,
        label: events.length + ' ausgewählte öffentliche Commits · keine vollständige Git-Historie'
      }
    });
  }

  return Object.freeze({ forProject });
}));
