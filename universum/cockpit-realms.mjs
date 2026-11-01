import { SEEDS, EPOCHS, snapshot, reset } from './realms-model.mjs';
import { pair } from './realms-pair.mjs';

// This is a local projection of the pinned fictional model, never a live world.
const MAP_BOUND = 125;
const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]';
let room = null;
let elements = null;
let view = reset();
let selectedNpcId = 'npc-1';
let comparisonSeedId = 'hain';
let returnFocus = null;
let priorAppInert = null;

export function projectXZ(x, z) {
  if (!Number.isFinite(x) || !Number.isFinite(z)) throw new TypeError('Finite model coordinates required.');
  return Object.freeze({ left: 50 + x / MAP_BOUND * 46, top: 50 - z / MAP_BOUND * 46 });
}

export function parseEpoch(value) {
  if (typeof value !== 'string' || !/^(?:0|[1-9]|10)$/.test(value)) {
    throw new RangeError('Choose an exact model epoch from 0 through 10.');
  }
  return Number(value);
}

function formatSigned(value) {
  if (!Number.isFinite(value)) throw new TypeError('Finite model coordinate difference required.');
  if (value === 0) return '0.000';
  return `${value > 0 ? '+' : '−'}${Math.abs(value).toFixed(3)}`;
}

function memberships(side) {
  const names = side.guilds.filter(guild => guild.memberIds.includes(side.npc.id))
    .map(guild => `${guild.name} (${guild.id})`);
  return names.length ? names.join(', ') : 'Keine';
}

function guildName(npc) {
  return npc.guild ? `${npc.guild.name} (${npc.guild.id})` : 'Ohne Gildenzuordnung';
}

/** Display-only wording; all comparisons are between seeded model states, never movement. */
export function describePair(result) {
  if (result?.kind !== 'REALMS_SAME_EPOCH_SEED_PAIR' || result.timeBasis !== 'MODEL_EPOCH') {
    throw new TypeError('Expected a bound Realms same-epoch pair.');
  }
  const side = item => ({
    heading: `${item.seedLabel} · ${item.seedId}`,
    rows: [
      ['Seed-Text', item.seed],
      ['NPC', `${item.npc.name} · ${item.npc.id} · ${item.npc.role}`],
      ['Position', `x ${item.npc.position.x}, z ${item.npc.position.z} · Modellkoordinaten`],
      ['Gilde', guildName(item.npc)],
      ['Gildenbeitritt', item.npc.joinsGuilds ? 'Ja, generiertes Modellmerkmal' : 'Nein, generiertes Modellmerkmal'],
      ['Mitgliedschaften', memberships(item)]
    ]
  });
  const guildChanges = result.difference.guildMembership.entries
    .filter(entry => !entry.sameMembers)
    .map(entry => `${entry.guildId}: nur A ${entry.leftOnly.join(', ') || '–'}; nur B ${entry.rightOnly.join(', ') || '–'}`);
  return {
    title: `Seed-Vergleich · ${result.left.npc.name} · ${result.selectedNpcId} · Epoche ${result.epoch}`,
    summary: result.difference.sameSeed
      ? 'Gleicher Seed auf beiden Seiten: deterministische Nullkontrolle; beide Weltzustände decken sich.'
      : 'Zwei Seed-Welten derselben gepinnten Regeln, derselben Modellepoche und derselben NPC-Vorlagen-ID.',
    left: side(result.left),
    right: side(result.right),
    differences: [
      { type: result.difference.position.kind, label: 'Koordinatendifferenz B − A',
        value: `Δx ${formatSigned(result.difference.position.dx)}, Δz ${formatSigned(result.difference.position.dz)} · Modellkoordinaten; kein Weg und keine Bewegung` },
      { type: result.difference.culture.kind, label: 'Gildenzuordnung',
        value: result.difference.culture.same ? 'Gleich' : 'Verschieden' },
      { type: result.difference.joinFlag.kind, label: 'Generiertes Beitrittsmerkmal',
        value: result.difference.joinFlag.same ? 'Gleich' : 'Verschieden' },
      { type: result.difference.guildMembership.kind, label: 'Mitgliedermengen aller Modellgilden',
        value: guildChanges.length ? guildChanges.join(' · ') : 'Gleich' }
    ]
  };
}

function text(tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = value;
  return element;
}

