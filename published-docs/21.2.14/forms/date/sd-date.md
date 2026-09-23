# `<sd-date>`

**Type**: Component (form input)
**Selector**: `sd-date`
**Import path**: `@sdcorejs/angular/forms/date` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdDate`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose

Single-date picker — Material datepicker with date-fns adapter (`dd/MM/yyyy` parse/display) plus SDCoreJS form-group registration, `[viewed]` read-only mode, and built-in min/max date validation messages.

## When to use

- Any single date field (birth date, expiry date, effective date)
- Inside a `<form>` group with reactive validation (required + min/max bounds)
- DETAIL state read-only via `[viewed]="true"`

## When NOT to use

- Date RANGE (start + end) → use `<sd-date-range>`
- Multi-date selection → use `<sd-chip-calendar>`
- Date + time combined → use `<sd-datetime>`

## Inputs

| Name              | Type                                            | Default                                     | Notes                                                                                                                                                                                                                                                                            |
| ----------------- | ----------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autoId`          | `string \| null \| undefined`                   | `undefined`                                 | Generates `data-autoId="forms-date-<value>"` for E2E hooks.                                                                                                                                                                                                                      |
| `name`            | `string`                                        | random uuid                                 | Control name registered into `[form]`.                                                                                                                                                                                                                                           |
| `size`            | `Size` (`'sm' \| 'md' \| 'lg'`)                 | `'md'`                                      | Field height. Use `size="sm"` inside `<sd-table>` filters/cells or other dense table UI.                                                                                                                                                                                         |
| `form`            | `FormGroup \| NgForm \| undefined`              | `undefined`                                 | Parent form. NgForm auto-unwrapped. Object containing a `.form` is also accepted.                                                                                                                                                                                                |
| `label`           | `string \| undefined`                           | `undefined`                                 | Field label.                                                                                                                                                                                                                                                                     |
| `helperText`      | `string \| undefined`                           | `undefined`                                 | Hint under field.                                                                                                                                                                                                                                                                |
| `placeholder`     | `string \| undefined`                           | `undefined`                                 | Placeholder when empty.                                                                                                                                                                                                                                                          |
| `appearance`      | `MatFormFieldAppearance`                        | from `SD_FORM_CONFIGURATION` ?? `'outline'` | Material form-field style.                                                                                                                                                                                                                                                       |
| `floatLabel`      | `FloatLabelType`                                | `'auto'`                                    | When the label floats.                                                                                                                                                                                                                                                           |
| `min` / `minDate` | `Date \| string \| 'TODAY' \| undefined`        | `undefined`                                 | Minimum allowed date. `'TODAY'` resolves to `new Date()`. Either alias works.                                                                                                                                                                                                    |
| `max` / `maxDate` | `Date \| string \| 'TODAY' \| undefined`        | `undefined`                                 | Maximum allowed date. `'TODAY'` resolves to `new Date()`.                                                                                                                                                                                                                        |
| `required`        | `boolean`                                       | `false`                                     | Adds `Validators.required`.                                                                                                                                                                                                                                                      |
| `disabled`        | `boolean`                                       | `false`                                     | Disables the field.                                                                                                                                                                                                                                                              |
| `viewed`          | `boolean \| 'inline'`                           | `false`                                     | Display mode. `false` edit · `true` static DETAIL (formatted date / `sdViewDef`) · `'inline'` click-to-edit (text face → click opens the calendar; text retained until a value is committed; hover clear-× gated by `clearable`). Disabled `'inline'` falls back to static view. |
| `clearable`       | `boolean`                                       | `false`                                     | Shows the value-gated clear button in edit and `'inline'` modes. Set the bare `clearable` attribute to opt in.                                                                                                                                                                   |
| `hideInlineError` | `boolean`                                       | `false`                                     | Hide inline error; expose via `errorMessage`.                                                                                                                                                                                                                                    |
| `inlineError`     | `string \| undefined`                           | `undefined`                                 | Forces an inline error message.                                                                                                                                                                                                                                                  |
| `hyperlink`       | `string \| null \| undefined`                   | `undefined`                                 | Used in `[viewed]` mode to render the date as a link.                                                                                                                                                                                                                            |
| `model`           | `string \| number \| Date \| null \| undefined` | `undefined`                                 | Two-way bound value (use `[(model)]`). Persisted as `'yyyy/MM/dd'` string internally.                                                                                                                                                                                            |

| `transform`       | `SdTemporalValueTransform \| undefined`          | `undefined`                                 | Output serialization strategy for the committed value — see **Value transform** below. Does not affect the display. |

