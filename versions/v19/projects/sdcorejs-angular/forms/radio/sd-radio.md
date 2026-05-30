# `<sd-radio>`

**Type**: Component (form input)
**Selector**: `sd-radio`
**Import path**: `@sdcorejs/angular/forms/radio` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdRadio`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Radio-button group â€” user picks exactly ONE option from a small, fixed list. Items can be laid out inline (`row`) or stacked (`column`). Use when the full set of choices should be visible at once (â‰¤ ~6 options); for longer lists, use `<sd-select>` instead.

## When to use
- Pick-one settings with 2â€“6 short options, all worth showing (e.g. `Gender`, `Type`, `Yes/No/Maybe`)
- Form sections where seeing every option is important for the decision
- DETAIL state via `[viewed]="true"` to render the saved option's display text (or as a hyperlink)

## When NOT to use
- More than ~6 options OR options loaded from API â†’ use `<sd-select>`
- Boolean on/off toggle â†’ use `<sd-switch>` or `<sd-checkbox>`
- Multi-select picks â†’ use `<sd-checkbox>` group or `<sd-select [multiple]>`
- A free-text answer â†’ use `<sd-input>`

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `autoId` | `string \| null \| undefined` | `undefined` | Generates `data-autoId="forms-radio-<value>"` for E2E selectors. |
| `name` | `string` | random uuid | FormGroup control name when bound via `[form]`. |
| `form` | `NgForm \| FormGroup \| undefined \| null` | `undefined` | Parent form. `NgForm` is auto-unwrapped to its inner `FormGroup`. |
| `label` | `string \| undefined` | `undefined` | Field label (rendered via `<sd-label>`). |
| `placeholder` | `string \| undefined` | `undefined` | Reserved; not used by the radio template. |
| `display` | `'row' \| 'column'` | `'row'` | Layout: `row` = inline (default), `column` = stacked. |
| `model` | `number \| string \| boolean` | `undefined` | Two-way bound value (use `[(model)]`); matched against `item[valueField]`. |
| `items` | `any[]` | `[]` | List of options (objects). Non-arrays coerce to `[]`. |
| `valueField` | `string` (**required**) | â€” | Key in each item to use as the radio's bound value. |
| `displayField` | `string` (**required**) | â€” | Key in each item to use as the visible label. |
| `required` | `boolean` | `false` | Adds `Validators.required`. Bare attribute = `true`. |
| `inlineError` | `string` | `undefined` | Forces a synthetic `inlineError` validator with this message. |
| `disabled` | `boolean` | `false` | Disables the underlying `FormControl`. Bare attribute = `true`. |
| `viewed` | `boolean` | `false` | Read-only DETAIL mode â€” hides the radios, renders the picked item's display text. Bare attribute = `true`. |
| `hyperlink` | `string \| null \| undefined` | `undefined` | In DETAIL mode, render the value as a link (`[sdHref]`). |

> **Coerce note**: `required`, `disabled`, `viewed` accept `'' | true | false | null | undefined` â€” bare attribute presence (e.g. `<sd-radio required>`) is treated as `true`. (Hand-rolled in setters; not the `booleanAttribute` transform.)

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `modelChange` | `any` | Two-way binding companion for `[(model)]`. |
| `sdChange` | `any` | Emitted on value change with the new selected value. |
| `sdSelection` | `{ value: any \| any[]; item?: any }` | Emitted on change with both the value and the resolved item object (looked up in `items` by `valueField`). |

## Content projection (slots)
- `<ng-template sdLabelDef>` â€” custom label rendering (overrides `[label]`)
- `<ng-template sdSuffixDef>` â€” declared via `@ContentChild` but not used by the current template
- `<ng-template sdViewDef>` â€” declared via `@ContentChild`; the current template falls back to plain text in `[viewed]` mode

## Form integration

**Pattern**: `SdRadio` khÃ´ng implement `ControlValueAccessor`. DÃ¹ng `[form]` + `name` Ä‘á»ƒ Ä‘Äƒng kÃ½ control vÃ o FormGroup cha. TrÃªn `ngAfterViewInit`, component tá»± gá»i `formGroup.addControl(name, formControl)` vÃ  `removeControl` khi destroy.

- **`formControlName` vÃ  `[(ngModel)]` KHÃ”NG Ä‘Æ°á»£c há»— trá»£.** DÃ¹ng `[(model)]` cho two-way binding vÃ  `[form]+[name]` cho FormGroup integration.
- **`[viewed]="true"`** chuyá»ƒn sang DETAIL read-only mode: radio group bá»‹ áº©n, giÃ¡ trá»‹ hiá»ƒn thá»‹ lÃ  text thuáº§n (hoáº·c link náº¿u cÃ³ `hyperlink`).
- **Validators**: `[required]` â†’ `Validators.required`. `[inlineError]="msg"` â†’ synthetic `inlineError` validator. Inline errors: required â†’ "Vui lÃ²ng nháº­p thÃ´ng tin"; inlineError â†’ echoes `inlineError`.

## Visual cues (helps agent map screenshots â†’ component)
- A horizontal (`display="row"`) or vertical (`display="column"`) group of bullet circles, each with the option label to its right
- Selected option: filled inner dot in `primary` color; unselected: empty circle outline
- `row` mode adds horizontal spacing (`mr-16`) between options; `column` mode stacks them flush (`m-0`)
- Required marker shows as a red `*` next to the label (rendered by `<sd-label>`)
- Inline error message appears below the group in red when `formControl.touched && formControl.errors?.required` (or `inlineError`)
- In `[viewed]="true"` mode: just plain text â€” the matched item's `displayField` value (or as a hyperlink if `hyperlink` is set); falls back to em-dash via `sdEmpty` when nothing selected

## Examples

### 1. Required gender picker (inline, with FormGroup)
```html
<sd-radio
  [form]="form" name="gender"
  label="Giá»›i tÃ­nh" required
  [items]="genderOptions"
  valueField="code" displayField="name"
  [(model)]="model.gender">
