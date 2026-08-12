# `<sd-switch>`

**Type**: Component (form input)
**Selector**: `sd-switch`
**Import path**: `@sdcorejs/angular/forms/switch` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdSwitch`
**Standalone**: yes (declared via `imports`)
**Change detection**: `OnPush`

## One-line purpose

iOS-style toggle switch — boolean ON/OFF in a single tap. Use for feature flags, settings, "active/inactive" rows where the change applies immediately or as part of a form submission.

## When to use

- Boolean field whose default state is meaningful to surface ("Active", "Notify me", "Visible to public")
- Toolbar/list-row toggles (active/inactive, public/private)
- Settings panels with multiple boolean options stacked vertically
- Forms where the user expects a toggle metaphor rather than a checkbox metaphor

## When NOT to use

- Multi-state selection (3+ options) → use `<sd-radio>` or `<sd-select>`
- Boolean field embedded in a list of items (with bulk-select semantics) → use `<sd-checkbox>`
- "I agree to terms" checkboxes / form-prerequisite booleans → use `<sd-checkbox>` (checkbox is the established convention for consent)

## Inputs

| Name              | Type                                       | Default     | Notes                                                                                                                                                                                                                                                                                     |
| ----------------- | ------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autoId`          | `string \| null \| undefined`              | `undefined` | Generates `data-autoId="forms-switch-<value>"` for E2E selectors.                                                                                                                                                                                                                         |
| `name`            | `string`                                   | random uuid | FormGroup control name when bound via `[form]`.                                                                                                                                                                                                                                           |
| `size`            | `Size` (`'sm' \| 'md' \| 'lg'`)            | `'md'`      | Reserved; current template does not branch on this, so `size="sm"` does not compact switch UI yet.                                                                                                                                                                                        |
| `form`            | `NgForm \| FormGroup \| undefined \| null` | `undefined` | Parent form. `NgForm` is auto-unwrapped to its inner `FormGroup`.                                                                                                                                                                                                                         |
| `label`           | `string \| undefined`                      | `undefined` | Label rendered to the right of the toggle (via `<sd-label>`).                                                                                                                                                                                                                             |
| `color`           | `Color`                                    | `'primary'` | Material color for the ON state knob/track.                                                                                                                                                                                                                                               |
| `model`           | `boolean \| null \| undefined`             | `false`     | Two-way bound boolean (use `[(model)]`).                                                                                                                                                                                                                                                  |
| `required`        | `boolean`                                  | `false`     | Adds `Validators.required`. Bare attribute = `true`.                                                                                                                                                                                                                                      |
| `disabled`        | `boolean`                                  | `false`     | Disables the underlying `FormControl`. Bare attribute = `true`.                                                                                                                                                                                                                           |
| `viewed`          | `boolean \| 'inline'`                      | `false`     | Display mode. `false` = the interactive `mat-slide-toggle`. `true` = static read-only text ("Bật" / "Tắt" via i18n, plus the label). `'inline'` = keeps the interactive toggle (no separate face); a **disabled** `'inline'` falls back to `true` (static text). Bare attribute = `true`. |
| `hideInlineError` | `boolean`                                  | `false`     | Hide the inline `<mat-error>` message rendered under the row. Validation still runs and still blocks submit — only the message is suppressed. Bare attribute = `true`.                                                                                                                    |

> **Coerce note**: `required`, `disabled`, `hideInlineError` use the `booleanAttribute` transform — bare attribute presence (e.g. `<sd-switch required>`) is treated as `true`. `viewed` uses the shared `sdViewedTransform` (bare attribute = `true`, plus the literal `'inline'`); computed `isViewed()` (`true`, or disabled `'inline'`) drives the static text branch.

## Outputs

| Name          | Type  | Notes                                               |
| ------------- | ----- | --------------------------------------------------- |
| `modelChange` | `any` | Two-way binding companion for `[(model)]`.          |
| `sdChange`    | `any` | Emitted on every toggle with the new boolean value. |

## Public members

| Name           | Type                            | Notes                                                                                                                                       |
| -------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `formControl`  | `SdFormControl`                 | The control registered into `[form]`. You may attach your own validators to it; the component only adds/removes the ones it owns.            |
| `errorMessage` | `Signal<string \| undefined>`   | Raw validation message for the current errors (ignores `hideInlineError` and the interaction gate).                                          |
| `connectorState` | `Signal<…>`                   | Shared form-connector state. `connectorState().validationError` is the **interaction-gated** message (undefined until touched/dirty).        |

## Content projection (slots)

None — label comes from the `[label]` input.

## Form integration

