#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
case "${1:-check}" in
  build) node tools/build-space.cjs ;;
  check) node --test tests/space.test.cjs ;;
  preview) node tools/serve-space.cjs ;;
  inventory)
    # Owned PUBLIC metadata only. No write, commit, push or deployment.
    gh api user/repos --paginate -f affiliation=owner -f per_page=100 --method GET --jq '.[] | select(.owner.login == "Juri-Halveth" and .visibility == "public") | {id,name,full_name,default_branch,archived,html_url}'
    ;;
  *) printf 'Use: bash SPACE.sh build | check | preview | inventory\n' >&2; exit 2 ;;
esac
