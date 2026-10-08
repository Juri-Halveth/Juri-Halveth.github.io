'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');

const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const sourcePages=[
  'index.html','404.html','arbeiten/index.html','koennen/index.html','lernen/index.html',
  'audits/index.html','zertifikate/index.html','modelle/index.html','motion/index.html',
  'werkzertifikate/index.html','schuelervz-halveth/index.html','schuelervz-halveth/people.html',
  'schuelervz-halveth/archaeology.html','schuelervz-halveth/prestige.html','handbuch/index.html'
];
const pages=['', 'en/', 'ru/'].flatMap(prefix=>sourcePages.map(file=>prefix+file));
const namedPages=new Set(['profil/index.html','en/profil/index.html','ru/profil/index.html',
  'werkzertifikate/index.html','en/werkzertifikate/index.html','ru/werkzertifikate/index.html']);
const personalName=/(?:\bJuri(?:s)?\b|Juri[- ](?:Halveth|Janovski)|\bJURI\b|Юри[йяюи]|juri-halveth\.github\.io)/iu;

function visibleSurface(file){
  const document=new JSDOM(read(file)).window.document;
  const meta=[...document.querySelectorAll('meta[name="description"],meta[property="og:title"],meta[property="og:description"]')]
    .map(element=>element.getAttribute('content')||'');
  const attrs=[...document.querySelectorAll('[alt],[title],[aria-label],[placeholder],[aria-valuetext]')]
    .map(element=>['alt','title','aria-label','placeholder','aria-valuetext']
      .map(name=>element.getAttribute(name)||'').join(' '));
  for(const element of document.querySelectorAll('script,style,code,pre,textarea,template,noscript'))element.remove();
  return [document.title,...meta,...attrs,document.body?.textContent||''].join(' ');
}

test('all public page labels use HALVETH while CV and work-certificate attribution remains',()=>{
  for(const file of pages){
    if(namedPages.has(file))continue;
    assert.doesNotMatch(visibleSurface(file),personalName,file+' exposes a personal name in its public display');
  }
  for(const file of namedPages)assert.match(visibleSurface(file),/Juri Halveth|Juri Janovski/iu,file+' should retain certificate attribution');
});

test('non-profile proposal display omits the personal attribution and preserves the exact source evidence',()=>{
  const evidence=JSON.parse(read('data/competence-evidence.json'));
  const proposal=evidence.proofs.find(proof=>proof.id==='P06');
  assert.ok(proposal);
  assert.ok(proposal.source.excerpt.startsWith('**Public proposal by '));
  require('../tools/code-evidence.cjs').validate(evidence);
  const notes={
    '':'Namenszeile ausgelassen; Originaltext unverändert verlinkt.',
    'en/':'Author line omitted; original text remains unchanged at the source link.',
    'ru/':'Строка с именем автора пропущена; оригинальный текст доступен по ссылке без изменений.'
  };
  for(const [prefix,noteText] of Object.entries(notes)){
    const document=new JSDOM(read(prefix+'koennen/index.html')).window.document;
    const source=document.querySelector('[data-proof="P06"] .source-code');
    assert.ok(source,prefix+'P06 source excerpt exists');
    assert.equal(source.querySelector('.source-attribution-note')?.textContent,noteText);
    assert.doesNotMatch(source.querySelector('pre')?.textContent||'',personalName);
  }
});

test('display-name cleanup preserves the exact source links and repository identity',()=>{
  const work=read('arbeiten/index.html');
  assert.match(work,/href="https:\/\/github\.com\/Juri-Halveth\/open-research-branches/);
  assert.match(work,/Herkunft · HALVETH/);
  for(const personFile of ['schuelervz-halveth/data/people.json','schuelervz-halveth/data/prestige-people.json']){
    const person=JSON.parse(read(personFile))[0];
    assert.equal(person.display_name,'HALVETH');
    assert.equal(person.github,'Juri-Halveth');
  }
  const visitor=read('schuelervz-halveth/assets/vz.js');
  assert.match(visitor,/who:"HALVETH"/);
  assert.match(visitor,/HALVETH-2026.*display_name.*HALVETH/);
  assert.match(visitor,/x\.who==="Juri"\?"HALVETH"/);
});
