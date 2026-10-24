# Juri · Interactive worlds and inspectable systems

Person: **Juri**. Project: **HALVETH**. [Identity](IDENTITY.md).

[Portfolio](https://juri-halveth.github.io/en/) · [Projects](https://juri-halveth.github.io/en/arbeiten/) · [Technology and code](https://juri-halveth.github.io/en/koennen/)

The first screen presents actual project captures: native ASTRALIS development,
SCARLET's interactive particle field and two views of the ENDECK model. Change
model time directly on the page; the image projection converges while distinct
depth positions remain. Each scene explains its purpose and possible reuse.

Project lead and curation: Juri / HALVETH. AI-assisted development. German,
English and Russian interfaces are generated from the same sources.

## Build locally

Requires Node.js 24.

```sh
npm ci --ignore-scripts
npm run build
npm test
npm run preview
```

Preview binds only to `127.0.0.1:4187`; `SPACE_PORT` selects another local port.
Keep confidential files outside this public working directory.

## Sources and verification

`data/scene-stage.json` binds capture provenance, processing, image hashes and
the byte-preserved MIT model. Static SVG remains readable without JavaScript;
interactive controls require it. Playback is explicit, finite and pauses when
hidden. `showcase.css` provides responsive layouts.

`data/projects.json` describes 14 selected entries with source revisions and
limited review states. Local model checks bind to that exact source revision.
`data/public-repositories.json` lists 18 public repositories observed at its
timestamp; licence-review revisions remain separate. Inventory is not a full
security audit of those projects. Download releases retain their own versions.

The deterministic builder produces 43 HTML pages. The technical map links 14 work
samples across seven areas to pinned functions, tests and build definitions.
Its profile-source byte binding remains explicit. `/forschung/` is a static
source/relationship index, not a running cross-project backend. The build does
execute the retained local ENDECK model to produce SVG.

Historical `/belege/` results retain their original dates and revisions.
See [the 24 October change record](docs/SCENE-FIRST-2026-10-24.md) for the new scope.

## Collaboration and rights

Interactive prototypes, technical explanations and local tools can be scoped
as a concrete engagement with goals and acceptance criteria. The website is
source-available under its [path/version licence map](LICENSES.md), preserving
MIT exceptions and earlier grants. Linked projects retain their own terms.

[Security](SECURITY.md) · **security@halveth.de**
