---
module: time-controls-and-input-masks
title: Điều khiển giờ và input mask
tracks: [angular]
generated_at: 2026-07-23T02:00:27+07:00
git_head: cc31df58253569ad19b2c90bf4e34f1077c7d954
routes:
  - { path: /v/latest/forms/time/examples, screen: showcase-time, permission: null }
  - { path: /v/latest/forms/time-range/examples, screen: showcase-time-range, permission: null }
  - { path: /v/latest/forms/input/examples, screen: showcase-input-mask, permission: null }
permissions: []
entities: []
screens: [showcase-time, showcase-time-range, showcase-input-mask]
spec_refs: []
prd_refs: []
coverage: { total: 8, met: 8, partial: 0, missing: 0 }
---

# Điều khiển giờ và input mask - Hướng dẫn sử dụng

## Tổng quan

Nhóm tính năng này bổ sung ba cách nhập dữ liệu cho form Angular:

- `SdTime` nhập hoặc chọn một giờ trong ngày bằng model `HH:mm`, không kèm ngày hay múi giờ.
- `SdTimeRange` nhập hai mốc `{ from, to }`, kiểm tra thứ tự và hỗ trợ khoảng mở.
- `SdInput` với input mask hiển thị dấu phân cách nhưng giữ model dạng raw để gửi API hoặc lưu dữ liệu.

Các component dùng convention `[form]` + `name` và `[(model)]` của SDCoreJS. Chúng không dùng `formControlName`.

## Màn hình và tác vụ

### Nhập một mốc giờ - `/v/latest/forms/time/examples`

- **Nhập trực tiếp:** có thể gõ `9:05`; model được chuẩn hóa thành `09:05`.
- **Chọn bằng picker:** bấm biểu tượng đồng hồ, chọn giờ/phút rồi xác nhận.
- **Giới hạn:** `min`, `max` và `step` kiểm soát biên và bước phút.
- **Sửa lỗi:** text sai như `25:10` vẫn nằm trong ô để sửa, control bị invalid và model hợp lệ trước đó không bị ghi đè.
- **Xóa:** nút xóa xuất hiện khi field có `clearable`, không required và đang editable.

```html
<sd-time [form]="form" name="startTime" label="Giờ bắt đầu" min="08:00" max="18:00" [step]="15" clearable [(model)]="startTime"> </sd-time>
```

### Nhập khoảng giờ - `/v/latest/forms/time-range/examples`

- Hai endpoint cùng cập nhật một model `{ from, to }`.
- Mặc định phải nhập cả hai mốc nếu đã nhập một mốc; bật `allowOpenEnded` để cho phép chỉ có `from` hoặc `to` khi field không required.
- `from` lớn hơn `to` tạo lỗi range.
- `min`, `max` và `step` áp dụng cho từng endpoint.
- Lỗi của endpoint được phản ánh lên group qua message, `aria-invalid` và các thuộc tính `data-*`.
- `viewed=true` hiển thị tĩnh; `viewed='inline'` giữ hai endpoint ở chế độ sửa nội tuyến.

```html
<sd-time-range [form]="form" name="workingHours" label="Giờ làm việc" min="08:00" max="18:00" [step]="15" [(model)]="workingHours">
</sd-time-range>
```

### Nhập dữ liệu có mask - `/v/latest/forms/input/examples`

Mask chỉ thay đổi cách hiển thị. Ví dụ `0901234567` được hiển thị thành `0901 234 567`, nhưng `model`, `sdChange` và FormGroup vẫn nhận `0901234567`.

```html
<sd-input [form]="form" name="phone" label="Điện thoại" mask="VN_PHONE" [(model)]="phone"> </sd-input>
```

Preset có sẵn:

| Preset          | Mục đích                          | Ví dụ display       |
| --------------- | --------------------------------- | ------------------- |
| `VN_PHONE`      | Số điện thoại 10 chữ số           | `0901 234 567`      |
| `VN_ID`         | CCCD 12 chữ số                    | `0123 4567 8901`    |
| `VN_TAX_CODE`   | Mã số thuế, có thể có nhánh 3 số  | `0123456789-001`    |
| `BANK_ACCOUNT`  | Số tài khoản có độ dài biến thiên | raw digits          |
| `BUSINESS_CODE` | Mã nghiệp vụ chữ/số               | `AB12-CD34` tùy raw |

