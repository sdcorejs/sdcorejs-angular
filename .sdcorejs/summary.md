---
generated_at: 2026-07-27T02:22:00+07:00
generator: sdcorejs-explore
target_root: C:/Users/Admin/Documents/sdcorejs/sdcorejs-angular/.worktrees/feat-layout-navigation-polish
target_root_kind: target-project
git_head: 3a68bb7129427f92be92708c7593c134db4f9b5d
dirty: true
relevant_dirty_paths:
  - .sdcorejs/summary.md
  - .sdcorejs/docs/angular/2026-07-27-01-33-review-layout-v2-v3.md
  - .sdcorejs/tasks/angular.md
  - .sdcorejs/tasks/current-session.md
branch: feat/layout-navigation-polish
tracks: [angular]
stack_profiles: [core-ui-angular]
profile_confidence: high
source_roots:
  - versions/v19/projects/sdcorejs-angular
  - versions/v19/projects/showcase
summary_scope: angular-library-showcase
package_manager: npm
package_manifest_hash: c466300a15176dfd1c0db3a41a05ef5e862a7aae
package_lock_hash: 3bb3acd1b163665890760c7e7440a2afa5d0ed05
source_roots_hash: bca546f7ef9072724cc249221b9742491f696d42
generated_from:
  - package.json
  - versions/v19/angular.json
  - versions/v19/projects/sdcorejs-angular
  - versions/v19/projects/showcase
commands_run:
  - git rev-parse --show-toplevel
  - git status --short
  - git hash-object package.json
  - git hash-object package-lock.json
  - git rev-parse HEAD:versions/v19/projects/sdcorejs-angular
commands_skipped: []
redaction_applied: false
---

# Project Summary - sdcorejs-angular

## What this project is

Repository nguồn của `@sdcorejs/angular`, duy trì cùng feature surface cho
Angular 19, 20 và 21. Release `1.4` đã có trên `main`; công việc hiện tại là
polish Layout V1/V2/V3, repair version-pinned Showcase docs and prepare the
single release suffix 1.5 unit. Account menu có additive typed public API cho
role, semantic actions và reactive notification count; không xóa hoặc đổi
contract cũ.

## Stack & track

- Track: Angular library + Angular Showcase/docs application.
- Stack: Angular, Angular Material/CDK, TypeScript, RxJS, ng-packagr.
- Testing: Jasmine/Karma/ChromeHeadless, Angular ESLint, generator tests.
- Package manager và task runner: npm + PowerShell repository scripts.

## Architecture map

- Canonical library source: `versions/v19/projects/sdcorejs-angular`.
- Generated mirrors: `versions/v20` và `versions/v21`.
- Canonical Showcase/docs source: `versions/v19/projects/showcase`.
- Layout sources:
  `versions/v19/projects/sdcorejs-angular/modules/layout/components`.
- Root release source: `CHANGELOG.md`.
- Workspace rollout: `npm run sync`; parity guard: `npm run check:sync`.

## Reusable building blocks

- `SdLayoutUserMenuComponent` owns desktop disclosure, static mobile
  identity/direct sign-out, optional role, ordered semantic actions, reactive
  notification badge, keyboard navigation and Observable cleanup.
- `ISdLayoutConfiguration` exposes `updateProfile`, `setting` and
  `notification`; `SdLayoutUserInfo.role` carries optional text/icon/color.
- Shared Layout menu tree owns delayed desktop pin visibility and always-visible
  mobile pin behavior.
- `SidebarV2Component`, `SidebarV3Component` and their mobile counterparts own
  navigation state and filtering.
- `SdInput` supplies the existing input/model/`sdChange`/`autoId` contracts.
- `SdIcon` supplies the existing Layout icon system.
- Standalone components use signal inputs/outputs and `OnPush`.

## Conventions detected

- Edit canonical shared implementation in v19, then run root sync for v20/v21.
- New Layout presentation primitives stay internal unless a public API change
  is explicitly approved.
- Do not hand-edit generated mirrors, generated Showcase changelog, `dist/**`
  or `published-docs/**`.
- Behavior changes use RED-first focused specs before minimal implementation.
- Full Karma suites across versions run sequentially to avoid browser
  contention.
- Focused Showcase sections must use the exact `example-*` ID in their
  `SHOWCASE_DEMO_SECTION_ID` guard; registry `demoSectionCount` must match the
  generated manifest.
