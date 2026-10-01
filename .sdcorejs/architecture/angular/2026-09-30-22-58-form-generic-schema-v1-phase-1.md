---
{
  "approval_source": "explicit-user-choice",
  "approved_at": "2026-09-30T16:33:46.821Z",
  "approved_by": "user",
  "artifact_id": "architecture-form-generic-schema-v1-r2",
  "artifact_kind": "architecture",
  "change_control": {
    "change_reason": "Spec r2 (D-024) bỏ bằng chứng thủ công: thêm INV-010/D-025/B-005/VAL-010 bảo vệ R-004, AC-007, AC-016; AC-012 và AC-019 vào phạm vi INV-002; VAL-005 phủ AC-011; VAL-007/VAL-008 kiểm bằng lệnh tự động; presets vào B-002 và hướng phụ thuộc.",
    "revision": 2,
    "supersedes": "architecture-form-generic-schema-v1-r1"
  },
  "change_ref": "form-generic-schema-v1",
  "commit_policy": "with-change",
  "contract_id": "form-generic-schema-v1",
  "description": "Form generic schema v1 phase 1 architecture, revision 2: adds INV-010 (single preset/default/format source for renderer and viewEntities), extends INV-002 to AC-012/AC-019 and makes every validation obligation automated (D-024).",
  "execution_host_repository_id": "sdcorejs-angular",
  "integration_owner_repository_id": "sdcorejs-angular",
  "name": "form-generic-schema-v1-phase-1-architecture",
  "owner": "sdcorejs-architecture",
  "owner_module_id": "components/form-generic",
  "owner_repository_id": "sdcorejs-angular",
  "owner_repository_role": "library",
  "parent_references": [
    {
      "approval_hash": "sha256:v1:42d57af36dde2fd7d079ce0b87a840c1ff7210d054e5a1c452d4ae20a6aad6c2",
      "artifact_id": "spec-form-generic-schema-v1-r2",
      "artifact_kind": "spec",
      "repository_id": "sdcorejs-angular",
      "revision": "b5c2e44564cce06d072ed153536ecb6a8dd11e2a"
    }
  ],
  "parent_repository_id": "sdcorejs-angular",
  "repository_relative_path": ".sdcorejs/architecture/angular/2026-09-30-22-58-form-generic-schema-v1-phase-1.md",
  "requirement_id": "R-001",
  "schema_version": 1,
  "sourceDraftPath": ".sdcorejs/docs/architecture/2026-09-30-22-58-form-generic-schema-v1-phase-1-architecture.md",
  "source_plan": "none",
  "source_revision": "b5c2e44564cce06d072ed153536ecb6a8dd11e2a",
  "source_spec": ".sdcorejs/specs/angular/2026-09-30-22-46-form-generic-schema-v1-phase-1.md",
  "stack_profile": "core-ui-angular",
  "supersedes": "architecture-form-generic-schema-v1-r1",
  "target_root_kind": "target-project",
  "track": "angular",
  "approval_hash": "sha256:v1:314e142f9c9b1639f8a29e1d2bdf883ded07c3589dd825baccfd384d0b373523"
}
---

# Architecture — Form generic schema v1, Đợt 1: nền (bản sửa 2) - Approved Architecture

> Snapshot of what the user approved at the `sdcorejs-architecture` gate. Do not edit by hand; re-author through `sdcorejs-architecture` if the contract changes.

## Approved contract

# Architecture — Form generic schema v1, Đợt 1: nền (bản sửa 2)

- **Nguồn:** spec đã duyệt `spec-form-generic-schema-v1-r2` (`sha256:v1:42d57af3…`).
- **Thay thế:** `architecture-form-generic-schema-v1-r1` (`sha256:v1:db91ad78…`).
- **Trạng thái:** bản nháp, chưa duyệt. Chỉ ghi các quyết định mà nhiều đơn vị làm độc lập (Đợt 1, 2, 3) phải hiểu giống nhau; thứ tự file và task thuộc về plan.

## Thay đổi so với bản 1

- **INV-010 (mới)** — Trong renderer và SdFormRenderService.viewEntities: kiểm tra preset text (email, phone VN/quốc tế, url) và number (integer, decimal, currency, percent) cùng tính hợp lệ của pattern chỉ đến từ presets/form-generic-presets.ts; mặc định field (password không nhận defaultValue) chỉ ở rules/form-generic-values.ts; định dạng hiển thị giá trị (số theo preset, ngày, mặt nạ password) chỉ ở rules/form-generic-display.ts; ràng buộc min/max/minLength/maxLength/pattern/maxItems chuyển nguyên cho control Core, form-generic không kiểm lại. Bảo vệ R-004, AC-007, AC-016. Quyết định kèm theo: **D-025**. Ranh giới mới **B-005**, nghĩa vụ kiểm chứng mới **VAL-010** (test hành vi + lệnh kiểm cấu trúc).
- **INV-002** thêm AC-012 (bản 1 bỏ sót dù VAL-002 đã phủ) và AC-019 vào phạm vi bảo vệ; **VAL-002** thêm test DOM ở 3 mức và test demo showcase không lỗi console.
- **VAL-005** phủ thêm AC-011 (upload() giải tham chiếu params) — bản 1 không có nghĩa vụ nào cho AC-011.
- **INV-008**, **VAL-007**, **VAL-008**: bỏ review thủ công, kiểm bằng lệnh tự động (D-024); plan ghi lệnh chính xác.
- **B-002** thêm `presets` vào lõi TypeScript thuần; thêm hướng phụ thuộc `presets` → models, rules/form-generic-display, @sdcorejs/utils.
- Quyết định đã áp dụng: bỏ D-011 (đã bị thay), thêm D-024 (spec r2) và D-025.
- Các invariant INV-001, INV-003…INV-009, hợp đồng public C-001…C-006, ranh giới B-001, B-003, B-004 và nơi sở hữu state giữ nguyên như bản 1.

## Trigger và owner

- Gate: **required**. Signals: `persisted-data-model-contract`, `public-api-contract`, `state-data-ownership`.
- Owner: `sdcorejs-angular` (library), module `components/form-generic`. Integration owner là chính thư viện; execution host cũng là thư viện.
- Không có tích hợp cross-repository. Resolver owner được gọi bằng repository id vì repo là library đứng riêng.

## Invariants

