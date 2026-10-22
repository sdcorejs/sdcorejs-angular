# sd-chip-calendar · sửa lỗi và giao diện mới

Tham chiếu: `Chip Calendar Review.dc.html` (mục 02 liệt kê vấn đề A1–D2, mục 03 là bản dựng bấm được, mục 04 là API). Phạm vi: `forms/chip-calendar/**` và wrapper `components/form-generic/src/components/form-render/components/item/components/chip-calendar/*`.

Hex dưới đây là giá trị đã giải của palette mặc định trong bản minh hoạ. Map sang token có sẵn; không đưa hex vào SCSS.

## 1. API

### Input mới
| Input | Kiểu | Mặc định | Ghi chú |
|---|---|---|---|
| `minDate` | `Date \| string \| 'TODAY' \| null` | `null` | Ngày nhỏ nhất chọn được. Cùng kiểu và cách đọc với `minDate` của sd-date (`'TODAY'` = hôm nay theo time zone cấu hình; mốc instant so theo ngày trong zone). Truyền xuống `mat-calendar`. |
| `maxDate` | `Date \| string \| 'TODAY' \| null` | `null` | Ngày lớn nhất chọn được. Như trên. |
| `dateFilter` | `((d: Date) => boolean) \| null` | `null` | Trả `false` thì ô đó không chọn được. Giữ đúng tên của `mat-calendar`. |
| `minCount` | `number` | `0` | Thay cho `min`. > 0 thì thêm `Validators.minLength`. |
| `maxCount` | `number` | `0` | Thay cho `max`. > 0 thì thêm `Validators.maxLength` và chặn chọn thêm trong lịch (mục 4.3). |
| `maxVisible` | `number \| null` | `null` | Số chip hiện khi popup đóng. Dư thì gộp thành chip “+N”. `null` = hiện tất cả như hiện nay. |
| `clearable` | `boolean` | `false` | Nút bỏ hết ở suffix và nút “Xoá hết” trong popup. `booleanAttribute`, mặc định tắt như `clearable` của sd-date. |
| `startAt` | `Date \| string \| null` | `null` | Tháng mở đầu tiên. Không đặt thì theo mục 4.2. |
| `displayFormat` | `string` | `'dd/MM/yyyy'` | Định dạng cho chip và chế độ viewed. |
| `transform` | `SdTemporalValueTransform \| undefined` | `undefined` | Cùng hợp đồng với `transform` của sd-date: quyết định dạng chuỗi của **từng phần tử** khi giá trị rời component (`undefined` → `yyyy/MM/dd`, `ISOString`, `UTCString`). Không ảnh hưởng hiển thị. Xem mục 4.7. |

### Input có sẵn đổi hành vi
| Input | Thay đổi |
|---|---|
| `min`, `max` | Giữ làm alias của `minCount`/`maxCount`, gắn `@deprecated`. Nếu cả hai cùng có thì `minCount`/`maxCount` thắng. Dev mode `console.warn` một lần mỗi instance. |
| `removable` | Không đổi kiểu. Predicate áp cho **mọi** đường bỏ ngày: nút ✕, Backspace/Delete trên chip, bấm lại ô trong lịch, nút bỏ hết, “Xoá hết” (A1). Predicate nhận ngày đã chuẩn hoá dạng `yyyy/MM/dd` (trước đây nhận phần tử thô). |
| `model` | Vẫn là `model()` signal của Angular, kiểu mở rộng thành `(string \| number \| Date)[] \| null \| undefined`, đọc giống `model` của sd-date. Output luôn là `string[]`. Chi tiết ở mục 4.7 (A2). |
| `placeholder` | Mặc định đổi thành i18n `core.form.chip-calendar.placeholder` (“Chọn ngày”), không lấy lại `label` nữa (B1). |

### Output
Không đổi. `modelChange` và `sdChange` phát một lần cho mỗi thao tác, kể cả bỏ hết.

## 2. Field

