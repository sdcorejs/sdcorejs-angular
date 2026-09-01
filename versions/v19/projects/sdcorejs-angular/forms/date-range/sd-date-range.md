# `<sd-date-range>`

**Type**: Component (form input)
**Selector**: `sd-date-range`
**Import path**: `@sdcorejs/angular/forms/date-range` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdDateRange`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose

Two-date range picker — user picks a start date AND an end date through a single 2-month calendar popup. Wraps Material `mat-date-range-picker` with SDCoreJS label/validators/min-max boundary support.

## When to use

- Filtering a list page by a date interval ("from" → "to" — e.g. transaction date, hire date, posting period)
- Report parameter form needing a date interval
- Picking validity periods (effective-from / expiry-to) where both ends matter and must stay in sync
- DETAIL state where the saved range needs to be displayed (component still shows two read-only inputs unless you swap to plain text)

## When NOT to use

- Single-date selection → use `<sd-date>`
- Date + time of a single moment → use `<sd-datetime>`
- Quick preset chips ("Today", "This week", …) on top of a list → use `<sd-chip-calendar>`
- Multi-period or non-contiguous dates → not supported — pick a different pattern
- Range bound to time-of-day (start-time / end-time) — this picker is date-only

## Inputs

| Name              | Type                                                                  | Default                                     | Notes                                                                                                                                           |
| ----------------- | --------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `autoId`          | `string \| null \| undefined`                                         | `undefined`                                 | Generates `data-autoId="forms-date-range-<value>"` for E2E selectors.                                                                           |
| `name`            | `string`                                                              | random uuid                                 | FormGroup control name when bound via `[form]`. This is the ONLY key the component adds to the parent form.                                     |
| `size`            | `Size` (`'sm' \| 'md' \| 'lg'`)                                       | `'md'`                                      | Field height. Use `size="sm"` inside `<sd-table>` filters/cells or other dense table UI.                                                        |
| `form`            | `NgForm \| FormGroup \| undefined`                                    | `undefined`                                 | Parent form. NgForm is auto-unwrapped to its inner `FormGroup`.                                                                                 |
| `label`           | `string \| undefined`                                                 | `undefined`                                 | Field label (rendered via `<sd-label>`).                                                                                                        |
| `helperText`      | `string \| undefined`                                                 | `undefined`                                 | Hint icon + tooltip in the label area.                                                                                                          |
| `appearance`      | `MatFormFieldAppearance`                                              | from `SD_FORM_CONFIGURATION` ?? `'outline'` | Material form-field style.                                                                                                                      |
| `floatLabel`      | `FloatLabelType`                                                      | `'auto'`                                    | Material float-label behaviour.                                                                                                                 |
| `min`             | `Date \| string \| 'TODAY'`                                           | `undefined`                                 | Earliest allowed start date. `'TODAY'` resolves to `new Date()`.                                                                                |
| `max`             | `Date \| string \| 'TODAY'`                                           | `undefined`                                 | Latest allowed end date.                                                                                                                        |
| `required`        | `boolean`                                                             | `false`                                     | Fails validation unless BOTH `from` and `to` are set (see "Form integration" — behaviour changed).                                              |
| `disabled`        | `boolean`                                                             | `false`                                     | Disables both date inputs and the picker trigger.                                                                                               |
| `hideInlineError` | `boolean`                                                             | `false`                                     | Hide inline message; surfaces error via `errorMessage` instead.                                                                                 |
| `model`           | `{ from?: string \| null; to?: string \| null } \| null \| undefined` | `undefined`                                 | Two-way bound range value (use `[(model)]`). Both ends are ISO-style date strings (`yyyy/MM/dd`).                                               |

| `transform`       | `SdTemporalValueTransform \| undefined`          | `undefined`                                 | Output serialization strategy for the committed value — see **Value transform** below. Does not affect the display. |

> **Coerce**: `required`, `disabled`, `hideInlineError` use `booleanAttribute` — bare attribute = `true`.


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

Each endpoint is serialized **independently**, like a `<sd-date>` would be — the range object itself
is never collapsed into one string:

```ts
{ from: fromDate.toISOString(), to: toDate.toISOString() }
```

A partial range keeps `null` on the missing end, and clearing still yields `{ from: null, to: null }`.

```html
<sd-date-range transform="ISOString" [(model)]="period"></sd-date-range>
```

The field still shows `dd/MM/yyyy → dd/MM/yyyy`.

## Outputs

| Name       | Type                   | Notes                                                                   |
| ---------- | ---------------------- | ----------------------------------------------------------------------- |
| `sdChange` | `{ from, to } \| null` | Emitted on blur, Enter, picker-close, and clear. Same shape as `model`. |

## Host classes

Applied automatically on `<sd-date-range>` for styling hooks:

| Class          | Condition                             | Effect                                                                                                                            |
| -------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `sd-has-label` | `[label]` is truthy                   | Adds `padding-top: 4px` so the floating label has room and is not clipped. Absent → no top padding.                               |
| `sd-viewed`    | `[viewed]="true"`                     | Removes top padding (read-only text only). Overrides `sd-has-label` when both are set (source order).                             |
| `sd-bare`      | (internal — set by `viewed='inline'`) | Flattens the mat-form-field shell for the inline editor. **No longer a public `[bare]` input** (removed); driven by `isInline()`. |

## Content projection (slots)

- `<ng-template sdLabelDef>` — custom label rendering (replaces the plain `label` text). The component uses `SdLabelDefDirective` content child.

## Form integration

- **Does NOT implement `ControlValueAccessor`.** Forms use the SDCoreJS pattern: pass the parent form via `[form]="formGroup"` (or `[form]="ngForm"`) plus a `name`. The component registers **exactly one** control — the aggregate `formControl`, under `name` — and removes it on destroy.
- **BREAKING (endpoint controls are no longer registered).** Earlier versions ALSO added the two internal start/end controls to the consumer's `FormGroup` under **random uuid** names. `form.value` therefore carried two extra keys that changed on every component instance, which corrupted the submitted payload shape and made `form.reset(obj)` impossible to write. They are now internal only, so `form.value[name]` is the complete range value. If you were reading those uuid keys, read `form.value[name].from` / `.to` instead. Endpoint validity is not lost: errors raised by Material on the start/end inputs (`matDatepickerParse`, `matDatepickerMin`, `matDatepickerMax`, `matStartDateInvalid`) are copied onto the aggregate control — payload included, so a copied error never goes stale when only its payload changes — and the parent form still turns invalid.
- **Writes to the aggregate control flow back down to both endpoints.** `form.reset()`, `form.reset({ [name]: { from, to } })`, `form.patchValue({ [name]: … })` and a direct `formControl.setValue(…)` all update `control1` / `control2` (so `<mat-date-range-input>` repaints) and `model`. Endpoints accept `Date` objects or date strings; `model` is normalised back to `{ from: 'yyyy/MM/dd', to: 'yyyy/MM/dd' }`. Without this, a reset would leave the two visible date inputs showing stale dates, because they no longer live in the consumer's `FormGroup`.
- **`formControlName` and `[(ngModel)]` are NOT supported.** Use `[(model)]` for two-way value binding and `[form]+[name]` for FormGroup integration.
- **`[viewed]` is tri-state** (`boolean | 'inline'`) like the other controls: `true` = static `<sd-view>` DETAIL; `'inline'` = text-face click-to-edit (opens the range picker, text retained until commit); a disabled `'inline'` falls back to static view.
- **Date adapter**: providers include `provideSdStrictDateFnsAdapter` configured for `dd/MM/yyyy` parse/display. Internal storage in `control1`/`control2` uses native `Date` objects; the emitted `model` value is `{ from: 'yyyy/MM/dd', to: 'yyyy/MM/dd' }` strings.
- **Validators**: `[required]` adds `Validators.required` to the two internal endpoint controls, and a **range-completeness validator** to the aggregate control that fails unless BOTH `from` and `to` are set. Material picker auto-emits `matDatepickerMin` / `matDatepickerMax` errors when `min`/`max` are violated. Error tooltip messages: required → "Vui lòng nhập thông tin"; min → "Ngày bắt đầu không hợp lệ (nhỏ hơn giới hạn)"; max → "Ngày kết thúc không hợp lệ (lớn hơn giới hạn)".
- **BREAKING (`[required]` now actually invalidates the form).** The aggregate control's value is always the object `{ from, to }`, and `Validators.required` treats any non-null object as filled — so `[required]` previously could **never** fail on the aggregate control. It now fails whenever either endpoint is missing. Forms that were silently passing validation with an empty or half-filled range will now correctly report invalid.

## Typing behaviour

Both range fields are `matStartDate` / `matEndDate`, so Angular Material re-parses them after every keystroke. They use `SdStrictDateFnsAdapter`, which refuses text the user has not finished typing — `11/12/2` no longer becomes year 0002 and a bare `11` no longer becomes year 1100 through the `parseISO` century fallback.

## Public methods & getters

| Member                 | Kind                         | Description                                                                                                                                                                              |
| ---------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `errorMessage`         | getter `string \| undefined` | Returns a Vietnamese error message for the first active error across `formControl`, `control1`, `control2` (`required`, `matDatepickerMin`, `matDatepickerMax`). `undefined` when valid. |
| `clear()`              | method                       | Clears both `control1` and `control2` to `null`, resets the aggregate `formControl`, sets `valueModel` to `{ from: null, to: null }`, and emits `sdChange`.                              |
| `onEnter()`            | event handler                | Triggers `#emit()` then immediately emits `sdChange` with the current `valueModel`. Bound to `keyup.enter` on both date inputs.                                                          |
| `onFocus()`            | event handler                | Sets `#isFocus = true` and resets transient flags for enter/clear/model-change tracking.                                                                                                 |
| `onBlur()`             | event handler                | Sets `#isFocus = false`, triggers `#emit()`, then emits `sdChange` asynchronously if the model changed but was not already emitted by Enter or clear.                                    |
| `onClosePicker()`      | event handler                | Emits `sdChange` with the current `valueModel` when the range picker popup closes.                                                                                                       |
| `onOpenPicker($event)` | event handler                | Stops click propagation and opens the picker if `formControl` is not disabled.                                                                                                           |
| `onStartChange(event)` | event handler                | Triggers `#emit()` when the start-date input fires `(dateInput)` and the field is not focused.                                                                                           |
| `onEndChange(event)`   | event handler                | Triggers `#emit()` when the end-date input fires `(dateInput)` and the field is not focused.                                                                                             |
| `formControl`          | `FormControl`                | Aggregate reactive control — the ONLY control registered into the parent `FormGroup` (under `name`). Holds `{ from: Date \| null, to: Date \| null }` as value.                          |
| `control1`             | `FormControl`                | Internal reactive control for the start date (native `Date` value). NOT registered in the parent form; its errors are mirrored onto `formControl`.                                       |
| `control2`             | `FormControl`                | Internal reactive control for the end date (native `Date` value). NOT registered in the parent form; its errors are mirrored onto `formControl`.                                         |
| `resolvedMin()`        | computed `Date \| null`      | Resolved `min` boundary — parses the `min` input string / Date / `'TODAY'` into a `Date`.                                                                                                |
| `resolvedMax()`        | computed `Date \| null`      | Resolved `max` boundary — parses the `max` input string / Date / `'TODAY'` into a `Date`.                                                                                                |

