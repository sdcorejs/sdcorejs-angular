# `<sd-chip-calendar>`

**Type**: Component (form input)
**Selector**: `sd-chip-calendar`
**Import path**: `@sdcorejs/angular/forms/chip-calendar` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdChipCalendar`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Multi-date picker rendered as chips — user opens a calendar popup and toggles individual dates; each selected date appears as a removable chip in the field. Uses Material `mat-chips` + `mat-calendar` inside a `mat-menu`.

## When to use
- Selecting an arbitrary set of dates (multiple, non-contiguous), e.g. holidays, training days, off-days
- Where a date RANGE is not appropriate (gaps allowed)
- DETAIL state needing read-only chip strip via `[viewed]`

## When NOT to use
- A single date → use `<sd-date>`
- A start/end range → use `<sd-date-range>`
- Free-text date strings → use `<sd-input>`
- Selecting time-of-day → use `<sd-datetime>`

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `autoId` | `string \| undefined` | `undefined` | Forwarded for E2E hooks. |
| `name` | `string \| undefined` | random uuid | Control name registered into `[form]`. |
| `appearance` | `MatFormFieldAppearance` | `'outline'` | Material form-field style. |
| `floatLabel` | `FloatLabelType` | `'auto'` | When the label floats. |
| `size` | `Size` (`'sm' \| 'md' \| 'lg'`) | `'md'` | Field height. Use `size="sm"` inside `<sd-table>` filters/cells or other dense table UI. |
| `form` | `NgForm \| FormGroup \| undefined` | `undefined` | Parent form; NgForm auto-unwrapped. |
| `label` | `string` | `''` | Field label. |
| `placeholder` | `string \| undefined` | `undefined` | Placeholder for the trigger area. |
| `removable` | `boolean \| ((item:any) => boolean)` | `true` | Whether a chip shows the ✕ button (or per-item predicate). |
| `model` | `(string \| number)[] \| undefined` | `undefined` | Current selected dates as `'yyyy/MM/dd'` strings (one-way input — pair with `(modelChange)`). |
| `min` | `number` | `0` | When > 0, adds `Validators.minLength(min)` (count of dates). |
| `max` | `number` | `0` | When > 0, adds `Validators.maxLength(max)` (count of dates). |
| `required` | `boolean` | `false` | Adds `Validators.required`. |
| `disabled` | `boolean` | `false` | Disables interaction. |
| `viewed` | `boolean \| 'inline'` | `false` | Display mode. `false` = edit. `true` = static read-only `<sd-view>`. `'inline'` = the editable chip strip stays mounted (chips are already compact, no separate face); a **disabled** `'inline'` falls back to `true` (static). |
| `hideInlineError` | `boolean` | `false` | Hide inline error; expose via `errorMessage`. |
| `hyperlink` | `string \| null \| undefined` | `undefined` | Used in static `[viewed]` mode for clickable chips. |

> **Coerce**: `required`, `disabled`, `hideInlineError` use `booleanAttribute` — bare attribute = `true`. `viewed` uses the shared `sdViewedTransform` (also accepts the literal `'inline'`); computed `isViewed()` (`true`, or disabled `'inline'`) drives the static `<sd-view>` branch and the host `.sd-viewed` class.

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `modelChange` | `any[]` | Emits the new array of date strings on toggle/remove/clear. |
| `sdChange` | `any[]` | SDCoreJS-standard change event (same payload). |

## Host classes
Applied automatically on `<sd-chip-calendar>` for styling hooks:

| Class | Condition | Effect |
| --- | --- | --- |
| `sd-has-label` | `[label]` is truthy | Adds `padding-top: 4px` so the floating label has room and is not clipped. Absent → no top padding. |
| `sd-viewed` | `isViewed()` — `[viewed]="true"`, or disabled `[viewed]="'inline'"` | Removes top padding (read-only text only). Overrides `sd-has-label` when both are set (source order). |

## Content projection (slots)
- `#sdLabel` template — custom label
- `#sdValue` template — custom chip value rendering
- `<ng-template sdLabelDef>` — alternate label
- `<ng-template sdViewDef>` — read-only display template used in `[viewed]` mode

