# Kế hoạch: sd-chip-calendar (chờ duyệt)

Nguồn: `chip-calendar.md` (chính), `README.md`, `PROMPT.md`, ảnh `screenshots/`. Đã đọc: toàn bộ `forms/chip-calendar/**`
(component, template, SCSS, pipe, 2 spec, `sd-chip-calendar.md`), wrapper form-render, cách sd-date chuẩn hoá model / time
zone / `transform` / `minDate`, cách badge picker (đợt 3) dựng overlay.

## 0. Điều kiện trước

Đợt 1 + 2 có trên nhánh `feat/design-handoff-wave-1-2` (cùng 3 commit local chưa push), **chưa merge vào `main`**.
Đề xuất làm tiếp trên nhánh này, sau 3 commit đó. Mỗi bước một commit local, không push.

## 1. File và commit dự kiến

| Bước | Commit | File chính |
|---|---|---|
| 0 | `docs(handoff): add the sd-chip-calendar design handoff and plan` | `.sdcorejs/handoff/design-chip-calendar/**` |
| 1 | `fix(chip-calendar): removable on every path, wide model, one error gate, chip names` (A1, A2, A4, A6) | `chip-calendar.component.{ts,html}`, mới `chip-calendar-model.ts`; `forms/models` thêm helper chuẩn hoá ngày dùng chung (xem mục 5), sd-date gọi lại helper đó; 2 spec; i18n 5 locale (`remove`, `locked`) |
| 2 | `feat(chip-calendar): dialog popup with its own header, counts and date limits` (A3, A5, B4, B5, B6, C1) | component + mới `chip-calendar-header.component.{ts,html,scss}`; `_component-tokens.scss` + `THEME.md`; i18n; spec |
| 3 | `feat(chip-calendar): suffix buttons, 20/24/28 chips, sorted chips and +N` (B1, B2, B3, C2, C3) | component html/scss/ts; `core/form.scss` (mục 8); spec |
| 4 | `refactor(chip-calendar): drop unused code, form-render maxCount, docs` (D1, D2) | component (dọn), form-render wrapper, `sd-chip-calendar.md`, `CHANGELOG.md`, showcase (ví dụ mới, registry, generated sources) |

Sau mỗi bước: RED trước, full Karma tuần tự, lint, `test:theme`, `check:scss-hex`, `npm run sync`, `check:sync`, ảnh showcase trước/sau.

## 2. Hex trong thông số → token

| Chỗ dùng | Hex | Token | Ghi chú |
|---|---|---|---|
| Viền chip | #c4c6d0 | `--sd-border` | có sẵn |
| Chữ phụ, ✕, mũi tên tháng | #5c6270 | `--sd-text-secondary` | có sẵn |
| Nền hover ✕, nền “+N” | #e7e8ed | `--sd-surface-muted` | có sẵn |
| Nền chip khoá | #f2f3f6 | **mới** `chip-calendar-chip-locked-bg` = `color-mix(in srgb, var(--sd-surface-muted) 55%, var(--sd-surface))`, light = dark | phân biệt với nền “+N” |
| Hover “+N” | #dcdde3 | **mới** `chip-calendar-more-hover-bg` = `color-mix(in srgb, var(--sd-text) 6%, var(--sd-surface-muted))` | cùng công thức hover 6% của chip operator |
| Icon lock | #8a8d95 | `--sd-text-muted` | `text-tertiary` không có |
| Viền panel | #e3e4ea | `color-mix(in srgb, var(--sd-border) 60%, var(--sd-surface))` | đúng viền panel sd-select / operator / badge picker (đợt 2 · D); `border-subtle` không có |
| Viền đầu footer | #ecedf1 | `--sd-select-panel-divider` | như footer badge picker |
| Dòng “đã đủ” | #8a5200 | `--sd-warning-dark` | thêm cặp tương phản ≥ 4.5:1 vào `theme-contrast.test.mjs` |
| Hover ô ngày | #eef1f6 | `color-mix(in srgb, var(--sd-text) 5%, transparent)` | đúng hover option của panel đợt 2; `surface-hover` không có |
| Ô đã chọn | #005cbb / chữ trắng | `--sd-primary` / `--sd-primary-contrast` | `on-primary` không có |
| Hover ô đã chọn | #004a99 | `--sd-primary-600` | ramp có sẵn (`_ramps.scss`, primary 86% + đen); `primary-hover` không có |
| Ô khoá đã chọn | #dbe7f7 / #00408a | `--sd-primary-light` / `--sd-primary-dark` | có sẵn |
| Ô không chọn được | #a3a6ad | `--sd-disabled-text` | `text-disabled` không có |
| Nền panel | trắng | `--sd-select-panel-bg` | như mọi panel đợt 2 (thông số ghi `--sd-surface`) |
| Bo panel | 12px | `--sd-panel-radius` (10px) | **lệch**: dùng token chung 10px thay vì 12px |
| Bóng panel | 2 lớp | `--sd-shadow-md` | như panel đợt 2 |
| Rộng panel | 296px | **mới** `chip-calendar-panel-width` = `296px` | theo thông số |

