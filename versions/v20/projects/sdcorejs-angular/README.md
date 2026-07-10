# @sdcorejs/angular

> Angular UI library built on Angular Material - supports Angular 19 / 20 / 21.

[![Angular](https://img.shields.io/badge/Angular-19%2B-red)](https://angular.dev)
[![Angular Material](https://img.shields.io/badge/Angular_Material-19%2B-purple)](https://material.angular.io)

**🚀 [Showcase](https://sdcorejs.github.io/sdcorejs-angular)** · **📖 [Storybook — code samples, props & API](https://sdcorejs.github.io/portal-template)**

---

## Table of Contents / Mục lục

- [Getting Started / Cài đặt](#getting-started--cài-đặt)
- [Theming / SCSS Customization](#theming--scss-customization)
- [AI Agent Usage Guardrails](#ai-agent-usage-guardrails)
- [Components](#components)
  - [SdButton](#sdbutton)
  - [SdBadge](#sdbadge)
  - [SdSection](#sdsection)
  - [SdModal](#sdmodal)
  - [SdTable](#sdtable)
  - [SdAvatar](#sdavatar)
  - [Other Components](#other-components--các-component-khác)
- [Form Components](#form-components)
- [CRUD Patterns / Code mẫu CRUD](#crud-patterns--code-mẫu-crud)
- [Contributing Guide / Hướng dẫn đóng góp](#contributing-guide--hướng-dẫn-đóng-góp)

---

## Getting Started / Cài đặt

### Prerequisites / Yêu cầu

| Dependency                           | Version                             |
| ------------------------------------ | ----------------------------------- |
| `@angular/core`                      | `^19.0.0 \|\| ^20.0.0 \|\| ^21.0.0` |
| `@angular/material`                  | `^19.0.0 \|\| ^20.0.0 \|\| ^21.0.0` |
| `@angular/material-date-fns-adapter` | `^19.0.0 \|\| ^20.0.0 \|\| ^21.0.0` |
| `date-fns`                           | `^3 \|\| ^4`                        |

### Installation / Cài đặt

```bash
npm install @sdcorejs/angular
```

### Setup

**1. Import global styles / Import style toàn cục**

Thêm vào `angular.json` (hoặc `styles.scss` của app):

```json
// angular.json
{
  "styles": ["node_modules/@sdcorejs/angular/assets/scss/sd-core.scss"]
}
```

hoặc trong `styles.scss`:

```scss
@use '@sdcorejs/angular/assets/scss/sd-core';
```

**2. Import Material Icons font / Font icon**

Thêm vào `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600&display=swap" rel="stylesheet" />
```

**3. Configure providers / Cấu hình providers**

```typescript
// app.config.ts
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    // ... các providers khác
  ],
};
```

---

## Theming / SCSS Customization

`sd-core.scss` emits the Angular Material M3 theme with `mat.theme(...)`.
Prefer Core UI variables such as `--sd-primary`, `--sd-surface`, `--sd-text`,
and `--sd-border` in application code. Material system variables remain an
implementation detail for Angular Material overrides.

### CSS Variables

`@sdcorejs/angular` sử dụng CSS custom properties (variables) để quản lý màu sắc. Mỗi màu được expose dưới dạng `--sd-<color>`.

**Available color tokens / Các biến màu sắc:**

Core UI exposes a small public token surface: semantic palettes for component
states, plus neutral tokens for surface, text, border, and disabled states.

| Variable | Default bridge / fallback | Description |
| -------- | ------------------------- | ----------- |
| `--sd-primary` | `var(--mat-sys-primary, #005cbb)` | Main action color |
| `--sd-primary-light` | `color-mix(in srgb, var(--sd-primary) 14%, white)` | Soft primary background |
| `--sd-primary-dark` | `color-mix(in srgb, var(--sd-primary) 84%, black)` | Hover/active primary shade |
| `--sd-primary-contrast` | `#ffffff` | Text/icon on primary |
| `--sd-secondary` | `var(--mat-sys-secondary, #5c6270)` | Secondary action/accent |
| `--sd-secondary-light` | `color-mix(in srgb, var(--sd-secondary) 12%, white)` | Soft secondary background |
| `--sd-secondary-dark` | `color-mix(in srgb, var(--sd-secondary) 84%, black)` | Hover/active secondary shade |
| `--sd-secondary-contrast` | `#ffffff` | Text/icon on secondary |
| `--sd-info`, `--sd-success`, `--sd-warning`, `--sd-error` | Semantic base colors | Info, success, warning, and error states |
| `--sd-*-light` / `--sd-*-dark` / `--sd-*-contrast` | Generated from each semantic base | Soft background, active shade, and readable foreground |
| `--sd-surface` | `var(--mat-sys-surface, #fdfbff)` | App/page surface |
| `--sd-surface-muted` | `var(--mat-sys-surface-container-highest, #e7e8ed)` | Muted neutral background |
| `--sd-text` | `var(--mat-sys-on-surface, #1a1b1f)` | Primary text |
| `--sd-text-secondary` | `var(--mat-sys-on-surface-variant, #44474f)` | Secondary text |
| `--sd-text-muted` | `color-mix(in srgb, var(--sd-text) 62%, transparent)` | Muted text |
| `--sd-border` | `var(--mat-sys-outline-variant, #c4c6d0)` | Divider/subtle border |
| `--sd-border-strong` | `var(--mat-sys-outline, #74777f)` | Strong border/focus outline |
| `--sd-disabled-bg` | `color-mix(in srgb, var(--sd-text) 8%, transparent)` | Disabled background |
| `--sd-disabled-text` | `color-mix(in srgb, var(--sd-text) 60%, transparent)` | Disabled text/icon |

### Custom Theme / Tuỳ chỉnh theme

Ghi đè theme mặc định bằng cách truyền map SCSS vào mixin `theme()`:

```scss
// styles.scss
@use '@sdcorejs/angular/assets/scss/themes/default' as default;

html {
  @include default.theme(
    (
      primary: #7c3aed,
      primary-light: #ede9fe,
      primary-dark: #5b21b6,
      success: #10b981,
      error: #ef4444,
    )
  );
}
```

Chỉ cần override các màu muốn thay đổi — các màu còn lại giữ nguyên giá trị mặc định.

### Utility Classes / Các class tiện ích

Thư viện cung cấp sẵn các utility class:

```html
<!-- Text color -->
<span class="text-primary">Text màu primary</span>
<span class="text-error">Text màu error</span>

<!-- Background -->
<div class="bg-primary-light">Background nhạt</div>

<!-- Spacing (đơn vị px, từ 0–200) -->
<div class="mt-16 mb-8 px-24">margin-top: 16px, padding: 0 24px</div>

<!-- Gap -->
<div class="d-flex gap-8">gap: 8px</div>

<!-- Grid -->
<div class="sd-grid-container grid-cols-3">
  <div class="col-span-2">Chiếm 2 cột</div>
  <div class="col-span-1">Chiếm 1 cột</div>
</div>

<!-- Bootstrap grid -->
<div class="row">
  <div class="col-6">50%</div>
  <div class="col-6">50%</div>
</div>
```

---

## AI Agent Usage Guardrails

Use this section as a checklist when generating SDCoreJS Angular code from online docs.

### 1. Standalone imports are mandatory

Every component, directive, and pipe used in a standalone template must be listed in the host component's `imports`. This includes template-only directives such as `sdTableCellDef`, `sdTableFilterDef`, `sdSuffixDef`, `sdViewDef`, `sdItemDef`, and shared display pipes.

```ts
import { Component } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import {
  SdTable,
  SdTableCellDefDirective,
  SdTableFilterDefDirective,
  SdTableFooterDefDirective,
  SdTableTitleDefDirective,
} from '@sdcorejs/angular/components/table';
import { SdInput, SdInputNumber, SdSelect } from '@sdcorejs/angular/forms';
import { SdItemDefDefDirective, SdSuffixDefDirective, SdViewDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdFormatDatePipe, SdFormatDatetimePipe, SdFormatNumberPipe, SdViewPipe } from '@sdcorejs/angular/pipes';

@Component({
  standalone: true,
  imports: [
    SdButton,
    SdTable,
    SdTableCellDefDirective,
    SdTableFilterDefDirective,
    SdTableFooterDefDirective,
    SdTableTitleDefDirective,
    SdInput,
    SdInputNumber,
    SdSelect,
    SdItemDefDefDirective,
    SdSuffixDefDirective,
    SdViewDefDirective,
    SdFormatNumberPipe,
    SdFormatDatePipe,
    SdFormatDatetimePipe,
    SdViewPipe,
  ],
  templateUrl: './list.component.html',
})
export class ListComponent {}
```

Common missed imports:

| Template usage                            | Required import                                                       |
| ----------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| `<ng-template sdTableCellDef="amount">`   | `SdTableCellDefDirective` from `@sdcorejs/angular/components/table`   |
| `<ng-template sdTableFilterDef="status">` | `SdTableFilterDefDirective` from `@sdcorejs/angular/components/table` |
| `<ng-template sdTableTitleDef="name">`    | `SdTableTitleDefDirective` from `@sdcorejs/angular/components/table`  |
| `<ng-template sdTableFooterDef="amount">` | `SdTableFooterDefDirective` from `@sdcorejs/angular/components/table` |
| `<ng-template sdTableExpandDef>`          | `SdTableExpandDefDirective` from `@sdcorejs/angular/components/table` |
| `<ng-template sdSuffixDef>`               | `SdSuffixDefDirective` from `@sdcorejs/angular/forms/directives`      |
| `<ng-template sdViewDef>`                 | `SdViewDefDirective` from `@sdcorejs/angular/forms/directives`        |
| `<ng-template sdItemDef>`                 | `SdItemDefDefDirective` from `@sdcorejs/angular/forms/directives`     |
| `                                         | sdFormatNumber`                                                       | `SdFormatNumberPipe` from `@sdcorejs/angular/pipes`   |
| `                                         | sdFormatDate`                                                         | `SdFormatDatePipe` from `@sdcorejs/angular/pipes`     |
| `                                         | sdFormatDatetime`                                                     | `SdFormatDatetimePipe` from `@sdcorejs/angular/pipes` |
| `                                         | sdView`                                                               | `SdViewPipe` from `@sdcorejs/angular/pipes`           |

### 2. Table cells use dense form controls

When rendering an editable SD form control inside `<sd-table>` cell templates or custom inline filter templates, always use `size="sm"` and `hideInlineError`. This keeps row height stable and surfaces validation through the compact error icon/tooltip instead of inserting inline error text inside the table row.

```html
<sd-table [option]="tableOption">
  <ng-template sdTableCellDef="quantity" let-row>
    <sd-input-number size="sm" hideInlineError type="positive" [precision]="0" [(model)]="row.quantity"> </sd-input-number>
  </ng-template>

  <ng-template sdTableCellDef="status" let-row>
    <sd-select size="sm" hideInlineError [items]="statusList" valueField="code" displayField="name" [(model)]="row.status"> </sd-select>
  </ng-template>

  <ng-template sdTableFilterDef="keyword" let-filter let-update="update">
    <sd-input size="sm" hideInlineError [(model)]="filter.keyword" (keyupEnter)="update()"> </sd-input>
  </ng-template>
</sd-table>
```

### 3. Prefer shared display pipes

Do not create app-local pipes for common display formatting.

```html
<!-- Good -->
{{ row.amount | sdFormatNumber : 0 | sdView }} {{ row.issueDate | sdFormatDate | sdView }} {{ row.updatedAt | sdFormatDatetime : 'dd/MM/yyyy
HH:mm' | sdView }} {{ row.tags | sdView }}

<!-- Avoid -->
{{ row.amount | customCurrency }} {{ row.issueDate | date : 'dd/MM/yyyy' }} {{ row.tags?.join(', ') || '--' }}
```

- `sdFormatNumber` formats numbers using SDCoreJS locale configuration.
- `sdFormatDate` formats date-only values with default `dd/MM/yyyy`.
- `sdFormatDatetime` formats date-time values with default `dd/MM/yyyy HH:mm:ss`.
- `sdView` renders `--` for `null`, `undefined`, `''`, `NaN`, and empty arrays; primitive arrays render as `A, B`.

### 4. Command icons default to Material Symbols Outlined

Table row commands and child command menu items default to the outline Material icon font set. Only set `fontSet` when a specific icon family is required.

```ts
command: {
  align: 'right',
  commands: [
    { icon: 'edit', title: 'Edit', click: row => this.edit(row) },
    {
      icon: 'more_vert',
      title: 'More',
      children: [
        { icon: 'visibility', title: 'View', click: row => this.view(row) },
        { icon: 'delete', title: 'Delete', color: 'error', click: row => this.delete(row) },
      ],
    },
  ],
}
```

---

## Components

> Tất cả component đều là **standalone** và sử dụng **Angular Signals** API.  
> All components are **standalone** and use **Angular Signals** API.

### SdButton

```typescript
import { SdButton } from '@sdcorejs/angular/components/button';
```

**Inputs:**

| Input        | Type                                       | Default       | Description                        |
| ------------ | ------------------------------------------ | ------------- | ---------------------------------- |
| `type`       | `'fill' \| 'light' \| 'outline' \| 'text'` | `'light'`     | Kiểu nút                           |
| `color`      | `Color`                                    | `'secondary'` | Màu sắc                            |
| `size`       | `'sm' \| 'md' \| 'lg'`                     | `'sm'`        | Kích thước                         |
| `title`      | `string`                                   | —             | Nhãn nút                           |
| `prefixIcon` | `string`                                   | —             | Icon Material trước text           |
| `suffixIcon` | `string`                                   | —             | Icon Material sau text             |
| `disabled`   | `boolean`                                  | `false`       | Vô hiệu hoá                        |
| `loading`    | `boolean`                                  | `false`       | Trạng thái loading (tự chặn click) |
| `tooltip`    | `string`                                   | —             | Tooltip khi hover                  |
| `width`      | `string`                                   | —             | CSS width tuỳ chỉnh                |

**Output:** `(click): EventEmitter<Event>` — có throttle 300ms, tự chặn khi `disabled` hoặc `loading`.

```html
<sd-button type="fill" color="primary" title="Lưu" prefixIcon="save" (click)="onSave()" />
<sd-button type="outline" color="error" prefixIcon="delete" tooltip="Xoá" />
<sd-button type="light" title="Huỷ" (click)="modal.close()" />
<sd-button type="fill" color="primary" title="Đang xử lý" [loading]="true" />
```

---

### SdBadge

```typescript
import { SdBadge } from '@sdcorejs/angular/components/badge';
```

**Inputs:**

| Input     | Type                         | Default       | Description       |
| --------- | ---------------------------- | ------------- | ----------------- |
| `type`    | `'tag' \| 'round' \| 'icon'` | `'icon'`      | Kiểu badge        |
| `color`   | `Color`                      | `'secondary'` | Màu sắc           |
| `title`   | `string \| number`           | —             | Nội dung hiển thị |
| `icon`    | `string`                     | —             | Icon Material     |
| `size`    | `Size`                       | `'sm'`        | Kích thước        |
| `tooltip` | `string`                     | —             | Tooltip           |

Shorthand color inputs (boolean): `primary`, `secondary`, `success`, `info`, `warning`, `error`.

```html
<sd-badge type="tag" color="success" title="Hoạt động" />
<sd-badge type="round" [warning]="true" title="Chờ duyệt" />
<sd-badge type="icon" color="error" icon="close" title="Từ chối" />
```

---

### SdSection

```typescript
import { SdSection } from '@sdcorejs/angular/components/section';
```

**Inputs:**

| Input         | Type      | Default     | Description                |
| ------------- | --------- | ----------- | -------------------------- |
| `title`       | `string`  | _required_  | Tiêu đề section            |
| `subTitle`    | `string`  | —           | Tiêu đề phụ                |
| `icon`        | `string`  | —           | Icon Material              |
| `iconColor`   | `Color`   | `'primary'` | Màu icon                   |
| `collapsible` | `boolean` | `false`     | Cho phép thu gọn           |
| `collapsed`   | `boolean` | `false`     | Trạng thái ban đầu thu gọn |
| `hideHeader`  | `boolean` | `false`     | Ẩn phần header             |

```html
<sd-section title="Thông tin cơ bản" icon="person" iconColor="primary">
  <!-- nội dung -->
</sd-section>

<sd-section title="Cài đặt nâng cao" icon="settings" collapsible [collapsed]="true">
  <!-- nội dung ẩn mặc định -->
</sd-section>
```

---

### SdModal

```typescript
import { SdModal } from '@sdcorejs/angular/components/modal';
```

**Inputs:**

| Input             | Type                                     | Default     | Description                      |
| ----------------- | ---------------------------------------- | ----------- | -------------------------------- |
| `title`           | `string`                                 | —           | Tiêu đề modal                    |
| `color`           | `Color`                                  | `'primary'` | Màu header                       |
| `width`           | `'sx' \| 'sm' \| 'md' \| 'lg' \| string` | `'md'`      | Độ rộng (md = 60vw)              |
| `height`          | `string`                                 | `'auto'`    | Chiều cao                        |
| `view`            | `'dialog' \| 'bottom-sheet'`             | auto        | Tự động bottom-sheet trên mobile |
| `lazyLoadContent` | `boolean`                                | `true`      | Lazy render nội dung             |

**Output:** `(sdClosed): EventEmitter` — phát ra khi modal đóng.

**Methods** (dùng qua `@ViewChild`):

- `modal.open()` — mở modal
- `modal.close()` — đóng modal

> ⚠️ Nội dung modal phải đặt trong `<ng-template>`.

```html
<sd-modal #myModal title="Thêm mới" width="md" (sdClosed)="onClosed()">
  <ng-template>
    <div class="modal-body p-16">
      <!-- nội dung form -->
    </div>
    <div class="modal-footer d-flex justify-content-end gap-8 p-16">
      <sd-button title="Huỷ" (click)="myModal.close()" />
      <sd-button type="fill" color="primary" title="Lưu" (click)="onSave()" />
    </div>
  </ng-template>
</sd-modal>

<sd-button title="Mở modal" prefixIcon="add" (click)="myModal.open()" />
```

---

### SdTable

```typescript
import { SdTable } from '@sdcorejs/angular/components/table';
import type { SdTableOption, SdTableColumn } from '@sdcorejs/angular/components/table';
```

SdTable nhận một object `option` duy nhất kiểu `SdTableOption<T>`.

**Column types / Kiểu cột:**

| `type`          | Mô tả                     |
| --------------- | ------------------------- |
| `'string'`      | Văn bản                   |
| `'number'`      | Số (tự format)            |
| `'boolean'`     | True/False                |
| `'date'`        | Ngày                      |
| `'datetime'`    | Ngày giờ                  |
| `'time'`        | Giờ                       |
| `'values'`      | Enum từ danh sách cố định |
| `'lazy-values'` | Enum load async           |
| `'children'`    | Cột nhóm (multi-header)   |

**Local table:**

```typescript
option: SdTableOption<Product> = {
  type: 'local',
  items: () => this.products,
  columns: [
    { field: 'code', type: 'string', title: 'Mã', width: '120px' },
    { field: 'name', type: 'string', title: 'Tên', sortable: true },
    { field: 'price', type: 'number', title: 'Đơn giá', align: 'right' },
    {
      field: 'active',
      type: 'boolean',
      title: 'Kích hoạt',
      useBadge: val => ({ color: val ? 'success' : 'secondary', title: val ? 'Có' : 'Không' }),
    },
  ],
  paginate: { pageSize: 20 },
  reload: { visible: true },
};
```

**Server-side table:**

```typescript
option: SdTableOption<Product> = {
  type: 'server',
  items: async (filterRequest, pagingReq) => {
    const res = await this.service.search({
      keyword: filterRequest.keyword,
      page: pagingReq.page,
      pageSize: pagingReq.pageSize,
    });
    return { items: res.data, total: res.total };
  },
  columns: [
    { field: 'code', type: 'string', title: 'Mã', width: '120px' },
    { field: 'name', type: 'string', title: 'Tên', sortable: true },
    {
      field: 'status',
      type: 'values',
      title: 'Trạng thái',
      useBadge: val => ({ color: val === 'ACTIVE' ? 'success' : 'secondary', title: val }),
    },
  ],
  command: {
    align: 'right',
    commands: [
      { icon: 'edit', color: 'primary', title: 'Sửa', click: row => this.onEdit(row) },
      { icon: 'delete', color: 'error', title: 'Xoá', click: row => this.onDelete(row) },
    ],
  },
};
```

```html
<sd-table #sdTable [option]="option" />
```

**Tree rows / Dòng cây:**

`tree` là discriminated union theo `loadType`. Icon expand (`chevron_right` / `expand_more`) nằm ở **cột đầu** — cột STT khi bật `index`, ngược lại cột data đầu tiên — thụt lề theo cấp.

```typescript
// loadType: 'static' — children embedded sẵn trong mỗi row
tree: { loadType: 'static', childrenKey: 'children', defaultExpanded: 1 }

// loadType: 'lazy' — nạp con khi bung (Promise); hasChildren gate icon expand
tree: {
  loadType: 'lazy',
  hasChildren: (row) => row.type === 'Folder',     // chỉ Folder mới có icon expand
  onExpandChildren: (row) => api.getChildren(row.id),  // () => Promise<T[]>
}
```

- **Child-level search** (`type: 'local'` + `loadType: 'static'`): lọc inline tìm cả **cấp con** — giữ nhánh cha của node khớp, ẩn sibling không khớp, tự bung tới node khớp. Clear filter khôi phục cây.
- **Lazy loading**: spinner hiện trong ô chevron khi `onExpandChildren` đang chạy; `hasChildren` quyết định dòng nào hiện icon (không truyền = mọi node đều hiện).

---

### SdAvatar

```typescript
import { SdAvatar } from '@sdcorejs/angular/components/avatar';
```

```html
<sd-avatar src="/api/avatar/123" name="Nguyễn Văn A" size="md" /> <sd-avatar name="NVA" color="primary" size="lg" />
```

---

### Other Components / Các component khác

| Component           | Import                                          | Mô tả                             |
| ------------------- | ----------------------------------------------- | --------------------------------- |
| `SdTabRouter`       | `@sdcorejs/angular/components/tab-router`       | Tab navigation với Angular Router |
| `SdSideDrawer`      | `@sdcorejs/angular/components/side-drawer`      | Drawer layout trái/phải           |
| `SdUploadFile`      | `@sdcorejs/angular/components/upload-file`      | Upload file                       |
| `SdQuickAction`     | `@sdcorejs/angular/components/quick-action`     | Nút action dạng icon              |
| `SdHistory`         | `@sdcorejs/angular/components/history`          | Lịch sử thay đổi                  |
| `SdImportExcel`     | `@sdcorejs/angular/components/import-excel`     | Wizard import Excel               |
| `SdQueryBuilder`    | `@sdcorejs/angular/components/query-builder`    | Visual query builder              |
| `SdCodeEditor`      | `@sdcorejs/angular/components/code-editor`      | Code editor (PrismJS)             |
| `SdMiniEditor`      | `@sdcorejs/angular/components/mini-editor`      | Rich text editor nhỏ              |
| `SdDocumentBuilder` | `@sdcorejs/angular/components/document-builder` | Document builder                  |
| `SdAnchorMain`      | `@sdcorejs/angular/components/anchor`           | Anchor / mục lục cuộn trang       |
| `SdView`            | `@sdcorejs/angular/components/view`             | View wrapper read-only            |

---

## Form Components

```typescript
import {
  SdInput, // Text input
  SdInputNumber, // Number input
  SdSelect, // Dropdown
  SdAutocomplete, // Autocomplete
  SdDate, // Date picker
} from '@sdcorejs/angular/forms';
```

```html
<sd-input [(model)]="form.name" label="Họ tên" [required]="true" />

<sd-input-number [(model)]="form.price" label="Đơn giá" [min]="0" suffix="VNĐ" />

<sd-select [(model)]="form.status" label="Trạng thái" [items]="statusList" valueField="value" displayField="label" />

<sd-date [(model)]="form.birthday" label="Ngày sinh" />
```

---

## CRUD Patterns / Code mẫu CRUD

### List Component

```typescript
// product-list.component.ts
import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { SdTable, SdTableOption } from '@sdcorejs/angular/components/table';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdInput, SdSelect } from '@sdcorejs/angular/forms';

interface Product {
  id: number;
  code: string;
  name: string;
  price: number;
  status: 'ACTIVE' | 'INACTIVE';
}

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  standalone: true,
  imports: [SdTable, SdButton, SdModal, SdSection, SdInput, SdSelect],
})
export class ProductListComponent implements OnInit {
  @ViewChild('formModal') formModal!: SdModal;
  @ViewChild('sdTable') sdTable?: SdTable<Product>;

  selectedItem: Product | null = null;
  formData: Partial<Product> = {};
  isSaving = signal(false);

  readonly STATUS_LIST = [
    { value: 'ACTIVE', label: 'Hoạt động' },
    { value: 'INACTIVE', label: 'Dừng' },
  ];

  option!: SdTableOption<Product>;

  constructor(private service: ProductService) {}

  ngOnInit() {
    this.option = {
      type: 'server',
      items: async (filter, paging) => this.service.search(filter, paging),
      columns: [
        { field: 'code', type: 'string', title: 'Mã', width: '120px' },
        { field: 'name', type: 'string', title: 'Tên', sortable: true },
        { field: 'price', type: 'number', title: 'Đơn giá', align: 'right' },
        {
          field: 'status',
          type: 'values',
          title: 'Trạng thái',
          option: { items: this.STATUS_LIST, valueField: 'value', displayField: 'label' },
          useBadge: val => ({
            color: val === 'ACTIVE' ? 'success' : 'secondary',
            title: this.STATUS_LIST.find(s => s.value === val)?.label,
          }),
        },
      ],
      command: {
        align: 'right',
        commands: [
          { icon: 'edit', color: 'primary', title: 'Sửa', click: row => this.openForm(row) },
          { icon: 'delete', color: 'error', title: 'Xoá', click: row => this.onDelete(row) },
        ],
      },
      paginate: { pageSize: 20 },
      reload: { visible: true },
    };
  }

  openForm(item?: Product) {
    this.selectedItem = item || null;
    this.formData = item ? { ...item } : { status: 'ACTIVE' };
    this.formModal.open();
  }

  async onSave() {
    this.isSaving.set(true);
    try {
      if (this.selectedItem) {
        await this.service.update(this.selectedItem.id, this.formData);
      } else {
        await this.service.create(this.formData);
      }
      this.formModal.close();
      this.sdTable?.reload?.();
    } finally {
      this.isSaving.set(false);
    }
  }

  async onDelete(item: Product) {
    if (!confirm(`Xoá "${item.name}"?`)) return;
    await this.service.delete(item.id);
    this.sdTable?.reload?.();
  }
}
```

### Template

```html
<!-- product-list.component.html -->
<div class="d-flex justify-content-between align-items-center mb-16">
  <h2>Danh sách sản phẩm</h2>
  <sd-button type="fill" color="primary" title="Thêm mới" prefixIcon="add" (click)="openForm()" />
</div>

<sd-table #sdTable [option]="option" />

<sd-modal #formModal [title]="selectedItem ? 'Chỉnh sửa' : 'Thêm mới'" width="md">
  <ng-template>
    <div class="modal-body p-16">
      <sd-section title="Thông tin sản phẩm" icon="inventory">
        <div class="row">
          <div class="col-6">
            <sd-input [(model)]="formData.code" label="Mã" [required]="true" />
          </div>
          <div class="col-6">
            <sd-select [(model)]="formData.status" label="Trạng thái" [items]="STATUS_LIST" valueField="value" displayField="label" />
          </div>
          <div class="col-12">
            <sd-input [(model)]="formData.name" label="Tên sản phẩm" [required]="true" />
          </div>
          <div class="col-6">
            <sd-input-number [(model)]="formData.price" label="Đơn giá" suffix="VNĐ" />
          </div>
        </div>
      </sd-section>
    </div>
    <div class="modal-footer d-flex justify-content-end gap-8 p-16">
      <sd-button title="Huỷ" (click)="formModal.close()" />
      <sd-button type="fill" color="primary" title="Lưu" prefixIcon="save" [loading]="isSaving()" (click)="onSave()" />
    </div>
  </ng-template>
</sd-modal>
```

---

## Contributing Guide / Hướng dẫn đóng góp

### Cấu trúc thư viện / Project structure

```
sdcorejs-angular/
├── src/
│   └── public-api.ts           # Entry point chính
├── assets/
│   └── scss/
│       ├── sd-core.scss        # SCSS entry (import vào app)
│       ├── core/               # Base utilities (color, grid, form, ...)
│       └── themes/             # Theme mặc định + Material theme
├── components/                 # UI Components
│   ├── button/
│   ├── table/
│   ├── modal/
│   └── ...
├── forms/                      # Form components
│   ├── input/
│   ├── select/
│   └── ...
├── directives/                 # Angular directives
├── pipes/                      # Angular pipes
├── services/                   # Shared services
├── utilities/                  # Types, models, helpers
└── modules/                    # Feature modules (layout, permission, ...)
```

### Thêm component mới / Adding a new component

**1. Tạo thư mục component:**

```
components/
└── my-component/
    ├── index.ts                         # Export public API
    ├── ng-package.json                  # ng-packagr entry
    └── src/
        ├── my-component.component.ts
        ├── my-component.component.html
        └── my-component.component.scss
```

**2. `ng-package.json`:**

```json
{
  "$schema": "../../../../node_modules/ng-packagr/ng-package.schema.json",
  "lib": {
    "entryFile": "index.ts"
  }
}
```

**3. `index.ts`:**

```typescript
export * from './src/my-component.component';
```

**4. Component template:**

```typescript
// my-component.component.ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SdBaseSecureComponent } from '@sdcorejs/angular/components/base';
import { Color } from '@sdcorejs/angular/utilities';

@Component({
  selector: 'sd-my-component',
  templateUrl: './my-component.component.html',
  styleUrl: './my-component.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [],
})
export class SdMyComponent extends SdBaseSecureComponent {
  color = input<Color, Color | undefined | null>('primary', {
    transform: value => value || 'primary',
  });

  title = input<string | undefined | null>(undefined);
}
```

**5. Export từ `components/index.ts`:**

```typescript
// components/index.ts
export * from '@sdcorejs/angular/components/my-component';
```

### Quy ước / Conventions

| Mục              | Quy ước                                                       |
| ---------------- | ------------------------------------------------------------- |
| Selector         | `sd-<tên-component>`                                          |
| Class name       | `Sd<TênComponent>` (Pascal)                                   |
| Input            | Dùng `input<T>()` signal, **không** dùng `@Input()` decorator |
| Null safety      | Input transform phải handle `null/undefined`                  |
| Base class       | Extend `SdBaseSecureComponent` cho component có permission    |
| Change detection | Luôn dùng `ChangeDetectionStrategy.OnPush`                    |
| Standalone       | Luôn `standalone: true`                                       |
| Colors           | Dùng `Color` type, không hardcode màu                         |

### Build

```bash
# Build toàn bộ thư viện
ng-packagr -p ng-package.json

# Watch mode
ng-packagr -p ng-package.json --watch
```

### Versioning

Scheme: `<angular-major>.0.<release>`. Major digit **khoá theo Angular line** (19.x = Angular 19, 20.x = Angular 20, 21.x = Angular 21) — **KHÔNG** dùng để báo breaking. Mỗi release publish đồng thời 3 major cùng nội dung feature, chỉ khác Angular shim.

- Luôn pin theo Angular line của bạn: `npm i @sdcorejs/angular@^19` (hoặc `@^20` / `@^21`).
- Breaking change được ghi rõ ở `CHANGELOG.md`, mục **Changed (BREAKING for consumers)**, kèm migration.

---

## QA / E2E

Core UI components expose runtime state via lowercase `data-*` attributes for e2e selectors. The full catalog, component matrix, selector cookbook, and YAML schema for AI agents live in `docs/E2E-ATTRIBUTES.md` in the source repository.

---

## License

MIT - see the LICENSE file.
