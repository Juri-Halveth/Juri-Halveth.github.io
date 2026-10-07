'use strict';
const crypto=require('node:crypto');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
function validate(data){
 if(data.schema!=='halveth.code-competence-evidence.v1'||data.dataClass!=='PUBLIC'||data.claimCeiling!=='EXACT_SOURCE_EXCERPTS_AND_SELECTED_TOPIC_COMPARISONS')throw new Error('Unbound evidence contract');
 if(data.proofs.length!==19||data.benchmarks.length!==9||data.projectCertificates.length!==11)throw new Error('Incomplete evidence aperture');
 const ids=new Set(),proofs=new Map();
 for(const p of data.proofs){
  if(ids.has(p.id)||!/^[FP][0-9]{2}$/.test(p.id)||!['CODE','DOCUMENT'].includes(p.kind)||p.evidenceState!=='OBSERVED_SOURCE_BYTES'||p.authorityEffect!=='NONE')throw new Error('Unbound proof identity or state');
  ids.add(p.id);proofs.set(p.id,p);
  const s=p.source;
  if(!/^Juri-Halveth\/[A-Za-z0-9_.-]+$/.test(s.repository)||!/^([a-f0-9]{40})$/.test(s.commit)||!/^([a-f0-9]{64})$/.test(s.fileSha256)||!/^[A-Za-z0-9_./-]+$/.test(s.path)||s.path.split('/').some(x=>!x||x==='..'))throw new Error('Unbound public source');
  if(!Number.isSafeInteger(s.startLine)||!Number.isSafeInteger(s.endLine)||s.startLine<1||s.endLine<s.startLine||!Number.isSafeInteger(s.startByte)||!Number.isSafeInteger(s.endByte)||s.startByte<0||s.endByte<=s.startByte)throw new Error('Invalid source span');
  if(typeof s.excerpt!=='string'||!s.excerpt.endsWith('\n')||s.excerpt.split('\n').length-1!==s.endLine-s.startLine+1||Buffer.byteLength(s.excerpt)!==s.endByte-s.startByte||hash(Buffer.from(s.excerpt))!==s.excerptSha256)throw new Error('Source excerpt binding changed');
  if(s.url!==`https://github.com/${s.repository}/blob/${s.commit}/${s.path}#L${s.startLine}-L${s.endLine}`)throw new Error('Missing exact source permalink');
  if(p.testUrl!==null&&!p.testUrl.startsWith(`https://github.com/${s.repository}/blob/${s.commit}/`))throw new Error('Test has another source version');
  if(p.testExecution!== (p.kind==='DOCUMENT'?'NO_RUNTIME_TEST_CLAIM':'SOURCE_LINKED_NOT_EXECUTED_IN_THIS_RUN'))throw new Error('Test execution needs a separate run receipt');
 }
 const benchmarks=new Set();
 for(const b of data.benchmarks){
  if(!/^B0[1-9]$/.test(b.id)||benchmarks.has(b.id)||!proofs.has(b.primaryProof)||b.relatedProofs.some(id=>!proofs.has(id))||b.mappingEvidenceState!=='INFERRED_TOPIC_COMPARISON'||b.fullCertificationCoverage!=='NOT_ESTABLISHED'||b.issuerAwardStatus!=='NOT_VERIFIED'||b.authorityEffect!=='NONE')throw new Error('Topic comparison imported an unsupported qualification or authority');
  benchmarks.add(b.id);
  if(new URL(b.frameworkSource).protocol!=='https:'||!b.scope||!b.frameworkVersion)throw new Error('Unbound framework source');
 }
 const repos=new Set();
 for(const c of data.projectCertificates){
  if(repos.has(c.repository)||!proofs.has(c.proof)||proofs.get(c.proof).source.repository!=='Juri-Halveth/'+c.repository)throw new Error('Project source mismatched');
  repos.add(c.repository);
 }
 return true;
}
module.exports={validate,hash};
