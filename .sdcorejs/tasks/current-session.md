---
updated_at: 2026-07-19T00:06:00+07:00
status: in_progress
track: angular
active_skill: sdcorejs-ship
branch: fix/release-1.3-deploy
---

# Current Session Checkpoint

## User Request

Sửa hai blocker của deploy release 1.3, commit, push và tạo MR vào `release/1.3`.

## Tasks

- [x] Tái hiện và xác định root cause của hai lỗi deploy
- [x] Viết kiểm thử hồi quy rồi sửa parser/config theo TDD
- [x] Đồng bộ v19 sang v20/v21 và chạy toàn bộ kiểm tra release/deploy
- [ ] Kiểm tra vệ sinh nhánh, commit và push
- [ ] Tạo MR vào `release/1.3` và bàn giao link

## Current State

- Last completed: generator tests, branding, route shells, sync parity, lint release và build v19/v20/v21 đều pass.
- In progress: branch-ready hygiene trước commit/push.
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

## Resume From Here

Chạy branch-ready hygiene, rà diff cuối rồi commit bằng explicit paths.
