# `<sd-autocomplete>`

**Type**: Component (form input)
**Selector**: `sd-autocomplete`
**Import path**: `@sdcorejs/angular/forms/autocomplete` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdAutocomplete<T = any>`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose

Typeahead single-select dropdown — user types to filter a static array OR an async backend source, then picks one item. Wraps Material `mat-autocomplete` with SDCoreJS label/validators/`viewed` read-only support.

## When to use

- Picking ONE entity from a long list (customer, product, employee, …) where a plain `<sd-select>` would be too crowded
- Backend-driven dynamic dropdown — set `items` to a function returning `Observable<T[]>` / `Promise<T[]>`
- Static list with search-as-you-type (`items` is an array)
- DETAIL state that needs read-only display via `[viewed]="true"`

## When NOT to use

- Multi-select tags → use `<sd-chip>` (multi values) or `<sd-select [multiple]>`
- Picking a date → `<sd-date>` / `<sd-date-range>` / `<sd-chip-calendar>`
- Free-text input (no list) → `<sd-input>`
- Hierarchical/tree picker → see tree-select components, not this one

## Inputs

| Name              | Type                                      | Default                                     | Notes                                                                                                                                                                                                                                                           |
| ----------------- | ----------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autoId`          | `string \| null \| undefined`             | `undefined`                                 | Generates `data-autoId="forms-autocomplete-<value>"` for E2E selectors.                                                                                                                                                                                         |
| `name`            | `string`                                  | random uuid                                 | FormGroup control name when bound via `[form]`.                                                                                                                                                                                                                 |
| `size`            | `Size` (`'sm' \| 'md' \| 'lg'`)           | `'md'`                                      | Field height. Use `size="sm"` inside `<sd-table>` filters/cells or other dense table UI.                                                                                                                                                                        |
| `form`            | `NgForm \| FormGroup \| undefined`        | `undefined`                                 | Parent form. NgForm is auto-unwrapped to its inner `FormGroup`.                                                                                                                                                                                                 |
| `label`           | `string \| undefined`                     | `undefined`                                 | Field label (rendered via `<sd-label>`).                                                                                                                                                                                                                        |
| `helperText`      | `string \| undefined`                     | `undefined`                                 | Hint text under the field.                                                                                                                                                                                                                                      |
| `placeholder`     | `string \| undefined`                     | `undefined`                                 | Placeholder when empty.                                                                                                                                                                                                                                         |
| `valueField`      | `string \| undefined`                     | `undefined`                                 | Property of an item used as VALUE (supports nested path `a.b.c`).                                                                                                                                                                                               |
| `displayField`    | `string \| undefined`                     | `undefined`                                 | Property used as DISPLAY label (supports nested path).                                                                                                                                                                                                          |
| `disabledField`   | `string`                                  | `''`                                        | Property name marking an item as disabled.                                                                                                                                                                                                                      |
| `limit`           | `number`                                  | `100`                                       | Max items rendered for static-array filter results.                                                                                                                                                                                                             |
| `cacheChecksum`   | `any`                                     | `undefined`                                 | Bust per-search cache when this value changes (e.g. external filter context).                                                                                                                                                                                   |
| `hyperlink`       | `string \| null \| undefined`             | `undefined`                                 | Render value as a link in `[viewed]` mode.                                                                                                                                                                                                                      |
| `items`           | `T[] \| SdSearch<T> \| null \| undefined` | `undefined`                                 | Static array OR a function `({type:'SEARCH',searchText} \| {type:'VALUE',value}) => Observable<T[]> \| Promise<T[]>`.                                                                                                                                           |
| `appearance`      | `MatFormFieldAppearance`                  | from `SD_FORM_CONFIGURATION` ?? `'outline'` | Material form-field style.                                                                                                                                                                                                                                      |
| `addable`         | `boolean`                                 | `false`                                     | Show "+" add button → emits `sdAdd`.                                                                                                                                                                                                                            |
| `required`        | `boolean`                                 | `false`                                     | Adds `Validators.required`.                                                                                                                                                                                                                                     |
| `disabled`        | `boolean`                                 | `false`                                     | Disables both display + filter controls.                                                                                                                                                                                                                        |
| `viewed`          | `boolean \| 'inline'`                     | `false`                                     | Display mode. `false` edit · `true` static DETAIL (display value / `sdViewDef`) · `'inline'` click-to-edit (text face → click opens the autocomplete panel; text retained until commit; hover clear-× gated by `clearable`). Disabled `'inline'` → static view. |
| `clearable`       | `boolean`                                 | `true`                                      | In `'inline'`, show a hover clear-× on the text face. `false` where the host owns removal (chips).                                                                                                                                                              |
| `hideInlineError` | `boolean`                                 | `false`                                     | Hide inline message; surfaces error as a tooltip instead.                                                                                                                                                                                                       |
| `validator`       | `SdCustomValidator \| undefined`          | `undefined`                                 | Async custom validator (wrapped via `HandleSdCustomValidator`).                                                                                                                                                                                                 |
| `inlineError`     | `string \| undefined`                     | `undefined`                                 | Forces an inline error message (sets a synthetic `inlineError` validator).                                                                                                                                                                                      |
| `model`           | `string \| number \| null \| undefined`   | `undefined`                                 | Two-way bound selected VALUE (use `[(model)]`).                                                                                                                                                                                                                 |

