# `<sd-input-number>`

**Type**: Component (form input)
**Selector**: `sd-input-number`
**Import path**: `@sdcorejs/angular/forms/input-number` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdInputNumber`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose

Numeric input with locale-aware formatting (VN `1.234.567,89` or ISO `1,234,567.89`), keystroke filtering, optional negative/positive constraint, decimal precision, and min/max validators. Use for any monetary or quantity field.

## When to use

- VND / USD / any currency amount field (price, total, balance, …)
- Quantity / count fields (stock qty, headcount, items)
- Rates and percentages (entered as a number — pair with a `%` suffix label)
- Any numeric field where the user benefits from thousand-separator grouping while typing
- DETAIL state via `[viewed]="true"` to render the formatted number (or a hyperlink)

## When NOT to use

- Free text containing digits but not a quantity (phone number, tax code, IDs) → use `<sd-input>` with appropriate `pattern`
- Date / time → use `<sd-date>` / `<sd-datetime>` / `<sd-date-range>`
- A picker from a list of numeric codes → use `<sd-select>` / `<sd-autocomplete>`
- Sliders for ranges → not in this component; use a Material slider directly

## Inputs

| Name              | Type                                    | Default                                     | Notes                                                                                                                                                                                                                                                                                                 |
| ----------------- | --------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autoId`          | `string \| null \| undefined`           | `undefined`                                 | Generates `data-autoid="forms-input-number-<value>"` for E2E selectors.                                                                                                                                                                                                                               |
| `name`            | `string`                                | random uuid                                 | FormGroup control name when bound via `[form]`.                                                                                                                                                                                                                                                       |
| `size`            | `Size` (`'sm' \| 'md' \| 'lg'`)         | `'md'`                                      | Field height. Use `size="sm"` inside `<sd-table>` filters/cells or other dense table UI.                                                                                                                                                                                                              |
| `form`            | `NgForm \| FormGroup \| undefined`      | `undefined`                                 | Parent form. NgForm is auto-unwrapped to its inner `FormGroup`.                                                                                                                                                                                                                                       |
| `label`           | `string \| undefined`                   | `undefined`                                 | Field label (rendered via `<sd-label>`).                                                                                                                                                                                                                                                              |
| `helperText`      | `string \| undefined`                   | `undefined`                                 | Hint text under the field.                                                                                                                                                                                                                                                                            |
| `placeholder`     | `string \| undefined`                   | `undefined`                                 | Placeholder when empty.                                                                                                                                                                                                                                                                               |
| `appearance`      | `MatFormFieldAppearance`                | from `SD_FORM_CONFIGURATION` ?? `'outline'` | Material form-field style.                                                                                                                                                                                                                                                                            |
| `floatLabel`      | `FloatLabelType`                        | `'auto'`                                    | Material float-label behaviour.                                                                                                                                                                                                                                                                       |
| `type`            | `'negative' \| 'positive' \| undefined` | `undefined`                                 | Constrain sign. `undefined` = both signs allowed; `'negative'` = must be negative; `'positive'` = no minus sign accepted.                                                                                                                                                                             |
| `precision`       | `number`                                | `3`                                         | Max decimal places. `0` = integer only.                                                                                                                                                                                                                                                               |
| `min`             | `number \| undefined`                   | `undefined`                                 | Adds `Validators.min`.                                                                                                                                                                                                                                                                                |
| `max`             | `number \| undefined`                   | `undefined`                                 | Adds `Validators.max`.                                                                                                                                                                                                                                                                                |
| `validator`       | `SdCustomValidator \| undefined`        | `undefined`                                 | Async custom validator (wrapped via `HandleSdCustomValidator`).                                                                                                                                                                                                                                       |
| `inlineError`     | `string \| undefined`                   | `undefined`                                 | Forces an inline error message (synthetic `inlineError` validator).                                                                                                                                                                                                                                   |
| `hyperlink`       | `string \| null \| undefined`           | `undefined`                                 | Render value as a link in `[viewed]` mode.                                                                                                                                                                                                                                                            |
| `required`        | `boolean`                               | `false`                                     | Adds `Validators.required`.                                                                                                                                                                                                                                                                           |
| `readonly`        | `boolean`                               | `false`                                     | HTML `readonly` — input still focusable.                                                                                                                                                                                                                                                              |
| `disabled`        | `boolean`                               | `false`                                     | Disables the control.                                                                                                                                                                                                                                                                                 |
| `clearable`       | `boolean`                               | `false`                                     | Shows the value-gated clear button in edit and `'inline'` modes. The button is still hidden when the field is empty, required, disabled, or readonly.                                                                                                                                                 |
| `viewed`          | `boolean \| 'inline'`                   | `false`                                     | Display mode. `false` edit · `true` static DETAIL (formatted number / `sdViewDef`) · `'inline'` **borderless inline-edit** — the real `<input>` renders transparent/borderless (looks like text), focus to edit, blur reformats (e.g. `12.345`); NO panel/overlay. Disabled `'inline'` → static view. |
| `blurOnEnter`     | `boolean`                               | `false`                                     | If `true`, Enter blurs the field after emitting `keyupEnter`.                                                                                                                                                                                                                                         |
| `hideInlineError` | `boolean`                               | `false`                                     | Hide inline message; surfaces error via `errorMessage`.                                                                                                                                                                                                                                               |
| `model`           | `any` (`number \| null`)                | `undefined`                                 | Two-way bound numeric value (use `[(model)]`). Stored as a JS number; emitted as number on change.                                                                                                                                                                                                    |

