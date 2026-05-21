# `<sd-chip>`

**Type**: Component (form input)
**Selector**: `sd-chip`
**Import path**: `@sdcorejs/angular/forms/chip` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdChip`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Multi-value tag input â€” user types and presses Enter/comma to add a chip; chips can be removed individually. Backed by Material `mat-chips` and integrates with SDCoreJS forms (`[form]+[name]`, validators, `[viewed]` read-only).

## When to use
- Free-text multi-value fields: keywords, tags, email recipients, hashtags
- Bulk-entry of short string/number values where order is not significant
- DETAIL state needs to render the same chip strip read-only via `[viewed]`

## When NOT to use
- Picking from a fixed list of options â†’ use `<sd-select [multiple]="true">`
- Multi-date selection â†’ use `<sd-chip-calendar>`
- Single tag/value â†’ use `<sd-input>` or `<sd-autocomplete>`

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `autoId` | `string \| undefined` | `undefined` | Forwarded for E2E hooks (no auto-prefix here). |
| `name` | `string \| undefined` | random uuid | Control name registered into `[form]`. |
| `appearance` | `MatFormFieldAppearance` | `'outline'` | Material form-field style. |
| `floatLabel` | `FloatLabelType` | `'auto'` | When the label floats (`auto \| always`). |
| `size` | `Size` (`'sm' \| 'md' \| 'lg'`) | `'md'` | Field height. |
| `form` | `NgForm \| FormGroup \| undefined` | `undefined` | Parent form; NgForm auto-unwrapped. |
| `label` | `string` | `''` | Field label. |
| `placeholder` | `string \| undefined` | `undefined` | Placeholder for the typing area. |
| `removable` | `boolean \| ((item:any) => boolean)` | `true` | Whether each chip shows the âœ• remove button (or per-item predicate). |
| `model` | `(string \| number)[] \| undefined` | `undefined` | Current array of chip values (one-way input â€” pair with `(modelChange)`). |
| `min` | `number` | `0` | When > 0, adds `Validators.minLength(min)`. |
| `max` | `number` | `0` | When > 0, adds `Validators.maxLength(max)`. |
| `addable` | `boolean` | `true` | When `false`, typing in new values is suppressed. |
| `required` | `boolean` | `false` | Adds `Validators.required`. |
| `disabled` | `boolean` | `false` | Disables both the chip strip and the input. |
| `viewed` | `boolean` | `false` | DETAIL read-only mode â€” chips render but are not editable; `<ng-template sdViewDef>` (if present) overrides the rendering. |
| `hideInlineError` | `boolean` | `false` | Hide inline error; expose via `errorTooltipMessage`. |
| `hyperlink` | `string \| null \| undefined` | `undefined` | Used in `[viewed]` mode to link the chip text. |

> **Coerce**: `addable`, `required`, `disabled`, `viewed`, `hideInlineError` use `booleanAttribute` â€” bare attribute = `true`.

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `modelChange` | `any[]` | Emits the new chip array on add/remove/clear. |
| `sdChange` | `any[]` | SDCoreJS-standard change event (same payload as `modelChange`). |

## Content projection (slots)
- `#sdLabel` template â€” custom label rendering
- `#sdValue` template â€” custom value rendering
- `<ng-template sdLabelDef>` â€” alternate label
- `<ng-template sdViewDef>` â€” read-only display template used in `[viewed]` mode

## Form integration
- **Does NOT implement `ControlValueAccessor`.** Standard SDCoreJS form pattern: provide `[form]` + `name`, the component will `addControl(name, formControl)` on `ngAfterViewInit` and remove it in `ngOnDestroy`.
- **`formControlName` and `[(ngModel)]` are NOT supported.** Use `[model]` + `(modelChange)` (or `[(model)]` shorthand) and `[form]+[name]`.
- **`[viewed]="true"`** = DETAIL read-only mode: chips display without âœ•, no input box; honors `<ng-template sdViewDef>` for custom rendering and `hyperlink` for clickable values.
- **Validators**: `[required]`, `[min]` (â†’ `minLength`), `[max]` (â†’ `maxLength`). Error tooltip messages: required â†’ "Vui lÃ²ng nháº­p thÃ´ng tin"; minlength â†’ "Vui lÃ²ng nháº­p Ã­t nháº¥t N giÃ¡ trá»‹"; maxlength â†’ "Vui lÃ²ng nháº­p tá»‘i Ä‘a N giÃ¡ trá»‹".
- **Reactive validator updates** â€” validator inputs (`required` / `min` / `max`) are signal inputs; an internal `effect()` re-runs `setValidators` + `updateValueAndValidity` whenever any of them changes. Toggle `required` at runtime and the control re-validates automatically.
- **`[disabled]` reactive** â€” toggling `disabled` calls `formControl.disable() / enable()` and `inputControl.disable() / enable()` via an effect â€” both the chip strip and the typing area are gated together.
- **`[(model)]` two-way** â€” host-side writes propagate via an effect: when `model` changes, the component calls `formControl.setValue(values)`. The reverse direction (add/remove/clear chip â†’ `modelChange` emit) runs through the component's `onAdd` / `onRemove` / `onClear` handlers.
- **Separator keys** â€” Enter (`ENTER`) and comma (`COMMA`) from `@angular/cdk/keycodes` both commit a new chip. Duplicate values and empty strings are silently ignored.
- **Duplicate guard** â€” `onAdd` checks `values.includes(value)` before pushing; identical chip values are never repeated.
- **`addable=false` guard** â€” when `[addable]="false"`, typing new text is accepted in the input but `onAdd` silently discards it; existing chips remain.

