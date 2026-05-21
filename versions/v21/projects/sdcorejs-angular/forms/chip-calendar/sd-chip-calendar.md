# `<sd-chip-calendar>`

**Type**: Component (form input)
**Selector**: `sd-chip-calendar`
**Import path**: `@sdcorejs/angular/forms/chip-calendar` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdChipCalendar`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Multi-date picker rendered as chips â€” user opens a calendar popup and toggles individual dates; each selected date appears as a removable chip in the field. Uses Material `mat-chips` + `mat-calendar` inside a `mat-menu`.

## When to use
- Selecting an arbitrary set of dates (multiple, non-contiguous), e.g. holidays, training days, off-days
- Where a date RANGE is not appropriate (gaps allowed)
- DETAIL state needing read-only chip strip via `[viewed]`

## When NOT to use
- A single date â†’ use `<sd-date>`
- A start/end range â†’ use `<sd-date-range>`
- Free-text date strings â†’ use `<sd-input>`
- Selecting time-of-day â†’ use `<sd-datetime>`

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `autoId` | `string \| undefined` | `undefined` | Forwarded for E2E hooks. |
| `name` | `string \| undefined` | random uuid | Control name registered into `[form]`. |
| `appearance` | `MatFormFieldAppearance` | `'outline'` | Material form-field style. |
| `floatLabel` | `FloatLabelType` | `'auto'` | When the label floats. |
| `size` | `Size` (`'sm' \| 'md' \| 'lg'`) | `'md'` | Field height. |
| `form` | `NgForm \| FormGroup \| undefined` | `undefined` | Parent form; NgForm auto-unwrapped. |
| `label` | `string` | `''` | Field label. |
| `placeholder` | `string \| undefined` | `undefined` | Placeholder for the trigger area. |
| `removable` | `boolean \| ((item:any) => boolean)` | `true` | Whether a chip shows the âœ• button (or per-item predicate). |
| `model` | `(string \| number)[] \| undefined` | `undefined` | Current selected dates as `'yyyy/MM/dd'` strings (one-way input â€” pair with `(modelChange)`). |
| `min` | `number` | `0` | When > 0, adds `Validators.minLength(min)` (count of dates). |
| `max` | `number` | `0` | When > 0, adds `Validators.maxLength(max)` (count of dates). |
| `required` | `boolean` | `false` | Adds `Validators.required`. |
| `disabled` | `boolean` | `false` | Disables interaction. |
| `viewed` | `boolean` | `false` | DETAIL read-only mode. |
| `hideInlineError` | `boolean` | `false` | Hide inline error; expose via `errorTooltipMessage`. |
| `hyperlink` | `string \| null \| undefined` | `undefined` | Used in `[viewed]` mode for clickable chips. |

> **Coerce**: `required`, `disabled`, `viewed`, `hideInlineError` use `booleanAttribute` â€” bare attribute = `true`.

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `modelChange` | `any[]` | Emits the new array of date strings on toggle/remove/clear. |
| `sdChange` | `any[]` | SDCoreJS-standard change event (same payload). |

## Content projection (slots)
- `#sdLabel` template â€” custom label
- `#sdValue` template â€” custom chip value rendering
- `<ng-template sdLabelDef>` â€” alternate label
- `<ng-template sdViewDef>` â€” read-only display template used in `[viewed]` mode

## Form integration
- **Does NOT implement `ControlValueAccessor`.** Standard SDCoreJS pattern: `[form]+[name]` registers the internal `FormControl` into the parent group on `ngAfterViewInit`.
- **`formControlName` and `[(ngModel)]` are NOT supported.** Use `[model]` + `(modelChange)` (or `[(model)]`) and `[form]+[name]`.
- **`[viewed]="true"`** = read-only chip strip (no calendar trigger, no âœ•).
- **Validators**: `[required]`, `[min]` (`minLength`), `[max]` (`maxLength`). Tooltip messages mirror `<sd-chip>`.

## Chip / value structure
Values are date strings formatted `'yyyy/MM/dd'` (produced internally via `DateUtilities.toFormat(date, 'yyyy/MM/dd')`). The component does not emit `Date` objects. Toggling a previously-selected date removes it from the array.

> **Display vs. storage**: chips render the stored `'yyyy/MM/dd'` string through Angular's `date` pipe as `'dd/MM/yyyy'` (e.g. stored `2026/05/09` â†’ displayed `09/05/2026`). The emitted `modelChange` array always contains the `'yyyy/MM/dd'` storage format.

> **Date adapter**: the component uses `MatNativeDateModule` (no date-fns adapter). Do **not** provide `provideDateFnsAdapter()` â€” it is not required and will conflict.

## Visual cues (helps agent map screenshots â†’ component)
- Outlined input box showing one rounded-pill chip per selected date (e.g. `2026/05/09`), each with a âœ•
- A trailing calendar icon opens a `mat-menu` containing a Material `mat-calendar`
- Inside the calendar, currently-selected dates are highlighted with the `sd-chip-calendar-selected-date` class
- Clicking a date in the calendar toggles it (add if absent, remove if present)
- âœ• button at the far right clears all selected dates
- In `[viewed]` mode: chip strip only â€” no calendar trigger, no âœ•

## Examples

### 1. Off-days picker
```html
<sd-chip-calendar
  [form]="form" name="offDays"
  label="NgÃ y nghá»‰"
  [(model)]="model.offDays"
  [min]="1" [max]="20"
  required>
</sd-chip-calendar>
```

### 2. DETAIL read-only display
```html
<sd-chip-calendar
  label="NgÃ y nghá»‰"
  [model]="model.offDays"
  [viewed]="true">
</sd-chip-calendar>
```

### 3. Custom remove predicate (lock past dates)
```ts
canRemove = (d: string) => new Date(d.replaceAll('/', '-')) >= new Date();
```
```html
<sd-chip-calendar
  [form]="form" name="trainingDates"
  label="NgÃ y training"
  [(model)]="model.trainingDates"
  [removable]="canRemove">
</sd-chip-calendar>
```

## Anti-patterns
- âŒ Using `formControlName` or `[(ngModel)]` â€” not wired.
- âŒ Mutating the `model` array in place â€” pass a new reference.
- âŒ Storing `Date` objects instead of `'yyyy/MM/dd'` strings â€” values are normalized to that format and string equality is used for toggle.
- âŒ Using `<sd-chip-calendar>` for a date range â€” use `<sd-date-range>` for contiguous start/end.
- âŒ Using `[disabled]` instead of `[viewed]` for DETAIL state.

## Related
- `<sd-date>` â€” single date
- `<sd-date-range>` â€” start/end range
- `<sd-datetime>` â€” date + time
- `<sd-chip>` â€” text/number multi-value tags

