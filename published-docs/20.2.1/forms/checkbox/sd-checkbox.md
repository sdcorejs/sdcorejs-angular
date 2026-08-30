# `<sd-checkbox>`

**Type**: Component (form input)
**Selector**: `sd-checkbox`
**Import path**: `@sdcorejs/angular/forms/checkbox` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdCheckbox`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose

Boolean toggle — a single labeled checkbox bound to a form/model. Wraps Angular Material `mat-checkbox` with SDCoreJS form-group registration and `inlineError` support.

## When to use

- A standalone boolean field (e.g. "Đồng ý điều khoản", "Hoạt động", "Mặc định")
- Inside a `<form>` group, registered automatically when `[form]` is bound
- Quick filter toggles on toolbars when an explicit ON/OFF look is desired

## When NOT to use

- Three or more mutually exclusive options → use `<sd-radio>`
- An on/off toggle with switch-look (large emphasis, settings panes) → use `<sd-switch>`
- A list of multi-select string values rendered as pills → use `<sd-chip>`
- Boolean tied to a tabular row selection → use list/grid built-in selection, not standalone checkboxes

## Inputs

| Name          | Type                          | Default     | Notes                                                                                                                                                                                                                                                                                    |
| ------------- | ----------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autoId`      | `string \| null \| undefined` | `undefined` | Generates `data-autoId="forms-checkbox-<value>"` for E2E selectors.                                                                                                                                                                                                                      |
| `name`        | `string`                      | random uuid | Control name registered into parent `[form]`.                                                                                                                                                                                                                                            |
| `form`        | `NgForm \| FormGroup`         | `undefined` | Parent form. NgForm is auto-unwrapped.                                                                                                                                                                                                                                                   |
| `label`       | `string \| undefined`         | `undefined` | Text shown to the right of the box.                                                                                                                                                                                                                                                      |
| `color`       | `'primary' \| 'warn'`         | `'primary'` | Material color of the checked state.                                                                                                                                                                                                                                                     |
| `disabled`    | `boolean \| ''`               | `false`     | Disables interaction. Empty string presence = `true`.                                                                                                                                                                                                                                    |
| `model`       | `any`                         | `undefined` | Two-way bound boolean. Use `[(model)]`.                                                                                                                                                                                                                                                  |
| `viewed`      | `boolean \| 'inline'`         | `false`     | Display mode. `false` = the interactive `mat-checkbox`. `true` = static read-only text ("Có" / "Không" via i18n, plus the label). `'inline'` = keeps the interactive checkbox (no separate face); a **disabled** `'inline'` falls back to `true` (static text). Bare attribute = `true`. |
| `inlineError` | `string`                      | `undefined` | When set, attaches a synthetic `inlineError` validator → field renders invalid until cleared.                                                                                                                                                                                            |

> **Coerce**: `disabled` accepts `''` / truthy / nullish — bare attribute = `true`. `viewed` uses the shared `sdViewedTransform` (bare attribute = `true`, plus the literal `'inline'`); computed `isViewed()` (`true`, or disabled `'inline'`) drives the static text branch.

## Outputs

| Name          | Type  | Notes                                                           |
| ------------- | ----- | --------------------------------------------------------------- |
| `modelChange` | `any` | Two-way pair for `[(model)]`.                                   |
| `sdChange`    | `any` | SDCoreJS-standard change event (same payload as `modelChange`). |

## Content projection (slots)

None — text comes from the `label` input.

## Form integration

