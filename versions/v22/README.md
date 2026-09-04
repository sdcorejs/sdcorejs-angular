# @sdcorejs/angular

<p align="center">
  <b>Enterprise-grade Angular UI library — components, forms, services, and modules built for real business apps.</b>
</p>

<p align="center">
  Angular 19 / 20 / 21 / 22 • Standalone • Signal-first • OnPush by default • i18n-ready
</p>

<p align="center">

  <a href="https://www.npmjs.com/package/@sdcorejs/angular">
    <img src="https://img.shields.io/npm/v/@sdcorejs/angular.svg" alt="npm version" />
  </a>

  <a href="https://www.npmjs.com/package/@sdcorejs/angular">
    <img src="https://img.shields.io/npm/dm/@sdcorejs/angular.svg" alt="npm downloads" />
  </a>

  <a href="https://github.com/sdcorejs/sdcorejs-angular/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/sdcorejs/sdcorejs-angular/publish-npm.yml" alt="build status" />
  </a>

  <a href="https://github.com/sdcorejs/sdcorejs-angular/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/sdcorejs/sdcorejs-angular" alt="license" />
  </a>

  <a href="https://bundlephobia.com/package/@sdcorejs/angular">
    <img src="https://img.shields.io/bundlephobia/minzip/@sdcorejs/angular" alt="bundle size" />
  </a>

  <a href="https://www.npmjs.com/package/@sdcorejs/angular">
    <img src="https://img.shields.io/npm/types/@sdcorejs/angular" alt="types included" />
  </a>

</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@sdcorejs/angular">npm</a>
  ·
  <a href="https://github.com/sdcorejs/sdcorejs-angular">GitHub</a>
  ·
  <a href="https://sdcorejs.github.io/sdcorejs-angular/">Live Showcase</a>
</p>

