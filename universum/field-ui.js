import { CENTRAL, BOUNDARY, simulateCentral, simulateBoundary } from "./vendor/field-difference/physics.js";
import { at as boundaryAt, trajectories as boundaryTrajectories,
  KAPPA_PRESETS as BOUNDARY_FACTOR_PRESETS, CROSSING_TIME as BOUNDARY_CROSSING,
  DURATION as BOUNDARY_DURATION } from "./field-boundary.mjs";

// A small view adapter around the pinned, dimensionless Field Difference model.
// This file does not modify the source model or start a simulation on import.
export const FIELD_PRESETS = Object.freeze([0, 0.5, 1.4]);
const MODES = Object.freeze(["central", "boundary", "boundary-factors"]);
const SVG_NS = "http://www.w3.org/2000/svg";
const PLOT = Object.freeze({ x: 54, y: 22, width: 540, height: 230 });
const SOURCE_URL = "https://github.com/Juri-Halveth/halveth-field-difference-lab/blob/7ed3788aec2593bfbaa4d6433aec8870ccbc4ff7/physics.js";
const domainCache = new Map();
const builtBoundaryFactors = new WeakSet();
let mountSequence = 0;

function checked(mode, kappa) {
  if (!MODES.includes(mode) || mode === "boundary-factors" || !FIELD_PRESETS.includes(kappa)) {
    throw new RangeError("Unknown bounded Field Difference comparison");
  }
}

function track(mode, kappa) {
  const values = mode === "central"
    ? simulateCentral(kappa, CENTRAL)
    : simulateBoundary({ ...BOUNDARY, kappaRight: kappa }, 0.01);
  return Object.freeze(values.map(point =>
    Object.freeze({ t: point.t, x: point.x, y: point.y })));
}

function domainFor(mode) {
  if (domainCache.has(mode)) return domainCache.get(mode);
  const all = [1, ...FIELD_PRESETS].flatMap(kappa => track(mode, kappa));
  const minX = Math.min(...all.map(point => point.x));
  const maxX = Math.max(...all.map(point => point.x));
  const minY = Math.min(...all.map(point => point.y));
  const maxY = Math.max(...all.map(point => point.y));
  const padX = Math.max((maxX - minX) * 0.09, 0.12);
  const padY = Math.max((maxY - minY) * 0.09, 0.12);
  const domain = Object.freeze({
    minX: minX - padX, maxX: maxX + padX,
    minY: minY - padY, maxY: maxY + padY
  });
  domainCache.set(mode, domain);
  return domain;
}

function domainForTracks(tracks) {
  const all = [tracks.control, tracks.leftOnly, tracks.rightOnly].flat();
  const minX = Math.min(...all.map(point => point.x));
  const maxX = Math.max(...all.map(point => point.x));
  const minY = Math.min(...all.map(point => point.y));
  const maxY = Math.max(...all.map(point => point.y));
  const padX = Math.max((maxX - minX) * 0.09, 0.12);
  const padY = Math.max((maxY - minY) * 0.09, 0.12);
  return Object.freeze({ minX: minX - padX, maxX: maxX + padX,
    minY: minY - padY, maxY: maxY + padY });
}

export function buildBoundaryFactorComparison(kappa) {
  if (!BOUNDARY_FACTOR_PRESETS.includes(kappa)) throw new RangeError("Unknown bounded boundary factor");
  const source = boundaryTrajectories(kappa);
  const comparison = Object.freeze({
    mode: "boundary-factors", kappa, control: source.tracks.control,
    leftOnly: source.tracks.leftOnly, rightOnly: source.tracks.rightOnly,
    crossingTime: source.crossingTime, duration: source.duration,
    domain: domainForTracks(source.tracks), source
  });
  builtBoundaryFactors.add(comparison);
  return comparison;
}

export function sampleBoundaryFactorComparison(comparison, percent) {
  if (!comparison || !builtBoundaryFactors.has(comparison)) {
    throw new TypeError("A built boundary factor comparison is required");
  }
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
    throw new RangeError("Display step must be an integer from 0 to 100");
  }
  return boundaryAt(comparison.kappa, percent * BOUNDARY_DURATION / 100);
}

