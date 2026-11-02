(function () {
  "use strict";
  const byId = (id) => document.getElementById(id);
  const button = byId("sourceButton");
  const panel = byId("sourcePanel");
  const slider = byId("sourceSlider");
  const nodes = byId("sourceNodes");
  const strand = byId("sourceStrand");
  const adapter = window.HalvethHistory;
  const time = window.HALVETH_SOURCE_TIME;
  if (!time || typeof time.formatUTC !== "function" ||
      typeof time.durationExact !== "function" || typeof time.durationCompact !== "function") {
    throw new Error("Source time formatter unavailable");
  }
  const utc = time.formatUTC;
  const elapsed = time.durationExact;
  const elapsedShort = time.durationCompact;
  const configs = {
    "halveth-scarlet": {label: "SCARLET", detail: "SCARLET-Commits", manifest: window.HALVETH_SCARLET_HISTORY},
    "halveth-forschungslabor": {label: "Forschungslabor / ENDECK", detail: "ENDECK-Commits", manifest: window.HALVETH_ENDECK_HISTORY},
    "halveth-field-difference-lab": {label: "Field Difference", detail: "repo-weite Field-Difference-Commits", manifest: window.HALVETH_FIELD_DIFFERENCE_HISTORY}
  };
  const histories = new Map();
  let bound = null;
  let currentProject = null;
  let index = 0;
  let lastTrigger = null;

  Object.entries(configs).forEach(([id, config]) => {
    try {
      if (adapter && config.manifest) {
        const adapted = adapter.adapt(config.manifest);
        if (adapted.projectId !== id) throw new Error("Project binding mismatch");
        histories.set(id, adapted);
      }
    } catch (error) { console.error(id + " history validation failed:", error); }
  });

  function empty(element) { while (element.firstChild) element.removeChild(element.firstChild); }
  function textNode(tag, content) {
    const node = document.createElement(tag);
    node.textContent = content;
    return node;
  }
  function svg(name, attributes) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  }
  function strandGeometry() {
    return window.matchMedia("(max-width: 470px)").matches ? {width: 360, left: 28, span: 304} : {width: 1000, left: 95, span: 810};
  }
  function renderStrand() {
    empty(strand);
    const timeline = bound.timeline;
    const geometry = strandGeometry();
    strand.setAttribute("viewBox", "0 0 " + geometry.width + " 120");
    const x = (at) => geometry.left + at * (geometry.span / (timeline.length - 1));
    for (let at = 0; at < timeline.length - 1; at += 1) {
      strand.appendChild(svg("line", {x1: x(at), y1: 69, x2: x(at + 1), y2: 69, stroke: "#f2c587", "stroke-width": 2, "stroke-dasharray": "7 8", opacity: .58}));
      const duration = svg("text", {x: (x(at) + x(at + 1)) / 2, y: 33, fill: "#ccb18c", "font-size": 11, "text-anchor": "middle", "font-family": "Consolas, monospace"});
      duration.textContent = elapsedShort(timeline[at].eventTime, timeline[at + 1].eventTime);
      strand.appendChild(duration);
    }
    timeline.forEach((event, at) => {
      const active = at === index;
      strand.appendChild(svg("circle", {cx: x(at), cy: 69, r: active ? 11 : 7, fill: active ? "#f2c587" : "#141b29", stroke: "#f2c587", "stroke-width": 2}));
      const number = svg("text", {x: x(at), y: 103, fill: active ? "#fff" : "#b3b8c6", "font-size": 13, "text-anchor": "middle", "font-family": "Consolas, monospace"});
      number.textContent = String(at + 1).padStart(2, "0");
      strand.appendChild(number);
    });
  }
  function renderNodes() {
    const restoreNodeFocus = nodes.contains(document.activeElement);
    empty(nodes);
    bound.timeline.forEach((event, at) => {
      const node = document.createElement("button");
      node.type = "button";
      node.setAttribute("aria-pressed", String(index === at));
      node.textContent = String(at + 1).padStart(2, "0") + " · " + utc(event.eventTime);
      node.title = event.title;
      node.addEventListener("click", () => { index = at; render(); });
      nodes.appendChild(node);
    });
    if (restoreNodeFocus) nodes.children[index]?.focus();
  }
  function render() {
    if (!bound) return;
    const event = bound.timeline[index];
    slider.value = String(index);
    byId("sourceElapsed").textContent = index === 0 ?
      "Erster gewählter Commit. Was davor geschah, ist in dieser Auswahl nicht inventarisiert." :
      "Abstand zum vorherigen gewählten Commit: " + elapsed(bound.timeline[index - 1].eventTime, event.eventTime) + ". Dazwischenliegende Commits bleiben Teil der ausgewiesenen Lücke.";
    byId("sourceStep").textContent = String(index + 1).padStart(2, "0") + " / " + String(bound.timeline.length).padStart(2, "0") + " AUSGEWÄHLTE REVISIONEN";
    byId("sourceTime").textContent = "COMMIT-METADATEN · " + utc(event.eventTime);
    byId("sourceEventTitle").textContent = event.title;
    byId("sourceSummary").textContent = event.summary;
    byId("sourceSha").textContent = event.commit.sha;
    byId("sourceCommittedAt").textContent = utc(event.commit.committerAt);
    byId("sourceRecordedAt").textContent = utc(event.recordedAt);
    byId("sourceCommitLink").href = event.commit.url;
    const evidence = byId("sourceEvidence"); empty(evidence);
    event.evidence.forEach((item) => {
      const li = document.createElement("li");
      li.appendChild(textNode("span", item.status.toUpperCase() + " · " + item.path + " — " + item.note + " "));
      const link = document.createElement("a");
      link.href = item.url; link.target = "_blank"; link.rel = "noopener noreferrer";
      link.textContent = "Gepinnte Datei ↗";
      li.appendChild(link); evidence.appendChild(li);
    });
    renderNodes();
    renderStrand();
  }
  function openAt(at) {
    if (!bound) return false;
    if (!Number.isSafeInteger(at) || at < 0 || at >= bound.timeline.length) throw new TypeError("Revision outside selected source history");
    lastTrigger = document.activeElement;
    window.HALVETH_APP?.cancelWarp();
    if (!byId("netzPanel").hidden) byId("closeNetz").click();
    if (!byId("labPanel").hidden) byId("closeLab").click();
    panel.hidden = false;
    window.HALVETH_APP.syncLayerInert();
    byId("sceneMode").textContent = "NETZ / QUELLSPUR";
    panel.scrollTop = 0;
    slider.max = String(bound.timeline.length - 1);
    index = at;
    byId("sourceCoverage").textContent = bound.coverage.notes + " Der beobachtete Git-Stand ist " + bound.observedHead.slice(0, 12) + ".";
    const gaps = byId("sourceGaps"); empty(gaps);
    bound.gaps.forEach((gap) => gaps.appendChild(textNode("li", gap.kind + " · " + gap.scope + ": " + gap.reason + " Wiederaufnahme: " + gap.reopenTrigger)));
    byId("sourceDigest").textContent = "MANIFEST SHA-256 · " + bound.integrity.digest + " · " + bound.integrity.selectedEvents + " gewählte Commits / " + bound.integrity.gaps + " Lücken";
    render();
    byId("statusMessage").textContent = configs[currentProject].label + "-Quellspur geöffnet: ausgewählte öffentliche Commits, begrenzte Coverage.";
    byId("closeSource").focus();
    return true;
  }
  function close(restoreFocus = true) {
    const shouldRestore = restoreFocus && !panel.hidden && panel.contains(document.activeElement);
    if (!panel.hidden) {
      byId("sceneMode").textContent = byId("inspectPanel").hidden ? "FLUGMODUS" : "PROJEKTFOKUS";
      panel.hidden = true;
      window.HALVETH_APP.syncLayerInert();
    }
    if (shouldRestore) {
      const target = lastTrigger?.isConnected && !lastTrigger.closest("[hidden], [inert]") && lastTrigger.getClientRects().length
        ? lastTrigger : (!button.hidden ? button : null);
      target?.focus();
    }
  }
  function setProject(id) {
    close(false);
    currentProject = id;
    bound = histories.get(id) || null;
    button.hidden = !bound;
    if (bound) {
      byId("sourceTitle").textContent = configs[id].label + " · ausgewählte Revisionen";
      button.querySelector("small").textContent = "Ausgewählte " + configs[id].detail + " · echte Quellenmetadaten";
    }
  }

  button.addEventListener("click", () => openAt(0));
  byId("closeSource").addEventListener("click", close);
  slider.addEventListener("input", () => { index = Number(slider.value); render(); });
  strand.addEventListener("pointerdown", (event) => {
    if (!bound) return;
    const rect = strand.getBoundingClientRect();
    if (!rect.width) return;
    const geometry = strandGeometry();
    strand.setPointerCapture?.(event.pointerId);
    slider.focus();
    const choose = (pointer) => {
      const candidate = Math.round(((pointer.clientX - rect.left) / rect.width * geometry.width - geometry.left) / (geometry.span / (bound.timeline.length - 1)));
      const next = Math.max(0, Math.min(bound.timeline.length - 1, candidate));
      if (next !== index) { index = next; render(); }
    };
    choose(event);
    const end = () => { strand.removeEventListener("pointermove", choose); strand.removeEventListener("pointerup", end); strand.removeEventListener("pointercancel", end); };
    strand.addEventListener("pointermove", choose); strand.addEventListener("pointerup", end); strand.addEventListener("pointercancel", end);
  });
  strand.addEventListener("click", () => slider.focus());
  panel.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const items = Array.from(panel.querySelectorAll("button:not([disabled]), input:not([disabled]), a[href]"));
    if (items.length === 0) return;
    if (event.shiftKey && document.activeElement === items[0]) { items.at(-1).focus(); event.preventDefault(); }
    else if (!event.shiftKey && document.activeElement === items.at(-1)) { items[0].focus(); event.preventDefault(); }
  });
  window.addEventListener("resize", () => { if (bound && !panel.hidden) renderStrand(); });
  window.HALVETH_SOURCE_UI = {setProject, openAt, close};
})();
