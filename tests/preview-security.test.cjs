'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createPreviewHandler}=require('../tools/serve-space.cjs');
function request(handler,url,method='GET'){const response={};handler({url,method},{writeHead(status,headers){response.status=status;response.headers=headers;},end(body){response.body=body?.toString()??'';}});return response;}
function fixture(t){
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'halveth-preview-contract-')),root=path.join(parent,'public');fs.mkdirSync(root);
 for(const [name,body]of Object.entries({'index.html':'PUBLIC_INDEX','404.html':'PUBLIC_404','.env':'SYNTHETIC_PRIVATE','.git':'SYNTHETIC_GIT','normal.mjs':'PUBLIC_MODULE','scene.webp':'PUBLIC_WEBP','sp ace.html':'PUBLIC_SPACE'}))fs.writeFileSync(path.join(root,name),body);
 fs.mkdirSync(path.join(root,'en'));fs.writeFileSync(path.join(root,'en/index.html'),'PUBLIC_EN');
 t.after(()=>{const real=fs.realpathSync(parent),relative=path.relative(fs.realpathSync(os.tmpdir()),real);assert.ok(relative&&!path.isAbsolute(relative)&&!relative.startsWith('..'));fs.rmSync(real,{recursive:true,force:true});});
 return {parent,root,handler:createPreviewHandler(root)};
}
test('decoded and mixed Windows separators cannot disclose synthetic hidden in-root files',t=>{
 const {handler}=fixture(t);
 for(const url of ['/.env','/%2eenv','/public%5c..%5c.env','/public%5C..%5C.git','/public%5c..%5c.git%5cconfig','/%2e%2e/.env','/public%2f..%2f.env','/%00/normal.mjs','/%E0%A4%A']){
  const r=request(handler,url);assert.equal(r.status,404,url);assert.equal(r.body,'PUBLIC_404');assert.doesNotMatch(r.body,/SYNTHETIC/);
 }
});
test('ordinary pages, languages, encoded spaces, modules and HEAD remain usable',t=>{
 const {handler}=fixture(t);
 for(const [url,body]of [['/','PUBLIC_INDEX'],['/en','PUBLIC_EN'],['/en/','PUBLIC_EN'],['/normal.mjs?v=1','PUBLIC_MODULE'],['/sp%20ace.html','PUBLIC_SPACE']]){const r=request(handler,url);assert.equal(r.status,200,url);assert.equal(r.body,body);}
 const image=request(handler,'/scene.webp');assert.equal(image.headers['Content-Type'],'image/webp');
 assert.equal(request(handler,'/','HEAD').body,'');assert.equal(request(handler,'/missing','HEAD').body,'');assert.equal(request(handler,'/','POST').status,405);
});
test('realpath policy covers hidden targets, outside junctions and a symlinked serving root',t=>{
 const {parent,root,handler}=fixture(t),hidden=path.join(root,'.hidden'),outside=path.join(parent,'outside');fs.mkdirSync(hidden);fs.writeFileSync(path.join(hidden,'index.html'),'SYNTHETIC_HIDDEN_TARGET');fs.mkdirSync(outside);fs.writeFileSync(path.join(outside,'index.html'),'SYNTHETIC_OUTSIDE_TARGET');
 const kind=process.platform==='win32'?'junction':'dir';fs.symlinkSync(hidden,path.join(root,'alias'),kind);fs.symlinkSync(outside,path.join(root,'external'),kind);fs.symlinkSync(root,path.join(parent,'root-alias'),kind);
 assert.equal(request(handler,'/alias').status,404);assert.equal(request(handler,'/external').status,404);assert.equal(request(createPreviewHandler(path.join(parent,'root-alias')),'/').body,'PUBLIC_INDEX');
});
test('a redirected or unreadable fallback returns constant text without escaping its own error path',t=>{
 const {parent,root}=fixture(t),outside=path.join(parent,'secret.txt');fs.writeFileSync(outside,'SYNTHETIC_OUTSIDE_FALLBACK');
 const redirected={...fs,realpathSync(file){return file===path.join(root,'404.html')?outside:fs.realpathSync(file);}};
 const r=request(createPreviewHandler(root,redirected),'/missing');assert.equal(r.status,404);assert.equal(r.body,'Not found');
 const unreadable={...fs,readFileSync(file){if(file===path.join(root,'404.html'))throw Error('Synthetic permission failure');return fs.readFileSync(file);}};
 assert.equal(request(createPreviewHandler(root,unreadable),'/missing').body,'Not found');
});

test('native canonical names close short-alias disclosure for normal files, indexes and fallback',t=>{
 const {root}=fixture(t),hidden=path.join(root,'.private-record.html'),alias=path.join(root,'PRIVAT~1.HTM');
 fs.writeFileSync(hidden,'SYNTHETIC_HIDDEN_ALIAS');fs.writeFileSync(alias,'SYNTHETIC_ALIAS_CONTENT');
 let nativeCalls=0;
 const resolve=file=>fs.realpathSync(file);
 resolve.native=file=>{nativeCalls++;return file===alias||file===path.join(root,'404.html')?hidden:fs.realpathSync(file);};
 const handler=createPreviewHandler(root,{...fs,realpathSync:resolve});
 assert.equal(request(handler,'/PRIVAT~1.HTM').status,404);
 assert.equal(request(handler,'/missing').body,'Not found');
 assert.equal(request(handler,'/normal.mjs').body,'PUBLIC_MODULE');assert.ok(nativeCalls>=4);
});
