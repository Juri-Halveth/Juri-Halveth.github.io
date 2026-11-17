/* Presentation-only disclosure and persistent loading feedback. No model writes. */
(()=>{'use strict';
const words={de:{pause:'Pause',continue:'Weiter',start:'Bewegung starten',restart:'Neu starten',record:'Aufnehmen',stop:'Aufnahme stoppen',more:'Mehr',close:'Werkstatt schließen',limit:'Modellgrenze erreicht',error:'Szene konnte nicht geladen werden. Bitte die Seite neu laden; Quellen und Werkzeuge bleiben erreichbar.'},en:{pause:'Pause',continue:'Continue',start:'Start motion',restart:'Restart',record:'Record',stop:'Stop recording',more:'More',close:'Close workshop',limit:'Model limit reached',error:'The scene could not load. Please reload the page; sources and tools remain available.'},ru:{pause:'Пауза',continue:'Продолжить',start:'Запустить движение',restart:'Начать заново',record:'Записать',stop:'Остановить запись',more:'Ещё',close:'Закрыть мастерскую',limit:'Достигнут предел модели',error:'Не удалось загрузить сцену. Обновите страницу; источники и инструменты остаются доступны.'}};
const label=key=>(words[document.documentElement.lang]||words.de)[key]||key;
const setText=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value;};
const panels=[...document.querySelectorAll('[data-motion-scene]')];
for(const panel of panels){
 const toggle=panel.querySelector('[data-workshop-toggle]'),workshop=panel.querySelector('[data-workshop-panel]');if(!toggle||!workshop)continue;
 function disclose(open,restoreFocus=false){workshop.hidden=!open;toggle.setAttribute('aria-expanded',String(open));if(open)workshop.querySelector('h2')?.focus({preventScroll:true});else if(restoreFocus)toggle.focus({preventScroll:true});}
 toggle.addEventListener('click',()=>disclose(workshop.hidden));panel.querySelector('[data-workshop-close]')?.addEventListener('click',()=>disclose(false,true));
 workshop.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();disclose(false,true);}});
}
function updateLabels(){for(const panel of panels){for(const [selector,key]of [['[data-motion-restart]','restart'],['[data-workshop-toggle]','more'],['[data-workshop-close]','close']]){const e=panel.querySelector(selector);setText(e,label(key));}const record=panel.querySelector('[data-motion-record]');if(record)setText(record,label(record.dataset.recording==='true'?'stop':'record'));}}
function failure(){for(const panel of panels){const alert=panel.querySelector('[data-scene-error]');if(alert){alert.hidden=false;setText(alert,label('error'));}panel.dataset.sceneLoadError='true';}}
window.addEventListener('error',event=>{const source=event.target;if(source?.tagName==='SCRIPT'&&/\/(lab|studio|models|material-engine|material-model|material-view|particle-dynamics|reference-physics|fixed-clock|particle-view)\.js(?:\?|$)/.test(source.src||''))failure();else if(event.error&&panels.length)failure();},true);
globalThis.HALVETHMotionUI=Object.freeze({label,failure,updateLabels});
document.addEventListener('halveth-language',()=>{updateLabels();for(const panel of panels)if(panel.dataset.sceneLoadError==='true')setText(panel.querySelector('[data-scene-error]'),label('error'));});
updateLabels();
setTimeout(()=>{if(panels.length&&!globalThis.HALVETHScenes?.length)failure();},1800);
})();
