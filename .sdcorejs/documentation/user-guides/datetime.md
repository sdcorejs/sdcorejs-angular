---
module: datetime
title: Hướng dẫn sử dụng SdDatetime
tracks: [angular]
generated_at: 2026-07-15T00:38:48+07:00
git_head: 9b5f3f7ec6d8da66d06f614ea6cd4ecadb511bef
routes:
  - { path: /v/latest/forms/datetime/examples, screen: showcase, permission: null }
permissions: []
entities: []
screens: [showcase]
spec_refs:
  - .sdcorejs/specs/angular/2026-07-14-23-27-integrate-angular-material-datetime-1-0-3.md
prd_refs: []
coverage: { total: 9, met: 6, partial: 3, missing: 0 }
---

# Hướng dẫn sử dụng `SdDatetime`

## Tổng quan

`SdDatetime` cho phép chọn ngày và giờ trong cùng một ô. Khi mở picker, người dùng thấy lịch tháng, bộ chọn giờ/phút (và giây khi được bật), cùng ba action `Bây giờ`, `Hủy` và `Xác nhận`.

Component phù hợp với thời điểm họp, lịch xử lý, thời gian đăng bài hoặc trường audit cần cả ngày và giờ. Nếu chỉ cần ngày, dùng `SdDate`; nếu cần khoảng ngày, dùng `SdDateRange`.

Trang demo hiện tại: `/v/latest/forms/datetime/examples`. Legacy route `/forms/datetime` tự chuyển tới tài liệu versioned.

## Màn hình và tác vụ

### Chọn ngày giờ cơ bản — `/v/latest/forms/datetime/examples`

- **Thao tác:** bấm ô hoặc biểu tượng lịch, chọn ngày, chỉnh giờ/phút, rồi bấm `Xác nhận`.
- **Kết quả:** model nhận chuỗi `yyyy/MM/dd HH:mm:ss`; khi `showSeconds=false`, giây được chuẩn hóa thành `00`.
- **Hủy thay đổi:** bấm `Hủy` để đóng picker mà không đổi model.
- **Chọn nhanh:** bấm `Bây giờ` để đưa thời điểm hiện tại vào draft; model chỉ đổi sau khi bấm `Xác nhận`.
- **Giá trị đang có:** mỗi lần mở, picker hiển thị model hiện tại, kể cả khi model vừa được cập nhật từ bên ngoài component.

Ví dụ tối thiểu:

```html
<sd-datetime
  label="Thời điểm cuộc họp"
  [form]="form"
  name="meetingAt"
  [(model)]="meetingAt">
</sd-datetime>
```

Standalone host phải import `SdDatetime` từ `@sdcorejs/angular/forms/datetime` hoặc `@sdcorejs/angular/forms`. Không cần cấu hình date adapter ở application root.

### Kiểm tra trường bắt buộc

- Thêm `required` khi người dùng bắt buộc phải chọn thời điểm.
- Khi submit/kiểm tra form, đánh dấu control touched để hiện thông báo lỗi.
- `min`/`minDate` và `max`/`maxDate` giới hạn thời điểm có thể chọn; chỉ dùng một alias cho mỗi boundary.
- Nhập trực tiếp phải theo `dd/MM/yyyy HH:mm` hoặc `dd/MM/yyyy HH:mm:ss`.

```html
<sd-datetime
  label="Bắt đầu"
  [form]="form"
  name="startAt"
  required
  min="TODAY"
  [(model)]="startAt">
</sd-datetime>
```

### Trạng thái không chỉnh sửa

| Cách dùng | Hành vi |
| --- | --- |
| `[disabled]="true"` | Giữ giao diện input nhưng chặn nhập và không mở picker |
| `[viewed]="true"` | Hiển thị thời điểm dạng text cho màn hình DETAIL |
| `[viewed]="'inline'"` | Hiển thị text; bấm vào text để mở picker, giữ text cũ cho tới khi xác nhận |

Trong inline mode, nút xóa xuất hiện khi hover nếu có giá trị, field không required/disabled và `clearable=true`.

## Bảng quyền

`SdDatetime` không tự áp permission code. Ứng dụng host quyết định ai được xem hoặc chỉnh sửa field bằng route guard, permission directive hoặc mode `viewed`/`disabled`.