function mount() {
  if (room || typeof document === 'undefined') return;
  room = document.createElement('section');
  room.id = 'realmsRoom';
  room.className = 'realms-room';
  room.setAttribute('role', 'dialog');
  room.setAttribute('aria-modal', 'true');
  room.setAttribute('aria-labelledby', 'realmsRoomTitle');
  room.hidden = true;
  // Static shell only. Every model-derived value below is inserted with textContent.
  room.innerHTML = `
    <div class="realms-room__frame">
      <header class="realms-room__header">
        <div><span class="realms-room__eyebrow">REALMS / LOKALER MODELLRAUM</span>
          <h2 id="realmsRoomTitle" tabindex="-1">Zwei Seeds, eine Epoche</h2>
          <p>Deterministische, fiktionale x/z-Projektionen desselben lokal gepinnten Weltmodells.</p></div>
        <div class="realms-room__header-actions"><button type="button" class="realms-room__jump">Welt steuern ↓</button><button type="button" class="realms-room__close" aria-label="Realms-Modellraum schließen">Zurück zum Portal ×</button></div>
      </header>
      <div class="realms-room__layout">
        <section class="realms-room__world" aria-labelledby="realmsMapTitle">
          <div class="realms-room__section-head"><h3 id="realmsMapTitle">Weltkarte</h3><span>+z ↑ · +x →</span></div>
          <div class="realms-room__map" role="group" aria-label="Modellkarte mit sechs Landmarken, 18 auswählbaren NPC-Markern und einer passiven B-Vergleichsposition">
            <div class="realms-room__landmarks" aria-hidden="true"></div>
            <div class="realms-room__markers"></div>
          </div>
          <p class="realms-room__map-note">Schematischer Ausschnitt x/z −125 bis +125 Modellkoordinaten. A zeigt die auswählbaren NPCs; der gestrichelte B-Ring zeigt nur die Position derselben gewählten NPC-ID im zweiten Seed bei derselben Epoche. Er ist kein Weg oder Bewegungsverlauf. Überlappende NPCs bleiben in der Liste einzeln wählbar.</p>
          <div class="realms-room__landmark-key"><strong>Landmarken</strong><ul></ul></div>
        </section>
        <section class="realms-room__console" aria-labelledby="realmsConsoleTitle">
          <div class="realms-room__section-head"><h3 id="realmsConsoleTitle">Weltzustand</h3><span class="realms-room__badge">MODELLZEIT</span></div>
          <div class="realms-room__controls">
            <label for="realmsSeed">Seed A · Weltkarte <select id="realmsSeed"></select></label>
            <label for="realmsCompareSeed">Seed B · Vergleich <select id="realmsCompareSeed"></select></label>
            <label for="realmsEpoch">Epoche <select id="realmsEpoch"></select></label>
            <label for="realmsEpochRange" class="realms-room__range-label">Epoche 0–10 <output id="realmsEpochOutput" for="realmsEpochRange">0 / 10</output></label>
            <input id="realmsEpochRange" type="range" min="0" max="10" step="1" value="0" aria-label="Fiktionale Modellepoche 0 bis 10 wählen">
            <div class="realms-room__buttons"><button type="button" class="realms-room__step">+1 Epoche</button><button type="button" class="realms-room__reset">Epoche auf 0</button></div>
          </div>
          <p class="realms-room__status" role="status" aria-live="polite"></p>
          <div class="realms-room__guilds"><h4>Gilden / Kulturen</h4><ul></ul></div>
          <div class="realms-room__people"><h4>NPCs · stabile IDs</h4><div class="realms-room__people-list" role="group" aria-label="NPC auswählen"></div></div>
          <div class="realms-room__detail" aria-live="polite"><h4>NPC</h4><dl></dl><strong>Modellinterne Erinnerung</strong><ol></ol></div>
          <div class="realms-room__pair" aria-labelledby="realmsPairTitle">
            <h4 id="realmsPairTitle">Seed-Vergleich</h4>
            <p class="realms-room__pair-summary" role="status" aria-live="polite"></p>
            <div class="realms-room__pair-sides"><section class="realms-room__pair-side"><h5>A</h5><dl></dl></section><section class="realms-room__pair-side"><h5>B</h5><dl></dl></section></div>
            <div class="realms-room__pair-differences"><h5>Getypte Differenzen</h5><dl></dl></div>
          </div>
          <p class="realms-room__claim">Beide Seiten sind korrelierte, fiktionale Ausgaben desselben gepinnten Weltmodells. Die NPC-ID bezeichnet dieselbe Modellvorlage, keine reale Person. Eine Epoche ist ein Rechenschritt, keine reale Zeit. Koordinatendifferenzen sind keine Bewegung. Kein Server, Multiplayer, 3D-Messwert, Projektverlauf oder Außenweltereignis.</p>
        </section>
      </div>
    </div>`;
  document.body.append(room);
  elements = {
    close: room.querySelector('.realms-room__close'),
    jump: room.querySelector('.realms-room__jump'),
    seed: room.querySelector('#realmsSeed'),
    compareSeed: room.querySelector('#realmsCompareSeed'),
    epoch: room.querySelector('#realmsEpoch'),
    range: room.querySelector('#realmsEpochRange'),
    output: room.querySelector('#realmsEpochOutput'),
    step: room.querySelector('.realms-room__step'),
    reset: room.querySelector('.realms-room__reset'),
    status: room.querySelector('.realms-room__status'),
    map: room.querySelector('.realms-room__map'),
    landmarks: room.querySelector('.realms-room__landmarks'),
    markers: room.querySelector('.realms-room__markers'),
    landmarkKey: room.querySelector('.realms-room__landmark-key ul'),
    guilds: room.querySelector('.realms-room__guilds ul'),
    people: room.querySelector('.realms-room__people-list'),
    detail: room.querySelector('.realms-room__detail'),
    pair: room.querySelector('.realms-room__pair')
  };
  for (const seed of SEEDS) {
    const option = document.createElement('option');
    option.value = seed.id;
    option.textContent = seed.label;
    elements.seed.append(option);
    const comparisonOption = option.cloneNode(true);
    elements.compareSeed.append(comparisonOption);
  }
  for (const epoch of EPOCHS) {
    const option = document.createElement('option');
    option.value = String(epoch);
    option.textContent = `Epoche ${epoch}`;
    elements.epoch.append(option);
  }
  elements.close.addEventListener('click', close);
  elements.jump.addEventListener('click', () => {
    elements.seed.scrollIntoView({ block: 'center', behavior: 'auto' });
    elements.seed.focus();
  });
  elements.seed.addEventListener('change', () => commit(() => update(elements.seed.value, view.epoch)));
  elements.compareSeed.addEventListener('change', () => commit(() => {
    if (!SEEDS.some(seed => seed.id === elements.compareSeed.value)) throw new RangeError('Unknown comparison seed.');
    comparisonSeedId = elements.compareSeed.value;
    render();
  }));
  elements.epoch.addEventListener('change', () => commit(() => update(view.seedId, parseEpoch(elements.epoch.value))));
  elements.range.addEventListener('input', () => commit(() => update(view.seedId, parseEpoch(elements.range.value))));
  elements.step.addEventListener('click', () => update(view.seedId, Math.min(10, view.epoch + 1)));
  elements.reset.addEventListener('click', () => update(view.seedId, 0));
  if (typeof window !== 'undefined') window.addEventListener('resize', () => { if (isOpen()) renderLandmarks(); });
  room.addEventListener('keydown', trapKeys);
  render();
}