> **Coerce**: `required`, `disabled`, `viewed`, `clearable`, `hideInlineError` use `booleanAttribute` — bare attribute = `true`.


## Value transform (`transform`)

`transform` names how a **committed** value leaves the component. It changes `model` / `modelChange`
/ `sdChange` and the registered `FormGroup` field — and nothing else. What the field *shows* is
untouched.

| `transform` | Serializer      | Output                                                        |
| ----------- | --------------- | ------------------------------------------------------------- |
| `undefined` | existing canonical formatter | Unchanged behaviour (the default).               |
| `ISOString` | `toISOString()` | UTC ISO 8601 with a `Z` suffix and milliseconds.               |
| `UTCString` | `toUTCString()` | UTC RFC-1123, English, `GMT` suffix, no milliseconds.          |

```text
ISOString   2026-08-15T03:20:30.000Z
UTCString   Sat, 15 Aug 2026 03:20:30 GMT
```

Notes that bite if missed:

- **The UTC calendar day can differ from the local one.** A value picked late in the day east of
  Greenwich, or early in the day west of it, serializes to the neighbouring date. That is correct —
  both name the same instant — but a server comparing date strings will see the other day.
- **Reading is wider than writing.** The active `transform` decides the output shape only; every
  input the component accepted before is still accepted, plus ISO and UTC strings. A model arriving
  in one shape is not rewritten into another just because `transform` is set.
- **Changing `transform` at runtime rewrites nothing.** The bound model keeps its current string and
  no event fires; the next user commit uses the new strategy.
- `transform` is a value-serialization strategy, not an Angular input-coercion `transform`.

`<sd-date>` and `<sd-date-range>` serialize **local start-of-day**: the calendar day the user picked,
at midnight in their own timezone, never whatever time the editor happened to carry.

```html
<sd-date transform="ISOString" [(model)]="filterDate"></sd-date>
```

The field still shows `dd/MM/yyyy`.

## Outputs

| Name       | Type   | Notes                                                                                   |
| ---------- | ------ | --------------------------------------------------------------------------------------- |
| `sdChange` | `any`  | Emits the new value as `'yyyy/MM/dd'` string (or `null` when cleared / on parse error). |
| `sdFocus`  | `void` | Emits when the input is focused.                                                        |

## Host classes

Applied automatically on `<sd-date>` for styling hooks:

| Class          | Condition                             | Effect                                                                                                                            |
| -------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `sd-has-label` | `[label]` is truthy                   | Adds `padding-top: 4px` so the floating label has room and is not clipped. Absent → no top padding.                               |
| `sd-viewed`    | `[viewed]="true"`                     | Removes top padding (read-only text only). Overrides `sd-has-label` when both are set (source order).                             |
| `sd-bare`      | (internal — set by `viewed='inline'`) | Flattens the mat-form-field shell for the inline editor. **No longer a public `[bare]` input** (removed); driven by `isInline()`. |

## Content projection (slots)

- `#sdLabel` template — custom label
- `#sdValue` template — custom value rendering
- `<ng-template sdLabelDef>` — alternate label
- `<ng-template sdViewDef>` — read-only display template used in `[viewed]` mode

## Form integration

- **Does NOT implement `ControlValueAccessor`.** Standard SDCoreJS pattern: pass `[form]` + `name`, the internal `SdFormControl` registers into the group on `ngOnInit`.
- **`formControlName` and `[(ngModel)]` are NOT supported.** Use `[(model)]` for two-way binding and `[form]+[name]` for FormGroup integration.
- **`[viewed]="true"`** = DETAIL read-only mode: input + calendar icon are hidden, the formatted date (or `<ng-template sdViewDef>`) is shown. With `hyperlink` it renders a clickable link.
- **Date adapter**: providers include `provideSdStrictDateFnsAdapter` configured for `dd/MM/yyyy` parse/display. Internal storage uses native `Date` objects; emitted values are `'yyyy/MM/dd'` strings.
- **Validators**: `[required]` adds `Validators.required`. `[min]` / `[max]` flow into Material's `matDatepickerMin` / `matDatepickerMax` validators. Manual typed text is validated against `dd/MM/yyyy`; bad input raises `date: 'Sai định dạng'` through a **real `ValidatorFn`** attached to the control. Previously that error was injected out-of-band via `setErrors()`, so the next `updateValueAndValidity()` or `setValue()` — from the connector or from consumer code — silently dropped it; it now survives both. `[inlineError]` injects a synthetic `inlineError` validator. `errorMessage` gives Vietnamese messages for each error key, including Material's `matDatepickerParse` (raised when typed text cannot be parsed at all — this branch previously checked a non-existent `matDatetimePickerParse` key and was unreachable).

