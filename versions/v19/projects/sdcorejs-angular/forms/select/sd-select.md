# `<sd-select>`

**Type**: Component (form input)
**Selector**: `sd-select`
**Import path**: `@sdcorejs/angular/forms/select` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdSelect<T>`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose

Dropdown picker — single OR multi-select from a static array OR an async API. Built-in search/filter (auto-enabled when items > 10 or when `items` is a search function), `[multiple]` mode with checkboxes, paging via `[limit]`, label/value field accessors with nested-key support, and DETAIL `[viewed]` read-only mode. After `<sd-input>` this is the most-used form control.

## When to use

- Pick from a known list (status, currency, country, partner, ...) — static `items` array
- Pick from an API-loaded list — pass an async `SdSearch` function as `[items]`
- Multi-select with checkboxes via `[multiple]="true"`
- DETAIL state via `[viewed]="true"` to render the saved option's display text (or as a hyperlink)
- Cascade-style fields where the parent component already has the data array as a `Signal<T[]>`

## When NOT to use

- ≤ 6 short options where seeing all at once helps the user → use `<sd-radio>`
- Free-text input with typeahead suggestions (where any text is allowed) → use `<sd-autocomplete>`
- Boolean on/off → use `<sd-switch>` / `<sd-checkbox>`
- Multi-tag chip input → use `<sd-chip>`

## Inputs

| Name              | Type                                                                     | Default                                     | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autoId`          | `string \| null \| undefined`                                            | `undefined`                                 | Generates `data-autoId="forms-select-<value>"` for E2E selectors.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `name`            | `string`                                                                 | random uuid                                 | FormGroup control name when bound via `[form]`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `size`            | `Size` (`'sm' \| 'md' \| 'lg'`)                                          | `'md'`                                      | Field height. Use `size="sm"` inside `<sd-table>` filters/cells or other dense table UI.                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `form`            | `FormGroup \| NgForm \| { form: FormGroup } \| undefined`                | `undefined`                                 | Parent form. `NgForm` and `{ form }` wrappers are auto-unwrapped to `FormGroup`.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `label`           | `string \| undefined`                                                    | `undefined`                                 | Field label.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `helperText`      | `string \| undefined`                                                    | `undefined`                                 | Hint text (rendered as info icon next to label).                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `placeholder`     | `string \| undefined`                                                    | `undefined`                                 | Placeholder when empty.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `valueField`      | `NestedKeyOf<T>` (**required**)                                          | —                                           | Key in each item used as the bound value. Supports nested paths (e.g. `'meta.code'`).                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `displayField`    | `NestedKeyOf<T>` (**required**)                                          | —                                           | Key in each item used as the visible label. Supports nested paths.                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `disabledField`   | `NestedKeyOf<T> \| ''`                                                   | `''`                                        | Key whose truthy value disables the option.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `cacheChecksum`   | `any`                                                                    | `undefined`                                 | Invalidates async-search cache when the value changes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `limit`           | `number`                                                                 | `50`                                        | Max items rendered in the panel (paging via `ArrayUtilities.paging`).                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `hyperlink`       | `string \| null \| undefined`                                            | `undefined`                                 | In DETAIL mode, render value as a link.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `minWidthPanel`   | `string \| number`                                                       | `'auto'`                                    | Minimum panel width. If host is narrower, panel expands to this value.                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `appearance`      | `MatFormFieldAppearance`                                                 | from `SD_FORM_CONFIGURATION` ?? `'outline'` | Material form-field style.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `floatLabel`      | `FloatLabelType`                                                         | `'auto'`                                    | Material float-label behaviour.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `items`           | `T[] \| SdSearch \| Signal<T[]> \| undefined \| null`                    | `undefined`                                 | Static array, async search function (`(req: { type: 'SEARCH' \| 'VALUE', searchText?, value? }) => Promise<T[]>`), or a Signal — auto-unwrapped.                                                                                                                                                                                                                                                                                                                                                                          |
| `model`           | `boolean \| number \| string \| (number\|string)[] \| null \| undefined` | `undefined`                                 | Two-way bound value. Single value or array (when `[multiple]`).                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `required`        | `boolean`                                                                | `false`                                     | Adds `Validators.required`. Bare attribute = `true`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `disabled`        | `boolean`                                                                | `false`                                     | Disables the underlying `FormControl`. Bare attribute = `true`.                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `viewed`          | `boolean \| 'inline'`                                                    | `false`                                     | Display mode. `false` = edit. `true` = static read-only DETAIL (renders via `<sd-view>`, no editor). `'inline'` = **click-to-edit**: the editor is still rendered but its chrome is hidden (host gets `.sd-bare`, no clear-×); the `<sd-view>` text is the visible face/trigger. Click the text → opens the picker panel. **The text is retained while the panel is open — it only changes when a value is committed.** Panel min-width floors at `200px` in inline mode. Bare attribute (`<sd-select viewed>`) = `true`. |
| `multiple`        | `boolean`                                                                | `false`                                     | Multi-select with checkboxes; value becomes an array. Bare attribute = `true`.                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `hideInlineError` | `boolean`                                                                | `false`                                     | Hide inline message; surface error via tooltip on a red error icon. Bare attribute = `true`.                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `validator`       | `SdCustomValidator \| undefined`                                         | `undefined`                                 | Async custom validator (wrapped via `HandleSdCustomValidator`).                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `inlineError`     | `string \| undefined`                                                    | `undefined`                                 | Forces a synthetic `inlineError` validator with this message.                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `clearable`       | `boolean`                                                                | `true`                                      | In `viewed='inline'`, show a hover clear-× at the end of the text face (clears the value via `clear()`, `stopPropagation` so it does NOT open the panel). Set `false` where the HOST owns removal (e.g. `<sd-query-bar>` chips, whose own `×` removes the whole filter) to avoid two ×.                                                                                                                                                                                                                                   |

