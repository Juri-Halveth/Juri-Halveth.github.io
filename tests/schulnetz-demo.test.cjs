'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),route=path.join(root,'demos/schuelervz');
const read=name=>fs.readFileSync(path.join(route,name),'utf8');
const M=require('../demos/schuelervz/model.js');
const storageKey='halveth-schulnetz-demo-v1';
function browser(options={}){
 const dom=new JSDOM(read('index.html'),{url:'https://example.test/demos/schuelervz/',runScripts:'outside-only'}),w=dom.window;
 if(options.blockStorage)Object.defineProperty(w,'localStorage',{value:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}}});
 else{if(options.saved!==undefined)w.localStorage.setItem(storageKey,options.saved);w.localStorage.setItem('unrelated-state','preserved');}
 // Dialog rendering is covered by the separate real-browser acceptance.
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.eval(read('model.js'));w.eval(read('app.js'));
 return {dom,w,doc:w.document,close:()=>w.close()};
}
test('approved demo bytes survive integration and local resources resolve beneath the new route',()=>{
 const expected={
  'index.html':'030183eaead4b94a9c64ba968d39d9eca8fe61ecbed3137b5c183e91955d2705',
  'style.css':'9e3400ed193d66886989b9d1968f572232b59836e7212e927a2e5f2fd7b30ead',
  'model.js':'fcae3e16daf1ee771e73197d71cbad0e81183ec38e83d737e9f44a03941f79e1',
  'app.js':'0726a99294d9a7518e837126f10c260d46bb8f2dbef2272d6611d32a34aaa63e'};
 for(const [file,hash]of Object.entries(expected))assert.equal(createHash('sha256').update(fs.readFileSync(path.join(route,file))).digest('hex'),hash,file);
 const dom=new JSDOM(read('index.html')),doc=dom.window.document;
 for(const n of doc.querySelectorAll('[src],[href]')){
  const u=n.getAttribute('src')||n.getAttribute('href');
  if(u==='./')continue;
  if(u.startsWith('#')){assert.ok(doc.getElementById(u.slice(1)),u);continue;}
  assert.ok(!/^(?:[a-z]+:|\/)/i.test(u),'demo resources remain local and relative');
  assert.ok(fs.existsSync(path.join(route,u)),u);
 }
 assert.match(doc.querySelector('meta[http-equiv="Content-Security-Policy"]').content,/connect-src 'none'/);
 assert.match(doc.body.textContent,/Alle Personen, Gruppen und Beiträge sind frei erfunden/);
 assert.equal(fs.existsSync(path.join(root,'schuelervz-halveth')),false,'retired archive route stays absent');
 dom.window.close();
});
test('search narrows synthetic people and groups and recovers from an empty result',()=>{
 const b=browser();try{
  assert.equal(b.doc.querySelectorAll('#results>article').length,9);
  const input=b.doc.getElementById('search');input.value='Musik';input.dispatchEvent(new b.w.Event('input'));
  assert.equal(b.doc.querySelectorAll('#results>article').length,3);
  b.doc.querySelector('[data-filter="people"]').click();assert.equal(b.doc.querySelectorAll('#results>article').length,2);
  input.value='no-such-demo-entry';input.dispatchEvent(new b.w.Event('input'));assert.equal(b.doc.getElementById('empty').hidden,false);
  b.doc.getElementById('reset').click();assert.equal(b.doc.querySelectorAll('#results>article').length,9);assert.equal(b.doc.getElementById('empty').hidden,true);
 }finally{b.close();}
});
test('profile is explicitly fictional and group choice changes only local state',()=>{
 const b=browser();try{
  b.doc.querySelector('.open-profile').click();assert.equal(b.doc.getElementById('profile-dialog').open,true);assert.match(b.doc.getElementById('dialog-title').textContent,/Mira/);assert.match(b.doc.getElementById('profile-dialog').textContent,/keiner realen Person/);
  b.doc.getElementById('dialog-close').click();assert.equal(b.doc.getElementById('profile-dialog').open,false);
  b.doc.querySelector('[data-group="musik"]').click();assert.deepEqual(JSON.parse(b.w.localStorage.getItem(storageKey)).joined,['musik']);
  b.doc.querySelector('[data-group="musik"]').click();assert.deepEqual(JSON.parse(b.w.localStorage.getItem(storageKey)).joined,[]);
 }finally{b.close();}
});
test('post markup stays literal across local reload and reset preserves unrelated browser data',()=>{
 const text='<img src=x onerror=alert(1)> Hallo';let saved;
 const first=browser();try{
  first.doc.getElementById('post').value=text;first.doc.getElementById('post-form').dispatchEvent(new first.w.Event('submit',{cancelable:true}));
  assert.equal(first.doc.querySelector('#posts img'),null);assert.equal(first.doc.querySelector('#posts .post p').textContent,text);
  saved=first.w.localStorage.getItem(storageKey);
 }finally{first.close();}
 const second=browser({saved});try{
  assert.equal(second.doc.querySelector('#posts .post p').textContent,text);
  second.doc.getElementById('reset').click();assert.equal(second.w.localStorage.getItem(storageKey),null);assert.equal(second.w.localStorage.getItem('unrelated-state'),'preserved');assert.equal(second.doc.querySelectorAll('#posts .post').length,2);
 }finally{second.close();}
});
test('blocked or corrupt storage is visibly reported without disabling the demo',()=>{
 const corrupt=browser({saved:'{broken'});try{assert.match(corrupt.doc.getElementById('feedback').textContent,/nicht lesbar/);assert.equal(corrupt.doc.querySelectorAll('#results>article').length,9);}finally{corrupt.close();}
 const blocked=browser({blockStorage:true});try{
  assert.match(blocked.doc.getElementById('feedback').textContent,/keine lokale Speicherung/);
  blocked.doc.getElementById('post').value='Temporary hello';blocked.doc.getElementById('post-form').dispatchEvent(new blocked.w.Event('submit',{cancelable:true}));
  assert.match(blocked.doc.getElementById('feedback').textContent,/nur während dieses Besuchs/);assert.equal(blocked.doc.querySelector('#posts .post p').textContent,'Temporary hello');
 }finally{blocked.close();}
});
test('post limits reject loss, invalid membership and oversized imports',()=>{
 assert.throws(()=>M.addPost(M.fresh(),'  ','x'));assert.throws(()=>M.addPost(M.fresh(),'x'.repeat(241),'x'));assert.throws(()=>M.toggleGroup(M.fresh(),'unknown'));
 let s=M.fresh();for(let i=0;i<30;i++)s=M.addPost(s,'text','p-'+i);assert.throws(()=>M.addPost(s,'last','last'));assert.equal(s.posts.length,30);
 assert.ok(M.load(JSON.stringify({...s,posts:[...s.posts,{id:'extra',text:'extra'}]})).warning);
 assert.ok(M.load(JSON.stringify({version:1,posts:[],joined:['stranger']})).warning);
 assert.deepEqual(M.load(JSON.stringify(s)).state,s);
});
