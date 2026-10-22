# `<sd-chip-calendar>`

**Type**: Component (form input)
**Selector**: `sd-chip-calendar`
**Import path**: `@sdcorejs/angular/forms/chip-calendar` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdChipCalendar`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose

Multi-date picker rendered as chips — the user opens a calendar popup and toggles individual days; each chosen day appears as a chip in the field. Uses Material `mat-chips` + `mat-calendar` inside a CDK overlay with `role="dialog"`.

## When to use

- Selecting an arbitrary set of days (multiple, non-contiguous), e.g. holidays, training days, off-days
- Where a date RANGE is not appropriate (gaps allowed)
- DETAIL state needing read-only text via `[viewed]`

## When NOT to use

- A single date → use `<sd-date>`
- A start/end range → use `<sd-date-range>`
- Free-text date strings → use `<sd-input>`
- Selecting time-of-day → use `<sd-datetime>`

## Inputs

| Name              | Type                                    | Default        | Notes                                                                                                                                                                                                                                                                 |
| ----------------- | --------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autoId`          | `string \| undefined`                   | `undefined`    | E2E hook, rendered as `data-autoid="forms-chip-calendar-<autoId>"` on the chip `<input>` (see E2E test attributes).                                                                                                                                                   |
| `name`            | `string \| undefined`                   | random uuid    | Control name registered into `[form]`.                                                                                                                                                                                                                                |
| `appearance`      | `MatFormFieldAppearance`                | `'outline'`    | Material form-field style.                                                                                                                                                                                                                                            |
| `floatLabel`      | `FloatLabelType`                        | `'auto'`       | When the label floats.                                                                                                                                                                                                                                                |
| `size`            | `Size` (`'sm' \| 'md' \| 'lg'`)         | `'md'`         | One-line field height 32 / 40 / 48 px with 20 / 24 / 28 px chips. Use `size="sm"` inside `<sd-table>` filters/cells or other dense table UI.                                                                                                                          |
| `form`            | `NgForm \| FormGroup \| undefined`      | `undefined`    | Parent form; NgForm auto-unwrapped.                                                                                                                                                                                                                                   |
| `label`           | `string`                                | `''`           | Field label.                                                                                                                                                                                                                                                          |
| `labelPlacement`  | `'float' \| 'top'`                      | `'float'`      | `'float'` (default) keeps the Material floating label. `'top'` renders `label` above the field as a real `<label for>` bound to the chip `<input>`. Used by `<sd-form-render>`.                                                                                       |
| `placeholder`     | `string \| undefined`                   | `undefined`    | Placeholder of the chip input, shown only while no day is chosen. Without it the field shows “Chọn ngày” (i18n `core.form.chip-calendar.placeholder`); the label is no longer repeated as the placeholder.                                                            |
| `model`           | `SdChipCalendarModel`                   | `undefined`    | Chosen days. Each item may be `'yyyy/MM/dd'`, an ISO / RFC-1123 string, a `Date` or a timestamp, read like the model of `<sd-date>` (see Model and value). Two-way with `[(model)]`.                                                                                  |
| `transform`       | `SdTemporalValueTransform \| undefined` | `undefined`    | String form of each day written back: `undefined` → `'yyyy/MM/dd'`; `'ISOString'` / `'UTCString'` → the start of the day, in `ISdCoreConfiguration.timeZone` when configured. Same contract as `<sd-date>`. Display is not affected.                                  |
| `removable`       | `boolean \| ((day: string) => boolean)` | `true`         | Whether a chip may be removed. The predicate receives the normalised `'yyyy/MM/dd'` day and applies to every removal path: the ✕ button, Backspace / Delete on a chip, pressing the day again in the calendar, and both clear buttons. A kept chip shows a lock icon. |
| `minCount`        | `number \| undefined`                   | `undefined`    | Fewest days. When > 0, adds `Validators.minLength`.                                                                                                                                                                                                                   |
| `maxCount`        | `number \| undefined`                   | `undefined`    | Most days. When > 0, adds `Validators.maxLength`; once reached, the unchosen days of the calendar are disabled and the popup says so.                                                                                                                                 |
| `min`             | `number`                                | `0`            | **Deprecated** — use `minCount` (`minCount` wins when both are set; dev mode warns once).                                                                                                                                                                             |
| `max`             | `number`                                | `0`            | **Deprecated** — use `maxCount` (`maxCount` wins when both are set; dev mode warns once).                                                                                                                                                                             |
| `minDate`         | `SdChipCalendarDate`                    | `null`         | Earliest pickable day, read like `minDate` of `<sd-date>`; `'TODAY'` is today in the configured zone.                                                                                                                                                                 |
| `maxDate`         | `SdChipCalendarDate`                    | `null`         | Latest pickable day, read like `maxDate` of `<sd-date>`.                                                                                                                                                                                                              |
| `dateFilter`      | `((date: Date) => boolean) \| null`     | `null`         | `false` makes a day unpickable. A chosen day stays removable even when the filter refuses it.                                                                                                                                                                         |
| `startAt`         | `SdChipCalendarDate`                    | `null`         | Month the popup opens at. Without it: the chosen day nearest to today (the later one on a tie), else today.                                                                                                                                                           |
| `clearable`       | `boolean`                               | `false`        | Shows the clear button in the field suffix (hidden when `required`) and “Xoá hết” in the popup footer. Both keep the days `removable` refuses.                                                                                                                        |
| `maxVisible`      | `number \| null`                        | `null`         | Chips shown while the popup is closed; the rest fold into a “+N” button that opens the popup. `null` shows them all. Use `2` inside `<sd-table>` filters.                                                                                                             |
| `displayFormat`   | `string`                                | `'dd/MM/yyyy'` | Format of the chips and of the viewed text, in Angular `DatePipe` syntax.                                                                                                                                                                                             |
| `required`        | `boolean`                               | `false`        | Adds `Validators.required`.                                                                                                                                                                                                                                           |
| `disabled`        | `boolean`                               | `false`        | Disables interaction and hides both suffix buttons.                                                                                                                                                                                                                   |
| `viewed`          | `boolean \| 'inline'`                   | `false`        | Display mode. `false` = edit. `true` = static read-only `<sd-view>`. `'inline'` = the editable field stays mounted (chips are already compact, no separate face); a **disabled** `'inline'` falls back to `true` (static).                                            |
| `hideInlineError` | `boolean`                               | `false`        | Hide inline error; expose via `errorMessage`.                                                                                                                                                                                                                         |
| `hyperlink`       | `string \| null \| undefined`           | `undefined`    | Used in static `[viewed]` mode.                                                                                                                                                                                                                                       |