> **Coerce**: `addable`, `required`, `disabled`, `viewed`, `hideInlineError` use `booleanAttribute` — bare attribute = `true`.

## Outputs

| Name          | Type                       | Notes                                                                           |
| ------------- | -------------------------- | ------------------------------------------------------------------------------- |
| `sdChange`    | `string \| number \| null` | Emitted when selection changes (the resolved VALUE).                            |
| `sdSelection` | `SdSelectionData`          | `{ values, selectedItems, value, selectedItem }` — full payload incl. raw item. |
| `sdAdd`       | `void`                     | Fired by the "+" button when `[addable]="true"`.                                |

## Host classes

Applied automatically on `<sd-autocomplete>` for styling hooks:

| Class          | Condition           | Effect                                                                                                |
| -------------- | ------------------- | ----------------------------------------------------------------------------------------------------- |
| `sd-has-label` | `[label]` is truthy | Adds `padding-top: 4px` so the floating label has room and is not clipped. Absent → no top padding.   |
| `sd-viewed`    | `[viewed]="true"`   | Removes top padding (read-only text only). Overrides `sd-has-label` when both are set (source order). |

## Content projection (slots)

- `#sdLabel` template — custom label rendering
- `#sdValue` template — custom in-list option rendering
- `<ng-template sdItemDef>` — alternate option-row template
- `<ng-template sdViewDef>` — read-only display template used in `[viewed]` mode

## Form integration

- **Does NOT implement `ControlValueAccessor`.** Forms use the SDCoreJS pattern: pass the parent form via `[form]="formGroup"` (or `[form]="ngForm"`) plus a `name`. The component then calls `formGroup.addControl(name, formControl)` on `ngAfterViewInit` and `formGroup.removeControl(name)` on `ngOnDestroy`.
- **`formControlName` and `[(ngModel)]` are NOT supported.** Use `[(model)]` for two-way value binding and `[form]+[name]` for FormGroup integration.
- **`[viewed]="true"`** flips into DETAIL read-only mode: input is hidden, the display label (or `<ng-template sdViewDef>`) is rendered. If `hyperlink` is set, the value renders as a link.
- **Validators**: `[required]` adds `Validators.required`. `[validator]` accepts an async custom validator. `[inlineError]="msg"` injects a synthetic error and shows `msg`. Built-in error tooltip messages: required → "Vui lòng nhập thông tin"; custom validator and inline-error messages bubble up via `errorMessage`.
- **Reactive validator updates** — `required`, `validator`, and `inlineError` are signal inputs; an internal `effect()` calls `setValidators` + `updateValueAndValidity({ emitEvent: false })` whenever any of them changes. You can flip validators on/off at runtime with no manual call needed.
- **`[disabled]` reactive** — toggling `disabled` calls `inputControl.disable() / enable()` and `formControl.disable() / enable()` via an effect, with `emitEvent: false` (no spurious `statusChanges`).
- **`[(model)]` two-way** — host writes propagate via an effect: when `model` changes, the component calls `formControl.setValue(val, { emitEvent: false })` to avoid triggering `valueChanges`. The reverse direction (selection → `formControl.setValue` → `valueModel.set()` → `(modelChange)`) flows through the normal signal-model mechanism.
- **`onSelect` mirrors the chosen value to `formControl` WITH events** (no `{ emitEvent: false }`). Deliberate: `formControl` carries the async `[validator]`, and `errorMessage` is a `computed` that only recomputes when the control's reactive snapshot (`sdFormControlState`) ticks on a control event. Suppressing the event would let the async validator's `setErrors(...)` completion run silently → no tick → the `[validator]` message never appears (red outline, no text). The `formControl.valueChanges` subscriber writes `valueModel` (guarded by `!==`) and `onSelect` re-sets the same value (no-op), so emitting causes no loop. (Bug fixed 2026-06-05.)
- **`[form]` transform** — the `form` input accepts `NgForm` (unwrapped to its inner `FormGroup`), `FormGroup` (used directly), or an object with shape `{ form: FormGroup }` as a safety fallback.
- **Default `appearance`** — when `[appearance]` is omitted, reads `SD_FORM_CONFIGURATION` injection token. Falls back to `'outline'` if the token is absent.

