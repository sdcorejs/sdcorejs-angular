# Tiến độ sd-chip-calendar

Kế hoạch đã duyệt: [`PLAN.md`](PLAN.md) (2026-10-22, 8 điểm theo đề xuất). Nhánh `feat/design-handoff-wave-1-2`, commit local,
chưa push.

| Bước | Nội dung | Trạng thái |
| --- | --- | --- |
| 0 | Gói handoff + kế hoạch | xong |
| 1 | Sửa lỗi và model (A1, A2, A4, A6) | xong |
| 2 | Popup mới (A3, A5, B4, B5, B6, C1) | chưa |
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