### Three ways to integrate

```html
<!-- 1. Model binding only (no FormGroup) -->
<sd-chip label="Tags" placeholder="Add and press Enter" [(model)]="model.tags"></sd-chip>

<!-- 2. Reactive FormGroup (self-registers via addControl) -->
<form [formGroup]="form">
  <sd-chip label="Tags" name="tags" [form]="form" required [(model)]="model.tags"></sd-chip>
</form>

<!-- 3. NgForm (template-driven group) -->
<form #f="ngForm">
  <sd-chip label="Tags" name="tags" [form]="f" required [(model)]="model.tags"></sd-chip>
</form>
```

## Public API methods
| Method | Signature | Notes |
| --- | --- | --- |
| `onAdd` | `(event: MatChipInputEvent) => void` | Called by `(matChipInputTokenEnd)` â€” trims value, deduplicates, pushes to formControl, emits `modelChange`+`sdChange`. |
| `onRemove` | `(item: any) => void` | Filters item from formControl value, emits `modelChange`+`sdChange`, re-focuses input. |
| `onClear` | `(event?: any) => void` | Resets formControl to `[]`, emits `modelChange`+`sdChange`. |
| `onSelect` | `(event: MatAutocompleteSelectedEvent) => void` | Adds autocomplete-selected item (deduplicates). |
| `focus` | `() => void` | Programmatically focuses the typing input after 100 ms (guards against blur race). |
| `onFocus` | `() => void` | Sets `isFocused = true`, clears `inputControl`. |
| `onBlur` | `() => void` | Sets `isFocused = false` after 150 ms (blur-race guard). |
| `onClickChip` | `(event: Event, item: any) => void` | Stops propagation, re-focuses the input unless disabled. |
| `onClick` | `() => void` | Used when `sdViewDef` is present â€” toggles edit mode on click. |

## Chip data structure
Values are primitives â€” `string` or `number` (the component filters on `typeof item === 'string' \| 'number'`). It does NOT store object chips. If you need object chips, normalize to a string key first.

## Visual cues (helps agent map screenshots â†’ component)
- Outlined input box containing rounded-pill chips inline
- Each chip: pill shape, value text, small âœ• button on the right (unless `removable=false`)
- A free-text caret blinks at the end of the chip strip; pressing Enter or comma commits a new chip
- Trailing âœ• at the far right clears all chips
- Loading/error state mirrors other SDCoreJS inputs (red underline, tooltip)
- In `[viewed]` mode: chip strip without input or âœ•

## Examples

### 1. Tag/keyword input
```html
<sd-chip
  [form]="form" name="tags"
  label="Tags" placeholder="Nháº­p tag, Enter Ä‘á»ƒ thÃªm"
  [(model)]="model.tags"
  [min]="1" [max]="10"
  required>
</sd-chip>
```

### 2. Email recipients with custom remove rule
```html
<sd-chip
  [form]="form" name="recipients"
  label="NgÆ°á»i nháº­n"
  [(model)]="model.recipients"
  [removable]="canRemoveRecipient">
</sd-chip>
```
```ts
canRemoveRecipient = (email: string) => email !== this.currentUserEmail;
```

### 3. DETAIL read-only display
```html
<sd-chip
  label="Tags" [model]="model.tags"
  [viewed]="true">
</sd-chip>
```

## Anti-patterns
- âŒ Using `formControlName` / `[(ngModel)]` â€” not wired; use `[(model)]` + `[form]+[name]`.
- âŒ Pushing onto the `model` array in place â€” pass a new array reference so the signal effect re-runs.
- âŒ Storing complex objects per chip â€” values must be primitive (string/number).
- âŒ Using `<sd-chip>` for selecting from a fixed option list â€” prefer `<sd-select [multiple]>` for closed-set UX.
- âŒ Using `[disabled]` instead of `[viewed]` for DETAIL state â€” `[viewed]` produces the correct read-only visual via `sdViewDef`.

## Related
- `<sd-chip-calendar>` â€” multi-date chip input
- `<sd-autocomplete>` â€” single-select with typeahead
- `<sd-select>` â€” closed-set picker (with `[multiple]`)
- `<sd-input>` â€” single-value free text

