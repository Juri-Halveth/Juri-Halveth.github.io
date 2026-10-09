/* SPDX-License-Identifier: HALVETH-PIRL-2.0 */
'use strict';

(function attachUniverseCore(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HalvethUniverseCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createUniverseCore() {
  const palette = Object.freeze({
    repository: '#fff1c2', directory: '#edbf76', file: '#62e8ed', commit: '#9b81ff',
    workflow: '#ff8eaa', action: '#ffb65c', data: '#65cfff', document: '#b7c9ec',
    interface: '#71ded2', code: '#6ee2ed', media: '#fd82d5', other: '#a7b6cc',
    'content-cluster': '#ffe28c', symlink: '#ffa071'
  });

  function hash32(value) {
    let hash = 2166136261;
    for (const char of String(value)) {
      hash ^= char.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function randoms(seed) {
    let state = hash32(seed) || 1;
    return () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function sphere(seed, radius) {
    const rand = randoms(seed), z = rand() * 2 - 1, angle = rand() * Math.PI * 2;
    const spread = Math.sqrt(Math.max(0, 1 - z * z));
    return { x: Math.cos(angle) * spread * radius, y: Math.sin(angle) * spread * radius, z: z * radius, w: rand() * 2 - 1 };
  }

  function createModel(data) {
    if (!data || data.schema !== 'halveth.source-universe.v1' || !Array.isArray(data.nodes) || !Array.isArray(data.relations)) {
      throw new TypeError('Unsupported source-universe snapshot.');
    }
    const byId = new Map(data.nodes.map(node => [node.id, node]));
    const commits = data.nodes.filter(node => node.kind === 'commit').sort((a, b) => b.epoch - a.epoch || a.id.localeCompare(b.id, 'en'));
    const epochs = commits.map(node => node.epoch).filter(Number.isFinite);
    const newestEpoch = epochs.length ? Math.max(...epochs) : 0;
    const oldestEpoch = epochs.length ? Math.min(...epochs) : newestEpoch;
    const pointCache = new Map();
    const resolving = new Set();
    const commitProgress = epoch => newestEpoch === oldestEpoch ? 0.5 : (newestEpoch - epoch) / (newestEpoch - oldestEpoch);

    function position(id) {
      if (pointCache.has(id)) return pointCache.get(id);
      const node = byId.get(id);
      if (!node) return { x: 0, y: 0, z: 0, w: 0 };
      if (resolving.has(id)) return sphere(id, 80);
      resolving.add(id);
      let point;
      if (node.kind === 'repository') point = { x: 0, y: 0, z: 0, w: 0 };
      else if (node.kind === 'commit') {
        const progress = commitProgress(node.epoch), rand = randoms(node.sha);
        const angle = progress * Math.PI * 12 + (rand() - 0.5) * 0.55;
        const radius = 125 + progress * 560;
        point = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * 0.72, z: (rand() - 0.5) * 220, w: 1 - progress * 2 };
      } else if (node.kind === 'directory') {
        if (node.path === '.') point = { x: 0, y: 0, z: 0, w: 0 };
        else {
          const parentPath = node.path.includes('/') ? node.path.slice(0, node.path.lastIndexOf('/')) : '.';
          const parent = position(`dir:${parentPath}`), offset = sphere(node.path, 220);
          const depth = node.path.split('/').length;
          point = { x: parent.x + offset.x / Math.sqrt(depth), y: parent.y + offset.y / Math.sqrt(depth), z: parent.z + offset.z / Math.sqrt(depth), w: offset.w * 0.56 };
        }
      } else if (node.kind === 'file') {
        const parent = position(`dir:${node.path.includes('/') ? node.path.slice(0, node.path.lastIndexOf('/')) : '.'}`);
        const offset = sphere(node.path, Math.min(230, 54 + Math.sqrt(node.degree || 1) * 11));
        point = { x: parent.x + offset.x, y: parent.y + offset.y, z: parent.z + offset.z, w: node.lastChangedEpoch ? 1 - commitProgress(node.lastChangedEpoch) * 2 : 0 };
      } else if (node.kind === 'content-cluster') {
        const members = data.relations.filter(edge => edge.type === 'SAME_SHA256' && edge.target.id === id).map(edge => position(edge.source.id));
        point = members.length ? members.reduce((sum, value) => ({ x: sum.x + value.x / members.length, y: sum.y + value.y / members.length, z: sum.z + value.z / members.length, w: sum.w + value.w / members.length }), { x: 0, y: 0, z: 0, w: 0 }) : sphere(id, 500);
      } else {
        const attachment = data.relations.find(edge => edge.target.id === id && edge.type === 'USES_ACTION');
        const base = attachment ? position(attachment.source.id) : { x: 0, y: 0, z: 0, w: 0 };
        const offset = sphere(id, 190);
        point = { x: base.x + offset.x, y: base.y + offset.y, z: base.z + offset.z, w: offset.w * 0.7 };
      }
      resolving.delete(id);
      pointCache.set(id, point);
      return point;
    }

    for (const node of data.nodes) position(node.id);
    const layoutNodes = data.nodes.map(node => ({ ...node, position: pointCache.get(node.id) }));
    const layoutById = new Map(layoutNodes.map(node => [node.id, node]));
    const relations = data.relations.filter(edge => layoutById.has(edge.source.id) && layoutById.has(edge.target.id));
    return { data, nodes: layoutNodes, byId: layoutById, relations, commits, oldestEpoch, newestEpoch };
  }

  function project(point, view, width, height, seconds = 0) {
    const t = seconds * 0.000045 + view.timePosition * Math.PI * 0.78;
    let { x, y, z, w } = point;
    const c1 = Math.cos(t), s1 = Math.sin(t);
    [x, w] = [x * c1 - w * 220 * s1, x * s1 / 220 + w * c1];
    const c2 = Math.cos(t * 0.63), s2 = Math.sin(t * 0.63);
    [y, w] = [y * c2 - w * 155 * s2, y * s2 / 155 + w * c2];
    const scale4 = 3.15 / Math.max(1.2, 3.7 - w);
    x *= scale4; y *= scale4; z *= scale4;
    const cy = Math.cos(view.yaw), sy = Math.sin(view.yaw);
    [x, z] = [x * cy - z * sy, x * sy + z * cy];
    const cp = Math.cos(view.pitch), sp = Math.sin(view.pitch);
    [y, z] = [y * cp - z * sp, y * sp + z * cp];
    const perspective = 910 / (1150 + z);
    const focal = Math.min(width, height) * 0.82 * view.zoom;
    return { x: width / 2 + x * perspective * focal / 550, y: height / 2 + y * perspective * focal / 550, scale: perspective, z, w };
  }

  function visibleAtTime(node, epoch) {
    return node.kind !== 'commit' || !epoch || node.epoch <= epoch;
  }

  function relationVisibleAtTime(edge, epoch) {
    return edge.type !== 'COMMIT_TOUCHES_FILE' || !epoch || (edge.timeBasis?.epoch || 0) <= epoch;
  }

  return { palette, createModel, project, visibleAtTime, relationVisibleAtTime };
});
