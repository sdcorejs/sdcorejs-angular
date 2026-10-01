---
artifact_id: plan-draft-table-field-path-fallback-r2
artifact_kind: execution-doc
change_ref: table-field-path-fallback
source_spec: .sdcorejs/specs/angular/2026-10-01-17-06-table-field-path-fallback.md
source_plan: .sdcorejs/plans/angular/2026-10-01-15-38-table-field-path-fallback.md
commit_policy: with-change
owner: sdcorejs-plan
---
# Plan - SdTable đọc được column field không phải path hợp lệ và nâng @sdcorejs/utils 1.2.5 (revision 2) - 2026-10-01 17:06

Approved spec: `.sdcorejs/specs/angular/2026-10-01-17-06-table-field-path-fallback.md` (`sha256:v1:6c97aad9394339376e4cc959bd979847146a5971c72a55d24e3c17f00ce21d15`, revision 2).
Supersedes plan: `.sdcorejs/plans/angular/2026-10-01-15-38-table-field-path-fallback.md`.
Architecture gate: not-applicable (`bounded-bug-fix`), không có artifact architecture.

## Revision 2

Chỉ sửa truy vết; task, path và lệnh giữ nguyên, và đã được thực thi dưới revision 1 (branch `fix/table-field-path-fallback`).
- Mỗi validation row có một invariant: AC-001 → INV-003, AC-003 → INV-004, AC-007 → INV-005, AC-009 → INV-006.
- TASK-003 enforce INV-004, TASK-004 enforce INV-003, TASK-005 và TASK-007 enforce INV-005, TASK-006 enforce INV-006 (D-006).
- R-001 trỏ thêm TASK-002 (case AC-002).
- Thực thi revision 2: không ghi source; cập nhật execution record, chạy lại verification và convergence trên diff cuối.

## Scope

- Port resolver `resolveFieldValue` đã duyệt ở `@sd-angular/core` (NSP-5745, MR !209) vào `components/table` của v19.
- Thay 13 lượt đọc theo `column.field`/group field. Lượt đọc trong `format` chuyển vào try của từng ô.
- Nâng `@sdcorejs/utils` lên `1.2.5` ở v19, showcase, rồi v20–v22 qua `npm run sync`.
- Ghi `sd-table.md` và mục Fixed trong `[Unreleased]` của CHANGELOG.

## Execution context

