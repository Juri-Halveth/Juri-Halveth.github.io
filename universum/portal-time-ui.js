/* Compact inspection timeline for source-bound selected public commits. No fetch or storage. */
(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.HALVETH_PORTAL_TIME_UI = api.mount(root, document);
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";

  function shortDuration(milliseconds) {
    if (!Number.isFinite(milliseconds) || milliseconds < 0) throw new RangeError("Invalid elapsed time");
    const seconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days) return "≈" + days + "T" + (hours ? hours + "h" : "");
    if (hours) return "≈" + hours + "h" + (minutes ? minutes + "m" : "");
    if (minutes) return "≈" + minutes + "m";
    return "≈" + (seconds % 60) + "s";
  }

  function prepareTimeline(projectId, record) {
    if (record == null) return null;
    if (!record || record.projectId !== projectId || !Array.isArray(record.events) || record.events.length !== 4 ||
      !Array.isArray(record.gaps) || !record.coverage || typeof record.coverage.label !== "string") {
      throw new TypeError("Invalid source-bound project timeline");
    }
    const ids = new Set();
    let previousTime = null;
    const events = record.events.map((event, index) => {
      const commit = typeof event?.commit === "string" ? event.commit : event?.commit?.sha;
      const at = Date.parse(event?.eventTime);
      const recordedAt = Date.parse(event?.recordedAt);
      if (!event || typeof event.id !== "string" || ids.has(event.id) ||
        typeof event.title !== "string" || !event.title.trim() ||
        typeof event.summary !== "string" || !event.summary.trim() ||
        !/^[a-f0-9]{40}$/i.test(commit || "") ||
        !Number.isFinite(at) || !Number.isFinite(recordedAt) ||
        (previousTime !== null && at < previousTime)) throw new TypeError("Invalid selected commit event");
      ids.add(event.id);
      const elapsed = event.elapsedFromPrevious;
      if (index === 0 && elapsed !== null) throw new TypeError("First selected commit cannot have a prior selected gap");
      if (index > 0 && (!elapsed || elapsed.basis !== "SELECTED_COMMITTER_TIMESTAMPS" ||
        !Number.isFinite(elapsed.milliseconds) || elapsed.milliseconds !== at - previousTime ||
        typeof elapsed.label !== "string" || !elapsed.label.trim())) throw new TypeError("Invalid selected commit interval");
      previousTime = at;
      return Object.freeze({
        id: event.id, title: event.title, summary: event.summary, eventTime: event.eventTime,
        recordedAt: event.recordedAt, commit, url: event.url,
        elapsedLabel: index ? elapsed.label : null,
        elapsedShort: index ? shortDuration(elapsed.milliseconds) : null
      });
    });
    const gapLabels = record.gaps.map((gap) => {
      const label = gap && (gap.label || gap.reason || gap.kind);
      if (typeof label !== "string" || !label.trim()) throw new TypeError("Unlabelled history gap");
      return label;
    });
    return Object.freeze({
      projectId, label: typeof record.label === "string" ? record.label : projectId,
      events: Object.freeze(events), coverageLabel: record.coverage.label,
      gapLabels: Object.freeze(gapLabels),
      digest: typeof record.integrity?.digest === "string" ? record.integrity.digest : null
    });
  }

  function mount(root, doc) {
    const inspect = doc.getElementById("inspectPanel");
    const anchor = doc.querySelector("#inspectPanel .inspect-tagline");
    if (!inspect || !anchor) return Object.freeze({ setProject: () => false });
    const make = (tag, className, value) => {
      const node = doc.createElement(tag);
      if (className) node.className = className;
      if (value !== undefined) node.textContent = value;
      return node;
    };
    const section = make("section", "portal-time");
    section.id = "portalTime";
    section.hidden = true;
    section.setAttribute("aria-labelledby", "portalTimeTitle");
    const head = make("div", "portal-time__head");
    const headingGroup = make("div", "portal-time__heading-group");
    headingGroup.append(make("span", "eyebrow", "QUELLZEIT / AUSWAHL"), make("h3", "", "Vier Revisionen"));
    headingGroup.lastChild.id = "portalTimeTitle";
    const counter = make("span", "portal-time__counter", "01 / 04");
    head.append(headingGroup, counter);
    const coverage = make("p", "portal-time__coverage");
    const track = make("div", "portal-time__track");
    const intervals = make("div", "portal-time__intervals");
    intervals.setAttribute("aria-label", "Zeitabstände zwischen den ausgewählten Commits");
    const nodes = make("div", "portal-time__nodes");
    nodes.setAttribute("role", "group");
    nodes.setAttribute("aria-label", "Vier ausgewählte Revisionen: auswählen oder direkt in der Quellspur öffnen");
    const slider = make("input", "portal-time__scrub");
    slider.type = "range"; slider.min = "0"; slider.max = "3"; slider.step = "1"; slider.value = "0";
    slider.setAttribute("aria-label", "Ausgewählte Commitrevision auf der Zeitspur wählen");
    const folded = make("p", "portal-time__folded", "Ziehen, tippen oder Pfeiltasten wählen. ↗ öffnet die detaillierte Quellspur. Bildabstände sind gefaltet; ≈-Werte darüber sind gekürzt. Die gewählte Revision nennt den genauen Abstand.");
    track.append(intervals, nodes, slider, folded);
    const detail = make("div", "portal-time__selected");
    const meta = make("div", "portal-time__meta");
    const date = make("time", "portal-time__date");
    const sha = make("span", "portal-time__sha");
    meta.append(date, sha);
    const title = make("h4", "portal-time__title");
    const summary = make("p", "portal-time__summary");
    const elapsed = make("p", "portal-time__elapsed");
    const recorded = make("p", "portal-time__recorded");
    detail.append(meta, title, summary, elapsed, recorded);
    const gapsHead = make("p", "portal-time__gaps-head", "LÜCKEN DIESER AUSWAHL");
    const gaps = make("ul", "portal-time__gaps");
    const receipt = make("p", "portal-time__receipt");
    section.append(head, coverage, track, detail, gapsHead, gaps, receipt);
    anchor.after(section);

    let bound = null;
    let selected = 0;
    const pointControls = [];
    const utc = (value) => new Intl.DateTimeFormat("de-DE", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
      timeZone: "UTC"
    }).format(new Date(value)) + " UTC";

    function openDetail(index) {
      if (!bound || index < 0 || index >= bound.events.length) return;
      const source = root.HALVETH_SOURCE_UI;
      if (typeof source?.openAt !== "function") {
        root.HALVETH_APP?.setStatus("Detaillierte Quellspur ist hier nicht verfügbar.");
        return;
      }
      source.openAt(index);
    }
    function render() {
      if (!bound) return;
      const event = bound.events[selected];
      counter.textContent = String(selected + 1).padStart(2, "0") + " / 04";
      slider.value = String(selected);
      slider.setAttribute("aria-valuetext", "Revision " + (selected + 1) + " von 4: " + event.title + ", " + utc(event.eventTime));
      pointControls.forEach(({ pick }, index) => pick.setAttribute("aria-pressed", String(index === selected)));
      date.dateTime = event.eventTime;
      date.textContent = "COMMITZEIT · " + utc(event.eventTime);
      sha.textContent = event.commit.slice(0, 10);
      title.textContent = event.title;
      summary.textContent = event.summary;
      elapsed.textContent = selected === 0 ?
        "Vor dieser ersten gewählten Revision ist hier keine Commitfolge inventarisiert." :
        "Abstand zum vorherigen gewählten Commit: " + event.elapsedLabel + ". Dazwischenliegende Commits bleiben offen.";
      recorded.textContent = "Erfasst für diese Auswahl: " + utc(event.recordedAt) + ".";
    }
    function setProject(id) {
      const adapter = root.HALVETH_PORTAL_TIME;
      let next;
      try {
        const raw = typeof adapter?.forProject === "function" ? adapter.forProject(id) : null;
        next = prepareTimeline(id, raw);
      }
      catch (error) {
        section.hidden = true; bound = null;
        root.console?.error?.("Portal time binding rejected:", error);
        return false;
      }
      if (!next) { section.hidden = true; bound = null; return false; }
      bound = next; selected = 0;
      coverage.textContent = bound.coverageLabel;
      intervals.replaceChildren(); nodes.replaceChildren(); gaps.replaceChildren(); pointControls.length = 0;
      for (let index = 0; index < 4; index += 1) {
        if (index > 0) {
          const interval = make("span", "", bound.events[index].elapsedShort);
          interval.tabIndex = 0;
          interval.setAttribute("role", "note");
          interval.setAttribute("aria-label", "Abstand zwischen Revision " + index + " und " + (index + 1) + ": " + bound.events[index].elapsedLabel);
          interval.title = bound.events[index].elapsedLabel;
          intervals.appendChild(interval);
        }
        const point = make("div", "portal-time__point");
        const pick = make("button", "portal-time__pick", String(index + 1).padStart(2, "0"));
        pick.type = "button";
        pick.setAttribute("aria-label", "Revision " + (index + 1) + " auswählen: " + bound.events[index].title);
        pick.addEventListener("click", () => { selected = index; render(); pick.focus(); });
        const deep = make("button", "portal-time__deep", "↗");
        deep.type = "button";
        deep.setAttribute("aria-label", "Revision " + (index + 1) + " in detaillierter Quellspur öffnen: " + bound.events[index].title);
        deep.title = "Quellspur für Revision " + (index + 1);
        deep.addEventListener("click", () => openDetail(index));
        point.append(pick, deep); nodes.appendChild(point); pointControls.push({ pick, deep });
      }
      bound.gapLabels.forEach((label) => gaps.appendChild(make("li", "", label)));
      if (!bound.gapLabels.length) gaps.appendChild(make("li", "", "Über diese Auswahl hinaus ist die Commitgeschichte hier nicht inventarisiert."));
      receipt.textContent = bound.digest ? "Manifest SHA-256: " + bound.digest.slice(0, 12) + "… · Hash bindet Daten, nicht Vollständigkeit." :
        "Die Auswahl bindet Quellenmetadaten, keine vollständige Projekthistorie.";
      section.hidden = false;
      render();
      return true;
    }
    slider.addEventListener("input", () => { if (!bound) return; selected = Number(slider.value); render(); });
    return Object.freeze({ setProject });
  }

  return Object.freeze({ shortDuration, prepareTimeline, mount });
});
