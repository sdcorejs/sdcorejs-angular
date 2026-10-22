# Tiến độ sd-chip-calendar

Kế hoạch đã duyệt: [`PLAN.md`](PLAN.md) (2026-10-22, 8 điểm theo đề xuất). Nhánh `feat/design-handoff-wave-1-2`, commit local,
chưa push.

| Bước | Nội dung | Trạng thái |
| --- | --- | --- |
| 0 | Gói handoff + kế hoạch | xong |
| 1 | Sửa lỗi và model (A1, A2, A4, A6) | xong |
| 2 | Popup mới (A3, A5, B4, B5, B6, C1) | xong |
| 3 | Field mới (B1, B2, B3, C2, C3) | chưa |
| 4 | Dọn code, form-render, tài liệu (D1, D2) | chưa |

## Bước 1

- `forms/models/src/sd-calendar-day.ts`: `ɵsdNormalizeCalendarDay(value, zone?)` — cách đọc ngày của sd-date tách ra dùng
  chung; sd-date gọi lại (không đổi hành vi, spec sd-date xanh).
- chip-calendar dùng binding model ↔ control của `ɵsdFormControlConnector` như sd-date: control giữ ngày đã chuẩn hoá
  (`yyyy/MM/dd`, bỏ trùng, thứ tự model); `controlToModel` ghi theo `transform`; model từ cha không bị ghi ngược.
  Có `transform` thì form cha nhận control mang model (`ɵsdModelFacingControl`) — quyết định 2.
- Type mới `SdChipCalendarValue`, `SdChipCalendarModel`, `SdChipCalendarRemovable`; input `transform`; `sdChange` kiểu
  `string[]`.
- `removable` áp cho ✕, Backspace / Delete (`[removable]` của `mat-chip-row`), bấm lại ô lịch, `onClear` (giữ ngày khoá).
  Bỏ pipe `sdRemovableChip`.
- Một cổng lỗi `isErrorShown()` / `#errorGate()`: invalid && (touched || form cha đã submit); đóng lịch thì touched.
- `aria-label` chip = ngày đầy đủ (`Intl`, locale của `I18nService`) + “, Không bỏ được ngày này” khi khoá; nút ✕ = i18n
  `remove`. Key mới: `core.form.chip-calendar.remove`, `.locked` (5 locale).
- Lưu ý kỹ thuật: `mat-chip-row` khai input tên `aria-label` (bind `[aria-label]`, không phải `[ariaLabel]`); `sd-icon` có
  host binding `aria-label` riêng nên dùng input `[ariaLabel]` của nó. `enable()`/`disable()` của control phát
  `valueChanges` → connector ghi model đã transform lên cha; effect `disabled` giờ chỉ đổi khi khác và `emitEvent: false`.
- Kiểm tra: spec chip-calendar 86/86 (16 spec mới RED trước), full Karma 7793/7793, lint, `test:theme` 53/53,
  `check:scss-hex` 0, i18n parity (1384 × 5), `check:i18n`, `check:sync`. Không có thay đổi hình ảnh nên không chụp ảnh.

## Bước 2

- `mat-menu` → `cdkConnectedOverlay` treo dưới khung ô (origin = `MatFormField.getConnectedOverlayOrigin()`), cách 6px, lật
  lên khi thiếu chỗ; panel `role="dialog"`, `cdkTrapFocus` (Tab quay vòng, không đóng), Esc / “Xong” đóng và trả focus về ô
  nhập, bấm ra ngoài đóng không cướp focus; đóng thì touched. Khi mở, focus vào ô active của lưới.
- Header riêng `ɵSdChipCalendarHeader` **kế thừa `MatCalendarHeader`** (Material 19 và 22 cùng API): giữ luật chuyển
  trang, giới hạn min/max và nhãn `MatDatepickerIntl`; chỉ đổi markup (trước / nhãn / sau) và nhãn tháng (`Intl`, viết hoa
  chữ đầu: “Tháng 1 năm 2025”).
- Đầu popup: “Đã chọn {n} ngày”, “Tối đa {max}” / “Không giới hạn”, dòng “đã đủ” trong vùng `aria-live` luôn có mặt. Chân
  popup: “Xoá hết” (`clearable`, disabled khi không còn ngày bỏ được, giữ ngày khoá), “Xong”.
- Input mới: `minDate`, `maxDate` (`'TODAY'`), `dateFilter`, `startAt`, `minCount`, `maxCount`, `clearable`; `min` / `max`
  `@deprecated` (dev warn một lần, tên mới thắng). Type `SdChipCalendarDate`.
- `dateFilter` ghép (computed, hàm mới mỗi lần đổi → `mat-calendar` dựng lại ô) và `dateClass` (`sd-chip-calendar-selected`,
  `-locked`); bỏ `updateTodaysDate()`. Sau khi chọn, ô vừa bấm là ô active và nhận lại focus.
- Style ô ngày bằng token `--mat-datepicker-calendar-*` đặt trên panel / trên ô (hover, focus, disabled), không `!important`;
  bỏ rule toàn cục `::ng-deep .sd-chip-calendar-selected-date`. Token mới `chip-calendar-panel-width` (296px) + THEME.md.
- i18n mới (5 locale): `dialog-label`, `selected-count`, `max-count`, `no-limit`, `full`, `clear-all`, `done`.
- Kiểm tra: spec chip-calendar 102/102 (15 spec mới RED trước), full Karma 7809/7809, lint, `test:theme` 53/53,
  `check:scss-hex` 0, i18n parity (1391 × 5), `check:i18n`, `check:sync`. Ảnh: [`progress/step2-before-after.png`](progress/step2-before-after.png).
- Còn ở bước 3: viền field ở trạng thái focus khi popup mở (thông số mục 2 · Trạng thái field).
