/* SPDX-License-Identifier: MIT. Autonomous HALVETH landing artwork. */
'use strict';
(() => {
  const M=window.JurisMotion;
  if(!M)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const views=Array.from(document.querySelectorAll('[data-ambient-motion]')).flatMap(canvas=>{
    const ctx=canvas.getContext('2d');
    return ctx?[{canvas,ctx,visible:false,frames:0}]:[];
  });
  if(!views.length)return;
  let request=null,last=null,time=12;
  function draw(view){
    const r=view.canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.5);
    const w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));
    if(view.canvas.width!==w||view.canvas.height!==h){view.canvas.width=w;view.canvas.height=h;}
    M.renderArtwork(view.ctx,w,h,time);
    view.frames++;
    view.canvas.dataset.motionState=reduced.matches?'calm':'running';
    view.canvas.dataset.motionFrames=String(view.frames);
    view.canvas.dataset.motionTime=time.toFixed(3);
    view.canvas.closest('figure').classList.add('motion-active');
  }
  function schedule(){
    if(request===null&&!reduced.matches&&!document.hidden&&views.some(v=>v.visible))request=requestAnimationFrame(tick);
  }
  function tick(now){
    request=null;
    if(reduced.matches||document.hidden||!views.some(v=>v.visible)){last=null;return;}
    if(last===null)last=now;
    const elapsed=(now-last)/1000;
    if(elapsed>=1/30){time+=Math.min(elapsed,.12);last=now;views.filter(v=>v.visible).forEach(draw);}
    schedule();
  }
  if(typeof IntersectionObserver==='function'){
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries){const view=views.find(v=>v.canvas===entry.target);view.visible=entry.isIntersecting;}
      last=null;schedule();
    },{rootMargin:'80px'});
    views.forEach(v=>observer.observe(v.canvas));
  }else views.forEach(v=>{v.visible=true;});
  if(typeof ResizeObserver==='function'){
    const observer=new ResizeObserver(()=>views.forEach(draw));views.forEach(v=>observer.observe(v.canvas));
  }else window.addEventListener('resize',()=>views.forEach(draw));
  document.addEventListener('visibilitychange',()=>{last=null;schedule();});
  reduced.addEventListener('change',()=>{last=null;views.forEach(draw);schedule();});
  views.forEach(draw);schedule();
})();
