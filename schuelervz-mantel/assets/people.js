const $=q=>document.querySelector(q);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
let APPROVED=[],CLAIMS=[],ARCHIVE=[];
const norm=s=>String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
async function j(url,fallback){try{const r=await fetch(url+"?v="+Date.now(),{cache:"no-store"});if(r.ok)return await r.json()}catch{}return fallback}
function parseIssueBody(body){
  const out={};
  const lines=String(body||"").split(/\r?\n/);
  let key=null,buf=[];
  const flush=()=>{if(key){out[key]=buf.join(" ").trim();buf=[]}};
  for(const line of lines){
    const m=line.match(/^###\s+(.+)$/);
    if(m){flush();key=norm(m[1]).replace(/\s+/g,"_");continue}
    if(key&&line.trim()&&line.trim()!=="_No response_")buf.push(line.trim());
  }
  flush();return out;
}
function pick(o,...keys){for(const k of keys){if(o[k])return o[k]}return ""}
async function loadClaims(){
  const all=[];
  for(let page=1;page<=5;page++){
    try{
      const r=await fetch(`https://api.github.com/repos/Juri-Halveth/Juri-Halveth.github.io/issues?state=open&per_page=100&page=${page}`,{headers:{"Accept":"application/vnd.github+json"}});
      if(!r.ok)break;
      const arr=await r.json();
      if(!Array.isArray(arr)||!arr.length)break;
      arr.filter(x=>!x.pull_request&&String(x.title||"").startsWith("[PROFILE CLAIM]")).forEach(x=>{
        const b=parseIssueBody(x.body);
        all.push({
          source:"github-claim",
          claim_state:"UNVERIFIED_GITHUB_CLAIM",
          github:x.user?.login||"",
          display_name:pick(b,"anzeigename"),
          birthday:pick(b,"geburtstag_öffentlich_optional","geburtstag","birthday"),
          city:pick(b,"ort_öffentlich_optional","ort","stadt","city"),
          school:pick(b,"schule_öffentlich_optional","schule","school"),
          nickname:pick(b,"alter_nickname_optional","alter_nickname","nickname"),
          years:pick(b,"vz_zeit_optional","vz_zeit","aktive_jahre"),
          historic_url:pick(b,"deine_eigene_alte_profil-url_optional","deine_eigene_alte_profil_url_optional","historische_profil-url_optional","historic_url"),
          issue_url:x.html_url,
          created_at:x.created_at
        });
      });
      if(arr.length<100)break;
    }catch{break}
  }
  return all;
}
function vals(){
  return {
    name:norm($("#name").value),
    birthday:norm($("#birthday").value),
    city:norm($("#city").value),
    school:norm($("#school").value),
    nick:norm($("#nick").value),
    years:norm($("#years").value),
    fuzzy:$("#fuzzy").checked
  };
}
function fuzzyContains(hay,needle,fuzzy){
  hay=norm(hay);needle=norm(needle);if(!needle)return true;
  if(hay.includes(needle))return true;
  if(!fuzzy||needle.length<4)return false;
  const tokens=hay.split(/\s+/);
  return tokens.some(t=>distance(t,needle)<=Math.max(1,Math.floor(needle.length*.22)));
}
function distance(a,b){
  const d=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
  for(let i=0;i<=a.length;i++)d[i][0]=i;for(let j=0;j<=b.length;j++)d[0][j]=j;
  for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  return d[a.length][b.length];
}
function personScore(p,q){
  let s=0,used=0;
  const tests=[
    ["display_name","name",7],["github","name",3],["birthday","birthday",5],["city","city",5],
    ["school","school",5],["nickname","nick",5],["years","years",3]
  ];
  for(const [pk,qk,w] of tests){
    if(!q[qk])continue;used++;
    if(fuzzyContains(p[pk],q[qk],q.fuzzy))s+=w;else return -1;
  }
  return used?s:1;
}
function archiveScore(a,q){
  const needle=[q.name,q.city,q.school,q.nick,q.birthday,q.years].filter(Boolean);
  if(!needle.length)return -1;
  const hay=norm((a.title||"")+" "+(a.text||"")+" "+(a.canonical||""));
  let s=0;
  for(const n of needle)if(hay.includes(n))s+=2;
  return s?Math.min(s,8):-1;
}
function renderPerson(p,s){
  const state=p.claim_state||p.kind||"PROFILE";
  const link=p.issue_url?`<a href="${esc(p.issue_url)}" target="_blank" rel="noopener">GitHub-Claim ansehen</a>`:"";
  return `<div class="card">
    <span class="score">${s} pts</span><h3>${esc(p.display_name||p.github||"Unbenannt")}</h3>
    <span class="badge">${esc(state)}</span>${p.github?`<span class="badge">@${esc(p.github)}</span>`:""}
    <dl>
      ${p.birthday?`<dt>Geburtstag</dt><dd>${esc(p.birthday)}</dd>`:""}
      ${p.city?`<dt>Ort</dt><dd>${esc(p.city)}</dd>`:""}
      ${p.school?`<dt>Schule</dt><dd>${esc(p.school)}</dd>`:""}
      ${p.nickname?`<dt>Nickname</dt><dd>${esc(p.nickname)}</dd>`:""}
      ${p.years?`<dt>VZ-Zeit</dt><dd>${esc(p.years)}</dd>`:""}
    </dl>
    ${link}
    <small>${state==="UNVERIFIED_GITHUB_CLAIM"?"Selbstveröffentlichter GitHub-Claim, nicht als historische Identität verifiziert.":"Rekonstruktionsprofil mit ausgewiesenem Claim-State."}</small>
  </div>`;
}
function renderArchive(a,s){
  return `<div class="card">
    <span class="score">${s} pts</span><h3>${esc(a.title||a.canonical||"Archivtreffer")}</h3>
    <span class="badge archive">PUBLIC ARCHIVE MENTION</span>
    <p>${esc((a.text||"").slice(0,420))}</p>
    ${a.canonical?`<code>${esc(a.canonical)}</code>`:""}
    ${a.local_file?`<br><a href="${esc(a.local_file)}" target="_blank">Archivseite öffnen</a>`:""}
    <small>Hinweis aus öffentlichem Nicht-Profil-Archivtext. Kein Identitätsbeweis.</small>
  </div>`;
}
function find(){
  const q=vals(),hits=[];
  [...APPROVED,...CLAIMS].forEach(p=>{const s=personScore(p,q);if(s>=0)hits.push({type:"person",x:p,s})});
  if($("#archiveMentions").checked)ARCHIVE.forEach(a=>{if(a.type!=="archive-cluster")return;const s=archiveScore(a,q);if(s>=0)hits.push({type:"archive",x:a,s})});
  hits.sort((a,b)=>b.s-a.s);
  $("#resultMeta").textContent=`${hits.length} Treffer`;
  $("#results").innerHTML=hits.slice(0,250).map(h=>h.type==="person"?renderPerson(h.x,h.s):renderArchive(h.x,h.s)).join("")||'<div class="empty">Keine Treffer. Das bedeutet nur: im derzeitigen freiwilligen/öffentlichen Index ist nichts Passendes.</div>';
}
function reset(){
  ["name","birthday","city","school","nick","years"].forEach(id=>$("#"+id).value="");
  $("#results").innerHTML="";$("#resultMeta").textContent="noch keine Suche";
}
(async()=>{
  APPROVED=await j("data/people.json",[]);
  ARCHIVE=await j("data/archaeology-search.json",[]);
  CLAIMS=await loadClaims();
  $("#approvedCount").textContent=APPROVED.length;
  $("#claimCount").textContent=CLAIMS.length;
  $("#archiveCount").textContent=ARCHIVE.filter(x=>x.type==="archive-cluster").length;
  $("#find").onclick=find;$("#reset").onclick=reset;
  ["name","birthday","city","school","nick","years"].forEach(id=>$("#"+id).addEventListener("keydown",e=>{if(e.key==="Enter")find()}));
})();