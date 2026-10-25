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
| `labelPlacement` | `'float' \| 'top'` | `'float'` | `'float'` (default) keeps the Material floating label. `'top'` renders `label` above the field as a real `<label for>` bound to the chip `<input>`, never repeats it as the placeholder, and shows `helperText` as a described-by hint under the field that a validation error replaces. Used by `<sd-form-render>`. |
| `placeholder`     | `string \| undefined`                | `undefined` | Placeholder for the typing area. Without it: `core.form.chip.placeholder` (“Nhập rồi nhấn Enter”), never the label. Once `maxCount` is reached: “Đã đủ {max} giá trị”. |
| `removable`       | `boolean \| ((item:any) => boolean)` | `true`      | `true` / `false` for every chip, or a per-item predicate. Applied on every removal path: the ✕ button, Backspace / Delete on a chip and `onRemove`. A chip it keeps shows no ✕.                                                                                                                                                                                                                                                                                    |
| `model`           | `(string \| number)[] \| undefined`  | `undefined` | Current array of chip values (one-way input — pair with `(modelChange)`). `null` / `undefined` clears the chips and sets `formControl` to `[]`. Every item except `null`, `undefined` and `''` is a chip, `0` included.                                                                                                                                                                                                                                                                               |
| `minCount`        | `number \| undefined`                | `undefined` | Fewest chips; > 0 adds `Validators.minLength`. Replaces `min`. |
| `maxCount`        | `number \| undefined`                | `undefined` | Most chips; > 0 adds `Validators.maxLength` (for a model set from outside) and stops adding once reached: an `n/max` counter shows under the field, the placeholder says the field is full, and typing or pasting more is announced instead of added. Replaces `max`. |
| `min`             | `number`                             | `0`         | **Deprecated**, use `minCount`. Still adds `Validators.minLength`; `minCount` wins when both are set. Warns once per instance in dev mode. |
| `max`             | `number`                             | `0`         | **Deprecated**, use `maxCount`. Still adds `Validators.maxLength`; `maxCount` wins when both are set. Warns once per instance in dev mode. |
| `addable`         | `boolean`                            | `true`      | When `false`, nothing can be typed or pasted: the input stays (mat-chip-grid needs it) but is read-only, out of the Tab order and has no placeholder. Existing chips stay. |
| `addOnBlur`       | `boolean`                            | `true`      | Leaving the field turns the typed text into a chip. `false` drops the text instead, as before. |
| `separators`      | `string[]`                           | `['Enter', ',']` | Keys that commit the typed text, compared with `KeyboardEvent.key`. A paste also splits on these characters, new lines and tabs. Add `';'` for e-mail lists. |
| `chipTransform`   | `(raw: string) => string \| number \| null` | trim  | Normalises typed or pasted text before it is compared and stored. `null` or `''` drops it. |
| `chipValidator`   | `((value: string \| number) => string \| null) \| null` | `null` | Checks a normalised value. Return an i18n key (or the message itself) to refuse it: it does not become a chip, its text stays in the input and the message shows under the field until the text changes. |
| `clearable`       | `boolean`                            | `false`     | Shows a clear-all button (`.sd-clear-btn`, like `<sd-date>`) on hover or focus, always on touch screens. It removes every chip `removable` allows in one change and keeps its place while there is nothing to clear. Not shown when `required` or `disabled`. |
| `maxVisible`      | `number \| null`                     | `null`      | Chips shown while the field is not focused; the rest fold into a “+N” button that moves focus to the input, where every chip shows. Use `2` inside `<sd-table>` cells. |
| `required`        | `boolean`                            | `false`     | Adds `Validators.required`.                                                                                                                                                                                                                                                                                                                             |
| `disabled`        | `boolean`                            | `false`     | Disables both the chip strip and the input.                                                                                                                                                                                                                                                                                                             |
| `viewed`          | `boolean \| 'inline'`                | `false`     | Display mode. `false` = edit. `true` = static read-only `<sd-view>` (chips render, not editable); `<ng-template sdViewDef>` (if present) overrides the rendering. `'inline'` = the editable chip strip stays mounted (no separate read-only face — chips are already compact), but a **disabled** `'inline'` falls back to `true` (static `<sd-view>`). |
| `hideInlineError` | `boolean`                            | `false`     | Hide inline error; expose via `errorMessage`. The field shows an error icon with a tooltip, and the input points `aria-describedby` at a visually hidden copy of the message.                                                                                                                                                                                                                                                                                                           |
| `hyperlink`       | `string \| null \| undefined`        | `undefined` | Used in static `[viewed]` mode to link the chip text.                                                                                                                                                                                                                                                                                                   |