> **Note**: `versions/v19` is the canonical source workspace in [`sdcorejs/sdcorejs-angular`](https://github.com/sdcorejs/sdcorejs-angular). Shared library code, tests and package documentation start here, then the root sync derives v20, v21 and v22; the standalone showcase lives at repository root. End users should consume the npm package, not a workspace checkout.

---

## ✨ Features

* ✅ 30+ standalone components (table, modal, query-builder, document-builder, …)
* ✅ 14 form controls with `[(model)]` + FormGroup support, async validators, custom templates
* ✅ 9 services (notify, confirm, excel, docx, api interceptor, storage, …)
* ✅ Auth + Keycloak + permission modules ready out-of-the-box
* ✅ Signal-first reactivity, OnPush default
* ✅ i18n bilingual (Vietnamese / English) — extensible to any locale
* ✅ Material 19/20/21/22 compatible — one package name with Angular-aligned version lines
* ✅ Tree-shakable subpath exports (per-component, per-form-control)
* ✅ Type-safe end-to-end (`NestedKeyOf<T>`, `Filter<T>`, `Color`, `Size`, …)
* ✅ AI-friendly semantic naming + per-component md docs

---

## 📦 Installation

```bash
npm install @sdcorejs/angular @sdcorejs/utils @angular/material @angular/material-date-fns-adapter
```

**Peer ranges**: package lines 19–21 keep `@angular/* ^19.0.0 || ^20.0.0 || ^21.0.0`; package line 22 accepts Angular peers `^22.0.0` only. Choose the matching `@sdcorejs/angular` major. Angular 22 begins at `22.2.5`; there is no earlier v22 package history.

```bash
# Angular 19
npm install @sdcorejs/angular@^19

# Angular 20
npm install @sdcorejs/angular@^20

# Angular 21
npm install @sdcorejs/angular@^21

# Angular 22
npm install @sdcorejs/angular@^22
```

Import the global stylesheet once in `styles.scss`:
```scss
@use '@sdcorejs/angular/assets/scss/sd-core.scss';
```

---

## 🚀 Quick Examples

### Button

```html
<sd-button type="fill" color="primary" title="Lưu" (click)="save()"></sd-button>
<sd-button type="light" color="success" prefixIcon="check" title="Duyệt"></sd-button>
```

### Badge

```html
<sd-badge type="round" success title="Đang hoạt động"></sd-badge>
<sd-badge type="tag" info icon="label" title="Hợp đồng dài hạn" size="md"></sd-badge>
```

### Form Input + Validator

```html
<sd-input
  label="Email"
  type="email"
  [(model)]="email"
  [form]="form"
  required
  pattern="EMAIL">
</sd-input>
```

### Data Table

```ts
opt: SdTableOption<Employee> = {
  type: 'local',
  items: () => EMPLOYEES,
  selector: { visible: true, preserveSelection: true },
  paginate: { pageSize: 10, pages: [10, 25, 50] },
  sort: { enable: true },
  index: { enabled: true },
  filler: { enabled: true },
  group: { fields: ['department'], collapsible: true },
  columns: [
    { field: 'name', type: 'string', title: 'Họ tên', width: '200px', sortable: true },
    { field: 'salary', type: 'number', title: 'Lương', width: '140px', align: 'right' },
    { field: 'status', type: 'values', title: 'Trạng thái',
      option: { items: STATUS_OPTIONS, valueField: 'value', displayField: 'display' },
      useBadge: v => v === 'ACTIVE' ? { title: 'Hoạt động', color: 'success' } : { title: 'Đã nghỉ', color: 'error' } },
  ],
};
```

```html
<sd-table [option]="opt">
  <ng-template sdTableGroupDef let-values let-data>
    <b>Phòng {{ values['department'] }}</b> · {{ data.length }} người
  </ng-template>
</sd-table>
```

---

## 📚 Subpath Exports

```ts
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdTable, SdTableOption, SdTableGroupDefDirective } from '@sdcorejs/angular/components/table';
import { SdTree, SdTreeComponentOption } from '@sdcorejs/angular/components/tree';
import { SdOrgChart } from '@sdcorejs/angular/components/org-chart';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdNotifyService } from '@sdcorejs/angular/services';
import { SdAuthService } from '@sdcorejs/angular/modules/auth';
```

Mỗi component / form control / service / module là 1 entry point độc lập — tree-shaking optimal, không kéo theo cả lib.

---

## 🧩 Catalog

### Components (30+)

| Group | Items |
| --- | --- |
| Display | `badge` · `avatar` · `chart` · `section` · `view` · `inform` |
| Action | `button` · `quick-action` · `operator` |
| Layout | `splitter` · `side-drawer` · `tab` · `tab-router` · `stepper` · `modal` · `anchor` |
| Data | `table` · `tree` · `org-chart` · `query-bar` · `query-builder` · `preview` · `history` |
| Editor | `editor` · `mini-editor` · `code-editor` · `document-builder` |
| Workflow | `form-generic` · `upload-file` · `import-excel` |

**Table highlights**: server/local mode · paginate · sort · column filter · external filter · row selection (single/multi/preserve cross-page) · row reorder · row group (collapsible, select-all-in-group, sdTableGroupDef template) · tree rows (hierarchical STT 1/1.1/1.2.1) · expandable sub-info · custom cell template · footer aggregation · export Excel/CSV.

**Tree highlights**: static/lazy loading · lazy child spinner · signal/array/function item sources · manual `reload()` · accent-insensitive `filter(searchText)` · multi-select quick action · row command menu · `sdTreeItemDef` custom item template.

### Forms (14)

`autocomplete` · `checkbox` · `chip` · `chip-calendar` · `date` · `date-range` · `datetime` · `input` · `input-color` · `input-number` · `label` · `radio` · `select` · `switch` · `textarea`

Tất cả hỗ trợ `[(model)]` + `[form]` (FormGroup) + `required`/`pattern`/custom validators + `disabled`/`readonly`/`viewed` + size `sm`/`md`/`lg` + inline clear (X).

### Services (9)

| Service | Purpose |
| --- | --- |
| `notify` | Toast notifications (success/info/warning/error, i18n) |
| `confirm` | Confirm/prompt dialogs (with input / radio variants) |
| `loading` | Full-page / target / manual loading overlay |
| `excel` | Export, import, parse, generate-template (no exceljs in consumer bundle) |
| `docx` | DOCX render + convert to HTML |
| `storage` | Typed local/session storage with prefix + default + observer |
| `cache` | Reactive in-memory cache with TTL |
| `api` | HTTP client wrapper + interceptors |
| `license` | License/feature flag gate |

### Modules

`auth` · `keycloak` · `permission` · `layout` (sidebar/header/main) · `generic` (list + form scaffold)

---

## 🏗 Multi-version (Angular 19 / 20 / 21 / 22)

| Angular | Install | Status |
| --- | --- | --- |
| 19.x | `npm install @sdcorejs/angular@^19` | Stable |
| 20.x | `npm install @sdcorejs/angular@^20` | Stable |
| 21.x | `npm install @sdcorejs/angular@^21` | Stable |
| 22.x | `npm install @sdcorejs/angular@^22` | Stable from `22.2.5` |

Same canonical source, same public API surface — dependency/peer major và shim chỉ khác theo Angular major. Sync pipeline giữ bốn line ngang nhau về tính năng từ v22 inception suffix `2.5`.

---

## 🎨 Theming

Sử dụng SCSS tokens + Angular Material M3 theme/token system (`mat.theme`). Override semantic tokens qua CSS variables và ưu tiên đọc `--mat-sys-*` cho style liên quan Angular Material:

```scss
:root {
  --sd-primary: #1f6feb;
  --sd-success: #1f7a3e;
  --sd-error: #b32626;
}

.app-link {
  color: var(--mat-sys-primary);
  outline-color: var(--mat-sys-outline);
}
```

Bundled palette: `primary` · `secondary` · `success` · `info` · `warning` · `error` + `*-light` tint variants.

---

## 🌍 i18n

```ts
inject(SdI18nService).setLanguage('en');
// Supported: 'vi', 'en', 'ja', 'ko', 'zh'
```

Custom keys: dùng `TranslatePipe` (`{{ 'my.key' | translate }}`) hoặc service trực tiếp.

---

## 🧪 Development

```bash
# From versions/v19, using exact Node 22.22.3:
npm ci --legacy-peer-deps
npm run test:ci          # full test suite (2700+ tests)
npm run build            # build the sd-angular library

# Showcase is a separate root workspace and consumes the built v19 library:
cd ../..
npm --prefix showcase ci --legacy-peer-deps
npm --prefix showcase run start
```

---

## 🚀 Publishing

Source workflow: shared changes land in `versions/v19`, then root `npm run sync` derives `v20` / `v21` / `v22`. Release builds use exact Node `22.22.3` with `npm ci --legacy-peer-deps` for v19–v21 and clean `npm ci` for v22. All four immutable tarballs are built and verified before one non-matrix publisher releases v19/v20/v21 sequentially under `angular19`/`angular20`/`angular21`, then v22 under `latest`. Release `v2.5` publishes `19.2.5`, `20.2.5`, `21.2.5`, and the v22 inception package `22.2.5`.

Publishing uses npm trusted publishing (OIDC) with exact `npm@11.5.1`; the workflow intentionally has no `NPM_TOKEN` or `NODE_AUTH_TOKEN` and never mutates dist-tags separately.

---

## 🌐 Ecosystem

* [`@sdcorejs/utils`](https://www.npmjs.com/package/@sdcorejs/utils) — framework-agnostic TypeScript utilities (models, constants, fns)
* `@sdcorejs/angular` — Angular UI library (this package)
* `@sdcorejs/nestjs` — NestJS backend toolkit (coming soon)

---

## 📄 License

MIT
