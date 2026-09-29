#!/usr/bin/env python3
import argparse, json, os, re, hashlib
from collections import Counter

def load(path, fallback):
    if not os.path.exists(path):
        return fallback
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return fallback

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--site-root",required=True)
    args=ap.parse_args()
    root=os.path.abspath(args.site_root)
    data=os.path.join(root,"data")

    archive=load(os.path.join(data,"archive-index.json"),[])
    people=load(os.path.join(data,"people.json"),[])
    routes=load(os.path.join(data,"route-templates.json"),[])
    timeline=[
      ["2007","PLATFORM","schülerVZ startet"],
      ["2008","PLATFORM","öffentliche Shell-Seiten im Archiv"],
      ["2009","SECURITY","mehrere großflächige automatisierte Datensammlungen werden öffentlich bekannt"],
      ["2010","SECURITY","weitere Crawler-Berichte / Gegenmaßnahmen"],
      ["2012","CORPORATE","Poolworks / Devbliss"],
      ["2013","SHUTDOWN","schülerVZ wird abgeschaltet"],
      ["2020","RELAUNCH","VZ.net / zeitlich begrenzter Alt-Datenimport"],
      ["2026","RECONSTRUCTION","HALVETH // MYCELIUM"],
    ]

    rows=[]
    for i,x in enumerate(archive):
        rows.append({
            "id":f"a:{i}",
            "type":"archive",
            "title":x.get("title") or x.get("original") or "Archive",
            "text":" ".join(str(v) for v in [x.get("text"),x.get("original"),x.get("category"),x.get("timestamp"),x.get("digest")] if v),
            "category":x.get("category") or "archive",
            "timestamp":x.get("timestamp"),
            "original":x.get("original"),
            "local_file":x.get("local_file"),
            "ingest_state":x.get("ingest_state"),
        })
    for i,x in enumerate(people):
        rows.append({
            "id":f"p:{i}","type":"profile","title":x.get("display_name") or x.get("github") or x.get("id"),
            "text":" ".join(str(v) for v in [x.get("display_name"),x.get("github"),x.get("school"),x.get("status"),x.get("historic_profile_id"),x.get("historic_profile_url")] if v),
            "profile":x
        })
    for i,x in enumerate(routes):
        rows.append({"id":f"r:{i}","type":"route","title":x.get("route"),"text":" ".join(str(v) for v in x.values() if v),"route":x})
    for i,x in enumerate(timeline):
        rows.append({"id":f"t:{i}","type":"timeline","title":x[0]+" · "+x[1],"text":" ".join(x),"timeline":x})

    with open(os.path.join(data,"search-index.json"),"w",encoding="utf-8") as f:
        json.dump(rows,f,ensure_ascii=False,separators=(",",":"))

    by_cat=Counter((x.get("category") or "archive") for x in archive)
    by_year=Counter(str(x.get("timestamp") or "")[:4] for x in archive if str(x.get("timestamp") or "")[:4].isdigit())
    quality={
      "archive_rows":len(archive),
      "bundled_pages":sum(1 for x in archive if x.get("local_file")),
      "fetch_errors":sum(1 for x in archive if x.get("ingest_state")=="FETCH_ERROR"),
      "people":len(people),
      "route_templates":len(routes),
      "search_rows":len(rows),
      "categories":dict(by_cat),
      "years":dict(sorted(by_year.items())),
      "sha256_archive_index":None,
    }
    apath=os.path.join(data,"archive-index.json")
    if os.path.exists(apath):
        quality["sha256_archive_index"]=hashlib.sha256(open(apath,"rb").read()).hexdigest()
    with open(os.path.join(data,"quality.json"),"w",encoding="utf-8") as f:
        json.dump(quality,f,ensure_ascii=False,indent=2)

    print(json.dumps(quality,ensure_ascii=False,indent=2))

if __name__=="__main__":
    main()
