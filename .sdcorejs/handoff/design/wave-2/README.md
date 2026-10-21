# Handoff: SD Core UI · Đợt 2 (token control, checkbox, indicator trên sd-button, operator trong control)

## Overview
Đợt 2 gồm bốn phần, làm theo thứ tự:
- **D. Token control.** Bo góc, viền, hover, focus, disabled và panel dùng chung cho mọi control dạng ô.
- **E. Checkbox.** Bo góc và màu viền cho checkbox và radio.
- **F. Indicator trên sd-button.** Chấm hoặc số ở góc trên phải.
- **G. Operator trong control.** Operator thành chip tiền tố bên trong ô; column-filter dùng lại.

Đợt 2 làm chung với đợt 1 theo thứ tự trong `../PROMPT.md`. Mục D và E làm ngay sau mục A của đợt 1, nên primitive tìm kiếm (đợt 1 B) và sd-segmented dựng thẳng trên token control mới.

Ngoài phạm vi:
- Redesign bố cục sd-table: toolbar, hàng filter inline tách riêng, trạng thái "đang lọc" của ô filter (T11–T13 trong design review).
- Indicator cho sd-tab và mục sidebar.

## About the Design Files
`Wave 2 Controls.dc.html` là **bản tham chiếu thiết kế viết bằng HTML**, không phải mã production để copy. Mở bằng trình duyệt; `support.js` phải nằm cùng thư mục. Tweak `showCurrent` dùng để ẩn hoặc hiện cột "Hiện trạng".

Dựng lại bằng SCSS và template Angular hiện có: standalone component, signal input, token `--sd-*`, theo đúng `CLAUDE.md`. Không copy markup hay inline style.

## Fidelity
**High-fidelity.** Mọi giá trị trong file này là giá trị cuối cùng. Chúng là token đang có hoặc biểu thức `color-mix()` từ token đó. Hex trong HTML chỉ là giá trị đã giải của palette mặc định, không được đưa vào SCSS. `check:scss-hex` phải xanh.

## Quy tắc repo bắt buộc
- Chỉ sửa `versions/v19/**`, rồi chạy `npm run sync` và `npm run check:sync`.
- Component token chỉ khai báo trong `_component-tokens.scss`. Token dùng chung khai báo ở tier phù hợp: `_scales.scss` cho kích thước, `_semantic.scss` cho vai trò màu. Cập nhật THEME.md.
- Tham chiếu token mới phải có fallback, ví dụ `var(--sd-control-radius, 8px)`.
- Rule focus không chứa hex.
- Viết spec RED trước khi sửa hành vi. Chạy full Karma tuần tự.
- Rà API consistency theo "Review bắt buộc" trong CLAUDE.md.
- Thêm i18n key thì phải đủ 5 locale vi/en/ja/ko/zh.
- Cùng một nguồn ship cho 4 major Angular Material. Tên token Material phải khai báo cho cả hai thế hệ, như `_material-tokens.scss` đang làm: `--mdc-outlined-text-field-*` (19) và `--mat-form-field-outlined-*` (20+). Xác minh tên trong `node_modules` của từng major trước khi dùng.

---

## D. Token control

### Token mới
`_scales.scss`:

| Token | Giá trị |
|---|---|
| `control-radius` | `8px` (bằng `radius-8`) |
| `panel-radius` | `10px` (bằng `radius-10`) |

`_semantic.scss` (light và dark cùng biểu thức):

| Token | Giá trị |
|---|---|
| `--sd-control-border` | `color-mix(in srgb, var(--sd-border-strong) 80%, var(--sd-surface))`. Light ≈ #8f9199 (3:1), dark ≈ #75777f (khoảng 4:1). |
| `--sd-control-border-hover` | `var(--sd-border-strong)` |
| `--sd-control-border-focus` | `var(--sd-border-focus)` |
| `--sd-control-border-disabled` | `var(--sd-border)` |
| `--sd-control-ring` | `0 0 0 3px color-mix(in srgb, var(--sd-focus-ring-color) 20%, transparent)` |
| `--sd-control-ring-error` | `0 0 0 3px color-mix(in srgb, var(--sd-error) 18%, transparent)` |
| `--sd-control-bg-disabled` | `var(--sd-disabled-bg)` |