## Visual cues (helps agent map screenshots → component)

- A single Material outlined field with TWO date inputs side-by-side separated by an "→" / dash, each in `dd/MM/yyyy` format (e.g. `01/01/2025  →  31/12/2025`)
- Trailing icons: a calendar icon to open the picker; an ✕ clear button (`cancel` icon) when a value is set. **In `viewed='inline'` the edit chrome is flattened/hidden** (the text face is shown instead); the inline clear-× on the face is gated by `clearable`.
- Clicking the calendar icon opens a 2-month side-by-side calendar popup; user clicks start date, then end date — the range fills in
- When focused, both inputs share a single underline/outline (visually one field, not two)
- Helper-text shows as an info icon next to the label

## Standalone imports and table-filter usage

Every standalone host that uses `<sd-date-range>` must import `SdDateRange`. Projected label templates require `SdLabelDefDirective`.

```ts
import { Component } from '@angular/core';
import { SdTable, SdTableFilterDefDirective, SdTableOption } from '@sdcorejs/angular/components/table';
import { SdDateRange } from '@sdcorejs/angular/forms';
import { SdLabelDefDirective } from '@sdcorejs/angular/forms/directives';

@Component({
  standalone: true,
  imports: [SdTable, SdTableFilterDefDirective, SdDateRange, SdLabelDefDirective],
  template: `
    <sd-table [option]="tableOption">
      <ng-template sdTableFilterDef="createdAt" let-filter let-update="update">
        <sd-date-range size="sm" hideInlineError [(model)]="filter.createdAt" (sdChange)="update()"> </sd-date-range>
      </ng-template>
    </sd-table>
  `,
})
export class DateRangeFilterComponent {
  tableOption!: SdTableOption<unknown>;
}
```

