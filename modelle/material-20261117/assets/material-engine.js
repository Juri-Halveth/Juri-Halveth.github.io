/* HALVETH Knotenlabor 0.1.0. Dimensionless exploratory model.
 * No astrophysical parameter fit, no Navier-Stokes claim.
 * State changes occur only in Engine.step(). Rendering must remain read-only.
 * MIT License. */
(function(root){
'use strict';
const VERSION='0.1.0', NEMATIC_VERSION='0.1.0+nematic.v1', H=1/120, TAU=2*Math.PI;
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
const V=q=>4*q*q*(1-q)*(1-q)-.35*(3*q*q-2*q*q*q);
const dV=q=>8*q*(1-q)*(1-2*q)-2.1*q*(1-q);
const S=q=>.5+.5*Math.tanh(3*(q-.5));
const dS=q=>1.5/(Math.cosh(3*(q-.5))**2);
function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
class Engine {
 constructor(opt={}){
  const groups=opt.groups??1, cores=opt.cores??2, particles=opt.particles??960;
  if(![1,3].includes(groups)||![2,3].includes(cores)||!Number.isInteger(particles)||particles<0||particles>1800)throw Error('Ungueltige Modellgroesse.');
  this.config={groups,cores,particles,seed:(opt.seed??170117)>>>0,medium:opt.medium??true,pressure:opt.pressure??true,phaseCoupling:opt.phaseCoupling??true,nematic:opt.nematic??false};
  this.params={massCore:3,massCell:.06,coreInertia:1,cellRadius:.255,cellStiffness:3.0,cellViscosity:.018,drag:.038,zeta:24,reverseDrag:2,rodInertia:.0008,rodDrag:.00045,rodCoupling:.0015,rodReach:.52};
  this.drive=0;this.tick=0;this.work=0;this.heat=0;this.events=[];this.commands=[];
  this.coreCount=groups*cores;this.n=this.coreCount+particles;
  this.rodCount=this.config.nematic?particles:0;this.rodBase=this.n*4+this.coreCount*2+groups;
  this.y=new Float64Array(this.rodBase+this.rodCount*2);
  this.mid=new Float64Array(this.y.length);this.k1=new Float64Array(this.y.length);this.k2=new Float64Array(this.y.length);
  this.phaseBase=this.n*4;this.qBase=this.phaseBase+this.coreCount*2;
  this.materialIds=this.config.nematic?Array.from({length:particles},(_,p)=>'M'+String(p).padStart(5,'0')):[];
  this.labels=new Uint8Array(this.n);this.turns=new Float64Array(groups);this.prevAngles=new Float64Array(groups);
  this.readout=Array(groups).fill(0);this.dwell=Array(groups).fill(0);this.pending=Array(groups).fill(0);
  const r=rng(this.config.seed), centers=groups===1?[[0,0]]:[[-3.1,-.1],[3.1,-.1],[0,3.8]];
  for(let g=0;g<groups;g++){
   const center=centers[g],radius=cores===2?.98:1.1;
   for(let j=0;j<cores;j++){
    const i=g*cores+j,a=j*TAU/cores+.12,dx=radius*Math.cos(a),dy=radius*Math.sin(a),b=i*4;
    this.y[b]=center[0]+dx;this.y[b+1]=center[1]+dy;this.y[b+2]= -.30*dy;this.y[b+3]= .30*dx;
    this.y[this.phaseBase+i*2]=j*.75;this.y[this.phaseBase+i*2+1]=.7+j*.025;
    this.labels[i]=j%2;
   }
  }
  // A finite patch of material cells, not a boundary or prescribed orbital path.
  // No particle is recycled, teleported, removed or constrained to a screen edge.
  const width=groups===1?8.8:14.2, height=groups===1?6.6:10.2;
  const nx=Math.max(1,Math.round(Math.sqrt(particles*width/height))),ny=Math.max(1,Math.ceil(particles/nx));
  for(let p=0;p<particles;p++){
   const i=this.coreCount+p,b=i*4,ix=p%nx,iy=Math.floor(p/nx);
   this.y[b]=(ix-(nx-1)/2)*width/nx+(r()-.5)*.018;
   this.y[b+1]=(iy-(ny-1)/2)*height/ny+(groups===3?1:0)+(r()-.5)*.018;
   this.labels[i]=ix<nx/2?0:1;
  }
  if(this.config.nematic){for(let p=0;p<particles;p++){const k=this.rodBase+2*p;this.y[k]=r()*Math.PI;this.y[k+1]=0;}}
  for(let g=0;g<groups;g++)this.prevAngles[g]=this.orbitAngle(g);
  this.initialEnergy=this.measureEnergy();
 }
 get time(){return this.tick*H;}
 setDrive(value){if(!Number.isFinite(value)||Math.abs(value)>1.6)throw Error('Antrieb ausserhalb [-1.6,1.6].');if(value!==this.drive){this.drive=value;this.commands.push({tick:this.tick,type:'drive',value});}}
 setFlag(name,value){if(!['medium','pressure','phaseCoupling'].includes(name))throw Error('Unbekannter Parameter');if(this.tick!==0)throw Error('Kontrollparameter nur beim Neustart aendern.');this.config[name]=!!value;this.initialEnergy=this.measureEnergy();}

 setParameter(name,value){
  if(name!=='rodCoupling'||!Number.isFinite(value)||value<0||value>.02)throw Error('rodCoupling muss in [0,0.02] liegen.');
  if(value===this.params[name])return;
  const previous=this.params[name],before=this.measureEnergy();
  this.params[name]=value;let delta;
  try{delta=this.measureEnergy()-before;if(!Number.isFinite(delta))throw Error('Nicht-endliche Parameterarbeit');}
  catch(error){this.params[name]=previous;throw error;}
  this.work+=delta;
  this.commands.push({tick:this.tick,type:'parameter',name,value});
 }
 center(y,g){let x=0,z=0,vx=0,vz=0;for(let j=0;j<this.config.cores;j++){const b=(g*this.config.cores+j)*4;x+=y[b];z+=y[b+1];vx+=y[b+2];vz+=y[b+3];}const n=this.config.cores;return[x/n,z/n,vx/n,vz/n];}
 orbitAngle(g){const c=this.center(this.y,g),b=g*this.config.cores*4;return Math.atan2(this.y[b+1]-c[1],this.y[b]-c[0]);}
 coherence(g){let x=0,y=0;for(let j=0;j<this.config.cores;j++){const t=this.y[this.phaseBase+2*(g*this.config.cores+j)];x+=Math.cos(t);y+=Math.sin(t);}return Math.hypot(x,y)/this.config.cores;}
 evaluate(y,out,energyOnly=false){
  out.fill(0);let potential=0,kinetic=0,work=0,heat=0;
  const P=this.params,nc=this.coreCount,n=this.n,pb=this.phaseBase,qb=this.qBase;
  // Force accumulators temporarily share the velocity derivative entries.
  const force=(i,fx,fy)=>{out[4*i+2]+=fx;out[4*i+3]+=fy;};
  for(let g=0;g<this.config.groups;g++){
   const q=y[qb+g],s=S(q),ds=dS(q),r0=1.95-.85*s,k=.70+.9*s,dk=.9*ds,dr=-.85*ds;
   let grad=dV(q);potential+=V(q);
   for(let a=0;a<this.config.cores;a++)for(let b=a+1;b<this.config.cores;b++){
    const i=g*this.config.cores+a,j=g*this.config.cores+b,ii=4*i,jj=4*j;
    const dx=y[jj]-y[ii],dy=y[jj+1]-y[ii+1],d=Math.sqrt(dx*dx+dy*dy+.04*.04),diff=d-r0;
    // A compressible bond plus explicit smooth core resistance; not an invisible wall.
    const rep=.012,inv=1/d,base=.5*k*diff*diff+rep*inv**4;
    let radial=k*diff-4*rep*inv**5;
    grad+=.5*dk*diff*diff-k*diff*dr;
    potential+=base;
    if(this.config.phaseCoupling){
     const delta=y[pb+2*j]-y[pb+2*i],L=Math.exp(-d*d/9),J=.015+.20*s,dJ=.20*ds,c=1-Math.cos(delta);
     potential+=J*L*c;radial+=J*c*L*(-2*d/9);grad+=dJ*L*c;
     const torque=J*L*Math.sin(delta);
     out[pb+2*i+1]+=torque;out[pb+2*j+1]-=torque;
    }
    const fx=radial*dx/d,fy=radial*dy/d;
    force(i,fx,fy);force(j,-fx,-fy);
   }
   // Explicit external control of the memory coordinate, not direct assignment.
   const net=this.drive-grad,zeta=P.zeta*(net<0?1+P.reverseDrag*s:1);
   // Deliberately stronger reverse friction in the coupled basin, not a hidden wait timer.
   const dq=net/zeta;out[qb+g]=dq;
   work+=this.drive*dq;heat+=zeta*dq*dq;
   const c=this.center(y,g);
   for(let j=0;j<this.config.cores;j++){
    const i=g*this.config.cores+j,b=4*i,dx=y[b]-c[0],dy=y[b+1]-c[1];
    const torque=.32*this.drive,r=Math.sqrt(dx*dx+dy*dy+.04),fx=-.45*this.drive*dx/r-.045*this.drive*dy,fy=-.45*this.drive*dy/r+.045*this.drive*dx;
    force(i,fx,fy);out[pb+2*i+1]+=torque;
    work+=fx*y[b+2]+fy*y[b+3]+torque*y[pb+2*i+1];
   }
  }
  // Compact-support pressure and viscous cell-cell interaction (compressible particle model).
  // Spatial hashing reduces pair work; no hidden frame-rate-dependent solver step.
  if(this.config.medium && n>nc){
   const h=this.config.nematic?Math.max(P.cellRadius,P.rodReach):P.cellRadius,grid=new Map();
   for(let i=nc;i<n;i++){
    const x=y[4*i],z=y[4*i+1],gx=Math.floor(x/h),gy=Math.floor(z/h);
    for(let ox=-1;ox<=1;ox++)for(let oy=-1;oy<=1;oy++){
     const ids=grid.get((gx+ox)+','+(gy+oy));if(!ids)continue;
     for(const j of ids){
      const dx=x-y[4*j],dy=z-y[4*j+1],d=Math.sqrt(dx*dx+dy*dy+1e-8);if(d>=h)continue;
      let fx=0,fy=0;
      if(d<P.cellRadius){
       const overlap=P.cellRadius-d,w=overlap/P.cellRadius;
       if(this.config.pressure){const f=P.cellStiffness*overlap/d;fx+=f*dx;fy+=f*dy;potential+=.5*P.cellStiffness*overlap*overlap;}
       const dvx=y[4*i+2]-y[4*j+2],dvy=y[4*i+3]-y[4*j+3],gamma=P.cellViscosity*w;
       const vr=(dvx*dx+dvy*dy)/d;fx-=gamma*vr*dx/d;fy-=gamma*vr*dy/d;heat+=gamma*vr*vr;
      }
      if(this.config.nematic&&d<P.rodReach){
       // Explicit, dimensionless head-tail symmetric rod pair potential:
       // U = J * (1 - (r/R)^2)^2 * (1 - cos(2*(theta_i-theta_j))).
       // Its radial derivative changes translation; its angular derivative
       // gives equal and opposite torques. No rendered glyph drives the solver.
       const ai=this.rodBase+2*(i-nc),aj=this.rodBase+2*(j-nc),
         rr=(d/P.rodReach)**2,one=1-rr,weight=one*one,
         delta=y[ai]-y[aj],misalign=1-Math.cos(2*delta),sine=Math.sin(2*delta);
       const K=P.rodCoupling;
       potential+=K*weight*misalign;
       const forceWeight=4*K*one*misalign/(P.rodReach*P.rodReach);
       fx+=forceWeight*dx;fy+=forceWeight*dy;
       const tau=-2*K*weight*sine;
       out[ai+1]+=tau;out[aj+1]-=tau;
      }
      force(i,fx,fy);force(j,-fx,-fy);
     }
    }
    const key=gx+','+gy;if(grid.has(key))grid.get(key).push(i);else grid.set(key,[i]);
   }
   for(let i=0;i<nc;i++)for(let j=nc;j<n;j++){
    const ci=4*i,pj=4*j,dx=y[pj]-y[ci],dy=y[pj+1]-y[ci+1],d2=dx*dx+dy*dy;
    
    const close=Math.exp(-d2/.11),wide=Math.exp(-d2/1.5);
    potential+=.055*close-.012*wide;
    const k=2*.055/.11*close-2*.012/1.5*wide;
    let fx=k*dx,fy=k*dy;
    const omega=y[pb+2*i+1],weight=Math.exp(-d2/1.4),gamma=P.drag*weight;
    const slipx=y[ci+2]-omega*dy-y[pj+2],slipy=y[ci+3]+omega*dx-y[pj+3];
    const fdx=gamma*slipx,fdy=gamma*slipy;
    fx+=fdx;fy+=fdy;
    force(j,fx,fy);force(i,-fx,-fy);
    out[pb+2*i+1]-=dx*fdy-dy*fdx;
    heat+=gamma*(slipx*slipx+slipy*slipy);
   }
  }
  for(let i=0;i<n;i++){
   const b=4*i,m=i<nc?P.massCore:P.massCell,vx=y[b+2],vy=y[b+3];
   out[b]=vx;out[b+1]=vy;out[b+2]/=m;out[b+3]/=m;
   kinetic+=.5*m*(vx*vx+vy*vy);
   // Weak explicit bath drag. Accounted as dissipation; does not pin positions.
   const damping=i<nc?.018:.003;
   out[b+2]-=damping*vx;out[b+3]-=damping*vy;heat+=damping*m*(vx*vx+vy*vy);
  }
  for(let i=0;i<nc;i++){
   const b=pb+2*i,w=y[b+1];out[b]=w;
   out[b+1]=(out[b+1]-.025*w)/P.coreInertia;
   kinetic+=.5*P.coreInertia*w*w;heat+=.025*w*w;
  }
  if(this.config.nematic){for(let p=0;p<this.rodCount;p++){
   const b=this.rodBase+2*p,omega=y[b+1];out[b]=omega;
   out[b+1]=(out[b+1]-P.rodDrag*omega)/P.rodInertia;
   kinetic+=.5*P.rodInertia*omega*omega;
   heat+=P.rodDrag*omega*omega;
  }}
  return {potential,kinetic,energy:potential+kinetic,work,heat};
 }
 step(count=1){
  if(!Number.isInteger(count)||count<0||count>200000)throw Error('Ungueltige Schrittzahl');
  for(let t=0;t<count;t++){
   this.evaluate(this.y,this.k1);
   for(let k=0;k<this.y.length;k++)this.mid[k]=this.y[k]+.5*H*this.k1[k];
   const power=this.evaluate(this.mid,this.k2);
   for(let k=0;k<this.y.length;k++){
    this.mid[k]=this.y[k]+H*this.k2[k];if(!Number.isFinite(this.mid[k]))throw Error('Nicht-endlicher Zustand; letzter gueltiger Zustand erhalten.');
   }
   const nextWork=this.work+H*power.work,nextHeat=this.heat+H*power.heat;
   if(!Number.isFinite(nextWork)||!Number.isFinite(nextHeat))throw Error('Nicht-endliche Bilanz; letzter gueltiger Zustand erhalten.');
   this.y.set(this.mid);this.work=nextWork;this.heat=nextHeat;this.tick++;
   for(let g=0;g<this.config.groups;g++){
    const a=this.orbitAngle(g),delta=Math.atan2(Math.sin(a-this.prevAngles[g]),Math.cos(a-this.prevAngles[g]));
    this.turns[g]+=delta/TAU;this.prevAngles[g]=a;
    const q=this.y[this.qBase+g],co=this.coherence(g);
    const candidate=q<.25?0:q>.75&&co>.88?1:null;
    if(candidate===null){this.pending[g]=null;this.dwell[g]=0;}
    else if(candidate!==this.pending[g]){this.pending[g]=candidate;this.dwell[g]=H;}
    else this.dwell[g]+=H;
    if(candidate!==null&&this.dwell[g]>=.75&&this.readout[g]!==candidate){
     this.readout[g]=candidate;this.events.push({id:'G'+g,bit:candidate,tick:this.tick,time:this.time,q,coherence:co,turns:this.turns[g]});
    }
   }
  }
 }
 measureEnergy(){return this.evaluate(this.y,new Float64Array(this.y.length),true).energy;}
 metrics(){
  const e=this.evaluate(this.y,new Float64Array(this.y.length),true);
  const groups=[];
  for(let g=0;g<this.config.groups;g++){
   let sep=0,pairs=0;for(let i=0;i<this.config.cores;i++)for(let j=i+1;j<this.config.cores;j++){
    const a=4*(g*this.config.cores+i),b=4*(g*this.config.cores+j);sep+=Math.hypot(this.y[a]-this.y[b],this.y[a+1]-this.y[b+1]);pairs++;
   }
   groups.push({id:'G'+g,q:this.y[this.qBase+g],coherence:this.coherence(g),turns:this.turns[g],bit:this.readout[g],reading:this.dwell[g]>=.75?this.pending[g]:null,separation:sep/pairs});
  }
  const nematicOrder=this.config.nematic&&this.rodCount>0?(()=>{let x=0,z=0;for(let p=0;p<this.rodCount;p++){const a=2*this.y[this.rodBase+2*p];x+=Math.cos(a);z+=Math.sin(a);}return Math.hypot(x,z)/this.rodCount;})():null;
  return {time:this.time,tick:this.tick,drive:this.drive,groups,energy:e.energy,work:this.work,heat:this.heat,residual:e.energy-this.initialEnergy-this.work+this.heat,nematicOrder};
 }
 snapshot(){return {schema:this.config.nematic?'halveth-knoten-run-v2-nematic':'halveth-knoten-run-v1',engine:this.config.nematic?NEMATIC_VERSION:VERSION,step:H,config:{...this.config},params:{...this.params},drive:this.drive,tick:this.tick,work:this.work,heat:this.heat,initialEnergy:this.initialEnergy,positionsAndState:Array.from(this.y),turns:Array.from(this.turns),previousAngles:Array.from(this.prevAngles),labels:Array.from(this.labels),materialIds:[...this.materialIds],readout:[...this.readout],pending:[...this.pending],dwell:[...this.dwell],commands:this.commands.map(x=>({...x})),events:this.events.map(x=>({...x}))};}
}
class Clock{
 constructor(engine){this.engine=engine;this.credit=0;this.paused=false;this.speed=1;this.totalSteps=0;}
 advance(seconds,budget=Infinity){if(!Number.isFinite(seconds)||seconds<0)throw Error('Ungueltige Zeit');if(!Number.isFinite(this.speed)||this.speed<0)throw Error('Ungueltiges Tempo');if(this.paused||this.speed===0)return 0;this.credit+=seconds*this.speed;
  const n=Math.min(Math.floor((this.credit+1e-10)/H),budget);if(n>0){this.engine.step(n);this.credit-=n*H;this.totalSteps+=n;}return n;}
}
const api={Engine,Clock,H,VERSION,NEMATIC_VERSION,V,dV,S,dS};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.HalvethMaterialEngine=api;root.HalvethKnoten=api;
})(typeof globalThis!=='undefined'?globalThis:this);