> **Coerce**: `required`, `readonly`, `disabled`, `clearable`, `viewed`, `blurOnEnter`, `hideInlineError` use `booleanAttribute` — bare attribute = `true`.

## Outputs

| Name               | Type                  | Notes                                                                        |
| ------------------ | --------------------- | ---------------------------------------------------------------------------- |
| `sdChange`         | `number \| null`      | Emitted when the parsed numeric value changes.                               |
| `sdFocus`          | `void`                | Fires on focus.                                                              |
| `sdBlur`           | `number \| null`      | Fires on **every** blur, payload = current numeric value (or `null` if cleared) — including the "trailing decimal separator" path (`"12."` / `"12,"`), which is reformatted to `12` and then emits like any other blur. |
| `keyupEnter`       | `string`              | Fires on Enter keyup, payload = the formatted display string.                |
| `sdFocusForceBlur` | `void` (EventEmitter) | When a parent subscribes, focusing the input immediately blurs it and emits. |

## Public methods

| Name             | Signature          | Notes                                                                                                           |
| ---------------- | ------------------ | --------------------------------------------------------------------------------------------------------------- |
| `clear($event?)` | `(Event?) => void` | Resets display + value to `null` and emits `sdChange(null)` **exactly once**. Re-validates and surfaces the resulting message (e.g. `required`) immediately. No-op when empty. Backs the built-in clear button. |
| `showClear()`    | `() => boolean`    | Whether the built-in clear button renders: `clearable`, has a value, and not `required`/`disabled`/`readonly`.  |

## E2E test attributes

Rendered on the inner `<input matInput>` element (same anchor as `data-autoid`):

| Attribute            | Value                         | Source                                                                        |
| -------------------- | ----------------------------- | ----------------------------------------------------------------------------- |
| `data-autoid`        | `forms-input-number-<autoId>` | input `autoId`                                                                |
| `data-disabled`      | `"true"` / `"false"`          | `formControl.disabled`                                                        |
| `data-invalid`       | `"true"` / `"false"`          | `formControl.invalid && (touched \|\| dirty)`                                 |
| `data-empty`         | `"true"` / `"false"`          | `sdIsEmpty(formControl.value)`                                                |
| `data-value`         | string                        | `sdSerializeDataValue(formControl.value)`                                     |
| `data-required`      | `"true"` / `"false"`          | `required` input; always present                                              |
| `data-error-message` | string                        | present only when the component is currently showing an error tooltip message |

> **Note**: `sd-input-number` does not support `maxlength` / `minlength` / `pattern` (it uses `min` / `max` for numeric bounds). No `data-maxlength`, `data-minlength`, or `data-pattern` attributes are emitted.

Selector example:

```ts
const el = page.locator('[data-autoid="forms-input-number-amount"]');
await expect(el).toHaveAttribute('data-empty', 'false');
await expect(el).toHaveAttribute('data-value', '42');
// validation meta
await expect(el).toHaveAttribute('data-required', 'true');
// error message — only when field is in error state
await expect(el).toHaveAttribute('data-error-message', 'Vui lòng nhập thông tin');
```

## Host classes

Applied automatically on `<sd-input-number>` for styling hooks:

| Class          | Condition           | Effect                                                                                                |
| -------------- | ------------------- | ----------------------------------------------------------------------------------------------------- |
| `sd-has-label` | `[label]` is truthy | Adds `padding-top: 4px` so the floating label has room and is not clipped. Absent → no top padding.   |
| `sd-viewed`    | `[viewed]="true"`   | Removes top padding (read-only text only). Overrides `sd-has-label` when both are set (source order). |

