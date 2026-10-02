---
artifact_id: spec-table-field-path-fallback-r2
artifact_kind: spec
schema_version: 1
change_ref: table-field-path-fallback
source_spec: none
source_plan: none
commit_policy: with-change
owner: sdcorejs-spec
name: table-field-path-fallback
description: SdTable reads column/group fields that @sdcorejs/utils 1.2 rejects as paths with an own-property legacy fallback (port of @sd-angular/core NSP-5745), and every line pins @sdcorejs/utils 1.2.5.
contract_id: table-field-path-fallback
requirement_id: NSP-5745
owner_repository_id: sdcorejs-angular
owner_repository_role: library
owner_module_id: components/table
repository_relative_path: .sdcorejs/specs/angular/2026-10-01-17-06-table-field-path-fallback.md
source_revision: 23857013381215b07f497842427e03477365536d
parent_repository_id: null
parent_references: []
approved_at: '2026-10-01T10:08:40.559Z'
approved_by: nghiatt15_onemount
approval_source: explicit-user-choice
track: angular
target_root_kind: target-project
stack_profile: core-ui-angular
profile_confidence: high
sourceDraftPath: .sdcorejs/docs/angular/2026-10-01-17-06-table-field-path-fallback-spec.md
acceptance_criteria_count: 9
manual_criteria_count: 0
redaction_applied: false
supersedes: .sdcorejs/specs/angular/2026-10-01-15-12-table-field-path-fallback.md
change_control:
  revision: 2
  supersedes: .sdcorejs/specs/angular/2026-10-01-15-12-table-field-path-fallback.md
  change_reason: Convergence gate requires an invariant on every validation row (INV-003..INV-006 added); review R1 moved the CHANGELOG text to the existing [Unreleased] Changed utils bullet (D-006, AC-009 wording). No code change.
approval_hash: sha256:v1:6c97aad9394339376e4cc959bd979847146a5971c72a55d24e3c17f00ce21d15
approved_spec_hash: sha256:v1:6c97aad9394339376e4cc959bd979847146a5971c72a55d24e3c17f00ce21d15
---

# SdTable đọc được column field không phải path hợp lệ và nâng @sdcorejs/utils 1.2.5 (revision 2) - Approved Spec

> Snapshot of what the user approved at the `sdcorejs-spec` gate. Do not edit by hand; re-author through `sdcorejs-spec` if the contract changes.

## Approved contract

# Spec - SdTable đọc được column field không phải path hợp lệ và nâng @sdcorejs/utils 1.2.5 (revision 2) - 2026-10-01 17:06

