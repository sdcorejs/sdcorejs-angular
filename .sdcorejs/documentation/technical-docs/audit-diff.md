# Kiến trúc Audit Diff

## Mục đích

`sdBuildAuditDiff(before, after, options)` là pure engine, không phụ thuộc Angular. Engine chuẩn hóa hai snapshot thành các leaf row có thứ tự ổn định; `SdAuditDiff` chỉ đảm nhiệm trình bày semantic table hoặc detail list.

Không dùng component này làm nơi tải audit log, phân quyền hay che dữ liệu bằng CSS. Backend/host phải cung cấp hai snapshot đã được phép xem; engine áp dụng `hidden` và `redacted` trước khi trả row cho template.

## Public entrypoints

| Entrypoint | Vai trò |
| --- | --- |
| `@sdcorejs/angular/components/audit-diff` | `SdAuditDiff`, `sdBuildAuditDiff`, models và value-template directive |
| `SdAuditDiff` | Standalone, OnPush presentation component |
| `sdBuildAuditDiff()` | Pure diff engine dùng được ngoài Angular template |
| `SdAuditDiffValueTemplateDirective` | Custom renderer với context `$implicit`, `row`, `side` |

Nguồn canonical nằm tại `versions/v19/projects/sdcorejs-angular/components/audit-diff/`; v20/v21 được sinh bằng root sync.

## Data flow

```text
before + after + SdAuditDiffOptions
  -> traverse plain object / atomic value / configured stable array
  -> classify added | removed | changed | unchanged
  -> apply hidden/redacted/enum/formatter rules
  -> create deterministic SdAuditDiffRow[]
  -> render table or detail-list
```

`includeUnchanged` mặc định tắt. `rootLabel` chỉ thay label localized khi so sánh scalar ở root.

## Stable arrays

Rule `arrayKey` tạo map theo key có cả type: `number:1` khác `string:1`. Item chung key được diff theo canonical config path như `items[].field`; instance path dùng token đã URI-encode để row ID không trùng.

Engine fallback cả array thành một atomic row khi key:

- bị thiếu hoặc trùng;
- không thuộc nhóm `string | number | bigint | boolean | null`;
- không thể resolve ổn định.

Item mới/xóa vẫn recurse theo field con khi stable-key contract hợp lệ, vì vậy hidden/redacted rules không bị bỏ qua. Array không có `arrayKey` giữ semantics atomic và order-sensitive.

## Field contracts

`SdAuditDiffField` hỗ trợ:

- `path`, `label`, `order`;
- `hidden`, `redacted`;
- `arrayKey` cho stable arrays;
- `enumMap` và `format(value, context)`.

`null`, explicit `undefined` và missing side là ba trạng thái riêng. Formatter chạy sau classification; nếu formatter ném lỗi, engine fallback về enum/raw normalized value và tiếp tục phần diff còn lại.

## Security invariants

- Path `hidden` và toàn bộ descendants không tạo row.
- Raw value của path `redacted` không được lưu trong `SdAuditDiffRow`.
- Custom template chỉ nhận giá trị đã map/format/redact.
- Cyclic graph được containment bằng active traversal sets; sibling changes vẫn được giữ.
- Che text bằng CSS hoặc custom template không thay thế `hidden`/`redacted`.

## Presentation and accessibility

Table mode dùng column headers và `scope="row"`; detail-list dùng `dl`/`dt`/`dd`. Empty diff là polite status. Table scroll ngang trong host hẹp; detail-list chuyển về một cột dưới `640px`.

Copy trạng thái và Before/After đi qua i18n. CSS chỉ xử lý layout/overflow, không tham gia classification hoặc redaction.

## Dependencies

- Angular component phụ thuộc signals, OnPush và `I18nService`.
- Pure engine không phụ thuộc DOM, Router hoặc transport.
- Consumer chịu trách nhiệm tải snapshot, permission check và schema/domain mapping.

## Verification

- Pure-engine specs kiểm tra nested objects, scalar root, stable arrays, typed keys, reorder, formatter errors, hidden/redacted fields và cyclic graphs.
- Component specs kiểm tra semantic table/detail list, custom template, empty state, localization và responsive/accessibility attributes.
- Showcase route: `/v/latest/components/audit-diff/examples`.
- Release acceptance: focused audit/public API slice và full source-only suite đều pass; xem `.sdcorejs/docs/angular/2026-07-23-07-24-production-ready-1-4-quality-gate.md`.