> **Coerce**: `required`, `disabled`, `clearable`, `hideInlineError` use `booleanAttribute` — bare attribute = `true`. `viewed` uses the shared `sdViewedTransform` (also accepts the literal `'inline'`); computed `isViewed()` (`true`, or disabled `'inline'`) drives the static `<sd-view>` branch and the host `.sd-viewed` class.

Exported types: `SdChipCalendarValue` (`string | number | Date`), `SdChipCalendarModel` (`SdChipCalendarValue[] | null | undefined`), `SdChipCalendarDate` (`Date | string | number | null | undefined`), `SdChipCalendarRemovable`.

## Outputs

| Name          | Type                  | Notes                                                                                                         |
| ------------- | --------------------- | ------------------------------------------------------------------------------------------------------------- |
| `modelChange` | `SdChipCalendarModel` | Emits a new array once per user action (pick, toggle off, remove, clear): `string[]` in the `transform` form. |
| `sdChange`    | `string[]`            | SDCoreJS-standard change event, same payload (`[]` when empty).                                               |

## Host classes

Applied automatically on `<sd-chip-calendar>` for styling hooks:

| Class          | Condition                                                           | Effect                                                                                                |
| -------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `sd-has-label` | `[label]` is truthy                                                 | Adds `padding-top: 4px` so the floating label has room and is not clipped. Absent → no top padding.   |
| `sd-label-top` | `labelPlacement="top"`                                              | Removes the top padding; the label sits above the field.                                              |
| `sd-viewed`    | `isViewed()` — `[viewed]="true"`, or disabled `[viewed]="'inline'"` | Removes top padding (read-only text only). Overrides `sd-has-label` when both are set (source order). |