> **Coerce note**: `required`, `disabled`, `multiple`, `hideInlineError`, `clearable` use the `booleanAttribute` transform — bare attribute presence (e.g. `<sd-select multiple>`) is treated as `true`. `viewed` uses a custom `sdViewedTransform` (shared from `forms/models`) — same bare-attribute coercion, but also accepts the literal `'inline'`. Computeds `isViewed()` (`=== true`, static view) / `isInline()` (`=== 'inline'`) drive the template; `enterInlineEdit()` opens the picker from the inline text face.

## Outputs

| Name          | Type              | Notes                                                                                                                                                                                        |
| ------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sdChange`    | `any`             | Emitted **only when the panel closes** AND the value changed since opening (intentional — avoids spamming on each click in `[multiple]` mode).                                               |
| `sdSelection` | `SdSelectionData` | Emitted alongside `sdChange`. Shape varies by `[multiple]`: single → `{ multiple: false, value, selectedItem, values, selectedItems }`; multi → `{ multiple: true, values, selectedItems }`. |

## Public methods

| Name                | Signature          | Notes                                                                           |
| ------------------- | ------------------ | ------------------------------------------------------------------------------- |
| `clear($event?)`    | `(Event?) => void` | Clears the selected value (`null` / `[]`) and emits `sdChange` + `sdSelection`. |
| `clearSearch()`     | `() => void`       | Clears the panel search/filter input and resets `searchText`.                   |
| `open()`            | `() => void`       | Opens the dropdown panel programmatically.                                      |
| `focus()`           | `() => void`       | Focuses and opens the picker (legacy path for `sdViewDef` click-to-edit).       |
| `enterInlineEdit()` | `() => void`       | Opens the picker from the `viewed='inline'` text face.                          |
| `reValidate()`      | `() => void`       | Re-runs validators on the underlying control.                                   |

## Host classes

Applied automatically on `<sd-select>` for styling hooks:

| Class          | Condition           | Effect                                                                                                |
| -------------- | ------------------- | ----------------------------------------------------------------------------------------------------- |
| `sd-has-label` | `[label]` is truthy | Adds `padding-top: 4px` so the floating label has room and is not clipped. Absent → no top padding.   |
| `sd-viewed`    | `[viewed]="true"`   | Removes top padding (read-only text only). Overrides `sd-has-label` when both are set (source order). |
| `sd-bare`      | `[bare]="true"`     | Strips the mat-form-field shell for inline contexts (chip, token).                                    |

## Content projection (slots)

- `<ng-template #sdLabel>` — custom label template (used by `<sd-view>` in DETAIL mode)
- `<ng-template #sdValue>` — custom value-display template for the view layer (DETAIL / inline)
- `*sdItemDef` (via `SdItemDefDefDirective`) — custom rendering of each option in the dropdown panel
- `<ng-template #sdSelected>` — **custom rendering of the SELECTED value inside the editable trigger** (Material `<mat-select-trigger>`). Distinct from `#sdValue` / `sdViewDef`, which only drive the read-only `viewed` / `inline` face — `#sdSelected` affects the **edit-mode** trigger only. Context = `{ $implicit, item, items, display, multiple }`: in single mode `$implicit` / `item` is the selected **item object** (`items` is still the full selected array); in multiple mode `item` is the selected-item **array**, `items` the same array, `multiple` = `true`; `display` is the default comma-joined display text. Falls back to plain `display` text when not projected, so existing usages are unaffected. Only renders once the select has a value (Material shows the custom trigger only when non-empty).
- `<ng-template sdViewDef>` — **custom view-display override** (unified): it simply replaces the view rendering — fed into `<sd-view>`'s `valueTemplate`, so it wins over `#sdValue`. Used wherever the view shows (`viewed=true` static DETAIL **and** `viewed='inline'` text face). Context = `{ $implicit: display, value, selectedItems, selectedItem }`. It no longer does its own focus-swap / `.sd-view` class — click-to-edit is governed by `viewed='inline'`. (Breaking vs the old behaviour where `sdViewDef` on a plain `viewed=false` field swapped to the input on focus; migrate that to `viewed='inline'`.)
- `<ng-template sdSelectFooterAction>` — sticky footer action below the option list (`SdSelectFooterActionDirective`). Input on the template: `when` (`'always' | 'empty' | 'has-result' | (ctx: SdSelectFooterActionContext) => boolean | Promise<boolean>`, default `'always'`). String values: `always` = always render; `empty` = searchText non-empty AND no item value exactly matches searchText; `has-result` = ≥1 filtered item visible. Function value: called with `{ searchText, filteredItems, selectedItems }` context on every change — supports both sync and async (the result is cached in a signal until the Promise resolves, initial value is `false`). Context: `let-searchText="searchText"` / `let-filteredItems="filteredItems"` / `let-selectedItems="selectedItems"`. Import `SdSelectFooterActionDirective` alongside `SdSelect` in standalone hosts. Use the function form instead of the old `pattern` input (which has been removed) to gate visibility by regexp or any custom logic. **Do not** call parent component methods inside the template _expression_ to gate visibility — use `[when]="myFn"` instead.

