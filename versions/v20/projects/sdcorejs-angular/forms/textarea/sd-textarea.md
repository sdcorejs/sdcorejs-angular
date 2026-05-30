# `<sd-textarea>`

**Type**: Component (form input)
**Selector**: `sd-textarea`
**Import path**: `@sdcorejs/angular/forms/textarea` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdTextarea`
**Standalone**: yes
**Change detection**: default (no `OnPush` declared)

## One-line purpose
Multi-line text input â€” `<textarea>` with label, validators (required/maxlength/pattern/custom), an optional auto-grow mode, a built-in `count/max` suffix counter when `maxlength` is set, and DETAIL `[viewed]` read-only mode.

## When to use
- Free-form descriptions, comments, notes, addresses spanning multiple lines
- Form fields that may legitimately need 50+ characters (description, reason, remark)
- DETAIL state via `[viewed]="true"` to render the saved value instead of the input chrome
- Forms where the user benefits from seeing the character budget â€” set `[maxlength]` for the live counter

## When NOT to use
- Single-line text â†’ use `<sd-input>`
- Numbers / amounts â†’ use `<sd-input-number>`
- Code / syntax-highlighted text â†’ use the project's code editor component (out of scope for `forms/`)
- Rich text (bold, lists, ...) â†’ use the project's rich-text editor component

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `autoId` | `string \| null \| undefined` | `undefined` | Generates `data-autoid="forms-textarea-<value>"` for E2E selectors. |
| `name` | `string` | random uuid | FormGroup control name when bound via `[form]`. |
| `size` | `Size` (`'sm' \| 'md' \| 'lg'`) | `'md'` | Field height (applied via `.sd-md` / `.sd-sm` class). |
| `form` | `FormGroup \| NgForm \| { form: FormGroup } \| undefined` | `undefined` | Parent form. `NgForm` and `{ form }` wrappers are auto-unwrapped to `FormGroup`. |
| `label` | `string \| undefined` | `undefined` | Field label. |
| `helperText` | `string \| undefined` | `undefined` | Hint text (rendered as info icon next to label). |
| `placeholder` | `string \| undefined` | `undefined` | Placeholder when empty (falls back to `label`). |
| `rows` | `number` | `5` | `<textarea rows="...">`; ignored when `[autoHeight]="true"` after first render. |
| `maxlength` | `number \| null` | `null` | Coerced to a positive integer or `null`. Adds `Validators.maxLength` AND shows a `count/max` suffix counter. |
| `pattern` | `string \| undefined` | `undefined` | Adds `Validators.pattern` with this raw regex string. |
| `appearance` | `MatFormFieldAppearance \| undefined` | from `SD_FORM_CONFIGURATION` ?? `'outline'` | Material form-field style. Pass `null` to suppress the form-field wrapper and render the label as a separate `<sd-label>` above. |
| `floatLabel` | `FloatLabelType` | `'auto'` | Material float-label behaviour. |
| `validator` | `SdCustomValidator \| undefined` | `undefined` | Async custom validator returning `string \| Promise<string>` (empty = pass). |
| `inlineError` | `string \| undefined` | `undefined` | Forces a synthetic `inlineError` validator with this message. |
| `model` | `any` | `undefined` | Two-way bound value (use `[(model)]`). |
| `required` | `boolean` | `false` | Adds `Validators.required`. Bare attribute = `true`. |
| `disabled` | `boolean` | `false` | Disables the underlying `FormControl`. Bare attribute = `true`. |
| `viewed` | `boolean` | `false` | Read-only DETAIL mode. Bare attribute = `true`. |
| `autoHeight` | `boolean` | `false` | Auto-grow: textarea height tracks content (`scrollHeight`). Disables vertical scroll. Bare attribute = `true`. |
| `hideInlineError` | `boolean` | `false` | Hide inline `<mat-error>`; surface error via tooltip on a red error icon suffix. Bare attribute = `true`. |

> **Coerce note**: `required`, `disabled`, `viewed`, `autoHeight`, `hideInlineError` use the `booleanAttribute` transform â€” bare attribute presence (e.g. `<sd-textarea autoHeight>`) is treated as `true`.

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `sdChange` | `any` | Emitted on each value change (and after auto-trim on blur). |

## E2E test attributes

Rendered on the inner `<textarea matInput>` element (same anchor as `data-autoid`):

| Attribute | Value | Source |
|---|---|---|
| `data-autoid` | `forms-textarea-<autoId>` | input `autoId` |
| `data-disabled` | `"true"` / `"false"` | `formControl.disabled` |
| `data-invalid` | `"true"` / `"false"` | `formControl.invalid && (touched \|\| dirty)` |
| `data-empty` | `"true"` / `"false"` | `sdIsEmpty(formControl.value)` |
| `data-value` | string | `sdSerializeDataValue(formControl.value)` |
| `data-required` | `"true"` / `"false"` | `required` input; always present |
| `data-maxlength` | numeric string | present only when `[maxlength]` is defined |
| `data-pattern` | string | present only when `[pattern]` is non-empty |
| `data-error-message` | string | present only when the component is currently showing an error tooltip message |

> **Note**: `sd-textarea` does not support `minlength` â€” no `data-minlength` attribute is emitted.

Selector example:

```ts
const el = page.locator('[data-autoid="forms-textarea-notes"]');
await expect(el).toHaveAttribute('data-empty', 'false');
await expect(el).toHaveAttribute('data-value', 'some text');
// validation meta (when set)
await expect(el).toHaveAttribute('data-required', 'true');
await expect(el).toHaveAttribute('data-maxlength', '500');
await expect(el).toHaveAttribute('data-pattern', '^[A-Za-z]+$');
// error message â€” only when field is in error state
await expect(el).toHaveAttribute('data-error-message', 'Vui lÃ²ng nháº­p thÃ´ng tin');
```

## Host classes
Applied automatically on `<sd-textarea>` for styling hooks:

| Class | Condition | Effect |
| --- | --- | --- |
| `sd-has-label` | `[label]` is truthy | Adds `padding-top: 4px` so the floating label has room and is not clipped. Absent â†’ no top padding. |
| `sd-viewed` | `[viewed]="true"` | Removes top padding (read-only text only). Overrides `sd-has-label` when both are set (source order). |

## Content projection (slots)
- `<ng-template sdLabelDef>` â€” custom label rendering (used only when `[appearance]` is null/falsy)
- `<ng-template sdSuffixDef>` â€” custom suffix (e.g. icon button) rendered as `matSuffix`
- `<ng-template sdViewDef>` â€” custom DETAIL display (receives `{ value }` as context)

## Form integration
- **Does NOT implement `ControlValueAccessor`.** Forms use the SDCoreJS pattern: pass the parent form via `[form]="formGroup"` (or `[form]="ngForm"`) plus a `name`. In `ngOnInit`, the component calls `formGroup.addControl(name, formControl)` and removes it in `ngOnDestroy`.
- **`formControlName` and `[(ngModel)]` are NOT supported.** Use `[(model)]` for two-way value binding and `[form]+[name]` for FormGroup integration.
- **`[viewed]="true"`** flips into DETAIL read-only mode: textarea is hidden, value is rendered as plain text (or via `<ng-template sdLabelDef>` for the label and `<ng-template sdViewDef>` for the value); falls back to em-dash via `sdEmpty` when empty.
- **Validators**: `[required]` â†’ `Validators.required`. `[maxlength]` â†’ `Validators.maxLength`. `[pattern]` â†’ `Validators.pattern` (raw regex string). `[validator]` â†’ async custom validator. `[inlineError]="msg"` â†’ synthetic `inlineError` validator. Error tooltip messages: required â†’ "Vui lÃ²ng nháº­p thÃ´ng tin"; maxlength â†’ "Sá»‘ kÃ½ tá»± tá»‘i Ä‘a: N"; pattern â†’ "Äá»‹nh dáº¡ng khÃ´ng há»£p lá»‡"; customValidator â†’ message returned by validator; inlineError â†’ echoes `inlineError`.
- **Reactive validator updates** â€” validator inputs (`required` / `maxlength` / `pattern` / `inlineError` / `validator`) are signal inputs; an internal `effect()` re-runs `setValidators` + `updateValueAndValidity({ emitEvent: false })` whenever any of them changes. You can flip `required` on/off at runtime and the control re-validates automatically.
- **`[disabled]` reactive** â€” toggling `disabled` calls `formControl.disable() / enable()` via an effect, with `emitEvent: false` (no spurious `statusChanges` emitted).
- **`[(model)]` two-way** â€” host-side writes propagate via a signal effect: when `model` changes, the component calls `formControl.setValue(val, { emitEvent: false })` so the host won't re-trigger its own `(modelChange)` listener. The reverse direction (user typing â†’ `valueChanges` â†’ `valueModel.set()` â†’ `(modelChange)` emit) runs through the normal Angular signal-model mechanism.
- **Auto-trim on blur** â€” leading/trailing whitespace is stripped when the user blurs the field. This triggers a `setValue` which propagates to `sdChange` if the value actually changed.
- **Default `appearance`** â€” when `[appearance]` is omitted, the component reads the `SD_FORM_CONFIGURATION` injection token (`{ appearance: MatFormFieldAppearance }`). Provide it once at application bootstrap to flip ALL form fields to `'fill'` (or any other appearance). Falls back to `'outline'` if the token is not provided.

### Three ways to integrate

```html
<!-- 1. Standalone two-way binding (no FormGroup) -->
<sd-textarea
  label="Ghi chÃº"
  [(model)]="model.note">
