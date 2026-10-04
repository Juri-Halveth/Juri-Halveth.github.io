/* Juris Space. Local presentation settings only. See LICENSES.md. */
'use strict';
(() => {
  const M = window.SpaceModel, data = window.JurisSpaceData;
  const byId = id => document.getElementById(id);
  try { M.validateData(data); } catch (error) {
    byId('storage-note').textContent = 'Der statische Atlas ist erreichbar. Die lokale Auswahl konnte nicht geladen werden.';
    console.error(error.message); return;
  }
  const KEY = 'juris-space-settings-v1';
  let raw = null, canStore = true;
  try { raw = localStorage.getItem(KEY); } catch (_) { canStore = false; }
  const url = new URL(location.href);
  const state = M.readSettings(data, raw, url.searchParams.get('lang'));
  if (data.projects.some(p => p.id === url.searchParams.get('project'))) state.project = url.searchParams.get('project');
  let group = 'all', query = '';
  const english = {
    skip:'Skip to content', brandLabel:'Juris Space home', navLabel:'Main navigation', navFocus:'Continue', navProjects:'Project atlas', navCertificates:'Work certificates',
    theme:'Daylight view', eyebrow:'HALVETH / LUCINET · Ideas in motion', heroTitle:'From an impulse<br><em>to a whole world.</em>',
    heroLead:'Form becomes movement. Knowledge becomes design. We build worlds, connect their stories and bring you into the flow.',
    motionLabel:'HALVETH animation', motionCanvasLabel:'A light impulse grows into an organic form with orbiting light trails. Use the controls below to adjust time and glow.',
    motionTime:'Time', motionSpeed:'Speed', motionGlow:'Glow', motionLoop:'Repeat', motionImpulse:'01 Impulse', motionGrow:'02 Grow', motionConnect:'03 Connect', motionTransform:'04 Transform', motionFlow:'05 Flow', motionSource:'Discover the design ↗',
    motionCaption:'An original space of curves, light and time. Hold the moment, glide back or change its glow.',
    snapshot:'Atlas recorded', focusEyebrow:'Continue here', localNote:'Your focus stays in this browser.', source:'Source collection',
    currentState:'Current state', nextStep:'Next step', related:'Connected routes', projectEyebrow:'The shared collection', projectsTitle:'Your project atlas.',
    projectIntro:'Choose a route. Its state and next step appear above.', filtersLabel:'Project areas', groupAll:'All', groupWorlds:'Worlds', groupLearning:'Learning', groupResearch:'Research', groupTools:'Tools', groupArchive:'Archive & profile',
    searchLabel:'Search projects', emptyTitle:'A new search route.', emptyText:'This search has no entry in the atlas yet. Try another word or use “Reset search” to reopen the collection.', clearSearch:'Reset search',
    principlesEyebrow:'Keep the thread', principlesTitle:'A clear state.<br>Room for the next.', p1Title:'Pick up where you left off.', p1Text:'Your selected project, language and view are saved locally. Your focus is ready when you return.',
    p2Title:'Keep sources close.', p2Text:'Every entry leads to its public origin. Developments retain their branch and their current state.',
    p3Title:'Keep your own route.', p3Text:'You decide when to open another room. Selecting a project shows its context first.',
    archiveLabel:'Records and archive', archiveTitle:'Find the work and its provenance.', archiveText:'Work certificates, research and the earlier public collection remain accessible.',
    publicArchive:'Public archive', researchReport:'Research report', atlasData:'Atlas as JSON', contactEyebrow:'Have a concrete idea?', contactTitle:'Let’s keep building.',
    contactText:'A source, correction or collaboration: name the project and the contribution.', rights:'Rights & provenance', licenses:'Licenses',
    privacy:'Local continuation point · no analytics trackers', licenseCaption:'Original portal contributions: HALVETH PIRL 2.0 / Source Available. Linked projects retain their own licenses.'
  };
  const staticNodes = [...document.querySelectorAll('[data-i18n]')];
  const german = new Map(staticNodes.map(n => [n, n.innerHTML]));
  const ariaNodes = [...document.querySelectorAll('[data-i18n-aria]')];
  const germanAria = new Map(ariaNodes.map(n => [n, n.getAttribute('aria-label')]));
  const cards = [...document.querySelectorAll('[data-project]')];
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); canStore = true; }
    catch (_) { canStore = false; }
    storageNote();
  }
  function storageNote() {
    byId('storage-note').textContent = state.language === 'en'
      ? canStore ? 'Your focus stays in this browser.' : 'Your focus stays for this visit. Browser storage is unavailable.'
      : canStore ? 'Dein Fokus bleibt in diesem Browser.' : 'Dein Fokus bleibt für diesen Besuch. Browserspeicherung ist nicht verfügbar.';
  }
  function syncUrl() {
    const next = new URL(location.href);
    next.searchParams.set('lang', state.language);
    next.searchParams.set('project', state.project);
    history.replaceState(null, '', next);
  }
  function entryUrl(project) {
    const result = new URL(project.entry);
    if (project.id === 'SCARLET') result.searchParams.set('lang', state.language);
    return result.href;
  }
  function renderFocus() {
    const p = M.select(data, state.project), lang = state.language;
    byId('focus-heading').textContent = p.name;
    for (const [id, key] of [['focus-tag','tag'], ['focus-description','description'], ['focus-state','state'], ['focus-next','next']]) byId(id).textContent = M.field(p, key, lang);
    const open = byId('focus-open'); open.href = entryUrl(p); open.textContent = M.field(p, 'entryLabel', lang) + ' ↗';
    byId('focus-source').href = p.url;
    byId('focus-source').textContent = lang === 'en' ? p.kind === 'site' ? 'Website source' : 'Source collection' : p.kind === 'site' ? 'Website-Ursprung' : 'Quellbestand';
    const related = byId('focus-related'); related.replaceChildren();
    p.related.forEach(id => {
      const target = M.select(data, id), button = document.createElement('button');
      button.type = 'button'; button.dataset.choose = id; button.textContent = target.name;
      related.append(button);
    });
    cards.forEach(card => {
      const selected = card.dataset.project === p.id;
      card.dataset.selected = String(selected);
      const button = card.querySelector('[data-choose]');
      button.setAttribute('aria-pressed', String(selected));
      button.textContent = lang === 'en' ? selected ? 'Your focus ✓' : 'Choose as focus' : selected ? 'Dein Fokus ✓' : 'Als Fokus wählen';
      button.setAttribute('aria-label', (lang === 'en' ? 'Focus: ' : 'Fokus: ') + M.select(data, card.dataset.project).name);
    });
  }
  function applyFilter() {
    const visible = new Set(M.filter(data, group, query).map(p => p.id));
    cards.forEach(card => { card.hidden = !visible.has(card.dataset.project); });
    document.querySelectorAll('[data-group]').forEach(button => {
      if (button.tagName === 'BUTTON') button.setAttribute('aria-pressed', String(button.dataset.group === group));
    });
    byId('result-count').textContent = state.language === 'en' ? visible.size + ' of ' + data.projects.length + ' entries' : visible.size + ' von ' + data.projects.length + ' Einträgen';
    byId('empty-state').hidden = visible.size !== 0;
  }
  function renderLanguage() {
    const en = state.language === 'en';
    document.documentElement.lang = state.language;
    document.title = en ? 'Juris Space · HALVETH / LUCINET · Project atlas' : 'Juris Space · HALVETH / LUCINET · Projektatlas';
    staticNodes.forEach(node => { node.innerHTML = en ? english[node.dataset.i18n] || german.get(node) : german.get(node); });
    ariaNodes.forEach(node => node.setAttribute('aria-label', en ? english[node.dataset.i18nAria] || germanAria.get(node) : germanAria.get(node)));
    document.querySelectorAll('[data-lang]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === state.language)));
    byId('project-search').placeholder = en ? 'Search a project or topic' : 'Projekt oder Thema suchen';
    byId('inventory').textContent = data.repositoryCount + (en ? ' repositories · ' : ' Repositories · ') + data.siteCount + (en ? ' websites' : ' Websites');
    byId('snapshot-time').dateTime = data.recordedAt;
    byId('snapshot-time').textContent = M.dateLabel(data.recordedAt, state.language);
    cards.forEach(card => {
      const p = M.select(data, card.dataset.project);
      card.querySelector('[data-card-tag]').textContent = M.field(p, 'tag', state.language);
      card.querySelector('[data-card-description]').textContent = M.field(p, 'description', state.language);
      const link = card.querySelector('[data-card-open]'); link.href = entryUrl(p); link.textContent = en ? 'Open ↗' : 'Öffnen ↗';
    });
    document.querySelector('meta[name="description"]').content = en ? 'Juris Space connects HALVETH and LUCINET: worlds, learning, research and tools with a clear place to continue.' : 'Juris Space verbindet HALVETH und LUCINET: Welten, Lernen, Forschung und Werkzeuge mit einem klaren Fortsetzungspunkt.';
    renderTheme(); renderFocus(); applyFilter(); storageNote();
  }
  function renderTheme() {
    document.documentElement.dataset.theme = state.theme;
    const dark = state.theme === 'dark';
    byId('theme').setAttribute('aria-pressed', String(dark));
    byId('theme').textContent = state.language === 'en' ? dark ? 'Daylight view' : 'Evening view' : dark ? 'Tagesansicht' : 'Abendansicht';
    document.querySelector('meta[name="theme-color"]').content = dark ? '#0c0e10' : '#f1eee8';
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('button[data-choose]');
    if (!button) return;
    const relatedSelection = byId('focus-related').contains(button);
    const p = M.select(data, button.dataset.choose);
    state.project = p.id; renderFocus(); persist(); syncUrl();
    byId('selection-announcement').textContent = (state.language === 'en' ? 'Focus selected: ' : 'Fokus gewählt: ') + p.name;
    if (relatedSelection) {
      const heading = byId('focus-heading');
      heading.tabIndex = -1;
      heading.focus({preventScroll: true});
    }
  });
  document.querySelectorAll('[data-lang]').forEach(button => button.addEventListener('click', () => {
    state.language = button.dataset.lang; renderLanguage(); persist(); syncUrl();
  }));
  document.querySelectorAll('.filters [data-group]').forEach(button => button.addEventListener('click', () => { group = button.dataset.group; applyFilter(); }));
  byId('project-search').addEventListener('input', event => { query = event.target.value; applyFilter(); });
  byId('clear-search').addEventListener('click', () => { group = 'all'; query = ''; byId('project-search').value = ''; applyFilter(); byId('project-search').focus(); });
  byId('theme').addEventListener('click', () => { state.theme = state.theme === 'light' ? 'dark' : 'light'; renderTheme(); persist(); });
  renderLanguage(); persist();
})();
