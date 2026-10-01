---
artifact_id: plan-form-generic-schema-v1-r2-draft
artifact_kind: plan
contract_id: form-generic-schema-v1
change_ref: form-generic-schema-v1
owner: sdcorejs-plan
owner_repository_id: sdcorejs-angular
owner_repository_role: library
owner_module_id: components/form-generic
execution_host_repository_id: sdcorejs-angular
integration_owner_repository_id: sdcorejs-angular
track: angular
stack_profile: core-ui-angular
source_spec: .sdcorejs/specs/angular/2026-09-29-18-42-form-generic-schema-v1-phase-1.md
source_architecture: .sdcorejs/architecture/angular/2026-09-29-18-53-form-generic-schema-v1-phase-1.md
source_plan: none
commit_policy: with-change
status: draft
approved: false
revision: 2
supersedes: .sdcorejs/plans/angular/2026-09-30-01-16-form-generic-schema-v1-phase-1.md
---

# Plan - Form generic schema v1 — Đợt 1: nền - 2026-09-30 02:21

## Scope

Thực thi Đợt 1 của `form-generic-schema-v1` theo spec đã duyệt `spec-form-generic-schema-v1-r1` (`sha256:v1:6252cd8f9b48bce67af08815056bec87385a63169d7435edc81bcfbd881cb801`) và architecture đã duyệt `architecture-form-generic-schema-v1-r1` (`sha256:v1:db91ad7886d71be8e4549e37b69dbbca04584ae598fa287e8d0e877fd6948a09`).
Dựng lõi TypeScript thuần (model v1, layout 3 mức, evaluator Filter, giá trị, validation, đổi mã, hiển thị, provider, catalog) bằng TDD; sau đó chuyển `sd-form-render` và `sd-form-builder` sang schema mới, bỏ code cũ, cập nhật i18n, tài liệu, CHANGELOG, showcase; cuối cùng kiểm chứng v19 và rollout v20–v22.
Spec là nguồn của cái gì và vì sao; plan chỉ nêu cách làm, thứ tự, file và lệnh.

## Change control

- Revision 2, thay thế `.sdcorejs/plans/angular/2026-09-30-01-16-form-generic-schema-v1-phase-1.md`.
- Lý do: prepareExecution preflight: r1 allowed/prohibited_paths chứa ghi chú nên không phải glob, TASK-026 khai báo thư mục thay vì versions/v2x/**, repository topology thiếu available/writable. Nội dung task không đổi.

## Execution context

- Track: `angular`
- Target root kind: `target-project` (worktree `claude/form-builder-rewrite-3ed1e3`)
- Stack profile: `core-ui-angular`
- Coverage approach: TDD cho lõi logic (phase 2: RED rồi GREEN từng cặp); test viết sau cho component/giao diện (phase 3) kèm ảnh chụp thật (D-011).
- Parallel candidates: không — cặp RED/GREEN không được xen nhau vì `tsconfig.spec.json` đưa mọi source vào một chương trình TypeScript; phase 3 là cửa sổ biên dịch đỏ; máy dev hay quá tải CPU.
- Package manager: npm (package-lock.json ở root, `versions/v19`, `showcase`); Node 22.22.3 qua `fnm exec --using=22.22.3 npm.cmd …`.
- Dependency / env / migration: không đổi (không thêm package, không sửa package.json/lockfile, không có migration dữ liệu).
- Ký hiệu: `fg/` = `versions/v19/projects/sdcorejs-angular/components/form-generic/`.

## Ghi chú phạm vi cần duyệt cùng plan

- **D-021** — validation map dùng ranh giới `none`: thư viện không có ranh giới phân quyền, không gọi HTTP.
- **D-022** — bỏ ở đợt 1, ghi trong BREAKING: `onLoaded`; `beforeSubmit`, `properties.onChange.setValues`, kiểu `checklist` (renderer chưa từng thực thi); `setVariables` + `VariableComponent` (thay bằng `options.fill` và `[variables]`); field `table` (D-015, làm lại ở đợt 3).
- **D-023** — `validate()` gặp validator hàm chưa đăng ký: fail-closed, thêm một lỗi error, `valid = false`.
- Showcase không đăng ký catalog (demo dùng options static); hành vi catalog được chứng minh bằng spec với provider giả.

## Tasks

### Phase 1 - Chuẩn bị

1. **TASK-001** `VERIFY` sdcorejs-angular:scripts/sync-multi-version-workspaces.ps1 — Preflight working tree và chẩn đoán lỗi rollout lần trước. Chốt trạng thái nhánh trước khi sửa; tìm nguyên nhân `npm run sync` lần trước dừng ở bước v22.
   - File: VERIFY `scripts/sync-multi-version-workspaces.ps1`
   - Chạy `git status --short`, `git diff --cached --stat`, `git diff --stat`, liệt kê untracked, ghi branch và HEAD; đối chiếu với `allowed_paths`/`prohibited_paths`.
   - Có file bẩn ngoài phạm vi plan thì hỏi 3 lựa chọn: chỉ sửa file trong plan / cho phép sửa file bẩn đã chọn / dừng để người dùng dọn.
   - Đọc `scripts/sync-multi-version-workspaces.ps1` (hàm ghi file quanh dòng 14) và lỗi lần trước `WriteAllText … user-mapped section open` ở bước [4/4] v22; tìm tiến trình đang map file trong `versions/v22` (ng build --watch, dev server, IDE, TGitCache, antivirus).
   - Chỉ đọc, không sửa script. Nếu lỗi nằm ở script chứ không do file bị khoá thì dừng và hỏi người dùng.
   - Hiện trạng đo lúc lập plan: `npm run check:sync` xanh; 1073 file v22 đang CRLF trong working tree (index LF) — xử lý ở TASK-026.
   - Bằng chứng: EVIDENCE-001 — Báo cáo preflight (status, diffstat, branch, HEAD) và nguyên nhân lỗi sync.
   - Phụ thuộc: không · Căn cứ: R-011 · Bảo vệ: INV-007

### Phase 2 - Lõi thuần TypeScript — TDD

2. **TASK-002** `CREATE` sdcorejs-angular:fg/src/models/form-generic-schema.spec.ts — RED — test ngữ pháp schema. Khoá ngữ pháp SdFormGenericSchema bằng test trước khi có model.
   - File: CREATE `fg/src/models/form-generic-schema.spec.ts`
   - Tạo `form-generic-schema.spec.ts` (Jasmine thuần, không TestBed); `sdValidateSchema` báo lỗi khi thiếu `pages`, group lồng group, còn phần tử `break`, có `schemaVersion`, phần tử thiếu `id`, key field trùng nhau hoặc trùng key biến; `sdNormalizeSchema` trả bản clone (input deep-freeze không lỗi), điền `id` còn thiếu, giữ nguyên phần tử có `type` lạ; `sdSchemaFields` trả field theo thứ tự tài liệu kể cả trong group; `sdSameSchema` so nội dung không phụ thuộc thứ tự thuộc tính.
   - Chạy focused Karma cho spec này: phải FAIL vì module chưa tồn tại (RED đúng lý do). Không viết code sản phẩm trong task này.
   - Bằng chứng: EVIDENCE-002 — RED: focused Karma thất bại vì thiếu module (lệnh + dòng lỗi quyết định).
   - Phụ thuộc: TASK-001 · Căn cứ: R-001, D-001, D-002, D-011, D-013, D-017 · Bảo vệ: không

3. **TASK-003** `CREATE` sdcorejs-angular:fg/src/models/form-generic-schema.model.ts (+3 file) — GREEN — model v1 và helper ngữ pháp. Tạo type public của schema v1 và helper thuần để TASK-002 xanh.
   - File: CREATE `fg/src/models/form-generic-schema.model.ts`; CREATE `fg/src/models/form-generic-field.model.ts`; CREATE `fg/src/models/form-generic-config.model.ts`; CREATE `fg/src/models/form-generic-schema.ts`
   - `form-generic-schema.model.ts`: `SdFormGenericSchema { pages; navigation?; variables?; validations? }`, `SdFormGenericPage`, `SdFormGenericNavigation` (chừa tabs/steps cho đợt 3), `SdFormGenericPageElement`, `SdFormGenericGroup` (`type: group`, `elements` chỉ chứa element), `SdFormGenericElement` (union mở rộng theo D-017), `SdFormGenericVariable { key; label }`, `SdFormGenericValidation` (filter | function).
   - `form-generic-field.model.ts`: base field (`id`, `key`, `label`, `placeholder?`, `helperText?`, `defaultValue?`, `layout?`, `rules?`, `validation?`, `disabled?`, `viewed?`, `hidden?`, `hyperlink?`) và 11 type giữ tên cũ (D-012); `SdFormGenericLayout`, `SdFormGenericRules`, `SdFormGenericFieldValidation`, `SdFormGenericOptions` (static | catalog), `SdFormGenericOption`, `SdFormGenericValueRef`, subtype text/number, `phoneCountry`.
   - `form-generic-config.model.ts`: `SdFormGenericConfig` (catalogs, templates, htmlDefinitions, validators, breakpoints), `SdFormGenericCatalog { id; label; params?; fields?; load; search? }`, `SdFormGenericCatalogItem = SdFormGenericOption & { data? }` (D-019), ngữ cảnh gọi catalog, template, html definition (static | query), validator hàm nhận value.
   - `form-generic-schema.ts`: `sdValidateSchema`, `sdNormalizeSchema`, `sdSchemaFields`, `sdSameSchema` — TypeScript thuần, không DI/DOM (D-018), không mutate input.
   - Chưa export ra `models/index.ts` (TASK-022 mới đổi barrel) để code cũ vẫn biên dịch; code mới import theo đường dẫn file.
   - Chạy lại focused Karma: xanh.
   - Bằng chứng: EVIDENCE-003 — GREEN: `form-generic-schema.spec.ts` pass.
   - Phụ thuộc: TASK-002 · Căn cứ: R-001, R-004, R-005, D-001, D-002, D-005, D-009, D-012, D-013, D-017, D-018 · Bảo vệ: INV-004, INV-005, INV-006

4. **TASK-004** `CREATE` sdcorejs-angular:fg/src/layout/form-generic-layout.spec.ts — RED — test bố cục 3 mức. Khoá hành vi chọn mức, kế thừa span và xếp hàng trước khi viết module layout.
   - File: CREATE `fg/src/layout/form-generic-layout.spec.ts`
   - Tạo `form-generic-layout.spec.ts`; `sdResolveBreakpoint` với mặc định `{ tablet: 600, desktop: 1024 }` (599 → mobile, 600 → tablet, 1023 → tablet, 1024 → desktop) và ghi đè một phần (`{ tablet: 700 }`: 650px → mobile, desktop giữ 1024); `sdResolveSpan` (desktop = `span.desktop ?? 12`, tablet = `span.tablet ?? desktop`, mobile = `span.mobile ?? 12`, kẹp 1–12); `sdSpanSource` trả own | desktop | default cho nhãn kế thừa; `sdPackRows(elements, level)` xếp tham lam 12 cột, `newRow` luôn mở hàng mới, group chiếm trọn hàng, phần tử type lạ không làm lệch hàng; case AC-002 (hai field span desktop 6) và AC-004 (field `newRow` sau field span 4); `sdWithSpan(layout, level, value | null)` chỉ đổi mức được chọn, `null` xoá về kế thừa, trả object mới; `sdWithNewRow` tương tự.
   - Chạy focused Karma cho spec này: phải FAIL vì module chưa tồn tại (RED đúng lý do). Không viết code sản phẩm trong task này.
   - Bằng chứng: EVIDENCE-004 — RED: layout spec thất bại vì thiếu module.
   - Phụ thuộc: TASK-003 · Căn cứ: R-002, D-003, D-011 · Bảo vệ: không

5. **TASK-005** `CREATE` sdcorejs-angular:fg/src/configurations/form-generic-breakpoints.ts (+1 file) — GREEN — module layout dùng chung. Một module layout thuần duy nhất cho renderer và canvas (INV-002).
   - File: CREATE `fg/src/configurations/form-generic-breakpoints.ts`; CREATE `fg/src/layout/form-generic-layout.ts`
   - `form-generic-breakpoints.ts`: `SD_FORM_GENERIC_BREAKPOINTS = { tablet: 600, desktop: 1024 } as const`, `SdFormGenericBreakpoint`, `SdFormGenericBreakpoints`; file thuần, không import Angular.
   - `form-generic-layout.ts`: các hàm của TASK-004; thuật toán xếp hàng lấy từ `buildRows` trong `state/builder-layout.ts` rồi tổng quát theo 3 mức.
   - Chạy lại focused Karma: xanh.
   - Bằng chứng: EVIDENCE-005 — GREEN: layout spec pass.
   - Phụ thuộc: TASK-004 · Căn cứ: R-002, D-003, D-009, D-018 · Bảo vệ: INV-002

6. **TASK-006** `CREATE` sdcorejs-angular:fg/src/rules/form-generic-filter.spec.ts (+1 file) — RED — test evaluator Filter và giá trị form. Khoá ngữ nghĩa rules, value ref, defaultValue và fill trước khi viết.
   - File: CREATE `fg/src/rules/form-generic-filter.spec.ts`; CREATE `fg/src/rules/form-generic-values.spec.ts`
   - Tạo `form-generic-filter.spec.ts` và `form-generic-values.spec.ts`; ma trận toán tử mà `sd-query-builder` sinh ra (so sánh, like, IN/NOT IN, BETWEEN, NULL/NOT NULL, ngày tương đối, so sánh field–field, lồng AND/OR) qua `sdEvaluateFilter(filter, scope)` — kiểm chứng A-002; `sdElementState` (hiện khi `visible` vắng hoặc đúng và `hidden` vắng hoặc sai và cờ `hidden` tĩnh tắt; `disabled`/`required` OR với cờ tĩnh; scope `{ ...value, ...variables }` theo A-005; case AC-005); `sdResolveValueRef`/`sdResolveParams`; `sdApplyDefaults` chỉ điền key chưa có giá trị, không áp khi viewed, không bao giờ áp cho password, trả object mới, input deep-freeze không lỗi; `sdFillPatch(item, fill)` đọc `item.data[from]`; `sdCatalogKey(id, params)` ổn định; `sdValueKeys(schema)` chỉ gồm key field (D-020).
   - Chạy focused Karma cho spec này: phải FAIL vì module chưa tồn tại (RED đúng lý do). Không viết code sản phẩm trong task này.
   - Bằng chứng: EVIDENCE-006 — RED: filter/values spec thất bại vì thiếu module.
   - Phụ thuộc: TASK-005 · Căn cứ: R-003, R-005, R-007, D-004, D-005, D-011, D-020 · Bảo vệ: không

7. **TASK-007** `CREATE` sdcorejs-angular:fg/src/rules/form-generic-filter.ts (+1 file) — GREEN — evaluator Filter duy nhất và hàm giá trị. Một evaluator bọc FilterUtilities (INV-003); hàm giá trị thuần không mutate (INV-001).
   - File: CREATE `fg/src/rules/form-generic-filter.ts`; CREATE `fg/src/rules/form-generic-values.ts`
   - `form-generic-filter.ts`: `sdEvaluateFilter` bọc `FilterUtilities.evaluate` của `@sdcorejs/utils`; toán tử nào thư viện không hỗ trợ thì bù trong chính hàm này (vẫn một evaluator) và ghi lại; `sdElementState`.
   - `form-generic-values.ts`: value ref, params, defaults, fill, khoá catalog, value keys.
   - Chạy lại focused Karma: xanh; ghi bảng toán tử đã kiểm chứng (A-002).
   - Bằng chứng: EVIDENCE-007 — GREEN: filter/values spec pass kèm bảng toán tử.
   - Phụ thuộc: TASK-006 · Căn cứ: R-003, R-005, R-007, D-004, D-005, D-018, D-020 · Bảo vệ: INV-001, INV-003

8. **TASK-008** `CREATE` sdcorejs-angular:fg/src/rules/form-generic-validation.spec.ts (+1 file) — RED — test validation cấp form và đổi mã. Khoá validate() cấp form và cập nhật tham chiếu có cấu trúc trước khi viết.
   - File: CREATE `fg/src/rules/form-generic-validation.spec.ts`; CREATE `fg/src/rules/form-generic-references.spec.ts`
   - Tạo `form-generic-validation.spec.ts` và `form-generic-references.spec.ts`; `sdRunFormValidations(validations, scope, validators)` trả `{ valid, messages: { error: [], warning: [] } }`, không bao giờ `undefined`; Filter đúng thì thêm message theo `alert`; validator hàm nhận value form; chỉ error làm `valid = false`; validator chưa đăng ký thành một lỗi error nêu mã (D-023); `sdFindKeyReferences(schema, key)` đếm tham chiếu có cấu trúc (Filter.field và so sánh field–field trong rules, options.params, options.fill.field, upload params, html query, validations cấp form) và tham chiếu chuỗi tự do (hyperlink, nội dung html); `sdRenameKey` đổi mọi tham chiếu có cấu trúc, giữ chuỗi tự do, trả schema mới, từ chối key đã tồn tại.
   - Chạy focused Karma cho spec này: phải FAIL vì module chưa tồn tại (RED đúng lý do). Không viết code sản phẩm trong task này.
   - Bằng chứng: EVIDENCE-008 — RED: validation/references spec thất bại vì thiếu module.
   - Phụ thuộc: TASK-007 · Căn cứ: R-003, R-009, D-004, D-008, D-011, D-014, D-023 · Bảo vệ: không

9. **TASK-009** `CREATE` sdcorejs-angular:fg/src/rules/form-generic-validation.ts (+1 file) — GREEN — validation cấp form và đổi mã có cấu trúc. validate() dùng chung evaluator; đổi mã thay cho `state/builder-references.ts`.
   - File: CREATE `fg/src/rules/form-generic-validation.ts`; CREATE `fg/src/rules/form-generic-references.ts`
   - `form-generic-validation.ts`: gọi `sdEvaluateFilter`, không có evaluator thứ hai.
   - `form-generic-references.ts`: duyệt mọi vị trí tham chiếu có cấu trúc; `state/builder-references.ts` bị xoá ở TASK-018.
   - Chạy lại focused Karma: xanh.
   - Bằng chứng: EVIDENCE-009 — GREEN: validation/references spec pass.
   - Phụ thuộc: TASK-008 · Căn cứ: R-003, R-007, R-009, D-004, D-008, D-014, D-018, D-020, D-023 · Bảo vệ: INV-003, INV-005

10. **TASK-010** `CREATE` sdcorejs-angular:fg/src/rules/form-generic-display.spec.ts — RED — test hiển thị giá trị chỉ xem. Ghi lại hành vi hiện tại của ComponentViewedPipe thành test cho model mới (AC-016).
   - File: CREATE `fg/src/rules/form-generic-display.spec.ts`
   - Tạo `form-generic-display.spec.ts` sau khi đọc `pipes/component-viewed.pipe.ts`; kỳ vọng giống bản hiện tại: nhãn lựa chọn static và map nhãn catalog, multiple nối chuỗi, checkbox, date/datetime, số theo preset (integer, decimal, currency kèm mã tiền, percent), password luôn che, chip nối chuỗi, giá trị rỗng.
   - Chạy focused Karma cho spec này: phải FAIL vì module chưa tồn tại (RED đúng lý do). Không viết code sản phẩm trong task này.
   - Bằng chứng: EVIDENCE-010 — RED: display spec thất bại vì thiếu module.
   - Phụ thuộc: TASK-009 · Căn cứ: R-009, D-008, D-011 · Bảo vệ: không

11. **TASK-011** `CREATE` sdcorejs-angular:fg/src/rules/form-generic-display.ts — GREEN — định dạng giá trị chỉ xem. Hàm thuần `sdDisplayValue` cho pipe và SdFormRenderService.
   - File: CREATE `fg/src/rules/form-generic-display.ts`
   - `sdDisplayValue(field, value, labels?)` thuần; pipe và service gọi lại ở TASK-014.
   - Chạy lại focused Karma: xanh.
   - Bằng chứng: EVIDENCE-011 — GREEN: display spec pass.
   - Phụ thuộc: TASK-010 · Căn cứ: R-009, D-008, D-018 · Bảo vệ: không

12. **TASK-012** `CREATE` sdcorejs-angular:fg/src/configurations/form-generic.provider.spec.ts (+1 file) — RED — test provider và catalog theo instance. Khoá provideSdFormGeneric và bộ đệm catalog theo từng renderer (D-019) trước khi viết.
   - File: CREATE `fg/src/configurations/form-generic.provider.spec.ts`; CREATE `fg/src/components/form-render/form-render-catalog.spec.ts`
   - Tạo `form-generic.provider.spec.ts` và `form-render-catalog.spec.ts` (TestBed, catalog giả); `provideSdFormGeneric({ breakpoints: { tablet: 700 } })` cho `{ tablet: 700, desktop: 1024 }`; không gọi provider thì token trả mặc định; catalogs/templates/htmlDefinitions/validators đi nguyên vẹn; `FormRenderCatalog.load(id, params)` gọi `catalog.load` một lần cho mỗi khoá, params khác thì tải lại, `search(term, params)` khi catalog có `search`, catalog không đăng ký trả rỗng và cảnh báo, hai instance không dùng chung bộ đệm, không cần HttpClient.
   - Chạy focused Karma cho spec này: phải FAIL vì module chưa tồn tại (RED đúng lý do). Không viết code sản phẩm trong task này.
   - Bằng chứng: EVIDENCE-012 — RED: provider/catalog spec thất bại vì thiếu module.
   - Phụ thuộc: TASK-011 · Căn cứ: R-005, R-006, D-006, D-011, D-019 · Bảo vệ: không

13. **TASK-013** `CREATE` sdcorejs-angular:fg/src/configurations/form-generic.provider.ts (+1 file) — GREEN — provideSdFormGeneric và FormRenderCatalog. Dữ liệu portal chỉ vào qua provider (INV-009); đệm catalog theo instance.
   - File: CREATE `fg/src/configurations/form-generic.provider.ts`; CREATE `fg/src/components/form-render/form-render-catalog.ts`
   - `form-generic.provider.ts`: token `SD_FORM_GENERIC_CONFIG` có factory mặc định (mẫu `SD_ICON_CONFIGURATION`), `provideSdFormGeneric` dùng `makeEnvironmentProviders` (mẫu `provideSdApiContract`); token không export ra entry.
   - `form-render-catalog.ts`: `@Injectable()` không `providedIn`, provide ở `sd-form-render` (TASK-016).
   - Chạy lại focused Karma: xanh; rồi chạy một lượt tất cả spec mới của phase 2.
   - Bằng chứng: EVIDENCE-013 — GREEN: provider/catalog spec pass; toàn bộ spec lõi thuần xanh.
   - Phụ thuộc: TASK-012 · Căn cứ: R-005, R-006, D-006, D-019 · Bảo vệ: INV-009

### Phase 3 - Chuyển renderer và builder (cửa sổ biên dịch đỏ)

> Cửa sổ biên dịch đỏ: từ TASK-014 tới hết TASK-022 thư viện và chương trình spec chưa biên dịch được (renderer, builder và model cũ đổi cùng nhau; một lỗi biên dịch chặn mọi lượt Karma). Trong cửa sổ này dùng `npm run build` (v19) để theo dõi số lỗi giảm dần; Karma chỉ chạy lại ở TASK-022. Logic cần TDD đã nằm ở phase 2.

14. **TASK-014** `EDIT` sdcorejs-angular:fg/src/configurations/form-generic.configuration.ts (+15 file) — Chuyển configurations, services, pipes sang model mới. Mở cửa sổ biên dịch đỏ: đổi lớp cấu hình và dịch vụ trước renderer.
   - File: DELETE `fg/src/configurations/form-generic.configuration.ts`; DELETE `fg/src/configurations/form.configuration.ts`; EDIT `fg/src/configurations/index.ts`; EDIT `fg/src/services/form-generic.service.ts`; EDIT `fg/src/services/form-generic.service.spec.ts`; EDIT `fg/src/services/form-render.service.ts`; CREATE `fg/src/services/form-render.service.spec.ts`; EDIT `fg/src/pipes/component-viewed.pipe.ts`; EDIT `fg/src/pipes/html.pipe.ts`; EDIT `fg/src/pipes/hyperlink.pipe.ts`; EDIT `fg/src/pipes/index.ts`; DELETE `fg/src/pipes/expression-feel.pipe.ts`; DELETE `fg/src/pipes/expression-query.pipe.ts`; DELETE `fg/src/pipes/expression-view.pipe.ts`; DELETE `fg/src/pipes/when-expression.pipe.ts`; DELETE `fg/src/pipes/expression-pipes.spec.ts`
   - Xoá `SD_FORM_GENERIC_CONFIGURATION`/`IWorkflowConfigurationForm`; `configurations/index.ts` export breakpoints và `provideSdFormGeneric`.
   - `FormGenericService` đọc `SD_FORM_GENERIC_CONFIG`: templates, htmlDefinitions (mảng hoặc hàm/Promise như cũ), validators, tra catalog theo id; bỏ selections/tables/getValues/getLazyValues; cập nhật spec.
   - `SdFormRenderService.viewEntities(schema, entities)`: duyệt `sdSchemaFields`, bỏ upload/html, nhãn catalog lấy qua catalog của provider, định dạng bằng `sdDisplayValue`; tạo spec (AC-016).
   - Pipes: `ComponentViewedPipe` gọi `sdDisplayValue`; `HtmlPipe`/`HyperlinkPipe` theo field mới; xoá 4 pipe expression và spec của chúng.
   - Xác nhận `git grep -n HttpClient -- versions/v19/projects/sdcorejs-angular/components/form-generic` không có kết quả.
   - Từ task này tới hết TASK-022 thư viện chưa biên dịch được; Karma chỉ chạy lại ở TASK-022 (xem mục Rủi ro).
   - Bằng chứng: EVIDENCE-014 — Spec services/pipes pass ở lượt Karma của TASK-022; grep HttpClient rỗng.
   - Phụ thuộc: TASK-013 · Căn cứ: R-006, R-009, D-006, D-008 · Bảo vệ: INV-009

15. **TASK-015** `EDIT` sdcorejs-angular:fg/src/presets/form-generic-presets.ts (+1 file) — Chuyển preset validation sang tên mới. Giữ nguyên hành vi preset với shape validation chuẩn hoá (R-004).
   - File: EDIT `fg/src/presets/form-generic-presets.ts`; EDIT `fg/src/presets/form-generic-presets.spec.ts`
   - Đổi sang `minLength`, `maxLength`, `pattern { value, message }`, `maxItems`, `phoneCountry`; giữ nguyên validator email, phone (VN và quốc tế), url, integer, decimal, currency, percent.
   - Cập nhật spec hiện có (đang là test đặc tả hành vi) sang input mới, không nới kỳ vọng.
   - Bằng chứng: EVIDENCE-015 — Spec preset pass ở lượt Karma của TASK-022.
   - Phụ thuộc: TASK-014 · Căn cứ: R-004 · Bảo vệ: không

16. **TASK-016** `EDIT` sdcorejs-angular:fg/src/components/form-render/form-render.component.ts (+8 file) — Viết lại lõi sd-form-render. API [schema] [(value)] [form] [variables] [viewed] [breakpoint] [labelPlacement] [keys]; không mutate; bố cục 3 mức.
   - File: EDIT `fg/src/components/form-render/form-render.component.ts`; EDIT `fg/src/components/form-render/form-render.component.html`; EDIT `fg/src/components/form-render/form-render.component.scss`; EDIT `fg/src/components/form-render/form-render.component.spec.ts`; EDIT `fg/src/components/form-render/form-render.context.ts`; EDIT `fg/src/components/form-render/components/index.ts`; DELETE `fg/src/components/form-render/components/variable/variable.component.ts`; DELETE `fg/src/components/form-render/components/variable/variable.component.html`; DELETE `fg/src/components/form-render/components/variable/variable.component.spec.ts`
   - Input signal: `schema` (required), `value = model()`, `form` (mặc định FormGroup riêng), `variables`, `viewed`, `breakpoint` (null = đo), `labelPlacement`, `keys`; bỏ `[configuration]`, `[entity]`, `[defaultEntity]`, `[properties]`, `setVariables`, `getValidationMessages()`, `onLoaded` (D-022).
   - Mức hiện hành = `breakpoint()` ?? đo bằng ResizeObserver trên lưới (giữ cơ chế hiện có) qua `sdResolveBreakpoint` với breakpoints của provider; hàng = `sdPackRows`; group dùng `sd-section` (icon, iconColor theo `color`, collapsible); phần tử type lạ bị bỏ qua, cảnh báo một lần ở dev mode.
   - Giá trị: không mutate `schema`/`value`/`variables`; `sdApplyDefaults` khi không viewed; mỗi thay đổi control phát object mới, không debounce; `validate()` markAllAsTouched → validator field → `sdRunFormValidations`; `upload()` gọi upload của từng item với params đã giải rồi ghi kết quả vào value.
   - `FormRenderContext` giữ labelPlacement, viewed, scope (value + variables), level; provide `FormRenderCatalog` ở component; xoá `VariableComponent`.
   - Viết lại spec (post-hoc theo D-011): AC-002 (host 1100/800/480px), AC-003 (provider tablet 700, form 650px), AC-005, AC-006, AC-009 (deep-freeze, tham chiếu mới), AC-010, AC-011, phần tử type lạ.
   - Bằng chứng: EVIDENCE-016 — Spec sd-form-render pass ở lượt Karma của TASK-022.
   - Phụ thuộc: TASK-014, TASK-015 · Căn cứ: R-002, R-003, R-007, D-003, D-004, D-007, D-014, D-016, D-017, D-020, D-022 · Bảo vệ: INV-001, INV-002, INV-003, INV-006

17. **TASK-017** `EDIT` sdcorejs-angular:fg/src/components/form-render/components/item/item.component.ts (+31 file) — Chuyển lib-item và 11 field của renderer. Field đọc rules/validation/options mới; catalog qua FormRenderCatalog; bỏ table.
   - File: EDIT `fg/src/components/form-render/components/item/item.component.ts`; EDIT `fg/src/components/form-render/components/item/item.component.html`; EDIT `fg/src/components/form-render/components/item/item.component.scss`; EDIT `fg/src/components/form-render/components/item/components/index.ts`; EDIT `fg/src/components/form-render/components/item/components/checkbox/checkbox.component.ts`; EDIT `fg/src/components/form-render/components/item/components/checkbox/checkbox.component.html`; EDIT `fg/src/components/form-render/components/item/components/chip-calendar/chip-calendar.component.ts`; EDIT `fg/src/components/form-render/components/item/components/chip-calendar/chip-calendar.component.html`; EDIT `fg/src/components/form-render/components/item/components/chip-string/chip-string.component.ts`; EDIT `fg/src/components/form-render/components/item/components/chip-string/chip-string.component.html`; EDIT `fg/src/components/form-render/components/item/components/datetime/datetime.component.ts`; EDIT `fg/src/components/form-render/components/item/components/datetime/datetime.component.html`; EDIT `fg/src/components/form-render/components/item/components/html/html.component.ts`; EDIT `fg/src/components/form-render/components/item/components/html/html.component.html`; EDIT `fg/src/components/form-render/components/item/components/number/number.component.ts`; EDIT `fg/src/components/form-render/components/item/components/number/number.component.html`; EDIT `fg/src/components/form-render/components/item/components/radio/radio.component.ts`; EDIT `fg/src/components/form-render/components/item/components/radio/radio.component.html`; EDIT `fg/src/components/form-render/components/item/components/select/select.component.ts`; EDIT `fg/src/components/form-render/components/item/components/select/select.component.html`; EDIT `fg/src/components/form-render/components/item/components/textarea/textarea.component.ts`; EDIT `fg/src/components/form-render/components/item/components/textarea/textarea.component.html`; EDIT `fg/src/components/form-render/components/item/components/textfield/textfield.component.ts`; EDIT `fg/src/components/form-render/components/item/components/textfield/textfield.component.html`; EDIT `fg/src/components/form-render/components/item/components/upload/upload.component.ts`; EDIT `fg/src/components/form-render/components/item/components/upload/upload.component.html`; CREATE `fg/src/components/form-render/components/item/components/select/select.component.spec.ts`; EDIT `fg/src/components/form-render/form-render.presets.spec.ts`; DELETE `fg/src/components/form-render/components/item/components/table/table.component.ts`; DELETE `fg/src/components/form-render/components/item/components/table/table.component.html`; DELETE `fg/src/components/form-render/components/item/components/table/table.component.scss`; DELETE `fg/src/components/form-render/components/item/components/table/table.component.spec.ts`
   - `lib-item` nhận field, level và state (`sdElementState`); chỉ đăng ký control khi field hiện nên field ẩn không bị kiểm tra, giá trị cũ vẫn giữ; class cột theo `sdResolveSpan`.
   - Select/radio: options static giữ thứ tự; catalog qua `FormRenderCatalog` (params giải từ scope, tải lại khi params đổi, search khi catalog có), `fill` ghi patch khi người dùng chọn; upload dùng params value ref; html dùng htmlDefinitions (static + variables, query + params); chỉ xem: hyperlink cho select/radio, password che.
   - Xoá field table (D-015); tạo `select.component.spec.ts` cho catalog (AC-008); cập nhật `form-render.presets.spec.ts` (AC-007).
   - Bằng chứng: EVIDENCE-017 — Spec field/preset/select pass ở lượt Karma của TASK-022.
   - Phụ thuộc: TASK-016 · Căn cứ: R-004, R-005, R-007, R-009, D-005, D-012, D-015 · Bảo vệ: INV-009

18. **TASK-018** `EDIT` sdcorejs-angular:fg/src/components/form-builder/state/builder-document.ts (+8 file) — Chuyển lớp state của builder. Document/layout/commands/store của builder làm việc trên SdFormGenericSchema.
   - File: EDIT `fg/src/components/form-builder/state/builder-document.ts`; EDIT `fg/src/components/form-builder/state/builder-layout.ts`; EDIT `fg/src/components/form-builder/state/builder-commands.ts`; EDIT `fg/src/components/form-builder/state/builder-palette.ts`; EDIT `fg/src/components/form-builder/state/builder-store.ts`; EDIT `fg/src/components/form-builder/state/builder-drag.ts`; EDIT `fg/src/components/form-builder/state/builder-state.spec.ts`; EDIT `fg/src/components/form-builder/state/builder-layout.spec.ts`; DELETE `fg/src/components/form-builder/state/builder-references.ts`
   - `builder-document`: document ↔ `SdFormGenericSchema` (`pages[0].elements`, `group.elements`), giữ phần tử type lạ nguyên vẹn khi nạp và phát, bỏ break, key duy nhất kể cả biến, giữ `randomKey`.
   - `builder-layout`: hàng lấy từ `sdPackRows` theo viewport; giữ `planDrop`/`hitTest`; resize ghi `sdWithSpan` của mức đang xem; ý định "hàng mới" dùng `newRow`.
   - `builder-commands`: `insertBreakAfter` → `toggleNewRow`, `setColumns` → `setSpan(level)`; mọi lệnh trả schema hợp lệ theo `sdValidateSchema`.
   - `builder-store`: viewport desktop | tablet | mobile; `load(schema)` bỏ qua khi `sdSameSchema` với bản vừa phát, khác nội dung thì nạp lại và reset lịch sử; không mutate schema nhận vào.
   - `builder-palette`/`builder-drag`: preset tạo field shape mới (options static `{ value, label }`, validation mới, layout span), bỏ break; xoá `builder-references.ts`; cập nhật hai spec state.
   - Bằng chứng: EVIDENCE-018 — Spec state của builder pass ở lượt Karma của TASK-022.
   - Phụ thuộc: TASK-017 · Căn cứ: R-001, R-008, D-002, D-013, D-017 · Bảo vệ: INV-001, INV-002, INV-004, INV-006

19. **TASK-019** `EDIT` sdcorejs-angular:fg/src/components/form-builder/components/attribute-expression/attribute-expression.component.ts (+32 file) — Chuyển các editor thuộc tính của builder. Điều kiện và validation lưu thẳng Filter; nguồn catalog dùng params/fill có cấu trúc.
   - File: EDIT `fg/src/components/form-builder/components/attribute-expression/attribute-expression.component.ts`; EDIT `fg/src/components/form-builder/components/attribute-expression/attribute-expression.component.html`; EDIT `fg/src/components/form-builder/components/attribute-expression/attribute-expression.component.scss`; EDIT `fg/src/components/form-builder/components/attribute-expression/attribute-expression.component.spec.ts`; DELETE `fg/src/components/form-builder/components/attribute-expression/form-expression-query-adapter.ts`; DELETE `fg/src/components/form-builder/components/attribute-expression/form-expression-query-adapter.spec.ts`; EDIT `fg/src/components/form-builder/components/configure-validation/configure-validation.component.ts`; EDIT `fg/src/components/form-builder/components/configure-validation/configure-validation.component.html`; EDIT `fg/src/components/form-builder/components/configure-validation/configure-validation.component.scss`; DELETE `fg/src/components/form-builder/components/expression-builder/expression-builder.component.ts`; DELETE `fg/src/components/form-builder/components/expression-builder/expression-builder.component.html`; DELETE `fg/src/components/form-builder/components/expression-builder/expression-builder.component.scss`; DELETE `fg/src/components/form-builder/components/expression-builder/expression-builder.component.spec.ts`; DELETE `fg/src/components/form-builder/components/attribute-selection/attribute-selection.component.ts`; DELETE `fg/src/components/form-builder/components/attribute-selection/attribute-selection.component.html`; EDIT `fg/src/components/form-builder/components/attribute-selection/components/build-queries/build-queries.component.ts`; EDIT `fg/src/components/form-builder/components/attribute-selection/components/build-queries/build-queries.component.html`; EDIT `fg/src/components/form-builder/components/attribute-selection/components/build-variables/build-variables.component.ts`; EDIT `fg/src/components/form-builder/components/attribute-selection/components/build-variables/build-variables.component.html`; EDIT `fg/src/components/form-builder/components/html/attribute/components/build-queries/build-queries.component.ts`; EDIT `fg/src/components/form-builder/components/html/attribute/components/build-queries/build-queries.component.html`; EDIT `fg/src/components/form-builder/components/attribute-parameter/attribute-parameter.component.ts`; EDIT `fg/src/components/form-builder/components/attribute-parameter/attribute-parameter.component.html`; EDIT `fg/src/components/form-builder/components/value-box/mapping-summary.ts`; EDIT `fg/src/components/form-builder/components/value-box/mapping-summary.spec.ts`; DELETE `fg/src/components/form-builder/components/attribute-table/attribute-table.component.ts`; DELETE `fg/src/components/form-builder/components/attribute-table/attribute-table.component.html`; DELETE `fg/src/components/form-builder/components/attribute-input/attribute-input.component.ts`; DELETE `fg/src/components/form-builder/components/attribute-input/attribute-input.component.html`; DELETE `fg/src/components/form-builder/components/attribute-select/attribute-select.component.ts`; DELETE `fg/src/components/form-builder/components/attribute-select/attribute-select.component.html`; DELETE `fg/src/components/form-builder/components/attribute-switch/attribute-switch.component.ts`; DELETE `fg/src/components/form-builder/components/attribute-switch/attribute-switch.component.html`
   - `attribute-expression` sửa và lưu thẳng `Filter` (bỏ adapter); danh sách field gồm field của schema và biến.
   - `configure-validation`: validation cấp form `filter` (sửa bằng attribute-expression) hoặc `function` (chọn validator của provider); xoá `expression-builder`.
   - Catalog: `build-queries` → `options.params` (tên theo `catalog.params`, giá trị value ref); `build-variables` → `options.fill` (field đích, `from` theo `catalog.fields`); html `build-queries` và `attribute-parameter` (upload params) dùng value ref; `mapping-summary` hiển thị value ref.
   - Xoá attribute-table, attribute-input, attribute-select, attribute-switch và `attribute-selection.component` (chỉ attribute-table còn dùng).
   - Bằng chứng: EVIDENCE-019 — Spec attribute-expression và mapping-summary pass ở lượt Karma của TASK-022.
   - Phụ thuộc: TASK-018 · Căn cứ: R-003, R-005, R-008, R-009, D-004, D-005, D-008, D-015 · Bảo vệ: INV-003, INV-005

20. **TASK-020** `EDIT` sdcorejs-angular:fg/src/components/form-builder/form-builder.component.ts (+22 file) — Chuyển giao diện sd-form-builder sang 3 viewport. [(schema)], Desktop | Tablet | Mobile, span theo mức, newRow, Xem trước ép mức.
   - File: EDIT `fg/src/components/form-builder/form-builder.component.ts`; EDIT `fg/src/components/form-builder/form-builder.component.html`; EDIT `fg/src/components/form-builder/form-builder.component.scss`; EDIT `fg/src/components/form-builder/form-builder.component.spec.ts`; EDIT `fg/src/components/form-builder/canvas/canvas.component.ts`; EDIT `fg/src/components/form-builder/canvas/canvas.component.html`; EDIT `fg/src/components/form-builder/canvas/canvas.component.scss`; EDIT `fg/src/components/form-builder/canvas/field-preview.component.ts`; EDIT `fg/src/components/form-builder/canvas/field-preview.component.html`; EDIT `fg/src/components/form-builder/canvas/drop-feedback.component.ts`; EDIT `fg/src/components/form-builder/inspector/inspector.component.ts`; EDIT `fg/src/components/form-builder/inspector/inspector.component.html`; EDIT `fg/src/components/form-builder/inspector/inspector.component.scss`; EDIT `fg/src/components/form-builder/inspector/options-editor.component.ts`; EDIT `fg/src/components/form-builder/inspector/options-editor.component.html`; EDIT `fg/src/components/form-builder/inspector/options-editor.component.spec.ts`; EDIT `fg/src/components/form-builder/palette/palette.component.ts`; EDIT `fg/src/components/form-builder/palette/palette.component.html`; EDIT `fg/src/components/form-builder/palette/structure.component.ts`; EDIT `fg/src/components/form-builder/palette/structure.component.html`; EDIT `fg/src/components/form-builder/preview/preview.component.ts`; EDIT `fg/src/components/form-builder/preview/preview.component.html`; EDIT `fg/src/components/form-builder/preview/preview.component.scss`
   - `sd-form-builder`: `schema = model()`, `getSchema()` trả clone; bỏ `[formGeneric]`, `(sdChange)`, `getForm()`; thanh công cụ Desktop | Tablet | Mobile.
   - Canvas: hàng và span theo viewport; tay nắm resize ghi mức đang xem; mức kế thừa hiện nhãn "Theo Desktop" (tablet) / "Mặc định" (mobile); dấu `newRow`; thẻ "chưa hỗ trợ" cho phần tử type lạ.
   - Inspector: tab Bố cục có span của mức đang xem, nút xoá về kế thừa và công tắc "Bắt đầu hàng mới" (thay nút ngắt dòng); tab Dữ liệu chọn nguồn static | catalog; tab Điều kiện dùng Filter; đổi mã dùng `sdFindKeyReferences`/`sdRenameKey`; options editor dùng `{ value, label, disabled? }`.
   - Xem trước: `sd-form-render [schema] [breakpoint]` theo viewport, khung tablet 768px, mobile 390px.
   - Cập nhật spec (post-hoc): AC-001, AC-012, AC-013, AC-014 (hàng canvas = hàng Xem trước ở 3 mức), AC-015, schema input deep-freeze không bị mutate.
   - Bằng chứng: EVIDENCE-020 — Spec sd-form-builder và options-editor pass ở lượt Karma của TASK-022.
   - Phụ thuộc: TASK-019 · Căn cứ: R-002, R-008, D-003, D-007 · Bảo vệ: INV-001, INV-002

21. **TASK-021** `EDIT` sdcorejs-angular:versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts (+4 file) — Cập nhật i18n 5 ngôn ngữ. Key mới cho 3 viewport, kế thừa span, newRow, catalog; bỏ key không còn dùng.
   - File: EDIT `versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts`; EDIT `versions/v19/projects/sdcorejs-angular/i18n/src/en.ts`; EDIT `versions/v19/projects/sdcorejs-angular/i18n/src/ko.ts`; EDIT `versions/v19/projects/sdcorejs-angular/i18n/src/ja.ts`; EDIT `versions/v19/projects/sdcorejs-angular/i18n/src/zh.ts`
   - Thêm: Tablet, "Theo Desktop", "Mặc định", "Bắt đầu hàng mới", nguồn static/catalog, params/fill, phần tử chưa hỗ trợ, validator chưa đăng ký.
   - Bỏ key của break, table, expression builder/feel và selection cũ; giữ cùng tập key ở vi/en/ko/ja/zh.
   - Bằng chứng: EVIDENCE-021 — `check:i18n` và `check:i18n-parity` pass ở TASK-025.
   - Phụ thuộc: TASK-020 · Căn cứ: R-010 · Bảo vệ: không

22. **TASK-022** `EDIT` sdcorejs-angular:fg/index.ts (+19 file) — Barrel, public API, dọn code cũ và đóng cửa sổ đỏ. Public API đúng C-001…C-006; thư viện và toàn bộ spec form-generic xanh.
   - File: EDIT `fg/index.ts`; EDIT `fg/src/components/index.ts`; EDIT `fg/src/models/index.ts`; CREATE `fg/src/public-api.spec.ts`; DELETE `fg/src/components/sd-feel-expression/sd-feel-expression.component.ts`; DELETE `fg/src/components/sd-feel-expression/sd-feel-expression.component.html`; DELETE `fg/src/components/sd-feel-expression/sd-feel-expression.component.scss`; DELETE `fg/src/components/sd-feel-expression/sd-feel-expression.component.spec.ts`; DELETE `fg/src/models/form-generic-component.model.ts`; DELETE `fg/src/models/form-generic-definition-html.model.ts`; DELETE `fg/src/models/form-generic-definition-selection.model.ts`; DELETE `fg/src/models/form-generic-definition-table.model.ts`; DELETE `fg/src/models/form-generic-expression.model.spec.ts`; DELETE `fg/src/models/form-generic-expression.model.ts`; DELETE `fg/src/models/form-generic-template.model.ts`; DELETE `fg/src/models/form-generic-validation.model.ts`; DELETE `fg/src/models/form-generic.model.ts`; DELETE `fg/src/models/form-render/form-render-args.model.ts`; DELETE `fg/src/models/form-render/form-render-entity.model.ts`; DELETE `fg/src/models/form-render/index.ts`
   - Entry `index.ts` export configurations (provider, breakpoints), type model mới, `SdFormRender`, `SdFormBuilder`, `SdFormRenderService`; `models/index.ts` chỉ `export type *` từ model mới; `components/index.ts` bỏ sd-feel-expression.
   - Xoá `sd-feel-expression` và 12 file model cũ.
   - Tạo `public-api.spec.ts`: export runtime của entry đúng bằng `SdFormRender`, `SdFormBuilder`, `SdFormRenderService`, `provideSdFormGeneric`, `SD_FORM_GENERIC_BREAKPOINTS`; không còn SdFeelExpression, sdEvaluateExpression, SD_ATTRIBUTE_OPERATORS, SD_DAY_INFO_*, SD_FORM_BUILDER_COMPONENTS, SD_COMPONENT_ICONS, SD_TABLE_COLUMN_TYPES, SD_FORM_GENERIC_CONFIGURATION, sdGenerateId, sdGenerateKey, sdFormatComponent.
   - Đóng cửa sổ đỏ: `npm run build` (v19) xanh, rồi focused Karma cho toàn module form-generic xanh; lỗi nào sửa ở file của task sở hữu.
   - Bằng chứng: EVIDENCE-022 — Build thư viện v19 xanh; toàn bộ spec form-generic pass (gồm public-api.spec.ts).
   - Phụ thuộc: TASK-021 · Căn cứ: R-001, R-010, D-001, D-008, D-022 · Bảo vệ: INV-003, INV-008

### Phase 4 - Tài liệu và showcase

23. **TASK-023** `EDIT` sdcorejs-angular:fg/sd-form-generic.md (+1 file) — Viết lại tài liệu và mục BREAKING. Tài liệu và CHANGELOG mô tả đúng schema mới trước bước kiểm chứng cuối.
   - File: EDIT `fg/sd-form-generic.md`; EDIT `CHANGELOG.md`
   - Viết lại `sd-form-generic.md`: cấu trúc schema, layout 3 mức và breakpoints, rules Filter, options static/catalog, provider, API render/builder, validate/upload, ví dụ.
   - CHANGELOG `[Unreleased]`: mục `### Changed (BREAKING for consumers)` có ví dụ trước/sau (schema, input/output, cấu hình) và danh sách export/thuộc tính bị bỏ (C-006, D-022); không ghi shim per-major.
   - Bằng chứng: EVIDENCE-023 — Rà soát thủ công sd-form-generic.md và mục BREAKING khớp public-api.spec.ts.
   - Phụ thuộc: TASK-022 · Căn cứ: R-010, D-001, D-010, D-022 · Bảo vệ: INV-008

24. **TASK-024** `EDIT` sdcorejs-angular:showcase/src/app/pages/components/form-generic/form-generic-demo.component.ts (+3 file) — Showcase trên schema mới và ảnh chụp thật. Demo chạy schema mới; ảnh builder/renderer ở 3 mức làm bằng chứng AC-019.
   - File: EDIT `showcase/src/app/pages/components/form-generic/form-generic-demo.component.ts`; EDIT `showcase/src/app/pages/components/form-generic/form-generic-demo.component.spec.ts`; EDIT `showcase/src/app/docs/generated/example-manifest.generated.ts`; EDIT `showcase/src/app/docs/generated/example-sources.generated.ts`
   - Demo dùng `[(schema)]`, `[(value)]`, span 3 mức, `newRow`, rules Filter, options static (showcase không đăng ký catalog); cập nhật spec demo.
   - `npm run build` (v19) → `npm run generate:showcase-examples` → showcase test.
   - Chụp ảnh thật trên showcase dev server bằng Playwright: builder ở Desktop/Tablet/Mobile (span theo mức, nhãn kế thừa, newRow) và renderer ở form rộng 1100/800/480px; console không có lỗi; xoá `.playwright-mcp/` sau khi chụp.
   - Bằng chứng: EVIDENCE-024 — Showcase test pass; bộ ảnh builder 3 viewport + renderer 3 bề rộng; log console sạch.
   - Phụ thuộc: TASK-023 · Căn cứ: R-008, R-010, R-011, D-011 · Bảo vệ: không

### Phase 5 - Kiểm chứng và rollout

25. **TASK-025** `VERIFY` sdcorejs-angular:versions/v19/projects/sdcorejs-angular/karma.conf.js — Kiểm chứng toàn bộ v19. Full suite có coverage và các guard của repo xanh trước rollout.
   - File: VERIFY `versions/v19/projects/sdcorejs-angular/karma.conf.js`
   - Full suite v19 có coverage (threshold trong `karma.conf.js`), lint, `check:i18n`, `check:i18n-parity`, `check:scss-hex`, `test:scripts`.
   - Lỗi nào quay về task sở hữu file để sửa rồi chạy lại; không skip test, không nới assertion.
   - Bằng chứng: EVIDENCE-025 — Full suite + coverage, lint, i18n, parity, scss-hex, test:scripts đều pass.
   - Phụ thuộc: TASK-024 · Căn cứ: R-011, D-011, D-021 · Bảo vệ: không

26. **TASK-026** `VERIFY-THEN-EDIT` sdcorejs-angular:versions/v19/SYNC-STATUS.md (+3 file) — Rollout v20/v21/v22 và giữ LF cho v22. Chỉ đổi v20–v22 bằng `npm run sync`; check:sync xanh; v22 LF.
   - File: EDIT `versions/v19/SYNC-STATUS.md`; EDIT `versions/v20/**`; EDIT `versions/v21/**`; EDIT `versions/v22/**`
   - Đóng tiến trình giữ file v22 theo chẩn đoán TASK-001, rồi `npm run sync`.
   - Chuyển mọi file v22 có working copy CRLF về LF (danh sách từ `git ls-files --eol`, thêm file mới untracked; mở bằng tiền tố `\\?\` cho đường dẫn dài); xác nhận `git ls-files --eol -- versions/v22` không còn `w/crlf`.
   - `npm run check:sync`; build v20, v21, v22.
   - Không commit, không push, không tag, không publish, không deploy.
   - Bằng chứng: EVIDENCE-026 — check:sync pass; v22 không còn CRLF; build v20/v21/v22 xanh.
   - Phụ thuộc: TASK-025 · Căn cứ: R-011, D-010 · Bảo vệ: INV-007

## Acceptance mapping

- AC-001 -> TASK-002, TASK-003, TASK-018, TASK-020, TASK-022 (bằng chứng: EVIDENCE-002, EVIDENCE-003, EVIDENCE-018, EVIDENCE-020, EVIDENCE-022)
- AC-002 -> TASK-004, TASK-005, TASK-016 (bằng chứng: EVIDENCE-004, EVIDENCE-005, EVIDENCE-016)
- AC-003 -> TASK-004, TASK-005, TASK-012, TASK-013, TASK-016 (bằng chứng: EVIDENCE-004, EVIDENCE-005, EVIDENCE-012, EVIDENCE-013, EVIDENCE-016)
- AC-004 -> TASK-004, TASK-005, TASK-018 (bằng chứng: EVIDENCE-004, EVIDENCE-005, EVIDENCE-018)
- AC-005 -> TASK-006, TASK-007, TASK-016, TASK-019 (bằng chứng: EVIDENCE-006, EVIDENCE-007, EVIDENCE-016, EVIDENCE-019)
- AC-006 -> TASK-008, TASK-009, TASK-016 (bằng chứng: EVIDENCE-008, EVIDENCE-009, EVIDENCE-016)
- AC-007 -> TASK-015, TASK-017 (bằng chứng: EVIDENCE-015, EVIDENCE-017)
- AC-008 -> TASK-006, TASK-007, TASK-012, TASK-013, TASK-017 (bằng chứng: EVIDENCE-006, EVIDENCE-007, EVIDENCE-012, EVIDENCE-013, EVIDENCE-017)
- AC-009 -> TASK-006, TASK-007, TASK-016 (bằng chứng: EVIDENCE-006, EVIDENCE-007, EVIDENCE-016)
- AC-010 -> TASK-004, TASK-005, TASK-016 (bằng chứng: EVIDENCE-004, EVIDENCE-005, EVIDENCE-016)
- AC-011 -> TASK-006, TASK-007, TASK-016, TASK-017 (bằng chứng: EVIDENCE-006, EVIDENCE-007, EVIDENCE-016, EVIDENCE-017)
- AC-012 -> TASK-004, TASK-005, TASK-018, TASK-020 (bằng chứng: EVIDENCE-004, EVIDENCE-005, EVIDENCE-018, EVIDENCE-020)
- AC-013 -> TASK-002, TASK-003, TASK-018, TASK-020 (bằng chứng: EVIDENCE-002, EVIDENCE-003, EVIDENCE-018, EVIDENCE-020)
- AC-014 -> TASK-004, TASK-005, TASK-020 (bằng chứng: EVIDENCE-004, EVIDENCE-005, EVIDENCE-020)
- AC-015 -> TASK-008, TASK-009, TASK-019, TASK-020 (bằng chứng: EVIDENCE-008, EVIDENCE-009, EVIDENCE-019, EVIDENCE-020)
- AC-016 -> TASK-010, TASK-011, TASK-014 (bằng chứng: EVIDENCE-010, EVIDENCE-011, EVIDENCE-014)
- AC-017 -> TASK-022, TASK-023 (bằng chứng: EVIDENCE-022, EVIDENCE-023)
- AC-018 -> TASK-025, TASK-026 (bằng chứng: EVIDENCE-025, EVIDENCE-026)
- AC-019 -> TASK-024 (bằng chứng: EVIDENCE-024)

## Invariant enforcement

- INV-001 -> TASK-007, TASK-016, TASK-018, TASK-020 (bằng chứng: EVIDENCE-016, EVIDENCE-018)
- INV-002 -> TASK-005, TASK-016, TASK-018, TASK-020 (bằng chứng: EVIDENCE-005, EVIDENCE-020)
- INV-003 -> TASK-007, TASK-009, TASK-016, TASK-019, TASK-022 (bằng chứng: EVIDENCE-007, EVIDENCE-016)
- INV-004 -> TASK-003, TASK-018 (bằng chứng: EVIDENCE-003, EVIDENCE-018)
- INV-005 -> TASK-003, TASK-009, TASK-019 (bằng chứng: EVIDENCE-009)
- INV-006 -> TASK-003, TASK-016, TASK-018 (bằng chứng: EVIDENCE-003, EVIDENCE-016, EVIDENCE-018)
- INV-007 -> TASK-001, TASK-026 (bằng chứng: EVIDENCE-026)
- INV-008 -> TASK-022, TASK-023 (bằng chứng: EVIDENCE-022)
- INV-009 -> TASK-013, TASK-014, TASK-017 (bằng chứng: EVIDENCE-013, EVIDENCE-014)

## Frontend architecture plan

### Project conventions detected
- component_style: Angular 19 standalone, OnPush, signal API (input/model/output/computed/effect); một số field cũ còn @Input setter và được chuyển dần.
- folder_convention: Secondary entry point components/form-generic với src/{models,configurations,services,pipes,presets,components}; builder chia feature-local state/, canvas/, inspector/, palette/, preview/, components/; selector nội bộ fb-* và lib-*.
- state_convention: Signals; FormBuilderStore provide ở component (mỗi builder một store) kèm history; renderer dùng Reactive Forms FormGroup + signals.
- service_data_access_convention: Không có HTTP; dữ liệu portal qua token cấu hình DI (SD_FORM_GENERIC_CONFIGURATION cũ → provideSdFormGeneric mới); FormGenericService providedIn root đọc token.
- registration_provider_convention: Standalone imports; provider ở component (FormRenderContext, FormBuilderStore, BuilderDragService); cấu hình app bằng hàm provideSd* trả EnvironmentProviders (provideSdApiContract, provideSdIcon).
- public_api_barrel_convention: index.ts + ng-package.json của entry point; barrel index.ts mỗi thư mục; export type * cho type; symbol nội bộ không export.
- test_convention: Karma + Jasmine, spec đặt cạnh file; TestBed cho component, spec thuần không TestBed; ChromeHeadlessCI; threshold coverage trong karma.conf.js; tsconfig.spec.json đưa mọi source vào chương trình TypeScript.
- evidence_inspected: `fg/index.ts`, `fg/src/components/form-render/form-render.component.ts`, `fg/src/components/form-render/form-render.context.ts`, `fg/src/components/form-builder/inspector/inspector.component.ts`, `fg/src/components/form-builder/state/builder-store.ts`, `fg/src/configurations/form-generic.configuration.ts`, `fg/src/services/form-generic.service.ts`, `fg/src/services/form-render.service.ts`, `fg/src/models/form-generic-component.model.ts`, `versions/v19/projects/sdcorejs-angular/components/api-contract-builder/src/api-contract.configuration.ts`, `versions/v19/projects/sdcorejs-angular/modules/icon/src/icon.provider.ts`, `versions/v19/projects/sdcorejs-angular/tsconfig.spec.json`, `versions/v19/angular.json`, `showcase/src/app/pages/components/form-generic/form-generic-demo.component.ts`

### Reuse decisions

| Need | Existing symbol/path | Decision | Reason and compatibility | Ownership |
|---|---|---|---|---|
| Đánh giá điều kiện | @sdcorejs/utils FilterUtilities.evaluate | wrap | Một evaluator sdEvaluateFilter bọc thư viện, bù toán tử thiếu tại một chỗ (INV-003). | feature-private |
| Sửa điều kiện | sd-query-builder (Core) | reuse | Cùng định dạng Filter; không còn sd-feel-expression. | feature-private |
| Khung group | SdSection (@sdcorejs/angular/components/section) | reuse | Đã có icon, iconColor, collapsible. | feature-private |
| Đo bề rộng form | ResizeObserver trong form-render.component.ts | extend | Tổng quát từ 2 mức lên 3 mức; không dùng viewport màn hình. | feature-private |
| Xếp hàng lưới 12 cột | buildRows trong state/builder-layout.ts | create_shared | Tách thành layout/form-generic-layout.ts dùng chung cho canvas và renderer (INV-002); chia sẻ trong module, không public. | feature-private |
| Tìm/đổi tham chiếu key | state/builder-references.ts | create_shared | Chuyển sang rules/form-generic-references.ts thuần, dùng cho inspector và test. | feature-private |
| Định dạng giá trị chỉ xem | pipes/component-viewed.pipe.ts | create_shared | Logic chuyển vào rules/form-generic-display.ts; pipe và SdFormRenderService gọi lại. | feature-private |
| Đệm dữ liệu catalog | none (FormGenericService đệm toàn cục) | create_feature_local | FormRenderCatalog theo từng renderer (D-019). | feature-private |
| Xác nhận đổi mã / toast hoàn tác | SdConfirmService, SdNotifyService | reuse | Đã dùng ở builder. | feature-private |
| Nút Desktop | Tablet | Mobile | thanh công cụ trong form-builder.component.html | keep_inline | Ba nút, không có state riêng. | feature-private |

### Component tree

```text
<sd-form-render> (public) — providers: FormRenderContext, FormRenderCatalog
  <sd-section> cho mỗi group (Core, reuse)
    <lib-item> cho mỗi field → <lib-textfield|textarea|number|select|radio|checkbox|datetime|chip-string|chip-calendar|upload|html>
<sd-form-builder> (public) — providers: FormBuilderStore, BuilderDragService
  <fb-palette> + <fb-structure>
  <fb-canvas> → <fb-field-preview>, <fb-drop-indicator>, <fb-drop-status>
  <fb-inspector> → <fb-options-editor>, <fb-toggle-row>, attribute-expression, params/fill editors, attribute-parameter, html build-queries
  <fb-preview> → <sd-form-render [breakpoint]>
  configure-validation (dialog)
```

### Responsibility and state ownership

| Unit | State owner |
|---|---|
| SdFormRender | value (model), FormGroup nội bộ hoặc [form] của consumer, mức breakpoint đo được |
| FormRenderCatalog | kết quả load/search catalog theo khoá id + params của một renderer |
| FormBuilderStore | schema đang thiết kế, selection, viewport, lịch sử undo/redo |
| Consumer | [variables], [schema] của renderer, [(schema)] của builder |

### Service and data flow

```text
consumer [schema]/[(value)]/[variables] → SdFormRender → sdNormalizeSchema → sdPackRows(level) → lib-item (sdElementState(scope)) → FormControl → valueChange (object mới)
lib-select (catalog) → sdResolveParams(scope) → FormRenderCatalog.load/search → provider catalog.load/search → items → sdFillPatch → value
validate() → field validators + sdRunFormValidations(validations, scope, provider validators) → { valid, messages }
SdFormBuilder [(schema)] → FormBuilderStore (document) → sdPackRows(viewport) cho canvas; preview → SdFormRender [breakpoint]=viewport
```

| Symbol | Lifecycle/provider scope | Reason |
|---|---|---|
| FormGenericService | app | Đọc cấu hình portal không có state thay đổi theo form. |
| SdFormRenderService | app | API public viewEntities, không state. |
| FormRenderCatalog | component | Bộ đệm phải reset theo vòng đời từng renderer. |
| FormRenderContext | component | Ngữ cảnh trình bày của một renderer. |
| FormBuilderStore | component | Mỗi builder một tài liệu và lịch sử. |
| models/layout/rules | pure_function | Không vòng đời, không DI (D-018). |

### Declarations and registration

| Symbol | Private/public scope | Mechanism |
|---|---|---|
| SdFormRender, SdFormBuilder | public | standalone component, export từ entry index.ts |
| provideSdFormGeneric | public | EnvironmentProviders trong app config/route providers của portal |
| FormRenderCatalog, FormRenderContext | private | providers của sd-form-render |
| FormBuilderStore, BuilderDragService | private | providers của sd-form-builder |
| fb-*, lib-* | private | imports của component cha |

### Files
- create: `fg/src/models/form-generic-*.model.ts (mới)` — SdFormGenericSchema, Page, Group, Field*, Layout, Rules, FieldValidation, Options, Option, ValueRef, Variable, Validation, Config, Catalog, CatalogItem, Template, HtmlDefinition, Validator (Hợp đồng C-001/C-004.)
- create: `fg/src/models/form-generic-schema.ts` — sdValidateSchema, sdNormalizeSchema, sdSchemaFields, sdSameSchema (Ngữ pháp thuần (INV-004, INV-006).)
- create: `fg/src/layout/form-generic-layout.ts` — sdResolveBreakpoint, sdResolveSpan, sdSpanSource, sdPackRows, sdWithSpan, sdWithNewRow (Nguồn layout duy nhất (INV-002).)
- create: `fg/src/rules/form-generic-{filter,values,validation,references,display}.ts` — sdEvaluateFilter, sdElementState, sdResolveValueRef, sdResolveParams, sdApplyDefaults, sdFillPatch, sdCatalogKey, sdValueKeys, sdRunFormValidations, sdFindKeyReferences, sdRenameKey, sdDisplayValue (Logic thuần có TDD (D-018).)
- create: `fg/src/configurations/form-generic.provider.ts` — SD_FORM_GENERIC_CONFIG (nội bộ), provideSdFormGeneric (C-004.)
- create: `fg/src/components/form-render/form-render-catalog.ts` — FormRenderCatalog (D-019.)
- delete: `fg/src/components/sd-feel-expression/**, expression-builder/**, attribute-table|input|select|switch/**, item/components/table/**, variable/**, pipes/expression-*.ts, models cũ` — SdFeelExpression và model expression cũ, table, VariableComponent (C-006, D-015, D-022.)
- Public exports: SdFormRender, SdFormBuilder, SdFormRenderService, provideSdFormGeneric, SD_FORM_GENERIC_BREAKPOINTS, type SdFormGenericBreakpoint, type SdFormGenericSchema và các type schema/field/config (C-001, C-004)

### Tests
- Page orchestration: form-render.component.spec.ts, form-builder.component.spec.ts; child contracts: select.component.spec.ts, options-editor.component.spec.ts, attribute-expression.component.spec.ts; mapping: rules/*.spec.ts, layout spec, models spec, display spec; provider scope: form-render-catalog.spec.ts (hai instance không chung bộ đệm), form-generic.provider.spec.ts.

### Decomposition rationale
- Ranh giới giữ theo cây hiện có vì mỗi vùng có state/ trách nhiệm riêng; logic dùng chung chuyển xuống module thuần thay vì thêm component; không thêm facade vì FormBuilderStore đã là coordinator; không promote gì ra shared Core UI vì chưa có consumer ngoài module.

## Verification

- `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include="**/form-generic/**/*.spec.ts"` (cwd `versions/v19`) — Toàn bộ spec form-generic; RED/GREEN dùng --include hẹp hơn tới đúng file spec.
- `fnm exec --using=22.22.3 npm.cmd run build` (cwd `versions/v19`) — Build thư viện — cổng đóng cửa sổ đỏ và điều kiện của showcase.
- `fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage` (cwd `versions/v19`) — Full suite có coverage (AC-018).
- `fnm exec --using=22.22.3 npm.cmd run lint` (cwd `versions/v19`) — AC-018.
- `fnm exec --using=22.22.3 npm.cmd run check:i18n` (cwd `versions/v19`) — AC-018.
- `fnm exec --using=22.22.3 npm.cmd run check:i18n-parity` (cwd `versions/v19`) — AC-018.
- `npm run check:scss-hex` (cwd `.`) — AC-018.
- `npm run generate:showcase-examples` (cwd `.`) — Sinh lại example sources của showcase.
- `fnm exec --using=22.22.3 npm.cmd test` (cwd `showcase`) — Spec showcase (AC-019).
- `npm run test:scripts` (cwd `.`) — Guard script của repo (showcase generators…).
- `npm run sync` (cwd `.`) — Rollout v19 → v20/v21/v22.
- `npm run check:sync` (cwd `.`) — AC-018, INV-007.
- `fnm exec --using=22.22.3 npm.cmd --prefix versions/v20 run build` (cwd `.`) — Biên dịch dưới Angular 20.
- `fnm exec --using=22.22.3 npm.cmd --prefix versions/v21 run build` (cwd `.`) — Biên dịch dưới Angular 21.
- `fnm exec --using=22.22.3 npm.cmd --prefix versions/v22 run build` (cwd `.`) — Biên dịch dưới Angular 22 (TypeScript mới hơn).