function commit(action) {
  try { action(); }
  catch (error) {
    if (!(error instanceof RangeError)) throw error;
    render();
    elements.status.textContent = `Auswahl abgelehnt: ${error.message}`;
  }
}

function update(seedId, epoch) {
  view = snapshot(seedId, epoch);
  render();
}

function renderLandmarks() {
  elements.landmarks.replaceChildren();
  elements.landmarkKey.replaceChildren();
  const mapWidth = elements.map.clientWidth || 700;
  const mapHeight = elements.map.clientHeight || 500;
  const occupied = [];
  const npcPoints = view.world.npcs.map(npc => {
    const point = projectXZ(npc.x, npc.z);
    return { x: point.left * mapWidth / 100, y: point.top * mapHeight / 100 };
  });
  for (const landmark of view.world.landmarks) {
    const point = projectXZ(landmark.x, landmark.z);
    const item = text('div', 'realms-room__landmark', '');
    item.style.left = `${point.left}%`;
    item.style.top = `${point.top}%`;
    item.style.setProperty('--marker-color', landmark.color);
    const x = point.left * mapWidth / 100;
    const y = point.top * mapHeight / 100;
    const labelWidth = Math.min(mapWidth - 12, Math.max(72, Math.min(132, landmark.name.length * 6.6 + 12)));
    const labelHeight = 24;
    const candidates = [
      { x: x + 22, y: y - labelHeight / 2 },
      { x: x - labelWidth - 22, y: y - labelHeight / 2 },
      { x: x - labelWidth / 2, y: y + 23 },
      { x: x - labelWidth / 2, y: y - labelHeight - 23 }
    ];
    const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    const scored = candidates.map((candidate, index) => {
      const outside = Math.max(0, 4 - candidate.x) + Math.max(0, candidate.x + labelWidth - mapWidth + 4)
        + Math.max(0, 4 - candidate.y) + Math.max(0, candidate.y + labelHeight - mapHeight + 4);
      const rect = {
        x: Math.max(4, Math.min(mapWidth - labelWidth - 4, candidate.x)),
        y: Math.max(4, Math.min(mapHeight - labelHeight - 4, candidate.y)),
        w: labelWidth,
        h: labelHeight
      };
      const npcHits = npcPoints.filter(npc => overlap(rect, { x: npc.x - 12, y: npc.y - 12, w: 24, h: 24 })).length;
      const labelHits = occupied.filter(other => overlap(rect, other)).length;
      return { rect, score: outside * 12 + npcHits * 30 + labelHits * 80 + index };
    });
    scored.sort((a, b) => a.score - b.score);
    const chosen = scored[0].rect;
    occupied.push(chosen);
    const label = text('div', 'realms-room__landmark-label', landmark.name);
    label.style.left = `${chosen.x}px`;
    label.style.top = `${chosen.y}px`;
    label.style.width = `${chosen.w}px`;
    label.style.setProperty('--marker-color', landmark.color);
    elements.landmarks.append(item, label);
    elements.landmarkKey.append(text('li', '', `${landmark.name} · ${landmark.id} · x ${landmark.x}, z ${landmark.z}`));
  }
}

