/* SPDX-License-Identifier: HALVETH-PIRL-2.0 */
'use strict';

(() => {
  const core = window.HalvethUniverseCore;
  const canvas = document.getElementById('universe-canvas');
  if (!core || !canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  if (!ctx) return;

  const byId = id => document.getElementById(id);
  const lang = document.documentElement.lang;
  const words = {
    de: { file:'Datei', directory:'Ordner', repository:'Repository', commit:'Commit', action:'GitHub Action', hash:'Hash-Cluster', workflow:'Workflow', code:'Code', data:'Datensatz', document:'Dokument', interface:'Oberfläche', media:'Medien', other:'Datei', symlink:'Verknüpfung', search:'Datei, Ordner, Hash oder Workflow suchen', noMatch:'Keine passenden Knoten in diesem Quellstand.', noManifest:'Der Quellraum wurde noch nicht gebaut. Starte den Website-Build erneut.', load:'Quellraum wird geöffnet …', ready:'Quellstand geladen', local:'Lokale Änderung · noch kein GitHub-Permalink', source:'Quelle bei GitHub öffnen ↗', state:'Quellzustand', digest:'SHA-256', links:'Verbindungen', history:'Commits im gebundenen Ausschnitt', hashMatch:'gleicher SHA-256-Hash und gleiche Bytelänge', observed:'Beobachtete Struktur', inferred:'Aus statischem Quellverweis abgeleitet', label:'Knoten ausgewählt', current:'Gegenwärtig', none:'Kein Treffer ausgewählt' },
    en: { file:'File', directory:'Folder', repository:'Repository', commit:'Commit', action:'GitHub Action', hash:'Hash cluster', workflow:'Workflow', code:'Code', data:'Dataset', document:'Document', interface:'Interface', media:'Media', other:'File', symlink:'Link', search:'Search files, folders, hashes or workflows', noMatch:'No matching nodes in this source snapshot.', noManifest:'The source universe has not been built yet. Run the website build again.', load:'Opening source universe …', ready:'Source snapshot loaded', local:'Local change · no GitHub permalink yet', source:'Open source on GitHub ↗', state:'Source state', digest:'SHA-256', links:'Relations', history:'Commits in this bounded snapshot', hashMatch:'matching SHA-256 and byte length', observed:'Observed structure', inferred:'Inferred from a static source reference', label:'Node selected', current:'Current', none:'No node selected' },
    ru: { file:'Файл', directory:'Папка', repository:'Репозиторий', commit:'Коммит', action:'GitHub Action', hash:'Группа хешей', workflow:'Workflow', code:'Код', data:'Набор данных', document:'Документ', interface:'Интерфейс', media:'Медиа', other:'Файл', symlink:'Ссылка', search:'Поиск файлов, папок, хешей или workflows', noMatch:'В этом снимке исходников совпадений нет.', noManifest:'Карта исходников ещё не создана. Запустите сборку сайта.', load:'Открываем пространство исходников …', ready:'Снимок исходников загружен', local:'Локальное изменение · ссылка GitHub пока недоступна', source:'Открыть исходник на GitHub ↗', state:'Состояние источника', digest:'SHA-256', links:'Связи', history:'Коммиты в ограниченном снимке', hashMatch:'совпадают SHA-256 и длина байтов', observed:'Наблюдаемая структура', inferred:'Выведено из статической ссылки в исходнике', label:'Узел выбран', current:'Текущее состояние', none:'Узел не выбран' }
  }[lang] || null;
  const t = (key, fallback) => words?.[key] || fallback;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const timeInput = byId('time-lens');
  const searchInput = byId('universe-search');
  const view = { yaw: -0.38, pitch: 0.16, zoom: 1.35, timePosition: 1 };
  let model, width = 1, height = 1, dpr = 1, frame = null, lastFrame = 0;
  let pointer = null, dragged = false, selectedId = null, searchMatches = new Set(), relatedIds = new Set();
  let fpsFrames = 0, fpsStart = 0, visible = true, stars = [];
  const screen = new Map();

  function dateLabel(epoch, includeTime = false) {
    if (!epoch) return '—';
    return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-GB' : 'de-DE', {
      timeZone: 'Europe/Berlin', day: '2-digit', month: 'short', year: 'numeric',
      ...(includeTime ? { hour:'2-digit', minute:'2-digit', second:'2-digit' } : {})
    }).format(new Date(epoch * 1000));
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const rand = (() => { let s = 0x9e3779b9; return () => ((s = (Math.imul(s,1664525)+1013904223)>>>0)/4294967296); })();
    stars = Array.from({ length: Math.min(180, Math.round(width * height / 5500)) }, () => ({ x:rand()*width, y:rand()*height, r:.35+rand()*.8, a:.08+rand()*.28, phase:rand()*6.28 }));
    draw(performance.now());
  }

  function selectedEpoch() {
    if (!model || !model.commits.length) return 0;
    const n = Number(timeInput.value) / Number(timeInput.max);
    view.timePosition = n;
    return Math.round(model.oldestEpoch + (model.newestEpoch - model.oldestEpoch) * n);
  }

  function updateTimeline(epoch = selectedEpoch()) {
    byId('timeline-date').textContent = dateLabel(epoch, true);
    byId('oldest-date').textContent = dateLabel(model.oldestEpoch);
    byId('newest-date').textContent = dateLabel(model.newestEpoch);
    byId('history-note').textContent = t('history','Commits im gebundenen Ausschnitt') + ` · ${model.commits.length}`;
  }

  function updateSearch() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    searchMatches = new Set();
    relatedIds = new Set();
    if (query) {
      for (const node of model.nodes) {
        const haystack = `${node.name || ''} ${node.path || ''} ${node.id || ''} ${node.sha256 || ''} ${node.sha || ''} ${node.ref || ''}`.toLocaleLowerCase();
        if (haystack.includes(query)) searchMatches.add(node.id);
      }
      for (const edge of model.relations) {
        if (searchMatches.has(edge.source.id)) relatedIds.add(edge.target.id);
        if (searchMatches.has(edge.target.id)) relatedIds.add(edge.source.id);
      }
      if (!searchMatches.size) byId('world-status').textContent = t('noMatch','Keine passenden Knoten in diesem Quellstand.');
      else byId('world-status').textContent = `${searchMatches.size} ${t('label','Knoten gefunden')}`;
    } else byId('world-status').textContent = `${t('ready','Quellstand geladen')} · ${model.data.head.slice(0,7)}`;
    draw(performance.now());
  }

  function color(node) {
    const type = node.kind === 'file' ? node.fileKind : node.kind;
    return core.palette[type] || core.palette[node.kind] || '#aac4dc';
  }

  function drawBlackHole(now) {
    const x = width / 2, y = height / 2, phase = reducedMotion.matches ? 0 : now * .00012;
    const radius = Math.min(width, height) * .2;
    ctx.save();
    const glow = ctx.createRadialGradient(x,y,2,x,y,radius*1.25);
    glow.addColorStop(0,'rgba(1,2,8,.98)');
    glow.addColorStop(.32,'rgba(3,6,18,.9)');
    glow.addColorStop(.58,'rgba(77,49,153,.12)');
    glow.addColorStop(1,'rgba(5,9,18,0)');
    ctx.fillStyle = glow; ctx.fillRect(x-width*.25,y-height*.25,width*.5,height*.5);
    ctx.globalCompositeOperation = 'lighter';
    for (let i=0;i<7;i++) {
      ctx.beginPath();
      const ring = radius * (.52 + i * .1);
      ctx.ellipse(x,y,ring,ring*(.16+i*.018),phase+i*.11,0,Math.PI*2);
      ctx.strokeStyle = i%2 ? 'rgba(166,132,255,.25)' : 'rgba(102,231,237,.3)';
      ctx.lineWidth = i===0?1.8:1;
      ctx.stroke();
    }
    ctx.beginPath();ctx.ellipse(x,y,radius*.55,radius*.105,phase,0,Math.PI*2);ctx.strokeStyle='rgba(246,215,150,.78)';ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle='rgba(1,3,10,.98)';ctx.beginPath();ctx.ellipse(x,y,radius*.3,radius*.075,phase,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  function draw(now) {
    if (!model || !ctx) return;
    ctx.fillStyle='#050912';ctx.fillRect(0,0,width,height);
    for (const star of stars) {
      ctx.globalAlpha = reducedMotion.matches ? star.a : star.a*(.78+.22*Math.sin(now*.001+star.phase));
      ctx.fillStyle='#b8d3f5';ctx.fillRect(star.x,star.y,star.r,star.r);
    }
    ctx.globalAlpha=1;
    screen.clear();
    for (const node of model.nodes) screen.set(node.id,core.project(node.position,view,width,height,now));
    const cutoff=selectedEpoch();
    ctx.lineWidth=.6;
    for (const edge of model.relations) {
      if (!core.relationVisibleAtTime(edge,cutoff)) continue;
      const a=screen.get(edge.source.id),b=screen.get(edge.target.id);
      if (!a||!b||Math.max(Math.abs(a.x),Math.abs(a.y),Math.abs(b.x),Math.abs(b.y))>Math.max(width,height)*1.9) continue;
      const emphasized=searchMatches.has(edge.source.id)||searchMatches.has(edge.target.id)||relatedIds.has(edge.source.id)||relatedIds.has(edge.target.id);
      let alpha=edge.type==='CONTAINS'?.026:edge.type==='COMMIT_TOUCHES_FILE'?.045:edge.type==='SAME_SHA256'?.16:edge.type==='USES_ACTION'?.19:.052;
      if (searchMatches.size) alpha=emphasized?Math.min(.72,alpha*3.8):alpha*.13;
      ctx.globalAlpha=alpha;
      ctx.strokeStyle=edge.evidenceState==='INFERRED'?'#79cbd9':edge.type==='SAME_SHA256'?'#f0ce81':'#8b99ed';
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      if (edge.type!=='CONTAINS' && (emphasized || (!searchMatches.size && parseInt(edge.id.slice(0,2),16)%47===0))) {
        const phase=parseInt(edge.id.slice(2,8),16)/0xffffff;
        const travel=reducedMotion.matches?.5:(now*.00012+phase)%1;
        const px=a.x+(b.x-a.x)*travel,py=a.y+(b.y-a.y)*travel;
        ctx.globalAlpha=emphasized?.9:.42;ctx.fillStyle=edge.type==='SAME_SHA256'?'#ffe6a2':edge.evidenceState==='INFERRED'?'#8ceaf0':'#b9a8ff';
        ctx.beginPath();ctx.arc(px,py,emphasized?1.8:1.2,0,Math.PI*2);ctx.fill();
      }
    }
    ctx.globalAlpha=1;
    drawBlackHole(now);
    for (const node of model.nodes) {
      if (!core.visibleAtTime(node,cutoff)) continue;
      const p=screen.get(node.id);if(!p)continue;
      if(p.x<-8||p.y<-8||p.x>width+8||p.y>height+8)continue;
      const match=searchMatches.has(node.id),near=relatedIds.has(node.id),selected=node.id===selectedId;
      let radius=node.kind==='repository'?5.8:node.kind==='commit'?2.6:node.kind==='directory'?1.4:node.kind==='external-action'?3.4:node.kind==='content-cluster'?3:1.25;
      radius*=Math.max(.6,Math.min(1.85,p.scale));
      if(node.kind==='file') radius+=Math.min(2,Math.sqrt(node.degree||0)*.13);
      if(selected)radius+=4;
      else if(match)radius+=2.6;
      ctx.globalAlpha=searchMatches.size?(match?1:near?.82:.12):node.kind==='directory'?.64:node.kind==='file'?.74:.9;
      ctx.fillStyle=color(node);
      if(selected||match) { ctx.shadowColor=color(node);ctx.shadowBlur=selected?16:9; }
      ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      if(selected){ctx.beginPath();ctx.arc(p.x,p.y,radius+5+Math.sin(now*.006)*2,0,Math.PI*2);ctx.strokeStyle=color(node);ctx.lineWidth=.8;ctx.globalAlpha=.55;ctx.stroke();ctx.globalAlpha=1;}
    }
    ctx.globalAlpha=1;
    const labels=selectedId
      ? model.nodes.filter(node=>node.id===selectedId)
      : searchMatches.size
        ? model.nodes.filter(node=>searchMatches.has(node.id)).slice(0,5)
        : [];
    ctx.font='10px ui-monospace,Consolas,monospace';ctx.textBaseline='middle';
    const occupied=[];
    for(const node of labels){
      const p=screen.get(node.id);if(!p||p.x<0||p.y<0||p.x>width-24||p.y>height-15)continue;
      const label=(node.path||node.name||node.id).slice(0,32),textWidth=ctx.measureText(label).width;
      const x=Math.min(width-textWidth-12,Math.max(8,p.x+8)),y=Math.max(12,Math.min(height-12,p.y-8));
      const box={left:x-3,right:x+textWidth+3,top:y-8,bottom:y+8};
      if(occupied.some(other=>box.left<other.right&&box.right>other.left&&box.top<other.bottom&&box.bottom>other.top))continue;
      occupied.push(box);ctx.fillStyle='#d7e5f6';ctx.globalAlpha=.88;ctx.fillText(label,x,y);
    }
    ctx.globalAlpha=1;
    if(model.data.repositoryNodeId){const p=screen.get(model.data.repositoryNodeId);if(p){ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fillStyle='#fff0bf';ctx.fill();}}
    if(now-fpsStart>=750){byId('fps-count').textContent=String(Math.round(fpsFrames*1000/(now-fpsStart)));fpsFrames=0;fpsStart=now;}
    fpsFrames++;
    if(!reducedMotion.matches&&visible&&!document.hidden)frame=requestAnimationFrame(tick);
  }

  function tick(now) { frame=null;draw(now); }
  function schedule() { if(!reducedMotion.matches&&visible&&!document.hidden&&frame===null)frame=requestAnimationFrame(tick); }

  function choose(node) {
    selectedId=node?.id||null;
    const details=byId('node-detail');details.replaceChildren();
    if(!node){const strong=document.createElement('strong');strong.textContent=t('none','Berühre einen Knoten.');const span=document.createElement('span');span.textContent=t('noMatch','Die Quelle und ihre Hash-Spur erscheinen hier.');details.append(strong,span);draw(performance.now());return;}
    const kind=document.createElement('span');kind.className='node-kind';kind.textContent=t(node.kind,node.kind==='file'?t(node.fileKind,node.fileKind):node.kind);
    const title=document.createElement('strong');title.textContent=node.path||node.name||node.sha||node.id;
    details.append(kind,title);
    if(node.sourceState){const state=document.createElement('span');state.textContent=`${t('state','Quellzustand')}: ${node.sourceState}${node.lastChangedAt?' · '+dateLabel(node.lastChangedEpoch,true):''}`;details.append(state);}
    if(node.sha256){const hash=document.createElement('span');hash.textContent=`${t('digest','SHA-256')}: ${node.sha256}`;details.append(hash);}
    if(node.kind==='external-action'){const status=document.createElement('span');status.textContent=`${node.ref} · ${node.referenceState}`;details.append(status);}
    const relationCount=model.relations.filter(edge=>edge.source.id===node.id||edge.target.id===node.id).length;
    const count=document.createElement('span');count.textContent=`${t('links','Verbindungen')}: ${relationCount}`;details.append(count);
    if(node.sourceUrl){const link=document.createElement('a');link.href=node.sourceUrl;link.target='_blank';link.rel='noopener noreferrer';link.textContent=t('source','Quelle bei GitHub öffnen ↗');details.append(link);}
    else if(node.kind==='file'){const local=document.createElement('span');local.textContent=t('local','Lokale Änderung · noch kein GitHub-Permalink');details.append(local);}
    draw(performance.now());
  }

  function pick(x,y){let found=null,best=13;
    for(const node of model.nodes){if(!core.visibleAtTime(node,selectedEpoch()))continue;const p=screen.get(node.id);if(!p)continue;const radius=node.kind==='file'?6:node.kind==='commit'?8:10;const d=Math.hypot(p.x-x,p.y-y);if(d<Math.max(best,radius)){best=d;found=node;}}
    return found;
  }

  canvas.addEventListener('pointerdown',event=>{canvas.focus();pointer={x:event.clientX,y:event.clientY,yaw:view.yaw,pitch:view.pitch};dragged=false;canvas.setPointerCapture(event.pointerId);});
  canvas.addEventListener('pointermove',event=>{if(!pointer)return;const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;if(Math.abs(dx)+Math.abs(dy)>3)dragged=true;view.yaw=pointer.yaw+dx*.006;view.pitch=Math.max(-1.25,Math.min(1.25,pointer.pitch+dy*.006));draw(performance.now());});
  canvas.addEventListener('pointerup',event=>{if(pointer&&!dragged){const rect=canvas.getBoundingClientRect();choose(pick(event.clientX-rect.left,event.clientY-rect.top));}pointer=null;});
  canvas.addEventListener('pointercancel',()=>{pointer=null;});
  canvas.addEventListener('wheel',event=>{event.preventDefault();view.zoom=Math.max(.42,Math.min(2.8,view.zoom*Math.exp(-event.deltaY*.001)));draw(performance.now());},{passive:false});
  canvas.addEventListener('keydown',event=>{
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(event.key)){event.preventDefault();
      if(event.shiftKey&&event.key.startsWith('Arrow'))timeInput.value=String(Math.max(0,Math.min(Number(timeInput.max),Number(timeInput.value)+(event.key==='ArrowLeft'||event.key==='ArrowDown'?-25:25))));
      else if(event.key==='ArrowLeft')view.yaw-=.08;else if(event.key==='ArrowRight')view.yaw+=.08;else if(event.key==='ArrowUp')view.pitch=Math.max(-1.25,view.pitch-.07);else if(event.key==='ArrowDown')view.pitch=Math.min(1.25,view.pitch+.07);else if(event.key==='-' )view.zoom=Math.max(.42,view.zoom*.88);else view.zoom=Math.min(2.8,view.zoom*1.13);
      draw(performance.now());
    } else if(event.key==='0'){view.yaw=-.38;view.pitch=.16;view.zoom=1.35;timeInput.value='1000';draw(performance.now());}
  });
  searchInput.addEventListener('input',updateSearch);
  searchInput.addEventListener('keydown',event=>{if(event.key==='Enter'){const first=model.nodes.find(node=>searchMatches.has(node.id));if(first){choose(first);const p=screen.get(first.id);if(p){view.yaw+=((width/2-p.x)/Math.max(200,width))*.4;view.pitch+=((height/2-p.y)/Math.max(200,height))*.4;draw(performance.now());}}}});
  timeInput.addEventListener('input',()=>{updateTimeline();draw(performance.now());});
  byId('zoom-in').addEventListener('click',()=>{view.zoom=Math.min(2.8,view.zoom*1.2);draw(performance.now());});
  byId('zoom-out').addEventListener('click',()=>{view.zoom=Math.max(.42,view.zoom/1.2);draw(performance.now());});
  byId('reset-view').addEventListener('click',()=>{view.yaw=-.38;view.pitch=.16;view.zoom=1.35;timeInput.value='1000';draw(performance.now());});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){visible=false;if(frame!==null)cancelAnimationFrame(frame);frame=null;}else{visible=true;draw(performance.now());schedule();}});
  reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches&&frame!==null){cancelAnimationFrame(frame);frame=null;}draw(performance.now());schedule();});
  if(typeof ResizeObserver==='function')new ResizeObserver(resize).observe(canvas);else window.addEventListener('resize',resize);

  async function start(){
    try{
      const response=await fetch('/data/source-universe.json',{cache:'no-store',credentials:'same-origin'});
      if(!response.ok)throw new Error(t('noManifest','Der Quellraum wurde noch nicht gebaut. Starte den Website-Build erneut.'));
      const data=await response.json();model=core.createModel(data);
      byId('loading-state').hidden=true;
      byId('world-status').textContent=`${t('ready','Quellstand geladen')} · ${data.head.slice(0,7)}`;
      byId('node-count').textContent=new Intl.NumberFormat(lang==='ru'?'ru-RU':lang==='en'?'en-GB':'de-DE').format(data.nodes.length);
      byId('relation-count').textContent=new Intl.NumberFormat(lang==='ru'?'ru-RU':lang==='en'?'en-GB':'de-DE').format(data.relations.length);
      byId('repo-label').textContent=data.repository.replace('/',' / ');
      byId('snapshot-label').textContent=`${t('current','GitHub-Stand')} · ${dateLabel(Date.parse(data.headDate)/1000)}`;
      byId('source-footer').textContent=`GitHub ${data.repository} · ${data.head.slice(0,12)} · ${data.coverage.trackedFiles} Dateien · Datei-Inhalte werden nicht übertragen.`;
      if(model.commits.length){timeInput.disabled=false;updateTimeline();}
      resize();draw(performance.now());schedule();
    }catch(error){byId('loading-state').hidden=true;const box=byId('error-state');box.hidden=false;box.textContent=`${t('noManifest','Der Quellraum wurde noch nicht gebaut. Starte den Website-Build erneut.')} ${String(error.message||error)}`;byId('world-status').textContent='QUELLSTAND NICHT VERFÜGBAR';}
  }
  start();
})();
