# `<sd-inline-text>`

`@sdcorejs/angular/forms/inline-text`

A borderless, **content-hugging** text input. The native `size` attribute (clamped) sizes the
input to its value, so the hover/click target tracks the content instead of stretching to fill its
container. It reads as plain text at rest and reveals an editing affordance on hover/focus.

It is the shared seamless primitive behind:

- `sd-input` / `sd-input-number` when `viewed='inline'` (rendered instead of `mat-form-field`);
- the query-bar `inline-value-chip` (`chrome="seamless"`), and the future query-builder value editor.

> Why it exists: a native `<input>` inside `mat-form-field` cannot hug its content, so inline-edit
> looked like a full-width input rather than text. This primitive renders a raw `<input>` so the
> field is exactly as wide as its value — which is what makes it embeddable in a chip.

## Design

`<sd-inline-text>` is intentionally **unopinionated about commit / parse / format**. It owns sizing,
state styling and the clear-×, and forwards the raw DOM events. Each consumer keeps its own logic
(e.g. `sd-input-number` keeps its vi-VN formatting; the chip keeps its parse/commit). Two binding
modes:

- **uncontrolled** — `[(value)]`, used by the chips' signal drafts;
- **controlled** — `[control]` (an external `SdFormControl`), used by the form controls so their
  validators / value flow stay native to ReactiveForms.

## API

### Inputs

| Input | Type | Default | Notes |
|---|---|---|---|
| `value` | `string` (model, two-way) | `''` | Uncontrolled value. Ignored when `[control]` is set. |
| `control` | `SdFormControl \| undefined` | `undefined` | Controlled mode — binds the external control to the `<input>`. |
| `placeholder` | `string` | `''` | Also the width fallback when empty. |
| `disabled` | `boolean` | `false` | |
| `clearable` | `boolean` | `true` | Hover/value-gated clear-×. Set `false` when the host owns removal (chips). |
| `state` | `'auto' \| 'pending' \| 'active' \| 'focus' \| 'error'` | `'auto'` | `'auto'` derives from focus + value; override (e.g. `'error'`). |
| `chrome` | `'standalone' \| 'seamless'` | `'standalone'` | `standalone` draws hover bg + focus ring; `seamless` defers all chrome to the host pill. |
| `autoId` | `string \| undefined` | `undefined` | Rendered as `data-autoId` on the input. |
| `autofocus` | `boolean` | `false` | Focuses the input on first render (build-chip pattern). |
| `minSize` | `number` | `2` | Lower bound (chars) so short/empty values keep a clickable target. |

### Outputs

| Output | Payload | Fired on |
|---|---|---|
| `valueChange` | `string` | value model change (uncontrolled) |
| `cleared` | `void` | clear-× click |
| `keyupEnter` | `void` | `Enter` keyup |
| `keydownEscape` | `void` | `Escape` keydown |
| `sdFocus` / `sdBlur` | `FocusEvent` | focus / blur |
| `sdKeydown` | `KeyboardEvent` | any keydown |
| `sdPaste` | `ClipboardEvent` | paste |
| `sdCompositionStart` / `sdCompositionEnd` | `CompositionEvent` | IME composition |

### Methods

- `focus()` / `blur()` — drive the native input.

## Examples

### Uncontrolled (chip-style draft)

```html
<sd-inline-text
  chrome="seamless"
  [clearable]="false"
  [autofocus]="true"
  [state]="state()"
  [value]="draft()"
  (valueChange)="draft.set($event)"
  [placeholder]="'nhập…'"
  (sdBlur)="commit()"
  (keydownEscape)="revert()" />
```

### Controlled (inside a form control)

```html
<sd-inline-text
  [control]="formControl"
  [placeholder]="placeholder()"
  [clearable]="!required()"
  [autoId]="autoId()"
  [state]="formControl.invalid && formControl.touched ? 'error' : 'auto'"
  (sdFocus)="onFocus()"
  (sdBlur)="onBlur()"
  (keyupEnter)="onKeyupEnter()" />
```

## Notes

- The clear-× is hidden in `standalone` chrome until hover/focus; always rendered (when applicable)
  in `seamless` so it lives within the host pill's affordance.
- In `seamless` chrome the value text colour follows `state` (`active` → primary, `error` → danger)
  and the value renders bold, since the field input is encapsulated inside this primitive and the
  host pill can no longer style it directly.
- `max-width` on the input (240px) caps very long values; `size` drives the width below that.