- Track: angular
- Target root kind: target-project (`C:/Users/nghiatt15_onemount/Documents/sdcorejs/sdcorejs-angular`)
- Stack profile: core-ui-angular
- Coverage approach: TDD. TASK-001 và TASK-002 viết test đỏ trước TASK-003/004.
- Parallel candidates: không. Mọi task dùng chung runner Karma của v19, và TASK-007 (sync) phụ thuộc mọi thay đổi ở v19.
- Package manager: npm. Lệnh lấy từ script: `versions/v19/package.json` (`build`, `test:ci`), root `package.json` (`sync`, `check:sync`, `lint:phase:release`).
- Lệnh test tập trung: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=<spec>` chạy trong `versions/v19`.

```yaml
plan_context:
  schema_version: 2
  source: sdcorejs-plan
  architecture_gate:
    valid: true
    required: false
    status: not-applicable
    signals: []
    bypass:
      kind: bounded-bug-fix
      rationale: Internal table field resolver plus call-site swaps in components/table, and an exact @sdcorejs/utils patch bump with no subclass or re-export of utils errors in this library; no public API, persisted data, ownership or cross-repository change.
    rationale: Internal table field resolver plus call-site swaps in components/table, and an exact @sdcorejs/utils patch bump with no subclass or re-export of utils errors in this library; no public API, persisted data, ownership or cross-repository change.
    blockers: []
    blocker_messages: []
  architecture_context: null
  decision_coverage:
    schema_version: 1
    revision: 3
    records:
      - {id: R-001, type: requirement, statement: 'A table column or group field that @sdcorejs/utils 1.2 rejects as a property path (whitespace, ''*'', leading/trailing whitespace) resolves with the legacy dot-split own-property lookup instead of throwing.', source: explicit-user, status: active, owner_repository_id: sdcorejs-angular, owner_module_id: components/table, task_refs: [TASK-001, TASK-002, TASK-003, TASK-004]}
      - {id: R-002, type: requirement, statement: A field lookup failure never turns a successful table read into the read-error state; at most it degrades that cell., source: explicit-user, status: active, owner_repository_id: sdcorejs-angular, owner_module_id: components/table, task_refs: [TASK-002, TASK-004, TASK-008]}
      - {id: R-003, type: requirement, statement: Fields that are valid @sdcorejs/utils 1.2 paths keep exactly the current getNestedValue semantics., source: authoritative-contract, status: active, owner_repository_id: sdcorejs-angular, owner_module_id: components/table, task_refs: [TASK-001, TASK-003, TASK-008]}
      - {id: R-004, type: requirement, statement: 'Every table read of a row value by column.field or group field (format and lazy-values, desktop cell, group pipe, aggregate, quick search, export, local filter, local sort) goes through one internal resolver.', source: explicit-user, status: active, owner_repository_id: sdcorejs-angular, owner_module_id: components/table, task_refs: [TASK-002, TASK-004, TASK-008]}
      - {id: R-005, type: requirement, statement: '@sdcorejs/utils is pinned to exactly 1.2.5 in the v19, v20, v21 and v22 workspaces and libraries and in the showcase, so cross-entry instanceof checks such as FilePickerCancelledError work in bundled applications.', source: explicit-user, status: active, owner_repository_id: sdcorejs-angular, owner_module_id: null, task_refs: [TASK-005, TASK-007, TASK-008]}
      - {id: R-006, type: requirement, statement: 'v20, v21 and v22 are derived from v19 with the repository sync script and stay in sync; sd-table.md and the CHANGELOG [Unreleased] section describe the field rule and the utils bump.', source: authoritative-contract, status: active, owner_repository_id: sdcorejs-angular, owner_module_id: null, task_refs: [TASK-006, TASK-007, TASK-008]}
      - {id: AC-001, type: acceptance-criterion, statement: Server table with a whitespace field renders rows., behavior: A type 'server' SdTable with columns 'Số phòng ngủ' and 'Loại sản phẩm*' loads rows keyed by those names., expected_result: 'readState().status is ''ready'', no read-error region, and the row shows both values.', verification_kind: automated, blocking: true, requirement_refs: [R-001, R-002], task_refs: [TASK-002, TASK-004, TASK-008], evidence_refs: [EVIDENCE-002, EVIDENCE-004, EVIDENCE-008]}
      - {id: AC-002, type: acceptance-criterion, statement: TableFormatService.format tolerates invalid-path fields., behavior: 'format() runs over rows with fields ''Loại sản phẩm*'', ''Hướng ban công'', '' Mã '' and ''a.b c'', and over a lazy-values column with a whitespace field.', expected_result: No rejection; display values equal the literal or legacy-nested values and lazy-values keys are collected., verification_kind: automated, blocking: true, requirement_refs: [R-001, R-002], task_refs: [TASK-002, TASK-004, TASK-008], evidence_refs: [EVIDENCE-002, EVIDENCE-004, EVIDENCE-008]}
      - {id: AC-003, type: acceptance-criterion, statement: Valid paths are unchanged., behavior: 'The resolver reads ''id'', ''customer.id'', ''items[0]'' and a missing nested path.', expected_result: Results equal Utilities.getNestedValue for the same input., verification_kind: automated, blocking: true, requirement_refs: [R-003], task_refs: [TASK-001, TASK-003, TASK-008], evidence_refs: [EVIDENCE-001, EVIDENCE-003, EVIDENCE-008]}
      - {id: AC-004, type: acceptance-criterion, statement: Prototype data is never read., behavior: 'The resolver receives prototype-sensitive segments, Object.prototype or Function.prototype roots, and own properties holding prototype objects.', expected_result: Returns undefined in every case., verification_kind: automated, blocking: true, requirement_refs: [R-001], task_refs: [TASK-001, TASK-003, TASK-008], evidence_refs: [EVIDENCE-001, EVIDENCE-003, EVIDENCE-008]}
      - {id: AC-005, type: acceptance-criterion, statement: Every table read path works with whitespace fields., behavior: 'Local filter and sort, SdGroupPipe, aggregate (column and group fields), quick search and TableExportService run with fields that contain whitespace.', expected_result: Each uses the row value and none throws., verification_kind: automated, blocking: true, requirement_refs: [R-001, R-004], task_refs: [TASK-002, TASK-004, TASK-008], evidence_refs: [EVIDENCE-002, EVIDENCE-004, EVIDENCE-008]}
      - {id: AC-006, type: acceptance-criterion, statement: Rejection detection is cached and class-independent., behavior: 'A rejected field is resolved for several rows, and Utilities.getNestedValue is stubbed to throw an error of a foreign class.', expected_result: 'getNestedValue is called once for the rejected field, and the fallback still returns the literal value.', verification_kind: automated, blocking: true, requirement_refs: [R-001, R-004], task_refs: [TASK-001, TASK-003, TASK-008], evidence_refs: [EVIDENCE-001, EVIDENCE-003, EVIDENCE-008]}
      - {id: AC-007, type: acceptance-criterion, statement: utils 1.2.5 is installed on every line., behavior: 'Inspect the workspace, library and showcase manifests and run npm ls @sdcorejs/utils in v19, v20, v21, v22 and showcase.', expected_result: Every manifest pins exactly 1.2.5 and every npm ls resolves 1.2.5 without errors., verification_kind: automated, blocking: true, requirement_refs: [R-005], task_refs: [TASK-005, TASK-007, TASK-008], evidence_refs: [EVIDENCE-005, EVIDENCE-007, EVIDENCE-009]}
      - {id: AC-008, type: acceptance-criterion, statement: Release lines stay in sync and buildable., behavior: 'Run npm run check:sync, the v19 table suite with the upload-file, api and excel specs, the v19 library build and lint for touched files.', expected_result: 'check:sync passes, specs pass, the build succeeds and lint reports no new error.', verification_kind: automated, blocking: true, requirement_refs: [R-002, R-003, R-004, R-005, R-006], task_refs: [TASK-007, TASK-008], evidence_refs: [EVIDENCE-007, EVIDENCE-008]}
      - {id: AC-009, type: acceptance-criterion, statement: Docs describe the field rule and the utils 1.2.5 contract., behavior: 'Search the sd-table.md field row and the [Unreleased] @sdcorejs/utils bullet of CHANGELOG.md.', expected_result: 'sd-table.md explains literal/legacy fallback for rejected paths and prototype rejection; the [Unreleased] ### Changed bullet upgrades @sdcorejs/utils from 1.1.4 to 1.2.5, keeps table fields with spaces or * working, notes that 1.2.5 is needed for file-picker cancel in bundled apps and that subclasses must declare errorName; ### Fixed has no entry for these unreleased regressions.', verification_kind: automated, blocking: true, requirement_refs: [R-006], task_refs: [TASK-006, TASK-008], evidence_refs: [EVIDENCE-006, EVIDENCE-010]}
      - {id: A-001, type: assumption, statement: '@sdcorejs/utils 1.2.5 is published to npm and contains the stable errorName brand.', source: explicit, confidence: high, status: confirmed, blocking: false, evidence_refs: [npm-view-sdcorejs-utils-latest-1.2.5, utils-1.2.5-tarball-errorName, sdcorejs-utils-main-a7624e5], consequence_if_wrong: The dependency bump would not fix cross-entry instanceof; the table tasks are not affected., validation_method: npm view @sdcorejs/utils version returns 1.2.5; dist/errors.js of the 1.2.5 tarball contains the errorName guard., owner: nghiatt15_onemount, rationale: 'Checked on 2026-10-01: latest is 1.2.5 and PR #15 is merged to main and released (#16).', impacted_refs: [R-005]}
      - {id: A-002, type: assumption, statement: '@sdcorejs/angular neither subclasses nor re-exports @sdcorejs/utils error classes, so the 1.2.5 subclass requirement does not change its public API.', source: explicit, confidence: high, status: confirmed, blocking: false, evidence_refs: [git-grep-origin-main-6e0509ad2], consequence_if_wrong: A library subclass would throw on construction after the bump., validation_method: git grep for subclasses and re-exports on the branch; existing specs stay green., owner: nghiatt15_onemount, rationale: No extends of utils errors and no re-export of utils errors in versions/v19., impacted_refs: [R-005]}
      - {id: D-001, type: decision, statement: 'Port the approved Core resolver: getNestedValue for accepted paths, a cached probe getNestedValue({}, field) to detect rejection, and an own-property dot-split fallback that rejects prototype segments and prototype objects.', question: How should the table read a field that utils 1.2 rejects?, selected_value: 'port lib-core-angular resolveFieldValue (probe + cache, own-property fallback, prototype guard)', source: explicit-user, status: approved, blocking: true, scope: module, owner_repository_id: sdcorejs-angular, rationale: Same defect and same approved design as @sd-angular/core NSP-5745; keeps both libraries consistent., supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-001, R-003, AC-002, AC-003, AC-004, AC-006, INV-001], task_refs: [TASK-003, TASK-004]}
      - {id: D-002, type: decision, statement: 'The resolver is internal to components/table and not exported; rowKey, valueField, displayField, select, autocomplete and the form-generic hyperlink pipe keep their current lookups.', question: Which reads change?, selected_value: column and group field reads only; internal util, source: explicit-user, status: approved, blocking: true, scope: module, owner_repository_id: sdcorejs-angular, rationale: Bounded bug fix matching the Core scope; developer-defined keys are outside the defect., supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-004, INV-002], task_refs: [TASK-004]}
      - {id: D-003, type: decision, statement: Bump @sdcorejs/utils to exactly 1.2.5 on every line and the showcase in the same change., question: Ship the utils bump with the table fix?, selected_value: 'yes, same change', source: explicit-user, status: approved, blocking: true, scope: repository, owner_repository_id: sdcorejs-angular, rationale: User is releasing utils 1.2.5; one PR fixes both defects., supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-005, AC-007], task_refs: [TASK-005, TASK-007]}
      - {id: D-004, type: decision, statement: Every acceptance criterion is proven automatically; downstream portal checks stay outside this change., question: How is acceptance proven?, selected_value: automated evidence only, source: explicit-user, status: approved, blocking: true, scope: repository, owner_repository_id: sdcorejs-angular, rationale: Delivery convergence never accepts manual or deferred evidence (repository precedent in the form-generic spec revision)., supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-006, AC-008, AC-009], task_refs: [TASK-008]}
      - {id: D-005, type: decision, statement: 'This change has no authorization boundary; every acceptance criterion is proven by unit/component specs, the library build, sync and dependency checks, and deterministic doc checks.', question: Which validation boundary applies to table-field-path-fallback?, selected_value: none, source: approved-plan, status: approved, blocking: true, scope: repository, owner_repository_id: sdcorejs-angular, rationale: 'Data-lookup fix inside the table plus an exact dependency patch; no server, permission or trust boundary is touched.', supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-001, R-002, R-003, R-004, R-005, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, INV-001, INV-002, INV-003, INV-004, INV-005, INV-006], task_refs: [TASK-008], validation_boundary: {kind: none, source_refs: [R-001, R-002, R-003, R-004, R-005, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, INV-001, INV-002, INV-003, INV-004, INV-005, INV-006]}}
      - {id: D-006, type: decision, statement: 'Published 2.15 releases pin @sdcorejs/utils 1.1.4, so the table and file-picker regressions never shipped; document them in the existing [Unreleased] ### Changed @sdcorejs/utils bullet instead of ### Fixed entries.', question: Where does the CHANGELOG describe the table field fallback and the utils 1.2.5 bump?, selected_value: 'existing [Unreleased] ### Changed @sdcorejs/utils bullet (1.1.4 -> 1.2.5), no ### Fixed entries', source: explicit-user, status: approved, blocking: true, scope: repository, owner_repository_id: sdcorejs-angular, rationale: 'Review R1 (2026-10-01): npm view shows 19/20/21/22.2.15 depend on @sdcorejs/utils 1.1.4; user chose repair option 1.', supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-006, AC-009, INV-006], task_refs: [TASK-006]}
      - {id: INV-001, type: invariant, statement: 'No resolver path returns a prototype object or reads through __proto__, prototype or constructor.', protected_refs: [R-001, AC-004], task_refs: [TASK-001, TASK-003], evidence_refs: [EVIDENCE-001, EVIDENCE-003]}
      - {id: INV-002, type: invariant, statement: The public API of @sdcorejs/angular/components/table (exports and option/column types) is unchanged., protected_refs: [R-004, AC-008], task_refs: [TASK-003, TASK-004, TASK-008], evidence_refs: [EVIDENCE-003, EVIDENCE-004, EVIDENCE-008]}
      - {id: INV-003, type: invariant, statement: A field lookup never turns a successful table read into the read-error state., protected_refs: [AC-001], task_refs: [TASK-004], evidence_refs: [EVIDENCE-004]}
      - {id: INV-004, type: invariant, statement: 'For a path that @sdcorejs/utils accepts, the table reads exactly the Utilities.getNestedValue result.', protected_refs: [AC-003], task_refs: [TASK-003], evidence_refs: [EVIDENCE-003]}
      - {id: INV-005, type: invariant, statement: Every release line and the showcase pin and resolve the same exact @sdcorejs/utils version., protected_refs: [AC-007], task_refs: [TASK-005, TASK-007], evidence_refs: [EVIDENCE-005, EVIDENCE-007]}
      - {id: INV-006, type: invariant, statement: 'sd-table.md and the [Unreleased] CHANGELOG describe the behaviour of the next release, not regressions that never shipped.', protected_refs: [AC-009], task_refs: [TASK-006], evidence_refs: [EVIDENCE-006]}
    history:
      - {revision: 1, active: [{id: R-001, type: requirement}, {id: R-002, type: requirement}, {id: R-003, type: requirement}, {id: R-004, type: requirement}, {id: R-005, type: requirement}, {id: R-006, type: requirement}, {id: AC-001, type: acceptance-criterion}, {id: AC-002, type: acceptance-criterion}, {id: AC-003, type: acceptance-criterion}, {id: AC-004, type: acceptance-criterion}, {id: AC-005, type: acceptance-criterion}, {id: AC-006, type: acceptance-criterion}, {id: AC-007, type: acceptance-criterion}, {id: AC-008, type: acceptance-criterion}, {id: AC-009, type: acceptance-criterion}, {id: A-001, type: assumption}, {id: A-002, type: assumption}, {id: D-001, type: decision}, {id: D-002, type: decision}, {id: D-003, type: decision}, {id: D-004, type: decision}, {id: INV-001, type: invariant}, {id: INV-002, type: invariant}], tombstones: []}
      - {revision: 2, active: [{id: R-001, type: requirement}, {id: R-002, type: requirement}, {id: R-003, type: requirement}, {id: R-004, type: requirement}, {id: R-005, type: requirement}, {id: R-006, type: requirement}, {id: AC-001, type: acceptance-criterion}, {id: AC-002, type: acceptance-criterion}, {id: AC-003, type: acceptance-criterion}, {id: AC-004, type: acceptance-criterion}, {id: AC-005, type: acceptance-criterion}, {id: AC-006, type: acceptance-criterion}, {id: AC-007, type: acceptance-criterion}, {id: AC-008, type: acceptance-criterion}, {id: AC-009, type: acceptance-criterion}, {id: A-001, type: assumption}, {id: A-002, type: assumption}, {id: D-001, type: decision}, {id: D-002, type: decision}, {id: D-003, type: decision}, {id: D-004, type: decision}, {id: D-005, type: decision}, {id: INV-001, type: invariant}, {id: INV-002, type: invariant}], tombstones: []}
      - {revision: 3, active: [{id: R-001, type: requirement}, {id: R-002, type: requirement}, {id: R-003, type: requirement}, {id: R-004, type: requirement}, {id: R-005, type: requirement}, {id: R-006, type: requirement}, {id: AC-001, type: acceptance-criterion}, {id: AC-002, type: acceptance-criterion}, {id: AC-003, type: acceptance-criterion}, {id: AC-004, type: acceptance-criterion}, {id: AC-005, type: acceptance-criterion}, {id: AC-006, type: acceptance-criterion}, {id: AC-007, type: acceptance-criterion}, {id: AC-008, type: acceptance-criterion}, {id: AC-009, type: acceptance-criterion}, {id: A-001, type: assumption}, {id: A-002, type: assumption}, {id: D-001, type: decision}, {id: D-002, type: decision}, {id: D-003, type: decision}, {id: D-004, type: decision}, {id: D-005, type: decision}, {id: D-006, type: decision}, {id: INV-001, type: invariant}, {id: INV-002, type: invariant}, {id: INV-003, type: invariant}, {id: INV-004, type: invariant}, {id: INV-005, type: invariant}, {id: INV-006, type: invariant}], tombstones: []}
  goal_backward_review:
    schema_version: 1
    mode: sdcorejs-plan:goal-backward
    decision_coverage:
      schema_version: 1
      revision: 3
      records: [{id: R-001, type: requirement, statement: 'A table column or group field that @sdcorejs/utils 1.2 rejects as a property path (whitespace, ''*'', leading/trailing whitespace) resolves with the legacy dot-split own-property lookup instead of throwing.', source: explicit-user, status: active, owner_repository_id: sdcorejs-angular, owner_module_id: components/table, task_refs: [TASK-001, TASK-002, TASK-003, TASK-004]}, {id: R-002, type: requirement, statement: A field lookup failure never turns a successful table read into the read-error state; at most it degrades that cell., source: explicit-user, status: active, owner_repository_id: sdcorejs-angular, owner_module_id: components/table, task_refs: [TASK-002, TASK-004, TASK-008]}, {id: R-003, type: requirement, statement: Fields that are valid @sdcorejs/utils 1.2 paths keep exactly the current getNestedValue semantics., source: authoritative-contract, status: active, owner_repository_id: sdcorejs-angular, owner_module_id: components/table, task_refs: [TASK-001, TASK-003, TASK-008]}, {id: R-004, type: requirement, statement: 'Every table read of a row value by column.field or group field (format and lazy-values, desktop cell, group pipe, aggregate, quick search, export, local filter, local sort) goes through one internal resolver.', source: explicit-user, status: active, owner_repository_id: sdcorejs-angular, owner_module_id: components/table, task_refs: [TASK-002, TASK-004, TASK-008]}, {id: R-005, type: requirement, statement: '@sdcorejs/utils is pinned to exactly 1.2.5 in the v19, v20, v21 and v22 workspaces and libraries and in the showcase, so cross-entry instanceof checks such as FilePickerCancelledError work in bundled applications.', source: explicit-user, status: active, owner_repository_id: sdcorejs-angular, owner_module_id: null, task_refs: [TASK-005, TASK-007, TASK-008]}, {id: R-006, type: requirement, statement: 'v20, v21 and v22 are derived from v19 with the repository sync script and stay in sync; sd-table.md and the CHANGELOG [Unreleased] section describe the field rule and the utils bump.', source: authoritative-contract, status: active, owner_repository_id: sdcorejs-angular, owner_module_id: null, task_refs: [TASK-006, TASK-007, TASK-008]}, {id: AC-001, type: acceptance-criterion, statement: Server table with a whitespace field renders rows., behavior: A type 'server' SdTable with columns 'Số phòng ngủ' and 'Loại sản phẩm*' loads rows keyed by those names., expected_result: 'readState().status is ''ready'', no read-error region, and the row shows both values.', verification_kind: automated, blocking: true, requirement_refs: [R-001, R-002], task_refs: [TASK-002, TASK-004, TASK-008], evidence_refs: [EVIDENCE-002, EVIDENCE-004, EVIDENCE-008]}, {id: AC-002, type: acceptance-criterion, statement: TableFormatService.format tolerates invalid-path fields., behavior: 'format() runs over rows with fields ''Loại sản phẩm*'', ''Hướng ban công'', '' Mã '' and ''a.b c'', and over a lazy-values column with a whitespace field.', expected_result: No rejection; display values equal the literal or legacy-nested values and lazy-values keys are collected., verification_kind: automated, blocking: true, requirement_refs: [R-001, R-002], task_refs: [TASK-002, TASK-004, TASK-008], evidence_refs: [EVIDENCE-002, EVIDENCE-004, EVIDENCE-008]}, {id: AC-003, type: acceptance-criterion, statement: Valid paths are unchanged., behavior: 'The resolver reads ''id'', ''customer.id'', ''items[0]'' and a missing nested path.', expected_result: Results equal Utilities.getNestedValue for the same input., verification_kind: automated, blocking: true, requirement_refs: [R-003], task_refs: [TASK-001, TASK-003, TASK-008], evidence_refs: [EVIDENCE-001, EVIDENCE-003, EVIDENCE-008]}, {id: AC-004, type: acceptance-criterion, statement: Prototype data is never read., behavior: 'The resolver receives prototype-sensitive segments, Object.prototype or Function.prototype roots, and own properties holding prototype objects.', expected_result: Returns undefined in every case., verification_kind: automated, blocking: true, requirement_refs: [R-001], task_refs: [TASK-001, TASK-003, TASK-008], evidence_refs: [EVIDENCE-001, EVIDENCE-003, EVIDENCE-008]}, {id: AC-005, type: acceptance-criterion, statement: Every table read path works with whitespace fields., behavior: 'Local filter and sort, SdGroupPipe, aggregate (column and group fields), quick search and TableExportService run with fields that contain whitespace.', expected_result: Each uses the row value and none throws., verification_kind: automated, blocking: true, requirement_refs: [R-001, R-004], task_refs: [TASK-002, TASK-004, TASK-008], evidence_refs: [EVIDENCE-002, EVIDENCE-004, EVIDENCE-008]}, {id: AC-006, type: acceptance-criterion, statement: Rejection detection is cached and class-independent., behavior: 'A rejected field is resolved for several rows, and Utilities.getNestedValue is stubbed to throw an error of a foreign class.', expected_result: 'getNestedValue is called once for the rejected field, and the fallback still returns the literal value.', verification_kind: automated, blocking: true, requirement_refs: [R-001, R-004], task_refs: [TASK-001, TASK-003, TASK-008], evidence_refs: [EVIDENCE-001, EVIDENCE-003, EVIDENCE-008]}, {id: AC-007, type: acceptance-criterion, statement: utils 1.2.5 is installed on every line., behavior: 'Inspect the workspace, library and showcase manifests and run npm ls @sdcorejs/utils in v19, v20, v21, v22 and showcase.', expected_result: Every manifest pins exactly 1.2.5 and every npm ls resolves 1.2.5 without errors., verification_kind: automated, blocking: true, requirement_refs: [R-005], task_refs: [TASK-005, TASK-007, TASK-008], evidence_refs: [EVIDENCE-005, EVIDENCE-007, EVIDENCE-009]}, {id: AC-008, type: acceptance-criterion, statement: Release lines stay in sync and buildable., behavior: 'Run npm run check:sync, the v19 table suite with the upload-file, api and excel specs, the v19 library build and lint for touched files.', expected_result: 'check:sync passes, specs pass, the build succeeds and lint reports no new error.', verification_kind: automated, blocking: true, requirement_refs: [R-002, R-003, R-004, R-005, R-006], task_refs: [TASK-007, TASK-008], evidence_refs: [EVIDENCE-007, EVIDENCE-008]}, {id: AC-009, type: acceptance-criterion, statement: Docs describe the field rule and the utils 1.2.5 contract., behavior: 'Search the sd-table.md field row and the [Unreleased] @sdcorejs/utils bullet of CHANGELOG.md.', expected_result: 'sd-table.md explains literal/legacy fallback for rejected paths and prototype rejection; the [Unreleased] ### Changed bullet upgrades @sdcorejs/utils from 1.1.4 to 1.2.5, keeps table fields with spaces or * working, notes that 1.2.5 is needed for file-picker cancel in bundled apps and that subclasses must declare errorName; ### Fixed has no entry for these unreleased regressions.', verification_kind: automated, blocking: true, requirement_refs: [R-006], task_refs: [TASK-006, TASK-008], evidence_refs: [EVIDENCE-006, EVIDENCE-010]}, {id: A-001, type: assumption, statement: '@sdcorejs/utils 1.2.5 is published to npm and contains the stable errorName brand.', source: explicit, confidence: high, status: confirmed, blocking: false, evidence_refs: [npm-view-sdcorejs-utils-latest-1.2.5, utils-1.2.5-tarball-errorName, sdcorejs-utils-main-a7624e5], consequence_if_wrong: The dependency bump would not fix cross-entry instanceof; the table tasks are not affected., validation_method: npm view @sdcorejs/utils version returns 1.2.5; dist/errors.js of the 1.2.5 tarball contains the errorName guard., owner: nghiatt15_onemount, rationale: 'Checked on 2026-10-01: latest is 1.2.5 and PR #15 is merged to main and released (#16).', impacted_refs: [R-005]}, {id: A-002, type: assumption, statement: '@sdcorejs/angular neither subclasses nor re-exports @sdcorejs/utils error classes, so the 1.2.5 subclass requirement does not change its public API.', source: explicit, confidence: high, status: confirmed, blocking: false, evidence_refs: [git-grep-origin-main-6e0509ad2], consequence_if_wrong: A library subclass would throw on construction after the bump., validation_method: git grep for subclasses and re-exports on the branch; existing specs stay green., owner: nghiatt15_onemount, rationale: No extends of utils errors and no re-export of utils errors in versions/v19., impacted_refs: [R-005]}, {id: D-001, type: decision, statement: 'Port the approved Core resolver: getNestedValue for accepted paths, a cached probe getNestedValue({}, field) to detect rejection, and an own-property dot-split fallback that rejects prototype segments and prototype objects.', question: How should the table read a field that utils 1.2 rejects?, selected_value: 'port lib-core-angular resolveFieldValue (probe + cache, own-property fallback, prototype guard)', source: explicit-user, status: approved, blocking: true, scope: module, owner_repository_id: sdcorejs-angular, rationale: Same defect and same approved design as @sd-angular/core NSP-5745; keeps both libraries consistent., supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-001, R-003, AC-002, AC-003, AC-004, AC-006, INV-001], task_refs: [TASK-003, TASK-004]}, {id: D-002, type: decision, statement: 'The resolver is internal to components/table and not exported; rowKey, valueField, displayField, select, autocomplete and the form-generic hyperlink pipe keep their current lookups.', question: Which reads change?, selected_value: column and group field reads only; internal util, source: explicit-user, status: approved, blocking: true, scope: module, owner_repository_id: sdcorejs-angular, rationale: Bounded bug fix matching the Core scope; developer-defined keys are outside the defect., supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-004, INV-002], task_refs: [TASK-004]}, {id: D-003, type: decision, statement: Bump @sdcorejs/utils to exactly 1.2.5 on every line and the showcase in the same change., question: Ship the utils bump with the table fix?, selected_value: 'yes, same change', source: explicit-user, status: approved, blocking: true, scope: repository, owner_repository_id: sdcorejs-angular, rationale: User is releasing utils 1.2.5; one PR fixes both defects., supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-005, AC-007], task_refs: [TASK-005, TASK-007]}, {id: D-004, type: decision, statement: Every acceptance criterion is proven automatically; downstream portal checks stay outside this change., question: How is acceptance proven?, selected_value: automated evidence only, source: explicit-user, status: approved, blocking: true, scope: repository, owner_repository_id: sdcorejs-angular, rationale: Delivery convergence never accepts manual or deferred evidence (repository precedent in the form-generic spec revision)., supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-006, AC-008, AC-009], task_refs: [TASK-008]}, {id: D-005, type: decision, statement: 'This change has no authorization boundary; every acceptance criterion is proven by unit/component specs, the library build, sync and dependency checks, and deterministic doc checks.', question: Which validation boundary applies to table-field-path-fallback?, selected_value: none, source: approved-plan, status: approved, blocking: true, scope: repository, owner_repository_id: sdcorejs-angular, rationale: 'Data-lookup fix inside the table plus an exact dependency patch; no server, permission or trust boundary is touched.', supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-001, R-002, R-003, R-004, R-005, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, INV-001, INV-002, INV-003, INV-004, INV-005, INV-006], task_refs: [TASK-008], validation_boundary: {kind: none, source_refs: [R-001, R-002, R-003, R-004, R-005, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, INV-001, INV-002, INV-003, INV-004, INV-005, INV-006]}}, {id: D-006, type: decision, statement: 'Published 2.15 releases pin @sdcorejs/utils 1.1.4, so the table and file-picker regressions never shipped; document them in the existing [Unreleased] ### Changed @sdcorejs/utils bullet instead of ### Fixed entries.', question: Where does the CHANGELOG describe the table field fallback and the utils 1.2.5 bump?, selected_value: 'existing [Unreleased] ### Changed @sdcorejs/utils bullet (1.1.4 -> 1.2.5), no ### Fixed entries', source: explicit-user, status: approved, blocking: true, scope: repository, owner_repository_id: sdcorejs-angular, rationale: 'Review R1 (2026-10-01): npm view shows 19/20/21/22.2.15 depend on @sdcorejs/utils 1.1.4; user chose repair option 1.', supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-006, AC-009, INV-006], task_refs: [TASK-006]}, {id: INV-001, type: invariant, statement: 'No resolver path returns a prototype object or reads through __proto__, prototype or constructor.', protected_refs: [R-001, AC-004], task_refs: [TASK-001, TASK-003], evidence_refs: [EVIDENCE-001, EVIDENCE-003]}, {id: INV-002, type: invariant, statement: The public API of @sdcorejs/angular/components/table (exports and option/column types) is unchanged., protected_refs: [R-004, AC-008], task_refs: [TASK-003, TASK-004, TASK-008], evidence_refs: [EVIDENCE-003, EVIDENCE-004, EVIDENCE-008]}, {id: INV-003, type: invariant, statement: A field lookup never turns a successful table read into the read-error state., protected_refs: [AC-001], task_refs: [TASK-004], evidence_refs: [EVIDENCE-004]}, {id: INV-004, type: invariant, statement: 'For a path that @sdcorejs/utils accepts, the table reads exactly the Utilities.getNestedValue result.', protected_refs: [AC-003], task_refs: [TASK-003], evidence_refs: [EVIDENCE-003]}, {id: INV-005, type: invariant, statement: Every release line and the showcase pin and resolve the same exact @sdcorejs/utils version., protected_refs: [AC-007], task_refs: [TASK-005, TASK-007], evidence_refs: [EVIDENCE-005, EVIDENCE-007]}, {id: INV-006, type: invariant, statement: 'sd-table.md and the [Unreleased] CHANGELOG describe the behaviour of the next release, not regressions that never shipped.', protected_refs: [AC-009], task_refs: [TASK-006], evidence_refs: [EVIDENCE-006]}]
      history: [{revision: 1, active: [{id: R-001, type: requirement}, {id: R-002, type: requirement}, {id: R-003, type: requirement}, {id: R-004, type: requirement}, {id: R-005, type: requirement}, {id: R-006, type: requirement}, {id: AC-001, type: acceptance-criterion}, {id: AC-002, type: acceptance-criterion}, {id: AC-003, type: acceptance-criterion}, {id: AC-004, type: acceptance-criterion}, {id: AC-005, type: acceptance-criterion}, {id: AC-006, type: acceptance-criterion}, {id: AC-007, type: acceptance-criterion}, {id: AC-008, type: acceptance-criterion}, {id: AC-009, type: acceptance-criterion}, {id: A-001, type: assumption}, {id: A-002, type: assumption}, {id: D-001, type: decision}, {id: D-002, type: decision}, {id: D-003, type: decision}, {id: D-004, type: decision}, {id: INV-001, type: invariant}, {id: INV-002, type: invariant}], tombstones: []}, {revision: 2, active: [{id: R-001, type: requirement}, {id: R-002, type: requirement}, {id: R-003, type: requirement}, {id: R-004, type: requirement}, {id: R-005, type: requirement}, {id: R-006, type: requirement}, {id: AC-001, type: acceptance-criterion}, {id: AC-002, type: acceptance-criterion}, {id: AC-003, type: acceptance-criterion}, {id: AC-004, type: acceptance-criterion}, {id: AC-005, type: acceptance-criterion}, {id: AC-006, type: acceptance-criterion}, {id: AC-007, type: acceptance-criterion}, {id: AC-008, type: acceptance-criterion}, {id: AC-009, type: acceptance-criterion}, {id: A-001, type: assumption}, {id: A-002, type: assumption}, {id: D-001, type: decision}, {id: D-002, type: decision}, {id: D-003, type: decision}, {id: D-004, type: decision}, {id: D-005, type: decision}, {id: INV-001, type: invariant}, {id: INV-002, type: invariant}], tombstones: []}, {revision: 3, active: [{id: R-001, type: requirement}, {id: R-002, type: requirement}, {id: R-003, type: requirement}, {id: R-004, type: requirement}, {id: R-005, type: requirement}, {id: R-006, type: requirement}, {id: AC-001, type: acceptance-criterion}, {id: AC-002, type: acceptance-criterion}, {id: AC-003, type: acceptance-criterion}, {id: AC-004, type: acceptance-criterion}, {id: AC-005, type: acceptance-criterion}, {id: AC-006, type: acceptance-criterion}, {id: AC-007, type: acceptance-criterion}, {id: AC-008, type: acceptance-criterion}, {id: AC-009, type: acceptance-criterion}, {id: A-001, type: assumption}, {id: A-002, type: assumption}, {id: D-001, type: decision}, {id: D-002, type: decision}, {id: D-003, type: decision}, {id: D-004, type: decision}, {id: D-005, type: decision}, {id: D-006, type: decision}, {id: INV-001, type: invariant}, {id: INV-002, type: invariant}, {id: INV-003, type: invariant}, {id: INV-004, type: invariant}, {id: INV-005, type: invariant}, {id: INV-006, type: invariant}], tombstones: []}]
    goals:
      - {id: G-001, statement: 'SdTable renders and processes rows whose column or group fields @sdcorejs/utils 1.2 rejects as paths, without reopening prototype reads.', task_refs: [TASK-001, TASK-002, TASK-003, TASK-004]}
      - {id: G-002, statement: Every release line and the showcase resolve @sdcorejs/utils 1.2.5., task_refs: [TASK-005, TASK-007]}
      - {id: G-003, statement: Docs describe the change and v20-v22 stay in sync with a green v19 build and specs., task_refs: [TASK-006, TASK-007, TASK-008]}
    tasks:
      - {id: TASK-001, owner_repository_id: sdcorejs-angular, dependencies: [], planned_paths: [versions/v19/projects/sdcorejs-angular/components/table/src/services/field-value.util.spec.ts], planned_evidence: [{id: EVIDENCE-001, record_refs: [R-001, R-003, AC-003, AC-004, AC-006, INV-001]}], justification_refs: [R-001, R-003], enforces_invariant_refs: [INV-001]}
      - {id: TASK-002, owner_repository_id: sdcorejs-angular, dependencies: [], planned_paths: [versions/v19/projects/sdcorejs-angular/components/table/src/table.component.read-state.spec.ts, versions/v19/projects/sdcorejs-angular/components/table/src/services/table-format/table-format.service.spec.ts, versions/v19/projects/sdcorejs-angular/components/table/src/services/table-local/table-local.util.spec.ts, versions/v19/projects/sdcorejs-angular/components/table/src/pipes/sd-group.pipe.spec.ts, versions/v19/projects/sdcorejs-angular/components/table/src/services/table-aggregate.util.spec.ts, versions/v19/projects/sdcorejs-angular/components/table/src/table-quick-search.spec.ts, versions/v19/projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.spec.ts], planned_evidence: [{id: EVIDENCE-002, record_refs: [R-001, R-002, R-004, AC-001, AC-002, AC-005]}], justification_refs: [R-002, R-004, R-001], enforces_invariant_refs: []}
      - {id: TASK-003, owner_repository_id: sdcorejs-angular, dependencies: [TASK-001], planned_paths: [versions/v19/projects/sdcorejs-angular/components/table/src/services/field-value.util.ts], planned_evidence: [{id: EVIDENCE-003, record_refs: [R-001, R-003, AC-003, AC-004, AC-006, D-001, INV-001, INV-002, INV-004]}], justification_refs: [R-001, R-003, D-001], enforces_invariant_refs: [INV-001, INV-002, INV-004]}
      - {id: TASK-004, owner_repository_id: sdcorejs-angular, dependencies: [TASK-002, TASK-003], planned_paths: [versions/v19/projects/sdcorejs-angular/components/table/src/components/desktop-cell/desktop-cell.component.ts, versions/v19/projects/sdcorejs-angular/components/table/src/pipes/sd-group.pipe.ts, versions/v19/projects/sdcorejs-angular/components/table/src/services/table-aggregate.util.ts, versions/v19/projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.ts, versions/v19/projects/sdcorejs-angular/components/table/src/services/table-filter/table-quick-search.util.ts, versions/v19/projects/sdcorejs-angular/components/table/src/services/table-format/table-format.service.ts, versions/v19/projects/sdcorejs-angular/components/table/src/services/table-local/table-local.util.ts], planned_evidence: [{id: EVIDENCE-004, record_refs: [R-001, R-002, R-004, AC-001, AC-002, AC-005, D-001, D-002, INV-002, INV-003]}], justification_refs: [R-001, R-002, R-004, D-001, D-002], enforces_invariant_refs: [INV-002, INV-003]}
      - {id: TASK-005, owner_repository_id: sdcorejs-angular, dependencies: [TASK-004], planned_paths: [versions/v19/package.json, versions/v19/projects/sdcorejs-angular/package.json, versions/v19/package-lock.json, showcase/package.json, showcase/package-lock.json], planned_evidence: [{id: EVIDENCE-005, record_refs: [R-005, AC-007, D-003, INV-005]}], justification_refs: [R-005, D-003], enforces_invariant_refs: [INV-005]}
      - {id: TASK-006, owner_repository_id: sdcorejs-angular, dependencies: [TASK-004], planned_paths: [versions/v19/projects/sdcorejs-angular/components/table/sd-table.md, CHANGELOG.md], planned_evidence: [{id: EVIDENCE-006, record_refs: [R-006, AC-009, INV-006, D-006]}], justification_refs: [R-006, D-006], enforces_invariant_refs: [INV-006]}
      - {id: TASK-007, owner_repository_id: sdcorejs-angular, dependencies: [TASK-005, TASK-006], planned_paths: [versions/v20/package.json, versions/v20/projects/sdcorejs-angular/package.json, versions/v20/package-lock.json, versions/v20/SYNC-STATUS.md, versions/v21/package.json, versions/v21/projects/sdcorejs-angular/package.json, versions/v21/package-lock.json, versions/v21/SYNC-STATUS.md, versions/v22/package.json, versions/v22/projects/sdcorejs-angular/package.json, versions/v22/package-lock.json, versions/v22/SYNC-STATUS.md, versions/v20/projects/sdcorejs-angular/components/table/src/services/field-value.util.spec.ts, versions/v20/projects/sdcorejs-angular/components/table/src/table.component.read-state.spec.ts, versions/v20/projects/sdcorejs-angular/components/table/src/services/table-format/table-format.service.spec.ts, versions/v20/projects/sdcorejs-angular/components/table/src/services/table-local/table-local.util.spec.ts, versions/v20/projects/sdcorejs-angular/components/table/src/pipes/sd-group.pipe.spec.ts, versions/v20/projects/sdcorejs-angular/components/table/src/services/table-aggregate.util.spec.ts, versions/v20/projects/sdcorejs-angular/components/table/src/table-quick-search.spec.ts, versions/v20/projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.spec.ts, versions/v20/projects/sdcorejs-angular/components/table/src/services/field-value.util.ts, versions/v20/projects/sdcorejs-angular/components/table/src/components/desktop-cell/desktop-cell.component.ts, versions/v20/projects/sdcorejs-angular/components/table/src/pipes/sd-group.pipe.ts, versions/v20/projects/sdcorejs-angular/components/table/src/services/table-aggregate.util.ts, versions/v20/projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.ts, versions/v20/projects/sdcorejs-angular/components/table/src/services/table-filter/table-quick-search.util.ts, versions/v20/projects/sdcorejs-angular/components/table/src/services/table-format/table-format.service.ts, versions/v20/projects/sdcorejs-angular/components/table/src/services/table-local/table-local.util.ts, versions/v20/projects/sdcorejs-angular/components/table/sd-table.md, versions/v21/projects/sdcorejs-angular/components/table/src/services/field-value.util.spec.ts, versions/v21/projects/sdcorejs-angular/components/table/src/table.component.read-state.spec.ts, versions/v21/projects/sdcorejs-angular/components/table/src/services/table-format/table-format.service.spec.ts, versions/v21/projects/sdcorejs-angular/components/table/src/services/table-local/table-local.util.spec.ts, versions/v21/projects/sdcorejs-angular/components/table/src/pipes/sd-group.pipe.spec.ts, versions/v21/projects/sdcorejs-angular/components/table/src/services/table-aggregate.util.spec.ts, versions/v21/projects/sdcorejs-angular/components/table/src/table-quick-search.spec.ts, versions/v21/projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.spec.ts, versions/v21/projects/sdcorejs-angular/components/table/src/services/field-value.util.ts, versions/v21/projects/sdcorejs-angular/components/table/src/components/desktop-cell/desktop-cell.component.ts, versions/v21/projects/sdcorejs-angular/components/table/src/pipes/sd-group.pipe.ts, versions/v21/projects/sdcorejs-angular/components/table/src/services/table-aggregate.util.ts, versions/v21/projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.ts, versions/v21/projects/sdcorejs-angular/components/table/src/services/table-filter/table-quick-search.util.ts, versions/v21/projects/sdcorejs-angular/components/table/src/services/table-format/table-format.service.ts, versions/v21/projects/sdcorejs-angular/components/table/src/services/table-local/table-local.util.ts, versions/v21/projects/sdcorejs-angular/components/table/sd-table.md, versions/v22/projects/sdcorejs-angular/components/table/src/services/field-value.util.spec.ts, versions/v22/projects/sdcorejs-angular/components/table/src/table.component.read-state.spec.ts, versions/v22/projects/sdcorejs-angular/components/table/src/services/table-format/table-format.service.spec.ts, versions/v22/projects/sdcorejs-angular/components/table/src/services/table-local/table-local.util.spec.ts, versions/v22/projects/sdcorejs-angular/components/table/src/pipes/sd-group.pipe.spec.ts, versions/v22/projects/sdcorejs-angular/components/table/src/services/table-aggregate.util.spec.ts, versions/v22/projects/sdcorejs-angular/components/table/src/table-quick-search.spec.ts, versions/v22/projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.spec.ts, versions/v22/projects/sdcorejs-angular/components/table/src/services/field-value.util.ts, versions/v22/projects/sdcorejs-angular/components/table/src/components/desktop-cell/desktop-cell.component.ts, versions/v22/projects/sdcorejs-angular/components/table/src/pipes/sd-group.pipe.ts, versions/v22/projects/sdcorejs-angular/components/table/src/services/table-aggregate.util.ts, versions/v22/projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.ts, versions/v22/projects/sdcorejs-angular/components/table/src/services/table-filter/table-quick-search.util.ts, versions/v22/projects/sdcorejs-angular/components/table/src/services/table-format/table-format.service.ts, versions/v22/projects/sdcorejs-angular/components/table/src/services/table-local/table-local.util.ts, versions/v22/projects/sdcorejs-angular/components/table/sd-table.md, versions/v19/SYNC-STATUS.md], planned_evidence: [{id: EVIDENCE-007, record_refs: [R-005, R-006, AC-007, AC-008, D-003, INV-005]}], justification_refs: [R-005, R-006, D-003], enforces_invariant_refs: [INV-005]}
      - {id: TASK-008, owner_repository_id: sdcorejs-angular, dependencies: [TASK-007], planned_paths: [versions/v19/projects/sdcorejs-angular/components/table/index.ts], planned_evidence: [{id: EVIDENCE-008, record_refs: [R-002, R-003, R-004, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-008, D-004, D-005, INV-002]}, {id: EVIDENCE-009, record_refs: [R-005, AC-007]}, {id: EVIDENCE-010, record_refs: [R-006, AC-009]}], justification_refs: [R-002, R-003, R-004, R-005, R-006, D-004, D-005], enforces_invariant_refs: [INV-002]}
    repository_inventory:
      repositories: [{repository_id: sdcorejs-angular, existing_paths: [versions/v19/projects/sdcorejs-angular/components/table/src/table.component.read-state.spec.ts, versions/v19/projects/sdcorejs-angular/components/table/src/services/table-format/table-format.service.spec.ts, versions/v19/projects/sdcorejs-angular/components/table/src/services/table-local/table-local.util.spec.ts, versions/v19/projects/sdcorejs-angular/components/table/src/pipes/sd-group.pipe.spec.ts, versions/v19/projects/sdcorejs-angular/components/table/src/services/table-aggregate.util.spec.ts, versions/v19/projects/sdcorejs-angular/components/table/src/table-quick-search.spec.ts, versions/v19/projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.spec.ts, versions/v19/projects/sdcorejs-angular/components/table/src/components/desktop-cell/desktop-cell.component.ts, versions/v19/projects/sdcorejs-angular/components/table/src/pipes/sd-group.pipe.ts, versions/v19/projects/sdcorejs-angular/components/table/src/services/table-aggregate.util.ts, versions/v19/projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.ts, versions/v19/projects/sdcorejs-angular/components/table/src/services/table-filter/table-quick-search.util.ts, versions/v19/projects/sdcorejs-angular/components/table/src/services/table-format/table-format.service.ts, versions/v19/projects/sdcorejs-angular/components/table/src/services/table-local/table-local.util.ts, versions/v19/package.json, versions/v19/projects/sdcorejs-angular/package.json, versions/v19/package-lock.json, showcase/package.json, showcase/package-lock.json, versions/v19/projects/sdcorejs-angular/components/table/sd-table.md, CHANGELOG.md, versions/v20/package.json, versions/v20/projects/sdcorejs-angular/package.json, versions/v20/package-lock.json, versions/v20/SYNC-STATUS.md, versions/v21/package.json, versions/v21/projects/sdcorejs-angular/package.json, versions/v21/package-lock.json, versions/v21/SYNC-STATUS.md, versions/v22/package.json, versions/v22/projects/sdcorejs-angular/package.json, versions/v22/package-lock.json, versions/v22/SYNC-STATUS.md, versions/v20/projects/sdcorejs-angular/components/table/src/table.component.read-state.spec.ts, versions/v20/projects/sdcorejs-angular/components/table/src/services/table-format/table-format.service.spec.ts, versions/v20/projects/sdcorejs-angular/components/table/src/services/table-local/table-local.util.spec.ts, versions/v20/projects/sdcorejs-angular/components/table/src/pipes/sd-group.pipe.spec.ts, versions/v20/projects/sdcorejs-angular/components/table/src/services/table-aggregate.util.spec.ts, versions/v20/projects/sdcorejs-angular/components/table/src/table-quick-search.spec.ts, versions/v20/projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.spec.ts, versions/v20/projects/sdcorejs-angular/components/table/src/components/desktop-cell/desktop-cell.component.ts, versions/v20/projects/sdcorejs-angular/components/table/src/pipes/sd-group.pipe.ts, versions/v20/projects/sdcorejs-angular/components/table/src/services/table-aggregate.util.ts, versions/v20/projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.ts, versions/v20/projects/sdcorejs-angular/components/table/src/services/table-filter/table-quick-search.util.ts, versions/v20/projects/sdcorejs-angular/components/table/src/services/table-format/table-format.service.ts, versions/v20/projects/sdcorejs-angular/components/table/src/services/table-local/table-local.util.ts, versions/v20/projects/sdcorejs-angular/components/table/sd-table.md, versions/v21/projects/sdcorejs-angular/components/table/src/table.component.read-state.spec.ts, versions/v21/projects/sdcorejs-angular/components/table/src/services/table-format/table-format.service.spec.ts, versions/v21/projects/sdcorejs-angular/components/table/src/services/table-local/table-local.util.spec.ts, versions/v21/projects/sdcorejs-angular/components/table/src/pipes/sd-group.pipe.spec.ts, versions/v21/projects/sdcorejs-angular/components/table/src/services/table-aggregate.util.spec.ts, versions/v21/projects/sdcorejs-angular/components/table/src/table-quick-search.spec.ts, versions/v21/projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.spec.ts, versions/v21/projects/sdcorejs-angular/components/table/src/components/desktop-cell/desktop-cell.component.ts, versions/v21/projects/sdcorejs-angular/components/table/src/pipes/sd-group.pipe.ts, versions/v21/projects/sdcorejs-angular/components/table/src/services/table-aggregate.util.ts, versions/v21/projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.ts, versions/v21/projects/sdcorejs-angular/components/table/src/services/table-filter/table-quick-search.util.ts, versions/v21/projects/sdcorejs-angular/components/table/src/services/table-format/table-format.service.ts, versions/v21/projects/sdcorejs-angular/components/table/src/services/table-local/table-local.util.ts, versions/v21/projects/sdcorejs-angular/components/table/sd-table.md, versions/v22/projects/sdcorejs-angular/components/table/src/table.component.read-state.spec.ts, versions/v22/projects/sdcorejs-angular/components/table/src/services/table-format/table-format.service.spec.ts, versions/v22/projects/sdcorejs-angular/components/table/src/services/table-local/table-local.util.spec.ts, versions/v22/projects/sdcorejs-angular/components/table/src/pipes/sd-group.pipe.spec.ts, versions/v22/projects/sdcorejs-angular/components/table/src/services/table-aggregate.util.spec.ts, versions/v22/projects/sdcorejs-angular/components/table/src/table-quick-search.spec.ts, versions/v22/projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.spec.ts, versions/v22/projects/sdcorejs-angular/components/table/src/components/desktop-cell/desktop-cell.component.ts, versions/v22/projects/sdcorejs-angular/components/table/src/pipes/sd-group.pipe.ts, versions/v22/projects/sdcorejs-angular/components/table/src/services/table-aggregate.util.ts, versions/v22/projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.ts, versions/v22/projects/sdcorejs-angular/components/table/src/services/table-filter/table-quick-search.util.ts, versions/v22/projects/sdcorejs-angular/components/table/src/services/table-format/table-format.service.ts, versions/v22/projects/sdcorejs-angular/components/table/src/services/table-local/table-local.util.ts, versions/v22/projects/sdcorejs-angular/components/table/sd-table.md, versions/v19/SYNC-STATUS.md, versions/v19/projects/sdcorejs-angular/components/table/index.ts], intended_new_paths: [{path: versions/v19/projects/sdcorejs-angular/components/table/src/services/field-value.util.spec.ts, owner_task_id: TASK-001}, {path: versions/v19/projects/sdcorejs-angular/components/table/src/services/field-value.util.ts, owner_task_id: TASK-003}, {path: versions/v20/projects/sdcorejs-angular/components/table/src/services/field-value.util.spec.ts, owner_task_id: TASK-007}, {path: versions/v20/projects/sdcorejs-angular/components/table/src/services/field-value.util.ts, owner_task_id: TASK-007}, {path: versions/v21/projects/sdcorejs-angular/components/table/src/services/field-value.util.spec.ts, owner_task_id: TASK-007}, {path: versions/v21/projects/sdcorejs-angular/components/table/src/services/field-value.util.ts, owner_task_id: TASK-007}, {path: versions/v22/projects/sdcorejs-angular/components/table/src/services/field-value.util.spec.ts, owner_task_id: TASK-007}, {path: versions/v22/projects/sdcorejs-angular/components/table/src/services/field-value.util.ts, owner_task_id: TASK-007}]}]
    critique_history:
      - {round: 1, checker_version: sdcorejs-plan:goal-backward:v1, blockers: [], resolved_blockers: [], unresolved_blockers: []}
      - {round: 2, checker_version: sdcorejs-plan:goal-backward:v1, blockers: [], resolved_blockers: [], unresolved_blockers: []}
  validation_map:
    - invariant_refs: [INV-003]
      risk: data-rendering
      boundary: {kind: none, approval_ref: D-005, source_refs: [R-001, R-002, R-003, R-004, R-005, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, INV-001, INV-002, INV-003, INV-004, INV-005, INV-006]}
      authorization_boundary: false
      levels: [component]
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      status: covered
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
      requirement_id: R-002
      acceptance_criterion_id: AC-001
      case_ids: [case-server-read-whitespace-field-ready]
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/table/src/table.component.read-state.spec.ts
      expected_proof: Server table with fields "Số phòng ngủ" and "Loại sản phẩm*" ends in readState ready and renders both row values.
      evidence_refs: [EVIDENCE-002, EVIDENCE-004, EVIDENCE-008]
    - invariant_refs: [INV-001]
      risk: data-rendering
      boundary: {kind: none, approval_ref: D-005, source_refs: [R-001, R-002, R-003, R-004, R-005, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, INV-001, INV-002, INV-003, INV-004, INV-005, INV-006]}
      authorization_boundary: false
      levels: [unit]
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      status: covered
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
      requirement_id: R-001
      acceptance_criterion_id: AC-002
      case_ids: [case-format-invalid-path-fields, case-format-lazy-values-whitespace-field]
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/table/src/services/table-format/table-format.service.spec.ts
      expected_proof: format() resolves literal and legacy-nested values for rejected fields and collects lazy-values keys without rejecting.
      evidence_refs: [EVIDENCE-001, EVIDENCE-002, EVIDENCE-003, EVIDENCE-004, EVIDENCE-008]
    - invariant_refs: [INV-004]
      risk: data-rendering
      boundary: {kind: none, approval_ref: D-005, source_refs: [R-001, R-002, R-003, R-004, R-005, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, INV-001, INV-002, INV-003, INV-004, INV-005, INV-006]}
      authorization_boundary: false
      levels: [unit]
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      status: covered
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
      requirement_id: R-003
      acceptance_criterion_id: AC-003
      case_ids: [case-resolver-valid-path-parity]
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/table/src/services/field-value.util.spec.ts
      expected_proof: Resolver output equals Utilities.getNestedValue for id, customer.id, items[0] and a missing nested path.
      evidence_refs: [EVIDENCE-001, EVIDENCE-003, EVIDENCE-008]
    - invariant_refs: [INV-001]
      risk: prototype-pollution-read
      boundary: {kind: none, approval_ref: D-005, source_refs: [R-001, R-002, R-003, R-004, R-005, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, INV-001, INV-002, INV-003, INV-004, INV-005, INV-006]}
      authorization_boundary: false
      levels: [unit]
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      status: covered
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
      requirement_id: R-001
      acceptance_criterion_id: AC-004
      case_ids: [case-resolver-rejects-prototype-data]
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/table/src/services/field-value.util.spec.ts
      expected_proof: Resolver returns undefined for prototype segments, prototype roots, own properties holding prototype objects, inherited properties and getters.
      evidence_refs: [EVIDENCE-001, EVIDENCE-003, EVIDENCE-008]
    - invariant_refs: [INV-002]
      risk: data-rendering
      boundary: {kind: none, approval_ref: D-005, source_refs: [R-001, R-002, R-003, R-004, R-005, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, INV-001, INV-002, INV-003, INV-004, INV-005, INV-006]}
      authorization_boundary: false
      levels: [unit]
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      status: covered
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
      requirement_id: R-004
      acceptance_criterion_id: AC-005
      case_ids: [case-local-filter-sort-whitespace-field, case-group-whitespace-field, case-aggregate-whitespace-field, case-quick-search-whitespace-field, case-export-whitespace-field]
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/table/src/services/table-local/table-local.util.spec.ts --include=projects/sdcorejs-angular/components/table/src/pipes/sd-group.pipe.spec.ts --include=projects/sdcorejs-angular/components/table/src/services/table-aggregate.util.spec.ts --include=projects/sdcorejs-angular/components/table/src/table-quick-search.spec.ts --include=projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.spec.ts
      expected_proof: Local filter/sort, group buckets, aggregates, quick search and export use the row value of a whitespace field and none throws.
      evidence_refs: [EVIDENCE-002, EVIDENCE-003, EVIDENCE-004, EVIDENCE-008]
    - invariant_refs: [INV-001]
      risk: data-rendering
      boundary: {kind: none, approval_ref: D-005, source_refs: [R-001, R-002, R-003, R-004, R-005, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, INV-001, INV-002, INV-003, INV-004, INV-005, INV-006]}
      authorization_boundary: false
      levels: [unit]
      command_source: project-doc
      cwd: versions/v19
      evidence_class: UNIT
      automation: automated
      status: covered
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
      requirement_id: R-001
      acceptance_criterion_id: AC-006
      case_ids: [case-probe-cached-once, case-foreign-error-class-fallback]
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/table/src/services/field-value.util.spec.ts
      expected_proof: A rejected field calls getNestedValue once across rows; a foreign error class still falls back to the literal value.
      evidence_refs: [EVIDENCE-001, EVIDENCE-003, EVIDENCE-008]
    - invariant_refs: [INV-005]
      risk: dependency-drift
      boundary: {kind: none, approval_ref: D-005, source_refs: [R-001, R-002, R-003, R-004, R-005, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, INV-001, INV-002, INV-003, INV-004, INV-005, INV-006]}
      authorization_boundary: false
      levels: [integration]
      command_source: project-doc
      cwd: .
      evidence_class: UNIT
      automation: automated
      status: covered
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
      requirement_id: R-005
      acceptance_criterion_id: AC-007
      case_ids: [case-utils-125-every-line]
      planned_command: for d in versions/v19 versions/v20 versions/v21 versions/v22 showcase; do npm --prefix $d ls @sdcorejs/utils; done && node -e "<assert 9 manifests pin @sdcorejs/utils 1.2.5>"
      expected_proof: Every npm ls resolves @sdcorejs/utils@1.2.5 without errors and all 9 manifests pin exactly 1.2.5.
      evidence_refs: [EVIDENCE-005, EVIDENCE-007, EVIDENCE-009]
    - invariant_refs: [INV-002]
      risk: regression
      boundary: {kind: none, approval_ref: D-005, source_refs: [R-001, R-002, R-003, R-004, R-005, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, INV-001, INV-002, INV-003, INV-004, INV-005, INV-006]}
      authorization_boundary: false
      levels: [unit, component, integration]
      command_source: package.json
      cwd: .
      evidence_class: UNIT
      automation: automated
      status: covered
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
      requirement_id: R-006
      acceptance_criterion_id: AC-008
      case_ids: [case-check-sync, case-table-and-utils-consumer-specs, case-v19-build, case-lint-touched]
      planned_command: npm run check:sync && npm --prefix versions/v19 run build && npm run lint:phase:release
      expected_proof: check:sync passes, v19 table plus upload-file/api/excel specs pass, the v19 library build succeeds, lint reports no new error and table index.ts is unchanged.
      evidence_refs: [EVIDENCE-003, EVIDENCE-004, EVIDENCE-007, EVIDENCE-008]
    - invariant_refs: [INV-006]
      risk: documentation-drift
      boundary: {kind: none, approval_ref: D-005, source_refs: [R-001, R-002, R-003, R-004, R-005, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, INV-001, INV-002, INV-003, INV-004, INV-005, INV-006]}
      authorization_boundary: false
      levels: [unit]
      command_source: project-doc
      cwd: .
      evidence_class: UNIT
      automation: automated
      status: covered
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
      requirement_id: R-006
      acceptance_criterion_id: AC-009
      case_ids: [case-docs-field-rule-and-utils-bump]
      planned_command: node -e "<assert the sd-table.md field row and the [Unreleased] @sdcorejs/utils Changed bullet contain the fixed strings and Fixed has no entry for the unreleased regressions>"
      expected_proof: 'sd-table.md field row (v19 and v22) contains getNestedValue, own property and __proto__; the [Unreleased] Changed @sdcorejs/utils bullet upgrades 1.1.4 -> 1.2.5 and covers spaces/* fields, bundled file-picker cancel and errorName; ### Fixed has no entry for these regressions.'
      evidence_refs: [EVIDENCE-006, EVIDENCE-010]
  contract_id: table-field-path-fallback
  requirement_id: NSP-5745
  approved_spec_path: .sdcorejs/specs/angular/2026-10-01-17-06-table-field-path-fallback.md
  approved_spec_hash: sha256:v1:6c97aad9394339376e4cc959bd979847146a5971c72a55d24e3c17f00ce21d15
  approved_spec_reference:
    immutable_identity:
      repository_id: sdcorejs-angular
      repository_relative_path: .sdcorejs/specs/angular/2026-10-01-17-06-table-field-path-fallback.md
      artifact_id: spec-table-field-path-fallback-r2
      revision: 23857013381215b07f497842427e03477365536d
      approval_hash: sha256:v1:6c97aad9394339376e4cc959bd979847146a5971c72a55d24e3c17f00ce21d15
  approved_plan_path: ''
  approved_plan_hash: ''
  supersedes: .sdcorejs/plans/angular/2026-10-01-15-38-table-field-path-fallback.md
  target_root: C:/Users/nghiatt15_onemount/Documents/sdcorejs/sdcorejs-angular
  target_root_kind: target-project
  owner_repository_id: sdcorejs-angular
  owner_repository_role: library
  owner_module_id: components/table
  execution_host_repository_id: gitlab.id.vin/mag/sales-platform/portals/portal-ops
  integration_owner_repository_id: sdcorejs-angular
  dependency_order:
    - sdcorejs-angular:components/table
  gitlink_updates_in_scope: false
  track: angular
  stack_profile: core-ui-angular
  task_count: 8
  phase_count: 6
  allowed_paths:
    - versions/v19/projects/sdcorejs-angular/components/table/src/services/field-value.util.spec.ts
    - versions/v19/projects/sdcorejs-angular/components/table/src/services/field-value.util.ts
    - versions/v19/projects/sdcorejs-angular/components/table/src/table.component.read-state.spec.ts
    - versions/v19/projects/sdcorejs-angular/components/table/src/services/table-format/table-format.service.spec.ts
    - versions/v19/projects/sdcorejs-angular/components/table/src/services/table-local/table-local.util.spec.ts
    - versions/v19/projects/sdcorejs-angular/components/table/src/pipes/sd-group.pipe.spec.ts
    - versions/v19/projects/sdcorejs-angular/components/table/src/services/table-aggregate.util.spec.ts
    - versions/v19/projects/sdcorejs-angular/components/table/src/table-quick-search.spec.ts
    - versions/v19/projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.spec.ts
    - versions/v19/projects/sdcorejs-angular/components/table/src/components/desktop-cell/desktop-cell.component.ts
    - versions/v19/projects/sdcorejs-angular/components/table/src/pipes/sd-group.pipe.ts
    - versions/v19/projects/sdcorejs-angular/components/table/src/services/table-aggregate.util.ts
    - versions/v19/projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.ts
    - versions/v19/projects/sdcorejs-angular/components/table/src/services/table-filter/table-quick-search.util.ts
    - versions/v19/projects/sdcorejs-angular/components/table/src/services/table-format/table-format.service.ts
    - versions/v19/projects/sdcorejs-angular/components/table/src/services/table-local/table-local.util.ts
    - versions/v19/projects/sdcorejs-angular/components/table/sd-table.md
    - versions/v19/package.json
    - versions/v19/projects/sdcorejs-angular/package.json
    - versions/v19/package-lock.json
    - showcase/package.json
    - showcase/package-lock.json
    - versions/v19/SYNC-STATUS.md
    - CHANGELOG.md
    - versions/v20/**
    - versions/v21/**
    - versions/v22/**
    - .sdcorejs/docs/angular/2026-10-01-15-12-table-field-path-fallback-spec.md
    - .sdcorejs/specs/angular/2026-10-01-15-12-table-field-path-fallback.md
    - .sdcorejs/docs/angular/2026-10-01-15-38-table-field-path-fallback-plan.md
    - .sdcorejs/plans/angular/2026-10-01-15-38-table-field-path-fallback.md
    - .sdcorejs/docs/angular/2026-10-01-15-38-table-field-path-fallback-execution.md
    - .sdcorejs/docs/angular/2026-10-01-17-06-table-field-path-fallback-spec.md
    - .sdcorejs/specs/angular/2026-10-01-17-06-table-field-path-fallback.md
    - .sdcorejs/docs/angular/2026-10-01-17-06-table-field-path-fallback-plan.md
    - .sdcorejs/plans/angular/2026-10-01-17-06-table-field-path-fallback.md
  prohibited_paths:
    - package.json
    - package-lock.json
    - versions/v19/projects/sdcorejs-angular/components/table/index.ts
    - versions/v19/projects/sdcorejs-angular/forms/**
    - versions/v19/projects/sdcorejs-angular/components/form-generic/**
    - versions/v19/projects/sdcorejs-angular/components/upload-file/src/upload-file.component.ts
    - versions/v19/projects/sdcorejs-angular/services/**
    - '**/node_modules/**'
    - '**/dist/**'
    - '**/coverage/**'
    - .gitignore
    - .sdcorejs/tasks/**
  generated_artifacts:
    - versions/v20/**
    - versions/v21/**
    - versions/v22/**
    - versions/v19/SYNC-STATUS.md
    - '**/package-lock.json'
  docs_artifacts:
    - versions/v19/projects/sdcorejs-angular/components/table/sd-table.md
    - CHANGELOG.md
  dependency_changes:
    required: true
    packages:
      - '@sdcorejs/utils@1.2.5'
    approval_required: true
    approval_ref: D-003
  env_changes:
    required: false
    files: []
    approval_required: false
  migration_changes:
    required: false
    description: null
    approval_required: false
  frontend_architecture:
    required: false
    conformance_invariant_refs: []
    not_applicable_reason: 'Internal library bug fix: one pure util plus call-site swaps inside existing table services, pipe and desktop cell; no component tree, state owner, provider, registration or public API change.'
  agent_architecture:
    required: false
    conformance_invariant_refs: []
    not_applicable_reason: Not an AI-agent change.
  verification_strategy:
    package_manager: npm
    commands_planned:
      - {command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/table/src/services/field-value.util.spec.ts, cwd: versions/v19, reason: TASK-001 RED (compile error) then TASK-003 GREEN}
      - {command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/table/src/table.component.read-state.spec.ts --include=projects/sdcorejs-angular/components/table/src/services/table-format/table-format.service.spec.ts --include=projects/sdcorejs-angular/components/table/src/services/table-local/table-local.util.spec.ts --include=projects/sdcorejs-angular/components/table/src/pipes/sd-group.pipe.spec.ts --include=projects/sdcorejs-angular/components/table/src/services/table-aggregate.util.spec.ts --include=projects/sdcorejs-angular/components/table/src/table-quick-search.spec.ts --include=projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.spec.ts, cwd: versions/v19, reason: TASK-002 RED then TASK-004 GREEN}
      - {command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/upload-file/src/upload-file.component.spec.ts --include=projects/sdcorejs-angular/services/api/src/api.service.spec.ts --include=projects/sdcorejs-angular/services/excel/src/lib/excel.service.spec.ts, cwd: versions/v19, reason: TASK-005 utils 1.2.5 consumers (A-002)}
      - {command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/table/**/*.spec.ts, cwd: versions/v19, reason: AC-008 table regression suite}
      - {command: npm run build, cwd: versions/v19, reason: AC-008 library build}
      - {command: npm run sync, cwd: ., reason: TASK-007 rollout to v20-v22}
      - {command: npm run check:sync, cwd: ., reason: AC-008 lines in sync}
      - {command: npm run lint:phase:release, cwd: ., reason: AC-008 lint on touched v19 files}
      - {command: 'npm ls @sdcorejs/utils (v19, v20, v21, v22, showcase)', cwd: ., reason: AC-007}
      - {command: git grep -n "getNestedValue" -- versions/v19/projects/sdcorejs-angular/components/table/src ":!*.spec.ts", cwd: ., reason: only rowKey/valueField/displayField reads remain}
      - {command: git diff --exit-code origin/main -- versions/v19/projects/sdcorejs-angular/components/table/index.ts, cwd: ., reason: INV-002 public exports unchanged}
      - {command: npm view @sdcorejs/utils version, cwd: ., reason: A-001 preflight (read-only registry query)}
    commands_skipped:
      - {command: npm --prefix versions/v19 run test:ci, reason: whole-library suite replaced by the table suite and the three utils consumer specs; ship may request it}
      - {command: tests/builds in versions/v20-v22, reason: lines are generated by npm run sync; check:sync proves parity}
      - {command: publish / version bump of @sdcorejs/angular, reason: non-goal}
    checks: focused RED/GREEN specs per task, table suite, utils consumer specs, v19 build, sync parity, touched-file lint, npm ls, docs check; convergence (sdcorejs-convergence:v1) over the final diff
  parallel_candidates:
    allowed: false
    contract: 'Sequential: tasks share the v19 Karma runner and TASK-007 sync depends on every v19 change.'
    shared_files: []
  repository_plan:
    schema_version: 1
    integration_owner_repository_id: sdcorejs-angular
    dependency_order:
      - sdcorejs-angular:components/table
    contract: Single repository (sdcorejs-angular); every mutable step has one Git root.
  finish_tail:
    contract: 'docs_before_final_branch_ready: TASK-006 before TASK-007/008; verify_before_done: sdcorejs-ship after TASK-008; branch_ready_final_gate: sdcorejs-ship branch-ready; no_writes_after_branch_ready: true'
  approval:
    approved: false
    approved_at: null
  change_control:
    revision: 2
    supersedes: .sdcorejs/plans/angular/2026-10-01-15-38-table-field-path-fallback.md
    change_reason: 'Traceability-only revision for spec revision 2: INV-003..INV-006 on every validation row, R-001 -> TASK-002, D-006 CHANGELOG placement. Tasks, paths and commands unchanged; already executed under revision 1.'
