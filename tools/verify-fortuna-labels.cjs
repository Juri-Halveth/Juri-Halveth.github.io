'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const source=process.argv[2];if(!source)throw Error('Provide the Fortuna repository path');
async function main(){for(const language of ['de','en','ru']){
 const dom=new JSDOM('<!doctype html><html><body><header>69 Figuren</header><p id="events">69 aktiv · 0 untersucht · 0 unterwegs</p></body></html>',{url:'https://juri-halveth.github.io/fortuna/?lang='+language,runScripts:'outside-only'});
 const w=dom.window;
 w.eval(fs.readFileSync(path.join(source,'docs/languages/catalog.js'),'utf8'));
 w.eval(fs.readFileSync(path.join(source,'docs/languages/hub-language.js'),'utf8'));
 await new Promise(resolve=>setTimeout(resolve,10));
 assert.deepEqual(w.document.getElementById('events').textContent.match(/\d+/g),['69','0','0']);
 if(language!=='de')assert(!/Figuren|aktiv|untersucht|unterwegs/.test(w.document.body.textContent));
 w.dispatchEvent(new w.Event('pagehide'));dom.window.close();
 console.log('PASS FORTUNA '+language+' count and status localization');
}}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
