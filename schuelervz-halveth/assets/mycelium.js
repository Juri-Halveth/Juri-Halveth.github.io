const S={archive:[],people:[],routes:[],search:[],noclip:false,graphMode:"all"};
const $=q=>document.querySelector(q),$$=q=>[...document.querySelectorAll(q)];
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const st=(k,v)=>localStorage.setItem("svz-mycelium-"+k,JSON.stringify(v));
const ld=(k,d)=>{try{const v=localStorage.getItem("svz-mycelium-"+k);return v?JSON.parse(v):d}catch{return d}};
const TIMELINE=[
  ["2007","PLATFORM","schülerVZ startet"],
  ["2008","PLATFORM","starkes Wachstum; öffentliche Shell-Seiten im Archiv"],
  ["2009","SECURITY","mehrere großflächige automatisierte Datensammlungen werden öffentlich bekannt"],
  ["2010","SECURITY","weitere Crawler-Berichte / Plattform-Gegenmaßnahmen"],
  ["2012","CORPORATE","Poolworks / Devbliss / technische Trennungslinien"],
  ["2013","SHUTDOWN","schülerVZ wird abgeschaltet"],
  ["2020","RELAUNCH","VZ.net führt Datenimport für alte VZ-Dienste zeitweise wieder ein"],
  ["2026","RECONSTRUCTION","HALVETH // MYCELIUM rekonstruiert öffentliche Artefakte + opt-in Identitäten"]
];

async function j(path,fallback){
  try{const r=await fetch(path+"?v="+Date.now(),{cache:"no-store"});if(r.ok)return await r.json()}catch{}
  return fallback;
}

function deriveSearch(){
  const rows=[];
  S.archive.forEach((x,i)=>rows.push({
    id:"a:"+i,type:"archive",title:x.title||x.original||"Archive",
    text:[x.text,x.original,x.category,x.timestamp,x.digest].filter(Boolean).join(" "),
    category:x.category||"archive",timestamp:x.timestamp||null,original:x.original||null,
    local_file:x.local_file||null,ingest_state:x.ingest_state||null
  }));
  S.people.forEach((x,i)=>rows.push({
    id:"p:"+i,type:"profile",title:x.display_name||x.github||x.id,
    text:[x.display_name,x.github,x.school,x.status,x.historic_profile_id,x.historic_profile_url].filter(Boolean).join(" "),
    profile:x
  }));
  S.routes.forEach((x,i)=>rows.push({
    id:"r:"+i,type:"route",title:x.route,text:[x.route,x.kind,x.source,x.state].join(" "),route:x
  }));
  TIMELINE.forEach((x,i)=>rows.push({
    id:"t:"+i,type:"timeline",title:x[0]+" · "+x[1],text:x.join(" "),timeline:x
  }));
  return rows;
}

async function load(){
  S.archive=await j("data/archive-index.json",[]);
  S.people=await j("data/people.json",[]);
  S.routes=await j("data/route-templates.json",[]);
  S.search=await j("data/search-index.json",[]);
  if(!Array.isArray(S.search)||!S.search.length)S.search=deriveSearch();
}

function page(id){
  $$(".page").forEach(x=>x.classList.remove("active"));
  $("#page-"+id)?.classList.add("active");
  if(id==="graph")renderGraph();
}
function modal(h){$("#modalBody").innerHTML=h;$("#modal").classList.remove("hidden")}