`--sd-chip-calendar-bg` có sẵn (hover mặt `sdViewDef`): giữ, bỏ fallback `#ebecf0` trong SCSS component.

## 3. Overlay

- `cdkConnectedOverlay` như badge picker: origin = `MatFormField.getConnectedOverlayOrigin()` (căn theo khung ô), vị trí
  dưới-trái, lật lên trên khi thiếu chỗ, `viewportMargin` 8. Không backdrop; `overlayOutsideClick` đóng (bấm thẳng sang
  field khác được, như badge picker). Thông số ghi “backdrop trong suốt” → hành vi giống nhau với người dùng.
- Khoảng cách: thông số ghi **4px**; sd-select, menu operator và badge picker đều **6px** (review 22/10) → đề xuất **6px**.
- Panel `role="dialog"`, `aria-label` = `label` hoặc i18n `dialog-label`, `cdkTrapFocus` + `cdkTrapFocusAutoCapture`
  (`A11yModule`; badge picker không có trap). Tab quay vòng trong panel, không đóng.
- Esc / “Xong”: đóng, `markAsTouched`, focus về `<input>` của field. Bấm ra ngoài: đóng, touched, không cướp focus.
- Lấy từ sd-date: không có popup dùng lại được (sd-date dùng `mat-datepicker`). Dùng lại phần model / time zone / transform.
- Hiệu ứng: keyframes fade + scale 0.98→1 trong `--sd-duration-fast`, tắt dưới `prefers-reduced-motion`.

## 4. Header riêng của `mat-calendar`

Component nội bộ `ɵSdChipCalendarHeader` truyền qua `[headerComponent]`:
- Inject `MatCalendar` (cha), `DateAdapter`, `MAT_DATE_FORMATS`, `MatDatepickerIntl`, `ChangeDetectorRef`; nghe
  `calendar.stateChanges` để vẽ lại.
- Trước / sau: đổi `calendar.activeDate` theo view (tháng ở month view, năm ở year view, 24 năm ở multi-year), như header mặc
  định. `aria-label` = `intl.prevMonthLabel` / `nextMonthLabel` (đổi theo view: `prevYearLabel`, `prevMultiYearLabel`…).
- Nhãn là nút chuyển `month ↔ multi-year`, `aria-label` = `intl.switchToMultiYearViewLabel`; không có mũi tên.
- Chữ nhãn: `Intl.DateTimeFormat(<locale I18nService>, { month: 'long', year: 'numeric' })`, viết hoa chữ đầu → vi ra
  “Tháng 10 năm 2026” (mock ghi “Tháng 10, 2026”). Không đổi `DateAdapter` (vẫn `MatNativeDateModule`).

## 5. Chuẩn hoá model (4.7)

