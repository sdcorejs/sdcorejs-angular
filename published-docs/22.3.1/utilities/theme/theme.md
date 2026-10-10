# Utilities — Theme tokens

**Import path**: `@sdcorejs/angular/utilities/theme` (also re-exported by `@sdcorejs/angular/utilities`)

Typed access to the Core UI colour tokens from TypeScript — for charts, canvas drawing, exporting
colours, or anything that cannot use `var(--sd-*)` directly. The tokens themselves come from the Sass
theme (`@include sd.theme(...)`); see `assets/THEME.md` for tiers, dark mode and customisation.

| Name | Kind | Purpose |
| --- | --- | --- |
| `SD_COLOR_TOKENS` | `readonly` tuple | Every public colour token name, without the `--sd-` prefix: the 33-token palette of 2.15, the `50`–`950` ramps of `primary`, `secondary`, `info`, `success`, `warning`, `error`, `neutral`, and the semantic roles (`status-*-bg/fg`, `link`, `surface-inverse`, `text-on-solid`, `border-focus`, `border-danger`, `overlay-backdrop`, `focus-ring-color`). |
| `SdColorToken` | type | Union of the names in `SD_COLOR_TOKENS`. |
| `readSdTokens` | `(element?, tokens?) => Partial<Record<SdColorToken, string>>` | Reads the computed values from `element` (default `<html>`). |

## `readSdTokens`

```ts
import { readSdTokens } from '@sdcorejs/angular/utilities/theme';

const { primary, 'status-error-fg': errorText } = readSdTokens();
chart.setColors([primary!, errorText!]);

// Values inside a scope (a dark region, a customer theme) — pass an element inside it:
const dialogTokens = readSdTokens(dialogElement, ['surface', 'text']);
```

- Values are the computed custom-property text with every `var()` already substituted by the
  browser: `'#005cbb'` for a palette colour, `'color-mix(in srgb, #005cbb 14%, white)'` for a derived
  one. Assign a derived value to a CSS colour property when you need a concrete colour.
- Only tokens that have a value on the element are returned — nothing when the theme is not included.
- Returns `{}` without a `document`/`window` (server rendering) or for an element of a document that is
  not displayed (for example one created by `DOMParser`).
- Read again after toggling `data-sd-theme` — values are not cached.

## Keeping the list in sync

`scripts/theme-token-list.test.mjs` compiles `sd.theme()` (light and dark) and fails when
`SD_COLOR_TOKENS` and the emitted colour tokens differ. Component tokens (`--sd-{component}-{role}`)
and the non-colour scales (space, radius, shadow, z-index, motion, typography) are intentionally not
part of the list.