## Typing behaviour

Separators are inserted as you type: `2` → `2`, `22` → `22/`, `2208` → `22/08/`, `22081991` → `22/08/1991`. Non-digits are dropped and input is capped at eight digits. Deleting never re-adds the separator you just removed.

**A half-typed date is never accepted as a value.** The field is bound with `[matDatepicker]`, so Angular Material re-parses the text after *every* keystroke and writes the result straight into the form control. The stock date-fns adapter is too permissive for that:

| Typed | Stock adapter | Now |
| --- | --- | --- |
| `11/12/2` | year 0002, error flag cleared → field looks valid | rejected, control stays empty |
| `11/12/20` | year 0020 | rejected |
| `11` (after deleting) | year 1100, via the `parseISO` century fallback | rejected |
| `11/12/2026` | 11 Dec 2026 | 11 Dec 2026 |

`SdStrictDateFnsAdapter` closes both holes: it skips the ISO fallback and requires the text to round-trip through the configured format, so the control only ever receives a date the user actually finished typing. The value is committed on blur; incomplete or impossible text (`31/02/2026`) clears the field.

## Public methods & getters

| Member                | Kind                         | Description                                                                                                                                                                         |
| --------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `errorMessage`        | getter `string \| undefined` | Returns a Vietnamese error message for the first active error on `formControl` (`required`, `matDatepickerMin`, `matDatepickerMax`, `matDatepickerParse`, `date`, `customValidator`, `inlineError`). `undefined` when valid. |
| `clear($event)`       | method                       | Stops propagation, nulls `formControl` value, updates `valueModel`, and emits `sdChange(null)`. No-op if the control is already empty.                                              |
| `focus()`             | method                       | Programmatically focuses the native input and opens the datepicker popup (deferred 100 ms).                                                                                         |
| `blur()`              | method                       | Programmatically blurs the native input.                                                                                                                                            |
| `focusInputElement()` | method                       | Focuses the native `<input>` without opening the picker.                                                                                                                            |
| `onFocus()`           | event handler                | Sets `isFocused = true` and emits `sdFocus`.                                                                                                                                        |
| `onBlur()`            | event handler                | Sets `isFocused = false`.                                                                                                                                                           |
| `formControl`         | `SdFormControl`              | Underlying reactive control. Accessible for direct validator inspection in tests.                                                                                                   |
| `isFocused`           | `boolean`                    | Current focus state (drives CSS classes and view-def toggle).                                                                                                                       |

## Visual cues (helps agent map screenshots → component)

- Outlined input field showing `DD/MM/YYYY` formatted date
- Trailing calendar icon button → opens Material datepicker popup
- Optional slim clear-button (`clearable`, default `false`; `.sd-clear-btn` — round transparent button with a thin `close` icon, grey → red on hover) when a value is set and the field is not `required`/`disabled`; shown alongside the calendar icon, suppresses parent click. **Hover-gated** (`sd-hover`) — hidden until the field is hovered or focused. Emits `sdChange(null)` on clear. Shared style with `sd-input`/`sd-input-number`/`sd-input-color`/`sd-datetime` (`assets/scss/core/form.scss`). **Not rendered when the host is bare** (`viewed='inline'`, which sets `.sd-bare`) — bare is "value + caret only" for inline chip contexts where the clear-× duplicated the chip's own remove-× and could clear the value when dismissing the picker.
- Min/max enforcement: dates outside the range are greyed-out and unselectable in the popup
- Format error: red underline + tooltip "Sai định dạng" while the typed text doesn't match `D/M/YYYY` regex
- In `[viewed]="true"` mode: no input, no icon — plain formatted date or hyperlink

## Standalone imports and table-cell usage

Every standalone host that uses `<sd-date>` must import `SdDate`. Projected label/view templates require their directives in `imports`.

```ts
import { Component } from '@angular/core';
import { SdTable, SdTableCellDefDirective, SdTableOption } from '@sdcorejs/angular/components/table';
import { SdDate } from '@sdcorejs/angular/forms';
import { SdLabelDefDirective, SdViewDefDirective } from '@sdcorejs/angular/forms/directives';

@Component({
  standalone: true,
  imports: [SdTable, SdTableCellDefDirective, SdDate, SdLabelDefDirective, SdViewDefDirective],
  template: `
    <sd-table [option]="tableOption">
      <ng-template sdTableCellDef="dueDate" let-row>
        <sd-date size="sm" hideInlineError [(model)]="row.dueDate"> </sd-date>
      </ng-template>
    </sd-table>
  `,
})
export class DateTableComponent {
  tableOption!: SdTableOption<unknown>;
}
```

