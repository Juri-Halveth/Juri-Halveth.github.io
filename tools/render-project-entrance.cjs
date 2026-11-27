'use strict';
// Public navigation, using the existing published spaces and the public inventory.
// Path/version terms: LICENSES.md.
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const copy = {
 de: {
  eyebrow:'JURI / HALVETH', title:'Ideen entwickeln.<br>Zusammenhänge sichtbar machen.',
  lead:'Ich bin Juri. HALVETH verbindet meine Werkzeuge, interaktiven Modelle und Forschungsprojekte. Steig direkt in einen Raum ein oder finde das passende Projekt in der Liste.',
  open:'Projektuniversum öffnen', list:'Alle Projekte finden', profile:'Juri kennenlernen',
  space:'DER RÄUMLICHE EINSTIEG', spaceTitle:'Ein Projekt. Viele Wege weiter.',
  spaceText:'Im Starship Lab durch Projekte fliegen, einen Raum wählen und Anwendung oder Quellcode öffnen.',
  room:'Starship Lab betreten', count:'öffentliche Repositories', observed:'Quellenstand',
  state:'Öffentliche GitHub-Quellen werden regelmäßig eingelesen. Die Räume haben jeweils ihren eigenen Betriebsstand.',
  paths:'Direkte Wege', corridor:'KORRIDOT · Zeitkorridor', corridorText:'Ereignisse und ihre Herkunft als räumliche Zeitspur erkunden. Die öffentliche Standardspur ist eine Demo.',
  graph:'Fadennetz · Verbindungen', graphText:'Beziehungen zwischen öffentlichen Quellen und Modulen verfolgen.',
  search:'Netzsuche · gesamter Bestand', searchText:'Öffentliche Repositories und einzelne Module gemeinsam durchsuchen, auch außerhalb der kuratierten Auswahl.',
  details:'Wie die Stände zusammenhängen', detailsText:'Die Netzsuche folgt der öffentlichen GitHub-Inventur. Das Starship Lab zeigt eine ausgewählte Projektkarte. KORRIDOT und der Browser-Ledger führen eigene Modellzustände in der Browsersitzung; sie steuern keine anderen Anwendungen. Offene Entwicklungszweige findest du bei GitHub.',
  development:'Öffentliche Entwicklung ansehen', history:'Datierte Arbeitsproben', archive:'Prüfarchiv', archiveLead:'Hier liegen zwei dokumentierte Arbeitsproben vom 20. Oktober 2026. Für einen ersten Eindruck führen dich die Projekte und Räume schneller weiter.',
  tests:'Eingabe, Gegenprobe und Quellstand aufklappen'
 },
 en: {
  eyebrow:'JURI / HALVETH', title:'Develop ideas.<br>Make connections visible.',
  lead:'I’m Juri. HALVETH brings together my tools, interactive models and research projects. Enter a space directly or find the right project in the list.',
  open:'Open the project universe', list:'Find all projects', profile:'Meet Juri',
  space:'THE SPATIAL ENTRANCE', spaceTitle:'One project. Many ways forward.',
  spaceText:'Fly through projects in Starship Lab, choose a space and open its application or source code.',
  room:'Enter Starship Lab', count:'public repositories', observed:'Sources observed',
  state:'Public GitHub sources are refreshed regularly. Each space has its own operational state.',
  paths:'Direct paths', corridor:'KORRIDOT · timeline', corridorText:'Explore events and their provenance along a spatial timeline. The public default track is a demo.',
  graph:'Thread network · connections', graphText:'Follow relationships between public sources and modules.',
  search:'Network search · full inventory', searchText:'Search public repositories and individual modules together, including work outside the curated selection.',
  details:'How the different states connect', detailsText:'Network search follows the public GitHub inventory. Starship Lab presents a selected project map. KORRIDOT and the browser ledger maintain their own model states within the browser session; they do not control other applications. Open development branches are available on GitHub.',
  development:'View public development', history:'Dated work samples', archive:'Verification archive', archiveLead:'Two work samples documented on 20 October 2026 are preserved here. For a first impression, start with the projects and spaces.',
  tests:'Expand inputs, counterexamples and sources'
 },
 ru: {
  eyebrow:'ЮРИ / HALVETH', title:'Развивать идеи.<br>Делать связи видимыми.',
  lead:'Я Юри. HALVETH объединяет мои инструменты, интерактивные модели и исследовательские проекты. Откройте пространство или найдите нужный проект в списке.',
  open:'Открыть вселенную проектов', list:'Найти все проекты', profile:'Познакомиться с Юри',
  space:'ПРОСТРАНСТВЕННЫЙ ВХОД', spaceTitle:'Один проект. Много путей дальше.',
  spaceText:'Перемещайтесь между проектами в Starship Lab, выберите пространство и откройте приложение или исходный код.',
  room:'Войти в Starship Lab', count:'публичных репозиториев', observed:'Источники проверены',
  state:'Публичные источники GitHub регулярно обновляются. У каждого пространства своё рабочее состояние.',
  paths:'Прямые пути', corridor:'KORRIDOT · временной коридор', corridorText:'Исследуйте события и их происхождение в пространственной шкале времени. Основная публичная шкала — демонстрация.',
  graph:'Сеть нитей · связи', graphText:'Прослеживайте связи публичных источников и модулей.',
  search:'Поиск · весь публичный состав', searchText:'Ищите публичные репозитории и отдельные модули, включая работы вне редакционной подборки.',
  details:'Как связаны разные состояния', detailsText:'Поиск следует публичной инвентаризации GitHub. Starship Lab показывает избранную карту проектов. KORRIDOT и журнал браузера ведут собственные состояния модели в сеансе браузера и не управляют другими приложениями. Открытые ветки разработки доступны на GitHub.',
  development:'Открыть публичную разработку', history:'Датированные примеры работы', archive:'Архив проверок', archiveLead:'Здесь сохранены два примера работы, проверенные 20 октября 2026 года. Первое знакомство удобнее начать с проектов и пространств.',
  tests:'Раскрыть входные данные, контрпримеры и исходники'
 }
};
function renderProjectEntrance(search, lang) {
 const t=copy[lang]; if(!t) throw Error('Unknown entrance language');
 if(!Number.isSafeInteger(search?.counts?.repositories)||!Number.isFinite(Date.parse(search.observedAt))) throw Error('Observed public inventory required for entrance');
 const prefix=lang==='de'?'/':`/${lang}/`;
 const day=search.observedAt.slice(0,10);
 const [use,review,contact]={
  de:['Ein Projekt benutzen','Forschung prüfen','Zusammenarbeiten'],
  en:['Use a project','Review the research','Work together'],
  ru:['Открыть проект','Изучить исследования','Начать сотрудничество']
 }[lang];
 return `<section class="service-hero shell project-entrance" aria-labelledby="service-title"><div class="service-hero-copy"><p class="eyebrow">${t.eyebrow}</p><h1 id="service-title">${t.title}</h1><p class="service-lead">${t.lead}</p><div class="service-actions"><a class="button" data-primary-entrance href="/universum/">${t.open}</a><a class="text-link" href="${prefix}suche/">${t.list}</a></div><nav class="service-actions" aria-label="${t.paths}"><a href="#featured">${use}</a><a href="${prefix}forschung/">${review}</a><a href="#contact">${contact}</a></nav><a class="entrance-profile" href="${prefix}profil/">${t.profile}</a></div><a class="entrance-room" href="/universum/" aria-label="${t.room}"><div class="entrance-orbits" aria-hidden="true"><span></span><span></span><span></span><b>H</b><i></i><i></i><i></i></div><div class="entrance-room-copy"><p class="eyebrow">${t.space}</p><h2>${t.spaceTitle}</h2><p>${t.spaceText}</p><strong>${t.room}</strong></div></a></section><section class="shell entrance-current" aria-label="${esc(t.observed)}"><p><strong>${search.counts.repositories}</strong> ${t.count} <span>· ${t.observed} <time datetime="${esc(search.observedAt)}">${esc(day)}</time></span></p><p>${t.state}</p></section><section class="shell entrance-paths" aria-labelledby="entrance-paths-title"><h2 id="entrance-paths-title">${t.paths}</h2><div class="entrance-path-grid">${[
  ['01',t.corridor,t.corridorText,'https://juri-halveth.github.io/console-only/'],
  ['02',t.graph,t.graphText,'/universum/faden/'],
  ['03',t.search,t.searchText,`${prefix}suche/`]
 ].map(([n,title,description,url])=>`<a class="entrance-path" href="${url}"><span>${n}</span><h3>${title}</h3><p>${description}</p></a>`).join('')}</div><details class="entrance-contract"><summary>${t.details}</summary><p>${t.detailsText}</p><a href="https://github.com/search?q=user%3AJuri-Halveth+is%3Apr+is%3Aopen&type=pullrequests">${t.development}</a></details></section>`;
}
function renderEvidenceEntrance(lang){
 const t=copy[lang];if(!t)throw Error('Unknown entrance language');
 const prefix=lang==='de'?'/':`/${lang}/`;
 return `<section class="shell evidence-entry"><p class="eyebrow">${t.archive}</p><h1>${t.history}</h1><p class="lead">${t.archiveLead}</p><div class="service-actions"><a class="button" href="/universum/">${t.open}</a><a class="text-link" href="${prefix}suche/">${t.list}</a><a class="text-link" href="${prefix}profil/">${t.profile}</a></div></section>`;
}
module.exports={renderProjectEntrance,renderEvidenceEntrance,entranceWords:copy};