function renderMarkers(comparison) {
  elements.markers.replaceChildren();
  renderGhost(comparison);
  for (const npc of view.world.npcs) {
    const point = projectXZ(npc.x, npc.z);
    const marker = text('button', 'realms-room__marker', '');
    marker.append(text('span', 'realms-room__marker-dot', npc.id.slice(4)));
    marker.type = 'button';
    marker.style.left = `${point.left}%`;
    marker.style.top = `${point.top}%`;
    marker.style.setProperty('--marker-color', npc.color);
    marker.setAttribute('aria-label', `${npc.id}: ${npc.name}, ${npc.role} auswählen`);
    marker.setAttribute('aria-pressed', String(npc.id === selectedNpcId));
    marker.title = `${npc.id} · ${npc.name}`;
    marker.addEventListener('click', () => selectNpc(npc.id));
    elements.markers.append(marker);
  }
}

function renderGhost(comparison) {
  elements.markers.querySelector('.realms-room__ghost')?.remove();
  const point = projectXZ(comparison.right.npc.position.x, comparison.right.npc.position.z);
  const ghost = text('div', 'realms-room__ghost', '');
  ghost.setAttribute('aria-hidden', 'true');
  ghost.style.left = `${point.left}%`;
  ghost.style.top = `${point.top}%`;
  elements.markers.prepend(ghost);
}

function renderGuilds() {
  elements.guilds.replaceChildren();
  if (!view.world.cultures.length) {
    elements.guilds.append(text('li', '', 'Noch keine Gilde gebildet. In diesem Modell beginnt die Bildung ab Epoche 3.'));
    return;
  }
  for (const guild of view.world.cultures) {
    const item = text('li', '', `${guild.name} · ${guild.id} · ${guild.members.length} Mitglieder · seit Epoche ${guild.formedAt}`);
    item.style.setProperty('--guild-color', guild.color);
    elements.guilds.append(item);
  }
}

function renderPeople() {
  elements.people.replaceChildren();
  for (const npc of view.world.npcs) {
    const button = text('button', '', `${npc.id} · ${npc.name}`);
    button.type = 'button';
    button.setAttribute('aria-pressed', String(npc.id === selectedNpcId));
    button.addEventListener('click', () => selectNpc(npc.id));
    elements.people.append(button);
  }
}

function renderDetail() {
  const npc = view.world.npcs.find(item => item.id === selectedNpcId);
  if (!npc) throw new TypeError('Selected NPC ID is absent from the pinned world.');
  const guild = view.world.cultures.find(item => item.id === npc.culture);
  elements.detail.querySelector('h4').textContent = `${npc.name} · ${npc.id}`;
  const facts = elements.detail.querySelector('dl');
  facts.replaceChildren();
  for (const [label, value] of [
    ['Rolle', npc.role],
    ['Kultur', guild ? `${guild.name} (${guild.id})` : 'Ohne Gildenzuordnung'],
    ['Position', `x ${npc.x}, z ${npc.z} · Modellkoordinaten`]
  ]) {
    const row = document.createElement('div');
    row.append(text('dt', '', label), text('dd', '', value));
    facts.append(row);
  }
  const memory = elements.detail.querySelector('ol');
  memory.replaceChildren(...npc.memory.map(entry => text('li', '', entry)));
}

