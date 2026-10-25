'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom'),root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const catalog=JSON.parse(read('data/projects.json'));
test('the sitemap includes every canonical route in all three languages',()=>{
 const xml=new JSDOM(read('sitemap.xml'),{contentType:'text/xml'}).window.document;
 const urls=[...xml.querySelectorAll('loc')].map(x=>x.textContent);
 for(const prefix of ['','en/','ru/'])for(const route of ['','profil/','arbeiten/','koennen/','belege/','modelle/','audits/','lernen/','motion/','handbuch/'])assert.ok(urls.includes('https://juri-halveth.github.io/'+prefix+route),prefix+route);
 assert.equal(urls.length,new Set(urls).size);
});
test('each card renders its limited review state and supplied command',()=>{
 for(const prefix of ['','en/','ru/']){
  const doc=new JSDOM(read(prefix+'arbeiten/index.html')).window.document;
  for(const p of catalog.projects){const card=doc.querySelector(`[data-project="${p.id}"]`);assert.ok(card.querySelector('.verification-state').textContent.trim());if(p.command)assert.equal(card.querySelector('.project-command code').textContent,p.command);}
 }
});
test('generated motion pages wire all existing player controls rather than ambient playback',()=>{
 for(const prefix of ['','en/','ru/']){
  const doc=new JSDOM(read(prefix+'motion/index.html')).window.document;
  for(const id of ['motion-canvas','motion-play','motion-reverse','motion-time','motion-clock','motion-speed','motion-glow','motion-loop','motion-phase'])assert.ok(doc.getElementById(id),id);
  const script=doc.querySelector('script[src$="motion-player.js"]');assert.ok(script);assert.equal(new URL(script.getAttribute('src'),'https://example.invalid/portfolio/'+prefix+'motion/').href,'https://example.invalid/portfolio/motion-player.js');assert.equal(doc.querySelectorAll('[data-ambient-motion]').length,0);
 }
});
test('retained crawler choices survive every deterministic build',()=>{
 const robots=read('robots.txt');assert.equal(robots,read('data/robots.txt'));
 for(const name of ['GPTBot','CCBot','Google-Extended','ClaudeBot','anthropic-ai','Amazonbot'])assert.ok(robots.includes('User-agent: '+name+'\nDisallow: /'));
});
test('image suffix matches existing JPEG bytes and SCARLET source is pinned',()=>{
 const bytes=fs.readFileSync(path.join(root,'assets/scarlet-cannon-live.jpg'));assert.deepEqual([...bytes.subarray(0,3)],[255,216,255]);
 const doc=new JSDOM(read('index.html')).window.document;
 const source=catalog.projects.find(p=>p.id==='halveth-scarlet').source;
 assert.ok(doc.querySelector(`[data-project="halveth-scarlet"] a[href="${source}"]`));
});
test('retained reproduction paths bind each displayed revision',()=>{
 const samples=JSON.parse(read('data/work-samples.json')).samples;
 assert.deepEqual(samples.map(x=>x.id),['source-packets','scarlet-interaction']);
 for(const sample of samples){
  if(sample.localCheck==='LOCAL_MODEL_TESTS')assert.ok(sample.commands.includes('git checkout '+sample.revision),sample.id);
  else assert.match(sample.commands,/Browser: open the live scene/);
 }
 const lab=catalog.projects.find(p=>p.id==='halveth-forschungslabor');
 for(const prefix of ['','en/','ru/'])assert.ok(new JSDOM(read(prefix+'handbuch/index.html')).window.document.querySelector('pre').textContent.includes('git checkout '+lab.revision));
});