> **`#sdSelected` vs `sdViewDef`**: `#sdSelected` styles the value shown while EDITING (the dropdown trigger); `sdViewDef` styles the value shown in read-only/inline DETAIL. They are independent — project both if you want a custom face in both modes.

## Form integration

- **Does NOT implement `ControlValueAccessor`.** Forms use the SDCoreJS pattern: pass the parent form via `[form]="formGroup"` (or `[form]="ngForm"`) plus a `name`. An `effect()` calls `formGroup.addControl(name, formControl)` and tears it down via `onCleanup` when the component is destroyed OR when `form`/`name` change.
- **`formControlName` and `[(ngModel)]` are NOT supported.** Use `[(model)]` for two-way value binding and `[form]+[name]` for FormGroup integration.
- **`[viewed]="true"`** flips into DETAIL read-only mode rendered by `<sd-view>` — selected item's `displayField` is shown, optionally as a hyperlink.
- **Validators**: `[required]` → `Validators.required`. `[validator]` → async custom validator. `[inlineError]="msg"` → synthetic `inlineError` validator. Error tooltip messages: required → "Vui lòng nhập thông tin"; customValidator → message returned by validator; inlineError → echoes `inlineError`.
- **Reactive validator updates** — `required`, `validator`, and `inlineError` are signal inputs; an internal `effect()` calls `setValidators` + `updateValueAndValidity({ emitEvent: false })` whenever any of them changes. Validators can be toggled at runtime without manual re-wiring.
- **`[disabled]` reactive** — toggling `disabled` calls `formControl.disable() / enable()` via an effect with `emitEvent: false` (no spurious `statusChanges`).
- **`[(model)]` two-way** — host writes propagate via an effect: when `model` changes the component calls `formControl.setValue(val, { emitEvent: false })` to avoid double-triggering `valueChanges`. The reverse direction (selection → `formControl.setValue` → `valueModel.set()` → `(modelChange)`) flows through the normal signal-model mechanism.
- **`[form]` transform** — accepts `NgForm` (unwrapped to its inner `FormGroup`), `FormGroup` (used directly), or an object with shape `{ form: FormGroup }` as a safety fallback.
- **Default `appearance`** — when `[appearance]` is omitted, reads `SD_FORM_CONFIGURATION` injection token; falls back to `'outline'` if the token is absent.
- **Async search**: when `items` is a function, the component calls it on each search keystroke (debounced 500ms) with `{ type: 'SEARCH', searchText }`, and on initial bind / value-change with `{ type: 'VALUE', value }` to resolve already-selected values into items. Results are cached per `cacheChecksum`+`searchText`.

