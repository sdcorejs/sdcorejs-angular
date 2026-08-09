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
- Invalid endpoint text remains visible and makes the parent form invalid without replacing the last valid range model. It surfaces as an **additional** `endpoint` error on the aggregate control — it never replaces the range error that is already there.
- The validation **message** is interaction-gated: it stays hidden until the aggregate control or one of the endpoints is touched or dirty. A `[required]` range no longer shows its error on first paint. **Validity itself is not gated** — see "Form integration".

## Form integration

- **BREAKING (endpoint controls are no longer registered).** Earlier versions passed `[form]` down to both `<sd-time>` endpoints, so each registered itself in the consumer's `FormGroup` under `from-<uuid>` / `to-<uuid>`. `form.value` therefore carried two extra keys that changed on every component instance, corrupting the submitted payload shape and making `form.reset(obj)` impossible to write. The range now registers **only** the aggregate control under `name`, so `form.value[name]` is the complete range value.
- Because the endpoints left the group, the aggregate validator is the **only** path by which endpoint validity reaches the parent form. It therefore reads the endpoints' **raw** `formControl.invalid`, not the interaction-gated state used for display: an endpoint that is invalidated without any user interaction (a programmatic write, a `min`/`max`/`step` that the value violates) still makes the parent form invalid. Only the rendered message waits for touched/dirty.

### Error keys on the aggregate control

The aggregate control can carry these keys, and they **combine** — `endpoint` is added on top of whatever the range validator produced, so `hasError('required')` stays true while an endpoint is also malformed.

| Key                                            | Raised when                                                                            |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| `required`                                     | `[required]` and either endpoint of the aggregate model is missing.                    |
| `incomplete`                                   | Exactly one endpoint is set and `[allowOpenEnded]` is `false`.                          |
| `range`                                        | `from` is later than `to`.                                                             |
| `fromTime` / `fromMin` / `fromMax` / `fromStep` | The `from` value of the aggregate model violates syntax, `min`, `max`, or `step`.       |
| `toTime` / `toMin` / `toMax` / `toStep`         | Same for the `to` value.                                                                |
| `endpoint`                                     | Either `<sd-time>` control is invalid — typically malformed text that never reaches the aggregate model. Additive. |
| `inlineError`                                  | `[inlineError]` is set. Additive (a separate validator).                                |

At most one key from the range validator is present at a time (it reports the first violation it finds); `endpoint` and `inlineError` can accompany it.

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

The editor exposes a labelled `role="group"` containing two independently labelled time fields. Group-level invalid and E2E data-state attributes represent the aggregate control, which also absorbs endpoint validity (see "Form integration") so malformed typed text still invalidates the parent form. Those attributes follow the interaction-gated view of validity, so they stay `false` until the user has touched the field even while `form.invalid` is already `true`.
