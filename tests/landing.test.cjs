'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process');
const P=require('../tools/portfolio.cjs'),data=require('../data/portfolio.json'),inventory=require('../data/juris-space.json'),sources=require('../data/public-sources.json'),certs=require('../werkzertifikate/2026-09-28-v1.1/ZERTIFIKATNAMEN.json');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
test('topic priority binds every former source exactly once',()=>{
  assert.equal(P.validate(data,inventory,sources,certs),true);
  assert.equal(new Set(data.sections.flatMap(s=>s.sourceIds)).size,17);
  const duplicate=structuredClone(data);duplicate.sections[1].sourceIds.push('RESEARCH');
  assert.throws(()=>P.validate(duplicate,inventory,sources,certs));
});
test('a landing page presents the five topics without playback or focus controls',()=>{
  const html=read('index.html');
  assert.deepEqual([...html.matchAll(/data-topic="([^"]+)"/g)].map(m=>m[1]),P.SECTION_IDS);
  assert.equal((html.match(/data-collection="learning"/g)||[]).length,1);
  assert.doesNotMatch(html,/<button|<input|<select|<video|<audio|choose-project|motion-player\.js|project-search/);
  assert.equal((html.match(/data-ambient-motion/g)||[]).length,2);assert.match(html,/landing-motion\.js/);
  assert.match(html,/White-Hat-Research/);assert.match(html,/connect-src 'none'/);
  assert.equal((html.match(/<h1 /g)||[]).length,1);
});
test('learn websites and code are folded into one source entry',()=>{
  const html=read('arbeiten/index.html');
  assert.equal((html.match(/data-source="LEARNSTUDIO LEARNPORTAL LEARNSTUDIO_SITE"/g)||[]).length,1);
  assert.doesNotMatch(html,/data-source="LEARNPORTAL"/);
  assert.equal((html.match(/data-source="SCARLET SCARLET_SITE"/g)||[]).length,1);
});
test('every bound research document appears once and keeps its exact source URL',()=>{
  const html=read('arbeiten/index.html');
  assert.equal((html.match(/data-document=/g)||[]).length,sources.research.documents.length);
  for(const d of sources.research.documents){assert.ok(html.includes('data-document="'+d.path+'"'));assert.ok(html.includes(d.url));}
  const placed=[...html.matchAll(/data-source="([^"]+)"/g)].flatMap(m=>m[1].split(' '));
  assert.deepEqual(placed.slice().sort(),inventory.projects.map(p=>p.id).sort());
});
test('formal qualifications are not fabricated from private work certificates',()=>{
  assert.equal(data.certificates.kind,'PRIVATE_WORK_DOCUMENTATION');
  assert.equal(certs.length,11);assert.match(read('profil/index.html'),/Elf eigene Projektzertifikate dokumentieren Ergebnisse, Quellstände und Prüfungen/);
  assert.match(read('profil/index.html'),/Institutionell ausgestellte Qualifikationsnachweise führen eine eigene Aussteller-/);
  for(const c of certs)assert.ok(read('profil/index.html').includes('/werkzertifikate/#'+c.anchor));
});
test('public destinations reject credentials, foreign hosts, loopback and file paths',()=>{
  for(const url of ['file:///C:/private.txt','http://127.0.0.1:4196/','https://secret@github.com/private','https://example.org/'])assert.throws(()=>P.publicLink(url));
  const copy=structuredClone(data);copy.capabilities[0].url='https://example.org/';
  assert.throws(()=>P.validate(copy,inventory,sources,certs));
});
test('all new own pages have working local anchors and file destinations',()=>{
  for(const file of ['index.html','arbeiten/index.html','profil/index.html','404.html']){
    const html=read(file),ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
    for(const m of html.matchAll(/\bhref="([^"]+)"/g)){
      const u=new URL(m[1],'https://juri-halveth.github.io/'+(file==='index.html'?'':file));
      if(u.hostname!=='juri-halveth.github.io'||!m[1].startsWith('/')&&!m[1].startsWith('#')&&m[1].includes(':'))continue;
      if(u.pathname==='/')u.pathname='/index.html';
      const dest=decodeURIComponent(u.pathname.slice(1));
      const resolved=path.join(root,dest.endsWith('/')?dest+'index.html':dest);
      assert.ok(fs.existsSync(resolved),file+' -> '+m[1]);
      if(u.hash && /\.html$/.test(resolved)){
        const target=resolved===path.join(root,file)?html:fs.readFileSync(resolved,'utf8');
        assert.ok(target.includes('id="'+u.hash.slice(1)+'"'),file+' missing anchor '+m[1]);
      }
    }
    assert.equal(ids.size,[...html.matchAll(/\bid="([^"]+)"/g)].length,'duplicate HTML IDs');
  }
});
test('subpages, archive entrances and not-found routes return to origin',()=>{
  for(const file of ['arbeiten/index.html','profil/index.html','404.html','motion/index.html','werkzertifikate/index.html','schuelervz-halveth/index.html','schuelervz-halveth/people.html','schuelervz-halveth/archaeology.html','schuelervz-halveth/prestige.html']){
    assert.match(read(file),/href="\/"(?:[^>]*>)[^<]*(?:Startseite|Themenübersicht)/,file);
  }
});
test('old project links resolve directly to the appropriate topic with no saved focus',()=>{
  let redirected;
  const href='https://juri-halveth.github.io/?project=MORROWIND#focus';
  vm.runInNewContext(read('portal.js'),{URL,URLSearchParams,window:{location:{href,search:'?project=MORROWIND',replace(v){redirected=v;}}}});
  assert.equal(redirected,'https://juri-halveth.github.io/#gestaltung');
  assert.doesNotMatch(read('portal.js'),/localStorage|fetch\(|XMLHttpRequest/);
});
test('static build is reproducible across repeated executions',()=>{
  const files=['index.html','arbeiten/index.html','profil/index.html','profil/CV-Juri-Halveth.md','404.html'];
  const before=files.map(read);
  cp.execFileSync(process.execPath,['tools/build-space.cjs'],{cwd:root});
  assert.deepEqual(files.map(read),before);
});
test('reduced motion is honored and CSS includes a narrow layout',()=>{
  assert.match(read('portal.css'),/prefers-reduced-motion:reduce/);
  assert.match(read('portal.css'),/max-width:760px/);
  assert.match(read('portal.css'),/focus-visible/);
});
