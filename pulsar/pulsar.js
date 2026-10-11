'use strict';
(() => {
  const clock=document.querySelector('[data-live-clock]');
  const formatter=new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'medium'});
  const tick=()=>{if(clock){const now=new Date();clock.dateTime=now.toISOString();clock.textContent=formatter.format(now);}};
  tick();window.setInterval(tick,1000);

  const cards=[...document.querySelectorAll('.project-card')];
  const filters=[...document.querySelectorAll('[data-filter]')];
  const search=document.querySelector('[data-project-search]');
  const count=document.querySelector('[data-result-count]');
  let active='all';
  const normalize=value=>String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
  const update=()=>{
    const query=normalize(search?.value);
    let visible=0;
    for(const card of cards){
      const topicMatch=active==='all'||card.dataset.topic===active;
      const textMatch=!query||normalize(card.textContent).includes(query);
      card.hidden=!(topicMatch&&textMatch);
      if(!card.hidden)visible++;
    }
    if(count)count.textContent=String(visible);
  };
  for(const button of filters){
    button.addEventListener('click',()=>{
      active=button.dataset.filter||'all';
      for(const sibling of filters)sibling.setAttribute('aria-pressed',String(sibling===button));
      update();
    });
  }
  search?.addEventListener('input',update);
})();
