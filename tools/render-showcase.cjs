'use strict';
// Original portfolio presentation; path/version terms remain in LICENSES.md.
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const texts = {
 de: {
  label:'HALVETH / AUSGEWÄHLTE ARBEITEN', title:'Erst erleben.<br><em>Dann ins Detail.</em>',
  lead:'Eine Spielwelt. Eine interaktive Szene. Ein nachvollziehbarer Prüfweg. Drei direkte Einstiege in die Arbeit dahinter.',
  native:'01 / NATIVE SPIELWELT', nativeTitle:'ASHBOUND', nativeLead:'Bücher werden Räume.<br>Ideen werden Spielwelten.',
  nativeBody:'Ein eigenständiges Unreal-Projekt mit Archiv, Zaubern und Büchern im 3D-Raum. Öffne die veröffentlichte Windows-Vorschau oder prüfe den zugehörigen Entwicklungsquellstand.',
  preview:'Windows-Vorschau v0.4.2', nativeSource:'Unreal-Quellen', nativeScope:'Vorschau und Entwicklungsquellen sind getrennte Stände. Abbildung aus dem Entwicklungsquellstand.',
  interactive:'02 / DIREKT IM BROWSER', interactiveTitle:'SCARLET', interactiveLead:'Ein Klick.<br>Eine andere Perspektive.',
  interactiveBody:'Die Singularity Cannon macht eine grafische Idee unmittelbar bedienbar. Öffnen, ausprobieren und anschließend die Implementierung ansehen.',
  open:'Szene ausprobieren', scarletSource:'SCARLET-Quellen', sceneScope:'Interaktive Browsergrafik · gestaltete Simulation.',
  lab:'03 / CODE MIT GEGENPROBEN', labTitle:'Forschungslabor', labLead:'Was passiert,<br>wenn sich die Eingabe ändert?',
  labBody:'Zehn lokale JavaScript- und Python-Module: Quellenpakete, Bildvergleich, Optik, Ereignisse und Regeln. Mit Gegenproben für veränderte Bytes, ungültige Zustände und offene Ergebnisse.',
  inspect:'Code und Tests öffnen', receipt:'Lokales Prüfprotokoll', proof:'99 JavaScript + 46 Python', proofLabel:'Tests im lokalen Lauf bestanden · 20.10.2026', scope:'Der Prüfstand gilt für die mitgelieferten Modellverträge. Er ist keine externe Produktprüfung.',
  routeTitle:'Dein nächster Schritt', routeLead:'Wähle, wie tief du einsteigen möchtest.',
  routes:[['Ansehen & ausprobieren','Browserdemos und die native Vorschau.','arbeiten/'],['Technik nachvollziehen','14 Arbeitsproben mit Funktionen und Gegenproben.','koennen/'],['Zusammenarbeiten','Software, Prototypen und verständliche Oberflächen.','#contact']]
 },
 en: {
  label:'HALVETH / SELECTED WORK',title:'Experience it first.<br><em>Then look closer.</em>',
  lead:'A game world. An interactive scene. A reproducible test path. Three direct ways into the engineering behind the work.',
  native:'01 / NATIVE GAME WORLD',nativeTitle:'ASHBOUND',nativeLead:'Books become spaces.<br>Ideas become game worlds.',
  nativeBody:'An independent Unreal project with an archive, spells and books in 3D space. Open the published Windows preview or inspect the development source.',
  preview:'Windows preview v0.4.2',nativeSource:'Unreal source',nativeScope:'Preview and development source are separate revisions. Illustration from development source.',
  interactive:'02 / IN YOUR BROWSER',interactiveTitle:'SCARLET',interactiveLead:'One click.<br>A different perspective.',
  interactiveBody:'The Singularity Cannon turns a visual idea into an interactive scene. Open it, try the controls, then inspect the implementation.',
  open:'Try the scene',scarletSource:'SCARLET source',sceneScope:'Interactive browser graphics · designed simulation.',
  lab:'03 / CODE AND COUNTEREXAMPLES',labTitle:'Research lab',labLead:'What happens<br>when the input changes?',
  labBody:'Ten local JavaScript and Python modules: source packets, image comparison, optics, events and rules. Counterexamples cover modified bytes, invalid states and unresolved results.',
  inspect:'Open code and tests',receipt:'Local validation record',proof:'99 JavaScript + 46 Python',proofLabel:'Tests passed in the local run · 20 Oct 2026',scope:'The recorded checks cover the supplied model contracts. They are not an external product assessment.',
  routeTitle:'Your next step',routeLead:'Choose how closely you want to look.',
  routes:[['See & try','Browser demos and the native preview.','arbeiten/'],['Inspect the engineering','14 samples with functions and counterexamples.','koennen/'],['Collaborate','Software, prototypes and understandable interfaces.','#contact']]
 },
 ru: {
  label:'HALVETH / ИЗБРАННЫЕ РАБОТЫ',title:'Сначала попробуйте.<br><em>Затем изучите детали.</em>',
  lead:'Игровой мир. Интерактивная сцена. Воспроизводимая проверка. Три прямых входа в техническую работу.',
  native:'01 / НАТИВНЫЙ ИГРОВОЙ МИР',nativeTitle:'ASHBOUND',nativeLead:'Книги становятся пространством.<br>Идеи — игровыми мирами.',
  nativeBody:'Самостоятельный проект Unreal: архив, заклинания и книги в 3D-пространстве. Откройте опубликованную версию Windows или изучите исходники разработки.',
  preview:'Версия Windows v0.4.2',nativeSource:'Исходники Unreal',nativeScope:'Предварительная версия и исходники разработки — разные состояния. Иллюстрация взята из исходников разработки.',
  interactive:'02 / ПРЯМО В БРАУЗЕРЕ',interactiveTitle:'SCARLET',interactiveLead:'Один щелчок.<br>Другой взгляд.',
  interactiveBody:'Singularity Cannon превращает графическую идею в интерактивную сцену. Откройте, попробуйте управление и изучите реализацию.',
  open:'Попробовать сцену',scarletSource:'Исходники SCARLET',sceneScope:'Интерактивная браузерная графика · художественная симуляция.',
  lab:'03 / КОД И КОНТРПРИМЕРЫ',labTitle:'Лаборатория',labLead:'Что произойдёт,<br>если изменить входные данные?',
  labBody:'Десять локальных модулей JavaScript и Python: пакеты источников, сравнение изображений, оптика, события и правила. Контрпримеры проверяют изменённые байты, неверные состояния и открытые результаты.',
  inspect:'Открыть код и тесты',receipt:'Протокол локальной проверки',proof:'99 JavaScript + 46 Python',proofLabel:'Тесты пройдены локально · 20.10.2026',scope:'Проверки относятся к предоставленным модельным контрактам и не заменяют внешнюю проверку продукта.',
  routeTitle:'Следующий шаг',routeLead:'Выберите нужную глубину.',
  routes:[['Посмотреть и попробовать','Браузерные сцены и версия Windows.','arbeiten/'],['Изучить техническую работу','14 примеров с функциями и контрпримерами.','koennen/'],['Сотрудничать','Программы, прототипы и понятные интерфейсы.','#contact']]
 }
};
function renderShowcase(projects, lang) {
 const t=texts[lang];
 if(!t)throw Error('Unknown showcase language');
 const native=projects.find(p=>p.id==='ashbound-native');
 const lab=projects.find(p=>p.id==='halveth-forschungslabor');
 if(!native?.image||!native?.demo||!lab?.source)throw Error('Source-bound showcase projects required');
 for(const p of [native,lab]){
  if(!/^[a-f0-9]{40}$/.test(p.revision)||!p.source.includes('/'+p.revision+'/'))throw Error('Pinned showcase revision required');
 }
 const prefix=lang==='de'?'/':'/'+lang+'/';
 return `<section class="showcase-band" id="showcase" aria-labelledby="showcase-heading"><div class="shell section"><div class="showcase-heading"><div><p class="eyebrow">${t.label}</p><h2 id="showcase-heading">${t.title}</h2></div><p>${t.lead}</p></div>
 <article class="flagship" data-feature="ashbound-native"><figure class="flagship-image"><img src="${esc(native.image)}" alt="${esc(native.imageAlt[lang])}" width="1920" height="1080" loading="lazy"><figcaption>${t.nativeScope}</figcaption></figure><div class="flagship-copy"><p class="eyebrow">${t.native}</p><h3>${t.nativeTitle}</h3><p class="flagship-line">${t.nativeLead}</p><p>${t.nativeBody}</p><div class="feature-links"><a class="button" href="${esc(native.demo)}">${t.preview} ↗</a><a href="${esc(native.source)}">${t.nativeSource} · ${native.revision.slice(0,7)} ↗</a></div></div></article>
 <div class="feature-pair"><article class="feature-browser" data-feature="scarlet-browser"><figure class="feature-capture"><img src="/assets/scarlet-cannon-live.png" alt="${lang==='de'?'Browseraufnahme der Singularity Cannon mit ausgelöster Singularität':lang==='en'?'Browser capture of Singularity Cannon after firing':'Снимок Singularity Cannon после запуска'}" width="1280" height="720" loading="lazy"></figure><div class="feature-body"><p class="eyebrow">${t.interactive}</p><h3>${t.interactiveTitle}</h3><p class="feature-line">${t.interactiveLead}</p><p>${t.interactiveBody}</p><div class="feature-links"><a class="button" href="https://juri-halveth.github.io/halveth-scarlet/forschung/singularity-cannon/">${t.open} ↗</a><a href="https://github.com/Juri-Halveth/halveth-scarlet">${t.scarletSource} ↗</a></div><p class="feature-scope">${t.sceneScope}</p></div></article>
 <article class="feature-lab" data-feature="halveth-forschungslabor"><div class="proof-terminal"><span class="terminal-heading">HALVETH / LOCAL TEST RUN</span><code>$ npm test</code><strong>${t.proof}</strong><span>${t.proofLabel}</span><span class="terminal-revision">SOURCE / ${lab.revision.slice(0,12)}</span></div><div class="feature-body"><p class="eyebrow">${t.lab}</p><h3>${t.labTitle}</h3><p class="feature-line">${t.labLead}</p><p>${t.labBody}</p><div class="feature-links"><a class="button" href="${esc(lab.source)}">${t.inspect} ↗</a><a href="/docs/WORK-SAMPLE-VALIDATION-2026-10-20.md">${t.receipt} ↗</a></div><p class="feature-scope">${t.scope}</p></div></article></div>
 </div></section><section class="shell visitor-routes"><div><p class="eyebrow">${t.routeTitle}</p><h2>${t.routeLead}</h2></div><div class="route-grid">${t.routes.map(([title,body,url],i)=>`<a href="${url.startsWith('#')?url:prefix+url}"><span class="route-number">0${i+1}</span><strong>${title} ↗</strong><span>${body}</span></a>`).join('')}</div></section>`;
}
module.exports={renderShowcase};
