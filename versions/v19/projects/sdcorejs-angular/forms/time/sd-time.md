# `<sd-time>`

**Type**: standalone form component
**Selector**: `sd-time`
**Import**: `@sdcorejs/angular/forms/time`
**Model**: `string | null | undefined` (`HH:mm`)

## Purpose

Use `SdTime` for a time-of-day value that must not carry a date or timezone. Typed and picker values are normalized to a canonical `HH:mm` string. The Date required by the Material time spinner is isolated behind `SdDateTimePickerAdapter` and never enters the public model.

```ts
import { SdTime } from '@sdcorejs/angular/forms/time';
```

```html
<sd-time [form]="form" name="startTime" label="Start time" min="08:00" max="18:00" [step]="15" required clearable [(model)]="startTime">
</sd-time>
```

## Inputs

| Input                              | Type                           | Default               | Notes                                                                                               |
| ---------------------------------- | ------------------------------ | --------------------- | --------------------------------------------------------------------------------------------------- |
| `model`                            | `string \| null \| undefined`  | `undefined`           | Two-way raw time model. Valid values are emitted as canonical `HH:mm`.                              |
| `form` / `name`                    | parent form / `string`         | — / UUID              | Registers the control through the shared form connector. Dynamic name/parent changes are supported. |
| `min` / `max`                      | `string \| null`               | `undefined`           | Inclusive time-only boundaries.                                                                     |
| `step`                             | `number` minutes               | `1`                   | Positive integer minute interval, anchored to `min` when present and otherwise midnight.            |
| `required`                         | `boolean`                      | `false`               | Rejects an empty value.                                                                             |
| `clearable`                        | `boolean`                      | `false`               | Shows clear when optional and editable.                                                             |
| `disabled` / `readonly`            | `boolean`                      | `false`               | Disabled affects Angular Forms; readonly remains focusable but not editable.                        |
| `viewed`                           | `boolean \| 'inline'`          | `false`               | Static or inline display policy shared by SDCoreJS controls.                                        |
| `appearance`, `floatLabel`, `size` | Material/SDCoreJS form options | shared defaults       | Matches the other form controls.                                                                    |
| `hideInlineError`, `inlineError`   | error options                  | `false` / `undefined` | Inline message or compact tooltip behavior.                                                         |

Outputs are `sdChange`, `sdFocus`, and `sdBlur`. Public methods include `open()`, `focus()`, and `clear()`.

## Parsing and validation

- `9:05` is accepted and emitted as `09:05`.
- Invalid text such as `25:10`, missing minutes, or seconds remains visible so the user can correct it. It marks the control invalid without overwriting the last valid model.
- `min`, `max`, and `step` are validated independently of locale and timezone.
- Arrow Up/Down advances by `step` minutes and clamps to the configured boundaries.
- The picker uses a fixed internal date anchor; only the `HH:mm` result is committed.
- The validation message (inline `<mat-error>` and the `hideInlineError` tooltip icon) is **interaction-gated** — it renders only once the control is touched or dirty. A `[required]` field no longer shows its error on first paint, before the user has typed or blurred.

## Accessibility and automation

The editor is a numeric-inputmode text field with an accessible label. The picker trigger has its own translated label. `data-autoId`, disabled/invalid/empty/value/required/error metadata follow the common form-control contract.

The `<div>` wrapped around the spinner inside the picker `mat-menu` only exists to stop click bubbling from closing the menu; it is marked `role="presentation"`, never `aria-hidden="true"`. `aria-hidden` there would have hidden the hour/minute spinner and the Cancel/Confirm buttons from assistive tech while they stayed focusable.