Trạng thái validation được phân biệt thành empty, incomplete, valid và invalid. Mask hỗ trợ nhập giữa chuỗi, xóa, paste, selection, IME/composition và `inputmode` phù hợp trên thiết bị di động.

## Bảng quyền

Các form control không tự áp permission code. Ứng dụng host quyết định quyền xem/sửa bằng route guard, permission directive, `disabled`, `readonly` hoặc `viewed`.

| Permission code | Tác vụ                                    | Vai trò                   |
| --------------- | ----------------------------------------- | ------------------------- |
| -               | Nhập, chọn hoặc xóa giờ và dữ liệu masked | Do ứng dụng host quy định |

## Tham chiếu dữ liệu

| Contract                    | Kiểu                                                                  | Bắt buộc  | Ràng buộc                                      |
| --------------------------- | --------------------------------------------------------------------- | --------- | ---------------------------------------------- |
| `SdTime.model`              | `string \| null \| undefined`                                         | tùy field | Giá trị hợp lệ emit dạng `HH:mm`               |
| `SdTimeRange.model`         | `{ from?: string \| null; to?: string \| null } \| null \| undefined` | tùy field | Mỗi endpoint là `HH:mm`; mặc định `from <= to` |
| `SdInput.model` khi có mask | raw `string \| null \| undefined`                                     | tùy field | Không chứa literal hiển thị của mask           |
| `mask`                      | preset hoặc `SdInputMaskAdapter`                                      | không     | Preset hoặc custom parser/formatter            |

## Action đặc biệt

| Action                      | Kết quả                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| Arrow Up/Down trên `SdTime` | Tăng/giảm theo `step`, clamp trong `min`/`max`                     |
| Mở picker và xác nhận       | Commit chuỗi `HH:mm`; `Date` nội bộ không đi vào model             |
| `SdTimeRange.clear()`       | Xóa cả model hợp lệ lẫn invalid endpoint text                      |
| Paste vào input masked      | Parse lại toàn bộ display, giữ raw model và vị trí caret đã ánh xạ |

## Core UI được dùng

| Core UI         | Vai trò trong feature                     |
| --------------- | ----------------------------------------- |
| `SdTime`        | Editor giờ time-only và picker            |
| `SdTimeRange`   | Group hai endpoint và validation tổng hợp |
| `SdInput`       | Input raw/display khi bật mask            |
| `SdTimeSpinner` | Chọn giờ/phút trong menu picker           |
| `SdLabel`       | Label và trạng thái required              |
| `SdView`        | Hiển thị static viewed state              |
| `SdIcon`        | Icon picker, clear và error               |

## Coverage so với yêu cầu

> Không có spec/PRD riêng cho module này; bảng được đối chiếu best-effort từ implementation plan, code và test của Task 6.

|   # | Tính năng phát hiện từ code                           | Trạng thái | Ghi chú                                  |
| --: | ----------------------------------------------------- | ---------- | ---------------------------------------- |
|   1 | Model time-only chuẩn hóa `HH:mm`, không rò rỉ `Date` | met        | `time-value.ts`, picker adapter và specs |
|   2 | `min`/`max`/`step`/required/clear/viewed cho `SdTime` | met        | component, docs và Showcase              |
|   3 | Giữ invalid typed text nhưng không ghi đè valid model | met        | component regression specs               |
|   4 | Range ordering, boundary, required và open-ended      | met        | pure range + component specs             |
|   5 | Mask tách raw model khỏi display value                | met        | adapter và integration specs             |
|   6 | Caret, paste, selection, IME và mobile input          | met        | mask specs và integration specs          |
|   7 | Preset, custom adapter, incomplete và invalid state   | met        | public mask API và specs                 |
|   8 | Không làm đổi hành vi `SdInput` khi không có mask     | met        | no-mask regression spec                  |

## Danh sách ảnh minh họa

- [ ] `images/time-controls-showcase.png` - trang demo `SdTime`.
- [ ] `images/time-range-showcase.png` - trang demo `SdTimeRange`.
- [ ] `images/input-mask-showcase.png` - section input mask của `SdInput`.

Chưa chèn ảnh vì Showcase chưa được khởi động để capture trong bước này. Khi Showcase đang chạy, dùng:

```bash
SDCOREJS_DOCS_BASE_URL=http://localhost:4200 node .sdcorejs/documentation/user-guides/capture-screenshots.playwright.mjs
```
