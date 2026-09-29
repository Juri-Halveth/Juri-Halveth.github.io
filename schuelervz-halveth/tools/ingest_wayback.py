#!/usr/bin/env python3
import argparse
import json
import os
import re
import time
import hashlib
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from html.parser import HTMLParser

TARGETS = [
    "http://www.schuelervz.net/",
    "http://schuelervz.net/",
    "http://www.schuelervz.net/robots.txt",
    "http://www.schuelervz.net/l/press*",
    "http://www.schuelervz.net/l/security*",
    "http://www.schuelervz.net/l/about_us*",
]

BLOCK = re.compile(r"/(profile|person|user|photo|album|message|friends?|pinnwand|wall)/", re.I)
UA = "HALVETH-schuelerVZ-public-archive-reconstruction/1.1"
RETRY_CODES = {429, 500, 502, 503, 504}

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.skip = 0
        self.parts = []
        self.title = []
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style", "noscript", "iframe", "object", "embed"}:
            self.skip += 1
        if tag == "title":
            self.in_title = True

    def handle_endtag(self, tag):
        if tag in {"script", "style", "noscript", "iframe", "object", "embed"} and self.skip:
            self.skip -= 1
        if tag == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.skip:
            return
        t = " ".join(data.split())
        if not t:
            return
        self.parts.append(t)
        if self.in_title:
            self.title.append(t)

def get(url, timeout=60, attempts=5, base_delay=3.0):
    last = None
    for attempt in range(1, attempts + 1):
        try:
            req = Request(url, headers={
                "User-Agent": UA,
                "Accept": "*/*",
                "Cache-Control": "no-cache",
            })
            with urlopen(req, timeout=timeout) as r:
                return r.status, r.headers, r.read()
        except HTTPError as e:
            last = e
            if e.code not in RETRY_CODES or attempt >= attempts:
                raise
            wait = min(base_delay * (2 ** (attempt - 1)), 30)
            print(f"RETRY HTTP {e.code} in {wait:.0f}s :: {url[:100]}")
            time.sleep(wait)
        except URLError as e:
            last = e
            if attempt >= attempts:
                raise
            wait = min(base_delay * (2 ** (attempt - 1)), 30)
            print(f"RETRY NETWORK in {wait:.0f}s :: {url[:100]}")
            time.sleep(wait)
    raise last

def strip_active_html(s):
    s = re.sub(r"(?is)<script\b.*?</script>", "", s)
    s = re.sub(r"(?is)<noscript\b.*?</noscript>", "", s)
    s = re.sub(r"(?is)<iframe\b.*?</iframe>", "", s)
    s = re.sub(r"(?is)<object\b.*?</object>", "", s)
    s = re.sub(r"(?is)<embed\b[^>]*>", "", s)
    s = re.sub(r"(?is)<form\b.*?</form>", "", s)
    s = re.sub(r"(?i)\s+on[a-z]+\s*=\s*(\".*?\"|'.*?'|[^\s>]+)", "", s)
    return s

def inject_head(s, replay_base):
    insert = (
        '<meta http-equiv="Content-Security-Policy" content="default-src \'self\' '
        'https://web.archive.org https://*.archive.org data:; script-src \'none\'; '
        'object-src \'none\'; form-action \'none\'; style-src \'self\' \'unsafe-inline\' '
        'https://web.archive.org https://*.archive.org; img-src \'self\' data: '
        'https://web.archive.org https://*.archive.org;">'
        f'<base href="{replay_base}">'
    )
    m = re.search(r"(?i)<head[^>]*>", s)
    if m:
        return s[:m.end()] + insert + s[m.end():]
    return insert + s

def load_existing(path):
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            x = json.load(f)
        return x if isinstance(x, list) else []
    except Exception:
        return []

def save(path, rows):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, path)

