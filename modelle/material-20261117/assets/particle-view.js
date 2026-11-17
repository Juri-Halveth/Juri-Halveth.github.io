/* HALVETH 2.2 — pixel-accurate, read-only visualization of the numerical wave field.
 * Source: 96×64 sampled field. Every displayed pixel is a bilinear interpolation
 * of the unchanged solver samples. Fixed-value isobands make boundaries sharp;
 * this is NOT an increase in the simulation's physical resolution.
 */
(()=>{'use strict';
const TAU=Math.PI*2, buffers=new WeakMap();
const BG=[5,10,17], limit=.06, size=8192;
const levels=[.00065,.0015,.0027,.0042,.0063,.0087,.0115,.0148,.0190];
const cool=['#162d3e','#1b3d57','#205276','#266d96','#2e85ae','#379fca','#48bbdf','#79d4ed','#c2eff9'];
const warm=['#362b1c','#4a3825','#63492c','#805b35','#a07541','#c0914c','#dbad64','#f4ce8d','#ffeaba'];
function colors(hex){return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];}
function makePalette(colorset){
 const colorsArr=colorset.map(colors),lut=new Uint8Array(size*3);
 for(let k=0;k<size;k++){
  const magnitude=k*limit/(size-1);let band=-1;
  for(let j=0;j<levels.length;j++)if(magnitude>=levels[j])band=j;else break;
  const rgb=band<0?BG:colorsArr[band];
  const fill=band<0?0:band<2?.52:band<4?.68:band<6?.78:band<8?.88:.98;
  const ix=k*3;
  lut[ix]=BG[0]*(1-fill)+rgb[0]*fill;
  lut[ix+1]=BG[1]*(1-fill)+rgb[1]*fill;
  lut[ix+2]=BG[2]*(1-fill)+rgb[2]*fill;
 }
 return lut;
}
const LUT_PLUS=makePalette(warm),LUT_MINUS=makePalette(cool);
function paintSharp(ctx,field,cx,cy,scale,flow=false){
 const {nx,ny,xmin,xmax,ymin,ymax,values}=field;
 const spanX=xmax-xmin,spanY=ymax-ymin;
 const x0=Math.round(cx+xmin*scale),y0=Math.round(cy-ymax*scale);
 const width=Math.max(2,Math.round(spanX*scale)),height=Math.max(2,Math.round(spanY*scale));
 let buf=buffers.get(ctx);
 if(!buf||buf.width!==width||buf.height!==height){buf={width,height,image:ctx.createImageData(width,height)};buffers.set(ctx,buf);}
 const data=buf.image.data;
 // Display coordinates are mapped to field indices explicitly. No scaling of a
 // 96×64 screenshot, gaussian blur, imageSmoothing or invented sinusoidal layer.
 const xs=new Int32Array(width),xf=new Float64Array(width);
 for(let x=0;x<width;x++){
  const v=(x+.5)*(nx-1)/width;
  xs[x]=Math.min(nx-2,Math.floor(v));xf[x]=v-xs[x];
 }
 for(let y=0;y<height;y++){
  const gy=(height-y-.5)*(ny-1)/height;
  const j=Math.max(0,Math.min(ny-2,Math.floor(gy))),b=Math.max(0,Math.min(1,gy-j));
  const row0=j*nx,row1=(j+1)*nx,offset=y*width*4;
  for(let x=0;x<width;x++){
   const i=xs[x],a=xf[x];
   const low=values[row0+i]+(values[row0+i+1]-values[row0+i])*a;
   const high=values[row1+i]+(values[row1+i+1]-values[row1+i])*a;
   const v=low+(high-low)*b;
   const mag=Math.abs(v),index=Math.min(size-1,Math.floor(mag*(size-1)/limit))*3;
   const lut=v>=0?LUT_PLUS:LUT_MINUS;
   const q=offset+x*4;
   if(flow){const a=1-Math.exp(-mag*45),rgb=v>=0?[235,200,145]:[110,180,225];for(let k=0;k<3;k++)data[q+k]=BG[k]*(1-a)+rgb[k]*a;}else{data[q]=lut[index];data[q+1]=lut[index+1];data[q+2]=lut[index+2];}data[q+3]=255;
  }
 }
 // putImageData retains true device-pixel edges, independent of canvas interpolation.
 ctx.putImageData(buf.image,x0,y0);
}
function draw(ctx,state,w,h,view={}){
 const style=view.style||'sharp';if(style==='space'){drawSpace(ctx,state,w,h,view);return;}
 const field=state.field,spanX=field.xmax-field.xmin,spanY=field.ymax-field.ymin;
 const scale=Math.min(w/spanX,h/spanY)*.93,cx=w/2,cy=h*.48;
 const point=(x,y)=>({x:cx+x*scale,y:cy-y*scale});
 ctx.fillStyle='#050a11';ctx.fillRect(0,0,w,h);
 if(style==='raster'||style==='cells')paintCells(ctx,field,cx,cy,scale,style);else paintSharp(ctx,field,cx,cy,scale,style==='flow');
 state.trails.forEach((trail,k)=>{
  if(trail.length<2)return;
  ctx.strokeStyle=k?'#f0c77e':'#81d1f0';ctx.globalAlpha=.92;
  ctx.lineWidth=Math.max(1.1,Math.min(2.2,scale*.009));ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();trail.forEach((q,i)=>{const p=point(q.x,q.y);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.stroke();ctx.globalAlpha=1;
 });
 for(const [i,body] of state.bodies.entries()){
  if(!body.active)continue;
  const p=point(body.x,body.y),radius=Math.max(5,body.radius*scale),amplitude=state.parameters[i?'sourcePlus':'sourceMinus'];
  // A sharp core and short outlined arcs display recorded position and spin.
  ctx.fillStyle='#06101c';ctx.strokeStyle=i?'#ffe6ac':'#b8e9ff';ctx.lineWidth=2.2;
  ctx.beginPath();ctx.arc(p.x,p.y,radius*.88,0,TAU);ctx.fill();ctx.stroke();
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-(body.angle||0));ctx.strokeStyle=i?'#f4c988':'#96dafa';ctx.lineWidth=1.8;
  ctx.beginPath();ctx.arc(0,0,radius*1.34,-.8,1.48);ctx.stroke();
  ctx.beginPath();ctx.arc(0,0,radius*1.34,2.2,4.38);ctx.stroke();ctx.restore();
  ctx.textAlign='center';ctx.fillStyle=i?'#ffe4ab':'#c5eeff';ctx.font=`700 ${Math.max(17,radius*1.8)}px system-ui`;
  ctx.fillText(i?'+':'−',p.x,p.y+radius*.55);
  ctx.font=`600 ${Math.max(11,Math.min(14,h*.025))}px system-ui`;
  ctx.lineWidth=3.2;ctx.strokeStyle='#050a11';const label=`${body.id} · A=${amplitude.toFixed(1)}`;
  ctx.strokeText(label,p.x,p.y+radius*3.7);ctx.fillText(label,p.x,p.y+radius*3.7);
 }
 if(state.burst){
  const age=state.time-state.burst.time,p=point(state.burst.x,state.burst.y),a=Math.exp(-age*2.4);
  if(a>.004){
   const rad=scale*(.18+age*1.5);ctx.save();ctx.globalAlpha=a;
   ctx.strokeStyle='#ffe9af';ctx.lineWidth=Math.max(1.2,2.7*a);ctx.beginPath();ctx.arc(p.x,p.y,rad,0,TAU);ctx.stroke();ctx.restore();
  }
 }
 ctx.textAlign='left';ctx.font=`600 ${Math.max(11,Math.min(14,h*.026))}px system-ui`;ctx.fillStyle='#c8d8e4';
 ctx.fillText(state.status==='MODEL_LIMIT'?'Modellgrenze · Zustand und Bewegung erhalten':state.model==='newton'?'Newton · integrierte Zweikörperbewegung':state.model==='inspiral'?'GW-Inspiral · führende Näherung, kein Mediumfeld':'Freie Zentren · experimentelles Medium',14,h-16);
 if(w>650){ctx.font=`${Math.max(10,Math.min(12,h*.023))}px system-ui`;ctx.textAlign='right';ctx.fillStyle='#9ab1bf';ctx.fillText(`FELD ${field.nx}×${field.ny} · Pixel-isobänder`,w-15,h-16);}
}
function paintCells(ctx,f,cx,cy,scale,style){
 const sx=(f.xmax-f.xmin)/(f.nx-1),sy=(f.ymax-f.ymin)/(f.ny-1),size=Math.min(sx,sy)*scale*.83;
 for(let j=1;j<f.ny-1;j++)for(let i=1;i<f.nx-1;i++){const v=f.values[j*f.nx+i],mag=Math.abs(v),ix=Math.min(8191,Math.floor(mag*8191/.06))*3,lut=v>=0?LUT_PLUS:LUT_MINUS;
 ctx.fillStyle=`rgb(${Math.max(17,lut[ix])},${Math.max(24,lut[ix+1])},${Math.max(31,lut[ix+2])})`;const x=cx+(f.xmin+i*sx)*scale,y=cy-(f.ymin+j*sy)*scale;
 if(style==='cells'){ctx.beginPath();ctx.arc(x,y,Math.max(.6,size*.33),0,TAU);ctx.fill();}else ctx.fillRect(x-size/2,y-size/2,Math.max(.6,size),Math.max(.6,size));}
}
function drawSpace(ctx,state,w,h,view){
 ctx.fillStyle='#050a11';ctx.fillRect(0,0,w,h);const f=state.field,extent=Math.max(f.xmax-f.xmin,f.ymax-f.ymin),yaw=view.yaw||0,pitch=view.pitch||.55,scale=Math.min(w,h)/extent*1.5*(view.zoom||1);
 const project=(x,y,z)=>{const xx=Math.cos(yaw)*x+Math.sin(yaw)*y,yy=-Math.sin(yaw)*x+Math.cos(yaw)*y;return{x:w/2+xx*scale,y:h*.5-(Math.cos(pitch)*yy-Math.sin(pitch)*z)*scale,d:Math.sin(pitch)*yy+Math.cos(pitch)*z};};
 const points=[];for(let j=1;j<f.ny-1;j++)for(let i=1;i<f.nx-1;i++){const v=f.values[j*f.nx+i],x=f.xmin+i*(f.xmax-f.xmin)/(f.nx-1),y=f.ymin+j*(f.ymax-f.ymin)/(f.ny-1);points.push({...project(x,y,v*extent*.8),v});}points.sort((a,b)=>a.d-b.d);
 for(const p of points){const a=1-Math.exp(-Math.abs(p.v)*45);ctx.fillStyle=p.v>=0?`rgba(233,191,125,${.1+.8*a})`:`rgba(113,198,233,${.1+.8*a})`;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.6,scale*extent/(f.nx-1)*.3),0,TAU);ctx.fill();}
 state.trails.forEach((trail,k)=>{ctx.strokeStyle=k?'#f0c77e':'#81d1f0';ctx.lineWidth=1.5;ctx.beginPath();trail.forEach((q,i)=>{const p=project(q.x,q.y,0);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.stroke();});
 state.bodies.forEach((b,i)=>{const p=project(b.x,b.y,b.z||0);ctx.fillStyle=i?'#ffe6ac':'#b8e9ff';ctx.beginPath();ctx.arc(p.x,p.y,Math.max(4,b.radius*scale),0,TAU);ctx.fill();ctx.font='bold 18px system-ui';ctx.textAlign='center';ctx.fillText(i?'+':'−',p.x,p.y-12);});
 ctx.textAlign='left';ctx.fillStyle='#b8ccd9';ctx.font='12px system-ui';ctx.fillText('Feldhöhe = Darstellung von u(x,y) · Maus drehen, Rad zoomen',14,h-16);
}
globalThis.HALVETHParticleView=Object.freeze({draw});
})();
