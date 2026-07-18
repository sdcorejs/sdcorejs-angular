# Remove AuthOM Hard-Purge Design

- Date: 2026-07-15
- Status: design approved; written spec awaiting review
- Target: `@sdcorejs/angular`, Showcase and repository documentation archives

## Intent

Remove the AuthOM integration completely from current Core UI/public API and
Showcase, then purge its historical feature documents and published-doc archive
entries. The user selected a repository-wide hard purge because the library
must no longer present itself as related to the OM identity platform.

## Approved scope

1. Delete the `@sdcorejs/angular/modules/authom` secondary entrypoint and its public re-export.
2. Remove current README and module-document references while preserving Auth, Keycloak, Permission, Layout and Icon.
3. Remove the Showcase documentation page and update registry/markdown tests; generic routing and navigation remain unchanged.
4. Use v19 as source of truth and sync the deletion into v20/v21.
5. Delete the old AuthOM design/plan records at root and their three workspace mirrors.
6. Purge the AuthOM document, index entry and direct cross-links from all 31 published release archives; repair counts and regenerate the catalog.
7. Keep no compatibility stub or deprecation layer.

## Boundaries

- Git history and already-published npm packages cannot be changed by this task.
- The new removal spec/plan/checkpoint remains as the audit trail for the explicit decision.
- Unrelated OneMount author/email references are not removed by substring matching.
- No new identity provider, route, dependency or UI replacement is introduced.
- No commit, push, tag, publish or deployment is implied by implementation approval.

## Architecture impact

The removal eliminates one ng-packagr secondary entrypoint, its standalone and
NgModule providers, interceptor, token service, PKCE/silent-refresh flow and
documentation surface. The umbrella modules entrypoint remains because it also
exports supported modules.

Showcase pages are registry-driven. Removing the registry record automatically
removes navigation and causes legacy URLs to follow existing not-found handling;
there is no page component or demo route to replace.

Published archives are intentionally rewritten despite their normal immutable
policy. Each archive transformation must delete only the AuthOM document and
direct cross-links, decrement its count once and keep all unrelated release
content intact. `versions.json` and `catalog.json` must describe the transformed
corpus exactly.

## Verification design

- Structural RED: before edits, prove module paths, public exports, Showcase registration, old records and archive entries still violate the desired boundary.
- Structural GREEN: rerun the same assertion after purge, allow-listing only the new removal change-control records.
- Run Showcase registry/markdown/generator tests and published-doc integrity checks.
- Run v19-to-v20/v21 sync and parity guard.
- Build the library on Angular 19, 20 and 21 plus the v19 Showcase.
- Inspect rebuilt package exports, final residue scan and `git diff --check`.

## Primary risks

- This is a breaking API removal for existing consumers.
- Historical docs will no longer exactly describe historical npm packages.
- A partial archive rewrite can break public manifest/catalog integrity.
- A broad `OM` text purge can delete unrelated attribution or package names.

The mitigations are an explicit no-stub contract, exact-identifier scanning,
atomic per-archive metadata repair, production builds and checked-in integrity
tests.

## Approval record

- User selected option `2`: purge source, Showcase and repository history.
- User approved this hard-purge design on 2026-07-15.