</sd-textarea>

<!-- 2. Reactive FormGroup (self-registers via addControl) -->
<form [formGroup]="form">
  <sd-textarea
    label="MÃ´ táº£" name="description"
    [form]="form" required
    [maxlength]="500"
    [(model)]="model.description">
  </sd-textarea>
</form>

<!-- 3. Template-driven NgForm -->
<form #f="ngForm">
  <sd-textarea
    label="LÃ½ do" name="reason"
    [form]="f" required
    [(model)]="model.reason">
  </sd-textarea>
</form>
```

> **How it works**: the `[form]` signal-input has a `transform` that detects `NgForm` (via `instanceof NgForm` â€” unwraps `.form`) and `FormGroup` (used directly). It also accepts an object literal of shape `{ form: FormGroup }` as a safety fallback. In all three patterns the component manages `addControl` / `removeControl` lifecycle internally â€” never call them yourself.

## Visual cues (helps agent map screenshots â†’ component)
- A multi-line text box, default 5 rows tall, with the standard outlined Material chrome (label floats above on focus / when filled)
- A small resize handle in the bottom-right corner (browser default for `<textarea>`) â€” UNLESS `[autoHeight]="true"`, which disables vertical scroll and grows the box as the user types
- When `[maxlength]` is set: a small `123/500` counter appears as a suffix at the bottom-right inside the field
- Required marker shows as a red `*` next to the label
- When `[hideInlineError]="true"`: red error-icon suffix with hover-tooltip; otherwise inline `<mat-error>` below the field
- Helper text shows as an info icon (`info_outline`) next to the label, with the helper text in a tooltip
- In `[viewed]="true"` mode: just plain text â€” the saved value (or via `<ng-template sdViewDef>`); empty values render as em-dash via `sdEmpty`

## Examples

### 1. Required description with maxlength counter
```html
<sd-textarea
  [form]="form" name="description"
  label="MÃ´ táº£" required
  [maxlength]="500"
  [(model)]="model.description">