- Showcase consumes the built library output, so rebuild the canonical v19
  package before browser UAT after Layout source changes.
- Commit, push, PR, tag and publish are separate explicit delivery actions.

## Reuse cheatsheet

- Approved design:
  `docs/superpowers/specs/2026-07-23-layout-v2-v3-navigation-polish-design.md`.
- Approved implementation plan:
  `docs/superpowers/plans/2026-07-23-layout-v2-v3-navigation-polish.md`.
- Approved account-menu spec:
  `.sdcorejs/specs/angular/2026-07-25-16-14-enhance-layout-account-menu.md`.
- Approved account-menu plan:
  `.sdcorejs/plans/angular/2026-07-26-04-57-enhance-layout-account-menu.md`.
- Shared account component:
  `versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/user-menu`.
- Canonical desktop/mobile sidebars:
  `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-*`.
- Existing form primitive:
  `versions/v19/projects/sdcorejs-angular/forms/input`.
- Layout guide: `versions/v19/projects/sdcorejs-angular/modules/layout/sd-layout.md`.
- Latest session note:
  `.sdcorejs/docs/angular/2026-07-27-01-33-review-layout-v2-v3.md`.
- Product traceability:
  `.sdcorejs/docs/product/2026-07-26-22-04-layout-account-menu.md`.

## Open context

- Mobile V2/V3 render a static avatar/name/email summary with direct sign-out
  on the same row, while desktop disclosure remains available.
- V2/V3 menu pins appear after a 300ms desktop hover delay, remain keyboard
  accessible and are always visible on mobile using `push_pin`.
- V3 mobile search is an opaque sticky layer that covers the navigation
  scroller padding so menu items do not leak underneath.
- Desktop V1 keeps `MatSidenav` mounted as a 60px rail when collapsed, supplies
  a custom logo when configured or an `apps` fallback icon, and shows search
  when nested menu count is greater than 10.
- Layout examples are three independent Showcase sections with focused guards
  and generated manifest/source entries.
- V1 Showcase constrains the legacy viewport-height shell to its live preview,
  keeping the desktop account avatar visible and its menu interactive.
- Desktop action order is `updateProfile`, `setting`, `notification`,
  `changePassword`, `signout`; mobile keeps identity + signout in one row and
  optional actions below.
- Notification count accepts number, Signal or Observable; invalid/zero values
  hide the badge, values above 99 render `99+`, and Observable subscriptions are
  replaced/cleaned through the shared component effect.
- Canonical Angular 19 library suite passes `3856/3856` with 9 intentional
  skips; the full Showcase passes `198/198`.
- Focused Layout and version-catalog suites pass across Angular 19/20/21;
  generator suites pass `29/29`, all three library builds pass, the production
  Showcase build passes, and workspace sync parity is clean.
- Final review/repair added localized V1 rail-toggle accessible names and made
  the documented `router.navigate` callbacks compile-safe for
  `Promise<void>`.
- User guide, technical docs, migration `1.5`, changelog and product
  traceability are current for the account-menu and navigation feature.
- Follow-up outside this feature: audit editable `SdInput` instances that
  inherit `aria-hidden="true"` from global container semantics.
- V2/V3 mobile containment is repaired with block-level hosts. Browser UAT at
  390 px reports `topClip = 0` and keeps the V3 56 px topbar visible.
- The Showcase and static route generator now derive every supported `1.2+`
  release from `published-docs/versions.json`; exact 1.3/1.4 routes remain
  pinned and future 1.5 archives require no source allowlist.
- A temporary 1.5 collection produced 97 documents for each Angular major,
  including the complete Layout reference. Immutable archives remain
  post-publish artifacts and are not pre-created by this branch.
- Release-phase lint is green after separating authored-source lint from
  generated-source freshness tests.
- Commit, push and PR creation are authorized and pending. Tagging, npm
  publication and immutable 1.5 archive creation remain out of scope.

## Freshness

This summary reflects the verified repair prepared on top of repository HEAD
`3a68bb7` on branch `feat/layout-navigation-polish` on 2026-07-27. Source,
tests, generated artifacts and Angular 19/20/21 mirrors are synchronized.
Commit/push/PR delivery is pending; release publication is not authorized.