</sd-radio>
```
```typescript
// Component class
genderOptions = [
  { code: 'M', name: 'Nam' },
  { code: 'F', name: 'Ná»¯' },
  { code: 'O', name: 'KhÃ¡c' },
];
form = new FormGroup({});
model = { gender: 'M' }; // pre-selected default
```
DÃ¹ng `required` bare attribute Ä‘á»ƒ báº¯t buá»™c chá»n; giÃ¡ trá»‹ pre-selected truyá»n qua `[(model)]` thay vÃ¬ khá»Ÿi táº¡o trong FormGroup.

### 2. Stacked option list (column display)
```html
<sd-radio
  [form]="form" name="approvalMode"
  label="HÃ¬nh thá»©c duyá»‡t"
  display="column"
  [items]="approvalModes"
  valueField="id" displayField="label"
  [(model)]="model.approvalMode"
  (sdSelection)="onModeSelected($event)">
</sd-radio>
```
```typescript
approvalModes = [
  { id: 1, label: 'Duyá»‡t tá»± Ä‘á»™ng' },
  { id: 2, label: 'Duyá»‡t thá»§ cÃ´ng' },
  { id: 3, label: 'Duyá»‡t theo luá»“ng' },
];
onModeSelected(event: { value: any; item?: any }) {
  console.log('Selected item:', event.item);
}
```
`display="column"` xáº¿p chá»n theo chiá»u dá»c; `sdSelection` tráº£ vá» cáº£ `value` láº«n `item` object Ä‘á»ƒ trÃ¡nh look-up thá»§ cÃ´ng.

### 3. DETAIL state with hyperlink
```html
<sd-radio
  label="Loáº¡i khÃ¡ch hÃ ng"
  [items]="customerTypes"
  valueField="code" displayField="name"
  [model]="model.customerTypeCode"
  [viewed]="true"
  hyperlink="/customer-type/{{ model.customerTypeCode }}">
