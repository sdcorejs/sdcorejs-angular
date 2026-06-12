# Gỡ dependency `uuid` khỏi `sd-angular`

## Tóm tắt

- Thay toàn bộ import/call trực tiếp tới package `uuid` trong `projects/sdcorejs-angular` bằng `Utilities.generateUuid()` từ `@sdcorejs/utils/fns`.
- Gỡ dependency trực tiếp `"uuid"` khỏi workspace `package.json` và cập nhật `package-lock.json` bằng `npm uninstall uuid --ignore-scripts`.
- Giữ nguyên các chuỗi i18n/label có chữ `UUID` vì đó là nội dung validator, không phải phụ thuộc package.

## Phạm vi chính

- Các form/component tạo id hoặc control name ngẫu nhiên: input, input-number, textarea, date, datetime, date-range, checkbox, radio, switch, chip, autocomplete, editor, table, upload-file, side-drawer, preview, modal-resizable.
- Các service/plugin cần key ngẫu nhiên: `SdApiService`, layout `MenuPipe`, `VariablePlugin`, generic-select.

## Verification

- `rg` xác nhận không còn `from 'uuid'`, `uuid.v4()`, `uuidv4()` hoặc `v4()` trong TS của `projects/sdcorejs-angular`.
- Diff xác nhận đã gỡ dependency trực tiếp `"uuid": "^11.0.5"` khỏi root `package.json` và top-level entry `node_modules/uuid` khỏi `package-lock.json`.
- `package-lock.json` vẫn còn `uuid` transitively qua `exceljs`/`sockjs`; đây không phải phụ thuộc trực tiếp của `sd-angular`.
- `npm run build` passed.
- `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/upload-file/src/upload-file.component.spec.ts --progress=false` passed: `TOTAL: 77 SUCCESS`.

## Ghi chú

- Test upload-file có warning lặp lại `NG0953: Unexpected emit for destroyed OutputRef`; warning này đã xuất hiện trong lúc test nhưng không làm fail suite và không liên quan trực tiếp tới thay đổi dependency.
