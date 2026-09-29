#!/usr/bin/env python3
"""
HALVETH // SCHUELERVZ // PRESTIGE FOUR ENGINE 3.5.0

Four forward steps in one run:

I.   SENSE      - inspect current archive, coverage, failures, route entropy
II.  FRONTIER   - spend a bounded fetch budget on the highest-information public non-personal pages
III. RELATE     - build route/time/mention graph + compact search indexes
IV. VERIFY      - compile voluntary GitHub claims, integrity receipts, health + delta report

This engine never bulk republishes leaked historic personal profiles.
Personal/profile-like routes remain metadata-only unless an owner supplies an exact URL separately.
"""
from __future__ import annotations

import argparse, collections, datetime as dt, hashlib, html, json, math, os, re, time
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, urlunsplit
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

VERSION = "3.5.0"
UA = "HALVETH-schuelerVZ-prestige-four/3.5 (+https://github.com/Juri-Halveth/Juri-Halveth.github.io)"
RETRY_CODES = {429, 500, 502, 503, 504}

PERSONAL_RE = re.compile(
    r"/(?:Profile|Friends|Friend|Pinboard|Messages?|Photo|Photos|Album|Albums|"
    r"Tag|Tags|User|Users|Person|People)(?:/|$)", re.I
)

def utcnow():
    return dt.datetime.now(dt.timezone.utc).isoformat()

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def read_json(path, fallback):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return fallback

def write_json(path, obj, pretty=False):
    ensure_dir(os.path.dirname(path))
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(
            obj, f, ensure_ascii=False,
            indent=2 if pretty else None,
            separators=None if pretty else (",", ":"),
        )
    os.replace(tmp, path)

def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def sha256_text(text):
    return hashlib.sha256(text.encode("utf-8", "replace")).hexdigest()

def canonical_url(u):
    try:
        p = urlsplit(u)
        host = (p.hostname or "").lower()
        if host.startswith("www."):
            host = host[4:]
        port = p.port
        netloc = host if port in (None, 80, 443) else f"{host}:{port}"
        path = re.sub(r"/+", "/", p.path or "/")
        if path != "/" and path.endswith("/"):
            path = path[:-1]
        return urlunsplit(("http", netloc, path, "", ""))
    except Exception:
        return u

def route_pattern(u):
    path = urlsplit(u).path or "/"
    out = []
    for part in [p for p in path.split("/") if p]:
        if part.isdigit():
            out.append("<N>")
        elif len(part) >= 8 and re.match(r"^[A-Za-z0-9_-]+$", part) and not part.isalpha():
            out.append("<ID>")
        else:
            out.append(part)
    return "/" + "/".join(out)

def classify(u):
    path = urlsplit(u).path or "/"
    low = path.lower()

    if PERSONAL_RE.search(path):
        return "personal-route"
    if re.search(r"/l/(press|security|help|policy|terms|parents|rules|impressum|banner)", path, re.I):
        return "institutional"
    if re.search(r"/(?:Start|Login|Registration)(?:/|$)", path, re.I) or path == "/":
        return "shell"
    if low.endswith("robots.txt"):
        return "robots"
    ext = os.path.splitext(low)[1]
    if ext in {".css",".js",".png",".jpg",".jpeg",".gif",".ico",".svg",".woff",".woff2",".ttf",".pdf",".zip"}:
        return "asset"
    return "public-other"

def fetch(url, timeout=60, attempts=3, base_delay=2.0):
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
            wait = min(base_delay * (2 ** (attempt - 1)), 12)
            print(f"      retry HTTP {e.code} in {wait:.0f}s")
            time.sleep(wait)
        except URLError as e:
            last = e
            if attempt >= attempts:
                raise
            wait = min(base_delay * (2 ** (attempt - 1)), 12)
            print(f"      retry network in {wait:.0f}s")
            time.sleep(wait)
    raise last

class Extractor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skip = 0
        self.title = []
        self.text = []
        self.links = []
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in {"script","style","noscript","iframe","object","embed"}:
            self.skip += 1
        if tag == "title":
            self.in_title = True
        if tag in {"a","link"} and attrs.get("href"):
            self.links.append(attrs["href"])
        if tag == "img" and attrs.get("src"):
            self.links.append(attrs["src"])

    def handle_endtag(self, tag):
        if tag in {"script","style","noscript","iframe","object","embed"} and self.skip:
            self.skip -= 1
        if tag == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.skip:
            return
        text = " ".join(data.split())
        if not text:
            return
        self.text.append(text)
        if self.in_title:
            self.title.append(text)

