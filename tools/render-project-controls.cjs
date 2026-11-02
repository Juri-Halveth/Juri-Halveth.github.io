'use strict';
// Source-available under LICENSES.md.
const words={
 de:{title:'Was möchtest du machen?',lead:'Wähle eine Aufgabe. Öffne die Anwendung oder den passenden Quellcode.',search:'Projekte durchsuchen',placeholder:'Zum Beispiel: lernen, Bild, Zeit, Zugangsdaten',all:'Alle',software:'Werkzeuge',worlds:'Visualisierung',learning:'Lernen',research:'Modelle',empty:'Kein passender Eintrag. Probiere einen anderen Begriff.',clear:'Alle Projekte zeigen',count:n=>`${n} ausgewählte Projekte`},
 en:{title:'What would you like to do?',lead:'Choose a task. Open the application or its source code.',search:'Search projects',placeholder:'For example: learn, image, time, credentials',all:'All',software:'Tools',worlds:'Visuals',learning:'Learning',research:'Models',empty:'No matching project. Try another search.',clear:'Show all projects',count:n=>`${n} selected projects`},
 ru:{title:'Что вы хотите сделать?',lead:'Выберите задачу. Откройте приложение или его исходный код.',search:'Поиск проектов',placeholder:'Например: обучение, изображение, время, пароли',all:'Все',software:'Инструменты',worlds:'Визуализация',learning:'Обучение',research:'Модели',empty:'Ничего не найдено. Попробуйте другое слово.',clear:'Показать все проекты',count:n=>`Избранных проектов: ${n}`}
};
function renderProjectControls(lang,count,categories=['software','learning','research'],compact=false){
 const w=words[lang];if(!w)throw Error('Unknown directory language');
 const filters=`<div role="group" aria-label="${w.search}" class="project-filters">${['all',...categories].map(kind=>`<button type="button" data-project-filter="${kind}" aria-pressed="${kind==='all'}">${w[kind]}</button>`).join('')}</div>`;
 const filterControl=compact?`<details class="category-toggle"><summary>${lang==='de'?'Kategorien':lang==='en'?'Categories':'Категории'}</summary>${filters}</details>`:filters;
 return `<section class="shell project-finder${compact?' project-finder-compact':''}" ${compact?`aria-label="${w.search}"`:'aria-labelledby="project-finder-title"'} data-language="${lang}">${compact?'':`<h2 id="project-finder-title">${w.title}</h2><p>${w.lead}</p>`}<label for="project-search">${w.search}</label><input id="project-search" type="search" maxlength="120" placeholder="${w.placeholder}">${filterControl}<p id="project-filter-count" role="status">${w.count(count)}</p><div id="project-empty" hidden><p>${w.empty}</p><button id="project-clear" type="button">${w.clear}</button></div></section>`;
}
module.exports={renderProjectControls};