## Content projection (slots)

- `#sdLabel` template — custom label rendering
- `#sdValue` template — custom display rendering
- `<ng-template sdSuffixDef>` — custom suffix (e.g. currency symbol, unit) at the trailing edge
- `<ng-template sdViewDef>` — read-only display template used in `[viewed]` mode

## Form integration

- **Does NOT implement `ControlValueAccessor`.** Forms use the SDCoreJS pattern: pass the parent form via `[form]="formGroup"` (or `[form]="ngForm"`) plus a `name`. On `ngAfterViewInit`, the component calls `formGroup.addControl(name, formControl)` and removes it in `ngOnDestroy`. Internally there are TWO controls (`formControl` for the parsed numeric value; `inputControl` for the raw display string with separators) but only `formControl` is registered to the parent form.
- **`formControlName` and `[(ngModel)]` are NOT supported.** Use `[(model)]` for two-way value binding and `[form]+[name]` for FormGroup integration.
- **`[viewed]="true"`** flips into DETAIL read-only mode: the input is hidden and the formatted number (or `<ng-template sdViewDef>`) is rendered. If `hyperlink` is set, the value renders as a link.
- **Validators**: `[required]` → `Validators.required`. `[min]` / `[max]` → Angular's `Validators.min` / `Validators.max`. `[validator]` accepts a custom validator `(value) => string | Promise<string>` wired as an **async** validator (`HandleSdCustomValidator` → `{ customValidator: message }`). Error messages: required → "Vui lòng nhập thông tin"; min → "Giá trị không được nhỏ hơn N"; max → "Giá trị không được lớn hơn N"; **`[validator]` → the string the validator returns**; inlineError → echoes `inlineError`. All messages render below the field (`<mat-error>`) or, with `[hideInlineError]`, via the trailing error-icon tooltip.
- **Reactive validator updates** — validator inputs (`required` / `min` / `max` / `inlineError` / `validator`) are signal inputs; an internal `effect()` re-runs `setValidators` + `updateValueAndValidity({ emitEvent: false })` whenever any of them changes. Validators update automatically at runtime — no manual `reValidate()` needed.
- **`[disabled]` reactive** — toggling `disabled` calls `inputControl.disable() / enable()` and `formControl.disable() / enable()` via an effect, with `emitEvent: false` (no spurious `statusChanges`).
- **`[(model)]` two-way** — host-side writes propagate via an effect: when `model` changes, the component calls `formControl.setValue(val, { emitEvent: false })` and syncs `inputControl` with the formatted display string so the host won't re-trigger its own `(modelChange)` listener. The reverse direction (user typing → `inputControl.valueChanges` → parse → `valueModel.set()` → `(modelChange)` emit) runs through the normal Angular signal-model mechanism.
- **Why the typing path mirrors to `formControl` WITH events** — when the user types, the parsed value is written back via `formControl.setValue(value)` **without** `{ emitEvent: false }`. This is deliberate: `formControl` carries the (async) `[validator]`, and the error message is derived through a `computed` that only recomputes when the control's reactive snapshot (`sdFormControlState`) ticks on a control event. Suppressing the event here would mean the async validator's `setErrors(...)` completion also runs silently → the snapshot never ticks → the error message never appears (the field would show a red outline yet no message). `formControl.valueChanges` has no subscriber, so emitting causes no loop. (Bug fixed 2026-06-05.) **`clear()` follows the same rule** — it also writes `formControl.setValue(null)` with events, otherwise clearing a `required` field left `errorMessage`, `data-empty` and `data-value` frozen on the pre-clear value (empty field, red outline, no message). The display control (`inputControl`) keeps `{ emitEvent: false }` because its subscriber would re-parse and emit a second `sdChange`. (Bug fixed 2026-08-09.)
- **Locale formatting** is driven by `SD_CORE_CONFIGURATION.format.number`. When set to `'1.234.567,89'` (VN-style), thousands separator is `.` and decimal separator is `,`. Otherwise ISO-style: thousands `,` and decimal `.`. Keystrokes that would break the active regex are blocked; paste and IME composition are validated and rolled back if invalid.
- **Blur clean-up** — on blur, a trailing decimal separator (e.g. `"123."`) is stripped; whitespace is trimmed; an empty or whitespace-only value resolves to `null`. **Every** blur branch emits `sdBlur` exactly once, including the trailing-separator one (it used to return early without emitting, so consumers listening on `(sdBlur)` silently missed that case).
- **Default `appearance`** — when `[appearance]` is omitted, the component reads the `SD_FORM_CONFIGURATION` injection token (`{ appearance: MatFormFieldAppearance }`). Provide it once at application bootstrap to flip ALL form fields to `'fill'` (or any other appearance). Falls back to `'outline'` if the token is not provided.

