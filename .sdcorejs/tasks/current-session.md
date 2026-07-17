---
updated_at: 2026-07-17T15:32:00+07:00
status: complete
track: angular
active_skill: sdcorejs-debug
branch: fix/loading-multi-tab
---

# Current Session Checkpoint

## User Request

Port commit fix `SdLoadingService` khi nhiều router tab cùng tồn tại từ `lib-core-angular` sang `sdcorejs-angular`.

## Tasks

- [x] Xác định commit nguồn và root cause của lỗi nhiều tab
- [x] Kiểm tra working tree, phạm vi file an toàn và context dự án
- [x] Port bản fix tối thiểu cùng regression test phù hợp
- [x] Chạy focused test và các kiểm tra rộng hơn cần thiết
- [x] Hoàn tất verify-before-done và báo cáo kết quả/rủi ro còn lại

## Current State

- Last completed: Chuyển sang feature branch và verify đầy đủ v19/v20/v21 trước Git artifact.
- In progress: none.
- Blocked/skipped: Không còn blocker; giữ nguyên changelog dirty có sẵn, không có content diff.

## Artifacts Touched

- EDIT `.sdcorejs/tasks/current-session.md` - checkpoint cục bộ của phiên hiện tại.
- EDIT `versions/v19/projects/sdcorejs-angular/services/loading/src/loading.service.ts` - cập nhật mọi host khớp selector.
- EDIT `versions/v19/projects/sdcorejs-angular/services/loading/src/loading.service.spec.ts` - thêm 3 regression tests multi-host.
- EDIT `versions/v19/projects/sdcorejs-angular/services/loading/sd-loading.md` - cập nhật contract multi-match.
- EDIT `versions/v19/projects/showcase/src/app/pages/services/loading/loading-demo.component.ts` - thêm demo nhiều tab/host.
- EDIT matching loading service/spec/docs/demo under `versions/v20` and `versions/v21` - rollout từ v19.
- EDIT `versions/v19/SYNC-STATUS.md`, `versions/v20/SYNC-STATUS.md`, `versions/v21/SYNC-STATUS.md` - metadata do rollout script cập nhật.

## Verification

- `npm --prefix versions/v19 run build` - pass.
- `npm --prefix versions/v19 run lint` - pass sau normalize CRLF.
- Angular CLI trực tiếp, focused loading spec v19 - pass `15/15` (chạy lại trên final source).
- `npm run sync` / `npm run check:sync` - pass.
- `npm run lint:release` - pass trên v19/v20/v21.
- `git diff --check` - pass.
- Focused loading spec v20/v21 - pass `15/15` mỗi workspace sau khi hydrate local dependency theo repo policy.
- Build v20/v21 - pass.
- Hai lệnh focused qua `npm run ng` - timeout do flags không truyền tới process con; không phải test result.
- Branch-ready scans - không có secret, debug/focused-test marker, conflict marker hay binary ngoài dự kiến.

## Resume From Here

Không còn bước code nào; nếu cần Git artifact, refresh dependency install v20/v21, chạy lại focused tests và làm việc trên feature branch.
