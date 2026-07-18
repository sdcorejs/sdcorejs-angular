---
updated_at: 2026-07-19T00:12:46+07:00
status: complete
track: angular
active_skill: sdcorejs-git
branch: fix/release-1.3-deploy
---

# Current Session Checkpoint

## User Request

Sửa hai blocker của deploy release 1.3, commit, push và tạo MR vào `release/1.3`.

## Tasks

- [x] Tái hiện và xác định root cause của hai lỗi deploy
- [x] Viết kiểm thử hồi quy rồi sửa parser/config theo TDD
- [x] Đồng bộ v19 sang v20/v21 và chạy toàn bộ kiểm tra release/deploy
- [x] Kiểm tra vệ sinh nhánh, commit và push
- [x] Tạo MR vào `release/1.3` và bàn giao link

## Current State

- Last completed: push commit `ba55b06` và tạo PR #13 vào `release/1.3`.
- In progress: none.
- Blocked/skipped: none.

## Artifacts Touched

- EDIT `.sdcorejs/tasks/current-session.md` - checkpoint cho phiên sửa deploy.
- EDIT `scripts/generate-showcase-example-sources.mjs` - hỗ trợ inline `styles` dạng string hoặc array.
- EDIT `scripts/generate-showcase-example-sources.test.mjs` - regression test cho string đơn.
- EDIT `versions/v19|v20|v21/angular.json` - hiệu chỉnh Showcase component-style budget.
- EDIT `versions/v19|v20|v21/projects/showcase/src/app/docs/generated/example-*.generated.ts` - refresh nguồn ví dụ.
- EDIT `versions/v19|v20|v21/SYNC-STATUS.md` - ghi nhận lần sync mới.

## Verification

- Focused parser regression test - red trước fix, pass sau fix.
- `npm run test:showcase-examples` - pass, 14/14.
- `npm run generate:showcase` - pass, 254 example entries.
- `npm --prefix versions/v19 run build` - pass.
- Production Showcase build - pass với `--configuration production --base-href=/sdcorejs-angular/`.
- `npm run sync` - pass.
- `npm run test:showcase-generators` - pass, 26/26.
- `npm run test:showcase-branding` - pass, 3/3.
- `npm run check:sync` - pass.
- `npm run lint:release` - pass.
- `npm --prefix versions/v20 run build` - pass.
- `npm --prefix versions/v21 run build` - pass.
- Branch hygiene / secret / conflict / focused-test scan - pass.
- Independent code review - pass, no findings.
- Commit: `ba55b06 fix(showcase): unblock release deploy`.
- PR: `https://github.com/sdcorejs/sdcorejs-angular/pull/13`.

## Resume From Here

Review và merge PR #13 vào `release/1.3`; sau đó merge release vào main rồi mới đánh tag `v1.3`.
