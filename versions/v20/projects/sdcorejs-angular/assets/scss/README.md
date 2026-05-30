# `@sdcorejs/angular` â€” Assets & SCSS Reference

> **Má»¥c Ä‘Ã­ch tÃ i liá»‡u nÃ y (cho ngÆ°á»i + AI agent):** liá»‡t kÃª chÃ­nh xÃ¡c má»i utility class, design token, font, image, theme mixin mÃ  `@sdcorejs/angular` ship trong `assets/`. AI agent chá»‰ Ä‘Æ°á»£c sinh template dÃ¹ng class **náº±m trong danh sÃ¡ch dÆ°á»›i Ä‘Ã¢y** â€” náº¿u cáº§n class má»›i, pháº£i táº¡o trong `core/utilities/*.scss` trÆ°á»›c.

---

## Má»¥c lá»¥c

1. [CÃ i Ä‘áº·t vÃ o Angular](#1-cÃ i-Ä‘áº·t-vÃ o-angular)
2. [Cáº¥u trÃºc thÆ° má»¥c `assets/`](#2-cáº¥u-trÃºc-thÆ°-má»¥c-assets)
3. [Há»‡ thá»‘ng mÃ u sáº¯c](#3-há»‡-thá»‘ng-mÃ u-sáº¯c) â€” `--sd-*` tokens + `.text-*` / `.bg-*` / `.border-*`
4. [Typography tokens](#4-typography-tokens) â€” `T{size}{weight}` + `fs-*` + `font-weight-*`
5. [Layout & Grid](#5-layout--grid) â€” `row` / `col-*` / `grid-container` / `grid-cols-*`
6. [Flexbox utilities](#6-flexbox-utilities) â€” `d-flex` + `flex-*` + `align-*` + `justify-*`
7. [Spacing](#7-spacing) â€” `m-*` / `p-*` / `gap-*`
8. [Sizing](#8-sizing) â€” `w-*` / `h-*` / `min-*` / `max-*`
9. [Border & radius](#9-border--radius) â€” `border` / `border-{side}` / `rounded-*`
10. [Display, position, overflow, visibility](#10-display-position-overflow-visibility)
11. [Cursor, vertical-align, misc](#11-cursor-vertical-align-misc)
12. [Elevation (mat-elevation-z0â€“z8)](#12-elevation-mat-elevation-z0z8)
13. [Reset / Reboot baseline](#13-reset--reboot-baseline)
14. [Custom theme](#14-custom-theme)
15. [Fonts & Images shipped](#15-fonts--images-shipped)
16. [What is NOT shipped](#16-what-is-not-shipped) â€” anti-confusion cho AI

---

## 1. CÃ i Ä‘áº·t vÃ o Angular

`angular.json`:

```json
"styles": [
  "./node_modules/@sdcorejs/angular/assets/scss/sd-core.scss",
  "src/styles.scss"
]
```

`sd-core.scss` lÃ  entry point duy nháº¥t â€” auto-load reset, utilities, color theme, form overrides, scrollbar, Angular Material theme. KhÃ´ng cáº§n import partial nÃ o riÃªng láº».

> Convention chung: **má»i utility class Ä‘á»u cÃ³ `!important`** Ä‘á»ƒ Ä‘áº£m báº£o override Ä‘Æ°á»£c Angular Material (thÆ°á»ng cÃ³ specificity cao).

---

## 2. Cáº¥u trÃºc thÆ° má»¥c `assets/`

```
projects/sdcorejs-angular/assets/
â”œâ”€â”€ fonts/
â”‚   â”œâ”€â”€ fonts.scss                     # @font-face khai bÃ¡o cho Roboto + Material Icons + Material Symbols
â”‚   â”œâ”€â”€ material-icons/                # 2 file .woff2 (icons-v145 + outlined-v110)
â”‚   â”œâ”€â”€ material-symbols/              # 1 file .woff2 (symbols-v29)
â”‚   â””â”€â”€ roboto/                        # 4 file .woff2 (regular, italic, 500, 600 â€” latin + vietnamese)
â”œâ”€â”€ images/                            # SVG illustrations (18 file â€” empty-state, error, success...)
â”‚   â”œâ”€â”€ coming-soon.svg                # Trang chÆ°a sáºµn sÃ ng
â”‚   â”œâ”€â”€ data-empty.svg                 # Empty state cho table/list
â”‚   â”œâ”€â”€ expired.svg                    # Session expired
â”‚   â”œâ”€â”€ file-error.svg                 # Upload file lá»—i
â”‚   â”œâ”€â”€ filter-empty.svg               # KhÃ´ng match filter
â”‚   â”œâ”€â”€ filter-required.svg            # YÃªu cáº§u bá»™ lá»c trÆ°á»›c khi load
â”‚   â”œâ”€â”€ forbidden.svg                  # 403
â”‚   â”œâ”€â”€ image-error.svg                # Image load fail
â”‚   â”œâ”€â”€ maintenance.svg                # Trang Ä‘ang báº£o trÃ¬
â”‚   â”œâ”€â”€ not-found.svg                  # 404
â”‚   â”œâ”€â”€ offline.svg                    # Máº¥t máº¡ng
â”‚   â”œâ”€â”€ submitted.svg                  # Gá»­i form thÃ nh cÃ´ng
â”‚   â”œâ”€â”€ success.svg                    # Generic success
â”‚   â”œâ”€â”€ unauthorized.svg               # 401
â”‚   â””â”€â”€ unknown-error.svg              # 500 / fallback
â””â”€â”€ scss/
    â”œâ”€â”€ sd-core.scss                   # ENTRY (chá»‰ file nÃ y Ä‘Æ°á»£c import tá»« host app)
    â”œâ”€â”€ ckeditor5.scss                 # Override style cho CKEditor 5 (opt-in)
    â”œâ”€â”€ core/
    â”‚   â”œâ”€â”€ color.scss                 # Color map + CSS var declarations
    â”‚   â”œâ”€â”€ form.scss                  # Override Angular Material form (input/select/checkbox/radio)
    â”‚   â”œâ”€â”€ image.scss                 # Tiá»‡n Ã­ch background-image cho 18 illustration SVG á»Ÿ trÃªn
    â”‚   â”œâ”€â”€ scrollbar.scss             # Custom scrollbar (webkit + firefox)
    â”‚   â””â”€â”€ utilities/
    â”‚       â”œâ”€â”€ _index.scss            # Forward toÃ n bá»™ partial bÃªn dÆ°á»›i
    â”‚       â”œâ”€â”€ _base.scss             # Reset/reboot baseline (box-sizing, body, headings, formsâ€¦)
    â”‚       â”œâ”€â”€ _border.scss           # rounded-* + border + border-{side}
    â”‚       â”œâ”€â”€ _display.scss          # d-none/block/inline/inline-block/flex/inline-flex/grid
    â”‚       â”œâ”€â”€ _elevation.scss        # mat-elevation-z0â€“z8
    â”‚       â”œâ”€â”€ _flexbox.scss          # flex-1/none/auto, direction, wrap, grow/shrink, align/justify
    â”‚       â”œâ”€â”€ _gap.scss              # gap-* / gap-x-* / gap-y-*
    â”‚       â”œâ”€â”€ _grid.scss             # row/col 12-column + .grid-container + col-span-*
    â”‚       â”œâ”€â”€ _misc.scss             # align-{middleâ€¦}, cursor-*, visible/invisible
    â”‚       â”œâ”€â”€ _overflow.scss         # overflow-*
    â”‚       â”œâ”€â”€ _position.scss         # position-relative/absolute/fixed/sticky/static
    â”‚       â”œâ”€â”€ _sizing.scss           # w-* / h-* + min/max + w-full/screen/auto/fit
    â”‚       â”œâ”€â”€ _spacing.scss          # m-*, p-* (mt/mr/mb/ml/mx/my, pt/pr/pb/pl/px/py) + m-auto
    â”‚       â””â”€â”€ _typography.scss       # T{n}{M|R} tokens + fs-* + font-weight-* + text-*
    â””â”€â”€ themes/
        â”œâ”€â”€ default.scss               # sd.theme() mixin â€” override `--sd-*` color tokens
        â””â”€â”€ material-theme.scss        # Angular Material M2 theme baseline
```

---

## 3. Há»‡ thá»‘ng mÃ u sáº¯c

MÃ u Ä‘Æ°á»£c Ä‘á»‹nh nghÄ©a dÆ°á»›i dáº¡ng **CSS custom properties** vá»›i prefix `--sd-*`, cho phÃ©p override runtime (khÃ´ng cáº§n recompile SCSS).

### 3.1 Color tokens

| Token              | CSS variable           | Default     | DÃ¹ng cho |
|---|---|---|---|
| `primary`          | `--sd-primary`         | `#2A66F4`   | MÃ u chá»§ Ä‘áº¡o â€” button, checkbox, accent |
| `primary-light`    | `--sd-primary-light`   | `#EAF1FF`   | Background nháº¹ cá»§a primary |
| `primary-dark`     | `--sd-primary-dark`    | `#1C4AD9`   | Hover/active state cá»§a primary |
| `info`             | `--sd-info`            | `#2962FF`   | Link, thÃ´ng tin, badge info |
| `info-light`       | `--sd-info-light`      | `#E7E9FF`   | Background nháº¹ cá»§a info |
| `info-dark`        | `--sd-info-dark`       | `#2240CC`   | Hover state cá»§a info |
| `success`          | `--sd-success`         | `#4CAF50`   | Tráº¡ng thÃ¡i thÃ nh cÃ´ng, validation OK |
| `success-light`    | `--sd-success-light`   | `#DBEFDC`   | Background nháº¹ cá»§a success |
| `success-dark`     | `--sd-success-dark`    | `#39833C`   | Hover state cá»§a success |
| `warning`          | `--sd-warning`         | `#FF9600`   | Cáº£nh bÃ¡o, tráº¡ng thÃ¡i cáº§n chÃº Ã½ |
| `warning-light`    | `--sd-warning-light`   | `#FFEACC`   | Background nháº¹ cá»§a warning |
| `warning-dark`     | `--sd-warning-dark`    | `#BF7000`   | Hover state cá»§a warning |
| `error`            | `--sd-error`           | `#F82C13`   | Lá»—i, validation fail, tráº¡ng thÃ¡i nguy hiá»ƒm |
| `error-light`      | `--sd-error-light`     | `#FED5D0`   | Background nháº¹ cá»§a error |
| `error-dark`       | `--sd-error-dark`      | `#BA200E`   | Hover state cá»§a error |
| `secondary`        | `--sd-secondary`       | `#212121`   | Text phá»¥, icon secondary |
| `secondary-light`  | `--sd-secondary-light` | `#E9E9E9`   | Background nháº¹ |
| `secondary-dark`   | `--sd-secondary-dark`  | `#000000`   | â€” |
| `light`            | `--sd-light`           | `#F8F9FA`   | Background trang, surface nháº¹ |
| `dark`             | `--sd-dark`            | `#343A40`   | Text Ä‘áº­m, dark surface |
| `black500`         | `--sd-black500`        | `#212121`   | Text chÃ­nh |
| `black400`         | `--sd-black400`        | `#757575`   | Text phá»¥, placeholder |
| `black300`         | `--sd-black300`        | `#BFBFBF`   | Divider, border nháº¹ |
| `black200`         | `--sd-black200`        | `#E6E6E6`   | Border máº·c Ä‘á»‹nh, separator |
| `black100`         | `--sd-black100`        | `#F2F2F2`   | Background disabled, row hover |

### 3.2 Color utility classes

Má»i token á»Ÿ Â§3.1 Ä‘á»u sinh 3 class:

| Pattern         | VÃ­ dá»¥                     |
|---|---|
| `.text-{token}` | `text-primary`, `text-error`, `text-black400` |
| `.bg-{token}`   | `bg-primary-light`, `bg-error-light`, `bg-white` |
| `.border-{token}` | `border-primary`, `border-black200` |

`white` / `black` luÃ´n cÃ³ sáºµn ngoÃ i báº£ng trÃªn: `.text-white` / `.text-black` / `.bg-white` / `.bg-black`.

### 3.3 DÃ¹ng mÃ u trong component SCSS

```scss
@use '@sdcorejs/angular/assets/scss/core/color.scss' as color;
@use 'sass:map';

.my-element {
  color: map.get(color.$color_map, 'primary');
  background: map.get(color.$color_map, 'primary-light');
  border-color: map.get(color.$color_map, 'black200');
}
```

Hoáº·c Ä‘á»c trá»±c tiáº¿p CSS var (recommended cho runtime override):

```scss
.my-element {
  color: var(--sd-primary);
  background: var(--sd-primary-light);
}
```

---

## 4. Typography tokens

### 4.1 Design token classes â€” `T{size}{weight}`

Quy Æ°á»›c: `M` = Medium (500), `R` = Regular (400). Má»—i class gá»“m `font-size` + `font-weight` + `line-height` chuáº©n hÃ³a.

| Class           | Font size     | Weight    | Line height |
|---|---|---|---|
| `T48M` / `T48R` | 48px          | 500 / 400 | 56px |
| `T32M` / `T32R` | 32px          | 500 / 400 | 48px |
| `T24M` / `T24R` | 24px / 20px*  | 500 / 400 | 28px |
| `T20M` / `T20R` | 20px          | 500 / 400 | 28px |
| `T18M` / `T18R` | 18px          | 500 / 400 | 28px |
| `T16M` / `T16R` | 16px          | 500 / 400 | 24px |
| `T14M` / `T14R` | 14px          | 500 / 400 | 20px |
| `T12M` / `T12R`â€  | 12px          | 500 / 400 | 16px |
| `T10M` / `T10R` | 10px          | 500 / 400 | 12px |

\* `T24R` font-size 20px (quirk lá»‹ch sá»­ â€” `T24M` lÃ  24px). Khi cáº§n 24px/400, dÃ¹ng `T20R` 20px hoáº·c cáº·p `fs-24 + font-weight-normal`.
â€  `T12R` dÃ¹ng `!important` vÃ¬ hay bá»‹ Angular Material override.

### 4.2 Font-size utilities (px-based)

```
fs-0   fs-1 â€¦ fs-200
```

DÃ¹ng khi cáº§n override nhanh, **khÃ´ng thay** design token. Output: `font-size: {n}px !important`.

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
| `text-ellipsis`  | `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` (yÃªu cáº§u container cÃ³ width cá»‘ Ä‘á»‹nh) |
| `text-break`     | `overflow-wrap: break-word; word-break: break-word` (xuá»‘ng dÃ²ng giá»¯a kÃ½ tá»± â€” URL, hash, mÃ£ dÃ i) |

---

## 5. Layout & Grid

### 5.1 Flexbox row/col 12-column

```html
<div class="row">
  <div class="col-6">50%</div>
  <div class="col-6">50%</div>
</div>
```

`.row` lÃ  flex container cÃ³ gutter `16px` (margin Ã¢m trá»« gutter + padding ná»­a gutter trÃªn `> *`).

**Gutter variants:**

| Class    | Gutter |
|---|---|
| `row`    | 16px (máº·c Ä‘á»‹nh) |
| `row-md` | 8px |
| `row-sm` | 4px |
| `row-xs` | 2px |

**Auto-width column:** `.col` (chiáº¿m pháº§n cÃ²n láº¡i, `flex: 1 1 0%`).

**Responsive columns** (mobile-first â€” class chá»‰ kÃ­ch hoáº¡t khi viewport â‰¥ breakpoint):

| Pattern         | Min-width |
|---|---|
| `col-sm-{1-12}` / `col-sm` | â‰¥ 576px |
| `col-md-{1-12}` / `col-md` | â‰¥ 768px |
| `col-lg-{1-12}` / `col-lg` | â‰¥ 992px |
| `col-xl-{1-12}` / `col-xl` | â‰¥ 1200px |

```html
<div class="row">
  <!-- 100% trÃªn mobile, 50% tá»« md+, 33% tá»« lg+ -->
  <div class="col-md-6 col-lg-4">...</div>
</div>
```

### 5.2 CSS Grid container

```html
<div class="grid-container grid-cols-3">
  <div class="col-span-2">Chiáº¿m 2 cá»™t</div>
  <div class="col-span-1">Chiáº¿m 1 cá»™t</div>
  <div class="col-span-full">Full width</div>
</div>
```

| Class                | MÃ´ táº£ |
|---|---|
| `grid-container`     | `display: grid`, `column-gap: 8px`, `row-gap: 0` |
| `grid-cols-{1-12}`   | Sá»‘ cá»™t |
| `col-span-{1-12}`    | Item chiáº¿m n cá»™t |
| `col-span-full`      | Item chiáº¿m toÃ n bá»™ chiá»u ngang |
| `row-span-{1-12}`    | Item chiáº¿m n hÃ ng |
| `row-span-full`      | Item chiáº¿m toÃ n bá»™ chiá»u dá»c |

> CÃ¡c class `col-span-*` / `row-span-*` chá»‰ cÃ³ hiá»‡u lá»±c **bÃªn trong** `.grid-container` (selector nested).

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

### 7.1 Margin / Padding (px-based, 0â€“200)

```
m-{n}   mt-{n}   mr-{n}   mb-{n}   ml-{n}   mx-{n}   my-{n}
p-{n}   pt-{n}   pr-{n}   pb-{n}   pl-{n}   px-{n}   py-{n}
```

VÃ­ dá»¥: `m-0`, `mt-8`, `px-16`, `py-24`, `mb-4`.

**Auto margin:** `m-auto`, `mt-auto`, `mr-auto`, `mb-auto`, `ml-auto`, `mx-auto`, `my-auto`.

### 7.2 Gap (px-based, 0â€“200)

```
gap-{n}   gap-x-{n}   gap-y-{n}
```

VÃ­ dá»¥: `gap-8`, `gap-x-16`, `gap-y-4`.

---

## 8. Sizing

### 8.1 Width / Height theo px (0â€“200)

```
w-{n}   h-{n}
```

### 8.2 Width / Height theo %/keyword

| Class           | CSS |
|---|---|
| `w-full` / `w-100` | `width: 100%` (`w-100` lÃ  alias cá»§a `w-full`) |
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

### 9.1 Border-radius (px-based, 0â€“200)

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

Äá»•i mÃ u border: káº¿t há»£p `.border` vá»›i `.border-{token}` (xem Â§3.2).

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

## 12. Elevation (`mat-elevation-z0`â€“`z8`)

CSS shadow tÄ©nh, tÆ°Æ¡ng Ä‘Æ°Æ¡ng Angular Material `mat.elevation()` mixin nhÆ°ng **khÃ´ng cáº§n** import Material SCSS.

| Class                | DÃ¹ng cho |
|---|---|
| `mat-elevation-z0`   | Reset shadow |
| `mat-elevation-z1`   | Card, chip |
| `mat-elevation-z2`   | Button raised |
| `mat-elevation-z3`   | Card hover |
| `mat-elevation-z4`   | App bar |
| `mat-elevation-z5`   | â€” |
| `mat-elevation-z6`   | Floating action button |
| `mat-elevation-z7`   | â€” |
| `mat-elevation-z8`   | Dialog, drawer |

---

## 13. Reset / Reboot baseline

`_base.scss` cháº¡y trÆ°á»›c má»i utility, thiáº¿t láº­p rendering chuáº©n:

| Rule | Má»¥c Ä‘Ã­ch |
|---|---|
| `*, *::before, *::after { box-sizing: border-box }` | Báº¯t buá»™c â€” thiáº¿u lÃ  layout lá»‡ch |
| `html { -webkit-text-size-adjust: 100%; -webkit-tap-highlight-color: transparent; line-height: 1.15 }` | iOS rotation + áº©n tap highlight |
| `body { font-family: Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #212529 }` | Baseline typography |
| `h1â€¦h6` | `margin-top: 0; margin-bottom: 0.5rem` |
| `p, ol, ul, dl` | `margin-top: 0; margin-bottom: 1rem` |
| `a { color: #007bff; text-decoration: none }`, `a:hover { text-decoration: underline }` | Link máº·c Ä‘á»‹nh |
| `label { display: inline-block; margin-bottom: 0.5rem }` | Form layout (mat-checkbox override á»Ÿ `core/form.scss`) |
| `button { border-radius: 0 }`, `button:focus:not(:focus-visible) { outline: 0 }` | Reset native button |
| `table { border-collapse: collapse }` | TrÃ¡nh double border |
| `th { font-weight: 600; text-align: inherit }` | Bá» bold native browser |
| `textarea { overflow: auto; resize: vertical }` | Bá» scrollbar dá»c máº·c Ä‘á»‹nh IE, chá»‰ resize chiá»u dá»c |
| `[role="button"] { cursor: pointer }` | A11y |
| `[hidden] { display: none !important }` | IE10 fallback |

---

## 14. Custom theme

Trong `styles.scss` cá»§a host app, gá»i `sd.theme()` Ä‘á»ƒ override mÃ u, sau Ä‘Ã³ cáº¥u hÃ¬nh Angular Material M2 palette tÆ°Æ¡ng á»©ng:

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

> `sd.theme()` chá»‰ cáº§n khai bÃ¡o nhá»¯ng token muá»‘n override â€” token khÃ´ng khai bÃ¡o giá»¯ default.
> Cáº£ `sd.theme()` vÃ  `mat.all-component-themes()` **pháº£i** gá»i trong `styles.scss`, khÃ´ng pháº£i component SCSS.

---

## 15. Fonts & images shipped

### 15.1 Fonts

`fonts.scss` declare `@font-face` cho 3 family â€” host app **khÃ´ng cáº§n** thÃªm Google Fonts link.

| Family | Variants | File path |
|---|---|---|
| Roboto | regular (400), 500, 600, italic | `assets/fonts/roboto/roboto-v50-latin_vietnamese-*.woff2` (4 file, latin + vietnamese subset) |
| Material Icons | regular + outlined | `assets/fonts/material-icons/{material-icons-v145,material-icons-outlined-v110}-latin-regular.woff2` |
| Material Symbols | regular | `assets/fonts/material-symbols/material-symbols-v29-latin-regular.woff2` |

### 15.2 Image assets (18 SVG illustrations)

Tham chiáº¿u qua `core/image.scss` utility hoáº·c trá»±c tiáº¿p `assets/images/<name>.svg`:

| File                       | DÃ¹ng cho |
|---|---|
| `coming-soon.svg`          | Trang chÆ°a sáºµn sÃ ng |
| `data-empty.svg`           | Empty state cho table / list |
| `expired.svg`              | Session expired |
| `file-error.svg`           | Upload file lá»—i |
| `filter-empty.svg`         | KhÃ´ng káº¿t quáº£ khá»›p filter |
| `filter-required.svg`      | YÃªu cáº§u chá»n filter trÆ°á»›c khi load data |
| `forbidden.svg`            | 403 Forbidden |
| `image-error.svg`          | Image load fail |
| `maintenance.svg`          | Äang báº£o trÃ¬ |
| `not-found.svg`            | 404 Not Found |
| `offline.svg`              | Máº¥t máº¡ng |
| `submitted.svg`            | Form gá»­i thÃ nh cÃ´ng |
| `success.svg`              | Generic success |
| `unauthorized.svg`         | 401 Unauthorized |
| `unknown-error.svg`        | 500 / fallback |

---

## 16. What is NOT shipped

Äá»ƒ AI agent khÃ´ng sinh class láº¡:

- âŒ **KhÃ´ng cÃ³ Bootstrap, Tailwind, Bulma, Foundation.** Táº¥t cáº£ utility á»Ÿ Â§3â€“Â§13 lÃ  code thuáº§n SCSS cá»§a `@sdcorejs/angular`. Class nhÆ° `.btn`, `.btn-primary`, `.card`, `.alert`, `.navbar`, `.form-control`, `.input-group`, `.modal`, `.dropdown`, `.list-group`, `.breadcrumb`, `.carousel`, `.popover`, `.tooltip`, `.progress`, `.spinner-border`, `.badge` (Bootstrap) **KHÃ”NG tá»“n táº¡i**.
- âŒ **KhÃ´ng cÃ³ Tailwind escape syntax** (`md:flex`, `hover:bg-red-500`, `text-[14px]`â€¦). Responsive class duy nháº¥t lÃ  `col-sm-*` / `col-md-*` / `col-lg-*` / `col-xl-*` á»Ÿ Â§5.1.
- âŒ **KhÃ´ng cÃ³ dark mode token** sáºµn â€” pháº£i tá»± khai bÃ¡o náº¿u cáº§n.
- âŒ **KhÃ´ng cÃ³ animation utility class** (kiá»ƒu `.fade`, `.slide-in`). Animation handle qua Angular `[@trigger]` hoáº·c CSS riÃªng cá»§a component.
- âŒ **KhÃ´ng sinh class theo px arbitrary** â€” `m-{n}`, `p-{n}`, `w-{n}`, `h-{n}`, `fs-{n}`, `gap-{n}`, `rounded-{n}` chá»‰ cháº¡y tá»« **0 â†’ 200** integer. Cáº§n `w-250` thÃ¬ pháº£i tá»± viáº¿t SCSS hoáº·c dÃ¹ng inline style.
- âŒ **KhÃ´ng cÃ³ shorthand position** (kiá»ƒu `top-0`, `left-50`). Set `position-absolute` rá»“i viáº¿t CSS riÃªng cho offset.
- âŒ **Component selector khÃ´ng pháº£i utility class.** `sd-button`, `sd-input`, `sd-anchor`â€¦ lÃ  Angular component (xem `components/*/sd-*.md`), khÃ´ng pháº£i CSS class.

### Migration check khi Ä‘á»c code cÅ©

| Class cÅ© (Bootstrap) | Thay tháº¿ báº±ng |
|---|---|
| `d-flex`             | `d-flex` (giá»¯ nguyÃªn â€” Ä‘Ã£ port) |
| `text-center`        | `text-center` (giá»¯ nguyÃªn) |
| `text-truncate`      | `text-ellipsis` |
| `font-weight-normal` | `font-weight-normal` (giá»¯ nguyÃªn) |
| `mt-2` / `mt-3` â€¦    | `mt-8` / `mt-16` â€¦ (px-based 0â€“200, khÃ´ng pháº£i multiplier 4) |
| `pl-2`               | `pl-8` (Ä‘á»•i Ä‘Æ¡n vá»‹) |
| `w-100`              | `w-100` hoáº·c `w-full` |
| `border-secondary`   | `border-secondary` (váº«n cÃ³ â€” secondary lÃ  token mÃ u, khÃ´ng pháº£i utility riÃªng) |
| `btn`, `btn-primary` | dÃ¹ng `<sd-button [color]="primary">` |
| `form-control`       | dÃ¹ng `<sd-input>` / `<sd-select>` â€¦ |
| `alert`              | dÃ¹ng `<sd-notify>` service |
| `modal`              | dÃ¹ng `<sd-modal>` |

> LÆ°u Ã½ lá»›n nháº¥t: **spacing scale Ä‘Ã£ Ä‘á»•i tá»« Bootstrap multiplier (1=4px, 2=8pxâ€¦) sang px tuyá»‡t Ä‘á»‘i**. `mb-3` trong Bootstrap = 16px; trong `@sdcorejs/angular` `mb-3` = **3px**. Reading code cÅ© cáº§n convert (Ã— 4) cáº©n tháº­n hoáº·c thay báº±ng `mb-16`.

