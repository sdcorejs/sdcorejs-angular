---
{
  "approval_source": "explicit-user-choice",
  "approved_at": "2026-09-29T14:21:21.736Z",
  "approved_by": "user",
  "artifact_id": "architecture-form-generic-schema-v1-r1",
  "artifact_kind": "architecture",
  "change_control": {
    "change_reason": null,
    "revision": 1,
    "supersedes": null
  },
  "change_ref": "form-generic-schema-v1",
  "commit_policy": "with-change",
  "contract_id": "form-generic-schema-v1",
  "description": "Form generic schema v1 phase 1 architecture: pure models/layout/rules core, no-mutation value ownership, single Filter evaluator, union extension rule for phases 2-3, catalog item/cache, value/validate semantics.",
  "execution_host_repository_id": "sdcorejs-angular",
  "integration_owner_repository_id": "sdcorejs-angular",
  "name": "form-generic-schema-v1-phase-1-architecture",
  "owner": "sdcorejs-architecture",
  "owner_module_id": "components/form-generic",
  "owner_repository_id": "sdcorejs-angular",
  "owner_repository_role": "library",
  "parent_references": [
    {
      "approval_hash": "sha256:v1:6252cd8f9b48bce67af08815056bec87385a63169d7435edc81bcfbd881cb801",
      "artifact_id": "spec-form-generic-schema-v1-r1",
      "artifact_kind": "spec",
      "repository_id": "sdcorejs-angular",
      "revision": "8812f188e71b5d1f6e47d7b2405552c85bc479b9"
    }
  ],
  "parent_repository_id": "sdcorejs-angular",
  "repository_relative_path": ".sdcorejs/architecture/angular/2026-09-29-18-53-form-generic-schema-v1-phase-1.md",
  "requirement_id": "R-001",
  "schema_version": 1,
  "sourceDraftPath": ".sdcorejs/docs/architecture/2026-09-29-18-53-form-generic-schema-v1-phase-1-architecture.md",
  "source_plan": "none",
  "source_revision": "8812f188e71b5d1f6e47d7b2405552c85bc479b9",
  "source_spec": ".sdcorejs/specs/angular/2026-09-29-18-42-form-generic-schema-v1-phase-1.md",
  "stack_profile": "core-ui-angular",
  "supersedes": null,
  "target_root_kind": "target-project",
  "track": "angular",
  "approval_hash": "sha256:v1:db91ad7886d71be8e4549e37b69dbbca04584ae598fa287e8d0e877fd6948a09"
}
---

# Architecture — Form generic schema v1, Đợt 1: nền - Approved Architecture

> Snapshot of what the user approved at the `sdcorejs-architecture` gate. Do not edit by hand; re-author through `sdcorejs-architecture` if the contract changes.

## Approved contract

# Architecture — Form generic schema v1, Đợt 1: nền

- **Nguồn:** spec đã duyệt `spec-form-generic-schema-v1-r1` (`sha256:v1:6252cd8f…`).
- **Trạng thái:** bản nháp, chưa duyệt. Chỉ ghi các quyết định mà nhiều đơn vị làm độc lập (Đợt 1, 2, 3) phải hiểu giống nhau; thứ tự file và task thuộc về plan.

## Trigger và owner

- Gate: **required**. Signals: `persisted-data-model-contract`, `public-api-contract`, `state-data-ownership`.
- Owner: `sdcorejs-angular` (library), module `components/form-generic`. Integration owner là chính thư viện; execution host cũng là thư viện.
- Không có tích hợp cross-repository. Resolver owner được gọi bằng repository id vì repo là library đứng riêng.

## Invariants

| ID | Điều phải luôn đúng | Cách chứng minh |
| --- | --- | --- |
| INV-001 | sd-form-render không bao giờ mutate schema, value hay variables được truyền vào; sd-form-builder không bao giờ mutate schema được truyền vào; mọi lần phát là object mới. | Test truyền input đã deep-freeze cho renderer và builder, thao tác người dùng, kiểm tra không lỗi và mỗi lần phát là tham chiếu mới. |
| INV-002 | Chọn mức breakpoint, kế thừa span và xếp hàng (kể cả newRow) do một module layout thuần duy nhất đảm nhận; canvas và renderer cho cùng input + cùng mức luôn ra cùng các hàng. | Test đơn vị layout cho 3 mức, kế thừa và newRow; test so sánh hàng của canvas và renderer trên cùng schema. |
| INV-003 | Mọi điều kiện (rules) và validation cấp form dạng biểu thức đều là Filter, đánh giá bởi một evaluator duy nhất bọc FilterUtilities.evaluate trên { ...value, ...variables }; không còn định dạng biểu thức nào khác trong schema hay runtime. | Ma trận test từng toán tử (so sánh, like, IN, BETWEEN, NULL, ngày tương đối, field–field) và test rules/validate() của renderer. |
| INV-004 | Schema luôn đúng ngữ pháp: pages → (group | element), group chỉ chứa element, không có break, không có schemaVersion, key field duy nhất (kể cả so với biến); mọi lệnh của builder chỉ tạo ra schema hợp lệ. | Test normalize/validate từ chối group lồng, break, schemaVersion, key trùng; test lệnh builder (thêm, kéo-thả, nhân bản, đổi mã) luôn trả schema hợp lệ. |
| INV-005 | Mọi tham chiếu tới key field hoặc biến trong schema đều có cấu trúc (Filter.field và so sánh field–field, SdFormGenericValueRef, fill.field); chuỗi tự do chỉ còn ở hyperlink và nội dung html. | Test đổi mã cập nhật đủ mọi vị trí có cấu trúc và đếm đúng tham chiếu trong chuỗi tự do. |
| INV-006 | Thêm type phần tử mới (đợt 2/3) không đổi shape của type đã có; phần tử có type lạ được renderer bỏ qua và được builder giữ nguyên khi phát lại. | Test nạp schema có phần tử type lạ: renderer không lỗi và bỏ qua; builder phát lại phần tử đó y nguyên. |
| INV-007 | Chỉ sửa code ở versions/v19; v20/v21/v22 chỉ đổi qua npm run sync và check:sync luôn qua; v22 giữ LF. | npm run check:sync xanh; git ls-files --eol không còn file CRLF trong v22. |
| INV-008 | Public API của entry form-generic đúng bằng danh sách hợp đồng C-001…C-006; mọi export cũ bị bỏ đều được liệt kê trong mục BREAKING của CHANGELOG. | Test liệt kê export của entry point so với danh sách hợp đồng; review CHANGELOG. |
| INV-009 | Component không tự gọi HTTP; dữ liệu của portal chỉ đi qua callback trong provideSdFormGeneric (catalog.load/search, htmlDefinitions, validators, templates). | Test renderer/builder với provider giả kiểm tra params, fill, search; không có HttpClient trong form-generic. |

## Hợp đồng public

| ID | Loại | Hợp đồng | Tương thích |
| --- | --- | --- | --- |
| C-001 | persisted-data-model | SdFormGenericSchema JSON: pages, group, field, layout, rules, validation, options, variables, validations; đợt 2/3 thêm type theo D-017. | Phiên bản đầu tiên; không tương thích SdFormGeneric cũ (D-001). |
| C-002 | api | sd-form-render: [schema], [(value)], [form], [variables], [viewed], [breakpoint], [labelPlacement], [keys], (sdAction); validate(), upload(); submit()/reset() từ đợt 2. | BREAKING: thay [configuration], [entity], [defaultEntity], [properties], setVariables, getValidationMessages(). |
| C-003 | api | sd-form-builder: [(schema)], getSchema(). | BREAKING: thay [formGeneric], (sdChange), getForm(), accessor components/variables/validations. |
| C-004 | api | provideSdFormGeneric({ catalogs, templates, htmlDefinitions, validators, breakpoints }), các interface catalog/template/htmlDefinition/validator, SD_FORM_GENERIC_BREAKPOINTS, SdFormGenericBreakpoint. | BREAKING: thay SD_FORM_GENERIC_CONFIGURATION.form (selections, getValues, getLazyValues, tables, htmls, validation). |
| C-005 | api | SdFormRenderService.viewEntities(schema, entities). | Đổi kiểu tham số sang SdFormGenericSchema. |
| C-006 | api | Bỏ SdFeelExpression, model expression cũ (SdFormGenericExpression*, sdEvaluateExpression, sdExpressionToJavascriptExpression, sdTemplateToCondition, SD_ATTRIBUTE_OPERATORS, SD_DAY_INFO_*), SdFormGenericBreak, SD_FORM_BUILDER_COMPONENTS, SD_COMPONENT_ICONS, SD_TABLE_COLUMN_TYPES và các helper attribute cũ. | BREAKING: gỡ khỏi public API. |

