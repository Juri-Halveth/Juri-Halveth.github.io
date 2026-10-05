'use strict';
const SECTION_IDS=['forschung','gestaltung','lernen','software','nachweise'];
const HOSTS=new Set(['github.com','juri-halveth.github.io','halveth-scarlet-question.juri-janovski.chatgpt.site','lernstudio-wissen-fuer-alle.juri-janovski.chatgpt.site']);
function publicLink(value){
  const url=new URL(value,'https://juri-halveth.github.io/');
  if(url.protocol!=='https:'||url.username||url.password||!HOSTS.has(url.hostname))throw new Error('Unbound public URL');
  return value;
}
function validate(portfolio,inventory,snapshot,certificates){
  if(portfolio.schema!=='halveth.topic-portfolio.v2'||portfolio.dataClass!=='PUBLIC')throw new Error('Invalid public portfolio');
  if(JSON.stringify(portfolio.sections.map(s=>s.id))!==JSON.stringify(SECTION_IDS))throw new Error('Topic priority changed');
  const ids=portfolio.sections.flatMap(s=>s.sourceIds);
  if(ids.length!==inventory.projects.length||new Set(ids).size!==ids.length)throw new Error('Duplicate or missing source placement');
  for(const p of inventory.projects)if(!ids.includes(p.id)||!portfolio.sourceTitles[p.id])throw new Error('Source missing from portfolio');
  for(const c of portfolio.capabilities){
    for(const k of ['title','description','proof','url'])if(typeof c[k]!=='string'||!c[k].trim())throw new Error('Unbound capability');
    publicLink(c.url);
  }
  if(portfolio.certificates.kind!=='PRIVATE_WORK_DOCUMENTATION'||certificates.length!==portfolio.certificates.count||certificates.some(c=>c.kind!=='PRIVATE_WORK_DOCUMENTATION'))throw new Error('Certificate type or count mismatch');
  if(snapshot.dataClass!=='PUBLIC'||snapshot.research.treeTruncated!==false||!/^[a-f0-9]{40}$/.test(snapshot.research.commit))throw new Error('Unbound research snapshot');
  const paths=new Set();
  for(const d of snapshot.research.documents){
    if(paths.has(d.path)||!/^branches\/[^/]+\/README\.md$|^reports\/[^/]+\.md$/.test(d.path)||!/^[a-f0-9]{64}$/.test(d.contentSha256))throw new Error('Invalid or duplicate research source');
    paths.add(d.path);publicLink(d.url);
    if(!d.url.includes('/'+snapshot.research.commit+'/'))throw new Error('Research URL must bind source commit');
  }
  return true;
}
function documentTopic(doc){
  if(/^branches\/(focus-kernel|binary-inquiry-loop|document-issue-reference-verifier|bounded-knowledge-reuse-inventory|pixel-region-change-observer)\//.test(doc.path))return 'software';
  if(/FREE_NEWS_009_GITHUB_CONTRIBUTION_GRAPH/.test(doc.path))return 'nachweise';
  return 'forschung';
}
module.exports={SECTION_IDS,publicLink,validate,documentTopic};
