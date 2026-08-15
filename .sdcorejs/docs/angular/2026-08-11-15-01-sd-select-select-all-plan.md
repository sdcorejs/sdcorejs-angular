# Plan - sd-select multiple "Chọn tất cả" (showSelectAll) - 2026-08-11 15:01

## Scope

Thêm option "Chọn tất cả" đầu panel `sd-select` multiple, opt-in qua input mới `showSelectAll`, chỉ cho items mảng tĩnh/`Signal<T[]>` (ẩn với `SdSearch` lazy). Tick additive theo search scope, bỏ qua items disabled, không dính `limit` paging. Chi tiết what/why/AC: approved spec `sd-select-select-all-2026-08-11`.

## Execution context

- Track: angular
- Target root kind: target-project
- Stack profile: core-ui-angular
- Coverage approach: TDD (bắt buộc cho `forms/` theo CLAUDE.md v19)
- Parallel candidates: no — một component duy nhất, các task nối tiếp cùng cụm file `forms/select`

```yaml
plan_context:
  source: sdcorejs-plan
  contract_id: sd-select-select-all-2026-08-11
  requirement_id: req-sd-select-select-all
  approved_spec_path: .sdcorejs/specs/angular/2026-08-11-14-54-sd-select-select-all.md
  approved_spec_hash: sha256:v1:818fd41079f33803472dc4962bfe39c0fe081238ab01d72ae992783fa9996a17
  approved_spec_reference:
    repository_id: sdcorejs-angular
    repository_relative_path: .sdcorejs/specs/angular/2026-08-11-14-54-sd-select-select-all.md
    artifact_id: spec-sd-select-select-all-2026-08-11-r1
    revision: 65d5fa258c909b9b505bfc27198a4685490da93b
    approval_hash: sha256:v1:818fd41079f33803472dc4962bfe39c0fe081238ab01d72ae992783fa9996a17
  approved_plan_path: ''
  approved_plan_hash: ''
  supersedes: null
  target_root: c:/Users/nghiatt15_onemount/Documents/sdcorejs/sdcorejs-angular
  target_root_kind: target-project
  owner_repository_id: sdcorejs-angular
  owner_repository_role: library
  owner_module_id: forms/select
  execution_host_repository_id: sdcorejs-angular
  integration_owner_repository_id: sdcorejs-angular
  dependency_order:
    - sdcorejs-angular
  gitlink_updates_in_scope: false
  track: angular
  stack_profile: core-ui-angular
  task_count: 13
  phase_count: 4
  allowed_paths:
    - versions/v19/projects/sdcorejs-angular/forms/select/**
    - versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts
    - versions/v19/projects/sdcorejs-angular/i18n/src/en.ts
    - versions/v19/projects/sdcorejs-angular/i18n/src/zh.ts
    - versions/v19/projects/sdcorejs-angular/i18n/src/ja.ts
    - versions/v19/projects/sdcorejs-angular/i18n/src/ko.ts
    - showcase/src/app/pages/forms/select/select-demo.component.ts
    - CHANGELOG.md
  prohibited_paths:
    - package.json
    - '**/package-lock.json'
    - versions/v19/package.json
    - versions/v20/**
    - versions/v21/**
    - published-pages/**
    - published-docs/**
    - showcase/package.json
  generated_artifacts:
    - versions/v20/projects/sdcorejs-angular/** (qua `npm run sync`, không sửa tay)
    - versions/v21/projects/sdcorejs-angular/** (qua `npm run sync`, không sửa tay)
    - showcase/src/app/docs/generated/example-sources.generated.ts (qua `npm run generate:showcase-examples`)
  docs_artifacts:
    - versions/v19/projects/sdcorejs-angular/forms/select/sd-select.md
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
    not_applicable_reason: null
    project_conventions:
      component_style: Angular 19 standalone + signals-first (input()/computed()/signal()), OnPush, native control flow @if/@for, @let alias cho signal đọc 2+ lần
      folder_convention: mỗi component là secondary entry point forms/<name>/{index.ts,ng-package.json,src/}
      state_convention: signal/computed nội bộ component; formControl (SdFormControl) + valueModel (model()) là state chính của select
      service_data_access_convention: không có service mới; i18n qua inject(I18nService).t('core.<scope>.<key>')
      registration_provider_convention: standalone imports array; MatCheckboxModule ĐÃ có trong imports của SdSelect
      public_api_barrel_convention: index.ts export * from './src/select.component' — input mới tự lộ qua class hiện có, không đổi barrel
      test_convention: Karma + Jasmine, spec cạnh source, chạy qua ng test --include; TDD RED→GREEN bắt buộc cho forms/
      evidence_inspected:
        - versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.ts
        - versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.html
        - versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts
        - versions/v19/CLAUDE.md
        - versions/v19/package.json (scripts)
    component_tree:
      - SdSelect (đã có) — nhánh multiple thêm row select-all inline trong panel template; KHÔNG tạo child component mới
    reuse_decisions:
      - need: checkbox 3 trạng thái cho row select-all; candidate MatCheckbox (MatCheckboxModule đã import sẵn trong SdSelect); decision reuse; reason đúng widget, zero dependency mới
      - need: luật khớp search; candidate StringUtilities.aliasIncludes (đang dùng trong allItems$); decision reuse; reason scope select-all phải khớp filter hiển thị
      - need: đọc value/disabled của item; candidate itemValue()/itemDisabled() hiện có; decision reuse
      - need: search text hiện tại; candidate signal searchText hiện có; decision reuse
    file_decisions:
      - path: versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.ts; decision edit; symbols showSelectAll (input), selectAllVisible/selectAllScope/selectAllState (computed), toggleSelectAll() (method); reason logic thuộc component sở hữu panel
      - path: versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.html; decision edit; symbols row .sd-select-all-row trong nhánh multiple; reason UI panel
      - path: versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.scss; decision edit; symbols .sd-select-all-row; reason look đồng bộ mat-option
    responsibilities:
      - symbol: selectAllScope (computed); responsibility danh sách item enabled khớp searchText trên MẢNG NGUỒN actualItems() (không paging); inputs actualItems+searchText+disabledField; outputs T[]
      - symbol: selectAllState (computed); responsibility checked|indeterminate|unchecked từ scope × value hiện tại; inputs selectAllScope+normalizedValue; outputs union type
      - symbol: toggleSelectAll(); responsibility union/subtract value theo scope rồi mirror formControl+valueModel qua đường onSelectionChange semantics; KHÔNG emit sdChange/sdSelection trực tiếp
    state_owners:
      - SdSelect sở hữu toàn bộ state mới (computed thuần từ state sẵn có; không thêm signal ghi mới)
    service_boundaries: []
    data_flow:
      - actualItems() + searchText() + disabledField → selectAllScope → selectAllState → template checkbox; click → toggleSelectAll() → formControl/valueModel → (đóng panel) sdChange/sdSelection như hiện hành
    declarations_and_registration:
      - Không đổi imports (MatCheckboxModule đã có); không đổi providers
    public_exports:
      - showSelectAll input trên SdSelect (class đã export qua entry point hiện có; không đổi barrel)
    tests:
      - select.component.spec.ts — describe 'select all' phủ AC-001…AC-009, gồm case 120 items/limit 50 và async [validator]
    decomposition_rationale:
      - Row select-all giữ inline trong template (~15 dòng, đọc 3 computed của chính SdSelect); tách child component chỉ thêm indirection, không có reuse site thứ hai
  agent_architecture:
    required: false
    not_applicable_reason: không phải track ai-agent
    schema_version: 1
  verification_strategy:
    package_manager: npm
    scripts_detected:
      - 'root: sync, check:sync, generate:showcase-examples, test:showcase-examples'
      - 'versions/v19: build, test, test:ci, lint, check:i18n, check:i18n-parity'
      - 'showcase: build, start'
    commands_planned:
      - 'versions/v19: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=''**/select/src/select.component.spec.ts'' — RED rồi GREEN cho toàn bộ AC tự động'
      - 'versions/v19: npm run check:i18n-parity — key mới đủ 5 locale'
      - 'versions/v19: npm run build — gate typecheck/ng-packagr'
      - 'root: npm run generate:showcase-examples — regen example-sources sau khi sửa demo'
      - 'root: npm run sync — rollout v19 → v20/v21'
      - 'root: npm run check:sync — verify v20/v21 khớp v19'
    commands_skipped:
      - 'versions/v19 full suite test:ci — chạy khi lên CI/tag; local chạy targeted spec + build là đủ theo convention repo (ghi chú: executor CÓ THỂ chạy nếu muốn chắc)'
      - 'showcase build:prod — không cần cho thay đổi demo section; AC-M01 kiểm bằng ng serve thủ công'
    focused_checks:
      - Karma targeted select.component.spec.ts
      - check:i18n-parity
    broad_checks:
      - npm run build (v19)
      - npm run check:sync (root)
  parallel_candidates:
    allowed: false
    frozen_contract: { path: embedded, hash: '', revision: 1, derived_from_approved_plan_hash: '', supersedes: null }
    units: []
    shared_files:
      - CHANGELOG.md — single owner task 9; risk thấp (thêm dòng Unreleased)
      - showcase/src/app/docs/generated/example-sources.generated.ts — generated, single owner task 11
    conflict_risks:
      - Working tree đang dirty 6 file KHÔNG liên quan (form-generic, keycloak, layout, check-i18n scripts, package.json) trên branch fix/full-scan-review — preflight phải hỏi user chọn hướng xử lý; edits giới hạn trong allowed_paths
  repository_plan:
    schema_version: 1
    integration_owner_repository_id: sdcorejs-angular
    gitlink_updates_in_scope: false
    dependency_order:
      - sdcorejs-angular
    repositories:
      - sdcorejs-angular (library, module forms/select, plan spec-sd-select-select-all-2026-08-11-r1)
    steps:
      - id: step-tests
        action: EDIT
        semantic_scope: module
        owner_repository_id: sdcorejs-angular
        git_roots: [sdcorejs-angular]
        allowed_paths: [versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.spec.ts]
        prohibited_paths: []
        depends_on: []
      - id: step-impl
        action: EDIT
        semantic_scope: module
        owner_repository_id: sdcorejs-angular
        git_roots: [sdcorejs-angular]
        allowed_paths:
          - versions/v19/projects/sdcorejs-angular/forms/select/src/**
          - versions/v19/projects/sdcorejs-angular/i18n/src/*.ts
        prohibited_paths: []
        depends_on: [step-tests]
      - id: step-docs-showcase
        action: EDIT
        semantic_scope: module
        owner_repository_id: sdcorejs-angular
        git_roots: [sdcorejs-angular]
        allowed_paths:
          - versions/v19/projects/sdcorejs-angular/forms/select/sd-select.md
          - CHANGELOG.md
          - showcase/src/app/pages/forms/select/select-demo.component.ts
        prohibited_paths: []
        depends_on: [step-impl]
      - id: step-rollout-verify
        action: VERIFY
        semantic_scope: repository
        owner_repository_id: sdcorejs-angular
        git_roots: [sdcorejs-angular]
        allowed_paths: []
        prohibited_paths: []
        depends_on: [step-docs-showcase]
  finish_tail:
    docs_before_final_branch_ready: true
    verify_before_done: true
    branch_ready_final_gate: true
    no_writes_after_branch_ready: true
  approval:
    approved: false
    approved_at: null
  change_control:
    revision: 1
    supersedes: null
    change_reason: null
```

