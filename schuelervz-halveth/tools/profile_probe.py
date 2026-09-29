#!/usr/bin/env python3
"""
Exact-profile archaeology helper.

Accepts ONE exact historical URL. It never enumerates IDs.
It checks Internet Archive Availability API and emits a tiny JSON receipt.
"""
import argparse, json, urllib.parse, urllib.request, re, hashlib, datetime

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--url",required=True)
    ap.add_argument("--out")
    args=ap.parse_args()
    if not re.match(r"^https?://",args.url,re.I):
        raise SystemExit("Use an exact http(s) URL.")
    api="https://archive.org/wayback/available?"+urllib.parse.urlencode({"url":args.url})
    req=urllib.request.Request(api,headers={"User-Agent":"HALVETH-MYCELIUM-profile-archaeology/1.0"})
    with urllib.request.urlopen(req,timeout=30) as r:
        body=r.read()
    data=json.loads(body.decode("utf-8"))
    c=((data.get("archived_snapshots") or {}).get("closest") or {})
    receipt={
      "queried_url":args.url,
      "queried_url_sha256":hashlib.sha256(args.url.encode()).hexdigest(),
      "checked_at_utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
      "available":bool(c.get("available")),
      "timestamp":c.get("timestamp"),
      "status":c.get("status"),
      "archive_url":c.get("url"),
      "scope":"EXACT_URL_ONLY",
    }
    print(json.dumps(receipt,ensure_ascii=False,indent=2))
    if args.out:
        with open(args.out,"w",encoding="utf-8") as f:json.dump(receipt,f,ensure_ascii=False,indent=2)

if __name__=="__main__":
    main()
