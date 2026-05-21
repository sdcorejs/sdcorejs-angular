# `<sd-switch>`

**Type**: Component (form input)
**Selector**: `sd-switch`
**Import path**: `@sdcorejs/angular/forms/switch` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdSwitch`
**Standalone**: yes (declared via `imports`)
**Change detection**: `OnPush`

## One-line purpose
iOS-style toggle switch â€” boolean ON/OFF in a single tap. Use for feature flags, settings, "active/inactive" rows where the change applies immediately or as part of a form submission.

## When to use
- Boolean field whose default state is meaningful to surface ("Active", "Notify me", "Visible to public")
- Toolbar/list-row toggles (active/inactive, public/private)
- Settings panels with multiple boolean options stacked vertically
- Forms where the user expects a toggle metaphor rather than a checkbox metaphor

## When NOT to use
- Multi-state selection (3+ options) â†’ use `<sd-radio>` or `<sd-select>`
- Boolean field embedded in a list of items (with bulk-select semantics) â†’ use `<sd-checkbox>`
- "I agree to terms" checkboxes / form-prerequisite booleans â†’ use `<sd-checkbox>` (checkbox is the established convention for consent)

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

> **Coerce note**: `required`, `disabled`, `hideInlineError` accept `'' | true | false | null | undefined` â€” bare attribute presence (e.g. `<sd-switch required>`) is treated as `true`. (Hand-rolled in setters; not the `booleanAttribute` transform.)

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `modelChange` | `any` | Two-way binding companion for `[(model)]`. |
| `sdChange` | `any` | Emitted on every toggle with the new boolean value. |

## Content projection (slots)
None â€” label comes from the `[label]` input.

## Form integration
- **Does NOT implement `ControlValueAccessor`.** Forms use the SDCoreJS pattern: pass the parent form via `[form]="formGroup"` (or `[form]="ngForm"`) plus a `name`. On `ngAfterViewInit`, the component calls `formGroup.addControl(name, formControl)` and removes it in `ngOnDestroy`.
- **`formControlName` and `[(ngModel)]` are NOT supported.** Use `[(model)]` for two-way value binding and `[form]+[name]` for FormGroup integration.
- **No `[viewed]` mode** â€” the switch always renders as a toggle. For DETAIL display of a boolean, render plain text yourself (e.g. "CÃ³" / "KhÃ´ng") in the parent view.
- **Validators**: `[required]` â†’ `Validators.required` (rejects `null`/`undefined`/empty; `false` is treated as valid). Built-in inline error: required â†’ "Vui lÃ²ng nháº­p thÃ´ng tin"; suppressed when `[hideInlineError]="true"`.

### Three ways to integrate

```html
<!-- 1. Template-driven vá»›i [(model)] (no FormGroup) -->
<sd-switch label="Báº­t thÃ´ng bÃ¡o" [(model)]="settings.notify"></sd-switch>

<!-- 2. Reactive FormGroup (truyá»n form vÃ o Ä‘á»ƒ switch tá»± addControl) -->
<form [formGroup]="form">
  <sd-switch label="Báº­t" name="notify" [form]="form"></sd-switch>
</form>

<!-- 3. NgForm (template-driven group) -->
<form #f="ngForm">
  <sd-switch label="Báº­t" name="notify" [form]="f"></sd-switch>
</form>
```

> **How it works**: The setter detects `NgForm` (via `instanceof NgForm`) and unwraps its `.form` (`FormGroup`) automatically. In all three patterns the component manages `addControl` / `removeControl` lifecycle internally.

## Visual cues (helps agent map screenshots â†’ component)
- A small horizontal pill (track) with a circular sliding knob; OFF state = gray track + knob on the left, ON state = colored track (`color`) + knob on the right
- Optional label rendered to the RIGHT of the switch (a single line of text, with optional red `*` if `required`)
- Inline error message appears below the row in red when `formControl.touched && formControl.errors?.required` (i.e. `required` was set but the toggle is `false`); suppressed when `[hideInlineError]="true"`
- No outlined `mat-form-field` chrome â€” visually denser and lighter than `<sd-input>` / `<sd-select>`

## Examples

### 1. Active flag with two-way binding
```html
<sd-switch
  [form]="form" name="active"
  label="Hoáº¡t Ä‘á»™ng"
  [(model)]="model.active"
  (sdChange)="onActiveToggle($event)">
</sd-switch>
```

### 2. Notification opt-in (custom color)
```html
<sd-switch
  label="Nháº­n thÃ´ng bÃ¡o"
  color="success"
  [(model)]="settings.notify">
</sd-switch>
```

### 3. Required acceptance toggle
```html
<sd-switch
  [form]="form" name="acceptedTerms"
  label="TÃ´i Ä‘á»“ng Ã½ vá»›i Ä‘iá»u khoáº£n" required
  [(model)]="model.acceptedTerms">
</sd-switch>
```

### 4. Disabled (computed read-only)
```html
<sd-switch
  label="ÄÃ£ duyá»‡t"
  [model]="model.approved"
  [disabled]="true">
</sd-switch>
```

## Anti-patterns
- âŒ Using `formControlName` / `[(ngModel)]` â€” not wired; use `[form]+[name]` and `[(model)]`.
- âŒ Using `<sd-switch>` for "I agree" / consent checkboxes â€” convention is `<sd-checkbox>`. Switches imply an immediately-applied setting, not consent.
- âŒ Setting `[required]="true"` on a switch you actually want to allow `false` for â€” `Validators.required` rejects `false`. Drop `required` if `false` is a valid submission.
- âŒ Building DETAIL view by setting `[disabled]="true"` â€” the toggle still renders. Render text ("CÃ³" / "KhÃ´ng") yourself in the parent view.
- âŒ Stacking many switches in a tight row without labels or grouping â€” confusing; use a `<sd-fieldset>` / `<sd-list>` layout.

## Related
- `<sd-checkbox>` â€” boolean with checkbox metaphor (consent / list-row select)
- `<sd-radio>` â€” pick-one with > 2 states
- `<sd-label>` â€” label primitive used internally

