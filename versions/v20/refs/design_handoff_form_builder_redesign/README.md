# Handoff · Form Builder UI Redesign (sd-angular)

## Overview
Visual redesign of the **`<sd-form-builder>`** component in the `sd-angular` library
(`components/form-generic/src/components/form-builder/`). The current builder works
functionally but the UI is dated, inconsistent (3 different icon styles), and visually
heavy (gray uppercase headers, Material-default blue, awkward hover toolbars).

This redesign keeps **100% of the existing functionality and architecture**
(Angular standalone components, CDK Drag & Drop, the existing `FormBuilderComponents`
registry, the SdSection / SdInput / SdTextarea / SdButton primitives, etc.) and
only changes the **visual layer**: tokens, layout, icons, spacing, item states,
and the attribute panel.

## About the Design Files
The files in this bundle are **design references created in HTML/CSS/React-JSX**.
They are prototypes that show the intended look and behavior — **not production code
to copy directly**. The task is to recreate these designs inside the existing
`sd-angular` codebase, using its established patterns:

- Angular 17+ standalone components (the builder is already standalone)
- SCSS with `::ng-deep` for cross-component styling
- Material Icons (currently `mat-icon`) → **upgrade to Material Symbols Rounded** (variable font)
- Existing form primitives: `<sd-input>`, `<sd-textarea>`, `<sd-button>`, `<sd-modal>`, `<sd-section>`
- CDK Drag & Drop (already wired)
- `BuilderService`, `SdFormGenericComponent`, `SdFormGenericGroup`, `FormBuilderComponents`
  registry — all stay as-is

## Fidelity
**High-fidelity.** Final colors, typography, spacing, radii, and elevation are all
specified as M3 system tokens. Recreate pixel-perfect.

---

## Files in this bundle

| File | Purpose |
|------|---------|
| `Form Builder UI Redesign.html` | Entry point — open in a browser to view all 10 artboards |
| `tokens.css` | **The source of truth.** All M3 tokens, compact density vars, and class definitions used in the mockups. Port the variables block + the `.fb-*` and `.faux-*` classes into the Angular component's SCSS (or a shared `_form-builder-tokens.scss`). |
| `builder-mock.jsx` | React mock of the visual primitives: `Palette`, `CanvasItem`, `ItemActions`, `AttributePanelFull`, `Section`, `Switch`, `ExprInput`, faux fields, etc. **Reference for component anatomy.** |
| `artboards.jsx` | The 10 artboards (Layout / Components & states / Composite / System) composed into a design canvas. |
| `design-canvas.jsx` | Pan/zoom shell used by the prototype — **not part of the deliverable**. |

---

## Design tokens — port these to `tokens.css` / SCSS

