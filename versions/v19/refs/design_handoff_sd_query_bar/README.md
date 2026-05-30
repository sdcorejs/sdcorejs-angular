# Handoff: `sd-query-bar` — Unified Filter Row

## Overview

`sd-query-bar` là component gộp nhiều bộ lọc vào **một hàng chip** (kiểu Jira / Linear / Notion), thay thế khu vực filter ngoài-table (`ExternalFilter`) hoặc filter inline trên header table (`InlineFilter`) khi user muốn giao diện gọn hơn.

Một chip = một `Filter` object. Mỗi filter có 3 phần: **field** (trường) + **operator** (toán tử) + **value** (giá trị). Operator được **ẩn mặc định** trên mặt chip để gọn — chỉ xuất hiện trong popover khi user click vào chip.

Logic giữa các filter mặc định là **AND ngầm**; user có thể chuyển sang **OR cấp toàn cục** qua một segmented toggle bên phải.

Component này **dùng chung model `Filter` và enum `Operator`** với `sd-table` (utils đã có sẵn) — không tạo type mới.

---

## About the Design Files

Các file trong gói này là **design reference được dựng bằng HTML + React/Babel** để mô tả trực quan giao diện và hành vi mong muốn. Chúng **không phải là production code**.

Nhiệm vụ của developer là **dựng lại các design này trong codebase hiện tại** (`sd-angular` — đây là một component của Angular design system) bằng patterns sẵn có (cùng kiểu với `sd-table`, `sd-button`, `sd-popover`...). Đừng copy nguyên JSX vì project chính dùng Angular.

---

## Fidelity

**High-fidelity (hifi).** Mock-up có color tokens, spacing, typography và state cụ thể; reuse trực tiếp design tokens đã dùng trong `sd-table`. Cần recreate đúng pixel.

---

## Tên component & file

| Layer | Đề xuất |
|---|---|
| Component selector | `sd-query-bar` |
| Module folder | `sd-angular/components/query-bar/` |
| Files | `sd-query-bar.component.ts`, `.html`, `.scss`, `sd-query-bar.module.ts`, `chip-popover.component.ts`, `field-picker.component.ts` |

Lý do chọn `query-bar` thay vì `filter-bar`: tên rộng hơn, sau này có thể mở rộng sang search input, sort token, group-by mà không phải đổi tên (giống Linear, Notion, Sentry).

---

## Models (dùng chung với sd-table — utils)

```ts
// Reuse từ utils
type Operator =
  | 'EQUAL' | 'NOT_EQUAL'
  | 'CONTAIN' | 'NOT_CONTAIN' | 'START_WITH'
  | 'IN' | 'NOT_IN'
  | 'GREATER' | 'GREATER_EQ' | 'LESS' | 'LESS_EQ'
  | 'BETWEEN'
  | 'IS_EMPTY' | 'IS_NOT_EMPTY';

interface Filter {
  field: string;        // key tham chiếu tới FieldDef
  operator: Operator;
  value: any;           // string | number | boolean | array | [min,max]
}

// Mới (định nghĩa trong sd-query-bar hoặc utils)
type FieldKind = 'string' | 'number' | 'select' | 'date' | 'boolean';

interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  icon?: string;                  // optional — có fallback (xem dưới)
  operators?: Operator[];         // optional — mặc định lấy theo kind
  options?: string[] | OptionItem[]; // bắt buộc nếu kind = 'select'
}
```

### Operator mặc định theo kind

```ts
const OPERATORS_BY_KIND: Record<FieldKind, Operator[]> = {
  string:  ['CONTAIN', 'EQUAL', 'NOT_EQUAL', 'START_WITH', 'IS_EMPTY', 'IS_NOT_EMPTY'],
  number:  ['EQUAL', 'NOT_EQUAL', 'GREATER', 'GREATER_EQ', 'LESS', 'LESS_EQ', 'BETWEEN'],
  select:  ['IN', 'NOT_IN', 'IS_EMPTY', 'IS_NOT_EMPTY'],
  date:    ['EQUAL', 'BETWEEN', 'GREATER', 'LESS'],
  boolean: ['EQUAL'],
};
```

