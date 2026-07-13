---
generated_at: 2026-07-13T14:12:00+07:00
generator: sdcorejs-explore
target_root: C:/Users/nghiatt15_onemount/Documents/sdcorejs/sdcorejs-angular
target_root_kind: target-project
git_head: 5c07037335a9e66ad805d7643651e4890be52844
dirty: true
relevant_dirty_paths: []
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
package_manifest_hash: 56B1F3109A1DB78974F35475074F4897D77016E392D07E43BC8940F7C23A803D
package_lock_hash: 609AB451B3DE096CEF0004EB1F8EA37FA130771584360099E2A616E8228D0A09
source_roots_hash: 94BCE05F94A4F85C17496601681B54EE423F48A3945076117F93953F14B196C5
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
- `docs/core/documentation.registry.ts` is the single typed catalog for 53 pages: 32 components, 15 forms, and 6 services; routes, sidebar, home, search, breadcrumbs, pagination and 253 examples derive from it.
- Version-aware routes expose Overview, Styling, API and Examples under `/v/:version/...`, plus home, changelog, about, legacy redirects and a real not-found page.
- `layout/shell.component.*` provides responsive navigation, global search, version switching, route-title/focus behavior and an accessible mobile drawer.
- Every existing `demo-section` has a generated stable id and focused structural guard, so one example card constructs only its selected scenario. Button is the reference physical split with seven standalone example components.
- Published Markdown is fetched base-href-safely, classified hierarchically, and rendered with semantic tables/code/safe fragment, relative and external links.

## Library And Tooling

- Library sources live at `versions/v19/projects/sdcorejs-angular`; do not change public APIs for showcase-only work.
- Angular Material and PrismJS are already direct v19 dependencies; no new documentation framework is needed.
- Showcase Karma currently covers 63 routing, registry, version, search, Markdown, accessibility/focus, focused-rendering and failure-path cases. Root generator tests cover 19 changelog/source/manifest/freshness cases.
- Root generators produce typed changelog, example manifest and lazy source artifacts; generated freshness and authored example order are test-gated.
- GitHub Pages builds the v19 showcase with a non-root base href and deploys published docs beneath `docs/`; runtime asset/document URLs must resolve from the configured base URI.

## Current Work Context

- Active branch: `refactor/showcase-documentation-site` at `5c07037335a9e66ad805d7643651e4890be52844`.
- The branch contains the completed showcase documentation refactor and synchronized v20/v21 copies; it has not been committed or pushed.
- Final verified state: generators 19/19, Karma 63/63, production showcase build pass, exact 390px runtime audit without overflow/errors, and version sync parity pass.
