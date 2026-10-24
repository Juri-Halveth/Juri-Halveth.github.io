'use strict';
const LANGUAGES=['de','en','ru'];
function publicUrl(value){
 if(typeof value!=='string'||value.length>2048||/[\s"'<>\\()[\]]/.test(value)||/%(?:2f|5c|00)/i.test(value))throw Error('Invalid public URL');
 const url=new URL(value);
 if(url.protocol!=='https:'||url.username||url.password||url.port||url.search||url.hash||url.href!==value)throw Error('Noncanonical public URL');
 if(!((url.hostname==='github.com'&&url.pathname.startsWith('/Juri-Halveth/'))||url.hostname==='juri-halveth.github.io'))throw Error('Unapproved public host');
 return url;
}
function githubRepository(value){return typeof value==='string'&&/^Juri-Halveth\/[A-Za-z0-9_.-]+$/.test(value)&&!['.','..'].includes(value.split('/')[1]);}
function supplementalUrl(value,kind){
 if(typeof value!=='string')return false;
 const match=/^https:\/\/github\.com\/(Juri-Halveth\/[A-Za-z0-9_.-]+)\/(releases\/tag|commit)\/([A-Za-z0-9_.+/-]+)$/.exec(value);
 return !!match&&githubRepository(match[1])&&match[2]===(kind==='release'?'releases/tag':'commit')&&match[3].split('/').every(part=>part&&!['.','..'].includes(part));
}
function timestamp(value){
 if(typeof value!=='string')return false;
 const m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
 if(!m)return false;
 const [y,month,day,hour,minute,second]=m.slice(1,7).map(Number),days=[31,y%4===0&&(y%100!==0||y%400===0)?29:28,31,30,31,30,31,31,30,31,30,31];
 return month>=1&&month<=12&&day>=1&&day<=days[month-1]&&hour<24&&minute<60&&second<60&&Number.isFinite(Date.parse(value));
}
function sourcePath(value){return typeof value==='string'&&value.length>0&&value.length<=1024&&!/[\u0000-\u001f\u007f\\:?#]/.test(value)&&value.split('/').every(part=>part&&!['.','..'].includes(part));}
function encodeSourcePath(value){
 if(!sourcePath(value))throw Error('Repository-relative source path required');
 return value.split('/').map(part=>encodeURIComponent(part).replace(/[!'()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase())).join('/');
}
function validateRepositorySnapshot(data){
 if(data?.schema!=='halveth.public-repositories.v1'||!timestamp(data.observedAt)||!Array.isArray(data.repositories)||!data.repositories.length)throw Error('Invalid public repository snapshot');
 const names=new Set();
 for(const p of data.repositories){
  if(typeof p.name!=='string'||!githubRepository('Juri-Halveth/'+p.name)||names.has(p.name.toLowerCase())||p.url!=='https://github.com/Juri-Halveth/'+p.name||typeof p.revision!=='string'||!/^[a-f0-9]{40}$/.test(p.revision)||p.source!==p.url+'/tree/'+p.revision||!timestamp(p.revisionObservedAt))throw Error('Invalid public repository entry');
  publicUrl(p.url);publicUrl(p.source);names.add(p.name.toLowerCase());
  for(const lang of LANGUAGES)if(typeof p.purpose?.[lang]!=='string'||!p.purpose[lang].trim())throw Error('Complete repository purpose required');
 }
 return data;
}
function validateProjects(data){
 if(data?.schema!=='halveth.technical-portfolio.v2'||!Array.isArray(data.projects)||!data.projects.length)throw Error('Invalid project catalog');
 const ids=new Set();
 for(const p of data.projects){
  if(typeof p.id!=='string'||!/^[a-z][a-z0-9-]*$/.test(p.id)||ids.has(p.id))throw Error('Invalid project identity');ids.add(p.id);
  if(!['research','learning','software','games'].includes(p.category)||!['LOCAL_MODEL_TESTS','SOURCE_REVIEW_ONLY'].includes(p.verification))throw Error('Invalid project state');
  if(typeof p.repository!=='string'||!p.repository.startsWith('https://github.com/')||!githubRepository(p.repository.slice('https://github.com/'.length)))throw Error('Exact repository URL required');
  publicUrl(p.repository);publicUrl(p.source);
  if(typeof p.revision!=='string'||!/^[a-f0-9]{40}$/.test(p.revision))throw Error('Pinned project revision required');
  if(p.verification==='LOCAL_MODEL_TESTS'&&(p.verificationRecord?.revision!==p.revision||!timestamp(p.verificationRecord?.observedAt)||p.verificationRecord?.command!==p.command))throw Error('Local checks must bind the displayed revision');
  if(!(p.source===p.repository+'/tree/'+p.revision||p.source.startsWith(p.repository+'/blob/'+p.revision+'/')))throw Error('Source must match repository and revision');
  if(p.demo!==null)publicUrl(p.demo);
  if(p.image!==undefined&&(typeof p.image!=='string'||!/^\/assets\/[A-Za-z0-9_-]+\.(png|jpg|webp)$/.test(p.image)))throw Error('Invalid project image');
  for(const field of ['title','description','stage',...(p.image?['imageAlt']:[]),...(p.actionLabel?['actionLabel']:[])])for(const lang of LANGUAGES)if(typeof p[field]?.[lang]!=='string'||!p[field][lang].trim())throw Error('Complete project translation required');
 }
 return data;
}
module.exports={publicUrl,validateProjects,githubRepository,supplementalUrl,timestamp,sourcePath,encodeSourcePath,validateRepositorySnapshot};
