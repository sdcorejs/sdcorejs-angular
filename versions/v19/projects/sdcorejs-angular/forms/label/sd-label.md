# `<sd-label>`

**Type**: Component (presentational — NOT a form control)
**Selector**: `sd-label`
**Import path**: `@sdcorejs/angular/forms/label` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdLabel`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Tiny presentational label primitive — renders the standard SDCoreJS field label row: `<text> [info-icon-with-tooltip] [*]` plus an optional description. Used internally by every `<sd-input>` / `<sd-select>` / `<sd-autocomplete>` / `<sd-date>` / etc. — and exposed for places where you need the same label styling without a form field.

## When to use
- Custom layouts where you need the canonical SDCoreJS label styling (font size T14M, required asterisk, helper-text info icon) but no input control follows it
- Mixing label + custom DOM (e.g. label above a manually-built read-only block, or above a non-form widget)
- Inside a form-field replacement where you want to keep label-area markup consistent with other form controls

## When NOT to use
- As a form control — `<sd-label>` does NOT take input from the user, has no `[form]`/`[name]`/`[(model)]`, and registers nothing on a parent FormGroup
- For section headings — use a normal heading element with the appropriate typography class
- For inline form fields that already render their own label — passing `[label]` to `<sd-input>` etc. is enough; do not stack a separate `<sd-label>`
- For tooltips that aren't tied to a label — use Material `matTooltip` directly

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `string \| null \| undefined` | `undefined` | The label text. If empty/null, the entire component renders nothing. |
| `description` | `string \| null \| undefined` | `undefined` | Optional description line shown below the label in muted (`text-black400 T12R`) style. |
| `helperText` | `string \| undefined` | `undefined` | When set, renders an `info_outline` icon next to the label; tooltip on hover shows this text. |
| `required` | `boolean \| ''` | `false` | Renders a red `*` after the label. Bare attribute (`required`) and string `''` both coerce to `true`. |

> **Coerce**: `required` is treated as `true` for empty-string or any truthy value (custom setter — NOT `booleanAttribute`).

## Outputs
None.

## Content projection (slots)
None — all rendering is driven by the four inputs.

## Form integration
- **Not a form control. No CVA, no `[form]+[name]` pattern, no model.** Pure presentation.
- Internally consumed by `<sd-input>`, `<sd-input-number>`, `<sd-select>`, `<sd-autocomplete>`, `<sd-chip>`, `<sd-checkbox>`, `<sd-date>`, `<sd-date-range>`, `<sd-datetime>`, `<sd-textarea>` — those components forward their `[label]`, `[helperText]`, `[required]` props to an internal `<sd-label>`.
- For the rare case you build a hand-rolled "field" outside the standard form components, use this directly so the label area matches everything else on the page.

## Visual cues (helps agent map screenshots → component)
- Single line: `<bold-ish T14M label text> [info ⓘ] *` — required asterisk in error/red color (`text-error`)
- The info icon is small (1rem × 1rem), `info_outline` from Material font set; tooltip appears below on hover
- If `description` is set, a second line below the label in muted gray small text (`T12R`)
- Renders nothing at all when `label` is empty — safe to use defensively without `*ngIf`

## Examples

### 0. Import vào component

```ts
import { SdLabel } from '@sdcorejs/angular/forms/label';
// hoặc barrel:
// import { SdLabel } from '@sdcorejs/angular/forms';

@Component({
  standalone: true,
  imports: [SdLabel],
  templateUrl: './my.component.html',
})
export class MyComponent {
  required = true;
  helperText = 'Giải thích thêm về trường này';
}
```

### 1. Standalone label above a read-only computed value

`helperText` hiển thị icon ⓘ; hover vào sẽ thấy tooltip phía dưới.

```html
<div class="form-field">
  <sd-label
    label="Số dư khả dụng"
    helperText="Đã trừ các giao dịch đang chờ duyệt">
  </sd-label>
  <div class="T16M">{{ availableBalance | sdFormatNumber }} đ</div>
</div>
```

### 2. Required + description

`required` có thể truyền dưới dạng bare attribute (không cần `[required]="true"`). `description` xuất hiện ở dòng thứ hai bên dưới label, dùng style muted `T12R`.

```html
<sd-label
  label="Mã khách hàng"
  description="Tự động sinh nếu để trống"
  required>
</sd-label>
```

### 3. Inside a custom widget panel

Dùng `<sd-label>` để đồng nhất styling với các form control khác trên cùng trang, dù không có input ngay bên dưới.

```html
<div class="panel">
  <sd-label label="Tài liệu đính kèm" helperText="Tối đa 10 file, mỗi file ≤ 10MB"></sd-label>
  <app-attachment-uploader [(files)]="files"></app-attachment-uploader>
</div>
```

## Anti-patterns
- ❌ Wrapping `<sd-input [label]="...">` inside its own `<sd-label>` — duplicate labels.
- ❌ Trying `[(model)]` / `[form]` / `[name]` — none exist on this component.
- ❌ Using `<sd-label>` as a section heading — it is for FIELD labels (T14M); use proper headings with appropriate typography for sections.
- ❌ Hard-coding the same markup elsewhere — use `<sd-label>` so future label-style tweaks apply globally.
- ❌ Passing translated text via interpolation when you also want a tooltip — `helperText` IS the tooltip content; do not also wrap the component in `matTooltip`.

## Related
- `<sd-input>`, `<sd-input-number>`, `<sd-textarea>`, `<sd-select>`, `<sd-autocomplete>`, `<sd-chip>`, `<sd-checkbox>`, `<sd-date>`, `<sd-date-range>`, `<sd-datetime>` — all use `<sd-label>` internally
- `SdLabelDefDirective` — used by some form components (e.g. `<sd-date-range>`) when you need to project a custom label template
