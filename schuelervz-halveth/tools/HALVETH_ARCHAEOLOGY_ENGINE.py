#!/usr/bin/env python3
"""
HALVETH // schuelerVZ // AUTONOMOUS ARCHAEOLOGY ENGINE 3.3.0

Goal:
- stop making humans browse archive captures one-by-one
- automatically census public Wayback URLs
- progressively download + sanitize public NON-PERSONAL pages
- collapse repeated snapshots into useful route/time clusters
- build a static searchable archaeology database for GitHub Pages
- detect profile-like routes, but do NOT bulk republish historical personal pages
- exact owner-supplied profile URLs can be probed separately

Only Python standard library is used.
"""
from __future__ import annotations
import argparse, collections, datetime as dt, hashlib, html, json, os, re, sys, time
from html.parser import HTMLParser
from urllib.parse import urlencode, urljoin, urlsplit, urlunsplit
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

VERSION = "3.3.0"
UA = "HALVETH-schuelerVZ-autonomous-archaeology/3.3 (+https://github.com/Juri-Halveth/Juri-Halveth.github.io)"
RETRY_CODES = {429, 500, 502, 503, 504}

PERSONAL_PATH_RE = re.compile(
    r"/(?:Profile|Friends|Friend|Pinboard|Messages?|Photo|Photos|Album|Albums|"
    r"Tag|Tags|User|Users|Person|People)(?:/|$)", re.I
)

SAFE_PRIORITY = [
    (re.compile(r"/l/(press|security|help|policy|terms|parents|rules|impressum|banner)", re.I), "institutional"),
    (re.compile(r"/(?:Start|Login|Registration)(?:/|$)", re.I), "shell"),
    (re.compile(r"robots\.txt$", re.I), "robots"),
]

OPAQUE_RE = re.compile(r"^[A-Za-z0-9_-]{8,}$")
NUM_RE = re.compile(r"^\d+$")

def now():
    return dt.datetime.now(dt.timezone.utc).isoformat()

def ensure_dir(p):
    os.makedirs(p, exist_ok=True)

def read_json(path, fallback):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return fallback

def atomic_json(path, obj, pretty=False):
    ensure_dir(os.path.dirname(path))
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2 if pretty else None, separators=None if pretty else (",", ":"))
    os.replace(tmp, path)

def sha256_text(s):
    return hashlib.sha256(s.encode("utf-8", "replace")).hexdigest()

def fetch(url, timeout=60, attempts=5, base_delay=2.5):
    last = None
    for attempt in range(1, attempts + 1):
        try:
            req = Request(url, headers={"User-Agent": UA, "Accept": "*/*", "Cache-Control": "no-cache"})
            with urlopen(req, timeout=timeout) as r:
                return r.status, r.headers, r.read()
        except HTTPError as e:
            last = e
            if e.code not in RETRY_CODES or attempt >= attempts:
                raise
            wait = min(base_delay * (2 ** (attempt - 1)), 30)
            print(f"  retry HTTP {e.code} in {wait:.0f}s")
            time.sleep(wait)
        except URLError as e:
            last = e
            if attempt >= attempts:
                raise
            wait = min(base_delay * (2 ** (attempt - 1)), 30)
            print(f"  retry network in {wait:.0f}s")
            time.sleep(wait)
    raise last

def canonical_url(u):
    try:
        p = urlsplit(u)
        scheme = "http"
        host = (p.hostname or "").lower()
        if host.startswith("www."):
            host = host[4:]
        port = p.port
        netloc = host if port in (None, 80, 443) else f"{host}:{port}"
        path = re.sub(r"/+", "/", p.path or "/")
        if path != "/" and path.endswith("/"):
            path = path[:-1]
        return urlunsplit((scheme, netloc, path, "", ""))
    except Exception:
        return u

