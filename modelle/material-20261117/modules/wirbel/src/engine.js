/* HALVETH Wirbel & Waerme 0.3. Classical coarse-grained model, NOT black holes.
   G=1. Softened gravity; central pairwise damping; explicit heat/radiation ledger.
   No network, no eval, no disk writes. Identical inputs use a fixed timestep. */
(function(root){
'use strict';
const VERSION='0.3.0';
const DEFAULTS=Object.freeze({n:3,seed:3491,spin:.35,damping:1.2,cooling:.35,drive:0,eps:.18,G:1,dt:1/480});
const PRESETS=Object.freeze({
 free:{...DEFAULTS,spin:.45,damping:0,cooling:0},
 heat:{...DEFAULTS},
 drive:{...DEFAULTS,spin:.27,damping:1.8,cooling:.5,drive:.025},
 encounter:{...DEFAULTS,n:4,spin:.27,damping:.7,cooling:.4}
});
function finite(x,name){if(!Number.isFinite(x))throw Error(name+': endliche Zahl erwartet');return x;}
function config(input={}){
 for(const k of Object.keys(input))if(!(k in DEFAULTS))throw Error('Unbekannter Parameter: '+k);
 const c={...DEFAULTS,...input};
 for(const k of Object.keys(c))finite(c[k],k);
 if(!Number.isInteger(c.n)||c.n<2||c.n>8)throw Error('n muss 2..8 sein');
 if(!Number.isInteger(c.seed)||c.seed<0||c.seed>4294967295)throw Error('seed muss uint32 sein');
 for(const [k,lo,hi] of [['spin',0,2],['damping',0,5],['cooling',0,3],['drive',0,.5],['eps',.08,1],['G',0,4],['dt',1/10000,1/120]])
  if(c[k]<lo||c[k]>hi)throw Error('Parameter ausserhalb Bereich: '+k);
 return Object.freeze(c);
}
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=Math.imul(s^(s>>>15),1|s);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296;};}
const vkeys=['x','y','z'];
function kinetic(bs){return bs.reduce((s,b)=>s+.5*b.m*(b.vx*b.vx+b.vy*b.vy+b.vz*b.vz),0);}
function potential(bs,c){let u=0;for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++){
 const a=bs[i],b=bs[j];u-=c.G*a.m*b.m/Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z,c.eps);}return u;}
function momenta(bs){let px=0,py=0,pz=0,lx=0,ly=0,lz=0;for(const b of bs){
 px+=b.m*b.vx;py+=b.m*b.vy;pz+=b.m*b.vz;
 lx+=b.m*(b.y*b.vz-b.z*b.vy);ly+=b.m*(b.z*b.vx-b.x*b.vz);lz+=b.m*(b.x*b.vy-b.y*b.vx);}
 return{linear:[px,py,pz],angular:[lx,ly,lz]};}