Add Material Symbols Rounded variable font to the app's `index.html` (replaces the
current Material Icons stylesheet):
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..40,200..500,0..1,-25..0&display=swap">
```

CSS variables (compact density, M3 baseline — **brand = `--md-sys-color-primary`**;
swap the 4 primary tokens to match your real core brand color):

```css
:root {
  /* M3 baseline · brand = primary (4 tokens to rebrand) */
  --md-sys-color-primary: #6750A4;
  --md-sys-color-on-primary: #FFFFFF;
  --md-sys-color-primary-container: #EADDFF;
  --md-sys-color-on-primary-container: #21005D;

  --md-sys-color-secondary: #625B71;
  --md-sys-color-secondary-container: #E8DEF8;
  --md-sys-color-on-secondary-container: #1D192B;

  --md-sys-color-surface:                #FBFAFC;
  --md-sys-color-surface-container-low:  #F6F4F8;
  --md-sys-color-surface-container:      #F1EEF3;
  --md-sys-color-surface-container-high: #EBE8EE;
  --md-sys-color-surface-container-highest:#E6E2EA;
  --md-sys-color-surface-container-lowest:#FFFFFF;

  --md-sys-color-on-surface:         #1C1B1F;
  --md-sys-color-on-surface-variant: #49454E;
  --md-sys-color-outline:            #79747E;
  --md-sys-color-outline-variant:    #D6D2DA;

  --md-sys-color-error:             #B3261E;
  --md-sys-color-error-container:   #F9DEDC;
  --md-sys-color-warning:           #8A5400;
  --md-sys-color-warning-container: #FFDDB1;
  --md-sys-color-success:           #1F6F43;
  --md-sys-color-success-container: #B7F0CB;

  /* Compact density */
  --h-row: 28px; --h-field: 32px; --h-palette: 36px;
  --h-header: 36px; --h-section: 28px; --h-action-btn: 24px;
  --gap-1:4px; --gap-2:8px; --gap-3:12px; --gap-4:16px; --gap-5:24px;
  --r-xs:4px; --r-sm:8px; --r-md:12px; --r-lg:16px; --r-xl:28px; --r-pill:999px;

  --elev-1: 0 1px 2px 0 rgba(0,0,0,0.06);
  --elev-2: 0 2px 6px 0 rgba(0,0,0,0.08), 0 1px 2px 0 rgba(0,0,0,0.04);
  --elev-3: 0 6px 14px 0 rgba(0,0,0,0.10), 0 2px 4px 0 rgba(0,0,0,0.06);
}
```

**Type:** Roboto 300/400/500/700 + Roboto Mono 400/500
(load via the same `@import` block in `tokens.css`).

---

## Icon migration · Material Symbols Rounded

Replace the entire `FormBuilderComponents` icon SVG payload in
`models/form-generic-component.model.ts` (lines ~446-510) with Material Symbol
names. Recommended approach: change the model to store a `symbol: string` instead
of `icon: string` (or keep both for backward compat), and render with:

```html
<span class="msi" [style.fontSize.px]="16">{{ formBuilderComponent.symbol }}</span>
```

Where `.msi` is:
```css
.msi {
  font-family: 'Material Symbols Rounded';
  font-variation-settings: 'wght' 300, 'opsz' 24, 'GRAD' 0, 'FILL' 0;
  font-weight: normal; line-height: 1; font-feature-settings: 'liga';
  display: inline-block;
}
```

### Component-type → Material Symbol mapping

| `type`         | Old icon (3 mixed styles)        | New symbol (single font)     |
|----------------|----------------------------------|------------------------------|
| `textfield`    | custom 54×54 SVG                 | `text_fields`                |
| `textarea`     | custom 54×54 SVG                 | `notes`                      |
| `chip-string`  | duplicated 24×24 SVG             | `label`                      |
| `chip-calendar`| duplicated 24×24 SVG (same as ↑) | `event_note`                 |
| `number`       | custom 54×54 SVG                 | `123`                        |
| `datetime`     | custom 54×54 SVG                 | `calendar_month`             |
| `select`       | custom 54×54 SVG                 | `arrow_drop_down_circle`     |
| `radio`        | custom 54×54 SVG                 | `radio_button_checked`       |
| `checkbox`     | custom 54×54 SVG                 | `check_box`                  |
| `html`         | material `code` 32px             | `code_blocks`                |
| `upload`       | custom 54×54 SVG                 | `upload_file`                |
| `table`        | material `table_chart` 32px      | `table_rows`                 |
| `group` (new)  | —                                | `category`                   |

### Toolbar / header / section icons (replace `mat-icon` `fontIcon=`)

| Where                              | Old `fontIcon`     | New symbol         |
|------------------------------------|--------------------|--------------------|
| View JSON                          | `code`             | `data_object`      |
| Configure variables                | `scatter_plot`     | `data_array`       |
| Configure validation               | `error`            | `rule`             |
| Preview toggle (off → on)          | `play_circle`/`stop_circle` | use **segmented Design/Preview toggle** (see Layout) |
| Drag row handle                    | `drag_indicator`   | `drag_indicator` (kept) |
| Item action: set/unset readonly    | `edit_off`         | `edit_off` (kept)  |
| Item action: duplicate             | `content_copy`     | `content_copy` (kept) |
| Item action: hide/show             | `visibility_off`   | `visibility` / `visibility_off` |
| Item action: delete                | `delete`           | `delete` (kept)    |
| Section "General"                  | `info`             | `info` (kept)      |
| Section "Display"                  | `visibility`       | `visibility` (kept) |
| Section "Validation"               | `verified_user`    | `verified` (M3 prefers `verified`) |
| Section "Columns" (table)          | —                  | `view_column`      |
| Section "Children" (group)         | —                  | `account_tree`     |
| Section "Layout"                   | —                  | `view_quilt`       |
| Empty state hero                   | —                  | `dashboard_customize` |

All symbols are valid in `Material Symbols Rounded`.

---

## Layout — 3-panel shell

```
┌──────────────────────────────────────────────────────────────────────────┐
│ COMPONENTS  │  Customer onboarding › Layout    [↶][↷] │ {} [ ] ⚏  [✎ ▢] │  ← header 36px
├─────────────┼──────────────────────────────────────────┼──────────────────┤
│ 🔎 Search…  │                                          │ ATTRIBUTES       │
│             │   ⠿ ┌──────────────────────────────────┐ │ ┌──────────────┐ │
│ BASIC       │     │ Customer email *                 │ │ │ T  Customer  │ │
│ ▣ Text field│     │ [jane@onemount.com           ]   │ │ │    email     │ │
│ ▢ Text area │     │ We'll only use this …            │ │ │   customer…  │ │
│ # Number    │     └──────────────────────────────────┘ │ ├──────────────┤ │
│ 📅 Date/time│                                          │ │ ▼ General    │ │
│             │   ⠿ ┌─────────────┐  ┌─────────────┐    │ │ ▼ Display    │ │
│ CHOICE      │     │ First name *│  │ Last name * │    │ │ ▼ Validation │ │
│ ▼ Select    │     │ [Jane     ] │  │ [Doe      ] │    │ │ ▸ Layout     │ │
│ ◉ Radio     │     └─────────────┘  └─────────────┘    │ └──────────────┘ │
│ ☑ Checkbox  │                                          │                  │
│ ⋯           │                                          │                  │
└─────────────┴──────────────────────────────────────────┴──────────────────┘
   220px                       flex                            320px