def route_pattern(u):
    try:
        path = urlsplit(u).path or "/"
    except Exception:
        path = u
    parts = [p for p in path.split("/") if p]
    out = []
    for p in parts:
        if NUM_RE.match(p):
            out.append("<N>")
        elif OPAQUE_RE.match(p) and not re.match(r"^[A-Za-z]+$", p):
            out.append("<ID>")
        else:
            out.append(p)
    return "/" + "/".join(out)

def classify(u):
    path = urlsplit(u).path or "/"
    if PERSONAL_PATH_RE.search(path):
        return "personal-route"
    for rx, cat in SAFE_PRIORITY:
        if rx.search(path):
            return cat
    if path in ("", "/"):
        return "shell"
    ext = os.path.splitext(path.lower())[1]
    if ext in {".css",".js",".png",".jpg",".jpeg",".gif",".ico",".svg",".woff",".woff2",".ttf",".pdf",".zip"}:
        return "asset"
    return "public-other"

class Extractor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skip = 0
        self.text = []
        self.title = []
        self.in_title = False
        self.links = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in {"script","style","noscript","iframe","object","embed"}:
            self.skip += 1
        if tag == "title":
            self.in_title = True
        if tag in {"a","link"} and attrs.get("href"):
            self.links.append(attrs["href"])
        if tag in {"img","script"} and attrs.get("src"):
            self.links.append(attrs["src"])
    def handle_endtag(self, tag):
        if tag in {"script","style","noscript","iframe","object","embed"} and self.skip:
            self.skip -= 1
        if tag == "title":
            self.in_title = False
    def handle_data(self, data):
        if self.skip:
            return
        t = " ".join(data.split())
        if not t:
            return
        self.text.append(t)
        if self.in_title:
            self.title.append(t)

def sanitize_html(raw, replay_base):
    s = raw
    s = re.sub(r"(?is)<script\b.*?</script>", "", s)
    s = re.sub(r"(?is)<noscript\b.*?</noscript>", "", s)
    s = re.sub(r"(?is)<iframe\b.*?</iframe>", "", s)
    s = re.sub(r"(?is)<object\b.*?</object>", "", s)
    s = re.sub(r"(?is)<embed\b[^>]*>", "", s)
    s = re.sub(r"(?is)<form\b.*?</form>", "", s)
    s = re.sub(r"(?i)\s+on[a-z]+\s*=\s*(\".*?\"|'.*?'|[^\s>]+)", "", s)
    meta = (
        '<meta http-equiv="Content-Security-Policy" content="default-src \'self\' '
        'https://web.archive.org https://*.archive.org data:; script-src \'none\'; '
        'object-src \'none\'; form-action \'none\'; style-src \'self\' \'unsafe-inline\' '
        'https://web.archive.org https://*.archive.org; img-src \'self\' data: '
        'https://web.archive.org https://*.archive.org;">'
        f'<base href="{html.escape(replay_base, quote=True)}">'
    )
    m = re.search(r"(?i)<head[^>]*>", s)
    if m:
        s = s[:m.end()] + meta + s[m.end():]
    else:
        s = meta + s
    return s

def parse_text_links(raw, base):
    ex = Extractor()
    try:
        ex.feed(raw)
    except Exception:
        pass
    links = []
    for href in ex.links:
        try:
            u = urljoin(base, href)
            p = urlsplit(u)
            if p.hostname and p.hostname.lower().endswith("schuelervz.net"):
                links.append(canonical_url(u))
        except Exception:
            pass
    return {
        "title": " ".join(ex.title)[:300],
        "text": re.sub(r"\s+", " ", " ".join(ex.text))[:150000],
        "links": sorted(set(links)),
    }

