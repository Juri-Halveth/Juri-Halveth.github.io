/* HALVETH First-Difference Flight 2.0 · local deterministic illustrated study. */
(()=>{'use strict';
const cv=document.getElementById('studio-field');if(!cv)return;const ctx=cv.getContext('2d',{alpha:false}),TAU=2*Math.PI;
const $=id=>document.getElementById(id),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
let seed=20261117,n=32,clock=0,events=[],seen=new Set(),mode='pair',playing=!matchMedia('(prefers-reduced-motion:reduce)').matches,prev=null,coupling=.25,keys=new Set(),drag=null;
let hasStarted=playing;const motionLabel=key=>globalThis.HALVETHMotionUI?.label(key)||({pause:'Pause',continue:'Weiter',start:'Bewegung starten',limit:'Modellgrenze erreicht'}[key]||key);
let selectedModel='material',view={style:'rods',palette:'rgb',annotations:false,symbolScale:1,zoom:1,yaw:.35,pitch:.55},particleModel=HALVETHModels.create(selectedModel,{seed:20261117});
let camera={x:0,y:0,z:-9,yaw:0,pitch:0},stars=[],sources=[];
function rand(s){return()=>{s=(s+0x6D2B79F5)>>>0;let x=s;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296;};}
function build(){let r=rand(seed);stars=Array.from({length:1800},()=>({x:(r()-.5)*200,y:(r()-.5)*110,z:(r()-.1)*1300,sz:.5+2*r()}));sources=Array.from({length:n},(_,i)=>({id:`SOURCE_${String(i).padStart(3,'0')}`,x:i===0?0:Math.sin(i*.37)*10,y:i===0?0:Math.cos(i*.51)*6,z:i*10,bit:r()<.5?0:1}));}
function projection(obj,w,h){const dx=obj.x-camera.x,dy=obj.y-camera.y,dz=obj.z-camera.z,a=Math.cos(camera.yaw),b=Math.sin(camera.yaw),f=Math.cos(camera.pitch),g=Math.sin(camera.pitch);
 const x=a*dx-b*dz,z=b*dx+a*dz,y=f*dy-g*z,zz=g*dy+f*z;
 if(zz<.15||zz>1500)return null;const focal=h*1.02;return{x:w/2+x*focal/zz,y:h/2-y*focal/zz,d:zz};}
function label(txt,x,y,sz,col){ctx.font=`600 ${sz}px system-ui`;ctx.fillStyle=col;ctx.textAlign='center';ctx.fillText(txt,x,y);}
function glow(x,y,r,col){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#ffffff');g.addColorStop(.09,col);g.addColorStop(.30,col+'89');g.addColorStop(1,col+'00');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
function bg(w,h){let g=ctx.createRadialGradient(w*.54,h*.45,30,w*.54,h*.45,w*.8);g.addColorStop(0,'#10283e');g.addColorStop(.55,'#081422');g.addColorStop(1,'#030812');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}
function pair(w,h){if(selectedModel==='material')HALVETHMaterialView.draw(ctx,particleModel.snapshot({exact:false}),w,h,view);else HALVETHParticleView.draw(ctx,particleModel.snapshot({exact:false}),w,h,view);}
function flight(w,h){for(const s of stars){const p=projection(s,w,h);if(!p||p.x<0||p.x>w||p.y<0||p.y>h)continue;ctx.fillStyle=`rgba(197,217,237,${clamp(1-p.d/900,.09,.55)})`;let z=clamp(s.sz*14/p.d,.55,2.5)*h/850;ctx.fillRect(p.x,p.y,z,z);}
 for(let i=0;i<sources.length;i++){
 const s=sources[i],dist=Math.hypot(camera.x-s.x,camera.y-s.y,camera.z-s.z);const blend=clamp(1-dist/8,0,1);
 const gap=(1.6*(1-blend)+.12);
 for(const [shift,color] of [[-gap,'#68abfb'],[gap,'#eebf7a']]){const p=projection({x:s.x+shift,y:s.y,z:s.z},w,h);if(!p||p.x<0||p.x>w||p.y<0||p.y>h)continue;const r=clamp(300/p.d,4,58)*h/900;glow(p.x,p.y,r,color);}
 const p=projection(s,w,h);if(p&&p.d<100&&p.x>=0&&p.x<=w&&p.y>=0&&p.y<=h){label(s.id+(seen.has(s.id)?` · ${s.bit}`:''),p.x,p.y+clamp(360/p.d,16,55)*h/900,Math.max(11,h*.016),seen.has(s.id)?'#e8c58c':'#b1cadc');}
 }
 const state=particleModel.snapshot({field:false});
 if(selectedModel==='material'){HALVETHMaterialView.draw(ctx,state,w,h,{...view,background:false,project:({x,y,z=0})=>projection({x:x*2,y:y*2,z:70+z},w,h)});}else {
 state.trails.forEach((trail,k)=>{ctx.strokeStyle=k?'#f0c77e':'#81d1f0';ctx.lineWidth=1.5;ctx.beginPath();let pen=false;for(const q of trail){const p=projection({x:q.x*2,y:q.y*2,z:0},w,h);if(!p){pen=false;continue;}if(pen)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);pen=true;}ctx.stroke();});
 state.bodies.forEach((b,i)=>{const p=projection({x:b.x*2,y:b.y*2,z:0},w,h);if(p){glow(p.x,p.y,clamp(180/p.d,5,30),i?'#f0c77e':'#81d1f0');label((i?'+':'−')+' · Modell',p.x,p.y+24,14,i?'#ffe4ab':'#c5eeff');}});
 }
 ctx.strokeStyle='#a7c9d4a6';ctx.beginPath();ctx.moveTo(w/2-9,h/2);ctx.lineTo(w/2+9,h/2);ctx.moveTo(w/2,h/2-9);ctx.lineTo(w/2,h/2+9);ctx.stroke();}
function record(s,why){if(!s||seen.has(s.id))return;seen.add(s.id);events.push({ordinal:events.length+1,source:s.id,value:s.bit,model_time_s:+clock.toFixed(5),reason:why,camera:{...camera}});}
function draw(){const w=cv.width,h=cv.height;bg(w,h);if(mode==='pair')pair(w,h);else flight(w,h);}
function motion(dt){if(mode!=='flight')return;let f=(keys.has('w')?1:0)-(keys.has('s')?1:0),side=(keys.has('d')?1:0)-(keys.has('a')?1:0),up=(keys.has('e')?1:0)-(keys.has('q')?1:0);const speed=keys.has('Shift')?24:8,a=camera.yaw,p=camera.pitch;
 camera.x+=speed*dt*(Math.sin(a)*Math.cos(p)*f+Math.cos(a)*side);camera.y+=speed*dt*(Math.sin(p)*f+up);camera.z+=speed*dt*(Math.cos(a)*Math.cos(p)*f-Math.sin(a)*side);}
// Only explicit simulation/input updates create model events. Drawing is observational.
function updateEvents(){if(mode==='pair'){}
 else for(const s of sources)if(Math.hypot(camera.x-s.x,camera.y-s.y,camera.z-s.z)<.8)record(s,'camera proximity');}
const timing=HALVETHFixedClock.create({stepSeconds:1/120,maxStepsPerFrame:240,onStep:(dt,t)=>{motion(dt);if(particleModel.diagnostics().status==='RUNNING')particleModel.step(dt,selectedModel==='experimental'?{attraction:coupling*100/36,damping:.12,frequency:5}:selectedModel==='material'?{drive:coupling*1.6}:{});clock=particleModel.snapshot({field:false}).time;if(particleModel.diagnostics().status==='MODEL_LIMIT'){playing=false;prev=null;}updateEvents();}});
function showMotionStatus(){const limit=particleModel.diagnostics().status==='MODEL_LIMIT',b=$('studio-pause');b.disabled=limit;const text=motionLabel(playing?'pause':hasStarted?'continue':'start');if(b.textContent!==text)b.textContent=text;const label=document.querySelector('[data-motion-status]');if(label)label.textContent=`Simulation · ${selectedModel} · t=${clock.toFixed(2)} s · ${limit?motionLabel('limit'):playing?'läuft':'pausiert'} · ${events.length} Ereignisse`; }
function setPlaying(value){if(value&&particleModel.diagnostics().status==='MODEL_LIMIT')return;playing=value;if(value)hasStarted=true;prev=null;showMotionStatus();}
function frame(now){if(playing&&!document.hidden){if(prev!==null)timing.advance(Math.max(0,(now-prev)/1000));prev=now;}else prev=null;
 clock=particleModel.snapshot({field:false}).time;draw();const debt=timing.snapshot().backlogSeconds;
 $('studio-readout').textContent=`t=${clock.toFixed(2)} s · ${seen.size} Ereignisse · ${n} Quellen · Seed ${seed}`+(debt>=1/120?` · Rückstand ${debt.toFixed(2)} s`:'');showMotionStatus();requestAnimationFrame(frame);}
function reset(){particleModel.reset();timing.reset();clock=0;events=[];seen=new Set();coupling=+($('studio-coupling').value||25)/100;camera={x:0,y:0,z:-9,yaw:0,pitch:0};keys.clear();prev=null;build();draw();}
function resize(){const b=cv.getBoundingClientRect();const d=Math.min(1.8,devicePixelRatio||1,Math.sqrt(2100000/(b.width*b.height||1)));cv.width=Math.max(1,Math.floor(b.width*d));cv.height=Math.max(1,Math.floor(b.height*d));draw();}
function download(blob,name){if(!blob)return;const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);}
$('studio-coupling').addEventListener('input',e=>{coupling=+e.target.value/100;updateEvents();draw();});$('studio-count').addEventListener('change',e=>{n=+e.target.value;reset();});
for(const b of document.querySelectorAll('[data-studio]'))b.addEventListener('click',()=>{mode=b.dataset.studio;document.querySelectorAll('[data-studio]').forEach(k=>k.classList.toggle('active',k===b));$('studio-mode-label').textContent=mode==='pair'?'MODELLANSICHT':'FREIER FLUG';draw();});
$('studio-pause').addEventListener('click',()=>{setPlaying(!playing);});$('studio-reset').addEventListener('click',()=>{reset();setPlaying(hasStarted);});
$('studio-png').addEventListener('click',()=>{const w=cv.width,h=cv.height;cv.width=3840;cv.height=2160;draw();cv.toBlob(b=>{download(b,'HALVETH_FIRST_DIFFERENCE_4K.png');cv.width=w;cv.height=h;draw();},'image/png');});
$('studio-json').addEventListener('click',()=>download(new Blob([JSON.stringify({schema:'halveth.study/2.0',build:globalThis.HALVETH_BUILD,model:'illustration; no natural event measurements',seed,clock,mode,coupling,camera,sources,events,modelType:selectedModel,view:{...view},particles:particleModel.snapshot(),timing:timing.snapshot()},null,2)],{type:'application/json'}),'HALVETH_MODEL_EVENTS.json'));
cv.addEventListener('pointerdown',e=>{if(mode!=='flight')return;drag={x:e.clientX,y:e.clientY,id:e.pointerId};cv.setPointerCapture(e.pointerId);cv.focus();});
cv.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;camera.yaw-=(e.clientX-drag.x)*.004;camera.pitch=clamp(camera.pitch+(e.clientY-drag.y)*.004,-1.45,1.45);drag.x=e.clientX;drag.y=e.clientY;});for(const k of ['pointerup','pointercancel','lostpointercapture'])cv.addEventListener(k,()=>drag=null);
window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','BUTTON','SELECT'].includes(e.target.tagName))return;const key=e.key.length===1?e.key.toLowerCase():e.key;if('wsadqe'.includes(key)||key==='Shift'){keys.add(key);e.preventDefault();}if(key==='p'&&!e.repeat){setPlaying(!playing);}if(key==='x')keys.clear();});window.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));window.addEventListener('blur',()=>keys.clear());document.addEventListener('visibilitychange',()=>{keys.clear();prev=null;});
$('studio-model')?.addEventListener('change',e=>{selectedModel=e.target.value;view.style=selectedModel==='material'?'rods':'sharp';if($('studio-style'))$('studio-style').value=view.style;particleModel=HALVETHModels.create(selectedModel,{seed:20261117});timing.reset();clock=0;prev=null;draw();});
$('studio-style')?.addEventListener('change',e=>{view.style=e.target.value;draw();});
for(const [id,key,convert]of [['studio-zoom','zoom',Number],['studio-symbol-size','symbolScale',Number],['studio-material-palette','palette',String]])$(id)?.addEventListener('input',e=>{view[key]=convert(e.target.value);draw();});
$('studio-annotations')?.addEventListener('change',e=>{view.annotations=e.target.checked;draw();});
$('studio-fullscreen')?.addEventListener('click',()=>cv.parentElement.requestFullscreen?.());
$('studio-movie')?.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('halveth-record-scene',{detail:{canvas:cv,scene:()=>({clock,mode,camera:{...camera},particles:particleModel.snapshot()}),draw}})));
(globalThis.HALVETHScenes||(globalThis.HALVETHScenes=[])).push({canvas:cv,mode:'studio',snapshot:()=>({clock,mode,camera:{...camera},events:structuredClone(events),particles:particleModel.snapshot()}),draw,reset,useModel:name=>{if(!HALVETHModels.modes.includes(name))throw new RangeError('Unknown model');selectedModel=name;particleModel=HALVETHModels.create(name,{seed:20261117});reset();},setView:x=>{Object.assign(view,x);draw();},advance:seconds=>timing.advance(seconds),pause:()=>setPlaying(false),resume:()=>setPlaying(true)});
let lastLanguage=document.documentElement.lang;document.addEventListener('halveth-language',()=>{if(document.documentElement.lang!==lastLanguage){lastLanguage=document.documentElement.lang;showMotionStatus();}});
new ResizeObserver(resize).observe(cv);reset();showMotionStatus();requestAnimationFrame(frame);
})();
