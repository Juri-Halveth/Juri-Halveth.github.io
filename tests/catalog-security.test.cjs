'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const catalog=require('../data/projects.json'),{validateProjects,publicUrl,validateRepositorySnapshot,encodeSourcePath}=require('../tools/validate-projects.cjs');
test('all published catalog entries retain canonical version-bound links',()=>assert.equal(validateProjects(catalog),catalog));
test('catalog URLs reject attribute breaks, other schemes, identity changes and ambiguous URL spellings',()=>{
 const cases=[['repository','https://example.invalid/" data-review-marker="x'],['source',catalog.projects[0].source+'" data-review-marker="x'],['demo','data:text/plain,SYNTHETIC'],['demo','javascript:void(0)'],['repository',['https://github.com/Juri-Halveth/fortuna']],['source','https://github.com/Juri-Halveth/fortuna/tree/'+catalog.projects[0].revision],['demo','https://github.com@evil.invalid/'],['demo','https://juri-halveth.github.io\\@evil.invalid/']];
 for(const [field,value]of cases){const altered=structuredClone(catalog);altered.projects[0][field]=value;assert.throws(()=>validateProjects(altered),undefined,field);}
 for(const url of ['https://github.com/Juri-Halveth/../other','https://github.com/Juri-Halveth/%2e%2e/other','https://juri-halveth.github.io:443/','https://juri-halveth.github.io/?x=1'])assert.throws(()=>publicUrl(url));
});

test('a newer project revision cannot inherit a local test declaration',()=>{
 const altered=structuredClone(catalog),lab=altered.projects.find(p=>p.verification==='LOCAL_MODEL_TESTS');
 lab.revision='f'.repeat(40);lab.source=lab.repository+'/tree/'+lab.revision;
 assert.throws(()=>validateProjects(altered),/Local checks must bind/);
});

test('directory metadata rejects markup, arrays, calendar errors and changed repository identities',()=>{
 const snapshot=require('../data/public-repositories.json');validateRepositorySnapshot(snapshot);
 for(const observedAt of [['2026-10-24','<b>fixture</b>'],'<b>fixture</b>','2026-02-31T00:00:00Z',null]){
  const altered=structuredClone(snapshot);altered.observedAt=observedAt;assert.throws(()=>validateRepositorySnapshot(altered));
 }
 const altered=structuredClone(snapshot);altered.repositories[0].source=altered.repositories[1].source;assert.throws(()=>validateRepositorySnapshot(altered));
});

test('source path encoding preserves safe filenames and rejects scope-changing segments',()=>{
 assert.equal(encodeSourcePath('docs/safe file(1).md'),'docs/safe%20file%281%29.md');
 assert.equal(encodeSourcePath('docs/file..md'),'docs/file..md');
 for(const value of ['docs/../README.md','./README.md','docs//README.md','docs\\README.md',['README.md'],'README.md\0'])assert.throws(()=>encodeSourcePath(value));
});