## Preflight (execute-plan chạy TRƯỚC mọi edit)

- `git status --short`, staged/unstaged diffstat, untracked, branch hiện tại, HEAD.
- Đối chiếu allowed_paths / prohibited_paths ở trên.
- **Đã biết trước:** branch `fix/full-scan-review` đang dirty 6 file không liên quan (`package.json`, `versions/v19/.../form-generic/*`, `keycloak.service.ts`, `layout.service.ts`, `versions/v19/scripts/check-i18n.mjs`, untracked `scripts/check-i18n.test.mjs`). Không file nào trùng allowed_paths. Execution hỏi user: (1) tiếp tục, chỉ sửa file trong plan scope / (2) cho phép đụng file dirty chọn lọc / (3) dừng để dọn. Cân nhắc thêm: feature này có nên nằm branch riêng thay vì `fix/full-scan-review` — hỏi user ở preflight.
- Guard authoring-repo: target-project, pass.

## Tasks

### Phase 1 — RED tests (TDD)

1. EDIT sdcorejs-angular:`versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.spec.ts` — thêm describe `select all`: specs RED cho AC-001 (render row + label i18n), AC-002 (ẩn khi default/single/lazy), AC-003 (tick chọn hết items enabled, fixture 120 items limit 50), AC-004 (untick giữ disabled đã chọn), AC-005 (search additive), AC-006 (checked/indeterminate/unchecked), AC-007 (formControl+valueModel đổi, sdChange/sdSelection chỉ bắn khi đóng panel — spy), AC-008 (primitive + object items), AC-009 (data-autoid). Chạy targeted spec → xác nhận RED đúng lý do (fail vì thiếu feature, không phải lỗi biên dịch fixture).

