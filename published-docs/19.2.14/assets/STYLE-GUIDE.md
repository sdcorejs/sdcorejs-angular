# `@sdcorejs/angular` — Assets & SCSS Reference

> **Mục đích tài liệu này (cho người + AI agent):** liệt kê chính xác mọi utility class, design token, font, image, theme mixin mà `@sdcorejs/angular` ship trong `assets/`. AI agent chỉ được sinh template dùng class **nằm trong danh sách dưới đây** — nếu cần class mới, phải tạo trong `core/utilities/*.scss` trước.

---

## Mục lục

1. [Cài đặt vào Angular](#1-cài-đặt-vào-angular)
2. [Cấu trúc thư mục `assets/`](#2-cấu-trúc-thư-mục-assets)
3. [Hệ thống màu sắc](#3-hệ-thống-màu-sắc) — `--sd-*` tokens + `.text-*` / `.bg-*` / `.border-*`
4. [Typography tokens](#4-typography-tokens) — `T{size}{weight}` + `fs-*` + `font-weight-*`
5. [Layout & Grid](#5-layout--grid) — `row` / `col-*` / `grid-container` / `grid-cols-*`
6. [Flexbox utilities](#6-flexbox-utilities) — `d-flex` + `flex-*` + `align-*` + `justify-*`
7. [Spacing](#7-spacing) — `m-*` / `p-*` / `gap-*`
8. [Sizing](#8-sizing) — `w-*` / `h-*` / `min-*` / `max-*`
9. [Border & radius](#9-border--radius) — `border` / `border-{side}` / `rounded-*`
10. [Display, position, overflow, visibility](#10-display-position-overflow-visibility)
11. [Cursor, vertical-align, misc](#11-cursor-vertical-align-misc)
12. [Elevation (mat-elevation-z0–z8)](#12-elevation-mat-elevation-z0z8)
13. [Reset / Reboot baseline](#13-reset--reboot-baseline)
14. [Custom theme](#14-custom-theme)
15. [Fonts & Images shipped](#15-fonts--images-shipped)
16. [What is NOT shipped](#16-what-is-not-shipped) — anti-confusion cho AI
17. [AI rendering guardrails](#17-ai-rendering-guardrails) — ưu tiên Core UI trước khi viết CSS mới

---

## 1. Cài đặt vào Angular

`angular.json`:

```json
"styles": [
  "./node_modules/@sdcorejs/angular/assets/scss/sd-core.scss",
  "src/styles.scss"
]
```

`sd-core.scss` là entry point duy nhất — auto-load reset, utilities, color theme, form overrides, scrollbar, Angular Material theme. Không cần import partial nào riêng lẻ.

Control `size="sm"` dùng khung 32px. Floating label ở trạng thái rỗng/chưa focus được căn giữa dòng đầu bằng style dùng chung, kể cả label có wrapper `sd-form-field-label`. Khi focus hoặc có giá trị, label vẫn nổi theo Angular Material; textarea nhiều dòng giữ label ở dòng đầu.

Label, icon trợ giúp và dấu required của Material nằm cùng một hàng ở `sm`, cả outline/fill và khi focus. Label dài được cắt bằng dấu ba chấm trong ô hẹp; icon và dấu `*` vẫn hiển thị. Quy tắc dùng chung cho input/input-number/input-color, select (đơn/đa lựa chọn), autocomplete, date/datetime/date-range/time, textarea và tree-select; chip/chip-calendar giữ label Material mặc định.

> Convention chung: **mọi utility class đều có `!important`** để đảm bảo override được Angular Material (thường có specificity cao).

---

## 2. Cấu trúc thư mục `assets/`

```
projects/sdcorejs-angular/assets/
├── STYLE-GUIDE.md                     # Tài liệu này (assets + SCSS reference cho người + AI agent)
├── fonts/
│   ├── fonts.scss                     # @font-face khai báo cho Roboto + Material Icons + Material Symbols
│   ├── material-icons/                # 2 file .woff2 (icons-v145 + outlined-v110)
│   ├── material-symbols/              # 1 file .woff2 (symbols-v29)
│   └── roboto/                        # 4 file .woff2 (regular, italic, 500, 600 — latin + vietnamese)
├── images/                            # SVG illustrations (18 file — empty-state, error, success...)
│   ├── coming-soon.svg                # Trang chưa sẵn sàng
│   ├── data-empty.svg                 # Empty state cho table/list
│   ├── expired.svg                    # Session expired
│   ├── file-error.svg                 # Upload file lỗi
│   ├── filter-empty.svg               # Không match filter
│   ├── filter-required.svg            # Yêu cầu bộ lọc trước khi load
│   ├── forbidden.svg                  # 403
│   ├── image-error.svg                # Image load fail
│   ├── maintenance.svg                # Trang đang bảo trì
│   ├── not-found.svg                  # 404
│   ├── offline.svg                    # Mất mạng
│   ├── submitted.svg                  # Gửi form thành công
│   ├── success.svg                    # Generic success
│   ├── unauthorized.svg               # 401
│   └── unknown-error.svg              # 500 / fallback
└── scss/
    ├── sd-core.scss                   # ENTRY (chỉ file này được import từ host app)
    ├── ckeditor5.scss                 # Override style cho CKEditor 5 (opt-in)
    ├── core/
    │   ├── color.scss                 # Color map + CSS var declarations
    │   ├── form.scss                  # Override Angular Material form (input/select/checkbox/radio)
    │   ├── image.scss                 # Tiện ích background-image cho 18 illustration SVG ở trên
    │   ├── scrollbar.scss             # Custom scrollbar (webkit + firefox)
    │   └── utilities/
    │       ├── _index.scss            # Forward toàn bộ partial bên dưới
    │       ├── _base.scss             # Reset/reboot baseline (box-sizing, body, headings, forms…)
    │       ├── _border.scss           # rounded-* + border + border-{side}
    │       ├── _display.scss          # d-none/block/inline/inline-block/flex/inline-flex/grid
    │       ├── _elevation.scss        # mat-elevation-z0–z8
    │       ├── _flexbox.scss          # flex-1/none/auto, direction, wrap, grow/shrink, align/justify
    │       ├── _gap.scss              # gap-* / gap-x-* / gap-y-*
    │       ├── _grid.scss             # row/col 12-column + .grid-container + col-span-*
    │       ├── _misc.scss             # align-{middle…}, cursor-*, visible/invisible
    │       ├── _overflow.scss         # overflow-*
    │       ├── _position.scss         # position-relative/absolute/fixed/sticky/static
    │       ├── _sizing.scss           # w-* / h-* + min/max + w-full/screen/auto/fit
    │       ├── _spacing.scss          # m-*, p-* (mt/mr/mb/ml/mx/my, pt/pr/pb/pl/px/py) + m-auto
    │       └── _typography.scss       # T{n}{M|R} tokens + fs-* + font-weight-* + text-*
    └── themes/
        ├── default.scss               # sd.theme() mixin — override `--sd-*` color tokens
        └── material-theme.scss        # Angular Material M3 theme/token baseline
```

---

## 3. Hệ thống màu sắc

Màu được định nghĩa dưới dạng **CSS custom properties** với prefix `--sd-*`, cho phép override runtime (không cần recompile SCSS). Default theme sở hữu màu độc lập. Dùng `$source: 'material'` để chủ động bật nguồn màu tương thích cũ.

### 3.1 Color tokens

| Token | CSS variable | Default bridge / fallback | Use for |
|---|---|---|---|
| `primary` | `--sd-primary` | `#005cbb` | Main action color |
| `primary-light` | `--sd-primary-light` | `color-mix(in srgb, var(--sd-primary) 14%, white)` | Soft primary background |
| `primary-dark` | `--sd-primary-dark` | `color-mix(in srgb, var(--sd-primary) 84%, black)` | Primary hover/active shade |
| `primary-contrast` | `--sd-primary-contrast` | `#ffffff` | Text/icon on primary |
| `secondary` | `--sd-secondary` | `#5c6270` | Secondary action/accent |
| `secondary-light` | `--sd-secondary-light` | `color-mix(in srgb, var(--sd-secondary) 12%, white)` | Soft secondary background |
| `secondary-dark` | `--sd-secondary-dark` | `color-mix(in srgb, var(--sd-secondary) 84%, black)` | Secondary hover/active shade |
| `secondary-contrast` | `--sd-secondary-contrast` | `#ffffff` | Text/icon on secondary |
| `info`, `success`, `warning`, `error` | `--sd-info`, ... | Semantic base colors | Info, success, warning, and error states |
| `*-light` | `--sd-info-light`, ... | `color-mix(in srgb, var(--sd-*) 14%, white)` | Soft semantic background |
| `*-dark` | `--sd-info-dark`, ... | `color-mix(in srgb, var(--sd-*) 84%, black)` | Semantic hover/active shade |
| `*-contrast` | `--sd-info-contrast`, ... | `#ffffff` | Text/icon on semantic color |
| `surface` | `--sd-surface` | `#fdfbff` | Page/component surface |
| `surface-muted` | `--sd-surface-muted` | `#e7e8ed` | Muted neutral background |
| `text` | `--sd-text` | `#1a1b1f` | Primary text |
| `text-secondary` | `--sd-text-secondary` | `#44474f` | Secondary text |
| `text-muted` | `--sd-text-muted` | `color-mix(in srgb, var(--sd-text) 62%, transparent)` | Muted text |
| `border` | `--sd-border` | `#c4c6d0` | Divider/subtle border |
| `border-strong` | `--sd-border-strong` | `#74777f` | Strong border/focus outline |
| `disabled-bg` | `--sd-disabled-bg` | `color-mix(in srgb, var(--sd-text) 8%, transparent)` | Disabled background |
| `disabled-text` | `--sd-disabled-text` | `color-mix(in srgb, var(--sd-text) 60%, transparent)` | Disabled text/icon |
### 3.2 Color utility classes

Mọi token ở §3.1 đều sinh 3 class:

| Pattern         | Ví dụ                     |
|---|---|
| `.text-{token}` | `text-primary`, `text-error`, `text-secondary` |
| `.bg-{token}`   | `bg-primary-light`, `bg-error-light`, `bg-white` |
| `.border-{token}` | `border-primary`, `border-error` |

`white` / `black` luôn có sẵn ngoài bảng trên: `.text-white` / `.text-black` / `.bg-white` / `.bg-black`.

### 3.3 Dùng màu trong component SCSS

```scss
@use '@sdcorejs/angular/assets/scss/core/color.scss' as color;
@use 'sass:map';

.my-element {
  color: map.get(color.$color_map, 'primary');
  background: map.get(color.$color_map, 'primary-light');
  border-color: map.get(color.$color_map, 'border');
}
```

Hoặc đọc trực tiếp CSS var (recommended cho runtime override):

```scss
.my-element {
  color: var(--sd-primary);
  background: var(--sd-primary-light);
}
```

---

## 4. Typography tokens

### 4.1 Design token classes — `T{size}{weight}`

Quy ước: `M` = Medium (500), `R` = Regular (400). Mỗi class gồm `font-size` + `font-weight` + `line-height` chuẩn hóa.

| Class           | Font size     | Weight    | Line height |
|---|---|---|---|
| `T48M` / `T48R` | 48px          | 500 / 400 | 56px |
| `T32M` / `T32R` | 32px          | 500 / 400 | 48px |
| `T24M` / `T24R` | 24px / 20px*  | 500 / 400 | 28px |
| `T20M` / `T20R` | 20px          | 500 / 400 | 28px |
| `T18M` / `T18R` | 18px          | 500 / 400 | 28px |
| `T16M` / `T16R` | 16px          | 500 / 400 | 24px |
| `T14M` / `T14R` | 14px          | 500 / 400 | 20px |
| `T12M` / `T12R`† | 12px          | 500 / 400 | 16px |
| `T10M` / `T10R` | 10px          | 500 / 400 | 12px |

\* `T24R` font-size 20px (quirk lịch sử — `T24M` là 24px). Khi cần 24px/400, dùng `T20R` 20px hoặc cặp `fs-24 + font-weight-normal`.
† `T12R` dùng `!important` vì hay bị Angular Material override.

### 4.2 Font-size utilities (px-based)

```
fs-0   fs-1 … fs-200
```

Dùng khi cần override nhanh, **không thay** design token. Output: `font-size: {n}px !important`.

### 4.3 Font-weight

| Class                  | weight |
|---|---|
| `font-weight-light`    | 300 |
| `font-weight-normal`   | 400 |
| `font-weight-medium`   | 500 |
| `font-weight-bold`     | 600 |
| `font-weight-bolder`   | 700 |

### 4.4 Text alignment / wrap / transform

```
text-left   text-center   text-right   text-justify
text-wrap   text-nowrap   text-ellipsis   text-break
text-uppercase   text-lowercase   text-capitalize
```

| Class            | Output |
|---|---|
| `text-ellipsis`  | `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` (yêu cầu container có width cố định) |
| `text-break`     | `overflow-wrap: break-word; word-break: break-word` (xuống dòng giữa ký tự — URL, hash, mã dài) |

---

## 5. Layout & Grid

### 5.1 Flexbox row/col 12-column

```html
<div class="row">
  <div class="col-6">50%</div>
  <div class="col-6">50%</div>
</div>
```

`.row` là flex container có gutter `16px` (margin âm trừ gutter + padding nửa gutter trên `> *`).

**Gutter variants:**

| Class    | Gutter |
|---|---|
| `row`    | 16px (mặc định) |
| `row-md` | 8px |
| `row-sm` | 4px |
| `row-xs` | 2px |

**Auto-width column:** `.col` (chiếm phần còn lại, `flex: 1 1 0%`).

**Responsive columns** (mobile-first — class chỉ kích hoạt khi viewport ≥ breakpoint):

| Pattern         | Min-width |
|---|---|
| `col-sm-{1-12}` / `col-sm` | ≥ 576px |
| `col-md-{1-12}` / `col-md` | ≥ 768px |
| `col-lg-{1-12}` / `col-lg` | ≥ 992px |
| `col-xl-{1-12}` / `col-xl` | ≥ 1200px |

```html
<div class="row">
  <!-- 100% trên mobile, 50% từ md+, 33% từ lg+ -->
  <div class="col-md-6 col-lg-4">...</div>
</div>
```

### 5.2 CSS Grid container

```html
<div class="grid-container grid-cols-3">
  <div class="col-span-2">Chiếm 2 cột</div>
  <div class="col-span-1">Chiếm 1 cột</div>
  <div class="col-span-full">Full width</div>
</div>
```

| Class                | Mô tả |
|---|---|
| `grid-container`     | `display: grid`, `column-gap: 8px`, `row-gap: 0` |
| `grid-cols-{1-12}`   | Số cột |
| `col-span-{1-12}`    | Item chiếm n cột |
| `col-span-full`      | Item chiếm toàn bộ chiều ngang |
| `row-span-{1-12}`    | Item chiếm n hàng |
| `row-span-full`      | Item chiếm toàn bộ chiều dọc |

> Các class `col-span-*` / `row-span-*` chỉ có hiệu lực **bên trong** `.grid-container` (selector nested).

---

## 6. Flexbox utilities

| Class          | CSS |
|---|---|
| `flex-1`       | `flex: 1` |
| `flex-none`    | `flex: none` |
| `flex-auto`    | `flex: auto` |
| `flex-row`     | `flex-direction: row` |
| `flex-column`  | `flex-direction: column` |
| `flex-row-reverse`    | `flex-direction: row-reverse` |
| `flex-column-reverse` | `flex-direction: column-reverse` |
| `flex-wrap`    | `flex-wrap: wrap` |
| `flex-nowrap`  | `flex-wrap: nowrap` |
| `flex-grow-0` / `flex-grow-1`     | `flex-grow: 0 / 1` |
| `flex-shrink-0` / `flex-shrink-1` | `flex-shrink: 0 / 1` |

**align-items:** `align-items-start`, `align-items-end`, `align-items-center`, `align-items-baseline`, `align-items-stretch`.

**align-self:** `align-self-start`, `align-self-end`, `align-self-center`, `align-self-stretch`, `align-self-auto`.

**align-content:** `align-content-start`, `align-content-end`, `align-content-center`, `align-content-between`, `align-content-around`, `align-content-stretch`.

**justify-content:** `justify-content-start`, `justify-content-end`, `justify-content-center`, `justify-content-between`, `justify-content-around`, `justify-content-evenly`.

---

## 7. Spacing

### 7.1 Margin / Padding (px-based, 0–200)

```
m-{n}   mt-{n}   mr-{n}   mb-{n}   ml-{n}   mx-{n}   my-{n}
p-{n}   pt-{n}   pr-{n}   pb-{n}   pl-{n}   px-{n}   py-{n}
```

Ví dụ: `m-0`, `mt-8`, `px-16`, `py-24`, `mb-4`.

**Spacing scale rule:** với spacing dùng cho layout element, chỉ dùng giá trị là **bội số của 4px**: `m-4`, `m-8`, `m-12`, `m-16`, `p-4`, `p-8`, `px-16`, `py-24`, `gap-8`, `gap-16`... Tránh sinh các class lẻ như `m-3`, `p-5`, `gap-7` trừ khi đang xử lý pixel-perfect exception đã được review rõ ràng.

**Auto margin:** `m-auto`, `mt-auto`, `mr-auto`, `mb-auto`, `ml-auto`, `mx-auto`, `my-auto`.

### 7.2 Gap (px-based, 0–200)

```
gap-{n}   gap-x-{n}   gap-y-{n}
```

Ví dụ: `gap-8`, `gap-x-16`, `gap-y-4`.

---

## 8. Sizing

### 8.1 Width / Height theo px (0–200)

```
w-{n}   h-{n}
```

### 8.2 Width / Height theo %/keyword

| Class           | CSS |
|---|---|
| `w-full` / `w-100` | `width: 100%` (`w-100` là alias của `w-full`) |
| `w-auto`        | `width: auto` |
| `w-screen`      | `width: 100vw` |
| `w-fit`         | `width: fit-content` |
| `h-full` / `h-100` | `height: 100%` |
| `h-auto`        | `height: auto` |
| `h-screen`      | `height: 100vh` |
| `h-fit`         | `height: fit-content` |
| `min-h-full`    | `min-height: 100%` |
| `min-h-screen`  | `min-height: 100vh` |
| `min-w-full`    | `min-width: 100%` |
| `max-h-full`    | `max-height: 100%` |
| `max-w-full`    | `max-width: 100%` |

---

## 9. Border & radius

### 9.1 Border-radius (px-based, 0–200)

```
rounded-{n}        // border-radius: {n}px
rounded-full       // border-radius: 9999px (pill / circle)
```

### 9.2 Border utilities

Border color default = `var(--sd-border)`.

| Class            | CSS |
|---|---|
| `border`         | `border: 1px solid var(--sd-border)` |
| `border-0`       | `border: 0` |
| `border-top`     | `border-top: 1px solid var(--sd-border)` |
| `border-bottom`  | `border-bottom: 1px solid var(--sd-border)` |
| `border-left`    | `border-left: 1px solid var(--sd-border)` |
| `border-right`   | `border-right: 1px solid var(--sd-border)` |

Đổi màu border: kết hợp `.border` với `.border-{token}` (xem §3.2).

---

## 10. Display, position, overflow, visibility

### 10.1 Display

| Class            | CSS |
|---|---|
| `d-none`         | `display: none` |
| `d-block`        | `display: block` |
| `d-inline`       | `display: inline` |
| `d-inline-block` | `display: inline-block` |
| `d-flex`         | `display: flex` |
| `d-inline-flex`  | `display: inline-flex` |
| `d-grid`         | `display: grid` |

### 10.2 Position

```
position-relative   position-absolute   position-fixed
position-sticky     position-static
```

### 10.3 Overflow

| Class               | CSS |
|---|---|
| `overflow-auto`     | `overflow: auto` |
| `overflow-hidden`   | `overflow: hidden` |
| `overflow-visible`  | `overflow: visible` |
| `overflow-scroll`   | `overflow: scroll` |
| `overflow-x-auto`   | `overflow-x: auto` |
| `overflow-y-auto`   | `overflow-y: auto` |

### 10.4 Visibility

| Class       | CSS |
|---|---|
| `visible`   | `visibility: visible` |
| `invisible` | `visibility: hidden` |

---

## 11. Cursor, vertical-align, misc

**Vertical-align:**

```
align-middle   align-top   align-bottom   align-baseline
```

**Cursor:**

```
cursor-pointer   cursor-default   cursor-not-allowed
```

---

## 12. Elevation (`mat-elevation-z0`–`z8`)

CSS shadow tĩnh, tương đương Angular Material `mat.elevation()` mixin nhưng **không cần** import Material SCSS.

| Class                | Dùng cho |
|---|---|
| `mat-elevation-z0`   | Reset shadow |
| `mat-elevation-z1`   | Card, chip |
| `mat-elevation-z2`   | Button raised |
| `mat-elevation-z3`   | Card hover |
| `mat-elevation-z4`   | App bar |
| `mat-elevation-z5`   | — |
| `mat-elevation-z6`   | Floating action button |
| `mat-elevation-z7`   | — |
| `mat-elevation-z8`   | Dialog, drawer |

---

## 13. Reset / Reboot baseline

`_base.scss` chạy trước mọi utility, thiết lập rendering chuẩn:

| Rule | Mục đích |
|---|---|
| `*, *::before, *::after { box-sizing: border-box }` | Bắt buộc — thiếu là layout lệch |
| `html { -webkit-text-size-adjust: 100%; -webkit-tap-highlight-color: transparent; line-height: 1.15 }` | iOS rotation + ẩn tap highlight |
| `body { font-family: Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #212529 }` | Baseline typography |
| `h1…h6` | `margin-top: 0; margin-bottom: 0.5rem` |
| `p, ol, ul, dl` | `margin-top: 0; margin-bottom: 1rem` |
| `a { color: #007bff; text-decoration: none }`, `a:hover { text-decoration: underline }` | Link mặc định |
| `label { display: inline-block; margin-bottom: 0.5rem }` | Form layout (mat-checkbox override ở `core/form.scss`) |
| `button { border-radius: 0 }`, `button:focus:not(:focus-visible) { outline: 0 }` | Reset native button |
| `table { border-collapse: collapse }` | Tránh double border |
| `th { font-weight: 600; text-align: inherit }` | Bỏ bold native browser |
| `textarea { overflow: auto; resize: vertical }` | Bỏ scrollbar dọc mặc định IE, chỉ resize chiều dọc |
| `[role="button"] { cursor: pointer }` | A11y |
| `[hidden] { display: none !important }` | IE10 fallback |

---

## 14. Custom theme

Host apps own Core colors through `sd.theme()`. The default source is `core`: literal base colors and derived `--sd-*` colors. Material-only controls, typography and density remain configured through `mat.theme()`; Core does not globally overwrite Material system colors.

```scss
@use '@sdcorejs/angular/assets/scss/themes/default' as sd;
@use '@angular/material' as mat;

html {
  color-scheme: light;

  @include sd.theme(
    (
      primary: #AE7129,
      primary-light: #F4F2F1,
      primary-dark: #6B4414,
    )
  );

  @include mat.theme(
    (
      color: (
        theme-type: light,
        primary: mat.$azure-palette,
        tertiary: mat.$green-palette,
      ),
      typography: Roboto,
      density: 0,
    )
  );
}
```

Prefer Material M3 system variables for Material-facing styles:
`--mat-sys-primary`, `--mat-sys-on-primary`, `--mat-sys-surface`,
`--mat-sys-on-surface`, `--mat-sys-error`, `--mat-sys-outline`, and
`--mat-sys-outline-variant`.

### Material-owned colors (compatibility)

Apps previously relying on Material to recolor Core must opt in explicitly, after loading `sd-core.scss`:

```scss
html {
  @include sd.theme($source: 'material');
  // Consumer overrides take precedence over the selected source:
  // @include sd.theme((primary: #AE7129), $source: 'material');
}
```

Omit `$source` (or use `'core'`) for independent Core colors. Scoped calls emit the full palette within that selector; runtime overrides can use `--sd-primary`, `--sd-surface`, etc. Unknown source names fail Sass compilation. Overlay content must also be inside the themed scope.

> `sd.theme()` only needs the tokens you want to override; omitted tokens keep their defaults.
> Keep Material theme configuration in a global stylesheet, not component SCSS.

### 14.1 Choose a preset

Core ships eight **light** presets in addition to the unchanged `default` palette. They change colors only; typography, spacing, density and corner radius remain unchanged. No dark palette is included.

In the consumer's global `styles.scss`, load Core first, then emit the selected palette:

```scss
@use '@sdcorejs/angular/assets/scss/sd-core';
@use '@sdcorejs/angular/assets/scss/themes/default' as sd;

html {
  color-scheme: light;
  @include sd.theme($preset: 'ocean');
}
```

If `sd-core.scss` is already configured in `angular.json`, do not import it a second time. Keep your override stylesheet after the Core stylesheet in the styles list so that Core defaults do not overwrite it. Importing `themes/default` alone does not install the complete Core component stylesheet.

| Preset | Direction | Primary | Primary light | Primary dark | Surface muted |
|---|---|---|---|---|---|
| `ocean` | Clear, familiar blue | `#005CBB` | `#E6F0FA` | `#004A96` | `#F1F5F9` |
| `indigo` | Distinctive blue-violet | `#4F46E5` | `#EEECFD` | `#3730A3` | `#F4F4FA` |
| `teal` | Calm blue-green | `#0F766E` | `#E5F3F1` | `#115E59` | `#F0F7F6` |
| `copper` | Warm brown | `#9A6324` | `#F8EFE4` | `#6B4414` | `#F4F2F1` |
| `slate` | Minimal neutral | `#475569` | `#E9EDF2` | `#334155` | `#F5F6F8` |
| `forest` | Muted natural green | `#356447` | `#E8F0E9` | `#244831` | `#F3F6F0` |
| `plum` | Restrained purple | `#7B3F80` | `#F2EAF4` | `#592B60` | `#F7F3F8` |
| `rose` | Warm muted pink | `#A33D62` | `#FAEAF0` | `#7D2849` | `#FAF4F5` |

All eight presets use `surface: #FFFFFF` and `primary-contrast: #FFFFFF`.

| Preset | Text | Text secondary | Border | Border strong |
|---|---|---|---|---|
| `ocean` | `#182230` | `#475569` | `#CBD5E1` | `#64748B` |
| `indigo` | `#232238` | `#56546C` | `#D5D3E3` | `#76738D` |
| `teal` | `#18302D` | `#47635F` | `#C9DCD8` | `#637F79` |
| `copper` | `#302820` | `#665A4D` | `#DCD3C9` | `#8C7A67` |
| `slate` | `#1E293B` | `#526174` | `#CDD4DD` | `#6B7A8E` |
| `forest` | `#253128` | `#53634F` | `#CFD9C9` | `#72826C` |
| `plum` | `#302334` | `#68576D` | `#DCCFDF` | `#8C7492` |
| `rose` | `#35262C` | `#70565F` | `#E1CFD6` | `#997480` |

Unlisted tokens inherit the default map in section 3: secondary, info, success, warning, error and their variants keep the same meaning across presets. `text-muted`, `disabled-bg` and `disabled-text` remain derived from `--sd-text`. A preset emits the entire public color token set, not just its differences.

### 14.2 Mixin contract and overrides

```scss
@mixin theme($theme: (), $source: 'core', $preset: 'default');
```

| Parameter | Accepted values | Default |
|---|---|---|
| `$theme` | Map of public color tokens from section 3 | `()` |
| `$source` | `'core'`, `'material'` | `'core'` |
| `$preset` | `'default'` and the eight lowercase names above | `'default'` |

For the Core source, precedence is **default → preset → consumer overrides**. Existing `sd.theme()`, `sd.theme((...))`, and positional `sd.theme((), 'material')` calls remain valid. Unknown preset/source names fail Sass compilation. Combining `$source: 'material'` with any non-default preset also fails: choose one palette owner.

```scss
html {
  @include sd.theme((
    primary: #6B4414,
    primary-light: #F4F2F1,
    primary-dark: #4A2F0E,
    surface-muted: #F7F5F2,
  ), $preset: 'copper');
}
```

Preset `primary-light` and `primary-dark` are explicit designed values. Overriding only `primary` does **not** recalculate those two colors; override all three when changing the brand family. The `default` palette retains its existing `color-mix()` variants. Runtime `--sd-primary` overrides have the same rule. Do not pass `sd.$default-theme` as your override map when selecting a preset: that full map intentionally overrides the preset values.

### 14.3 Per-screen and runtime switching

Emit one palette per selector in a global stylesheet, then toggle that selector. Sass itself does not run in the browser.

```scss
html { @include sd.theme($preset: 'ocean'); }
html[data-core-theme='forest'] { @include sd.theme($preset: 'forest'); }
html[data-core-theme='plum'] { @include sd.theme($preset: 'plum'); }

// Optional per-screen override; sibling screens keep the root palette.
.customer-screen { @include sd.theme($preset: 'copper'); }
```

```ts
// Browser event handler; guard DOM access when using SSR.
document.documentElement.dataset['coreTheme'] = 'forest';
// Restore the root Ocean palette:
delete document.documentElement.dataset['coreTheme'];
```

Root switching also reaches overlays attached under `body`. A local screen class does not reach dialogs/select panels rendered outside that screen; apply the theme at the root or arrange the same theme scope on the overlay container. A nested full palette overrides inherited parent tokens.

### 14.4 Material integration and accessibility

These presets own **Core color tokens**, not the full Material palette. They do not rewrite global `--mat-sys-*`. Core styling that consumes `--sd-*` changes immediately; Material-only styles still follow the consumer's `mat.theme()` configuration. Keep that distinction when testing focus, ripples, calendars, dialogs and third-party controls. Font/density configuration remains separate.

Table quick-search/footer backgrounds intentionally remain fixed white; a global `surface` override does not change those regions. Tab header/body classes and inline styles also take precedence where supplied.

The preset tests verify white text against primary and primary-dark at **at least 4.5:1**, primary/secondary body text against surface and surface-muted at **at least 4.5:1**, and strong control borders against those surfaces at **at least 3:1**. Subtle `border` is for dividers, not the sole boundary of an interactive control. These checks are palette checks, not a claim that every component/state is accessibility-certified. Recheck actual rendered states after consumer overrides; retain labels/icons for status information.

### 14.5 Troubleshooting and verification

- **Unknown preset:** names are lowercase and case-sensitive; use `'ocean'`, not `'Ocean'`.
- **No color change:** verify stylesheet order and inspect `--sd-primary` on the affected element; check local classes, inline styles and nested theme scopes.
- **Material control differs:** its remaining Material styles need separate Material configuration; presets do not implicitly synchronize the two systems.
- **Unexpected hover tint after override:** set `primary-light` and `primary-dark` as well as `primary`.
- **Overlay differs from screen:** use a root theme or theme the overlay container in the global stylesheet.

Library maintainers can run `npm run test:theme` from the repository root after installing canonical `versions/v19` dependencies. It compiles consumer Sass and covers all eight presets, token completeness, contrast pairs, override precedence, isolated selectors, legacy Material mode and invalid arguments. Edit only v19 and run `npm run sync` for derived versions.

---

## 15. Fonts & images shipped

### 15.1 Fonts

`fonts.scss` declare `@font-face` cho 3 family — host app **không cần** thêm Google Fonts link.

| Family | Variants | File path |
|---|---|---|
| Roboto | regular (400), 500, 600, italic | `assets/fonts/roboto/roboto-v50-latin_vietnamese-*.woff2` (4 file, latin + vietnamese subset) |
| Material Icons | regular + outlined | `assets/fonts/material-icons/{material-icons-v145,material-icons-outlined-v110}-latin-regular.woff2` |
| Material Symbols | regular | `assets/fonts/material-symbols/material-symbols-v29-latin-regular.woff2` |

### 15.2 Image assets (18 SVG illustrations)

Tham chiếu qua `core/image.scss` utility hoặc trực tiếp `assets/images/<name>.svg`:

| File                       | Dùng cho |
|---|---|
| `coming-soon.svg`          | Trang chưa sẵn sàng |
| `data-empty.svg`           | Empty state cho table / list |
| `expired.svg`              | Session expired |
| `file-error.svg`           | Upload file lỗi |
| `filter-empty.svg`         | Không kết quả khớp filter |
| `filter-required.svg`      | Yêu cầu chọn filter trước khi load data |
| `forbidden.svg`            | 403 Forbidden |
| `image-error.svg`          | Image load fail |
| `maintenance.svg`          | Đang bảo trì |
| `not-found.svg`            | 404 Not Found |
| `offline.svg`              | Mất mạng |
| `submitted.svg`            | Form gửi thành công |
| `success.svg`              | Generic success |
| `unauthorized.svg`         | 401 Unauthorized |
| `unknown-error.svg`        | 500 / fallback |

---

## 16. What is NOT shipped

Để AI agent không sinh class lạ:

- ❌ **Không có Bootstrap, Tailwind, Bulma, Foundation.** Tất cả utility ở §3–§13 là code thuần SCSS của `@sdcorejs/angular`. Class như `.btn`, `.btn-primary`, `.card`, `.alert`, `.navbar`, `.form-control`, `.input-group`, `.modal`, `.dropdown`, `.list-group`, `.breadcrumb`, `.carousel`, `.popover`, `.tooltip`, `.progress`, `.spinner-border`, `.badge` (Bootstrap) **KHÔNG tồn tại**.
- ❌ **Không có Tailwind escape syntax** (`md:flex`, `hover:bg-red-500`, `text-[14px]`…). Responsive class duy nhất là `col-sm-*` / `col-md-*` / `col-lg-*` / `col-xl-*` ở §5.1.
- ❌ **Không có dark mode token** sẵn — phải tự khai báo nếu cần.
- ❌ **Không có animation utility class** (kiểu `.fade`, `.slide-in`). Animation handle qua Angular `[@trigger]` hoặc CSS riêng của component.
- ❌ **Không sinh class theo px arbitrary** — `m-{n}`, `p-{n}`, `w-{n}`, `h-{n}`, `fs-{n}`, `gap-{n}`, `rounded-{n}` chỉ chạy từ **0 → 200** integer. Cần `w-250` thì phải tự viết SCSS hoặc dùng inline style.
- ❌ **Không có shorthand position** (kiểu `top-0`, `left-50`). Set `position-absolute` rồi viết CSS riêng cho offset.
- ❌ **Component selector không phải utility class.** `sd-button`, `sd-input`, `sd-anchor`… là Angular component (xem `components/*/sd-*.md`), không phải CSS class.

### Migration check khi đọc code cũ

| Class cũ (Bootstrap) | Thay thế bằng |
|---|---|
| `d-flex`             | `d-flex` (giữ nguyên — đã port) |
| `text-center`        | `text-center` (giữ nguyên) |
| `text-truncate`      | `text-ellipsis` |
| `font-weight-normal` | `font-weight-normal` (giữ nguyên) |
| `mt-2` / `mt-3` …    | `mt-8` / `mt-16` … (px-based 0–200, không phải multiplier 4) |
| `pl-2`               | `pl-8` (đổi đơn vị) |
| `w-100`              | `w-100` hoặc `w-full` |
| `border-secondary`   | `border-secondary` (vẫn có — secondary là token màu, không phải utility riêng) |
| `btn`, `btn-primary` | dùng `<sd-button [color]="primary">` |
| `form-control`       | dùng `<sd-input>` / `<sd-select>` … |
| `alert`              | dùng `<sd-notify>` service |
| `modal`              | dùng `<sd-modal>` |

> Lưu ý lớn nhất: **spacing scale đã đổi từ Bootstrap multiplier (1=4px, 2=8px…) sang px tuyệt đối**. `mb-3` trong Bootstrap = 16px; trong `@sdcorejs/angular` `mb-3` = **3px**. Reading code cũ cần convert (× 4) cẩn thận hoặc thay bằng `mb-16`.

---

## 17. AI rendering guardrails

Khi sinh UI mới, agent phải rà docs Core UI trước và ưu tiên component/utility đã có thay vì tự tạo class SCSS trong component.

- **Spacing layout dùng bội số 4px**: ưu tiên `4`, `8`, `12`, `16`, `24`, `32`... cho margin, padding, gap, gutter. Không sinh spacing lẻ như `3px`, `5px`, `7px` trừ khi có yêu cầu pixel-perfect rõ ràng.
- **Hạn chế class CSS cục bộ**: trước khi viết `.field-label`, `.status-pill`, `.detail-row`, `.cell-input`..., kiểm tra có utility class hoặc component `sd-*` phù hợp không. Chỉ thêm SCSS mới khi Core UI không có pattern tương đương.
- **View/read-only label + value**: dùng `<sd-view>` hoặc `[viewed]="true"` trên form component. Không tự dựng cặp label/value bằng class riêng cho các màn hình DETAIL.
- **Trạng thái, nhãn, counter**: dùng `<sd-badge>` hoặc `useBadge` của `<sd-table>`. Không tự viết badge/pill/status class trong component nếu chỉ để thể hiện trạng thái.
- **Input trong table hoặc vùng dense**: trong `<sd-table>`, inline filter, editable cell, toolbar/cell dày đặc, truyền `size="sm"` cho các form component hỗ trợ size như `<sd-input>`, `<sd-select>`, `<sd-autocomplete>`, `<sd-date>`, `<sd-date-range>`, `<sd-datetime>`, `<sd-input-number>`, `<sd-textarea>`, `<sd-chip>`, `<sd-chip-calendar>`, `<sd-input-color>`.
- **Label/required/help trong cell của `sd-table`**: control `sm` không lặp label đã có ở title cột. Cột bắt buộc thêm `*` với `text-error` ngay sau title; guide/help đặt ở icon `info` kèm tooltip trong header, không viết dài hoặc lặp từng hàng. Giữ validator trên control và tên truy cập cho screen reader. Filter/toolbar độc lập và mobile card không có header vẫn cần nhãn nhận diện. Xem quy tắc và mẫu `sdTableTitleDef` trong [sd-table](../components/table/sd-table.md#dense-editable-controls-inside-table-cells).