def decode_body(headers, body):
    ctype = headers.get("Content-Type", "")
    enc = "utf-8"
    m = re.search(r"charset=([\w.-]+)", ctype, re.I)
    if m:
        enc = m.group(1)
    try:
        return body.decode(enc, errors="replace")
    except Exception:
        return body.decode("utf-8", errors="replace")

def parse_page(raw, base):
    ex = Extractor()
    try:
        ex.feed(raw)
    except Exception:
        pass

    links = []
    for href in ex.links:
        try:
            absolute = urljoin(base, href)
            p = urlsplit(absolute)
            if p.hostname and p.hostname.lower().endswith("schuelervz.net"):
                links.append(canonical_url(absolute))
        except Exception:
            pass

    return {
        "title": " ".join(ex.title)[:300],
        "text": re.sub(r"\s+", " ", " ".join(ex.text))[:150000],
        "links": sorted(set(links)),
    }

def sanitize_html(raw, replay):
    s = raw
    for tag in ("script","noscript","iframe","object"):
        s = re.sub(fr"(?is)<{tag}\b.*?</{tag}>", "", s)
    s = re.sub(r"(?is)<embed\b[^>]*>", "", s)
    s = re.sub(r"(?is)<form\b.*?</form>", "", s)
    s = re.sub(r"(?i)\s+on[a-z]+\s*=\s*(\".*?\"|'.*?'|[^\s>]+)", "", s)

    meta = (
        '<meta http-equiv="Content-Security-Policy" content="default-src \'self\' '
        'https://web.archive.org https://*.archive.org data:; script-src \'none\'; '
        'object-src \'none\'; form-action \'none\'; style-src \'self\' \'unsafe-inline\' '
        'https://web.archive.org https://*.archive.org; img-src \'self\' data: '
        'https://web.archive.org https://*.archive.org;">'
        f'<base href="{html.escape(replay, quote=True)}">'
    )
    m = re.search(r"(?i)<head[^>]*>", s)
    return s[:m.end()] + meta + s[m.end():] if m else meta + s

def load_issues_ndjson(path):
    out = []
    if not os.path.exists(path):
        return out
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                x = json.loads(line)
                if isinstance(x, dict):
                    out.append(x)
            except Exception:
                pass
    return out

def parse_issue_form(body):
    result = {}
    key = None
    buf = []

    def flush():
        nonlocal key, buf
        if key:
            value = " ".join(x for x in buf if x and x != "_No response_").strip()
            result[key] = value
        buf = []

    for line in str(body or "").splitlines():
        m = re.match(r"^###\s+(.+?)\s*$", line)
        if m:
            flush()
            key = re.sub(r"\s+", "_", m.group(1).strip().lower())
            continue
        if key and line.strip():
            buf.append(line.strip())
    flush()
    return result

def pick(mapping, *keys):
    for k in keys:
        v = mapping.get(k)
        if v:
            return v
    return ""

def compile_claims(issue_rows, existing_people):
    people = []
    seen = set()

    for p in existing_people:
        if not isinstance(p, dict):
            continue
        key = ("local", p.get("id") or p.get("github") or p.get("display_name"))
        if key in seen:
            continue
        seen.add(key)
        q = dict(p)
        q.setdefault("source", "people.json")
        people.append(q)

    for issue in issue_rows:
        if issue.get("pull_request"):
            continue
        if not str(issue.get("title", "")).startswith("[PROFILE CLAIM]"):
            continue

        form = parse_issue_form(issue.get("body", ""))
        login = ((issue.get("user") or {}).get("login") or "").strip()
        number = issue.get("number")
        key = ("github", number)
        if key in seen:
            continue
        seen.add(key)

        people.append({
            "id": f"GITHUB-CLAIM-{number}",
            "source": "github-issue",
            "claim_state": "UNVERIFIED_GITHUB_CLAIM",
            "github": login,
            "display_name": pick(form, "anzeigename"),
            "birthday": pick(form, "geburtstag_-_öffentlich,_optional", "geburtstag_öffentlich_optional", "geburtstag"),
            "city": pick(form, "ort_-_öffentlich,_optional", "ort_öffentlich_optional", "ort", "stadt"),
            "school": pick(form, "schule_-_öffentlich,_optional", "schule_öffentlich_optional", "schule"),
            "nickname": pick(form, "alter_nickname_(optional)", "alter_nickname_optional", "alter_nickname"),
            "years": pick(form, "vz-zeit_(optional)", "vz_zeit_optional", "vz-zeit", "vz_zeit"),
            "historic_url": pick(form, "deine_eigene_alte_profil-url_(optional)", "deine_eigene_alte_profil-url_optional"),
            "issue_number": number,
            "issue_url": issue.get("html_url"),
            "created_at": issue.get("created_at"),
        })

    return people

