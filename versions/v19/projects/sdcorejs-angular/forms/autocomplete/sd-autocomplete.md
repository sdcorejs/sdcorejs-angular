# `<sd-autocomplete>`

**Type**: Component (form input)
**Selector**: `sd-autocomplete`
**Import path**: `@sdcorejs/angular/forms/autocomplete` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdAutocomplete<T = any>`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Typeahead single-select dropdown â€” user types to filter a static array OR an async backend source, then picks one item. Wraps Material `mat-autocomplete` with SDCoreJS label/validators/`viewed` read-only support.

## When to use
- Picking ONE entity from a long list (customer, product, employee, â€¦) where a plain `<sd-select>` would be too crowded
- Backend-driven dynamic dropdown â€” set `items` to a function returning `Observable<T[]>` / `Promise<T[]>`
- Static list with search-as-you-type (`items` is an array)
- DETAIL state that needs read-only display via `[viewed]="true"`

## When NOT to use
- Multi-select tags â†’ use `<sd-chip>` (multi values) or `<sd-select [multiple]>`
- Picking a date â†’ `<sd-date>` / `<sd-date-range>` / `<sd-chip-calendar>`
- Free-text input (no list) â†’ `<sd-input>`
- Hierarchical/tree picker â†’ see tree-select components, not this one

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `autoId` | `string \| null \| undefined` | `undefined` | Generates `data-autoId="forms-autocomplete-<value>"` for E2E selectors. |
| `name` | `string` | random uuid | FormGroup control name when bound via `[form]`. |
| `size` | `Size` (`'sm' \| 'md' \| 'lg'`) | `'md'` | Field height. |
| `form` | `NgForm \| FormGroup \| undefined` | `undefined` | Parent form. NgForm is auto-unwrapped to its inner `FormGroup`. |
| `label` | `string \| undefined` | `undefined` | Field label (rendered via `<sd-label>`). |
| `helperText` | `string \| undefined` | `undefined` | Hint text under the field. |
| `placeholder` | `string \| undefined` | `undefined` | Placeholder when empty. |
| `valueField` | `string \| undefined` | `undefined` | Property of an item used as VALUE (supports nested path `a.b.c`). |
| `displayField` | `string \| undefined` | `undefined` | Property used as DISPLAY label (supports nested path). |
| `disabledField` | `string` | `''` | Property name marking an item as disabled. |
| `limit` | `number` | `100` | Max items rendered for static-array filter results. |
| `cacheChecksum` | `any` | `undefined` | Bust per-search cache when this value changes (e.g. external filter context). |
| `hyperlink` | `string \| null \| undefined` | `undefined` | Render value as a link in `[viewed]` mode. |
| `items` | `T[] \| SdSearch<T> \| null \| undefined` | `undefined` | Static array OR a function `({type:'SEARCH',searchText} \| {type:'VALUE',value}) => Observable<T[]> \| Promise<T[]>`. |
| `appearance` | `MatFormFieldAppearance` | from `SD_FORM_CONFIGURATION` ?? `'outline'` | Material form-field style. |
| `addable` | `boolean` | `false` | Show "+" add button â†’ emits `sdAdd`. |
| `required` | `boolean` | `false` | Adds `Validators.required`. |
| `disabled` | `boolean` | `false` | Disables both display + filter controls. |
| `viewed` | `boolean` | `false` | Read-only DETAIL mode â€” renders display value (or `<sd-view-def>` template) instead of the input. |
| `hideInlineError` | `boolean` | `false` | Hide inline message; surfaces error as a tooltip instead. |
| `validator` | `SdCustomValidator \| undefined` | `undefined` | Async custom validator (wrapped via `HandleSdCustomValidator`). |
| `inlineError` | `string \| undefined` | `undefined` | Forces an inline error message (sets a synthetic `inlineError` validator). |
| `model` | `string \| number \| null \| undefined` | `undefined` | Two-way bound selected VALUE (use `[(model)]`). |

> **Coerce**: `addable`, `required`, `disabled`, `viewed`, `hideInlineError` use `booleanAttribute` â€” bare attribute = `true`.

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `sdChange` | `string \| number \| null` | Emitted when selection changes (the resolved VALUE). |
| `sdSelection` | `SdSelectionData` | `{ values, selectedItems, value, selectedItem }` â€” full payload incl. raw item. |
| `sdAdd` | `void` | Fired by the "+" button when `[addable]="true"`. |

## Content projection (slots)
- `#sdLabel` template â€” custom label rendering
- `#sdValue` template â€” custom in-list option rendering
- `<ng-template sdItemDef>` â€” alternate option-row template
- `<ng-template sdViewDef>` â€” read-only display template used in `[viewed]` mode

