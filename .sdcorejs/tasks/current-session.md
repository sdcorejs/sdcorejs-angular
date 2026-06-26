---
updated_at: 2026-06-26T01:18:00+07:00
status: complete
track: angular
active_skill: sdcorejs-debug, test-driven-development, sdcorejs-angular
branch: release/0.10
---

# Current Session Checkpoint

## User Request

Sửa form-builder: kéo upload/chip-calendar đang tạo sai thành chip-string; cải thiện drop indicator thành placeholder nét đứt thể hiện element sắp drop.

## Tasks

- [x] Tái hiện và cô lập lỗi map palette item trong form-builder
- [x] Viết regression tests cho type mapping và drop placeholder
- [x] Sửa v19: mapping component + placeholder drag/drop
- [x] Sync v20/v21 và chạy verification
- [x] Cập nhật checkpoint và tổng kết

## Current State

- Last completed: synced v20/v21 and completed focused tests, per-version builds, lint release, and diff check.
- In progress: None.
- Blocked/skipped: None.

## Artifacts Touched

- EDIT `.sdcorejs/tasks/current-session.md` - checkpoint for current form-builder drag/drop fix.
- EDIT `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.spec.ts` - RED regression tests for palette data and drop placeholder.
- EDIT `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.ts` - prefer `event.item.data` for palette drops and block inline drops on full rows.
- EDIT `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.html` - custom CDK drag placeholder with dragged item icon/title/meta.
- EDIT `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.scss` - dashed content placeholder replacing rail-only indicators.
- EDIT `versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/*` - synced from v19.
- EDIT `versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/*` - synced from v19.

## Verification

- RED `npm run test -- --watch=false --browsers=ChromeHeadless --include="projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.spec.ts"` in `versions/v19`: `TOTAL: 2 FAILED, 16 SUCCESS`; failures match upload/chip-calendar falling back to `chip-string` and missing dashed placeholder.
- RED same focused spec after adding full-row predicate regression: `TOTAL: 3 FAILED, 16 SUCCESS`.
- PASS same focused spec after implementation in `versions/v19`: `TOTAL: 19 SUCCESS`.
- PASS `npm run sync` at repo root.
- PASS focused form-builder spec in `versions/v20`: `TOTAL: 19 SUCCESS`.
- PASS focused form-builder spec in `versions/v21`: `TOTAL: 19 SUCCESS`.
- PASS final focused form-builder spec in `versions/v19`: `TOTAL: 19 SUCCESS`.
- PASS `npm --prefix versions/v19 run build`.
- PASS `npm --prefix versions/v20 run build`.
- PASS `npm --prefix versions/v21 run build`.
- PASS `npm run lint:release`: all files pass linting for v19/v20/v21.
- PASS `git diff --check`: exit 0; only Windows LF/CRLF warnings.
- NOTE `npm run build:release` is not defined in the root package, so per-version build scripts were used instead.

## Resume From Here

Review the diff, then commit/push when requested. Worktree still contains previous docs/pipes changes from the earlier session.