### Three ways to integrate

```html
<!-- 1. Template-driven with [(model)] only (no FormGroup needed) -->
<sd-autocomplete label="Trạng thái" [items]="statusOptions" valueField="code" displayField="name" [(model)]="model.status">
</sd-autocomplete>

<!-- 2. Reactive FormGroup (component self-registers via addControl) -->
<form [formGroup]="form">
  <sd-autocomplete
    label="Trạng thái"
    name="status"
    [form]="form"
    [items]="statusOptions"
    valueField="code"
    displayField="name"
    [(model)]="model.status"
    required>
  </sd-autocomplete>
</form>

<!-- 3. NgForm (template-driven group) -->
<form #f="ngForm">
  <sd-autocomplete
    label="Trạng thái"
    name="status"
    [form]="f"
    [items]="statusOptions"
    valueField="code"
    displayField="name"
    [(model)]="model.status">
  </sd-autocomplete>
</form>
```

> **How it works**: the `[form]` signal-input has a `transform` that detects `NgForm` (via `instanceof NgForm` — unwraps `.form`) and `FormGroup` (used directly). In all three patterns the component manages `addControl` / `removeControl` lifecycle internally — never call them yourself.

## Visual cues (helps agent map screenshots → component)

- Outlined input field with a label that floats on focus
- Trailing icons: 🔍 search icon when empty; a **slim clear button** (`.sd-clear-btn`, thin `close` icon) when a value is selected; loading spinner when an async source is in flight; optional "+" add button when `[addable]`. The clear button **replaces** the search icon (like `sd-select`), so it is **always shown** when there's a value — NOT hover-gated.
- Below the field, a Material panel slides down listing matching options; each row uses `displayField` (or custom `sdItemDef` template)
- Highlighted/selected option painted in primary color
- In `[viewed]="true"` mode: no input box — just plain text (or hyperlink) of the resolved display value

## Standalone imports and table-cell usage

Every standalone host that uses `<sd-autocomplete>` must import `SdAutocomplete`. Projected item/view templates require their directives in `imports`.

```ts
import { Component } from '@angular/core';
import { SdTable, SdTableCellDefDirective, SdTableOption } from '@sdcorejs/angular/components/table';
import { SdAutocomplete } from '@sdcorejs/angular/forms';
import { SdItemDefDefDirective, SdViewDefDirective } from '@sdcorejs/angular/forms/directives';

@Component({
  standalone: true,
  imports: [SdTable, SdTableCellDefDirective, SdAutocomplete, SdItemDefDefDirective, SdViewDefDirective],
  template: `
    <sd-table [option]="tableOption">
      <ng-template sdTableCellDef="customerId" let-row>
        <sd-autocomplete size="sm" hideInlineError [items]="searchCustomers" valueField="id" displayField="name" [(model)]="row.customerId">
          <ng-template sdItemDef let-item>
            <span>{{ item.code }} - {{ item.name }}</span>
          </ng-template>
        </sd-autocomplete>
      </ng-template>
    </sd-table>
  `,
})
export class CustomerTableComponent {
  searchCustomers = async () => [];
  tableOption!: SdTableOption<unknown>;
}
```

Inside `<sd-table>` custom cells or custom inline filters, always use `size="sm"` and `hideInlineError`.

