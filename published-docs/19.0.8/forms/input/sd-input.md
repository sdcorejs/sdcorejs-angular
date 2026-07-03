# `<sd-input>`

**Type**: Component (form input)
**Selector**: `sd-input`
**Import path**: `@sdcorejs/angular/forms/input` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdInput`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Workhorse text input — single-line `text`/`email`/`password`/`number` field with label, validators (required/min/max-length/pattern), pattern presets, and DETAIL `[viewed]` read-only mode. Use this everywhere a user types free text.

## When to use
- Any free-text field on a form (name, code, description-short, email, phone, password, …)
- Search-as-you-type input on toolbars / list filters
- Numeric ID fields where digits-only formatting is NOT needed (use `<sd-input-number>` for numeric formatting)
- DETAIL state via `[viewed]="true"` to render the saved value (or a hyperlink) instead of the input chrome

## When NOT to use
- Numbers with thousand-separator / decimals / VND-style formatting → use `<sd-input-number>`
- Multi-line text → use `<sd-textarea>`
- Selecting from a list → use `<sd-select>` / `<sd-autocomplete>`
- Picking a date or datetime → use `<sd-date>` / `<sd-datetime>` / `<sd-date-range>`
- Multi-tag input → use `<sd-chip>`

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `autoId` | `string \| null \| undefined` | `undefined` | Generates `data-autoid="forms-input-<value>"` for E2E selectors. |
| `name` | `string` | random uuid | FormGroup control name when bound via `[form]`. |
| `appearance` | `MatFormFieldAppearance` | from `SD_FORM_CONFIGURATION` ?? `'outline'` | Material form-field style. |
| `floatLabel` | `FloatLabelType` | `'auto'` | Material float-label behaviour. |
| `size` | `Size` (`'sm' \| 'md' \| 'lg'`) | `'md'` | Field height. Use `size="sm"` inside `<sd-table>` filters/cells or other dense table UI. |
| `form` | `NgForm \| FormGroup \| undefined` | `undefined` | Parent form. NgForm is auto-unwrapped to its inner `FormGroup`. |
| `label` | `string \| undefined` | `undefined` | Field label (rendered via `<sd-label>`). |
| `helperText` | `string \| undefined` | `undefined` | Hint text under the field. |
| `placeholder` | `string \| undefined` | `undefined` | Placeholder when empty. |
| `type` | `'text' \| 'number' \| 'password' \| 'email'` | `'text'` | HTML input type. For numeric formatting, prefer `<sd-input-number>` over `type="number"`. |
| `minlength` | `number \| undefined` | `undefined` | Adds `Validators.minLength`. |
| `maxlength` | `number \| undefined` | `undefined` | Adds `Validators.maxLength`. |
| `pattern` | `ValidationPatternType \| string \| null \| undefined` | `undefined` | Either a known `ValidationPatternType` (e.g. `EMAIL`, `PHONE`, `TAX_CODE` — looked up in `VALIDATION_PATTERNS`) OR a raw regex string. |
| `patternErrorMessage` | `string \| null \| undefined` | from preset | Override the error message for `pattern`. Falls back to the preset's built-in message. |
| `validator` | `SdCustomValidator \| undefined` | `undefined` | Async custom validator (wrapped via `HandleSdCustomValidator`). |
| `inlineError` | `string \| undefined` | `undefined` | Forces an inline error message (synthetic `inlineError` validator). |
| `tooltip` | `string \| undefined` | `undefined` | Hover tooltip on the field. |
| `hyperlink` | `string \| null \| undefined` | `undefined` | Render value as a link in `[viewed]` mode. |
| `required` | `boolean` | `false` | Adds `Validators.required`. |
| `readonly` | `boolean` | `false` | HTML `readonly` — input still focusable, value cannot be edited. |
| `disabled` | `boolean` | `false` | Disables the control. |
| `viewed` | `boolean \| 'inline'` | `false` | Display mode. `false` edit · `true` static DETAIL (`<sd-view>` / `sdViewDef`) · `'inline'` **borderless inline-edit** — the real `<input>` renders transparent/borderless (looks like text), click/focus to edit directly (NO panel, NO overlay); blur reverts to the text look. Disabled `'inline'` → static view. |
| `blurOnEnter` | `boolean` | `false` | If `true`, pressing Enter blurs the field after emitting `keyupEnter`. |
| `hideInlineError` | `boolean` | `false` | Hide inline message; surfaces error via `errorMessage`. |
| `model` | `any` | `undefined` | Two-way bound value (use `[(model)]`). |

> **Coerce**: `required`, `readonly`, `disabled`, `viewed`, `blurOnEnter`, `hideInlineError` use `booleanAttribute` — bare attribute = `true`.

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `sdChange` | `any` | Emitted when the value changes (after Angular value-change). |
| `sdFocus` | `void` | Fires on focus. |
| `sdBlur` | `any` | Fires on blur, payload = trimmed value. |
| `keyupEnter` | `any` | Fires on Enter keyup, payload = trimmed value. |
| `sdFocusForceBlur` | `void` (EventEmitter) | When a parent subscribes, focusing the input immediately blurs it and emits — used to delegate focus elsewhere (e.g. open a side picker on click). |

## Public methods
| Name | Signature | Notes |
| --- | --- | --- |
| `clear($event?)` | `(Event?) => void` | Resets the value to `null` and emits `sdChange(null)`. No-op when already empty. Backs the built-in clear button. |
| `showClear()` | `() => boolean` | Whether the built-in clear button should render: there is a value AND not `required`/`disabled`/`readonly`. |
| `focus()` / `blur()` | `() => void` | Programmatic focus / blur of the native input. |
| `reValidate()` | `() => void` | Re-runs validators on the underlying control. |

## Host classes
Applied automatically on `<sd-input>` for styling hooks:

| Class | Condition | Effect |
| --- | --- | --- |
| `sd-has-label` | `[label]` is truthy | Adds `padding-top: 4px` so the floating label has room and is not clipped. Absent → no top padding. |
| `sd-viewed` | `[viewed]="true"` | Removes top padding (read-only text only). Overrides `sd-has-label` when both are set (source order). |

## Content projection (slots)
- `#sdLabel` template — custom label rendering
- `#sdValue` template — custom display rendering
- `<ng-template sdSuffixDef>` — custom suffix (e.g. icon button) rendered at the trailing edge of the field
- `<ng-template sdViewDef>` — read-only display template used in `[viewed]` mode

