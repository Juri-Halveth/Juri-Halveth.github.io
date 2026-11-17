/* HALVETH First-Difference Flight 2.0 · local deterministic illustrated study. */
(()=>{'use strict';
const cv=document.getElementById('studio-field');if(!cv)return;const ctx=cv.getContext('2d',{alpha:false}),TAU=2*Math.PI;
const $=id=>document.getElementById(id),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
let seed=20261117,n=32,clock=0,events=[],seen=new Set(),mode='pair',playing=!matchMedia('(prefers-reduced-motion:reduce)').matches,prev=null,coupling=.25,keys=new Set(),drag=null;
let hasStarted=playing;const motionLabel=key=>globalThis.HALVETHMotionUI?.label(key)||({pause:'Pause',continue:'Weiter',start:'Bewegung starten',limit:'Modellgrenze erreicht'}[key]||key);
const spatial=globalThis.HALVETHDoubleEight, spatialView=globalThis.HALVETHDoubleEightView;
const approach=spatialView?.approach();
let spatialConfig=spatial?.entryConfiguration()??{coupling:1};
let selectedModel=spatial?.requested()?'doppelacht':'material',view={style:'rods',palette:'rgb',annotations:false,symbolScale:1,zoom:1,yaw:.35,pitch:.55},particleModel=selectedModel==='doppelacht'?spatial.create(spatialConfig):HALVETHModels.create(selectedModel,{seed:20261117});
function spatialStyle(){approach.begin(view,spatialConfig);Object.assign(view,spatialView.presets.oblique,{style:'rods',palette:'bluegold',followId:null});}
if(selectedModel==='doppelacht')spatialStyle();
const spatialTools=spatialView?.controls(document.querySelector('[data-d8-controls]'),{
  layout:name=>{const {layout,...rest}=spatialConfig;spatialConfig=name==='shell'?{...rest,layout:'shell'}:rest;useModel('doppelacht');},
  distance:setDistance,
  coupling:value=>{spatialConfig={...spatialConfig,coupling:value};useModel('doppelacht');},
  camera:key=>{approach.stop();Object.assign(view,spatialView.presets[key]);if(mode==='flight')orbitFlight();draw();},
  follow:id=>{view.followId=id;if(mode==='flight')orbitFlight();draw();}
});
function setDistance(d){approach.stop();view.distance=d;spatialTools?.meter(d);if(mode==='flight')orbitFlight();draw();}
spatialView?.distanceControls(cv,{active:()=>selectedModel==='doppelacht'&&spatialConfig.layout==='shell'&&mode==='pair',
  read:()=>view.distance,set:setDistance,rotate:(dx,dy)=>{approach.stop();view.yaw+=dx*.008;view.pitch=clamp(view.pitch+dy*.008,-Math.PI/2,Math.PI/2);spatialTools.manual();draw();},
  tap:()=>{if(view.distance>4*spatialView.overviewDistance)setDistance(spatialView.overviewDistance);}
});
function syncSpatial(){spatialTools?.sync(selectedModel==='doppelacht',spatialConfig.coupling,view.followId,spatialConfig.count??960,view);
  if($('studio-model'))$('studio-model').value=selectedModel;if($('studio-material-palette'))$('studio-material-palette').value=view.palette;}
function orbitFlight(){const p=particleModel.frame().materialCells.find(c=>c.id===view.followId);
  const center={x:p?2*p.x:0,y:p?2*p.y:0,z:70+(p?2*p.z:0)},d=Number.isFinite(view.distance)?2*view.distance:23,cp=Math.cos(view.pitch);
  camera={x:center.x-d*Math.sin(view.yaw)*cp,y:center.y-d*Math.sin(view.pitch),z:center.z-d*Math.cos(view.yaw)*cp,yaw:view.yaw,pitch:view.pitch};}

let archivedRuns=[],runSerial=0,modelRunId='';
let camera={x:0,y:0,z:-9,yaw:0,pitch:0},stars=[],sources=[];
function rand(s){return()=>{s=(s+0x6D2B79F5)>>>0;let x=s;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296;};}
function build(){let r=rand(seed);stars=Array.from({length:1800},()=>({x:(r()-.5)*200,y:(r()-.5)*110,z:(r()-.1)*1300,sz:.5+2*r()}));sources=Array.from({length:n},(_,i)=>({id:`SOURCE_${String(i).padStart(3,'0')}`,x:i===0?0:Math.sin(i*.37)*10,y:i===0?0:Math.cos(i*.51)*6,z:i*10,bit:r()<.5?0:1}));}
function projection(obj,w,h){const dx=obj.x-camera.x,dy=obj.y-camera.y,dz=obj.z-camera.z,a=Math.cos(camera.yaw),b=Math.sin(camera.yaw),f=Math.cos(camera.pitch),g=Math.sin(camera.pitch);
 const x=a*dx-b*dz,z=b*dx+a*dz,y=f*dy-g*z,zz=g*dy+f*z;
 if(zz<.15||zz>(selectedModel==='doppelacht'&&spatialConfig.layout==='shell'?20000:1500))return null;const focal=h*1.02;return{x:w/2+x*focal/zz,y:h/2-y*focal/zz,d:zz};}
function label(txt,x,y,sz,col){ctx.font=`600 ${sz}px system-ui`;ctx.fillStyle=col;ctx.textAlign='center';ctx.fillText(txt,x,y);}
function glow(x,y,r,col){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#ffffff');g.addColorStop(.09,col);g.addColorStop(.30,col+'89');g.addColorStop(1,col+'00');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
function bg(w,h){let g=ctx.createRadialGradient(w*.54,h*.45,30,w*.54,h*.45,w*.8);g.addColorStop(0,'#10283e');g.addColorStop(.55,'#081422');g.addColorStop(1,'#030812');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}
function pair(w,h){if(selectedModel==='doppelacht'){spatialView.draw(ctx,particleModel.frame(),view,w,h);return;}if(selectedModel==='material')HALVETHMaterialView.draw(ctx,particleModel.snapshot({exact:false}),w,h,view);else HALVETHParticleView.draw(ctx,particleModel.snapshot({exact:false}),w,h,view);}
function flight(w,h){for(const s of stars){const p=projection(s,w,h);if(!p||p.x<0||p.x>w||p.y<0||p.y>h)continue;ctx.fillStyle=`rgba(197,217,237,${clamp(1-p.d/900,.09,.55)})`;let z=clamp(s.sz*14/p.d,.55,2.5)*h/850;ctx.fillRect(p.x,p.y,z,z);}
 for(let i=0;i<sources.length;i++){
 const s=sources[i],dist=Math.hypot(camera.x-s.x,camera.y-s.y,camera.z-s.z);const blend=clamp(1-dist/8,0,1);
 const gap=(1.6*(1-blend)+.12);
 for(const [shift,color] of [[-gap,'#68abfb'],[gap,'#eebf7a']]){const p=projection({x:s.x+shift,y:s.y,z:s.z},w,h);if(!p||p.x<0||p.x>w||p.y<0||p.y>h)continue;const r=clamp(300/p.d,4,58)*h/900;glow(p.x,p.y,r,color);}
 const p=projection(s,w,h);if(p&&p.d<100&&p.x>=0&&p.x<=w&&p.y>=0&&p.y<=h){label(s.id+(seen.has(s.id)?` · ${s.bit}`:''),p.x,p.y+clamp(360/p.d,16,55)*h/900,Math.max(11,h*.016),seen.has(s.id)?'#e8c58c':'#b1cadc');}
 }
 const state=particleModel.snapshot({field:false});
 if(selectedModel==='doppelacht'){
   spatialView.draw(ctx,state,{...view,background:false,project:p=>projection({x:2*p.x,y:2*p.y,z:70+2*p.z},w,h)},w,h);
 }else if(selectedModel==='material'){HALVETHMaterialView.draw(ctx,state,w,h,{...view,background:false,project:({x,y,z=0})=>projection({x:x*2,y:y*2,z:70+z},w,h)});}else {
 state.trails.forEach((trail,k)=>{ctx.strokeStyle=k?'#f0c77e':'#81d1f0';ctx.lineWidth=1.5;ctx.beginPath();let pen=false;for(const q of trail){const p=projection({x:q.x*2,y:q.y*2,z:0},w,h);if(!p){pen=false;continue;}if(pen)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);pen=true;}ctx.stroke();});
 state.bodies.forEach((b,i)=>{const p=projection({x:b.x*2,y:b.y*2,z:0},w,h);if(p){glow(p.x,p.y,clamp(180/p.d,5,30),i?'#f0c77e':'#81d1f0');label((i?'+':'−')+' · Modell',p.x,p.y+24,14,i?'#ffe4ab':'#c5eeff');}});
 }
 ctx.strokeStyle='#a7c9d4a6';ctx.beginPath();ctx.moveTo(w/2-9,h/2);ctx.lineTo(w/2+9,h/2);ctx.moveTo(w/2,h/2-9);ctx.lineTo(w/2,h/2+9);ctx.stroke();}
function record(s,why){if(!s||seen.has(s.id))return;seen.add(s.id);events.push({modelRunId,modelType:selectedModel,ordinal:events.length+1,source:s.id,value:s.bit,model_time_s:+clock.toFixed(5),reason:why,camera:{...camera}});}
function draw(){const w=cv.width,h=cv.height;bg(w,h);if(mode==='pair')pair(w,h);else flight(w,h);}
function motion(dt){if(mode!=='flight')return;if(selectedModel==='doppelacht'&&view.followId){orbitFlight();return;}let f=(keys.has('w')?1:0)-(keys.has('s')?1:0),side=(keys.has('d')?1:0)-(keys.has('a')?1:0),up=(keys.has('e')?1:0)-(keys.has('q')?1:0);const speed=keys.has('Shift')?24:8,a=camera.yaw,p=camera.pitch;
 camera.x+=speed*dt*(Math.sin(a)*Math.cos(p)*f+Math.cos(a)*side);camera.y+=speed*dt*(Math.sin(p)*f+up);camera.z+=speed*dt*(Math.cos(a)*Math.cos(p)*f-Math.sin(a)*side);}
// Only explicit simulation/input updates create model events. Drawing is observational.
function updateEvents(){if(mode==='pair'){}
 else for(const s of sources)if(Math.hypot(camera.x-s.x,camera.y-s.y,camera.z-s.z)<.8)record(s,'camera proximity');}
const timing=HALVETHFixedClock.create({stepSeconds:1/120,maxStepsPerFrame:240,onStep:(dt,t)=>{motion(dt);if(selectedModel==='doppelacht'||particleModel.diagnostics().status==='RUNNING')particleModel.step(dt,selectedModel==='experimental'?{attraction:coupling*100/36,damping:.12,frequency:5}:selectedModel==='material'?{drive:coupling*1.6}:{});clock=selectedModel==='doppelacht'?particleModel.time:particleModel.snapshot({field:false}).time;if(particleModel.diagnostics().status==='MODEL_LIMIT'){playing=false;prev=null;}updateEvents();}});
function showMotionStatus(){const limit=particleModel.diagnostics().status==='MODEL_LIMIT',b=$('studio-pause');b.disabled=limit;const text=motionLabel(playing?'pause':hasStarted?'continue':'start');if(b.textContent!==text)b.textContent=text;const label=document.querySelector('[data-motion-status]');if(label)label.textContent=`Simulation · ${selectedModel} · t=${clock.toFixed(2)} s · ${limit?motionLabel('limit'):playing?'läuft':'pausiert'} · ${events.length} Ereignisse`; }
function setPlaying(value){if(value&&particleModel.diagnostics().status==='MODEL_LIMIT')return;playing=value;if(value)hasStarted=true;prev=null;showMotionStatus();}
function frame(now){if(playing&&!document.hidden){if(prev!==null){const elapsed=Math.max(0,(now-prev)/1000);
 if(selectedModel==='doppelacht'&&mode==='pair'&&approach.update(view,elapsed))spatialTools?.meter(view.distance);
 timing.advance(elapsed*(selectedModel==='doppelacht'&&spatialConfig.layout==='shell'?spatialView.presentationRate:1));}prev=now;}else prev=null;
 clock=selectedModel==='doppelacht'?particleModel.time:particleModel.snapshot({field:false}).time;draw();const debt=timing.snapshot().backlogSeconds;
 $('studio-readout').textContent=`t=${clock.toFixed(2)} s · ${seen.size} Ereignisse · ${n} Quellen · Seed ${seed}`+(debt>=1/120?` · Rückstand ${debt.toFixed(2)} s`:'');showMotionStatus();requestAnimationFrame(frame);}
function closeFlightRun(reason){
 if(events.length)archivedRuns.push({kind:'FLIGHT_EVENT_ARCHIVE_NOT_SOLVER_REPLAY',modelRunId,modelType:selectedModel,reason,modelTime:clock,seed,sourceCount:sources.length,camera:{...camera},events:structuredClone(events),seen:[...seen]});
 modelRunId='STUDIO_RUN_'+String(++runSerial).padStart(6,'0');events=[];seen=new Set();
}
function useModel(name){
 if(name!=='doppelacht'&&!HALVETHModels.modes.includes(name))throw new RangeError('Unknown model');
 const next=name==='doppelacht'?spatial.create(spatialConfig):HALVETHModels.create(name,{seed:20261117});closeFlightRun('model-change');selectedModel=name;particleModel=next;
 view.style=name==='material'?'rods':'sharp';if(name==='doppelacht'){spatialStyle();if(mode==='flight')orbitFlight();}syncSpatial();if($('studio-style'))$('studio-style').value=view.style;if($('studio-model'))$('studio-model').value=name;
 timing.reset();clock=0;prev=null;draw();showMotionStatus();
}
function reset(){if(selectedModel==='doppelacht')spatialStyle();else delete view.distance;closeFlightRun('restart');particleModel.reset();timing.reset();clock=0;events=[];seen=new Set();coupling=+($('studio-coupling').value||25)/100;camera={x:0,y:0,z:-9,yaw:0,pitch:0};keys.clear();prev=null;if(selectedModel==='doppelacht'&&mode==='flight')orbitFlight();syncSpatial();build();draw();}
function resize(){const b=cv.getBoundingClientRect();const d=Math.min(1.8,devicePixelRatio||1,Math.sqrt(2100000/(b.width*b.height||1)));cv.width=Math.max(1,Math.floor(b.width*d));cv.height=Math.max(1,Math.floor(b.height*d));draw();}
function download(blob,name){if(!blob)return;const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);}
$('studio-coupling').addEventListener('input',e=>{coupling=+e.target.value/100;draw();});$('studio-count').addEventListener('change',e=>{n=+e.target.value;reset();});
for(const b of document.querySelectorAll('[data-studio]'))b.addEventListener('click',()=>{mode=b.dataset.studio;if(mode==='flight'&&spatialConfig.layout==='shell'&&selectedModel==='doppelacht'){approach.stop();view.distance=spatialView.overviewDistance;spatialTools.meter(view.distance);}if(mode==='flight'&&selectedModel==='doppelacht')orbitFlight();document.querySelectorAll('[data-studio]').forEach(k=>k.classList.toggle('active',k===b));$('studio-mode-label').textContent=mode==='pair'?'MODELLANSICHT':'FREIER FLUG';draw();});
$('studio-pause').addEventListener('click',()=>{setPlaying(!playing);});$('studio-reset').addEventListener('click',()=>{reset();setPlaying(hasStarted);});
$('studio-png').addEventListener('click',()=>{const w=cv.width,h=cv.height;cv.width=3840;cv.height=2160;draw();cv.toBlob(b=>{download(b,'HALVETH_FIRST_DIFFERENCE_4K.png');cv.width=w;cv.height=h;draw();},'image/png');});
$('studio-json').addEventListener('click',()=>download(new Blob([JSON.stringify({schema:'halveth.study/2.0',build:globalThis.HALVETH_BUILD,model:'illustration; no natural event measurements',seed,clock,mode,coupling,camera,sources,events,modelType:selectedModel,modelRunId,archivedRuns:structuredClone(archivedRuns),view:{...view},particles:particleModel.snapshot(),timing:timing.snapshot()},null,2)],{type:'application/json'}),'HALVETH_MODEL_EVENTS.json'));
cv.addEventListener('pointerdown',e=>{if(mode!=='flight'&&selectedModel!=='doppelacht')return;drag={x:e.clientX,y:e.clientY,id:e.pointerId};cv.setPointerCapture(e.pointerId);cv.focus();});
cv.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;if(selectedModel==='doppelacht'&&mode==='pair'){
  view.yaw+=(e.clientX-drag.x)*.008;view.pitch=clamp(view.pitch+(e.clientY-drag.y)*.008,-Math.PI/2,Math.PI/2);
  spatialTools.manual();drag.x=e.clientX;drag.y=e.clientY;draw();return;
 }camera.yaw-=(e.clientX-drag.x)*.004;camera.pitch=clamp(camera.pitch+(e.clientY-drag.y)*.004,-1.45,1.45);drag.x=e.clientX;drag.y=e.clientY;});for(const k of ['pointerup','pointercancel','lostpointercapture'])cv.addEventListener(k,()=>drag=null);
