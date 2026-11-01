/* ENDECK cockpit: local, source-bound geometric projection; no external action path. */
(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else {
    root.HALVETH_ENDECK_COCKPIT = api;
    if (typeof document === "object") api.mount(root, document);
  }
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";
  const BOUND_IDS = ["A", "B", "C", "D"];
  const SVG_NS = "http://www.w3.org/2000/svg";

  function derive(model, mode, time, angle) {
    if (!model || !Array.isArray(model.MODES) || !model.MODES.includes(mode) ||
      !Number.isFinite(time) || time < 0 || time > 1 ||
      !Number.isFinite(angle) || angle < 0 || angle > 80) throw new RangeError("Invalid ENDECK projection input");
    const source = model.source(mode, time).map((point) => ({ id: point.id, x: point.x, y: point.y, z: point.z }));
    if (source.length !== 4 || source.some((point, index) => point.id !== BOUND_IDS[index])) throw new Error("ENDECK source IDs changed");
    const observed = source.map((point) => model.project(point, angle));
    const groups = [];
    const byPosition = new Map();
    for (const point of observed) {
      const key = (point.x === 0 ? 0 : point.x) + "|" + (point.y === 0 ? 0 : point.y);
      let group = byPosition.get(key);
      if (!group) {
        group = { x: point.x, y: point.y, ids: [] };
        byPosition.set(key, group); groups.push(group);
      }
      group.ids.push(point.id);
    }
    return {
      mode, time, angle, source, observed, groups,
      sourceDistinct: model.distinct(source, ["x", "y", "z"]),
      observedDistinct: model.distinct(observed, ["x", "y"])
    };
  }

  function validatePathPair(state, pair) {
    if (!state || state.mode !== "history" || !pair || pair.kind !== "ENDECK_GEOMETRIC_PATH_PAIR" ||
      pair.modelMode !== "history" || pair.timeBasis !== "NORMALIZED_MODEL_PARAMETER" ||
      pair.claimCeiling !== "LOCAL_ENDECK_GEOMETRIC_PATH_COUNTERMODEL_ONLY" ||
      pair.t !== state.time || pair.angleDegrees !== state.angle ||
      !Array.isArray(pair.ids) || pair.ids.length !== 4 || pair.ids.some((id, index) => id !== BOUND_IDS[index]) ||
      !pair.straight || !pair.arc || !pair.endpointAgreement?.atZero?.source ||
      !pair.endpointAgreement?.atZero?.projection || !pair.endpointAgreement?.atOne?.source ||
      !pair.endpointAgreement?.atOne?.projection || !pair.difference ||
      !Number.isFinite(pair.difference.maxSourceDistance) || pair.difference.maxSourceDistance < 0 ||
      !Number.isFinite(pair.difference.maxProjectedDistance) || pair.difference.maxProjectedDistance < 0 ||
      typeof pair.difference.precisionLimited !== "boolean") throw new TypeError("ENDECK path pair is not bound to the current history view");
    for (const [sourcePoints, observedPoints] of [[pair.straight.source, pair.straight.projection], [pair.arc.source, pair.arc.projection]]) {
      if (!Array.isArray(sourcePoints) || !Array.isArray(observedPoints) ||
        sourcePoints.length !== 4 || observedPoints.length !== 4 ||
        sourcePoints.some((point, index) => point.id !== BOUND_IDS[index] || ![point.x, point.y, point.z].every(Number.isFinite)) ||
        observedPoints.some((point, index) => point.id !== BOUND_IDS[index] || ![point.x, point.y].every(Number.isFinite))) {
        throw new TypeError("ENDECK path pair lost an A–D identity or coordinate");
      }
    }
    for (let index = 0; index < 4; index += 1) {
      for (const axis of ["x", "y", "z"]) if (!Object.is(state.source[index][axis], pair.straight.source[index][axis])) {
        throw new TypeError("Straight path no longer matches the pinned history source");
      }
      for (const axis of ["x", "y"]) if (!Object.is(state.observed[index][axis], pair.straight.projection[index][axis])) {
        throw new TypeError("Straight path no longer matches the current projection");
      }
    }
    return pair;
  }

  function summarizePathPair(pair, selectedId) {
    if (!pair || !BOUND_IDS.includes(selectedId) || !pair.ids?.includes(selectedId)) throw new TypeError("A bound path pair and selected A–D ID are required");
    const locate = (points) => points.find((point) => point.id === selectedId);
    const straightSource = locate(pair.straight.source), arcSource = locate(pair.arc.source);
    const straightProjection = locate(pair.straight.projection), arcProjection = locate(pair.arc.projection);
    if (!straightSource || !arcSource || !straightProjection || !arcProjection) throw new TypeError("Selected ENDECK ID is missing from a path");
    return {
      selectedId,
      straightSource,
      arcSource,
      straightProjection,
      arcProjection,
      selectedSourceDistance: Math.hypot(straightSource.x - arcSource.x, straightSource.y - arcSource.y, straightSource.z - arcSource.z),
      selectedProjectedDistance: Math.hypot(straightProjection.x - arcProjection.x, straightProjection.y - arcProjection.y),
      maxSourceDistance: pair.difference.maxSourceDistance,
      maxProjectedDistance: pair.difference.maxProjectedDistance,
      precisionLimited: pair.difference.precisionLimited,
      endpointAgreement: pair.endpointAgreement,
      intermediate: pair.difference.intermediate
    };
  }

  function mount(root, doc) {
    const byId = (id) => doc.getElementById(id);
    const room = byId("endeckRoom");
    const app = root.HALVETH_APP;
    if (!room || !app) return;
    const modeControl = byId("endeckRoomMode");
    const timeControl = byId("endeckRoomTime");
    const angleControl = byId("endeckRoomAngle");
    const rows = new Map();
    let model = null;
    let loading = null;
    let pathModule = null;
    let pathLoading = null;
    let pathError = null;
    let selectedId = "A";

    function svg(name, attributes, content) {
      const element = doc.createElementNS(SVG_NS, name);
      for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
      if (content !== undefined) element.textContent = content;
      return element;
    }
    function format(value) { return (value === 0 ? 0 : value).toFixed(2).replace(".", ","); }
    function formatDistance(value) { return value > 0 && value < .005 ? "< 0,01" : format(value); }
    function coordinates(point, axes) { return axes.map((axis) => format(point[axis])).join(" / "); }
    function loadPath() {
      if (pathModule || pathLoading || pathError) return;
      pathError = null;
      pathLoading = import("./endeck-path.mjs").then((module) => {
        pathModule = module;
        pathLoading = null;
        if (!room.hidden && modeControl.value === "history") render();
      }).catch((error) => {
        pathError = error;
        pathLoading = null;
        root.console?.error?.("ENDECK path adapter failed", error);
        if (!room.hidden && modeControl.value === "history") render();
      });
    }
    function scenePoint(point, sourceSchematic, historyView) {
      const x = sourceSchematic ? point.x + point.z * .4 : point.x;
      const y = sourceSchematic ? point.y - point.z * .55 : point.y;
      const scale = historyView ? 53 : 82;
      return { x: 210 + x * scale, y: (historyView ? 170 : 150) - y * scale };
    }
    function sceneGroups(points, sourceSchematic, historyView) {
      const groups = [];
      const seen = new Map();
      for (const point of points) {
        const key = sourceSchematic ? (point.x + point.z * .4) + "|" + (point.y - point.z * .55) :
          (point.x === 0 ? 0 : point.x) + "|" + (point.y === 0 ? 0 : point.y);
        let group = seen.get(key);
        if (!group) {
          group = { ...scenePoint(point, sourceSchematic, historyView), ids: [] };
          groups.push(group); seen.set(key, group);
        }
        group.ids.push(point.id);
      }
      return groups;
    }
    function paint(target, points, sourceSchematic, count, ghostPoints) {
      const historyView = !!ghostPoints;
      const scale = historyView ? 53 : 82;
      const originY = historyView ? 170 : 150;
      const drawing = doc.createDocumentFragment();
      drawing.appendChild(svg("rect", { x: 1, y: 1, width: 418, height: 298, rx: 9, fill: "#0a1320", stroke: "#274052" }));
      for (let axis = -2; axis <= 2; axis += 1) {
        drawing.appendChild(svg("line", { x1: 210 + axis * scale, y1: 15, x2: 210 + axis * scale, y2: 285, stroke: axis ? "#243542" : "#506778", "stroke-width": axis ? 1 : 1.5 }));
        drawing.appendChild(svg("line", { x1: 15, y1: originY + axis * scale, x2: 405, y2: originY + axis * scale, stroke: axis ? "#243542" : "#506778", "stroke-width": axis ? 1 : 1.5 }));
      }
      drawing.appendChild(svg("text", { x: 394, y: originY - 8, fill: "#85a4b4", "font-size": 11, "text-anchor": "end" }, sourceSchematic ? "X" : "U"));
      drawing.appendChild(svg("text", { x: 217, y: 22, fill: "#85a4b4", "font-size": 11 }, sourceSchematic ? "Y / Z-Schema" : "V"));
      if (ghostPoints) {
        const ghostPath = ghostPoints.map((point) => scenePoint(point, sourceSchematic, historyView));
        drawing.appendChild(svg("path", {
          d: "M " + ghostPath.map((point) => point.x.toFixed(2) + " " + point.y.toFixed(2)).join(" L ") + " Z",
          fill: "none", stroke: "#d7a7ff", "stroke-width": 3, "stroke-dasharray": "8 5", opacity: .9,
          "data-path": "arc"
        }));
      }
      const path = points.map((point) => scenePoint(point, sourceSchematic, historyView));
      if (path.length === 4) drawing.appendChild(svg("path", {
        d: "M " + path.map((point) => point.x.toFixed(2) + " " + point.y.toFixed(2)).join(" L ") + " Z",
        fill: "none", stroke: sourceSchematic ? "#ef7682" : "#80d9e2", "stroke-width": 2,
        "stroke-dasharray": sourceSchematic ? "5 5" : "none", opacity: .7
      }));
      for (const group of sceneGroups(points, sourceSchematic, historyView)) {
        const selected = group.ids.includes(selectedId);
        const multi = group.ids.length > 1;
        drawing.appendChild(svg("circle", { cx: group.x, cy: group.y, r: multi ? 23 : 17,
          fill: sourceSchematic ? "#4a1f31" : "#163d48", stroke: selected ? "#fff4cf" : sourceSchematic ? "#ff8390" : "#8be7ef", "stroke-width": selected ? 3 : 2 }));
        drawing.appendChild(svg("text", { x: group.x, y: group.y + 4, fill: "#fff", "font-size": multi ? 12 : 14,
          "font-family": "Consolas, monospace", "font-weight": "bold", "text-anchor": "middle" }, multi ? String(group.ids.length) : group.ids[0]));
        if (multi) drawing.appendChild(svg("text", { x: group.x, y: group.y + 43, fill: "#e8f3f4", "font-size": 13,
          "font-family": "Consolas, monospace", "font-weight": "bold", "text-anchor": "middle" }, group.ids.join(" + ")));
      }
      if (ghostPoints) for (const group of sceneGroups(ghostPoints, sourceSchematic, historyView)) {
        drawing.appendChild(svg("circle", { cx: group.x, cy: group.y, r: group.ids.length > 1 ? 30 : 25,
          fill: "none", stroke: "#d7a7ff", "stroke-width": 2.5, "stroke-dasharray": "5 4", "data-path": "arc",
          "data-ids": group.ids.join(" ") }));
        drawing.appendChild(svg("text", { x: group.x + 24, y: group.y - (group.ids.length > 1 ? 29 : 24),
          fill: "#ead1ff", "font-size": 11, "font-family": "Consolas, monospace", "font-weight": "bold",
          "text-anchor": "start", "paint-order": "stroke", stroke: "#0a1320", "stroke-width": 3,
          "data-path": "arc" }, "Arc " + group.ids.join(" + ")));
      }
      drawing.appendChild(svg("text", { x: 18, y: 278, fill: "#acc3cf", "font-size": 11, "font-family": "Consolas, monospace" }, count + "/4 Positionen"));
      target.replaceChildren(drawing);
      target.setAttribute("aria-label", (sourceSchematic ? "Quellzustand als XYZ-Schema: " : "Beobachtungsprojektion: ") +
        count + " von 4 geraden Positionen unterscheidbar. " + sceneGroups(points, sourceSchematic, historyView).map((group) => group.ids.join(" und ") + " an einer Position").join("; ") +
        (ghostPoints ? ". Arc-Geisterpunkte: " + sceneGroups(ghostPoints, sourceSchematic, historyView).map((group) => group.ids.join(" und ") + " an einer Position").join("; ") : ""));
    }
    function ensureRows() {
      if (rows.size) return;
      const body = byId("endeckRoomRows");
      for (const id of BOUND_IDS) {
        const row = doc.createElement("tr");
        const head = doc.createElement("th"); head.scope = "row";
        const button = doc.createElement("button"); button.type = "button"; button.textContent = id;
        button.setAttribute("aria-label", "Quell-ID " + id + " auswählen");
        button.addEventListener("click", () => { selectedId = id; render(); button.focus(); });
        head.appendChild(button); row.appendChild(head);
        const cells = Array.from({ length: 6 }, () => { const td = doc.createElement("td"); row.appendChild(td); return td; });
        body.appendChild(row); rows.set(id, { row, button, cells });
      }
    }
    function syncMotion() {
      const reduced = !!app.reducedMotion();
      room.classList.toggle("is-reduced", reduced);
      byId("endeckMotion").setAttribute("aria-pressed", String(reduced));
      byId("endeckMotion").textContent = reduced ? "Bewegung normal" : "Bewegung reduzieren";
    }
    function renderPathDetails(pair) {
      const summary = summarizePathPair(pair, selectedId);
      const atEndpoint = pair.t === 0 || pair.t === 1;
      byId("endeckPathStatus").textContent =
        "t = " + format(pair.t) + " (normalisierter Modellparameter), Winkel " + pair.angleDegrees + "°. " +
        "Bei t = 0 und t = 1 stimmen die Endpunkte in Quelle und Projektion überein. " +
        (atEndpoint ? "Hier sind Gerade und Arc deckungsgleich." :
          summary.precisionLimited ? "Zwischenwert an der Anzeigegrenze: ein sichtbarer Unterschied ist nicht garantiert." :
          pair.difference.sourceDiffers && pair.difference.projectionDiffers ? "Hier unterscheiden sich Quelle und Projektion der beiden Zwischenwege." :
          "Hier ist nur eine der Ansichten unterscheidbar.");
      for (const button of byId("endeckPathPanel").querySelectorAll("[data-endeck-path-t]")) {
        button.setAttribute("aria-pressed", String(Number(button.dataset.endeckPathT) === Number(timeControl.value)));
      }
      for (const button of byId("endeckPathPanel").querySelectorAll("[data-endeck-path-id]")) {
        button.setAttribute("aria-pressed", String(button.dataset.endeckPathId === selectedId));
      }
      const readout = byId("endeckPathReadout");
      const heading = doc.createElement("h4");
      heading.textContent = "Gewählte Quell-ID " + selectedId;
      const list = doc.createElement("dl");
      function metric(label, value) {
        const row = doc.createElement("div");
        const term = doc.createElement("dt"); term.textContent = label;
        const answer = doc.createElement("dd"); answer.textContent = value;
        row.append(term, answer); list.appendChild(row);
      }
      metric("Gerade · Quelle X / Y / Z", coordinates(summary.straightSource, ["x", "y", "z"]));
      metric("Arc · Quelle X / Y / Z", coordinates(summary.arcSource, ["x", "y", "z"]));
      metric("Gerade · Projektion U / V", coordinates(summary.straightProjection, ["x", "y"]));
      metric("Arc · Projektion U / V", coordinates(summary.arcProjection, ["x", "y"]));
      metric("Abstand dieser ID · Quelle / Projektion", formatDistance(summary.selectedSourceDistance) + " / " + formatDistance(summary.selectedProjectedDistance));
      metric("Maximaler A–D-Abstand · Quelle / Projektion", formatDistance(summary.maxSourceDistance) + " / " + formatDistance(summary.maxProjectedDistance));
      readout.replaceChildren(heading, list);
      readout.setAttribute("aria-label", "Pfadvergleich für Quell-ID " + selectedId);
    }
    function render() {
      if (room.hidden || !model) return;
      const state = derive(model, modeControl.value, Number(timeControl.value) / 100, Number(angleControl.value));
      const pathPanel = byId("endeckPathPanel");
      const pathActive = state.mode === "history";
      pathPanel.hidden = !pathActive;
      let pathPair = null;
      if (pathActive) {
        if (!pathModule && !pathError) loadPath();
        if (pathModule) try {
          pathPair = validatePathPair(state, pathModule.pair(state.time, state.angle));
          renderPathDetails(pathPair);
        } catch (error) {
          pathError = error;
          root.console?.error?.("ENDECK path comparison failed", error);
        }
        if (!pathPair) {
          byId("endeckPathStatus").textContent = pathError ?
            "Pfadvergleich nicht verfügbar: lokaler Adapter konnte nicht geprüft werden." :
            "Lade den gepinnten lokalen Gerade/Arc-Vergleich …";
          byId("endeckPathReadout").replaceChildren();
        }
      }
      byId("endeckRoomTimeValue").value = state.time.toFixed(2);
      byId("endeckRoomAngleValue").value = state.angle + "°";
      byId("endeckSourceCount").textContent = state.sourceDistinct + "/4";
      byId("endeckObservedCount").textContent = state.observedDistinct + "/4";
      paint(byId("endeckRoomSource"), state.source, true, state.sourceDistinct, pathPair?.arc.source);
      paint(byId("endeckRoomObserved"), state.observed, false, state.observedDistinct, pathPair?.arc.projection);
      const collisions = state.groups.filter((group) => group.ids.length > 1);
      byId("endeckCollision").textContent = collisions.length ?
        "Beobachtete Kollision: " + collisions.map((group) => group.ids.join(" + ")).join("; ") +
        ". Mehrere Quell-IDs teilen je eine 2D-Position." :
        "In dieser 2D-Ansicht sind A, B, C und D an vier Positionen getrennt.";
      for (const point of state.source) {
        const observed = state.observed.find((item) => item.id === point.id);
        const group = state.groups.find((item) => item.ids.includes(point.id));
        const item = rows.get(point.id);
        [point.x, point.y, point.z, observed.x, observed.y].forEach((value, index) => { item.cells[index].textContent = format(value); });
        item.cells[5].textContent = group.ids.length > 1 ? group.ids.join(" + ") : "—";
        item.button.setAttribute("aria-pressed", String(point.id === selectedId));
        item.row.classList.toggle("is-selected", point.id === selectedId);
      }
      const selected = state.source.find((point) => point.id === selectedId);
      const observed = state.observed.find((point) => point.id === selectedId);
      const same = state.groups.find((group) => group.ids.includes(selectedId)).ids;
      byId("endeckSelection").textContent = "ID " + selectedId + " · Quelle (" + [selected.x, selected.y, selected.z].map(format).join(", ") +
        ") · Beobachtung (" + [observed.x, observed.y].map(format).join(", ") + "). " +
        (same.length > 1 ? "Position geteilt mit " + same.filter((id) => id !== selectedId).join(", ") + "." : "Hier einzeln beobachtbar.");
      syncMotion();
    }
    function setBackgroundInert(enabled) {
      [".topbar", "#spaceStage", ".side-rail", "#inspectPanel", ".statusbar"]
        .forEach((selector) => { const element = doc.querySelector(selector); if (element) element.inert = enabled; });
    }
    async function open() {
      if (app.getProject()?.id !== "halveth-forschungslabor") return false;
      try {
        if (!model) {
          loading ||= import("./vendor/endeck/model.mjs");
          model = await loading;
        }
      } catch {
        loading = null;
        return false;
      }
      if (app.getProject()?.id !== "halveth-forschungslabor") return false;
      ensureRows(); room.hidden = false; setBackgroundInert(true);
      byId("sceneMode").textContent = "ENDECK / PROJEKTION";
      render(); byId("endeckRoomTitle").focus();
      return true;
    }
    function close() {
      if (room.hidden) return;
      room.hidden = true; setBackgroundInert(false);
      app.returnToCosmos();
    }
    for (const control of [modeControl, timeControl, angleControl]) control.addEventListener("input", render);
    for (const button of byId("endeckPathPanel").querySelectorAll("[data-endeck-path-t]")) {
      button.addEventListener("click", () => { timeControl.value = button.dataset.endeckPathT; render(); button.focus(); });
    }
    for (const button of byId("endeckPathPanel").querySelectorAll("[data-endeck-path-id]")) {
      button.addEventListener("click", () => { selectedId = button.dataset.endeckPathId; render(); button.focus(); });
    }
    byId("endeckZero").addEventListener("click", () => {
      modeControl.value = "projection"; timeControl.value = "100"; angleControl.value = "0"; render();
    });
    byId("endeckForty").addEventListener("click", () => {
      modeControl.value = "projection"; timeControl.value = "100"; angleControl.value = "40"; render();
    });
    byId("endeckMotion").addEventListener("click", () => { app.setReducedMotion(!app.reducedMotion()); syncMotion(); });
    byId("endeckExit").addEventListener("click", close);
    byId("endeckExitWorld").addEventListener("click", close);
    room.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const items = Array.from(room.querySelectorAll("button:not([disabled]), select:not([disabled]), input:not([disabled])"))
        .filter((element) => element.getClientRects().length > 0);
      if (!items.length) return;
      if (event.shiftKey && (doc.activeElement === items[0] || doc.activeElement === byId("endeckRoomTitle"))) {
        items.at(-1).focus(); event.preventDefault();
      } else if (!event.shiftKey && doc.activeElement === items.at(-1)) {
        items[0].focus(); event.preventDefault();
      }
    });
    root.HALVETH_ENDECK_ROOM = Object.freeze({ open, close });
  }

  return Object.freeze({ derive, validatePathPair, summarizePathPair, mount });
});
