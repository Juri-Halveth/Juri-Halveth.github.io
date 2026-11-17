/* HALVETH · Two independently identifiable reference models
 * A: Newtonian gravitational two-body integration (velocity Verlet)
 * B: leading-order quadrupole gravitational-wave inspiral (Peters circular/adiabatic)
 * Both in G=1,M=1 dimensionless units. No merger/contact/bit rule.
 * Scholarly source: https://pages.astro.umd.edu/~mcmiller/teaching/cgwa/lecture02.pdf
 * NASA Kepler derivation: https://imagine.gsfc.nasa.gov/features/yba/CygX1_mass/binary/equation_derive.html
 */
(function (root) {
  'use strict';
  const PI=Math.PI, TAU=2*PI;
  const MODEL=Object.freeze({G:1,m1:.5,m2:.5,M:1,mu:.25,c:4,r0:2.4,rStop:1,cutoffVC:.25});
  function finite(n,name){if(!Number.isFinite(n))throw new RangeError('nonfinite '+name);return n;}
  function parameters(overrides={}) {
    const p={...MODEL,...overrides};
    for(const name of ['G','m1','m2','c','r0','rStop']){if(!(finite(p[name],name)>0))throw new RangeError(name+' must be positive');}
    p.M=p.m1+p.m2; p.mu=p.m1*p.m2/p.M;
    if(!(p.rStop<p.r0))throw new RangeError('validity limit must be inside initial separation');
    return p;
  }
  function rate(p) {return (64/5)*p.G**3*p.m1*p.m2*p.M/p.c**5;}
  function inspiralDuration(p=MODEL){p=parameters(p);return (p.r0**4-p.rStop**4)/(4*rate(p));}
  function orbitFrequency(r,p=MODEL){return Math.sqrt(p.G*p.M/r**3);}
  function orbitPeriod(r,p=MODEL){return TAU/orbitFrequency(r,p);}
  function positions(r,phase,p){const co=Math.cos(phase),si=Math.sin(phase);return [
    {x:-p.m2/p.M*r*co,y:-p.m2/p.M*r*si},
    {x: p.m1/p.M*r*co,y: p.m1/p.M*r*si}
  ];}
  function circularInspiralAt(t,input=MODEL){
    const p=parameters(input);finite(t,'time');const K=rate(p),end=inspiralDuration(p);
    if(t<0||t>end*(1+1e-11))throw new RangeError('time outside validated inspiral interval');
    t=Math.max(0,Math.min(end,t));
    const r=Math.max(p.rStop,Math.pow(p.r0**4-4*K*t,.25));
    const phase=2*Math.sqrt(p.G*p.M)/(5*K)*(p.r0**2.5-r**2.5);
    const omega=orbitFrequency(r,p),vrel=Math.sqrt(p.G*p.M/r), vOverC=vrel/p.c;
    const energy=-p.G*p.m1*p.m2/(2*r);
    const energy0=-p.G*p.m1*p.m2/(2*p.r0);
    const eRadiated=energy0-energy;
    const luminosity=(32/5)*p.G**4*p.mu**2*p.M**3/(p.c**5*r**5);
    const rdot=-K/r**3;
    const pd=positions(r,phase,p);
    const cp=Math.cos(phase),sp=Math.sin(phase);
    const radialX=rdot*cp-r*omega*sp,radialY=rdot*sp+r*omega*cp;
    pd[0].vx=-p.m2/p.M*radialX;pd[0].vy=-p.m2/p.M*radialY;
    pd[1].vx=p.m1/p.M*radialX;pd[1].vy=p.m1/p.M*radialY;
    return Object.freeze({t,r,phase,revolutions:phase/TAU,omega,
      period:TAU/omega,vrel,vOverC,rdot,
      energy,energy0,eRadiated,luminosity,
      angularMomentum:p.mu*Math.sqrt(p.G*p.M*r),
      strainProxy:(p.r0/r)*Math.cos(2*phase),
      bodies:pd,validity:'QUADRUPOLE_INSPIRAL_ONLY',
      reachedLimit:r<=p.rStop*(1+1e-12),
      params:{G:p.G,m1:p.m1,m2:p.m2,c:p.c,r0:p.r0,rStop:p.rStop}});
  }
  function circularInspiralAtPhase(phi,input=MODEL){
    const p=parameters(input),K=rate(p); finite(phi,'phase');
    const maxphi=circularInspiralAt(inspiralDuration(p),p).phase;
    if(phi<0||phi>maxphi*(1+1e-11))throw new RangeError('phase outside validated inspiral');
    const target=Math.max(p.rStop**2.5,p.r0**2.5 - Math.min(phi,maxphi)*(5*K)/(2*Math.sqrt(p.G*p.M)));
    const r=target**(2/5),t=(p.r0**4-r**4)/(4*K);
    return circularInspiralAt(t,p);
  }
  function gravitationalAccel(a,b,p){const x=b.x-a.x,y=b.y-a.y;const r=Math.hypot(x,y);
    if(r<1e-8)throw new RangeError('singular Newtonian close approach, no forced merge');
    const f=p.G/(r*r*r);return [{x:p.m2*f*x,y:p.m2*f*y},{x:-p.m1*f*x,y:-p.m1*f*y}];}
  function mechanicalStats(b,p){
    const r=Math.hypot(b[1].x-b[0].x,b[1].y-b[0].y);
    const E=.5*p.m1*(b[0].vx**2+b[0].vy**2)+.5*p.m2*(b[1].vx**2+b[1].vy**2)-p.G*p.m1*p.m2/r;
    const L=p.m1*(b[0].x*b[0].vy-b[0].y*b[0].vx)+p.m2*(b[1].x*b[1].vy-b[1].y*b[1].vx);
    const Px=p.m1*b[0].vx+p.m2*b[1].vx,Py=p.m1*b[0].vy+p.m2*b[1].vy;
    return {r,energy:E,angularMomentum:L,linearMomentum:Math.hypot(Px,Py)};
  }
  function verletStep(b,dt,p){
    const a=gravitationalAccel(b[0],b[1],p);
    const next=b.map((q,i)=>({x:q.x+q.vx*dt+.5*a[i].x*dt*dt,y:q.y+q.vy*dt+.5*a[i].y*dt*dt,vx:q.vx,vy:q.vy}));
    const a2=gravitationalAccel(next[0],next[1],p);
    for(let i=0;i<2;i++){next[i].vx+=.5*(a[i].x+a2[i].x)*dt;next[i].vy+=.5*(a[i].y+a2[i].y)*dt;}
    return next;
  }
  function simulateKepler({eccentricity=0,orbits=12,stepsPerOrbit=480,params={}}={}){
    const p=parameters(params);finite(eccentricity,'eccentricity');
    if(eccentricity<0||eccentricity>.45)throw new RangeError('eccentricity must be in [0,.45]');
    if(!Number.isInteger(orbits)||orbits<1||orbits>40||!Number.isInteger(stepsPerOrbit)||stepsPerOrbit<100||stepsPerOrbit>10000)throw new RangeError('bad resolution');
    const r=p.r0, a=r/(1+eccentricity),relv=Math.sqrt(p.G*p.M*(1-eccentricity)/r);
    let b=[{x:-p.m2/p.M*r,y:0,vx:0,vy:-p.m2/p.M*relv},
           {x:p.m1/p.M*r,y:0,vx:0,vy:p.m1/p.M*relv}];
    const period=TAU*Math.sqrt(a*a*a/(p.G*p.M)),dt=period/stepsPerOrbit;
    const initial=mechanicalStats(b,p),samples=[{t:0,bodies:b.map(q=>({...q})),...initial}];
    let maxEnergyError=0,maxAngularError=0,maxMomentum=0;
    for(let i=1;i<=orbits*stepsPerOrbit;i++){
      b=verletStep(b,dt,p);
      const d=mechanicalStats(b,p);
      maxEnergyError=Math.max(maxEnergyError,Math.abs((d.energy-initial.energy)/initial.energy));
      maxAngularError=Math.max(maxAngularError,Math.abs((d.angularMomentum-initial.angularMomentum)/initial.angularMomentum));
      maxMomentum=Math.max(maxMomentum,d.linearMomentum);
      samples.push({t:i*dt,bodies:b.map(q=>({...q})),...d});
    }
    return {model:'NEWTON_TWO_BODY_VERLET',period,dt,eccentricity,orbits,samples,
      errors:{energyRelative:maxEnergyError,angularRelative:maxAngularError,momentumAbsolute:maxMomentum}};
  }
  function halveReference(){return {radiusRatio:.5,relativeOrbitalSpeedRatio:Math.sqrt(2),angularFrequencyRatio:2*Math.sqrt(2),periodRatio:1/(2*Math.sqrt(2))};}
  const api=Object.freeze({MODEL,parameters,rate,inspiralDuration,orbitFrequency,orbitPeriod,positions,circularInspiralAt,circularInspiralAtPhase,mechanicalStats,verletStep,simulateKepler,halveReference});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.HalvethInspiral=api;
})(typeof globalThis!=='undefined'?globalThis:this);
