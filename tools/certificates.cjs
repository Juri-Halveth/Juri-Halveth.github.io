'use strict';
const fs=require('node:fs'),path=require('node:path');
const P=require('./portfolio.cjs'),V=require('./visitor.cjs');
const claims=require('../data/claims.json');
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=(url,text)=>'<a href="'+esc(P.publicLink(url))+'"'+(url.startsWith('https:')?' target="_blank" rel="noopener"':'')+'>'+esc(text)+'</a>';
function validateClaims(data){
  if(data.schema!=='halveth.portfolio-claims.v1'||data.dataClass!=='PUBLIC'||data.claimDefinition!=='HALVETH_PORTFOLIO_BENCHMARK_CLAIM_V1')throw new Error('Unbound portfolio claim definition');
  if(data.issuerAwardStatus!=='ISSUER_AWARD_NOT_VERIFIED_IN_REVIEWED_MATERIAL')throw new Error('Issuer evidence requires a separate source and contract');
  if(!/^[a-f0-9]{40}$/.test(data.sourceCommit)||!/^[a-f0-9]{64}$/.test(data.sourceSha256)||data.claims.length!==9)throw new Error('Unbound claim source/count');
  const ids=new Set();
  for(const c of data.claims){
    if(ids.has(c.id)||!/^B0[1-9]$/.test(c.id)||c.status!=='CLAIMED'||c.filingStatus!=='ZDA'||c.issuerAwardStatus!==data.issuerAwardStatus)throw new Error('Claim axes changed');
    ids.add(c.id);
    for(const key of ['title','frameworkIssuer','mapping','supports','openEvidence'])if(typeof c[key]!=='string'||!c[key].trim())throw new Error('Missing claim field '+key);
    P.publicLink(c.dossier);
    if(!c.dossier.startsWith('https://github.com/Juri-Halveth/Juri-Halveth/blob/'+data.sourceCommit+'/portfolio/2026-09-28-v1.0.2/certificates/'))throw new Error('Dossier is not bound to the claim source');
  }
  for(const key of ['definitionUrl','matrixUrl','evidenceUrl','testingUrl'])P.publicLink(data[key]);
  return true;
}
validateClaims(claims);
const legend='<p class="claim-definition">Zertifikatsreferenzen · Portfolio-Claims</p>';
const evidenceLinks='<div class="source-links">'+link(claims.definitionUrl,'CLAIMED / ZDA · Definition ↗')+link(claims.matrixUrl,'Benchmark-Matrix ↗')+link(claims.evidenceUrl,'Projektbelege ↗')+link(claims.testingUrl,'Testbelege ↗')+'</div>';
function renderClaims(detailed=false){
  return '<div class="claim-grid">'+claims.claims.map(c=>'<article class="claim-card" data-claim="'+c.id+'"><span class="claim-badge" aria-label="CLAIMED: dokumentierter Portfolioanspruch"><span aria-hidden="true">✓</span> CLAIMED</span><h3 class="certificate-name" title="'+esc(c.title)+'">'+esc(V.claim(c.id).name)+'</h3><p class="claim-issuer">Referenz · '+esc(c.frameworkIssuer)+'</p><p class="claim-coverage">'+esc(c.mapping)+'</p>'+(detailed?'<p>'+esc(c.supports)+'</p><p class="claim-open"><strong>Offene Nachweise:</strong> '+esc(c.openEvidence)+'</p>':'')+'<div class="source-links">'+link(V.claim(c.id).proof,'Technik & Arbeitsproben →')+link(c.dossier,'Portfolio-Dossier ↗')+'</div>'+'</article>').join('')+'</div>';
}
function renderWorks(certs){
  return '<ul class="work-certificate-grid">'+certs.map(c=>'<li>'+link('/werkzertifikate/#'+c.anchor,V.work(c.name).label)+'<small>'+esc(V.work(c.name).project)+' · Bezug: '+esc(V.work(c.name).reference)+'</small></li>').join('')+'</ul>';
}
module.exports={claims,validateClaims,renderClaims,renderWorks,legend,evidenceLinks};
