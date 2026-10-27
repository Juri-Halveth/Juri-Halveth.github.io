'use strict';
// Original portfolio presentation; terms in LICENSES.md.
const {validateProjects}=require('./validate-projects.cjs');
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const order=['lucinet-seedspace','halveth-tresor','mein-lernportal','halveth-field-difference-lab'];
const names=['NOVA','Tresor','Mein Lernportal','Field Difference Lab'];
const words={
 de:{title:'Vier Projekte. Vier klare Aufgaben.',label:'ZUM EINSTIEG',source:'Quellstand',snapshot:'Projektquellen abgerufen am',more:'Quellcode',kind:['Quellen wiederfinden','Zugangsdaten verwalten','Selbstständig lernen','Modellregeln vergleichen']},
 en:{title:'Four projects. Four clear tasks.',label:'START HERE',source:'Source revision',snapshot:'Project sources retrieved on',more:'Source code',kind:['Recover sources','Manage credentials','Learn independently','Compare model rules']},
 ru:{title:'Четыре проекта. Четыре понятные задачи.',label:'НАЧНИТЕ ЗДЕСЬ',source:'Версия кода',snapshot:'Источники проектов получены',more:'Исходный код',kind:['Находить источники','Хранить учётные данные','Учиться самостоятельно','Сравнивать правила модели']}
};
function flagshipProjects(data){
 validateProjects(data);
 if(JSON.stringify(data.flagshipOrder)!==JSON.stringify(order))throw Error('Complete editorial flagship selection required');
 return order.map(id=>{const p=data.projects.find(row=>row.id===id);if(!p)throw Error('Missing flagship project');return p;});
}
function renderFlagships(data,lang){
 const t=words[lang];if(!t)throw Error('Unknown flagship language');
 const projects=flagshipProjects(data);
 return `<section id="flagships" class="flagships" aria-labelledby="flagships-title"><p class="eyebrow">${t.label}</p><h2 id="flagships-title">${t.title}</h2><div class="flagship-grid">${projects.map((p,i)=>`<article class="flagship-card" data-flagship="${esc(p.id)}"><div class="flagship-number" aria-hidden="true">0${i+1}</div><p class="flagship-task">${t.kind[i]}</p><h3>${names[i]}</h3><p>${esc(p.description[lang])}</p><p class="flagship-stage">${esc(p.stage[lang])}</p><div class="card-links"><a class="button" href="${esc(p.demo||p.repository)}">${esc(p.actionLabel?.[lang]||t.more)} ↗</a><a class="source-caption" href="${esc(p.source)}">${t.source} · ${p.revision.slice(0,7)}</a></div></article>`).join('')}</div><p class="source-caption flagship-snapshot">${t.snapshot}: <time datetime="${esc(data.sourceDate)}">${esc(data.sourceDate)}</time></p></section>`;
}
module.exports={flagshipProjects,renderFlagships};
