# `<sd-time-range>`

**Type**: standalone composite form component
**Selector**: `sd-time-range`
**Import**: `@sdcorejs/angular/forms/time-range`
**Model**: `SdTimeRangeValue | null | undefined`

```ts
export interface SdTimeRangeValue {
  readonly from?: string | null;
  readonly to?: string | null;
}
```

## Purpose

`SdTimeRange` composes two real `SdTime` controls and one aggregate range control. This preserves endpoint editing and validation while exposing one timezone-free `{ from, to }` model to the consumer.

```ts
import { SdTimeRange, SdTimeRangeValue } from '@sdcorejs/angular/forms/time-range';
```

```html
<sd-time-range [form]="form" name="workingHours" label="Working hours" min="08:00" max="18:00" [step]="15" [(model)]="workingHours">
</sd-time-range>
```

## Range rules

- Both populated endpoints are canonical `HH:mm` strings.
- `from > to` produces the aggregate `range` error.
- An optional one-sided range produces `incomplete` unless `[allowOpenEnded]="true"`.
- `[required]="true"` always requires both endpoints, even when open-ended ranges are enabled.
- `min`, `max`, and `step` apply to each populated endpoint.
- Invalid endpoint text remains visible and makes the parent form invalid without replacing the last valid range model.

## Inputs

In addition to the shared `form`, `name`, `label`, `size`, `disabled`, `readonly`, `viewed`, `clearable`, `hideInlineError`, and automation inputs, the range accepts:

| Input                               | Type                                    | Default     | Notes                                                         |
| ----------------------------------- | --------------------------------------- | ----------- | ------------------------------------------------------------- |
| `model`                             | `SdTimeRangeValue \| null \| undefined` | `undefined` | Two-way aggregate model.                                      |
| `min` / `max`                       | `string \| null`                        | `undefined` | Inclusive constraints for both endpoints.                     |
| `step`                              | `number`                                | `1`         | Minute interval for both endpoints.                           |
| `required`                          | `boolean`                               | `false`     | Requires both endpoints.                                      |
| `allowOpenEnded`                    | `boolean`                               | `false`     | Permits exactly one endpoint only when the range is optional. |
| `fromPlaceholder` / `toPlaceholder` | `string`                                | `HH:mm`     | Endpoint-specific placeholders.                               |

`sdChange` emits the aggregate model. `sdFocus` and `sdBlur` report interaction at group level. `clear()` commits `{ from: null, to: null }`.

## Accessibility

The editor exposes a labelled `role="group"` containing two independently labelled time fields. Group-level invalid and E2E data-state attributes represent the aggregate control; endpoint controls remain registered so malformed typed text also invalidates the parent form.
