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
| Semantic roles | `--sd-status-{info,success,warning,error}-{bg,fg}`, `--sd-link`, `--sd-surface-inverse`, `--sd-text-on-solid`, `--sd-border-focus`, `--sd-border-danger`, `--sd-overlay-backdrop`, `--sd-focus-ring-color` | A role instead of a palette slot, so dark mode and custom palettes change the colour without touching the component. |
| Scales | `--sd-space-{0…48}`, `--sd-radius-{2…24, 999}`, `--sd-shadow-{xs,sm,md,lg,xl}`, `--sd-z-{sidebar,header,popover,drawer-mobile,floating,backdrop,drawer,dropdown,overlay,modal,devtools}`, `--sd-duration-{fast,base,slow}`, `--sd-ease-standard`, `--sd-font-size-{10…48}`, `--sd-font-weight-{regular,medium,semibold,bold}`, `--sd-line-height-{16…28}`, `--sd-focus-ring-width`, `--sd-focus-ring-offset` | Non-colour tokens. Each value equals a literal the library already used; names carry the pixel value (`--sd-radius-8` is `8px`). Same in light and dark. |
| Component tokens | `--sd-{component}-{part}`, for example `--sd-table-header-bg`, `--sd-tooltip-bg`, `--sd-query-bar-bg`, `--sd-scrollbar-thumb` | One colour of one component. Light values are the colours the component had in 2.15; each has a dark value. |

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

- **Dark exists only for the `default` preset.** The eight named presets (`ocean`, `indigo`, `teal`,
  `copper`, `slate`, `forest`, `plum`, `rose`) are light palettes: `sd.theme($preset: 'teal', $mode: 'dark')`
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

### Scopes

`sd.theme()` can be included on any selector; each scope re-declares every token, so a nested scope never
inherits values computed from its parent's palette. Overlays (dialogs, select panels) render under `body`:
theme the root, or give the overlay container the same scope.

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
