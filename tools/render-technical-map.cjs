// Presentation of public, pinned work samples. See LICENSES.md.
'use strict';
const crypto=require('node:crypto');
const languages=['de','en','ru'];
const text={
 de:{nav:'Technik & Code',eyebrow:'TECHNISCHE SCHNITTSTELLEN',areas:'Themen',samples:'Arbeitsproben',repos:'Repositories',patterns:'Was sich durch die Projekte zieht',scope:'Prüfumfang',open:'Quellen & Belege öffnen',version:'Quellstand',review:'Quellen geprüft',github:'Als GitHub-Dokument lesen',teaser:'Von der Fähigkeit direkt zum Code.',go:'Schnittstellenkarte erkunden',all:'Alle Projekte ansehen',release:'Windows-Vorschau',contribution:'Eigener Commit',footer:'Projektleitung und Zusammenstellung: Juri / HALVETH. Entwicklung mit KI-Unterstützung. Verlinkte Quellen behalten ihre Attribution und Lizenzen.',roles:{source:'Implementierung',test:'Gegenprobe',documentation:'Builddokumentation',workflow:'Pipeline'}},
 en:{nav:'Technology & code',eyebrow:'TECHNICAL INTERFACES',areas:'Areas',samples:'Work samples',repos:'Repositories',patterns:'Patterns across the projects',scope:'Review scope',open:'Open sources & evidence',version:'Source revision',review:'Sources reviewed',github:'Read as a GitHub document',teaser:'From capability straight to code.',go:'Explore the interface map',all:'See all projects',release:'Windows preview',contribution:'Contribution commit',footer:'Project lead and curation: Juri / HALVETH. AI-assisted development. Linked sources retain their attribution and licences.',roles:{source:'Implementation',test:'Counterexample',documentation:'Build documentation',workflow:'Pipeline'}},
 ru:{nav:'Технологии и код',eyebrow:'ТЕХНИЧЕСКИЕ ИНТЕРФЕЙСЫ',areas:'Области',samples:'Примеры',repos:'Репозитории',patterns:'Приёмы, общие для проектов',scope:'Охват проверки',open:'Открыть источники и материалы',version:'Версия исходников',review:'Источники изучены',github:'Открыть документ на GitHub',teaser:'От навыка прямо к коду.',go:'Изучить карту интерфейсов',all:'Все проекты',release:'Версия для Windows',contribution:'Коммит собственного изменения',footer:'Руководство и подбор: Юри / HALVETH. Разработка с помощью ИИ. Источники сохраняют атрибуцию и лицензии.',roles:{source:'Реализация',test:'Контрпример',documentation:'Документация сборки',workflow:'Конвейер'}}
};
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function translated(value){
 if(!value||Object.keys(value).sort().join('|')!=='de|en|ru'||languages.some(l=>typeof value[l]!=='string'||!value[l].trim()))throw Error('Complete map translations required');
}
function validateMap(data,provenance,bytes){
 if(data.schema!=='halveth.technical-interface-map.v1')throw Error('Unsupported technical map');
 if(!Array.isArray(data.items)||!data.items.length||!Array.isArray(data.areas)||!data.areas.length)throw Error('Map areas and samples required');
 const ids=data.items.map(x=>x.id),areas=data.areas.map(x=>x.id);
 if(new Set(ids).size!==ids.length||new Set(areas).size!==areas.length||[...ids,...areas].some(x=>!/^[a-z][a-z0-9-]{0,63}$/.test(x)))throw Error('Unique map anchors required');
 for(const field of ['title','positioning','introduction','scope'])translated(data[field]);
 for(const area of data.areas){translated(area.title);if(!data.items.some(x=>x.area===area.id))throw Error('Empty map area');}
 for(const item of data.items){
  if(!areas.includes(item.area)||item.review!=='STATIC_SOURCE_REVIEW')throw Error('Invalid map review scope');
  for(const field of ['title','interface','summary','scope'])translated(item[field]);
  if(!Array.isArray(item.technologies)||!item.technologies.length||item.technologies.some(x=>typeof x!=='string'||!x))throw Error('Technologies required');
  if(!Array.isArray(item.evidence)||!item.evidence.length)throw Error('Bound source required');
  const roles=new Set();
  for(const e of item.evidence){
   roles.add(e.role);
   if(!Object.hasOwn(text.en.roles,e.role)||!/^Juri-Halveth\/[A-Za-z0-9_.-]+$/.test(e.repository)||!/^[a-f0-9]{40}$/.test(e.revision)||!/^[a-f0-9]{64}$/.test(e.sha256))throw Error('Invalid source binding');
   if(typeof e.path!=='string'||e.path.split('/').some(p=>!p||p==='..'||p==='.')||!Number.isSafeInteger(e.startLine)||!Number.isSafeInteger(e.endLine)||e.startLine<1||e.endLine<e.startLine)throw Error('Invalid source span');
   const source=`https://github.com/${e.repository}/blob/${e.revision}/${e.path.split('/').map(encodeURIComponent).join('/')}#L${e.startLine}-L${e.endLine}`;
   if(e.url!==source)throw Error('Source URL must bind the exact file and lines');
  }
  if(!roles.has('source')&&!roles.has('workflow'))throw Error('Implementation required');
  if(!roles.has('test')&&!roles.has('documentation')&&!item.contribution)throw Error('Countercheck required');
  for(const kind of ['release','contribution'])if(item[kind]&&!/^https:\/\/github\.com\/Juri-Halveth\/[A-Za-z0-9_.-]+\/(?:releases\/tag|commit)\/[A-Za-z0-9_.-]+$/.test(item[kind].url))throw Error('Invalid supplemental link');
 }
 for(const c of data.connections){translated(c.title);if(new Set(c.items).size<2||c.items.some(id=>!ids.includes(id)))throw Error('Unknown map cross-reference');}
 if(provenance.schema!=='halveth.technical-map-copy.v1'||provenance.repository!=='Juri-Halveth/Juri-Halveth'||!/^[a-f0-9]{40}$/.test(provenance.revision)||provenance.path!=='data/technical-map.json')throw Error('Canonical profile source required');
 if(crypto.createHash('sha256').update(bytes).digest('hex')!==provenance.sha256)throw Error('Map differs from its bound profile copy');
}
function renderTechnicalMap(data,lang,provenance){
 const t=text[lang],prefix=lang==='de'?'/':`/${lang}/`,byId=new Map(data.items.map(i=>[i.id,i]));
 const document=lang==='de'?'TECHNICAL-MAP.md':`TECHNICAL-MAP.${lang}.md`;
 const count=new Set(data.items.flatMap(i=>i.evidence.map(e=>e.repository))).size;
 let html=`<section class="shell section technical-map-intro"><p class="eyebrow">${t.eyebrow}</p><h1>${esc(data.title[lang])}</h1><p class="lead map-positioning">${esc(data.positioning[lang])}</p><p>${esc(data.introduction[lang])}</p><ul class="map-stats" aria-label="${esc(t.eyebrow)}"><li><strong>${data.areas.length}</strong> ${t.areas}</li><li><strong>${data.items.length}</strong> ${t.samples}</li><li><strong>${count}</strong> ${t.repos}</li></ul><nav class="map-jumps" aria-label="${t.areas}">${data.areas.map((a,n)=>`<a href="#area-${a.id}"><span>${String(n+1).padStart(2,'0')}</span>${esc(a.title[lang])}</a>`).join('')}</nav><a class="text-link" href="https://github.com/Juri-Halveth/Juri-Halveth/blob/${provenance.revision}/${document}">${t.github} ↗</a><p class="source-caption">${t.review} · ${esc(data.reviewedAt)}</p></section>`;
 html+=`<section class="map-patterns"><div class="shell section"><h2>${t.patterns}</h2><div class="map-pattern-grid">${data.connections.map(c=>`<article><h3>${esc(c.title[lang])}</h3><ul>${c.items.map(id=>`<li><a href="#sample-${id}">${esc(byId.get(id).title[lang])}</a></li>`).join('')}</ul></article>`).join('')}</div></div></section>`;
 for(const [index,area] of data.areas.entries()){
  html+=`<section class="shell section map-area" id="area-${area.id}"><p class="eyebrow">${String(index+1).padStart(2,'0')} / ${data.areas.length}</p><h2>${esc(area.title[lang])}</h2><div class="map-samples">`;
  for(const i of data.items.filter(x=>x.area===area.id)){
   html+=`<article class="map-sample" id="sample-${i.id}" data-sample="${i.id}"><p class="map-tech">${i.technologies.map(esc).join(' · ')}</p><h3>${esc(i.title[lang])}</h3><p class="map-interface">${esc(i.interface[lang])}</p><p>${esc(i.summary[lang])}</p><p class="map-scope"><strong>${t.scope}:</strong> ${esc(i.scope[lang])}</p><details><summary>${t.open}<span aria-hidden="true"> +</span></summary><ul class="map-evidence">${i.evidence.map(e=>`<li><span>${t.roles[e.role]}</span><a href="${esc(e.url)}"><code>${esc(e.path)}:${e.startLine}</code> ↗</a><small>${esc(e.repository)} · ${t.version} ${e.revision.slice(0,7)}</small></li>`).join('')}${['release','contribution'].filter(k=>i[k]).map(k=>`<li><a href="${esc(i[k].url)}">${t[k]} ↗</a></li>`).join('')}</ul></details></article>`;
  }
  html+='</div></section>';
 }
 html+=`<section class="shell section map-closing"><p>${esc(data.scope[lang])}</p><p class="source-caption">${t.footer}</p><a class="button" href="${prefix}arbeiten/">${t.all} ↗</a></section>`;
 return html;
}
function renderMapTeaser(data,lang){
 const t=text[lang],prefix=lang==='de'?'/':`/${lang}/`;
 return `<section class="map-teaser"><div class="shell section"><p class="eyebrow">${t.eyebrow}</p><h2>${t.teaser}</h2><p class="lead">${esc(data.positioning[lang])}</p><p>${esc(data.introduction[lang])}</p><a class="text-link" href="${prefix}koennen/">${t.go} ↗</a></div></section>`;
}
module.exports={validateMap,renderTechnicalMap,renderMapTeaser,mapCopy:text};
