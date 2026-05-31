# `<sd-radio>`

**Type**: Component (form input)
**Selector**: `sd-radio`
**Import path**: `@sdcorejs/angular/forms/radio` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdRadio`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Radio-button group — user picks exactly ONE option from a small, fixed list. Items can be laid out inline (`row`) or stacked (`column`). Use when the full set of choices should be visible at once (≤ ~6 options); for longer lists, use `<sd-select>` instead.

## When to use
- Pick-one settings with 2–6 short options, all worth showing (e.g. `Gender`, `Type`, `Yes/No/Maybe`)
- Form sections where seeing every option is important for the decision
- DETAIL state via `[viewed]="true"` to render the saved option's display text (or as a hyperlink)

## When NOT to use
- More than ~6 options OR options loaded from API → use `<sd-select>`
- Boolean on/off toggle → use `<sd-switch>` or `<sd-checkbox>`
- Multi-select picks → use `<sd-checkbox>` group or `<sd-select [multiple]>`
- A free-text answer → use `<sd-input>`

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
| `valueField` | `string` (**required**) | — | Key in each item to use as the radio's bound value. |
| `displayField` | `string` (**required**) | — | Key in each item to use as the visible label. |
| `required` | `boolean` | `false` | Adds `Validators.required`. Bare attribute = `true`. |
| `inlineError` | `string` | `undefined` | Forces a synthetic `inlineError` validator with this message. |
| `disabled` | `boolean` | `false` | Disables the underlying `FormControl`. Bare attribute = `true`. |
| `viewed` | `boolean` | `false` | Read-only DETAIL mode — hides the radios, renders the picked item's display text. Bare attribute = `true`. |
| `hyperlink` | `string \| null \| undefined` | `undefined` | In DETAIL mode, render the value as a link (`[sdHref]`). |

> **Coerce note**: `required`, `disabled`, `viewed` accept `'' | true | false | null | undefined` — bare attribute presence (e.g. `<sd-radio required>`) is treated as `true`. (Hand-rolled in setters; not the `booleanAttribute` transform.)

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `modelChange` | `any` | Two-way binding companion for `[(model)]`. |
| `sdChange` | `any` | Emitted on value change with the new selected value. |
| `sdSelection` | `{ value: any \| any[]; item?: any }` | Emitted on change with both the value and the resolved item object (looked up in `items` by `valueField`). |

## Content projection (slots)
- `<ng-template sdLabelDef>` — custom label rendering (overrides `[label]`)
- `<ng-template sdSuffixDef>` — declared via `@ContentChild` but not used by the current template
- `<ng-template sdViewDef>` — declared via `@ContentChild`; the current template falls back to plain text in `[viewed]` mode

## Form integration

**Pattern**: `SdRadio` không implement `ControlValueAccessor`. Dùng `[form]` + `name` để đăng ký control vào FormGroup cha. Trên `ngAfterViewInit`, component tự gọi `formGroup.addControl(name, formControl)` và `removeControl` khi destroy.

- **`formControlName` và `[(ngModel)]` KHÔNG được hỗ trợ.** Dùng `[(model)]` cho two-way binding và `[form]+[name]` cho FormGroup integration.
- **`[viewed]="true"`** chuyển sang DETAIL read-only mode: radio group bị ẩn, giá trị hiển thị là text thuần (hoặc link nếu có `hyperlink`).
- **Validators**: `[required]` → `Validators.required`. `[inlineError]="msg"` → synthetic `inlineError` validator. Inline errors: required → "Vui lòng nhập thông tin"; inlineError → echoes `inlineError`.

## Visual cues (helps agent map screenshots → component)
- A horizontal (`display="row"`) or vertical (`display="column"`) group of bullet circles, each with the option label to its right
- Selected option: filled inner dot in `primary` color; unselected: empty circle outline
- `row` mode adds horizontal spacing (`mr-16`) between options; `column` mode stacks them flush (`m-0`)
- Required marker shows as a red `*` next to the label (rendered by `<sd-label>`)
- Inline error message appears below the group in red when `formControl.touched && formControl.errors?.required` (or `inlineError`)
- In `[viewed]="true"` mode: just plain text — the matched item's `displayField` value (or as a hyperlink if `hyperlink` is set); falls back to em-dash via `sdEmpty` when nothing selected

## Examples

### 1. Required gender picker (inline, with FormGroup)
```html
<sd-radio
  [form]="form" name="gender"
  label="Giới tính" required
  [items]="genderOptions"
  valueField="code" displayField="name"
  [(model)]="model.gender">