window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','BUTTON','SELECT'].includes(e.target.tagName))return;const key=e.key.length===1?e.key.toLowerCase():e.key;if('wsadqe'.includes(key)||key==='Shift'){keys.add(key);e.preventDefault();}if(key==='p'&&!e.repeat){setPlaying(!playing);}if(key==='x')keys.clear();});window.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));window.addEventListener('blur',()=>keys.clear());document.addEventListener('visibilitychange',()=>{keys.clear();prev=null;});
$('studio-model')?.addEventListener('change',e=>useModel(e.target.value));
$('studio-style')?.addEventListener('change',e=>{view.style=e.target.value;draw();});
for(const [id,key,convert]of [['studio-zoom','zoom',Number],['studio-symbol-size','symbolScale',Number],['studio-material-palette','palette',String]])$(id)?.addEventListener('input',e=>{view[key]=convert(e.target.value);draw();});
$('studio-annotations')?.addEventListener('change',e=>{view.annotations=e.target.checked;draw();});
$('studio-fullscreen')?.addEventListener('click',()=>cv.parentElement.requestFullscreen?.());
$('studio-movie')?.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('halveth-record-scene',{detail:{canvas:cv,scene:()=>({clock,mode,camera:{...camera},particles:particleModel.snapshot()}),draw}})));
(globalThis.HALVETHScenes||(globalThis.HALVETHScenes=[])).push({canvas:cv,mode:'studio',snapshot:()=>({clock,mode,camera:{...camera},events:structuredClone(events),modelRunId,archivedRuns:structuredClone(archivedRuns),particles:particleModel.snapshot()}),draw,reset,useModel,setView:x=>{Object.assign(view,x);draw();},advance:seconds=>timing.advance(seconds),pause:()=>setPlaying(false),resume:()=>setPlaying(true)});
let lastLanguage=document.documentElement.lang;document.addEventListener('halveth-language',()=>{if(document.documentElement.lang!==lastLanguage){lastLanguage=document.documentElement.lang;showMotionStatus();}});
document.querySelector('[data-d8-import]')?.addEventListener('change',async event=>{
 const input=event.target;try{
   const file=input.files[0];if(!file)return;if(file.size>5e6)throw Error('Datei zu groß');
   const doc=JSON.parse(await file.text()),packet=spatial.packetFrom(doc);if(!packet)throw Error('Doppelacht-Zustand erwartet');
   const next=spatial.create(packet.configuration);next.restore(packet);
   closeFlightRun('material-import');playing=false;prev=null;selectedModel='doppelacht';particleModel=next;
   spatialConfig={...packet.configuration};clock=next.time;timing.reset();spatialStyle();approach.stop();
   if(spatialConfig.layout==='shell')view.distance=spatialView.overviewDistance;
   if(doc.schema==='halveth.study/2.0'&&doc.view&&spatialConfig.layout==='shell'&&spatialView.validDistance(doc.view.distance)){
     view.distance=doc.view.distance;if(Number.isFinite(doc.view.yaw)&&Number.isFinite(doc.view.pitch)){view.yaw=doc.view.yaw;view.pitch=doc.view.pitch;}
   }syncSpatial();
   if(mode==='flight')orbitFlight();draw();showMotionStatus();input.setCustomValidity('');
 }catch(e){input.setCustomValidity(e.message);input.reportValidity();}finally{input.value='';}
});
new ResizeObserver(resize).observe(cv);reset();showMotionStatus();requestAnimationFrame(frame);
})();
