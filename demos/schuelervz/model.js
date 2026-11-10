(function(root){
  'use strict';
  const people=[
    {id:'mira',name:'Mira Wolken',initials:'MW',tags:['Musik','Fotografie'],bio:'Sammelt Wolkenfotos und findet für jeden Regentag den richtigen Song.'},
    {id:'leo',name:'Leo Funken',initials:'LF',tags:['Technik','Sterne'],bio:'Baut kleine Dinge, stellt große Fragen und schaut gern in den Nachthimmel.'},
    {id:'nora',name:'Nora Seitenwind',initials:'NS',tags:['Bücher','Zeichnen'],bio:'Hat immer ein Skizzenbuch dabei. Auf der letzten Seite beginnt schon die nächste Geschichte.'},
    {id:'finn',name:'Finn Takt',initials:'FT',tags:['Musik','Schlagzeug'],bio:'Trommelt auf allem, was eine Tischkante hat. Die Nachbarn sind hier zum Glück erfunden.'},
    {id:'ava',name:'Ava Grünblatt',initials:'AG',tags:['Garten','Natur'],bio:'Findet kleine Abenteuer im Grünen und gibt jeder Zimmerpflanze einen Namen.'},
    {id:'sam',name:'Sam Pixel',initials:'SP',tags:['Spiele','Technik'],bio:'Baut lieber eigene kleine Spielwelten, als sich über ein schwieriges Level zu ärgern.'}
  ];
  const groups=[
    {id:'musik',name:'Noch einen Song, bitte.',icon:'♫',tags:['Musik','Playlists'],description:'Der erfundene Treffpunkt für Lieblingslieder und Ohrwürmer.'},
    {id:'sterne',name:'Blick nach oben',icon:'✳',tags:['Sterne','Technik','Natur'],description:'Eine Beispielgruppe für neugierige Fragen über den Nachthimmel.'},
    {id:'buecher',name:'Nur noch ein Kapitel',icon:'▤',tags:['Bücher','Zeichnen'],description:'Geschichten teilen – in dieser Demo ganz ohne echte Mitglieder.'}
  ];
  function fresh(){return {version:1,posts:[],joined:[]};}
  function load(raw){
    if(raw===null||raw===undefined)return {state:fresh(),warning:null};
    try{
      const s=JSON.parse(raw);
      if(!s||s.version!==1||!Array.isArray(s.posts)||!Array.isArray(s.joined)||s.posts.length>30||s.joined.length>groups.length)throw Error('shape');
      if(s.posts.some(x=>!x||typeof x.text!=='string'||!x.text.trim()||x.text.length>240||typeof x.id!=='string'||!/^[a-z0-9-]{1,80}$/.test(x.id)))throw Error('post');
      if(s.joined.some(x=>!groups.some(g=>g.id===x))||new Set(s.joined).size!==s.joined.length)throw Error('group');
      return {state:{version:1,posts:s.posts.map(x=>({id:x.id,text:x.text})),joined:s.joined.slice()},warning:null};
    }catch{return {state:fresh(),warning:'Der gespeicherte Demo-Zustand war nicht lesbar. Die Beispielansicht wurde wiederhergestellt.'};}
  }
  function addPost(state,text,id){
    if(typeof text!=='string'||!text.trim())throw Error('Bitte zuerst einen Text eingeben.');
    if(text.length>240)throw Error('Der Text darf höchstens 240 Zeichen enthalten.');
    if(state.posts.length>=30)throw Error('Die lokale Demo-Pinnwand ist voll (30 eigene Beiträge). Bitte die Demo zurücksetzen.');
    if(typeof id!=='string'||!/^[a-z0-9-]{1,80}$/.test(id))throw Error('Die Beitragskennung ist ungültig.');
    return {version:1,posts:[{id,text:text.trim()},...state.posts],joined:state.joined.slice()};
  }
  function toggleGroup(state,id){
    if(!groups.some(g=>g.id===id))throw Error('Diese Beispielgruppe gibt es nicht.');
    return {version:1,posts:state.posts.slice(),joined:state.joined.includes(id)?state.joined.filter(x=>x!==id):[...state.joined,id]};
  }
  function search(query,filter){
    const terms=String(query).toLocaleLowerCase('de').trim().split(/\s+/).filter(Boolean);
    const rows=[...people.map(x=>({...x,kind:'people'})),...groups.map(x=>({...x,kind:'groups'}))];
    return rows.filter(x=>(filter==='all'||x.kind===filter)&&terms.every(t=>[x.name,...x.tags,x.bio||x.description].join(' ').toLocaleLowerCase('de').includes(t)));
  }
  const api={people,groups,fresh,load,addPost,toggleGroup,search};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SchulnetzModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