### mat-form-field (outline)
Trong `_material-tokens.scss`, khai báo cả hai prefix:
- `container-shape`: `var(--sd-control-radius)`
- `outline-color`: `var(--sd-control-border)`
- `hover-outline-color`: `var(--sd-control-border-hover)`
- `disabled-outline-color`: `var(--sd-control-border-disabled)`
- `outline-width`: `1px`
- `focus-outline-width`: `1px`
- `focus-outline-color` và `error-*-outline-color`: giữ như hiện tại.

Trong `core/form.scss`:
- **Vòng focus.** `.mat-form-field-appearance-outline.mat-focused .mat-mdc-text-field-wrapper` có `box-shadow: var(--sd-control-ring)` và `border-radius: var(--sd-control-radius)`. Khi invalid và focused thì dùng `--sd-control-ring-error`.
- **Label float khi focus.** Label nằm đè lên vòng focus, nên cần nền `var(--sd-control-label-bg, var(--sd-surface))` để cắt vòng ở chỗ notch. Context có nền khác (table) đặt lại `--sd-control-label-bg`. Kiểm tra bằng mắt ở size sm và md.
- **Forced colors.** `@media (forced-colors: active)`: thêm `outline: 2px solid Highlight; outline-offset: 2px` khi focus, vì box-shadow không hiện.
- **Disabled.** `.mat-form-field-disabled .mat-mdc-text-field-wrapper { background: var(--sd-control-bg-disabled) }` áp chung. Gỡ rule trùng trong `select.component.scss` nếu cho kết quả giống hệt.
- Không đổi chiều cao, typography label, error message hay padding.

Các control sau tự nhận vì cùng dùng mat-form-field outline: sd-input, sd-input-number, sd-textarea, sd-select, sd-autocomplete, sd-date, sd-datetime, sd-date-range, phần ô của sd-input-color. Kiểm tra lại từng cái trên showcase.

### Panel
Áp cho `.mat-mdc-select-panel.sd-select-panel`, `.mat-mdc-autocomplete-panel.sd-autocomplete-panel` và menu của sd-operator (`.c-op-menu`):
- Bo `var(--sd-panel-radius)`, viền 1px `color-mix(in srgb, var(--sd-border) 60%, var(--sd-surface))`.
- Bóng `var(--sd-shadow-md)` nếu tương đương; không có thì dùng scale shadow gần nhất, không thêm giá trị mới.
- Option thụt ngang 4px (chỉ margin ngang), bo `var(--sd-radius-6)`, giữ `min-height: 36px`. Virtual scroll dùng chiều cao cố định, nên không thêm margin hay gap theo chiều dọc.
- Option đang chọn: nền `--sd-primary-light`, chữ `--sd-primary-dark`, font-weight 500. Single select giữ dấu tick.
- Hover: `color-mix(in srgb, var(--sd-text) 5%, var(--sd-surface))`.
- Ô tìm kiếm trong panel (`.filter-input-wrapper`): bo `--sd-control-radius`, viền `--sd-control-border`.
- Datepicker: đặt container shape của calendar bằng `--sd-panel-radius` nếu Material có token.

### Control tự viết (không dùng mat-form-field)
- **Primitive tìm kiếm (đợt 1 B), áp khi làm bước B:** các thông số dưới đây thay cho bo góc, viền và focus ghi trong README đợt 1.
  - Bo `--sd-control-radius` cho cả sm và md.
  - Viền `--sd-control-border`, hover `--sd-control-border-hover`.
  - Focus đổi từ outline 2px offset 1px sang viền `--sd-control-border-focus` cộng `--sd-control-ring`.
- **sd-entity-picker:**
  - Bo `--sd-control-radius`, viền `--sd-control-border`.
  - Focus chuyển lên `.sd-entity-picker__control:focus-within`, cùng kiểu với mat-form-field.
- **sd-segmented, áp khi làm bước segmented:** track tham chiếu `--sd-control-radius` thay cho `--sd-radius-8`. Cùng giá trị nên không đổi hình ảnh.
- **Không đổi:** sd-inline-text (đọc như chữ), swatch của sd-input-color, ô ngày của sd-chip-calendar.
- **Inline edit trong bảng (`_inline-edit.scss`):** xác nhận lại trên showcase.

Trước khi sửa, grep `--sd-radius-4|--sd-radius-6|border-radius` trong `forms/**` và `components/**`. Liệt kê từng chỗ là control dạng ô kèm quyết định đổi hay giữ.

### Opt-out cho consumer
Ghi trong THEME.md và CHANGELOG: muốn giữ giao diện cũ thì đặt `--sd-control-radius: 4px`, `--sd-control-border: var(--sd-border)`, `--sd-control-ring: none`.