| ID | Điều phải luôn đúng | Cách chứng minh |
| --- | --- | --- |
| INV-001 | sd-form-render không bao giờ mutate schema, value hay variables được truyền vào; sd-form-builder không bao giờ mutate schema được truyền vào; mọi lần phát là object mới. | Test truyền input đã deep-freeze cho renderer và builder, thao tác người dùng, kiểm tra không lỗi và mỗi lần phát là tham chiếu mới. |
| INV-002 | Chọn mức breakpoint, kế thừa span và xếp hàng (kể cả newRow) do một module layout thuần duy nhất đảm nhận; canvas và renderer cho cùng input + cùng mức luôn ra cùng các hàng. | Test đơn vị layout cho 3 mức, kế thừa và newRow; test so sánh hàng của canvas và renderer trên cùng schema; test DOM tự động của builder ở Desktop/Tablet/Mobile và renderer ở 3 bề rộng form (AC-019). |
| INV-003 | Mọi điều kiện (rules) và validation cấp form dạng biểu thức đều là Filter, đánh giá bởi một evaluator duy nhất bọc FilterUtilities.evaluate trên { ...value, ...variables }; không còn định dạng biểu thức nào khác trong schema hay runtime. | Ma trận test từng toán tử (so sánh, like, IN, BETWEEN, NULL, ngày tương đối, field–field) và test rules/validate() của renderer. |
| INV-004 | Schema luôn đúng ngữ pháp: pages → (group \| element), group chỉ chứa element, không có break, không có schemaVersion, key field duy nhất (kể cả so với biến); mọi lệnh của builder chỉ tạo ra schema hợp lệ. | Test normalize/validate từ chối group lồng, break, schemaVersion, key trùng; test lệnh builder (thêm, kéo-thả, nhân bản, đổi mã) luôn trả schema hợp lệ. |
| INV-005 | Mọi tham chiếu tới key field hoặc biến trong schema đều có cấu trúc (Filter.field và so sánh field–field, SdFormGenericValueRef, fill.field); chuỗi tự do chỉ còn ở hyperlink và nội dung html. | Test đổi mã cập nhật đủ mọi vị trí có cấu trúc và đếm đúng tham chiếu trong chuỗi tự do. |
| INV-006 | Thêm type phần tử mới (đợt 2/3) không đổi shape của type đã có; phần tử có type lạ được renderer bỏ qua và được builder giữ nguyên khi phát lại. | Test nạp schema có phần tử type lạ: renderer không lỗi và bỏ qua; builder phát lại phần tử đó y nguyên. |
| INV-007 | Chỉ sửa code ở versions/v19; v20/v21/v22 chỉ đổi qua npm run sync và check:sync luôn qua; v22 giữ LF. | npm run check:sync xanh; git ls-files --eol không còn file CRLF trong v22. |
| INV-008 | Public API của entry form-generic đúng bằng danh sách hợp đồng C-001…C-006; mọi export cũ bị bỏ đều được liệt kê trong mục BREAKING của CHANGELOG. | Test liệt kê export của entry point so với danh sách hợp đồng; lệnh tự động kiểm CHANGELOG [Unreleased] nhắc mọi export đã bỏ và sd-form-generic.md nhắc mọi export runtime (D-024). |
| INV-009 | Component không tự gọi HTTP; dữ liệu của portal chỉ đi qua callback trong provideSdFormGeneric (catalog.load/search, htmlDefinitions, validators, templates). | Test renderer/builder với provider giả kiểm tra params, fill, search; không có HttpClient trong form-generic. |
| INV-010 | Trong renderer và SdFormRenderService.viewEntities: kiểm tra preset text (email, phone VN/quốc tế, url) và number (integer, decimal, currency, percent) cùng tính hợp lệ của pattern chỉ đến từ presets/form-generic-presets.ts; mặc định field (password không nhận defaultValue) chỉ ở rules/form-generic-values.ts; định dạng hiển thị giá trị (số theo preset, ngày, mặt nạ password) chỉ ở rules/form-generic-display.ts; ràng buộc min/max/minLength/maxLength/pattern/maxItems chuyển nguyên cho control Core, form-generic không kiểm lại. | Test từng preset (email, phone VN/quốc tế, url, integer, decimal, currency, percent) và việc chuyển ràng buộc cho control Core; test password không nhận defaultValue và hiện mặt nạ khi chỉ xem; test viewEntities định dạng số, ngày và mặt nạ qua cùng các hàm; lệnh kiểm cấu trúc tự động: không có regex, Intl.NumberFormat, toFixed, định dạng ngày hay ký tự mặt nạ trong components/form-render/**, pipes/**, services/** (trừ spec). |

## Hợp đồng public

| ID | Loại | Hợp đồng | Tương thích |
| --- | --- | --- | --- |
| C-001 | persisted-data-model | SdFormGenericSchema JSON: pages, group, field, layout, rules, validation, options, variables, validations; đợt 2/3 thêm type theo D-017. | Phiên bản đầu tiên; không tương thích SdFormGeneric cũ (D-001). |
| C-002 | api | sd-form-render: [schema], [(value)], [form], [variables], [viewed], [breakpoint], [labelPlacement], [keys], (sdAction); validate(), upload(); submit()/reset() từ đợt 2. | BREAKING: thay [configuration], [entity], [defaultEntity], [properties], setVariables, getValidationMessages(). |
| C-003 | api | sd-form-builder: [(schema)], getSchema(). | BREAKING: thay [formGeneric], (sdChange), getForm(), accessor components/variables/validations. |
| C-004 | api | provideSdFormGeneric({ catalogs, templates, htmlDefinitions, validators, breakpoints }), các interface catalog/template/htmlDefinition/validator, SD_FORM_GENERIC_BREAKPOINTS, SdFormGenericBreakpoint. | BREAKING: thay SD_FORM_GENERIC_CONFIGURATION.form (selections, getValues, getLazyValues, tables, htmls, validation). |
| C-005 | api | SdFormRenderService.viewEntities(schema, entities). | Đổi kiểu tham số sang SdFormGenericSchema. |
| C-006 | api | Bỏ SdFeelExpression, model expression cũ (SdFormGenericExpression*, sdEvaluateExpression, sdExpressionToJavascriptExpression, sdTemplateToCondition, SD_ATTRIBUTE_OPERATORS, SD_DAY_INFO_*), SdFormGenericBreak, SD_FORM_BUILDER_COMPONENTS, SD_COMPONENT_ICONS, SD_TABLE_COLUMN_TYPES và các helper attribute cũ. | BREAKING: gỡ khỏi public API. |

## Quyết định kiến trúc

- **D-017** — Mở rộng union phần tử ở đợt 2/3 thế nào, và code gặp type lạ thì xử lý ra sao? Thêm thành viên mới vào union SdFormGenericElement (và giá trị navigation) mà không đổi shape thành viên cũ. Renderer bỏ qua type lạ (cảnh báo khi dev mode); builder giữ nguyên phần tử lạ khi nạp → phát (round-trip) và hiện thẻ "chưa hỗ trợ". _Lý do:_ Các đợt sau là các đơn vị làm độc lập; luật mở rộng phải cố định trước để không phá schema đợt 1.
- **D-018** — Tách lõi thuần TS ở đâu? models (type + normalize/validate grammar), layout (breakpoint, kế thừa span, xếp hàng) và rules (đánh giá Filter, duyệt/đổi tham chiếu) là TypeScript thuần — không DI, không DOM; renderer và builder chỉ phụ thuộc chiều vào chúng. _Lý do:_ Canvas và renderer phải xếp giống nhau; logic cần TDD nhanh, không cần TestBed.
- **D-019** — Item của catalog và bộ nhớ đệm? Catalog trả SdFormGenericCatalogItem = SdFormGenericOption & { data?: Record<string, unknown> }; fill đọc item.data[from]. Kết quả load được đệm theo từng instance renderer, khoá bằng catalog id + params đã giải; không dùng bộ đệm toàn cục. _Lý do:_ Hai form cùng trang không được dùng lẫn dữ liệu; fill cần dữ liệu ngoài value/label.
- **D-020** — Ngữ nghĩa value và validate()? value chỉ gồm key của field (không có phần tử tĩnh/nút), giữ giá trị của field đang ẩn; valueChange phát object mới sau mỗi thay đổi control (không debounce). validate() đánh dấu mọi control đã chạm, chạy validator của field rồi validations cấp form, trả { valid, messages: { error, warning } }; chỉ error làm valid = false. _Lý do:_ Consumer và các đợt sau phải hiểu value và validate() giống nhau.
- **D-025** — Kiểm tra preset, mặc định và định dạng giá trị của field ở renderer và viewEntities nằm ở đâu? Một nguồn cho mỗi việc: presets/form-generic-presets.ts (kiểm tra preset text/number, pattern hợp lệ), rules/form-generic-values.ts (mặc định field, password không nhận defaultValue), rules/form-generic-display.ts (định dạng số, ngày, mặt nạ password); ràng buộc min/max/minLength/maxLength/pattern/maxItems chuyển nguyên cho control Core. Builder (inspector, xem trước) ngoài phạm vi của đợt này. _Lý do:_ R-004 giữ nguyên kiểm tra của preset; renderer và viewEntities phải báo cùng một lỗi và hiển thị cùng một định dạng. Review r2 thấy builder còn tự khai mặt nạ password, độ chính xác và đơn vị tiền mặc định; việc gom builder về cùng nguồn để sau.

Các quyết định từ spec r2 (D-001…D-016 trừ D-011 đã bị thay, và D-024) được giữ nguyên và tính là đã áp dụng.

## Ranh giới, phụ thuộc, nơi sở hữu state

**Ranh giới:**
- B-001: Chỉ sửa code ở versions/v19; v20–v22 qua npm run sync.
- B-002: models, layout, rules, presets là TypeScript thuần (không DI, không DOM, không import từ components).
- B-003: form-render không import form-builder; form-builder chỉ dùng form-render cho Xem trước.
- B-004: Dữ liệu của portal chỉ vào qua provideSdFormGeneric; không HttpClient trong form-generic.
- B-005: Trong renderer và viewEntities: kiểm tra preset chỉ ở presets/form-generic-presets.ts, mặc định field chỉ ở rules/form-generic-values.ts, định dạng hiển thị chỉ ở rules/form-generic-display.ts; component, pipe và service chỉ gọi các hàm này.

**Hướng phụ thuộc:**
- `components/form-builder` → components/form-render (Xem trước), models, layout, rules, sd-query-builder, các control Core. Builder dựng trên lõi thuần và dùng renderer thật để xem trước.
- `components/form-render` → models, layout, rules, FormGenericService, các control Core. Renderer không biết builder.
- `rules` → @sdcorejs/utils FilterUtilities. Một evaluator Filter duy nhất.
- `models` → @sdcorejs/utils (chỉ type Filter). Schema tham chiếu type Filter, không kéo runtime.
- `presets` → models (type), rules/form-generic-display, @sdcorejs/utils. Preset là lõi thuần: renderer và service phụ thuộc vào nó, nó không phụ thuộc vào component.

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
| VAL-002 | Test đơn vị layout 3 mức, kế thừa span, newRow, ghi đè breakpoint, ép mức; test so sánh hàng canvas với renderer; test DOM tự động của builder ở 3 chế độ và renderer ở 3 bề rộng, cùng test demo showcase không có lỗi console (AC-019). | INV-002 | AC-002, AC-003, AC-004, AC-010, AC-012, AC-014, AC-019 |
| VAL-003 | Ma trận toán tử Filter và test rules/validate() của renderer, kể cả biến và ngày tương đối. | INV-003 | AC-005, AC-006 |
| VAL-004 | Test normalize/validate từ chối group lồng, break, schemaVersion, key trùng; test lệnh builder luôn trả schema hợp lệ. | INV-004 | AC-001 |
| VAL-005 | Test đổi mã cập nhật mọi tham chiếu có cấu trúc và đếm tham chiếu chuỗi tự do; upload() gửi params đã giải tham chiếu (AC-011). | INV-005 | AC-015, AC-011 |
| VAL-006 | Test phần tử type lạ: renderer bỏ qua không lỗi; builder phát lại y nguyên. | INV-006 | AC-001 |
| VAL-007 | npm run check:sync xanh; lệnh tự động (git ls-files trên versions/v22, plan ghi lệnh chính xác) xác nhận không còn file CRLF. | INV-007 | AC-018 |
| VAL-008 | Test danh sách export của entry form-generic khớp C-001…C-006; lệnh tự động (plan ghi lệnh chính xác) kiểm CHANGELOG [Unreleased] liệt kê export đã bỏ và sd-form-generic.md nhắc mọi export runtime. | INV-008 | AC-017 |
| VAL-009 | Test renderer với provider giả: params đã giải, tải lại khi field nguồn đổi, fill, search; không có HttpClient trong module. | INV-009 | AC-008 |
| VAL-010 | Test preset và việc chuyển ràng buộc cho control Core; test password không nhận defaultValue và hiện mặt nạ khi chỉ xem; test viewEntities định dạng qua cùng các hàm; lệnh kiểm cấu trúc tự động (plan ghi lệnh chính xác) trên components/form-render/**, pipes/**, services/**. | INV-010 | AC-007, AC-016 |

Mọi nghĩa vụ đều chứng minh bằng test hoặc lệnh tự động; không còn bằng chứng thủ công (D-024).

## Profile frontend, giả định, quyết định hoãn

- `frontend_architecture_ref`: trỏ tới `plan_context.frontend_architecture`, conformance INV-001, INV-002, INV-004, INV-006, INV-010.
- Giả định được tham chiếu: A-002, A-003, A-005.
- Quyết định hoãn: không có.
- Decision coverage: revision 5 (thêm D-025, INV-010 và AC-019 vào phạm vi INV-002, trên revision 4 của spec r2).

## Review kiến trúc

Lượt review riêng, chỉ đọc (subagent, trên bản nháp đầu của bản sửa 2): **CHANGES REQUIRED**, không có BLOCKER. Đã xử lý như sau:

1. MAJOR — INV-010 bản nháp đầu không đúng với code: builder tự khai mặt nạ password (`canvas/field-preview.component.html:99`), độ chính xác mặc định (`inspector.component.html:283`, `?? 3`), đơn vị tiền `VND` và khoảng độ chính xác 0–10. → Thu hẹp INV-010/D-025/B-005 về renderer và viewEntities (phạm vi review xác nhận đúng); gom builder về cùng nguồn để sau.
2. MAJOR — VAL-010 chỉ có test hành vi nên không bắt được việc định nghĩa lại. → VAL-010 thêm lệnh kiểm cấu trúc tự động trên components/form-render/**, pipes/**, services/**.
3. MAJOR — INV-010 nói quá: mặc định password nằm ở rules/form-generic-values.ts; min/max/minLength/maxLength/pattern/maxItems do control Core kiểm. → Câu chữ INV-010 nêu đúng 3 nguồn và việc chuyển nguyên ràng buộc cho control Core.
4. MINOR — định dạng ngày của viewEntities nằm ở rules/form-generic-display.ts → giữ "ngày" trong INV-010.
5. MINOR — AC-019 phần "demo showcase không lỗi console" chưa có nghĩa vụ → thêm vào VAL-002.
6. MINOR — INV-002 thiếu AC-012; AC-011 không có nghĩa vụ → thêm AC-012 vào INV-002, AC-011 vào VAL-005. Không thêm R-008 vào protected_refs của INV-002/INV-004: requirement_refs là yêu cầu làm nên invariant, protected_refs là record mà validation phải chứng minh; thêm R-008 sẽ ép AC-013 (vòng về/undo) vào INV-002 không đúng nghĩa.
7. MINOR — `presets` chưa có trong B-002 và hướng phụ thuộc → đã thêm.
8. MINOR — D-021 (plan r2) còn nhắc ảnh chụp thủ công → plan r3 sẽ thay D-021.
9. MINOR — sổ sách: context và artifact dùng artifact id cho supersedes (validateArchitectureRevision yêu cầu), frontmatter có thêm `supersedes_path`; thêm change_reason; VAL-007/VAL-008 ghi rõ lệnh do plan chốt.
10. INFO — thay đổi r1→r2 chỉ gồm các mục đã khai; bảng INV-004 bị vỡ vì ký tự `|` → đã escape.

## Appendix — architecture_context (machine-readable)

Đã kiểm bằng `validateArchitectureContext` với decision coverage revision 5. Hash của snapshot đã duyệt được điền sau khi bạn duyệt.

<details><summary>architecture_context JSON</summary>

```json
{
 "schema_version": 1,
 "source": "sdcorejs-architecture",
 "contract_id": "form-generic-schema-v1",
 "requirement_id": "R-001",
 "approved_spec_reference": {
  "repository_id": "sdcorejs-angular",
  "artifact_id": "spec-form-generic-schema-v1-r2",
  "artifact_kind": "spec",
  "revision": "b5c2e44564cce06d072ed153536ecb6a8dd11e2a",
  "approval_hash": "sha256:v1:42d57af36dde2fd7d079ce0b87a840c1ff7210d054e5a1c452d4ae20a6aad6c2"
 },
 "approved_architecture_path": ".sdcorejs/architecture/angular/2026-09-30-22-58-form-generic-schema-v1-phase-1.md",
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
   "verification_method": "Test đơn vị layout cho 3 mức, kế thừa và newRow; test so sánh hàng của canvas và renderer trên cùng schema; test DOM tự động của builder ở Desktop/Tablet/Mobile và renderer ở 3 bề rộng form (AC-019).",
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
   "verification_method": "Test liệt kê export của entry point so với danh sách hợp đồng; lệnh tự động kiểm CHANGELOG [Unreleased] nhắc mọi export đã bỏ và sd-form-generic.md nhắc mọi export runtime (D-024).",
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
  },
  {
   "id": "INV-010",
   "statement": "Trong renderer và SdFormRenderService.viewEntities: kiểm tra preset text (email, phone VN/quốc tế, url) và number (integer, decimal, currency, percent) cùng tính hợp lệ của pattern chỉ đến từ presets/form-generic-presets.ts; mặc định field (password không nhận defaultValue) chỉ ở rules/form-generic-values.ts; định dạng hiển thị giá trị (số theo preset, ngày, mặt nạ password) chỉ ở rules/form-generic-display.ts; ràng buộc min/max/minLength/maxLength/pattern/maxItems chuyển nguyên cho control Core, form-generic không kiểm lại.",
   "scope": "presets, rules/form-generic-values, rules/form-generic-display, components/form-render/**, pipes/**, services/** (builder ngoài phạm vi)",
   "rationale": "Một nguồn cho kiểm tra, mặc định và định dạng giúp renderer và viewEntities luôn khớp nhau (R-004, D-025).",
   "verification_method": "Test từng preset (email, phone VN/quốc tế, url, integer, decimal, currency, percent) và việc chuyển ràng buộc cho control Core; test password không nhận defaultValue và hiện mặt nạ khi chỉ xem; test viewEntities định dạng số, ngày và mặt nạ qua cùng các hàm; lệnh kiểm cấu trúc tự động: không có regex, Intl.NumberFormat, toFixed, định dạng ngày hay ký tự mặt nạ trong components/form-render/**, pipes/**, services/** (trừ spec).",
   "requirement_refs": [
    "R-004"
   ],
   "decision_refs": [
    "D-025"
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
   "statement": "models, layout, rules, presets là TypeScript thuần (không DI, không DOM, không import từ components).",
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
  },
  {
   "id": "B-005",
   "statement": "Trong renderer và viewEntities: kiểm tra preset chỉ ở presets/form-generic-presets.ts, mặc định field chỉ ở rules/form-generic-values.ts, định dạng hiển thị chỉ ở rules/form-generic-display.ts; component, pipe và service chỉ gọi các hàm này.",
   "invariant_refs": [
    "INV-010"
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
  },
  {
   "from": "presets",
   "to": "models (type), rules/form-generic-display, @sdcorejs/utils",
   "rationale": "Preset là lõi thuần: renderer và service phụ thuộc vào nó, nó không phụ thuộc vào component.",
   "invariant_refs": [
    "INV-010"
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
  "D-012",
  "D-013",
  "D-014",
  "D-015",
  "D-016",
  "D-017",
  "D-018",
  "D-019",
  "D-020",
  "D-024",
  "D-025"
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
   "expected_proof": "Test đơn vị layout 3 mức, kế thừa span, newRow, ghi đè breakpoint, ép mức; test so sánh hàng canvas với renderer; test DOM tự động của builder ở 3 chế độ và renderer ở 3 bề rộng, cùng test demo showcase không có lỗi console (AC-019).",
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
    "AC-014",
    "AC-019"
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
   "expected_proof": "Test đổi mã cập nhật mọi tham chiếu có cấu trúc và đếm tham chiếu chuỗi tự do; upload() gửi params đã giải tham chiếu (AC-011).",
   "owner": "sdcorejs-execute-plan",
   "invariant_refs": [
    "INV-005"
   ],
   "acceptance_criterion_refs": [
    "AC-015",
    "AC-011"
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
   "expected_proof": "npm run check:sync xanh; lệnh tự động (git ls-files trên versions/v22, plan ghi lệnh chính xác) xác nhận không còn file CRLF.",
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
   "expected_proof": "Test danh sách export của entry form-generic khớp C-001…C-006; lệnh tự động (plan ghi lệnh chính xác) kiểm CHANGELOG [Unreleased] liệt kê export đã bỏ và sd-form-generic.md nhắc mọi export runtime.",
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
  },
  {
   "id": "VAL-010",
   "expected_proof": "Test preset và việc chuyển ràng buộc cho control Core; test password không nhận defaultValue và hiện mặt nạ khi chỉ xem; test viewEntities định dạng qua cùng các hàm; lệnh kiểm cấu trúc tự động (plan ghi lệnh chính xác) trên components/form-render/**, pipes/**, services/**.",
   "owner": "sdcorejs-execute-plan",
   "invariant_refs": [
    "INV-010"
   ],
   "acceptance_criterion_refs": [
    "AC-007",
    "AC-016"
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
    "INV-006",
    "INV-010"
   ]
  },
  "agent_architecture_ref": null
 },
 "change_control": {
  "revision": 2,
  "supersedes": "architecture-form-generic-schema-v1-r1",
  "change_reason": "Spec r2 (D-024) bỏ bằng chứng thủ công: thêm INV-010/D-025/B-005/VAL-010 bảo vệ R-004, AC-007, AC-016; AC-012 và AC-019 vào phạm vi INV-002; VAL-005 phủ AC-011; VAL-007/VAL-008 kiểm bằng lệnh tự động; presets vào B-002 và hướng phụ thuộc."
 }
}
```

</details>

<details><summary>decision_coverage revision 5 (JSON)</summary>

```json
{
 "schema_version": 1,
 "revision": 5,
 "records": [
  {
   "id": "R-001",
   "type": "requirement",
   "statement": "Schema gốc SdFormGenericSchema là phiên bản đầu tiên (không schemaVersion, không chuyển đổi từ SdFormGeneric cũ) theo ngữ pháp cố định Form → pages → group → element; phần tử phân loại bằng `type`; chừa sẵn shape cho static/button (đợt 2) và tabs/steps/table (đợt 3).",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "components/form-generic",
   "task_refs": [
    "TASK-002",
    "TASK-003",
    "TASK-018",
    "TASK-022"
   ]
  },
  {
   "id": "R-002",
   "type": "requirement",
   "statement": "Bố cục responsive layout.span { desktop, tablet, mobile } (1–12) + newRow, theo SD_FORM_GENERIC_BREAKPOINTS = { tablet: 600, desktop: 1024 } đo trên bề rộng form; mặc định desktop 12, tablet theo desktop, mobile 12; ghi đè breakpoint qua provider; bỏ phần tử break.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "components/form-generic",
   "task_refs": [
    "TASK-004",
    "TASK-005",
    "TASK-016",
    "TASK-020"
   ]
  },
  {
   "id": "R-003",
   "type": "requirement",
   "statement": "Điều kiện rules { visible, hidden, disabled, required } lưu bằng Filter của @sdcorejs/utils và đánh giá bằng FilterUtilities.evaluate trên giá trị form + biến; validation cấp form dùng Filter hoặc hàm đăng ký ở portal.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "components/form-generic",
   "task_refs": [
    "TASK-006",
    "TASK-007",
    "TASK-008",
    "TASK-009",
    "TASK-016",
    "TASK-019"
   ]
  },
  {
   "id": "R-004",
   "type": "requirement",
   "statement": "Validation của field chuẩn hoá { required, min, max, minLength, maxLength, pattern { value, message }, maxItems, phoneCountry }; giữ nguyên các preset text (email, phone, url, password) và number (integer, decimal, currency, percent) cùng kiểm tra của chúng.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "components/form-generic",
   "task_refs": [
    "TASK-003",
    "TASK-015",
    "TASK-017"
   ]
  },
  {
   "id": "R-005",
   "type": "requirement",
   "statement": "Nguồn lựa chọn options = { source: static, items } | { source: catalog, catalog, params, fill } với SdFormGenericValueRef có cấu trúc; multiple là thuộc tính field; portal đăng ký catalog { id, label, params, fields, load, search? }.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "components/form-generic",
   "task_refs": [
    "TASK-003",
    "TASK-006",
    "TASK-007",
    "TASK-012",
    "TASK-013",
    "TASK-017",
    "TASK-019"
   ]
  },
  {
   "id": "R-006",
   "type": "requirement",
   "statement": "Cấu hình portal gom về provideSdFormGeneric({ catalogs, templates, htmlDefinitions, validators, breakpoints }) thay cho SD_FORM_GENERIC_CONFIGURATION.form cũ.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "components/form-generic",
   "task_refs": [
    "TASK-012",
    "TASK-013",
    "TASK-014"
   ]
  },
  {
   "id": "R-007",
   "type": "requirement",
   "statement": "sd-form-render có API [schema], [(value)] (model, không mutate input), [form], [variables], [viewed], [breakpoint], [labelPlacement], [keys]; method validate() trả { valid, messages } và upload(); defaultValue khai báo theo field.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "components/form-generic",
   "task_refs": [
    "TASK-006",
    "TASK-007",
    "TASK-009",
    "TASK-016",
    "TASK-017"
   ]
  },
  {
   "id": "R-008",
   "type": "requirement",
   "statement": "sd-form-builder có API [(schema)], thiết kế trên schema mới ngang tính năng hiện có cho các field và group; chế độ Desktop | Tablet | Mobile sửa span của mức đang xem, hiển thị mức kế thừa, newRow thay cho ngắt dòng; Xem trước dùng renderer với [breakpoint] ép mức.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "components/form-generic",
   "task_refs": [
    "TASK-018",
    "TASK-019",
    "TASK-020",
    "TASK-024"
   ]
  },
  {
   "id": "R-009",
   "type": "requirement",
   "statement": "Giữ đủ chức năng hiện có trên model mới: biến, validation cấp form, templates, HTML definitions (biến, truy vấn), upload (loại, nguồn, định dạng, số file, dung lượng, tham số), hyperlink khi chỉ xem, labelPlacement, viewed, SdFormRenderService.viewEntities, đổi mã có cập nhật tham chiếu có cấu trúc.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "components/form-generic",
   "task_refs": [
    "TASK-008",
    "TASK-009",
    "TASK-010",
    "TASK-011",
    "TASK-014",
    "TASK-017",
    "TASK-019"
   ]
  },
  {
   "id": "R-010",
   "type": "requirement",
   "statement": "Bỏ sd-feel-expression, model expression cũ và phần tử break; CHANGELOG ghi mục BREAKING có ví dụ trước/sau; sd-form-generic.md viết lại cho schema mới; showcase chạy trên schema mới; i18n đủ 5 ngôn ngữ.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "components/form-generic",
   "task_refs": [
    "TASK-021",
    "TASK-022",
    "TASK-023",
    "TASK-024"
   ]
  },
  {
   "id": "R-011",
   "type": "requirement",
   "statement": "Kiểm chứng: TDD cho phần logic, test sau cho giao diện bằng kiểm tra DOM tự động (ảnh chụp thật chỉ là UAT tùy chọn, không phải bằng chứng của gate); full suite v19 có coverage, lint, check:i18n, check:i18n-parity, check:scss-hex xanh; rollout v20/v21/v22 bằng npm run sync, check:sync xanh và v22 giữ LF (kiểm bằng lệnh tự động).",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "components/form-generic",
   "task_refs": [
    "TASK-001",
    "TASK-024",
    "TASK-025",
    "TASK-026"
   ]
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
   "task_refs": [
    "TASK-002",
    "TASK-003",
    "TASK-018",
    "TASK-020",
    "TASK-022"
   ],
   "evidence_refs": [
    "EVIDENCE-002",
    "EVIDENCE-003",
    "EVIDENCE-018",
    "EVIDENCE-020",
    "EVIDENCE-022"
   ]
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
   "task_refs": [
    "TASK-004",
    "TASK-005",
    "TASK-016"
   ],
   "evidence_refs": [
    "EVIDENCE-004",
    "EVIDENCE-005",
    "EVIDENCE-016"
   ]
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
   "task_refs": [
    "TASK-004",
    "TASK-005",
    "TASK-012",
    "TASK-013",
    "TASK-016"
   ],
   "evidence_refs": [
    "EVIDENCE-004",
    "EVIDENCE-005",
    "EVIDENCE-012",
    "EVIDENCE-013",
    "EVIDENCE-016"
   ]
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
   "task_refs": [
    "TASK-004",
    "TASK-005",
    "TASK-018"
   ],
   "evidence_refs": [
    "EVIDENCE-004",
    "EVIDENCE-005",
    "EVIDENCE-018"
   ]
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
   "task_refs": [
    "TASK-006",
    "TASK-007",
    "TASK-016",
    "TASK-019"
   ],
   "evidence_refs": [
    "EVIDENCE-006",
    "EVIDENCE-007",
    "EVIDENCE-016",
    "EVIDENCE-019"
   ]
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
   "task_refs": [
    "TASK-008",
    "TASK-009",
    "TASK-016"
   ],
   "evidence_refs": [
    "EVIDENCE-008",
    "EVIDENCE-009",
    "EVIDENCE-016"
   ]
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
   "task_refs": [
    "TASK-015",
    "TASK-017"
   ],
   "evidence_refs": [
    "EVIDENCE-015",
    "EVIDENCE-017"
   ]
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
   "task_refs": [
    "TASK-006",
    "TASK-007",
    "TASK-012",
    "TASK-013",
    "TASK-017"
   ],
   "evidence_refs": [
    "EVIDENCE-006",
    "EVIDENCE-007",
    "EVIDENCE-012",
    "EVIDENCE-013",
    "EVIDENCE-017"
   ]
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
   "task_refs": [
    "TASK-006",
    "TASK-007",
    "TASK-016"
   ],
   "evidence_refs": [
    "EVIDENCE-006",
    "EVIDENCE-007",
    "EVIDENCE-016"
   ]
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
   "task_refs": [
    "TASK-004",
    "TASK-005",
    "TASK-016"
   ],
   "evidence_refs": [
    "EVIDENCE-004",
    "EVIDENCE-005",
    "EVIDENCE-016"
   ]
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
   "task_refs": [
    "TASK-006",
    "TASK-007",
    "TASK-016",
    "TASK-017"
   ],
   "evidence_refs": [
    "EVIDENCE-006",
    "EVIDENCE-007",
    "EVIDENCE-016",
    "EVIDENCE-017"
   ]
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
   "task_refs": [
    "TASK-004",
    "TASK-005",
    "TASK-018",
    "TASK-020"
   ],
   "evidence_refs": [
    "EVIDENCE-004",
    "EVIDENCE-005",
    "EVIDENCE-018",
    "EVIDENCE-020"
   ]
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
   "task_refs": [
    "TASK-002",
    "TASK-003",
    "TASK-018",
    "TASK-020"
   ],
   "evidence_refs": [
    "EVIDENCE-002",
    "EVIDENCE-003",
    "EVIDENCE-018",
    "EVIDENCE-020"
   ]
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
   "task_refs": [
    "TASK-004",
    "TASK-005",
    "TASK-020"
   ],
   "evidence_refs": [
    "EVIDENCE-004",
    "EVIDENCE-005",
    "EVIDENCE-020"
   ]
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
   "task_refs": [
    "TASK-008",
    "TASK-009",
    "TASK-019",
    "TASK-020"
   ],
   "evidence_refs": [
    "EVIDENCE-008",
    "EVIDENCE-009",
    "EVIDENCE-019",
    "EVIDENCE-020"
   ]
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
   "task_refs": [
    "TASK-010",
    "TASK-011",
    "TASK-014"
   ],
   "evidence_refs": [
    "EVIDENCE-010",
    "EVIDENCE-011",
    "EVIDENCE-014"
   ]
  },
  {
   "id": "AC-017",
   "type": "acceptance-criterion",
   "statement": "Chạy public-api.spec.ts và lệnh kiểm tài liệu tự động (lấy danh sách export runtime và export đã bỏ từ public-api.spec.ts) → Entry chỉ còn đúng bề mặt runtime của hợp đồng v1; SdFeelExpression và các export cũ không còn; CHANGELOG [Unreleased] có mục BREAKING nhắc từng export đã bỏ kèm ví dụ trước/sau; sd-form-generic.md nhắc mọi export runtime",
   "behavior": "Chạy public-api.spec.ts và lệnh kiểm tài liệu tự động (lấy danh sách export runtime và export đã bỏ từ public-api.spec.ts)",
   "expected_result": "Entry chỉ còn đúng bề mặt runtime của hợp đồng v1; SdFeelExpression và các export cũ không còn; CHANGELOG [Unreleased] có mục BREAKING nhắc từng export đã bỏ kèm ví dụ trước/sau; sd-form-generic.md nhắc mọi export runtime",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-010"
   ],
   "task_refs": [
    "TASK-022",
    "TASK-023"
   ],
   "evidence_refs": [
    "EVIDENCE-022",
    "EVIDENCE-023"
   ]
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
   "task_refs": [
    "TASK-025",
    "TASK-026"
   ],
   "evidence_refs": [
    "EVIDENCE-025",
    "EVIDENCE-026"
   ]
  },
  {
   "id": "AC-019",
   "type": "acceptance-criterion",
   "statement": "Chạy test component tự động: sd-form-builder ở chế độ Desktop/Tablet/Mobile, sd-form-render ở bề rộng form 1100px, 800px và 480px, và test của demo showcase → DOM cho thấy span đúng theo mức, nhãn kế thừa \"Theo Desktop\"/\"Mặc định\", field newRow bắt đầu hàng mới, demo showcase chạy trên API mới và không có lỗi console; ảnh chụp thật là UAT tùy chọn ngoài gate",
   "behavior": "Chạy test component tự động: sd-form-builder ở chế độ Desktop/Tablet/Mobile, sd-form-render ở bề rộng form 1100px, 800px và 480px, và test của demo showcase",
   "expected_result": "DOM cho thấy span đúng theo mức, nhãn kế thừa \"Theo Desktop\"/\"Mặc định\", field newRow bắt đầu hàng mới, demo showcase chạy trên API mới và không có lỗi console; ảnh chụp thật là UAT tùy chọn ngoài gate",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-008",
    "R-011"
   ],
   "task_refs": [
    "TASK-024"
   ],
   "evidence_refs": [
    "EVIDENCE-024"
   ]
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
   "statement": "FilterUtilities.evaluate của @sdcorejs/utils (bản pin trong workspace: 1.1.4 lúc lập spec r1, 1.2.4 sau khi merge origin/main) xử lý đủ toán tử mà sd-query-builder sinh ra (so sánh, like, IN, BETWEEN, NULL, ngày tương đối, so sánh field–field).",
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
   "task_refs": [
    "TASK-002",
    "TASK-003",
    "TASK-022",
    "TASK-023"
   ]
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
   "task_refs": [
    "TASK-002",
    "TASK-003",
    "TASK-018"
   ]
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
   "task_refs": [
    "TASK-004",
    "TASK-005",
    "TASK-016",
    "TASK-020"
   ]
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
   "task_refs": [
    "TASK-006",
    "TASK-007",
    "TASK-008",
    "TASK-009",
    "TASK-016",
    "TASK-019"
   ]
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
   "task_refs": [
    "TASK-003",
    "TASK-006",
    "TASK-007",
    "TASK-017",
    "TASK-019"
   ]
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
   "task_refs": [
    "TASK-012",
    "TASK-013",
    "TASK-014"
   ]
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
   "task_refs": [
    "TASK-016",
    "TASK-020"
   ]
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
   "task_refs": [
    "TASK-008",
    "TASK-009",
    "TASK-010",
    "TASK-011",
    "TASK-014",
    "TASK-019",
    "TASK-022"
   ]
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
   "task_refs": [
    "TASK-003",
    "TASK-005"
   ]
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
   "task_refs": [
    "TASK-023",
    "TASK-026"
   ]
  },
  {
   "id": "D-011",
   "type": "decision",
   "statement": "Cách test? → TDD cho logic; viết test sau cho giao diện kèm ảnh chụp thật",
   "question": "Cách test?",
   "selected_value": "TDD cho logic; viết test sau cho giao diện kèm ảnh chụp thật",
   "source": "explicit-user",
   "status": "superseded",
   "blocking": false,
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
   "task_refs": [
    "TASK-002",
    "TASK-004",
    "TASK-006",
    "TASK-008",
    "TASK-010",
    "TASK-012",
    "TASK-024",
    "TASK-025"
   ]
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
   "task_refs": [
    "TASK-003",
    "TASK-017"
   ]
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
   "task_refs": [
    "TASK-002",
    "TASK-003",
    "TASK-018"
   ]
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
   "task_refs": [
    "TASK-008",
    "TASK-009",
    "TASK-016"
   ]
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
   "task_refs": [
    "TASK-017",
    "TASK-019"
   ]
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
   "task_refs": [
    "TASK-016"
   ]
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
   "task_refs": [
    "TASK-002",
    "TASK-003",
    "TASK-016",
    "TASK-018"
   ]
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
   "task_refs": [
    "TASK-003",
    "TASK-005",
    "TASK-007",
    "TASK-009",
    "TASK-011"
   ]
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
   "task_refs": [
    "TASK-012",
    "TASK-013"
   ]
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
   "task_refs": [
    "TASK-006",
    "TASK-007",
    "TASK-009",
    "TASK-016"
   ]
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
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-001",
    "R-002",
    "R-003",
    "R-004",
    "R-005",
    "R-006",
    "R-007",
    "R-008",
    "R-009",
    "R-010",
    "R-011",
    "AC-001",
    "AC-002",
    "AC-003",
    "AC-004",
    "AC-005",
    "AC-006",
    "AC-007",
    "AC-008",
    "AC-009",
    "AC-010",
    "AC-011",
    "AC-012",
    "AC-013",
    "AC-014",
    "AC-015",
    "AC-016",
    "AC-017",
    "AC-018",
    "AC-019",
    "INV-001",
    "INV-002",
    "INV-003",
    "INV-004",
    "INV-005",
    "INV-006",
    "INV-007",
    "INV-008",
    "INV-009"
   ],
   "validation_boundary": {
    "kind": "none",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008",
     "INV-009"
    ]
   },
   "task_refs": [
    "TASK-025"
   ]
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
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-009",
    "R-010",
    "AC-017"
   ],
   "task_refs": [
    "TASK-016",
    "TASK-022",
    "TASK-023"
   ]
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
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-003",
    "AC-006"
   ],
   "task_refs": [
    "TASK-008",
    "TASK-009"
   ]
  },
  {
   "id": "D-024",
   "type": "decision",
   "question": "Kiểm chứng giao diện và tài liệu thế nào để delivery convergence xác nhận được?",
   "selected_value": "TDD cho logic; test sau cho giao diện bằng kiểm tra DOM tự động (span theo mức, nhãn kế thừa, newRow, không lỗi console); public API, CHANGELOG và tài liệu kiểm bằng test/lệnh tự động; ảnh chụp thật chỉ là UAT tùy chọn ngoài gate",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "repository",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "sdcorejs-convergence:v1 không bao giờ nhận evidence thủ công làm bằng chứng; người dùng chọn sửa spec → architecture → plan (2026-09-30) để gate đạt CONVERGED. Kiểm tra DOM lặp lại được trên mọi tree, ảnh chụp thì không.",
   "supersedes": "D-011",
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-011",
    "AC-017",
    "AC-018",
    "AC-019"
   ],
   "task_refs": [],
   "statement": "Kiểm chứng giao diện và tài liệu thế nào để delivery convergence xác nhận được? → TDD cho logic; test sau cho giao diện bằng kiểm tra DOM tự động (span theo mức, nhãn kế thừa, newRow, không lỗi console); public API, CHANGELOG và tài liệu kiểm bằng test/lệnh tự động; ảnh chụp thật chỉ là UAT tùy chọn ngoài gate"
  },
  {
   "id": "D-025",
   "type": "decision",
   "question": "Kiểm tra preset, mặc định và định dạng giá trị của field ở renderer và viewEntities nằm ở đâu?",
   "selected_value": "Một nguồn cho mỗi việc: presets/form-generic-presets.ts (kiểm tra preset text/number, pattern hợp lệ), rules/form-generic-values.ts (mặc định field, password không nhận defaultValue), rules/form-generic-display.ts (định dạng số, ngày, mặt nạ password); ràng buộc min/max/minLength/maxLength/pattern/maxItems chuyển nguyên cho control Core. Builder (inspector, xem trước) ngoài phạm vi của đợt này.",
   "source": "approved-architecture",
   "status": "proposed",
   "blocking": false,
   "scope": "module",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "R-004 giữ nguyên kiểm tra của preset; renderer và viewEntities phải báo cùng một lỗi và hiển thị cùng một định dạng. Review r2 thấy builder còn tự khai mặt nạ password, độ chính xác và đơn vị tiền mặc định; việc gom builder về cùng nguồn để sau.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-004",
    "AC-007",
    "AC-016"
   ],
   "task_refs": [],
   "statement": "Kiểm tra preset, mặc định và định dạng giá trị của field ở renderer và viewEntities nằm ở đâu? → Một nguồn cho mỗi việc: presets/form-generic-presets.ts (kiểm tra preset text/number, pattern hợp lệ), rules/form-generic-values.ts (mặc định field, password không nhận defaultValue), rules/form-generic-display.ts (định dạng số, ngày, mặt nạ password); ràng buộc min/max/minLength/maxLength/pattern/maxItems chuyển nguyên cho control Core. Builder (inspector, xem trước) ngoài phạm vi của đợt này."
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
   "task_refs": [
    "TASK-007",
    "TASK-016",
    "TASK-018",
    "TASK-020"
   ],
   "evidence_refs": [
    "EVIDENCE-016",
    "EVIDENCE-018"
   ]
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
    "AC-014",
    "AC-012",
    "AC-019"
   ],
   "task_refs": [
    "TASK-005",
    "TASK-016",
    "TASK-018",
    "TASK-020"
   ],
   "evidence_refs": [
    "EVIDENCE-005",
    "EVIDENCE-020"
   ]
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
   "task_refs": [
    "TASK-007",
    "TASK-009",
    "TASK-016",
    "TASK-019",
    "TASK-022"
   ],
   "evidence_refs": [
    "EVIDENCE-007",
    "EVIDENCE-016"
   ]
  },
  {
   "id": "INV-004",
   "type": "invariant",
   "statement": "Schema luôn đúng ngữ pháp: pages → (group | element), group chỉ chứa element, không có break, không có schemaVersion, key field duy nhất (kể cả so với biến); mọi lệnh của builder chỉ tạo ra schema hợp lệ.",
   "protected_refs": [
    "R-001",
    "AC-001"
   ],
   "task_refs": [
    "TASK-003",
    "TASK-018"
   ],
   "evidence_refs": [
    "EVIDENCE-003",
    "EVIDENCE-018"
   ]
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
   "task_refs": [
    "TASK-003",
    "TASK-009",
    "TASK-019"
   ],
   "evidence_refs": [
    "EVIDENCE-009"
   ]
  },
  {
   "id": "INV-006",
   "type": "invariant",
   "statement": "Thêm type phần tử mới (đợt 2/3) không đổi shape của type đã có; phần tử có type lạ được renderer bỏ qua và được builder giữ nguyên khi phát lại.",
   "protected_refs": [
    "R-001",
    "AC-001"
   ],
   "task_refs": [
    "TASK-003",
    "TASK-016",
    "TASK-018"
   ],
   "evidence_refs": [
    "EVIDENCE-003",
    "EVIDENCE-016",
    "EVIDENCE-018"
   ]
  },
  {
   "id": "INV-007",
   "type": "invariant",
   "statement": "Chỉ sửa code ở versions/v19; v20/v21/v22 chỉ đổi qua npm run sync và check:sync luôn qua; v22 giữ LF.",
   "protected_refs": [
    "R-011",
    "AC-018"
   ],
   "task_refs": [
    "TASK-001",
    "TASK-026"
   ],
   "evidence_refs": [
    "EVIDENCE-026"
   ]
  },
  {
   "id": "INV-008",
   "type": "invariant",
   "statement": "Public API của entry form-generic đúng bằng danh sách hợp đồng C-001…C-006; mọi export cũ bị bỏ đều được liệt kê trong mục BREAKING của CHANGELOG.",
   "protected_refs": [
    "R-010",
    "AC-017"
   ],
   "task_refs": [
    "TASK-022",
    "TASK-023"
   ],
   "evidence_refs": [
    "EVIDENCE-022"
   ]
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
   "task_refs": [
    "TASK-013",
    "TASK-014",
    "TASK-017"
   ],
   "evidence_refs": [
    "EVIDENCE-013",
    "EVIDENCE-014"
   ]
  },
  {
   "id": "INV-010",
   "type": "invariant",
   "statement": "Trong renderer và SdFormRenderService.viewEntities: kiểm tra preset text (email, phone VN/quốc tế, url) và number (integer, decimal, currency, percent) cùng tính hợp lệ của pattern chỉ đến từ presets/form-generic-presets.ts; mặc định field (password không nhận defaultValue) chỉ ở rules/form-generic-values.ts; định dạng hiển thị giá trị (số theo preset, ngày, mặt nạ password) chỉ ở rules/form-generic-display.ts; ràng buộc min/max/minLength/maxLength/pattern/maxItems chuyển nguyên cho control Core, form-generic không kiểm lại.",
   "protected_refs": [
    "R-004",
    "AC-007",
    "AC-016"
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
  },
  {
   "revision": 3,
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
     "id": "D-021",
     "type": "decision"
    },
    {
     "id": "D-022",
     "type": "decision"
    },
    {
     "id": "D-023",
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
  },
  {
   "revision": 4,
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
     "id": "D-021",
     "type": "decision"
    },
    {
     "id": "D-022",
     "type": "decision"
    },
    {
     "id": "D-023",
     "type": "decision"
    },
    {
     "id": "D-024",
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
  },
  {
   "revision": 5,
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
     "id": "D-021",
     "type": "decision"
    },
    {
     "id": "D-022",
     "type": "decision"
    },
    {
     "id": "D-023",
     "type": "decision"
    },
    {
     "id": "D-024",
     "type": "decision"
    },
    {
     "id": "D-025",
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
    },
    {
     "id": "INV-010",
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

- Lượt review riêng (chỉ đọc) trả CHANGES REQUIRED, không có BLOCKER; mọi phát hiện đã xử lý trong bản nháp trước khi trình duyệt (xem mục "Review kiến trúc"). INV-010 thu hẹp về renderer và viewEntities; việc gom builder về cùng nguồn để thành task riêng.
- Người dùng chọn 1 (Duyệt) cho bản nháp `.sdcorejs/docs/architecture/2026-09-30-22-58-form-generic-schema-v1-phase-1-architecture.md`. Thay thế `architecture-form-generic-schema-v1-r1`.

## Skill provenance

sdcorejs-architecture (approved on attempt 1 / 3)
