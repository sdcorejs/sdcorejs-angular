# `<sd-date-range>`

**Type**: Component (form input)
**Selector**: `sd-date-range`
**Import path**: `@sdcorejs/angular/forms/date-range` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdDateRange`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Two-date range picker â€” user picks a start date AND an end date through a single 2-month calendar popup. Wraps Material `mat-date-range-picker` with SDCoreJS label/validators/min-max boundary support.

## When to use
- Filtering a list page by a date interval ("from" â†’ "to" â€” e.g. transaction date, hire date, posting period)
- Report parameter form needing a date interval
- Picking validity periods (effective-from / expiry-to) where both ends matter and must stay in sync
- DETAIL state where the saved range needs to be displayed (component still shows two read-only inputs unless you swap to plain text)

## When NOT to use
- Single-date selection â†’ use `<sd-date>`
- Date + time of a single moment â†’ use `<sd-datetime>`
- Quick preset chips ("Today", "This week", â€¦) on top of a list â†’ use `<sd-chip-calendar>`
- Multi-period or non-contiguous dates â†’ not supported â€” pick a different pattern
- Range bound to time-of-day (start-time / end-time) â€” this picker is date-only

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `autoId` | `string \| null \| undefined` | `undefined` | Generates `data-autoId="forms-date-range-<value>"` for E2E selectors. |
| `name` | `string` | random uuid | FormGroup control name when bound via `[form]`. The component also registers two internal sub-controls (random uuids) for the start/end inputs. |
| `size` | `Size` (`'sm' \| 'md' \| 'lg'`) | `'md'` | Field height. |
| `form` | `NgForm \| FormGroup \| undefined` | `undefined` | Parent form. NgForm is auto-unwrapped to its inner `FormGroup`. |
| `label` | `string \| undefined` | `undefined` | Field label (rendered via `<sd-label>`). |
| `helperText` | `string \| undefined` | `undefined` | Hint icon + tooltip in the label area. |
| `appearance` | `MatFormFieldAppearance` | from `SD_FORM_CONFIGURATION` ?? `'outline'` | Material form-field style. |
| `floatLabel` | `FloatLabelType` | `'auto'` | Material float-label behaviour. |
| `min` | `Date \| string \| 'TODAY'` | `undefined` | Earliest allowed start date. `'TODAY'` resolves to `new Date()`. |
| `max` | `Date \| string \| 'TODAY'` | `undefined` | Latest allowed end date. |
| `required` | `boolean` | `false` | Adds `Validators.required` to BOTH internal controls and the outer aggregate control. |
| `disabled` | `boolean` | `false` | Disables both date inputs and the picker trigger. |
| `hideInlineError` | `boolean` | `false` | Hide inline message; surfaces error via `errorTooltipMessage` instead. |
| `model` | `{ from?: string \| null; to?: string \| null } \| null \| undefined` | `undefined` | Two-way bound range value (use `[(model)]`). Both ends are ISO-style date strings (`yyyy/MM/dd`). |

> **Coerce**: `required`, `disabled`, `hideInlineError` use `booleanAttribute` â€” bare attribute = `true`.

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `sdChange` | `{ from, to } \| null` | Emitted on blur, Enter, picker-close, and clear. Same shape as `model`. |

## Content projection (slots)
- `<ng-template sdLabelDef>` â€” custom label rendering (replaces the plain `label` text). The component uses `SdLabelDefDirective` content child.

## Form integration
- **Does NOT implement `ControlValueAccessor`.** Forms use the SDCoreJS pattern: pass the parent form via `[form]="formGroup"` (or `[form]="ngForm"`) plus a `name`. On `ngOnInit`, the component calls `formGroup.addControl(name, formControl)` PLUS two internal start/end controls under random uuids for fine-grained validity. All three are removed in `ngOnDestroy`.
- **`formControlName` and `[(ngModel)]` are NOT supported.** Use `[(model)]` for two-way value binding and `[form]+[name]` for FormGroup integration.
- **No `[viewed]` flag** â€” unlike `<sd-date>`, `<sd-datetime>`, `<sd-input>` etc., this component has no DETAIL read-only mode. For read-only display, either set `[disabled]="true"` or render the formatted range as plain text outside the component.
- **Date adapter**: providers include `provideDateFnsAdapter` configured for `dd/MM/yyyy` parse/display. Internal storage in `control1`/`control2` uses native `Date` objects; the emitted `model` value is `{ from: 'yyyy/MM/dd', to: 'yyyy/MM/dd' }` strings.
- **Validators**: `[required]` adds `Validators.required` to both internal controls and the aggregate. Material picker auto-emits `matDatepickerMin` / `matDatepickerMax` errors when `min`/`max` are violated. Error tooltip messages: required â†’ "Vui lÃ²ng nháº­p thÃ´ng tin"; min â†’ "NgÃ y báº¯t Ä‘áº§u khÃ´ng há»£p lá»‡ (nhá» hÆ¡n giá»›i háº¡n)"; max â†’ "NgÃ y káº¿t thÃºc khÃ´ng há»£p lá»‡ (lá»›n hÆ¡n giá»›i háº¡n)".

## Public methods & getters

| Member | Kind | Description |
| --- | --- | --- |
| `errorTooltipMessage` | getter `string \| undefined` | Returns a Vietnamese error message for the first active error across `formControl`, `control1`, `control2` (`required`, `matDatepickerMin`, `matDatepickerMax`). `undefined` when valid. |
| `clear()` | method | Clears both `control1` and `control2` to `null`, resets the aggregate `formControl`, sets `valueModel` to `{ from: null, to: null }`, and emits `sdChange`. |
| `onEnter()` | event handler | Triggers `#emit()` then immediately emits `sdChange` with the current `valueModel`. Bound to `keyup.enter` on both date inputs. |
| `onFocus()` | event handler | Sets `#isFocus = true` and resets transient flags for enter/clear/model-change tracking. |
| `onBlur()` | event handler | Sets `#isFocus = false`, triggers `#emit()`, then emits `sdChange` asynchronously if the model changed but was not already emitted by Enter or clear. |
| `onClosePicker()` | event handler | Emits `sdChange` with the current `valueModel` when the range picker popup closes. |
| `onOpenPicker($event)` | event handler | Stops click propagation and opens the picker if `formControl` is not disabled. |
| `onStartChange(event)` | event handler | Triggers `#emit()` when the start-date input fires `(dateInput)` and the field is not focused. |
| `onEndChange(event)` | event handler | Triggers `#emit()` when the end-date input fires `(dateInput)` and the field is not focused. |
| `formControl` | `FormControl` | Aggregate reactive control registered into the parent `FormGroup` under `name`. Holds `{ from: Date, to: Date }` as value. |
| `control1` | `FormControl` | Internal reactive control for the start date (native `Date` value). Registered under a random uuid in the parent form. |
| `control2` | `FormControl` | Internal reactive control for the end date (native `Date` value). Registered under a random uuid in the parent form. |
| `resolvedMin()` | computed `Date \| null` | Resolved `min` boundary â€” parses the `min` input string / Date / `'TODAY'` into a `Date`. |
| `resolvedMax()` | computed `Date \| null` | Resolved `max` boundary â€” parses the `max` input string / Date / `'TODAY'` into a `Date`. |