```yaml
spec_context:
  source: sdcorejs-spec
  decision_coverage:
    {"schema_version": 1, "revision": 3, "records": [
      {"id":"R-001","type":"requirement","statement":"A table column or group field that @sdcorejs/utils 1.2 rejects as a property path (whitespace, '*', leading/trailing whitespace) resolves with the legacy dot-split own-property lookup instead of throwing.","source":"explicit-user","status":"active","owner_repository_id":"sdcorejs-angular","owner_module_id":"components/table","task_refs":["TASK-001","TASK-002","TASK-003","TASK-004"]},
      {"id":"R-002","type":"requirement","statement":"A field lookup failure never turns a successful table read into the read-error state; at most it degrades that cell.","source":"explicit-user","status":"active","owner_repository_id":"sdcorejs-angular","owner_module_id":"components/table","task_refs":["TASK-002","TASK-004","TASK-008"]},
      {"id":"R-003","type":"requirement","statement":"Fields that are valid @sdcorejs/utils 1.2 paths keep exactly the current getNestedValue semantics.","source":"authoritative-contract","status":"active","owner_repository_id":"sdcorejs-angular","owner_module_id":"components/table","task_refs":["TASK-001","TASK-003","TASK-008"]},
      {"id":"R-004","type":"requirement","statement":"Every table read of a row value by column.field or group field (format and lazy-values, desktop cell, group pipe, aggregate, quick search, export, local filter, local sort) goes through one internal resolver.","source":"explicit-user","status":"active","owner_repository_id":"sdcorejs-angular","owner_module_id":"components/table","task_refs":["TASK-002","TASK-004","TASK-008"]},
      {"id":"R-005","type":"requirement","statement":"@sdcorejs/utils is pinned to exactly 1.2.5 in the v19, v20, v21 and v22 workspaces and libraries and in the showcase, so cross-entry instanceof checks such as FilePickerCancelledError work in bundled applications.","source":"explicit-user","status":"active","owner_repository_id":"sdcorejs-angular","owner_module_id":null,"task_refs":["TASK-005","TASK-007","TASK-008"]},
      {"id":"R-006","type":"requirement","statement":"v20, v21 and v22 are derived from v19 with the repository sync script and stay in sync; sd-table.md and the CHANGELOG [Unreleased] section describe the field rule and the utils bump.","source":"authoritative-contract","status":"active","owner_repository_id":"sdcorejs-angular","owner_module_id":null,"task_refs":["TASK-006","TASK-007","TASK-008"]},
      {"id":"AC-001","type":"acceptance-criterion","statement":"Server table with a whitespace field renders rows.","behavior":"A type 'server' SdTable with columns 'Số phòng ngủ' and 'Loại sản phẩm*' loads rows keyed by those names.","expected_result":"readState().status is 'ready', no read-error region, and the row shows both values.","verification_kind":"automated","blocking":true,"requirement_refs":["R-001","R-002"],"task_refs":["TASK-002","TASK-004","TASK-008"],"evidence_refs":["EVIDENCE-002","EVIDENCE-004","EVIDENCE-008"]},
      {"id":"AC-002","type":"acceptance-criterion","statement":"TableFormatService.format tolerates invalid-path fields.","behavior":"format() runs over rows with fields 'Loại sản phẩm*', 'Hướng ban công', ' Mã ' and 'a.b c', and over a lazy-values column with a whitespace field.","expected_result":"No rejection; display values equal the literal or legacy-nested values and lazy-values keys are collected.","verification_kind":"automated","blocking":true,"requirement_refs":["R-001","R-002"],"task_refs":["TASK-002","TASK-004","TASK-008"],"evidence_refs":["EVIDENCE-002","EVIDENCE-004","EVIDENCE-008"]},
      {"id":"AC-003","type":"acceptance-criterion","statement":"Valid paths are unchanged.","behavior":"The resolver reads 'id', 'customer.id', 'items[0]' and a missing nested path.","expected_result":"Results equal Utilities.getNestedValue for the same input.","verification_kind":"automated","blocking":true,"requirement_refs":["R-003"],"task_refs":["TASK-001","TASK-003","TASK-008"],"evidence_refs":["EVIDENCE-001","EVIDENCE-003","EVIDENCE-008"]},
      {"id":"AC-004","type":"acceptance-criterion","statement":"Prototype data is never read.","behavior":"The resolver receives prototype-sensitive segments, Object.prototype or Function.prototype roots, and own properties holding prototype objects.","expected_result":"Returns undefined in every case.","verification_kind":"automated","blocking":true,"requirement_refs":["R-001"],"task_refs":["TASK-001","TASK-003","TASK-008"],"evidence_refs":["EVIDENCE-001","EVIDENCE-003","EVIDENCE-008"]},
      {"id":"AC-005","type":"acceptance-criterion","statement":"Every table read path works with whitespace fields.","behavior":"Local filter and sort, SdGroupPipe, aggregate (column and group fields), quick search and TableExportService run with fields that contain whitespace.","expected_result":"Each uses the row value and none throws.","verification_kind":"automated","blocking":true,"requirement_refs":["R-001","R-004"],"task_refs":["TASK-002","TASK-004","TASK-008"],"evidence_refs":["EVIDENCE-002","EVIDENCE-004","EVIDENCE-008"]},
      {"id":"AC-006","type":"acceptance-criterion","statement":"Rejection detection is cached and class-independent.","behavior":"A rejected field is resolved for several rows, and Utilities.getNestedValue is stubbed to throw an error of a foreign class.","expected_result":"getNestedValue is called once for the rejected field, and the fallback still returns the literal value.","verification_kind":"automated","blocking":true,"requirement_refs":["R-001","R-004"],"task_refs":["TASK-001","TASK-003","TASK-008"],"evidence_refs":["EVIDENCE-001","EVIDENCE-003","EVIDENCE-008"]},
      {"id":"AC-007","type":"acceptance-criterion","statement":"utils 1.2.5 is installed on every line.","behavior":"Inspect the workspace, library and showcase manifests and run npm ls @sdcorejs/utils in v19, v20, v21, v22 and showcase.","expected_result":"Every manifest pins exactly 1.2.5 and every npm ls resolves 1.2.5 without errors.","verification_kind":"automated","blocking":true,"requirement_refs":["R-005"],"task_refs":["TASK-005","TASK-007","TASK-008"],"evidence_refs":["EVIDENCE-005","EVIDENCE-007","EVIDENCE-009"]},
      {"id":"AC-008","type":"acceptance-criterion","statement":"Release lines stay in sync and buildable.","behavior":"Run npm run check:sync, the v19 table suite with the upload-file, api and excel specs, the v19 library build and lint for touched files.","expected_result":"check:sync passes, specs pass, the build succeeds and lint reports no new error.","verification_kind":"automated","blocking":true,"requirement_refs":["R-002","R-003","R-004","R-005","R-006"],"task_refs":["TASK-007","TASK-008"],"evidence_refs":["EVIDENCE-007","EVIDENCE-008"]},
      {"id":"AC-009","type":"acceptance-criterion","statement":"Docs describe the field rule and the utils 1.2.5 contract.","behavior":"Search the sd-table.md field row and the [Unreleased] @sdcorejs/utils bullet of CHANGELOG.md.","expected_result":"sd-table.md explains literal/legacy fallback for rejected paths and prototype rejection; the [Unreleased] ### Changed bullet upgrades @sdcorejs/utils from 1.1.4 to 1.2.5, keeps table fields with spaces or * working, notes that 1.2.5 is needed for file-picker cancel in bundled apps and that subclasses must declare errorName; ### Fixed has no entry for these unreleased regressions.","verification_kind":"automated","blocking":true,"requirement_refs":["R-006"],"task_refs":["TASK-006","TASK-008"],"evidence_refs":["EVIDENCE-006","EVIDENCE-010"]},
      {"id":"A-001","type":"assumption","statement":"@sdcorejs/utils 1.2.5 is published to npm and contains the stable errorName brand.","source":"explicit","confidence":"high","status":"confirmed","blocking":false,"evidence_refs":["npm-view-sdcorejs-utils-latest-1.2.5","utils-1.2.5-tarball-errorName","sdcorejs-utils-main-a7624e5"],"consequence_if_wrong":"The dependency bump would not fix cross-entry instanceof; the table tasks are not affected.","validation_method":"npm view @sdcorejs/utils version returns 1.2.5; dist/errors.js of the 1.2.5 tarball contains the errorName guard.","owner":"nghiatt15_onemount","rationale":"Checked on 2026-10-01: latest is 1.2.5 and PR #15 is merged to main and released (#16).","impacted_refs":["R-005"]},
      {"id":"A-002","type":"assumption","statement":"@sdcorejs/angular neither subclasses nor re-exports @sdcorejs/utils error classes, so the 1.2.5 subclass requirement does not change its public API.","source":"explicit","confidence":"high","status":"confirmed","blocking":false,"evidence_refs":["git-grep-origin-main-6e0509ad2"],"consequence_if_wrong":"A library subclass would throw on construction after the bump.","validation_method":"git grep for subclasses and re-exports on the branch; existing specs stay green.","owner":"nghiatt15_onemount","rationale":"No extends of utils errors and no re-export of utils errors in versions/v19.","impacted_refs":["R-005"]},
      {"id":"D-001","type":"decision","statement":"Port the approved Core resolver: getNestedValue for accepted paths, a cached probe getNestedValue({}, field) to detect rejection, and an own-property dot-split fallback that rejects prototype segments and prototype objects.","question":"How should the table read a field that utils 1.2 rejects?","selected_value":"port lib-core-angular resolveFieldValue (probe + cache, own-property fallback, prototype guard)","source":"explicit-user","status":"approved","blocking":true,"scope":"module","owner_repository_id":"sdcorejs-angular","rationale":"Same defect and same approved design as @sd-angular/core NSP-5745; keeps both libraries consistent.","supersedes":null,"revisit_condition":null,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-001","R-003","AC-002","AC-003","AC-004","AC-006","INV-001"],"task_refs":["TASK-003","TASK-004"]},
      {"id":"D-002","type":"decision","statement":"The resolver is internal to components/table and not exported; rowKey, valueField, displayField, select, autocomplete and the form-generic hyperlink pipe keep their current lookups.","question":"Which reads change?","selected_value":"column and group field reads only; internal util","source":"explicit-user","status":"approved","blocking":true,"scope":"module","owner_repository_id":"sdcorejs-angular","rationale":"Bounded bug fix matching the Core scope; developer-defined keys are outside the defect.","supersedes":null,"revisit_condition":null,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-004","INV-002"],"task_refs":["TASK-004"]},
      {"id":"D-003","type":"decision","statement":"Bump @sdcorejs/utils to exactly 1.2.5 on every line and the showcase in the same change.","question":"Ship the utils bump with the table fix?","selected_value":"yes, same change","source":"explicit-user","status":"approved","blocking":true,"scope":"repository","owner_repository_id":"sdcorejs-angular","rationale":"User is releasing utils 1.2.5; one PR fixes both defects.","supersedes":null,"revisit_condition":null,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-005","AC-007"],"task_refs":["TASK-005","TASK-007"]},
      {"id":"D-004","type":"decision","statement":"Every acceptance criterion is proven automatically; downstream portal checks stay outside this change.","question":"How is acceptance proven?","selected_value":"automated evidence only","source":"explicit-user","status":"approved","blocking":true,"scope":"repository","owner_repository_id":"sdcorejs-angular","rationale":"Delivery convergence never accepts manual or deferred evidence (repository precedent in the form-generic spec revision).","supersedes":null,"revisit_condition":null,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-006","AC-008","AC-009"],"task_refs":["TASK-008"]},
      {"id":"D-005","type":"decision","statement":"This change has no authorization boundary; every acceptance criterion is proven by unit/component specs, the library build, sync and dependency checks, and deterministic doc checks.","question":"Which validation boundary applies to table-field-path-fallback?","selected_value":"none","source":"approved-plan","status":"approved","blocking":true,"scope":"repository","owner_repository_id":"sdcorejs-angular","rationale":"Data-lookup fix inside the table plus an exact dependency patch; no server, permission or trust boundary is touched.","supersedes":null,"revisit_condition":null,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-001","R-002","R-003","R-004","R-005","R-006","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","INV-001","INV-002"],"task_refs":["TASK-008"],"validation_boundary":{"kind":"none","source_refs":["R-001","R-002","R-003","R-004","R-005","R-006","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","INV-001","INV-002"]}},
      {"id":"D-006","type":"decision","statement":"Published 2.15 releases pin @sdcorejs/utils 1.1.4, so the table and file-picker regressions never shipped; document them in the existing [Unreleased] ### Changed @sdcorejs/utils bullet instead of ### Fixed entries.","question":"Where does the CHANGELOG describe the table field fallback and the utils 1.2.5 bump?","selected_value":"existing [Unreleased] ### Changed @sdcorejs/utils bullet (1.1.4 -> 1.2.5), no ### Fixed entries","source":"explicit-user","status":"approved","blocking":true,"scope":"repository","owner_repository_id":"sdcorejs-angular","rationale":"Review R1 (2026-10-01): npm view shows 19/20/21/22.2.15 depend on @sdcorejs/utils 1.1.4; user chose repair option 1.","supersedes":null,"revisit_condition":null,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-006","AC-009","INV-006"],"task_refs":["TASK-006"]},
      {"id":"INV-001","type":"invariant","statement":"No resolver path returns a prototype object or reads through __proto__, prototype or constructor.","protected_refs":["R-001","AC-004"],"task_refs":["TASK-001","TASK-003"],"evidence_refs":["EVIDENCE-001","EVIDENCE-003"]},
      {"id":"INV-002","type":"invariant","statement":"The public API of @sdcorejs/angular/components/table (exports and option/column types) is unchanged.","protected_refs":["R-004","AC-008"],"task_refs":["TASK-003","TASK-004","TASK-008"],"evidence_refs":["EVIDENCE-003","EVIDENCE-004","EVIDENCE-008"]},
      {"id":"INV-003","type":"invariant","statement":"A field lookup never turns a successful table read into the read-error state.","protected_refs":["AC-001"],"task_refs":["TASK-004"],"evidence_refs":["EVIDENCE-004","EVIDENCE-008"]},
      {"id":"INV-004","type":"invariant","statement":"For a path that @sdcorejs/utils accepts, the table reads exactly the Utilities.getNestedValue result.","protected_refs":["AC-003"],"task_refs":["TASK-003"],"evidence_refs":["EVIDENCE-001","EVIDENCE-003"]},
      {"id":"INV-005","type":"invariant","statement":"Every release line and the showcase pin and resolve the same exact @sdcorejs/utils version.","protected_refs":["AC-007"],"task_refs":["TASK-005","TASK-007"],"evidence_refs":["EVIDENCE-005","EVIDENCE-007","EVIDENCE-009"]},
      {"id":"INV-006","type":"invariant","statement":"sd-table.md and the [Unreleased] CHANGELOG describe the behaviour of the next release, not regressions that never shipped.","protected_refs":["AC-009"],"task_refs":["TASK-006"],"evidence_refs":["EVIDENCE-006","EVIDENCE-010"]}
    ], "history": [{"revision":1,"active":[{"id":"R-001","type":"requirement"},{"id":"R-002","type":"requirement"},{"id":"R-003","type":"requirement"},{"id":"R-004","type":"requirement"},{"id":"R-005","type":"requirement"},{"id":"R-006","type":"requirement"},{"id":"AC-001","type":"acceptance-criterion"},{"id":"AC-002","type":"acceptance-criterion"},{"id":"AC-003","type":"acceptance-criterion"},{"id":"AC-004","type":"acceptance-criterion"},{"id":"AC-005","type":"acceptance-criterion"},{"id":"AC-006","type":"acceptance-criterion"},{"id":"AC-007","type":"acceptance-criterion"},{"id":"AC-008","type":"acceptance-criterion"},{"id":"AC-009","type":"acceptance-criterion"},{"id":"A-001","type":"assumption"},{"id":"A-002","type":"assumption"},{"id":"D-001","type":"decision"},{"id":"D-002","type":"decision"},{"id":"D-003","type":"decision"},{"id":"D-004","type":"decision"},{"id":"INV-001","type":"invariant"},{"id":"INV-002","type":"invariant"}],"tombstones":[]},{"revision":2,"active":[{"id":"R-001","type":"requirement"},{"id":"R-002","type":"requirement"},{"id":"R-003","type":"requirement"},{"id":"R-004","type":"requirement"},{"id":"R-005","type":"requirement"},{"id":"R-006","type":"requirement"},{"id":"AC-001","type":"acceptance-criterion"},{"id":"AC-002","type":"acceptance-criterion"},{"id":"AC-003","type":"acceptance-criterion"},{"id":"AC-004","type":"acceptance-criterion"},{"id":"AC-005","type":"acceptance-criterion"},{"id":"AC-006","type":"acceptance-criterion"},{"id":"AC-007","type":"acceptance-criterion"},{"id":"AC-008","type":"acceptance-criterion"},{"id":"AC-009","type":"acceptance-criterion"},{"id":"A-001","type":"assumption"},{"id":"A-002","type":"assumption"},{"id":"D-001","type":"decision"},{"id":"D-002","type":"decision"},{"id":"D-003","type":"decision"},{"id":"D-004","type":"decision"},{"id":"D-005","type":"decision"},{"id":"INV-001","type":"invariant"},{"id":"INV-002","type":"invariant"}],"tombstones":[]},{"revision":3,"active":[{"id":"R-001","type":"requirement"},{"id":"R-002","type":"requirement"},{"id":"R-003","type":"requirement"},{"id":"R-004","type":"requirement"},{"id":"R-005","type":"requirement"},{"id":"R-006","type":"requirement"},{"id":"AC-001","type":"acceptance-criterion"},{"id":"AC-002","type":"acceptance-criterion"},{"id":"AC-003","type":"acceptance-criterion"},{"id":"AC-004","type":"acceptance-criterion"},{"id":"AC-005","type":"acceptance-criterion"},{"id":"AC-006","type":"acceptance-criterion"},{"id":"AC-007","type":"acceptance-criterion"},{"id":"AC-008","type":"acceptance-criterion"},{"id":"AC-009","type":"acceptance-criterion"},{"id":"A-001","type":"assumption"},{"id":"A-002","type":"assumption"},{"id":"D-001","type":"decision"},{"id":"D-002","type":"decision"},{"id":"D-003","type":"decision"},{"id":"D-004","type":"decision"},{"id":"D-005","type":"decision"},{"id":"D-006","type":"decision"},{"id":"INV-001","type":"invariant"},{"id":"INV-002","type":"invariant"},{"id":"INV-003","type":"invariant"},{"id":"INV-004","type":"invariant"},{"id":"INV-005","type":"invariant"},{"id":"INV-006","type":"invariant"}],"tombstones":[]}]}
  goal_backward_review:
    schema_version: 1
    mode: "sdcorejs-plan:goal-backward"
    stage: spec
    future_gaps: []
  architecture_gate:
    valid: true
    required: false
    status: not-applicable
    signals: []
    bypass: { kind: bounded-bug-fix, rationale: "Internal table field resolver plus call-site swaps in components/table, and an exact @sdcorejs/utils patch bump with no subclass or re-export of utils errors in this library; no public API, persisted data, ownership or cross-repository change." }
    rationale: "Internal table field resolver plus call-site swaps in components/table, and an exact @sdcorejs/utils patch bump with no subclass or re-export of utils errors in this library; no public API, persisted data, ownership or cross-repository change."
  contract_id: table-field-path-fallback
  requirement_id: NSP-5745
  approved_spec_path: ""
  approved_spec_hash: ""
  supersedes: .sdcorejs/specs/angular/2026-10-01-15-12-table-field-path-fallback.md
  target_root: .
  target_root_kind: target-project
  owner_repository_id: sdcorejs-angular
  owner_repository_role: library
  owner_module_id: components/table
  execution_host_repository_id: gitlab.id.vin/mag/sales-platform/portals/portal-ops
  track: angular
  stack_profile: core-ui-angular
  profile_confidence: high
  source_requirement_context: "Port of @sd-angular/core NSP-5745 fix (MR !209, approved spec 2026-09-30-22-30-table-field-path-fallback) plus @sdcorejs/utils 1.2.5 bump (sdcorejs-utils PR #15); user request 2026-10-01 \"Kiểm tra và sửa cho cả sdcorejs/angular\", option 1 include the utils bump."
  acceptance_criteria_count: 9
  manual_criteria_count: 0
  non_goals:
    - Nới lỏng rule path của @sdcorejs/utils.
    - Sửa rowKey, valueField/displayField, forms select/autocomplete, form-generic.
    - Sửa code FilePickerCancelledError ở upload-file, api, excel.
    - Bump version @sdcorejs/angular, release hoặc publish.
    - Sửa portal-ops hoặc Core.
  risks:
    - Fallback đọc key ngoài ý muốn (own data property, chặn prototype).
    - Sót call site đọc theo column.field.
    - v20 đến v22 lệch v19.
    - Consumer kế thừa lỗi utils bị ném lỗi sau 1.2.5.
    - npm install đổi lockfile ngoài @sdcorejs/utils.
  assumptions:
    - A-001 utils 1.2.5 đã publish và chứa brand errorName (confirmed 2026-10-01).
    - A-002 thư viện không kế thừa hay re-export lỗi utils (confirmed).
  redaction_applied: false
  approval:
    approved: false
    approved_at: null
    approval_source: explicit-user-choice
  change_control:
    revision: 2
    supersedes: .sdcorejs/specs/angular/2026-10-01-15-12-table-field-path-fallback.md
    change_reason: "Convergence gate requires an invariant on every validation row (INV-003..INV-006 added) and review R1 moved the CHANGELOG text to the existing [Unreleased] Changed utils bullet (D-006, AC-009 wording). No code change."
```

