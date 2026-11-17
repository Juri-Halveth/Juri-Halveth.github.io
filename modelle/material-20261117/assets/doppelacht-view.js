/* MIT. Observation of the positions and directors supplied by the 3D material solver. */
(function(root){
  'use strict';
  const presets=Object.freeze({
    front:{yaw:0,pitch:0},side:{yaw:Math.PI/2,pitch:0},
    top:{yaw:0,pitch:Math.PI/2},oblique:{yaw:-0.74,pitch:0.28}
  });
  const studioColors=[['#438fb8','#78cde6','#cfedf2'],['#b37c53','#ecb47b','#ffdfaa']];
  const origin={x:0,y:0,z:0};
  function projector(view,w,h,focus=origin){
    const yaw=view.yaw??presets.oblique.yaw,pitch=view.pitch??presets.oblique.pitch;
    const a=Math.cos(yaw),b=Math.sin(yaw),c=Math.cos(pitch),s=Math.sin(pitch);
    const scale=Math.min(w/10.3,h/10.1)*(view.zoom??1);
    return p=>{
      const x=p.x-focus.x,y=p.y-focus.y,z=p.z-focus.z;
      const horizontal=a*x-b*z,axial=b*x+a*z,vertical=c*y-s*axial,depth=18+s*y+c*axial;
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
    const half=0.075*size;
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
      ctx.fillStyle='#060c14';ctx.fillRect(0,0,w,h);
      const bg=ctx.createRadialGradient(w*.46,h*.43,0,w*.5,h*.53,Math.max(w,h)*.64);
      bg.addColorStop(0,'#101c29');bg.addColorStop(.6,'#080f18');bg.addColorStop(1,'#04080e');
      ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    }
    ctx.lineCap='round';
    for(const {cell,center,a,b,depth} of points){
      const length=Math.hypot(b.x-a.x,b.y-a.y);
      const width=Math.max(0.75,Math.min(4.5,length*.18));
      const color=studioColors[cell.family];
      const shade=Math.min(2,Math.floor((cell.density>65?1:0)+(Math.abs(cell.nz)>.62?1:0)));
      ctx.strokeStyle=(view.colorMode??view.palette)==='rgb' ? ['#e79393','#88d2a0','#83b9eb'][Number(cell.id.slice(1))%3] : color[shade];
      ctx.fillStyle=ctx.strokeStyle;
      if(['field','flow','sharp','cells','density','raster'].includes(style)){
        const radius=Math.max(.7,Math.min(14,width*Math.sqrt(cell.density/24)));
        ctx.globalAlpha=['field','flow','sharp'].includes(style)?.16:.65;
        ctx.beginPath();ctx.arc(center.x,center.y,radius,0,2*Math.PI);ctx.fill();
      }
      ctx.globalAlpha=.86;ctx.lineWidth=width;
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
    de:['Familienkopplung beim Neustart','Gekoppelt','Entkoppelt','Kamera','Schräg','Vorne','Seite','Oben','Zellnummer','Zelle folgen'],
    en:['Coupling on restart','Coupled','Uncoupled','Camera','Oblique','Front','Side','Top','Cell number','Track cell'],
    ru:['Связь при перезапуске','Включена','Отключена','Камера','Под углом','Спереди','Сбоку','Сверху','Номер ячейки','Следить за ячейкой']
  };
  function controls(host,handlers){
    if(!host)return {sync(){}};
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
    function translate(lang=doc.documentElement.lang){const words=labels[lang]??labels.de;for(const [node,k]of items)if(node.textContent!==words[k])node.textContent=words[k];}
    translate();doc.addEventListener('halveth-language',()=>translate());
    coupling.onchange=()=>handlers.coupling(Number(coupling.value));
    camera.onchange=()=>handlers.camera(camera.value);
    function focus(){if(index.value!==''&&index.validity.valid)handlers.follow(follow.checked?'M'+index.valueAsNumber.toString().padStart(5,'0'):null);}
    index.onchange=focus;follow.onchange=focus;
    return {sync(active,c=1,id=null,count=960,view=null){index.max=String(count-1);if(view)camera.value=Object.keys(presets).find(k=>Math.abs(presets[k].yaw-view.yaw)<1e-10&&Math.abs(presets[k].pitch-view.pitch)<1e-10)??'';host.hidden=!active;for(const element of [coupling,camera,index,follow])element.disabled=!active;coupling.value=String(c);
      follow.checked=!!id;if(id)index.value=String(Number(id.slice(1)));},translate,
      pick(id){index.value=String(Number(id.slice(1)));follow.checked=true;focus();},manual(){camera.value='';}};
  }
  const api=Object.freeze({presets,projector,draw,controls});root.HALVETHDoubleEightView=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