- **Does NOT implement `ControlValueAccessor`.** SDCoreJS pattern: pass `[form]` + `name`; the component appends its internal `FormControl` to that group on `ngAfterViewInit` and removes it in `ngOnDestroy`.
- **`formControlName` and `[(ngModel)]` are NOT supported.** Use `[(model)]` for two-way binding and `[form]+[name]` to register inside a FormGroup.
- **`[viewed]` DETAIL/read-only** — `[viewed]="true"` renders the boolean as static text ("Có" / "Không") plus the label, instead of the toggle. `[viewed]="'inline'"` keeps the checkbox interactive (it's already compact, so there is no separate text face) but collapses to the static text when `[disabled]`. Prefer this over `[disabled]="true"` when you want the value rendered as words rather than a greyed-out box.
- **Validators**: only `[inlineError]` is wired (forces an `inlineError` error when truthy). For `Validators.required`-style behavior, manage it on the parent FormGroup or refactor the consumer.
- **`model` setter deduplication**: the setter skips `formControl.setValue` if the incoming value equals the stored value, preventing redundant change cycles.

### Three ways to integrate

```html
<!-- 1. Template-driven với [(model)] only (no FormGroup) -->
<sd-checkbox label="Hoạt động" [(model)]="model.isActive"></sd-checkbox>

<!-- 2. Reactive FormGroup (truyền form vào để checkbox tự addControl) -->
<form [formGroup]="form">
  <sd-checkbox name="agree" [form]="form" label="Tôi đồng ý" [(model)]="model.agree"></sd-checkbox>
</form>

<!-- 3. NgForm (template-driven group) -->
<form #f="ngForm">
  <sd-checkbox name="agree" [form]="f" label="Tôi đồng ý" [(model)]="model.agree"></sd-checkbox>
</form>
```

> **How it works**: The `[form]` setter detects `NgForm` (via `instanceof NgForm`) and unwraps its `.form` (`FormGroup`) automatically. The component calls `addControl(name, formControl)` in `ngAfterViewInit` and `removeControl(name)` in `ngOnDestroy`.

### `inlineError` flow

Setting `[inlineError]="'Some message'"` makes the shared form connector attach `SdInlineErrorValidator` (from `@sdcorejs/angular/forms/models`), which returns `{ inlineError: true }`. The template then shows `<mat-error>{{ inlineError }}</mat-error>` when `formControl.errors?.['inlineError'] && formControl.touched`. Clearing `[inlineError]` to an empty string removes that validator again — the connector only adds/removes the validator it owns, so validators you attach yourself to the public `formControl` survive.

> **OnPush note**: the component is `OnPush` and fully signal-driven. The `<mat-error>` gate reads `formControl.errors` / `formControl.touched` as plain properties, but the same template also reads `data-*` signals derived from the control's event stream, so any control event (touch, value, status) marks the view dirty and the gate is re-evaluated. Do not add DOM that depends on control state without a signal read in the same template.

## Visual cues (helps agent map screenshots → component)

- A square box on the left + label text on the right
- Unchecked: empty square (Material grey outline)
- Checked: filled square in `color` with a white checkmark
- Indeterminate state is NOT exposed via inputs (Material default off)
- Disabled: greyed-out box, label dimmed, cursor `not-allowed`

## Standalone imports and table-cell usage

Every standalone host that uses `<sd-checkbox>` must import `SdCheckbox`.

```ts
import { Component } from '@angular/core';
import { SdTable, SdTableCellDefDirective, SdTableOption } from '@sdcorejs/angular/components/table';
import { SdCheckbox } from '@sdcorejs/angular/forms';

@Component({
  standalone: true,
  imports: [SdTable, SdTableCellDefDirective, SdCheckbox],
  template: `
    <sd-table [option]="tableOption">
      <ng-template sdTableCellDef="selected" let-row>
        <sd-checkbox [(model)]="row.selected"></sd-checkbox>
      </ng-template>
    </sd-table>
  `,
})
export class CheckboxTableComponent {
  tableOption!: SdTableOption<unknown>;
}
```

`sd-checkbox` does not expose `hideInlineError`. If you need compact boolean editing in a table cell, keep the label short/empty and avoid projected inline error text.

## Examples

### 1. Boolean inside reactive form

```html
<sd-checkbox [form]="form" name="isActive" label="Đang hoạt động" [(model)]="model.isActive" (sdChange)="onActiveToggle($event)">
</sd-checkbox>
```

### 2. Terms-of-use confirmation with inline error

```html
<sd-checkbox
  [form]="form"
  name="agree"
  label="Tôi đồng ý với điều khoản"
  [(model)]="model.agree"
  [inlineError]="model.agree ? '' : 'Bạn phải đồng ý điều khoản'">
</sd-checkbox>
```

### 3. Disabled (read-only) for DETAIL state

```html
<sd-checkbox label="Mặc định" [model]="model.isDefault" disabled></sd-checkbox>
```

## Anti-patterns

- ❌ Using `formControlName` or `[(ngModel)]` — not wired in this component.
- ❌ Reaching for `[disabled]="true"` to express read-only DETAIL state — use `[viewed]="true"` so the value renders as text ("Có" / "Không") rather than a greyed-out box.
- ❌ Using a checkbox for a single ON/OFF setting in a settings page — prefer `<sd-switch>` for that visual idiom.
- ❌ Stacking many checkboxes for mutually exclusive options — use `<sd-radio>`.
- ❌ Forgetting `[form]` and trying to validate via the parent FormGroup — control won't be registered.

## E2E test attributes

Anchor: `<mat-checkbox>`, Prefix: `forms-checkbox-`

| Attribute       | Values                | Notes                                                             |
| --------------- | --------------------- | ----------------------------------------------------------------- |
| `data-autoid`   | string                | Set from `autoId` input; e.g. `forms-checkbox-agree`.             |
| `data-disabled` | `'true'` \| `'false'` | Reflects FormControl disabled state.                              |
| `data-empty`    | `'true'` \| `'false'` | `'true'` when value is null/undefined; `'false'` for any boolean. |
| `data-value`    | `'true'` \| `'false'` | Serialized boolean (string form).                                 |

## Related

- `<sd-switch>` — toggle-style boolean
- `<sd-radio>` — mutually exclusive options
- `<sd-chip>` — multi-value tag input
