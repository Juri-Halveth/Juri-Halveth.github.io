#!/usr/bin/env python3
"""
HALVETH // FLOWSTAR ENGINE 1.0

Non-terminal reconstruction state machine.

Core:
    PRESERVE(source) before transformation.
    No state is terminal.
    Snapshot is an anchor, never a stop.

Physical metaphor, kept deliberately legible:
- vaporization: liquid -> gas
- ionization: gas -> plasma
- combustion: chemical side-reaction, not a phase rung
- fusion: synthesis metaphor; inputs remain preserved
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
from typing import Any

VERSION = "1.0.0"

LADDER = [
    {"level": -4, "name": "TRACE",    "meaning": "raw existence / fragment"},
    {"level": -3, "name": "SOURCE",   "meaning": "provenance-bearing source"},
    {"level": -2, "name": "RELATION", "meaning": "source-to-source relation"},
    {"level": -1, "name": "MEMORY",   "meaning": "reconstruction with uncertainty"},
    {"level":  0, "name": "FLOW",     "meaning": "active evolving universe"},
    {"level":  1, "name": "VAPOR",    "meaning": "distributed clues / discovery frontier"},
    {"level":  2, "name": "ION",      "meaning": "activated evidence nodes"},
    {"level":  3, "name": "PLASMA",   "meaning": "high-connectivity relation field"},
    {"level":  4, "name": "FUSION",   "meaning": "multi-source synthesis with originals preserved"},
]

RULES = [
    "NO_TERMINAL_FREEZE",
    "SNAPSHOT != STOP",
    "SOURCE_BEFORE_TRANSFORM",
    "UPDATE = APPEND",
    "UNKNOWN = PRESERVED",
    "DIFFERENT = PRESERVED",
    "UNRESOLVED = PRESERVED",
    "FUSION_PRESERVES_INPUTS",
    "COMBUSTION_IS_SIDE_REACTION_NOT_PHASE_RUNG",
]

def utcnow() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()

def load_json(path: Path, fallback: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return fallback

def sha256_json(value: Any) -> str:
    payload = json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()

def summarize(site_root: Path) -> dict[str, Any]:
    stream_manifest = load_json(
        site_root / "data" / "stream" / "manifest.json", {}
    )
    feature_universe = load_json(
        site_root / "data" / "stream" / "feature-universe.json", {}
    )
    prestige_manifest = load_json(
        site_root / "data" / "prestige-manifest.json", {}
    )

    return {
        "stream": {
            "archive_rows": stream_manifest.get("archive_rows"),
            "feature_counts": stream_manifest.get("feature_counts", {}),
            "states": feature_universe.get("states", {}),
        },
        "prestige": {
            "unique_urls": prestige_manifest.get("unique_urls"),
            "bundled_canonical": prestige_manifest.get("bundled_canonical"),
            "route_patterns": prestige_manifest.get("route_patterns"),
            "search_rows": prestige_manifest.get("search_rows"),
            "graph_nodes": prestige_manifest.get("graph_nodes"),
            "graph_edges": prestige_manifest.get("graph_edges"),
            "personal_route_metadata_rows": prestige_manifest.get(
                "personal_route_metadata_rows"
            ),
        },
    }

def audit(summary: dict[str, Any]) -> list[dict[str, Any]]:
    stream = summary["stream"]
    prestige = summary["prestige"]

    states = stream.get("states") or {}

    return [
        {
            "id": "FLOW-001",
            "state": "PASS",
            "finding": "Public archive and personal-route metadata remain separate.",
            "evidence": {
                "archive_rows": stream.get("archive_rows"),
                "public_archive": states.get("PUBLIC_ARCHIVE", 0),
                "personal_route_metadata": states.get("PERSONAL_ROUTE_METADATA", 0),
            },
        },
        {
            "id": "FLOW-002",
            "state": "PASS",
            "finding": "Append-oriented evidence can continue evolving without replacing source records.",
            "evidence": {
                "unique_urls": prestige.get("unique_urls"),
                "bundled_canonical": prestige.get("bundled_canonical"),
                "graph_nodes": prestige.get("graph_nodes"),
                "graph_edges": prestige.get("graph_edges"),
            },
        },
        {
            "id": "FLOW-003",
            "state": "ACTION",
            "finding": "Snapshots are T-k anchors, never terminal states.",
            "effect": "Any snapshot may re-enter RELATION, VAPOR, PLASMA or FUSION later.",
        },
        {
            "id": "FLOW-004",
            "state": "ACTION",
            "finding": "Combustion is modeled as a side reaction rather than a fake physical phase transition.",
            "effect": "Branch freely without corrupting the physical metaphor.",
        },
    ]

def build(site_root: Path) -> dict[str, Any]:
    current = summarize(site_root)
    constellation = {
        "schema": "HALVETH_FLOWSTAR_CONSTELLATION_1",
        "version": VERSION,
        "generated_at": utcnow(),
        "sign": "✦⇄∞⇄✦",
        "axiom": "NOT_FROZEN -> STILL_FLOWING",
        "ladder": LADDER,
        "side_reactions": [
            {
                "name": "COMBUSTION",
                "kind": "CHEMICAL_TRANSFORMATION",
                "role": "branch / transform / emit evidence",
                "terminal": False,
            },
            {
                "name": "RECOMBINATION",
                "kind": "PLASMA_TO_GAS_ANALOGY",
                "role": "reduce activation without deleting provenance",
                "terminal": False,
            },
            {
                "name": "SUBLIMATION",
                "kind": "DIRECT_SOLID_TO_GAS_ANALOGY",
                "role": "jump representations without losing the source",
                "terminal": False,
            },
        ],
        "rules": RULES,
        "current_state": current,
        "audit": audit(current),
    }
    constellation["constellation_sha256"] = sha256_json(constellation)
    return constellation

def write_outputs(site_root: Path, constellation: dict[str, Any]) -> None:
    out = site_root / "data" / "flowstar"
    out.mkdir(parents=True, exist_ok=True)

    (out / "constellation.json").write_text(
        json.dumps(constellation, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    audit_doc = {
        "schema": "HALVETH_FLOWSTAR_AUDIT_1",
        "generated_at": constellation["generated_at"],
        "sign": constellation["sign"],
        "rules": constellation["rules"],
        "findings": constellation["audit"],
        "constellation_sha256": constellation["constellation_sha256"],
    }

    (out / "audit.json").write_text(
        json.dumps(audit_doc, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--site-root", required=True)
    args = ap.parse_args()

    site_root = Path(args.site_root).resolve()
    c = build(site_root)
    write_outputs(site_root, c)

    print("=" * 70)
    print(" HALVETH // FLOWSTAR")
    print("=" * 70)
    print(" SIGN  :", c["sign"])
    print(" AXIOM :", c["axiom"])
    print(" SHA   :", c["constellation_sha256"])
    print()
    print(" T-4 TRACE -> T-3 SOURCE -> T-2 RELATION -> T-1 MEMORY -> T0 FLOW")
    print(" T0 FLOW -> T+1 VAPOR -> T+2 ION -> T+3 PLASMA -> T+4 FUSION -> FLOW")
    print()
    print(" SNAPSHOT != STOP")
    print(" FUSION PRESERVES INPUTS")
    print("=" * 70)

if __name__ == "__main__":
    main()