Inside `<sd-table>` custom filters or compact cells, always use `size="sm"` and `hideInlineError`.

```html
<ng-template sdTableFilterDef="createdAt" let-filter let-update="update">
  <sd-date-range size="sm" hideInlineError [(model)]="filter.createdAt" (sdChange)="update()"> </sd-date-range>
</ng-template>
```

## Dense dashboard/filter usage

When this control is rendered in dashboard cards, filter bars, external filter panels, table toolbars, query bars, or other compact non-form surfaces, prefer `hideInlineError` so Material does not reserve the inline error/subscript row under the field. Pair it with `size="sm"` when the component supports `size`. Validation remains visible through the compact error icon/tooltip without increasing the control height, and the message is also exposed to assistive tech through a screen-reader-only element (`span.sd-visually-hidden`) referenced by `aria-describedby`.

```html
<sd-date-range size="sm" hideInlineError [(model)]="filter.createdAt"></sd-date-range>
```

## Examples

### 1. Filter by transaction date on a list page

```html
<sd-date-range
  [form]="filterForm"
  name="transactionDate"
  label="Khoảng ngày giao dịch"
  [(model)]="filter.transactionDate"
  (sdChange)="onFilterChange()">
</sd-date-range>
```

### 2. Required range with min/max boundaries

```html
<sd-date-range
  [form]="form"
  name="effectivePeriod"
  label="Hiệu lực"
  required
  min="TODAY"
  [max]="contractEndDate"
  [(model)]="model.effectivePeriod">
</sd-date-range>
```

