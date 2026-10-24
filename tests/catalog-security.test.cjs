'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const catalog=require('../data/projects.json'),{validateProjects,publicUrl}=require('../tools/validate-projects.cjs');
test('all published catalog entries retain canonical version-bound links',()=>assert.equal(validateProjects(catalog),catalog));
test('catalog URLs reject attribute breaks, other schemes, identity changes and ambiguous URL spellings',()=>{
 const cases=[['repository','https://example.invalid/" data-review-marker="x'],['source',catalog.projects[0].source+'" data-review-marker="x'],['demo','data:text/plain,SYNTHETIC'],['demo','javascript:void(0)'],['repository',['https://github.com/Juri-Halveth/fortuna']],['source','https://github.com/Juri-Halveth/fortuna/tree/'+catalog.projects[0].revision],['demo','https://github.com@evil.invalid/'],['demo','https://juri-halveth.github.io\\@evil.invalid/']];
 for(const [field,value]of cases){const altered=structuredClone(catalog);altered.projects[0][field]=value;assert.throws(()=>validateProjects(altered),undefined,field);}
 for(const url of ['https://github.com/Juri-Halveth/../other','https://github.com/Juri-Halveth/%2e%2e/other','https://juri-halveth.github.io:443/','https://juri-halveth.github.io/?x=1'])assert.throws(()=>publicUrl(url));
});
