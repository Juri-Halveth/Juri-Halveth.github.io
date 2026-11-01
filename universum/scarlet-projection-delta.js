/* Local comparison of two projections of one caller-owned GStarLiving core. */
(function (root, factory) {
  'use strict';
  const isNode = typeof module === 'object' && Boolean(module.exports);
  const api = factory(root, isNode);
  if (isNode) module.exports = api;
  else root.HALVETH_SCARLET_PROJECTION_DELTA = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root, isNode) {
  'use strict';

  const DIGEST_KIND = 'ADAPTER_DERIVED_FULL_SNAPSHOT_SHA256';
  const OMITTED_NODE_KEYS = Object.freeze([
    'profileId', 'role', 'enRole', 'membrane', 'inbox', 'processing',
    'nextPulse', 'lastSignal', 'energy', 'memory', 'nextSense',
    'nextWaveInput', 'ancestry'
  ]);
  const ADDED_NODE_KEYS = Object.freeze(['temperature']);
  const VARIABLE_TOP_LEVEL_KEYS = new Set(['nodes', 'events', 'coverage']);
  const VARIABLE_COVERAGE_KEYS = new Set(['history', 'projection']);

  function fail(message) { throw new TypeError('SCARLET projection contract: ' + message); }
  function freezeDeep(value) {
    if (value && typeof value === 'object') {
      for (const child of Object.values(value)) freezeDeep(child);
      Object.freeze(value);
    }
    return value;
  }
  function equalJson(left, right) {
    if (Object.is(left, right)) return true;
    if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;
    if (Array.isArray(left) !== Array.isArray(right)) return false;
    if (Array.isArray(left)) return left.length === right.length && left.every((item, index) => equalJson(item, right[index]));
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    return equalJson(leftKeys, rightKeys) && leftKeys.every(key => equalJson(left[key], right[key]));
  }
  function sourceSnapshot(core, projection) {
    let json;
    try { json = JSON.stringify(core.snapshot(projection)); }
    catch { fail('snapshot must be finite plain JSON.'); }
    if (typeof json !== 'string') fail('snapshot must be a JSON object.');
    const value = JSON.parse(json);
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail('snapshot must be a JSON object.');
    return {json, value};
  }
  function nodeMap(snapshot, name) {
    if (!Array.isArray(snapshot.nodes) || !snapshot.nodes.length) fail(name + ' needs a nonempty cell array.');
    const map = new Map();
    for (const node of snapshot.nodes) {
      if (!node || typeof node !== 'object' || Array.isArray(node) ||
          typeof node.id !== 'string' || !node.id || map.has(node.id)) fail(name + ' has an invalid or duplicate cell ID.');
      map.set(node.id, node);
    }
    return map;
  }
  function sameKeySet(left, right) {
    return equalJson(Object.keys(left).sort(), Object.keys(right).sort());
  }

  async function sha256(json) {
    const subtle = root.crypto?.subtle || (isNode ? require('node:crypto').webcrypto.subtle : null);
    const Encoder = root.TextEncoder;
    if (!subtle || typeof subtle.digest !== 'function' || typeof Encoder !== 'function') {
      throw new Error('Local WebCrypto SHA-256 is unavailable.');
    }
    const digest = await subtle.digest('SHA-256', new Encoder().encode(json));
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async function capture(core, selectedId) {
    if (!core || typeof core.snapshot !== 'function') throw new TypeError('Caller-owned GStarLiving core with snapshot() required.');
    if (typeof selectedId !== 'string' || !selectedId) throw new TypeError('A stable selected cell ID is required.');

    // All three calls and the byte comparison happen before the first await.
    // This catches snapshot-visible same-tick gap, reshape and remainder changes.
    const before = sourceSnapshot(core, 'full');
    const renderRecord = sourceSnapshot(core, 'render');
    const after = sourceSnapshot(core, 'full');
    if (before.json !== after.json) fail('core changed between the two Full snapshots.');
    const full = before.value;
    const render = renderRecord.value;

    if (full.model !== 'LOCAL_MOVING_CELL_ECOLOGY' || render.model !== full.model ||
        full.version !== '3.0.0' || render.version !== full.version ||
        !Number.isSafeInteger(full.seed) || full.seed < 1 || full.seed > 0xffffffff || render.seed !== full.seed ||
        !Number.isSafeInteger(full.tick) || full.tick < 0 || render.tick !== full.tick ||
        !Number.isSafeInteger(full.modelMs) || full.modelMs < 0 || render.modelMs !== full.modelMs ||
        full.limits?.stepMs !== 50 || full.limits?.events !== 256 || full.modelMs !== full.tick * 50) {
      fail('model, version, seed, tick or model time differs from the pinned core.');
    }
    if (!sameKeySet(full, render)) fail('top-level projection keys differ.');
    const commonTopLevelKeys = Object.keys(full).filter(key => !VARIABLE_TOP_LEVEL_KEYS.has(key));
    for (const key of commonTopLevelKeys) {
      if (!equalJson(full[key], render[key])) fail('common top-level value differs: ' + key);
    }

    if (!Array.isArray(full.events) || full.events.length > 256 ||
        !Array.isArray(render.events) || render.events.length !== 0) {
      fail('Full event bound or empty Render event projection violated.');
    }
    if (!full.coverage || !render.coverage || !sameKeySet(full.coverage, render.coverage) ||
        full.coverage.history !== 'BOUNDED_RECENT_EVENTS' || full.coverage.projection !== 'full' ||
        render.coverage.history !== 'OMITTED_FROM_RENDER_PROJECTION' || render.coverage.projection !== 'render' ||
        full.coverage.retained !== full.events.length || full.coverage.retained > 256) {
      fail('Full/Render coverage contract violated.');
    }
    for (const key of Object.keys(full.coverage).filter(key => !VARIABLE_COVERAGE_KEYS.has(key))) {
      if (!equalJson(full.coverage[key], render.coverage[key])) fail('coverage differs: ' + key);
    }
    if (full.events.length && (full.events[0].sequence !== full.coverage.firstSequence ||
        full.events.at(-1).sequence !== full.coverage.lastSequence)) {
      fail('retained Full event sequence does not match coverage.');
    }

    const fullNodes = nodeMap(full, 'Full');
    const renderNodes = nodeMap(render, 'Render');
    const cellIds = [...fullNodes.keys()].sort();
    if (!equalJson(cellIds, [...renderNodes.keys()].sort()) || full.counts?.cells !== cellIds.length) {
      fail('Full/Render cell ID set or cell count differs.');
    }
    if (!fullNodes.has(selectedId)) fail('selected cell ID is absent.');
    let commonNodeKeys = null;
    for (const id of cellIds) {
      const fullNode = fullNodes.get(id);
      const renderNode = renderNodes.get(id);
      const omitted = Object.keys(fullNode).filter(key => !Object.hasOwn(renderNode, key));
      const added = Object.keys(renderNode).filter(key => !Object.hasOwn(fullNode, key));
      if (!equalJson(omitted, OMITTED_NODE_KEYS) || !equalJson(added, ADDED_NODE_KEYS)) {
        fail('cell projection must omit exactly 13 source keys and add temperature.');
      }
      const common = Object.keys(fullNode).filter(key => Object.hasOwn(renderNode, key));
      if (commonNodeKeys && !equalJson(common, commonNodeKeys)) fail('common cell key set differs between IDs.');
      commonNodeKeys = common;
      for (const key of common) {
        if (!equalJson(fullNode[key], renderNode[key])) fail('common cell value differs for ' + id + '.' + key);
      }
      if (!fullNode.memory || !equalJson(renderNode.temperature, fullNode.memory.temperature)) {
        fail('Render temperature differs from Full memory temperature for ' + id);
      }
    }

    const fullSha256 = await sha256(before.json);
    return freezeDeep({
      source: {model: full.model, version: full.version, seed: full.seed, tick: full.tick,
        modelMs: full.modelMs, fullSha256, digestKind: DIGEST_KIND},
      selectedId,
      full: {node: fullNodes.get(selectedId), events: full.events, coverage: full.coverage},
      render: {node: renderNodes.get(selectedId), events: render.events, coverage: render.coverage},
      differences: {omittedNodeKeys: [...OMITTED_NODE_KEYS], addedNodeKeys: [...ADDED_NODE_KEYS]},
      matched: {cellIds, commonTopLevelKeys, commonNodeKeys}
    });
  }

  return Object.freeze({capture});
}));
