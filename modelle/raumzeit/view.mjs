import {SCENE_IDS,frameFor,getScene} from './core.mjs';

const root=document.getElementById('state-atlas');
const context=root.getContext('2d',{alpha:false});
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const buttons=[...document.querySelectorAll('[data-scene]')];
const readings=[...document.querySelectorAll('[data-scene-reading]')];
const index=document.getElementById('scene-index');
const kind=document.getElementById('scene-kind');
const title=document.getElementById('scene-title');
const formula=document.getElementById('scene-formula');
let active=SCENE_IDS.includes(location.hash.slice(1))?location.hash.slice(1):SCENE_IDS[0];
let width=0,height=0,animationId=0;

function size(){
  const box=root.getBoundingClientRect(),scale=Math.min(window.devicePixelRatio||1,2);
  width=Math.max(1,Math.round(box.width*scale));height=Math.max(1,Math.round(box.height*scale));
  if(root.width!==width||root.height!==height){root.width=width;root.height=height;}
  context.setTransform(scale,0,0,scale,0,0);width=box.width;height=box.height;
}
function clear(){
  const gradient=context.createLinearGradient(0,0,width,height);
  gradient.addColorStop(0,'#071c18');gradient.addColorStop(.52,'#0b1730');gradient.addColorStop(1,'#18112a');
  context.fillStyle=gradient;context.fillRect(0,0,width,height);
  context.strokeStyle='rgba(202,243,219,.07)';context.lineWidth=1;
  for(let x=0;x<=width;x+=width/12){context.beginPath();context.moveTo(x,0);context.lineTo(x,height);context.stroke();}
  for(let y=0;y<=height;y+=height/8){context.beginPath();context.moveTo(0,y);context.lineTo(width,y);context.stroke();}
}
function drawLine(entry){
  if(entry.points.length<2)return;
  context.save();context.globalAlpha=entry.alpha??1;context.strokeStyle=entry.color;context.lineWidth=entry.width;context.lineJoin='round';context.lineCap='round';context.beginPath();
  entry.points.forEach((point,position)=>{const x=point.x*width,y=point.y*height;if(position===0)context.moveTo(x,y);else context.lineTo(x,y);});
  context.stroke();context.restore();
}
function drawRing(entry){
  context.save();context.globalAlpha=entry.alpha??1;context.strokeStyle=entry.color;context.lineWidth=entry.width;context.beginPath();context.ellipse(entry.x*width,entry.y*height,entry.r*width,entry.r*height,0,0,Math.PI*2);context.stroke();context.restore();
}
function drawDot(entry){
  context.save();context.globalAlpha=entry.alpha??1;context.fillStyle=entry.color;context.shadowColor=entry.color;context.shadowBlur=Math.max(4,entry.r*2);context.beginPath();context.arc(entry.x*width,entry.y*height,entry.r,0,Math.PI*2);context.fill();context.restore();
}
function draw(milliseconds){
  size();clear();
  const frame=frameFor(active,reduced.matches?0:milliseconds);
  frame.rings.forEach(drawRing);frame.lines.forEach(drawLine);frame.dots.forEach(drawDot);
  context.save();context.fillStyle='rgba(238,246,235,.72)';context.font='600 11px system-ui,sans-serif';context.fillText(frame.scene.kind.toUpperCase(),22,30);context.restore();
}
function renderReading(){
  const scene=getScene(active);
  index.textContent=scene.index;kind.textContent=scene.kind;title.textContent=scene.title;formula.textContent=scene.formula;
  root.setAttribute('aria-label','Animierte Modellfläche: '+scene.title);
  buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.scene===active)));
  readings.forEach(reading=>{reading.hidden=reading.dataset.sceneReading!==active;});
}
function choose(id,options={}){
  if(!SCENE_IDS.includes(id))return;
  active=id;renderReading();draw(performance.now());
  if(options.writeHash!==false&&location.hash!=='#'+id)history.replaceState(null,'','#'+id);
  if(options.focus)document.querySelector('[data-scene="'+id+'"]')?.focus();
}
buttons.forEach(button=>button.addEventListener('click',()=>choose(button.dataset.scene,{focus:true})));
window.addEventListener('hashchange',()=>choose(location.hash.slice(1),{writeHash:false}));
new ResizeObserver(()=>draw(performance.now())).observe(root);
reduced.addEventListener?.('change',()=>draw(performance.now()));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)draw(performance.now());});
function animate(milliseconds){draw(milliseconds);if(!reduced.matches&&!document.hidden)animationId=requestAnimationFrame(animate);}
renderReading();
if(reduced.matches)draw(0);else animationId=requestAnimationFrame(animate);
window.addEventListener('pagehide',()=>cancelAnimationFrame(animationId),{once:true});
