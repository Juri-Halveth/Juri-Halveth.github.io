'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),catalog=require('../data/languages.json');
const pages=['index.html','arbeiten/index.html','profil/index.html','404.html','motion/index.html','werkzertifikate/index.html','schuelervz-halveth/index.html','schuelervz-halveth/people.html','schuelervz-halveth/archaeology.html','schuelervz-halveth/prestige.html'];
const routes=new Set(pages.map(file=>'/'+file.replace(/index\.html$/,'')));
routes.add('/handbuch/');
const decode=s=>s.replace(/&(?:amp|lt|gt|quot|#39|#x([0-9a-f]+)|#([0-9]+));/gi,(m,x,n)=>x?String.fromCodePoint(parseInt(x,16)):n?String.fromCodePoint(Number(n)):({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"}[m]||m));
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function text(value,language){
 const plain=decode(value),key=plain.trim();if(!key||language==='de')return value;
 const translated=catalog.strings[key]?.[language];return translated?escape(plain.replace(key,translated)):value;
}
function url(value,source,language){
 if(value.startsWith('#'))return value;
 const parsed=new URL(decode(value),'https://juri-halveth.github.io/'+source);
 if(parsed.hostname!=='juri-halveth.github.io')return value;
 if(routes.has(parsed.pathname)||parsed.pathname==='/profil/CV-Juri-Halveth.md')parsed.pathname='/'+(language==='de'?'':language+'/')+parsed.pathname.slice(1);
 else if(/^\/(?:fortuna|lernstudio|mein-lernportal|halveth-scarlet)\//.test(parsed.pathname)&&/\/$|\.html$/.test(parsed.pathname))parsed.searchParams.set('lang',language);
 return escape(parsed.pathname+parsed.search+parsed.hash);
}
function translate(html,source,language){
 let excluded=null;
 const output=html.replace(/<[^>]*>|[^<]+/g,part=>{
  if(part.startsWith('<')){
   const tag=part.match(/^<\/?([a-z]+)/i)?.[1]?.toLowerCase();
   if(part.startsWith('</')){if(tag===excluded)excluded=null;return part;}
   if(['script','style','code','pre','textarea'].includes(tag)){
    if(!excluded)excluded=tag;
    return part.replace(/\bsrc="([^"]*)"/g,(_,value)=>'src="'+url(value,source,language)+'"');
   }
   if(tag==='html')part=part.replace(/lang="[^"]*"/,'lang="'+language+'"');
   return part.replace(/\b(href|src|alt|title|aria-label|placeholder|aria-valuetext|content)="([^"]*)"/g,(match,attr,value)=>{
    if(attr==='href'||attr==='src')return attr+'="'+url(value,source,language)+'"';
    if(attr==='content'&&!/^<meta\b/.test(part)||attr==='content'&&!/name="description"|property="og:(?:title|description)"/.test(part))return match;
    return attr+'="'+text(value,language)+'"';
   });
  }
  return excluded?part:text(part,language);
 });
 return output;
}
function selector(source,language){
 const route='/'+source.replace(/index\.html$/,'');
 return '<!-- HUB_LANGUAGE_START --><nav class="language-links shell" aria-label="'+({de:'Sprache',en:'Language',ru:'Язык'}[language])+'">'+[['de','Deutsch'],['en','English'],['ru','Русский']].map(([lang,label])=>'<a data-language-link href="'+(lang==='de'?'':'/'+lang)+route+'" lang="'+lang+'" hreflang="'+lang+'"'+(lang===language?' aria-current="page"':'')+'>'+label+'</a>').join('')+'</nav><!-- HUB_LANGUAGE_END -->';
}
function decorate(html,source,language){
 html=html.replace(/<!-- HUB_LANGUAGE_START -->[\s\S]*?<!-- HUB_LANGUAGE_END -->/g,'').replace(/<!-- HUB_ALTERNATES_START -->[\s\S]*?<!-- HUB_ALTERNATES_END -->/g,'');
 const route='/'+source.replace(/index\.html$/,'');
 const canonical='https://juri-halveth.github.io'+(language==='de'?'':'/'+language)+route;
 html=html.replace(/<link rel="canonical"[^>]*>/g,'');
 const alternate='<!-- HUB_ALTERNATES_START --><link rel="canonical" href="'+canonical+'">'+['de','en','ru'].map(lang=>'<link rel="alternate" hreflang="'+lang+'" href="https://juri-halveth.github.io'+(lang==='de'?'':'/'+lang)+route+'">').join('')+'<link rel="alternate" hreflang="x-default" href="https://juri-halveth.github.io'+route+'"><!-- HUB_ALTERNATES_END -->';
 html=html.replace('</head>',alternate+'</head>').replace(/<body[^>]*>/,m=>m+selector(source,language));
 html=html.replace(/<html\b([^>]*)>/,(_,attrs)=>'<html'+attrs.replace(/ data-language-static="[^"]*"/g,'')+' data-language-static="'+language+'">');
 if(!html.includes('href="/language.css"'))html=html.replace('</head>','<link rel="stylesheet" href="/language.css"></head>');
 if(source.startsWith('schuelervz-halveth/')){
  html=html.replace(/<!-- HUB_RUNTIME_START -->[\s\S]*?<!-- HUB_RUNTIME_END -->/g,'');
  html=html.replace('</head>','<!-- HUB_RUNTIME_START --><script src="/assets/hub-catalog.js" defer></script><script src="/assets/hub-language.js" defer></script><link rel="stylesheet" href="/assets/hub-language.css"><!-- HUB_RUNTIME_END --></head>');
 }
 return html;
}
const cv=fs.readFileSync(path.join(root,'profil/CV-Juri-Halveth.md'),'utf8').replace(/\r\n/g,'\n');
for(const language of ['en','ru']){
 const localized=cv.split('\n').map(line=>{
  if(/https?:\/\//.test(line)&&!line.includes(']('))return line;
  return line.split(/(`+[^`]+`+|\]\([^)]*\)|https?:\/\/\S+|^\s*(?:#{1,6}\s+|>\s*|[-*+]\s+|\d+[.)]\s+)|[|*\[\]])/).map(part=>{
   if(part.startsWith('`')||part.startsWith('](')||part.startsWith('http'))return part;
   const key=part.trim(),value=catalog.strings[key]?.[language];return value?part.replace(key,value):part;
  }).join('');
 }).join('\n');
 fs.mkdirSync(path.join(root,language,'profil'),{recursive:true});
 fs.writeFileSync(path.join(root,language,'profil/CV-Juri-Halveth.md'),localized);
}
for(const source of pages){
 const file=path.join(root,source);let original=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
 original=original.replace(/<!-- HUB_LANGUAGE_START -->[\s\S]*?<!-- HUB_LANGUAGE_END -->/g,'').replace(/<!-- HUB_ALTERNATES_START -->[\s\S]*?<!-- HUB_ALTERNATES_END -->/g,'');
 original=original.replace(/<link rel="canonical"[^>]*>/g,'');
 fs.writeFileSync(file,decorate(original,source,'de'));
 for(const language of ['en','ru']){
  const destination=path.join(root,language,source);fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.writeFileSync(destination,decorate(translate(original,source,language),source,language));
 }
}
const urls=[];
for(const language of ['de','en','ru'])for(const source of pages.filter(p=>p!=='404.html'))urls.push('https://juri-halveth.github.io/'+(language==='de'?'':language+'/')+source.replace(/index\.html$/,''));
for(const language of ['de','en','ru'])urls.push('https://juri-halveth.github.io/'+(language==='de'?'':language+'/')+'handbuch/');
fs.writeFileSync(path.join(root,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(u=>'  <url><loc>'+u+'</loc></url>').join('\n')+'\n</urlset>\n');
console.log(JSON.stringify({state:'LANGUAGE_PAGES_BUILT',languages:3,pages:pages.length*3,catalogStrings:Object.keys(catalog.strings).length}));
module.exports={translate,text,url,pages};
