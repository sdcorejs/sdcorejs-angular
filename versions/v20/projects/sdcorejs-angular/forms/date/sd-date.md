�# `<sd-date>`

**Type**: Component (form input)
**Selector**: `sd-date`
**Import path**: `@sdcorejs/angular/forms/date` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdDate`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Single-date picker � Material datepicker with date-fns adapter (`dd/MM/yyyy` parse/display) plus SDCoreJS form-group registration, `[viewed]` read-only mode, and built-in min/max date validation messages.

## When to use
- Any single date field (birth date, expiry date, effective date)
- Inside a `<form>` group with reactive validation (required + min/max bounds)
- DETAIL state read-only via `[viewed]="true"`

## When NOT to use
- Date RANGE (start + end) �  use `<sd-date-range>`
- Multi-date selection �  use `<sd-chip-calendar>`
- Date + time combined �  use `<sd-datetime>`

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `autoId` | `string \| null \| undefined` | `undefined` | Generates `data-autoId="forms-date-<value>"` for E2E hooks. |
| `name` | `string` | random uuid | Control name registered into `[form]`. |
| `size` | `Size` (`'sm' \| 'md' \| 'lg'`) | `'md'` | Field height. |
| `form` | `FormGroup \| NgForm \| undefined` | `undefined` | Parent form. NgForm auto-unwrapped. Object containing a `.form` is also accepted. |
| `label` | `string \| undefined` | `undefined` | Field label. |
| `helperText` | `string \| undefined` | `undefined` | Hint under field. |
| `placeholder` | `string \| undefined` | `undefined` | Placeholder when empty. |
| `appearance` | `MatFormFieldAppearance` | from `SD_FORM_CONFIGURATION` ?? `'outline'` | Material form-field style. |
| `floatLabel` | `FloatLabelType` | `'auto'` | When the label floats. |
| `min` / `minDate` | `Date \| string \| 'TODAY' \| undefined` | `undefined` | Minimum allowed date. `'TODAY'` resolves to `new Date()`. Either alias works. |
| `max` / `maxDate` | `Date \| string \| 'TODAY' \| undefined` | `undefined` | Maximum allowed date. `'TODAY'` resolves to `new Date()`. |
| `required` | `boolean` | `false` | Adds `Validators.required`. |
| `disabled` | `boolean` | `false` | Disables the field. |
| `viewed` | `boolean` | `false` | DETAIL read-only mode � input hidden, formatted date (or `<ng-template sdViewDef>`) rendered. |
| `hideInlineError` | `boolean` | `false` | Hide inline error; expose via `errorMessage`. |
| `inlineError` | `string \| undefined` | `undefined` | Forces an inline error message. |
| `hyperlink` | `string \| null \| undefined` | `undefined` | Used in `[viewed]` mode to render the date as a link. |
| `model` | `string \| number \| Date \| null \| undefined` | `undefined` | Two-way bound value (use `[(model)]`). Persisted as `'yyyy/MM/dd'` string internally. |

> **Coerce**: `required`, `disabled`, `viewed`, `hideInlineError` use `booleanAttribute` � bare attribute = `true`.

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `sdChange` | `any` | Emits the new value as `'yyyy/MM/dd'` string (or `null` when cleared / on parse error). |
| `sdFocus` | `void` | Emits when the input is focused. |

## Host classes
Applied automatically on `<sd-date>` for styling hooks:

| Class | Condition | Effect |
| --- | --- | --- |
| `sd-has-label` | `[label]` is truthy | Adds `padding-top: 4px` so the floating label has room and is not clipped. Absent �  no top padding. |
| `sd-viewed` | `[viewed]="true"` | Removes top padding (read-only text only). Overrides `sd-has-label` when both are set (source order). |
| `sd-bare` | `[bare]="true"` | Strips the mat-form-field shell for inline contexts (chip, token). |

## Content projection (slots)
- `#sdLabel` template � custom label
- `#sdValue` template � custom value rendering
- `<ng-template sdLabelDef>` � alternate label
- `<ng-template sdViewDef>` � read-only display template used in `[viewed]` mode

## Form integration
- **Does NOT implement `ControlValueAccessor`.** Standard SDCoreJS pattern: pass `[form]` + `name`, the internal `SdFormControl` registers into the group on `ngOnInit`.
- **`formControlName` and `[(ngModel)]` are NOT supported.** Use `[(model)]` for two-way binding and `[form]+[name]` for FormGroup integration.
- **`[viewed]="true"`** = DETAIL read-only mode: input + calendar icon are hidden, the formatted date (or `<ng-template sdViewDef>`) is shown. With `hyperlink` it renders a clickable link.
- **Date adapter**: providers include `provideDateFnsAdapter` configured for `dd/MM/yyyy` parse/display. Internal storage uses native `Date` objects; emitted values are `'yyyy/MM/dd'` strings.
- **Validators**: `[required]` adds `Validators.required`. `[min]` / `[max]` flow into Material's `matDatepickerMin` / `matDatepickerMax` validators. Manual typed text is regex-validated (`dd/MM/yyyy`) and bad input sets a synthetic `date: 'Sai ��9nh dạng'` error. `[inlineError]` injects a synthetic `inlineError` validator. `errorMessage` gives Vietnamese messages for each error key.

