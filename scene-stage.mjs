// Original presentation controller. Source model: MIT; see LICENSES.md.
import {source,observeXY,distinct,project} from './assets/endeck-model.mjs';
const NS='http://www.w3.org/2000/svg';
const messages={de:(a,b)=>`${a} Bildort${a===1?'':'e'} · ${b} Raumorte · 4 erhaltene IDs`,en:(a,b)=>`${a} image position${a===1?'':'s'} · ${b} spatial positions · 4 retained IDs`,ru:(a,b)=>`${a} положений на изображении · ${b} в пространстве · 4 сохранённых ID`};
export function viewAt(time){
  const points=source('projection',time);
  return {flat:observeXY(points),space:points.map(p=>project(p,64)),imagePositions:distinct(points,['x','y']),spacePositions:distinct(points,['x','y','z'])};
}
function draw(doc,svg,points){
  const element=(name,attributes,text)=>{const node=doc.createElementNS(NS,name);for(const [key,value] of Object.entries(attributes))node.setAttribute(key,String(value));if(text!==undefined)node.textContent=text;return node;};
  const positions=points.map(p=>({...p,px:100+50*p.x,py:100-50*p.y}));
  const groups=new Map();for(const p of positions){const key=`${p.x}|${p.y}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}
  const nodes=[element('path',{d:positions.map((p,i)=>`${i?'L':'M'}${p.px} ${p.py}`).join(' ')+'Z',class:'demo-trace'})];
  for(const group of groups.values()){
    const p=group[0],label=group.map(x=>x.id).join(' ');
    nodes.push(element('circle',{cx:p.px,cy:p.py,r:group.length===1?7:12,class:`demo-point-${p.id.toLowerCase()}`,'data-point-ids':label}));
    nodes.push(element('text',{x:p.px+14,y:p.py-14,class:'demo-label'},label));
  }
  svg.replaceChildren(...nodes);
}
export function mountSceneDemo(doc,host=globalThis){
  const root=doc.getElementById('scene-demo');if(!root)return null;
  const time=doc.getElementById('scene-time'),output=doc.getElementById('scene-time-value'),play=doc.getElementById('scene-play'),end=doc.getElementById('scene-end'),result=doc.getElementById('scene-result');
  const flat=doc.getElementById('scene-flat'),space=doc.getElementById('scene-space');
  const describe=messages[root.dataset.lang];if(!describe)throw new RangeError('Unknown scene language');
  let current=Number(time.value)/1000,playing=false,frame=null,last=null,visible=true;
  const media=host.matchMedia('(prefers-reduced-motion: reduce)');
  function render(announce=false){const view=viewAt(current);draw(doc,flat,view.flat);draw(doc,space,view.space);output.value=current.toLocaleString(root.dataset.lang,{minimumFractionDigits:3,maximumFractionDigits:3});time.value=String(Math.round(current*1000));root.dataset.imagePositions=String(view.imagePositions);root.dataset.spacePositions=String(view.spacePositions);if(announce)result.textContent=describe(view.imagePositions,view.spacePositions);}
  function stop(announce=true){playing=false;last=null;if(frame!==null)host.cancelAnimationFrame(frame);frame=null;root.dataset.state='still';play.setAttribute('aria-pressed','false');play.textContent=play.dataset.play;if(announce)render(true);}
  function tick(now){frame=null;if(!playing||doc.hidden||!visible){stop(false);return;}if(last!==null)current=Math.min(1,current+Math.min(.1,Math.max(0,(now-last)/1000))/8);last=now;render();if(current===1){stop();return;}frame=host.requestAnimationFrame(tick);}
  time.addEventListener('input',()=>{stop(false);current=Number(time.value)/1000;render(true);});
  end.addEventListener('click',()=>{stop(false);current=1;render(true);});
  play.addEventListener('click',()=>{if(playing){stop();return;}if(current===1)current=0;playing=true;root.dataset.state='playing';play.setAttribute('aria-pressed','true');play.textContent=play.dataset.pause;last=null;render();frame=host.requestAnimationFrame(tick);});
  doc.addEventListener('visibilitychange',()=>{if(doc.hidden)stop();});
  media.addEventListener('change',()=>{if(media.matches)stop();});
  if(host.IntersectionObserver)new host.IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting===true;if(!visible)stop();}).observe(root);
  render();
  return {stop,get time(){return current;},get playing(){return playing;}};
}
if(typeof document!=='undefined')mountSceneDemo(document);
