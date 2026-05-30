# `<sd-input-color>`

**Type**: Form control (composes `<sd-input>`)
**Selector**: `sd-input-color`
**Import path**: `@sdcorejs/angular/forms/input-color`
**Class**: `SdInputColor`
**Standalone**: yes
**Change detection**: OnPush

## One-line purpose
A hex color input with a swatch suffix that opens the browser's native color picker. Users can type a hex value manually or pick visually â€” both update the same model.

## When to use
- Theme / brand color settings (logo color, accent color, badge color)
- Tagging entities with a color (project tags, calendar events, custom labels)
- Wherever a `#RRGGBB` field would otherwise be a plain text input

## When NOT to use
- Free-form color names ("red", "navy") â€” use `<sd-select>` with a curated palette
- Multi-stop gradient editor â€” beyond scope; use a dedicated picker library
- Theme picker with curated brand palette only â€” `<sd-select>` + a `[color]` input renders previewable swatches cleanly without exposing arbitrary hex

## Inputs (forwarded to inner `<sd-input>` unless noted)
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `string \| undefined` | â€” | Label above / inside the field |
| `helperText` | `string \| undefined` | â€” | Tooltip text on the label info icon |
| `placeholder` | `string` | `'#RRGGBB'` | Input placeholder |
| `size` | `'sm' \| 'md'` | `'md'` | Forwarded |
| `appearance` | `MatFormFieldAppearance \| undefined` | inherits | Forwarded |
| `form` | `FormGroup \| NgForm \| undefined` | â€” | When set, the inner control registers under `name` |
| `name` | `string \| undefined` | â€” | FormGroup control name |
| `autoId` | `string \| undefined` | â€” | E2E selector |
| `required` | `boolean` | `false` | Required validator |
| `disabled` | `boolean` | `false` | Disable input + swatch |
| `readonly` | `boolean` | `false` | Read-only input + swatch click disabled |
| `viewed` | `boolean` | `false` | Read-only display mode (no input field) |
| `model` | `string \| null \| undefined` (model â€” two-way) | `undefined` | Hex value `#RGB` / `#RRGGBB` / `#RRGGBBAA` |

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `sdChange` | `string \| null \| undefined` | Emitted on every value change (typed input + picker) |

## Public constant
| Name | Type | Notes |
| --- | --- | --- |
| `SD_INPUT_COLOR_HEX_PATTERN` | `string` | The regex used for validation. Exported in case consumers want to apply the same hex check elsewhere. |

## Public methods
| Name | Signature | Notes |
| --- | --- | --- |
| `openPicker()` | `() => void` | Opens the native browser color picker. No-op when disabled / readonly / viewed. |
| `clear(ev?: Event)` | `(Event?) => void` | Programmatic clear â€” sets the model to `null` and emits `sdChange(null)`. No-op when not clearable (required, disabled, readonly, viewed, or already empty). The **visible** clear button is rendered by the inner `<sd-input>` (built-in), not by this method. |

## Behaviors / quirks
- **Two-way `[(model)]`** â€” picker and text input both write to the same `model` signal.
- **Hex pattern validation** â€” built in. Accepts `#RGB`, `#RRGGBB`, `#RRGGBBAA`. Invalid input shows the inline error message "MÃ£ mÃ u HEX khÃ´ng há»£p lá»‡ (vd #1565C0)".
- **Picker canonicalization** â€” `<input type="color">` only accepts `#RRGGBB`. The component expands `#RGB` and strips alpha from `#RRGGBBAA` before feeding the picker, so the picker always opens on a valid 6-char hex.
- **Swatch preview** â€” shows the raw model value (including alpha). When the value is empty or invalid, the swatch falls back to a small checkerboard pattern (CSS-generated) so empty state is visually distinct from a white color.
- **Click swatch â†’ open picker** â€” the swatch button programmatically triggers `.click()` on a hidden `<input type="color">`. Browser shows its native picker dialog. The swatch is a clean colored square (no overlay icon) so the chosen color reads at a glance.
- **Clear button** â€” rendered by the inner `<sd-input>` (shared `.sd-clear-btn`, thin `close` icon), shown to the left of the swatch when the field has a value AND is editable AND not `required`. It is **hover-gated** (only visible on hover/focus). Click clears the model to `null` and emits `sdChange(null)` (the inner input emits `null`/`''` â†’ `onInputChange` normalizes to `null`; `undefined` stays only for the pristine never-touched state). The clear click does NOT open the picker. `input-color` no longer ships its own clear markup â€” it relies on the built-in one.
- **Disabled / readonly / viewed** â€” swatch button is disabled, picker won't open, clear button is hidden.

## Example

```html
<sd-input-color
  label="MÃ u thÆ°Æ¡ng hiá»‡u"
  helperText="Äá»‹nh dáº¡ng #RRGGBB hoáº·c #RRGGBBAA"
  [(model)]="brandColor"
  [required]="true">
</sd-input-color>
```

```ts
brandColor = signal<string | undefined>('#1565C0');
```

## Anti-patterns
- âŒ Two-way binding to a non-string (number, object) â€” the model expects a hex string or null/undefined
- âŒ Passing names like `'red'` / `'blue'` â€” pattern validator will reject; use a `<sd-select>` if you need named colors
- âŒ Skipping `[required]` then trying to enforce non-empty downstream â€” let the built-in required validator do it