### Three ways to integrate

```html
<!-- 1. Template-driven with [(model)] only (no FormGroup needed) -->
<sd-select label="Trạng thái" [items]="statusOptions" valueField="code" displayField="name" [(model)]="model.status"> </sd-select>

<!-- 2. Reactive FormGroup (component self-registers via addControl) -->
<form [formGroup]="form">
  <sd-select
    label="Trạng thái"
    name="status"
    [form]="form"
    [items]="statusOptions"
    valueField="code"
    displayField="name"
    [(model)]="model.status"
    required>
  </sd-select>
</form>

<!-- 3. NgForm (template-driven group) -->
<form #f="ngForm">
  <sd-select
    label="Trạng thái"
    name="status"
    [form]="f"
    [items]="statusOptions"
    valueField="code"
    displayField="name"
    [(model)]="model.status">
  </sd-select>
</form>
```

> **How it works**: the `[form]` signal-input has a `transform` that detects `NgForm` (via `instanceof NgForm` — unwraps `.form`) and `FormGroup` (used directly). In all three patterns the component manages `addControl` / `removeControl` lifecycle internally — never call them yourself.

## Visual cues (helps agent map screenshots → component)

- An input-like field with a chevron-down (`keyboard_arrow_down`) icon on the right
- Click opens a dropdown panel below; if `items.length > 10` (or `items` is a function) a search input appears at the top of the panel
- In `[multiple]="true"` mode: each row in the panel has a checkbox; the field shows a comma-joined list of display values, with a hover tooltip listing each as `• <value> - <display>`
- Loading spinner appears in the panel while an async `SdSearch` is in flight
- A slim clear-button (`.sd-clear-btn` — round transparent button with a thin `close` icon, grey → red on hover) appears as a suffix when a value is set and the field is not `required`/`disabled`; it **replaces the chevron** and clears via `clear()`. Because it replaces the dropdown icon, it is **always shown** when there's a value — NOT hover-gated (unlike `sd-input`/`sd-date`/`sd-datetime`). Styled identically via the shared class in `assets/scss/core/form.scss`. **Not rendered in `[bare]` mode** — bare is "value + caret only" for inline chip/token contexts; the clear-x duplicated the chip's own remove-× and was easy to hit while dismissing the panel (would clear the value). The caret is shown instead; the host (chip) owns removal.
- Required marker shows as a red `*` next to the label
- When `[hideInlineError]="true"`: red error-icon suffix with tooltip; otherwise inline `<mat-error>` below the field
- In `[viewed]="true"` mode: rendered by `<sd-view>` — plain text (or hyperlink) of the selected display value(s)
- In `[viewed]="'inline'"` mode: the `<sd-view>` text is a click target (`.sd-inline-view`); the real picker is rendered underneath but invisible (`.sd-inline-editor` — `opacity:0`, `pointer-events:none` incl. descendants) purely to host the panel. Click (or Enter) on the text opens the panel anchored under it; the text stays put and only updates when you pick a value. No visible input box at any point — just text + the dropdown panel. The face has a light background that darkens on hover (editable affordance); a hover clear-× appears at the end when `clearable` (default) + value present + not required/disabled.