```

## Execution preflight (execute-plan chạy trước khi sửa file)

1. `git status --short`, diffstat, untracked, branch, HEAD.
   - Lúc lập plan: đang ở `chore/utils-1.2.4` (`fdfe9e05e`), `origin/main` = `2385701`.
   - `.gitignore` dirty, không thuộc change này: hỏi người dùng trước khi sửa file.
   - Untracked: chỉ có artifact `.sdcorejs` của change này.
2. `git fetch origin`, rồi tạo branch `fix/table-field-path-fallback` từ `origin/main`. Không làm trực tiếp trên `main`.
3. Đối chiếu `allowed_paths` / `prohibited_paths`.
4. Baseline trên `origin/main`, ghi lại trước khi sửa:
   - spec table v19 (`--include=projects/sdcorejs-angular/components/table/**/*.spec.ts`);
   - `npm run check:sync`.
5. `npm view @sdcorejs/utils version` phải trả `1.2.5` (A-001).

## Tasks

Mọi path dưới đây nằm trong `versions/v19/projects/sdcorejs-angular/components/table/` trừ khi ghi khác.

### Phase 1 - RED tests

1. **TASK-001 CREATE** `src/services/field-value.util.spec.ts` — port spec của Core:
   - AC-003: `id`, `customer.id`, `items[0]`, path lồng không tồn tại bằng `Utilities.getNestedValue`.
   - AC-004: segment `__proto__`/`prototype`/`constructor`, root `Object.prototype`/`Function.prototype`, own property chứa object prototype, thuộc tính kế thừa và getter đều trả `undefined`.
   - AC-006: field bị từ chối resolve cho nhiều dòng chỉ gọi `getNestedValue` một lần; field được chấp nhận gọi đúng số lần cần; stub `getNestedValue` ném `new Error('foreign error class')` vẫn fallback.
   - Key nguyên văn có khoảng trắng, `*`, khoảng trắng đầu/cuối; lồng kiểu cũ `a.b c`; source không phải object; field rỗng.
   - RED dự kiến: lỗi compile do thiếu module `./field-value.util` (Karma type-check mọi spec được include).
2. **TASK-002 EDIT** spec hiện có, mỗi file thêm case NSP-5745:
   - `src/table.component.read-state.spec.ts` (AC-001): bảng `server` có cột `Số phòng ngủ`, `Loại sản phẩm*`; `readState().status === 'ready'`, không có vùng read error, ô hiện giá trị.
   - `src/services/table-format/table-format.service.spec.ts` (AC-002): `format()` với `Loại sản phẩm*`, `Hướng ban công`, ` Mã `, `a.b c`, và cột lazy-values có field chứa khoảng trắng.
   - `src/services/table-local/table-local.util.spec.ts`, `src/pipes/sd-group.pipe.spec.ts`, `src/services/table-aggregate.util.spec.ts`, `src/table-quick-search.spec.ts`, `src/services/table-export/table-export.service.spec.ts` (AC-005): filter, sort, group, aggregate (column field và group field), quick search, export với field có khoảng trắng.
   - RED dự kiến: `UnsafePropertyPathError` hoặc giá trị sai trên code hiện tại.

### Phase 2 - GREEN

3. **TASK-003 CREATE** `src/services/field-value.util.ts`:
   - Port nguyên `resolveFieldValue` của Core: probe `Utilities.getNestedValue({}, field)` có cache (`MAX_CACHED_FIELDS = 1000`); fallback `readOwnDotPath` theo own data descriptor; `PROTOTYPE_SEGMENTS`; `isPrototypeObject`.
   - Import `Utilities` từ `@sdcorejs/utils/fns`. Không import `@sdcorejs/utils/errors`.
   - JSDoc nêu NSP-5745 và lý do không dùng `instanceof`.
   - Không export từ `components/table/index.ts` (INV-002).
4. **TASK-004 EDIT** call site, thay `Utilities.getNestedValue(<row>, <field>)` bằng `resolveFieldValue`:
   - `src/components/desktop-cell/desktop-cell.component.ts:44`
   - `src/pipes/sd-group.pipe.ts:47`
   - `src/services/table-aggregate.util.ts:51`, `:205`
   - `src/services/table-export/table-export.service.ts:163`, `:169`, `:186`
   - `src/services/table-filter/table-quick-search.util.ts:78`
   - `src/services/table-format/table-format.service.ts:159` (lazy-values) và `:185`. Lượt đọc ở `:185` chuyển vào try của ô; lỗi bất ngờ thì ô nhận `undefined`.
   - `src/services/table-local/table-local.util.ts:48`, `:154`, `:155`
   - Bỏ import `Utilities` ở file không còn dùng. Giữ nguyên lượt đọc `rowKey`, `valueField`, `displayField`.
   - Chạy lại spec của TASK-001/002: GREEN.

### Phase 3 - Dependency

5. **TASK-005 EDIT** `@sdcorejs/utils` `1.2.4` thành `1.2.5`:
   - `versions/v19/package.json`, `versions/v19/projects/sdcorejs-angular/package.json`, `showcase/package.json`.
   - `npm install --legacy-peer-deps` trong `versions/v19` và `showcase` (tiền lệ #64) để cập nhật `package-lock.json`.
   - Kiểm diff lockfile chỉ chạm entry `@sdcorejs/utils` (version, resolved, integrity) và giữ indent gốc.
   - Chạy spec `components/upload-file/src/upload-file.component.spec.ts`, `services/api/src/api.service.spec.ts`, `services/excel/src/lib/excel.service.spec.ts`: pass với 1.2.5 (A-002).

### Phase 4 - Docs

6. **TASK-006 EDIT** docs:
   - `sd-table.md`, dòng `field` (khoảng dòng 184): path utils chấp nhận thì đọc như `getNestedValue`; path bị từ chối (khoảng trắng, `*`) thì đọc key nguyên văn hoặc tách dấu chấm theo own property; `__proto__`/`prototype`/`constructor` luôn ra rỗng.
   - `CHANGELOG.md`, `[Unreleased]` → `### Changed`, bullet `@sdcorejs/utils` có sẵn (D-006): `1.1.4` → `1.2.5`; sub-bullet field có khoảng trắng hoặc `*` hoạt động như 1.1.x (nêu "Không thể tải dữ liệu" nếu thiếu); ghi 1.2.5 cần cho việc huỷ chọn file trong app bundle; lớp con lỗi utils phải khai báo `static errorName`. Không thêm mục `### Fixed`.

