#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
# No activation, global pip installation, git commands, or existing project edits.
case "${1:-}" in ''|--no-open|--eht) ;; *) printf 'Nutzung: bash START.sh [--no-open|--eht]\n' >&2; exit 2;; esac
PYTHON="${PYTHON:-python}"
command -v "$PYTHON" >/dev/null || { printf 'STOP: Python fehlt.\n' >&2; exit 1; }
"$PYTHON" -B -X utf8 lab.py verify
"$PYTHON" -B -X utf8 -m unittest -v test_lab
if command -v node >/dev/null 2>&1; then
  node --test validation/test_focus.cjs
else
  printf 'HINWEIS: Node fehlt; zusaetzliche JS-Tests hier nicht ausgefuehrt.
'
fi
if [[ "${1:-}" == "--no-open" ]]; then "$PYTHON" -B -X utf8 lab.py demo; else "$PYTHON" -B -X utf8 lab.py demo --open; fi
if [[ "${1:-}" == "--eht" ]]; then
  printf '\nEHT: Zwei oeffentliche CSV-Dateien werden heruntergeladen und geprueft.\n'
  "$PYTHON" -B -X utf8 lab.py fetch
  "$PYTHON" -B -X utf8 lab.py compare
elif [[ -n "${1:-}" && "${1:-}" != "--no-open" ]]; then
  printf 'Unbekanntes Argument. Nutzung: bash START.sh [--eht]\n' >&2
  exit 2
fi
printf '\nLABOR BEREIT | Synthetische Bilder sind keine Beobachtungsnachweise.\n'
printf 'Keine Aenderung an console-only, Garden, Git, Wallets oder deinem Review-Branch.\n'