```

- **Background**: `var(--md-sys-color-surface)` everywhere except panels.
- **Left palette**: `var(--md-sys-color-surface-container-low)`, right border
  `1px solid var(--md-sys-color-outline-variant)`.
- **Right attributes**: same surface as palette, left border same.
- **All headers**: 36px tall, label-small uppercase tracking 0.08em, color
  `var(--md-sys-color-on-surface-variant)`. No gray `#ebebeb` fills.

### Header right-cluster (current `c-header` in `form-builder.component.html`)

Replace the 4 floating `mat-icon`s with a clearer grouped toolbar:

```
[ undo ][ redo ] │ [ {} ][ [] ][ ⚖ ] │ ( Design | Preview )
```

The `( Design | Preview )` is an **M3 segmented button** (not the old
`play_circle/stop_circle` toggle):
- Container: `1px solid var(--md-sys-color-outline)`, `border-radius: 999px`,
  height 28px.
- Active segment: `var(--md-sys-color-secondary-container)` background,
  `var(--md-sys-color-on-secondary-container)` text.
- Each button shows a 14px symbol + label.

---

## Component palette (left)

**Replace** the current 2-column grid (100×68 items) with a **vertical list**:

- Width: **220px** (was 120px).
- Search input pill at top (`var(--md-sys-color-surface-container-high)`,
  border-radius 999px, 32px tall, includes ⌘K affordance — keyboard handler
  optional in v1).
- 4 category groups: **Basic** / **Choice** / **Advanced** / **Layout**.
  - Group label: 11px medium uppercase, tracking 0.04em.
- **Palette item** (36px tall):
  - 24×24 square icon container, radius 4px,
    `var(--md-sys-color-primary-container)` bg, `var(--md-sys-color-primary)` fg,
    16px symbol.
  - Field name 13px regular.
  - `drag_indicator` 16px on right, **opacity 0 until item hover**.
  - Hover: `color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent)`
    (M3 state-layer at 8%).

