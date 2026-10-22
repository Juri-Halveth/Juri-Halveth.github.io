'use strict';

const { createHash } = require('node:crypto');
const digest = value => createHash('sha256').update(value).digest('hex');
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const requireThat = (condition, message) => { if (!condition) throw new Error(`Research OS index: ${message}`); };

function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  return JSON.stringify(value);
}

function validateResearchIndex(index) {
  requireThat(index && typeof index === 'object' && !Array.isArray(index), 'object expected');
  requireThat(index.schemaVersion === '1.0.0' && index.generatorVersion === '0.1.0', 'unsupported version');
  const { digest: actualDigest, ...body } = index;
  requireThat(typeof actualDigest === 'string' && digest(canonical(body)) === actualDigest, 'digest mismatch');
  for (const key of ['entities', 'relations', 'evidence', 'events', 'claims']) requireThat(Array.isArray(index[key]), `${key} missing`);
  requireThat(index.claims.length === 0 && index.claimCeiling === 'PINNED_PUBLIC_SOURCE_INDEX_ONLY', 'claim ceiling changed');
  const entities = new Map();
  for (const entity of index.entities) {
    requireThat(typeof entity.id === 'string' && !entities.has(entity.id), 'duplicate or invalid entity');
    const { digest: entityDigest, ...entityBody } = entity;
    requireThat(digest(canonical(entityBody)) === entityDigest, `entity digest mismatch: ${entity.id}`);
    requireThat(entity.source.visibility === 'PUBLIC', `private source: ${entity.id}`);
    requireThat(/^Juri-Halveth\/[A-Za-z0-9._-]+$/.test(entity.source.repo), `unexpected repository: ${entity.id}`);
    requireThat(/^[0-9a-f]{40}$/.test(entity.source.revision) && /^[0-9a-f]{64}$/.test(entity.source.sha256), `unbound source: ${entity.id}`);
    const expected = `https://github.com/${entity.source.repo}/blob/${entity.source.revision}/${entity.source.path}`;
    requireThat(entity.source.url === expected, `source URL mismatch: ${entity.id}`);
    requireThat(entity.demo === null || /^https:\/\/juri-halveth\.github\.io\/(?:[A-Za-z0-9._-]+\/)?$/.test(entity.demo), `unexpected demo URL: ${entity.id}`);
    requireThat(Array.isArray(entity.unknowns), `unknowns missing: ${entity.id}`);
    entities.set(entity.id, entity);
  }
  for (const relation of index.relations) {
    requireThat(relation.type === 'PRESENTS_PROJECT' && relation.direction === 'LEFT_TO_RIGHT', 'unexpected relation type');
    for (const endpoint of [relation.left, relation.right]) {
      requireThat(entities.get(endpoint.id)?.digest === endpoint.digest, `unresolved relation endpoint: ${endpoint.id}`);
    }
    requireThat(relation.source?.repo === 'Juri-Halveth/Juri-Halveth.github.io', 'relation source mismatch');
    requireThat(relation.source.path === 'data/projects.json' && /^[0-9a-f]{40}$/.test(relation.source.revision) && /^[0-9a-f]{64}$/.test(relation.source.sha256), 'unbound relation source');
    requireThat(relation.source.url === `https://github.com/${relation.source.repo}/blob/${relation.source.revision}/${relation.source.path}`, 'relation source URL mismatch');
  }
  const receipts = new Map();
  for (const receipt of index.evidence) {
    const subject = entities.get(receipt.subjectId);
    requireThat(subject && receipt.source?.visibility === 'PUBLIC', 'invalid evidence subject');
    requireThat(canonical(receipt.source) === canonical(subject.source), 'evidence source mismatch');
    requireThat(receipt.claimCeiling === 'README_BYTES_AND_REVISION_ONLY', 'evidence ceiling changed');
    requireThat(!receipts.has(receipt.id), 'duplicate evidence');
    receipts.set(receipt.id, receipt);
  }
  for (const event of index.events) {
    requireThat(entities.has(event.subjectId) && event.claimCeiling === 'CAPTURE_TIME_NOT_SOURCE_CREATION_TIME', 'invalid capture event');
    requireThat(receipts.get(event.sourceEvidenceId)?.subjectId === event.subjectId, 'unresolved capture receipt');
  }
  return index;
}