### Operator label tiếng Việt

```ts
const OPERATOR_LABEL: Record<Operator, string> = {
  EQUAL:        'là',
  NOT_EQUAL:    'không là',
  CONTAIN:      'chứa',
  NOT_CONTAIN:  'không chứa',
  START_WITH:   'bắt đầu bằng',
  IN:           'thuộc',
  NOT_IN:       'không thuộc',
  GREATER:      '>',
  GREATER_EQ:   '≥',
  LESS:         '<',
  LESS_EQ:      '≤',
  BETWEEN:      'trong khoảng',
  IS_EMPTY:     'trống',
  IS_NOT_EMPTY: 'có giá trị',
};
```

### Icon fallback theo kind

Khi `FieldDef.icon` không được set, dùng map dưới đây. Cuối cùng fallback về `tune`.

```ts
const KIND_ICON: Record<FieldKind, string> = {
  string:  'text_fields',
  number:  'tag',
  select:  'list',
  date:    'event',
  boolean: 'toggle_on',
};

function iconFor(field: FieldDef): string {
  return field.icon ?? KIND_ICON[field.kind] ?? 'tune';
}
```

**Thứ tự ưu tiên:** `field.icon` → `KIND_ICON[field.kind]` → `'tune'`.

---

## API đề xuất (Angular)

```html
<sd-query-bar
  [fields]="fields"
  [(filters)]="filters"
  [(logic)]="logic"             <!-- 'AND' | 'OR' -->
  [density]="'compact'"          <!-- 'compact' | 'comfortable' -->
  [showSearch]="false"
  [showSavedViews]="false"
  [showLogicToggle]="true"
  [showClearAll]="true"
  [showOperatorOnChip]="false"
  (filtersChange)="onFiltersChange($event)"
  (apply)="reload()"
></sd-query-bar>
```

### Inputs

| Input | Type | Default | Mô tả |
|---|---|---|---|
| `fields` | `FieldDef[]` | — | Danh sách field configurable |
| `filters` | `Filter[]` | `[]` | Two-way binding |
| `logic` | `'AND' \| 'OR'` | `'AND'` | Toán tử logic toàn cục |
| `density` | `'compact' \| 'comfortable'` | `'compact'` | Cao 28px / 32px |
| `showSearch` | `boolean` | `false` | Ô tìm kiếm tự do bên trái |
| `showSavedViews` | `boolean` | `false` | Dropdown saved views bên phải |
| `showLogicToggle` | `boolean` | `false` | Hiện toggle AND/OR (chỉ active khi ≥2 chip) |
| `showClearAll` | `boolean` | `true` | Hiện nút "Xóa tất cả" khi có ≥1 chip |
| `showOperatorOnChip` | `boolean` | `false` | Hiện operator trên mặt chip |

### Outputs

| Output | Payload | Mô tả |
|---|---|---|
| `filtersChange` | `Filter[]` | Mỗi khi user thay đổi filter |
| `logicChange` | `'AND' \| 'OR'` | Khi toggle logic |
| `apply` | `void` | Khi user nhấn "Áp dụng" trong popover (gọi reload data) |

---

## Visual Specs

### Design tokens (reuse từ sd-table)

```scss
$qb-primary:       #1657d4;
$qb-primary-faint: #e8efff;
$qb-primary-hover: #0f47b8;

$qb-text:           #212121;
$qb-text-secondary: #5f6368;
$qb-text-muted:     #7a7a7a;

$qb-border:      #d6d8db;
$qb-border-soft: #e2e4e7;

$qb-bg:        #ffffff;
$qb-bg-soft:   #f5f6f7;
$qb-bg-active: #eef2ff;

$qb-success: #16a34a;
$qb-warn:    #d97706;
$qb-danger:  #dc2626;

$qb-shadow-popover: 0 6px 20px rgba(15, 23, 42, 0.12),
                    0 0 0 1px rgba(15, 23, 42, 0.06);

$qb-radius-chip:    999px;  // pill
$qb-radius-popover: 8px;
$qb-radius-input:   6px;
```

