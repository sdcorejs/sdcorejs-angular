# `<sd-view>`

**Type**: Component
**Selector**: `sd-view`
**Import path**: `@sdcorejs/angular/components/view` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdView`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose

Read-only label/value display widget. It renders a label on top and a display value below, using the shared `sdView` pipe internally so missing values show as `--` and primitive arrays show as comma-separated text.

## When to use

- Detail/view pages where fields are read-only.
- Summary panels, info cards, and sectioned read-only forms.
- A single hyperlinked value with the same visual language as form detail mode.
- Places where a form input component is in `[viewed]="true"` mode and you want the same look in plain HTML.

## When NOT to use

- Editable fields - use `<sd-input>`, `<sd-select>`, `<sd-date>`, `<sd-datetime>`, etc.
- Long rich text or HTML - use `<sd-preview>` or a custom `#sdValue` template.
- Status/state indicators - use `<sd-badge>` or a custom `#sdValue` template containing `<sd-badge>`.
- Lists of rows - use `<sd-table>`.
- Heavy object rendering - pass a display string or project `#sdValue`.

## Inputs

| Name            | Type                            | Default     | Notes                                                                                                                                                     |
| --------------- | ------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `label`         | `string \| null \| undefined`   | `undefined` | Label text rendered above the value. If empty and no `labelTemplate`/`#sdLabel`, the label row is omitted.                                                |
| `value`         | `any`                           | `undefined` | Raw value passed to `valueTemplate` context as `value`. Not rendered directly by the default branch.                                                      |
| `display`       | `unknown` (REQUIRED)            | -           | Display value. The default branch renders `display                                                                                                        | sdView`, so `null`, `undefined`, `''`, `NaN`, and `[]`become`--`; primitive arrays become `A, B`. |
| `hyperlink`     | `string \| null \| undefined`   | `undefined` | If set, the default value is rendered as `<a [sdHref]="hyperlink">{{ display                                                                              | sdView }}</a>`.                                                                                   |
| `labelTemplate` | `TemplateRef<any> \| undefined` | `undefined` | Optional label template injected by a parent. Wins over `label` and over `#sdLabel` content.                                                              |
| `valueTemplate` | `TemplateRef<any> \| undefined` | `undefined` | Optional value template with context `{ $implicit: display, value, selectedItems, selectedItem }`. Wins over default display and over `#sdValue` content. |
| `selectedItems` | `any[] \| undefined`            | `undefined` | Resolved selected item objects passed by parent controls such as `<sd-select>`.                                                                           |

> **Required note**: `display` uses `input.required()`. Angular will report an error if a template forgets to bind it.

## Outputs

None. This is a pure display component.

## Content projection (slots)

- `<ng-template #sdLabel>...</ng-template>` - custom label rendering. Used only when `[labelTemplate]` is not bound.
- `<ng-template #sdValue let-display let-value="value" let-selectedItems="selectedItems" let-selectedItem="selectedItem">...</ng-template>` - custom value rendering. Context is `{ $implicit: display, value, selectedItems, selectedItem }`. Used only when `[valueTemplate]` is not bound.

Resolution order:

1. `[labelTemplate]` / `[valueTemplate]` inputs
2. `#sdLabel` / `#sdValue` content children
3. Default label text / `display | sdView` text or hyperlink

## Standalone import checklist

Every standalone component that uses `<sd-view>` must import `SdView`. If the `display` expression also uses `sdFormatDate`, `sdFormatDatetime`, `sdFormatNumber`, or `sdView` explicitly, import those pipes too.

```ts
import { Component } from '@angular/core';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdFormatDatePipe, SdFormatNumberPipe, SdViewPipe } from '@sdcorejs/angular/pipes';

@Component({
  standalone: true,
  imports: [SdView, SdBadge, SdFormatDatePipe, SdFormatNumberPipe, SdViewPipe],
  template: `
    <sd-view label="Code" [display]="contract.code"></sd-view>
    <sd-view label="Start date" [display]="contract.startDate | sdFormatDate"></sd-view>
    <sd-view label="Total" [display]="contract.total | sdFormatNumber: 0"></sd-view>
    <sd-view label="Tags" [display]="contract.tags"></sd-view>
  `,
})
export class ContractDetailComponent {
  contract = {
    code: 'HD-001',
    startDate: '2026-06-26',
    total: 1250000,
    tags: ['VIP', 'Renewal'],
  };
}
```