export function buildComparison(mode, kappa) {
  checked(mode, kappa);
  const reference = track(mode, 1);
  const selected = track(mode, kappa);
  if (reference.length !== selected.length) throw new Error("Model sample count mismatch");
  return Object.freeze({
    mode, kappa, reference, selected, domain: domainFor(mode),
    model: "PINNED_DIMENSIONLESS_FIELD_DIFFERENCE"
  });
}

export function sampleComparison(comparison, percent) {
  if (!comparison || !Array.isArray(comparison.reference) || !Array.isArray(comparison.selected)) {
    throw new TypeError("A built comparison is required");
  }
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
    throw new RangeError("Display step must be an integer from 0 to 100");
  }
  const index = Math.round(percent / 100 * (comparison.reference.length - 1));
  const reference = comparison.reference[index];
  const selected = comparison.selected[index];
  return Object.freeze({
    percent, index, t: selected.t, reference, selected,
    separation: Math.hypot(selected.x - reference.x, selected.y - reference.y)
  });
}

function svgNode(document, name, attrs) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

function project(point, domain) {
  return {
    x: PLOT.x + (point.x - domain.minX) / (domain.maxX - domain.minX) * PLOT.width,
    y: PLOT.y + (domain.maxY - point.y) / (domain.maxY - domain.minY) * PLOT.height
  };
}

function pathData(points, domain) {
  return points.map((point, index) => {
    const position = project(point, domain);
    return (index ? "L" : "M") + position.x.toFixed(2) + " " + position.y.toFixed(2);
  }).join(" ");
}

function drawGrid(document, group, comparison) {
  group.replaceChildren();
  const domain = comparison.domain;
  const boundaryMode = comparison.mode === "boundary" || comparison.mode === "boundary-factors";
  if (boundaryMode && domain.minX < 0 && domain.maxX > 0) {
    const crossingX = project({ x: 0, y: 0 }, domain).x;
    group.append(
      svgNode(document, "rect", { x: PLOT.x, y: PLOT.y, width: crossingX - PLOT.x,
        height: PLOT.height, fill: "#66d5e8", opacity: 0.035 }),
      svgNode(document, "rect", { x: crossingX, y: PLOT.y,
        width: PLOT.x + PLOT.width - crossingX, height: PLOT.height,
        fill: "#b79bff", opacity: 0.035 })
    );
  }
  for (let i = 0; i <= 4; i += 1) {
    const x = PLOT.x + i * PLOT.width / 4;
    const y = PLOT.y + i * PLOT.height / 4;
    group.append(
      svgNode(document, "line", { x1: x, y1: PLOT.y, x2: x, y2: PLOT.y + PLOT.height, stroke: "#46556c", opacity: 0.35 }),
      svgNode(document, "line", { x1: PLOT.x, y1: y, x2: PLOT.x + PLOT.width, y2: y, stroke: "#46556c", opacity: 0.35 })
    );
  }
  if (domain.minY <= 0 && domain.maxY >= 0) {
    const y = project({ x: 0, y: 0 }, domain).y;
    group.append(svgNode(document, "line", { x1: PLOT.x, y1: y, x2: PLOT.x + PLOT.width, y2: y, stroke: "#98aac2", opacity: 0.7 }));
  }
  if (domain.minX <= 0 && domain.maxX >= 0) {
    const x = project({ x: 0, y: 0 }, domain).x;
    group.append(svgNode(document, "line", {
      x1: x, y1: PLOT.y, x2: x, y2: PLOT.y + PLOT.height,
      stroke: boundaryMode ? "#f4d18c" : "#98aac2",
      "stroke-dasharray": boundaryMode ? "5 5" : "none", opacity: 0.8
    }));
    if (boundaryMode) {
      const label = svgNode(document, "text", { x: x + 5, y: PLOT.y + 15, fill: "#f4d18c", "font-size": 11 });
      label.textContent = "Grenze x=0";
      group.append(label);
    }
  }
  const xLabel = svgNode(document, "text", { x: PLOT.x + PLOT.width, y: PLOT.y + PLOT.height + 25, fill: "#b8c6d8", "font-size": 12, "text-anchor": "end" });
  xLabel.textContent = "x · Modellkoordinate";
  const yLabel = svgNode(document, "text", { x: PLOT.x, y: PLOT.y - 7, fill: "#b8c6d8", "font-size": 12 });
  yLabel.textContent = "y";
  group.append(xLabel, yLabel);
}

