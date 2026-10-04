/* Original Juris Space navigation. See LICENSES.md. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SpaceModel = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const GROUPS = ['all', 'worlds', 'learning', 'research', 'tools', 'archive'];
  const SETTINGS_VERSION = 1;
  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
  function validateData(data) {
    if (!data || data.schema !== 'halveth.juris-space.public.v1' || data.dataClass !== 'PUBLIC' || !Array.isArray(data.projects)) throw new Error('Invalid public atlas.');
    if (!Number.isFinite(Date.parse(data.recordedAt))) throw new Error('Invalid snapshot time.');
    const ids = new Set();
    for (const p of data.projects) {
      if (!/^[A-Z][A-Z0-9_]*$/.test(p.id) || ids.has(p.id)) throw new Error('Invalid or duplicate project ID.');
      ids.add(p.id);
      if (!GROUPS.includes(p.group) || p.group === 'all' || !['repository', 'site'].includes(p.kind)) throw new Error('Invalid project kind or group.');
      for (const key of ['name', 'description', 'descriptionEn', 'entryLabel', 'entryLabelEn', 'state', 'stateEn', 'next', 'nextEn', 'tag', 'tagEn']) {
        if (typeof p[key] !== 'string' || !p[key].trim()) throw new Error('Missing project text: ' + key);
      }
      for (const key of ['entry', 'url']) {
        const url = new URL(p[key]);
        if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Only public HTTPS links are allowed.');
        if (!['github.com', 'juri-halveth.github.io', 'halveth-scarlet-question.juri-janovski.chatgpt.site', 'lernstudio-wissen-fuer-alle.juri-janovski.chatgpt.site'].includes(url.hostname)) throw new Error('Unbound link host.');
      }
      if (!Array.isArray(p.related)) throw new Error('Missing related project IDs.');
      if (p.kind === 'repository' && (p.visibility !== 'public' || !p.defaultBranch)) throw new Error('Repository must be public and branch-bound.');
    }
    for (const p of data.projects) if (p.related.some(id => !ids.has(id) || id === p.id)) throw new Error('Invalid related project.');
    if (!ids.has(data.defaultProject)) throw new Error('Missing default focus.');
    if (data.projects.filter(p => p.kind === 'repository').length !== data.repositoryCount || data.projects.filter(p => p.kind === 'site').length !== data.siteCount) throw new Error('Incorrect inventory counts.');
    return true;
  }
  function readSettings(data, raw, urlLanguage) {
    let value = {};
    try { const parsed = JSON.parse(raw || '{}'); if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.version === SETTINGS_VERSION) value = parsed; } catch (_) {}
    const project = data.projects.some(p => p.id === value.project) ? value.project : data.defaultProject;
    const language = ['de', 'en'].includes(urlLanguage) ? urlLanguage : ['de', 'en'].includes(value.language) ? value.language : 'de';
    const theme = ['light', 'dark'].includes(value.theme) ? value.theme : 'dark';
    return {version: SETTINGS_VERSION, project, language, theme};
  }
  function select(data, id) {
    const project = data.projects.find(p => p.id === id);
    if (!project) throw new Error('Unknown project ID.');
    return project;
  }
  function filter(data, group, query) {
    if (!GROUPS.includes(group)) throw new Error('Unknown group.');
    const words = normalize(query).split(/\s+/).filter(Boolean);
    return data.projects.filter(p => (group === 'all' || p.group === group) && words.every(word => normalize([p.name, p.description, p.descriptionEn, p.state, p.stateEn, p.next, p.nextEn, p.fullName || ''].join(' ')).includes(word)));
  }
  function field(project, key, language) { return language === 'en' && project[key + 'En'] ? project[key + 'En'] : project[key]; }
  function dateLabel(value, language, withTime = true) {
    if (!Number.isFinite(Date.parse(value))) throw new Error('Invalid date.');
    const options = {timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: 'numeric'};
    if (withTime) Object.assign(options, {hour: '2-digit', minute: '2-digit', timeZoneName: 'short', hourCycle: 'h23'});
    return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'de-DE', options).format(new Date(value));
  }
  return {GROUPS, SETTINGS_VERSION, validateData, readSettings, select, filter, field, dateLabel};
}));
