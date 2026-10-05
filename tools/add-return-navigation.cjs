'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const entrances=['werkzertifikate/index.html','motion/index.html','schuelervz-halveth/index.html','schuelervz-halveth/people.html','schuelervz-halveth/archaeology.html','schuelervz-halveth/prestige.html'];
const bar='<!-- PORTFOLIO_RETURN_START --><nav class="return-bar" aria-label="Zurück zur Übersicht"><a href="/">← Startseite / Themenübersicht</a><a href="/arbeiten/">Alle Arbeiten</a><a href="/profil/">Arbeitsprofil & Nachweise</a></nav><!-- PORTFOLIO_RETURN_END -->';
for(const file of entrances){
  const target=path.join(root,file);
  let html=fs.readFileSync(target,'utf8');
  html=html.replace(/<!-- PORTFOLIO_RETURN_START -->[\s\S]*?<!-- PORTFOLIO_RETURN_END -->/g,'');
  if(!html.includes('href="/return.css"'))html=html.replace('</head>','<link rel="stylesheet" href="/return.css"></head>');
  html=html.replace(/<body[^>]*>/,match=>match+bar);
  if(file==='motion/index.html')html=html.replace('<main class="wrap hero">','<main class="wrap subpage motion-page">').replace('../?project=MORROWIND#focus','../#gestaltung').replace('Projektatlas</a>','Bereich Grafik & Spiele</a>');
  fs.writeFileSync(target,html);
}