### Three ways to integrate

```html
<!-- 1. Template-driven with [(model)] (no FormGroup) -->
<sd-input-number label="Số tiền" [(model)]="model.amount"></sd-input-number>

<!-- 2. Reactive FormGroup (pass the group in, the input self-registers via addControl) -->
<form [formGroup]="form">
  <sd-input-number label="Số tiền" name="amount" [form]="form" required></sd-input-number>
</form>

<!-- 3. NgForm (template-driven group) -->
<form #f="ngForm">
  <sd-input-number label="Số tiền" name="amount" [form]="f" required></sd-input-number>
</form>
```

> **How it works**: the `[form]` signal-input has a `transform` that detects `NgForm` (via `instanceof NgForm` — unwraps `.form`) and `FormGroup` (used directly). It also accepts an object literal of shape `{ form: FormGroup }` as a safety fallback. In all three patterns the component manages `addControl` / `removeControl` lifecycle internally — never call them yourself.

## Visual cues (helps agent map screenshots → component)

- An outlined input field that visually looks like `<sd-input>` BUT typed digits are auto-grouped — typing `1234567` shows `1.234.567` (VN) or `1,234,567` (ISO)
- Text often right-aligned (matches accountant convention) — actual alignment is set in the component CSS
- Optional currency symbol or unit shows in the suffix slot via `sdSuffixDef` (e.g. `đ`, `VND`, `%`)
- Optional built-in **slim clear button** (`clearable`, default `false`; `.sd-clear-btn`, thin `close` icon) when there's a value AND the field is not `required`/`disabled`/`readonly`. **Hover-gated** (`sd-hover`) — only visible on hover/focus. Click resets to `null` and emits `sdChange(null)`. Renders to the left of any `sdSuffixDef` unit symbol. Shared style with `sd-input`/`sd-input-color`/`sd-date`/`sd-datetime`.
- With `[hideInlineError]="true"`: an `error` icon (`.sd-error-icon`) sits **flush at the right edge** carrying the message as a tooltip; when the clear button is also present it renders to the **left** of the error icon (the hover-gated clear reserves its slot via `visibility:hidden`, so it never shifts the error icon inward).
- In `[viewed]="true"` mode: no input chrome — just the formatted number as plain text (or as a hyperlink if `hyperlink` is set)

## Standalone imports and table-cell usage

Every standalone host that uses `<sd-input-number>` must import `SdInputNumber`. Projected suffix/view templates require their directives in `imports`.

```ts
import { Component } from '@angular/core';
import { SdTable, SdTableCellDefDirective, SdTableOption } from '@sdcorejs/angular/components/table';
import { SdInputNumber } from '@sdcorejs/angular/forms';
import { SdSuffixDefDirective, SdViewDefDirective } from '@sdcorejs/angular/forms/directives';

@Component({
  standalone: true,
  imports: [SdTable, SdTableCellDefDirective, SdInputNumber, SdSuffixDefDirective, SdViewDefDirective],
  template: `
    <sd-table [option]="tableOption">
      <ng-template sdTableCellDef="amount" let-row>
        <sd-input-number size="sm" hideInlineError type="positive" [precision]="0" [(model)]="row.amount">
          <ng-template sdSuffixDef>
            <span class="text-secondary">VND</span>
          </ng-template>
        </sd-input-number>
      </ng-template>
    </sd-table>
  `,
})
export class AmountTableComponent {
  tableOption!: SdTableOption<unknown>;
}
```

Inside `<sd-table>` custom cells or custom inline filters, always use `size="sm"` and `hideInlineError`.

```html
<ng-template sdTableCellDef="quantity" let-row>
  <sd-input-number size="sm" hideInlineError type="positive" [precision]="0" [(model)]="row.quantity"> </sd-input-number>
</ng-template>
```

For read-only numeric display, do not create a custom pipe. Use `sdFormatNumber` and `sdView`.

```html
{{ row.amount | sdFormatNumber : 0 | sdView }}
```

## Dense dashboard/filter usage

