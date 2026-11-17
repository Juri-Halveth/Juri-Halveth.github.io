/* Read-only observation of the material state. Color, glyph scale and camera never enter the solver. */
(function(root){'use strict';
const paletteRGB=['#ff7373','#78e1a5','#79b8ff'],palettePair=['#85d3ff','#f0c991'];
function density(snapshot){
 const cells=snapshot.materialCells||Array.from({length:snapshot.config.particles},(_,p)=>{const i=snapshot.coreCount+p,b=4*i;return{id:snapshot.materialIds[p]||'M'+String(p).padStart(5,'0'),x:snapshot.y[b],y:snapshot.y[b+1],mass:snapshot.params.massCell};}),h=.48,C=10/(Math.PI*h*h),grid=new Map(),out=[];
 for(const p of cells){const k=Math.floor(p.x/h)+','+Math.floor(p.y/h);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(p);}
 for(const p of cells){const gx=Math.floor(p.x/h),gy=Math.floor(p.y/h);let value=0;for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(const q of grid.get((gx+dx)+','+(gy+dy))||[]){const r=Math.hypot(p.x-q.x,p.y-q.y);if(r<h)value+=q.mass*C*(1-r/h)**3;}out.push({id:p.id,value});}return out;
}
function draw(ctx,snapshot,view={},w=ctx.canvas.width,h=ctx.canvas.height){
 if(typeof view==='number'){const width=view,height=w,options=h;view=options||{};w=width;h=height;}
 if(!snapshot||!Array.isArray(snapshot.materialCells))throw Error('Material snapshot required');
 const mode=view.mode||view.style||'rods',zoom=view.zoom??1,symbolScale=view.symbolScale??1;
 if(!Number.isFinite(zoom)||zoom<=0||!Number.isFinite(symbolScale)||symbolScale<=0)throw Error('Invalid observation scale');
 const span=snapshot.rawEngine?.config.groups===3?17.8:11.8,scale=Math.min(w/span,h/(span*.68))*zoom,cx=w/2-(view.x||0)*scale,cy=h/2+(view.y||0)*scale;
 const defaultProject=point=>{const yaw=view.yaw||0,pitch=view.pitch||0,x=point.x*Math.cos(yaw),z=-point.x*Math.sin(yaw),y=point.y*Math.cos(pitch)-z*Math.sin(pitch),depth=point.y*Math.sin(pitch)+z*Math.cos(pitch);return{x:cx+x*scale,y:cy-y*scale,depth,branch:'primary'};};
 const project=(point,id)=>{let p=view.project?(view.projectCoordinates?view.project(point.x,point.y,point.z||0):view.project(point,id)):defaultProject(point);if(!Array.isArray(p))p=p?[p]:[];return p.filter(q=>q&&Number.isFinite(q.x)&&Number.isFinite(q.y)&&q.visible!==false).map(q=>({...q,depth:q.depth??q.d??0,branch:q.branch??'primary'}));};
 const color=p=>(view.colorMode||view.palette)==='rgb'?paletteRGB[p.channel]:palettePair[p.sourceLabel];
 const observations=[],rho=(['cells','densitycells','density','field','flow','sharp'].includes(mode))?density(snapshot):null,rhoMap=rho?new Map(rho.map(q=>[q.id,q.value])):null;
 ctx.save();try{
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  if(view.background!==false){ctx.fillStyle='#05080f';ctx.fillRect(0,0,w,h);const bg=ctx.createRadialGradient(w*.5,h*.5,0,w*.5,h*.5,Math.max(w,h)*.6);bg.addColorStop(0,'#0c1927');bg.addColorStop(1,'#03050a');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);}
  ctx.lineCap='round';
  for(const p of snapshot.materialCells){
   const center=project(p,p.id),half=.08*symbolScale,ux=Math.cos(p.theta)*half,uy=Math.sin(p.theta)*half;
   const endsA=project({x:p.x-ux,y:p.y-uy,z:p.z||0},p.id),endsB=project({x:p.x+ux,y:p.y+uy,z:p.z||0},p.id);
   for(const q of center){
    if(q.x<-50||q.x>w+50||q.y<-50||q.y>h+50)continue;
    const a=endsA.find(e=>e.branch===q.branch),b=endsB.find(e=>e.branch===q.branch);if(!a||!b)continue;
    const len=Math.hypot(b.x-a.x,b.y-a.y),densityValue=rhoMap?.get(p.id)||0;
    const obs={id:p.id,x:q.x,y:q.y,depth:q.depth??0,branch:q.branch,observationId:q.observationId??p.id+'@'+q.branch,theta:p.theta,renderLength:len};observations.push(obs);
    ctx.strokeStyle=color(p);ctx.fillStyle=color(p);
    if(mode==='field'||mode==='flow'||mode==='sharp'){
     // Compact-support density is computed from actual cells. Each visible sample is centered on its cell.
     const radius=Math.max(1,len*(2.5+.1*Math.min(4,densityValue))),gradient=ctx.createRadialGradient(q.x,q.y,0,q.x,q.y,radius);gradient.addColorStop(0,color(p));gradient.addColorStop(1,'transparent');ctx.fillStyle=gradient;ctx.globalAlpha=Math.min(.34,.04+.11*densityValue);ctx.beginPath();ctx.arc(q.x,q.y,radius,0,2*Math.PI);ctx.fill();
     ctx.globalAlpha=.7;ctx.lineWidth=Math.max(.65,Math.min(2.5,len*.1));ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }else if(mode==='cells'||mode==='densitycells'||mode==='density'){
     const r=Math.max(.6,Math.min(len*.65,len*2.5*Math.sqrt(p.mass/Math.max(densityValue,1e-9))));ctx.globalAlpha=.75;ctx.beginPath();ctx.arc(q.x,q.y,r,0,2*Math.PI);ctx.fill();
    }else{
     ctx.globalAlpha=.85;ctx.lineWidth=Math.max(.7,Math.min(3,len*.12));ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
   }
  }
  if(view.annotations===true){for(const p of snapshot.coreAnnotations||[]){for(const q of project(p,p.id)){ctx.globalAlpha=.6;ctx.strokeStyle='#c3cbd7';ctx.lineWidth=1;ctx.beginPath();ctx.arc(q.x,q.y,3,0,Math.PI*2);ctx.stroke();if(view.labels!==false){ctx.font='11px system-ui';ctx.fillStyle='#aab9cc';ctx.fillText(p.id,q.x+6,q.y-5);}}}}
  if(view.labels!==false&&view.background!==false&&!view.cinema){ctx.globalAlpha=1;ctx.font='11px system-ui';ctx.fillStyle='#94a7bc';ctx.fillText('HALVETH MATERIAL · t '+snapshot.time.toFixed(2)+' · '+snapshot.materialCells.length+' bewegliche Zellen · '+((view.colorMode||view.palette)==='rgb'?'A/B/C Anzeigekanäle':'A/B Herkunftsfarben'),18,h-20);}
 }finally{ctx.restore();}
 return{scale,cx,cy,observations,density:rho,mode,palette:(view.colorMode||view.palette)==='rgb'?'observer RGB classes':'observer blue/gold origin labels'};
}
const api={draw,density};root.HALVETHMaterialView=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
