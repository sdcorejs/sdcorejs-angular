# `<sd-input>`

**Type**: Component (form input)
**Selector**: `sd-input`
**Import path**: `@sdcorejs/angular/forms/input` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdInput`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Workhorse text input â€” single-line `text`/`email`/`password`/`number` field with label, validators (required/min/max-length/pattern), pattern presets, and DETAIL `[viewed]` read-only mode. Use this everywhere a user types free text.

## When to use
- Any free-text field on a form (name, code, description-short, email, phone, password, â€¦)
- Search-as-you-type input on toolbars / list filters
- Numeric ID fields where digits-only formatting is NOT needed (use `<sd-input-number>` for numeric formatting)
- DETAIL state via `[viewed]="true"` to render the saved value (or a hyperlink) instead of the input chrome

## When NOT to use
- Numbers with thousand-separator / decimals / VND-style formatting â†’ use `<sd-input-number>`
- Multi-line text â†’ use `<sd-textarea>`
- Selecting from a list â†’ use `<sd-select>` / `<sd-autocomplete>`
- Picking a date or datetime â†’ use `<sd-date>` / `<sd-datetime>` / `<sd-date-range>`
- Multi-tag input â†’ use `<sd-chip>`

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `autoId` | `string \| null \| undefined` | `undefined` | Generates `data-autoId="forms-input-<value>"` for E2E selectors. |
| `name` | `string` | random uuid | FormGroup control name when bound via `[form]`. |
| `appearance` | `MatFormFieldAppearance` | from `SD_FORM_CONFIGURATION` ?? `'outline'` | Material form-field style. |
| `floatLabel` | `FloatLabelType` | `'auto'` | Material float-label behaviour. |
| `size` | `Size` (`'sm' \| 'md' \| 'lg'`) | `'md'` | Field height. |
| `form` | `NgForm \| FormGroup \| undefined` | `undefined` | Parent form. NgForm is auto-unwrapped to its inner `FormGroup`. |
| `label` | `string \| undefined` | `undefined` | Field label (rendered via `<sd-label>`). |
| `helperText` | `string \| undefined` | `undefined` | Hint text under the field. |
| `placeholder` | `string \| undefined` | `undefined` | Placeholder when empty. |
| `type` | `'text' \| 'number' \| 'password' \| 'email'` | `'text'` | HTML input type. For numeric formatting, prefer `<sd-input-number>` over `type="number"`. |
| `minlength` | `number \| undefined` | `undefined` | Adds `Validators.minLength`. |
| `maxlength` | `number \| undefined` | `undefined` | Adds `Validators.maxLength`. |
| `pattern` | `ValidationPatternType \| string \| null \| undefined` | `undefined` | Either a known `ValidationPatternType` (e.g. `EMAIL`, `PHONE`, `TAX_CODE` â€” looked up in `VALIDATION_PATTERNS`) OR a raw regex string. |
| `patternErrorMessage` | `string \| null \| undefined` | from preset | Override the error message for `pattern`. Falls back to the preset's built-in message. |
| `validator` | `SdCustomValidator \| undefined` | `undefined` | Async custom validator (wrapped via `HandleSdCustomValidator`). |
| `inlineError` | `string \| undefined` | `undefined` | Forces an inline error message (synthetic `inlineError` validator). |
| `tooltip` | `string \| undefined` | `undefined` | Hover tooltip on the field. |
| `hyperlink` | `string \| null \| undefined` | `undefined` | Render value as a link in `[viewed]` mode. |
| `required` | `boolean` | `false` | Adds `Validators.required`. |
| `readonly` | `boolean` | `false` | HTML `readonly` â€” input still focusable, value cannot be edited. |
| `disabled` | `boolean` | `false` | Disables the control. |
| `viewed` | `boolean` | `false` | Read-only DETAIL mode â€” hides input, renders value (or `<ng-template sdViewDef>`). |
| `blurOnEnter` | `boolean` | `false` | If `true`, pressing Enter blurs the field after emitting `keyupEnter`. |
| `hideInlineError` | `boolean` | `false` | Hide inline message; surfaces error via `errorTooltipMessage`. |
| `model` | `any` | `undefined` | Two-way bound value (use `[(model)]`). |

> **Coerce**: `required`, `readonly`, `disabled`, `viewed`, `blurOnEnter`, `hideInlineError` use `booleanAttribute` â€” bare attribute = `true`.

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `sdChange` | `any` | Emitted when the value changes (after Angular value-change). |
| `sdFocus` | `void` | Fires on focus. |
| `sdBlur` | `any` | Fires on blur, payload = trimmed value. |
| `keyupEnter` | `any` | Fires on Enter keyup, payload = trimmed value. |
| `sdFocusForceBlur` | `void` (EventEmitter) | When a parent subscribes, focusing the input immediately blurs it and emits â€” used to delegate focus elsewhere (e.g. open a side picker on click). |

## Content projection (slots)
- `#sdLabel` template â€” custom label rendering
- `#sdValue` template â€” custom display rendering
- `<ng-template sdSuffixDef>` â€” custom suffix (e.g. icon button) rendered at the trailing edge of the field
- `<ng-template sdViewDef>` â€” read-only display template used in `[viewed]` mode

