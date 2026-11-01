import { MAX_FOLDS, snapshot } from './fold-model.mjs';

const SVG_NS = 'http://www.w3.org/2000/svg';
const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]';
const JUMPS = Object.freeze([0, 1, 6, 7, 95, 96, 113, 114, 240]);
const PLOT = Object.freeze({ left: 49, right: 578, top: 17, bottom: 186, width: 529, height: 169 });
const CHARTS = Object.freeze({
  stack: Object.freeze({ min: -40, max: 70, ticks: [-40, -20, 0, 20, 40, 60] }),
  compression: Object.freeze({ min: -75, max: 0, ticks: [-60, -40, -20, 0] })
});
let room = null;
let elements = null;
let current = snapshot(0);
let series = null;
let returnFocus = null;
let priorAppInert = null;
let chartCursors = null;

export function parseStage(raw) {
  if (typeof raw !== 'string' || !/^(0|[1-9]\d*)$/.test(raw)) throw new RangeError(`Stufe muss eine ganze Zahl von 0 bis ${MAX_FOLDS} sein.`);
  const stage = Number(raw);
  if (!Number.isSafeInteger(stage) || stage > MAX_FOLDS) throw new RangeError(`Stufe muss eine ganze Zahl von 0 bis ${MAX_FOLDS} sein.`);
  return stage;
}

export function logarithmicY(value, chart) {
  const config = CHARTS[chart];
  if (!config || !Number.isFinite(value) || value <= 0) throw new RangeError('Positive finite length and declared chart required.');
  return PLOT.bottom - (Math.log10(value) - config.min) / (config.max - config.min) * PLOT.height;
}

function xFor(stage) { return PLOT.left + stage / MAX_FOLDS * PLOT.width; }
function svg(tag, attrs = {}) {
  const item = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) item.setAttribute(name, String(value));
  return item;
}
function text(tag, className, value) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  item.textContent = value;
  return item;
}
function scientific(value, unit = '') {
  if (!Number.isFinite(value)) throw new RangeError('A non-finite source value cannot be displayed as a model result.');
  const number = new Intl.NumberFormat('de-DE', { notation: 'scientific', maximumSignificantDigits: 4 }).format(value);
  return `≈ ${number}${unit ? ` ${unit}` : ''}`;
}

