/* Restored DE/EN/RU text translations. Sources and coverage are explicit. */
(()=>{'use strict';
const dict=globalThis.HALVETH_TRANSLATION_DATA||{},records=new Map(),skip=new Set(['SCRIPT','STYLE','NOSCRIPT','CANVAS','PRE','CODE','TEXTAREA']);
const scriptURL=document.currentScript?.src||location.href;
let language='de',scheduled=false;
const normal=s=>s.replace(/\s+/g,' ').trim();
function modelReadout(key){
 if(!/^(pair|wave|layers|dimensions|vortex2|vortex3|timeline|sgr|wirbel) · t=/.test(key))return null;
 const transform=(s,lang)=>{const words=lang==='en'?{'Schritte':'steps','Hintergrundpause':'background pause','läuft':'running','pausiert':'paused','Umläufe':'orbits','Rechenrückstand':'backlog','Modellsekunden':'model seconds','Modell, keine Naturmessung':'model, not a measurement of nature'}:{'Schritte':'шагов','Hintergrundpause':'фоновая пауза','läuft':'работает','pausiert':'пауза','Umläufe':'оборотов','Rechenrückstand':'отставание','Modellsekunden':'модельных секунд','Modell, keine Naturmessung':'модель, не измерение природы'};for(const [a,b]of Object.entries(words))s=s.split(a).join(b);return s;};
 return{en:transform(key,'en'),ru:transform(key,'ru')};
}
function collect(){
 for(const node of records.keys())if(!node.isConnected)records.delete(node);
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
 while((node=walker.nextNode())){
  if(records.has(node)||!normal(node.nodeValue))continue;let parent=node.parentElement,exclude=false;
  while(parent){if(skip.has(parent.tagName)||parent.closest?.('#halveth-language')||parent.hasAttribute('data-no-translate')){exclude=true;break;}parent=parent.parentElement;}
  if(exclude)continue;const original=node.nodeValue,key=normal(original);records.set(node,{original,key,translation:dict[key]||modelReadout(key)});
 }
}
function coverage(){let total=0,translated=0;for(const [node,record]of records){if(!node.isConnected)continue;total++;if(record.translation)translated++;}return{language,totalTextUnits:total,translatedTextUnits:translated,untranslatedTextUnits:total-translated,partial:translated<total};}
function apply(lang){
 if(!['de','en','ru'].includes(lang))throw new RangeError('Unknown language');language=lang;collect();
 for(const [node,r]of records){if(!node.isConnected)continue;node.nodeValue=lang==='de'||!r.translation?r.original:r.original.match(/^\s*/)[0]+r.translation[lang]+r.original.match(/\s*$/)[0];}
 document.documentElement.lang=lang;try{localStorage.setItem('raz_lang',lang);}catch{}
 for(const b of document.querySelectorAll('#halveth-language [data-lang]'))b.setAttribute('aria-pressed',String(b.dataset.lang===lang));
 const c=coverage(),label=document.querySelector('#halveth-language-status');if(label)label.textContent=lang==='de'?'Deutsch · Original':(lang==='en'?'English · ':'Русский · ')+(c.partial?(lang==='en'?'partial translation':'частичный перевод'):(lang==='en'?'translated':'переведено'))+` (${c.translatedTextUnits}/${c.totalTextUnits})`;
 document.dispatchEvent(new CustomEvent('halveth-language',{detail:c}));
}
const control=document.createElement('details');control.id='halveth-language';control.setAttribute('data-no-translate','');
const summary=document.createElement('summary');summary.textContent='DE · EN · RU';control.append(summary);
const choices=document.createElement('div');choices.setAttribute('role','group');choices.setAttribute('aria-label','Sprache / Language / Язык');
for(const lang of ['de','en','ru']){const b=document.createElement('button');b.type='button';b.dataset.lang=lang;b.textContent=lang.toUpperCase();b.addEventListener('click',()=>apply(lang));choices.append(b);}control.append(choices);
const status=document.createElement('small');status.id='halveth-language-status';status.setAttribute('aria-live','polite');control.append(status);
const archive=document.createElement('a');archive.textContent='Spracharchiv · Language archive · Архив';
archive.href=new URL(scriptURL.includes('/UPLOAD_JURI_SUBDOMAIN/')?'../../UPLOAD_HALVETH_DE/modules/spracharchiv/index.html':'../modules/spracharchiv/index.html',scriptURL).href;
control.append(archive);document.body.append(control);
const style=document.createElement('style');style.textContent='#halveth-language{position:fixed;z-index:150;right:12px;bottom:12px;max-width:min(300px,calc(100vw - 24px));padding:8px 12px;border:1px solid #667584;border-radius:12px;background:#101b2a;color:#e9f1f5;font:12px/1.5 system-ui;box-shadow:0 4px 18px #0005}#halveth-language summary{cursor:pointer;font-weight:700}#halveth-language div{display:flex;gap:6px;margin-top:8px}#halveth-language button{border:1px solid #657a89;border-radius:7px;background:#1e3144;color:#fff;padding:5px 10px;cursor:pointer}#halveth-language button[aria-pressed=true]{background:#d9b774;color:#101820}#halveth-language small,#halveth-language a{display:block;margin-top:7px}#halveth-language button:focus-visible,#halveth-language summary:focus-visible{outline:3px solid #ffe5a4;outline-offset:2px}';document.head.append(style);
let saved='de';try{saved=localStorage.getItem('raz_lang')||'de';}catch{}apply(['de','en','ru'].includes(saved)?saved:'de');
new MutationObserver(changes=>{if(changes.every(x=>x.target.nodeType===1&&x.target.closest?.('#halveth-language')))return;if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;apply(language);});}).observe(document.body,{childList:true,subtree:true});
globalThis.HALVETHTranslations=Object.freeze({apply,coverage});
})();