## Form integration
- **Does NOT implement `ControlValueAccessor`.** Forms use the SDCoreJS pattern: pass the parent form via `[form]="formGroup"` (or `[form]="ngForm"`) plus a `name`. On `ngAfterViewInit`, the component calls `formGroup.addControl(name, formControl)` and removes it in `ngOnDestroy`.
- **`formControlName` and `[(ngModel)]` are NOT supported.** Use `[(model)]` for two-way value binding and `[form]+[name]` for FormGroup integration.
- **`[viewed]="true"`** flips into DETAIL read-only mode: the input is hidden and the value (or `<ng-template sdViewDef>`) is rendered. If `hyperlink` is set, the value renders as a link.
- **Validators**: `[required]` â†’ `Validators.required`. `[minlength]` / `[maxlength]` â†’ Angular's built-in length validators. `[pattern]` accepts either an `ValidationPatternType` preset (looked up in `VALIDATION_PATTERNS`) or a raw regex string. `[validator]` accepts an async custom validator. `[inlineError]="msg"` injects a synthetic error. Built-in error tooltip messages: required â†’ "Vui lÃ²ng nháº­p thÃ´ng tin"; maxlength â†’ "Sá»‘ kÃ½ tá»± tá»‘i Ä‘a: N"; pattern â†’ preset message or "Äá»‹nh dáº¡ng khÃ´ng há»£p lá»‡"; inlineError â†’ echoes `inlineError`.
- **Reactive validator updates** â€” validator inputs (`required` / `minlength` / `maxlength` / `pattern` / `inlineError` / `validator`) are signal inputs; an internal `effect()` re-runs `setValidators` + `updateValueAndValidity({ emitEvent: false })` whenever any of them changes. You can flip `required` on/off at runtime and the control re-validates automatically (no manual `reValidate()` needed).
- **`[disabled]` reactive** â€” toggling `disabled` calls `formControl.disable() / enable()` via an effect, with `emitEvent: false` (no spurious `statusChanges`).
- **`[(model)]` two-way** â€” host-side writes propagate via an effect: when `model` changes, the component calls `formControl.setValue(val, { emitEvent: false })` so the host won't re-trigger its own `(modelChange)` listener. The reverse direction (user typing â†’ `valueChanges` â†’ `valueModel.set()` â†’ `(modelChange)` emit) runs through the normal Angular signal-model mechanism.
- **Auto-trim on blur / Enter** â€” leading/trailing whitespace is stripped from the value when the user blurs or presses Enter.
- **Default `appearance`** â€” when `[appearance]` is omitted, the component reads the `SD_FORM_CONFIGURATION` injection token (`{ appearance: MatFormFieldAppearance }`). Provide it once at the application bootstrap to flip ALL inputs to `'fill'` (or any other appearance) without touching each template. Falls back to `'outline'` if the token isn't provided.

