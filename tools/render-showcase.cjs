'use strict';
// Original portfolio presentation. Per-path terms are in LICENSES.md.
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const model = require('../assets/endeck-model.mjs');
const {publicUrl}=require('./validate-projects.cjs');
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LANGUAGES = ['de','en','ru'];
const nativeMotionUrl='https://github.com/Juri-Halveth/halveth-unreal/blob/d90cfd9ec5b895ff4a7e82c27983e25efa5c3350/Preview/MEADOW_WIND.gif';
const nativeMotionLabel={de:'Neue Wiese in Bewegung · GIF, 4 MB',en:'New meadow in motion · GIF, 4 MB',ru:'Новый луг в движении · GIF, 4 МБ'};
const words = {
  "de": {
    "eyebrow": "JURI / GESTALTUNG & SOFTWARE",
    "title": "Zustände. Zeit.<br><em>Möglichkeiten entfalten.</em>",
    "intro": "Zustände verändern, Abläufe beobachten und Varianten vergleichen. Ich baue die Werkzeuge dazu: zum Ausprobieren, Lernen und Weiterentwickeln.",
    "try": "Funktionsraum öffnen",
    "code": "Zum Code",
    "native": "ANWENDUNG · C++ / UNREAL",
    "web": "FUNKTIONEN · IM BROWSER",
    "model": "BEOBACHTUNG · GEOMETRIE",
    "lab": "EIN WERKZEUG DIREKT BENUTZEN",
    "labTitle": "Ein Bild. Vier Raumorte.",
    "labIntro": "Ein Regler, dieselben vier Punkte, zwei Ansichten. Vergleiche, was im Bild zusammenfällt und im Raum unterscheidbar bleibt.",
    "time": "Modellzeit",
    "play": "Verlauf abspielen",
    "pause": "Anhalten",
    "end": "Ende zeigen",
    "flat": "Das Bild · x / y",
    "space": "Der Raum · gekippter Blick",
    "result": "Vier Identitäten bleiben erhalten. Verändere die Modellzeit und vergleiche beide Ansichten.",
    "detail": "Das ganze Experiment öffnen",
    "source": "Berechnung im Quellcode",
    "purpose": "FUNKTION, MODELL, ANWENDUNG",
    "purposeTitle": "Was läuft hier?<br><em>Und wofür ist es nützlich?</em>",
    "proof": "Arbeitsproben mit Eingabe, Gegenprobe und Quellrevision",
    "scope": "Für Kamera-Debugging, technische Erklärungen und den Vergleich von Modellansichten.",
    "all": "Alle öffentlichen Repositories",
    "allIntro": "Auch kleinere Werkzeuge und Forschungszweige bleiben erreichbar. Der Stand nennt den Zweck und führt zum jeweiligen Quellbestand.",
    "offer": "Gemeinsam etwas Brauchbares bauen.",
    "offerIntro": "Ein begehbarer Prototyp, eine interaktive Erklärung oder ein klar begrenzter technischer Review: Wir vereinbaren Aufgabe, Umfang und Abnahme.",
    "contact": "Projekt besprechen",
    "observe": "Modell hier bewegen",
    "mechanismTitle": "Was berechnet der Code?",
    "mechanism": "JavaScript berechnet bei jeder Modellzeit vier Punktpositionen. Links werden ihre x/y-Koordinaten gezeigt, rechts dieselben IDs mit gekippter Tiefenansicht. Die Berechnung läuft lokal in deinem Browser; die Bewegung folgt einem festgelegten geometrischen Modell."
  },
  "en": {
    "eyebrow": "JURI / DESIGN & SOFTWARE",
    "title": "States. Time.<br><em>Explore possibilities.</em>",
    "intro": "Change states, observe sequences and compare variants. I build the tools to try, learn and develop those ideas further.",
    "try": "Open the function space",
    "code": "View code",
    "native": "APPLICATION · C++ / UNREAL",
    "web": "FUNCTIONS · IN YOUR BROWSER",
    "model": "OBSERVATION · GEOMETRY",
    "lab": "USE A TOOL RIGHT HERE",
    "labTitle": "One image. Four spatial positions.",
    "labIntro": "One control, the same four points, two views. Compare what overlaps in the image and stays distinct in space.",
    "time": "Model time",
    "play": "Play the sequence",
    "pause": "Pause",
    "end": "Show the end",
    "flat": "The image · x / y",
    "space": "The space · tilted view",
    "result": "Four identities remain. Change model time and compare both views.",
    "detail": "Open the full experiment",
    "source": "Calculation in the source code",
    "purpose": "FUNCTION, MODEL, APPLICATION",
    "purposeTitle": "What runs here?<br><em>And what can it help you do?</em>",
    "proof": "Work samples with input, counterexample and source revision",
    "scope": "For camera debugging, technical explanations and comparing model views.",
    "all": "Every public repository",
    "allIntro": "Smaller tools and research branches remain accessible. Each entry explains its purpose and links to the source.",
    "offer": "Build something useful together.",
    "offerIntro": "An explorable prototype, an interactive explanation or a bounded technical review: agree the task, scope and acceptance checks.",
    "contact": "Discuss a project",
    "observe": "Move the model here",
    "mechanismTitle": "What does the code calculate?",
    "mechanism": "At each model time, JavaScript calculates four point positions. The left view shows their x/y coordinates; the right shows the same IDs with a tilted depth view. The calculation runs locally in your browser; movement follows a defined geometric model."
  },
  "ru": {
    "eyebrow": "JURI / ДИЗАЙН И ПРОГРАММЫ",
    "title": "Состояния. Время.<br><em>Открывайте возможности.</em>",
    "intro": "Меняйте состояния, наблюдайте последовательности и сравнивайте варианты. Я создаю инструменты, чтобы пробовать, учиться и развивать идеи.",
    "try": "Открыть пространство функций",
    "code": "Код",
    "native": "ПРИЛОЖЕНИЕ · C++ / UNREAL",
    "web": "ФУНКЦИИ · В БРАУЗЕРЕ",
    "model": "НАБЛЮДЕНИЕ · ГЕОМЕТРИЯ",
    "lab": "ВОСПОЛЬЗУЙТЕСЬ ИНСТРУМЕНТОМ ЗДЕСЬ",
    "labTitle": "Одно изображение. Четыре положения.",
    "labIntro": "Один регулятор, те же четыре точки, два вида. Сравните, что совпадает на изображении и остаётся раздельным в пространстве.",
    "time": "Время модели",
    "play": "Показать движение",
    "pause": "Пауза",
    "end": "Показать конец",
    "flat": "Изображение · x / y",
    "space": "Пространство · наклонный вид",
    "result": "Четыре идентификатора сохраняются. Меняйте время модели и сравнивайте виды.",
    "detail": "Открыть весь эксперимент",
    "source": "Вычисление в исходном коде",
    "purpose": "ФУНКЦИЯ, МОДЕЛЬ, ПРИМЕНЕНИЕ",
    "purposeTitle": "Что здесь работает?<br><em>Для чего это полезно?</em>",
    "proof": "Примеры работы: вход, контрпример и версия исходников",
    "scope": "Для отладки камер, технических объяснений и сравнения видов модели.",
    "all": "Все публичные репозитории",
    "allIntro": "Небольшие инструменты и исследовательские ветви также доступны. У каждого есть описание цели и ссылка на код.",
    "offer": "Создадим что-то полезное вместе.",
    "offerIntro": "Исследуемый прототип, интерактивное объяснение или ограниченный технический обзор: согласуем задачу, объём и проверку результата.",
    "contact": "Обсудить проект",
    "observe": "Изменить модель здесь",
    "mechanismTitle": "Что вычисляет код?",
    "mechanism": "Для каждого момента времени JavaScript вычисляет положения четырёх точек. Слева показаны координаты x/y, справа — те же ID в наклонном виде с глубиной. Расчёт выполняется локально в браузере; движение задано геометрической моделью."
  }
};

