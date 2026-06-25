---
updated_at: 2026-06-25T22:24:00+07:00
status: complete
track: angular
active_skill: sdcorejs-debug, test-driven-development, sdcorejs-angular
branch: release/0.10
---

# Current Session Checkpoint

## User Request
Sửa lỗi bấm xem thử Form Generic bị `NG01000` trong `form-render.component.ts`, cải thiện drag/drop preview chưa ổn, và chỉnh styling nút thiết kế/xem thử cho hợp Material Design hơn.

## Tasks
- [x] Tái hiện và cô lập lỗi xem thử Form Render
- [x] Viết regression test RED cho `setValue` khi control chưa đăng ký
- [x] Sửa v19 Form Render và drag/drop preview/button styling
- [x] Sync sang v20/v21 và chạy verification
- [x] Báo kết quả và trạng thái commit/push

## Current State
- Last completed: Đã sync bản sửa sang v20/v21, chạy lint release, focused tests, build library v19/v20/v21, build showcase v19, và kiểm tra server showcase v19 trả HTTP 200.
- In progress: None.
- Blocked/skipped: None.

## Artifacts Touched
- EDIT `.sdcorejs/tasks/current-session.md` - checkpoint bugfix hiện tại.
- EDIT `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.component.ts` - tránh full `setValue` khi controls chưa đăng ký.
- EDIT `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.component.spec.ts` - regression cho preview form rỗng.
- EDIT `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/variable/*` - tránh `setValue` full entity khi set variable.
- EDIT `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.html` - drag preview có icon/label và aria-selected cho mode tabs.
- EDIT `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.scss` - drop rail/preview/toggle styling.
- SYNC `versions/v20/**` - đồng bộ thay đổi Form Generic từ v19.
- SYNC `versions/v21/**` - đồng bộ thay đổi Form Generic từ v19.

## Verification
- RED confirmed: focused Form Render/Variable specs failed with `NG01000`/`NG01001` before fix.
- PASS `npm run lint:release`.
- PASS focused Form Generic tests in `versions/v19`, `versions/v20`, `versions/v21`: `TOTAL: 15 SUCCESS` each.
- PASS `npm run build` in `versions/v19`, `versions/v20`, `versions/v21`.
- PASS `npx ng build showcase` in `versions/v19`; Sass deprecation warnings remain from existing core SCSS.
- PASS `Invoke-WebRequest http://127.0.0.1:4200/`: HTTP 200.

## Resume From Here
Changes are local and uncommitted in `release/0.10`. Showcase v19 is still running at `http://127.0.0.1:4200/`.