## Form integration
- **Does NOT implement `ControlValueAccessor`.** Standard SDCoreJS pattern: `[form]+[name]` registers the internal `FormControl` into the parent group on `ngAfterViewInit`.
- **`formControlName` and `[(ngModel)]` are NOT supported.** Use `[model]` + `(modelChange)` (or `[(model)]`) and `[form]+[name]`.
- **`[viewed]="true"`** = read-only chip strip (no calendar trigger, no ✕).
- **`[viewed]="'inline'"`** keeps the editable chip strip + calendar trigger mounted (no separate read-only face); a **disabled** `'inline'` collapses to the static `<sd-view>`.
- **Validators**: `[required]`, `[min]` (`minLength`), `[max]` (`maxLength`). Tooltip messages mirror `<sd-chip>`.

## Chip / value structure
Values are date strings formatted `'yyyy/MM/dd'` (produced internally via `DateUtilities.toFormat(date, 'yyyy/MM/dd')`). The component does not emit `Date` objects. Toggling a previously-selected date removes it from the array.

> **Display vs. storage**: chips render the stored `'yyyy/MM/dd'` string through Angular's `date` pipe as `'dd/MM/yyyy'` (e.g. stored `2026/05/09` → displayed `09/05/2026`). The emitted `modelChange` array always contains the `'yyyy/MM/dd'` storage format.

> **Date adapter**: the component uses `MatNativeDateModule` (no date-fns adapter). Do **not** provide `provideDateFnsAdapter()` — it is not required and will conflict.

## Visual cues (helps agent map screenshots → component)
- Outlined input box showing one rounded-pill chip per selected date (e.g. `2026/05/09`), each with a ✕
- A trailing calendar icon opens a `mat-menu` containing a Material `mat-calendar`
- Inside the calendar, currently-selected dates are highlighted with the `sd-chip-calendar-selected-date` class
- Clicking a date in the calendar toggles it (add if absent, remove if present)
- ✕ button at the far right clears all selected dates
- In `[viewed]` mode: chip strip only — no calendar trigger, no ✕

## Dense dashboard/filter usage

When this control is rendered in dashboard cards, filter bars, external filter panels, table toolbars, query bars, or other compact non-form surfaces, prefer `hideInlineError` so Material does not reserve the inline error/subscript row under the field. Pair it with `size="sm"` when the component supports `size`. Validation remains visible through the compact error icon/tooltip without increasing the control height.

```html
<sd-chip-calendar size="sm" hideInlineError [(model)]="filter.holidays"></sd-chip-calendar>
```

## Examples

### 1. Off-days picker
```html
<sd-chip-calendar
  [form]="form" name="offDays"
  label="Ngày nghỉ"
  [(model)]="model.offDays"
  [min]="1" [max]="20"
  required>
</sd-chip-calendar>
```

### 2. DETAIL read-only display
```html
<sd-chip-calendar
  label="Ngày nghỉ"
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
  label="Ngày training"
  [(model)]="model.trainingDates"
  [removable]="canRemove">
</sd-chip-calendar>
```

## E2E test attributes

Rendered on the `<input class="sd-chip-input">` element (same anchor as `data-autoid`):

| Attribute | Value | Source |
|---|---|---|
| `data-autoid` | `forms-chip-calendar-<autoId>` | input `autoId` |
| `data-disabled` | `"true"` / `"false"` | `formControl.disabled` |
| `data-invalid` | `"true"` / `"false"` | `formControl.invalid && (touched \|\| dirty)` |
| `data-empty` | `"true"` / `"false"` | `sdIsEmpty(formControl.value)` |
| `data-value` | string | `sdSerializeDataValue(formControl.value)` |
| `data-required` | `"true"` / `"false"` | `required` input; always present |
| `data-error-message` | string | present only when the component is currently showing an error tooltip message |

> **Note**: `sd-chip-calendar` does not support maxlength / minlength / pattern. No `data-maxlength`, `data-minlength`, or `data-pattern` attributes are emitted.

Selector example:

```ts
const el = page.locator('[data-autoid="forms-chip-calendar-dates"]');
await expect(el).toHaveAttribute('data-empty', 'false');
await expect(el).toHaveAttribute('data-required', 'false');
```

## Anti-patterns
- ❌ Using `formControlName` or `[(ngModel)]` — not wired.
- ❌ Mutating the `model` array in place — pass a new reference.
- ❌ Storing `Date` objects instead of `'yyyy/MM/dd'` strings — values are normalized to that format and string equality is used for toggle.
- ❌ Using `<sd-chip-calendar>` for a date range — use `<sd-date-range>` for contiguous start/end.
- ❌ Using `[disabled]` instead of `[viewed]` for DETAIL state.

## Related
- `<sd-date>` — single date
- `<sd-date-range>` — start/end range
- `<sd-datetime>` — date + time
- `<sd-chip>` — text/number multi-value tags