### Kích thước
| | sm | md | lg |
|---|---|---|---|
| Cao khi một dòng | `--sd-control-height-sm` 32 | `--sd-control-height-md` 40 | `--sd-control-height-lg` 48 |
| Chip cao | 20 | 24 | 28 |
| Chữ chip | 12 | 13 | 14 |
| Padding block của vùng chip | 5 | 7 | 9 |
| Padding inline-start của chip | 8 | 8 | 10 |
| Icon ✕ / lock trên chip | 14 | 16 | 18 |
| Nút suffix (vuông) | 24 | 28 | 32 |
| Icon `close` ở suffix | 16 | 18 | 20 |
| Icon `calendar_month` | 18 | 20 | 22 |

- Padding block = `(control-height − 2 − chip) / 2`. Bỏ `margin-top: 10px / 2px` của `.mat-mdc-chip-set` (C2).
- Nhiều dòng: chip wrap, gap 4px cả hai chiều. Field cao theo nội dung.
- Thêm style cho `lg` (hiện không có).

### Chip
- Bo `--sd-radius-6`, viền 1px `--sd-border` (#c4c6d0), nền `--sd-surface`, chữ `--sd-text` weight 400, `font-variant-numeric: tabular-nums`, một dòng.
- Padding inline-end 3px, gap giữa chữ và icon 2px.
- Nút ✕: icon `close`, màu `--sd-text-secondary` (#5c6270), bo 4px, padding 1px. Hover nền `--sd-surface-muted` (#e7e8ed), màu `--sd-text`. Khi `pointer: coarse` vùng bấm tối thiểu 24×24 (pseudo-element, không đổi kích thước chip).
- **Chip không bỏ được** (predicate trả false): nền `--sd-surface-muted` (#f2f3f6), icon `lock` màu text-tertiary (#8a8d95) thay cho ✕, `matTooltip` i18n `locked` (“Không bỏ được ngày này”). `mat-chip-row` nhận `[removable]="false"` để Backspace/Delete không bỏ.
- Chip luôn hiển thị theo ngày tăng dần (B2). Chuỗi `yyyy/MM/dd` sắp xếp theo chữ là đúng thứ tự ngày. Chỉ sắp xếp khi hiển thị, không đổi model.
- Chữ chip theo `displayFormat` (C3).

### Chip “+N” (khi có `maxVisible`)
- Chỉ hiện khi popup đóng và số ngày > `maxVisible`. Hiện `maxVisible` chip đầu (theo thứ tự ngày) và “+{số còn lại}”.
- Cùng chiều cao chip, padding 0 8px, bo `--sd-radius-6`, không viền, nền `--sd-surface-muted` (#e7e8ed), chữ `--sd-text-secondary` weight 500. Hover nền đậm hơn một bậc (#dcdde3).
- Là `<button type="button">`, `aria-label` i18n `more` (“Xem thêm {n} ngày”). Bấm thì mở popup.
- Khi popup mở thì hiện đủ chip.
- Docs: trong `sd-table` nên đặt `maxVisible="2"` cùng `size="sm"`.

### Suffix
Thứ tự từ trái sang phải: icon lỗi (khi `hideInlineError`, như hiện nay), nút bỏ hết, nút lịch.
- **Nút bỏ hết:** dùng lại `.sd-clear-btn` chung trong `assets/scss/core/form.scss` (như sd-date, sd-input), kích thước theo bảng trên. Chỉ render khi `clearable`, không `required`/`disabled`, và còn ít nhất một ngày bỏ được. Ẩn cho tới khi hover hoặc focus field (`sd-hover`, cùng cách sd-date); khi popup mở thì luôn hiện. `aria-label` i18n `clear`. Bấm: giữ lại các ngày không bỏ được, bỏ phần còn lại, phát change một lần. Không mở popup.
- **Nút lịch:** `<button type="button" matSuffix>`, icon `calendar_month`, màu text-secondary; khi popup mở màu `--sd-primary`. `aria-label` i18n `open`, `aria-haspopup="dialog"`, `aria-expanded`. Bấm thì mở/đóng popup.
- Disabled: ẩn cả hai nút. Viewed: không render field.

### Trạng thái field
- Popup mở: viền focus của mat-form-field (primary, 2px), label màu primary.
- Bấm vào vùng trống của field hoặc vào ô nhập: mở popup. Bấm vào chip: không mở (như hiện nay chỉ focus).
- Ô nhập vẫn `readonly`. Enter, Space, ArrowDown, Alt+ArrowDown trên ô nhập mở popup.

## 3. Popup

### Kiến trúc (A3)
- Bỏ `mat-menu`. Dùng CDK overlay (`cdkConnectedOverlay` hoặc `Overlay` service), gắn với field.
- Vị trí: dưới, căn mép trái field, cách 4px; không đủ chỗ thì lật lên trên. Backdrop trong suốt, bấm ra ngoài thì đóng.
- Panel: `role="dialog"`, `aria-label` = `label` (không có label thì i18n `dialog-label` “Chọn ngày”), `cdkTrapFocus` + `cdkTrapFocusAutoCapture`.
- `panelClass="sd-chip-calendar-panel"`. Mọi style cho ô lịch scope dưới class này, không `!important` (C1).
- Mở/đóng: fade + scale 0.98→1, `--sd-duration-fast` (120ms). Tắt khi `prefers-reduced-motion`.

### Bố cục
- Rộng 296px (token `--sd-chip-calendar-panel-width`, = 8 + 7 × 40 + 8), nền `--sd-surface`, viền 1px `--sd-border-subtle` (#e3e4ea), bo theo panel token (12px), shadow elevation của panel (minh hoạ: `0 8px 24px rgba(0,0,0,.12), 0 1px 3px rgba(0,0,0,.08)`).
- Padding 12px 8px 8px. Các khối xếp dọc, gap 4px.

1. **Đầu popup** (padding inline 8px): trái “Đã chọn {n} ngày” 13px weight 600; phải “Tối đa {max}” hoặc “Không giới hạn” 12px text-secondary, căn baseline. Khi đủ `maxCount` thêm dòng 12px/16px màu chữ warning (#8a5200): “Đã đủ {max} ngày. Bỏ bớt một ngày để chọn ngày khác.” Dòng này nằm trong vùng `aria-live="polite"`.
2. **Thanh tháng** cao 40px, margin-top 4px: nút trước, nhãn tháng, nút sau.
   - Nút 32×32, bo 8px, icon `chevron_left`/`chevron_right` 20px text-secondary, hover `--sd-surface-hover`. `aria-label` dùng lại nhãn của `MatDatepickerIntl` (prevMonthLabel/nextMonthLabel).
   - Nhãn “Tháng 10, 2026” 14px weight 600, là nút chuyển sang multi-year view như header mặc định của Material (không có mũi tên).
   - Làm bằng `headerComponent` riêng của `mat-calendar`.
3. **Hàng thứ:** 7 cột 40px, 11px weight 500 text-secondary, line-height 24px. Ngày đầu tuần theo `DateAdapter` hiện có (minh hoạ dùng T2, không đổi adapter trong đợt này).
4. **Lưới ngày:** ô 40×40, vòng tròn 36px ở giữa, chữ 13px tabular-nums.
5. **Cuối popup:** border-top 1px (#ecedf1), margin-top 4px, padding 8px 4px 0, `justify-content: space-between`.
   - Trái: `sd-button` size sm dạng chữ, “Xoá hết”, màu primary. Disabled khi không còn ngày bỏ được. Ẩn khi `clearable = false`.
   - Phải: `sd-button` size sm fill primary, “Xong”. Đóng popup.

### Trạng thái ô ngày
| Trạng thái | Nền vòng | Chữ | Ghi chú |
|---|---|---|---|
| Thường | trong suốt | `--sd-text` | Hover `--sd-surface-hover` (#eef1f6). |
| Hôm nay (chưa chọn) | trong suốt | `--sd-text` | Vòng trong 1px `--sd-primary`. |
| Đã chọn | `--sd-primary` (#005cbb) | `--sd-on-primary` weight 600 | Hover primary-hover (#004a99). Bấm để bỏ. |
| Đã chọn, không bỏ được | primary-light (#dbe7f7) | primary-dark (#00408a) weight 600 | Không hover, không bấm được. |
| Không chọn được | trong suốt | `--sd-text-disabled` (#a3a6ad) | Ngoài `minDate`/`maxDate`, `dateFilter` false, hoặc đã đủ `maxCount`. Không hover. |
| Focus bàn phím | giữ nền của trạng thái | giữ | `outline: var(--sd-focus-ring-width) solid var(--sd-focus-ring-color)`, `outline-offset: 1px` trên vòng 36px. Không dùng background cho focus, để ô đã chọn vẫn thấy focus. |

Ghi đè style ô đã chọn/hover/focus mặc định của Material trong `.sd-chip-calendar-panel` cho khớp bảng trên.

## 4. Hành vi

### 4.1 Chọn và bỏ
- Bấm ô thường: thêm ngày. Bấm ô đã chọn: bỏ, nếu bỏ được. Popup không đóng.
- Truyền vào `mat-calendar` một `dateFilter` ghép: trả `true` cho ngày đã chọn bỏ được (để bấm bỏ dù ngày đó trái `dateFilter` của consumer, ví dụ model có sẵn ngày cuối tuần); trả `false` cho ngày đã chọn không bỏ được; ngày chưa chọn thì `!full && consumerFilter(d)`. `minDate`/`maxDate` truyền thẳng.
- `dateClass` gắn `sd-chip-calendar-selected` / `sd-chip-calendar-locked` để style. Ô locked là disabled trong Material nên phải ghi đè style disabled cho class này.
- Tạo lại reference của `dateFilter`/`dateClass` mỗi khi selection, `maxCount`, `removable` đổi (computed), để `mat-calendar` vẽ lại. Bỏ cách gọi `updateTodaysDate()` hiện tại.
- Mọi thao tác dựng mảng mới, phát `modelChange` và `sdChange` (giữ quy tắc hiện có).

### 4.2 Tháng mở đầu tiên (B4)
Mỗi lần mở popup: `startAt` nếu có; không thì ngày đã chọn gần hôm nay nhất (theo khoảng cách tuyệt đối, bằng nhau thì lấy ngày sau); không có ngày nào thì hôm nay. Ô active (nhận focus) là ngày đó.

### 4.3 Giới hạn số lượng (A5)
Khi số ngày ≥ `maxCount`: ô chưa chọn bị vô hiệu, đầu popup báo đủ. Bỏ bớt một ngày thì mở lại ngay. Validator `maxLength` vẫn giữ cho trường hợp model gán từ ngoài vượt giới hạn.

### 4.4 Bàn phím
- Trong lưới: theo `mat-calendar` (mũi tên, Home/End, PageUp/PageDown, Enter/Space chọn hoặc bỏ).
- Tab đi qua: nút tháng trước, nhãn tháng, nút tháng sau, lưới, “Xoá hết”, “Xong”, rồi quay vòng (focus trap). Tab không đóng popup.
- Esc hoặc “Xong”: đóng, trả focus về ô nhập.
- Trên chip: Backspace/Delete chỉ bỏ chip bỏ được; chip không bỏ được thì không làm gì.

### 4.5 Lỗi (A4)
- Một hàm duy nhất quyết định lỗi có hiện không, dùng cho `ErrorStateMatcher`, `<mat-error>`, `aria-invalid`, icon lỗi khi `hideInlineError`: `invalid && (touched || form đã submit)`. Bỏ điều kiện `dirty` để lúc đang chọn dở (dưới `minCount`) không báo lỗi.
- Đóng popup thì `markAsTouched()`.
- Thông báo lỗi: thêm key cho `minCount` dùng lại `core.form.chip-calendar.minlength` / `maxlength` có sẵn.

### 4.7 Giá trị model (giống sd-date)
Giữ `model = model<SdChipCalendarModel>()` (Angular 19+ `model()` signal, `[(model)]` hai chiều). `model()` không có option transform nên việc chuẩn hoá nằm trong một `computed`, không sửa giá trị consumer truyền vào.

```ts
export type SdChipCalendarValue = string | number | Date;
export type SdChipCalendarModel = SdChipCalendarValue[] | null | undefined;
```

- **Đọc rộng:** mỗi phần tử được đọc bằng đúng hàm chuẩn hoá mà sd-date đang dùng (`DateUtilities` / `SdDateTimeService`, không viết parser mới):
  - `'yyyy/MM/dd'`: giữ nguyên chữ số.
  - ISO, UTC string, `Date`, number (timestamp ms): là instant, lấy ngày của instant đó theo `ISdCoreConfiguration.timeZone` (không cấu hình thì theo trình duyệt), giống sd-date.
  - Phần tử `null`, rỗng hoặc không đọc được: bỏ qua, dev mode `console.warn` một lần.
- **Dạng chuẩn bên trong:** `string[]` theo `yyyy/MM/dd`, đã bỏ trùng ngày (ví dụ một `Date` và một chuỗi cùng ngày). Dạng này dùng để so sánh, tô lịch, sắp xếp chip, đếm cho validator, truyền vào `removable`, và là giá trị trong `FormGroup` (`form.value`).
- **Ghi hẹp:** chỉ khi người dùng thao tác (chọn, bỏ, bỏ hết) mới `model.set(next)` và phát `sdChange(next)`. `next` là `string[]`: mỗi phần tử theo `transform` (`undefined` → `yyyy/MM/dd`; `ISOString`/`UTCString` → thời điểm đầu ngày trong zone, như sd-date). Thứ tự giữ như model hiện tại, ngày mới nối vào cuối.
- **Không ghi ngược:** model đến từ cha (kể cả `Date[]` hay `number[]`) không bị viết lại thành chuỗi và không phát event. Đổi `transform` lúc chạy không viết lại gì; lần thao tác sau mới dùng dạng mới. Cùng quy tắc “Reading is wider than writing” của sd-date.
- `minDate`, `maxDate`, `startAt` đọc bằng cùng hàm này.
- Dùng chung type `SdTemporalValueTransform` của sd-date, không khai báo type mới.

### 4.6 Chế độ viewed (C3)
`sd-view` nhận chuỗi đã sắp xếp theo ngày và định dạng theo `displayFormat`, nối bằng “, ”. Khi có `sdValueTemplate`/`sdViewDef` thì giữ như hiện nay.

## 5. A11y (A6)
- Mỗi `mat-chip-row` có `aria-label` là ngày đầy đủ theo locale của `I18nService` (`Intl.DateTimeFormat`, `{ day: 'numeric', month: 'long', year: 'numeric' }`), ví dụ “9 tháng 5, 2026”.
- Nút ✕ có `aria-label` i18n `remove` (“Bỏ ngày {date}”) với cùng chuỗi ngày đầy đủ.
- Chip locked: icon lock `aria-hidden`, tooltip vẫn có; `aria-label` của chip nối thêm “, không bỏ được”.
- Giữ nguyên các cải thiện hiện có: không `aria-hidden` trên wrapper, `role="button"` cho mặt `sdViewDef`, `aria-describedby` trỏ lỗi.

## 6. i18n key mới (đủ vi/en/ja/ko/zh)
Tiền tố `core.form.chip-calendar.`:
| Key | vi |
|---|---|
| `placeholder` | Chọn ngày |
| `dialog-label` | Chọn ngày |
| `open` | Mở lịch |
| `clear` | Bỏ hết ngày |
| `clear-all` | Xoá hết |
| `done` | Xong |
| `selected-count` | Đã chọn {count} ngày |
| `max-count` | Tối đa {max} |
| `no-limit` | Không giới hạn |
| `full` | Đã đủ {max} ngày. Bỏ bớt một ngày để chọn ngày khác. |
| `remove` | Bỏ ngày {date} |
| `locked` | Không bỏ được ngày này |
| `more` | Xem thêm {count} ngày |

Dùng lại key chung nếu đã có đúng nghĩa (ví dụ “Xong”, “Xoá hết”); ghi rõ trong kế hoạch.

## 7. Dọn code và tài liệu (D1, D2)
- Xoá: `MatAutocompleteModule`, `MatProgressSpinnerModule`, `onSelect`/`#select`, `separatorKeysCodes`, `#isBlurring`, `MatMenuModule`/`MatMenuTrigger` sau khi chuyển sang overlay.
- SCSS xoá: `.c-md`, `.sd-md {}` rỗng, `mat-chip-listbox`, `.no-padding-wrapper`, rule `::ng-deep .sd-chip-calendar-selected-date` toàn cục, `width: 280px` inline. Fallback `#ebecf0` của `--sd-chip-calendar-bg` thay bằng token.
- `onClear` gắn vào nút bỏ hết (theo predicate).
- form-render wrapper: nếu schema `validation` đã có `minItems` thì truyền `[minCount]`; chuyển `[max]` thành `[maxCount]`. Nếu schema chưa có `minItems` thì **không** thêm field schema trong đợt này, ghi lại trong báo cáo.
- `sd-chip-calendar.md`: sửa Visual cues (chip hiện `09/05/2026`, có icon lịch, nút bỏ hết, “+N”), mô tả đúng `#sdValue` (chỉ dùng ở viewed), viewed là text của `sd-view`, bảng E2E (bỏ `data-invalid` hoặc render nó; thêm `data-count`), thêm input mới, sửa ví dụ “lock past dates” dùng `[minDate]` + `[removable]`, ví dụ trong bảng có `maxVisible="2"`.

## 8. Spec cần viết trước (RED)
- A1: predicate false → Backspace trên chip không phát change; bấm ô đó trong lịch không bỏ; “Xoá hết” và nút bỏ hết giữ lại ngày đó.
- A2 / 4.7:
  - model `[Date, number, ISO string, 'yyyy/MM/dd']` → tô đúng ô, chip đúng ngày, ✕ bỏ được, change phát `string[]` dạng `yyyy/MM/dd`.
  - Cùng ngày ở hai dạng → một chip.
  - Gán model từ cha → không phát `modelChange`/`sdChange`, model của cha không bị đổi.
  - `transform="ISOString"` → output đúng thời điểm đầu ngày; có `timeZone` cấu hình → ngày theo zone (dùng lại fixture của `chip-calendar.time-zone.spec.ts` và sd-date).
  - Phần tử không đọc được → bỏ qua, có warn dev mode.
- A3: popup có `role="dialog"`; Tab từ nút tháng sau xuống lưới không đóng popup; Esc đóng và trả focus về ô nhập.
- A4: submit form khi chưa chạm → có `mat-error` và `aria-invalid="true"`; chọn 1 ngày khi `minCount=3` chưa blur → không có lỗi.
- A5: đủ `maxCount` → ô chưa chọn có `aria-disabled`, bỏ một ngày thì mở lại.
- A6: chip và nút ✕ có `aria-label` đúng chuỗi.
- B2: model `['2026/10/27','2026/10/05']` → chip theo thứ tự 05, 27; model không đổi thứ tự.
- B3: `maxVisible=2`, 5 ngày → 2 chip + “+3”; mở popup → 5 chip.
- B4: chọn sẵn ngày ở tháng khác → popup mở đúng tháng đó; `startAt` ghi đè.
- B5: `minDate`, `maxDate`, `dateFilter` làm ô disabled; ngày đã chọn trái `dateFilter` vẫn bấm bỏ được.
- `min`/`max` cũ vẫn chạy, có warn dev mode; `minCount` thắng khi cùng có.

## CHANGELOG
- **Added:** `minDate`, `maxDate`, `dateFilter`, `minCount`, `maxCount`, `maxVisible`, `clearable`, `startAt`, `displayFormat`, `transform`; type `SdChipCalendarValue`, `SdChipCalendarModel`; nút lịch và nút bỏ hết ở suffix; đầu và cuối popup; token `--sd-chip-calendar-panel-width`.
- **Changed:** `model` nhận `(string | number | Date)[]` và đọc theo time zone giống sd-date, output luôn `string[]`; `removable` nhận ngày đã chuẩn hoá; popup từ `mat-menu` sang CDK overlay `role="dialog"`; chip hiển thị theo ngày tăng dần, cao 20/24/28; ô đã chọn nền primary đặc; placeholder mặc định “Chọn ngày”; lịch mở ở tháng của ngày đã chọn gần nhất.
- **Fixed:** predicate `removable` bị bỏ qua khi dùng phím và lịch; giá trị kiểu số không xoá/tô được; Tab đóng popup; viền lỗi không kèm thông báo; vượt `maxCount` khi chọn; nút ✕ không có tên.
- **Deprecated:** `min`, `max` (dùng `minCount`, `maxCount`).
- **Removed:** code autocomplete và SCSS không dùng.
