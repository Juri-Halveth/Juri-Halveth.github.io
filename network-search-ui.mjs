// Source-available under LICENSES.md. Public, static data only; no remote search requests.
import index from './universum/api/search.mjs';
import {searchNetwork} from './network-search.mjs';

const words={
 de:{results:'Treffer im öffentlichen Index',source:'Quelle',observed:'Quelle beobachtet',historic:'Historisch / zurückgezogen',repository:'Repository',module:'Modul / Einstieg',site:'Website',entry:'Eintrag',all:'Alle',stale:'Der Inventarabruf liegt mehr als zwei Tage zurück. Der angezeigte Stand ist keine Live-Abfrage.',revision:'Revision'},
 en:{results:'results in the public index',source:'Source',observed:'Source observed',historic:'Historical / withdrawn',repository:'Repository',module:'Module / entry point',site:'Website',entry:'Entry',all:'All',stale:'The inventory was observed more than two days ago. This snapshot is not a live query.',revision:'Revision'},
 ru:{results:'результатов в открытом индексе',source:'Источник',observed:'Дата наблюдения',historic:'Историческая / снятая запись',repository:'Репозиторий',module:'Модуль / раздел',site:'Сайт',entry:'Запись',all:'Все',stale:'Инвентарь наблюдался более двух дней назад. Показан снимок, а не запрос в реальном времени.',revision:'Ревизия'}
};
const safeURL=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}};
const localized=(value,lang)=>typeof value==='string'?value:value?.[lang]||value?.de||value?.en||'';
function add(doc,parent,tag,text,className){const el=doc.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;parent.append(el);return el;}
function renderResults(doc,target,results,lang){
 const w=words[lang];target.replaceChildren();
 for(const item of results){
  const url=safeURL(item.url);if(!url)continue;
  const article=add(doc,target,'article',undefined,'network-result');article.dataset.networkId=item.id;
  add(doc,article,'p',`${w[item.kind]||w.entry}${item.historical?' · '+w.historic:''}`,'network-kind');
  const title=add(doc,article,'h3');const link=add(doc,title,'a',localized(item.title,lang));link.href=url;
  add(doc,article,'p',localized(item.summary,lang));
  const details=add(doc,article,'details');add(doc,details,'summary',w.source);
  const sourceURL=safeURL(item.source?.url);if(sourceURL){const source=add(doc,details,'a',item.repositoryId?.replace('repo:','')||w.source);source.href=sourceURL;}
  if(item.source?.revision)add(doc,details,'p',`${w.revision}: ${item.source.revision}`,'network-revision');
  if(item.source?.observedAt)add(doc,details,'p',`${w.observed}: ${item.source.observedAt}`);
 }
}
export function mountNetworkSearch(doc=globalThis.document,data=index){
 const container=doc.querySelector('[data-network-search]');
 if(!container)return null;
 const lang=container.dataset.language||'de',w=words[lang];
 const input=doc.getElementById('network-query'),kind=doc.getElementById('network-kind'),archive=doc.getElementById('network-archive');
 const view=doc.defaultView,params=new URLSearchParams(view.location.search);
 input.value=(params.get('q')||'').slice(0,160);archive.checked=params.get('archive')==='1';
 if(['repository','module','site'].includes(params.get('type')))kind.value=params.get('type');
 if(Date.now()-Date.parse(data.observedAt)>2*86400000)add(doc,container,'p',w.stale,'network-stale');
 function refresh(){
  const query=input.value.trim();const results=searchNetwork(data,query,{includeArchive:archive.checked,kinds:kind.value==='all'?undefined:[kind.value],limit:data.documents.length});
  doc.getElementById('network-count').textContent=`${results.length} ${w.results}`;
  doc.getElementById('network-empty').hidden=results.length!==0;
  renderResults(doc,doc.getElementById('network-results'),results,lang);
  const url=new URL(view.location.href);url.searchParams.delete('q');url.searchParams.delete('type');url.searchParams.delete('archive');
  if(query)url.searchParams.set('q',query);if(kind.value!=='all')url.searchParams.set('type',kind.value);if(archive.checked)url.searchParams.set('archive','1');
  view.history.replaceState(null,'',url);
  return results;
 }
 input.addEventListener('input',refresh);kind.addEventListener('change',refresh);archive.addEventListener('change',refresh);
 doc.getElementById('network-clear').addEventListener('click',()=>{input.value='';kind.value='all';archive.checked=false;refresh();input.focus();});
 refresh();return {refresh};
}
export function mountNetworkBridges(doc=globalThis.document,data=index){
 const mounted=[];
 for(const container of doc.querySelectorAll('[data-network-bridge]')){
  const input=doc.getElementById(container.dataset.inputId);if(!input)continue;
  const lang=container.dataset.language||'de',w=words[lang],link=container.querySelector('[data-network-all]');
  const base=new URL(link.href);
  function refresh(){
   const query=input.value.trim();const results=query?searchNetwork(data,query,{limit:data.documents.length}):[];
   container.querySelector('[data-network-bridge-count]').textContent=query?`${results.length} ${w.results}`:'';
   renderResults(doc,container.querySelector('[data-network-bridge-results]'),results.slice(0,6),lang);
   const url=new URL(base);if(query)url.searchParams.set('q',query);link.href=url.href;
   return results;
  }
  input.addEventListener('input',refresh);
  // The local card filter resets its own field on a button click.
  doc.getElementById('project-clear')?.addEventListener('click',refresh);
  refresh();mounted.push({refresh});
 }
 return mounted;
}
if(typeof document!=='undefined'){mountNetworkSearch(document);mountNetworkBridges(document);}
