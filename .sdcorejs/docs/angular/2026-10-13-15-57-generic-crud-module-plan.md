---
artifact_id: plan-draft-generic-crud-module-v1-r1
artifact_kind: execution-doc
change_ref: generic-crud-module-v1
source_spec: .sdcorejs/specs/angular/2026-10-13-09-59-generic-crud-module.md
source_architecture: .sdcorejs/architecture/angular/2026-10-13-10-42-generic-crud-module.md
source_plan: none
commit_policy: with-change
owner: sdcorejs-plan
---
# Plan - Module generic CRUD theo schema (SdGenericSchema) - 2026-10-13 15:57

- Approved spec: `.sdcorejs/specs/angular/2026-10-13-09-59-generic-crud-module.md` (`sha256:v1:6107bece2aded5c0256881ec0c82a0c7963313b49b3a3905b53f9f03b139f2cf`).
- Approved architecture: `.sdcorejs/architecture/angular/2026-10-13-10-42-generic-crud-module.md` (`sha256:v1:4f667e1902324667fcaa23af9af63914d4dfe0342faf9ed32c5a176afaedc99b`).

## Scope

Repo `sdcorejs-angular`, workspace chuẩn là `versions/v19`. Phạm vi:
- Thêm entry point `@sdcorejs/angular/modules/generic`, gồm adapter theo module, `SdGenericSchema`, các màn list/form/import/cấu hình, quyền và route.
- `form-generic` thêm field `time` và `json`.
- Kèm Showcase demo, docs, CHANGELOG `[Unreleased]`.
- v20/v21/v22 chỉ nhận thay đổi qua `npm run sync`.
- Không tag, không publish.

## Execution context

- Track: `angular`. Profile: `core-ui-angular`, vì đây chính là repo thư viện.
- Cách test:
  - **TDD** cho form-generic time/json (TASK-002 → TASK-003), core (TASK-006 → TASK-007), registry/service (TASK-008 → TASK-009) và route (TASK-010 → TASK-011).
  - **Viết test sau** cho các trang (TASK-012, TASK-014) và Showcase (TASK-017).
- Chạy song song: **không**. Lõi dùng chung (core → services → pages) và rollout toàn repo buộc phải làm tuần tự. Thực thi theo phase, có checkpoint sau mỗi phase.
- Node `22.22.3` cho mọi lệnh install/build. Dùng npm; repo có `package-lock.json`.
- Nhánh: trước commit đầu tiên, đổi tên nhánh worktree `claude/check-work-other-account-ee1b4f` thành `feat/generic-crud-module` (base `origin/main` `48de6f13e`). Sau đó mở PR vào `main`.

## Frontend architecture plan

**Quy ước đã kiểm**
- Component standalone, signal `input()`/`model()`/`output()`, control flow mới.
- Mỗi secondary entry point có `index.ts`, `ng-package.json`, `sd-<name>.md` và thư mục `src/**`.
- `public-api.spec.ts` canh đúng bề mặt runtime.
- Provider có dạng `provideSd*()` trả `EnvironmentProviders`.
- Thư viện không tự gọi transport; dữ liệu đi qua callback/adapter của consumer.
- Test bằng Karma + Jasmine + `RouterTestingHarness`.

**Cây component**
```text
Route generic/:module/:entity
  providers: SdGenericSchemaService, SdGenericDataService, SdGenericPermissionService,
             provideSdFormGeneric(sd-generic-relation); data.permission public; guard + resolver
  GenericListPage            sd-table server, action, xoá nhiều, banner cấu hình lỗi (inline), <router-outlet>
    GenericImportDialog      sd-import-excel, upsert qua SdGenericImportService
    create | :id/detail | :id/update → GenericFormHostPage   sd-form-render (viewed cho detail), page | sd-side-drawer
Route generic/:module/:entity/configuration → GenericConfigurationPage (sd-tab)
    General | List | Form (sd-form-builder + panel property) | Import
```

**Nơi giữ state:** theo bảng của bản kiến trúc. Riêng hai service cổng adapter nằm ở cấp route.

**Bề mặt public:** `provideSdGeneric`, `provideSdGenericEntity`, `sdGenericRoutes`, `validateSdGenericSchema`, cùng các type.

**Cách tách component:**
- Trang route chỉ điều phối.
- Logic nằm ở `core` (hàm thuần) và hai service.
- Bốn tab cấu hình tách thành component vì mỗi tab có form và state nháp riêng.
- Banner giữ inline trong trang list.

## Execution preflight

1. Ghi lại: `git status --short`, diffstat staged/unstaged, file chưa track, nhánh và HEAD. Chỉ cho phép các artifact `.sdcorejs/**` của change này là file bẩn.
2. Đổi tên nhánh sang `feat/generic-crud-module`.
3. Cài dependency, với Node `22.22.3`: `npm --prefix versions/v19 ci --legacy-peer-deps`, `npm --prefix showcase ci --legacy-peer-deps`.
4. Chạy baseline: `npm --prefix versions/v19 run build`, rồi spec form-generic.
5. **Sửa `form-generic` thì phải build lại.** `tsconfig` trỏ `@sdcorejs/angular/*` vào `dist` trước `projects/`. Vì vậy sau TASK-003, phải build lại thư viện thì `modules/generic` mới thấy field `time`/`json` mới.

## Tasks

### Phase 1 - form-generic: field time/json (TDD)

- **TASK-001** (không phụ thuộc): i18n: khoá core.form-generic.* cho time/json và core.module.generic.* cho module, đủ 5 ngôn ngữ
  - EDIT `versions/v19/projects/sdcorejs-angular/i18n/src/en.ts`
  - EDIT `versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts`
  - EDIT `versions/v19/projects/sdcorejs-angular/i18n/src/ja.ts`
  - EDIT `versions/v19/projects/sdcorejs-angular/i18n/src/ko.ts`
  - EDIT `versions/v19/projects/sdcorejs-angular/i18n/src/zh.ts`
  - Bằng chứng EVIDENCE-001: `npm --prefix versions/v19 run check:i18n && npm --prefix versions/v19 run check:i18n-parity`
- **TASK-002** (sau TASK-001): RED: spec cho field time/json của form-generic (validation, hiển thị, renderer, palette)
  - CREATE `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.time-json.spec.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.spec.ts`
  - EDIT `versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.spec.ts`
  - EDIT `versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.spec.ts`
  - Bằng chứng EVIDENCE-002: `(versions/v19) npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/form-generic/**/*.spec.ts`
- **TASK-003** (sau TASK-002): GREEN: thêm SdFormGenericTime/SdFormGenericJson, item time/json, palette, preview, inspector
  - CREATE `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.html`
  - CREATE `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.scss`
  - CREATE `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.html`
  - CREATE `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.scss`
  - EDIT `versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-field.model.ts`
  - EDIT `versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.ts`
  - EDIT `versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.ts`
  - EDIT `versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.ts`
  - EDIT `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.html`
  - EDIT `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/index.ts`
  - EDIT `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.ts`
  - EDIT `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/field-preview.component.html`
  - EDIT `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.ts`
  - EDIT `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.html`
  - Bằng chứng EVIDENCE-003: `(versions/v19) npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/form-generic/**/*.spec.ts`
- **TASK-004** (sau TASK-003): Docs: sd-form-generic.md mô tả field time và json
  - EDIT `versions/v19/projects/sdcorejs-angular/components/form-generic/sd-form-generic.md`
  - Bằng chứng EVIDENCE-004: `npm run test:collect-docs`

### Phase 2 - modules/generic: model và core thuần (TDD)

- **TASK-005** (sau TASK-004): Model: SdGenericSchema, SdGenericProperty, SdGenericAdapter, cấu hình entity/action/hook, SdGenericSchemaIssue
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/models/index.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/models/generic-schema.model.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/models/generic-adapter.model.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/models/generic-entity.model.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/models/generic-issue.model.ts`
  - Bằng chứng EVIDENCE-005: `(versions/v19) npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts`
- **TASK-006** (sau TASK-005): RED: spec cho các hàm thuần trong core (quyền, tiêu đề, mặc định, merge, validate, form, cột, search, import)
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.spec.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-title.spec.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.spec.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.spec.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.spec.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-form.spec.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.spec.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-search.spec.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-import.spec.ts`
  - Bằng chứng EVIDENCE-006: `(versions/v19) npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts`
- **TASK-007** (sau TASK-006): GREEN: cài đặt core (hàm thuần, không DI/DOM/HttpClient)
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-title.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-form.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-search.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-import.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/core/index.ts`
  - Bằng chứng EVIDENCE-007: `(versions/v19) npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts`

### Phase 3 - registry và service (TDD)

- **TASK-008** (sau TASK-007): RED: spec registry (scope gần nhất, trùng cùng injector) và các service (schema 3 lớp, data, quyền, catalog relation, import)
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.spec.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.spec.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.spec.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.spec.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.spec.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.spec.ts`
  - Bằng chứng EVIDENCE-008: `(versions/v19) npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts`
- **TASK-009** (sau TASK-008): GREEN: registry, provideSdGeneric/provideSdGenericEntity, SdGenericSchemaService, kho localStorage, SdGenericDataService, quyền, catalog relation, import
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/registry/provide-sd-generic.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/registry/index.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-configuration-store.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/services/index.ts`
  - Bằng chứng EVIDENCE-009: `(versions/v19) npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts`

### Phase 4 - route, trang list, host form, import (TDD route + test sau cho trang)

- **TASK-010** (sau TASK-009): RED: spec route với RouterTestingHarness (guard quyền, data.permission public, page/drawer, back giữ trạng thái list)
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.spec.ts`
  - Bằng chứng EVIDENCE-010: `(versions/v19) npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts`
- **TASK-011** (sau TASK-010): GREEN: sdGenericRoutes, guard/resolver, trang list (sd-table, action, banner), host form (page | sd-side-drawer), hộp thoại import
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/routes/generic-route.guards.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/routes/index.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.html`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.scss`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.html`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.scss`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.html`
  - Bằng chứng EVIDENCE-011: `(versions/v19) npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts`
- **TASK-012** (sau TASK-011): Test sau: spec trang list, host form và hộp thoại import
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.spec.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.spec.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.spec.ts`
  - Bằng chứng EVIDENCE-012: `(versions/v19) npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts`

### Phase 5 - màn chỉnh cấu hình (test sau)

- **TASK-013** (sau TASK-012): Màn chỉnh cấu hình: trang configuration và 4 tab (chung, danh sách, form với panel property, import)
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.html`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.scss`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.html`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.html`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.html`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.html`
  - Bằng chứng EVIDENCE-013: `(versions/v19) npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts`
- **TASK-014** (sau TASK-013): Test sau: spec trang configuration và tab form (panel property)
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.spec.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.spec.ts`
  - Bằng chứng EVIDENCE-014: `(versions/v19) npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts`

### Phase 6 - bề mặt public và docs

- **TASK-015** (sau TASK-014): Bề mặt public: entry point modules/generic, spec public-api (đúng 4 symbol runtime), barrel modules
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/ng-package.json`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/index.ts`
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/src/public-api.spec.ts`
  - EDIT `versions/v19/projects/sdcorejs-angular/modules/index.ts`
  - Bằng chứng EVIDENCE-015: `(versions/v19) npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts`
  - Bằng chứng EVIDENCE-016: `node -e "const fs=require('fs'),p=require('path');const bad=[];const walk=d=>fs.readdirSync(d,{withFileTypes:true}).forEach(e=>{const f=p.join(d,e.name);if(e.isDirectory())return walk(f);if(/[.]ts$/.test(f)&&!/[.]spec[.]ts$/.test(f)&&/HttpClient|@omg-b2b|core-commerce/.test(fs.readFileSync(f,'utf8')))bad.push(f)});walk('versions/v19/projects/sdcorejs-angular/modules/generic');if(bad.length){console.error(bad.join(String.fromCharCode(10)));process.exit(1)}"`
  - Bằng chứng EVIDENCE-017: `npm --prefix versions/v19 run build`
- **TASK-016** (sau TASK-015): Docs: sd-generic.md (adapter, provider, route, schema, quyền, cấu hình, ví dụ)
  - CREATE `versions/v19/projects/sdcorejs-angular/modules/generic/sd-generic.md`
  - Bằng chứng EVIDENCE-018: `npm run test:collect-docs`

### Phase 7 - Showcase

- **TASK-017** (sau TASK-016): Showcase: trang demo modules/generic với adapter mock, route demo, registry và example sinh ra
  - CREATE `showcase/src/app/pages/modules/generic/generic-demo.component.ts`
  - CREATE `showcase/src/app/pages/modules/generic/generic-demo.mock-adapter.ts`
  - CREATE `showcase/src/app/pages/modules/generic/generic-demo.component.spec.ts`
  - EDIT `showcase/src/app/app.routes.ts`
  - EDIT `showcase/src/app/app.routes.spec.ts`
  - EDIT `showcase/src/app/docs/core/documentation.registry.ts`
  - EDIT `showcase/src/app/docs/core/documentation.registry.spec.ts`
  - EDIT `showcase/src/app/docs/generated/example-sources.generated.ts`
  - EDIT `showcase/src/app/docs/generated/example-manifest.generated.ts`
  - Bằng chứng EVIDENCE-019: `npm --prefix showcase run link:library && npm --prefix showcase run test -- --include=src/app/pages/modules/generic/**/*.spec.ts --include=src/app/app.routes.spec.ts --include=src/app/docs/core/documentation.registry.spec.ts`
  - Bằng chứng EVIDENCE-020: `npm run generate:showcase-examples && npm run test:showcase-examples`

### Phase 8 - CHANGELOG và rollout

- **TASK-018** (sau TASK-017): CHANGELOG [Unreleased]: module generic, form-generic time/json (ghi chú switch đủ type)
  - EDIT `CHANGELOG.md`
  - Bằng chứng EVIDENCE-021: `npm run test:collect-docs`
- **TASK-019** (sau TASK-018): Rollout: npm run sync sang v20/v21/v22, check:sync, build bốn line
  - EDIT/CREATE do `npm run sync` sinh ra: 301 file mirror v20/v21/v22 của các file thư viện ở trên, cùng `versions/v{19,20,21,22}/SYNC-STATUS.md` (danh sách đầy đủ trong `allowed_paths`).
  - Bằng chứng EVIDENCE-022: `npm run sync && npm run check:sync`
  - Bằng chứng EVIDENCE-023: `npm --prefix versions/v20 run build && npm --prefix versions/v21 run build && npm --prefix versions/v22 run build`


## Acceptance mapping

- AC-001 → TASK-008, TASK-009, TASK-011, TASK-012
- AC-002 → TASK-008, TASK-009
- AC-003 → TASK-008, TASK-009
- AC-004 → TASK-008, TASK-009
- AC-005 → TASK-008, TASK-009, TASK-013, TASK-014
- AC-006 → TASK-005, TASK-006, TASK-007
- AC-007 → TASK-008, TASK-009, TASK-011, TASK-012
- AC-008 → TASK-006, TASK-007
- AC-009 → TASK-006, TASK-007, TASK-011, TASK-012
- AC-010 → TASK-006, TASK-007, TASK-010, TASK-011
- AC-011 → TASK-010, TASK-011
- AC-012 → TASK-010, TASK-011
- AC-013 → TASK-006, TASK-007, TASK-011, TASK-012
- AC-014 → TASK-011, TASK-012
- AC-015 → TASK-006, TASK-007, TASK-011, TASK-012
- AC-016 → TASK-006, TASK-007, TASK-008, TASK-009
- AC-017 → TASK-008, TASK-009
- AC-018 → TASK-011, TASK-012
- AC-019 → TASK-006, TASK-007, TASK-008, TASK-009, TASK-011, TASK-012
- AC-020 → TASK-013, TASK-014
- AC-021 → TASK-001, TASK-002, TASK-003, TASK-004
- AC-022 → TASK-004, TASK-016, TASK-017
- AC-023 → TASK-015, TASK-018, TASK-019
- AC-024 → TASK-001, TASK-005, TASK-015, TASK-016

## Verification

- Mỗi phase: chạy spec của phase (xem bằng chứng từng task). Với TDD: spec RED trước, GREEN sau.
- Cuối cùng:
  - toàn bộ spec `modules/generic` và `form-generic`;
  - `npm --prefix versions/v19 run check:i18n` và `check:i18n-parity`;
  - lệnh quét HttpClient;
  - build v19;
  - spec Showcase + `npm run test:showcase-examples`;
  - `npm run test:collect-docs`;
  - `npm run sync` + `npm run check:sync`;
  - `npm ci` + build v20/v21/v22;
  - eslint trên các file đã đổi;
  - kiểm diff chỉ nằm trong `allowed_paths`.
- Không có bước thủ công.

## Machine-readable contract

```yaml
plan_context:
  schema_version: 2
  source: sdcorejs-plan
  architecture_gate:
    valid: true
    required: true
    status: required
    signals:
      - conflicting-independent-unit-decisions
      - persisted-data-model-contract
      - public-api-contract
      - state-data-ownership
    bypass: null
    rationale: >-
      Thêm public entry point mới (adapter contract, provider, route, validate) và schema JSON SdGenericSchema mà consumer lưu trữ qua configuration.set; xác
      định chủ sở hữu cấu hình (adapter/localStorage) và luật merge với schema backend; list, form, import và màn chỉnh cấu hình là các đơn vị độc lập phải dùng
      chung một bộ tra adapter, dựng schema và mã quyền, nếu không sẽ tự quyết theo cách xung đột.
    blockers: []
    blocker_messages: []
  architecture_context:
    schema_version: 1
    source: sdcorejs-architecture
    contract_id: generic-crud-module-v1
    requirement_id: R-001
    approved_spec_reference:
      repository_id: sdcorejs-angular
      artifact_id: spec-generic-crud-module-v1-r1
      artifact_kind: spec
      revision: 48de6f13e24a9e4bed9be3dd44f9ffaf16c0dd4a
      approval_hash: sha256:v1:6107bece2aded5c0256881ec0c82a0c7963313b49b3a3905b53f9f03b139f2cf
    approved_architecture_path: .sdcorejs/architecture/angular/2026-10-13-10-42-generic-crud-module.md
    approved_architecture_hash: sha256:v1:4f667e1902324667fcaa23af9af63914d4dfe0342faf9ed32c5a176afaedc99b
    owner_repository_id: sdcorejs-angular
    owner_module_id: modules/generic
    execution_host_repository_id: sdcorejs-angular
    integration_owner_repository_id: sdcorejs-angular
    trigger:
      required: true
      signals:
        - conflicting-independent-unit-decisions
        - persisted-data-model-contract
        - public-api-contract
        - state-data-ownership
      rationale: >-
        Thêm public entry point mới (adapter contract, provider, route, validate) và schema JSON SdGenericSchema mà consumer lưu trữ qua configuration.set; xác
        định chủ sở hữu cấu hình (adapter/localStorage) và luật merge với schema backend; list, form, import và màn chỉnh cấu hình là các đơn vị độc lập phải
        dùng chung một bộ tra adapter, dựng schema và mã quyền, nếu không sẽ tự quyết theo cách xung đột.
    invariants:
      - id: INV-001
        statement: >-
          Mọi màn (list, form, import, màn cấu hình, catalog relation) chỉ lấy adapter và cấu hình entity qua một resolver: scope gần nhất thắng, trùng cùng
          injector thì ném lỗi.
        scope: modules/generic registry và mọi nơi tra adapter/entity
        owner: sdcorejs-angular/modules/generic
        rationale: Root và lazy route cùng khai; một luật tra duy nhất tránh các màn chọn adapter khác nhau.
        verification_method: 'VAL-001: spec với EnvironmentInjector root + con.'
        requirement_refs:
          - R-005
        decision_refs:
          - D-007
          - D-020
      - id: INV-002
        statement: >-
          Schema hiệu lực chỉ được dựng ở SdGenericSchemaService bằng hàm thuần: adapter.schema → entity.schema(base) → cấu hình đã lưu (validate rồi merge);
          chỉ SdGenericSchemaService gọi adapter.schema và configuration.get/set (hoặc localStorage khoá sd-generic:configuration:<module>.<entity>).
        scope: SdGenericSchemaService, core merge, kho cấu hình
        owner: sdcorejs-angular/modules/generic
        rationale: Schema là đầu vào của mọi màn; dựng ở một chỗ để list/form/import/màn cấu hình nhìn cùng một schema.
        verification_method: VAL-002 và VAL-011.
        requirement_refs:
          - R-006
          - R-007
        decision_refs:
          - D-011
          - D-012
          - D-021
          - D-025
      - id: INV-003
        statement: >-
          validateSdGenericSchema là hàm thuần duy nhất kiểm cấu hình; bước load và nút Lưu đều dùng nó; lỗi shape/version thì dùng mặc định, tham chiếu treo bị
          merge bỏ, có lỗi thì không gọi configuration.set.
        scope: core validate, bước load cấu hình, nút Lưu
        owner: sdcorejs-angular/modules/generic
        rationale: Bước validate là chốt chặn cấu hình hỏng (người dùng nhấn mạnh).
        verification_method: VAL-003.
        requirement_refs:
          - R-008
        decision_refs:
          - D-013
          - D-017
          - D-027
      - id: INV-004
        statement: >-
          SdGenericSchema v1 chỉ chứa dữ liệu JSON (không function); function (schema, search, display, hooks, action) chỉ nằm ở provider; key, dataType,
          enums[].value, relation.entity luôn lấy từ schema hiện tại.
        scope: Model SdGenericSchema / SdGenericProperty
        owner: sdcorejs-angular/modules/generic
        rationale: Cấu hình phải lưu được dạng JSON ở server hoặc localStorage; BE là nguồn cấu trúc.
        verification_method: VAL-002 và VAL-013.
        requirement_refs:
          - R-002
          - R-003
        decision_refs:
          - D-002
          - D-003
          - D-009
          - D-011
      - id: INV-005
        statement: >-
          Mã quyền chỉ sinh từ một hàm thuần <MODULE>_<ENTITY>_C_GENERIC_<ACTION> viết hoa; guard route, hiển thị action và banner cấu hình lỗi đều dùng hàm đó;
          permission: false bỏ qua cả ba; mọi route của sdGenericRoutes() có data.permission = SD_PERMISSION_PUBLIC để guard của portal không chặn, còn guard
          của module generic kiểm mã thật.
        scope: core mã quyền, guard route, lọc action, banner
        owner: sdcorejs-angular/modules/generic
        rationale: Một định dạng mã cho portal khai quyền; ẩn nút và chặn route không được lệch nhau.
        verification_method: VAL-003 và VAL-004.
        requirement_refs:
          - R-011
        decision_refs:
          - D-015
          - D-024
          - D-029
      - id: INV-006
        statement: >-
          Tiêu đề chỉ được parse/render bằng một hàm thuần; kết quả gắn vào DOM bằng nội suy text, không innerHTML; list.title và create.title không có
          placeholder.
        scope: core tiêu đề và template của các trang
        owner: sdcorejs-angular/modules/generic
        rationale: Tránh lỗi XSS kiểu htmlTemplate cũ; template phải được validate.
        verification_method: VAL-005.
        requirement_refs:
          - R-009
        decision_refs:
          - D-014
      - id: INV-007
        statement: >-
          Layout form của mỗi action do một hàm thuần dựng: field lấy type/label/options/validation từ general.properties; create bỏ system và không insertable;
          update bỏ system và không updatable; payload update chỉ gồm property updatable.
        scope: core dựng form và host form
        owner: sdcorejs-angular/modules/generic
        rationale: Một nguồn cho dữ liệu field; luật insertable/updatable/system áp giống nhau ở form tự sinh và form đã lưu.
        verification_method: VAL-006.
        requirement_refs:
          - R-013
        decision_refs:
          - D-002
          - D-009
          - D-017
      - id: INV-008
        statement: >-
          Chỉ SdGenericDataService gọi các hàm dữ liệu của adapter (query, detail, create, update, delete, search); mọi lần lưu đi qua beforeSave/afterSave;
          search theo thứ tự entity → adapter → query (CONTAIN để tìm, IN để lấy nhãn); giá trị relation được lưu đúng kiểu gốc; trang và component không gọi
          adapter trực tiếp.
        scope: SdGenericDataService và catalog relation
        owner: sdcorejs-angular/modules/generic
        rationale: Hooks và thứ tự search phải đúng ở mọi màn, kể cả import và select relation.
        verification_method: VAL-007.
        requirement_refs:
          - R-004
          - R-013
          - R-014
        decision_refs:
          - D-010
          - D-022
          - D-025
      - id: INV-009
        statement: >-
          Kiểu hiển thị chỉ quyết định sau khi schema đã resolve, theo entity.display → adapter.display → 'page'; drawer render trong outlet của list, list
          không bị huỷ, back/đóng đưa về route list.
        scope: Cây route, trang list, host form
        owner: sdcorejs-angular/modules/generic
        rationale: Deep link và back hoạt động; list giữ trạng thái khi mở drawer.
        verification_method: VAL-008.
        requirement_refs:
          - R-010
        decision_refs:
          - D-004
          - D-005
          - D-024
      - id: INV-010
        statement: >-
          Entry point modules/generic export đúng 4 symbol runtime; không dùng HttpClient và không import package riêng của backend; chỉ import phần khác của
          thư viện qua entry point public.
        scope: Entry point modules/generic
        owner: sdcorejs-angular/modules/generic
        rationale: Thư viện public, không phụ thuộc backend; bề mặt export phải tường minh.
        verification_method: VAL-013.
        requirement_refs:
          - R-001
        decision_refs:
          - D-001
          - D-019
          - D-026
          - D-028
      - id: INV-011
        statement: form-generic chỉ thêm member time và json vào union field; type và hành vi hiện có không đổi; form-generic không import modules/generic.
        scope: components/form-generic
        owner: sdcorejs-angular/modules/generic
        rationale: Mở rộng public API phải chỉ thêm, không làm vỡ schema form-generic đã lưu.
        verification_method: VAL-012.
        requirement_refs:
          - R-018
        decision_refs:
          - D-008
      - id: INV-012
        statement: >-
          Chỉ sửa ở versions/v19 và showcase; v20/v21/v22 chỉ đổi qua npm run sync; check:sync xanh; CHANGELOG có mục Unreleased; guard example/registry của
          Showcase xanh.
        scope: Các workspace v19–v22, Showcase, CHANGELOG
        owner: sdcorejs-angular/modules/generic
        rationale: 'Luật cứng của repo: v19 là nguồn, các line khác dẫn xuất.'
        verification_method: VAL-014.
        requirement_refs:
          - R-019
          - R-020
        decision_refs:
          - D-018
      - id: INV-013
        statement: >-
          List dùng sd-table server và chuyển PagingReq sang adapter.query; xoá có xác nhận, xoá nhiều gọi delete tuần tự, sau thay đổi thì reload; action mở
          rộng và action có sẵn đi chung một bước lọc quyền/visible/hiddenDefaults.
        scope: Trang list
        owner: sdcorejs-angular/modules/generic
        rationale: Hành vi list và action mở rộng phải nhất quán cho mọi entity.
        verification_method: VAL-004 và VAL-009.
        requirement_refs:
          - R-012
          - R-015
        decision_refs:
          - D-006
          - D-011
      - id: INV-014
        statement: >-
          Import lập kế hoạch create/update bằng hàm thuần theo upsertKey, tra bản ghi đã có theo lô, chạy qua SdGenericDataService với tối đa 5 request song
          song.
        scope: core kế hoạch import và import service
        owner: sdcorejs-angular/modules/generic
        rationale: Upsert đúng và không làm quá tải backend.
        verification_method: VAL-010.
        requirement_refs:
          - R-016
        decision_refs:
          - D-016
          - D-025
      - id: INV-015
        statement: Màn cấu hình chỉ ghi qua SdGenericSchemaService.save (validate rồi configuration.set rồi xoá cache); key và dataType không sửa được.
        scope: Trang configuration
        owner: sdcorejs-angular/modules/generic
        rationale: Chỉ một đường ghi cấu hình để validate và cache luôn đúng.
        verification_method: VAL-011.
        requirement_refs:
          - R-017
        decision_refs:
          - D-012
          - D-023
    boundaries:
      - id: B-001
        statement: 'models và core là TypeScript thuần: không DI, không DOM, không HttpClient, không import registry/services/pages.'
        invariant_refs:
          - INV-002
          - INV-003
          - INV-006
          - INV-007
          - INV-014
      - id: B-002
        statement: pages và components chỉ lấy dữ liệu qua SdGenericSchemaService và SdGenericDataService; không gọi adapter.
        invariant_refs:
          - INV-002
          - INV-008
      - id: B-003
        statement: >-
          modules/generic chỉ import phần khác của thư viện qua entry point public (components/table, components/form-generic, components/import-excel,
          components/side-drawer, modules/permission, i18n) và @sdcorejs/utils/models.
        invariant_refs:
          - INV-010
      - id: B-004
        statement: form-generic không phụ thuộc modules/generic; phần thêm của form-generic chỉ là field time và json.
        invariant_refs:
          - INV-011
      - id: B-005
        statement: Chỉ sửa versions/v19 và showcase; v20/v21/v22 qua npm run sync.
        invariant_refs:
          - INV-012
      - id: B-006
        statement: Transport tới backend chỉ nằm trong adapter do consumer viết; thư viện không chứa URL, header hay logic của backend nào.
        invariant_refs:
          - INV-008
          - INV-010
    dependency_directions:
      - from: modules/generic pages/components
        to: modules/generic services, core, models; sd-table, sd-form-render, sd-form-builder, sd-import-excel, sd-side-drawer
        rationale: Trang chỉ ghép component sẵn có với service của module.
        invariant_refs:
          - INV-002
          - INV-008
          - INV-009
          - INV-013
      - from: modules/generic services
        to: modules/generic registry, core, models; SdPermissionService
        rationale: Service là cổng duy nhất tới adapter và cấu hình.
        invariant_refs:
          - INV-001
          - INV-002
          - INV-005
          - INV-008
      - from: modules/generic core
        to: modules/generic models; type của form-generic và @sdcorejs/utils/models
        rationale: Lõi thuần chỉ biết type.
        invariant_refs:
          - INV-003
          - INV-004
          - INV-006
          - INV-007
      - from: components/form-generic (field json)
        to: components/code-editor
        rationale: Field json dùng editor có sẵn.
        invariant_refs:
          - INV-011
      - from: showcase
        to: '@sdcorejs/angular/modules/generic (adapter mock in-memory)'
        rationale: Demo dùng đúng API public.
        invariant_refs:
          - INV-010
          - INV-012
    data_state_owners:
      - subject: Đăng ký adapter và cấu hình entity
        owner_repository_id: sdcorejs-angular
        owner: Scope node của từng injector (registry modules/generic)
        invariant_refs:
          - INV-001
      - subject: Schema hiệu lực theo module.entity
        owner_repository_id: sdcorejs-angular
        owner: SdGenericSchemaService ở injector môi trường của route generic (cache, xoá khi lưu)
        invariant_refs:
          - INV-002
          - INV-015
      - subject: Cấu hình đã lưu
        owner_repository_id: sdcorejs-angular
        owner: adapter.configuration của consumer (server hoặc theo người dùng); không khai thì localStorage sd-generic:configuration:<module>.<entity>
        invariant_refs:
          - INV-002
          - INV-003
          - INV-015
      - subject: Trạng thái list (filter, sort, trang)
        owner_repository_id: sdcorejs-angular
        owner: sd-table trong trang list; trang list không bị huỷ khi mở drawer
        invariant_refs:
          - INV-009
          - INV-013
      - subject: Giá trị form đang nhập
        owner_repository_id: sdcorejs-angular
        owner: sd-form-render trong host form; chỉ ghi xuống qua SdGenericDataService
        invariant_refs:
          - INV-007
          - INV-008
      - subject: Bản nháp cấu hình đang sửa
        owner_repository_id: sdcorejs-angular
        owner: Trang configuration (signal cục bộ) đến khi Lưu
        invariant_refs:
          - INV-015
      - subject: Danh sách quyền của người dùng
        owner_repository_id: sdcorejs-angular
        owner: SdPermissionService có sẵn (modules/permission)
        invariant_refs:
          - INV-005
    public_contracts:
      - id: PC-001
        kind: api
        statement: >-
          provideSdGeneric({ adapters, permission? }), provideSdGenericEntity({ module, entity, schema?, search?, display?, hooks?, listActions?, rowCommands?,
          bulkActions?, detailActions?, hiddenDefaults? }), sdGenericRoutes(), validateSdGenericSchema(stored, base) cùng các type của chúng.
        owner: sdcorejs-angular/modules/generic
        compatibility: Entry point mới, chỉ thêm.
        migration: Không cần; consumer bật bằng cách khai provider và route.
        invariant_refs:
          - INV-001
          - INV-003
          - INV-010
      - id: PC-002
        kind: api
        statement: >-
          SdGenericAdapter: module, schema, query(PagingReq→PagingRes), detail, create, update, delete, search?, configuration?: { get(entity), set(entity,
          schema) }, display?.
        owner: sdcorejs-angular/modules/generic
        compatibility: Mới; thêm member tuỳ chọn về sau không phá adapter đã viết.
        migration: Adapter của lib-core-commerce viết lại theo contract này ở repo của dự án.
        invariant_refs:
          - INV-008
          - INV-010
      - id: PC-003
        kind: persisted-data-model
        statement: SdGenericSchema version 1 (general, list, detail, create, update, import) lưu qua configuration.set hoặc localStorage.
        owner: sdcorejs-angular/modules/generic
        compatibility: Phiên bản đầu; version khác 1 bị coi là lỗi shape và dùng cấu hình mặc định.
        migration: Phiên bản sau phải thêm bước chuyển đổi trong validate/merge trước khi tăng version.
        invariant_refs:
          - INV-002
          - INV-003
          - INV-004
      - id: PC-004
        kind: api
        statement: >-
          Mã quyền <MODULE>_<ENTITY>_C_GENERIC_{LIST|DETAIL|CREATE|UPDATE|DELETE|IMPORT|CONFIGURATION} và route
          generic/:module/:entity[/create|/:id/detail|/:id/update|/configuration].
        owner: sdcorejs-angular/modules/generic
        compatibility: Mới; đổi định dạng về sau là breaking với hệ thống phân quyền của portal.
        migration: Portal khai các mã này trong hệ thống quyền.
        invariant_refs:
          - INV-005
          - INV-009
      - id: PC-005
        kind: api
        statement: form-generic thêm SdFormGenericTime (type time, giá trị HH:mm) và SdFormGenericJson (type json) vào union SdFormGenericField.
        owner: sdcorejs-angular/components/form-generic
        compatibility: Chỉ thêm; code consumer switch đủ mọi type (exhaustive) cần thêm nhánh.
        migration: Ghi trong CHANGELOG; không đổi schema đã lưu.
        invariant_refs:
          - INV-011
    security_trust_boundaries:
      - id: ST-001
        statement: Kiểm tra quyền ở client chỉ để ẩn UI và chặn route; backend của adapter phải kiểm lại quyền.
        invariant_refs:
          - INV-005
      - id: ST-002
        statement: Tiêu đề và giá trị hiển thị từ dữ liệu backend chỉ render dạng text, không HTML.
        invariant_refs:
          - INV-006
    cross_repository_integration: []
    adopted_decision_refs:
      - D-001
      - D-002
      - D-003
      - D-004
      - D-005
      - D-006
      - D-007
      - D-008
      - D-009
      - D-010
      - D-011
      - D-012
      - D-013
      - D-014
      - D-015
      - D-016
      - D-017
      - D-018
      - D-019
      - D-020
      - D-021
      - D-022
      - D-023
      - D-024
      - D-025
      - D-026
      - D-027
      - D-028
    deferred_decision_refs:
      - D-029
    assumption_refs:
      - A-001
      - A-002
      - A-003
      - A-004
      - A-005
    validation_obligations:
      - id: VAL-001
        expected_proof: 'Spec registry/resolver với injector root và EnvironmentInjector con: scope gần nhất thắng, trùng cùng injector ném lỗi ngay khi injector được tạo.'
        owner: sdcorejs-angular
        invariant_refs:
          - INV-001
        acceptance_criterion_refs:
          - AC-002
          - AC-003
      - id: VAL-002
        expected_proof: >-
          Spec SdGenericSchemaService và hàm merge: 3 lớp, null dùng mặc định, localStorage khi không có configuration, tham chiếu treo bị bỏ, property mới
          visible false, cấu trúc lấy từ base.
        owner: sdcorejs-angular
        invariant_refs:
          - INV-002
          - INV-004
        acceptance_criterion_refs:
          - AC-001
          - AC-004
          - AC-005
          - AC-006
      - id: VAL-003
        expected_proof: Spec validateSdGenericSchema cho từng mã lỗi; spec load fallback + console.warn + banner theo quyền; spec màn cấu hình chặn lưu.
        owner: sdcorejs-angular
        invariant_refs:
          - INV-003
          - INV-005
        acceptance_criterion_refs:
          - AC-007
          - AC-008
          - AC-020
      - id: VAL-004
        expected_proof: >-
          Spec hàm mã quyền, guard route (route có data.permission public, guard generic kiểm mã thật) và lọc action (permission, visible, hiddenDefaults,
          permission: false).
        owner: sdcorejs-angular
        invariant_refs:
          - INV-005
          - INV-013
        acceptance_criterion_refs:
          - AC-010
          - AC-018
      - id: VAL-005
        expected_proof: 'Spec template tiêu đề và DOM: placeholder sai bị báo, <b> hiện dạng text.'
        owner: sdcorejs-angular
        invariant_refs:
          - INV-006
        acceptance_criterion_refs:
          - AC-009
      - id: VAL-006
        expected_proof: Spec hàm dựng form theo action và lọc payload update.
        owner: sdcorejs-angular
        invariant_refs:
          - INV-007
        acceptance_criterion_refs:
          - AC-015
      - id: VAL-007
        expected_proof: >-
          Spec SdGenericDataService: hooks, thứ tự search và filter CONTAIN/IN, PagingReq của list, catalog relation có params riêng từng relation và giá trị
          relation số được lưu lại là số.
        owner: sdcorejs-angular
        invariant_refs:
          - INV-008
        acceptance_criterion_refs:
          - AC-001
          - AC-016
          - AC-017
      - id: VAL-008
        expected_proof: 'Spec route với RouterTestingHarness: drawer đè list và back đóng drawer giữ trạng thái list; page mặc định và reload sau khi lưu.'
        owner: sdcorejs-angular
        invariant_refs:
          - INV-009
        acceptance_criterion_refs:
          - AC-011
          - AC-012
      - id: VAL-009
        expected_proof: 'Spec trang list: cột ẩn, orders/filters trong request, xác nhận xoá, xoá nhiều tuần tự, reload, action mở rộng.'
        owner: sdcorejs-angular
        invariant_refs:
          - INV-013
        acceptance_criterion_refs:
          - AC-013
          - AC-014
          - AC-018
      - id: VAL-010
        expected_proof: Spec kế hoạch import và giới hạn 5 request song song qua data service.
        owner: sdcorejs-angular
        invariant_refs:
          - INV-014
        acceptance_criterion_refs:
          - AC-019
      - id: VAL-011
        expected_proof: 'Spec trang cấu hình: lưu gọi configuration.set hoặc localStorage, key/dataType chỉ đọc, xoá cache.'
        owner: sdcorejs-angular
        invariant_refs:
          - INV-015
          - INV-002
        acceptance_criterion_refs:
          - AC-005
          - AC-020
      - id: VAL-012
        expected_proof: Spec field time/json của form-generic và toàn bộ suite form-generic hiện có xanh.
        owner: sdcorejs-angular
        invariant_refs:
          - INV-011
        acceptance_criterion_refs:
          - AC-021
      - id: VAL-013
        expected_proof: Spec public-api của modules/generic (đúng 4 symbol runtime) và lệnh quét không có HttpClient/import backend trong modules/generic.
        owner: sdcorejs-angular
        invariant_refs:
          - INV-010
          - INV-004
        acceptance_criterion_refs:
          - AC-024
      - id: VAL-014
        expected_proof: >-
          npm run test:showcase-examples, build Showcase, npm run sync, npm run check:sync, build sdcorejs-angular v19–v22 (không vòng phụ thuộc qua barrel
          modules), CHANGELOG có mục Unreleased.
        owner: sdcorejs-angular
        invariant_refs:
          - INV-012
        acceptance_criterion_refs:
          - AC-022
          - AC-023
    profile_sections:
      frontend_architecture_ref:
        reference: plan_context.frontend_architecture
        conformance_invariant_refs:
          - INV-001
          - INV-002
          - INV-007
          - INV-008
          - INV-009
          - INV-013
      agent_architecture_ref: null
    change_control:
      revision: 1
      supersedes: null
  decision_coverage:
    schema_version: 1
    revision: 3
    records:
      - id: R-001
        type: requirement
        statement: >-
          Thêm entry point @sdcorejs/angular/modules/generic, không phụ thuộc backend: public API runtime gồm provideSdGeneric, provideSdGenericEntity,
          sdGenericRoutes, validateSdGenericSchema; các model SdGenericSchema, SdGenericProperty, SdGenericAdapter… chỉ export dạng type. Không chứa adapter hay
          giá trị riêng của backend nào.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
        task_refs:
          - TASK-001
          - TASK-015
          - TASK-016
      - id: R-002
        type: requirement
        statement: >-
          Model SdGenericSchema { version: 1, module, entity, general { label, primaryKey?, properties }, list?, detail?, create?, update?, import? };
          detail/create/update có dạng { title?, form?: SdFormGenericSchema }; list có title?, columns?, externalFilters?, orders?, pageSize?, export?; import
          có columns?: { key, matchField? }[], upsertKey?.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
        task_refs:
          - TASK-005
          - TASK-015
      - id: R-003
        type: requirement
        statement: >-
          Model SdGenericProperty { key, label, dataType: string|text|number|boolean|date|datetime|time|enum|relation|json|file, multiple?, format?
          (email|phone|url|password cho string; integer|decimal|currency|percent cho number), enums?: { value, label, color?, icon? }[], relation?: { module?,
          entity, valueField? = 'id', displayField?, display?, searchFields? }, validation?, defaultValue?, insertable? = true, updatable? = true, system? };
          không có relation.type, multiple quyết định chọn một hay nhiều.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
        task_refs:
          - TASK-005
          - TASK-015
      - id: R-004
        type: requirement
        statement: >-
          Contract SdGenericAdapter { module, schema(entity), query(entity, PagingReq) → PagingRes, detail(entity, id), create(entity, data), update(entity, id,
          data), delete(entity, id), search?(entity, req), configuration?: { get(entity), set(entity, schema) }, display?(args) }; request/response dùng
          PagingReq/PagingRes/Filter/Order của @sdcorejs/utils.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
        task_refs:
          - TASK-005
          - TASK-008
          - TASK-009
      - id: R-005
        type: requirement
        statement: >-
          provideSdGeneric({ adapters, permission? }) và provideSdGenericEntity({ module, entity, … }) gọi được nhiều lần ở root và trong lazy route; tra cứu
          theo module (và module+entity) đi từ injector gần nhất lên root, bản gần nhất thắng; trùng module/entity trong cùng một lần gọi là lỗi khi khởi tạo;
          adapters nhận class (DI tạo) hoặc instance.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
        task_refs:
          - TASK-008
          - TASK-009
      - id: R-006
        type: requirement
        statement: >-
          Schema hiệu lực dựng qua 3 lớp: adapter.schema(entity) → provideSdGenericEntity.schema(base) (nếu có) = cấu hình mặc định → configuration.get(entity)
          khác null thì validate rồi merge lên trên; null thì dùng cấu hình mặc định. Adapter không khai configuration thì lib lưu ở localStorage. Mỗi entity
          một cấu hình; lưu theo server hay theo người dùng do adapter quyết định.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-008
          - TASK-009
      - id: R-007
        type: requirement
        statement: >-
          Merge cấu hình đã lưu với schema hiện tại: key, dataType, enums[].value, relation.entity lấy từ schema hiện tại; label, nhãn enum, display,
          validation, defaultValue… lấy từ bản đã lưu; property không còn ở schema hiện tại bị bỏ khỏi general, list, layout form và import; property mới được
          thêm vào general và vào list.columns với visible: false, không tự chèn vào layout form đã lưu.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
        task_refs:
          - TASK-006
          - TASK-007
      - id: R-008
        type: requirement
        statement: >-
          validateSdGenericSchema(stored, base) trả danh sách issue { path, code, severity } kiểm tra: shape và version, key property không trùng, module/entity
          khớp, tham chiếu của list.columns/externalFilters/orders/import.columns/upsertKey/field trong layout tới property có thật, type field layout khớp
          dataType, ngữ pháp layout form-generic, upsertKey không multiple, field layout create phải insertable và update phải updatable, template tiêu đề. Khi
          load: tham chiếu treo tự bỏ; lỗi shape/version thì dùng cấu hình mặc định, console.warn và hiện banner cho người có quyền CONFIGURATION. Khi lưu: có
          lỗi thì chặn.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-008
          - TASK-009
          - TASK-013
          - TASK-014
      - id: R-009
        type: requirement
        statement: >-
          Tiêu đề nằm trong từng section (list.title, create.title, detail.title, update.title), hỗ trợ template ${key}; list.title và create.title không được
          có placeholder; detail.title và update.title chỉ tham chiếu property có thật; tiêu đề render dạng text (không HTML); thiếu thì sinh từ general.label.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-011
          - TASK-012
      - id: R-010
        type: requirement
        statement: >-
          sdGenericRoutes() cung cấp generic/:module/:entity, …/create, …/:id/detail, …/:id/update, …/configuration. Form detail/create/update hiển thị dạng
          page hoặc side-drawer theo provideSdGenericEntity.display → adapter.display → mặc định 'page'; side-drawer điều khiển bằng route: list vẫn hiển thị
          phía sau, giữ filter/trang, back đóng drawer, lưu xong list reload.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
        task_refs:
          - TASK-010
          - TASK-011
      - id: R-011
        type: requirement
        statement: >-
          Quyền theo định dạng <MODULE>_<ENTITY>_C_GENERIC_{LIST|DETAIL|CREATE|UPDATE|DELETE|IMPORT|CONFIGURATION} (viết hoa), kiểm tra qua
          SdPermissionService.hasPermission; thiếu quyền thì ẩn action và chặn route tương ứng; provideSdGeneric({ permission: false }) tắt kiểm tra.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-008
          - TASK-009
          - TASK-010
          - TASK-011
      - id: R-012
        type: requirement
        statement: >-
          Màn list dùng sd-table type server: cột mặc định là mọi property trừ json/file; visible: false là ẩn mặc định nhưng bật lại được; sortable/filterable;
          externalFilters; orders mặc định; pageSize mặc định 20; export Excel phía client khi bật; action có sẵn create/import/export (header),
          detail/update/delete (dòng), delete (chọn nhiều, gọi delete lần lượt); xoá có xác nhận và reload sau khi xoá.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-011
          - TASK-012
      - id: R-013
        type: requirement
        statement: >-
          Detail/create/update render bằng sd-form-render: layout = section.form ?? detail.form ?? tự sinh từ general; mỗi field layout được điền
          type/label/options/validation từ general theo key; detail ở chế độ viewed và hiện cả property system; create bỏ system và property không insertable;
          update bỏ system và property không updatable, payload update chỉ gồm property updatable; relation dùng catalog do lib tự đăng ký, search theo thứ tự
          provideSdGenericEntity.search → adapter.search → adapter.query với CONTAIN (tìm) / IN (lấy nhãn).
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-008
          - TASK-009
          - TASK-011
          - TASK-012
      - id: R-014
        type: requirement
        statement: >-
          provideSdGenericEntity.hooks: beforeSave(ctx { action, data, schema }) trả payload (đồng bộ hoặc Promise) trước khi gọi adapter.create/update;
          afterSave(ctx) chạy sau khi lưu thành công.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
        task_refs:
          - TASK-008
          - TASK-009
      - id: R-015
        type: requirement
        statement: >-
          provideSdGenericEntity khai action mở rộng: listActions, rowCommands, bulkActions, detailActions với { id, label, icon?, permission?, visible?(ctx),
          run(ctx) }, ctx gồm schema, row hoặc rows, reload(); hiddenDefaults ẩn action có sẵn (create, import, export, detail, update, delete).
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
        task_refs:
          - TASK-011
          - TASK-012
      - id: R-016
        type: requirement
        statement: >-
          Import dùng sd-import-excel: template từ import.columns hoặc mọi property insertable trừ system/json/file; ô enum nhận value hoặc label; ô relation so
          khớp theo matchField (mặc định relation.displayField) qua search với values; có upsertKey thì tra theo lô bản ghi đã tồn tại → update, chưa có →
          create; không upsertKey thì luôn create; tối đa 5 request song song; kết quả từng dòng hiện trong sd-import-excel; chỉ cần quyền IMPORT.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-008
          - TASK-009
          - TASK-011
          - TASK-012
      - id: R-017
        type: requirement
        statement: >-
          Màn chỉnh cấu hình tại …/configuration với 4 tab: Thông tin chung (label, nhãn/màu enum, display/searchFields của relation, validation, defaultValue,
          insertable/updatable; không sửa key/dataType), Danh sách (thứ tự cột, width/visible/sortable/filterable, externalFilters, orders, pageSize, export),
          Form (sd-form-builder cho detail, create/update có lựa chọn "giống detail", palette là properties), Import (columns, upsertKey); hiện cảnh báo
          property bị bỏ/mới; nút Lưu validate rồi gọi configuration.set(entity, schema), có lỗi thì chặn.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
        task_refs:
          - TASK-013
          - TASK-014
      - id: R-018
        type: requirement
        statement: >-
          form-generic thêm field type time (giá trị chuỗi HH:mm) và json (dùng code-editor, giá trị JSON hợp lệ) ở renderer, builder và validation; chỉ thêm
          mới, schema form-generic hiện có không đổi hành vi.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: components/form-generic
        task_refs:
          - TASK-001
          - TASK-002
          - TASK-003
          - TASK-004
      - id: R-019
        type: requirement
        statement: Showcase có trang demo module generic chạy với adapter mock in-memory; có tài liệu sd-generic.md và cập nhật sd-form-generic.md cho time/json.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: showcase
        task_refs:
          - TASK-004
          - TASK-016
          - TASK-017
      - id: R-020
        type: requirement
        statement: >-
          Thay đổi viết ở versions/v19 rồi rollout sang v20/v21/v22 bằng npm run sync, check:sync xanh; CHANGELOG có mục Unreleased mô tả thay đổi, nhắm release
          suffix 3.2 (chỉ thêm mới).
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: null
        task_refs:
          - TASK-015
          - TASK-018
          - TASK-019
      - id: AC-001
        type: acceptance-criterion
        statement: >-
          Mở generic/tms/order khi configuration.get trả null → Màn list hiện các cột sinh từ properties (trừ json/file), dữ liệu lấy qua adapter.query với
          PagingReq pageSize 20
        behavior: Mở generic/tms/order khi configuration.get trả null
        expected_result: Màn list hiện các cột sinh từ properties (trừ json/file), dữ liệu lấy qua adapter.query với PagingReq pageSize 20
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-004
          - R-006
          - R-012
        task_refs:
          - TASK-008
          - TASK-009
          - TASK-011
          - TASK-012
      - id: AC-002
        type: acceptance-criterion
        statement: >-
          Cùng module tms khai ở provideSdGeneric root và trong lazy route rồi mở trang generic trong lazy route đó → Lib dùng adapter khai ở lazy route; trang
          ngoài lazy route dùng adapter root
        behavior: Cùng module tms khai ở provideSdGeneric root và trong lazy route rồi mở trang generic trong lazy route đó
        expected_result: Lib dùng adapter khai ở lazy route; trang ngoài lazy route dùng adapter root
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-005
        task_refs:
          - TASK-008
          - TASK-009
      - id: AC-003
        type: acceptance-criterion
        statement: Một lần gọi provideSdGeneric khai hai adapter cùng module → Khởi tạo injector ném lỗi nêu tên module bị trùng
        behavior: Một lần gọi provideSdGeneric khai hai adapter cùng module
        expected_result: Khởi tạo injector ném lỗi nêu tên module bị trùng
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-005
        task_refs:
          - TASK-008
          - TASK-009
      - id: AC-004
        type: acceptance-criterion
        statement: >-
          provideSdGenericEntity.schema đổi label của một property và configuration.get trả bản đã lưu đổi label property khác → Schema hiệu lực có cả hai thay
          đổi; khi get trả null thì chỉ có thay đổi của provideSdGenericEntity.schema
        behavior: provideSdGenericEntity.schema đổi label của một property và configuration.get trả bản đã lưu đổi label property khác
        expected_result: Schema hiệu lực có cả hai thay đổi; khi get trả null thì chỉ có thay đổi của provideSdGenericEntity.schema
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-006
        task_refs:
          - TASK-008
          - TASK-009
      - id: AC-005
        type: acceptance-criterion
        statement: Adapter không khai configuration, lưu cấu hình từ màn chỉnh rồi tải lại trang → Cấu hình được ghi và đọc lại từ localStorage theo module và entity
        behavior: Adapter không khai configuration, lưu cấu hình từ màn chỉnh rồi tải lại trang
        expected_result: Cấu hình được ghi và đọc lại từ localStorage theo module và entity
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-006
          - R-017
        task_refs:
          - TASK-008
          - TASK-009
          - TASK-013
          - TASK-014
      - id: AC-006
        type: acceptance-criterion
        statement: >-
          Cấu hình đã lưu có cột và field layout trỏ tới property đã bị xoá ở schema hiện tại, và schema hiện tại có property mới → Cột/field treo bị bỏ, trang
          vẫn chạy; property mới có trong general và list.columns với visible: false, không có trong layout form đã lưu; dataType lấy từ schema hiện tại
        behavior: Cấu hình đã lưu có cột và field layout trỏ tới property đã bị xoá ở schema hiện tại, và schema hiện tại có property mới
        expected_result: >-
          Cột/field treo bị bỏ, trang vẫn chạy; property mới có trong general và list.columns với visible: false, không có trong layout form đã lưu; dataType
          lấy từ schema hiện tại
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-007
          - R-008
        task_refs:
          - TASK-005
          - TASK-006
          - TASK-007
      - id: AC-007
        type: acceptance-criterion
        statement: >-
          configuration.get trả object sai shape hoặc version không hỗ trợ → Lib dùng cấu hình mặc định, gọi console.warn, banner "cấu hình không hợp lệ" chỉ
          hiện với người có quyền CONFIGURATION
        behavior: configuration.get trả object sai shape hoặc version không hỗ trợ
        expected_result: Lib dùng cấu hình mặc định, gọi console.warn, banner "cấu hình không hợp lệ" chỉ hiện với người có quyền CONFIGURATION
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-008
          - R-011
        task_refs:
          - TASK-008
          - TASK-009
          - TASK-011
          - TASK-012
      - id: AC-008
        type: acceptance-criterion
        statement: >-
          validateSdGenericSchema nhận schema có key trùng, upsertKey trỏ property multiple, field layout update không updatable, field layout sai type → Trả
          issue với path và code tương ứng cho từng lỗi, severity error
        behavior: validateSdGenericSchema nhận schema có key trùng, upsertKey trỏ property multiple, field layout update không updatable, field layout sai type
        expected_result: Trả issue với path và code tương ứng cho từng lỗi, severity error
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-008
        task_refs:
          - TASK-006
          - TASK-007
      - id: AC-009
        type: acceptance-criterion
        statement: >-
          Validate update.title = 'Đơn ${unknown}' và list.title = 'DS ${code}'; render detail.title = '<b>${code}</b>' → Cả hai title đầu bị báo lỗi template;
          title detail hiện chuỗi text đã thay giá trị, thẻ <b> không được render thành HTML
        behavior: Validate update.title = 'Đơn ${unknown}' và list.title = 'DS ${code}'; render detail.title = '<b>${code}</b>'
        expected_result: Cả hai title đầu bị báo lỗi template; title detail hiện chuỗi text đã thay giá trị, thẻ <b> không được render thành HTML
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-008
          - R-009
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-011
          - TASK-012
      - id: AC-010
        type: acceptance-criterion
        statement: >-
          Người dùng thiếu quyền TMS_ORDER_C_GENERIC_CREATE mở màn list rồi điều hướng thẳng tới generic/tms/order/create → Nút tạo mới bị ẩn và route create bị
          chặn; khi provideSdGeneric({ permission: false }) thì nút hiện và route mở được
        behavior: Người dùng thiếu quyền TMS_ORDER_C_GENERIC_CREATE mở màn list rồi điều hướng thẳng tới generic/tms/order/create
        expected_result: 'Nút tạo mới bị ẩn và route create bị chặn; khi provideSdGeneric({ permission: false }) thì nút hiện và route mở được'
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-010
          - R-011
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-010
          - TASK-011
      - id: AC-011
        type: acceptance-criterion
        statement: >-
          display trả 'side-drawer', người dùng lọc list rồi mở generic/tms/order/1/detail và bấm back → Drawer mở đè lên list, URL có /1/detail; back đóng
          drawer, list giữ filter và trang
        behavior: display trả 'side-drawer', người dùng lọc list rồi mở generic/tms/order/1/detail và bấm back
        expected_result: Drawer mở đè lên list, URL có /1/detail; back đóng drawer, list giữ filter và trang
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-010
        task_refs:
          - TASK-010
          - TASK-011
      - id: AC-012
        type: acceptance-criterion
        statement: >-
          Không khai display và mở generic/tms/order/1/update → Form update hiển thị dạng trang đầy đủ (mặc định 'page'); lưu thành công thì quay về list và
          list reload
        behavior: Không khai display và mở generic/tms/order/1/update
        expected_result: Form update hiển thị dạng trang đầy đủ (mặc định 'page'); lưu thành công thì quay về list và list reload
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-010
        task_refs:
          - TASK-010
          - TASK-011
      - id: AC-013
        type: acceptance-criterion
        statement: >-
          list có column visible: false, orders mặc định và externalFilters có default → Cột ẩn nhưng có trong cài đặt cột; request query mang orders và filters
          tương ứng
        behavior: 'list có column visible: false, orders mặc định và externalFilters có default'
        expected_result: Cột ẩn nhưng có trong cài đặt cột; request query mang orders và filters tương ứng
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-012
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-011
          - TASK-012
      - id: AC-014
        type: acceptance-criterion
        statement: Xoá một dòng và xoá 3 dòng đã chọn → Mỗi lần có hộp xác nhận; adapter.delete được gọi 1 lần rồi 3 lần tuần tự; list reload sau khi xoá
        behavior: Xoá một dòng và xoá 3 dòng đã chọn
        expected_result: Mỗi lần có hộp xác nhận; adapter.delete được gọi 1 lần rồi 3 lần tuần tự; list reload sau khi xoá
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-012
        task_refs:
          - TASK-011
          - TASK-012
      - id: AC-015
        type: acceptance-criterion
        statement: >-
          Mở create, update, detail với schema không có layout form và có property system, property updatable: false → Create không có system; update không có
          system và property không updatable, payload update không chứa chúng; detail ở chế độ viewed và có property system; field có label/type/options lấy từ
          general
        behavior: 'Mở create, update, detail với schema không có layout form và có property system, property updatable: false'
        expected_result: >-
          Create không có system; update không có system và property không updatable, payload update không chứa chúng; detail ở chế độ viewed và có property
          system; field có label/type/options lấy từ general
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-013
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-011
          - TASK-012
      - id: AC-016
        type: acceptance-criterion
        statement: >-
          Mở select relation với entity có search riêng, với adapter có search, và với adapter chỉ có query → Lần lượt gọi search của entity, search của
          adapter, query với filter CONTAIN trên searchFields/displayField; nhãn giá trị đã chọn lấy qua IN trên valueField
        behavior: Mở select relation với entity có search riêng, với adapter có search, và với adapter chỉ có query
        expected_result: >-
          Lần lượt gọi search của entity, search của adapter, query với filter CONTAIN trên searchFields/displayField; nhãn giá trị đã chọn lấy qua IN trên
          valueField
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-013
          - R-004
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-008
          - TASK-009
      - id: AC-017
        type: acceptance-criterion
        statement: >-
          beforeSave thêm field vào payload và afterSave được khai → adapter.create/update nhận payload đã sửa; afterSave chạy đúng một lần sau khi lưu thành
          công và không chạy khi lưu lỗi
        behavior: beforeSave thêm field vào payload và afterSave được khai
        expected_result: adapter.create/update nhận payload đã sửa; afterSave chạy đúng một lần sau khi lưu thành công và không chạy khi lưu lỗi
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-014
        task_refs:
          - TASK-008
          - TASK-009
      - id: AC-018
        type: acceptance-criterion
        statement: >-
          provideSdGenericEntity khai rowCommands có permission và visible, hiddenDefaults: [delete] → Command chỉ hiện khi có quyền và visible trả true, run
          nhận ctx có row và reload; command delete có sẵn bị ẩn
        behavior: 'provideSdGenericEntity khai rowCommands có permission và visible, hiddenDefaults: [delete]'
        expected_result: Command chỉ hiện khi có quyền và visible trả true, run nhận ctx có row và reload; command delete có sẵn bị ẩn
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-015
        task_refs:
          - TASK-011
          - TASK-012
      - id: AC-019
        type: acceptance-criterion
        statement: >-
          Import file 3 dòng với upsertKey code (1 dòng code đã tồn tại), một ô enum ghi bằng label, một ô relation ghi theo displayField → Dòng đã tồn tại gọi
          update, hai dòng còn lại gọi create; enum và relation được đổi sang value/id; không quá 5 request chạy đồng thời; kết quả từng dòng hiện trong
          sd-import-excel
        behavior: Import file 3 dòng với upsertKey code (1 dòng code đã tồn tại), một ô enum ghi bằng label, một ô relation ghi theo displayField
        expected_result: >-
          Dòng đã tồn tại gọi update, hai dòng còn lại gọi create; enum và relation được đổi sang value/id; không quá 5 request chạy đồng thời; kết quả từng
          dòng hiện trong sd-import-excel
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-016
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-008
          - TASK-009
          - TASK-011
          - TASK-012
      - id: AC-020
        type: acceptance-criterion
        statement: >-
          Ở màn chỉnh cấu hình, xoá property đang dùng làm upsertKey khỏi import rồi bấm Lưu; sau đó sửa label hợp lệ rồi bấm Lưu → Lần đầu bị chặn và hiện lỗi;
          lần sau gọi configuration.set(entity, schema) với label mới; ô key và dataType không sửa được
        behavior: Ở màn chỉnh cấu hình, xoá property đang dùng làm upsertKey khỏi import rồi bấm Lưu; sau đó sửa label hợp lệ rồi bấm Lưu
        expected_result: Lần đầu bị chặn và hiện lỗi; lần sau gọi configuration.set(entity, schema) với label mới; ô key và dataType không sửa được
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-017
          - R-008
        task_refs:
          - TASK-013
          - TASK-014
      - id: AC-021
        type: acceptance-criterion
        statement: >-
          Render schema form-generic có field time và json; nhập '25:00' và chuỗi JSON sai → Hai field báo lỗi validation; giá trị đúng được lưu là chuỗi HH:mm
          và JSON đã parse; builder có hai loại field này trong palette; spec form-generic hiện có vẫn xanh
        behavior: Render schema form-generic có field time và json; nhập '25:00' và chuỗi JSON sai
        expected_result: >-
          Hai field báo lỗi validation; giá trị đúng được lưu là chuỗi HH:mm và JSON đã parse; builder có hai loại field này trong palette; spec form-generic
          hiện có vẫn xanh
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-018
        task_refs:
          - TASK-001
          - TASK-002
          - TASK-003
          - TASK-004
      - id: AC-022
        type: acceptance-criterion
        statement: Mở trang demo module generic trên Showcase → Trang hiện list từ adapter mock và mở được create/detail; guard example/registry của Showcase xanh
        behavior: Mở trang demo module generic trên Showcase
        expected_result: Trang hiện list từ adapter mock và mở được create/detail; guard example/registry của Showcase xanh
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-019
        task_refs:
          - TASK-004
          - TASK-016
          - TASK-017
      - id: AC-023
        type: acceptance-criterion
        statement: >-
          Chạy npm run sync rồi npm run check:sync và build sdcorejs-angular trên v19–v22 → check:sync xanh, bốn workspace build không lỗi; CHANGELOG có mục
          Unreleased cho module generic
        behavior: Chạy npm run sync rồi npm run check:sync và build sdcorejs-angular trên v19–v22
        expected_result: check:sync xanh, bốn workspace build không lỗi; CHANGELOG có mục Unreleased cho module generic
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-020
        task_refs:
          - TASK-015
          - TASK-018
          - TASK-019
      - id: AC-024
        type: acceptance-criterion
        statement: >-
          Chạy spec public-api của entry point modules/generic → Entry point export đúng bốn symbol runtime provideSdGeneric, provideSdGenericEntity,
          sdGenericRoutes, validateSdGenericSchema; không import package riêng của backend nào
        behavior: Chạy spec public-api của entry point modules/generic
        expected_result: >-
          Entry point export đúng bốn symbol runtime provideSdGeneric, provideSdGenericEntity, sdGenericRoutes, validateSdGenericSchema; không import package
          riêng của backend nào
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-001
          - R-002
          - R-003
        task_refs:
          - TASK-001
          - TASK-005
          - TASK-015
          - TASK-016
      - id: A-001
        type: assumption
        statement: Multi-provider khai trong injector con không gộp với injector cha; lib phải tự đi từ injector gần nhất lên root (skipSelf) để tìm adapter/entity.
        evidence_refs: []
        source: inferred
        confidence: high
        status: confirmed
        blocking: false
        consequence_if_wrong: Có thể đọc trực tiếp token multi thay vì đi theo chuỗi injector; thiết kế vẫn đúng nhưng thừa code.
        validation_method: Test TDD cho AC-002 với injector root + lazy.
        owner: sdcorejs-execute-plan
        rationale: Hành vi chuẩn của Angular DI; đã gặp ở SD_API_CONFIG (SdApiHandlerRegistry).
        impacted_refs:
          - R-005
      - id: A-002
        type: assumption
        statement: sd-table server truyền PagingReq (filters, orders, pageSize, pageNumber) đủ để chuyển thẳng sang adapter.query, gồm cả external filter.
        evidence_refs: []
        source: inferred
        confidence: medium
        status: proposed
        blocking: false
        consequence_if_wrong: Cần lớp chuyển SdTableFilterRequest sang Filter trong module generic.
        validation_method: Test TDD cho AC-013 đối chiếu request thực tế sd-table phát ra.
        owner: sdcorejs-execute-plan
        rationale: 'components/table/src/models/table-option.model.ts:198 khai items(filterRequest, pagingReq: PagingReq).'
        impacted_refs:
          - R-012
      - id: A-003
        type: assumption
        statement: sd-import-excel accept(items) trả SdImportExcelValidation[] đủ để báo kết quả từng dòng sau khi gọi create/update.
        evidence_refs: []
        source: inferred
        confidence: medium
        status: proposed
        blocking: false
        consequence_if_wrong: Cần thêm hiển thị kết quả riêng sau bước accept.
        validation_method: Test cho AC-019.
        owner: sdcorejs-execute-plan
        rationale: components/import-excel/src/import-excel.model.ts:17.
        impacted_refs:
          - R-016
      - id: A-004
        type: assumption
        statement: sd-code-editor dùng được làm control (model/ControlValueAccessor) bên trong renderer form-generic cho field json.
        evidence_refs: []
        source: inferred
        confidence: medium
        status: proposed
        blocking: false
        consequence_if_wrong: Field json cần bọc adapter control riêng quanh code-editor.
        validation_method: Test cho AC-021.
        owner: sdcorejs-execute-plan
        rationale: components/code-editor/src/code-editor.component.ts có model/CVA.
        impacted_refs:
          - R-018
      - id: A-005
        type: assumption
        statement: Khoá localStorage mặc định là sd-generic:configuration:<module>.<entity>; cấu hình chỉ có hiệu lực trên trình duyệt đó.
        evidence_refs: []
        source: defaulted
        confidence: high
        status: proposed
        blocking: false
        consequence_if_wrong: Đổi tên khoá trước release, chưa có dữ liệu cũ.
        validation_method: Người dùng duyệt spec; test cho AC-005.
        owner: user
        rationale: Người dùng chốt mặc định localStorage; tên khoá do spec đặt.
        impacted_refs:
          - R-006
      - id: D-001
        type: decision
        statement: >-
          Module generic đặt ở repo nào? → @sdcorejs/angular, entry point @sdcorejs/angular/modules/generic, không phụ thuộc backend; adapter backend OMD nằm
          ngoài repo
        question: Module generic đặt ở repo nào?
        selected_value: '@sdcorejs/angular, entry point @sdcorejs/angular/modules/generic, không phụ thuộc backend; adapter backend OMD nằm ngoài repo'
        source: explicit-user
        status: approved
        blocking: true
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: form-generic 3.0 đã ở đây; nguyên tắc adapter không phụ thuộc backend.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-001
          - AC-024
        task_refs:
          - TASK-015
          - TASK-016
      - id: D-002
        type: decision
        statement: >-
          Ghép SdGenericSchema với form-generic thế nào? → general.properties là nguồn duy nhất; detail/create/update chứa layout SdFormGenericSchema tham chiếu
          property theo key, lib điền type/label/options/validation lúc render; thiếu layout thì tự sinh
        question: Ghép SdGenericSchema với form-generic thế nào?
        selected_value: >-
          general.properties là nguồn duy nhất; detail/create/update chứa layout SdFormGenericSchema tham chiếu property theo key, lib điền
          type/label/options/validation lúc render; thiếu layout thì tự sinh
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Tránh cấu hình trùng lặp (pain point lib-core-commerce) mà vẫn dùng đủ form-generic và sd-form-builder.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-002
          - R-013
          - AC-015
        task_refs:
          - TASK-005
          - TASK-007
          - TASK-011
      - id: D-003
        type: decision
        statement: >-
          Tên gọi trong model và adapter? → properties (không phải fields), adapter.detail (không phải get), configuration: { get, set }, entity (không phải
          typeCode)
        question: Tên gọi trong model và adapter?
        selected_value: 'properties (không phải fields), adapter.detail (không phải get), configuration: { get, set }, entity (không phải typeCode)'
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Theo convention API của người dùng.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-002
          - R-004
          - AC-001
        task_refs:
          - TASK-005
      - id: D-004
        type: decision
        statement: Định dạng route? → generic/:module/:entity, /create, /:id/detail, /:id/update, /configuration (id đứng trước action)
        question: Định dạng route?
        selected_value: generic/:module/:entity, /create, /:id/detail, /:id/update, /configuration (id đứng trước action)
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Mỗi entity một cấu hình nên route mang thẳng module/entity, không cần tách chuỗi.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-010
          - AC-011
          - AC-012
        task_refs:
          - TASK-010
          - TASK-011
      - id: D-005
        type: decision
        statement: >-
          Page hay side-drawer quyết định ở đâu? → Callback display(args) ở provideSdGenericEntity rồi adapter, mặc định 'page'; side-drawer điều khiển bằng
          route
        question: Page hay side-drawer quyết định ở đâu?
        selected_value: Callback display(args) ở provideSdGenericEntity rồi adapter, mặc định 'page'; side-drawer điều khiển bằng route
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Consumer quyết theo schema, ví dụ số property; deep link và back hoạt động.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-010
          - AC-011
        task_refs:
          - TASK-010
          - TASK-011
      - id: D-006
        type: decision
        statement: 'Phạm vi giao lần này? → Làm hết một lần: runtime CRUD, import, màn chỉnh cấu hình, action mở rộng, form-generic time/json, Showcase, docs'
        question: Phạm vi giao lần này?
        selected_value: 'Làm hết một lần: runtime CRUD, import, màn chỉnh cấu hình, action mở rộng, form-generic time/json, Showcase, docs'
        source: explicit-user
        status: approved
        blocking: true
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: Người dùng chọn phương án 3.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-012
          - R-016
          - R-017
          - R-018
          - R-019
        task_refs:
          - TASK-011
          - TASK-012
          - TASK-017
      - id: D-007
        type: decision
        statement: >-
          provide một hay nhiều lần? → Nhiều lần ở root và lazy route; tra injector gần nhất lên root, gần nhất thắng; không dùng registry đọc field private của
          router
        question: provide một hay nhiều lần?
        selected_value: Nhiều lần ở root và lazy route; tra injector gần nhất lên root, gần nhất thắng; không dùng registry đọc field private của router
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Module tự provide adapter; registry root chỉ thấy module đã load và phụ thuộc field private.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-005
          - AC-002
          - AC-003
        task_refs:
          - TASK-008
          - TASK-009
      - id: D-008
        type: decision
        statement: time và json? → Thêm field type time và json vào form-generic (json dùng code-editor), chỉ thêm mới
        question: time và json?
        selected_value: Thêm field type time và json vào form-generic (json dùng code-editor), chỉ thêm mới
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Phạm vi làm hết một lần; tránh map tạm kém chính xác.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-018
          - AC-021
        task_refs:
          - TASK-002
          - TASK-003
          - TASK-004
      - id: D-009
        type: decision
        statement: Quan hệ OneToMany và relation.type? → Chỉ multi-select, không bảng con; bỏ relation.type, multiple quyết định một/nhiều
        question: Quan hệ OneToMany và relation.type?
        selected_value: Chỉ multi-select, không bảng con; bỏ relation.type, multiple quyết định một/nhiều
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Giữ đơn giản như lib-core-commerce; bảng con để sau.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-003
          - AC-016
        task_refs:
          - TASK-005
          - TASK-007
      - id: D-010
        type: decision
        statement: search và history? → search? tuỳ chọn ở adapter và ở entity, fallback query CONTAIN/IN; history không thuộc lib
        question: search và history?
        selected_value: search? tuỳ chọn ở adapter và ở entity, fallback query CONTAIN/IN; history không thuộc lib
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Backend có API search riêng để bảo đảm hiệu năng; history mỗi dự án tự làm.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-004
          - R-013
          - AC-016
        task_refs:
          - TASK-008
          - TASK-009
      - id: D-011
        type: decision
        statement: >-
          Tuỳ biến theo entity ở đâu? → Provider riêng provideSdGenericEntity { module, entity, schema(base), search?, display?, hooks?, listActions?,
          rowCommands?, bulkActions?, detailActions?, hiddenDefaults? }; schema dạng hàm thay vì object partial
        question: Tuỳ biến theo entity ở đâu?
        selected_value: >-
          Provider riêng provideSdGenericEntity { module, entity, schema(base), search?, display?, hooks?, listActions?, rowCommands?, bulkActions?,
          detailActions?, hiddenDefaults? }; schema dạng hàm thay vì object partial
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Adapter trả schema mặc định theo entity; deep-merge mảng không rõ nghĩa.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-006
          - R-014
          - R-015
          - AC-004
          - AC-017
          - AC-018
        task_refs:
          - TASK-005
          - TASK-008
          - TASK-009
      - id: D-012
        type: decision
        statement: >-
          Lưu cấu hình thế nào? → configuration: { get(entity), set(entity, schema) } trên adapter, mỗi entity một cấu hình, null là chưa có; adapter không khai
          thì localStorage
        question: Lưu cấu hình thế nào?
        selected_value: 'configuration: { get(entity), set(entity, schema) } trên adapter, mỗi entity một cấu hình, null là chưa có; adapter không khai thì localStorage'
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Không cần nhận diện configurationId; server hay theo người dùng do consumer quyết.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-006
          - AC-005
        task_refs:
          - TASK-008
          - TASK-009
          - TASK-013
      - id: D-013
        type: decision
        statement: >-
          Cấu hình đã lưu không hợp lệ thì sao? → Tham chiếu treo tự bỏ; lỗi shape/version dùng mặc định + console.warn + banner cho người có quyền
          CONFIGURATION; lưu có lỗi thì chặn
        question: Cấu hình đã lưu không hợp lệ thì sao?
        selected_value: Tham chiếu treo tự bỏ; lỗi shape/version dùng mặc định + console.warn + banner cho người có quyền CONFIGURATION; lưu có lỗi thì chặn
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Bước validate quan trọng; trang không chết vì cấu hình hỏng.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-008
          - AC-007
          - AC-020
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-013
      - id: D-014
        type: decision
        statement: Tiêu đề đặt ở đâu? → Trong từng section list/create/update/detail, template ${key} có validate, render dạng text
        question: Tiêu đề đặt ở đâu?
        selected_value: Trong từng section list/create/update/detail, template ${key} có validate, render dạng text
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Người dùng yêu cầu; tránh XSS như htmlTemplate cũ.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-009
          - AC-009
        task_refs:
          - TASK-006
          - TASK-007
      - id: D-015
        type: decision
        statement: >-
          Mã quyền và cơ chế kiểm tra? → <MODULE>_<ENTITY>_C_GENERIC_{LIST|DETAIL|CREATE|UPDATE|DELETE|IMPORT|CONFIGURATION} qua SdPermissionService, có
          permission: false
        question: Mã quyền và cơ chế kiểm tra?
        selected_value: '<MODULE>_<ENTITY>_C_GENERIC_{LIST|DETAIL|CREATE|UPDATE|DELETE|IMPORT|CONFIGURATION} qua SdPermissionService, có permission: false'
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Định dạng người dùng đưa, thêm CONFIGURATION cho màn chỉnh cấu hình.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-011
          - AC-010
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-010
      - id: D-016
        type: decision
        statement: >-
          Luật import? → Template từ import.columns hoặc property insertable; enum theo value/label; relation theo matchField qua search; upsert theo upsertKey;
          tối đa 5 request song song; chỉ quyền IMPORT
        question: Luật import?
        selected_value: >-
          Template từ import.columns hoặc property insertable; enum theo value/label; relation theo matchField qua search; upsert theo upsertKey; tối đa 5
          request song song; chỉ quyền IMPORT
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Dùng lại create/update của adapter và sd-import-excel có sẵn.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-016
          - AC-019
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-008
          - TASK-009
      - id: D-017
        type: decision
        statement: >-
          Cách viết test? → TDD cho logic (tra adapter/entity, dựng schema, merge, validate, template, fallback search, mã quyền, import upsert); viết test sau
          cho UI và Showcase
        question: Cách viết test?
        selected_value: TDD cho logic (tra adapter/entity, dựng schema, merge, validate, template, fallback search, mã quyền, import upsert); viết test sau cho UI và Showcase
        source: explicit-user
        status: approved
        blocking: true
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: Logic thuần có giá trị TDD cao; UI chủ yếu là nối component.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-005
          - R-007
          - R-008
        task_refs:
          - TASK-002
          - TASK-006
          - TASK-008
          - TASK-012
          - TASK-014
      - id: D-018
        type: decision
        statement: Release? → Suffix minor kế tiếp 3.2, chỉ thêm mới, CHANGELOG Unreleased; tag/publish theo release ritual và cần người dùng cho phép riêng
        question: Release?
        selected_value: Suffix minor kế tiếp 3.2, chỉ thêm mới, CHANGELOG Unreleased; tag/publish theo release ritual và cần người dùng cho phép riêng
        source: explicit-user
        status: approved
        blocking: true
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: Không phá vỡ API consumer.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-020
          - AC-023
        task_refs:
          - TASK-018
          - TASK-019
      - id: D-019
        type: decision
        statement: >-
          Phân tầng trong modules/generic? → models (type) → core (hàm thuần: merge, validate, dựng mặc định, tiêu đề, mã quyền, dựng form, map cột, kế hoạch
          import, request search) → registry (provider, scope) → services (schema, data, quyền, import) → routes/pages/components; tầng dưới không import tầng
          trên
        question: Phân tầng trong modules/generic?
        selected_value: >-
          models (type) → core (hàm thuần: merge, validate, dựng mặc định, tiêu đề, mã quyền, dựng form, map cột, kế hoạch import, request search) → registry
          (provider, scope) → services (schema, data, quyền, import) → routes/pages/components; tầng dưới không import tầng trên
        source: approved-architecture
        status: approved
        blocking: true
        scope: module
        owner_repository_id: sdcorejs-angular
        rationale: Logic dùng chung nằm ở hàm thuần để TDD và để list/form/import/màn cấu hình không tự quyết khác nhau.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - INV-002
          - INV-003
          - INV-007
          - R-001
        task_refs:
          - TASK-005
          - TASK-007
          - TASK-015
      - id: D-020
        type: decision
        statement: >-
          Cơ chế registry cho provider gọi nhiều lần? → Mỗi injector có một scope node dựng từ multi token cùng tầng (self) và scope cha (skipSelf); tra module
          rồi module+entity từ scope gần nhất lên root; trùng module (hoặc module+entity) trong cùng một injector là lỗi, kiểm ngay khi injector được tạo bằng
          provideEnvironmentInitializer; option permission lấy từ scope gần nhất có khai
        question: Cơ chế registry cho provider gọi nhiều lần?
        selected_value: >-
          Mỗi injector có một scope node dựng từ multi token cùng tầng (self) và scope cha (skipSelf); tra module rồi module+entity từ scope gần nhất lên root;
          trùng module (hoặc module+entity) trong cùng một injector là lỗi, kiểm ngay khi injector được tạo bằng provideEnvironmentInitializer; option
          permission lấy từ scope gần nhất có khai
        source: approved-architecture
        status: approved
        blocking: true
        scope: module
        owner_repository_id: sdcorejs-angular
        rationale: >-
          Multi token ở injector con không gộp với cha; trùng cùng tầng là mơ hồ nên báo lỗi (làm rõ R-005: bao trùm trường hợp trùng trong một lần gọi); kiểm
          sớm để AC-003 ném lỗi lúc khởi tạo, không đợi lần điều hướng đầu.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - INV-001
          - R-005
          - AC-003
        task_refs:
          - TASK-008
          - TASK-009
      - id: D-021
        type: decision
        statement: >-
          Ai giữ schema hiệu lực và cache? → SdGenericSchemaService ở injector môi trường của route generic giữ Promise schema theo module.entity; resolver của
          route nạp schema trước khi list/form/màn cấu hình kích hoạt; lưu cấu hình thì xoá cache entity đó
        question: Ai giữ schema hiệu lực và cache?
        selected_value: >-
          SdGenericSchemaService ở injector môi trường của route generic giữ Promise schema theo module.entity; resolver của route nạp schema trước khi
          list/form/màn cấu hình kích hoạt; lưu cấu hình thì xoá cache entity đó
        source: approved-architecture
        status: approved
        blocking: true
        scope: module
        owner_repository_id: sdcorejs-angular
        rationale: Một nơi duy nhất dựng 3 lớp schema; tránh mỗi trang tự gọi adapter.schema.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - INV-002
          - R-006
          - AC-004
        task_refs:
          - TASK-008
          - TASK-009
      - id: D-022
        type: decision
        statement: >-
          Select relation lấy dữ liệu từ đâu khi form-generic chỉ nhận catalog tĩnh? → sdGenericRoutes() đăng ký provideSdFormGeneric({ catalogs:
          [sd-generic-relation] }) ở injector môi trường của route generic; field relation dùng catalog này với params hằng { module, entity, valueField,
          displayField, searchFields (nối bằng dấu phẩy) } để cache của form-generic phân biệt từng relation; callback của catalog gọi SdGenericDataService qua
          injector môi trường bắt bằng provideEnvironmentInitializer; vì option value của form-generic là chuỗi, SdGenericDataService đổi giá trị relation về
          kiểu gốc (theo dữ liệu đã tải) trước khi lưu
        question: Select relation lấy dữ liệu từ đâu khi form-generic chỉ nhận catalog tĩnh?
        selected_value: >-
          sdGenericRoutes() đăng ký provideSdFormGeneric({ catalogs: [sd-generic-relation] }) ở injector môi trường của route generic; field relation dùng
          catalog này với params hằng { module, entity, valueField, displayField, searchFields (nối bằng dấu phẩy) } để cache của form-generic phân biệt từng
          relation; callback của catalog gọi SdGenericDataService qua injector môi trường bắt bằng provideEnvironmentInitializer; vì option value của
          form-generic là chuỗi, SdGenericDataService đổi giá trị relation về kiểu gốc (theo dữ liệu đã tải) trước khi lưu
        source: approved-architecture
        status: approved
        blocking: true
        scope: module
        owner_repository_id: sdcorejs-angular
        rationale: >-
          Chỉ dùng API public của form-generic (catalog và templates cố định lúc provideSdFormGeneric chạy nên không thể một catalog theo id <module>.<entity>
          như phần Architecture của spec mô tả); một catalog phục vụ mọi relation. Hệ quả: cấu hình form-generic của portal ở root không áp lên form của module
          generic.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - INV-008
          - R-013
          - AC-016
        task_refs:
          - TASK-008
          - TASK-009
      - id: D-023
        type: decision
        statement: >-
          Tab Form của màn cấu hình đưa property vào layout thế nào? → sd-form-builder dùng [(schema)]; panel danh sách property chưa có trong layout, bấm để
          thêm field đã điền sẵn vào schema (builder nạp lại schema nên mất undo và vùng chọn hiện tại); không dùng templates của form-generic
        question: Tab Form của màn cấu hình đưa property vào layout thế nào?
        selected_value: >-
          sd-form-builder dùng [(schema)]; panel danh sách property chưa có trong layout, bấm để thêm field đã điền sẵn vào schema (builder nạp lại schema nên
          mất undo và vùng chọn hiện tại); không dùng templates của form-generic
        source: approved-architecture
        status: approved
        blocking: true
        scope: module
        owner_repository_id: sdcorejs-angular
        rationale: >-
          templates cố định lúc provideSdFormGeneric chạy nên không sinh theo entity được; panel property đáp ứng "palette là properties" của R-017 mà không mở
          rộng public API form-generic ngoài time/json.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - INV-015
          - R-017
          - AC-020
        task_refs:
          - TASK-013
          - TASK-014
      - id: D-024
        type: decision
        statement: >-
          Cây route và cách hiện page/drawer? → generic/:module/:entity là trang list có router-outlet cho create, :id/detail, :id/update; mọi route của
          sdGenericRoutes() khai data.permission = SD_PERMISSION_PUBLIC để SdPermissionGuard của portal không chặn, guard của module generic kiểm mã thật bằng
          hasPermission(code) với key mặc định; host form tự chọn page hoặc drawer sau khi schema đã resolve; drawer gọi open() sau khi render và (sdClosed)
          điều hướng về route list; page thì list ẩn nội dung khi outlet kích hoạt; trang list phản ứng khi :module/:entity đổi vì component được dùng lại;
          configuration là route anh em
        question: Cây route và cách hiện page/drawer?
        selected_value: >-
          generic/:module/:entity là trang list có router-outlet cho create, :id/detail, :id/update; mọi route của sdGenericRoutes() khai data.permission =
          SD_PERMISSION_PUBLIC để SdPermissionGuard của portal không chặn, guard của module generic kiểm mã thật bằng hasPermission(code) với key mặc định; host
          form tự chọn page hoặc drawer sau khi schema đã resolve; drawer gọi open() sau khi render và (sdClosed) điều hướng về route list; page thì list ẩn nội
          dung khi outlet kích hoạt; trang list phản ứng khi :module/:entity đổi vì component được dùng lại; configuration là route anh em
        source: approved-architecture
        status: approved
        blocking: true
        scope: module
        owner_repository_id: sdcorejs-angular
        rationale: List giữ nguyên trạng thái sd-table vì không bị huỷ khi mở drawer; SdPermissionGuard.canActivateChild từ chối route không có data.permission.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - INV-005
          - INV-009
          - R-010
          - AC-011
          - AC-012
        task_refs:
          - TASK-010
          - TASK-011
      - id: D-025
        type: decision
        statement: >-
          Ai gọi adapter? → SdGenericDataService là nơi duy nhất gọi query/detail/create/update/delete/search, áp hooks beforeSave/afterSave, thứ tự search
          entity → adapter → query và giới hạn 5 request song song cho import; SdGenericSchemaService là nơi duy nhất gọi schema và configuration.get/set
        question: Ai gọi adapter?
        selected_value: >-
          SdGenericDataService là nơi duy nhất gọi query/detail/create/update/delete/search, áp hooks beforeSave/afterSave, thứ tự search entity → adapter →
          query và giới hạn 5 request song song cho import; SdGenericSchemaService là nơi duy nhất gọi schema và configuration.get/set
        source: approved-architecture
        status: approved
        blocking: true
        scope: module
        owner_repository_id: sdcorejs-angular
        rationale: Mỗi nhóm hàm của adapter có đúng một cổng để hooks, fallback, validate và cache luôn đúng ở mọi màn.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - INV-002
          - INV-008
          - INV-014
          - R-014
          - AC-017
        task_refs:
          - TASK-008
          - TASK-009
      - id: D-026
        type: decision
        statement: >-
          Nhãn giao diện của module? → Thêm khoá core.module.generic.* vào i18n sẵn có, đủ mọi file ngôn ngữ (en, vi, ja, ko, zh) vì chúng có kiểu Record<keyof
          EN_MESSAGES>; hiển thị qua sdTranslate
        question: Nhãn giao diện của module?
        selected_value: >-
          Thêm khoá core.module.generic.* vào i18n sẵn có, đủ mọi file ngôn ngữ (en, vi, ja, ko, zh) vì chúng có kiểu Record<keyof EN_MESSAGES>; hiển thị qua
          sdTranslate
        source: approved-architecture
        status: approved
        blocking: true
        scope: module
        owner_repository_id: sdcorejs-angular
        rationale: Theo quy ước core.<area>.* (vd core.module.layout.*) của thư viện.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - INV-010
          - R-001
        task_refs:
          - TASK-001
      - id: D-027
        type: decision
        statement: >-
          Hình dạng của validateSdGenericSchema? → validateSdGenericSchema(stored: unknown, base: SdGenericSchema) trả SdGenericSchemaIssue[] { code, severity,
          path, message }, cùng cách với validateSdApiContract
        question: Hình dạng của validateSdGenericSchema?
        selected_value: >-
          validateSdGenericSchema(stored: unknown, base: SdGenericSchema) trả SdGenericSchemaIssue[] { code, severity, path, message }, cùng cách với
          validateSdApiContract
        source: approved-architecture
        status: approved
        blocking: true
        scope: module
        owner_repository_id: sdcorejs-angular
        rationale: Thống nhất với validator public đã có; stored có thể là JSON bất kỳ đọc từ server/localStorage.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - INV-003
          - R-008
          - AC-008
        task_refs:
          - TASK-005
          - TASK-006
          - TASK-007
      - id: D-028
        type: decision
        statement: >-
          Có đưa modules/generic vào barrel modules không? → Có, như auth/layout/permission/keycloak/icon; build v19 kiểm không có vòng phụ thuộc và không trùng
          tên export
        question: Có đưa modules/generic vào barrel modules không?
        selected_value: Có, như auth/layout/permission/keycloak/icon; build v19 kiểm không có vòng phụ thuộc và không trùng tên export
        source: approved-architecture
        status: approved
        blocking: true
        scope: module
        owner_repository_id: sdcorejs-angular
        rationale: Giữ quy ước barrel của thư viện; entry gốc @sdcorejs/angular cũng export module.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - INV-010
          - R-001
          - AC-024
        task_refs:
          - TASK-015
      - id: D-029
        type: decision
        statement: Nguồn quyền theo key riêng cho từng module generic? → Hoãn; module generic gọi hasPermission(code) với key mặc định của portal
        question: Nguồn quyền theo key riêng cho từng module generic?
        selected_value: Hoãn; module generic gọi hasPermission(code) với key mặc định của portal
        source: approved-architecture
        status: deferred
        blocking: false
        scope: module
        owner_repository_id: sdcorejs-angular
        rationale: 'Spec chỉ có permission: boolean; thêm option key là mở rộng public API ngoài phạm vi đã duyệt.'
        supersedes: null
        revisit_condition: Khi một portal cần nguồn quyền SdPermissionService khác nhau (key khác nhau) cho từng module generic.
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - INV-005
          - R-011
        task_refs:
          - TASK-010
      - id: D-030
        type: decision
        statement: >-
          Ranh giới kiểm chứng nào áp dụng? → none: thư viện chỉ ẩn UI và chặn route ở client; kiểm quyền thật thuộc backend của adapter (ST-001), nên không có
          bằng chứng từ chối phía server trong repo này
        question: Ranh giới kiểm chứng nào áp dụng?
        selected_value: none
        source: approved-plan
        status: approved
        blocking: true
        scope: module
        owner_repository_id: sdcorejs-angular
        rationale: Thư viện UI không sở hữu API; quyền phía server do backend của consumer kiểm (ST-001).
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
        validation_boundary:
          kind: none
          source_refs:
            - R-001
            - R-002
            - R-003
            - R-004
            - R-005
            - R-006
            - R-007
            - R-008
            - R-009
            - R-010
            - R-011
            - R-012
            - R-013
            - R-014
            - R-015
            - R-016
            - R-017
            - R-018
            - R-019
            - R-020
            - AC-001
            - AC-002
            - AC-003
            - AC-004
            - AC-005
            - AC-006
            - AC-007
            - AC-008
            - AC-009
            - AC-010
            - AC-011
            - AC-012
            - AC-013
            - AC-014
            - AC-015
            - AC-016
            - AC-017
            - AC-018
            - AC-019
            - AC-020
            - AC-021
            - AC-022
            - AC-023
            - AC-024
            - INV-001
            - INV-002
            - INV-003
            - INV-004
            - INV-005
            - INV-006
            - INV-007
            - INV-008
            - INV-009
            - INV-010
            - INV-011
            - INV-012
            - INV-013
            - INV-014
            - INV-015
        task_refs:
          - TASK-015
          - TASK-019
      - id: INV-001
        type: invariant
        statement: >-
          Mọi màn (list, form, import, màn cấu hình, catalog relation) chỉ lấy adapter và cấu hình entity qua một resolver: scope gần nhất thắng, trùng cùng
          injector thì ném lỗi.
        protected_refs:
          - R-005
          - AC-002
          - AC-003
        task_refs:
          - TASK-008
          - TASK-009
        evidence_refs:
          - EVIDENCE-008
          - EVIDENCE-009
      - id: INV-002
        type: invariant
        statement: >-
          Schema hiệu lực chỉ được dựng ở SdGenericSchemaService bằng hàm thuần: adapter.schema → entity.schema(base) → cấu hình đã lưu (validate rồi merge);
          chỉ SdGenericSchemaService gọi adapter.schema và configuration.get/set (hoặc localStorage khoá sd-generic:configuration:<module>.<entity>).
        protected_refs:
          - R-006
          - R-007
          - AC-001
          - AC-004
          - AC-005
          - AC-006
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-008
          - TASK-009
        evidence_refs:
          - EVIDENCE-006
          - EVIDENCE-007
          - EVIDENCE-008
          - EVIDENCE-009
      - id: INV-003
        type: invariant
        statement: >-
          validateSdGenericSchema là hàm thuần duy nhất kiểm cấu hình; bước load và nút Lưu đều dùng nó; lỗi shape/version thì dùng mặc định, tham chiếu treo bị
          merge bỏ, có lỗi thì không gọi configuration.set.
        protected_refs:
          - R-008
          - AC-007
          - AC-008
          - AC-020
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-008
          - TASK-009
          - TASK-013
          - TASK-014
        evidence_refs:
          - EVIDENCE-006
          - EVIDENCE-007
          - EVIDENCE-008
          - EVIDENCE-009
          - EVIDENCE-013
          - EVIDENCE-014
      - id: INV-004
        type: invariant
        statement: >-
          SdGenericSchema v1 chỉ chứa dữ liệu JSON (không function); function (schema, search, display, hooks, action) chỉ nằm ở provider; key, dataType,
          enums[].value, relation.entity luôn lấy từ schema hiện tại.
        protected_refs:
          - R-002
          - R-003
          - AC-006
          - AC-024
        task_refs:
          - TASK-005
          - TASK-015
        evidence_refs:
          - EVIDENCE-005
          - EVIDENCE-015
      - id: INV-005
        type: invariant
        statement: >-
          Mã quyền chỉ sinh từ một hàm thuần <MODULE>_<ENTITY>_C_GENERIC_<ACTION> viết hoa; guard route, hiển thị action và banner cấu hình lỗi đều dùng hàm đó;
          permission: false bỏ qua cả ba; mọi route của sdGenericRoutes() có data.permission = SD_PERMISSION_PUBLIC để guard của portal không chặn, còn guard
          của module generic kiểm mã thật.
        protected_refs:
          - R-011
          - AC-007
          - AC-010
          - AC-018
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-008
          - TASK-009
          - TASK-010
          - TASK-011
          - TASK-012
        evidence_refs:
          - EVIDENCE-006
          - EVIDENCE-007
          - EVIDENCE-008
          - EVIDENCE-009
          - EVIDENCE-010
          - EVIDENCE-011
          - EVIDENCE-012
      - id: INV-006
        type: invariant
        statement: >-
          Tiêu đề chỉ được parse/render bằng một hàm thuần; kết quả gắn vào DOM bằng nội suy text, không innerHTML; list.title và create.title không có
          placeholder.
        protected_refs:
          - R-009
          - AC-009
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-011
          - TASK-012
        evidence_refs:
          - EVIDENCE-006
          - EVIDENCE-007
          - EVIDENCE-011
          - EVIDENCE-012
      - id: INV-007
        type: invariant
        statement: >-
          Layout form của mỗi action do một hàm thuần dựng: field lấy type/label/options/validation từ general.properties; create bỏ system và không insertable;
          update bỏ system và không updatable; payload update chỉ gồm property updatable.
        protected_refs:
          - R-013
          - AC-015
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-011
          - TASK-012
        evidence_refs:
          - EVIDENCE-006
          - EVIDENCE-007
          - EVIDENCE-011
          - EVIDENCE-012
      - id: INV-008
        type: invariant
        statement: >-
          Chỉ SdGenericDataService gọi các hàm dữ liệu của adapter (query, detail, create, update, delete, search); mọi lần lưu đi qua beforeSave/afterSave;
          search theo thứ tự entity → adapter → query (CONTAIN để tìm, IN để lấy nhãn); giá trị relation được lưu đúng kiểu gốc; trang và component không gọi
          adapter trực tiếp.
        protected_refs:
          - R-004
          - R-013
          - R-014
          - AC-001
          - AC-016
          - AC-017
        task_refs:
          - TASK-008
          - TASK-009
        evidence_refs:
          - EVIDENCE-008
          - EVIDENCE-009
      - id: INV-009
        type: invariant
        statement: >-
          Kiểu hiển thị chỉ quyết định sau khi schema đã resolve, theo entity.display → adapter.display → 'page'; drawer render trong outlet của list, list
          không bị huỷ, back/đóng đưa về route list.
        protected_refs:
          - R-010
          - AC-011
          - AC-012
        task_refs:
          - TASK-010
          - TASK-011
        evidence_refs:
          - EVIDENCE-010
          - EVIDENCE-011
      - id: INV-010
        type: invariant
        statement: >-
          Entry point modules/generic export đúng 4 symbol runtime; không dùng HttpClient và không import package riêng của backend; chỉ import phần khác của
          thư viện qua entry point public.
        protected_refs:
          - R-001
          - AC-024
        task_refs:
          - TASK-001
          - TASK-015
          - TASK-016
        evidence_refs:
          - EVIDENCE-001
          - EVIDENCE-015
          - EVIDENCE-016
          - EVIDENCE-017
          - EVIDENCE-018
      - id: INV-011
        type: invariant
        statement: form-generic chỉ thêm member time và json vào union field; type và hành vi hiện có không đổi; form-generic không import modules/generic.
        protected_refs:
          - R-018
          - AC-021
        task_refs:
          - TASK-001
          - TASK-002
          - TASK-003
          - TASK-004
        evidence_refs:
          - EVIDENCE-001
          - EVIDENCE-002
          - EVIDENCE-003
          - EVIDENCE-004
      - id: INV-012
        type: invariant
        statement: >-
          Chỉ sửa ở versions/v19 và showcase; v20/v21/v22 chỉ đổi qua npm run sync; check:sync xanh; CHANGELOG có mục Unreleased; guard example/registry của
          Showcase xanh.
        protected_refs:
          - R-019
          - R-020
          - AC-022
          - AC-023
        task_refs:
          - TASK-004
          - TASK-015
          - TASK-016
          - TASK-017
          - TASK-018
          - TASK-019
        evidence_refs:
          - EVIDENCE-004
          - EVIDENCE-017
          - EVIDENCE-018
          - EVIDENCE-019
          - EVIDENCE-020
          - EVIDENCE-021
          - EVIDENCE-022
          - EVIDENCE-023
      - id: INV-013
        type: invariant
        statement: >-
          List dùng sd-table server và chuyển PagingReq sang adapter.query; xoá có xác nhận, xoá nhiều gọi delete tuần tự, sau thay đổi thì reload; action mở
          rộng và action có sẵn đi chung một bước lọc quyền/visible/hiddenDefaults.
        protected_refs:
          - R-012
          - R-015
          - AC-013
          - AC-014
          - AC-018
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-011
          - TASK-012
        evidence_refs:
          - EVIDENCE-006
          - EVIDENCE-007
          - EVIDENCE-011
          - EVIDENCE-012
      - id: INV-014
        type: invariant
        statement: >-
          Import lập kế hoạch create/update bằng hàm thuần theo upsertKey, tra bản ghi đã có theo lô, chạy qua SdGenericDataService với tối đa 5 request song
          song.
        protected_refs:
          - R-016
          - AC-019
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-008
          - TASK-009
          - TASK-011
          - TASK-012
        evidence_refs:
          - EVIDENCE-006
          - EVIDENCE-007
          - EVIDENCE-008
          - EVIDENCE-009
          - EVIDENCE-011
          - EVIDENCE-012
      - id: INV-015
        type: invariant
        statement: Màn cấu hình chỉ ghi qua SdGenericSchemaService.save (validate rồi configuration.set rồi xoá cache); key và dataType không sửa được.
        protected_refs:
          - R-017
          - AC-005
          - AC-020
        task_refs:
          - TASK-013
          - TASK-014
        evidence_refs:
          - EVIDENCE-013
          - EVIDENCE-014
    history:
      - revision: 1
        active:
          - id: R-001
            type: requirement
          - id: R-002
            type: requirement
          - id: R-003
            type: requirement
          - id: R-004
            type: requirement
          - id: R-005
            type: requirement
          - id: R-006
            type: requirement
          - id: R-007
            type: requirement
          - id: R-008
            type: requirement
          - id: R-009
            type: requirement
          - id: R-010
            type: requirement
          - id: R-011
            type: requirement
          - id: R-012
            type: requirement
          - id: R-013
            type: requirement
          - id: R-014
            type: requirement
          - id: R-015
            type: requirement
          - id: R-016
            type: requirement
          - id: R-017
            type: requirement
          - id: R-018
            type: requirement
          - id: R-019
            type: requirement
          - id: R-020
            type: requirement
          - id: AC-001
            type: acceptance-criterion
          - id: AC-002
            type: acceptance-criterion
          - id: AC-003
            type: acceptance-criterion
          - id: AC-004
            type: acceptance-criterion
          - id: AC-005
            type: acceptance-criterion
          - id: AC-006
            type: acceptance-criterion
          - id: AC-007
            type: acceptance-criterion
          - id: AC-008
            type: acceptance-criterion
          - id: AC-009
            type: acceptance-criterion
          - id: AC-010
            type: acceptance-criterion
          - id: AC-011
            type: acceptance-criterion
          - id: AC-012
            type: acceptance-criterion
          - id: AC-013
            type: acceptance-criterion
          - id: AC-014
            type: acceptance-criterion
          - id: AC-015
            type: acceptance-criterion
          - id: AC-016
            type: acceptance-criterion
          - id: AC-017
            type: acceptance-criterion
          - id: AC-018
            type: acceptance-criterion
          - id: AC-019
            type: acceptance-criterion
          - id: AC-020
            type: acceptance-criterion
          - id: AC-021
            type: acceptance-criterion
          - id: AC-022
            type: acceptance-criterion
          - id: AC-023
            type: acceptance-criterion
          - id: AC-024
            type: acceptance-criterion
          - id: A-001
            type: assumption
          - id: A-002
            type: assumption
          - id: A-003
            type: assumption
          - id: A-004
            type: assumption
          - id: A-005
            type: assumption
          - id: D-001
            type: decision
          - id: D-002
            type: decision
          - id: D-003
            type: decision
          - id: D-004
            type: decision
          - id: D-005
            type: decision
          - id: D-006
            type: decision
          - id: D-007
            type: decision
          - id: D-008
            type: decision
          - id: D-009
            type: decision
          - id: D-010
            type: decision
          - id: D-011
            type: decision
          - id: D-012
            type: decision
          - id: D-013
            type: decision
          - id: D-014
            type: decision
          - id: D-015
            type: decision
          - id: D-016
            type: decision
          - id: D-017
            type: decision
          - id: D-018
            type: decision
        tombstones: []
      - revision: 2
        active:
          - id: R-001
            type: requirement
          - id: R-002
            type: requirement
          - id: R-003
            type: requirement
          - id: R-004
            type: requirement
          - id: R-005
            type: requirement
          - id: R-006
            type: requirement
          - id: R-007
            type: requirement
          - id: R-008
            type: requirement
          - id: R-009
            type: requirement
          - id: R-010
            type: requirement
          - id: R-011
            type: requirement
          - id: R-012
            type: requirement
          - id: R-013
            type: requirement
          - id: R-014
            type: requirement
          - id: R-015
            type: requirement
          - id: R-016
            type: requirement
          - id: R-017
            type: requirement
          - id: R-018
            type: requirement
          - id: R-019
            type: requirement
          - id: R-020
            type: requirement
          - id: AC-001
            type: acceptance-criterion
          - id: AC-002
            type: acceptance-criterion
          - id: AC-003
            type: acceptance-criterion
          - id: AC-004
            type: acceptance-criterion
          - id: AC-005
            type: acceptance-criterion
          - id: AC-006
            type: acceptance-criterion
          - id: AC-007
            type: acceptance-criterion
          - id: AC-008
            type: acceptance-criterion
          - id: AC-009
            type: acceptance-criterion
          - id: AC-010
            type: acceptance-criterion
          - id: AC-011
            type: acceptance-criterion
          - id: AC-012
            type: acceptance-criterion
          - id: AC-013
            type: acceptance-criterion
          - id: AC-014
            type: acceptance-criterion
          - id: AC-015
            type: acceptance-criterion
          - id: AC-016
            type: acceptance-criterion
          - id: AC-017
            type: acceptance-criterion
          - id: AC-018
            type: acceptance-criterion
          - id: AC-019
            type: acceptance-criterion
          - id: AC-020
            type: acceptance-criterion
          - id: AC-021
            type: acceptance-criterion
          - id: AC-022
            type: acceptance-criterion
          - id: AC-023
            type: acceptance-criterion
          - id: AC-024
            type: acceptance-criterion
          - id: A-001
            type: assumption
          - id: A-002
            type: assumption
          - id: A-003
            type: assumption
          - id: A-004
            type: assumption
          - id: A-005
            type: assumption
          - id: D-001
            type: decision
          - id: D-002
            type: decision
          - id: D-003
            type: decision
          - id: D-004
            type: decision
          - id: D-005
            type: decision
          - id: D-006
            type: decision
          - id: D-007
            type: decision
          - id: D-008
            type: decision
          - id: D-009
            type: decision
          - id: D-010
            type: decision
          - id: D-011
            type: decision
          - id: D-012
            type: decision
          - id: D-013
            type: decision
          - id: D-014
            type: decision
          - id: D-015
            type: decision
          - id: D-016
            type: decision
          - id: D-017
            type: decision
          - id: D-018
            type: decision
          - id: D-019
            type: decision
          - id: D-020
            type: decision
          - id: D-021
            type: decision
          - id: D-022
            type: decision
          - id: D-023
            type: decision
          - id: D-024
            type: decision
          - id: D-025
            type: decision
          - id: D-026
            type: decision
          - id: D-027
            type: decision
          - id: D-028
            type: decision
          - id: D-029
            type: decision
          - id: INV-001
            type: invariant
          - id: INV-002
            type: invariant
          - id: INV-003
            type: invariant
          - id: INV-004
            type: invariant
          - id: INV-005
            type: invariant
          - id: INV-006
            type: invariant
          - id: INV-007
            type: invariant
          - id: INV-008
            type: invariant
          - id: INV-009
            type: invariant
          - id: INV-010
            type: invariant
          - id: INV-011
            type: invariant
          - id: INV-012
            type: invariant
          - id: INV-013
            type: invariant
          - id: INV-014
            type: invariant
          - id: INV-015
            type: invariant
        tombstones: []
      - revision: 3
        active:
          - id: R-001
            type: requirement
          - id: R-002
            type: requirement
          - id: R-003
            type: requirement
          - id: R-004
            type: requirement
          - id: R-005
            type: requirement
          - id: R-006
            type: requirement
          - id: R-007
            type: requirement
          - id: R-008
            type: requirement
          - id: R-009
            type: requirement
          - id: R-010
            type: requirement
          - id: R-011
            type: requirement
          - id: R-012
            type: requirement
          - id: R-013
            type: requirement
          - id: R-014
            type: requirement
          - id: R-015
            type: requirement
          - id: R-016
            type: requirement
          - id: R-017
            type: requirement
          - id: R-018
            type: requirement
          - id: R-019
            type: requirement
          - id: R-020
            type: requirement
          - id: AC-001
            type: acceptance-criterion
          - id: AC-002
            type: acceptance-criterion
          - id: AC-003
            type: acceptance-criterion
          - id: AC-004
            type: acceptance-criterion
          - id: AC-005
            type: acceptance-criterion
          - id: AC-006
            type: acceptance-criterion
          - id: AC-007
            type: acceptance-criterion
          - id: AC-008
            type: acceptance-criterion
          - id: AC-009
            type: acceptance-criterion
          - id: AC-010
            type: acceptance-criterion
          - id: AC-011
            type: acceptance-criterion
          - id: AC-012
            type: acceptance-criterion
          - id: AC-013
            type: acceptance-criterion
          - id: AC-014
            type: acceptance-criterion
          - id: AC-015
            type: acceptance-criterion
          - id: AC-016
            type: acceptance-criterion
          - id: AC-017
            type: acceptance-criterion
          - id: AC-018
            type: acceptance-criterion
          - id: AC-019
            type: acceptance-criterion
          - id: AC-020
            type: acceptance-criterion
          - id: AC-021
            type: acceptance-criterion
          - id: AC-022
            type: acceptance-criterion
          - id: AC-023
            type: acceptance-criterion
          - id: AC-024
            type: acceptance-criterion
          - id: A-001
            type: assumption
          - id: A-002
            type: assumption
          - id: A-003
            type: assumption
          - id: A-004
            type: assumption
          - id: A-005
            type: assumption
          - id: D-001
            type: decision
          - id: D-002
            type: decision
          - id: D-003
            type: decision
          - id: D-004
            type: decision
          - id: D-005
            type: decision
          - id: D-006
            type: decision
          - id: D-007
            type: decision
          - id: D-008
            type: decision
          - id: D-009
            type: decision
          - id: D-010
            type: decision
          - id: D-011
            type: decision
          - id: D-012
            type: decision
          - id: D-013
            type: decision
          - id: D-014
            type: decision
          - id: D-015
            type: decision
          - id: D-016
            type: decision
          - id: D-017
            type: decision
          - id: D-018
            type: decision
          - id: D-019
            type: decision
          - id: D-020
            type: decision
          - id: D-021
            type: decision
          - id: D-022
            type: decision
          - id: D-023
            type: decision
          - id: D-024
            type: decision
          - id: D-025
            type: decision
          - id: D-026
            type: decision
          - id: D-027
            type: decision
          - id: D-028
            type: decision
          - id: D-029
            type: decision
          - id: D-030
            type: decision
          - id: INV-001
            type: invariant
          - id: INV-002
            type: invariant
          - id: INV-003
            type: invariant
          - id: INV-004
            type: invariant
          - id: INV-005
            type: invariant
          - id: INV-006
            type: invariant
          - id: INV-007
            type: invariant
          - id: INV-008
            type: invariant
          - id: INV-009
            type: invariant
          - id: INV-010
            type: invariant
          - id: INV-011
            type: invariant
          - id: INV-012
            type: invariant
          - id: INV-013
            type: invariant
          - id: INV-014
            type: invariant
          - id: INV-015
            type: invariant
        tombstones: []
    approved_artifact:
      metadata:
        allowed_paths:
          - '**'
        approval_source: user-approved-decision-coverage
        approved_at: '2026-08-09T00:00:00.000Z'
        approved_by: user
        artifact_id: decision-coverage-r3
        artifact_kind: plan
        change_ref: generic-crud-module-v1
        contract_id: decision-coverage:v1
        owner_module_id: null
        owner_repository_id: sdcorejs-angular
        owner_repository_role: standalone
        parent_references: []
        parent_repository_id: null
        prohibited_paths: []
        repository_relative_path: .sdcorejs/plans/angular/2026-10-13-15-57-generic-crud-module.md
        requirement_id: decision-coverage
        schema_version: 1
        source_revision: 48de6f13e24a9e4bed9be3dd44f9ffaf16c0dd4a
        stack_profile: markdown-skill-pack
        supersedes: null
        track: workflow
        approval_hash: sha256:v1:15e06bbe03f981cd165514ad0d3e647d1a0bd2b451e02edc8f65f0fcea3c7255
      body: >
        {"history":[{"active":[{"id":"R-001","type":"requirement"},{"id":"R-002","type":"requirement"},{"id":"R-003","type":"requirement"},{"id":"R-004","type":"requirement"},{"id":"R-005","type":"requirement"},{"id":"R-006","type":"requirement"},{"id":"R-007","type":"requirement"},{"id":"R-008","type":"requirement"},{"id":"R-009","type":"requirement"},{"id":"R-010","type":"requirement"},{"id":"R-011","type":"requirement"},{"id":"R-012","type":"requirement"},{"id":"R-013","type":"requirement"},{"id":"R-014","type":"requirement"},{"id":"R-015","type":"requirement"},{"id":"R-016","type":"requirement"},{"id":"R-017","type":"requirement"},{"id":"R-018","type":"requirement"},{"id":"R-019","type":"requirement"},{"id":"R-020","type":"requirement"},{"id":"AC-001","type":"acceptance-criterion"},{"id":"AC-002","type":"acceptance-criterion"},{"id":"AC-003","type":"acceptance-criterion"},{"id":"AC-004","type":"acceptance-criterion"},{"id":"AC-005","type":"acceptance-criterion"},{"id":"AC-006","type":"acceptance-criterion"},{"id":"AC-007","type":"acceptance-criterion"},{"id":"AC-008","type":"acceptance-criterion"},{"id":"AC-009","type":"acceptance-criterion"},{"id":"AC-010","type":"acceptance-criterion"},{"id":"AC-011","type":"acceptance-criterion"},{"id":"AC-012","type":"acceptance-criterion"},{"id":"AC-013","type":"acceptance-criterion"},{"id":"AC-014","type":"acceptance-criterion"},{"id":"AC-015","type":"acceptance-criterion"},{"id":"AC-016","type":"acceptance-criterion"},{"id":"AC-017","type":"acceptance-criterion"},{"id":"AC-018","type":"acceptance-criterion"},{"id":"AC-019","type":"acceptance-criterion"},{"id":"AC-020","type":"acceptance-criterion"},{"id":"AC-021","type":"acceptance-criterion"},{"id":"AC-022","type":"acceptance-criterion"},{"id":"AC-023","type":"acceptance-criterion"},{"id":"AC-024","type":"acceptance-criterion"},{"id":"A-001","type":"assumption"},{"id":"A-002","type":"assumption"},{"id":"A-003","type":"assumption"},{"id":"A-004","type":"assumption"},{"id":"A-005","type":"assumption"},{"id":"D-001","type":"decision"},{"id":"D-002","type":"decision"},{"id":"D-003","type":"decision"},{"id":"D-004","type":"decision"},{"id":"D-005","type":"decision"},{"id":"D-006","type":"decision"},{"id":"D-007","type":"decision"},{"id":"D-008","type":"decision"},{"id":"D-009","type":"decision"},{"id":"D-010","type":"decision"},{"id":"D-011","type":"decision"},{"id":"D-012","type":"decision"},{"id":"D-013","type":"decision"},{"id":"D-014","type":"decision"},{"id":"D-015","type":"decision"},{"id":"D-016","type":"decision"},{"id":"D-017","type":"decision"},{"id":"D-018","type":"decision"}],"revision":1,"tombstones":[]},{"active":[{"id":"R-001","type":"requirement"},{"id":"R-002","type":"requirement"},{"id":"R-003","type":"requirement"},{"id":"R-004","type":"requirement"},{"id":"R-005","type":"requirement"},{"id":"R-006","type":"requirement"},{"id":"R-007","type":"requirement"},{"id":"R-008","type":"requirement"},{"id":"R-009","type":"requirement"},{"id":"R-010","type":"requirement"},{"id":"R-011","type":"requirement"},{"id":"R-012","type":"requirement"},{"id":"R-013","type":"requirement"},{"id":"R-014","type":"requirement"},{"id":"R-015","type":"requirement"},{"id":"R-016","type":"requirement"},{"id":"R-017","type":"requirement"},{"id":"R-018","type":"requirement"},{"id":"R-019","type":"requirement"},{"id":"R-020","type":"requirement"},{"id":"AC-001","type":"acceptance-criterion"},{"id":"AC-002","type":"acceptance-criterion"},{"id":"AC-003","type":"acceptance-criterion"},{"id":"AC-004","type":"acceptance-criterion"},{"id":"AC-005","type":"acceptance-criterion"},{"id":"AC-006","type":"acceptance-criterion"},{"id":"AC-007","type":"acceptance-criterion"},{"id":"AC-008","type":"acceptance-criterion"},{"id":"AC-009","type":"acceptance-criterion"},{"id":"AC-010","type":"acceptance-criterion"},{"id":"AC-011","type":"acceptance-criterion"},{"id":"AC-012","type":"acceptance-criterion"},{"id":"AC-013","type":"acceptance-criterion"},{"id":"AC-014","type":"acceptance-criterion"},{"id":"AC-015","type":"acceptance-criterion"},{"id":"AC-016","type":"acceptance-criterion"},{"id":"AC-017","type":"acceptance-criterion"},{"id":"AC-018","type":"acceptance-criterion"},{"id":"AC-019","type":"acceptance-criterion"},{"id":"AC-020","type":"acceptance-criterion"},{"id":"AC-021","type":"acceptance-criterion"},{"id":"AC-022","type":"acceptance-criterion"},{"id":"AC-023","type":"acceptance-criterion"},{"id":"AC-024","type":"acceptance-criterion"},{"id":"A-001","type":"assumption"},{"id":"A-002","type":"assumption"},{"id":"A-003","type":"assumption"},{"id":"A-004","type":"assumption"},{"id":"A-005","type":"assumption"},{"id":"D-001","type":"decision"},{"id":"D-002","type":"decision"},{"id":"D-003","type":"decision"},{"id":"D-004","type":"decision"},{"id":"D-005","type":"decision"},{"id":"D-006","type":"decision"},{"id":"D-007","type":"decision"},{"id":"D-008","type":"decision"},{"id":"D-009","type":"decision"},{"id":"D-010","type":"decision"},{"id":"D-011","type":"decision"},{"id":"D-012","type":"decision"},{"id":"D-013","type":"decision"},{"id":"D-014","type":"decision"},{"id":"D-015","type":"decision"},{"id":"D-016","type":"decision"},{"id":"D-017","type":"decision"},{"id":"D-018","type":"decision"},{"id":"D-019","type":"decision"},{"id":"D-020","type":"decision"},{"id":"D-021","type":"decision"},{"id":"D-022","type":"decision"},{"id":"D-023","type":"decision"},{"id":"D-024","type":"decision"},{"id":"D-025","type":"decision"},{"id":"D-026","type":"decision"},{"id":"D-027","type":"decision"},{"id":"D-028","type":"decision"},{"id":"D-029","type":"decision"},{"id":"INV-001","type":"invariant"},{"id":"INV-002","type":"invariant"},{"id":"INV-003","type":"invariant"},{"id":"INV-004","type":"invariant"},{"id":"INV-005","type":"invariant"},{"id":"INV-006","type":"invariant"},{"id":"INV-007","type":"invariant"},{"id":"INV-008","type":"invariant"},{"id":"INV-009","type":"invariant"},{"id":"INV-010","type":"invariant"},{"id":"INV-011","type":"invariant"},{"id":"INV-012","type":"invariant"},{"id":"INV-013","type":"invariant"},{"id":"INV-014","type":"invariant"},{"id":"INV-015","type":"invariant"}],"revision":2,"tombstones":[]},{"active":[{"id":"R-001","type":"requirement"},{"id":"R-002","type":"requirement"},{"id":"R-003","type":"requirement"},{"id":"R-004","type":"requirement"},{"id":"R-005","type":"requirement"},{"id":"R-006","type":"requirement"},{"id":"R-007","type":"requirement"},{"id":"R-008","type":"requirement"},{"id":"R-009","type":"requirement"},{"id":"R-010","type":"requirement"},{"id":"R-011","type":"requirement"},{"id":"R-012","type":"requirement"},{"id":"R-013","type":"requirement"},{"id":"R-014","type":"requirement"},{"id":"R-015","type":"requirement"},{"id":"R-016","type":"requirement"},{"id":"R-017","type":"requirement"},{"id":"R-018","type":"requirement"},{"id":"R-019","type":"requirement"},{"id":"R-020","type":"requirement"},{"id":"AC-001","type":"acceptance-criterion"},{"id":"AC-002","type":"acceptance-criterion"},{"id":"AC-003","type":"acceptance-criterion"},{"id":"AC-004","type":"acceptance-criterion"},{"id":"AC-005","type":"acceptance-criterion"},{"id":"AC-006","type":"acceptance-criterion"},{"id":"AC-007","type":"acceptance-criterion"},{"id":"AC-008","type":"acceptance-criterion"},{"id":"AC-009","type":"acceptance-criterion"},{"id":"AC-010","type":"acceptance-criterion"},{"id":"AC-011","type":"acceptance-criterion"},{"id":"AC-012","type":"acceptance-criterion"},{"id":"AC-013","type":"acceptance-criterion"},{"id":"AC-014","type":"acceptance-criterion"},{"id":"AC-015","type":"acceptance-criterion"},{"id":"AC-016","type":"acceptance-criterion"},{"id":"AC-017","type":"acceptance-criterion"},{"id":"AC-018","type":"acceptance-criterion"},{"id":"AC-019","type":"acceptance-criterion"},{"id":"AC-020","type":"acceptance-criterion"},{"id":"AC-021","type":"acceptance-criterion"},{"id":"AC-022","type":"acceptance-criterion"},{"id":"AC-023","type":"acceptance-criterion"},{"id":"AC-024","type":"acceptance-criterion"},{"id":"A-001","type":"assumption"},{"id":"A-002","type":"assumption"},{"id":"A-003","type":"assumption"},{"id":"A-004","type":"assumption"},{"id":"A-005","type":"assumption"},{"id":"D-001","type":"decision"},{"id":"D-002","type":"decision"},{"id":"D-003","type":"decision"},{"id":"D-004","type":"decision"},{"id":"D-005","type":"decision"},{"id":"D-006","type":"decision"},{"id":"D-007","type":"decision"},{"id":"D-008","type":"decision"},{"id":"D-009","type":"decision"},{"id":"D-010","type":"decision"},{"id":"D-011","type":"decision"},{"id":"D-012","type":"decision"},{"id":"D-013","type":"decision"},{"id":"D-014","type":"decision"},{"id":"D-015","type":"decision"},{"id":"D-016","type":"decision"},{"id":"D-017","type":"decision"},{"id":"D-018","type":"decision"},{"id":"D-019","type":"decision"},{"id":"D-020","type":"decision"},{"id":"D-021","type":"decision"},{"id":"D-022","type":"decision"},{"id":"D-023","type":"decision"},{"id":"D-024","type":"decision"},{"id":"D-025","type":"decision"},{"id":"D-026","type":"decision"},{"id":"D-027","type":"decision"},{"id":"D-028","type":"decision"},{"id":"D-029","type":"decision"},{"id":"D-030","type":"decision"},{"id":"INV-001","type":"invariant"},{"id":"INV-002","type":"invariant"},{"id":"INV-003","type":"invariant"},{"id":"INV-004","type":"invariant"},{"id":"INV-005","type":"invariant"},{"id":"INV-006","type":"invariant"},{"id":"INV-007","type":"invariant"},{"id":"INV-008","type":"invariant"},{"id":"INV-009","type":"invariant"},{"id":"INV-010","type":"invariant"},{"id":"INV-011","type":"invariant"},{"id":"INV-012","type":"invariant"},{"id":"INV-013","type":"invariant"},{"id":"INV-014","type":"invariant"},{"id":"INV-015","type":"invariant"}],"revision":3,"tombstones":[]}],"records":[{"id":"R-001","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Thêm
        entry point @sdcorejs/angular/modules/generic, không phụ thuộc backend: public API runtime gồm provideSdGeneric, provideSdGenericEntity,
        sdGenericRoutes, validateSdGenericSchema; các model SdGenericSchema, SdGenericProperty, SdGenericAdapter… chỉ export dạng type. Không chứa adapter hay
        giá trị riêng của backend
        nào.","status":"active","task_refs":["TASK-001","TASK-015","TASK-016"],"type":"requirement"},{"id":"R-002","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Model
        SdGenericSchema { version: 1, module, entity, general { label, primaryKey?, properties }, list?, detail?, create?, update?, import? };
        detail/create/update có dạng { title?, form?: SdFormGenericSchema }; list có title?, columns?, externalFilters?, orders?, pageSize?, export?; import có
        columns?: { key, matchField? }[],
        upsertKey?.","status":"active","task_refs":["TASK-005","TASK-015"],"type":"requirement"},{"id":"R-003","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Model
        SdGenericProperty { key, label, dataType: string|text|number|boolean|date|datetime|time|enum|relation|json|file, multiple?, format?
        (email|phone|url|password cho string; integer|decimal|currency|percent cho number), enums?: { value, label, color?, icon? }[], relation?: { module?,
        entity, valueField? = 'id', displayField?, display?, searchFields? }, validation?, defaultValue?, insertable? = true, updatable? = true, system? };
        không có relation.type, multiple quyết định chọn một hay
        nhiều.","status":"active","task_refs":["TASK-005","TASK-015"],"type":"requirement"},{"id":"R-004","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Contract
        SdGenericAdapter { module, schema(entity), query(entity, PagingReq) → PagingRes, detail(entity, id), create(entity, data), update(entity, id, data),
        delete(entity, id), search?(entity, req), configuration?: { get(entity), set(entity, schema) }, display?(args) }; request/response dùng
        PagingReq/PagingRes/Filter/Order của
        @sdcorejs/utils.","status":"active","task_refs":["TASK-005","TASK-008","TASK-009"],"type":"requirement"},{"id":"R-005","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"provideSdGeneric({
        adapters, permission? }) và provideSdGenericEntity({ module, entity, … }) gọi được nhiều lần ở root và trong lazy route; tra cứu theo module (và
        module+entity) đi từ injector gần nhất lên root, bản gần nhất thắng; trùng module/entity trong cùng một lần gọi là lỗi khi khởi tạo; adapters nhận class
        (DI tạo) hoặc
        instance.","status":"active","task_refs":["TASK-008","TASK-009"],"type":"requirement"},{"id":"R-006","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Schema
        hiệu lực dựng qua 3 lớp: adapter.schema(entity) → provideSdGenericEntity.schema(base) (nếu có) = cấu hình mặc định → configuration.get(entity) khác null
        thì validate rồi merge lên trên; null thì dùng cấu hình mặc định. Adapter không khai configuration thì lib lưu ở localStorage. Mỗi entity một cấu hình;
        lưu theo server hay theo người dùng do adapter quyết
        định.","status":"active","task_refs":["TASK-006","TASK-007","TASK-008","TASK-009"],"type":"requirement"},{"id":"R-007","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Merge
        cấu hình đã lưu với schema hiện tại: key, dataType, enums[].value, relation.entity lấy từ schema hiện tại; label, nhãn enum, display, validation,
        defaultValue… lấy từ bản đã lưu; property không còn ở schema hiện tại bị bỏ khỏi general, list, layout form và import; property mới được thêm vào
        general và vào list.columns với visible: false, không tự chèn vào layout form đã
        lưu.","status":"active","task_refs":["TASK-006","TASK-007"],"type":"requirement"},{"id":"R-008","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"validateSdGenericSchema(stored,
        base) trả danh sách issue { path, code, severity } kiểm tra: shape và version, key property không trùng, module/entity khớp, tham chiếu của
        list.columns/externalFilters/orders/import.columns/upsertKey/field trong layout tới property có thật, type field layout khớp dataType, ngữ pháp layout
        form-generic, upsertKey không multiple, field layout create phải insertable và update phải updatable, template tiêu đề. Khi load: tham chiếu treo tự bỏ;
        lỗi shape/version thì dùng cấu hình mặc định, console.warn và hiện banner cho người có quyền CONFIGURATION. Khi lưu: có lỗi thì
        chặn.","status":"active","task_refs":["TASK-006","TASK-007","TASK-008","TASK-009","TASK-013","TASK-014"],"type":"requirement"},{"id":"R-009","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Tiêu
        đề nằm trong từng section (list.title, create.title, detail.title, update.title), hỗ trợ template ${key}; list.title và create.title không được có
        placeholder; detail.title và update.title chỉ tham chiếu property có thật; tiêu đề render dạng text (không HTML); thiếu thì sinh từ
        general.label.","status":"active","task_refs":["TASK-006","TASK-007","TASK-011","TASK-012"],"type":"requirement"},{"id":"R-010","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"sdGenericRoutes()
        cung cấp generic/:module/:entity, …/create, …/:id/detail, …/:id/update, …/configuration. Form detail/create/update hiển thị dạng page hoặc side-drawer
        theo provideSdGenericEntity.display → adapter.display → mặc định 'page'; side-drawer điều khiển bằng route: list vẫn hiển thị phía sau, giữ
        filter/trang, back đóng drawer, lưu xong list
        reload.","status":"active","task_refs":["TASK-010","TASK-011"],"type":"requirement"},{"id":"R-011","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Quyền
        theo định dạng <MODULE>_<ENTITY>_C_GENERIC_{LIST|DETAIL|CREATE|UPDATE|DELETE|IMPORT|CONFIGURATION} (viết hoa), kiểm tra qua
        SdPermissionService.hasPermission; thiếu quyền thì ẩn action và chặn route tương ứng; provideSdGeneric({ permission: false }) tắt kiểm
        tra.","status":"active","task_refs":["TASK-006","TASK-007","TASK-008","TASK-009","TASK-010","TASK-011"],"type":"requirement"},{"id":"R-012","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Màn
        list dùng sd-table type server: cột mặc định là mọi property trừ json/file; visible: false là ẩn mặc định nhưng bật lại được; sortable/filterable;
        externalFilters; orders mặc định; pageSize mặc định 20; export Excel phía client khi bật; action có sẵn create/import/export (header),
        detail/update/delete (dòng), delete (chọn nhiều, gọi delete lần lượt); xoá có xác nhận và reload sau khi
        xoá.","status":"active","task_refs":["TASK-006","TASK-007","TASK-011","TASK-012"],"type":"requirement"},{"id":"R-013","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Detail/create/update
        render bằng sd-form-render: layout = section.form ?? detail.form ?? tự sinh từ general; mỗi field layout được điền type/label/options/validation từ
        general theo key; detail ở chế độ viewed và hiện cả property system; create bỏ system và property không insertable; update bỏ system và property không
        updatable, payload update chỉ gồm property updatable; relation dùng catalog do lib tự đăng ký, search theo thứ tự provideSdGenericEntity.search →
        adapter.search → adapter.query với CONTAIN (tìm) / IN (lấy
        nhãn).","status":"active","task_refs":["TASK-006","TASK-007","TASK-008","TASK-009","TASK-011","TASK-012"],"type":"requirement"},{"id":"R-014","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"provideSdGenericEntity.hooks:
        beforeSave(ctx { action, data, schema }) trả payload (đồng bộ hoặc Promise) trước khi gọi adapter.create/update; afterSave(ctx) chạy sau khi lưu thành
        công.","status":"active","task_refs":["TASK-008","TASK-009"],"type":"requirement"},{"id":"R-015","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"provideSdGenericEntity
        khai action mở rộng: listActions, rowCommands, bulkActions, detailActions với { id, label, icon?, permission?, visible?(ctx), run(ctx) }, ctx gồm
        schema, row hoặc rows, reload(); hiddenDefaults ẩn action có sẵn (create, import, export, detail, update,
        delete).","status":"active","task_refs":["TASK-011","TASK-012"],"type":"requirement"},{"id":"R-016","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Import
        dùng sd-import-excel: template từ import.columns hoặc mọi property insertable trừ system/json/file; ô enum nhận value hoặc label; ô relation so khớp
        theo matchField (mặc định relation.displayField) qua search với values; có upsertKey thì tra theo lô bản ghi đã tồn tại → update, chưa có → create;
        không upsertKey thì luôn create; tối đa 5 request song song; kết quả từng dòng hiện trong sd-import-excel; chỉ cần quyền
        IMPORT.","status":"active","task_refs":["TASK-006","TASK-007","TASK-008","TASK-009","TASK-011","TASK-012"],"type":"requirement"},{"id":"R-017","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Màn
        chỉnh cấu hình tại …/configuration với 4 tab: Thông tin chung (label, nhãn/màu enum, display/searchFields của relation, validation, defaultValue,
        insertable/updatable; không sửa key/dataType), Danh sách (thứ tự cột, width/visible/sortable/filterable, externalFilters, orders, pageSize, export),
        Form (sd-form-builder cho detail, create/update có lựa chọn \"giống detail\", palette là properties), Import (columns, upsertKey); hiện cảnh báo
        property bị bỏ/mới; nút Lưu validate rồi gọi configuration.set(entity, schema), có lỗi thì
        chặn.","status":"active","task_refs":["TASK-013","TASK-014"],"type":"requirement"},{"id":"R-018","owner_module_id":"components/form-generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"form-generic
        thêm field type time (giá trị chuỗi HH:mm) và json (dùng code-editor, giá trị JSON hợp lệ) ở renderer, builder và validation; chỉ thêm mới, schema
        form-generic hiện có không đổi hành
        vi.","status":"active","task_refs":["TASK-001","TASK-002","TASK-003","TASK-004"],"type":"requirement"},{"id":"R-019","owner_module_id":"showcase","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Showcase
        có trang demo module generic chạy với adapter mock in-memory; có tài liệu sd-generic.md và cập nhật sd-form-generic.md cho
        time/json.","status":"active","task_refs":["TASK-004","TASK-016","TASK-017"],"type":"requirement"},{"id":"R-020","owner_module_id":null,"owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Thay
        đổi viết ở versions/v19 rồi rollout sang v20/v21/v22 bằng npm run sync, check:sync xanh; CHANGELOG có mục Unreleased mô tả thay đổi, nhắm release suffix
        3.2 (chỉ thêm mới).","status":"active","task_refs":["TASK-015","TASK-018","TASK-019"],"type":"requirement"},{"behavior":"Mở generic/tms/order khi
        configuration.get trả null","blocking":true,"expected_result":"Màn list hiện các cột sinh từ properties (trừ json/file), dữ liệu lấy qua adapter.query
        với PagingReq pageSize 20","id":"AC-001","requirement_refs":["R-004","R-006","R-012"],"statement":"Mở generic/tms/order khi configuration.get trả null →
        Màn list hiện các cột sinh từ properties (trừ json/file), dữ liệu lấy qua adapter.query với PagingReq pageSize
        20","task_refs":["TASK-008","TASK-009","TASK-011","TASK-012"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Cùng module
        tms khai ở provideSdGeneric root và trong lazy route rồi mở trang generic trong lazy route đó","blocking":true,"expected_result":"Lib dùng adapter khai
        ở lazy route; trang ngoài lazy route dùng adapter root","id":"AC-002","requirement_refs":["R-005"],"statement":"Cùng module tms khai ở provideSdGeneric
        root và trong lazy route rồi mở trang generic trong lazy route đó → Lib dùng adapter khai ở lazy route; trang ngoài lazy route dùng adapter
        root","task_refs":["TASK-008","TASK-009"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Một lần gọi provideSdGeneric khai
        hai adapter cùng module","blocking":true,"expected_result":"Khởi tạo injector ném lỗi nêu tên module bị
        trùng","id":"AC-003","requirement_refs":["R-005"],"statement":"Một lần gọi provideSdGeneric khai hai adapter cùng module → Khởi tạo injector ném lỗi nêu
        tên module bị
        trùng","task_refs":["TASK-008","TASK-009"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"provideSdGenericEntity.schema đổi
        label của một property và configuration.get trả bản đã lưu đổi label property khác","blocking":true,"expected_result":"Schema hiệu lực có cả hai thay
        đổi; khi get trả null thì chỉ có thay đổi của
        provideSdGenericEntity.schema","id":"AC-004","requirement_refs":["R-006"],"statement":"provideSdGenericEntity.schema đổi label của một property và
        configuration.get trả bản đã lưu đổi label property khác → Schema hiệu lực có cả hai thay đổi; khi get trả null thì chỉ có thay đổi của
        provideSdGenericEntity.schema","task_refs":["TASK-008","TASK-009"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Adapter
        không khai configuration, lưu cấu hình từ màn chỉnh rồi tải lại trang","blocking":true,"expected_result":"Cấu hình được ghi và đọc lại từ localStorage
        theo module và entity","id":"AC-005","requirement_refs":["R-006","R-017"],"statement":"Adapter không khai configuration, lưu cấu hình từ màn chỉnh rồi
        tải lại trang → Cấu hình được ghi và đọc lại từ localStorage theo module và
        entity","task_refs":["TASK-008","TASK-009","TASK-013","TASK-014"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Cấu hình
        đã lưu có cột và field layout trỏ tới property đã bị xoá ở schema hiện tại, và schema hiện tại có property
        mới","blocking":true,"expected_result":"Cột/field treo bị bỏ, trang vẫn chạy; property mới có trong general và list.columns với visible: false, không có
        trong layout form đã lưu; dataType lấy từ schema hiện tại","id":"AC-006","requirement_refs":["R-007","R-008"],"statement":"Cấu hình đã lưu có cột và
        field layout trỏ tới property đã bị xoá ở schema hiện tại, và schema hiện tại có property mới → Cột/field treo bị bỏ, trang vẫn chạy; property mới có
        trong general và list.columns với visible: false, không có trong layout form đã lưu; dataType lấy từ schema hiện
        tại","task_refs":["TASK-005","TASK-006","TASK-007"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"configuration.get trả
        object sai shape hoặc version không hỗ trợ","blocking":true,"expected_result":"Lib dùng cấu hình mặc định, gọi console.warn, banner \"cấu hình không hợp
        lệ\" chỉ hiện với người có quyền CONFIGURATION","id":"AC-007","requirement_refs":["R-008","R-011"],"statement":"configuration.get trả object sai shape
        hoặc version không hỗ trợ → Lib dùng cấu hình mặc định, gọi console.warn, banner \"cấu hình không hợp lệ\" chỉ hiện với người có quyền
        CONFIGURATION","task_refs":["TASK-008","TASK-009","TASK-011","TASK-012"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"validateSdGenericSchema
        nhận schema có key trùng, upsertKey trỏ property multiple, field layout update không updatable, field layout sai
        type","blocking":true,"expected_result":"Trả issue với path và code tương ứng cho từng lỗi, severity
        error","id":"AC-008","requirement_refs":["R-008"],"statement":"validateSdGenericSchema nhận schema có key trùng, upsertKey trỏ property multiple, field
        layout update không updatable, field layout sai type → Trả issue với path và code tương ứng cho từng lỗi, severity
        error","task_refs":["TASK-006","TASK-007"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Validate update.title = 'Đơn
        ${unknown}' và list.title = 'DS ${code}'; render detail.title = '<b>${code}</b>'","blocking":true,"expected_result":"Cả hai title đầu bị báo lỗi
        template; title detail hiện chuỗi text đã thay giá trị, thẻ <b> không được render thành
        HTML","id":"AC-009","requirement_refs":["R-008","R-009"],"statement":"Validate update.title = 'Đơn ${unknown}' và list.title = 'DS ${code}'; render
        detail.title = '<b>${code}</b>' → Cả hai title đầu bị báo lỗi template; title detail hiện chuỗi text đã thay giá trị, thẻ <b> không được render thành
        HTML","task_refs":["TASK-006","TASK-007","TASK-011","TASK-012"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Người dùng
        thiếu quyền TMS_ORDER_C_GENERIC_CREATE mở màn list rồi điều hướng thẳng tới generic/tms/order/create","blocking":true,"expected_result":"Nút tạo mới bị
        ẩn và route create bị chặn; khi provideSdGeneric({ permission: false }) thì nút hiện và route mở
        được","id":"AC-010","requirement_refs":["R-010","R-011"],"statement":"Người dùng thiếu quyền TMS_ORDER_C_GENERIC_CREATE mở màn list rồi điều hướng thẳng
        tới generic/tms/order/create → Nút tạo mới bị ẩn và route create bị chặn; khi provideSdGeneric({ permission: false }) thì nút hiện và route mở
        được","task_refs":["TASK-006","TASK-007","TASK-010","TASK-011"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"display trả
        'side-drawer', người dùng lọc list rồi mở generic/tms/order/1/detail và bấm back","blocking":true,"expected_result":"Drawer mở đè lên list, URL có
        /1/detail; back đóng drawer, list giữ filter và trang","id":"AC-011","requirement_refs":["R-010"],"statement":"display trả 'side-drawer', người dùng lọc
        list rồi mở generic/tms/order/1/detail và bấm back → Drawer mở đè lên list, URL có /1/detail; back đóng drawer, list giữ filter và
        trang","task_refs":["TASK-010","TASK-011"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Không khai display và mở
        generic/tms/order/1/update","blocking":true,"expected_result":"Form update hiển thị dạng trang đầy đủ (mặc định 'page'); lưu thành công thì quay về list
        và list reload","id":"AC-012","requirement_refs":["R-010"],"statement":"Không khai display và mở generic/tms/order/1/update → Form update hiển thị dạng
        trang đầy đủ (mặc định 'page'); lưu thành công thì quay về list và list
        reload","task_refs":["TASK-010","TASK-011"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"list có column visible: false,
        orders mặc định và externalFilters có default","blocking":true,"expected_result":"Cột ẩn nhưng có trong cài đặt cột; request query mang orders và
        filters tương ứng","id":"AC-013","requirement_refs":["R-012"],"statement":"list có column visible: false, orders mặc định và externalFilters có default
        → Cột ẩn nhưng có trong cài đặt cột; request query mang orders và filters tương
        ứng","task_refs":["TASK-006","TASK-007","TASK-011","TASK-012"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Xoá một dòng
        và xoá 3 dòng đã chọn","blocking":true,"expected_result":"Mỗi lần có hộp xác nhận; adapter.delete được gọi 1 lần rồi 3 lần tuần tự; list reload sau khi
        xoá","id":"AC-014","requirement_refs":["R-012"],"statement":"Xoá một dòng và xoá 3 dòng đã chọn → Mỗi lần có hộp xác nhận; adapter.delete được gọi 1 lần
        rồi 3 lần tuần tự; list reload sau khi
        xoá","task_refs":["TASK-011","TASK-012"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Mở create, update, detail với
        schema không có layout form và có property system, property updatable: false","blocking":true,"expected_result":"Create không có system; update không có
        system và property không updatable, payload update không chứa chúng; detail ở chế độ viewed và có property system; field có label/type/options lấy từ
        general","id":"AC-015","requirement_refs":["R-013"],"statement":"Mở create, update, detail với schema không có layout form và có property system,
        property updatable: false → Create không có system; update không có system và property không updatable, payload update không chứa chúng; detail ở chế độ
        viewed và có property system; field có label/type/options lấy từ
        general","task_refs":["TASK-006","TASK-007","TASK-011","TASK-012"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Mở select
        relation với entity có search riêng, với adapter có search, và với adapter chỉ có query","blocking":true,"expected_result":"Lần lượt gọi search của
        entity, search của adapter, query với filter CONTAIN trên searchFields/displayField; nhãn giá trị đã chọn lấy qua IN trên
        valueField","id":"AC-016","requirement_refs":["R-013","R-004"],"statement":"Mở select relation với entity có search riêng, với adapter có search, và với
        adapter chỉ có query → Lần lượt gọi search của entity, search của adapter, query với filter CONTAIN trên searchFields/displayField; nhãn giá trị đã chọn
        lấy qua IN trên
        valueField","task_refs":["TASK-006","TASK-007","TASK-008","TASK-009"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"beforeSave
        thêm field vào payload và afterSave được khai","blocking":true,"expected_result":"adapter.create/update nhận payload đã sửa; afterSave chạy đúng một lần
        sau khi lưu thành công và không chạy khi lưu lỗi","id":"AC-017","requirement_refs":["R-014"],"statement":"beforeSave thêm field vào payload và afterSave
        được khai → adapter.create/update nhận payload đã sửa; afterSave chạy đúng một lần sau khi lưu thành công và không chạy khi lưu
        lỗi","task_refs":["TASK-008","TASK-009"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"provideSdGenericEntity khai
        rowCommands có permission và visible, hiddenDefaults: [delete]","blocking":true,"expected_result":"Command chỉ hiện khi có quyền và visible trả true,
        run nhận ctx có row và reload; command delete có sẵn bị ẩn","id":"AC-018","requirement_refs":["R-015"],"statement":"provideSdGenericEntity khai
        rowCommands có permission và visible, hiddenDefaults: [delete] → Command chỉ hiện khi có quyền và visible trả true, run nhận ctx có row và reload;
        command delete có sẵn bị ẩn","task_refs":["TASK-011","TASK-012"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Import file
        3 dòng với upsertKey code (1 dòng code đã tồn tại), một ô enum ghi bằng label, một ô relation ghi theo
        displayField","blocking":true,"expected_result":"Dòng đã tồn tại gọi update, hai dòng còn lại gọi create; enum và relation được đổi sang value/id; không
        quá 5 request chạy đồng thời; kết quả từng dòng hiện trong sd-import-excel","id":"AC-019","requirement_refs":["R-016"],"statement":"Import file 3 dòng
        với upsertKey code (1 dòng code đã tồn tại), một ô enum ghi bằng label, một ô relation ghi theo displayField → Dòng đã tồn tại gọi update, hai dòng còn
        lại gọi create; enum và relation được đổi sang value/id; không quá 5 request chạy đồng thời; kết quả từng dòng hiện trong
        sd-import-excel","task_refs":["TASK-006","TASK-007","TASK-008","TASK-009","TASK-011","TASK-012"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Ở
        màn chỉnh cấu hình, xoá property đang dùng làm upsertKey khỏi import rồi bấm Lưu; sau đó sửa label hợp lệ rồi bấm
        Lưu","blocking":true,"expected_result":"Lần đầu bị chặn và hiện lỗi; lần sau gọi configuration.set(entity, schema) với label mới; ô key và dataType
        không sửa được","id":"AC-020","requirement_refs":["R-017","R-008"],"statement":"Ở màn chỉnh cấu hình, xoá property đang dùng làm upsertKey khỏi import
        rồi bấm Lưu; sau đó sửa label hợp lệ rồi bấm Lưu → Lần đầu bị chặn và hiện lỗi; lần sau gọi configuration.set(entity, schema) với label mới; ô key và
        dataType không sửa được","task_refs":["TASK-013","TASK-014"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Render schema
        form-generic có field time và json; nhập '25:00' và chuỗi JSON sai","blocking":true,"expected_result":"Hai field báo lỗi validation; giá trị đúng được
        lưu là chuỗi HH:mm và JSON đã parse; builder có hai loại field này trong palette; spec form-generic hiện có vẫn
        xanh","id":"AC-021","requirement_refs":["R-018"],"statement":"Render schema form-generic có field time và json; nhập '25:00' và chuỗi JSON sai → Hai
        field báo lỗi validation; giá trị đúng được lưu là chuỗi HH:mm và JSON đã parse; builder có hai loại field này trong palette; spec form-generic hiện có
        vẫn xanh","task_refs":["TASK-001","TASK-002","TASK-003","TASK-004"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Mở trang
        demo module generic trên Showcase","blocking":true,"expected_result":"Trang hiện list từ adapter mock và mở được create/detail; guard example/registry
        của Showcase xanh","id":"AC-022","requirement_refs":["R-019"],"statement":"Mở trang demo module generic trên Showcase → Trang hiện list từ adapter mock
        và mở được create/detail; guard example/registry của Showcase
        xanh","task_refs":["TASK-004","TASK-016","TASK-017"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Chạy npm run sync rồi
        npm run check:sync và build sdcorejs-angular trên v19–v22","blocking":true,"expected_result":"check:sync xanh, bốn workspace build không lỗi; CHANGELOG
        có mục Unreleased cho module generic","id":"AC-023","requirement_refs":["R-020"],"statement":"Chạy npm run sync rồi npm run check:sync và build
        sdcorejs-angular trên v19–v22 → check:sync xanh, bốn workspace build không lỗi; CHANGELOG có mục Unreleased cho module
        generic","task_refs":["TASK-015","TASK-018","TASK-019"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Chạy spec public-api
        của entry point modules/generic","blocking":true,"expected_result":"Entry point export đúng bốn symbol runtime provideSdGeneric, provideSdGenericEntity,
        sdGenericRoutes, validateSdGenericSchema; không import package riêng của backend
        nào","id":"AC-024","requirement_refs":["R-001","R-002","R-003"],"statement":"Chạy spec public-api của entry point modules/generic → Entry point export
        đúng bốn symbol runtime provideSdGeneric, provideSdGenericEntity, sdGenericRoutes, validateSdGenericSchema; không import package riêng của backend
        nào","task_refs":["TASK-001","TASK-005","TASK-015","TASK-016"],"type":"acceptance-criterion","verification_kind":"automated"},{"blocking":false,"confidence":"high","consequence_if_wrong":"Có
        thể đọc trực tiếp token multi thay vì đi theo chuỗi injector; thiết kế vẫn đúng nhưng thừa
        code.","evidence_refs":[],"id":"A-001","impacted_refs":["R-005"],"owner":"sdcorejs-execute-plan","rationale":"Hành vi chuẩn của Angular DI; đã gặp ở
        SD_API_CONFIG (SdApiHandlerRegistry).","source":"inferred","statement":"Multi-provider khai trong injector con không gộp với injector cha; lib phải tự
        đi từ injector gần nhất lên root (skipSelf) để tìm adapter/entity.","status":"confirmed","type":"assumption","validation_method":"Test TDD cho AC-002
        với injector root + lazy."},{"blocking":false,"confidence":"medium","consequence_if_wrong":"Cần lớp chuyển SdTableFilterRequest sang Filter trong module
        generic.","evidence_refs":[],"id":"A-002","impacted_refs":["R-012"],"owner":"sdcorejs-execute-plan","rationale":"components/table/src/models/table-option.model.ts:198
        khai items(filterRequest, pagingReq: PagingReq).","source":"inferred","statement":"sd-table server truyền PagingReq (filters, orders, pageSize,
        pageNumber) đủ để chuyển thẳng sang adapter.query, gồm cả external filter.","status":"proposed","type":"assumption","validation_method":"Test TDD cho
        AC-013 đối chiếu request thực tế sd-table phát ra."},{"blocking":false,"confidence":"medium","consequence_if_wrong":"Cần thêm hiển thị kết quả riêng sau
        bước
        accept.","evidence_refs":[],"id":"A-003","impacted_refs":["R-016"],"owner":"sdcorejs-execute-plan","rationale":"components/import-excel/src/import-excel.model.ts:17.","source":"inferred","statement":"sd-import-excel
        accept(items) trả SdImportExcelValidation[] đủ để báo kết quả từng dòng sau khi gọi
        create/update.","status":"proposed","type":"assumption","validation_method":"Test cho
        AC-019."},{"blocking":false,"confidence":"medium","consequence_if_wrong":"Field json cần bọc adapter control riêng quanh
        code-editor.","evidence_refs":[],"id":"A-004","impacted_refs":["R-018"],"owner":"sdcorejs-execute-plan","rationale":"components/code-editor/src/code-editor.component.ts
        có model/CVA.","source":"inferred","statement":"sd-code-editor dùng được làm control (model/ControlValueAccessor) bên trong renderer form-generic cho
        field json.","status":"proposed","type":"assumption","validation_method":"Test cho
        AC-021."},{"blocking":false,"confidence":"high","consequence_if_wrong":"Đổi tên khoá trước release, chưa có dữ liệu
        cũ.","evidence_refs":[],"id":"A-005","impacted_refs":["R-006"],"owner":"user","rationale":"Người dùng chốt mặc định localStorage; tên khoá do spec
        đặt.","source":"defaulted","statement":"Khoá localStorage mặc định là sd-generic:configuration:<module>.<entity>; cấu hình chỉ có hiệu lực trên trình
        duyệt đó.","status":"proposed","type":"assumption","validation_method":"Người dùng duyệt spec; test cho
        AC-005."},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-001","AC-024"],"id":"D-001","owner_repository_id":"sdcorejs-angular","question":"Module
        generic đặt ở repo nào?","rationale":"form-generic 3.0 đã ở đây; nguyên tắc adapter không phụ thuộc
        backend.","revisit_condition":null,"scope":"repository","selected_value":"@sdcorejs/angular, entry point @sdcorejs/angular/modules/generic, không phụ
        thuộc backend; adapter backend OMD nằm ngoài repo","source":"explicit-user","statement":"Module generic đặt ở repo nào? → @sdcorejs/angular, entry point
        @sdcorejs/angular/modules/generic, không phụ thuộc backend; adapter backend OMD nằm ngoài
        repo","status":"approved","supersedes":null,"task_refs":["TASK-015","TASK-016"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-002","R-013","AC-015"],"id":"D-002","owner_repository_id":"sdcorejs-angular","question":"Ghép
        SdGenericSchema với form-generic thế nào?","rationale":"Tránh cấu hình trùng lặp (pain point lib-core-commerce) mà vẫn dùng đủ form-generic và
        sd-form-builder.","revisit_condition":null,"scope":"public-contract","selected_value":"general.properties là nguồn duy nhất; detail/create/update chứa
        layout SdFormGenericSchema tham chiếu property theo key, lib điền type/label/options/validation lúc render; thiếu layout thì tự
        sinh","source":"explicit-user","statement":"Ghép SdGenericSchema với form-generic thế nào? → general.properties là nguồn duy nhất; detail/create/update
        chứa layout SdFormGenericSchema tham chiếu property theo key, lib điền type/label/options/validation lúc render; thiếu layout thì tự
        sinh","status":"approved","supersedes":null,"task_refs":["TASK-005","TASK-007","TASK-011"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-002","R-004","AC-001"],"id":"D-003","owner_repository_id":"sdcorejs-angular","question":"Tên
        gọi trong model và adapter?","rationale":"Theo convention API của người
        dùng.","revisit_condition":null,"scope":"public-contract","selected_value":"properties (không phải fields), adapter.detail (không phải get),
        configuration: { get, set }, entity (không phải typeCode)","source":"explicit-user","statement":"Tên gọi trong model và adapter? → properties (không
        phải fields), adapter.detail (không phải get), configuration: { get, set }, entity (không phải
        typeCode)","status":"approved","supersedes":null,"task_refs":["TASK-005"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-010","AC-011","AC-012"],"id":"D-004","owner_repository_id":"sdcorejs-angular","question":"Định
        dạng route?","rationale":"Mỗi entity một cấu hình nên route mang thẳng module/entity, không cần tách
        chuỗi.","revisit_condition":null,"scope":"public-contract","selected_value":"generic/:module/:entity, /create, /:id/detail, /:id/update, /configuration
        (id đứng trước action)","source":"explicit-user","statement":"Định dạng route? → generic/:module/:entity, /create, /:id/detail, /:id/update,
        /configuration (id đứng trước
        action)","status":"approved","supersedes":null,"task_refs":["TASK-010","TASK-011"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-010","AC-011"],"id":"D-005","owner_repository_id":"sdcorejs-angular","question":"Page
        hay side-drawer quyết định ở đâu?","rationale":"Consumer quyết theo schema, ví dụ số property; deep link và back hoạt
        động.","revisit_condition":null,"scope":"public-contract","selected_value":"Callback display(args) ở provideSdGenericEntity rồi adapter, mặc định
        'page'; side-drawer điều khiển bằng route","source":"explicit-user","statement":"Page hay side-drawer quyết định ở đâu? → Callback display(args) ở
        provideSdGenericEntity rồi adapter, mặc định 'page'; side-drawer điều khiển bằng
        route","status":"approved","supersedes":null,"task_refs":["TASK-010","TASK-011"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-012","R-016","R-017","R-018","R-019"],"id":"D-006","owner_repository_id":"sdcorejs-angular","question":"Phạm
        vi giao lần này?","rationale":"Người dùng chọn phương án 3.","revisit_condition":null,"scope":"repository","selected_value":"Làm hết một lần: runtime
        CRUD, import, màn chỉnh cấu hình, action mở rộng, form-generic time/json, Showcase, docs","source":"explicit-user","statement":"Phạm vi giao lần này? →
        Làm hết một lần: runtime CRUD, import, màn chỉnh cấu hình, action mở rộng, form-generic time/json, Showcase,
        docs","status":"approved","supersedes":null,"task_refs":["TASK-011","TASK-012","TASK-017"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-005","AC-002","AC-003"],"id":"D-007","owner_repository_id":"sdcorejs-angular","question":"provide
        một hay nhiều lần?","rationale":"Module tự provide adapter; registry root chỉ thấy module đã load và phụ thuộc field
        private.","revisit_condition":null,"scope":"public-contract","selected_value":"Nhiều lần ở root và lazy route; tra injector gần nhất lên root, gần nhất
        thắng; không dùng registry đọc field private của router","source":"explicit-user","statement":"provide một hay nhiều lần? → Nhiều lần ở root và lazy
        route; tra injector gần nhất lên root, gần nhất thắng; không dùng registry đọc field private của
        router","status":"approved","supersedes":null,"task_refs":["TASK-008","TASK-009"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-018","AC-021"],"id":"D-008","owner_repository_id":"sdcorejs-angular","question":"time
        và json?","rationale":"Phạm vi làm hết một lần; tránh map tạm kém chính xác.","revisit_condition":null,"scope":"public-contract","selected_value":"Thêm
        field type time và json vào form-generic (json dùng code-editor), chỉ thêm mới","source":"explicit-user","statement":"time và json? → Thêm field type
        time và json vào form-generic (json dùng code-editor), chỉ thêm
        mới","status":"approved","supersedes":null,"task_refs":["TASK-002","TASK-003","TASK-004"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-003","AC-016"],"id":"D-009","owner_repository_id":"sdcorejs-angular","question":"Quan
        hệ OneToMany và relation.type?","rationale":"Giữ đơn giản như lib-core-commerce; bảng con để
        sau.","revisit_condition":null,"scope":"public-contract","selected_value":"Chỉ multi-select, không bảng con; bỏ relation.type, multiple quyết định
        một/nhiều","source":"explicit-user","statement":"Quan hệ OneToMany và relation.type? → Chỉ multi-select, không bảng con; bỏ relation.type, multiple
        quyết định
        một/nhiều","status":"approved","supersedes":null,"task_refs":["TASK-005","TASK-007"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-004","R-013","AC-016"],"id":"D-010","owner_repository_id":"sdcorejs-angular","question":"search
        và history?","rationale":"Backend có API search riêng để bảo đảm hiệu năng; history mỗi dự án tự
        làm.","revisit_condition":null,"scope":"public-contract","selected_value":"search? tuỳ chọn ở adapter và ở entity, fallback query CONTAIN/IN; history
        không thuộc lib","source":"explicit-user","statement":"search và history? → search? tuỳ chọn ở adapter và ở entity, fallback query CONTAIN/IN; history
        không thuộc
        lib","status":"approved","supersedes":null,"task_refs":["TASK-008","TASK-009"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-006","R-014","R-015","AC-004","AC-017","AC-018"],"id":"D-011","owner_repository_id":"sdcorejs-angular","question":"Tuỳ
        biến theo entity ở đâu?","rationale":"Adapter trả schema mặc định theo entity; deep-merge mảng không rõ
        nghĩa.","revisit_condition":null,"scope":"public-contract","selected_value":"Provider riêng provideSdGenericEntity { module, entity, schema(base),
        search?, display?, hooks?, listActions?, rowCommands?, bulkActions?, detailActions?, hiddenDefaults? }; schema dạng hàm thay vì object
        partial","source":"explicit-user","statement":"Tuỳ biến theo entity ở đâu? → Provider riêng provideSdGenericEntity { module, entity, schema(base),
        search?, display?, hooks?, listActions?, rowCommands?, bulkActions?, detailActions?, hiddenDefaults? }; schema dạng hàm thay vì object
        partial","status":"approved","supersedes":null,"task_refs":["TASK-005","TASK-008","TASK-009"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-006","AC-005"],"id":"D-012","owner_repository_id":"sdcorejs-angular","question":"Lưu
        cấu hình thế nào?","rationale":"Không cần nhận diện configurationId; server hay theo người dùng do consumer
        quyết.","revisit_condition":null,"scope":"public-contract","selected_value":"configuration: { get(entity), set(entity, schema) } trên adapter, mỗi
        entity một cấu hình, null là chưa có; adapter không khai thì localStorage","source":"explicit-user","statement":"Lưu cấu hình thế nào? → configuration:
        { get(entity), set(entity, schema) } trên adapter, mỗi entity một cấu hình, null là chưa có; adapter không khai thì
        localStorage","status":"approved","supersedes":null,"task_refs":["TASK-008","TASK-009","TASK-013"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-008","AC-007","AC-020"],"id":"D-013","owner_repository_id":"sdcorejs-angular","question":"Cấu
        hình đã lưu không hợp lệ thì sao?","rationale":"Bước validate quan trọng; trang không chết vì cấu hình
        hỏng.","revisit_condition":null,"scope":"public-contract","selected_value":"Tham chiếu treo tự bỏ; lỗi shape/version dùng mặc định + console.warn +
        banner cho người có quyền CONFIGURATION; lưu có lỗi thì chặn","source":"explicit-user","statement":"Cấu hình đã lưu không hợp lệ thì sao? → Tham chiếu
        treo tự bỏ; lỗi shape/version dùng mặc định + console.warn + banner cho người có quyền CONFIGURATION; lưu có lỗi thì
        chặn","status":"approved","supersedes":null,"task_refs":["TASK-006","TASK-007","TASK-013"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-009","AC-009"],"id":"D-014","owner_repository_id":"sdcorejs-angular","question":"Tiêu
        đề đặt ở đâu?","rationale":"Người dùng yêu cầu; tránh XSS như htmlTemplate
        cũ.","revisit_condition":null,"scope":"public-contract","selected_value":"Trong từng section list/create/update/detail, template ${key} có validate,
        render dạng text","source":"explicit-user","statement":"Tiêu đề đặt ở đâu? → Trong từng section list/create/update/detail, template ${key} có validate,
        render dạng
        text","status":"approved","supersedes":null,"task_refs":["TASK-006","TASK-007"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-011","AC-010"],"id":"D-015","owner_repository_id":"sdcorejs-angular","question":"Mã
        quyền và cơ chế kiểm tra?","rationale":"Định dạng người dùng đưa, thêm CONFIGURATION cho màn chỉnh cấu
        hình.","revisit_condition":null,"scope":"public-contract","selected_value":"<MODULE>_<ENTITY>_C_GENERIC_{LIST|DETAIL|CREATE|UPDATE|DELETE|IMPORT|CONFIGURATION}
        qua SdPermissionService, có permission: false","source":"explicit-user","statement":"Mã quyền và cơ chế kiểm tra? →
        <MODULE>_<ENTITY>_C_GENERIC_{LIST|DETAIL|CREATE|UPDATE|DELETE|IMPORT|CONFIGURATION} qua SdPermissionService, có permission:
        false","status":"approved","supersedes":null,"task_refs":["TASK-006","TASK-007","TASK-010"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-016","AC-019"],"id":"D-016","owner_repository_id":"sdcorejs-angular","question":"Luật
        import?","rationale":"Dùng lại create/update của adapter và sd-import-excel có
        sẵn.","revisit_condition":null,"scope":"public-contract","selected_value":"Template từ import.columns hoặc property insertable; enum theo value/label;
        relation theo matchField qua search; upsert theo upsertKey; tối đa 5 request song song; chỉ quyền IMPORT","source":"explicit-user","statement":"Luật
        import? → Template từ import.columns hoặc property insertable; enum theo value/label; relation theo matchField qua search; upsert theo upsertKey; tối đa
        5 request song song; chỉ quyền
        IMPORT","status":"approved","supersedes":null,"task_refs":["TASK-006","TASK-007","TASK-008","TASK-009"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-005","R-007","R-008"],"id":"D-017","owner_repository_id":"sdcorejs-angular","question":"Cách
        viết test?","rationale":"Logic thuần có giá trị TDD cao; UI chủ yếu là nối
        component.","revisit_condition":null,"scope":"repository","selected_value":"TDD cho logic (tra adapter/entity, dựng schema, merge, validate, template,
        fallback search, mã quyền, import upsert); viết test sau cho UI và Showcase","source":"explicit-user","statement":"Cách viết test? → TDD cho logic (tra
        adapter/entity, dựng schema, merge, validate, template, fallback search, mã quyền, import upsert); viết test sau cho UI và
        Showcase","status":"approved","supersedes":null,"task_refs":["TASK-002","TASK-006","TASK-008","TASK-012","TASK-014"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-020","AC-023"],"id":"D-018","owner_repository_id":"sdcorejs-angular","question":"Release?","rationale":"Không
        phá vỡ API consumer.","revisit_condition":null,"scope":"repository","selected_value":"Suffix minor kế tiếp 3.2, chỉ thêm mới, CHANGELOG Unreleased;
        tag/publish theo release ritual và cần người dùng cho phép riêng","source":"explicit-user","statement":"Release? → Suffix minor kế tiếp 3.2, chỉ thêm
        mới, CHANGELOG Unreleased; tag/publish theo release ritual và cần người dùng cho phép
        riêng","status":"approved","supersedes":null,"task_refs":["TASK-018","TASK-019"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["INV-002","INV-003","INV-007","R-001"],"id":"D-019","owner_repository_id":"sdcorejs-angular","question":"Phân
        tầng trong modules/generic?","rationale":"Logic dùng chung nằm ở hàm thuần để TDD và để list/form/import/màn cấu hình không tự quyết khác
        nhau.","revisit_condition":null,"scope":"module","selected_value":"models (type) → core (hàm thuần: merge, validate, dựng mặc định, tiêu đề, mã quyền,
        dựng form, map cột, kế hoạch import, request search) → registry (provider, scope) → services (schema, data, quyền, import) → routes/pages/components;
        tầng dưới không import tầng trên","source":"approved-architecture","statement":"Phân tầng trong modules/generic? → models (type) → core (hàm thuần:
        merge, validate, dựng mặc định, tiêu đề, mã quyền, dựng form, map cột, kế hoạch import, request search) → registry (provider, scope) → services (schema,
        data, quyền, import) → routes/pages/components; tầng dưới không import tầng
        trên","status":"approved","supersedes":null,"task_refs":["TASK-005","TASK-007","TASK-015"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["INV-001","R-005","AC-003"],"id":"D-020","owner_repository_id":"sdcorejs-angular","question":"Cơ
        chế registry cho provider gọi nhiều lần?","rationale":"Multi token ở injector con không gộp với cha; trùng cùng tầng là mơ hồ nên báo lỗi (làm rõ R-005:
        bao trùm trường hợp trùng trong một lần gọi); kiểm sớm để AC-003 ném lỗi lúc khởi tạo, không đợi lần điều hướng
        đầu.","revisit_condition":null,"scope":"module","selected_value":"Mỗi injector có một scope node dựng từ multi token cùng tầng (self) và scope cha
        (skipSelf); tra module rồi module+entity từ scope gần nhất lên root; trùng module (hoặc module+entity) trong cùng một injector là lỗi, kiểm ngay khi
        injector được tạo bằng provideEnvironmentInitializer; option permission lấy từ scope gần nhất có khai","source":"approved-architecture","statement":"Cơ
        chế registry cho provider gọi nhiều lần? → Mỗi injector có một scope node dựng từ multi token cùng tầng (self) và scope cha (skipSelf); tra module rồi
        module+entity từ scope gần nhất lên root; trùng module (hoặc module+entity) trong cùng một injector là lỗi, kiểm ngay khi injector được tạo bằng
        provideEnvironmentInitializer; option permission lấy từ scope gần nhất có
        khai","status":"approved","supersedes":null,"task_refs":["TASK-008","TASK-009"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["INV-002","R-006","AC-004"],"id":"D-021","owner_repository_id":"sdcorejs-angular","question":"Ai
        giữ schema hiệu lực và cache?","rationale":"Một nơi duy nhất dựng 3 lớp schema; tránh mỗi trang tự gọi
        adapter.schema.","revisit_condition":null,"scope":"module","selected_value":"SdGenericSchemaService ở injector môi trường của route generic giữ Promise
        schema theo module.entity; resolver của route nạp schema trước khi list/form/màn cấu hình kích hoạt; lưu cấu hình thì xoá cache entity
        đó","source":"approved-architecture","statement":"Ai giữ schema hiệu lực và cache? → SdGenericSchemaService ở injector môi trường của route generic giữ
        Promise schema theo module.entity; resolver của route nạp schema trước khi list/form/màn cấu hình kích hoạt; lưu cấu hình thì xoá cache entity
        đó","status":"approved","supersedes":null,"task_refs":["TASK-008","TASK-009"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["INV-008","R-013","AC-016"],"id":"D-022","owner_repository_id":"sdcorejs-angular","question":"Select
        relation lấy dữ liệu từ đâu khi form-generic chỉ nhận catalog tĩnh?","rationale":"Chỉ dùng API public của form-generic (catalog và templates cố định lúc
        provideSdFormGeneric chạy nên không thể một catalog theo id <module>.<entity> như phần Architecture của spec mô tả); một catalog phục vụ mọi relation.
        Hệ quả: cấu hình form-generic của portal ở root không áp lên form của module
        generic.","revisit_condition":null,"scope":"module","selected_value":"sdGenericRoutes() đăng ký provideSdFormGeneric({ catalogs: [sd-generic-relation]
        }) ở injector môi trường của route generic; field relation dùng catalog này với params hằng { module, entity, valueField, displayField, searchFields
        (nối bằng dấu phẩy) } để cache của form-generic phân biệt từng relation; callback của catalog gọi SdGenericDataService qua injector môi trường bắt bằng
        provideEnvironmentInitializer; vì option value của form-generic là chuỗi, SdGenericDataService đổi giá trị relation về kiểu gốc (theo dữ liệu đã tải)
        trước khi lưu","source":"approved-architecture","statement":"Select relation lấy dữ liệu từ đâu khi form-generic chỉ nhận catalog tĩnh? →
        sdGenericRoutes() đăng ký provideSdFormGeneric({ catalogs: [sd-generic-relation] }) ở injector môi trường của route generic; field relation dùng catalog
        này với params hằng { module, entity, valueField, displayField, searchFields (nối bằng dấu phẩy) } để cache của form-generic phân biệt từng relation;
        callback của catalog gọi SdGenericDataService qua injector môi trường bắt bằng provideEnvironmentInitializer; vì option value của form-generic là chuỗi,
        SdGenericDataService đổi giá trị relation về kiểu gốc (theo dữ liệu đã tải) trước khi
        lưu","status":"approved","supersedes":null,"task_refs":["TASK-008","TASK-009"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["INV-015","R-017","AC-020"],"id":"D-023","owner_repository_id":"sdcorejs-angular","question":"Tab
        Form của màn cấu hình đưa property vào layout thế nào?","rationale":"templates cố định lúc provideSdFormGeneric chạy nên không sinh theo entity được;
        panel property đáp ứng \"palette là properties\" của R-017 mà không mở rộng public API form-generic ngoài
        time/json.","revisit_condition":null,"scope":"module","selected_value":"sd-form-builder dùng [(schema)]; panel danh sách property chưa có trong layout,
        bấm để thêm field đã điền sẵn vào schema (builder nạp lại schema nên mất undo và vùng chọn hiện tại); không dùng templates của
        form-generic","source":"approved-architecture","statement":"Tab Form của màn cấu hình đưa property vào layout thế nào? → sd-form-builder dùng
        [(schema)]; panel danh sách property chưa có trong layout, bấm để thêm field đã điền sẵn vào schema (builder nạp lại schema nên mất undo và vùng chọn
        hiện tại); không dùng templates của
        form-generic","status":"approved","supersedes":null,"task_refs":["TASK-013","TASK-014"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["INV-005","INV-009","R-010","AC-011","AC-012"],"id":"D-024","owner_repository_id":"sdcorejs-angular","question":"Cây
        route và cách hiện page/drawer?","rationale":"List giữ nguyên trạng thái sd-table vì không bị huỷ khi mở drawer; SdPermissionGuard.canActivateChild từ
        chối route không có data.permission.","revisit_condition":null,"scope":"module","selected_value":"generic/:module/:entity là trang list có router-outlet
        cho create, :id/detail, :id/update; mọi route của sdGenericRoutes() khai data.permission = SD_PERMISSION_PUBLIC để SdPermissionGuard của portal không
        chặn, guard của module generic kiểm mã thật bằng hasPermission(code) với key mặc định; host form tự chọn page hoặc drawer sau khi schema đã resolve;
        drawer gọi open() sau khi render và (sdClosed) điều hướng về route list; page thì list ẩn nội dung khi outlet kích hoạt; trang list phản ứng khi
        :module/:entity đổi vì component được dùng lại; configuration là route anh em","source":"approved-architecture","statement":"Cây route và cách hiện
        page/drawer? → generic/:module/:entity là trang list có router-outlet cho create, :id/detail, :id/update; mọi route của sdGenericRoutes() khai
        data.permission = SD_PERMISSION_PUBLIC để SdPermissionGuard của portal không chặn, guard của module generic kiểm mã thật bằng hasPermission(code) với
        key mặc định; host form tự chọn page hoặc drawer sau khi schema đã resolve; drawer gọi open() sau khi render và (sdClosed) điều hướng về route list;
        page thì list ẩn nội dung khi outlet kích hoạt; trang list phản ứng khi :module/:entity đổi vì component được dùng lại; configuration là route anh
        em","status":"approved","supersedes":null,"task_refs":["TASK-010","TASK-011"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["INV-002","INV-008","INV-014","R-014","AC-017"],"id":"D-025","owner_repository_id":"sdcorejs-angular","question":"Ai
        gọi adapter?","rationale":"Mỗi nhóm hàm của adapter có đúng một cổng để hooks, fallback, validate và cache luôn đúng ở mọi
        màn.","revisit_condition":null,"scope":"module","selected_value":"SdGenericDataService là nơi duy nhất gọi query/detail/create/update/delete/search, áp
        hooks beforeSave/afterSave, thứ tự search entity → adapter → query và giới hạn 5 request song song cho import; SdGenericSchemaService là nơi duy nhất
        gọi schema và configuration.get/set","source":"approved-architecture","statement":"Ai gọi adapter? → SdGenericDataService là nơi duy nhất gọi
        query/detail/create/update/delete/search, áp hooks beforeSave/afterSave, thứ tự search entity → adapter → query và giới hạn 5 request song song cho
        import; SdGenericSchemaService là nơi duy nhất gọi schema và
        configuration.get/set","status":"approved","supersedes":null,"task_refs":["TASK-008","TASK-009"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["INV-010","R-001"],"id":"D-026","owner_repository_id":"sdcorejs-angular","question":"Nhãn
        giao diện của module?","rationale":"Theo quy ước core.<area>.* (vd core.module.layout.*) của thư
        viện.","revisit_condition":null,"scope":"module","selected_value":"Thêm khoá core.module.generic.* vào i18n sẵn có, đủ mọi file ngôn ngữ (en, vi, ja,
        ko, zh) vì chúng có kiểu Record<keyof EN_MESSAGES>; hiển thị qua sdTranslate","source":"approved-architecture","statement":"Nhãn giao diện của module? →
        Thêm khoá core.module.generic.* vào i18n sẵn có, đủ mọi file ngôn ngữ (en, vi, ja, ko, zh) vì chúng có kiểu Record<keyof EN_MESSAGES>; hiển thị qua
        sdTranslate","status":"approved","supersedes":null,"task_refs":["TASK-001"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["INV-003","R-008","AC-008"],"id":"D-027","owner_repository_id":"sdcorejs-angular","question":"Hình
        dạng của validateSdGenericSchema?","rationale":"Thống nhất với validator public đã có; stored có thể là JSON bất kỳ đọc từ
        server/localStorage.","revisit_condition":null,"scope":"module","selected_value":"validateSdGenericSchema(stored: unknown, base: SdGenericSchema) trả
        SdGenericSchemaIssue[] { code, severity, path, message }, cùng cách với validateSdApiContract","source":"approved-architecture","statement":"Hình dạng
        của validateSdGenericSchema? → validateSdGenericSchema(stored: unknown, base: SdGenericSchema) trả SdGenericSchemaIssue[] { code, severity, path,
        message }, cùng cách với
        validateSdApiContract","status":"approved","supersedes":null,"task_refs":["TASK-005","TASK-006","TASK-007"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["INV-010","R-001","AC-024"],"id":"D-028","owner_repository_id":"sdcorejs-angular","question":"Có
        đưa modules/generic vào barrel modules không?","rationale":"Giữ quy ước barrel của thư viện; entry gốc @sdcorejs/angular cũng export
        module.","revisit_condition":null,"scope":"module","selected_value":"Có, như auth/layout/permission/keycloak/icon; build v19 kiểm không có vòng phụ
        thuộc và không trùng tên export","source":"approved-architecture","statement":"Có đưa modules/generic vào barrel modules không? → Có, như
        auth/layout/permission/keycloak/icon; build v19 kiểm không có vòng phụ thuộc và không trùng tên
        export","status":"approved","supersedes":null,"task_refs":["TASK-015"],"type":"decision"},{"blocking":false,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["INV-005","R-011"],"id":"D-029","owner_repository_id":"sdcorejs-angular","question":"Nguồn
        quyền theo key riêng cho từng module generic?","rationale":"Spec chỉ có permission: boolean; thêm option key là mở rộng public API ngoài phạm vi đã
        duyệt.","revisit_condition":"Khi một portal cần nguồn quyền SdPermissionService khác nhau (key khác nhau) cho từng module
        generic.","scope":"module","selected_value":"Hoãn; module generic gọi hasPermission(code) với key mặc định của
        portal","source":"approved-architecture","statement":"Nguồn quyền theo key riêng cho từng module generic? → Hoãn; module generic gọi hasPermission(code)
        với key mặc định của
        portal","status":"deferred","supersedes":null,"task_refs":["TASK-010"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","R-012","R-013","R-014","R-015","R-016","R-017","R-018","R-019","R-020","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","AC-020","AC-021","AC-022","AC-023","AC-024","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009","INV-010","INV-011","INV-012","INV-013","INV-014","INV-015"],"id":"D-030","owner_repository_id":"sdcorejs-angular","question":"Ranh
        giới kiểm chứng nào áp dụng?","rationale":"Thư viện UI không sở hữu API; quyền phía server do backend của consumer kiểm
        (ST-001).","revisit_condition":null,"scope":"module","selected_value":"none","source":"approved-plan","statement":"Ranh giới kiểm chứng nào áp dụng? →
        none: thư viện chỉ ẩn UI và chặn route ở client; kiểm quyền thật thuộc backend của adapter (ST-001), nên không có bằng chứng từ chối phía server trong
        repo
        này","status":"approved","supersedes":null,"task_refs":["TASK-015","TASK-019"],"type":"decision","validation_boundary":{"kind":"none","source_refs":["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","R-012","R-013","R-014","R-015","R-016","R-017","R-018","R-019","R-020","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","AC-020","AC-021","AC-022","AC-023","AC-024","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009","INV-010","INV-011","INV-012","INV-013","INV-014","INV-015"]}},{"evidence_refs":["EVIDENCE-008","EVIDENCE-009"],"id":"INV-001","protected_refs":["R-005","AC-002","AC-003"],"statement":"Mọi
        màn (list, form, import, màn cấu hình, catalog relation) chỉ lấy adapter và cấu hình entity qua một resolver: scope gần nhất thắng, trùng cùng injector
        thì ném
        lỗi.","task_refs":["TASK-008","TASK-009"],"type":"invariant"},{"evidence_refs":["EVIDENCE-006","EVIDENCE-007","EVIDENCE-008","EVIDENCE-009"],"id":"INV-002","protected_refs":["R-006","R-007","AC-001","AC-004","AC-005","AC-006"],"statement":"Schema
        hiệu lực chỉ được dựng ở SdGenericSchemaService bằng hàm thuần: adapter.schema → entity.schema(base) → cấu hình đã lưu (validate rồi merge); chỉ
        SdGenericSchemaService gọi adapter.schema và configuration.get/set (hoặc localStorage khoá
        sd-generic:configuration:<module>.<entity>).","task_refs":["TASK-006","TASK-007","TASK-008","TASK-009"],"type":"invariant"},{"evidence_refs":["EVIDENCE-006","EVIDENCE-007","EVIDENCE-008","EVIDENCE-009","EVIDENCE-013","EVIDENCE-014"],"id":"INV-003","protected_refs":["R-008","AC-007","AC-008","AC-020"],"statement":"validateSdGenericSchema
        là hàm thuần duy nhất kiểm cấu hình; bước load và nút Lưu đều dùng nó; lỗi shape/version thì dùng mặc định, tham chiếu treo bị merge bỏ, có lỗi thì
        không gọi
        configuration.set.","task_refs":["TASK-006","TASK-007","TASK-008","TASK-009","TASK-013","TASK-014"],"type":"invariant"},{"evidence_refs":["EVIDENCE-005","EVIDENCE-015"],"id":"INV-004","protected_refs":["R-002","R-003","AC-006","AC-024"],"statement":"SdGenericSchema
        v1 chỉ chứa dữ liệu JSON (không function); function (schema, search, display, hooks, action) chỉ nằm ở provider; key, dataType, enums[].value,
        relation.entity luôn lấy từ schema hiện
        tại.","task_refs":["TASK-005","TASK-015"],"type":"invariant"},{"evidence_refs":["EVIDENCE-006","EVIDENCE-007","EVIDENCE-008","EVIDENCE-009","EVIDENCE-010","EVIDENCE-011","EVIDENCE-012"],"id":"INV-005","protected_refs":["R-011","AC-007","AC-010","AC-018"],"statement":"Mã
        quyền chỉ sinh từ một hàm thuần <MODULE>_<ENTITY>_C_GENERIC_<ACTION> viết hoa; guard route, hiển thị action và banner cấu hình lỗi đều dùng hàm đó;
        permission: false bỏ qua cả ba; mọi route của sdGenericRoutes() có data.permission = SD_PERMISSION_PUBLIC để guard của portal không chặn, còn guard của
        module generic kiểm mã
        thật.","task_refs":["TASK-006","TASK-007","TASK-008","TASK-009","TASK-010","TASK-011","TASK-012"],"type":"invariant"},{"evidence_refs":["EVIDENCE-006","EVIDENCE-007","EVIDENCE-011","EVIDENCE-012"],"id":"INV-006","protected_refs":["R-009","AC-009"],"statement":"Tiêu
        đề chỉ được parse/render bằng một hàm thuần; kết quả gắn vào DOM bằng nội suy text, không innerHTML; list.title và create.title không có
        placeholder.","task_refs":["TASK-006","TASK-007","TASK-011","TASK-012"],"type":"invariant"},{"evidence_refs":["EVIDENCE-006","EVIDENCE-007","EVIDENCE-011","EVIDENCE-012"],"id":"INV-007","protected_refs":["R-013","AC-015"],"statement":"Layout
        form của mỗi action do một hàm thuần dựng: field lấy type/label/options/validation từ general.properties; create bỏ system và không insertable; update
        bỏ system và không updatable; payload update chỉ gồm property
        updatable.","task_refs":["TASK-006","TASK-007","TASK-011","TASK-012"],"type":"invariant"},{"evidence_refs":["EVIDENCE-008","EVIDENCE-009"],"id":"INV-008","protected_refs":["R-004","R-013","R-014","AC-001","AC-016","AC-017"],"statement":"Chỉ
        SdGenericDataService gọi các hàm dữ liệu của adapter (query, detail, create, update, delete, search); mọi lần lưu đi qua beforeSave/afterSave; search
        theo thứ tự entity → adapter → query (CONTAIN để tìm, IN để lấy nhãn); giá trị relation được lưu đúng kiểu gốc; trang và component không gọi adapter
        trực
        tiếp.","task_refs":["TASK-008","TASK-009"],"type":"invariant"},{"evidence_refs":["EVIDENCE-010","EVIDENCE-011"],"id":"INV-009","protected_refs":["R-010","AC-011","AC-012"],"statement":"Kiểu
        hiển thị chỉ quyết định sau khi schema đã resolve, theo entity.display → adapter.display → 'page'; drawer render trong outlet của list, list không bị
        huỷ, back/đóng đưa về route
        list.","task_refs":["TASK-010","TASK-011"],"type":"invariant"},{"evidence_refs":["EVIDENCE-001","EVIDENCE-015","EVIDENCE-016","EVIDENCE-017","EVIDENCE-018"],"id":"INV-010","protected_refs":["R-001","AC-024"],"statement":"Entry
        point modules/generic export đúng 4 symbol runtime; không dùng HttpClient và không import package riêng của backend; chỉ import phần khác của thư viện
        qua entry point
        public.","task_refs":["TASK-001","TASK-015","TASK-016"],"type":"invariant"},{"evidence_refs":["EVIDENCE-001","EVIDENCE-002","EVIDENCE-003","EVIDENCE-004"],"id":"INV-011","protected_refs":["R-018","AC-021"],"statement":"form-generic
        chỉ thêm member time và json vào union field; type và hành vi hiện có không đổi; form-generic không import
        modules/generic.","task_refs":["TASK-001","TASK-002","TASK-003","TASK-004"],"type":"invariant"},{"evidence_refs":["EVIDENCE-004","EVIDENCE-017","EVIDENCE-018","EVIDENCE-019","EVIDENCE-020","EVIDENCE-021","EVIDENCE-022","EVIDENCE-023"],"id":"INV-012","protected_refs":["R-019","R-020","AC-022","AC-023"],"statement":"Chỉ
        sửa ở versions/v19 và showcase; v20/v21/v22 chỉ đổi qua npm run sync; check:sync xanh; CHANGELOG có mục Unreleased; guard example/registry của Showcase
        xanh.","task_refs":["TASK-004","TASK-015","TASK-016","TASK-017","TASK-018","TASK-019"],"type":"invariant"},{"evidence_refs":["EVIDENCE-006","EVIDENCE-007","EVIDENCE-011","EVIDENCE-012"],"id":"INV-013","protected_refs":["R-012","R-015","AC-013","AC-014","AC-018"],"statement":"List
        dùng sd-table server và chuyển PagingReq sang adapter.query; xoá có xác nhận, xoá nhiều gọi delete tuần tự, sau thay đổi thì reload; action mở rộng và
        action có sẵn đi chung một bước lọc
        quyền/visible/hiddenDefaults.","task_refs":["TASK-006","TASK-007","TASK-011","TASK-012"],"type":"invariant"},{"evidence_refs":["EVIDENCE-006","EVIDENCE-007","EVIDENCE-008","EVIDENCE-009","EVIDENCE-011","EVIDENCE-012"],"id":"INV-014","protected_refs":["R-016","AC-019"],"statement":"Import
        lập kế hoạch create/update bằng hàm thuần theo upsertKey, tra bản ghi đã có theo lô, chạy qua SdGenericDataService với tối đa 5 request song
        song.","task_refs":["TASK-006","TASK-007","TASK-008","TASK-009","TASK-011","TASK-012"],"type":"invariant"},{"evidence_refs":["EVIDENCE-013","EVIDENCE-014"],"id":"INV-015","protected_refs":["R-017","AC-005","AC-020"],"statement":"Màn
        cấu hình chỉ ghi qua SdGenericSchemaService.save (validate rồi configuration.set rồi xoá cache); key và dataType không sửa
        được.","task_refs":["TASK-013","TASK-014"],"type":"invariant"}],"revision":3,"schema_version":1}
  goal_backward_review:
    schema_version: 1
    mode: sdcorejs-plan:goal-backward
    decision_coverage:
      schema_version: 1
      revision: 3
      records:
        - id: R-001
          type: requirement
          statement: >-
            Thêm entry point @sdcorejs/angular/modules/generic, không phụ thuộc backend: public API runtime gồm provideSdGeneric, provideSdGenericEntity,
            sdGenericRoutes, validateSdGenericSchema; các model SdGenericSchema, SdGenericProperty, SdGenericAdapter… chỉ export dạng type. Không chứa adapter
            hay giá trị riêng của backend nào.
          source: explicit-user
          status: active
          owner_repository_id: sdcorejs-angular
          owner_module_id: modules/generic
          task_refs:
            - TASK-001
            - TASK-015
            - TASK-016
        - id: R-002
          type: requirement
          statement: >-
            Model SdGenericSchema { version: 1, module, entity, general { label, primaryKey?, properties }, list?, detail?, create?, update?, import? };
            detail/create/update có dạng { title?, form?: SdFormGenericSchema }; list có title?, columns?, externalFilters?, orders?, pageSize?, export?; import
            có columns?: { key, matchField? }[], upsertKey?.
          source: explicit-user
          status: active
          owner_repository_id: sdcorejs-angular
          owner_module_id: modules/generic
          task_refs:
            - TASK-005
            - TASK-015
        - id: R-003
          type: requirement
          statement: >-
            Model SdGenericProperty { key, label, dataType: string|text|number|boolean|date|datetime|time|enum|relation|json|file, multiple?, format?
            (email|phone|url|password cho string; integer|decimal|currency|percent cho number), enums?: { value, label, color?, icon? }[], relation?: { module?,
            entity, valueField? = 'id', displayField?, display?, searchFields? }, validation?, defaultValue?, insertable? = true, updatable? = true, system? };
            không có relation.type, multiple quyết định chọn một hay nhiều.
          source: explicit-user
          status: active
          owner_repository_id: sdcorejs-angular
          owner_module_id: modules/generic
          task_refs:
            - TASK-005
            - TASK-015
        - id: R-004
          type: requirement
          statement: >-
            Contract SdGenericAdapter { module, schema(entity), query(entity, PagingReq) → PagingRes, detail(entity, id), create(entity, data), update(entity,
            id, data), delete(entity, id), search?(entity, req), configuration?: { get(entity), set(entity, schema) }, display?(args) }; request/response dùng
            PagingReq/PagingRes/Filter/Order của @sdcorejs/utils.
          source: explicit-user
          status: active
          owner_repository_id: sdcorejs-angular
          owner_module_id: modules/generic
          task_refs:
            - TASK-005
            - TASK-008
            - TASK-009
        - id: R-005
          type: requirement
          statement: >-
            provideSdGeneric({ adapters, permission? }) và provideSdGenericEntity({ module, entity, … }) gọi được nhiều lần ở root và trong lazy route; tra cứu
            theo module (và module+entity) đi từ injector gần nhất lên root, bản gần nhất thắng; trùng module/entity trong cùng một lần gọi là lỗi khi khởi tạo;
            adapters nhận class (DI tạo) hoặc instance.
          source: explicit-user
          status: active
          owner_repository_id: sdcorejs-angular
          owner_module_id: modules/generic
          task_refs:
            - TASK-008
            - TASK-009
        - id: R-006
          type: requirement
          statement: >-
            Schema hiệu lực dựng qua 3 lớp: adapter.schema(entity) → provideSdGenericEntity.schema(base) (nếu có) = cấu hình mặc định →
            configuration.get(entity) khác null thì validate rồi merge lên trên; null thì dùng cấu hình mặc định. Adapter không khai configuration thì lib lưu ở
            localStorage. Mỗi entity một cấu hình; lưu theo server hay theo người dùng do adapter quyết định.
          source: explicit-user
          status: active
          owner_repository_id: sdcorejs-angular
          owner_module_id: modules/generic
          task_refs:
            - TASK-006
            - TASK-007
            - TASK-008
            - TASK-009
        - id: R-007
          type: requirement
          statement: >-
            Merge cấu hình đã lưu với schema hiện tại: key, dataType, enums[].value, relation.entity lấy từ schema hiện tại; label, nhãn enum, display,
            validation, defaultValue… lấy từ bản đã lưu; property không còn ở schema hiện tại bị bỏ khỏi general, list, layout form và import; property mới được
            thêm vào general và vào list.columns với visible: false, không tự chèn vào layout form đã lưu.
          source: explicit-user
          status: active
          owner_repository_id: sdcorejs-angular
          owner_module_id: modules/generic
          task_refs:
            - TASK-006
            - TASK-007
        - id: R-008
          type: requirement
          statement: >-
            validateSdGenericSchema(stored, base) trả danh sách issue { path, code, severity } kiểm tra: shape và version, key property không trùng,
            module/entity khớp, tham chiếu của list.columns/externalFilters/orders/import.columns/upsertKey/field trong layout tới property có thật, type field
            layout khớp dataType, ngữ pháp layout form-generic, upsertKey không multiple, field layout create phải insertable và update phải updatable, template
            tiêu đề. Khi load: tham chiếu treo tự bỏ; lỗi shape/version thì dùng cấu hình mặc định, console.warn và hiện banner cho người có quyền
            CONFIGURATION. Khi lưu: có lỗi thì chặn.
          source: explicit-user
          status: active
          owner_repository_id: sdcorejs-angular
          owner_module_id: modules/generic
          task_refs:
            - TASK-006
            - TASK-007
            - TASK-008
            - TASK-009
            - TASK-013
            - TASK-014
        - id: R-009
          type: requirement
          statement: >-
            Tiêu đề nằm trong từng section (list.title, create.title, detail.title, update.title), hỗ trợ template ${key}; list.title và create.title không được
            có placeholder; detail.title và update.title chỉ tham chiếu property có thật; tiêu đề render dạng text (không HTML); thiếu thì sinh từ
            general.label.
          source: explicit-user
          status: active
          owner_repository_id: sdcorejs-angular
          owner_module_id: modules/generic
          task_refs:
            - TASK-006
            - TASK-007
            - TASK-011
            - TASK-012
        - id: R-010
          type: requirement
          statement: >-
            sdGenericRoutes() cung cấp generic/:module/:entity, …/create, …/:id/detail, …/:id/update, …/configuration. Form detail/create/update hiển thị dạng
            page hoặc side-drawer theo provideSdGenericEntity.display → adapter.display → mặc định 'page'; side-drawer điều khiển bằng route: list vẫn hiển thị
            phía sau, giữ filter/trang, back đóng drawer, lưu xong list reload.
          source: explicit-user
          status: active
          owner_repository_id: sdcorejs-angular
          owner_module_id: modules/generic
          task_refs:
            - TASK-010
            - TASK-011
        - id: R-011
          type: requirement
          statement: >-
            Quyền theo định dạng <MODULE>_<ENTITY>_C_GENERIC_{LIST|DETAIL|CREATE|UPDATE|DELETE|IMPORT|CONFIGURATION} (viết hoa), kiểm tra qua
            SdPermissionService.hasPermission; thiếu quyền thì ẩn action và chặn route tương ứng; provideSdGeneric({ permission: false }) tắt kiểm tra.
          source: explicit-user
          status: active
          owner_repository_id: sdcorejs-angular
          owner_module_id: modules/generic
          task_refs:
            - TASK-006
            - TASK-007
            - TASK-008
            - TASK-009
            - TASK-010
            - TASK-011
        - id: R-012
          type: requirement
          statement: >-
            Màn list dùng sd-table type server: cột mặc định là mọi property trừ json/file; visible: false là ẩn mặc định nhưng bật lại được;
            sortable/filterable; externalFilters; orders mặc định; pageSize mặc định 20; export Excel phía client khi bật; action có sẵn create/import/export
            (header), detail/update/delete (dòng), delete (chọn nhiều, gọi delete lần lượt); xoá có xác nhận và reload sau khi xoá.
          source: explicit-user
          status: active
          owner_repository_id: sdcorejs-angular
          owner_module_id: modules/generic
          task_refs:
            - TASK-006
            - TASK-007
            - TASK-011
            - TASK-012
        - id: R-013
          type: requirement
          statement: >-
            Detail/create/update render bằng sd-form-render: layout = section.form ?? detail.form ?? tự sinh từ general; mỗi field layout được điền
            type/label/options/validation từ general theo key; detail ở chế độ viewed và hiện cả property system; create bỏ system và property không insertable;
            update bỏ system và property không updatable, payload update chỉ gồm property updatable; relation dùng catalog do lib tự đăng ký, search theo thứ tự
            provideSdGenericEntity.search → adapter.search → adapter.query với CONTAIN (tìm) / IN (lấy nhãn).
          source: explicit-user
          status: active
          owner_repository_id: sdcorejs-angular
          owner_module_id: modules/generic
          task_refs:
            - TASK-006
            - TASK-007
            - TASK-008
            - TASK-009
            - TASK-011
            - TASK-012
        - id: R-014
          type: requirement
          statement: >-
            provideSdGenericEntity.hooks: beforeSave(ctx { action, data, schema }) trả payload (đồng bộ hoặc Promise) trước khi gọi adapter.create/update;
            afterSave(ctx) chạy sau khi lưu thành công.
          source: explicit-user
          status: active
          owner_repository_id: sdcorejs-angular
          owner_module_id: modules/generic
          task_refs:
            - TASK-008
            - TASK-009
        - id: R-015
          type: requirement
          statement: >-
            provideSdGenericEntity khai action mở rộng: listActions, rowCommands, bulkActions, detailActions với { id, label, icon?, permission?, visible?(ctx),
            run(ctx) }, ctx gồm schema, row hoặc rows, reload(); hiddenDefaults ẩn action có sẵn (create, import, export, detail, update, delete).
          source: explicit-user
          status: active
          owner_repository_id: sdcorejs-angular
          owner_module_id: modules/generic
          task_refs:
            - TASK-011
            - TASK-012
        - id: R-016
          type: requirement
          statement: >-
            Import dùng sd-import-excel: template từ import.columns hoặc mọi property insertable trừ system/json/file; ô enum nhận value hoặc label; ô relation
            so khớp theo matchField (mặc định relation.displayField) qua search với values; có upsertKey thì tra theo lô bản ghi đã tồn tại → update, chưa có →
            create; không upsertKey thì luôn create; tối đa 5 request song song; kết quả từng dòng hiện trong sd-import-excel; chỉ cần quyền IMPORT.
          source: explicit-user
          status: active
          owner_repository_id: sdcorejs-angular
          owner_module_id: modules/generic
          task_refs:
            - TASK-006
            - TASK-007
            - TASK-008
            - TASK-009
            - TASK-011
            - TASK-012
        - id: R-017
          type: requirement
          statement: >-
            Màn chỉnh cấu hình tại …/configuration với 4 tab: Thông tin chung (label, nhãn/màu enum, display/searchFields của relation, validation,
            defaultValue, insertable/updatable; không sửa key/dataType), Danh sách (thứ tự cột, width/visible/sortable/filterable, externalFilters, orders,
            pageSize, export), Form (sd-form-builder cho detail, create/update có lựa chọn "giống detail", palette là properties), Import (columns, upsertKey);
            hiện cảnh báo property bị bỏ/mới; nút Lưu validate rồi gọi configuration.set(entity, schema), có lỗi thì chặn.
          source: explicit-user
          status: active
          owner_repository_id: sdcorejs-angular
          owner_module_id: modules/generic
          task_refs:
            - TASK-013
            - TASK-014
        - id: R-018
          type: requirement
          statement: >-
            form-generic thêm field type time (giá trị chuỗi HH:mm) và json (dùng code-editor, giá trị JSON hợp lệ) ở renderer, builder và validation; chỉ thêm
            mới, schema form-generic hiện có không đổi hành vi.
          source: explicit-user
          status: active
          owner_repository_id: sdcorejs-angular
          owner_module_id: components/form-generic
          task_refs:
            - TASK-001
            - TASK-002
            - TASK-003
            - TASK-004
        - id: R-019
          type: requirement
          statement: Showcase có trang demo module generic chạy với adapter mock in-memory; có tài liệu sd-generic.md và cập nhật sd-form-generic.md cho time/json.
          source: explicit-user
          status: active
          owner_repository_id: sdcorejs-angular
          owner_module_id: showcase
          task_refs:
            - TASK-004
            - TASK-016
            - TASK-017
        - id: R-020
          type: requirement
          statement: >-
            Thay đổi viết ở versions/v19 rồi rollout sang v20/v21/v22 bằng npm run sync, check:sync xanh; CHANGELOG có mục Unreleased mô tả thay đổi, nhắm
            release suffix 3.2 (chỉ thêm mới).
          source: explicit-user
          status: active
          owner_repository_id: sdcorejs-angular
          owner_module_id: null
          task_refs:
            - TASK-015
            - TASK-018
            - TASK-019
        - id: AC-001
          type: acceptance-criterion
          statement: >-
            Mở generic/tms/order khi configuration.get trả null → Màn list hiện các cột sinh từ properties (trừ json/file), dữ liệu lấy qua adapter.query với
            PagingReq pageSize 20
          behavior: Mở generic/tms/order khi configuration.get trả null
          expected_result: Màn list hiện các cột sinh từ properties (trừ json/file), dữ liệu lấy qua adapter.query với PagingReq pageSize 20
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-004
            - R-006
            - R-012
          task_refs:
            - TASK-008
            - TASK-009
            - TASK-011
            - TASK-012
        - id: AC-002
          type: acceptance-criterion
          statement: >-
            Cùng module tms khai ở provideSdGeneric root và trong lazy route rồi mở trang generic trong lazy route đó → Lib dùng adapter khai ở lazy route;
            trang ngoài lazy route dùng adapter root
          behavior: Cùng module tms khai ở provideSdGeneric root và trong lazy route rồi mở trang generic trong lazy route đó
          expected_result: Lib dùng adapter khai ở lazy route; trang ngoài lazy route dùng adapter root
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-005
          task_refs:
            - TASK-008
            - TASK-009
        - id: AC-003
          type: acceptance-criterion
          statement: Một lần gọi provideSdGeneric khai hai adapter cùng module → Khởi tạo injector ném lỗi nêu tên module bị trùng
          behavior: Một lần gọi provideSdGeneric khai hai adapter cùng module
          expected_result: Khởi tạo injector ném lỗi nêu tên module bị trùng
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-005
          task_refs:
            - TASK-008
            - TASK-009
        - id: AC-004
          type: acceptance-criterion
          statement: >-
            provideSdGenericEntity.schema đổi label của một property và configuration.get trả bản đã lưu đổi label property khác → Schema hiệu lực có cả hai
            thay đổi; khi get trả null thì chỉ có thay đổi của provideSdGenericEntity.schema
          behavior: provideSdGenericEntity.schema đổi label của một property và configuration.get trả bản đã lưu đổi label property khác
          expected_result: Schema hiệu lực có cả hai thay đổi; khi get trả null thì chỉ có thay đổi của provideSdGenericEntity.schema
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-006
          task_refs:
            - TASK-008
            - TASK-009
        - id: AC-005
          type: acceptance-criterion
          statement: Adapter không khai configuration, lưu cấu hình từ màn chỉnh rồi tải lại trang → Cấu hình được ghi và đọc lại từ localStorage theo module và entity
          behavior: Adapter không khai configuration, lưu cấu hình từ màn chỉnh rồi tải lại trang
          expected_result: Cấu hình được ghi và đọc lại từ localStorage theo module và entity
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-006
            - R-017
          task_refs:
            - TASK-008
            - TASK-009
            - TASK-013
            - TASK-014
        - id: AC-006
          type: acceptance-criterion
          statement: >-
            Cấu hình đã lưu có cột và field layout trỏ tới property đã bị xoá ở schema hiện tại, và schema hiện tại có property mới → Cột/field treo bị bỏ,
            trang vẫn chạy; property mới có trong general và list.columns với visible: false, không có trong layout form đã lưu; dataType lấy từ schema hiện tại
          behavior: Cấu hình đã lưu có cột và field layout trỏ tới property đã bị xoá ở schema hiện tại, và schema hiện tại có property mới
          expected_result: >-
            Cột/field treo bị bỏ, trang vẫn chạy; property mới có trong general và list.columns với visible: false, không có trong layout form đã lưu; dataType
            lấy từ schema hiện tại
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-007
            - R-008
          task_refs:
            - TASK-005
            - TASK-006
            - TASK-007
        - id: AC-007
          type: acceptance-criterion
          statement: >-
            configuration.get trả object sai shape hoặc version không hỗ trợ → Lib dùng cấu hình mặc định, gọi console.warn, banner "cấu hình không hợp lệ" chỉ
            hiện với người có quyền CONFIGURATION
          behavior: configuration.get trả object sai shape hoặc version không hỗ trợ
          expected_result: Lib dùng cấu hình mặc định, gọi console.warn, banner "cấu hình không hợp lệ" chỉ hiện với người có quyền CONFIGURATION
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-008
            - R-011
          task_refs:
            - TASK-008
            - TASK-009
            - TASK-011
            - TASK-012
        - id: AC-008
          type: acceptance-criterion
          statement: >-
            validateSdGenericSchema nhận schema có key trùng, upsertKey trỏ property multiple, field layout update không updatable, field layout sai type → Trả
            issue với path và code tương ứng cho từng lỗi, severity error
          behavior: validateSdGenericSchema nhận schema có key trùng, upsertKey trỏ property multiple, field layout update không updatable, field layout sai type
          expected_result: Trả issue với path và code tương ứng cho từng lỗi, severity error
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-008
          task_refs:
            - TASK-006
            - TASK-007
        - id: AC-009
          type: acceptance-criterion
          statement: >-
            Validate update.title = 'Đơn ${unknown}' và list.title = 'DS ${code}'; render detail.title = '<b>${code}</b>' → Cả hai title đầu bị báo lỗi
            template; title detail hiện chuỗi text đã thay giá trị, thẻ <b> không được render thành HTML
          behavior: Validate update.title = 'Đơn ${unknown}' và list.title = 'DS ${code}'; render detail.title = '<b>${code}</b>'
          expected_result: Cả hai title đầu bị báo lỗi template; title detail hiện chuỗi text đã thay giá trị, thẻ <b> không được render thành HTML
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-008
            - R-009
          task_refs:
            - TASK-006
            - TASK-007
            - TASK-011
            - TASK-012
        - id: AC-010
          type: acceptance-criterion
          statement: >-
            Người dùng thiếu quyền TMS_ORDER_C_GENERIC_CREATE mở màn list rồi điều hướng thẳng tới generic/tms/order/create → Nút tạo mới bị ẩn và route create
            bị chặn; khi provideSdGeneric({ permission: false }) thì nút hiện và route mở được
          behavior: Người dùng thiếu quyền TMS_ORDER_C_GENERIC_CREATE mở màn list rồi điều hướng thẳng tới generic/tms/order/create
          expected_result: 'Nút tạo mới bị ẩn và route create bị chặn; khi provideSdGeneric({ permission: false }) thì nút hiện và route mở được'
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-010
            - R-011
          task_refs:
            - TASK-006
            - TASK-007
            - TASK-010
            - TASK-011
        - id: AC-011
          type: acceptance-criterion
          statement: >-
            display trả 'side-drawer', người dùng lọc list rồi mở generic/tms/order/1/detail và bấm back → Drawer mở đè lên list, URL có /1/detail; back đóng
            drawer, list giữ filter và trang
          behavior: display trả 'side-drawer', người dùng lọc list rồi mở generic/tms/order/1/detail và bấm back
          expected_result: Drawer mở đè lên list, URL có /1/detail; back đóng drawer, list giữ filter và trang
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-010
          task_refs:
            - TASK-010
            - TASK-011
        - id: AC-012
          type: acceptance-criterion
          statement: >-
            Không khai display và mở generic/tms/order/1/update → Form update hiển thị dạng trang đầy đủ (mặc định 'page'); lưu thành công thì quay về list và
            list reload
          behavior: Không khai display và mở generic/tms/order/1/update
          expected_result: Form update hiển thị dạng trang đầy đủ (mặc định 'page'); lưu thành công thì quay về list và list reload
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-010
          task_refs:
            - TASK-010
            - TASK-011
        - id: AC-013
          type: acceptance-criterion
          statement: >-
            list có column visible: false, orders mặc định và externalFilters có default → Cột ẩn nhưng có trong cài đặt cột; request query mang orders và
            filters tương ứng
          behavior: 'list có column visible: false, orders mặc định và externalFilters có default'
          expected_result: Cột ẩn nhưng có trong cài đặt cột; request query mang orders và filters tương ứng
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-012
          task_refs:
            - TASK-006
            - TASK-007
            - TASK-011
            - TASK-012
        - id: AC-014
          type: acceptance-criterion
          statement: Xoá một dòng và xoá 3 dòng đã chọn → Mỗi lần có hộp xác nhận; adapter.delete được gọi 1 lần rồi 3 lần tuần tự; list reload sau khi xoá
          behavior: Xoá một dòng và xoá 3 dòng đã chọn
          expected_result: Mỗi lần có hộp xác nhận; adapter.delete được gọi 1 lần rồi 3 lần tuần tự; list reload sau khi xoá
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-012
          task_refs:
            - TASK-011
            - TASK-012
        - id: AC-015
          type: acceptance-criterion
          statement: >-
            Mở create, update, detail với schema không có layout form và có property system, property updatable: false → Create không có system; update không có
            system và property không updatable, payload update không chứa chúng; detail ở chế độ viewed và có property system; field có label/type/options lấy
            từ general
          behavior: 'Mở create, update, detail với schema không có layout form và có property system, property updatable: false'
          expected_result: >-
            Create không có system; update không có system và property không updatable, payload update không chứa chúng; detail ở chế độ viewed và có property
            system; field có label/type/options lấy từ general
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-013
          task_refs:
            - TASK-006
            - TASK-007
            - TASK-011
            - TASK-012
        - id: AC-016
          type: acceptance-criterion
          statement: >-
            Mở select relation với entity có search riêng, với adapter có search, và với adapter chỉ có query → Lần lượt gọi search của entity, search của
            adapter, query với filter CONTAIN trên searchFields/displayField; nhãn giá trị đã chọn lấy qua IN trên valueField
          behavior: Mở select relation với entity có search riêng, với adapter có search, và với adapter chỉ có query
          expected_result: >-
            Lần lượt gọi search của entity, search của adapter, query với filter CONTAIN trên searchFields/displayField; nhãn giá trị đã chọn lấy qua IN trên
            valueField
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-013
            - R-004
          task_refs:
            - TASK-006
            - TASK-007
            - TASK-008
            - TASK-009
        - id: AC-017
          type: acceptance-criterion
          statement: >-
            beforeSave thêm field vào payload và afterSave được khai → adapter.create/update nhận payload đã sửa; afterSave chạy đúng một lần sau khi lưu thành
            công và không chạy khi lưu lỗi
          behavior: beforeSave thêm field vào payload và afterSave được khai
          expected_result: adapter.create/update nhận payload đã sửa; afterSave chạy đúng một lần sau khi lưu thành công và không chạy khi lưu lỗi
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-014
          task_refs:
            - TASK-008
            - TASK-009
        - id: AC-018
          type: acceptance-criterion
          statement: >-
            provideSdGenericEntity khai rowCommands có permission và visible, hiddenDefaults: [delete] → Command chỉ hiện khi có quyền và visible trả true, run
            nhận ctx có row và reload; command delete có sẵn bị ẩn
          behavior: 'provideSdGenericEntity khai rowCommands có permission và visible, hiddenDefaults: [delete]'
          expected_result: Command chỉ hiện khi có quyền và visible trả true, run nhận ctx có row và reload; command delete có sẵn bị ẩn
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-015
          task_refs:
            - TASK-011
            - TASK-012
        - id: AC-019
          type: acceptance-criterion
          statement: >-
            Import file 3 dòng với upsertKey code (1 dòng code đã tồn tại), một ô enum ghi bằng label, một ô relation ghi theo displayField → Dòng đã tồn tại
            gọi update, hai dòng còn lại gọi create; enum và relation được đổi sang value/id; không quá 5 request chạy đồng thời; kết quả từng dòng hiện trong
            sd-import-excel
          behavior: Import file 3 dòng với upsertKey code (1 dòng code đã tồn tại), một ô enum ghi bằng label, một ô relation ghi theo displayField
          expected_result: >-
            Dòng đã tồn tại gọi update, hai dòng còn lại gọi create; enum và relation được đổi sang value/id; không quá 5 request chạy đồng thời; kết quả từng
            dòng hiện trong sd-import-excel
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-016
          task_refs:
            - TASK-006
            - TASK-007
            - TASK-008
            - TASK-009
            - TASK-011
            - TASK-012
        - id: AC-020
          type: acceptance-criterion
          statement: >-
            Ở màn chỉnh cấu hình, xoá property đang dùng làm upsertKey khỏi import rồi bấm Lưu; sau đó sửa label hợp lệ rồi bấm Lưu → Lần đầu bị chặn và hiện
            lỗi; lần sau gọi configuration.set(entity, schema) với label mới; ô key và dataType không sửa được
          behavior: Ở màn chỉnh cấu hình, xoá property đang dùng làm upsertKey khỏi import rồi bấm Lưu; sau đó sửa label hợp lệ rồi bấm Lưu
          expected_result: Lần đầu bị chặn và hiện lỗi; lần sau gọi configuration.set(entity, schema) với label mới; ô key và dataType không sửa được
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-017
            - R-008
          task_refs:
            - TASK-013
            - TASK-014
        - id: AC-021
          type: acceptance-criterion
          statement: >-
            Render schema form-generic có field time và json; nhập '25:00' và chuỗi JSON sai → Hai field báo lỗi validation; giá trị đúng được lưu là chuỗi
            HH:mm và JSON đã parse; builder có hai loại field này trong palette; spec form-generic hiện có vẫn xanh
          behavior: Render schema form-generic có field time và json; nhập '25:00' và chuỗi JSON sai
          expected_result: >-
            Hai field báo lỗi validation; giá trị đúng được lưu là chuỗi HH:mm và JSON đã parse; builder có hai loại field này trong palette; spec form-generic
            hiện có vẫn xanh
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-018
          task_refs:
            - TASK-001
            - TASK-002
            - TASK-003
            - TASK-004
        - id: AC-022
          type: acceptance-criterion
          statement: Mở trang demo module generic trên Showcase → Trang hiện list từ adapter mock và mở được create/detail; guard example/registry của Showcase xanh
          behavior: Mở trang demo module generic trên Showcase
          expected_result: Trang hiện list từ adapter mock và mở được create/detail; guard example/registry của Showcase xanh
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-019
          task_refs:
            - TASK-004
            - TASK-016
            - TASK-017
        - id: AC-023
          type: acceptance-criterion
          statement: >-
            Chạy npm run sync rồi npm run check:sync và build sdcorejs-angular trên v19–v22 → check:sync xanh, bốn workspace build không lỗi; CHANGELOG có mục
            Unreleased cho module generic
          behavior: Chạy npm run sync rồi npm run check:sync và build sdcorejs-angular trên v19–v22
          expected_result: check:sync xanh, bốn workspace build không lỗi; CHANGELOG có mục Unreleased cho module generic
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-020
          task_refs:
            - TASK-015
            - TASK-018
            - TASK-019
        - id: AC-024
          type: acceptance-criterion
          statement: >-
            Chạy spec public-api của entry point modules/generic → Entry point export đúng bốn symbol runtime provideSdGeneric, provideSdGenericEntity,
            sdGenericRoutes, validateSdGenericSchema; không import package riêng của backend nào
          behavior: Chạy spec public-api của entry point modules/generic
          expected_result: >-
            Entry point export đúng bốn symbol runtime provideSdGeneric, provideSdGenericEntity, sdGenericRoutes, validateSdGenericSchema; không import package
            riêng của backend nào
          verification_kind: automated
          blocking: true
          requirement_refs:
            - R-001
            - R-002
            - R-003
          task_refs:
            - TASK-001
            - TASK-005
            - TASK-015
            - TASK-016
        - id: A-001
          type: assumption
          statement: Multi-provider khai trong injector con không gộp với injector cha; lib phải tự đi từ injector gần nhất lên root (skipSelf) để tìm adapter/entity.
          evidence_refs: []
          source: inferred
          confidence: high
          status: confirmed
          blocking: false
          consequence_if_wrong: Có thể đọc trực tiếp token multi thay vì đi theo chuỗi injector; thiết kế vẫn đúng nhưng thừa code.
          validation_method: Test TDD cho AC-002 với injector root + lazy.
          owner: sdcorejs-execute-plan
          rationale: Hành vi chuẩn của Angular DI; đã gặp ở SD_API_CONFIG (SdApiHandlerRegistry).
          impacted_refs:
            - R-005
        - id: A-002
          type: assumption
          statement: sd-table server truyền PagingReq (filters, orders, pageSize, pageNumber) đủ để chuyển thẳng sang adapter.query, gồm cả external filter.
          evidence_refs: []
          source: inferred
          confidence: medium
          status: proposed
          blocking: false
          consequence_if_wrong: Cần lớp chuyển SdTableFilterRequest sang Filter trong module generic.
          validation_method: Test TDD cho AC-013 đối chiếu request thực tế sd-table phát ra.
          owner: sdcorejs-execute-plan
          rationale: 'components/table/src/models/table-option.model.ts:198 khai items(filterRequest, pagingReq: PagingReq).'
          impacted_refs:
            - R-012
        - id: A-003
          type: assumption
          statement: sd-import-excel accept(items) trả SdImportExcelValidation[] đủ để báo kết quả từng dòng sau khi gọi create/update.
          evidence_refs: []
          source: inferred
          confidence: medium
          status: proposed
          blocking: false
          consequence_if_wrong: Cần thêm hiển thị kết quả riêng sau bước accept.
          validation_method: Test cho AC-019.
          owner: sdcorejs-execute-plan
          rationale: components/import-excel/src/import-excel.model.ts:17.
          impacted_refs:
            - R-016
        - id: A-004
          type: assumption
          statement: sd-code-editor dùng được làm control (model/ControlValueAccessor) bên trong renderer form-generic cho field json.
          evidence_refs: []
          source: inferred
          confidence: medium
          status: proposed
          blocking: false
          consequence_if_wrong: Field json cần bọc adapter control riêng quanh code-editor.
          validation_method: Test cho AC-021.
          owner: sdcorejs-execute-plan
          rationale: components/code-editor/src/code-editor.component.ts có model/CVA.
          impacted_refs:
            - R-018
        - id: A-005
          type: assumption
          statement: Khoá localStorage mặc định là sd-generic:configuration:<module>.<entity>; cấu hình chỉ có hiệu lực trên trình duyệt đó.
          evidence_refs: []
          source: defaulted
          confidence: high
          status: proposed
          blocking: false
          consequence_if_wrong: Đổi tên khoá trước release, chưa có dữ liệu cũ.
          validation_method: Người dùng duyệt spec; test cho AC-005.
          owner: user
          rationale: Người dùng chốt mặc định localStorage; tên khoá do spec đặt.
          impacted_refs:
            - R-006
        - id: D-001
          type: decision
          statement: >-
            Module generic đặt ở repo nào? → @sdcorejs/angular, entry point @sdcorejs/angular/modules/generic, không phụ thuộc backend; adapter backend OMD nằm
            ngoài repo
          question: Module generic đặt ở repo nào?
          selected_value: '@sdcorejs/angular, entry point @sdcorejs/angular/modules/generic, không phụ thuộc backend; adapter backend OMD nằm ngoài repo'
          source: explicit-user
          status: approved
          blocking: true
          scope: repository
          owner_repository_id: sdcorejs-angular
          rationale: form-generic 3.0 đã ở đây; nguyên tắc adapter không phụ thuộc backend.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-001
            - AC-024
          task_refs:
            - TASK-015
            - TASK-016
        - id: D-002
          type: decision
          statement: >-
            Ghép SdGenericSchema với form-generic thế nào? → general.properties là nguồn duy nhất; detail/create/update chứa layout SdFormGenericSchema tham
            chiếu property theo key, lib điền type/label/options/validation lúc render; thiếu layout thì tự sinh
          question: Ghép SdGenericSchema với form-generic thế nào?
          selected_value: >-
            general.properties là nguồn duy nhất; detail/create/update chứa layout SdFormGenericSchema tham chiếu property theo key, lib điền
            type/label/options/validation lúc render; thiếu layout thì tự sinh
          source: explicit-user
          status: approved
          blocking: true
          scope: public-contract
          owner_repository_id: sdcorejs-angular
          rationale: Tránh cấu hình trùng lặp (pain point lib-core-commerce) mà vẫn dùng đủ form-generic và sd-form-builder.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-002
            - R-013
            - AC-015
          task_refs:
            - TASK-005
            - TASK-007
            - TASK-011
        - id: D-003
          type: decision
          statement: >-
            Tên gọi trong model và adapter? → properties (không phải fields), adapter.detail (không phải get), configuration: { get, set }, entity (không phải
            typeCode)
          question: Tên gọi trong model và adapter?
          selected_value: 'properties (không phải fields), adapter.detail (không phải get), configuration: { get, set }, entity (không phải typeCode)'
          source: explicit-user
          status: approved
          blocking: true
          scope: public-contract
          owner_repository_id: sdcorejs-angular
          rationale: Theo convention API của người dùng.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-002
            - R-004
            - AC-001
          task_refs:
            - TASK-005
        - id: D-004
          type: decision
          statement: Định dạng route? → generic/:module/:entity, /create, /:id/detail, /:id/update, /configuration (id đứng trước action)
          question: Định dạng route?
          selected_value: generic/:module/:entity, /create, /:id/detail, /:id/update, /configuration (id đứng trước action)
          source: explicit-user
          status: approved
          blocking: true
          scope: public-contract
          owner_repository_id: sdcorejs-angular
          rationale: Mỗi entity một cấu hình nên route mang thẳng module/entity, không cần tách chuỗi.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-010
            - AC-011
            - AC-012
          task_refs:
            - TASK-010
            - TASK-011
        - id: D-005
          type: decision
          statement: >-
            Page hay side-drawer quyết định ở đâu? → Callback display(args) ở provideSdGenericEntity rồi adapter, mặc định 'page'; side-drawer điều khiển bằng
            route
          question: Page hay side-drawer quyết định ở đâu?
          selected_value: Callback display(args) ở provideSdGenericEntity rồi adapter, mặc định 'page'; side-drawer điều khiển bằng route
          source: explicit-user
          status: approved
          blocking: true
          scope: public-contract
          owner_repository_id: sdcorejs-angular
          rationale: Consumer quyết theo schema, ví dụ số property; deep link và back hoạt động.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-010
            - AC-011
          task_refs:
            - TASK-010
            - TASK-011
        - id: D-006
          type: decision
          statement: 'Phạm vi giao lần này? → Làm hết một lần: runtime CRUD, import, màn chỉnh cấu hình, action mở rộng, form-generic time/json, Showcase, docs'
          question: Phạm vi giao lần này?
          selected_value: 'Làm hết một lần: runtime CRUD, import, màn chỉnh cấu hình, action mở rộng, form-generic time/json, Showcase, docs'
          source: explicit-user
          status: approved
          blocking: true
          scope: repository
          owner_repository_id: sdcorejs-angular
          rationale: Người dùng chọn phương án 3.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-012
            - R-016
            - R-017
            - R-018
            - R-019
          task_refs:
            - TASK-011
            - TASK-012
            - TASK-017
        - id: D-007
          type: decision
          statement: >-
            provide một hay nhiều lần? → Nhiều lần ở root và lazy route; tra injector gần nhất lên root, gần nhất thắng; không dùng registry đọc field private
            của router
          question: provide một hay nhiều lần?
          selected_value: Nhiều lần ở root và lazy route; tra injector gần nhất lên root, gần nhất thắng; không dùng registry đọc field private của router
          source: explicit-user
          status: approved
          blocking: true
          scope: public-contract
          owner_repository_id: sdcorejs-angular
          rationale: Module tự provide adapter; registry root chỉ thấy module đã load và phụ thuộc field private.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-005
            - AC-002
            - AC-003
          task_refs:
            - TASK-008
            - TASK-009
        - id: D-008
          type: decision
          statement: time và json? → Thêm field type time và json vào form-generic (json dùng code-editor), chỉ thêm mới
          question: time và json?
          selected_value: Thêm field type time và json vào form-generic (json dùng code-editor), chỉ thêm mới
          source: explicit-user
          status: approved
          blocking: true
          scope: public-contract
          owner_repository_id: sdcorejs-angular
          rationale: Phạm vi làm hết một lần; tránh map tạm kém chính xác.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-018
            - AC-021
          task_refs:
            - TASK-002
            - TASK-003
            - TASK-004
        - id: D-009
          type: decision
          statement: Quan hệ OneToMany và relation.type? → Chỉ multi-select, không bảng con; bỏ relation.type, multiple quyết định một/nhiều
          question: Quan hệ OneToMany và relation.type?
          selected_value: Chỉ multi-select, không bảng con; bỏ relation.type, multiple quyết định một/nhiều
          source: explicit-user
          status: approved
          blocking: true
          scope: public-contract
          owner_repository_id: sdcorejs-angular
          rationale: Giữ đơn giản như lib-core-commerce; bảng con để sau.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-003
            - AC-016
          task_refs:
            - TASK-005
            - TASK-007
        - id: D-010
          type: decision
          statement: search và history? → search? tuỳ chọn ở adapter và ở entity, fallback query CONTAIN/IN; history không thuộc lib
          question: search và history?
          selected_value: search? tuỳ chọn ở adapter và ở entity, fallback query CONTAIN/IN; history không thuộc lib
          source: explicit-user
          status: approved
          blocking: true
          scope: public-contract
          owner_repository_id: sdcorejs-angular
          rationale: Backend có API search riêng để bảo đảm hiệu năng; history mỗi dự án tự làm.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-004
            - R-013
            - AC-016
          task_refs:
            - TASK-008
            - TASK-009
        - id: D-011
          type: decision
          statement: >-
            Tuỳ biến theo entity ở đâu? → Provider riêng provideSdGenericEntity { module, entity, schema(base), search?, display?, hooks?, listActions?,
            rowCommands?, bulkActions?, detailActions?, hiddenDefaults? }; schema dạng hàm thay vì object partial
          question: Tuỳ biến theo entity ở đâu?
          selected_value: >-
            Provider riêng provideSdGenericEntity { module, entity, schema(base), search?, display?, hooks?, listActions?, rowCommands?, bulkActions?,
            detailActions?, hiddenDefaults? }; schema dạng hàm thay vì object partial
          source: explicit-user
          status: approved
          blocking: true
          scope: public-contract
          owner_repository_id: sdcorejs-angular
          rationale: Adapter trả schema mặc định theo entity; deep-merge mảng không rõ nghĩa.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-006
            - R-014
            - R-015
            - AC-004
            - AC-017
            - AC-018
          task_refs:
            - TASK-005
            - TASK-008
            - TASK-009
        - id: D-012
          type: decision
          statement: >-
            Lưu cấu hình thế nào? → configuration: { get(entity), set(entity, schema) } trên adapter, mỗi entity một cấu hình, null là chưa có; adapter không
            khai thì localStorage
          question: Lưu cấu hình thế nào?
          selected_value: 'configuration: { get(entity), set(entity, schema) } trên adapter, mỗi entity một cấu hình, null là chưa có; adapter không khai thì localStorage'
          source: explicit-user
          status: approved
          blocking: true
          scope: public-contract
          owner_repository_id: sdcorejs-angular
          rationale: Không cần nhận diện configurationId; server hay theo người dùng do consumer quyết.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-006
            - AC-005
          task_refs:
            - TASK-008
            - TASK-009
            - TASK-013
        - id: D-013
          type: decision
          statement: >-
            Cấu hình đã lưu không hợp lệ thì sao? → Tham chiếu treo tự bỏ; lỗi shape/version dùng mặc định + console.warn + banner cho người có quyền
            CONFIGURATION; lưu có lỗi thì chặn
          question: Cấu hình đã lưu không hợp lệ thì sao?
          selected_value: Tham chiếu treo tự bỏ; lỗi shape/version dùng mặc định + console.warn + banner cho người có quyền CONFIGURATION; lưu có lỗi thì chặn
          source: explicit-user
          status: approved
          blocking: true
          scope: public-contract
          owner_repository_id: sdcorejs-angular
          rationale: Bước validate quan trọng; trang không chết vì cấu hình hỏng.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-008
            - AC-007
            - AC-020
          task_refs:
            - TASK-006
            - TASK-007
            - TASK-013
        - id: D-014
          type: decision
          statement: Tiêu đề đặt ở đâu? → Trong từng section list/create/update/detail, template ${key} có validate, render dạng text
          question: Tiêu đề đặt ở đâu?
          selected_value: Trong từng section list/create/update/detail, template ${key} có validate, render dạng text
          source: explicit-user
          status: approved
          blocking: true
          scope: public-contract
          owner_repository_id: sdcorejs-angular
          rationale: Người dùng yêu cầu; tránh XSS như htmlTemplate cũ.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-009
            - AC-009
          task_refs:
            - TASK-006
            - TASK-007
        - id: D-015
          type: decision
          statement: >-
            Mã quyền và cơ chế kiểm tra? → <MODULE>_<ENTITY>_C_GENERIC_{LIST|DETAIL|CREATE|UPDATE|DELETE|IMPORT|CONFIGURATION} qua SdPermissionService, có
            permission: false
          question: Mã quyền và cơ chế kiểm tra?
          selected_value: '<MODULE>_<ENTITY>_C_GENERIC_{LIST|DETAIL|CREATE|UPDATE|DELETE|IMPORT|CONFIGURATION} qua SdPermissionService, có permission: false'
          source: explicit-user
          status: approved
          blocking: true
          scope: public-contract
          owner_repository_id: sdcorejs-angular
          rationale: Định dạng người dùng đưa, thêm CONFIGURATION cho màn chỉnh cấu hình.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-011
            - AC-010
          task_refs:
            - TASK-006
            - TASK-007
            - TASK-010
        - id: D-016
          type: decision
          statement: >-
            Luật import? → Template từ import.columns hoặc property insertable; enum theo value/label; relation theo matchField qua search; upsert theo
            upsertKey; tối đa 5 request song song; chỉ quyền IMPORT
          question: Luật import?
          selected_value: >-
            Template từ import.columns hoặc property insertable; enum theo value/label; relation theo matchField qua search; upsert theo upsertKey; tối đa 5
            request song song; chỉ quyền IMPORT
          source: explicit-user
          status: approved
          blocking: true
          scope: public-contract
          owner_repository_id: sdcorejs-angular
          rationale: Dùng lại create/update của adapter và sd-import-excel có sẵn.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-016
            - AC-019
          task_refs:
            - TASK-006
            - TASK-007
            - TASK-008
            - TASK-009
        - id: D-017
          type: decision
          statement: >-
            Cách viết test? → TDD cho logic (tra adapter/entity, dựng schema, merge, validate, template, fallback search, mã quyền, import upsert); viết test
            sau cho UI và Showcase
          question: Cách viết test?
          selected_value: >-
            TDD cho logic (tra adapter/entity, dựng schema, merge, validate, template, fallback search, mã quyền, import upsert); viết test sau cho UI và
            Showcase
          source: explicit-user
          status: approved
          blocking: true
          scope: repository
          owner_repository_id: sdcorejs-angular
          rationale: Logic thuần có giá trị TDD cao; UI chủ yếu là nối component.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-005
            - R-007
            - R-008
          task_refs:
            - TASK-002
            - TASK-006
            - TASK-008
            - TASK-012
            - TASK-014
        - id: D-018
          type: decision
          statement: Release? → Suffix minor kế tiếp 3.2, chỉ thêm mới, CHANGELOG Unreleased; tag/publish theo release ritual và cần người dùng cho phép riêng
          question: Release?
          selected_value: Suffix minor kế tiếp 3.2, chỉ thêm mới, CHANGELOG Unreleased; tag/publish theo release ritual và cần người dùng cho phép riêng
          source: explicit-user
          status: approved
          blocking: true
          scope: repository
          owner_repository_id: sdcorejs-angular
          rationale: Không phá vỡ API consumer.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-020
            - AC-023
          task_refs:
            - TASK-018
            - TASK-019
        - id: D-019
          type: decision
          statement: >-
            Phân tầng trong modules/generic? → models (type) → core (hàm thuần: merge, validate, dựng mặc định, tiêu đề, mã quyền, dựng form, map cột, kế hoạch
            import, request search) → registry (provider, scope) → services (schema, data, quyền, import) → routes/pages/components; tầng dưới không import tầng
            trên
          question: Phân tầng trong modules/generic?
          selected_value: >-
            models (type) → core (hàm thuần: merge, validate, dựng mặc định, tiêu đề, mã quyền, dựng form, map cột, kế hoạch import, request search) → registry
            (provider, scope) → services (schema, data, quyền, import) → routes/pages/components; tầng dưới không import tầng trên
          source: approved-architecture
          status: approved
          blocking: true
          scope: module
          owner_repository_id: sdcorejs-angular
          rationale: Logic dùng chung nằm ở hàm thuần để TDD và để list/form/import/màn cấu hình không tự quyết khác nhau.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - INV-002
            - INV-003
            - INV-007
            - R-001
          task_refs:
            - TASK-005
            - TASK-007
            - TASK-015
        - id: D-020
          type: decision
          statement: >-
            Cơ chế registry cho provider gọi nhiều lần? → Mỗi injector có một scope node dựng từ multi token cùng tầng (self) và scope cha (skipSelf); tra
            module rồi module+entity từ scope gần nhất lên root; trùng module (hoặc module+entity) trong cùng một injector là lỗi, kiểm ngay khi injector được
            tạo bằng provideEnvironmentInitializer; option permission lấy từ scope gần nhất có khai
          question: Cơ chế registry cho provider gọi nhiều lần?
          selected_value: >-
            Mỗi injector có một scope node dựng từ multi token cùng tầng (self) và scope cha (skipSelf); tra module rồi module+entity từ scope gần nhất lên
            root; trùng module (hoặc module+entity) trong cùng một injector là lỗi, kiểm ngay khi injector được tạo bằng provideEnvironmentInitializer; option
            permission lấy từ scope gần nhất có khai
          source: approved-architecture
          status: approved
          blocking: true
          scope: module
          owner_repository_id: sdcorejs-angular
          rationale: >-
            Multi token ở injector con không gộp với cha; trùng cùng tầng là mơ hồ nên báo lỗi (làm rõ R-005: bao trùm trường hợp trùng trong một lần gọi); kiểm
            sớm để AC-003 ném lỗi lúc khởi tạo, không đợi lần điều hướng đầu.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - INV-001
            - R-005
            - AC-003
          task_refs:
            - TASK-008
            - TASK-009
        - id: D-021
          type: decision
          statement: >-
            Ai giữ schema hiệu lực và cache? → SdGenericSchemaService ở injector môi trường của route generic giữ Promise schema theo module.entity; resolver
            của route nạp schema trước khi list/form/màn cấu hình kích hoạt; lưu cấu hình thì xoá cache entity đó
          question: Ai giữ schema hiệu lực và cache?
          selected_value: >-
            SdGenericSchemaService ở injector môi trường của route generic giữ Promise schema theo module.entity; resolver của route nạp schema trước khi
            list/form/màn cấu hình kích hoạt; lưu cấu hình thì xoá cache entity đó
          source: approved-architecture
          status: approved
          blocking: true
          scope: module
          owner_repository_id: sdcorejs-angular
          rationale: Một nơi duy nhất dựng 3 lớp schema; tránh mỗi trang tự gọi adapter.schema.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - INV-002
            - R-006
            - AC-004
          task_refs:
            - TASK-008
            - TASK-009
        - id: D-022
          type: decision
          statement: >-
            Select relation lấy dữ liệu từ đâu khi form-generic chỉ nhận catalog tĩnh? → sdGenericRoutes() đăng ký provideSdFormGeneric({ catalogs:
            [sd-generic-relation] }) ở injector môi trường của route generic; field relation dùng catalog này với params hằng { module, entity, valueField,
            displayField, searchFields (nối bằng dấu phẩy) } để cache của form-generic phân biệt từng relation; callback của catalog gọi SdGenericDataService
            qua injector môi trường bắt bằng provideEnvironmentInitializer; vì option value của form-generic là chuỗi, SdGenericDataService đổi giá trị relation
            về kiểu gốc (theo dữ liệu đã tải) trước khi lưu
          question: Select relation lấy dữ liệu từ đâu khi form-generic chỉ nhận catalog tĩnh?
          selected_value: >-
            sdGenericRoutes() đăng ký provideSdFormGeneric({ catalogs: [sd-generic-relation] }) ở injector môi trường của route generic; field relation dùng
            catalog này với params hằng { module, entity, valueField, displayField, searchFields (nối bằng dấu phẩy) } để cache của form-generic phân biệt từng
            relation; callback của catalog gọi SdGenericDataService qua injector môi trường bắt bằng provideEnvironmentInitializer; vì option value của
            form-generic là chuỗi, SdGenericDataService đổi giá trị relation về kiểu gốc (theo dữ liệu đã tải) trước khi lưu
          source: approved-architecture
          status: approved
          blocking: true
          scope: module
          owner_repository_id: sdcorejs-angular
          rationale: >-
            Chỉ dùng API public của form-generic (catalog và templates cố định lúc provideSdFormGeneric chạy nên không thể một catalog theo id <module>.<entity>
            như phần Architecture của spec mô tả); một catalog phục vụ mọi relation. Hệ quả: cấu hình form-generic của portal ở root không áp lên form của
            module generic.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - INV-008
            - R-013
            - AC-016
          task_refs:
            - TASK-008
            - TASK-009
        - id: D-023
          type: decision
          statement: >-
            Tab Form của màn cấu hình đưa property vào layout thế nào? → sd-form-builder dùng [(schema)]; panel danh sách property chưa có trong layout, bấm để
            thêm field đã điền sẵn vào schema (builder nạp lại schema nên mất undo và vùng chọn hiện tại); không dùng templates của form-generic
          question: Tab Form của màn cấu hình đưa property vào layout thế nào?
          selected_value: >-
            sd-form-builder dùng [(schema)]; panel danh sách property chưa có trong layout, bấm để thêm field đã điền sẵn vào schema (builder nạp lại schema nên
            mất undo và vùng chọn hiện tại); không dùng templates của form-generic
          source: approved-architecture
          status: approved
          blocking: true
          scope: module
          owner_repository_id: sdcorejs-angular
          rationale: >-
            templates cố định lúc provideSdFormGeneric chạy nên không sinh theo entity được; panel property đáp ứng "palette là properties" của R-017 mà không
            mở rộng public API form-generic ngoài time/json.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - INV-015
            - R-017
            - AC-020
          task_refs:
            - TASK-013
            - TASK-014
        - id: D-024
          type: decision
          statement: >-
            Cây route và cách hiện page/drawer? → generic/:module/:entity là trang list có router-outlet cho create, :id/detail, :id/update; mọi route của
            sdGenericRoutes() khai data.permission = SD_PERMISSION_PUBLIC để SdPermissionGuard của portal không chặn, guard của module generic kiểm mã thật bằng
            hasPermission(code) với key mặc định; host form tự chọn page hoặc drawer sau khi schema đã resolve; drawer gọi open() sau khi render và (sdClosed)
            điều hướng về route list; page thì list ẩn nội dung khi outlet kích hoạt; trang list phản ứng khi :module/:entity đổi vì component được dùng lại;
            configuration là route anh em
          question: Cây route và cách hiện page/drawer?
          selected_value: >-
            generic/:module/:entity là trang list có router-outlet cho create, :id/detail, :id/update; mọi route của sdGenericRoutes() khai data.permission =
            SD_PERMISSION_PUBLIC để SdPermissionGuard của portal không chặn, guard của module generic kiểm mã thật bằng hasPermission(code) với key mặc định;
            host form tự chọn page hoặc drawer sau khi schema đã resolve; drawer gọi open() sau khi render và (sdClosed) điều hướng về route list; page thì list
            ẩn nội dung khi outlet kích hoạt; trang list phản ứng khi :module/:entity đổi vì component được dùng lại; configuration là route anh em
          source: approved-architecture
          status: approved
          blocking: true
          scope: module
          owner_repository_id: sdcorejs-angular
          rationale: List giữ nguyên trạng thái sd-table vì không bị huỷ khi mở drawer; SdPermissionGuard.canActivateChild từ chối route không có data.permission.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - INV-005
            - INV-009
            - R-010
            - AC-011
            - AC-012
          task_refs:
            - TASK-010
            - TASK-011
        - id: D-025
          type: decision
          statement: >-
            Ai gọi adapter? → SdGenericDataService là nơi duy nhất gọi query/detail/create/update/delete/search, áp hooks beforeSave/afterSave, thứ tự search
            entity → adapter → query và giới hạn 5 request song song cho import; SdGenericSchemaService là nơi duy nhất gọi schema và configuration.get/set
          question: Ai gọi adapter?
          selected_value: >-
            SdGenericDataService là nơi duy nhất gọi query/detail/create/update/delete/search, áp hooks beforeSave/afterSave, thứ tự search entity → adapter →
            query và giới hạn 5 request song song cho import; SdGenericSchemaService là nơi duy nhất gọi schema và configuration.get/set
          source: approved-architecture
          status: approved
          blocking: true
          scope: module
          owner_repository_id: sdcorejs-angular
          rationale: Mỗi nhóm hàm của adapter có đúng một cổng để hooks, fallback, validate và cache luôn đúng ở mọi màn.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - INV-002
            - INV-008
            - INV-014
            - R-014
            - AC-017
          task_refs:
            - TASK-008
            - TASK-009
        - id: D-026
          type: decision
          statement: >-
            Nhãn giao diện của module? → Thêm khoá core.module.generic.* vào i18n sẵn có, đủ mọi file ngôn ngữ (en, vi, ja, ko, zh) vì chúng có kiểu
            Record<keyof EN_MESSAGES>; hiển thị qua sdTranslate
          question: Nhãn giao diện của module?
          selected_value: >-
            Thêm khoá core.module.generic.* vào i18n sẵn có, đủ mọi file ngôn ngữ (en, vi, ja, ko, zh) vì chúng có kiểu Record<keyof EN_MESSAGES>; hiển thị qua
            sdTranslate
          source: approved-architecture
          status: approved
          blocking: true
          scope: module
          owner_repository_id: sdcorejs-angular
          rationale: Theo quy ước core.<area>.* (vd core.module.layout.*) của thư viện.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - INV-010
            - R-001
          task_refs:
            - TASK-001
        - id: D-027
          type: decision
          statement: >-
            Hình dạng của validateSdGenericSchema? → validateSdGenericSchema(stored: unknown, base: SdGenericSchema) trả SdGenericSchemaIssue[] { code,
            severity, path, message }, cùng cách với validateSdApiContract
          question: Hình dạng của validateSdGenericSchema?
          selected_value: >-
            validateSdGenericSchema(stored: unknown, base: SdGenericSchema) trả SdGenericSchemaIssue[] { code, severity, path, message }, cùng cách với
            validateSdApiContract
          source: approved-architecture
          status: approved
          blocking: true
          scope: module
          owner_repository_id: sdcorejs-angular
          rationale: Thống nhất với validator public đã có; stored có thể là JSON bất kỳ đọc từ server/localStorage.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - INV-003
            - R-008
            - AC-008
          task_refs:
            - TASK-005
            - TASK-006
            - TASK-007
        - id: D-028
          type: decision
          statement: >-
            Có đưa modules/generic vào barrel modules không? → Có, như auth/layout/permission/keycloak/icon; build v19 kiểm không có vòng phụ thuộc và không
            trùng tên export
          question: Có đưa modules/generic vào barrel modules không?
          selected_value: Có, như auth/layout/permission/keycloak/icon; build v19 kiểm không có vòng phụ thuộc và không trùng tên export
          source: approved-architecture
          status: approved
          blocking: true
          scope: module
          owner_repository_id: sdcorejs-angular
          rationale: Giữ quy ước barrel của thư viện; entry gốc @sdcorejs/angular cũng export module.
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - INV-010
            - R-001
            - AC-024
          task_refs:
            - TASK-015
        - id: D-029
          type: decision
          statement: Nguồn quyền theo key riêng cho từng module generic? → Hoãn; module generic gọi hasPermission(code) với key mặc định của portal
          question: Nguồn quyền theo key riêng cho từng module generic?
          selected_value: Hoãn; module generic gọi hasPermission(code) với key mặc định của portal
          source: approved-architecture
          status: deferred
          blocking: false
          scope: module
          owner_repository_id: sdcorejs-angular
          rationale: 'Spec chỉ có permission: boolean; thêm option key là mở rộng public API ngoài phạm vi đã duyệt.'
          supersedes: null
          revisit_condition: Khi một portal cần nguồn quyền SdPermissionService khác nhau (key khác nhau) cho từng module generic.
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - INV-005
            - R-011
          task_refs:
            - TASK-010
        - id: D-030
          type: decision
          statement: >-
            Ranh giới kiểm chứng nào áp dụng? → none: thư viện chỉ ẩn UI và chặn route ở client; kiểm quyền thật thuộc backend của adapter (ST-001), nên không
            có bằng chứng từ chối phía server trong repo này
          question: Ranh giới kiểm chứng nào áp dụng?
          selected_value: none
          source: approved-plan
          status: approved
          blocking: true
          scope: module
          owner_repository_id: sdcorejs-angular
          rationale: Thư viện UI không sở hữu API; quyền phía server do backend của consumer kiểm (ST-001).
          supersedes: null
          revisit_condition: null
          convention_impact:
            candidate: false
            category: null
          downstream_refs:
            - R-001
            - R-002
            - R-003
            - R-004
            - R-005
            - R-006
            - R-007
            - R-008
            - R-009
            - R-010
            - R-011
            - R-012
            - R-013
            - R-014
            - R-015
            - R-016
            - R-017
            - R-018
            - R-019
            - R-020
            - AC-001
            - AC-002
            - AC-003
            - AC-004
            - AC-005
            - AC-006
            - AC-007
            - AC-008
            - AC-009
            - AC-010
            - AC-011
            - AC-012
            - AC-013
            - AC-014
            - AC-015
            - AC-016
            - AC-017
            - AC-018
            - AC-019
            - AC-020
            - AC-021
            - AC-022
            - AC-023
            - AC-024
            - INV-001
            - INV-002
            - INV-003
            - INV-004
            - INV-005
            - INV-006
            - INV-007
            - INV-008
            - INV-009
            - INV-010
            - INV-011
            - INV-012
            - INV-013
            - INV-014
            - INV-015
          validation_boundary:
            kind: none
            source_refs:
              - R-001
              - R-002
              - R-003
              - R-004
              - R-005
              - R-006
              - R-007
              - R-008
              - R-009
              - R-010
              - R-011
              - R-012
              - R-013
              - R-014
              - R-015
              - R-016
              - R-017
              - R-018
              - R-019
              - R-020
              - AC-001
              - AC-002
              - AC-003
              - AC-004
              - AC-005
              - AC-006
              - AC-007
              - AC-008
              - AC-009
              - AC-010
              - AC-011
              - AC-012
              - AC-013
              - AC-014
              - AC-015
              - AC-016
              - AC-017
              - AC-018
              - AC-019
              - AC-020
              - AC-021
              - AC-022
              - AC-023
              - AC-024
              - INV-001
              - INV-002
              - INV-003
              - INV-004
              - INV-005
              - INV-006
              - INV-007
              - INV-008
              - INV-009
              - INV-010
              - INV-011
              - INV-012
              - INV-013
              - INV-014
              - INV-015
          task_refs:
            - TASK-015
            - TASK-019
        - id: INV-001
          type: invariant
          statement: >-
            Mọi màn (list, form, import, màn cấu hình, catalog relation) chỉ lấy adapter và cấu hình entity qua một resolver: scope gần nhất thắng, trùng cùng
            injector thì ném lỗi.
          protected_refs:
            - R-005
            - AC-002
            - AC-003
          task_refs:
            - TASK-008
            - TASK-009
          evidence_refs:
            - EVIDENCE-008
            - EVIDENCE-009
        - id: INV-002
          type: invariant
          statement: >-
            Schema hiệu lực chỉ được dựng ở SdGenericSchemaService bằng hàm thuần: adapter.schema → entity.schema(base) → cấu hình đã lưu (validate rồi merge);
            chỉ SdGenericSchemaService gọi adapter.schema và configuration.get/set (hoặc localStorage khoá sd-generic:configuration:<module>.<entity>).
          protected_refs:
            - R-006
            - R-007
            - AC-001
            - AC-004
            - AC-005
            - AC-006
          task_refs:
            - TASK-006
            - TASK-007
            - TASK-008
            - TASK-009
          evidence_refs:
            - EVIDENCE-006
            - EVIDENCE-007
            - EVIDENCE-008
            - EVIDENCE-009
        - id: INV-003
          type: invariant
          statement: >-
            validateSdGenericSchema là hàm thuần duy nhất kiểm cấu hình; bước load và nút Lưu đều dùng nó; lỗi shape/version thì dùng mặc định, tham chiếu treo
            bị merge bỏ, có lỗi thì không gọi configuration.set.
          protected_refs:
            - R-008
            - AC-007
            - AC-008
            - AC-020
          task_refs:
            - TASK-006
            - TASK-007
            - TASK-008
            - TASK-009
            - TASK-013
            - TASK-014
          evidence_refs:
            - EVIDENCE-006
            - EVIDENCE-007
            - EVIDENCE-008
            - EVIDENCE-009
            - EVIDENCE-013
            - EVIDENCE-014
        - id: INV-004
          type: invariant
          statement: >-
            SdGenericSchema v1 chỉ chứa dữ liệu JSON (không function); function (schema, search, display, hooks, action) chỉ nằm ở provider; key, dataType,
            enums[].value, relation.entity luôn lấy từ schema hiện tại.
          protected_refs:
            - R-002
            - R-003
            - AC-006
            - AC-024
          task_refs:
            - TASK-005
            - TASK-015
          evidence_refs:
            - EVIDENCE-005
            - EVIDENCE-015
        - id: INV-005
          type: invariant
          statement: >-
            Mã quyền chỉ sinh từ một hàm thuần <MODULE>_<ENTITY>_C_GENERIC_<ACTION> viết hoa; guard route, hiển thị action và banner cấu hình lỗi đều dùng hàm
            đó; permission: false bỏ qua cả ba; mọi route của sdGenericRoutes() có data.permission = SD_PERMISSION_PUBLIC để guard của portal không chặn, còn
            guard của module generic kiểm mã thật.
          protected_refs:
            - R-011
            - AC-007
            - AC-010
            - AC-018
          task_refs:
            - TASK-006
            - TASK-007
            - TASK-008
            - TASK-009
            - TASK-010
            - TASK-011
            - TASK-012
          evidence_refs:
            - EVIDENCE-006
            - EVIDENCE-007
            - EVIDENCE-008
            - EVIDENCE-009
            - EVIDENCE-010
            - EVIDENCE-011
            - EVIDENCE-012
        - id: INV-006
          type: invariant
          statement: >-
            Tiêu đề chỉ được parse/render bằng một hàm thuần; kết quả gắn vào DOM bằng nội suy text, không innerHTML; list.title và create.title không có
            placeholder.
          protected_refs:
            - R-009
            - AC-009
          task_refs:
            - TASK-006
            - TASK-007
            - TASK-011
            - TASK-012
          evidence_refs:
            - EVIDENCE-006
            - EVIDENCE-007
            - EVIDENCE-011
            - EVIDENCE-012
        - id: INV-007
          type: invariant
          statement: >-
            Layout form của mỗi action do một hàm thuần dựng: field lấy type/label/options/validation từ general.properties; create bỏ system và không
            insertable; update bỏ system và không updatable; payload update chỉ gồm property updatable.
          protected_refs:
            - R-013
            - AC-015
          task_refs:
            - TASK-006
            - TASK-007
            - TASK-011
            - TASK-012
          evidence_refs:
            - EVIDENCE-006
            - EVIDENCE-007
            - EVIDENCE-011
            - EVIDENCE-012
        - id: INV-008
          type: invariant
          statement: >-
            Chỉ SdGenericDataService gọi các hàm dữ liệu của adapter (query, detail, create, update, delete, search); mọi lần lưu đi qua beforeSave/afterSave;
            search theo thứ tự entity → adapter → query (CONTAIN để tìm, IN để lấy nhãn); giá trị relation được lưu đúng kiểu gốc; trang và component không gọi
            adapter trực tiếp.
          protected_refs:
            - R-004
            - R-013
            - R-014
            - AC-001
            - AC-016
            - AC-017
          task_refs:
            - TASK-008
            - TASK-009
          evidence_refs:
            - EVIDENCE-008
            - EVIDENCE-009
        - id: INV-009
          type: invariant
          statement: >-
            Kiểu hiển thị chỉ quyết định sau khi schema đã resolve, theo entity.display → adapter.display → 'page'; drawer render trong outlet của list, list
            không bị huỷ, back/đóng đưa về route list.
          protected_refs:
            - R-010
            - AC-011
            - AC-012
          task_refs:
            - TASK-010
            - TASK-011
          evidence_refs:
            - EVIDENCE-010
            - EVIDENCE-011
        - id: INV-010
          type: invariant
          statement: >-
            Entry point modules/generic export đúng 4 symbol runtime; không dùng HttpClient và không import package riêng của backend; chỉ import phần khác của
            thư viện qua entry point public.
          protected_refs:
            - R-001
            - AC-024
          task_refs:
            - TASK-001
            - TASK-015
            - TASK-016
          evidence_refs:
            - EVIDENCE-001
            - EVIDENCE-015
            - EVIDENCE-016
            - EVIDENCE-017
            - EVIDENCE-018
        - id: INV-011
          type: invariant
          statement: form-generic chỉ thêm member time và json vào union field; type và hành vi hiện có không đổi; form-generic không import modules/generic.
          protected_refs:
            - R-018
            - AC-021
          task_refs:
            - TASK-001
            - TASK-002
            - TASK-003
            - TASK-004
          evidence_refs:
            - EVIDENCE-001
            - EVIDENCE-002
            - EVIDENCE-003
            - EVIDENCE-004
        - id: INV-012
          type: invariant
          statement: >-
            Chỉ sửa ở versions/v19 và showcase; v20/v21/v22 chỉ đổi qua npm run sync; check:sync xanh; CHANGELOG có mục Unreleased; guard example/registry của
            Showcase xanh.
          protected_refs:
            - R-019
            - R-020
            - AC-022
            - AC-023
          task_refs:
            - TASK-004
            - TASK-015
            - TASK-016
            - TASK-017
            - TASK-018
            - TASK-019
          evidence_refs:
            - EVIDENCE-004
            - EVIDENCE-017
            - EVIDENCE-018
            - EVIDENCE-019
            - EVIDENCE-020
            - EVIDENCE-021
            - EVIDENCE-022
            - EVIDENCE-023
        - id: INV-013
          type: invariant
          statement: >-
            List dùng sd-table server và chuyển PagingReq sang adapter.query; xoá có xác nhận, xoá nhiều gọi delete tuần tự, sau thay đổi thì reload; action mở
            rộng và action có sẵn đi chung một bước lọc quyền/visible/hiddenDefaults.
          protected_refs:
            - R-012
            - R-015
            - AC-013
            - AC-014
            - AC-018
          task_refs:
            - TASK-006
            - TASK-007
            - TASK-011
            - TASK-012
          evidence_refs:
            - EVIDENCE-006
            - EVIDENCE-007
            - EVIDENCE-011
            - EVIDENCE-012
        - id: INV-014
          type: invariant
          statement: >-
            Import lập kế hoạch create/update bằng hàm thuần theo upsertKey, tra bản ghi đã có theo lô, chạy qua SdGenericDataService với tối đa 5 request song
            song.
          protected_refs:
            - R-016
            - AC-019
          task_refs:
            - TASK-006
            - TASK-007
            - TASK-008
            - TASK-009
            - TASK-011
            - TASK-012
          evidence_refs:
            - EVIDENCE-006
            - EVIDENCE-007
            - EVIDENCE-008
            - EVIDENCE-009
            - EVIDENCE-011
            - EVIDENCE-012
        - id: INV-015
          type: invariant
          statement: Màn cấu hình chỉ ghi qua SdGenericSchemaService.save (validate rồi configuration.set rồi xoá cache); key và dataType không sửa được.
          protected_refs:
            - R-017
            - AC-005
            - AC-020
          task_refs:
            - TASK-013
            - TASK-014
          evidence_refs:
            - EVIDENCE-013
            - EVIDENCE-014
      history:
        - revision: 1
          active:
            - id: R-001
              type: requirement
            - id: R-002
              type: requirement
            - id: R-003
              type: requirement
            - id: R-004
              type: requirement
            - id: R-005
              type: requirement
            - id: R-006
              type: requirement
            - id: R-007
              type: requirement
            - id: R-008
              type: requirement
            - id: R-009
              type: requirement
            - id: R-010
              type: requirement
            - id: R-011
              type: requirement
            - id: R-012
              type: requirement
            - id: R-013
              type: requirement
            - id: R-014
              type: requirement
            - id: R-015
              type: requirement
            - id: R-016
              type: requirement
            - id: R-017
              type: requirement
            - id: R-018
              type: requirement
            - id: R-019
              type: requirement
            - id: R-020
              type: requirement
            - id: AC-001
              type: acceptance-criterion
            - id: AC-002
              type: acceptance-criterion
            - id: AC-003
              type: acceptance-criterion
            - id: AC-004
              type: acceptance-criterion
            - id: AC-005
              type: acceptance-criterion
            - id: AC-006
              type: acceptance-criterion
            - id: AC-007
              type: acceptance-criterion
            - id: AC-008
              type: acceptance-criterion
            - id: AC-009
              type: acceptance-criterion
            - id: AC-010
              type: acceptance-criterion
            - id: AC-011
              type: acceptance-criterion
            - id: AC-012
              type: acceptance-criterion
            - id: AC-013
              type: acceptance-criterion
            - id: AC-014
              type: acceptance-criterion
            - id: AC-015
              type: acceptance-criterion
            - id: AC-016
              type: acceptance-criterion
            - id: AC-017
              type: acceptance-criterion
            - id: AC-018
              type: acceptance-criterion
            - id: AC-019
              type: acceptance-criterion
            - id: AC-020
              type: acceptance-criterion
            - id: AC-021
              type: acceptance-criterion
            - id: AC-022
              type: acceptance-criterion
            - id: AC-023
              type: acceptance-criterion
            - id: AC-024
              type: acceptance-criterion
            - id: A-001
              type: assumption
            - id: A-002
              type: assumption
            - id: A-003
              type: assumption
            - id: A-004
              type: assumption
            - id: A-005
              type: assumption
            - id: D-001
              type: decision
            - id: D-002
              type: decision
            - id: D-003
              type: decision
            - id: D-004
              type: decision
            - id: D-005
              type: decision
            - id: D-006
              type: decision
            - id: D-007
              type: decision
            - id: D-008
              type: decision
            - id: D-009
              type: decision
            - id: D-010
              type: decision
            - id: D-011
              type: decision
            - id: D-012
              type: decision
            - id: D-013
              type: decision
            - id: D-014
              type: decision
            - id: D-015
              type: decision
            - id: D-016
              type: decision
            - id: D-017
              type: decision
            - id: D-018
              type: decision
          tombstones: []
        - revision: 2
          active:
            - id: R-001
              type: requirement
            - id: R-002
              type: requirement
            - id: R-003
              type: requirement
            - id: R-004
              type: requirement
            - id: R-005
              type: requirement
            - id: R-006
              type: requirement
            - id: R-007
              type: requirement
            - id: R-008
              type: requirement
            - id: R-009
              type: requirement
            - id: R-010
              type: requirement
            - id: R-011
              type: requirement
            - id: R-012
              type: requirement
            - id: R-013
              type: requirement
            - id: R-014
              type: requirement
            - id: R-015
              type: requirement
            - id: R-016
              type: requirement
            - id: R-017
              type: requirement
            - id: R-018
              type: requirement
            - id: R-019
              type: requirement
            - id: R-020
              type: requirement
            - id: AC-001
              type: acceptance-criterion
            - id: AC-002
              type: acceptance-criterion
            - id: AC-003
              type: acceptance-criterion
            - id: AC-004
              type: acceptance-criterion
            - id: AC-005
              type: acceptance-criterion
            - id: AC-006
              type: acceptance-criterion
            - id: AC-007
              type: acceptance-criterion
            - id: AC-008
              type: acceptance-criterion
            - id: AC-009
              type: acceptance-criterion
            - id: AC-010
              type: acceptance-criterion
            - id: AC-011
              type: acceptance-criterion
            - id: AC-012
              type: acceptance-criterion
            - id: AC-013
              type: acceptance-criterion
            - id: AC-014
              type: acceptance-criterion
            - id: AC-015
              type: acceptance-criterion
            - id: AC-016
              type: acceptance-criterion
            - id: AC-017
              type: acceptance-criterion
            - id: AC-018
              type: acceptance-criterion
            - id: AC-019
              type: acceptance-criterion
            - id: AC-020
              type: acceptance-criterion
            - id: AC-021
              type: acceptance-criterion
            - id: AC-022
              type: acceptance-criterion
            - id: AC-023
              type: acceptance-criterion
            - id: AC-024
              type: acceptance-criterion
            - id: A-001
              type: assumption
            - id: A-002
              type: assumption
            - id: A-003
              type: assumption
            - id: A-004
              type: assumption
            - id: A-005
              type: assumption
            - id: D-001
              type: decision
            - id: D-002
              type: decision
            - id: D-003
              type: decision
            - id: D-004
              type: decision
            - id: D-005
              type: decision
            - id: D-006
              type: decision
            - id: D-007
              type: decision
            - id: D-008
              type: decision
            - id: D-009
              type: decision
            - id: D-010
              type: decision
            - id: D-011
              type: decision
            - id: D-012
              type: decision
            - id: D-013
              type: decision
            - id: D-014
              type: decision
            - id: D-015
              type: decision
            - id: D-016
              type: decision
            - id: D-017
              type: decision
            - id: D-018
              type: decision
            - id: D-019
              type: decision
            - id: D-020
              type: decision
            - id: D-021
              type: decision
            - id: D-022
              type: decision
            - id: D-023
              type: decision
            - id: D-024
              type: decision
            - id: D-025
              type: decision
            - id: D-026
              type: decision
            - id: D-027
              type: decision
            - id: D-028
              type: decision
            - id: D-029
              type: decision
            - id: INV-001
              type: invariant
            - id: INV-002
              type: invariant
            - id: INV-003
              type: invariant
            - id: INV-004
              type: invariant
            - id: INV-005
              type: invariant
            - id: INV-006
              type: invariant
            - id: INV-007
              type: invariant
            - id: INV-008
              type: invariant
            - id: INV-009
              type: invariant
            - id: INV-010
              type: invariant
            - id: INV-011
              type: invariant
            - id: INV-012
              type: invariant
            - id: INV-013
              type: invariant
            - id: INV-014
              type: invariant
            - id: INV-015
              type: invariant
          tombstones: []
        - revision: 3
          active:
            - id: R-001
              type: requirement
            - id: R-002
              type: requirement
            - id: R-003
              type: requirement
            - id: R-004
              type: requirement
            - id: R-005
              type: requirement
            - id: R-006
              type: requirement
            - id: R-007
              type: requirement
            - id: R-008
              type: requirement
            - id: R-009
              type: requirement
            - id: R-010
              type: requirement
            - id: R-011
              type: requirement
            - id: R-012
              type: requirement
            - id: R-013
              type: requirement
            - id: R-014
              type: requirement
            - id: R-015
              type: requirement
            - id: R-016
              type: requirement
            - id: R-017
              type: requirement
            - id: R-018
              type: requirement
            - id: R-019
              type: requirement
            - id: R-020
              type: requirement
            - id: AC-001
              type: acceptance-criterion
            - id: AC-002
              type: acceptance-criterion
            - id: AC-003
              type: acceptance-criterion
            - id: AC-004
              type: acceptance-criterion
            - id: AC-005
              type: acceptance-criterion
            - id: AC-006
              type: acceptance-criterion
            - id: AC-007
              type: acceptance-criterion
            - id: AC-008
              type: acceptance-criterion
            - id: AC-009
              type: acceptance-criterion
            - id: AC-010
              type: acceptance-criterion
            - id: AC-011
              type: acceptance-criterion
            - id: AC-012
              type: acceptance-criterion
            - id: AC-013
              type: acceptance-criterion
            - id: AC-014
              type: acceptance-criterion
            - id: AC-015
              type: acceptance-criterion
            - id: AC-016
              type: acceptance-criterion
            - id: AC-017
              type: acceptance-criterion
            - id: AC-018
              type: acceptance-criterion
            - id: AC-019
              type: acceptance-criterion
            - id: AC-020
              type: acceptance-criterion
            - id: AC-021
              type: acceptance-criterion
            - id: AC-022
              type: acceptance-criterion
            - id: AC-023
              type: acceptance-criterion
            - id: AC-024
              type: acceptance-criterion
            - id: A-001
              type: assumption
            - id: A-002
              type: assumption
            - id: A-003
              type: assumption
            - id: A-004
              type: assumption
            - id: A-005
              type: assumption
            - id: D-001
              type: decision
            - id: D-002
              type: decision
            - id: D-003
              type: decision
            - id: D-004
              type: decision
            - id: D-005
              type: decision
            - id: D-006
              type: decision
            - id: D-007
              type: decision
            - id: D-008
              type: decision
            - id: D-009
              type: decision
            - id: D-010
              type: decision
            - id: D-011
              type: decision
            - id: D-012
              type: decision
            - id: D-013
              type: decision
            - id: D-014
              type: decision
            - id: D-015
              type: decision
            - id: D-016
              type: decision
            - id: D-017
              type: decision
            - id: D-018
              type: decision
            - id: D-019
              type: decision
            - id: D-020
              type: decision
            - id: D-021
              type: decision
            - id: D-022
              type: decision
            - id: D-023
              type: decision
            - id: D-024
              type: decision
            - id: D-025
              type: decision
            - id: D-026
              type: decision
            - id: D-027
              type: decision
            - id: D-028
              type: decision
            - id: D-029
              type: decision
            - id: D-030
              type: decision
            - id: INV-001
              type: invariant
            - id: INV-002
              type: invariant
            - id: INV-003
              type: invariant
            - id: INV-004
              type: invariant
            - id: INV-005
              type: invariant
            - id: INV-006
              type: invariant
            - id: INV-007
              type: invariant
            - id: INV-008
              type: invariant
            - id: INV-009
              type: invariant
            - id: INV-010
              type: invariant
            - id: INV-011
              type: invariant
            - id: INV-012
              type: invariant
            - id: INV-013
              type: invariant
            - id: INV-014
              type: invariant
            - id: INV-015
              type: invariant
          tombstones: []
      approved_artifact:
        metadata:
          allowed_paths:
            - '**'
          approval_source: user-approved-decision-coverage
          approved_at: '2026-08-09T00:00:00.000Z'
          approved_by: user
          artifact_id: decision-coverage-r3
          artifact_kind: plan
          change_ref: generic-crud-module-v1
          contract_id: decision-coverage:v1
          owner_module_id: null
          owner_repository_id: sdcorejs-angular
          owner_repository_role: standalone
          parent_references: []
          parent_repository_id: null
          prohibited_paths: []
          repository_relative_path: .sdcorejs/plans/angular/2026-10-13-15-57-generic-crud-module.md
          requirement_id: decision-coverage
          schema_version: 1
          source_revision: 48de6f13e24a9e4bed9be3dd44f9ffaf16c0dd4a
          stack_profile: markdown-skill-pack
          supersedes: null
          track: workflow
          approval_hash: sha256:v1:15e06bbe03f981cd165514ad0d3e647d1a0bd2b451e02edc8f65f0fcea3c7255
        body: >
          {"history":[{"active":[{"id":"R-001","type":"requirement"},{"id":"R-002","type":"requirement"},{"id":"R-003","type":"requirement"},{"id":"R-004","type":"requirement"},{"id":"R-005","type":"requirement"},{"id":"R-006","type":"requirement"},{"id":"R-007","type":"requirement"},{"id":"R-008","type":"requirement"},{"id":"R-009","type":"requirement"},{"id":"R-010","type":"requirement"},{"id":"R-011","type":"requirement"},{"id":"R-012","type":"requirement"},{"id":"R-013","type":"requirement"},{"id":"R-014","type":"requirement"},{"id":"R-015","type":"requirement"},{"id":"R-016","type":"requirement"},{"id":"R-017","type":"requirement"},{"id":"R-018","type":"requirement"},{"id":"R-019","type":"requirement"},{"id":"R-020","type":"requirement"},{"id":"AC-001","type":"acceptance-criterion"},{"id":"AC-002","type":"acceptance-criterion"},{"id":"AC-003","type":"acceptance-criterion"},{"id":"AC-004","type":"acceptance-criterion"},{"id":"AC-005","type":"acceptance-criterion"},{"id":"AC-006","type":"acceptance-criterion"},{"id":"AC-007","type":"acceptance-criterion"},{"id":"AC-008","type":"acceptance-criterion"},{"id":"AC-009","type":"acceptance-criterion"},{"id":"AC-010","type":"acceptance-criterion"},{"id":"AC-011","type":"acceptance-criterion"},{"id":"AC-012","type":"acceptance-criterion"},{"id":"AC-013","type":"acceptance-criterion"},{"id":"AC-014","type":"acceptance-criterion"},{"id":"AC-015","type":"acceptance-criterion"},{"id":"AC-016","type":"acceptance-criterion"},{"id":"AC-017","type":"acceptance-criterion"},{"id":"AC-018","type":"acceptance-criterion"},{"id":"AC-019","type":"acceptance-criterion"},{"id":"AC-020","type":"acceptance-criterion"},{"id":"AC-021","type":"acceptance-criterion"},{"id":"AC-022","type":"acceptance-criterion"},{"id":"AC-023","type":"acceptance-criterion"},{"id":"AC-024","type":"acceptance-criterion"},{"id":"A-001","type":"assumption"},{"id":"A-002","type":"assumption"},{"id":"A-003","type":"assumption"},{"id":"A-004","type":"assumption"},{"id":"A-005","type":"assumption"},{"id":"D-001","type":"decision"},{"id":"D-002","type":"decision"},{"id":"D-003","type":"decision"},{"id":"D-004","type":"decision"},{"id":"D-005","type":"decision"},{"id":"D-006","type":"decision"},{"id":"D-007","type":"decision"},{"id":"D-008","type":"decision"},{"id":"D-009","type":"decision"},{"id":"D-010","type":"decision"},{"id":"D-011","type":"decision"},{"id":"D-012","type":"decision"},{"id":"D-013","type":"decision"},{"id":"D-014","type":"decision"},{"id":"D-015","type":"decision"},{"id":"D-016","type":"decision"},{"id":"D-017","type":"decision"},{"id":"D-018","type":"decision"}],"revision":1,"tombstones":[]},{"active":[{"id":"R-001","type":"requirement"},{"id":"R-002","type":"requirement"},{"id":"R-003","type":"requirement"},{"id":"R-004","type":"requirement"},{"id":"R-005","type":"requirement"},{"id":"R-006","type":"requirement"},{"id":"R-007","type":"requirement"},{"id":"R-008","type":"requirement"},{"id":"R-009","type":"requirement"},{"id":"R-010","type":"requirement"},{"id":"R-011","type":"requirement"},{"id":"R-012","type":"requirement"},{"id":"R-013","type":"requirement"},{"id":"R-014","type":"requirement"},{"id":"R-015","type":"requirement"},{"id":"R-016","type":"requirement"},{"id":"R-017","type":"requirement"},{"id":"R-018","type":"requirement"},{"id":"R-019","type":"requirement"},{"id":"R-020","type":"requirement"},{"id":"AC-001","type":"acceptance-criterion"},{"id":"AC-002","type":"acceptance-criterion"},{"id":"AC-003","type":"acceptance-criterion"},{"id":"AC-004","type":"acceptance-criterion"},{"id":"AC-005","type":"acceptance-criterion"},{"id":"AC-006","type":"acceptance-criterion"},{"id":"AC-007","type":"acceptance-criterion"},{"id":"AC-008","type":"acceptance-criterion"},{"id":"AC-009","type":"acceptance-criterion"},{"id":"AC-010","type":"acceptance-criterion"},{"id":"AC-011","type":"acceptance-criterion"},{"id":"AC-012","type":"acceptance-criterion"},{"id":"AC-013","type":"acceptance-criterion"},{"id":"AC-014","type":"acceptance-criterion"},{"id":"AC-015","type":"acceptance-criterion"},{"id":"AC-016","type":"acceptance-criterion"},{"id":"AC-017","type":"acceptance-criterion"},{"id":"AC-018","type":"acceptance-criterion"},{"id":"AC-019","type":"acceptance-criterion"},{"id":"AC-020","type":"acceptance-criterion"},{"id":"AC-021","type":"acceptance-criterion"},{"id":"AC-022","type":"acceptance-criterion"},{"id":"AC-023","type":"acceptance-criterion"},{"id":"AC-024","type":"acceptance-criterion"},{"id":"A-001","type":"assumption"},{"id":"A-002","type":"assumption"},{"id":"A-003","type":"assumption"},{"id":"A-004","type":"assumption"},{"id":"A-005","type":"assumption"},{"id":"D-001","type":"decision"},{"id":"D-002","type":"decision"},{"id":"D-003","type":"decision"},{"id":"D-004","type":"decision"},{"id":"D-005","type":"decision"},{"id":"D-006","type":"decision"},{"id":"D-007","type":"decision"},{"id":"D-008","type":"decision"},{"id":"D-009","type":"decision"},{"id":"D-010","type":"decision"},{"id":"D-011","type":"decision"},{"id":"D-012","type":"decision"},{"id":"D-013","type":"decision"},{"id":"D-014","type":"decision"},{"id":"D-015","type":"decision"},{"id":"D-016","type":"decision"},{"id":"D-017","type":"decision"},{"id":"D-018","type":"decision"},{"id":"D-019","type":"decision"},{"id":"D-020","type":"decision"},{"id":"D-021","type":"decision"},{"id":"D-022","type":"decision"},{"id":"D-023","type":"decision"},{"id":"D-024","type":"decision"},{"id":"D-025","type":"decision"},{"id":"D-026","type":"decision"},{"id":"D-027","type":"decision"},{"id":"D-028","type":"decision"},{"id":"D-029","type":"decision"},{"id":"INV-001","type":"invariant"},{"id":"INV-002","type":"invariant"},{"id":"INV-003","type":"invariant"},{"id":"INV-004","type":"invariant"},{"id":"INV-005","type":"invariant"},{"id":"INV-006","type":"invariant"},{"id":"INV-007","type":"invariant"},{"id":"INV-008","type":"invariant"},{"id":"INV-009","type":"invariant"},{"id":"INV-010","type":"invariant"},{"id":"INV-011","type":"invariant"},{"id":"INV-012","type":"invariant"},{"id":"INV-013","type":"invariant"},{"id":"INV-014","type":"invariant"},{"id":"INV-015","type":"invariant"}],"revision":2,"tombstones":[]},{"active":[{"id":"R-001","type":"requirement"},{"id":"R-002","type":"requirement"},{"id":"R-003","type":"requirement"},{"id":"R-004","type":"requirement"},{"id":"R-005","type":"requirement"},{"id":"R-006","type":"requirement"},{"id":"R-007","type":"requirement"},{"id":"R-008","type":"requirement"},{"id":"R-009","type":"requirement"},{"id":"R-010","type":"requirement"},{"id":"R-011","type":"requirement"},{"id":"R-012","type":"requirement"},{"id":"R-013","type":"requirement"},{"id":"R-014","type":"requirement"},{"id":"R-015","type":"requirement"},{"id":"R-016","type":"requirement"},{"id":"R-017","type":"requirement"},{"id":"R-018","type":"requirement"},{"id":"R-019","type":"requirement"},{"id":"R-020","type":"requirement"},{"id":"AC-001","type":"acceptance-criterion"},{"id":"AC-002","type":"acceptance-criterion"},{"id":"AC-003","type":"acceptance-criterion"},{"id":"AC-004","type":"acceptance-criterion"},{"id":"AC-005","type":"acceptance-criterion"},{"id":"AC-006","type":"acceptance-criterion"},{"id":"AC-007","type":"acceptance-criterion"},{"id":"AC-008","type":"acceptance-criterion"},{"id":"AC-009","type":"acceptance-criterion"},{"id":"AC-010","type":"acceptance-criterion"},{"id":"AC-011","type":"acceptance-criterion"},{"id":"AC-012","type":"acceptance-criterion"},{"id":"AC-013","type":"acceptance-criterion"},{"id":"AC-014","type":"acceptance-criterion"},{"id":"AC-015","type":"acceptance-criterion"},{"id":"AC-016","type":"acceptance-criterion"},{"id":"AC-017","type":"acceptance-criterion"},{"id":"AC-018","type":"acceptance-criterion"},{"id":"AC-019","type":"acceptance-criterion"},{"id":"AC-020","type":"acceptance-criterion"},{"id":"AC-021","type":"acceptance-criterion"},{"id":"AC-022","type":"acceptance-criterion"},{"id":"AC-023","type":"acceptance-criterion"},{"id":"AC-024","type":"acceptance-criterion"},{"id":"A-001","type":"assumption"},{"id":"A-002","type":"assumption"},{"id":"A-003","type":"assumption"},{"id":"A-004","type":"assumption"},{"id":"A-005","type":"assumption"},{"id":"D-001","type":"decision"},{"id":"D-002","type":"decision"},{"id":"D-003","type":"decision"},{"id":"D-004","type":"decision"},{"id":"D-005","type":"decision"},{"id":"D-006","type":"decision"},{"id":"D-007","type":"decision"},{"id":"D-008","type":"decision"},{"id":"D-009","type":"decision"},{"id":"D-010","type":"decision"},{"id":"D-011","type":"decision"},{"id":"D-012","type":"decision"},{"id":"D-013","type":"decision"},{"id":"D-014","type":"decision"},{"id":"D-015","type":"decision"},{"id":"D-016","type":"decision"},{"id":"D-017","type":"decision"},{"id":"D-018","type":"decision"},{"id":"D-019","type":"decision"},{"id":"D-020","type":"decision"},{"id":"D-021","type":"decision"},{"id":"D-022","type":"decision"},{"id":"D-023","type":"decision"},{"id":"D-024","type":"decision"},{"id":"D-025","type":"decision"},{"id":"D-026","type":"decision"},{"id":"D-027","type":"decision"},{"id":"D-028","type":"decision"},{"id":"D-029","type":"decision"},{"id":"D-030","type":"decision"},{"id":"INV-001","type":"invariant"},{"id":"INV-002","type":"invariant"},{"id":"INV-003","type":"invariant"},{"id":"INV-004","type":"invariant"},{"id":"INV-005","type":"invariant"},{"id":"INV-006","type":"invariant"},{"id":"INV-007","type":"invariant"},{"id":"INV-008","type":"invariant"},{"id":"INV-009","type":"invariant"},{"id":"INV-010","type":"invariant"},{"id":"INV-011","type":"invariant"},{"id":"INV-012","type":"invariant"},{"id":"INV-013","type":"invariant"},{"id":"INV-014","type":"invariant"},{"id":"INV-015","type":"invariant"}],"revision":3,"tombstones":[]}],"records":[{"id":"R-001","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Thêm
          entry point @sdcorejs/angular/modules/generic, không phụ thuộc backend: public API runtime gồm provideSdGeneric, provideSdGenericEntity,
          sdGenericRoutes, validateSdGenericSchema; các model SdGenericSchema, SdGenericProperty, SdGenericAdapter… chỉ export dạng type. Không chứa adapter hay
          giá trị riêng của backend
          nào.","status":"active","task_refs":["TASK-001","TASK-015","TASK-016"],"type":"requirement"},{"id":"R-002","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Model
          SdGenericSchema { version: 1, module, entity, general { label, primaryKey?, properties }, list?, detail?, create?, update?, import? };
          detail/create/update có dạng { title?, form?: SdFormGenericSchema }; list có title?, columns?, externalFilters?, orders?, pageSize?, export?; import
          có columns?: { key, matchField? }[],
          upsertKey?.","status":"active","task_refs":["TASK-005","TASK-015"],"type":"requirement"},{"id":"R-003","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Model
          SdGenericProperty { key, label, dataType: string|text|number|boolean|date|datetime|time|enum|relation|json|file, multiple?, format?
          (email|phone|url|password cho string; integer|decimal|currency|percent cho number), enums?: { value, label, color?, icon? }[], relation?: { module?,
          entity, valueField? = 'id', displayField?, display?, searchFields? }, validation?, defaultValue?, insertable? = true, updatable? = true, system? };
          không có relation.type, multiple quyết định chọn một hay
          nhiều.","status":"active","task_refs":["TASK-005","TASK-015"],"type":"requirement"},{"id":"R-004","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Contract
          SdGenericAdapter { module, schema(entity), query(entity, PagingReq) → PagingRes, detail(entity, id), create(entity, data), update(entity, id, data),
          delete(entity, id), search?(entity, req), configuration?: { get(entity), set(entity, schema) }, display?(args) }; request/response dùng
          PagingReq/PagingRes/Filter/Order của
          @sdcorejs/utils.","status":"active","task_refs":["TASK-005","TASK-008","TASK-009"],"type":"requirement"},{"id":"R-005","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"provideSdGeneric({
          adapters, permission? }) và provideSdGenericEntity({ module, entity, … }) gọi được nhiều lần ở root và trong lazy route; tra cứu theo module (và
          module+entity) đi từ injector gần nhất lên root, bản gần nhất thắng; trùng module/entity trong cùng một lần gọi là lỗi khi khởi tạo; adapters nhận
          class (DI tạo) hoặc
          instance.","status":"active","task_refs":["TASK-008","TASK-009"],"type":"requirement"},{"id":"R-006","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Schema
          hiệu lực dựng qua 3 lớp: adapter.schema(entity) → provideSdGenericEntity.schema(base) (nếu có) = cấu hình mặc định → configuration.get(entity) khác
          null thì validate rồi merge lên trên; null thì dùng cấu hình mặc định. Adapter không khai configuration thì lib lưu ở localStorage. Mỗi entity một cấu
          hình; lưu theo server hay theo người dùng do adapter quyết
          định.","status":"active","task_refs":["TASK-006","TASK-007","TASK-008","TASK-009"],"type":"requirement"},{"id":"R-007","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Merge
          cấu hình đã lưu với schema hiện tại: key, dataType, enums[].value, relation.entity lấy từ schema hiện tại; label, nhãn enum, display, validation,
          defaultValue… lấy từ bản đã lưu; property không còn ở schema hiện tại bị bỏ khỏi general, list, layout form và import; property mới được thêm vào
          general và vào list.columns với visible: false, không tự chèn vào layout form đã
          lưu.","status":"active","task_refs":["TASK-006","TASK-007"],"type":"requirement"},{"id":"R-008","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"validateSdGenericSchema(stored,
          base) trả danh sách issue { path, code, severity } kiểm tra: shape và version, key property không trùng, module/entity khớp, tham chiếu của
          list.columns/externalFilters/orders/import.columns/upsertKey/field trong layout tới property có thật, type field layout khớp dataType, ngữ pháp layout
          form-generic, upsertKey không multiple, field layout create phải insertable và update phải updatable, template tiêu đề. Khi load: tham chiếu treo tự
          bỏ; lỗi shape/version thì dùng cấu hình mặc định, console.warn và hiện banner cho người có quyền CONFIGURATION. Khi lưu: có lỗi thì
          chặn.","status":"active","task_refs":["TASK-006","TASK-007","TASK-008","TASK-009","TASK-013","TASK-014"],"type":"requirement"},{"id":"R-009","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Tiêu
          đề nằm trong từng section (list.title, create.title, detail.title, update.title), hỗ trợ template ${key}; list.title và create.title không được có
          placeholder; detail.title và update.title chỉ tham chiếu property có thật; tiêu đề render dạng text (không HTML); thiếu thì sinh từ
          general.label.","status":"active","task_refs":["TASK-006","TASK-007","TASK-011","TASK-012"],"type":"requirement"},{"id":"R-010","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"sdGenericRoutes()
          cung cấp generic/:module/:entity, …/create, …/:id/detail, …/:id/update, …/configuration. Form detail/create/update hiển thị dạng page hoặc side-drawer
          theo provideSdGenericEntity.display → adapter.display → mặc định 'page'; side-drawer điều khiển bằng route: list vẫn hiển thị phía sau, giữ
          filter/trang, back đóng drawer, lưu xong list
          reload.","status":"active","task_refs":["TASK-010","TASK-011"],"type":"requirement"},{"id":"R-011","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Quyền
          theo định dạng <MODULE>_<ENTITY>_C_GENERIC_{LIST|DETAIL|CREATE|UPDATE|DELETE|IMPORT|CONFIGURATION} (viết hoa), kiểm tra qua
          SdPermissionService.hasPermission; thiếu quyền thì ẩn action và chặn route tương ứng; provideSdGeneric({ permission: false }) tắt kiểm
          tra.","status":"active","task_refs":["TASK-006","TASK-007","TASK-008","TASK-009","TASK-010","TASK-011"],"type":"requirement"},{"id":"R-012","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Màn
          list dùng sd-table type server: cột mặc định là mọi property trừ json/file; visible: false là ẩn mặc định nhưng bật lại được; sortable/filterable;
          externalFilters; orders mặc định; pageSize mặc định 20; export Excel phía client khi bật; action có sẵn create/import/export (header),
          detail/update/delete (dòng), delete (chọn nhiều, gọi delete lần lượt); xoá có xác nhận và reload sau khi
          xoá.","status":"active","task_refs":["TASK-006","TASK-007","TASK-011","TASK-012"],"type":"requirement"},{"id":"R-013","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Detail/create/update
          render bằng sd-form-render: layout = section.form ?? detail.form ?? tự sinh từ general; mỗi field layout được điền type/label/options/validation từ
          general theo key; detail ở chế độ viewed và hiện cả property system; create bỏ system và property không insertable; update bỏ system và property không
          updatable, payload update chỉ gồm property updatable; relation dùng catalog do lib tự đăng ký, search theo thứ tự provideSdGenericEntity.search →
          adapter.search → adapter.query với CONTAIN (tìm) / IN (lấy
          nhãn).","status":"active","task_refs":["TASK-006","TASK-007","TASK-008","TASK-009","TASK-011","TASK-012"],"type":"requirement"},{"id":"R-014","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"provideSdGenericEntity.hooks:
          beforeSave(ctx { action, data, schema }) trả payload (đồng bộ hoặc Promise) trước khi gọi adapter.create/update; afterSave(ctx) chạy sau khi lưu thành
          công.","status":"active","task_refs":["TASK-008","TASK-009"],"type":"requirement"},{"id":"R-015","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"provideSdGenericEntity
          khai action mở rộng: listActions, rowCommands, bulkActions, detailActions với { id, label, icon?, permission?, visible?(ctx), run(ctx) }, ctx gồm
          schema, row hoặc rows, reload(); hiddenDefaults ẩn action có sẵn (create, import, export, detail, update,
          delete).","status":"active","task_refs":["TASK-011","TASK-012"],"type":"requirement"},{"id":"R-016","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Import
          dùng sd-import-excel: template từ import.columns hoặc mọi property insertable trừ system/json/file; ô enum nhận value hoặc label; ô relation so khớp
          theo matchField (mặc định relation.displayField) qua search với values; có upsertKey thì tra theo lô bản ghi đã tồn tại → update, chưa có → create;
          không upsertKey thì luôn create; tối đa 5 request song song; kết quả từng dòng hiện trong sd-import-excel; chỉ cần quyền
          IMPORT.","status":"active","task_refs":["TASK-006","TASK-007","TASK-008","TASK-009","TASK-011","TASK-012"],"type":"requirement"},{"id":"R-017","owner_module_id":"modules/generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Màn
          chỉnh cấu hình tại …/configuration với 4 tab: Thông tin chung (label, nhãn/màu enum, display/searchFields của relation, validation, defaultValue,
          insertable/updatable; không sửa key/dataType), Danh sách (thứ tự cột, width/visible/sortable/filterable, externalFilters, orders, pageSize, export),
          Form (sd-form-builder cho detail, create/update có lựa chọn \"giống detail\", palette là properties), Import (columns, upsertKey); hiện cảnh báo
          property bị bỏ/mới; nút Lưu validate rồi gọi configuration.set(entity, schema), có lỗi thì
          chặn.","status":"active","task_refs":["TASK-013","TASK-014"],"type":"requirement"},{"id":"R-018","owner_module_id":"components/form-generic","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"form-generic
          thêm field type time (giá trị chuỗi HH:mm) và json (dùng code-editor, giá trị JSON hợp lệ) ở renderer, builder và validation; chỉ thêm mới, schema
          form-generic hiện có không đổi hành
          vi.","status":"active","task_refs":["TASK-001","TASK-002","TASK-003","TASK-004"],"type":"requirement"},{"id":"R-019","owner_module_id":"showcase","owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Showcase
          có trang demo module generic chạy với adapter mock in-memory; có tài liệu sd-generic.md và cập nhật sd-form-generic.md cho
          time/json.","status":"active","task_refs":["TASK-004","TASK-016","TASK-017"],"type":"requirement"},{"id":"R-020","owner_module_id":null,"owner_repository_id":"sdcorejs-angular","source":"explicit-user","statement":"Thay
          đổi viết ở versions/v19 rồi rollout sang v20/v21/v22 bằng npm run sync, check:sync xanh; CHANGELOG có mục Unreleased mô tả thay đổi, nhắm release
          suffix 3.2 (chỉ thêm mới).","status":"active","task_refs":["TASK-015","TASK-018","TASK-019"],"type":"requirement"},{"behavior":"Mở generic/tms/order
          khi configuration.get trả null","blocking":true,"expected_result":"Màn list hiện các cột sinh từ properties (trừ json/file), dữ liệu lấy qua
          adapter.query với PagingReq pageSize 20","id":"AC-001","requirement_refs":["R-004","R-006","R-012"],"statement":"Mở generic/tms/order khi
          configuration.get trả null → Màn list hiện các cột sinh từ properties (trừ json/file), dữ liệu lấy qua adapter.query với PagingReq pageSize
          20","task_refs":["TASK-008","TASK-009","TASK-011","TASK-012"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Cùng module
          tms khai ở provideSdGeneric root và trong lazy route rồi mở trang generic trong lazy route đó","blocking":true,"expected_result":"Lib dùng adapter
          khai ở lazy route; trang ngoài lazy route dùng adapter root","id":"AC-002","requirement_refs":["R-005"],"statement":"Cùng module tms khai ở
          provideSdGeneric root và trong lazy route rồi mở trang generic trong lazy route đó → Lib dùng adapter khai ở lazy route; trang ngoài lazy route dùng
          adapter root","task_refs":["TASK-008","TASK-009"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Một lần gọi
          provideSdGeneric khai hai adapter cùng module","blocking":true,"expected_result":"Khởi tạo injector ném lỗi nêu tên module bị
          trùng","id":"AC-003","requirement_refs":["R-005"],"statement":"Một lần gọi provideSdGeneric khai hai adapter cùng module → Khởi tạo injector ném lỗi
          nêu tên module bị
          trùng","task_refs":["TASK-008","TASK-009"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"provideSdGenericEntity.schema
          đổi label của một property và configuration.get trả bản đã lưu đổi label property khác","blocking":true,"expected_result":"Schema hiệu lực có cả hai
          thay đổi; khi get trả null thì chỉ có thay đổi của
          provideSdGenericEntity.schema","id":"AC-004","requirement_refs":["R-006"],"statement":"provideSdGenericEntity.schema đổi label của một property và
          configuration.get trả bản đã lưu đổi label property khác → Schema hiệu lực có cả hai thay đổi; khi get trả null thì chỉ có thay đổi của
          provideSdGenericEntity.schema","task_refs":["TASK-008","TASK-009"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Adapter
          không khai configuration, lưu cấu hình từ màn chỉnh rồi tải lại trang","blocking":true,"expected_result":"Cấu hình được ghi và đọc lại từ localStorage
          theo module và entity","id":"AC-005","requirement_refs":["R-006","R-017"],"statement":"Adapter không khai configuration, lưu cấu hình từ màn chỉnh rồi
          tải lại trang → Cấu hình được ghi và đọc lại từ localStorage theo module và
          entity","task_refs":["TASK-008","TASK-009","TASK-013","TASK-014"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Cấu hình
          đã lưu có cột và field layout trỏ tới property đã bị xoá ở schema hiện tại, và schema hiện tại có property
          mới","blocking":true,"expected_result":"Cột/field treo bị bỏ, trang vẫn chạy; property mới có trong general và list.columns với visible: false, không
          có trong layout form đã lưu; dataType lấy từ schema hiện tại","id":"AC-006","requirement_refs":["R-007","R-008"],"statement":"Cấu hình đã lưu có cột
          và field layout trỏ tới property đã bị xoá ở schema hiện tại, và schema hiện tại có property mới → Cột/field treo bị bỏ, trang vẫn chạy; property mới
          có trong general và list.columns với visible: false, không có trong layout form đã lưu; dataType lấy từ schema hiện
          tại","task_refs":["TASK-005","TASK-006","TASK-007"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"configuration.get trả
          object sai shape hoặc version không hỗ trợ","blocking":true,"expected_result":"Lib dùng cấu hình mặc định, gọi console.warn, banner \"cấu hình không
          hợp lệ\" chỉ hiện với người có quyền CONFIGURATION","id":"AC-007","requirement_refs":["R-008","R-011"],"statement":"configuration.get trả object sai
          shape hoặc version không hỗ trợ → Lib dùng cấu hình mặc định, gọi console.warn, banner \"cấu hình không hợp lệ\" chỉ hiện với người có quyền
          CONFIGURATION","task_refs":["TASK-008","TASK-009","TASK-011","TASK-012"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"validateSdGenericSchema
          nhận schema có key trùng, upsertKey trỏ property multiple, field layout update không updatable, field layout sai
          type","blocking":true,"expected_result":"Trả issue với path và code tương ứng cho từng lỗi, severity
          error","id":"AC-008","requirement_refs":["R-008"],"statement":"validateSdGenericSchema nhận schema có key trùng, upsertKey trỏ property multiple,
          field layout update không updatable, field layout sai type → Trả issue với path và code tương ứng cho từng lỗi, severity
          error","task_refs":["TASK-006","TASK-007"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Validate update.title = 'Đơn
          ${unknown}' và list.title = 'DS ${code}'; render detail.title = '<b>${code}</b>'","blocking":true,"expected_result":"Cả hai title đầu bị báo lỗi
          template; title detail hiện chuỗi text đã thay giá trị, thẻ <b> không được render thành
          HTML","id":"AC-009","requirement_refs":["R-008","R-009"],"statement":"Validate update.title = 'Đơn ${unknown}' và list.title = 'DS ${code}'; render
          detail.title = '<b>${code}</b>' → Cả hai title đầu bị báo lỗi template; title detail hiện chuỗi text đã thay giá trị, thẻ <b> không được render thành
          HTML","task_refs":["TASK-006","TASK-007","TASK-011","TASK-012"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Người dùng
          thiếu quyền TMS_ORDER_C_GENERIC_CREATE mở màn list rồi điều hướng thẳng tới generic/tms/order/create","blocking":true,"expected_result":"Nút tạo mới
          bị ẩn và route create bị chặn; khi provideSdGeneric({ permission: false }) thì nút hiện và route mở
          được","id":"AC-010","requirement_refs":["R-010","R-011"],"statement":"Người dùng thiếu quyền TMS_ORDER_C_GENERIC_CREATE mở màn list rồi điều hướng
          thẳng tới generic/tms/order/create → Nút tạo mới bị ẩn và route create bị chặn; khi provideSdGeneric({ permission: false }) thì nút hiện và route mở
          được","task_refs":["TASK-006","TASK-007","TASK-010","TASK-011"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"display
          trả 'side-drawer', người dùng lọc list rồi mở generic/tms/order/1/detail và bấm back","blocking":true,"expected_result":"Drawer mở đè lên list, URL có
          /1/detail; back đóng drawer, list giữ filter và trang","id":"AC-011","requirement_refs":["R-010"],"statement":"display trả 'side-drawer', người dùng
          lọc list rồi mở generic/tms/order/1/detail và bấm back → Drawer mở đè lên list, URL có /1/detail; back đóng drawer, list giữ filter và
          trang","task_refs":["TASK-010","TASK-011"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Không khai display và mở
          generic/tms/order/1/update","blocking":true,"expected_result":"Form update hiển thị dạng trang đầy đủ (mặc định 'page'); lưu thành công thì quay về
          list và list reload","id":"AC-012","requirement_refs":["R-010"],"statement":"Không khai display và mở generic/tms/order/1/update → Form update hiển
          thị dạng trang đầy đủ (mặc định 'page'); lưu thành công thì quay về list và list
          reload","task_refs":["TASK-010","TASK-011"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"list có column visible: false,
          orders mặc định và externalFilters có default","blocking":true,"expected_result":"Cột ẩn nhưng có trong cài đặt cột; request query mang orders và
          filters tương ứng","id":"AC-013","requirement_refs":["R-012"],"statement":"list có column visible: false, orders mặc định và externalFilters có
          default → Cột ẩn nhưng có trong cài đặt cột; request query mang orders và filters tương
          ứng","task_refs":["TASK-006","TASK-007","TASK-011","TASK-012"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Xoá một
          dòng và xoá 3 dòng đã chọn","blocking":true,"expected_result":"Mỗi lần có hộp xác nhận; adapter.delete được gọi 1 lần rồi 3 lần tuần tự; list reload
          sau khi xoá","id":"AC-014","requirement_refs":["R-012"],"statement":"Xoá một dòng và xoá 3 dòng đã chọn → Mỗi lần có hộp xác nhận; adapter.delete được
          gọi 1 lần rồi 3 lần tuần tự; list reload sau khi
          xoá","task_refs":["TASK-011","TASK-012"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Mở create, update, detail với
          schema không có layout form và có property system, property updatable: false","blocking":true,"expected_result":"Create không có system; update không
          có system và property không updatable, payload update không chứa chúng; detail ở chế độ viewed và có property system; field có label/type/options lấy
          từ general","id":"AC-015","requirement_refs":["R-013"],"statement":"Mở create, update, detail với schema không có layout form và có property system,
          property updatable: false → Create không có system; update không có system và property không updatable, payload update không chứa chúng; detail ở chế
          độ viewed và có property system; field có label/type/options lấy từ
          general","task_refs":["TASK-006","TASK-007","TASK-011","TASK-012"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Mở
          select relation với entity có search riêng, với adapter có search, và với adapter chỉ có query","blocking":true,"expected_result":"Lần lượt gọi search
          của entity, search của adapter, query với filter CONTAIN trên searchFields/displayField; nhãn giá trị đã chọn lấy qua IN trên
          valueField","id":"AC-016","requirement_refs":["R-013","R-004"],"statement":"Mở select relation với entity có search riêng, với adapter có search, và
          với adapter chỉ có query → Lần lượt gọi search của entity, search của adapter, query với filter CONTAIN trên searchFields/displayField; nhãn giá trị
          đã chọn lấy qua IN trên
          valueField","task_refs":["TASK-006","TASK-007","TASK-008","TASK-009"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"beforeSave
          thêm field vào payload và afterSave được khai","blocking":true,"expected_result":"adapter.create/update nhận payload đã sửa; afterSave chạy đúng một
          lần sau khi lưu thành công và không chạy khi lưu lỗi","id":"AC-017","requirement_refs":["R-014"],"statement":"beforeSave thêm field vào payload và
          afterSave được khai → adapter.create/update nhận payload đã sửa; afterSave chạy đúng một lần sau khi lưu thành công và không chạy khi lưu
          lỗi","task_refs":["TASK-008","TASK-009"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"provideSdGenericEntity khai
          rowCommands có permission và visible, hiddenDefaults: [delete]","blocking":true,"expected_result":"Command chỉ hiện khi có quyền và visible trả true,
          run nhận ctx có row và reload; command delete có sẵn bị ẩn","id":"AC-018","requirement_refs":["R-015"],"statement":"provideSdGenericEntity khai
          rowCommands có permission và visible, hiddenDefaults: [delete] → Command chỉ hiện khi có quyền và visible trả true, run nhận ctx có row và reload;
          command delete có sẵn bị ẩn","task_refs":["TASK-011","TASK-012"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Import
          file 3 dòng với upsertKey code (1 dòng code đã tồn tại), một ô enum ghi bằng label, một ô relation ghi theo
          displayField","blocking":true,"expected_result":"Dòng đã tồn tại gọi update, hai dòng còn lại gọi create; enum và relation được đổi sang value/id;
          không quá 5 request chạy đồng thời; kết quả từng dòng hiện trong sd-import-excel","id":"AC-019","requirement_refs":["R-016"],"statement":"Import file
          3 dòng với upsertKey code (1 dòng code đã tồn tại), một ô enum ghi bằng label, một ô relation ghi theo displayField → Dòng đã tồn tại gọi update, hai
          dòng còn lại gọi create; enum và relation được đổi sang value/id; không quá 5 request chạy đồng thời; kết quả từng dòng hiện trong
          sd-import-excel","task_refs":["TASK-006","TASK-007","TASK-008","TASK-009","TASK-011","TASK-012"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Ở
          màn chỉnh cấu hình, xoá property đang dùng làm upsertKey khỏi import rồi bấm Lưu; sau đó sửa label hợp lệ rồi bấm
          Lưu","blocking":true,"expected_result":"Lần đầu bị chặn và hiện lỗi; lần sau gọi configuration.set(entity, schema) với label mới; ô key và dataType
          không sửa được","id":"AC-020","requirement_refs":["R-017","R-008"],"statement":"Ở màn chỉnh cấu hình, xoá property đang dùng làm upsertKey khỏi import
          rồi bấm Lưu; sau đó sửa label hợp lệ rồi bấm Lưu → Lần đầu bị chặn và hiện lỗi; lần sau gọi configuration.set(entity, schema) với label mới; ô key và
          dataType không sửa được","task_refs":["TASK-013","TASK-014"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Render schema
          form-generic có field time và json; nhập '25:00' và chuỗi JSON sai","blocking":true,"expected_result":"Hai field báo lỗi validation; giá trị đúng được
          lưu là chuỗi HH:mm và JSON đã parse; builder có hai loại field này trong palette; spec form-generic hiện có vẫn
          xanh","id":"AC-021","requirement_refs":["R-018"],"statement":"Render schema form-generic có field time và json; nhập '25:00' và chuỗi JSON sai → Hai
          field báo lỗi validation; giá trị đúng được lưu là chuỗi HH:mm và JSON đã parse; builder có hai loại field này trong palette; spec form-generic hiện
          có vẫn xanh","task_refs":["TASK-001","TASK-002","TASK-003","TASK-004"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Mở
          trang demo module generic trên Showcase","blocking":true,"expected_result":"Trang hiện list từ adapter mock và mở được create/detail; guard
          example/registry của Showcase xanh","id":"AC-022","requirement_refs":["R-019"],"statement":"Mở trang demo module generic trên Showcase → Trang hiện
          list từ adapter mock và mở được create/detail; guard example/registry của Showcase
          xanh","task_refs":["TASK-004","TASK-016","TASK-017"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Chạy npm run sync rồi
          npm run check:sync và build sdcorejs-angular trên v19–v22","blocking":true,"expected_result":"check:sync xanh, bốn workspace build không lỗi;
          CHANGELOG có mục Unreleased cho module generic","id":"AC-023","requirement_refs":["R-020"],"statement":"Chạy npm run sync rồi npm run check:sync và
          build sdcorejs-angular trên v19–v22 → check:sync xanh, bốn workspace build không lỗi; CHANGELOG có mục Unreleased cho module
          generic","task_refs":["TASK-015","TASK-018","TASK-019"],"type":"acceptance-criterion","verification_kind":"automated"},{"behavior":"Chạy spec
          public-api của entry point modules/generic","blocking":true,"expected_result":"Entry point export đúng bốn symbol runtime provideSdGeneric,
          provideSdGenericEntity, sdGenericRoutes, validateSdGenericSchema; không import package riêng của backend
          nào","id":"AC-024","requirement_refs":["R-001","R-002","R-003"],"statement":"Chạy spec public-api của entry point modules/generic → Entry point export
          đúng bốn symbol runtime provideSdGeneric, provideSdGenericEntity, sdGenericRoutes, validateSdGenericSchema; không import package riêng của backend
          nào","task_refs":["TASK-001","TASK-005","TASK-015","TASK-016"],"type":"acceptance-criterion","verification_kind":"automated"},{"blocking":false,"confidence":"high","consequence_if_wrong":"Có
          thể đọc trực tiếp token multi thay vì đi theo chuỗi injector; thiết kế vẫn đúng nhưng thừa
          code.","evidence_refs":[],"id":"A-001","impacted_refs":["R-005"],"owner":"sdcorejs-execute-plan","rationale":"Hành vi chuẩn của Angular DI; đã gặp ở
          SD_API_CONFIG (SdApiHandlerRegistry).","source":"inferred","statement":"Multi-provider khai trong injector con không gộp với injector cha; lib phải tự
          đi từ injector gần nhất lên root (skipSelf) để tìm adapter/entity.","status":"confirmed","type":"assumption","validation_method":"Test TDD cho AC-002
          với injector root + lazy."},{"blocking":false,"confidence":"medium","consequence_if_wrong":"Cần lớp chuyển SdTableFilterRequest sang Filter trong
          module
          generic.","evidence_refs":[],"id":"A-002","impacted_refs":["R-012"],"owner":"sdcorejs-execute-plan","rationale":"components/table/src/models/table-option.model.ts:198
          khai items(filterRequest, pagingReq: PagingReq).","source":"inferred","statement":"sd-table server truyền PagingReq (filters, orders, pageSize,
          pageNumber) đủ để chuyển thẳng sang adapter.query, gồm cả external filter.","status":"proposed","type":"assumption","validation_method":"Test TDD cho
          AC-013 đối chiếu request thực tế sd-table phát ra."},{"blocking":false,"confidence":"medium","consequence_if_wrong":"Cần thêm hiển thị kết quả riêng
          sau bước
          accept.","evidence_refs":[],"id":"A-003","impacted_refs":["R-016"],"owner":"sdcorejs-execute-plan","rationale":"components/import-excel/src/import-excel.model.ts:17.","source":"inferred","statement":"sd-import-excel
          accept(items) trả SdImportExcelValidation[] đủ để báo kết quả từng dòng sau khi gọi
          create/update.","status":"proposed","type":"assumption","validation_method":"Test cho
          AC-019."},{"blocking":false,"confidence":"medium","consequence_if_wrong":"Field json cần bọc adapter control riêng quanh
          code-editor.","evidence_refs":[],"id":"A-004","impacted_refs":["R-018"],"owner":"sdcorejs-execute-plan","rationale":"components/code-editor/src/code-editor.component.ts
          có model/CVA.","source":"inferred","statement":"sd-code-editor dùng được làm control (model/ControlValueAccessor) bên trong renderer form-generic cho
          field json.","status":"proposed","type":"assumption","validation_method":"Test cho
          AC-021."},{"blocking":false,"confidence":"high","consequence_if_wrong":"Đổi tên khoá trước release, chưa có dữ liệu
          cũ.","evidence_refs":[],"id":"A-005","impacted_refs":["R-006"],"owner":"user","rationale":"Người dùng chốt mặc định localStorage; tên khoá do spec
          đặt.","source":"defaulted","statement":"Khoá localStorage mặc định là sd-generic:configuration:<module>.<entity>; cấu hình chỉ có hiệu lực trên trình
          duyệt đó.","status":"proposed","type":"assumption","validation_method":"Người dùng duyệt spec; test cho
          AC-005."},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-001","AC-024"],"id":"D-001","owner_repository_id":"sdcorejs-angular","question":"Module
          generic đặt ở repo nào?","rationale":"form-generic 3.0 đã ở đây; nguyên tắc adapter không phụ thuộc
          backend.","revisit_condition":null,"scope":"repository","selected_value":"@sdcorejs/angular, entry point @sdcorejs/angular/modules/generic, không phụ
          thuộc backend; adapter backend OMD nằm ngoài repo","source":"explicit-user","statement":"Module generic đặt ở repo nào? → @sdcorejs/angular, entry
          point @sdcorejs/angular/modules/generic, không phụ thuộc backend; adapter backend OMD nằm ngoài
          repo","status":"approved","supersedes":null,"task_refs":["TASK-015","TASK-016"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-002","R-013","AC-015"],"id":"D-002","owner_repository_id":"sdcorejs-angular","question":"Ghép
          SdGenericSchema với form-generic thế nào?","rationale":"Tránh cấu hình trùng lặp (pain point lib-core-commerce) mà vẫn dùng đủ form-generic và
          sd-form-builder.","revisit_condition":null,"scope":"public-contract","selected_value":"general.properties là nguồn duy nhất; detail/create/update chứa
          layout SdFormGenericSchema tham chiếu property theo key, lib điền type/label/options/validation lúc render; thiếu layout thì tự
          sinh","source":"explicit-user","statement":"Ghép SdGenericSchema với form-generic thế nào? → general.properties là nguồn duy nhất;
          detail/create/update chứa layout SdFormGenericSchema tham chiếu property theo key, lib điền type/label/options/validation lúc render; thiếu layout thì
          tự
          sinh","status":"approved","supersedes":null,"task_refs":["TASK-005","TASK-007","TASK-011"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-002","R-004","AC-001"],"id":"D-003","owner_repository_id":"sdcorejs-angular","question":"Tên
          gọi trong model và adapter?","rationale":"Theo convention API của người
          dùng.","revisit_condition":null,"scope":"public-contract","selected_value":"properties (không phải fields), adapter.detail (không phải get),
          configuration: { get, set }, entity (không phải typeCode)","source":"explicit-user","statement":"Tên gọi trong model và adapter? → properties (không
          phải fields), adapter.detail (không phải get), configuration: { get, set }, entity (không phải
          typeCode)","status":"approved","supersedes":null,"task_refs":["TASK-005"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-010","AC-011","AC-012"],"id":"D-004","owner_repository_id":"sdcorejs-angular","question":"Định
          dạng route?","rationale":"Mỗi entity một cấu hình nên route mang thẳng module/entity, không cần tách
          chuỗi.","revisit_condition":null,"scope":"public-contract","selected_value":"generic/:module/:entity, /create, /:id/detail, /:id/update,
          /configuration (id đứng trước action)","source":"explicit-user","statement":"Định dạng route? → generic/:module/:entity, /create, /:id/detail,
          /:id/update, /configuration (id đứng trước
          action)","status":"approved","supersedes":null,"task_refs":["TASK-010","TASK-011"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-010","AC-011"],"id":"D-005","owner_repository_id":"sdcorejs-angular","question":"Page
          hay side-drawer quyết định ở đâu?","rationale":"Consumer quyết theo schema, ví dụ số property; deep link và back hoạt
          động.","revisit_condition":null,"scope":"public-contract","selected_value":"Callback display(args) ở provideSdGenericEntity rồi adapter, mặc định
          'page'; side-drawer điều khiển bằng route","source":"explicit-user","statement":"Page hay side-drawer quyết định ở đâu? → Callback display(args) ở
          provideSdGenericEntity rồi adapter, mặc định 'page'; side-drawer điều khiển bằng
          route","status":"approved","supersedes":null,"task_refs":["TASK-010","TASK-011"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-012","R-016","R-017","R-018","R-019"],"id":"D-006","owner_repository_id":"sdcorejs-angular","question":"Phạm
          vi giao lần này?","rationale":"Người dùng chọn phương án 3.","revisit_condition":null,"scope":"repository","selected_value":"Làm hết một lần: runtime
          CRUD, import, màn chỉnh cấu hình, action mở rộng, form-generic time/json, Showcase, docs","source":"explicit-user","statement":"Phạm vi giao lần này?
          → Làm hết một lần: runtime CRUD, import, màn chỉnh cấu hình, action mở rộng, form-generic time/json, Showcase,
          docs","status":"approved","supersedes":null,"task_refs":["TASK-011","TASK-012","TASK-017"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-005","AC-002","AC-003"],"id":"D-007","owner_repository_id":"sdcorejs-angular","question":"provide
          một hay nhiều lần?","rationale":"Module tự provide adapter; registry root chỉ thấy module đã load và phụ thuộc field
          private.","revisit_condition":null,"scope":"public-contract","selected_value":"Nhiều lần ở root và lazy route; tra injector gần nhất lên root, gần
          nhất thắng; không dùng registry đọc field private của router","source":"explicit-user","statement":"provide một hay nhiều lần? → Nhiều lần ở root và
          lazy route; tra injector gần nhất lên root, gần nhất thắng; không dùng registry đọc field private của
          router","status":"approved","supersedes":null,"task_refs":["TASK-008","TASK-009"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-018","AC-021"],"id":"D-008","owner_repository_id":"sdcorejs-angular","question":"time
          và json?","rationale":"Phạm vi làm hết một lần; tránh map tạm kém chính
          xác.","revisit_condition":null,"scope":"public-contract","selected_value":"Thêm field type time và json vào form-generic (json dùng code-editor), chỉ
          thêm mới","source":"explicit-user","statement":"time và json? → Thêm field type time và json vào form-generic (json dùng code-editor), chỉ thêm
          mới","status":"approved","supersedes":null,"task_refs":["TASK-002","TASK-003","TASK-004"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-003","AC-016"],"id":"D-009","owner_repository_id":"sdcorejs-angular","question":"Quan
          hệ OneToMany và relation.type?","rationale":"Giữ đơn giản như lib-core-commerce; bảng con để
          sau.","revisit_condition":null,"scope":"public-contract","selected_value":"Chỉ multi-select, không bảng con; bỏ relation.type, multiple quyết định
          một/nhiều","source":"explicit-user","statement":"Quan hệ OneToMany và relation.type? → Chỉ multi-select, không bảng con; bỏ relation.type, multiple
          quyết định
          một/nhiều","status":"approved","supersedes":null,"task_refs":["TASK-005","TASK-007"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-004","R-013","AC-016"],"id":"D-010","owner_repository_id":"sdcorejs-angular","question":"search
          và history?","rationale":"Backend có API search riêng để bảo đảm hiệu năng; history mỗi dự án tự
          làm.","revisit_condition":null,"scope":"public-contract","selected_value":"search? tuỳ chọn ở adapter và ở entity, fallback query CONTAIN/IN; history
          không thuộc lib","source":"explicit-user","statement":"search và history? → search? tuỳ chọn ở adapter và ở entity, fallback query CONTAIN/IN; history
          không thuộc
          lib","status":"approved","supersedes":null,"task_refs":["TASK-008","TASK-009"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-006","R-014","R-015","AC-004","AC-017","AC-018"],"id":"D-011","owner_repository_id":"sdcorejs-angular","question":"Tuỳ
          biến theo entity ở đâu?","rationale":"Adapter trả schema mặc định theo entity; deep-merge mảng không rõ
          nghĩa.","revisit_condition":null,"scope":"public-contract","selected_value":"Provider riêng provideSdGenericEntity { module, entity, schema(base),
          search?, display?, hooks?, listActions?, rowCommands?, bulkActions?, detailActions?, hiddenDefaults? }; schema dạng hàm thay vì object
          partial","source":"explicit-user","statement":"Tuỳ biến theo entity ở đâu? → Provider riêng provideSdGenericEntity { module, entity, schema(base),
          search?, display?, hooks?, listActions?, rowCommands?, bulkActions?, detailActions?, hiddenDefaults? }; schema dạng hàm thay vì object
          partial","status":"approved","supersedes":null,"task_refs":["TASK-005","TASK-008","TASK-009"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-006","AC-005"],"id":"D-012","owner_repository_id":"sdcorejs-angular","question":"Lưu
          cấu hình thế nào?","rationale":"Không cần nhận diện configurationId; server hay theo người dùng do consumer
          quyết.","revisit_condition":null,"scope":"public-contract","selected_value":"configuration: { get(entity), set(entity, schema) } trên adapter, mỗi
          entity một cấu hình, null là chưa có; adapter không khai thì localStorage","source":"explicit-user","statement":"Lưu cấu hình thế nào? →
          configuration: { get(entity), set(entity, schema) } trên adapter, mỗi entity một cấu hình, null là chưa có; adapter không khai thì
          localStorage","status":"approved","supersedes":null,"task_refs":["TASK-008","TASK-009","TASK-013"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-008","AC-007","AC-020"],"id":"D-013","owner_repository_id":"sdcorejs-angular","question":"Cấu
          hình đã lưu không hợp lệ thì sao?","rationale":"Bước validate quan trọng; trang không chết vì cấu hình
          hỏng.","revisit_condition":null,"scope":"public-contract","selected_value":"Tham chiếu treo tự bỏ; lỗi shape/version dùng mặc định + console.warn +
          banner cho người có quyền CONFIGURATION; lưu có lỗi thì chặn","source":"explicit-user","statement":"Cấu hình đã lưu không hợp lệ thì sao? → Tham chiếu
          treo tự bỏ; lỗi shape/version dùng mặc định + console.warn + banner cho người có quyền CONFIGURATION; lưu có lỗi thì
          chặn","status":"approved","supersedes":null,"task_refs":["TASK-006","TASK-007","TASK-013"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-009","AC-009"],"id":"D-014","owner_repository_id":"sdcorejs-angular","question":"Tiêu
          đề đặt ở đâu?","rationale":"Người dùng yêu cầu; tránh XSS như htmlTemplate
          cũ.","revisit_condition":null,"scope":"public-contract","selected_value":"Trong từng section list/create/update/detail, template ${key} có validate,
          render dạng text","source":"explicit-user","statement":"Tiêu đề đặt ở đâu? → Trong từng section list/create/update/detail, template ${key} có
          validate, render dạng
          text","status":"approved","supersedes":null,"task_refs":["TASK-006","TASK-007"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-011","AC-010"],"id":"D-015","owner_repository_id":"sdcorejs-angular","question":"Mã
          quyền và cơ chế kiểm tra?","rationale":"Định dạng người dùng đưa, thêm CONFIGURATION cho màn chỉnh cấu
          hình.","revisit_condition":null,"scope":"public-contract","selected_value":"<MODULE>_<ENTITY>_C_GENERIC_{LIST|DETAIL|CREATE|UPDATE|DELETE|IMPORT|CONFIGURATION}
          qua SdPermissionService, có permission: false","source":"explicit-user","statement":"Mã quyền và cơ chế kiểm tra? →
          <MODULE>_<ENTITY>_C_GENERIC_{LIST|DETAIL|CREATE|UPDATE|DELETE|IMPORT|CONFIGURATION} qua SdPermissionService, có permission:
          false","status":"approved","supersedes":null,"task_refs":["TASK-006","TASK-007","TASK-010"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-016","AC-019"],"id":"D-016","owner_repository_id":"sdcorejs-angular","question":"Luật
          import?","rationale":"Dùng lại create/update của adapter và sd-import-excel có
          sẵn.","revisit_condition":null,"scope":"public-contract","selected_value":"Template từ import.columns hoặc property insertable; enum theo value/label;
          relation theo matchField qua search; upsert theo upsertKey; tối đa 5 request song song; chỉ quyền IMPORT","source":"explicit-user","statement":"Luật
          import? → Template từ import.columns hoặc property insertable; enum theo value/label; relation theo matchField qua search; upsert theo upsertKey; tối
          đa 5 request song song; chỉ quyền
          IMPORT","status":"approved","supersedes":null,"task_refs":["TASK-006","TASK-007","TASK-008","TASK-009"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-005","R-007","R-008"],"id":"D-017","owner_repository_id":"sdcorejs-angular","question":"Cách
          viết test?","rationale":"Logic thuần có giá trị TDD cao; UI chủ yếu là nối
          component.","revisit_condition":null,"scope":"repository","selected_value":"TDD cho logic (tra adapter/entity, dựng schema, merge, validate, template,
          fallback search, mã quyền, import upsert); viết test sau cho UI và Showcase","source":"explicit-user","statement":"Cách viết test? → TDD cho logic
          (tra adapter/entity, dựng schema, merge, validate, template, fallback search, mã quyền, import upsert); viết test sau cho UI và
          Showcase","status":"approved","supersedes":null,"task_refs":["TASK-002","TASK-006","TASK-008","TASK-012","TASK-014"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-020","AC-023"],"id":"D-018","owner_repository_id":"sdcorejs-angular","question":"Release?","rationale":"Không
          phá vỡ API consumer.","revisit_condition":null,"scope":"repository","selected_value":"Suffix minor kế tiếp 3.2, chỉ thêm mới, CHANGELOG Unreleased;
          tag/publish theo release ritual và cần người dùng cho phép riêng","source":"explicit-user","statement":"Release? → Suffix minor kế tiếp 3.2, chỉ thêm
          mới, CHANGELOG Unreleased; tag/publish theo release ritual và cần người dùng cho phép
          riêng","status":"approved","supersedes":null,"task_refs":["TASK-018","TASK-019"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["INV-002","INV-003","INV-007","R-001"],"id":"D-019","owner_repository_id":"sdcorejs-angular","question":"Phân
          tầng trong modules/generic?","rationale":"Logic dùng chung nằm ở hàm thuần để TDD và để list/form/import/màn cấu hình không tự quyết khác
          nhau.","revisit_condition":null,"scope":"module","selected_value":"models (type) → core (hàm thuần: merge, validate, dựng mặc định, tiêu đề, mã quyền,
          dựng form, map cột, kế hoạch import, request search) → registry (provider, scope) → services (schema, data, quyền, import) → routes/pages/components;
          tầng dưới không import tầng trên","source":"approved-architecture","statement":"Phân tầng trong modules/generic? → models (type) → core (hàm thuần:
          merge, validate, dựng mặc định, tiêu đề, mã quyền, dựng form, map cột, kế hoạch import, request search) → registry (provider, scope) → services
          (schema, data, quyền, import) → routes/pages/components; tầng dưới không import tầng
          trên","status":"approved","supersedes":null,"task_refs":["TASK-005","TASK-007","TASK-015"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["INV-001","R-005","AC-003"],"id":"D-020","owner_repository_id":"sdcorejs-angular","question":"Cơ
          chế registry cho provider gọi nhiều lần?","rationale":"Multi token ở injector con không gộp với cha; trùng cùng tầng là mơ hồ nên báo lỗi (làm rõ
          R-005: bao trùm trường hợp trùng trong một lần gọi); kiểm sớm để AC-003 ném lỗi lúc khởi tạo, không đợi lần điều hướng
          đầu.","revisit_condition":null,"scope":"module","selected_value":"Mỗi injector có một scope node dựng từ multi token cùng tầng (self) và scope cha
          (skipSelf); tra module rồi module+entity từ scope gần nhất lên root; trùng module (hoặc module+entity) trong cùng một injector là lỗi, kiểm ngay khi
          injector được tạo bằng provideEnvironmentInitializer; option permission lấy từ scope gần nhất có
          khai","source":"approved-architecture","statement":"Cơ chế registry cho provider gọi nhiều lần? → Mỗi injector có một scope node dựng từ multi token
          cùng tầng (self) và scope cha (skipSelf); tra module rồi module+entity từ scope gần nhất lên root; trùng module (hoặc module+entity) trong cùng một
          injector là lỗi, kiểm ngay khi injector được tạo bằng provideEnvironmentInitializer; option permission lấy từ scope gần nhất có
          khai","status":"approved","supersedes":null,"task_refs":["TASK-008","TASK-009"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["INV-002","R-006","AC-004"],"id":"D-021","owner_repository_id":"sdcorejs-angular","question":"Ai
          giữ schema hiệu lực và cache?","rationale":"Một nơi duy nhất dựng 3 lớp schema; tránh mỗi trang tự gọi
          adapter.schema.","revisit_condition":null,"scope":"module","selected_value":"SdGenericSchemaService ở injector môi trường của route generic giữ
          Promise schema theo module.entity; resolver của route nạp schema trước khi list/form/màn cấu hình kích hoạt; lưu cấu hình thì xoá cache entity
          đó","source":"approved-architecture","statement":"Ai giữ schema hiệu lực và cache? → SdGenericSchemaService ở injector môi trường của route generic
          giữ Promise schema theo module.entity; resolver của route nạp schema trước khi list/form/màn cấu hình kích hoạt; lưu cấu hình thì xoá cache entity
          đó","status":"approved","supersedes":null,"task_refs":["TASK-008","TASK-009"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["INV-008","R-013","AC-016"],"id":"D-022","owner_repository_id":"sdcorejs-angular","question":"Select
          relation lấy dữ liệu từ đâu khi form-generic chỉ nhận catalog tĩnh?","rationale":"Chỉ dùng API public của form-generic (catalog và templates cố định
          lúc provideSdFormGeneric chạy nên không thể một catalog theo id <module>.<entity> như phần Architecture của spec mô tả); một catalog phục vụ mọi
          relation. Hệ quả: cấu hình form-generic của portal ở root không áp lên form của module
          generic.","revisit_condition":null,"scope":"module","selected_value":"sdGenericRoutes() đăng ký provideSdFormGeneric({ catalogs: [sd-generic-relation]
          }) ở injector môi trường của route generic; field relation dùng catalog này với params hằng { module, entity, valueField, displayField, searchFields
          (nối bằng dấu phẩy) } để cache của form-generic phân biệt từng relation; callback của catalog gọi SdGenericDataService qua injector môi trường bắt
          bằng provideEnvironmentInitializer; vì option value của form-generic là chuỗi, SdGenericDataService đổi giá trị relation về kiểu gốc (theo dữ liệu đã
          tải) trước khi lưu","source":"approved-architecture","statement":"Select relation lấy dữ liệu từ đâu khi form-generic chỉ nhận catalog tĩnh? →
          sdGenericRoutes() đăng ký provideSdFormGeneric({ catalogs: [sd-generic-relation] }) ở injector môi trường của route generic; field relation dùng
          catalog này với params hằng { module, entity, valueField, displayField, searchFields (nối bằng dấu phẩy) } để cache của form-generic phân biệt từng
          relation; callback của catalog gọi SdGenericDataService qua injector môi trường bắt bằng provideEnvironmentInitializer; vì option value của
          form-generic là chuỗi, SdGenericDataService đổi giá trị relation về kiểu gốc (theo dữ liệu đã tải) trước khi
          lưu","status":"approved","supersedes":null,"task_refs":["TASK-008","TASK-009"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["INV-015","R-017","AC-020"],"id":"D-023","owner_repository_id":"sdcorejs-angular","question":"Tab
          Form của màn cấu hình đưa property vào layout thế nào?","rationale":"templates cố định lúc provideSdFormGeneric chạy nên không sinh theo entity được;
          panel property đáp ứng \"palette là properties\" của R-017 mà không mở rộng public API form-generic ngoài
          time/json.","revisit_condition":null,"scope":"module","selected_value":"sd-form-builder dùng [(schema)]; panel danh sách property chưa có trong
          layout, bấm để thêm field đã điền sẵn vào schema (builder nạp lại schema nên mất undo và vùng chọn hiện tại); không dùng templates của
          form-generic","source":"approved-architecture","statement":"Tab Form của màn cấu hình đưa property vào layout thế nào? → sd-form-builder dùng
          [(schema)]; panel danh sách property chưa có trong layout, bấm để thêm field đã điền sẵn vào schema (builder nạp lại schema nên mất undo và vùng chọn
          hiện tại); không dùng templates của
          form-generic","status":"approved","supersedes":null,"task_refs":["TASK-013","TASK-014"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["INV-005","INV-009","R-010","AC-011","AC-012"],"id":"D-024","owner_repository_id":"sdcorejs-angular","question":"Cây
          route và cách hiện page/drawer?","rationale":"List giữ nguyên trạng thái sd-table vì không bị huỷ khi mở drawer; SdPermissionGuard.canActivateChild từ
          chối route không có data.permission.","revisit_condition":null,"scope":"module","selected_value":"generic/:module/:entity là trang list có
          router-outlet cho create, :id/detail, :id/update; mọi route của sdGenericRoutes() khai data.permission = SD_PERMISSION_PUBLIC để SdPermissionGuard của
          portal không chặn, guard của module generic kiểm mã thật bằng hasPermission(code) với key mặc định; host form tự chọn page hoặc drawer sau khi schema
          đã resolve; drawer gọi open() sau khi render và (sdClosed) điều hướng về route list; page thì list ẩn nội dung khi outlet kích hoạt; trang list phản
          ứng khi :module/:entity đổi vì component được dùng lại; configuration là route anh em","source":"approved-architecture","statement":"Cây route và cách
          hiện page/drawer? → generic/:module/:entity là trang list có router-outlet cho create, :id/detail, :id/update; mọi route của sdGenericRoutes() khai
          data.permission = SD_PERMISSION_PUBLIC để SdPermissionGuard của portal không chặn, guard của module generic kiểm mã thật bằng hasPermission(code) với
          key mặc định; host form tự chọn page hoặc drawer sau khi schema đã resolve; drawer gọi open() sau khi render và (sdClosed) điều hướng về route list;
          page thì list ẩn nội dung khi outlet kích hoạt; trang list phản ứng khi :module/:entity đổi vì component được dùng lại; configuration là route anh
          em","status":"approved","supersedes":null,"task_refs":["TASK-010","TASK-011"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["INV-002","INV-008","INV-014","R-014","AC-017"],"id":"D-025","owner_repository_id":"sdcorejs-angular","question":"Ai
          gọi adapter?","rationale":"Mỗi nhóm hàm của adapter có đúng một cổng để hooks, fallback, validate và cache luôn đúng ở mọi
          màn.","revisit_condition":null,"scope":"module","selected_value":"SdGenericDataService là nơi duy nhất gọi query/detail/create/update/delete/search,
          áp hooks beforeSave/afterSave, thứ tự search entity → adapter → query và giới hạn 5 request song song cho import; SdGenericSchemaService là nơi duy
          nhất gọi schema và configuration.get/set","source":"approved-architecture","statement":"Ai gọi adapter? → SdGenericDataService là nơi duy nhất gọi
          query/detail/create/update/delete/search, áp hooks beforeSave/afterSave, thứ tự search entity → adapter → query và giới hạn 5 request song song cho
          import; SdGenericSchemaService là nơi duy nhất gọi schema và
          configuration.get/set","status":"approved","supersedes":null,"task_refs":["TASK-008","TASK-009"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["INV-010","R-001"],"id":"D-026","owner_repository_id":"sdcorejs-angular","question":"Nhãn
          giao diện của module?","rationale":"Theo quy ước core.<area>.* (vd core.module.layout.*) của thư
          viện.","revisit_condition":null,"scope":"module","selected_value":"Thêm khoá core.module.generic.* vào i18n sẵn có, đủ mọi file ngôn ngữ (en, vi, ja,
          ko, zh) vì chúng có kiểu Record<keyof EN_MESSAGES>; hiển thị qua sdTranslate","source":"approved-architecture","statement":"Nhãn giao diện của module?
          → Thêm khoá core.module.generic.* vào i18n sẵn có, đủ mọi file ngôn ngữ (en, vi, ja, ko, zh) vì chúng có kiểu Record<keyof EN_MESSAGES>; hiển thị qua
          sdTranslate","status":"approved","supersedes":null,"task_refs":["TASK-001"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["INV-003","R-008","AC-008"],"id":"D-027","owner_repository_id":"sdcorejs-angular","question":"Hình
          dạng của validateSdGenericSchema?","rationale":"Thống nhất với validator public đã có; stored có thể là JSON bất kỳ đọc từ
          server/localStorage.","revisit_condition":null,"scope":"module","selected_value":"validateSdGenericSchema(stored: unknown, base: SdGenericSchema) trả
          SdGenericSchemaIssue[] { code, severity, path, message }, cùng cách với validateSdApiContract","source":"approved-architecture","statement":"Hình dạng
          của validateSdGenericSchema? → validateSdGenericSchema(stored: unknown, base: SdGenericSchema) trả SdGenericSchemaIssue[] { code, severity, path,
          message }, cùng cách với
          validateSdApiContract","status":"approved","supersedes":null,"task_refs":["TASK-005","TASK-006","TASK-007"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["INV-010","R-001","AC-024"],"id":"D-028","owner_repository_id":"sdcorejs-angular","question":"Có
          đưa modules/generic vào barrel modules không?","rationale":"Giữ quy ước barrel của thư viện; entry gốc @sdcorejs/angular cũng export
          module.","revisit_condition":null,"scope":"module","selected_value":"Có, như auth/layout/permission/keycloak/icon; build v19 kiểm không có vòng phụ
          thuộc và không trùng tên export","source":"approved-architecture","statement":"Có đưa modules/generic vào barrel modules không? → Có, như
          auth/layout/permission/keycloak/icon; build v19 kiểm không có vòng phụ thuộc và không trùng tên
          export","status":"approved","supersedes":null,"task_refs":["TASK-015"],"type":"decision"},{"blocking":false,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["INV-005","R-011"],"id":"D-029","owner_repository_id":"sdcorejs-angular","question":"Nguồn
          quyền theo key riêng cho từng module generic?","rationale":"Spec chỉ có permission: boolean; thêm option key là mở rộng public API ngoài phạm vi đã
          duyệt.","revisit_condition":"Khi một portal cần nguồn quyền SdPermissionService khác nhau (key khác nhau) cho từng module
          generic.","scope":"module","selected_value":"Hoãn; module generic gọi hasPermission(code) với key mặc định của
          portal","source":"approved-architecture","statement":"Nguồn quyền theo key riêng cho từng module generic? → Hoãn; module generic gọi
          hasPermission(code) với key mặc định của
          portal","status":"deferred","supersedes":null,"task_refs":["TASK-010"],"type":"decision"},{"blocking":true,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","R-012","R-013","R-014","R-015","R-016","R-017","R-018","R-019","R-020","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","AC-020","AC-021","AC-022","AC-023","AC-024","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009","INV-010","INV-011","INV-012","INV-013","INV-014","INV-015"],"id":"D-030","owner_repository_id":"sdcorejs-angular","question":"Ranh
          giới kiểm chứng nào áp dụng?","rationale":"Thư viện UI không sở hữu API; quyền phía server do backend của consumer kiểm
          (ST-001).","revisit_condition":null,"scope":"module","selected_value":"none","source":"approved-plan","statement":"Ranh giới kiểm chứng nào áp dụng? →
          none: thư viện chỉ ẩn UI và chặn route ở client; kiểm quyền thật thuộc backend của adapter (ST-001), nên không có bằng chứng từ chối phía server trong
          repo
          này","status":"approved","supersedes":null,"task_refs":["TASK-015","TASK-019"],"type":"decision","validation_boundary":{"kind":"none","source_refs":["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","R-012","R-013","R-014","R-015","R-016","R-017","R-018","R-019","R-020","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","AC-020","AC-021","AC-022","AC-023","AC-024","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009","INV-010","INV-011","INV-012","INV-013","INV-014","INV-015"]}},{"evidence_refs":["EVIDENCE-008","EVIDENCE-009"],"id":"INV-001","protected_refs":["R-005","AC-002","AC-003"],"statement":"Mọi
          màn (list, form, import, màn cấu hình, catalog relation) chỉ lấy adapter và cấu hình entity qua một resolver: scope gần nhất thắng, trùng cùng
          injector thì ném
          lỗi.","task_refs":["TASK-008","TASK-009"],"type":"invariant"},{"evidence_refs":["EVIDENCE-006","EVIDENCE-007","EVIDENCE-008","EVIDENCE-009"],"id":"INV-002","protected_refs":["R-006","R-007","AC-001","AC-004","AC-005","AC-006"],"statement":"Schema
          hiệu lực chỉ được dựng ở SdGenericSchemaService bằng hàm thuần: adapter.schema → entity.schema(base) → cấu hình đã lưu (validate rồi merge); chỉ
          SdGenericSchemaService gọi adapter.schema và configuration.get/set (hoặc localStorage khoá
          sd-generic:configuration:<module>.<entity>).","task_refs":["TASK-006","TASK-007","TASK-008","TASK-009"],"type":"invariant"},{"evidence_refs":["EVIDENCE-006","EVIDENCE-007","EVIDENCE-008","EVIDENCE-009","EVIDENCE-013","EVIDENCE-014"],"id":"INV-003","protected_refs":["R-008","AC-007","AC-008","AC-020"],"statement":"validateSdGenericSchema
          là hàm thuần duy nhất kiểm cấu hình; bước load và nút Lưu đều dùng nó; lỗi shape/version thì dùng mặc định, tham chiếu treo bị merge bỏ, có lỗi thì
          không gọi
          configuration.set.","task_refs":["TASK-006","TASK-007","TASK-008","TASK-009","TASK-013","TASK-014"],"type":"invariant"},{"evidence_refs":["EVIDENCE-005","EVIDENCE-015"],"id":"INV-004","protected_refs":["R-002","R-003","AC-006","AC-024"],"statement":"SdGenericSchema
          v1 chỉ chứa dữ liệu JSON (không function); function (schema, search, display, hooks, action) chỉ nằm ở provider; key, dataType, enums[].value,
          relation.entity luôn lấy từ schema hiện
          tại.","task_refs":["TASK-005","TASK-015"],"type":"invariant"},{"evidence_refs":["EVIDENCE-006","EVIDENCE-007","EVIDENCE-008","EVIDENCE-009","EVIDENCE-010","EVIDENCE-011","EVIDENCE-012"],"id":"INV-005","protected_refs":["R-011","AC-007","AC-010","AC-018"],"statement":"Mã
          quyền chỉ sinh từ một hàm thuần <MODULE>_<ENTITY>_C_GENERIC_<ACTION> viết hoa; guard route, hiển thị action và banner cấu hình lỗi đều dùng hàm đó;
          permission: false bỏ qua cả ba; mọi route của sdGenericRoutes() có data.permission = SD_PERMISSION_PUBLIC để guard của portal không chặn, còn guard
          của module generic kiểm mã
          thật.","task_refs":["TASK-006","TASK-007","TASK-008","TASK-009","TASK-010","TASK-011","TASK-012"],"type":"invariant"},{"evidence_refs":["EVIDENCE-006","EVIDENCE-007","EVIDENCE-011","EVIDENCE-012"],"id":"INV-006","protected_refs":["R-009","AC-009"],"statement":"Tiêu
          đề chỉ được parse/render bằng một hàm thuần; kết quả gắn vào DOM bằng nội suy text, không innerHTML; list.title và create.title không có
          placeholder.","task_refs":["TASK-006","TASK-007","TASK-011","TASK-012"],"type":"invariant"},{"evidence_refs":["EVIDENCE-006","EVIDENCE-007","EVIDENCE-011","EVIDENCE-012"],"id":"INV-007","protected_refs":["R-013","AC-015"],"statement":"Layout
          form của mỗi action do một hàm thuần dựng: field lấy type/label/options/validation từ general.properties; create bỏ system và không insertable; update
          bỏ system và không updatable; payload update chỉ gồm property
          updatable.","task_refs":["TASK-006","TASK-007","TASK-011","TASK-012"],"type":"invariant"},{"evidence_refs":["EVIDENCE-008","EVIDENCE-009"],"id":"INV-008","protected_refs":["R-004","R-013","R-014","AC-001","AC-016","AC-017"],"statement":"Chỉ
          SdGenericDataService gọi các hàm dữ liệu của adapter (query, detail, create, update, delete, search); mọi lần lưu đi qua beforeSave/afterSave; search
          theo thứ tự entity → adapter → query (CONTAIN để tìm, IN để lấy nhãn); giá trị relation được lưu đúng kiểu gốc; trang và component không gọi adapter
          trực
          tiếp.","task_refs":["TASK-008","TASK-009"],"type":"invariant"},{"evidence_refs":["EVIDENCE-010","EVIDENCE-011"],"id":"INV-009","protected_refs":["R-010","AC-011","AC-012"],"statement":"Kiểu
          hiển thị chỉ quyết định sau khi schema đã resolve, theo entity.display → adapter.display → 'page'; drawer render trong outlet của list, list không bị
          huỷ, back/đóng đưa về route
          list.","task_refs":["TASK-010","TASK-011"],"type":"invariant"},{"evidence_refs":["EVIDENCE-001","EVIDENCE-015","EVIDENCE-016","EVIDENCE-017","EVIDENCE-018"],"id":"INV-010","protected_refs":["R-001","AC-024"],"statement":"Entry
          point modules/generic export đúng 4 symbol runtime; không dùng HttpClient và không import package riêng của backend; chỉ import phần khác của thư viện
          qua entry point
          public.","task_refs":["TASK-001","TASK-015","TASK-016"],"type":"invariant"},{"evidence_refs":["EVIDENCE-001","EVIDENCE-002","EVIDENCE-003","EVIDENCE-004"],"id":"INV-011","protected_refs":["R-018","AC-021"],"statement":"form-generic
          chỉ thêm member time và json vào union field; type và hành vi hiện có không đổi; form-generic không import
          modules/generic.","task_refs":["TASK-001","TASK-002","TASK-003","TASK-004"],"type":"invariant"},{"evidence_refs":["EVIDENCE-004","EVIDENCE-017","EVIDENCE-018","EVIDENCE-019","EVIDENCE-020","EVIDENCE-021","EVIDENCE-022","EVIDENCE-023"],"id":"INV-012","protected_refs":["R-019","R-020","AC-022","AC-023"],"statement":"Chỉ
          sửa ở versions/v19 và showcase; v20/v21/v22 chỉ đổi qua npm run sync; check:sync xanh; CHANGELOG có mục Unreleased; guard example/registry của
          Showcase
          xanh.","task_refs":["TASK-004","TASK-015","TASK-016","TASK-017","TASK-018","TASK-019"],"type":"invariant"},{"evidence_refs":["EVIDENCE-006","EVIDENCE-007","EVIDENCE-011","EVIDENCE-012"],"id":"INV-013","protected_refs":["R-012","R-015","AC-013","AC-014","AC-018"],"statement":"List
          dùng sd-table server và chuyển PagingReq sang adapter.query; xoá có xác nhận, xoá nhiều gọi delete tuần tự, sau thay đổi thì reload; action mở rộng và
          action có sẵn đi chung một bước lọc
          quyền/visible/hiddenDefaults.","task_refs":["TASK-006","TASK-007","TASK-011","TASK-012"],"type":"invariant"},{"evidence_refs":["EVIDENCE-006","EVIDENCE-007","EVIDENCE-008","EVIDENCE-009","EVIDENCE-011","EVIDENCE-012"],"id":"INV-014","protected_refs":["R-016","AC-019"],"statement":"Import
          lập kế hoạch create/update bằng hàm thuần theo upsertKey, tra bản ghi đã có theo lô, chạy qua SdGenericDataService với tối đa 5 request song
          song.","task_refs":["TASK-006","TASK-007","TASK-008","TASK-009","TASK-011","TASK-012"],"type":"invariant"},{"evidence_refs":["EVIDENCE-013","EVIDENCE-014"],"id":"INV-015","protected_refs":["R-017","AC-005","AC-020"],"statement":"Màn
          cấu hình chỉ ghi qua SdGenericSchemaService.save (validate rồi configuration.set rồi xoá cache); key và dataType không sửa
          được.","task_refs":["TASK-013","TASK-014"],"type":"invariant"}],"revision":3,"schema_version":1}
    goals:
      - id: G-001
        statement: >-
          Portal khai adapter + sdGenericRoutes() là có CRUD (list/detail/create/update/delete) có phân quyền cho mọi entity của backend, không phụ thuộc
          backend.
        task_refs:
          - TASK-005
          - TASK-006
          - TASK-007
          - TASK-008
          - TASK-009
          - TASK-010
          - TASK-011
          - TASK-012
          - TASK-015
      - id: G-002
        statement: Cấu hình SdGenericSchema được validate, merge với schema backend và chỉnh được trên màn cấu hình; import Excel upsert qua adapter.
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-008
          - TASK-009
          - TASK-013
          - TASK-014
      - id: G-003
        statement: form-generic có field time và json; tài liệu, Showcase, CHANGELOG và bốn line Angular phản ánh thay đổi.
        task_refs:
          - TASK-001
          - TASK-002
          - TASK-003
          - TASK-004
          - TASK-016
          - TASK-017
          - TASK-018
          - TASK-019
    tasks:
      - id: TASK-001
        owner_repository_id: sdcorejs-angular
        dependencies: []
        planned_paths:
          - versions/v19/projects/sdcorejs-angular/i18n/src/en.ts
          - versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts
          - versions/v19/projects/sdcorejs-angular/i18n/src/ja.ts
          - versions/v19/projects/sdcorejs-angular/i18n/src/ko.ts
          - versions/v19/projects/sdcorejs-angular/i18n/src/zh.ts
        planned_evidence:
          - id: EVIDENCE-001
            record_refs:
              - R-001
              - R-018
              - AC-021
              - AC-024
              - D-026
              - INV-010
              - INV-011
        justification_refs:
          - R-001
          - R-018
          - D-026
        enforces_invariant_refs:
          - INV-010
          - INV-011
      - id: TASK-002
        owner_repository_id: sdcorejs-angular
        dependencies:
          - TASK-001
        planned_paths:
          - versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.spec.ts
          - versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.spec.ts
          - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.time-json.spec.ts
          - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.spec.ts
        planned_evidence:
          - id: EVIDENCE-002
            record_refs:
              - R-018
              - AC-021
              - D-008
              - INV-011
        justification_refs:
          - R-018
          - D-008
          - D-017
        enforces_invariant_refs:
          - INV-011
      - id: TASK-003
        owner_repository_id: sdcorejs-angular
        dependencies:
          - TASK-002
        planned_paths:
          - versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-field.model.ts
          - versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.ts
          - versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.ts
          - versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.ts
          - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.html
          - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/index.ts
          - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.ts
          - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/field-preview.component.html
          - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.ts
          - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.html
          - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.ts
          - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.html
          - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.scss
          - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.ts
          - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.html
          - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.scss
        planned_evidence:
          - id: EVIDENCE-003
            record_refs:
              - R-018
              - AC-021
              - D-008
              - INV-011
        justification_refs:
          - R-018
          - D-008
        enforces_invariant_refs:
          - INV-011
      - id: TASK-004
        owner_repository_id: sdcorejs-angular
        dependencies:
          - TASK-003
        planned_paths:
          - versions/v19/projects/sdcorejs-angular/components/form-generic/sd-form-generic.md
        planned_evidence:
          - id: EVIDENCE-004
            record_refs:
              - R-018
              - R-019
              - AC-021
              - AC-022
              - D-008
              - INV-011
              - INV-012
        justification_refs:
          - R-018
          - R-019
          - D-008
        enforces_invariant_refs:
          - INV-011
          - INV-012
      - id: TASK-005
        owner_repository_id: sdcorejs-angular
        dependencies:
          - TASK-004
        planned_paths:
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/models/index.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/models/generic-schema.model.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/models/generic-adapter.model.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/models/generic-entity.model.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/models/generic-issue.model.ts
        planned_evidence:
          - id: EVIDENCE-005
            record_refs:
              - R-002
              - R-003
              - R-004
              - AC-006
              - AC-024
              - D-002
              - D-003
              - D-009
              - INV-004
        justification_refs:
          - R-002
          - R-003
          - R-004
          - D-002
          - D-003
          - D-009
          - D-011
          - D-019
          - D-027
        enforces_invariant_refs:
          - INV-004
      - id: TASK-006
        owner_repository_id: sdcorejs-angular
        dependencies:
          - TASK-005
        planned_paths:
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.spec.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-title.spec.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.spec.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.spec.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.spec.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-form.spec.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.spec.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-search.spec.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-import.spec.ts
        planned_evidence:
          - id: EVIDENCE-006
            record_refs:
              - R-006
              - R-007
              - R-008
              - R-009
              - R-011
              - R-012
              - R-013
              - R-016
              - AC-006
              - AC-008
              - AC-009
              - AC-010
              - AC-013
              - AC-015
              - AC-016
              - AC-019
              - D-013
              - D-014
              - D-015
              - D-016
              - INV-002
              - INV-003
              - INV-005
              - INV-006
              - INV-007
              - INV-013
              - INV-014
        justification_refs:
          - R-006
          - R-007
          - R-008
          - R-009
          - R-011
          - R-012
          - R-013
          - R-016
          - D-013
          - D-014
          - D-015
          - D-016
          - D-017
          - D-027
        enforces_invariant_refs:
          - INV-002
          - INV-003
          - INV-005
          - INV-006
          - INV-007
          - INV-013
          - INV-014
      - id: TASK-007
        owner_repository_id: sdcorejs-angular
        dependencies:
          - TASK-006
        planned_paths:
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-title.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-form.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-search.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-import.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/index.ts
        planned_evidence:
          - id: EVIDENCE-007
            record_refs:
              - R-006
              - R-007
              - R-008
              - R-009
              - R-011
              - R-012
              - R-013
              - R-016
              - AC-006
              - AC-008
              - AC-009
              - AC-010
              - AC-013
              - AC-015
              - AC-016
              - AC-019
              - D-013
              - D-014
              - D-015
              - D-016
              - INV-002
              - INV-003
              - INV-005
              - INV-006
              - INV-007
              - INV-013
              - INV-014
        justification_refs:
          - R-006
          - R-007
          - R-008
          - R-009
          - R-011
          - R-012
          - R-013
          - R-016
          - D-002
          - D-009
          - D-013
          - D-014
          - D-015
          - D-016
          - D-019
          - D-027
        enforces_invariant_refs:
          - INV-002
          - INV-003
          - INV-005
          - INV-006
          - INV-007
          - INV-013
          - INV-014
      - id: TASK-008
        owner_repository_id: sdcorejs-angular
        dependencies:
          - TASK-007
        planned_paths:
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.spec.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.spec.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.spec.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.spec.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.spec.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.spec.ts
        planned_evidence:
          - id: EVIDENCE-008
            record_refs:
              - R-004
              - R-005
              - R-006
              - R-008
              - R-011
              - R-013
              - R-014
              - R-016
              - AC-001
              - AC-002
              - AC-003
              - AC-004
              - AC-005
              - AC-007
              - AC-016
              - AC-017
              - AC-019
              - D-007
              - D-020
              - D-021
              - D-022
              - D-025
              - INV-001
              - INV-002
              - INV-003
              - INV-005
              - INV-008
              - INV-014
        justification_refs:
          - R-004
          - R-005
          - R-006
          - R-008
          - R-011
          - R-013
          - R-014
          - R-016
          - D-007
          - D-010
          - D-011
          - D-012
          - D-016
          - D-017
          - D-020
          - D-021
          - D-022
          - D-025
        enforces_invariant_refs:
          - INV-001
          - INV-002
          - INV-003
          - INV-005
          - INV-008
          - INV-014
      - id: TASK-009
        owner_repository_id: sdcorejs-angular
        dependencies:
          - TASK-008
        planned_paths:
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/registry/provide-sd-generic.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/registry/index.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-configuration-store.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/services/index.ts
        planned_evidence:
          - id: EVIDENCE-009
            record_refs:
              - R-004
              - R-005
              - R-006
              - R-008
              - R-011
              - R-013
              - R-014
              - R-016
              - AC-001
              - AC-002
              - AC-003
              - AC-004
              - AC-005
              - AC-007
              - AC-016
              - AC-017
              - AC-019
              - D-007
              - D-020
              - D-021
              - D-022
              - D-025
              - INV-001
              - INV-002
              - INV-003
              - INV-005
              - INV-008
              - INV-014
        justification_refs:
          - R-004
          - R-005
          - R-006
          - R-008
          - R-011
          - R-013
          - R-014
          - R-016
          - D-007
          - D-010
          - D-011
          - D-012
          - D-016
          - D-020
          - D-021
          - D-022
          - D-025
        enforces_invariant_refs:
          - INV-001
          - INV-002
          - INV-003
          - INV-005
          - INV-008
          - INV-014
      - id: TASK-010
        owner_repository_id: sdcorejs-angular
        dependencies:
          - TASK-009
        planned_paths:
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.spec.ts
        planned_evidence:
          - id: EVIDENCE-010
            record_refs:
              - R-010
              - R-011
              - AC-010
              - AC-011
              - AC-012
              - D-004
              - D-005
              - D-024
              - INV-005
              - INV-009
        justification_refs:
          - R-010
          - R-011
          - D-004
          - D-005
          - D-015
          - D-024
          - D-029
        enforces_invariant_refs:
          - INV-005
          - INV-009
      - id: TASK-011
        owner_repository_id: sdcorejs-angular
        dependencies:
          - TASK-010
        planned_paths:
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/routes/generic-route.guards.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/routes/index.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.html
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.scss
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.html
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.scss
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.html
        planned_evidence:
          - id: EVIDENCE-011
            record_refs:
              - R-009
              - R-010
              - R-011
              - R-012
              - R-013
              - R-015
              - R-016
              - AC-001
              - AC-007
              - AC-009
              - AC-010
              - AC-011
              - AC-012
              - AC-013
              - AC-014
              - AC-015
              - AC-018
              - AC-019
              - D-004
              - D-005
              - D-006
              - D-024
              - INV-005
              - INV-006
              - INV-007
              - INV-009
              - INV-013
              - INV-014
        justification_refs:
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-015
          - R-016
          - D-002
          - D-004
          - D-005
          - D-006
          - D-024
        enforces_invariant_refs:
          - INV-005
          - INV-006
          - INV-007
          - INV-009
          - INV-013
          - INV-014
      - id: TASK-012
        owner_repository_id: sdcorejs-angular
        dependencies:
          - TASK-011
        planned_paths:
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.spec.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.spec.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.spec.ts
        planned_evidence:
          - id: EVIDENCE-012
            record_refs:
              - R-009
              - R-012
              - R-013
              - R-015
              - R-016
              - AC-001
              - AC-007
              - AC-009
              - AC-013
              - AC-014
              - AC-015
              - AC-018
              - AC-019
              - D-006
              - INV-005
              - INV-006
              - INV-007
              - INV-013
              - INV-014
        justification_refs:
          - R-009
          - R-012
          - R-013
          - R-015
          - R-016
          - D-006
          - D-017
        enforces_invariant_refs:
          - INV-005
          - INV-006
          - INV-007
          - INV-013
          - INV-014
      - id: TASK-013
        owner_repository_id: sdcorejs-angular
        dependencies:
          - TASK-012
        planned_paths:
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.html
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.scss
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.html
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.html
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.html
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.html
        planned_evidence:
          - id: EVIDENCE-013
            record_refs:
              - R-008
              - R-017
              - AC-005
              - AC-020
              - D-012
              - D-013
              - D-023
              - INV-003
              - INV-015
        justification_refs:
          - R-008
          - R-017
          - D-012
          - D-013
          - D-023
        enforces_invariant_refs:
          - INV-003
          - INV-015
      - id: TASK-014
        owner_repository_id: sdcorejs-angular
        dependencies:
          - TASK-013
        planned_paths:
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.spec.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.spec.ts
        planned_evidence:
          - id: EVIDENCE-014
            record_refs:
              - R-008
              - R-017
              - AC-005
              - AC-020
              - D-023
              - INV-003
              - INV-015
        justification_refs:
          - R-008
          - R-017
          - D-017
          - D-023
        enforces_invariant_refs:
          - INV-003
          - INV-015
      - id: TASK-015
        owner_repository_id: sdcorejs-angular
        dependencies:
          - TASK-014
        planned_paths:
          - versions/v19/projects/sdcorejs-angular/modules/index.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/ng-package.json
          - versions/v19/projects/sdcorejs-angular/modules/generic/index.ts
          - versions/v19/projects/sdcorejs-angular/modules/generic/src/public-api.spec.ts
        planned_evidence:
          - id: EVIDENCE-015
            record_refs:
              - R-001
              - R-002
              - R-003
              - AC-024
              - D-001
              - D-028
              - INV-004
              - INV-010
          - id: EVIDENCE-016
            record_refs:
              - R-001
              - AC-024
              - D-001
              - INV-010
          - id: EVIDENCE-017
            record_refs:
              - R-001
              - R-020
              - AC-023
              - AC-024
              - D-028
              - INV-010
              - INV-012
        justification_refs:
          - R-001
          - R-002
          - R-003
          - R-020
          - D-001
          - D-019
          - D-028
          - D-030
        enforces_invariant_refs:
          - INV-004
          - INV-010
          - INV-012
      - id: TASK-016
        owner_repository_id: sdcorejs-angular
        dependencies:
          - TASK-015
        planned_paths:
          - versions/v19/projects/sdcorejs-angular/modules/generic/sd-generic.md
        planned_evidence:
          - id: EVIDENCE-018
            record_refs:
              - R-001
              - R-019
              - AC-022
              - AC-024
              - D-001
              - INV-010
              - INV-012
        justification_refs:
          - R-001
          - R-019
          - D-001
        enforces_invariant_refs:
          - INV-010
          - INV-012
      - id: TASK-017
        owner_repository_id: sdcorejs-angular
        dependencies:
          - TASK-016
        planned_paths:
          - showcase/src/app/app.routes.ts
          - showcase/src/app/app.routes.spec.ts
          - showcase/src/app/docs/core/documentation.registry.ts
          - showcase/src/app/docs/core/documentation.registry.spec.ts
          - showcase/src/app/docs/generated/example-sources.generated.ts
          - showcase/src/app/docs/generated/example-manifest.generated.ts
          - showcase/src/app/pages/modules/generic/generic-demo.component.ts
          - showcase/src/app/pages/modules/generic/generic-demo.mock-adapter.ts
          - showcase/src/app/pages/modules/generic/generic-demo.component.spec.ts
        planned_evidence:
          - id: EVIDENCE-019
            record_refs:
              - R-019
              - AC-022
              - D-006
              - INV-012
          - id: EVIDENCE-020
            record_refs:
              - R-019
              - AC-022
              - INV-012
        justification_refs:
          - R-019
          - D-006
        enforces_invariant_refs:
          - INV-012
      - id: TASK-018
        owner_repository_id: sdcorejs-angular
        dependencies:
          - TASK-017
        planned_paths:
          - CHANGELOG.md
        planned_evidence:
          - id: EVIDENCE-021
            record_refs:
              - R-020
              - AC-023
              - D-018
              - INV-012
        justification_refs:
          - R-020
          - D-018
        enforces_invariant_refs:
          - INV-012
      - id: TASK-019
        owner_repository_id: sdcorejs-angular
        dependencies:
          - TASK-018
        planned_paths:
          - versions/v20/projects/sdcorejs-angular/i18n/src/en.ts
          - versions/v20/projects/sdcorejs-angular/i18n/src/vi.ts
          - versions/v20/projects/sdcorejs-angular/i18n/src/ja.ts
          - versions/v20/projects/sdcorejs-angular/i18n/src/ko.ts
          - versions/v20/projects/sdcorejs-angular/i18n/src/zh.ts
          - versions/v20/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.spec.ts
          - versions/v20/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.spec.ts
          - versions/v20/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-field.model.ts
          - versions/v20/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.ts
          - versions/v20/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.ts
          - versions/v20/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.ts
          - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.html
          - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/index.ts
          - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.ts
          - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/field-preview.component.html
          - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.ts
          - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.html
          - versions/v20/projects/sdcorejs-angular/components/form-generic/sd-form-generic.md
          - versions/v20/projects/sdcorejs-angular/modules/index.ts
          - versions/v21/projects/sdcorejs-angular/i18n/src/en.ts
          - versions/v21/projects/sdcorejs-angular/i18n/src/vi.ts
          - versions/v21/projects/sdcorejs-angular/i18n/src/ja.ts
          - versions/v21/projects/sdcorejs-angular/i18n/src/ko.ts
          - versions/v21/projects/sdcorejs-angular/i18n/src/zh.ts
          - versions/v21/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.spec.ts
          - versions/v21/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.spec.ts
          - versions/v21/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-field.model.ts
          - versions/v21/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.ts
          - versions/v21/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.ts
          - versions/v21/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.ts
          - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.html
          - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/index.ts
          - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.ts
          - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/field-preview.component.html
          - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.ts
          - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.html
          - versions/v21/projects/sdcorejs-angular/components/form-generic/sd-form-generic.md
          - versions/v21/projects/sdcorejs-angular/modules/index.ts
          - versions/v22/projects/sdcorejs-angular/i18n/src/en.ts
          - versions/v22/projects/sdcorejs-angular/i18n/src/vi.ts
          - versions/v22/projects/sdcorejs-angular/i18n/src/ja.ts
          - versions/v22/projects/sdcorejs-angular/i18n/src/ko.ts
          - versions/v22/projects/sdcorejs-angular/i18n/src/zh.ts
          - versions/v22/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.spec.ts
          - versions/v22/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.spec.ts
          - versions/v22/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-field.model.ts
          - versions/v22/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.ts
          - versions/v22/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.ts
          - versions/v22/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.ts
          - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.html
          - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/index.ts
          - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.ts
          - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/field-preview.component.html
          - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.ts
          - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.html
          - versions/v22/projects/sdcorejs-angular/components/form-generic/sd-form-generic.md
          - versions/v22/projects/sdcorejs-angular/modules/index.ts
          - versions/v19/SYNC-STATUS.md
          - versions/v20/SYNC-STATUS.md
          - versions/v21/SYNC-STATUS.md
          - versions/v22/SYNC-STATUS.md
          - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.time-json.spec.ts
          - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.spec.ts
          - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.ts
          - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.html
          - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.scss
          - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.ts
          - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.html
          - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.scss
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/models/index.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/models/generic-schema.model.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/models/generic-adapter.model.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/models/generic-entity.model.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/models/generic-issue.model.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.spec.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-title.spec.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.spec.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.spec.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.spec.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-form.spec.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.spec.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-search.spec.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-import.spec.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-title.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-form.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-search.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-import.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/index.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.spec.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.spec.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.spec.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.spec.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.spec.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.spec.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/registry/provide-sd-generic.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/registry/index.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-configuration-store.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/index.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.spec.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/routes/generic-route.guards.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/routes/index.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.html
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.scss
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.html
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.scss
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.html
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.spec.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.spec.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.spec.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.html
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.scss
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.html
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.html
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.html
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.html
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.spec.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.spec.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/ng-package.json
          - versions/v20/projects/sdcorejs-angular/modules/generic/index.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/src/public-api.spec.ts
          - versions/v20/projects/sdcorejs-angular/modules/generic/sd-generic.md
          - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.time-json.spec.ts
          - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.spec.ts
          - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.ts
          - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.html
          - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.scss
          - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.ts
          - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.html
          - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.scss
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/models/index.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/models/generic-schema.model.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/models/generic-adapter.model.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/models/generic-entity.model.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/models/generic-issue.model.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.spec.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-title.spec.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.spec.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.spec.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.spec.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-form.spec.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.spec.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-search.spec.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-import.spec.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-title.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-form.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-search.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-import.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/index.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.spec.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.spec.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.spec.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.spec.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.spec.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.spec.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/registry/provide-sd-generic.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/registry/index.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-configuration-store.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/index.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.spec.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/routes/generic-route.guards.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/routes/index.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.html
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.scss
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.html
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.scss
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.html
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.spec.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.spec.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.spec.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.html
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.scss
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.html
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.html
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.html
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.html
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.spec.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.spec.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/ng-package.json
          - versions/v21/projects/sdcorejs-angular/modules/generic/index.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/src/public-api.spec.ts
          - versions/v21/projects/sdcorejs-angular/modules/generic/sd-generic.md
          - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.time-json.spec.ts
          - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.spec.ts
          - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.ts
          - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.html
          - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.scss
          - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.ts
          - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.html
          - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.scss
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/models/index.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/models/generic-schema.model.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/models/generic-adapter.model.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/models/generic-entity.model.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/models/generic-issue.model.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.spec.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-title.spec.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.spec.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.spec.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.spec.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-form.spec.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.spec.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-search.spec.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-import.spec.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-title.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-form.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-search.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-import.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/index.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.spec.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.spec.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.spec.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.spec.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.spec.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.spec.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/registry/provide-sd-generic.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/registry/index.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-configuration-store.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/index.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.spec.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/routes/generic-route.guards.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/routes/index.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.html
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.scss
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.html
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.scss
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.html
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.spec.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.spec.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.spec.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.html
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.scss
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.html
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.html
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.html
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.html
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.spec.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.spec.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/ng-package.json
          - versions/v22/projects/sdcorejs-angular/modules/generic/index.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/src/public-api.spec.ts
          - versions/v22/projects/sdcorejs-angular/modules/generic/sd-generic.md
        planned_evidence:
          - id: EVIDENCE-022
            record_refs:
              - R-020
              - AC-023
              - D-018
              - INV-012
          - id: EVIDENCE-023
            record_refs:
              - R-020
              - AC-023
              - D-018
              - INV-012
        justification_refs:
          - R-020
          - D-018
          - D-030
        enforces_invariant_refs:
          - INV-012
    repository_inventory:
      repositories:
        - repository_id: sdcorejs-angular
          existing_paths:
            - versions/v19/projects/sdcorejs-angular/i18n/src/en.ts
            - versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts
            - versions/v19/projects/sdcorejs-angular/i18n/src/ja.ts
            - versions/v19/projects/sdcorejs-angular/i18n/src/ko.ts
            - versions/v19/projects/sdcorejs-angular/i18n/src/zh.ts
            - versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.spec.ts
            - versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.spec.ts
            - versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-field.model.ts
            - versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.ts
            - versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.ts
            - versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.ts
            - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.html
            - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/index.ts
            - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.ts
            - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/field-preview.component.html
            - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.ts
            - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.html
            - versions/v19/projects/sdcorejs-angular/components/form-generic/sd-form-generic.md
            - versions/v19/projects/sdcorejs-angular/modules/index.ts
            - showcase/src/app/app.routes.ts
            - showcase/src/app/app.routes.spec.ts
            - showcase/src/app/docs/core/documentation.registry.ts
            - showcase/src/app/docs/core/documentation.registry.spec.ts
            - showcase/src/app/docs/generated/example-sources.generated.ts
            - showcase/src/app/docs/generated/example-manifest.generated.ts
            - CHANGELOG.md
            - versions/v20/projects/sdcorejs-angular/i18n/src/en.ts
            - versions/v20/projects/sdcorejs-angular/i18n/src/vi.ts
            - versions/v20/projects/sdcorejs-angular/i18n/src/ja.ts
            - versions/v20/projects/sdcorejs-angular/i18n/src/ko.ts
            - versions/v20/projects/sdcorejs-angular/i18n/src/zh.ts
            - versions/v20/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.spec.ts
            - versions/v20/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.spec.ts
            - versions/v20/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-field.model.ts
            - versions/v20/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.ts
            - versions/v20/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.ts
            - versions/v20/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.ts
            - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.html
            - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/index.ts
            - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.ts
            - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/field-preview.component.html
            - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.ts
            - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.html
            - versions/v20/projects/sdcorejs-angular/components/form-generic/sd-form-generic.md
            - versions/v20/projects/sdcorejs-angular/modules/index.ts
            - versions/v21/projects/sdcorejs-angular/i18n/src/en.ts
            - versions/v21/projects/sdcorejs-angular/i18n/src/vi.ts
            - versions/v21/projects/sdcorejs-angular/i18n/src/ja.ts
            - versions/v21/projects/sdcorejs-angular/i18n/src/ko.ts
            - versions/v21/projects/sdcorejs-angular/i18n/src/zh.ts
            - versions/v21/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.spec.ts
            - versions/v21/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.spec.ts
            - versions/v21/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-field.model.ts
            - versions/v21/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.ts
            - versions/v21/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.ts
            - versions/v21/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.ts
            - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.html
            - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/index.ts
            - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.ts
            - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/field-preview.component.html
            - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.ts
            - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.html
            - versions/v21/projects/sdcorejs-angular/components/form-generic/sd-form-generic.md
            - versions/v21/projects/sdcorejs-angular/modules/index.ts
            - versions/v22/projects/sdcorejs-angular/i18n/src/en.ts
            - versions/v22/projects/sdcorejs-angular/i18n/src/vi.ts
            - versions/v22/projects/sdcorejs-angular/i18n/src/ja.ts
            - versions/v22/projects/sdcorejs-angular/i18n/src/ko.ts
            - versions/v22/projects/sdcorejs-angular/i18n/src/zh.ts
            - versions/v22/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.spec.ts
            - versions/v22/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.spec.ts
            - versions/v22/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-field.model.ts
            - versions/v22/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.ts
            - versions/v22/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.ts
            - versions/v22/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.ts
            - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.html
            - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/index.ts
            - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.ts
            - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/field-preview.component.html
            - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.ts
            - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.html
            - versions/v22/projects/sdcorejs-angular/components/form-generic/sd-form-generic.md
            - versions/v22/projects/sdcorejs-angular/modules/index.ts
            - versions/v19/SYNC-STATUS.md
            - versions/v20/SYNC-STATUS.md
            - versions/v21/SYNC-STATUS.md
            - versions/v22/SYNC-STATUS.md
          intended_new_paths:
            - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.time-json.spec.ts
              owner_task_id: TASK-002
            - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.spec.ts
              owner_task_id: TASK-002
            - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.ts
              owner_task_id: TASK-003
            - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.html
              owner_task_id: TASK-003
            - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.scss
              owner_task_id: TASK-003
            - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.ts
              owner_task_id: TASK-003
            - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.html
              owner_task_id: TASK-003
            - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.scss
              owner_task_id: TASK-003
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/models/index.ts
              owner_task_id: TASK-005
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/models/generic-schema.model.ts
              owner_task_id: TASK-005
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/models/generic-adapter.model.ts
              owner_task_id: TASK-005
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/models/generic-entity.model.ts
              owner_task_id: TASK-005
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/models/generic-issue.model.ts
              owner_task_id: TASK-005
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.spec.ts
              owner_task_id: TASK-006
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-title.spec.ts
              owner_task_id: TASK-006
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.spec.ts
              owner_task_id: TASK-006
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.spec.ts
              owner_task_id: TASK-006
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.spec.ts
              owner_task_id: TASK-006
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-form.spec.ts
              owner_task_id: TASK-006
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.spec.ts
              owner_task_id: TASK-006
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-search.spec.ts
              owner_task_id: TASK-006
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-import.spec.ts
              owner_task_id: TASK-006
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.ts
              owner_task_id: TASK-007
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-title.ts
              owner_task_id: TASK-007
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.ts
              owner_task_id: TASK-007
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.ts
              owner_task_id: TASK-007
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.ts
              owner_task_id: TASK-007
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-form.ts
              owner_task_id: TASK-007
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.ts
              owner_task_id: TASK-007
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-search.ts
              owner_task_id: TASK-007
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-import.ts
              owner_task_id: TASK-007
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/index.ts
              owner_task_id: TASK-007
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.spec.ts
              owner_task_id: TASK-008
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.spec.ts
              owner_task_id: TASK-008
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.spec.ts
              owner_task_id: TASK-008
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.spec.ts
              owner_task_id: TASK-008
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.spec.ts
              owner_task_id: TASK-008
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.spec.ts
              owner_task_id: TASK-008
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.ts
              owner_task_id: TASK-009
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/registry/provide-sd-generic.ts
              owner_task_id: TASK-009
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/registry/index.ts
              owner_task_id: TASK-009
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.ts
              owner_task_id: TASK-009
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-configuration-store.ts
              owner_task_id: TASK-009
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.ts
              owner_task_id: TASK-009
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.ts
              owner_task_id: TASK-009
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.ts
              owner_task_id: TASK-009
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.ts
              owner_task_id: TASK-009
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/services/index.ts
              owner_task_id: TASK-009
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.spec.ts
              owner_task_id: TASK-010
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.ts
              owner_task_id: TASK-011
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/routes/generic-route.guards.ts
              owner_task_id: TASK-011
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/routes/index.ts
              owner_task_id: TASK-011
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.ts
              owner_task_id: TASK-011
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.html
              owner_task_id: TASK-011
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.scss
              owner_task_id: TASK-011
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.ts
              owner_task_id: TASK-011
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.html
              owner_task_id: TASK-011
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.scss
              owner_task_id: TASK-011
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.ts
              owner_task_id: TASK-011
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.html
              owner_task_id: TASK-011
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.spec.ts
              owner_task_id: TASK-012
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.spec.ts
              owner_task_id: TASK-012
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.spec.ts
              owner_task_id: TASK-012
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.ts
              owner_task_id: TASK-013
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.html
              owner_task_id: TASK-013
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.scss
              owner_task_id: TASK-013
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.ts
              owner_task_id: TASK-013
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.html
              owner_task_id: TASK-013
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.ts
              owner_task_id: TASK-013
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.html
              owner_task_id: TASK-013
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.ts
              owner_task_id: TASK-013
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.html
              owner_task_id: TASK-013
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.ts
              owner_task_id: TASK-013
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.html
              owner_task_id: TASK-013
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.spec.ts
              owner_task_id: TASK-014
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.spec.ts
              owner_task_id: TASK-014
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/ng-package.json
              owner_task_id: TASK-015
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/index.ts
              owner_task_id: TASK-015
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/public-api.spec.ts
              owner_task_id: TASK-015
            - path: versions/v19/projects/sdcorejs-angular/modules/generic/sd-generic.md
              owner_task_id: TASK-016
            - path: showcase/src/app/pages/modules/generic/generic-demo.component.ts
              owner_task_id: TASK-017
            - path: showcase/src/app/pages/modules/generic/generic-demo.mock-adapter.ts
              owner_task_id: TASK-017
            - path: showcase/src/app/pages/modules/generic/generic-demo.component.spec.ts
              owner_task_id: TASK-017
            - path: versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.time-json.spec.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.spec.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.html
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.scss
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.html
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.scss
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/models/index.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/models/generic-schema.model.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/models/generic-adapter.model.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/models/generic-entity.model.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/models/generic-issue.model.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.spec.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-title.spec.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.spec.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.spec.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.spec.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-form.spec.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.spec.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-search.spec.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-import.spec.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-title.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-form.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-search.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-import.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/core/index.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.spec.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.spec.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.spec.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.spec.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.spec.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.spec.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/registry/provide-sd-generic.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/registry/index.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-configuration-store.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/services/index.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.spec.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/routes/generic-route.guards.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/routes/index.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.html
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.scss
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.html
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.scss
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.html
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.spec.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.spec.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.spec.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.html
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.scss
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.html
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.html
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.html
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.html
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.spec.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.spec.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/ng-package.json
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/index.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/src/public-api.spec.ts
              owner_task_id: TASK-019
            - path: versions/v20/projects/sdcorejs-angular/modules/generic/sd-generic.md
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.time-json.spec.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.spec.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.html
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.scss
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.html
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.scss
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/models/index.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/models/generic-schema.model.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/models/generic-adapter.model.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/models/generic-entity.model.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/models/generic-issue.model.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.spec.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-title.spec.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.spec.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.spec.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.spec.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-form.spec.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.spec.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-search.spec.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-import.spec.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-title.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-form.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-search.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-import.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/core/index.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.spec.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.spec.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.spec.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.spec.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.spec.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.spec.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/registry/provide-sd-generic.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/registry/index.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-configuration-store.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/services/index.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.spec.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/routes/generic-route.guards.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/routes/index.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.html
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.scss
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.html
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.scss
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.html
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.spec.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.spec.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.spec.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.html
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.scss
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.html
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.html
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.html
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.html
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.spec.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.spec.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/ng-package.json
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/index.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/src/public-api.spec.ts
              owner_task_id: TASK-019
            - path: versions/v21/projects/sdcorejs-angular/modules/generic/sd-generic.md
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.time-json.spec.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.spec.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.html
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.scss
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.html
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.scss
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/models/index.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/models/generic-schema.model.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/models/generic-adapter.model.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/models/generic-entity.model.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/models/generic-issue.model.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.spec.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-title.spec.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.spec.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.spec.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.spec.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-form.spec.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.spec.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-search.spec.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-import.spec.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-title.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-form.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-search.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-import.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/core/index.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.spec.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.spec.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.spec.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.spec.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.spec.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.spec.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/registry/provide-sd-generic.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/registry/index.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-configuration-store.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/services/index.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.spec.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/routes/generic-route.guards.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/routes/index.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.html
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.scss
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.html
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.scss
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.html
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.spec.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.spec.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.spec.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.html
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.scss
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.html
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.html
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.html
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.html
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.spec.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.spec.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/ng-package.json
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/index.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/src/public-api.spec.ts
              owner_task_id: TASK-019
            - path: versions/v22/projects/sdcorejs-angular/modules/generic/sd-generic.md
              owner_task_id: TASK-019
    critique_history:
      - round: 1
        checker_version: sdcorejs-plan:goal-backward:v1
        blockers: []
        resolved_blockers: []
        unresolved_blockers: []
  validation_map:
    - requirement_id: R-004
      acceptance_criterion_id: AC-001
      invariant_refs:
        - INV-002
        - INV-008
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - component
      case_ids:
        - case-generic-ac-001-r-004
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: Màn list hiện các cột sinh từ properties (trừ json/file), dữ liệu lấy qua adapter.query với PagingReq pageSize 20
      status: covered
      evidence_refs:
        - EVIDENCE-006
        - EVIDENCE-007
        - EVIDENCE-008
        - EVIDENCE-009
        - EVIDENCE-011
        - EVIDENCE-012
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-006
      acceptance_criterion_id: AC-001
      invariant_refs:
        - INV-002
        - INV-008
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - component
      case_ids:
        - case-generic-ac-001-r-006
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: Màn list hiện các cột sinh từ properties (trừ json/file), dữ liệu lấy qua adapter.query với PagingReq pageSize 20
      status: covered
      evidence_refs:
        - EVIDENCE-006
        - EVIDENCE-007
        - EVIDENCE-008
        - EVIDENCE-009
        - EVIDENCE-011
        - EVIDENCE-012
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-012
      acceptance_criterion_id: AC-001
      invariant_refs:
        - INV-002
        - INV-008
        - INV-013
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - component
      case_ids:
        - case-generic-ac-001-r-012
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: Màn list hiện các cột sinh từ properties (trừ json/file), dữ liệu lấy qua adapter.query với PagingReq pageSize 20
      status: covered
      evidence_refs:
        - EVIDENCE-006
        - EVIDENCE-007
        - EVIDENCE-008
        - EVIDENCE-009
        - EVIDENCE-011
        - EVIDENCE-012
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-005
      acceptance_criterion_id: AC-002
      invariant_refs:
        - INV-001
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - integration
      case_ids:
        - case-generic-ac-002-r-005
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: Lib dùng adapter khai ở lazy route; trang ngoài lazy route dùng adapter root
      status: covered
      evidence_refs:
        - EVIDENCE-008
        - EVIDENCE-009
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-005
      acceptance_criterion_id: AC-003
      invariant_refs:
        - INV-001
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - integration
      case_ids:
        - case-generic-ac-003-r-005
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: Khởi tạo injector ném lỗi nêu tên module bị trùng
      status: covered
      evidence_refs:
        - EVIDENCE-008
        - EVIDENCE-009
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-006
      acceptance_criterion_id: AC-004
      invariant_refs:
        - INV-002
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - unit
      case_ids:
        - case-generic-ac-004-r-006
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: Schema hiệu lực có cả hai thay đổi; khi get trả null thì chỉ có thay đổi của provideSdGenericEntity.schema
      status: covered
      evidence_refs:
        - EVIDENCE-006
        - EVIDENCE-007
        - EVIDENCE-008
        - EVIDENCE-009
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-006
      acceptance_criterion_id: AC-005
      invariant_refs:
        - INV-002
        - INV-015
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - unit
      case_ids:
        - case-generic-ac-005-r-006
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: Cấu hình được ghi và đọc lại từ localStorage theo module và entity
      status: covered
      evidence_refs:
        - EVIDENCE-006
        - EVIDENCE-007
        - EVIDENCE-008
        - EVIDENCE-009
        - EVIDENCE-013
        - EVIDENCE-014
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-017
      acceptance_criterion_id: AC-005
      invariant_refs:
        - INV-002
        - INV-015
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - unit
      case_ids:
        - case-generic-ac-005-r-017
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: Cấu hình được ghi và đọc lại từ localStorage theo module và entity
      status: covered
      evidence_refs:
        - EVIDENCE-006
        - EVIDENCE-007
        - EVIDENCE-008
        - EVIDENCE-009
        - EVIDENCE-013
        - EVIDENCE-014
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-007
      acceptance_criterion_id: AC-006
      invariant_refs:
        - INV-002
        - INV-004
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - unit
      case_ids:
        - case-generic-ac-006-r-007
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: >-
        Cột/field treo bị bỏ, trang vẫn chạy; property mới có trong general và list.columns với visible: false, không có trong layout form đã lưu; dataType lấy
        từ schema hiện tại
      status: covered
      evidence_refs:
        - EVIDENCE-005
        - EVIDENCE-006
        - EVIDENCE-007
        - EVIDENCE-008
        - EVIDENCE-009
        - EVIDENCE-015
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-008
      acceptance_criterion_id: AC-006
      invariant_refs:
        - INV-002
        - INV-003
        - INV-004
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - unit
      case_ids:
        - case-generic-ac-006-r-008
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: >-
        Cột/field treo bị bỏ, trang vẫn chạy; property mới có trong general và list.columns với visible: false, không có trong layout form đã lưu; dataType lấy
        từ schema hiện tại
      status: covered
      evidence_refs:
        - EVIDENCE-005
        - EVIDENCE-006
        - EVIDENCE-007
        - EVIDENCE-008
        - EVIDENCE-009
        - EVIDENCE-013
        - EVIDENCE-014
        - EVIDENCE-015
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-008
      acceptance_criterion_id: AC-007
      invariant_refs:
        - INV-003
        - INV-005
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - component
      case_ids:
        - case-generic-ac-007-r-008
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: Lib dùng cấu hình mặc định, gọi console.warn, banner "cấu hình không hợp lệ" chỉ hiện với người có quyền CONFIGURATION
      status: covered
      evidence_refs:
        - EVIDENCE-006
        - EVIDENCE-007
        - EVIDENCE-008
        - EVIDENCE-009
        - EVIDENCE-010
        - EVIDENCE-011
        - EVIDENCE-012
        - EVIDENCE-013
        - EVIDENCE-014
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-011
      acceptance_criterion_id: AC-007
      invariant_refs:
        - INV-003
        - INV-005
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - component
      case_ids:
        - case-generic-ac-007-r-011
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: Lib dùng cấu hình mặc định, gọi console.warn, banner "cấu hình không hợp lệ" chỉ hiện với người có quyền CONFIGURATION
      status: covered
      evidence_refs:
        - EVIDENCE-006
        - EVIDENCE-007
        - EVIDENCE-008
        - EVIDENCE-009
        - EVIDENCE-010
        - EVIDENCE-011
        - EVIDENCE-012
        - EVIDENCE-013
        - EVIDENCE-014
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-008
      acceptance_criterion_id: AC-008
      invariant_refs:
        - INV-003
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - unit
      case_ids:
        - case-generic-ac-008-r-008
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: Trả issue với path và code tương ứng cho từng lỗi, severity error
      status: covered
      evidence_refs:
        - EVIDENCE-006
        - EVIDENCE-007
        - EVIDENCE-008
        - EVIDENCE-009
        - EVIDENCE-013
        - EVIDENCE-014
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-008
      acceptance_criterion_id: AC-009
      invariant_refs:
        - INV-003
        - INV-006
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - unit
      case_ids:
        - case-generic-ac-009-r-008
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: Cả hai title đầu bị báo lỗi template; title detail hiện chuỗi text đã thay giá trị, thẻ <b> không được render thành HTML
      status: covered
      evidence_refs:
        - EVIDENCE-006
        - EVIDENCE-007
        - EVIDENCE-008
        - EVIDENCE-009
        - EVIDENCE-011
        - EVIDENCE-012
        - EVIDENCE-013
        - EVIDENCE-014
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-009
      acceptance_criterion_id: AC-009
      invariant_refs:
        - INV-006
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - unit
      case_ids:
        - case-generic-ac-009-r-009
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: Cả hai title đầu bị báo lỗi template; title detail hiện chuỗi text đã thay giá trị, thẻ <b> không được render thành HTML
      status: covered
      evidence_refs:
        - EVIDENCE-006
        - EVIDENCE-007
        - EVIDENCE-011
        - EVIDENCE-012
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-010
      acceptance_criterion_id: AC-010
      invariant_refs:
        - INV-005
        - INV-009
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - integration
      case_ids:
        - case-generic-ac-010-r-010
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: 'Nút tạo mới bị ẩn và route create bị chặn; khi provideSdGeneric({ permission: false }) thì nút hiện và route mở được'
      status: covered
      evidence_refs:
        - EVIDENCE-006
        - EVIDENCE-007
        - EVIDENCE-008
        - EVIDENCE-009
        - EVIDENCE-010
        - EVIDENCE-011
        - EVIDENCE-012
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-011
      acceptance_criterion_id: AC-010
      invariant_refs:
        - INV-005
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - integration
      case_ids:
        - case-generic-ac-010-r-011
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: 'Nút tạo mới bị ẩn và route create bị chặn; khi provideSdGeneric({ permission: false }) thì nút hiện và route mở được'
      status: covered
      evidence_refs:
        - EVIDENCE-006
        - EVIDENCE-007
        - EVIDENCE-008
        - EVIDENCE-009
        - EVIDENCE-010
        - EVIDENCE-011
        - EVIDENCE-012
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-010
      acceptance_criterion_id: AC-011
      invariant_refs:
        - INV-009
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - integration
      case_ids:
        - case-generic-ac-011-r-010
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: Drawer mở đè lên list, URL có /1/detail; back đóng drawer, list giữ filter và trang
      status: covered
      evidence_refs:
        - EVIDENCE-010
        - EVIDENCE-011
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-010
      acceptance_criterion_id: AC-012
      invariant_refs:
        - INV-009
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - integration
      case_ids:
        - case-generic-ac-012-r-010
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: Form update hiển thị dạng trang đầy đủ (mặc định 'page'); lưu thành công thì quay về list và list reload
      status: covered
      evidence_refs:
        - EVIDENCE-010
        - EVIDENCE-011
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-012
      acceptance_criterion_id: AC-013
      invariant_refs:
        - INV-013
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - component
      case_ids:
        - case-generic-ac-013-r-012
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: Cột ẩn nhưng có trong cài đặt cột; request query mang orders và filters tương ứng
      status: covered
      evidence_refs:
        - EVIDENCE-006
        - EVIDENCE-007
        - EVIDENCE-011
        - EVIDENCE-012
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-012
      acceptance_criterion_id: AC-014
      invariant_refs:
        - INV-013
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - component
      case_ids:
        - case-generic-ac-014-r-012
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: Mỗi lần có hộp xác nhận; adapter.delete được gọi 1 lần rồi 3 lần tuần tự; list reload sau khi xoá
      status: covered
      evidence_refs:
        - EVIDENCE-006
        - EVIDENCE-007
        - EVIDENCE-011
        - EVIDENCE-012
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-013
      acceptance_criterion_id: AC-015
      invariant_refs:
        - INV-007
        - INV-008
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - unit
      case_ids:
        - case-generic-ac-015-r-013
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: >-
        Create không có system; update không có system và property không updatable, payload update không chứa chúng; detail ở chế độ viewed và có property
        system; field có label/type/options lấy từ general
      status: covered
      evidence_refs:
        - EVIDENCE-006
        - EVIDENCE-007
        - EVIDENCE-008
        - EVIDENCE-009
        - EVIDENCE-011
        - EVIDENCE-012
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-013
      acceptance_criterion_id: AC-016
      invariant_refs:
        - INV-007
        - INV-008
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - integration
      case_ids:
        - case-generic-ac-016-r-013
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: >-
        Lần lượt gọi search của entity, search của adapter, query với filter CONTAIN trên searchFields/displayField; nhãn giá trị đã chọn lấy qua IN trên
        valueField
      status: covered
      evidence_refs:
        - EVIDENCE-006
        - EVIDENCE-007
        - EVIDENCE-008
        - EVIDENCE-009
        - EVIDENCE-011
        - EVIDENCE-012
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-004
      acceptance_criterion_id: AC-016
      invariant_refs:
        - INV-008
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - integration
      case_ids:
        - case-generic-ac-016-r-004
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: >-
        Lần lượt gọi search của entity, search của adapter, query với filter CONTAIN trên searchFields/displayField; nhãn giá trị đã chọn lấy qua IN trên
        valueField
      status: covered
      evidence_refs:
        - EVIDENCE-006
        - EVIDENCE-007
        - EVIDENCE-008
        - EVIDENCE-009
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-014
      acceptance_criterion_id: AC-017
      invariant_refs:
        - INV-008
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - integration
      case_ids:
        - case-generic-ac-017-r-014
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: adapter.create/update nhận payload đã sửa; afterSave chạy đúng một lần sau khi lưu thành công và không chạy khi lưu lỗi
      status: covered
      evidence_refs:
        - EVIDENCE-008
        - EVIDENCE-009
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-015
      acceptance_criterion_id: AC-018
      invariant_refs:
        - INV-005
        - INV-013
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - component
      case_ids:
        - case-generic-ac-018-r-015
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: Command chỉ hiện khi có quyền và visible trả true, run nhận ctx có row và reload; command delete có sẵn bị ẩn
      status: covered
      evidence_refs:
        - EVIDENCE-006
        - EVIDENCE-007
        - EVIDENCE-008
        - EVIDENCE-009
        - EVIDENCE-010
        - EVIDENCE-011
        - EVIDENCE-012
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-016
      acceptance_criterion_id: AC-019
      invariant_refs:
        - INV-014
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - component
      case_ids:
        - case-generic-ac-019-r-016
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: >-
        Dòng đã tồn tại gọi update, hai dòng còn lại gọi create; enum và relation được đổi sang value/id; không quá 5 request chạy đồng thời; kết quả từng dòng
        hiện trong sd-import-excel
      status: covered
      evidence_refs:
        - EVIDENCE-006
        - EVIDENCE-007
        - EVIDENCE-008
        - EVIDENCE-009
        - EVIDENCE-011
        - EVIDENCE-012
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-017
      acceptance_criterion_id: AC-020
      invariant_refs:
        - INV-003
        - INV-015
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - component
      case_ids:
        - case-generic-ac-020-r-017
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: Lần đầu bị chặn và hiện lỗi; lần sau gọi configuration.set(entity, schema) với label mới; ô key và dataType không sửa được
      status: covered
      evidence_refs:
        - EVIDENCE-006
        - EVIDENCE-007
        - EVIDENCE-008
        - EVIDENCE-009
        - EVIDENCE-013
        - EVIDENCE-014
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-008
      acceptance_criterion_id: AC-020
      invariant_refs:
        - INV-003
        - INV-015
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - component
      case_ids:
        - case-generic-ac-020-r-008
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: Lần đầu bị chặn và hiện lỗi; lần sau gọi configuration.set(entity, schema) với label mới; ô key và dataType không sửa được
      status: covered
      evidence_refs:
        - EVIDENCE-006
        - EVIDENCE-007
        - EVIDENCE-008
        - EVIDENCE-009
        - EVIDENCE-013
        - EVIDENCE-014
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-018
      acceptance_criterion_id: AC-021
      invariant_refs:
        - INV-011
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - component
      case_ids:
        - case-generic-ac-021-r-018
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/form-generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: >-
        Hai field báo lỗi validation; giá trị đúng được lưu là chuỗi HH:mm và JSON đã parse; builder có hai loại field này trong palette; spec form-generic hiện
        có vẫn xanh
      status: covered
      evidence_refs:
        - EVIDENCE-001
        - EVIDENCE-002
        - EVIDENCE-003
        - EVIDENCE-004
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-019
      acceptance_criterion_id: AC-022
      invariant_refs:
        - INV-012
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - component
      case_ids:
        - case-generic-ac-022-r-019
      planned_command: >-
        npm --prefix showcase run link:library && npm --prefix showcase run test -- --include=src/app/pages/modules/generic/**/*.spec.ts
        --include=src/app/app.routes.spec.ts --include=src/app/docs/core/documentation.registry.spec.ts
      command_source: package.json
      cwd: .
      evidence_class: UNIT
      automation: automated
      expected_proof: Trang hiện list từ adapter mock và mở được create/detail; guard example/registry của Showcase xanh
      status: covered
      evidence_refs:
        - EVIDENCE-004
        - EVIDENCE-017
        - EVIDENCE-018
        - EVIDENCE-019
        - EVIDENCE-020
        - EVIDENCE-021
        - EVIDENCE-022
        - EVIDENCE-023
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-020
      acceptance_criterion_id: AC-023
      invariant_refs:
        - INV-012
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - unit
      case_ids:
        - case-generic-ac-023-r-020
      planned_command: npm run sync && npm run check:sync
      command_source: package.json
      cwd: .
      evidence_class: UNIT
      automation: automated
      expected_proof: check:sync xanh, bốn workspace build không lỗi; CHANGELOG có mục Unreleased cho module generic
      status: covered
      evidence_refs:
        - EVIDENCE-004
        - EVIDENCE-017
        - EVIDENCE-018
        - EVIDENCE-019
        - EVIDENCE-020
        - EVIDENCE-021
        - EVIDENCE-022
        - EVIDENCE-023
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-001
      acceptance_criterion_id: AC-024
      invariant_refs:
        - INV-004
        - INV-010
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - unit
      case_ids:
        - case-generic-ac-024-r-001
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: >-
        Entry point export đúng bốn symbol runtime provideSdGeneric, provideSdGenericEntity, sdGenericRoutes, validateSdGenericSchema; không import package
        riêng của backend nào
      status: covered
      evidence_refs:
        - EVIDENCE-001
        - EVIDENCE-005
        - EVIDENCE-015
        - EVIDENCE-016
        - EVIDENCE-017
        - EVIDENCE-018
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-002
      acceptance_criterion_id: AC-024
      invariant_refs:
        - INV-004
        - INV-010
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - unit
      case_ids:
        - case-generic-ac-024-r-002
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: >-
        Entry point export đúng bốn symbol runtime provideSdGeneric, provideSdGenericEntity, sdGenericRoutes, validateSdGenericSchema; không import package
        riêng của backend nào
      status: covered
      evidence_refs:
        - EVIDENCE-001
        - EVIDENCE-005
        - EVIDENCE-015
        - EVIDENCE-016
        - EVIDENCE-017
        - EVIDENCE-018
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
    - requirement_id: R-003
      acceptance_criterion_id: AC-024
      invariant_refs:
        - INV-004
        - INV-010
      risk: generic-crud-module
      boundary:
        kind: none
        approval_ref: D-030
        source_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - R-012
          - R-013
          - R-014
          - R-015
          - R-016
          - R-017
          - R-018
          - R-019
          - R-020
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - AC-020
          - AC-021
          - AC-022
          - AC-023
          - AC-024
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
          - INV-010
          - INV-011
          - INV-012
          - INV-013
          - INV-014
          - INV-015
      authorization_boundary: false
      levels:
        - unit
      case_ids:
        - case-generic-ac-024-r-003
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      expected_proof: >-
        Entry point export đúng bốn symbol runtime provideSdGeneric, provideSdGenericEntity, sdGenericRoutes, validateSdGenericSchema; không import package
        riêng của backend nào
      status: covered
      evidence_refs:
        - EVIDENCE-001
        - EVIDENCE-005
        - EVIDENCE-015
        - EVIDENCE-016
        - EVIDENCE-017
        - EVIDENCE-018
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
  contract_id: generic-crud-module-v1
  requirement_id: generic-crud-module-v1
  approved_spec_path: .sdcorejs/specs/angular/2026-10-13-09-59-generic-crud-module.md
  approved_spec_hash: sha256:v1:6107bece2aded5c0256881ec0c82a0c7963313b49b3a3905b53f9f03b139f2cf
  approved_spec_reference:
    immutable_identity:
      repository_id: sdcorejs-angular
      repository_relative_path: .sdcorejs/specs/angular/2026-10-13-09-59-generic-crud-module.md
      artifact_id: spec-generic-crud-module-v1-r1
      revision: 48de6f13e24a9e4bed9be3dd44f9ffaf16c0dd4a
      approval_hash: sha256:v1:6107bece2aded5c0256881ec0c82a0c7963313b49b3a3905b53f9f03b139f2cf
  approved_architecture_path: .sdcorejs/architecture/angular/2026-10-13-10-42-generic-crud-module.md
  approved_architecture_hash: sha256:v1:4f667e1902324667fcaa23af9af63914d4dfe0342faf9ed32c5a176afaedc99b
  approved_plan_path: ''
  approved_plan_hash: ''
  supersedes: null
  target_root: .
  target_root_kind: target-project
  owner_repository_id: sdcorejs-angular
  owner_repository_role: library
  owner_module_id: modules/generic
  execution_host_repository_id: sdcorejs-angular
  integration_owner_repository_id: sdcorejs-angular
  dependency_order:
    - sdcorejs-angular
  gitlink_updates_in_scope: false
  track: angular
  stack_profile: core-ui-angular
  task_count: 19
  phase_count: 8
  allowed_paths:
    - versions/v19/projects/sdcorejs-angular/i18n/src/en.ts
    - versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts
    - versions/v19/projects/sdcorejs-angular/i18n/src/ja.ts
    - versions/v19/projects/sdcorejs-angular/i18n/src/ko.ts
    - versions/v19/projects/sdcorejs-angular/i18n/src/zh.ts
    - versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.spec.ts
    - versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.spec.ts
    - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.time-json.spec.ts
    - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.spec.ts
    - versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-field.model.ts
    - versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.ts
    - versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.ts
    - versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.ts
    - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.html
    - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/index.ts
    - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.ts
    - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/field-preview.component.html
    - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.ts
    - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.html
    - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.ts
    - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.html
    - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.scss
    - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.ts
    - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.html
    - versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.scss
    - versions/v19/projects/sdcorejs-angular/components/form-generic/sd-form-generic.md
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/models/index.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/models/generic-schema.model.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/models/generic-adapter.model.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/models/generic-entity.model.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/models/generic-issue.model.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.spec.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-title.spec.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.spec.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.spec.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.spec.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-form.spec.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.spec.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-search.spec.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-import.spec.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-title.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-form.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-search.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-import.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/core/index.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.spec.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.spec.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.spec.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.spec.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.spec.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.spec.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/registry/provide-sd-generic.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/registry/index.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-configuration-store.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/services/index.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.spec.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/routes/generic-route.guards.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/routes/index.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.html
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.scss
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.html
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.scss
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.html
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.spec.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.spec.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.spec.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.html
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.scss
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.html
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.html
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.html
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.html
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.spec.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.spec.ts
    - versions/v19/projects/sdcorejs-angular/modules/index.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/ng-package.json
    - versions/v19/projects/sdcorejs-angular/modules/generic/index.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/src/public-api.spec.ts
    - versions/v19/projects/sdcorejs-angular/modules/generic/sd-generic.md
    - showcase/src/app/app.routes.ts
    - showcase/src/app/app.routes.spec.ts
    - showcase/src/app/docs/core/documentation.registry.ts
    - showcase/src/app/docs/core/documentation.registry.spec.ts
    - showcase/src/app/docs/generated/example-sources.generated.ts
    - showcase/src/app/docs/generated/example-manifest.generated.ts
    - showcase/src/app/pages/modules/generic/generic-demo.component.ts
    - showcase/src/app/pages/modules/generic/generic-demo.mock-adapter.ts
    - showcase/src/app/pages/modules/generic/generic-demo.component.spec.ts
    - CHANGELOG.md
    - versions/v20/projects/sdcorejs-angular/i18n/src/en.ts
    - versions/v20/projects/sdcorejs-angular/i18n/src/vi.ts
    - versions/v20/projects/sdcorejs-angular/i18n/src/ja.ts
    - versions/v20/projects/sdcorejs-angular/i18n/src/ko.ts
    - versions/v20/projects/sdcorejs-angular/i18n/src/zh.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.spec.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.spec.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-field.model.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.html
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/index.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/field-preview.component.html
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.html
    - versions/v20/projects/sdcorejs-angular/components/form-generic/sd-form-generic.md
    - versions/v20/projects/sdcorejs-angular/modules/index.ts
    - versions/v21/projects/sdcorejs-angular/i18n/src/en.ts
    - versions/v21/projects/sdcorejs-angular/i18n/src/vi.ts
    - versions/v21/projects/sdcorejs-angular/i18n/src/ja.ts
    - versions/v21/projects/sdcorejs-angular/i18n/src/ko.ts
    - versions/v21/projects/sdcorejs-angular/i18n/src/zh.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.spec.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.spec.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-field.model.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.html
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/index.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/field-preview.component.html
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.html
    - versions/v21/projects/sdcorejs-angular/components/form-generic/sd-form-generic.md
    - versions/v21/projects/sdcorejs-angular/modules/index.ts
    - versions/v22/projects/sdcorejs-angular/i18n/src/en.ts
    - versions/v22/projects/sdcorejs-angular/i18n/src/vi.ts
    - versions/v22/projects/sdcorejs-angular/i18n/src/ja.ts
    - versions/v22/projects/sdcorejs-angular/i18n/src/ko.ts
    - versions/v22/projects/sdcorejs-angular/i18n/src/zh.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.spec.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.spec.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-field.model.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.html
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/index.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/field-preview.component.html
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.html
    - versions/v22/projects/sdcorejs-angular/components/form-generic/sd-form-generic.md
    - versions/v22/projects/sdcorejs-angular/modules/index.ts
    - versions/v19/SYNC-STATUS.md
    - versions/v20/SYNC-STATUS.md
    - versions/v21/SYNC-STATUS.md
    - versions/v22/SYNC-STATUS.md
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.time-json.spec.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.spec.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.html
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.scss
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.html
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.scss
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/models/index.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/models/generic-schema.model.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/models/generic-adapter.model.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/models/generic-entity.model.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/models/generic-issue.model.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-title.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-form.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-search.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-import.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-title.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-form.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-search.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-import.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/index.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/registry/provide-sd-generic.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/registry/index.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-configuration-store.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/index.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/routes/generic-route.guards.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/routes/index.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.html
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.scss
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.html
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.scss
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.html
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.html
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.scss
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.html
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.html
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.html
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.html
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/ng-package.json
    - versions/v20/projects/sdcorejs-angular/modules/generic/index.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/public-api.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/sd-generic.md
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.time-json.spec.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.spec.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.html
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.scss
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.html
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.scss
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/models/index.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/models/generic-schema.model.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/models/generic-adapter.model.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/models/generic-entity.model.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/models/generic-issue.model.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-title.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-form.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-search.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-import.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-title.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-form.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-search.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-import.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/index.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/registry/provide-sd-generic.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/registry/index.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-configuration-store.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/index.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/routes/generic-route.guards.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/routes/index.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.html
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.scss
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.html
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.scss
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.html
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.html
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.scss
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.html
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.html
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.html
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.html
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/ng-package.json
    - versions/v21/projects/sdcorejs-angular/modules/generic/index.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/public-api.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/sd-generic.md
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.time-json.spec.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.spec.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.html
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.scss
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.html
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.scss
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/models/index.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/models/generic-schema.model.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/models/generic-adapter.model.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/models/generic-entity.model.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/models/generic-issue.model.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-title.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-form.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-search.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-import.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-title.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-form.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-search.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-import.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/index.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/registry/provide-sd-generic.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/registry/index.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-configuration-store.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/index.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/routes/generic-route.guards.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/routes/index.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.html
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.scss
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.html
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.scss
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.html
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.html
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.scss
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.html
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.html
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.html
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.html
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/ng-package.json
    - versions/v22/projects/sdcorejs-angular/modules/generic/index.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/public-api.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/sd-generic.md
  prohibited_paths:
    - package.json
    - package-lock.json
    - versions/*/package.json
    - versions/*/package-lock.json
    - showcase/package.json
    - showcase/package-lock.json
    - node_modules/**
    - versions/*/node_modules/**
    - showcase/node_modules/**
    - versions/*/dist/**
    - published-docs/**
    - published-pages/**
    - showcase/src/app/docs/generated/changelog.generated.ts
    - CLAUDE.md
    - AGENTS.md
    - README.md
    - README.npm.md
    - .github/**
    - scripts/**
  generated_artifacts:
    - showcase/src/app/docs/generated/example-sources.generated.ts
    - showcase/src/app/docs/generated/example-manifest.generated.ts
    - versions/v20/projects/sdcorejs-angular/i18n/src/en.ts
    - versions/v20/projects/sdcorejs-angular/i18n/src/vi.ts
    - versions/v20/projects/sdcorejs-angular/i18n/src/ja.ts
    - versions/v20/projects/sdcorejs-angular/i18n/src/ko.ts
    - versions/v20/projects/sdcorejs-angular/i18n/src/zh.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.spec.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.spec.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-field.model.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.html
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/index.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/field-preview.component.html
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.html
    - versions/v20/projects/sdcorejs-angular/components/form-generic/sd-form-generic.md
    - versions/v20/projects/sdcorejs-angular/modules/index.ts
    - versions/v21/projects/sdcorejs-angular/i18n/src/en.ts
    - versions/v21/projects/sdcorejs-angular/i18n/src/vi.ts
    - versions/v21/projects/sdcorejs-angular/i18n/src/ja.ts
    - versions/v21/projects/sdcorejs-angular/i18n/src/ko.ts
    - versions/v21/projects/sdcorejs-angular/i18n/src/zh.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.spec.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.spec.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-field.model.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.html
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/index.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/field-preview.component.html
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.html
    - versions/v21/projects/sdcorejs-angular/components/form-generic/sd-form-generic.md
    - versions/v21/projects/sdcorejs-angular/modules/index.ts
    - versions/v22/projects/sdcorejs-angular/i18n/src/en.ts
    - versions/v22/projects/sdcorejs-angular/i18n/src/vi.ts
    - versions/v22/projects/sdcorejs-angular/i18n/src/ja.ts
    - versions/v22/projects/sdcorejs-angular/i18n/src/ko.ts
    - versions/v22/projects/sdcorejs-angular/i18n/src/zh.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.spec.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.spec.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-field.model.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.html
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/index.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/field-preview.component.html
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.html
    - versions/v22/projects/sdcorejs-angular/components/form-generic/sd-form-generic.md
    - versions/v22/projects/sdcorejs-angular/modules/index.ts
    - versions/v19/SYNC-STATUS.md
    - versions/v20/SYNC-STATUS.md
    - versions/v21/SYNC-STATUS.md
    - versions/v22/SYNC-STATUS.md
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.time-json.spec.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.spec.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.html
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.scss
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.ts
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.html
    - versions/v20/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.scss
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/models/index.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/models/generic-schema.model.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/models/generic-adapter.model.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/models/generic-entity.model.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/models/generic-issue.model.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-title.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-form.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-search.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-import.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-title.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-form.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-search.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/generic-import.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/core/index.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/registry/provide-sd-generic.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/registry/index.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-configuration-store.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/services/index.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/routes/generic-route.guards.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/routes/index.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.html
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.scss
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.html
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.scss
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.html
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.html
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.scss
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.html
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.html
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.html
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.html
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/ng-package.json
    - versions/v20/projects/sdcorejs-angular/modules/generic/index.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/src/public-api.spec.ts
    - versions/v20/projects/sdcorejs-angular/modules/generic/sd-generic.md
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.time-json.spec.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.spec.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.html
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.scss
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.ts
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.html
    - versions/v21/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.scss
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/models/index.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/models/generic-schema.model.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/models/generic-adapter.model.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/models/generic-entity.model.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/models/generic-issue.model.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-title.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-form.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-search.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-import.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-title.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-form.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-search.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/generic-import.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/core/index.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/registry/provide-sd-generic.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/registry/index.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-configuration-store.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/services/index.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/routes/generic-route.guards.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/routes/index.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.html
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.scss
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.html
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.scss
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.html
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.html
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.scss
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.html
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.html
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.html
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.html
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/ng-package.json
    - versions/v21/projects/sdcorejs-angular/modules/generic/index.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/src/public-api.spec.ts
    - versions/v21/projects/sdcorejs-angular/modules/generic/sd-generic.md
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.time-json.spec.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.spec.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.html
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.scss
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.ts
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.html
    - versions/v22/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.scss
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/models/index.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/models/generic-schema.model.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/models/generic-adapter.model.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/models/generic-entity.model.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/models/generic-issue.model.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-title.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-form.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-search.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-import.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-title.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-form.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-search.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/generic-import.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/core/index.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/registry/provide-sd-generic.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/registry/index.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-configuration-store.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/services/index.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/routes/generic-route.guards.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/routes/index.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.html
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.scss
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.html
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.scss
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.html
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.html
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.scss
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.html
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.html
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.html
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.html
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/ng-package.json
    - versions/v22/projects/sdcorejs-angular/modules/generic/index.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/src/public-api.spec.ts
    - versions/v22/projects/sdcorejs-angular/modules/generic/sd-generic.md
  docs_artifacts:
    - .sdcorejs/docs/angular/2026-10-13-09-59-generic-crud-module-spec.md
    - .sdcorejs/specs/angular/2026-10-13-09-59-generic-crud-module.md
    - .sdcorejs/docs/architecture/2026-10-13-10-42-generic-crud-module-architecture.md
    - .sdcorejs/architecture/angular/2026-10-13-10-42-generic-crud-module.md
    - .sdcorejs/docs/angular/2026-10-13-15-57-generic-crud-module-plan.md
    - .sdcorejs/plans/angular/2026-10-13-15-57-generic-crud-module.md
    - .sdcorejs/docs/angular/2026-10-13-15-57-generic-crud-module-execution.md
    - versions/v19/projects/sdcorejs-angular/modules/generic/sd-generic.md
    - versions/v19/projects/sdcorejs-angular/components/form-generic/sd-form-generic.md
    - CHANGELOG.md
  dependency_changes:
    required: false
    packages: []
    approval_required: false
  env_changes:
    required: false
    files: []
    approval_required: false
  migration_changes:
    required: false
    description: null
    approval_required: false
  frontend_architecture:
    required: true
    conformance_invariant_refs:
      - INV-001
      - INV-002
      - INV-007
      - INV-008
      - INV-009
      - INV-013
    not_applicable_reason: null
    project_conventions:
      component_style: Standalone, signal input()/model()/output(), native control flow, OnPush where the area uses it; versions/v19 canonical
      folder_convention: secondary entry point <area>/<name>/{index.ts,ng-package.json,sd-<name>.md,src/**}; specs next to sources
      state_convention: signals in components/services; no global store
      service_data_access_convention: 'library never owns transport: consumer callbacks/adapters (form-generic catalogs, sd-table items)'
      registration_provider_convention: provideSd*() returning EnvironmentProviders; multi tokens; provideEnvironmentInitializer (services/api)
      public_api_barrel_convention: index.ts exports runtime + `export type *` for models; exact runtime surface guarded by src/public-api.spec.ts; modules/index.ts barrel
      test_convention: Karma + Jasmine, ChromeHeadless, TestBed, RouterTestingHarness for routing; --include glob ends with *.spec.ts
      evidence_inspected:
        - versions/v19/projects/sdcorejs-angular/modules/permission
        - versions/v19/projects/sdcorejs-angular/components/form-generic/index.ts
        - versions/v19/projects/sdcorejs-angular/components/form-generic/src/public-api.spec.ts
        - versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/form-generic.provider.ts
        - versions/v19/projects/sdcorejs-angular/services/api/src/api-handler-registry.ts
        - versions/v19/projects/sdcorejs-angular/components/table/src/models/table-option.model.ts
        - versions/v19/projects/sdcorejs-angular/components/side-drawer/src/side-drawer.component.ts
        - versions/v19/projects/sdcorejs-angular/modules/permission/src/guards/permission.guard.ts
        - versions/v19/projects/sdcorejs-angular/modules/layout/layout.routing.ts
        - versions/v19/projects/sdcorejs-angular/i18n/src/en.ts
        - showcase/src/app/app.routes.ts
        - showcase/src/app/docs/core/documentation.registry.ts
        - versions/v19/tsconfig.json
    component_tree:
      - >-
        Route generic/:module/:entity (providers: SdGenericSchemaService, SdGenericDataService, SdGenericPermissionService,
        provideSdFormGeneric(sd-generic-relation), data.permission public, guard + resolver)
      - '  GenericListPage: sd-table server, header actions, row commands, bulk delete, banner cấu hình lỗi, <router-outlet>'
      - '    GenericImportDialog: sd-import-excel trong modal, upsert qua SdGenericImportService'
      - '    child create | :id/detail | :id/update → GenericFormHostPage: sd-form-render (viewed cho detail) trong page hoặc sd-side-drawer'
      - 'Route generic/:module/:entity/configuration → GenericConfigurationPage (sd-tab):'
      - '  GenericConfigurationGeneralComponent | GenericConfigurationListComponent | GenericConfigurationFormComponent (sd-form-builder + panel property) | GenericConfigurationImportComponent'
    reuse_decisions:
      - need: bảng dữ liệu server
        candidate: versions/v19/projects/sdcorejs-angular/components/table SdTable
        decision: reuse
        reason: PagingReq/PagingRes trùng contract adapter
      - need: form detail/create/update
        candidate: versions/v19/projects/sdcorejs-angular/components/form-generic SdFormRender
        decision: reuse
        reason: D-002
      - need: thiết kế layout form
        candidate: versions/v19/projects/sdcorejs-angular/components/form-generic SdFormBuilder
        decision: reuse
        reason: D-023
      - need: import Excel
        candidate: versions/v19/projects/sdcorejs-angular/components/import-excel SdImportExcel
        decision: reuse
        reason: R-016
      - need: drawer
        candidate: versions/v19/projects/sdcorejs-angular/components/side-drawer SdSideDrawer
        decision: reuse
        reason: D-024
      - need: kiểm quyền
        candidate: versions/v19/projects/sdcorejs-angular/modules/permission SdPermissionService, SD_PERMISSION_PUBLIC
        decision: wrap
        reason: mã theo module/entity động (D-024)
      - need: field time/json
        candidate: versions/v19/projects/sdcorejs-angular/components/form-generic item components
        decision: extend
        reason: D-008
      - need: banner cấu hình lỗi
        candidate: inline trong GenericListPage
        decision: intentional inline markup
        reason: một khối nhỏ, không tái dùng
    file_decisions:
      - path: versions/v19/projects/sdcorejs-angular/i18n/src/en.ts
        decision: edit
        task: TASK-001
      - path: versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts
        decision: edit
        task: TASK-001
      - path: versions/v19/projects/sdcorejs-angular/i18n/src/ja.ts
        decision: edit
        task: TASK-001
      - path: versions/v19/projects/sdcorejs-angular/i18n/src/ko.ts
        decision: edit
        task: TASK-001
      - path: versions/v19/projects/sdcorejs-angular/i18n/src/zh.ts
        decision: edit
        task: TASK-001
      - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.time-json.spec.ts
        decision: create
        task: TASK-002
      - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.spec.ts
        decision: create
        task: TASK-002
      - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.spec.ts
        decision: edit
        task: TASK-002
      - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.spec.ts
        decision: edit
        task: TASK-002
      - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.ts
        decision: create
        task: TASK-003
      - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.html
        decision: create
        task: TASK-003
      - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/time/time.component.scss
        decision: create
        task: TASK-003
      - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.ts
        decision: create
        task: TASK-003
      - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.html
        decision: create
        task: TASK-003
      - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/json/json.component.scss
        decision: create
        task: TASK-003
      - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-field.model.ts
        decision: edit
        task: TASK-003
      - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.ts
        decision: edit
        task: TASK-003
      - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.ts
        decision: edit
        task: TASK-003
      - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.ts
        decision: edit
        task: TASK-003
      - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.html
        decision: edit
        task: TASK-003
      - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/index.ts
        decision: edit
        task: TASK-003
      - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.ts
        decision: edit
        task: TASK-003
      - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/field-preview.component.html
        decision: edit
        task: TASK-003
      - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.ts
        decision: edit
        task: TASK-003
      - path: versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.html
        decision: edit
        task: TASK-003
      - path: versions/v19/projects/sdcorejs-angular/components/form-generic/sd-form-generic.md
        decision: edit
        task: TASK-004
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/models/index.ts
        decision: create
        task: TASK-005
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/models/generic-schema.model.ts
        decision: create
        task: TASK-005
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/models/generic-adapter.model.ts
        decision: create
        task: TASK-005
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/models/generic-entity.model.ts
        decision: create
        task: TASK-005
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/models/generic-issue.model.ts
        decision: create
        task: TASK-005
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.spec.ts
        decision: create
        task: TASK-006
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-title.spec.ts
        decision: create
        task: TASK-006
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.spec.ts
        decision: create
        task: TASK-006
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.spec.ts
        decision: create
        task: TASK-006
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.spec.ts
        decision: create
        task: TASK-006
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-form.spec.ts
        decision: create
        task: TASK-006
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.spec.ts
        decision: create
        task: TASK-006
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-search.spec.ts
        decision: create
        task: TASK-006
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-import.spec.ts
        decision: create
        task: TASK-006
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-permission.ts
        decision: create
        task: TASK-007
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-title.ts
        decision: create
        task: TASK-007
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-defaults.ts
        decision: create
        task: TASK-007
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-merge.ts
        decision: create
        task: TASK-007
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-validate.ts
        decision: create
        task: TASK-007
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-form.ts
        decision: create
        task: TASK-007
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-columns.ts
        decision: create
        task: TASK-007
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-search.ts
        decision: create
        task: TASK-007
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/generic-import.ts
        decision: create
        task: TASK-007
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/core/index.ts
        decision: create
        task: TASK-007
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.spec.ts
        decision: create
        task: TASK-008
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.spec.ts
        decision: create
        task: TASK-008
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.spec.ts
        decision: create
        task: TASK-008
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.spec.ts
        decision: create
        task: TASK-008
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.spec.ts
        decision: create
        task: TASK-008
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.spec.ts
        decision: create
        task: TASK-008
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/registry/generic-registry.ts
        decision: create
        task: TASK-009
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/registry/provide-sd-generic.ts
        decision: create
        task: TASK-009
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/registry/index.ts
        decision: create
        task: TASK-009
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-schema.service.ts
        decision: create
        task: TASK-009
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-configuration-store.ts
        decision: create
        task: TASK-009
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-data.service.ts
        decision: create
        task: TASK-009
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-permission.service.ts
        decision: create
        task: TASK-009
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-relation-catalog.ts
        decision: create
        task: TASK-009
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/services/generic-import.service.ts
        decision: create
        task: TASK-009
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/services/index.ts
        decision: create
        task: TASK-009
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.spec.ts
        decision: create
        task: TASK-010
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/routes/sd-generic.routes.ts
        decision: create
        task: TASK-011
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/routes/generic-route.guards.ts
        decision: create
        task: TASK-011
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/routes/index.ts
        decision: create
        task: TASK-011
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.ts
        decision: create
        task: TASK-011
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.html
        decision: create
        task: TASK-011
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.scss
        decision: create
        task: TASK-011
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.ts
        decision: create
        task: TASK-011
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.html
        decision: create
        task: TASK-011
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.scss
        decision: create
        task: TASK-011
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.ts
        decision: create
        task: TASK-011
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.html
        decision: create
        task: TASK-011
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/list/generic-list.page.spec.ts
        decision: create
        task: TASK-012
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/form/generic-form-host.page.spec.ts
        decision: create
        task: TASK-012
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/components/import-dialog/generic-import-dialog.component.spec.ts
        decision: create
        task: TASK-012
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.ts
        decision: create
        task: TASK-013
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.html
        decision: create
        task: TASK-013
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.scss
        decision: create
        task: TASK-013
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.ts
        decision: create
        task: TASK-013
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-general/generic-configuration-general.component.html
        decision: create
        task: TASK-013
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.ts
        decision: create
        task: TASK-013
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-list/generic-configuration-list.component.html
        decision: create
        task: TASK-013
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.ts
        decision: create
        task: TASK-013
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.html
        decision: create
        task: TASK-013
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.ts
        decision: create
        task: TASK-013
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-import/generic-configuration-import.component.html
        decision: create
        task: TASK-013
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/pages/configuration/generic-configuration.page.spec.ts
        decision: create
        task: TASK-014
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/components/configuration-form/generic-configuration-form.component.spec.ts
        decision: create
        task: TASK-014
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/ng-package.json
        decision: create
        task: TASK-015
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/index.ts
        decision: create
        task: TASK-015
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/src/public-api.spec.ts
        decision: create
        task: TASK-015
      - path: versions/v19/projects/sdcorejs-angular/modules/index.ts
        decision: edit
        task: TASK-015
      - path: versions/v19/projects/sdcorejs-angular/modules/generic/sd-generic.md
        decision: create
        task: TASK-016
      - path: showcase/src/app/pages/modules/generic/generic-demo.component.ts
        decision: create
        task: TASK-017
      - path: showcase/src/app/pages/modules/generic/generic-demo.mock-adapter.ts
        decision: create
        task: TASK-017
      - path: showcase/src/app/pages/modules/generic/generic-demo.component.spec.ts
        decision: create
        task: TASK-017
      - path: showcase/src/app/app.routes.ts
        decision: edit
        task: TASK-017
      - path: showcase/src/app/app.routes.spec.ts
        decision: edit
        task: TASK-017
      - path: showcase/src/app/docs/core/documentation.registry.ts
        decision: edit
        task: TASK-017
      - path: showcase/src/app/docs/core/documentation.registry.spec.ts
        decision: edit
        task: TASK-017
      - path: showcase/src/app/docs/generated/example-sources.generated.ts
        decision: edit
        task: TASK-017
      - path: showcase/src/app/docs/generated/example-manifest.generated.ts
        decision: edit
        task: TASK-017
      - path: CHANGELOG.md
        decision: edit
        task: TASK-018
    state_owners:
      - symbol: Scope node của từng injector (registry modules/generic)
        state: Đăng ký adapter và cấu hình entity
      - symbol: SdGenericSchemaService ở injector môi trường của route generic (cache, xoá khi lưu)
        state: Schema hiệu lực theo module.entity
      - symbol: adapter.configuration của consumer (server hoặc theo người dùng); không khai thì localStorage sd-generic:configuration:<module>.<entity>
        state: Cấu hình đã lưu
      - symbol: sd-table trong trang list; trang list không bị huỷ khi mở drawer
        state: Trạng thái list (filter, sort, trang)
      - symbol: sd-form-render trong host form; chỉ ghi xuống qua SdGenericDataService
        state: Giá trị form đang nhập
      - symbol: Trang configuration (signal cục bộ) đến khi Lưu
        state: Bản nháp cấu hình đang sửa
      - symbol: SdPermissionService có sẵn (modules/permission)
        state: Danh sách quyền của người dùng
    service_boundaries:
      - symbol: core/* (hàm thuần)
        scope: pure_function
      - symbol: SdGenericRegistry scope node
        scope: module
      - symbol: SdGenericSchemaService
        scope: route
      - symbol: SdGenericDataService
        scope: route
      - symbol: SdGenericPermissionService
        scope: route
      - symbol: SdGenericImportService
        scope: component
      - symbol: GenericConfigurationPage draft signal
        scope: page
    data_flow:
      - route resolver → SdGenericSchemaService.resolve(module, entity) → core.merge/validate → schema hiệu lực
      - GenericListPage → core.columns(schema) → sd-table items(filterReq, pagingReq) → SdGenericDataService.query → adapter.query
      - GenericFormHostPage → core.form(schema, action) → sd-form-render [(value)] → SdGenericDataService.create/update (beforeSave/afterSave, ép kiểu relation)
      - sd-form-render select relation → catalog sd-generic-relation → SdGenericDataService.search (entity → adapter → query)
      - GenericConfigurationPage draft → validateSdGenericSchema → SdGenericSchemaService.save → adapter.configuration.set | localStorage
    declarations_and_registration:
      - symbol: provideSdGeneric / provideSdGenericEntity
        mechanism: 'EnvironmentProviders: multi token + scope node + provideEnvironmentInitializer kiểm trùng'
      - symbol: sdGenericRoutes()
        mechanism: Routes với providers cấp route, loadComponent cho các trang standalone
      - symbol: các trang/component
        mechanism: standalone, chỉ import qua entry point public
    public_exports:
      - provideSdGeneric
      - provideSdGenericEntity
      - sdGenericRoutes
      - validateSdGenericSchema
      - 'type-only: models'
    remaining_contract: >-
      Trang route chỉ điều phối; logic nằm ở core (thuần) và hai service cổng adapter. Tách 4 tab cấu hình thành component vì mỗi tab có form và state nháp
      riêng; banner giữ inline. Test: core/registry/service/route theo TDD (RED trước), trang/component viết test sau.
  agent_architecture:
    required: false
    conformance_invariant_refs: []
    not_applicable_reason: Không phải track ai-agent; module CRUD giao diện.
    contract: null
  verification_strategy:
    package_manager: npm
    commands_planned:
      - command: npm --prefix versions/v19 ci --legacy-peer-deps && npm --prefix showcase ci --legacy-peer-deps
        reason: worktree chưa có node_modules (preflight, Node 22.22.3)
      - command: >-
          (versions/v19) npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless
          --include=projects/sdcorejs-angular/components/form-generic/**/*.spec.ts
        reason: RED sau TASK-002, GREEN sau TASK-003 (AC-021)
      - command: (versions/v19) npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/modules/generic/**/*.spec.ts
        reason: RED/GREEN từng phase 2–5, chạy lại toàn bộ sau TASK-015 (AC-001…AC-020, AC-024)
      - command: npm --prefix versions/v19 run check:i18n && npm --prefix versions/v19 run check:i18n-parity
        reason: TASK-001
      - command: >-
          node -e "const fs=require('fs'),p=require('path');const bad=[];const walk=d=>fs.readdirSync(d,{withFileTypes:true}).forEach(e=>{const
          f=p.join(d,e.name);if(e.isDirectory())return
          walk(f);if(/[.]ts$/.test(f)&&!/[.]spec[.]ts$/.test(f)&&/HttpClient|@omg-b2b|core-commerce/.test(fs.readFileSync(f,'utf8')))bad.push(f)});walk('versions/v19/projects/sdcorejs-angular/modules/generic');if(bad.length){console.error(bad.join(String.fromCharCode(10)));process.exit(1)}"
        reason: 'AC-024: không HttpClient/import backend trong modules/generic'
      - command: npm --prefix versions/v19 run build
        reason: dist mới cho Showcase và kiểm vòng phụ thuộc barrel (D-028)
      - command: >-
          npm --prefix showcase run link:library && npm --prefix showcase run test -- --include=src/app/pages/modules/generic/**/*.spec.ts
          --include=src/app/app.routes.spec.ts --include=src/app/docs/core/documentation.registry.spec.ts
        reason: AC-022
      - command: npm run generate:showcase-examples && npm run test:showcase-examples
        reason: AC-022 (manifest/registry khớp demo)
      - command: npm run test:collect-docs
        reason: docs md được thu thập
      - command: npm run sync && npm run check:sync
        reason: AC-023, INV-012
      - command: npm --prefix versions/v20 ci --legacy-peer-deps && npm --prefix versions/v21 ci --legacy-peer-deps && npm --prefix versions/v22 ci
        reason: cài trước khi build ba line dẫn xuất
      - command: npm --prefix versions/v20 run build && npm --prefix versions/v21 run build && npm --prefix versions/v22 run build
        reason: AC-023
      - command: (versions/v19) npx eslint <các file ts/html đã đổi>
        reason: lint phần thay đổi
    commands_skipped:
      - command: full v19 suite --code-coverage
        reason: gate release do workflow publish chạy; plan chạy toàn bộ spec form-generic và modules/generic
      - command: Playwright/screenshot
        reason: spec chỉ yêu cầu kiểm DOM tự động
    checks: TDD cho core/registry/services/routes; test sau cho trang; build v19–v22; check:sync; guard Showcase; lint; quét HttpClient; diff chỉ trong allowed_paths
  parallel_candidates:
    allowed: false
    contract: >-
      Tuần tự: các phase phụ thuộc lõi chung (core → services → pages) và rollout toàn repo; Phase 1 (form-generic) độc lập về file nhưng i18n và build dùng
      chung.
    shared_files:
      - path: versions/v19/projects/sdcorejs-angular/i18n/src/*.ts
        owner: TASK-001
        strategy: mọi khoá i18n thêm ở TASK-001
  repository_plan:
    schema_version: 1
    integration_owner_repository_id: sdcorejs-angular
    dependency_order:
      - sdcorejs-angular
    contract: >-
      Mọi task chạy trong sdcorejs-angular ở worktree hiện tại; trước commit đầu tiên đổi tên nhánh claude/check-work-other-account-ee1b4f thành
      feat/generic-crud-module (base origin/main 48de6f13e); PR vào main; không tag, không publish.
  finish_tail:
    contract: 'docs_before_final_branch_ready: execution record trước lần chạy xác minh cuối; verify_before_done rồi branch_ready; no_writes_after_branch_ready: true'
  approval:
    approved: false
    approved_at: null
  change_control:
    revision: 1
    supersedes: null
    change_reason: null
```

## Decisions captured during review

- Tự review: các validator `validateDecisionCoverage(stage plan)`, `validateGoalBackwardPlan`, `assertValidationMap` và `validateArchitectureDraftPlanHandoff` đều qua ở vòng 1. Không có blocker.
- Thêm **D-030** (nguồn `approved-plan`), ranh giới kiểm chứng `none`: thư viện chỉ ẩn UI và chặn route ở client; quyền phía server thuộc backend của adapter (ST-001).
- Artifact phê duyệt của decision coverage (`approved_artifact`) chỉ được tạo khi duyệt plan. Lúc tự review dùng bản tạm trong bộ nhớ.