const words = {
  de: { eyebrow: 'HALVETH / PUBLIC RESEARCH OS', title: 'Eine Welt. Vier prüfbare Einstiege.', lead: 'Projekte, Quellen und Beziehungen bleiben getrennt sichtbar. Jede Karte führt zum echten Quellstand; offene Fragen bleiben offen.', projectsLabel: 'Projekte', relationsLabel: 'Relationen', evidenceLabel: 'Quellenbelege', try: 'Anwendung öffnen', source: 'README am gebundenen Commit', evidence: 'Quellenbeleg', unknown: 'Noch offen', relations: 'Beziehungen mit Herkunft', time: 'Erfasst', status: 'Prüfstand', statusText: 'Dieser Index bindet öffentliche README-Bytes und Portfolio-Einträge. Er führt keine Projektfunktion aus und behauptet keine externe Wirkung.', standalone: 'Eigenständiger Einstieg; im gebundenen Portfolio-Katalog noch keine Beziehung.', connects: 'führt im Portfolio zu', digest: 'Index-Digest', note: 'Erfassungszeit ist nicht Entstehungszeit der Quelle.' },
  en: { eyebrow: 'HALVETH / PUBLIC RESEARCH OS', title: 'One world. Four inspectable entries.', lead: 'Projects, sources and relationships remain separately visible. Each card leads to its pinned source; open questions stay open.', projectsLabel: 'Projects', relationsLabel: 'Relations', evidenceLabel: 'Source receipts', try: 'Open application', source: 'README at pinned commit', evidence: 'Source receipt', unknown: 'Still open', relations: 'Relationships with sources', time: 'Captured', status: 'Evidence boundary', statusText: 'This index binds public README bytes and portfolio entries. It does not execute the projects or establish real-world effects.', standalone: 'Independent entry; no relation in the pinned portfolio catalog.', connects: 'portfolio presents', digest: 'Index digest', note: 'Capture time is not source creation time.' },
  ru: { eyebrow: 'HALVETH / PUBLIC RESEARCH OS', title: 'Один мир. Четыре проверяемых входа.', lead: 'Проекты, источники и связи показаны отдельно. Каждая карточка ведёт к закреплённой версии; открытые вопросы остаются открытыми.', projectsLabel: 'Проекты', relationsLabel: 'Связи', evidenceLabel: 'Источники', try: 'Открыть проект', source: 'README в закреплённом коммите', evidence: 'Источник', unknown: 'Открыто', relations: 'Связи с источниками', time: 'Записано', status: 'Граница проверки', statusText: 'Индекс связывает общедоступные README и записи портфолио. Он не запускает проекты и не доказывает внешние результаты.', standalone: 'Самостоятельный вход; в закреплённом каталоге портфолио связь отсутствует.', connects: 'портфолио представляет', digest: 'Дайджест индекса', note: 'Время записи не является временем создания источника.' }
};
const maturityLabels = {
  de: { 'locally-tested-model': 'Lokal geprüftes Modell', 'published-website': 'Veröffentlichte Webseite', 'browser-prototype': 'Browser-Prototyp' },
  en: { 'locally-tested-model': 'Locally tested model', 'published-website': 'Published website', 'browser-prototype': 'Browser prototype' },
  ru: { 'locally-tested-model': 'Локально проверенная модель', 'published-website': 'Опубликованный сайт', 'browser-prototype': 'Прототип в браузере' }
};
const countTitle = {
  de: count => `Eine Welt. ${count} prüfbare Einstiege.`,
  en: count => `One world. ${count} inspectable entries.`,
  ru: count => `Один мир. ${count} проверяемых входов.`
};
const pendingDemo = {
  de: 'Browserdemo noch nicht veröffentlicht',
  en: 'Browser demo not published yet',
  ru: 'Браузерная демонстрация ещё не опубликована'
};

