# Repository agent rules

These instructions apply only to this public static-site repository. They do not grant authority over linked projects, third-party systems, accounts, services, or people.

## Source order and changes

- Read this file, README.md, LICENSES.md, and the active task's named files before changing the site.
- Inspect the current branch, status, diff, and target files. Preserve unrelated edits.
- Make the smallest coherent change, add or update meaningful checks, and report what was actually tested.
- Keep source files and generated website output consistent. Do not hand-edit generated files unless the generator contract requires it.
- Do not publish, deploy, contact a recipient, change account settings, or create an external legal or financial commitment without explicit human approval.

## Security research and bug bounty scope

This repository does not currently offer a public bug-bounty program, promise a reward, or promise a response time. A security contact is a reporting route, not permission to test.

Agents may perform static review of this repository and run local synthetic tests against a local copy. Before any active test of a live service or linked asset, require a current, source-bound program or written authorization that identifies all of the following:

1. The exact owner, hostname, application, API, and in-scope asset.
2. The authorization source, its current version/date, and the authorized test identity.
3. Allowed methods, explicit exclusions, prerequisites, rate limits, and test window.
4. Data boundaries, handling and retention, evidence location, and disclosure route.
5. Stop conditions, emergency contact where supplied, and the human who approved this specific test.

If any item is missing, conflicting, expired, or outside the named scope, do not send test traffic. Preserve the question as unresolved and ask the responsible human to bind the missing scope. A repository link, account access, public reachability, or general request to research is not authorization.

Never bypass authentication, access controls, rate limits, or platform protections. Do not perform denial-of-service, destructive or persistent actions, social engineering, credential harvesting, data exfiltration, cross-tenant access, or tests involving real user data. Stop immediately on unexpected sensitive data, service impact, or scope ambiguity.

Delegated agents inherit the same exact scope, exclusions, and stop conditions. Delegation cannot broaden authorization. Keep observations, interpretation, severity, reportability, bounty eligibility, and any reward as separate conclusions. Do not claim safe harbor, program acceptance, a bounty, or a response unless an authoritative source explicitly establishes it.

## Data, secrets, and evidence

- Do not commit credentials, tokens, private keys, cookies, raw private reports, personal data, or restricted evidence.
- Minimize and redact local identifiers from public examples. Preserve original evidence at its authorized source.
- A hash, commit, or timestamp binds a byte state or Git event; it does not by itself prove authorship, ownership, truth, consent, or an external effect.
- Label unverified statements as unknown or not proven. Record source, time, scope, and coverage for material security claims.

## Rights and attribution

Follow the per-file and per-version mapping in LICENSES.md and the applicable licence files. Do not infer or expand a licence, ownership claim, patent claim, or rights transfer from repository access, a commit, a hash, or this document. Keep third-party assets under their own notices.

## Reviews and enforcement

.github/CODEOWNERS identifies suggested reviewers only. It does not enforce review or block merging unless the repository's branch protection or ruleset settings require it. Do not claim those settings are enabled without checking the live repository configuration.
