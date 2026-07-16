---
updated_at: 2026-07-16T16:54:48+07:00
status: in_progress
track: angular
active_skill: sdcorejs-ship
branch: feat/clearable-form-controls
---

# Current Session Checkpoint

## User Request

Commit và push toàn bộ thay đổi feature `clearable` đã được verify trước khi chuyển sang task khác.

## Tasks

- [x] Chọn phương án branch an toàn
- [x] Tạo `feat/clearable-form-controls` và xác nhận working tree được giữ nguyên
- [x] Chạy verify-before-done trên final diff
- [x] Chạy branch-ready gate
- [ ] Stage explicit feature scope và tạo Conventional Commit
- [ ] Push branch, xác nhận upstream và working tree sạch

## Current State

- Last completed: Branch-ready sweep không có blocker; secret/debug/conflict/binary scans sạch, chỉ còn warning 17 full-suite baseline failures ngoài changed scope.
- In progress: Freshness re-check sau write cuối, rồi stage explicit scope.
- Blocked/skipped: Không có blocker; focused command đúng pass `333/333`, full-suite baseline warning được ghi rõ.

## Artifacts Touched

- EDIT `versions/v19/projects/sdcorejs-angular/forms/{input,input-number,input-color,date,datetime}/**` — public input, template gating, specs và component references.
- EDIT `versions/v19/projects/sdcorejs-angular/components/table/**` — opt-in clearable cho column/external filters và specs.
- EDIT `versions/v20/**`, `versions/v21/**` — rollout từ v19 qua root sync.
- CREATE `.sdcorejs/documentation/technical-docs/clearable-form-controls-and-table-filters.md` — technical contract và migration notes.
- CREATE `.sdcorejs/docs/angular/2026-07-16-15-32-add-clearable-form-controls.md` — session summary.
- EDIT `.sdcorejs/tasks/current-session.md` — checkpoint phiên hiện tại.
- ALLOW `versions/v19/projects/sdcorejs-angular/components/{form-generic,org-chart,upload-file}/**` — chỉ bốn file lint được xác nhận.
- ALLOW matching paths under `versions/v20/**` and `versions/v21/**` — chỉ qua root sync.
- LOCAL `versions/v19/node_modules/prettier` — khôi phục từ 3.9.5 về lockfile 3.8.3; manifest/lock không đổi.
- NORMALIZE `versions/{v19,v20,v21}/projects/sdcorejs-angular/components/org-chart/src/org-chart.model.ts` — CRLF working-tree normalization, không có textual Git diff.

## Verification

- RED compile proof — pass: thiếu `clearable` trên ba component mới trước implementation.
- `npm --prefix versions/v19 run build` — pass.
- Focused Angular/Karma suite — `333 SUCCESS`, `0 FAILED`.
- `npm run lint:phase:release` — pass.
- `npm run sync` / `npm run check:sync` — pass.
- `git diff --check` — pass.
- Code review + repair — hội tụ, không còn finding.
- Full `npm run lint:release` — blocked bởi 17 Prettier errors ngoài scope; không có lỗi tại changed files.
- Current `npm run lint:release` — fail tại `lint:v19`: đúng 17 Prettier errors trong bốn file đã dự kiến.
- `npm run sync` — pass sau repair pass 1.
- Re-verify pass 1 `npm run lint:release` — v19 pass; v20 fail 3 Prettier errors do formatter version skew; v21 chưa chạy.
- Re-verify pass 2 `npm run lint:release` — pass: v19, v20 và v21 đều `All files pass linting`.
- `npm run check:sync` — pass: v20/v21 match v19.
- Final `git diff --check` — pass, exit code 0.
- Final ship `npm --prefix versions/v19 run build` — pass.
- Final ship focused Angular CLI suite — pass: `333 SUCCESS`, `0 FAILED`.
- Final ship `npm run lint:release` — pass trên v19/v20/v21.
- Final ship `npm run check:sync` / `git diff --check` — pass.
- Full-suite diagnostic direct CLI — `17 FAILED`, `3179 SUCCESS`; mọi failure nằm ngoài feature scope.

## Resume From Here

Re-check final diff fingerprint; nếu không có blocker thì stage explicit scope, commit và push.
