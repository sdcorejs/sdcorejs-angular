# `<sd-datetime>`

**Type**: Component (form input)
**Selector**: `sd-datetime`
**Import path**: `@sdcorejs/angular/forms/datetime` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdDatetime`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Single date + time-of-day picker — user picks a calendar date AND an `HH:mm` (optionally `HH:mm:ss`) time in a CDK Overlay popup. Uses `provideDateFnsAdapter` with SDCoreJS label, validators, and `[viewed]` read-only support.

## When to use
- Capturing a precise moment (start time of a meeting, scheduled job, posting timestamp)
- Audit-trail fields that need both date and time (created at, approved at)
- Form fields where the user expects to see and edit minutes — NOT just a date
- DETAIL state via `[viewed]="true"` to render the formatted datetime (or a hyperlink)

## When NOT to use
- Date only (no time) → use `<sd-date>`
- A range of dates → use `<sd-date-range>`
- Time-only (no date) → not supported by this component
- Read-only display where the input chrome should disappear → use `[viewed]="true"` (preferred over `[disabled]`)

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `autoId` | `string \| null \| undefined` | `undefined` | Generates `data-autoId="forms-datetime-<value>"` for E2E selectors. |
| `name` | `string` | random uuid | FormGroup control name when bound via `[form]`. |
| `size` | `Size` (`'sm' \| 'md' \| 'lg'`) | `'md'` | Field height. Use `size="sm"` inside `<sd-table>` filters/cells or other dense table UI. |
| `form` | `NgForm \| FormGroup \| undefined` | `undefined` | Parent form. NgForm is auto-unwrapped to its inner `FormGroup`. |
| `label` | `string \| undefined` | `undefined` | Field label (rendered via `<sd-label>`). |
| `helperText` | `string \| undefined` | `undefined` | Hint text near the label. |
| `placeholder` | `string \| undefined` | `undefined` | Placeholder when empty. |
| `appearance` | `MatFormFieldAppearance` | from `SD_FORM_CONFIGURATION` ?? `'outline'` | Material form-field style. |
| `floatLabel` | `FloatLabelType` | `'auto'` | Material float-label behaviour. |
| `min` / `minDate` | `Date \| string \| 'TODAY'` | `undefined` | Earliest allowed datetime. Both aliases accepted; `'TODAY'` resolves to `new Date()`. |
| `max` / `maxDate` | `Date \| string \| 'TODAY'` | `undefined` | Latest allowed datetime. |
| `hyperlink` | `string \| null \| undefined` | `undefined` | Render value as a link in `[viewed]` mode. |
| `required` | `boolean` | `false` | Adds `Validators.required`. |
| `disabled` | `boolean` | `false` | Disables input + picker trigger. |
| `viewed` | `boolean \| 'inline'` | `false` | Display mode. `false` edit · `true` static DETAIL (formatted datetime / `sdViewDef`) · `'inline'` click-to-edit (text face → click opens the datetime overlay; text retained until commit; hover clear-× gated by `clearable`). Disabled `'inline'` → static view. |
| `clearable` | `boolean` | `true` | In `'inline'`, show a hover clear-× on the text face. `false` where the host owns removal (chips). |
| `hideInlineError` | `boolean` | `false` | Hide inline message; surfaces error as a tooltip via `errorMessage`. |
| `inlineError` | `string \| undefined` | `undefined` | Forces an inline error message (synthetic `inlineError` validator). |
| `model` | `string \| number \| Date \| null \| undefined` | `undefined` | Two-way bound value (use `[(model)]`). Stored / emitted as `yyyy/MM/dd HH:mm:ss` string (or `yyyy/MM/dd HH:mm:00` when `showSeconds = false`). |
| `showSeconds` | `boolean` | `false` | When `true`, displays and stores seconds in the popup spinner and the stored/emitted format. |

> **Coerce**: `required`, `disabled`, `viewed`, `hideInlineError`, `showSeconds` use `booleanAttribute` — bare attribute = `true`.

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `sdChange` | `string \| null` | Emitted when picker confirms a new value or when the field is cleared. |
| `sdFocus` | `void` | Fires when the input element gains focus. |

## Host classes
Applied automatically on `<sd-datetime>` for styling hooks:

| Class | Condition | Effect |
| --- | --- | --- |
| `sd-has-label` | `[label]` is truthy | Adds `padding-top: 4px` so the floating label has room and is not clipped. Absent → no top padding. |
| `sd-viewed` | `[viewed]="true"` | Removes top padding (read-only text only). Overrides `sd-has-label` when both are set (source order). |
| `sd-bare` | (internal — set by `viewed='inline'`) | Flattens the mat-form-field shell for the inline editor. **No longer a public `[bare]` input** (removed); driven by `isInline()`. |

## Content projection (slots)
- `#sdLabel` template — custom label rendering
- `#sdValue` template — custom display rendering inside the field
- `<ng-template sdViewDef>` — read-only display template used in `[viewed]` mode

