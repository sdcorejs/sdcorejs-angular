# `<sd-view>`

**Type**: Component
**Selector**: `sd-view`
**Import path**: `@sdcorejs/angular/components/view` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdView`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Read-only label/value display widget — renders a "label on top, value below" pair used to show a single field on a detail/view page (the read-only counterpart to `<sd-input>`/`<sd-select>`/etc.).

## When to use
- Detail / "Xem chi tiết" pages where each field is read-only
- Inside a sectioned form when one specific field should display as text instead of an input
- When a form input component (e.g. `<sd-input>`, `<sd-select>`) is in `[viewed]="true"` mode and you want the same look in plain HTML
- To render a hyperlinked value (label-on-top, click-through value) without using a full form control
- Inside info cards or summary panels (combine multiple `<sd-view>` in a CSS grid)

## When NOT to use
- For editable fields → use `<sd-input>`/`<sd-select>`/etc. (and toggle `[viewed]` if you need a read-only mode that already styles itself)
- For long rich text → use `<sd-preview>` instead (HTML-aware viewer)
- For status badges → use `<sd-badge>`
- For list-of-rows display → use `<sd-table>`
- When the value is an object that needs custom rendering AND you also need editing — pick the form component with `[viewed]` flag, don't compose with `<sd-view>`

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `string \| null \| undefined` | `undefined` | Label text rendered above the value (class `T14R text-black400`). If empty AND no `labelTemplate`, label row is omitted. |
| `value` | `any` | `undefined` | Raw value (object, primitive, …) — passed to `valueTemplate` context as `value` if provided. Not rendered directly. |
| `display` | `string \| null \| undefined` (REQUIRED) | — | Display string. This is what shows when no custom `valueTemplate` is set. Falls back to `—` (em-dash) via `sdEmpty` pipe when null/empty. |
| `hyperlink` | `string \| null \| undefined` | `undefined` | If set, value is rendered as `<a [sdHref]="hyperlink">{{ display }}</a>` (click navigates / opens in tab). |
| `labelTemplate` | `TemplateRef<any> \| undefined` | `undefined` | Optional template ref injected by a parent (used by `<sd-input>` etc. when delegating their label). Wins over `label` and over `#sdLabel` content. |
| `valueTemplate` | `TemplateRef<any> \| undefined` | `undefined` | Optional template ref for value, with context `{ $implicit: display, value }`. Wins over `display` rendering and over `#sdValue` content. |

> **Required note**: `display` uses `input.required()` — Angular will emit a compile error if you forget to bind it.

## Outputs
None. This is a pure display component.

## Content projection (slots)
You may provide either or both templates inside the host:
- `<ng-template #sdLabel>…</ng-template>` — custom label rendering. Picked up via `contentChild('sdLabel')`. Used only when `[labelTemplate]` is not bound.
- `<ng-template #sdValue let-display let-value="value">…</ng-template>` — custom value rendering. Context = `{ $implicit: display, value }`. Used only when `[valueTemplate]` is not bound.

Resolution order (per `computed` signal):
1. `[labelTemplate]` / `[valueTemplate]` input
2. `#sdLabel` / `#sdValue` content child
3. Default (`label` text / `display` text or hyperlink)

## Visual cues (helps agent map screenshots → component)
- **Layout**: vertical stack, `gap: 4px` between label and value
- **Label**: small grey text (`T14R text-black400`) — same styling as form-field labels in viewed mode
- **Value**: medium-weight body text (`T14M`)
- **Hyperlink mode**: value rendered as a clickable text link (color follows `<a>` styles in the theme)
- **Empty value**: shows `—` (em-dash) when `display` is null/empty (via `sdEmpty` pipe)
- Typically appears in a 1/2/3-column grid alongside other `<sd-view>` instances on a detail page

## Permission gating
None — `<sd-view>` does NOT extend `SdBaseSecureComponent` and has no permission-aware behavior. Wrap with `*sdPermission` on the host if a whole row/section is sensitive.

## Examples

### 1. Simple label/value pair on a detail page
```html
<sd-view label="Mã nhân viên" [display]="employee.code"></sd-view>
<sd-view label="Họ và tên" [display]="employee.fullName"></sd-view>
<sd-view label="Email" [display]="employee.email"></sd-view>
```

### 2. Hyperlinked value (click to open profile)
```html
<sd-view
  label="Người tạo"
  [display]="record.createdByName"
  [hyperlink]="'/users/' + record.createdById">
</sd-view>
```

### 3. Custom value template (e.g. status badge)
```html
<sd-view label="Trạng thái" [display]="record.statusName" [value]="record.status">
  <ng-template #sdValue let-display let-status="value">
    <sd-badge
      [title]="display"
      [color]="status === 'ACTIVE' ? 'success' : 'warn'">
    </sd-badge>
  </ng-template>
</sd-view>
```

### 4. Inside a 12-column grid section
```html
<sd-section title="Thông tin chung">
  <div class="row">
    <div class="col-md-6">
      <sd-view label="Tên hợp đồng" [display]="contract.name"></sd-view>
    </div>
    <div class="col-md-3">
      <sd-view label="Ngày bắt đầu" [display]="contract.startDate | date:'dd/MM/yyyy'"></sd-view>
    </div>
    <div class="col-md-3">
      <sd-view label="Ngày kết thúc" [display]="contract.endDate | date:'dd/MM/yyyy'"></sd-view>
    </div>
  </div>
</sd-section>
```

## Anti-patterns
- ❌ Forgetting `[display]` binding — required input, will fail at compile time. Use `[display]="value ?? ''"` if value can be null.
- ❌ Building view-mode forms by composing `<sd-view>` instead of toggling `[viewed]` on the form components — the form components already render in read-only mode and keep validation hooks consistent.
- ❌ Rendering raw HTML in `[display]` — it is plain text. For HTML use `<ng-template #sdValue>` with a sanitizer (or use `<sd-preview>` for rich text).
- ❌ Using `<sd-view>` for very long text without truncation — wrap value in your own template to add ellipsis/expand UX.
- ❌ Passing a heavy object to `[value]` and another to `[display]` that contradict each other — keep `display` derived from `value` for clarity.

## Related
- `<sd-input>`, `<sd-select>`, `<sd-textarea>`, `<sd-input-number>` — pair with `[viewed]="true"` for read-only form fields with the same look
- `<sd-preview>` — rich/HTML content viewer
- `<sd-badge>` — status/tag indicator (often projected via `#sdValue`)
- `<sd-section>` — section wrapper to group multiple `<sd-view>` rows
- `sdHref` directive — used internally for hyperlink rendering
- `sdEmpty` pipe — used internally to render em-dash for empty values
