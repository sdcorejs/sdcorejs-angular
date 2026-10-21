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
| Component tokens | `--sd-{component}-{part}`, for example `--sd-table-header-bg`, `--sd-tooltip-bg`, `--sd-query-bar-bg`, `--sd-scrollbar-thumb` | One colour of one component. Tokens migrated in 3.0 keep the colour the component had in 2.15 as their light value; tokens added later (`--sd-view-label-color`, `--sd-view-value-color`, `--sd-sidebar-v4-*`) document their own. Each has a dark value. |
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
inputs the library draws itself.

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
  corner, a thin border and `--sd-shadow-md`. Options keep their 36px height and are inset 4px horizontally
  with a 6px corner; the selected option is `--sd-primary-dark` on `--sd-primary-light`, weight 500.

To keep the look of 3.1, set the tokens back at the root (or on any subtree):

```scss
:root {
  --sd-control-radius: 4px;
  --sd-control-border: var(--sd-border);
  --sd-control-ring: none;
}
```

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
