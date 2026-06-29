# `<sd-chip>`

**Type**: Component (form input)
**Selector**: `sd-chip`
**Import path**: `@sdcorejs/angular/forms/chip` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdChip`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose

Multi-value tag input — user types and presses Enter/comma to add a chip; chips can be removed individually. Backed by Material `mat-chips` and integrates with SDCoreJS forms (`[form]+[name]`, validators, `[viewed]` read-only).

## When to use

- Free-text multi-value fields: keywords, tags, email recipients, hashtags
- Bulk-entry of short string/number values where order is not significant
- DETAIL state needs to render the same chip strip read-only via `[viewed]`

## When NOT to use

- Picking from a fixed list of options → use `<sd-select [multiple]="true">`
- Multi-date selection → use `<sd-chip-calendar>`
- Single tag/value → use `<sd-input>` or `<sd-autocomplete>`

## Inputs

| Name              | Type                                 | Default     | Notes                                                                                                                                                                                                                                                                                                                                                   |
| ----------------- | ------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autoId`          | `string \| undefined`                | `undefined` | Forwarded for E2E hooks (no auto-prefix here).                                                                                                                                                                                                                                                                                                          |
| `name`            | `string \| undefined`                | random uuid | Control name registered into `[form]`.                                                                                                                                                                                                                                                                                                                  |
| `appearance`      | `MatFormFieldAppearance`             | `'outline'` | Material form-field style.                                                                                                                                                                                                                                                                                                                              |
| `floatLabel`      | `FloatLabelType`                     | `'auto'`    | When the label floats (`auto \| always`).                                                                                                                                                                                                                                                                                                               |
| `size`            | `Size` (`'sm' \| 'md' \| 'lg'`)      | `'md'`      | Field height. Use `size="sm"` inside `<sd-table>` filters/cells or other dense table UI.                                                                                                                                                                                                                                                                |
| `form`            | `NgForm \| FormGroup \| undefined`   | `undefined` | Parent form; NgForm auto-unwrapped.                                                                                                                                                                                                                                                                                                                     |
| `label`           | `string`                             | `''`        | Field label.                                                                                                                                                                                                                                                                                                                                            |
| `placeholder`     | `string \| undefined`                | `undefined` | Placeholder for the typing area.                                                                                                                                                                                                                                                                                                                        |
| `removable`       | `boolean \| ((item:any) => boolean)` | `true`      | Whether each chip shows the ✕ remove button (or per-item predicate).                                                                                                                                                                                                                                                                                    |
| `model`           | `(string \| number)[] \| undefined`  | `undefined` | Current array of chip values (one-way input — pair with `(modelChange)`).                                                                                                                                                                                                                                                                               |
| `min`             | `number`                             | `0`         | When > 0, adds `Validators.minLength(min)`.                                                                                                                                                                                                                                                                                                             |
| `max`             | `number`                             | `0`         | When > 0, adds `Validators.maxLength(max)`.                                                                                                                                                                                                                                                                                                             |
| `addable`         | `boolean`                            | `true`      | When `false`, typing in new values is suppressed.                                                                                                                                                                                                                                                                                                       |
| `required`        | `boolean`                            | `false`     | Adds `Validators.required`.                                                                                                                                                                                                                                                                                                                             |
| `disabled`        | `boolean`                            | `false`     | Disables both the chip strip and the input.                                                                                                                                                                                                                                                                                                             |
| `viewed`          | `boolean \| 'inline'`                | `false`     | Display mode. `false` = edit. `true` = static read-only `<sd-view>` (chips render, not editable); `<ng-template sdViewDef>` (if present) overrides the rendering. `'inline'` = the editable chip strip stays mounted (no separate read-only face — chips are already compact), but a **disabled** `'inline'` falls back to `true` (static `<sd-view>`). |
| `hideInlineError` | `boolean`                            | `false`     | Hide inline error; expose via `errorMessage`.                                                                                                                                                                                                                                                                                                           |
| `hyperlink`       | `string \| null \| undefined`        | `undefined` | Used in static `[viewed]` mode to link the chip text.                                                                                                                                                                                                                                                                                                   |

> **Coerce**: `addable`, `required`, `disabled`, `hideInlineError` use `booleanAttribute` — bare attribute = `true`. `viewed` uses the shared `sdViewedTransform` (accepts `'' | true | false | null | undefined` plus the literal `'inline'`); computed `isViewed()` (`true`, or disabled `'inline'`) drives the static `<sd-view>` branch and the host `.sd-viewed` class.

## Outputs

| Name          | Type    | Notes                                                           |
| ------------- | ------- | --------------------------------------------------------------- |
| `modelChange` | `any[]` | Emits the new chip array on add/remove/clear.                   |
| `sdChange`    | `any[]` | SDCoreJS-standard change event (same payload as `modelChange`). |

