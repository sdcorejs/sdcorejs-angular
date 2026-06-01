# @sdcorejs/angular

<p align="center">
  <b>Enterprise-grade Angular UI library — components, forms, services, and modules built for real business apps.</b>
</p>

<p align="center">
  Angular 19 / 20 / 21 • Standalone • Signal-first • OnPush by default • i18n-ready
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
  <a href="https://sdcorejs.github.io/sdcorejs-angular/">Showcase</a>
  ·
  <a href="https://sdcorejs.github.io/portal-template">Storybook</a>
</p>

---

## ✨ Features

* ✅ 30+ standalone components (table, modal, query-builder, document-builder, …)
* ✅ 14 form controls with `[(model)]` + FormGroup support, async validators, custom templates
* ✅ 9 services (notify, confirm, excel, docx, api interceptor, storage, …)
* ✅ Auth + Keycloak + permission modules ready out-of-the-box
* ✅ Signal-first reactivity, OnPush default
* ✅ i18n — built-in Vietnamese / English; `Language` type also declares `ja` / `ko` / `zh`; extensible to any locale
* ✅ Material 19/20/21 compatible — single package, multi-major peer range
* ✅ Tree-shakable subpath exports (per-component, per-form-control)
* ✅ Type-safe end-to-end (`NestedKeyOf<T>`, `Filter<T>`, `Color`, `Size`, …)
* ✅ AI-friendly semantic naming + per-component md docs

---

## 📦 Installation

```bash
npm install @sdcorejs/angular @angular/material @angular/material-date-fns-adapter
```

`@sdcorejs/utils` ships as a regular dependency — it installs automatically, no need to add it yourself.

**Peer ranges**: `@angular/{common,core,material}` + `@angular/material-date-fns-adapter` `^19.0.0 || ^20.0.0 || ^21.0.0`. Choose the matching `@sdcorejs/angular` version: `19.x.y` for Angular 19, `20.x.y` for Angular 20, `21.x.y` for Angular 21.

```bash
# Angular 19
npm install @sdcorejs/angular@^19

# Angular 20
npm install @sdcorejs/angular@^20

# Angular 21
npm install @sdcorejs/angular@^21
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
| Data | `table` · `query-bar` · `query-builder` · `preview` · `history` |
| Editor | `editor` · `mini-editor` · `code-editor` · `document-builder` |
| Workflow | `form-generic` · `upload-file` · `import-excel` |

**Table highlights**: server/local mode · paginate · sort · column filter · external filter · row selection (single/multi/preserve cross-page) · row reorder · row group (collapsible, select-all-in-group, sdTableGroupDef template) · tree rows (hierarchical STT 1/1.1/1.2.1) · expandable sub-info · custom cell template · footer aggregation · export Excel/CSV.

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

`auth` · `authom` · `keycloak` · `permission` · `layout` (sidebar/header/main) · `generic` (list + form scaffold)

---

## 🏗 Multi-version (Angular 19 / 20 / 21)

| Angular | Install | Status |
| --- | --- | --- |
| 19.x | `npm install @sdcorejs/angular@^19` | Stable |
| 20.x | `npm install @sdcorejs/angular@^20` | Stable |
| 21.x | `npm install @sdcorejs/angular@^21` | Stable |

Same source, same API surface — peer dependency major chỉ khác Angular major. CI matrix `publish-npm.yml` đảm bảo 3 phiên bản luôn ngang nhau về tính năng.

---

## 🎨 Theming

Sử dụng SCSS tokens + Material theme. Override qua CSS variables:

```scss
:root {
  --sd-color-primary: #1f6feb;
  --sd-color-success: #1f7a3e;
  --sd-color-error: #b32626;
}
```

Bundled palette: `primary` · `secondary` · `success` · `info` · `warning` · `error` + `*-light` tint variants.

---

## 🌍 i18n

```ts
inject(I18nService).setLanguage('en');
// Supported: 'vi', 'en', 'ja', 'ko', 'zh'
```

Custom keys: dùng `TranslatePipe` (`{{ 'my.key' | translate }}`) hoặc service trực tiếp.

---

## 🏗 Repository Layout

This repo is the **multi-version publish mirror**. Code lives upstream in `vn-angular` workspace.

```
sdcorejs-angular/
├── versions/v19/   ← canonical sync from vn-angular (Angular 19)
├── versions/v20/   ← derived workspace (Angular 20)
├── versions/v21/   ← derived workspace (Angular 21)
└── scripts/        ← sync + deploy PowerShell scripts
```

Push tag `v<patch>` → GitHub Actions publishes `19.<patch>` + `20.<patch>` + `21.<patch>` in parallel. See `.github/workflows/publish-npm.yml`.

Push to default branch → showcase auto-deploys to GitHub Pages via `.github/workflows/deploy-pages.yml`.

---

## 🚀 Publishing

```bash
# tag stable 19.0.0 / 20.0.0 / 21.0.0
git tag v0.0
git push origin v0.0

# tag beta
git tag v0.0-beta.1
git push origin v0.0-beta.1
```

Required secret: `NPM_TOKEN` (repo Settings > Secrets > Actions).

For local debug: `scripts/deploy.ps1 -PatchVersion "0.5" -DryRun` (see `CLAUDE.md`).

---

## 🌐 Ecosystem

* [`@sdcorejs/utils`](https://www.npmjs.com/package/@sdcorejs/utils) — framework-agnostic TypeScript utilities (models, constants, fns)
* `@sdcorejs/angular` — Angular UI library (this package)
* `@sdcorejs/nestjs` — NestJS backend toolkit (coming soon)

---

## 📄 License

MIT