## Form integration
- **Does NOT implement `ControlValueAccessor`.** Forms use the SDCoreJS pattern: pass the parent form via `[form]="formGroup"` (or `[form]="ngForm"`) plus a `name`. On `ngOnInit`, the component calls `formGroup.addControl(name, formControl)` and removes it in `ngOnDestroy`.
- **`formControlName` and `[(ngModel)]` are NOT supported.** Use `[(model)]` for two-way value binding and `[form]+[name]` for FormGroup integration.
- **`[viewed]="true"`** flips into DETAIL read-only mode: the input is hidden and the value (or `<ng-template sdViewDef>`) is rendered. If `hyperlink` is set, the value renders as a link.
- **Validators**: `[required]` adds `Validators.required`. `[inlineError]="msg"` injects a synthetic error and shows `msg`. The picker emits its own `matDatepickerMin` / `matDatepickerMax` errors (via the min/max bounds on `<input>`). Direct text entry validates against `dd/MM/yyyy HH:mm` (and `dd/MM/yyyy HH:mm:ss`) regex — bad format sets a synthetic `date: 'Sai định dạng'` error. Error tooltip messages: required → "Vui lòng nhập thông tin"; min → "Ngày nhỏ nhất: <localized>"; max → "Ngày lớn nhất: <localized>"; bad format → "Sai định dạng"; `inlineError` → the provided message.
- **Date adapter**: `provideDateFnsAdapter` configured with `dd/MM/yyyy HH:mm` parse/display. Internally native `Date` objects are used; emitted/stored values are `yyyy/MM/dd HH:mm:ss` strings (or `yyyy/MM/dd HH:mm:00` when `showSeconds = false`).

## Public methods & getters

| Member | Kind | Description |
| --- | --- | --- |
| `errorMessage` | getter `string \| undefined` | Returns a Vietnamese error message for the first active error on `formControl` (`required`, `matDatepickerMin`, `matDatepickerMax`, `date`, `customValidator`, `inlineError`). `undefined` when valid. |
| `open()` | method | Opens the CDK Overlay datetime picker popup anchored to the component. No-op if already open or disabled. |
| `close()` | method | Closes the popup overlay. |
| `clear($event)` | method | Stops propagation, resets `formControl` and `valueModel` to `null`, emits `sdChange(null)`. No-op if control is already empty. |
| `focus()` | method | Programmatically focuses the native input and opens the picker (deferred 100 ms). |
| `blur()` | method | Programmatically blurs the native input. |
| `focusInputElement()` | method | Focuses the native `<input>` without opening the picker. |
| `onFocus()` | event handler | Sets `isFocused = true` and emits `sdFocus`. |
| `onBlur()` | event handler | Sets `isFocused = false`. |
| `onConfirmInput($event)` | event handler | Validates typed text against `dd/MM/yyyy HH:mm[ss]` regex on blur/enter; syncs back to `valueModel` and emits `sdChange` when valid. |
| `formControl` | `SdFormControl` | Underlying reactive control. Accessible for direct validator inspection in tests. |
| `pickerOpened` | `Signal<boolean>` | `true` while the CDK Overlay popup is open. |
| `isFocused` | `boolean` | Current focus state (drives CSS classes). |