| Permission code | Tác vụ | Vai trò |
| --- | --- | --- |
| — | Mở, chọn và xác nhận ngày giờ | Do ứng dụng host quy định |

## Tham chiếu dữ liệu

Component không sở hữu domain entity. Contract dữ liệu chính:

| Trường/input | Kiểu | Bắt buộc | Ràng buộc |
| --- | --- | --- | --- |
| `model` | `string \| number \| Date \| null \| undefined` | không | Emit thành `yyyy/MM/dd HH:mm:ss` hoặc `yyyy/MM/dd HH:mm:00` |
| `showSeconds` | `boolean` | không | Mặc định `false` |
| `min` / `minDate` | `Date \| string \| 'TODAY'` | không | Thời điểm nhỏ nhất; chọn một alias |
| `max` / `maxDate` | `Date \| string \| 'TODAY'` | không | Thời điểm lớn nhất; chọn một alias |
| `form` + `name` | `FormGroup`/`NgForm` + `string` | tùy form | Pattern tích hợp form của SDCoreJS; không dùng `formControlName` |

## Action đặc biệt

| Action | Khi nào dùng | Ảnh hưởng model |
| --- | --- | --- |
| `Bây giờ` | Chọn nhanh thời điểm hiện tại | Chưa đổi cho tới `Xác nhận` |
| `Hủy` | Bỏ thay đổi đang chọn | Không đổi |
| `Xác nhận` | Chấp nhận draft | Cập nhật `model`, emit `sdChange` nếu giá trị đổi |
| Nút `×` | Xóa field không required | Đặt model về `null`, emit `sdChange(null)` |

## Core UI được dùng

| Core UI | Vai trò trong feature |
| --- | --- |
| `SdDatetime` | Field chọn ngày và giờ, form/model wrapper chính |
| `SdLabel` | Hiển thị label và trạng thái required |
| `SdView` | Hiển thị giá trị ở viewed/inline mode |
| `SdViewDefDirective` | Cho phép project template hiển thị read-only tùy biến |
| `SdIcon` | Icon action, helper và error tooltip |

## Coverage so với yêu cầu

| # | Yêu cầu từ spec | Trạng thái | Được mô tả tại |
| ---: | --- | --- | --- |
| 1 | Cả ba Angular major pin/resolve package `1.0.3` và publish đúng runtime dependency | ✅ đạt | Tổng quan; technical doc |
| 2 | Chỉ dùng public package entrypoint, không còn vendored picker | ✅ đạt | Tổng quan; Core UI được dùng |
| 3 | Giữ nguyên model, form, validation, i18n, viewed/inline, clear và direct-entry flows | ✅ đạt | Màn hình và tác vụ; Tham chiếu dữ liệu |
| 4 | Component không lỗi DI và consumer không phải cấu hình root provider | ✅ đạt | Chọn ngày giờ cơ bản |
| 5 | Bao phủ open/disabled, Apply/Cancel/Now, seconds, bounds và overlay cleanup | ✅ đạt | Màn hình và tác vụ; Action đặc biệt |
| 6 | Rollout từ v19 sang v20/v21, không có duplicate Angular major trong lockfile | ✅ đạt | Technical doc |
| 7 | Focused tests, builds, dependency tree và sync đều exit `0` | ⚠️ một phần | Focused tests/build/sync pass; deep `npm ls` v20 còn baseline peer-minor mismatch |
| 8 | Browser smoke xác nhận popup, calendar, spinner, action tiếng Việt và inline mode | ⚠️ một phần | HTTP 200 và DOM integration tests pass; chưa có browser backend để visual/click smoke |
| 9 | Không sửa path ngoài migration scope | ⚠️ một phần | Production/protected paths sạch; screenshot script và root memory index là finish-tail artifacts hợp lệ nhưng vượt literal plan allow-list |

## Danh sách ảnh minh họa

- [ ] `images/datetime-showcase.png` — trang demo gồm cơ bản, validator, disabled/viewed và inline mode.

Chưa chèn ảnh vào guide vì ảnh chưa được capture. Khi showcase đang chạy và Playwright đã có trong môi trường, chạy:

```bash
SDCOREJS_DOCS_BASE_URL=http://localhost:4200 node .sdcorejs/documentation/user-guides/capture-screenshots.playwright.mjs
```
