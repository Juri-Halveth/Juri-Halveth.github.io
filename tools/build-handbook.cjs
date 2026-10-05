'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),data=require('../data/handbook-current.json');
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const copy={
  "de": {
    "title": "Was steht wo?",
    "subtitle": "Das Handbuch zu Websites, Code und Prüfständen.",
    "lead": "Öffnen, verstehen, weiterbauen. Jede Oberfläche führt zu ihrem Quellcode, den zugehörigen Daten und den Prüfungen. Die Namen erhalten hier einen Zweck und eine Adresse.",
    "home": "Zur Startseite",
    "contents": "In diesem Handbuch",
    "open": "Oberfläche öffnen",
    "repository": "Repository öffnen",
    "source": "Was übernimmt welche Datei?",
    "tests": "Wo stehen die Prüfungen?",
    "command": "Im jeweiligen Repository ausführen",
    "results": "Prüfweg und nächster Stand",
    "pages": "HTML-Seiten und ihre Aufgaben",
    "page": "Seite",
    "role": "Wozu existiert sie?",
    "address": "Öffnen / Code",
    "live": "Ansehen",
    "code": "Quellcode",
    "scope": "Aktuelle Quellen und frühere Prüfläufe",
    "snapshot": "Früheren Prüflauf nachlesen",
    "scopeText": "Dateiverweise öffnen den aktuellen main-Zweig des jeweiligen Projekts. Inhalte und Prüfergebnisse können sich weiterentwickeln. Das ursprüngliche Quellenregister bewahrt seine datierten Fassungen und Ergebnisse.",
    "limits": "Der aktuelle Quellweg und ein tatsächlich ausgeführter Prüflauf sind verschiedene Stände. Das Archiv nennt die damalige Fassung, den Umfang und die offenen Prüfungen.",
    "flow": "Dein Weg durch den Bestand",
    "flowText": "Oberfläche → Aufgabe der Datei → gebundener Quellcode → passende Prüfung → zurück zur Übersicht.",
    "operator": "Verbundene Bereiche mit Git Bash prüfen",
    "operatorText": "HUB.sh verwendet dieses Hub-Repository und die angegebenen Quellordner. Es führt Builds und Tests aus und schreibt eine neue lokale Quittung unter .space-local/. Die Befehle unten holen die öffentlichen Quellen und installieren ihre vorhandenen Prüfabhängigkeiten.",
    "operatorSource": "Den vollständigen Bash-Operator lesen",
    "operatorNote": "Der Operator schreibt bei jedem Lauf eine neue lokale Quittung. Datierte Archivwerte bleiben bei ihrem Lauf; sie werden als Verlauf erhalten.",
    "data": "Quellenregister als JSON",
    "readme": "Handbuch als Text auf GitHub",
    "more": "Weitere Arbeiten und Quellen",
    "whyMany": "Weshalb so viele HTML-Seiten?",
    "whyManyText": "Eine Oberfläche kann viele Datenansichten öffnen. Scarlet erzeugt Figurenprofile; Lernstudio rendert Lektionen aus einem gemeinsamen Katalog. Der Elternmodus berechnet Fortschritt und Schrittanzahl aus seinen vorhandenen Übungen. Sprachfassungen, Hilfen, Rückwege und Archive haben eigene Seiten.",
    "native": "Wo gehört Morrowind hin?",
    "nativeText": "Die hier beschriebenen Bereiche sind Webprojekte. OpenMW und Unreal führen ihre eigenen Quellen, Builds und Prüfwege.",
    "morrowind": "Morrowind-Umbau: Code und Dokumentation",
    "unreal": "Native Unreal-Welt: Code und Dokumentation",
    "end": "Zurück zum Anfang",
    "edited": "Redaktioneller Wegweiser zu öffentlichen Quellen",
    "language": "Sprache",
    "handbook": "Handbuch & Quellen",
    "parent": "Für Eltern und ältere Menschen · auf Russisch"
  },
  "en": {
    "title": "What lives where?",
    "subtitle": "The handbook for websites, code and verification.",
    "lead": "Open, understand, keep building. Each interface leads to its source code, data and checks. Project names now have a purpose and an address.",
    "home": "Back to the homepage",
    "contents": "In this handbook",
    "open": "Open the interface",
    "repository": "Open repository",
    "source": "Which file does what?",
    "tests": "Where are the checks?",
    "command": "Run in the relevant repository",
    "results": "Verification method and next result",
    "pages": "HTML pages and their purposes",
    "page": "Page",
    "role": "Why does it exist?",
    "address": "Open / Code",
    "live": "View",
    "code": "Source code",
    "scope": "Current sources and earlier checks",
    "snapshot": "Read the earlier verification run",
    "scopeText": "File links open the current main branch of each project. Content and verification results can evolve. The original source register retains its dated versions and results.",
    "limits": "The current source route and an executed verification run are different states. The archive records its version, coverage and outstanding checks.",
    "flow": "Your route through the sources",
    "flowText": "Interface → file purpose → bound source code → relevant check → back to the overview.",
    "operator": "Verify connected areas with Git Bash",
    "operatorText": "HUB.sh uses this hub repository and the supplied source folders. It runs builds and tests and writes a new local receipt under .space-local/. The commands below retrieve the public sources and install their existing test dependencies.",
    "operatorSource": "Read the complete Bash operator",
    "operatorNote": "Each operator run writes a new local receipt. Archived values remain attached to their run and are retained as history.",
    "data": "Source register as JSON",
    "readme": "Text handbook on GitHub",
    "more": "More works and sources",
    "whyMany": "Why so many HTML pages?",
    "whyManyText": "An interface can open many data views. Scarlet generates character profiles; Lernstudio renders lessons from a shared catalogue. Parent mode derives progress and step totals from its exercises. Language editions, help, return routes and archives have their own pages.",
    "native": "Where does Morrowind belong?",
    "nativeText": "The areas described here are web projects. OpenMW and Unreal have their own sources, builds and verification methods.",
    "morrowind": "Morrowind restoration: code and documentation",
    "unreal": "Native Unreal world: code and documentation",
    "end": "Back to the beginning",
    "edited": "An editorial guide to public sources",
    "language": "Language",
    "handbook": "Handbook & sources",
    "parent": "For parents and older adults · in Russian"
  },
  "ru": {
    "title": "Что и где находится?",
    "subtitle": "Руководство по сайтам, коду и проверкам.",
    "lead": "Откройте, разберитесь и продолжайте создавать. Каждый интерфейс ведёт к его коду, данным и проверкам. У названий проектов есть назначение и адрес.",
    "home": "На главную",
    "contents": "В этом руководстве",
    "open": "Открыть интерфейс",
    "repository": "Открыть репозиторий",
    "source": "За что отвечает каждый файл?",
    "tests": "Где находятся проверки?",
    "command": "Выполнить в соответствующем репозитории",
    "results": "Способ проверки и следующий результат",
    "pages": "HTML-страницы и их назначение",
    "page": "Страница",
    "role": "Зачем она существует?",
    "address": "Открыть / Код",
    "live": "Посмотреть",
    "code": "Исходный код",
    "scope": "Текущие источники и прежние проверки",
    "snapshot": "Прочитать о прежнем запуске проверок",
    "scopeText": "Ссылки на файлы открывают текущую ветку main каждого проекта. Материалы и результаты проверок могут развиваться. Исходный реестр сохраняет датированные версии и результаты.",
    "limits": "Текущий путь к коду и реально выполненная проверка — разные состояния. Архив указывает прежнюю версию, объём и открытые проверки.",
    "flow": "Путь по источникам",
    "flowText": "Интерфейс → назначение файла → конкретная версия кода → соответствующая проверка → обратно к обзору.",
    "operator": "Проверить связанные разделы через Git Bash",
    "operatorText": "HUB.sh использует этот хаб и указанные папки с кодом. Он запускает сборки и проверки и записывает новую локальную квитанцию в .space-local/. Команды ниже получают открытый код и устанавливают его существующие зависимости для проверок.",
    "operatorSource": "Прочитать весь Bash-оператор",
    "operatorNote": "Каждый запуск оператора создаёт новую локальную квитанцию. Архивные значения остаются связанными со своим запуском и сохраняются как история.",
    "data": "Реестр источников в JSON",
    "readme": "Текст руководства на GitHub",
    "more": "Другие работы и источники",
    "whyMany": "Почему столько HTML-страниц?",
    "whyManyText": "Интерфейс может открывать много представлений данных. Scarlet создаёт профили персонажей; Lernstudio отображает уроки из общего каталога. Режим для родителей вычисляет прогресс и число шагов из упражнений. У языковых версий, помощи, обратных путей и архивов свои страницы.",
    "native": "Где здесь Morrowind?",
    "nativeText": "Здесь описаны веб-проекты. OpenMW и Unreal имеют свои источники, сборки и способы проверки.",
    "morrowind": "Восстановление Morrowind: код и документация",
    "unreal": "Мир Unreal: код и документация",
    "end": "К началу",
    "edited": "Редакционный путеводитель по публичным источникам",
    "language": "Язык",
    "handbook": "Руководство и источники",
    "parent": "Для родителей и старших · по-русски"
  }
};
const gripCopy={
 de:{title:'Normales Greifen und Zusammenhang',text:'Aufnehmen, tragen, drehen, ansehen und ablegen: Derselbe Gegenstand bleibt erhalten. Der Codeversuch führt eine Tasse durch diese Aktionen und bewahrt Material, Umgebung und Zustandsverlauf. Rendering, Handanimation und physikalischer Kontakt bekommen darauf aufbauend ihren eigenen Integrationsschritt.',source:'Greifmodell als Code',tests:'Die Modellprüfungen lesen',command:'Im Hub-Repository ausführen'},
 en:{title:'Ordinary grasping and context',text:'Take, carry, turn, look and place: the same object persists. This code experiment takes a cup through these actions while retaining material, surroundings and state history. Rendering, hand animation and physical contact have their own integration step on this basis.',source:'Read the grasp model',tests:'Read the model checks',command:'Run in the hub repository'},
 ru:{title:'Обычное хватание и контекст',text:'Взять, нести, повернуть, осмотреть и положить: предмет сохраняет свою идентичность. Этот кодовый эксперимент проводит чашку через действия, сохраняя материал, окружение и историю состояний. Отрисовка, анимация руки и физический контакт получают отдельный шаг интеграции на этой основе.',source:'Прочитать модель хватания',tests:'Прочитать проверки модели',command:'Выполнить в репозитории хаба'}
};
function gripSection(lang){const c=gripCopy[lang];return '<section class="handbook-section" id="greifen"><p class="eyebrow">CODE · WORLD STATE</p><h2>'+c.title+'</h2><p>'+c.text+'</p><p class="source-caption">'+c.command+'</p><pre><code>node examples/world-grip.mjs</code></pre><div class="source-links">'+a('https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/main/examples/world-grip.mjs',c.source+' ↗')+a('https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/main/examples/world-grip.test.mjs',c.tests+' ↗')+'</div></section>';}
const setup=`git clone https://github.com/Juri-Halveth/Juri-Halveth.github.io.git hub
mkdir hub-quellen
git clone https://github.com/Juri-Halveth/fortuna.git hub-quellen/fortuna
git clone https://github.com/Juri-Halveth/halveth-scarlet.git hub-quellen/halveth-scarlet
git clone https://github.com/Juri-Halveth/lernstudio.git hub-quellen/lernstudio
git clone https://github.com/Juri-Halveth/mein-lernportal.git hub-quellen/mein-lernportal
(cd hub && npm ci --ignore-scripts --no-audit --no-fund)
(cd hub-quellen/lernstudio && npm ci --ignore-scripts --no-audit --no-fund)
(cd hub-quellen/mein-lernportal && npm ci --ignore-scripts --no-audit --no-fund)
bash hub/HUB.sh verify hub-quellen`;
function href(u){const p=new URL(u,'https://juri-halveth.github.io/');if(p.protocol!=='https:'||p.username||p.password||!['juri-halveth.github.io','github.com'].includes(p.hostname))throw Error('Nonpublic destination');return u;}
const a=(u,t)=>'<a href="'+esc(href(u))+'"'+(u.startsWith('https:')?' target="_blank" rel="noopener"':'')+'>'+esc(t)+'</a>';
const home=lang=>lang==='de'?'/':'/'+lang+'/';
const route=lang=>home(lang)+'handbuch/';
function entry(p,lang){if(p.id==='space')return 'https://juri-halveth.github.io'+home(lang);const u=new URL(p.live);u.searchParams.set('lang',lang);return u.href;}
const lineRole=(value,lang)=>value.split(' / ')[['de','en','ru'].indexOf(lang)]||value;
function sourceList(list,lang){return '<ul class="handbook-sources">'+list.map(s=>'<li>'+a(s.url,s.path)+'<span>'+esc(lineRole(s.role,lang))+'</span></li>').join('')+'</ul>';}
function section(p,i,lang){const c=copy[lang];return '<section class="handbook-section" id="'+p.id+'"><p class="eyebrow">0'+(i+1)+' / '+esc(p.name)+'</p><h2>'+esc(p.title[lang])+'</h2><p class="handbook-purpose">'+esc(p.purpose[lang])+'</p><div class="source-links">'+a(entry(p,lang),c.open+' ↗')+a('https://github.com/'+p.repository,c.repository+' ↗')+(p.id==='learning'?a('https://juri-halveth.github.io/lernstudio/eltern/',c.parent+' ↗'):'')+'</div><div class="handbook-columns"><div><h3>'+c.source+'</h3>'+sourceList(p.sources,lang)+'</div><div><h3>'+c.tests+'</h3>'+sourceList(p.tests,lang)+'<p class="source-caption">'+c.command+'</p><pre><code>'+esc(p.command)+'</code></pre><h3>'+c.results+'</h3><p>'+esc(p.result[lang])+'</p><p class="source-caption">'+a('https://github.com/'+p.repository+'/tree/main','main ↗')+'</p></div></div><details class="handbook-pages"><summary>'+c.pages+'</summary><div class="handbook-table-wrap"><table><thead><tr><th>'+c.page+'</th><th>'+c.role+'</th><th>'+c.address+'</th></tr></thead><tbody>'+p.pages.map(page=>'<tr><th scope="row"><code>'+esc(page.path)+'</code><span>'+esc(page.title)+'</span></th><td>'+esc(data.roles[page.role][lang])+'</td><td>'+a(page.live,c.live+' ↗')+'<br>'+a(page.code,c.code+' ↗')+'</td></tr>').join('')+'</tbody></table></div></details><a class="back-link" href="#wegweiser">'+c.end+' ↑</a></section>';}
function build(lang){const c=copy[lang];const selector='<nav class="language-links shell" aria-label="'+c.language+'">'+[['de','Deutsch'],['en','English'],['ru','Русский']].map(([l,label])=>'<a data-language-link href="'+route(l)+'" lang="'+l+'" hreflang="'+l+'"'+(l===lang?' aria-current="page"':'')+'>'+label+'</a>').join('')+'</nav>';
const jumps='<nav class="section-jumps" aria-label="'+c.contents+'">'+data.projects.map(p=>a('#'+p.id,p.title[lang])).join('')+a('#prueflauf',c.scope)+a('#bash-operator','Git Bash')+a('#greifen',gripCopy[lang].title)+'</nav>';
const head='<!doctype html><html lang="'+lang+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="'+esc(c.subtitle)+'"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'self\'; script-src \'self\'; img-src \'self\'; connect-src \'none\'; base-uri \'none\'; form-action \'none\'; object-src \'none\'"><link rel="canonical" href="https://juri-halveth.github.io'+route(lang)+'">'+['de','en','ru'].map(l=>'<link rel="alternate" hreflang="'+l+'" href="https://juri-halveth.github.io'+route(l)+'">').join('')+'<link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/portal.css"><link rel="stylesheet" href="/language.css"><link rel="stylesheet" href="/handbook.css"><script src="/motion-core.js" defer></script><script src="/landing-motion.js" defer></script><title>'+esc(c.title)+' · HALVETH</title></head><body id="anfang"><a class="skip-link" href="#main">'+c.contents+'</a>'+selector+'<header class="site-header shell"><a class="brand" href="'+home(lang)+'"><span class="brand-mark" aria-hidden="true">H</span><span>Juri Halveth<small>HALVETH / LUCINET</small></span></a><nav aria-label="Navigation">'+a(home(lang),c.home)+a(home(lang)+'arbeiten/',c.more)+'</nav></header>';
const hero='<main class="shell handbook" id="main"><section class="handbook-hero" id="wegweiser"><div><p class="eyebrow">HALVETH / LUCINET · '+esc(c.handbook)+'</p><h1>'+esc(c.title)+'</h1><p class="lead">'+esc(c.subtitle)+'</p><p>'+esc(c.lead)+'</p></div><figure class="handbook-art"><div class="motion-surface"><canvas data-ambient-motion width="480" height="350" role="img" aria-label="HALVETH · '+esc(c.handbook)+'"></canvas><img class="motion-fallback" src="/assets/field.svg" width="480" height="350" alt=""></div></figure></section>'+jumps+'<section class="handbook-intro"><h2>'+c.flow+'</h2><p>'+c.flowText+'</p><div class="source-links">'+a('https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/main/docs/HANDBUCH.md',c.readme+' ↗')+a('/data/handbook-current.json',c.data+' ↗')+'</div></section>'+data.projects.map((p,i)=>section(p,i,lang)).join('');
const tail=gripSection(lang)+'<section class="handbook-section" id="prueflauf"><p class="eyebrow">'+c.scope+'</p><h2>'+c.whyMany+'</h2><p>'+c.whyManyText+'</p><h3>'+c.snapshot+'</h3><p>'+c.scopeText+'</p><p>'+c.limits+'</p><div class="source-links">'+a('/data/handbook.json',c.data+' ↗')+'</div><h3>'+c.native+'</h3><p>'+c.nativeText+'</p><div class="source-links">'+a('https://github.com/Juri-Halveth/halveth-morrowind-genesis',c.morrowind+' ↗')+a('https://github.com/Juri-Halveth/halveth-unreal',c.unreal+' ↗')+'</div></section><section class="handbook-section" id="bash-operator"><p class="eyebrow">GIT BASH · NODE.JS 24</p><h2>'+c.operator+'</h2><p>'+c.operatorText+'</p><pre><code>'+esc(setup)+'</code></pre><p>'+c.operatorNote+'</p><div class="source-links">'+a('https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/main/HUB.sh',c.operatorSource+' ↗')+a('/data/handbook.json',c.data+' ↗')+'</div></section></main><footer class="site-footer shell"><div>'+a(home(lang),c.home+' ↑')+'<p>'+c.edited+'</p></div><nav aria-label="'+c.more+'">'+a(home(lang)+'arbeiten/',c.more)+a('/LICENSES.md','Lizenzen / Licences / Лицензии')+'</nav></footer></body></html>\n';
const dest=path.join(root,lang==='de'?'':lang,'handbuch/index.html');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,head+hero+tail);}
for(const lang of ['de','en','ru'])build(lang);
const md='# HALVETH / LUCINET · Was steht wo?\n\n[Handbuch öffnen](https://juri-halveth.github.io/handbuch/) · [English](https://juri-halveth.github.io/en/handbuch/) · [Русский](https://juri-halveth.github.io/ru/handbuch/)\n\n'+copy.de.lead+'\n\n'+copy.de.scopeText+'\n\n'+data.projects.map(p=>'## '+p.title.de+'\n\n'+p.purpose.de+'\n\n[Oberfläche]('+p.live+') · [Repository](https://github.com/'+p.repository+')\n\n### Oberfläche, Daten, Verhalten und Build\n\n'+p.sources.map(s=>'- ['+s.path+']('+s.url+'): '+lineRole(s.role,'de')).join('\n')+'\n\n### Prüfungen\n\n'+p.tests.map(s=>'- ['+s.path+']('+s.url+')').join('\n')+'\n\n```bash\n'+p.command+'\n```\n\n'+p.result.de+'\n\nAktueller Code: `main`. Das [HTML-Seitenregister](https://juri-halveth.github.io/handbuch/#'+p.id+') führt die erfassten Seiten zu ihrem Zweck, ihrer öffentlichen Adresse und ihrer Quellfassung.\n').join('\n')+'\n## '+gripCopy.de.title+'\n\n'+gripCopy.de.text+'\n\n```bash\nnode examples/world-grip.mjs\n```\n\n[Greifmodell](../examples/world-grip.mjs) · [Modellprüfungen](../examples/world-grip.test.mjs)\n\n## Der ganze Ablauf in Git Bash\n\n'+copy.de.operatorText+'\n\n```bash\n'+setup+'\n```\n\n[Veröffentlichter Operator](../HUB.sh) · [Quellenregister](../data/handbook.json)\n\n'+copy.de.operatorNote+'\n\n## Was der Prüflauf abdeckt\n\n'+copy.de.limits+'\n\n'+copy.de.nativeText+'\n\n[OpenMW / Morrowind](https://github.com/Juri-Halveth/halveth-morrowind-genesis) · [Unreal](https://github.com/Juri-Halveth/halveth-unreal)\n\n[Zur Startseite](https://juri-halveth.github.io/) · [Alle Arbeiten](https://juri-halveth.github.io/arbeiten/)\n';
fs.writeFileSync(path.join(root,'docs/HANDBUCH.md'),md);
console.log(JSON.stringify({state:'HANDBOOK_BUILT',languages:Object.keys(copy).length,projects:data.projects.length,sourceHtmlPages:data.projects.reduce((n,p)=>n+p.pages.length,0)}));
module.exports={copy,route};