- **Does NOT implement `ControlValueAccessor`.** Forms use the SDCoreJS pattern: pass the parent form via `[form]="formGroup"` (or `[form]="ngForm"`) plus a `name`. On `ngAfterViewInit`, the component calls `formGroup.addControl(name, formControl)` and removes it in `ngOnDestroy`.
- **`formControlName` and `[(ngModel)]` are NOT supported.** Use `[(model)]` for two-way value binding and `[form]+[name]` for FormGroup integration.
- **`[viewed]` DETAIL/read-only** — `[viewed]="true"` renders the boolean as static text ("Bật" / "Tắt") plus the label, instead of the toggle. `[viewed]="'inline'"` keeps the toggle interactive (it's already compact, so there is no separate text face) but collapses to the static text when `[disabled]`.
- **Validators**: `[required]` → `Validators.required` (rejects `null`/`undefined`/empty; `false` is treated as valid). Built-in inline error: required → "Vui lòng nhập thông tin" (i18n key `core.form.input.required` — the catalog has no switch-specific key, the text is the shared one). The message renders in a `<mat-error>` **under the toggle row**, and only **after the user has interacted** (`touched || dirty`) — a pristine invalid switch stays silent so a freshly opened form is not painted red. `[hideInlineError]="true"` suppresses the message only; validity is unchanged.

### Three ways to integrate

```html
<!-- 1. Template-driven với [(model)] (no FormGroup) -->
<sd-switch label="Bật thông báo" [(model)]="settings.notify"></sd-switch>

<!-- 2. Reactive FormGroup (truyền form vào để switch tự addControl) -->
<form [formGroup]="form">
  <sd-switch label="Bật" name="notify" [form]="form"></sd-switch>
</form>

<!-- 3. NgForm (template-driven group) -->
<form #f="ngForm">
  <sd-switch label="Bật" name="notify" [form]="f"></sd-switch>
</form>
```

> **How it works**: The setter detects `NgForm` (via `instanceof NgForm`) and unwraps its `.form` (`FormGroup`) automatically. In all three patterns the component manages `addControl` / `removeControl` lifecycle internally.

## Visual cues (helps agent map screenshots → component)

- A small horizontal pill (track) with a circular sliding knob; OFF state = gray track + knob on the left, ON state = colored track (`color`) + knob on the right
- Optional label rendered to the RIGHT of the switch (a single line of text, with optional red `*` if `required`)
- Inline error message (`<mat-error>`) appears below the row in red once the control is touched/dirty and `formControl.errors?.required` is set (i.e. `required` was set and the value is still `null`/`undefined`); suppressed when `[hideInlineError]="true"`
- No outlined `mat-form-field` chrome — visually denser and lighter than `<sd-input>` / `<sd-select>`

## Standalone imports and table-cell usage

Every standalone host that uses `<sd-switch>` must import `SdSwitch`.

```ts
import { Component } from '@angular/core';
import { SdTable, SdTableCellDefDirective, SdTableOption } from '@sdcorejs/angular/components/table';
import { SdSwitch } from '@sdcorejs/angular/forms';

@Component({
  standalone: true,
  imports: [SdTable, SdTableCellDefDirective, SdSwitch],
  template: `
    <sd-table [option]="tableOption">
      <ng-template sdTableCellDef="active" let-row>
        <sd-switch hideInlineError [(model)]="row.active"> </sd-switch>
      </ng-template>
    </sd-table>
  `,
})
export class ActiveTableComponent {
  tableOption!: SdTableOption<unknown>;
}
```

`size="sm"` is currently reserved for future switch sizing and does not compact switch UI yet. In table cells, use `hideInlineError` and keep labels short or omit the label.

```html
<ng-template sdTableCellDef="active" let-row>
  <sd-switch hideInlineError [(model)]="row.active"></sd-switch>
</ng-template>
```

## Dense dashboard/filter usage

When this control is rendered in dashboard cards, filter bars, external filter panels, table toolbars, query bars, or other compact non-form surfaces, prefer `hideInlineError` so Material does not reserve the inline error/subscript row under the field. Pair it with `size="sm"` when the component supports `size`. Validation remains visible through the compact error icon/tooltip without increasing the control height, and the message is also exposed to assistive tech through a screen-reader-only element (`span.sd-visually-hidden`) referenced by `aria-describedby`.

```html
<sd-switch hideInlineError [(model)]="filter.active"></sd-switch>
```

## Examples

### 1. Active flag with two-way binding

```html
<sd-switch [form]="form" name="active" label="Hoạt động" [(model)]="model.active" (sdChange)="onActiveToggle($event)"> </sd-switch>
```

### 2. Notification opt-in (custom color)

```html
<sd-switch label="Nhận thông báo" color="success" [(model)]="settings.notify"> </sd-switch>
```

### 3. Required acceptance toggle

```html
<sd-switch [form]="form" name="acceptedTerms" label="Tôi đồng ý với điều khoản" required [(model)]="model.acceptedTerms"> </sd-switch>
```

### 4. Disabled (computed read-only)

```html
<sd-switch label="Đã duyệt" [model]="model.approved" [disabled]="true"> </sd-switch>
```

## Anti-patterns

- ❌ Using `formControlName` / `[(ngModel)]` — not wired; use `[form]+[name]` and `[(model)]`.
- ❌ Using `<sd-switch>` for "I agree" / consent checkboxes — convention is `<sd-checkbox>`. Switches imply an immediately-applied setting, not consent.
- ❌ Expecting `[required]` to force the switch ON — `Validators.required` only rejects `null`/`undefined`, so `false` submits fine. To require an explicit "yes", model the field as `boolean | null` (start at `null`) or add your own validator to `formControl`.
- ❌ Building DETAIL view by setting `[disabled]="true"` — the toggle still renders. Render text ("Có" / "Không") yourself in the parent view.
- ❌ Stacking many switches in a tight row without labels or grouping — confusing; use a `<sd-fieldset>` / `<sd-list>` layout.

## E2E test attributes

| Attribute       | Value                   | Source                                          |
| --------------- | ----------------------- | ----------------------------------------------- |
| `data-autoid`   | `forms-switch-<autoId>` | input `autoId`                                  |
| `data-disabled` | `"true"` / `"false"`    | `formControl.disabled`                          |
| `data-empty`    | `"true"` / `"false"`    | `sdIsEmpty(formControl.value)` — true when null |
| `data-value`    | `"true"` / `"false"`    | `sdSerializeDataValue(formControl.value)`       |
| `data-required` | `"true"` / `"false"`    | `required` input; always present                |

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

- `<sd-checkbox>` — boolean with checkbox metaphor (consent / list-row select)
- `<sd-radio>` — pick-one with > 2 states
- `<sd-label>` — label primitive used internally