```html
<!-- Pseudo-Angular -->
<div class="fb-palette">
  <div class="fb-panel-header">…</div>
  <input class="fb-palette__search" placeholder="Search components…">
  <ng-container *ngFor="let g of paletteGroups">
    <div class="fb-palette__group-label">{{ g.label }}</div>
    <div class="fb-palette__list" cdkDropList [cdkDropListData]="g.items"
         [cdkDropListEnterPredicate]="noReturnPredicate">
      <div *ngFor="let c of g.items" cdkDrag class="fb-palette-item" (click)="addComponent(c)">
        <span class="fb-palette-item__icon"><span class="msi">{{ c.symbol }}</span></span>
        <span class="fb-palette-item__name">{{ c.name }}</span>
        <span class="fb-palette-item__drag"><span class="msi">drag_indicator</span></span>
      </div>
    </div>
  </ng-container>
</div>
```

Categorize the existing `FormBuilderComponents` like this (add a `group: string`
field to the model):

```ts
Basic    : textfield, textarea, number, datetime
Choice   : select, radio, checkbox
Advanced : chip-string, chip-calendar, upload, table
Layout   : group, html
```

---

## Canvas (center) · row / item / states

### Row container (`fb-row`)

- Padding `6px 8px`, radius `var(--r-sm)`, margin-bottom 6px.
- **Hover**: `outline: 1px dashed var(--md-sys-color-outline-variant)` +
  faint primary tint (3%).
- Drag grip (`.fb-row__drag`): absolute left:-22px, 18×22px,
  `var(--md-sys-color-surface-container-high)` bg, `drag_indicator` 14px,
  opacity 0 until row hover. (Replaces current floating `mat-icon` at `left:-12px`.)

### Item (`fb-item`)

- Border: `1.5px dashed transparent` resting.
- Hover: dashed border becomes `color-mix(in srgb, primary 60%, transparent)`.
- **Selected** (`is-selected`): solid `1.5px solid var(--md-sys-color-primary)`
  + tint `color-mix(in srgb, primary 4%, transparent)` background.
  **No more `2px solid #0e7cfa` + `outline 1px solid #0e7cfa`.**
- Border-radius `var(--r-md)` (12px).
- **Hidden** (`is-hidden`): `opacity: 0.45` + status chip "Hidden".
- **Read-only** (`is-readonly`): hatched overlay (135deg repeating-linear-gradient
  of 4% on-surface) + amber status chip.

### Action toolbar — **floating pill** at top-right

Replace the current 4 stacked `mat-icon`s (inside `.c-actions`) with a
floating pill that:
- Position: `absolute; top: -14px; right: 8px;`
- Padding 2px, border-radius `var(--r-pill)`,
  bg `var(--md-sys-color-surface-container-lowest)`,
  border `1px solid var(--md-sys-color-outline-variant)`,
  box-shadow `var(--elev-2)`.
- Contains 4 × 24×24 icon buttons: readonly, duplicate, hide/show, delete.
- `opacity: 0; pointer-events: none` resting; `1` on item hover / selected.
- Subtle 2px vertical slide-in transition (`transform: translateY(-2px) → 0`).
- Delete button gets `.danger` modifier (error fg on hover + error-container bg).
- Read-only toggle button gets `.warning.on` modifier when active.

### Status chips (new) — append to `c-actions` neighbor

```
[ ↑-9px ]  ⏵  [ ⚡ visible when plan = "pro" ]    ← primary tint
            [ 🚫 Hidden ]                          ← neutral
            [ ✎̸  Read only ]                       ← amber
```

- Absolute, top:-9px, left:12px, 18px tall pill,
  10px medium label + 12px symbol prefix.
- Color presets:
  - `.readonly`: warning fg + warning-container bg
  - `.hidden`: on-surface-variant fg + surface-container-lowest bg
  - `.conditional` (any `*WhenExpression` set): primary fg + primary-container bg

### Resize handle

Replace the current `c-bar-resize-right` (8px outline solid blue rectangle) with
a **6px primary pill** + 2px white thumb in the middle:

```css
.fb-resize { position:absolute; top:8px; bottom:8px; right:-5px; width:6px;
  border-radius:999px; background:var(--md-sys-color-primary);
  opacity:0; cursor:col-resize; display:flex; align-items:center; justify-content:center; }
.fb-item:hover .fb-resize { opacity:1; }
.fb-resize::before { content:''; width:2px; height:18px; background:#fff; border-radius:999px; }
```

**Bonus** (optional in v1): while resizing, render a 12-col grid overlay
(`.fb-ruler`) at row level so the user can snap to columns precisely. Cells are
`color-mix(primary 6%, transparent)` with `1px dashed primary 30%`.

---

## Drag preview / drop hint

- Existing CDK rule: `.cdk-drag-dragging` keeps its content but with
  `transform: rotate(-1deg)`, `box-shadow: var(--elev-3)`,
  border `1.5px solid primary`, bg `surface-container-lowest`, cursor grabbing.
- Replace `.cdk-drop-list-receiving` insertion bar with a custom drop-hint
  `<div class="fb-drop-hint">` (36px tall, dashed primary border, 6% primary
  tint, primary text "Drop here" with `south` symbol).

---

## Empty state

When `dragDropRows.length === 0`, render this **inside `.components`**
(currently it's just blank):

```html
<div class="fb-empty">
  <div class="fb-empty__art"><span class="msi" style="font-size:44px">dashboard_customize</span></div>
  <div class="fb-empty__title">Drag components here to start</div>
  <div class="fb-empty__hint">
    Build your form by dragging fields from the left panel, or press
    <span class="fb-empty__kbd"><span class="msi" style="font-size:12px">keyboard</span>⌘ K</span>
    to search.
  </div>
</div>
```

Symmetric placeholder in the right panel when `!selectedComponent`:
"Select a component to edit its attributes." (centered, `ads_click` 32px on top).

---

## Attribute panel (right)

### Selection header (new)

When a component is selected, show above the section list:

```
┌──────────────────────────────────────┐
│ [T] Customer email                   │
│     customerEmail · textfield        │  ← mono 11px on-surface-variant
└──────────────────────────────────────┘
```

- Icon container: 28×28 square, radius 8px, primary-container bg, primary fg,
  uses the type's `symbol`.
- Type label uses `COMPONENT_ICONS[type].label` from the registry.

### Sections (`<sd-section>` already exists — restyle it)

- Title row 28px, padding 0 16px, font 12px medium, 16px symbol left, chevron
  right that rotates 90° when open.
- Body padding `4px 16px 12px`, gap 8px between fields.
- Border-bottom `1px solid outline-variant` separating sections — **no boxed
  cards**.

### Form fields inside attribute panel

- Field label: 11px medium `on-surface-variant`.
- Field input row (`.fb-field__input`): 28px tall, padding `0 10px`, radius 4px,
  bg `surface-container-lowest`, border `1px solid outline-variant`.
- Focused: border becomes primary + box-shadow ring
  `0 0 0 2px color-mix(in srgb, primary 24%, transparent)`.
- Switch: 34×18px pill, M3-style with sliding thumb. Off = outline border +
  surface-container-highest bg; on = primary bg + on-primary thumb.

### Expression input (`<attribute-expression>`)

Replace the plain input with a **FEEL-badged code line**:

```
┌────────────────────────────────────────────────┐
│ FEEL │ paymentMethod = "email"            ƒₓ │
└────────────────────────────────────────────────┘
```

- `FEEL` badge: left chunk, secondary-container bg, mono 10px medium.
- Code: mono 11px with light syntax highlight:
  - `var` (component keys, variables) → primary
  - `op` (=, !=, >, <, +, -, etc.) → error
  - `lit` (strings, numbers, booleans) → success
- `ƒₓ` button (`functions` symbol, 14px) on the right to open the existing
  `<expression-builder>` modal.
- Empty state: italicised "Empty" / "Add expression" in `on-surface-variant`.

---

## Composite components

### Table (artboard 9)

The `table-attribute.component.html` already imports `<attribute-table>` to
edit columns. Restyle it (and the inline column editor) so that:

- The **columns list** sits inside a `<sd-section title="Columns" icon="view_column">`.
- Each column row is a compact card (32px tall):
  ```
  ⠿  [icon]  Unit · select          ⋮
  ```
  - `drag_indicator` 14px (cdk-drag handle)
  - 24×24 type-icon container (primary-container bg)
  - Column label 12px medium + key + type in mono 10px on a second line
  - `more_vert` 14px for per-row menu
- Active column gets primary border + primary 10% tint.
- **Inline editor card** opens directly below the list (don't push to a modal),
  surface-container bg, radius 12px, 12px padding. Contents:
  - Editing header with type icon + column label + delete button
  - Column key, Column header (label), Type dropdown (with type icon prefix),
    Source key (if `values`/`radio` type), Required / Sortable / Filterable switches,
    Width (e.g. `0.6fr`).

Use this type → symbol mapping for column type icons:

| Column type | Symbol                    |
|-------------|---------------------------|
| `string`    | `text_fields`             |
| `number`    | `123`                     |
| `bool`      | `check_box`               |
| `date`      | `event`                   |
| `datetime`  | `calendar_month`          |
| `radio`     | `radio_button_checked`    |
| `values`    | `arrow_drop_down_circle`  |
| `image`     | `image`                   |
| `file`      | `attach_file`             |

### Group (artboard 10)

The `SdFormGenericGroup` already has `properties: { icon, color, ... }` and a
`components: SdFormGenericComponent[]` array. Render groups as
**outlined cards with a colored header bar**:

- Container: `var(--md-sys-color-surface-container-lowest)` bg, radius 14px,
  `is-selected` border style same as regular items.
- **Header bar**: padding 8px 12px, top-rounded 12px, bg = group's
  `color`-container token, fg = matching on-X-container token.
  - Group icon (the `properties.icon` Material Symbol)
  - Group label 13px medium
  - **Conditional chip** (if `visibleWhenExpression` is set):
    `bolt · visible when plan = "pro"` (mono 10px, color-mixed pill in the same hue)
  - Field count `{N} fields` right-aligned, 10px 75% opacity
- **Body**: padding 12px, flex-column gap 6px. **This is the drop target**
  for child fields (a nested `cdkDropList` bound to `group.components`).
- When a drag is hovering the body, show `.fb-drop-hint`
  "Drop a field here to add it to <strong>{label}</strong>".
- Hidden group: container `opacity: 0.55`.

5 color presets — map to existing `SdColor` values:

| Color preset | Header bg                          | Header fg                            |
|--------------|------------------------------------|--------------------------------------|
| `primary`    | `--md-sys-color-primary-container` | `--md-sys-color-primary`             |
| `secondary`  | `--md-sys-color-secondary-container`| `--md-sys-color-on-secondary-container` |
| `success`    | `--md-sys-color-success-container` | `--md-sys-color-success`             |
| `warning`    | `--md-sys-color-warning-container` | `--md-sys-color-warning`             |
| `error`      | `--md-sys-color-error-container`   | `--md-sys-color-error`               |

### Group attribute panel (right)

Add 3 sections to the existing group attribute (or create
`group-attribute.component.html`):

1. **General**: Label, Icon picker (input that shows current symbol + 6
   quick-pick buttons + dropdown to full symbol list), Accent color
   (5 round swatches, the selected one gets a 2px on-surface ring).
2. **Children**: compact list of `group.components` (drag-reorderable,
   each row = 22×22 type icon + label + key mono + `more_vert`),
   "+ Add field" link at the bottom.
3. **Display**: `Visible when` and `Hidden when` expression inputs.

---

## Preview mode

Replace the `play_circle/stop_circle` toggle with the **segmented Design / Preview**
button described in the header section.

When `isPreview === true`:
- Body padding → 32px, body bg → `surface-container-low`.
- Wrap the existing `<sd-form-render>` in a centered card (`max-width: 760px`,
  `surface-container-lowest` bg, radius 16px, padding 32px, `--elev-1`).
- Title chip "PREVIEW · RUNTIME" in primary, then a `<h2>` with the form title
  (use the form's `label` or "Untitled form" as a fallback).
- Footer row right-aligned: outlined `Cancel` + filled `Submit` (M3 buttons,
  40px tall, radius 20px).

---

## Interactions & behaviour (unchanged unless noted)

- All CDK Drag & Drop behaviour stays the same.
- `xuLyKeoCheo` (cross-row drag), `changeSizeControl` (resize), `addComponent`,
  `removeComponent`, `selectComponent`, `onClickedOutside`, `onChangeViewed`,
  `onChangeHidden`, `onDuplicate`, `viewJSON`, `configureVariables`,
  `openConfigureValidation`, `onValidate` — **no logic changes**.
- Hover states on `.fb-icon-btn` use the M3 state-layer convention
  (`color-mix(in srgb, on-surface 8%, transparent)`) — feel free to abstract
  into a `.state-layer` mixin.
- `*WhenExpression` change triggers the conditional status chip to appear on
  the canvas item (computed property — no new API).
- **No new state.** Everything is style.

---

## Files in the existing repo to edit

| File | Change |
|------|--------|
| `form-builder.component.html` | Restructure header toolbar (segmented toggle), palette (vertical list + search + groups), item action toolbar (floating pill), add status chips, add empty state. |
| `form-builder.component.scss` | Replace ~70% of the file with the `tokens.css` rules. Keep CDK-drag overrides under `::ng-deep`. |
| `form-builder.component.ts` | Add `paletteGroups` derived from `FormBuilderComponents` + a new `group` field. No new logic. |
| `models/form-generic-component.model.ts` | Add `symbol: string` and `group: 'basic'\|'choice'\|'advanced'\|'layout'` to `FormBuilderComponent`. Replace all 12 `icon` SVGs with `symbol` strings per the mapping above. Add `group` entry for the new layout-group component. |
| `components/textfield/attribute/*.html` (and all other `*-attribute.component.html`) | Update `<sd-section>` icons (`verified_user` → `verified`). No structural change. |
| `components/configure-validation/configure-validation.component.html` | Same Material Symbol upgrade. |
| `components/expression-builder/expression-builder.component.html` | Style trigger input with the FEEL-badge look (see Expression input). |
| `app/index.html` (consumer app) | Add Material Symbols Rounded variable font link. Consumer can keep their old `Material Icons` link or remove it once all `mat-icon`/`fontIcon=` usages are migrated. |

---

## Acceptance checklist

- [ ] All `mat-icon fontIcon="..."` in form-builder swapped for
      `<span class="msi">{symbol}</span>` (or wrapping component).
- [ ] No reference to `#0e7cfa`, `#5f6368`, `#ebebeb`, `#d3d3d3`, `#f6f8fc`,
      `#f6f8fc`, raw `mat-icon` `color: #5f6368 !important` in `.scss` anywhere.
- [ ] Palette is 220px wide, vertical list, categorized into 4 groups.
- [ ] Canvas item hover shows floating pill toolbar at `top:-14px`, **not**
      4 stacked icons inside the field.
- [ ] Hidden / Read-only / Conditional state chips appear at `top:-9px left:12px`.
- [ ] Selected item border is **solid 1.5px primary** (no double `outline`).
- [ ] Resize handle is the pill style, not a solid blue rectangle.
- [ ] Empty state renders when no components.
- [ ] Design/Preview segmented toggle replaces the `play_circle/stop_circle`
      single icon.
- [ ] Group component header shows `properties.color` tonal pair correctly for
      all 5 presets.
- [ ] Table column editor shows type icons in both header cells and the
      side-list rows.

---

## Assets

No external image assets. All icons come from Material Symbols Rounded (variable
font, served by Google Fonts). Roboto + Roboto Mono are also Google Fonts.

## Brand

The mockup uses **M3 baseline primary** (`#6750A4`). The real brand colour is
whatever `sd-angular/core` exposes as its primary token. Swap the 4 primary
tokens once at the top of `tokens.css` / `:root`.
