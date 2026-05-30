�# `@sdcorejs/angular` � Assets & SCSS Reference

> **Mục �ích tài li�!u này (cho người + AI agent):** li�!t kê chính xác mọi utility class, design token, font, image, theme mixin mà `@sdcorejs/angular` ship trong `assets/`. AI agent ch�0 �ược sinh template dùng class **nằm trong danh sách dư�:i �ây** � nếu cần class m�:i, phải tạo trong `core/utilities/*.scss` trư�:c.

---

## Mục lục

1. [Cài �ặt vào Angular](#1-cài-�ặt-vào-angular)
2. [Cấu trúc thư mục `assets/`](#2-cấu-trúc-thư-mục-assets)
3. [H�! th�ng màu sắc](#3-h�!-th�ng-màu-sắc) � `--sd-*` tokens + `.text-*` / `.bg-*` / `.border-*`
4. [Typography tokens](#4-typography-tokens) � `T{size}{weight}` + `fs-*` + `font-weight-*`
5. [Layout & Grid](#5-layout--grid) � `row` / `col-*` / `grid-container` / `grid-cols-*`
6. [Flexbox utilities](#6-flexbox-utilities) � `d-flex` + `flex-*` + `align-*` + `justify-*`
7. [Spacing](#7-spacing) � `m-*` / `p-*` / `gap-*`
8. [Sizing](#8-sizing) � `w-*` / `h-*` / `min-*` / `max-*`
9. [Border & radius](#9-border--radius) � `border` / `border-{side}` / `rounded-*`
10. [Display, position, overflow, visibility](#10-display-position-overflow-visibility)
11. [Cursor, vertical-align, misc](#11-cursor-vertical-align-misc)
12. [Elevation (mat-elevation-z0�z8)](#12-elevation-mat-elevation-z0z8)
13. [Reset / Reboot baseline](#13-reset--reboot-baseline)
14. [Custom theme](#14-custom-theme)
15. [Fonts & Images shipped](#15-fonts--images-shipped)
16. [What is NOT shipped](#16-what-is-not-shipped) � anti-confusion cho AI

---

## 1. Cài �ặt vào Angular

`angular.json`:

```json
"styles": [
  "./node_modules/@sdcorejs/angular/assets/scss/sd-core.scss",
  "src/styles.scss"
]
```

`sd-core.scss` là entry point duy nhất � auto-load reset, utilities, color theme, form overrides, scrollbar, Angular Material theme. Không cần import partial nào riêng lẻ.

> Convention chung: **mọi utility class �ều có `!important`** �Ồ �ảm bảo override �ược Angular Material (thường có specificity cao).

---

## 2. Cấu trúc thư mục `assets/`

```
projects/sdcorejs-angular/assets/
�S���� fonts/
�   �S���� fonts.scss                     # @font-face khai báo cho Roboto + Material Icons + Material Symbols
�   �S���� material-icons/                # 2 file .woff2 (icons-v145 + outlined-v110)
�   �S���� material-symbols/              # 1 file .woff2 (symbols-v29)
�   ����� roboto/                        # 4 file .woff2 (regular, italic, 500, 600 � latin + vietnamese)
�S���� images/                            # SVG illustrations (18 file � empty-state, error, success...)
�   �S���� coming-soon.svg                # Trang chưa sẵn sàng
�   �S���� data-empty.svg                 # Empty state cho table/list
�   �S���� expired.svg                    # Session expired
�   �S���� file-error.svg                 # Upload file l�i
�   �S���� filter-empty.svg               # Không match filter
�   �S���� filter-required.svg            # Yêu cầu b�" lọc trư�:c khi load
�   �S���� forbidden.svg                  # 403
�   �S���� image-error.svg                # Image load fail
�   �S���� maintenance.svg                # Trang �ang bảo trì
�   �S���� not-found.svg                  # 404
�   �S���� offline.svg                    # Mất mạng
�   �S���� submitted.svg                  # Gửi form thành công
�   �S���� success.svg                    # Generic success
�   �S���� unauthorized.svg               # 401
�   ����� unknown-error.svg              # 500 / fallback
����� scss/
    �S���� sd-core.scss                   # ENTRY (ch�0 file này �ược import từ host app)
    �S���� ckeditor5.scss                 # Override style cho CKEditor 5 (opt-in)
    �S���� core/
    �   �S���� color.scss                 # Color map + CSS var declarations
    �   �S���� form.scss                  # Override Angular Material form (input/select/checkbox/radio)
    �   �S���� image.scss                 # Ti�!n ích background-image cho 18 illustration SVG �x trên
    �   �S���� scrollbar.scss             # Custom scrollbar (webkit + firefox)
    �   ����� utilities/
    �       �S���� _index.scss            # Forward toàn b�" partial bên dư�:i
    �       �S���� _base.scss             # Reset/reboot baseline (box-sizing, body, headings, forms⬦)
    �       �S���� _border.scss           # rounded-* + border + border-{side}
    �       �S���� _display.scss          # d-none/block/inline/inline-block/flex/inline-flex/grid
    �       �S���� _elevation.scss        # mat-elevation-z0�z8
    �       �S���� _flexbox.scss          # flex-1/none/auto, direction, wrap, grow/shrink, align/justify
    �       �S���� _gap.scss              # gap-* / gap-x-* / gap-y-*
    �       �S���� _grid.scss             # row/col 12-column + .grid-container + col-span-*
    �       �S���� _misc.scss             # align-{middle⬦}, cursor-*, visible/invisible
    �       �S���� _overflow.scss         # overflow-*
    �       �S���� _position.scss         # position-relative/absolute/fixed/sticky/static
    �       �S���� _sizing.scss           # w-* / h-* + min/max + w-full/screen/auto/fit
    �       �S���� _spacing.scss          # m-*, p-* (mt/mr/mb/ml/mx/my, pt/pr/pb/pl/px/py) + m-auto
    �       ����� _typography.scss       # T{n}{M|R} tokens + fs-* + font-weight-* + text-*
    ����� themes/
        �S���� default.scss               # sd.theme() mixin � override `--sd-*` color tokens
        ����� material-theme.scss        # Angular Material M2 theme baseline
```

---

## 3. H�! th�ng màu sắc

Màu �ược ��9nh nghĩa dư�:i dạng **CSS custom properties** v�:i prefix `--sd-*`, cho phép override runtime (không cần recompile SCSS).

### 3.1 Color tokens

| Token              | CSS variable           | Default     | Dùng cho |
|---|---|---|---|
| `primary`          | `--sd-primary`         | `#2A66F4`   | Màu chủ �ạo � button, checkbox, accent |
| `primary-light`    | `--sd-primary-light`   | `#EAF1FF`   | Background nhẹ của primary |
| `primary-dark`     | `--sd-primary-dark`    | `#1C4AD9`   | Hover/active state của primary |
| `info`             | `--sd-info`            | `#2962FF`   | Link, thông tin, badge info |
| `info-light`       | `--sd-info-light`      | `#E7E9FF`   | Background nhẹ của info |
| `info-dark`        | `--sd-info-dark`       | `#2240CC`   | Hover state của info |
| `success`          | `--sd-success`         | `#4CAF50`   | Trạng thái thành công, validation OK |
| `success-light`    | `--sd-success-light`   | `#DBEFDC`   | Background nhẹ của success |
| `success-dark`     | `--sd-success-dark`    | `#39833C`   | Hover state của success |
| `warning`          | `--sd-warning`         | `#FF9600`   | Cảnh báo, trạng thái cần chú ý |
| `warning-light`    | `--sd-warning-light`   | `#FFEACC`   | Background nhẹ của warning |
| `warning-dark`     | `--sd-warning-dark`    | `#BF7000`   | Hover state của warning |
| `error`            | `--sd-error`           | `#F82C13`   | L�i, validation fail, trạng thái nguy hiỒm |
| `error-light`      | `--sd-error-light`     | `#FED5D0`   | Background nhẹ của error |
| `error-dark`       | `--sd-error-dark`      | `#BA200E`   | Hover state của error |
| `secondary`        | `--sd-secondary`       | `#212121`   | Text phụ, icon secondary |
| `secondary-light`  | `--sd-secondary-light` | `#E9E9E9`   | Background nhẹ |
| `secondary-dark`   | `--sd-secondary-dark`  | `#000000`   | � |
| `light`            | `--sd-light`           | `#F8F9FA`   | Background trang, surface nhẹ |
| `dark`             | `--sd-dark`            | `#343A40`   | Text �ậm, dark surface |
| `black500`         | `--sd-black500`        | `#212121`   | Text chính |
| `black400`         | `--sd-black400`        | `#757575`   | Text phụ, placeholder |
| `black300`         | `--sd-black300`        | `#BFBFBF`   | Divider, border nhẹ |
| `black200`         | `--sd-black200`        | `#E6E6E6`   | Border mặc ��9nh, separator |
| `black100`         | `--sd-black100`        | `#F2F2F2`   | Background disabled, row hover |

### 3.2 Color utility classes

Mọi token �x §3.1 �ều sinh 3 class:

| Pattern         | Ví dụ                     |
|---|---|
| `.text-{token}` | `text-primary`, `text-error`, `text-black400` |
| `.bg-{token}`   | `bg-primary-light`, `bg-error-light`, `bg-white` |
| `.border-{token}` | `border-primary`, `border-black200` |

`white` / `black` luôn có sẵn ngoài bảng trên: `.text-white` / `.text-black` / `.bg-white` / `.bg-black`.

### 3.3 Dùng màu trong component SCSS

```scss
@use '@sdcorejs/angular/assets/scss/core/color.scss' as color;
@use 'sass:map';

.my-element {
  color: map.get(color.$color_map, 'primary');
  background: map.get(color.$color_map, 'primary-light');
  border-color: map.get(color.$color_map, 'black200');
}
```

Hoặc �ọc trực tiếp CSS var (recommended cho runtime override):

```scss
.my-element {
  color: var(--sd-primary);
  background: var(--sd-primary-light);
}
```

---

## 4. Typography tokens

### 4.1 Design token classes � `T{size}{weight}`

Quy ư�:c: `M` = Medium (500), `R` = Regular (400). M�i class g�m `font-size` + `font-weight` + `line-height` chuẩn hóa.

| Class           | Font size     | Weight    | Line height |
|---|---|---|---|
| `T48M` / `T48R` | 48px          | 500 / 400 | 56px |
| `T32M` / `T32R` | 32px          | 500 / 400 | 48px |
| `T24M` / `T24R` | 24px / 20px*  | 500 / 400 | 28px |
| `T20M` / `T20R` | 20px          | 500 / 400 | 28px |
| `T18M` / `T18R` | 18px          | 500 / 400 | 28px |
| `T16M` / `T16R` | 16px          | 500 / 400 | 24px |
| `T14M` / `T14R` | 14px          | 500 / 400 | 20px |
| `T12M` / `T12R`⬠ | 12px          | 500 / 400 | 16px |
| `T10M` / `T10R` | 10px          | 500 / 400 | 12px |

\* `T24R` font-size 20px (quirk l�9ch sử � `T24M` là 24px). Khi cần 24px/400, dùng `T20R` 20px hoặc cặp `fs-24 + font-weight-normal`.
⬠ `T12R` dùng `!important` vì hay b�9 Angular Material override.

### 4.2 Font-size utilities (px-based)

```
fs-0   fs-1 ⬦ fs-200
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
| `text-ellipsis`  | `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` (yêu cầu container có width c� ��9nh) |
| `text-break`     | `overflow-wrap: break-word; word-break: break-word` (xu�ng dòng giữa ký tự � URL, hash, mã dài) |

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
| `row`    | 16px (mặc ��9nh) |
| `row-md` | 8px |
| `row-sm` | 4px |
| `row-xs` | 2px |

**Auto-width column:** `.col` (chiếm phần còn lại, `flex: 1 1 0%`).

**Responsive columns** (mobile-first � class ch�0 kích hoạt khi viewport �0� breakpoint):

| Pattern         | Min-width |
|---|---|
| `col-sm-{1-12}` / `col-sm` | �0� 576px |
| `col-md-{1-12}` / `col-md` | �0� 768px |
| `col-lg-{1-12}` / `col-lg` | �0� 992px |
| `col-xl-{1-12}` / `col-xl` | �0� 1200px |

```html
<div class="row">
  <!-- 100% trên mobile, 50% từ md+, 33% từ lg+ -->
  <div class="col-md-6 col-lg-4">...</div>
</div>
```

### 5.2 CSS Grid container

```html
<div class="grid-container grid-cols-3">
  <div class="col-span-2">Chiếm 2 c�"t</div>
  <div class="col-span-1">Chiếm 1 c�"t</div>
  <div class="col-span-full">Full width</div>
</div>
```

| Class                | Mô tả |
|---|---|
| `grid-container`     | `display: grid`, `column-gap: 8px`, `row-gap: 0` |
| `grid-cols-{1-12}`   | S� c�"t |
| `col-span-{1-12}`    | Item chiếm n c�"t |
| `col-span-full`      | Item chiếm toàn b�" chiều ngang |
| `row-span-{1-12}`    | Item chiếm n hàng |
| `row-span-full`      | Item chiếm toàn b�" chiều dọc |

> Các class `col-span-*` / `row-span-*` ch�0 có hi�!u lực **bên trong** `.grid-container` (selector nested).

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

### 7.1 Margin / Padding (px-based, 0�200)

```
m-{n}   mt-{n}   mr-{n}   mb-{n}   ml-{n}   mx-{n}   my-{n}
p-{n}   pt-{n}   pr-{n}   pb-{n}   pl-{n}   px-{n}   py-{n}
```

Ví dụ: `m-0`, `mt-8`, `px-16`, `py-24`, `mb-4`.

**Auto margin:** `m-auto`, `mt-auto`, `mr-auto`, `mb-auto`, `ml-auto`, `mx-auto`, `my-auto`.

### 7.2 Gap (px-based, 0�200)

```
gap-{n}   gap-x-{n}   gap-y-{n}
```

Ví dụ: `gap-8`, `gap-x-16`, `gap-y-4`.

---

## 8. Sizing

### 8.1 Width / Height theo px (0�200)

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

### 9.1 Border-radius (px-based, 0�200)

```
rounded-{n}        // border-radius: {n}px
rounded-full       // border-radius: 9999px (pill / circle)
```

### 9.2 Border utilities

Border color default = `var(--sd-black200)`.

| Class            | CSS |
|---|---|
| `border`         | `border: 1px solid var(--sd-black200)` |
| `border-0`       | `border: 0` |
| `border-top`     | `border-top: 1px solid var(--sd-black200)` |
| `border-bottom`  | `border-bottom: 1px solid var(--sd-black200)` |
| `border-left`    | `border-left: 1px solid var(--sd-black200)` |
| `border-right`   | `border-right: 1px solid var(--sd-black200)` |

Đ�"i màu border: kết hợp `.border` v�:i `.border-{token}` (xem §3.2).

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

## 12. Elevation (`mat-elevation-z0`�`z8`)

CSS shadow tĩnh, tương �ương Angular Material `mat.elevation()` mixin nhưng **không cần** import Material SCSS.

| Class                | Dùng cho |
|---|---|
| `mat-elevation-z0`   | Reset shadow |
| `mat-elevation-z1`   | Card, chip |
| `mat-elevation-z2`   | Button raised |
| `mat-elevation-z3`   | Card hover |
| `mat-elevation-z4`   | App bar |
| `mat-elevation-z5`   | � |
| `mat-elevation-z6`   | Floating action button |
| `mat-elevation-z7`   | � |
| `mat-elevation-z8`   | Dialog, drawer |

---

## 13. Reset / Reboot baseline

`_base.scss` chạy trư�:c mọi utility, thiết lập rendering chuẩn:

| Rule | Mục �ích |
|---|---|
| `*, *::before, *::after { box-sizing: border-box }` | Bắt bu�"c � thiếu là layout l�!ch |
| `html { -webkit-text-size-adjust: 100%; -webkit-tap-highlight-color: transparent; line-height: 1.15 }` | iOS rotation + ẩn tap highlight |
| `body { font-family: Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #212529 }` | Baseline typography |
| `h1⬦h6` | `margin-top: 0; margin-bottom: 0.5rem` |
| `p, ol, ul, dl` | `margin-top: 0; margin-bottom: 1rem` |
| `a { color: #007bff; text-decoration: none }`, `a:hover { text-decoration: underline }` | Link mặc ��9nh |
| `label { display: inline-block; margin-bottom: 0.5rem }` | Form layout (mat-checkbox override �x `core/form.scss`) |
| `button { border-radius: 0 }`, `button:focus:not(:focus-visible) { outline: 0 }` | Reset native button |
| `table { border-collapse: collapse }` | Tránh double border |
| `th { font-weight: 600; text-align: inherit }` | Bỏ bold native browser |
| `textarea { overflow: auto; resize: vertical }` | Bỏ scrollbar dọc mặc ��9nh IE, ch�0 resize chiều dọc |
| `[role="button"] { cursor: pointer }` | A11y |
| `[hidden] { display: none !important }` | IE10 fallback |

---

## 14. Custom theme

Trong `styles.scss` của host app, gọi `sd.theme()` �Ồ override màu, sau �ó cấu hình Angular Material M2 palette tương ứng:

```scss
@use '@sdcorejs/angular/assets/scss/themes/default' as sd;
@use '@angular/material' as mat;
@include mat.core();

html {
  @include sd.theme(
    (
      primary:         #AE7129,
      primary-light:   #F4F2F1,
      primary-dark:    #6B4414,
    )
  );
}

// --- Angular Material M2 palette ---

$custom-primary-palette: mat.m2-define-palette((
  50: #F4F2F1, 100: #E7E1DA, 200: #DAC8B4, 300: #D1AC80, 400: #CD9450,
  500: #AE7129, 600: #8D5A1E, 700: #6B4414, 800: #4B2F0E, 900: #34210A,
  contrast: ( 600: white, 700: white, 800: white, 900: white )
));

$custom-accent-palette: mat.m2-define-palette((
  50: #F1F3F1, 100: #DCE5DD, 200: #BBD3BC, 300: #8FC291, 400: #67B76A,
  500: #4CAF50, 600: #3A8C3D, 700: #29692C, 800: #1C471E, 900: #132F14,
  contrast: ( 700: white, 800: white, 900: white )
));

$custom-warn-palette: mat.m2-define-palette((
  50: #F5F0F0, 100: #EAD9D6, 200: #E4B0AA, 300: #E6786B, 400: #EE4430,
  500: #F82C13, 600: #D11801, 700: #9A1100, 800: #680B00, 900: #440700,
  contrast: ( 600: white, 700: white, 800: white, 900: white )
));

$custom-theme: mat.m2-define-light-theme((
  color:   ( primary: $custom-primary-palette, accent: $custom-accent-palette, warn: $custom-warn-palette ),
  density: -3,
));

@include mat.all-component-themes($custom-theme);
```

> `sd.theme()` ch�0 cần khai báo những token mu�n override � token không khai báo giữ default.
> Cả `sd.theme()` và `mat.all-component-themes()` **phải** gọi trong `styles.scss`, không phải component SCSS.

---

## 15. Fonts & images shipped

### 15.1 Fonts

`fonts.scss` declare `@font-face` cho 3 family � host app **không cần** thêm Google Fonts link.

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
| `file-error.svg`           | Upload file l�i |
| `filter-empty.svg`         | Không kết quả kh�:p filter |
| `filter-required.svg`      | Yêu cầu chọn filter trư�:c khi load data |
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

ĐỒ AI agent không sinh class lạ:

- �R **Không có Bootstrap, Tailwind, Bulma, Foundation.** Tất cả utility �x §3�§13 là code thuần SCSS của `@sdcorejs/angular`. Class như `.btn`, `.btn-primary`, `.card`, `.alert`, `.navbar`, `.form-control`, `.input-group`, `.modal`, `.dropdown`, `.list-group`, `.breadcrumb`, `.carousel`, `.popover`, `.tooltip`, `.progress`, `.spinner-border`, `.badge` (Bootstrap) **KH�NG t�n tại**.
- �R **Không có Tailwind escape syntax** (`md:flex`, `hover:bg-red-500`, `text-[14px]`⬦). Responsive class duy nhất là `col-sm-*` / `col-md-*` / `col-lg-*` / `col-xl-*` �x §5.1.
- �R **Không có dark mode token** sẵn � phải tự khai báo nếu cần.
- �R **Không có animation utility class** (kiỒu `.fade`, `.slide-in`). Animation handle qua Angular `[@trigger]` hoặc CSS riêng của component.
- �R **Không sinh class theo px arbitrary** � `m-{n}`, `p-{n}`, `w-{n}`, `h-{n}`, `fs-{n}`, `gap-{n}`, `rounded-{n}` ch�0 chạy từ **0 �  200** integer. Cần `w-250` thì phải tự viết SCSS hoặc dùng inline style.
- �R **Không có shorthand position** (kiỒu `top-0`, `left-50`). Set `position-absolute` r�i viết CSS riêng cho offset.
- �R **Component selector không phải utility class.** `sd-button`, `sd-input`, `sd-anchor`⬦ là Angular component (xem `components/*/sd-*.md`), không phải CSS class.

### Migration check khi �ọc code cũ

| Class cũ (Bootstrap) | Thay thế bằng |
|---|---|
| `d-flex`             | `d-flex` (giữ nguyên � �ã port) |
| `text-center`        | `text-center` (giữ nguyên) |
| `text-truncate`      | `text-ellipsis` |
| `font-weight-normal` | `font-weight-normal` (giữ nguyên) |
| `mt-2` / `mt-3` ⬦    | `mt-8` / `mt-16` ⬦ (px-based 0�200, không phải multiplier 4) |
| `pl-2`               | `pl-8` (��"i �ơn v�9) |
| `w-100`              | `w-100` hoặc `w-full` |
| `border-secondary`   | `border-secondary` (vẫn có � secondary là token màu, không phải utility riêng) |
| `btn`, `btn-primary` | dùng `<sd-button [color]="primary">` |
| `form-control`       | dùng `<sd-input>` / `<sd-select>` ⬦ |
| `alert`              | dùng `<sd-notify>` service |
| `modal`              | dùng `<sd-modal>` |

> Lưu ý l�:n nhất: **spacing scale �ã ��"i từ Bootstrap multiplier (1=4px, 2=8px⬦) sang px tuy�!t ��i**. `mb-3` trong Bootstrap = 16px; trong `@sdcorejs/angular` `mb-3` = **3px**. Reading code cũ cần convert (� 4) cẩn thận hoặc thay bằng `mb-16`.