### Phase 2 — GREEN implementation

2. EDIT sdcorejs-angular:`versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts` (+`en.ts`, `zh.ts`, `ja.ts`, `ko.ts`) — thêm key `core.form.select.selectAll` cạnh cụm `core.form.select.*` hiện có (vi "Chọn tất cả", en "Select all", zh "全选", ja "すべて選択", ko "모두 선택").
3. EDIT sdcorejs-angular:`versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.ts` — input `showSelectAll = input(false, { transform: booleanAttribute })`; computed `selectAllVisible` (showSelectAll && multiple && Array.isArray(actualItems()) && scope.length > 0), `selectAllScope` (items enabled khớp searchText trên mảng nguồn — reuse aliasIncludes/itemValue/itemDisplay/itemDisabled), `selectAllState` ('checked' | 'indeterminate' | 'unchecked'); method `toggleSelectAll()` (union/subtract value theo scope, mirror formControl + valueModel với guard `!==`, KHÔNG `{ emitEvent: false }`, KHÔNG emit sdChange/sdSelection). Dọn field `allSelected` cũ nếu thay thế được (đang dead-ish, chỉ ghi không đọc — xác nhận lúc sửa).
4. EDIT sdcorejs-angular:`versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.html` — row `.sd-select-all-row` trong nhánh multiple, dưới `.c-filter-input-container`, trên options: `mat-checkbox` ([checked]/[indeterminate] từ selectAllState, (change)=toggleSelectAll()), label qua `'core.form.select.selectAll' | sdTranslate`, `[attr.data-autoid]` = `autoId() + '-select-all'` khi có autoId; tuân convention `@let` cho signal đọc 2+ lần.
5. EDIT sdcorejs-angular:`versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.scss` — style `.sd-select-all-row` đồng bộ chiều cao/padding/hover với mat-option, border-bottom phân cách danh sách.
6. VERIFY — `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='**/select/src/select.component.spec.ts'` trong `versions/v19` → toàn bộ spec file GREEN (cả specs cũ). ⚠️ memory repo: dist có thể shadow source — nếu spec resolve qua dist thì `npm run build` trước khi kết luận.
7. VERIFY — `npm run check:i18n-parity` trong `versions/v19` → key mới đủ 5 locale.

