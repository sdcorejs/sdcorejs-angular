# Hoàn thiện Breadcrumb và Data State — 2026-07-23 03:06

## Yêu cầu

Tiếp tục release production-ready theo plan đã duyệt, thực thi Task 8 bằng TDD: breadcrumb manual/router-aware có label async, overflow và accessibility; data-state loading/empty/error/forbidden/success có action/template/layout modes; bổ sung Showcase và tài liệu đầy đủ; chạy review + repair loop.

## Thay đổi

- CREATE `versions/v19/projects/sdcorejs-angular/components/breadcrumb/**` — component, secondary entrypoint, tests và API doc.
- CREATE `versions/v19/projects/sdcorejs-angular/components/data-state/**` — component/directive, secondary entrypoint, tests và API doc; tách biệt `utilities/data-state`.
- EDIT components barrel và root public API spec — export/type-check hai surface mới.
- EDIT i18n en/vi/ja/ko/zh — thêm 9 key mặc định cho DataState.
- CREATE Showcase breadcrumb/data-state pages và specs; EDIT registry/routes/generated artifacts — 89 pages, 276 examples, 1366 route-shell definitions.
- CREATE `.sdcorejs/documentation/user-guides/breadcrumb-and-data-state.md` và `.sdcorejs/documentation/technical-docs/breadcrumb-and-data-state.md`.
- EDIT screenshot capture script — thêm hai route/selector, chưa capture ảnh.

## Quyết định

- Manual `items` và router mode dùng cùng async normalization nhưng chỉ router mode phụ thuộc `NavigationEnd`.
- URL string render native anchor; router-command array/action render native button; disabled/current là non-interactive span.
- Resolver lỗi đồng bộ hoặc async chỉ loại item lỗi, không làm vỡ toàn trail; mọi subscription cleanup deterministic.
- DataState success project trực tiếp, không thêm presentation wrapper; custom template nhận typed state/retry/action context.
- Empty `title`/`message` là override hợp lệ; null/undefined dùng locale default.
- Chỉ sửa v19; v20/v21 rollout ở Task 14.

## Review và repair

Bốn finding được khóa bằng test RED trước khi sửa:

1. manual observable labels bị restart sau navigation;
2. empty title/message bị thay bằng translation mặc định;
3. router-command item là anchor thiếu `href`, không keyboard-focusable;
4. synchronous label resolver error thoát khỏi RxJS error boundary.

Sau repair, focused library/public API 26/26 PASS.

## Verification

- Showcase breadcrumb/data-state/registry: 9/9 PASS.
- Showcase generator suites: 27/27 PASS.
- Independent i18n parity: 479 keys × 5 locales, missing/extra = 0.
- Angular lint, v19 package build và production Showcase build PASS.
- Package build xác nhận hai secondary entrypoint mới; Showcase sinh 276 example entries.
- `git diff --check` PASS; không direct-edit v20/v21.

Full source-only Karma baseline 15 failures/9 skipped và function coverage 67,86% < 69% vẫn là release blocker riêng cho Task 15.

## Việc tiếp theo

Bắt đầu Task 9 entity picker và tree select bằng inventory/reuse các primitive select, tree, modal, table và query hiện có; viết RED behavior/a11y/remote/lazy-selection tests trước production code.

## Skill provenance

Skills đã dùng: `sdcorejs-angular` → `test-driven-development` → `sdcorejs-review` → `sdcorejs-repair-loop` → `sdcorejs-documentation` → `verification-before-completion`; tails `auto-docs` và `auto-task-tracker`.