### Phase 5 - Rollout

7. **TASK-007 RUN** `npm run sync` ở root:
   - Sinh lại `versions/v20`, `v21`, `v22` từ v19 (manifest, source, `SYNC-STATUS.md`). Không sửa tay các line này.
   - `npm install --legacy-peer-deps` trong `versions/v20`, `versions/v21`; `npm install` trong `versions/v22` (tiền lệ #64). Kiểm diff lockfile chỉ chạm entry `@sdcorejs/utils`.
   - Nếu sync đổi file ngoài phạm vi change (khác table, manifest, lockfile, `SYNC-STATUS.md`): dừng và báo.

### Phase 6 - Verification

8. **TASK-008 RUN** (không sửa file):
   - `npm run check:sync` (AC-008).
   - Toàn bộ spec table v19 cùng spec upload-file, api, excel (AC-001..AC-006, AC-008).
   - `npm run build` trong `versions/v19` (AC-008).
   - `npm run lint:phase:release` (lint file v19 đã sửa; AC-008).
   - `npm ls @sdcorejs/utils` trong `versions/v19..v22` và `showcase`; `node` kiểm 9 manifest pin `1.2.5` (AC-007).
   - `git grep -n "getNestedValue" -- versions/v19/projects/sdcorejs-angular/components/table/src ":!*.spec.ts"`: chỉ còn `rowKey`, `valueField`, `displayField`.
   - `git diff --exit-code origin/main -- versions/v19/projects/sdcorejs-angular/components/table/index.ts` (INV-002).
   - Kiểm docs cố định (AC-009), một lệnh `node -e` đọc file:
     - dòng `field` của `sd-table.md` (bản v19 và v22) chứa `getNestedValue`, `own property` và `__proto__`;
     - bullet `@sdcorejs/utils` trong `[Unreleased]` → `### Changed` chứa `1.1.4` → `1.2.5`, `'Số phòng ngủ'`, `Không thể tải dữ liệu`, `own properties only`, `__proto__`, `errorName`; `### Fixed` không có mục cho các lỗi chưa phát hành.
   - Convergence (`evaluateConvergence`, mode `feature`) trên diff cuối: `CONVERGED`, rồi seal receipt.

## Acceptance mapping

- AC-001, AC-002, AC-005 -> TASK-002, TASK-004, TASK-008
- AC-003, AC-004, AC-006 -> TASK-001, TASK-003, TASK-008
- AC-007 -> TASK-005, TASK-007, TASK-008
- AC-008 -> TASK-007, TASK-008
- AC-009 -> TASK-006, TASK-008

## Verification

- Focused: spec của TASK-001/002 (RED rồi GREEN); spec upload-file, api, excel sau TASK-005.
- Broad: spec table v19; `npm run build` (v19); `npm run check:sync`; `npm run lint:phase:release`; `npm ls @sdcorejs/utils` ở 5 workspace.
- Skipped:
  - `npm run test:ci` toàn thư viện v19: thay bằng spec table và 3 spec liên quan utils; ship có thể yêu cầu thêm.
  - Test và build ở v20–v22: chỉ là bản sync; `check:sync` chứng minh đồng bộ.
  - Release, bump version `@sdcorejs/angular`, publish: non-goal.

## Finish tail

Docs (TASK-006) chạy trước rollout (TASK-007) để sync mang theo `sd-table.md`. Verification (TASK-008) chạy sau cùng. Sau đó chạy `sdcorejs-ship` verify-before-done, rồi branch-ready. Không ghi file nào sau branch-ready. Commit, push và PR lên GitHub chỉ qua `sdcorejs-git` khi bạn yêu cầu.

## Review decisions

- Goal-backward vòng 1 và vòng 2: không có blocker.
- Coverage revision 2 thêm D-005 (validation boundary `none`); revision 3 thêm D-006 và INV-003..INV-006.