def availability_fallback(original):
    q = urlencode({"url": original})
    url = "https://archive.org/wayback/available?" + q
    try:
        status, headers, body = get(url, attempts=3)
        if status != 200:
            return None
        j = json.loads(body.decode("utf-8"))
        c = (((j or {}).get("archived_snapshots") or {}).get("closest") or {})
        if not c.get("available"):
            return None
        u = c.get("url") or ""
        m = re.search(r"/web/(\d{14})/", u)
        ts = m.group(1) if m else None
        return {
            "timestamp": ts,
            "original": original,
            "statuscode": str(c.get("status") or "200"),
            "mimetype": "text/html",
            "digest": None,
            "capture_url": u,
            "ingest_state": "AVAILABILITY_FALLBACK",
        }
    except Exception:
        return None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--site-root", required=True)
    ap.add_argument("--delay", type=float, default=0.30)
    ap.add_argument("--max-captures", type=int, default=1200)
    args = ap.parse_args()

    root = os.path.abspath(args.site_root)
    pages = os.path.join(root, "archive", "pages")
    data_path = os.path.join(root, "data", "archive-index.json")
    os.makedirs(pages, exist_ok=True)
    os.makedirs(os.path.dirname(data_path), exist_ok=True)

    previous = load_existing(data_path)
    rows = []
    cdx_failures = []

    for target in TARGETS:
        q = urlencode({
            "url": target,
            "output": "json",
            "fl": "timestamp,original,statuscode,mimetype,digest",
            "filter": "statuscode:200",
            "collapse": "digest",
            "limit": "1200",
        })
        cdx_url = "https://web.archive.org/cdx/search/cdx?" + q
        try:
            status, headers, body = get(cdx_url, attempts=5, base_delay=4.0)
            if status != 200:
                raise RuntimeError(f"CDX HTTP {status}")
            j = json.loads(body.decode("utf-8"))
            if len(j) < 2:
                continue
            hdr = j[0]
            for vals in j[1:]:
                x = dict(zip(hdr, vals))
                if not BLOCK.search(x.get("original", "")):
                    rows.append(x)
            print("CDX OK:", target)
        except Exception as e:
            cdx_failures.append({"target": target, "error": str(e)[:300]})
            print("CDX WARN:", target, "::", str(e)[:160])

    if not rows:
        # Try a tiny availability fallback for the two fixed public shell URLs.
        for original in [
            "http://www.schuelervz.net/",
            "http://schuelervz.net/",
            "http://www.schuelervz.net/robots.txt",
        ]:
            x = availability_fallback(original)
            if x:
                rows.append(x)

    if not rows:
        if previous:
            print("ARCHIVE NETWORK UNAVAILABLE -> preserving existing local index:", len(previous))
            return 0
        print("ARCHIVE NETWORK UNAVAILABLE -> no local index yet; leaving empty bootstrap index.")
        save(data_path, [])
        return 0

    uniq = {}
    for x in rows:
        key = (x.get("original"), x.get("digest") or x.get("timestamp"))
        uniq[key] = x
    rows = sorted(uniq.values(), key=lambda x: (x.get("timestamp") or "", x.get("original") or ""))
    rows = rows[:max(1, args.max_captures)]

    out = []
    bundled = 0

    for idx, x in enumerate(rows, 1):
        ts = x.get("timestamp")
        original = x.get("original")
        replay = x.get("capture_url") or (f"https://web.archive.org/web/{ts}id_/{original}" if ts else None)

        if not replay:
            out.append({**x, "local_file": None, "ingest_state": "METADATA_ONLY"})
            continue

        try:
            status, headers, body = get(replay, attempts=3, base_delay=2.5)
            if status != 200:
                raise RuntimeError(f"HTTP {status}")

            ctype = headers.get("Content-Type", "")
            enc = "utf-8"
            m = re.search(r"charset=([\w.-]+)", ctype, re.I)
            if m:
                enc = m.group(1)
            try:
                html = body.decode(enc, errors="replace")
            except Exception:
                html = body.decode("utf-8", errors="replace")

            clean = strip_active_html(html)
            clean = inject_head(clean, replay)

            parser = TextExtractor()
            parser.feed(clean)
            title = " ".join(parser.title)[:300] or original
            text = re.sub(r"\s+", " ", " ".join(parser.parts))[:120000]

            key = hashlib.sha256(((ts or "") + "|" + original + "|" + str(x.get("digest") or "")).encode()).hexdigest()[:24]
            rel = f"archive/pages/{key}.html"
            with open(os.path.join(root, rel), "w", encoding="utf-8") as f:
                f.write(clean)

            p = urlparse(original).path.lower()
            cat = (
                "security" if "/l/security" in p else
                "press" if "/l/press" in p else
                "robots" if "robots.txt" in p else
                "about" if "/l/about" in p else
                "root"
            )

            out.append({
                **x,
                "category": cat,
                "title": title,
                "text": text,
                "local_file": rel,
                "capture_url": replay,
                "ingest_state": "BUNDLED_PUBLIC_SHELL",
            })
            bundled += 1
            if idx % 25 == 0:
                print(f"BUNDLED {bundled}/{idx}")
            time.sleep(args.delay)

        except Exception as e:
            out.append({
                **x,
                "title": None,
                "text": None,
                "local_file": None,
                "capture_url": replay,
                "ingest_state": "FETCH_ERROR",
                "error": str(e)[:300],
            })

    save(data_path, out)
    print("archive_index_rows =", len(out))
    print("bundled_pages      =", bundled)
    if cdx_failures:
        print("cdx_failures       =", len(cdx_failures))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