function center(bs){const s={x:0,y:0,z:0,vx:0,vy:0,vz:0,m:0};for(const b of bs){s.m+=b.m;for(const k of ['x','y','z','vx','vy','vz'])s[k]+=b.m*b[k];}for(const k of ['x','y','z','vx','vy','vz'])s[k]/=s.m;return s;}
function accelerations(bs,c){const a=bs.map(()=>[0,0,0]);for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++){
 const d=vkeys.map(k=>bs[j][k]-bs[i][k]),r2=d[0]*d[0]+d[1]*d[1]+d[2]*d[2]+c.eps*c.eps,f=c.G/Math.pow(r2,1.5);
 for(let k=0;k<3;k++){a[i][k]+=f*bs[j].m*d[k];a[j][k]-=f*bs[i].m*d[k];}}
 return a;
}
function create(input={}){
 const c=config(input),random=rng(c.seed),bs=[];
 for(let i=0;i<c.n;i++){
  const theta=2*Math.PI*i/c.n+.12*(random()-.5),r=1.8+.45*random(),mass=(3/c.n)*(.8+.4*random());
  const speed=c.spin*Math.sqrt(3/r),radial=.18*(random()-.5);
  bs.push({id:'K'+(i+1),m:mass,x:r*Math.cos(theta),y:r*Math.sin(theta),z:.22*(random()-.5),
   vx:-speed*Math.sin(theta)+radial*Math.cos(theta),vy:speed*Math.cos(theta)+radial*Math.sin(theta),vz:.04*(random()-.5),u:0});
 }
 const cm=center(bs);for(const b of bs)for(const k of ['x','y','z','vx','vy','vz'])b[k]-=cm[k];
 const state={config:c,bodies:bs,step:0,t:0,heatGenerated:0,radiated:0,work:0,power:0,events:[],closePairs:{}};
 state.initialEnergy=kinetic(bs)+potential(bs,c);state.energyScale=Math.max(kinetic(bs),Math.abs(potential(bs,c)),1e-12);
 return state;
}
// An exact radial damping update for one pair. Equal/opposite impulses preserve
// total linear/angular momentum. Lost radial kinetic energy enters heat, not a void.
function dampPair(a,b,gamma,dt){
 if(gamma<=0||dt<=0)return 0;
 const dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z,r=Math.hypot(dx,dy,dz);if(r<1e-14)return 0;
 const nx=dx/r,ny=dy/r,nz=dz/r,vr=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny+(a.vz-b.vz)*nz;
 const w=Math.exp(-r*r/(1.6*1.6)),s=Math.exp(-gamma*w*dt),dv=(s-1)*vr,M=a.m+b.m,mu=a.m*b.m/M;
 const q=.5*mu*vr*vr*(-Math.expm1(-2*gamma*w*dt));
 for(const [k,n] of [['vx',nx],['vy',ny],['vz',nz]]){a[k]+=b.m/M*dv*n;b[k]-=a.m/M*dv*n;}
 a.u+=q*a.m/M;b.u+=q*b.m/M;return q;
}
function damping(state,dt,reverse=false){const bs=state.bodies,p=[];for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++)p.push([i,j]);if(reverse)p.reverse();for(const [i,j] of p)state.heatGenerated+=dampPair(bs[i],bs[j],state.config.damping,dt);}
function drive(state,dt){if(!state.config.drive)return;const bs=state.bodies,cm=center(bs),before=kinetic(bs),a=bs.map(b=>{
 const dx=b.x-cm.x,dy=b.y-cm.y,r=Math.hypot(dx,dy);return r<1e-14?[0,0]:[-state.config.drive*dy/r,state.config.drive*dx/r];});
 const mean=[0,0];for(let i=0;i<bs.length;i++){mean[0]+=bs[i].m*a[i][0]/cm.m;mean[1]+=bs[i].m*a[i][1]/cm.m;}
 for(let i=0;i<bs.length;i++){bs[i].vx+=(a[i][0]-mean[0])*dt;bs[i].vy+=(a[i][1]-mean[1])*dt;}state.work+=kinetic(bs)-before;
}
function cool(state,dt){let q=0;const f=-Math.expm1(-state.config.cooling*dt);for(const b of state.bodies){const d=b.u*f;b.u-=d;q+=d;}state.radiated+=q;state.power=q/dt;}
function step(state){
 const c=state.config,dt=c.dt,bs=state.bodies;
 drive(state,dt/2);damping(state,dt/2);
 const a=accelerations(bs,c);
 for(let i=0;i<bs.length;i++)for(let k=0;k<3;k++){const key=vkeys[k],vk='v'+key;bs[i][vk]+=.5*dt*a[i][k];bs[i][key]+=dt*bs[i][vk];}
 const a2=accelerations(bs,c);for(let i=0;i<bs.length;i++)for(let k=0;k<3;k++)bs[i]['v'+vkeys[k]]+=.5*dt*a2[i][k];
 damping(state,dt/2,true);drive(state,dt/2);cool(state,dt);
 state.step++;state.t=state.step*dt;
 for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++){
  const key=bs[i].id+' / '+bs[j].id,r=Math.hypot(bs[i].x-bs[j].x,bs[i].y-bs[j].y,bs[i].z-bs[j].z);
  if(r<.4&&!state.closePairs[key]){state.closePairs[key]=true;state.events.push({type:'close-approach',step:state.step,pair:key,distance:r});if(state.events.length>100)state.events.shift();}
  else if(r>.5)state.closePairs[key]=false;
 }
 for(const b of bs)for(const k of ['x','y','z','vx','vy','vz','u'])if(!Number.isFinite(b[k]))throw Error('Numerik nicht endlich: '+b.id+'.'+k);
 return state;
}
function metrics(state){const K=kinetic(state.bodies),U=potential(state.bodies,state.config),H=state.bodies.reduce((s,b)=>s+b.u,0);
 const balance=K+U+H+state.radiated-state.work-state.initialEnergy;
 return{time:state.t,step:state.step,kinetic:K,potential:U,heat:H,heatGenerated:state.heatGenerated,radiated:state.radiated,work:state.work,power:state.power,balance,relativeError:Math.abs(balance)/state.energyScale,momenta:momenta(state.bodies)};
}
function advance(state,n){if(!Number.isInteger(n)||n<0||n>2000000)throw Error('Ungueltige Schrittzahl');for(let i=0;i<n;i++)step(state);return state;}
function record(state){return{schema:'HALVETH_WIRBEL_REPLAY_V1',engineVersion:VERSION,model:'softened-newtonian-coarse-packets',config:{...state.config},steps:state.step,metrics:metrics(state),bodies:state.bodies.map(b=>({...b})),notes:'Dimensionslos. Keine Horizonte, Atomphysik, Ionisation, Magnetfelder oder Sgr-A*-Messdaten.'};}
function replay(data){if(data.schema!=='HALVETH_WIRBEL_REPLAY_V1'||data.engineVersion!==VERSION)throw Error('Replay-Version unbekannt');return advance(create(data.config),data.steps);}
function tracers(input,count=300){if(!Number.isInteger(count)||count<0||count>1500)throw Error('Tracerzahl ungueltig');const c=config(input),r=rng((c.seed^0xABC789)>>>0),a=[];for(let i=0;i<count;i++){
 const theta=r()*Math.PI*2,rad=.65+5.4*Math.sqrt(r()),speed=Math.sqrt(3/rad)*(.65+.4*r());
 a.push({id:'T'+i,x:rad*Math.cos(theta),y:rad*Math.sin(theta),z:(r()-.5)*.45,vx:-speed*Math.sin(theta),vy:speed*Math.cos(theta),vz:(r()-.5)*.04});}return a;}
function tracerAccel(t,bs,c){const a=[0,0,0];for(const b of bs){const d=[b.x-t.x,b.y-t.y,b.z-t.z],den=Math.pow(d[0]*d[0]+d[1]*d[1]+d[2]*d[2]+c.eps*c.eps,1.5);for(let k=0;k<3;k++)a[k]+=c.G*b.m*d[k]/den;}return a;}
// The massless tracers sample the time-dependent field without backreaction.
// The packet energy budget explicitly excludes them.
function tracerStep(ts,before,after,c,dt){for(const t of ts){const a=tracerAccel(t,before,c);for(let k=0;k<3;k++){const key=vkeys[k];t['v'+key]+=.5*dt*a[k];t[key]+=dt*t['v'+key];}const b=tracerAccel(t,after,c);for(let k=0;k<3;k++)t['v'+vkeys[k]]+=.5*dt*b[k];}}
const api={VERSION,DEFAULTS,PRESETS,config,rng,create,step,advance,metrics,record,replay,accelerations,kinetic,potential,momenta,center,dampPair,damping,drive,cool,tracers,tracerStep};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Wirbel=Object.freeze(api);
})(typeof globalThis!=='undefined'?globalThis:this);
