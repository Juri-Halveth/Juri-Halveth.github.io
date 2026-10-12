'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const models=require('../data/models.json');
const translations=require('../data/model-atlas-translations.json');

const atlasIds=['erste-regel','wellenfeld','dimensionen','schichten','strudel-3d','strudel-2d','zwischenraum','beobachterraum'];

test('the public model hub lists every rebuilt state model exactly once',()=>{
  assert.equal(models.models.length,11);
  assert.deepEqual(models.models.slice(-atlasIds.length).map(model=>model.id),atlasIds);
  const html=read('modelle/index.html');
  for(const id of atlasIds){
    assert.equal((html.match(new RegExp('data-model="'+id+'"','g'))||[]).length,1,id);
    const model=models.models.find(entry=>entry.id===id);
    assert.equal(model.demo,'/modelle/raumzeit/#'+id);
    assert.match(model.source,/Juri-Halveth\.github\.io\/tree\/main\/modelle\/raumzeit/);
    for(const value of [model.title,model.kind,model.result,model.scope,model.next]){
      assert.ok(translations[value]?.en,value+' has English text');
      assert.ok(translations[value]?.ru,value+' has Russian text');
    }
  }
  assert.match(html,/11 ÖFFENTLICHE MODELLZUGÄNGE/);
  assert.match(html,/modelle\/raumzeit\//);
  assert.match(read('en/modelle/index.html'),/11 models\.<br><em>One visible atlas\.<\/em>/);
  assert.match(read('ru/modelle/index.html'),/11 моделей\.<br><em>Один видимый атлас\.<\/em>/);
});

test('the state atlas is published as a self-contained source-coded model',()=>{
  const html=read('modelle/raumzeit/index.html');
  assert.match(html,/script-src 'self'/);
  assert.match(html,/type="module" src="view\.mjs"/);
  assert.match(html,/id="state-atlas"/);
  assert.match(read('modelle/raumzeit/view.mjs'),/from '\.\/core\.mjs'/);
  assert.match(read('sitemap.xml'),/https:\/\/juri-halveth\.github\.io\/modelle\/raumzeit\//);
});
