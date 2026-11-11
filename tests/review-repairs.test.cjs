'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom'),root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const catalog=JSON.parse(read('data/projects.json'));
test('missing and retired URLs keep 404 status and offer working recovery paths in every language',()=>{
 const handler=require('../tools/serve-space.cjs').createPreviewHandler(root);
 const request=(url,method='GET')=>{const response={};handler({url,method},{writeHead(status){response.status=status;},end(body){response.body=body?.toString()??'';}});return response;};
 for(const route of ['/en/schuelervz-halveth/index.html','/en/schuelervz-halveth/archaeology.html','/en/schuelervz-halveth/people.html','/unknown/nested/page']){
  const response=request(route);assert.equal(response.status,404,route);assert.equal(request(route,'HEAD').status,404);assert.equal(request(route,'HEAD').body,'');
  const doc=new JSDOM(response.body,{url:'https://juri-halveth.github.io'+route}).window.document;
  assert.match(doc.title,/404/);assert.equal(doc.querySelectorAll('h1').length,1);
  assert.equal(doc.querySelector('meta[name="robots"]').content,'noindex,follow');
  assert.equal(doc.querySelectorAll('script,meta[http-equiv="refresh"],link[rel="canonical"]').length,0);
  assert.doesNotMatch(doc.body.textContent,/neu geordnet|relocated|moved/i);
  for(const lang of ['de','en','ru']){
   const section=doc.querySelector(`section[lang="${lang}"]`),prefix=lang==='de'?'/':`/${lang}/`;assert.ok(section,lang);
   for(const destination of ['arbeiten/','belege/'])assert.ok(section.querySelector(`a[href="${prefix}${destination}"]`));
  }
  for(const node of doc.querySelectorAll('[href],[src]')){
   const value=node.getAttribute('href')||node.getAttribute('src');
   if(value.startsWith('#')){assert.ok(doc.getElementById(value.slice(1)));continue;}
   const url=new URL(value,doc.URL);assert.equal(url.origin,'https://juri-halveth.github.io');assert.equal(request(url.pathname).status,200,value);
  }
 }
});
test('the sitemap includes every canonical route in all three languages',()=>{
 const xml=new JSDOM(read('sitemap.xml'),{contentType:'text/xml'}).window.document;
 const urls=[...xml.querySelectorAll('loc')].map(x=>x.textContent);
 for(const prefix of ['','en/','ru/'])for(const route of ['','profil/','arbeiten/','koennen/','belege/','modelle/','audits/','lernen/','motion/','handbuch/'])assert.ok(urls.includes('https://juri-halveth.github.io/'+prefix+route),prefix+route);
 assert.equal(urls.length,new Set(urls).size);
});
test('current directory cards name their scope and preserve direct source links',()=>{
 const site=JSON.parse(read('data/site-catalog.json'));
 for(const prefix of ['','en/','ru/']){
  const doc=new JSDOM(read(prefix+'arbeiten/index.html')).window.document;
  for(const p of site.projects.filter(p=>p.site.entry_type==='PROJECT'&&p.site.editorial_state==='CURRENT')){
   const card=doc.querySelector(`[data-project="${p.id}"]`);assert.ok(card,p.id);
   assert.ok(card.querySelector('.work-kind').textContent.trim());
   assert.equal(card.querySelector('.directory-actions a:nth-child(2)').getAttribute('href'),p.source_url);
  }
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
 const doc=new JSDOM(read('arbeiten/index.html')).window.document;
 const source=JSON.parse(read('data/site-catalog.json')).projects.find(p=>p.id==='halveth-scarlet').source_url;
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
