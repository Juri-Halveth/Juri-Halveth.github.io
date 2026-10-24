'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.mp4':'video/mp4','.md':'text/plain; charset=utf-8','.pdf':'application/pdf'};
function createPreviewHandler(directory=root,fileSystem=fs){
 const canonical=fileSystem.realpathSync.native||fileSystem.realpathSync;
 const realRoot=canonical(path.resolve(directory));
 function contained(file){const relative=path.relative(realRoot,file);return relative!==''&&!path.isAbsolute(relative)&&!relative.split(path.sep).some(part=>part==='..'||part.startsWith('.'));}
 function publicFile(name){
  if(typeof name!=='string'||!name.startsWith('/')||/[\\\0:]/.test(name)||name.split('/').some(part=>part.startsWith('.')))throw Error('Invalid preview path');
  let file=path.resolve(realRoot,'.'+name);
  if(file!==realRoot&&!contained(file))throw Error('Outside preview');
  if(fileSystem.statSync(file).isDirectory())file=path.join(file,'index.html');
  const real=canonical(file);
  if(!contained(real)||!fileSystem.statSync(real).isFile())throw Error('Unpublished preview path');
  return real;
 }
 return (req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
  try{
   const name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
   const real=publicFile(name),body=fileSystem.readFileSync(real);
   res.writeHead(200,{'Content-Type':types[path.extname(real)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   res.end(req.method==='HEAD'?undefined:body);
  }catch{
   let body=Buffer.from('Not found'),type='text/plain; charset=utf-8';
   try{body=fileSystem.readFileSync(publicFile('/404.html'));type='text/html; charset=utf-8';}catch{}
   res.writeHead(404,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   res.end(req.method==='HEAD'?undefined:body);
  }
 };
}
if(require.main===module){
 const port=Number(process.env.SPACE_PORT||4187);
 if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid local preview port.');
 http.createServer(createPreviewHandler()).listen(port,'127.0.0.1',()=>console.log('HALVETH preview http://127.0.0.1:'+port));
}
module.exports={createPreviewHandler};
