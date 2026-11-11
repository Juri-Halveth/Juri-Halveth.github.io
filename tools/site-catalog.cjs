'use strict';
const {URL}=require('node:url');
const {renderProjectControls}=require('./render-project-controls.cjs');
const {guideLink,renderVisitorCorridor}=require('./render-visitor-corridor.cjs');
const languages=['de','en','ru'];
const groups=['software','worlds','research','learning'];
const withdrawnFromPortfolio=new Set(['halveth-unreal','halveth-realms','halveth-morrowind-genesis']);
const sourceLabels={de:{snapshot:'Quellstand',branch:'Code im Standardbranch'},en:{snapshot:'Source snapshot',branch:'Code on default branch'},ru:{snapshot:'Версия исходников',branch:'Код в основной ветке'}};
const releaseLabels={de:'Windows-Release',en:'Windows release',ru:'Выпуск для Windows'};
const prLabels={de:'Forschungsentwurf · PR',en:'Research draft · PR',ru:'Черновик исследования · PR'};
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const copy={
 de:{eyebrow:'JURI · SOFTWAREENTWICKLUNG',headline:'Software bauen. Ergebnisse prüfen.',lead:'Ich entwickle lokale Software, Webanwendungen und interaktive 3D-Modelle. Öffne Ergebnisse direkt oder prüfe den Code.',projects:'Projekte ansehen',contact:'Zusammenarbeit anfragen',github:'GitHub-Code',first:'Direkt öffnen',more:'Drei weitere ausgewählte Arbeiten',selection:'Vier ausgewählte Arbeiten aus dem aktuellen Portfolio.',method:'Wie ich arbeite',methodText:'Jede Arbeitsprobe nennt ihren Zweck, den aktuellen Stand und einen überprüfbaren Quell- oder Testpfad. Modelle und Prototypen bleiben als solche gekennzeichnet.',cases:'Arbeitsproben prüfen',all:'Alle aktuellen Projekte ansehen',directory:'Projekte',directoryLead:'13 aktuelle Projekte: Anwendung oder Anleitung direkt öffnen, Quellcode daneben.',meta:'Website und Profil',metaLead:'Zwei zusätzliche öffentliche Einstiege gehören zum Repository-Bestand, sind aber keine weiteren Produkte.',source:'Quellcode',guide:'Code & Anleitung',browser:'Im Browser verfügbar',sourceOnly:'Anleitung und Code',lab:'Interaktives Labor',labText:'Das Starship Lab ist ein optionaler Modell- und Erlebnisraum.',models:'Szenen und Modelle',group:{software:'Software & Werkzeuge',worlds:'Visualisierung & Interaktion',research:'Forschung & Modelle',learning:'Lernen'}},
 en:{eyebrow:'JURI · SOFTWARE DEVELOPMENT',headline:'Build software. Check results.',lead:'I build local software, web applications and interactive 3D models. Open results directly or inspect the code.',projects:'View projects',contact:'Discuss a project',github:'GitHub code',first:'Open directly',more:'Three more selected works',selection:'Four selected works from the current portfolio.',method:'How I work',methodText:'Each work sample states its purpose, current scope and a checkable source or test path. Models and prototypes are identified as such.',cases:'Review work samples',all:'View current projects',directory:'Projects',directoryLead:'13 current projects: open the application or guide directly, with source code alongside.',meta:'Website and profile',metaLead:'Two additional public entries belong to the repository inventory but are not additional products.',source:'Source code',guide:'Code & guide',browser:'Available in browser',sourceOnly:'Guide and code',lab:'Interactive lab',labText:'The Starship Lab is an optional model and exploration space.',models:'Scenes and models',group:{software:'Software & tools',worlds:'Visuals & interaction',research:'Research & models',learning:'Learning'}},
 ru:{eyebrow:'ЮРИ · РАЗРАБОТКА ПРОГРАММ',headline:'Создавать программы. Проверять результат.',lead:'Я создаю локальные программы, веб-приложения и интерактивные 3D-модели. Откройте результат сразу или изучите код.',projects:'Смотреть проекты',contact:'Обсудить проект',github:'Код на GitHub',first:'Открыть сразу',more:'Ещё три избранные работы',selection:'Четыре избранные работы из актуального портфолио.',method:'Как я работаю',methodText:'У каждой работы указаны цель, текущий объём и проверяемый путь к коду или тесту. Модели и прототипы обозначены как таковые.',cases:'Проверить примеры работы',all:'Все актуальные проекты',directory:'Проекты',directoryLead:'13 актуальных проектов: открыть приложение или руководство, рядом — исходный код.',meta:'Сайт и профиль',metaLead:'Ещё два публичных входа входят в список репозиториев, но не являются отдельными продуктами.',source:'Исходный код',guide:'Код и руководство',browser:'Доступно в браузере',sourceOnly:'Руководство и код',lab:'Интерактивная лаборатория',labText:'Starship Lab — дополнительное пространство моделей и исследования.',models:'Сцены и модели',group:{software:'Программы и инструменты',worlds:'Визуализация и взаимодействие',research:'Исследования и модели',learning:'Обучение'}}
};
function safeUrl(value){
 if(typeof value!=='string')throw Error('Catalog URL required');
 const url=new URL(value);
 const caseLabAnchor=value==='https://juri-halveth.github.io/c-drohne-red-room/#falllabor';
 if(url.protocol!=='https:'||url.username||url.password||(url.hash&&!caseLabAnchor)||!['github.com','juri-halveth.github.io'].includes(url.hostname))throw Error('Unsafe catalog URL');
 if(url.hostname==='github.com'&&!url.pathname.startsWith('/Juri-Halveth/'))throw Error('Foreign catalog owner');
 if(url.hostname==='juri-halveth.github.io'&&url.pathname.includes('..'))throw Error('Unsafe catalog path');
 return value;
}
function validateSubspaces(project){
 const rows=project.site.subspaces;
 if(rows===undefined)return;
 const definitions={
  'halveth-scarlet':{
   paths:{'entity-space-1001':'https://juri-halveth.github.io/halveth-scarlet/entities/',
    'entity-wave':'https://juri-halveth.github.io/halveth-scarlet/entities/?view=chain#scarlet'},
   sourcePath:'assets/entity-world.mjs'
  },
  'halveth-forschungslabor':{
   paths:{'number-doors-1001':'https://juri-halveth.github.io/halveth-forschungslabor/branches/1001-doors/'},
   sourcePath:'branches/1001-doors/index.html'
  },
  'lucinet-seedspace':{
   paths:{'seedspace-capsules':'https://juri-halveth.github.io/lucinet-seedspace/'},
   sourcePath:'index.html'
  }
 };
 const definition=definitions[project.id];
 if(!definition||!Array.isArray(rows)||rows.map(row=>row.id).join(',')!==Object.keys(definition.paths).join(','))throw Error('Unexpected project subspaces');
 for(const row of rows){
  if(row.url!==definition.paths[row.id])throw Error('Unreviewed subspace destination');
  if(!/^[0-9a-f]{40}$/.test(row.source_revision)||row.source_url!==`https://github.com/${project.repository}/blob/${row.source_revision}/${definition.sourcePath}`)throw Error('Subspace source binding mismatch');
  if(typeof row.observed_at!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(row.observed_at)||new Date(row.observed_at+'T00:00:00Z').toISOString().slice(0,10)!==row.observed_at)throw Error('Invalid subspace observation date');
  if(project.id==='halveth-scarlet'){
   if(row.availability!==undefined||row.published_at!==undefined)throw Error('SCARLET subspace publication state changed');
  }else{
   if(!['PENDING_PUBLICATION','PUBLISHED'].includes(row.availability))throw Error('Subspace publication state required');
   if(row.availability==='PENDING_PUBLICATION'&&row.published_at!==undefined)throw Error('Pending subspace cannot claim publication');
   if(row.availability==='PUBLISHED'&&(typeof row.published_at!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(row.published_at)||new Date(row.published_at+'T00:00:00Z').toISOString().slice(0,10)!==row.published_at))throw Error('Published subspace needs observation date');
  }
  for(const field of ['label','description'])for(const lang of languages)if(typeof row[field]?.[lang]!=='string'||!row[field][lang].trim()||row[field][lang].length>140)throw Error('Localized subspace text required');
 }
}
function publishedSubspaces(project){
 return (project.site.subspaces||[]).filter(row=>row.availability===undefined||row.availability==='PUBLISHED');
}
function validateSiteCatalog(catalog){
 if(catalog?.schema!=='halveth.portal.catalog.v1'||!Array.isArray(catalog.projects)||catalog.projects.length!==18)throw Error('Public catalog must bind current 18-entry snapshot');
 if(typeof catalog.source_date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(catalog.source_date)||new Date(catalog.source_date+'T00:00:00Z').toISOString().slice(0,10)!==catalog.source_date)throw Error('Invalid catalog source date');
 if(typeof catalog.inventory_observed_at!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(catalog.inventory_observed_at)||new Date(catalog.inventory_observed_at+'T00:00:00Z').toISOString().slice(0,10)!==catalog.inventory_observed_at)throw Error('Invalid inventory observation date');
 const inventory=catalog.inventory_counts;
 if(!inventory||!Number.isSafeInteger(inventory.owner_repositories)||!Number.isSafeInteger(inventory.public_repositories)||!Number.isSafeInteger(inventory.private_repositories)||!Number.isSafeInteger(inventory.public_pages)
  ||inventory.public_repositories!==catalog.projects.length||inventory.private_repositories<0||inventory.public_pages<0||inventory.public_pages>inventory.public_repositories
  ||inventory.owner_repositories!==inventory.public_repositories+inventory.private_repositories)throw Error('Inventory count mismatch');
 if(!Array.isArray(catalog.home_featured_ids)||catalog.home_featured_ids.length!==4||new Set(catalog.home_featured_ids).size!==4)throw Error('Four unique selected entries required');
 const ids=new Set(),repositories=new Set();let projectCount=0,metaCount=0;
 for(const p of catalog.projects){
  if(typeof p.id!=='string'||!/^[A-Za-z0-9.-]+$/.test(p.id)||ids.has(p.id))throw Error('Unique public catalog ID required');
  ids.add(p.id);
  if(p.visibility!=='public'||p.repository!==`Juri-Halveth/${p.id}`||repositories.has(p.repository))throw Error('Public repository identity mismatch');
  repositories.add(p.repository);
  safeUrl(p.url);safeUrl(p.source_url);
  const entryUrl=new URL(p.url),sourceUrl=new URL(p.source_url);
  if(sourceUrl.hostname!=='github.com'||!sourceUrl.pathname.startsWith(`/Juri-Halveth/${p.id}/`))throw Error('Source URL identity mismatch');
  if(entryUrl.hostname==='github.com'&&entryUrl.pathname!==`/Juri-Halveth/${p.id}`&&entryUrl.pathname!==`/Juri-Halveth/${p.id}/releases/tag/${p.site?.release_tag}`&&entryUrl.pathname!==`/Juri-Halveth/${p.id}/pull/${p.site?.pr_number}`)throw Error('Entry URL identity mismatch');
  if(entryUrl.hostname==='juri-halveth.github.io'&&p.id!=='Juri-Halveth.github.io'&&!entryUrl.pathname.startsWith(`/${p.id}/`))throw Error('Pages entry identity mismatch');
  if(!p.site||!groups.includes(p.site.primary_category)||!['PROJECT','META'].includes(p.site.entry_type)||!['BROWSER_ENTRY','SOURCE_AND_GUIDE','RELEASE_ENTRY','PR_ENTRY'].includes(p.site.status))throw Error('Invalid site entry');
  if((p.site.status==='BROWSER_ENTRY')!==(entryUrl.hostname==='juri-halveth.github.io'))throw Error('Entry status and destination mismatch');
  if(p.site.status==='RELEASE_ENTRY'){
   if(!/^v\d+\.\d+\.\d+$/.test(p.site.release_tag)||entryUrl.pathname!==`/Juri-Halveth/${p.id}/releases/tag/${p.site.release_tag}`)throw Error('Release entry mismatch');
  }else if(p.site.release_tag!==undefined&&p.site.release_tag!==null)throw Error('Release tag without release entry');
  if(p.site.status==='PR_ENTRY'){
   if(!Number.isSafeInteger(p.site.pr_number)||p.site.pr_number<1||entryUrl.pathname!==`/Juri-Halveth/${p.id}/pull/${p.site.pr_number}`)throw Error('PR entry mismatch');
  }else if(p.site.pr_number!==undefined&&p.site.pr_number!==null)throw Error('PR number without PR entry');
  if((p.site.editorial_state==='WITHDRAWN_FROM_PORTFOLIO')!==withdrawnFromPortfolio.has(p.id))throw Error('Portfolio editorial state mismatch');
  validateSubspaces(p);
  if(p.site.entry_type==='PROJECT')projectCount++;else metaCount++;
  for(const field of ['title','summary','action'])for(const lang of languages)if(typeof p.site[field]?.[lang]!=='string'||!p.site[field][lang].trim())throw Error('Localized '+field+' required');
  if(p.site.revision!==null&&!/^[0-9a-f]{40}$/.test(p.site.revision))throw Error('Invalid optional pinned revision');
  if(p.site.revision===null&&p.site.revision_observed_at!==null)throw Error('Unpinned source cannot claim a revision date');
  if(p.site.revision!==null&&(typeof p.site.revision_observed_at!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(p.site.revision_observed_at)||new Date(p.site.revision_observed_at+'T00:00:00Z').toISOString().slice(0,10)!==p.site.revision_observed_at))throw Error('Pinned revision needs a valid observation date');
  if(p.site.revision!==null&&p.source_url!==`https://github.com/${p.repository}/tree/${p.site.revision}`)throw Error('Pinned source URL and revision mismatch');
 }
 if(projectCount!==16||metaCount!==2||!catalog.projects.find(p=>p.id==='Juri-Halveth'&&p.site.entry_type==='META')||!catalog.projects.find(p=>p.id==='Juri-Halveth.github.io'&&p.site.entry_type==='META'))throw Error('Project and meta entry split required');
 for(const id of catalog.home_featured_ids)if(!catalog.projects.some(p=>p.id===id&&p.site.entry_type==='PROJECT'))throw Error('Featured project missing');
 return catalog;
}
function validateCatalogMembership(catalog,selected,snapshot){
 validateSiteCatalog(catalog);
 if(!Array.isArray(selected?.projects)||!Array.isArray(snapshot?.repositories))throw Error('Dated source snapshots required');
 const entries=new Map(catalog.projects.map(p=>[p.id,p]));
 for(const p of selected.projects)if(entries.get(p.id)?.site.entry_type!=='PROJECT')throw Error('Selected project identity missing from public site catalog');
 for(const p of snapshot.repositories)if(!entries.has(p.name))throw Error('Repository snapshot identity missing from public site catalog');
 // Dates and revisions are independent: a HEAD refresh must not rewrite pinned site snapshots.
 return true;
}
function sourceAction(project,lang){
 const labels=sourceLabels[lang];if(!labels)throw Error('Unknown source language');
 return project.site.revision?`${labels.snapshot} ${project.site.revision_observed_at} · ${project.site.revision.slice(0,7)}`:labels.branch;
}
function entryStatus(project,lang){
 const s=project.site.status,t=copy[lang];
 return s==='BROWSER_ENTRY'?t.browser:s==='RELEASE_ENTRY'?`${releaseLabels[lang]} ${project.site.release_tag}`:s==='PR_ENTRY'?`${prLabels[lang]} #${project.site.pr_number}`:t.sourceOnly;
}
function entryHref(project,lang){
 if(project.id!=='halveth-scarlet'||lang==='de')return project.url;
 const url=new URL(project.url);url.searchParams.set('lang',lang);return url.href;
}
function subspaceHref(project,subspace,lang){
 if(lang==='de'||project.id!=='halveth-scarlet')return subspace.url;
 const url=new URL(subspace.url);url.searchParams.set('lang',lang);return url.href;
}
function renderSubspaces(project,lang){
 const rows=publishedSubspaces(project);
 if(!rows.length)return '';
 const title={de:'Weitere Räume dieses Projekts',en:'More spaces in this project',ru:'Другие пространства проекта'}[lang];
 return `<nav class="directory-subspaces" aria-label="${escape(title)}"><span>${escape(title)}</span>${rows.map(row=>`<a href="${escape(subspaceHref(project,row,lang))}" title="${escape(row.description[lang])}">${escape(row.label[lang])} ↗</a>`).join('')}</nav>`;
}
function featureCard(project,lang,hero=false){
 const t=copy[lang];const s=project.site;
 return `<article class="service-card${hero?' service-card-first':''}" data-featured-project="${escape(project.id)}"><p class="work-kind">${escape(entryStatus(project,lang))}</p><h${hero?2:3}>${escape(s.title[lang])}</h${hero?2:3}><p>${escape(s.summary[lang])}</p><div class="service-card-actions"><a class="button" href="${escape(entryHref(project,lang))}">${escape(s.action[lang])} ↗</a><a class="text-link" href="${escape(project.source_url)}">${escape(sourceAction(project,lang))} ↗</a></div><p class="source-caption">${escape(project.title)} · ${escape(project.repository)}</p></article>`;
}
function renderHome(catalog,lang){
 validateSiteCatalog(catalog);const t=copy[lang];if(!t)throw Error('Unknown site language');
 const prefix=lang==='de'?'/':`/${lang}/`;
 const featured=catalog.home_featured_ids.map(id=>catalog.projects.find(p=>p.id===id));
 return `<section class="service-hero shell" aria-labelledby="service-title"><div class="service-hero-copy"><p class="eyebrow">${t.eyebrow}</p><h1 id="service-title">${t.headline}</h1><p class="service-lead">${t.lead}</p><div class="service-actions"><a class="button" href="${prefix}arbeiten/">${t.projects} ↗</a><a class="text-link" href="#contact">${t.contact} ↓</a><a class="quiet-link" href="https://github.com/Juri-Halveth">${t.github} ↗</a>${guideLink(lang)}</div></div>${featureCard(featured[0],lang,true)}</section><section class="shell service-featured" id="featured"><h2>${t.more}</h2><div class="service-featured-grid">${featured.slice(1).map(p=>featureCard(p,lang)).join('')}</div><a class="text-link" href="${prefix}arbeiten/">${t.all} ↗</a></section><section class="service-method"><div class="shell"><p class="eyebrow">${t.method}</p><h2>${t.method}</h2><p>${t.methodText}</p><a class="text-link" href="${prefix}belege/">${t.cases} ↗</a></div></section>`;
}
function directoryCard(project,lang){
 const t=copy[lang],s=project.site;
 return `<article class="directory-project" data-project="${escape(project.id)}" data-category="${escape(s.primary_category)}"><p class="work-kind">${escape(entryStatus(project,lang))}</p><h3>${escape(s.title[lang])}</h3><p>${escape(s.summary[lang])}</p>${renderSubspaces(project,lang)}${project.id==='halveth-scarlet'?renderVisitorCorridor(lang):''}<div class="directory-actions"><a class="button" href="${escape(entryHref(project,lang))}">${escape(s.action[lang])} ↗</a><a class="text-link" href="${escape(project.source_url)}">${escape(sourceAction(project,lang))} ↗</a></div><p class="source-caption">${escape(project.title)} · ${escape(project.repository)}</p></article>`;
}
function renderDirectory(catalog,lang){
 validateSiteCatalog(catalog);const t=copy[lang];if(!t)throw Error('Unknown site language');
 const sections=groups.map(group=>{const rows=catalog.projects.filter(p=>p.site.entry_type==='PROJECT'&&p.site.primary_category===group&&!withdrawnFromPortfolio.has(p.id));return `<section class="directory-group shell section" id="group-${group}" data-project-group><h2>${t.group[group]}</h2><div class="directory-grid">${rows.map(p=>directoryCard(p,lang)).join('')}</div></section>`;}).join('');
 const meta=catalog.projects.filter(p=>p.site.entry_type==='META');
 return `<section class="shell section directory-intro" id="repositories"><p class="eyebrow">HALVETH</p><h1>${t.directory}</h1><p class="lead">${t.directoryLead}</p></section>${renderProjectControls(lang,13,groups,true)}${sections}<section class="shell directory-meta"><h2>${t.meta}</h2><p>${t.metaLead}</p><ul>${meta.map(p=>`<li><a href="${escape(p.url)}">${escape(p.site.title[lang])} ↗</a></li>`).join('')}</ul></section><section class="shell directory-lab"><h2>${t.lab}</h2><p>${t.labText}</p><a class="text-link" href="/universum/">Starship Lab ↗</a><a class="text-link" href="${lang==='de'?'/':`/${lang}/`}modelle/">${t.models} ↗</a></section>`;
}
function renderProfile(lang){
 const t=copy[lang];if(!t)throw Error('Unknown site language');const prefix=lang==='de'?'/':`/${lang}/`;
 const title={de:'Juri · Softwareentwickler',en:'Juri · software developer',ru:'Юри · разработчик программ'}[lang];
 const text={de:'Ich entwickle lokale Software, Webanwendungen und interaktive Modelle. HALVETH bündelt diese Arbeiten mit Quellcode, Startwegen und nachvollziehbaren Prüfbelegen.',en:'I build local software, web applications and interactive models. HALVETH brings this work together with source code, setup paths and checkable evidence.',ru:'Я создаю локальные программы, веб-приложения и интерактивные модели. HALVETH объединяет работы с кодом, запуском и проверяемыми материалами.'}[lang];
 return `<section class="shell section profile-summary"><p class="eyebrow">HALVETH</p><h1>${title}</h1><p class="lead">${text}</p><div class="service-actions"><a class="button" href="${prefix}arbeiten/">${t.projects} ↗</a><a class="text-link" href="${prefix}belege/">${t.cases} ↗</a></div></section>`;
}
function renderLearning(catalog,lang){
 validateSiteCatalog(catalog);const t=copy[lang];if(!t)throw Error('Unknown site language');
 const prefix=lang==='de'?'/':`/${lang}/`;
 const lead={de:'Zwei aktuelle Lernprojekte: Übungen direkt öffnen und den Quellcode prüfen.',en:'Two current learning projects: open the exercises directly and inspect their source code.',ru:'Два актуальных учебных проекта: открыть упражнения и проверить исходный код.'}[lang];
 const rows=catalog.projects.filter(p=>p.site.entry_type==='PROJECT'&&p.site.primary_category==='learning'&&p.site.editorial_state==='CURRENT');
 if(rows.length!==2)throw Error('Learning selection changed');
 return `<section class="shell section directory-intro"><p class="eyebrow">HALVETH</p><h1>${t.group.learning}</h1><p class="lead">${lead}</p></section><section class="shell section directory-group"><div class="directory-grid">${rows.map(p=>directoryCard(p,lang)).join('')}</div><a class="text-link" href="${prefix}arbeiten/">${t.all} ↗</a></section>`;
}
module.exports={validateSiteCatalog,validateCatalogMembership,publishedSubspaces,renderHome,renderDirectory,renderProfile,renderLearning,copy};