When this control is rendered in dashboard cards, filter bars, external filter panels, table toolbars, query bars, or other compact non-form surfaces, prefer `hideInlineError` so Material does not reserve the inline error/subscript row under the field. Pair it with `size="sm"` when the component supports `size`. Validation remains visible through the compact error icon/tooltip without increasing the control height, and the message is also exposed to assistive tech through a screen-reader-only element (`span.sd-visually-hidden`) referenced by `aria-describedby`.

```html
<sd-input-number size="sm" hideInlineError type="positive" [(model)]="filter.amount"></sd-input-number>
```

## Clipboard paste

- Paste accepts both `1.234.567,89` and `1,234,567.89`, with or without thousands separators. All whitespace is removed, including tabs, newlines, NBSP (`U+00A0`) and narrow NBSP (`U+202F`).
- Ambiguous values use the configured format first: `1.234` means 1234 with the VN format and 1.234 with the ISO format. The other format is tried only when the configured format cannot parse the complete text. Grouped integers require exactly three digits per group; malformed values such as `1.2.3` are rejected.
- Excess fractional digits are **truncated toward zero** to `precision`: `1.234.567,89` becomes 1234567 at precision 0; `12,349` becomes 12.34 at precision 2 with VN format. This normalization applies to paste; ordinary typing still enforces precision immediately.
- Paste replaces the selected text (or inserts at the caret), formats the result using the configured separators, and updates the numeric model and `sdChange` through the normal input pipeline. Invalid/non-finite numbers or values incompatible with `type` leave the control unchanged.
- `min`/`max` remain validators, just as for typed input: out-of-range values are retained and reported as validation errors, without clamping. Ctrl+V and Cmd+V both reach the paste handler.

## Examples

### 1. VND amount with currency suffix

```html
<sd-input-number [form]="form" name="amount" label="Số tiền" required type="positive" [precision]="0" [(model)]="model.amount">
  <ng-template sdSuffixDef>
    <span class="text-secondary">đ</span>
  </ng-template>
</sd-input-number>
```

### 2. Quantity (integer only)

```html
<sd-input-number
  [form]="form"
  name="quantity"
  label="Số lượng"
  type="positive"
  [precision]="0"
  [min]="1"
  [max]="999"
  [(model)]="model.quantity">
</sd-input-number>
```

### 3. Percentage with 2 decimals

```html
<sd-input-number [form]="form" name="rate" label="Lãi suất (%)" [precision]="2" [min]="0" [max]="100" [(model)]="model.rate">
</sd-input-number>
```

### 4. DETAIL state read-only formatted display

```html
<sd-input-number label="Tổng giá trị hợp đồng" [model]="contract.totalValue" [viewed]="true"> </sd-input-number>
```

## Accessibility

`aria-hidden="true"` used to sit on the real `<input>` **and** on the layout `<div>` that wraps the
whole `mat-form-field`. That single attribute removed the label, the control, the `mat-error` and the
clear button from the accessibility tree at once, while the control still took keyboard focus — a
screen reader landed on it and announced nothing.

- The control element carries **no** `aria-hidden`.
- The layout wrapper is marked `role="presentation"` (layout only). Unlike `aria-hidden` this does
  **not** hide descendants; its `(click)` handler is a mouse convenience that keyboard users already
  get by tabbing straight into the control.
- When the inline error renders, the control gets `aria-invalid="true"` and an
  `aria-describedby` pointing at the `<mat-error>` (stable id, exposed as `errorId`). Both are gated
  on the same condition as the message itself.

## Anti-patterns

- ❌ Using `formControlName` / `[(ngModel)]` — not wired; use `[form]+[name]` and `[(model)]`.
- ❌ Using `<sd-input type="number">` instead — that variant has no thousand-separator grouping and will not match the VN locale.
- ❌ Storing the model as a formatted string — the component emits a JS `number`. Keep `model.amount: number | null` in the parent.
- ❌ Setting `[precision]` higher than what the backend stores — display will round implicitly when the value comes back.
- ❌ Using `[disabled]="true"` to express read-only DETAIL state — use `[viewed]="true"` instead so labels/links render correctly.
- ❌ Using `type="positive"` AND a negative `[min]` simultaneously — the keystroke filter will block the minus sign and the validator will never trigger.

## Related

- `<sd-input>` — text input variant
- `<sd-label>` — label primitive used internally
- `SdSuffixDefDirective` — custom suffix template
- `SdViewDefDirective` — DETAIL-mode template projection
- `SdFormatNumberPipe` — display-only number formatter (used internally)
- `SD_CORE_CONFIGURATION.format.number` — switches VN vs ISO locale formatting
- `SD_FORM_CONFIGURATION` token — global default `appearance`
