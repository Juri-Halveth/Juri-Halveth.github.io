# HALVETH Source Universe

`/universum/` is a browser view of the public `Juri-Halveth/Juri-Halveth.github.io`
repository. The build creates `data/source-universe.json` from Git-tracked
working-tree files and the available Git commit history. GitHub Pages publishes
that generated index with the rest of the static build; it is not a live
filesystem observer.

The map stores file paths, byte lengths, SHA-256 digests, Git blob identifiers,
Git state labels, commit timestamps, and typed relation endpoints. It does not
store file contents. Untracked files are excluded. A static import, link, or
workflow `uses:` match is marked `INFERRED`; Git tree membership and commit
path records are marked `OBSERVED` within their declared source. A matching
SHA-256 and byte length is shown as a hash match, not as authorship or
provenance.

The visualizer assigns deterministic X/Y/Z layout coordinates and a normalized
W coordinate derived from commit time, then projects those four data
coordinates onto the 2D browser canvas. This is a navigable 4D data projection,
not a claim about physical four-dimensional space. The time lens filters the
commit events in the captured history. It does not reconstruct the bytes or
file tree that existed at an earlier time. The history window is capped at 160
commits; if older commits are outside the captured window, the index says so.

The browser loads the generated JSON from the same origin, draws at a measured
frame rate, and supports mouse/touch orbit, keyboard rotation, zoom, search,
node inspection, and reduced-motion settings. A Git push triggers a new static
build; the browser does not run shell commands, call GitHub APIs, or observe
local machine state.

Ownership and permissions remain governed by [LICENSES.md](../LICENSES.md),
the repository's existing file/version map, prior effective grants, third-party
rights, and GitHub's terms. This visualization, its node IDs, and commit hashes
do not independently prove authorship, ownership, exclusive rights, or a
legal claim. `CODEOWNERS` is review routing only.
