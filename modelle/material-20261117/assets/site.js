/* HALVETH Site v2. No requests. No tracking. */
(()=>{'use strict';
 const menu=document.querySelector('.mobile-nav'),nav=document.getElementById('menu');
 if(menu&&nav)menu.addEventListener('click',()=>{let open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);menu.textContent=open?'✕':'☰';});
 const current=location.pathname.split('/').slice(-1)[0]||'index.html';
 document.querySelectorAll('[data-nav]').forEach(a=>{if(a.getAttribute('data-nav')===current)a.setAttribute('aria-current','page');});
 for(const canvas of document.querySelectorAll('canvas[data-ambient]')){
  const c=canvas.getContext('2d',{alpha:false});if(!c)continue;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand=(()=>{let s=113021;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296;};})();
  const nodes=Array.from({length:42},(_,i)=>({a:rand()*Math.PI*2,r:.09+rand()*.38,s:rand()*.002+.00025,depth:.32+rand()*.68,phase:rand()*6.3}));let t=0,visible=true;
  new IntersectionObserver(e=>visible=e[0].isIntersecting).observe(canvas);
  function paint(){if(!visible)return;const box=canvas.getBoundingClientRect();const d=Math.min(devicePixelRatio||1,1.7),w=canvas.width=Math.max(10,Math.round(box.width*d)),h=canvas.height=Math.max(10,Math.round(box.height*d));
   c.fillStyle='#06101c';c.fillRect(0,0,w,h);const x=w*.52,y=h*.49,scale=Math.min(w,h);
   const g=c.createRadialGradient(x,y,0,x,y,scale*.5);g.addColorStop(0,'#325066');g.addColorStop(.44,'#0b2134');g.addColorStop(1,'#060c18');c.fillStyle=g;c.fillRect(0,0,w,h);
   let loc=nodes.map(n=>({x:x+Math.cos(n.a+t*n.s)*n.r*scale,y:y+Math.sin(n.a+t*n.s*.8)*n.r*scale*.63,depth:n.depth}));
   loc.forEach((a,i)=>{for(let j=i+1;j<loc.length;j++){let b=loc[j],dist=Math.hypot(a.x-b.x,a.y-b.y);if(dist<scale*.18){c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.strokeStyle=`rgba(126,218,221,${.22*(1-dist/(scale*.18))})`;c.lineWidth=.8*d;c.stroke();}}});
   loc.forEach((a,i)=>{const n=nodes[i],r=(1.2+1.7*n.depth)*d;const g=c.createRadialGradient(a.x,a.y,.1,a.x,a.y,r*4);g.addColorStop(0,'rgba(255,237,199,.85)');g.addColorStop(.22,i%4===0?'rgba(238,191,108,.8)':'rgba(118,220,230,.7)');g.addColorStop(1,'rgba(23,84,104,0)');c.fillStyle=g;c.beginPath();c.arc(a.x,a.y,r*4,0,6.283);c.fill();});
  }
  const resize=new ResizeObserver(()=>paint());resize.observe(canvas);
  let last=0;function frame(now){if(!reduced&&document.visibilityState==='visible'&&visible&&now-last>35){t+=1;paint();last=now;}requestAnimationFrame(frame);}paint();requestAnimationFrame(frame);
 }
})();

// Explicit lazy activation of restored source modules.
document.addEventListener("click",event=>{const button=event.target.closest?.("[data-lab-open]");if(!button)return;const frame=document.getElementById(button.dataset.labOpen);if(frame&&!frame.src){frame.src=frame.dataset.src;frame.style.display="block";button.disabled=true;}});