function validateSceneCatalog(catalog,root) {
  if(catalog?.schema!=='halveth.scene-stage.v2'||catalog.person!=='Juri'||catalog.project!=='HALVETH'||catalog.scenes?.length!==3)throw Error('Invalid scene catalog');
  if(catalog.scenes.map(s=>s.id).join('|')!=='astralis|scarlet|endeck')throw Error('Exact scene identities required');
  if(!Array.isArray(catalog.presentationOrder)||catalog.presentationOrder.length!==3||new Set(catalog.presentationOrder).size!==3||catalog.presentationOrder.some(id=>!catalog.scenes.some(scene=>scene.id===id)))throw Error('Complete unique presentation order required');
  const projects={astralis:'halveth-unreal',scarlet:'halveth-scarlet',endeck:'halveth-forschungslabor'};
  const images={astralis:'/assets/scene-astralis.webp',scarlet:'/assets/scene-state-space.webp',endeck:'/assets/scene-endeck.webp'};
  for(const scene of catalog.scenes){
    if(scene.project!==projects[scene.id])throw Error('Scene project identity mismatch');
    publicUrl(scene.href);publicUrl(scene.source);
    if(!['PINNED_NATIVE_RUNTIME_CAPTURE','BROWSER_SCREENSHOT'].includes(scene.transfer)||!Number.isSafeInteger(scene.width)||!Number.isSafeInteger(scene.height)||scene.width<1||scene.width>8192||scene.height<1||scene.height>8192)throw Error('Invalid capture contract');
    if(scene.image!==images[scene.id]||!/^https:\/\/(github\.com\/Juri-Halveth\/|juri-halveth\.github\.io\/)/.test(scene.href))throw Error('Unsafe or mismatched scene route');
    if(!/^[a-f0-9]{64}$/.test(scene.sha256)||!Number.isSafeInteger(scene.bytes)||scene.bytes<1||scene.bytes>500000)throw Error('Bound scene bytes required');
    if(scene.transfer==='PINNED_NATIVE_RUNTIME_CAPTURE'&&(typeof scene.revision!=='string'||!/^[a-f0-9]{40}$/.test(scene.revision)||!scene.source.startsWith(`https://github.com/Juri-Halveth/${scene.project}/blob/${scene.revision}/`)||scene.href!==`https://github.com/Juri-Halveth/${scene.project}/tree/${scene.revision}`))throw Error('Pinned native source required');
    if(scene.transfer==='BROWSER_SCREENSHOT'&&(!scene.source.startsWith(`https://juri-halveth.github.io/${scene.project}/`)||scene.href!==scene.source))throw Error('Scene capture URL must bind its project');
    for(const field of ['title','alt','action','purpose','use','scope'])for(const language of LANGUAGES)if(typeof scene[field]?.[language]!=='string'||!scene[field][language].trim())throw Error('Every scene needs localized purpose and scope');
    if(root){const bytes=fs.readFileSync(path.join(root,scene.image.slice(1)));if(bytes.length!==scene.bytes||createHash('sha256').update(bytes).digest('hex')!==scene.sha256)throw Error('Scene byte mismatch');}
  }
  if(!catalog.model||catalog.model.path!=='assets/endeck-model.mjs'||catalog.model.repository!=='Juri-Halveth/halveth-forschungslabor'||catalog.model.sourcePath!=='branches/endeck-observer/model.mjs'||catalog.model.license!=='MIT'||typeof catalog.model.revision!=='string'||!/^[a-f0-9]{40}$/.test(catalog.model.revision)||!/^[a-f0-9]{64}$/.test(catalog.model.sha256))throw Error('Pinned ENDECK model required');
  if(root&&createHash('sha256').update(fs.readFileSync(path.join(root,catalog.model.path))).digest('hex')!==catalog.model.sha256)throw Error('Model byte mismatch');
  return catalog;
}
function presentationScenes(catalog){validateSceneCatalog(catalog);return catalog.presentationOrder.map(id=>catalog.scenes.find(scene=>scene.id===id));}
function sceneHref(scene,lang){language(lang);if(scene.id!=='scarlet'||lang==='de')return scene.href;const url=new URL(scene.href);url.searchParams.set('lang',lang);return url.href;}
function language(lang){if(!LANGUAGES.includes(lang))throw Error('Unknown scene language');return words[lang];}
function renderProjection(points){
  const positions=points.map(p=>({...p,px:100+50*p.x,py:100-50*p.y}));
  return `<path d="${positions.map((p,i)=>`${i?'L':'M'}${p.px} ${p.py}`).join(' ')}Z" class="demo-trace"/>`+positions.map(p=>`<circle cx="${p.px}" cy="${p.py}" r="7" class="demo-point-${p.id.toLowerCase()}" data-point-ids="${p.id}"/><text x="${p.px+14}" y="${p.py-14}" class="demo-label">${p.id}</text>`).join('');
}
function renderHero(catalog,lang){
  const t=language(lang);validateSceneCatalog(catalog);
  const prefix=lang==='de'?'/':`/${lang}/`;
  const captions={astralis:t.native,scarlet:t.web,endeck:t.model};
  const scenes=presentationScenes(catalog),lead=scenes[0];
  return `<section class="hero scene-hero shell"><div class="scene-heading"><div><p class="eyebrow">${t.eyebrow}</p><h1>${t.title}</h1></div><div class="scene-intro"><p>${t.intro}</p><div class="hero-actions"><a class="button" href="${esc(sceneHref(lead,lang))}">${t.try} ↗</a><a class="text-link" href="#scene-lab">${t.observe} ↓</a><a class="text-link" href="${prefix}koennen/">${t.code} ↗</a></div></div></div><div class="scene-wall">${scenes.map((s,i)=>`<a class="scene-tile scene-tile-${s.id}" href="${esc(sceneHref(s,lang))}" data-scene="${s.id}"><img src="${esc(s.image)}" alt="${esc(s.alt[lang])}" width="${s.width}" height="${s.height}" ${i===0?'fetchpriority="high"':'loading="lazy"'}><span class="scene-caption"><span class="scene-type">${captions[s.id]}</span><strong>${esc(s.title[lang])}</strong><span>${esc(s.action[lang])} ↗</span></span></a>`).join('')}</div><p class="scene-note">${esc(lead.scope[lang])}</p></section>`;
}
function renderSceneShowcase(catalog,lang){
  const t=language(lang);validateSceneCatalog(catalog);
  const prefix=lang==='de'?'/':`/${lang}/`;
  return `<section class="scene-demo-band" id="scene-lab"><div class="shell scene-demo-layout"><div class="scene-demo-copy"><p class="eyebrow">${t.lab}</p><h2>${t.labTitle}</h2><p>${t.labIntro}</p><a class="text-link" href="https://juri-halveth.github.io/halveth-forschungslabor/endeck/">${t.detail} ↗</a><p class="scene-note">${t.scope}</p><details class="scene-mechanism"><summary>${t.mechanismTitle}</summary><p>${t.mechanism}</p></details></div><div class="scene-demo" id="scene-demo" data-lang="${lang}" data-state="still"><div class="scene-demo-views"><figure><figcaption>${t.flat}</figcaption><svg id="scene-flat" viewBox="0 0 200 200" role="img" aria-label="${t.flat}"><title>${t.flat}</title>${renderProjection(model.observeXY(model.source('projection',0)))}</svg></figure><figure><figcaption>${t.space}</figcaption><svg id="scene-space" viewBox="0 0 200 200" role="img" aria-label="${t.space}"><title>${t.space}</title>${renderProjection(model.source('projection',0).map(p=>model.project(p,64)))}</svg></figure></div><label class="scene-time" for="scene-time"><span>${t.time}</span><output id="scene-time-value" for="scene-time">0,000</output></label><input id="scene-time" type="range" min="0" max="1000" step="1" value="0"><div class="scene-demo-actions"><button id="scene-play" type="button" aria-pressed="false" data-play="${t.play}" data-pause="${t.pause}">${t.play}</button><button id="scene-end" type="button">${t.end}</button></div><p id="scene-result" role="status">${t.result}</p><a class="scene-code" href="https://github.com/Juri-Halveth/halveth-forschungslabor/blob/${catalog.model.revision}/${catalog.model.sourcePath}">${t.source} · ${catalog.model.revision.slice(0,7)} ↗</a></div></div></section><section class="shell scene-purpose"><p class="eyebrow">${t.purpose}</p><h2>${t.purposeTitle}</h2><div class="scene-purpose-grid">${presentationScenes(catalog).map(s=>`<article data-feature="${esc(s.project)}"><h3>${esc(s.title[lang])}</h3><p>${esc(s.purpose[lang])}</p><p class="scene-use">${esc(s.use[lang])}</p><p class="scene-note">${esc(s.scope[lang])}</p><a href="${esc(sceneHref(s,lang))}">${esc(s.action[lang])} ↗</a>${s.id==='astralis'?`<p class="scene-note"><a href="${nativeMotionUrl}">${esc(nativeMotionLabel[lang])} ↗</a></p>`:''}</article>`).join('')}</div><a class="text-link" href="${prefix}belege/">${t.proof} ↗</a></section>`;
}
module.exports={validateSceneCatalog,presentationScenes,renderHero,renderSceneShowcase,words,renderProjection};
