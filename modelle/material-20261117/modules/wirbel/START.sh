#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
PYTHON="${PYTHON:-python}"
case "${1:-}" in ''|--no-open|--previous) ;; *) echo 'Nutzung: bash START.sh [--no-open|--previous]' >&2; exit 2;; esac
command -v "$PYTHON" >/dev/null || { echo 'STOP: Python >= 3.10 benoetigt.' >&2; exit 1; }
"$PYTHON" -B -X utf8 build.py --verify
if [[ "${1:-}" == '--previous' ]]; then
  bash ../sgra/START.sh
  exit 0
fi
command -v node >/dev/null || { echo 'STOP: Node.js >= 18 fuer die Rechentests benoetigt.' >&2; exit 1; }
node --test tests/engine.test.cjs
if [[ "${1:-}" != '--no-open' ]]; then "$PYTHON" -B -X utf8 build.py --open; fi
printf '\nWIRBEL BEREIT | Offline. Kein Git, kein Garden-Patch, keine globalen Installationen.\n'
