# Hoàn thiện time controls và input masks — 2026-07-23 02:14

## Yêu cầu

Tiếp tục release production-ready `sdcorejs-angular` theo plan đã duyệt, hoàn thiện Task 6 với test đầy đủ, user guide, technical doc, review và repair loop trước khi chuyển sang Task 7.

## Thay đổi

- CREATE `versions/v19/projects/sdcorejs-angular/forms/time/**` — `SdTime`, pure parser/normalizer/validator, picker adapter, specs và component doc.
- CREATE `versions/v19/projects/sdcorejs-angular/forms/time-range/**` — `SdTimeRange`, aggregate validation, endpoint state propagation, specs và component doc.
- CREATE/EDIT `versions/v19/projects/sdcorejs-angular/forms/input/**` — public mask adapter/parser/presets và raw/display/IME integration cho `SdInput`.
- EDIT `versions/v19/projects/sdcorejs-angular/forms/**`, `i18n/**` và public API specs — exports, module wiring, validation messages với parity năm locale.
- CREATE/EDIT `versions/v19/projects/showcase/**` — demo time, time-range, input masks, registry và generated example sources.
- CREATE `.sdcorejs/documentation/user-guides/time-controls-and-input-masks.md` — hướng dẫn sử dụng và migration.
- CREATE `.sdcorejs/documentation/technical-docs/time-controls-and-input-masks.md` — contract, kiến trúc, accessibility và verification evidence.
- EDIT `.sdcorejs/documentation/user-guides/capture-screenshots.playwright.mjs` — thêm targets cho time, time-range và input.

## Quyết định

- Public time-only model dùng `string | null | undefined`, emit canonical `HH:mm`; `Date` chỉ nằm trong picker adapter.
- Masking là opt-in; form/model giữ raw value, native input giữ display value và parser dùng pattern cursor để không làm mất numeric literals.
- `SdTimeRange` tổng hợp invalid state từ endpoint controls, hỗ trợ clear raw invalid text và truyền `viewed='inline'` xuống children.
- Chỉ sửa source-of-truth v19; rollout v20/v21 giữ ở Task 14.
- Focused Task 6 PASS không thay thế full release gate: clean source-only suite hiện còn 15 failures và function coverage dưới threshold.

## Câu hỏi mở / việc tiếp theo

- Full v19 source-only suite còn 15 failures ở Chip, ChipCalendar, QuerySavedFiltersMenu, AnchorNav, Cache, Inform và Loading; repair trước final Task 15 gate.
- Hai scripts `check:i18n`/`check:i18n-parity` trỏ tới file không tồn tại; sửa hạ tầng verification trước final gate.
- Browser visual smoke cho picker, responsive range và caret mask thực hiện trong Task 15.

## Product traceability

- Nguồn yêu cầu: `docs/superpowers/plans/2026-07-21-production-ready-1-4-release.md`, Task 6.
- Tài liệu người dùng: `.sdcorejs/documentation/user-guides/time-controls-and-input-masks.md`.
- Trạng thái: implementation/focused acceptance hoàn tất ở v19; rollout và full release gate còn mở.

## Hành động đề xuất tiếp theo

- Bắt đầu Task 7 bằng RED tests cho viewport transitions, configurable breakpoints, cleanup và SSR.
- Giữ full-suite failures và missing i18n scripts trong release tracker cho repair/gate Task 15.

## Skill provenance

Skills đã dùng: `sdcorejs-angular` → `test-driven-development` → `sdcorejs-review` → `sdcorejs-repair-loop` → `sdcorejs-documentation` → `sdcorejs-ship`; tails `auto-docs` và `auto-task-tracker`.