Bỏ qua có lý do:
- `npm run lint:release` — v20–v22 là bản sync của v19; lint v19 + check:sync đủ; không phải release.
- `Karma full suite của v20/v21/v22` — AC-018 chỉ yêu cầu v19; build v20–v22 bắt lỗi khác biệt theo Angular major.
- `powershell ./scripts/deploy.ps1 -DryRun, npm run build:page, npm run collect-release-docs` — Chỉ dùng khi release; 3.0 chưa phát hành, người dùng cấm publish/deploy.
- `npm ci ở các workspace` — Không đổi dependency; dùng node_modules đang có.

Luật ghi (không diễn đạt được bằng glob):
- versions/v20/**, versions/v21/**, versions/v22/** chỉ được đổi bằng `npm run sync` (TASK-026) và chuẩn hoá CRLF → LF cho v22; không sửa tay.
- `npm run sync` ghi lại package.json của v20–v22 từ v19; v19 package.json không đổi nên `git diff` của các file này phải rỗng.
- Trong versions/v19/projects/sdcorejs-angular chỉ sửa components/form-generic/** và 5 file i18n/src/*.ts.
- .sdcorejs/specs/** và .sdcorejs/architecture/** là snapshot đã duyệt, bất biến.

- Manual: Rà soát CHANGELOG/tài liệu (AC-017), kiểm LF của v22, ảnh chụp thật showcase (AC-019).
- Validation map: 27 dòng cho 19 AC (3 dòng thủ công); ranh giới `none` theo D-021.

## Rủi ro và cách xử lý

- **Cửa sổ biên dịch đỏ dài (phase 3)** → logic có TDD ở phase 2; task phase 3 chỉ nối dây; theo dõi lỗi bằng `npm run build`; TASK-022 là cổng xanh bắt buộc trước docs.
- **`FilterUtilities` thiếu toán tử (A-002)** → ma trận toán tử ở TASK-006; bù trong chính `sdEvaluateFilter`.
- **Sync lỗi file bị map và v22 CRLF** → chẩn đoán ở TASK-001; TASK-026 đóng tiến trình giữ file, chuẩn hoá LF, `check:sync`.
- **Máy dev quá tải / Karma chậm** → chạy focused trước, full suite một lần ở TASK-025; đo baseline khi thấy chậm bất thường.
- **Showcase dev server khởi động lâu** → build thư viện trước; chụp ảnh sau khi `Watching for file changes`.

## Self-review

- decision_coverage revision 3 (67 record): `validateDecisionCoverage(stage: plan)` hợp lệ, execution_ready.
- goal_backward_review: `validateGoalBackwardPlan` hợp lệ; 1 vòng tự phản biện, không còn blocker.
- validation_map: không có lỗi cấu trúc; blocker duy nhất khi chưa duyệt là `DECISION_COVERAGE_APPROVAL_INVALID` (decision coverage chỉ được ký duyệt cùng plan); thử với chữ ký tạm thì `approval_ready`.
- `validateArchitectureDraftPlanHandoff` hợp lệ; `frontend_architecture.conformance_invariant_refs` khớp architecture (INV-001, INV-002, INV-004, INV-006).
- `validateRepositoryPlan` hợp lệ; 25 đường dẫn CREATE chưa tồn tại, 109 EDIT và 47 DELETE đều tồn tại; mỗi đường dẫn thuộc đúng một task.

## Appendix — plan_context (machine-readable)

```json
{
 "schema_version": 2,
 "source": "sdcorejs-plan",
 "architecture_gate": {
  "valid": true,
  "required": true,
  "status": "required",
  "signals": ["persisted-data-model-contract","public-api-contract","state-data-ownership"],
  "bypass": null,
  "rationale": "Thay schema JSON mà consumer lưu trữ (persisted data model), đổi public API của sd-form-render/sd-form-builder/provider, và chuyển quyền sở hữu giá trị từ object entity bị mutate sang model value."
 },
 "architecture_context": {
  "schema_version": 1,
  "source": "sdcorejs-architecture",
  "contract_id": "form-generic-schema-v1",
  "requirement_id": "R-001",
  "approved_spec_reference": {
   "repository_id": "sdcorejs-angular",
   "artifact_id": "spec-form-generic-schema-v1-r1",
   "artifact_kind": "spec",
   "revision": "8812f188e71b5d1f6e47d7b2405552c85bc479b9",
   "approval_hash": "sha256:v1:6252cd8f9b48bce67af08815056bec87385a63169d7435edc81bcfbd881cb801"
  },
  "approved_architecture_path": ".sdcorejs/architecture/angular/2026-09-29-18-53-form-generic-schema-v1-phase-1.md",
  "approved_architecture_hash": "sha256:v1:db91ad7886d71be8e4549e37b69dbbca04584ae598fa287e8d0e877fd6948a09",
  "owner_repository_id": "sdcorejs-angular",
  "owner_module_id": "components/form-generic",
  "execution_host_repository_id": "sdcorejs-angular",
  "integration_owner_repository_id": "sdcorejs-angular",
  "trigger": {
   "required": true,
   "signals": ["persisted-data-model-contract","public-api-contract","state-data-ownership"],
   "rationale": "Thay schema JSON mà consumer lưu trữ (persisted data model), đổi public API của sd-form-render/sd-form-builder/provider, và chuyển quyền sở hữu giá trị từ object entity bị mutate sang model value."
  },
  "invariants": [
   {
    "id": "INV-001",
    "statement": "sd-form-render không bao giờ mutate schema, value hay variables được truyền vào; sd-form-builder không bao giờ mutate schema được truyền vào; mọi lần phát là object mới.",
    "scope": "Public API của sd-form-render và sd-form-builder",
    "rationale": "Chuyển quyền sở hữu giá trị từ entity bị ghi ngược sang model value (state-data-ownership).",
    "verification_method": "Test truyền input đã deep-freeze cho renderer và builder, thao tác người dùng, kiểm tra không lỗi và mỗi lần phát là tham chiếu mới.",
    "requirement_refs": ["R-007","R-008"],
    "decision_refs": ["D-007","D-020"],
    "owner": "sdcorejs-angular/components/form-generic"
   },
   {
    "id": "INV-002",
    "statement": "Chọn mức breakpoint, kế thừa span và xếp hàng (kể cả newRow) do một module layout thuần duy nhất đảm nhận; canvas và renderer cho cùng input + cùng mức luôn ra cùng các hàng.",
    "scope": "layout module, canvas, renderer",
    "rationale": "Builder chỉ đáng tin khi thấy sao ra vậy ở cả 3 mức.",
    "verification_method": "Test đơn vị layout cho 3 mức, kế thừa và newRow; test so sánh hàng của canvas và renderer trên cùng schema.",
    "requirement_refs": ["R-002","R-008"],
    "decision_refs": ["D-003","D-018"],
    "owner": "sdcorejs-angular/components/form-generic"
   },
   {
    "id": "INV-003",
    "statement": "Mọi điều kiện (rules) và validation cấp form dạng biểu thức đều là Filter, đánh giá bởi một evaluator duy nhất bọc FilterUtilities.evaluate trên { ...value, ...variables }; không còn định dạng biểu thức nào khác trong schema hay runtime.",
    "scope": "rules module, renderer, builder",
    "rationale": "Một định dạng với sd-query-builder, bỏ lớp chuyển đổi hai chiều.",
    "verification_method": "Ma trận test từng toán tử (so sánh, like, IN, BETWEEN, NULL, ngày tương đối, field–field) và test rules/validate() của renderer.",
    "requirement_refs": ["R-003"],
    "decision_refs": ["D-004","D-008"],
    "owner": "sdcorejs-angular/components/form-generic"
   },
   {
    "id": "INV-004",
    "statement": "Schema luôn đúng ngữ pháp: pages → (group | element), group chỉ chứa element, không có break, không có schemaVersion, key field duy nhất (kể cả so với biến); mọi lệnh của builder chỉ tạo ra schema hợp lệ.",
    "scope": "models (normalize/validate), builder commands",
    "rationale": "Schema là hợp đồng dữ liệu được lưu trữ (persisted-data-model).",
    "verification_method": "Test normalize/validate từ chối group lồng, break, schemaVersion, key trùng; test lệnh builder (thêm, kéo-thả, nhân bản, đổi mã) luôn trả schema hợp lệ.",
    "requirement_refs": ["R-001","R-008"],
    "decision_refs": ["D-001","D-002","D-013"],
    "owner": "sdcorejs-angular/components/form-generic"
   },
   {
    "id": "INV-005",
    "statement": "Mọi tham chiếu tới key field hoặc biến trong schema đều có cấu trúc (Filter.field và so sánh field–field, SdFormGenericValueRef, fill.field); chuỗi tự do chỉ còn ở hyperlink và nội dung html.",
    "scope": "models, rules (references), builder rename",
    "rationale": "Đổi mã phải cập nhật tham chiếu một cách chắc chắn.",
    "verification_method": "Test đổi mã cập nhật đủ mọi vị trí có cấu trúc và đếm đúng tham chiếu trong chuỗi tự do.",
    "requirement_refs": ["R-005","R-009"],
    "decision_refs": ["D-005","D-008"],
    "owner": "sdcorejs-angular/components/form-generic"
   },
   {
    "id": "INV-006",
    "statement": "Thêm type phần tử mới (đợt 2/3) không đổi shape của type đã có; phần tử có type lạ được renderer bỏ qua và được builder giữ nguyên khi phát lại.",
    "scope": "models, renderer, builder",
    "rationale": "Đợt 2/3 mở rộng schema mà không phá đợt 1 (D-017).",
    "verification_method": "Test nạp schema có phần tử type lạ: renderer không lỗi và bỏ qua; builder phát lại phần tử đó y nguyên.",
    "requirement_refs": ["R-001"],
    "decision_refs": ["D-017","D-010"],
    "owner": "sdcorejs-angular/components/form-generic"
   },
   {
    "id": "INV-007",
    "statement": "Chỉ sửa code ở versions/v19; v20/v21/v22 chỉ đổi qua npm run sync và check:sync luôn qua; v22 giữ LF.",
    "scope": "Các workspace của repository",
    "rationale": "Luật cứng của repo (CLAUDE.md).",
    "verification_method": "npm run check:sync xanh; git ls-files --eol không còn file CRLF trong v22.",
    "requirement_refs": ["R-011"],
    "decision_refs": ["D-010"],
    "owner": "sdcorejs-angular/components/form-generic"
   },
   {
    "id": "INV-008",
    "statement": "Public API của entry form-generic đúng bằng danh sách hợp đồng C-001…C-006; mọi export cũ bị bỏ đều được liệt kê trong mục BREAKING của CHANGELOG.",
    "scope": "components/form-generic/index.ts, CHANGELOG.md",
    "rationale": "Package public trên npm; thay đổi phải tường minh.",
    "verification_method": "Test liệt kê export của entry point so với danh sách hợp đồng; review CHANGELOG.",
    "requirement_refs": ["R-010"],
    "decision_refs": ["D-001","D-008"],
    "owner": "sdcorejs-angular/components/form-generic"
   },
   {
    "id": "INV-009",
    "statement": "Component không tự gọi HTTP; dữ liệu của portal chỉ đi qua callback trong provideSdFormGeneric (catalog.load/search, htmlDefinitions, validators, templates).",
    "scope": "renderer, builder, FormGenericService",
    "rationale": "Một điểm cấu hình; test được bằng provider giả.",
    "verification_method": "Test renderer/builder với provider giả kiểm tra params, fill, search; không có HttpClient trong form-generic.",
    "requirement_refs": ["R-005","R-006"],
    "decision_refs": ["D-006","D-019"],
    "owner": "sdcorejs-angular/components/form-generic"
   }
  ],
  "boundaries": [
   {
    "id": "B-001",
    "statement": "Chỉ sửa code ở versions/v19; v20–v22 qua npm run sync.",
    "invariant_refs": ["INV-007"]
   },
   {
    "id": "B-002",
    "statement": "models, layout, rules là TypeScript thuần (không DI, không DOM, không import từ components).",
    "invariant_refs": ["INV-002","INV-003","INV-004"]
   },
   {
    "id": "B-003",
    "statement": "form-render không import form-builder; form-builder chỉ dùng form-render cho Xem trước.",
    "invariant_refs": ["INV-001","INV-002"]
   },
   {
    "id": "B-004",
    "statement": "Dữ liệu của portal chỉ vào qua provideSdFormGeneric; không HttpClient trong form-generic.",
    "invariant_refs": ["INV-009"]
   }
  ],
  "dependency_directions": [
   {
    "from": "components/form-builder",
    "to": "components/form-render (Xem trước), models, layout, rules, sd-query-builder, các control Core",
    "rationale": "Builder dựng trên lõi thuần và dùng renderer thật để xem trước.",
    "invariant_refs": ["INV-002","INV-004"]
   },
   {
    "from": "components/form-render",
    "to": "models, layout, rules, FormGenericService, các control Core",
    "rationale": "Renderer không biết builder.",
    "invariant_refs": ["INV-001","INV-003"]
   },
   {
    "from": "rules",
    "to": "@sdcorejs/utils FilterUtilities",
    "rationale": "Một evaluator Filter duy nhất.",
    "invariant_refs": ["INV-003"]
   },
   {
    "from": "models",
    "to": "@sdcorejs/utils (chỉ type Filter)",
    "rationale": "Schema tham chiếu type Filter, không kéo runtime.",
    "invariant_refs": ["INV-004"]
   }
  ],
  "data_state_owners": [
   {
    "subject": "Giá trị form (value)",
    "owner_repository_id": "sdcorejs-angular",
    "owner": "sd-form-render (model value); consumer giữ qua two-way binding",
    "invariant_refs": ["INV-001"]
   },
   {
    "subject": "FormGroup và các control",
    "owner_repository_id": "sdcorejs-angular",
    "owner": "sd-form-render (hoặc FormGroup do consumer truyền qua [form])",
    "invariant_refs": ["INV-001"]
   },
   {
    "subject": "Schema đang thiết kế + lịch sử undo",
    "owner_repository_id": "sdcorejs-angular",
    "owner": "FormBuilderStore (mỗi instance builder một store)",
    "invariant_refs": ["INV-001","INV-004"]
   },
   {
    "subject": "Mức breakpoint hiện hành",
    "owner_repository_id": "sdcorejs-angular",
    "owner": "sd-form-render đo theo bề rộng form, trừ khi [breakpoint] do consumer/builder đặt",
    "invariant_refs": ["INV-002"]
   },
   {
    "subject": "Kết quả load catalog",
    "owner_repository_id": "sdcorejs-angular",
    "owner": "Từng instance sd-form-render (đệm theo catalog id + params)",
    "invariant_refs": ["INV-009"]
   },
   {
    "subject": "Giá trị biến",
    "owner_repository_id": "sdcorejs-angular",
    "owner": "Consumer qua [variables]",
    "invariant_refs": ["INV-003"]
   }
  ],
  "public_contracts": [
   {
    "id": "C-001",
    "kind": "persisted-data-model",
    "statement": "SdFormGenericSchema JSON: pages, group, field, layout, rules, validation, options, variables, validations; đợt 2/3 thêm type theo D-017.",
    "owner": "sdcorejs-angular/components/form-generic",
    "compatibility": "Phiên bản đầu tiên; không tương thích SdFormGeneric cũ (D-001).",
    "migration": "Không có hàm chuyển đổi; CHANGELOG mục BREAKING có ví dụ trước/sau.",
    "invariant_refs": ["INV-004","INV-005","INV-006"]
   },
   {
    "id": "C-002",
    "kind": "api",
    "statement": "sd-form-render: [schema], [(value)], [form], [variables], [viewed], [breakpoint], [labelPlacement], [keys], (sdAction); validate(), upload(); submit()/reset() từ đợt 2.",
    "owner": "sdcorejs-angular/components/form-generic",
    "compatibility": "BREAKING: thay [configuration], [entity], [defaultEntity], [properties], setVariables, getValidationMessages().",
    "migration": "CHANGELOG BREAKING + sd-form-generic.md.",
    "invariant_refs": ["INV-001","INV-002","INV-003"]
   },
   {
    "id": "C-003",
    "kind": "api",
    "statement": "sd-form-builder: [(schema)], getSchema().",
    "owner": "sdcorejs-angular/components/form-generic",
    "compatibility": "BREAKING: thay [formGeneric], (sdChange), getForm(), accessor components/variables/validations.",
    "migration": "CHANGELOG BREAKING + sd-form-generic.md.",
    "invariant_refs": ["INV-001","INV-004"]
   },
   {
    "id": "C-004",
    "kind": "api",
    "statement": "provideSdFormGeneric({ catalogs, templates, htmlDefinitions, validators, breakpoints }), các interface catalog/template/htmlDefinition/validator, SD_FORM_GENERIC_BREAKPOINTS, SdFormGenericBreakpoint.",
    "owner": "sdcorejs-angular/components/form-generic",
    "compatibility": "BREAKING: thay SD_FORM_GENERIC_CONFIGURATION.form (selections, getValues, getLazyValues, tables, htmls, validation).",
    "migration": "CHANGELOG BREAKING + ví dụ cấu hình mới.",
    "invariant_refs": ["INV-009","INV-002"]
   },
   {
    "id": "C-005",
    "kind": "api",
    "statement": "SdFormRenderService.viewEntities(schema, entities).",
    "owner": "sdcorejs-angular/components/form-generic",
    "compatibility": "Đổi kiểu tham số sang SdFormGenericSchema.",
    "migration": "CHANGELOG BREAKING.",
    "invariant_refs": ["INV-008"]
   },
   {
    "id": "C-006",
    "kind": "api",
    "statement": "Bỏ SdFeelExpression, model expression cũ (SdFormGenericExpression*, sdEvaluateExpression, sdExpressionToJavascriptExpression, sdTemplateToCondition, SD_ATTRIBUTE_OPERATORS, SD_DAY_INFO_*), SdFormGenericBreak, SD_FORM_BUILDER_COMPONENTS, SD_COMPONENT_ICONS, SD_TABLE_COLUMN_TYPES và các helper attribute cũ.",
    "owner": "sdcorejs-angular/components/form-generic",
    "compatibility": "BREAKING: gỡ khỏi public API.",
    "migration": "CHANGELOG liệt kê từng export bị bỏ và cách thay (sd-query-builder + Filter).",
    "invariant_refs": ["INV-008","INV-003"]
   }
  ],
  "security_trust_boundaries": [],
  "cross_repository_integration": [],
  "adopted_decision_refs": ["D-001","D-002","D-003","D-004","D-005","D-006","D-007","D-008","D-009","D-010","D-011","D-012","D-013","D-014","D-015","D-016","D-017","D-018","D-019","D-020"],
  "deferred_decision_refs": [],
  "assumption_refs": ["A-002","A-003","A-005"],
  "validation_obligations": [
   {
    "id": "VAL-001",
    "expected_proof": "Test deep-freeze cho renderer (schema, value, variables) và builder (schema); mỗi lần phát là tham chiếu mới.",
    "owner": "sdcorejs-execute-plan",
    "invariant_refs": ["INV-001"],
    "acceptance_criterion_refs": ["AC-009","AC-013"]
   },
   {
    "id": "VAL-002",
    "expected_proof": "Test đơn vị layout 3 mức, kế thừa span, newRow, ghi đè breakpoint, ép mức; test so sánh hàng canvas với renderer.",
    "owner": "sdcorejs-execute-plan",
    "invariant_refs": ["INV-002"],
    "acceptance_criterion_refs": ["AC-002","AC-003","AC-004","AC-010","AC-012","AC-014"]
   },
   {
    "id": "VAL-003",
    "expected_proof": "Ma trận toán tử Filter và test rules/validate() của renderer, kể cả biến và ngày tương đối.",
    "owner": "sdcorejs-execute-plan",
    "invariant_refs": ["INV-003"],
    "acceptance_criterion_refs": ["AC-005","AC-006"]
   },
   {
    "id": "VAL-004",
    "expected_proof": "Test normalize/validate từ chối group lồng, break, schemaVersion, key trùng; test lệnh builder luôn trả schema hợp lệ.",
    "owner": "sdcorejs-execute-plan",
    "invariant_refs": ["INV-004"],
    "acceptance_criterion_refs": ["AC-001"]
   },
   {
    "id": "VAL-005",
    "expected_proof": "Test đổi mã cập nhật mọi tham chiếu có cấu trúc và đếm tham chiếu chuỗi tự do.",
    "owner": "sdcorejs-execute-plan",
    "invariant_refs": ["INV-005"],
    "acceptance_criterion_refs": ["AC-015"]
   },
   {
    "id": "VAL-006",
    "expected_proof": "Test phần tử type lạ: renderer bỏ qua không lỗi; builder phát lại y nguyên.",
    "owner": "sdcorejs-execute-plan",
    "invariant_refs": ["INV-006"],
    "acceptance_criterion_refs": ["AC-001"]
   },
   {
    "id": "VAL-007",
    "expected_proof": "npm run check:sync xanh; không còn file CRLF trong v22.",
    "owner": "sdcorejs-execute-plan",
    "invariant_refs": ["INV-007"],
    "acceptance_criterion_refs": ["AC-018"]
   },
   {
    "id": "VAL-008",
    "expected_proof": "Test danh sách export của entry form-generic khớp C-001…C-006; CHANGELOG liệt kê export bị bỏ.",
    "owner": "sdcorejs-execute-plan",
    "invariant_refs": ["INV-008"],
    "acceptance_criterion_refs": ["AC-017"]
   },
   {
    "id": "VAL-009",
    "expected_proof": "Test renderer với provider giả: params đã giải, tải lại khi field nguồn đổi, fill, search; không có HttpClient trong module.",
    "owner": "sdcorejs-execute-plan",
    "invariant_refs": ["INV-009"],
    "acceptance_criterion_refs": ["AC-008"]
   }
  ],
  "profile_sections": {
   "frontend_architecture_ref": {
    "reference": "plan_context.frontend_architecture",
    "conformance_invariant_refs": ["INV-001","INV-002","INV-004","INV-006"]
   },
   "agent_architecture_ref": null
  },
  "change_control": {"revision":1,"supersedes":null}
 },
 "decision_coverage": {
  "schema_version": 1,
  "revision": 3,
  "records": [
   {
    "id": "R-001",
    "type": "requirement",
    "statement": "Schema gốc SdFormGenericSchema là phiên bản đầu tiên (không schemaVersion, không chuyển đổi từ SdFormGeneric cũ) theo ngữ pháp cố định Form → pages → group → element; phần tử phân loại bằng `type`; chừa sẵn shape cho static/button (đợt 2) và tabs/steps/table (đợt 3).",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": "components/form-generic",
    "task_refs": ["TASK-002","TASK-003","TASK-018","TASK-022"]
   },
   {
    "id": "R-002",
    "type": "requirement",
    "statement": "Bố cục responsive layout.span { desktop, tablet, mobile } (1–12) + newRow, theo SD_FORM_GENERIC_BREAKPOINTS = { tablet: 600, desktop: 1024 } đo trên bề rộng form; mặc định desktop 12, tablet theo desktop, mobile 12; ghi đè breakpoint qua provider; bỏ phần tử break.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": "components/form-generic",
    "task_refs": ["TASK-004","TASK-005","TASK-016","TASK-020"]
   },
   {
    "id": "R-003",
    "type": "requirement",
    "statement": "Điều kiện rules { visible, hidden, disabled, required } lưu bằng Filter của @sdcorejs/utils và đánh giá bằng FilterUtilities.evaluate trên giá trị form + biến; validation cấp form dùng Filter hoặc hàm đăng ký ở portal.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": "components/form-generic",
    "task_refs": ["TASK-006","TASK-007","TASK-008","TASK-009","TASK-016","TASK-019"]
   },
   {
    "id": "R-004",
    "type": "requirement",
    "statement": "Validation của field chuẩn hoá { required, min, max, minLength, maxLength, pattern { value, message }, maxItems, phoneCountry }; giữ nguyên các preset text (email, phone, url, password) và number (integer, decimal, currency, percent) cùng kiểm tra của chúng.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": "components/form-generic",
    "task_refs": ["TASK-003","TASK-015","TASK-017"]
   },
   {
    "id": "R-005",
    "type": "requirement",
    "statement": "Nguồn lựa chọn options = { source: static, items } | { source: catalog, catalog, params, fill } với SdFormGenericValueRef có cấu trúc; multiple là thuộc tính field; portal đăng ký catalog { id, label, params, fields, load, search? }.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": "components/form-generic",
    "task_refs": ["TASK-003","TASK-006","TASK-007","TASK-012","TASK-013","TASK-017","TASK-019"]
   },
   {
    "id": "R-006",
    "type": "requirement",
    "statement": "Cấu hình portal gom về provideSdFormGeneric({ catalogs, templates, htmlDefinitions, validators, breakpoints }) thay cho SD_FORM_GENERIC_CONFIGURATION.form cũ.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": "components/form-generic",
    "task_refs": ["TASK-012","TASK-013","TASK-014"]
   },
   {
    "id": "R-007",
    "type": "requirement",
    "statement": "sd-form-render có API [schema], [(value)] (model, không mutate input), [form], [variables], [viewed], [breakpoint], [labelPlacement], [keys]; method validate() trả { valid, messages } và upload(); defaultValue khai báo theo field.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": "components/form-generic",
    "task_refs": ["TASK-006","TASK-007","TASK-009","TASK-016","TASK-017"]
   },
   {
    "id": "R-008",
    "type": "requirement",
    "statement": "sd-form-builder có API [(schema)], thiết kế trên schema mới ngang tính năng hiện có cho các field và group; chế độ Desktop | Tablet | Mobile sửa span của mức đang xem, hiển thị mức kế thừa, newRow thay cho ngắt dòng; Xem trước dùng renderer với [breakpoint] ép mức.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": "components/form-generic",
    "task_refs": ["TASK-018","TASK-019","TASK-020","TASK-024"]
   },
   {
    "id": "R-009",
    "type": "requirement",
    "statement": "Giữ đủ chức năng hiện có trên model mới: biến, validation cấp form, templates, HTML definitions (biến, truy vấn), upload (loại, nguồn, định dạng, số file, dung lượng, tham số), hyperlink khi chỉ xem, labelPlacement, viewed, SdFormRenderService.viewEntities, đổi mã có cập nhật tham chiếu có cấu trúc.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": "components/form-generic",
    "task_refs": ["TASK-008","TASK-009","TASK-010","TASK-011","TASK-014","TASK-017","TASK-019"]
   },
   {
    "id": "R-010",
    "type": "requirement",
    "statement": "Bỏ sd-feel-expression, model expression cũ và phần tử break; CHANGELOG ghi mục BREAKING có ví dụ trước/sau; sd-form-generic.md viết lại cho schema mới; showcase chạy trên schema mới; i18n đủ 5 ngôn ngữ.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": "components/form-generic",
    "task_refs": ["TASK-021","TASK-022","TASK-023","TASK-024"]
   },
   {
    "id": "R-011",
    "type": "requirement",
    "statement": "Kiểm chứng: TDD cho phần logic, test sau cho giao diện kèm ảnh chụp thật; full suite v19 có coverage, lint, check:i18n, check:i18n-parity, check:scss-hex xanh; rollout v20/v21/v22 bằng npm run sync và check:sync xanh.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": "components/form-generic",
    "task_refs": ["TASK-001","TASK-024","TASK-025","TASK-026"]
   },
   {
    "id": "AC-001",
    "type": "acceptance-criterion",
    "statement": "Builder phát (schemaChange) sau một thay đổi của người dùng → JSON là SdFormGenericSchema hợp lệ: có pages, không có schemaVersion, không có phần tử break, mọi phần tử có id, field có key duy nhất",
    "behavior": "Builder phát (schemaChange) sau một thay đổi của người dùng",
    "expected_result": "JSON là SdFormGenericSchema hợp lệ: có pages, không có schemaVersion, không có phần tử break, mọi phần tử có id, field có key duy nhất",
    "verification_kind": "automated",
    "blocking": true,
    "requirement_refs": ["R-001"],
    "task_refs": ["TASK-002","TASK-003","TASK-018","TASK-020","TASK-022"],
    "evidence_refs": ["EVIDENCE-002","EVIDENCE-003","EVIDENCE-018","EVIDENCE-020","EVIDENCE-022"]
   },
   {
    "id": "AC-002",
    "type": "acceptance-criterion",
    "statement": "Renderer hiển thị field span { desktop: 6 } ở bề rộng form 1100px, 800px và 480px → Hai field/hàng ở 1100px và 800px (tablet kế thừa desktop); xếp chồng ở 480px (mobile mặc định 12)",
    "behavior": "Renderer hiển thị field span { desktop: 6 } ở bề rộng form 1100px, 800px và 480px",
    "expected_result": "Hai field/hàng ở 1100px và 800px (tablet kế thừa desktop); xếp chồng ở 480px (mobile mặc định 12)",
    "verification_kind": "automated",
    "blocking": true,
    "requirement_refs": ["R-002"],
    "task_refs": ["TASK-004","TASK-005","TASK-016"],
    "evidence_refs": ["EVIDENCE-004","EVIDENCE-005","EVIDENCE-016"]
   },
   {
    "id": "AC-003",
    "type": "acceptance-criterion",
    "statement": "Portal ghi đè breakpoints { tablet: 700 } rồi render form rộng 650px → Form dùng mức mobile; các giá trị không ghi đè giữ mặc định SD_FORM_GENERIC_BREAKPOINTS",
    "behavior": "Portal ghi đè breakpoints { tablet: 700 } rồi render form rộng 650px",
    "expected_result": "Form dùng mức mobile; các giá trị không ghi đè giữ mặc định SD_FORM_GENERIC_BREAKPOINTS",
    "verification_kind": "automated",
    "blocking": true,
    "requirement_refs": ["R-002"],
    "task_refs": ["TASK-004","TASK-005","TASK-012","TASK-013","TASK-016"],
    "evidence_refs": ["EVIDENCE-004","EVIDENCE-005","EVIDENCE-012","EVIDENCE-013","EVIDENCE-016"]
   },
   {
    "id": "AC-004",
    "type": "acceptance-criterion",
    "statement": "Một field có layout.newRow: true đứng sau field span 4 trong cùng group → Field đó bắt đầu hàng mới dù hàng trước còn chỗ; canvas và renderer xếp giống nhau",
    "behavior": "Một field có layout.newRow: true đứng sau field span 4 trong cùng group",
    "expected_result": "Field đó bắt đầu hàng mới dù hàng trước còn chỗ; canvas và renderer xếp giống nhau",
    "verification_kind": "automated",
    "blocking": true,
    "requirement_refs": ["R-002"],
    "task_refs": ["TASK-004","TASK-005","TASK-018"],
    "evidence_refs": ["EVIDENCE-004","EVIDENCE-005","EVIDENCE-018"]
   },
   {
    "id": "AC-005",
    "type": "acceptance-criterion",
    "statement": "Field có rules.visible là Filter { field: agree, operator: EQUAL, data: true }, rules.required dựa trên field khác và rules.disabled dựa trên biến → Ẩn/hiện, bắt buộc và vô hiệu đổi theo giá trị và biến ngay khi chúng thay đổi; field ẩn không bị kiểm tra; Filter ngày tương đối được hỗ trợ",
    "behavior": "Field có rules.visible là Filter { field: agree, operator: EQUAL, data: true }, rules.required dựa trên field khác và rules.disabled dựa trên biến",
    "expected_result": "Ẩn/hiện, bắt buộc và vô hiệu đổi theo giá trị và biến ngay khi chúng thay đổi; field ẩn không bị kiểm tra; Filter ngày tương đối được hỗ trợ",
    "verification_kind": "automated",
    "blocking": true,
    "requirement_refs": ["R-003"],
    "task_refs": ["TASK-006","TASK-007","TASK-016","TASK-019"],
    "evidence_refs": ["EVIDENCE-006","EVIDENCE-007","EVIDENCE-016","EVIDENCE-019"]
   },
   {
    "id": "AC-006",
    "type": "acceptance-criterion",
    "statement": "Gọi validate() khi có validation cấp form (Filter, alert error và warning) và một validator hàm đăng ký ở portal → Trả { valid, messages: { error[], warning[] } } — không bao giờ undefined; validator hàm nhận giá trị form; lỗi error làm valid = false",
    "behavior": "Gọi validate() khi có validation cấp form (Filter, alert error và warning) và một validator hàm đăng ký ở portal",
    "expected_result": "Trả { valid, messages: { error[], warning[] } } — không bao giờ undefined; validator hàm nhận giá trị form; lỗi error làm valid = false",
    "verification_kind": "automated",
    "blocking": true,
    "requirement_refs": ["R-003","R-007"],
    "task_refs": ["TASK-008","TASK-009","TASK-016"],
    "evidence_refs": ["EVIDENCE-008","EVIDENCE-009","EVIDENCE-016"]
   },
   {
    "id": "AC-007",
    "type": "acceptance-criterion",
    "statement": "Nhập giá trị sai cho các preset email, phone (VN và quốc tế), url, integer, decimal, currency, percent và các ràng buộc minLength/maxLength/pattern/maxItems → Mỗi trường báo đúng lỗi như bản hiện tại; password không bao giờ nhận defaultValue và hiển thị mặt nạ khi chỉ xem",
    "behavior": "Nhập giá trị sai cho các preset email, phone (VN và quốc tế), url, integer, decimal, currency, percent và các ràng buộc minLength/maxLength/pattern/maxItems",
    "expected_result": "Mỗi trường báo đúng lỗi như bản hiện tại; password không bao giờ nhận defaultValue và hiển thị mặt nạ khi chỉ xem",
    "verification_kind": "automated",
    "blocking": true,
    "requirement_refs": ["R-004"],
    "task_refs": ["TASK-015","TASK-017"],
    "evidence_refs": ["EVIDENCE-015","EVIDENCE-017"]
   },
   {
    "id": "AC-008",
    "type": "acceptance-criterion",
    "statement": "Select dùng options catalog với params [{ name: provinceId, value: { field: city } }] và fill [{ field: note, from: name }] → load() nhận params đã giải tham chiếu; đổi city thì tải lại danh mục; chọn một mục thì điền note; catalog có search thì tìm theo từ khoá; options static hiển thị items đúng thứ tự",
    "behavior": "Select dùng options catalog với params [{ name: provinceId, value: { field: city } }] và fill [{ field: note, from: name }]",
    "expected_result": "load() nhận params đã giải tham chiếu; đổi city thì tải lại danh mục; chọn một mục thì điền note; catalog có search thì tìm theo từ khoá; options static hiển thị items đúng thứ tự",
    "verification_kind": "automated",
    "blocking": true,
    "requirement_refs": ["R-005","R-006"],
    "task_refs": ["TASK-006","TASK-007","TASK-012","TASK-013","TASK-017"],
    "evidence_refs": ["EVIDENCE-006","EVIDENCE-007","EVIDENCE-012","EVIDENCE-013","EVIDENCE-017"]
   },
   {
    "id": "AC-009",
    "type": "acceptance-criterion",
    "statement": "Truyền [(value)] là object đã deep-freeze cùng schema có defaultValue rồi nhập dữ liệu → Không lỗi, input không bị sửa; valueChange phát object mới; defaultValue chỉ áp cho key chưa có giá trị và không áp ở chế độ chỉ xem",
    "behavior": "Truyền [(value)] là object đã deep-freeze cùng schema có defaultValue rồi nhập dữ liệu",
    "expected_result": "Không lỗi, input không bị sửa; valueChange phát object mới; defaultValue chỉ áp cho key chưa có giá trị và không áp ở chế độ chỉ xem",
    "verification_kind": "automated",
    "blocking": true,
    "requirement_refs": ["R-007"],
    "task_refs": ["TASK-006","TASK-007","TASK-016"],
    "evidence_refs": ["EVIDENCE-006","EVIDENCE-007","EVIDENCE-016"]
   },
   {
    "id": "AC-010",
    "type": "acceptance-criterion",
    "statement": "Đặt [breakpoint]=\"mobile\" cho renderer đang rộng 1200px, rồi đặt lại null → Bố cục dùng span mobile khi ép; khi null quay về mức đo theo bề rộng form",
    "behavior": "Đặt [breakpoint]=\"mobile\" cho renderer đang rộng 1200px, rồi đặt lại null",
    "expected_result": "Bố cục dùng span mobile khi ép; khi null quay về mức đo theo bề rộng form",
    "verification_kind": "automated",
    "blocking": true,
    "requirement_refs": ["R-007"],
    "task_refs": ["TASK-004","TASK-005","TASK-016"],
    "evidence_refs": ["EVIDENCE-004","EVIDENCE-005","EVIDENCE-016"]
   },
   {
    "id": "AC-011",
    "type": "acceptance-criterion",
    "statement": "Gọi upload() khi field upload có tệp chờ và có params tham chiếu field khác → Các tệp được tải lên với tham số đã giải tham chiếu và value nhận kết quả",
    "behavior": "Gọi upload() khi field upload có tệp chờ và có params tham chiếu field khác",
    "expected_result": "Các tệp được tải lên với tham số đã giải tham chiếu và value nhận kết quả",
    "verification_kind": "automated",
    "blocking": true,
    "requirement_refs": ["R-007","R-009"],
    "task_refs": ["TASK-006","TASK-007","TASK-016","TASK-017"],
    "evidence_refs": ["EVIDENCE-006","EVIDENCE-007","EVIDENCE-016","EVIDENCE-017"]
   },
   {
    "id": "AC-012",
    "type": "acceptance-criterion",
    "statement": "Trong builder chuyển sang Tablet và kéo resize một field từ 6 xuống 4, rồi xoá giá trị tablet ở inspector → Chỉ span.tablet đổi; desktop/mobile giữ nguyên; mức kế thừa hiện nhãn \"Theo Desktop\"; xoá thì quay về kế thừa",
    "behavior": "Trong builder chuyển sang Tablet và kéo resize một field từ 6 xuống 4, rồi xoá giá trị tablet ở inspector",
    "expected_result": "Chỉ span.tablet đổi; desktop/mobile giữ nguyên; mức kế thừa hiện nhãn \"Theo Desktop\"; xoá thì quay về kế thừa",
    "verification_kind": "automated",
    "blocking": true,
    "requirement_refs": ["R-008"],
    "task_refs": ["TASK-004","TASK-005","TASK-018","TASK-020"],
    "evidence_refs": ["EVIDENCE-004","EVIDENCE-005","EVIDENCE-018","EVIDENCE-020"]
   },
   {
    "id": "AC-013",
    "type": "acceptance-criterion",
    "statement": "Builder nhận lại đúng schema vừa phát ([(schema)] vòng về) rồi nhận một schema khác nội dung → Vòng về không reset lịch sử undo/selection; schema khác nội dung nạp lại và reset lịch sử",
    "behavior": "Builder nhận lại đúng schema vừa phát ([(schema)] vòng về) rồi nhận một schema khác nội dung",
    "expected_result": "Vòng về không reset lịch sử undo/selection; schema khác nội dung nạp lại và reset lịch sử",
    "verification_kind": "automated",
    "blocking": true,
    "requirement_refs": ["R-008"],
    "task_refs": ["TASK-002","TASK-003","TASK-018","TASK-020"],
    "evidence_refs": ["EVIDENCE-002","EVIDENCE-003","EVIDENCE-018","EVIDENCE-020"]
   },
   {
    "id": "AC-014",
    "type": "acceptance-criterion",
    "statement": "Bật \"Bắt đầu hàng mới\" ở tab Bố cục của một field và dùng Xem trước ở cả 3 mức → Canvas và Xem trước xếp hàng giống nhau ở từng mức; Xem trước ép đúng mức đang chọn",
    "behavior": "Bật \"Bắt đầu hàng mới\" ở tab Bố cục của một field và dùng Xem trước ở cả 3 mức",
    "expected_result": "Canvas và Xem trước xếp hàng giống nhau ở từng mức; Xem trước ép đúng mức đang chọn",
    "verification_kind": "automated",
    "blocking": true,
    "requirement_refs": ["R-008"],
    "task_refs": ["TASK-004","TASK-005","TASK-020"],
    "evidence_refs": ["EVIDENCE-004","EVIDENCE-005","EVIDENCE-020"]
   },
   {
    "id": "AC-015",
    "type": "acceptance-criterion",
    "statement": "Đổi mã một field được tham chiếu trong rules (Filter field và so sánh field–field), options.params, options.fill, upload params, html query và validation cấp form → Mọi tham chiếu có cấu trúc chuyển sang mã mới; tham chiếu trong chuỗi tự do (hyperlink, nội dung HTML) giữ nguyên và được đếm trong câu xác nhận",
    "behavior": "Đổi mã một field được tham chiếu trong rules (Filter field và so sánh field–field), options.params, options.fill, upload params, html query và validation cấp form",
    "expected_result": "Mọi tham chiếu có cấu trúc chuyển sang mã mới; tham chiếu trong chuỗi tự do (hyperlink, nội dung HTML) giữ nguyên và được đếm trong câu xác nhận",
    "verification_kind": "automated",
    "blocking": true,
    "requirement_refs": ["R-009"],
    "task_refs": ["TASK-008","TASK-009","TASK-019","TASK-020"],
    "evidence_refs": ["EVIDENCE-008","EVIDENCE-009","EVIDENCE-019","EVIDENCE-020"]
   },
   {
    "id": "AC-016",
    "type": "acceptance-criterion",
    "statement": "Gọi SdFormRenderService.viewEntities(schema, entities) → Trả giá trị hiển thị theo từng field (nhãn lựa chọn, ngày, số theo preset) giống bản hiện tại",
    "behavior": "Gọi SdFormRenderService.viewEntities(schema, entities)",
    "expected_result": "Trả giá trị hiển thị theo từng field (nhãn lựa chọn, ngày, số theo preset) giống bản hiện tại",
    "verification_kind": "automated",
    "blocking": true,
    "requirement_refs": ["R-009"],
    "task_refs": ["TASK-010","TASK-011","TASK-014"],
    "evidence_refs": ["EVIDENCE-010","EVIDENCE-011","EVIDENCE-014"]
   },
   {
    "id": "AC-017",
    "type": "acceptance-criterion",
    "statement": "Kiểm tra public API và tài liệu sau thay đổi → SdFeelExpression và các export expression cũ không còn; CHANGELOG [Unreleased] có mục BREAKING kèm ví dụ trước/sau; sd-form-generic.md mô tả schema mới",
    "behavior": "Kiểm tra public API và tài liệu sau thay đổi",
    "expected_result": "SdFeelExpression và các export expression cũ không còn; CHANGELOG [Unreleased] có mục BREAKING kèm ví dụ trước/sau; sd-form-generic.md mô tả schema mới",
    "verification_kind": "manual",
    "blocking": true,
    "requirement_refs": ["R-010"],
    "task_refs": ["TASK-022","TASK-023"],
    "evidence_refs": ["EVIDENCE-022","EVIDENCE-023"]
   },
   {
    "id": "AC-018",
    "type": "acceptance-criterion",
    "statement": "Chạy full suite v19 có coverage, lint, check:i18n, check:i18n-parity, check:scss-hex, rồi npm run sync và check:sync → Tất cả xanh; v22 giữ LF",
    "behavior": "Chạy full suite v19 có coverage, lint, check:i18n, check:i18n-parity, check:scss-hex, rồi npm run sync và check:sync",
    "expected_result": "Tất cả xanh; v22 giữ LF",
    "verification_kind": "automated",
    "blocking": true,
    "requirement_refs": ["R-011"],
    "task_refs": ["TASK-025","TASK-026"],
    "evidence_refs": ["EVIDENCE-025","EVIDENCE-026"]
   },
   {
    "id": "AC-019",
    "type": "acceptance-criterion",
    "statement": "Chụp ảnh thật builder ở Desktop/Tablet/Mobile và renderer ở 3 bề rộng form → Ảnh cho thấy span theo mức, nhãn kế thừa, newRow và không có lỗi console",
    "behavior": "Chụp ảnh thật builder ở Desktop/Tablet/Mobile và renderer ở 3 bề rộng form",
    "expected_result": "Ảnh cho thấy span theo mức, nhãn kế thừa, newRow và không có lỗi console",
    "verification_kind": "manual",
    "blocking": true,
    "requirement_refs": ["R-008","R-011"],
    "task_refs": ["TASK-024"],
    "evidence_refs": ["EVIDENCE-024"]
   },
   {
    "id": "A-001",
    "type": "assumption",
    "statement": "Chưa có consumer nào dùng schema SdFormGeneric hay API form-generic hiện tại.",
    "evidence_refs": [],
    "source": "explicit",
    "confidence": "medium",
    "status": "confirmed",
    "blocking": false,
    "consequence_if_wrong": "Consumer ẩn (package public trên npm) sẽ vỡ khi nâng lên 3.0.",
    "validation_method": "Mục BREAKING trong CHANGELOG kèm ví dụ trước/sau; người dùng xác nhận trong brainstorming.",
    "owner": "user",
    "rationale": "Người dùng xác nhận chưa ai dùng nên chấp nhận đổi toàn bộ schema.",
    "impacted_refs": ["R-001","R-010"]
   },
   {
    "id": "A-002",
    "type": "assumption",
    "statement": "FilterUtilities.evaluate của @sdcorejs/utils 1.1.4 xử lý đủ toán tử mà sd-query-builder sinh ra (so sánh, like, IN, BETWEEN, NULL, ngày tương đối, so sánh field–field).",
    "evidence_refs": [],
    "source": "inferred",
    "confidence": "medium",
    "status": "proposed",
    "blocking": false,
    "consequence_if_wrong": "Một số điều kiện không đánh giá đúng; cần lớp bù nhỏ trong module.",
    "validation_method": "Test TDD cho từng toán tử trước khi viết renderer.",
    "owner": "sdcorejs-execute-plan",
    "rationale": "d.ts công khai match/evaluate/resolveRelativeDate; hành vi chi tiết cần test xác nhận.",
    "impacted_refs": ["R-003"]
   },
   {
    "id": "A-003",
    "type": "assumption",
    "statement": "Code builder/renderer đang có trong working tree (các vòng rewrite trước, chưa commit) là nền cho đợt 1; phần tương tác kéo-thả, resize, lịch sử undo được giữ và chuyển sang model mới.",
    "evidence_refs": [],
    "source": "inferred",
    "confidence": "high",
    "status": "proposed",
    "blocking": false,
    "consequence_if_wrong": "Phải viết lại cả lớp tương tác, khối lượng tăng mạnh.",
    "validation_method": "Rà soát lúc lập plan; người dùng duyệt spec.",
    "owner": "user",
    "rationale": "Người dùng đã chốt tiếp tục trên nhánh hiện tại.",
    "impacted_refs": ["R-008"]
   },
   {
    "id": "A-004",
    "type": "assumption",
    "statement": "Kiểu checklist (có trong model cũ nhưng renderer chưa hỗ trợ) không nằm trong phiên bản đầu tiên; chọn nhiều dùng select multiple.",
    "evidence_refs": [],
    "source": "defaulted",
    "confidence": "medium",
    "status": "proposed",
    "blocking": false,
    "consequence_if_wrong": "Cần bổ sung kiểu checkbox-group sau.",
    "validation_method": "Người dùng duyệt spec.",
    "owner": "user",
    "rationale": "Renderer hiện không có component cho checklist nên không mất chức năng đang chạy.",
    "impacted_refs": ["R-001","R-009"]
   },
   {
    "id": "A-005",
    "type": "assumption",
    "statement": "Biến của form dùng chung không gian key với field (builder đã chặn trùng); Filter được đánh giá trên { ...value, ...variables }.",
    "evidence_refs": [],
    "source": "inferred",
    "confidence": "high",
    "status": "proposed",
    "blocking": false,
    "consequence_if_wrong": "Điều kiện tham chiếu biến bị đánh giá sai.",
    "validation_method": "Test TDD cho rules tham chiếu biến.",
    "owner": "sdcorejs-execute-plan",
    "rationale": "Builder hiện kiểm tra trùng giữa key field và key biến.",
    "impacted_refs": ["R-003","R-009"]
   },
   {
    "id": "D-001",
    "type": "decision",
    "statement": "Có giữ tương thích schema SdFormGeneric cũ? → Không — thiết kế lại toàn bộ, coi là phiên bản đầu tiên, không schemaVersion, không hàm chuyển đổi",
    "question": "Có giữ tương thích schema SdFormGeneric cũ?",
    "selected_value": "Không — thiết kế lại toàn bộ, coi là phiên bản đầu tiên, không schemaVersion, không hàm chuyển đổi",
    "source": "explicit-user",
    "status": "approved",
    "blocking": true,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Chưa có consumer; schema cũ lẫn string/number, expression riêng, break ẩn.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {"candidate":false,"category":null},
    "downstream_refs": ["R-001","R-010","AC-001","AC-017"],
    "task_refs": ["TASK-002","TASK-003","TASK-022","TASK-023"]
   },
   {
    "id": "D-002",
    "type": "decision",
    "statement": "Mô hình cấu trúc? → Cây có ngữ pháp cố định: Form → pages (single | tabs | steps) → group → element; group không lồng; tabs/steps chỉ ở cấp form",
    "question": "Mô hình cấu trúc?",
    "selected_value": "Cây có ngữ pháp cố định: Form → pages (single | tabs | steps) → group → element; group không lồng; tabs/steps chỉ ở cấp form",
    "source": "explicit-user",
    "status": "approved",
    "blocking": true,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Đủ cho Group/Tabs/Steps/Table mà độ phức tạp kéo-thả vẫn kiểm soát được.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {"candidate":false,"category":null},
    "downstream_refs": ["R-001","AC-001"],
    "task_refs": ["TASK-002","TASK-003","TASK-018"]
   },
   {
    "id": "D-003",
    "type": "decision",
    "statement": "Bố cục responsive? → span theo 3 mức desktop/tablet/mobile + newRow; SD_FORM_GENERIC_BREAKPOINTS = { tablet: 600, desktop: 1024 } đo trên bề rộng form; mặc định desktop 12, tablet theo desktop, mobile 12; ghi đè qua provider",
    "question": "Bố cục responsive?",
    "selected_value": "span theo 3 mức desktop/tablet/mobile + newRow; SD_FORM_GENERIC_BREAKPOINTS = { tablet: 600, desktop: 1024 } đo trên bề rộng form; mặc định desktop 12, tablet theo desktop, mobile 12; ghi đè qua provider",
    "source": "explicit-user",
    "status": "approved",
    "blocking": true,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Form nằm trong drawer/dialog phải theo bề rộng thật của form, không theo màn hình.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {"candidate":false,"category":null},
    "downstream_refs": ["R-002","AC-002","AC-003","AC-004","AC-010"],
    "task_refs": ["TASK-004","TASK-005","TASK-016","TASK-020"]
   },
   {
    "id": "D-004",
    "type": "decision",
    "statement": "Định dạng điều kiện? → rules { visible, hidden, disabled, required } và validation cấp form dùng Filter của @sdcorejs/utils",
    "question": "Định dạng điều kiện?",
    "selected_value": "rules { visible, hidden, disabled, required } và validation cấp form dùng Filter của @sdcorejs/utils",
    "source": "explicit-user",
    "status": "approved",
    "blocking": true,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Một định dạng duy nhất với sd-query-builder; có sẵn FilterUtilities.evaluate.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {"candidate":false,"category":null},
    "downstream_refs": ["R-003","AC-005","AC-006"],
    "task_refs": ["TASK-006","TASK-007","TASK-008","TASK-009","TASK-016","TASK-019"]
   },
   {
    "id": "D-005",
    "type": "decision",
    "statement": "Nguồn lựa chọn? → options { source: static, items } | { source: catalog, catalog, params, fill }; SdFormGenericValueRef có cấu trúc; multiple là thuộc tính field",
    "question": "Nguồn lựa chọn?",
    "selected_value": "options { source: static, items } | { source: catalog, catalog, params, fill }; SdFormGenericValueRef có cấu trúc; multiple là thuộc tính field",
    "source": "explicit-user",
    "status": "approved",
    "blocking": true,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Bỏ values/valuesKey rời, label/display lẫn lộn, chuỗi ${key} và tên setVariables dễ nhầm.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {"candidate":false,"category":null},
    "downstream_refs": ["R-005","AC-008"],
    "task_refs": ["TASK-003","TASK-006","TASK-007","TASK-017","TASK-019"]
   },
   {
    "id": "D-006",
    "type": "decision",
    "statement": "Cấu hình portal? → provideSdFormGeneric({ catalogs, templates, htmlDefinitions, validators, breakpoints })",
    "question": "Cấu hình portal?",
    "selected_value": "provideSdFormGeneric({ catalogs, templates, htmlDefinitions, validators, breakpoints })",
    "source": "explicit-user",
    "status": "approved",
    "blocking": true,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Một điểm cấu hình, một shape cho mỗi loại nguồn.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {"candidate":false,"category":null},
    "downstream_refs": ["R-006","AC-003","AC-008"],
    "task_refs": ["TASK-012","TASK-013","TASK-014"]
   },
   {
    "id": "D-007",
    "type": "decision",
    "statement": "API component? → sd-form-render [schema] [(value)] [form] [variables] [viewed] [breakpoint] (sdAction); sd-form-builder [(schema)]; không mutate input; defaultValue theo field",
    "question": "API component?",
    "selected_value": "sd-form-render [schema] [(value)] [form] [variables] [viewed] [breakpoint] (sdAction); sd-form-builder [(schema)]; không mutate input; defaultValue theo field",
    "source": "explicit-user",
    "status": "approved",
    "blocking": true,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Signal-first, tên thống nhất schema cho cả hai component.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {"candidate":false,"category":null},
    "downstream_refs": ["R-007","R-008","AC-009","AC-010","AC-013"],
    "task_refs": ["TASK-016","TASK-020"]
   },
   {
    "id": "D-008",
    "type": "decision",
    "statement": "Chức năng hiện có? → Giữ đủ, mọi biểu thức đổi sang Filter, bỏ sd-feel-expression",
    "question": "Chức năng hiện có?",
    "selected_value": "Giữ đủ, mọi biểu thức đổi sang Filter, bỏ sd-feel-expression",
    "source": "explicit-user",
    "status": "approved",
    "blocking": true,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Không mất chức năng, chỉ còn một định dạng biểu thức.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {"candidate":false,"category":null},
    "downstream_refs": ["R-009","R-010","AC-015","AC-016","AC-017"],
    "task_refs": ["TASK-008","TASK-009","TASK-010","TASK-011","TASK-014","TASK-019","TASK-022"]
   },
   {
    "id": "D-009",
    "type": "decision",
    "statement": "Đặt tên? → Type dùng tiền tố SdFormGeneric*, hằng số SD_FORM_GENERIC_*",
    "question": "Đặt tên?",
    "selected_value": "Type dùng tiền tố SdFormGeneric*, hằng số SD_FORM_GENERIC_*",
    "source": "explicit-user",
    "status": "approved",
    "blocking": true,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Theo tên hằng số người dùng chọn.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {"candidate":false,"category":null},
    "downstream_refs": ["R-001","R-002"],
    "task_refs": ["TASK-003","TASK-005"]
   },
   {
    "id": "D-010",
    "type": "decision",
    "statement": "Cách giao? → 3 đợt trong bản 3.0 chưa phát hành: đợt 1 nền, đợt 2 Tĩnh + Nút, đợt 3 Cấu trúc; CHANGELOG mục BREAKING",
    "question": "Cách giao?",
    "selected_value": "3 đợt trong bản 3.0 chưa phát hành: đợt 1 nền, đợt 2 Tĩnh + Nút, đợt 3 Cấu trúc; CHANGELOG mục BREAKING",
    "source": "explicit-user",
    "status": "approved",
    "blocking": true,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Mỗi đợt tự chạy được và review sớm.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {"candidate":false,"category":null},
    "downstream_refs": ["R-001","R-010","R-011"],
    "task_refs": ["TASK-023","TASK-026"]
   },
   {
    "id": "D-011",
    "type": "decision",
    "statement": "Cách test? → TDD cho logic; viết test sau cho giao diện kèm ảnh chụp thật",
    "question": "Cách test?",
    "selected_value": "TDD cho logic; viết test sau cho giao diện kèm ảnh chụp thật",
    "source": "explicit-user",
    "status": "approved",
    "blocking": true,
    "scope": "repository",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Logic model/rules/layout rủi ro cao; UI cần kiểm chứng trực quan.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {"candidate":false,"category":null},
    "downstream_refs": ["R-011","AC-018","AC-019"],
    "task_refs": ["TASK-002","TASK-004","TASK-006","TASK-008","TASK-010","TASK-012","TASK-024","TASK-025"]
   },
   {
    "id": "D-012",
    "type": "decision",
    "statement": "Tên type của field và container? → Giữ tên type field hiện có (textfield, textarea, number, select, radio, checkbox, datetime, chip-string, chip-calendar, upload, html); container giữ type group",
    "question": "Tên type của field và container?",
    "selected_value": "Giữ tên type field hiện có (textfield, textarea, number, select, radio, checkbox, datetime, chip-string, chip-calendar, upload, html); container giữ type group",
    "source": "approved-spec",
    "status": "proposed",
    "blocking": false,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Giảm thay đổi không cần thiết; người dùng quen tên Group.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {"candidate":false,"category":null},
    "downstream_refs": ["R-001","AC-001"],
    "task_refs": ["TASK-003","TASK-017"]
   },
   {
    "id": "D-013",
    "type": "decision",
    "statement": "Form một trang lưu thế nào? → Luôn là pages: [ … ] (một phần tử khi không dùng tabs/steps); builder ẩn khái niệm trang ở chế độ một trang",
    "question": "Form một trang lưu thế nào?",
    "selected_value": "Luôn là pages: [ … ] (một phần tử khi không dùng tabs/steps); builder ẩn khái niệm trang ở chế độ một trang",
    "source": "approved-spec",
    "status": "proposed",
    "blocking": false,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Một shape duy nhất, đợt 3 thêm tabs/steps không đổi schema.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {"candidate":false,"category":null},
    "downstream_refs": ["R-001","AC-001"],
    "task_refs": ["TASK-002","TASK-003","TASK-018"]
   },
   {
    "id": "D-014",
    "type": "decision",
    "statement": "validate() thuộc đợt nào? → Đợt 1 (thay getValidationMessages để giữ chức năng); submit()/reset() và (sdAction) có hiệu lực ở đợt 2 cùng button",
    "question": "validate() thuộc đợt nào?",
    "selected_value": "Đợt 1 (thay getValidationMessages để giữ chức năng); submit()/reset() và (sdAction) có hiệu lực ở đợt 2 cùng button",
    "source": "approved-spec",
    "status": "proposed",
    "blocking": false,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Validation cấp form đang có phải chạy được ngay đợt 1.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {"candidate":false,"category":null},
    "downstream_refs": ["R-007","AC-006"],
    "task_refs": ["TASK-008","TASK-009","TASK-016"]
   },
   {
    "id": "D-015",
    "type": "decision",
    "statement": "Table ở đợt 1? → Chưa hỗ trợ; shape container table chừa sẵn và làm ở đợt 3",
    "question": "Table ở đợt 1?",
    "selected_value": "Chưa hỗ trợ; shape container table chừa sẵn và làm ở đợt 3",
    "source": "approved-spec",
    "status": "proposed",
    "blocking": false,
    "scope": "module",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Table đổi hẳn sang cột là field con; làm hai lần sẽ phí công. Bản 3.0 chưa phát hành nên tạm thiếu Table giữa các đợt là chấp nhận được.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {"candidate":false,"category":null},
    "downstream_refs": ["R-001","R-009"],
    "task_refs": ["TASK-017","TASK-019"]
   },
   {
    "id": "D-016",
    "type": "decision",
    "statement": "Giới hạn field được render (input properties cũ)? → Giữ, đổi tên thành [keys] (danh sách key field được render)",
    "question": "Giới hạn field được render (input properties cũ)?",
    "selected_value": "Giữ, đổi tên thành [keys] (danh sách key field được render)",
    "source": "approved-spec",
    "status": "proposed",
    "blocking": false,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Giữ chức năng hiện có với tên rõ nghĩa.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {"candidate":false,"category":null},
    "downstream_refs": ["R-007"],
    "task_refs": ["TASK-016"]
   },
   {
    "id": "D-017",
    "type": "decision",
    "statement": "Mở rộng union phần tử ở đợt 2/3 thế nào, và code gặp type lạ thì xử lý ra sao? → Thêm thành viên mới vào union SdFormGenericElement (và giá trị navigation) mà không đổi shape thành viên cũ. Renderer bỏ qua type lạ (cảnh báo khi dev mode); builder giữ nguyên phần tử lạ khi nạp → phát (round-trip) và hiện thẻ \"chưa hỗ trợ\".",
    "question": "Mở rộng union phần tử ở đợt 2/3 thế nào, và code gặp type lạ thì xử lý ra sao?",
    "selected_value": "Thêm thành viên mới vào union SdFormGenericElement (và giá trị navigation) mà không đổi shape thành viên cũ. Renderer bỏ qua type lạ (cảnh báo khi dev mode); builder giữ nguyên phần tử lạ khi nạp → phát (round-trip) và hiện thẻ \"chưa hỗ trợ\".",
    "source": "approved-architecture",
    "status": "proposed",
    "blocking": false,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Các đợt sau là các đơn vị làm độc lập; luật mở rộng phải cố định trước để không phá schema đợt 1.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {"candidate":false,"category":null},
    "downstream_refs": ["R-001","AC-001"],
    "task_refs": ["TASK-002","TASK-003","TASK-016","TASK-018"]
   },
   {
    "id": "D-018",
    "type": "decision",
    "statement": "Tách lõi thuần TS ở đâu? → models (type + normalize/validate grammar), layout (breakpoint, kế thừa span, xếp hàng) và rules (đánh giá Filter, duyệt/đổi tham chiếu) là TypeScript thuần — không DI, không DOM; renderer và builder chỉ phụ thuộc chiều vào chúng.",
    "question": "Tách lõi thuần TS ở đâu?",
    "selected_value": "models (type + normalize/validate grammar), layout (breakpoint, kế thừa span, xếp hàng) và rules (đánh giá Filter, duyệt/đổi tham chiếu) là TypeScript thuần — không DI, không DOM; renderer và builder chỉ phụ thuộc chiều vào chúng.",
    "source": "approved-architecture",
    "status": "proposed",
    "blocking": false,
    "scope": "module",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Canvas và renderer phải xếp giống nhau; logic cần TDD nhanh, không cần TestBed.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {"candidate":false,"category":null},
    "downstream_refs": ["R-002","R-003","AC-002","AC-004","AC-005","AC-015"],
    "task_refs": ["TASK-003","TASK-005","TASK-007","TASK-009","TASK-011"]
   },
   {
    "id": "D-019",
    "type": "decision",
    "statement": "Item của catalog và bộ nhớ đệm? → Catalog trả SdFormGenericCatalogItem = SdFormGenericOption & { data?: Record<string, unknown> }; fill đọc item.data[from]. Kết quả load được đệm theo từng instance renderer, khoá bằng catalog id + params đã giải; không dùng bộ đệm toàn cục.",
    "question": "Item của catalog và bộ nhớ đệm?",
    "selected_value": "Catalog trả SdFormGenericCatalogItem = SdFormGenericOption & { data?: Record<string, unknown> }; fill đọc item.data[from]. Kết quả load được đệm theo từng instance renderer, khoá bằng catalog id + params đã giải; không dùng bộ đệm toàn cục.",
    "source": "approved-architecture",
    "status": "proposed",
    "blocking": false,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Hai form cùng trang không được dùng lẫn dữ liệu; fill cần dữ liệu ngoài value/label.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {"candidate":false,"category":null},
    "downstream_refs": ["R-005","AC-008"],
    "task_refs": ["TASK-012","TASK-013"]
   },
   {
    "id": "D-020",
    "type": "decision",
    "statement": "Ngữ nghĩa value và validate()? → value chỉ gồm key của field (không có phần tử tĩnh/nút), giữ giá trị của field đang ẩn; valueChange phát object mới sau mỗi thay đổi control (không debounce). validate() đánh dấu mọi control đã chạm, chạy validator của field rồi validations cấp form, trả { valid, messages: { error, warning } }; chỉ error làm valid = false.",
    "question": "Ngữ nghĩa value và validate()?",
    "selected_value": "value chỉ gồm key của field (không có phần tử tĩnh/nút), giữ giá trị của field đang ẩn; valueChange phát object mới sau mỗi thay đổi control (không debounce). validate() đánh dấu mọi control đã chạm, chạy validator của field rồi validations cấp form, trả { valid, messages: { error, warning } }; chỉ error làm valid = false.",
    "source": "approved-architecture",
    "status": "proposed",
    "blocking": false,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Consumer và các đợt sau phải hiểu value và validate() giống nhau.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {"candidate":false,"category":null},
    "downstream_refs": ["R-007","AC-006","AC-009"],
    "task_refs": ["TASK-006","TASK-007","TASK-009","TASK-016"]
   },
   {
    "id": "D-021",
    "type": "decision",
    "statement": "Ranh giới kiểm chứng của validation map? → kind none — form-generic là thư viện UI, không xác thực người dùng và không gọi HTTP (INV-009); mọi AC chứng minh bằng Karma unit/component, lệnh kiểm tra của repo hoặc ảnh chụp thủ công",
    "question": "Ranh giới kiểm chứng của validation map?",
    "selected_value": "kind none — form-generic là thư viện UI, không xác thực người dùng và không gọi HTTP (INV-009); mọi AC chứng minh bằng Karma unit/component, lệnh kiểm tra của repo hoặc ảnh chụp thủ công",
    "source": "approved-plan",
    "status": "proposed",
    "blocking": false,
    "scope": "repository",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Không có ranh giới phân quyền nào trong phạm vi nên không cần bằng chứng từ chối ở API; một ranh giới chung cho mọi dòng.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {"candidate":false,"category":null},
    "downstream_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"],
    "validation_boundary": {
     "kind": "none",
     "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
    },
    "task_refs": ["TASK-025"]
   },
   {
    "id": "D-022",
    "type": "decision",
    "statement": "Các thuộc tính/API cũ không có trong hợp đồng mới xử lý thế nào? → Bỏ ở đợt 1 và ghi trong mục BREAKING: onLoaded (consumer tự biết lúc đặt [schema]); beforeSubmit, properties.onChange.setValues và kiểu checklist (renderer chưa từng thực thi); setVariables và VariableComponent (thay bằng options.fill và [variables]); field table (D-015, làm lại ở đợt 3)",
    "question": "Các thuộc tính/API cũ không có trong hợp đồng mới xử lý thế nào?",
    "selected_value": "Bỏ ở đợt 1 và ghi trong mục BREAKING: onLoaded (consumer tự biết lúc đặt [schema]); beforeSubmit, properties.onChange.setValues và kiểu checklist (renderer chưa từng thực thi); setVariables và VariableComponent (thay bằng options.fill và [variables]); field table (D-015, làm lại ở đợt 3)",
    "source": "approved-plan",
    "status": "proposed",
    "blocking": false,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Hợp đồng C-002 đã duyệt không có các mục này; phần lớn chưa từng chạy ở renderer nên không mất chức năng đang dùng.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {"candidate":false,"category":null},
    "downstream_refs": ["R-009","R-010","AC-017"],
    "task_refs": ["TASK-016","TASK-022","TASK-023"]
   },
   {
    "id": "D-023",
    "type": "decision",
    "statement": "validate() gặp validator hàm chưa được đăng ký ở provider? → Fail-closed: thêm một lỗi error nêu mã validator chưa đăng ký, valid = false; không bỏ qua im lặng",
    "question": "validate() gặp validator hàm chưa được đăng ký ở provider?",
    "selected_value": "Fail-closed: thêm một lỗi error nêu mã validator chưa đăng ký, valid = false; không bỏ qua im lặng",
    "source": "approved-plan",
    "status": "proposed",
    "blocking": false,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Cấu hình portal thiếu validator phải lộ ra ngay, không để dữ liệu sai lọt qua.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {"candidate":false,"category":null},
    "downstream_refs": ["R-003","AC-006"],
    "task_refs": ["TASK-008","TASK-009"]
   },
   {
    "id": "INV-001",
    "type": "invariant",
    "statement": "sd-form-render không bao giờ mutate schema, value hay variables được truyền vào; sd-form-builder không bao giờ mutate schema được truyền vào; mọi lần phát là object mới.",
    "protected_refs": ["R-007","R-008","AC-009","AC-013"],
    "task_refs": ["TASK-007","TASK-016","TASK-018","TASK-020"],
    "evidence_refs": ["EVIDENCE-016","EVIDENCE-018"]
   },
   {
    "id": "INV-002",
    "type": "invariant",
    "statement": "Chọn mức breakpoint, kế thừa span và xếp hàng (kể cả newRow) do một module layout thuần duy nhất đảm nhận; canvas và renderer cho cùng input + cùng mức luôn ra cùng các hàng.",
    "protected_refs": ["R-002","AC-002","AC-003","AC-004","AC-010","AC-014"],
    "task_refs": ["TASK-005","TASK-016","TASK-018","TASK-020"],
    "evidence_refs": ["EVIDENCE-005","EVIDENCE-020"]
   },
   {
    "id": "INV-003",
    "type": "invariant",
    "statement": "Mọi điều kiện (rules) và validation cấp form dạng biểu thức đều là Filter, đánh giá bởi một evaluator duy nhất bọc FilterUtilities.evaluate trên { ...value, ...variables }; không còn định dạng biểu thức nào khác trong schema hay runtime.",
    "protected_refs": ["R-003","AC-005","AC-006"],
    "task_refs": ["TASK-007","TASK-009","TASK-016","TASK-019","TASK-022"],
    "evidence_refs": ["EVIDENCE-007","EVIDENCE-016"]
   },
   {
    "id": "INV-004",
    "type": "invariant",
    "statement": "Schema luôn đúng ngữ pháp: pages → (group | element), group chỉ chứa element, không có break, không có schemaVersion, key field duy nhất (kể cả so với biến); mọi lệnh của builder chỉ tạo ra schema hợp lệ.",
    "protected_refs": ["R-001","AC-001"],
    "task_refs": ["TASK-003","TASK-018"],
    "evidence_refs": ["EVIDENCE-003","EVIDENCE-018"]
   },
   {
    "id": "INV-005",
    "type": "invariant",
    "statement": "Mọi tham chiếu tới key field hoặc biến trong schema đều có cấu trúc (Filter.field và so sánh field–field, SdFormGenericValueRef, fill.field); chuỗi tự do chỉ còn ở hyperlink và nội dung html.",
    "protected_refs": ["R-005","R-009","AC-008","AC-015"],
    "task_refs": ["TASK-003","TASK-009","TASK-019"],
    "evidence_refs": ["EVIDENCE-009"]
   },
   {
    "id": "INV-006",
    "type": "invariant",
    "statement": "Thêm type phần tử mới (đợt 2/3) không đổi shape của type đã có; phần tử có type lạ được renderer bỏ qua và được builder giữ nguyên khi phát lại.",
    "protected_refs": ["R-001","AC-001"],
    "task_refs": ["TASK-003","TASK-016","TASK-018"],
    "evidence_refs": ["EVIDENCE-003","EVIDENCE-016","EVIDENCE-018"]
   },
   {
    "id": "INV-007",
    "type": "invariant",
    "statement": "Chỉ sửa code ở versions/v19; v20/v21/v22 chỉ đổi qua npm run sync và check:sync luôn qua; v22 giữ LF.",
    "protected_refs": ["R-011","AC-018"],
    "task_refs": ["TASK-001","TASK-026"],
    "evidence_refs": ["EVIDENCE-026"]
   },
   {
    "id": "INV-008",
    "type": "invariant",
    "statement": "Public API của entry form-generic đúng bằng danh sách hợp đồng C-001…C-006; mọi export cũ bị bỏ đều được liệt kê trong mục BREAKING của CHANGELOG.",
    "protected_refs": ["R-010","AC-017"],
    "task_refs": ["TASK-022","TASK-023"],
    "evidence_refs": ["EVIDENCE-022"]
   },
   {
    "id": "INV-009",
    "type": "invariant",
    "statement": "Component không tự gọi HTTP; dữ liệu của portal chỉ đi qua callback trong provideSdFormGeneric (catalog.load/search, htmlDefinitions, validators, templates).",
    "protected_refs": ["R-005","R-006","AC-008"],
    "task_refs": ["TASK-013","TASK-014","TASK-017"],
    "evidence_refs": ["EVIDENCE-013","EVIDENCE-014"]
   }
  ],
  "history": [
   {
    "revision": 1,
    "active": [
     {"id":"R-001","type":"requirement"},
     {"id":"R-002","type":"requirement"},
     {"id":"R-003","type":"requirement"},
     {"id":"R-004","type":"requirement"},
     {"id":"R-005","type":"requirement"},
     {"id":"R-006","type":"requirement"},
     {"id":"R-007","type":"requirement"},
     {"id":"R-008","type":"requirement"},
     {"id":"R-009","type":"requirement"},
     {"id":"R-010","type":"requirement"},
     {"id":"R-011","type":"requirement"},
     {"id":"AC-001","type":"acceptance-criterion"},
     {"id":"AC-002","type":"acceptance-criterion"},
     {"id":"AC-003","type":"acceptance-criterion"},
     {"id":"AC-004","type":"acceptance-criterion"},
     {"id":"AC-005","type":"acceptance-criterion"},
     {"id":"AC-006","type":"acceptance-criterion"},
     {"id":"AC-007","type":"acceptance-criterion"},
     {"id":"AC-008","type":"acceptance-criterion"},
     {"id":"AC-009","type":"acceptance-criterion"},
     {"id":"AC-010","type":"acceptance-criterion"},
     {"id":"AC-011","type":"acceptance-criterion"},
     {"id":"AC-012","type":"acceptance-criterion"},
     {"id":"AC-013","type":"acceptance-criterion"},
     {"id":"AC-014","type":"acceptance-criterion"},
     {"id":"AC-015","type":"acceptance-criterion"},
     {"id":"AC-016","type":"acceptance-criterion"},
     {"id":"AC-017","type":"acceptance-criterion"},
     {"id":"AC-018","type":"acceptance-criterion"},
     {"id":"AC-019","type":"acceptance-criterion"},
     {"id":"A-001","type":"assumption"},
     {"id":"A-002","type":"assumption"},
     {"id":"A-003","type":"assumption"},
     {"id":"A-004","type":"assumption"},
     {"id":"A-005","type":"assumption"},
     {"id":"D-001","type":"decision"},
     {"id":"D-002","type":"decision"},
     {"id":"D-003","type":"decision"},
     {"id":"D-004","type":"decision"},
     {"id":"D-005","type":"decision"},
     {"id":"D-006","type":"decision"},
     {"id":"D-007","type":"decision"},
     {"id":"D-008","type":"decision"},
     {"id":"D-009","type":"decision"},
     {"id":"D-010","type":"decision"},
     {"id":"D-011","type":"decision"},
     {"id":"D-012","type":"decision"},
     {"id":"D-013","type":"decision"},
     {"id":"D-014","type":"decision"},
     {"id":"D-015","type":"decision"},
     {"id":"D-016","type":"decision"}
    ],
    "tombstones": []
   },
   {
    "revision": 2,
    "active": [
     {"id":"R-001","type":"requirement"},
     {"id":"R-002","type":"requirement"},
     {"id":"R-003","type":"requirement"},
     {"id":"R-004","type":"requirement"},
     {"id":"R-005","type":"requirement"},
     {"id":"R-006","type":"requirement"},
     {"id":"R-007","type":"requirement"},
     {"id":"R-008","type":"requirement"},
     {"id":"R-009","type":"requirement"},
     {"id":"R-010","type":"requirement"},
     {"id":"R-011","type":"requirement"},
     {"id":"AC-001","type":"acceptance-criterion"},
     {"id":"AC-002","type":"acceptance-criterion"},
     {"id":"AC-003","type":"acceptance-criterion"},
     {"id":"AC-004","type":"acceptance-criterion"},
     {"id":"AC-005","type":"acceptance-criterion"},
     {"id":"AC-006","type":"acceptance-criterion"},
     {"id":"AC-007","type":"acceptance-criterion"},
     {"id":"AC-008","type":"acceptance-criterion"},
     {"id":"AC-009","type":"acceptance-criterion"},
     {"id":"AC-010","type":"acceptance-criterion"},
     {"id":"AC-011","type":"acceptance-criterion"},
     {"id":"AC-012","type":"acceptance-criterion"},
     {"id":"AC-013","type":"acceptance-criterion"},
     {"id":"AC-014","type":"acceptance-criterion"},
     {"id":"AC-015","type":"acceptance-criterion"},
     {"id":"AC-016","type":"acceptance-criterion"},
     {"id":"AC-017","type":"acceptance-criterion"},
     {"id":"AC-018","type":"acceptance-criterion"},
     {"id":"AC-019","type":"acceptance-criterion"},
     {"id":"A-001","type":"assumption"},
     {"id":"A-002","type":"assumption"},
     {"id":"A-003","type":"assumption"},
     {"id":"A-004","type":"assumption"},
     {"id":"A-005","type":"assumption"},
     {"id":"D-001","type":"decision"},
     {"id":"D-002","type":"decision"},
     {"id":"D-003","type":"decision"},
     {"id":"D-004","type":"decision"},
     {"id":"D-005","type":"decision"},
     {"id":"D-006","type":"decision"},
     {"id":"D-007","type":"decision"},
     {"id":"D-008","type":"decision"},
     {"id":"D-009","type":"decision"},
     {"id":"D-010","type":"decision"},
     {"id":"D-011","type":"decision"},
     {"id":"D-012","type":"decision"},
     {"id":"D-013","type":"decision"},
     {"id":"D-014","type":"decision"},
     {"id":"D-015","type":"decision"},
     {"id":"D-016","type":"decision"},
     {"id":"D-017","type":"decision"},
     {"id":"D-018","type":"decision"},
     {"id":"D-019","type":"decision"},
     {"id":"D-020","type":"decision"},
     {"id":"INV-001","type":"invariant"},
     {"id":"INV-002","type":"invariant"},
     {"id":"INV-003","type":"invariant"},
     {"id":"INV-004","type":"invariant"},
     {"id":"INV-005","type":"invariant"},
     {"id":"INV-006","type":"invariant"},
     {"id":"INV-007","type":"invariant"},
     {"id":"INV-008","type":"invariant"},
     {"id":"INV-009","type":"invariant"}
    ],
    "tombstones": []
   },
   {
    "revision": 3,
    "active": [
     {"id":"R-001","type":"requirement"},
     {"id":"R-002","type":"requirement"},
     {"id":"R-003","type":"requirement"},
     {"id":"R-004","type":"requirement"},
     {"id":"R-005","type":"requirement"},
     {"id":"R-006","type":"requirement"},
     {"id":"R-007","type":"requirement"},
     {"id":"R-008","type":"requirement"},
     {"id":"R-009","type":"requirement"},
     {"id":"R-010","type":"requirement"},
     {"id":"R-011","type":"requirement"},
     {"id":"AC-001","type":"acceptance-criterion"},
     {"id":"AC-002","type":"acceptance-criterion"},
     {"id":"AC-003","type":"acceptance-criterion"},
     {"id":"AC-004","type":"acceptance-criterion"},
     {"id":"AC-005","type":"acceptance-criterion"},
     {"id":"AC-006","type":"acceptance-criterion"},
     {"id":"AC-007","type":"acceptance-criterion"},
     {"id":"AC-008","type":"acceptance-criterion"},
     {"id":"AC-009","type":"acceptance-criterion"},
     {"id":"AC-010","type":"acceptance-criterion"},
     {"id":"AC-011","type":"acceptance-criterion"},
     {"id":"AC-012","type":"acceptance-criterion"},
     {"id":"AC-013","type":"acceptance-criterion"},
     {"id":"AC-014","type":"acceptance-criterion"},
     {"id":"AC-015","type":"acceptance-criterion"},
     {"id":"AC-016","type":"acceptance-criterion"},
     {"id":"AC-017","type":"acceptance-criterion"},
     {"id":"AC-018","type":"acceptance-criterion"},
     {"id":"AC-019","type":"acceptance-criterion"},
     {"id":"A-001","type":"assumption"},
     {"id":"A-002","type":"assumption"},
     {"id":"A-003","type":"assumption"},
     {"id":"A-004","type":"assumption"},
     {"id":"A-005","type":"assumption"},
     {"id":"D-001","type":"decision"},
     {"id":"D-002","type":"decision"},
     {"id":"D-003","type":"decision"},
     {"id":"D-004","type":"decision"},
     {"id":"D-005","type":"decision"},
     {"id":"D-006","type":"decision"},
     {"id":"D-007","type":"decision"},
     {"id":"D-008","type":"decision"},
     {"id":"D-009","type":"decision"},
     {"id":"D-010","type":"decision"},
     {"id":"D-011","type":"decision"},
     {"id":"D-012","type":"decision"},
     {"id":"D-013","type":"decision"},
     {"id":"D-014","type":"decision"},
     {"id":"D-015","type":"decision"},
     {"id":"D-016","type":"decision"},
     {"id":"D-017","type":"decision"},
     {"id":"D-018","type":"decision"},
     {"id":"D-019","type":"decision"},
     {"id":"D-020","type":"decision"},
     {"id":"D-021","type":"decision"},
     {"id":"D-022","type":"decision"},
     {"id":"D-023","type":"decision"},
     {"id":"INV-001","type":"invariant"},
     {"id":"INV-002","type":"invariant"},
     {"id":"INV-003","type":"invariant"},
     {"id":"INV-004","type":"invariant"},
     {"id":"INV-005","type":"invariant"},
     {"id":"INV-006","type":"invariant"},
     {"id":"INV-007","type":"invariant"},
     {"id":"INV-008","type":"invariant"},
     {"id":"INV-009","type":"invariant"}
    ],
    "tombstones": []
   }
  ]
 },
 "goal_backward_review": {
  "schema_version": 1,
  "mode": "sdcorejs-plan:goal-backward",
  "decision_coverage": {
   "schema_version": 1,
   "revision": 3,
   "records": [
    {
     "id": "R-001",
     "type": "requirement",
     "statement": "Schema gốc SdFormGenericSchema là phiên bản đầu tiên (không schemaVersion, không chuyển đổi từ SdFormGeneric cũ) theo ngữ pháp cố định Form → pages → group → element; phần tử phân loại bằng `type`; chừa sẵn shape cho static/button (đợt 2) và tabs/steps/table (đợt 3).",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": "components/form-generic",
     "task_refs": ["TASK-002","TASK-003","TASK-018","TASK-022"]
    },
    {
     "id": "R-002",
     "type": "requirement",
     "statement": "Bố cục responsive layout.span { desktop, tablet, mobile } (1–12) + newRow, theo SD_FORM_GENERIC_BREAKPOINTS = { tablet: 600, desktop: 1024 } đo trên bề rộng form; mặc định desktop 12, tablet theo desktop, mobile 12; ghi đè breakpoint qua provider; bỏ phần tử break.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": "components/form-generic",
     "task_refs": ["TASK-004","TASK-005","TASK-016","TASK-020"]
    },
    {
     "id": "R-003",
     "type": "requirement",
     "statement": "Điều kiện rules { visible, hidden, disabled, required } lưu bằng Filter của @sdcorejs/utils và đánh giá bằng FilterUtilities.evaluate trên giá trị form + biến; validation cấp form dùng Filter hoặc hàm đăng ký ở portal.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": "components/form-generic",
     "task_refs": ["TASK-006","TASK-007","TASK-008","TASK-009","TASK-016","TASK-019"]
    },
    {
     "id": "R-004",
     "type": "requirement",
     "statement": "Validation của field chuẩn hoá { required, min, max, minLength, maxLength, pattern { value, message }, maxItems, phoneCountry }; giữ nguyên các preset text (email, phone, url, password) và number (integer, decimal, currency, percent) cùng kiểm tra của chúng.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": "components/form-generic",
     "task_refs": ["TASK-003","TASK-015","TASK-017"]
    },
    {
     "id": "R-005",
     "type": "requirement",
     "statement": "Nguồn lựa chọn options = { source: static, items } | { source: catalog, catalog, params, fill } với SdFormGenericValueRef có cấu trúc; multiple là thuộc tính field; portal đăng ký catalog { id, label, params, fields, load, search? }.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": "components/form-generic",
     "task_refs": ["TASK-003","TASK-006","TASK-007","TASK-012","TASK-013","TASK-017","TASK-019"]
    },
    {
     "id": "R-006",
     "type": "requirement",
     "statement": "Cấu hình portal gom về provideSdFormGeneric({ catalogs, templates, htmlDefinitions, validators, breakpoints }) thay cho SD_FORM_GENERIC_CONFIGURATION.form cũ.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": "components/form-generic",
     "task_refs": ["TASK-012","TASK-013","TASK-014"]
    },
    {
     "id": "R-007",
     "type": "requirement",
     "statement": "sd-form-render có API [schema], [(value)] (model, không mutate input), [form], [variables], [viewed], [breakpoint], [labelPlacement], [keys]; method validate() trả { valid, messages } và upload(); defaultValue khai báo theo field.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": "components/form-generic",
     "task_refs": ["TASK-006","TASK-007","TASK-009","TASK-016","TASK-017"]
    },
    {
     "id": "R-008",
     "type": "requirement",
     "statement": "sd-form-builder có API [(schema)], thiết kế trên schema mới ngang tính năng hiện có cho các field và group; chế độ Desktop | Tablet | Mobile sửa span của mức đang xem, hiển thị mức kế thừa, newRow thay cho ngắt dòng; Xem trước dùng renderer với [breakpoint] ép mức.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": "components/form-generic",
     "task_refs": ["TASK-018","TASK-019","TASK-020","TASK-024"]
    },
    {
     "id": "R-009",
     "type": "requirement",
     "statement": "Giữ đủ chức năng hiện có trên model mới: biến, validation cấp form, templates, HTML definitions (biến, truy vấn), upload (loại, nguồn, định dạng, số file, dung lượng, tham số), hyperlink khi chỉ xem, labelPlacement, viewed, SdFormRenderService.viewEntities, đổi mã có cập nhật tham chiếu có cấu trúc.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": "components/form-generic",
     "task_refs": ["TASK-008","TASK-009","TASK-010","TASK-011","TASK-014","TASK-017","TASK-019"]
    },
    {
     "id": "R-010",
     "type": "requirement",
     "statement": "Bỏ sd-feel-expression, model expression cũ và phần tử break; CHANGELOG ghi mục BREAKING có ví dụ trước/sau; sd-form-generic.md viết lại cho schema mới; showcase chạy trên schema mới; i18n đủ 5 ngôn ngữ.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": "components/form-generic",
     "task_refs": ["TASK-021","TASK-022","TASK-023","TASK-024"]
    },
    {
     "id": "R-011",
     "type": "requirement",
     "statement": "Kiểm chứng: TDD cho phần logic, test sau cho giao diện kèm ảnh chụp thật; full suite v19 có coverage, lint, check:i18n, check:i18n-parity, check:scss-hex xanh; rollout v20/v21/v22 bằng npm run sync và check:sync xanh.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": "components/form-generic",
     "task_refs": ["TASK-001","TASK-024","TASK-025","TASK-026"]
    },
    {
     "id": "AC-001",
     "type": "acceptance-criterion",
     "statement": "Builder phát (schemaChange) sau một thay đổi của người dùng → JSON là SdFormGenericSchema hợp lệ: có pages, không có schemaVersion, không có phần tử break, mọi phần tử có id, field có key duy nhất",
     "behavior": "Builder phát (schemaChange) sau một thay đổi của người dùng",
     "expected_result": "JSON là SdFormGenericSchema hợp lệ: có pages, không có schemaVersion, không có phần tử break, mọi phần tử có id, field có key duy nhất",
     "verification_kind": "automated",
     "blocking": true,
     "requirement_refs": ["R-001"],
     "task_refs": ["TASK-002","TASK-003","TASK-018","TASK-020","TASK-022"],
     "evidence_refs": ["EVIDENCE-002","EVIDENCE-003","EVIDENCE-018","EVIDENCE-020","EVIDENCE-022"]
    },
    {
     "id": "AC-002",
     "type": "acceptance-criterion",
     "statement": "Renderer hiển thị field span { desktop: 6 } ở bề rộng form 1100px, 800px và 480px → Hai field/hàng ở 1100px và 800px (tablet kế thừa desktop); xếp chồng ở 480px (mobile mặc định 12)",
     "behavior": "Renderer hiển thị field span { desktop: 6 } ở bề rộng form 1100px, 800px và 480px",
     "expected_result": "Hai field/hàng ở 1100px và 800px (tablet kế thừa desktop); xếp chồng ở 480px (mobile mặc định 12)",
     "verification_kind": "automated",
     "blocking": true,
     "requirement_refs": ["R-002"],
     "task_refs": ["TASK-004","TASK-005","TASK-016"],
     "evidence_refs": ["EVIDENCE-004","EVIDENCE-005","EVIDENCE-016"]
    },
    {
     "id": "AC-003",
     "type": "acceptance-criterion",
     "statement": "Portal ghi đè breakpoints { tablet: 700 } rồi render form rộng 650px → Form dùng mức mobile; các giá trị không ghi đè giữ mặc định SD_FORM_GENERIC_BREAKPOINTS",
     "behavior": "Portal ghi đè breakpoints { tablet: 700 } rồi render form rộng 650px",
     "expected_result": "Form dùng mức mobile; các giá trị không ghi đè giữ mặc định SD_FORM_GENERIC_BREAKPOINTS",
     "verification_kind": "automated",
     "blocking": true,
     "requirement_refs": ["R-002"],
     "task_refs": ["TASK-004","TASK-005","TASK-012","TASK-013","TASK-016"],
     "evidence_refs": ["EVIDENCE-004","EVIDENCE-005","EVIDENCE-012","EVIDENCE-013","EVIDENCE-016"]
    },
    {
     "id": "AC-004",
     "type": "acceptance-criterion",
     "statement": "Một field có layout.newRow: true đứng sau field span 4 trong cùng group → Field đó bắt đầu hàng mới dù hàng trước còn chỗ; canvas và renderer xếp giống nhau",
     "behavior": "Một field có layout.newRow: true đứng sau field span 4 trong cùng group",
     "expected_result": "Field đó bắt đầu hàng mới dù hàng trước còn chỗ; canvas và renderer xếp giống nhau",
     "verification_kind": "automated",
     "blocking": true,
     "requirement_refs": ["R-002"],
     "task_refs": ["TASK-004","TASK-005","TASK-018"],
     "evidence_refs": ["EVIDENCE-004","EVIDENCE-005","EVIDENCE-018"]
    },
    {
     "id": "AC-005",
     "type": "acceptance-criterion",
     "statement": "Field có rules.visible là Filter { field: agree, operator: EQUAL, data: true }, rules.required dựa trên field khác và rules.disabled dựa trên biến → Ẩn/hiện, bắt buộc và vô hiệu đổi theo giá trị và biến ngay khi chúng thay đổi; field ẩn không bị kiểm tra; Filter ngày tương đối được hỗ trợ",
     "behavior": "Field có rules.visible là Filter { field: agree, operator: EQUAL, data: true }, rules.required dựa trên field khác và rules.disabled dựa trên biến",
     "expected_result": "Ẩn/hiện, bắt buộc và vô hiệu đổi theo giá trị và biến ngay khi chúng thay đổi; field ẩn không bị kiểm tra; Filter ngày tương đối được hỗ trợ",
     "verification_kind": "automated",
     "blocking": true,
     "requirement_refs": ["R-003"],
     "task_refs": ["TASK-006","TASK-007","TASK-016","TASK-019"],
     "evidence_refs": ["EVIDENCE-006","EVIDENCE-007","EVIDENCE-016","EVIDENCE-019"]
    },
    {
     "id": "AC-006",
     "type": "acceptance-criterion",
     "statement": "Gọi validate() khi có validation cấp form (Filter, alert error và warning) và một validator hàm đăng ký ở portal → Trả { valid, messages: { error[], warning[] } } — không bao giờ undefined; validator hàm nhận giá trị form; lỗi error làm valid = false",
     "behavior": "Gọi validate() khi có validation cấp form (Filter, alert error và warning) và một validator hàm đăng ký ở portal",
     "expected_result": "Trả { valid, messages: { error[], warning[] } } — không bao giờ undefined; validator hàm nhận giá trị form; lỗi error làm valid = false",
     "verification_kind": "automated",
     "blocking": true,
     "requirement_refs": ["R-003","R-007"],
     "task_refs": ["TASK-008","TASK-009","TASK-016"],
     "evidence_refs": ["EVIDENCE-008","EVIDENCE-009","EVIDENCE-016"]
    },
    {
     "id": "AC-007",
     "type": "acceptance-criterion",
     "statement": "Nhập giá trị sai cho các preset email, phone (VN và quốc tế), url, integer, decimal, currency, percent và các ràng buộc minLength/maxLength/pattern/maxItems → Mỗi trường báo đúng lỗi như bản hiện tại; password không bao giờ nhận defaultValue và hiển thị mặt nạ khi chỉ xem",
     "behavior": "Nhập giá trị sai cho các preset email, phone (VN và quốc tế), url, integer, decimal, currency, percent và các ràng buộc minLength/maxLength/pattern/maxItems",
     "expected_result": "Mỗi trường báo đúng lỗi như bản hiện tại; password không bao giờ nhận defaultValue và hiển thị mặt nạ khi chỉ xem",
     "verification_kind": "automated",
     "blocking": true,
     "requirement_refs": ["R-004"],
     "task_refs": ["TASK-015","TASK-017"],
     "evidence_refs": ["EVIDENCE-015","EVIDENCE-017"]
    },
    {
     "id": "AC-008",
     "type": "acceptance-criterion",
     "statement": "Select dùng options catalog với params [{ name: provinceId, value: { field: city } }] và fill [{ field: note, from: name }] → load() nhận params đã giải tham chiếu; đổi city thì tải lại danh mục; chọn một mục thì điền note; catalog có search thì tìm theo từ khoá; options static hiển thị items đúng thứ tự",
     "behavior": "Select dùng options catalog với params [{ name: provinceId, value: { field: city } }] và fill [{ field: note, from: name }]",
     "expected_result": "load() nhận params đã giải tham chiếu; đổi city thì tải lại danh mục; chọn một mục thì điền note; catalog có search thì tìm theo từ khoá; options static hiển thị items đúng thứ tự",
     "verification_kind": "automated",
     "blocking": true,
     "requirement_refs": ["R-005","R-006"],
     "task_refs": ["TASK-006","TASK-007","TASK-012","TASK-013","TASK-017"],
     "evidence_refs": ["EVIDENCE-006","EVIDENCE-007","EVIDENCE-012","EVIDENCE-013","EVIDENCE-017"]
    },
    {
     "id": "AC-009",
     "type": "acceptance-criterion",
     "statement": "Truyền [(value)] là object đã deep-freeze cùng schema có defaultValue rồi nhập dữ liệu → Không lỗi, input không bị sửa; valueChange phát object mới; defaultValue chỉ áp cho key chưa có giá trị và không áp ở chế độ chỉ xem",
     "behavior": "Truyền [(value)] là object đã deep-freeze cùng schema có defaultValue rồi nhập dữ liệu",
     "expected_result": "Không lỗi, input không bị sửa; valueChange phát object mới; defaultValue chỉ áp cho key chưa có giá trị và không áp ở chế độ chỉ xem",
     "verification_kind": "automated",
     "blocking": true,
     "requirement_refs": ["R-007"],
     "task_refs": ["TASK-006","TASK-007","TASK-016"],
     "evidence_refs": ["EVIDENCE-006","EVIDENCE-007","EVIDENCE-016"]
    },
    {
     "id": "AC-010",
     "type": "acceptance-criterion",
     "statement": "Đặt [breakpoint]=\"mobile\" cho renderer đang rộng 1200px, rồi đặt lại null → Bố cục dùng span mobile khi ép; khi null quay về mức đo theo bề rộng form",
     "behavior": "Đặt [breakpoint]=\"mobile\" cho renderer đang rộng 1200px, rồi đặt lại null",
     "expected_result": "Bố cục dùng span mobile khi ép; khi null quay về mức đo theo bề rộng form",
     "verification_kind": "automated",
     "blocking": true,
     "requirement_refs": ["R-007"],
     "task_refs": ["TASK-004","TASK-005","TASK-016"],
     "evidence_refs": ["EVIDENCE-004","EVIDENCE-005","EVIDENCE-016"]
    },
    {
     "id": "AC-011",
     "type": "acceptance-criterion",
     "statement": "Gọi upload() khi field upload có tệp chờ và có params tham chiếu field khác → Các tệp được tải lên với tham số đã giải tham chiếu và value nhận kết quả",
     "behavior": "Gọi upload() khi field upload có tệp chờ và có params tham chiếu field khác",
     "expected_result": "Các tệp được tải lên với tham số đã giải tham chiếu và value nhận kết quả",
     "verification_kind": "automated",
     "blocking": true,
     "requirement_refs": ["R-007","R-009"],
     "task_refs": ["TASK-006","TASK-007","TASK-016","TASK-017"],
     "evidence_refs": ["EVIDENCE-006","EVIDENCE-007","EVIDENCE-016","EVIDENCE-017"]
    },
    {
     "id": "AC-012",
     "type": "acceptance-criterion",
     "statement": "Trong builder chuyển sang Tablet và kéo resize một field từ 6 xuống 4, rồi xoá giá trị tablet ở inspector → Chỉ span.tablet đổi; desktop/mobile giữ nguyên; mức kế thừa hiện nhãn \"Theo Desktop\"; xoá thì quay về kế thừa",
     "behavior": "Trong builder chuyển sang Tablet và kéo resize một field từ 6 xuống 4, rồi xoá giá trị tablet ở inspector",
     "expected_result": "Chỉ span.tablet đổi; desktop/mobile giữ nguyên; mức kế thừa hiện nhãn \"Theo Desktop\"; xoá thì quay về kế thừa",
     "verification_kind": "automated",
     "blocking": true,
     "requirement_refs": ["R-008"],
     "task_refs": ["TASK-004","TASK-005","TASK-018","TASK-020"],
     "evidence_refs": ["EVIDENCE-004","EVIDENCE-005","EVIDENCE-018","EVIDENCE-020"]
    },
    {
     "id": "AC-013",
     "type": "acceptance-criterion",
     "statement": "Builder nhận lại đúng schema vừa phát ([(schema)] vòng về) rồi nhận một schema khác nội dung → Vòng về không reset lịch sử undo/selection; schema khác nội dung nạp lại và reset lịch sử",
     "behavior": "Builder nhận lại đúng schema vừa phát ([(schema)] vòng về) rồi nhận một schema khác nội dung",
     "expected_result": "Vòng về không reset lịch sử undo/selection; schema khác nội dung nạp lại và reset lịch sử",
     "verification_kind": "automated",
     "blocking": true,
     "requirement_refs": ["R-008"],
     "task_refs": ["TASK-002","TASK-003","TASK-018","TASK-020"],
     "evidence_refs": ["EVIDENCE-002","EVIDENCE-003","EVIDENCE-018","EVIDENCE-020"]
    },
    {
     "id": "AC-014",
     "type": "acceptance-criterion",
     "statement": "Bật \"Bắt đầu hàng mới\" ở tab Bố cục của một field và dùng Xem trước ở cả 3 mức → Canvas và Xem trước xếp hàng giống nhau ở từng mức; Xem trước ép đúng mức đang chọn",
     "behavior": "Bật \"Bắt đầu hàng mới\" ở tab Bố cục của một field và dùng Xem trước ở cả 3 mức",
     "expected_result": "Canvas và Xem trước xếp hàng giống nhau ở từng mức; Xem trước ép đúng mức đang chọn",
     "verification_kind": "automated",
     "blocking": true,
     "requirement_refs": ["R-008"],
     "task_refs": ["TASK-004","TASK-005","TASK-020"],
     "evidence_refs": ["EVIDENCE-004","EVIDENCE-005","EVIDENCE-020"]
    },
    {
     "id": "AC-015",
     "type": "acceptance-criterion",
     "statement": "Đổi mã một field được tham chiếu trong rules (Filter field và so sánh field–field), options.params, options.fill, upload params, html query và validation cấp form → Mọi tham chiếu có cấu trúc chuyển sang mã mới; tham chiếu trong chuỗi tự do (hyperlink, nội dung HTML) giữ nguyên và được đếm trong câu xác nhận",
     "behavior": "Đổi mã một field được tham chiếu trong rules (Filter field và so sánh field–field), options.params, options.fill, upload params, html query và validation cấp form",
     "expected_result": "Mọi tham chiếu có cấu trúc chuyển sang mã mới; tham chiếu trong chuỗi tự do (hyperlink, nội dung HTML) giữ nguyên và được đếm trong câu xác nhận",
     "verification_kind": "automated",
     "blocking": true,
     "requirement_refs": ["R-009"],
     "task_refs": ["TASK-008","TASK-009","TASK-019","TASK-020"],
     "evidence_refs": ["EVIDENCE-008","EVIDENCE-009","EVIDENCE-019","EVIDENCE-020"]
    },
    {
     "id": "AC-016",
     "type": "acceptance-criterion",
     "statement": "Gọi SdFormRenderService.viewEntities(schema, entities) → Trả giá trị hiển thị theo từng field (nhãn lựa chọn, ngày, số theo preset) giống bản hiện tại",
     "behavior": "Gọi SdFormRenderService.viewEntities(schema, entities)",
     "expected_result": "Trả giá trị hiển thị theo từng field (nhãn lựa chọn, ngày, số theo preset) giống bản hiện tại",
     "verification_kind": "automated",
     "blocking": true,
     "requirement_refs": ["R-009"],
     "task_refs": ["TASK-010","TASK-011","TASK-014"],
     "evidence_refs": ["EVIDENCE-010","EVIDENCE-011","EVIDENCE-014"]
    },
    {
     "id": "AC-017",
     "type": "acceptance-criterion",
     "statement": "Kiểm tra public API và tài liệu sau thay đổi → SdFeelExpression và các export expression cũ không còn; CHANGELOG [Unreleased] có mục BREAKING kèm ví dụ trước/sau; sd-form-generic.md mô tả schema mới",
     "behavior": "Kiểm tra public API và tài liệu sau thay đổi",
     "expected_result": "SdFeelExpression và các export expression cũ không còn; CHANGELOG [Unreleased] có mục BREAKING kèm ví dụ trước/sau; sd-form-generic.md mô tả schema mới",
     "verification_kind": "manual",
     "blocking": true,
     "requirement_refs": ["R-010"],
     "task_refs": ["TASK-022","TASK-023"],
     "evidence_refs": ["EVIDENCE-022","EVIDENCE-023"]
    },
    {
     "id": "AC-018",
     "type": "acceptance-criterion",
     "statement": "Chạy full suite v19 có coverage, lint, check:i18n, check:i18n-parity, check:scss-hex, rồi npm run sync và check:sync → Tất cả xanh; v22 giữ LF",
     "behavior": "Chạy full suite v19 có coverage, lint, check:i18n, check:i18n-parity, check:scss-hex, rồi npm run sync và check:sync",
     "expected_result": "Tất cả xanh; v22 giữ LF",
     "verification_kind": "automated",
     "blocking": true,
     "requirement_refs": ["R-011"],
     "task_refs": ["TASK-025","TASK-026"],
     "evidence_refs": ["EVIDENCE-025","EVIDENCE-026"]
    },
    {
     "id": "AC-019",
     "type": "acceptance-criterion",
     "statement": "Chụp ảnh thật builder ở Desktop/Tablet/Mobile và renderer ở 3 bề rộng form → Ảnh cho thấy span theo mức, nhãn kế thừa, newRow và không có lỗi console",
     "behavior": "Chụp ảnh thật builder ở Desktop/Tablet/Mobile và renderer ở 3 bề rộng form",
     "expected_result": "Ảnh cho thấy span theo mức, nhãn kế thừa, newRow và không có lỗi console",
     "verification_kind": "manual",
     "blocking": true,
     "requirement_refs": ["R-008","R-011"],
     "task_refs": ["TASK-024"],
     "evidence_refs": ["EVIDENCE-024"]
    },
    {
     "id": "A-001",
     "type": "assumption",
     "statement": "Chưa có consumer nào dùng schema SdFormGeneric hay API form-generic hiện tại.",
     "evidence_refs": [],
     "source": "explicit",
     "confidence": "medium",
     "status": "confirmed",
     "blocking": false,
     "consequence_if_wrong": "Consumer ẩn (package public trên npm) sẽ vỡ khi nâng lên 3.0.",
     "validation_method": "Mục BREAKING trong CHANGELOG kèm ví dụ trước/sau; người dùng xác nhận trong brainstorming.",
     "owner": "user",
     "rationale": "Người dùng xác nhận chưa ai dùng nên chấp nhận đổi toàn bộ schema.",
     "impacted_refs": ["R-001","R-010"]
    },
    {
     "id": "A-002",
     "type": "assumption",
     "statement": "FilterUtilities.evaluate của @sdcorejs/utils 1.1.4 xử lý đủ toán tử mà sd-query-builder sinh ra (so sánh, like, IN, BETWEEN, NULL, ngày tương đối, so sánh field–field).",
     "evidence_refs": [],
     "source": "inferred",
     "confidence": "medium",
     "status": "proposed",
     "blocking": false,
     "consequence_if_wrong": "Một số điều kiện không đánh giá đúng; cần lớp bù nhỏ trong module.",
     "validation_method": "Test TDD cho từng toán tử trước khi viết renderer.",
     "owner": "sdcorejs-execute-plan",
     "rationale": "d.ts công khai match/evaluate/resolveRelativeDate; hành vi chi tiết cần test xác nhận.",
     "impacted_refs": ["R-003"]
    },
    {
     "id": "A-003",
     "type": "assumption",
     "statement": "Code builder/renderer đang có trong working tree (các vòng rewrite trước, chưa commit) là nền cho đợt 1; phần tương tác kéo-thả, resize, lịch sử undo được giữ và chuyển sang model mới.",
     "evidence_refs": [],
     "source": "inferred",
     "confidence": "high",
     "status": "proposed",
     "blocking": false,
     "consequence_if_wrong": "Phải viết lại cả lớp tương tác, khối lượng tăng mạnh.",
     "validation_method": "Rà soát lúc lập plan; người dùng duyệt spec.",
     "owner": "user",
     "rationale": "Người dùng đã chốt tiếp tục trên nhánh hiện tại.",
     "impacted_refs": ["R-008"]
    },
    {
     "id": "A-004",
     "type": "assumption",
     "statement": "Kiểu checklist (có trong model cũ nhưng renderer chưa hỗ trợ) không nằm trong phiên bản đầu tiên; chọn nhiều dùng select multiple.",
     "evidence_refs": [],
     "source": "defaulted",
     "confidence": "medium",
     "status": "proposed",
     "blocking": false,
     "consequence_if_wrong": "Cần bổ sung kiểu checkbox-group sau.",
     "validation_method": "Người dùng duyệt spec.",
     "owner": "user",
     "rationale": "Renderer hiện không có component cho checklist nên không mất chức năng đang chạy.",
     "impacted_refs": ["R-001","R-009"]
    },
    {
     "id": "A-005",
     "type": "assumption",
     "statement": "Biến của form dùng chung không gian key với field (builder đã chặn trùng); Filter được đánh giá trên { ...value, ...variables }.",
     "evidence_refs": [],
     "source": "inferred",
     "confidence": "high",
     "status": "proposed",
     "blocking": false,
     "consequence_if_wrong": "Điều kiện tham chiếu biến bị đánh giá sai.",
     "validation_method": "Test TDD cho rules tham chiếu biến.",
     "owner": "sdcorejs-execute-plan",
     "rationale": "Builder hiện kiểm tra trùng giữa key field và key biến.",
     "impacted_refs": ["R-003","R-009"]
    },
    {
     "id": "D-001",
     "type": "decision",
     "statement": "Có giữ tương thích schema SdFormGeneric cũ? → Không — thiết kế lại toàn bộ, coi là phiên bản đầu tiên, không schemaVersion, không hàm chuyển đổi",
     "question": "Có giữ tương thích schema SdFormGeneric cũ?",
     "selected_value": "Không — thiết kế lại toàn bộ, coi là phiên bản đầu tiên, không schemaVersion, không hàm chuyển đổi",
     "source": "explicit-user",
     "status": "approved",
     "blocking": true,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Chưa có consumer; schema cũ lẫn string/number, expression riêng, break ẩn.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {"candidate":false,"category":null},
     "downstream_refs": ["R-001","R-010","AC-001","AC-017"],
     "task_refs": ["TASK-002","TASK-003","TASK-022","TASK-023"]
    },
    {
     "id": "D-002",
     "type": "decision",
     "statement": "Mô hình cấu trúc? → Cây có ngữ pháp cố định: Form → pages (single | tabs | steps) → group → element; group không lồng; tabs/steps chỉ ở cấp form",
     "question": "Mô hình cấu trúc?",
     "selected_value": "Cây có ngữ pháp cố định: Form → pages (single | tabs | steps) → group → element; group không lồng; tabs/steps chỉ ở cấp form",
     "source": "explicit-user",
     "status": "approved",
     "blocking": true,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Đủ cho Group/Tabs/Steps/Table mà độ phức tạp kéo-thả vẫn kiểm soát được.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {"candidate":false,"category":null},
     "downstream_refs": ["R-001","AC-001"],
     "task_refs": ["TASK-002","TASK-003","TASK-018"]
    },
    {
     "id": "D-003",
     "type": "decision",
     "statement": "Bố cục responsive? → span theo 3 mức desktop/tablet/mobile + newRow; SD_FORM_GENERIC_BREAKPOINTS = { tablet: 600, desktop: 1024 } đo trên bề rộng form; mặc định desktop 12, tablet theo desktop, mobile 12; ghi đè qua provider",
     "question": "Bố cục responsive?",
     "selected_value": "span theo 3 mức desktop/tablet/mobile + newRow; SD_FORM_GENERIC_BREAKPOINTS = { tablet: 600, desktop: 1024 } đo trên bề rộng form; mặc định desktop 12, tablet theo desktop, mobile 12; ghi đè qua provider",
     "source": "explicit-user",
     "status": "approved",
     "blocking": true,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Form nằm trong drawer/dialog phải theo bề rộng thật của form, không theo màn hình.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {"candidate":false,"category":null},
     "downstream_refs": ["R-002","AC-002","AC-003","AC-004","AC-010"],
     "task_refs": ["TASK-004","TASK-005","TASK-016","TASK-020"]
    },
    {
     "id": "D-004",
     "type": "decision",
     "statement": "Định dạng điều kiện? → rules { visible, hidden, disabled, required } và validation cấp form dùng Filter của @sdcorejs/utils",
     "question": "Định dạng điều kiện?",
     "selected_value": "rules { visible, hidden, disabled, required } và validation cấp form dùng Filter của @sdcorejs/utils",
     "source": "explicit-user",
     "status": "approved",
     "blocking": true,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Một định dạng duy nhất với sd-query-builder; có sẵn FilterUtilities.evaluate.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {"candidate":false,"category":null},
     "downstream_refs": ["R-003","AC-005","AC-006"],
     "task_refs": ["TASK-006","TASK-007","TASK-008","TASK-009","TASK-016","TASK-019"]
    },
    {
     "id": "D-005",
     "type": "decision",
     "statement": "Nguồn lựa chọn? → options { source: static, items } | { source: catalog, catalog, params, fill }; SdFormGenericValueRef có cấu trúc; multiple là thuộc tính field",
     "question": "Nguồn lựa chọn?",
     "selected_value": "options { source: static, items } | { source: catalog, catalog, params, fill }; SdFormGenericValueRef có cấu trúc; multiple là thuộc tính field",
     "source": "explicit-user",
     "status": "approved",
     "blocking": true,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Bỏ values/valuesKey rời, label/display lẫn lộn, chuỗi ${key} và tên setVariables dễ nhầm.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {"candidate":false,"category":null},
     "downstream_refs": ["R-005","AC-008"],
     "task_refs": ["TASK-003","TASK-006","TASK-007","TASK-017","TASK-019"]
    },
    {
     "id": "D-006",
     "type": "decision",
     "statement": "Cấu hình portal? → provideSdFormGeneric({ catalogs, templates, htmlDefinitions, validators, breakpoints })",
     "question": "Cấu hình portal?",
     "selected_value": "provideSdFormGeneric({ catalogs, templates, htmlDefinitions, validators, breakpoints })",
     "source": "explicit-user",
     "status": "approved",
     "blocking": true,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Một điểm cấu hình, một shape cho mỗi loại nguồn.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {"candidate":false,"category":null},
     "downstream_refs": ["R-006","AC-003","AC-008"],
     "task_refs": ["TASK-012","TASK-013","TASK-014"]
    },
    {
     "id": "D-007",
     "type": "decision",
     "statement": "API component? → sd-form-render [schema] [(value)] [form] [variables] [viewed] [breakpoint] (sdAction); sd-form-builder [(schema)]; không mutate input; defaultValue theo field",
     "question": "API component?",
     "selected_value": "sd-form-render [schema] [(value)] [form] [variables] [viewed] [breakpoint] (sdAction); sd-form-builder [(schema)]; không mutate input; defaultValue theo field",
     "source": "explicit-user",
     "status": "approved",
     "blocking": true,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Signal-first, tên thống nhất schema cho cả hai component.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {"candidate":false,"category":null},
     "downstream_refs": ["R-007","R-008","AC-009","AC-010","AC-013"],
     "task_refs": ["TASK-016","TASK-020"]
    },
    {
     "id": "D-008",
     "type": "decision",
     "statement": "Chức năng hiện có? → Giữ đủ, mọi biểu thức đổi sang Filter, bỏ sd-feel-expression",
     "question": "Chức năng hiện có?",
     "selected_value": "Giữ đủ, mọi biểu thức đổi sang Filter, bỏ sd-feel-expression",
     "source": "explicit-user",
     "status": "approved",
     "blocking": true,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Không mất chức năng, chỉ còn một định dạng biểu thức.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {"candidate":false,"category":null},
     "downstream_refs": ["R-009","R-010","AC-015","AC-016","AC-017"],
     "task_refs": ["TASK-008","TASK-009","TASK-010","TASK-011","TASK-014","TASK-019","TASK-022"]
    },
    {
     "id": "D-009",
     "type": "decision",
     "statement": "Đặt tên? → Type dùng tiền tố SdFormGeneric*, hằng số SD_FORM_GENERIC_*",
     "question": "Đặt tên?",
     "selected_value": "Type dùng tiền tố SdFormGeneric*, hằng số SD_FORM_GENERIC_*",
     "source": "explicit-user",
     "status": "approved",
     "blocking": true,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Theo tên hằng số người dùng chọn.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {"candidate":false,"category":null},
     "downstream_refs": ["R-001","R-002"],
     "task_refs": ["TASK-003","TASK-005"]
    },
    {
     "id": "D-010",
     "type": "decision",
     "statement": "Cách giao? → 3 đợt trong bản 3.0 chưa phát hành: đợt 1 nền, đợt 2 Tĩnh + Nút, đợt 3 Cấu trúc; CHANGELOG mục BREAKING",
     "question": "Cách giao?",
     "selected_value": "3 đợt trong bản 3.0 chưa phát hành: đợt 1 nền, đợt 2 Tĩnh + Nút, đợt 3 Cấu trúc; CHANGELOG mục BREAKING",
     "source": "explicit-user",
     "status": "approved",
     "blocking": true,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Mỗi đợt tự chạy được và review sớm.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {"candidate":false,"category":null},
     "downstream_refs": ["R-001","R-010","R-011"],
     "task_refs": ["TASK-023","TASK-026"]
    },
    {
     "id": "D-011",
     "type": "decision",
     "statement": "Cách test? → TDD cho logic; viết test sau cho giao diện kèm ảnh chụp thật",
     "question": "Cách test?",
     "selected_value": "TDD cho logic; viết test sau cho giao diện kèm ảnh chụp thật",
     "source": "explicit-user",
     "status": "approved",
     "blocking": true,
     "scope": "repository",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Logic model/rules/layout rủi ro cao; UI cần kiểm chứng trực quan.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {"candidate":false,"category":null},
     "downstream_refs": ["R-011","AC-018","AC-019"],
     "task_refs": ["TASK-002","TASK-004","TASK-006","TASK-008","TASK-010","TASK-012","TASK-024","TASK-025"]
    },
    {
     "id": "D-012",
     "type": "decision",
     "statement": "Tên type của field và container? → Giữ tên type field hiện có (textfield, textarea, number, select, radio, checkbox, datetime, chip-string, chip-calendar, upload, html); container giữ type group",
     "question": "Tên type của field và container?",
     "selected_value": "Giữ tên type field hiện có (textfield, textarea, number, select, radio, checkbox, datetime, chip-string, chip-calendar, upload, html); container giữ type group",
     "source": "approved-spec",
     "status": "proposed",
     "blocking": false,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Giảm thay đổi không cần thiết; người dùng quen tên Group.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {"candidate":false,"category":null},
     "downstream_refs": ["R-001","AC-001"],
     "task_refs": ["TASK-003","TASK-017"]
    },
    {
     "id": "D-013",
     "type": "decision",
     "statement": "Form một trang lưu thế nào? → Luôn là pages: [ … ] (một phần tử khi không dùng tabs/steps); builder ẩn khái niệm trang ở chế độ một trang",
     "question": "Form một trang lưu thế nào?",
     "selected_value": "Luôn là pages: [ … ] (một phần tử khi không dùng tabs/steps); builder ẩn khái niệm trang ở chế độ một trang",
     "source": "approved-spec",
     "status": "proposed",
     "blocking": false,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Một shape duy nhất, đợt 3 thêm tabs/steps không đổi schema.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {"candidate":false,"category":null},
     "downstream_refs": ["R-001","AC-001"],
     "task_refs": ["TASK-002","TASK-003","TASK-018"]
    },
    {
     "id": "D-014",
     "type": "decision",
     "statement": "validate() thuộc đợt nào? → Đợt 1 (thay getValidationMessages để giữ chức năng); submit()/reset() và (sdAction) có hiệu lực ở đợt 2 cùng button",
     "question": "validate() thuộc đợt nào?",
     "selected_value": "Đợt 1 (thay getValidationMessages để giữ chức năng); submit()/reset() và (sdAction) có hiệu lực ở đợt 2 cùng button",
     "source": "approved-spec",
     "status": "proposed",
     "blocking": false,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Validation cấp form đang có phải chạy được ngay đợt 1.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {"candidate":false,"category":null},
     "downstream_refs": ["R-007","AC-006"],
     "task_refs": ["TASK-008","TASK-009","TASK-016"]
    },
    {
     "id": "D-015",
     "type": "decision",
     "statement": "Table ở đợt 1? → Chưa hỗ trợ; shape container table chừa sẵn và làm ở đợt 3",
     "question": "Table ở đợt 1?",
     "selected_value": "Chưa hỗ trợ; shape container table chừa sẵn và làm ở đợt 3",
     "source": "approved-spec",
     "status": "proposed",
     "blocking": false,
     "scope": "module",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Table đổi hẳn sang cột là field con; làm hai lần sẽ phí công. Bản 3.0 chưa phát hành nên tạm thiếu Table giữa các đợt là chấp nhận được.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {"candidate":false,"category":null},
     "downstream_refs": ["R-001","R-009"],
     "task_refs": ["TASK-017","TASK-019"]
    },
    {
     "id": "D-016",
     "type": "decision",
     "statement": "Giới hạn field được render (input properties cũ)? → Giữ, đổi tên thành [keys] (danh sách key field được render)",
     "question": "Giới hạn field được render (input properties cũ)?",
     "selected_value": "Giữ, đổi tên thành [keys] (danh sách key field được render)",
     "source": "approved-spec",
     "status": "proposed",
     "blocking": false,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Giữ chức năng hiện có với tên rõ nghĩa.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {"candidate":false,"category":null},
     "downstream_refs": ["R-007"],
     "task_refs": ["TASK-016"]
    },
    {
     "id": "D-017",
     "type": "decision",
     "statement": "Mở rộng union phần tử ở đợt 2/3 thế nào, và code gặp type lạ thì xử lý ra sao? → Thêm thành viên mới vào union SdFormGenericElement (và giá trị navigation) mà không đổi shape thành viên cũ. Renderer bỏ qua type lạ (cảnh báo khi dev mode); builder giữ nguyên phần tử lạ khi nạp → phát (round-trip) và hiện thẻ \"chưa hỗ trợ\".",
     "question": "Mở rộng union phần tử ở đợt 2/3 thế nào, và code gặp type lạ thì xử lý ra sao?",
     "selected_value": "Thêm thành viên mới vào union SdFormGenericElement (và giá trị navigation) mà không đổi shape thành viên cũ. Renderer bỏ qua type lạ (cảnh báo khi dev mode); builder giữ nguyên phần tử lạ khi nạp → phát (round-trip) và hiện thẻ \"chưa hỗ trợ\".",
     "source": "approved-architecture",
     "status": "proposed",
     "blocking": false,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Các đợt sau là các đơn vị làm độc lập; luật mở rộng phải cố định trước để không phá schema đợt 1.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {"candidate":false,"category":null},
     "downstream_refs": ["R-001","AC-001"],
     "task_refs": ["TASK-002","TASK-003","TASK-016","TASK-018"]
    },
    {
     "id": "D-018",
     "type": "decision",
     "statement": "Tách lõi thuần TS ở đâu? → models (type + normalize/validate grammar), layout (breakpoint, kế thừa span, xếp hàng) và rules (đánh giá Filter, duyệt/đổi tham chiếu) là TypeScript thuần — không DI, không DOM; renderer và builder chỉ phụ thuộc chiều vào chúng.",
     "question": "Tách lõi thuần TS ở đâu?",
     "selected_value": "models (type + normalize/validate grammar), layout (breakpoint, kế thừa span, xếp hàng) và rules (đánh giá Filter, duyệt/đổi tham chiếu) là TypeScript thuần — không DI, không DOM; renderer và builder chỉ phụ thuộc chiều vào chúng.",
     "source": "approved-architecture",
     "status": "proposed",
     "blocking": false,
     "scope": "module",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Canvas và renderer phải xếp giống nhau; logic cần TDD nhanh, không cần TestBed.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {"candidate":false,"category":null},
     "downstream_refs": ["R-002","R-003","AC-002","AC-004","AC-005","AC-015"],
     "task_refs": ["TASK-003","TASK-005","TASK-007","TASK-009","TASK-011"]
    },
    {
     "id": "D-019",
     "type": "decision",
     "statement": "Item của catalog và bộ nhớ đệm? → Catalog trả SdFormGenericCatalogItem = SdFormGenericOption & { data?: Record<string, unknown> }; fill đọc item.data[from]. Kết quả load được đệm theo từng instance renderer, khoá bằng catalog id + params đã giải; không dùng bộ đệm toàn cục.",
     "question": "Item của catalog và bộ nhớ đệm?",
     "selected_value": "Catalog trả SdFormGenericCatalogItem = SdFormGenericOption & { data?: Record<string, unknown> }; fill đọc item.data[from]. Kết quả load được đệm theo từng instance renderer, khoá bằng catalog id + params đã giải; không dùng bộ đệm toàn cục.",
     "source": "approved-architecture",
     "status": "proposed",
     "blocking": false,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Hai form cùng trang không được dùng lẫn dữ liệu; fill cần dữ liệu ngoài value/label.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {"candidate":false,"category":null},
     "downstream_refs": ["R-005","AC-008"],
     "task_refs": ["TASK-012","TASK-013"]
    },
    {
     "id": "D-020",
     "type": "decision",
     "statement": "Ngữ nghĩa value và validate()? → value chỉ gồm key của field (không có phần tử tĩnh/nút), giữ giá trị của field đang ẩn; valueChange phát object mới sau mỗi thay đổi control (không debounce). validate() đánh dấu mọi control đã chạm, chạy validator của field rồi validations cấp form, trả { valid, messages: { error, warning } }; chỉ error làm valid = false.",
     "question": "Ngữ nghĩa value và validate()?",
     "selected_value": "value chỉ gồm key của field (không có phần tử tĩnh/nút), giữ giá trị của field đang ẩn; valueChange phát object mới sau mỗi thay đổi control (không debounce). validate() đánh dấu mọi control đã chạm, chạy validator của field rồi validations cấp form, trả { valid, messages: { error, warning } }; chỉ error làm valid = false.",
     "source": "approved-architecture",
     "status": "proposed",
     "blocking": false,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Consumer và các đợt sau phải hiểu value và validate() giống nhau.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {"candidate":false,"category":null},
     "downstream_refs": ["R-007","AC-006","AC-009"],
     "task_refs": ["TASK-006","TASK-007","TASK-009","TASK-016"]
    },
    {
     "id": "D-021",
     "type": "decision",
     "statement": "Ranh giới kiểm chứng của validation map? → kind none — form-generic là thư viện UI, không xác thực người dùng và không gọi HTTP (INV-009); mọi AC chứng minh bằng Karma unit/component, lệnh kiểm tra của repo hoặc ảnh chụp thủ công",
     "question": "Ranh giới kiểm chứng của validation map?",
     "selected_value": "kind none — form-generic là thư viện UI, không xác thực người dùng và không gọi HTTP (INV-009); mọi AC chứng minh bằng Karma unit/component, lệnh kiểm tra của repo hoặc ảnh chụp thủ công",
     "source": "approved-plan",
     "status": "proposed",
     "blocking": false,
     "scope": "repository",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Không có ranh giới phân quyền nào trong phạm vi nên không cần bằng chứng từ chối ở API; một ranh giới chung cho mọi dòng.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {"candidate":false,"category":null},
     "downstream_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"],
     "validation_boundary": {
      "kind": "none",
      "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
     },
     "task_refs": ["TASK-025"]
    },
    {
     "id": "D-022",
     "type": "decision",
     "statement": "Các thuộc tính/API cũ không có trong hợp đồng mới xử lý thế nào? → Bỏ ở đợt 1 và ghi trong mục BREAKING: onLoaded (consumer tự biết lúc đặt [schema]); beforeSubmit, properties.onChange.setValues và kiểu checklist (renderer chưa từng thực thi); setVariables và VariableComponent (thay bằng options.fill và [variables]); field table (D-015, làm lại ở đợt 3)",
     "question": "Các thuộc tính/API cũ không có trong hợp đồng mới xử lý thế nào?",
     "selected_value": "Bỏ ở đợt 1 và ghi trong mục BREAKING: onLoaded (consumer tự biết lúc đặt [schema]); beforeSubmit, properties.onChange.setValues và kiểu checklist (renderer chưa từng thực thi); setVariables và VariableComponent (thay bằng options.fill và [variables]); field table (D-015, làm lại ở đợt 3)",
     "source": "approved-plan",
     "status": "proposed",
     "blocking": false,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Hợp đồng C-002 đã duyệt không có các mục này; phần lớn chưa từng chạy ở renderer nên không mất chức năng đang dùng.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {"candidate":false,"category":null},
     "downstream_refs": ["R-009","R-010","AC-017"],
     "task_refs": ["TASK-016","TASK-022","TASK-023"]
    },
    {
     "id": "D-023",
     "type": "decision",
     "statement": "validate() gặp validator hàm chưa được đăng ký ở provider? → Fail-closed: thêm một lỗi error nêu mã validator chưa đăng ký, valid = false; không bỏ qua im lặng",
     "question": "validate() gặp validator hàm chưa được đăng ký ở provider?",
     "selected_value": "Fail-closed: thêm một lỗi error nêu mã validator chưa đăng ký, valid = false; không bỏ qua im lặng",
     "source": "approved-plan",
     "status": "proposed",
     "blocking": false,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Cấu hình portal thiếu validator phải lộ ra ngay, không để dữ liệu sai lọt qua.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {"candidate":false,"category":null},
     "downstream_refs": ["R-003","AC-006"],
     "task_refs": ["TASK-008","TASK-009"]
    },
    {
     "id": "INV-001",
     "type": "invariant",
     "statement": "sd-form-render không bao giờ mutate schema, value hay variables được truyền vào; sd-form-builder không bao giờ mutate schema được truyền vào; mọi lần phát là object mới.",
     "protected_refs": ["R-007","R-008","AC-009","AC-013"],
     "task_refs": ["TASK-007","TASK-016","TASK-018","TASK-020"],
     "evidence_refs": ["EVIDENCE-016","EVIDENCE-018"]
    },
    {
     "id": "INV-002",
     "type": "invariant",
     "statement": "Chọn mức breakpoint, kế thừa span và xếp hàng (kể cả newRow) do một module layout thuần duy nhất đảm nhận; canvas và renderer cho cùng input + cùng mức luôn ra cùng các hàng.",
     "protected_refs": ["R-002","AC-002","AC-003","AC-004","AC-010","AC-014"],
     "task_refs": ["TASK-005","TASK-016","TASK-018","TASK-020"],
     "evidence_refs": ["EVIDENCE-005","EVIDENCE-020"]
    },
    {
     "id": "INV-003",
     "type": "invariant",
     "statement": "Mọi điều kiện (rules) và validation cấp form dạng biểu thức đều là Filter, đánh giá bởi một evaluator duy nhất bọc FilterUtilities.evaluate trên { ...value, ...variables }; không còn định dạng biểu thức nào khác trong schema hay runtime.",
     "protected_refs": ["R-003","AC-005","AC-006"],
     "task_refs": ["TASK-007","TASK-009","TASK-016","TASK-019","TASK-022"],
     "evidence_refs": ["EVIDENCE-007","EVIDENCE-016"]
    },
    {
     "id": "INV-004",
     "type": "invariant",
     "statement": "Schema luôn đúng ngữ pháp: pages → (group | element), group chỉ chứa element, không có break, không có schemaVersion, key field duy nhất (kể cả so với biến); mọi lệnh của builder chỉ tạo ra schema hợp lệ.",
     "protected_refs": ["R-001","AC-001"],
     "task_refs": ["TASK-003","TASK-018"],
     "evidence_refs": ["EVIDENCE-003","EVIDENCE-018"]
    },
    {
     "id": "INV-005",
     "type": "invariant",
     "statement": "Mọi tham chiếu tới key field hoặc biến trong schema đều có cấu trúc (Filter.field và so sánh field–field, SdFormGenericValueRef, fill.field); chuỗi tự do chỉ còn ở hyperlink và nội dung html.",
     "protected_refs": ["R-005","R-009","AC-008","AC-015"],
     "task_refs": ["TASK-003","TASK-009","TASK-019"],
     "evidence_refs": ["EVIDENCE-009"]
    },
    {
     "id": "INV-006",
     "type": "invariant",
     "statement": "Thêm type phần tử mới (đợt 2/3) không đổi shape của type đã có; phần tử có type lạ được renderer bỏ qua và được builder giữ nguyên khi phát lại.",
     "protected_refs": ["R-001","AC-001"],
     "task_refs": ["TASK-003","TASK-016","TASK-018"],
     "evidence_refs": ["EVIDENCE-003","EVIDENCE-016","EVIDENCE-018"]
    },
    {
     "id": "INV-007",
     "type": "invariant",
     "statement": "Chỉ sửa code ở versions/v19; v20/v21/v22 chỉ đổi qua npm run sync và check:sync luôn qua; v22 giữ LF.",
     "protected_refs": ["R-011","AC-018"],
     "task_refs": ["TASK-001","TASK-026"],
     "evidence_refs": ["EVIDENCE-026"]
    },
    {
     "id": "INV-008",
     "type": "invariant",
     "statement": "Public API của entry form-generic đúng bằng danh sách hợp đồng C-001…C-006; mọi export cũ bị bỏ đều được liệt kê trong mục BREAKING của CHANGELOG.",
     "protected_refs": ["R-010","AC-017"],
     "task_refs": ["TASK-022","TASK-023"],
     "evidence_refs": ["EVIDENCE-022"]
    },
    {
     "id": "INV-009",
     "type": "invariant",
     "statement": "Component không tự gọi HTTP; dữ liệu của portal chỉ đi qua callback trong provideSdFormGeneric (catalog.load/search, htmlDefinitions, validators, templates).",
     "protected_refs": ["R-005","R-006","AC-008"],
     "task_refs": ["TASK-013","TASK-014","TASK-017"],
     "evidence_refs": ["EVIDENCE-013","EVIDENCE-014"]
    }
   ],
   "history": [
    {
     "revision": 1,
     "active": [
      {"id":"R-001","type":"requirement"},
      {"id":"R-002","type":"requirement"},
      {"id":"R-003","type":"requirement"},
      {"id":"R-004","type":"requirement"},
      {"id":"R-005","type":"requirement"},
      {"id":"R-006","type":"requirement"},
      {"id":"R-007","type":"requirement"},
      {"id":"R-008","type":"requirement"},
      {"id":"R-009","type":"requirement"},
      {"id":"R-010","type":"requirement"},
      {"id":"R-011","type":"requirement"},
      {"id":"AC-001","type":"acceptance-criterion"},
      {"id":"AC-002","type":"acceptance-criterion"},
      {"id":"AC-003","type":"acceptance-criterion"},
      {"id":"AC-004","type":"acceptance-criterion"},
      {"id":"AC-005","type":"acceptance-criterion"},
      {"id":"AC-006","type":"acceptance-criterion"},
      {"id":"AC-007","type":"acceptance-criterion"},
      {"id":"AC-008","type":"acceptance-criterion"},
      {"id":"AC-009","type":"acceptance-criterion"},
      {"id":"AC-010","type":"acceptance-criterion"},
      {"id":"AC-011","type":"acceptance-criterion"},
      {"id":"AC-012","type":"acceptance-criterion"},
      {"id":"AC-013","type":"acceptance-criterion"},
      {"id":"AC-014","type":"acceptance-criterion"},
      {"id":"AC-015","type":"acceptance-criterion"},
      {"id":"AC-016","type":"acceptance-criterion"},
      {"id":"AC-017","type":"acceptance-criterion"},
      {"id":"AC-018","type":"acceptance-criterion"},
      {"id":"AC-019","type":"acceptance-criterion"},
      {"id":"A-001","type":"assumption"},
      {"id":"A-002","type":"assumption"},
      {"id":"A-003","type":"assumption"},
      {"id":"A-004","type":"assumption"},
      {"id":"A-005","type":"assumption"},
      {"id":"D-001","type":"decision"},
      {"id":"D-002","type":"decision"},
      {"id":"D-003","type":"decision"},
      {"id":"D-004","type":"decision"},
      {"id":"D-005","type":"decision"},
      {"id":"D-006","type":"decision"},
      {"id":"D-007","type":"decision"},
      {"id":"D-008","type":"decision"},
      {"id":"D-009","type":"decision"},
      {"id":"D-010","type":"decision"},
      {"id":"D-011","type":"decision"},
      {"id":"D-012","type":"decision"},
      {"id":"D-013","type":"decision"},
      {"id":"D-014","type":"decision"},
      {"id":"D-015","type":"decision"},
      {"id":"D-016","type":"decision"}
     ],
     "tombstones": []
    },
    {
     "revision": 2,
     "active": [
      {"id":"R-001","type":"requirement"},
      {"id":"R-002","type":"requirement"},
      {"id":"R-003","type":"requirement"},
      {"id":"R-004","type":"requirement"},
      {"id":"R-005","type":"requirement"},
      {"id":"R-006","type":"requirement"},
      {"id":"R-007","type":"requirement"},
      {"id":"R-008","type":"requirement"},
      {"id":"R-009","type":"requirement"},
      {"id":"R-010","type":"requirement"},
      {"id":"R-011","type":"requirement"},
      {"id":"AC-001","type":"acceptance-criterion"},
      {"id":"AC-002","type":"acceptance-criterion"},
      {"id":"AC-003","type":"acceptance-criterion"},
      {"id":"AC-004","type":"acceptance-criterion"},
      {"id":"AC-005","type":"acceptance-criterion"},
      {"id":"AC-006","type":"acceptance-criterion"},
      {"id":"AC-007","type":"acceptance-criterion"},
      {"id":"AC-008","type":"acceptance-criterion"},
      {"id":"AC-009","type":"acceptance-criterion"},
      {"id":"AC-010","type":"acceptance-criterion"},
      {"id":"AC-011","type":"acceptance-criterion"},
      {"id":"AC-012","type":"acceptance-criterion"},
      {"id":"AC-013","type":"acceptance-criterion"},
      {"id":"AC-014","type":"acceptance-criterion"},
      {"id":"AC-015","type":"acceptance-criterion"},
      {"id":"AC-016","type":"acceptance-criterion"},
      {"id":"AC-017","type":"acceptance-criterion"},
      {"id":"AC-018","type":"acceptance-criterion"},
      {"id":"AC-019","type":"acceptance-criterion"},
      {"id":"A-001","type":"assumption"},
      {"id":"A-002","type":"assumption"},
      {"id":"A-003","type":"assumption"},
      {"id":"A-004","type":"assumption"},
      {"id":"A-005","type":"assumption"},
      {"id":"D-001","type":"decision"},
      {"id":"D-002","type":"decision"},
      {"id":"D-003","type":"decision"},
      {"id":"D-004","type":"decision"},
      {"id":"D-005","type":"decision"},
      {"id":"D-006","type":"decision"},
      {"id":"D-007","type":"decision"},
      {"id":"D-008","type":"decision"},
      {"id":"D-009","type":"decision"},
      {"id":"D-010","type":"decision"},
      {"id":"D-011","type":"decision"},
      {"id":"D-012","type":"decision"},
      {"id":"D-013","type":"decision"},
      {"id":"D-014","type":"decision"},
      {"id":"D-015","type":"decision"},
      {"id":"D-016","type":"decision"},
      {"id":"D-017","type":"decision"},
      {"id":"D-018","type":"decision"},
      {"id":"D-019","type":"decision"},
      {"id":"D-020","type":"decision"},
      {"id":"INV-001","type":"invariant"},
      {"id":"INV-002","type":"invariant"},
      {"id":"INV-003","type":"invariant"},
      {"id":"INV-004","type":"invariant"},
      {"id":"INV-005","type":"invariant"},
      {"id":"INV-006","type":"invariant"},
      {"id":"INV-007","type":"invariant"},
      {"id":"INV-008","type":"invariant"},
      {"id":"INV-009","type":"invariant"}
     ],
     "tombstones": []
    },
    {
     "revision": 3,
     "active": [
      {"id":"R-001","type":"requirement"},
      {"id":"R-002","type":"requirement"},
      {"id":"R-003","type":"requirement"},
      {"id":"R-004","type":"requirement"},
      {"id":"R-005","type":"requirement"},
      {"id":"R-006","type":"requirement"},
      {"id":"R-007","type":"requirement"},
      {"id":"R-008","type":"requirement"},
      {"id":"R-009","type":"requirement"},
      {"id":"R-010","type":"requirement"},
      {"id":"R-011","type":"requirement"},
      {"id":"AC-001","type":"acceptance-criterion"},
      {"id":"AC-002","type":"acceptance-criterion"},
      {"id":"AC-003","type":"acceptance-criterion"},
      {"id":"AC-004","type":"acceptance-criterion"},
      {"id":"AC-005","type":"acceptance-criterion"},
      {"id":"AC-006","type":"acceptance-criterion"},
      {"id":"AC-007","type":"acceptance-criterion"},
      {"id":"AC-008","type":"acceptance-criterion"},
      {"id":"AC-009","type":"acceptance-criterion"},
      {"id":"AC-010","type":"acceptance-criterion"},
      {"id":"AC-011","type":"acceptance-criterion"},
      {"id":"AC-012","type":"acceptance-criterion"},
      {"id":"AC-013","type":"acceptance-criterion"},
      {"id":"AC-014","type":"acceptance-criterion"},
      {"id":"AC-015","type":"acceptance-criterion"},
      {"id":"AC-016","type":"acceptance-criterion"},
      {"id":"AC-017","type":"acceptance-criterion"},
      {"id":"AC-018","type":"acceptance-criterion"},
      {"id":"AC-019","type":"acceptance-criterion"},
      {"id":"A-001","type":"assumption"},
      {"id":"A-002","type":"assumption"},
      {"id":"A-003","type":"assumption"},
      {"id":"A-004","type":"assumption"},
      {"id":"A-005","type":"assumption"},
      {"id":"D-001","type":"decision"},
      {"id":"D-002","type":"decision"},
      {"id":"D-003","type":"decision"},
      {"id":"D-004","type":"decision"},
      {"id":"D-005","type":"decision"},
      {"id":"D-006","type":"decision"},
      {"id":"D-007","type":"decision"},
      {"id":"D-008","type":"decision"},
      {"id":"D-009","type":"decision"},
      {"id":"D-010","type":"decision"},
      {"id":"D-011","type":"decision"},
      {"id":"D-012","type":"decision"},
      {"id":"D-013","type":"decision"},
      {"id":"D-014","type":"decision"},
      {"id":"D-015","type":"decision"},
      {"id":"D-016","type":"decision"},
      {"id":"D-017","type":"decision"},
      {"id":"D-018","type":"decision"},
      {"id":"D-019","type":"decision"},
      {"id":"D-020","type":"decision"},
      {"id":"D-021","type":"decision"},
      {"id":"D-022","type":"decision"},
      {"id":"D-023","type":"decision"},
      {"id":"INV-001","type":"invariant"},
      {"id":"INV-002","type":"invariant"},
      {"id":"INV-003","type":"invariant"},
      {"id":"INV-004","type":"invariant"},
      {"id":"INV-005","type":"invariant"},
      {"id":"INV-006","type":"invariant"},
      {"id":"INV-007","type":"invariant"},
      {"id":"INV-008","type":"invariant"},
      {"id":"INV-009","type":"invariant"}
     ],
     "tombstones": []
    }
   ]
  },
  "goals": [
   {
    "id": "G-001",
    "statement": "Lõi TypeScript thuần (model, layout, rules, provider, catalog) có test TDD xanh trước khi chuyển component.",
    "task_refs": ["TASK-002","TASK-003","TASK-004","TASK-005","TASK-006","TASK-007","TASK-008","TASK-009","TASK-010","TASK-011","TASK-012","TASK-013"]
   },
   {
    "id": "G-002",
    "statement": "sd-form-render chạy trên SdFormGenericSchema với API mới, không mutate input, bố cục 3 mức theo bề rộng form.",
    "task_refs": ["TASK-014","TASK-015","TASK-016","TASK-017"]
   },
   {
    "id": "G-003",
    "statement": "sd-form-builder thiết kế trên schema mới với Desktop/Tablet/Mobile, newRow và điều kiện Filter.",
    "task_refs": ["TASK-018","TASK-019","TASK-020"]
   },
   {
    "id": "G-004",
    "statement": "Public API, i18n, tài liệu, CHANGELOG và showcase phản ánh đúng schema mới.",
    "task_refs": ["TASK-021","TASK-022","TASK-023","TASK-024"]
   },
   {
    "id": "G-005",
    "statement": "Kiểm chứng đầy đủ trên v19 và rollout v20–v22 an toàn, v22 giữ LF.",
    "task_refs": ["TASK-001","TASK-025","TASK-026"]
   }
  ],
  "tasks": [
   {
    "id": "TASK-001",
    "title": "Preflight working tree và chẩn đoán lỗi rollout lần trước",
    "action": "VERIFY",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [],
    "planned_paths": ["scripts/sync-multi-version-workspaces.ps1"],
    "changes": [
     {"action":"VERIFY","path":"scripts/sync-multi-version-workspaces.ps1"}
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-001",
      "kind": "preflight-report",
      "record_refs": ["R-011","INV-007"],
      "description": "Báo cáo preflight (status, diffstat, branch, HEAD) và nguyên nhân lỗi sync."
     }
    ],
    "justification_refs": ["R-011"],
    "enforces_invariant_refs": ["INV-007"]
   },
   {
    "id": "TASK-002",
    "title": "RED — test ngữ pháp schema",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": ["TASK-001"],
    "planned_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.spec.ts"],
    "changes": [
     {"action":"CREATE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.spec.ts"}
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-002",
      "kind": "red-run",
      "record_refs": ["R-001","AC-001","AC-013"],
      "description": "RED: focused Karma thất bại vì thiếu module (lệnh + dòng lỗi quyết định)."
     }
    ],
    "justification_refs": ["R-001","D-001","D-002","D-011","D-013","D-017"],
    "enforces_invariant_refs": []
   },
   {
    "id": "TASK-003",
    "title": "GREEN — model v1 và helper ngữ pháp",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": ["TASK-002"],
    "planned_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-field.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-config.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.ts"],
    "changes": [
     {"action":"CREATE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.model.ts"},
     {"action":"CREATE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-field.model.ts"},
     {"action":"CREATE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-config.model.ts"},
     {"action":"CREATE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.ts"}
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-003",
      "kind": "green-run",
      "record_refs": ["R-001","AC-001","AC-013","INV-004","INV-005","INV-006"],
      "description": "GREEN: `form-generic-schema.spec.ts` pass."
     }
    ],
    "justification_refs": ["R-001","R-004","R-005","D-001","D-002","D-005","D-009","D-012","D-013","D-017","D-018"],
    "enforces_invariant_refs": ["INV-004","INV-005","INV-006"]
   },
   {
    "id": "TASK-004",
    "title": "RED — test bố cục 3 mức",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": ["TASK-003"],
    "planned_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/layout/form-generic-layout.spec.ts"],
    "changes": [
     {"action":"CREATE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/layout/form-generic-layout.spec.ts"}
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-004",
      "kind": "red-run",
      "record_refs": ["R-002","AC-002","AC-003","AC-004","AC-010","AC-012","AC-014"],
      "description": "RED: layout spec thất bại vì thiếu module."
     }
    ],
    "justification_refs": ["R-002","D-003","D-011"],
    "enforces_invariant_refs": []
   },
   {
    "id": "TASK-005",
    "title": "GREEN — module layout dùng chung",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": ["TASK-004"],
    "planned_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/form-generic-breakpoints.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/layout/form-generic-layout.ts"],
    "changes": [
     {"action":"CREATE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/form-generic-breakpoints.ts"},
     {"action":"CREATE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/layout/form-generic-layout.ts"}
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-005",
      "kind": "green-run",
      "record_refs": ["R-002","AC-002","AC-003","AC-004","AC-010","AC-012","AC-014","INV-002"],
      "description": "GREEN: layout spec pass."
     }
    ],
    "justification_refs": ["R-002","D-003","D-009","D-018"],
    "enforces_invariant_refs": ["INV-002"]
   },
   {
    "id": "TASK-006",
    "title": "RED — test evaluator Filter và giá trị form",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": ["TASK-005"],
    "planned_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-filter.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-values.spec.ts"],
    "changes": [
     {"action":"CREATE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-filter.spec.ts"},
     {"action":"CREATE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-values.spec.ts"}
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-006",
      "kind": "red-run",
      "record_refs": ["R-003","R-005","R-007","AC-005","AC-008","AC-009","AC-011"],
      "description": "RED: filter/values spec thất bại vì thiếu module."
     }
    ],
    "justification_refs": ["R-003","R-005","R-007","D-004","D-005","D-011","D-020"],
    "enforces_invariant_refs": []
   },
   {
    "id": "TASK-007",
    "title": "GREEN — evaluator Filter duy nhất và hàm giá trị",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": ["TASK-006"],
    "planned_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-filter.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-values.ts"],
    "changes": [
     {"action":"CREATE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-filter.ts"},
     {"action":"CREATE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-values.ts"}
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-007",
      "kind": "green-run",
      "record_refs": ["R-003","R-005","R-007","AC-005","AC-008","AC-009","AC-011","INV-001","INV-003"],
      "description": "GREEN: filter/values spec pass kèm bảng toán tử."
     }
    ],
    "justification_refs": ["R-003","R-005","R-007","D-004","D-005","D-018","D-020"],
    "enforces_invariant_refs": ["INV-001","INV-003"]
   },
   {
    "id": "TASK-008",
    "title": "RED — test validation cấp form và đổi mã",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": ["TASK-007"],
    "planned_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-references.spec.ts"],
    "changes": [
     {"action":"CREATE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.spec.ts"},
     {"action":"CREATE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-references.spec.ts"}
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-008",
      "kind": "red-run",
      "record_refs": ["R-003","R-009","AC-006","AC-015"],
      "description": "RED: validation/references spec thất bại vì thiếu module."
     }
    ],
    "justification_refs": ["R-003","R-009","D-004","D-008","D-011","D-014","D-023"],
    "enforces_invariant_refs": []
   },
   {
    "id": "TASK-009",
    "title": "GREEN — validation cấp form và đổi mã có cấu trúc",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": ["TASK-008"],
    "planned_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-references.ts"],
    "changes": [
     {"action":"CREATE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.ts"},
     {"action":"CREATE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-references.ts"}
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-009",
      "kind": "green-run",
      "record_refs": ["R-003","R-009","AC-006","AC-015","INV-003","INV-005"],
      "description": "GREEN: validation/references spec pass."
     }
    ],
    "justification_refs": ["R-003","R-007","R-009","D-004","D-008","D-014","D-018","D-020","D-023"],
    "enforces_invariant_refs": ["INV-003","INV-005"]
   },
   {
    "id": "TASK-010",
    "title": "RED — test hiển thị giá trị chỉ xem",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": ["TASK-009"],
    "planned_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.spec.ts"],
    "changes": [
     {"action":"CREATE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.spec.ts"}
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-010",
      "kind": "red-run",
      "record_refs": ["R-009","AC-016"],
      "description": "RED: display spec thất bại vì thiếu module."
     }
    ],
    "justification_refs": ["R-009","D-008","D-011"],
    "enforces_invariant_refs": []
   },
   {
    "id": "TASK-011",
    "title": "GREEN — định dạng giá trị chỉ xem",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": ["TASK-010"],
    "planned_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.ts"],
    "changes": [
     {"action":"CREATE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.ts"}
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-011",
      "kind": "green-run",
      "record_refs": ["R-009","AC-016"],
      "description": "GREEN: display spec pass."
     }
    ],
    "justification_refs": ["R-009","D-008","D-018"],
    "enforces_invariant_refs": []
   },
   {
    "id": "TASK-012",
    "title": "RED — test provider và catalog theo instance",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": ["TASK-011"],
    "planned_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/form-generic.provider.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render-catalog.spec.ts"],
    "changes": [
     {"action":"CREATE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/form-generic.provider.spec.ts"},
     {"action":"CREATE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render-catalog.spec.ts"}
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-012",
      "kind": "red-run",
      "record_refs": ["R-005","R-006","AC-003","AC-008"],
      "description": "RED: provider/catalog spec thất bại vì thiếu module."
     }
    ],
    "justification_refs": ["R-005","R-006","D-006","D-011","D-019"],
    "enforces_invariant_refs": []
   },
   {
    "id": "TASK-013",
    "title": "GREEN — provideSdFormGeneric và FormRenderCatalog",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": ["TASK-012"],
    "planned_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/form-generic.provider.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render-catalog.ts"],
    "changes": [
     {"action":"CREATE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/form-generic.provider.ts"},
     {"action":"CREATE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render-catalog.ts"}
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-013",
      "kind": "green-run",
      "record_refs": ["R-005","R-006","AC-003","AC-008","INV-009"],
      "description": "GREEN: provider/catalog spec pass; toàn bộ spec lõi thuần xanh."
     }
    ],
    "justification_refs": ["R-005","R-006","D-006","D-019"],
    "enforces_invariant_refs": ["INV-009"]
   },
   {
    "id": "TASK-014",
    "title": "Chuyển configurations, services, pipes sang model mới",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": ["TASK-013"],
    "planned_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/form-generic.configuration.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/form.configuration.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/index.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/services/form-generic.service.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/services/form-generic.service.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/services/form-render.service.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/services/form-render.service.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/component-viewed.pipe.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/html.pipe.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/hyperlink.pipe.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/index.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/expression-feel.pipe.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/expression-query.pipe.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/expression-view.pipe.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/when-expression.pipe.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/expression-pipes.spec.ts"],
    "changes": [
     {"action":"DELETE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/form-generic.configuration.ts"},
     {"action":"DELETE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/form.configuration.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/index.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/services/form-generic.service.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/services/form-generic.service.spec.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/services/form-render.service.ts"},
     {"action":"CREATE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/services/form-render.service.spec.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/component-viewed.pipe.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/html.pipe.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/hyperlink.pipe.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/index.ts"},
     {"action":"DELETE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/expression-feel.pipe.ts"},
     {"action":"DELETE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/expression-query.pipe.ts"},
     {"action":"DELETE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/expression-view.pipe.ts"},
     {"action":"DELETE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/when-expression.pipe.ts"},
     {"action":"DELETE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/expression-pipes.spec.ts"}
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-014",
      "kind": "component-run",
      "record_refs": ["R-006","R-009","AC-016","INV-009"],
      "description": "Spec services/pipes pass ở lượt Karma của TASK-022; grep HttpClient rỗng."
     }
    ],
    "justification_refs": ["R-006","R-009","D-006","D-008"],
    "enforces_invariant_refs": ["INV-009"]
   },
   {
    "id": "TASK-015",
    "title": "Chuyển preset validation sang tên mới",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": ["TASK-014"],
    "planned_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/presets/form-generic-presets.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/presets/form-generic-presets.spec.ts"],
    "changes": [
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/presets/form-generic-presets.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/presets/form-generic-presets.spec.ts"}
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-015",
      "kind": "unit-run",
      "record_refs": ["R-004","AC-007"],
      "description": "Spec preset pass ở lượt Karma của TASK-022."
     }
    ],
    "justification_refs": ["R-004"],
    "enforces_invariant_refs": []
   },
   {
    "id": "TASK-016",
    "title": "Viết lại lõi sd-form-render",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": ["TASK-014","TASK-015"],
    "planned_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.component.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.context.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/index.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/variable/variable.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/variable/variable.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/variable/variable.component.spec.ts"],
    "changes": [
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.component.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.component.html"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.component.scss"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.component.spec.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.context.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/index.ts"},
     {"action":"DELETE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/variable/variable.component.ts"},
     {
      "action": "DELETE",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/variable/variable.component.html"
     },
     {
      "action": "DELETE",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/variable/variable.component.spec.ts"
     }
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-016",
      "kind": "component-run",
      "record_refs": ["R-002","R-003","R-007","AC-002","AC-003","AC-005","AC-006","AC-009","AC-010","AC-011","INV-001","INV-002","INV-003","INV-006"],
      "description": "Spec sd-form-render pass ở lượt Karma của TASK-022."
     }
    ],
    "justification_refs": ["R-002","R-003","R-007","D-003","D-004","D-007","D-014","D-016","D-017","D-020","D-022"],
    "enforces_invariant_refs": ["INV-001","INV-002","INV-003","INV-006"]
   },
   {
    "id": "TASK-017",
    "title": "Chuyển lib-item và 11 field của renderer",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": ["TASK-016"],
    "planned_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/index.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/checkbox/checkbox.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/checkbox/checkbox.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/chip-calendar/chip-calendar.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/chip-calendar/chip-calendar.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/chip-string/chip-string.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/chip-string/chip-string.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/datetime/datetime.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/datetime/datetime.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/html/html.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/html/html.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/number/number.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/number/number.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/radio/radio.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/radio/radio.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/select/select.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/select/select.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/textarea/textarea.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/textarea/textarea.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/textfield/textfield.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/textfield/textfield.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/upload/upload.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/upload/upload.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/select/select.component.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.presets.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/table/table.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/table/table.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/table/table.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/table/table.component.spec.ts"],
    "changes": [
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.html"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.scss"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/index.ts"},
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/checkbox/checkbox.component.ts"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/checkbox/checkbox.component.html"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/chip-calendar/chip-calendar.component.ts"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/chip-calendar/chip-calendar.component.html"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/chip-string/chip-string.component.ts"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/chip-string/chip-string.component.html"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/datetime/datetime.component.ts"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/datetime/datetime.component.html"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/html/html.component.ts"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/html/html.component.html"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/number/number.component.ts"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/number/number.component.html"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/radio/radio.component.ts"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/radio/radio.component.html"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/select/select.component.ts"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/select/select.component.html"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/textarea/textarea.component.ts"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/textarea/textarea.component.html"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/textfield/textfield.component.ts"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/textfield/textfield.component.html"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/upload/upload.component.ts"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/upload/upload.component.html"
     },
     {
      "action": "CREATE",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/select/select.component.spec.ts"
     },
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.presets.spec.ts"},
     {
      "action": "DELETE",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/table/table.component.ts"
     },
     {
      "action": "DELETE",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/table/table.component.html"
     },
     {
      "action": "DELETE",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/table/table.component.scss"
     },
     {
      "action": "DELETE",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/table/table.component.spec.ts"
     }
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-017",
      "kind": "component-run",
      "record_refs": ["R-004","R-005","R-009","AC-007","AC-008","AC-011","INV-009"],
      "description": "Spec field/preset/select pass ở lượt Karma của TASK-022."
     }
    ],
    "justification_refs": ["R-004","R-005","R-007","R-009","D-005","D-012","D-015"],
    "enforces_invariant_refs": ["INV-009"]
   },
   {
    "id": "TASK-018",
    "title": "Chuyển lớp state của builder",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": ["TASK-017"],
    "planned_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-document.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-layout.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-commands.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-store.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-drag.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-state.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-layout.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-references.ts"],
    "changes": [
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-document.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-layout.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-commands.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-store.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-drag.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-state.spec.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-layout.spec.ts"},
     {"action":"DELETE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-references.ts"}
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-018",
      "kind": "unit-run",
      "record_refs": ["R-001","R-008","AC-001","AC-004","AC-012","AC-013","INV-001","INV-002","INV-004","INV-006"],
      "description": "Spec state của builder pass ở lượt Karma của TASK-022."
     }
    ],
    "justification_refs": ["R-001","R-008","D-002","D-013","D-017"],
    "enforces_invariant_refs": ["INV-001","INV-002","INV-004","INV-006"]
   },
   {
    "id": "TASK-019",
    "title": "Chuyển các editor thuộc tính của builder",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": ["TASK-018"],
    "planned_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/attribute-expression.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/attribute-expression.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/attribute-expression.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/attribute-expression.component.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/form-expression-query-adapter.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/form-expression-query-adapter.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/configure-validation/configure-validation.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/configure-validation/configure-validation.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/configure-validation/configure-validation.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/expression-builder/expression-builder.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/expression-builder/expression-builder.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/expression-builder/expression-builder.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/expression-builder/expression-builder.component.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/attribute-selection.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/attribute-selection.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-queries/build-queries.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-queries/build-queries.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-variables/build-variables.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-variables/build-variables.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/html/attribute/components/build-queries/build-queries.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/html/attribute/components/build-queries/build-queries.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-parameter/attribute-parameter.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-parameter/attribute-parameter.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/value-box/mapping-summary.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/value-box/mapping-summary.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-table/attribute-table.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-table/attribute-table.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-input/attribute-input.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-input/attribute-input.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-select/attribute-select.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-select/attribute-select.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-switch/attribute-switch.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-switch/attribute-switch.component.html"],
    "changes": [
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/attribute-expression.component.ts"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/attribute-expression.component.html"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/attribute-expression.component.scss"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/attribute-expression.component.spec.ts"
     },
     {
      "action": "DELETE",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/form-expression-query-adapter.ts"
     },
     {
      "action": "DELETE",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/form-expression-query-adapter.spec.ts"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/configure-validation/configure-validation.component.ts"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/configure-validation/configure-validation.component.html"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/configure-validation/configure-validation.component.scss"
     },
     {
      "action": "DELETE",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/expression-builder/expression-builder.component.ts"
     },
     {
      "action": "DELETE",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/expression-builder/expression-builder.component.html"
     },
     {
      "action": "DELETE",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/expression-builder/expression-builder.component.scss"
     },
     {
      "action": "DELETE",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/expression-builder/expression-builder.component.spec.ts"
     },
     {
      "action": "DELETE",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/attribute-selection.component.ts"
     },
     {
      "action": "DELETE",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/attribute-selection.component.html"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-queries/build-queries.component.ts"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-queries/build-queries.component.html"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-variables/build-variables.component.ts"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-variables/build-variables.component.html"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/html/attribute/components/build-queries/build-queries.component.ts"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/html/attribute/components/build-queries/build-queries.component.html"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-parameter/attribute-parameter.component.ts"
     },
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-parameter/attribute-parameter.component.html"
     },
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/value-box/mapping-summary.ts"},
     {
      "action": "EDIT",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/value-box/mapping-summary.spec.ts"
     },
     {
      "action": "DELETE",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-table/attribute-table.component.ts"
     },
     {
      "action": "DELETE",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-table/attribute-table.component.html"
     },
     {
      "action": "DELETE",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-input/attribute-input.component.ts"
     },
     {
      "action": "DELETE",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-input/attribute-input.component.html"
     },
     {
      "action": "DELETE",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-select/attribute-select.component.ts"
     },
     {
      "action": "DELETE",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-select/attribute-select.component.html"
     },
     {
      "action": "DELETE",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-switch/attribute-switch.component.ts"
     },
     {
      "action": "DELETE",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-switch/attribute-switch.component.html"
     }
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-019",
      "kind": "component-run",
      "record_refs": ["R-003","R-009","AC-005","AC-015","INV-003","INV-005"],
      "description": "Spec attribute-expression và mapping-summary pass ở lượt Karma của TASK-022."
     }
    ],
    "justification_refs": ["R-003","R-005","R-008","R-009","D-004","D-005","D-008","D-015"],
    "enforces_invariant_refs": ["INV-003","INV-005"]
   },
   {
    "id": "TASK-020",
    "title": "Chuyển giao diện sd-form-builder sang 3 viewport",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": ["TASK-019"],
    "planned_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/canvas.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/canvas.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/canvas.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/field-preview.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/field-preview.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/drop-feedback.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/options-editor.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/options-editor.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/options-editor.component.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/palette/palette.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/palette/palette.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/palette/structure.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/palette/structure.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/preview/preview.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/preview/preview.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/preview/preview.component.scss"],
    "changes": [
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.html"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.scss"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.spec.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/canvas.component.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/canvas.component.html"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/canvas.component.scss"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/field-preview.component.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/field-preview.component.html"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/drop-feedback.component.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.html"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.scss"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/options-editor.component.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/options-editor.component.html"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/options-editor.component.spec.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/palette/palette.component.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/palette/palette.component.html"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/palette/structure.component.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/palette/structure.component.html"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/preview/preview.component.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/preview/preview.component.html"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/preview/preview.component.scss"}
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-020",
      "kind": "component-run",
      "record_refs": ["R-002","R-008","AC-001","AC-012","AC-013","AC-014","AC-015","INV-001","INV-002"],
      "description": "Spec sd-form-builder và options-editor pass ở lượt Karma của TASK-022."
     }
    ],
    "justification_refs": ["R-002","R-008","D-003","D-007"],
    "enforces_invariant_refs": ["INV-001","INV-002"]
   },
   {
    "id": "TASK-021",
    "title": "Cập nhật i18n 5 ngôn ngữ",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": ["TASK-020"],
    "planned_paths": ["versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts","versions/v19/projects/sdcorejs-angular/i18n/src/en.ts","versions/v19/projects/sdcorejs-angular/i18n/src/ko.ts","versions/v19/projects/sdcorejs-angular/i18n/src/ja.ts","versions/v19/projects/sdcorejs-angular/i18n/src/zh.ts"],
    "changes": [
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/i18n/src/en.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/i18n/src/ko.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/i18n/src/ja.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/i18n/src/zh.ts"}
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-021",
      "kind": "static-check",
      "record_refs": ["R-010"],
      "description": "`check:i18n` và `check:i18n-parity` pass ở TASK-025."
     }
    ],
    "justification_refs": ["R-010"],
    "enforces_invariant_refs": []
   },
   {
    "id": "TASK-022",
    "title": "Barrel, public API, dọn code cũ và đóng cửa sổ đỏ",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": ["TASK-021"],
    "planned_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/index.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/index.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/index.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/public-api.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/sd-feel-expression/sd-feel-expression.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/sd-feel-expression/sd-feel-expression.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/sd-feel-expression/sd-feel-expression.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/sd-feel-expression/sd-feel-expression.component.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-component.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-definition-html.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-definition-selection.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-definition-table.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-expression.model.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-expression.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-template.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-validation.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-render/form-render-args.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-render/form-render-entity.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-render/index.ts"],
    "changes": [
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/index.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/index.ts"},
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/index.ts"},
     {"action":"CREATE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/public-api.spec.ts"},
     {"action":"DELETE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/sd-feel-expression/sd-feel-expression.component.ts"},
     {"action":"DELETE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/sd-feel-expression/sd-feel-expression.component.html"},
     {"action":"DELETE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/sd-feel-expression/sd-feel-expression.component.scss"},
     {
      "action": "DELETE",
      "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/sd-feel-expression/sd-feel-expression.component.spec.ts"
     },
     {"action":"DELETE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-component.model.ts"},
     {"action":"DELETE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-definition-html.model.ts"},
     {"action":"DELETE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-definition-selection.model.ts"},
     {"action":"DELETE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-definition-table.model.ts"},
     {"action":"DELETE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-expression.model.spec.ts"},
     {"action":"DELETE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-expression.model.ts"},
     {"action":"DELETE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-template.model.ts"},
     {"action":"DELETE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-validation.model.ts"},
     {"action":"DELETE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic.model.ts"},
     {"action":"DELETE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-render/form-render-args.model.ts"},
     {"action":"DELETE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-render/form-render-entity.model.ts"},
     {"action":"DELETE","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-render/index.ts"}
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-022",
      "kind": "build-and-module-run",
      "record_refs": ["R-001","R-010","AC-001","AC-017","INV-003","INV-008"],
      "description": "Build thư viện v19 xanh; toàn bộ spec form-generic pass (gồm public-api.spec.ts)."
     }
    ],
    "justification_refs": ["R-001","R-010","D-001","D-008","D-022"],
    "enforces_invariant_refs": ["INV-003","INV-008"]
   },
   {
    "id": "TASK-023",
    "title": "Viết lại tài liệu và mục BREAKING",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": ["TASK-022"],
    "planned_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/sd-form-generic.md","CHANGELOG.md"],
    "changes": [
     {"action":"EDIT","path":"versions/v19/projects/sdcorejs-angular/components/form-generic/sd-form-generic.md"},
     {"action":"EDIT","path":"CHANGELOG.md"}
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-023",
      "kind": "doc-review",
      "record_refs": ["R-010","AC-017","INV-008"],
      "description": "Rà soát thủ công sd-form-generic.md và mục BREAKING khớp public-api.spec.ts."
     }
    ],
    "justification_refs": ["R-010","D-001","D-010","D-022"],
    "enforces_invariant_refs": ["INV-008"]
   },
   {
    "id": "TASK-024",
    "title": "Showcase trên schema mới và ảnh chụp thật",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": ["TASK-023"],
    "planned_paths": ["showcase/src/app/pages/components/form-generic/form-generic-demo.component.ts","showcase/src/app/pages/components/form-generic/form-generic-demo.component.spec.ts","showcase/src/app/docs/generated/example-manifest.generated.ts","showcase/src/app/docs/generated/example-sources.generated.ts"],
    "changes": [
     {"action":"EDIT","path":"showcase/src/app/pages/components/form-generic/form-generic-demo.component.ts"},
     {"action":"EDIT","path":"showcase/src/app/pages/components/form-generic/form-generic-demo.component.spec.ts"},
     {"action":"EDIT","path":"showcase/src/app/docs/generated/example-manifest.generated.ts"},
     {"action":"EDIT","path":"showcase/src/app/docs/generated/example-sources.generated.ts"}
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-024",
      "kind": "ui-evidence",
      "record_refs": ["R-008","R-010","R-011","AC-019"],
      "description": "Showcase test pass; bộ ảnh builder 3 viewport + renderer 3 bề rộng; log console sạch."
     }
    ],
    "justification_refs": ["R-008","R-010","R-011","D-011"],
    "enforces_invariant_refs": []
   },
   {
    "id": "TASK-025",
    "title": "Kiểm chứng toàn bộ v19",
    "action": "VERIFY",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": ["TASK-024"],
    "planned_paths": ["versions/v19/projects/sdcorejs-angular/karma.conf.js"],
    "changes": [
     {"action":"VERIFY","path":"versions/v19/projects/sdcorejs-angular/karma.conf.js"}
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-025",
      "kind": "full-verification",
      "record_refs": ["R-011","AC-018"],
      "description": "Full suite + coverage, lint, i18n, parity, scss-hex, test:scripts đều pass."
     }
    ],
    "justification_refs": ["R-011","D-011","D-021"],
    "enforces_invariant_refs": []
   },
   {
    "id": "TASK-026",
    "title": "Rollout v20/v21/v22 và giữ LF cho v22",
    "action": "VERIFY-THEN-EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": ["TASK-025"],
    "planned_paths": ["versions/v19/SYNC-STATUS.md","versions/v20/**","versions/v21/**","versions/v22/**"],
    "changes": [
     {"action":"EDIT","path":"versions/v19/SYNC-STATUS.md"},
     {"action":"EDIT","path":"versions/v20/**"},
     {"action":"EDIT","path":"versions/v21/**"},
     {"action":"EDIT","path":"versions/v22/**"}
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-026",
      "kind": "rollout-check",
      "record_refs": ["R-011","AC-018","INV-007"],
      "description": "check:sync pass; v22 không còn CRLF; build v20/v21/v22 xanh."
     }
    ],
    "justification_refs": ["R-011","D-010"],
    "enforces_invariant_refs": ["INV-007"]
   }
  ],
  "repository_inventory": {
   "repositories": [
    {
     "repository_id": "sdcorejs-angular",
     "existing_paths": ["CHANGELOG.md","scripts/sync-multi-version-workspaces.ps1","showcase/src/app/docs/generated/example-manifest.generated.ts","showcase/src/app/docs/generated/example-sources.generated.ts","showcase/src/app/pages/components/form-generic/form-generic-demo.component.spec.ts","showcase/src/app/pages/components/form-generic/form-generic-demo.component.ts","versions/v19/SYNC-STATUS.md","versions/v19/projects/sdcorejs-angular/components/form-generic/index.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/ng-package.json","versions/v19/projects/sdcorejs-angular/components/form-generic/sd-form-generic.md","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/canvas.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/canvas.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/canvas.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/drop-feedback.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/field-preview.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/field-preview.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/field-preview.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/attribute-expression.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/attribute-expression.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/attribute-expression.component.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/attribute-expression.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/form-expression-query-adapter.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/form-expression-query-adapter.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-input/attribute-input.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-input/attribute-input.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-parameter/attribute-parameter.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-parameter/attribute-parameter.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-parameter/attribute-parameter.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-select/attribute-select.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-select/attribute-select.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/attribute-selection.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/attribute-selection.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-queries/build-queries.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-queries/build-queries.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-queries/build-queries.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-variables/build-variables.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-variables/build-variables.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-variables/build-variables.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-switch/attribute-switch.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-switch/attribute-switch.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-table/attribute-table.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-table/attribute-table.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/configure-validation/configure-validation.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/configure-validation/configure-validation.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/configure-validation/configure-validation.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/expression-builder/expression-builder.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/expression-builder/expression-builder.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/expression-builder/expression-builder.component.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/expression-builder/expression-builder.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/html/attribute/components/build-queries/build-queries.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/html/attribute/components/build-queries/build-queries.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/html/attribute/components/build-queries/build-queries.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/value-box/mapping-box.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/value-box/mapping-summary.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/value-box/mapping-summary.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/value-box/value-box.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/value-box/value-box.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/value-box/value-box.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/options-editor.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/options-editor.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/options-editor.component.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/options-editor.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/toggle-row.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/palette/palette.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/palette/palette.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/palette/palette.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/palette/structure.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/palette/structure.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/palette/structure.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/preview/preview.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/preview/preview.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/preview/preview.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-commands.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-document.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-drag.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-history.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-layout.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-layout.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-references.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-state.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-store.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/index.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/checkbox/checkbox.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/checkbox/checkbox.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/checkbox/checkbox.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/chip-calendar/chip-calendar.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/chip-calendar/chip-calendar.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/chip-calendar/chip-calendar.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/chip-string/chip-string.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/chip-string/chip-string.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/chip-string/chip-string.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/datetime/datetime.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/datetime/datetime.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/datetime/datetime.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/html/html.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/html/html.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/html/html.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/index.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/number/number.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/number/number.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/number/number.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/radio/radio.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/radio/radio.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/radio/radio.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/select/select.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/select/select.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/select/select.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/table/table.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/table/table.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/table/table.component.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/table/table.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/textarea/textarea.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/textarea/textarea.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/textarea/textarea.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/textfield/textfield.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/textfield/textfield.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/textfield/textfield.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/upload/upload.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/upload/upload.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/upload/upload.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/variable/variable.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/variable/variable.component.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/variable/variable.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.component.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.context.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.presets.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/index.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/sd-feel-expression/sd-feel-expression.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/sd-feel-expression/sd-feel-expression.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/sd-feel-expression/sd-feel-expression.component.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/sd-feel-expression/sd-feel-expression.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/form-generic.configuration.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/form.configuration.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/index.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-component.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-definition-html.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-definition-selection.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-definition-table.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-expression.model.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-expression.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-template.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-validation.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-render/form-render-args.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-render/form-render-entity.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-render/index.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/index.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/component-viewed.pipe.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/expression-feel.pipe.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/expression-pipes.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/expression-query.pipe.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/expression-view.pipe.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/html.pipe.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/hyperlink.pipe.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/index.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/when-expression.pipe.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/presets/form-generic-presets.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/presets/form-generic-presets.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/services/form-generic.service.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/services/form-generic.service.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/services/form-render.service.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/services/index.ts","versions/v19/projects/sdcorejs-angular/i18n/src/en.ts","versions/v19/projects/sdcorejs-angular/i18n/src/ja.ts","versions/v19/projects/sdcorejs-angular/i18n/src/ko.ts","versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts","versions/v19/projects/sdcorejs-angular/i18n/src/zh.ts","versions/v19/projects/sdcorejs-angular/karma.conf.js","versions/v20/**","versions/v21/**","versions/v22/**"],
     "intended_new_paths": [
      {"path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.spec.ts","owner_task_id":"TASK-002"},
      {"path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.model.ts","owner_task_id":"TASK-003"},
      {"path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-field.model.ts","owner_task_id":"TASK-003"},
      {"path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-config.model.ts","owner_task_id":"TASK-003"},
      {"path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.ts","owner_task_id":"TASK-003"},
      {"path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/layout/form-generic-layout.spec.ts","owner_task_id":"TASK-004"},
      {"path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/form-generic-breakpoints.ts","owner_task_id":"TASK-005"},
      {"path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/layout/form-generic-layout.ts","owner_task_id":"TASK-005"},
      {"path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-filter.spec.ts","owner_task_id":"TASK-006"},
      {"path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-values.spec.ts","owner_task_id":"TASK-006"},
      {"path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-filter.ts","owner_task_id":"TASK-007"},
      {"path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-values.ts","owner_task_id":"TASK-007"},
      {"path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.spec.ts","owner_task_id":"TASK-008"},
      {"path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-references.spec.ts","owner_task_id":"TASK-008"},
      {"path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.ts","owner_task_id":"TASK-009"},
      {"path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-references.ts","owner_task_id":"TASK-009"},
      {"path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.spec.ts","owner_task_id":"TASK-010"},
      {"path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.ts","owner_task_id":"TASK-011"},
      {"path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/form-generic.provider.spec.ts","owner_task_id":"TASK-012"},
      {"path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render-catalog.spec.ts","owner_task_id":"TASK-012"},
      {"path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/form-generic.provider.ts","owner_task_id":"TASK-013"},
      {"path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render-catalog.ts","owner_task_id":"TASK-013"},
      {"path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/services/form-render.service.spec.ts","owner_task_id":"TASK-014"},
      {
       "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/select/select.component.spec.ts",
       "owner_task_id": "TASK-017"
      },
      {"path":"versions/v19/projects/sdcorejs-angular/components/form-generic/src/public-api.spec.ts","owner_task_id":"TASK-022"}
     ]
    }
   ]
  },
  "critique_history": [
   {
    "round": 1,
    "checker_version": "sdcorejs-plan:goal-backward:v1",
    "blockers": [],
    "resolved_blockers": [],
    "unresolved_blockers": []
   }
  ]
 },
 "validation_map": [
  {
   "requirement_id": "R-001",
   "acceptance_criterion_id": "AC-001",
   "invariant_refs": ["INV-004","INV-006"],
   "risk": "Builder phát JSON sai ngữ pháp hoặc làm mất phần tử type lạ.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["unit","component"],
   "case_ids": ["case-ac001-builder-emits-valid-schema"],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/form-generic/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Mỗi schemaChange qua sdValidateSchema không lỗi: có pages, không schemaVersion, không break, mọi phần tử có id, key duy nhất.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-003","EVIDENCE-016","EVIDENCE-018","EVIDENCE-020","EVIDENCE-022"],
   "rationale": null,
   "owner": "sdcorejs-execute-plan",
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-002",
   "acceptance_criterion_id": "AC-002",
   "invariant_refs": ["INV-002"],
   "risk": "Renderer chọn mức theo màn hình thay vì bề rộng form.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["unit","component"],
   "case_ids": ["case-ac002-span-inherits-by-form-width"],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/form-generic/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Hai field span desktop 6 nằm chung hàng ở 1100px và 800px, xếp chồng ở 480px.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-005","EVIDENCE-016","EVIDENCE-020"],
   "rationale": null,
   "owner": "sdcorejs-execute-plan",
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-002",
   "acceptance_criterion_id": "AC-003",
   "invariant_refs": ["INV-002"],
   "risk": "Ghi đè breakpoint làm mất giá trị mặc định còn lại.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["unit","component"],
   "case_ids": ["case-ac003-breakpoint-override"],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/form-generic/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Provider { tablet: 700 } + form 650px cho mức mobile; desktop vẫn 1024.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-005","EVIDENCE-013","EVIDENCE-016","EVIDENCE-020"],
   "rationale": null,
   "owner": "sdcorejs-execute-plan",
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-002",
   "acceptance_criterion_id": "AC-004",
   "invariant_refs": ["INV-002"],
   "risk": "Canvas và renderer xếp hàng khác nhau khi có newRow.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["unit"],
   "case_ids": ["case-ac004-new-row"],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/form-generic/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Field newRow sau field span 4 luôn mở hàng mới ở cả canvas và renderer.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-005","EVIDENCE-018","EVIDENCE-020"],
   "rationale": null,
   "owner": "sdcorejs-execute-plan",
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-003",
   "acceptance_criterion_id": "AC-005",
   "invariant_refs": ["INV-003"],
   "risk": "Điều kiện không cập nhật theo value/biến hoặc field ẩn vẫn bị kiểm tra.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["unit","component"],
   "case_ids": ["case-ac005-filter-rules-live"],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/form-generic/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "visible/required/disabled đổi ngay khi value hoặc biến đổi; field ẩn không chặn validate; Filter ngày tương đối đúng.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-007","EVIDENCE-016","EVIDENCE-019"],
   "rationale": null,
   "owner": "sdcorejs-execute-plan",
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-003",
   "acceptance_criterion_id": "AC-006",
   "invariant_refs": ["INV-003"],
   "risk": "validate() trả undefined hoặc warning làm chặn submit.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["unit","component"],
   "case_ids": ["case-ac006-validate-result-shape"],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/form-generic/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "validate() luôn trả { valid, messages: { error, warning } }; validator hàm nhận value; chỉ error làm valid = false.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-007","EVIDENCE-009","EVIDENCE-016"],
   "rationale": null,
   "owner": "sdcorejs-execute-plan",
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-004",
   "acceptance_criterion_id": "AC-007",
   "invariant_refs": [],
   "risk": "Đổi tên validation làm lệch lỗi của preset.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["unit","component"],
   "case_ids": ["case-ac007-presets-validation"],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/form-generic/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Mỗi preset báo đúng lỗi như bản hiện tại; password không nhận defaultValue và bị che khi chỉ xem.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-015","EVIDENCE-017"],
   "rationale": null,
   "owner": "sdcorejs-execute-plan",
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-005",
   "acceptance_criterion_id": "AC-008",
   "invariant_refs": ["INV-005","INV-009"],
   "risk": "Catalog không tải lại khi field nguồn đổi hoặc dùng lẫn bộ đệm giữa hai form.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["unit","component"],
   "case_ids": ["case-ac008-catalog-params-fill-search"],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/form-generic/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "load() nhận params đã giải; đổi city thì tải lại; chọn mục điền note; search theo từ khoá; static giữ thứ tự.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-007","EVIDENCE-009","EVIDENCE-013","EVIDENCE-014","EVIDENCE-017"],
   "rationale": null,
   "owner": "sdcorejs-execute-plan",
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-007",
   "acceptance_criterion_id": "AC-009",
   "invariant_refs": ["INV-001"],
   "risk": "Renderer ghi ngược vào object của consumer.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["unit","component"],
   "case_ids": ["case-ac009-no-mutation-defaults"],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/form-generic/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Input deep-freeze không lỗi; valueChange phát object mới; defaultValue chỉ áp cho key chưa có và không áp khi chỉ xem.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-007","EVIDENCE-016","EVIDENCE-018"],
   "rationale": null,
   "owner": "sdcorejs-execute-plan",
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-007",
   "acceptance_criterion_id": "AC-010",
   "invariant_refs": ["INV-001","INV-002"],
   "risk": "[breakpoint] không ép được mức hoặc không trả về mức đo.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["unit","component"],
   "case_ids": ["case-ac010-forced-breakpoint"],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/form-generic/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "[breakpoint]=\"mobile\" ở 1200px dùng span mobile; null quay về mức đo.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-005","EVIDENCE-016","EVIDENCE-018","EVIDENCE-020"],
   "rationale": null,
   "owner": "sdcorejs-execute-plan",
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-009",
   "acceptance_criterion_id": "AC-011",
   "invariant_refs": ["INV-005"],
   "risk": "upload() gửi tham số chưa giải tham chiếu.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["unit","component"],
   "case_ids": ["case-ac011-upload-params"],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/form-generic/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "upload() tải tệp chờ với params đã giải và ghi kết quả vào value.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-007","EVIDENCE-009","EVIDENCE-016","EVIDENCE-017"],
   "rationale": null,
   "owner": "sdcorejs-execute-plan",
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-008",
   "acceptance_criterion_id": "AC-012",
   "invariant_refs": ["INV-001","INV-002"],
   "risk": "Resize ở Tablet ghi đè span của mức khác.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["unit","component"],
   "case_ids": ["case-ac012-tablet-span-edit"],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/form-generic/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Chỉ span.tablet đổi; mức kế thừa hiện \"Theo Desktop\"; xoá thì quay về kế thừa.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-005","EVIDENCE-016","EVIDENCE-018","EVIDENCE-020"],
   "rationale": null,
   "owner": "sdcorejs-execute-plan",
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-008",
   "acceptance_criterion_id": "AC-013",
   "invariant_refs": ["INV-001"],
   "risk": "Two-way binding reset lịch sử undo sau mỗi thay đổi.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["unit","component"],
   "case_ids": ["case-ac013-schema-round-trip"],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/form-generic/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Nhận lại đúng schema vừa phát không reset lịch sử/selection; schema khác nội dung thì nạp lại và reset.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-003","EVIDENCE-016","EVIDENCE-018","EVIDENCE-020"],
   "rationale": null,
   "owner": "sdcorejs-execute-plan",
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-008",
   "acceptance_criterion_id": "AC-014",
   "invariant_refs": ["INV-001","INV-002"],
   "risk": "Xem trước xếp hàng khác canvas.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["component"],
   "case_ids": ["case-ac014-canvas-preview-parity"],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/form-generic/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Ở cả 3 mức, hàng của canvas trùng hàng của Xem trước; Xem trước ép đúng mức.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-005","EVIDENCE-016","EVIDENCE-018","EVIDENCE-020"],
   "rationale": null,
   "owner": "sdcorejs-execute-plan",
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-009",
   "acceptance_criterion_id": "AC-015",
   "invariant_refs": ["INV-005"],
   "risk": "Đổi mã bỏ sót tham chiếu hoặc sửa chuỗi tự do.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["unit","component"],
   "case_ids": ["case-ac015-rename-structured-refs"],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/form-generic/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Mọi tham chiếu có cấu trúc chuyển sang mã mới; hyperlink/nội dung HTML giữ nguyên và được đếm trong câu xác nhận.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-009","EVIDENCE-019","EVIDENCE-020"],
   "rationale": null,
   "owner": "sdcorejs-execute-plan",
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-009",
   "acceptance_criterion_id": "AC-016",
   "invariant_refs": ["INV-005"],
   "risk": "viewEntities đổi định dạng hiển thị so với bản hiện tại.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["unit"],
   "case_ids": ["case-ac016-view-entities"],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/form-generic/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "viewEntities trả nhãn lựa chọn, ngày, số theo preset giống bản hiện tại.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-009","EVIDENCE-011","EVIDENCE-014"],
   "rationale": null,
   "owner": "sdcorejs-execute-plan",
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-010",
   "acceptance_criterion_id": "AC-017",
   "invariant_refs": ["INV-008"],
   "risk": "Export cũ còn sót trong entry point.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["unit"],
   "case_ids": ["case-ac017-public-api-exports"],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/form-generic/**/*.spec.ts\"",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "public-api.spec.ts: export runtime đúng danh sách hợp đồng, không còn tên cũ.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-022"],
   "rationale": null,
   "owner": "sdcorejs-execute-plan",
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-010",
   "acceptance_criterion_id": "AC-017",
   "invariant_refs": ["INV-008"],
   "risk": "CHANGELOG/tài liệu không khớp API thật.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["uat"],
   "case_ids": ["case-ac017-docs-breaking-review"],
   "planned_command": null,
   "command_source": "manual",
   "cwd": ".",
   "evidence_class": "SUPPLEMENTAL_SMOKE",
   "automation": "manual",
   "expected_proof": "Mục BREAKING có ví dụ trước/sau và liệt kê đủ export bị bỏ; sd-form-generic.md mô tả schema mới.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-022","EVIDENCE-023"],
   "rationale": "Nội dung văn bản cần người đọc xác nhận; không có lệnh tự động.",
   "owner": "user",
   "acknowledgement_required": true,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-011",
   "acceptance_criterion_id": "AC-018",
   "invariant_refs": ["INV-007"],
   "risk": "Thay đổi làm vỡ component khác hoặc tụt coverage.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["unit","component"],
   "case_ids": ["case-ac018-full-suite-coverage"],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Full suite v19 pass và đạt threshold coverage của karma.conf.js.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-025","EVIDENCE-026"],
   "rationale": null,
   "owner": "sdcorejs-execute-plan",
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-011",
   "acceptance_criterion_id": "AC-018",
   "invariant_refs": ["INV-007"],
   "risk": "Vi phạm lint/prettier.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["integration"],
   "case_ids": ["case-ac018-lint"],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd run lint",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "SUPPLEMENTAL_SMOKE",
   "automation": "automated",
   "expected_proof": "ng lint không lỗi.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-025","EVIDENCE-026"],
   "rationale": null,
   "owner": "sdcorejs-execute-plan",
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-011",
   "acceptance_criterion_id": "AC-018",
   "invariant_refs": ["INV-007"],
   "risk": "Key i18n dùng trong code không có trong catalog.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["integration"],
   "case_ids": ["case-ac018-check-i18n"],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd run check:i18n",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "SUPPLEMENTAL_SMOKE",
   "automation": "automated",
   "expected_proof": "check:i18n pass.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-025","EVIDENCE-026"],
   "rationale": null,
   "owner": "sdcorejs-execute-plan",
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-011",
   "acceptance_criterion_id": "AC-018",
   "invariant_refs": ["INV-007"],
   "risk": "5 ngôn ngữ lệch tập key.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["integration"],
   "case_ids": ["case-ac018-check-i18n-parity"],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd run check:i18n-parity",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "SUPPLEMENTAL_SMOKE",
   "automation": "automated",
   "expected_proof": "check:i18n-parity pass.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-025","EVIDENCE-026"],
   "rationale": null,
   "owner": "sdcorejs-execute-plan",
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-011",
   "acceptance_criterion_id": "AC-018",
   "invariant_refs": ["INV-007"],
   "risk": "SCSS dùng mã màu hex thay token.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["integration"],
   "case_ids": ["case-ac018-check-scss-hex"],
   "planned_command": "npm run check:scss-hex",
   "command_source": "package.json",
   "cwd": ".",
   "evidence_class": "SUPPLEMENTAL_SMOKE",
   "automation": "automated",
   "expected_proof": "check:scss-hex pass.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-025","EVIDENCE-026"],
   "rationale": null,
   "owner": "sdcorejs-execute-plan",
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-011",
   "acceptance_criterion_id": "AC-018",
   "invariant_refs": ["INV-007"],
   "risk": "v20–v22 lệch v19 ngoài transform được duyệt.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["integration"],
   "case_ids": ["case-ac018-check-sync"],
   "planned_command": "npm run check:sync",
   "command_source": "package.json",
   "cwd": ".",
   "evidence_class": "SUPPLEMENTAL_SMOKE",
   "automation": "automated",
   "expected_proof": "check:sync pass sau npm run sync.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-026"],
   "rationale": null,
   "owner": "sdcorejs-execute-plan",
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-011",
   "acceptance_criterion_id": "AC-018",
   "invariant_refs": ["INV-007"],
   "risk": "Sync trên checkout CRLF ghi v22 thành CRLF.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["integration"],
   "case_ids": ["case-ac018-v22-lf"],
   "planned_command": null,
   "command_source": "manual",
   "cwd": ".",
   "evidence_class": "SUPPLEMENTAL_SMOKE",
   "automation": "manual",
   "expected_proof": "git ls-files --eol -- versions/v22 không còn dòng w/crlf.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-026"],
   "rationale": "Repo không có script cho kiểm tra này; chạy git ls-files --eol theo ghi chú rollout và xác nhận bằng mắt.",
   "owner": "user",
   "acknowledgement_required": true,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-008",
   "acceptance_criterion_id": "AC-019",
   "invariant_refs": ["INV-001","INV-002"],
   "risk": "Demo showcase còn dùng API cũ.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["component"],
   "case_ids": ["case-ac019-showcase-tests"],
   "planned_command": "fnm exec --using=22.22.3 npm.cmd test",
   "command_source": "package.json",
   "cwd": "showcase",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Spec của showcase pass trên API mới.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-005","EVIDENCE-016","EVIDENCE-018","EVIDENCE-020","EVIDENCE-024"],
   "rationale": null,
   "owner": "sdcorejs-execute-plan",
   "acknowledgement_required": false,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  },
  {
   "requirement_id": "R-008",
   "acceptance_criterion_id": "AC-019",
   "invariant_refs": ["INV-001","INV-002"],
   "risk": "Giao diện sai mà test không bắt được.",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-021",
    "source_refs": ["R-001","R-002","R-003","R-004","R-005","R-006","R-007","R-008","R-009","R-010","R-011","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017","AC-018","AC-019","INV-001","INV-002","INV-003","INV-004","INV-005","INV-006","INV-007","INV-008","INV-009"]
   },
   "authorization_boundary": false,
   "levels": ["ui-evidence-capture"],
   "case_ids": ["case-ac019-real-screenshots"],
   "planned_command": null,
   "command_source": "manual",
   "cwd": "showcase",
   "evidence_class": "SUPPLEMENTAL_SMOKE",
   "automation": "manual",
   "expected_proof": "Ảnh builder Desktop/Tablet/Mobile và renderer 1100/800/480px cho thấy span theo mức, nhãn kế thừa, newRow; console sạch.",
   "status": "covered",
   "evidence_refs": ["EVIDENCE-005","EVIDENCE-016","EVIDENCE-018","EVIDENCE-020","EVIDENCE-024"],
   "rationale": "Bằng chứng trực quan theo D-011; người dùng xem ảnh.",
   "owner": "user",
   "acknowledgement_required": true,
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null
  }
 ],
 "contract_id": "form-generic-schema-v1",
 "requirement_id": "form-generic-schema-v1",
 "approved_spec_path": ".sdcorejs/specs/angular/2026-09-29-18-42-form-generic-schema-v1-phase-1.md",
 "approved_spec_hash": "sha256:v1:6252cd8f9b48bce67af08815056bec87385a63169d7435edc81bcfbd881cb801",
 "approved_spec_reference": {
  "immutable_identity": {
   "repository_id": "sdcorejs-angular",
   "repository_relative_path": ".sdcorejs/specs/angular/2026-09-29-18-42-form-generic-schema-v1-phase-1.md",
   "artifact_id": "spec-form-generic-schema-v1-r1",
   "revision": "8812f188e71b5d1f6e47d7b2405552c85bc479b9",
   "approval_hash": "sha256:v1:6252cd8f9b48bce67af08815056bec87385a63169d7435edc81bcfbd881cb801"
  }
 },
 "approved_architecture_path": ".sdcorejs/architecture/angular/2026-09-29-18-53-form-generic-schema-v1-phase-1.md",
 "approved_architecture_hash": "sha256:v1:db91ad7886d71be8e4549e37b69dbbca04584ae598fa287e8d0e877fd6948a09",
 "approved_architecture_reference": {
  "immutable_identity": {
   "repository_id": "sdcorejs-angular",
   "repository_relative_path": ".sdcorejs/architecture/angular/2026-09-29-18-53-form-generic-schema-v1-phase-1.md",
   "artifact_id": "architecture-form-generic-schema-v1-r1",
   "revision": "8812f188e71b5d1f6e47d7b2405552c85bc479b9",
   "approval_hash": "sha256:v1:db91ad7886d71be8e4549e37b69dbbca04584ae598fa287e8d0e877fd6948a09"
  }
 },
 "approved_plan_path": "",
 "approved_plan_hash": "",
 "supersedes": ".sdcorejs/plans/angular/2026-09-30-01-16-form-generic-schema-v1-phase-1.md",
 "target_root": ".",
 "target_root_kind": "target-project",
 "owner_repository_id": "sdcorejs-angular",
 "owner_repository_role": "library",
 "owner_module_id": "components/form-generic",
 "execution_host_repository_id": "sdcorejs-angular",
 "integration_owner_repository_id": "sdcorejs-angular",
 "dependency_order": ["components/form-generic"],
 "gitlink_updates_in_scope": false,
 "track": "angular",
 "stack_profile": "core-ui-angular",
 "task_count": 26,
 "phase_count": 5,
 "allowed_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/**","versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts","versions/v19/projects/sdcorejs-angular/i18n/src/en.ts","versions/v19/projects/sdcorejs-angular/i18n/src/ko.ts","versions/v19/projects/sdcorejs-angular/i18n/src/ja.ts","versions/v19/projects/sdcorejs-angular/i18n/src/zh.ts","versions/v19/SYNC-STATUS.md","versions/v20/**","versions/v21/**","versions/v22/**","showcase/src/app/pages/components/form-generic/**","showcase/src/app/docs/generated/example-manifest.generated.ts","showcase/src/app/docs/generated/example-sources.generated.ts","CHANGELOG.md",".sdcorejs/docs/angular/*-form-generic-schema-v1-phase-1-plan.md",".sdcorejs/plans/angular/*-form-generic-schema-v1-phase-1.md"],
 "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
 "write_rules": ["versions/v20/**, versions/v21/**, versions/v22/** chỉ được đổi bằng `npm run sync` (TASK-026) và chuẩn hoá CRLF → LF cho v22; không sửa tay.","`npm run sync` ghi lại package.json của v20–v22 từ v19; v19 package.json không đổi nên `git diff` của các file này phải rỗng.","Trong versions/v19/projects/sdcorejs-angular chỉ sửa components/form-generic/** và 5 file i18n/src/*.ts.",".sdcorejs/specs/** và .sdcorejs/architecture/** là snapshot đã duyệt, bất biến."],
 "generated_artifacts": ["showcase/src/app/docs/generated/example-manifest.generated.ts","showcase/src/app/docs/generated/example-sources.generated.ts","versions/v20/**","versions/v21/**","versions/v22/**","versions/v19/SYNC-STATUS.md"],
 "docs_artifacts": ["versions/v19/projects/sdcorejs-angular/components/form-generic/sd-form-generic.md","CHANGELOG.md"],
 "dependency_changes": {
  "required": false,
  "packages": [],
  "approval_required": false
 },
 "env_changes": {
  "required": false,
  "files": [],
  "approval_required": false
 },
 "migration_changes": {"required":false,"description":null,"approval_required":false},
 "frontend_architecture": {
  "required": true,
  "conformance_invariant_refs": ["INV-001","INV-002","INV-004","INV-006"],
  "not_applicable_reason": null,
  "project_conventions": {
   "component_style": "Angular 19 standalone, OnPush, signal API (input/model/output/computed/effect); một số field cũ còn @Input setter và được chuyển dần.",
   "folder_convention": "Secondary entry point components/form-generic với src/{models,configurations,services,pipes,presets,components}; builder chia feature-local state/, canvas/, inspector/, palette/, preview/, components/; selector nội bộ fb-* và lib-*.",
   "state_convention": "Signals; FormBuilderStore provide ở component (mỗi builder một store) kèm history; renderer dùng Reactive Forms FormGroup + signals.",
   "service_data_access_convention": "Không có HTTP; dữ liệu portal qua token cấu hình DI (SD_FORM_GENERIC_CONFIGURATION cũ → provideSdFormGeneric mới); FormGenericService providedIn root đọc token.",
   "registration_provider_convention": "Standalone imports; provider ở component (FormRenderContext, FormBuilderStore, BuilderDragService); cấu hình app bằng hàm provideSd* trả EnvironmentProviders (provideSdApiContract, provideSdIcon).",
   "public_api_barrel_convention": "index.ts + ng-package.json của entry point; barrel index.ts mỗi thư mục; export type * cho type; symbol nội bộ không export.",
   "test_convention": "Karma + Jasmine, spec đặt cạnh file; TestBed cho component, spec thuần không TestBed; ChromeHeadlessCI; threshold coverage trong karma.conf.js; tsconfig.spec.json đưa mọi source vào chương trình TypeScript.",
   "evidence_inspected": ["versions/v19/projects/sdcorejs-angular/components/form-generic/index.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.context.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-store.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/form-generic.configuration.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/services/form-generic.service.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/services/form-render.service.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-component.model.ts","versions/v19/projects/sdcorejs-angular/components/api-contract-builder/src/api-contract.configuration.ts","versions/v19/projects/sdcorejs-angular/modules/icon/src/icon.provider.ts","versions/v19/projects/sdcorejs-angular/tsconfig.spec.json","versions/v19/angular.json","showcase/src/app/pages/components/form-generic/form-generic-demo.component.ts"]
  },
  "component_tree": ["<sd-form-render> (public) — providers: FormRenderContext, FormRenderCatalog","  <sd-section> cho mỗi group (Core, reuse)","    <lib-item> cho mỗi field → <lib-textfield|textarea|number|select|radio|checkbox|datetime|chip-string|chip-calendar|upload|html>","<sd-form-builder> (public) — providers: FormBuilderStore, BuilderDragService","  <fb-palette> + <fb-structure>","  <fb-canvas> → <fb-field-preview>, <fb-drop-indicator>, <fb-drop-status>","  <fb-inspector> → <fb-options-editor>, <fb-toggle-row>, attribute-expression, params/fill editors, attribute-parameter, html build-queries","  <fb-preview> → <sd-form-render [breakpoint]>","  configure-validation (dialog)"],
  "reuse_decisions": [
   {
    "need": "Đánh giá điều kiện",
    "candidate": "@sdcorejs/utils FilterUtilities.evaluate",
    "decision": "wrap",
    "reason": "Một evaluator sdEvaluateFilter bọc thư viện, bù toán tử thiếu tại một chỗ (INV-003).",
    "ownership": "feature-private"
   },
   {
    "need": "Sửa điều kiện",
    "candidate": "sd-query-builder (Core)",
    "decision": "reuse",
    "reason": "Cùng định dạng Filter; không còn sd-feel-expression.",
    "ownership": "feature-private"
   },
   {
    "need": "Khung group",
    "candidate": "SdSection (@sdcorejs/angular/components/section)",
    "decision": "reuse",
    "reason": "Đã có icon, iconColor, collapsible.",
    "ownership": "feature-private"
   },
   {
    "need": "Đo bề rộng form",
    "candidate": "ResizeObserver trong form-render.component.ts",
    "decision": "extend",
    "reason": "Tổng quát từ 2 mức lên 3 mức; không dùng viewport màn hình.",
    "ownership": "feature-private"
   },
   {
    "need": "Xếp hàng lưới 12 cột",
    "candidate": "buildRows trong state/builder-layout.ts",
    "decision": "create_shared",
    "reason": "Tách thành layout/form-generic-layout.ts dùng chung cho canvas và renderer (INV-002); chia sẻ trong module, không public.",
    "ownership": "feature-private"
   },
   {
    "need": "Tìm/đổi tham chiếu key",
    "candidate": "state/builder-references.ts",
    "decision": "create_shared",
    "reason": "Chuyển sang rules/form-generic-references.ts thuần, dùng cho inspector và test.",
    "ownership": "feature-private"
   },
   {
    "need": "Định dạng giá trị chỉ xem",
    "candidate": "pipes/component-viewed.pipe.ts",
    "decision": "create_shared",
    "reason": "Logic chuyển vào rules/form-generic-display.ts; pipe và SdFormRenderService gọi lại.",
    "ownership": "feature-private"
   },
   {
    "need": "Đệm dữ liệu catalog",
    "candidate": "none (FormGenericService đệm toàn cục)",
    "decision": "create_feature_local",
    "reason": "FormRenderCatalog theo từng renderer (D-019).",
    "ownership": "feature-private"
   },
   {
    "need": "Xác nhận đổi mã / toast hoàn tác",
    "candidate": "SdConfirmService, SdNotifyService",
    "decision": "reuse",
    "reason": "Đã dùng ở builder.",
    "ownership": "feature-private"
   },
   {
    "need": "Nút Desktop | Tablet | Mobile",
    "candidate": "thanh công cụ trong form-builder.component.html",
    "decision": "keep_inline",
    "reason": "Ba nút, không có state riêng.",
    "ownership": "feature-private"
   }
  ],
  "file_decisions": [
   {
    "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-*.model.ts (mới)",
    "decision": "create",
    "symbols": "SdFormGenericSchema, Page, Group, Field*, Layout, Rules, FieldValidation, Options, Option, ValueRef, Variable, Validation, Config, Catalog, CatalogItem, Template, HtmlDefinition, Validator",
    "reason": "Hợp đồng C-001/C-004."
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.ts",
    "decision": "create",
    "symbols": "sdValidateSchema, sdNormalizeSchema, sdSchemaFields, sdSameSchema",
    "reason": "Ngữ pháp thuần (INV-004, INV-006)."
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/layout/form-generic-layout.ts",
    "decision": "create",
    "symbols": "sdResolveBreakpoint, sdResolveSpan, sdSpanSource, sdPackRows, sdWithSpan, sdWithNewRow",
    "reason": "Nguồn layout duy nhất (INV-002)."
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-{filter,values,validation,references,display}.ts",
    "decision": "create",
    "symbols": "sdEvaluateFilter, sdElementState, sdResolveValueRef, sdResolveParams, sdApplyDefaults, sdFillPatch, sdCatalogKey, sdValueKeys, sdRunFormValidations, sdFindKeyReferences, sdRenameKey, sdDisplayValue",
    "reason": "Logic thuần có TDD (D-018)."
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/form-generic.provider.ts",
    "decision": "create",
    "symbols": "SD_FORM_GENERIC_CONFIG (nội bộ), provideSdFormGeneric",
    "reason": "C-004."
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render-catalog.ts",
    "decision": "create",
    "symbols": "FormRenderCatalog",
    "reason": "D-019."
   },
   {
    "path": "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/sd-feel-expression/**, expression-builder/**, attribute-table|input|select|switch/**, item/components/table/**, variable/**, pipes/expression-*.ts, models cũ",
    "decision": "delete",
    "symbols": "SdFeelExpression và model expression cũ, table, VariableComponent",
    "reason": "C-006, D-015, D-022."
   }
  ],
  "state_owners": [
   {"symbol":"SdFormRender","state":"value (model), FormGroup nội bộ hoặc [form] của consumer, mức breakpoint đo được"},
   {"symbol":"FormRenderCatalog","state":"kết quả load/search catalog theo khoá id + params của một renderer"},
   {"symbol":"FormBuilderStore","state":"schema đang thiết kế, selection, viewport, lịch sử undo/redo"},
   {"symbol":"Consumer","state":"[variables], [schema] của renderer, [(schema)] của builder"}
  ],
  "service_boundaries": [
   {"symbol":"FormGenericService","scope":"app","reason":"Đọc cấu hình portal không có state thay đổi theo form."},
   {"symbol":"SdFormRenderService","scope":"app","reason":"API public viewEntities, không state."},
   {"symbol":"FormRenderCatalog","scope":"component","reason":"Bộ đệm phải reset theo vòng đời từng renderer."},
   {"symbol":"FormRenderContext","scope":"component","reason":"Ngữ cảnh trình bày của một renderer."},
   {"symbol":"FormBuilderStore","scope":"component","reason":"Mỗi builder một tài liệu và lịch sử."},
   {"symbol":"models/layout/rules","scope":"pure_function","reason":"Không vòng đời, không DI (D-018)."}
  ],
  "data_flow": ["consumer [schema]/[(value)]/[variables] → SdFormRender → sdNormalizeSchema → sdPackRows(level) → lib-item (sdElementState(scope)) → FormControl → valueChange (object mới)","lib-select (catalog) → sdResolveParams(scope) → FormRenderCatalog.load/search → provider catalog.load/search → items → sdFillPatch → value","validate() → field validators + sdRunFormValidations(validations, scope, provider validators) → { valid, messages }","SdFormBuilder [(schema)] → FormBuilderStore (document) → sdPackRows(viewport) cho canvas; preview → SdFormRender [breakpoint]=viewport"],
  "declarations_and_registration": [
   {"symbol":"SdFormRender, SdFormBuilder","scope":"public","mechanism":"standalone component, export từ entry index.ts"},
   {"symbol":"provideSdFormGeneric","scope":"public","mechanism":"EnvironmentProviders trong app config/route providers của portal"},
   {"symbol":"FormRenderCatalog, FormRenderContext","scope":"private","mechanism":"providers của sd-form-render"},
   {"symbol":"FormBuilderStore, BuilderDragService","scope":"private","mechanism":"providers của sd-form-builder"},
   {"symbol":"fb-*, lib-*","scope":"private","mechanism":"imports của component cha"}
  ],
  "public_exports": ["SdFormRender","SdFormBuilder","SdFormRenderService","provideSdFormGeneric","SD_FORM_GENERIC_BREAKPOINTS","type SdFormGenericBreakpoint","type SdFormGenericSchema và các type schema/field/config (C-001, C-004)"],
  "remaining_contract": {
   "tests": "Page orchestration: form-render.component.spec.ts, form-builder.component.spec.ts; child contracts: select.component.spec.ts, options-editor.component.spec.ts, attribute-expression.component.spec.ts; mapping: rules/*.spec.ts, layout spec, models spec, display spec; provider scope: form-render-catalog.spec.ts (hai instance không chung bộ đệm), form-generic.provider.spec.ts.",
   "decomposition_rationale": "Ranh giới giữ theo cây hiện có vì mỗi vùng có state/ trách nhiệm riêng; logic dùng chung chuyển xuống module thuần thay vì thêm component; không thêm facade vì FormBuilderStore đã là coordinator; không promote gì ra shared Core UI vì chưa có consumer ngoài module."
  }
 },
 "agent_architecture": {
  "required": false,
  "conformance_invariant_refs": [],
  "not_applicable_reason": "Track angular, không phải ứng dụng ai-agent.",
  "contract": null
 },
 "verification_strategy": {
  "package_manager": "npm",
  "package_manager_evidence": ["package-lock.json","versions/v19/package-lock.json","showcase/package-lock.json","không có field packageManager"],
  "runtime": "Node 22.22.3 qua fnm (`fnm exec --using=22.22.3 npm.cmd …`); script root chạy bằng Node hệ thống.",
  "commands_planned": [
   {
    "command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=\"**/form-generic/**/*.spec.ts\"",
    "cwd": "versions/v19",
    "reason": "Toàn bộ spec form-generic; RED/GREEN dùng --include hẹp hơn tới đúng file spec."
   },
   {"command":"fnm exec --using=22.22.3 npm.cmd run build","cwd":"versions/v19","reason":"Build thư viện — cổng đóng cửa sổ đỏ và điều kiện của showcase."},
   {
    "command": "fnm exec --using=22.22.3 npm.cmd test -- sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage",
    "cwd": "versions/v19",
    "reason": "Full suite có coverage (AC-018)."
   },
   {"command":"fnm exec --using=22.22.3 npm.cmd run lint","cwd":"versions/v19","reason":"AC-018."},
   {"command":"fnm exec --using=22.22.3 npm.cmd run check:i18n","cwd":"versions/v19","reason":"AC-018."},
   {"command":"fnm exec --using=22.22.3 npm.cmd run check:i18n-parity","cwd":"versions/v19","reason":"AC-018."},
   {"command":"npm run check:scss-hex","cwd":".","reason":"AC-018."},
   {"command":"npm run generate:showcase-examples","cwd":".","reason":"Sinh lại example sources của showcase."},
   {"command":"fnm exec --using=22.22.3 npm.cmd test","cwd":"showcase","reason":"Spec showcase (AC-019)."},
   {"command":"npm run test:scripts","cwd":".","reason":"Guard script của repo (showcase generators…)."},
   {"command":"npm run sync","cwd":".","reason":"Rollout v19 → v20/v21/v22."},
   {"command":"npm run check:sync","cwd":".","reason":"AC-018, INV-007."},
   {"command":"fnm exec --using=22.22.3 npm.cmd --prefix versions/v20 run build","cwd":".","reason":"Biên dịch dưới Angular 20."},
   {"command":"fnm exec --using=22.22.3 npm.cmd --prefix versions/v21 run build","cwd":".","reason":"Biên dịch dưới Angular 21."},
   {"command":"fnm exec --using=22.22.3 npm.cmd --prefix versions/v22 run build","cwd":".","reason":"Biên dịch dưới Angular 22 (TypeScript mới hơn)."}
  ],
  "commands_skipped": [
   {"command":"npm run lint:release","reason":"v20–v22 là bản sync của v19; lint v19 + check:sync đủ; không phải release."},
   {"command":"Karma full suite của v20/v21/v22","reason":"AC-018 chỉ yêu cầu v19; build v20–v22 bắt lỗi khác biệt theo Angular major."},
   {
    "command": "powershell ./scripts/deploy.ps1 -DryRun, npm run build:page, npm run collect-release-docs",
    "reason": "Chỉ dùng khi release; 3.0 chưa phát hành, người dùng cấm publish/deploy."
   },
   {"command":"npm ci ở các workspace","reason":"Không đổi dependency; dùng node_modules đang có."}
  ],
  "checks": {
   "focused": "RED/GREEN từng spec lõi thuần ở phase 2; lượt module form-generic ở TASK-022.",
   "broad": "Full suite + coverage, lint, i18n, parity, scss-hex, test:scripts ở TASK-025; sync, check:sync, build v20–v22 ở TASK-026.",
   "manual": "Rà soát CHANGELOG/tài liệu (AC-017), kiểm LF của v22, ảnh chụp thật showcase (AC-019)."
  }
 },
 "parallel_candidates": {
  "allowed": false,
  "contract": "Tuần tự: cặp RED/GREEN không được xen nhau vì tsconfig.spec.json đưa mọi source vào một chương trình TypeScript (một lỗi biên dịch chặn mọi lượt Karma); phase 3 là cửa sổ biên dịch đỏ; máy dev hay quá tải CPU.",
  "shared_files": [
   {"path":"versions/v19/projects/sdcorejs-angular/i18n/src/*.ts","owner":"TASK-021","strategy":"một task sở hữu cả 5 file"},
   {"path":"versions/v19/projects/sdcorejs-angular/components/form-generic/index.ts","owner":"TASK-022","strategy":"đổi barrel một lần ở cuối cửa sổ đỏ"},
   {"path":"CHANGELOG.md","owner":"TASK-023","strategy":"chỉ sửa mục [Unreleased]"},
   {"path":"versions/v20|v21|v22/**","owner":"TASK-026","strategy":"chỉ qua npm run sync"}
  ]
 },
 "repository_plan": {
  "schema_version": 1,
  "integration_owner_repository_id": "sdcorejs-angular",
  "dependency_order": ["components/form-generic"],
  "gitlink_updates_in_scope": false,
  "repositories": [
   {
    "repository_id": "sdcorejs-angular",
    "role": "library",
    "module_id": "components/form-generic",
    "available": true,
    "writable": true
   }
  ],
  "steps": [
   {
    "id": "TASK-001",
    "action": "VERIFY",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": ["sdcorejs-angular"],
    "semantic_scope": "library",
    "allowed_paths": ["scripts/sync-multi-version-workspaces.ps1"],
    "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
    "depends_on": []
   },
   {
    "id": "TASK-002",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": ["sdcorejs-angular"],
    "semantic_scope": "library",
    "allowed_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.spec.ts"],
    "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
    "depends_on": ["TASK-001"]
   },
   {
    "id": "TASK-003",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": ["sdcorejs-angular"],
    "semantic_scope": "library",
    "allowed_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-field.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-config.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-schema.ts"],
    "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
    "depends_on": ["TASK-002"]
   },
   {
    "id": "TASK-004",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": ["sdcorejs-angular"],
    "semantic_scope": "library",
    "allowed_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/layout/form-generic-layout.spec.ts"],
    "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
    "depends_on": ["TASK-003"]
   },
   {
    "id": "TASK-005",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": ["sdcorejs-angular"],
    "semantic_scope": "library",
    "allowed_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/form-generic-breakpoints.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/layout/form-generic-layout.ts"],
    "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
    "depends_on": ["TASK-004"]
   },
   {
    "id": "TASK-006",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": ["sdcorejs-angular"],
    "semantic_scope": "library",
    "allowed_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-filter.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-values.spec.ts"],
    "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
    "depends_on": ["TASK-005"]
   },
   {
    "id": "TASK-007",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": ["sdcorejs-angular"],
    "semantic_scope": "library",
    "allowed_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-filter.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-values.ts"],
    "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
    "depends_on": ["TASK-006"]
   },
   {
    "id": "TASK-008",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": ["sdcorejs-angular"],
    "semantic_scope": "library",
    "allowed_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-references.spec.ts"],
    "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
    "depends_on": ["TASK-007"]
   },
   {
    "id": "TASK-009",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": ["sdcorejs-angular"],
    "semantic_scope": "library",
    "allowed_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-validation.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-references.ts"],
    "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
    "depends_on": ["TASK-008"]
   },
   {
    "id": "TASK-010",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": ["sdcorejs-angular"],
    "semantic_scope": "library",
    "allowed_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.spec.ts"],
    "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
    "depends_on": ["TASK-009"]
   },
   {
    "id": "TASK-011",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": ["sdcorejs-angular"],
    "semantic_scope": "library",
    "allowed_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/form-generic-display.ts"],
    "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
    "depends_on": ["TASK-010"]
   },
   {
    "id": "TASK-012",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": ["sdcorejs-angular"],
    "semantic_scope": "library",
    "allowed_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/form-generic.provider.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render-catalog.spec.ts"],
    "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
    "depends_on": ["TASK-011"]
   },
   {
    "id": "TASK-013",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": ["sdcorejs-angular"],
    "semantic_scope": "library",
    "allowed_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/form-generic.provider.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render-catalog.ts"],
    "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
    "depends_on": ["TASK-012"]
   },
   {
    "id": "TASK-014",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": ["sdcorejs-angular"],
    "semantic_scope": "library",
    "allowed_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/form-generic.configuration.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/form.configuration.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/index.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/services/form-generic.service.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/services/form-generic.service.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/services/form-render.service.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/services/form-render.service.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/component-viewed.pipe.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/html.pipe.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/hyperlink.pipe.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/index.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/expression-feel.pipe.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/expression-query.pipe.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/expression-view.pipe.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/when-expression.pipe.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/expression-pipes.spec.ts"],
    "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
    "depends_on": ["TASK-013"]
   },
   {
    "id": "TASK-015",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": ["sdcorejs-angular"],
    "semantic_scope": "library",
    "allowed_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/presets/form-generic-presets.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/presets/form-generic-presets.spec.ts"],
    "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
    "depends_on": ["TASK-014"]
   },
   {
    "id": "TASK-016",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": ["sdcorejs-angular"],
    "semantic_scope": "library",
    "allowed_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.component.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.context.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/index.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/variable/variable.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/variable/variable.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/variable/variable.component.spec.ts"],
    "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
    "depends_on": ["TASK-014","TASK-015"]
   },
   {
    "id": "TASK-017",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": ["sdcorejs-angular"],
    "semantic_scope": "library",
    "allowed_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/item.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/index.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/checkbox/checkbox.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/checkbox/checkbox.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/chip-calendar/chip-calendar.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/chip-calendar/chip-calendar.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/chip-string/chip-string.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/chip-string/chip-string.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/datetime/datetime.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/datetime/datetime.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/html/html.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/html/html.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/number/number.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/number/number.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/radio/radio.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/radio/radio.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/select/select.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/select/select.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/textarea/textarea.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/textarea/textarea.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/textfield/textfield.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/textfield/textfield.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/upload/upload.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/upload/upload.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/select/select.component.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/form-render.presets.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/table/table.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/table/table.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/table/table.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/item/components/table/table.component.spec.ts"],
    "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
    "depends_on": ["TASK-016"]
   },
   {
    "id": "TASK-018",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": ["sdcorejs-angular"],
    "semantic_scope": "library",
    "allowed_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-document.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-layout.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-commands.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-palette.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-store.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-drag.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-state.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-layout.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/state/builder-references.ts"],
    "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
    "depends_on": ["TASK-017"]
   },
   {
    "id": "TASK-019",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": ["sdcorejs-angular"],
    "semantic_scope": "library",
    "allowed_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/attribute-expression.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/attribute-expression.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/attribute-expression.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/attribute-expression.component.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/form-expression-query-adapter.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/form-expression-query-adapter.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/configure-validation/configure-validation.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/configure-validation/configure-validation.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/configure-validation/configure-validation.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/expression-builder/expression-builder.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/expression-builder/expression-builder.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/expression-builder/expression-builder.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/expression-builder/expression-builder.component.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/attribute-selection.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/attribute-selection.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-queries/build-queries.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-queries/build-queries.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-variables/build-variables.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-variables/build-variables.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/html/attribute/components/build-queries/build-queries.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/html/attribute/components/build-queries/build-queries.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-parameter/attribute-parameter.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-parameter/attribute-parameter.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/value-box/mapping-summary.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/value-box/mapping-summary.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-table/attribute-table.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-table/attribute-table.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-input/attribute-input.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-input/attribute-input.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-select/attribute-select.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-select/attribute-select.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-switch/attribute-switch.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-switch/attribute-switch.component.html"],
    "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
    "depends_on": ["TASK-018"]
   },
   {
    "id": "TASK-020",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": ["sdcorejs-angular"],
    "semantic_scope": "library",
    "allowed_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/canvas.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/canvas.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/canvas.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/field-preview.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/field-preview.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/canvas/drop-feedback.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/inspector.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/options-editor.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/options-editor.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/inspector/options-editor.component.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/palette/palette.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/palette/palette.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/palette/structure.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/palette/structure.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/preview/preview.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/preview/preview.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/preview/preview.component.scss"],
    "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
    "depends_on": ["TASK-019"]
   },
   {
    "id": "TASK-021",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": ["sdcorejs-angular"],
    "semantic_scope": "library",
    "allowed_paths": ["versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts","versions/v19/projects/sdcorejs-angular/i18n/src/en.ts","versions/v19/projects/sdcorejs-angular/i18n/src/ko.ts","versions/v19/projects/sdcorejs-angular/i18n/src/ja.ts","versions/v19/projects/sdcorejs-angular/i18n/src/zh.ts"],
    "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
    "depends_on": ["TASK-020"]
   },
   {
    "id": "TASK-022",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": ["sdcorejs-angular"],
    "semantic_scope": "library",
    "allowed_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/index.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/index.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/index.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/public-api.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/sd-feel-expression/sd-feel-expression.component.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/sd-feel-expression/sd-feel-expression.component.html","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/sd-feel-expression/sd-feel-expression.component.scss","versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/sd-feel-expression/sd-feel-expression.component.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-component.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-definition-html.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-definition-selection.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-definition-table.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-expression.model.spec.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-expression.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-template.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic-validation.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-generic.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-render/form-render-args.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-render/form-render-entity.model.ts","versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/form-render/index.ts"],
    "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
    "depends_on": ["TASK-021"]
   },
   {
    "id": "TASK-023",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": ["sdcorejs-angular"],
    "semantic_scope": "library",
    "allowed_paths": ["versions/v19/projects/sdcorejs-angular/components/form-generic/sd-form-generic.md","CHANGELOG.md"],
    "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
    "depends_on": ["TASK-022"]
   },
   {
    "id": "TASK-024",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": ["sdcorejs-angular"],
    "semantic_scope": "library",
    "allowed_paths": ["showcase/src/app/pages/components/form-generic/form-generic-demo.component.ts","showcase/src/app/pages/components/form-generic/form-generic-demo.component.spec.ts","showcase/src/app/docs/generated/example-manifest.generated.ts","showcase/src/app/docs/generated/example-sources.generated.ts"],
    "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
    "depends_on": ["TASK-023"]
   },
   {
    "id": "TASK-025",
    "action": "VERIFY",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": ["sdcorejs-angular"],
    "semantic_scope": "library",
    "allowed_paths": ["versions/v19/projects/sdcorejs-angular/karma.conf.js"],
    "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
    "depends_on": ["TASK-024"]
   },
   {
    "id": "TASK-026",
    "action": "VERIFY-THEN-EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": ["sdcorejs-angular"],
    "semantic_scope": "library",
    "allowed_paths": ["versions/v19/SYNC-STATUS.md","versions/v20/**","versions/v21/**","versions/v22/**"],
    "prohibited_paths": ["**/package.json","**/package-lock.json",".github/**","scripts/**","published-pages/**","published-docs/**","README.md","README.npm.md","product/**","design/**","docs/**","**/.env*","**/node_modules/**","**/dist/**",".sdcorejs/specs/**",".sdcorejs/architecture/**"],
    "depends_on": ["TASK-025"]
   }
  ]
 },
 "finish_tail": {
  "contract": {
   "docs_before_final_branch_ready": "TASK-023 trước TASK-025/TASK-026",
   "verify_before_done": "TASK-025 và TASK-026 chạy lệnh thật, báo kết quả kèm output",
   "branch_ready_final_gate": "sau TASK-026: báo cáo, không commit/push/tag/publish trừ khi người dùng yêu cầu",
   "no_writes_after_branch_ready": true
  }
 },
 "approval": {"approved":false,"approved_at":null},
 "change_control": {
  "revision": 2,
  "supersedes": ".sdcorejs/plans/angular/2026-09-30-01-16-form-generic-schema-v1-phase-1.md",
  "change_reason": "prepareExecution preflight: r1 allowed/prohibited_paths chứa ghi chú nên không phải glob, TASK-026 khai báo thư mục thay vì versions/v2x/**, repository topology thiếu available/writable. Nội dung task không đổi."
 }
}
```