</sd-textarea>
```

### 2. Auto-growing comment box
```html
<sd-textarea
  [form]="form" name="comment"
  label="Ghi chÃº"
  autoHeight rows="3"
  placeholder="Nháº­p ghi chÃº..."
  [(model)]="model.comment">
</sd-textarea>
```

### 3. Pattern + custom async validator
```html
<sd-textarea
  [form]="form" name="address"
  label="Äá»‹a chá»‰" required
  [pattern]="addressRegex"
  [validator]="checkAddressOnServer"
  [(model)]="model.address">
</sd-textarea>
```

### 4. DETAIL state with custom view template
```html
<sd-textarea
  label="LÃ½ do tá»« chá»‘i"
  [model]="model.rejectReason"
  [viewed]="true">
  <ng-template sdViewDef let-value>
    <pre class="text-black700 T14R">{{ value }}</pre>
  </ng-template>
</sd-textarea>
```

### 5. Custom suffix (clear button)
```html
<sd-textarea label="Ghi chÃº" [(model)]="note">
  <ng-template sdSuffixDef>
    <sd-button type="link" prefixIcon="close" (click)="note = ''"></sd-button>
  </ng-template>
</sd-textarea>
```

## Anti-patterns
- âŒ Using `formControlName` / `[(ngModel)]` â€” not wired; use `[form]+[name]` and `[(model)]`.
- âŒ Using `<sd-textarea>` for single-line text â€” use `<sd-input>` (visual convention + Enter-to-submit semantics).
- âŒ Combining `[autoHeight]="true"` with a tall fixed `[rows]` â€” the row attribute only sets the initial height before auto-grow kicks in; large `rows` defeats the auto-grow effect.
- âŒ Wiring up trim logic in the parent â€” the component already trims on blur.
- âŒ Using `[disabled]="true"` to express read-only DETAIL state â€” use `[viewed]="true"` so the saved value renders as text.
- âŒ Setting `[maxlength]` to a non-positive integer â€” the input transform coerces it to `null` (validator + counter both vanish). Use a positive integer.

## Related
- `<sd-input>` â€” single-line text
- `<sd-input-number>` â€” numeric input with thousand-separator
- `<sd-label>` â€” label primitive
- `SdSuffixDefDirective` / `SdLabelDefDirective` / `SdViewDefDirective` â€” content-projection slots
- `SD_FORM_CONFIGURATION` token â€” global default `appearance`

