const $=q=>document.querySelector(q),$$=q=>[...document.querySelectorAll(q)];
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
let M={},S=[],H=[],I={};

async function j(path,fallback){try{const r=await fetch(path+"?v="+Date.now(),{cache:"no-store"});if(r.ok)return await r.json()}catch{}return fallback}
function metric(n,l){return `<div class="metric"><b>${esc(n)}</b><span>${esc(l)}</span></div>`}
function renderMetrics(){
  $("#cards").innerHTML=[
    metric(M.unique_urls||0,"unique URLs"),
    metric(M.bundled_canonical||0,"bundled URLs"),
    metric(M.route_patterns||0,"route patterns"),
    metric(M.people_searchable||0,"searchable people"),
    metric(M.search_rows||0,"search rows"),
    metric(M.delta_bundled_canonical||0,"new this run")
  ].join("");
}
function selected(){return new Set($$(".filters input:checked").map(x=>x.value))}
function score(row,terms){
  const hay=((row.title||"")+" "+(row.text||"")+" "+(row.canonical||"")).toLowerCase();
  let s=0;for(const t of terms){if((row.title||"").toLowerCase().includes(t))s+=5;if(hay.includes(t))s+=2}return s
}
function search(q,forceType=""){
  const terms=String(q||"").trim().toLowerCase().split(/\s+/).filter(Boolean);
  const allow=selected();
  let rows=S.filter(x=>(forceType?x.type===forceType:allow.has(x.type)));
  if(terms.length)rows=rows.map(x=>({x,s:score(x,terms)})).filter(z=>z.s>0).sort((a,b)=>b.s-a.s).map(z=>z.x);
  rows=rows.slice(0,200);
  $("#results").innerHTML=rows.map(r=>`<div class="result"><h3>${esc(r.title)}</h3><span class="tag">${esc(r.type)}</span>${r.class?`<span class="tag">${esc(r.class)}</span>`:""}<p>${esc((r.text||"").slice(0,420))}</p>${r.local_file?`<a href="${esc(r.local_file)}" target="_blank">im Universum öffnen</a>`:""}${r.profile?.issue_url?`<a href="${esc(r.profile.issue_url)}" target="_blank">GitHub-Claim</a>`:""}<small>${r.type==="profile"?(r.profile?.claim_state||"PROFILE"):(r.canonical||"")}</small></div>`).join("")||"<p>Keine Treffer.</p>";
}
function out(t){const o=$("#out");o.textContent+=(o.textContent?"\n":"")+t;o.scrollTop=o.scrollHeight}
function cmd(v){
  const [c,...rest]=String(v).trim().split(/\s+/),x=rest.join(" ");
  switch((c||"").toLowerCase()){
    case "status":out(JSON.stringify(M,null,2));break;
    case "prestige":out(`T-0 -> T+4\nnew bundled: ${M.delta_bundled_canonical||0}\npeople: ${M.people_searchable||0}\nroutes: ${M.route_patterns||0}`);break;
    case "find":$("#q").value=x;search(x);out("SEARCH <- "+x);break;
    case "person":$("#q").value=x;search(x,"profile");out("PERSON <- "+x);break;
    case "archive":$("#q").value=x;search(x,"archive");out("ARCHIVE <- "+x);break;
    case "integrity":out(JSON.stringify(I,null,2));break;
    case "history":out(JSON.stringify(H.slice(-4),null,2));break;
    case "clear":$("#out").textContent="";break;
    case "help":out("status | prestige | find <text> | person <text> | archive <text> | integrity | history | clear");break;
    default:out("UNKNOWN COMMAND: "+c);
  }
}
(async()=>{
  [M,S,H,I]=await Promise.all([
    j("data/prestige-manifest.json",{}),
    j("data/prestige-search.json",[]),
    j("data/prestige-history.json",[]),
    j("data/prestige-integrity.json",{})
  ]);
  renderMetrics();search("");
  $("#go").onclick=()=>search($("#q").value);$("#q").onkeydown=e=>{if(e.key==="Enter")search(e.target.value)};
  $$(".filters input").forEach(x=>x.onchange=()=>search($("#q").value));
  $("#termform").onsubmit=e=>{e.preventDefault();const v=$("#cmd").value;out("> "+v);cmd(v);$("#cmd").value=""};
})();