function mount() {
  if (room || typeof document === 'undefined') return;
  room = document.createElement('section');
  room.id = 'foldRoom';
  room.className = 'fold-room';
  room.setAttribute('role', 'dialog');
  room.setAttribute('aria-modal', 'true');
  room.setAttribute('aria-labelledby', 'foldRoomTitle');
  room.hidden = true;
  // Static shell only; model and numeric values are inserted as text nodes.
  room.innerHTML = `
    <div class="fold-room__frame">
      <header class="fold-room__header"><div><span class="fold-room__eyebrow">FORSCHUNGSLABOR / FALTGRENZE</span><h2 id="foldRoomTitle" tabindex="-1">Zwei Operatoren, eine Stufe</h2><p>Mathematische Gegenmodelle unter denselben deklarierten Startparametern.</p></div><button type="button" class="fold-room__close" aria-label="Faltgrenze-Modellraum schließen">Zurück zum Portal ×</button></header>
      <section class="fold-room__control" aria-labelledby="foldControlTitle">
        <div class="fold-room__control-head"><h3 id="foldControlTitle">Stufe einstellen</h3><strong class="fold-room__stage" aria-live="polite">0 / 240</strong></div>
        <label for="foldRange">Gemeinsame Modellstufe 0–240</label><input id="foldRange" type="range" min="0" max="240" step="1" value="0" aria-label="Gemeinsame Faltgrenze-Modellstufe wählen">
        <div class="fold-room__control-row"><button type="button" class="fold-room__minus" aria-label="Eine Stufe zurück">−1</button><button type="button" class="fold-room__plus" aria-label="Eine Stufe vor">+1</button><button type="button" class="fold-room__reset">Reset auf 0</button>
          <form class="fold-room__direct"><label for="foldDirect">Stufe direkt</label><input id="foldDirect" type="text" inputmode="numeric" autocomplete="off" aria-describedby="foldError" value="0"><button type="submit">Anwenden</button></form></div>
        <p id="foldError" class="fold-room__error" role="alert" hidden></p>
        <div class="fold-room__jumps" role="group" aria-label="Stufenmarken"></div>
        <p class="fold-room__boundary" role="status" aria-live="polite"></p>
      </section>
      <div class="fold-room__cards">
        <section class="fold-room__card fold-room__card--stack" aria-labelledby="foldStackTitle"><div class="fold-room__card-head"><span>OPERATOR A · IDEALES STAPELN</span><h3 id="foldStackTitle">Fläche ↓ · Schichten ↑</h3></div><p>Pro Stufe wird die jeweils längere Blattkante halbiert. Dicke und Schichtzahl verdoppeln sich; das ideale Volumen bleibt erhalten.</p><div class="fold-room__chart" id="foldStackChart"></div><p class="fold-room__legend"><span class="fold-room__key fold-room__key--gold">Dicke</span><span class="fold-room__key fold-room__key--cyan">Längere Kante</span> · eigene log₁₀-Skala in Metern</p><dl class="fold-room__facts fold-room__stack-facts"></dl></section>
        <section class="fold-room__card fold-room__card--compression" aria-labelledby="foldCompressionTitle"><div class="fold-room__card-head"><span>OPERATOR B · HYPOTHETISCHE ISOTROPE KOMPRESSION</span><h3 id="foldCompressionTitle">Radius ↓ · Dichte ↑</h3></div><p>Ein separat angenommener Kugelradius halbiert sich pro Stufe. Das ist keine geometrische Fortsetzung des Stapels.</p><div class="fold-room__chart" id="foldCompressionChart"></div><p class="fold-room__legend"><span class="fold-room__key fold-room__key--rose">Annahmeradius</span><span class="fold-room__key fold-room__key--gold">Schwarzschild-Vergleich</span><span class="fold-room__key fold-room__key--cyan">Planck-Vergleich</span> · eigene log₁₀-Skala in Metern</p><dl class="fold-room__facts fold-room__compression-facts"></dl></section>
      </div>
      <p class="fold-room__claim">Dies sind gepinnte lokale mathematische Gegenmodelle. Stufen über 6 sind ausdrücklich extrapoliert. Die formalen Radiusvergleiche bei den Defaultannahmen belegen keinen physikalischen Kollaps, keine herstellbare Faltung und keine Außenmessung.</p>
    </div>`;
  document.body.append(room);
  elements = {
    close: room.querySelector('.fold-room__close'), range: room.querySelector('#foldRange'), direct: room.querySelector('#foldDirect'),
    form: room.querySelector('.fold-room__direct'), error: room.querySelector('#foldError'), minus: room.querySelector('.fold-room__minus'),
    plus: room.querySelector('.fold-room__plus'), reset: room.querySelector('.fold-room__reset'), stage: room.querySelector('.fold-room__stage'),
    jumps: room.querySelector('.fold-room__jumps'), boundary: room.querySelector('.fold-room__boundary'),
    stackChart: room.querySelector('#foldStackChart'), compressionChart: room.querySelector('#foldCompressionChart'),
    stackFacts: room.querySelector('.fold-room__stack-facts'), compressionFacts: room.querySelector('.fold-room__compression-facts')
  };
  for (const stage of JUMPS) {
    const button = text('button', '', String(stage));
    button.type = 'button';
    button.setAttribute('aria-label', `Zu Modellstufe ${stage} springen`);
    button.addEventListener('click', () => setStage(stage));
    elements.jumps.append(button);
  }
  elements.close.addEventListener('click', close);
  elements.range.addEventListener('input', () => setStage(Number(elements.range.value)));
  elements.minus.addEventListener('click', () => setStage(current.folds - 1));
  elements.plus.addEventListener('click', () => setStage(current.folds + 1));
  elements.reset.addEventListener('click', () => setStage(0));
  elements.form.addEventListener('submit', event => {
    event.preventDefault();
    try { setStage(parseStage(elements.direct.value)); }
    catch (error) {
      elements.direct.setAttribute('aria-invalid', 'true');
      elements.error.textContent = error.message;
      elements.error.hidden = false;
      elements.direct.focus();
    }
  });
  room.addEventListener('keydown', trapKeys);
  series = Array.from({ length: MAX_FOLDS + 1 }, (_, stage) => snapshot(stage));
  chartCursors = {
    stack: buildChart('stack', elements.stackChart),
    compression: buildChart('compression', elements.compressionChart)
  };
  render();
}

