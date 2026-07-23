---
generated_at: 2026-07-23T15:55:00+07:00
git_head: e6ec1eb242e84dc6be34cd42eb617c1d002b612e
branch: chore/prepare-1.4
tracks: [angular]
generator: sdcorejs-explore
---

# Project Summary - sdcorejs-angular

## What this project is

Repository nguồn của `@sdcorejs/angular`, duy trì cùng feature surface cho
Angular 19, 20 và 21. Release `1.4` đã được chuẩn bị, kiểm chứng và push trên
branch hiện tại; tag, GitHub release và npm publish chưa nằm trong phạm vi đã
thực hiện.

## Stack & track

- Track: Angular library + Angular Showcase/docs application.
- Stack: Angular, Angular Material/CDK, TypeScript, RxJS, ng-packagr.
- Testing: Jasmine/Karma/ChromeHeadless, Angular ESLint, generator tests.
- Package manager và task runner: npm + PowerShell repository scripts.

## Architecture map

- Canonical library source: `versions/v19/projects/sdcorejs-angular`.
- Generated mirrors: `versions/v20` và `versions/v21`.
- Canonical Showcase/docs source: `versions/v19/projects/showcase`.
- Root release docs: `CHANGELOG.md`, `docs/npm-README.md`,
  `docs/migrations/1.4.md`.
- Workspace rollout: `npm run sync`; parity guard: `npm run check:sync`.
- Current feature target:
  `versions/v19/projects/sdcorejs-angular/components/table`.

## Reusable building blocks

- Standalone Angular components using signals and `OnPush`.
- Typed secondary entrypoints with sibling tests and Markdown documentation.
- `SdTable` owns the existing server/local load, filter, reload, export and
  paginator flows; feature changes should preserve those public contracts.
- Showcase changelog is generated from root `CHANGELOG.md` through
  `npm run generate:showcase-changelog`.

## Conventions detected

- Edit canonical shared implementation in v19, then run root sync for v20/v21.
- Do not hand-edit generated Showcase changelog, generated mirrors, `dist/**` or
  `published-docs/**`.
- Regression fixes use RED-first focused specs before minimal implementation.
- Keep export and paginator predicates independent from reload visibility.
- Commit, push, tag and publish are explicit delivery actions, not implicit
  execution steps.

## Reuse cheatsheet

- Focused table spec:
  `versions/v19/projects/sdcorejs-angular/components/table/src/table.component.spec.ts`.
- Reload template:
  `versions/v19/projects/sdcorejs-angular/components/table/src/table.component.html`.
- Public table guide:
  `versions/v19/projects/sdcorejs-angular/components/table/sd-table.md`.
- Release note source: `CHANGELOG.md`.
- Approved execution contract:
  `.sdcorejs/plans/angular/2026-07-23-12-29-sd-table-empty-reload.md`.

## Open context

- Requested behavior: a configured reload action remains enabled and clickable
  for `{ items: [], total: 0 }`.
- The approved implementation and verification-amendment plans have been
  executed sequentially with RED/GREEN regression evidence.
- Canonical v19 source, Angular 20/21 mirrors, changelog, user guide and
  technical documentation are updated.
- Full tests, focused cross-version tests, release lint, library builds,
  Showcase build, code review and browser smoke have passed; only the fresh
  final integrity gate and explicitly requested commit/push remain.
- Branch `chore/prepare-1.4` is ahead of upstream by the approved design
  snapshot plus the pending feature commit.

## Freshness

This summary reflects HEAD `e6ec1eb`, the current empty-result reload working
tree, its approved plans, completed verification/repair evidence, and the
explicit commit/push delivery request on 2026-07-23.
