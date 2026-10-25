'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {validatePortfolioSelection}=require('../tools/validate-portfolio-selection.cjs');
const root=path.resolve(__dirname,'..');
test('withdrawn game routes, images, cards and the exact old commit stay outside every generated entrance',()=>{
 const routes=['','profil/','arbeiten/','koennen/','belege/','forschung/','modelle/','audits/','lernen/','motion/','handbuch/','pulsar/','zertifikate/','werkzertifikate/'];
 for(const prefix of ['','en/','ru/'])for(const route of routes){
  const content=fs.readFileSync(path.join(root,prefix,route,'index.html'),'utf8');
  assert.doesNotThrow(()=>validatePortfolioSelection(content),prefix+route);
 }
 for(const asset of ['scene-astralis.webp','ashbound-grimoire.png'])assert.equal(fs.existsSync(path.join(root,'assets',asset)),false);
});
test('each catalog is checked and synthetic reintroduction is rejected before rendering',()=>{
 for(const name of ['projects','scene-stage','public-repositories','work-samples','technical-map','research-index']){
  const data=JSON.parse(fs.readFileSync(path.join(root,'data',name+'.json'),'utf8'));
  assert.equal(validatePortfolioSelection(data),data);
 }
 for(const value of [
  {href:'https://github.com/Juri-Halveth/halveth-unreal'},
  {image:'/assets/scene-astralis.webp'},
  {title:'Portal Garden'},
  {project:'ashbound-native'},
  {source:'https://github.com/Juri-Halveth/halveth-morrowind-genesis'},
  {project:'halveth-realms'}
 ])assert.throws(()=>validatePortfolioSelection(value),/Withdrawn game/);
 assert.doesNotThrow(()=>validatePortfolioSelection({purpose:'Learning missions and interactive geometry'}));
 const builder=fs.readFileSync(path.join(root,'tools/build-portfolio.cjs'),'utf8');
 assert.match(builder,/validatePortfolioSelection\(\[data,sceneCatalog,publicRepositories,workSamples,technicalMap,researchIndex\]\)/);
});