def normalized_census(root, docs):
    data = os.path.join(root, "data")
    census = read_json(os.path.join(data, "archaeology-cdx-census.json"), [])
    if not census:
        census = read_json(os.path.join(data, "archive-index.json"), [])
    out = []
    for x in census:
        if not isinstance(x, dict):
            continue
        original = x.get("original") or x.get("canonical")
        if not original:
            continue
        q = dict(x)
        q["canonical"] = q.get("canonical") or canonical_url(original)
        q["route_pattern"] = q.get("route_pattern") or route_pattern(original)
        q["class"] = q.get("class") or classify(original)
        out.append(q)

    if not out:
        for d in docs:
            original = d.get("original") or d.get("canonical")
            if not original:
                continue
            out.append({
                "timestamp": d.get("timestamp"),
                "original": original,
                "canonical": canonical_url(original),
                "route_pattern": d.get("route_pattern") or route_pattern(original),
                "class": d.get("class") or classify(original),
                "mimetype": "text/html",
                "digest": d.get("digest"),
            })
    return out

def import_legacy_docs(root, docs):
    data = os.path.join(root, "data")
    legacy = read_json(os.path.join(data, "archive-index.json"), [])
    existing = {(d.get("timestamp"), d.get("original")) for d in docs}

    for x in legacy:
        if not isinstance(x, dict):
            continue
        key = (x.get("timestamp"), x.get("original"))
        if key in existing:
            continue
        original = x.get("original") or ""
        docs.append({
            "timestamp": x.get("timestamp"),
            "original": original,
            "canonical": canonical_url(original),
            "route_pattern": route_pattern(original) if original else "/",
            "class": classify(original) if original else "unknown",
            "title": x.get("title"),
            "text": x.get("text", ""),
            "links": [],
            "local_file": x.get("local_file"),
            "capture_url": x.get("capture_url"),
            "digest": x.get("digest"),
            "source": "LEGACY_IMPORT",
            "ingest_state": x.get("ingest_state"),
        })
        existing.add(key)
    return docs

def sense(census, docs):
    route_counts = collections.Counter(x.get("route_pattern") for x in census)
    class_counts = collections.Counter(x.get("class") for x in census)
    years = collections.Counter(
        str(x.get("timestamp") or "")[:4]
        for x in census
        if str(x.get("timestamp") or "")[:4].isdigit()
    )
    done = {d.get("canonical") for d in docs if d.get("local_file")}
    failures = sum(1 for d in docs if d.get("ingest_state") == "FETCH_ERROR")

    return {
        "census_rows": len(census),
        "unique_urls": len({x.get("canonical") for x in census if x.get("canonical")}),
        "bundled_canonical": len(done),
        "docs": len(docs),
        "fetch_errors": failures,
        "route_patterns": len(route_counts),
        "classes": dict(class_counts),
        "years": dict(sorted(years.items())),
        "route_counts": route_counts,
    }

def frontier_score(row, perception, round_no):
    cls = row.get("class")
    route = row.get("route_pattern")
    ts = str(row.get("timestamp") or "")
    year = ts[:4] if ts[:4].isdigit() else None

    base = {
        "institutional": 100.0,
        "public-other": 70.0,
        "shell": 45.0,
        "robots": -250.0,
        "asset": -500.0,
        "personal-route": -1000.0,
    }.get(cls, 20.0)

    count = max(1, perception["route_counts"].get(route, 1))
    novelty = 45.0 / math.log2(count + 2)

    # Four rounds deliberately optimize different information dimensions.
    if round_no == 1:
        # rare, content-bearing routes
        mode = novelty * 1.7
    elif round_no == 2:
        # temporal diversity, especially underrepresented years
        yc = perception["years"].get(year, 0) if year else 0
        mode = 40.0 / math.log2(yc + 2)
    elif round_no == 3:
        # institutional and public-other route breadth
        mode = 25.0 if cls in {"institutional","public-other"} else 0.0
    else:
        # mop-up best remaining non-robot public pages
        mode = novelty

    return base + novelty + mode