---

## E. Checkbox và radio
- **Bo góc theo cỡ** (khoảng 22% cạnh):

  | Cỡ | Cạnh | Bo |
  |---|---|---|
  | sm | 14px | 3px |
  | md | 18px | `var(--sd-radius-4)` |
  | lg | 22px | 5px |

  Thêm biến private `--sd-checkbox-radius` vào mixin `checkbox-size` trong `checkbox.component.scss`, áp lên `.mdc-checkbox__background`.
- **mat-checkbox dùng trực tiếp** (cột chọn của sd-table `.c-selection`, v.v.): rule chung trong `form.scss` đặt `.mat-mdc-checkbox .mdc-checkbox__background { border-radius: var(--sd-radius-4, 4px) }`.
- **`mat-pseudo-checkbox`** trong option của select nhiều lựa chọn: `border-radius: var(--sd-radius-4, 4px)`.
- **Màu viền chưa chọn:** `--sd-border-strong` (thay cho on-surface-variant mặc định). Hover và focus dùng `--sd-text-secondary`. Viền giữ 2px. Khai báo cả `--mdc-checkbox-unselected-*` và `--mat-checkbox-unselected-*`, cùng cơ chế với màu đã chọn trong file.
- **Radio:** giữ tròn, màu viền chưa chọn như checkbox.
- **Spec:** thêm assert bo góc cho 3 cỡ vào `checkbox-size.spec.ts`.

---

## F. Indicator trên sd-button

### API (input mới)
| Input | Kiểu | Mặc định | Hành vi |
|---|---|---|---|
| `indicator` | `boolean \| number \| null` | `null` | `true`: chấm. Số > 0: hiện số (làm tròn xuống). 0, số âm, NaN, false, null: ẩn. |
| `indicatorColor` | `Color` | `'error'` | Nền `--sd-{color}`, chữ `--sd-{color}-contrast`. |
| `indicatorMax` | `number` | `99` | Vượt ngưỡng hiện `{max}+`. |
| `indicatorLabel` | `string` | — | Văn bản cho screen reader. |

### Hình học
`h` là chiều cao nút (`--sd-control-height-sm/md/lg`). Điểm neo `a = 0.146 × h`, tức điểm 45° trên cung góc trên phải: 4.7 / 5.9 / 7px.

| Cỡ | Chấm | Số: cao / padding / chữ |
|---|---|---|
| sm | 8px | 16px / 0 4px / 11px 600 |
| md | 8px | 18px / 0 5px / 11px 600 |
| lg | 10px | 20px / 0 6px / 12px 600 |

- **Chấm:** `top: a; right: a; transform: translate(50%, -50%)`.
- **Số:** `top: a; left: calc(100% - a - cao/2); transform: translateY(-50%)`, nên số dài ra về bên phải. `min-width` bằng chiều cao, bo 999px, `font-variant-numeric: tabular-nums`.
- **Viền tách:** `box-shadow: 0 0 0 2px var(--sd-button-indicator-ring)`. Khai báo `button-indicator-ring: var(--sd-surface)` trong `_component-tokens.scss`.
- Cùng công thức cho nút tròn icon-only và nút pill, cho cả 4 type.

### Render và hành vi
- Phần tử nằm trong host, là anh em của native button, không nằm trong button, để ripple và overflow không cắt nó.
  - Host cần `position: relative`. Không được đổi kích thước hay layout của nút: so `getBoundingClientRect` có và không có indicator phải bằng nhau.
  - `pointer-events: none`, `aria-hidden="true"`.
- **Disabled:** nền `--sd-disabled-text`, chữ `--sd-surface`. **Loading:** giữ nguyên.
- **A11y:**
  - `indicatorLabel` render thành span ẩn trực quan có id, nối vào `aria-describedby` của native button. Không ghi đè `aria-label` hiện có.
  - Số thay đổi không dùng live region.
- **Docs và spec:**
  - Thêm mục vào `sd-button.md`, demo trên showcase.
  - Spec: các trạng thái ẩn, chấm và số, max, màu, describedby, kích thước nút không đổi.

---

## G. Operator trong control