```html
<ng-template sdTableCellDef="customerId" let-row>
  <sd-autocomplete size="sm" hideInlineError [items]="searchCustomers" valueField="id" displayField="name" [(model)]="row.customerId">
  </sd-autocomplete>
</ng-template>
```

## Dense dashboard/filter usage

When this control is rendered in dashboard cards, filter bars, external filter panels, table toolbars, query bars, or other compact non-form surfaces, prefer `hideInlineError` so Material does not reserve the inline error/subscript row under the field. Pair it with `size="sm"` when the component supports `size`. Validation remains visible through the compact error icon/tooltip without increasing the control height.

```html
<sd-autocomplete size="sm" hideInlineError [items]="searchCustomers" valueField="id" displayField="name" [(model)]="filter.customerId"></sd-autocomplete>
```

## Examples

### 1. Static array, simple value

```html
<sd-autocomplete
  [form]="form"
  name="status"
  label="Trạng thái"
  [items]="statusOptions"
  valueField="code"
  displayField="name"
  [(model)]="model.status"
  required
  (sdChange)="onStatusChange($event)">
</sd-autocomplete>
```

### 2. Async backend source (typeahead)

```ts
loadCustomers = ({ type, searchText, value }: any) => {
  if (type === 'SEARCH') return this.api.searchCustomers(searchText);
  if (type === 'VALUE') return this.api.getCustomerByCode(value).pipe(map(c => [c]));
  return of([]);
};
```

```html
<sd-autocomplete
  [form]="form"
  name="customerCode"
  label="Khách hàng"
  [items]="loadCustomers"
  valueField="code"
  displayField="fullName"
  [(model)]="model.customerCode"
  [addable]="true"
  (sdAdd)="openCreateCustomer()">
</sd-autocomplete>
```

### 3. DETAIL state (read-only with link)

```html
<sd-autocomplete
  label="Khách hàng"
  [items]="customers"
  valueField="code"
  displayField="fullName"
  [model]="model.customerCode"
  [viewed]="true"
  hyperlink="/customer/{{ model.customerCode }}">
</sd-autocomplete>
```

## E2E test attributes

Rendered on the inner `<input>` element (same anchor as `data-autoid`):

| Attribute            | Value                         | Source                                                                        |
| -------------------- | ----------------------------- | ----------------------------------------------------------------------------- |
| `data-autoid`        | `forms-autocomplete-<autoId>` | input `autoId`                                                                |
| `data-disabled`      | `"true"` / `"false"`          | `formControl.disabled`                                                        |
| `data-invalid`       | `"true"` / `"false"`          | `formControl.invalid && (touched \|\| dirty)`                                 |
| `data-empty`         | `"true"` / `"false"`          | `sdIsEmpty(formControl.value)`                                                |
| `data-value`         | string                        | `sdSerializeDataValue(formControl.value)`                                     |
| `data-required`      | `"true"` / `"false"`          | `required` input; always present                                              |
| `data-error-message` | string                        | present only when the component is currently showing an error tooltip message |

> **Note**: `sd-autocomplete` does not support maxlength / minlength / pattern. No `data-maxlength`, `data-minlength`, or `data-pattern` attributes are emitted.

Selector example:

```ts
const el = page.locator('[data-autoid="forms-autocomplete-customer"]');
await expect(el).toHaveAttribute('data-empty', 'false');
await expect(el).toHaveAttribute('data-required', 'false');
```

## Anti-patterns

- ❌ Using `formControlName` / `[(ngModel)]` — not wired; use `[form]+[name]` and `[(model)]`.
- ❌ Loading the entire dataset into `items` for huge collections — pass a function (`SdSearch`) so search is delegated to the backend.
- ❌ Forgetting `valueField`/`displayField` when items are objects — display will be empty.
- ❌ Mutating the array passed to `[items]` in place — pass a new reference so the signal effect re-runs and the cache resets.
- ❌ Using `[disabled]` to express read-only DETAIL state — use `[viewed]="true"` instead so labels/links render correctly.

## Related

- `<sd-select>` — non-search dropdown (incl. multi-select)
- `<sd-chip>` — multi-value tag input
- `<sd-input>` — free-text
- `<sd-label>` — label primitive used internally
- `SdSearch<T>` model — backend source contract
- `SD_FORM_CONFIGURATION` token — global default `appearance`
