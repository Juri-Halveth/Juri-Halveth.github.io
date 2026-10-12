#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

# Git Bash on Windows does not always inherit the Windows Node.js directory.
# Keep the same build graph on both Windows and the Pages Linux runner.
if command -v node >/dev/null 2>&1; then
  NODE_BIN="$(command -v node)"
elif [[ -x "/c/Program Files/nodejs/node.exe" ]]; then
  NODE_BIN="/c/Program Files/nodejs/node.exe"
elif [[ -x "/mnt/c/Program Files/nodejs/node.exe" ]]; then
  NODE_BIN="/mnt/c/Program Files/nodejs/node.exe"
else
  printf 'Node.js was not found. Install Node.js or expose it on PATH.\n' >&2
  exit 127
fi

case "${1:-check}" in
  build) "$NODE_BIN" tools/build-space.cjs ;;
  verify) "$NODE_BIN" tools/build-space.cjs; bash "${BASH_SOURCE[0]}" check ;;
  # The landing and handbook suites regenerate overlapping pages; run files serially.
  check) "$NODE_BIN" --test --test-concurrency=1 tests/code-evidence.test.cjs tests/certificate-claims.test.cjs tests/landing.test.cjs tests/public-brand.test.cjs tests/motion.test.cjs tests/motion-player.test.cjs tests/landing-motion.test.cjs tests/languages.test.cjs tests/handbook.test.cjs tests/governance.test.cjs tests/models-atlas.test.cjs modelle/raumzeit/core.test.mjs examples/world-grip.test.mjs ;;
  motion) shift; "$NODE_BIN" tools/render-motion.cjs "$@" ;;
  preview) "$NODE_BIN" tools/serve-space.cjs ;;
  inventory)
    # Owned PUBLIC metadata only. No write, commit, push or deployment.
    gh api user/repos --paginate -f affiliation=owner -f per_page=100 --method GET --jq '.[] | select(.owner.login == "Juri-Halveth" and .visibility == "public") | {id,name,full_name,default_branch,archived,html_url}'
    ;;
  *) printf 'Use: bash SPACE.sh verify | build | check | preview | inventory | motion [--out DIR --ffmpeg PATH]\n' >&2; exit 2 ;;
esac
