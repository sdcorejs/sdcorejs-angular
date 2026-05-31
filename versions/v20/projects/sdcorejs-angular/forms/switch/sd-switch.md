�# `<sd-switch>`

**Type**: Component (form input)
**Selector**: `sd-switch`
**Import path**: `@sdcorejs/angular/forms/switch` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdSwitch`
**Standalone**: yes (declared via `imports`)
**Change detection**: `OnPush`

## One-line purpose
iOS-style toggle switch � boolean ON/OFF in a single tap. Use for feature flags, settings, "active/inactive" rows where the change applies immediately or as part of a form submission.

## When to use
- Boolean field whose default state is meaningful to surface ("Active", "Notify me", "Visible to public")
- Toolbar/list-row toggles (active/inactive, public/private)
- Settings panels with multiple boolean options stacked vertically
- Forms where the user expects a toggle metaphor rather than a checkbox metaphor

## When NOT to use
- Multi-state selection (3+ options) �  use `<sd-radio>` or `<sd-select>`
- Boolean field embedded in a list of items (with bulk-select semantics) �  use `<sd-checkbox>`
- "I agree to terms" checkboxes / form-prerequisite booleans �  use `<sd-checkbox>` (checkbox is the established convention for consent)

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `autoId` | `string \| null \| undefined` | `undefined` | Generates `data-autoId="forms-switch-<value>"` for E2E selectors. |
| `name` | `string` | random uuid | FormGroup control name when bound via `[form]`. |
| `size` | `Size` (`'sm' \| 'md' \| 'lg'`) | `'md'` | Reserved; current template does not branch on this. |
| `form` | `NgForm \| FormGroup \| undefined \| null` | `undefined` | Parent form. `NgForm` is auto-unwrapped to its inner `FormGroup`. |
| `label` | `string \| undefined` | `undefined` | Label rendered to the right of the toggle (via `<sd-label>`). |
| `color` | `Color` | `'primary'` | Material color for the ON state knob/track. |
| `model` | `boolean \| null \| undefined` | `false` | Two-way bound boolean (use `[(model)]`). |
| `required` | `boolean` | `false` | Adds `Validators.required`. Bare attribute = `true`. |
| `disabled` | `boolean` | `false` | Disables the underlying `FormControl`. Bare attribute = `true`. |
| `hideInlineError` | `boolean` | `false` | Hide inline `<mat-error>` message. Bare attribute = `true`. |

> **Coerce note**: `required`, `disabled`, `hideInlineError` accept `'' | true | false | null | undefined` � bare attribute presence (e.g. `<sd-switch required>`) is treated as `true`. (Hand-rolled in setters; not the `booleanAttribute` transform.)

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `modelChange` | `any` | Two-way binding companion for `[(model)]`. |
| `sdChange` | `any` | Emitted on every toggle with the new boolean value. |

## Content projection (slots)
None � label comes from the `[label]` input.

## Form integration
- **Does NOT implement `ControlValueAccessor`.** Forms use the SDCoreJS pattern: pass the parent form via `[form]="formGroup"` (or `[form]="ngForm"`) plus a `name`. On `ngAfterViewInit`, the component calls `formGroup.addControl(name, formControl)` and removes it in `ngOnDestroy`.
- **`formControlName` and `[(ngModel)]` are NOT supported.** Use `[(model)]` for two-way value binding and `[form]+[name]` for FormGroup integration.
- **No `[viewed]` mode** � the switch always renders as a toggle. For DETAIL display of a boolean, render plain text yourself (e.g. "Có" / "Không") in the parent view.
- **Validators**: `[required]` �  `Validators.required` (rejects `null`/`undefined`/empty; `false` is treated as valid). Built-in inline error: required �  "Vui lòng nhập thông tin"; suppressed when `[hideInlineError]="true"`.

### Three ways to integrate

```html
<!-- 1. Template-driven v�:i [(model)] (no FormGroup) -->
<sd-switch label="Bật thông báo" [(model)]="settings.notify"></sd-switch>