- Hàm chuẩn hoá của sd-date (`normalizeDateModel` / `#normalizeModel`) đang là hàm riêng trong `date.component.ts`. Đề xuất
  tách thành helper nội bộ trong `forms/models` (vd `ɵsdNormalizeCalendarDay(value, dateTime)`): không zone thì
  `DateUtilities.isDate` → `DateUtilities.toFormat(…, 'yyyy/MM/dd')`, rồi `sdParseTransformedTemporal`; có zone thì
  `SdDateTimeService.toFormat(…, 'yyyy/MM/dd')`, rồi `ɵsdParseTransformedInstant`. sd-date gọi lại helper này (không đổi
  hành vi, spec sd-date giữ nguyên làm lưới an toàn); chip-calendar gọi cùng hàm cho **từng phần tử**.
- `selectedDays = computed(...)`: chuẩn hoá từng phần tử, bỏ phần tử `null` / rỗng / không đọc được (dev mode `console.warn`
  một lần), bỏ trùng giữ lần xuất hiện đầu. Dùng cho tô lịch, sắp xếp chip, đếm validator, predicate `removable`.
- Ghi: chỉ khi người dùng thao tác. `next` dựng từ `selectedDays` (giữ thứ tự, ngày mới nối cuối); mỗi phần tử: `transform`
  rỗng → `yyyy/MM/dd`; có `transform` → `sdSerializeTemporalValue(zoned ? fromWallClock(sdLocalStartOfDay(d)) : sdLocalStartOfDay(d), transform)`
  như `#serializeCommitted` của sd-date. `model.set(next)` + `sdChange.emit(next)` một lần.
- Không ghi ngược: effect model → `formControl.setValue(selectedDays, { emitEvent: false })`, không `model.set`, không emit.
- `minDate` / `maxDate` / `startAt`: cùng cách của `#parseDateBoundary` sd-date (`'TODAY'` = `SdDateTimeService.today()`).
  **Lệch nhỏ**: sd-date không zone đọc `'TODAY'` là `new Date()` (còn giờ); lịch so theo ngày nên không ảnh hưởng.
- `transform` dùng type `SdTemporalValueTransform` sẵn có.

## 6. `dateFilter` ghép (4.1)

`calendarFilter = computed(() => { … return (d: Date) => … })`, tạo hàm mới mỗi khi `selectedDays`, `maxCount`, `removable`,
`dateFilter` đổi:
- ngày đã chọn → `canRemove(day)` (bỏ được thì bấm được, kể cả trái `dateFilter` của consumer; không bỏ được thì khoá);
- ngày chưa chọn → `!full && (consumerFilter?.(d) ?? true)`.
`minDate` / `maxDate` truyền thẳng `[minDate]` / `[maxDate]`. `dateClass` cũng là `computed` (gắn `sd-chip-calendar-selected`,
`sd-chip-calendar-locked`). `mat-calendar` vẽ lại khi các input này đổi reference (`ngOnChanges` của `MatCalendar`) → bỏ
`updateTodaysDate()`.

## 7. Ghi đè style ô ngày không `!important`

Panel nằm trong template component nhưng ô ngày thuộc view của Material, nên style để trong SCSS component dưới
`::ng-deep .sd-chip-calendar-panel …`. Không `!important` nhờ hai lớp:
1. Token Material đặt trên `.sd-chip-calendar-panel`: `--mat-datepicker-calendar-date-hover-state-background-color`,
   `…-date-focus-state-background-color: transparent`, `…-date-today-outline-color`, `…-date-disabled-state-text-color`,
   `--mat-datepicker-calendar-header-text-*`…
2. Selector cụ thể hơn của Material cho phần token không phủ được:
   `.sd-chip-calendar-panel .mat-calendar-body-cell.sd-chip-calendar-selected .mat-calendar-body-cell-content`
   (nền primary đặc), `.sd-chip-calendar-locked` (ghi đè style disabled), focus bằng `outline` vòng chuẩn
   `outline-offset: 1px` trên vòng 36px.

## 8. Chiều cao field theo 3 cỡ

- Thêm class `sd-chip-calendar-field` lên `mat-form-field`. Chip cao 20 / 24 / 28 qua token chip MDC; vùng chip padding block
  5 / 7 / 9 = `(control-height − 2 − chip) / 2`; bỏ `margin-top: 10px / 2px` của `.mat-mdc-chip-set`.
