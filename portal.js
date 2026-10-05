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
  const project=new URLSearchParams(window.location.search).get('project');
  if(project && Object.hasOwn(topics,project)){
    const url=new URL(window.location.href);
    url.searchParams.delete('project');url.hash=topics[project];
    window.location.replace(url.href);
  }
}());
