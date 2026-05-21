# `<sd-input-number>`

**Type**: Component (form input)
**Selector**: `sd-input-number`
**Import path**: `@sdcorejs/angular/forms/input-number` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdInputNumber`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Numeric input with locale-aware formatting (VN `1.234.567,89` or ISO `1,234,567.89`), keystroke filtering, optional negative/positive constraint, decimal precision, and min/max validators. Use for any monetary or quantity field.

## When to use
- VND / USD / any currency amount field (price, total, balance, â€¦)
- Quantity / count fields (stock qty, headcount, items)
- Rates and percentages (entered as a number â€” pair with a `%` suffix label)
- Any numeric field where the user benefits from thousand-separator grouping while typing
- DETAIL state via `[viewed]="true"` to render the formatted number (or a hyperlink)

## When NOT to use
- Free text containing digits but not a quantity (phone number, tax code, IDs) â†’ use `<sd-input>` with appropriate `pattern`
- Date / time â†’ use `<sd-date>` / `<sd-datetime>` / `<sd-date-range>`
- A picker from a list of numeric codes â†’ use `<sd-select>` / `<sd-autocomplete>`
- Sliders for ranges â†’ not in this component; use a Material slider directly

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `autoId` | `string \| null \| undefined` | `undefined` | Generates `data-autoId="forms-input-number-<value>"` for E2E selectors. |
| `name` | `string` | random uuid | FormGroup control name when bound via `[form]`. |
| `size` | `Size` (`'sm' \| 'md' \| 'lg'`) | `'md'` | Field height. |
| `form` | `NgForm \| FormGroup \| undefined` | `undefined` | Parent form. NgForm is auto-unwrapped to its inner `FormGroup`. |
| `label` | `string \| undefined` | `undefined` | Field label (rendered via `<sd-label>`). |
| `helperText` | `string \| undefined` | `undefined` | Hint text under the field. |
| `placeholder` | `string \| undefined` | `undefined` | Placeholder when empty. |
| `appearance` | `MatFormFieldAppearance` | from `SD_FORM_CONFIGURATION` ?? `'outline'` | Material form-field style. |
| `floatLabel` | `FloatLabelType` | `'auto'` | Material float-label behaviour. |
| `type` | `'negative' \| 'positive' \| undefined` | `undefined` | Constrain sign. `undefined` = both signs allowed; `'negative'` = must be negative; `'positive'` = no minus sign accepted. |
| `precision` | `number` | `3` | Max decimal places. `0` = integer only. |
| `min` | `number \| undefined` | `undefined` | Adds `Validators.min`. |
| `max` | `number \| undefined` | `undefined` | Adds `Validators.max`. |
| `validator` | `SdCustomValidator \| undefined` | `undefined` | Async custom validator (wrapped via `HandleSdCustomValidator`). |
| `inlineError` | `string \| undefined` | `undefined` | Forces an inline error message (synthetic `inlineError` validator). |
| `hyperlink` | `string \| null \| undefined` | `undefined` | Render value as a link in `[viewed]` mode. |
| `required` | `boolean` | `false` | Adds `Validators.required`. |
| `readonly` | `boolean` | `false` | HTML `readonly` â€” input still focusable. |
| `disabled` | `boolean` | `false` | Disables the control. |
| `viewed` | `boolean` | `false` | Read-only DETAIL mode â€” hides input, renders formatted number (or `<ng-template sdViewDef>`). |
| `blurOnEnter` | `boolean` | `false` | If `true`, Enter blurs the field after emitting `keyupEnter`. |
| `hideInlineError` | `boolean` | `false` | Hide inline message; surfaces error via `errorTooltipMessage`. |
| `model` | `any` (`number \| null`) | `undefined` | Two-way bound numeric value (use `[(model)]`). Stored as a JS number; emitted as number on change. |

> **Coerce**: `required`, `readonly`, `disabled`, `viewed`, `blurOnEnter`, `hideInlineError` use `booleanAttribute` â€” bare attribute = `true`.

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `sdChange` | `number \| null` | Emitted when the parsed numeric value changes. |
| `sdFocus` | `void` | Fires on focus. |
| `sdBlur` | `number \| null` | Fires on blur, payload = current numeric value (or `null` if cleared). |
| `keyupEnter` | `string` | Fires on Enter keyup, payload = the formatted display string. |
| `sdFocusForceBlur` | `void` (EventEmitter) | When a parent subscribes, focusing the input immediately blurs it and emits. |

## Content projection (slots)
- `#sdLabel` template â€” custom label rendering
- `#sdValue` template â€” custom display rendering
- `<ng-template sdSuffixDef>` â€” custom suffix (e.g. currency symbol, unit) at the trailing edge
- `<ng-template sdViewDef>` â€” read-only display template used in `[viewed]` mode

