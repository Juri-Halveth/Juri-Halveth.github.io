(function(){'use strict';
const $=s=>document.querySelector(s),{Engine,Clock,H}=HalvethKnoten;
let engine,clock,initialEngine,raf=0,last=0,metricTime=0,recorder=null,recordCanvas=null,recordCtx=null,recordStream=null,recordChunks=[],recordFrames=0,protocol=null;
const canvas=$('#scene'),ctx=canvas.getContext('2d',{alpha:false}),view={zoom:1,x:0,y:0,labels:true,cinema:false,mode:'rods',colorMode:'bluegold',annotations:false,symbolScale:1};
function notice(text,error=false){$('#notice').textContent=text;$('#notice').classList.toggle('error',error);}
function setting(){return{groups:Number($('#groups').value),cores:Number($('#cores').value),particles:Number($('#particles').value),seed:170117,medium:$('#medium').checked,phaseCoupling:$('#phase').checked,pressure:$('#pressure').checked,nematic:$('#nematic').checked};}
function updateDrive(value,fromProtocol=false){if(!fromProtocol)protocol=null;engine.setDrive(value);$('#drive').value=String(value);$('#driveVal').textContent=(value>=0?'+':'')+value.toFixed(2);}
function reset(){if(recorder&&recorder.state==='recording')stopRecord();engine=new Engine(setting());initialEngine=engine.snapshot();clock=new Clock(engine);view.mode=engine.config.nematic?'rods':'field';clock.speed=Number($('#speed').value);protocol=null;updateDrive(.95);last=0;view.x=0;view.y=0;view.zoom=1;notice('Bereit. Bewegliches Material mit eigener Orientierung; +0,95 wirkt als äußerer Antrieb.');update();draw();}
function draw(){HalvethRender.draw(ctx,engine,view);if(recordCtx){HalvethRender.draw(recordCtx,engine,{...view,cinema:true,labels:false});recordFrames++;}}
function update(){
 const m=engine.metrics(),g=m.groups[0];$('#materialCount').textContent=String(engine.config.particles);$('#materialMass').textContent=(engine.config.particles*engine.params.massCell).toFixed(2);$('#nematicOrder').textContent=m.nematicOrder===null?'aus':m.nematicOrder.toFixed(3);$('#drive').value=String(m.drive);$('#driveVal').textContent=(m.drive>=0?'+':'')+m.drive.toFixed(2);
 $('#time').textContent=m.time.toFixed(1);$('#turns').textContent=g.turns.toFixed(2);$('#coherence').textContent=Math.round(g.coherence*100)+' %';
 $('#qval').textContent=g.q.toFixed(3);$('#separation').textContent=g.separation.toFixed(3);$('#qbar').style.width=(Math.max(0,Math.min(1,g.q))*100)+'%';
 $('#bit').textContent=g.reading===null?'…':String(g.reading);$('#bit').className=g.reading===1?'bit on':'bit';
 $('#bitCaption').textContent=g.reading===null?'Übergang / nicht stabil ausgelesen':g.reading===1?'Kopplungszustand 1':'Kopplungszustand 0';
 $('#groupsRead').textContent=m.groups.map(g=>g.id+': '+(g.reading===null?'…':g.reading)).join('   ');
 $('#work').textContent=m.work.toFixed(4);$('#heat').textContent=m.heat.toFixed(4);$('#residual').textContent=m.residual.toExponential(2);
 $('#pause').textContent=clock.paused?'Weiter':'Pause';$('#backlog').textContent=clock.credit>.12?'Rechenrückstand: '+clock.credit.toFixed(2)+' Modellsekunden':'Fester Schritt: 1/120 • keine Schritte verworfen';
 $('#events').textContent=engine.events.length?engine.events.slice(-6).map(x=>`t ${x.time.toFixed(2)} · ${x.id} → ${x.bit} · q ${x.q.toFixed(3)} · R ${x.coherence.toFixed(3)}`).join('\n'):'Noch kein Zustandswechsel. Er entsteht im Solver, nicht beim Zeichnen.';
 if(recorder&&recorder.state==='recording')$('#record').textContent='■ Aufnahme stoppen';
}
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(r.width*d));canvas.height=Math.max(1,Math.round(r.height*d));draw();}
function oneStep(){
 if(protocol){while(protocol.length&&engine.tick>=protocol[0].tick){const next=protocol.shift();updateDrive(next.value,true);if(next.text)notice(next.text);}if(!protocol.length)protocol=null;}
 engine.step();
}
function frame(now){try{
 if(last===0)last=now;const elapsed=(now-last)/1000;last=now;
 if(!clock.paused&&!document.hidden&&clock.speed>0){clock.credit+=elapsed*clock.speed;const count=Math.min(12,Math.floor((clock.credit+1e-10)/H));for(let i=0;i<count;i++){oneStep();clock.totalSteps++;}clock.credit-=count*H;}
 draw();if(now-metricTime>250){update();metricTime=now;}
}catch(error){clock.paused=true;notice('Gestoppt: '+error.message,true);update();}raf=requestAnimationFrame(frame);}
function save(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
async function export4k(){
 const before=JSON.stringify(engine.snapshot()),out=document.createElement('canvas');out.width=3840;out.height=2160;HalvethRender.draw(out.getContext('2d',{alpha:false}),engine,{...view,labels:false,cinema:true});
 if(before!==JSON.stringify(engine.snapshot()))throw Error('Export veraenderte den Zustand.');
 out.toBlob(blob=>{if(blob){save(blob,'HALVETH_KNOTEN_4K_T'+engine.tick+'.png');notice('4K-Bild neu gezeichnet. Kein Modellschritt beim Export.');}else notice('PNG-Export fehlgeschlagen.',true);},'image/png');
}
async function startRecord(){
 if(recorder&&recorder.state==='recording'){stopRecord();return;}
 if(typeof MediaRecorder==='undefined'||!HTMLCanvasElement.prototype.captureStream){notice('WebM-Aufnahme in diesem Browser nicht verfügbar. 4K-PNG und JSON bleiben nutzbar.',true);return;}
 const type=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));if(!type){notice('Kein unterstützter WebM-Encoder.',true);return;}
 try{recordCanvas=document.createElement('canvas');recordCanvas.width=1920;recordCanvas.height=1080;recordCtx=recordCanvas.getContext('2d',{alpha:false});recordFrames=0;recordChunks=[];
  HalvethRender.draw(recordCtx,engine,{...view,cinema:true,labels:false});recordStream=recordCanvas.captureStream(30);
  recorder=new MediaRecorder(recordStream,{mimeType:type,videoBitsPerSecond:10000000});recorder.ondataavailable=e=>{if(e.data.size)recordChunks.push(e.data);};
  recorder.onerror=()=>notice('Videokodierung fehlgeschlagen.',true);
  recorder.onstop=()=>{save(new Blob(recordChunks,{type:'video/webm'}),'HALVETH_KNOTEN_1080p.webm');recordStream.getTracks().forEach(t=>t.stop());recordCtx=null;recordCanvas=null;$('#record').textContent='● WebM aufnehmen';notice('WebM gespeichert. Echtzeitaufnahme; Bildrate abhängig vom Rechner.');};
  recorder.start(1000);notice('Aufnahme läuft: 1920 × 1080, angefragt 30 FPS. Stopptaste zum Speichern.');
 }catch(e){if(recordStream)recordStream.getTracks().forEach(t=>t.stop());recordCtx=null;notice('Aufnahme nicht gestartet: '+e.message,true);}
}
function stopRecord(){if(recorder&&recorder.state==='recording')recorder.stop();}
$('#drive').addEventListener('input',e=>{updateDrive(Number(e.target.value));update();});
document.querySelectorAll('[data-drive]').forEach(b=>b.addEventListener('click',()=>{updateDrive(Number(b.dataset.drive));clock.paused=false;notice(b.dataset.note);update();}));
$('#pause').onclick=()=>{clock.paused=!clock.paused;last=0;update();};$('#reset').onclick=reset;$('#speed').onchange=e=>{clock.speed=Number(e.target.value);last=0;};
$('#apply').onclick=reset;
$('#demo').onclick=()=>{reset();clock.speed=2;$('#speed').value='2';protocol=[{tick:0,value:.95,text:'Protokoll 1/4: +0,95 für 45 Modellsekunden.'},{tick:5400,value:0,text:'Protokoll 2/4: Antrieb aus. Bleibt die Kopplung bestehen?'},{tick:9000,value:-.7,text:'Protokoll 3/4: Sanfter Gegenantrieb −0,70.'},{tick:12600,value:-1.5,text:'Protokoll 4/4: Stärker entknoten mit −1,50.'},{tick:19800,value:0,text:'Protokoll beendet. Die Ereignisse und Bilanz stehen unten.'}];};
$('#png').onclick=()=>export4k().catch(e=>notice(e.message,true));$('#record').onclick=startRecord;
$('#json').onclick=()=>save(new Blob([JSON.stringify({model:engine.snapshot(),material:HALVETHMaterial.capture(engine,clock,initialEngine),camera:{...view},scope:'Constructed dimensionless 2D material/nematic model. RGB are display classes. Not spacetime, subatomic or LCD measurement.',sourceSha256:window.ENGINE_SHA},null,2)],{type:'application/json'}),'HALVETH_MATERIAL_LAUF.json');
$('#cinema').onclick=()=>{document.body.classList.toggle('cinema');view.cinema=document.body.classList.contains('cinema');setTimeout(resize,0);};
$('#displayMode').onclick=()=>{view.mode=view.mode==='cells'?'field':'cells';$('#displayMode').textContent=view.mode==='field'?'Raster → Einzelzellen':'Einzelzellen → Raster';draw();};