## Visual cues (helps agent map screenshots â†’ component)
- A single Material outlined field with TWO date inputs side-by-side separated by an "â†’" / dash, each in `dd/MM/yyyy` format (e.g. `01/01/2025  â†’  31/12/2025`)
- Trailing icons: a calendar icon to open the picker; an âœ• clear button when a value is set
- Clicking the calendar icon opens a 2-month side-by-side calendar popup; user clicks start date, then end date â€” the range fills in
- When focused, both inputs share a single underline/outline (visually one field, not two)
- Helper-text shows as an info icon next to the label

## Examples

### 1. Filter by transaction date on a list page
```html
<sd-date-range
  [form]="filterForm" name="transactionDate"
  label="Khoáº£ng ngÃ y giao dá»‹ch"
  [(model)]="filter.transactionDate"
  (sdChange)="onFilterChange()">
</sd-date-range>
```

### 2. Required range with min/max boundaries
```html
<sd-date-range
  [form]="form" name="effectivePeriod"
  label="Hiá»‡u lá»±c" required
  min="TODAY" [max]="contractEndDate"
  [(model)]="model.effectivePeriod">
</sd-date-range>
```

### 3. Disabled (read-only-ish) display
```html
<sd-date-range
  label="Ká»³ bÃ¡o cÃ¡o"
  [model]="report.period"
  [disabled]="true">
</sd-date-range>
```

## Anti-patterns
- âŒ Using `formControlName` / `[(ngModel)]` â€” not wired; use `[form]+[name]` and `[(model)]`.
- âŒ Trying `[viewed]="true"` â€” no such input on this component. Use `[disabled]` or render plain text.
- âŒ Treating the model as two separate strings â€” it is `{ from, to }`. Splitting it across two `<sd-date>` defeats the purpose (no shared calendar, no aggregate validation).
- âŒ Mutating `model.from` / `model.to` directly â€” assign a new object literal so the `effect` re-runs.
- âŒ Using this for date-and-time intervals â€” neither end carries time. Use two `<sd-datetime>` if you need that.

## Related
- `<sd-date>` â€” single-date picker
- `<sd-datetime>` â€” single date+time picker
- `<sd-chip-calendar>` â€” date with quick preset chips (Today, This week, â€¦)
- `<sd-label>` â€” label primitive used internally
- `SdLabelDefDirective` â€” custom label projection
- `SD_FORM_CONFIGURATION` token â€” global default `appearance`

