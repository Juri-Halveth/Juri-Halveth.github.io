'use strict';
const data=require('../data/visitor-corridor.json');
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function words(lang){if(!Object.hasOwn(data.copy,lang))throw Error('Unsupported corridor language');return data.copy[lang];}
function guideLink(lang){const t=words(lang);return '<a class="text-link" href="'+(lang==='de'?'/':'/'+lang+'/')+'arbeiten/#beispiel-scarlet">'+esc(t.jump)+' ↓</a>';}
function renderVisitorCorridor(lang){
 const t=words(lang);
 const entry=new URL(data.entry);entry.searchParams.set('lang',lang);
 const source='https://github.com/Juri-Halveth/'+data.project+'/tree/'+data.sourceRevision;
 const list=items=>'<ol>'+items.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol>';
 return '<details class="visitor-corridor" id="beispiel-scarlet" data-visitor-corridor><summary>'+esc(t.summary)+'</summary>'+
 '<h4>'+esc(t.title)+'</h4><p>'+esc(t.conditions)+'</p>'+
 '<section data-depth="experience"><h5>1 · '+esc(t.experience)+'</h5><a class="button" href="'+esc(entry.href)+'">'+esc(t.open)+' ↗</a>'+list(t.steps)+'</section>'+
 '<section data-depth="understand"><h5>2 · '+esc(t.understand)+'</h5><p>'+esc(t.explanation)+'</p></section>'+
 '<section data-depth="verify"><h5>3 · '+esc(t.check)+'</h5>'+list(t.checks)+'<p>'+esc(t.failure)+'</p><p class="source-caption">'+esc(t.boundary)+'</p></section>'+
 '<section data-depth="build"><h5>4 · '+esc(t.build)+'</h5><div class="service-card-actions"><a href="'+source+'">'+esc(t.source)+' ↗</a><a href="'+source+'/tests">'+esc(t.tests)+' ↗</a><a href="https://github.com/Juri-Halveth/halveth-scarlet/issues/new">'+esc(t.feedback)+' ↗</a></div><p>'+esc(t.contribute)+'</p></section>'+
 '<a href="#repositories">'+esc(t.return)+' ↑</a></details>';
}
module.exports={guideLink,renderVisitorCorridor};