$('#rodMode').onclick=()=>{view.mode='rods';draw();};
$('#palette').onchange=e=>{view.colorMode=e.target.value;$('.legend').innerHTML=view.colorMode==='rgb'?'<span style="color:#ff7373">A</span><span style="color:#78e1a5">B</span><span style="color:#79b8ff">C</span><span>RGB-Anzeigeklassen nach stabiler Zell-ID · keine Proton-/Neutron-/Elektron-Zuordnung</span>':'<span><i></i>Kanal A</span><span><i class="gold"></i>Kanal B</span><span>Herkunftsfarben als Ansicht · Masse und Zellzahl bleiben beim Zoomen gleich</span>';draw();};
$('#annotations').onchange=e=>{view.annotations=e.target.checked;draw();};
$('#more').onclick=()=>{const open=$('#more').getAttribute('aria-expanded')!=='true';$('#more').setAttribute('aria-expanded',String(open));document.body.classList.toggle('moreclosed',!open);document.querySelectorAll('[data-more]').forEach(e=>e.hidden=!open);setTimeout(resize,0);};
$('#loadrun').onclick=()=>$('#runfile').click();
$('#runfile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5000000)throw Error('JSON größer als 5 MB');const doc=JSON.parse(await file.text()),s=doc.material||doc,next=HALVETHMaterial.create({particles:0});next.replay(s,{maxTicks:100000});engine=next.engine;initialEngine=HALVETHMaterial.exactUnpack(s.exact).initialEngine;clock=new Clock(engine);clock.paused=true;clock.credit=s.clock.credit;clock.totalSteps=engine.tick;clock.speed=Number($('#speed').value);last=0;protocol=null;notice('JSON vollständig numerisch nachgespielt und abgeglichen; pausiert übernommen.');update();draw();}catch(err){notice('Import unverändert abgelehnt: '+err.message,true);}finally{e.target.value='';}};
$('#home').onclick=()=>{view.zoom=1;view.x=0;view.y=0;draw();};
let drag=null;canvas.addEventListener('pointerdown',e=>{drag={px:e.clientX,py:e.clientY,x:view.x,y:view.y};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const r=canvas.getBoundingClientRect(),span=engine.config.groups===3?17.8:11.8,scale=Math.min(r.width/span,r.height/(span*.68))*view.zoom;view.x=drag.x-(e.clientX-drag.px)/scale;view.y=drag.y+(e.clientY-drag.py)/scale;});
canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
canvas.addEventListener('wheel',e=>{e.preventDefault();view.zoom=Math.max(.2,Math.min(5,view.zoom*Math.exp(-e.deltaY*.001)));},{passive:false});
window.addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{if(document.hidden){clock.paused=true;last=0;stopRecord();notice('Tab verborgen: Modell pausiert. Mit „Weiter“ fortsetzen.');update();}else last=0;});
window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(e.code==='Space'){e.preventDefault();clock.paused=!clock.paused;last=0;update();}if(e.key==='Escape'){document.body.classList.remove('cinema');view.cinema=false;resize();}});
reset();resize();raf=requestAnimationFrame(frame);
// Readable test interface; no remote access, shell execution or credentials.
window.KnotenTest={engine:()=>engine,clock:()=>clock,view,render:draw,step:n=>{engine.step(n);draw();update();},stop:()=>{cancelAnimationFrame(raf);clock.paused=true;},reset,export4k,material:()=>HALVETHMaterial.capture(engine,clock,initialEngine)};
})();
