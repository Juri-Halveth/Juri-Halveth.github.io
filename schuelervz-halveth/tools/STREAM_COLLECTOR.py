import os
import re
import json
import time
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "stream"
DATA.mkdir(parents=True, exist_ok=True)

TOKEN = os.environ.get("GH_TOKEN", "")

UA = "HALVETH-schuelerVZ-stream/1.0"

PERSONAL = re.compile(
    r"/(?:Profile|Friends|Friend|Pinboard|Messages?|"
    r"Photo|Photos|Album|Albums|User|Users|Person|People)"
    r"(?:/|$)",
    re.I
)

PLATFORM_ASSET = re.compile(
    r"/(?:css|js|images?|img|static|assets?|icons?|games?|apps?)/",
    re.I
)

FEATURES = {
    "profile": re.compile(r"/Profile/", re.I),
    "friends": re.compile(r"/Friends/", re.I),
    "pinboard": re.compile(r"/Pinboard/", re.I),
    "messages": re.compile(r"/Messages?/", re.I),
    "groups": re.compile(r"/Groups?/", re.I),
    "photos": re.compile(r"/(?:Photo|Photos|Album|Albums)/", re.I),
    "games": re.compile(r"/(?:Game|Games|App|Apps)/", re.I),
    "gruscheln": re.compile(r"Gruschel", re.I),
}

def fetch_json(url, attempts=5):
    last = None

    for n in range(attempts):
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": UA}
            )

            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(
                    r.read().decode("utf-8", "replace")
                )

        except Exception as e:
            last = e
            time.sleep(min(2 ** n, 12))

    raise last


def github_search(query):

    params = urllib.parse.urlencode({
        "q": query,
        "per_page": 100
    })

    req = urllib.request.Request(
        "https://api.github.com/search/code?" + params,
        headers={
            "User-Agent": UA,
            "Accept": "application/vnd.github+json",
            "Authorization": "Bearer " + TOKEN,
            "X-GitHub-Api-Version": "2022-11-28",
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            data = json.loads(
                r.read().decode("utf-8", "replace")
            )
    except Exception as e:
        return {
            "query": query,
            "error": str(e),
            "results": []
        }

    results = []

    for item in data.get("items", []):

        repo = item.get("repository") or {}

        results.append({
            "repository": repo.get("full_name"),
            "path": item.get("path"),
            "url": item.get("html_url"),
            "repository_url": repo.get("html_url"),
        })

    return {
        "query": query,
        "results": results
    }


print("==========================================================")
print(" HALVETH STREAM COLLECTOR")
print("==========================================================")


# ============================================================
# 1. WHOLE-DOMAIN WAYBACK CENSUS
# ============================================================

print("[1/4] WAYBACK PUBLIC CENSUS")

params = urllib.parse.urlencode({
    "url": "schuelervz.net/*",
    "matchType": "domain",
    "output": "json",
    "fl": "timestamp,original,statuscode,mimetype,digest",
    "filter": "statuscode:200",
    "collapse": "urlkey",
    "limit": "20000"
})

cdx_url = (
    "https://web.archive.org/cdx/search/cdx?"
    + params
)

try:
    raw = fetch_json(cdx_url)
except Exception as e:
    raw = []
    print("CDX ERROR:", repr(e))


rows = []

if raw and isinstance(raw, list):

    header = raw[0]

    for values in raw[1:]:

        row = dict(zip(header, values))

        url = row.get("original", "")

        try:
            path = urllib.parse.urlsplit(url).path
        except:
            path = ""

        feature = "other"

        for name, rx in FEATURES.items():
            if rx.search(path):
                feature = name
                break

        if PERSONAL.search(path):

            # Preserve structural archaeology without creating a
            # searchable historical people dump.
            parts = [
                p for p in path.split("/")
                if p
            ]

            pattern = []

            for p in parts:

                if p.isdigit():
                    pattern.append("<N>")

                elif len(p) >= 8:
                    pattern.append("<ID>")

                else:
                    pattern.append(p)

            rows.append({
                "timestamp": row.get("timestamp"),
                "route_pattern": "/" + "/".join(pattern),
                "feature": feature,
                "state": "PERSONAL_ROUTE_METADATA"
            })

        else:

            rows.append({
                "timestamp": row.get("timestamp"),
                "url": url,
                "mimetype": row.get("mimetype"),
                "feature": feature,
                "platform_asset": bool(
                    PLATFORM_ASSET.search(path)
                ),
                "state": "PUBLIC_ARCHIVE"
            })


with open(
    DATA / "public-archive-census.json",
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        rows,
        f,
        ensure_ascii=False,
        separators=(",", ":")
    )


# ============================================================
# 2. ROUTE / FEATURE UNIVERSE
# ============================================================

print("[2/4] FEATURE UNIVERSE")

feature_counts = Counter(
    row.get("feature", "other")
    for row in rows
)

state_counts = Counter(
    row.get("state", "unknown")
    for row in rows
)

summary = {
    "archive_rows": len(rows),
    "features": dict(feature_counts),
    "states": dict(state_counts),
}


with open(
    DATA / "feature-universe.json",
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        summary,
        f,
        ensure_ascii=False,
        indent=2
    )


# ============================================================
# 3. GITHUB CODE ARCHAEOLOGY
# ============================================================

print("[3/4] GITHUB CODE ARCHAEOLOGY")

queries = [
    "schuelervz",
    '"Messages/WriteMessage"',
    '"Friends/Friends"',
    '"Pinboard/"',
    '"Profile/" schuelervz',
    '"Gruscheln"',
    '"Groups/" vz',
    '"schuelervz.net"',
    '"meinvz.net"',
    '"studivz.net"',
]

code = []

for q in queries:

    print("   SEARCH:", q)

    result = github_search(q)

    code.append(result)

    time.sleep(1)


with open(
    DATA / "code-fossils.json",
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        code,
        f,
        ensure_ascii=False,
        indent=2
    )


# ============================================================
# 4. MANIFEST
# ============================================================

print("[4/4] MANIFEST")

manifest = {
    "schema": "HALVETH_STREAM_UNIVERSE_1",
    "archive_rows": len(rows),
    "feature_counts": dict(feature_counts),
    "code_queries": len(code),
    "principle": [
        "PUBLIC_SOURCE -> PUBLIC_RECONSTRUCTION",
        "PERSONAL_ROUTE -> STRUCTURAL_METADATA",
        "OWNER_PRIVATE_DATA -> OWNER_VAULT",
        "UNKNOWN != FALSE",
        "SOURCE -> RECEIVE -> RELATE -> PRESERVE -> UPDATE",
    ]
}


with open(
    DATA / "manifest.json",
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        manifest,
        f,
        ensure_ascii=False,
        indent=2
    )


print("")
print(json.dumps(
    manifest,
    indent=2,
    ensure_ascii=False
))