</sd-radio>
```
```typescript
customerTypes = [
  { code: 'IND', name: 'CÃ¡ nhÃ¢n' },
  { code: 'BIZ', name: 'Doanh nghiá»‡p' },
];
```
Khi `[viewed]="true"`, radio group bá»‹ áº©n vÃ  giÃ¡ trá»‹ hiá»ƒn thá»‹ dÆ°á»›i dáº¡ng text thuáº§n hoáº·c link â€” phÃ¹ há»£p cho mÃ n hÃ¬nh xem chi tiáº¿t (DETAIL mode).

## Form integration (3 cÃ¡ch)

### CÃ¡ch 1: Template-driven `[(model)]` (khÃ´ng dÃ¹ng FormGroup)
DÃ¹ng khi chá»‰ cáº§n two-way bind giÃ¡ trá»‹, khÃ´ng cáº§n reactive validation tá»« FormGroup cha.

```html
<sd-radio
  label="Tráº¡ng thÃ¡i"
  [items]="statusOptions"
  valueField="value" displayField="label"
  [(model)]="selectedStatus"
  (sdChange)="onStatusChange($event)">
</sd-radio>
```
```typescript
statusOptions = [
  { value: 'active', label: 'Hoáº¡t Ä‘á»™ng' },
  { value: 'inactive', label: 'KhÃ´ng hoáº¡t Ä‘á»™ng' },
];
selectedStatus = 'active';
onStatusChange(v: string) { console.log(v); }
```

### CÃ¡ch 2: Reactive FormGroup (`[form]` + `name`)
DÃ¹ng khi radio lÃ  má»™t pháº§n cá»§a form lá»›n hÆ¡n â€” `SdRadio` tá»± `addControl` vÃ o FormGroup khi `ngAfterViewInit`.

```html
<form [formGroup]="myForm">
  <sd-radio
    [form]="myForm" name="type"
    label="Loáº¡i" required
    [items]="typeOptions"
    valueField="id" displayField="text"
    [(model)]="model.type">
  </sd-radio>
</form>
```
```typescript
myForm = new FormGroup({});
typeOptions = [
  { id: 'A', text: 'Loáº¡i A' },
  { id: 'B', text: 'Loáº¡i B' },
];
model = { type: null };

onSubmit() {
  if (this.myForm.valid) { /* ... */ }
}
```

### CÃ¡ch 3: NgForm (template-driven form)
DÃ¹ng khi toÃ n bá»™ form dÃ¹ng `#f="ngForm"` â€” truyá»n tham chiáº¿u NgForm; component tá»± unwrap sang `NgForm.form` (`FormGroup` bÃªn trong).

```html
<form #f="ngForm" (ngSubmit)="onSubmit(f)">
  <sd-radio
    [form]="f" name="priority"
    label="Æ¯u tiÃªn" required
    [items]="priorityOptions"
    valueField="key" displayField="label"
    [(model)]="model.priority">
  </sd-radio>
  <button type="submit">LÆ°u</button>
</form>
```
```typescript
priorityOptions = [
  { key: 'high', label: 'Cao' },
  { key: 'medium', label: 'Trung bÃ¬nh' },
  { key: 'low', label: 'Tháº¥p' },
];
model = { priority: 'medium' };

onSubmit(f: NgForm) {
  if (f.valid) { /* ... */ }
}
```

## Anti-patterns

âŒ **DÃ¹ng `<sd-radio>` cho nhiá»u hÆ¡n ~6 lá»±a chá»n hoáº·c danh sÃ¡ch táº£i tá»« API**
```html
<!-- Äá»«ng lÃ m váº­y -->
<sd-radio [items]="apiLoadedItems" valueField="id" displayField="name" ...></sd-radio>
```
Thay vÃ o Ä‘Ã³ hÃ£y dÃ¹ng:
```html
<sd-select [items]="apiLoadedItems" valueField="id" displayField="name" ...></sd-select>
```
`<sd-select>` há»— trá»£ scroll, filter, lazy-load â€” tá»‘t hÆ¡n khi list dÃ i.

---

