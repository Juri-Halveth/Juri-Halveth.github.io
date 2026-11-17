/* Visual restoration derived from the uploaded July source. No remote calls. */
'use strict';
(()=>{
const M=window.PairModel,$=id=>document.getElementById(id),canvas=$('gl'),labels=$('labels'),ctx=labels.getContext('2d');
const surface=canvas.getContext('2d',{alpha:false});
if(!surface){$('status').textContent='Canvas 2D nicht verfügbar.';return;}
let running=!matchMedia('(prefers-reduced-motion: reduce)').matches,mode='pair',coupling=0,study=M.create(),cam,drag=null,last=null,frames=[],fps=0,fatal=false,wide=false;
const keys=new Set();const seed=20261116;let cssW=innerWidth,cssH=innerHeight;
function home(){cam={x:0,y:0,z:-7,yaw:0,pitch:0};keys.clear();$('auto').checked=false;}
home();
const stars=(()=>{const r=M.rng(78123);return Array.from({length:900},()=>({x:(r()-.5)*120,y:(r()-.5)*80,z:r()*1800-80,size:.9+r()*1.7}));})();
function size(w,h){if(!Number.isFinite(w)||!Number.isFinite(h)||w<1||h<1||w*h>16777216)throw Error('Auflösung über Zeichenbudget.');canvas.width=w;canvas.height=h;labels.width=w;labels.height=h;}
function glowSprite(color){const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d'),r=g.createRadialGradient(48,48,0,48,48,48);r.addColorStop(0,'#fff');r.addColorStop(.10,color);r.addColorStop(.28,color+'9a');r.addColorStop(1,color+'00');g.fillStyle=r;g.fillRect(0,0,96,96);return c;}
const blueSprite=glowSprite('#77baff'),goldSprite=glowSprite('#ffd186');
function background(w,h,centerX){const x=surface;x.fillStyle='#040812';x.fillRect(0,0,w,h);if(mode!=='pair')return;const cx=w*centerX,cy=h*.5,unit=h/8,sep=2.3*(1-coupling)+.25*coupling,t=study.time;
const tint=x.createLinearGradient(cx-3*unit,0,cx+3*unit,0);tint.addColorStop(0,'#77baff');tint.addColorStop(.5,'#d7d5ea');tint.addColorStop(1,'#ffd186');x.strokeStyle=tint;x.lineWidth=Math.max(.55,h/1400);x.globalCompositeOperation='lighter';
const extent=Math.min(w/unit*.43,6);const lines=84,samples=Math.max(200,Math.ceil(w/5));
for(let j=0;j<lines;j++){const y0=(j/(lines-1)-.5)*3.8;const env=Math.exp(-.85*y0*y0);x.globalAlpha=env*(.09+.21*coupling);x.beginPath();for(let i=0;i<=samples;i++){const q=-extent+2*extent*i/samples,d1=Math.hypot(q+sep,y0),d2=Math.hypot(q-sep,y0);const v=(Math.sin(d1*9-t*2.4)+Math.sin(d2*9-t*2.4))*.5;const yy=y0+v*(.035+.12*coupling)*env;const px=cx+q*unit,py=cy+yy*unit;if(i===0)x.moveTo(px,py);else x.lineTo(px,py);}x.stroke();}
x.globalAlpha=1;x.globalCompositeOperation='source-over';}
function resize(){cssW=innerWidth;cssH=innerHeight;const q=$('quality').value;if(q==='4k')size(3840,2160);else if(q==='1080')size(1920,1080);else{let d=Math.min(devicePixelRatio||1,2);d=Math.min(d,Math.sqrt(8294400/(cssW*cssH)));size(Math.max(1,Math.round(cssW*d)),Math.max(1,Math.round(cssH*d)));}draw();}
function flatText(txt,x,y,size,col){ctx.fillStyle=col;ctx.font=`600 ${size}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,x,y);}
function draw(){if(fatal)return;const w=canvas.width,h=canvas.height,ratio=h/cssH;const margin=(!wide&&cssW>720)?Math.min(330/cssW,.35):0;const centerX=(1-margin)/2;const t=study.time;
background(w,h,centerX);ctx.clearRect(0,0,w,h);
if(mode==='pair'){
const cx=w*centerX,cy=h*.5,sep=(2.3*(1-coupling)+.25*coupling)*h/8;const pulse=study.has(0)?1:0;
for(const [x,sym,col] of [[cx-sep,'−','#77baff'],[cx+sep,'+','#ffd186']]){ctx.save();ctx.fillStyle=col;ctx.shadowBlur=18*ratio;ctx.shadowColor=col;ctx.beginPath();ctx.arc(x,cy,7*ratio,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;flatText(sym,x,cy-30*ratio,25*ratio,col);ctx.restore();}
if(pulse){flatText('1 Modell-Bit',cx,cy+65*ratio,21*ratio,'#f7f1dc');flatText('Wert '+study.stations[0].bit+' · Quelle P001',cx,cy+93*ratio,11*ratio,'#a4b2c8');}
}else{
for(const s of stars){const p=M.project(s,cam,w,h);if(!p||p.x<0||p.x>w||p.y<0||p.y>h)continue;surface.fillStyle='rgba(149,171,204,.48)';surface.beginPath();surface.arc(p.x,p.y,Math.max(.5*ratio,Math.min(2*ratio,s.size*40*ratio/p.z)),0,Math.PI*2);surface.fill();}
for(let i=0;i<study.stations.length;i++){const s=study.stations[i],d=Math.hypot(s.x-cam.x,s.y-cam.y,s.z-cam.z);let localC=Math.max(coupling,M.clamp(1-d/6,0,1));if(study.has(i))localC=1;const sep=1.25*(1-localC)+.10;const left={x:s.x-sep,y:s.y,z:s.z},right={x:s.x+sep,y:s.y,z:s.z};for(const [point,sprite] of [[left,blueSprite],[right,goldSprite]]){const pp=M.project(point,cam,w,h);if(!pp||pp.x<0||pp.x>w||pp.y<0||pp.y>h)continue;const size=Math.min(120*ratio,Math.max(4*ratio,.48*h/pp.z));surface.drawImage(sprite,pp.x-size/2,pp.y-size/2,size,size);}
const p=M.project(s,cam,w,h);if(!p||p.x<0||p.x>w||p.y<0||p.y>h)continue;
if(p.z<65){const fs=Math.max(9*ratio,Math.min(18*ratio,70*h/900/p.z));const a=M.project(left,cam,w,h),b=M.project(right,cam,w,h);if(a&&b){flatText('−',a.x,a.y-15*ratio,fs,'#85c2ff');flatText('+',b.x,b.y-15*ratio,fs,'#ffdb99');}flatText(s.id+(study.has(i)?' · '+s.bit:''),p.x,p.y+23*ratio,Math.max(9*ratio,fs*.7),study.has(i)?'#f8deb0':'#899bb7');}
if(study.has(i)&&p.z<70){ctx.strokeStyle='rgba(255,209,134,.30)';ctx.lineWidth=1*ratio;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(3*ratio,90*h/900/p.z),0,Math.PI*2);ctx.stroke();}
}
ctx.strokeStyle='#9baec14d';ctx.beginPath();ctx.moveTo(w/2-6*ratio,h/2);ctx.lineTo(w/2+6*ratio,h/2);ctx.moveTo(w/2,h/2-6*ratio);ctx.lineTo(w/2,h/2+6*ratio);ctx.stroke();
}
$('telemetry').textContent=`${w} × ${h} · ${fps.toFixed(0)} FPS · t ${t.toFixed(1)} s · ${study.events.length} Modell-Ereignisse · Seed ${seed}`;
}
function record(i,why){const e=study.record(i,why,cam);if(e)$('status').textContent=`${e.source} erfasst · Modellwert ${e.bit} · ${study.events.length} Ereignis${study.events.length===1?'':'se'}. Keine reale Teilchenerzeugung.`;}
function frame(now){if(fatal)return;const dt=last===null?0:Math.min(.05,(now-last)/1000);last=now;try{if(running&&!document.hidden){study.advance(dt);if(mode==='flight'){const speed=keys.has('Shift')?14:5;M.move(cam,{forward:(keys.has('w')?speed:0)-(keys.has('s')?speed:0)+($('auto').checked?2:0),side:(keys.has('d')?speed:0)-(keys.has('a')?speed:0),up:(keys.has('e')?speed:0)-(keys.has('q')?speed:0)},dt);for(const i of study.near(cam))record(i,'camera proximity <= 1.25');}}if(dt>0){frames.push(1/dt);if(frames.length>40)frames.shift();fps=frames.reduce((a,b)=>a+b,0)/frames.length;}draw();}catch(e){fatal=true;$('status').textContent='Renderer gestoppt: '+e.message;$('status').className='error';}requestAnimationFrame(frame);}
$('coupling').oninput=()=>{coupling=Number($('coupling').value);$('couplingLabel').textContent=Math.round(coupling*100)+' %';if(mode==='pair'&&coupling>=.92)record(0,'coupling >= 0.92');draw();};
$('mode').onchange=()=>{mode=$('mode').value;home();$('status').textContent=mode==='pair'?'Schiebe die beiden Zustände zusammen.':'Fliege an eine Station heran. Kamera und Quellen sind getrennt.';draw();};
function reset(){study=M.create(seed,Number($('count').value));coupling=0;$('coupling').value=0;$('couplingLabel').textContent='0 %';home();last=null;$('status').textContent='Neuer reproduzierbarer Modelllauf. Noch keine Ereignisse.';draw();}
$('count').onchange=reset;$('reset').onclick=reset;$('home').onclick=()=>{home();draw();};
function toggle(){running=!running;$('pause').textContent=running?'Pause':'Weiter';last=null;}
$('pause').onclick=toggle;if(!running)$('pause').textContent='Weiter';
function hide(v){wide=v;document.body.classList.toggle('wide',v);$('panel').hidden=v;$('show').hidden=!v;draw();}
$('wide').onclick=()=>hide(true);$('show').onclick=()=>hide(false);$('quality').onchange=()=>{try{resize();}catch(e){$('status').textContent=e.message;}};
function save(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
$('json').onclick=()=>save(new Blob([JSON.stringify(study.snapshot(),null,2)],{type:'application/json'}),'HALVETH_PAAR_VERSUCH.json');
$('png').onclick=()=>{const w=canvas.width,h=canvas.height;try{size(3840,2160);draw();const out=document.createElement('canvas');out.width=3840;out.height=2160;const x=out.getContext('2d');x.drawImage(canvas,0,0);x.drawImage(labels,0,0);x.fillStyle='#d9e4f6';x.font='24px system-ui';x.textAlign='left';x.fillText('HALVETH · Der erste Unterschied · Modellillustration, kein Naturbeweis',44,50);x.font='19px monospace';x.fillText('Seed '+seed+' | t '+study.time.toFixed(3)+' s | '+study.events.length+' Ereignisse',44,81);out.toBlob(b=>{if(b)save(b,'HALVETH_ERSTER_UNTERSCHIED_4K.png');else $('status').textContent='PNG-Export fehlgeschlagen.';},'image/png');}catch(e){$('status').textContent='Export: '+e.message;}finally{size(w,h);draw();}};
labels.addEventListener('pointerdown',e=>{if(e.button!==0)return;labels.focus();drag={x:e.clientX,y:e.clientY,id:e.pointerId};labels.setPointerCapture(e.pointerId);});
labels.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id||mode!=='flight')return;cam.yaw-=(e.clientX-drag.x)*.004;cam.pitch=M.clamp(cam.pitch+(e.clientY-drag.y)*.004,-1.5,1.5);drag.x=e.clientX;drag.y=e.clientY;draw();});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])labels.addEventListener(ev,()=>{drag=null;});
function release(){keys.clear();drag=null;last=null;}
window.addEventListener('blur',release);document.addEventListener('visibilitychange',release);
window.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA|BUTTON/.test(e.target.tagName))return;const k=e.key.length===1?e.key.toLowerCase():e.key;if(['w','s','a','d','q','e','Shift'].includes(k)){keys.add(k);e.preventDefault();}if(!e.repeat&&k==='p')toggle();if(k==='x'){$('auto').checked=false;keys.clear();}if(k==='h'){home();draw();}});
window.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));
window.addEventListener('resize',resize);resize();requestAnimationFrame(frame);
window.__PAIR_STUDY={state:()=>({mode,coupling,running,camera:{...cam},width:canvas.width,height:canvas.height,...study.snapshot()}),draw,reset};
})();
