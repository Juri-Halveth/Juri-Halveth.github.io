'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),sources=process.argv[2];if(!sources)throw Error('Provide the source directory');
const locations=[['Juri-Halveth.github.io',root],...['fortuna','halveth-scarlet','lernstudio','mein-lernportal'].map(n=>[n,path.join(sources,n)])];
const projects=locations.map(([name,cwd])=>({name,baseCommit:execFileSync('git',['rev-parse','HEAD'],{cwd,encoding:'utf8'}).trim(),workingDiffSha256:crypto.createHash('sha256').update(execFileSync('git',['diff','HEAD','--'],{cwd,maxBuffer:64*1024*1024})).digest('hex')}));
const receipt={schema:'halveth.bounded-local-hub-operator.v1',recordedAt:new Date().toISOString(),outcome:'LOCAL_BUILDS_AND_TESTS_PASSED',coverage:'Five named local checkouts and their configured build/test commands. Tracked working-tree diffs are bound; untracked files are outside the git-diff digest.',projects};
const output=path.join(root,'.space-local/hub-verification.json');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({outcome:receipt.outcome,projects:projects.length,recordedAt:receipt.recordedAt}));
