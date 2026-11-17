'use strict';
// Display sampling, source parameters and optical geometry stay independent.
// No network, evaluation of text, or writes to the user's existing projects.
const PI=Math.PI, TAU=2*PI;
function lookupRay(table,b){
  const xs=table.b,ys=table.phi;
  if(!Number.isFinite(b)||b<xs[0]||b>xs[xs.length-1]||Math.abs(b-1)<1e-5)return null;
  let lo=0,hi=xs.length-1;
  while(hi-lo>1){const m=(lo+hi)>>1;if(xs[m]<=b)lo=m;else hi=m;}
  if(ys[lo]===null||ys[hi]===null||(xs[lo]<1&&xs[hi]>1))return null;
  return ys[lo]+(ys[hi]-ys[lo])*(b-xs[lo])/(xs[hi]-xs[lo]);
}
function combinedSigma(source,device=0){
  if(!Number.isFinite(source)||!Number.isFinite(device)||source<=0||device<0)throw new Error('Invalid sigma');
  return Math.hypot(source,device);
}
function i0e(x){
  x=Math.abs(x);
  if(x<50){
    let term=1,sum=1;
    for(let k=1;k<=130;k++){term*=x*x/(4*k*k);sum+=term;if(term<sum*1e-16)break;}
    return Math.exp(-x)*sum;
  }
  // Large-x asymptotic expansion, stopped at six correction terms.
  let sum=1,term=1;
  for(let k=1;k<=6;k++){term*=(2*k-1)**2/(8*k*x);sum+=term;}
  return sum/Math.sqrt(TAU*x);
}
function nodePositions(p){
  const sum=p.weights.reduce((a,b)=>a+b,0);
  return p.weights.map((w,k)=>{const a=p.rotation_deg*PI/180+TAU*k/3;
    return{id:'MODEL-NODE-'+(k+1),x:p.radius_uas*Math.cos(a),y:p.radius_uas*Math.sin(a),weight:w/sum};});
}
function brightness(x,y,mode,p,device=0){
  const w=combinedSigma(p.width_uas,device),R=p.radius_uas,F=p.flux;
  const g=(dx,dy,s)=>Math.exp(-(dx*dx+dy*dy)/(2*s*s))/(TAU*s*s);
  const center=g(x,y,combinedSigma(p.center_width_uas,device));
  if(mode==='filled_center')return F*center;
  if(mode==='three_nodes')return F*nodePositions(p).reduce((v,n)=>v+n.weight*g(x-n.x,y-n.y,w),0);
  const r=Math.hypot(x,y),ring=Math.exp(-((r-R)**2)/(2*w*w))*i0e(r*R/(w*w))/(TAU*w*w);
  const f=mode==='ring_plus_center'?p.center_fraction:0;
  return F*((1-f)*ring+f*center);
}
function rayFor(px,py,size,mode,observer,fov,table,bending=true){
  const dx=(px-size/2)/(size/2),dy=-(py-size/2)/(size/2),r=Math.hypot(dx,dy);
  const angle=Math.atan(r*Math.tan(fov*PI/180));
  const M=1/(3*Math.sqrt(3));
  const scale=mode==='ellis'?Math.sqrt(observer*observer+1):observer/Math.sqrt(1-2*M/observer);
  const b=scale*Math.sin(angle),az=r===0?0:Math.atan2(dy,dx);
  if(!bending)return{b,side:'same',phi:PI-angle,az,geometry:'FLAT_REFERENCE'};
  const side=Math.abs(b-1)<1e-5?'critical':b<1?(mode==='ellis'?'other':'captured'):'same';
  return{b,side,phi:lookupRay(table,b),az,geometry:mode};
}
function makeCatalog(seed,count=1400){
  let state=seed>>>0;
  const rnd=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/4294967296;};
  const stars=[];
  for(let k=0;k<count;k++){
    const lon=rnd()*TAU,lat=Math.asin(2*rnd()-1),sigma=(.45+rnd()*1.2)*PI/511,amp=.3+2*rnd()**4;
    stars.push({id:`SKY-${seed}-${k}`,x:Math.cos(lat)*Math.cos(lon),y:Math.cos(lat)*Math.sin(lon),z:Math.sin(lat),sigma,amp});
  }
  return{seed,stars};
}
function skyIndex(catalog){
  const n=40,head=new Int32Array(n*n*n).fill(-1),next=new Int32Array(catalog.stars.length).fill(-1);
  const cell=x=>Math.max(0,Math.min(n-1,Math.floor((x+1)*n/2)));
  catalog.stars.forEach((s,i)=>{const k=(cell(s.z)*n+cell(s.y))*n+cell(s.x);next[i]=head[k];head[k]=i;});
  return{...catalog,n,head,next,cell};
}
function skyValue(index,nx,ny,nz,grid=false,band=true){
  const lat=Math.asin(Math.max(-1,Math.min(1,nz))),lon=Math.atan2(ny,nx);
  const plane=lat-(index.seed===37?.25:-.32)*Math.sin(lon+.7);
  let value=band?.006+.12*Math.exp(-plane*plane/.025)*(.6+.4*Math.sin(lon*3+.3)**2):.001;
  const {n,head,next,cell,stars}=index,cx=cell(nx),cy=cell(ny),cz=cell(nz);
  // Every nonzero truncated star lies within one neighbour bin (radius < .041).
  for(let z=Math.max(0,cz-1);z<=Math.min(n-1,cz+1);z++)
    for(let y=Math.max(0,cy-1);y<=Math.min(n-1,cy+1);y++)
      for(let x=Math.max(0,cx-1);x<=Math.min(n-1,cx+1);x++){
        let i=head[(z*n+y)*n+x];
        while(i!==-1){const s=stars[i],d2=(nx-s.x)**2+(ny-s.y)**2+(nz-s.z)**2,q=d2/(s.sigma*s.sigma);
          if(q<16){const taper=q<=9?1:((16-q)/7)**2*(3-2*(16-q)/7);value+=s.amp*Math.exp(-q/2)*taper;}i=next[i];}
      }
  if(grid){const meridian=Math.abs(Math.sin(12*lon))*Math.cos(lat),parallel=Math.abs(Math.sin(12*lat));
    if(Math.min(meridian,parallel)<.014)value+=.55;}
  return value;
}
function imageCoordinate(px,py,size,span,cx=0,cy=0){return{x:(px-size/2)*span/size+cx,y:-(py-size/2)*span/size+cy};}
const API={lookupRay,combinedSigma,i0e,nodePositions,brightness,rayFor,makeCatalog,skyIndex,skyValue,imageCoordinate};
if(typeof module!=='undefined')module.exports=API;
if(typeof document!=='undefined'){
 const $=id=>document.getElementById(id),canvas=$('screen'),ctx=canvas.getContext('2d');
 const skies={same:skyIndex(makeCatalog(17)),other:skyIndex(makeCatalog(37))};
 const descriptions={
  three_nodes:['Drei gesetzte Lichtquellen','Quellgröße und Geräteunschärfe sind getrennte Größen. Die drei IDs bleiben beim Zoomen erhalten.','Modellquellen, keine erkannten Atome, Fusionsknoten oder Handshakes.'],
  ring:['Kontinuierlicher Ring','Das Ringprofil wird analytisch ausgewertet, nicht aus 64 leuchtenden Flecken zusammengesetzt.','Ein Helligkeitsmodell, keine Plasmasimulation.'],
  filled_center:['Leuchtendes Zentrum','Eine vorgegebene zentrale Gaußquelle. Ihre Ausdehnung ist eine Modellannahme, kein Fokusfehler.','Eine höhere Pixelzahl ändert nicht die Materie oder Quelle.'],
  ring_plus_center:['Ring plus zentrales Licht','Kontinuierlicher Ring und zentrale Quelle, getrennt von der zusätzlichen Geräteunschärfe.','Ein Helligkeitsmodell, kein Nachweis eines Durchgangs.'],
  schwarzschild:['Schwarzschild-Lichtwege','Dieselben tabellierten Strahlenintegrale wie in 0.1, jetzt mit kontinuierlich ausgewertetem Modellhimmel.','Kein Spin, Akkretionsgas oder tatsächliches Radiobild von Sgr A*.'],
  ellis:['Ellis-Lichtwege','Hypothetische Geometrie; die synthetischen Quell-IDs und Winkelgrößen bleiben beim Ändern der Auflösung fest.','Die andere Seite ist eine Modellannahme, keine Beobachtung.']
 };
 let generation=0,animationPhase=0,animTimer=null,settleTimer=null,resizeTimer=null,lastConfig=null;
 function configuration(){
  const mode=$('mode').value,isRay=['ellis','schwarzschild'].includes(mode);
  const p={...RADIO_PARAMS,radius_uas:+$('radius').value,width_uas:+$('width').value,rotation_deg:+$('rotation').value};
  const target=$('target').value,nodes=nodePositions(p),chosen=target==='center'?null:nodes[Number(target)];
  return{mode,isRay,p,span:140/Number($('zoom').value),cx:chosen?chosen.x:0,cy:chosen?chosen.y:0,
   device:+$('blur').value,exposure:+$('exposure').value,markers:$('markers').checked,
   observer:+$('observer').value,fov:+$('fov').value,angle:+$('skyAngle').value*PI/180+animationPhase,
   bending:$('bending').checked,other:$('otherLight').checked,grid:$('grid').checked,band:$('band').checked};
 }
 function requestedSize(preview=false){
  if(preview)return 480;
  if($('resolution').value!=='auto')return Number($('resolution').value);
  return Math.min(2048,Math.max(720,Math.ceil(canvas.getBoundingClientRect().width*(window.devicePixelRatio||1))));
 }
 function prepareBrightness(c){
  const w=combinedSigma(c.p.width_uas,c.device),cw=combinedSigma(c.p.center_width_uas,c.device),nodes=nodePositions(c.p);
  // Precomputed 1-D radial profile makes full-resolution ring evaluation cheap.
  const maxR=Math.hypot(Math.abs(c.cx)+c.span/2,Math.abs(c.cy)+c.span/2)+1,step=Math.min(w/40,.01);
  const length=Math.ceil(maxR/step)+2,radial=new Float64Array(length);
  if(c.mode==='ring'||c.mode==='ring_plus_center')for(let i=0;i<length;i++){
   const r=i*step,R=c.p.radius_uas;radial[i]=Math.exp(-((r-R)**2)/(2*w*w))*i0e(r*R/(w*w))/(TAU*w*w);}
  return(x,y)=>{
   const center=Math.exp(-(x*x+y*y)/(2*cw*cw))/(TAU*cw*cw);
   if(c.mode==='filled_center')return c.p.flux*center;
   if(c.mode==='three_nodes'){
    let sum=0;for(const n of nodes)sum+=n.weight*Math.exp(-((x-n.x)**2+(y-n.y)**2)/(2*w*w))/(TAU*w*w);
    return c.p.flux*sum;
   }
   const z=Math.hypot(x,y)/step,i=Math.floor(z),f=z-i,ring=(1-f)*radial[i]+f*radial[i+1];
   const frac=c.mode==='ring_plus_center'?c.p.center_fraction:0;
   return c.p.flux*((1-frac)*ring+frac*center);
  };
 }
 function updateLabels(c){
  $('radio').hidden=c.isRay;$('rays').hidden=!c.isRay;
  const d=descriptions[c.mode];$('modelName').textContent=d[0];$('description').textContent=d[1];$('limits').textContent=d[2];
  for(const [id,out]of[['radius','radiusOut'],['width','widthOut'],['rotation','rotOut'],['fov','fovOut'],['skyAngle','skyOut'],['blur','blurOut'],['zoom','zoomOut'],['exposure','exposureOut']])$(out).textContent=$(id).value;
  $('otherLight').disabled=c.mode!=='ellis'||!c.bending;
  $('markers').disabled=c.isRay;
 }
 function render(preview=false){
  const token=++generation,c=configuration(),size=requestedSize(preview),start=performance.now();
  updateLabels(c);const buf=ctx.createImageData(size,size),B=c.isRay?null:prepareBrightness(c);
  const table=c.isRay?RAY_TABLES[c.mode][String(c.observer)]:null,ca=Math.cos(c.angle),sa=Math.sin(c.angle);
  let row=0,unresolved=0,saturated=0;
  window.LAB_BUSY=true;
  $('renderStatus').textContent=`Berechne ${size} × ${size} direkt aus dem Modell …`;
  function chunk(){
   if(token!==generation)return;
   const until=performance.now()+12;
   do{
    for(let x=0;x<size;x++){
     let I=0,invalid=false;
     if(c.isRay){const r=rayFor(x+.5,row+.5,size,c.mode,c.observer,c.fov,table,c.bending);
      if(r.phi===null&&r.side!=='captured'){unresolved++;invalid=true;}
      if(r.phi!==null&&r.side!=='captured'&&(r.side!=='other'||c.other)){
       const nx=Math.sin(r.phi)*Math.cos(r.az),ny=Math.sin(r.phi)*Math.sin(r.az),nz=Math.cos(r.phi);
       I=skyValue(skies[r.side],ca*nx+sa*nz,ny,-sa*nx+ca*nz,c.grid,c.band);
      }
     }else{
      const q=imageCoordinate(x+.5,row+.5,size,c.span,c.cx,c.cy);I=B(q.x,q.y)*450;
     }
     const k=4*(row*size+x),value=invalid?(((x+row)&4)?40:80):Math.round(255*(1-Math.exp(-Math.max(0,I)*c.exposure))**.6);
     if(value>=254)saturated++;
     buf.data[k]=buf.data[k+1]=buf.data[k+2]=value;buf.data[k+3]=255;
    }
    row++;
   }while(row<size&&performance.now()<until);
   if(row<size){$('renderStatus').textContent=`${size} × ${size} · ${Math.round(row/size*100)} %`;setTimeout(chunk,0);return;}
   if(token!==generation)return;
   canvas.width=size;canvas.height=size;ctx.putImageData(buf,0,0);
   if(c.markers&&!c.isRay){
    const nodes=c.mode==='three_nodes'?nodePositions(c.p):c.mode==='filled_center'?[{id:'MODEL-CENTER',x:0,y:0}]:[];
    ctx.strokeStyle='#ffffff';ctx.fillStyle='#ffffff';ctx.font=`${Math.max(12,size/75)}px monospace`;ctx.lineWidth=1;
    for(const n of nodes){const x=(n.x-c.cx)*size/c.span+size/2,y=-(n.y-c.cy)*size/c.span+size/2;
      ctx.beginPath();ctx.moveTo(x-6,y);ctx.lineTo(x+6,y);ctx.moveTo(x,y-6);ctx.lineTo(x,y+6);ctx.stroke();ctx.fillText(n.id,x+9,y-9);}
   }
   lastConfig=c;window.LAB_BUSY=false;
   const elapsed=Math.round(performance.now()-start),critical=c.isRay?` · kritische Pixel: ${unresolved}`:'';
   $('badge').textContent=`MODELL / ${size} × ${size}${preview?' / VORSCHAU':''}${c.isRay&&!c.bending?' / OHNE LICHTABLENKUNG':''}`;
   $('renderStatus').textContent=`Neu berechnet: ${elapsed} ms${critical}. Keine KI-Nachschärfung.`;
   const detail=c.isRay?'Quellkatalog fest; Winkelprofile werden ohne Himmelsbitmap ausgewertet.':`Bildfeld ${c.span.toFixed(2)} µas · ${ (c.span/size).toFixed(4)} µas je Rechenpixel · effektives σ ${combinedSigma(c.p.width_uas,c.device).toFixed(3)} µas.`;
   $('sampling').textContent=detail+(saturated/size/size>.005?' Viele fast weiße Pixel: Belichtung reduzieren, um Profile besser zu sehen.':'');
   window.LAB_LAST_RENDER={mode:c.mode,width:size,height:size,unresolved,synthetic:true,sourceParameters:c.p,deviceSigma:c.device,geometry:c.bending?c.mode:'FLAT_REFERENCE',sourceIds:c.mode==='three_nodes'?nodePositions(c.p).map(n=>n.id):[],durationMs:elapsed,preview,span:c.span};
   if($('animate').checked&&c.isRay&&!document.hidden){clearTimeout(animTimer);animTimer=setTimeout(()=>{animationPhase+=.012;render(true);},30);}
  }
  setTimeout(chunk,0);
 }
 function schedule(){clearTimeout(animTimer);clearTimeout(settleTimer);render(true);settleTimer=setTimeout(()=>render($('animate').checked),240);}
 canvas.addEventListener('click',e=>{
  const c=lastConfig||configuration(),rect=canvas.getBoundingClientRect(),size=canvas.width;
  const x=(e.clientX-rect.left)*size/rect.width,y=(e.clientY-rect.top)*size/rect.height;
  if(c.isRay){const r=rayFor(x,y,size,c.mode,c.observer,c.fov,RAY_TABLES[c.mode][String(c.observer)],c.bending);
   $('probe').textContent=JSON.stringify({model:r.geometry,b:r.b,source_region:r.side,phi_radians:r.phi,status:'MODEL_ONLY'},null,2);
  }else{const q=imageCoordinate(x,y,size,c.span,c.cx,c.cy);const nearest=nodePositions(c.p).sort((a,b)=>Math.hypot(q.x-a.x,q.y-a.y)-Math.hypot(q.x-b.x,q.y-b.y))[0];
   $('probe').textContent=JSON.stringify({x_uas:q.x,y_uas:q.y,source_model:c.mode,nearest_node:c.mode==='three_nodes'?nearest.id:null,source_sigma_uas:c.p.width_uas,device_sigma_uas:c.device,status:'MODEL_ONLY'},null,2);}
 });
 for(const id of ['mode','radius','width','rotation','observer','fov','skyAngle','otherLight','resolution','blur','zoom','target','exposure','markers','bending','grid','band','animate'])$(id).addEventListener('input',schedule);
 $('sharp').addEventListener('click',()=>{$('blur').value='0';$('resolution').value='2048';$('animate').checked=false;clearTimeout(settleTimer);clearTimeout(animTimer);render();});
 $('normal').addEventListener('click',()=>{$('resolution').value='auto';render();});
 $('full').addEventListener('click',async()=>{try{if(!document.fullscreenElement)await $('viewer').requestFullscreen();else await document.exitFullscreen();}catch(e){$('renderStatus').textContent='Vollbild nicht verfügbar: '+e.message;}});
 window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>render(),200);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){$('animate').checked=false;clearTimeout(animTimer);}});
 window.HALVETH_LAB={...API,render,configuration,rayAt:(x,y)=>{const c=configuration();return rayFor(x,y,canvas.width,c.mode,c.observer,c.fov,RAY_TABLES[c.mode][String(c.observer)],c.bending);}};
 render();
}
