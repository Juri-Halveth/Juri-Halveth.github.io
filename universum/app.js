(function () {
  "use strict";
  const catalog = window.HALVETH_CATALOG;
  const engine = window.NETZ_ENGINE;
  const flight = window.HALVETH_FLIGHT_MODEL;
  const teasers = window.HALVETH_TEASERS;
  const briefs = window.HALVETH_BRIEFS;
  const byId = (id) => document.getElementById(id);
  if (!catalog || catalog.schema !== "halveth.portal.catalog.v1" || !Array.isArray(catalog.projects) || !engine || !flight
    || !teasers || teasers.schema !== "halveth.teasers.v1" || !teasers.entries
    || !briefs || briefs.schema !== "halveth.project-briefs.v1" || !briefs.entries) {
    byId("statusMessage").textContent = "Katalog, Vorschauen, Flugraum oder NETZ-Modell fehlt.";
    return;
  }

  const projects = catalog.projects.filter((p) => p.visibility === "public" && typeof p.id === "string");
  if (projects.length !== flight.PROJECT_IDS.length || projects.some((project, index) => project.id !== flight.PROJECT_IDS[index])
    || catalog.categories.length !== flight.TOPIC_IDS.length || catalog.categories.some((category, index) => category.id !== flight.TOPIC_IDS[index])
    || Object.keys(teasers.entries).length !== projects.length || Object.keys(briefs.entries).length !== projects.length || projects.some((project) => {
      const entry = teasers.entries[project.id];
      const brief = briefs.entries[project.id];
      return !brief || brief.id !== project.id || !brief.core || !brief.value || !brief.boundary || !brief.state
        || !entry || entry.id !== project.id || !entry.media || !/^assets\/(?:teasers|previews)\/[a-z0-9._/-]+$/i.test(entry.media.src)
        || !Array.isArray(entry.steps) || entry.steps.length !== 3;
    })) {
    byId("statusMessage").textContent = "Flugraum, Vorschauen und öffentlicher Katalog haben unterschiedliche Identitäten.";
    return;
  }
  const categories = new Map(catalog.categories.map((category) => [category.id, category]));
  const e = {
    shell: byId("appShell"), stage: byId("spaceStage"), canvas: byId("spaceCanvas"), layer: byId("portalLayer"),
    sideRail: byId("sideRail"), catalogToggle: byId("catalogToggle"), catalogClose: byId("catalogClose"),
    travelProgress: byId("travelProgress"),
    projectList: byId("projectList"), search: byId("projectSearch"), filter: byId("categoryFilter"),
    visibleCount: byId("visibleCount"), catalogCount: byId("catalogCount"), position: byId("positionReadout"),
    near: byId("nearReadout"), status: byId("statusMessage"), sceneMode: byId("sceneMode"),
    inspect: byId("inspectPanel"), inspectTitle: byId("inspectTitle"), inspectTagline: byId("inspectTagline"),
    inspectDescription: byId("inspectDescription"), inspectKind: byId("inspectKind"), inspectEvidence: byId("inspectEvidence"),
    inspectCategory: byId("inspectCategory"), inspectOpen: byId("inspectOpen"), inspectSource: byId("inspectSource"),
    inspectDeep: byId("inspectDeep"), inspectHeroModel: byId("inspectHeroModel"),
    inspectTeaser: byId("inspectTeaser"), inspectTeaserTitle: byId("inspectTeaserTitle"),
    inspectTeaserStep: byId("inspectTeaserStep"), inspectTeaserIndex: byId("inspectTeaserIndex"),
    inspectTeaserPrev: byId("inspectTeaserPrev"), inspectTeaserNext: byId("inspectTeaserNext"),
    warp: byId("warp"), help: byId("helpPanel"), helpButton: byId("helpButton"),
    netz: byId("netzPanel"), traceProject: byId("traceProject"), traceTick: byId("traceTick"),
    timeSlider: byId("timeSlider"), playTrace: byId("playTrace"), projectionButton: byId("projectionButton"),
    strand: byId("strandSvg"), gripExplore: byId("gripExplore"), gripVerify: byId("gripVerify"),
    branchReveal: byId("branchReveal"), eventState: byId("eventState"), eventTitle: byId("eventTitle"),
    eventDetail: byId("eventDetail"), mergeResult: byId("mergeResult"), motionButton: byId("motionButton")
  };

  const scene = {
    z: 0, previousZ: 0, keys: new Set(), pointers: new Map(), pinchDistance: null,
    activeId: null, filteredIds: new Set(), lastTriggerKind: "portal",
    trace: null, traceTick: 0, traceTimer: null, fullProjection: false, focusBranch: null,
    reduced: window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    lastFrame: 0, lastReadout: -Infinity, stars: flight.stars(1150, 3491), portals: [], topics: []
  };
  let realmsRoom = null;
  let foldRoom = null;
  const ctx = e.canvas.getContext("2d", { alpha: false });
  e.catalogCount.textContent = projects.length + " EINSTIEGE · " + catalog.categories.length + " THEMEN";
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
  function clear(element) { while (element.firstChild) element.removeChild(element.firstChild); }
  let netzBackgroundInert = false;
  function syncLayerInert() {
    const atlasOpen = e.shell.classList.contains("catalog-open");
    const modalOpen = netzBackgroundInert || !byId("labPanel").hidden || !byId("sourcePanel").hidden;
    e.stage.inert = atlasOpen || !e.inspect.hidden || modalOpen;
    e.sideRail.inert = !atlasOpen || modalOpen;
    e.inspect.inert = atlasOpen || modalOpen;
    document.querySelector(".topbar").inert = !e.inspect.hidden || modalOpen;
    document.querySelector(".statusbar").inert = !e.inspect.hidden || modalOpen;
  }
  function setCatalogOpen(open) {
    const shown = Boolean(open);
    if (!shown && e.sideRail.contains(document.activeElement)) e.catalogToggle.focus();
    e.shell.classList.toggle("catalog-open", shown);
    e.catalogToggle.setAttribute("aria-expanded", String(shown));
    e.sideRail.setAttribute("aria-hidden", String(!shown));
    syncLayerInert();
  }
  e.catalogToggle.addEventListener("click", () => {
    const open = !e.shell.classList.contains("catalog-open");
    setCatalogOpen(open);
    if (open) e.search.focus();
  });
  e.catalogClose.addEventListener("click", () => setCatalogOpen(false));
  setCatalogOpen(false);
  function flightBlocked() {
    return e.shell.classList.contains("catalog-open") || !e.inspect.hidden || !e.netz.hidden || !byId("sourcePanel").hidden || !byId("labPanel").hidden || !byId("scarletRoom").hidden || !byId("endeckRoom").hidden || Boolean(realmsRoom?.isOpen()) || Boolean(foldRoom?.isOpen()) || Boolean(window.HALVETH_SOURCE_NETZ_UI?.isOpen()) || !e.help.hidden;
  }

  // Stable synthetic coordinates are visual navigation only, not project history or physical space.
  scene.portals = projects.map((project, index) => {
    const identity = flight.identity(project.id, index);
    const button = document.createElement("button");
    button.type = "button"; button.className = "portal";
    button.dataset.projectId = project.id;
    button.dataset.signature = identity.signature;
    button.dataset.range = "far";
    if (project.site?.editorial_state === "WITHDRAWN_FROM_PORTFOLIO") button.dataset.editorialState = "source-only";
    button.setAttribute("aria-label", project.title + " als Projektportal öffnen");
    button.style.setProperty("--hue", String(identity.hue));
    const art = document.createElement("span"); art.className = "portal-art"; art.setAttribute("aria-hidden", "true");
    const glyph = document.createElement("span"); glyph.className = "portal-glyph"; glyph.textContent = identity.glyph;
    art.appendChild(glyph);
    const copy = document.createElement("span"); copy.className = "portal-copy";
    const kicker = document.createElement("span"); kicker.className = "portal-kicker"; kicker.textContent = categoryOf(project).short;
    const title = document.createElement("span"); title.className = "portal-title"; title.textContent = project.title;
    const distance = document.createElement("span"); distance.className = "portal-distance"; distance.textContent = "ANNÄHERN / ÖFFNEN";
    copy.append(kicker, title, distance); button.append(art, copy);
    button.addEventListener("click", (event) => warpTo(project, event.currentTarget, "portal"));
    e.layer.appendChild(button);
    const world = { id: project.id, ...flight.projectWorld(index) };
    return { project, identity, world, button, kicker, distance };
  });

  scene.topics = catalog.categories.map((category, index) => {
    const identity = flight.topicIdentity(category.id);
    const button = document.createElement("button");
    button.type = "button"; button.className = "topic-beacon";
    button.dataset.signature = identity.signature;
    button.setAttribute("aria-label", "Themenraum " + category.label + " filtern");
    button.style.setProperty("--hue", String(identity.hue));
    const glyph = document.createElement("span"); glyph.className = "topic-glyph"; glyph.textContent = identity.glyph;
    const label = document.createElement("span"); label.className = "topic-label"; label.textContent = category.label;
    button.append(glyph, label);
    button.addEventListener("click", () => {
      e.filter.value = category.id;
      renderList();
      setCatalogOpen(true);
      e.search.focus();
      setStatus(category.label + " als Themenraum gefiltert.");
    });
    e.layer.appendChild(button);
    return { category, world: { id: "topic-" + category.id, ...flight.topicWorld(index) }, button };
  });

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
      button.style.setProperty("--hue", String(flight.identity(project.id).hue));
      if (project.site?.editorial_state === "WITHDRAWN_FROM_PORTFOLIO") button.dataset.editorialState = "source-only";
      button.setAttribute("aria-label", project.title + " · " + categoryLabels(project) + " · Projektportal öffnen");
      if (scene.activeId === project.id) button.classList.add("active");
      const preview = document.createElement("span"); preview.className = "list-preview";
      const previewImage = document.createElement("img");
      previewImage.src = teasers.entries[project.id].media.src; previewImage.alt = "";
      previewImage.loading = "lazy"; previewImage.decoding = "async";
      preview.appendChild(previewImage);
      const glyph = document.createElement("span"); glyph.className = "list-glyph";
      glyph.setAttribute("aria-hidden", "true"); glyph.textContent = flight.identity(project.id).glyph;
      const number = document.createElement("span"); number.className = "list-index"; number.textContent = String(index + 1).padStart(2, "0");
      const label = document.createElement("span"); label.className = "list-label";
      const title = document.createElement("strong"); title.textContent = project.title;
      const small = document.createElement("small"); small.textContent = categoryLabels(project)
        + (project.site?.editorial_state === "WITHDRAWN_FROM_PORTFOLIO" ? " · Quelle/Lab" : "");
      const arrow = document.createElement("span"); arrow.className = "list-arrow"; arrow.setAttribute("aria-hidden", "true"); arrow.textContent = "↗";
      label.append(title, small); button.append(preview, glyph, number, label, arrow);
      button.addEventListener("click", (event) => warpTo(project, event.currentTarget, "list"));
      e.projectList.appendChild(button);
    });
    e.visibleCount.textContent = scene.filteredIds.size + " / " + projects.length;
    const active = projects.find((project) => project.id === scene.activeId);
    if (active) e.inspectCategory.textContent = categoryLabels(active).toUpperCase();
    if (scene.filteredIds.size === 0) {
      const empty = document.createElement("p"); empty.className = "empty-list"; empty.textContent = "Kein Portal in dieser Auswahl.";
      e.projectList.appendChild(empty);
    }
    scene.dirty = true;
  }
  e.search.addEventListener("input", renderList);
  e.filter.addEventListener("change", renderList);
  renderList();

  let previewSet = [];
  let previewIndex = 0;
  let teaserSteps = [];
  let teaserIndex = 0;
  function renderPreview() {
    const preview = previewSet[previewIndex];
    byId("inspectImage").src = preview.src;
    byId("inspectImage").alt = preview.alt;
    byId("inspectArtLabel").textContent = preview.label;
    const source = byId("inspectImageSource");
    source.hidden = !preview.source;
    if (preview.source) { source.href = safeHref(preview.source); source.textContent = preview.credit; }
    byId("inspectImageNext").hidden = previewSet.length < 2;
  }
  function renderTeaser() {
    const step = teaserSteps[teaserIndex];
    if (!step) return;
    e.inspectTeaserTitle.textContent = step.title;
    e.inspectTeaserStep.textContent = step.detail;
    e.inspectTeaserIndex.textContent = String(teaserIndex + 1).padStart(2, "0") + " / " + String(teaserSteps.length).padStart(2, "0");
    e.inspectTeaser.dataset.step = String(teaserIndex + 1);
  }
  e.inspectTeaserPrev.addEventListener("click", () => {
    teaserIndex = (teaserIndex + teaserSteps.length - 1) % teaserSteps.length;
    renderTeaser();
  });
  e.inspectTeaserNext.addEventListener("click", () => {
    teaserIndex = (teaserIndex + 1) % teaserSteps.length;
    renderTeaser();
  });
  const heroModelButtons = {
    "halveth-scarlet": ["scarletRoomButton", "SCARLET-Zellraum betreten"],
    "halveth-forschungslabor": ["endeckRoomButton", "ENDECK-Modell betreten"],
    "halveth-field-difference-lab": ["fieldRoomButton", "Grenzregeln ausprobieren"],
    "halveth-realms": ["realmsRoomButton", "REALMS-Weltmodell betreten"]
  };
  e.inspectHeroModel.addEventListener("click", () => {
    const target = heroModelButtons[scene.activeId]?.[0];
    if (!target) return;
    e.inspectDeep.open = true;
    byId(target).click();
  });
  byId("inspectImageNext").addEventListener("click", () => {
    previewIndex = (previewIndex + 1) % previewSet.length;
    renderPreview();
  });

  function openInspect(project, origin) {
    setCatalogOpen(false);
    if (!e.netz.hidden) closeNetz();
    window.HALVETH_SOURCE_UI?.setProject(project.id);
    window.HALVETH_PORTAL_TIME_UI?.setProject(project.id);
    byId("sourceNetzButton").hidden = !window.HALVETH_SOURCE_NETZ_UI?.setProject(project.id);
    scene.activeId = project.id;
    e.inspectCategory.textContent = categoryLabels(project).toUpperCase();
    e.inspectTitle.textContent = project.title;
    e.inspectTagline.textContent = project.tagline;
    e.inspectDescription.textContent = project.description;
    const brief = briefs.entries[project.id];
    byId("inspectState").textContent = brief.state;
    byId("inspectCore").textContent = brief.presentation?.core || brief.core;
    byId("inspectValue").textContent = brief.presentation?.value || brief.value;
    byId("inspectBoundary").textContent = brief.presentation?.boundary || brief.boundary;
    for (const [elementId, field, label] of [["inspectLocal", "local", "SEPARATER LOKALER PROTOTYP"], ["inspectGoal", "goal", "ZIELBILD"]]) {
      const element = byId(elementId);
      element.hidden = !brief[field];
      element.textContent = brief[field] ? (brief.presentation?.[field] || label + " · " + brief[field]) : "";
    }
    for (const [elementId, field, label] of [["inspectLocalDetail", "local", "Separates lokales Labor: "], ["inspectServerDetail", "server", "Separater Loopback-Prototyp: "], ["inspectGoalDetail", "goal", "Entwicklungsziel: "]]) {
      const element = byId(elementId);
      element.hidden = !brief[field];
      element.textContent = brief[field] ? label + brief[field] : "";
    }
    const teaser = teasers.entries[project.id];
    previewSet = [teaser.media];
    previewIndex = 0;
    renderPreview();
    teaserSteps = teaser.steps;
    teaserIndex = 0;
    renderTeaser();
    e.inspect.dataset.projectId = project.id;
    e.inspect.dataset.mediaKind = teaser.media.kind;
    e.inspect.style.setProperty("--focus-origin-x", origin.x.toFixed(1) + "px");
    e.inspect.style.setProperty("--focus-origin-y", origin.y.toFixed(1) + "px");
    e.inspect.style.setProperty("--focus-hue", String(flight.identity(project.id).hue));
    e.inspectDeep.open = false;
    e.inspectKind.textContent = project.kind;
    e.inspectEvidence.textContent = project.evidence + (project.reviewed ? " · redaktionell geprüft" : " · Funktion offen")
      + (project.site?.editorial_state === "WITHDRAWN_FROM_PORTFOLIO" ? " · aus aktivem Portfolio zurückgezogen; Quelle/Lab" : "");
    byId("inspectOrigin").textContent = "Öffentlicher Katalog, " + catalog.source_date;
    const tech = [brief.core, brief.boundary];
    const techList = byId("inspectTech"); clear(techList);
    tech.forEach((item) => { const li = document.createElement("li"); li.textContent = item; techList.appendChild(li); });
    e.inspectOpen.href = safeHref(project.url);
    e.inspectOpen.firstChild.textContent = project.site?.status === "RELEASE_ENTRY" ? "Windows-Vorschau öffnen "
      : project.site?.editorial_state === "WITHDRAWN_FROM_PORTFOLIO" ? "Quellen ansehen " : "Projekt öffnen ";
    const heroModel = heroModelButtons[project.id];
    e.inspectHeroModel.hidden = !heroModel;
    if (heroModel) e.inspectHeroModel.firstChild.textContent = heroModel[1] + " ";
    const direct = byId("inspectDirect");
    direct.hidden = project.id !== "halveth-forschungslabor";
    if (!direct.hidden) direct.href = "https://juri-halveth.github.io/halveth-forschungslabor/endeck/";
    const subspaces = byId("inspectSubspaces"); clear(subspaces);
    for (const space of (project.site?.subspaces || []).filter(row => row.availability === undefined || row.availability === "PUBLISHED")) {
      const link = document.createElement("a");
      link.href = safeHref(space.url);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = space.label.de + " ↗";
      link.title = space.description.de;
      subspaces.appendChild(link);
    }
    subspaces.hidden = subspaces.childElementCount === 0;
    byId("scarletRoomButton").hidden = project.id !== "halveth-scarlet";
    byId("endeckRoomButton").hidden = project.id !== "halveth-forschungslabor";
    byId("foldRoomButton").hidden = project.id !== "halveth-forschungslabor";
    byId("realmsRoomButton").hidden = project.id !== "halveth-realms";
    byId("fieldRoomButton").hidden = project.id !== "halveth-field-difference-lab";
    e.inspectSource.href = safeHref(project.source_url);
    e.inspect.hidden = false;
    syncLayerInert();
    e.help.hidden = true; e.helpButton.setAttribute("aria-expanded", "false");
    e.sceneMode.textContent = "PROJEKTFOKUS";
    renderList();
    setStatus(project.title + " im Fokus. Projektlink erst nach eigenem Klick geöffnet.");
    e.inspectTitle.focus?.();
  }
  let warpToken = 0;
  function cancelWarp() { warpToken += 1; e.warp.classList.remove("active"); }
  function warpTo(project, trigger, kind) {
    if (!project || !scene.filteredIds.has(project.id)) return;
    scene.lastTriggerKind = kind;
    const stageRect = e.stage.getBoundingClientRect();
    const triggerRect = trigger?.getBoundingClientRect();
    const origin = triggerRect ? {
      x: clamp((triggerRect.left + triggerRect.right) / 2 - stageRect.left, 0, stageRect.width),
      y: clamp((triggerRect.top + triggerRect.bottom) / 2 - stageRect.top, 0, stageRect.height)
    } : { x: stageRect.width / 2, y: stageRect.height / 2 };
    const token = ++warpToken;
    e.warp.classList.remove("active");
    void e.warp.offsetWidth;
    e.warp.classList.add("active");
    setTimeout(() => { if (token === warpToken && byId("labPanel").hidden && byId("sourcePanel").hidden && e.netz.hidden) openInspect(project, origin); }, scene.reduced ? 0 : 340);
    setTimeout(() => { if (token === warpToken) e.warp.classList.remove("active"); }, scene.reduced ? 20 : 900);
  }
  function closeInspect() {
    const oldId = scene.activeId;
    closeNetz(); window.HALVETH_SOURCE_UI?.close(); e.inspect.hidden = true; scene.activeId = null;
    syncLayerInert();
    e.sceneMode.textContent = "FLUGMODUS"; renderList(); setStatus("Zurück im Flugraum.");
    if (scene.lastTriggerKind === "list") setCatalogOpen(true);
    const stageRect = e.stage.getBoundingClientRect();
    updatePortals(stageRect.width, stageRect.height);
    const listTarget = Array.from(e.projectList.querySelectorAll(".list-item")).find((item) => item.dataset.projectId === oldId);
    const portalTarget = scene.portals.find((item) => item.project.id === oldId)?.button;
    const target = scene.lastTriggerKind === "list" || !portalTarget || portalTarget.hidden ? listTarget : portalTarget;
    target?.focus();
  }
  byId("closeInspect").addEventListener("click", closeInspect);
  e.inspect.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const items = Array.from(e.inspect.querySelectorAll("button:not([disabled]), a[href], input:not([disabled]), summary"))
      .filter((element) => !element.hidden && element.getClientRects().length > 0);
    if (!items.length) return;
    if (event.shiftKey && (document.activeElement === items[0] || document.activeElement === e.inspectTitle)) {
      items.at(-1).focus(); event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
      items[0].focus(); event.preventDefault();
    }
  });
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
    netzBackgroundInert = Boolean(enabled);
    syncLayerInert();
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
    scene.dirty = true;
    return scene.reduced;
  }
  e.motionButton.addEventListener("click", () => setReducedMotion(!scene.reduced));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (window.HALVETH_SOURCE_NETZ_UI?.isOpen()) window.HALVETH_SOURCE_NETZ_UI.close(); else if (foldRoom?.isOpen()) foldRoom.close(); else if (realmsRoom?.isOpen()) realmsRoom.close(); else if (!byId("scarletRoom").hidden) window.HALVETH_SCARLET_ROOM?.close(); else if (!byId("endeckRoom").hidden) window.HALVETH_ENDECK_ROOM?.close(); else if (!byId("sourcePanel").hidden) window.HALVETH_SOURCE_UI?.close(); else if (!e.netz.hidden) closeNetz(); else if (!byId("labPanel").hidden) byId("closeLab").click(); else if (!e.inspect.hidden) byId("closeInspect").click(); else if (!e.help.hidden) byId("closeHelp").click(); else if (e.shell.classList.contains("catalog-open")) setCatalogOpen(false);
      return;
    }
    if (flightBlocked() || isInput(event.target) || event.target?.closest?.("button,a,[role=tab]")) return;
    const key = event.key.toLowerCase();
    if (["w", "s", "arrowup", "arrowdown"].includes(key)) { scene.keys.add(key); event.preventDefault(); }
  });
  document.addEventListener("keyup", (event) => scene.keys.delete(event.key.toLowerCase()));
  window.addEventListener("blur", () => { scene.keys.clear(); scene.pointers.clear(); scene.pinchDistance = null; });
  function moveTravel(distance) {
    if (!Number.isFinite(distance)) return;
    scene.z = flight.clampTravel(scene.z + distance);
    scene.lastReadout = -Infinity;
    scene.dirty = true;
  }
  byId("moveForward").addEventListener("click", () => moveTravel(7));
  byId("moveBack").addEventListener("click", () => moveTravel(-7));
  e.stage.addEventListener("wheel", (event) => {
    if (flightBlocked()) return;
    event.preventDefault();
    const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? e.stage.clientHeight : 1);
    moveTravel(clamp(pixels * .035, -14, 14));
  }, { passive: false });
  e.stage.addEventListener("pointerdown", (event) => {
    if (flightBlocked() || event.button !== 0 || event.target.closest("button,a,input,select")) return;
    scene.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    scene.pinchDistance = null;
    e.stage.classList.add("dragging"); e.stage.setPointerCapture?.(event.pointerId);
  });
  e.stage.addEventListener("pointermove", (event) => {
    if (flightBlocked()) { scene.pointers.clear(); scene.pinchDistance = null; return; }
    const previous = scene.pointers.get(event.pointerId);
    if (!previous) return;
    scene.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (scene.pointers.size > 1) {
      const [a, b] = [...scene.pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (scene.pinchDistance !== null) moveTravel(clamp((distance - scene.pinchDistance) * .11, -7, 7));
      scene.pinchDistance = distance;
    } else {
      scene.pinchDistance = null;
      moveTravel(clamp((previous.y - event.clientY) * .085, -6, 6));
    }
  });
  function endDrag(event) {
    scene.pointers.delete(event.pointerId);
    scene.pinchDistance = null;
    if (!scene.pointers.size) e.stage.classList.remove("dragging");
  }
  e.stage.addEventListener("pointerup", endDrag); e.stage.addEventListener("pointercancel", endDrag);
  e.stage.addEventListener("lostpointercapture", endDrag);

  function cameraPoint(point, width, height) {
    return flight.projectPoint(point, scene.z, width, height);
  }
  function resizeCanvas() {
    const bounds = e.stage.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    e.canvas.width = Math.max(1, Math.round(bounds.width * ratio));
    e.canvas.height = Math.max(1, Math.round(bounds.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    scene.dirty = true;
  }
  window.addEventListener("resize", resizeCanvas); resizeCanvas();
  function drawSpace(width, height) {
    const cx = width / 2, cy = height / 2;
    const span = Math.max(width, height);
    const focal = Math.min(width * .98, height * 1.35);
    const movement = scene.z - scene.previousZ;
    ctx.fillStyle = "#02040a"; ctx.fillRect(0, 0, width, height);

    // Layered matter and incomplete curved filaments create depth without a visible ball.
    const atmosphere = ctx.createRadialGradient(cx, cy, 12, cx, cy, span * .74);
    atmosphere.addColorStop(0, "#01030a");
    atmosphere.addColorStop(.16, "#07101e");
    atmosphere.addColorStop(.49, "#0a1221");
    atmosphere.addColorStop(1, "#02040a");
    ctx.fillStyle = atmosphere; ctx.fillRect(0, 0, width, height);
    const cloudA = ctx.createRadialGradient(width * .29, height * .62, 5, width * .29, height * .62, span * .42);
    cloudA.addColorStop(0, "rgba(34,116,144,.105)"); cloudA.addColorStop(1, "rgba(34,116,144,0)");
    ctx.fillStyle = cloudA; ctx.fillRect(0, 0, width, height);
    const cloudB = ctx.createRadialGradient(width * .72, height * .29, 5, width * .72, height * .29, span * .38);
    cloudB.addColorStop(0, "rgba(145,71,112,.095)"); cloudB.addColorStop(1, "rgba(145,71,112,0)");
    ctx.fillStyle = cloudB; ctx.fillRect(0, 0, width, height);

    for (let line = 0; line < 14; line += 1) {
      const angle = line * Math.PI * 2 / 14 + .09;
      const reach = span * .77;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * 25, cy + Math.sin(angle) * 25);
      ctx.bezierCurveTo(
        cx + Math.cos(angle + .24) * reach * .23, cy + Math.sin(angle + .24) * reach * .23,
        cx + Math.cos(angle - .13) * reach * .61, cy + Math.sin(angle - .13) * reach * .61,
        cx + Math.cos(angle) * reach, cy + Math.sin(angle) * reach
      );
      ctx.strokeStyle = line % 3 === 0 ? "rgba(172,121,158,.052)" : "rgba(105,166,193,.045)";
      ctx.lineWidth = 1; ctx.stroke();
    }
    const firstWave = Math.ceil((scene.z + 5) / 17) * 17;
    for (let worldZ = firstWave; worldZ < scene.z + 185; worldZ += 17) {
      const depth = worldZ - scene.z;
      const radius = focal * 11.5 / depth;
      if (radius < 22 || radius > span * 1.25) continue;
      const alpha = clamp((1 - depth / 190) * .11, .008, .09);
      for (let arc = 0; arc < 3; arc += 1) {
        const start = arc * Math.PI * 2 / 3 + .25;
        ctx.beginPath();
        ctx.ellipse(cx, cy, radius * 1.26, radius * .84, .08, start, start + .83);
        ctx.strokeStyle = arc === 1 ? "rgba(220,142,164," + alpha.toFixed(3) + ")" : "rgba(124,198,217," + alpha.toFixed(3) + ")";
        ctx.lineWidth = clamp(2.4 - depth / 110, .7, 2.1);
        ctx.stroke();
      }
    }

    for (let index = 0; index < scene.stars.length; index += 1) {
      const star = scene.stars[index];
      const pos = cameraPoint(star, width, height);
      if (!pos || pos.depth > 325 || pos.x < -25 || pos.x > width + 25 || pos.y < -25 || pos.y > height + 25) continue;
      const intensity = star.alpha * clamp(1.17 - pos.depth / 390, .2, 1);
      const radius = star.radius * clamp(42 / pos.depth, .47, 2.8);
      if (!scene.reduced && Math.abs(movement) > .06 && pos.depth < 155) {
        const before = flight.projectPoint(star, scene.previousZ, width, height);
        if (before) {
          ctx.beginPath(); ctx.moveTo(before.x, before.y); ctx.lineTo(pos.x, pos.y);
          ctx.strokeStyle = star.kind === "star" ? "rgba(211,236,247," + clamp(intensity * .47, .04, .5).toFixed(3) + ")" : "rgba(148,195,215," + clamp(intensity * .25, .02, .18).toFixed(3) + ")";
          ctx.lineWidth = star.kind === "star" ? Math.max(.55, radius * .65) : .6;
          ctx.stroke();
        }
      }
      if (star.kind === "star" && pos.depth < 80 && index % 3 === 0) {
        const bloomRadius = Math.max(3, radius * 5);
        const bloom = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, bloomRadius);
        bloom.addColorStop(0, "rgba(201,229,249," + clamp(intensity * .18, .04, .18).toFixed(3) + ")");
        bloom.addColorStop(1, "rgba(201,229,249,0)");
        ctx.fillStyle = bloom; ctx.beginPath(); ctx.arc(pos.x, pos.y, bloomRadius, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = star.kind === "star" ? "rgba(224,240,250," + intensity.toFixed(3) + ")"
        : index % 5 === 0 ? "rgba(228,160,194," + intensity.toFixed(3) + ")"
          : "rgba(151,197,220," + intensity.toFixed(3) + ")";
      ctx.beginPath(); ctx.arc(pos.x, pos.y, Math.max(.25, radius), 0, Math.PI * 2); ctx.fill();
    }

    // The center is an almost invisible occlusion, not a simulated event horizon.
    const shadowRadius = clamp(Math.min(width, height) * .041, 12, 31);
    const shadow = ctx.createRadialGradient(cx, cy, 0, cx, cy, shadowRadius * 2.8);
    shadow.addColorStop(0, "#000107"); shadow.addColorStop(.38, "#000107");
    shadow.addColorStop(.72, "rgba(1,3,9,.88)"); shadow.addColorStop(1, "rgba(1,3,9,0)");
    ctx.fillStyle = shadow; ctx.beginPath(); ctx.arc(cx, cy, shadowRadius * 2.8, 0, Math.PI * 2); ctx.fill();
  }
  function updatePortals(width, height) {
    let nearest = null;
    const compact = width <= 470;
    const occupied = [];
    const stageBounds = compact ? e.stage.getBoundingClientRect() : null;
    let focusedCard = false;
    let focusEntity = null;
    if (compact) {
      for (const selector of [".flight-prompt", ".flight-readout", ".flight-controls", ".travel-meter"]) {
        const rect = e.stage.querySelector(selector)?.getBoundingClientRect();
        if (rect?.width && rect.height) occupied.push(rect);
      }
    }
    function occluded(rect) {
      return occupied.some((other) => rect.left < other.right + 5 && rect.right + 5 > other.left
        && rect.top < other.bottom + 5 && rect.bottom + 5 > other.top);
    }
    // Keep the same depth and radial direction on small screens, but move distant
    // glyphs outward in screen space until their touch targets no longer overlap.
    function placeCompact(button, point, canSpread) {
      const dx = point.x - width / 2, dy = point.y - height / 2;
      const length = Math.hypot(dx, dy) || 1;
      for (let step = 0; step <= (canSpread ? 12 : 0); step += 1) {
        const shift = step * 19;
        button.style.left = (point.x + dx / length * shift).toFixed(1) + "px";
        button.style.top = (point.y + dy / length * shift).toFixed(1) + "px";
        const rect = button.getBoundingClientRect();
        if (rect.left < stageBounds.left + 4 || rect.right > stageBounds.right - 4
          || rect.top < stageBounds.top + 4 || rect.bottom > stageBounds.bottom - 4 || occluded(rect)) continue;
        occupied.push(rect);
        return true;
      }
      button.hidden = true;
      return false;
    }
    for (const item of scene.portals) {
      const visible = scene.filteredIds.has(item.project.id);
      const p = visible ? cameraPoint(item.world, width, height) : null;
      if (!p || p.depth > 138 || p.x < -40 || p.x > width + 40 || p.y < -40 || p.y > height + 40) {
        item.button.hidden = true; continue;
      }
      const projectedRange = p.depth < 32 ? "near" : p.depth < 76 ? "mid" : "far";
      const range = compact && focusedCard ? "far" : projectedRange;
      item.button.hidden = false;
      item.button.dataset.range = range;
      item.button.style.left = p.x.toFixed(1) + "px";
      item.button.style.top = p.y.toFixed(1) + "px";
      const scale = range === "near" ? clamp(27 / p.depth, .78, 1.26)
        : range === "mid" ? clamp(43 / p.depth, .61, .9) : clamp(65 / p.depth, .42, .68);
      item.button.style.setProperty("--scale", scale.toFixed(3));
      item.button.style.opacity = clamp((155 - p.depth) / 47, .38, 1).toFixed(2);
      item.button.style.zIndex = String(Math.max(1, 300 - Math.round(p.depth)));
      item.button.classList.toggle("near", range === "near");
      if (compact && !placeCompact(item.button, p, range === "far")) continue;
      if (compact && range !== "far") {
        focusedCard = true;
        focusEntity = { title: item.project.title, depth: p.depth };
      }
      item.distance.textContent = range === "near"
        ? (item.project.site?.editorial_state === "WITHDRAWN_FROM_PORTFOLIO" ? "QUELLE / LAB ÖFFNEN" : item.project.action.toUpperCase())
        : Math.round(p.depth) + " RAUMEINHEITEN";
      if (!nearest || p.depth < nearest.depth) nearest = { title: item.project.title, depth: p.depth };
    }
    for (const item of scene.topics) {
      const p = cameraPoint(item.world, width, height);
      if (!p || p.depth > 125 || p.x < -30 || p.x > width + 30 || p.y < -30 || p.y > height + 30) {
        item.button.hidden = true; continue;
      }
      item.button.hidden = false;
      item.button.style.left = p.x.toFixed(1) + "px";
      item.button.style.top = p.y.toFixed(1) + "px";
      item.button.style.setProperty("--scale", clamp(40 / p.depth, .68, 1.35).toFixed(3));
      item.button.style.opacity = clamp((144 - p.depth) / 57, .35, .93).toFixed(2);
      item.button.style.zIndex = String(Math.max(1, 260 - Math.round(p.depth)));
      if (compact && !placeCompact(item.button, p, true)) continue;
    }
    const now = performance.now();
    if (now - scene.lastReadout > 300) {
      e.position.textContent = scene.z.toFixed(1) + " / " + flight.MAX_TRAVEL + " RAUMEINHEITEN";
      const inView = focusEntity || nearest;
      e.near.textContent = inView ? inView.title.toUpperCase() + " / " + Math.round(inView.depth) : "—";
      e.travelProgress.style.width = (scene.z / flight.MAX_TRAVEL * 100).toFixed(1) + "%";
      scene.lastReadout = now;
    }
  }
  function frame(now) {
    const dt = scene.lastFrame ? clamp((now - scene.lastFrame) / 1000, 0, .06) : 0;
    scene.lastFrame = now;
    if (flightBlocked() && scene.keys.size) scene.keys.clear();
    const forward = (scene.keys.has("w") || scene.keys.has("arrowup") ? 1 : 0)
      - (scene.keys.has("s") || scene.keys.has("arrowdown") ? 1 : 0);
    if (forward) moveTravel(dt * 20 * forward);
    const rect = e.stage.getBoundingClientRect();
    if ((scene.dirty || scene.z !== scene.previousZ) && byId("scarletRoom").hidden && byId("endeckRoom").hidden && !realmsRoom?.isOpen() && !foldRoom?.isOpen() && !window.HALVETH_SOURCE_NETZ_UI?.isOpen()) {
      drawSpace(rect.width, rect.height);
      updatePortals(rect.width, rect.height);
      scene.previousZ = scene.z;
      scene.dirty = false;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.HALVETH_APP = Object.freeze({ getProject: () => projects.find((p) => p.id === scene.activeId) || null, setStatus, closeTrace: closeNetz, cancelWarp, returnToCosmos: closeInspect, reducedMotion: () => scene.reduced, setReducedMotion, syncLayerInert });
})();
