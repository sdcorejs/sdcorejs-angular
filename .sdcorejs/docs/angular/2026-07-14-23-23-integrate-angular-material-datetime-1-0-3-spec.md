# Spec - Tích hợp angular-material-datetime 1.0.3 vào sd-datetime - 2026-07-14 23:23

## Change control

Spec này thay thế phần pin phiên bản trong spec đã duyệt
`.sdcorejs/specs/angular/2026-07-14-14-55-integrate-angular-material-datetime.md`.
Mọi quyết định và acceptance criterion còn lại của spec trước vẫn giữ nguyên,
trừ các tham chiếu `1.0.2` được đổi thành `1.0.3`.

Lý do thay đổi: `1.0.2` không có Angular Package Format entrypoint dùng được.
`1.0.3` đã được publish với public export trỏ tới `index.d.ts` và
`fesm2022/sdcorejs-angular-material-datetime.mjs`, đồng thời khai báo peer
`@angular/forms` và dải Angular/CDK/Material `>=19.0.0 <22.0.0`.

## Problem & Goals

Commit `9b5f3f7` đã thay picker vendored trong `SdDatetime` bằng package dùng chung,
thêm regression tests và xóa source trùng lặp ở workspace v19, nhưng chưa thể
xác minh hoặc rollout vì package `1.0.2` bị lỗi đóng gói.

Mục tiêu là hoàn tất migration bằng runtime dependency chính xác
`@sdcorejs/angular-material-datetime@1.0.3`, rollout từ v19 sang v20/v21 và chứng
minh rằng public API cùng hành vi của `SdDatetime` không thay đổi.

## Non-goals

- Không đổi selector, entrypoint, input, output, public method hoặc model format của `SdDatetime`.
- Không chuyển wrapper sang CVA của package ngoài hoặc yêu cầu consumer tự đăng ký adapter.
- Không sửa hay publish repository `angular-material-datetime`.
- Không redesign popup, localized actions hoặc UI của `SdDatetime`.
- Không nâng Angular, Material, CDK, RxJS hay dependency SDCoreJS khác.

## Architecture

`@sdcorejs/angular/forms/datetime` tiếp tục là wrapper SDCoreJS cấp cao, sở hữu
form integration, model normalization, validation, i18n, viewed/inline mode và
localized action row. Package `@sdcorejs/angular-material-datetime@1.0.3` chỉ
sở hữu picker overlay, time spinner, adapter, token và action directives.

Tất cả picker class, adapter class, format token và action directive được import
từ cùng public package entrypoint để giữ Angular DI token identity. Native adapter
providers vẫn ở component scope, vì vậy consumer không cần thêm
`provideSdNativeDateAdapter()` vào `app.config.ts`.

Package là dependency runtime được pin chính xác, không phải peer dependency của
`@sdcorejs/angular`; ng-packagr cho phép dependency này rõ ràng. v19 vẫn là source
of truth; source/manifest được sync sang v20/v21, còn lockfile được cập nhật riêng
trong từng workspace.

Các hướng đã cân nhắc:

1. Dùng runtime dependency `1.0.3` - chọn; giữ trải nghiệm cài đặt hiện tại và loại bỏ source trùng lặp.
2. Chuyển thành peer dependency - không chọn vì buộc consumer cũ cài/configure thêm package.
3. Giữ hoặc khôi phục picker vendored - không chọn vì tiếp tục phân đôi bảo trì và bỏ phí package dùng chung.

## File structure

- `versions/v19/package.json` và `package-lock.json` - pin/resolve `1.0.3` cho workspace nguồn.
- `versions/v19/projects/sdcorejs-angular/package.json` - khai báo runtime dependency được publish.
- `versions/v19/projects/sdcorejs-angular/ng-package.json` - allow-list dependency không phải peer.
- `versions/v19/projects/sdcorejs-angular/forms/datetime/**` - giữ integration/tests/docs đã chuẩn bị, đổi tài liệu sang `1.0.3` và không khôi phục source vendored.
- `versions/v20/**` và `versions/v21/**` tương ứng - rollout source/manifest, xóa source vendored và cập nhật lockfile riêng.

## Acceptance criteria

1. Cả v19/v20/v21 pin và resolve đúng `@sdcorejs/angular-material-datetime@1.0.3`; published package metadata khai báo nó là runtime dependency và ng-packagr chấp nhận dependency.
2. `SdDatetime` chỉ import picker/adapter/token/actions từ public entrypoint của package; không còn import hoặc thư mục `forms/datetime/src/material-datetime` ở ba workspace.
3. Public API và hành vi hiện hữu của `SdDatetime` không đổi, gồm `[(model)]`, `[form]`, emitted format, validation, i18n, viewed/inline và clear/direct-entry flows.
4. Component khởi tạo không lỗi DI và consumer không phải cấu hình provider ở application root.
5. Regression tests chứng minh enabled/disabled open, Apply/Cancel/Now, seconds normalization, min/max forwarding và overlay cleanup hoạt động với package `1.0.3`.
6. Source/manifest v20 và v21 được rollout từ v19; lockfile từng workspace không kéo duplicate Angular major.
7. Focused datetime tests, production library builds v19/v20/v21, dependency-tree checks và `npm run check:sync` đều exit code 0.
8. Browser smoke tại showcase route `/forms/datetime` xác nhận popup, calendar, time spinner, action row tiếng Việt và inline mode vẫn hiển thị/hoạt động đúng, không có console error.
9. Diff cuối không sửa showcase, branding, workflow, scripts, published docs hoặc các path ngoài phạm vi migration.

## Risks & mitigations

- **Risk:** Registry/cache vẫn resolve `1.0.2` hoặc metadata cũ. -> **Mitigation:** pin chính xác `1.0.3`, cập nhật từng lockfile và kiểm tra `npm ls`/lock integrity.
- **Risk:** Trộn import local với package tạo token DI khác identity. -> **Mitigation:** search toàn bộ buildable source và chỉ dùng một public package entrypoint.
- **Risk:** Sync ghi đè thay đổi ngoài scope. -> **Mitigation:** worktree hiện sạch; chụp status/hash trước rollout và review scoped diff sau sync.
- **Risk:** `1.0.3` có thay đổi overlay, validation, accessibility và i18n so với picker vendored. -> **Mitigation:** chạy focused integration tests, production build trên cả ba Angular major và browser smoke trên showcase v19.

## Out of scope (deferred)

- Re-export picker primitives từ `@sdcorejs/angular` - chỉ thực hiện khi có yêu cầu public API riêng.
- Chuyển `SdDatetime` sang `formControlName`/CVA - cần migration spec riêng.
- Visual redesign hoặc đổi localized action labels - không thuộc dependency migration.
- Publish release mới của `@sdcorejs/angular` - thực hiện qua release workflow riêng sau khi branch được duyệt.
