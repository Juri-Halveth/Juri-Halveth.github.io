/* Explicit lazy launch keeps independent numerical labs from all running at once. */
(()=>{'use strict';
 for(const button of document.querySelectorAll('[data-module-open]'))button.addEventListener('click',()=>{
  const frame=document.getElementById('module-'+button.dataset.moduleOpen);if(!frame)return;
  if(frame.hasAttribute('src')){frame.removeAttribute('src');frame.hidden=true;button.textContent='Numerisches Labor öffnen';}
  else{frame.src=frame.dataset.moduleSrc;frame.hidden=false;button.textContent='Numerisches Labor schließen';}
 });
})();