## Quyết định kiến trúc mới

- **D-017** — Mở rộng union phần tử ở đợt 2/3 thế nào, và code gặp type lạ thì xử lý ra sao? Thêm thành viên mới vào union SdFormGenericElement (và giá trị navigation) mà không đổi shape thành viên cũ. Renderer bỏ qua type lạ (cảnh báo khi dev mode); builder giữ nguyên phần tử lạ khi nạp → phát (round-trip) và hiện thẻ "chưa hỗ trợ". _Lý do:_ Các đợt sau là các đơn vị làm độc lập; luật mở rộng phải cố định trước để không phá schema đợt 1.
- **D-018** — Tách lõi thuần TS ở đâu? models (type + normalize/validate grammar), layout (breakpoint, kế thừa span, xếp hàng) và rules (đánh giá Filter, duyệt/đổi tham chiếu) là TypeScript thuần — không DI, không DOM; renderer và builder chỉ phụ thuộc chiều vào chúng. _Lý do:_ Canvas và renderer phải xếp giống nhau; logic cần TDD nhanh, không cần TestBed.
- **D-019** — Item của catalog và bộ nhớ đệm? Catalog trả SdFormGenericCatalogItem = SdFormGenericOption & { data?: Record<string, unknown> }; fill đọc item.data[from]. Kết quả load được đệm theo từng instance renderer, khoá bằng catalog id + params đã giải; không dùng bộ đệm toàn cục. _Lý do:_ Hai form cùng trang không được dùng lẫn dữ liệu; fill cần dữ liệu ngoài value/label.
- **D-020** — Ngữ nghĩa value và validate()? value chỉ gồm key của field (không có phần tử tĩnh/nút), giữ giá trị của field đang ẩn; valueChange phát object mới sau mỗi thay đổi control (không debounce). validate() đánh dấu mọi control đã chạm, chạy validator của field rồi validations cấp form, trả { valid, messages: { error, warning } }; chỉ error làm valid = false. _Lý do:_ Consumer và các đợt sau phải hiểu value và validate() giống nhau.

Các quyết định từ spec (D-001…D-016) được giữ nguyên và tính là đã áp dụng.

## Ranh giới, phụ thuộc, nơi sở hữu state

**Ranh giới:**
- B-001: Chỉ sửa code ở versions/v19; v20–v22 qua npm run sync.
- B-002: models, layout, rules là TypeScript thuần (không DI, không DOM, không import từ components).
- B-003: form-render không import form-builder; form-builder chỉ dùng form-render cho Xem trước.
- B-004: Dữ liệu của portal chỉ vào qua provideSdFormGeneric; không HttpClient trong form-generic.

**Hướng phụ thuộc:**
- `components/form-builder` → components/form-render (Xem trước), models, layout, rules, sd-query-builder, các control Core. Builder dựng trên lõi thuần và dùng renderer thật để xem trước.
- `components/form-render` → models, layout, rules, FormGenericService, các control Core. Renderer không biết builder.
- `rules` → @sdcorejs/utils FilterUtilities. Một evaluator Filter duy nhất.
- `models` → @sdcorejs/utils (chỉ type Filter). Schema tham chiếu type Filter, không kéo runtime.

**Nơi sở hữu state:**

| State | Chủ sở hữu |
| --- | --- |
| Giá trị form (value) | sd-form-render (model value); consumer giữ qua two-way binding |
| FormGroup và các control | sd-form-render (hoặc FormGroup do consumer truyền qua [form]) |
| Schema đang thiết kế + lịch sử undo | FormBuilderStore (mỗi instance builder một store) |
| Mức breakpoint hiện hành | sd-form-render đo theo bề rộng form, trừ khi [breakpoint] do consumer/builder đặt |
| Kết quả load catalog | Từng instance sd-form-render (đệm theo catalog id + params) |
| Giá trị biến | Consumer qua [variables] |

## Validation obligations

| ID | Bằng chứng mong đợi | Invariant | AC |
| --- | --- | --- | --- |
| VAL-001 | Test deep-freeze cho renderer (schema, value, variables) và builder (schema); mỗi lần phát là tham chiếu mới. | INV-001 | AC-009, AC-013 |
| VAL-002 | Test đơn vị layout 3 mức, kế thừa span, newRow, ghi đè breakpoint, ép mức; test so sánh hàng canvas với renderer. | INV-002 | AC-002, AC-003, AC-004, AC-010, AC-012, AC-014 |
| VAL-003 | Ma trận toán tử Filter và test rules/validate() của renderer, kể cả biến và ngày tương đối. | INV-003 | AC-005, AC-006 |
| VAL-004 | Test normalize/validate từ chối group lồng, break, schemaVersion, key trùng; test lệnh builder luôn trả schema hợp lệ. | INV-004 | AC-001 |
| VAL-005 | Test đổi mã cập nhật mọi tham chiếu có cấu trúc và đếm tham chiếu chuỗi tự do. | INV-005 | AC-015 |
| VAL-006 | Test phần tử type lạ: renderer bỏ qua không lỗi; builder phát lại y nguyên. | INV-006 | AC-001 |
| VAL-007 | npm run check:sync xanh; không còn file CRLF trong v22. | INV-007 | AC-018 |
| VAL-008 | Test danh sách export của entry form-generic khớp C-001…C-006; CHANGELOG liệt kê export bị bỏ. | INV-008 | AC-017 |
| VAL-009 | Test renderer với provider giả: params đã giải, tải lại khi field nguồn đổi, fill, search; không có HttpClient trong module. | INV-009 | AC-008 |

## Profile frontend, giả định, quyết định hoãn

- `frontend_architecture_ref`: trỏ tới `plan_context.frontend_architecture`, conformance INV-001, INV-002, INV-004, INV-006.
- Giả định được tham chiếu: A-002 (toán tử của FilterUtilities), A-003 (giữ lớp tương tác của builder), A-005 (biến dùng chung không gian key).
- Quyết định hoãn: không có.
- Decision coverage: revision 2 (thêm D-017…D-020 và INV-001…INV-009 vào revision 1 của spec).

## Review kiến trúc

Lượt review riêng (chỉ đọc) không chạy: người dùng dừng lượt review và chọn duyệt bản nháp trực tiếp (2026-09-29). Bản nháp đã qua `validateArchitectureContext` và `validateDecisionCoverage` (revision 2) không blocker.

## Appendix — architecture_context (machine-readable)

Đã kiểm bằng `validateArchitectureContext` với decision coverage revision 2. Hash của snapshot đã duyệt được điền sau khi bạn duyệt.

<details><summary>architecture_context JSON</summary>