## Form integration
- **Does NOT implement `ControlValueAccessor`.** Forms use the SDCoreJS pattern: pass the parent form via `[form]="formGroup"` (or `[form]="ngForm"`) plus a `name`. On `ngAfterViewInit`, the component calls `formGroup.addControl(name, formControl)` and removes it in `ngOnDestroy`.
- **`formControlName` and `[(ngModel)]` are NOT supported.** Use `[(model)]` for two-way value binding and `[form]+[name]` for FormGroup integration.
- **`[viewed]="true"`** flips into DETAIL read-only mode: the input is hidden and the value (or `<ng-template sdViewDef>`) is rendered. If `hyperlink` is set, the value renders as a link.
- **Validators**: `[required]` → `Validators.required`. `[minlength]` / `[maxlength]` → Angular's built-in length validators. `[pattern]` accepts either an `ValidationPatternType` preset (looked up in `VALIDATION_PATTERNS`) or a raw regex string. `[validator]` accepts an async custom validator. `[inlineError]="msg"` injects a synthetic error. Built-in error tooltip messages: required → "Vui lòng nhập thông tin"; maxlength → "Số ký tự tối đa: N"; pattern → preset message or "Định dạng không hợp lệ"; inlineError → echoes `inlineError`.
- **Reactive validator updates** — validator inputs (`required` / `minlength` / `maxlength` / `pattern` / `inlineError` / `validator`) are signal inputs; an internal `effect()` re-runs `setValidators` + `updateValueAndValidity({ emitEvent: false })` whenever any of them changes. You can flip `required` on/off at runtime and the control re-validates automatically (no manual `reValidate()` needed).
- **`[disabled]` reactive** — toggling `disabled` calls `formControl.disable() / enable()` via an effect, with `emitEvent: false` (no spurious `statusChanges`).
- **`[(model)]` two-way** — host-side writes propagate via an effect: when `model` changes, the component calls `formControl.setValue(val, { emitEvent: false })` so the host won't re-trigger its own `(modelChange)` listener. The reverse direction (user typing → `valueChanges` → `valueModel.set()` → `(modelChange)` emit) runs through the normal Angular signal-model mechanism.
- **Auto-trim on blur / Enter** — leading/trailing whitespace is stripped from the value when the user blurs or presses Enter.
- **Default `appearance`** — when `[appearance]` is omitted, the component reads the `SD_FORM_CONFIGURATION` injection token (`{ appearance: MatFormFieldAppearance }`). Provide it once at the application bootstrap to flip ALL inputs to `'fill'` (or any other appearance) without touching each template. Falls back to `'outline'` if the token isn't provided.