## Content projection (slots)

- `#sdLabel` template — custom label
- `<ng-template sdLabelDef>` — alternate label
- `#sdValue` template — value template of the static `[viewed]` `<sd-view>` only; the chips themselves are not templated
- `<ng-template sdViewDef>` — a read-only face shown in place of the field until it is clicked (or activated with Enter / Space); also the static `[viewed]` value template when `#sdValue` is absent

## Model and value

- **Reading**: each item is read like the model of `<sd-date>` — `'yyyy/MM/dd'`, an ISO / RFC-1123 string, a `Date` or a timestamp — in the configured `timeZone` when there is one. Items that cannot be read are dropped (dev mode warns once). The same day in two forms is one chip.
- **Writing**: after a user action the model becomes a new `string[]` in the `transform` form (`'yyyy/MM/dd'` by default), in the order the days were picked. A model set by the parent is never written back.
- **Display**: chips are shown by date, in `displayFormat` (stored `2026/05/09` → `09/05/2026`). The model keeps its order.
- **The model array is replaced, never mutated** — the array you pass into `[model]` is never written to, and because the reference always changes, `modelChange` fires reliably.

> **Date adapter**: the component uses `MatNativeDateModule` (no date-fns adapter). Do **not** provide `provideDateFnsAdapter()` — it is not required and will conflict.

## Form integration

- **Does NOT implement `ControlValueAccessor`.** Standard SDCoreJS pattern: `[form]+[name]` registers the internal `FormControl` into the parent group on `ngAfterViewInit`. With a `transform`, the parent form receives a control that carries the model (the transformed strings), like `<sd-date>`.
- **`formControlName` and `[(ngModel)]` are NOT supported.** Use `[(model)]` and `[form]+[name]`.
- **Validators (additive)**: `[required]`, `[minCount]` (`minLength`), `[maxCount]` (`maxLength`). They are routed through the shared form connector, which adds/removes only the validators this component owns — validators you attach yourself to the public `formControl` are preserved.
- **Errors** show when the control is invalid and touched, or when the parent form was submitted. Closing the popup marks the control touched; picking days with the popup open does not show a count error yet.

## Popup and keyboard

- The calendar button in the suffix, a click on the field, Enter / Space / ArrowDown on the chip input, or “+N” open the popup under the field (6px gap; it flips above when there is no room).
- The popup is a `role="dialog"` with its own header (previous month, month label, next month), a count line (“Đã chọn 3 ngày · Tối đa 5”) and a footer with “Xoá hết” (`clearable`) and “Xong”. When `maxCount` is reached a polite live region says so.
- Tab cycles inside the popup and does not close it. Esc and “Xong” close it and return focus to the chip input; a click outside closes it without moving focus.
- On a chip, Backspace / Delete remove it when `removable` allows.

## Visual cues (helps agent map screenshots → component)

- Outlined field with one chip per chosen day, sorted by date and shown as `09/05/2026`; each chip has a ✕, or a lock icon when `removable` keeps it (locked chips have a lighter background)
- With `maxVisible`, a borderless “+N” button after the visible chips
- Suffix: a clear button (`clearable`, on hover or while the popup is open) and a calendar button that turns primary while the popup is open
- While the popup is open, the field keeps its focused outline
- The popup: header with ‹ month label ›, a count line, the calendar grid where chosen days are solid primary cells (locked ones lighter), then “Xoá hết” and “Xong”
- In `[viewed]` mode: plain text of the days, sorted and in `displayFormat`, joined by “, ”