### Typography

- Font: `Roboto`, fallback system-ui
- Chip label: `13px / 500 weight`
- Operator hint (when shown on chip): `12px / 400 weight, color: $qb-text-muted`
- Popover section label (`ĐIỀU KIỆN`, `GIÁ TRỊ`): `11px / uppercase / color: $qb-text-muted`
- Saved view name: `13px / 500`

### Sizing — density

| Element | compact | comfortable |
|---|---|---|
| Chip height | 28px | 32px |
| AddFilter height | 28px | 32px |
| Logic toggle height | 28px | 32px |
| Container padding | 8px | 10px |
| Gap giữa chips | 6px | 6px |

### Container shell

- `background: $qb-bg`
- `border: 1px solid $qb-border-soft`
- `border-radius: 8px`
- `padding: 8px` (compact) / `10px` (comfortable)
- `display: flex; align-items: center; flex-wrap: wrap; gap: 6px`
- `box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04)`

---

## Chip — chi tiết

### Anatomy

```
┌──────────────────────────────────────────────────────┐
│ [icon] Field [: hoặc operator] Value [▾] [× remove]  │
└──────────────────────────────────────────────────────┘
```

### Tổng kích thước

- `height: 28px` (compact) / `32px` (comfortable)
- `border-radius: 999px` (pill)
- `padding-left: 10px`
- `padding-right: 4px` (khi có value, để chừa chỗ cho nút xóa) / `10px` (khi không có value)
- `gap giữa các phần tử bên trong: 6px`
- Border `1px solid`
- Font 13px

### State styling

| State | Khi nào | Border | Background | Label color | Value color | Shadow |
|---|---|---|---|---|---|---|
| **inactive** | Field đã chọn nhưng value rỗng | `$qb-border` | `$qb-bg` | `$qb-text-secondary` | — | none |
| **active** | Có value | `#c8d8f7` | `$qb-primary-faint` | `$qb-primary` | `#0b3a8a` | none |
| **open** | Popover đang mở | `$qb-primary` | `$qb-bg` | — | — | `0 0 0 2px $qb-primary-faint` (outer ring) |

### Nội dung chip

1. **Icon** (`16px` outlined material icon) — luôn hiện, dùng `iconFor(field)` (xem ở trên)
2. **Field label** — text, weight 500, color `$qb-text-secondary` (inactive) hoặc `$qb-primary` (active)
3. **Operator label** (optional, chỉ khi `showOperatorOnChip=true` VÀ có value) — text từ `OPERATOR_LABEL`, weight 400, font-size 12px, color `$qb-text-muted`
4. **Separator** — dấu `:` (color `$qb-text-muted`) chỉ khi `showOperatorOnChip=false` và có value
5. **Value text** — weight 500. Truncate ở `max-width: 180px` với ellipsis.
   - Single value: `"Kỹ thuật"`
   - Multi value (array > 1): `"Kỹ thuật +2"` (hiện phần tử đầu + đếm phần còn lại)
   - Range (BETWEEN): hiển thị `"20,000,000 — 40,000,000"` hoặc khoảng ngày `"01/01/2023 → 31/12/2024"`
   - Empty array hoặc null: chip ở state **inactive**
6. **Chevron** (`arrow_drop_down`, 18px, color theo state)
7. **Remove button** (chỉ khi có value): vòng tròn 20×20, icon `close` 14px, hover background `rgba(0,0,0,0.06)`

### Click handlers

- Click vào toàn chip (trừ nút remove) → mở **ChipPopover**
- Click vào nút remove (×) → `e.stopPropagation()` + xóa filter khỏi array

---

## AddFilter — chi tiết

Pill có border dashed.

- `height` theo density (28/32)
- `padding: 0 10px 0 8px`
- `border-radius: 999px`
- `border: 1px dashed $qb-border`
- `background: transparent`
- Icon: `add` 16px + text "Thêm filter"
- Font: 13px / weight 500 / color `$qb-text-secondary`

### Hover

- Border → `$qb-primary`
- Color → `$qb-primary`

