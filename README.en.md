# Juri · Software, graphics and learning

[Portfolio](https://juri-halveth.github.io/en/) · [Work samples](https://juri-halveth.github.io/en/koennen/)

A curated technical portfolio with project purpose, source revision and development
state. Available in German, English and Russian. Project lead: Juri / HALVETH.
Development includes AI assistance.

## Build locally

```sh
npm ci --ignore-scripts
npm run build
npm test
npm run preview
```

`data/projects.json` supplies the selected projects. `tools/build-portfolio.cjs`
builds every page deterministically. Tests cover the catalog, local links, language
entrances, motion timing, visibility and reduced motion. Each linked project keeps
its own validation scope and licence.

Earlier mixed archives are retained privately and removed from the current public
file tree. Historical certificate URLs now display technical work samples. This
editorial commit does not rewrite Git history.

[Licences](LICENSES.md) · [Security](SECURITY.md) · security@halveth.de
