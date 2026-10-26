// Source-available under LICENSES.md. Local display filtering only.
export function mountProjectFinder(doc){
 const input=doc.getElementById('project-search');if(!input)return null;
 const cards=[...doc.querySelectorAll('[data-project]')];
 const groups=[...doc.querySelectorAll('[data-project-group]')];
 const buttons=[...doc.querySelectorAll('[data-project-filter]')];
 const lang=doc.querySelector('.project-finder').dataset.language;
 let kind='all';
 function refresh(){
  const query=input.value.trim().toLocaleLowerCase(lang);let found=0;
  for(const card of cards){card.hidden=!((kind==='all'||card.dataset.category===kind)&&(card.textContent+' '+card.dataset.project).toLocaleLowerCase(lang).includes(query));if(!card.hidden)found++;}
  for(const group of groups)group.hidden=![...group.querySelectorAll('[data-project]')].some(card=>!card.hidden);
  doc.getElementById('project-filter-count').textContent=lang==='de'?`${found} von ${cards.length} Projekten`:lang==='en'?`${found} of ${cards.length} projects`:`Проекты: ${found} из ${cards.length}`;
  doc.getElementById('project-empty').hidden=found!==0;
  for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.projectFilter===kind));
 }
 input.addEventListener('input',refresh);
 for(const button of buttons)button.addEventListener('click',()=>{kind=button.dataset.projectFilter;refresh();});
 doc.getElementById('project-clear').addEventListener('click',()=>{kind='all';input.value='';refresh();input.focus();});
 refresh();return {refresh};
}
if(typeof document!=='undefined')mountProjectFinder(document);
