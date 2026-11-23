'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const load = () => import('../universum/lucineta/model.mjs');

test('LUCINETA: identische Seed-Welten reproduzierbar', async () => {
  const {createState, stepState} = await load();
  let a = createState(777), b = createState(777);
  for(let i=0;i<40;i++){a=stepState(a,true);b=stepState(b,true)}
  assert.deepEqual(Array.from(a.a), Array.from(b.a));
  assert.deepEqual(Array.from(a.b), Array.from(b.b));
});

test('LUCINETA: ohne Portal nach 40 Generationen kein Unterschied zur Kontrolle', async () => {
  const {createState, stepState, differenceCount} = await load();
  let s = createState(777);
  for(let i=0;i<40;i++){ s=stepState(s,false); assert.equal(differenceCount(s),0); }
  assert.equal(s.firstDifference,null);
});

test('LUCINETA: offene Grenze beeinflusst beide Welten bereits nach einem Schritt', async () => {
  const {createState, stepState, WIDTH, differenceCount} = await load();
  let s = stepState(createState(777),true);
  assert.equal(s.firstDifference,1);
  assert.equal(s.b[5*WIDTH],1,'Welt B empfängt Geburt bei y=5');
  assert.equal(s.a[10*WIDTH+WIDTH-1],1,'Welt A empfängt Geburt bei y=10');
  assert.equal(s.isolatedB[5*WIDTH],0);
  assert.equal(s.isolatedA[10*WIDTH+WIDTH-1],0);
  assert.ok(differenceCount(s)>=2);
});

test('LUCINETA: Portalschluss löscht bestehende Unterschiede nicht rückwirkend', async () => {
  const {createState, stepState, differenceCount} = await load();
  const first=stepState(createState(777),true);
  assert.ok(differenceCount(first)>0);
  const closed=stepState(first,false);
  assert.equal(closed.generation,2);
  assert.equal(closed.firstDifference,1);
});

test('LUCINETA: falsche Seeds und unbelegte Portalsignale werden abgewiesen', async () => {
  const {createState, stepState} = await load();
  for(const n of [0,-5,Number.NaN,Infinity,1.5,1000000000])assert.throws(()=>createState(n));
  assert.throws(()=>stepState(createState(777),'true'), TypeError);
});

test('LUCINETA: Besucherroute existiert und deklariert synthetischen Umfang', () => {
  const html=fs.readFileSync(path.join(root,'universum/lucineta/index.html'),'utf8');
  assert.match(html,/LUCINET.*LUCINETA/s);
  assert.match(html,/synthetisch/i);
  assert.match(html,/connect-src 'none'/);
  assert.match(html,/model\.mjs|lab\.mjs/);
  const portal=fs.readFileSync(path.join(root,'universum/index.html'),'utf8');
  assert.match(portal,/href="lucineta\//);
  const builder=fs.readFileSync(path.join(root,'tools/build-portfolio.cjs'),'utf8');
  assert.match(builder,/universum\/lucineta\//);
});