</sd-radio>
```
```typescript
// Component class
genderOptions = [
  { code: 'M', name: 'Nam' },
  { code: 'F', name: 'Nữ' },
  { code: 'O', name: 'Khác' },
];
form = new FormGroup({});
model = { gender: 'M' }; // pre-selected default
```
Dùng `required` bare attribute để bắt buộc chọn; giá trị pre-selected truyền qua `[(model)]` thay vì khởi tạo trong FormGroup.

### 2. Stacked option list (column display)
```html
<sd-radio
  [form]="form" name="approvalMode"
  label="Hình thức duyệt"
  display="column"
  [items]="approvalModes"
  valueField="id" displayField="label"
  [(model)]="model.approvalMode"
  (sdSelection)="onModeSelected($event)">
</sd-radio>
```
```typescript
approvalModes = [
  { id: 1, label: 'Duyệt tự động' },
  { id: 2, label: 'Duyệt thủ công' },
  { id: 3, label: 'Duyệt theo luồng' },
];
onModeSelected(event: { value: any; item?: any }) {
  console.log('Selected item:', event.item);
}
```
`display="column"` xếp chọn theo chiều dọc; `sdSelection` trả về cả `value` lẫn `item` object để tránh look-up thủ công.

### 3. DETAIL state with hyperlink
```html
<sd-radio
  label="Loại khách hàng"
  [items]="customerTypes"
  valueField="code" displayField="name"
  [model]="model.customerTypeCode"
  [viewed]="true"
  hyperlink="/customer-type/{{ model.customerTypeCode }}">
</sd-radio>
```
```typescript
customerTypes = [
  { code: 'IND', name: 'Cá nhân' },
  { code: 'BIZ', name: 'Doanh nghiệp' },
];
```
Khi `[viewed]="true"`, radio group bị ẩn và giá trị hiển thị dưới dạng text thuần hoặc link — phù hợp cho màn hình xem chi tiết (DETAIL mode).

## Form integration (3 cách)

### Cách 1: Template-driven `[(model)]` (không dùng FormGroup)
Dùng khi chỉ cần two-way bind giá trị, không cần reactive validation từ FormGroup cha.

```html
<sd-radio
  label="Trạng thái"
  [items]="statusOptions"
  valueField="value" displayField="label"
  [(model)]="selectedStatus"
  (sdChange)="onStatusChange($event)">
</sd-radio>
```
```typescript
statusOptions = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Không hoạt động' },
];
selectedStatus = 'active';
onStatusChange(v: string) { console.log(v); }
```

### Cách 2: Reactive FormGroup (`[form]` + `name`)
Dùng khi radio là một phần của form lớn hơn — `SdRadio` tự `addControl` vào FormGroup khi `ngAfterViewInit`.

```html
<form [formGroup]="myForm">
  <sd-radio
    [form]="myForm" name="type"
    label="Loại" required
    [items]="typeOptions"
    valueField="id" displayField="text"
    [(model)]="model.type">
  </sd-radio>
</form>
```
```typescript
myForm = new FormGroup({});
typeOptions = [
  { id: 'A', text: 'Loại A' },
  { id: 'B', text: 'Loại B' },
];
model = { type: null };

onSubmit() {
  if (this.myForm.valid) { /* ... */ }
}
```

### Cách 3: NgForm (template-driven form)
Dùng khi toàn bộ form dùng `#f="ngForm"` — truyền tham chiếu NgForm; component tự unwrap sang `NgForm.form` (`FormGroup` bên trong).