> **Coerce**: `addable`, `addOnBlur`, `clearable`, `required`, `disabled`, `hideInlineError` use `booleanAttribute` — bare attribute = `true`. `viewed` uses the shared `sdViewedTransform` (accepts `'' | true | false | null | undefined` plus the literal `'inline'`); computed `isViewed()` (`true`, or disabled `'inline'`) drives the static `<sd-view>` branch and the host `.sd-viewed` class.

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
- `<ng-template sdViewDef>` — display template: used in `[viewed]` mode, and in edit mode as the face shown until the field opens. In edit mode the face is a `role="button"` that a click, Enter or Space opens; it leaves the Tab order when `[disabled]`. The wrapper around the field is layout only (no role, no `tabindex`).

## Form integration

- **Does NOT implement `ControlValueAccessor`.** Standard SDCoreJS form pattern: provide `[form]` + `name`, the component will `addControl(name, formControl)` on `ngAfterViewInit` and remove it in `ngOnDestroy`.
- **`formControlName` and `[(ngModel)]` are NOT supported.** Use `[model]` + `(modelChange)` (or `[(model)]` shorthand) and `[form]+[name]`.
- **`[viewed]="true"`** = DETAIL read-only mode: chips display without ✕, no input box; honors `<ng-template sdViewDef>` for custom rendering and `hyperlink` for clickable values.
- **`[viewed]="'inline'"`** keeps the editable chip strip (chips are already compact, so there is no separate text face) — except when `[disabled]`, where it collapses to the static `<sd-view>`. Use `'inline'` to embed an editable chip field in a mostly-read-only DETAIL layout without the full mat-form-field shell standing out.
- **Validators**: `[required]`, `[minCount]` (→ `minLength`), `[maxCount]` (→ `maxLength`); the deprecated `[min]` / `[max]` still work. Error tooltip messages: required → "Vui lòng nhập thông tin"; minlength → "Vui lòng nhập ít nhất N giá trị"; maxlength → "Vui lòng nhập tối đa N giá trị".
- **When the error shows** — one rule for the red outline, `<mat-error>` (or the `hideInlineError` icon) and `aria-invalid`: the control is invalid and either touched or its parent `NgForm` / `FormGroupDirective` was submitted. A field that is only dirty, or untouched before a submit, shows nothing. The field becomes touched when focus leaves it; moving between the typing input and the chips does not count. Leaving the field never rewrites `formControl` (number items stay numbers, a reset stays a reset).
- **Reactive validator updates (additive)** — validator inputs (`required` / `minCount` / `maxCount`, and the deprecated `min` / `max`) are signal inputs routed through the shared form connector, which **adds and removes only the validators this component owns**. Toggle them at runtime and the control re-validates automatically. Validators you attach yourself to the public `formControl` (`formControl.addValidators(...)`) are preserved — the component no longer calls `clearValidators()` / `setValidators()`.
- **`[disabled]` reactive** — toggling `disabled` calls `formControl.disable() / enable()` and `inputControl.disable() / enable()` via an effect — both the chip strip and the typing area are gated together.
- **`[(model)]` two-way** — host-side writes propagate via an effect: when `model` changes, the component calls `formControl.setValue(values)` (`[]` for `null` / `undefined`). The reverse direction (add/remove/clear chip → `modelChange` emit) runs through the component's `onAdd` / `onRemove` / `onClear` handlers.
- **The model array is replaced, never mutated** — every add/select/remove/clear builds a **new array** and emits it. The array you pass into `[model]` is never written to, and because the reference always changes, `modelChange` fires reliably (signal equality is `Object.is`, so an in-place `push` would have been swallowed).
- **Separator keys** — the keys in `separators` (default Enter and comma) commit the typed text, compared with `KeyboardEvent.key`, so `';'` works on every keyboard layout. Typing in an IME composition never commits. Leaving the field commits too (`addOnBlur`).
- **One path for every addition** — typed, separator, blur and pasted text all go through `chipTransform`, then the duplicate check, the `maxCount` limit and `chipValidator`, and every change writes one new array once.
- **Duplicate guard** — values compare as strings after `chipTransform`, so a model `[1]` and a typed `1` are the same chip. The comparison is case-sensitive: “Tag” and “tag” are two chips, unless `chipTransform` lower-cases them (see the e-mail example). A duplicate highlights the chip it repeats for 1.4s (`--sd-chip-duplicate-bg`, warning outline, no transition under `prefers-reduced-motion`) and is announced as “{value} đã có”.
- **Paste a list** — a paste that holds a separator, a new line or a tab adds every value in one change. Duplicates are skipped, refused values and values past `maxCount` stay in the input for fixing, and the result is announced (“Đã thêm 3 · bỏ 1 trùng”). A paste without a separator is left to the browser.
- **Announcements** — a polite live region reads the duplicate, full and paste messages, and “Không xoá được” when Backspace / Delete reaches a chip `removable` keeps.
- **Accessible names** — the ✕ button of a chip is named `core.form.chip.remove` (“Xoá {value}”), the clear-all button `core.form.chip.clear` (“Xoá tất cả”), the “+N” button `core.form.chip.more` (“Xem thêm {count}”).
- **Long values** — the chip text stops at 240px with an ellipsis, and a chip that is cut shows its whole value in a tooltip.

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
| `onAdd`       | `(event: MatChipInputEvent) => void`            | Called by `(matChipInputTokenEnd)` — trims value, deduplicates, writes a NEW array to formControl, emits `modelChange`+`sdChange`. |
| `onRemove`    | `(item: any) => void`                           | Filters item into a new array, emits `modelChange`+`sdChange`, re-focuses input. Skips an item `removable` keeps.                                       |
| `onClear`     | `(event?: any) => void`                         | Resets formControl to `[]`, emits `modelChange`+`sdChange`.                                                            |
| `onSelect`    | `(event: MatAutocompleteSelectedEvent) => void` | Adds autocomplete-selected item (deduplicates).                                                                        |
| `focus`       | `() => void`                                    | Programmatically focuses the typing input after 100 ms (guards against blur race).                                     |
| `onFocus`     | `() => void`                                    | Sets `isFocused = true`, clears `inputControl`.                                                                        |
| `onBlur`      | `() => void`                                    | Sets `isFocused = false` after 150 ms (blur-race guard).                                                               |
| `onClickChip` | `(event: Event, item: any) => void`             | Stops propagation, re-focuses the input unless disabled.                                                               |
| `onClick`     | `() => void`                                    | Used when `sdViewDef` is present — toggles edit mode on click; `onViewKeydown` does the same for Enter / Space.                                                         |

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

