# Portfolio hardening — 20 October 2026

This is the implementation record for the supplied external portfolio audit. Its subjective scores are not measurements and are not presented as test results.

| Audit request | Implemented state and evidence |
| --- | --- |
| Clear positioning and two primary actions | Homepage identifies software, interaction and research; primary actions lead to the new evidence page and the technical map. |
| Three concise, reproducible cases | `/belege/`, `/en/belege/`, `/ru/belege/`: problem, input, result, counterexample, reuse, exact source and explicit scope. |
| Dated checks and CI | `data/work-samples.json` binds each case's recorded CI run to the exact displayed source SHA. Mismatched SHAs are rejected by a negative test. Successful runs are dated snapshots, not claims about later revisions. |
| Inspect real behavior | SCARLET has an actual browser capture; lab tests were run locally; the portable C++ tests were compiled and executed locally with Clang 23.1.2. |
| Separate project responsibility and AI assistance | Evidence page names project direction, design and selection separately from AI-assisted development and agent-executed checks. It does not attest interview skills or an independent audit. |
| Separate inherited code and specific contributions | Evidence page links the bounded Windows build contribution in the derived java-tron repository. The full inherited tree is not attributed as an original rewrite. |
| Tresor security status | Existing security model was found. A separate documentation patch corrects version/clipboard drift, qualifies memory and recovery claims, and records 27 passing synthetic tests. Its publication is tracked separately from this website. |
| Keyboard, mobile, links | Native details tested with Enter. At 375 CSS px, page scrollWidth equals clientWidth. Generated-page tests cover local routes/anchors across three languages. Desktop/mobile browser captures are retained locally. |

## Remaining checks

- A complete independent security audit of Tresor remains open. No external-audit or production-certification badge is used.
- Native Unreal build/graphics acceptance is separate from the portable C++ checks.
- No Lighthouse score or full WCAG conformity assessment was measured in this pass.
- The public contact is `security@halveth.de`; licence/provenance links remain visible. Applicable imprint/privacy obligations and owner-approved public details still need a separate decision. No private address was invented or exposed.
- Repository pinning on the GitHub profile is a separate account setting; this patch curates the README and website entrances.

## Verification

```sh
npm ci --ignore-scripts
npm run build
npm test
git diff --exit-code  # after committing generated pages; confirms deterministic output
```

The added tests reject a CI/source mismatch, an invented audit check type, incomplete cases and invalid source paths. Text is escaped. The page works without JavaScript and retains the existing restrictive CSP.

Clang test invocation, using the pinned `halveth-unreal` source from `data/work-samples.json`:

```sh
clang++ -std=c++20 -Wall -Wextra -Werror tests/knowledge_test.cpp -o knowledge_test
./knowledge_test
clang++ -std=c++20 -Wall -Wextra -Werror tests/layout_test.cpp -o layout_test
./layout_test
```

Observed output: `KNOWLEDGE_TEST_PASS 18008 checks` and `HALVETH_LAYOUT_PASS: 20 seed/realm samples, 800 props, 6 reversible routes`. These are counts from the supplied checks, not measured player numbers or proof of an Engine build.