<!-- 2. Reactive FormGroup (truyền form vào �Ồ switch tự addControl) -->
<form [formGroup]="form">
  <sd-switch label="Bật" name="notify" [form]="form"></sd-switch>
</form>

<!-- 3. NgForm (template-driven group) -->
<form #f="ngForm">
  <sd-switch label="Bật" name="notify" [form]="f"></sd-switch>
</form>
```

> **How it works**: The setter detects `NgForm` (via `instanceof NgForm`) and unwraps its `.form` (`FormGroup`) automatically. In all three patterns the component manages `addControl` / `removeControl` lifecycle internally.

## Visual cues (helps agent map screenshots �  component)
- A small horizontal pill (track) with a circular sliding knob; OFF state = gray track + knob on the left, ON state = colored track (`color`) + knob on the right
- Optional label rendered to the RIGHT of the switch (a single line of text, with optional red `*` if `required`)
- Inline error message appears below the row in red when `formControl.touched && formControl.errors?.required` (i.e. `required` was set but the toggle is `false`); suppressed when `[hideInlineError]="true"`
- No outlined `mat-form-field` chrome � visually denser and lighter than `<sd-input>` / `<sd-select>`

## Examples

### 1. Active flag with two-way binding
```html
<sd-switch
  [form]="form" name="active"
  label="Hoạt ��"ng"
  [(model)]="model.active"
  (sdChange)="onActiveToggle($event)">
</sd-switch>
```

### 2. Notification opt-in (custom color)
```html
<sd-switch
  label="Nhận thông báo"
  color="success"
  [(model)]="settings.notify">
</sd-switch>
```

### 3. Required acceptance toggle
```html
<sd-switch
  [form]="form" name="acceptedTerms"
  label="Tôi ��ng ý v�:i �iều khoản" required
  [(model)]="model.acceptedTerms">
</sd-switch>
```

### 4. Disabled (computed read-only)
```html
<sd-switch
  label="Đã duy�!t"
  [model]="model.approved"
  [disabled]="true">
</sd-switch>
```

## Anti-patterns
- �R Using `formControlName` / `[(ngModel)]` � not wired; use `[form]+[name]` and `[(model)]`.
- �R Using `<sd-switch>` for "I agree" / consent checkboxes � convention is `<sd-checkbox>`. Switches imply an immediately-applied setting, not consent.
- �R Setting `[required]="true"` on a switch you actually want to allow `false` for � `Validators.required` rejects `false`. Drop `required` if `false` is a valid submission.
- �R Building DETAIL view by setting `[disabled]="true"` � the toggle still renders. Render text ("Có" / "Không") yourself in the parent view.
- �R Stacking many switches in a tight row without labels or grouping � confusing; use a `<sd-fieldset>` / `<sd-list>` layout.

## E2E test attributes

| Attribute | Value | Source |
|---|---|---|
| `data-autoid` | `forms-switch-<autoId>` | input `autoId` |
| `data-disabled` | `"true"` / `"false"` | `formControl.disabled` |
| `data-empty` | `"true"` / `"false"` | `sdIsEmpty(formControl.value)` � true when null |
| `data-value` | `"true"` / `"false"` | `sdSerializeDataValue(formControl.value)` |
| `data-required` | `"true"` / `"false"` | `required` input; always present |

> **Note**: `sd-switch` emits only `data-required` from the new validation-meta set. It has no maxlength / minlength / pattern / errorMessage support.

### Playwright selector example
```typescript
// Select by autoid
const toggle = page.locator('[data-autoid="forms-switch-notify"]');
expect(toggle).toHaveAttribute('data-value', 'true');

// Select by state
const disabledToggles = page.locator('sd-switch [data-disabled="true"]');
```

## Related
- `<sd-checkbox>` � boolean with checkbox metaphor (consent / list-row select)
- `<sd-radio>` � pick-one with > 2 states
- `<sd-label>` � label primitive used internally