def cdx_census(max_rows, page_limit):
    """
    Uses plain-text CDX with resumeKey because it is easier to recover from partial service failures.
    One row per urlkey via collapse=urlkey. This gives a URL census, not every snapshot.
    """
    rows = []
    resume = None
    pages = 0
    while len(rows) < max_rows and pages < page_limit:
        params = {
            "url":"schuelervz.net/*",
            "matchType":"domain",
            "fl":"timestamp,original,statuscode,mimetype,digest,urlkey",
            "filter":"statuscode:200",
            "collapse":"urlkey",
            "showResumeKey":"true",
            "limit":str(min(1000, max_rows-len(rows))),
            "output":"txt",
        }
        if resume:
            params["resumeKey"] = resume
        url = "https://web.archive.org/cdx/search/cdx?" + urlencode(params)
        print(f"CDX page {pages+1} :: {len(rows)}/{max_rows}")
        status, headers, body = fetch(url, timeout=90, attempts=5, base_delay=4)
        txt = body.decode("utf-8", "replace")
        next_resume = None
        page_rows = 0
        for line in txt.splitlines():
            line=line.strip()
            if not line:
                continue
            parts=line.split(" ",5)
            if len(parts) < 6:
                next_resume=line
                continue
            ts, original, statuscode, mimetype, digest, urlkey = parts
            rows.append({
                "timestamp":ts,"original":original,"statuscode":statuscode,
                "mimetype":mimetype,"digest":digest,"urlkey":urlkey,
                "canonical":canonical_url(original),
                "route_pattern":route_pattern(original),
                "class":classify(original),
            })
            page_rows += 1
            if len(rows)>=max_rows:
                break
        pages += 1
        if not next_resume or page_rows == 0:
            break
        resume = next_resume
        time.sleep(1.0)
    return rows

def decode_body(headers, body):
    ctype=headers.get("Content-Type","")
    enc="utf-8"
    m=re.search(r"charset=([\w.-]+)",ctype,re.I)
    if m: enc=m.group(1)
    try:
        return body.decode(enc, errors="replace")
    except Exception:
        return body.decode("utf-8", errors="replace")

def choose_fetch_candidates(census, previous_docs, max_fetch):
    done = {d.get("canonical") for d in previous_docs if d.get("local_file")}
    safe = []
    for x in census:
        if x["class"] in {"personal-route","asset"}:
            continue
        if not str(x.get("mimetype","")).startswith(("text/html","text/plain","application/xhtml")):
            continue
        if x["canonical"] in done:
            continue
        priority = {"institutional":0,"shell":1,"public-other":2,"robots":3}.get(x["class"],4)
        safe.append((priority,x))
    safe.sort(key=lambda z:(z[0],z[1].get("timestamp",""),z[1].get("canonical","")))
    return [x for _,x in safe[:max_fetch]]

def build_clusters(docs, census):
    by = collections.defaultdict(list)
    for x in census:
        by[x["canonical"]].append(x)
    docs_by_can = collections.defaultdict(list)
    for d in docs:
        docs_by_can[d.get("canonical")].append(d)

    clusters=[]
    for can, rows in by.items():
        rows=sorted(rows,key=lambda x:x.get("timestamp",""))
        success=docs_by_can.get(can,[])
        representative = success[-1] if success else {}
        clusters.append({
            "canonical":can,
            "route_pattern":rows[0].get("route_pattern"),
            "class":rows[0].get("class"),
            "capture_count_census":len(rows),
            "earliest":rows[0].get("timestamp"),
            "latest":rows[-1].get("timestamp"),
            "years":sorted({str(r.get("timestamp",""))[:4] for r in rows if str(r.get("timestamp",""))[:4].isdigit()}),
            "title":representative.get("title") or can,
            "text":representative.get("text",""),
            "local_file":representative.get("local_file"),
            "ingest_state":"BUNDLED" if representative.get("local_file") else "METADATA_ONLY",
        })
    clusters.sort(key=lambda x:(x["class"],x["canonical"]))
    return clusters