### Open (khi popover đang mở)

- Border → `$qb-primary` (vẫn dashed)
- Background → `$qb-primary-faint`
- Color → `$qb-primary`

---

## Popovers

### 1. Field picker (mở từ AddFilter)

Vị trí: `top: 100%`, `margin-top: 6px`, `left: 0`.

```
┌───────────────────────────────────────┐
│ 🔍 Tìm trường...                      │  ← search row, divider dưới
├───────────────────────────────────────┤
│ [icon] Từ khóa            string      │  ← rows hover #f5f6f7
│ [icon] Phòng ban          select  ✓   │  ← faded nếu đã được dùng
│ [icon] Trạng thái         select      │
│ [icon] Lương              number      │
└───────────────────────────────────────┘
```

- `min-width: 240px`, `padding: 6px`
- `background: $qb-bg`, `border-radius: 8px`, `box-shadow: $qb-shadow-popover`
- Search row: gap 6px, padding 4px 8px 8px, border-bottom soft, autofocus input
- List items: `padding: 6px 10px`, `border-radius: 6px`, `font-size: 13px`
- Field đã được dùng: `opacity: 0.45`, không click được, hiện check icon nhỏ `$qb-primary`
- Kind label bên phải mỗi item: `font-size: 11px`, `font-family: mono`, `color: $qb-text-muted`
- Icon mỗi item: 16px, outlined, color `$qb-text-secondary`, dùng `iconFor(field)`

### 2. Chip popover (mở từ chip)

Vị trí: `top: 100%`, `margin-top: 6px`, `left: 0`.

- `width: 280px`
- `background: $qb-bg`, `border-radius: 8px`, `box-shadow: $qb-shadow-popover`

#### Cấu trúc

```
┌───────────────────────────────────────┐
│ [icon] Phòng ban             [📌 pin] │  ← header (border-bottom)
├───────────────────────────────────────┤
│ ĐIỀU KIỆN                             │
│ ┌───────────────────────────────────┐ │
│ │ thuộc                          ▾  │ │  ← operator dropdown
│ └───────────────────────────────────┘ │
│ GIÁ TRỊ                               │
│ ☑ Kỹ thuật                            │  ← value control theo kind
│ ☑ Sản phẩm                            │
│ ☐ Nhân sự                             │
│ ☐ Tài chính                           │
├───────────────────────────────────────┤
│ [Xóa filter (red)]      [Áp dụng]    │  ← footer (border-top)
└───────────────────────────────────────┘
```

##### Header

- `padding: 10px 12px`
- `border-bottom: 1px solid $qb-border-soft`
- Icon trái 16px color `$qb-primary`
- Tên field weight 500
- Pin icon bên phải (`push_pin`, 14px, opacity 0.5, optional — cho phép ghim popover mở khi nhiều thao tác)

##### Section "ĐIỀU KIỆN"

- Label: `font-size: 11px`, color `$qb-text-muted`, margin-bottom 4px, uppercase
- Dropdown: height 32, padding 0 10px, border 1px solid `$qb-border`, border-radius 6px
- Mở dropdown → list các operator hợp lệ theo kind (lấy `field.operators ?? OPERATORS_BY_KIND[field.kind]`)
- Label operator: lấy từ `OPERATOR_LABEL`

##### Section "GIÁ TRỊ"

Render control khác nhau tùy kind:

- **string** → `<input>` text autofocus, height 32, full width
- **number** → 1 input nếu không phải BETWEEN; 2 inputs `Từ — Đến` nếu là BETWEEN
- **date** → date input/range picker. UI placeholder `dd/mm/yyyy`, có icon `calendar_today`
- **select** → list checkbox (multi) hoặc radio (single tùy operator IN/EQUAL):
  - Row: `padding: 6px 8px`, `border-radius: 4px`
  - Checkbox custom: `14×14`, border 1.5px, fill `$qb-primary` khi check, check icon trắng 10px
  - Selected row background: `$qb-primary-faint`
  - Search input ở đầu nếu list > 10 options
- **boolean** → 2 button "Có" / "Không"

