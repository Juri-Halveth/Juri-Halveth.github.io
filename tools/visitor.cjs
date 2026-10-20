'use strict';
const proof='/audits/';
const claims={
 B01:{name:'ISTQB CTAL-TA',proof:'/modelle/'},B02:{name:'Microsoft Cybersecurity Architect',proof},
 B03:{name:'Microsoft DevOps Engineer',proof:'https://github.com/Juri-Halveth/open-research-branches/actions'},B04:{name:'CISSP',proof},
 B05:{name:'AWS Solutions Architect Professional',proof:'/modelle/'},B06:{name:'ISTQB CTEL-ITP',proof},
 B07:{name:'OffSec OSCE³',proof},B08:{name:'Cisco CCIE Enterprise',proof},B09:{name:'Google Cloud Architect',proof:'/modelle/'}
};
const works={
 'halveth-morrowind-genesis':['Softwareintegration','Morrowind Genesis','Integration und Prüfungen'],
 'halveth-realms':['Spielentwicklung','Scarlet Garden','Integration und Prüfungen'],
 'halveth-scarlet':['Webentwicklung','Scarlet','Quellcode und Dokumentation'],
 'halveth-tresor':['Desktopsoftware','Tresor','Build und Veröffentlichung'],
 'halveth-unreal':['C++ & Unreal','Portal Garden','Quellcode und Dokumentation'],
 'halveth-xai-40m-proposal':['Forschungsplanung','Kooperationskonzept','Dokumentation'],
 'Juri-Halveth.github.io':['Webportal','Portfolio','Integration und Prüfungen'],
 'juri-janovski-these-zur-geburt':['Forschungsdokumentation','Geburtsumgebung','Dokumentation'],
 'lernstudio':['Lernplattform','Lernstudio','Integration und Prüfungen'],
 'mein-lernportal':['Freies Lernportal','702 Lektionen','Quellcode und Dokumentation'],
 'open-research-branches':['Forschung & Modelle','Open Research','Modelle und Gegenproben']
};
for(const id of Object.keys(claims))claims[id].proof='/koennen/#'+id.toLowerCase();
const evidence=require('../data/competence-evidence.json');
function claim(id){if(!claims[id])throw new Error('Unbound visitor claim ID');return claims[id];}
function work(name){if(!works[name])throw new Error('Unbound visitor project certificate');const [label,project,reference]=works[name];const bound=evidence.projectCertificates.find(c=>c.repository===name);if(!bound)throw new Error('Missing project code evidence');return {label,project,reference,proof:'/koennen/#'+bound.proof};}
module.exports={claim,work,claims,works,definition:'SHORT_VISITOR_LABELS_OVER_PRESERVED_SOURCE_RECORDS_V1'};
