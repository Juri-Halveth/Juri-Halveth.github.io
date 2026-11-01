(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    const instance = api.mount(root, root.document);
    root.HALVETH_SOURCE_NETZ_UI = Object.freeze({ mount: api.mount, ...instance });
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const instances = new WeakMap();
  const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), a[href]';

  function exactDuration(milliseconds) {
    if (!Number.isSafeInteger(milliseconds) || milliseconds < 0) throw new RangeError('Nonnegative, exact millisecond interval required.');
    let remaining = milliseconds;
    const days = Math.floor(remaining / 86400000); remaining %= 86400000;
    const hours = Math.floor(remaining / 3600000); remaining %= 3600000;
    const minutes = Math.floor(remaining / 60000); remaining %= 60000;
    const seconds = Math.floor(remaining / 1000); remaining %= 1000;
    const parts = [];
    if (days) parts.push(`${days} ${days === 1 ? 'Tag' : 'Tage'}`);
    if (hours) parts.push(`${hours} ${hours === 1 ? 'Stunde' : 'Stunden'}`);
    if (minutes) parts.push(`${minutes} ${minutes === 1 ? 'Minute' : 'Minuten'}`);
    if (seconds) parts.push(`${seconds} ${seconds === 1 ? 'Sekunde' : 'Sekunden'}`);
    if (remaining) parts.push(`${remaining} ${remaining === 1 ? 'Millisekunde' : 'Millisekunden'}`);
    return parts.join(' · ') || '0 Millisekunden';
  }

  function exactUTC(value) {
    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime())) throw new RangeError('Valid source timestamp required.');
    return parsed.toISOString().replace('T', ' ').replace(/\.000Z$/, 'Z').replace(/Z$/, ' UTC');
  }

  function inspectSelection(selection, adapter) {
    if (!selection || selection.kind !== 'PUBLIC_SOURCE_REVISION_SELECTION' ||
        !Array.isArray(selection.revisions) || selection.revisions.length !== 4 ||
        !Array.isArray(selection.gaps) || selection.gaps.length !== 2 ||
        !adapter || typeof adapter.viewAt !== 'function') throw new TypeError('Expected a validated four-revision selection with two global gaps.');
    const first = adapter.viewAt(selection, 0);
    const last = adapter.viewAt(selection, 3);
    if (first.selection !== selection || first.selectedRevision !== selection.revisions[0] ||
        first.prefix.length !== 1 || last.prefix.length !== 4 || last.selectedRevision !== selection.revisions[3] ||
        last.gaps !== selection.gaps) throw new TypeError('Selection prefix binding mismatch.');
    for (const [index, revision] of selection.revisions.entries()) {
      if (revision.kind !== 'SOURCE_REVISION' || !/^[0-9a-f]{40}$/i.test(revision.sha)) throw new TypeError('Invalid source revision.');
      if (index === 0 && (revision.previousInSelection !== null || revision.elapsedFromPrevious !== null)) throw new TypeError('First selected revision must have no predecessor interval.');
      if (index > 0 && (revision.previousInSelection?.relation !== 'PREVIOUS_SELECTED_REVISION_ONLY_NOT_GIT_PARENT' ||
          revision.previousInSelection.sha !== selection.revisions[index - 1].sha ||
          revision.elapsedFromPrevious?.basis !== 'SELECTED_COMMITTER_TIMESTAMPS' ||
          revision.elapsedFromPrevious.milliseconds !== Date.parse(revision.committerAt) - Date.parse(selection.revisions[index - 1].committerAt))) {
        throw new TypeError('Selected-commit interval binding mismatch.');
      }
      exactUTC(revision.committerAt);
      exactUTC(revision.recordedAt);
    }
    return selection;
  }

  function mount(root, doc) {
    if (!doc || !doc.body) return null;
    if (instances.has(doc)) return instances.get(doc);
    const panel = doc.createElement('section');
    panel.id = 'sourceNetzRoom';
    panel.className = 'source-netz-room';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'sourceNetzTitle');
    panel.hidden = true;
    // Static shell only. Source-derived text is inserted with textContent.
    panel.innerHTML = `
      <div class="source-netz-room__frame">
        <header class="source-netz-room__header"><div><span class="source-netz-room__eyebrow">NETZ / ÖFFENTLICHE QUELLEN</span><h2 id="sourceNetzTitle" tabindex="-1">Vier ausgewählte Revisionen</h2><p>Lesender Auswahlzweig. Getrennt vom synthetischen NETZ-Modell und von einer vollständigen Git-Historie.</p></div><button type="button" class="source-netz-room__close" aria-label="NETZ-Quellraum schließen">Zurück zum Portal ×</button></header>
        <section class="source-netz-room__track" aria-labelledby="sourceNetzTrackTitle"><div class="source-netz-room__heading"><h3 id="sourceNetzTrackTitle">Commitknoten</h3><strong class="source-netz-room__counter">01 / 04</strong></div><p class="source-netz-room__coverage"></p><div class="source-netz-room__nodes" role="group" aria-label="Vier ausgewählte öffentliche Commits wählen"></div><input class="source-netz-room__range" type="range" min="0" max="3" step="1" value="0" aria-label="Ausgewählte Quellrevision wählen"><p class="source-netz-room__track-note">Knoten stehen in Auswahlreihenfolge und mit gleichen Bildabständen. Verbindungen als Git-Parent oder Ursache werden hier nicht behauptet.</p><ol class="source-netz-room__intervals"></ol></section>
        <div class="source-netz-room__layout"><section class="source-netz-room__selected" aria-labelledby="sourceNetzSelectedTitle"><span class="source-netz-room__eyebrow">AUSGEWÄHLTE REVISION</span><h3 id="sourceNetzSelectedTitle"></h3><p class="source-netz-room__summary"></p><dl class="source-netz-room__facts"></dl><p class="source-netz-room__elapsed"></p><button type="button" class="source-netz-room__detail">Diese Revision in der Quellspur öffnen</button></section><section class="source-netz-room__prefix" aria-labelledby="sourceNetzPrefixTitle"><h3 id="sourceNetzPrefixTitle">Erhaltener Auswahlpräfix</h3><p>Bis zur gewählten Revision sichtbar. Keine Aussage über ausgelassene Commits oder Git-Parents.</p><ol></ol></section></div>
        <section class="source-netz-room__gaps" aria-labelledby="sourceNetzGapsTitle"><h3 id="sourceNetzGapsTitle">Zwei globale Abdeckungs- und Beleglücken</h3><ul></ul></section>
        <footer class="source-netz-room__footer"><p class="source-netz-room__scope"></p><p class="source-netz-room__integrity"></p><p>Claim Ceiling: ausgewählte öffentliche Repository-Commits und die dort gebundenen Dateibelege. Ein Digest bindet die geprüfte Manifeststruktur, keine Kausalität, Laufzeitwirkung oder Vollständigkeit.</p></footer>
      </div>`;
    doc.body.append(panel);
    const e = {
      close: panel.querySelector('.source-netz-room__close'), coverage: panel.querySelector('.source-netz-room__coverage'),
      counter: panel.querySelector('.source-netz-room__counter'), nodes: panel.querySelector('.source-netz-room__nodes'),
      range: panel.querySelector('.source-netz-room__range'), intervals: panel.querySelector('.source-netz-room__intervals'),
      title: panel.querySelector('#sourceNetzSelectedTitle'), summary: panel.querySelector('.source-netz-room__summary'),
      facts: panel.querySelector('.source-netz-room__facts'), elapsed: panel.querySelector('.source-netz-room__elapsed'),
      detail: panel.querySelector('.source-netz-room__detail'), prefix: panel.querySelector('.source-netz-room__prefix ol'),
      gaps: panel.querySelector('.source-netz-room__gaps ul'), scope: panel.querySelector('.source-netz-room__scope'),
      integrity: panel.querySelector('.source-netz-room__integrity')
    };
    let selection = null;
    let activeIndex = 0;
    let returnFocus = null;
    let priorAppInert = null;

    const item = (tag, content, className) => {
      const node = doc.createElement(tag);
      if (className) node.className = className;
      node.textContent = content;
      return node;
    };
    function fact(label, value) {
      const row = doc.createElement('div');
      row.append(item('dt', label), item('dd', value));
      e.facts.append(row);
    }
    function renderIntervals() {
      e.intervals.replaceChildren();
      for (let index = 1; index < selection.revisions.length; index++) {
        const revision = selection.revisions[index];
        const row = doc.createElement('li');
        row.append(item('strong', `Auswahl ${String(index).padStart(2, '0')} und ${String(index + 1).padStart(2, '0')}`),
          item('span', exactDuration(revision.elapsedFromPrevious.milliseconds)));
        e.intervals.append(row);
      }
    }
    function renderGaps() {
      e.gaps.replaceChildren();
      for (const gap of selection.gaps) {
        const row = doc.createElement('li');
        row.append(item('strong', `${gap.kind} · ${gap.scope}`), item('span', gap.reason), item('small', `Wiederaufnahme: ${gap.reopenTrigger}`));
        e.gaps.append(row);
      }
    }
    function setIndex(index) {
      const view = root.HALVETH_SOURCE_NETZ.viewAt(selection, index);
      if (view.selection !== selection || view.selectedRevision !== selection.revisions[index] || view.prefix.at(-1) !== view.selectedRevision) {
        throw new TypeError('Source prefix view does not match the selection.');
      }
      activeIndex = index;
      const revision = view.selectedRevision;
      e.counter.textContent = `${String(index + 1).padStart(2, '0')} / 04`;
      e.range.value = String(index);
      e.range.setAttribute('aria-valuetext', `Revision ${index + 1} von 4: ${revision.title}, Committerzeit ${exactUTC(revision.committerAt)}`);
      [...e.nodes.children].forEach((button, at) => button.setAttribute('aria-pressed', String(at === index)));
      e.title.textContent = revision.title;
      e.summary.textContent = revision.summary;
      e.facts.replaceChildren();
      fact('Auswahl-ID', revision.id);
      fact('Commit SHA', revision.sha);
      fact('Committerzeit', exactUTC(revision.committerAt));
      fact('Erfassungszeit', exactUTC(revision.recordedAt));
      fact('Autorzeit', exactUTC(revision.authorAt));
      fact('Zeitbasis', revision.eventTimeBasis);
      e.elapsed.textContent = index === 0
        ? 'Erste gewählte Revision: Eine vorherige Commitfolge ist hier nicht inventarisiert.'
        : `Abstand zur vorherigen gewählten Revision: ${exactDuration(revision.elapsedFromPrevious.milliseconds)} (Committerzeitstempel). Dazwischenliegende Commits bleiben offen.`;
      e.prefix.replaceChildren();
      for (const [at, entry] of view.prefix.entries()) {
        const row = item('li', `${String(at + 1).padStart(2, '0')} · ${entry.sha.slice(0, 12)} · ${entry.title}`);
        if (at === index) row.setAttribute('aria-current', 'true');
        e.prefix.append(row);
      }
    }
    function buildSelection() {
      e.nodes.replaceChildren();
      selection.revisions.forEach((revision, index) => {
        const button = item('button', String(index + 1).padStart(2, '0'));
        button.type = 'button';
        button.setAttribute('aria-label', `Revision ${index + 1} auswählen: ${revision.title}, Commit ${revision.sha.slice(0, 12)}`);
        button.addEventListener('click', () => setIndex(index));
        e.nodes.append(button);
      });
      e.coverage.textContent = `${selection.repository} · vier ausgewählte öffentliche Commits · keine vollständige Git-Historie`;
      e.scope.textContent = `${selection.coverage.notes} Quelle: ${selection.coverage.source}. Auswahl: ${selection.coverage.selection}.`;
      e.integrity.textContent = `${selection.integrity.algorithm} · ${selection.integrity.digest} · erfasst ${exactUTC(selection.retrievedAt)} · beobachteter Head ${selection.head.slice(0, 12)}`;
      renderIntervals();
      renderGaps();
      setIndex(0);
    }
    function isOpen() { return !panel.hidden; }
    function close() {
      if (!isOpen()) return false;
      panel.hidden = true;
      const app = doc.querySelector('#appShell');
      if (app && priorAppInert !== null) {
        if (priorAppInert) app.setAttribute('inert', '');
        else app.removeAttribute('inert');
      }
      priorAppInert = null;
      const fallback = doc.querySelector('#sourceNetzButton') || doc.querySelector('#projectSearch');
      const target = returnFocus?.isConnected && returnFocus.getClientRects().length ? returnFocus : fallback;
      target?.focus?.();
      returnFocus = null;
      return true;
    }
    function setProject(id) {
      if (isOpen()) close();
      selection = null;
      activeIndex = 0;
      const adapter = root.HALVETH_SOURCE_NETZ;
      try {
        const next = adapter?.forProject?.(id) || null;
        if (!next) return false;
        if (next.projectId !== id) throw new TypeError('Project selection mismatch.');
        selection = inspectSelection(next, adapter);
        buildSelection();
        return true;
      } catch (error) {
        selection = null;
        root.console?.error?.('NETZ source selection unavailable:', error);
        return false;
      }
    }
    function open(triggerElement) {
      if (!selection) return false;
      if (isOpen()) return true;
      returnFocus = triggerElement && typeof triggerElement.focus === 'function' ? triggerElement : doc.activeElement;
      const app = doc.querySelector('#appShell');
      priorAppInert = app ? app.hasAttribute('inert') : null;
      if (app) app.setAttribute('inert', '');
      panel.hidden = false;
      panel.scrollTop = 0;
      panel.querySelector('#sourceNetzTitle').focus();
      return true;
    }
    function trapKeys(event) {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return; }
      if (event.key !== 'Tab') return;
      const focusable = [...panel.querySelectorAll(FOCUSABLE)].filter(node => node.getClientRects().length > 0);
      if (!focusable.length) return;
      if (event.shiftKey && doc.activeElement === focusable[0]) { focusable.at(-1).focus(); event.preventDefault(); }
      else if (!event.shiftKey && doc.activeElement === focusable.at(-1)) { focusable[0].focus(); event.preventDefault(); }
    }
    e.close.addEventListener('click', close);
    e.range.addEventListener('input', () => setIndex(Number(e.range.value)));
    e.detail.addEventListener('click', () => {
      const source = root.HALVETH_SOURCE_UI;
      if (!source || typeof source.openAt !== 'function') return;
      const index = activeIndex;
      close(); // Releases app inert and restores the CTA before source.js opens its own modal.
      source.openAt(index);
    });
    panel.addEventListener('keydown', trapKeys);
    const api = Object.freeze({ setProject, open, close, isOpen });
    instances.set(doc, api);
    return api;
  }
  return Object.freeze({ mount, exactDuration, exactUTC, inspectSelection });
}));