Inside `<sd-table>` custom cells, always use `size="sm"` and `hideInlineError`, and `[maxVisible]="2"` so ten tags or a long URL do not make the row three times taller.

```html
<ng-template sdTableCellDef="tags" let-row>
  <sd-chip size="sm" hideInlineError [maxVisible]="2" [(model)]="row.tags"></sd-chip>
</ng-template>
```

For read-only primitive arrays, prefer the lightweight `sdView` pipe.

```html
{{ row.tags | sdView }}
```

## Dense dashboard/filter usage

When this control is rendered in dashboard cards, filter bars, external filter panels, table toolbars, query bars, or other compact non-form surfaces, prefer `hideInlineError` so Material does not reserve the inline error/subscript row under the field. Pair it with `size="sm"` when the component supports `size`. Validation remains visible through the compact error icon/tooltip without increasing the control height, and the message is also exposed to assistive tech through a screen-reader-only element (`span.sd-visually-hidden`) referenced by `aria-describedby`.

```html
<sd-chip size="sm" hideInlineError [(model)]="filter.tags"></sd-chip>
```

## Examples

### 1. Tag/keyword input

```html
<sd-chip [form]="form" name="tags" label="Tags" placeholder="Nhập tag, Enter để thêm" [(model)]="model.tags" [minCount]="1" [maxCount]="10" required>
</sd-chip>
```

### 2. Email recipients: normalise, validate, limit, custom remove rule

```html
<sd-chip
  [form]="form"
  name="recipients"
  label="Người nhận"
  [(model)]="model.recipients"
  [separators]="['Enter', ',', ';']"
  [chipTransform]="toEmail"
  [chipValidator]="checkEmail"
  [maxCount]="5"
  [removable]="canRemoveRecipient"
  clearable>
</sd-chip>
```

```ts
// why: the duplicate check is case-sensitive, so lower-case e-mails before they are compared and stored.
toEmail = (raw: string) => raw.trim().toLowerCase();
checkEmail = (email: string | number) => (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email)) ? null : 'Email không hợp lệ');
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