function renderResearchOS(input, lang) {
  const index = validateResearchIndex(input);
  const t = words[lang];
  requireThat(t, 'unsupported language');
  const linked = new Set(index.relations.map(relation => relation.right.id));
  const cards = index.entities.map(entity => {
    const label = lang === 'de' ? entity.name.de : entity.name.en;
    const receipt = index.evidence.find(item => item.subjectId === entity.id);
    const pathText = entity.id === 'urn:halveth:project:portfolio' ? t.relations : linked.has(entity.id) ? t.connects : t.standalone;
    return `<article class="ros-card" id="${escape(entity.id.split(':').at(-1))}"><div class="ros-orb" aria-hidden="true"></div><div class="ros-card-body"><p class="ros-kind">${escape(maturityLabels[lang][entity.maturity] || entity.maturity)}</p><h2>${escape(label)}</h2><p class="ros-path">${escape(pathText)}</p><div class="ros-actions">${entity.demo ? `<a href="${escape(entity.demo)}">${escape(t.try)} ↗</a>` : `<span class="ros-demo-pending">${escape(pendingDemo[lang])}</span>`}<a href="${escape(entity.source.url)}">${escape(t.source)} ↗</a></div><details><summary>${escape(t.evidence)} / ${escape(t.unknown)}</summary><p><strong>${escape(t.evidence)}:</strong> ${escape(receipt.source.repo)} @ ${escape(receipt.source.revision.slice(0, 12))} · SHA-256 ${escape(receipt.source.sha256.slice(0, 16))}…</p><ul>${entity.unknowns.map(value => `<li>${escape(value)}</li>`).join('')}</ul></details></div></article>`;
  }).join('');
  const relations = index.relations.map(relation => {
    const left = index.entities.find(entity => entity.id === relation.left.id);
    const right = index.entities.find(entity => entity.id === relation.right.id);
    const from = lang === 'de' ? left.name.de : left.name.en;
    const to = lang === 'de' ? right.name.de : right.name.en;
    return `<li><span>${escape(from)}</span><span class="ros-edge">${escape(t.connects)}</span><span>${escape(to)}</span><a href="${escape(relation.source.url)}">${escape(lang === 'de' ? 'Portfolio-Katalog am gebundenen Commit' : lang === 'ru' ? 'Каталог портфолио в закреплённом коммите' : 'Portfolio catalog at pinned commit')} ↗</a></li>`;
  }).join('');
  return `<div class="research-os"><section class="ros-hero"><div class="shell"><p class="eyebrow">${escape(t.eyebrow)}</p><h1>${escape(countTitle[lang](index.entities.length))}</h1><p class="ros-lead">${escape(t.lead)}</p><div class="ros-counts"><span>${index.entities.length} ${escape(t.projectsLabel)}</span><span>${index.relations.length} ${escape(t.relationsLabel)}</span><span>${index.evidence.length} ${escape(t.evidenceLabel)}</span></div></div></section><section class="shell ros-main" aria-label="Research OS"><div class="ros-grid">${cards}</div><div class="ros-lower"><section class="ros-panel"><h2>${escape(t.relations)}</h2><ul class="ros-relation-list">${relations}</ul></section><aside class="ros-panel ros-status"><h2>${escape(t.status)}</h2><p>${escape(t.statusText)}</p><p>${escape(t.time)}: <time datetime="${escape(index.capturedAt)}">${escape(index.capturedAt)}</time></p><p>${escape(t.note)}</p><p class="ros-digest">${escape(t.digest)}: <code>${escape(index.digest)}</code></p></aside></div></section></div>`;
}

module.exports = { validateResearchIndex, renderResearchOS };
