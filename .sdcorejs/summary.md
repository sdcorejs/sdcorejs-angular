---
generated_at: 2026-07-23T08:27:16+07:00
git_head: cc31df58253569ad19b2c90bf4e34f1077c7d954
branch: chore/prepare-1.4
tracks: [angular]
generator: sdcorejs-explore
---

# Project Summary - sdcorejs-angular

## What this project is

Repository nguồn của `@sdcorejs/angular`, duy trì cùng feature surface cho Angular 19, 20 và 21. `versions/v19` là source of truth; root `npm run sync` sinh mirror v20/v21 và `npm run check:sync` kiểm tra parity.

## Stack and architecture

- Angular, Angular Material/CDK, TypeScript, RxJS, ng-packagr.
- Standalone components, signals, `ChangeDetectionStrategy.OnPush`, typed secondary entrypoints.
- Library source: `versions/v19/projects/sdcorejs-angular`.
- Showcase/docs app: `versions/v19/projects/showcase` với typed registry và generated example/changelog artifacts.
- Test/quality: Karma/Jasmine/ChromeHeadless, Angular ESLint, Prettier, generator tests và package dry-run.
- Canonical release docs: `CHANGELOG.md`, `docs/npm-README.md`, `docs/migrations/1.4.md`.

## Release 1.4 surface

- Forms: shared `SdFormControlConnector<T>`, `SdTime`, `SdTimeRange`, input-mask adapters/presets, picker/tree-select controls.
- Services: hardened API/loading/cache/storage; graph persistence; viewport; unsaved changes; task polling/SSE.
- Components: responsive layout V1/V2/V3, breadcrumb, data-state, job-progress, audit-diff and completed PDF workflows.
- Safety/compatibility: scoped dirty-state guards, bounded async PDF work, SSR-safe browser adapters, cleanup/teardown contracts and preserved legacy injection seams.
- Documentation: component/service API docs, migration guide, user/technical guides, Showcase examples and generated changelog.

## Reuse conventions

- Chỉ sửa canonical shared implementation ở v19, sau đó chạy root sync cho v20/v21.
- Mọi public API mới dùng secondary entrypoint có `index.ts`, `ng-package.json`, sibling tests và docs.
- Showcase page dùng `defineDocPage`; generated source/manifest/changelog không chỉnh tay.
- Responsive code dùng shared `SdViewportService`; legacy layout service/token chỉ là compatibility adapter.
- Persistence dùng chung graph serializer, identity/envelope và storage adapter thay vì serializer riêng cho từng service.
- Browser-only behavior đi qua injected token/adapter, có SSR fallback và deterministic cleanup.
- Không hand-edit `published-docs`; commit/push/tag/publish cần bước ủy quyền riêng.

## Current verified state

- Release suffix `1.4` maps to `19.1.4`, `20.1.4`, `21.1.4`.
- Tasks 1-15 của plan production-ready đã hoàn tất trong working tree.
- Full v19 source-only suite: 3,814 passed, 9 skipped, 0 failed; statements 69.70%, branches 60.18%, functions 69.06%, lines 69.97%.
- Showcase 191/191; generators 27/27; branding 3/3.
- i18n v19/v20/v21: 517 keys × 5 locales; hard-code baseline không tăng.
- Release lint, v19/v20/v21 production library builds, v19 production Showcase build và version sync guard đều pass.
- Packages có đúng versions, 95 exports, 94 manifests và không có missing export target; dry-run thành công cho cả ba Angular major.
- Browser smoke desktop/mobile đã kiểm tra các route time/input/entity-picker/tree-select/data-state/job-progress/audit-diff/PDF/viewport chính.
- Audit 113 Markdown và 828 touched text files đã pass; canonical npm README, local links, fences, UTF-8 và 12/12 release documentation contracts đều được kiểm tra.

## Handoff context

- Release unit đã được verify và chuẩn bị thành một Conventional Commit trên `chore/prepare-1.4`; remote hash được đối chiếu ngay sau push thay vì ghi thêm một follow-up commit.
- Chỉ commit và push branch được ủy quyền; không tag, GitHub release hay npm publish trong delivery này.
- Báo cáo quality gate: `.sdcorejs/docs/angular/2026-07-23-07-24-production-ready-1-4-quality-gate.md`.
- Execution plan: `docs/superpowers/plans/2026-07-21-production-ready-1-4-release.md`.
- Checkpoint ưu tiên: `.sdcorejs/tasks/current-session.md`.

## Freshness

Summary phản ánh baseline HEAD `cc31df5`, toàn bộ release implementation, documentation audit và fresh delivery gate ngày 2026-07-23.