function pathFor(values, chart) {
  return values.map((value, stage) => `${stage ? 'L' : 'M'}${xFor(stage).toFixed(2)},${logarithmicY(value, chart).toFixed(2)}`).join(' ');
}
function buildChart(kind, target) {
  const config = CHARTS[kind];
  const graphic = svg('svg', { viewBox: '0 0 600 220', role: 'img', 'aria-label': kind === 'stack'
    ? 'Idealer Stapel: Dicke und längere Kante über Modellstufen 0 bis 240, logarithmische Längenskala in Metern.'
    : 'Isotrope Kompression: angenommener Radius und zwei feste Vergleichsradien über Modellstufen 0 bis 240, getrennte logarithmische Längenskala in Metern.' });
  graphic.append(svg('rect', { x: xFor(7), y: PLOT.top, width: PLOT.right - xFor(7), height: PLOT.height, class: 'fold-room__extrapolated' }));
  for (const exponent of config.ticks) {
    const y = PLOT.bottom - (exponent - config.min) / (config.max - config.min) * PLOT.height;
    graphic.append(svg('line', { x1: PLOT.left, y1: y, x2: PLOT.right, y2: y, class: 'fold-room__gridline' }));
    const label = svg('text', { x: 3, y: y + 4, class: 'fold-room__axis-label' });
    label.textContent = String(exponent);
    graphic.append(label);
  }
  for (const stage of [0, 60, 120, 180, 240]) {
    const x = xFor(stage);
    graphic.append(svg('line', { x1: x, y1: PLOT.top, x2: x, y2: PLOT.bottom, class: 'fold-room__gridline' }));
    const label = svg('text', { x, y: 210, 'text-anchor': 'middle', class: 'fold-room__axis-label' });
    label.textContent = String(stage);
    graphic.append(label);
  }
  if (kind === 'stack') {
    graphic.append(svg('path', { d: pathFor(series.map(item => item.stack.thicknessM), kind), class: 'fold-room__curve fold-room__curve--gold' }));
    graphic.append(svg('path', { d: pathFor(series.map(item => Math.max(item.stack.widthM, item.stack.heightM)), kind), class: 'fold-room__curve fold-room__curve--cyan' }));
  } else {
    for (const [value, cls] of [[current.comparison.schwarzschildRadiusM, 'gold'], [current.comparison.planckLengthM, 'cyan']]) {
      const y = logarithmicY(value, kind);
      graphic.append(svg('line', { x1: PLOT.left, y1: y, x2: PLOT.right, y2: y, class: `fold-room__threshold fold-room__threshold--${cls}` }));
    }
    graphic.append(svg('path', { d: pathFor(series.map(item => item.compression.radiusM), kind), class: 'fold-room__curve fold-room__curve--rose' }));
  }
  const cursor = svg('line', { y1: PLOT.top, y2: PLOT.bottom, class: 'fold-room__cursor' });
  graphic.append(cursor);
  target.append(graphic);
  return cursor;
}

