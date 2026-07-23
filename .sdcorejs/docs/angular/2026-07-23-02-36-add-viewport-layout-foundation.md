# Hoàn thiện viewport foundation và layout compatibility — 2026-07-23 02:36

## Yêu cầu

Tiếp tục release production-ready theo plan đã duyệt, thực thi Task 7 bằng TDD, giữ tương thích `SdLayout` V1/V2/V3, thêm demo/tài liệu mức đầy đủ và chạy review + repair loop.

## Thay đổi

- CREATE `versions/v19/projects/sdcorejs-angular/services/viewport/**` — model, tokens, signal service, specs, secondary entrypoint và component doc.
- EDIT `versions/v19/projects/sdcorejs-angular/services/index.ts` và root public API spec — export viewport foundation.
- EDIT `versions/v19/projects/sdcorejs-angular/modules/layout/services/responsive/**` — legacy token/service delegate sang shared viewport source.
- EDIT `versions/v19/projects/sdcorejs-angular/modules/layout/components/layout-main/**` — giữ injection seam cũ và test live V1/V2/V3 transitions.
- CREATE `versions/v19/projects/showcase/src/app/pages/services/viewport/**` — live demo và focused test.
- EDIT Showcase registry/generated sources và root route-shell expectation — 87 pages, 268 examples, 1336 route definitions.
- CREATE `.sdcorejs/documentation/user-guides/viewport-responsive-layout.md` và `.sdcorejs/documentation/technical-docs/viewport-responsive-layout.md`.
- EDIT screenshot capture script — thêm route/selector Viewport, chưa capture ảnh.

## Quyết định

- Default breakpoints dùng min-width `{ mobile: 0, tablet: 768, desktop: 1024 }`; invalid/unordered custom set fallback atomic.
- SSR giữ deterministic desktop fallback bằng `Number.MAX_SAFE_INTEGER` và không đọc browser global khi token là `null`.
- `SD_LAYOUT_VIEWPORT` là alias của `SD_VIEWPORT`; `SdLayoutResponsiveService` delegate width, không sở hữu listener thứ hai.
- Giữ `SdLayoutComponent` inject legacy service để consumer/test provider override không bị breaking.
- `innerHeight` optional trong adapter để type cũ chỉ có width vẫn tương thích.
- Chỉ sửa v19; v20/v21 rollout ở Task 14.

## Câu hỏi mở / việc tiếp theo

- Bắt đầu Task 8 `SdBreadcrumb` và `SdDataState` bằng RED behavior/a11y/router tests.
- Rollout v20/v21 và published doc mapping ở Task 14.
- Full source-only suite 15 failures cùng missing i18n scripts vẫn phải repair trước final Task 15 gate.
- Browser visual smoke viewport/layout ở desktop/tablet/mobile nằm trong Task 15.

## Product traceability

- Nguồn yêu cầu: `docs/superpowers/plans/2026-07-21-production-ready-1-4-release.md`, Task 7.
- User guide: `.sdcorejs/documentation/user-guides/viewport-responsive-layout.md`.
- Trạng thái: implementation/focused acceptance hoàn tất ở v19; rollout và full release gate còn mở.

## Hành động đề xuất tiếp theo

- Inventory router/page/navigation primitives và data-state patterns hiện có.
- Viết RED tests Task 8 trước component production code.

## Skill provenance

Skills đã dùng: `sdcorejs-angular` → `test-driven-development` → `sdcorejs-review` → `sdcorejs-repair-loop` → `sdcorejs-documentation` → `verification-before-completion`; tails `auto-docs` và `auto-task-tracker`.
