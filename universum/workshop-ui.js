(function () {
  "use strict";
  const model = window.HALVETH_WORKSHOP;
  const app = window.HALVETH_APP;
  const panel = document.getElementById("netzPanel");
  if (!model || !app || !panel) return;
  const section = document.createElement("section");
  section.className = "workshop";
  section.setAttribute("aria-labelledby", "wsHeading");
  section.innerHTML = `
    <div class="ws-head"><div><span class="eyebrow">LOKALE MODELLWERKSTATT / EIGENE EINGABE</span><h3 id="wsHeading" tabindex="-1">0ᵢ entfalten → 1ᵢ → 0ᵢ₊₁</h3></div><span class="model-badge">NUR SYNTHETISCHE DEKLARATION</span></div>
    <p>Setze einen eigenen Ausgangspunkt, erfasse Zwischenzustände und öffne daraus die nächste Aktion. Modell-Ticks ordnen deine lokalen Eingaben; die lokale Uhr ist ein getrennter, ungeprüfter Zeitwert. Kein Schritt behauptet eine frühere Projekthistorie.</p>
    <div class="ws-create"><label for="wsTitle">Ausgangsfrage</label><input id="wsTitle" type="text" maxlength="120" placeholder="Was soll sich entfalten?"><button id="wsCreate" type="button">Bei 0 beginnen</button></div>
    <div class="ws-import"><label for="wsImport">Oder eine eigene, zuvor exportierte JSON-Folge lokal laden</label><input id="wsImport" type="file" accept=".json,application/json"><small>Nur für ein Projekt ohne offene Sitzung · höchstens 128 KiB · Prüfung der Modellstruktur und Projekt-ID. Die Datei bleibt im Browser.</small></div>
    <div class="ws-active" id="wsActive" hidden>
      <div class="ws-selects"><label for="wsAction">Aktion</label><select id="wsAction"></select><label for="wsBranch">Zweig</label><select id="wsBranch"></select></div>
      <label for="wsLabel">Nächsten lokalen Record benennen</label><input id="wsLabel" type="text" maxlength="120" placeholder="Zwischenschritt, Lücke oder nächster Ausgangspunkt">
      <div class="ws-actions"><button id="wsStep" type="button">+ Zwischenzustand</button><button id="wsFork" type="button">↗ Zweig eröffnen</button><button id="wsGap" type="button">⋯ Lücke markieren</button><button id="wsComplete" type="button">1ᵢ markieren</button><button id="wsNext" type="button">0ᵢ₊₁ eröffnen</button><button id="wsExport" type="button">JSON herunterladen</button></div>
      <div class="ws-scrub"><label for="wsTick">Erhaltene Folge ansehen <span id="wsTickLabel">T0</span></label><input id="wsTick" type="range" min="0" max="0" step="1" value="0"></div>
      <div id="wsNodes" class="ws-nodes" role="group" aria-label="Lokale Modellereignisse"></div>
      <div id="wsDetail" class="ws-detail" aria-live="polite"></div>
    </div>
    <p class="ws-feedback" id="wsFeedback" role="status">Flüchtige lokale Sitzung. Ein Download entsteht nur durch deinen Klick.</p>`;
  panel.appendChild(section);
  const by = (id) => section.querySelector("#" + id);
  const jump = document.createElement("button");
  jump.type = "button"; jump.className = "ws-jump"; jump.textContent = "Eigene 0→1-Werkstatt ↓";
  jump.setAttribute("aria-controls", "wsHeading");
  panel.querySelector(".netz-meta").appendChild(jump);
  jump.addEventListener("click", () => { section.scrollIntoView({ block: "start", behavior: "auto" }); by("wsHeading").focus({ preventScroll: true }); });
  const states = new Map();
  const drafts = new Map();
  let projectId = null;
  let selectedAction = null;
  let selectedBranch = null;
  let selectedTick = 0;
  const names = {
    ACTION_STARTED: "Ausgangspunkt 0ᵢ", STEP: "Zwischenzustand", GAP: "Aufzeichnungslücke",
    BRANCH_CREATED: "Neuer Zweig", ACTION_COMPLETED: "Markiertes Ergebnis 1ᵢ",
    NEXT_ACTION_STARTED: "Nächster Ausgangspunkt 0ᵢ₊₁"
  };

  function currentProject() {
    return app.getProject()?.id || null;
  }
  function feedback(message) { by("wsFeedback").textContent = message; }
  function state() { return projectId ? states.get(projectId) || null : null; }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function option(value, text) {
    const node = document.createElement("option"); node.value = value; node.textContent = text; return node;
  }
  function syncProject() {
    const next = currentProject();
    if (next !== projectId) {
      if (projectId) drafts.set(projectId, { title: by("wsTitle").value, label: by("wsLabel").value });
      projectId = next; selectedAction = null; selectedBranch = null;
      const draft = drafts.get(next) || { title: "", label: "" };
      by("wsTitle").value = draft.title;
      by("wsLabel").value = draft.label;
      selectedTick = state() ? state().events.length - 1 : 0;
    }
    render();
  }
  function render() {
    const local = state();
    by("wsCreate").disabled = !projectId || Boolean(local);
    by("wsTitle").disabled = !projectId || Boolean(local);
    by("wsImport").disabled = !projectId || Boolean(local);
    by("wsActive").hidden = !local;
    by("wsActive").querySelectorAll("button,input,select").forEach((control) => { control.disabled = !local; });
    if (!local) return;
    selectedTick = Math.min(selectedTick, local.events.length - 1);
    const projected = model.project(local, selectedTick);
    if (!projected.actions.some((action) => action.id === selectedAction)) selectedAction = projected.actions.at(-1).id;
    const actions = by("wsAction"); clear(actions);
    projected.actions.forEach((action) => actions.appendChild(option(action.id, action.id + " · " + action.label)));
    actions.value = selectedAction;
    const inAction = projected.branches.filter((branch) => branch.actionId === selectedAction);
    if (!inAction.some((branch) => branch.id === selectedBranch)) selectedBranch = inAction[0]?.id || null;
    const branches = by("wsBranch"); clear(branches);
    inAction.forEach((branch) => branches.appendChild(option(branch.id, branch.id + (branch.completed ? " · 1ᵢ markiert" : " · offen"))));
    branches.value = selectedBranch || "";
    const branch = projected.branches.find((item) => item.id === selectedBranch);
    const latest = selectedTick === local.events.length - 1;
    by("wsTick").max = String(local.events.length - 1);
    by("wsTick").value = String(selectedTick);
    by("wsTickLabel").textContent = "T" + selectedTick + " / " + (local.events.length - 1);
    const open = latest && branch && !branch.completed;
    for (const id of ["wsStep", "wsFork", "wsGap"]) by(id).disabled = !open;
    by("wsComplete").disabled = !open || branch.steps === 0;
    by("wsNext").disabled = !latest || !branch?.completed || branch.childActionId !== null;
    const nodes = by("wsNodes"); clear(nodes);
    local.events.forEach((event, index) => {
      const button = document.createElement("button");
      button.type = "button"; button.className = "ws-node";
      button.classList.toggle("selected", index === selectedTick);
      button.classList.toggle("future", index > selectedTick);
      button.classList.toggle("gap", index <= selectedTick && event.type === "GAP");
      button.setAttribute("aria-pressed", String(index === selectedTick));
      button.setAttribute("aria-label", "Modelltick " + index + (index > selectedTick ? " · noch nicht sichtbar" : " · " + names[event.type]));
      button.textContent = "T" + index;
      button.addEventListener("click", () => { selectedTick = index; render(); });
      nodes.appendChild(button);
    });
    const event = projected.events.at(-1);
    const detail = by("wsDetail"); clear(detail);
    const heading = document.createElement("strong"); heading.textContent = names[event.type] + " · " + event.actionId + " / " + event.branchId;
    const labelText = document.createElement("p"); labelText.textContent = event.label;
    const meta = document.createElement("small");
    meta.textContent = "Lokale Aufzeichnung " + event.recordedAt + " · " + projected.events.length + " sichtbare Records · " + projected.branches.length + " Zweige · Quelle: eigene Eingabe, keine Außenprüfung.";
    detail.append(heading, labelText, meta);
  }

  by("wsCreate").addEventListener("click", () => {
    const id = currentProject();
    if (!id || states.has(id)) return;
    try {
      const next = model.create(id, by("wsTitle").value, new Date().toISOString());
      states.set(id, next); selectedAction = "a1"; selectedBranch = "a1_main"; selectedTick = 0;
      feedback("Lokaler Ausgangspunkt gesetzt. Ein Modell-Record, keine belegte Projekthistorie.");
      render();
    } catch (error) { feedback("Eingabe verworfen: " + error.message); }
  });
  by("wsImport").addEventListener("change", async () => {
    const input = by("wsImport");
    const file = input.files?.[0];
    const id = currentProject();
    if (!file || !id || states.has(id)) { input.value = ""; return; }
    let reason = "Datei konnte nicht gelesen werden";
    try {
      if (file.size > 131072) { reason = "Datei überschreitet 128 KiB"; throw new TypeError(); }
      const raw = await file.text();
      reason = "ungültiges JSON";
      const imported = JSON.parse(raw);
      reason = "Projekt während des Ladens gewechselt";
      if (currentProject() !== id || states.has(id)) throw new TypeError();
      reason = "Projekt-ID passt nicht zur gewählten Karte";
      if (imported.projectId !== id) throw new TypeError();
      reason = "lokaler Modellvertrag nicht erfüllt";
      model.inspect(imported);
      states.set(id, imported);
      selectedTick = imported.events.length - 1;
      selectedAction = imported.events.at(-1).actionId;
      selectedBranch = imported.events.at(-1).branchId;
      feedback("Lokale JSON-Folge strukturell geprüft und geladen: " + imported.events.length + " Records. Die Inhalte bleiben eigene Deklarationen.");
      render();
    } catch { feedback("Import verworfen: " + reason + "."); }
    finally { input.value = ""; }
  });
  by("wsAction").addEventListener("change", () => { selectedAction = by("wsAction").value; selectedBranch = null; render(); });
  by("wsBranch").addEventListener("change", () => { selectedBranch = by("wsBranch").value; render(); });
  by("wsTick").addEventListener("input", () => { selectedTick = Number(by("wsTick").value); render(); });
  function record(type) {
    const prior = state();
    if (!prior || selectedTick !== prior.events.length - 1) {
      feedback("Zum letzten Record gehen, bevor du einen neuen Schritt anhängst."); return;
    }
    try {
      const next = model.dispatch(prior, { type, branchId: selectedBranch, label: by("wsLabel").value, recordedAt: new Date().toISOString() });
      states.set(projectId, next); selectedTick = next.events.length - 1;
      if (type === "FORK" || type === "NEXT_ACTION") {
        selectedAction = next.events.at(-1).actionId;
        selectedBranch = next.events.at(-1).branchId;
      }
      by("wsLabel").value = "";
      feedback("Record angehängt: " + names[next.events.at(-1).type] + ". Vorherige Einträge bleiben erhalten.");
      render();
    } catch (error) { feedback("Eingabe verworfen: " + error.message); }
  }
  [["wsStep", "STEP"], ["wsFork", "FORK"], ["wsGap", "GAP"], ["wsComplete", "COMPLETE"], ["wsNext", "NEXT_ACTION"]]
    .forEach(([id, type]) => by(id).addEventListener("click", () => record(type)));
  by("wsExport").addEventListener("click", () => {
    const local = state(); if (!local) return;
    const blob = new Blob([JSON.stringify(local, null, 2) + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "netz-werkstatt-" + projectId + ".json";
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 5000);
    feedback("Vollständiges lokales Modell-JSON zum Download angeboten. Der Download ist vor externer Verwendung zu prüfen.");
  });
  new MutationObserver(() => { if (!panel.hidden) syncProject(); }).observe(panel, { attributes: true, attributeFilter: ["hidden"] });
})();