## Host classes

Applied automatically on `<sd-chip>` for styling hooks:

| Class          | Condition                                                           | Effect                                                                                                |
| -------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `sd-has-label` | `[label]` is truthy                                                 | Adds `padding-top: 4px` so the floating label has room and is not clipped. Absent → no top padding.   |
| `sd-viewed`    | `isViewed()` — `[viewed]="true"`, or disabled `[viewed]="'inline'"` | Removes top padding (read-only text only). Overrides `sd-has-label` when both are set (source order). |

## Content projection (slots)

- `#sdLabel` template — custom label rendering
- `#sdValue` template — custom value rendering
- `<ng-template sdLabelDef>` — alternate label
- `<ng-template sdViewDef>` — read-only display template used in `[viewed]` mode

## Form integration

- **Does NOT implement `ControlValueAccessor`.** Standard SDCoreJS form pattern: provide `[form]` + `name`, the component will `addControl(name, formControl)` on `ngAfterViewInit` and remove it in `ngOnDestroy`.
- **`formControlName` and `[(ngModel)]` are NOT supported.** Use `[model]` + `(modelChange)` (or `[(model)]` shorthand) and `[form]+[name]`.
- **`[viewed]="true"`** = DETAIL read-only mode: chips display without ✕, no input box; honors `<ng-template sdViewDef>` for custom rendering and `hyperlink` for clickable values.
- **`[viewed]="'inline'"`** keeps the editable chip strip (chips are already compact, so there is no separate text face) — except when `[disabled]`, where it collapses to the static `<sd-view>`. Use `'inline'` to embed an editable chip field in a mostly-read-only DETAIL layout without the full mat-form-field shell standing out.
- **Validators**: `[required]`, `[min]` (→ `minLength`), `[max]` (→ `maxLength`). Error tooltip messages: required → "Vui lòng nhập thông tin"; minlength → "Vui lòng nhập ít nhất N giá trị"; maxlength → "Vui lòng nhập tối đa N giá trị".
- **Reactive validator updates** — validator inputs (`required` / `min` / `max`) are signal inputs; an internal `effect()` re-runs `setValidators` + `updateValueAndValidity` whenever any of them changes. Toggle `required` at runtime and the control re-validates automatically.
- **`[disabled]` reactive** — toggling `disabled` calls `formControl.disable() / enable()` and `inputControl.disable() / enable()` via an effect — both the chip strip and the typing area are gated together.
- **`[(model)]` two-way** — host-side writes propagate via an effect: when `model` changes, the component calls `formControl.setValue(values)`. The reverse direction (add/remove/clear chip → `modelChange` emit) runs through the component's `onAdd` / `onRemove` / `onClear` handlers.
- **Separator keys** — Enter (`ENTER`) and comma (`COMMA`) from `@angular/cdk/keycodes` both commit a new chip. Duplicate values and empty strings are silently ignored.
- **Duplicate guard** — `onAdd` checks `values.includes(value)` before pushing; identical chip values are never repeated.
- **`addable=false` guard** — when `[addable]="false"`, typing new text is accepted in the input but `onAdd` silently discards it; existing chips remain.

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

| Method        | Signature                                       | Notes                                                                                                                  |
| ------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `onAdd`       | `(event: MatChipInputEvent) => void`            | Called by `(matChipInputTokenEnd)` — trims value, deduplicates, pushes to formControl, emits `modelChange`+`sdChange`. |
| `onRemove`    | `(item: any) => void`                           | Filters item from formControl value, emits `modelChange`+`sdChange`, re-focuses input.                                 |
| `onClear`     | `(event?: any) => void`                         | Resets formControl to `[]`, emits `modelChange`+`sdChange`.                                                            |
| `onSelect`    | `(event: MatAutocompleteSelectedEvent) => void` | Adds autocomplete-selected item (deduplicates).                                                                        |
| `focus`       | `() => void`                                    | Programmatically focuses the typing input after 100 ms (guards against blur race).                                     |
| `onFocus`     | `() => void`                                    | Sets `isFocused = true`, clears `inputControl`.                                                                        |
| `onBlur`      | `() => void`                                    | Sets `isFocused = false` after 150 ms (blur-race guard).                                                               |
| `onClickChip` | `(event: Event, item: any) => void`             | Stops propagation, re-focuses the input unless disabled.                                                               |
| `onClick`     | `() => void`                                    | Used when `sdViewDef` is present — toggles edit mode on click.                                                         |

## Chip data structure

Values are primitives — `string` or `number` (the component filters on `typeof item === 'string' \| 'number'`). It does NOT store object chips. If you need object chips, normalize to a string key first.

