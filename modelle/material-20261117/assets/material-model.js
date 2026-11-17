/* HALVETH material adapter. Dimensionless exploratory mechanics, not a particle-physics claim.
 * The identical source is shared by the research page, standalone and Console Only. */
(function(root){'use strict';
const E=root.HalvethMaterialEngine||(typeof require==='function'?require('./material-engine.js'):null);
if(!E)throw Error('material-engine.js must load before material-model.js');
const SOURCE_HASH='7f6225646e7296259e4a4ffb66497d23f061801b349db05d8d7fc7f42575e19f';
const SCHEMA='halveth-material-state-v1',MAX_TICKS=1000000;
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
function finite(x,name){if(typeof x!=='number'||!Number.isFinite(x))throw Error('Invalid finite number: '+name);return x;}
function clone(x){return JSON.parse(JSON.stringify(x));}
// Every numeric leaf is also encoded as IEEE754 hex. JSON alone would erase -0.
function hex(x){const b=new ArrayBuffer(8),v=new DataView(b);v.setFloat64(0,finite(x,'exact'),false);let s='';for(let i=0;i<8;i++)s+=v.getUint8(i).toString(16).padStart(2,'0');return s;}
function unhex(s){if(typeof s!=='string'||!/^[0-9a-f]{16}$/.test(s))throw Error('Invalid Float64 encoding');const v=new DataView(new ArrayBuffer(8));for(let i=0;i<8;i++)v.setUint8(i,parseInt(s.slice(i*2,i*2+2),16));return finite(v.getFloat64(0,false),'decoded Float64');}
function exactPack(value){const numbers=[];function walk(x){if(typeof x==='number'){numbers.push(hex(x));return x;}if(x===null||typeof x==='string'||typeof x==='boolean')return x;if(Array.isArray(x))return x.map(walk);if(plain(x)){const out={};for(const k of Object.keys(x)){if(['__proto__','prototype','constructor'].includes(k))throw Error('Forbidden object key');out[k]=walk(x[k]);}return out;}throw Error('Only finite plain JSON values are serializable');}return{value:walk(value),float64:numbers};}
function exactUnpack(packet){if(!plain(packet)||!Array.isArray(packet.float64)||packet.float64.length>100000)throw Error('Invalid exact packet');let at=0;function walk(x){if(typeof x==='number'){const n=unhex(packet.float64[at++]);if(n!==x)throw Error('Float64/JSON mismatch');return n;}if(x===null||typeof x==='string'||typeof x==='boolean')return x;if(Array.isArray(x))return x.map(walk);if(plain(x)){const out={};for(const k of Object.keys(x)){if(['__proto__','prototype','constructor'].includes(k))throw Error('Forbidden object key');out[k]=walk(x[k]);}return out;}throw Error('Invalid JSON leaf');}const value=walk(packet.value);if(at!==packet.float64.length)throw Error('Unused Float64 values');return value;}
function checkArray(x,n,name,predicate=Number.isFinite){if(!Array.isArray(x)||x.length!==n||!x.every(predicate))throw Error('Invalid '+name);}
function engineFrom(raw){
 if(!plain(raw)||!plain(raw.config)||!plain(raw.params)||raw.step!==E.H||!Number.isInteger(raw.tick)||raw.tick<0||raw.tick>MAX_TICKS)throw Error('Invalid raw engine contract');
 const e=new E.Engine(raw.config),sample=e.snapshot();
 if(JSON.stringify(Object.keys(raw.config).sort())!==JSON.stringify(Object.keys(sample.config).sort())||Object.keys(sample.config).some(k=>typeof raw.config[k]!==typeof sample.config[k]||raw.config[k]!==sample.config[k]))throw Error('Config normalization forbidden');
 if(raw.schema!==sample.schema||raw.engine!==sample.engine)throw Error('Engine schema mismatch');
 if(JSON.stringify(Object.keys(raw.params).sort())!==JSON.stringify(Object.keys(e.params).sort()))throw Error('Parameter keys mismatch');
 for(const [k,v]of Object.entries(raw.params)){finite(v,k);if(v<0||v>1000||(['massCore','massCell','coreInertia','rodInertia','cellRadius','rodReach','zeta'].includes(k)&&v===0))throw Error('Parameter outside supported finite range');}
 if(raw.params.rodCoupling>.02)throw Error('Unsupported rodCoupling');
 checkArray(raw.positionsAndState,e.y.length,'state');checkArray(raw.turns,e.config.groups,'turns');checkArray(raw.previousAngles,e.config.groups,'angles');checkArray(raw.labels,e.n,'labels',x=>x===0||x===1);
 for(const k of ['readout','pending'])checkArray(raw[k],e.config.groups,k,x=>x===null||x===0||x===1);
 checkArray(raw.dwell,e.config.groups,'dwell',x=>Number.isFinite(x)&&x>=0);
 if(JSON.stringify(raw.materialIds)!==JSON.stringify(e.materialIds))throw Error('Material identity mismatch');
 if(!Array.isArray(raw.commands)||raw.commands.length>100000||!Array.isArray(raw.events)||raw.events.length>100000)throw Error('History size invalid');
 let tick=0;for(const c of raw.commands){if(!plain(c)||!Number.isInteger(c.tick)||c.tick<tick||c.tick>raw.tick||!['drive','parameter'].includes(c.type))throw Error('Invalid command');finite(c.value,'command');if(c.type==='drive'&&Math.abs(c.value)>1.6)throw Error('Drive command range');if(c.type==='parameter'&&(c.name!=='rodCoupling'||c.value<0||c.value>.02))throw Error('Parameter command range');tick=c.tick;}
 let lastEvent=0;for(const v of raw.events){if(!plain(v)||!Number.isInteger(v.tick)||v.tick<lastEvent||v.tick>raw.tick||!/^G[0-2]$/.test(v.id)||![0,1].includes(v.bit))throw Error('Invalid event');for(const k of ['time','q','coherence','turns'])finite(v[k],'event');lastEvent=v.tick;}
 for(const k of ['drive','work','heat','initialEnergy'])finite(raw[k],k);
 if(Math.abs(raw.drive)>1.6||raw.heat<0)throw Error('Invalid raw controls');
 e.params={...raw.params};e.y.set(raw.positionsAndState);e.tick=raw.tick;e.drive=raw.drive;e.work=raw.work;e.heat=raw.heat;e.initialEnergy=raw.initialEnergy;e.turns.set(raw.turns);e.prevAngles.set(raw.previousAngles);e.labels.set(raw.labels);e.readout=[...raw.readout];e.pending=[...raw.pending];e.dwell=[...raw.dwell];e.commands=raw.commands.map(c=>({...c}));e.events=raw.events.map(v=>({...v}));
 if(!Number.isFinite(e.measureEnergy()))throw Error('Restored energy is not finite');return e;
}
function diagnosticsFor(e,status='RUNNING',error=null){const m=e.metrics();return {...m,orbitalTurns:m.groups[0]?.turns||0,particleCount:e.config.particles,totalCellMass:e.config.particles*e.params.massCell,totalCoreMass:e.coreCount*e.params.massCore,units:'dimensionless model units',validity:'constructed compressible particle/nematic model; not calibrated LCD or subatomic physics',thermalBounds:'NOT_CALIBRATED',density:'compact-support interpolation of actual material cells',rodPotential:'J(1-(r/R)^2)^2(1-cos(2(theta_i-theta_j))) for r<R',palette:'observer-only A/B/C classes; no proton/neutron/electron identification',coreMechanism:'original explicit reciprocal core-cell and q-memory couplings retained',parameterWork:e.commands.filter(c=>c.type==='parameter').length,status,error,time:e.time};}
function fromEngine(e,clock={},status='RUNNING'){
 const raw=e.snapshot(),m=e.metrics(),cells=[];
 for(let p=0;p<e.config.particles;p++){const i=e.coreCount+p,b=4*i;cells.push({id:e.materialIds[p]||'M'+String(p).padStart(5,'0'),x:e.y[b],y:e.y[b+1],z:0,vx:e.y[b+2],vy:e.y[b+3],vz:0,theta:e.config.nematic?e.y[e.rodBase+2*p]:0,omega:e.config.nematic?e.y[e.rodBase+2*p+1]:0,mass:e.params.massCell,inertia:e.config.nematic?e.params.rodInertia:0,channel:p%3,displayClass:['A','B','C'][p%3],sourceLabel:e.labels[i]});}
 const cores=[];for(let i=0;i<e.coreCount;i++){const b=4*i;cores.push({id:'C'+String(i).padStart(3,'0'),x:e.y[b],y:e.y[b+1],z:0,vx:e.y[b+2],vy:e.y[b+3],mass:e.params.massCore,angle:e.y[e.phaseBase+2*i],spin:e.y[e.phaseBase+2*i+1],active:true,radius:.04,annotationOnly:true,sourceLabel:e.labels[i]});}
 const diagnostics=diagnosticsFor(e,status);
 return{schema:SCHEMA,model:'material',sourceHash:SOURCE_HASH,sourceSha256:SOURCE_HASH,featureRevision:'material-v1',time:e.time,tick:e.tick,steps:e.tick,status,materialCells:cells,coreAnnotations:cores,bodies:cores,groups:m.groups,events:raw.events,burst:null,trails:[],field:{kind:'material-density',bounds:e.config.groups===3?[-8.9,8.9,-5.5,7]:[-5.9,5.9,-4.1,4.1],values:[],computed:true},parameters:{sourceMinus:0,sourcePlus:0,...e.params},diagnostics,rawEngine:raw,clock:{credit:clock.credit??0,totalSteps:clock.totalSteps??e.tick,paused:!!clock.paused,speed:clock.speed??1}};
}
function create(config={}){
 if(!plain(config))throw Error('Material config must be a plain object');
 const allowed=['groups','cores','particles','seed','medium','pressure','phaseCoupling','nematic','drive','rodCoupling'];for(const k of Object.keys(config))if(!allowed.includes(k))throw Error('Unknown material config: '+k);
 for(const k of ['medium','pressure','phaseCoupling','nematic'])if(k in config&&typeof config[k]!=='boolean')throw Error('Boolean config required: '+k);
 if('seed'in config&&(!Number.isInteger(config.seed)||config.seed<0||config.seed>4294967295))throw Error('Invalid seed');
 const start={...config,nematic:config.nematic??true};let engine,initial,credit=0,totalSteps=0,status='RUNNING',error=null;
 function reset(){engine=new E.Engine(start);credit=0;totalSteps=0;status='RUNNING';error=null;initial=engine.snapshot();if('rodCoupling'in start)engine.setParameter('rodCoupling',start.rodCoupling);engine.setDrive(start.drive??.95);return snapshot();}
 function snapshot(options={}){const s=fromEngine(engine,{credit,totalSteps},status);s.error=error;s.diagnostics.error=error;if(options.exact!==false&&options.field!==false)s.exact=exactPack({rawEngine:s.rawEngine,clock:s.clock,initialEngine:initial});return s;}
 function step(dt,inputs={}){
  finite(dt,'dt');if(dt<0||dt>60)throw Error('dt outside [0,60]');if(!plain(inputs))throw Error('Invalid inputs');for(const k of Object.keys(inputs))if(!['drive','rodCoupling'].includes(k))throw Error('Unknown material input '+k);
  if('drive'in inputs&&(typeof inputs.drive!=='number'||!Number.isFinite(inputs.drive)||Math.abs(inputs.drive)>1.6))throw Error('Invalid drive');
  if('rodCoupling'in inputs&&(typeof inputs.rodCoupling!=='number'||!Number.isFinite(inputs.rodCoupling)||inputs.rodCoupling<0||inputs.rodCoupling>.02))throw Error('Invalid rodCoupling');
  if(status!=='RUNNING')return{status,error,time:engine.time,tick:engine.tick};
  if('drive'in inputs)engine.setDrive(inputs.drive);if('rodCoupling'in inputs)engine.setParameter('rodCoupling',inputs.rodCoupling);
  credit+=dt;const n=Math.min(120,Math.floor((credit+1e-10)/E.H));for(let i=0;i<n;i++){try{engine.step();credit-=E.H;totalSteps++;}catch(e){status='MODEL_ERROR';error=String(e.message||e);break;}}
  if(Math.abs(credit)<1e-10)credit=0;return{status,error,time:engine.time,tick:engine.tick};
 }
 function restore(doc){
  if(!plain(doc)||doc.schema!==SCHEMA||doc.model!=='material'||doc.sourceHash!==SOURCE_HASH||!['RUNNING','MODEL_ERROR'].includes(doc.status))throw Error('Snapshot/source contract mismatch');
  const decoded=exactUnpack(doc.exact);if(JSON.stringify(decoded.rawEngine)!==JSON.stringify(doc.rawEngine)||JSON.stringify(decoded.clock)!==JSON.stringify(doc.clock))throw Error('Exact payload does not match visible state');
  if(doc.error!==null&&typeof doc.error!=='string')throw Error('Invalid error status');
  const next=engineFrom(decoded.rawEngine),initialNext=engineFrom(decoded.initialEngine);if(initialNext.tick!==0)throw Error('Initial state must have tick0');
  const c=decoded.clock;finite(c.credit,'credit');if(c.credit< -1e-10||c.credit>3600||!Number.isInteger(c.totalSteps)||c.totalSteps!==next.tick||c.speed!==1||c.paused!==false)throw Error('Invalid material clock');
  engine=next;initial=initialNext.snapshot();credit=c.credit;totalSteps=c.totalSteps;status=doc.status;error=doc.error===null?null:String(doc.error);return snapshot();
 }
 function replay(doc,options={}){
  const decoded=exactUnpack(doc.exact);if(doc.sourceHash!==SOURCE_HASH)throw Error('Replay source mismatch');const target=engineFrom(decoded.rawEngine),base=engineFrom(decoded.initialEngine),limit=options.maxTicks??100000;
  if(!Number.isInteger(limit)||limit<0||limit>MAX_TICKS||target.tick>limit)throw Error('Replay tick limit');if(base.tick!==0)throw Error('Replay initial tick');
  let at=0;for(let tick=0;tick<=target.tick;tick++){while(at<target.commands.length&&target.commands[at].tick===tick){const c=target.commands[at++];if(c.type==='drive')base.setDrive(c.value);else base.setParameter(c.name,c.value);}if(tick<target.tick)base.step();}
  const expected=exactPack(target.snapshot()),actual=exactPack(base.snapshot());if(JSON.stringify(expected)!==JSON.stringify(actual))throw Error('Replay diverged from full numerical state/history');return restore(doc);
 }
 reset();return{step,reset,snapshot,diagnostics:()=>({...diagnosticsFor(engine,status,error),credit}),restore,replay,get engine(){return engine;}};
}
function capture(engine,clock={},initialEngine){const s=fromEngine(engine,{credit:clock.credit??0,totalSteps:engine.tick});s.error=null;s.exact=exactPack({rawEngine:s.rawEngine,clock:s.clock,initialEngine:initialEngine||(new E.Engine(engine.config)).snapshot()});return s;}
const api={create,fromEngine,capture,exactPack,exactUnpack,SOURCE_HASH,SCHEMA,H:E.H};root.HALVETHMaterial=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
