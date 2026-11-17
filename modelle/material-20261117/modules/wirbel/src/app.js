'use strict';
(()=>{
const E=window.Wirbel,$=id=>document.getElementById(id),canvas=$('space'),ctx=canvas.getContext('2d'),chart=$('chart'),gc=chart.getContext('2d');
if(!ctx||!gc){$('error').textContent='Canvas 2D nicht verfügbar';return;}
let state,ts,history=[],trails=[],bodyTrails=[],running=false,accum=0,last=null,rate=1,exposure=1;
let width=800,height=640,dpr=1,yaw=.15,pitch=.5,zoom=1.25,drag=null,dirty=true,frames=0;
const colors=['#8be6d1','#aabaff','#ffc88c','#f1a8d1','#d3ed9b','#a4d8ff','#ddc3fd','#ffad9e'];
const random=E.rng(907);const stars=Array.from({length:240},()=>({x:random(),y:random(),r:.3+random()*1.1,a:.1+.4*random()}));
function form(c){for(const k of ['n','seed','spin','damping','cooling','drive'])$(k).value=c[k];labels();$('pending').textContent='';}
function labels(){for(const k of ['spin','damping','cooling','drive'])$(k+'V').textContent=Number($(k).value).toFixed(k==='drive'?3:2);}
function reset(c){state=E.create(c);ts=E.tracers(state.config,300);trails=ts.map(()=>[]);bodyTrails=state.bodies.map(()=>[]);history=[];accum=0;last=null;running=false;dirty=true;update();$('error').textContent='';$('pending').textContent='';$('seedInfo').textContent='Seed '+state.config.seed+' · Δt = 1/480 · '+E.VERSION;capture();}
function getConfig(){return{...E.PRESETS[$('preset').value],...Object.fromEntries(['n','seed','spin','damping','cooling','drive'].map(k=>[k,Number($(k).value)]))};}
function update(){const m=E.metrics(state);$('play').textContent=running?'Ⅱ Pause':'▶ Start';$('state').textContent=running?'LÄUFT':'PAUSE';$('time').textContent='t = '+state.t.toFixed(3)+' · Schritt '+state.step;
 for(const k of ['kinetic','heat','radiated','work'])$(k).textContent=m[k].toFixed(4);
 $('residual').textContent=(100*m.relativeError).toFixed(4)+' %';$('quality').textContent=m.relativeError>.005?'WARNUNG: grobe Numerik':'Numerische Kontrolle';if(accum>=state.config.dt)$('quality').textContent+=' · Rückstand '+accum.toFixed(3)+' Modellsekunden';
 $('records').textContent='Replay enthält '+state.step+' feste Schritte und den Ausgangs-Seed.';
 const a=state.events.at(-1);$('encounter').textContent=a?`${state.events.length} protokollierte Begegnungen (max. 100). Zuletzt ${a.pair}, Abstand ${a.distance.toFixed(3)}. Keine Verschmelzung simuliert.`:'Noch keine enge Begegnung.';
}
function capture(){for(let i=0;i<ts.length;i++){trails[i].push([ts[i].x,ts[i].y,ts[i].z]);if(trails[i].length>65)trails[i].shift();}
 for(let i=0;i<state.bodies.length;i++){const b=state.bodies[i];bodyTrails[i].push([b.x,b.y,b.z]);if(bodyTrails[i].length>220)bodyTrails[i].shift();}
 history.push(E.metrics(state));if(history.length>600)history.shift();
}
function ticks(n){for(let k=0;k<n;k++){const before=state.bodies.map(b=>({...b}));E.step(state);E.tracerStep(ts,before,state.bodies,state.config,state.config.dt);
 if(state.step%8===0)capture();}dirty=true;}
function resize(){const r=canvas.parentElement.getBoundingClientRect();width=r.width;height=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);const q=chart.getBoundingClientRect();chart.width=Math.round(q.width*dpr);chart.height=Math.round(q.height*dpr);gc.setTransform(dpr,0,0,dpr,0,0);dirty=true;}
function project(x,y,z){const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);const a=cy*x-sy*y,b=sy*x+cy*y,v=cp*b-sp*z,depth=sp*b+cp*z,dist=17-depth;
 if(dist<.3)return null;const s=Math.min(width,height)*1.25*zoom/dist;return{x:width*.5+a*s,y:height*.5-v*s,scale:s,depth};}
