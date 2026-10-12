import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENE_IDS,SCENES,frameFor,subdivision} from './core.mjs';

test('each public state-atlas scene has a unique metadata record',()=>{
  assert.equal(SCENES.length,8);
  assert.deepEqual(SCENES.map(scene=>scene.id),SCENE_IDS);
  assert.equal(new Set(SCENE_IDS).size,SCENE_IDS.length);
  for(const scene of SCENES){
    assert.match(scene.title,/\S/);
    assert.match(scene.summary,/\S/);
    assert.match(scene.formula,/\S/);
  }
});

test('every scene yields finite drawable primitives across its animation cycle',()=>{
  for(const id of SCENE_IDS){
    for(const milliseconds of [0,1379,6051,11999]){
      const frame=frameFor(id,milliseconds);
      assert.equal(frame.scene.id,id);
      assert.ok(frame.lines.length>0,id+' has lines');
      assert.ok(frame.dots.length>0,id+' has dots');
      for(const entry of [...frame.lines.flatMap(line=>line.points),...frame.dots,...frame.rings]){
        assert.ok(Number.isFinite(entry.x),id+' x');
        assert.ok(Number.isFinite(entry.y),id+' y');
      }
    }
  }
});

test('recursive division partitions the original unit interval without gaps',()=>{
  const entries=subdivision(6);
  assert.equal(entries.length,64);
  assert.equal(entries[0].start,0);
  assert.equal(entries.at(-1).end,1);
  for(let index=1;index<entries.length;index+=1)assert.equal(entries[index-1].end,entries[index].start);
});
