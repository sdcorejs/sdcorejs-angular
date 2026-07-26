---
generated_at: 2026-07-26T22:10:00+07:00
generator: sdcorejs-explore
target_root: C:/Users/nghiatt15_onemount/Documents/sdcorejs/sdcorejs-angular
target_root_kind: target-project
git_head: 7bef5e95ca4ebd048acdbff83ad1f64d1da5428d
dirty: true
relevant_dirty_paths:
  - .sdcorejs/docs/angular/2026-07-26-22-08-enhance-layout-account-menu.md
  - .sdcorejs/docs/product/2026-07-26-22-04-layout-account-menu.md
  - .sdcorejs/documentation
  - .sdcorejs/summary.md
  - .sdcorejs/tasks/angular.md
  - .sdcorejs/tasks/current-session.md
  - product
  - versions/v19/projects/sdcorejs-angular/modules/layout
  - versions/v19/projects/showcase/src/app/pages/modules/layout
  - versions/v20
  - versions/v21
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
polish Layout V1/V2/V3 và Showcase. Account menu có additive typed public API
cho role, semantic actions và reactive notification count; không xóa hoặc đổi
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
  `.sdcorejs/docs/angular/2026-07-26-22-08-enhance-layout-account-menu.md`.
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
- Canonical v19 Layout `105/105`, focused v20/v21 `40/40` each, i18n parity
  `521 × 5`, targeted ESLint, v19 library/Showcase builds, sync parity and
  desktop/mobile browser UAT pass.
- Final review/repair added localized V1 rail-toggle accessible names and made
  the documented `router.navigate` callbacks compile-safe for
  `Promise<void>`.
- User guide, technical doc and product traceability are current for the
  account-menu feature.
- Follow-up outside this feature: audit editable `SdInput` instances that
  inherit `aria-hidden="true"` from global container semantics.
- Branch remains local until explicit push/PR delivery authorization.

## Freshness

This summary reflects repository HEAD `7bef5e9`, branch
`feat/layout-navigation-polish`, and the verified local Layout V1/V2/V3
working-tree changes on 2026-07-26. Delivery remains local until explicit
push/PR authorization.