Inside `<sd-table>` custom cells or custom inline filters, always use `size="sm"` and `hideInlineError`.

```html
<ng-template sdTableFilterDef="dueDate" let-filter let-update="update">
  <sd-date size="sm" hideInlineError [(model)]="filter.dueDate" (sdChange)="update()"> </sd-date>
</ng-template>
```

For read-only date display, do not use Angular's built-in `date` pipe in SDCoreJS docs/examples. Use `sdFormatDate` and `sdView`.

```html
{{ row.dueDate | sdFormatDate | sdView }}
```

## Dense dashboard/filter usage

When this control is rendered in dashboard cards, filter bars, external filter panels, table toolbars, query bars, or other compact non-form surfaces, prefer `hideInlineError` so Material does not reserve the inline error/subscript row under the field. Pair it with `size="sm"` when the component supports `size`. Validation remains visible through the compact error icon/tooltip without increasing the control height, and the message is also exposed to assistive tech through a screen-reader-only element (`span.sd-visually-hidden`) referenced by `aria-describedby`.

```html
<sd-date size="sm" hideInlineError [(model)]="filter.date"></sd-date>
```

## Examples

### 1. Birth-date inside a reactive form

```html
<sd-date [form]="form" name="dob" label="Ngày sinh" [(model)]="model.dob" max="TODAY" required (sdChange)="onDobChange($event)"> </sd-date>
```

### 2. Date range guard via min/max

```html
<sd-date
  [form]="form"
  name="effectiveDate"
  label="Ngày hiệu lực"
  [min]="contract.startDate"
  [max]="contract.endDate"
  [(model)]="model.effectiveDate"
  required>
</sd-date>
```

### 3. DETAIL read-only with hyperlink

```html
<sd-date label="Ngày tạo" [model]="model.createdAt" [viewed]="true" hyperlink="/audit/{{ model.id }}"> </sd-date>
```

## E2E test attributes

Rendered on the inner `<input>` element (same anchor as `data-autoid`):

| Attribute            | Value                 | Source                                                                        |
| -------------------- | --------------------- | ----------------------------------------------------------------------------- |
| `data-autoid`        | `forms-date-<autoId>` | input `autoId`                                                                |
| `data-disabled`      | `"true"` / `"false"`  | `formControl.disabled`                                                        |
| `data-invalid`       | `"true"` / `"false"`  | `formControl.invalid && (touched \|\| dirty)`                                 |
| `data-empty`         | `"true"` / `"false"`  | `sdIsEmpty(formControl.value)`                                                |
| `data-value`         | string                | `sdSerializeDataValue(formControl.value)`                                     |
| `data-required`      | `"true"` / `"false"`  | `required` input; always present                                              |
| `data-error-message` | string                | present only when the component is currently showing an error tooltip message |

> **Note**: `sd-date` does not support maxlength / minlength / pattern. No `data-maxlength`, `data-minlength`, or `data-pattern` attributes are emitted.

Selector example:

```ts
const el = page.locator('[data-autoid="forms-date-hireDate"]');
await expect(el).toHaveAttribute('data-empty', 'false');
await expect(el).toHaveAttribute('data-required', 'true');
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

- The calendar trigger is a real `<button type="button">` with an `aria-label` (it used to be a bare
  `<sd-icon (click)>`: not reachable by keyboard, no accessible name).

## Anti-patterns

- ❌ Using `formControlName` / `[(ngModel)]` — not wired; use `[(model)]` + `[form]+[name]`.
- ❌ Setting `model` to a moment object — pass `Date`, ISO string, or `'yyyy/MM/dd'` string. Component normalizes via `DateUtilities`.
- ❌ Trying `[disabled]` for DETAIL state — use `[viewed]="true"` for the proper read-only visual.
- ❌ Bypassing `min`/`max` and validating manually — built-in validators surface localized tooltip messages.
- ❌ Using `<sd-date>` for a date+time field — switch to `<sd-datetime>`.

## Related

- `<sd-date-range>` — start/end pair
- `<sd-datetime>` — date + time
- `<sd-chip-calendar>` — multi-date chip strip
- `<sd-input>` — free text fallback
- `SD_FORM_CONFIGURATION` token — global default `appearance`