export function mount(container) {
  if (!container || !container.ownerDocument || typeof container.replaceChildren !== "function") {
    throw new TypeError("A DOM container is required");
  }
  const document = container.ownerDocument;
  const view = document.defaultView;
  if (!view) throw new TypeError("A browser window is required");
  const id = "field-demo-" + (++mountSequence);
  container.innerHTML = [
    '<section class="field-demo" aria-labelledby="' + id + '-title">',
    '<header class="field-demo-head"><div><span class="field-demo-kicker">FIELD DIFFERENCE LAB · LOKALES MODELL</span>',
    '<h3 id="' + id + '-title">Gleicher Start · andere Regel</h3>',
    '<p data-field="intro">Die gepinnten Quellfunktionen berechnen zwei Bahnen. Die Referenz hat κ=1; nur der gewählte Regelwert ändert sich.</p></div></header>',
    '<div class="field-demo-controls">',
    '<label for="' + id + '-mode">Modell <select id="' + id + '-mode" data-field="mode"><option value="central">Zentrales Feld</option><option value="boundary">Grenzübertritt · zwei Bahnen</option><option value="boundary-factors">Grenzregel · links / rechts</option></select></label>',
    '<label data-field="old-kappa-control" for="' + id + '-kappa">Variante κ <select id="' + id + '-kappa" data-field="kappa"><option value="0">0</option><option value="0.5">0,5</option><option value="1.4" selected>1,4</option></select></label>',
    '<label data-field="factor-kappa-control" for="' + id + '-factor-kappa" hidden>Nur eine Seite auf κ setzen <select id="' + id + '-factor-kappa" data-field="factor-kappa"><option value="0">0 · links neutral</option><option value="0.5">0,5</option><option value="1" selected>1 · beide verändern sich</option><option value="1.4">1,4 · rechts neutral</option></select></label>',
    '<label data-field="time-control" for="' + id + '-time">Modellzeit <output data-field="time" for="' + id + '-time">t = 0,00</output><input id="' + id + '-time" data-field="time-range" type="range" min="0" max="100" step="1" value="0"></label>',
    '<div class="field-demo-buttons"><button type="button" data-field="play">▶ Abspielen</button><button type="button" data-field="step">+ 5 % Zeit</button><button type="button" data-field="before" hidden>Vor der Grenze · t=1,75</button><button type="button" data-field="after" hidden>Nach der Grenze · t=4,90</button><button type="button" data-field="reset">Zurücksetzen</button></div>',
    '</div>',
    '<div class="field-demo-legend"><span data-field="legend-reference"><i class="reference" aria-hidden="true"></i>Referenz κ=1</span><span data-field="legend-selected"><i class="selected" aria-hidden="true"></i>Gewählte Variante</span><span data-field="legend-control" hidden><i class="control" aria-hidden="true"></i>Quell-Default · κL=0, κR=1,4</span><span data-field="legend-left" hidden><i class="left-only" aria-hidden="true"></i><strong data-field="legend-left-text">Nur links κL=1</strong></span><span data-field="legend-right" hidden><i class="right-only" aria-hidden="true"></i><strong data-field="legend-right-text">Nur rechts κR=1</strong></span></div>',
    '<p class="field-demo-phase" data-field="phase" hidden></p>',
    '<svg class="field-demo-plot" data-field="plot" viewBox="0 0 640 290" role="img" aria-labelledby="' + id + '-plot-title" aria-describedby="' + id + '-plot-desc">',
    '<title id="' + id + '-plot-title" data-field="plot-title">Zwei berechnete Trajektorien</title><desc id="' + id + '-plot-desc" data-field="description"></desc>',
    '<g data-field="grid"></g>',
    '<path data-field="reference-path" fill="none" stroke="#66d5e8" stroke-width="3" stroke-linecap="round" vector-effect="non-scaling-stroke"></path>',
    '<path data-field="selected-path" fill="none" stroke="#ffb26b" stroke-width="3" stroke-linecap="round" vector-effect="non-scaling-stroke"></path>',
    '<circle data-field="reference-marker" r="6" fill="#66d5e8" stroke="#09111d" stroke-width="2"></circle>',
    '<circle data-field="selected-marker" r="6" fill="#ffb26b" stroke="#09111d" stroke-width="2"></circle>',
    '<path data-field="control-path" fill="none" stroke="#66d5e8" stroke-width="3" stroke-linecap="round" vector-effect="non-scaling-stroke" visibility="hidden"></path>',
    '<path data-field="left-path" fill="none" stroke="#ffb26b" stroke-width="3" stroke-linecap="round" vector-effect="non-scaling-stroke" visibility="hidden"></path>',
    '<path data-field="right-path" fill="none" stroke="#b79bff" stroke-width="3" stroke-dasharray="8 5" stroke-linecap="round" vector-effect="non-scaling-stroke" visibility="hidden"></path>',
    '<g data-field="crossing-markers"></g>',
    '<circle data-field="control-marker" r="6" fill="#66d5e8" stroke="#09111d" stroke-width="2" visibility="hidden"></circle>',
    '<circle data-field="left-marker" r="6" fill="#ffb26b" stroke="#09111d" stroke-width="2" visibility="hidden"></circle>',
    '<circle data-field="right-marker" r="6" fill="#b79bff" stroke="#09111d" stroke-width="2" visibility="hidden"></circle>',
    '</svg>',
    '<p class="field-demo-readout" data-field="readout" role="status" aria-live="polite" aria-atomic="true"></p>',
    '<p class="field-demo-boundary">Dimensionslose Softwarebahnen mit festgelegten Startwerten. Kurven und Zeit sind Modellwerte, keine Messung realer Kräfte oder Orte.</p>',
    '<p class="field-demo-credit">Quellkern: Juri Janovski / HALVETH Field Difference Lab · <a href="' + SOURCE_URL + '" target="_blank" rel="noopener noreferrer">gepinntes physics.js ↗</a> · <a href="vendor/field-difference/LICENSE" target="_blank" rel="noopener noreferrer">Apache 2.0</a> · <a href="vendor/field-difference/NOTICE" target="_blank" rel="noopener noreferrer">NOTICE</a>. Ansicht und Steuerung sind lokale Ergänzungen.</p>',
    '</section>'
  ].join("");
  const root = container.querySelector(".field-demo");
  const part = name => root.querySelector('[data-field="' + name + '"]');
  const modeSelect = part("mode");
  const kappaSelect = part("kappa");
  const factorKappaSelect = part("factor-kappa");
  const timeRange = part("time-range");
  const timeOutput = part("time");
  const playButton = part("play");
  const stepButton = part("step");
  const resetButton = part("reset");
  const readout = part("readout");
  const description = part("description");
  let mode = "central";
  let kappa = 1.4;
  let factorKappa = 1;
  let percent = 0;
  let comparison = buildComparison(mode, kappa);
  modeSelect.value = mode;
  kappaSelect.value = String(kappa);
  factorKappaSelect.value = String(factorKappa);
  let frameId = 0;
  let playing = false;
  let startedAt = null;
  let startingPercent = 0;
  const reducedMotion = typeof view.matchMedia === "function"
    ? view.matchMedia("(prefers-reduced-motion: reduce)") : null;
  const isReduced = () => Boolean(reducedMotion?.matches ||
    document.getElementById?.("appShell")?.classList?.contains("reduced-motion"));

  function stopPlayback() {
    if (frameId) view.cancelAnimationFrame(frameId);
    frameId = 0;
    playing = false;
    startedAt = null;
    readout.setAttribute("aria-live", "polite");
    playButton.textContent = "▶ Abspielen";
  }
  const localized = value => String(value).replace(".", ",");
  function visibility(name, visible) {
    part(name).setAttribute("visibility", visible ? "visible" : "hidden");
  }
  function syncSurface() {
    const factors = mode === "boundary-factors";
    part("old-kappa-control").hidden = factors;
    part("factor-kappa-control").hidden = !factors;
    for (const name of ["before", "after", "legend-control", "legend-left", "legend-right", "phase"]) {
      part(name).hidden = !factors;
    }
    for (const name of ["legend-reference", "legend-selected"]) part(name).hidden = factors;
    for (const name of ["reference-path", "selected-path", "reference-marker", "selected-marker"]) visibility(name, !factors);
    for (const name of ["control-path", "left-path", "right-path", "control-marker", "left-marker", "right-marker"]) visibility(name, factors);
    part("intro").textContent = factors
      ? "Drei Bahnen bei denselben Startwerten: Quell-Default, nur die linke Regel geändert und nur die rechte Regel geändert. Der gemeinsame Zeitregler zeigt, ab wann jede Änderung wirkt."
      : "Die gepinnten Quellfunktionen berechnen zwei Bahnen. Die Referenz hat κ=1; nur der gewählte Regelwert ändert sich.";
    part("plot-title").textContent = factors ? "Drei berechnete Grenzbahnen" : "Zwei berechnete Trajektorien";
    part("legend-left-text").textContent = "Nur links κL=" + localized(factorKappa) + (factorKappa === 0 ? " · neutral" : "");
    part("legend-right-text").textContent = "Nur rechts κR=" + localized(factorKappa) + (factorKappa === 1.4 ? " · neutral" : "");
  }
  function renderFactorFrame() {
    const report = sampleBoundaryFactorComparison(comparison, percent);
    for (const [name, state] of Object.entries(report.states)) {
      const marker = name === "leftOnly" ? "left-marker" : name === "rightOnly" ? "right-marker" : "control-marker";
      const position = project(state, comparison.domain);
      part(marker).setAttribute("cx", position.x.toFixed(2));
      part(marker).setAttribute("cy", position.y.toFixed(2));
    }
    timeRange.value = String(percent);
    timeOutput.textContent = "t = " + localized(report.t.toFixed(3)) + " / " + localized(BOUNDARY_DURATION);
    const phase = report.phase === "BEFORE_CROSSING" ? "VOR GRENZÜBERTRITT" :
      report.phase === "AT_CROSSING" ? "AM GRENZPUNKT" : "NACH GRENZÜBERTRITT";
    part("phase").textContent = phase + " · x=0 bei t=" + localized(BOUNDARY_CROSSING.toFixed(3)) +
      " · links κL=0 und rechts κR=1,4 im Quell-Default";
    part("phase").setAttribute("data-phase", report.phase);
    const neutral = factorKappa === 0 ? " Links ist die unveränderte Kontrollregel gewählt." :
      factorKappa === 1.4 ? " Rechts ist die unveränderte Kontrollregel gewählt." : "";
    const sameStart = report.t === 0 ? " Gleiche Startposition; Beschleunigung kann bereits verschieden sein." : "";
    readout.textContent = "Bei t=" + localized(report.t.toFixed(3)) + " · " + phase.toLowerCase() +
      ": nur links κL=" + localized(factorKappa) + " ergibt Δy=" + localized(report.comparison.leftDeltaY.toFixed(3)) +
      "; nur rechts κR=" + localized(factorKappa) + " ergibt Δy=" + localized(report.comparison.rightDeltaY.toFixed(3)) +
      " gegenüber der Kontrolle." + neutral + sameStart;
    description.textContent = "Drei dimensionslose Softwarebahnen bei demselben t=" + localized(report.t.toFixed(3)) +
      ". Quell-Default in Türkis, nur linke Regel in Orange, nur rechte Regel in Violett gestrichelt. " +
      phase + ". Änderung links Δy=" + localized(report.comparison.leftDeltaY.toFixed(3)) +
      ", rechts Δy=" + localized(report.comparison.rightDeltaY.toFixed(3)) + ".";
  }
  function renderFrame() {
    if (mode === "boundary-factors") { renderFactorFrame(); return; }
    const frame = sampleComparison(comparison, percent);
    const reference = project(frame.reference, comparison.domain);
    const selected = project(frame.selected, comparison.domain);
    part("reference-marker").setAttribute("cx", reference.x.toFixed(2));
    part("reference-marker").setAttribute("cy", reference.y.toFixed(2));
    part("selected-marker").setAttribute("cx", selected.x.toFixed(2));
    part("selected-marker").setAttribute("cy", selected.y.toFixed(2));
    timeRange.value = String(percent);
    timeOutput.textContent = "t = " + frame.t.toFixed(2).replace(".", ",");
    const context = mode === "central"
      ? "Zentrales Feld: gleicher Startpunkt und gleiche Anfangsgeschwindigkeit."
      : "Grenzübertritt: links gleiche Regel, rechts verschiedene κ-Werte.";
    readout.textContent = context + " Referenz κ=1; Variante κ=" +
      String(kappa).replace(".", ",") + ". Abstand bei t=" +
      frame.t.toFixed(2).replace(".", ",") + ": " +
      frame.separation.toFixed(3).replace(".", ",") + " Modellkoordinaten.";
    description.textContent = "Zwei berechnete " + (mode === "central" ? "Zentralfeld-" : "Grenzfeld-") +
      "Trajektorien. Die Referenz und die Variante beginnen am gleichen Punkt. " +
      "Aktueller Zeitanteil " + percent + " Prozent; Abstand " +
      frame.separation.toFixed(3).replace(".", ",") + " Modellkoordinaten.";
  }
  function renderTracks() {
    syncSurface();
    drawGrid(document, part("grid"), comparison);
    if (mode === "boundary-factors") {
      for (const [path, points] of [["control-path", comparison.control],
        ["left-path", comparison.leftOnly], ["right-path", comparison.rightOnly]]) {
        part(path).setAttribute("d", pathData(points, comparison.domain));
      }
      const crossing = boundaryAt(factorKappa, BOUNDARY_CROSSING);
      const markers = part("crossing-markers");
      markers.replaceChildren();
      for (const [name, fill] of [["control", "#66d5e8"], ["leftOnly", "#ffb26b"], ["rightOnly", "#b79bff"]]) {
        const point = project(crossing.states[name], comparison.domain);
        markers.append(svgNode(document, "circle", { cx: point.x.toFixed(2), cy: point.y.toFixed(2),
          r: name === "rightOnly" ? 5 : 4, fill: name === "rightOnly" ? "none" : fill,
          stroke: fill, "stroke-width": name === "rightOnly" ? 2 : 1, opacity: .9 }));
      }
    } else {
      part("crossing-markers").replaceChildren();
      part("reference-path").setAttribute("d", pathData(comparison.reference, comparison.domain));
      part("selected-path").setAttribute("d", pathData(comparison.selected, comparison.domain));
    }
    renderFrame();
  }
  function onMode() {
    const next = modeSelect.value;
    if (!MODES.includes(next)) { modeSelect.value = mode; throw new RangeError("Unknown Field Difference mode"); }
    const nextComparison = next === "boundary-factors" ? buildBoundaryFactorComparison(factorKappa) : buildComparison(next, kappa);
    stopPlayback();
    mode = next;
    percent = 0;
    comparison = nextComparison;
    renderTracks();
  }
  function onKappa() {
    if (mode === "boundary-factors") return;
    if (!FIELD_PRESETS.some(value => String(value) === kappaSelect.value)) {
      kappaSelect.value = String(kappa);
      throw new RangeError("Unknown bounded Field Difference comparison");
    }
    const next = Number(kappaSelect.value);
    const nextComparison = buildComparison(mode, next);
    stopPlayback();
    kappa = next;
    comparison = nextComparison;
    renderTracks();
  }
  function onFactorKappa() {
    if (mode !== "boundary-factors") return;
    if (!BOUNDARY_FACTOR_PRESETS.some(value => String(value) === factorKappaSelect.value)) {
      factorKappaSelect.value = String(factorKappa);
      throw new RangeError("Unknown bounded boundary factor");
    }
    const next = Number(factorKappaSelect.value);
    const nextComparison = buildBoundaryFactorComparison(next);
    stopPlayback();
    factorKappa = next;
    comparison = nextComparison;
    renderTracks();
  }
  function onTime() {
    if (!/^(?:0|[1-9][0-9]?|100)$/.test(timeRange.value)) {
      timeRange.value = String(percent);
      throw new RangeError("Display step must be an integer from 0 to 100");
    }
    stopPlayback();
    percent = Number(timeRange.value);
    renderFrame();
  }
  function onStep() {
    stopPlayback();
    percent = Math.min(100, percent + 5);
    renderFrame();
  }
  function jumpTo(percentValue) {
    stopPlayback();
    if (mode !== "boundary-factors") return;
    percent = percentValue;
    renderFrame();
  }
  const onBefore = () => jumpTo(25);
  const onAfter = () => jumpTo(70);
  function reset() {
    stopPlayback();
    mode = "central";
    kappa = 1.4;
    factorKappa = 1;
    percent = 0;
    modeSelect.value = mode;
    kappaSelect.value = String(kappa);
    factorKappaSelect.value = String(factorKappa);
    comparison = buildComparison(mode, kappa);
    renderTracks();
  }
  function showBoundaryFactors() {
    stopPlayback();
    factorKappa = 1;
    factorKappaSelect.value = "1";
    modeSelect.value = "boundary-factors";
    onMode();
    jumpTo(70);
  }
  function tick(now) {
    if (!playing) return;
    if (startedAt === null) startedAt = now;
    percent = Math.min(100, startingPercent + Math.floor((now - startedAt) / 80));
    renderFrame();
    if (percent >= 100) stopPlayback();
    else frameId = view.requestAnimationFrame(tick);
  }
  function onPlay() {
    if (isReduced()) return;
    if (playing) { stopPlayback(); return; }
    if (percent >= 100) percent = 0;
    startingPercent = percent;
    startedAt = null;
    playing = true;
    readout.setAttribute("aria-live", "off");
    playButton.textContent = "Ⅱ Anhalten";
    frameId = view.requestAnimationFrame(tick);
  }
  function onMotionChange() {
    if (isReduced()) stopPlayback();
    playButton.disabled = isReduced();
    playButton.title = isReduced()
      ? "Reduzierte Bewegung: Modellzeit mit Regler oder Einzelschritt ändern"
      : "Nur nach eigenem Klick abspielen";
  }
  modeSelect.addEventListener("change", onMode);
  kappaSelect.addEventListener("change", onKappa);
  factorKappaSelect.addEventListener("change", onFactorKappa);
  timeRange.addEventListener("input", onTime);
  stepButton.addEventListener("click", onStep);
  part("before").addEventListener("click", onBefore);
  part("after").addEventListener("click", onAfter);
  resetButton.addEventListener("click", reset);
  playButton.addEventListener("click", onPlay);
  reducedMotion?.addEventListener?.("change", onMotionChange);
  onMotionChange();
  renderTracks();
  function pause() { stopPlayback(); }
  return Object.freeze({
    reset,
    pause,
    showBoundaryFactors,
    syncMotion: onMotionChange,
    destroy() {
      pause();
      reducedMotion?.removeEventListener?.("change", onMotionChange);
      modeSelect.removeEventListener("change", onMode);
      kappaSelect.removeEventListener("change", onKappa);
      factorKappaSelect.removeEventListener("change", onFactorKappa);
      timeRange.removeEventListener("input", onTime);
      stepButton.removeEventListener("click", onStep);
      part("before").removeEventListener("click", onBefore);
      part("after").removeEventListener("click", onAfter);
      resetButton.removeEventListener("click", reset);
      playButton.removeEventListener("click", onPlay);
      container.replaceChildren();
    }
  });
}

if (typeof window !== "undefined") {
  window.HALVETH_FIELD_UI = Object.freeze({ mount });
}