def choose_frontier(census, docs, perception, round_no, limit):
    done = {d.get("canonical") for d in docs if d.get("local_file")}
    attempted = {
        (d.get("timestamp"), d.get("canonical"))
        for d in docs
        if d.get("source") == "PRESTIGE_FRONTIER"
    }

    scored = []
    for x in census:
        cls = x.get("class")
        if cls in {"personal-route", "asset", "robots"}:
            continue
        mime = str(x.get("mimetype") or "")
        if mime and not mime.startswith(("text/html","text/plain","application/xhtml")):
            continue
        if x.get("canonical") in done:
            continue
        if (x.get("timestamp"), x.get("canonical")) in attempted:
            continue
        scored.append((frontier_score(x, perception, round_no), x))

    scored.sort(
        key=lambda item: (
            -item[0],
            str(item[1].get("timestamp") or ""),
            str(item[1].get("canonical") or ""),
        )
    )
    return [x for _, x in scored[:limit]]

def fetch_frontier(root, docs, candidates, round_no, sleep_seconds):
    expanded = os.path.join(root, "archive", "prestige")
    ensure_dir(expanded)

    added = 0
    errors = 0

    for idx, x in enumerate(candidates, 1):
        ts = x.get("timestamp")
        original = x.get("original")
        if not ts or not original:
            continue

        replay = f"https://web.archive.org/web/{ts}id_/{original}"
        try:
            _, headers, body = fetch(replay, timeout=60, attempts=3, base_delay=2.0)
            raw = decode_body(headers, body)
            parsed = parse_page(raw, original)
            safe = sanitize_html(raw, replay)

            key = sha256_text(f"{ts}|{original}|{x.get('digest') or ''}")[:24]
            rel = f"archive/prestige/{key}.html"
            with open(os.path.join(root, rel), "w", encoding="utf-8") as f:
                f.write(safe)

            docs.append({
                **x,
                "title": parsed["title"] or original,
                "text": parsed["text"],
                "links": parsed["links"],
                "local_file": rel,
                "capture_url": replay,
                "source": "PRESTIGE_FRONTIER",
                "prestige_round": round_no,
                "ingest_state": "BUNDLED_PUBLIC",
            })
            added += 1
        except Exception as e:
            docs.append({
                **x,
                "title": None,
                "text": "",
                "links": [],
                "local_file": None,
                "capture_url": replay,
                "source": "PRESTIGE_FRONTIER",
                "prestige_round": round_no,
                "ingest_state": "FETCH_ERROR",
                "error": str(e)[:300],
            })
            errors += 1

        if idx % 10 == 0 or idx == len(candidates):
            print(f"      round {round_no}: {idx}/{len(candidates)} attempted, +{added} bundled, {errors} errors")
        time.sleep(sleep_seconds)

    return docs, added, errors

def dedupe_docs(docs):
    best = {}
    for d in docs:
        key = (d.get("timestamp"), d.get("original"))
        old = best.get(key)
        if old is None:
            best[key] = d
            continue
        if not old.get("local_file") and d.get("local_file"):
            best[key] = d
            continue
        if old.get("local_file") == d.get("local_file") and len(d.get("text","")) > len(old.get("text","")):
            best[key] = d

    rows = list(best.values())
    rows.sort(key=lambda x: (x.get("timestamp") or "", x.get("canonical") or ""))
    return rows