## Form integration
- **Does NOT implement `ControlValueAccessor`.** Forms use the SDCoreJS pattern: pass the parent form via `[form]="formGroup"` (or `[form]="ngForm"`) plus a `name`. The component then calls `formGroup.addControl(name, formControl)` on `ngAfterViewInit` and `formGroup.removeControl(name)` on `ngOnDestroy`.
- **`formControlName` and `[(ngModel)]` are NOT supported.** Use `[(model)]` for two-way value binding and `[form]+[name]` for FormGroup integration.
- **`[viewed]="true"`** flips into DETAIL read-only mode: input is hidden, the display label (or `<ng-template sdViewDef>`) is rendered. If `hyperlink` is set, the value renders as a link.
- **Validators**: `[required]` adds `Validators.required`. `[validator]` accepts an async custom validator. `[inlineError]="msg"` injects a synthetic error and shows `msg`. Built-in error tooltip messages: required â†’ "Vui lÃ²ng nháº­p thÃ´ng tin"; custom validator and inline-error messages bubble up via `errorTooltipMessage`.
- **Reactive validator updates** â€” `required`, `validator`, and `inlineError` are signal inputs; an internal `effect()` calls `setValidators` + `updateValueAndValidity({ emitEvent: false })` whenever any of them changes. You can flip validators on/off at runtime with no manual call needed.
- **`[disabled]` reactive** â€” toggling `disabled` calls `inputControl.disable() / enable()` and `formControl.disable() / enable()` via an effect, with `emitEvent: false` (no spurious `statusChanges`).
- **`[(model)]` two-way** â€” host writes propagate via an effect: when `model` changes, the component calls `formControl.setValue(val, { emitEvent: false })` to avoid triggering `valueChanges`. The reverse direction (selection â†’ `formControl.setValue` â†’ `valueModel.set()` â†’ `(modelChange)`) flows through the normal signal-model mechanism.
- **`[form]` transform** â€” the `form` input accepts `NgForm` (unwrapped to its inner `FormGroup`), `FormGroup` (used directly), or an object with shape `{ form: FormGroup }` as a safety fallback.
- **Default `appearance`** â€” when `[appearance]` is omitted, reads `SD_FORM_CONFIGURATION` injection token. Falls back to `'outline'` if the token is absent.

### Three ways to integrate

```html
<!-- 1. Template-driven with [(model)] only (no FormGroup needed) -->
<sd-autocomplete
  label="Tráº¡ng thÃ¡i" [items]="statusOptions"
  valueField="code" displayField="name"
  [(model)]="model.status">
</sd-autocomplete>

<!-- 2. Reactive FormGroup (component self-registers via addControl) -->
<form [formGroup]="form">
  <sd-autocomplete
    label="Tráº¡ng thÃ¡i" name="status" [form]="form"
    [items]="statusOptions" valueField="code" displayField="name"
    [(model)]="model.status" required>
  </sd-autocomplete>
</form>

<!-- 3. NgForm (template-driven group) -->
<form #f="ngForm">
  <sd-autocomplete
    label="Tráº¡ng thÃ¡i" name="status" [form]="f"
    [items]="statusOptions" valueField="code" displayField="name"
    [(model)]="model.status">
  </sd-autocomplete>
</form>
```

> **How it works**: the `[form]` signal-input has a `transform` that detects `NgForm` (via `instanceof NgForm` â€” unwraps `.form`) and `FormGroup` (used directly). In all three patterns the component manages `addControl` / `removeControl` lifecycle internally â€” never call them yourself.

## Visual cues (helps agent map screenshots â†’ component)
- Outlined input field with a label that floats on focus
- Trailing icons: ðŸ” search icon when empty; âœ• cancel icon (Ã—) when a value is selected; loading spinner when an async source is in flight; optional "+" add button when `[addable]`
- Below the field, a Material panel slides down listing matching options; each row uses `displayField` (or custom `sdItemDef` template)
- Highlighted/selected option painted in primary color
- In `[viewed]="true"` mode: no input box â€” just plain text (or hyperlink) of the resolved display value

## Examples

### 1. Static array, simple value
```html
<sd-autocomplete
  [form]="form" name="status" label="Tráº¡ng thÃ¡i"
  [items]="statusOptions"
  valueField="code" displayField="name"
  [(model)]="model.status"
  required
  (sdChange)="onStatusChange($event)">
</sd-autocomplete>
```

### 2. Async backend source (typeahead)
```ts
loadCustomers = ({ type, searchText, value }: any) => {
  if (type === 'SEARCH') return this.api.searchCustomers(searchText);
  if (type === 'VALUE')  return this.api.getCustomerByCode(value).pipe(map(c => [c]));
  return of([]);
};
```
```html
<sd-autocomplete
  [form]="form" name="customerCode" label="KhÃ¡ch hÃ ng"
  [items]="loadCustomers"
  valueField="code" displayField="fullName"
  [(model)]="model.customerCode"
  [addable]="true" (sdAdd)="openCreateCustomer()">
</sd-autocomplete>
```

### 3. DETAIL state (read-only with link)
```html
<sd-autocomplete
  label="KhÃ¡ch hÃ ng" [items]="customers"
  valueField="code" displayField="fullName"
  [model]="model.customerCode"
  [viewed]="true"
  hyperlink="/customer/{{ model.customerCode }}">
</sd-autocomplete>
```

## Anti-patterns
- âŒ Using `formControlName` / `[(ngModel)]` â€” not wired; use `[form]+[name]` and `[(model)]`.
- âŒ Loading the entire dataset into `items` for huge collections â€” pass a function (`SdSearch`) so search is delegated to the backend.
- âŒ Forgetting `valueField`/`displayField` when items are objects â€” display will be empty.
- âŒ Mutating the array passed to `[items]` in place â€” pass a new reference so the signal effect re-runs and the cache resets.
- âŒ Using `[disabled]` to express read-only DETAIL state â€” use `[viewed]="true"` instead so labels/links render correctly.

## Related
- `<sd-select>` â€” non-search dropdown (incl. multi-select)
- `<sd-chip>` â€” multi-value tag input
- `<sd-input>` â€” free-text
- `<sd-label>` â€” label primitive used internally
- `SdSearch<T>` model â€” backend source contract
- `SD_FORM_CONFIGURATION` token â€” global default `appearance`