## Visual cues (helps agent map screenshots → component)
- An outlined input field with a single calendar+clock icon on the trailing side
- The text inside reads as `dd/MM/yyyy HH:mm` (e.g. `09/05/2026 14:30`)
- Clicking the icon opens a popup: a month-grid calendar on top, a time picker (hours + minutes spinner/slider) below
- A slim clear-button (`.sd-clear-btn` — round transparent button with a thin `close` icon, grey → red on hover) appears next to the calendar icon when a value is set and the field is not `required`/`disabled`; clears via `clear()` (emits `sdChange(null)`). **Hover-gated** (`sd-hover`) — hidden until the field is hovered or focused. Shared style with `sd-input`/`sd-input-number`/`sd-input-color`/`sd-date` (`assets/scss/core/form.scss`). **Not rendered in `[bare]` mode** — bare is "value + caret only" for inline chip contexts where the clear-x duplicated the chip's own remove-× and could clear the value when dismissing the picker.
- In `[viewed]="true"` mode: no input chrome — just the formatted datetime as plain text (or as a hyperlink if `hyperlink` is set)

## Examples

### 1. Simple required datetime
```html
<sd-datetime
  [form]="form" name="postingDateTime"
  label="Thời điểm hạch toán"
  required
  [(model)]="model.postingDateTime">
</sd-datetime>
```

### 2. With min/max boundaries
```html
<sd-datetime
  [form]="form" name="meetingStart"
  label="Bắt đầu cuộc họp"
  min="TODAY" [max]="meetingEnd"
  [(model)]="model.meetingStart"
  (sdChange)="onMeetingStartChange($event)">
</sd-datetime>
```

### 3. DETAIL state read-only with hyperlink
```html
<sd-datetime
  label="Tạo lúc"
  [model]="row.createdAt"
  [viewed]="true"
  hyperlink="/audit/{{ row.id }}">
</sd-datetime>
```

## E2E test attributes

Rendered on the inner `<input>` element (same anchor as `data-autoid`):

| Attribute | Value | Source |
|---|---|---|
| `data-autoid` | `forms-datetime-<autoId>` | input `autoId` |
| `data-disabled` | `"true"` / `"false"` | `formControl.disabled` |
| `data-invalid` | `"true"` / `"false"` | `formControl.invalid && (touched \|\| dirty)` |
| `data-empty` | `"true"` / `"false"` | `sdIsEmpty(formControl.value)` |
| `data-value` | string | `sdSerializeDataValue(formControl.value)` |
| `data-required` | `"true"` / `"false"` | `required` input; always present |
| `data-error-message` | string | present only when the component is currently showing an error tooltip message |

> **Note**: `sd-datetime` does not support maxlength / minlength / pattern. No `data-maxlength`, `data-minlength`, or `data-pattern` attributes are emitted.

Selector example:

```ts
const el = page.locator('[data-autoid="forms-datetime-createdAt"]');
await expect(el).toHaveAttribute('data-empty', 'false');
await expect(el).toHaveAttribute('data-required', 'false');
```

## Anti-patterns
- ❌ Using `formControlName` / `[(ngModel)]` — not wired; use `[form]+[name]` and `[(model)]`.
- ❌ Using `[disabled]="true"` to express read-only DETAIL state — use `[viewed]="true"` instead so labels/links render correctly.
- ❌ Storing the model as a `Date` object — the component normalizes to `yyyy/MM/dd HH:mm:ss` strings on emit; treat the value as a string.
- ❌ Setting both `min`/`minDate` (and `max`/`maxDate`) at the same time — they are aliases; pick one.
- ❌ Using this when only date matters — `<sd-date>` is simpler and avoids confusing users with an irrelevant time picker.

## Related
- `<sd-date>` — date-only picker
- `<sd-date-range>` — two-date range picker
- `<sd-chip-calendar>` — date with quick preset chips
- `<sd-label>` — label primitive used internally
- `SdViewDefDirective` — DETAIL-mode template projection
- `SD_FORM_CONFIGURATION` token — global default `appearance`
