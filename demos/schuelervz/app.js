(function(){
  'use strict';
  const M=window.SchulnetzModel,key='halveth-schulnetz-demo-v1';
  const $=id=>document.getElementById(id);
  let state=M.fresh(),filter='all',feedbackTimer,storageAvailable=true;
  function say(text){clearTimeout(feedbackTimer);$('feedback').textContent=text;feedbackTimer=setTimeout(()=>$('feedback').textContent='',9000);}
  try{const loaded=M.load(localStorage.getItem(key));state=loaded.state;if(loaded.warning)say(loaded.warning);}catch{storageAvailable=false;say('Der Browser erlaubt hier keine lokale Speicherung. Die Demo funktioniert für diesen geöffneten Besuch.');}
  function save(success){try{localStorage.setItem(key,JSON.stringify(state));storageAvailable=true;say(success+' Lokal in diesem Browser gespeichert.');}catch{storageAvailable=false;say(success+' Speicherung ist gesperrt; die Änderung bleibt nur während dieses Besuchs erhalten.');}}
  function el(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;}
  function profile(p){
    const card=el('article','person'),top=el('div','person-top'),avatar=el('span','avatar',p.initials),info=el('div');avatar.setAttribute('aria-hidden','true');info.append(el('h3','',p.name),el('small','','Erfundenes Profil'));top.append(avatar,info);card.append(top,el('p','',p.tags.join(' · ')));
    const button=el('button','open-profile','Profil ansehen ↗');button.type='button';button.setAttribute('aria-label','Demoprofil von '+p.name+' ansehen');button.onclick=()=>{$('dialog-title').textContent=p.name;$('dialog-bio').textContent=p.bio;$('dialog-tags').replaceChildren(...p.tags.map(t=>el('span','',t)));$('profile-dialog').showModal();};card.append(button);return card;
  }
  function group(g){
    const card=el('article','group'),icon=el('span','group-icon',g.icon);icon.setAttribute('aria-hidden','true');card.append(icon,el('h3','',g.name),el('p','',g.description));
    const joined=state.joined.includes(g.id),button=el('button','',joined?'Dabei · wieder verlassen':'Demo-Gruppe beitreten');button.type='button';button.setAttribute('aria-pressed',String(joined));button.setAttribute('aria-label',(joined?'Demo-Gruppe verlassen: ':'Demo-Gruppe beitreten: ')+g.name);button.onclick=()=>{state=M.toggleGroup(state,g.id);save(state.joined.includes(g.id)?'Beispielgruppe ausgewählt.':'Beispielgruppe verlassen.');renderResults(g.id);};button.dataset.group=g.id;card.append(button);return card;
  }
  function renderResults(focusGroup){
    const rows=M.search($('search').value,filter);$('results').replaceChildren(...rows.map(x=>x.kind==='people'?profile(x):group(x)));$('result-count').textContent=rows.length+' '+(rows.length===1?'Treffer':'Treffer');$('empty').hidden=rows.length!==0;
    if(focusGroup){const b=document.querySelector('[data-group="'+focusGroup+'"]');if(b)b.focus();}
  }
  function renderPosts(){
    const rows=[...state.posts.map(p=>({name:'Du in dieser Demo',label:'Dein lokaler Beitrag',text:p.text})),{name:'Mira Wolken',label:'Frei erfundener Beispielbeitrag',text:'Das Gefühl, wenn aus „nur kurz online“ ein ganzer Abend wird. Kennt ihr das noch?'},{name:'Leo Funken',label:'Frei erfundener Beispielbeitrag',text:'Hallo, kleine Zeitreise! Heute: Leute entdecken, eine Gruppe finden, etwas ausprobieren.'}];
    $('posts').replaceChildren(...rows.map(p=>{const a=el('article','post');a.append(el('strong','',p.name),el('small','',p.label),el('p','',p.text));return a;}));
  }
  document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.filter===filter)));renderResults();});
  $('search-form').onsubmit=e=>{e.preventDefault();renderResults();};$('search').oninput=()=>renderResults();
  $('post').oninput=()=>{$('remaining').textContent=(240-$('post').value.length)+' Zeichen übrig';};
  $('post-form').onsubmit=e=>{e.preventDefault();try{state=M.addPost(state,$('post').value,Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));save('Beitrag an die Demo-Pinnwand geheftet.');$('post').value='';$('remaining').textContent='240 Zeichen übrig';renderPosts();}catch(err){say(err.message);$('post').focus();}};
  $('reset').onclick=()=>{state=M.fresh();let resetSaved=true;try{localStorage.removeItem(key);}catch{resetSaved=false;}filter='all';$('search').value='';$('post').value='';$('remaining').textContent='240 Zeichen übrig';document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.filter==='all')));renderResults();renderPosts();say(resetSaved?'Demo zurückgesetzt. Eigene Beiträge und Gruppenwahl wurden aus diesem Browser entfernt.':'Demo für diesen Besuch zurückgesetzt. Der Browser blockiert den Zugriff auf den gespeicherten Zustand.');};
  $('dialog-close').onclick=()=>$('profile-dialog').close();$('profile-dialog').onclick=e=>{if(e.target===$('profile-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}};
  renderResults();renderPosts();
})();
