# Hiển thị thay đổi trước và sau

Dùng `SdAuditDiff` cho màn hình lịch sử chỉnh sửa, phê duyệt hoặc kiểm toán cần so sánh hai snapshot. Component tự tách nested object thành các field thay đổi và hỗ trợ hai chế độ `table` / `detail-list`.

## Khi nào nên dùng

- Xem các field đã đổi trong một bản ghi.
- So sánh phiên bản trước/sau khi phê duyệt.
- Trình bày item thêm, xóa hoặc đổi trong mảng có stable key.
- Che hoặc loại bỏ field nhạy cảm trước khi template nhận dữ liệu.

Không dùng component để tải audit log hoặc quyết định người dùng có quyền xem dữ liệu hay không.

## Import

```ts
import { SdAuditDiff, SdAuditDiffOptions } from '@sdcorejs/angular/components/audit-diff';
```

## Cách dùng nhanh

```ts
readonly before = { profile: { name: 'Ada', team: 'Sales' }, active: true };
readonly after = { profile: { name: 'Ada', team: 'Finance' }, active: false };

readonly options: SdAuditDiffOptions = {
  fields: [
    { path: 'profile.team', label: 'Team', order: 1 },
    { path: 'active', label: 'Active', order: 2 },
  ],
};
```

```html
<sd-audit-diff [before]="before" [after]="after" [options]="options"></sd-audit-diff>
```

## Quy trình cấu hình

1. Lấy snapshot trước và sau từ cùng một schema nghiệp vụ.
2. Khai báo `fields` cho label, thứ tự, enum, formatter và field nhạy cảm.
3. Với mảng entity, đặt `arrayKey` ở path của mảng và dùng path con dạng `items[].field`.
4. Chọn `mode="table"` cho vùng rộng hoặc `mode="detail-list"` cho panel/mobile.
5. Kiểm tra empty state, dữ liệu nhạy cảm và màn hình hẹp trước khi bàn giao.

## Mảng có stable key

```ts
readonly options: SdAuditDiffOptions = {
  fields: [
    { path: 'lines', arrayKey: 'id' },
    { path: 'lines[].quantity', label: 'Quantity' },
  ],
};
```

Không dùng index làm định danh cho mảng có thể reorder. Stable key giúp reorder thuần túy không tạo thay đổi giả, đồng thời giữ item thêm/xóa và field thực sự đổi.

Nếu key bị thiếu, trùng hoặc không ổn định, engine hiển thị cả array như một thay đổi atomic để tránh mất dữ liệu.

## Dữ liệu nhạy cảm

```ts
readonly options: SdAuditDiffOptions = {
  redactedValue: '••••••',
  fields: [
    { path: 'password', hidden: true },
    { path: 'credentials.token', redacted: true },
  ],
};
```

- `hidden: true`: không tạo row cho field và descendants.
- `redacted: true`: vẫn báo loại thay đổi nhưng thay cả hai giá trị trước khi template nhận dữ liệu.
- Không che dữ liệu chỉ bằng CSS hoặc custom template vì raw value có thể vẫn tồn tại trong DOM/context.

## Format và template tùy biến

Dùng `enumMap` cho code trạng thái đơn giản và `format` cho tiền tệ/ngày giờ. Dùng `sdAuditDiffValue` khi cần badge hoặc domain component:

```html
<sd-audit-diff [before]="before" [after]="after" [options]="options">
  <ng-template sdAuditDiffValue let-value let-row="row" let-side="side">
    <app-audit-value [value]="value" [field]="row.configPath" [side]="side" />
  </ng-template>
</sd-audit-diff>
```

Template nhận giá trị đã được enum/format/redact.

## Accessibility và responsive

- Table mode có header semantic và row header cho tên field.
- Detail-list phù hợp drawer, modal hoặc mobile.
- Empty diff thông báo bằng polite status.
- Không thay đổi DOM order hoặc ẩn Before/After labels chỉ để tiết kiệm diện tích.

## Kiểm tra trước khi phát hành

- Reorder array không tạo thay đổi giả.
- Field hidden không xuất hiện; field redacted không lộ trong DOM.
- `null`, `undefined` và missing value hiển thị đúng.
- Formatter lỗi không làm mất các row khác.
- Table không làm tràn toàn trang trên mobile.

Showcase: `/v/latest/components/audit-diff/examples`. Script ảnh dùng mục `audit-diff` trong `capture-screenshots.playwright.mjs`.
