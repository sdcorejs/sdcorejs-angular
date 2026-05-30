�# @sdcorejs/angular

> **VI** � Thư vi�!n UI n�"i b�" xây dựng trên Angular Material, h� trợ Angular 19+  
> **EN** � Internal UI component library built on Angular Material, supporting Angular 19+

[![Version](https://img.shields.io/badge/version-19.0.0--beta.47-blue)](./package.json)
[![Angular](https://img.shields.io/badge/Angular-19%2B-red)](https://angular.dev)
[![Angular Material](https://img.shields.io/badge/Angular_Material-19%2B-purple)](https://material.angular.io)

---

## Table of Contents / Mục lục

- [Getting Started / Cài �ặt](#getting-started--cài-�ặt)
- [Theming / SCSS Customization](#theming--scss-customization)
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
- [Contributing Guide / Hư�:ng dẫn �óng góp](#contributing-guide--hư�:ng-dẫn-�óng-góp)

---

## Getting Started / Cài �ặt

### Prerequisites / Yêu cầu

| Dependency | Version |
|---|---|
| `@angular/core` | `^19.0.0 \|\| ^20.0.0 \|\| ^21.0.0` |
| `@angular/material` | `^19.0.0 \|\| ^20.0.0 \|\| ^21.0.0` |
| `@angular/material-date-fns-adapter` | `^19.0.0 \|\| ^20.0.0 \|\| ^21.0.0` |
| `date-fns` | `^3 \|\| ^4` |

### Installation / Cài �ặt

```bash
npm install @sdcorejs/angular
```

### Setup

**1. Import global styles / Import style toàn cục**

Thêm vào `angular.json` (hoặc `styles.scss` của app):

```json
// angular.json
{
  "styles": [
    "node_modules/@sdcorejs/angular/assets/scss/sd-core.scss"
  ]
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

### CSS Variables

`@sdcorejs/angular` sử dụng CSS custom properties (variables) �Ồ quản lý màu sắc. M�i màu �ược expose dư�:i dạng `--sd-<color>`.

**Available color tokens / Các biến màu sắc:**

| Variable | Default | Description |
|---|---|---|
| `--sd-primary` | `#2A66F4` | Màu chính |
| `--sd-primary-light` | `#EAF1FF` | Màu chính nhạt |
| `--sd-primary-dark` | `#1C4AD9` | Màu chính �ậm |
| `--sd-secondary` | `#212121` | Màu phụ |
| `--sd-secondary-light` | `#E9E9E9` | Màu phụ nhạt |
| `--sd-success` | `#4CAF50` | Thành công |
| `--sd-success-light` | `#DBEFDC` | Thành công nhạt |
| `--sd-warning` | `#FF9600` | Cảnh báo |
| `--sd-warning-light` | `#FFEACC` | Cảnh báo nhạt |
| `--sd-error` | `#F82C13` | L�i |
| `--sd-error-light` | `#FED5D0` | L�i nhạt |
| `--sd-info` | `#2962FF` | Thông tin |
| `--sd-info-light` | `#E7E9FF` | Thông tin nhạt |
| `--sd-black500` | `#212121` | Xám �ậm nhất |
| `--sd-black400` | `#757575` | Xám �ậm |
| `--sd-black300` | `#BFBFBF` | Xám trung |
| `--sd-black200` | `#E6E6E6` | Xám nhạt |
| `--sd-black100` | `#F2F2F2` | Xám nhạt nhất |

### Custom Theme / Tuỳ ch�0nh theme

Ghi �è theme mặc ��9nh bằng cách truyền map SCSS vào mixin `theme()`:

```scss
// styles.scss
@use '@sdcorejs/angular/assets/scss/themes/default' as default;

html {
  @include default.theme((
    primary: #7C3AED,
    primary-light: #EDE9FE,
    primary-dark: #5B21B6,
    success: #10B981,
    error: #EF4444,
  ));
}
```

Ch�0 cần override các màu mu�n thay ��"i � các màu còn lại giữ nguyên giá tr�9 mặc ��9nh.

### Utility Classes / Các class ti�!n ích

Thư vi�!n cung cấp sẵn các utility class:

```html
<!-- Text color -->
<span class="text-primary">Text màu primary</span>
<span class="text-error">Text màu error</span>

<!-- Background -->
<div class="bg-primary-light">Background nhạt</div>

<!-- Spacing (�ơn v�9 px, từ 0�200) -->
<div class="mt-16 mb-8 px-24">margin-top: 16px, padding: 0 24px</div>

<!-- Gap -->
<div class="d-flex gap-8">gap: 8px</div>

<!-- Grid -->
<div class="sd-grid-container grid-cols-3">
  <div class="col-span-2">Chiếm 2 c�"t</div>
  <div class="col-span-1">Chiếm 1 c�"t</div>
</div>

<!-- Bootstrap grid -->
<div class="row">
  <div class="col-6">50%</div>
  <div class="col-6">50%</div>
</div>
```

---

## Components

> Tất cả component �ều là **standalone** và sử dụng **Angular Signals** API.  
> All components are **standalone** and use **Angular Signals** API.

### SdButton

```typescript
import { SdButton } from '@sdcorejs/angular/components/button';
```

**Inputs:**

| Input | Type | Default | Description |
|---|---|---|---|
| `type` | `'fill' \| 'light' \| 'outline' \| 'link'` | `'light'` | KiỒu nút |
| `color` | `Color` | `'secondary'` | Màu sắc |
| `size` | `'sm' \| 'md' \| 'lg'` | `'sm'` | Kích thư�:c |
| `title` | `string` | � | Nhãn nút |
| `prefixIcon` | `string` | � | Icon Material trư�:c text |
| `suffixIcon` | `string` | � | Icon Material sau text |
| `disabled` | `boolean` | `false` | Vô hi�!u hoá |
| `loading` | `boolean` | `false` | Trạng thái loading (tự chặn click) |
| `tooltip` | `string` | � | Tooltip khi hover |
| `width` | `string` | � | CSS width tuỳ ch�0nh |

**Output:** `(click): EventEmitter<Event>` � có throttle 300ms, tự chặn khi `disabled` hoặc `loading`.

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

| Input | Type | Default | Description |
|---|---|---|---|
| `type` | `'tag' \| 'round' \| 'icon'` | `'icon'` | KiỒu badge |
| `color` | `Color` | `'secondary'` | Màu sắc |
| `title` | `string \| number` | � | N�"i dung hiỒn th�9 |
| `icon` | `string` | � | Icon Material |
| `size` | `Size` | `'sm'` | Kích thư�:c |
| `tooltip` | `string` | � | Tooltip |

Shorthand color inputs (boolean): `primary`, `secondary`, `success`, `info`, `warning`, `error`.

```html
<sd-badge type="tag" color="success" title="Hoạt ��"ng" />
<sd-badge type="round" [warning]="true" title="Chờ duy�!t" />
<sd-badge type="icon" color="error" icon="close" title="Từ ch�i" />
```

---

### SdSection

```typescript
import { SdSection } from '@sdcorejs/angular/components/section';
```

**Inputs:**

| Input | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | *required* | Tiêu �ề section |
| `subTitle` | `string` | � | Tiêu �ề phụ |
| `icon` | `string` | � | Icon Material |
| `iconColor` | `Color` | `'primary'` | Màu icon |
| `collapsable` | `boolean` | `false` | Cho phép thu gọn |
| `collapsed` | `boolean` | `false` | Trạng thái ban �ầu thu gọn |
| `hideHeader` | `boolean` | `false` | Ẩn phần header |

```html
<sd-section title="Thông tin cơ bản" icon="person" iconColor="primary">
  <!-- n�"i dung -->
</sd-section>

<sd-section title="Cài �ặt nâng cao" icon="settings" collapsable [collapsed]="true">
  <!-- n�"i dung ẩn mặc ��9nh -->
</sd-section>
```

---

### SdModal

```typescript
import { SdModal } from '@sdcorejs/angular/components/modal';
```

**Inputs:**

| Input | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | � | Tiêu �ề modal |
| `color` | `Color` | `'primary'` | Màu header |
| `width` | `'sx' \| 'sm' \| 'md' \| 'lg' \| string` | `'md'` | Đ�" r�"ng (md = 60vw) |
| `height` | `string` | `'auto'` | Chiều cao |
| `view` | `'dialog' \| 'bottom-sheet'` | auto | Tự ��"ng bottom-sheet trên mobile |
| `lazyLoadContent` | `boolean` | `true` | Lazy render n�"i dung |

**Output:** `(sdClosed): EventEmitter` � phát ra khi modal �óng.

**Methods** (dùng qua `@ViewChild`):
- `modal.open()` � m�x modal
- `modal.close()` � �óng modal

> �a�️ N�"i dung modal phải �ặt trong `<ng-template>`.

```html
<sd-modal #myModal title="Thêm m�:i" width="md" (sdClosed)="onClosed()">
  <ng-template>
    <div class="modal-body p-16">
      <!-- n�"i dung form -->
    </div>
    <div class="modal-footer d-flex justify-content-end gap-8 p-16">
      <sd-button title="Huỷ" (click)="myModal.close()" />
      <sd-button type="fill" color="primary" title="Lưu" (click)="onSave()" />
    </div>
  </ng-template>
</sd-modal>

<sd-button title="M�x modal" prefixIcon="add" (click)="myModal.open()" />
```

---

### SdTable

```typescript
import { SdTable } from '@sdcorejs/angular/components/table';
import type { SdTableOption, SdTableColumn } from '@sdcorejs/angular/components/table';
```

SdTable nhận m�"t object `option` duy nhất kiỒu `SdTableOption<T>`.

**Column types / KiỒu c�"t:**

| `type` | Mô tả |
|---|---|
| `'string'` | VĒn bản |
| `'number'` | S� (tự format) |
| `'boolean'` | True/False |
| `'date'` | Ngày |
| `'datetime'` | Ngày giờ |
| `'time'` | Giờ |
| `'values'` | Enum từ danh sách c� ��9nh |
| `'lazy-values'` | Enum load async |
| `'children'` | C�"t nhóm (multi-header) |

**Local table:**

```typescript
option: SdTableOption<Product> = {
  type: 'local',
  items: () => this.products,
  columns: [
    { field: 'code',  type: 'string',  title: 'Mã',        width: '120px' },
    { field: 'name',  type: 'string',  title: 'Tên',        sortable: true },
    { field: 'price', type: 'number',  title: 'Đơn giá',    align: 'right' },
    { field: 'active', type: 'boolean', title: 'Kích hoạt',
      useBadge: (val) => ({ color: val ? 'success' : 'secondary', title: val ? 'Có' : 'Không' })
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
  columns: [...],
  command: {
    align: 'right',
    commands: [
      { icon: 'edit',   color: 'primary', title: 'Sửa',  click: (row) => this.onEdit(row) },
      { icon: 'delete', color: 'error',   title: 'Xoá',  click: (row) => this.onDelete(row) },
    ],
  },
};
```

```html
<sd-table #sdTable [option]="option" />
```

---

### SdAvatar

```typescript
import { SdAvatar } from '@sdcorejs/angular/components/avatar';
```

```html
<sd-avatar src="/api/avatar/123" name="Nguy�&n VĒn A" size="md" />
<sd-avatar name="NVA" color="primary" size="lg" />
```

---

### Other Components / Các component khác

| Component | Import | Mô tả |
|---|---|---|
| `SdTabRouter` | `@sdcorejs/angular/components/tab-router` | Tab navigation v�:i Angular Router |
| `SdSideDrawer` | `@sdcorejs/angular/components/side-drawer` | Drawer layout trái/phải |
| `SdUploadFile` | `@sdcorejs/angular/components/upload-file` | Upload file |
| `SdQuickAction` | `@sdcorejs/angular/components/quick-action` | Nút action dạng icon |
| `SdHistory` | `@sdcorejs/angular/components/history` | L�9ch sử thay ��"i |
| `SdImportExcel` | `@sdcorejs/angular/components/import-excel` | Wizard import Excel |
| `SdQueryBuilder` | `@sdcorejs/angular/components/query-builder` | Visual query builder |
| `SdCodeEditor` | `@sdcorejs/angular/components/code-editor` | Code editor (PrismJS) |
| `SdMiniEditor` | `@sdcorejs/angular/components/mini-editor` | Rich text editor nhỏ |
| `SdDocumentBuilder` | `@sdcorejs/angular/components/document-builder` | Document builder |
| `SdAnchorMain` | `@sdcorejs/angular/components/anchor` | Anchor / mục lục cu�"n trang |
| `SdView` | `@sdcorejs/angular/components/view` | View wrapper read-only |

---

## Form Components

```typescript
import {
  SdInput,        // Text input
  SdInputNumber,  // Number input
  SdSelect,       // Dropdown
  SdAutocomplete, // Autocomplete
  SdDate,         // Date picker
  SdSearch,       // Search v�:i debounce
} from '@sdcorejs/angular/forms';
```

```html
<sd-input [(ngModel)]="form.name" label="Họ tên" [required]="true" />

<sd-input-number [(ngModel)]="form.price" label="Đơn giá" [min]="0" suffix="VNĐ" />

<sd-select [(ngModel)]="form.status" label="Trạng thái"
  [items]="statusList" valueField="value" displayField="label" />

<sd-date [(ngModel)]="form.birthday" label="Ngày sinh" />
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
    { value: 'ACTIVE',   label: 'Hoạt ��"ng' },
    { value: 'INACTIVE', label: 'Dừng' },
  ];

  option!: SdTableOption<Product>;

  constructor(private service: ProductService) {}

  ngOnInit() {
    this.option = {
      type: 'server',
      items: async (filter, paging) => this.service.search(filter, paging),
      columns: [
        { field: 'code',  type: 'string', title: 'Mã',      width: '120px' },
        { field: 'name',  type: 'string', title: 'Tên',      sortable: true },
        { field: 'price', type: 'number', title: 'Đơn giá',  align: 'right' },
        {
          field: 'status', type: 'values', title: 'Trạng thái',
          option: { items: this.STATUS_LIST, valueField: 'value', displayField: 'label' },
          useBadge: (val) => ({
            color: val === 'ACTIVE' ? 'success' : 'secondary',
            title: this.STATUS_LIST.find(s => s.value === val)?.label,
          }),
        },
      ],
      command: {
        align: 'right',
        commands: [
          { icon: 'edit',   color: 'primary', title: 'Sửa',  click: (row) => this.openForm(row) },
          { icon: 'delete', color: 'error',   title: 'Xoá',  click: (row) => this.onDelete(row) },
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
  <sd-button type="fill" color="primary" title="Thêm m�:i"
    prefixIcon="add" (click)="openForm()" />
</div>

<sd-table #sdTable [option]="option" />

<sd-modal #formModal [title]="selectedItem ? 'Ch�0nh sửa' : 'Thêm m�:i'" width="md">
  <ng-template>
    <div class="modal-body p-16">
      <sd-section title="Thông tin sản phẩm" icon="inventory">
        <div class="row">
          <div class="col-6">
            <sd-input [(ngModel)]="formData.code" label="Mã" [required]="true" />
          </div>
          <div class="col-6">
            <sd-select [(ngModel)]="formData.status" label="Trạng thái"
              [items]="STATUS_LIST" valueField="value" displayField="label" />
          </div>
          <div class="col-12">
            <sd-input [(ngModel)]="formData.name" label="Tên sản phẩm" [required]="true" />
          </div>
          <div class="col-6">
            <sd-input-number [(ngModel)]="formData.price" label="Đơn giá" suffix="VNĐ" />
          </div>
        </div>
      </sd-section>
    </div>
    <div class="modal-footer d-flex justify-content-end gap-8 p-16">
      <sd-button title="Huỷ" (click)="formModal.close()" />
      <sd-button type="fill" color="primary" title="Lưu"
        prefixIcon="save" [loading]="isSaving()" (click)="onSave()" />
    </div>
  </ng-template>
</sd-modal>
```

---

## Contributing Guide / Hư�:ng dẫn �óng góp

### Cấu trúc thư vi�!n / Project structure

```
sd-angular/
�S���� src/
�   ����� public-api.ts           # Entry point chính
�S���� assets/
�   ����� scss/
�       �S���� sd-core.scss        # SCSS entry (import vào app)
�       �S���� core/               # Base utilities (color, grid, form, ...)
�       ����� themes/             # Theme mặc ��9nh + Material theme
�S���� components/                 # UI Components
�   �S���� button/
�   �S���� table/
�   �S���� modal/
�   ����� ...
�S���� forms/                      # Form components
�   �S���� input/
�   �S���� select/
�   ����� ...
�S���� directives/                 # Angular directives
�S���� pipes/                      # Angular pipes
�S���� services/                   # Shared services
�S���� utilities/                  # Types, models, helpers
����� modules/                    # Feature modules (layout, permission, ...)
```

### Thêm component m�:i / Adding a new component

**1. Tạo thư mục component:**

```
components/
����� my-component/
    �S���� index.ts                         # Export public API
    �S���� ng-package.json                  # ng-packagr entry
    ����� src/
        �S���� my-component.component.ts
        �S���� my-component.component.html
        ����� my-component.component.scss
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
  styleUrls: ['./my-component.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [],
})
export class SdMyComponent extends SdBaseSecureComponent {
  color = input<Color, Color | undefined | null>('primary', {
    transform: (value) => value || 'primary',
  });

  title = input<string | undefined | null>(undefined);
}
```

**5. Export từ `components/index.ts`:**

```typescript
// components/index.ts
export * from '@sdcorejs/angular/components/my-component';
```

### Quy ư�:c / Conventions

| Mục | Quy ư�:c |
|---|---|
| Selector | `sd-<tên-component>` |
| Class name | `Sd<TênComponent>` (Pascal) |
| Input | Dùng `input<T>()` signal, **không** dùng `@Input()` decorator |
| Null safety | Input transform phải handle `null/undefined` |
| Base class | Extend `SdBaseSecureComponent` cho component có permission |
| Change detection | Luôn dùng `ChangeDetectionStrategy.OnPush` |
| Standalone | Luôn `standalone: true` |
| Colors | Dùng `Color` type, không hardcode màu |

### Build

```bash
# Build toàn b�" thư vi�!n
ng-packagr -p ng-package.json

# Watch mode
ng-packagr -p ng-package.json --watch
```

### Versioning

Thư vi�!n tuân theo [Semantic Versioning](https://semver.org):

- `MAJOR` � Breaking changes (thay ��"i API không tương thích)
- `MINOR` � Tính nĒng m�:i (tương thích ngược)
- `PATCH` � Bug fixes

---

## QA / E2E

Core UI components expose runtime state via lowercase `data-*` attributes. See [`docs/E2E-ATTRIBUTES.md`](docs/E2E-ATTRIBUTES.md) for the full catalog, component matrix, selector cookbook, and YAML schema for AI agents.

---

## License

Internal use only � © SD Team