## Revision 2

Revision 1 (`.sdcorejs/specs/angular/2026-10-01-15-12-table-field-path-fallback.md`) đã được hiện thực và verify bằng lệnh. Revision này không đổi code; chỉ sửa hợp đồng truy vết:
- Gate convergence của `sdcorejs-ship` đòi mỗi dòng validation có ít nhất một invariant. Bốn dòng của AC-001, AC-003, AC-007, AC-009 không có, nên convergence BLOCKED. Thêm INV-003..INV-006.
- Review R1: các bản 19/20/21/22.2.15 đã publish dùng `@sdcorejs/utils` 1.1.4, nên lỗi bảng và lỗi huỷ chọn file chưa từng phát hành. D-006 ghi chúng vào bullet `### Changed` có sẵn thay vì `### Fixed`; AC-009 đổi câu chữ theo D-006.

## Problem & Goals

`@sdcorejs/angular` pin `@sdcorejs/utils` `1.2.4`. Hàm `Utilities.getNestedValue` của utils 1.2 kiểm tra path chặt: segment có khoảng trắng, `*`, hoặc path có khoảng trắng đầu/cuối sẽ ném `UnsafePropertyPathError`. `SdTable` đọc giá trị dòng theo `column.field` bằng hàm này ở 13 chỗ. Trong `TableFormatService.format`, lượt đọc nằm **ngoài** khối try của từng ô (`table-format.service.ts:185`). Chỉ cần một field như vậy là cả lượt đọc bị reject, và bảng hiện vùng lỗi "Không thể tải dữ liệu" dù API trả dữ liệu.

