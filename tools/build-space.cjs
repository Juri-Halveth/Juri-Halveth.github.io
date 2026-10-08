'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const P=require('./portfolio.cjs'),C=require('./certificates.cjs'),V=require('./visitor.cjs'),B=require('./public-brand.cjs'),root=path.resolve(__dirname,'..');
const load=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const portfolio=load('data/portfolio.json'),inventory=load('data/juris-space.json'),snapshot=load('data/public-sources.json');
const certificates=load('werkzertifikate/2026-09-28-v1.1/ZERTIFIKATNAMEN.json');
P.validate(portfolio,inventory,snapshot,certificates);
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const a=(url,title,cls='')=>'<a'+(cls?' class="'+esc(cls)+'"':'')+' href="'+esc(P.publicLink(url))+'"'+(url.startsWith('https:')?' target="_blank" rel="noopener"':'')+'>'+esc(title)+'</a>';
const date=new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(snapshot.recordedAt));
const capabilities=portfolio.capabilities.map(c=>'<article class="capability"><h3>'+esc(c.title)+'</h3><p>'+esc(c.description)+'</p>'+a(c.url,c.proof+' ↗')+'</article>').join('\n');
const write=(file,text)=>{const dest=path.join(root,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,text+'\n');};
const home=fs.readFileSync(path.join(root,'templates/index.html'),'utf8').replace('{{CLAIMS}}',C.renderClaims()).replace('{{CLAIM_DEFINITION}}',C.legend).replace('{{CLAIM_EVIDENCE}}','').replace('{{WORK_CERTIFICATES}}',C.renderWorks(certificates)).replace('{{CAPABILITIES}}',capabilities).replace('{{CERTIFICATE_PDF}}',portfolio.certificates.pdf).replaceAll('{{SOURCE_DATE}}',date);
if(/\{\{/.test(home))throw new Error('Unresolved home template');
write('index.html',home.trim());
const header='<header class="site-header shell"><a class="brand" href="/"><span class="brand-mark" aria-hidden="true">H</span><span>HALVETH</span></a><nav aria-label="Navigation"><a href="/profil/">Arbeitsprofil &amp; Zertifikate</a><a href="/modelle/">Modelle & Tests</a><a href="/">Zur Startseite</a><a href="/arbeiten/">Arbeiten</a><a href="/profil/">Arbeitsprofil</a><a href="/#kontakt">Kontakt</a></nav></header>';
const footer='<footer class="site-footer shell"><div><a class="footer-name" href="/">Zur Themenübersicht ↑</a><p>Quellen, Arbeit &amp; Entwicklung</p></div><nav aria-label="Weitere Informationen"><a href="/handbuch/">Handbuch &amp; Quellen</a><a href="/arbeiten/">Alle Arbeiten</a><a href="/werkzertifikate/">Werkzertifikate</a><a href="/LICENSES.md" target="_blank" rel="noopener">Lizenzen ↗</a></nav></footer>';
function page(title,route,content,siteLabel='HALVETH'){
  return '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'self\'; img-src \'self\'; base-uri \'none\'; form-action \'none\'; object-src \'none\'"><meta name="description" content="'+esc(title)+' – öffentliches HALVETH-Portfolio mit Quellen und Rückweg zur Startseite."><link rel="canonical" href="https://juri-halveth.github.io'+route+'"><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/portal.css"><title>'+esc(title)+' · '+esc(siteLabel)+'</title></head><body id="anfang"><a class="skip-link" href="#main">Zum Inhalt</a>'+header+'<main class="shell subpage" id="main">'+content+'</main>'+footer+'</body></html>';
}
const jumps='<nav class="section-jumps" aria-label="Themen im Arbeitsverzeichnis">'+portfolio.sections.map(s=>a('#'+s.id,s.title)).join('')+'</nav>';
const aliases={SCARLET:['SCARLET_SITE'],LEARNSTUDIO:['LEARNPORTAL','LEARNSTUDIO_SITE']};
const folded=new Set(Object.values(aliases).flat());
function sourceLinks(p){
  const entry=p.id==='RESEARCH'?'https://github.com/Juri-Halveth/open-research-branches/blob/'+snapshot.research.commit+'/wiki/Home.md':p.entry;
  const links=[a(entry,p.id==='SPACE'?'Website öffnen ↗':p.kind==='site'?'Website öffnen ↗':entry.includes('github.com')?'Quellbestand öffnen ↗':'Website öffnen ↗')];
  if(p.url!==entry)links.push(a(p.url,'Quellcode ↗'));
  for(const id of aliases[p.id]||[]){
    const alias=inventory.projects.find(v=>v.id===id);
    links.push(a(alias.entry,id==='LEARNPORTAL'?'Freier Lernkatalog ↗':'Weiterer Webzugang ↗'));
    if(alias.url!==alias.entry)links.push(a(alias.url,'Code des Lernkatalogs ↗'));
  }
  return links.join('');
}
function repositoryList(section){
  return section.sourceIds.filter(id=>!folded.has(id)).map(id=>{
    const p=inventory.projects.find(v=>v.id===id);
    return '<li data-source="'+[id,...(aliases[id]||[])].join(' ')+'"><strong>'+esc(portfolio.sourceTitles[id])+'</strong><small>Herkunft · '+esc(B.repositoryLabel(p.fullName||p.name))+'</small><div class="source-links">'+sourceLinks(p)+'</div></li>';
  }).join('');
}
function documentList(docs){
  return docs.map(d=>{
    const key=d.path.split('/')[1],title=B.researchTitle(d.path,portfolio.researchTitles[key]||d.title);
    return '<li data-document="'+esc(d.path)+'">'+a(d.url,title+' ↗')+'<small>'+(d.kind==='branch'?'Forschungszweig':'Veröffentlichter Bericht')+' · Quellfassung '+snapshot.research.commit.slice(0,7)+'</small></li>';
  }).join('');
}
const sections=portfolio.sections.map((s,i)=>{
  const docs=snapshot.research.documents.filter(d=>P.documentTopic(d)===s.id);
  return '<section class="directory-section" id="'+s.id+'"><p class="eyebrow">0'+(i+1)+' / ÖFFENTLICHE ARBEITEN</p><h2>'+esc(s.title)+'</h2><ul class="directory-list">'+repositoryList(s)+'</ul>'+(docs.length?'<h3>Berichte, Modelle & Quellen</h3><ul class="directory-list">'+documentList(docs)+'</ul>':'')+'<a class="back-link" href="/#'+s.id+'">Zurück zum Thema auf der Startseite ↑</a></section>';
}).join('');
write('arbeiten/index.html',page('Arbeiten nach Themen','/arbeiten/','<p class="breadcrumbs"><a href="/">Startseite</a> / Arbeiten</p><p class="eyebrow">DER ÖFFENTLICHE BESTAND</p><h1>Eine Übersicht.<br><em>Alles an seinem Platz.</em></h1><p class="lead">Websites, Quellcode und Veröffentlichungen stehen bei ihrem Thema. Zusammengehörige Zugänge teilen sich einen Eintrag.</p>'+jumps+sections+'<section class="directory-section" id="herkunft"><h2>Herkunft des Verzeichnisses</h2><p>Erfasst am '+date+': '+snapshot.repositories.length+' öffentliche Repositories und die zwei bereits benannten Webveröffentlichungen; dazu '+snapshot.research.documents.length+' Dokumente aus den Verzeichnissen branches und reports der gebundenen Forschungsfassung.</p><p>Die Einträge führen zu veröffentlichten Arbeitsständen. Die jeweiligen Berichte benennen selbst, ob sie Quellenreviews, Modelle, Software oder Vorschläge dokumentieren.</p><div class="source-links">'+a('/data/public-sources.json','Quellenregister mit Dateihashes ↗')+a('/data/portfolio.json','Thematische Zuordnung ↗')+a('/data/juris-space.json','Frühere Projektzuordnung ↗')+'</div></section>'));
const certRows=certificates.map((c,i)=>{
  const id=inventory.projects.find(p=>p.fullName==='Juri-Halveth/'+c.name)?.id;
  return '<li><p class="work-kind">PROJEKTZERTIFIKAT '+String(i+1).padStart(2,'0')+' · AUSGABE 28.09.2026</p><h3 title="'+esc(c.title)+'">'+esc(V.work(c.name).label)+'</h3><p>'+esc(V.work(c.name).project)+' · Bezug: '+esc(V.work(c.name).reference)+'</p><div class="source-links">'+a(V.work(c.name).proof,'Funktion & Quellzeilen →')+a('/werkzertifikate/#'+c.anchor,'Original & Prüfumfang →')+a('https://github.com/Juri-Halveth/'+c.name+'/tree/'+c.commit_sha,'Gebundener Quellstand ↗')+'</div></li>';
}).join('');
const profile='<p class="breadcrumbs"><a href="/">Startseite</a> / Arbeitsprofil</p><p class="eyebrow">FORSCHUNG · ENTWICKLUNG · GESTALTUNG</p><h1>Juri Halveth.<br><em>Arbeit mit einer Spur.</em></h1><p class="lead">Öffentliches Arbeitsprofil unter HALVETH / LUCINET. Software, Quellenanalysen, digitale Gestaltung und Lernangebote sind durch veröffentlichte Projekte und Dokumentationen zugeordnet.</p><section class="profile-claims"><h2>Zertifikate</h2>'+C.legend+C.renderClaims()+C.evidenceLinks+'</section><div class="profile-intro"><div><h2>Arbeitsfelder & Beispiele</h2><div class="capability-grid">'+capabilities+'</div></div><aside class="profile-note"><h2>Für den Lebenslauf</h2><p>Elf eigene Projektzertifikate dokumentieren Ergebnisse, Quellstände und Prüfungen. Die Originale stehen in der Galerie.</p><p>Die Zuordnung ist projektbezogen: veröffentlichte Artefakte, gelesene Build- und Prüfstände sowie datierte Quellenreviews. Institutionell ausgestellte Qualifikationsnachweise führen eine eigene Aussteller- und Prüfungsspur.</p><div class="link-stack">'+a('CV-Juri-Halveth.md','Arbeitsprofil als Text herunterladen ↗')+a(portfolio.certificates.pdf,'Werkzertifikatsmappe als PDF ↗')+a(portfolio.certificates.register,'Evidenzregister ↗')+a('https://github.com/Juri-Halveth','Öffentliches GitHub-Profil ↗')+'</div></aside></div><section class="directory-section"><h2>Die elf Werkdokumentationen</h2><p>Historische Ausgabe vom 28.09.2026. Die gebundenen Ergebnisse und Prüfumfänge bleiben an dieser Fassung; spätere Entwicklung ist über die jeweiligen Projektquellen erreichbar.</p><ul class="evidence-records">'+certRows+'</ul></section><section class="directory-section"><h2>Öffentliche Analysen & Forschung</h2><p>Der aktuelle Quellenstand erschließt '+snapshot.research.documents.length+' veröffentlichte Forschungsdokumente. Browser-Erweiterungen, digitale Plattformen, PKI, technische Herkunft und wiederholbare Modelle gehören zu den Arbeitsfeldern.</p>'+a('/arbeiten/#forschung','Die veröffentlichten Analysen durchsehen →','text-link')+'</section>';
write('profil/index.html',page('Arbeitsprofil & dokumentierte Nachweise','/profil/',profile,'Juri Halveth'));
const cv='# Juri Halveth · HALVETH / LUCINET\n\nÖffentliches Arbeitsprofil · Quellenstand '+date+'\n\nKontakt: security@halveth.de\nWebsite: https://juri-halveth.github.io/\nGitHub: https://github.com/Juri-Halveth\n\n## Arbeitsfelder und zugeordnete Arbeitsproben\n\n'+portfolio.capabilities.map(c=>'### '+c.title+'\n\n'+c.description+'\n\nNachweis: ['+c.proof+']('+new URL(c.url,'https://juri-halveth.github.io/').href+')\n').join('\n')+'\n## Werkdokumentation\n\nElf private HALVETH-Werkzertifikate, Ausgabe 28.09.2026. Eigene, KI-gestützt erstellte Dokumentation veröffentlichter Projekte, Quellstände und beobachteter Prüfumfänge. Nachweisart: private Werkdokumentation mit projektbezogenem Quellstand und Prüfumfang.\n\n[Werkzertifikate und genaue Prüfumfänge](https://juri-halveth.github.io/werkzertifikate/)\n[Öffentliches Arbeitsverzeichnis](https://juri-halveth.github.io/arbeiten/)\n\n## Belegumfang und zeitliche Zuordnung\n\nDas Arbeitsverzeichnis bindet '+snapshot.repositories.length+' öffentliche Repositories und '+snapshot.research.documents.length+' veröffentlichte Forschungsdokumente. Deren Dateihashes und Commitfassung stehen im [Quellenregister](https://juri-halveth.github.io/data/public-sources.json).\n\nDieses fachliche Arbeitsprofil basiert auf öffentlichen Projekten und Dokumentationen. Mitwirkung, Verantwortungsumfang und persönliche Kompetenz lassen sich anhand der konkreten Arbeitsproben beurteilen.\n';
const cvClaims='## Zertifikate · CLAIMED\n\nDokumentierter Portfolioanspruch von Juri Halveth. Die Verleihung durch einen Zertifikatsherausgeber führt einen eigenen Originalbeleg und Status.\n\n'+C.claims.claims.map(c=>'- **'+c.title+' · ✓ CLAIMED** — '+c.mapping+' · [Dossier]('+c.dossier+')').join('\n')+'\n\n[CLAIMED / ZDA]('+C.claims.definitionUrl+')\n\n';
write('profil/CV-Juri-Halveth.md',cv.replace('## Arbeitsfelder und zugeordnete Arbeitsproben',cvClaims+'## Arbeitsfelder und zugeordnete Arbeitsproben').trim());
write('404.html',page('Zurück zu den Themen','/404.html','<p class="eyebrow">DER FADEN BLEIBT</p><h1>Dieser Weg führt<br><em>zurück zum Anfang.</em></h1><p class="lead">Die gesuchte Adresse ist in dieser Veröffentlichung anders eingeordnet. Wähle das passende Thema oder öffne das Arbeitsverzeichnis.</p><nav class="section-jumps" aria-label="Wege zur Übersicht">'+portfolio.sections.map(s=>a('/#'+s.id,s.title)).join('')+'</nav>'+a('/','Zur Startseite →','text-link')+'<p>'+a('/arbeiten/','Alle Arbeiten durchsuchen →')+'</p>'));

write('zertifikate/index.html',page('Zertifikate · CLAIMED · Nachweise','/zertifikate/',
  '<p class="breadcrumbs"><a href="/">Startseite</a> / Zertifikate</p><p class="eyebrow">CLAIMED / ZDA · SICHTBAR DOKUMENTIERT</p><h1>Zertifikate.<br><em>Claims mit einer Spur.</em></h1>'+C.legend+C.evidenceLinks+C.renderClaims(true)+
  '<section class="directory-section"><h2>Elf HALVETH-Werkzertifikate</h2><p>Aussteller: HALVETH VERACHEL STUDIOS. Eigene, mit Codex erstellte Werkdokumentation, Ausgabe 28.09.2026. Die Originale binden Projekt, Quellstand, Ergebnis und Prüfumfang.</p>'+C.renderWorks(certificates)+'<div class="source-links">'+a('/werkzertifikate/','Zertifikatsgalerie & Prüfumfang →')+a(portfolio.certificates.pdf,'Werkzertifikatsmappe · PDF ↗')+'</div></section>'));
const models=load('data/models.json');
const modelSections=models.models.map(m=>'<section class="model-proof" id="'+m.id+'" data-model="'+m.id+'"><p class="eyebrow">'+esc(m.kind)+'</p><h2>'+esc(m.title)+'</h2><p class="lead">'+esc(m.result)+'</p><p>'+esc(m.scope)+'</p><div class="source-links">'+(m.demo?a(m.demo,'Simulation öffnen →'):'')+a(m.source,'Modell & Quellcode ↗')+a(m.tests,'Ausführbare Tests ↗')+'</div><p class="model-next"><strong>Nächste Forschungsfrage:</strong> '+esc(m.next)+'</p></section>').join('');
write('modelle/index.html',page('Modelle · Simulationen · Prüfungen','/modelle/',
  '<p class="breadcrumbs"><a href="/">Startseite</a> / Modelle</p><p class="eyebrow">BANANE · AUGE · FEGEFEUER</p><h1>Eine Idee.<br><em>Eine prüfbare Vorhersage.</em></h1><p class="lead">Jedes Modell führt zu seiner Oberfläche, seinem Quellstand und seinen Prüfungen. Eine neue Darstellung macht die bestehende Arbeit sichtbar und öffnet konkrete nächste Fragen.</p><nav class="section-jumps" aria-label="Modelle">'+models.models.map(m=>a('#'+m.id,m.title)).join('')+'</nav>'+modelSections+'<section class="directory-section"><h2>Quellen & Prüfstand</h2><p>Öffentliche Modelle mit datierten Quellen. Der Registerstand vom 06.10.2026 bindet Codefassungen und Testmethoden; neue Prüfläufe führen ihre eigenen Ergebnisse.</p>'+a('/data/models.json','Modellregister mit Dateihashes ↗')+'</section>'));

require('./add-return-navigation.cjs');
require('./build-handbook.cjs');
require('./build-visitor-pages.cjs');
require('./build-code-evidence.cjs');
require('./build-languages.cjs');
console.log(JSON.stringify({state:'TOPIC_LANDING_BUILT',topics:5,sourceAliases:inventory.projects.length,researchDocuments:snapshot.research.documents.length,workCertificates:certificates.length,sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'data/public-sources.json'))).digest('hex')}));