function line(points,color,alpha,lw){ctx.strokeStyle=color;ctx.globalAlpha=alpha;ctx.lineWidth=lw;ctx.beginPath();let pen=false;for(const v of points){const p=project(...v);if(!p){pen=false;continue;}if(!pen){ctx.moveTo(p.x,p.y);pen=true;}else ctx.lineTo(p.x,p.y);}ctx.stroke();}
function draw(){ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle='#030812';ctx.fillRect(0,0,width,height);
 for(const s of stars){ctx.globalAlpha=s.a;ctx.fillStyle='#bfd5ea';ctx.beginPath();ctx.arc(s.x*width,s.y*height,s.r,0,Math.PI*2);ctx.fill();}
 ctx.globalAlpha=1;for(const r of [2,4,6]){const ps=[];for(let i=0;i<=100;i++){const a=2*Math.PI*i/100;ps.push([r*Math.cos(a),r*Math.sin(a),0]);}line(ps,'#355273',.23,.7);}
 line([[-7,0,0],[7,0,0]],'#365678',.2,.6);line([[0,-7,0],[0,7,0]],'#365678',.2,.6);
 ctx.globalCompositeOperation='lighter';
 for(let i=0;i<ts.length;i++){line(trails[i],colors[i%state.bodies.length],.25*exposure,.85);const p=project(ts[i].x,ts[i].y,ts[i].z);if(p){ctx.globalAlpha=.4;ctx.fillStyle=colors[i%state.bodies.length];ctx.fillRect(p.x,p.y,1.1,1.1);}}
 for(let i=0;i<bodyTrails.length;i++)line(bodyTrails[i],colors[i],.5,1.35);
 const bs=state.bodies.map((b,i)=>({b,i,p:project(b.x,b.y,b.z)})).filter(a=>a.p).sort((a,b)=>a.p.depth-b.p.depth);
 for(const {b,i,p} of bs){const power=state.config.cooling*b.u,temp=b.u/b.m,hot=1-Math.exp(-12*temp),lum=1-Math.exp(-120*power*exposure),r=Math.max(4,Math.min(18,p.scale*.09));
  if(lum>1e-7){const radius=r*(4+12*Math.sqrt(lum)),grad=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,radius);grad.addColorStop(0,`rgba(255,245,218,${lum})`);grad.addColorStop(.15,`rgba(255,${Math.round(100+120*hot)},70,${lum*.65})`);grad.addColorStop(.52,`rgba(238,90,45,${lum*.12})`);grad.addColorStop(1,'rgba(0,0,0,0)');ctx.globalAlpha=1;ctx.fillStyle=grad;ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fill();}
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.fillStyle=lum>.01?`rgba(255,${Math.round(135+110*lum)},${Math.round(75+150*lum)},${.25+.75*lum})`:'#05101b';ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle=colors[i];ctx.lineWidth=1.4;ctx.stroke();ctx.fillStyle=colors[i];ctx.beginPath();ctx.arc(p.x,p.y,1.6,0,Math.PI*2);ctx.fill();
  ctx.font='12px ui-monospace, monospace';ctx.fillStyle=colors[i];ctx.fillText(b.id,p.x+r+7,p.y-4);ctx.font='10px ui-monospace, monospace';ctx.fillStyle='#a9bdcf';ctx.fillText('Q/m '+temp.toFixed(3),p.x+r+7,p.y+11);ctx.globalCompositeOperation='lighter';}
 ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
 drawChart();frames++;$('renderStatus').textContent=`Ansicht ${canvas.width}×${canvas.height} · scharfe Vektor-/Punktzeichnung`;
}
function drawChart(){const w=chart.width/dpr,h=chart.height/dpr;gc.clearRect(0,0,w,h);if(history.length<2)return;let max=.05,min=0;for(const m of history){max=Math.max(max,m.kinetic,m.heat,m.radiated,m.work);min=Math.min(min,m.work);}
 gc.strokeStyle='#243448';gc.lineWidth=.6;for(let i=1;i<=3;i++){gc.beginPath();gc.moveTo(0,i*h/4);gc.lineTo(w,i*h/4);gc.stroke();}
 for(const [key,c] of [['kinetic','#84d8f4'],['heat','#ffb069'],['radiated','#d8b5ff'],['work','#b6e7ac']]){gc.strokeStyle=c;gc.lineWidth=1.4;gc.beginPath();history.forEach((m,i)=>{const x=i*w/(history.length-1),y=h-8-(m[key]-min)/(max-min)*(h-18);if(i===0)gc.moveTo(x,y);else gc.lineTo(x,y);});gc.stroke();}}
