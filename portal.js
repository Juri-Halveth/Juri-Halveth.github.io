/* Resolve legacy project links to their topic. No tracking or stored selection. */
(function () {
  'use strict';
  const topics = {
    RESEARCH:'forschung',PUBLIC_KIT:'forschung',SCARLET:'forschung',SCARLET_SITE:'forschung',
    UNREAL:'gestaltung',MORROWIND:'gestaltung',REALMS:'gestaltung',
    LEARNSTUDIO:'lernen',LEARNPORTAL:'lernen',LEARNSTUDIO_SITE:'lernen',
    FORTUNA:'software',VAULT:'software',KEEPER:'software',BIRTH:'software',PROPOSAL:'software',
    PROFILE:'nachweise',SPACE:'anfang'
  };
  const url=new URL(window.location.href),project=url.searchParams.get('project'),language=url.searchParams.get('lang');
  let changed=false;
  if(project && Object.hasOwn(topics,project)){url.searchParams.delete('project');url.hash=topics[project];changed=true;}
  if(['de','en','ru'].includes(language)){
    url.pathname=url.pathname.replace(/^\/(?:en\/|ru\/)?/,'/'+(language==='de'?'':language+'/'));
    url.searchParams.delete('lang');changed=true;
  }
  if(changed)window.location.replace(url.href);
}());