âŒ **DÃ¹ng `formControlName` hoáº·c `[(ngModel)]`**
```html
<!-- Äá»«ng lÃ m váº­y -->
<sd-radio formControlName="type" ...></sd-radio>
<sd-radio [(ngModel)]="model.type" ...></sd-radio>
```
Thay vÃ o Ä‘Ã³ hÃ£y dÃ¹ng:
```html
<sd-radio [form]="myForm" name="type" [(model)]="model.type" ...></sd-radio>
```
`SdRadio` khÃ´ng implement `ControlValueAccessor`; dÃ¹ng `[form]+[name]` lÃ  pattern chÃ­nh thá»©c.

---

âŒ **QuÃªn `valueField` hoáº·c `displayField`**
```html
<!-- Äá»«ng lÃ m váº­y â€” sáº½ throw lá»—i runtime -->
<sd-radio [items]="items" [(model)]="val"></sd-radio>
```
Thay vÃ o Ä‘Ã³ hÃ£y dÃ¹ng:
```html
<sd-radio [items]="items" valueField="code" displayField="name" [(model)]="val"></sd-radio>
```
Cáº£ hai Ä‘á»u lÃ  `required: true` inputs â€” thiáº¿u má»™t trong hai sáº½ gÃ¢y lá»—i Angular compiler.

---

âŒ **DÃ¹ng `[disabled]="true"` Ä‘á»ƒ biá»ƒu thá»‹ tráº¡ng thÃ¡i Ä‘á»c (DETAIL state)**
```html
<!-- Äá»«ng lÃ m váº­y -->
<sd-radio [disabled]="true" ...></sd-radio>
```
Thay vÃ o Ä‘Ã³ hÃ£y dÃ¹ng:
```html
<sd-radio [viewed]="true" ...></sd-radio>
```
`[viewed]="true"` áº©n radio group vÃ  hiá»ƒn thá»‹ text/link â€” Ä‘Ãºng semantic cho mÃ n hÃ¬nh xem chi tiáº¿t.

---

âŒ **Trá»™n nhiá»u kiá»ƒu dá»¯ liá»‡u trong `items`**
```typescript
// Äá»«ng lÃ m váº­y
items = ['active', { code: 'inactive', name: 'KhÃ´ng hoáº¡t Ä‘á»™ng' }];
```
Thay vÃ o Ä‘Ã³ hÃ£y dÃ¹ng:
```typescript
items = [
  { code: 'active', name: 'Hoáº¡t Ä‘á»™ng' },
  { code: 'inactive', name: 'KhÃ´ng hoáº¡t Ä‘á»™ng' },
];
```
Lookup dÃ¹ng `item[valueField]`; primitive trong array sáº½ tráº£ vá» `undefined`.

## E2E test attributes

The `<mat-radio-group>` element carries the following data attributes for E2E selector consistency:

| Attribute | Values | Anchor | Prefix | Notes |
| --- | --- | --- | --- | --- |
| `data-autoid` | `forms-radio-<autoId>` | `mat-radio-group` | `forms-radio-` | Set when `[autoId]` input is provided. |
| `data-disabled` | `'true' \| 'false'` | `mat-radio-group` | â€” | Reflects current FormControl disabled state. |
| `data-empty` | `'true' \| 'false'` | `mat-radio-group` | â€” | `'true'` when value is null/undefined; `'false'` when a selection is active. |
| `data-value` | `<selected-key>` | `mat-radio-group` | â€” | Serialized selected key (string); matches one of the item's `valueField`. |
| `data-required` | `'true' \| 'false'` | `mat-radio-group` | â€” | Reflects `required` input; always present. |

> **Note**: `sd-radio` emits only `data-required` from the new validation-meta set. It has no maxlength / minlength / pattern / errorMessage support.

Example:
```html
<!-- When autoId="gender", disabled=false, value='M', items show gender options -->
<mat-radio-group
  data-autoid="forms-radio-gender"
  data-disabled="false"
  data-empty="false"
  data-value="M">
  <!-- ... -->
</mat-radio-group>
```

## Related
- `<sd-select>` â€” dropdown picker for longer or API-loaded lists
- `<sd-checkbox>` â€” multi-select group / boolean
- `<sd-switch>` â€” boolean toggle
- `<sd-label>` â€” label primitive used internally
- `SdLabelDefDirective` / `SdSuffixDefDirective` / `SdViewDefDirective` â€” content-projection slots