## Standalone imports and table-cell usage

Every standalone host that uses `<sd-select>` must import `SdSelect`. Projected option/view templates require their directives in `imports`.

```ts
import { Component } from '@angular/core';
import { SdTable, SdTableCellDefDirective, SdTableOption } from '@sdcorejs/angular/components/table';
import { SdSelect } from '@sdcorejs/angular/forms';
import { SdItemDefDefDirective, SdViewDefDirective } from '@sdcorejs/angular/forms/directives';

@Component({
  standalone: true,
  imports: [SdTable, SdTableCellDefDirective, SdSelect, SdItemDefDefDirective, SdViewDefDirective],
  template: `
    <sd-table [option]="tableOption">
      <ng-template sdTableCellDef="status" let-row>
        <sd-select size="sm" hideInlineError [items]="statusList" valueField="code" displayField="name" [(model)]="row.status">
          <ng-template sdItemDef let-item>
            <span>{{ item.code }} - {{ item.name }}</span>
          </ng-template>
        </sd-select>
      </ng-template>
    </sd-table>
  `,
})
export class StatusTableComponent {
  statusList = [
    { code: 'ACTIVE', name: 'Active' },
    { code: 'INACTIVE', name: 'Inactive' },
  ];

  tableOption!: SdTableOption<unknown>;
}
```

Inside `<sd-table>` custom cells or custom inline filters, always use `size="sm"` and `hideInlineError`.

```html
<ng-template sdTableFilterDef="status" let-filter let-update="update">
  <sd-select
    size="sm"
    hideInlineError
    [items]="statusList"
    valueField="code"
    displayField="name"
    [(model)]="filter.status"
    (sdChange)="update()">
  </sd-select>
</ng-template>
```

## Examples

### 1. Static items, single select, required

```html
<sd-select
  [form]="form"
  name="status"
  label="Trạng thái"
  required
  [items]="statusList"
  valueField="code"
  displayField="name"
  [(model)]="model.status">
</sd-select>
```

### 2. Multi-select with checkboxes

```html
<sd-select [form]="form" name="tags" label="Tags" multiple [items]="tagList" valueField="id" displayField="label" [(model)]="model.tagIds">
</sd-select>
```

### 3. Async-search (API-loaded) with cache invalidation

```html
<sd-select
  [form]="form" name="customer"
  label="Khách hàng"
  [items]="searchCustomers"        <!-- (req) => Promise<Customer[]> -->
  [cacheChecksum]="model.branchId"  <!-- invalidate when branch changes -->
  valueField="id" displayField="fullName"
  [(model)]="model.customerId"
  (sdSelection)="onCustomerPicked($event)">
</sd-select>
```

### 4. Custom item rendering (`*sdItemDef`)

```html
<sd-select [items]="users" valueField="id" displayField="name" [(model)]="model.userId">
  <ng-template sdItemDef let-item>
    <div class="d-flex align-items-center gap-8">
      <img [src]="item.avatar" class="avatar-24" />
      <div>{{ item.name }} <small class="text-black400">{{ item.email }}</small></div>
    </div>
  </ng-template>
</sd-select>
```

