# SD Angular â€” SCSS Documentation

## Má»¥c lá»¥c

1. [CÃ i Ä‘áº·t vÃ o Angular](#1-cÃ i-Ä‘áº·t-vÃ o-angular)
2. [Há»‡ thá»‘ng mÃ u sáº¯c](#2-há»‡-thá»‘ng-mÃ u-sáº¯c)
3. [Custom theme](#3-custom-theme)
4. [Utility classes](#4-utility-classes)
   - [Spacing](#spacing--margin--padding)
   - [Sizing](#sizing--width--height)
   - [Border](#border)
   - [Grid & Layout](#grid--layout)
   - [Flexbox](#flexbox)
   - [Display](#display)
   - [Gap](#gap)
   - [Typography](#typography)
   - [Overflow](#overflow)
   - [Position](#position)
   - [Elevation](#elevation)
   - [Misc](#misc)

---

## 1. CÃ i Ä‘áº·t vÃ o Angular

ThÃªm vÃ o `angular.json` (trong pháº§n `styles` cá»§a build target):

```json
"styles": [
  "./node_modules/@sdcorejs/angular/assets/scss/sd-core.scss",
  "src/styles.scss"
]
```

`sd-core.scss` bao gá»“m toÃ n bá»™: reset CSS, utilities, mÃ u theme, form overrides, scrollbar, vÃ  Angular Material theme.

---

## 2. Há»‡ thá»‘ng mÃ u sáº¯c

MÃ u Ä‘Æ°á»£c Ä‘á»‹nh nghÄ©a dÆ°á»›i dáº¡ng **CSS custom properties** cÃ³ tiá»n tá»‘ `--sd-*`, cho phÃ©p override runtime (khÃ´ng cáº§n recompile SCSS).

### MÃ u máº·c Ä‘á»‹nh

| Token | CSS Variable | GiÃ¡ trá»‹ máº·c Ä‘á»‹nh | DÃ¹ng cho |
|---|---|---|---|
| `primary` | `--sd-primary` | `#2A66F4` | MÃ u chá»§ Ä‘áº¡o â€” button, checkbox, accent |
| `primary-light` | `--sd-primary-light` | `#EAF1FF` | Background nháº¹ cá»§a primary |
| `primary-dark` | `--sd-primary-dark` | `#1C4AD9` | Hover/active state cá»§a primary |
| `info` | `--sd-info` | `#2962FF` | Link, thÃ´ng tin, badge info |
| `info-light` | `--sd-info-light` | `#E7E9FF` | Background nháº¹ cá»§a info |
| `info-dark` | `--sd-info-dark` | `#2240CC` | Hover state cá»§a info |
| `success` | `--sd-success` | `#4CAF50` | Tráº¡ng thÃ¡i thÃ nh cÃ´ng, validation OK |
| `success-light` | `--sd-success-light` | `#DBEFDC` | Background nháº¹ cá»§a success |
| `success-dark` | `--sd-success-dark` | `#39833C` | Hover state cá»§a success |
| `warning` | `--sd-warning` | `#FF9600` | Cáº£nh bÃ¡o, tráº¡ng thÃ¡i cáº§n chÃº Ã½ |
| `warning-light` | `--sd-warning-light` | `#FFEACC` | Background nháº¹ cá»§a warning |
| `warning-dark` | `--sd-warning-dark` | `#BF7000` | Hover state cá»§a warning |
| `error` | `--sd-error` | `#F82C13` | Lá»—i, validation fail, tráº¡ng thÃ¡i nguy hiá»ƒm |
| `error-light` | `--sd-error-light` | `#FED5D0` | Background nháº¹ cá»§a error |
| `error-dark` | `--sd-error-dark` | `#BA200E` | Hover state cá»§a error |
| `secondary` | `--sd-secondary` | `#212121` | Text phá»¥, icon secondary |
| `secondary-light` | `--sd-secondary-light` | `#E9E9E9` | Background nháº¹ |
| `secondary-dark` | `--sd-secondary-dark` | `#000000` | â€” |
| `light` | `--sd-light` | `#F8F9FA` | Background trang, surface nháº¹ |
| `dark` | `--sd-dark` | `#343A40` | Text Ä‘áº­m, dark surface |
| `black500` | `--sd-black500` | `#212121` | Text chÃ­nh |
| `black400` | `--sd-black400` | `#757575` | Text phá»¥, placeholder |
| `black300` | `--sd-black300` | `#BFBFBF` | Divider, border nháº¹ |
| `black200` | `--sd-black200` | `#E6E6E6` | Border máº·c Ä‘á»‹nh, separator |
| `black100` | `--sd-black100` | `#F2F2F2` | Background disabled, row hover |

### DÃ¹ng mÃ u trong SCSS component

```scss
@use '@sdcorejs/angular/assets/scss/core/color.scss' as color;
@use 'sass:map';

.my-element {
  color: map.get(color.$color_map, 'primary');
  background: map.get(color.$color_map, 'primary-light');
  border-color: map.get(color.$color_map, 'black200');
}
```

### DÃ¹ng mÃ u qua utility class trong template

```html
<!-- Text color -->
<span class="text-primary">Primary</span>
<span class="text-error">Lá»—i</span>
<span class="text-secondary">Phá»¥</span>
<span class="text-success">ThÃ nh cÃ´ng</span>
<span class="text-warning">Cáº£nh bÃ¡o</span>

<!-- Background color -->
<div class="bg-primary-light">...</div>
<div class="bg-error-light">...</div>
<div class="bg-white">...</div>

<!-- Border color -->
<div class="border-primary">...</div>
```

Táº¥t cáº£ token Ä‘á»u cÃ³ class: `.text-{token}`, `.bg-{token}`, `.border-{token}`.

---

## 3. Custom theme

Trong `styles.scss` cá»§a á»©ng dá»¥ng, import theme mixin vÃ  Angular Material, sau Ä‘Ã³ gá»i `sd.theme()` vá»›i cÃ¡c mÃ u muá»‘n override.

Chá»‰ cáº§n khai bÃ¡o cÃ¡c mÃ u muá»‘n **thay Ä‘á»•i** â€” mÃ u khÃ´ng khai bÃ¡o sáº½ dÃ¹ng giÃ¡ trá»‹ máº·c Ä‘á»‹nh.

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

// --- Angular Material M2 Palette ---

$custom-primary-palette: mat.m2-define-palette((
  50: #F4F2F1,
  100: #E7E1DA,
  200: #DAC8B4,
  300: #D1AC80,
  400: #CD9450,
  500: #AE7129,
  600: #8D5A1E,
  700: #6B4414,
  800: #4B2F0E,
  900: #34210A,
  contrast: (
    600: white,
    700: white,
    800: white,
    900: white,
  )
));

$custom-accent-palette: mat.m2-define-palette((
  50: #F1F3F1,
  100: #DCE5DD,
  200: #BBD3BC,
  300: #8FC291,
  400: #67B76A,
  500: #4CAF50,
  600: #3A8C3D,
  700: #29692C,
  800: #1C471E,
  900: #132F14,
  contrast: (
    700: white,
    800: white,
    900: white,
  )
));

$custom-warn-palette: mat.m2-define-palette((
  50: #F5F0F0,
  100: #EAD9D6,
  200: #E4B0AA,
  300: #E6786B,
  400: #EE4430,
  500: #F82C13,
  600: #D11801,
  700: #9A1100,
  800: #680B00,
  900: #440700,
  contrast: (
    600: white,
    700: white,
    800: white,
    900: white,
  )
));

$custom-theme: mat.m2-define-light-theme((
  color: (
    primary: $custom-primary-palette,
    accent:  $custom-accent-palette,
    warn:    $custom-warn-palette,
  ),
  density: -3,
));

@include mat.all-component-themes($custom-theme);
```

> **LÆ°u Ã½:** `sd.theme()` vÃ  `mat.all-component-themes()` Ä‘á»u cáº§n Ä‘Æ°á»£c gá»i trong `styles.scss`, khÃ´ng pháº£i trong component SCSS.

---

## 4. Utility classes

Táº¥t cáº£ utility classes Ä‘á»u cÃ³ `!important` Ä‘á»ƒ Ä‘áº£m báº£o override Ä‘Æ°á»£c khi káº¿t há»£p vá»›i Angular Material.

---

### Spacing â€” Margin & Padding

Há»‡ thá»‘ng spacing theo Ä‘Æ¡n vá»‹ **px**, range tá»« 0 Ä‘áº¿n 200.

```
m-{n}     mt-{n}    mr-{n}    mb-{n}    ml-{n}    mx-{n}    my-{n}
p-{n}     pt-{n}    pr-{n}    pb-{n}    pl-{n}    px-{n}    py-{n}
```

VÃ­ dá»¥: `m-0`, `mt-8`, `px-16`, `py-24`, `mb-4`

**Auto margin:**
```
m-auto   mt-auto   mr-auto   mb-auto   ml-auto   mx-auto   my-auto
```

---

### Sizing â€” Width & Height

**Theo px** (0â€“200): `w-{n}`, `h-{n}`

**Theo %/keyword:**

| Class | CSS |
|---|---|
| `w-full` | `width: 100%` |
| `w-100` | `width: 100%` (alias) |
| `w-auto` | `width: auto` |
| `w-screen` | `width: 100vw` |
| `w-fit` | `width: fit-content` |
| `h-full` | `height: 100%` |
| `h-100` | `height: 100%` (alias) |
| `h-auto` | `height: auto` |
| `h-screen` | `height: 100vh` |
| `h-fit` | `height: fit-content` |
| `min-h-full` | `min-height: 100%` |
| `min-h-screen` | `min-height: 100vh` |
| `min-w-full` | `min-width: 100%` |
| `max-h-full` | `max-height: 100%` |
| `max-w-full` | `max-width: 100%` |

---

### Border

**Border-radius** (0â€“200px): `rounded-{n}`, `rounded-full` (9999px)

**Border utilities:**

| Class | CSS |
|---|---|
| `border` | `border: 1px solid var(--sd-black200)` |
| `border-0` | `border: 0` |
| `border-top` | `border-top: 1px solid var(--sd-black200)` |
| `border-bottom` | `border-bottom: 1px solid var(--sd-black200)` |
| `border-left` | `border-left: 1px solid var(--sd-black200)` |
| `border-right` | `border-right: 1px solid var(--sd-black200)` |

---

### Grid & Layout

#### Flexbox row/col

```html
<div class="row">
  <div class="col-6">50%</div>
  <div class="col-6">50%</div>
</div>
```

`.row` lÃ  flex container cÃ³ gutter `16px`. CÃ¡c class `.col-{1-12}` chia theo 12 cá»™t.

**Gutter variants:**

| Class | Gutter |
|---|---|
| `row` | 16px (máº·c Ä‘á»‹nh) |
| `row-md` | 8px |
| `row-sm` | 4px |
| `row-xs` | 2px |

**Responsive columns** (mobile-first â€” Ã¡p dá»¥ng tá»« breakpoint trá»Ÿ lÃªn):

| Class | Min-width |
|---|---|
| `col-sm-{1-12}` | â‰¥ 576px |
| `col-md-{1-12}` | â‰¥ 768px |
| `col-lg-{1-12}` | â‰¥ 992px |
| `col-xl-{1-12}` | â‰¥ 1200px |

VÃ­ dá»¥:
```html
<div class="row">
  <!-- Full width trÃªn mobile, 50% tá»« md trá»Ÿ lÃªn, 33% tá»« lg trá»Ÿ lÃªn -->
  <div class="col-md-6 col-lg-4">...</div>
</div>
```

#### CSS Grid container

```html
<div class="grid-container grid-cols-3">
  <div class="col-span-2">Chiáº¿m 2 cá»™t</div>
  <div class="col-span-1">Chiáº¿m 1 cá»™t</div>
  <div class="col-span-full">Full width</div>
</div>
```

| Class | MÃ´ táº£ |
|---|---|
| `grid-container` | `display: grid`, gutter cá»™t 8px |
| `grid-cols-{1-12}` | Sá»‘ cá»™t cá»§a grid |
| `col-span-{1-12}` | Chiáº¿m n cá»™t |
| `col-span-full` | Chiáº¿m toÃ n bá»™ chiá»u ngang |
| `row-span-{1-12}` | Chiáº¿m n hÃ ng |
| `row-span-full` | Chiáº¿m toÃ n bá»™ chiá»u dá»c |

---

### Flexbox

**Flex shorthand:**

| Class | CSS |
|---|---|
| `flex-1` | `flex: 1` |
| `flex-none` | `flex: none` |
| `flex-auto` | `flex: auto` |

**Direction:**
```
flex-row   flex-column   flex-row-reverse   flex-column-reverse
```

**Wrap:**
```
flex-wrap   flex-nowrap
```

**Grow & shrink:**
```
flex-grow-0   flex-grow-1   flex-shrink-0   flex-shrink-1
```

**Align items:**
```
align-items-start   align-items-end   align-items-center
align-items-baseline   align-items-stretch
```

**Align self:**
```
align-self-start   align-self-end   align-self-center
align-self-stretch   align-self-auto
```

**Align content:**
```
align-content-start   align-content-end   align-content-center
align-content-between   align-content-around   align-content-stretch
```

**Justify content:**
```
justify-content-start   justify-content-end   justify-content-center
justify-content-between   justify-content-around   justify-content-evenly
```

---

### Display

| Class | CSS |
|---|---|
| `d-none` | `display: none` |
| `d-block` | `display: block` |
| `d-inline` | `display: inline` |
| `d-inline-block` | `display: inline-block` |
| `d-flex` | `display: flex` |
| `d-inline-flex` | `display: inline-flex` |
| `d-grid` | `display: grid` |

---

### Gap

Há»‡ thá»‘ng gap theo Ä‘Æ¡n vá»‹ **px**, range tá»« 0 Ä‘áº¿n 200.

| Class | CSS |
|---|---|
| `gap-{n}` | `gap: npx` |
| `gap-x-{n}` | `column-gap: npx` |
| `gap-y-{n}` | `row-gap: npx` |

VÃ­ dá»¥: `gap-8`, `gap-x-16`, `gap-y-4`

---

### Typography

#### Design token classes

Há»‡ thá»‘ng typography theo quy Æ°á»›c `T{size}{weight}` â€” `M` = Medium (500), `R` = Regular (400).

| Class | Font size | Weight | Line height |
|---|---|---|---|
| `T48M` / `T48R` | 48px | 500 / 400 | 56px |
| `T32M` / `T32R` | 32px | 500 / 400 | 48px |
| `T24M` / `T24R` | 24px / 20px | 500 / 400 | 28px |
| `T20M` / `T20R` | 20px | 500 / 400 | 28px |
| `T18M` / `T18R` | 18px | 500 / 400 | 28px |
| `T16M` / `T16R` | 16px | 500 / 400 | 24px |
| `T14M` / `T14R` | 14px | 500 / 400 | 20px |
| `T12M` / `T12R` | 12px | 500 / 400 | 16px |
| `T10M` / `T10R` | 10px | 500 / 400 | 12px |

#### Font-size utilities (px-based, 0â€“200)

```
fs-0   fs-12   fs-14   fs-16   ...   fs-200
```

#### Font-weight utilities

```
font-weight-light    (300)
font-weight-normal   (400)
font-weight-medium   (500)
font-weight-bold     (600)
font-weight-bolder   (700)
```

#### Text alignment

```
text-left   text-center   text-right   text-justify
```

#### Text wrapping & overflow

| Class | CSS |
|---|---|
| `text-wrap` | `white-space: normal` |
| `text-nowrap` | `white-space: nowrap` |
| `text-ellipsis` | `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` |
| `text-break` | `overflow-wrap: break-word; word-break: break-word` |

#### Text transform

```
text-uppercase   text-lowercase   text-capitalize
```

---

### Overflow

| Class | CSS |
|---|---|
| `overflow-auto` | `overflow: auto` |
| `overflow-hidden` | `overflow: hidden` |
| `overflow-visible` | `overflow: visible` |
| `overflow-scroll` | `overflow: scroll` |
| `overflow-x-auto` | `overflow-x: auto` |
| `overflow-y-auto` | `overflow-y: auto` |

---

### Position

```
position-relative   position-absolute   position-fixed
position-sticky     position-static
```

---

### Elevation

CSS shadow tÄ©nh tÆ°Æ¡ng Ä‘Æ°Æ¡ng Angular Material `mat-elevation-z{n}`.

| Class | DÃ¹ng cho |
|---|---|
| `mat-elevation-z0` | Reset shadow |
| `mat-elevation-z1` | Card, chip |
| `mat-elevation-z2` | Button raised |
| `mat-elevation-z3` | Card hover |
| `mat-elevation-z4` | App bar |
| `mat-elevation-z5` | â€” |
| `mat-elevation-z6` | Floating action button |
| `mat-elevation-z7` | â€” |
| `mat-elevation-z8` | Dialog, drawer |

---

### Misc

**Vertical align:**
```
align-middle   align-top   align-bottom   align-baseline
```

**Cursor:**
```
cursor-pointer   cursor-default   cursor-not-allowed
```

**Visibility:**

| Class | CSS |
|---|---|
| `visible` | `visibility: visible` |
| `invisible` | `visibility: hidden` |

