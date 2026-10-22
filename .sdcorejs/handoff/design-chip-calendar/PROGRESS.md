# Tiến độ sd-chip-calendar

Kế hoạch đã duyệt: [`PLAN.md`](PLAN.md) (2026-10-22, 8 điểm theo đề xuất). Nhánh `feat/design-handoff-wave-1-2`, commit local,
chưa push.

| Bước | Nội dung | Trạng thái |
| --- | --- | --- |
| 0 | Gói handoff + kế hoạch | xong |
| 1 | Sửa lỗi và model (A1, A2, A4, A6) | xong |
| 2 | Popup mới (A3, A5, B4, B5, B6, C1) | xong |
| 3 | Field mới (B1, B2, B3, C2, C3) | xong |
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

## Bước 3

- Suffix (B1): nút lịch `data-chip-calendar-open` (mở / đóng popup, `aria-haspopup="dialog"`, `aria-expanded`, primary khi
  mở) và nút bỏ hết (`clearable`, ẩn khi `required`, hover-gated như sd-date, luôn hiện khi popup mở; giữ ngày khoá, không mở
  popup). Disabled thì ẩn cả hai. Placeholder mặc định “Chọn ngày” (i18n `placeholder`), không lấy label nữa.
- Chip (B2): sắp theo ngày khi hiện (model giữ thứ tự), chữ theo input mới `displayFormat` (cú pháp `DatePipe`, mặc định
  `dd/MM/yyyy`), icon ✕ `close`; ngày khoá có nền `--sd-chip-calendar-chip-locked-bg` và icon `lock` có tooltip thay cho ✕.
- `maxVisible` (B3): popup đóng thì chỉ hiện `maxVisible` chip đầu, phần còn lại gộp vào nút “+N” (i18n `more`), bấm mở
  popup; popup mở thì hiện đủ.
- Thang cỡ (C2): field một dòng 32 / 40 / 48, chip 20 / 24 / 28 nằm giữa (padding infix = (field − chip) / 2), nút suffix
  24 / 28 / 32, icon theo cỡ. `core/form.scss` bỏ field này khỏi rule padding infix `!important` của sd-sm / sd-md
  (`:not(.sd-chip-calendar-field)`); thay cho margin bù 10px / 2px cũ của chip set.
- Popup mở: field ở trạng thái focus (viền + label primary, `--sd-control-ring`).
- Viewed (C3): ngày sắp xếp, theo `displayFormat`, nối bằng “, ”.
- Token mới, suy từ palette (một biểu thức cho light và dark): `chip-calendar-chip-locked-bg`,
  `chip-calendar-more-hover-bg`; cặp tương phản trong `scripts/theme-contrast.test.mjs`; THEME.md.
- i18n mới (5 locale): `placeholder`, `clear`, `more`. Dọn dòng trống thừa giữa các key chip-calendar mà script bước 1–2
  chèn vào.
- Lưu ý kỹ thuật: `matSuffix` / `matChipRemove` chỉ được chiếu đúng chỗ khi khối `@if` có một phần tử gốc (khối lồng nhiều
  gốc đẩy icon vào nhãn chip, nút vào infix). Rule toàn cục `.mat-mdc-form-field-infix input.mat-mdc-input-element
  { margin-top: 10px }` cần selector mạnh hơn (`input.mat-mdc-chip-input.mat-mdc-input-element`).
- Sửa lỗi của bước 2: popup mở bên dưới cách viền ~27px thay vì 6px. `overlayOrigin` là `computed` đọc
  `MatFormField.getConnectedOverlayOrigin()` trước khi view query `_textField` có giá trị, nên rơi về cả `mat-form-field`
  (gồm dòng subscript 20px) và giữ luôn. Giờ origin đọc trong `open()`. Spec kiểm origin là khung viền (khung Karma quá thấp
  để đo khoảng cách); đo trên showcase: viền dưới 163.73px, popup 169.73px. Khi lật lên vốn đã đúng 6px.
- Kiểm tra: spec chip-calendar 116/116 (field spec mới RED trước, kể cả spec origin), full Karma 7823/7823,
  `test:theme`, `check:scss-hex` 0, i18n parity (1394 × 5), `check:i18n`, `test:theme-token-list`, prettier + eslint
  file đổi, `npm run sync`, `check:sync`. Ảnh: [`progress/step3-before-after.png`](progress/step3-before-after.png).