```json
{
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
 "approved_architecture_hash": "(filled after approval)",
 "owner_repository_id": "sdcorejs-angular",
 "owner_module_id": "components/form-generic",
 "execution_host_repository_id": "sdcorejs-angular",
 "integration_owner_repository_id": "sdcorejs-angular",
 "trigger": {
  "required": true,
  "signals": [
   "persisted-data-model-contract",
   "public-api-contract",
   "state-data-ownership"
  ],
  "rationale": "Thay schema JSON mà consumer lưu trữ (persisted data model), đổi public API của sd-form-render/sd-form-builder/provider, và chuyển quyền sở hữu giá trị từ object entity bị mutate sang model value."
 },
 "invariants": [
  {
   "id": "INV-001",
   "statement": "sd-form-render không bao giờ mutate schema, value hay variables được truyền vào; sd-form-builder không bao giờ mutate schema được truyền vào; mọi lần phát là object mới.",
   "scope": "Public API của sd-form-render và sd-form-builder",
   "rationale": "Chuyển quyền sở hữu giá trị từ entity bị ghi ngược sang model value (state-data-ownership).",
   "verification_method": "Test truyền input đã deep-freeze cho renderer và builder, thao tác người dùng, kiểm tra không lỗi và mỗi lần phát là tham chiếu mới.",
   "requirement_refs": [
    "R-007",
    "R-008"
   ],
   "decision_refs": [
    "D-007",
    "D-020"
   ],
   "owner": "sdcorejs-angular/components/form-generic"
  },
  {
   "id": "INV-002",
   "statement": "Chọn mức breakpoint, kế thừa span và xếp hàng (kể cả newRow) do một module layout thuần duy nhất đảm nhận; canvas và renderer cho cùng input + cùng mức luôn ra cùng các hàng.",
   "scope": "layout module, canvas, renderer",
   "rationale": "Builder chỉ đáng tin khi thấy sao ra vậy ở cả 3 mức.",
   "verification_method": "Test đơn vị layout cho 3 mức, kế thừa và newRow; test so sánh hàng của canvas và renderer trên cùng schema.",
   "requirement_refs": [
    "R-002",
    "R-008"
   ],
   "decision_refs": [
    "D-003",
    "D-018"
   ],
   "owner": "sdcorejs-angular/components/form-generic"
  },
  {
   "id": "INV-003",
   "statement": "Mọi điều kiện (rules) và validation cấp form dạng biểu thức đều là Filter, đánh giá bởi một evaluator duy nhất bọc FilterUtilities.evaluate trên { ...value, ...variables }; không còn định dạng biểu thức nào khác trong schema hay runtime.",
   "scope": "rules module, renderer, builder",
   "rationale": "Một định dạng với sd-query-builder, bỏ lớp chuyển đổi hai chiều.",
   "verification_method": "Ma trận test từng toán tử (so sánh, like, IN, BETWEEN, NULL, ngày tương đối, field–field) và test rules/validate() của renderer.",
   "requirement_refs": [
    "R-003"
   ],
   "decision_refs": [
    "D-004",
    "D-008"
   ],
   "owner": "sdcorejs-angular/components/form-generic"
  },
  {
   "id": "INV-004",
   "statement": "Schema luôn đúng ngữ pháp: pages → (group | element), group chỉ chứa element, không có break, không có schemaVersion, key field duy nhất (kể cả so với biến); mọi lệnh của builder chỉ tạo ra schema hợp lệ.",
   "scope": "models (normalize/validate), builder commands",
   "rationale": "Schema là hợp đồng dữ liệu được lưu trữ (persisted-data-model).",
   "verification_method": "Test normalize/validate từ chối group lồng, break, schemaVersion, key trùng; test lệnh builder (thêm, kéo-thả, nhân bản, đổi mã) luôn trả schema hợp lệ.",
   "requirement_refs": [
    "R-001",
    "R-008"
   ],
   "decision_refs": [
    "D-001",
    "D-002",
    "D-013"
   ],
   "owner": "sdcorejs-angular/components/form-generic"
  },
  {
   "id": "INV-005",
   "statement": "Mọi tham chiếu tới key field hoặc biến trong schema đều có cấu trúc (Filter.field và so sánh field–field, SdFormGenericValueRef, fill.field); chuỗi tự do chỉ còn ở hyperlink và nội dung html.",
   "scope": "models, rules (references), builder rename",
   "rationale": "Đổi mã phải cập nhật tham chiếu một cách chắc chắn.",
   "verification_method": "Test đổi mã cập nhật đủ mọi vị trí có cấu trúc và đếm đúng tham chiếu trong chuỗi tự do.",
   "requirement_refs": [
    "R-005",
    "R-009"
   ],
   "decision_refs": [
    "D-005",
    "D-008"
   ],
   "owner": "sdcorejs-angular/components/form-generic"
  },
  {
   "id": "INV-006",
   "statement": "Thêm type phần tử mới (đợt 2/3) không đổi shape của type đã có; phần tử có type lạ được renderer bỏ qua và được builder giữ nguyên khi phát lại.",
   "scope": "models, renderer, builder",
   "rationale": "Đợt 2/3 mở rộng schema mà không phá đợt 1 (D-017).",
   "verification_method": "Test nạp schema có phần tử type lạ: renderer không lỗi và bỏ qua; builder phát lại phần tử đó y nguyên.",
   "requirement_refs": [
    "R-001"
   ],
   "decision_refs": [
    "D-017",
    "D-010"
   ],
   "owner": "sdcorejs-angular/components/form-generic"
  },
  {
   "id": "INV-007",
   "statement": "Chỉ sửa code ở versions/v19; v20/v21/v22 chỉ đổi qua npm run sync và check:sync luôn qua; v22 giữ LF.",
   "scope": "Các workspace của repository",
   "rationale": "Luật cứng của repo (CLAUDE.md).",
   "verification_method": "npm run check:sync xanh; git ls-files --eol không còn file CRLF trong v22.",
   "requirement_refs": [
    "R-011"
   ],
   "decision_refs": [
    "D-010"
   ],
   "owner": "sdcorejs-angular/components/form-generic"
  },
  {
   "id": "INV-008",
   "statement": "Public API của entry form-generic đúng bằng danh sách hợp đồng C-001…C-006; mọi export cũ bị bỏ đều được liệt kê trong mục BREAKING của CHANGELOG.",
   "scope": "components/form-generic/index.ts, CHANGELOG.md",
   "rationale": "Package public trên npm; thay đổi phải tường minh.",
   "verification_method": "Test liệt kê export của entry point so với danh sách hợp đồng; review CHANGELOG.",
   "requirement_refs": [
    "R-010"
   ],
   "decision_refs": [
    "D-001",
    "D-008"
   ],
   "owner": "sdcorejs-angular/components/form-generic"
  },
  {
   "id": "INV-009",
   "statement": "Component không tự gọi HTTP; dữ liệu của portal chỉ đi qua callback trong provideSdFormGeneric (catalog.load/search, htmlDefinitions, validators, templates).",
   "scope": "renderer, builder, FormGenericService",
   "rationale": "Một điểm cấu hình; test được bằng provider giả.",
   "verification_method": "Test renderer/builder với provider giả kiểm tra params, fill, search; không có HttpClient trong form-generic.",
   "requirement_refs": [
    "R-005",
    "R-006"
   ],
   "decision_refs": [
    "D-006",
    "D-019"
   ],
   "owner": "sdcorejs-angular/components/form-generic"
  }
 ],
 "boundaries": [
  {
   "id": "B-001",
   "statement": "Chỉ sửa code ở versions/v19; v20–v22 qua npm run sync.",
   "invariant_refs": [
    "INV-007"
   ]
  },
  {
   "id": "B-002",
   "statement": "models, layout, rules là TypeScript thuần (không DI, không DOM, không import từ components).",
   "invariant_refs": [
    "INV-002",
    "INV-003",
    "INV-004"
   ]
  },
  {
   "id": "B-003",
   "statement": "form-render không import form-builder; form-builder chỉ dùng form-render cho Xem trước.",
   "invariant_refs": [
    "INV-001",
    "INV-002"
   ]
  },
  {
   "id": "B-004",
   "statement": "Dữ liệu của portal chỉ vào qua provideSdFormGeneric; không HttpClient trong form-generic.",
   "invariant_refs": [
    "INV-009"
   ]
  }
 ],
 "dependency_directions": [
  {
   "from": "components/form-builder",
   "to": "components/form-render (Xem trước), models, layout, rules, sd-query-builder, các control Core",
   "rationale": "Builder dựng trên lõi thuần và dùng renderer thật để xem trước.",
   "invariant_refs": [
    "INV-002",
    "INV-004"
   ]
  },
  {
   "from": "components/form-render",
   "to": "models, layout, rules, FormGenericService, các control Core",
   "rationale": "Renderer không biết builder.",
   "invariant_refs": [
    "INV-001",
    "INV-003"
   ]
  },
  {
   "from": "rules",
   "to": "@sdcorejs/utils FilterUtilities",
   "rationale": "Một evaluator Filter duy nhất.",
   "invariant_refs": [
    "INV-003"
   ]
  },
  {
   "from": "models",
   "to": "@sdcorejs/utils (chỉ type Filter)",
   "rationale": "Schema tham chiếu type Filter, không kéo runtime.",
   "invariant_refs": [
    "INV-004"
   ]
  }
 ],
 "data_state_owners": [
  {
   "subject": "Giá trị form (value)",
   "owner_repository_id": "sdcorejs-angular",
   "owner": "sd-form-render (model value); consumer giữ qua two-way binding",
   "invariant_refs": [
    "INV-001"
   ]
  },
  {
   "subject": "FormGroup và các control",
   "owner_repository_id": "sdcorejs-angular",
   "owner": "sd-form-render (hoặc FormGroup do consumer truyền qua [form])",
   "invariant_refs": [
    "INV-001"
   ]
  },
  {
   "subject": "Schema đang thiết kế + lịch sử undo",
   "owner_repository_id": "sdcorejs-angular",
   "owner": "FormBuilderStore (mỗi instance builder một store)",
   "invariant_refs": [
    "INV-001",
    "INV-004"
   ]
  },
  {
   "subject": "Mức breakpoint hiện hành",
   "owner_repository_id": "sdcorejs-angular",
   "owner": "sd-form-render đo theo bề rộng form, trừ khi [breakpoint] do consumer/builder đặt",
   "invariant_refs": [
    "INV-002"
   ]
  },
  {
   "subject": "Kết quả load catalog",
   "owner_repository_id": "sdcorejs-angular",
   "owner": "Từng instance sd-form-render (đệm theo catalog id + params)",
   "invariant_refs": [
    "INV-009"
   ]
  },
  {
   "subject": "Giá trị biến",
   "owner_repository_id": "sdcorejs-angular",
   "owner": "Consumer qua [variables]",
   "invariant_refs": [
    "INV-003"
   ]
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
   "invariant_refs": [
    "INV-004",
    "INV-005",
    "INV-006"
   ]
  },
  {
   "id": "C-002",
   "kind": "api",
   "statement": "sd-form-render: [schema], [(value)], [form], [variables], [viewed], [breakpoint], [labelPlacement], [keys], (sdAction); validate(), upload(); submit()/reset() từ đợt 2.",
   "owner": "sdcorejs-angular/components/form-generic",
   "compatibility": "BREAKING: thay [configuration], [entity], [defaultEntity], [properties], setVariables, getValidationMessages().",
   "migration": "CHANGELOG BREAKING + sd-form-generic.md.",
   "invariant_refs": [
    "INV-001",
    "INV-002",
    "INV-003"
   ]
  },
  {
   "id": "C-003",
   "kind": "api",
   "statement": "sd-form-builder: [(schema)], getSchema().",
   "owner": "sdcorejs-angular/components/form-generic",
   "compatibility": "BREAKING: thay [formGeneric], (sdChange), getForm(), accessor components/variables/validations.",
   "migration": "CHANGELOG BREAKING + sd-form-generic.md.",
   "invariant_refs": [
    "INV-001",
    "INV-004"
   ]
  },
  {
   "id": "C-004",
   "kind": "api",
   "statement": "provideSdFormGeneric({ catalogs, templates, htmlDefinitions, validators, breakpoints }), các interface catalog/template/htmlDefinition/validator, SD_FORM_GENERIC_BREAKPOINTS, SdFormGenericBreakpoint.",
   "owner": "sdcorejs-angular/components/form-generic",
   "compatibility": "BREAKING: thay SD_FORM_GENERIC_CONFIGURATION.form (selections, getValues, getLazyValues, tables, htmls, validation).",
   "migration": "CHANGELOG BREAKING + ví dụ cấu hình mới.",
   "invariant_refs": [
    "INV-009",
    "INV-002"
   ]
  },
  {
   "id": "C-005",
   "kind": "api",
   "statement": "SdFormRenderService.viewEntities(schema, entities).",
   "owner": "sdcorejs-angular/components/form-generic",
   "compatibility": "Đổi kiểu tham số sang SdFormGenericSchema.",
   "migration": "CHANGELOG BREAKING.",
   "invariant_refs": [
    "INV-008"
   ]
  },
  {
   "id": "C-006",
   "kind": "api",
   "statement": "Bỏ SdFeelExpression, model expression cũ (SdFormGenericExpression*, sdEvaluateExpression, sdExpressionToJavascriptExpression, sdTemplateToCondition, SD_ATTRIBUTE_OPERATORS, SD_DAY_INFO_*), SdFormGenericBreak, SD_FORM_BUILDER_COMPONENTS, SD_COMPONENT_ICONS, SD_TABLE_COLUMN_TYPES và các helper attribute cũ.",
   "owner": "sdcorejs-angular/components/form-generic",
   "compatibility": "BREAKING: gỡ khỏi public API.",
   "migration": "CHANGELOG liệt kê từng export bị bỏ và cách thay (sd-query-builder + Filter).",
   "invariant_refs": [
    "INV-008",
    "INV-003"
   ]
  }
 ],
 "security_trust_boundaries": [],
 "cross_repository_integration": [],
 "adopted_decision_refs": [
  "D-001",
  "D-002",
  "D-003",
  "D-004",
  "D-005",
  "D-006",
  "D-007",
  "D-008",
  "D-009",
  "D-010",
  "D-011",
  "D-012",
  "D-013",
  "D-014",
  "D-015",
  "D-016",
  "D-017",
  "D-018",
  "D-019",
  "D-020"
 ],
 "deferred_decision_refs": [],
 "assumption_refs": [
  "A-002",
  "A-003",
  "A-005"
 ],
 "validation_obligations": [
  {
   "id": "VAL-001",
   "expected_proof": "Test deep-freeze cho renderer (schema, value, variables) và builder (schema); mỗi lần phát là tham chiếu mới.",
   "owner": "sdcorejs-execute-plan",
   "invariant_refs": [
    "INV-001"
   ],
   "acceptance_criterion_refs": [
    "AC-009",
    "AC-013"
   ]
  },
  {
   "id": "VAL-002",
   "expected_proof": "Test đơn vị layout 3 mức, kế thừa span, newRow, ghi đè breakpoint, ép mức; test so sánh hàng canvas với renderer.",
   "owner": "sdcorejs-execute-plan",
   "invariant_refs": [
    "INV-002"
   ],
   "acceptance_criterion_refs": [
    "AC-002",
    "AC-003",
    "AC-004",
    "AC-010",
    "AC-012",
    "AC-014"
   ]
  },
  {
   "id": "VAL-003",
   "expected_proof": "Ma trận toán tử Filter và test rules/validate() của renderer, kể cả biến và ngày tương đối.",
   "owner": "sdcorejs-execute-plan",
   "invariant_refs": [
    "INV-003"
   ],
   "acceptance_criterion_refs": [
    "AC-005",
    "AC-006"
   ]
  },
  {
   "id": "VAL-004",
   "expected_proof": "Test normalize/validate từ chối group lồng, break, schemaVersion, key trùng; test lệnh builder luôn trả schema hợp lệ.",
   "owner": "sdcorejs-execute-plan",
   "invariant_refs": [
    "INV-004"
   ],
   "acceptance_criterion_refs": [
    "AC-001"
   ]
  },
  {
   "id": "VAL-005",
   "expected_proof": "Test đổi mã cập nhật mọi tham chiếu có cấu trúc và đếm tham chiếu chuỗi tự do.",
   "owner": "sdcorejs-execute-plan",
   "invariant_refs": [
    "INV-005"
   ],
   "acceptance_criterion_refs": [
    "AC-015"
   ]
  },
  {
   "id": "VAL-006",
   "expected_proof": "Test phần tử type lạ: renderer bỏ qua không lỗi; builder phát lại y nguyên.",
   "owner": "sdcorejs-execute-plan",
   "invariant_refs": [
    "INV-006"
   ],
   "acceptance_criterion_refs": [
    "AC-001"
   ]
  },
  {
   "id": "VAL-007",
   "expected_proof": "npm run check:sync xanh; không còn file CRLF trong v22.",
   "owner": "sdcorejs-execute-plan",
   "invariant_refs": [
    "INV-007"
   ],
   "acceptance_criterion_refs": [
    "AC-018"
   ]
  },
  {
   "id": "VAL-008",
   "expected_proof": "Test danh sách export của entry form-generic khớp C-001…C-006; CHANGELOG liệt kê export bị bỏ.",
   "owner": "sdcorejs-execute-plan",
   "invariant_refs": [
    "INV-008"
   ],
   "acceptance_criterion_refs": [
    "AC-017"
   ]
  },
  {
   "id": "VAL-009",
   "expected_proof": "Test renderer với provider giả: params đã giải, tải lại khi field nguồn đổi, fill, search; không có HttpClient trong module.",
   "owner": "sdcorejs-execute-plan",
   "invariant_refs": [
    "INV-009"
   ],
   "acceptance_criterion_refs": [
    "AC-008"
   ]
  }
 ],
 "profile_sections": {
  "frontend_architecture_ref": {
   "reference": "plan_context.frontend_architecture",
   "conformance_invariant_refs": [
    "INV-001",
    "INV-002",
    "INV-004",
    "INV-006"
   ]
  },
  "agent_architecture_ref": null
 },
 "change_control": {
  "revision": 1,
  "supersedes": null
 }
}
```

