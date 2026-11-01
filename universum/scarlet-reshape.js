/* Explicit local mutation of one caller-owned, pinned GStarLiving core. */
(function (root, factory) {
  'use strict';
  const isNode = typeof module === 'object' && Boolean(module.exports);
  const api = factory(root, isNode);
  if (isNode) module.exports = api;
  else root.HALVETH_SCARLET_RESHAPE = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root, isNode) {
  'use strict';

  const SOURCE_COMMIT = '6913b81d3e2414b20149406cb3e2fe9bb314adf4';
  const DIGEST_KIND = 'ADAPTER_DERIVED_FULL_SNAPSHOT_SHA256';
  const CLAIM_CEILING = 'LOCAL_SYNTHETIC_WORLD_RESHAPE_WITNESS_ONLY';

  function fail(message) { throw new TypeError('SCARLET reshape witness: ' + message); }
  function freezeDeep(value) {
    if (value && typeof value === 'object') {
      for (const child of Object.values(value)) freezeDeep(child);
      Object.freeze(value);
    }
    return value;
  }
  function fullSnapshot(core) {
    let json;
    try { json = JSON.stringify(core.snapshot('full')); }
    catch { fail('Full snapshot must be plain JSON.'); }
    if (typeof json !== 'string') fail('Full snapshot must be a JSON object.');
    const snapshot = JSON.parse(json);
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) fail('Full snapshot must be a JSON object.');
    return {json, snapshot};
  }
  function idMap(snapshot) {
    if (!Array.isArray(snapshot.nodes) || !snapshot.nodes.length) fail('nonempty cell set required.');
    const map = new Map();
    for (const node of snapshot.nodes) {
      if (!node || typeof node.id !== 'string' || !node.id || map.has(node.id)) fail('invalid or duplicate cell ID.');
      map.set(node.id, node);
    }
    return map;
  }
  function checkSnapshot(snapshot) {
    if (snapshot.model !== 'LOCAL_MOVING_CELL_ECOLOGY' || snapshot.version !== '3.0.0' ||
        !Number.isSafeInteger(snapshot.seed) || snapshot.seed < 1 || snapshot.seed > 0xffffffff ||
        !Number.isSafeInteger(snapshot.tick) || snapshot.tick < 0 ||
        snapshot.limits?.stepMs !== 50 || snapshot.limits?.events !== 256 ||
        snapshot.modelMs !== snapshot.tick * 50 ||
        !snapshot.world || snapshot.world.units !== 'MODEL_UNITS' ||
        snapshot.world.boundary !== 'REFLECTING_MEMBRANE' ||
        !Number.isFinite(snapshot.world.width) || snapshot.world.width <= 0 ||
        !Number.isFinite(snapshot.world.height) || snapshot.world.height <= 0 ||
        !Number.isFinite(snapshot.world.area) || snapshot.world.area <= 0 ||
        !Array.isArray(snapshot.waves) || !Array.isArray(snapshot.events) || snapshot.events.length > 256 ||
        !snapshot.coverage || snapshot.coverage.history !== 'BOUNDED_RECENT_EVENTS' ||
        snapshot.coverage.projection !== 'full' || snapshot.coverage.retained !== snapshot.events.length) {
      fail('pinned Full snapshot model, clock, world or coverage invalid.');
    }
    const nodes = idMap(snapshot);
    if (snapshot.counts?.cells !== nodes.size) fail('cell count differs from cell IDs.');
    return nodes;
  }
  function rootBounds(snapshot) {
    const roots = snapshot.nodes.filter(node => node.depth === 0);
    const checks = roots.map(node => {
      const marginX = snapshot.world.width / 2 - node.body.radius - Math.abs(node.position.x);
      const marginY = snapshot.world.height / 2 - node.body.radius - Math.abs(node.position.y);
      return {id: node.id, marginX, marginY, within: marginX >= -1e-9 && marginY >= -1e-9};
    });
    return {policy: snapshot.world.boundary, rootCount: roots.length,
      allRootsWithin: checks.every(item => item.within), roots: checks};
  }
  function digestTools() {
    const subtle = root.crypto?.subtle || (isNode ? require('node:crypto').webcrypto.subtle : null);
    const Encoder = root.TextEncoder;
    if (!subtle || typeof subtle.digest !== 'function' || typeof Encoder !== 'function') {
      throw new Error('Local WebCrypto SHA-256 unavailable.');
    }
    return {subtle, Encoder};
  }
  async function hashes(beforeJson, afterJson, tools) {
    const {subtle, Encoder} = tools;
    const encode = text => new Encoder().encode(text);
    const [beforeHash, afterHash] = await Promise.all([
      subtle.digest('SHA-256', encode(beforeJson)), subtle.digest('SHA-256', encode(afterJson))
    ]);
    const hex = buffer => Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
    return {beforeSha256: hex(beforeHash), afterSha256: hex(afterHash)};
  }

  /** Intentionally calls core.reshape(aspect) once; all state checks precede hashing. */
  async function witnessReshape(core, aspect, selectedId) {
    if (!core || typeof core.snapshot !== 'function' || typeof core.reshape !== 'function') {
      throw new TypeError('Caller-owned GStarLiving core with snapshot() and reshape() required.');
    }
    if (!Number.isFinite(aspect) || aspect < .25 || aspect > 4) throw new RangeError('Aspect must be finite within 0.25..4.');
    if (typeof selectedId !== 'string' || !selectedId) throw new TypeError('Stable selected cell ID required.');

    // This sequence is synchronous up to the first await. The caller's own core
    // is the only mutated object; snapshots are detached before the reshape.
    const beforeRecord = fullSnapshot(core);
    const before = beforeRecord.snapshot;
    const beforeNodes = checkSnapshot(before);
    if (!beforeNodes.has(selectedId)) fail('selected cell ID is absent before reshape.');
    // Fail capability checks before the explicit local mutation.
    const digest = digestTools();
    core.reshape(aspect);
    const afterRecord = fullSnapshot(core);
    const after = afterRecord.snapshot;
    const afterNodes = checkSnapshot(after);
    const ids = [...beforeNodes.keys()].sort();
    const afterIds = [...afterNodes.keys()].sort();
    if (before.version !== after.version || before.model !== after.model ||
        before.seed !== after.seed || before.tick !== after.tick || before.modelMs !== after.modelMs ||
        ids.length !== afterIds.length || ids.some((id, index) => id !== afterIds[index])) {
      fail('version, seed, tick, model time or cell ID set changed.');
    }
    const changed = beforeRecord.json !== afterRecord.json;
    const beforeAspect = before.world.width / before.world.height;
    const afterAspect = after.world.width / after.world.height;
    const positionChangedIds = ids.filter(id => {
      const oldPosition = beforeNodes.get(id).position;
      const newPosition = afterNodes.get(id).position;
      return oldPosition.x !== newPosition.x || oldPosition.y !== newPosition.y;
    });
    const boundsBefore = rootBounds(before);
    const boundsAfter = rootBounds(after);
    let reshapeEvent = null;
    if (changed) {
      reshapeEvent = after.events.at(-1);
      if (before.world.width === after.world.width || before.world.height === after.world.height ||
          Math.abs(afterAspect - aspect) > 1e-12 || before.world.area !== after.world.area ||
          !positionChangedIds.length || !boundsAfter.allRootsWithin || after.waves.length !== 0 ||
          !reshapeEvent || reshapeEvent.type !== 'WORLD_RESHAPE' || reshapeEvent.subject !== 'world' ||
          reshapeEvent.tick !== before.tick || reshapeEvent.modelMs !== before.modelMs ||
          reshapeEvent.aspect !== aspect || reshapeEvent.width !== after.world.width ||
          reshapeEvent.height !== after.world.height || reshapeEvent.area !== after.world.area ||
          reshapeEvent.endedWavefronts !== true ||
          reshapeEvent.sequence !== before.coverage.lastSequence + 1 ||
          after.coverage.lastSequence !== reshapeEvent.sequence) {
        fail('changed geometry lacks the bound WORLD_RESHAPE, bounds or wave-reset witness.');
      }
    } else if (Math.abs(Math.sqrt(before.world.area * aspect) - before.world.width) >= 1e-10 ||
        positionChangedIds.length || beforeAspect !== afterAspect ||
        before.coverage.lastSequence !== after.coverage.lastSequence) {
      fail('no-op reshape disagrees with requested geometry or changed event history.');
    }

    const digests = await hashes(beforeRecord.json, afterRecord.json, digest);
    return freezeDeep({
      kind: 'SCARLET_LOCAL_WORLD_RESHAPE_WITNESS',
      status: changed ? 'RESHAPED' : 'NO_CHANGE',
      source: {commit: SOURCE_COMMIT, model: before.model, version: before.version,
        seed: before.seed, tick: before.tick, modelMs: before.modelMs,
        digestKind: DIGEST_KIND, ...digests},
      request: {aspect, selectedId},
      before: {snapshot: before, aspect: beforeAspect, selectedNode: beforeNodes.get(selectedId), bounds: boundsBefore},
      after: {snapshot: after, aspect: afterAspect, selectedNode: afterNodes.get(selectedId), bounds: boundsAfter},
      checks: {
        sameClockAndIdentity: true,
        sameCellIds: true,
        ids,
        areaPreserved: before.world.area === after.world.area,
        positionChangedIds,
        wavesBefore: before.waves.length,
        wavesAfter: after.waves.length,
        waveRemovalObserved: changed && before.waves.length > 0 && after.waves.length === 0,
        reshapeEvent
      },
      claimCeiling: CLAIM_CEILING,
      claim: 'Bewusst ausgelöste Umformung eines lokalen synthetischen SCARLET-Kerns. Snapshot-Digests sind vom Adapter abgeleitet; weder Quell-Root noch Außenwelt- oder Projektwirkung.'
    });
  }

  return Object.freeze({witnessReshape, CLAIM_CEILING});
}));
