(function () {
  "use strict";
  const byId = (id) => document.getElementById(id);
  const leftGraph = byId("redLeftGraph");
  const rightGraph = byId("redRightGraph");
  let model = null;
  let loading = null;
  let selection = null;
  let timer = null;

  function svg(name, attributes) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  }
  function empty(element) { while (element.firstChild) element.removeChild(element.firstChild); }
  function tickText(tick) { return "T" + (tick < 0 ? "−" + Math.abs(tick) : tick > 0 ? "+" + tick : "0"); }
  function status(message) { window.HALVETH_APP?.setStatus(message); }
  function pause() {
    if (timer) clearInterval(timer);
    timer = null;
    byId("redPlay").textContent = "▶ Ab hier abspielen";
  }
  function graph(element, frame, nodes) {
    empty(element);
    const positions = {A: [35, 85], B: [108, 40], C: [108, 130], D: [225, 25], E: [225, 85], F: [225, 145]};
    const active = new Set(frame.runtime.copyPositions);
    const arrowId = element.id + "Arrow";
    const defs = svg("defs", {}), marker = svg("marker", {id: arrowId, markerWidth: 8, markerHeight: 8, refX: 7, refY: 4, orient: "auto", markerUnits: "userSpaceOnUse"});
    marker.appendChild(svg("path", {d: "M0 0 L8 4 L0 8 Z", fill: "#8d9aa9"}));
    defs.appendChild(marker); element.appendChild(defs);
    nodes.forEach((node) => node.targets.forEach((target) => {
      const [x1, y1] = positions[node.id], [x2, y2] = positions[target];
      const dx = x2 - x1, dy = y2 - y1, length = Math.hypot(dx, dy);
      const ux = dx / length, uy = dy / length;
      element.appendChild(svg("line", {x1: x1 + ux * 15, y1: y1 + uy * 15, x2: x2 - ux * 17, y2: y2 - uy * 17,
        stroke: active.has(node.id) && active.has(target) ? "#f2c587" : "#596473", "stroke-width": 2, opacity: .7,
        "marker-end": "url(#" + arrowId + ")"}));
    }));
    nodes.forEach((node) => {
      const [cx, cy] = positions[node.id];
      const isActive = active.has(node.id);
      element.appendChild(svg("circle", {cx, cy, r: isActive ? 12 : 9, fill: isActive ? "#ed646b" : "#182330", stroke: isActive ? "#ffd6d4" : "#7892a1", "stroke-width": 2}));
      const label = svg("text", {x: cx, y: cy + 4, fill: "#fff", "font-size": 11, "font-family": "Consolas, monospace", "text-anchor": "middle"});
      label.textContent = node.id;
      element.appendChild(label);
    });
  }
  function facts(element, frame) {
    empty(element);
    const items = [
      ["ROLLEN IM RAUM", frame.fictionalRoles.inRoom],
      ["ROLLEN FREI", frame.fictionalRoles.free],
      ["VORLAGEN", frame.data.archivedTemplates],
      ["ECHO-RECORDS", frame.data.publicEchoes],
      ["AKTIVE KOPIEN", frame.runtime.activeCopies],
      ["TRÄGER / AUTORITÄT", (frame.runtime.carrierAvailable ? "ja" : "nein") + " / " + (frame.runtime.authorityAvailable ? "ja" : "nein")]
    ];
    items.forEach(([name, value]) => {
      const row = document.createElement("div");
      const dt = document.createElement("dt"), dd = document.createElement("dd");
      dt.textContent = name; dd.textContent = String(value);
      row.append(dt, dd); element.appendChild(row);
    });
  }
  function render() {
    if (!model || !selection) return;
    const left = model.view(selection);
    const right = model.view(model.createSelection({scenarioId: selection.compareId, compareId: selection.scenarioId, tick: selection.tick}));
    const labels = new Map(model.SCENARIO_CHOICES.map((choice) => [choice.id, choice.label]));
    byId("redScenario").value = selection.scenarioId;
    byId("redCompare").value = selection.compareId;
    byId("redTick").value = String(selection.tick);
    byId("redTickLabel").textContent = tickText(selection.tick);
    byId("redLeftTitle").textContent = labels.get(selection.scenarioId);
    byId("redRightTitle").textContent = labels.get(selection.compareId);
    graph(leftGraph, left.selectedFrame, left.graph.nodes);
    graph(rightGraph, right.selectedFrame, right.graph.nodes);
    facts(byId("redLeftFacts"), left.selectedFrame);
    facts(byId("redRightFacts"), right.selectedFrame);
    byId("redStep").disabled = selection.tick === model.MODEL_TICKS.at(-1);
    const firstInternal = left.comparison.firstInternalDivergenceTick;
    const firstEcho = left.comparison.firstEchoDivergenceTick;
    byId("redComparison").textContent =
      "Gleiche Echozahl: " + (left.comparison.samePublicEchoes ? "ja" : "nein") +
      " · gleiche aktive Kopienzahl: " + (left.comparison.sameActiveCopies ? "ja" : "nein") +
      " · erste interne Abweichung: " + (firstInternal === null ? "keine im Modellfenster" : tickText(firstInternal)) +
      " · erste Echo-Abweichung: " + (firstEcho === null ? "keine im Modellfenster" : tickText(firstEcho)) +
      ". Beide Seiten stammen aus demselben fiktionalen Modell bei " + tickText(selection.tick) + "; gleiche Echos belegen keine gleiche Laufzeit. " + left.selectedFrame.runtime.challenge.label;
  }
  function act(action) { selection = model.reduceSelection(selection, action); render(); }
  function activate() {
    if (model) { render(); return; }
    if (!loading) loading = import("./red-room.mjs").then((module) => {
      model = module;
      selection = model.createSelection();
      render();
      status("Fiktionales Red-Room-Modell lokal geladen. Acht feste Modellticks.");
    }).catch((error) => {
      byId("redComparison").textContent = "Das lokale Modell konnte nicht geladen werden. Bitte über START.cmd öffnen.";
      console.error("Red Room model load failed:", error);
      loading = null;
    });
  }
  byId("redScenario").addEventListener("change", (event) => { if (model) { pause(); act({type: "SELECT_SCENARIO", scenarioId: event.target.value}); } });
  byId("redCompare").addEventListener("change", (event) => { if (model) { pause(); act({type: "SELECT_COMPARISON", compareId: event.target.value}); } });
  byId("redTick").addEventListener("input", (event) => { if (model) { pause(); act({type: "SET_TICK", tick: Number(event.target.value)}); } });
  byId("redStep").addEventListener("click", () => { if (model && selection.tick < model.MODEL_TICKS.at(-1)) { pause(); act({type: "STEP", direction: 1}); } });
  byId("redReset").addEventListener("click", () => { if (model) { pause(); act({type: "SET_TICK", tick: model.MODEL_TICKS[0]}); } });
  byId("redPlay").addEventListener("click", () => {
    if (!model) return;
    if (timer) { pause(); return; }
    if (selection.tick === model.MODEL_TICKS.at(-1)) act({type: "SET_TICK", tick: model.MODEL_TICKS[0]});
    byId("redPlay").textContent = "❚❚ Pausieren";
    timer = setInterval(() => {
      if (selection.tick === model.MODEL_TICKS.at(-1)) { pause(); return; }
      act({type: "STEP", direction: 1});
      if (selection.tick === model.MODEL_TICKS.at(-1)) pause();
    }, document.getElementById("appShell").classList.contains("reduced-motion") ? 1200 : 850);
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });
  window.HALVETH_RED_UI = {activate, pause};
})();
