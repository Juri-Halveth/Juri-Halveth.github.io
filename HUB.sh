#!/usr/bin/env bash
# Portable edition of the five-source local build/test operator.
set -euo pipefail
hub="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
[[ "${1:-}" == verify && $# == 2 ]] || { printf 'Use: bash HUB.sh verify /path/to/hub-quellen\n' >&2; exit 2; }
sources="$(cd -- "$2" && pwd)"
for project in fortuna halveth-scarlet lernstudio mein-lernportal; do
  [[ -d "$sources/$project/.git" ]] || { printf 'MISSING SOURCE: %s\n' "$project" >&2; exit 3; }
  web="$sources/$project"
  [[ "$project" == fortuna ]] && web="$web/docs"
  [[ -s "$web/languages/catalog.js" ]] || { printf 'MISSING LANGUAGE CATALOGUE: %s\n' "$project" >&2; exit 3; }
done
(cd -- "$hub" && bash SPACE.sh verify)
(cd -- "$sources/fortuna" && node --test docs/curiosity.test.mjs docs/collective.test.mjs)
node "$hub/tools/verify-fortuna-labels.cjs" "$sources/fortuna"
(cd -- "$sources/halveth-scarlet" && node tools/build_site.mjs && node --test tests/*.test.cjs tests/*.test.mjs)
(cd -- "$sources/lernstudio" && npm run build)
(cd -- "$sources/mein-lernportal" && npm test && node tests/big-bang.cjs)
node "$hub/tools/write-hub-receipt.cjs" "$sources"