def build_route_graph(census, docs):
    route_counts = collections.Counter((x.get("route_pattern"), x.get("class")) for x in census)
    nodes = []
    edges = []

    nodes.append({"id":"ROOT","kind":"root","label":"schuelerVZ"})

    for idx, ((pattern, cls), count) in enumerate(route_counts.most_common(500)):
        rid = "R:" + sha256_text(f"{cls}|{pattern}")[:14]
        nodes.append({
            "id": rid, "kind":"route", "label": pattern or "/",
            "class": cls, "count": count,
        })
        edges.append({"from":"ROOT","to":rid,"kind":"contains"})

    route_id = {
        (n.get("label"), n.get("class")): n["id"]
        for n in nodes if n.get("kind") == "route"
    }

    for d in docs:
        if not d.get("local_file") or d.get("class") == "personal-route":
            continue
        did = "D:" + sha256_text(f"{d.get('timestamp')}|{d.get('canonical')}")[:14]
        nodes.append({
            "id": did,
            "kind":"document",
            "label": d.get("title") or d.get("canonical"),
            "timestamp": d.get("timestamp"),
            "canonical": d.get("canonical"),
            "local_file": d.get("local_file"),
        })
        rid = route_id.get((d.get("route_pattern"), d.get("class")))
        if rid:
            edges.append({"from":rid,"to":did,"kind":"capture"})

    # Link relations only between public non-personal canonical URLs.
    doc_by_can = {
        d.get("canonical"): d
        for d in docs
        if d.get("local_file") and d.get("class") != "personal-route"
    }
    for d in docs:
        if not d.get("local_file") or d.get("class") == "personal-route":
            continue
        source_id = "D:" + sha256_text(f"{d.get('timestamp')}|{d.get('canonical')}")[:14]
        for link in (d.get("links") or [])[:80]:
            target = doc_by_can.get(link)
            if not target:
                continue
            target_id = "D:" + sha256_text(f"{target.get('timestamp')}|{target.get('canonical')}")[:14]
            if source_id != target_id:
                edges.append({"from":source_id,"to":target_id,"kind":"link"})

    return {"nodes":nodes[:5000], "edges":edges[:15000]}

def build_search(docs, people):
    rows = []
    seen_can = set()

    # one searchable representative per canonical public page
    public_docs = [
        d for d in docs
        if d.get("class") != "personal-route" and d.get("canonical")
    ]
    public_docs.sort(
        key=lambda d: (
            d.get("canonical"),
            0 if d.get("local_file") else 1,
            -(len(d.get("text") or "")),
        )
    )
    for d in public_docs:
        can = d.get("canonical")
        if can in seen_can:
            continue
        seen_can.add(can)
        rows.append({
            "id":"A:"+sha256_text(can)[:16],
            "type":"archive",
            "title":d.get("title") or can,
            "text":(d.get("text") or "")[:12000],
            "canonical":can,
            "route_pattern":d.get("route_pattern"),
            "class":d.get("class"),
            "timestamp":d.get("timestamp"),
            "local_file":d.get("local_file"),
            "source":d.get("source"),
        })

    for p in people:
        rows.append({
            "id":"P:"+sha256_text(str(p.get("id") or p.get("github") or p.get("display_name")))[:16],
            "type":"profile",
            "title":p.get("display_name") or p.get("github") or "Profile",
            "text":" ".join(
                str(v) for v in [
                    p.get("display_name"), p.get("github"), p.get("birthday"),
                    p.get("city"), p.get("school"), p.get("nickname"),
                    p.get("years"), p.get("status")
                ] if v
            ),
            "profile":p,
        })
    return rows