function appendFacts(target, rows) {
  target.replaceChildren();
  for (const [label, value, type] of rows) {
    const row = document.createElement('div');
    if (type) row.dataset.relationType = type;
    row.append(text('dt', '', label), text('dd', '', value));
    target.append(row);
  }
}

function renderPair(comparison) {
  const content = describePair(comparison);
  elements.pair.querySelector('h4').textContent = content.title;
  elements.pair.querySelector('.realms-room__pair-summary').textContent = content.summary;
  const sides = elements.pair.querySelectorAll('.realms-room__pair-side');
  for (const [index, side] of [content.left, content.right].entries()) {
    sides[index].querySelector('h5').textContent = `${index === 0 ? 'A' : 'B'} · ${side.heading}`;
    appendFacts(sides[index].querySelector('dl'), side.rows);
  }
  appendFacts(elements.pair.querySelector('.realms-room__pair-differences dl'),
    content.differences.map(entry => [entry.label, entry.value, entry.type]));
}

function selectNpc(id) {
  if (!view.world.npcs.some(npc => npc.id === id)) throw new RangeError('Unknown pinned NPC ID.');
  selectedNpcId = id;
  for (const button of [...elements.people.querySelectorAll('button'), ...elements.markers.querySelectorAll('button')]) {
    const isSelected = button.getAttribute('aria-label')?.startsWith(`${id}:`) || button.textContent.startsWith(`${id} ·`);
    button.setAttribute('aria-pressed', String(Boolean(isSelected)));
  }
  renderDetail();
  const comparison = pair(view.seedId, comparisonSeedId, view.epoch, selectedNpcId);
  renderGhost(comparison);
  renderPair(comparison);
}

function render() {
  if (!elements) return;
  const comparison = pair(view.seedId, comparisonSeedId, view.epoch, selectedNpcId);
  elements.seed.value = view.seedId;
  elements.compareSeed.value = comparisonSeedId;
  elements.epoch.value = String(view.epoch);
  elements.range.value = String(view.epoch);
  elements.output.textContent = `${view.epoch} / 10`;
  elements.step.disabled = view.epoch === 10;
  elements.status.textContent = `${view.seedLabel} · Epoche ${view.epoch} · ${view.world.landmarks.length} Landmarken · ${view.world.npcs.length} NPCs · ${view.world.cultures.length} Gilden`;
  renderLandmarks();
  renderMarkers(comparison);
  renderGuilds();
  renderPeople();
  renderDetail();
  renderPair(comparison);
}

function trapKeys(event) {
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    close();
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = [...room.querySelectorAll(FOCUSABLE)].filter(item => item.getClientRects().length > 0);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) { last.focus(); event.preventDefault(); }
  else if (!event.shiftKey && document.activeElement === last) { first.focus(); event.preventDefault(); }
}

export function isOpen() {
  return Boolean(room && !room.hidden);
}

export function open(triggerElement) {
  if (typeof document === 'undefined') return false;
  mount();
  if (isOpen()) return true;
  returnFocus = triggerElement instanceof Element ? triggerElement : document.activeElement;
  const app = document.querySelector('#appShell');
  priorAppInert = app ? app.inert : null;
  if (app) app.inert = true;
  room.hidden = false;
  renderLandmarks();
  room.querySelector('#realmsRoomTitle').focus();
  return true;
}

export function close() {
  if (!isOpen()) return false;
  room.hidden = true;
  const app = document.querySelector('#appShell');
  if (app && priorAppInert !== null) app.inert = priorAppInert;
  priorAppInert = null;
  const fallback = document.querySelector('#projectList .list-item[data-project-id="halveth-realms"]')
    || document.querySelector('.portal[data-project-id="halveth-realms"]')
    || document.querySelector('#projectSearch');
  const target = returnFocus?.isConnected && returnFocus.getClientRects().length ? returnFocus : fallback;
  target?.focus?.();
  returnFocus = null;
  return true;
}

if (typeof document !== 'undefined') mount();
