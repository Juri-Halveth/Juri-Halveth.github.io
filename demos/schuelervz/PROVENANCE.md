# Schulnetz browser demo · source and data provenance

Prepared on 2026-11-11. The first Git commit introducing this route binds its
initial published source revision. A commit or hash binds bytes, not
authorship, third-party rights, or a successful live deployment.

This is a new AI-assisted implementation created with Codex under the user's
direction for an installation-free HALVETH browser demonstration. Human input
defined the task, the nostalgic school-network theme, the bounded public
route and the acceptance of the reviewed candidate. No claim of blanket
human authorship over generated material is made.

The historical `schuelervz-halveth/` presentation at portal revision
`903ab43391238ce9723dfb282ed4aa08606c1b93` supplied context for the request.
No files, old profiles, archive pages, collectors, images, scripts or styles
were imported from that presentation. Its deliberate removal remains in
place; see [PR 24](https://github.com/Juri-Halveth/Juri-Halveth.github.io/pull/24).
The earlier archive and this new demo are separate artifacts.

All six profiles, three groups and example posts are newly invented demo
content. The UI labels them as fictional. There is no account service,
message recipient, archive search, external API, font or image dependency.
Visitors' optional posts and group choices stay in this browser's own
versioned localStorage entry; blocked storage is reported in the UI.

The route refers to SchülerVZ as historical inspiration. It claims no
affiliation, official status, restored account access or rights to the
historical service or its name. References and third-party rights retain
their own scope. Applicable terms for protectable rights actually held are
mapped in [LICENSES.md](../../LICENSES.md); the broader limits remain in
[RIGHTS-AND-PROVENANCE.md](../../docs/RIGHTS-AND-PROVENANCE.md).

## Reviewed interface bytes

The four interface files were copied unchanged from the locally reviewed
candidate. These SHA-256 values bind that byte state:

| File | SHA-256 |
|---|---|
| `index.html` | `030183eaead4b94a9c64ba968d39d9eca8fe61ecbed3137b5c183e91955d2705` |
| `style.css` | `9e3400ed193d66886989b9d1968f572232b59836e7212e927a2e5f2fd7b30ead` |
| `model.js` | `fcae3e16daf1ee771e73197d71cbad0e81183ec38e83d737e9f44a03941f79e1` |
| `app.js` | `0726a99294d9a7518e837126f10c260d46bb8f2dbef2272d6611d32a34aaa63e` |

Tests exercise bounded state handling, local interaction and failure cases.
DOM tests use a local jsdom substitute and do not measure browser rendering,
real user outcomes or historical service equivalence.
