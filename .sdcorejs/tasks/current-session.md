---
updated_at: 2026-07-19T00:30:03+07:00
status: in_progress
track: angular
active_skill: sdcorejs-ship
branch: merge/release-1.3-into-main
---

# Current Session Checkpoint

## User Request

Giải quyết conflict khi merge `release/1.3` vào `main`, rồi push và tạo PR mergeable.

## Tasks

- [x] Tái hiện conflict giữa `origin/release/1.3` và `origin/main`
- [x] Xác định từng file conflict và chọn nội dung đúng theo lịch sử hai nhánh
- [x] Tạo nhánh hòa giải sạch, resolve conflict và chạy verification
- [ ] Commit, push và tạo/cập nhật PR vào `main`
- [ ] Xác minh trạng thái mergeable và bàn giao link

## Current State

- Last completed: generator/branding tests, sync parity, lint, ba library builds và production Showcase build đều pass.
- In progress: branch-ready hygiene trước khi commit merge.
- Blocked/skipped: none.

## Artifacts Touched

- EDIT `.sdcorejs/tasks/current-session.md` - checkpoint cho phiên hòa giải release/main.
- RESOLVE `scripts/generate-showcase-route-shells.test.mjs` - giữ assertions sau khi xóa AuthOM.
- RESOLVE `versions/v19|v20|v21/SYNC-STATUS.md` - giữ metadata release mới nhất.
- EDIT hai spec/plan datetime - bỏ blank line thừa ở EOF để `git diff --check` pass.

## Verification

- `git merge-tree --write-tree origin/main origin/release/1.3` - fail 3/3 với cùng 4 conflict paths.
- `git diff --name-only --diff-filter=U` - pass, 0 unmerged paths sau resolution.
- `npm run test:showcase-generators` - pass, 26/26.
- `npm run test:showcase-branding` - pass, 3/3.
- `npm run generate:showcase` - pass, 254 example entries.
- `npm run check:sync` - pass.
- `npm run lint:release` - pass.
- `npm --prefix versions/v19 run build` - pass.
- `npm --prefix versions/v20 run build` - pass.
- `npm --prefix versions/v21 run build` - pass.
- Production Showcase build - pass với `--configuration production --base-href=/sdcorejs-angular/`.
- Independent merge-resolution review - pass, no Critical/Important/Minor findings.

## Resume From Here

Chạy branch-ready hygiene, stage checkpoint cuối và commit merge.
