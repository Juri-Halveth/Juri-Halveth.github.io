(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HalvethHistory = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SCHEMA = 'halveth.public-project-history.v1';
  const PROJECTS = Object.freeze({
    'halveth-scarlet': 'Juri-Halveth/halveth-scarlet',
    'halveth-forschungslabor': 'Juri-Halveth/halveth-forschungslabor',
    'halveth-field-difference-lab': 'Juri-Halveth/halveth-field-difference-lab'
  });
  const ALGORITHM = 'SHA-256-CANONICAL-JSON-V1';
  const CEILING = 'PUBLIC_REPOSITORY_COMMIT_AND_CHANGED_FILES_ONLY';
  const SHA = /^[0-9a-f]{40}$/;
  const DIGEST = /^[0-9a-f]{64}$/;
  const ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
  const UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function text(value, max) {
    return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
  }

  function utc(value) {
    return typeof value === 'string' && UTC.test(value) && Number.isFinite(Date.parse(value));
  }

  function canonical(value) {
    if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
    if (typeof value === 'number') {
      assert(Number.isFinite(value), 'Non-finite number in history manifest.');
      return JSON.stringify(value);
    }
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    assert(value && typeof value === 'object' &&
      (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null),
    'History manifest must contain plain JSON values.');
    return '{' + Object.keys(value).sort().map(key => {
      assert(value[key] !== undefined, 'Undefined value in history manifest.');
      return JSON.stringify(key) + ':' + canonical(value[key]);
    }).join(',') + '}';
  }

  function rotate(value, bits) { return (value >>> bits) | (value << (32 - bits)); }

  // Synchronous SHA-256 keeps the same check available in Node and an offline file:// browser.
  function sha256(source) {
    const input = new TextEncoder().encode(source);
    const length = Math.ceil((input.length + 9) / 64) * 64;
    const padded = new Uint8Array(length);
    padded.set(input);
    padded[input.length] = 0x80;
    const view = new DataView(padded.buffer);
    const bits = input.length * 8;
    view.setUint32(length - 8, Math.floor(bits / 0x100000000));
    view.setUint32(length - 4, bits >>> 0);
    const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const w = new Uint32Array(64);
    for (let offset = 0; offset < length; offset += 64) {
      for (let i = 0; i < 16; i += 1) w[i] = view.getUint32(offset + i * 4);
      for (let i = 16; i < 64; i += 1) {
        const a = w[i - 15], b = w[i - 2];
        const s0 = rotate(a, 7) ^ rotate(a, 18) ^ (a >>> 3);
        const s1 = rotate(b, 17) ^ rotate(b, 19) ^ (b >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, q] = h;
      for (let i = 0; i < 64; i += 1) {
        const s1 = rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (q + s1 + ch + K[i] + w[i]) >>> 0;
        const s0 = rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (s0 + maj) >>> 0;
        q = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      const result = [a, b, c, d, e, f, g, q];
      for (let i = 0; i < 8; i += 1) h[i] = (h[i] + result[i]) >>> 0;
    }
    return h.map(value => value.toString(16).padStart(8, '0')).join('');
  }

  function digest(manifest) {
    assert(manifest && typeof manifest === 'object' && !Array.isArray(manifest), 'History manifest must be an object.');
    const payload = {...manifest};
    delete payload.integrity;
    const encoded = canonical(payload);
    assert(encoded.length <= 1_000_000, 'History manifest exceeds digest limit.');
    return sha256(encoded);
  }

  function pinnedUrl(value, commit, repository, path, status) {
    if (!text(value, 600)) return false;
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.username || url.password || url.port || url.search || url.hash) return false;
      const prefix = '/' + repository + '/';
      const pathname = decodeURIComponent(url.pathname);
      return status === 'removed' ? pathname === prefix + 'commit/' + commit :
        pathname === prefix + 'blob/' + commit + '/' + path;
    } catch { return false; }
  }

  function validate(manifest) {
    assert(manifest && typeof manifest === 'object' && !Array.isArray(manifest), 'History manifest must be an object.');
    assert(manifest.schema === SCHEMA && typeof manifest.projectId === 'string' &&
      Object.hasOwn(PROJECTS, manifest.projectId) &&
      manifest.repository === PROJECTS[manifest.projectId], 'History schema, project, or repository mismatch.');
    assert(typeof manifest.observedHead === 'string' && SHA.test(manifest.observedHead), 'Invalid observed head.');
    assert(utc(manifest.retrievedAt), 'Invalid retrieval time.');
    const coverage = manifest.coverage;
    assert(coverage && coverage.selection === 'SELECTED_PUBLIC_COMMITS_NOT_COMPLETE_HISTORY' &&
      coverage.source === 'GITHUB_COMMIT_AND_FILE_DIFF' && text(coverage.notes, 1500), 'Incomplete coverage declaration.');
    assert(Array.isArray(manifest.events) && manifest.events.length >= 2 && manifest.events.length <= 4, 'Expected 2 to 4 selected events.');
    const ids = new Set(), commits = new Set();
    for (const event of manifest.events) {
      assert(event && ID.test(event.id) && !ids.has(event.id), 'Invalid or duplicate event ID.');
      ids.add(event.id);
      assert(typeof event.commit === 'string' && SHA.test(event.commit) && !commits.has(event.commit), 'Invalid or duplicate commit.');
      commits.add(event.commit);
      assert(utc(event.authorAt) && utc(event.committerAt) && utc(event.eventTime) && utc(event.recordedAt), 'Invalid event time.');
      assert(event.eventTime === event.committerAt && event.eventTimeBasis === 'COMMITTER_TIMESTAMP' &&
        event.recordedAt === manifest.retrievedAt, 'Event, commit, and recorded clocks are not explicitly bound.');
      assert(text(event.title, 180) && text(event.summary, 1200), 'Missing event description.');
      assert(event.url === `https://github.com/${manifest.repository}/commit/${event.commit}`, 'Commit URL is not pinned.');
      assert(event.claimCeiling === CEILING, 'Unsupported event claim ceiling.');
      assert(Array.isArray(event.evidence) && event.evidence.length >= 1 && event.evidence.length <= 12, 'Expected source evidence for event.');
      for (const evidence of event.evidence) {
        assert(evidence && text(evidence.path, 240) && !evidence.path.startsWith('/') &&
          !evidence.path.includes('\\') && !evidence.path.split('/').some(segment => segment === '.' || segment === '..'),
        'Invalid repository-relative evidence path.');
        assert(['added', 'modified', 'removed'].includes(evidence.status) && text(evidence.note, 500) &&
          pinnedUrl(evidence.url, event.commit, manifest.repository, evidence.path, evidence.status), 'Evidence is not pinned to its exact commit and path.');
      }
    }
    assert(Array.isArray(manifest.gaps) && manifest.gaps.length >= 1 && manifest.gaps.length <= 12, 'Observation gaps must be explicit.');
    const gapIds = new Set();
    for (const gap of manifest.gaps) {
      assert(gap && ID.test(gap.id) && !ids.has(gap.id) && !gapIds.has(gap.id), 'Invalid or duplicate gap ID.');
      gapIds.add(gap.id);
      assert(text(gap.kind, 80) && text(gap.scope, 300) && text(gap.reason, 700) &&
        text(gap.reopenTrigger, 500), 'Gap needs kind, scope, reason, and reopen trigger.');
    }
    assert(manifest.integrity && manifest.integrity.algorithm === ALGORITHM &&
      typeof manifest.integrity.digest === 'string' && DIGEST.test(manifest.integrity.digest), 'Missing canonical SHA-256 check.');
    const actual = digest(manifest);
    assert(actual === manifest.integrity.digest, 'History manifest digest mismatch.');
    return {valid: true, algorithm: ALGORITHM, digest: actual, selectedEvents: manifest.events.length, gaps: manifest.gaps.length};
  }

  function adapt(manifest) {
    const receipt = validate(manifest);
    const timeline = manifest.events.map(event => ({
      id: event.id,
      title: event.title,
      summary: event.summary,
      eventTime: event.eventTime,
      eventTimeBasis: event.eventTimeBasis,
      recordedAt: event.recordedAt,
      commit: {sha: event.commit, authorAt: event.authorAt, committerAt: event.committerAt, url: event.url},
      evidence: event.evidence.map(item => ({...item})),
      claimCeiling: event.claimCeiling
    })).sort((left, right) => Date.parse(left.eventTime) - Date.parse(right.eventTime) || left.id.localeCompare(right.id));
    return {
      projectId: manifest.projectId,
      repository: manifest.repository,
      observedHead: manifest.observedHead,
      retrievedAt: manifest.retrievedAt,
      coverage: {...manifest.coverage},
      timeline,
      gaps: manifest.gaps.map(gap => ({...gap})),
      integrity: receipt,
      timeSemantics: 'eventTime is the public commit metadata clock; recordedAt is manifest capture time. Neither is the idea origin.'
    };
  }

  return {digest, validate, adapt};
}));
