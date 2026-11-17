/* HALVETH Research Model Engine 2.0 — independent illustration solvers. */
(()=>{'use strict';
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x)),TAU=Math.PI*2;
const canvases=[...document.querySelectorAll('canvas[data-lab]')];if(!canvases.length)return;
function seedrand(seed){let s=seed|0;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296;};}
for(const canvas of canvases){
 const mode=canvas.dataset.lab,c=canvas.getContext('2d',{alpha:false});if(!c)continue;
 const panel=canvas.closest('.lab-full,.embedded-lab'),ctrl=n=>panel?.querySelector('[data-control="'+n+'"]'),button=n=>panel?.querySelector('[data-action="'+n+'"]'),status=panel?.querySelector('[data-status]');
 let running=!matchMedia('(prefers-reduced-motion:reduce)').matches,modelTime=0,last=null,theta=0,drag=null,stars=[],wave=[],wvel=[],phase=0;
 const schema={referenceRate:{min:.1,max:200,fallback:1},damping:{min:0,max:.4,fallback:.12},merge:{min:0,max:100,fallback:36},frequency:{min:1,max:12,fallback:5},speed:{min:0,max:200,fallback:80},kappa:{min:0,max:.15,fallback:.075},sourceMinus:{min:0,max:1,fallback:1},sourcePlus:{min:0,max:1,fallback:1}};
 let hasStarted=running;
 const motionLabel=key=>globalThis.HALVETHMotionUI?.label(key)||({pause:'Pause',continue:'Weiter',start:'Bewegung starten',limit:'Modellgrenze erreicht'}[key]||key);
 function syncMotion(){const b=button('pause');if(!b)return;const limit=particleModel?.diagnostics().status==='MODEL_LIMIT';b.disabled=!!limit;const label=motionLabel(running?'pause':hasStarted?'continue':'start');if(b.textContent!==label)b.textContent=label;}
 let params={},pendingInputs=[],inputHistory=[];
 let replayController=null,replayStatus="";
 function cancelReplay(){if(replayController)replayController.abort();replayController=null;replayStatus="";}
 const spatial=globalThis.HALVETHDoubleEight, spatialView=globalThis.HALVETHDoubleEightView;
 const approach=spatialView?.approach();
 let spatialConfig=spatial?.entryConfiguration()??{coupling:1}, spatialTimeOffset=0, lastPositions=[];
 let selectedModel=mode==='pair'&&spatial?.requested()?'doppelacht':'material',view={style:'rods',palette:'rgb',annotations:false,symbolScale:1,yaw:.35,pitch:.55,zoom:1},seekTarget=0,initialParameters=null,activeModelConfig={};
 function createModel(name,config){return name==='doppelacht'?spatial.create(config):HALVETHModels.create(name,config);}
 function isMaterial(name){return name==='material'||name==='doppelacht';}
 function known(name){return name==='doppelacht'&&!!spatial||HALVETHModels.modes.includes(name);}
 function setupSpatialView(){approach.begin(view,spatialConfig);Object.assign(view,spatialView.presets.oblique,{palette:'bluegold',style:'rods',followId:null});}
 if(selectedModel==='doppelacht'){setupSpatialView();activeModelConfig={...spatialConfig};}
 let particleModel=mode==='pair'?createModel(selectedModel,selectedModel==='doppelacht'?spatialConfig:{seed:20261117}):null;
 const spatialTools=spatialView?.controls(panel?.querySelector('[data-d8-controls]'),{
   layout:name=>{const {layout,...rest}=spatialConfig;spatialConfig=name==='shell'?{...rest,layout:'shell'}:rest;useModel('doppelacht');},
   distance:setDistance,
   coupling:value=>{spatialConfig={...spatialConfig,coupling:value};useModel('doppelacht');},
   camera:name=>{approach.stop();Object.assign(view,spatialView.presets[name]);draw();},
   follow:id=>{approach.stop();view.followId=id;if(id&&view.distance>spatialView.overviewDistance)setDistance(spatialView.overviewDistance);else draw();}
 });
 function syncSpatial(){
   spatialTools?.sync(selectedModel==='doppelacht',spatialConfig.coupling,view.followId,spatialConfig.count??960,view);
   const select=panel?.querySelector('[data-model-select]');if(select)select.value=selectedModel;
   const palette=panel?.querySelector('[data-material-palette]');if(palette)palette.value=view.palette;
 }
 syncSpatial();
 const readParameters=()=>{for(const [name,spec]of Object.entries(schema)){const raw=ctrl(name)?.value;params[name]=raw===undefined?spec.fallback:Number(raw);}};
 function setParameter(name,value,step){const spec=schema[name];if(!Object.hasOwn(schema,name)||!spec||!Number.isFinite(value)||value<spec.min||value>spec.max)throw new RangeError('Invalid model parameter: '+name);params[name]=value;inputHistory.push({step,name,value});}
 function scheduleInput(name,value,atModelTime){const spec=schema[name];if(!Object.hasOwn(schema,name)||!spec||!Number.isFinite(value)||value<spec.min||value>spec.max||!Number.isFinite(atModelTime)||atModelTime<modelTime)throw new RangeError('Invalid timed input');pendingInputs.push({name,value,step:Math.ceil(atModelTime*90-1e-9)});pendingInputs.sort((a,b)=>a.step-b.step);}
 const clock=HALVETHFixedClock.create({stepSeconds:1/90,maxStepsPerFrame:240,onStep:(_dt,time,nextStep)=>{
  while(pendingInputs.length&&pendingInputs[0].step<=nextStep-1){const input=pendingInputs.shift();setParameter(input.name,input.value,nextStep-1);}
  if(mode==='wave')stepWave();
  if(particleModel){if(selectedModel==='doppelacht'||particleModel.diagnostics().status==='RUNNING')particleModel.step(_dt*(['experimental','material','doppelacht'].includes(selectedModel)?1:params.referenceRate),selectedModel==='experimental'?{attraction:params.merge/36,damping:params.damping,frequency:params.frequency,sourceMinus:params.sourceMinus,sourcePlus:params.sourcePlus,fieldFeedback:.03}:{});
   const state=selectedModel==='doppelacht'?{time:particleModel.time,status:'RUNNING'}:particleModel.snapshot({field:false});modelTime=state.time;if(state.status!=='RUNNING'){running=false;last=null;}
  }else modelTime=nextStep/90;
 }});
 readParameters();
 const r=seedrand(20261117);
 stars=Array.from({length:380},()=>({x:r(),y:r(),b:.2+r()*.8,size:.7+r()*1.7}));
 function reset(){cancelReplay();if(selectedModel==='doppelacht'){setupSpatialView();syncSpatial();}else delete view.distance;
   spatialTimeOffset=0;if(particleModel)particleModel.reset();clock.reset();last=null;pendingInputs=[];inputHistory=[];readParameters();initialParameters={...params};seekTarget=0;modelTime=0;phase=0;theta=0;wave=Array.from({length:88},(_,i)=>Math.exp(-Math.pow((i-21)/4,2))*.65);wvel=Array.from({length:88},()=>0);draw();}
 function resize(){const z=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2.25,Math.sqrt(5500000/(z.width*z.height||1)));canvas.width=Math.max(1,Math.floor(z.width*d));canvas.height=Math.max(1,Math.floor(z.height*d));draw();}
 function bg(w,h){let grad=c.createLinearGradient(0,0,w,h);grad.addColorStop(0,'#07182b');grad.addColorStop(.6,'#050d19');grad.addColorStop(1,'#0c1424');c.fillStyle=grad;c.fillRect(0,0,w,h);for(const s of stars){c.fillStyle=`rgba(210,226,243,${s.b*.30})`;c.fillRect(s.x*w,s.y*h,Math.max(.5,s.size*w/1500),Math.max(.5,s.size*w/1500));}}
 function text(s,x,y,size,color='#d7e0ea',align='left'){c.fillStyle=color;c.font=`${Math.round(size)}px ui-monospace, monospace`;c.textAlign=align;c.fillText(s,x,y);}
 function ring(x,y,r,color,alpha=1,width=1){c.beginPath();c.arc(x,y,r,0,TAU);c.lineWidth=width;c.strokeStyle=color;c.globalAlpha=alpha;c.stroke();c.globalAlpha=1;}
 function glow(x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#fff5e1');g.addColorStop(.08,color);g.addColorStop(.27,color+'aa');g.addColorStop(1,color+'00');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
 function waveform(w,h){
  if(selectedModel==='doppelacht'){
    lastPositions=spatialView.draw(c,particleModel.frame(),view,w,h).observations;
    return;
  }
  const state=particleModel.snapshot({exact:false});if(selectedModel==='material'){const options={...view};if(view.style==='space'){const ca=Math.cos(view.yaw),sa=Math.sin(view.yaw),cp=Math.cos(view.pitch),sp=Math.sin(view.pitch),f=Math.min(w/17.8,h/12.5)*24*(view.zoom||1);options.project=({x,y})=>{const xx=ca*x,z=-sa*x,yy=cp*y-sp*z,depth=24+sp*y+cp*z;return depth>.1?{x:w/2+xx*f/depth,y:h/2-yy*f/depth,depth}:null;};}HALVETHMaterialView.draw(c,state,w,h,options);}else HALVETHParticleView.draw(c,state,w,h,view);}
 // Coefficients apply once per fixed 1/90 model-second tick (legacy recurrence).
 function stepWave(){const k=params.kappa,friction=.002+params.frequency/1300;
  const old=[...wave];for(let i=1;i<wave.length-1;i++){wvel[i]+=(k*(old[i-1]-2*old[i]+old[i+1])-friction*wvel[i]);wave[i]+=wvel[i];}
 }
 function wavemodel(w,h){
  const mid=h*.52;for(let j=0;j<12;j++){c.beginPath();for(let i=0;i<wave.length;i++){const x=w*i/(wave.length-1),y=mid+wave[i]*h*(.23-j*.007)+Math.sin(i*.19+modelTime*1.5+j*.3)*6;
  if(i)c.lineTo(x,y+j*15-70);else c.moveTo(x,y+j*15-70);}c.strokeStyle=j%2?'#78d0de':'#dbb575';c.globalAlpha=.09+j*.022;c.lineWidth=1.2;c.stroke();}c.globalAlpha=1;text('Δẍᵢ = κ∇²xᵢ − γẋᵢ',24,h-35,Math.min(17,h*.029));}
 function layers(w,h){const n=12,sep=h*.064,bias=params.merge/100;for(let i=0;i<n;i++){const scale=1-i*.035,y=h*.86-i*sep,xx=w*.5+Math.sin(i*.36+modelTime*.2)*bias*45;const ww=w*.56*scale;const p=[[-ww/2,0],[ww/2,0],[ww/2-44,-35],[-ww/2+44,-35]];c.beginPath();p.forEach((q,k)=>{let x=xx+q[0],yy=y+q[1];if(!k)c.moveTo(x,yy);else c.lineTo(x,yy);});c.closePath();c.fillStyle=i%2?'rgba(47,136,154,.18)':'rgba(194,139,88,.16)';c.fill();c.lineWidth=1.6;c.strokeStyle=i%2?'#69d3d6':'#d9bd88';c.stroke();if(i%2===0)text('S'+i,xx-ww/2+20,y-12,Math.max(10,h*.028));}text('Jede Ebene ist eine Modellklasse, kein nachgewiesenes Universum.',24,h-25,Math.min(15,h*.027));}
 function dimensions(w,h){const cx=w*.5,cy=h*.50,n=4+Math.floor(params.merge/11),angle=modelTime*.18+theta;for(let i=n;i>=1;i--){const size=Math.min(w,h)*(.08+i*.056),a=angle+i*.26,xx=cx+Math.cos(a)*i*4,yy=cy+Math.sin(a)*i*3;c.save();c.translate(xx,yy);c.rotate(a*.4);c.strokeStyle=i%2?'#8cd5e3':'#e5b77a';c.lineWidth=1.1;c.globalAlpha=.2+.65*(1-i/n);c.strokeRect(-size/2,-size/2,size,size);c.restore();ring(xx,yy,Math.max(1,3+i*.3),'#e6ddc7',.8);}c.globalAlpha=1;text('Dimension im Modell = unabhängiger Freiheitsgrad',24,h-26,Math.min(15,h*.025));}
 function vortex(w,h,three){const cx=w*.5,cy=h*.54,rot=modelTime*.2+theta,friction=params.merge/100*.6,turns=4+params.frequency*.4;for(let line=0;line<70;line++){
 c.beginPath();for(let i=0;i<310;i++){const u=i/309,phi=turns*TAU*u+line*.21+rot,rad=(.1+.7*Math.exp(-friction*u))*Math.min(w,h)*.41*(1-u*.52);let x=cx+Math.cos(phi)*rad*(three?.77:1),y=cy+Math.sin(phi)*rad*(three?.38:1)+(three?(u-.5)*h*.6:0);if(three){const a=theta*.37,dx=x-cx;x=cx+dx*Math.cos(a)-(y-cy)*Math.sin(a);y=cy+dx*Math.sin(a)+(y-cy)*Math.cos(a);}if(i)c.lineTo(x,y);else c.moveTo(x,y);}
 c.globalAlpha=.035+line/1500;c.lineWidth=1;c.strokeStyle=line%3===0?'#e4bc7d':'#80bfcf';c.stroke();}c.globalAlpha=1;glow(cx,cy,Math.min(w,h)*.10,'#ddad6c');text(three?'Räumliche Perspektive / Parametrisierung':'2D-Phasenraum / keine kosmische Singularität',20,h-26,Math.min(15,h*.026));}
 function timeline(w,h){const t=modelTime,cx=w*.25,cy=h*.55;const pts=22;for(let i=0;i<pts;i++){const x=w*.08+i*w*.038,y=cy+Math.sin(i*.56)*h*.2;const past=i<pts*(.25+params.merge/200);ring(x,y,4,past?'#ddbc7a':'#6ec2d8',past?1:.5,2);if(i>0){const xx=w*.08+(i-1)*w*.038,yy=cy+Math.sin((i-1)*.56)*h*.2;c.beginPath();c.moveTo(xx,yy);c.lineTo(x,y);c.strokeStyle=past?'#d8b67b':'#476c88';c.globalAlpha=past?1:.45;c.stroke();c.globalAlpha=1;}}c.fillStyle='#b9d4de';text('gespeicherte Vergangenheit',20,h-54,14);text('modellierte Möglichkeiten',w*.52,h-54,14);}
 function sgr(w,h){const cx=w*.5,cy=h*.51,R=Math.min(w,h)*.29,nodes=params.merge/100,sharp=params.frequency/12;
 const gradient=c.createRadialGradient(cx,cy,R*.35,cx,cy,R*1.8);gradient.addColorStop(0,'#020611');gradient.addColorStop(.40,'#0c101a');gradient.addColorStop(.66,'#303024');gradient.addColorStop(.74,'#0f1823');gradient.addColorStop(1,'#050c16');c.fillStyle=gradient;c.fillRect(0,0,w,h);
 for(let k=0;k<50;k++){const rr=R+(k-25)*Math.max(1,(14-sharp*10)*w/1450),alpha=.018*Math.exp(-(((k-25)/17)**2));ring(cx,cy,rr,'#fed89a',alpha,Math.max(1,w/500));}
 for(let j=0;j<3;j++){const a=j*TAU/3+modelTime*.05;glow(cx+Math.cos(a)*R,cy+Math.sin(a)*R,Math.max(2,R*.28),j===0?'#ffb25c':'#ecc27c');}
 if(nodes<.8){c.fillStyle=`rgba(0,0,0,${(.8-nodes)*.32})`;c.fillRect(0,0,w,h);}
 text('SYNTHETISCH · EHT d=51,8 ± 2,3 μas',20,h-28,Math.min(16,h*.026));}
 function wirbel(w,h){const cx=w*.5,cy=h*.52,R=Math.min(w,h)*(.2+params.merge/100*.17);for(let i=0;i<4;i++){const a=i*TAU/4+modelTime*(.18-.02*i);const x=cx+Math.cos(a)*R,y=cy+Math.sin(a)*R*.65;
 for(let j=0;j<44;j++){let angle=a-j*.045,rr=R*(1+.006*j);const xx=cx+Math.cos(angle)*rr,yy=cy+Math.sin(angle)*rr*.65;ring(xx,yy,.7+j*.03,'#80d5dc',.33*(1-j/44),1);}glow(x,y,Math.min(w,h)*.065,i%2?'#edbb75':'#8bceed');}ring(cx,cy,R,'#acbfc5',.24);text('Spielmechanik · keine 2D/3D-Hydrodynamik',24,h-27,Math.min(15,h*.026));}
 function draw(){const w=canvas.width,h=canvas.height;if(w<1||h<1)return;bg(w,h);
 switch(mode){case 'pair':waveform(w,h);break;case 'wave':wavemodel(w,h);break;case 'layers':layers(w,h);break;case 'dimensions':dimensions(w,h);break;case 'vortex2':vortex(w,h,false);break;case 'vortex3':vortex(w,h,true);break;case 'timeline':timeline(w,h);break;case 'sgr':sgr(w,h);break;case 'wirbel':wirbel(w,h);break;}
 }
 function showStatus(){syncMotion();if(status){const state=clock.snapshot();status.textContent=`${replayStatus?replayStatus+" · ":""}${mode} · t=${modelTime.toFixed(3)} · ${state.steps} Schritte · ${document.hidden?'Hintergrundpause':running?'läuft':'pausiert'}${particleModel?' · '+selectedModel+' · '+(particleModel.diagnostics().status==='MODEL_LIMIT'?motionLabel('limit'):particleModel.diagnostics().status)+(selectedModel==='doppelacht'?' · 3D · '+(spatialConfig.count??spatial.defaults.count):(' · '+particleModel.diagnostics().orbitalTurns.toFixed(3)+' Umläufe')):''}${state.overloaded?' · Rechenrückstand '+state.backlogSeconds.toFixed(3)+' Modellsekunden':''} · Simulation · Modell, keine Naturmessung`;}}
 function frame(time){const dt=last===null?0:Math.max(0,(time-last)/1000);last=time;
  if(running&&!document.hidden&&params.speed>0){
    if(selectedModel==='doppelacht'&&approach.update(view,dt))spatialTools?.meter(view.distance);
    const rate=selectedModel==='doppelacht'&&spatialConfig.layout==='shell'?spatialView.presentationRate:1;
    clock.advance(dt*(params.speed/75)*rate);
  }
  if(!document.hidden)draw();showStatus();requestAnimationFrame(frame);
 }
 Object.keys(schema).forEach(name=>ctrl(name)?.addEventListener('input',e=>{setParameter(name,Number(e.target.value),clock.snapshot().steps);draw();showStatus();}));
 button('pause')?.addEventListener('click',()=>{if(particleModel?.diagnostics().status==='MODEL_LIMIT')return;hasStarted=true;running=!running;last=null;showStatus();});button('reset')?.addEventListener('click',()=>{reset();running=hasStarted;showStatus();});
 document.addEventListener('visibilitychange',()=>{last=null;showStatus();});
 button('json')?.addEventListener('click',()=>{const state=sceneSnapshot(),blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='HALVETH_'+mode+'_state.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);});
 button('png')?.addEventListener('click',()=>{const w=canvas.width,h=canvas.height;canvas.width=3840;canvas.height=2160;draw();canvas.toBlob(blob=>{if(blob){const u=URL.createObjectURL(blob),a=document.createElement('a');a.download='HALVETH_'+mode+'_4K.png';a.href=u;a.click();setTimeout(()=>URL.revokeObjectURL(u),5000);}canvas.width=w;canvas.height=h;draw();},'image/png');});
 function setDistance(d){approach.stop();view.distance=d;spatialTools?.meter(d);draw();}
 function pickCell(e){
   const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)*canvas.width/rect.width,y=(e.clientY-rect.top)*canvas.height/rect.height;
   const nearest=lastPositions.reduce((best,p)=>Math.hypot(p.x-x,p.y-y)<best.distance?{id:p.id,distance:Math.hypot(p.x-x,p.y-y)}:best,{distance:12});
   if(nearest.id)spatialTools?.pick(nearest.id);
 }
 spatialView?.distanceControls(canvas,{active:()=>selectedModel==='doppelacht'&&spatialConfig.layout==='shell',
   read:()=>view.distance,set:setDistance,
   rotate:(dx,dy)=>{approach.stop();view.yaw+=dx*.008;view.pitch=clamp(view.pitch+dy*.008,-Math.PI/2,Math.PI/2);spatialTools?.manual();draw();},
   tap:e=>{if(view.distance>4*spatialView.overviewDistance)setDistance(spatialView.overviewDistance);else pickCell(e);}
 });
 canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,id:e.pointerId};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!drag)return;if(particleModel&&(view.style==='space'||selectedModel==='doppelacht')){if(selectedModel==='doppelacht')spatialTools?.manual();view.yaw+=(e.clientX-drag.x)*.008;view.pitch=Math.max(-1.5,Math.min(1.5,view.pitch+(e.clientY-drag.y)*.008));draw();}else theta+=(e.clientX-drag.x)*.008;drag.x=e.clientX;drag.y=e.clientY;});canvas.addEventListener('wheel',e=>{if(particleModel&&(isMaterial(selectedModel)||view.style==='space')){e.preventDefault();view.zoom=Math.max(.25,Math.min(8,(view.zoom||1)*Math.exp(-e.deltaY*.001)));const z=panel.querySelector('[data-display-zoom]');if(z)z.value=String(view.zoom);draw();}},{passive:false});canvas.addEventListener('pointerup',e=>{
   if(selectedModel!=='doppelacht'||!drag||Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>4)return;
   pickCell(e);
 });
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,()=>drag=null);

 const sceneSnapshot=()=>({schema:'halveth.integrated-scene/1.0',build:globalThis.HALVETH_BUILD,modelType:selectedModel,modelConfig:{...activeModelConfig},seed:20261117,modelTime,parameters:{...params},initialParameters:{...initialParameters},seekTarget,inputHistory:structuredClone(inputHistory),pendingInputs:structuredClone(pendingInputs),clock:clock.snapshot(),particles:particleModel?.snapshot()||null,wave:[...wave],velocity:[...wvel],view:{...view},integration:{stepSeconds:1/90,...(selectedModel==='doppelacht'?{sourceTimeOffset:spatialTimeOffset}:{})}});
 function useModel(name){if(!known(name))throw new RangeError('Unknown model');selectedModel=name;const selector=panel.querySelector('[data-model-select]');if(selector)selector.value=name;const config={seed:20261117,r0:Number(panel.querySelector('[data-initial-separation]')?.value||2.4),eccentricity:Number(panel.querySelector('[data-eccentricity]')?.value||0)};particleModel=createModel(name,name==='doppelacht'?spatialConfig:name==='material'?{seed:20261117}:config);activeModelConfig=name==='doppelacht'?{...spatialConfig}:name==='material'?{}:{r0:config.r0,eccentricity:config.eccentricity};if(name==='doppelacht')setupSpatialView();if(isMaterial(name))view.style='rods';else if(['rods','orientation','field'].includes(view.style))view.style='sharp';const style=panel.querySelector('[data-style-select]');if(style)style.value=view.style;syncSpatial();reset();for(const key of ['merge','damping','frequency','sourceMinus','sourcePlus'])if(ctrl(key))ctrl(key).disabled=name!=='experimental';if(ctrl('referenceRate'))ctrl('referenceRate').disabled=['experimental','material','doppelacht'].includes(name);if(panel.querySelector('[data-reference-seek]'))panel.querySelector('[data-reference-seek]').disabled=['experimental','material','doppelacht'].includes(name);if(panel.querySelector('[data-initial-separation]'))panel.querySelector('[data-initial-separation]').disabled=['experimental','material','doppelacht'].includes(name);if(panel.querySelector('[data-eccentricity]'))panel.querySelector('[data-eccentricity]').disabled=name!=='newton';showStatus();}
 function seek(percent){if(!particleModel||['experimental','material','doppelacht'].includes(selectedModel))throw new RangeError('Seek is reference-only');if(!Number.isFinite(percent)||percent<0||percent>100)throw new RangeError('Invalid seek');reset();seekTarget=percent;const end=selectedModel==='inspiral'?HalvethInspiral.inspiralDuration(particleModel.snapshot({field:false}).parameters):100;particleModel.step(Math.max(Number.EPSILON,end*percent/100),{});modelTime=particleModel.snapshot({field:false}).time;running=false;last=null;draw();showStatus();}
 const previousSources={"lab.js":"0edfe6c0d2d00ef6dda6abb0016ac3eb8dd9d67d17cf0f497328e27ab112cf9c","studio.js":"2106283cb5353f0b541b89233cc957309aa490c8927514e6ed6992bfc9288734","fixed-clock.js":"f4c1d2cfef9b2dbe2c4b78a8f4c832304174543f3a743cbfd0adb22b2ab30e92","particle-view.js":"73de5fe492822bd6ea841c0364cc3d318994620a7a5bc355426b17076f4b25bf","particle-dynamics.js":"cbf8d00c18ffcb8fc4d2d0416562b9bbedc7fdba07a998b14bf93bd9e76ab701","reference-physics.js":"ae587d572d23818fb3974f7644abe150ca246e492a71f4e46d19352d935e06c9","models.js":"8f4c0d9174a53681bab50bb74549fd28c4cd44c7c9569d4c3f4086c5fdb61383","movement-ui.js":"fc6a01927cb10a2f545bb5ba04ebd369cdce2e54e379259a00a562b37e4275bd","material-engine.js":"7f6225646e7296259e4a4ffb66497d23f061801b349db05d8d7fc7f42575e19f","material-model.js":"4f8669e83a0ab22c038f2f05f38e347c488c4ae7d949a051df8e81197ede3bf2","material-view.js":"940304fef5da33b7a90f39c7215d09c60ae10a4fa19b96d90b1be56823446203"};
 const previousD8Sources={"lab.js":"86d78c6702f73a02ca48d4bd6655b57c004238c1f6a1d4c8271415131e688df7","studio.js":"ce7af8ca82ef65f7149cb1d1a347173b02e4a7412374ee2bccc2a06a1de6e029","fixed-clock.js":"f4c1d2cfef9b2dbe2c4b78a8f4c832304174543f3a743cbfd0adb22b2ab30e92","particle-view.js":"73de5fe492822bd6ea841c0364cc3d318994620a7a5bc355426b17076f4b25bf","particle-dynamics.js":"cbf8d00c18ffcb8fc4d2d0416562b9bbedc7fdba07a998b14bf93bd9e76ab701","reference-physics.js":"ae587d572d23818fb3974f7644abe150ca246e492a71f4e46d19352d935e06c9","models.js":"8f4c0d9174a53681bab50bb74549fd28c4cd44c7c9569d4c3f4086c5fdb61383","movement-ui.js":"fc6a01927cb10a2f545bb5ba04ebd369cdce2e54e379259a00a562b37e4275bd","material-engine.js":"7f6225646e7296259e4a4ffb66497d23f061801b349db05d8d7fc7f42575e19f","material-model.js":"072d81f3ff8020647fa84695912e7cac9cb952846a99f18c57021b8f157a3870","material-view.js":"940304fef5da33b7a90f39c7215d09c60ae10a4fa19b96d90b1be56823446203","doppelacht.js":"f11a52b996a7fc9e9c84890c63fd09c4bd47406550477d1e45aad257b21b6b9d","doppelacht-view.js":"61f84135a3ac7c4a72ee7d785e596afac36223238e442eeda52efe4b94d1586e","doppelacht-source.js":"c43fefcede392039dad4fb3444cadbe8504e45df4c68eb22a5186c57c7d06734"};
 const previousShellSources={"lab.js":"3a76921aadc898fa3318105f3b0263ce7836f42c6c57d93f0ff9933cd40a7b28","studio.js":"00928366e747ea212fb0bac4512ac37f242214994a2a6dbe336a256ce9a996e3","fixed-clock.js":"f4c1d2cfef9b2dbe2c4b78a8f4c832304174543f3a743cbfd0adb22b2ab30e92","particle-view.js":"73de5fe492822bd6ea841c0364cc3d318994620a7a5bc355426b17076f4b25bf","particle-dynamics.js":"cbf8d00c18ffcb8fc4d2d0416562b9bbedc7fdba07a998b14bf93bd9e76ab701","reference-physics.js":"ae587d572d23818fb3974f7644abe150ca246e492a71f4e46d19352d935e06c9","models.js":"8f4c0d9174a53681bab50bb74549fd28c4cd44c7c9569d4c3f4086c5fdb61383","movement-ui.js":"fc6a01927cb10a2f545bb5ba04ebd369cdce2e54e379259a00a562b37e4275bd","material-engine.js":"7f6225646e7296259e4a4ffb66497d23f061801b349db05d8d7fc7f42575e19f","material-model.js":"072d81f3ff8020647fa84695912e7cac9cb952846a99f18c57021b8f157a3870","material-view.js":"940304fef5da33b7a90f39c7215d09c60ae10a4fa19b96d90b1be56823446203","doppelacht.js":"b67b0a71998812de55bdb2b068275b5835959f9fff4f597ca601471a1ff44e85","doppelacht-view.js":"57cdf163318a039ebd0f397f423836071fe3f3231e9179d15a13579ffa9821eb","doppelacht-source.js":"c09521869914d1707c54787075a5bad9a104b8e276a8290ace02b2f7f9295b41"};
 function matchesSources(actual,expected){return !!actual&&Object.keys(actual).length===Object.keys(expected).length&&Object.entries(expected).every(([key,value])=>actual[key]===value);}
 async function replaySpatial(data,packet,signal){
   const native=data.schema==='halveth.integrated-scene/1.0';
   if(native&&(data.modelType!=='doppelacht'||data.build?.releaseId!==globalThis.HALVETH_BUILD.releaseId||
     !(matchesSources(data.build?.sources,globalThis.HALVETH_BUILD.sources)||
       (packet.source===previousShellSources['doppelacht.js']&&matchesSources(data.build?.sources,previousShellSources))||
       (packet.source===previousD8Sources['doppelacht.js']&&!Object.hasOwn(packet.configuration,'layout')&&matchesSources(data.build?.sources,previousD8Sources)))))throw Error('Unpassende Quellen der 3D-Szene');
   const next=spatial.create(packet.configuration);
   await next.restoreAsync(packet,{signal,onProgress:({tick,total})=>{
     replayStatus="Import wird geprüft: "+(total?Math.floor(100*tick/total):100)+" %";showStatus();
   }});
   signal.throwIfAborted();
   const importedView=native?data.view:null;
   if(importedView&&(!Number.isFinite(importedView.yaw)||!Number.isFinite(importedView.pitch)||
       !Number.isFinite(importedView.zoom)||importedView.zoom<.25||importedView.zoom>8||
       !Number.isFinite(importedView.symbolScale)||importedView.symbolScale<.3||importedView.symbolScale>3||
       (Object.hasOwn(importedView,'distance')&&(!spatialView.validDistance(importedView.distance)||packet.configuration.layout!=='shell'))||
       (packet.configuration.layout==='shell'&&!Object.hasOwn(importedView,'distance'))||
       (importedView.followId!=null&&!packet.materialCells.some(c=>c.id===importedView.followId))))throw Error('Ungültige Beobachtungskamera');
   if(native){
     if(!Number.isFinite(data.modelTime)||Math.abs(data.modelTime-next.time)>1e-9||!Number.isInteger(data.clock?.steps)||
        data.clock.steps<0||(!Number.isFinite(data.integration?.sourceTimeOffset??0)||Math.abs((data.integration?.sourceTimeOffset??0)+data.clock.steps/90-next.time-packet.credit)>1e-8)||
        !Number.isFinite(data.clock.backlogSeconds)||data.clock.backlogSeconds<0)throw Error('Ungültige Versuchsuhr');
     if(JSON.stringify(spatial.configuration(data.modelConfig))!==JSON.stringify(next.snapshot().configuration)||
        !data.view||!['rods','orientation','field','sharp','flow','raster','cells','space'].includes(data.view.style)||
        !['rgb','bluegold'].includes(data.view.palette)||typeof data.view.annotations!=='boolean'||
        !Number.isSafeInteger(data.clock.steps)||data.seekTarget!==0)throw Error('Unpassender Szenenauftrag');
     function valid(name,value){const rule=schema[name];return Object.hasOwn(schema,name)&&Number.isFinite(value)&&value>=rule.min&&value<=rule.max;}
     for(const values of [data.initialParameters,data.parameters]){
       if(!values||Object.keys(values).length!==Object.keys(schema).length||!Object.keys(schema).every(k=>valid(k,values[k])))throw Error('Ungültige Eingaben');
     }
     const expected={...data.initialParameters};
     for(const [pending,events]of [[false,data.inputHistory],[true,data.pendingInputs]]){
       if(!Array.isArray(events)||events.length>50000)throw Error('Ungültiger Eingabeverlauf');
       let prior=-1;
       for(const e of events){
         if(!e||!Number.isSafeInteger(e.step)||e.step<0||e.step<prior||(pending?e.step<data.clock.steps:e.step>data.clock.steps)||!valid(e.name,e.value))throw Error('Ungültiger Eingabeverlauf');
         prior=e.step;if(!pending)expected[e.name]=e.value;
       }
     }
     if(!Object.keys(schema).every(k=>expected[k]===data.parameters[k]))throw Error('Parameter und Eingabeverlauf widersprechen sich');
   }
   // A foreign host contributes the material instant, while this host starts its own UI clock.
   const importedClock=native?data.clock:null;
   const offset=native?(data.integration?.sourceTimeOffset??0):next.time+packet.credit;
   signal.throwIfAborted();
   selectedModel='doppelacht';particleModel=next;spatialConfig={...packet.configuration};activeModelConfig=native?{...data.modelConfig}:{...spatialConfig};
   clock.reset();spatialTimeOffset=offset;if(importedClock)clock.restore(importedClock);
   modelTime=next.time;running=false;hasStarted=true;last=null;seekTarget=0;inputHistory=[];pendingInputs=[];
   setupSpatialView();approach.stop();if(importedView)Object.assign(view,importedView);
   else if(spatialConfig.layout==='shell')view.distance=spatialView.overviewDistance;
   if(!native)initialParameters={...params};
   if(native){params={...data.parameters};initialParameters={...data.initialParameters};inputHistory=structuredClone(data.inputHistory);pendingInputs=structuredClone(data.pendingInputs);}
   for(const key of Object.keys(schema))if(ctrl(key))ctrl(key).value=String(params[key]);
   for(const key of ['merge','damping','frequency','sourceMinus','sourcePlus','referenceRate'])if(ctrl(key))ctrl(key).disabled=true;
   for(const selector of ['[data-initial-separation]','[data-eccentricity]','[data-reference-seek]']){const el=panel.querySelector(selector);if(el)el.disabled=true;}
   for(const [selector,key]of [['[data-style-select]','style'],['[data-display-zoom]','zoom'],['[data-symbol-scale]','symbolScale']]){const el=panel.querySelector(selector);if(el)el.value=String(view[key]);}
   syncSpatial();draw();showStatus();return sceneSnapshot();
 }
 function beginReplay(){cancelReplay();const request=new AbortController();replayController=request;replayStatus="Import wird geprüft";showStatus();return request;}
 async function replay(data,request=beginReplay()){
  request.signal.throwIfAborted();
  try{const result=await replayData(structuredClone(data),request.signal);if(replayController===request)replayStatus="";return result;}
  catch(error){if(replayController===request)replayStatus=error.name==="AbortError"?"":"Wiedergabe abgelehnt: "+error.message;throw error;}
  finally{if(replayController===request){replayController=null;showStatus();}}
 }
 async function replayData(data,signal){
  signal.throwIfAborted();
  const packet=spatial?.packetFrom(data);if(packet)return replaySpatial(data,packet,signal);
  if(!data||data.schema!=='halveth.integrated-scene/1.0'||!HALVETHModels.modes.includes(data.modelType)||!Number.isInteger(data.clock?.steps)||data.clock.steps<0||data.clock.steps>50000)throw new RangeError('Ungültiger oder zu großer Wiedergabeauftrag');
  const build=globalThis.HALVETH_BUILD;if(!build||data.build?.releaseId!==build.releaseId||(!matchesSources(data.build.sources,build.sources)&&!matchesSources(data.build.sources,previousSources)&&!matchesSources(data.build.sources,previousD8Sources)&&!matchesSources(data.build.sources,previousShellSources)))throw new RangeError('Wiedergabe gehört zu einem anderen Quellstand');
  if(data.modelConfig&&(typeof data.modelConfig!=='object'||Array.isArray(data.modelConfig)||Object.keys(data.modelConfig).some(name=>!['r0','eccentricity'].includes(name))))throw new RangeError('Ungültige Modellkonfiguration');
  const initial={...data.initialParameters},history=data.inputHistory,pending=data.pendingInputs||[];
  for(const [name,spec]of Object.entries(schema))if(!Object.hasOwn(initial,name)||!Number.isFinite(initial[name])||initial[name]<spec.min||initial[name]>spec.max)throw new RangeError('Ungültige Anfangsparameter');
  if(Object.keys(initial).some(name=>!Object.hasOwn(schema,name))||!Array.isArray(history)||history.length>10000||!Array.isArray(pending)||pending.length>10000)throw new RangeError('Ungültige Eingabefolge');
  for(const entry of [...history,...pending])if(!entry||!Object.hasOwn(schema,entry.name)||!Number.isFinite(entry.value)||entry.value<schema[entry.name].min||entry.value>schema[entry.name].max||!Number.isInteger(entry.step)||entry.step<0)throw new RangeError('Ungültiger Eingabeschritt');
  if(history.some((entry,i)=>i&&entry.step<history[i-1].step)||!Number.isFinite(data.clock.backlogSeconds)||data.clock.backlogSeconds<0)throw new RangeError('Ungültige Reihenfolge oder Restzeit');
  const next=HALVETHModels.create(data.modelType,data.modelType==='material'?{seed:20261117}:{seed:20261117,...data.modelConfig}),parameters={...initial};let cursor=0;
  if(data.seekTarget){if(['experimental','material','doppelacht'].includes(data.modelType)||!Number.isFinite(data.seekTarget)||data.seekTarget<0||data.seekTarget>100)throw new RangeError('Ungültige Referenzzeit');next.step((data.modelType==='inspiral'?HalvethInspiral.inspiralDuration(next.snapshot({field:false}).parameters):100)*data.seekTarget/100,{});}
  for(let step=0;step<data.clock.steps;step++){
   while(cursor<history.length&&history[cursor].step<=step){const entry=history[cursor++];parameters[entry.name]=entry.value;}
   if(next.diagnostics().status==='RUNNING')next.step((1/90)*(['experimental','material','doppelacht'].includes(data.modelType)?1:parameters.referenceRate),data.modelType==='experimental'?{attraction:parameters.merge/36,damping:parameters.damping,frequency:parameters.frequency,sourceMinus:parameters.sourceMinus,sourcePlus:parameters.sourcePlus,fieldFeedback:.03}:{});
   if(step&&step%512===0){await new Promise(resolve=>setTimeout(resolve,0));signal.throwIfAborted();}
  }
  while(cursor<history.length&&history[cursor].step<=data.clock.steps){const entry=history[cursor++];parameters[entry.name]=entry.value;}
  if(data.modelType==='material'&&JSON.stringify(next.snapshot())!==JSON.stringify(data.particles))throw new RangeError('Material-Wiedergabe weicht vom gespeicherten Rechenzustand ab');
  signal.throwIfAborted();
  particleModel=next;selectedModel=data.modelType;activeModelConfig=data.modelType==='material'?{}:{r0:['newton','inspiral'].includes(data.modelType)?next.snapshot({field:false}).parameters.r0:data.modelConfig?.r0??2.4,eccentricity:data.modelConfig?.eccentricity??0};params=parameters;initialParameters=initial;inputHistory=structuredClone(history);pendingInputs=structuredClone(pending);seekTarget=data.seekTarget||0;clock.restore(data.clock);modelTime=next.snapshot({field:false}).time;running=false;last=null;
  if(data.view){for(const name of ['yaw','pitch','zoom','symbolScale'])if(data.view[name]!==undefined&&Number.isFinite(data.view[name]))view[name]=data.view[name];if(['rods','orientation','field','sharp','flow','raster','cells','space'].includes(data.view.style))view.style=data.view.style;if(['rgb','bluegold'].includes(data.view.palette))view.palette=data.view.palette;if(typeof data.view.annotations==='boolean')view.annotations=data.view.annotations;}
  for(const name of Object.keys(schema))if(ctrl(name))ctrl(name).value=String(params[name]);const selector=panel.querySelector('[data-model-select]');if(selector)selector.value=selectedModel;
  for(const [selector,key]of [['[data-initial-separation]','r0'],['[data-eccentricity]','eccentricity']]){const element=panel.querySelector(selector);if(element&&activeModelConfig[key]!==undefined)element.value=String(activeModelConfig[key]);}
  for(const key of ['merge','damping','frequency','sourceMinus','sourcePlus'])if(ctrl(key))ctrl(key).disabled=selectedModel!=='experimental';
  for(const selector of ['[data-reference-seek]','[data-initial-separation]','[data-control=referenceRate]']){const element=panel.querySelector(selector);if(element)element.disabled=['experimental','material','doppelacht'].includes(selectedModel);}
  const eccentricity=panel.querySelector('[data-eccentricity]');if(eccentricity)eccentricity.disabled=selectedModel!=='newton';
  for(const [selector,key]of [['[data-style-select]','style'],['[data-display-zoom]','zoom'],['[data-symbol-scale]','symbolScale'],['[data-material-palette]','palette']]){const element=panel.querySelector(selector);if(element&&view[key]!==undefined)element.value=String(view[key]);}
  const annotations=panel.querySelector('[data-core-annotations]');if(annotations)annotations.checked=view.annotations;const seekControl=panel.querySelector('[data-reference-seek]');if(seekControl)seekControl.value=String(seekTarget);
  syncSpatial();draw();showStatus();return sceneSnapshot();
 }
 if(particleModel){
  panel.querySelector('[data-model-select]')?.addEventListener('change',e=>useModel(e.target.value));
  for(const name of ['data-initial-separation','data-eccentricity'])panel.querySelector('['+name+']')?.addEventListener('change',()=>useModel(selectedModel));
  panel.querySelector('[data-style-select]')?.addEventListener('change',e=>{view.style=e.target.value;draw();});
  panel.querySelector('[data-reference-seek]')?.addEventListener('input',e=>{if(!['experimental','material','doppelacht'].includes(selectedModel))seek(Number(e.target.value));});
  for(const [selector,key,convert]of [['[data-display-zoom]','zoom',Number],['[data-symbol-scale]','symbolScale',Number],['[data-material-palette]','palette',String]])panel.querySelector(selector)?.addEventListener('input',e=>{view[key]=convert(e.target.value);draw();});
  panel.querySelector('[data-core-annotations]')?.addEventListener('change',e=>{view.annotations=e.target.checked;draw();});
  button('import')?.addEventListener('click',()=>panel.querySelector('[data-replay-file]')?.click());
  panel.querySelector('[data-replay-file]')?.addEventListener('change',async e=>{
   const file=e.target.files[0],request=beginReplay();
   try{if(!file||file.size>4*1024*1024)throw new RangeError('Datei zu groß');await replay(JSON.parse(await file.text()),request);}
   catch(error){if(replayController===request&&error.name!=="AbortError"){replayStatus='Wiedergabe abgelehnt: '+error.message;showStatus();}}
   finally{if(replayController===request)replayController=null;if(!replayController)e.target.value='';}
  });
  button('fullscreen')?.addEventListener('click',()=>{if(document.fullscreenElement)document.exitFullscreen();else panel.requestFullscreen?.();});
  button('movie')?.addEventListener('click',()=>{const event=new CustomEvent('halveth-record-scene',{detail:{canvas,scene:sceneSnapshot,draw}});window.dispatchEvent(event);});
 }
 const scenes=globalThis.HALVETHScenes||(globalThis.HALVETHScenes=[]);
 scenes.push({canvas,mode,snapshot:sceneSnapshot,draw,reset,useModel,seek,replay,setView:next=>{if(Object.hasOwn(next,'distance')){if(selectedModel!=='doppelacht'||spatialConfig.layout!=='shell'||!spatialView.validDistance(next.distance))throw RangeError('Invalid viewing distance');approach.stop();}Object.assign(view,next);syncSpatial();draw();},setParameter:(name,value)=>{setParameter(name,value,clock.snapshot().steps);if(ctrl(name))ctrl(name).value=String(value);},advance:seconds=>{if(!Number.isFinite(seconds)||seconds<0)throw new RangeError('Invalid elapsed');clock.advance(seconds);showStatus();},pause:()=>{running=false;last=null;showStatus();},resume:()=>{if(particleModel?.diagnostics().status==='MODEL_LIMIT')return;hasStarted=true;running=true;last=null;showStatus();}});
 let lastLanguage=document.documentElement.lang;document.addEventListener('halveth-language',()=>{if(document.documentElement.lang!==lastLanguage){lastLanguage=document.documentElement.lang;showStatus();}});
 new ResizeObserver(resize).observe(canvas);reset();syncSpatial();showStatus();if(particleModel){for(const selector of ['[data-initial-separation]','[data-eccentricity]','[data-reference-seek]','[data-control=referenceRate]']){const element=panel.querySelector(selector);if(element)element.disabled=true;}}requestAnimationFrame(frame);
 }
})();
