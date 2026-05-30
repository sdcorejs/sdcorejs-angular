# @sdcorejs/angular

> **VI** â€” ThÆ° viá»‡n UI ná»™i bá»™ xÃ¢y dá»±ng trÃªn Angular Material, há»— trá»£ Angular 19+  
> **EN** â€” Internal UI component library built on Angular Material, supporting Angular 19+

[![Version](https://img.shields.io/badge/version-19.0.0--beta.47-blue)](./package.json)
[![Angular](https://img.shields.io/badge/Angular-19%2B-red)](https://angular.dev)
[![Angular Material](https://img.shields.io/badge/Angular_Material-19%2B-purple)](https://material.angular.io)

---

## Table of Contents / Má»¥c lá»¥c

- [Getting Started / CÃ i Ä‘áº·t](#getting-started--cÃ i-Ä‘áº·t)
- [Theming / SCSS Customization](#theming--scss-customization)
- [Components](#components)
  - [SdButton](#sdbutton)
  - [SdBadge](#sdbadge)
  - [SdSection](#sdsection)
  - [SdModal](#sdmodal)
  - [SdTable](#sdtable)
  - [SdAvatar](#sdavatar)
  - [Other Components](#other-components--cÃ¡c-component-khÃ¡c)
- [Form Components](#form-components)
- [CRUD Patterns / Code máº«u CRUD](#crud-patterns--code-máº«u-crud)
- [Contributing Guide / HÆ°á»›ng dáº«n Ä‘Ã³ng gÃ³p](#contributing-guide--hÆ°á»›ng-dáº«n-Ä‘Ã³ng-gÃ³p)

---

## Getting Started / CÃ i Ä‘áº·t

### Prerequisites / YÃªu cáº§u

| Dependency | Version |
|---|---|
| `@angular/core` | `^19.0.0 \|\| ^20.0.0 \|\| ^21.0.0` |
| `@angular/material` | `^19.0.0 \|\| ^20.0.0 \|\| ^21.0.0` |
| `@angular/material-date-fns-adapter` | `^19.0.0 \|\| ^20.0.0 \|\| ^21.0.0` |
| `date-fns` | `^3 \|\| ^4` |

### Installation / CÃ i Ä‘áº·t

```bash
npm install @sdcorejs/angular
```

### Setup

**1. Import global styles / Import style toÃ n cá»¥c**

ThÃªm vÃ o `angular.json` (hoáº·c `styles.scss` cá»§a app):

```json
// angular.json
{
  "styles": [
    "node_modules/@sdcorejs/angular/assets/scss/sd-core.scss"
  ]
}
```

hoáº·c trong `styles.scss`:

```scss
@use '@sdcorejs/angular/assets/scss/sd-core';
```

**2. Import Material Icons font / Font icon**

ThÃªm vÃ o `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600&display=swap" rel="stylesheet" />
```

**3. Configure providers / Cáº¥u hÃ¬nh providers**

```typescript
// app.config.ts
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    // ... cÃ¡c providers khÃ¡c
  ],
};
```

---

## Theming / SCSS Customization

### CSS Variables

`@sdcorejs/angular` sá»­ dá»¥ng CSS custom properties (variables) Ä‘á»ƒ quáº£n lÃ½ mÃ u sáº¯c. Má»—i mÃ u Ä‘Æ°á»£c expose dÆ°á»›i dáº¡ng `--sd-<color>`.

**Available color tokens / CÃ¡c biáº¿n mÃ u sáº¯c:**

| Variable | Default | Description |
|---|---|---|
| `--sd-primary` | `#2A66F4` | MÃ u chÃ­nh |
| `--sd-primary-light` | `#EAF1FF` | MÃ u chÃ­nh nháº¡t |
| `--sd-primary-dark` | `#1C4AD9` | MÃ u chÃ­nh Ä‘áº­m |
| `--sd-secondary` | `#212121` | MÃ u phá»¥ |
| `--sd-secondary-light` | `#E9E9E9` | MÃ u phá»¥ nháº¡t |
| `--sd-success` | `#4CAF50` | ThÃ nh cÃ´ng |
| `--sd-success-light` | `#DBEFDC` | ThÃ nh cÃ´ng nháº¡t |
| `--sd-warning` | `#FF9600` | Cáº£nh bÃ¡o |
| `--sd-warning-light` | `#FFEACC` | Cáº£nh bÃ¡o nháº¡t |
| `--sd-error` | `#F82C13` | Lá»—i |
| `--sd-error-light` | `#FED5D0` | Lá»—i nháº¡t |
| `--sd-info` | `#2962FF` | ThÃ´ng tin |
| `--sd-info-light` | `#E7E9FF` | ThÃ´ng tin nháº¡t |
| `--sd-black500` | `#212121` | XÃ¡m Ä‘áº­m nháº¥t |
| `--sd-black400` | `#757575` | XÃ¡m Ä‘áº­m |
| `--sd-black300` | `#BFBFBF` | XÃ¡m trung |
| `--sd-black200` | `#E6E6E6` | XÃ¡m nháº¡t |
| `--sd-black100` | `#F2F2F2` | XÃ¡m nháº¡t nháº¥t |

### Custom Theme / Tuá»³ chá»‰nh theme

Ghi Ä‘Ã¨ theme máº·c Ä‘á»‹nh báº±ng cÃ¡ch truyá»n map SCSS vÃ o mixin `theme()`:

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

Chá»‰ cáº§n override cÃ¡c mÃ u muá»‘n thay Ä‘á»•i â€” cÃ¡c mÃ u cÃ²n láº¡i giá»¯ nguyÃªn giÃ¡ trá»‹ máº·c Ä‘á»‹nh.

### Utility Classes / CÃ¡c class tiá»‡n Ã­ch

ThÆ° viá»‡n cung cáº¥p sáºµn cÃ¡c utility class:

```html
<!-- Text color -->
<span class="text-primary">Text mÃ u primary</span>
<span class="text-error">Text mÃ u error</span>

<!-- Background -->
<div class="bg-primary-light">Background nháº¡t</div>

<!-- Spacing (Ä‘Æ¡n vá»‹ px, tá»« 0â€“200) -->
<div class="mt-16 mb-8 px-24">margin-top: 16px, padding: 0 24px</div>

<!-- Gap -->
<div class="d-flex gap-8">gap: 8px</div>

<!-- Grid -->
<div class="sd-grid-container grid-cols-3">
  <div class="col-span-2">Chiáº¿m 2 cá»™t</div>
  <div class="col-span-1">Chiáº¿m 1 cá»™t</div>
</div>

<!-- Bootstrap grid -->
<div class="row">
  <div class="col-6">50%</div>
  <div class="col-6">50%</div>
</div>
```

---

## Components

> Táº¥t cáº£ component Ä‘á»u lÃ  **standalone** vÃ  sá»­ dá»¥ng **Angular Signals** API.  
> All components are **standalone** and use **Angular Signals** API.

### SdButton

```typescript
import { SdButton } from '@sdcorejs/angular/components/button';
```

**Inputs:**

| Input | Type | Default | Description |
|---|---|---|---|
| `type` | `'fill' \| 'light' \| 'outline' \| 'link'` | `'light'` | Kiá»ƒu nÃºt |
| `color` | `Color` | `'secondary'` | MÃ u sáº¯c |
| `size` | `'sm' \| 'md' \| 'lg'` | `'sm'` | KÃ­ch thÆ°á»›c |
| `title` | `string` | â€” | NhÃ£n nÃºt |
| `prefixIcon` | `string` | â€” | Icon Material trÆ°á»›c text |
| `suffixIcon` | `string` | â€” | Icon Material sau text |
| `disabled` | `boolean` | `false` | VÃ´ hiá»‡u hoÃ¡ |
| `loading` | `boolean` | `false` | Tráº¡ng thÃ¡i loading (tá»± cháº·n click) |
| `tooltip` | `string` | â€” | Tooltip khi hover |
| `width` | `string` | â€” | CSS width tuá»³ chá»‰nh |

**Output:** `(click): EventEmitter<Event>` â€” cÃ³ throttle 300ms, tá»± cháº·n khi `disabled` hoáº·c `loading`.

```html
<sd-button type="fill" color="primary" title="LÆ°u" prefixIcon="save" (click)="onSave()" />
<sd-button type="outline" color="error" prefixIcon="delete" tooltip="XoÃ¡" />
<sd-button type="light" title="Huá»·" (click)="modal.close()" />
<sd-button type="fill" color="primary" title="Äang xá»­ lÃ½" [loading]="true" />
```

---

### SdBadge

```typescript
import { SdBadge } from '@sdcorejs/angular/components/badge';
```

**Inputs:**

| Input | Type | Default | Description |
|---|---|---|---|
| `type` | `'tag' \| 'round' \| 'icon'` | `'icon'` | Kiá»ƒu badge |
| `color` | `Color` | `'secondary'` | MÃ u sáº¯c |
| `title` | `string \| number` | â€” | Ná»™i dung hiá»ƒn thá»‹ |
| `icon` | `string` | â€” | Icon Material |
| `size` | `Size` | `'sm'` | KÃ­ch thÆ°á»›c |
| `tooltip` | `string` | â€” | Tooltip |

Shorthand color inputs (boolean): `primary`, `secondary`, `success`, `info`, `warning`, `error`.

```html
<sd-badge type="tag" color="success" title="Hoáº¡t Ä‘á»™ng" />
<sd-badge type="round" [warning]="true" title="Chá» duyá»‡t" />
<sd-badge type="icon" color="error" icon="close" title="Tá»« chá»‘i" />
```

---

### SdSection

```typescript
import { SdSection } from '@sdcorejs/angular/components/section';
```

**Inputs:**

| Input | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | *required* | TiÃªu Ä‘á» section |
| `subTitle` | `string` | â€” | TiÃªu Ä‘á» phá»¥ |
| `icon` | `string` | â€” | Icon Material |
| `iconColor` | `Color` | `'primary'` | MÃ u icon |
| `collapsable` | `boolean` | `false` | Cho phÃ©p thu gá»n |
| `collapsed` | `boolean` | `false` | Tráº¡ng thÃ¡i ban Ä‘áº§u thu gá»n |
| `hideHeader` | `boolean` | `false` | áº¨n pháº§n header |

```html
<sd-section title="ThÃ´ng tin cÆ¡ báº£n" icon="person" iconColor="primary">
  <!-- ná»™i dung -->
</sd-section>

<sd-section title="CÃ i Ä‘áº·t nÃ¢ng cao" icon="settings" collapsable [collapsed]="true">
  <!-- ná»™i dung áº©n máº·c Ä‘á»‹nh -->
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
| `title` | `string` | â€” | TiÃªu Ä‘á» modal |
| `color` | `Color` | `'primary'` | MÃ u header |
| `width` | `'sx' \| 'sm' \| 'md' \| 'lg' \| string` | `'md'` | Äá»™ rá»™ng (md = 60vw) |
| `height` | `string` | `'auto'` | Chiá»u cao |
| `view` | `'dialog' \| 'bottom-sheet'` | auto | Tá»± Ä‘á»™ng bottom-sheet trÃªn mobile |
| `lazyLoadContent` | `boolean` | `true` | Lazy render ná»™i dung |

**Output:** `(sdClosed): EventEmitter` â€” phÃ¡t ra khi modal Ä‘Ã³ng.

**Methods** (dÃ¹ng qua `@ViewChild`):
- `modal.open()` â€” má»Ÿ modal
- `modal.close()` â€” Ä‘Ã³ng modal

> âš ï¸ Ná»™i dung modal pháº£i Ä‘áº·t trong `<ng-template>`.

```html
<sd-modal #myModal title="ThÃªm má»›i" width="md" (sdClosed)="onClosed()">
  <ng-template>
    <div class="modal-body p-16">
      <!-- ná»™i dung form -->
    </div>
    <div class="modal-footer d-flex justify-content-end gap-8 p-16">
      <sd-button title="Huá»·" (click)="myModal.close()" />
      <sd-button type="fill" color="primary" title="LÆ°u" (click)="onSave()" />
    </div>
  </ng-template>
</sd-modal>

<sd-button title="Má»Ÿ modal" prefixIcon="add" (click)="myModal.open()" />
```

---

### SdTable

```typescript
import { SdTable } from '@sdcorejs/angular/components/table';
import type { SdTableOption, SdTableColumn } from '@sdcorejs/angular/components/table';
```

SdTable nháº­n má»™t object `option` duy nháº¥t kiá»ƒu `SdTableOption<T>`.

**Column types / Kiá»ƒu cá»™t:**

| `type` | MÃ´ táº£ |
|---|---|
| `'string'` | VÄƒn báº£n |
| `'number'` | Sá»‘ (tá»± format) |
| `'boolean'` | True/False |
| `'date'` | NgÃ y |
| `'datetime'` | NgÃ y giá» |
| `'time'` | Giá» |
| `'values'` | Enum tá»« danh sÃ¡ch cá»‘ Ä‘á»‹nh |
| `'lazy-values'` | Enum load async |
| `'children'` | Cá»™t nhÃ³m (multi-header) |

**Local table:**

```typescript
option: SdTableOption<Product> = {
  type: 'local',
  items: () => this.products,
  columns: [
    { field: 'code',  type: 'string',  title: 'MÃ£',        width: '120px' },
    { field: 'name',  type: 'string',  title: 'TÃªn',        sortable: true },
    { field: 'price', type: 'number',  title: 'ÄÆ¡n giÃ¡',    align: 'right' },
    { field: 'active', type: 'boolean', title: 'KÃ­ch hoáº¡t',
      useBadge: (val) => ({ color: val ? 'success' : 'secondary', title: val ? 'CÃ³' : 'KhÃ´ng' })
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
      { icon: 'edit',   color: 'primary', title: 'Sá»­a',  click: (row) => this.onEdit(row) },
      { icon: 'delete', color: 'error',   title: 'XoÃ¡',  click: (row) => this.onDelete(row) },
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
<sd-avatar src="/api/avatar/123" name="Nguyá»…n VÄƒn A" size="md" />
<sd-avatar name="NVA" color="primary" size="lg" />
```

---

### Other Components / CÃ¡c component khÃ¡c

| Component | Import | MÃ´ táº£ |
|---|---|---|
| `SdTabRouter` | `@sdcorejs/angular/components/tab-router` | Tab navigation vá»›i Angular Router |
| `SdSideDrawer` | `@sdcorejs/angular/components/side-drawer` | Drawer layout trÃ¡i/pháº£i |
| `SdUploadFile` | `@sdcorejs/angular/components/upload-file` | Upload file |
| `SdQuickAction` | `@sdcorejs/angular/components/quick-action` | NÃºt action dáº¡ng icon |
| `SdHistory` | `@sdcorejs/angular/components/history` | Lá»‹ch sá»­ thay Ä‘á»•i |
| `SdImportExcel` | `@sdcorejs/angular/components/import-excel` | Wizard import Excel |
| `SdQueryBuilder` | `@sdcorejs/angular/components/query-builder` | Visual query builder |
| `SdCodeEditor` | `@sdcorejs/angular/components/code-editor` | Code editor (PrismJS) |
| `SdMiniEditor` | `@sdcorejs/angular/components/mini-editor` | Rich text editor nhá» |
| `SdDocumentBuilder` | `@sdcorejs/angular/components/document-builder` | Document builder |
| `SdAnchorMain` | `@sdcorejs/angular/components/anchor` | Anchor / má»¥c lá»¥c cuá»™n trang |
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
  SdSearch,       // Search vá»›i debounce
} from '@sdcorejs/angular/forms';
```

```html
<sd-input [(ngModel)]="form.name" label="Há» tÃªn" [required]="true" />

<sd-input-number [(ngModel)]="form.price" label="ÄÆ¡n giÃ¡" [min]="0" suffix="VNÄ" />

<sd-select [(ngModel)]="form.status" label="Tráº¡ng thÃ¡i"
  [items]="statusList" valueField="value" displayField="label" />

<sd-date [(ngModel)]="form.birthday" label="NgÃ y sinh" />
```

---

## CRUD Patterns / Code máº«u CRUD

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
    { value: 'ACTIVE',   label: 'Hoáº¡t Ä‘á»™ng' },
    { value: 'INACTIVE', label: 'Dá»«ng' },
  ];

  option!: SdTableOption<Product>;

  constructor(private service: ProductService) {}

  ngOnInit() {
    this.option = {
      type: 'server',
      items: async (filter, paging) => this.service.search(filter, paging),
      columns: [
        { field: 'code',  type: 'string', title: 'MÃ£',      width: '120px' },
        { field: 'name',  type: 'string', title: 'TÃªn',      sortable: true },
        { field: 'price', type: 'number', title: 'ÄÆ¡n giÃ¡',  align: 'right' },
        {
          field: 'status', type: 'values', title: 'Tráº¡ng thÃ¡i',
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
          { icon: 'edit',   color: 'primary', title: 'Sá»­a',  click: (row) => this.openForm(row) },
          { icon: 'delete', color: 'error',   title: 'XoÃ¡',  click: (row) => this.onDelete(row) },
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
    if (!confirm(`XoÃ¡ "${item.name}"?`)) return;
    await this.service.delete(item.id);
    this.sdTable?.reload?.();
  }
}
```

### Template

```html
<!-- product-list.component.html -->
<div class="d-flex justify-content-between align-items-center mb-16">
  <h2>Danh sÃ¡ch sáº£n pháº©m</h2>
  <sd-button type="fill" color="primary" title="ThÃªm má»›i"
    prefixIcon="add" (click)="openForm()" />
</div>

<sd-table #sdTable [option]="option" />

<sd-modal #formModal [title]="selectedItem ? 'Chá»‰nh sá»­a' : 'ThÃªm má»›i'" width="md">
  <ng-template>
    <div class="modal-body p-16">
      <sd-section title="ThÃ´ng tin sáº£n pháº©m" icon="inventory">
        <div class="row">
          <div class="col-6">
            <sd-input [(ngModel)]="formData.code" label="MÃ£" [required]="true" />
          </div>
          <div class="col-6">
            <sd-select [(ngModel)]="formData.status" label="Tráº¡ng thÃ¡i"
              [items]="STATUS_LIST" valueField="value" displayField="label" />
          </div>
          <div class="col-12">
            <sd-input [(ngModel)]="formData.name" label="TÃªn sáº£n pháº©m" [required]="true" />
          </div>
          <div class="col-6">
            <sd-input-number [(ngModel)]="formData.price" label="ÄÆ¡n giÃ¡" suffix="VNÄ" />
          </div>
        </div>
      </sd-section>
    </div>
    <div class="modal-footer d-flex justify-content-end gap-8 p-16">
      <sd-button title="Huá»·" (click)="formModal.close()" />
      <sd-button type="fill" color="primary" title="LÆ°u"
        prefixIcon="save" [loading]="isSaving()" (click)="onSave()" />
    </div>
  </ng-template>
</sd-modal>
```

---

## Contributing Guide / HÆ°á»›ng dáº«n Ä‘Ã³ng gÃ³p

### Cáº¥u trÃºc thÆ° viá»‡n / Project structure

```
sd-angular/
â”œâ”€â”€ src/
â”‚   â””â”€â”€ public-api.ts           # Entry point chÃ­nh
â”œâ”€â”€ assets/
â”‚   â””â”€â”€ scss/
â”‚       â”œâ”€â”€ sd-core.scss        # SCSS entry (import vÃ o app)
â”‚       â”œâ”€â”€ core/               # Base utilities (color, grid, form, ...)
â”‚       â””â”€â”€ themes/             # Theme máº·c Ä‘á»‹nh + Material theme
â”œâ”€â”€ components/                 # UI Components
â”‚   â”œâ”€â”€ button/
â”‚   â”œâ”€â”€ table/
â”‚   â”œâ”€â”€ modal/
â”‚   â””â”€â”€ ...
â”œâ”€â”€ forms/                      # Form components
â”‚   â”œâ”€â”€ input/
â”‚   â”œâ”€â”€ select/
â”‚   â””â”€â”€ ...
â”œâ”€â”€ directives/                 # Angular directives
â”œâ”€â”€ pipes/                      # Angular pipes
â”œâ”€â”€ services/                   # Shared services
â”œâ”€â”€ utilities/                  # Types, models, helpers
â””â”€â”€ modules/                    # Feature modules (layout, permission, ...)
```

### ThÃªm component má»›i / Adding a new component

**1. Táº¡o thÆ° má»¥c component:**

```
components/
â””â”€â”€ my-component/
    â”œâ”€â”€ index.ts                         # Export public API
    â”œâ”€â”€ ng-package.json                  # ng-packagr entry
    â””â”€â”€ src/
        â”œâ”€â”€ my-component.component.ts
        â”œâ”€â”€ my-component.component.html
        â””â”€â”€ my-component.component.scss
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

**5. Export tá»« `components/index.ts`:**

```typescript
// components/index.ts
export * from '@sdcorejs/angular/components/my-component';
```

### Quy Æ°á»›c / Conventions

| Má»¥c | Quy Æ°á»›c |
|---|---|
| Selector | `sd-<tÃªn-component>` |
| Class name | `Sd<TÃªnComponent>` (Pascal) |
| Input | DÃ¹ng `input<T>()` signal, **khÃ´ng** dÃ¹ng `@Input()` decorator |
| Null safety | Input transform pháº£i handle `null/undefined` |
| Base class | Extend `SdBaseSecureComponent` cho component cÃ³ permission |
| Change detection | LuÃ´n dÃ¹ng `ChangeDetectionStrategy.OnPush` |
| Standalone | LuÃ´n `standalone: true` |
| Colors | DÃ¹ng `Color` type, khÃ´ng hardcode mÃ u |

### Build

```bash
# Build toÃ n bá»™ thÆ° viá»‡n
ng-packagr -p ng-package.json

# Watch mode
ng-packagr -p ng-package.json --watch
```

### Versioning

ThÆ° viá»‡n tuÃ¢n theo [Semantic Versioning](https://semver.org):

- `MAJOR` â€” Breaking changes (thay Ä‘á»•i API khÃ´ng tÆ°Æ¡ng thÃ­ch)
- `MINOR` â€” TÃ­nh nÄƒng má»›i (tÆ°Æ¡ng thÃ­ch ngÆ°á»£c)
- `PATCH` â€” Bug fixes

---

## QA / E2E

Core UI components expose runtime state via lowercase `data-*` attributes. See [`docs/E2E-ATTRIBUTES.md`](docs/E2E-ATTRIBUTES.md) for the full catalog, component matrix, selector cookbook, and YAML schema for AI agents.

---

## License

Internal use only â€” Â© SD Team