```html
<form #f="ngForm" (ngSubmit)="onSubmit(f)">
  <sd-radio
    [form]="f" name="priority"
    label="Ưu tiên" required
    [items]="priorityOptions"
    valueField="key" displayField="label"
    [(model)]="model.priority">
  </sd-radio>
  <button type="submit">Lưu</button>
</form>
```
```typescript
priorityOptions = [
  { key: 'high', label: 'Cao' },
  { key: 'medium', label: 'Trung bình' },
  { key: 'low', label: 'Thấp' },
];
model = { priority: 'medium' };

onSubmit(f: NgForm) {
  if (f.valid) { /* ... */ }
}
```

## Anti-patterns

❌ **Dùng `<sd-radio>` cho nhiều hơn ~6 lựa chọn hoặc danh sách tải từ API**
```html
<!-- Đừng làm vậy -->
<sd-radio [items]="apiLoadedItems" valueField="id" displayField="name" ...></sd-radio>
```
Thay vào đó hãy dùng:
```html
<sd-select [items]="apiLoadedItems" valueField="id" displayField="name" ...></sd-select>
```
`<sd-select>` hỗ trợ scroll, filter, lazy-load — tốt hơn khi list dài.

---

❌ **Dùng `formControlName` hoặc `[(ngModel)]`**
```html
<!-- Đừng làm vậy -->
<sd-radio formControlName="type" ...></sd-radio>
<sd-radio [(ngModel)]="model.type" ...></sd-radio>
```
Thay vào đó hãy dùng:
```html
<sd-radio [form]="myForm" name="type" [(model)]="model.type" ...></sd-radio>
```
`SdRadio` không implement `ControlValueAccessor`; dùng `[form]+[name]` là pattern chính thức.

---

❌ **Quên `valueField` hoặc `displayField`**
```html
<!-- Đừng làm vậy — sẽ throw lỗi runtime -->
<sd-radio [items]="items" [(model)]="val"></sd-radio>
```
Thay vào đó hãy dùng:
```html
<sd-radio [items]="items" valueField="code" displayField="name" [(model)]="val"></sd-radio>
```
Cả hai đều là `required: true` inputs — thiếu một trong hai sẽ gây lỗi Angular compiler.

---

❌ **Dùng `[disabled]="true"` để biểu thị trạng thái đọc (DETAIL state)**
```html
<!-- Đừng làm vậy -->
<sd-radio [disabled]="true" ...></sd-radio>
```
Thay vào đó hãy dùng:
```html
<sd-radio [viewed]="true" ...></sd-radio>
```
`[viewed]="true"` ẩn radio group và hiển thị text/link — đúng semantic cho màn hình xem chi tiết.

---

❌ **Trộn nhiều kiểu dữ liệu trong `items`**
```typescript
// Đừng làm vậy
items = ['active', { code: 'inactive', name: 'Không hoạt động' }];
```
Thay vào đó hãy dùng:
```typescript
items = [
  { code: 'active', name: 'Hoạt động' },
  { code: 'inactive', name: 'Không hoạt động' },
];
```
Lookup dùng `item[valueField]`; primitive trong array sẽ trả về `undefined`.

## E2E test attributes

The `<mat-radio-group>` element carries the following data attributes for E2E selector consistency:

| Attribute | Values | Anchor | Prefix | Notes |
| --- | --- | --- | --- | --- |
| `data-autoid` | `forms-radio-<autoId>` | `mat-radio-group` | `forms-radio-` | Set when `[autoId]` input is provided. |
| `data-disabled` | `'true' \| 'false'` | `mat-radio-group` | — | Reflects current FormControl disabled state. |
| `data-empty` | `'true' \| 'false'` | `mat-radio-group` | — | `'true'` when value is null/undefined; `'false'` when a selection is active. |
| `data-value` | `<selected-key>` | `mat-radio-group` | — | Serialized selected key (string); matches one of the item's `valueField`. |
| `data-required` | `'true' \| 'false'` | `mat-radio-group` | — | Reflects `required` input; always present. |

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
- `<sd-select>` — dropdown picker for longer or API-loaded lists
- `<sd-checkbox>` — multi-select group / boolean
- `<sd-switch>` — boolean toggle
- `<sd-label>` — label primitive used internally
- `SdLabelDefDirective` / `SdSuffixDefDirective` / `SdViewDefDirective` — content-projection slots
