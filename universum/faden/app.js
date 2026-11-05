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
    if (context) context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    placeCard();
  }
  function particle(node) {
    const seed = hash(node.id);
    const angle = (seed % 3600) / 3600 * Math.PI * 2;
    const radius = node.kind === 'PUBLIC_CATEGORY' ? 0.24 : 0.36 + ((seed >>> 9) % 100) / 900;
    return { id: node.id, kind: node.kind, label: node.label,
      x: width / 2 + Math.cos(angle) * Math.min(width, height) * radius,
      y: height / 2 + Math.sin(angle) * Math.min(width, height) * radius,
      vx: 0, vy: 0 };
  }
  function adopt(next) {
    const previous = particles;
    const fresh = new Map();
    for (const node of next.nodes) fresh.set(node.id, previous.get(node.id) || particle(node));
    graph = next;
    particles = fresh;
    if (context) {
      context.font = '12px Segoe UI, sans-serif';
      for (let step = 0; step < 110; step += 1) evolve();
    }
    generation += 1;
    renderList();
    if (selectedId && !fresh.has(selectedId)) closeCard();
    status.textContent = `${next.coverage.projectCount} Projekte · ${next.coverage.categoryCount} Themen · ${next.coverage.relationCount} belegte Zuordnungen${context ? '' : ' · Grafik nicht verfügbar, Projektliste bedienbar'}`;
    sourceNote.textContent = `Index ${next.source.indexRevision.slice(0, 12)} · Quellenstand ${next.source.sourceDate} · hier gesehen ${new Date(observedAt).toLocaleString('de-DE')}`;
  }
  function renderList() {
    list.replaceChildren();
    for (const node of graph.nodes.filter(item => item.kind === 'PUBLIC_PROJECT')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = node.label;
      button.dataset.nodeId = node.id;
      button.setAttribute('aria-pressed', String(node.id === selectedId));
      button.addEventListener('click', () => select(node.id, true));
      list.append(button);
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
    const response = await fetch(`../${node.contextPath}`, { cache: 'no-store' });
    if (!response.ok) throw Error(`Kontext HTTP ${response.status}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const expected = graph.nodes.find(item => item.id === node.id);
    if (!expected || bytes.length !== expected.contextBytes || bytes.length > 8192 ||
        !/^[0-9a-f]{64}$/.test(expected.contextSha256)) throw Error('Kontext außerhalb des Indexvertrags');
    const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
      .map(byte => byte.toString(16).padStart(2, '0')).join('');
    if (digest !== expected.contextSha256) throw Error('Kontext stimmt nicht mit dem Index überein');
    const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (value.schema !== 'halveth.project-context.v1' || `project:${value.id}` !== node.id) throw Error('Projektidentität stimmt nicht');
    return value;
  }
  async function select(id, fromDirectory = false) {
    const node = graph?.nodes.find(item => item.id === id && item.kind === 'PUBLIC_PROJECT');
    if (!node) return;
    selectedId = id;
    renderList();
    detail.hidden = false;
    if (fromDirectory) stage.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'center' });
    document.getElementById('detailState').textContent = 'ÖFFENTLICHER PROJEKTKONTEXT LADEN …';
    document.getElementById('detailTitle').textContent = node.label;
    for (const name of ['detailCore', 'detailValue', 'detailBoundary']) document.getElementById(name).textContent = '';
    for (const name of ['detailOpen', 'detailSource']) document.getElementById(name).hidden = true;
    placeCard();
    const requestGeneration = generation;
    try {
      const value = await projectContext(node);
      if (selectedId !== id || generation !== requestGeneration) return;
      document.getElementById('detailState').textContent = value.state;
      document.getElementById('detailCore').textContent = value.capability.core;
      document.getElementById('detailValue').textContent = value.capability.value;
      document.getElementById('detailBoundary').textContent = value.capability.boundary;
      for (const [name, link] of [['detailOpen', value.publicEntry.url], ['detailSource', value.source.url]]) {
        const anchor = document.getElementById(name);
        const href = safeLink(link);
        anchor.hidden = !href;
        if (href) anchor.href = href;
      }
      placeCard();
    } catch (error) {
      if (selectedId === id) document.getElementById('detailState').textContent = `QUELLE NICHT VERIFIZIERT · ${error.message}`;
    }
  }
  function closeCard() {
    selectedId = null;
    detail.hidden = true;
    if (graph) renderList();
  }
  function evolve() {
    if (!graph) return;
    const points = [...particles.values()];
    for (const relation of graph.relations) {
      const from = particles.get(relation.from), to = particles.get(relation.to);
      if (!from || !to) continue;
      const dx = to.x - from.x, dy = to.y - from.y;
      const length = Math.max(1, Math.hypot(dx, dy));
      const pull = (length - 132) * 0.00022;
      from.vx += dx * pull; from.vy += dy * pull;
      to.vx -= dx * pull; to.vy -= dy * pull;
    }
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const a = points[i], b = points[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const square = dx * dx + dy * dy + 250;
        const push = Math.min(2.2, 1900 / square);
        a.vx += dx * push / Math.sqrt(square); a.vy += dy * push / Math.sqrt(square);
        b.vx -= dx * push / Math.sqrt(square); b.vy -= dy * push / Math.sqrt(square);
        // Labels remain attached to their nodes. Repel overlapping label boxes,
        // including nodes from separate graph components that merely look near.
        const labelWidthA = Math.min(190, Math.max(55, context.measureText(a.label).width));
        const labelWidthB = Math.min(190, Math.max(55, context.measureText(b.label).width));
        const overlapX = (labelWidthA + labelWidthB) / 2 + 14 - Math.abs(dx);
        const overlapY = 29 - Math.abs(dy);
        if (overlapX > 0 && overlapY > 0) {
          const direction = dx === 0 ? (hash(a.id + b.id) % 2 ? 1 : -1) : Math.sign(dx);
          const correction = Math.min(3.4, overlapX * 0.055);
          a.vx += direction * correction; b.vx -= direction * correction;
          const vertical = dy === 0 ? 1 : Math.sign(dy);
          a.vy += vertical * Math.min(1.2, overlapY * 0.02);
          b.vy -= vertical * Math.min(1.2, overlapY * 0.02);
        }
      }
    }
    for (const point of points) {
      point.vx += (width / 2 - point.x) * 0.00008;
      point.vy += (height / 2 - point.y) * 0.00008;
      point.vx *= 0.91; point.vy *= 0.91;
      const labelMargin = Math.min(105, Math.max(35, context.measureText(point.label).width / 2 + 10));
      point.x = Math.max(labelMargin, Math.min(width - labelMargin, point.x + point.vx));
      point.y = Math.max(35, Math.min(height - 42, point.y + point.vy));
    }
  }
  function draw(now) {
    if (!context) return;
    if (!reduced.matches && !document.hidden) evolve();
    context.fillStyle = '#04111d'; context.fillRect(0, 0, width, height);
    if (graph) {
      for (const relation of graph.relations) {
        const a = particles.get(relation.from), b = particles.get(relation.to);
        if (!a || !b) continue;
        const gradient = context.createLinearGradient(a.x, a.y, b.x, b.y);
        gradient.addColorStop(0, '#1d708d'); gradient.addColorStop(.5, '#3ab7db'); gradient.addColorStop(1, '#69e8f0');
        context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y);
        context.strokeStyle = gradient; context.lineWidth = selectedId === a.id ? 2.3 : 1.1; context.stroke();
        if (!reduced.matches) {
          const phase = ((now / 2800 + (hash(relation.id) % 1000) / 1000) % 1);
          context.beginPath(); context.arc(a.x + (b.x - a.x) * phase, a.y + (b.y - a.y) * phase, 1.7, 0, Math.PI * 2);
          context.fillStyle = '#e5b778'; context.fill();
        }
      }
      context.textAlign = 'center'; context.textBaseline = 'top'; context.font = '12px Segoe UI, sans-serif';
      const labels = [];
      for (const point of particles.values()) {
        const category = point.kind === 'PUBLIC_CATEGORY';
        const chosen = point.id === selectedId;
        const radius = category ? 8 : chosen ? 9 : 5;
        context.beginPath(); context.arc(point.x, point.y, radius + (category ? 6 : 3), 0, Math.PI * 2);
        context.fillStyle = category ? '#1592ba33' : '#7ceef022'; context.fill();
        context.beginPath(); context.arc(point.x, point.y, radius, 0, Math.PI * 2);
        context.fillStyle = category ? '#e5bc7d' : chosen ? '#ffffff' : '#9af2f3'; context.fill();
        const label = category ? point.label.toUpperCase() : point.label;
        const labelWidth = context.measureText(label).width;
        const choices = [
          [point.x, point.y + radius + 7],
          [point.x, point.y - radius - 20],
          [point.x + radius + 9 + labelWidth / 2, point.y - 7],
          [point.x - radius - 9 - labelWidth / 2, point.y - 7]
        ];
        let best = null;
        for (const [index, [x, y]] of choices.entries()) {
          const rect = { left: x - labelWidth / 2 - 3, right: x + labelWidth / 2 + 3,
            top: y - 2, bottom: y + 16 };
          let score = index * 3 +
            (rect.left < 5 ? 1000 : 0) + (rect.right > width - 5 ? 1000 : 0) +
            (rect.top < 5 ? 1000 : 0) + (rect.bottom > height - 5 ? 1000 : 0);
          for (const prior of labels) {
            const overlapX = Math.max(0, Math.min(rect.right, prior.right) - Math.max(rect.left, prior.left));
            const overlapY = Math.max(0, Math.min(rect.bottom, prior.bottom) - Math.max(rect.top, prior.top));
            score += overlapX * overlapY;
          }
          if (!best || score < best.score) best = { x, y, rect, score };
        }
        labels.push(best.rect);
        context.fillStyle = '#04111dde';
        context.fillRect(best.rect.left, best.rect.top, best.rect.right - best.rect.left, best.rect.bottom - best.rect.top);
        context.fillStyle = category ? '#e4bf87' : '#c9f6fb';
        context.fillText(label, best.x, best.y);
      }
      if (selectedId) placeCard();
    }
    requestAnimationFrame(draw);
  }
  async function refresh() {
    try {
      const response = await fetch('../api/space.json', { cache: 'no-store' });
      if (!response.ok) throw Error(`Index HTTP ${response.status}`);
      const next = window.HALVETH_RELATION_MODEL.fromSpace(await response.json());
      if (!graph || graph.source.indexRevision !== next.source.indexRevision) {
        observedAt = new Date().toISOString();
        adopt(next);
      }
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
      if (point.kind !== 'PUBLIC_PROJECT') continue;
      const candidate = Math.hypot(point.x - x, point.y - y);
      if (candidate < distance) { nearest = point.id; distance = candidate; }
    }
    if (nearest) select(nearest);
  });
  document.getElementById('close').addEventListener('click', closeCard);
  addEventListener('resize', resize);
  resize();
  requestAnimationFrame(draw);
  refresh();
})();
