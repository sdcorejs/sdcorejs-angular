---
generated_at: 2026-07-13T17:48:00+07:00
generator: sdcorejs-explore
target_root: C:/Users/nghiatt15_onemount/Documents/sdcorejs/sdcorejs-angular
target_root_kind: target-project
git_head: 4efaca0448b241f4108aaf7611db3d8826f1fca4
dirty: true
relevant_dirty_paths:
  - versions/v19/projects/showcase
  - versions/v20/projects/showcase
  - versions/v21/projects/showcase
tracks:
  - angular
  - documentation
  - node
stack_profiles:
  - core-ui-angular
  - node-general
profile_confidence: high
source_roots:
  - versions/v19/projects/showcase
  - versions/v19/projects/sdcorejs-angular
  - scripts
  - published-docs
summary_scope: showcase documentation refactor and versioned Angular workspaces
package_manager: npm
package_manifest_hash: 658F3F9E8FDB1FDA0EABC75B24CA09FBFB2DD83D0BAD9F955062390256A5EDAD
package_lock_hash: 0C427072AC0691FD98F2E52BE6AFB88C837DCC7BC1F04BE659AE2121AFB28C2A
source_roots_hash: 306CE83E83ADA3D94AE33FE1104AC682D00EBC4B7F9CA80682ADC81DB42302ED
generated_from:
  - package.json
  - versions/v19/package.json
  - versions/v19/angular.json
  - versions/v19/projects/showcase/src/app/app.routes.ts
  - versions/v19/projects/showcase/src/app/layout/sidebar.config.ts
  - versions/v19/projects/showcase/src/app/shared/demo-page.component.ts
  - published-docs/versions.json
commands_run:
  - git rev-parse --show-toplevel
  - git rev-parse HEAD
  - git status --short
  - git ls-files versions/v19/projects/showcase versions/v19/projects/sdcorejs-angular
commands_skipped: []
redaction_applied: true
---

# Project Summary - sdcorejs-angular

## Repository Shape

- The repository maintains Angular 19, 20, and 21 workspaces under `versions/`.
- `versions/v19` is the source of truth for library and showcase work; root `npm run sync` rolls compatible changes into v20/v21 and `npm run check:sync` verifies parity.
- Root Node/PowerShell tooling owns workspace synchronization and published-document collection.
- `published-docs/versions.json` and per-version `index.json`/Markdown trees are the versioned documentation archive used by GitHub Pages.

## Angular 19 Showcase

- The standalone showcase lives at `versions/v19/projects/showcase` and imports the local `@sdcorejs/angular` secondary entrypoints, so it is classified as `core-ui-angular`.
- `docs/core/documentation.registry.ts` is the single typed catalog for 85 pages across seven groups; routes, sidebar, category pages, home, search, breadcrumbs, pagination, published-document availability, and 253 examples derive from it.
- Version-aware routes expose Overview, Styling, API and Examples under `/v/:version/...`, plus home, changelog, about, legacy redirects and a real not-found page.
- `layout/shell.component.*` provides responsive navigation, global search, version switching, route-title/focus behavior and an accessible mobile drawer.
- Every existing `demo-section` has a generated stable id and focused structural guard, so one example card constructs only its selected scenario. Button is the reference physical split with seven standalone example components.
- Published Markdown is fetched base-href-safely, classified hierarchically, and rendered with semantic tables/code/safe fragment, relative and external links.

## Library And Tooling

- Library sources live at `versions/v19/projects/sdcorejs-angular`; do not change public APIs for showcase-only work.
- Angular Material and PrismJS are already direct v19 dependencies; no new documentation framework is needed.
- Showcase Karma currently covers 167 routing, registry, version, search, Markdown, accessibility/focus, focused-rendering and failure-path cases per workspace. Root generator tests cover 19 changelog/source/manifest/freshness cases.
- Root generators produce typed changelog, example manifest and lazy source artifacts; generated freshness and authored example order are test-gated.
- GitHub Pages builds the v19 showcase with a non-root base href and deploys published docs beneath `docs/`; runtime asset/document URLs must resolve from the configured base URI.

## Current Work Context

- Active branch: `refactor/showcase-documentation-site` at `4efaca0448b241f4108aaf7611db3d8826f1fca4`.
- The branch contains the committed documentation-site refactor plus uncommitted synchronized showcase fixes in v19/v20/v21.
- Current verified state: generators 19/19, Karma 167/167 and production builds pass on v19/v20/v21, independent review findings are resolved, and version sync parity passes.
