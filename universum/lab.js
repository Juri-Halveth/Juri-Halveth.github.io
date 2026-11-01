(function () {
  "use strict";
  const byId = (id) => document.getElementById(id);
  const app = window.HALVETH_APP;
  const catalog = window.HALVETH_CATALOG;
  const panel = byId("labPanel");
  if (!app || !catalog) return;

  let atlasUI = null;
  if (window.HALVETH_ATLAS_UI) {
    const button = document.createElement("button");
    button.type = "button"; button.id = "atlasTab"; button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", "false"); button.setAttribute("aria-controls", "atlasView");
    button.textContent = "PRO ATLAS · Phase/Gate";
    panel.querySelector(".lab-tabs").appendChild(button);
    const view = document.createElement("div"); view.id = "atlasView"; view.setAttribute("role", "tabpanel");
    view.setAttribute("aria-labelledby", "atlasTab"); view.hidden = true;
    panel.appendChild(view);
    atlasUI = window.HALVETH_ATLAS_UI.mount(view);
  }
  const fieldTab = document.createElement("button");
  fieldTab.type = "button"; fieldTab.id = "fieldTab"; fieldTab.setAttribute("role", "tab");
  fieldTab.setAttribute("aria-selected", "false"); fieldTab.setAttribute("aria-controls", "fieldView");
  fieldTab.textContent = "FIELD · Trajektorien";
  panel.querySelector(".lab-tabs").appendChild(fieldTab);
  const fieldView = document.createElement("div"); fieldView.id = "fieldView";
  fieldView.setAttribute("role", "tabpanel"); fieldView.setAttribute("aria-labelledby", "fieldTab");
  fieldView.hidden = true; panel.appendChild(fieldView);
  let fieldController = null;
  let fieldLoading = false;
  let fieldPortalLaunch = false;

  let eco = null;
  let ecoRunning = false;
  let ecoProjection = "render";
  let lastEcoFrame = 0;
  let hiddenAt = null;
  let ledger = null;
  let ledgerBusy = false;
  let latestStateId = null;
  let branchCounter = 0;
  let ledgerRunNumber = 0;
  let endeck = null;
  let endeckLoading = false;
  let corridor = null;
  let corridorLoading = false;
  let countermodel = false;
  let missionState = null;
  let tab = "scarlet";
  let returnFocus = null;

  function labStatus(message) { app.setStatus(message); }
  function setTab(next) {
    if (tab === "red" && next !== "red") window.HALVETH_RED_UI?.pause();
    if (tab === "field" && next !== "field") fieldController?.pause();
    tab = next;
    byId("scarletTab").setAttribute("aria-selected", String(next === "scarlet"));
    byId("endeckTab").setAttribute("aria-selected", String(next === "endeck"));
    byId("perspectiveTab").setAttribute("aria-selected", String(next === "perspective"));
    byId("redRoomTab").setAttribute("aria-selected", String(next === "red"));
    byId("missionTab").setAttribute("aria-selected", String(next === "mission"));
    byId("atlasTab")?.setAttribute("aria-selected", String(next === "atlas"));
    fieldTab.setAttribute("aria-selected", String(next === "field"));
    byId("scarletView").hidden = next !== "scarlet";
    byId("endeckView").hidden = next !== "endeck";
    byId("perspectiveView").hidden = next !== "perspective";
    byId("redRoomView").hidden = next !== "red";
    byId("missionView").hidden = next !== "mission";
    if (byId("atlasView")) byId("atlasView").hidden = next !== "atlas";
    fieldView.hidden = next !== "field";
    if (next === "endeck") loadEndeck(); else if (next === "perspective") loadCorridor(); else if (next === "red") window.HALVETH_RED_UI?.activate(); else if (next === "mission") renderMission(); else if (next === "atlas") atlasUI?.activate(); else if (next === "field") loadField(); else renderEco();
  }
  async function loadField() {
    if (fieldController) {
      fieldController.syncMotion();
      if (fieldPortalLaunch) { fieldController.showBoundaryFactors(); fieldPortalLaunch = false; }
      return;
    }
    if (fieldLoading) return;
    fieldLoading = true;
    fieldView.textContent = "Gepinntes lokales Field-Difference-Modul wird geladen.";
    try {
      const module = await import("./field-ui.js");
      if (tab !== "field" || panel.hidden) { fieldView.textContent = "Field-Difference-Modul bereit. Tab erneut wählen."; return; }
      fieldController = module.mount(fieldView);
      if (fieldPortalLaunch) { fieldController.showBoundaryFactors(); fieldPortalLaunch = false; }
    } catch (error) {
      fieldView.textContent = "Field-Difference-Modul derzeit nicht verfügbar. Seite neu laden und erneut versuchen.";
      console.error("Field Difference module load failed:", error);
    } finally { fieldLoading = false; }
  }
  function openLab(trigger = byId("labButton")) {
    app.cancelWarp();
    window.HALVETH_SOURCE_UI?.close();
    returnFocus = trigger?.isConnected ? trigger : byId("labButton");
    panel.hidden = false;
    byId("labButton").setAttribute("aria-expanded", "true");
    app.closeTrace();
    [byId("spaceStage"), byId("inspectPanel"), document.querySelector(".topbar"), document.querySelector(".side-rail"), document.querySelector(".statusbar")]
      .forEach((element) => { element.inert = true; });
    if (!eco) resetEco();
    if (!missionState && !byId("missionTitle").value) {
      const selected = app.getProject();
      if (selected) byId("missionTitle").value = selected.title + " erkunden";
    }
    setTab(tab);
    labStatus("Lokale Modellkerne bereit. Alle Schritte bleiben im Browser.");
    byId("labTitle").focus();
  }
  function closeLab() {
    const shouldRestore = !panel.hidden && panel.contains(document.activeElement);
    window.HALVETH_RED_UI?.pause();
    fieldController?.pause();
    fieldPortalLaunch = false;
    panel.hidden = true;
    [byId("spaceStage"), byId("inspectPanel"), document.querySelector(".topbar"), document.querySelector(".side-rail"), document.querySelector(".statusbar")]
      .forEach((element) => { element.inert = false; });
    byId("labButton").setAttribute("aria-expanded", "false");
    ecoRunning = false;
    byId("ecoPlay").textContent = "▶ Starten";
    lastEcoFrame = 0;
    if (shouldRestore) {
      const target = returnFocus?.isConnected && !returnFocus.hidden ? returnFocus : byId("labButton");
      target.focus();
    }
    returnFocus = null;
  }
  byId("labButton").addEventListener("click", (event) => panel.hidden ? openLab(event.currentTarget) : closeLab());
  window.HALVETH_LAB = Object.freeze({
    openField(trigger) {
      if (!trigger?.isConnected || !panel.hidden) return false;
      tab = "field";
      fieldPortalLaunch = true;
      openLab(trigger);
      return true;
    }
  });
  byId("closeLab").addEventListener("click", closeLab);
  panel.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const items = Array.from(panel.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]"))
      .filter((item) => item.getClientRects().length > 0);
    if (items.length === 0) return;
    if (event.shiftKey && (document.activeElement === items[0] || document.activeElement === byId("labTitle"))) {
      items.at(-1).focus(); event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
      items[0].focus(); event.preventDefault();
    }
  });
  byId("scarletTab").addEventListener("click", () => setTab("scarlet"));
  byId("endeckTab").addEventListener("click", () => setTab("endeck"));
  byId("perspectiveTab").addEventListener("click", () => setTab("perspective"));
  byId("redRoomTab").addEventListener("click", () => setTab("red"));
  byId("missionTab").addEventListener("click", () => setTab("mission"));
  byId("atlasTab")?.addEventListener("click", () => setTab("atlas"));
  fieldTab.addEventListener("click", () => setTab("field"));

  function resetEco() {
    if (!window.GStarLiving) {
      byId("ecoSnapshot").textContent = "SCARLET Live Core konnte nicht geladen werden.";
      return;
    }
    const profiles = catalog.categories.map((category) => ({
      id: category.id, label: category.short, role: category.description
    }));
    eco = window.GStarLiving.create(profiles, { seed: 3491 });
    ecoRunning = false; byId("ecoPlay").textContent = "▶ Starten"; lastEcoFrame = 0;
    renderEco(); labStatus("SCARLET Zellökologie auf festen Seed 3491 zurückgesetzt.");
  }
  function drawEco(snapshot) {
    const canvas = byId("ecologyCanvas");
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const w = rect.width, h = rect.height;
    ctx.fillStyle = "#090d17"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(117,179,190,.1)"; ctx.lineWidth = 1;
    for (let i = 1; i < 8; i += 1) { const x = i * w / 8; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let i = 1; i < 5; i += 1) { const y = i * h / 5; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    const scaleX = (x) => w / 2 + x / snapshot.world.width * (w - 95);
    const scaleY = (y) => h / 2 - y / snapshot.world.height * (h - 55);
    for (const signal of snapshot.signals) {
      const from = snapshot.nodes.find((n) => n.id === signal.source);
      const to = snapshot.nodes.find((n) => n.id === signal.target);
      if (!from || !to) continue;
      ctx.strokeStyle = "rgba(239,117,126,.36)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(scaleX(from.position.x), scaleY(from.position.y));
      ctx.lineTo(scaleX(to.position.x), scaleY(to.position.y)); ctx.stroke();
    }
    for (const node of snapshot.nodes) {
      const x = scaleX(node.position.x), y = scaleY(node.position.y);
      const radius = node.depth ? 7 : 11;
      const color = node.phase === "REST" ? "#83d6df" : node.phase === "CORE" ? "#f2c587" : "#ef656f";
      ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#10131c"; ctx.font = "bold 10px Consolas, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(node.morphology.symbol, x, y + .5);
      ctx.fillStyle = "#c4d0dc"; ctx.font = "10px Consolas, monospace";
      ctx.fillText(node.label, x, y + radius + 15);
    }
  }
  function renderEco() {
    if (!eco || panel.hidden || tab !== "scarlet") return;
    const snapshot = eco.snapshot(ecoProjection);
    drawEco(snapshot);
    byId("ecoTime").textContent = snapshot.modelMs.toLocaleString("de-DE") + " ms";
    byId("ecoCells").textContent = String(snapshot.counts.cells);
    byId("ecoContacts").textContent = String(snapshot.counts.contacts);
    byId("ecoSignals").textContent = String(snapshot.counts.emitted);
    const omitted = ecoProjection === "render" ? "Ereignisdetails ausgelassen" : snapshot.events.length + " aktuell erhaltene Ereignisse";
    byId("ecoSnapshot").textContent = "Projektion " + ecoProjection.toUpperCase() + " · " + omitted + " · Modellschritt " + snapshot.timing.stepMs + " ms · erhaltene Sequenz " + snapshot.coverage.firstSequence + "–" + snapshot.coverage.lastSequence + " · Anzeigelücke " + snapshot.timing.displayGapMs + " ms.";
  }
  byId("ecoPlay").addEventListener("click", () => {
    if (!eco) resetEco(); if (!eco) return;
    ecoRunning = !ecoRunning; lastEcoFrame = 0;
    byId("ecoPlay").textContent = ecoRunning ? "❚❚ Pausieren" : "▶ Starten";
    labStatus(ecoRunning ? "Zellökologie läuft lokal." : "Zellökologie pausiert.");
  });
  byId("ecoStep").addEventListener("click", () => {
    if (!eco) resetEco(); if (!eco) return;
    eco.advance(500); renderEco(); labStatus("500 ms Modellzeit ausgeführt.");
  });
  byId("ecoReset").addEventListener("click", resetEco);
  byId("ecoProjection").addEventListener("click", () => {
    ecoProjection = ecoProjection === "render" ? "full" : "render";
    byId("ecoProjection").setAttribute("aria-pressed", String(ecoProjection === "full"));
    byId("ecoProjection").textContent = ecoProjection === "render" ? "Full Snapshot" : "Render Snapshot";
    renderEco();
  });
  function ecologyFrame(now) {
    if (ecoRunning && eco && !panel.hidden && tab === "scarlet") {
      if (lastEcoFrame) eco.advance(Math.min(250, Math.max(0, now - lastEcoFrame)));
      lastEcoFrame = now; renderEco();
    } else lastEcoFrame = 0;
    requestAnimationFrame(ecologyFrame);
  }
  requestAnimationFrame(ecologyFrame);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (eco && ecoRunning) {
        hiddenAt = Date.now(); ecoRunning = false; lastEcoFrame = 0;
        byId("ecoPlay").textContent = "▶ Starten";
      }
    } else if (hiddenAt !== null && eco) {
      eco.gap(Math.max(0, Date.now() - hiddenAt)); hiddenAt = null;
      renderEco(); labStatus("Anzeigeunterbrechung als Lücke erfasst; Modell pausiert.");
    }
  });
  window.addEventListener("resize", () => { if (!panel.hidden && tab === "scarlet") renderEco(); });

  const ledgerBlock = panel.querySelector(".ledger-block");
  const ledgerInputs = document.createElement("div");
  ledgerInputs.className = "ledger-inputs";
  ledgerInputs.innerHTML = '<label for="ledgerSeedLabel">Lokaler Seed-Name</label><input id="ledgerSeedLabel" type="text" value="NETZ"><label for="ledgerSeedText">Ausgangstext · höchstens 8192 UTF-8-Bytes</label><textarea id="ledgerSeedText" rows="3">Ein lokaler Ausgangszustand mit unbekannter Vorgeschichte.</textarea><label for="ledgerVariantText">Nächste Variante · höchstens 2048 UTF-8-Bytes</label><textarea id="ledgerVariantText" rows="3">Eine lokal abgeleitete Variante mit erhaltener Herkunft.</textarea>';
  ledgerBlock.insertBefore(ledgerInputs, ledgerBlock.querySelector(".lab-controls"));
  byId("ledgerSeed").textContent = "Neuen Seed setzen";
  const ledgerExport = document.createElement("button");
  ledgerExport.type = "button"; ledgerExport.id = "ledgerExport"; ledgerExport.textContent = "Ledger-JSON herunterladen";
  ledgerExport.disabled = true;
  ledgerBlock.querySelector(".lab-controls").appendChild(ledgerExport);
  const ledgerHistory = document.createElement("div");
  ledgerHistory.id = "ledgerHistory"; ledgerHistory.className = "ledger-history";
  ledgerBlock.appendChild(ledgerHistory);
  function checkedLedgerText(value, maxBytes, label) {
    const bytes = new TextEncoder().encode(value).length;
    if (!value.trim() || bytes > maxBytes || /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value)) {
      throw new Error(label + " benötigt Text mit höchstens " + maxBytes + " UTF-8-Bytes und gültigem Unicode; aktuell " + bytes + " Bytes.");
    }
    return value;
  }
  function updateLedgerStatus(extra) {
    if (!ledger) { byId("ledgerStatus").textContent = "Noch kein lokaler Textzustand."; return; }
    const exported = ledger.export();
    const count = exported.projection.counts;
    byId("ledgerStatus").textContent = (extra ? extra + " · " : "") + exported.runId + " · " + count.events + " Ereignisse · " + count.states + " Zustände · " + count.materializations + " Materialisierungen · " + count.observations + " Beobachtungen · Kopf " + String(exported.headDigest).slice(0, 21) + "…";
    ledgerExport.disabled = false;
    while (ledgerHistory.firstChild) ledgerHistory.removeChild(ledgerHistory.firstChild);
    const states = ledger.view().states;
    const heading = document.createElement("small");
    heading.textContent = "Letzte " + Math.min(6, states.length) + " von " + states.length + " Textzuständen · vollständiger Stand im lokalen JSON";
    ledgerHistory.appendChild(heading);
    for (const state of states.slice(-6)) {
      const row = document.createElement("article");
      const title = document.createElement("strong"); title.textContent = state.id + " · " + state.phase;
      const text = document.createElement("p"); text.textContent = state.text;
      const parent = document.createElement("small"); parent.textContent = state.parents.length ? "Elternbezug: " + state.parents.map((item) => item.id).join(", ") : "Lokaler Ausgangsanker · ursprüngliche Vorgeschichte unbekannt";
      row.append(title, text, parent); ledgerHistory.appendChild(row);
    }
  }
  async function ledgerAction(task) {
    if (ledgerBusy) return;
    ledgerBusy = true;
    try { await task(); }
    catch (error) {
      if (ledger) updateLedgerStatus("Operation unterbrochen: " + error.message + " · aktueller Ledger-Stand");
      else byId("ledgerStatus").textContent = "Lokale Operation fehlgeschlagen: " + error.message;
    }
    finally { ledgerBusy = false; }
  }
  byId("ledgerSeed").addEventListener("click", () => ledgerAction(async () => {
    if (!window.GStar) throw new Error("GStar nicht geladen");
    const label = checkedLedgerText(byId("ledgerSeedLabel").value, 160, "Seed-Name");
    const text = checkedLedgerText(byId("ledgerSeedText").value, 8192, "Ausgangstext");
    const runNumber = ledgerRunNumber + 1;
    const nextLedger = window.GStar.create({ runId: "NETZ_STARSHIP_" + runNumber });
    await nextLedger.dispatch({ type: "SEED", label, text });
    const seedStateId = nextLedger.view().states[0].id;
    await nextLedger.dispatch({ type: "MATERIALIZE", stateId: seedStateId });
    await nextLedger.dispatch({ type: "OBSERVE", stateId: seedStateId });
    ledger = nextLedger; ledgerRunNumber = runNumber; branchCounter = 0; latestStateId = seedStateId;
    byId("ledgerBranch").disabled = false; byId("ledgerSnapshot").disabled = false; byId("ledgerVerify").disabled = false;
    updateLedgerStatus("Seed beobachtet");
  }));
  byId("ledgerBranch").addEventListener("click", () => ledgerAction(async () => {
    if (!ledger || !latestStateId) return;
    const text = checkedLedgerText(byId("ledgerVariantText").value, 2048, "Variante");
    const before = ledger.view();
    const parent = before.states.find((state) => state.id === latestStateId);
    if (!parent) throw new Error("Aktueller Elternzustand fehlt");
    const needed = parent.text === text ? 1 : 2;
    const free = window.GStar.LIMITS.maxEvents - before.counts.events;
    if (free < needed) {
      updateLedgerStatus("Variante nicht angehängt: " + needed + " freie Eventplätze nötig, " + free + " verfügbar");
      return;
    }
    const proposal = await ledger.dispatch({ type: "PROPOSE", parents: [latestStateId], mode: "DERIVE_CHILD", text, trigger: "EXPLIZITER_UI_KLICK" });
    if (proposal.outcome === "NO_CHANGE") {
      updateLedgerStatus("Gleicher Text: NO_CHANGE-Event erfasst; kein neuer Zustand");
      return;
    }
    if (proposal.outcome !== "CANDIDATE_PROPOSED") throw new Error("Unerwartetes GStar-Outcome: " + proposal.outcome);
    latestStateId = ledger.view().states.at(-1).id;
    await ledger.dispatch({ type: "MATERIALIZE", stateId: latestStateId });
    branchCounter += 1;
    updateLedgerStatus("Variante materialisiert");
  }));
  byId("ledgerSnapshot").addEventListener("click", () => ledgerAction(async () => {
    if (!ledger) return;
    await ledger.dispatch({ type: "SNAPSHOT" }); updateLedgerStatus("Snapshot des bisherigen Präfixes erfasst");
  }));
  byId("ledgerVerify").addEventListener("click", () => ledgerAction(async () => {
    if (!ledger) return;
    const verified = await window.GStar.verify(ledger.export());
    updateLedgerStatus(verified.valid ? "Replay und Selbstkonsistenz geprüft" : "Replay offen");
  }));
  ledgerExport.addEventListener("click", () => {
    if (!ledger) return;
    const blob = new Blob([JSON.stringify(ledger.export(), null, 2) + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = ledger.export().runId + ".json";
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 5000);
    updateLedgerStatus("Lokaler JSON-Download angeboten; bitte vor externer Verwendung prüfen");
  });

  async function loadEndeck() {
    if (endeck) { renderEndeck(); return; }
    if (endeckLoading) return;
    endeckLoading = true;
    try {
      endeck = await import("./vendor/endeck/model.mjs");
      renderEndeck();
    } catch (error) {
      byId("endeckReadout").textContent = "ENDECK-Modul derzeit nicht verfügbar. Seite neu laden und erneut versuchen.";
      console.error("ENDECK module load failed:", error);
    } finally { endeckLoading = false; }
  }
  function svgElement(name, attributes) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attributes).forEach(([key, value]) => el.setAttribute(key, String(value)));
    return el;
  }
  function clear(element) { while (element.firstChild) element.removeChild(element.firstChild); }
  function paintPoints(target, points, tone) {
    clear(target);
    const x = (value) => 150 + value * 47;
    const y = (value) => 115 - value * 47;
    for (let step = -2; step <= 2; step += 1) {
      target.appendChild(svgElement("line", { x1: x(step), y1: 20, x2: x(step), y2: 210, stroke: "#283244", "stroke-width": 1 }));
      target.appendChild(svgElement("line", { x1: 30, y1: y(step), x2: 270, y2: y(step), stroke: "#283244", "stroke-width": 1 }));
    }
    const poly = svgElement("polyline", { points: points.map((p) => x(p.x) + "," + y(p.y)).join(" ") + " " + x(points[0].x) + "," + y(points[0].y), fill: "none", stroke: tone, "stroke-width": 1.8, opacity: .65 });
    target.appendChild(poly);
    for (const p of points) {
      target.appendChild(svgElement("circle", { cx: x(p.x), cy: y(p.y), r: 9, fill: tone, stroke: "#070b14", "stroke-width": 2 }));
      const text = svgElement("text", { x: x(p.x), y: y(p.y) - 17, fill: "#f0f1f4", "text-anchor": "middle", "font-size": 13, "font-family": "Consolas, monospace" });
      text.textContent = p.id; target.appendChild(text);
    }
  }
  function renderEndeck() {
    if (!endeck || panel.hidden || tab !== "endeck") return;
    const mode = byId("endeckMode").value;
    const tilt = Number(byId("endeckTilt").value);
    const t = Number(byId("endeckTime").value) / 100;
    const source = endeck.source(mode, t);
    const observed = source.map((point) => endeck.project(point, tilt));
    paintPoints(byId("endeckSource"), source, "#ee777c");
    paintPoints(byId("endeckObserved"), observed, "#83d6df");
    byId("tiltValue").textContent = tilt + "°";
    byId("endeckTimeValue").textContent = t.toFixed(2);
    const sourceDistinct = endeck.distinct(source, ["x", "y", "z"]);
    const visibleDistinct = endeck.distinct(observed, ["x", "y"]);
    byId("endeckReadout").textContent = "Identitäten A/B/C/D · Quellpunkte unterscheidbar: " + sourceDistinct + "/4 · in dieser Projektion unterscheidbar: " + visibleDistinct + "/4 · Blickwinkel " + tilt + "° · Operator " + mode.toUpperCase() + ". Pixelgleichheit allein sagt nichts über Identität.";
  }
  ["endeckMode", "endeckTilt", "endeckTime"].forEach((id) => byId(id).addEventListener("input", renderEndeck));

  async function loadCorridor() {
    if (corridor) { renderCorridor(); return; }
    if (corridorLoading) return;
    corridorLoading = true;
    try {
      corridor = await import("./vendor/perspective/source-model.mjs");
      renderCorridor();
    } catch (error) {
      byId("corridorReadout").textContent = "Perspektivmodell derzeit nicht verfügbar. Seite neu laden und erneut versuchen.";
      console.error("Perspective model load failed:", error);
    } finally { corridorLoading = false; }
  }
  function drawCorridorView(target, points, selectedId) {
    clear(target);
    target.appendChild(svgElement("line", { x1: 130, y1: 8, x2: 130, y2: 182, stroke: "#263244", "stroke-width": 1 }));
    target.appendChild(svgElement("line", { x1: 8, y1: 95, x2: 252, y2: 95, stroke: "#263244", "stroke-width": 1 }));
    for (const point of points) {
      if (point.id === selectedId) continue;
      target.appendChild(svgElement("circle", {
        cx: 130 + point.x * 52, cy: 95 - point.y * 52, r: 1.6,
        fill: "#80cbd4", opacity: Math.max(.24, point.brightness * .65).toFixed(2)
      }));
    }
    const selected = points.find((point) => point.id === selectedId);
    if (selected) {
      const cx = 130 + selected.x * 52, cy = 95 - selected.y * 52;
      target.appendChild(svgElement("circle", { cx, cy, r: 7, fill: "none", stroke: "#f2c587", "stroke-width": 2 }));
      target.appendChild(svgElement("circle", { cx, cy, r: 2.5, fill: "#f2c587" }));
      const label = svgElement("text", { x: cx + 10, y: cy - 8, fill: "#f2c587", "font-size": 11, "font-family": "Consolas, monospace" });
      label.textContent = "#" + selectedId; target.appendChild(label);
    }
  }
  function renderCorridor() {
    if (!corridor || panel.hidden || tab !== "perspective") return;
    const time = Number(byId("corridorTime").value);
    const selectedId = Number(byId("corridorPoint").value);
    const state = corridor.makeState(time);
    const targets = { eye: "corridorEye", vortex: "corridorVortex", corridor: "corridorCorridor", thrust: "corridorThrust" };
    let mismatches = 0;
    for (const view of corridor.VIEW_NAMES) {
      const expected = corridor.observe(state, view);
      const observed = countermodel ? corridor.independentCountermodel(state, view) : expected;
      if (countermodel) {
        const byIdentity = new Map(expected.map((point) => [point.id, point]));
        mismatches += observed.filter((point) => {
          const bound = byIdentity.get(point.id);
          return Math.hypot(point.x - bound.x, point.y - bound.y, point.depth - bound.depth) > 1e-9;
        }).length;
      }
      drawCorridorView(byId(targets[view]), observed, selectedId);
    }
    byId("corridorTimeValue").textContent = time.toFixed(2);
    byId("corridorPointValue").textContent = String(selectedId);
    const point = state.points[selectedId];
    byId("corridorReadout").textContent = "Quelle #" + selectedId + " (x " + point.x.toFixed(3) + ", y " + point.y.toFixed(3) + ", z " + point.z.toFixed(3) + ") · 240 stabile IDs · 4 Projektionen · " +
      (countermodel ? mismatches + "/960 ID-Ort-Zuordnungen abweichend. Ähnliches Bild, andere Identität." : "0/960 ID-Ort-Zuordnungen abweichend im selben synthetischen Quellmodell.");
  }
  ["corridorTime", "corridorPoint"].forEach((id) => byId(id).addEventListener("input", renderCorridor));
  byId("countermodelButton").addEventListener("click", () => {
    countermodel = !countermodel;
    byId("countermodelButton").setAttribute("aria-pressed", String(countermodel));
    byId("countermodelButton").textContent = countermodel ? "Gebundene Projektionen zeigen" : "Unabhängiges Gegenmodell zeigen";
    renderCorridor();
  });

  function stageLabel(stage) { return ({ NEW: "Neu", ACTIVE: "In Arbeit", DONE: "Erledigt" })[stage] || "—"; }
  function renderMission(message) {
    const api = window.HalvethMissions;
    if (!api) { byId("missionResult").textContent = "Missionsmodell nicht geladen."; return; }
    const preview = missionState ? api.previewPair(missionState) : null;
    byId("missionName").textContent = preview?.mission.title || "Noch kein Auftrag";
    byId("missionStage").textContent = preview ? stageLabel(preview.mission.stage) : "—";
    byId("counterName").textContent = preview?.counterpart?.title || "Separat anlegen";
    byId("counterStage").textContent = preview?.counterpart ? stageLabel(preview.counterpart.stage) : "—";
    byId("missionCreate").disabled = Boolean(preview);
    byId("missionTitle").disabled = Boolean(preview);
    byId("missionCounter").disabled = !preview || preview.revision !== 0;
    byId("missionStart").disabled = !preview || preview.revision !== 1;
    byId("missionResolve").disabled = !preview || preview.revision !== 2;
    byId("missionExport").disabled = !preview;
    byId("missionResult").textContent = message || (preview ?
      "Lokale Revision " + preview.revision + " · Relation " + preview.relation + " · nächster Schritt " + (preview.nextAction || "keiner") + ". Kein Rachel-Speicher verändert." :
      "Flüchtige lokale Sitzung. Kein Rachel-Speicher und kein Unternehmenssystem verbunden.");
    const list = byId("missionJournal");
    while (list.firstChild) list.removeChild(list.firstChild);
    if (missionState) {
      missionState.journal.forEach((entry) => {
        const li = document.createElement("li");
        li.textContent = String(entry.sequence).padStart(2, "0") + " · " + entry.code + " · " + entry.ids.join(" + ");
        list.appendChild(li);
      });
    } else { const li = document.createElement("li"); li.textContent = "Noch kein Ereignis."; list.appendChild(li); }
  }
  function missionAction(action, message) {
    try {
      missionState = window.HalvethMissions.dispatch(missionState, action);
      renderMission(message);
    } catch (error) { renderMission("Lokale Aktion verworfen: " + error.message); }
  }
  byId("missionCreate").addEventListener("click", () => {
    const title = byId("missionTitle").value.trim();
    if (!title) { renderMission("Bitte zuerst einen Auftrag benennen."); return; }
    const selected = app.getProject();
    try {
      missionState = window.HalvethMissions.create(selected?.id || "starship-local", title);
      renderMission("Auftrag als eigener Datensatz angelegt. Gegenauftrag bleibt separat.");
    } catch (error) { renderMission("Auftrag verworfen: " + error.message); }
  });
  byId("missionCounter").addEventListener("click", () => {
    if (!missionState) return;
    missionAction({ type: "CREATE_COUNTERPART", missionId: "P-000001" }, "Gegenauftrag separat angelegt und wechselseitig verknüpft. Der Auftragstitel bleibt vollständig erhalten.");
  });
  byId("missionStart").addEventListener("click", () => missionAction({ type: "START_PAIR", missionId: "P-000001", counterpartId: "C-000002" }, "Beide Datensätze in einem lokalen Schritt auf In Arbeit gesetzt."));
  byId("missionResolve").addEventListener("click", () => missionAction({ type: "RESOLVE_PAIR", missionId: "P-000001", counterpartId: "C-000002" }, "Paarausgleich: beide Erledigt; Journalereignis angehängt; nichts gelöscht."));
  byId("missionRotate").addEventListener("click", () => {
    const rotated = byId("missionBoard").classList.toggle("rotated");
    byId("missionRotate").setAttribute("aria-pressed", String(rotated));
    renderMission(rotated ? "180° Darstellungsansicht. Daten, Status und Reihenfolge bleiben unverändert." : undefined);
  });
  byId("missionExport").addEventListener("click", () => {
    if (!missionState) return;
    const blob = new Blob([JSON.stringify(missionState, null, 2) + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "starship-mission-session.json";
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 5000);
    renderMission("JSON-Download angeboten. Die Datei ist erst nach Prüfung außerhalb des Browsers ein Backup.");
  });
})();