</details>

<details><summary>decision_coverage revision 2 (JSON)</summary>

```json
{
 "schema_version": 1,
 "revision": 2,
 "records": [
  {
   "id": "R-001",
   "type": "requirement",
   "statement": "Schema gốc SdFormGenericSchema là phiên bản đầu tiên (không schemaVersion, không chuyển đổi từ SdFormGeneric cũ) theo ngữ pháp cố định Form → pages → group → element; phần tử phân loại bằng `type`; chừa sẵn shape cho static/button (đợt 2) và tabs/steps/table (đợt 3).",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "components/form-generic",
   "task_refs": []
  },
  {
   "id": "R-002",
   "type": "requirement",
   "statement": "Bố cục responsive layout.span { desktop, tablet, mobile } (1–12) + newRow, theo SD_FORM_GENERIC_BREAKPOINTS = { tablet: 600, desktop: 1024 } đo trên bề rộng form; mặc định desktop 12, tablet theo desktop, mobile 12; ghi đè breakpoint qua provider; bỏ phần tử break.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "components/form-generic",
   "task_refs": []
  },
  {
   "id": "R-003",
   "type": "requirement",
   "statement": "Điều kiện rules { visible, hidden, disabled, required } lưu bằng Filter của @sdcorejs/utils và đánh giá bằng FilterUtilities.evaluate trên giá trị form + biến; validation cấp form dùng Filter hoặc hàm đăng ký ở portal.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "components/form-generic",
   "task_refs": []
  },
  {
   "id": "R-004",
   "type": "requirement",
   "statement": "Validation của field chuẩn hoá { required, min, max, minLength, maxLength, pattern { value, message }, maxItems, phoneCountry }; giữ nguyên các preset text (email, phone, url, password) và number (integer, decimal, currency, percent) cùng kiểm tra của chúng.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "components/form-generic",
   "task_refs": []
  },
  {
   "id": "R-005",
   "type": "requirement",
   "statement": "Nguồn lựa chọn options = { source: static, items } | { source: catalog, catalog, params, fill } với SdFormGenericValueRef có cấu trúc; multiple là thuộc tính field; portal đăng ký catalog { id, label, params, fields, load, search? }.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "components/form-generic",
   "task_refs": []
  },
  {
   "id": "R-006",
   "type": "requirement",
   "statement": "Cấu hình portal gom về provideSdFormGeneric({ catalogs, templates, htmlDefinitions, validators, breakpoints }) thay cho SD_FORM_GENERIC_CONFIGURATION.form cũ.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "components/form-generic",
   "task_refs": []
  },
  {
   "id": "R-007",
   "type": "requirement",
   "statement": "sd-form-render có API [schema], [(value)] (model, không mutate input), [form], [variables], [viewed], [breakpoint], [labelPlacement], [keys]; method validate() trả { valid, messages } và upload(); defaultValue khai báo theo field.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "components/form-generic",
   "task_refs": []
  },
  {
   "id": "R-008",
   "type": "requirement",
   "statement": "sd-form-builder có API [(schema)], thiết kế trên schema mới ngang tính năng hiện có cho các field và group; chế độ Desktop | Tablet | Mobile sửa span của mức đang xem, hiển thị mức kế thừa, newRow thay cho ngắt dòng; Xem trước dùng renderer với [breakpoint] ép mức.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "components/form-generic",
   "task_refs": []
  },
  {
   "id": "R-009",
   "type": "requirement",
   "statement": "Giữ đủ chức năng hiện có trên model mới: biến, validation cấp form, templates, HTML definitions (biến, truy vấn), upload (loại, nguồn, định dạng, số file, dung lượng, tham số), hyperlink khi chỉ xem, labelPlacement, viewed, SdFormRenderService.viewEntities, đổi mã có cập nhật tham chiếu có cấu trúc.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "components/form-generic",
   "task_refs": []
  },
  {
   "id": "R-010",
   "type": "requirement",
   "statement": "Bỏ sd-feel-expression, model expression cũ và phần tử break; CHANGELOG ghi mục BREAKING có ví dụ trước/sau; sd-form-generic.md viết lại cho schema mới; showcase chạy trên schema mới; i18n đủ 5 ngôn ngữ.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "components/form-generic",
   "task_refs": []
  },
  {
   "id": "R-011",
   "type": "requirement",
   "statement": "Kiểm chứng: TDD cho phần logic, test sau cho giao diện kèm ảnh chụp thật; full suite v19 có coverage, lint, check:i18n, check:i18n-parity, check:scss-hex xanh; rollout v20/v21/v22 bằng npm run sync và check:sync xanh.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "components/form-generic",
   "task_refs": []
  },
  {
   "id": "AC-001",
   "type": "acceptance-criterion",
   "statement": "Builder phát (schemaChange) sau một thay đổi của người dùng → JSON là SdFormGenericSchema hợp lệ: có pages, không có schemaVersion, không có phần tử break, mọi phần tử có id, field có key duy nhất",
   "behavior": "Builder phát (schemaChange) sau một thay đổi của người dùng",
   "expected_result": "JSON là SdFormGenericSchema hợp lệ: có pages, không có schemaVersion, không có phần tử break, mọi phần tử có id, field có key duy nhất",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-001"
   ],
   "task_refs": []
  },
  {
   "id": "AC-002",
   "type": "acceptance-criterion",
   "statement": "Renderer hiển thị field span { desktop: 6 } ở bề rộng form 1100px, 800px và 480px → Hai field/hàng ở 1100px và 800px (tablet kế thừa desktop); xếp chồng ở 480px (mobile mặc định 12)",
   "behavior": "Renderer hiển thị field span { desktop: 6 } ở bề rộng form 1100px, 800px và 480px",
   "expected_result": "Hai field/hàng ở 1100px và 800px (tablet kế thừa desktop); xếp chồng ở 480px (mobile mặc định 12)",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-002"
   ],
   "task_refs": []
  },
  {
   "id": "AC-003",
   "type": "acceptance-criterion",
   "statement": "Portal ghi đè breakpoints { tablet: 700 } rồi render form rộng 650px → Form dùng mức mobile; các giá trị không ghi đè giữ mặc định SD_FORM_GENERIC_BREAKPOINTS",
   "behavior": "Portal ghi đè breakpoints { tablet: 700 } rồi render form rộng 650px",
   "expected_result": "Form dùng mức mobile; các giá trị không ghi đè giữ mặc định SD_FORM_GENERIC_BREAKPOINTS",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-002"
   ],
   "task_refs": []
  },
  {
   "id": "AC-004",
   "type": "acceptance-criterion",
   "statement": "Một field có layout.newRow: true đứng sau field span 4 trong cùng group → Field đó bắt đầu hàng mới dù hàng trước còn chỗ; canvas và renderer xếp giống nhau",
   "behavior": "Một field có layout.newRow: true đứng sau field span 4 trong cùng group",
   "expected_result": "Field đó bắt đầu hàng mới dù hàng trước còn chỗ; canvas và renderer xếp giống nhau",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-002"
   ],
   "task_refs": []
  },
  {
   "id": "AC-005",
   "type": "acceptance-criterion",
   "statement": "Field có rules.visible là Filter { field: agree, operator: EQUAL, data: true }, rules.required dựa trên field khác và rules.disabled dựa trên biến → Ẩn/hiện, bắt buộc và vô hiệu đổi theo giá trị và biến ngay khi chúng thay đổi; field ẩn không bị kiểm tra; Filter ngày tương đối được hỗ trợ",
   "behavior": "Field có rules.visible là Filter { field: agree, operator: EQUAL, data: true }, rules.required dựa trên field khác và rules.disabled dựa trên biến",
   "expected_result": "Ẩn/hiện, bắt buộc và vô hiệu đổi theo giá trị và biến ngay khi chúng thay đổi; field ẩn không bị kiểm tra; Filter ngày tương đối được hỗ trợ",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-003"
   ],
   "task_refs": []
  },
  {
   "id": "AC-006",
   "type": "acceptance-criterion",
   "statement": "Gọi validate() khi có validation cấp form (Filter, alert error và warning) và một validator hàm đăng ký ở portal → Trả { valid, messages: { error[], warning[] } } — không bao giờ undefined; validator hàm nhận giá trị form; lỗi error làm valid = false",
   "behavior": "Gọi validate() khi có validation cấp form (Filter, alert error và warning) và một validator hàm đăng ký ở portal",
   "expected_result": "Trả { valid, messages: { error[], warning[] } } — không bao giờ undefined; validator hàm nhận giá trị form; lỗi error làm valid = false",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-003",
    "R-007"
   ],
   "task_refs": []
  },
  {
   "id": "AC-007",
   "type": "acceptance-criterion",
   "statement": "Nhập giá trị sai cho các preset email, phone (VN và quốc tế), url, integer, decimal, currency, percent và các ràng buộc minLength/maxLength/pattern/maxItems → Mỗi trường báo đúng lỗi như bản hiện tại; password không bao giờ nhận defaultValue và hiển thị mặt nạ khi chỉ xem",
   "behavior": "Nhập giá trị sai cho các preset email, phone (VN và quốc tế), url, integer, decimal, currency, percent và các ràng buộc minLength/maxLength/pattern/maxItems",
   "expected_result": "Mỗi trường báo đúng lỗi như bản hiện tại; password không bao giờ nhận defaultValue và hiển thị mặt nạ khi chỉ xem",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-004"
   ],
   "task_refs": []
  },
  {
   "id": "AC-008",
   "type": "acceptance-criterion",
   "statement": "Select dùng options catalog với params [{ name: provinceId, value: { field: city } }] và fill [{ field: note, from: name }] → load() nhận params đã giải tham chiếu; đổi city thì tải lại danh mục; chọn một mục thì điền note; catalog có search thì tìm theo từ khoá; options static hiển thị items đúng thứ tự",
   "behavior": "Select dùng options catalog với params [{ name: provinceId, value: { field: city } }] và fill [{ field: note, from: name }]",
   "expected_result": "load() nhận params đã giải tham chiếu; đổi city thì tải lại danh mục; chọn một mục thì điền note; catalog có search thì tìm theo từ khoá; options static hiển thị items đúng thứ tự",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-005",
    "R-006"
   ],
   "task_refs": []
  },
  {
   "id": "AC-009",
   "type": "acceptance-criterion",
   "statement": "Truyền [(value)] là object đã deep-freeze cùng schema có defaultValue rồi nhập dữ liệu → Không lỗi, input không bị sửa; valueChange phát object mới; defaultValue chỉ áp cho key chưa có giá trị và không áp ở chế độ chỉ xem",
   "behavior": "Truyền [(value)] là object đã deep-freeze cùng schema có defaultValue rồi nhập dữ liệu",
   "expected_result": "Không lỗi, input không bị sửa; valueChange phát object mới; defaultValue chỉ áp cho key chưa có giá trị và không áp ở chế độ chỉ xem",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-007"
   ],
   "task_refs": []
  },
  {
   "id": "AC-010",
   "type": "acceptance-criterion",
   "statement": "Đặt [breakpoint]=\"mobile\" cho renderer đang rộng 1200px, rồi đặt lại null → Bố cục dùng span mobile khi ép; khi null quay về mức đo theo bề rộng form",
   "behavior": "Đặt [breakpoint]=\"mobile\" cho renderer đang rộng 1200px, rồi đặt lại null",
   "expected_result": "Bố cục dùng span mobile khi ép; khi null quay về mức đo theo bề rộng form",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-007"
   ],
   "task_refs": []
  },
  {
   "id": "AC-011",
   "type": "acceptance-criterion",
   "statement": "Gọi upload() khi field upload có tệp chờ và có params tham chiếu field khác → Các tệp được tải lên với tham số đã giải tham chiếu và value nhận kết quả",
   "behavior": "Gọi upload() khi field upload có tệp chờ và có params tham chiếu field khác",
   "expected_result": "Các tệp được tải lên với tham số đã giải tham chiếu và value nhận kết quả",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-007",
    "R-009"
   ],
   "task_refs": []
  },
  {
   "id": "AC-012",
   "type": "acceptance-criterion",
   "statement": "Trong builder chuyển sang Tablet và kéo resize một field từ 6 xuống 4, rồi xoá giá trị tablet ở inspector → Chỉ span.tablet đổi; desktop/mobile giữ nguyên; mức kế thừa hiện nhãn \"Theo Desktop\"; xoá thì quay về kế thừa",
   "behavior": "Trong builder chuyển sang Tablet và kéo resize một field từ 6 xuống 4, rồi xoá giá trị tablet ở inspector",
   "expected_result": "Chỉ span.tablet đổi; desktop/mobile giữ nguyên; mức kế thừa hiện nhãn \"Theo Desktop\"; xoá thì quay về kế thừa",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-008"
   ],
   "task_refs": []
  },
  {
   "id": "AC-013",
   "type": "acceptance-criterion",
   "statement": "Builder nhận lại đúng schema vừa phát ([(schema)] vòng về) rồi nhận một schema khác nội dung → Vòng về không reset lịch sử undo/selection; schema khác nội dung nạp lại và reset lịch sử",
   "behavior": "Builder nhận lại đúng schema vừa phát ([(schema)] vòng về) rồi nhận một schema khác nội dung",
   "expected_result": "Vòng về không reset lịch sử undo/selection; schema khác nội dung nạp lại và reset lịch sử",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-008"
   ],
   "task_refs": []
  },
  {
   "id": "AC-014",
   "type": "acceptance-criterion",
   "statement": "Bật \"Bắt đầu hàng mới\" ở tab Bố cục của một field và dùng Xem trước ở cả 3 mức → Canvas và Xem trước xếp hàng giống nhau ở từng mức; Xem trước ép đúng mức đang chọn",
   "behavior": "Bật \"Bắt đầu hàng mới\" ở tab Bố cục của một field và dùng Xem trước ở cả 3 mức",
   "expected_result": "Canvas và Xem trước xếp hàng giống nhau ở từng mức; Xem trước ép đúng mức đang chọn",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-008"
   ],
   "task_refs": []
  },
  {
   "id": "AC-015",
   "type": "acceptance-criterion",
   "statement": "Đổi mã một field được tham chiếu trong rules (Filter field và so sánh field–field), options.params, options.fill, upload params, html query và validation cấp form → Mọi tham chiếu có cấu trúc chuyển sang mã mới; tham chiếu trong chuỗi tự do (hyperlink, nội dung HTML) giữ nguyên và được đếm trong câu xác nhận",
   "behavior": "Đổi mã một field được tham chiếu trong rules (Filter field và so sánh field–field), options.params, options.fill, upload params, html query và validation cấp form",
   "expected_result": "Mọi tham chiếu có cấu trúc chuyển sang mã mới; tham chiếu trong chuỗi tự do (hyperlink, nội dung HTML) giữ nguyên và được đếm trong câu xác nhận",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-009"
   ],
   "task_refs": []
  },
  {
   "id": "AC-016",
   "type": "acceptance-criterion",
   "statement": "Gọi SdFormRenderService.viewEntities(schema, entities) → Trả giá trị hiển thị theo từng field (nhãn lựa chọn, ngày, số theo preset) giống bản hiện tại",
   "behavior": "Gọi SdFormRenderService.viewEntities(schema, entities)",
   "expected_result": "Trả giá trị hiển thị theo từng field (nhãn lựa chọn, ngày, số theo preset) giống bản hiện tại",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-009"
   ],
   "task_refs": []
  },
  {
   "id": "AC-017",
   "type": "acceptance-criterion",
   "statement": "Kiểm tra public API và tài liệu sau thay đổi → SdFeelExpression và các export expression cũ không còn; CHANGELOG [Unreleased] có mục BREAKING kèm ví dụ trước/sau; sd-form-generic.md mô tả schema mới",
   "behavior": "Kiểm tra public API và tài liệu sau thay đổi",
   "expected_result": "SdFeelExpression và các export expression cũ không còn; CHANGELOG [Unreleased] có mục BREAKING kèm ví dụ trước/sau; sd-form-generic.md mô tả schema mới",
   "verification_kind": "manual",
   "blocking": true,
   "requirement_refs": [
    "R-010"
   ],
   "task_refs": []
  },
  {
   "id": "AC-018",
   "type": "acceptance-criterion",
   "statement": "Chạy full suite v19 có coverage, lint, check:i18n, check:i18n-parity, check:scss-hex, rồi npm run sync và check:sync → Tất cả xanh; v22 giữ LF",
   "behavior": "Chạy full suite v19 có coverage, lint, check:i18n, check:i18n-parity, check:scss-hex, rồi npm run sync và check:sync",
   "expected_result": "Tất cả xanh; v22 giữ LF",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-011"
   ],
   "task_refs": []
  },
  {
   "id": "AC-019",
   "type": "acceptance-criterion",
   "statement": "Chụp ảnh thật builder ở Desktop/Tablet/Mobile và renderer ở 3 bề rộng form → Ảnh cho thấy span theo mức, nhãn kế thừa, newRow và không có lỗi console",
   "behavior": "Chụp ảnh thật builder ở Desktop/Tablet/Mobile và renderer ở 3 bề rộng form",
   "expected_result": "Ảnh cho thấy span theo mức, nhãn kế thừa, newRow và không có lỗi console",
   "verification_kind": "manual",
   "blocking": true,
   "requirement_refs": [
    "R-008",
    "R-011"
   ],
   "task_refs": []
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
   "impacted_refs": [
    "R-001",
    "R-010"
   ]
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
   "impacted_refs": [
    "R-003"
   ]
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
   "impacted_refs": [
    "R-008"
   ]
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
   "impacted_refs": [
    "R-001",
    "R-009"
   ]
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
   "impacted_refs": [
    "R-003",
    "R-009"
   ]
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
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-001",
    "R-010",
    "AC-001",
    "AC-017"
   ],
   "task_refs": []
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
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-001",
    "AC-001"
   ],
   "task_refs": []
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
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-002",
    "AC-002",
    "AC-003",
    "AC-004",
    "AC-010"
   ],
   "task_refs": []
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
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-003",
    "AC-005",
    "AC-006"
   ],
   "task_refs": []
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
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-005",
    "AC-008"
   ],
   "task_refs": []
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
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-006",
    "AC-003",
    "AC-008"
   ],
   "task_refs": []
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
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-007",
    "R-008",
    "AC-009",
    "AC-010",
    "AC-013"
   ],
   "task_refs": []
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
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-009",
    "R-010",
    "AC-015",
    "AC-016",
    "AC-017"
   ],
   "task_refs": []
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
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-001",
    "R-002"
   ],
   "task_refs": []
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
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-001",
    "R-010",
    "R-011"
   ],
   "task_refs": []
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
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-011",
    "AC-018",
    "AC-019"
   ],
   "task_refs": []
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
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-001",
    "AC-001"
   ],
   "task_refs": []
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
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-001",
    "AC-001"
   ],
   "task_refs": []
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
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-007",
    "AC-006"
   ],
   "task_refs": []
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
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-001",
    "R-009"
   ],
   "task_refs": []
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
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-007"
   ],
   "task_refs": []
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
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-001",
    "AC-001"
   ],
   "task_refs": []
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
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-002",
    "R-003",
    "AC-002",
    "AC-004",
    "AC-005",
    "AC-015"
   ],
   "task_refs": []
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
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-005",
    "AC-008"
   ],
   "task_refs": []
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
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-007",
    "AC-006",
    "AC-009"
   ],
   "task_refs": []
  },
  {
   "id": "INV-001",
   "type": "invariant",
   "statement": "sd-form-render không bao giờ mutate schema, value hay variables được truyền vào; sd-form-builder không bao giờ mutate schema được truyền vào; mọi lần phát là object mới.",
   "protected_refs": [
    "R-007",
    "R-008",
    "AC-009",
    "AC-013"
   ],
   "task_refs": [],
   "evidence_refs": []
  },
  {
   "id": "INV-002",
   "type": "invariant",
   "statement": "Chọn mức breakpoint, kế thừa span và xếp hàng (kể cả newRow) do một module layout thuần duy nhất đảm nhận; canvas và renderer cho cùng input + cùng mức luôn ra cùng các hàng.",
   "protected_refs": [
    "R-002",
    "AC-002",
    "AC-003",
    "AC-004",
    "AC-010",
    "AC-014"
   ],
   "task_refs": [],
   "evidence_refs": []
  },
  {
   "id": "INV-003",
   "type": "invariant",
   "statement": "Mọi điều kiện (rules) và validation cấp form dạng biểu thức đều là Filter, đánh giá bởi một evaluator duy nhất bọc FilterUtilities.evaluate trên { ...value, ...variables }; không còn định dạng biểu thức nào khác trong schema hay runtime.",
   "protected_refs": [
    "R-003",
    "AC-005",
    "AC-006"
   ],
   "task_refs": [],
   "evidence_refs": []
  },
  {
   "id": "INV-004",
   "type": "invariant",
   "statement": "Schema luôn đúng ngữ pháp: pages → (group | element), group chỉ chứa element, không có break, không có schemaVersion, key field duy nhất (kể cả so với biến); mọi lệnh của builder chỉ tạo ra schema hợp lệ.",
   "protected_refs": [
    "R-001",
    "AC-001"
   ],
   "task_refs": [],
   "evidence_refs": []
  },
  {
   "id": "INV-005",
   "type": "invariant",
   "statement": "Mọi tham chiếu tới key field hoặc biến trong schema đều có cấu trúc (Filter.field và so sánh field–field, SdFormGenericValueRef, fill.field); chuỗi tự do chỉ còn ở hyperlink và nội dung html.",
   "protected_refs": [
    "R-005",
    "R-009",
    "AC-008",
    "AC-015"
   ],
   "task_refs": [],
   "evidence_refs": []
  },
  {
   "id": "INV-006",
   "type": "invariant",
   "statement": "Thêm type phần tử mới (đợt 2/3) không đổi shape của type đã có; phần tử có type lạ được renderer bỏ qua và được builder giữ nguyên khi phát lại.",
   "protected_refs": [
    "R-001",
    "AC-001"
   ],
   "task_refs": [],
   "evidence_refs": []
  },
  {
   "id": "INV-007",
   "type": "invariant",
   "statement": "Chỉ sửa code ở versions/v19; v20/v21/v22 chỉ đổi qua npm run sync và check:sync luôn qua; v22 giữ LF.",
   "protected_refs": [
    "R-011",
    "AC-018"
   ],
   "task_refs": [],
   "evidence_refs": []
  },
  {
   "id": "INV-008",
   "type": "invariant",
   "statement": "Public API của entry form-generic đúng bằng danh sách hợp đồng C-001…C-006; mọi export cũ bị bỏ đều được liệt kê trong mục BREAKING của CHANGELOG.",
   "protected_refs": [
    "R-010",
    "AC-017"
   ],
   "task_refs": [],
   "evidence_refs": []
  },
  {
   "id": "INV-009",
   "type": "invariant",
   "statement": "Component không tự gọi HTTP; dữ liệu của portal chỉ đi qua callback trong provideSdFormGeneric (catalog.load/search, htmlDefinitions, validators, templates).",
   "protected_refs": [
    "R-005",
    "R-006",
    "AC-008"
   ],
   "task_refs": [],
   "evidence_refs": []
  }
 ],
 "history": [
  {
   "revision": 1,
   "active": [
    {
     "id": "R-001",
     "type": "requirement"
    },
    {
     "id": "R-002",
     "type": "requirement"
    },
    {
     "id": "R-003",
     "type": "requirement"
    },
    {
     "id": "R-004",
     "type": "requirement"
    },
    {
     "id": "R-005",
     "type": "requirement"
    },
    {
     "id": "R-006",
     "type": "requirement"
    },
    {
     "id": "R-007",
     "type": "requirement"
    },
    {
     "id": "R-008",
     "type": "requirement"
    },
    {
     "id": "R-009",
     "type": "requirement"
    },
    {
     "id": "R-010",
     "type": "requirement"
    },
    {
     "id": "R-011",
     "type": "requirement"
    },
    {
     "id": "AC-001",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-002",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-003",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-004",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-005",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-006",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-007",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-008",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-009",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-010",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-011",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-012",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-013",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-014",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-015",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-016",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-017",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-018",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-019",
     "type": "acceptance-criterion"
    },
    {
     "id": "A-001",
     "type": "assumption"
    },
    {
     "id": "A-002",
     "type": "assumption"
    },
    {
     "id": "A-003",
     "type": "assumption"
    },
    {
     "id": "A-004",
     "type": "assumption"
    },
    {
     "id": "A-005",
     "type": "assumption"
    },
    {
     "id": "D-001",
     "type": "decision"
    },
    {
     "id": "D-002",
     "type": "decision"
    },
    {
     "id": "D-003",
     "type": "decision"
    },
    {
     "id": "D-004",
     "type": "decision"
    },
    {
     "id": "D-005",
     "type": "decision"
    },
    {
     "id": "D-006",
     "type": "decision"
    },
    {
     "id": "D-007",
     "type": "decision"
    },
    {
     "id": "D-008",
     "type": "decision"
    },
    {
     "id": "D-009",
     "type": "decision"
    },
    {
     "id": "D-010",
     "type": "decision"
    },
    {
     "id": "D-011",
     "type": "decision"
    },
    {
     "id": "D-012",
     "type": "decision"
    },
    {
     "id": "D-013",
     "type": "decision"
    },
    {
     "id": "D-014",
     "type": "decision"
    },
    {
     "id": "D-015",
     "type": "decision"
    },
    {
     "id": "D-016",
     "type": "decision"
    }
   ],
   "tombstones": []
  },
  {
   "revision": 2,
   "active": [
    {
     "id": "R-001",
     "type": "requirement"
    },
    {
     "id": "R-002",
     "type": "requirement"
    },
    {
     "id": "R-003",
     "type": "requirement"
    },
    {
     "id": "R-004",
     "type": "requirement"
    },
    {
     "id": "R-005",
     "type": "requirement"
    },
    {
     "id": "R-006",
     "type": "requirement"
    },
    {
     "id": "R-007",
     "type": "requirement"
    },
    {
     "id": "R-008",
     "type": "requirement"
    },
    {
     "id": "R-009",
     "type": "requirement"
    },
    {
     "id": "R-010",
     "type": "requirement"
    },
    {
     "id": "R-011",
     "type": "requirement"
    },
    {
     "id": "AC-001",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-002",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-003",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-004",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-005",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-006",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-007",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-008",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-009",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-010",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-011",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-012",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-013",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-014",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-015",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-016",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-017",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-018",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-019",
     "type": "acceptance-criterion"
    },
    {
     "id": "A-001",
     "type": "assumption"
    },
    {
     "id": "A-002",
     "type": "assumption"
    },
    {
     "id": "A-003",
     "type": "assumption"
    },
    {
     "id": "A-004",
     "type": "assumption"
    },
    {
     "id": "A-005",
     "type": "assumption"
    },
    {
     "id": "D-001",
     "type": "decision"
    },
    {
     "id": "D-002",
     "type": "decision"
    },
    {
     "id": "D-003",
     "type": "decision"
    },
    {
     "id": "D-004",
     "type": "decision"
    },
    {
     "id": "D-005",
     "type": "decision"
    },
    {
     "id": "D-006",
     "type": "decision"
    },
    {
     "id": "D-007",
     "type": "decision"
    },
    {
     "id": "D-008",
     "type": "decision"
    },
    {
     "id": "D-009",
     "type": "decision"
    },
    {
     "id": "D-010",
     "type": "decision"
    },
    {
     "id": "D-011",
     "type": "decision"
    },
    {
     "id": "D-012",
     "type": "decision"
    },
    {
     "id": "D-013",
     "type": "decision"
    },
    {
     "id": "D-014",
     "type": "decision"
    },
    {
     "id": "D-015",
     "type": "decision"
    },
    {
     "id": "D-016",
     "type": "decision"
    },
    {
     "id": "D-017",
     "type": "decision"
    },
    {
     "id": "D-018",
     "type": "decision"
    },
    {
     "id": "D-019",
     "type": "decision"
    },
    {
     "id": "D-020",
     "type": "decision"
    },
    {
     "id": "INV-001",
     "type": "invariant"
    },
    {
     "id": "INV-002",
     "type": "invariant"
    },
    {
     "id": "INV-003",
     "type": "invariant"
    },
    {
     "id": "INV-004",
     "type": "invariant"
    },
    {
     "id": "INV-005",
     "type": "invariant"
    },
    {
     "id": "INV-006",
     "type": "invariant"
    },
    {
     "id": "INV-007",
     "type": "invariant"
    },
    {
     "id": "INV-008",
     "type": "invariant"
    },
    {
     "id": "INV-009",
     "type": "invariant"
    }
   ],
   "tombstones": []
  }
 ]
}
```

</details>

## Decisions captured during review

- Người dùng duyệt bản nháp trực tiếp, không qua lượt review riêng (lượt review bị dừng theo yêu cầu người dùng). Nội dung duyệt đúng như bản nháp.

## Skill provenance

sdcorejs-architecture (approved on attempt 1 / 3)