### 3. Disabled (read-only-ish) display

```html
<sd-date-range label="Kỳ báo cáo" [model]="report.period" [disabled]="true"> </sd-date-range>
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

- Both range inputs carry `aria-invalid` / `aria-describedby`; the clear and calendar triggers are
  real `<button type="button">` elements with `aria-label` (they used to be bare `<sd-icon (click)>`).
- Both native range inputs use the valid HTML autocomplete token `off`; generated component ids are
  used only for element identity and are never exposed as autocomplete values.

## Anti-patterns

- ❌ Using `formControlName` / `[(ngModel)]` — not wired; use `[form]+[name]` and `[(model)]`.
- ❌ Passing `[bare]` — the input was removed; use `[viewed]="'inline'"` for the chip/inline editor (it flattens the field internally).
- ❌ Treating the model as two separate strings — it is `{ from, to }`. Splitting it across two `<sd-date>` defeats the purpose (no shared calendar, no aggregate validation).
- ❌ Mutating `model.from` / `model.to` directly — assign a new object literal so the `effect` re-runs.
- ❌ Using this for date-and-time intervals — neither end carries time. Use two `<sd-datetime>` if you need that.

## E2E test attributes

All five attributes live on the **`<mat-date-range-input>`** element — the single QA anchor for the whole control. The two inner date inputs retain their own per-side `data-autoid` (`-from` / `-to`) and are unchanged.

| Attribute            | Element                  | Values                      | Notes                                                                                                       |
| -------------------- | ------------------------ | --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `data-autoid`        | `<mat-date-range-input>` | `forms-date-range-<autoId>` | Present only when `[autoId]` input is provided. Prefix `forms-date-range-`.                                 |
| `data-disabled`      | `<mat-date-range-input>` | `"true"` / `"false"`        | Reflects `formControl.disabled`.                                                                            |
| `data-invalid`       | `<mat-date-range-input>` | `"true"` / `"false"`        | `"true"` when the aggregate control OR either endpoint control is invalid AND touched or dirty.             |
| `data-empty`         | `<mat-date-range-input>` | `"true"` / `"false"`        | `"true"` if `value` is `null` / `undefined`, OR if either `value.from` or `value.to` is missing / falsy.    |
| `data-value`         | `<mat-date-range-input>` | JSON string or `""`         | `sdSerializeDataValue` of the aggregate `{ from: Date, to: Date }` object. Empty string when value is null. |
| `data-required`      | `<mat-date-range-input>` | `"true"` / `"false"`        | Reflects `required` input; always present.                                                                  |
| `data-error-message` | `<mat-date-range-input>` | string                      | Present only when the component is currently showing an error tooltip message.                              |

> **Note**: `sd-date-range` does not support maxlength / minlength / pattern. No `data-maxlength`, `data-minlength`, or `data-pattern` attributes are emitted.

## Viewed / programmatic open

| API           | Type                  | Notes                                                                                                                                                                                                                                                                                              |
| ------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[clearable]` | `boolean`             | In `'inline'`, show a hover clear (cancel) icon on the text face. `false` where the host owns removal (chips). Default `true`.                                                                                                                                                                     |
| `[viewed]`    | `boolean \| 'inline'` | `false` edit · `true` static `<sd-view>` (`dd/MM/yyyy → dd/MM/yyyy`) · `'inline'` click-to-edit range picker (text retained until commit). Project `<ng-template #sdValue>` to override the display. Default `false`. (The old `[bare]` input was removed — inline flattens the field internally.) |
| `open()`      | method                | Programmatically opens the range picker panel (anchors to the trigger). Used by query-bar chip's auto-open after the user enters edit mode.                                                                                                                                                        |

`viewed` is now the only switch — the three states are mutually exclusive:

- `viewed=false` (default) → full editable form-field.
- `viewed=true` → text-only `<sd-view>`, no form-field.
- `viewed='inline'` → editable form-field stripped of outline/subscript/arrow (host gets `.sd-bare`) so it sits flush in a chip, fronted by a click-to-edit text face.

## Related

- `<sd-date>` — single-date picker
- `<sd-datetime>` — single date+time picker
- `<sd-chip-calendar>` — date with quick preset chips (Today, This week, …)
- `<sd-label>` — label primitive used internally
- `SdLabelDefDirective` — custom label projection
- `SD_FORM_CONFIGURATION` token — global default `appearance`
