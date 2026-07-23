---
generated_at: 2026-07-24T04:18:17+07:00
git_head: 239151667dc759cac0405de1ae0f594b729667e9
branch: feat/layout-navigation-polish
tracks: [angular]
generator: sdcorejs-explore
---

# Project Summary - sdcorejs-angular

## What this project is

Repository nguồn của `@sdcorejs/angular`, duy trì cùng feature surface cho
Angular 19, 20 và 21. Release `1.4` đã có trên `main`; công việc hiện tại là
polish nội bộ cho Layout V2/V3, không thay đổi public API.

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

- `SdLayoutUserMenuComponent` owns expanded/compact account disclosure.
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
- Commit, push, PR, tag and publish are separate explicit delivery actions.

## Reuse cheatsheet

- Approved design:
  `docs/superpowers/specs/2026-07-23-layout-v2-v3-navigation-polish-design.md`.
- Approved implementation plan:
  `docs/superpowers/plans/2026-07-23-layout-v2-v3-navigation-polish.md`.
- Shared account component:
  `versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/user-menu`.
- Canonical desktop/mobile sidebars:
  `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-*`.
- Existing form primitive:
  `versions/v19/projects/sdcorejs-angular/forms/input`.
- Layout guide: `versions/v19/projects/sdcorejs-angular/modules/layout/sd-layout.md`.

## Open context

- Layout V2/V3 polish is implemented and verified: compact account triggers are
  centered, collapsed V3 hides its brand and the four menu searches share an
  internal Soft-pill presentation.
- Placeholders, `autoId`, filtering, signal flow, Layout V1 and public barrels
  remain unchanged.
- Angular 19/20/21 Layout suites, release lint, source sync, three library
  builds, Showcase build and desktop/mobile browser UAT pass.
- Final review has `0 BLOCKER` and `0 REQUIRED`; compact account triggers expose
  the display name as their accessible name.
- Follow-up outside this feature: audit editable `SdInput` instances that
  inherit `aria-hidden="true"` from global container semantics.
- Branch remains local until explicit push/PR delivery authorization.

## Freshness

This summary reflects implementation HEAD `2391516`, branch
`feat/layout-navigation-polish`, completed product/session documentation and
fresh verification evidence on 2026-07-24.
