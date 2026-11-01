/* Local cockpit projection of a separate, pinned GStarLiving run. No external action path. */
(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else {
    root.HALVETH_SCARLET_COCKPIT = api;
    if (typeof document === "object") api.mount(root, document);
  }
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";
  const SEED = 3491;
  const STEP_MS = 500;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const RESHAPE_ASPECTS = Object.freeze([1, 2, .5, 1.6]);

  function validateReshapeReport(report, aspect, id) {
    if (!report || report.kind !== "SCARLET_LOCAL_WORLD_RESHAPE_WITNESS" ||
      report.claimCeiling !== "LOCAL_SYNTHETIC_WORLD_RESHAPE_WITNESS_ONLY" ||
      (report.status !== "RESHAPED" && report.status !== "NO_CHANGE") ||
      report.request?.aspect !== aspect || report.request?.selectedId !== id ||
      report.source?.seed !== SEED || report.source?.digestKind !== "ADAPTER_DERIVED_FULL_SNAPSHOT_SHA256" ||
      !/^[a-f0-9]{64}$/.test(report.source?.beforeSha256 || "") ||
      !/^[a-f0-9]{64}$/.test(report.source?.afterSha256 || "") ||
      !report.before?.snapshot || !report.after?.snapshot || !report.before?.selectedNode || !report.after?.selectedNode ||
      report.before.selectedNode.id !== id || report.after.selectedNode.id !== id ||
      report.before.snapshot.tick !== report.after.snapshot.tick ||
      report.before.snapshot.modelMs !== report.after.snapshot.modelMs ||
      report.source.tick !== report.before.snapshot.tick || report.source.modelMs !== report.before.snapshot.modelMs ||
      report.checks?.sameClockAndIdentity !== true || report.checks?.sameCellIds !== true ||
      report.checks?.areaPreserved !== true ||
      (report.status === "RESHAPED" && (report.checks.reshapeEvent?.type !== "WORLD_RESHAPE" ||
        report.source.beforeSha256 === report.source.afterSha256)) ||
      (report.status === "NO_CHANGE" && (report.checks.reshapeEvent !== null ||
        report.source.beforeSha256 !== report.source.afterSha256))) {
      throw new TypeError("SCARLET reshape report is not bound to the selected local source state.");
    }
    return report;
  }

  function createSession(gstarLiving, profiles, projectionDelta, reshapeAdapter) {
    if (!gstarLiving || typeof gstarLiving.create !== "function") throw new TypeError("GStarLiving.create required");
    if (!Array.isArray(profiles) || !profiles.length) throw new TypeError("Profiles required");
    const boundProfiles = profiles.map((profile) => ({ id: profile.id, label: profile.label, role: profile.role }));
    let core = gstarLiving.create(boundProfiles, { seed: SEED });
    let active = false;
    let playing = false;
    let background = false;
    let projection = "render";
    let selectedId = null;
    let camera = { x: 0, y: 0 };
    let sourceGeneration = 0;
    let reshapePending = false;
    const snapshot = () => core.snapshot(projection);
    return Object.freeze({
      activate() { active = true; background = false; return snapshot(); },
      deactivate() { active = false; playing = false; background = false; },
      play() { if (!active || background || reshapePending) return false; playing = true; return true; },
      pause() { playing = false; },
      step() { if (!active || background || reshapePending) return false; core.advance(STEP_MS); sourceGeneration += 1; return true; },
      reset() { if (reshapePending) throw new Error("Reshape witness is pending."); core = gstarLiving.create(boundProfiles, { seed: SEED }); sourceGeneration += 1; playing = false; selectedId = null; camera = { x: 0, y: 0 }; return snapshot(); },
      setBackground(hidden, elapsedMs = 0) {
        if (!active) return false;
        if (hidden) { background = true; playing = false; return true; }
        if (!background) return false;
        if (!Number.isFinite(elapsedMs) || elapsedMs < 0) throw new RangeError("Invalid display gap");
        core.gap(elapsedMs); sourceGeneration += 1; background = false; return true;
      },
      setProjection(next) {
        if (next !== "render" && next !== "full") throw new RangeError("Unknown projection");
        projection = next;
        return snapshot();
      },
      async capturePair() {
        if (!active || background || playing || reshapePending) throw new Error("Pausing an active foreground session is required.");
        if (!projectionDelta || typeof projectionDelta.capture !== "function") throw new Error("Projection comparison unavailable.");
        const selectionAtStart = selectedId;
        const id = selectionAtStart || core.snapshot("render").nodes[0]?.id;
        if (!id) throw new Error("No selected source cell.");
        const generation = sourceGeneration;
        const report = await projectionDelta.capture(core, id);
        if (!active || background || playing || generation !== sourceGeneration || selectedId !== selectionAtStart) {
          throw new Error("Source state changed during projection comparison.");
        }
        return report;
      },
      async applyReshape(aspect) {
        if (!active || background || playing || reshapePending) throw new Error("Pausing an active foreground session is required for reshape.");
        if (!RESHAPE_ASPECTS.includes(aspect)) throw new RangeError("Choose a declared SCARLET aspect.");
        if (!reshapeAdapter || typeof reshapeAdapter.witnessReshape !== "function") throw new Error("Local reshape witness unavailable.");
        const selectionAtStart = selectedId;
        const id = selectionAtStart || core.snapshot("render").nodes[0]?.id;
        if (!id) throw new Error("No selected source cell.");
        const generation = sourceGeneration;
        const sourceAtStart = core;
        const beforeJson = JSON.stringify(core.snapshot("full"));
        let expectedGeneration = generation;
        reshapePending = true;
        try {
          const pending = reshapeAdapter.witnessReshape(core, aspect, id);
          const afterCallJson = JSON.stringify(core.snapshot("full"));
          const changedAtCall = afterCallJson !== beforeJson;
          if (changedAtCall) { sourceGeneration += 1; expectedGeneration = sourceGeneration; }
          const report = validateReshapeReport(await pending, aspect, id);
          if ((report.status === "RESHAPED") !== changedAtCall ||
            (core === sourceAtStart && JSON.stringify(core.snapshot("full")) !== afterCallJson && sourceGeneration === expectedGeneration)) {
            throw new Error("Source changed outside the synchronous reshape witness.");
          }
          const expectedRace = !active || background || playing || expectedGeneration !== sourceGeneration ||
            selectedId !== selectionAtStart || core !== sourceAtStart;
          if (expectedRace) throw new Error("Source state changed during reshape witness.");
          return report;
        } catch (error) {
          if (core === sourceAtStart && sourceGeneration === generation &&
            JSON.stringify(core.snapshot("full")) !== beforeJson) sourceGeneration += 1;
          throw error;
        } finally {
          reshapePending = false;
        }
      },
      select(id) {
        if (!snapshot().nodes.some((node) => node.id === id)) throw new RangeError("Unknown cell ID");
        selectedId = id;
      },
      focusSelected() {
        const node = snapshot().nodes.find((item) => item.id === selectedId);
        if (!node) return false;
        camera = { x: node.position.x, y: node.position.y };
        return true;
      },
      move(dx, dy) {
        if (!active || !Number.isFinite(dx) || !Number.isFinite(dy)) return false;
        const world = snapshot().world;
        camera = {
          x: clamp(camera.x + dx, -world.width / 2, world.width / 2),
          y: clamp(camera.y + dy, -world.height / 2, world.height / 2)
        };
        return true;
      },
      view() {
        return { seed: SEED, active, playing, background, projection, selectedId,
          sourceGeneration, reshapePending,
          camera: { ...camera }, snapshot: snapshot() };
      }
    });
  }

  function mount(root, doc) {
    const byId = (id) => doc.getElementById(id);
    const app = root.HALVETH_APP;
    const catalog = root.HALVETH_CATALOG;
    const room = byId("scarletRoom");
    if (!app || !catalog || !room) return;
    const world = byId("scarletWorld");
    const canvas = byId("scarletWorldCanvas");
    const ctx = canvas.getContext("2d", { alpha: false });
    const list = byId("scarletCellList");
    const cellButtons = new Map();
    const profiles = catalog.categories.map((category) => ({ id: category.id, label: category.short, role: category.description }));
    let session = null;
    let playTimer = null;
    let hiddenAt = null;
    let lastReshape = null;

    function announce(message) { byId("scarletRoomStatus").textContent = message; }
    function setBackgroundInert(enabled) {
      [".topbar", "#spaceStage", ".side-rail", "#inspectPanel", ".statusbar"]
        .forEach((selector) => { const element = doc.querySelector(selector); if (element) element.inert = enabled; });
    }
    function syncMotion() {
      const reduced = app.reducedMotion();
      room.classList.toggle("is-reduced", reduced);
      byId("scarletMotion").setAttribute("aria-pressed", String(reduced));
      byId("scarletMotion").textContent = reduced ? "Bewegung normal" : "Bewegung reduzieren";
    }
    function setPlayLabel() {
      const playing = session?.view().playing || false;
      byId("scarletPlay").textContent = playing ? "❚❚ Pausieren" : "▶ Abspielen";
      byId("scarletPlay").setAttribute("aria-pressed", String(playing));
    }
    function pause() {
      if (playTimer !== null) { root.clearInterval(playTimer); playTimer = null; }
      session?.pause();
      setPlayLabel();
    }
    function reshapeNumber(value) { return Number(value).toLocaleString("de-DE", { maximumFractionDigits: 3 }); }
    function reshapePosition(node) { return "X " + reshapeNumber(node.position.x) + " / Y " + reshapeNumber(node.position.y) + " Modell-Einheiten (gerundet)"; }
    function reshapeWorld(world) {
      return reshapeNumber(world.width) + " × " + reshapeNumber(world.height) +
        " Modell-Einheiten; Fläche " + reshapeNumber(world.area) + " Modell-Einheiten² (gerundet)";
    }
    function syncReshapeStale() {
      const notice = byId("scarletReshapeStale");
      if (!lastReshape || !session) { notice.hidden = true; return; }
      const state = session.view();
      const stale = state.sourceGeneration !== lastReshape.generation || state.selectedId !== lastReshape.report.request.selectedId;
      notice.hidden = !stale;
      if (stale) notice.textContent = "Dieser Beleg gehört zur damaligen Zellwahl und Weltform. Der aktuelle Modellzustand oder die Auswahl hat sich seither geändert.";
    }
    function renderReshapeReport(report) {
      const article = byId("scarletReshapeReport");
      const facts = byId("scarletReshapeFacts");
      const title = byId("scarletReshapeResultTitle");
      title.textContent = report.status === "RESHAPED" ? "Weltform angewendet · lokaler Beleg" : "Keine Änderung · aktuelle Weltform";
      const lead = doc.createElement("p");
      lead.className = "scarlet-reshape-lead";
      lead.textContent = report.status === "RESHAPED" ?
        "Der private Modellkern wurde einmal bewusst umgeformt. Tick, Modellzeit, Zell-IDs und Fläche blieben gebunden." :
        "Dieses Seitenverhältnis war bereits aktiv. Welt, Zellpositionen, Ereignisfolge und Digest blieben gleich.";
      const pair = doc.createElement("div"); pair.className = "scarlet-reshape-pair";
      function card(label, state) {
        const section = doc.createElement("section");
        const heading = doc.createElement("h5"); heading.textContent = label;
        const list = doc.createElement("dl");
        function fact(term, value) {
          const row = doc.createElement("div");
          const dt = doc.createElement("dt"); dt.textContent = term;
          const dd = doc.createElement("dd"); dd.textContent = value;
          row.append(dt, dd); list.appendChild(row);
        }
        fact("Tick / Modellzeit", String(state.snapshot.tick) + " / " + String(state.snapshot.modelMs) + " ms");
        fact("Weltform / Fläche", reshapeWorld(state.snapshot.world));
        fact("Seitenverhältnis", reshapeNumber(state.aspect) + ":1 (gerundet)");
        fact("Zell-ID " + report.request.selectedId + " · Position", reshapePosition(state.selectedNode));
        section.append(heading, list); return section;
      }
      pair.append(card("Vorher", report.before), card("Nachher", report.after));
      const witness = doc.createElement("p"); witness.className = "scarlet-reshape-witness";
      witness.textContent = "Aktive Wellen: " + report.checks.wavesBefore + " → " + report.checks.wavesAfter +
        ". " + (report.status === "RESHAPED" ?
          "WORLD_RESHAPE · Ereignis #" + report.checks.reshapeEvent.sequence +
          " bei Tick " + report.checks.reshapeEvent.tick + "; " +
          (report.checks.wavesBefore > 0 ? "aktive Wellenfronten beendet." : "zuvor keine aktive Wellenfront.") :
          "Kein neues WORLD_RESHAPE-Ereignis.");
      const digest = doc.createElement("details");
      const summary = doc.createElement("summary"); summary.textContent = "Lokale Full-Snapshot-Digests und Quelle";
      digest.appendChild(summary);
      for (const [label, value] of [["Vorher SHA-256", report.source.beforeSha256], ["Nachher SHA-256", report.source.afterSha256],
        ["Digest-Art", report.source.digestKind], ["Gepinnter Quellcommit", report.source.commit]]) {
        const line = doc.createElement("p");
        const strong = doc.createElement("strong"); strong.textContent = label + ": ";
        const code = doc.createElement("code"); code.textContent = value;
        line.append(strong, code); digest.appendChild(line);
      }
      const boundary = doc.createElement("p"); boundary.className = "scarlet-reshape-boundary";
      boundary.textContent = report.claim;
      facts.replaceChildren(lead, pair, witness, digest, boundary);
      article.hidden = false;
      lastReshape = { report, generation: session.view().sourceGeneration };
      syncReshapeStale();
    }
    function setReshapeBusy(busy) {
      for (const id of ["scarletReshapeAspect", "scarletReshapeApply", "scarletPlay", "scarletStep", "scarletReset", "scarletDelta"]) {
        byId(id).disabled = busy;
      }
      if (busy) byId("scarletReshapeApply").setAttribute("aria-busy", "true");
      else byId("scarletReshapeApply").removeAttribute("aria-busy");
    }
    function project(node, state, width, height) {
      const scale = Math.max(26, Math.min(width / state.snapshot.world.width, height / state.snapshot.world.height) * 1.45);
      return { x: width / 2 + (node.position.x - state.camera.x) * scale,
        y: height / 2 - (node.position.y - state.camera.y) * scale, scale };
    }
    function renderCanvas(state) {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const ratio = Math.min(root.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const width = rect.width, height = rect.height;
      const backdrop = ctx.createRadialGradient(width * .48, height * .45, 12, width * .5, height * .5, Math.max(width, height));
      backdrop.addColorStop(0, "#172c38"); backdrop.addColorStop(.6, "#0a1421"); backdrop.addColorStop(1, "#04070d");
      ctx.fillStyle = backdrop; ctx.fillRect(0, 0, width, height);
      const model = state.snapshot;
      const scale = project({ position: { x: 1, y: 0 } }, state, width, height).scale;
      ctx.strokeStyle = "rgba(136,184,197,.11)"; ctx.lineWidth = 1;
      for (let x = -Math.ceil(model.world.width / 2); x <= Math.ceil(model.world.width / 2); x += 1) {
        const a = width / 2 + (x - state.camera.x) * scale;
        ctx.beginPath(); ctx.moveTo(a, 0); ctx.lineTo(a, height); ctx.stroke();
      }
      for (let y = -Math.ceil(model.world.height / 2); y <= Math.ceil(model.world.height / 2); y += 1) {
        const a = height / 2 - (y - state.camera.y) * scale;
        ctx.beginPath(); ctx.moveTo(0, a); ctx.lineTo(width, a); ctx.stroke();
      }
      const left = width / 2 + (-model.world.width / 2 - state.camera.x) * scale;
      const top = height / 2 - (model.world.height / 2 - state.camera.y) * scale;
      ctx.strokeStyle = "rgba(129,215,223,.34)"; ctx.setLineDash([8, 8]);
      ctx.strokeRect(left, top, model.world.width * scale, model.world.height * scale); ctx.setLineDash([]);
      const byNode = new Map(model.nodes.map((node) => [node.id, node]));
      for (const signal of model.signals) {
        const source = byNode.get(signal.source), target = byNode.get(signal.target);
        if (!source || !target) continue;
        const a = project(source, state, width, height), b = project(target, state, width, height);
        ctx.strokeStyle = "rgba(241,121,132,.42)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      for (const node of model.nodes) {
        const point = project(node, state, width, height);
        if (point.x < -40 || point.x > width + 40 || point.y < -40 || point.y > height + 40) continue;
        const selected = state.selectedId === node.id;
        const color = node.phase === "REST" ? "#80d8e3" : node.phase === "CORE" ? "#f3c989" : "#ff7985";
        const radius = node.depth ? 8 : 12;
        ctx.fillStyle = color;
        if (!app.reducedMotion()) { ctx.shadowColor = color; ctx.shadowBlur = selected ? 24 : 13; }
        ctx.beginPath(); ctx.arc(point.x, point.y, radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        if (selected) {
          ctx.strokeStyle = "#f8f4dd"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(point.x, point.y, radius + 7, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.fillStyle = "#07101b"; ctx.font = "bold 10px Consolas,monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(node.morphology.symbol, point.x, point.y + .5);
        ctx.fillStyle = "#ecf3f5"; ctx.font = "11px Consolas,monospace"; ctx.textBaseline = "top";
        ctx.fillText(node.id, point.x, point.y + radius + 10);
      }
      ctx.strokeStyle = "rgba(245,247,239,.65)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(width / 2 - 11, height / 2); ctx.lineTo(width / 2 - 4, height / 2);
      ctx.moveTo(width / 2 + 4, height / 2); ctx.lineTo(width / 2 + 11, height / 2);
      ctx.moveTo(width / 2, height / 2 - 11); ctx.lineTo(width / 2, height / 2 - 4);
      ctx.moveTo(width / 2, height / 2 + 4); ctx.lineTo(width / 2, height / 2 + 11); ctx.stroke();
    }
    function renderCellList(state) {
      const ids = new Set(state.snapshot.nodes.map((node) => node.id));
      for (const [id, button] of cellButtons) {
        if (ids.has(id)) continue;
        button.parentElement.remove(); cellButtons.delete(id);
      }
      for (const node of state.snapshot.nodes) {
        let button = cellButtons.get(node.id);
        if (!button) {
          const li = doc.createElement("li"); button = doc.createElement("button"); button.type = "button";
          button.dataset.cellId = node.id;
          button.addEventListener("click", () => {
            session.select(node.id); session.focusSelected(); render();
            announce("Zelle " + node.id + " ausgewählt; Ansicht zentriert.");
          });
          li.appendChild(button); list.appendChild(li); cellButtons.set(node.id, button);
        }
        button.replaceChildren();
        const label = doc.createElement("span"); label.textContent = node.label + " · " + node.id;
        const phase = doc.createElement("span"); phase.textContent = node.phase;
        button.append(label, phase);
        button.setAttribute("aria-pressed", String(state.selectedId === node.id));
        button.setAttribute("aria-label", node.label + ", ID " + node.id + ", Phase " + node.phase);
      }
    }
    function renderDetail(state) {
      const target = byId("scarletCellDetail");
      const node = state.snapshot.nodes.find((item) => item.id === state.selectedId);
      if (!node) { target.textContent = "Zelle in der Grafik oder Liste wählen."; return; }
      const title = doc.createElement("strong"); title.textContent = node.label + " · " + node.id;
      const detail = doc.createElement("span");
      const contact = state.projection === "full" ? String(node.memory.contacts) : "in Render ausgelassen";
      detail.textContent = "Phase " + node.phase + " · X " + node.position.x.toFixed(2) + " / Y " + node.position.y.toFixed(2) +
        " Modell-Einheiten · Kontakte dieser Zelle: " + contact + " · geboren bei " + node.bornAt + " ms Modellzeit.";
      target.replaceChildren(title, detail);
    }
    function render() {
      if (room.hidden || !session) return;
      let state = session.view();
      if (state.snapshot.nodes.length && !state.selectedId) { session.select(state.snapshot.nodes[0].id); state = session.view(); }
      byId("scarletModelTime").textContent = state.snapshot.modelMs.toLocaleString("de-DE") + " ms";
      byId("scarletCellCount").textContent = String(state.snapshot.counts.cells);
      byId("scarletContactCount").textContent = String(state.snapshot.counts.contacts);
      byId("scarletSignalCount").textContent = String(state.snapshot.counts.emitted);
      const coverage = state.snapshot.coverage;
      byId("scarletCoverage").textContent = state.projection === "render" ?
        "RENDER: Ereignisdetails ausgelassen. Quelle hält " + coverage.retained + " jüngste Modellereignisse, Sequenz " + coverage.firstSequence + "–" + coverage.lastSequence + ". Anzeigelücke " + state.snapshot.timing.displayGapMs + " ms." :
        "FULL: " + state.snapshot.events.length + " jüngste Modellereignisse sichtbar, Sequenz " + coverage.firstSequence + "–" + coverage.lastSequence + ". Ältere Ereignisse außerhalb der begrenzten Historie sind nicht abgedeckt. Anzeigelücke " + state.snapshot.timing.displayGapMs + " ms.";
      byId("scarletProjection").textContent = state.projection === "render" ? "Full ansehen" : "Render ansehen";
      byId("scarletProjection").setAttribute("aria-pressed", String(state.projection === "full"));
      renderCellList(state); renderDetail(state); renderCanvas(state); setPlayLabel(); syncMotion(); syncReshapeStale();
    }
    function open() {
      if (!root.GStarLiving) return false;
      if (!session) session = createSession(root.GStarLiving, profiles, root.HALVETH_SCARLET_PROJECTION_DELTA, root.HALVETH_SCARLET_RESHAPE);
      session.activate(); hiddenAt = null;
      room.hidden = false; setBackgroundInert(true);
      byId("sceneMode").textContent = "SCARLET / ZELLRAUM";
      render(); byId("scarletRoomTitle").focus();
      announce("Eigenständiger SCARLET-Modelllauf sichtbar. Modellzeit " + session.view().snapshot.modelMs + " ms.");
      return true;
    }
    function close() {
      if (room.hidden) return;
      root.HALVETH_SCARLET_DELTA_UI?.close();
      pause(); session.deactivate(); hiddenAt = null;
      room.hidden = true; setBackgroundInert(false);
      app.returnToCosmos();
    }
    function move(dx, dy) {
      if (!session?.move(dx, dy)) return;
      render();
    }
    byId("scarletExit").addEventListener("click", close);
    byId("scarletExitWorld").addEventListener("click", close);
    byId("scarletPlay").addEventListener("click", () => {
      if (!session) return;
      if (session.view().playing) { pause(); announce("Zellmodell bei " + session.view().snapshot.modelMs + " ms pausiert."); return; }
      if (!session.play()) return;
      const interval = app.reducedMotion() ? 900 : 650;
      playTimer = root.setInterval(() => {
        if (room.hidden || doc.hidden) { pause(); return; }
        session.step(); render();
      }, interval);
      setPlayLabel(); announce("Zellmodell läuft in diskreten Schritten von 500 ms Modellzeit.");
    });
    byId("scarletStep").addEventListener("click", () => {
      pause(); if (session?.step()) { root.HALVETH_SCARLET_DELTA_UI?.markStale("Der Modelllauf wurde fortgeschaltet."); render(); announce("Zellmodell auf " + session.view().snapshot.modelMs + " ms gesetzt."); }
    });
    byId("scarletReset").addEventListener("click", () => {
      pause(); session?.reset(); root.HALVETH_SCARLET_DELTA_UI?.markStale("Der Modelllauf wurde zurückgesetzt."); render(); announce("Eigenständiger Zelllauf auf Seed 3491 und 0 ms zurückgesetzt.");
    });
    byId("scarletProjection").addEventListener("click", () => {
      if (!session) return;
      const next = session.view().projection === "render" ? "full" : "render";
      session.setProjection(next); render();
      announce(next === "full" ? "Full-Projektion: jüngste Modellereignisse sichtbar." : "Renderprojektion: Ereignisdetails ausgelassen.");
    });
    byId("scarletDelta").addEventListener("click", async () => {
      if (!session) return;
      pause();
      const button = byId("scarletDelta");
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      try {
        const report = await session.capturePair();
        if (room.hidden || doc.hidden) return;
        button.disabled = false;
        button.removeAttribute("aria-busy");
        const ui = root.HALVETH_SCARLET_DELTA_UI;
        if (!ui || typeof ui.open !== "function") throw new Error("Projection inspection unavailable.");
        if (!ui.open(report, button)) throw new Error("Projection report rejected by the inspector.");
        announce("Render und Full aus demselben pausierten Zellzustand verglichen.");
      } catch (error) {
        announce("Projektionsvergleich nicht verfügbar: " + error.message);
      } finally {
        button.disabled = false;
        button.removeAttribute("aria-busy");
      }
    });
    byId("scarletReshapeApply").addEventListener("click", async () => {
      if (!session || room.hidden || doc.hidden) return;
      const aspect = Number(byId("scarletReshapeAspect").value);
      if (!RESHAPE_ASPECTS.includes(aspect)) {
        announce("Weltform nicht verfügbar: bitte eines der vier deklarierten Seitenverhältnisse wählen.");
        return;
      }
      pause();
      const generation = session.view().sourceGeneration;
      setReshapeBusy(true);
      byId("scarletReshapeStatus").textContent = "Lokale Umformung ausgelöst; Full-Snapshot-Digests werden geprüft …";
      try {
        const pending = session.applyReshape(aspect);
        if (session.view().sourceGeneration !== generation) {
          root.HALVETH_SCARLET_DELTA_UI?.markStale("Die Weltform des lokalen Zellkerns wurde bewusst geändert.");
          render();
        }
        const report = await pending;
        if (report.status === "RESHAPED") {
          root.HALVETH_SCARLET_DELTA_UI?.markStale("Die Weltform des lokalen Zellkerns wurde bewusst geändert.");
        }
        if (room.hidden || doc.hidden) return;
        render(); renderReshapeReport(report);
        byId("scarletReshapeStatus").textContent = report.status === "RESHAPED" ?
          "Weltform geändert; Tick und Modellzeit blieben gleich. Beleg unten." :
          "Keine Änderung: dieses Seitenverhältnis war bereits aktiv. Beleg unten.";
        announce(byId("scarletReshapeStatus").textContent);
        byId("scarletReshapeReport").focus();
      } catch (error) {
        if (session.view().sourceGeneration !== generation) {
          root.HALVETH_SCARLET_DELTA_UI?.markStale("Der lokale Zellkern hat sich während der Umformungsprüfung geändert.");
        }
        if (!room.hidden) {
          render();
          byId("scarletReshapeStatus").textContent = "Umformungsbeleg nicht verfügbar: " + error.message;
          announce(byId("scarletReshapeStatus").textContent);
        }
      } finally {
        setReshapeBusy(false);
      }
    });
    byId("scarletMotion").addEventListener("click", () => {
      const reduced = app.setReducedMotion(!app.reducedMotion());
      if (reduced && session?.view().playing) pause();
      render(); announce(reduced ? "Bewegung reduziert; Modell pausiert. Einzelschritt bleibt verfügbar." : "Bewegung normal; Modell bleibt pausiert.");
    });
    [["scarletMoveLeft", -.55, 0], ["scarletMoveRight", .55, 0], ["scarletMoveUp", 0, .55], ["scarletMoveDown", 0, -.55]]
      .forEach(([id, dx, dy]) => byId(id).addEventListener("click", () => move(dx, dy)));
    world.addEventListener("keydown", (event) => {
      if (event.target !== world) return;
      const key = event.key.toLowerCase();
      const direction = { a: [-.55, 0], arrowleft: [-.55, 0], d: [.55, 0], arrowright: [.55, 0],
        w: [0, .55], arrowup: [0, .55], s: [0, -.55], arrowdown: [0, -.55] }[key];
      if (!direction) return;
      move(direction[0], direction[1]); event.preventDefault();
    });
    canvas.addEventListener("pointerdown", (event) => {
      if (!session || room.hidden) return;
      const state = session.view(), rect = canvas.getBoundingClientRect();
      let nearest = null;
      for (const node of state.snapshot.nodes) {
        const point = project(node, state, rect.width, rect.height);
        const distance = Math.hypot(point.x - (event.clientX - rect.left), point.y - (event.clientY - rect.top));
        if (distance < 27 && (!nearest || distance < nearest.distance)) nearest = { id: node.id, distance };
      }
      world.focus();
      if (!nearest) return;
      session.select(nearest.id); render(); announce("Zelle " + nearest.id + " in der Raumgrafik ausgewählt.");
    });
    room.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const items = Array.from(room.querySelectorAll("button:not([disabled]), [tabindex='0']"))
        .filter((element) => element.getClientRects().length > 0);
      if (!items.length) return;
      if (event.shiftKey && (doc.activeElement === items[0] || doc.activeElement === byId("scarletRoomTitle"))) {
        items.at(-1).focus(); event.preventDefault();
      } else if (!event.shiftKey && doc.activeElement === items.at(-1)) {
        items[0].focus(); event.preventDefault();
      }
    });
    doc.addEventListener("visibilitychange", () => {
      if (room.hidden || !session) return;
      if (doc.hidden) {
        hiddenAt = Date.now(); pause(); session.setBackground(true);
      } else if (hiddenAt !== null) {
        session.setBackground(false, Math.max(0, Date.now() - hiddenAt)); hiddenAt = null;
        root.HALVETH_SCARLET_DELTA_UI?.markStale("Eine Anzeigelücke hat den Quellzustand verändert.");
        render(); announce("Hintergrundzeit als Anzeigelücke erfasst; Modell bleibt pausiert.");
      }
    });
    root.addEventListener("blur", () => { if (!room.hidden) { pause(); announce("Fenster ohne Fokus; Zellmodell pausiert."); } });
    root.addEventListener("resize", () => { if (!room.hidden) render(); });
    root.HALVETH_SCARLET_ROOM = Object.freeze({ open, close });
  }
  return Object.freeze({ SEED, STEP_MS, RESHAPE_ASPECTS, validateReshapeReport, createSession, mount });
});
