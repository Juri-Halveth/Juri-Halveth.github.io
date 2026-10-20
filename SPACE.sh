#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
case "${1:-build}" in
 build) node tools/build-portfolio.cjs ;;
 check) node --test tests/*.test.cjs ;;
 preview) node tools/serve-space.cjs ;;
 *) echo 'Use: SPACE.sh build|check|preview' >&2; exit 2 ;;
esac