## Standalone imports and table-cell usage

Every standalone host that uses `<sd-chip-calendar>` must import `SdChipCalendar`. Projected label/view templates require their directives in `imports`.

```ts
import { Component } from '@angular/core';
import { SdTable, SdTableCellDefDirective, SdTableOption } from '@sdcorejs/angular/components/table';
import { SdChipCalendar } from '@sdcorejs/angular/forms';
import { SdLabelDefDirective, SdViewDefDirective } from '@sdcorejs/angular/forms/directives';

@Component({
  standalone: true,
  imports: [SdTable, SdTableCellDefDirective, SdChipCalendar, SdLabelDefDirective, SdViewDefDirective],
  template: `
    <sd-table [option]="tableOption">
      <ng-template sdTableCellDef="holidays" let-row>
        <sd-chip-calendar size="sm" hideInlineError [maxVisible]="2" [(model)]="row.holidays"> </sd-chip-calendar>
      </ng-template>
    </sd-table>
  `,
})
export class ChipCalendarTableComponent {
  tableOption!: SdTableOption<unknown>;
}
```

Inside `<sd-table>` custom cells and filters, use `size="sm"`, `hideInlineError` and `[maxVisible]="2"` so the row keeps one line.

```html
<ng-template sdTableCellDef="holidays" let-row>
  <sd-chip-calendar size="sm" hideInlineError [maxVisible]="2" [(model)]="row.holidays"></sd-chip-calendar>
</ng-template>
```

For read-only date arrays, map to display strings first or use a custom cell template; do not create a new pipe when `sdFormatDate` and `sdView` can compose the display.

## Dense dashboard/filter usage

When this control is rendered in dashboard cards, filter bars, external filter panels, table toolbars, query bars, or other compact non-form surfaces, prefer `hideInlineError` so Material does not reserve the inline error/subscript row under the field. Pair it with `size="sm"` and `maxVisible`. Validation remains visible through the compact error icon/tooltip without increasing the control height, and the message is also exposed to assistive tech through a screen-reader-only element (`span.sd-visually-hidden`) referenced by `aria-describedby`.

```html
<sd-chip-calendar size="sm" hideInlineError [maxVisible]="2" [(model)]="filter.holidays"></sd-chip-calendar>
```

## Examples

### 1. Off-days picker

```html
<sd-chip-calendar
  [form]="form"
  name="offDays"
  label="Ngày nghỉ"
  [(model)]="model.offDays"
  [minCount]="1"
  [maxCount]="20"
  clearable
  required>
</sd-chip-calendar>
```

### 2. DETAIL read-only display

```html
<sd-chip-calendar label="Ngày nghỉ" [model]="model.offDays" [viewed]="true"> </sd-chip-calendar>
```

### 3. Future days only, past days locked

`minDate` keeps past days out of the calendar; `removable` keeps the past days already chosen.

```ts
today = DateUtilities.toFormat(new Date(), 'yyyy/MM/dd');
canRemove = (day: string) => day >= this.today; // `yyyy/MM/dd` compares as text in date order
```

```html
<sd-chip-calendar
  [form]="form"
  name="trainingDates"
  label="Ngày training"
  [(model)]="model.trainingDates"
  minDate="TODAY"
  [removable]="canRemove">
</sd-chip-calendar>
```

### 4. Weekdays only, ISO strings in the model

```ts
weekday = (date: Date) => date.getDay() !== 0 && date.getDay() !== 6;
```

```html
<sd-chip-calendar label="Ngày trực" [(model)]="model.dutyDays" [dateFilter]="weekday" [maxCount]="5" transform="ISOString">
</sd-chip-calendar>
```

## E2E test attributes

Rendered on the chip `<input>` element (same anchor as `data-autoid`):

