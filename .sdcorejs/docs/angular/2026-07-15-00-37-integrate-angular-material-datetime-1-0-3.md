# Tích hợp angular-material-datetime 1.0.3 — 2026-07-15 00:37

## Yêu cầu

Tích hợp package đã deploy `@sdcorejs/angular-material-datetime@1.0.3` vào `sd-datetime` của `@sdcorejs/angular`, rollout đồng nhất cho Angular 19, 20 và 21, rồi chạy full tests, review/repair và tạo tài liệu theo lựa chọn của người dùng.

## Thay đổi đã thực hiện

- EDIT `versions/v19/package.json`, `versions/v19/package-lock.json` — pin exact workspace dependency `1.0.3`.
- EDIT `versions/v19/projects/sdcorejs-angular/package.json`; VERIFY `ng-package.json` — giữ package trong published dependency metadata và xác nhận ng-packagr allow-list đã đúng từ baseline.
- EDIT `versions/v19/projects/sdcorejs-angular/forms/datetime/src/datetime.component.ts` — dùng public package API; seed committed state bằng `setValue()` trước `open()`.
- EDIT `versions/v19/projects/sdcorejs-angular/forms/datetime/src/datetime.component.spec.ts` — thêm integration/regression coverage cho package UI, staged actions, model ban đầu và external model update.
- EDIT `versions/v19/projects/sdcorejs-angular/forms/datetime/sd-datetime.md` — ghi rõ package `1.0.3` và component-scoped adapter boundary.
- EDIT các artifact tương ứng dưới `versions/v20` và `versions/v21` — rollout bằng root sync, sau đó cập nhật lockfile riêng.
- DELETE `versions/v20/projects/sdcorejs-angular/forms/datetime/src/material-datetime/` và thư mục tương ứng ở v21 — bỏ vendored implementation; package ngoài là owner duy nhất.
- CREATE `.sdcorejs/specs/angular/2026-07-14-23-27-integrate-angular-material-datetime-1-0-3.md` và `.sdcorejs/plans/angular/2026-07-14-23-46-integrate-angular-material-datetime-1-0-3.md` — approved immutable snapshots.
- CREATE `.sdcorejs/documentation/technical-docs/integration-angular-material-datetime-1-0-3.md` — technical integration/maintenance reference.
- CREATE `.sdcorejs/documentation/user-guides/datetime.md` và `capture-screenshots.playwright.mjs` — user guide cùng script chụp ảnh tùy chọn; không tạo ảnh giả khi browser/Playwright không khả dụng.
- CREATE `.sdcorejs/memories/angular/test-dist-can-shadow-source.md` và UPDATE `.sdcorejs/memories/MEMORY.md` — ghi nhớ việc generated dist có thể che source trong test resolution.

## Quyết định

- Pin exact `1.0.3` ở cả workspace và published library manifest để tránh silent drift ở package seam.
- Giữ public entrypoint `@sdcorejs/angular/forms/datetime`; consumer không import package picker trực tiếp.
- Cung cấp `SdNativeDateAdapter`, Material/package date-format tokens ở component scope để không bắt consumer cấu hình app-level adapter.
- Giữ v19 là source of truth; v20/v21 chỉ nhận thay đổi qua `npm run sync`.
- Review phát hiện `select()` trước `open()` không phù hợp lifecycle 1.0.3 vì `open()` reset draft từ committed state. Hai regression test được viết RED trước; fix chuyển sang `setValue()` và đã GREEN.
- Không nâng/chỉnh Angular dependency minors vì nằm ngoài approved scope.

## Verification

- Focused `datetime.component.spec.ts`: v19/v20/v21 đều `66/66`, exit `0`.
- Production library builds: v19/v20/v21 đều exit `0`.
- Built FESM: cả ba major chứa `picker.setValue(...)` trước `picker.open()` và import package qua public root.
- Exact dependency checks: cả ba workspace resolve `@sdcorejs/angular-material-datetime@1.0.3`, exit `0`.
- `npm run check:sync`: exit `0`.
- `git diff --check`: exit `0`.
- Review + repair: finding High/BLOCKER đã được sửa; re-review còn `0` finding mở.
- Full library suites: mỗi workspace `3156 pass`, `18 fail`, `9 skip`, exit `1`; cùng 18 lỗi ngoài datetime diff và coverage thresholds toàn cục chưa đạt.
- Showcase `/forms/datetime`: serve/HTTP `200`; fresh browser discovery trả `No browser is available`, nên visual/click smoke chưa chạy.

## Follow-up còn mở

- Full library suite trên mỗi workspace có cùng `3156 pass`, `18 fail`, `9 skip`. Các failure nằm ngoài datetime tại Chip/ChipCalendar/Input/InputNumber/Inform/AnchorNav/QuerySavedFiltersMenu và chưa được sửa trong task này.
- Deep `npm ls` v20 vẫn exit `1` do Angular peer-minor mismatch có sẵn trong HEAD; exact package check và single-major lock assertion pass.
- Hai finish-tail artifact hợp lệ theo workflow nhưng vượt literal plan allow-list: screenshot script của user guide và root memory index. Approved spec/plan snapshots không bị sửa; exception này được công bố tại checkpoint thay vì mở rộng migration production scope.

## Product traceability

- Không tạo product ledger: đây là dependency/internal integration không thay đổi product requirement hay business workflow.

## Bước tiếp theo

- Căn chỉnh/defer Angular 20 peer-minor tree, 18 full-suite baseline failures và coverage gate.
- Cung cấp browser backend rồi chạy visual/click smoke AC-8.
- Sau khi các gap được xử lý hoặc defer rõ, chạy lại verify-before-done rồi branch-ready.
- Không commit, push, tag hoặc publish nếu chưa có yêu cầu riêng của người dùng.

## Quyết định ship

- Ngày 2026-07-15, sau khi nhận báo cáo `6 PASS / 3 PARTIAL`, full-suite failures và browser gap, người dùng yêu cầu commit và push lên nhánh `release/1.3`.
- Quyết định này được ghi nhận là ship-with-known-gaps cho nhánh release; không đổi AC-7/AC-8/strict AC-9 thành pass và không che 18 failure ngoài datetime.
- Phạm vi chỉ gồm commit/push branch; không tag, publish npm hoặc tạo GitHub Release.
- Pre-commit lint phát hiện line-ending LF ở các dòng datetime mới; repair loop chuẩn hóa bằng Prettier, sync lại v20/v21 và scoped ESLint pass trên cả ba workspace.

## Skill provenance

Các workflow chính: `sdcorejs-brainstorming` → `sdcorejs-spec` → `sdcorejs-plan` → `sdcorejs-execute-plan`/parallel dispatch → `sdcorejs-angular` + `sdcorejs-test` → `sdcorejs-review` → `sdcorejs-repair-loop` → `sdcorejs-documentation`.
