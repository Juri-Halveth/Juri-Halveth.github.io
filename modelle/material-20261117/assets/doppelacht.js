/* MIT. Three-dimensional soft nematic material in free space. */
(function (root) {
  'use strict';
  const model = 'DOPPELACHT_3D_EXPERIMENT';
  const schema = 'halveth.doppelacht/1';
  const R = 0.46, R2 = R * R, A = 0.030, B = 0.026, J = 0.012, I = 0.08;
  const skin = 0.24;
  const defaults = Object.freeze({seed: 20261117, count: 960, coupling: 1,
    damping: 0, h: 1 / 120, binWidth: R + skin});
  const fieldMeaning = 'Compact scalar density sampled at the material centres in 3D';
  const finite = Number.isFinite;
  const cellId = i => 'M' + String(i).padStart(5, '0');

  function configuration(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) ||
        Object.keys(raw).some(k => k !== 'layout' && !Object.hasOwn(defaults, k))) throw Error('Invalid 3D configuration');
    const c = {...defaults, ...raw};
    if ((Object.hasOwn(c,'layout') && c.layout !== 'shell') || !Number.isInteger(c.seed) || c.seed < 0 || c.seed > 0xffffffff ||
        !Number.isInteger(c.count) || c.count < 16 || c.count > 960 || c.count % 8 ||
        !finite(c.coupling) || c.coupling < 0 || c.coupling > 1 ||
        !finite(c.damping) || c.damping < 0 || c.damping > 1 ||
        ![1/120, 1/240, 1/480].includes(c.h) ||
        !finite(c.binWidth) || c.binWidth < (R + skin)/2 || c.binWidth > 2*(R + skin))
      throw RangeError('3D configuration outside supported range');
    return Object.freeze(c);
  }

  // The only curve evaluation in the solver occurs during initialization.
  function seedMaterial(c) {
    if (c.layout === 'shell') return seedShell(c);
    const a = 4.2, b = 1.8, perLane = c.count/8;
    let seed = c.seed >>> 0;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed/4294967296; };
    const r = new Float64Array(3*c.count), v = r.slice(), n = r.slice(), w = r.slice();
    for (let i = 0; i < c.count; i++) {
      const family = i >= c.count/2, lane = Math.floor(i/perLane) % 4;
      const s = 2*Math.PI*((i % perLane) + (lane + 0.5)/4 + 0.12*(random()-0.5))/perLane;
      const du = a*Math.cos(s), dv = 2*b*Math.cos(2*s), norm = Math.hypot(du, dv);
      const phi = lane*Math.PI/2 + 2*s + 0.20*(random()-0.5);
      const radius = 0.12*(0.85 + 0.30*random());
      const u = a*Math.sin(s) - radius*dv/norm*Math.cos(phi);
      const zeta = radius*Math.sin(phi);
      const t = b*Math.sin(2*s) + radius*du/norm*Math.cos(phi);
      const twist = 0.18*Math.sin(phi) + 0.08*(random()-0.5), d = Math.hypot(1,twist);
      const axis = [du/(norm*d), dv/(norm*d), twist/d];
      const speed = family ? -0.24 : 0.24;
      const offset = 3*i;
      function assign(arr, x, y, z) {
        arr[offset] = family ? z : x; arr[offset+1] = family ? x : y; arr[offset+2] = family ? y : z;
      }
      assign(r,u,t,zeta); assign(v,speed*du,speed*dv,0.03*Math.sin(phi));
      assign(n,...axis); assign(w,0.12*Math.cos(phi),0.12*Math.sin(phi),0.24*(random()-0.5));
    }
    return {r,v,n,w};
  }

  // Twelve equally distant neighbourhoods. These frames are consulted only when seeding.
  const shellRadius = 3.8;
  const shellDirections = [];
  const phi = (1 + Math.sqrt(5))/2, inv = 1/Math.hypot(1,phi);
  for (const a of [-1,1]) for (const b of [-phi,phi]) {
    for (const xyz of [[0,a,b],[b,0,a],[a,b,0]])
      shellDirections.push(Object.freeze(xyz.map(x=>x*inv)));
  }
  Object.freeze(shellDirections);
  function seedShell(c) {
    const r=new Float64Array(3*c.count), v=r.slice(), n=r.slice(), w=r.slice();
    const half=c.count/2, sites=Math.min(shellDirections.length,Math.floor(half/4));
    const phase=(c.seed/4294967296)*2*Math.PI;
    for(let i=0;i<c.count;i++){
      const family=i>=half, within=i%half, site=within%sites;
      const member=Math.floor(within/sites), members=Math.ceil((half-site)/sites);
      const radial=shellDirections[site], [x,y,z]=radial, d=Math.hypot(x,z);
      const tangent=[z/d,0,-x/d], up=[-x*y/d,d,-z*y/d];
      // The two crossing local planes share the up axis. Twist the local basis
      // about the radial direction so that the world has no privileged "up".
      const twist=site*2.399963229728653+phase, ct=Math.cos(twist),st=Math.sin(twist);
      const a=tangent.map((value,k)=>value*ct+up[k]*st);
      const axis=family?radial:tangent.map((value,k)=>up[k]*ct-value*st);
      const s=2*Math.PI*(member+(family?.67:.17))/members+phase;
      const u=1.27*Math.sin(s), t=.57*Math.sin(2*s);
      const du=1.27*Math.cos(s), dt=1.14*Math.cos(2*s), norm=Math.hypot(du,dt);
      const sign=family?-1:1;
      for(let k=0;k<3;k++){
        const j=3*i+k;
        r[j]=shellRadius*radial[k]+u*a[k]+t*axis[k];
        n[j]=(du*a[k]+dt*axis[k])/norm;
        v[j]=sign*.083*(du*a[k]+dt*axis[k]);
        w[j]=.024*Math.cos(s)*a[k]+sign*.052*axis[k];
      }
    }
    return {r,v,n,w};
  }

  // Candidate lists are rebuilt before a pair can cross the skin unseen.
  // Numerical summation always uses the same (i,j) order, regardless of bin width.
  function neighborList(r, c) {
    const bins = new Map(), keys = [], reach = R+skin, cell = c.binWidth;
    const span = Math.ceil(reach/cell), key = (x,y,z) => x+','+y+','+z;
    for (let i=0; i<c.count; i++) {
      const k=3*i, x=Math.floor(r[k]/cell), y=Math.floor(r[k+1]/cell), z=Math.floor(r[k+2]/cell);
      for (let dz=-span; dz<=span; dz++) for (let dy=-span; dy<=span; dy++) for (let dx=-span; dx<=span; dx++) {
        const bucket=bins.get(key(x+dx,y+dy,z+dz));
        if (!bucket) continue;
        for (const j of bucket) {
          const l=3*j, a=r[k]-r[l], b=r[k+1]-r[l+1], e=r[k+2]-r[l+2];
          if (a*a+b*b+e*e<=reach*reach) keys.push(j*c.count+i);
        }
      }
      const current=key(x,y,z);
      if (!bins.has(current)) bins.set(current, []);
      bins.get(current).push(i);
    }
    return Uint32Array.from(keys.sort((x,y)=>x-y));
  }

  function dynamics(c) {
    const force=new Float64Array(3*c.count), torque=force.slice(), density=new Float64Array(c.count);
    const densityNorm=315/(64*Math.PI*R**3);
    let anchor=null, pairs=null;
    return function evaluate({r,n}) {
      let rebuild=!anchor;
      if (anchor) for (let k=0;k<r.length;k+=3) {
        const x=r[k]-anchor[k],y=r[k+1]-anchor[k+1],z=r[k+2]-anchor[k+2];
        if (x*x+y*y+z*z >= skin*skin/4) { rebuild=true; break; }
      }
      if (rebuild) { pairs=neighborList(r,c); anchor=r.slice(); }
      force.fill(0); torque.fill(0); density.fill(densityNorm);
      let energy=0, crossPairs=0;
      for (const key of pairs) {
        const i=Math.floor(key/c.count), j=key % c.count, k=3*i, l=3*j;
        const x=r[k]-r[l],y=r[k+1]-r[l+1],z=r[k+2]-r[l+2],q=1-(x*x+y*y+z*z)/R2;
        if (q<=0) continue;
        const q2=q*q, rho=densityNorm*q2*q; density[i]+=rho; density[j]+=rho;
        const cross=i<c.count/2 && j>=c.count/2, s=cross?c.coupling:1;
        if (cross) crossPairs++;
        const ax=n[k],ay=n[k+1],az=n[k+2],bx=n[l],by=n[l+1],bz=n[l+2];
        const dot=ax*bx+ay*by+az*bz, coefficient=J*(1-dot*dot)-B;
        energy+=s*q2*(A*q+coefficient);
        const f=s*(2/R2)*(3*A*q2+2*q*coefficient), t=2*s*J*q2*dot;
        const fx=f*x,fy=f*y,fz=f*z,tx=t*(ay*bz-az*by),ty=t*(az*bx-ax*bz),tz=t*(ax*by-ay*bx);
        force[k]+=fx; force[k+1]+=fy; force[k+2]+=fz; force[l]-=fx; force[l+1]-=fy; force[l+2]-=fz;
        torque[k]+=tx; torque[k+1]+=ty; torque[k+2]+=tz; torque[l]-=tx; torque[l+1]-=ty; torque[l+2]-=tz;
      }
      return {force,torque,density,energy,crossPairs};
    };
  }

  function kinetic({v,w}) {
    let total=0;
    for (let k=0;k<v.length;k++) total+=v[k]*v[k]+I*w[k]*w[k];
    return total/2;
  }
  function rotate(n,w,k,h) {
    const wx=w[k],wy=w[k+1],wz=w[k+2],speed=Math.hypot(wx,wy,wz);
    if (!speed) return;
    const a=wx/speed,b=wy/speed,c=wz/speed,x=n[k],y=n[k+1],z=n[k+2],angle=h*speed;
    const sin=Math.sin(angle),cos=Math.cos(angle),d=2*Math.sin(angle/2)**2*(a*x+b*y+c*z);
    n[k]=cos*x+sin*(b*z-c*y)+d*a; n[k+1]=cos*y+sin*(c*x-a*z)+d*b; n[k+2]=cos*z+sin*(a*y-b*x)+d*c;
  }
  function create(options={}) {
    const c=configuration(options);
    let evaluate=dynamics(c);
    let state,interaction,tick,credit,heat,startEnergy;
    const halfDamping=Math.exp(-c.damping*c.h/2);
    function reset() {
      state=seedMaterial(c); interaction=evaluate(state); tick=0; credit=0; heat=0;
      startEnergy=kinetic(state)+interaction.energy;
    }
    function damp() {
      if (halfDamping===1) return;
      heat+=kinetic(state)*(1-halfDamping*halfDamping);
      for(let k=0;k<state.v.length;k++){ state.v[k]*=halfDamping; state.w[k]*=halfDamping; }
    }
    function kick() {
      for(let k=0;k<state.v.length;k++) {
        state.v[k]+=0.5*c.h*interaction.force[k];
        state.w[k]+=0.5*c.h*interaction.torque[k]/I;
      }
    }
    function tickOnce() {
      damp(); kick();
      for(let k=0;k<state.r.length;k++) state.r[k]+=c.h*state.v[k];
      for(let k=0;k<state.n.length;k+=3) rotate(state.n,state.w,k,c.h);
      interaction=evaluate(state); kick(); damp(); tick++;
    }
    function step(dt,inputs={}) {
      if (!finite(dt)||dt<0||dt>60||!inputs||Object.keys(inputs).length) throw RangeError('Invalid 3D step');
      credit+=dt;
      const count=Math.floor((credit+1e-12)/c.h);
      for(let i=0;i<count;i++) tickOnce();
      credit-=count*c.h;
      if(Math.abs(credit)<1e-12) credit=0;
      return {status:'RUNNING',time:tick*c.h,tick};
    }
    function diagnostics(material=state,forces=interaction,at=tick,thermal=heat) {
      const kineticEnergy=kinetic(material), energy=kineticEnergy+forces.energy;
      const linearMomentum=[0,0,0],angularMomentum=[0,0,0],{r,v,w}=material;
      for(let k=0;k<r.length;k+=3){
        for(let a=0;a<3;a++){
          const b=(a+1)%3,d=(a+2)%3;
          linearMomentum[a]+=v[k+a];
          angularMomentum[a]+=r[k+b]*v[k+d]-r[k+d]*v[k+b]+I*w[k+a];
        }
      }
      return {status:'RUNNING',time:at*c.h,tick:at,totalMass:c.count,kineticEnergy,energy,heat:thermal,
        residual:energy+thermal-startEnergy,linearMomentum,angularMomentum,crossPairs:forces.crossPairs};
    }
    function cells(material=state,forces=interaction) {
      const {r,v,n,w}=material;
      return Array.from({length:c.count},(_,i)=>{
        const k=3*i;
        return {id:cellId(i),family:i<c.count/2?0:1,x:r[k],y:r[k+1],z:r[k+2],vx:v[k],vy:v[k+1],vz:v[k+2],
          nx:n[k],ny:n[k+1],nz:n[k+2],wx:w[k],wy:w[k+1],wz:w[k+2],density:forces.density[i]};
      });
    }
    function frame(){
      return {model,time:tick*c.h,tick,status:'RUNNING',...(c.layout?{layout:c.layout}:{}),materialCells:cells()};
    }
    function snapshot(options={}) {
      if (options.exact===false || options.field===false) return frame();
      return {...frame(),schema,source:root.HALVETH_D8_SOURCE,configuration:{...c},credit,heat,
        field:{kind:'sampled-density-3d',location:'materialCells[].density',meaning:fieldMeaning,reach:R},
        diagnostics:diagnostics()};
    }
    function equal(a,b){
      if(a===b)return true;
      if(a===null||b===null||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
      const keys=Object.keys(a);
      return keys.length===Object.keys(b).length&&keys.every(k=>Object.hasOwn(b,k)&&equal(a[k],b[k]));
    }
    function validateHeader(packet){
      if(packet?.schema!==schema || packet.model!==model || !root.HALVETH_D8_SOURCE || packet.source!==root.HALVETH_D8_SOURCE ||
          !Number.isSafeInteger(packet.tick) || packet.tick<0 || !finite(packet.credit) || packet.credit<0 || packet.credit>=c.h ||
          !finite(packet.heat)||packet.heat<0||!equal(configuration(packet.configuration),c))
        throw Error('3D source, clock or configuration mismatch');
    }
    // A checkpoint is verified against its own fields and invariants. Cost depends on particle count.
    function loadCheckpoint(packet){
      validateHeader(packet);
      if(!Array.isArray(packet.materialCells)||packet.materialCells.length!==c.count)throw Error('Invalid cell count');
      const vectors=seedMaterial(c);
      for(let i=0;i<c.count;i++){
        const p=packet.materialCells[i],k=3*i;
        if(!p||p.id!==cellId(i)||p.family!==Number(i>=c.count/2)||
            !['x','y','z','vx','vy','vz','nx','ny','nz','wx','wy','wz'].every(key=>finite(p[key]))||
            Math.abs(Math.hypot(p.nx,p.ny,p.nz)-1)>1e-7)throw Error('Invalid cell at '+i);
        vectors.r.set([p.x,p.y,p.z],k);vectors.v.set([p.vx,p.vy,p.vz],k);
        vectors.n.set([p.nx,p.ny,p.nz],k);vectors.w.set([p.wx,p.wy,p.wz],k);
      }
      const freshEvaluate=dynamics(c),forces=freshEvaluate(vectors);
      const calculated={...snapshot(),tick:packet.tick,time:packet.tick*c.h,credit:packet.credit,heat:packet.heat,
        materialCells:cells(vectors,forces),diagnostics:diagnostics(vectors,forces,packet.tick,packet.heat)};
      if(!equal(calculated,packet))throw Error('3D checkpoint disagrees with calculated fields or diagnostics');
      state=vectors;evaluate=freshEvaluate;interaction=forces;tick=packet.tick;credit=packet.credit;heat=packet.heat;
      return snapshot();
    }
    // Explicit seed replay is separately bounded. Longer runs can still be restored and advanced.
    function replay(packet){
      validateHeader(packet);if(packet.tick>120000)throw RangeError('Seed replay limited to 120000 steps');
      const candidate=create(c);
      for(let remain=packet.tick;remain>0;remain-=120)candidate.step(Math.min(120,remain)*c.h);
      if(packet.credit)candidate.step(packet.credit);
      if(!equal(candidate.snapshot(),packet))throw Error('3D replay differs from recorded material state');
      return loadCheckpoint(packet);
    }
    function compatiblePacket(packet){
      // The original two-plane equations and seed are byte-for-byte the same.
      // Accept that one historical source only for its original configuration.
      if(packet?.source==='f11a52b996a7fc9e9c84890c63fd09c4bd47406550477d1e45aad257b21b6b9d' && packet.configuration && !Object.hasOwn(packet.configuration,'layout'))
        packet={...packet,source:root.HALVETH_D8_SOURCE};
      // This predecessor differs only in checkpoint verification scheduling.
      if(packet?.source==='b67b0a71998812de55bdb2b068275b5835959f9fff4f597ca601471a1ff44e85')
        packet={...packet,source:root.HALVETH_D8_SOURCE};
      return packet;
    }
    function restore(packet){
      packet=compatiblePacket(packet);
      return packet?.tick>120000?loadCheckpoint(packet):replay(packet);
    }
    async function restoreAsync(packet,{signal,onProgress}={}){
      const checkAbort=()=>{
        if(signal?.aborted){const error=Error('3D import cancelled');error.name='AbortError';throw error;}
      };
      const yieldTask=()=>new Promise(resolve=>setTimeout(resolve,0));
      checkAbort();
      // Later yields must not allow the caller to change the packet being checked.
      const saved=structuredClone(compatiblePacket(packet));
      validateHeader(saved);
      onProgress?.({tick:0,total:saved.tick});
      await yieldTask();checkAbort();
      if(saved.tick<=120000){
        const candidate=create(c);
        const now=()=>root.performance?.now?.()??Date.now();
        let replayed=0;
        while(replayed<saved.tick){
          const started=now(),first=replayed;
          do{
            const count=Math.min(12,saved.tick-replayed);
            candidate.step(count*c.h);replayed+=count;
          }while(replayed<saved.tick&&replayed-first<120&&now()-started<8);
          onProgress?.({tick:replayed,total:saved.tick});
          checkAbort();
          if(replayed<saved.tick){await yieldTask();checkAbort();}
        }
        if(saved.credit)candidate.step(saved.credit);
        if(!equal(candidate.snapshot(),saved))throw Error('3D replay differs from recorded material state');
      }
      // No live state is replaced until verification has completed without cancellation.
      checkAbort();
      return loadCheckpoint(saved);
    }
    reset();
    function point(i){
      if(!Number.isInteger(i)||i<0||i>=c.count)return null;
      const k=3*i;return{id:cellId(i),x:state.r[k],y:state.r[k+1],z:state.r[k+2]};
    }
    return {step,reset,snapshot,frame,point,diagnostics,replay,restore,restoreAsync,get time(){return tick*c.h;}};
  }
  // Both hosts accept the same material packet while keeping independent observation clocks and cameras.
  function packetFrom(document) {
    for(const packet of [document,document?.particles,document?.model]){
      if(packet?.schema===schema && packet.model===model) return packet;
    }
    return null;
  }
  const api=Object.freeze({schema,model,defaults,create,packetFrom,shellRadius,shellDirections,
    entryConfiguration:()=>new URLSearchParams(root.location?.search||'').get('start')==='klassisch'?{coupling:1}:{coupling:1,layout:'shell'},
    requested:()=>new URLSearchParams(root.location?.search||'').get('modell')==='doppelacht',
    dynamics,seedMaterial,configuration});
  root.HALVETHDoubleEight=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
