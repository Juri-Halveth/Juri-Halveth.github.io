/* Small common adapter: experimental medium, Newton, and analytic GW inspiral.
 * A display choice never changes forces. Reference snapshots have no fake medium.
 */
(function(root){'use strict';
 const TAU=2*Math.PI;
 const getReference=()=>root.HalvethInspiral||(typeof require==='function'?require('./reference-physics.js'):null);
 const finiteStep=dt=>{if(!Number.isFinite(dt)||dt<=0)throw new RangeError('Positive finite dt required');};
 const aliases={material:'material',experimental:'experimental',medium:'experimental',newton:'newton',inspiral:'inspiral',gw:'inspiral','gw-inspiral':'inspiral'};
 function create(name='experimental',config={}){
  if(typeof name!=='string'||!Object.hasOwn(aliases,name))throw new RangeError('Unknown model: '+String(name));
  const mode=aliases[name];
  if(mode==='material'){const M=root.HALVETHMaterial||(typeof require==='function'?require('./material-model.js'):null);if(!M)throw Error('Load material-engine.js and material-model.js before models.js');return M.create(config);}
  if(mode==='experimental'){
   if(!root.HALVETHParticles)throw Error('Load particle-dynamics.js before models.js');
   const model=root.HALVETHParticles.create(config);
   return Object.freeze({step:(dt,inputs={})=>model.step(dt,inputs),reset:()=>model.reset(),snapshot:options=>model.snapshot(options),diagnostics:()=>model.diagnostics()});
  }
  const P=getReference();if(!P)throw Error('Load reference-physics.js before models.js');
  const params=P.parameters(config),eccentricity=config.eccentricity??0;
  if(!Number.isFinite(eccentricity)||eccentricity<0||eccentricity>.45)throw new RangeError('Eccentricity must be in [0,.45]');
  const cutoffVC=config.cutoffVC??.25;
  if(!Number.isFinite(cutoffVC)||cutoffVC<=0||cutoffVC>.3)throw new RangeError('Weak-field cutoff must be in (0,.3]');
  // An independently chosen weak-field speed cutoff can only stop earlier.
  if(mode==='inspiral')params.rStop=Math.max(params.rStop,params.G*params.M/(cutoffVC*params.c)**2);
  if(params.rStop>=params.r0)throw new RangeError('Initial separation outside reference validity interval');
  const maxStep=config.maxStep??1/90;
  if(!Number.isFinite(maxStep)||maxStep<=0)throw new RangeError('Positive maximum integration step required');
  const minSeparation=config.minSeparation??params.r0*1e-4;
  if(!Number.isFinite(minSeparation)||minSeparation<=0||minSeparation>=params.r0)throw new RangeError('Invalid Newton validity boundary');
  let time,steps,status,events,trails,bodies,phase,lastAngle,initialStats,gw,initialBodies;
  const identities=['PAIR_MINUS','PAIR_PLUS'];
  function currentBodies(){return bodies.map((b,i)=>({id:identities[i],sign:i?1:-1,mass:i?params.m2:params.m1,x:b.x,y:b.y,z:0,vx:b.vx,vy:b.vy,vz:0,angle:0,angularVelocity:0,radius:.09,active:true}));}
  function addTrail(){for(let i=0;i<2;i++){trails[i].push({x:bodies[i].x,y:bodies[i].y,time});if(trails[i].length>720)trails[i].shift();}}
  function reset(){
   time=0;steps=0;status='RUNNING';events=[];phase=0;lastAngle=0;
   const relativeSpeed=Math.sqrt(params.G*params.M*(1-eccentricity)/params.r0);
   bodies=[{x:-params.m2/params.M*params.r0,y:0,vx:0,vy:-params.m2/params.M*relativeSpeed},{x:params.m1/params.M*params.r0,y:0,vx:0,vy:params.m1/params.M*relativeSpeed}];
   if(mode==='inspiral'){gw=P.circularInspiralAt(0,params);bodies=gw.bodies.map(b=>({...b}));}
   initialBodies=bodies.map(b=>({...b}));initialStats=P.mechanicalStats(bodies,params);trails=bodies.map(b=>[{x:b.x,y:b.y,time:0}]);
  }
  function diagnostics(){
   const s=P.mechanicalStats(bodies,params),isGW=mode==='inspiral';
   return {model:isGW?'GW_QUADRUPOLE_QUASICIRCULAR':'NEWTON_TWO_BODY_VERLET',status,
    units:'dimensionless G=1, total-mass scale M=1 by default; configurable reference parameters',separation:s.r,
    energy:isGW?gw.energy:s.energy,initialEnergy:isGW?gw.energy0:initialStats.energy,
    energyRadiated:isGW?gw.eRadiated:0,energyBalanceResidual:isGW?gw.energy+gw.eRadiated-gw.energy0:s.energy-initialStats.energy,
    energyRelativeError:isGW?null:Math.abs((s.energy-initialStats.energy)/initialStats.energy),
    angularMomentum:isGW?gw.angularMomentum:s.angularMomentum,linearMomentum:s.linearMomentum,
    orbitalPhase:phase,orbitalTurns:phase/TAU,relativeSpeedOverC:isGW?gw.vOverC:Math.hypot(bodies[1].vx-bodies[0].vx,bodies[1].vy-bodies[0].vy)/params.c,
    gwStrainProxy:isGW?gw.strainProxy:null,luminosity:isGW?gw.luminosity:0,
    validity:isGW?'leading quadrupole, adiabatic, quasi-circular weak-field approximation; no plunge/merger or Einstein metric':'Newtonian point masses; velocity Verlet; no radiation or damping',
    validitySeparation:isGW?params.rStop:minSeparation,cutoffVC:isGW?cutoffVC:null,
    mediumField:'not present in this reference model',temperature:'not modeled',independentBits:'not modeled'};
  }
  function step(dt,inputs={}){
   finiteStep(dt);if(Object.keys(inputs).length)throw new RangeError('Reference parameters change only through explicit reinitialization; medium inputs do not apply');
   if(status!=='RUNNING')return {status,time,diagnostics:diagnostics()};
   if(mode==='inspiral'){
    const end=P.inspiralDuration(params),next=Math.min(end,time+dt);
    gw=P.circularInspiralAt(next,params);time=next;bodies=gw.bodies.map(b=>({...b}));phase=gw.phase;
    if(gw.reachedLimit){status='MODEL_LIMIT';events.push({id:'GW_LIMIT_001',type:'MODEL_VALIDITY_LIMIT',time,reason:'quadrupole weak-field validity boundary',separation:gw.r,sourceIds:identities.slice()});}
   }else{
    const substeps=Math.ceil(dt/maxStep);if(substeps>100000)throw new RangeError('Requested Newton step exceeds local work bound');const h=dt/substeps;
    for(let i=0;i<substeps;i++){
     const candidate=P.verletStep(bodies,h,params),r=Math.hypot(candidate[1].x-candidate[0].x,candidate[1].y-candidate[0].y);
     if(r<=minSeparation){status='MODEL_LIMIT';events.push({id:'NEWTON_LIMIT_001',type:'MODEL_VALIDITY_LIMIT',time,reason:'next numerical step outside chosen point-mass validity interval; last valid state retained',separation:Math.hypot(bodies[1].x-bodies[0].x,bodies[1].y-bodies[0].y),sourceIds:identities.slice()});break;}
     bodies=candidate;time+=h;const angle=Math.atan2(bodies[1].y-bodies[0].y,bodies[1].x-bodies[0].x);phase+=Math.atan2(Math.sin(angle-lastAngle),Math.cos(angle-lastAngle));lastAngle=angle;
    }
   }
   steps++;addTrail();return {status,time,diagnostics:diagnostics()};
  }
  function snapshot({field=true}={}){
   const state={schema:'halveth.model-adapter/1.0.0',model:mode,status,seed:config.seed??20261117,time,steps,bodies:currentBodies(),trails:trails.map(t=>t.map(q=>({...q}))),events:events.map(e=>({...e,sourceIds:e.sourceIds.slice()})),burst:null,
    parameters:{sourceMinus:1,sourcePlus:1,attraction:params.G,damping:0,frequency:mode==='inspiral'?gw.omega/TAU:Math.sqrt(params.G*params.M/Math.pow(params.r0,3))/TAU,...params},orbitalPhase:phase,orbitalTurns:phase/TAU,diagnostics:diagnostics()};
   if(field){const span=Math.max(3,params.r0*1.3);state.field={nx:2,ny:2,xmin:-span,xmax:span,ymin:-span*2/3,ymax:span*2/3,values:[0,0,0,0],velocity:[0,0,0,0],meaning:'no medium field in reference model'};}
   return state;
  }
  reset();return Object.freeze({step,reset,snapshot,diagnostics});
 }
 const api=Object.freeze({create,modes:Object.freeze(['material','experimental','newton','inspiral'])});
 root.HALVETHModels=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
