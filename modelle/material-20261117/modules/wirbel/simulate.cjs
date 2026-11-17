#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),E=require('./src/engine.js');
function run(){
 const args=process.argv.slice(2),o={preset:'heat',steps:4800};
 for(let i=0;i<args.length;i++){const a=args[i];if(a==='--help'){console.log('node simulate.cjs [--preset free|heat|drive|encounter] [--steps N] [--seed N] [--replay DATEI.json] [--out DATEI.json]');return;}
  if(!['--preset','--steps','--seed','--replay','--out'].includes(a)||i+1>=args.length)throw Error('Unbekanntes/unvollstaendiges Argument: '+a);o[a.slice(2)]=args[++i];}
 let s;
 if(o.replay){const file=path.resolve(o.replay);if(fs.statSync(file).size>2e6)throw Error('Replay ist zu gross');const r=JSON.parse(fs.readFileSync(file,'utf8'));const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'src/engine.js'))).digest('hex');if(r.engineSha256&&r.engineSha256!==hash)throw Error('Replay gehoert zu anderem Engine-Quellstand');s=E.replay(r);const result=E.record(s);if(!Array.isArray(r.bodies)||r.bodies.length!==result.bodies.length)throw Error('Replay-Koerperzahl abweichend');
 let maxScaled=0,maxAbsolute=0;
 result.bodies.forEach((b,i)=>{if(b.id!==r.bodies[i].id)throw Error('Replay-ID abweichend');for(const k of ['m','x','y','z','vx','vy','vz','u']){const v=r.bodies[i][k];if(!Number.isFinite(v))throw Error('Replay-Wert nicht endlich');const d=Math.abs(b[k]-v);maxAbsolute=Math.max(maxAbsolute,d);maxScaled=Math.max(maxScaled,d/Math.max(1,Math.abs(b[k]),Math.abs(v)));}});
 if(maxScaled>1e-10)throw Error('Replay weicht numerisch ab: '+maxScaled+' > 1e-10. Quelle, Laufzeit oder lange chaotische Entwicklung pruefen.');
 console.log('REPLAY | Max. absolute Abweichung '+maxAbsolute+'; skaliert '+maxScaled+'; Toleranz 1e-10');}
 else{if(!Object.hasOwn(E.PRESETS,o.preset))throw Error('Unbekannter Versuch');const c={...E.PRESETS[o.preset]};if(o.seed!==undefined)c.seed=Number(o.seed);s=E.advance(E.create(c),Number(o.steps));}
 const r=E.record(s);r.engineSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'src/engine.js'))).digest('hex');
 console.log('HALVETH | Wirbel & Waerme | '+r.model);console.log(JSON.stringify(r.metrics,null,2));
 if(o.out){fs.writeFileSync(o.out,JSON.stringify(r,null,2)+'\n',{flag:'wx'});console.log('GESPEICHERT | '+o.out);}
 if(r.metrics.relativeError>.005){console.error('WARNUNG: Energie-Bilanzabweichung ueber 0.5%');process.exitCode=2;}
}
try{run();}catch(e){console.error('STOP: '+e.message);process.exitCode=1;}