### Bước thiết kế, dừng chờ duyệt
Trước khi code, trình đề xuất gồm:
1. **Kiến trúc trigger.** Tách logic của `SdOperator` (resolve OPERATORS, i18n, icon SVG, menu) thành phần nội bộ dùng chung (`ɵ`) để control nhúng làm chip. Public API của `sd-operator` giữ nguyên, query-bar vẫn dùng `open()`.
2. **API trên control.** `operators: Operator[]` (mặc định `[]`) và `operator = model<Operator | undefined>()` trên sd-input, sd-input-number, sd-select, sd-date, sd-date-range. Rà tên theo "Review bắt buộc".
3. **Operator khoảng và trống.** Kiểm tra `@sdcorejs/utils` OPERATORS có operator kiểu khoảng (between) hoặc trống (is empty) không. Không tự thêm giá trị mới. Nếu không có:
   - `split-number` và `split-date` vẫn là filter type, chỉ đổi cách hiển thị thành một ô "từ – đến".
   - Trạng thái "trống" bỏ qua.

### Chip
- **Vị trí:** dùng làm `matPrefix`, là một `<button type="button">`. Chỉ render khi `operators.length > 1`. Có đúng 1 operator thì đặt `operator` bằng nó và không hiện chip.
- **Nội dung:** icon SVG từ OPERATORS (sm 16px, md 18px) và `expand_more` (14 / 16px). Nhãn chữ nằm trong tooltip và menu. Hình HTML dùng ký hiệu/chữ chỉ để minh hoạ.
- **Kích thước:**

  | Cỡ field | Chip cao | Padding | Cách mép trái field |
  |---|---|---|---|
  | sm 32 | 24px | 0 2px 0 6px | 4px |
  | md 40 | 28px | 0 4px 0 8px | 6px |

  Bo `calc(var(--sd-control-radius) - 3px)`, gap 2px.
- **Màu:**
  - Chưa có giá trị: nền `color-mix(in srgb, var(--sd-surface-muted) 75%, var(--sd-surface))`, chữ `--sd-text-secondary`.
  - Có giá trị: nền `--sd-primary-light`, chữ `--sd-primary-dark`.
  - Menu đang mở: nền `--sd-primary`, chữ `--sd-primary-contrast`.
  - Hover: `color-mix(in srgb, var(--sd-text) 6%, <nền hiện tại>)`.
  - Focus-visible: `outline: var(--sd-focus-ring-width) solid var(--sd-focus-ring-color)`, offset 1px.
- **Menu:** panel theo mục D. Hàng có icon và nhãn, hàng đang chọn có dấu tick. Giữ dòng mã operator nếu đang có.

### Hành vi
- **Bàn phím:** Tab vào chip trước rồi tới ô nhập. Enter, Space hoặc Alt+↓ mở menu. Chọn xong focus về ô nhập; Escape đóng menu và focus về chip.
- **Label:** có chip thì label luôn float (`floatLabel="always"`).
- **Đổi operator:** giữ giá trị nếu còn hợp lệ với operator mới.
- **Nút xoá:** chỉ xoá giá trị, giữ operator.
- **Ô hẹp dưới 120px** (container query trên field): ẩn mũi tên của chip.
- **Ô "từ – đến"** (nếu làm theo bước 3): hai input trong cùng một field, nối bằng "–". Mỗi input có accessible name riêng (Từ / Đến). Nút xoá xoá cả hai.

### column-filter
- **Bỏ sd-operator riêng:** gỡ `<sd-operator class="mr-4">` khi filter dùng control mặc định; truyền `[operators]` và `[(operator)]` xuống control.
- **Có `templateRef` custom:** giữ sd-operator bên ngoài như cũ, vì không chèn được vào template của consumer.
- **Kiểu không hỗ trợ:** cột filter hiện render `sd-input disabled` cho kiểu không hỗ trợ. Không đổi trong đợt này; ghi vào PR như việc còn lại của redesign table.
- **Giữ nguyên** `operatorChange`, `filterChange`, `filterCommit` và thời điểm emit.

### Docs và spec
- Cập nhật md của từng control có `operators`, cùng `sd-operator.md` nếu có.
- Spec: chip ẩn khi ≤ 1 operator, thứ tự Tab, mở menu bằng bàn phím, focus sau khi chọn, xoá giữ operator, label luôn float, column-filter không còn render sd-operator riêng.

---

## Changelog (`## [Unreleased]`)
- **Added:** token `--sd-control-*`, `control-radius` và `panel-radius`; input `indicator*` của sd-button; `operators` và `operator` trên các control; token `button-indicator-ring`.
- **Changed:** bo góc, viền, hover, focus và disabled của control; panel select/autocomplete; bo góc và màu viền checkbox/radio; column-filter đặt operator trong control. Kèm hướng dẫn opt-out.
