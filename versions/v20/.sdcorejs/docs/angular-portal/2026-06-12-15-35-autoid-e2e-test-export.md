# AutoId Inspector E2E test export

## Tóm tắt

- Bổ sung `host` vào `SdAutoidInspectorConfiguration` và thêm injection token `SD_AUTOID_INSPECTOR_CONFIGURATION` để cấu hình backend Forge ở cấp app.
- Thêm tính năng `Tạo E2E test` trong tab xuất dữ liệu của AutoId Inspector khi có `host`.
- Public entrypoint chỉ export component, `SdAutoidInspectorConfiguration` và `SD_AUTOID_INSPECTOR_CONFIGURATION`; các model/type scan, audit, export là nội bộ và đã bỏ prefix `Sd`.
- Hỗ trợ gọi backend sinh bộ test ZIP cho hai target:
  - `POST <host>/e2e/test-generator/playwright`
  - `POST <host>/e2e/test-generator/robot`
- File ZIP trả về được tải xuống trực tiếp từ browser; API key AI chỉ nằm ở backend, không đi qua frontend.

## Phạm vi chính

- `autoid-inspector.component.ts/html/scss`: UI chọn Playwright hoặc Robot Framework, trạng thái loading/success/error, gọi API và tải ZIP.
- `autoid-export.service.ts`: thêm helper tải `Blob` để dùng chung cho JSON và ZIP.
- `autoid-inspector-config.model.ts`: thêm `host` và token cấu hình global.
- `autoid-export-format.model.ts` / `autoid-element.model.ts`: đổi các type nội bộ sang tên không có prefix `Sd`.
- `autoid-inspector.component.spec.ts`: bổ sung test ẩn/hiện tính năng, payload gửi backend, tải ZIP và lỗi backend.
- `sd-autoid-inspector.md`: cập nhật contract cấu hình và request backend.

## Verification

- `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/autoid-inspector/src/autoid-inspector.component.spec.ts --progress=false` passed: `TOTAL: 26 SUCCESS`.
- `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/autoid-inspector/src/services/autoid-export.service.spec.ts --progress=false` passed: `TOTAL: 14 SUCCESS`.
- `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/autoid-inspector/src/services/autoid-scanner.service.spec.ts --include=projects/sdcorejs-angular/components/autoid-inspector/src/services/autoid-audit.service.spec.ts --include=projects/sdcorejs-angular/components/autoid-inspector/src/services/autoid-highlight.service.spec.ts --progress=false` passed: `TOTAL: 36 SUCCESS`.
- `npx eslint` trên các file đã chỉnh passed.
- `npm run build` passed.

## Ghi chú

- `npm run lint` đã chạy được sau khi chỉnh schema selector trong `eslint.config.js`, nhưng full lint vẫn fail bởi backlog lint repo-wide ở các module khác. Các file thuộc thay đổi này đã được lint riêng và pass.