### Phase 3 — Docs + showcase (docs trước branch-ready, luật repo: cùng commit với code)

8. EDIT sdcorejs-angular:`versions/v19/projects/sdcorejs-angular/forms/select/sd-select.md` — document input `showSelectAll` (default, điều kiện render, scope/search additive, disabled bỏ qua, không hỗ trợ lazy) + ví dụ.
9. EDIT sdcorejs-angular:`CHANGELOG.md` — thêm bullet dưới `## [Unreleased]`: sd-select multiple `showSelectAll`.
10. EDIT sdcorejs-angular:`showcase/src/app/pages/forms/select/select-demo.component.ts` — demo section mới theo convention: heading tiếng Việt + `[props]="[{ name: 'showSelectAll', value: 'true' }, { name: 'multiple', value: 'true' }]"`, kèm case có item disabled để thấy hành vi bỏ qua.
11. VERIFY — `npm run generate:showcase-examples` (root) → regen `showcase/src/app/docs/generated/example-sources.generated.ts`; `npm run test:showcase-examples` pass.

### Phase 4 — Rollout + gate cuối

12. VERIFY — `npm run build` trong `versions/v19` (gate typecheck ng-packagr).
13. VERIFY — `npm run sync` (root) rollout v19 → v20/v21, rồi `npm run check:sync` xanh. Review diff v20/v21 chỉ chứa thay đổi select/i18n mirror. Sau bước này: finish tail (verify-before-done → branch-ready; KHÔNG ghi file sau branch-ready). AC-M01 (visual showcase `/forms/select` qua `npm start` trong showcase) đánh dấu manual — báo user tự xem hoặc chạy khi user yêu cầu.

## Acceptance mapping

- AC-001 → tasks 1, 2, 3, 4, 6
- AC-002 → tasks 1, 3, 4, 6
- AC-003 → tasks 1, 3, 6
- AC-004 → tasks 1, 3, 6
- AC-005 → tasks 1, 3, 6
- AC-006 → tasks 1, 3, 4, 6
- AC-007 → tasks 1, 3, 6
- AC-008 → tasks 1, 3, 6
- AC-009 → tasks 1, 4, 6
- AC-M01 (manual) → tasks 10, 13

## Verification

- `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='**/select/src/select.component.spec.ts'` (versions/v19)
- `npm run check:i18n-parity` (versions/v19)
- `npm run build` (versions/v19)
- `npm run generate:showcase-examples` + `npm run test:showcase-examples` (root)
- `npm run sync` + `npm run check:sync` (root)
- Manual: showcase `/forms/select` — AC-M01 visual (alignment, hover, panel hẹp/inline)
