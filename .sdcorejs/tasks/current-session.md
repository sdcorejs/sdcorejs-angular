---
updated_at: 2026-06-29T15:43:35+07:00
status: complete
track: angular
active_skill: sdcorejs-review, sdcorejs-angular, sdcorejs-ship
branch: release/0.10
---

# Current Session Checkpoint

## User Request

Ra soat toan bo library de chuan bi release 0.10 hoan thien nhat, gom `@sdcorejs/angular` v19/v20/v21 va dong bo nhung fix an toan.

## Tasks

- [x] Khoanh pham vi audit `@sdcorejs/angular` v19/v20/v21
- [x] Scan pattern Angular 17+ con sot tren source library
- [x] Phan loai quick-safe fix vs risky migration can review rieng
- [x] Apply quick-safe fixes dong bo cac version
- [x] Build/test package, showcase va tong hop finding con lai truoc release

## Current State

- Last completed: Release audit va verification pass cho `@sdcorejs/angular` v19/v20/v21.
- In progress: Khong co.
- Blocked/skipped: Khong migrate wholesale `@Input`/`@Output`/`ViewChild` sang signal API trong release patch vi day la thay doi API/behavior can review theo module.

## Artifacts Touched

- EDIT .sdcorejs/tasks/current-session.md - checkpoint phien release audit.
- EDIT versions/v19/projects/sdcorejs-angular/** - metadata `styleUrl`, DI `inject`, runtime cleanup, test robustness.
- EDIT versions/v20/projects/sdcorejs-angular/** - metadata `styleUrl`, DI `inject`, Sass/runtime cleanup, test robustness.
- EDIT versions/v21/projects/sdcorejs-angular/** - metadata `styleUrl`, DI `inject`, Sass/runtime cleanup, test robustness.
- EDIT versions/v19|v20|v21/projects/showcase/** - giu cac thay doi showcase/table da co trong phien truoc.

## Verification

- PASS `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless`
  - v19 log: `versions/v19/.codex-logs/test-sdcorejs-v19.log`
  - v20 log: `versions/v20/.codex-logs/test-sdcorejs-v20.log`
  - v21 log: `versions/v21/.codex-logs/test-sdcorejs-v21.log`
- PASS `npx ng build sdcorejs-angular`
  - v19 log: `versions/v19/.codex-logs/build-sdcorejs-v19.log`
  - v20 log: `versions/v20/.codex-logs/build-sdcorejs-v20.log`
  - v21 log: `versions/v21/.codex-logs/build-sdcorejs-v21.log`
- PASS `npx ng build showcase`
  - v19 log: `versions/v19/.codex-logs/build-showcase-v19.log`
  - v20 log: `versions/v20/.codex-logs/build-showcase-v20.log`
  - v21 log: `versions/v21/.codex-logs/build-showcase-v21.log`
- PASS `git diff --check`
  - Note: Chi co warning CRLF tu Git, khong co whitespace error.
- PASS risk scan v19/v20/v21:
  - `@Inject(` = 0
  - `provideAnimations(` = 0
  - `BrowserAnimationsModule` = 0
  - `percentage(calc` = 0
  - `ng-reflect-message|ng-reflect-viewed` = 0

## Resume From Here

Release audit complete. Neu tiep tuc, buoc tiep theo la review diff cuoi va commit/push theo yeu cau.