### 5. DETAIL state with hyperlink

```html
<sd-select
  label="Đơn vị"
  [items]="orgUnits"
  valueField="code"
  displayField="name"
  [model]="model.orgUnitCode"
  [viewed]="true"
  hyperlink="/org-unit/{{ model.orgUnitCode }}">
</sd-select>
```

### 6. Custom selected-value rendering in the trigger (`#sdSelected`)

```html
<!-- single: show an avatar + name as the picked value -->
<sd-select [items]="users" valueField="id" displayField="name" [(model)]="model.userId">
  <ng-template #sdSelected let-item>
    <span class="d-flex align-items-center gap-6"> <img [src]="item?.avatar" class="avatar-20" /> {{ item?.name }} </span>
  </ng-template>
</sd-select>

<!-- multiple: render a count chip instead of the comma list -->
<sd-select [items]="tags" valueField="id" displayField="label" multiple [(model)]="model.tagIds">
  <ng-template #sdSelected let-items="items" let-display="display">
    <span class="chip">{{ items?.length }} đã chọn</span>
  </ng-template>
</sd-select>
```

## E2E test attributes

Rendered on the `<mat-select>` element (same anchor as `data-autoid`):

| Attribute            | Value                   | Source                                                                        |
| -------------------- | ----------------------- | ----------------------------------------------------------------------------- |
| `data-autoid`        | `forms-select-<autoId>` | input `autoId`                                                                |
| `data-disabled`      | `"true"` / `"false"`    | `formControl.disabled`                                                        |
| `data-loading`       | `"true"` / `"false"`    | async fetch in progress                                                       |
| `data-empty`         | `"true"` / `"false"`    | `sdIsEmpty(formControl.value)`                                                |
| `data-value`         | string                  | `sdSerializeDataValue(formControl.value)`                                     |
| `data-required`      | `"true"` / `"false"`    | `required` input; always present                                              |
| `data-error-message` | string                  | present only when the component is currently showing an error tooltip message |

> **Note**: `sd-select` does not support maxlength / minlength / pattern. No `data-maxlength`, `data-minlength`, or `data-pattern` attributes are emitted. The `pattern` input on `SdSelectFooterActionDirective` has been removed — use a function `[when]` instead.

Selector example:

```ts
const el = page.locator('[data-autoid="forms-select-status"]');
await expect(el).toHaveAttribute('data-empty', 'false');
await expect(el).toHaveAttribute('data-required', 'true');
```

## Anti-patterns

- ❌ Using `formControlName` / `[(ngModel)]` — not wired; use `[form]+[name]` and `[(model)]`.
- ❌ Using `<sd-select>` for ≤ 6 short options — use `<sd-radio>` so all options are visible without a click.
- ❌ Subscribing to `sdChange` and expecting it to fire on every click in `[multiple]` mode — it ONLY fires when the panel CLOSES, by design. For per-toggle reactions, derive from `[(model)]`.
- ❌ Re-creating the `items` array reference on every change-detection cycle — it forces re-fetch / re-cache. Memoize or use a `Signal<T[]>`.
- ❌ Forgetting `cacheChecksum` when async results depend on another field — stale cached results will leak across context switches.
- ❌ Using `[disabled]="true"` to express read-only DETAIL state — use `[viewed]="true"` so the value renders as text/hyperlink.

## Related

- `<sd-autocomplete>` — text input with typeahead (free text allowed)
- `<sd-radio>` — pick-one for short, all-visible lists
- `<sd-checkbox>` — multi-select group / boolean
- `<sd-chip>` — multi-tag input
- `<sd-view>` — DETAIL renderer used internally
- `<sd-label>` — label primitive
- `SdItemDefDefDirective` / `SdViewDefDirective` — content-projection slots
- `SdSearch` — async-search function signature
- `SdSelectionData` — output payload shape
- `SD_FORM_CONFIGURATION` token — global default `appearance`
