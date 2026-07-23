---
updated_at: 2026-07-24T04:18:17+07:00
status: complete
track: angular
active_skill: sdcorejs-ship
branch: feat/layout-navigation-polish
---

# Current Session Checkpoint

## User Request

Thực thi plan polish Layout V2/V3 theo phương án Soft pill đã duyệt bằng
subagent-driven workflow trong worktree riêng.

## Tasks

- [x] Task 1 - compact account và header V3.
- [x] Task 2 - shared Soft-pill search component.
- [x] Task 3 - tích hợp search vào bốn biến thể V2/V3.
- [x] Task 4 - changelog và tài liệu Layout.
- [x] Task 5 - test/build và browser UI check.
- [x] Task 6 - review, repair và readiness handoff.

## Current State

- Last completed: Task 6 final review, accessibility repair, traceability và
  fresh branch-readiness verification.
- In progress: không có.
- Blocked/skipped: không có; push/PR/tag/release chưa được yêu cầu trong plan
  thực thi này.

## Artifacts Touched

- EDIT `.sdcorejs/summary.md` - refresh architecture/context tại HEAD `39d544e`.
- EDIT `.sdcorejs/tasks/current-session.md` - execution checkpoint.
- CREATE `.sdcorejs/docs/angular/2026-07-24-04-18-layout-v2-v3-navigation-polish.md`
  - session summary, decisions, verification và follow-up.
- CREATE `.sdcorejs/docs/product/2026-07-24-04-18-layout-v2-v3-navigation-polish.md`
  cùng bộ `product/**/layout-v2-v3-navigation-polish.md` - product
  traceability cho 10 acceptance criteria.
- EDIT `.sdcorejs/tasks/angular.md` - đánh dấu Layout polish hoàn tất và xếp
  follow-up accessibility/test quality/delivery.
- EDIT `.sdcorejs/summary.md` - refresh hoàn tất tại implementation HEAD
  `2391516`.

## Verification

- Approved design và implementation plan đã commit.
- Worktree checkout pass sau khi bật Git long-path.
- Root, v19/v20/v21 dependency setup pass; v20 cần `--legacy-peer-deps`;
  package manifest/lock side effects đã được hoàn nguyên.
- v19 focused user-menu/V2/V3 baseline: `18/18 SUCCESS`, exit `0`.
- Core docs inventory/style/Input/Layout preflight: pass; registry `21.1.4`,
  local v19 source remains implementation authority.
- Task 1 RED: 4 behavior tests plus computed-style cascade regressions fail
  đúng nguyên nhân.
- Task 1 GREEN: v19/v20/v21 đều `22/22`, sync/check/diff pass.
- Task 1 spec review pass; quality repair đóng 2 Important findings, re-review
  còn 0 Critical/Important.
- Task 2 RED xác nhận 3 lỗi cascade/token/subscript; GREEN v19/v20/v21 đều
  `6/6`, sync/check/diff pass.
- Task 2 spec review pass; quality re-review còn 0 Critical/Important. Một
  minor assertion icon phụ thuộc Material renderer được ghi nhận; lỗi
  `aria-hidden` global của editable `SdInput` được giữ ngoài scope Layout.
- Task 3 RED: `4/29` regression mới fail đúng do bốn biến thể còn render
  `SdInput` trực tiếp; GREEN v19/v20/v21 changed-spec đều `42/42`.
- Task 3 spec và quality review pass; còn 0 Critical/Important. Một minor
  test coverage end-to-end cho parent filtering/Escape được ghi nhận.
- Task 4 generator/test/sync pass; spec và quality review pass với 0 finding.
- Task 5 full Layout v19 `84/84`; changed-spec v20/v21 `42/42`; ba library
  build và Showcase build pass.
- Browser V2/V3 desktop/mobile pass; search/filter/focus/Escape/body-scroll
  behavior đúng, console `0` error và `0` warning.
- `lint:release` ban đầu phát hiện 178 lỗi Prettier do mixed EOL; repair-loop
  pass 1 commit `b90b656` và lint v19/v20/v21 pass.
- Final review ban đầu phát hiện compact trigger thiếu accessible name; RED/GREEN
  repair commit `2391516` thêm tên hiển thị chỉ ở compact mode.
- Final re-review: `0 BLOCKER`, `0 REQUIRED`, ready.
- Fresh Layout suite trên HEAD hiện tại: v19/v20/v21 đều `84/84 SUCCESS`.
- Fresh `npm run lint:release`, `npm run check:sync` và `git diff --check`: pass.
- Fresh library build v19/v20/v21 và Showcase v19 production build: pass.
- Acceptance audit: `10/10` criteria có requirement, implementation và test/UAT
  evidence; không có product gap.
- Branch scope guards: Layout V1, public barrels và `forms/input` không đổi.

## Resume From Here

Branch đã sẵn sàng tại local. Chỉ tiếp tục push và tạo PR vào `main` khi user
đưa ra yêu cầu delivery rõ ràng; tag/release là bước phê duyệt riêng sau merge.