### Three ways to integrate

```html
<!-- 1. Template-driven with [(model)] (no FormGroup) -->
<sd-input label="Họ tên" [(model)]="model.name"></sd-input>

<!-- 2. Reactive FormGroup (pass the group in, the input self-registers via addControl) -->
<form [formGroup]="form">
  <sd-input label="Họ tên" name="name" [form]="form" required></sd-input>
</form>

<!-- 3. NgForm (template-driven group) -->
<form #f="ngForm">
  <sd-input label="Họ tên" name="name" [form]="f" required></sd-input>
</form>
```

> **How it works**: the `[form]` signal-input has a `transform` that detects `NgForm` (via `instanceof NgForm` — unwraps `.form`) and `FormGroup` (used directly). It also accepts an object literal of shape `{ form: FormGroup }` as a safety fallback. In all three patterns the component manages `addControl` / `removeControl` lifecycle internally — never call them yourself.

## Visual cues (helps agent map screenshots → component)
- A standard outlined Material input field with optional label (floats above on focus or when filled)
- Required marker shows as a red `*` next to the label
- Built-in **slim clear button** (`.sd-clear-btn`, thin `close` icon) at the trailing edge when the field has a value AND is not `required`/`disabled`/`readonly`. It is **hover-gated** (`sd-hover`) — hidden until the field is hovered or focused. Click resets the value to `null` and emits `sdChange(null)` (clear is an explicit action → `null`, never `''`/`undefined`; `undefined` is reserved for the pristine never-touched state). Shared style/behavior with `sd-input-number`/`sd-input-color`/`sd-date`/`sd-datetime`.
- Optional suffix slot (`sdSuffixDef`) for an extra icon button at the trailing edge — common patterns: search icon, eye-toggle for password. Renders to the right of the built-in clear button.
- Inline error message appears below the field in red — unless `[hideInlineError]="true"`, in which case the field gets a red outline + a trailing-edge `error` icon (`.sd-error-icon`) carrying the message as a tooltip. The error icon sits **flush at the right edge**; when the built-in clear button is also present it renders to the **left** of the error icon (the hover-gated clear reserves its slot via `visibility:hidden`, so it never shifts the error icon inward).
- Helper text shows as light-gray text below the field (or as an info icon next to the label, depending on layout)
- In `[viewed]="true"` mode: no input chrome — just the value as plain text (or as a hyperlink if `hyperlink` is set)

## Dense dashboard/filter usage

When this control is rendered in dashboard cards, filter bars, external filter panels, table toolbars, query bars, or other compact non-form surfaces, prefer `hideInlineError` so Material does not reserve the inline error/subscript row under the field. Pair it with `size="sm"` when the component supports `size`. Validation remains visible through the compact error icon/tooltip without increasing the control height.

```html
<sd-input size="sm" hideInlineError placeholder="Search" [(model)]="filter.keyword"></sd-input>
```

## Examples

### 1. Required text with maxlength
```html
<sd-input
  [form]="form" name="customerName"
  label="Tên khách hàng"
  required maxlength="100"
  [(model)]="model.customerName"
  (sdChange)="onNameChange($event)">
</sd-input>
```

### 2. Email with pattern preset
```html
<sd-input
  [form]="form" name="email"
  label="Email" type="email"
  pattern="EMAIL"
  [(model)]="model.email">
</sd-input>
```