## Form integration
- **Does NOT implement `ControlValueAccessor`.** Forms use the SDCoreJS pattern: pass the parent form via `[form]="formGroup"` (or `[form]="ngForm"`) plus a `name`. On `ngAfterViewInit`, the component calls `formGroup.addControl(name, formControl)` and removes it in `ngOnDestroy`. Internally there are TWO controls (`formControl` for the parsed numeric value; `inputControl` for the raw display string with separators) but only `formControl` is registered to the parent form.
- **`formControlName` and `[(ngModel)]` are NOT supported.** Use `[(model)]` for two-way value binding and `[form]+[name]` for FormGroup integration.
- **`[viewed]="true"`** flips into DETAIL read-only mode: the input is hidden and the formatted number (or `<ng-template sdViewDef>`) is rendered. If `hyperlink` is set, the value renders as a link.
- **Validators**: `[required]` â†’ `Validators.required`. `[min]` / `[max]` â†’ Angular's `Validators.min` / `Validators.max`. `[validator]` accepts an async custom validator. Error tooltip messages: required â†’ "Vui lÃ²ng nháº­p thÃ´ng tin"; min â†’ "GiÃ¡ trá»‹ khÃ´ng Ä‘Æ°á»£c nhá» hÆ¡n N"; max â†’ "GiÃ¡ trá»‹ khÃ´ng Ä‘Æ°á»£c lá»›n hÆ¡n N"; inlineError â†’ echoes `inlineError`.
- **Reactive validator updates** â€” validator inputs (`required` / `min` / `max` / `inlineError` / `validator`) are signal inputs; an internal `effect()` re-runs `setValidators` + `updateValueAndValidity({ emitEvent: false })` whenever any of them changes. Validators update automatically at runtime â€” no manual `reValidate()` needed.
- **`[disabled]` reactive** â€” toggling `disabled` calls `inputControl.disable() / enable()` and `formControl.disable() / enable()` via an effect, with `emitEvent: false` (no spurious `statusChanges`).
- **`[(model)]` two-way** â€” host-side writes propagate via an effect: when `model` changes, the component calls `formControl.setValue(val, { emitEvent: false })` and syncs `inputControl` with the formatted display string so the host won't re-trigger its own `(modelChange)` listener. The reverse direction (user typing â†’ `inputControl.valueChanges` â†’ parse â†’ `valueModel.set()` â†’ `(modelChange)` emit) runs through the normal Angular signal-model mechanism.
- **Locale formatting** is driven by `SD_CORE_CONFIGURATION.format.number`. When set to `'1.234.567,89'` (VN-style), thousands separator is `.` and decimal separator is `,`. Otherwise ISO-style: thousands `,` and decimal `.`. Keystrokes that would break the active regex are blocked; paste and IME composition are validated and rolled back if invalid.
- **Blur clean-up** â€” on blur, a trailing decimal separator (e.g. `"123."`) is stripped; whitespace is trimmed; an empty or whitespace-only value resolves to `null`.
- **Default `appearance`** â€” when `[appearance]` is omitted, the component reads the `SD_FORM_CONFIGURATION` injection token (`{ appearance: MatFormFieldAppearance }`). Provide it once at application bootstrap to flip ALL form fields to `'fill'` (or any other appearance). Falls back to `'outline'` if the token is not provided.

### Three ways to integrate