function addFact(target, label, value) {
  const row = document.createElement('div');
  row.append(text('dt', '', label), text('dd', '', value));
  target.append(row);
}
function renderFacts() {
  const s = current.stack;
  elements.stackFacts.replaceChildren();
  addFact(elements.stackFacts, 'Blattbreite', scientific(s.widthM, 'm'));
  addFact(elements.stackFacts, 'Blatthöhe', scientific(s.heightM, 'm'));
  addFact(elements.stackFacts, 'Stapeldicke', scientific(s.thicknessM, 'm'));
  addFact(elements.stackFacts, 'Fußfläche', scientific(s.footprintAreaM2, 'm²'));
  addFact(elements.stackFacts, 'Schichten', scientific(s.layers));
  addFact(elements.stackFacts, 'Ideales Volumen', scientific(s.volumeM3, 'm³'));
  addFact(elements.stackFacts, 'Stapel-Ausdehnung', scientific(s.boundingRadiusM, 'm'));
  const c = current.comparison;
  elements.compressionFacts.replaceChildren();
  addFact(elements.compressionFacts, 'Annahmeradius', scientific(current.compression.radiusM, 'm'));
  addFact(elements.compressionFacts, 'Annahmedichte', scientific(current.compression.densityKgM3, 'kg/m³'));
  addFact(elements.compressionFacts, 'Schwarzschild-Radius', scientific(c.schwarzschildRadiusM, 'm'));
  addFact(elements.compressionFacts, 'Planck-Länge', scientific(c.planckLengthM, 'm'));
  addFact(elements.compressionFacts, 'Formale Kreuzung', `Schwarzschild: Stufe ${c.firstSchwarzschildFold}; Planck: Stufe ${c.firstPlanckFold} · nur beim Annahmeradius`);
  addFact(elements.compressionFacts, 'Aktueller Vergleich', current.compression.radiusBelowSchwarzschild
    ? 'Annahmeradius ≤ Schwarzschild-Radius; reine Zahlenungleichung.'
    : 'Annahmeradius > Schwarzschild-Radius; reine Zahlenungleichung.');
}
function render() {
  if (!elements) return;
  elements.stage.textContent = `${current.folds} / ${MAX_FOLDS}`;
  elements.range.value = String(current.folds);
  elements.range.setAttribute('aria-valuetext', `Modellstufe ${current.folds} von ${MAX_FOLDS}${current.extrapolated ? ', mathematische Extrapolation über Stufe 6' : ''}`);
  elements.direct.value = String(current.folds);
  elements.direct.removeAttribute('aria-invalid');
  elements.error.hidden = true;
  elements.error.textContent = '';
  elements.minus.disabled = current.folds === 0;
  elements.plus.disabled = current.folds === MAX_FOLDS;
  elements.boundary.classList.toggle('is-extrapolated', Boolean(current.extrapolated));
  elements.boundary.textContent = current.extrapolated
    ? `Stufe ${current.folds}: MATHEMATISCHE EXTRAPOLATION ÜBER STUFE 6 · keine physische Machbarkeit behauptet.`
    : `Stufe ${current.folds}: mathematisches Modell · Stufe 6 ist eine Darstellungsgrenze, kein universelles physikalisches Faltlimit.`;
  for (const button of elements.jumps.children) button.setAttribute('aria-pressed', String(Number(button.textContent) === current.folds));
  const x = xFor(current.folds);
  for (const cursor of Object.values(chartCursors)) { cursor.setAttribute('x1', String(x)); cursor.setAttribute('x2', String(x)); }
  renderFacts();
}
function setStage(stage) {
  if (!Number.isInteger(stage) || stage < 0 || stage > MAX_FOLDS) throw new RangeError('Ungültige Modellstufe.');
  current = series?.[stage] || snapshot(stage);
  render();
}
function trapKeys(event) {
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return; }
  if (event.key !== 'Tab') return;
  const focusable = [...room.querySelectorAll(FOCUSABLE)].filter(item => item.getClientRects().length > 0);
  if (!focusable.length) return;
  if (event.shiftKey && document.activeElement === focusable[0]) { focusable.at(-1).focus(); event.preventDefault(); }
  else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { focusable[0].focus(); event.preventDefault(); }
}
export function isOpen() { return Boolean(room && !room.hidden); }
export function open(triggerElement) {
  if (typeof document === 'undefined') return false;
  mount();
  if (isOpen()) return true;
  returnFocus = triggerElement instanceof Element ? triggerElement : document.activeElement;
  const app = document.querySelector('#appShell');
  priorAppInert = app ? app.inert : null;
  if (app) app.inert = true;
  room.hidden = false;
  room.querySelector('#foldRoomTitle').focus();
  return true;
}
export function close() {
  if (!isOpen()) return false;
  room.hidden = true;
  const app = document.querySelector('#appShell');
  if (app && priorAppInert !== null) app.inert = priorAppInert;
  priorAppInert = null;
  const fallback = document.querySelector('#projectList .list-item[data-project-id="halveth-forschungslabor"]')
    || document.querySelector('.portal[data-project-id="halveth-forschungslabor"]')
    || document.querySelector('#projectSearch');
  const target = returnFocus?.isConnected && returnFocus.getClientRects().length ? returnFocus : fallback;
  target?.focus?.();
  returnFocus = null;
  return true;
}
if (typeof document !== 'undefined') mount();
