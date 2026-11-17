'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),E=require('../src/engine.js');
const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}, tol ${t}`);
const vec=(a,b,t=1e-10)=>a.forEach((x,i)=>near(x,b[i],t));
const pair=()=>[{id:'A',m:2,x:-1,y:0,z:0,vx:2,vy:1,vz:0,u:0},{id:'B',m:3,x:1,y:0,z:0,vx:-1,vy:.5,vz:0,u:0}];
test('invalid and unknown configuration is rejected',()=>{
 for(const c of [{n:0},{n:3.5},{seed:-1},{eps:0},{dt:NaN},{drive:3},{damping:-1},{foo:5}])assert.throws(()=>E.create(c));
});
test('same seed generates identical stable source IDs',()=>{assert.deepEqual(E.create(),E.create());const s=E.create({n:8});assert.equal(new Set(s.bodies.map(b=>b.id)).size,8);});
test('initial center of mass and net momentum vanish',()=>{for(const seed of [0,1,3491,4294967295]){const s=E.create({seed});const c=E.center(s.bodies);for(const k of ['x','y','z','vx','vy','vz'])near(c[k],0);}});
test('softened force agrees with independent potential finite difference',()=>{
 const s=E.create({n:4});const a=E.accelerations(s.bodies,s.config),h=1e-5;
 for(let i=0;i<s.bodies.length;i++)for(let k=0;k<3;k++){const key=['x','y','z'][k];s.bodies[i][key]+=h;const plus=E.potential(s.bodies,s.config);s.bodies[i][key]-=2*h;const minus=E.potential(s.bodies,s.config);s.bodies[i][key]+=h;near(a[i][k],-(plus-minus)/(2*h*s.bodies[i].m),1e-9);}
});
test('internal gravity has zero net force',()=>{const s=E.create({n:8});const a=E.accelerations(s.bodies,s.config);for(let k=0;k<3;k++)near(a.reduce((sum,x,i)=>sum+x[k]*s.bodies[i].m,0),0);});
test('radial dissipation converts exact lost kinetic energy to heat',()=>{const bs=pair(),k=E.kinetic(bs),q=E.dampPair(...bs,2,.1);assert.ok(q>0);near(k-E.kinetic(bs),q);near(bs[0].u+bs[1].u,q);});
test('damping conserves linear and angular momentum',()=>{const bs=pair(),m=E.momenta(bs);E.dampPair(...bs,3,.2);const after=E.momenta(bs);vec(m.linear,after.linear);vec(m.angular,after.angular);});
test('uniform translation does not generate heat',()=>{const bs=pair();for(const b of bs){b.vx=1;b.vy=2;b.vz=3;}near(E.dampPair(...bs,3,.5),0);});
test('pure tangential relative motion is not falsely called radial heat',()=>{const bs=pair();bs.forEach(b=>b.vx=0);near(E.dampPair(...bs,3,.5),0);});
test('coincident packet positions do not divide by zero',()=>{const bs=pair();bs[1].x=-1;near(E.dampPair(...bs,2,.1),0);const a=E.accelerations(bs,E.DEFAULTS);assert.ok(a.flat().every(Number.isFinite));});
test('free gravitational orbit does not automatically heat or radiate',()=>{const s=E.advance(E.create(E.PRESETS.free),9600),m=E.metrics(s);near(m.heat,0);near(m.radiated,0);near(m.work,0);assert.ok(m.relativeError<.002);});
test('heat reservoir balances cumulative dissipation and radiation',()=>{const s=E.advance(E.create(E.PRESETS.heat),7200),m=E.metrics(s);assert.ok(m.heatGenerated>.1);assert.ok(m.radiated>0);near(m.heatGenerated,m.heat+m.radiated,1e-10);assert.ok(m.relativeError<.002);});
test('cooling removes exactly the radiated reservoir energy',()=>{const s=E.create({cooling:.8});s.bodies[0].u=2;E.cool(s,.3);near(s.bodies[0].u,2*Math.exp(-.24));near(s.radiated,2-s.bodies[0].u);});
test('drive records actual positive or negative mechanical work',()=>{const s=E.create(E.PRESETS.drive),k=E.kinetic(s.bodies),m=E.momenta(s.bodies);E.drive(s,.4);near(s.work,E.kinetic(s.bodies)-k);vec(E.momenta(s.bodies).linear,m.linear);assert.ok(s.work>0);});
test('a driven trajectory closes its heat/work balance',()=>{const s=E.advance(E.create(E.PRESETS.drive),6000),m=E.metrics(s);assert.ok(m.work>0);assert.ok(m.relativeError<.003);});
test('half timestep improves an independent free-orbit convergence check',()=>{
 const base={...E.PRESETS.free,n:4,seed:821,spin:.36};
 const a=E.advance(E.create({...base,dt:1/120}),1200),b=E.advance(E.create({...base,dt:1/240}),2400),ref=E.advance(E.create({...base,dt:1/960}),9600);
 const dist=s=>Math.hypot(...s.bodies.flatMap((b,i)=>['x','y','z'].map(k=>b[k]-ref.bodies[i][k])));
 assert.ok(dist(b)<dist(a)*.6);
});
test('JSON replay recreates identical dynamic state',()=>{const s=E.advance(E.create({...E.PRESETS.heat,n:6,seed:87}),2100),r=JSON.parse(JSON.stringify(E.record(s)));assert.deepEqual(E.record(E.replay(r)),r);});
test('frame batching does not change a fixed-step result',()=>{const a=E.create(),b=E.create();E.advance(a,2400);for(let i=0;i<60;i++)E.advance(b,40);assert.deepEqual(E.record(a),E.record(b));});
test('massless tracer calculations cannot alter packets or their energy',()=>{const s=E.create(),old=JSON.stringify(s),ts=E.tracers(s.config,40);E.tracerStep(ts,s.bodies,s.bodies,s.config,s.config.dt);assert.equal(JSON.stringify(s),old);assert.ok(ts.every(t=>['x','y','z','vx','vy','vz'].every(k=>Number.isFinite(t[k]))));});
test('tracers repeat and keep distinct fixed identifiers',()=>{assert.deepEqual(E.tracers(E.DEFAULTS),E.tracers(E.DEFAULTS));assert.equal(new Set(E.tracers(E.DEFAULTS).map(x=>x.id)).size,300);});
test('translation of the whole system preserves forces and potential',()=>{const s=E.create(),a=E.accelerations(s.bodies,s.config),u=E.potential(s.bodies,s.config);for(const b of s.bodies){b.x+=100;b.y-=50;b.z+=7;}vec(a.flat(),E.accelerations(s.bodies,s.config).flat(),1e-12);near(u,E.potential(s.bodies,s.config),1e-12);});
test('invalid replay cannot execute or silently accept a different model',()=>{assert.throws(()=>E.replay({schema:'BAD'}));const r=E.record(E.create());r.steps=Infinity;assert.throws(()=>E.replay(r));});
test('256 seeded parameter combinations remain finite with a bounded balance error',()=>{
 const random=E.rng(0xF1A5);let max=0;
 for(let i=0;i<256;i++){const s=E.create({n:3+Math.floor(random()*6),seed:i,spin:.12+random()*.6,damping:random()*3,cooling:random(),drive:random()*.025,eps:.18+random()*.1});E.advance(s,1440);const m=E.metrics(s);max=Math.max(max,m.relativeError);assert.ok(m.relativeError<.005,`seed ${i}: ${m.relativeError}`);assert.ok(m.heat>=0&&m.radiated>=0);}
 console.log('Generated cases: 256; maximum relative balance error:',max);
});