```html
<!-- 1. Template-driven with [(model)] (no FormGroup) -->
<sd-input-number label="Sá»‘ tiá»n" [(model)]="model.amount"></sd-input-number>

<!-- 2. Reactive FormGroup (pass the group in, the input self-registers via addControl) -->
<form [formGroup]="form">
  <sd-input-number label="Sá»‘ tiá»n" name="amount" [form]="form" required></sd-input-number>
</form>

<!-- 3. NgForm (template-driven group) -->
<form #f="ngForm">
  <sd-input-number label="Sá»‘ tiá»n" name="amount" [form]="f" required></sd-input-number>
</form>
```

> **How it works**: the `[form]` signal-input has a `transform` that detects `NgForm` (via `instanceof NgForm` â€” unwraps `.form`) and `FormGroup` (used directly). It also accepts an object literal of shape `{ form: FormGroup }` as a safety fallback. In all three patterns the component manages `addControl` / `removeControl` lifecycle internally â€” never call them yourself.

## Visual cues (helps agent map screenshots â†’ component)
- An outlined input field that visually looks like `<sd-input>` BUT typed digits are auto-grouped â€” typing `1234567` shows `1.234.567` (VN) or `1,234,567` (ISO)
- Text often right-aligned (matches accountant convention) â€” actual alignment is set in the component CSS
- Optional currency symbol or unit shows in the suffix slot via `sdSuffixDef` (e.g. `Ä‘`, `VND`, `%`)
- An âœ• clear button may appear in the suffix when applicable
- In `[viewed]="true"` mode: no input chrome â€” just the formatted number as plain text (or as a hyperlink if `hyperlink` is set)

## Examples

### 1. VND amount with currency suffix
```html
<sd-input-number
  [form]="form" name="amount"
  label="Sá»‘ tiá»n" required
  type="positive" [precision]="0"
  [(model)]="model.amount">
  <ng-template sdSuffixDef>
    <span class="text-secondary">Ä‘</span>
  </ng-template>
</sd-input-number>
```

### 2. Quantity (integer only)
```html
<sd-input-number
  [form]="form" name="quantity"
  label="Sá»‘ lÆ°á»£ng"
  type="positive" [precision]="0"
  [min]="1" [max]="999"
  [(model)]="model.quantity">
</sd-input-number>
```

### 3. Percentage with 2 decimals
```html
<sd-input-number
  [form]="form" name="rate"
  label="LÃ£i suáº¥t (%)"
  [precision]="2" [min]="0" [max]="100"
  [(model)]="model.rate">
</sd-input-number>
```

### 4. DETAIL state read-only formatted display
```html
<sd-input-number
  label="Tá»•ng giÃ¡ trá»‹ há»£p Ä‘á»“ng"
  [model]="contract.totalValue"
  [viewed]="true">
</sd-input-number>
```

## Anti-patterns
- âŒ Using `formControlName` / `[(ngModel)]` â€” not wired; use `[form]+[name]` and `[(model)]`.
- âŒ Using `<sd-input type="number">` instead â€” that variant has no thousand-separator grouping and will not match the VN locale.
- âŒ Storing the model as a formatted string â€” the component emits a JS `number`. Keep `model.amount: number | null` in the parent.
- âŒ Setting `[precision]` higher than what the backend stores â€” display will round implicitly when the value comes back.
- âŒ Using `[disabled]="true"` to express read-only DETAIL state â€” use `[viewed]="true"` instead so labels/links render correctly.
- âŒ Using `type="positive"` AND a negative `[min]` simultaneously â€” the keystroke filter will block the minus sign and the validator will never trigger.

## Related
- `<sd-input>` â€” text input variant
- `<sd-label>` â€” label primitive used internally
- `SdSuffixDefDirective` â€” custom suffix template
- `SdViewDefDirective` â€” DETAIL-mode template projection
- `SdFormatNumberPipe` â€” display-only number formatter (used internally)
- `SD_CORE_CONFIGURATION.format.number` â€” switches VN vs ISO locale formatting
- `SD_FORM_CONFIGURATION` token â€” global default `appearance`