### Three ways to integrate

```html
<!-- 1. Template-driven with [(model)] (no FormGroup) -->
<sd-input label="Há» tÃªn" [(model)]="model.name"></sd-input>

<!-- 2. Reactive FormGroup (pass the group in, the input self-registers via addControl) -->
<form [formGroup]="form">
  <sd-input label="Há» tÃªn" name="name" [form]="form" required></sd-input>
</form>

<!-- 3. NgForm (template-driven group) -->
<form #f="ngForm">
  <sd-input label="Há» tÃªn" name="name" [form]="f" required></sd-input>
</form>
```

> **How it works**: the `[form]` signal-input has a `transform` that detects `NgForm` (via `instanceof NgForm` â€” unwraps `.form`) and `FormGroup` (used directly). It also accepts an object literal of shape `{ form: FormGroup }` as a safety fallback. In all three patterns the component manages `addControl` / `removeControl` lifecycle internally â€” never call them yourself.

## Visual cues (helps agent map screenshots â†’ component)
- A standard outlined Material input field with optional label (floats above on focus or when filled)
- Required marker shows as a red `*` next to the label
- Optional suffix slot (`sdSuffixDef`) for an icon button at the trailing edge â€” common patterns: clear button, search icon, eye-toggle for password
- Inline error message appears below the field in red â€” unless `[hideInlineError]="true"`, in which case the field gets a red outline + error tooltip
- Helper text shows as light-gray text below the field (or as an info icon next to the label, depending on layout)
- In `[viewed]="true"` mode: no input chrome â€” just the value as plain text (or as a hyperlink if `hyperlink` is set)

## Examples

### 1. Required text with maxlength
```html
<sd-input
  [form]="form" name="customerName"
  label="TÃªn khÃ¡ch hÃ ng"
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
  label="TÃ¬m kiáº¿m" placeholder="Nháº­p tá»« khÃ³aâ€¦"
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
  label="MÃ£ khÃ¡ch hÃ ng"
  [model]="model.customerCode"
  [viewed]="true"
  hyperlink="/customer/{{ model.customerCode }}">
</sd-input>
```

### 5. Custom async validator (uniqueness check)
```html
<sd-input
  [form]="form" name="taxCode"
  label="MÃ£ sá»‘ thuáº¿" required
  pattern="TAX_CODE"
  [validator]="checkTaxCodeUnique"
  [(model)]="model.taxCode">
</sd-input>
```

## Anti-patterns
- âŒ Using `formControlName` / `[(ngModel)]` â€” not wired; use `[form]+[name]` and `[(model)]`.
- âŒ Using `[disabled]="true"` to express read-only DETAIL state â€” use `[viewed]="true"` instead so labels/links render correctly.
- âŒ Using `type="number"` for VND amounts â€” use `<sd-input-number>` for proper thousand-separator formatting.
- âŒ Wiring up trim logic in the parent â€” the component already trims on blur/Enter.
- âŒ Hard-coding regex for common patterns â€” check `VALIDATION_PATTERNS` first (`EMAIL`, `PHONE`, `TAX_CODE`, â€¦) so error messages stay consistent.
- âŒ Hand-rolling a "clear" suffix â€” most layouts prefer letting the user select-all / delete; only add an explicit clear button when the field is critical (search bars, filters).

## Related
- `<sd-input-number>` â€” numeric input with thousand-separator / decimal handling
- `<sd-textarea>` â€” multi-line text
- `<sd-autocomplete>` â€” text input with typeahead dropdown
- `<sd-label>` â€” label primitive used internally
- `SdSuffixDefDirective` â€” custom suffix template
- `SdViewDefDirective` â€” DETAIL-mode template projection
- `VALIDATION_PATTERNS` / `ValidationPatternType` â€” pattern presets registry
- `SD_FORM_CONFIGURATION` token â€” global default `appearance`
- `backendErrorValidator(msg)` â€” exported helper to surface a backend error message as a validator

