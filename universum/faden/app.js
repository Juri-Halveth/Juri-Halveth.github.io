(() => {
  'use strict';
  const canvas = document.getElementById('network');
  const stage = canvas.parentElement;
  const context = canvas.getContext('2d', { alpha: false });
  const status = document.getElementById('status');
  const sourceNote = document.getElementById('sourceNote');
  const list = document.getElementById('projectList');
  const detail = document.getElementById('detail');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let graph = null;
  let particles = new Map();
  let selectedId = null;
  let generation = 0;
  let observedAt = null;
  let width = 1;
  let height = 1;
  let components = [];
  let lastFrame = null;
  let motionSeconds = 0;
  const isRepositoryNode = node => ['PUBLIC_PROJECT', 'PUBLIC_META', 'PUBLIC_MODULE'].includes(node.kind);

  function renderStatus() {
    if (!graph) return;
    const coverage = graph.coverage;
    status.textContent = Number.isInteger(coverage.moduleCount)
      ? `${coverage.repositoryCount} Repository-Einträge · ${coverage.moduleCount} Module · ${coverage.relationCount} Quellbeziehungen${context ? '' : ' · Grafik nicht verfügbar, Projektliste bedienbar'}`
      : `${coverage.repositoryCount} Repository-Einträge · ${coverage.projectCount} Projektquellen + ${coverage.metaCount} Meta-Einstiege · ${coverage.categoryCount} Themen · ${coverage.relationCount} belegte Zuordnungen${context ? '' : ' · Grafik nicht verfügbar, Projektliste bedienbar'}`;
    sourceNote.textContent = `Index ${graph.source.indexRevision.slice(0, 12)} · Quellenstand ${graph.source.sourceDate} · hier zuletzt geprüft ${new Date(observedAt).toLocaleString('de-DE')}`;
  }

  function hash(text) {
    let value = 2166136261;
    for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
    return value >>> 0;
  }
  function resize() {
    const rect = stage.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    const pixelRatio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    if (context) {
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.font = '12px Segoe UI, sans-serif';
      layoutGroups();
    }
    placeCard();
  }
  // Use every source edge for the outer islands. Inside an island a module
  // stays with its owner. A link to the portfolio or profile connects groups
  // without turning all linked projects into members of the same family.
  function groupTopology(nodes, relations) {
    const byId = new Map(nodes.map(node => [node.id, node]));
    const neighbors = new Map(nodes.map(node => [node.id, []]));
    for (const edge of relations) {
      neighbors.get(edge.from).push(edge.to);
      neighbors.get(edge.to).push(edge.from);
    }
    const familyLinks = new Map(nodes.map(node => [node.id, []]));
    const addFamilyLink = (a, b) => { familyLinks.get(a).push(b); familyLinks.get(b).push(a); };
    for (const edge of relations) {
      if (edge.type === 'PUBLIC_ENTRY_OF_REPOSITORY' ||
          (edge.type === 'PUBLIC_README_LINK' && [edge.from, edge.to].every(id => byId.get(id).kind !== 'PUBLIC_META'))) {
        addFamilyLink(edge.from, edge.to);
      }
    }
    // The older topic index can declare several memberships per project.
    // Use its smallest declared topic as the layout anchor, keeping all edges.
    for (const node of nodes) {
      if (node.kind === 'PUBLIC_CATEGORY') continue;
      const categories = neighbors.get(node.id).filter(id => byId.get(id).kind === 'PUBLIC_CATEGORY');
      categories.sort((a, b) => neighbors.get(a).length - neighbors.get(b).length || a.localeCompare(b, 'en'));
      if (categories.length) addFamilyLink(node.id, categories[0]);
    }
    function islands(ids, links) {
      const remaining = new Set(ids.slice().sort());
      const sets = [];
      for (const first of remaining) {
        const members = [first];
        remaining.delete(first);
        for (let i = 0; i < members.length; i++) {
          for (const neighbor of links.get(members[i])) if (remaining.delete(neighbor)) members.push(neighbor);
        }
        sets.push(members);
      }
      return sets;
    }
    return islands(nodes.map(n => n.id), neighbors).map(component => {
      const families = islands(component, familyLinks).map(members => {
        members.sort((a, b) => familyLinks.get(b).length - familyLinks.get(a).length ||
          neighbors.get(b).length - neighbors.get(a).length || a.localeCompare(b, 'en'));
        return {members, weight: members.length, phase: hash(members[0]) % 628 / 100};
      });
      families.sort((a, b) => b.weight - a.weight || a.members[0].localeCompare(b.members[0], 'en'));
      return {families, weight: component.length + 2};
    }).sort((a, b) => b.weight - a.weight);
  }

  // Divide the available canvas at group boundaries. A disconnected island
  // keeps its own patch on portrait screens as well as on wide displays.
  function partition(items, box, visit, gap) {
    if (!items.length) return;
    if (items.length === 1) { visit(items[0], box); return; }
    const total = items.reduce((sum, item) => sum + item.weight, 0);
    let cut = 1, left = items[0].weight;
    while (cut < items.length - 1 && Math.abs(left + items[cut].weight - total / 2) < Math.abs(left - total / 2)) {
      left += items[cut++].weight;
    }
    const horizontal = box.w >= box.h;
    const span = horizontal ? box.w : box.h;
    const gutter = Math.min(span * .12, gap), first = (span - gutter) * left / total;
    const a = {...box}, b = {...box};
    if (horizontal) { a.w = first; b.x += first + gutter; b.w -= first + gutter; }
    else { a.h = first; b.y += first + gutter; b.h -= first + gutter; }
    partition(items.slice(0, cut), a, visit, gap);
    partition(items.slice(cut), b, visit, gap);
  }
  function placeFamily(family, box) {
    const centerX = box.x + box.w / 2, centerY = box.y + box.h / 2;
    const inwardX = width / 2 - centerX, inwardY = height / 2 - centerY;
    const offset = Math.min(1, 12 / Math.max(1, Math.hypot(inwardX, inwardY)));
    family.startX = inwardX * offset;
    family.startY = inwardY * offset;
    const satellites = family.members.length - 1;
    const spreadX = Math.min(box.w * .32, 50 + satellites * 5);
    const spreadY = Math.min(box.h * .32, 44 + satellites * 4);
    family.members.forEach((id, i) => {
      const point = particles.get(id);
      const angle = satellites > 1 ? Math.PI * 2 * (i - 1) / satellites - Math.PI * .75 : 0;
      let dx = 0, dy = 0;
      if (satellites === 1) {
        // Orient pairs along the longer side of their own region.
        if (box.w > box.h) dx = (i ? 1 : -1) * spreadX * .6;
        else dy = (i ? 1 : -1) * spreadY * .6;
      } else if (i) { dx = Math.cos(angle) * spreadX; dy = Math.sin(angle) * spreadY; }
      point.homeX = centerX + dx;
      point.homeY = centerY + dy;
      point.family = family;
      position(point);
    });
  }
  function layoutGroups() {
    const side = Math.min(58, width * .09), top = Math.min(76, height * .16);
    const box = {x:side, y:top, w:width - 2 * side, h:height - top - Math.min(35, height * .12)};
    partition(components, box, (component, area) => {
      partition(component.families, area, placeFamily, 7);
    }, Math.min(50, width * .06));
  }
  function position(point) {
    const t = motionSeconds, phase = point.phase, family = point.family.phase;
    // The groups start nearly in place and unfurl another twelve pixels.
    // Elapsed display time drives this short opening and both drift scales.
    const opening = Math.exp(-t / 18);
    point.x = point.homeX + point.family.startX * opening + 7 * Math.sin(.10 * t + family) + 3 * Math.sin(.16 * t + phase);
    point.y = point.homeY + point.family.startY * opening + 6 * Math.sin(.095 * t + family * 2) + 3 * Math.sin(.18 * t + phase * 2);
    point.x = Math.max(6, Math.min(width - 6, point.x));
    point.y = Math.max(6, Math.min(height - 6, point.y));
  }
  function adopt(next) {
    const previous = particles;
    const fresh = new Map();
    for (const node of next.nodes) {
      const point = previous.get(node.id) || {id:node.id, phase:hash(node.id) % 628 / 100};
      point.kind = node.kind;
      point.label = node.label;
      fresh.set(node.id, point);
    }
    graph = next;
    particles = fresh;
    components = groupTopology(next.nodes, next.relations);
    if (context) layoutGroups();
    generation += 1;
    renderList();
    if (selectedId && !fresh.has(selectedId)) closeCard();
    else if (selectedId) void select(selectedId);
    renderStatus();
  }
  function renderList() {
    const focusedId = list.contains(document.activeElement) ? document.activeElement.dataset.nodeId : null;
    list.replaceChildren();
    for (const node of graph.nodes.filter(isRepositoryNode)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = node.kind === 'PUBLIC_MODULE' ? `Modul · ${node.label}` : node.label;
      button.dataset.nodeId = node.id;
      button.setAttribute('aria-pressed', String(node.id === selectedId));
      button.addEventListener('click', () => select(node.id, true));
      list.append(button);
    }
    if (focusedId) focusProject(focusedId);
  }
  function focusProject(id) {
    const buttons = [...list.querySelectorAll('button')];
    const target = buttons.find(button => button.dataset.nodeId === id) || buttons[0] || document.getElementById('directoryTitle');
    target.focus({ preventScroll: true });
  }
  function clearLinks() {
    for (const name of ['detailOpen', 'detailSource']) {
      const anchor = document.getElementById(name);
      anchor.hidden = true;
      anchor.removeAttribute('href');
    }
  }
  function placeCard() {
    if (!context || detail.hidden || !selectedId) return;
    const point = particles.get(selectedId);
    if (!point) return;
    const cardWidth = Math.min(detail.offsetWidth || 380, width - 32);
    const cardHeight = Math.min(detail.offsetHeight || 320, height - 32);
    const left = Math.max(16, Math.min(width - cardWidth - 16, point.x + 18));
    const top = Math.max(16, Math.min(height - cardHeight - 16, point.y - 60));
    detail.style.left = `${left}px`;
    detail.style.top = `${top}px`;
  }
  function safeLink(value) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password ||
          !['github.com', 'juri-halveth.github.io', 'halveth.de', 'www.halveth.de'].includes(url.hostname)) return null;
      return url.href;
    } catch { return null; }
  }
  async function projectContext(node) {
    if (node.context) return node.context;
    const response = await fetch(`../${node.contextPath}`, { cache: 'no-store' });
    if (!response.ok) throw Error(`Kontext HTTP ${response.status}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length !== node.contextBytes || bytes.length > 8192 ||
        !/^[0-9a-f]{64}$/.test(node.contextSha256)) throw Error('Kontext außerhalb des Indexvertrags');
    const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
      .map(byte => byte.toString(16).padStart(2, '0')).join('');
    if (digest !== node.contextSha256) throw Error('Kontext stimmt nicht mit dem Index überein');
    const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (value.schema !== 'halveth.project-context.v1' || `project:${value.id}` !== node.id) throw Error('Projektidentität stimmt nicht');
    return value;
  }
  function renderRelations(id) {
    const container = document.getElementById('detailRelations');
    if (!container) return;
    container.replaceChildren();
    const edges = graph.relations.filter(edge => edge.from === id || edge.to === id);
    for (const edge of edges) {
      const other = graph.nodes.find(node => node.id === (edge.from === id ? edge.to : edge.from));
      const item = document.createElement('li');
      const label = document.createElement('span');
      const direction = edge.type === 'PUBLIC_README_LINK' ? (edge.from === id ? 'README-Verweis auf' : 'README-Verweis von')
        : edge.type === 'PUBLIC_ENTRY_OF_REPOSITORY' && edge.to === id ? 'Moduleinstieg aus Repository'
        : edge.label || 'Themenzuordnung';
      label.textContent = `${direction} · ${other?.label || 'Quelle'}`;
      item.append(label);
      for (const [index, source] of (edge.sources || []).entries()) {
        const href = safeLink(source.url);
        if (!href) continue;
        const link = document.createElement('a');
        link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer';
        link.textContent = `Quelle ${index + 1} ↗`;
        item.append(' ', link);
      }
      container.append(item);
    }
    if (!edges.length) {
      const item = document.createElement('li'); item.textContent = 'Keine zusätzlichen Quellbeziehungen im beobachteten Index.';
      container.append(item);
    }
  }
  async function select(id, fromDirectory = false) {
    const node = graph?.nodes.find(item => item.id === id && isRepositoryNode(item));
    if (!node) return;
    selectedId = id;
    renderList();
    detail.hidden = false;
    if (fromDirectory) stage.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'center' });
    document.getElementById('detailState').textContent = 'ÖFFENTLICHER PROJEKTKONTEXT LADEN …';
    document.getElementById('detailTitle').textContent = node.label;
    for (const name of ['detailCore', 'detailValue', 'detailBoundary']) document.getElementById(name).textContent = '';
    document.getElementById('detailRelations')?.replaceChildren();
    clearLinks();
    placeCard();
    if (fromDirectory) document.getElementById('close').focus({ preventScroll: true });
    const requestGeneration = ++generation;
    try {
      const value = await projectContext(node);
      if (selectedId !== id || generation !== requestGeneration) return;
      document.getElementById('detailState').textContent = value.state;
      document.getElementById('detailCore').textContent = value.capability.core;
      document.getElementById('detailValue').textContent = value.capability.value;
      document.getElementById('detailBoundary').textContent = value.capability.boundary;
      document.getElementById('detailOpen').textContent = value.publicEntry.label || 'Projekt öffnen ↗';
      for (const [name, link] of [['detailOpen', value.publicEntry.url], ['detailSource', value.source.url]]) {
        const anchor = document.getElementById(name);
        const href = safeLink(link);
        anchor.hidden = !href;
        if (href) anchor.href = href;
      }
      renderRelations(id);
      placeCard();
    } catch (error) {
      if (selectedId === id && generation === requestGeneration) document.getElementById('detailState').textContent = `QUELLE NICHT VERIFIZIERT · ${error.message}`;
    }
  }
  function closeCard() {
    const returnId = selectedId;
    const returnFocus = detail.contains(document.activeElement);
    generation += 1;
    selectedId = null;
    detail.hidden = true;
    clearLinks();
    if (graph) renderList();
    if (returnFocus) focusProject(returnId);
  }
  function draw(now) {
    if (!context) return;
    const elapsed = lastFrame === null ? 0 : Math.max(0, Math.min(0.1, (now - lastFrame) / 1000));
    lastFrame = now;
    if (!reduced.matches && !document.hidden) {
      motionSeconds += elapsed;
      for (const point of particles.values()) position(point);
    }
    context.fillStyle = '#04111d'; context.fillRect(0, 0, width, height);
    if (graph) {
      for (const relation of graph.relations) {
        const a = particles.get(relation.from), b = particles.get(relation.to);
        if (!a || !b) continue;
        const gradient = context.createLinearGradient(a.x, a.y, b.x, b.y);
        gradient.addColorStop(0, '#1d708d'); gradient.addColorStop(.5, '#3ab7db'); gradient.addColorStop(1, '#69e8f0');
        const seed = hash(relation.id), phase = (seed % 1000) / 1000;
        const dx = b.x - a.x, dy = b.y - a.y, distance = Math.max(1, Math.hypot(dx, dy));
        const bend = Math.min(12, distance * 0.045) * Math.sin(phase * 2 * Math.PI + motionSeconds * 0.045);
        const cx = (a.x + b.x) / 2 - dy * bend / distance, cy = (a.y + b.y) / 2 + dx * bend / distance;
        context.beginPath(); context.moveTo(a.x, a.y); context.quadraticCurveTo(cx, cy, b.x, b.y);
        const highlighted = selectedId && (selectedId === a.id || selectedId === b.id);
        context.globalAlpha = highlighted ? 1 : selectedId ? .22 : a.family === b.family ? .90 : .48;
        context.strokeStyle = gradient; context.lineWidth = highlighted ? 2.3 : 1.1; context.stroke();
        context.globalAlpha = 1;
        if (!reduced.matches) {
          const t = (phase + motionSeconds / (95 + seed % 40)) % 1, u = 1 - t;
          context.beginPath(); context.arc(u*u*a.x + 2*u*t*cx + t*t*b.x, u*u*a.y + 2*u*t*cy + t*t*b.y, 1.7, 0, Math.PI * 2);
          context.globalAlpha = Math.min(1, t * 15, u * 15);
          context.fillStyle = '#e5b778'; context.fill(); context.globalAlpha = 1;
        }
      }
      context.textAlign = 'center'; context.textBaseline = 'top'; context.font = '12px Segoe UI, sans-serif';
      const labels = [];
      const points = [...particles.values()];
      for (const point of points) {
        const category = point.kind === 'PUBLIC_CATEGORY';
        const chosen = point.id === selectedId;
        const radius = category ? 8 : chosen ? 9 : 5;
        context.beginPath(); context.arc(point.x, point.y, radius + (category ? 6 : 3), 0, Math.PI * 2);
        context.fillStyle = category ? '#1592ba33' : '#7ceef022'; context.fill();
        context.beginPath(); context.arc(point.x, point.y, radius, 0, Math.PI * 2);
        context.fillStyle = category ? '#e5bc7d' : chosen ? '#ffffff' : '#9af2f3'; context.fill();
        const label = category ? point.label.toUpperCase() : point.label;
        const labelWidth = Math.min(context.measureText(label).width, Math.max(1, width - 18));
        const below = point.y + radius + 7, above = point.y - radius - 20;
        const shift = Math.min(40, labelWidth * .3);
        const choices = [
          [point.x, below], [point.x, above],
          [point.x + radius + 9 + labelWidth / 2, point.y - 7],
          [point.x - radius - 9 - labelWidth / 2, point.y - 7],
          [point.x + shift, below], [point.x - shift, below],
          [point.x + shift, above], [point.x - shift, above],
          [point.x, below + 14], [point.x, above - 14]
        ];
        let best = null;
        for (const [index, [cx, cy]] of choices.entries()) {
          const edge = labelWidth / 2 + 8;
          const x = Math.max(edge, Math.min(width - edge, cx));
          const y = Math.max(7, Math.min(height - 21, cy));
          const rect = { left: x - labelWidth / 2 - 3, right: x + labelWidth / 2 + 3,
            top: y - 2, bottom: y + 16 };
          let score = index * 3 + (point.labelSide !== undefined && point.labelSide !== index ? 32 : 0);
          for (const other of points) {
            const dx = Math.max(0, rect.left - other.x, other.x - rect.right);
            const dy = Math.max(0, rect.top - other.y, other.y - rect.bottom);
            const clearance = other.kind === 'PUBLIC_CATEGORY' || other.id === selectedId ? 10 : 7;
            if (dx * dx + dy * dy < clearance * clearance) score += 3000;
          }
          for (const prior of labels) {
            const overlapX = Math.max(0, Math.min(rect.right, prior.right) - Math.max(rect.left, prior.left));
            const overlapY = Math.max(0, Math.min(rect.bottom, prior.bottom) - Math.max(rect.top, prior.top));
            score += 4 * overlapX * overlapY;
          }
          if (!best || score < best.score) best = { x, y, rect, score, index };
          if (score === 0) break;
        }
        point.labelSide = best.index;
        labels.push(best.rect);
        context.fillStyle = '#04111dde';
        context.fillRect(best.rect.left, best.rect.top, best.rect.right - best.rect.left, best.rect.bottom - best.rect.top);
        context.fillStyle = category ? '#e4bf87' : '#c9f6fb';
        context.fillText(label, best.x, best.y, labelWidth);
      }
      if (selectedId) placeCard();
    }
    requestAnimationFrame(draw);
  }
  async function refresh() {
    try {
      const useNetwork = typeof window.HALVETH_RELATION_MODEL.fromNetwork === 'function';
      const response = await fetch(useNetwork ? '../api/network.json' : '../api/space.json', { cache: 'no-store' });
      if (!response.ok) throw Error(`Index HTTP ${response.status}`);
      const payload = await response.json();
      const next = useNetwork ? window.HALVETH_RELATION_MODEL.fromNetwork(payload) : window.HALVETH_RELATION_MODEL.fromSpace(payload);
      observedAt = new Date().toISOString();
      if (!graph || graph.source.indexRevision !== next.source.indexRevision) {
        adopt(next);
      } else renderStatus(); // A recovered fetch clears an earlier error even at the same revision.
    } catch (error) {
      status.textContent = graph ? `Indexabruf gestört · letzter beobachteter Stand bleibt sichtbar` : `Öffentlicher Index nicht verfügbar: ${error.message}`;
    } finally {
      setTimeout(refresh, 30000);
    }
  }
  canvas.addEventListener('click', event => {
    if (!graph) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    let nearest = null, distance = 24;
    for (const point of particles.values()) {
      if (!isRepositoryNode(point)) continue;
      const candidate = Math.hypot(point.x - x, point.y - y);
      if (candidate < distance) { nearest = point.id; distance = candidate; }
    }
    if (nearest) select(nearest);
  });
  document.getElementById('close').addEventListener('click', closeCard);
  document.addEventListener('visibilitychange', () => { lastFrame = null; });
  addEventListener('resize', resize);
  resize();
  requestAnimationFrame(draw);
  refresh();
})();
