/* MIT. Observation of the positions and directors supplied by the 3D material solver. */
(function(root){
  'use strict';
  const presets=Object.freeze({
    front:{yaw:0,pitch:0},side:{yaw:Math.PI/2,pitch:0},
    top:{yaw:0,pitch:Math.PI/2},oblique:{yaw:-0.74,pitch:0.28}
  });
  const studioColors=[['#438fb8','#78cde6','#cfedf2'],['#b37c53','#ecb47b','#ffdfaa']];
  const origin={x:0,y:0,z:0};
  const farDistance=6400, overviewDistance=19.2, innerDistance=0.12;
  const bounded=(x,a,b)=>Math.min(b,Math.max(a,x));
  const smooth=x=>{const u=bounded(x,0,1);return u*u*(3-2*u);};
  const validDistance=d=>Number.isFinite(d)&&d>=innerDistance&&d<=farDistance;
  function approach(){
    let elapsed=null;
    return {
      begin(view,config){elapsed=config.layout==='shell'?0:null;
        if(elapsed===null)delete view.distance;else view.distance=farDistance;},
      stop(){elapsed=null;},
      update(view,dt){
        if(elapsed===null||!(dt>0))return false;
        elapsed+=dt;
        const t=smooth((elapsed-.85)/5.15);
        view.distance=t===1?overviewDistance:farDistance*Math.pow(overviewDistance/farDistance,t);
        if(t===1)elapsed=null;
        return true;
      }
    };
  }
  function distanceControls(canvas,{active,read,set,rotate,tap}){
    const pointers=new Map();let pinching=false,span=0;
    const gap=()=>{const [a,b]=pointers.values();return Math.hypot(a.x-b.x,a.y-b.y);};
    const setFactor=f=>set(bounded((1+read())*f-1,innerDistance,farDistance));
    function stop(e){e.preventDefault();e.stopImmediatePropagation();}
    canvas.addEventListener('wheel',e=>{
      if(!active())return;stop(e);
      const unit=e.deltaMode===1?16:e.deltaMode===2?canvas.clientHeight:1;
      setFactor(Math.exp(bounded(e.deltaY*unit*.0034,-3,3)));
    },{capture:true,passive:false});
    canvas.addEventListener('pointerdown',e=>{
      if(!active()||e.button!==0)return;stop(e);
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,moved:false});
      canvas.setPointerCapture(e.pointerId);canvas.focus?.({preventScroll:true});
      if(pointers.size>=2){pinching=true;span=gap();}
    },true);
    canvas.addEventListener('pointermove',e=>{
      const p=pointers.get(e.pointerId);if(!p)return;stop(e);
      const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
      if(Math.hypot(p.x-p.x0,p.y-p.y0)>3)p.moved=true;
      if(pointers.size===2){
        const now=gap();if(now>2&&span>2)setFactor(span/now);span=now;
      }else if(pointers.size===1&&p.moved&&active())rotate(dx,dy);
    },true);
    function release(e){
      const p=pointers.get(e.pointerId);if(!p)return;stop(e);pointers.delete(e.pointerId);
      if(e.type==='pointerup'&&!pinching&&!p.moved&&active())tap?.(e);
      if(pointers.size===0)pinching=false;
      if(pointers.size===2)span=gap();
    }
    for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,release,true);
  }
  function halo(ctx,x,y,r,core,middle,edge){
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,core);g.addColorStop(.14,middle);g.addColorStop(.45,edge);g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r);
  }
  // Blend a point-spread kernel into the resolved image using the actual
  // footprint on the sensor. Empty/off-screen material emits no central light.
  function unresolvedLight(ctx,points,w,h){
    if(!points.length)return 1;
    let x=0,y=0,x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
    for(const {center:p} of points){
      x+=p.x;y+=p.y;x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);y0=Math.min(y0,p.y);y1=Math.max(y1,p.y);
    }
    x/=points.length;y/=points.length;
    const pixel=Math.max(1,Math.min(w,h)/580);
    const width=Math.max(x1-x0,y1-y0)/pixel;
    const resolved=smooth((width-2.4)/11);
    if(resolved<1){
      ctx.save();ctx.globalAlpha=1-resolved;
      halo(ctx,x,y,17*pixel,'#fffefa','rgba(245,226,191,.59)','rgba(205,166,123,.09)');
      halo(ctx,x,y,4.2*pixel,'#ffffff','#fff8e9','rgba(255,242,219,.45)');ctx.restore();
    }
    return resolved;
  }


  function projector(view,w,h,focus=origin){
    const yaw=view.yaw??presets.oblique.yaw,pitch=view.pitch??presets.oblique.pitch;
    const a=Math.cos(yaw),b=Math.sin(yaw),c=Math.cos(pitch),s=Math.sin(pitch);
    const scale=Math.min(w/10.3,h/10.1)*(view.zoom??1);
    return p=>{
      const x=p.x-focus.x,y=p.y-focus.y,z=p.z-focus.z;
      const horizontal=a*x-b*z,axial=b*x+a*z,vertical=c*y-s*axial,depth=(view.distance??18)+s*y+c*axial;
      if(depth<0.2)return null;
      const k=scale*(view.orthographic?1:18/depth);
      return{x:w/2+horizontal*k,y:h/2-vertical*k,depth,branch:'primary'};
    };
  }
  function draw(ctx,state,view={},w=ctx.canvas.width,h=ctx.canvas.height){
    const cells=state.materialCells, focus=cells.find(p=>p.id===view.followId)??origin;
    const project=view.project??projector(view,w,h,focus);
    const samples=(p,id)=>{const r=project(p,id);return(Array.isArray(r)?r:r?[r]:[]).filter(q=>q.visible!==false);};
    const points=[], observations=[], size=view.symbolScale??1, style=view.mode??view.style;
    const shell=state.layout==='shell', half=(shell?.093:.075)*size;
    for(const cell of cells){
      const {x,y,z,nx,ny,nz,id}=cell;
      const centres=samples(cell,id).filter(p=>p.x>=-20&&p.y>=-20&&p.x<=w+20&&p.y<=h+20);
      if(!centres.length)continue;
      const left=samples({x:x-half*nx,y:y-half*ny,z:z-half*nz},id);
      const right=samples({x:x+half*nx,y:y+half*ny,z:z+half*nz},id);
      for(const center of centres){
        const a=left.find(q=>q.branch===center.branch),b=right.find(q=>q.branch===center.branch);
        if(!a||!b)continue;
        points.push({cell,center,a,b,depth:center.depth??center.d});
      }
    }
    points.sort((a,b)=>b.depth-a.depth);
    ctx.save();
    if(view.background!==false){
      if(shell){ctx.fillStyle='#030509';ctx.fillRect(0,0,w,h);}else{
      ctx.fillStyle='#060c14';ctx.fillRect(0,0,w,h);
      const bg=ctx.createRadialGradient(w*.46,h*.43,0,w*.5,h*.53,Math.max(w,h)*.64);
      bg.addColorStop(0,'#101c29');bg.addColorStop(.6,'#080f18');bg.addColorStop(1,'#04080e');
      ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);}
    }
    const resolved=shell?unresolvedLight(ctx,points,w,h):1;
    if(!resolved){ctx.restore();return {observations};}
    ctx.lineCap='round';
    if(shell){
      ctx.save();ctx.globalCompositeOperation='lighter';
      for(const {cell,center,a,b} of points){
        const length=Math.hypot(b.x-a.x,b.y-a.y);
        const strength=resolved*Math.min(1,length/3);
        ctx.strokeStyle=cell.family?'#e2a65e':'#66b8e0';
        ctx.lineWidth=Math.min(12,1.2+.48*length);
        ctx.globalAlpha=strength*.13;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }
      ctx.restore();
    }
    for(const {cell,center,a,b,depth} of points){
      const length=Math.hypot(b.x-a.x,b.y-a.y);
      const width=Math.max(0.75,Math.min(4.5,length*.18));
      const color=studioColors[cell.family];
      const shade=Math.min(2,Math.floor((cell.density>65?1:0)+(Math.abs(cell.nz)>.62?1:0)));
      ctx.strokeStyle=(view.colorMode??view.palette)==='rgb' ? ['#e79393','#88d2a0','#83b9eb'][Number(cell.id.slice(1))%3] : color[shade];
      ctx.fillStyle=ctx.strokeStyle;
      if(['field','flow','sharp','cells','density','raster'].includes(style)){
        const radius=Math.max(.7,Math.min(14,width*Math.sqrt(cell.density/24)));
        ctx.globalAlpha=resolved*(['field','flow','sharp'].includes(style)?.16:.65);
        ctx.beginPath();ctx.arc(center.x,center.y,radius,0,2*Math.PI);ctx.fill();
      }
      ctx.globalAlpha=resolved*.86;ctx.lineWidth=width;
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      observations.push({id:cell.id,branch:center.branch??'primary',observationId:center.observationId??cell.id+'@primary',
        x:center.x,y:center.y,depth,renderLength:length});
    }
    const picked=observations.find(p=>p.id===view.followId);
    if(picked){
      ctx.globalAlpha=1;ctx.lineWidth=1;ctx.strokeStyle='#f4f2e9';ctx.beginPath();
      ctx.arc(picked.x,picked.y,7,0,2*Math.PI);ctx.stroke();
      ctx.font='12px system-ui';ctx.fillStyle='#f4f2e9';ctx.fillText(picked.id,picked.x+12,picked.y-7);
    }
    ctx.restore();return{observations};
  }
  const labels={
    de:['Familienkopplung beim Neustart','Gekoppelt','Entkoppelt','Kamera','Schräg','Vorne','Seite','Oben','Zellnummer','Zelle folgen','Startform','Lichtpunkt · Rundumblick (sechsfache Zeitlupe)','Doppelacht · zwei Ebenen','Blickabstand (Modelleinheiten)'],
    en:['Coupling on restart','Coupled','Uncoupled','Camera','Oblique','Front','Side','Top','Cell number','Track cell','Initial shape','Point of light · full sphere (1/6 speed)','Double eight · two planes','Viewing distance (model units)'],
    ru:['Связь при перезапуске','Включена','Отключена','Камера','Под углом','Спереди','Сбоку','Сверху','Номер ячейки','Следить за ячейкой','Начальная форма','Светящаяся точка · вся сфера (1/6 скорости)','Две восьмёрки · две плоскости','Расстояние (единицы модели)']
  };
  function controls(host,handlers){
    if(!host)return {sync(){},meter(){},manual(){},pick(){},translate(){}};
    const doc=host.ownerDocument;host.setAttribute('data-no-translate','');
    const coupling=doc.createElement('select'),camera=doc.createElement('select'),index=doc.createElement('input'),follow=doc.createElement('input');
    function option(select,value){const node=doc.createElement('option');node.value=value;select.append(node);return node;}
    const items=[];
    function label(control,k){const wrap=doc.createElement('label'),caption=doc.createElement('span');items.push([caption,k]);wrap.append(caption,' ',control);host.append(wrap);}
    label(coupling,0);items.push([option(coupling,'1'),1],[option(coupling,'0'),2]);coupling.dataset.d8Coupling='';
    label(camera,3);const manual=option(camera,'');manual.textContent='—';manual.disabled=true;
    for(const [i,key]of ['oblique','front','side','top'].entries())items.push([option(camera,key),4+i]);
    camera.value='oblique';camera.dataset.d8Camera='';
    label(index,8);index.type='number';index.min='0';index.max='959';index.step='1';index.value='0';index.dataset.d8Cell='';
    label(follow,9);follow.type='checkbox';follow.dataset.d8Follow='';
    const layout=doc.createElement('select'),range=doc.createElement('input'),number=doc.createElement('output');
    if(handlers.layout){
      label(layout,10);items.push([option(layout,'shell'),11],[option(layout,'classic'),12]);
      layout.dataset.d8Layout='';layout.onchange=()=>handlers.layout(layout.value);
    }
    const span=Math.log((1+farDistance)/(1+innerDistance));
    if(handlers.distance){
      label(range,13);range.type='range';range.min='0';range.max='1000';range.step='1';
      range.dataset.d8Distance='';range.parentElement.append(' ',number);
      range.oninput=()=>handlers.distance(bounded((1+farDistance)*Math.exp(-span*range.valueAsNumber/1000)-1,innerDistance,farDistance));
    }
    function meter(d){
      if(!handlers.distance)return;
      range.parentElement.hidden=!validDistance(d);
      if(!validDistance(d))return;
      range.value=String(Math.round(1000*Math.log((1+farDistance)/(1+d))/span));
      number.value=d>=100?d.toFixed(0):d.toFixed(2);range.setAttribute('aria-valuetext',number.value);
    }
    function translate(lang=doc.documentElement.lang){const words=labels[lang]??labels.de;for(const [node,k]of items)if(node.textContent!==words[k])node.textContent=words[k];}
    translate();doc.addEventListener('halveth-language',()=>translate());
    coupling.onchange=()=>handlers.coupling(Number(coupling.value));
    camera.onchange=()=>handlers.camera(camera.value);
    function focus(){if(index.value!==''&&index.validity.valid)handlers.follow(follow.checked?'M'+index.valueAsNumber.toString().padStart(5,'0'):null);}
    index.onchange=focus;follow.onchange=focus;
    return {sync(active,c=1,id=null,count=960,view=null){index.max=String(count-1);if(view)camera.value=Object.keys(presets).find(k=>Math.abs(presets[k].yaw-view.yaw)<1e-10&&Math.abs(presets[k].pitch-view.pitch)<1e-10)??'';layout.value=view?.layout??(validDistance(view?.distance)?'shell':'classic');meter(view?.distance);host.hidden=!active;for(const element of [coupling,camera,index,follow])element.disabled=!active;coupling.value=String(c);
      follow.checked=!!id;if(id)index.value=String(Number(id.slice(1)));},translate,meter,
      pick(id){index.value=String(Number(id.slice(1)));follow.checked=true;focus();},manual(){camera.value='';}};
  }
  const api=Object.freeze({presets,presentationRate:1/6,projector,draw,controls,approach,distanceControls,validDistance,farDistance,innerDistance,overviewDistance});root.HALVETHDoubleEightView=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