function frame(now){try{const elapsed=last===null?0:Math.max(0,(now-last)/1000);last=now;if(running&&!document.hidden&&rate>0){accum+=elapsed*rate;const count=Math.min(100,Math.floor((accum+state.config.dt*1e-9)/state.config.dt));ticks(count);accum-=count*state.config.dt;if(accum<0&&accum>-state.config.dt*1e-9)accum=0;}
 if(dirty||running){draw();dirty=false;}if(frames%6===0||!running)update();}catch(e){running=false;accum=0;$('error').textContent='STOP: '+e.message;update();}requestAnimationFrame(frame);}
for(const k of ['n','seed','spin','damping','cooling','drive'])$(k).addEventListener('input',()=>{labels();$('pending').textContent='Geänderte Startwerte: mit „Werte übernehmen“ neu beginnen.';});
$('preset').addEventListener('change',()=>{form(E.PRESETS[$('preset').value]);reset(getConfig());});
$('apply').onclick=()=>{try{reset(getConfig());}catch(e){$('error').textContent=e.message;}};
$('play').onclick=()=>{running=!running;last=null;update();};$('reset').onclick=()=>reset(state.config);
$('rate').oninput=()=>{rate=Number($('rate').value);$('rateV').textContent=rate+'×';};
$('exposure').oninput=()=>{exposure=Number($('exposure').value);$('exposureV').textContent=exposure.toFixed(1)+'×';dirty=true;};
$('home').onclick=()=>{yaw=.15;pitch=.5;zoom=1.25;dirty=true;};
$('fullscreen').onclick=async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch(e){$('error').textContent='Vollbild: '+e.message;}};
$('export').onclick=()=>{const data=E.record(state);data.engineSha256='SOURCE_SHA';data.display={yaw,pitch,zoom,exposure,rate};const u=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download='HALVETH_WIRBEL_seed'+state.config.seed+'_step'+state.step+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw+=(e.clientX-drag.x)*.006;pitch=Math.max(-1.4,Math.min(1.4,pitch+(e.clientY-drag.y)*.006));drag={x:e.clientX,y:e.clientY};dirty=true;});
for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>drag=null);
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.15,Math.min(4,zoom*Math.exp(-e.deltaY*.001)));dirty=true;},{passive:false});
canvas.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();$('play').click();}if(e.key.toLowerCase()==='r')$('reset').click();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){running=false;last=null;drag=null;update();}});
window.addEventListener('resize',resize);
form(E.PRESETS.heat);reset(getConfig());resize();requestAnimationFrame(frame);
window.HALVETH_WIRBEL=Object.freeze({snapshot:()=>E.record(state),advanceForTest:n=>{running=false;ticks(n);draw();update();return E.record(state);},camera:()=>({yaw,pitch,zoom}),isRunning:()=>running});
})();
