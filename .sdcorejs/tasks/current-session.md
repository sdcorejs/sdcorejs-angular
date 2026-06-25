---
updated_at: 2026-06-26T00:16:30+07:00
status: completed
track: angular
active_skill: sdcorejs-debug, test-driven-development, sdcorejs-angular
branch: release/0.10
---

# Current Session Checkpoint

## User Request
Fix Form Builder drag preview và drop indicator: preview đang lộ icon/name text, indicator còn sát element và đôi lúc drop không khớp vị trí indicator.

## Tasks
- [x] Nắm vấn đề hiện tại và rule v19-first
- [x] Soi template/CSS/drag-drop logic đang gây preview xấu và indicator lệch
- [x] Thêm regression test ở v19
- [x] Sửa v19, sync v20/v21
- [x] Verify và restart showcase 4200
- [x] Commit/push nếu sạch

## Current State
- Last completed: Form Generic focused tests, lint release, sync v20/v21, package builds v19/v20/v21, showcase build v19, route 4200 và branch hygiene đều đã chạy xanh.
- In progress: None.
- Blocked/skipped: None.

## Artifacts Touched
- EDIT `.sdcorejs/tasks/current-session.md` - checkpoint bugfix preview/drop indicator.
- EDIT `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.ts` - thêm row enter predicate để chặn indicator/drop vào row không đủ cột.
- EDIT `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.html` - preview skeleton không text và bind `cdkDragData`.
- EDIT `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.scss` - preview skeleton global và drop placeholder spacer/center rail.
- EDIT `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.spec.ts` - regression preview/drop/predicate.

## Verification
- RED confirmed: form-builder spec failed on missing `canEnterRowDropList` before production change.
- PASS `npm run test -- --watch=false --browsers=ChromeHeadless --include="projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.spec.ts"`: `TOTAL: 17 SUCCESS`.
- PASS focused Form Generic tests v19/v20/v21: `TOTAL: 26 SUCCESS` each.
- PASS `npm run lint:release`.
- PASS package builds v19/v20/v21.
- PASS `npx ng build showcase` in `versions/v19` with existing Sass deprecation warnings only.
- PASS showcase server `http://127.0.0.1:4200/components/form-generic`: HTTP 200, served chunk contains new preview/drop markers.

## Resume From Here
No active task. Continue manual UX review on `http://127.0.0.1:4200/components/form-generic`.
