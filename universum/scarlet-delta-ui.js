(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HALVETH_SCARLET_DELTA_UI = Object.freeze({ mount: api.mount, ...api.mount(root, root.document) });
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const instances = new WeakMap();
  const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), summary, [href]';
  const OMITTED = Object.freeze(['profileId', 'role', 'enRole', 'membrane', 'inbox', 'processing', 'nextPulse',
    'lastSignal', 'energy', 'memory', 'nextSense', 'nextWaveInput', 'ancestry']);

  function validateReport(report) {
    if (!report || typeof report !== 'object' || !report.source || !report.full || !report.render || !report.differences || !report.matched) {
      throw new TypeError('A paired SCARLET projection report is required.');
    }
    const { source, full, render, differences } = report;
    if (source.model !== 'LOCAL_MOVING_CELL_ECOLOGY' || source.version !== '3.0.0' ||
        !Number.isSafeInteger(source.seed) || !Number.isSafeInteger(source.tick) || !Number.isSafeInteger(source.modelMs) ||
        source.seed < 1 || source.tick < 0 || source.modelMs !== source.tick * 50 ||
        !/^[0-9a-f]{64}$/i.test(source.fullSha256) || source.digestKind !== 'ADAPTER_DERIVED_FULL_SNAPSHOT_SHA256') {
      throw new TypeError('Source identity or local digest is incomplete.');
    }
    if (typeof report.selectedId !== 'string' || !full.node || !render.node ||
        full.node.id !== report.selectedId || render.node.id !== report.selectedId ||
        !Array.isArray(full.events) || !Array.isArray(render.events) || render.events.length !== 0 ||
        !full.coverage || !render.coverage || full.coverage.history !== 'BOUNDED_RECENT_EVENTS' ||
        render.coverage.history !== 'OMITTED_FROM_RENDER_PROJECTION' ||
        render.coverage.retained !== full.coverage.retained || !Number.isSafeInteger(full.coverage.retained) ||
        full.events.length !== full.coverage.retained || full.events.length > 256) {
      throw new TypeError('Selected cell or bounded event coverage does not match.');
    }
    if (Object.hasOwn(render.node, 'memory') || !full.node.memory || !Object.hasOwn(render.node, 'temperature') ||
        render.node.temperature !== full.node.memory.temperature ||
        !Array.isArray(differences.omittedNodeKeys) || differences.omittedNodeKeys.length !== OMITTED.length ||
        !OMITTED.every(name => differences.omittedNodeKeys.includes(name)) ||
        !Array.isArray(differences.addedNodeKeys) || differences.addedNodeKeys.length !== 1 ||
        differences.addedNodeKeys[0] !== 'temperature' || !Array.isArray(report.matched.cellIds) ||
        !report.matched.cellIds.includes(report.selectedId)) {
      throw new TypeError('Render/Full node omission contract does not match.');
    }
    return report;
  }

  function mount(root, doc) {
    if (!doc || !doc.body) return null;
    if (instances.has(doc)) return instances.get(doc);
    const panel = doc.createElement('section');
    panel.id = 'scarletDeltaRoom';
    panel.className = 'scarlet-delta-room';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'scarletDeltaTitle');
    panel.hidden = true;
    // Only fixed shell markup. Every report-derived value uses textContent.
    panel.innerHTML = `
      <div class="scarlet-delta-room__frame">
        <header class="scarlet-delta-room__header"><div><span class="scarlet-delta-room__eyebrow">SCARLET / PROJEKTIONSVERGLEICH</span><h2 id="scarletDeltaTitle" tabindex="-1">Ein Zustand · zwei Ansichten</h2><p>Der Zelllauf ist für diesen Vergleich pausiert. Render und Full stammen aus demselben lokalen Modellstand.</p></div><button class="scarlet-delta-room__close" type="button" aria-label="Projektionsvergleich schließen">Zurück zum Zellraum ×</button></header>
        <p class="scarlet-delta-room__stale" role="status" aria-live="polite" hidden></p>
        <section class="scarlet-delta-room__source" aria-labelledby="scarletDeltaSourceTitle"><div class="scarlet-delta-room__section-head"><h3 id="scarletDeltaSourceTitle">Gemeinsamer Quellzustand</h3><span>LOKALER SOFTWAREZUSTAND</span></div><dl class="scarlet-delta-room__source-facts"></dl><p class="scarlet-delta-room__digest"></p><p class="scarlet-delta-room__source-boundary">Quellgrenze: ein gepinnter synthetischer GStarLiving-Lauf, zwei Projektionen. Der Digest bindet lokale Snapshot-Daten, keine Außenwelt oder öffentliche Git-Historie.</p></section>
        <div class="scarlet-delta-room__cards"><section class="scarlet-delta-room__card scarlet-delta-room__card--render" aria-labelledby="scarletDeltaRenderTitle"><div class="scarlet-delta-room__section-head"><h3 id="scarletDeltaRenderTitle">Render</h3><span>ANZEIGEPROJEKTION</span></div><p>Bewegung und Zellidentität bleiben darstellbar. Ereignisdetails und die Zell-Memory sind aus dieser Projektion ausgelassen.</p><dl class="scarlet-delta-room__render-facts"></dl><p class="scarlet-delta-room__render-omission"></p></section><section class="scarlet-delta-room__card scarlet-delta-room__card--full" aria-labelledby="scarletDeltaFullTitle"><div class="scarlet-delta-room__section-head"><h3 id="scarletDeltaFullTitle">Full</h3><span>BEGRENZTE DETAILPROJEKTION</span></div><p>Die jüngsten erhaltenen Modellereignisse und die Zell-Memory sind hier sichtbar. Ältere Ereignisse liegen außerhalb des begrenzten Fensters.</p><dl class="scarlet-delta-room__full-facts"></dl><details class="scarlet-delta-room__memory"><summary>Vollständige Zell-Memory ansehen</summary><pre></pre></details><div class="scarlet-delta-room__events"><h4>Alle im aktuellen Full-Fenster erhaltenen Ereignisse</h4><p class="scarlet-delta-room__event-count"></p><ol></ol></div></section></div>
        <section class="scarlet-delta-room__difference" aria-labelledby="scarletDeltaDifferenceTitle"><h3 id="scarletDeltaDifferenceTitle">Projektion und Informationsverlust</h3><p class="scarlet-delta-room__matched"></p><div class="scarlet-delta-room__difference-grid"><div><h4>13 aus Render ausgelassene Zellfelder</h4><ul class="scarlet-delta-room__omitted"></ul></div><div><h4>Nur in Render ergänzte Zellfelder</h4><ul class="scarlet-delta-room__added"></ul></div></div><p>Ausgelassen bedeutet nicht im lokalen Quellzustand verschwunden. Full ist selbst nur die begrenzte jüngste Ereignissicht; keine vollständige Laufgeschichte.</p></section>
      </div>`;
    doc.body.append(panel);
    const e = {
      close: panel.querySelector('.scarlet-delta-room__close'), stale: panel.querySelector('.scarlet-delta-room__stale'),
      sourceFacts: panel.querySelector('.scarlet-delta-room__source-facts'), digest: panel.querySelector('.scarlet-delta-room__digest'),
      renderFacts: panel.querySelector('.scarlet-delta-room__render-facts'), renderOmission: panel.querySelector('.scarlet-delta-room__render-omission'),
      fullFacts: panel.querySelector('.scarlet-delta-room__full-facts'), eventCount: panel.querySelector('.scarlet-delta-room__event-count'),
      memory: panel.querySelector('.scarlet-delta-room__memory pre'),
      events: panel.querySelector('.scarlet-delta-room__events ol'), matched: panel.querySelector('.scarlet-delta-room__matched'),
      omitted: panel.querySelector('.scarlet-delta-room__omitted'), added: panel.querySelector('.scarlet-delta-room__added')
    };
    let returnFocus = null;
    let priorAppInert = null;
    let boundReport = null;

    function text(tag, content, className) {
      const node = doc.createElement(tag);
      if (className) node.className = className;
      node.textContent = String(content);
      return node;
    }
    function field(target, label, value) {
      const row = doc.createElement('div');
      row.append(text('dt', label), text('dd', value));
      target.append(row);
    }
    function display(value) {
      if (value === null || value === undefined) return 'nicht vorhanden';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    }
    function render() {
      const report = boundReport;
      const { source, full, render, differences, matched } = report;
      e.sourceFacts.replaceChildren();
      for (const [label, value] of [
        ['Modell', `${source.model} · Version ${source.version}`], ['Seed', source.seed],
        ['Tick', source.tick], ['Modellzeit', `${source.modelMs} ms`], ['Gewählte Zelle', report.selectedId]
      ]) field(e.sourceFacts, label, value);
      e.digest.textContent = `${source.digestKind} · SHA-256 ${source.fullSha256}`;
      e.renderFacts.replaceChildren();
      for (const [label, value] of [
        ['Zell-ID', render.node.id], ['Phase', render.node.phase], ['Position', display(render.node.position)],
        ['Ereignisdetails', '0 sichtbar · aus Render ausgelassen'],
        ['Coverage', display(render.coverage.history)], ['Quelle hält jüngste', `${render.coverage.retained} Ereignisse`],
        ['Memory', 'aus Render ausgelassen'], ['Temperatur-Ansichtswert', display(render.node.temperature)]
      ]) field(e.renderFacts, label, value);
      e.renderOmission.textContent = 'Render.events ist leer und Render.node.memory fehlt. Das ist eine definierte Projektion, kein Beleg für fehlende Ereignisse im Quellzustand.';
      e.fullFacts.replaceChildren();
      for (const [label, value] of [
        ['Zell-ID', full.node.id], ['Phase', full.node.phase], ['Position', display(full.node.position)],
        ['Jüngste Ereignisse', `${full.events.length} von höchstens 256 im Fenster`],
        ['Coverage', display(full.coverage.history)],
        ['Sequenzfenster', `${full.coverage.firstSequence}–${full.coverage.lastSequence}`],
        ['Memory-Kontakte', display(full.node.memory.contacts)], ['Memory-Temperatur', display(full.node.memory.temperature)]
      ]) field(e.fullFacts, label, value);
      e.memory.textContent = JSON.stringify(full.node.memory, null, 2);
      e.eventCount.textContent = `${full.events.length} / ${full.coverage.retained} retained Ereignisse in dieser Liste. Ältere Modellereignisse sind nicht abgedeckt.`;
      e.events.replaceChildren();
      for (const event of full.events) {
        const row = doc.createElement('li');
        const details = doc.createElement('details');
        const summary = text('summary', `Sequenz ${display(event.sequence)} · ${display(event.type)} · ${display(event.subject)} · ${display(event.modelMs)} ms`);
        const data = text('pre', JSON.stringify(event, null, 2));
        details.append(summary, data); row.append(details); e.events.append(row);
      }
      if (!full.events.length) e.events.append(text('li', 'Noch keine erhaltenen Modellereignisse in diesem Fenster.'));
      e.matched.textContent = `Gebundener Vergleich: ${Object.entries(matched).map(([key, value]) => `${key}=${display(value)}`).join(' · ')}. Gleiche IDs/Modellzeit sind nur für diesen Report zu lesen.`;
      e.omitted.replaceChildren(...differences.omittedNodeKeys.map(name => text('li', name)));
      e.added.replaceChildren(...(differences.addedNodeKeys.length
        ? differences.addedNodeKeys.map(name => text('li', name))
        : [text('li', 'Keine ergänzten Felder deklariert.') ]));
    }
    function isOpen() { return !panel.hidden; }
    function close() {
      if (!isOpen()) return false;
      panel.hidden = true;
      const app = doc.querySelector('#appShell');
      if (app && priorAppInert !== null) {
        if (priorAppInert) app.setAttribute('inert', ''); else app.removeAttribute('inert');
      }
      priorAppInert = null;
      const fallback = doc.querySelector('#scarletCompare') || doc.querySelector('#scarletRoomTitle');
      const target = returnFocus?.isConnected && returnFocus.getClientRects().length ? returnFocus : fallback;
      target?.focus?.(); returnFocus = null;
      return true;
    }
    function open(report, trigger) {
      try { boundReport = validateReport(report); }
      catch (error) { root.console?.error?.('SCARLET projection report rejected:', error); return false; }
      if (isOpen()) close();
      returnFocus = trigger && typeof trigger.focus === 'function' ? trigger : doc.activeElement;
      const app = doc.querySelector('#appShell');
      priorAppInert = app ? app.hasAttribute('inert') : null;
      if (app) app.setAttribute('inert', '');
      e.stale.hidden = true; e.stale.textContent = '';
      render();
      panel.hidden = false; panel.scrollTop = 0;
      panel.querySelector('#scarletDeltaTitle').focus();
      return true;
    }
    function markStale(reason) {
      if (!boundReport) return false;
      const detail = String(reason ?? '').trim().replace(/[.!?]+$/, '') || 'Modellzustand geändert';
      e.stale.textContent = `Vergleichsaufnahme ist älter als der aktuelle Zellstand: ${detail}. Die angezeigten Werte bleiben an den aufgenommenen Tick gebunden.`;
      e.stale.hidden = false;
      return true;
    }
    function trapKeys(event) {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return; }
      if (event.key !== 'Tab') return;
      const focusable = [...panel.querySelectorAll(FOCUSABLE)].filter(item => item.getClientRects().length > 0);
      if (!focusable.length) return;
      if (event.shiftKey && (doc.activeElement === focusable[0] || doc.activeElement === panel.querySelector('#scarletDeltaTitle'))) {
        focusable.at(-1).focus(); event.preventDefault();
      } else if (!event.shiftKey && doc.activeElement === focusable.at(-1)) { focusable[0].focus(); event.preventDefault(); }
    }
    e.close.addEventListener('click', close);
    panel.addEventListener('keydown', trapKeys);
    const api = Object.freeze({ open, close, isOpen, markStale });
    instances.set(doc, api);
    return api;
  }
  return Object.freeze({ mount, validateReport });
}));