## Visual cues (helps agent map screenshots → component)

- Outlined input box containing rounded-pill chips inline
- Each chip: pill shape, value text, small ✕ button on the right (unless `removable=false`)
- A free-text caret blinks at the end of the chip strip; pressing Enter or comma commits a new chip
- Trailing ✕ at the far right clears all chips
- Loading/error state mirrors other SDCoreJS inputs (red underline, tooltip)
- In `[viewed]` mode: chip strip without input or ✕

## Standalone imports and table-cell usage

Every standalone host that uses `<sd-chip>` must import `SdChip`. Projected label/view templates require their directives in `imports`.

```ts
import { Component } from '@angular/core';
import { SdTable, SdTableCellDefDirective, SdTableOption } from '@sdcorejs/angular/components/table';
import { SdChip } from '@sdcorejs/angular/forms';
import { SdLabelDefDirective, SdViewDefDirective } from '@sdcorejs/angular/forms/directives';

@Component({
  standalone: true,
  imports: [SdTable, SdTableCellDefDirective, SdChip, SdLabelDefDirective, SdViewDefDirective],
  template: `
    <sd-table [option]="tableOption">
      <ng-template sdTableCellDef="tags" let-row>
        <sd-chip size="sm" hideInlineError [(model)]="row.tags"> </sd-chip>
      </ng-template>
    </sd-table>
  `,
})
export class ChipTableComponent {
  tableOption!: SdTableOption<unknown>;
}
```

Inside `<sd-table>` custom cells, always use `size="sm"` and `hideInlineError`.

```html
<ng-template sdTableCellDef="tags" let-row>
  <sd-chip size="sm" hideInlineError [(model)]="row.tags"></sd-chip>
</ng-template>
```

For read-only primitive arrays, prefer the lightweight `sdView` pipe.

```html
{{ row.tags | sdView }}
```

## Examples

### 1. Tag/keyword input

```html
<sd-chip [form]="form" name="tags" label="Tags" placeholder="Nhập tag, Enter để thêm" [(model)]="model.tags" [min]="1" [max]="10" required>
</sd-chip>
```

### 2. Email recipients with custom remove rule

```html
<sd-chip [form]="form" name="recipients" label="Người nhận" [(model)]="model.recipients" [removable]="canRemoveRecipient"> </sd-chip>
```

```ts
canRemoveRecipient = (email: string) => email !== this.currentUserEmail;
```

### 3. DETAIL read-only display

```html
<sd-chip label="Tags" [model]="model.tags" [viewed]="true"> </sd-chip>
```

## E2E test attributes

Rendered on the `<input class="sd-chip-input">` element (same anchor as `data-autoid`):

| Attribute            | Value                 | Source                                                                        |
| -------------------- | --------------------- | ----------------------------------------------------------------------------- |
| `data-autoid`        | `forms-chip-<autoId>` | input `autoId`                                                                |
| `data-disabled`      | `"true"` / `"false"`  | `formControl.disabled`                                                        |
| `data-invalid`       | `"true"` / `"false"`  | `formControl.invalid && (touched \|\| dirty)`                                 |
| `data-empty`         | `"true"` / `"false"`  | `sdIsEmpty(formControl.value)`                                                |
| `data-value`         | string                | `sdSerializeDataValue(formControl.value)`                                     |
| `data-required`      | `"true"` / `"false"`  | `required` input; always present                                              |
| `data-error-message` | string                | present only when the component is currently showing an error tooltip message |

> **Note**: `sd-chip` does not support maxlength / minlength / pattern. No `data-maxlength`, `data-minlength`, or `data-pattern` attributes are emitted.

Selector example:

```ts
const el = page.locator('[data-autoid="forms-chip-tags"]');
await expect(el).toHaveAttribute('data-empty', 'false');
await expect(el).toHaveAttribute('data-required', 'false');
```

## Anti-patterns

- ❌ Using `formControlName` / `[(ngModel)]` — not wired; use `[(model)]` + `[form]+[name]`.
- ❌ Pushing onto the `model` array in place — pass a new array reference so the signal effect re-runs.
- ❌ Storing complex objects per chip — values must be primitive (string/number).
- ❌ Using `<sd-chip>` for selecting from a fixed option list — prefer `<sd-select [multiple]>` for closed-set UX.
- ❌ Using `[disabled]` instead of `[viewed]` for DETAIL state — `[viewed]` produces the correct read-only visual via `sdViewDef`.

## Related

- `<sd-chip-calendar>` — multi-date chip input
- `<sd-autocomplete>` — single-select with typeahead
- `<sd-select>` — closed-set picker (with `[multiple]`)
- `<sd-input>` — single-value free text
