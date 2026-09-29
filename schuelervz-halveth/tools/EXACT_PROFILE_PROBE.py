#!/usr/bin/env python3
"""
Exact owner-supplied profile probe.
No enumeration. No password. One exact URL in, one archive availability receipt out.
"""
import argparse, datetime as dt, hashlib, json, os, re
from urllib.parse import urlencode
from urllib.request import Request, urlopen

UA="HALVETH-owner-profile-probe/1.0"

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--url",required=True)
    ap.add_argument("--site-root",required=True)
    args=ap.parse_args()
    if not re.match(r"^https?://",args.url,re.I):
        raise SystemExit("Exact http(s) profile URL required.")
    api="https://archive.org/wayback/available?"+urlencode({"url":args.url})
    req=Request(api,headers={"User-Agent":UA})
    with urlopen(req,timeout=30) as r:
        j=json.loads(r.read().decode("utf-8"))
    c=((j.get("archived_snapshots") or {}).get("closest") or {})
    receipt={
        "checked_at_utc":dt.datetime.now(dt.timezone.utc).isoformat(),
        "exact_url_sha256":hashlib.sha256(args.url.encode()).hexdigest(),
        "available":bool(c.get("available")),
        "timestamp":c.get("timestamp"),
        "status":c.get("status"),
        "archive_url":c.get("url"),
        "state":"OWNER_SUPPLIED_EXACT_URL_NOT_IDENTITY_VERIFIED",
    }
    out=os.path.join(os.path.abspath(args.site_root),"data","owner-profile-probes.json")
    try:
        old=json.load(open(out,"r",encoding="utf-8"))
        if not isinstance(old,list): old=[]
    except Exception:
        old=[]
    old.append(receipt)
    os.makedirs(os.path.dirname(out),exist_ok=True)
    json.dump(old[-100:],open(out,"w",encoding="utf-8"),ensure_ascii=False,indent=2)
    print(json.dumps(receipt,ensure_ascii=False,indent=2))

if __name__=="__main__":
    main()
