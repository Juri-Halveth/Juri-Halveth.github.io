'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const M=require('../motion-core.js');
test('the browser controller parses as a classic script',()=>{
  const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
  assert.doesNotThrow(()=>new vm.Script(fs.readFileSync(path.join(__dirname,'../motion-player.js'),'utf8')));
});
test('time navigation reproduces the same complete state after reverse traversal',()=>{
  const times=Array.from({length:601},(_,i)=>i/30), forward=times.map(t=>M.stateAt(t));
  assert.deepEqual(times.slice().reverse().map(t=>M.stateAt(t)).reverse(),forward);
});
test('clock partitioning leaves animation state independent of frame rate',()=>{
  for(const rate of [24,30,60,120]){
    let t=0;for(let i=0;i<rate*3;i++)t=M.advance(t,1/rate,1,false).time;
    assert.ok(Math.abs(t-3)<1e-12);
    assert.ok(Math.abs(M.stateAt(t).radius-M.stateAt(3).radius)<1e-9);
  }
});
test('time boundaries hold and a loop explicitly wraps in either direction',()=>{
  assert.deepEqual(M.advance(19.9,.5,1,false),{time:20,ended:true});
  assert.deepEqual(M.advance(.1,.5,-1,false),{time:0,ended:true});
  assert.ok(Math.abs(M.advance(.1,.5,-1,true).time-19.6)<1e-12);
  assert.ok(Math.abs(M.advance(19.9,.5,1,true).time-.4)<1e-12);
});
test('growth is monotonic and starts and ends with zero endpoint velocity',()=>{
  let previous=0;for(let i=0;i<=2000;i++){const s=M.stateAt(i/100);assert.ok(s.grow>=previous);previous=s.grow;}
  const h=1e-5;assert.ok(M.smoother(h)/h<1e-6);assert.ok((1-M.smoother(1-h))/h<1e-6);
});
test('glow changes the visual parameter while geometric carrier timing is retained',()=>{
  const a=M.stateAt(11,{glow:0}),b=M.stateAt(11,{glow:2});
  assert.notEqual(a.glow,b.glow);assert.equal(a.radius,b.radius);assert.equal(a.rotation,b.rotation);assert.equal(a.morph,b.morph);
});
test('invalid inputs fail explicitly instead of silently inventing a default',()=>{
  for(const t of [NaN,Infinity,-.1,20.1,'3',null])assert.throws(()=>M.stateAt(t));
  for(const g of [-1,3,NaN,'1'])assert.throws(()=>M.stateAt(1,{glow:g}));
  assert.throws(()=>M.advance(1,-1,1,false));
});
