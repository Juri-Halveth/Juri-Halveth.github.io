/* SPDX-License-Identifier: MIT. Local, controllable canvas playback. */
'use strict';
(() => {
  const M=window.JurisMotion, canvas=document.getElementById('motion-canvas');
  if(!M || !canvas)return;
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  const byId=id=>document.getElementById(id), reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let time=reduced.matches?10:0, playing=!reduced.matches, speed=1, glow=1, last=null, visible=true;
  let requestId=null;
  const play=byId('motion-play'), reverse=byId('motion-reverse'), seek=byId('motion-time'), rate=byId('motion-speed'), light=byId('motion-glow'), loop=byId('motion-loop');
  function labels(){
    const lang=document.documentElement.lang,en=lang==='en',ru=lang==='ru';
    play.textContent=playing?(ru?'Пауза':'Pause'):(ru?'Запуск':en?'Play':'Abspielen');
    play.setAttribute('aria-pressed',String(playing));
    reverse.textContent=speed<0?(ru?'Вперёд':en?'Forward':'Vorwärts'):(ru?'Назад':en?'Reverse':'Rückwärts');
    reverse.setAttribute('aria-pressed',String(speed<0));
    seek.setAttribute('aria-valuetext',time.toFixed(2)+(ru?' секунд':en?' seconds':' Sekunden'));
    byId('motion-clock').textContent=time.toFixed(2)+' / '+M.DURATION.toFixed(2)+' s';
    byId('motion-phase').textContent=M.chapters[M.stateAt(time).chapter][ru?'ru':en?'en':'de'];
  }
  function draw(){
    const r=canvas.getBoundingClientRect(), d=Math.min(devicePixelRatio||1,2), w=Math.max(1,Math.round(r.width*d)), h=Math.max(1,Math.round(r.height*d));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    M.render(ctx,w,h,time,{glow,language:document.documentElement.lang});
    seek.value=String(time);labels();
  }
  function schedule(){if(requestId===null && playing && visible && !document.hidden)requestId=requestAnimationFrame(tick);}
  function tick(now){
    requestId=null;
    if(!playing || !visible || document.hidden){last=null;return;}
    if(last!==null){const n=M.advance(time,Math.min((now-last)/1000,.1),speed,loop.checked);time=n.time;if(n.ended)playing=false;}
    last=now;draw();schedule();
  }
  play.addEventListener('click',()=>{playing=!playing;if(playing&&time===M.DURATION&&speed>0)time=0;if(playing&&time===0&&speed<0)time=M.DURATION;last=null;draw();schedule();});
  reverse.addEventListener('click',()=>{speed=-speed;if(speed<0&&time===0)time=M.DURATION;if(speed>0&&time===M.DURATION)time=0;last=null;draw();schedule();});
  seek.addEventListener('input',()=>{time=Number(seek.value);playing=false;last=null;draw();});
  rate.addEventListener('change',()=>{speed=Math.sign(speed)*Number(rate.value);last=null;draw();schedule();});
  light.addEventListener('input',()=>{glow=Number(light.value);draw();});
  document.querySelectorAll('[data-motion-time]').forEach(b=>b.addEventListener('click',()=>{time=Number(b.dataset.motionTime);playing=false;last=null;draw();}));
  document.addEventListener('visibilitychange',()=>{last=null;schedule();});
  if(typeof IntersectionObserver==='function')new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;last=null;schedule();}).observe(canvas);
  if(typeof ResizeObserver==='function')new ResizeObserver(draw).observe(canvas);
  else window.addEventListener('resize',draw);
  reduced.addEventListener('change',e=>{if(e.matches){playing=false;last=null;draw();}});
  new MutationObserver(()=>draw()).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  draw();schedule();
})();