| Attribute            | Value                          | Source                                                                         |
| -------------------- | ------------------------------ | ------------------------------------------------------------------------------ |
| `data-autoid`        | `forms-chip-calendar-<autoId>` | input `autoId`                                                                 |
| `data-disabled`      | `"true"` / `"false"`           | `formControl.disabled`                                                         |
| `data-empty`         | `"true"` / `"false"`           | `sdIsEmpty(formControl.value)`                                                 |
| `data-value`         | string                         | `sdSerializeDataValue(formControl.value)` — the normalised `'yyyy/MM/dd'` days |
| `data-count`         | number as string               | number of chosen days                                                          |
| `data-required`      | `"true"` / `"false"`           | `required` input; always present                                               |
| `data-error-message` | string                         | present only when the component is currently showing an error tooltip message  |

> **Note**: there is no `data-invalid`; use `aria-invalid="true"` on the same input, or `data-error-message`.

Other hooks (when `autoId` is set, `<id>` = `forms-chip-calendar-<autoId>`):

| Element                     | Hook                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------- |
| Calendar button             | `data-chip-calendar-open`, `data-autoid="<id>-open"`                                  |
| Clear button (field suffix) | `data-autoid="<id>-clear"`                                                            |
| “+N” button                 | `data-autoid="<id>-more"`                                                             |
| Popup panel                 | `role="dialog"`, `data-autoid="<id>-panel"`                                           |
| Popup header                | `data-chip-calendar-previous`, `data-chip-calendar-period`, `data-chip-calendar-next` |
| “Xoá hết”                   | `data-chip-calendar-clear-all`, `data-autoid="components-button-<id>-clear-all"`      |
| “Xong”                      | `data-chip-calendar-done`, `data-autoid="components-button-<id>-done"`                |

Selector example:

```ts
const el = page.locator('[data-autoid="forms-chip-calendar-dates"]');
await expect(el).toHaveAttribute('data-count', '2');
await page.locator('[data-autoid="forms-chip-calendar-dates-open"]').click();
await expect(page.getByRole('dialog')).toBeVisible();
```

## Accessibility

- Each chip is named by the full date (“9 tháng 5, 2026”), plus “Không bỏ được ngày này” when locked; the ✕ button is named “Bỏ ngày …”. Both follow the `I18nService` language.
- The popup is a `role="dialog"` with an accessible name, a focus trap and a polite live region for the “limit reached” message. On open, focus moves to the active day of the grid; after a pick, the picked day keeps focus.
- The chip input gets `aria-invalid="true"` plus `aria-describedby` pointing at the `<mat-error>` (stable id, exposed as `errorId`) whenever the inline error renders; with `hideInlineError` it points at a screen-reader-only copy of the message.
- When an `sdViewDef` face is shown it is `role="button" tabindex="0"` with Enter / Space handlers that mirror the click. No `aria-label` is set there on purpose: the projected content is the visible label.
- With `pointer: coarse`, the chip ✕ keeps a 24×24 px hit area. Transitions are off under `prefers-reduced-motion`.

## Anti-patterns

- ❌ Using `formControlName` or `[(ngModel)]` — not wired.
- ❌ Mutating the `model` array in place — pass a new reference.
- ❌ Writing a `removable` predicate for `Date` or numbers — it receives the normalised `'yyyy/MM/dd'` string.
- ❌ Using `min` / `max` in new code — use `minCount` / `maxCount`.
- ❌ Selecting E2E elements by `.mat-mdc-menu-panel` — the popup is a CDK overlay; use `role="dialog"` or the hooks above.
- ❌ Using `<sd-chip-calendar>` for a date range — use `<sd-date-range>` for contiguous start/end.
- ❌ Using `[disabled]` instead of `[viewed]` for DETAIL state.

## Related

- `<sd-date>` — single date
- `<sd-date-range>` — start/end range
- `<sd-datetime>` — date + time
- `<sd-chip>` — text/number multi-value tags