- Vướng: `core/form.scss` đặt padding infix của `.sd-sm` / `.sd-md` bằng `!important` (`padding: 0 0 8px 0 !important`).
  Đề xuất loại field chip-calendar khỏi 2 rule đó bằng `:not(.sd-chip-calendar-field)` để component tự đặt padding mà
  không cần `!important`.
- `lg`: thông số cho cao **48** (`--sd-control-height-lg`). Các field khác ở `lg` hiện cao **56** (số đo Material, đợt 1 chưa
  áp thang lên form field) → chip-calendar `lg` sẽ thấp hơn sd-input `lg` 8px. Đề xuất theo thông số (48), ghi vào báo cáo.

## 9. Ảnh hưởng consumer

- Placeholder mặc định: từ `label` sang “Chọn ngày”.
- `min` / `max` → alias deprecated của `minCount` / `maxCount`, dev mode warn một lần mỗi instance; tên mới thắng.
- Lỗi không còn hiện khi chỉ `dirty`; chỉ khi `touched` hoặc form đã submit; đóng popup thì touched.
- `removable` nhận ngày đã chuẩn hoá `yyyy/MM/dd` (trước là phần tử thô) → predicate viết cho `Date` / số phải đổi.
- Model `number[]` / `Date[]`: sau thao tác đầu, model thành `string[]` (trước giữ số và trộn chuỗi).
- Popup đổi từ `mat-menu` sang overlay → selector E2E dựa vào `.mat-mdc-menu-panel` hỏng; thêm `data-autoid` cho nút
  lịch / bỏ hết / “Xoá hết” / “Xong”.
- Tab trong popup không còn đóng popup.
- Ghi vào CHANGELOG: Added / Changed / Fixed / Deprecated / Removed như thông số; mục `removable` và output `string[]` vào
  `### Changed (BREAKING for consumers)` kèm cách đổi.

## 10. form-render

Schema `SdFormGenericFieldValidation` có `maxItems`, **không có `minItems`** → wrapper đổi `[max]` thành `[maxCount]`;
không thêm `minItems` trong đợt này (ghi vào báo cáo).

## 11. i18n

Tiền tố `core.form.chip-calendar.` — key mới (đủ vi / en / ja / ko / zh): `placeholder`, `dialog-label`, `clear`,
`clear-all`, `done`, `selected-count`, `max-count`, `no-limit`, `full`, `remove`, `locked`, `more` (12 key).
Dùng lại: `core.form.date.open-picker` (“Mở lịch”) cho nút lịch; `minlength` / `maxlength` / `required` có sẵn. Không có key
chung đúng nghĩa “Xong” / “Xoá hết” (chỉ có `core.component.badge.picker.done` thuộc riêng badge picker) → key mới.
Nhãn ngày đầy đủ cho `aria-label` dùng `Intl.DateTimeFormat`, không cần key.

## 12. Cần duyệt

1. Làm trên nhánh `feat/design-handoff-wave-1-2` (đợt 1 + 2 chưa merge `main`).
2. **`form.value` khi có `transform`:** thông số nói `form.value` luôn `yyyy/MM/dd`; sd-date thì đưa giá trị đã `transform`
   vào form. Đề xuất **theo sd-date** (cùng giá trị với `modelChange`) để API nhất quán; nếu giữ thông số thì ghi lệch vào docs.
3. Khoảng cách popup **6px** (như sd-select / operator / badge picker) thay vì 4px.
4. Bo panel theo `--sd-panel-radius` (10px) và nền `--sd-select-panel-bg` thay vì 12px / `--sd-surface`.
5. `lg` cao 48 theo thông số, chấp nhận lệch 8px với field `lg` khác.
6. Loại chip-calendar khỏi rule padding `!important` của `core/form.scss` bằng `:not(.sd-chip-calendar-field)`.
7. Tách helper chuẩn hoá ngày của sd-date sang `forms/models` (sd-date gọi lại, không đổi hành vi).
8. Nhãn tháng “Tháng 10 năm 2026” (`Intl`) thay vì “Tháng 10, 2026”.