Đây là cùng lỗi NSP-5745 đã sửa ở `@sd-angular/core` (MR !209). Portal-ops tạo cột động từ `headers` của BE, ví dụ `Số phòng ngủ`, `Loại sản phẩm*`. Mọi consumer `@sdcorejs/angular` có field lấy từ dữ liệu động đều gặp lỗi này.

Lỗi thứ hai nằm ở utils. Mỗi entry của utils mang một bản class lỗi riêng, và brand cross-entry từng dựa vào `constructor.name`. Bundler của app đổi tên class trùng, nên `error instanceof FilePickerCancelledError` trả `false` trong bản build. Lỗi này chạm `upload-file.component.ts`, `api.service.ts` và `excel.service.ts`. Utils `1.2.5` (đã publish, PR sdcorejs-utils #15) sửa brand bằng `static errorName`.

Mục tiêu:
- Bảng hiển thị dữ liệu bình thường với các field mà utils 1.2 từ chối.
- Path hợp lệ giữ nguyên hành vi utils 1.2.
- Không mở lại lỗ hổng prototype mà utils 1.2 đã chặn.
- Nâng `@sdcorejs/utils` lên `1.2.5` ở mọi line để `instanceof` lỗi utils đúng trong app đã bundle.

## Requirements

- R-001 — Nếu utils 1.2 từ chối một column field hoặc group field (khoảng trắng, `*`, khoảng trắng đầu/cuối), bảng đọc field đó bằng cách tách theo dấu chấm như utils 1.1, chỉ theo own data property, và không ném lỗi. Nguồn: explicit-user. Trạng thái: active. Owner: sdcorejs-angular / components/table.
- R-002 — Lỗi đọc field không bao giờ biến một lượt đọc thành công thành trạng thái read error; tối đa chỉ làm hỏng ô đó. Nguồn: explicit-user. Trạng thái: active. Owner: components/table.
- R-003 — Field là path hợp lệ theo utils 1.2 giữ đúng ngữ nghĩa `getNestedValue` hiện tại. Nguồn: authoritative-contract. Trạng thái: active. Owner: components/table.
- R-004 — Mọi chỗ bảng đọc giá trị dòng theo `column.field` hoặc group field đều qua một resolver nội bộ: format và lazy-values, desktop cell, group pipe, aggregate, quick search, export, filter local, sort local. Nguồn: explicit-user. Trạng thái: active. Owner: components/table.
- R-005 — `@sdcorejs/utils` pin đúng `1.2.5` ở workspace và library của v19, v20, v21, v22 và ở showcase. Nguồn: explicit-user. Trạng thái: active. Owner: sdcorejs-angular.
- R-006 — v20, v21, v22 sinh từ v19 bằng script sync của repo và giữ đồng bộ. `sd-table.md` và section `[Unreleased]` của CHANGELOG mô tả rule đọc field và việc nâng utils. Nguồn: authoritative-contract. Trạng thái: active. Owner: sdcorejs-angular.

## Decisions

- D-001 — Đọc field như thế nào khi utils 1.2 từ chối? Chọn: port đúng resolver đã duyệt ở Core. Path utils chấp nhận thì trả kết quả `getNestedValue`. Phát hiện path bị từ chối bằng probe `getNestedValue({}, field)`, cache theo field (tối đa 1000 field). Path bị từ chối thì tách theo dấu chấm, chỉ đọc own data property, trả `undefined` khi gặp `__proto__`, `prototype`, `constructor` hoặc object prototype. Không dùng `instanceof UnsafePropertyPathError`. Nguồn: explicit-user. Trạng thái: approved, blocking, scope module. Lý do: cùng lỗi, cùng thiết kế đã review ở Core; hai thư viện giữ một hành vi.
- D-002 — Những lượt đọc nào thay đổi? Chọn: chỉ lượt đọc theo `column.field` và group field; resolver là util nội bộ, không export. Giữ nguyên `rowKey`, `valueField`, `displayField`, `forms/select`, `forms/autocomplete`, pipe hyperlink của form-generic. Trạng thái: approved, blocking, scope module. Lý do: bounded bug fix khớp scope Core; key do dev khai báo nằm ngoài lỗi.
- D-003 — Có gộp việc nâng utils `1.2.5` vào cùng thay đổi? Chọn: có, nâng đúng `1.2.5` ở mọi line và showcase. Trạng thái: approved, blocking, scope repository. Lý do: user đang release utils 1.2.5; một PR sửa cả hai lỗi.
- D-004 — Chứng minh acceptance thế nào? Chọn: mọi AC đều automated; check ở portal nằm ngoài thay đổi này. Trạng thái: approved, blocking, scope repository. Lý do: convergence không nhận evidence manual hoặc deferred (tiền lệ ở spec form-generic của repo).

`format` cũng chuyển lượt đọc value vào khối try của từng ô (như Core). Lỗi bất ngờ chỉ làm ô đó hiện chuỗi rỗng. Mục này thuộc D-001 và R-002.

- D-006 — CHANGELOG ghi fix ở đâu? Chọn: bullet `@sdcorejs/utils` có sẵn trong `[Unreleased]` → `### Changed` (`1.1.4` → `1.2.5`), không thêm mục `### Fixed`. Nguồn: explicit-user (review R1, repair option 1). Trạng thái: approved, blocking, scope repository. Lý do: `npm view` cho thấy 19/20/21/22.2.15 dùng utils 1.1.4; người nâng từ 2.15 chưa từng gặp hai lỗi này.

## Assumptions

- A-001 — `@sdcorejs/utils` `1.2.5` đã publish và chứa brand `errorName`. Nguồn: explicit, độ tin cao, confirmed, non-blocking. Bằng chứng: ngày 2026-10-01 `npm view @sdcorejs/utils version` trả `1.2.5`; `dist/errors.js` của tarball có guard `must declare its own static errorName`; main của sdcorejs-utils có commit `a7624e5` (#15) và release #16. Nếu sai: bump không sửa được `instanceof` cross-entry; phần table không bị ảnh hưởng. Owner: nghiatt15_onemount.
- A-002 — `@sdcorejs/angular` không kế thừa và không re-export class lỗi của utils. Vì vậy rule "subclass phải khai báo `errorName`" của 1.2.5 không đổi public API của thư viện. Nguồn: explicit, độ tin cao, confirmed, non-blocking. Bằng chứng: `git grep` trên origin/main `6e0509ad2` chỉ thấy import `FilePickerCancelledError` để so `instanceof`, không có `extends`. Nếu sai: class con trong thư viện sẽ ném lỗi khi khởi tạo. Cách kiểm: grep lại trên branch và chạy spec upload-file, api, excel.

## Invariants

- INV-001 — Không đường nào của resolver trả object prototype hoặc đọc qua `__proto__`, `prototype`, `constructor`. Bảo vệ R-001, AC-004.
- INV-002 — Public API của `@sdcorejs/angular/components/table` (export, type option/column) không đổi. Bảo vệ R-004, AC-008.
- INV-003 — Lỗi khi đọc field không bao giờ biến lượt đọc thành công của bảng thành trạng thái read error. Bảo vệ AC-001.
- INV-004 — Với path mà `@sdcorejs/utils` chấp nhận, bảng đọc đúng kết quả `Utilities.getNestedValue`. Bảo vệ AC-003.
- INV-005 — Mọi line phát hành và showcase pin và resolve cùng một version `@sdcorejs/utils` chính xác. Bảo vệ AC-007.
- INV-006 — `sd-table.md` và `[Unreleased]` của CHANGELOG mô tả hành vi của bản phát hành tới, không mô tả lỗi chưa từng phát hành. Bảo vệ AC-009.

## Architecture gate classification

- Status: not-applicable
- Signals: none
- Rationale/bypass: `bounded-bug-fix`. Thêm resolver nội bộ và thay call site trong `components/table`, cộng bump patch chính xác `@sdcorejs/utils`. Thư viện không kế thừa hay re-export lỗi utils. Không đổi public API, dữ liệu lưu trữ, ownership hay ranh giới repo.

## Non-goals

- Không nới lỏng rule path của `@sdcorejs/utils`.
- Không đổi cách đọc `rowKey`, `option.valueField`/`option.displayField`, và không sửa `forms/select`, `forms/autocomplete`, form-generic.
- Không đổi code `FilePickerCancelledError` ở upload-file, api, excel; bump utils là đủ.
- Không bump version package `@sdcorejs/angular`, không release, không publish.
- Không sửa portal-ops hoặc Core.

## Architecture

- `resolveFieldValue(source, field)` (internal, `components/table/src/services/field-value.util.ts`), port từ Core:
  1. `source` không phải object, là object prototype, hoặc `field` không phải chuỗi khác rỗng thì trả `undefined`.
  2. Field bị từ chối (probe có cache) thì đi `field.split('.')` theo own data descriptor. Gặp segment prototype, giá trị không traversable, thiếu own property hoặc accessor thì trả `undefined`. Kết quả là object prototype cũng trả `undefined`.
  3. Field được chấp nhận thì `try { return Utilities.getNestedValue(source, field) } catch { return undefined }`.
- Thay 13 lượt đọc theo field trong `components/table/src/`:
  - `components/desktop-cell/desktop-cell.component.ts:44`
  - `pipes/sd-group.pipe.ts:47`
  - `services/table-aggregate.util.ts:51` và `:205`
  - `services/table-export/table-export.service.ts:163`, `:169`, `:186`
  - `services/table-filter/table-quick-search.util.ts:78`
  - `services/table-format/table-format.service.ts:159` (lazy-values) và `:185` (đưa vào try của ô)
  - `services/table-local/table-local.util.ts:48`, `:154`, `:155`
- Signature public không đổi.
- Dependency: `@sdcorejs/utils` `1.2.4` thành `1.2.5` trong `versions/v{19,20,21,22}/package.json`, `versions/v{19..22}/projects/sdcorejs-angular/package.json`, `showcase/package.json`, kèm lockfile tương ứng (`npm install` theo tiền lệ bump #64, #65).

## Stack profile and technology assumptions

- Track: angular
- Stack profile: core-ui-angular (nguồn của `@sdcorejs/angular`)
- Profile evidence: `versions/v19/projects/sdcorejs-angular/package.json` name `@sdcorejs/angular` 19.2.15, dependency `@sdcorejs/utils` 1.2.4; layout multi-version `versions/v19..v22`, v19 là canonical.
- Technology assumptions: npm; Karma + Jasmine ChromeHeadless trong `versions/v19` (`npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=<spec>`); `npm run build` của v19; `npm run sync` và `npm run check:sync` ở root.

## File structure

Trong `versions/v19/projects/sdcorejs-angular/components/table/`:
- `src/services/field-value.util.ts` và `field-value.util.spec.ts` — tạo mới.
- `src/services/table-format/table-format.service.ts` và `.spec.ts` — sửa.
- `src/components/desktop-cell/desktop-cell.component.ts` — sửa.
- `src/pipes/sd-group.pipe.ts` và `.spec.ts` — sửa.
- `src/services/table-aggregate.util.ts` và `.spec.ts` — sửa.
- `src/services/table-filter/table-quick-search.util.ts` và `.spec.ts` — sửa.
- `src/services/table-export/table-export.service.ts` và `.spec.ts` — sửa.
- `src/services/table-local/table-local.util.ts` và `.spec.ts` — sửa.
- `src/table.component.read-state.spec.ts` — sửa (thêm case server).
- `sd-table.md` — sửa dòng `field`.

Ở root và các line:
- `CHANGELOG.md` — sửa bullet `@sdcorejs/utils` trong `[Unreleased]` → `### Changed` (D-006).
- `versions/v{20,21,22}/projects/sdcorejs-angular/**` — sinh lại bằng `npm run sync`, không sửa tay.
- Manifest và lockfile utils ở trên, cùng `SYNC-STATUS.md` nếu script sync ghi lại.

## Acceptance criteria

- AC-001 (automated) — `SdTable` type `server` có cột `Số phòng ngủ` và `Loại sản phẩm*`, `items()` trả dòng có các key đó. Kỳ vọng: `readState().status === 'ready'`, không có vùng read error, ô hiện cả hai giá trị.
- AC-002 (automated) — `TableFormatService.format` với field `Loại sản phẩm*`, `Hướng ban công`, ` Mã `, `a.b c` (lồng), và cột lazy-values có field chứa khoảng trắng. Kỳ vọng: không reject; giá trị hiển thị bằng giá trị nguyên văn hoặc giá trị lồng kiểu cũ; key lazy-values được thu thập.
- AC-003 (automated) — Resolver đọc `id`, `customer.id`, `items[0]` và path lồng không tồn tại. Kỳ vọng: bằng `Utilities.getNestedValue` trên cùng input.
- AC-004 (automated) — Resolver nhận segment prototype, root `Object.prototype`/`Function.prototype`, và own property chứa object prototype. Kỳ vọng: luôn trả `undefined`.
- AC-005 (automated) — Filter và sort local, `SdGroupPipe`, aggregate (column field và group field), quick search và `TableExportService` với field có khoảng trắng. Kỳ vọng: đều dùng giá trị của dòng, không chỗ nào ném lỗi.
- AC-006 (automated) — Resolve một field bị từ chối cho nhiều dòng, và stub `Utilities.getNestedValue` ném lỗi class lạ. Kỳ vọng: probe chỉ gọi `getNestedValue` một lần cho field đó; fallback vẫn trả giá trị nguyên văn.
- AC-007 (automated) — Kiểm manifest workspace, library, showcase và chạy `npm ls @sdcorejs/utils` ở v19, v20, v21, v22, showcase. Kỳ vọng: mọi manifest pin đúng `1.2.5`; mọi `npm ls` resolve `1.2.5`, không lỗi.
- AC-008 (automated) — Chạy `npm run check:sync`, spec table của v19 cùng spec upload-file, api, excel, `npm run build` của v19, và lint các file đã sửa. Kỳ vọng: check:sync pass, spec pass, build thành công, lint không có lỗi mới.
- AC-009 (automated) — Lệnh kiểm cố định trên dòng `field` của `sd-table.md` và bullet `@sdcorejs/utils` trong `[Unreleased]` của `CHANGELOG.md`. Kỳ vọng: `sd-table.md` nêu fallback nguyên văn/kiểu cũ cho path bị từ chối và việc chặn prototype; bullet `### Changed` nâng utils `1.1.4` → `1.2.5`, giữ field có khoảng trắng hoặc `*` hoạt động, ghi 1.2.5 cần cho việc huỷ chọn file trong app bundle và quy tắc `errorName` cho lớp con; `### Fixed` không có mục cho các lỗi chưa phát hành này.

## Risks & mitigations

- **Risk:** fallback đọc key ngoài ý muốn. -> **Mitigation:** chỉ own data property, chặn segment và object prototype (INV-001), spec AC-004.
- **Risk:** sót call site đọc theo `column.field`. -> **Mitigation:** R-004 liệt kê 13 chỗ; plan có bước grep `getNestedValue` trong `components/table` để xác nhận chỉ còn `rowKey`, `valueField`, `displayField`.
- **Risk:** v20 đến v22 lệch v19. -> **Mitigation:** chỉ sửa v19, chạy `npm run sync` rồi `npm run check:sync` (AC-008).
- **Risk:** consumer có class kế thừa lỗi utils bị ném lỗi sau 1.2.5. -> **Mitigation:** ngoài thư viện; ghi trong CHANGELOG mục nâng utils, trỏ tới changeset của utils.
- **Risk:** `npm install` đổi lockfile ngoài `@sdcorejs/utils`. -> **Mitigation:** plan kiểm diff lockfile chỉ chạm entry `@sdcorejs/utils`.

## Out of scope (deferred)

- Release `@sdcorejs/angular` 3.0 chứa fix — theo kế hoạch release hiện có của repo.
- Rule đọc `valueField`/`displayField` và forms select/autocomplete — hoãn tới khi có consumer báo lỗi tương tự.

## Decisions captured during review

- (approved as drafted)

## Skill provenance

sdcorejs-spec revision 2 (approved on attempt 1 / 3)