function nav(){
  $$("[data-page]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();page(a.dataset.page)}));
  $$("[data-page-jump]").forEach(a=>a.addEventListener("click",()=>page(a.dataset.pageJump)));
  $$("[data-tool]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();if(a.dataset.tool==="console")showConsole()}));
}

function render(){
  $("#pulseArchive").textContent=S.archive.length;
  $("#pulsePeople").textContent=S.people.length;
  $("#pulseRoutes").textContent=S.routes.length;
  $("#archiveState").textContent=S.archive.length+" indexiert";
  const bundled=S.archive.filter(x=>x.local_file).length;
  $("#bundleState").textContent=bundled+" lokal gebündelt";
  $("#newsFeed").innerHTML=[
    `${S.archive.length} Archivobjekte im Index.`,
    `${bundled} davon mit lokaler HTML-Kopie.`,
    `${S.people.length} opt-in / Rekonstruktionsprofile.`,
    `${S.routes.length} technische Routenmodelle.`,
    `MYCELIUM: jeder Treffer kann in Archiv, Zeit, Route oder Claim verzweigen.`
  ].map(x=>"<div>"+esc(x)+"</div>").join("");
  renderWall();renderYears();renderTimeline();renderProfiles();search("");github();
}

function renderWall(){
  const r=ld("wall",[
    {who:"Juri",body:"T‑0: Die Tüte ist ausgestülpt. Innenstruktur wird außen navigierbar."},
    {who:"SCARLET",body:"UNKNOWN bleibt UNKNOWN. Beziehungen dürfen wachsen, Wahrheit nicht geschätzt werden."}
  ]);
  $("#wall").innerHTML=r.map(x=>"<div><b>"+esc(x.who)+"</b> "+esc(x.body)+"</div>").join("");
}

function renderYears(){
  $("#yearSelect").innerHTML=TIMELINE.map(x=>`<option>${esc(x[0])}</option>`).join("");
  yearInfo();
}
function yearInfo(){
  const y=$("#yearSelect").value;
  const x=TIMELINE.find(z=>z[0]===y);
  $("#yearInfo").innerHTML=x?`<b>${esc(x[1])}</b><br>${esc(x[2])}`:"";
}

function renderTimeline(){
  $("#timeline").innerHTML=TIMELINE.map(x=>`<div class="timelineRow"><time>${esc(x[0])}</time><b>${esc(x[1])}</b><span>${esc(x[2])}</span></div>`).join("");
}

function renderProfiles(){
  $("#profileGrid").innerHTML=S.people.map(p=>`
    <div class="person">
      <div class="miniavatar">${esc(p.initials||String(p.display_name||"?").slice(0,2).toUpperCase())}</div>
      <b>${esc(p.display_name||p.github||p.id)}</b>
      <span>${esc(p.school||"")}</span>
      <small>${esc(p.claim_state||p.kind||"")}</small>
      <small>${p.historic_profile_id?"historic id supplied":"no historic id attached"}</small>
    </div>`).join("")||"<p>Noch keine opt-in Profile.</p>";
}

function scopes(){
  return new Set($$(".scopeCheck:checked").map(x=>x.value));
}
function score(row,terms){
  const hay=(row.title+" "+row.text).toLowerCase();
  let s=0;
  for(const t of terms){
    if((row.title||"").toLowerCase().includes(t))s+=5;
    const n=(hay.match(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"g"))||[]).length;
    s+=Math.min(n,8);
  }
  if(row.type==="profile")s+=1;
  if(row.type==="archive"&&row.local_file)s+=.5;
  return s;
}
function search(q){
  q=(q||"").trim().toLowerCase();
  const terms=q.split(/\s+/).filter(Boolean);
  const allowed=scopes();
  let rows=S.search.filter(r=>allowed.has(r.type));
  if(terms.length)rows=rows.map(r=>({r,s:score(r,terms)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).map(x=>x.r);
  rows=rows.slice(0,250);
  $("#globalResults").innerHTML=rows.map(renderResult).join("")||"<p>Keine Treffer.</p>";
  bindResultButtons();
}
function renderResult(r){
  const tags=[r.type,r.category,r.timestamp&&String(r.timestamp).slice(0,4)].filter(Boolean).map(x=>`<span class="tag">${esc(x)}</span>`).join("");
  let action="";
  if(r.type==="archive"&&r.local_file)action=`<button class="openArchive" data-file="${esc(r.local_file)}">im Universum öffnen</button>`;
  if(r.type==="profile")action=`<button class="focusProfile" data-id="${esc(r.profile?.id||"")}">Profil ansehen</button>`;
  if(r.type==="route")action=`<button class="routeBranch" data-route="${esc(r.route?.route||r.title)}">Route verzweigen</button>`;
  return `<div class="result">
    <h4>${esc(r.title)}</h4>${tags}
    <p>${esc((r.text||"").slice(0,420))}</p>
    ${r.original?`<code>${esc(r.original)}</code>`:""}
    <div>${action}</div>
  </div>`;
}
function bindResultButtons(){
  $$(".openArchive").forEach(b=>b.onclick=()=>modal(`<h2>Archivierte Seite</h2><iframe class="archiveFrame" sandbox src="${esc(b.dataset.file)}"></iframe>`));
  $$(".focusProfile").forEach(b=>b.onclick=()=>{const p=S.people.find(x=>x.id===b.dataset.id);if(p)modal(profileHtml(p))});
  $$(".routeBranch").forEach(b=>b.onclick=()=>{page("graph");S.graphMode="routes";renderGraph(b.dataset.route)});
}
function profileHtml(p){return `<h2>${esc(p.display_name||p.github||p.id)}</h2><p><b>${esc(p.claim_state||"")}</b></p><p>${esc(p.school||"")}</p><pre>${esc(JSON.stringify(p,null,2))}</pre>`}

function normalizeProbe(v){
  v=(v||"").trim();
  if(!v)return null;
  const isUrl=/^https?:\/\//i.test(v);
  return {raw:v,isUrl,id:isUrl?((v.match(/\/Profile\/([^/?#]+)/i)||[])[1]||null):v};
}
function probeProfile(){
  const p=normalizeProbe($("#profileProbe").value);
  const out=$("#profileProbeResult");
  if(!p){out.innerHTML='<div class="probeUnknown">Bitte exakte alte URL oder ID eingeben.</div>';return}

  const claimed=S.people.filter(x=>
    (p.id&&String(x.historic_profile_id||"").toLowerCase()===p.id.toLowerCase())||
    (p.isUrl&&String(x.historic_profile_url||"").toLowerCase()===p.raw.toLowerCase())
  );
  const local=S.archive.filter(x=>{
    const u=String(x.original||"").toLowerCase();
    return p.isUrl?u===p.raw.toLowerCase():(p.id&&u.includes("/profile/"+p.id.toLowerCase()));
  });

  if(claimed.length||local.length){
    out.innerHTML=`<div class="probeOk"><b>LOCAL TRACE FOUND</b><br>${claimed.length} Claim(s), ${local.length} Archivtreffer.<br>${local.slice(0,5).map(x=>esc(x.original)).join("<br>")}</div>`;
    return;
  }

  const candidate=p.id?`Profile/${p.id}`:"Profile/<ID>";
  let extra="";
  if(p.isUrl){
    const wb="https://web.archive.org/web/*/"+encodeURIComponent(p.raw);
    extra=`<p><a target="_blank" rel="noopener" href="${esc(wb)}">Wayback für genau diese URL prüfen</a></p>`;
  }
  out.innerHTML=`<div class="probeUnknown"><b>UNRESOLVED = PRESERVED</b><br>Kein lokaler Treffer im aktuellen Index.</div>
  <div class="probeRoute"><b>Technische Kandidatenroute</b><br><code>${esc(candidate)}</code>${extra}</div>`;
}

function graphData(){
  const nodes=[{id:"core",label:"MYCELIUM",kind:"core",detail:"Archiv + Profile + Routen + Raumzeit"}];
  const edges=[];
  const add=(n,parent="core")=>{nodes.push(n);edges.push([parent,n.id])};

  if(S.graphMode==="all"||S.graphMode==="archive"){
    const cats=[...new Set(S.archive.map(x=>x.category||"archive"))].slice(0,12);
    cats.forEach((c,i)=>add({id:"cat:"+c,label:c,kind:"archive",detail:`${S.archive.filter(x=>(x.category||"archive")===c).length} Archivobjekte`}));
  }
  if(S.graphMode==="all"||S.graphMode==="profiles"){
    S.people.slice(0,18).forEach(p=>add({id:"person:"+p.id,label:p.display_name||p.github||p.id,kind:"profile",detail:p.claim_state||p.kind}));
  }
  if(S.graphMode==="all"||S.graphMode==="routes"){
    S.routes.slice(0,18).forEach(r=>add({id:"route:"+r.route,label:r.route,kind:"route",detail:r.kind+" · "+r.state}));
  }
  TIMELINE.forEach(t=>add({id:"time:"+t[0],label:t[0],kind:"time",detail:t[1]+" · "+t[2]}));
  return {nodes,edges};
}
function renderGraph(focusText=""){
  const svg=$("#graphSvg");if(!svg)return;
  const {nodes,edges}=graphData();
  const W=900,H=520,cx=450,cy=260;
  const pos={core:[cx,cy]};
  const ring=nodes.filter(n=>n.id!=="core");
  ring.forEach((n,i)=>{
    const a=(Math.PI*2*i/Math.max(ring.length,1))-Math.PI/2;
    const radius=n.kind==="time"?220:(n.kind==="profile"?150:190);
    pos[n.id]=[cx+Math.cos(a)*radius,cy+Math.sin(a)*radius];
  });
  const colors={core:"#e4007d",archive:"#6d2a88",profile:"#277a61",route:"#b8860b",time:"#56617a"};
  svg.innerHTML=
    edges.map(([a,b])=>`<line class="edge" x1="${pos[a][0]}" y1="${pos[a][1]}" x2="${pos[b][0]}" y2="${pos[b][1]}"></line>`).join("")+
    nodes.map(n=>{
      const [x,y]=pos[n.id],r=n.kind==="core"?30:18;
      const hi=focusText&&n.label.toLowerCase().includes(String(focusText).toLowerCase());
      return `<g class="node" data-id="${esc(n.id)}" transform="translate(${x},${y})">
        <circle r="${r}" fill="${colors[n.kind]||"#777"}" ${hi?'stroke="#111" stroke-width="5"':""}></circle>
        <text x="0" y="${r+15}" text-anchor="middle">${esc(String(n.label).slice(0,23))}</text>
      </g>`;
    }).join("");
  $$("#graphSvg .node").forEach(g=>g.onclick=()=>{
    const n=nodes.find(x=>x.id===g.dataset.id);
    $("#graphDetail").innerHTML=`<b>${esc(n.label)}</b><br>${esc(n.detail||"")}`;
  });
}

async function github(){
  try{
    const r=await fetch("https://api.github.com/repos/Juri-Halveth/Juri-Halveth.github.io/commits?path=schuelervz-halveth&per_page=1");
    const j=await r.json();
    if(j[0]){$("#liveState").textContent="ONLINE";$("#liveCommit").textContent=j[0].sha.slice(0,7)}
  }catch{$("#liveState").textContent="unbekannt"}
}

function showConsole(){
  $("#console").classList.remove("hidden");$("#consoleIn").focus();
  if(!$("#consoleOut").textContent)out("VERACHEL :: SCHUELERVZ :: MYCELIUM\\nhelp");
}
function out(x){const o=$("#consoleOut");o.textContent+=(o.textContent?"\n":"")+x;o.scrollTop=o.scrollHeight}
function branch(q){
  const terms=String(q||"").toLowerCase().split(/\s+/).filter(Boolean);
  const rows=S.search.map(r=>({r,s:score(r,terms)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,20);
  if(!rows.length){out("NO BRANCHES");return}
  const by={};
  rows.forEach(x=>(by[x.r.type]??=[]).push(x.r.title));
  out(Object.entries(by).map(([k,v])=>k.toUpperCase()+":\n  "+v.slice(0,6).join("\n  ")).join("\n"));
}
function trace(q){
  const t=String(q||"").toLowerCase();
  const a=S.archive.filter(x=>JSON.stringify(x).toLowerCase().includes(t)).slice(0,10);
  out(a.length?a.map(x=>`${x.timestamp||"T?"} | ${x.category||"archive"} | ${x.original||x.title}`).join("\n"):"TRACE EMPTY");
}
function cmd(v){
  const raw=v.trim();const [c,...a]=raw.split(/\s+/);const x=a.join(" ");
  switch((c||"").toLowerCase()){
    case "help":out("help | tcl | find <q> | branch <q> | trace <q> | profile <id/url> | graph [all/archive/profiles/routes] | goto <page/year> | time <year> | whoami | status | clear");break;
    case "tcl":case "noclip":S.noclip=!S.noclip;$("#noclipHud").classList.toggle("hidden",!S.noclip);out("NOCLIP="+S.noclip);break;
    case "find":page("search");$("#globalSearch").value=x;search(x);out("SEARCH UI <- "+x);break;
    case "branch":branch(x);break;
    case "trace":trace(x);break;
    case "profile":page("profiles");$("#profileProbe").value=x;probeProfile();out("PROFILE PROBE <- "+x);break;
    case "graph":S.graphMode=(["all","archive","profiles","routes"].includes(x)?x:"all");page("graph");renderGraph();out("GRAPH="+S.graphMode);break;
    case "goto":if(TIMELINE.some(z=>z[0]===x)){page("time");out("TIME="+x)}else{page(x);out("PAGE="+x)}break;
    case "time":page("time");out((TIMELINE.find(z=>z[0]===x)||["UNKNOWN","UNKNOWN","UNRESOLVED"]).join(" | "));break;
    case "whoami":out(JSON.stringify(S.people.find(p=>p.id==="HALVETH-JURI-2026")||{},null,2));break;
    case "status":out(`archive=${S.archive.length}\nbundled=${S.archive.filter(x=>x.local_file).length}\npeople=${S.people.length}\nroutes=${S.routes.length}\nsearch=${S.search.length}`);break;
    case "clear":$("#consoleOut").textContent="";break;
    default:out("UNKNOWN COMMAND: "+c);
  }
}

function bind(){
  $("#closeModal").onclick=()=>$("#modal").classList.add("hidden");
  $("#closeConsole").onclick=()=>$("#console").classList.add("hidden");
  $("#statusInput").oninput=()=>$("#statusCount").textContent=180-$("#statusInput").value.length;
  $("#statusPost").onclick=()=>st("status",$("#statusInput").value);
  $("#wallPost").onclick=()=>{const v=$("#wallInput").value.trim();if(!v)return;const r=ld("wall",[]);r.unshift({who:"Juri",body:v});st("wall",r);$("#wallInput").value="";renderWall()};
  $("#gruschelBtn").onclick=()=>{const n=ld("gruschel",111)+1;st("gruschel",n);$("#gruschelCount").textContent=n};
  $("#jumpYear").onclick=yearInfo;$("#yearSelect").onchange=yearInfo;
  $("#globalGo").onclick=()=>search($("#globalSearch").value);
  $("#globalSearch").onkeydown=e=>{if(e.key==="Enter")search(e.target.value)};
  $$(".scopeCheck").forEach(x=>x.onchange=()=>search($("#globalSearch").value));
  $("#miniSearch").onkeydown=e=>{if(e.key==="Enter"){page("search");$("#globalSearch").value=e.target.value;search(e.target.value)}};
  $("#profileProbeGo").onclick=probeProfile;
  $("#profileProbe").onkeydown=e=>{if(e.key==="Enter")probeProfile()};
  $("#graphReset").onclick=()=>{S.graphMode="all";renderGraph()};
  $("#graphArchive").onclick=()=>{S.graphMode="archive";renderGraph()};
  $("#graphProfiles").onclick=()=>{S.graphMode="profiles";renderGraph()};
  $("#graphRoutes").onclick=()=>{S.graphMode="routes";renderGraph()};
  $("#consoleForm").onsubmit=e=>{e.preventDefault();const v=$("#consoleIn").value;out("> "+v);cmd(v);$("#consoleIn").value=""};
}

(async()=>{
  await load();nav();bind();
  $("#statusInput").value=ld("status","");
  $("#statusCount").textContent=180-$("#statusInput").value.length;
  $("#gruschelCount").textContent=ld("gruschel",111);
  render();
})();
