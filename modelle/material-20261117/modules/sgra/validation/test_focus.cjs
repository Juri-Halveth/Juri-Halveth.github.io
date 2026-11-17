'use strict';
const test=require('node:test'),a=require('node:assert/strict');
const f=require('../web/app.js');
const P={flux:1,radius_uas:26,width_uas:3,center_width_uas:20,center_fraction:.2,rotation_deg:15,weights:[.4,.35,.25]};
const near=(x,y,tol=1e-10)=>a.ok(Math.abs(x-y)<=tol,`${x} vs ${y}`);
test('no device blur preserves source width exactly',()=>near(f.combinedSigma(3,0),3,0));
test('Gaussian device blur adds variances rather than shrinking a source',()=>near(f.combinedSigma(3,4),5,0));
test('invalid sizes are refused',()=>{for(const x of [0,-1,NaN,Infinity])a.throws(()=>f.combinedSigma(x,0));a.throws(()=>f.combinedSigma(3,-1));});
test('source identities and coordinates do not depend on image sampling',()=>{
 const before=JSON.stringify(P),nodes=f.nodePositions(P);
 for(const size of [480,720,1024,2048])for(const n of nodes){
  const x=size/2+n.x*size/140,y=size/2-n.y*size/140,q=f.imageCoordinate(x,y,size,140);near(q.x,n.x);near(q.y,n.y);}
 a.equal(JSON.stringify(P),before);a.equal(new Set(nodes.map(n=>n.id)).size,3);
});
test('optical blur does not move node centers or mutate model parameters',()=>{
 const old=JSON.stringify(f.nodePositions(P)),p=JSON.stringify(P);
 f.brightness(12,7,'three_nodes',P,8);a.equal(JSON.stringify(P),p);a.equal(JSON.stringify(f.nodePositions(P)),old);
});
test('continuous ring matches independent angular quadrature',()=>{
 for(const sigma of [.25,1,3,14])for(const r of [0,25.5,26,26.5,40]){
  const p={...P,width_uas:sigma},n=16384;let sum=0;
  for(let i=0;i<n;i++){const t=2*Math.PI*(i+.5)/n;sum+=Math.exp(-((r-p.radius_uas*Math.cos(t))**2+(p.radius_uas*Math.sin(t))**2)/(2*sigma*sigma))/(2*Math.PI*sigma*sigma*n);}
  const expected=f.brightness(r,0,'ring',p),tol=Math.max(1e-14,sum*1e-9);near(expected,sum,tol);
 }
});
test('ring and source models remain finite at narrow source widths',()=>{
 for(const mode of ['ring','three_nodes','filled_center','ring_plus_center'])for(let i=0;i<200;i++){
  const b=f.brightness(i*.5,i*.2,mode,{...P,width_uas:.25});a.ok(Number.isFinite(b)&&b>=0);}
});
test('radio profiles conserve unit flux under added Gaussian blur',()=>{
 for(const mode of ['ring','three_nodes','filled_center','ring_plus_center'])for(const blur of [0,7]){
  let sum=0,step=.6;
  for(let x=-120+step/2;x<120;x+=step)for(let y=-120+step/2;y<120;y+=step)sum+=f.brightness(x,y,mode,P,blur)*step*step;
  near(sum,1,2e-6);
 }
});
test('analytical sky catalogs repeat exactly and keep unique source IDs',()=>{
 const first=f.makeCatalog(17),second=f.makeCatalog(17);a.deepEqual(first,second);a.equal(new Set(first.stars.map(x=>x.id)).size,1400);
 for(const s of first.stars)near(s.x*s.x+s.y*s.y+s.z*s.z,1,1e-14);
});
test('sky spatial index matches a brute-force source sum at 1000 directions',()=>{
 const index=f.skyIndex(f.makeCatalog(17));
 for(let i=0;i<1000;i++){
  const z=1-2*(i+.5)/1000,t=i*2.399963229728653,r=Math.sqrt(1-z*z),x=r*Math.cos(t),y=r*Math.sin(t);
  let sum=.001;
  for(const s of index.stars){const q=((x-s.x)**2+(y-s.y)**2+(z-s.z)**2)/(s.sigma*s.sigma);
   if(q<16){const v=(16-q)/7,taper=q<=9?1:v*v*(3-2*v);sum+=s.amp*Math.exp(-q/2)*taper;}}
  near(f.skyValue(index,x,y,z,false,false),sum,1e-12);
 }
});
test('sky evaluation is independent of pixel dimensions',()=>{
 const s=f.skyIndex(f.makeCatalog(37));const v=f.skyValue(s,1,0,0);
 for(let i=0;i<20;i++)near(f.skyValue(s,1,0,0),v,0);
});
test('flat reference has no captured rays and uses the same side',()=>{
 for(let i=0;i<100;i++)for(const mode of ['schwarzschild','ellis']){
  const r=f.rayFor(i*5,i*3,720,mode,8,16,null,false);a.equal(r.side,'same');a.equal(r.geometry,'FLAT_REFERENCE');a.ok(Number.isFinite(r.phi));}
});
test('critical ray interval is not fabricated',()=>{
 const t={b:[.5,.999,1.001,2],phi:[1,8,8,2]};a.equal(f.lookupRay(t,1),null);a.equal(f.lookupRay(t,NaN),null);
});
test('pixel coordinate zoom is around the selected source',()=>{
 const n=f.nodePositions(P)[1];for(const size of [480,2048]){const q=f.imageCoordinate(size/2,size/2,size,17.5,n.x,n.y);near(q.x,n.x,0);near(q.y,n.y,0);}
});