def integrity(root, tracked_files):
    out = {}
    for rel in tracked_files:
        path = os.path.join(root, rel)
        if os.path.exists(path):
            out[rel] = {
                "sha256": sha256_file(path),
                "bytes": os.path.getsize(path),
            }
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--site-root", required=True)
    ap.add_argument("--issues-ndjson")
    ap.add_argument("--rounds", type=int, default=4)
    ap.add_argument("--fetch-per-round", type=int, default=60)
    ap.add_argument("--sleep", type=float, default=.12)
    ap.add_argument("--compile-only", action="store_true")
    args = ap.parse_args()

    root = os.path.abspath(args.site_root)
    data = os.path.join(root, "data")
    ensure_dir(data)

    docs_path = os.path.join(data, "archaeology-docs.json")
    docs = read_json(docs_path, [])
    docs = import_legacy_docs(root, docs)
    census = normalized_census(root, docs)

    existing_people = read_json(os.path.join(data, "people.json"), [])
    issues = load_issues_ndjson(args.issues_ndjson) if args.issues_ndjson else []
    people = compile_claims(issues, existing_people)

    baseline = sense(census, docs)
    run = {
        "schema":"HALVETH_PRESTIGE_FOUR_RUN",
        "version":VERSION,
        "started_at":utcnow(),
        "baseline":{
            k:v for k,v in baseline.items() if k != "route_counts"
        },
        "rounds":[],
    }

    print("="*70)
    print(" PRESTIGE FOUR // FOUR STEPS FORWARD")
    print("="*70)

    if args.compile_only:
        print("[RESUME] COMPILE-ONLY: preserve fetched frontier, skip new downloads.")
        docs = dedupe_docs(docs)
        write_json(docs_path, docs)
        after = sense(census, docs)
        run["rounds"].append({
            "round":0,
            "label":"RESUME_COMPILE_ONLY",
            "candidates":0,
            "bundled_added":0,
            "errors":0,
            "after":{
                k:v for k,v in after.items() if k != "route_counts"
            },
        })
    else:
        max_rounds = min(max(1, args.rounds), 4)
        for round_no in range(1, max_rounds + 1):
            perception = sense(census, docs)
            candidates = choose_frontier(
                census, docs, perception, round_no, max(0, args.fetch_per_round)
            )

            label = {
                1:"RARE ROUTE ENTROPY",
                2:"TEMPORAL GAPS",
                3:"PUBLIC ROUTE BREADTH",
                4:"BEST REMAINING FRONTIER",
            }.get(round_no, "FRONTIER")

            print(f"[PRESTIGE {round_no}/4] {label}")
            print(f"      candidates: {len(candidates)}")

            docs, added, errors = fetch_frontier(
                root, docs, candidates, round_no, args.sleep
            )
            docs = dedupe_docs(docs)
            write_json(docs_path, docs)

            after = sense(census, docs)
            run["rounds"].append({
                "round":round_no,
                "label":label,
                "candidates":len(candidates),
                "bundled_added":added,
                "errors":errors,
                "after":{
                    k:v for k,v in after.items() if k != "route_counts"
                },
            })

    # Relation and search compilation after all four frontier passes.
    graph = build_route_graph(census, docs)
    search = build_search(docs, people)

    write_json(os.path.join(data, "prestige-graph.json"), graph)
    write_json(os.path.join(data, "prestige-search.json"), search)
    write_json(os.path.join(data, "prestige-people.json"), people, pretty=True)

    personal = [
        {
            "url_sha256":sha256_text(x.get("canonical") or x.get("original") or ""),
            "route_pattern":x.get("route_pattern"),
            "timestamp":x.get("timestamp"),
            "state":"PERSONAL_ROUTE_METADATA_ONLY",
        }
        for x in census if x.get("class") == "personal-route"
    ]
    write_json(os.path.join(data, "prestige-personal-route-meta.json"), personal)

    final = sense(census, docs)
    manifest = {
        "schema":"HALVETH_PRESTIGE_FOUR_MANIFEST",
        "version":VERSION,
        "generated_at":utcnow(),
        "census_rows":final["census_rows"],
        "unique_urls":final["unique_urls"],
        "docs":final["docs"],
        "bundled_canonical":final["bundled_canonical"],
        "fetch_errors":final["fetch_errors"],
        "route_patterns":final["route_patterns"],
        "people_searchable":len(people),
        "github_claims":sum(1 for p in people if p.get("claim_state")=="UNVERIFIED_GITHUB_CLAIM"),
        "search_rows":len(search),
        "graph_nodes":len(graph["nodes"]),
        "graph_edges":len(graph["edges"]),
        "personal_route_metadata_rows":len(personal),
        "delta_bundled_canonical":final["bundled_canonical"] - baseline["bundled_canonical"],
        "invariants":[
            "PERSONAL_ROUTE_METADATA_ONLY_BY_DEFAULT",
            "NO_BULK_LEAKED_PROFILE_REPUBLICATION",
            "VOLUNTARY_GITHUB_CLAIMS_ARE_SEARCHABLE",
            "GITHUB_CLAIM != HISTORIC_IDENTITY_PROOF",
            "UNKNOWN != FALSE",
            "ARCHIVE_RECORD != CURRENT_PERSON",
        ],
    }

    write_json(os.path.join(data, "prestige-manifest.json"), manifest, pretty=True)

    tracked = [
        "data/archaeology-docs.json",
        "data/prestige-search.json",
        "data/prestige-graph.json",
        "data/prestige-people.json",
        "data/prestige-personal-route-meta.json",
        "data/prestige-manifest.json",
    ]
    receipt = {
        "generated_at":utcnow(),
        "version":VERSION,
        "files":integrity(root, tracked),
    }
    write_json(os.path.join(data, "prestige-integrity.json"), receipt, pretty=True)

    run["finished_at"] = utcnow()
    run["final"] = manifest
    history_path = os.path.join(data, "prestige-history.json")
    history = read_json(history_path, [])
    if not isinstance(history, list):
        history = []
    history.append(run)
    write_json(history_path, history[-30:], pretty=True)

    print("="*70)
    print(" PRESTIGE FOUR COMPLETE")
    print("="*70)
    print(json.dumps(manifest, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
