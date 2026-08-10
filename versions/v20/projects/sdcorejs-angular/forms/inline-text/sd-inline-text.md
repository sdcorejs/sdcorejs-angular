# `<sd-inline-text>`

**Type**: Low-level form primitive
**Selector**: `sd-inline-text`
**Import path**: `@sdcorejs/angular/forms/inline-text`
**Class**: `SdInlineText`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose

A borderless, **content-hugging** text input. The native `size` attribute (clamped) sizes the
input to its value, so the hover/click target tracks the content instead of stretching to fill its
container. It reads as plain text at rest and reveals an editing affordance on hover/focus.

It is the shared seamless primitive behind:

- `sd-input` / `sd-input-number` when `viewed='inline'` (rendered instead of `mat-form-field`);
- the query-bar `inline-value-chip` (`chrome="seamless"`), and the future query-builder value editor.

> Why it exists: a native `<input>` inside `mat-form-field` cannot hug its content, so inline-edit
> looked like a full-width input rather than text. This primitive renders a raw `<input>` so the
> field is exactly as wide as its value — which is what makes it embeddable in a chip.

## When to use
- Building inline-edit text faces inside chips, tokens, or compact filter builders.
- Low-level composition inside Core UI controls that already own parse/format/commit behavior.
- Cases where the input width must hug its content instead of filling a container.
- Controlled mode with an external `SdFormControl` when a parent form component owns validation.

## When NOT to use
- Regular form fields on a page → use `<sd-input>` / `<sd-input-number>`.
- Read-only label/value display → use `<sd-view>` or `[viewed]="true"` on the form control.
- Multiline text → use `<sd-textarea>`.
- Selectable values, dates, booleans, colors → use the matching Core UI form component.
- Product code outside Core UI composition unless you also implement commit, validation, and error display around it.

## Design

`<sd-inline-text>` is intentionally **unopinionated about commit / parse / format**. It owns sizing,
state styling and the clear-×, and forwards the raw DOM events. Each consumer keeps its own logic
(e.g. `sd-input-number` keeps its vi-VN formatting; the chip keeps its parse/commit). Two binding
modes:

- **uncontrolled** — `[(value)]`, used by the chips' signal drafts;
- **controlled** — `[control]` (an external `SdFormControl`), used by the form controls so their
  validators / value flow stay native to ReactiveForms.

## Inputs

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

## Outputs

| Output | Payload | Fired on |
|---|---|---|
| `valueChange` | `string` | value model change (uncontrolled) |
| `sdCleared` | `void` | clear-× click |
| `sdKeyupEnter` | `void` | `Enter` keyup |
| `sdKeydownEscape` | `void` | `Escape` keydown |
| `sdFocus` / `sdBlur` | `FocusEvent` | focus / blur |
| `sdKeydown` | `KeyboardEvent` | any keydown |
| `sdPaste` | `ClipboardEvent` | paste |
| `sdCompositionStart` / `sdCompositionEnd` | `CompositionEvent` | IME composition |

## Public API

- `focus()` / `blur()` — drive the native input.

## Visual cues
- Text-like field with no Material outline.
- Width tracks the current text/placeholder with a minimum character width.
- `standalone` chrome shows hover background and focus ring.
- `seamless` chrome has no independent background/ring and relies on the parent chip/pill for affordance.
- Optional clear `×` appears only when clearable, non-empty, and enabled.

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
  (sdKeydownEscape)="revert()" />
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
  (sdKeyupEnter)="onKeyupEnter()" />
```

## Notes

- The clear-× is hidden in `standalone` chrome until hover/focus; always rendered (when applicable)
  in `seamless` so it lives within the host pill's affordance.
- In `seamless` chrome the value text colour follows `state` (`active` → primary, `error` → danger)
  and the value renders bold, since the field input is encapsulated inside this primitive and the
  host pill can no longer style it directly.
- `max-width` on the input (240px) caps very long values; `size` drives the width below that.

## Anti-patterns
- ❌ Using it as a normal page input — it has no label, helper text, Material field chrome, or built-in validator UI.
- ❌ Expecting it to parse numbers/dates — it only forwards string/DOM events.
- ❌ Putting it in a table filter when `<sd-input size="sm">` is enough.
- ❌ Using `chrome="seamless"` without a parent visual container — the control will look like plain text with little affordance.

## Related
- `<sd-input viewed="inline">` and `<sd-input-number viewed="inline">` — higher-level controls that use this primitive.
- `<sd-query-bar>` — uses inline chips built on this primitive.
- `<sd-view>` — read-only label/value display, not editable inline text.
