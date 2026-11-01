(function () {
  "use strict";
  const model = window.HalvethAtlasModel;
  if (!model) return;
  const labels = { source: "Quelle", tests: "Tests", review: "Review", provenance: "Provenienz", security: "Sicherheit" };
  const states = {
    INDETERMINATE_SAMPLING: "Abtastung unbestimmt: aus diesen Samples keine belastbare Phasenlesart",
    ANTIPHASE: "Antiphase im endlichen Sinusmodell",
    IN_PHASE: "Gleichphase im endlichen Sinusmodell",
    PHASE_SHIFTED: "Phasenverschiebung im endlichen Sinusmodell"
  };
  const gateNames = {
    DEFLECT: "DEFLECT · mindestens ein deklarierter Fail",
    RESOLVE: "RESOLVE · ein ausdrücklich markierter Konflikt bleibt offen",
    HOLD: "HOLD · mindestens eine Bedingung ist unbekannt",
    MERGE_PROPOSAL_ONLY: "MERGE_PROPOSAL_ONLY · fünf deklarierte Pass-Werte, keine Integration"
  };
  function svgNode(name, attributes) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
    return node;
  }
  function line(values, count) {
    const limit = Math.min(values.length, count);
    return Array.from({ length: limit }, (_, index) => {
      const x = 14 + index / Math.max(1, limit - 1) * 772;
      const y = 90 - values[index] * 66;
      return x.toFixed(2) + "," + y.toFixed(2);
    }).join(" ");
  }
  function mount(container) {
    if (!container || container.nodeType !== 1) throw new TypeError("Atlas needs an HTML container");
    container.classList.add("atlas-demo");
    container.innerHTML = `<p class="model-copy">PRO ATLAS als reine lokale Ableitung. Zwei endlich abgetastete Sinusfolgen und eine getrennte Fünffach-Prüfmembran. Regler und Haken sind <strong>eigene Deklarationen</strong>, keine Messung und kein Git-Merge.</p>
      <div class="atlas-phase-controls"><label for="atlasF">Frequenz <output id="atlasFValue">2 Hz</output></label><input id="atlasF" type="range" min="1" max="20" step="0.5" value="2"><label for="atlasTau">Zeitversatz τ <output id="atlasTauValue">0.25 s</output></label><input id="atlasTau" type="range" min="-1" max="1" step="0.025" value="0.25"><label for="atlasRate">Abtastrate <output id="atlasRateValue">80 Hz</output></label><input id="atlasRate" type="range" min="10" max="100" step="5" value="80"></div>
      <svg id="atlasWave" viewBox="0 0 800 180" role="img" aria-label="Zwei lokal berechnete endliche Sinusfolgen"></svg>
      <p id="atlasPhaseReadout" class="atlas-readout" aria-live="polite">Modell bereit.</p>
      <div class="atlas-gate"><span class="eyebrow">FÜNFFACH-PRÜFMEMBRAN · NUR DEKLARIERT</span><p>Jeder Wert ist eine Eingabe. „Pass“ prüft hier keinen realen Test, „Konflikt“ braucht eine eigene Klärung. Der letzte Zustand ist immer nur ein Vorschlag.</p><div id="atlasChecks" class="atlas-checks"></div><div class="atlas-gate-actions"><button id="atlasGateCheck" type="button">Kandidat lokal auswerten</button><button id="atlasGateReset" type="button">Eingaben zurücksetzen</button></div><output id="atlasGateResult" class="atlas-readout" aria-live="polite">HOLD · fünf Bedingungen sind unbekannt</output></div>
      <p class="atlas-source">Quelle: bereitgestellter PRO ATLAS, <code>atlas.py</code> → eigener reiner JavaScript-Adapter. <a href="https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/83e9be26793e319aef422df0e50afae619b8de6b/universum/CREDITS.md#atlas" target="_blank" rel="noopener noreferrer">Öffentlicher Herkunftshinweis ↗</a>. Keine physikalische Zustandsbehauptung, keine Review- oder Merge-Autorität.</p>`;
    const by = (id) => container.querySelector("#" + id);
    const chart = by("atlasWave");
    const checks = by("atlasChecks");
    for (const check of model.CHECKS) {
      const row = document.createElement("div"); row.className = "atlas-check-row";
      const label = document.createElement("label"); label.htmlFor = "atlasCheck-" + check; label.textContent = labels[check];
      const select = document.createElement("select"); select.id = "atlasCheck-" + check;
      for (const [value, copy] of [["unknown", "Unbekannt"], ["true", "Pass deklariert"], ["false", "Fail deklariert"]]) {
        const option = document.createElement("option"); option.value = value; option.textContent = copy; select.appendChild(option);
      }
      const conflictLabel = document.createElement("label"); conflictLabel.className = "atlas-conflict";
      const conflict = document.createElement("input"); conflict.type = "checkbox"; conflict.dataset.conflict = check;
      const stale = () => { by("atlasGateResult").textContent = "Eingaben geändert · diese Auswahl wurde noch nicht neu ausgewertet."; };
      select.addEventListener("change", stale);
      conflict.addEventListener("change", stale);
      conflictLabel.append(conflict, document.createTextNode(" Konflikt"));
      row.append(label, select, conflictLabel); checks.appendChild(row);
    }
    function renderPhase() {
      const f = Number(by("atlasF").value), tau = Number(by("atlasTau").value), rate = Number(by("atlasRate").value);
      const result = model.periodic(f, tau, rate, 2);
      by("atlasFValue").textContent = f + " Hz";
      by("atlasTauValue").textContent = tau.toFixed(3) + " s";
      by("atlasRateValue").textContent = rate + " Hz";
      while (chart.firstChild) chart.removeChild(chart.firstChild);
      chart.appendChild(svgNode("line", { x1: 14, y1: 90, x2: 786, y2: 90, stroke: "#597887", "stroke-width": 1 }));
      chart.appendChild(svgNode("polyline", { points: line(result.reference, result.times.length), fill: "none", stroke: "#82d8e5", "stroke-width": 2.4 }));
      chart.appendChild(svgNode("polyline", { points: line(result.observation, result.times.length), fill: "none", stroke: "#fa8b91", "stroke-width": 2.4 }));
      by("atlasPhaseReadout").textContent = states[result.status] + " · Phase " + result.phase_deg.toFixed(1) + "° · Korrelation " + (result.correlation === null ? "unbestimmt" : result.correlation.toFixed(3)) + " · " + result.times.length + " Samples über 2 Modellsekunden. Türkis = Referenz; Rot = verschobene Folge.";
    }
    ["atlasF", "atlasTau", "atlasRate"].forEach((id) => by(id).addEventListener("input", renderPhase));
    function evaluateGate() {
      const candidate = {}, conflicts = [];
      for (const check of model.CHECKS) {
        const value = by("atlasCheck-" + check).value;
        if (value !== "unknown" && value !== "true" && value !== "false") {
          by("atlasGateResult").textContent = "Ungültiger Prüfwert für " + labels[check] + " · Kandidat nicht ausgewertet.";
          return;
        }
        candidate[check] = value === "unknown" ? "unknown" : value === "true";
        if (checks.querySelector('input[data-conflict="' + check + '"]').checked) conflicts.push(check);
      }
      const status = model.gate(candidate, conflicts);
      by("atlasGateResult").textContent = gateNames[status] + " · Quell-/Test-/Review-/Provenienz-/Sicherheitswerte wurden hier nicht extern geprüft.";
    }
    by("atlasGateCheck").addEventListener("click", evaluateGate);
    by("atlasGateReset").addEventListener("click", () => {
      for (const check of model.CHECKS) {
        by("atlasCheck-" + check).value = "unknown";
        checks.querySelector('input[data-conflict="' + check + '"]').checked = false;
      }
      evaluateGate();
    });
    renderPhase();
    return Object.freeze({ activate: renderPhase });
  }
  window.HALVETH_ATLAS_UI = Object.freeze({ mount });
})();
