#!/usr/bin/env bash
set -euo pipefail

# Called after a workflow has staged only its intended public output paths.
# Rebase the new commit onto the current default branch and retry a racing push.
message=${1:?commit message required}

if git diff --cached --quiet; then
  echo "No public output changed."
  exit 0
fi

git commit -m "$message"

for attempt in 1 2 3; do
  git fetch origin main
  git rebase origin/main

  if git push origin HEAD:main; then
    echo "Published refresh commit on attempt $attempt."
    exit 0
  fi

  echo "Push raced with another update (attempt $attempt/3)." >&2
done

echo "Could not publish the refresh after three attempts." >&2
exit 1
