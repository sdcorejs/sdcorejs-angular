# Theme & tokens

Core UI colours, sizes and motion are CSS custom properties with the `--sd-` prefix. `sd.theme()` emits
them; components read them with `var(--sd-*)`. This page covers the token tiers, light/dark/auto modes,
custom palettes, the focus ring, contrast checks and the hex rules that keep components on tokens.
Utility classes, presets in detail and Material integration are in [STYLE-GUIDE §3 and §14](./STYLE-GUIDE.md).

## Quick start

```scss
// styles.scss — after sd-core.scss (already in angular.json for most apps)
@use '@sdcorejs/angular/assets/scss/themes/default' as sd;

html {
  @include sd.theme(); // light, default palette — the same values as 2.15
}
```

Dark mode for the default palette is built in: set `data-sd-theme="dark"` on `<html>` (the library never
writes this attribute). `data-sd-theme="light"` forces light inside a dark page.

```ts
document.documentElement.dataset['sdTheme'] = 'dark'; // or 'light'; delete it to return to the app default
```

Nothing changes for an app that does not opt in: the light output keeps every 2.15 declaration with the
same value, and only adds new custom properties.

## Tiers and names

| Tier | Names | What it is for |
| --- | --- | --- |
| Palette | `--sd-primary`, `--sd-primary-light`, `--sd-primary-dark`, `--sd-primary-contrast`, the same four for `secondary`, `info`, `success`, `warning`, `error`, then `--sd-surface`, `--sd-surface-muted`, `--sd-text`, `--sd-text-secondary`, `--sd-text-muted`, `--sd-border`, `--sd-border-strong`, `--sd-disabled-bg`, `--sd-disabled-text` | The 33 public colours of 2.15, unchanged. Presets and `$theme` set them. |
| Ramps | `--sd-{family}-{step}` — families `primary`, `secondary`, `info`, `success`, `warning`, `error`, `neutral`; steps `50 100 200 300 400 500 600 700 800 900 950` | Tints and shades of each family (`color-mix()`), `500` is the base colour. For charts, badges and subtle backgrounds. |
| Semantic roles | `--sd-status-{info,success,warning,error}-{bg,fg}`, `--sd-link`, `--sd-surface-inverse`, `--sd-text-on-solid`, `--sd-border-focus`, `--sd-border-danger`, `--sd-overlay-backdrop`, `--sd-focus-ring-color`, `--sd-control-{border,border-hover,border-focus,border-disabled,ring,ring-error,bg-disabled}` | A role instead of a palette slot, so dark mode and custom palettes change the colour without touching the component. The `--sd-control-*` roles style every box control; see [Control tokens](#control-tokens). |
| Scales | `--sd-space-{0…48}`, `--sd-radius-{2…24, 999}`, `--sd-shadow-{xs,sm,md,lg,xl}`, `--sd-z-{sidebar,header,popover,drawer-mobile,floating,backdrop,drawer,dropdown,overlay,modal,devtools}`, `--sd-duration-{fast,base,slow}`, `--sd-ease-standard`, `--sd-font-size-{10…48}`, `--sd-font-weight-{regular,medium,semibold,bold}`, `--sd-line-height-{16…28}`, `--sd-focus-ring-width`, `--sd-focus-ring-offset`, `--sd-control-height-{sm,md,lg,coarse}`, `--sd-control-radius`, `--sd-panel-radius` | Non-colour tokens. Each value equals a literal the library already used; names carry the pixel value (`--sd-radius-8` is `8px`). Same in light and dark. The control heights are named by size instead: `sm` / `md` / `lg` are 32 / 40 / 48px, the heights of `sd-button` and of the outlined `mat-form-field` at the same size, and `coarse` is 44px, the minimum height of a control under `@media (pointer: coarse)`. `--sd-control-radius` (8px) is the corner of every box control and `--sd-panel-radius` (10px) the corner of the panels they open. |
| Component tokens | `--sd-{component}-{part}`, for example `--sd-table-header-bg`, `--sd-tooltip-bg`, `--sd-query-bar-bg`, `--sd-scrollbar-thumb` | One colour of one component. Tokens migrated in 3.0 keep the colour the component had in 2.15 as their light value; tokens added later (`--sd-view-label-color`, `--sd-view-value-color`, `--sd-sidebar-v4-*`) document their own. Each has a dark value. Tokens derived from the palette (`--sd-view-*`, `--sd-sidebar-v4-*` and most `--sd-table-*`, see [Table tokens](#table-tokens)) hold one `var()` / `color-mix()` expression for both modes. |
| Material tokens | Angular Material component tokens of the form field (outline, label, caret, select arrow), options, checkboxes, radios, pseudo-checkboxes and datepicker, under both the Material 19 names (`--mdc-outlined-text-field-*`, `--mat-full-pseudo-checkbox-*`, …) and the Material 20+ names (`--mat-form-field-outlined-*`, `--mat-pseudo-checkbox-full-*`, …) | Each one points at a Core token (`assets/scss/themes/_material-tokens.scss`): focus and selection use `--sd-primary`, the outline takes its corner and its rest / hover / disabled colours from the control tokens (`--sd-control-radius`, `--sd-control-border`, …), the calendar takes `--sd-panel-radius`, an unchecked checkbox, radio or pseudo-checkbox has a `--sd-border-strong` border (`--sd-text-secondary` on hover and focus), and an error reddens only the outline (`--sd-error`); the floating label keeps the colour of a valid field. Override a Material token on any element to change it for that subtree. |

Rules for new code:

- Use a semantic role or a palette token first, a ramp step for a shade, and a component token only for a
  colour that belongs to one component.
- A component token is declared only in `assets/scss/themes/_component-tokens.scss`. A component's
  `:host` may alias it to a local name, never give it a new value.
- Replace a literal with a scale token only when the value is exactly equal (`8px` → `var(--sd-radius-8)`);
  `7px` stays `7px`.

Every library reference to a token added in 3.0 carries its 2.15 value as a fallback —
`var(--sd-table-bg, #ffffff)`, `var(--sd-radius-8, 8px)` — so a page that declares only the 2.15 palette
without `sd.theme()` still renders as before.

## Modes

```scss
@mixin theme($theme: (), $source: 'core', $preset: 'default', $mode: 'light');
```

| `$mode` | Output |
| --- | --- |
| `'light'` (default) | The 2.15 declarations, unchanged, plus the ramp, semantic, scale and component tiers. |
| `'dark'` | The full set with the dark palette, `color-scheme: dark`, and Material's dark colour tokens. |
| `'auto'` | Light on the selector; the dark set under `@media (prefers-color-scheme: dark)`, unless the element has `data-sd-theme="light"`. |

- **Dark exists only for the `default` preset.** The nine named presets (`ocean`, `indigo`, `teal`,
  `copper`, `slate`, `forest`, `plum`, `rose`, `graphite`) are light palettes: `sd.theme($preset: 'teal', $mode: 'dark')`
  (or `'auto'`) stops the Sass build with an error that points to the `$theme` route below.
- `sd-core.scss` already contains `[data-sd-theme=dark] { @include sd.theme($mode: 'dark'); }` and a matching
  light block, for the default palette from the core source.
- In dark, `-light` variants mix the colour with the dark surface and `-dark` variants mix it toward white,
  so "tinted background" and "strong text" keep their meaning.
- Material: dark mode adds only Material's colour tokens (`theme-type: dark`). Typography and density stay
  with your `mat.theme()` configuration.
- Always-dark components (code editor, the default image/PDF preview shells) keep their dark look in both
  modes; they have their own component tokens.

### Your own colours, in light and dark

Pass your colours through `$theme` on the default preset, once per mode:

```scss
html {
  @include sd.theme((primary: #00696b, primary-light: #e0f2f1, primary-dark: #004f51));
}

html[data-sd-theme='dark'] {
  @include sd.theme((primary: #4cdadb, primary-contrast: #003738), $mode: 'dark');
}
```

Unlisted tokens keep the default light or dark values. `$mode: 'auto'` applies one `$theme` map to both
schemes; with different light and dark overrides, follow the operating system yourself:

```scss
html { @include sd.theme((primary: #00696b, primary-light: #e0f2f1, primary-dark: #004f51)); }

@media (prefers-color-scheme: dark) {
  html:not([data-sd-theme='light']) { @include sd.theme((primary: #4cdadb, primary-contrast: #003738), $mode: 'dark'); }
}
```

An app that uses `$source: 'material'` includes `sd.theme($source: 'material', $mode: 'dark')` under its own
dark selector.

### Your own preset

A preset is only a map of palette tokens. Keep your brand map in your app and pass it as `$theme`:

```scss
$brand: (primary: #6b4414, primary-light: #f4f2f1, primary-dark: #4a2f0e, surface-muted: #f7f5f2);
$brand-dark: (primary: #f0b98a, primary-contrast: #3d2200);

html { @include sd.theme($brand); }
html[data-sd-theme='dark'] { @include sd.theme($brand-dark, $mode: 'dark'); }
```

Set `primary-light` and `primary-dark` whenever you set `primary`: overriding the base does not recompute
explicit variants.

### Named presets and their `components` map

The nine named presets and their values are listed in [STYLE-GUIDE §14.1](./STYLE-GUIDE.md). `graphite` is a
near-black palette for back-office consoles: `primary` and `text` are both `#16181d`, `primary-contrast`
stays white, and the semantic families (info, success, warning, error) keep the default values.

A named preset may also carry an optional `components` map that replaces component tokens for that preset
only:

- Keys are token names from `$component-tokens` (`assets/scss/themes/_component-tokens.scss`) without the
  `--sd-` prefix. An unknown key stops the Sass build with the list of valid keys.
- Values are single values, emitted as-is, because named presets are light-only. A comma-separated
  `box-shadow` list stays whole.
- `sd.theme()` takes the map out before it merges the palette, so every preset emits the same set of
  `--sd-*` names.

`$presets` belongs to the library, so `components` is not an app-level option and `$theme` does not accept
it. An app that needs a different component colour overrides that custom property in its own stylesheet.

`graphite` uses the map to turn the active Sidebar V4 item into a raised surface:

```scss
components: (
  sidebar-v4-active-bg: var(--sd-surface),
  sidebar-v4-active-shadow: (0 0 0 1px var(--sd-border), 0 1px 2px rgba(20, 22, 28, 0.06)),
),
```

`copper` and `teal` use it for contrast. Their `primary` is too light to reach 4.5:1 on its own tint, so the
Sidebar V4 text that sits on a tint uses `primary-dark` instead: the active item label and the avatar
initials in `copper`, the avatar initials in `teal`.

```scss
// copper
components: (
  sidebar-v4-active-ink: var(--sd-primary-dark),
  sidebar-v4-avatar-ink: var(--sd-primary-dark),
),
// teal
components: (
  sidebar-v4-avatar-ink: var(--sd-primary-dark),
),
```

### Links and text buttons under `graphite`

`--sd-link` is `var(--sd-primary)`. It is a semantic role, not a palette key, so a preset cannot change it,
and only the `upload-file` name reads it; most links and text buttons read `--sd-primary` directly. With
`graphite`, `--sd-primary` is the body text colour, so these elements share the colour of body text:

- links: global `a` (it still underlines on hover), links in editor content, the `upload-file` name, the
  API contract builder breadcrumb, the `inform` "show more" button;
- text buttons: `sd-button` with `type="text"` and `outline`, the `operator`, `preview-video` and
  `job-progress` actions, `image-editor` text buttons, and the form builder add/edit links;
- active labels: `tab-group`, `anchor-nav`, the current `stepper` step, the shared menu tree of sidebar
  V2/V3 and their mobile variants, and sidebar V1 without `brandColor`;
- values and tokens: `query-bar`, `query-builder`, the `inline-text` form control, the form builder value
  and expression boxes, the `import-excel` issue counts and the API contract builder field types.

No separate link token ships yet. Choose another preset when links and text buttons must stand out by
colour.

### Sidebar V4 tokens

| Token | Value (light and dark) |
| --- | --- |
| `--sd-sidebar-v4-bg` | `color-mix(in srgb, var(--sd-text) 4%, var(--sd-surface))` |
| `--sd-sidebar-v4-line` | `color-mix(in srgb, var(--sd-border) 45%, var(--sd-surface))` |
| `--sd-sidebar-v4-hover-bg` | `color-mix(in srgb, var(--sd-text) 6%, var(--sd-sidebar-v4-bg))` |
| `--sd-sidebar-v4-active-bg` | `var(--sd-primary-light)`; `graphite`: `var(--sd-surface)` |
| `--sd-sidebar-v4-active-shadow` | `none`; `graphite`: the ring and shadow above |
| `--sd-sidebar-v4-active-ink` | `var(--sd-primary)`; `copper`: `var(--sd-primary-dark)` |
| `--sd-sidebar-v4-avatar-bg` | `color-mix(in srgb, var(--sd-primary) 14%, var(--sd-surface))` |
| `--sd-sidebar-v4-avatar-ink` | `var(--sd-primary)`; `copper`, `teal`: `var(--sd-primary-dark)` |
| `--sd-sidebar-v4-attention` | `var(--sd-warning)` |
| `--sd-sidebar-v4-live` | `var(--sd-success)` |

Each value derives from the palette of its own scope, so one expression serves light, dark and every preset.
Sizes are not theme tokens: `--sd-sidebar-v4-width`, `-rail-width`, `-item-height`, `-child-height` and
`-item-radius` are declared on the sidebar host and follow `density`, `itemShape` and the pointer type (see
`modules/layout/sd-layout.md`).

The values resolve where `sd.theme()` emits them. Overriding `--sd-sidebar-v4-bg` lower in the tree
recolours the drawer but does not move `--sd-sidebar-v4-hover-bg`, which was already computed from the
background of the theme scope; override `--sd-sidebar-v4-hover-bg` on the same element as well.

### Scopes

`sd.theme()` can be included on any selector; each scope re-declares every token, so a nested scope never
inherits values computed from its parent's palette. Overlays (dialogs, select panels) render under `body`:
theme the root, or give the overlay container the same scope.

## Control tokens

Every box control shares one set of tokens: the outlined `mat-form-field` (`sd-input`, `sd-input-number`,
`sd-textarea`, `sd-select`, `sd-autocomplete`, `sd-date`, `sd-datetime`, `sd-date-range`, `sd-time`, the
box of `sd-input-color`), the filter input in the `sd-select` panel, `sd-entity-picker` and the other
inputs the library draws itself. The search boxes of `sd-kanban`, the `sd-table` quick search, the form
builder palette and the `sd-select` panel share one internal search field that reads these tokens (see
`forms/directives/sd-form-directives.md`, "Internal (ɵ)"); a disabled search field keeps the
`--sd-surface-muted` background of its design instead of `--sd-control-bg-disabled`.

| State | Token | Value |
| --- | --- | --- |
| Corner | `--sd-control-radius` | `8px` |
| Rest outline | `--sd-control-border` | `color-mix(in srgb, var(--sd-border-strong) 82%, var(--sd-surface))`, at least 3:1 on `surface` |
| Hover outline | `--sd-control-border-hover` | `var(--sd-border-strong)` |
| Focus outline | `--sd-control-border-focus` | `var(--sd-border-focus)` |
| Focus ring | `--sd-control-ring` | `0 0 0 3px color-mix(in srgb, var(--sd-focus-ring-color) 20%, transparent)` |
| Focus ring of an invalid control | `--sd-control-ring-error` | `0 0 0 3px color-mix(in srgb, var(--sd-error) 18%, transparent)` |
| Disabled outline | `--sd-control-border-disabled` | `var(--sd-border)` |
| Disabled background | `--sd-control-bg-disabled` | `var(--sd-disabled-bg)` |

- The outline is 1px at rest and on focus; focus adds the ring as a `box-shadow` outside the box. Under
  `forced-colors: active` the ring becomes a 2px `Highlight` outline, since a box-shadow does not show.
- A focused floating label gets the background `var(--sd-control-label-bg, var(--sd-surface))` so it cuts the
  ring at the notch. A container whose background is not `--sd-surface` sets `--sd-control-label-bg` (the
  column filters and the quick search of `sd-table` set it to `--sd-table-bg`).
- The select, autocomplete, `sd-operator` menu and calendar panels take `--sd-panel-radius` (10px) on every
  corner, a thin border and `--sd-shadow-md`. The select and autocomplete panels open 6px from the field, use
  `--sd-select-panel-bg` and have 4px of vertical padding. Options keep their 36px height and are inset 4px horizontally
  with a 6px corner, with a 2px gap between neighbouring backgrounds (a transparent 1px border inside the 36px); the
  selected option is `--sd-primary-dark` on `--sd-primary-light`, weight 500.

To keep the look of 3.1, set the tokens back at the root (or on any subtree):

```scss
:root {
  --sd-control-radius: 4px;
  --sd-control-border: var(--sd-border);
  --sd-control-ring: none;
}
```

## Table tokens

The colours of `sd-table` derive from the palette and are mixed with `--sd-table-bg` (not `--sd-surface`), with the
same expression in light and dark, so presets, dark mode and a custom palette change them without new values.

| Token | Value |
| --- | --- |
| `--sd-table-header-bg` | `color-mix(in srgb, var(--sd-surface-muted) 50%, var(--sd-table-bg))` |
| `--sd-table-header-text` | `var(--sd-text)` |
| `--sd-table-group-header-mix` | `var(--sd-table-header-bg)` |
| `--sd-table-row-divider` | `color-mix(in srgb, var(--sd-border) 45%, var(--sd-table-bg))` |
| `--sd-table-row-hover-bg` | `color-mix(in srgb, var(--sd-text) 4%, var(--sd-table-bg))` |
| `--sd-table-row-selected-bg` | `color-mix(in srgb, var(--sd-primary) 9%, var(--sd-table-bg))` |
| `--sd-table-row-activated-bg` | `color-mix(in srgb, var(--sd-primary) 14%, var(--sd-table-bg))` |
| `--sd-table-group-row-bg` | `color-mix(in srgb, var(--sd-primary) 4%, var(--sd-table-bg))` |
| `--sd-table-group-row-border` | `var(--sd-table-row-divider)` |
| `--sd-table-select-arrow` | `var(--sd-text-secondary)` |
| `--sd-table-spinner` | `var(--sd-primary)` |
| `--sd-table-skeleton-bg` | `color-mix(in srgb, var(--sd-text) 8%, var(--sd-table-bg))` |
| `--sd-table-skeleton-highlight` | `color-mix(in srgb, var(--sd-text) 3%, var(--sd-table-bg))` |
| `--sd-table-progress-track` | `color-mix(in srgb, var(--sd-primary) 18%, var(--sd-table-bg))` |

`--sd-table-bg` (`#ffffff` / `#1d1f23`), the tree level backgrounds and the export panel keep their values.
The loading layer draws skeleton bars in `--sd-table-skeleton-bg` with a `--sd-table-skeleton-highlight` sweep,
and the 2px progress bar as a `--sd-table-spinner` streak on `--sd-table-progress-track`. The skeleton is
decorative (`aria-hidden`), so it has no contrast minimum; with `forced-colors: active` the bars use `GrayText`
and the progress bar `Canvas`, `CanvasText` and `Highlight`.
The sort arrows are a mask tinted `--sd-text-secondary` (`--sd-text` on the sorted column); the drag preview,
the reorder handle, the resize and tree-toggle hovers and the add button shadow use `--sd-table-bg`,
`--sd-table-row-divider`, `--sd-text-muted`, `color-mix(in srgb, var(--sd-text) 8%, transparent)` and the shadow
scale. `npm run test:theme` checks header text on the header band and text on a selected or activated row
(at least 4.5:1) for every preset and dark.

## Kanban tokens

`sd-kanban` lanes are neutral and its drop target and card outline derive from the palette, with one expression for
light and dark. The column colour only marks the 8px dot or the prefix icon.

| Token | Value |
| --- | --- |
| `--sd-kanban-lane-bg` | `color-mix(in srgb, var(--sd-text) 4%, var(--sd-surface))` |
| `--sd-kanban-lane-target-bg` | `color-mix(in srgb, var(--sd-primary) 6%, var(--sd-surface))` |
| `--sd-kanban-lane-target-border` | `color-mix(in srgb, var(--sd-primary) 45%, var(--sd-surface))` |
| `--sd-kanban-drop-slot-border` | `color-mix(in srgb, var(--sd-primary) 55%, var(--sd-surface))` |
| `--sd-kanban-card-border` | `color-mix(in srgb, var(--sd-border) 80%, var(--sd-surface))` |
| `--sd-kanban-card-hover-border` | `color-mix(in srgb, var(--sd-border-strong) 70%, var(--sd-surface))` |

`npm run test:theme` checks `--sd-text` and `--sd-text-secondary` on the lane (at least 4.5:1) for every preset and dark.

## Tab router tokens

The `sd-tab-router` bar derives from the palette, with one expression for light and dark (design handoff wave 3).

| Token | Value |
| --- | --- |
| `--sd-tab-router-nav-bg` | `color-mix(in srgb, var(--sd-surface-muted) 60%, var(--sd-surface))` |
| `--sd-tab-router-item-hover-bg` | `color-mix(in srgb, var(--sd-text) 6%, var(--sd-tab-router-nav-bg))` |
| `--sd-tab-router-item-active-bg` | `var(--sd-surface)` — the open tab joins the content below it |
| `--sd-tab-router-item-text` | `var(--sd-text-secondary)` — tabs that are not open; the open tab uses `--sd-text` |
| `--sd-tab-router-item-divider` | `color-mix(in srgb, var(--sd-border) 70%, var(--sd-tab-router-nav-bg))` |

Deprecated, no longer read by the bar and removed in a later release: `--sd-tab-router-item-muted-bg` (now an alias of
`--sd-tab-router-nav-bg`). `--sd-tab-router-badge-bg` (deprecated in 3.2) is removed: it filled the icon of the old tab, which had
not been rendered since the tabs moved to `sd-badge`.

`npm run test:theme` checks `--sd-tab-router-item-text` on the bar and on a hovered tab, and `--sd-text` on the open
tab (at least 4.5:1) for every preset and dark.

## Badge size tokens

`sd-badge` reads three size tokens with a fallback; they are not part of `sd.theme()` and have no dark value. Set them
on any ancestor (`:root`, a page, a table). See `components/badge/sd-badge.md`, "Size tokens".

| Token | Default |
| --- | --- |
| `--sd-badge-height-sm`, `--sd-badge-height-md`, `--sd-badge-height-lg` | `20px`, `24px`, `28px` |
| `--sd-badge-radius-tag` | `4px` (`md`, `lg` and a tag with a description add 2px) |
| `--sd-badge-font-weight` | `500` |

Badge colours stay on the palette: `*-light` backgrounds, `*-dark` text and icons, the base colour for the dot and
for `solid` (with `*-contrast` text), `--sd-secondary-light` / `--sd-secondary-dark` for the label of `pair`, and
`color-mix(in srgb, *-dark 22%, *-light)` for the tag border.

## Avatar status ring token

`--sd-avatar-status-ring` (`var(--sd-surface)` in light and dark) is the ring around the `sd-avatar` status dot that
separates it from the avatar. Set it to the background behind the avatar when that is not `--sd-surface` (a dark
header, a selected row).

## Button indicator token

`--sd-button-indicator-ring` (`var(--sd-surface)` in light and dark) is the 2px ring that separates the `sd-button`
indicator from the button. Set it to the background behind the button when that is not `--sd-surface`.

## Chip tokens

`sd-chip` and `sd-chip-calendar` draw their chips with one mixin, `sd-chip-row()` in `core/form.scss`: a 20 / 24 / 28px chip
centred in a 32 / 40 / 48px field, 6px radius (`--sd-radius-6`), 1px `--sd-border` outline, `--sd-surface` background and
`--sd-text` text. Three colours derive from the palette, one expression for light and dark:

- `--sd-chip-locked-bg`: the background of a chip that `removable` keeps (55% `--sd-surface-muted` on `--sd-surface`). The chip
  shows a lock icon in place of the remove button.
- `--sd-chip-more-hover-bg`: the hover background of the “+N” button (6% `--sd-text` on `--sd-surface-muted`, its rest
  background).
- `--sd-chip-duplicate-bg`: the background of the `sd-chip` chip that a typed value duplicates, for 1.4 seconds (16%
  `--sd-warning` on `--sd-surface` in light, 24% in dark). Its outline uses `--sd-warning` directly.

Under `prefers-reduced-motion: reduce` the colours change without a transition. `--sd-chip-bg` stays the hover background of the
`sdViewDef` face.

## Chip calendar tokens

`--sd-chip-calendar-panel-width` (`296px` in light and dark) is the width of the `sd-chip-calendar` popup: 8px padding,
seven 40px day columns, 8px padding. It is a size, the one non-colour entry of the component tier. The popup itself uses the
panel surface of the select panel (`--sd-select-panel-bg`, `--sd-panel-radius`, `--sd-shadow-md`), and `--sd-chip-calendar-bg`
stays the hover background of the `sdViewDef` face.

The chips of the field use the shared chip look above. Two colours keep their own names, so an app that set them keeps its
values; by default they point at the shared tokens:

- `--sd-chip-calendar-chip-locked-bg`: `var(--sd-chip-locked-bg)`, the background of a chip that `removable` keeps.
- `--sd-chip-calendar-more-hover-bg`: `var(--sd-chip-more-hover-bg)`, the hover background of the “+N” button.

## Upload file tokens

`sd-upload-file` (design handoff wave 3 · 4b–4d). Field colours come from the palette (`--sd-primary`, `--sd-border-strong`,
`--sd-status-error-*`, `--sd-surface-muted`); two roles have their own token, one expression for light and dark:

| Token | Value | Role |
| --- | --- | --- |
| `--sd-upload-file-scrim` | black 24% | Scrim over an image tile on hover or focus |
| `--sd-upload-file-empty-text` | `--sd-text` 70% on `--sd-surface` | “Chưa có tệp” of the inline variant (4.5:1 in every preset; `--sd-text-muted` is not) |

The preview popup is dark in light and dark mode. Its background and text are fixed; the other roles mix from them, and the
accent, the text on it and the error colour come from the palette ramps:

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--sd-upload-file-viewer-bg` | `#141518` | `#141518` | Viewer background |
| `--sd-upload-file-viewer-fg` | `#e3e3e8` | `#e3e3e8` | File name, icon buttons |
| `--sd-upload-file-viewer-fg-muted` | fg 70% on bg | same | Size, position, filmstrip icons |
| `--sd-upload-file-viewer-divider` | fg 8% | same | Lines under the top bar and above the filmstrip |
| `--sd-upload-file-viewer-control-bg` | fg 10% | same | Hover of icon buttons, previous / next buttons |
| `--sd-upload-file-viewer-thumb-bg` | fg 10% on bg | same | Filmstrip tile of a document |
| `--sd-upload-file-viewer-accent` | `--sd-primary-200` | `--sd-primary` | File-type icon, focus ring, text buttons, current filmstrip tile |
| `--sd-upload-file-viewer-on-accent` | `--sd-primary-900` | `--sd-primary-contrast` | Text of the filled “Tải xuống” button |
| `--sd-upload-file-viewer-error` | `--sd-error-200` | `--sd-error` | Icon of the error state |
| `--sd-upload-file-viewer-ext-pdf` / `-word` / `-excel` | `--sd-error-300` / `--sd-primary-300` / `--sd-success-300` | same | Extension label of a filmstrip tile |

Contrast pairs are in `scripts/theme-contrast.test.mjs`. `--sd-upload-file-overlay-fg` (“+N” over the last visible
image) keeps its value.

## Focus ring

- Colour: `var(--sd-focus-ring-color)` (the primary colour). Width and offset: `--sd-focus-ring-width` and
  `--sd-focus-ring-offset` (both `2px`).
- A component that already had a colour hook keeps it first: `var(--sd-tab-label-active-color, var(--sd-focus-ring-color))`.
- On an always-dark surface the ring uses that component's focus token (for example
  `--sd-preview-pdf-focus-ring`), so it stays visible.
- Focus rules never contain a hex colour, not even as a fallback. `currentColor` is allowed.

## Contrast

`npm run test:theme` (repository root) compiles the themes and checks these pairs for the default palette,
every named preset and the dark palette:

| Foreground | Background | Minimum |
| --- | --- | --- |
| `text`, `text-secondary` | `surface`, `surface-muted` | 4.5 |
| `link` | `surface` | 4.5 |
| `primary-contrast` | `primary` | 4.5 |
| `*-contrast` (secondary, info, success, warning, error) | the base colour (badge `solid`) | 4.5 |
| `*-dark` (all six colours) | `*-light` (badge `round`, `tag`, `pair`) | 4.5 |
| `status-*-fg` | `status-*-bg` | 4.5 |
| `border-strong`, `focus-ring-color` | `surface`, `surface-muted` | 3 |
| `control-border` | `surface` | 3 |

These are palette checks. Recheck real component states after changing colours, and keep labels or icons
for status information.

## Keeping components on tokens

Two checks run in CI:

- `npm run check:scss-hex` — library SCSS and TS: no raw hex colour, and every `:focus` / `:focus-visible` /
  `:focus-within` outline uses the focus-ring token (or a hook falling back to it, a component focus token,
  or `currentColor`). `--report --literals` also lists literals equal to a scale token.
- ESLint (`npm run lint` in `versions/v19`) — the same hex rule for TypeScript and templates.

Allowed: a hex inside a `var()` fallback (`var(--sd-card-border, #e6e6e6)`), the theme partials in
`assets/scss/themes/`, specs, `*.generated.ts`, the colour values of `sd-input-color`, and the static
Keycloak error page (served outside the app, without the theme).

## From TypeScript

`@sdcorejs/angular/utilities/theme` exports `readSdTokens()`, `SdColorToken` and `SD_COLOR_TOKENS` for code
that needs concrete colours (charts, canvas). See `utilities/theme/theme.md`.