## Public methods & getters

| Member | Kind | Description |
| --- | --- | --- |
| `errorMessage` | getter `string \| undefined` | Returns a Vietnamese error message for the first active error on `formControl` (`required`, `matDatepickerMin`, `matDatepickerMax`, `date`, `inlineError`). `undefined` when valid. |
| `clear($event)` | method | Stops propagation, nulls `formControl` value, updates `valueModel`, and emits `sdChange(null)`. No-op if the control is already empty. |
| `focus()` | method | Programmatically focuses the native input and opens the datepicker popup (deferred 100 ms). |
| `blur()` | method | Programmatically blurs the native input. |
| `focusInputElement()` | method | Focuses the native `<input>` without opening the picker. |
| `onFocus()` | event handler | Sets `isFocused = true` and emits `sdFocus`. |
| `onBlur()` | event handler | Sets `isFocused = false`. |
| `formControl` | `SdFormControl` | Underlying reactive control. Accessible for direct validator inspection in tests. |
| `isFocused` | `boolean` | Current focus state (drives CSS classes and view-def toggle). |

## Visual cues (helps agent map screenshots �  component)
- Outlined input field showing `DD/MM/YYYY` formatted date
- Trailing calendar icon button �  opens Material datepicker popup
- Slim clear-button (`.sd-clear-btn` � round transparent button with a thin `close` icon, grey �  red on hover) when a value is set and the field is not `required`/`disabled`; shown alongside the calendar icon, suppresses parent click. **Hover-gated** (`sd-hover`) � hidden until the field is hovered or focused. Emits `sdChange(null)` on clear. Shared style with `sd-input`/`sd-input-number`/`sd-input-color`/`sd-datetime` (`assets/scss/core/form.scss`).
- Min/max enforcement: dates outside the range are greyed-out and unselectable in the popup
- Format error: red underline + tooltip "Sai ��9nh dạng" while the typed text doesn't match `D/M/YYYY` regex
- In `[viewed]="true"` mode: no input, no icon � plain formatted date or hyperlink

## Examples

### 1. Birth-date inside a reactive form
```html
<sd-date
  [form]="form" name="dob"
  label="Ngày sinh"
  [(model)]="model.dob"
  max="TODAY"
  required
  (sdChange)="onDobChange($event)">
</sd-date>
```

### 2. Date range guard via min/max
```html
<sd-date
  [form]="form" name="effectiveDate"
  label="Ngày hi�!u lực"
  [min]="contract.startDate"
  [max]="contract.endDate"
  [(model)]="model.effectiveDate"
  required>
</sd-date>
```

### 3. DETAIL read-only with hyperlink
```html
<sd-date
  label="Ngày tạo"
  [model]="model.createdAt"
  [viewed]="true"
  hyperlink="/audit/{{ model.id }}">
</sd-date>
```

## E2E test attributes

Rendered on the inner `<input>` element (same anchor as `data-autoid`):

| Attribute | Value | Source |
|---|---|---|
| `data-autoid` | `forms-date-<autoId>` | input `autoId` |
| `data-disabled` | `"true"` / `"false"` | `formControl.disabled` |
| `data-invalid` | `"true"` / `"false"` | `formControl.invalid && (touched \|\| dirty)` |
| `data-empty` | `"true"` / `"false"` | `sdIsEmpty(formControl.value)` |
| `data-value` | string | `sdSerializeDataValue(formControl.value)` |
| `data-required` | `"true"` / `"false"` | `required` input; always present |
| `data-error-message` | string | present only when the component is currently showing an error tooltip message |

> **Note**: `sd-date` does not support maxlength / minlength / pattern. No `data-maxlength`, `data-minlength`, or `data-pattern` attributes are emitted.

Selector example:

```ts
const el = page.locator('[data-autoid="forms-date-hireDate"]');
await expect(el).toHaveAttribute('data-empty', 'false');
await expect(el).toHaveAttribute('data-required', 'true');
```

## Anti-patterns
- �R Using `formControlName` / `[(ngModel)]` � not wired; use `[(model)]` + `[form]+[name]`.
- �R Setting `model` to a moment object � pass `Date`, ISO string, or `'yyyy/MM/dd'` string. Component normalizes via `DateUtilities`.
- �R Trying `[disabled]` for DETAIL state � use `[viewed]="true"` for the proper read-only visual.
- �R Bypassing `min`/`max` and validating manually � built-in validators surface localized tooltip messages.
- �R Using `<sd-date>` for a date+time field � switch to `<sd-datetime>`.

## Related
- `<sd-date-range>` � start/end pair
- `<sd-datetime>` � date + time
- `<sd-chip-calendar>` � multi-date chip strip
- `<sd-input>` � free text fallback
- `SD_FORM_CONFIGURATION` token � global default `appearance`