## Visual cues

- Vertical stack with a small gap between label and value.
- Label uses the same grey/small visual language as form-field labels in viewed mode.
- Value uses medium body text.
- Hyperlink mode renders the value as clickable text.
- Empty/default branch shows `--` through `sdView`.
- Primitive arrays display as `A, B, C`.

## Permission gating

None. `<sd-view>` does not extend `SdBaseSecureComponent`. Wrap the host with `*sdPermission` if a field or section is sensitive.

## Examples

### 1. Simple label/value pair

```html
<sd-view label="Employee code" [display]="employee.code"></sd-view>
<sd-view label="Full name" [display]="employee.fullName"></sd-view>
<sd-view label="Email" [display]="employee.email"></sd-view>
```

### 2. Missing values and arrays

```html
<sd-view label="Phone" [display]="employee.phone"></sd-view>
<!-- null/undefined/''/NaN -> -- -->

<sd-view label="Roles" [display]="employee.roleNames"></sd-view>
<!-- ['Admin', 'Approver'] -> Admin, Approver -->
```

### 3. Hyperlinked value

```html
<sd-view label="Created by" [display]="record.createdByName" [hyperlink]="'/users/' + record.createdById"> </sd-view>
```

### 4. Date/number formatting

Use SDCoreJS pipes rather than Angular's built-in `date` pipe or custom pipes.

```html
<sd-view label="Start date" [display]="contract.startDate | sdFormatDate"></sd-view>
<sd-view label="Updated at" [display]="contract.updatedAt | sdFormatDatetime : 'dd/MM/yyyy HH:mm'"></sd-view>
<sd-view label="Contract value" [display]="contract.totalValue | sdFormatNumber : 0"></sd-view>
```

### 5. Custom value template with badge

```html
<sd-view label="Status" [display]="record.statusName" [value]="record.status">
  <ng-template #sdValue let-display let-status="value">
    <sd-badge [title]="display" [color]="status === 'ACTIVE' ? 'success' : 'warn'"> </sd-badge>
  </ng-template>
</sd-view>
```

### 6. Inside a 12-column grid section

```html
<sd-section title="General information">
  <div class="row">
    <div class="col-md-6">
      <sd-view label="Contract name" [display]="contract.name"></sd-view>
    </div>
    <div class="col-md-3">
      <sd-view label="Start date" [display]="contract.startDate | sdFormatDate"></sd-view>
    </div>
    <div class="col-md-3">
      <sd-view label="End date" [display]="contract.endDate | sdFormatDate"></sd-view>
    </div>
  </div>
</sd-section>
```

## Anti-patterns

- Forgetting `[display]`; it is a required input.
- Passing raw objects to `[display]` and accepting `[object Object]`; map to a string or project `#sdValue`.
- Using Angular `date` or a custom date pipe when `sdFormatDate` / `sdFormatDatetime` exists.
- Building view-mode forms by composing many `<sd-view>` instances when the existing form controls can use `[viewed]="true"`.
- Rendering raw HTML in `[display]`; it is plain text.
- Using `<sd-view>` for editable fields.

## Related

- `sdView` pipe - default display fallback used internally.
- `sdFormatNumber`, `sdFormatDate`, `sdFormatDatetime` - recommended display formatters.
- `<sd-input>`, `<sd-select>`, `<sd-textarea>`, `<sd-input-number>` - form controls with `[viewed]="true"`.
- `<sd-preview>` - rich/HTML content viewer.
- `<sd-badge>` - status/tag indicator.
- `<sd-section>` - section wrapper for read-only layouts.
- `sdHref` directive - used internally for hyperlink rendering.