def build_inverted(clusters, route_census):
    docs=[]
    for i,c in enumerate(clusters):
        if c["class"]=="personal-route":
            continue
        docs.append({
            "id":"u:"+str(i),"type":"archive-cluster","title":c["title"],"text":c["text"][:4000],
            "canonical":c["canonical"],"route_pattern":c["route_pattern"],"class":c["class"],
            "earliest":c["earliest"],"latest":c["latest"],"years":c["years"],
            "local_file":c["local_file"],"captures":c["capture_count_census"],
        })
    for i,r in enumerate(route_census):
        docs.append({
            "id":"r:"+str(i),"type":"route-pattern","title":r["pattern"],
            "text":f'{r["class"]} {r["count"]} routes {r["pattern"]}',
            "pattern":r["pattern"],"class":r["class"],"count":r["count"],
        })
    return docs

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--site-root",required=True)
    ap.add_argument("--max-cdx",type=int,default=15000)
    ap.add_argument("--cdx-pages",type=int,default=30)
    ap.add_argument("--max-fetch",type=int,default=1200)
    ap.add_argument("--sleep",type=float,default=.18)
    ap.add_argument("--skip-cdx",action="store_true")
    args=ap.parse_args()

    root=os.path.abspath(args.site_root)
    data=os.path.join(root,"data")
    expanded=os.path.join(root,"archive","expanded")
    ensure_dir(data); ensure_dir(expanded)

    state_path=os.path.join(data,"archaeology-state.json")
    docs_path=os.path.join(data,"archaeology-docs.json")
    census_path=os.path.join(data,"archaeology-cdx-census.json")
    manifest_path=os.path.join(data,"archaeology-manifest.json")
    clusters_path=os.path.join(data,"archaeology-clusters.json")
    search_path=os.path.join(data,"archaeology-search.json")
    route_path=os.path.join(data,"route-census.json")
    profile_census_path=os.path.join(data,"profile-route-census.json")

    state=read_json(state_path,{"version":VERSION,"runs":[]})
    docs=read_json(docs_path,[])
    census=read_json(census_path,[])

    if not args.skip_cdx:
        try:
            new_census=cdx_census(args.max_cdx,args.cdx_pages)
            if new_census:
                census=new_census
                atomic_json(census_path,census)
        except Exception as e:
            print("CDX WARNING:",repr(e))
            if not census:
                print("No prior census. Continuing with existing local archive only.")

    # Import existing V3.2 archive-index into archaeology docs as seed knowledge.
    legacy=read_json(os.path.join(data,"archive-index.json"),[])
    doc_keys={(d.get("timestamp"),d.get("original")) for d in docs}
    for x in legacy:
        k=(x.get("timestamp"),x.get("original"))
        if k in doc_keys:
            continue
        docs.append({
            "timestamp":x.get("timestamp"),
            "original":x.get("original"),
            "canonical":canonical_url(x.get("original","")),
            "route_pattern":route_pattern(x.get("original","")),
            "class":classify(x.get("original","")),
            "title":x.get("title"),
            "text":x.get("text",""),
            "local_file":x.get("local_file"),
            "capture_url":x.get("capture_url"),
            "digest":x.get("digest"),
            "source":"V3.2_IMPORT",
            "ingest_state":x.get("ingest_state"),
            "links":[],
        })
        doc_keys.add(k)

    # If CDX is unavailable, derive census-like records from imported docs.
    if not census:
        census=[{
            "timestamp":d.get("timestamp"),"original":d.get("original"),
            "statuscode":"200","mimetype":"text/html","digest":d.get("digest"),
            "urlkey":None,"canonical":d.get("canonical"),
            "route_pattern":d.get("route_pattern"),"class":d.get("class"),
        } for d in docs if d.get("original")]

    candidates=choose_fetch_candidates(census,docs,args.max_fetch)
    print("FETCH CANDIDATES:",len(candidates))

    for idx,x in enumerate(candidates,1):
        ts=x.get("timestamp"); original=x.get("original")
        if not ts or not original:
            continue
        replay=f"https://web.archive.org/web/{ts}id_/{original}"
        try:
            status,headers,body=fetch(replay,timeout=60,attempts=3,base_delay=2.0)
            raw=decode_body(headers,body)
            parsed=parse_text_links(raw,original)
            safe=sanitize_html(raw,replay)
            key=sha256_text((ts or "")+"|"+original+"|"+str(x.get("digest") or ""))[:24]
            rel=f"archive/expanded/{key}.html"
            with open(os.path.join(root,rel),"w",encoding="utf-8") as f:
                f.write(safe)
            docs.append({
                **x,
                "title":parsed["title"] or original,
                "text":parsed["text"],
                "links":parsed["links"],
                "local_file":rel,
                "capture_url":replay,
                "source":"CDX_AUTONOMOUS",
                "ingest_state":"BUNDLED_PUBLIC",
            })
        except Exception as e:
            docs.append({
                **x,"title":None,"text":"","links":[],"local_file":None,
                "capture_url":replay,"source":"CDX_AUTONOMOUS",
                "ingest_state":"FETCH_ERROR","error":str(e)[:300],
            })
        if idx%25==0:
            print(f"  fetched {idx}/{len(candidates)}")
            atomic_json(docs_path,docs)
        time.sleep(args.sleep)

    # De-duplicate docs by timestamp+original, prefer bundled record.
    best={}
    for d in docs:
        k=(d.get("timestamp"),d.get("original"))
        old=best.get(k)
        if old is None or (not old.get("local_file") and d.get("local_file")):
            best[k]=d
    docs=list(best.values())
    docs.sort(key=lambda d:(d.get("timestamp") or "",d.get("canonical") or ""))
    atomic_json(docs_path,docs)

    # Route census.
    rc=collections.Counter((x.get("route_pattern") or "/",x.get("class") or "unknown") for x in census)
    route_census=[
        {"pattern":p,"class":c,"count":n}
        for (p,c),n in rc.most_common()
    ]
    atomic_json(route_path,route_census,pretty=True)

    # Personal-route census: HASHED exact URLs only, no names/content.
    personals=[x for x in census if x.get("class")=="personal-route"]
    profile_census=[]
    for x in personals:
        profile_census.append({
            "url_sha256":sha256_text(x.get("canonical") or x.get("original") or ""),
            "route_pattern":x.get("route_pattern"),
            "timestamp":x.get("timestamp"),
            "digest":x.get("digest"),
            "state":"PERSONAL_ROUTE_METADATA_ONLY",
        })
    atomic_json(profile_census_path,profile_census)

    clusters=build_clusters(docs,census)
    atomic_json(clusters_path,clusters)
    search_docs=build_inverted(clusters,route_census)
    atomic_json(search_path,search_docs)

    class_counts=collections.Counter(x.get("class","unknown") for x in census)
    unique_urls=len({x.get("canonical") for x in census if x.get("canonical")})
    bundled=sum(1 for d in docs if d.get("local_file"))
    failures=sum(1 for d in docs if d.get("ingest_state")=="FETCH_ERROR")

    manifest={
        "schema":"HALVETH_ARCHAEOLOGY_MANIFEST_3.3",
        "generated_at":now(),
        "version":VERSION,
        "census_rows":len(census),
        "unique_canonical_urls":unique_urls,
        "docs":len(docs),
        "bundled_docs":bundled,
        "fetch_errors":failures,
        "clusters":len(clusters),
        "search_docs":len(search_docs),
        "personal_route_metadata_rows":len(profile_census),
        "classes":dict(class_counts),
        "invariants":[
            "PERSONAL_ROUTE_METADATA_ONLY_BY_DEFAULT",
            "PUBLIC_NON_PERSONAL_PAGES_MAY_BE_BUNDLED",
            "OWNER_SUPPLIED_EXACT_PROFILE_URLS_ARE_PROBED_SEPARATELY",
            "UNKNOWN != FALSE",
            "ARCHIVE_RECORD != CURRENT_PERSON",
        ],
    }
    atomic_json(manifest_path,manifest,pretty=True)

    state.setdefault("runs",[]).append(manifest)
    state["runs"]=state["runs"][-20:]
    state["version"]=VERSION
    atomic_json(state_path,state,pretty=True)

    print(json.dumps(manifest,ensure_ascii=False,indent=2))

if __name__=="__main__":
    main()
