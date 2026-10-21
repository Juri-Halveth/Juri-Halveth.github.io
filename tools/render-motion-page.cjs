'use strict';
// Presentation only. Existing MIT-licensed motion player retains its terms.
const words={
 de:{title:'Bewegungsstudie',play:'Pause',reverse:'Rückwärts',time:'Zeit',speed:'Tempo',glow:'Leuchten',loop:'Wiederholen',phase:'Zeitpunkt',caption:'Eigene Komposition, 20 Sekunden.',source:'Quellcode',chapters:['Impuls','Wachsen','Verbinden','Verwandeln','Weiterfließen']},
 en:{title:'Motion study',play:'Pause',reverse:'Reverse',time:'Time',speed:'Speed',glow:'Glow',loop:'Loop',phase:'Phase',caption:'Original composition, 20 seconds.',source:'Source code',chapters:['Pulse','Grow','Connect','Transform','Flow']},
 ru:{title:'Исследование движения',play:'Пауза',reverse:'Назад',time:'Время',speed:'Скорость',glow:'Свечение',loop:'Повторять',phase:'Фаза',caption:'Авторская композиция, 20 секунд.',source:'Исходный код',chapters:['Импульс','Рост','Связь','Преобразование','Поток']}
};
function renderMotion(lang){
 const t=words[lang];if(!t)throw Error('Unsupported motion language');
 return `<section class="shell section"><h1>${t.title}</h1><div class="motion-stage"><canvas id="motion-canvas" width="1280" height="720" role="img" aria-label="${t.title}">${t.title}</canvas><div class="motion-controls"><button id="motion-play" type="button" aria-pressed="true">${t.play}</button><button id="motion-reverse" type="button" aria-pressed="false">${t.reverse}</button><label>${t.time}<input id="motion-time" type="range" min="0" max="20" step="0.01" value="0"></label><output id="motion-clock" for="motion-time">0.00 / 20.00 s</output><label>${t.speed}<select id="motion-speed"><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label><label>${t.glow}<input id="motion-glow" type="range" min="0" max="2" step="0.05" value="1"></label><label><input id="motion-loop" type="checkbox">${t.loop}</label></div><div class="motion-chapters">${[0,3.3,7,11,15].map((time,i)=>`<button data-motion-time="${time}" type="button">${t.chapters[i]}</button>`).join('')}</div></div><p class="motion-caption">${t.phase}: <strong id="motion-phase">${t.chapters[0]}</strong> · ${t.caption}</p><a href="https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/main/motion-player.js">${t.source} ↗</a></section>`;
}
module.exports={renderMotion};
