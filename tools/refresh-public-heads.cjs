'use strict';
// Manual maintainer command: refresh public HEADs, never fabricate new test runs.
const fs=require('node:fs'),path=require('node:path');
const {validateProjects,validateRepositorySnapshot}=require('./validate-projects.cjs');
const {validatePortfolioSelection}=require('./validate-portfolio-selection.cjs');
const root=path.resolve(__dirname,'..');
function refresh(catalog,snapshot,metadata,now){
 validateProjects(catalog);validateRepositorySnapshot(snapshot);
 const projects=structuredClone(catalog),repos=structuredClone(snapshot);
 for(const p of projects.projects){
  if(p.id==='halveth-tron-security-lab')continue; // Deliberate unmerged PR sample.
  const m=metadata[p.id];if(!m||m.visibility!=='public'||m.private!==false||!/^[a-f0-9]{40}$/.test(m.sha))throw Error('Missing public project HEAD: '+p.id);
  if(p.revision!==m.sha){p.revision=m.sha;p.source=p.repository+'/tree/'+m.sha;p.verification='HEAD_METADATA_ONLY';delete p.verificationRecord;}
 }
 for(const p of repos.repositories){
  const m=metadata[p.name];if(!m||m.visibility!=='public'||m.private!==false||!/^[a-f0-9]{40}$/.test(m.sha))throw Error('Missing public repository HEAD: '+p.name);
  p.revision=m.sha;p.revisionObservedAt=now;p.source=p.url+'/tree/'+m.sha;
 }
 projects.sourceDate=now.slice(0,10);repos.observedAt=now;
 validateProjects(projects);validateRepositorySnapshot(repos);validatePortfolioSelection([projects,repos]);
 return {projects,repos};
}
async function main(){
 const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/projects.json'),'utf8'));
 const snapshot=JSON.parse(fs.readFileSync(path.join(root,'data/public-repositories.json'),'utf8'));
 const metadata={};
 const names=[...new Set([...catalog.projects.map(p=>p.id),...snapshot.repositories.map(p=>p.name)])];
 const headers={'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'halveth-portfolio-head-refresh'};
 if(process.env.GH_TOKEN)headers.Authorization='Bearer '+process.env.GH_TOKEN;
 for(const name of names){
  if(!/^[A-Za-z0-9_.-]+$/.test(name))throw Error('Invalid repository name');
  const response=await fetch('https://api.github.com/repos/Juri-Halveth/'+name,{headers,signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('Repository metadata request failed: '+name+' '+response.status);
  const repo=await response.json();
  if(repo.private!==false||repo.visibility!=='public'||repo.full_name.toLowerCase()!==('Juri-Halveth/'+name).toLowerCase())throw Error('Public identity mismatch: '+name);
  const ref=await fetch('https://api.github.com/repos/Juri-Halveth/'+name+'/git/ref/heads/'+encodeURIComponent(repo.default_branch),{headers,signal:AbortSignal.timeout(15000)});
  if(!ref.ok)throw Error('Default HEAD request failed: '+name+' '+ref.status);
  const record=await ref.json();metadata[name]={private:false,visibility:'public',sha:record.object.sha};
 }
 const result=refresh(catalog,snapshot,metadata,new Date().toISOString());
 // Validate every response before changing either source file.
 for(const [name,value] of [['projects',result.projects],['public-repositories',result.repos]])fs.writeFileSync(path.join(root,'data/'+name+'.json'),JSON.stringify(value,null,2)+'\n');
 console.log('Public source heads refreshed. Prior test receipts remain revision-bound; run npm run build and npm test before review.');
}
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={refresh};