### 3. Search-as-you-type with custom suffix
```html
<sd-input
  label="Tìm kiếm" placeholder="Nhập từ khóa…"
  [(model)]="search"
  blurOnEnter
  (keyupEnter)="onSearch($event)">
  <ng-template sdSuffixDef>
    <sd-button type="link" prefixIcon="search" (click)="onSearch(search)"></sd-button>
  </ng-template>
</sd-input>
```

### 4. DETAIL state with hyperlink
```html
<sd-input
  label="Mã khách hàng"
  [model]="model.customerCode"
  [viewed]="true"
  hyperlink="/customer/{{ model.customerCode }}">
</sd-input>
```

### 5. Custom async validator (uniqueness check)
```html
<sd-input
  [form]="form" name="taxCode"
  label="Mã số thuế" required
  pattern="TAX_CODE"
  [validator]="checkTaxCodeUnique"
  [(model)]="model.taxCode">
</sd-input>
```

## E2E test attributes

Rendered on the inner `<input matInput>` element (same anchor as `data-autoid`):

| Attribute | Value | Source |
|---|---|---|
| `data-autoid` | `forms-input-<autoId>` | input `autoId` |
| `data-disabled` | `"true"` / `"false"` | `formControl.disabled` |
| `data-invalid` | `"true"` / `"false"` | `formControl.invalid && (touched \|\| dirty)` |
| `data-empty` | `"true"` / `"false"` | `sdIsEmpty(formControl.value)` |
| `data-value` | string (omitted when `type="password"`) | `sdSerializeDataValue(formControl.value)` |
| `data-required` | `"true"` / `"false"` | `required` input; always present |
| `data-maxlength` | numeric string | present only when `[maxlength]` is defined |
| `data-minlength` | numeric string | present only when `[minlength]` is defined |
| `data-pattern` | string | present only when `[pattern]` is non-empty |
| `data-error-message` | string | present only when the component is currently showing an error tooltip message |

Selector example:

```ts
const el = page.locator('[data-autoid="forms-input-username"]');
await expect(el).toHaveAttribute('data-empty', 'false');
await expect(el).toHaveAttribute('data-invalid', 'false');
await expect(el).toHaveAttribute('data-value', 'someuser');
// validation meta (when set)
await expect(el).toHaveAttribute('data-required', 'true');
await expect(el).toHaveAttribute('data-maxlength', '100');
await expect(el).toHaveAttribute('data-minlength', '3');
await expect(el).toHaveAttribute('data-pattern', 'EMAIL');
// error message — only when field is in error state
await expect(el).toHaveAttribute('data-error-message', 'Vui lòng nhập thông tin');
```

## Anti-patterns
- ❌ Using `formControlName` / `[(ngModel)]` — not wired; use `[form]+[name]` and `[(model)]`.
- ❌ Using `[disabled]="true"` to express read-only DETAIL state — use `[viewed]="true"` instead so labels/links render correctly.
- ❌ Using `type="number"` for VND amounts — use `<sd-input-number>` for proper thousand-separator formatting.
- ❌ Wiring up trim logic in the parent — the component already trims on blur/Enter.
- ❌ Hard-coding regex for common patterns — check `VALIDATION_PATTERNS` first (`EMAIL`, `PHONE`, `TAX_CODE`, …) so error messages stay consistent.
- ❌ Hand-rolling a "clear" suffix via `sdSuffixDef` — a hover-gated clear button is now **built in** (auto-shows when there's a value and the field is editable). Use `sdSuffixDef` only for additional affordances (search, password toggle, swatch …).

## Related
- `<sd-input-number>` — numeric input with thousand-separator / decimal handling
- `<sd-textarea>` — multi-line text
- `<sd-autocomplete>` — text input with typeahead dropdown
- `<sd-label>` — label primitive used internally
- `SdSuffixDefDirective` — custom suffix template
- `SdViewDefDirective` — DETAIL-mode template projection
- `VALIDATION_PATTERNS` / `ValidationPatternType` — pattern presets registry
- `SD_FORM_CONFIGURATION` token — global default `appearance`