Với operator `IS_EMPTY` và `IS_NOT_EMPTY`: ẩn hoàn toàn section "GIÁ TRỊ".

##### Footer

- `padding: 8px 12px`, `border-top: 1px solid $qb-border-soft`
- Trái: "Xóa filter" — text button, color `$qb-danger`, icon `delete_outline` 14px, font-size 12px
- Phải: "Áp dụng" — primary button, height 28, padding 0 14px, border-radius 6px, font-size 13/500

---

## LogicToggle — chi tiết

Segmented control 2 ô AND / OR. Chỉ render khi `showLogicToggle=true` VÀ có ≥2 filter active.

- `height: 28px` (compact) / `32px` (comfortable)
- Container: padding 2px, background `$qb-bg-soft`, border `1px solid $qb-border-soft`, border-radius 6px
- Mỗi ô: padding 0 10px, font-family `Roboto Mono`, font-size 11px, weight 600, letter-spacing 0.4
- Ô đang chọn: background `$qb-bg`, color `$qb-primary`, shadow `0 1px 2px rgba(0,0,0,0.08)`
- Ô không chọn: transparent, color `$qb-text-secondary`

### Visual hint khi logic = OR

Khi `logic = 'OR'` và `showLogicToggle = true`, **render connector text giữa các chip** (ở vị trí trước chip thứ 2, 3, ...):

- Text "OR", font-family mono, font-size 10, weight 700, letter-spacing 0.6, color `$qb-text-muted`, padding 0 2px

Khi `logic = 'AND'` → KHÔNG render connector (AND ngầm, giảm noise).

---

## SavedViewsMenu — chi tiết

- Button outline, height theo density
- Padding 0 10px, border 1px solid `$qb-border`, border-radius 6px
- Background `$qb-bg`
- Nội dung: icon `bookmark_border` 14px + tên view (weight 500) + chevron 18px

---

## "Xóa tất cả" button

- Text button (không border, background transparent)
- Hiện ở góc phải khi có ≥1 filter active
- Icon `close` 14px + text `"Xóa tất cả (N)"` (N = số filter active)
- Font 12px, color `$qb-text-secondary`

---

## Search input (khi `showSearch=true`)

Ô bên trái, trước các chip.

- Pill input, height theo density
- Padding 0 10px, border 1px solid `$qb-border`, border-radius 6px
- Min-width 220px
- Nội dung: icon `search` 16px (color muted) + `<input>` (no border, font 13) + keyboard hint `/` (mono, font 10, padding 1px 4px, border soft)
- Sau ô search là divider dọc 1×16 color `$qb-border-soft`, margin 0 2px

---

## Layout responsive

- Container `display: flex; flex-wrap: wrap; gap: 6px;`
- Khi wrap nhiều dòng, các nút bên phải (LogicToggle, SavedViews, ClearAll) tự rơi xuống dòng tiếp
- Min-width 320px (chip dài bị truncate ở 180px max-width)

---

## Behavior chi tiết

### Thêm filter

1. Click `+ Thêm filter` → FieldPicker popover mở
2. User search hoặc click một field → popover đóng, thêm 1 Filter mới vào array với:
   - `field: <key>`
   - `operator: <field.operators?.[0] ?? OPERATORS_BY_KIND[kind][0]>`
   - `value: null` (hoặc `[]` với select multi)
3. Chip mới ở state **inactive** + auto-open ChipPopover để user nhập value ngay

### Edit chip

1. Click chip → ChipPopover mở
2. User đổi operator/value → preview ngay trong popover, chưa apply
3. Click "Áp dụng" → emit `filtersChange` + `apply`, đóng popover
4. Click ra ngoài popover → cũng commit (giữ behavior Jira)

### Đổi operator → reset value?

- Khi đổi giữa operators **cùng loại đầu vào** (vd `EQUAL` ↔ `NOT_EQUAL`, `IN` ↔ `NOT_IN`): **giữ value**
- Khi đổi sang `BETWEEN`: convert single value thành `[value, null]`
- Khi đổi sang `IS_EMPTY` / `IS_NOT_EMPTY`: clear value
- Khi đổi từ single sang multi (vd `EQUAL` → `IN`): wrap thành array

