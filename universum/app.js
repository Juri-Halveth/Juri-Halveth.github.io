(function () {
  "use strict";
  const catalog = window.HALVETH_CATALOG;
  const engine = window.NETZ_ENGINE;
  const byId = (id) => document.getElementById(id);
  if (!catalog || catalog.schema !== "halveth.portal.catalog.v1" || !Array.isArray(catalog.projects) || !engine) {
    byId("statusMessage").textContent = "Katalog oder NETZ-Modell fehlt.";
    return;
  }

  const projects = catalog.projects.filter((p) => p.visibility === "public" && typeof p.id === "string");
  const categories = new Map(catalog.categories.map((category) => [category.id, category]));
  const hues = { software: 195, security: 12, models: 348, worlds: 265, learning: 43, society: 155 };
  const e = {
    shell: byId("appShell"), stage: byId("spaceStage"), canvas: byId("spaceCanvas"), layer: byId("portalLayer"),
    projectList: byId("projectList"), search: byId("projectSearch"), filter: byId("categoryFilter"),
    visibleCount: byId("visibleCount"), catalogCount: byId("catalogCount"), position: byId("positionReadout"),
    near: byId("nearReadout"), status: byId("statusMessage"), sceneMode: byId("sceneMode"),
    inspect: byId("inspectPanel"), inspectTitle: byId("inspectTitle"), inspectTagline: byId("inspectTagline"),
    inspectDescription: byId("inspectDescription"), inspectKind: byId("inspectKind"), inspectEvidence: byId("inspectEvidence"),
    inspectCategory: byId("inspectCategory"), inspectOpen: byId("inspectOpen"), inspectSource: byId("inspectSource"),
    warp: byId("warp"), help: byId("helpPanel"), helpButton: byId("helpButton"),
    netz: byId("netzPanel"), traceProject: byId("traceProject"), traceTick: byId("traceTick"),
    timeSlider: byId("timeSlider"), playTrace: byId("playTrace"), projectionButton: byId("projectionButton"),
    strand: byId("strandSvg"), gripExplore: byId("gripExplore"), gripVerify: byId("gripVerify"),
    branchReveal: byId("branchReveal"), eventState: byId("eventState"), eventTitle: byId("eventTitle"),
    eventDetail: byId("eventDetail"), mergeResult: byId("mergeResult"), motionButton: byId("motionButton")
  };

  const scene = {
    x: 0, z: 0, yaw: 0, keys: new Set(), pointer: null, activeId: null, filteredIds: new Set(), lastTriggerKind: "portal",
    trace: null, traceTick: 0, traceTimer: null, fullProjection: false, focusBranch: null,
    reduced: window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    lastFrame: 0, lastReadout: 0, stars: [], portals: []
  };
  let realmsRoom = null;
  let foldRoom = null;
  const ctx = e.canvas.getContext("2d", { alpha: false });
  e.catalogCount.textContent = projects.length + " PORTALE";
  e.motionButton.setAttribute("aria-pressed", String(scene.reduced));
  e.shell.classList.toggle("reduced-motion", scene.reduced);

  function setStatus(message) { e.status.textContent = message; }
  function isInput(target) { return target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName); }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function safeHref(value) {
    try { const url = new URL(value); return url.protocol === "https:" ? url.href : "#"; }
    catch { return "#"; }
  }
  function categoryOf(project) { return categories.get(project.categories[0]) || { label: "Projekt", short: "PROJEKT" }; }
  function visibleCategories(project) {
    const ids = [...new Set(project.categories)];
    const selected = e.filter.value;
    const ordered = selected !== "all" && ids.includes(selected) ? [selected, ...ids.filter((id) => id !== selected)] : ids;
    return ordered.map((id) => categories.get(id)).filter(Boolean);
  }
  function categoryLabels(project) { return visibleCategories(project).map((category) => category.label).join(" · ") || "Projekt"; }
  function projectHue(project) { return hues[project.categories[0]] || 350; }
  function clear(element) { while (element.firstChild) element.removeChild(element.firstChild); }
  function flightBlocked() {
    return !e.inspect.hidden || !e.netz.hidden || !byId("sourcePanel").hidden || !byId("labPanel").hidden || !byId("scarletRoom").hidden || !byId("endeckRoom").hidden || Boolean(realmsRoom?.isOpen()) || Boolean(foldRoom?.isOpen()) || Boolean(window.HALVETH_SOURCE_NETZ_UI?.isOpen()) || !e.help.hidden;
  }

  // The public catalogue is editorial. Spatial coordinates are generated for this local view.
  const lanes = [-4.5, 5.8, -3.2, 7.2, -7.4, 2.8, -5.1, 6.6, 0];
  scene.portals = projects.map((project, index) => {
    const button = document.createElement("button");
    button.type = "button"; button.className = "portal";
    button.dataset.projectId = project.id;
    button.setAttribute("aria-label", project.title + " als Projektportal öffnen");
    button.style.setProperty("--hue", String(projectHue(project)));
    const art = document.createElement("span"); art.className = "portal-art"; art.setAttribute("aria-hidden", "true");
    const copy = document.createElement("span"); copy.className = "portal-copy";
    const kicker = document.createElement("span"); kicker.className = "portal-kicker"; kicker.textContent = categoryOf(project).short;
    const title = document.createElement("span"); title.className = "portal-title"; title.textContent = project.title;
    const distance = document.createElement("span"); distance.className = "portal-distance"; distance.textContent = "ANNÄHERN / ÖFFNEN";
    copy.append(kicker, title, distance); button.append(art, copy);
    button.addEventListener("click", () => warpTo(project));
    e.layer.appendChild(button);
    const world = { x: lanes[index % lanes.length] + (Math.floor(index / lanes.length) ? 2.5 : 0), y: ((index * 3) % 5 - 2) * 1.35, z: 19 + index * 9 };
    return { project, world, button, kicker, distance };
  });

  for (let i = 0; i < 190; i += 1) {
    const n = (i * 1664525 + 1013904223) >>> 0;
    const x = ((n & 65535) / 65535 - .5) * 100;
    const y = (((n >>> 8) & 65535) / 65535 - .5) * 62;
    const z = 8 + (((n >>> 15) & 65535) / 65535) * 220;
    scene.stars.push({ x, y, z, radius: i % 13 === 0 ? 1.7 : .8, alpha: .2 + (i % 7) * .09 });
  }

  catalog.categories.forEach((category) => {
    const option = document.createElement("option"); option.value = category.id; option.textContent = category.label;
    e.filter.appendChild(option);
  });

  function matches(project) {
    const query = e.search.value.trim().toLocaleLowerCase("de");
    const category = e.filter.value;
    if (category !== "all" && !project.categories.includes(category)) return false;
    if (!query) return true;
    return [project.title, project.tagline, project.repository, project.description, ...project.categories.map((id) => categories.get(id)?.label || "")]
      .join(" ").toLocaleLowerCase("de").includes(query);
  }
  function renderList() {
    clear(e.projectList); scene.filteredIds.clear();
    scene.portals.forEach((item) => { item.kicker.textContent = visibleCategories(item.project)[0]?.short || "PROJEKT"; });
    projects.forEach((project, index) => {
      if (!matches(project)) return;
      scene.filteredIds.add(project.id);
      const button = document.createElement("button"); button.type = "button"; button.className = "list-item";
      button.dataset.projectId = project.id;
      button.setAttribute("role", "listitem");
      if (scene.activeId === project.id) button.classList.add("active");
      const number = document.createElement("span"); number.className = "list-index"; number.textContent = String(index + 1).padStart(2, "0");
      const label = document.createElement("span"); label.className = "list-label";
      const title = document.createElement("strong"); title.textContent = project.title;
      const small = document.createElement("small"); small.textContent = categoryLabels(project);
      const arrow = document.createElement("span"); arrow.className = "list-arrow"; arrow.setAttribute("aria-hidden", "true"); arrow.textContent = "↗";
      label.append(title, small); button.append(number, label, arrow);
      button.addEventListener("click", () => warpTo(project));
      e.projectList.appendChild(button);
    });
    e.visibleCount.textContent = scene.filteredIds.size + " / " + projects.length;
    const active = projects.find((project) => project.id === scene.activeId);
    if (active) e.inspectCategory.textContent = categoryLabels(active).toUpperCase();
    if (scene.filteredIds.size === 0) {
      const empty = document.createElement("p"); empty.className = "empty-list"; empty.textContent = "Kein Portal in dieser Auswahl.";
      e.projectList.appendChild(empty);
    }
  }
  e.search.addEventListener("input", renderList);
  e.filter.addEventListener("change", renderList);
  renderList();

  let previewSet = [];
  let previewIndex = 0;
  function renderPreview() {
    const preview = previewSet[previewIndex];
    byId("inspectImage").src = preview.src;
    byId("inspectImage").alt = preview.alt;
    byId("inspectArtLabel").textContent = preview.label;
    const source = byId("inspectImageSource");
    source.hidden = !preview.source;
    if (preview.source) { source.href = preview.source; source.textContent = preview.credit; }
    byId("inspectImageNext").hidden = previewSet.length < 2;
  }
  byId("inspectImageNext").addEventListener("click", () => {
    previewIndex = (previewIndex + 1) % previewSet.length;
    renderPreview();
  });

  function openInspect(project) {
    if (!e.netz.hidden) closeNetz();
    window.HALVETH_SOURCE_UI?.setProject(project.id);
    window.HALVETH_PORTAL_TIME_UI?.setProject(project.id);
    byId("sourceNetzButton").hidden = !window.HALVETH_SOURCE_NETZ_UI?.setProject(project.id);
    scene.activeId = project.id;
    e.inspectCategory.textContent = categoryLabels(project).toUpperCase();
    e.inspectTitle.textContent = project.title;
    e.inspectTagline.textContent = project.tagline;
    e.inspectDescription.textContent = project.description;
    previewSet = project.id === "halveth-scarlet" ? [
      {src: "assets/previews/scarlet-capability.svg", alt: "SCARLET Capability Room Vorschau", label: "SCARLET · CAPABILITY ROOM VORSCHAU", source: "https://github.com/Juri-Halveth/halveth-scarlet/blob/6913b81d3e2414b20149406cb3e2fe9bb314adf4/assets/capability-room-preview.svg", credit: "Juri Janovski (Projekt HALVETH), @Juri-Halveth · PIRL 2.0 ↗"},
      {src: "assets/previews/scarlet-wegweiser.png", alt: "SCARLET Wegweiser Vorschau", label: "SCARLET · WEGWEISER VORSCHAU", source: "https://github.com/Juri-Halveth/halveth-scarlet/blob/6913b81d3e2414b20149406cb3e2fe9bb314adf4/forschung/wegweiser/preview.png", credit: "Juri Janovski (Projekt HALVETH), @Juri-Halveth · PIRL 2.0 ↗"}
    ] : project.id === "halveth-forschungslabor" ? [
      {src: "assets/previews/forschungslabor-chronosphere.png", alt: "Forschungslabor Temporal Clock Teilprojekt", label: "FORSCHUNGSLABOR · TEMPORAL CLOCK TEILPROJEKT", source: "https://github.com/Juri-Halveth/halveth-forschungslabor/blob/2cb8eb38e4276b0b821731d4f1056cd06a8b8631/branches/temporal-clock/preview.png", credit: "HALVETH Open Research contributors · CC BY 4.0 ↗"}
    ] : [
      {src: "assets/system-banner.svg", alt: "Geometrisches HALVETH Sternnetz", label: "HALVETH-SYSTEMMOTIV · KEIN PROJEKTSCREENSHOT"}
    ];
    previewIndex = 0;
    renderPreview();
    e.inspectKind.textContent = project.kind;
    e.inspectEvidence.textContent = project.evidence + (project.reviewed ? " · redaktionell geprüft" : " · Funktion offen");
    const tech = project.id === "halveth-scarlet" ? ["GStar: Seed, Ableitung, Snapshot und Replay", "GStarLiving: endliche Zellökologie mit Render-/Full-Projektion"] :
      project.id === "halveth-forschungslabor" ? ["ENDECK: vier stabile Punktidentitäten und Projektionen", "Faltgrenze: zwei getrennte mathematische Gegenmodelle", "Temporal Clock als eigenes öffentliches Teilprojekt"] :
      project.id === "halveth-field-difference-lab" ? ["Drei zeitgleiche Grenzbahnen aus gepinntem dimensionslosem Quellmodell", "Linke und rechte Regel getrennt verändern; Zentralfeld und Zwei-Bahn-Modus erhalten"] :
      project.id === "halveth-realms" ? ["Realms: gepinnte lokale Weltregeln mit Seed und Epochen", "Fiktionale Landmarken, Personen und Gildenbildung"] :
      ["Öffentlicher Quell- oder Projekteinstieg im Katalog"];
    const techList = byId("inspectTech"); clear(techList);
    tech.forEach((item) => { const li = document.createElement("li"); li.textContent = item; techList.appendChild(li); });
    e.inspectOpen.href = safeHref(project.url);
    const direct = byId("inspectDirect");
    direct.hidden = project.id !== "halveth-forschungslabor";
    if (!direct.hidden) direct.href = "https://juri-halveth.github.io/halveth-forschungslabor/endeck/";
    byId("scarletRoomButton").hidden = project.id !== "halveth-scarlet";
    byId("endeckRoomButton").hidden = project.id !== "halveth-forschungslabor";
    byId("foldRoomButton").hidden = project.id !== "halveth-forschungslabor";
    byId("realmsRoomButton").hidden = project.id !== "halveth-realms";
    byId("fieldRoomButton").hidden = project.id !== "halveth-field-difference-lab";
    e.inspectSource.href = safeHref(project.source_url);
    e.inspect.hidden = false;
    e.help.hidden = true; e.helpButton.setAttribute("aria-expanded", "false");
    e.sceneMode.textContent = "PROJEKTFOKUS";
    renderList();
    setStatus(project.title + " im Fokus. Projektlink erst nach eigenem Klick geöffnet.");
    e.inspectTitle.focus?.();
  }
  let warpToken = 0;
  function cancelWarp() { warpToken += 1; e.warp.classList.remove("active"); }
  function warpTo(project) {
    if (!project || !scene.filteredIds.has(project.id)) return;
    scene.lastTriggerKind = e.projectList.contains(document.activeElement) ? "list" : "portal";
    const token = ++warpToken;
    e.warp.classList.remove("active");
    void e.warp.offsetWidth;
    e.warp.classList.add("active");
    setTimeout(() => { if (token === warpToken && byId("labPanel").hidden && byId("sourcePanel").hidden && e.netz.hidden) openInspect(project); }, scene.reduced ? 0 : 340);
    setTimeout(() => { if (token === warpToken) e.warp.classList.remove("active"); }, scene.reduced ? 20 : 900);
  }
  function closeInspect() {
    const oldId = scene.activeId;
    closeNetz(); window.HALVETH_SOURCE_UI?.close(); e.inspect.hidden = true; scene.activeId = null;
    e.sceneMode.textContent = "FLUGMODUS"; renderList(); setStatus("Zurück im Flugraum.");
    const stageRect = e.stage.getBoundingClientRect();
    updatePortals(stageRect.width, stageRect.height);
    const listTarget = Array.from(e.projectList.querySelectorAll(".list-item")).find((item) => item.dataset.projectId === oldId);
    const portalTarget = scene.portals.find((item) => item.project.id === oldId)?.button;
    const target = scene.lastTriggerKind === "list" || !portalTarget || portalTarget.hidden ? listTarget : portalTarget;
    target?.focus();
  }
  byId("closeInspect").addEventListener("click", closeInspect);
  byId("scarletRoomButton").addEventListener("click", () => {
    if (scene.activeId !== "halveth-scarlet") return;
    cancelWarp();
    if (!window.HALVETH_SCARLET_ROOM?.open()) setStatus("SCARLET-Zellraum konnte nicht geöffnet werden.");
  });
  byId("endeckRoomButton").addEventListener("click", async () => {
    if (scene.activeId !== "halveth-forschungslabor") return;
    cancelWarp();
    const opened = await window.HALVETH_ENDECK_ROOM?.open();
    if (!opened) setStatus("ENDECK-Projektionsraum konnte nicht geöffnet werden. Lokalen HTTP-Server prüfen.");
  });
  byId("realmsRoomButton").addEventListener("click", async (event) => {
    if (scene.activeId !== "halveth-realms") return;
    const trigger = event.currentTarget;
    cancelWarp();
    try {
      realmsRoom ||= await import("./cockpit-realms.mjs");
      if (scene.activeId !== "halveth-realms" || e.inspect.hidden) return;
      if (!realmsRoom.open(trigger)) setStatus("Realms-Weltmodell konnte nicht geöffnet werden.");
    } catch { setStatus("Realms-Weltmodell konnte nicht geladen werden. Lokalen HTTP-Server prüfen."); }
  });
  byId("fieldRoomButton").addEventListener("click", (event) => {
    if (scene.activeId !== "halveth-field-difference-lab") return;
    cancelWarp();
    if (!window.HALVETH_LAB?.openField(event.currentTarget)) {
      setStatus("Field-Grenzregelraum konnte nicht geöffnet werden. Lokalen HTTP-Server prüfen.");
    }
  });
  byId("sourceNetzButton").addEventListener("click", (event) => {
    if (event.currentTarget.hidden) return;
    cancelWarp();
    if (!window.HALVETH_SOURCE_NETZ_UI?.open(event.currentTarget)) setStatus("NETZ-Quellraum konnte nicht geöffnet werden.");
  });
  byId("foldRoomButton").addEventListener("click", async (event) => {
    if (scene.activeId !== "halveth-forschungslabor") return;
    const trigger = event.currentTarget;
    cancelWarp();
    try {
      foldRoom ||= await import("./cockpit-fold.mjs");
      if (scene.activeId !== "halveth-forschungslabor" || e.inspect.hidden) return;
      if (!foldRoom.open(trigger)) setStatus("Faltgrenzen-Modell konnte nicht geöffnet werden.");
    } catch { setStatus("Faltgrenzen-Modell konnte nicht geladen werden. Lokalen HTTP-Server prüfen."); }
  });
  byId("traceButton").addEventListener("click", () => {
    const project = projects.find((p) => p.id === scene.activeId);
    if (!project) return;
    cancelWarp();
    window.HALVETH_SOURCE_UI?.close();
    scene.trace = engine.demoTrace(project.id);
    if (!engine.validateTrace(scene.trace).ok) { setStatus("Modellspur ungültig."); return; }
    scene.traceTick = 0; scene.focusBranch = null; e.timeSlider.value = "0"; e.traceProject.textContent = project.title;
    if (!byId("labPanel").hidden) byId("closeLab").click();
    e.netz.hidden = false;
    setNetzBackgroundInert(true);
    e.sceneMode.textContent = "NETZ / ENTFALTUNG";
    e.mergeResult.textContent = "";
    renderPath(false);
    renderTrace(); byId("netzTitle").focus(); setStatus("Synthetische Modellspur für " + project.title + " geöffnet.");
  });
  byId("closeNetz").addEventListener("click", closeNetz);
  function setNetzBackgroundInert(enabled) {
    [e.stage, e.inspect, document.querySelector(".topbar"), document.querySelector(".side-rail"), document.querySelector(".statusbar")]
      .forEach((element) => { element.inert = enabled; });
  }
  function closeNetz() {
    const shouldRestore = !e.netz.hidden && e.netz.contains(document.activeElement) && !e.inspect.hidden;
    const wasOpen = !e.netz.hidden;
    stopTrace(); e.netz.hidden = true; e.sceneMode.textContent = e.inspect.hidden ? "FLUGMODUS" : "PROJEKTFOKUS";
    if (wasOpen) setNetzBackgroundInert(false);
    if (shouldRestore) byId("traceButton").focus();
  }
  e.netz.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const items = Array.from(e.netz.querySelectorAll("button:not([disabled]), input:not([disabled]), a[href]"))
      .filter((element) => element.getClientRects().length > 0);
    if (items.length === 0) return;
    if (event.shiftKey && (document.activeElement === items[0] || document.activeElement === byId("netzTitle"))) {
      items.at(-1).focus(); event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
      items[0].focus(); event.preventDefault();
    }
  });

  function svgNode(name, attributes) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  }
  function drawStrand() {
    clear(e.strand);
    const x = (tick) => 65 + tick * 217.5;
    const paths = [
      ["M65 85 L282.5 42 L500 42 L717.5 42 L935 85", "#ed646b", "", "explore"],
      ["M65 85 L282.5 128 L500 128", "#82d6df", "", "verify"],
      ["M500 128 L717.5 128 L935 85", "#82d6df", "6 7", "verify"]
    ];
    paths.forEach(([d, color, dash, branch]) => {
      const focused = scene.focusBranch === branch;
      const line = svgNode("path", { d, fill: "none", stroke: color, "stroke-width": focused ? 5 : 2.3, opacity: scene.focusBranch && !focused ? .22 : .8 });
      if (focused) line.setAttribute("class", "strand-focused");
      if (dash) line.setAttribute("stroke-dasharray", dash);
      e.strand.appendChild(line);
    });
    const labels = [[65, 85, "0 · Ursprung"], [282.5, 42, "1 · Exploration"], [282.5, 128, "1 · Prüfung"], [500, 42, "2 · Schritt"], [500, 128, "2 · Schritt"], [717.5, 128, "3 · Lücke"], [935, 85, "4 · Vorschlag"]];
    labels.forEach(([cx, cy, label]) => {
      const tick = Math.round((cx - 65) / 217.5);
      const active = tick <= scene.traceTick;
      const circle = svgNode("circle", { cx, cy, r: active ? 8 : 6, fill: active ? "#f0d3bb" : "#10131d", stroke: tick === 3 ? "#f2c587" : "#e8a3aa", "stroke-width": 2 });
      e.strand.appendChild(circle);
      const text = svgNode("text", { x: cx, y: cy < 80 ? cy - 14 : cy + 23, fill: active ? "#e8ebf3" : "#929aab", "font-size": 12, "text-anchor": "middle", "font-family": "Consolas, monospace" });
      text.textContent = label; e.strand.appendChild(text);
    });
    const marker = svgNode("line", { x1: x(scene.traceTick), x2: x(scene.traceTick), y1: 16, y2: 154, stroke: "#f2c587", "stroke-width": 1.5, opacity: .65 });
    e.strand.appendChild(marker);
  }
  function renderBranchReveal() {
    const branch = scene.focusBranch;
    e.gripExplore.setAttribute("aria-pressed", String(branch === "explore"));
    e.gripVerify.setAttribute("aria-pressed", String(branch === "verify"));
    e.branchReveal.hidden = !branch || !scene.trace;
    clear(e.branchReveal);
    if (!branch || !scene.trace) return;
    const heading = document.createElement("strong");
    heading.textContent = (branch === "explore" ? "Exploration" : "Prüfung") + " · T " + scene.traceTick;
    e.branchReveal.appendChild(heading);
    const events = scene.trace.events.filter((event) => event.tick <= scene.traceTick && (event.branch === branch || event.type === "ROOT"));
    const intro = document.createElement("p");
    intro.textContent = events.length === 1 ? "Dieser Zweig ist am gewählten Tick noch nicht entstanden. Der gemeinsame Modellursprung bleibt sichtbar." :
      "Erhaltene Modellereignisse dieses Zweigs bis zum gewählten Tick:";
    e.branchReveal.appendChild(intro);
    const list = document.createElement("ol");
    events.forEach((event) => {
      const item = document.createElement("li");
      item.textContent = "T" + event.tick + " · " + event.label + (event.type === "OBSERVATION_GAP" ? " · keine Zwischenbeobachtung" : "");
      list.appendChild(item);
    });
    e.branchReveal.appendChild(list);
    const note = document.createElement("small");
    note.textContent = "Synthetische Modellspur. Die Auswahl verändert keine Projektquelle und führt die Zweige nicht zusammen.";
    e.branchReveal.appendChild(note);
  }
  function setFocusBranch(branch, toggle) {
    scene.focusBranch = toggle && scene.focusBranch === branch ? null : branch;
    renderTrace();
  }
  e.gripExplore.addEventListener("click", () => setFocusBranch("explore", true));
  e.gripVerify.addEventListener("click", () => setFocusBranch("verify", true));
  function renderTrace() {
    if (!scene.trace) return;
    const tick = scene.traceTick;
    const state = engine.stateAt(scene.trace, tick);
    const events = state.events.filter((event) => event.tick === tick);
    e.traceTick.textContent = "T " + tick + " / 4";
    e.timeSlider.value = String(tick);
    e.eventState.textContent = state.observation.atTick.replaceAll("_", " ");
    e.eventTitle.textContent = tick === 0 ? "Lokaler Modellursprung" : tick === 1 ? "Zwei Zweige entstehen" : tick === 2 ? "Parallele Modellschritte" : tick === 3 ? "Beobachtungslücke" : "Zusammenführung vorgeschlagen";
    const renderText = tick === 0 ? "Ein synthetischer Ausgangspunkt ist gesetzt. Der reale Projektbeginn ist damit nicht belegt." :
      tick === 1 ? "Exploration und Prüfung entfalten sich aus demselben Modellanker. Der Schritt 0 → 1 enthält hier zwei Ereignisse; seine reale Dauer ist unbekannt." :
      tick === 2 ? "Beide Zweige haben eigene Übergänge. Der sichtbare Endwert ersetzt ihren Verlauf nicht." :
      tick === 3 ? "Für diesen Modellabschnitt fehlt ein Witness. Die gestrichelte Strecke zeigt die Lücke und erfindet keinen Zwischenzustand." :
      "Die beiden Zweige werden in einer Vorschau zusammengebracht. Ob sie fachlich kompatibel sind, ist ungeprüft.";
    if (!scene.fullProjection) e.eventDetail.textContent = renderText;
    else e.eventDetail.textContent = renderText + " Sichtbare Records: " + state.events.length + "; Zweige: " + state.branches.map((b) => b.id).join(", ") + "; aktuelle Ereignisse: " + events.map((ev) => ev.id).join(", ") + ".";
    drawStrand(); renderBranchReveal();
  }
  e.timeSlider.addEventListener("input", () => { scene.traceTick = Number(e.timeSlider.value); renderTrace(); });
  e.strand.addEventListener("pointerdown", (event) => {
    const rect = e.strand.getBoundingClientRect();
    if (!rect.width) return;
    e.strand.setPointerCapture?.(event.pointerId);
    const localX = (event.clientX - rect.left) / rect.width * 1000;
    const localY = (event.clientY - rect.top) / rect.height * 170;
    if (localX > 160 && localX < 790) setFocusBranch(localY < 85 ? "explore" : "verify", false);
    const step = (pointer) => { scene.traceTick = clamp(Math.round(((pointer.clientX - rect.left) / rect.width * 1000 - 65) / 217.5), 0, 4); renderTrace(); };
    step(event);
    const move = (pointer) => step(pointer);
    const end = () => { e.strand.removeEventListener("pointermove", move); e.strand.removeEventListener("pointerup", end); e.strand.removeEventListener("pointercancel", end); };
    e.strand.addEventListener("pointermove", move); e.strand.addEventListener("pointerup", end); e.strand.addEventListener("pointercancel", end);
  });
  e.strand.addEventListener("click", () => e.timeSlider.focus());
  function stopTrace() { if (scene.traceTimer) clearInterval(scene.traceTimer); scene.traceTimer = null; e.playTrace.textContent = "▶ Abspielen"; }
  e.playTrace.addEventListener("click", () => {
    if (scene.traceTimer) { stopTrace(); return; }
    if (scene.traceTick >= 4) scene.traceTick = 0;
    e.playTrace.textContent = "❚❚ Pausieren"; renderTrace();
    scene.traceTimer = setInterval(() => { scene.traceTick += 1; renderTrace(); if (scene.traceTick >= 4) stopTrace(); }, scene.reduced ? 1250 : 850);
  });
  e.projectionButton.addEventListener("click", () => {
    scene.fullProjection = !scene.fullProjection;
    e.projectionButton.setAttribute("aria-pressed", String(scene.fullProjection));
    e.projectionButton.textContent = scene.fullProjection ? "Renderansicht" : "Vollansicht";
    renderTrace();
  });
  byId("mergeButton").addEventListener("click", () => {
    if (!scene.trace) return;
    const preview = engine.previewMerge(scene.trace, "explore", "verify");
    e.mergeResult.textContent = "Vorschau: " + preview.status + " · Eignung " + preview.eligibility + " · Lücken " + preview.gapIds.length + " · keine Mutation.";
    setStatus("Verbindungsvorschau erstellt. Die Modellspur wurde nicht verändert.");
  });
  function renderPath(forwardOrder) {
    const contacts = forwardOrder ? [
      { from: "A", to: "B", tick: 1 }, { from: "B", to: "C", tick: 2 }
    ] : [
      { from: "B", to: "C", tick: 1 }, { from: "A", to: "B", tick: 2 }
    ];
    const answer = engine.temporalReachable(contacts, "A", "C", 0);
    byId("pathWrong").setAttribute("aria-pressed", String(!forwardOrder));
    byId("pathRight").setAttribute("aria-pressed", String(forwardOrder));
    byId("pathResult").textContent = answer.reachable ?
      "C wird bei T" + answer.arrivalTick + " erreicht · " + answer.path.length + " zeitlich passende Kontakte." :
      "C bleibt unerreichbar · B→C liegt vor dem Eintreffen bei B.";
    byId("pathResult").classList.toggle("reachable", answer.reachable);
  }
  byId("pathWrong").addEventListener("click", () => renderPath(false));
  byId("pathRight").addEventListener("click", () => renderPath(true));

  e.helpButton.addEventListener("click", () => { e.help.hidden = !e.help.hidden; e.helpButton.setAttribute("aria-expanded", String(!e.help.hidden)); });
  byId("closeHelp").addEventListener("click", () => { e.help.hidden = true; e.helpButton.setAttribute("aria-expanded", "false"); });
  function setReducedMotion(enabled) {
    scene.reduced = Boolean(enabled); e.shell.classList.toggle("reduced-motion", scene.reduced);
    e.motionButton.setAttribute("aria-pressed", String(scene.reduced));
    setStatus(scene.reduced ? "Bewegung reduziert." : "Bewegung aktiviert.");
    return scene.reduced;
  }
  e.motionButton.addEventListener("click", () => setReducedMotion(!scene.reduced));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (window.HALVETH_SOURCE_NETZ_UI?.isOpen()) window.HALVETH_SOURCE_NETZ_UI.close(); else if (foldRoom?.isOpen()) foldRoom.close(); else if (realmsRoom?.isOpen()) realmsRoom.close(); else if (!byId("scarletRoom").hidden) window.HALVETH_SCARLET_ROOM?.close(); else if (!byId("endeckRoom").hidden) window.HALVETH_ENDECK_ROOM?.close(); else if (!byId("sourcePanel").hidden) window.HALVETH_SOURCE_UI?.close(); else if (!e.netz.hidden) closeNetz(); else if (!byId("labPanel").hidden) byId("closeLab").click(); else if (!e.inspect.hidden) byId("closeInspect").click(); else if (!e.help.hidden) byId("closeHelp").click();
      return;
    }
    if (flightBlocked() || isInput(event.target) || event.target?.closest?.("button,a,[role=tab]")) return;
    const key = event.key.toLowerCase();
    if (["w", "s", "a", "d", "arrowleft", "arrowright"].includes(key)) { scene.keys.add(key); event.preventDefault(); }
  });
  document.addEventListener("keyup", (event) => scene.keys.delete(event.key.toLowerCase()));
  window.addEventListener("blur", () => scene.keys.clear());
  function stepCamera(forward, turn) {
    scene.yaw = clamp(scene.yaw + turn, -1.25, 1.25);
    scene.x = clamp(scene.x + Math.sin(scene.yaw) * forward, -20, 20);
    scene.z = clamp(scene.z + Math.cos(scene.yaw) * forward, 0, 170);
    scene.lastReadout = 0;
  }
  byId("turnLeft").addEventListener("click", () => stepCamera(0, -.16));
  byId("turnRight").addEventListener("click", () => stepCamera(0, .16));
  byId("moveForward").addEventListener("click", () => stepCamera(6, 0));
  byId("moveBack").addEventListener("click", () => stepCamera(-6, 0));
  e.stage.addEventListener("wheel", (event) => { event.preventDefault(); stepCamera(clamp(event.deltaY * .025, -8, 8), 0); }, { passive: false });
  e.stage.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    scene.pointer = { id: event.pointerId, x: event.clientX, moved: false };
    e.stage.classList.add("dragging"); e.stage.setPointerCapture?.(event.pointerId);
  });
  e.stage.addEventListener("pointermove", (event) => {
    if (!scene.pointer || scene.pointer.id !== event.pointerId) return;
    const delta = event.clientX - scene.pointer.x; scene.pointer.x = event.clientX;
    if (Math.abs(delta) > 0) { scene.pointer.moved = true; scene.yaw = clamp(scene.yaw - delta * .005, -1.15, 1.15); scene.lastReadout = 0; }
  });
  function endDrag() { scene.pointer = null; e.stage.classList.remove("dragging"); }
  e.stage.addEventListener("pointerup", endDrag); e.stage.addEventListener("pointercancel", endDrag);

  function cameraPoint(point, width, height) {
    const dz = point.z - scene.z;
    const dx = point.x - scene.x;
    const cy = Math.cos(scene.yaw), sy = Math.sin(scene.yaw);
    const x = dx * cy - dz * sy;
    const z = dx * sy + dz * cy;
    if (z <= 2) return null;
    const focal = Math.min(width * .9, height * 1.15);
    return { x: width / 2 + x * focal / z, y: height / 2 - point.y * focal / z, depth: z };
  }
  function resizeCanvas() {
    const bounds = e.stage.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    e.canvas.width = Math.max(1, Math.round(bounds.width * ratio));
    e.canvas.height = Math.max(1, Math.round(bounds.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  window.addEventListener("resize", resizeCanvas); resizeCanvas();
  function drawSpace(width, height, seconds) {
    ctx.fillStyle = "#04060d"; ctx.fillRect(0, 0, width, height);
    const hx = width * .5 - scene.yaw * width * .16 - scene.x * 2;
    const hy = height * .255;
    const glow = ctx.createRadialGradient(hx, hy, 5, hx, hy, Math.max(width, height) * .46);
    glow.addColorStop(0, "rgba(218,72,80,.16)"); glow.addColorStop(.28, "rgba(60,38,73,.2)"); glow.addColorStop(1, "rgba(2,3,9,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
    for (const star of scene.stars) {
      const pos = cameraPoint(star, width, height);
      if (!pos || pos.x < 0 || pos.x > width || pos.y < 0 || pos.y > height) continue;
      const intensity = clamp(1 - pos.depth / 240, .1, 1) * star.alpha;
      const r = star.radius * clamp(38 / pos.depth, .3, 1.7);
      ctx.fillStyle = "rgba(215,227,244," + intensity.toFixed(3) + ")";
      ctx.beginPath(); ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2); ctx.fill();
      if (!scene.reduced && pos.depth < 45 && r > 1) {
        ctx.strokeStyle = "rgba(194,211,239," + (intensity * .24).toFixed(3) + ")";
        ctx.beginPath(); ctx.moveTo(pos.x, pos.y); ctx.lineTo(pos.x + (pos.x - width / 2) * .08, pos.y + (pos.y - height / 2) * .08); ctx.stroke();
      }
    }
    // A drawn attractor is visual navigation, not a physical black-hole simulation.
    const pulse = scene.reduced ? 0 : Math.sin(seconds * .6) * .04;
    const radius = Math.min(width, height) * (.115 + pulse);
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(-.2 - scene.yaw * .09);
    for (let i = 4; i >= 0; i -= 1) {
      ctx.beginPath(); ctx.ellipse(0, 0, radius * (1.35 + i * .16), radius * (.36 + i * .055), 0, 0, Math.PI * 2);
      ctx.lineWidth = i === 0 ? 2.2 : 8 + i * 2;
      ctx.strokeStyle = i === 0 ? "rgba(255,216,172,.67)" : "rgba(229,65,79," + (.022 + (4 - i) * .018) + ")";
      ctx.shadowColor = "#f65768"; ctx.shadowBlur = 23; ctx.stroke();
    }
    ctx.shadowBlur = 0;
    const disk = ctx.createRadialGradient(-radius * .22, -radius * .16, radius * .12, 0, 0, radius);
    disk.addColorStop(0, "#020209"); disk.addColorStop(.75, "#010207"); disk.addColorStop(.92, "#10101b"); disk.addColorStop(1, "#f28c7d");
    ctx.fillStyle = disk; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    const gridY = height * .72;
    ctx.strokeStyle = "rgba(147,67,86,.12)"; ctx.lineWidth = 1;
    for (let i = -6; i <= 6; i += 1) { ctx.beginPath(); ctx.moveTo(width / 2 + i * 30, gridY); ctx.lineTo(width / 2 + i * 130, height); ctx.stroke(); }
    for (let i = 0; i < 5; i += 1) { const p = i / 5; const y = gridY + (height - gridY) * p * p; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
  }
  function updatePortals(width, height) {
    let nearest = null;
    for (const item of scene.portals) {
      const visible = scene.filteredIds.has(item.project.id);
      const p = visible ? cameraPoint(item.world, width, height) : null;
      if (!p || p.depth > (width > 850 ? 43 : 33) || p.x < 60 || p.x > width - 60 || p.y < 80 || p.y > height - 45) {
        item.button.hidden = true; continue;
      }
      item.button.hidden = false;
      item.button.style.left = p.x.toFixed(1) + "px";
      item.button.style.top = p.y.toFixed(1) + "px";
      item.button.style.setProperty("--scale", clamp(1.25 - p.depth / 90, .43, 1.35).toFixed(3));
      item.button.style.opacity = clamp(1.25 - p.depth / 150, .5, 1).toFixed(2);
      item.button.style.zIndex = String(Math.max(1, 100 - Math.round(p.depth)));
      item.button.classList.toggle("near", p.depth < 29);
      item.distance.textContent = p.depth < 29 ? "IN REICHWEITE · ÖFFNEN" : Math.round(p.depth) + " RAUMEINHEITEN";
      if (!nearest || p.depth < nearest.depth) nearest = { title: item.project.title, depth: p.depth };
    }
    const now = performance.now();
    if (now - scene.lastReadout > 300) {
      e.position.textContent = "X " + scene.x.toFixed(1) + " · Z " + scene.z.toFixed(1) + " · " + Math.round(scene.yaw * 180 / Math.PI) + "°";
      e.near.textContent = nearest ? nearest.title.toUpperCase() + " / " + Math.round(nearest.depth) : "—";
      scene.lastReadout = now;
    }
  }
  function frame(now) {
    const dt = scene.lastFrame ? clamp((now - scene.lastFrame) / 1000, 0, .06) : 0;
    scene.lastFrame = now;
    if (flightBlocked() && scene.keys.size) scene.keys.clear();
    const forward = (scene.keys.has("w") ? 1 : 0) - (scene.keys.has("s") ? 1 : 0);
    if (forward) {
      scene.x += Math.sin(scene.yaw) * dt * 13 * forward;
      scene.z += Math.cos(scene.yaw) * dt * 13 * forward;
    }
    if (scene.keys.has("a") || scene.keys.has("arrowleft")) scene.yaw -= dt * .75;
    if (scene.keys.has("d") || scene.keys.has("arrowright")) scene.yaw += dt * .75;
    scene.x = clamp(scene.x, -20, 20); scene.z = clamp(scene.z, 0, 170); scene.yaw = clamp(scene.yaw, -1.25, 1.25);
    const rect = e.stage.getBoundingClientRect();
    if (byId("scarletRoom").hidden && byId("endeckRoom").hidden && !realmsRoom?.isOpen() && !foldRoom?.isOpen() && !window.HALVETH_SOURCE_NETZ_UI?.isOpen()) {
      drawSpace(rect.width, rect.height, now / 1000);
      updatePortals(rect.width, rect.height);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.HALVETH_APP = Object.freeze({ getProject: () => projects.find((p) => p.id === scene.activeId) || null, setStatus, closeTrace: closeNetz, cancelWarp, returnToCosmos: closeInspect, reducedMotion: () => scene.reduced, setReducedMotion });
})();
