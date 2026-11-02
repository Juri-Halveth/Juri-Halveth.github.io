// Source-available under LICENSES.md. Deterministic static portfolio builder.
'use strict';
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {validateProjects,validateRepositorySnapshot}=require('./validate-projects.cjs');
const root=path.resolve(__dirname,'..'),data=validateProjects(JSON.parse(fs.readFileSync(path.join(root,'data/projects.json'),'utf8')));
const {validateMap,renderTechnicalMap,renderMapTeaser,mapCopy}=require('./render-technical-map.cjs');
const {renderSceneShowcase,validateSceneCatalog,words:sceneWords}=require('./render-showcase.cjs');
const {validateSiteCatalog,renderHome,renderDirectory,renderProfile,renderLearning,copy:siteWords}=require('./site-catalog.cjs');
const {renderLegacyDestination,legacyTitle}=require('./render-legacy-destinations.cjs');
const sceneCatalog=validateSceneCatalog(JSON.parse(fs.readFileSync(path.join(root,'data/scene-stage.json'),'utf8')),root);
const publicRepositories=validateRepositorySnapshot(JSON.parse(fs.readFileSync(path.join(root,'data/public-repositories.json'),'utf8')));
const siteCatalog=validateSiteCatalog(JSON.parse(fs.readFileSync(path.join(root,'data/site-catalog.json'),'utf8')));
const {renderMotion}=require('./render-motion-page.cjs');
const {renderWorkSamples,evidenceWords}=require('./render-work-samples.cjs');
const {validateResearchIndex,renderResearchOS}=require('./render-research-os.cjs');
const workSamples=JSON.parse(fs.readFileSync(path.join(root,'data/work-samples.json'),'utf8'));
const researchIndex=validateResearchIndex(JSON.parse(fs.readFileSync(path.join(root,'data/research-index.json'),'utf8')));
// A cache address for equivalent LF-normalized CSS, not a raw-file provenance hash.
const showcaseVersion=createHash('sha256').update(fs.readFileSync(path.join(root,'showcase.css'),'utf8').replace(/\r\n/g,'\n')).digest('hex');
// HTML parsing normalizes line endings before the browser checks an inline-style hash.
const researchCss=['portal.css','portfolio.css','showcase.css','research-os.css'].map(name=>fs.readFileSync(path.join(root,name),'utf8').replace(/\r\n?/g,'\n')).join('\n');
if(researchCss.includes('</style'))throw new Error('Inline CSS contains an HTML closing tag');
const researchCssHash=createHash('sha256').update(researchCss).digest('base64');
const mapBytes=fs.readFileSync(path.join(root,'data/technical-map.json'));
const technicalMap=JSON.parse(mapBytes.toString('utf8'));
const {validatePortfolioSelection}=require('./validate-portfolio-selection.cjs');
validatePortfolioSelection([data,sceneCatalog,publicRepositories,workSamples,technicalMap,researchIndex]);
for(const p of data.projects){const row=siteCatalog.projects.find(row=>row.id===p.id);if(!row||row.site.revision!==p.revision||row.site.revision_observed_at!==data.sourceDate)throw Error('Selected project revision/date missing from public site catalog');}
for(const p of publicRepositories.repositories)if(!siteCatalog.projects.some(row=>row.id===p.name))throw Error('Repository snapshot identity missing from public site catalog');
const mapSource=JSON.parse(fs.readFileSync(path.join(root,'data/technical-map-source.json'),'utf8'));
validateMap(technicalMap,mapSource,mapBytes);
const escape=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const copy={
 de:{researchNav:'Projekte & Quellen',nav:'Projekte',proof:'Arbeitsproben',contact:'Zusammenarbeit',intro:'Ich baue lokale Software, nachvollziehbare Forschungswerkzeuge und interaktive Lernangebote.',lead:'Hier findest du ausgewählte Anwendungen, Prototypen und technische Modelle — mit Einstieg, Quellcode und erkennbarem Entwicklungsstand.',hero:'Systeme verstehen.<br><em>Welten erschaffen.</em>',eyebrow:'HALVETH · SOFTWARE / INTERAKTION / FORSCHUNG',go:'Arbeit erleben',code:'Quellcode',source:'Quellcode dieser Version',demo:'Anwendung öffnen',groups:{learning:'Lernen, das zugänglich bleibt.',software:'Werkzeuge mit einem klaren Zweck.',games:'Grafik und räumliche Anwendungen.',research:'Modelle zum Prüfen und Weiterbauen.'},label:'AUSGEWÄHLTE TECHNISCHE ARBEITEN',work:'Eine Arbeitsprobe muss etwas zeigen.',workText:'Eine Oberfläche, eine konkrete Funktion oder ein nachvollziehbarer Test ist der Einstieg. Die Projektseiten nennen ihren jeweiligen Umfang. Entwicklung mit KI-Unterstützung gehört zum Arbeitsprozess.',labTitle:'10 Module. Ein lokaler Prüfweg.',labText:'Das Forschungslabor bündelt JavaScript- und Python-Module mit ihren Tests. Bildvergleich, Quellenpakete, Lichtbrechung und explizite Zustandsmodelle sind einzeln zugänglich.',method:'Die Prüfungen beziehen sich auf die implementierten Modelle und mitgelieferten Gegenbeispiele. Ein lokaler Test ersetzt keine externe Produktprüfung.',offer:'Lass uns etwas Brauchbares bauen.',offerText:'Für Softwareentwicklung, technische Prototypen, verständliche Oberflächen oder Lernangebote: Beschreibe Aufgabe, Zielgruppe und gewünschten Umfang.',footer:'Projektleitung: Juri / HALVETH · Entwicklung mit KI-Unterstützung',scope:'Jede Arbeitsprobe führt zum jeweiligen Quellcode und nennt ihren Entwicklungsstand.',profile:'Arbeitsprofil',motion:'Bewegungsstudie',back:'Zur Übersicht',rights:'Lizenzen & Herkunft'},
 en:{researchNav:'Projects & sources',nav:'Projects',proof:'Work samples',contact:'Collaborate',intro:'I build local software, traceable research tools and interactive learning applications.',lead:'Explore selected applications, prototypes and technical models — with entry points, source code and a clear development state.',hero:'Understand systems.<br><em>Build worlds.</em>',eyebrow:'HALVETH · SOFTWARE / INTERACTION / RESEARCH',go:'Experience the work',code:'Source code',source:'Source for this version',demo:'Open application',groups:{learning:'Learning that stays accessible.',software:'Tools with a clear purpose.',games:'Graphics and spatial applications.',research:'Models to test and build on.'},label:'SELECTED TECHNICAL WORK',work:'A work sample should show something.',workText:'Start with an interface, a concrete function or a reproducible test. Each project identifies its scope. AI-assisted development is part of the process.',labTitle:'10 modules. One local test path.',labText:'The research lab brings together JavaScript and Python modules with their tests. Image comparison, source packets, refraction and explicit state models can be inspected separately.',method:'Checks cover implemented models and supplied counterexamples. A local test is not an external product assessment.',offer:'Let’s build something useful.',offerText:'For software development, technical prototypes, understandable interfaces or learning tools: describe the task, audience and desired scope.',footer:'Project lead: Juri / HALVETH · AI-assisted development',scope:'Each work sample links to its source code and identifies its development state.',profile:'Professional profile',motion:'Motion study',back:'Overview',rights:'Licences & provenance'},
 ru:{researchNav:'Проекты и источники',nav:'Проекты',proof:'Примеры работы',contact:'Сотрудничество',intro:'Я создаю локальные программы, проверяемые исследовательские инструменты и интерактивные учебные приложения.',lead:'Избранные приложения, прототипы и технические модели — с понятным входом, исходниками и состоянием разработки.',hero:'Понимать системы.<br><em>Создавать миры.</em>',eyebrow:'HALVETH · ПРОГРАММЫ / ИНТЕРАКТИВНОСТЬ / ИССЛЕДОВАНИЯ',go:'Попробовать работы',code:'Исходный код',source:'Исходники этой версии',demo:'Открыть приложение',groups:{learning:'Доступное обучение.',software:'Инструменты с понятной задачей.',games:'Графика и пространственные приложения.',research:'Модели для проверки и развития.'},label:'ИЗБРАННЫЕ ТЕХНИЧЕСКИЕ РАБОТЫ',work:'Пример работы должен что-то показывать.',workText:'Начните с интерфейса, конкретной функции или воспроизводимого теста. Каждый проект описывает свой охват. Разработка с помощью ИИ является частью процесса.',labTitle:'10 модулей. Локальная проверка.',labText:'Лаборатория объединяет модули JavaScript и Python с тестами: сравнение изображений, пакеты источников, преломление света и модели состояний.',method:'Проверки относятся к реализованным моделям и примерам. Локальный тест не заменяет внешнюю проверку продукта.',offer:'Создадим что-то полезное.',offerText:'Для разработки программ, прототипов, понятных интерфейсов или учебных инструментов: опишите задачу, аудиторию и желаемый объём.',footer:'Руководитель проекта: Юри / HALVETH · Разработка с помощью ИИ',scope:'Каждый пример работы ведёт к исходникам и описывает состояние разработки.',profile:'Профиль',motion:'Исследование движения',back:'Обзор',rights:'Лицензии и происхождение'}
};
function put(name,text){const p=path.join(root,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,text);}
put('universum/data/catalog.js','window.HALVETH_CATALOG =\n'+JSON.stringify(siteCatalog,null,2)+';\n');
const routes=['','profil/','arbeiten/','koennen/','belege/','forschung/','modelle/','audits/','lernen/','motion/','handbuch/','pulsar/','zertifikate/','werkzertifikate/'];
for(const lang of Object.keys(copy)){
 const t=copy[lang],prefix=lang==='de'?'/':`/${lang}/`;
 for(const route of routes){
  let content='';
  if(!route)content+=renderHome(siteCatalog,lang);
  if(route==='profil/')content+=renderProfile(lang);
  if(route==='arbeiten/')content+=renderDirectory(siteCatalog,lang);
  if(route==='modelle/')content+=`<section class="shell section work-intro"><p class="eyebrow">${t.proof}</p><h1>${t.labTitle}</h1><p class="lead">${t.method}</p></section>`+renderSceneShowcase(sceneCatalog,lang)+renderMapTeaser(technicalMap,lang);
  if(route==='koennen/')content+=renderTechnicalMap(technicalMap,lang,mapSource);
  if(route==='belege/')content+=renderWorkSamples(workSamples,lang);
  if(route==='forschung/')content+=renderResearchOS(researchIndex,lang);
  if(['audits/','handbuch/','pulsar/','zertifikate/','werkzertifikate/'].includes(route))content+=renderLegacyDestination(route,lang,data.projects.find(p=>p.id==='halveth-forschungslabor').revision);
  if(route==='lernen/')content+=renderLearning(siteCatalog,lang);
  if(route==='motion/')content+=renderMotion(lang);
  content+=`<section class="scene-offer" id="contact"><div class="shell"><p class="eyebrow">${t.contact}</p><h2>${sceneWords[lang].offer}</h2><p>${sceneWords[lang].offerIntro}</p><a class="text-link" href="mailto:juri@halveth.de">${sceneWords[lang].contact} ↗</a><p class="source-caption">juri@halveth.de · ${t.footer} · <a href="mailto:security@halveth.de">Security</a></p></div></section>`;
  const langs=Object.keys(copy).map(l=>`<a href="${l==='de'?'/':`/${l}/`}${route}" lang="${l}" ${l===lang?'aria-current="page"':''}>${l.toUpperCase()}</a>`).join(' · ');
  const pageTitle=legacyTitle(route,lang)||(route==='belege/'?evidenceWords[lang].nav:route==='koennen/'?mapCopy[lang].nav:route==='forschung/'?t.researchNav:route==='profil/'?t.profile:route==='modelle/'?siteWords[lang].models:route==='lernen/'?siteWords[lang].group.learning:route==='motion/'?t.motion:route==='arbeiten/'?siteWords[lang].directory:siteWords[lang].headline);
  const html=`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escape(t.intro)}"><meta name="theme-color" content="#f2f1e9"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; script-src 'self'; img-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'"><title>Juri · ${escape(pageTitle)}</title><link rel="canonical" href="https://juri-halveth.github.io${prefix}${route}"><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/portal.css"><link rel="stylesheet" href="/portfolio.css"><link rel="stylesheet" href="/showcase.css">${route==='forschung/'?'<link rel="stylesheet" href="/research-os.css">':''}${route==='motion/'?'<link rel="stylesheet" href="/motion.css">':''}${route==='arbeiten/'?'<script type="module" src="/project-finder.mjs"></script><link rel="stylesheet" href="/project-finder.css">':''}${route==='motion/'?'<script src="/motion-core.js" defer></script><script src="/motion-player.js" defer></script>':''}${route==='modelle/'?'<script type="module" src="/scene-stage.mjs"></script>':''}</head><body><a class="skip-link" href="#main">${t.nav}</a><header class="site-header shell"><a class="brand" href="${prefix}"><span class="brand-mark" aria-hidden="true">H</span><span>JURI</span></a><nav class="primary-nav" aria-label="${lang==='de'?'Hauptnavigation':lang==='en'?'Main navigation':'Главная навигация'}"><a href="${prefix}arbeiten/">${t.nav}</a><a href="${prefix}belege/">${evidenceWords[lang].nav}</a><a href="${prefix}profil/">${t.profile}</a><a href="#contact">${t.contact}</a></nav><span class="language-switch" aria-label="Languages">${langs}</span></header><main id="main">${content}</main><footer class="site-footer shell"><div><strong>HALVETH</strong><p>${t.footer}</p><p><time data-project-source-date datetime="${escape(siteCatalog.source_date)}">${escape(siteCatalog.source_date)}</time> · ${lang==='de'?'Projektübersicht':lang==='en'?'Project overview':'Обзор проектов'}</p></div><nav><a href="/universum/">Starship Lab ↗</a><a href="https://github.com/Juri-Halveth">GitHub ↗</a><a href="/LICENSES.md">${t.rights}</a><a href="${prefix}">${t.back} ↑</a></nav></footer></body></html>\n`;
  // Keep all local resources relative to the generated route.
  const relativeRoot='../'.repeat((lang==='de'?0:1)+(route?1:0))||'./';
  let portableHtml=html.replace(/\b(href|src)="\/([^"]*)"/g,(_,attribute,target)=>`${attribute}="${relativeRoot}${target}"`);
  if(route==='forschung/'){
   const links=['portal.css','portfolio.css','showcase.css','research-os.css'].map(name=>`<link rel="stylesheet" href="${relativeRoot}${name}">`).join('');
   if(!portableHtml.includes(links))throw new Error('Research stylesheet links missing');
   portableHtml=portableHtml.replace(links,`<style>${researchCss}</style>`)
    .replace("style-src 'self';",`style-src 'self' 'sha256-${researchCssHash}';`)
    .replace(`<script src="${relativeRoot}motion-core.js" defer></script><script src="${relativeRoot}landing-motion.js" defer></script>`,'');
  }
  if(route!=='forschung/'){
   const stylesheet=`href="${relativeRoot}showcase.css"`;
   if(!portableHtml.includes(stylesheet))throw new Error('Scene stylesheet link missing');
   portableHtml=portableHtml.replace(stylesheet,`href="${relativeRoot}showcase.css?v=${showcaseVersion}"`);
  }
  put((lang==='de'?'':lang+'/')+route+'index.html',portableHtml);
 }
}
put('404.html',`<!doctype html><html lang="de"><meta charset="utf-8"><title>HALVETH · Übersicht</title><h1>Diese Adresse wurde neu geordnet.</h1><p><a href="/">Projekte & Arbeitsproben öffnen</a></p></html>\n`);
put('robots.txt',fs.readFileSync(path.join(root,'data/robots.txt'),'utf8'));
put('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+Object.keys(copy).flatMap(l=>routes.filter(r=>!['pulsar/','zertifikate/','werkzertifikate/'].includes(r)).map(r=>'<url><loc>https://juri-halveth.github.io/'+(l==='de'?'':l+'/')+r+'</loc></url>')).join('')+'<url><loc>https://juri-halveth.github.io/universum/</loc></url></urlset>\n');
put('profil/CV-Juri-Halveth.md','# Juri\n\nSoftwareentwicklung · interaktive Grafik · Lernangebote\n\nEntwicklung mit KI-Unterstützung.\n\n[Projekte und Arbeitsproben](https://juri-halveth.github.io/profil/)\n\nKontakt: juri@halveth.de\n');
console.log(`Built ${routes.length*3+1} public pages with 13 curated projects from 18 public source entries.`);