### Xóa filter

- Click nút × trên chip → xóa khỏi array ngay (không cần confirm)
- Click "Xóa filter" trong popover → xóa + đóng popover
- Click "Xóa tất cả" → reset array thành `[]`

### Toggle AND ↔ OR

- Áp dụng cấp toàn cục — toàn bộ filters dùng cùng connector
- Khi chuyển sang OR: render text "OR" giữa các chip

---

## Tích hợp với sd-table

`sd-table` đã có `[showInlineFilter]` cho filter trong header. Thêm input mới để chuyển mode:

```html
<sd-table
  [rows]="rows"
  [columns]="columns"
  [filterMode]="'bar' | 'inline' | 'external' | 'none'"
  [(filters)]="filters"
></sd-table>
```

Mode:
- `'none'` — không filter
- `'inline'` — filter trong header column (mặc định hiện tại)
- `'bar'` — render `<sd-query-bar>` phía trên table
- `'external'` — `<sd-external-filter>` riêng (mặc định cũ)

User có thể có một toggle ở toolbar của trang để chuyển mode. `filters` array là **single source of truth**, share giữa 3 mode.

---

## States cần dựng (xem trong `Query Bar.html` mở canvas)

| Section | Artboard | Mô tả |
|---|---|---|
| Trạng thái chính | V1 Resting | Empty / 1 filter / nhiều filter / pending |
| Trạng thái chính | V2 Add | FieldPicker popover mở |
| Trạng thái chính | V3 Edit | ChipPopover mở với operator + value |
| Biến thể nâng cao | V4 Logic | AND vs OR (connector hiện khi OR) |
| Biến thể nâng cao | V5 Full kit | Search + saved views + operator visible |
| Biến thể nâng cao | V6 Integrated | Toggle giữa Bar mode và Inline mode trên sd-table |
| Meta | Icon fallback | Demo fallback theo `kind` khi `field.icon` không set |
| Meta | Playground | Tweak panel — thử mọi biến thể |

---

## Files trong bundle

| File | Mục đích |
|---|---|
| `Query Bar.html` | Design canvas chính — mở để xem trực quan 6 variation + Playground |
| `sd-query-bar.jsx` | Component prototype (React) — reference cho structure, props, render logic |
| `sd-table.jsx` | Component table hiện có — reference cho tokens và InlineFilter (để hiểu mode `inline`) |
| `design-canvas.jsx` | Khung canvas (không cần implement) |
| `tweaks-panel.jsx` | Panel tweak (không cần implement) |
| `README.md` | Tài liệu này |

---

## Assets

Không có asset binary. Tất cả icon dùng **Material Icons Outlined** — đã có trong sd-angular qua font CDN.

Font: **Roboto** (đã có trong sd-angular).

---

## Acceptance checklist

- [ ] `<sd-query-bar>` selector hoạt động, accept `[fields]`, `[(filters)]`
- [ ] Chip render đúng 3 state (inactive / active / open) với tokens spec
- [ ] Operator ẩn mặc định, hiện trong popover; `showOperatorOnChip=true` thì hiện trên chip
- [ ] Icon fallback theo `iconFor(field)` (priority: `field.icon` → `KIND_ICON[kind]` → `'tune'`)
- [ ] Field picker popover liệt kê field còn lại (faded field đã dùng)
- [ ] Chip popover có operator dropdown phù hợp kind + value control theo kind
- [ ] Logic AND/OR toggle hoạt động; connector "OR" hiện giữa chip khi logic = OR
- [ ] "Xóa tất cả" + nút × trên chip + "Xóa filter" trong popover đều hoạt động
- [ ] Density `compact` / `comfortable` đổi đúng kích thước
- [ ] Wrap đúng khi nhiều filter
- [ ] Two-way binding `[(filters)]` emit đúng khi user thao tác
- [ ] Reuse `Filter` và `Operator` từ utils — không tạo type mới
- [ ] Có thể tích hợp với `sd-table` qua `[filterMode]="'bar'"`
