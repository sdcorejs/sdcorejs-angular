---
artifact_id: plan-sdcorejs-angular-date-range-table-accessibility-v2-4-r1
artifact_kind: plan
schema_version: 1
change_ref: sdcorejs-angular-date-range-table-accessibility-v2-4
source_spec: .sdcorejs/specs/angular/2026-09-01-08-03-date-range-table-accessibility-v2-4.md
source_plan: none
commit_policy: with-change
owner: sdcorejs-plan
name: date-range-table-accessibility-v2-4
description: Executable RED-first plan for SdDateRange and SdTable accessibility release v2.4.
contract_id: sdcorejs-angular-date-range-table-accessibility-v2-4
requirement_id: REQ-SDANGULAR-A11Y-2-4
approved_at: 2026-09-01T02:52:06.220Z
approved_by: null
approval_source: explicit-user-choice
track: angular
sourceSpecPath: .sdcorejs/specs/angular/2026-09-01-08-03-date-range-table-accessibility-v2-4.md
approved_spec_reference:
  repository_id: github.com/sdcorejs/sdcorejs-angular
  repository_relative_path: .sdcorejs/specs/angular/2026-09-01-08-03-date-range-table-accessibility-v2-4.md
  artifact_id: spec-sdcorejs-angular-date-range-table-accessibility-v2-4-r1
  revision: 08091a93f162afa0768de5e932890e4098c89bc9
  approval_hash: "sha256:v1:2d3f657ef97ac716144afcfb17443562943fa59784e4a681863391a61e32f4d6"
parent_repository_id: null
parent_references:
  - repository_id: github.com/sdcorejs/sdcorejs-angular
    artifact_id: spec-sdcorejs-angular-date-range-table-accessibility-v2-4-r1
    artifact_kind: spec
    revision: 08091a93f162afa0768de5e932890e4098c89bc9
    approval_hash: "sha256:v1:2d3f657ef97ac716144afcfb17443562943fa59784e4a681863391a61e32f4d6"
owner_repository_id: github.com/sdcorejs/sdcorejs-angular
owner_repository_role: library
owner_module_id: date-range-table-accessibility
execution_host_repository_id: github.com/sdcorejs/sdcorejs-angular
integration_owner_repository_id: github.com/sdcorejs/sdcorejs-angular
repository_relative_path: .sdcorejs/plans/angular/2026-09-01-08-07-date-range-table-accessibility-v2-4.md
source_revision: 08091a93f162afa0768de5e932890e4098c89bc9
dependency_order:
  - sdcorejs-angular
gitlink_updates_in_scope: false
task_count: 13
phase_count: 6
target_root_kind: target-project
stack_profile: core-ui-angular
approved_spec_hash: "sha256:v1:2d3f657ef97ac716144afcfb17443562943fa59784e4a681863391a61e32f4d6"
allowed_paths:
  - .sdcorejs/docs/angular/2026-09-01-07-42-date-range-table-accessibility-v2-4-spec.md
  - .sdcorejs/specs/angular/2026-09-01-08-03-date-range-table-accessibility-v2-4.md
  - .sdcorejs/docs/angular/2026-09-01-08-07-date-range-table-accessibility-v2-4-plan.md
  - .sdcorejs/plans/angular/2026-09-01-08-07-date-range-table-accessibility-v2-4.md
  - versions/v19/package.json
  - versions/v19/package-lock.json
  - versions/v19/projects/sdcorejs-angular/forms/date-range/src/date-range.component.html
  - versions/v19/projects/sdcorejs-angular/forms/date-range/src/date-range.component.spec.ts
  - versions/v19/projects/sdcorejs-angular/forms/date-range/sd-date-range.md
  - versions/v19/projects/sdcorejs-angular/components/table/src/table.component.html
  - versions/v19/projects/sdcorejs-angular/components/table/src/table.component.scss
  - versions/v19/projects/sdcorejs-angular/components/table/src/table.component.ts
  - versions/v19/projects/sdcorejs-angular/components/table/src/table.component.a11y.spec.ts
  - versions/v19/projects/sdcorejs-angular/components/table/sd-table.md
  - versions/v19/SYNC-STATUS.md
  - versions/v20/package.json
  - versions/v20/projects/sdcorejs-angular/forms/date-range/**
  - versions/v20/projects/sdcorejs-angular/components/table/**
  - versions/v20/SYNC-STATUS.md
  - versions/v21/package.json
  - versions/v21/projects/sdcorejs-angular/forms/date-range/**
  - versions/v21/projects/sdcorejs-angular/components/table/**
  - versions/v21/SYNC-STATUS.md
  - versions/v19/dist/**
  - versions/v19/coverage/**
  - versions/v20/dist/**
  - versions/v20/coverage/**
  - versions/v21/dist/**
  - versions/v21/coverage/**
  - showcase/dist/**
  - showcase/src/app/docs/generated/*.generated.ts
  - published-pages/2.4/**
  - published-pages/pages.json
  - CHANGELOG.md
prohibited_paths:
  - enterprise-portal/**
  - node_modules/**
  - versions/*/node_modules/**
  - node_modules/.patches/**
  - versions/v20/package-lock.json
  - versions/v21/package-lock.json
  - versions/*/projects/sdcorejs-angular/package.json
  - versions/*/projects/sdcorejs-angular/**/index.ts
  - versions/*/projects/sdcorejs-angular/**/public-api.ts
  - .github/**
  - scripts/**
  - published-docs/**
dependency_changes:
  required: true
  approval_required: true
env_changes:
  required: false
  approval_required: false
migration_changes:
  required: false
  approval_required: false
verification_strategy:
  package_manager: npm
  commands_planned:
    - focused Karma RED/GREEN
    - full Karma Angular 19/20/21
    - lint release and release phase
    - build Angular 19/20/21
    - sync parity and script suite
    - build release page 2.4
    - pack and npm registry verification
approval_hash: "sha256:v1:714a0754a52be6e6a3856ee500b33660c419e0f6bd2eed2ad2fbf891bfd308a7"
approved_plan_hash: "sha256:v1:714a0754a52be6e6a3856ee500b33660c419e0f6bd2eed2ad2fbf891bfd308a7"
supersedes: null
change_control:
  revision: 1
  supersedes: null
  change_reason: null
---

# SdDateRange and SdTable accessibility v2.4 - Approved Plan

> Snapshot of what the user approved at the `sdcorejs-plan` gate. Do not edit by hand; re-author through `sdcorejs-plan` if the contract changes.

## Approved contract

# Kế hoạch triển khai accessibility SdDateRange và SdTable v2.4

> Kế hoạch này thực thi snapshot spec `spec-sdcorejs-angular-date-range-table-accessibility-v2-4-r1`. Mọi production edit phải có RED evidence tương ứng trước khi được thực hiện.

## Scope

Sửa autocomplete của hai input trong `SdDateRange` và semantic/focus exposure của sort header trong `SdTable`, giữ nguyên public API, hành vi sort, custom sort icon, filter, resize và multi-header. Thay đổi bắt đầu tại source-of-truth Angular 19, được sync sang Angular 20/21, kiểm thử đầy đủ và phát hành suffix `v2.4`, bao gồm exact version `@sdcorejs/angular@20.2.4`.

## Execution context

- Track: `angular`
- Target root kind: `target-project`
- Stack profile: `core-ui-angular`
- Coverage approach: `TDD` RED-first
- Parallel candidates: không; RED evidence, package lock, sync, release page, merge và tag là chuỗi tuần tự dùng chung state.
- Project summary: stale; chỉ dùng các convention còn được source/config hiện tại xác nhận.

```yaml
plan_context:
  source: sdcorejs-plan
  contract_id: sdcorejs-angular-date-range-table-accessibility-v2-4
  requirement_id: REQ-SDANGULAR-A11Y-2-4
  approved_spec_path: .sdcorejs/specs/angular/2026-09-01-08-03-date-range-table-accessibility-v2-4.md
  approved_spec_hash: sha256:v1:2d3f657ef97ac716144afcfb17443562943fa59784e4a681863391a61e32f4d6
  approved_spec_reference:
    repository_id: github.com/sdcorejs/sdcorejs-angular
    repository_relative_path: .sdcorejs/specs/angular/2026-09-01-08-03-date-range-table-accessibility-v2-4.md
    artifact_id: spec-sdcorejs-angular-date-range-table-accessibility-v2-4-r1
    revision: 08091a93f162afa0768de5e932890e4098c89bc9
    approval_hash: sha256:v1:2d3f657ef97ac716144afcfb17443562943fa59784e4a681863391a61e32f4d6
  approved_plan_path: ''
  approved_plan_hash: ''
  supersedes: null
  target_root: .
  target_root_kind: target-project
  owner_repository_id: github.com/sdcorejs/sdcorejs-angular
  owner_repository_role: library
  owner_module_id: date-range-table-accessibility
  execution_host_repository_id: github.com/sdcorejs/sdcorejs-angular
  integration_owner_repository_id: github.com/sdcorejs/sdcorejs-angular
  dependency_order:
    - sdcorejs-angular
  gitlink_updates_in_scope: false
  track: angular
  stack_profile: core-ui-angular
  task_count: 13
  phase_count: 6
  allowed_paths:
    - .sdcorejs/docs/angular/2026-09-01-07-42-date-range-table-accessibility-v2-4-spec.md
    - .sdcorejs/specs/angular/2026-09-01-08-03-date-range-table-accessibility-v2-4.md
    - .sdcorejs/docs/angular/2026-09-01-08-07-date-range-table-accessibility-v2-4-plan.md
    - .sdcorejs/plans/angular/2026-09-01-08-07-date-range-table-accessibility-v2-4.md
    - versions/v19/package.json
    - versions/v19/package-lock.json
    - versions/v19/projects/sdcorejs-angular/forms/date-range/src/date-range.component.html
    - versions/v19/projects/sdcorejs-angular/forms/date-range/src/date-range.component.spec.ts
    - versions/v19/projects/sdcorejs-angular/forms/date-range/sd-date-range.md
    - versions/v19/projects/sdcorejs-angular/components/table/src/table.component.html
    - versions/v19/projects/sdcorejs-angular/components/table/src/table.component.scss
    - versions/v19/projects/sdcorejs-angular/components/table/src/table.component.ts
    - versions/v19/projects/sdcorejs-angular/components/table/src/table.component.a11y.spec.ts
    - versions/v19/projects/sdcorejs-angular/components/table/sd-table.md
    - versions/v19/SYNC-STATUS.md
    - versions/v20/package.json
    - versions/v20/projects/sdcorejs-angular/forms/date-range/**
    - versions/v20/projects/sdcorejs-angular/components/table/**
    - versions/v20/SYNC-STATUS.md
    - versions/v21/package.json
    - versions/v21/projects/sdcorejs-angular/forms/date-range/**
    - versions/v21/projects/sdcorejs-angular/components/table/**
    - versions/v21/SYNC-STATUS.md
    - versions/v19/dist/**
    - versions/v19/coverage/**
    - versions/v20/dist/**
    - versions/v20/coverage/**
    - versions/v21/dist/**
    - versions/v21/coverage/**
    - showcase/dist/**
    - showcase/src/app/docs/generated/*.generated.ts
    - published-pages/2.4/**
    - published-pages/pages.json
    - CHANGELOG.md
  prohibited_paths:
    - enterprise-portal/**
    - node_modules/**
    - versions/*/node_modules/**
    - node_modules/.patches/**
    - versions/v20/package-lock.json
    - versions/v21/package-lock.json
    - versions/*/projects/sdcorejs-angular/package.json
    - versions/*/projects/sdcorejs-angular/**/index.ts
    - versions/*/projects/sdcorejs-angular/**/public-api.ts
    - .github/**
    - scripts/**
    - published-docs/**
  generated_artifacts:
    - versions/v20/projects/sdcorejs-angular/forms/date-range/**
    - versions/v20/projects/sdcorejs-angular/components/table/**
    - versions/v21/projects/sdcorejs-angular/forms/date-range/**
    - versions/v21/projects/sdcorejs-angular/components/table/**
    - versions/v20/package.json
    - versions/v21/package.json
    - versions/v*/SYNC-STATUS.md
    - showcase/src/app/docs/generated/*.generated.ts
    - published-pages/2.4/**
    - published-pages/pages.json
    - versions/v*/dist/**
    - versions/v*/coverage/**
    - showcase/dist/**
  docs_artifacts:
    - .sdcorejs/docs/angular/2026-09-01-07-42-date-range-table-accessibility-v2-4-spec.md
    - .sdcorejs/specs/angular/2026-09-01-08-03-date-range-table-accessibility-v2-4.md
    - .sdcorejs/docs/angular/2026-09-01-08-07-date-range-table-accessibility-v2-4-plan.md
    - .sdcorejs/plans/angular/2026-09-01-08-07-date-range-table-accessibility-v2-4.md
    - versions/v19/projects/sdcorejs-angular/forms/date-range/sd-date-range.md
    - versions/v19/projects/sdcorejs-angular/components/table/sd-table.md
    - CHANGELOG.md
  dependency_changes:
    required: true
    packages:
      - axe-core (development/test dependency only, exact resolution locked in versions/v19/package-lock.json)
    approval_required: true
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
      component_style: Angular standalone OnPush components with signal inputs/models and Angular block template control flow
      folder_convention: implementation/template/style/spec/docs colocated under each secondary package entry point
      state_convention: existing SdDateRange controls and SdTable signals/MatSort own state; no new facade or duplicated state
      service_data_access_convention: existing SdTable item callback and request mapping remain unchanged; no new service
      registration_provider_convention: existing standalone imports and Angular Material directives; no new provider
      public_api_barrel_convention: existing index.ts and package entry points remain unchanged
      test_convention: colocated Jasmine component specs in Karma/real ChromeHeadlessCI
      evidence_inspected:
        - AGENTS.md
        - versions/v19/angular.json
        - versions/v19/package.json
        - versions/v19/projects/sdcorejs-angular/forms/date-range/src/date-range.component.*
        - versions/v19/projects/sdcorejs-angular/components/table/src/table.component.*
        - versions/v19/projects/sdcorejs-angular/components/table/src/directives/sd-column-resize.directive.*
        - versions/v19/projects/sdcorejs-angular/components/table/src/models/table-option-sort.model.ts
        - .github/workflows/ci.yml
        - .github/workflows/publish-npm.yml
    component_tree:
      - SdDateRange -> mat-date-range-input -> matStartDate input + matEndDate input + suffix trigger + inline error
      - SdTable -> native table/matSort -> native th -> title-only sortable columnheader host + sibling inline filter + resize directive
      - SdTable grouped header -> plain parent th + eligible sortable leaf title hosts
    reuse_decisions:
      - extend SdDateRange template in forms/date-range; preserve all public signals, controls and Material bindings
      - extend SdTable title host in components/table; reuse MatSortHeader and existing custom background icon
      - reuse existing SdColumnResizeDirective and filter template as siblings outside the sort activation host
      - add a feature-local table accessibility spec because its semantic matrix is cohesive and the existing main spec is already broad
      - extend the existing date-range accessibility block instead of creating a duplicate host
      - add axe-core only to the workspace test toolchain; do not export or bundle it
    file_decisions:
      - date-range.component.spec.ts: edit with exact start/end autocomplete RED regression
      - table.component.a11y.spec.ts: create exhaustive semantic/behavior/Axe fixture suite
      - date-range.component.html: edit one invalid autocomplete binding after RED
      - table.component.html and, only if needed, table.component.scss/table.component.ts: edit the internal title host after RED
      - component markdown and CHANGELOG: document consumer-visible accessibility guarantees/release
      - v20/v21 mirrors and release page: generate only through repository scripts
    responsibilities:
      - SdDateRange owns valid browser autocomplete metadata for both range endpoints
      - SdTable owns when MatSortHeader exists, semantic aria-sort placement, sort activation, and title/filter/resize boundaries
      - MatSortHeader owns sort state and keyboard behavior only on the title host
      - existing SdTable SCSS owns the single visible custom sort indicator and hides the Material arrow
    state_owners:
      - SdDateRange FormControls keep endpoint values/validation
      - MatSort and MatSortHeader keep active/direction state only while sorting is enabled
      - SdTable option signal remains the single source for enabled/sortable/filter/resize configuration
    service_boundaries:
      - symbol: none
        scope: component
    data_flow:
      - SdDateRange public inputs -> existing controls -> two native inputs with static autocomplete=off
      - SdTable option -> conditional title-only MatSortHeader -> MatSort sortChange -> existing reload/request order mapping
      - inline filter and resize events stay outside the sort activation host
    declarations_and_registration:
      - no public declarations, providers, routes, barrels or exports change
      - axe-core is imported only by the new Jasmine spec
    public_exports:
      - none; selectors, inputs, outputs, types and secondary entry points remain unchanged
    tests:
      - exact date-range token test for both endpoints
      - disabled/omitted/enabled/mixed-column sort instantiation and semantic tests
      - mouse, Enter and Space sorting with request-shape/duplicate-event checks
      - custom title, filter isolation, multi-header and resize contract tests
      - real-browser computed-style checks preventing double visible sort icons
      - unsuppressed Axe WCAG 2.1 A/AA scans for enabled and disabled fixtures
    decomposition_rationale:
      - production DOM remains inline because extracting a wrapper would add no ownership boundary and could change public/CSS behavior
      - the table accessibility test fixture is separated because it owns an independent semantic and interaction matrix
      - no new shared abstraction, service, input or output is justified
  agent_architecture:
    required: false
    not_applicable_reason: no AI agent work
    schema_version: 1
  verification_strategy:
    package_manager: npm
    scripts_detected:
      - versions/v19 test
      - versions/v19 test:ci
      - versions/v19 lint
      - versions/v19 build
      - root sync
      - root check:sync
      - root lint:release
      - root test:scripts
      - root build:page
    commands_planned:
      - npm --prefix versions/v19 install --save-dev axe-core
      - npm --prefix versions/v19 test -- --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/forms/date-range/src/date-range.component.spec.ts --include=projects/sdcorejs-angular/components/table/src/table.component.a11y.spec.ts
      - npm run sync
      - npm run check:sync
      - npm --prefix versions/v19 run test:ci
      - npm --prefix versions/v20 install --legacy-peer-deps --package-lock=false
      - npm --prefix versions/v20 test -- --watch=false --browsers=ChromeHeadlessCI
      - npm --prefix versions/v21 install --legacy-peer-deps --package-lock=false
      - npm --prefix versions/v21 test -- --watch=false --browsers=ChromeHeadlessCI
      - npm run lint:release
      - npm run lint:phase:release
      - npm --prefix versions/v19 run build
      - npm --prefix versions/v20 run build
      - npm --prefix versions/v21 run build
      - npm run test:scripts
      - npm run build:page -- --suffix 2.4
      - npm --prefix versions/v20 run pack
      - npm view @sdcorejs/angular@20.2.4 version
      - npm pack @sdcorejs/angular@20.2.4
    commands_skipped:
      - root npm test: no root test script; package and script suites are invoked through their discovered owning scripts
      - npm ci in v20/v21: repository documents stale major-specific locks and release workflow intentionally uses npm install --legacy-peer-deps
    focused_checks:
      - record expected RED failures before any template/style implementation edit
      - inspect By.directive(MatSortHeader), aria-sort hosts, roles, focusability and accessible names
      - exercise mouse/Enter/Space, inline filter isolation, multi-header, resize and custom-title fixtures
      - assert computed Material arrow display and custom icon background across unsorted/ascending/descending states
      - run axe with runOnly tags wcag2a, wcag2aa, wcag21a and wcag21aa, without disableRules/exclude/result filtering
    broad_checks:
      - full Karma suites for Angular 19, 20 and 21; v19 includes coverage thresholds
      - lint and build for all three maintained Angular lines
      - generated mirror parity and root script suite
      - static release page build and tarball content/dependency inspection
      - PR checks, tag release workflow, npm view and registry tarball verification
  parallel_candidates:
    allowed: false
    frozen_contract:
      path: .sdcorejs/specs/angular/2026-09-01-08-03-date-range-table-accessibility-v2-4.md
      hash: sha256:v1:2d3f657ef97ac716144afcfb17443562943fa59784e4a681863391a61e32f4d6
      revision: 1
      derived_from_approved_plan_hash: null
      supersedes: null
    units: []
    shared_files:
      - versions/v19/package-lock.json; single sequential owner
      - generated v20/v21 mirrors; root sync is the only writer
      - CHANGELOG.md and published-pages/2.4; release phase only
    conflict_risks:
      - RED tests and implementation touch the same component contracts
      - sync mirrors canonical source and would overwrite direct generated edits
      - tag workflow requires v2.4 to point at current origin/main
  repository_plan:
    schema_version: 1
    integration_owner_repository_id: github.com/sdcorejs/sdcorejs-angular
    gitlink_updates_in_scope: false
    dependency_order:
      - sdcorejs-angular
    repositories:
      - repository_id: github.com/sdcorejs/sdcorejs-angular
        role: library
        module_id: date-range-table-accessibility
        plan_artifact_id: plan-sdcorejs-angular-date-range-table-accessibility-v2-4-r1
    steps:
      - id: preflight-and-test-dependency
        action: EDIT
        semantic_scope: repository
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        git_roots: [github.com/sdcorejs/sdcorejs-angular]
        allowed_paths: [versions/v19/package.json, versions/v19/package-lock.json]
        prohibited_paths: [node_modules/**, versions/*/node_modules/**]
        depends_on: []
      - id: red-date-range-regression
        action: EDIT
        semantic_scope: module
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        git_roots: [github.com/sdcorejs/sdcorejs-angular]
        allowed_paths: [versions/v19/projects/sdcorejs-angular/forms/date-range/src/date-range.component.spec.ts]
        prohibited_paths: [versions/v19/projects/sdcorejs-angular/**/*.html, versions/v19/projects/sdcorejs-angular/**/*.scss]
        depends_on: [preflight-and-test-dependency]
      - id: red-table-regression
        action: CREATE
        semantic_scope: module
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        git_roots: [github.com/sdcorejs/sdcorejs-angular]
        allowed_paths: [versions/v19/projects/sdcorejs-angular/components/table/src/table.component.a11y.spec.ts]
        prohibited_paths: [versions/v19/projects/sdcorejs-angular/**/*.html, versions/v19/projects/sdcorejs-angular/**/*.scss]
        depends_on: [red-date-range-regression]
      - id: minimal-component-fix
        action: EDIT
        semantic_scope: module
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        git_roots: [github.com/sdcorejs/sdcorejs-angular]
        allowed_paths:
          - versions/v19/projects/sdcorejs-angular/forms/date-range/src/date-range.component.html
          - versions/v19/projects/sdcorejs-angular/components/table/src/table.component.html
          - versions/v19/projects/sdcorejs-angular/components/table/src/table.component.scss
          - versions/v19/projects/sdcorejs-angular/components/table/src/table.component.ts
        prohibited_paths: [versions/v19/projects/sdcorejs-angular/**/index.ts, versions/v19/projects/sdcorejs-angular/**/public-api.ts]
        depends_on: [red-table-regression]
      - id: docs-sync-and-release-artifacts
        action: EDIT
        semantic_scope: repository
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        git_roots: [github.com/sdcorejs/sdcorejs-angular]
        allowed_paths:
          - versions/v19/projects/sdcorejs-angular/forms/date-range/sd-date-range.md
          - versions/v19/projects/sdcorejs-angular/components/table/sd-table.md
          - versions/v20/**
          - versions/v21/**
          - showcase/src/app/docs/generated/*.generated.ts
          - CHANGELOG.md
          - published-pages/2.4/**
          - published-pages/pages.json
        prohibited_paths: [published-docs/**, .github/**, scripts/**]
        depends_on: [minimal-component-fix]
      - id: verify-review-release
        action: VERIFY
        semantic_scope: repository
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        git_roots: [github.com/sdcorejs/sdcorejs-angular]
        allowed_paths:
          - versions/v19/dist/**
          - versions/v19/coverage/**
          - versions/v20/dist/**
          - versions/v20/coverage/**
          - versions/v21/dist/**
          - versions/v21/coverage/**
          - showcase/dist/**
        prohibited_paths: [enterprise-portal/**, node_modules/.patches/**]
        depends_on: [docs-sync-and-release-artifacts]
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

## Tasks

### Phase 1 - Preflight và test toolchain

1. **VERIFY** `github.com/sdcorejs/sdcorejs-angular:.` — fetch `origin/main`, recheck HEAD/branch/dirty state, npm availability của `20.2.4`, remote tag `v2.4`, approved-spec graph và toàn bộ allowed/prohibited paths; dừng nếu main hoặc version đã thay đổi.
2. **EDIT** `github.com/sdcorejs/sdcorejs-angular:versions/v19/package.json` và `versions/v19/package-lock.json` — thêm stable `axe-core` làm dev/test dependency duy nhất; xác nhận package library runtime manifest/tarball không chứa dependency này.

### Phase 2 - RED regression suite

3. **EDIT** `github.com/sdcorejs/sdcorejs-angular:versions/v19/projects/sdcorejs-angular/forms/date-range/src/date-range.component.spec.ts` — thêm test phân biệt `matStartDate`/`matEndDate`, yêu cầu mỗi input có đúng `autocomplete="off"`, không thiếu/rỗng/ID-derived/invalid token.
4. **CREATE** `github.com/sdcorejs/sdcorejs-angular:versions/v19/projects/sdcorejs-angular/components/table/src/table.component.a11y.spec.ts` — dựng fixture sorting disabled, omitted, mixed sortable, inline filter, custom title, multi-header và resize; kiểm tra directive instantiation, semantic `aria-sort`, focus/name, một icon duy nhất, click/Enter/Space, không duplicate event/request, filter isolation, rowspan/colspan và resize.
5. **CREATE** cùng file table accessibility spec — thêm Axe scans thật cho fixture sorting enabled và disabled với đúng `runOnly.tags = [wcag2a, wcag2aa, wcag21a, wcag21aa]`; không truyền `disableRules`, `exclude`, impact filter hay allowlist.
6. **VERIFY** focused Karma command — chạy các test mới trên code gốc, lưu failure messages chứng minh date end autocomplete, unconditional `MatSortHeader`, invalid `aria-sort` host và disabled-sort exposure đều RED vì đúng regression; sửa test setup nếu là lỗi harness, nhưng không sửa production code trước RED đúng nguyên nhân.

### Phase 3 - Minimal GREEN implementation

7. **EDIT** `github.com/sdcorejs/sdcorejs-angular:versions/v19/projects/sdcorejs-angular/forms/date-range/src/date-range.component.html` — thay binding autocomplete của end input bằng token tĩnh `off`, giữ nguyên tất cả binding còn lại.
8. **EDIT** `github.com/sdcorejs/sdcorejs-angular:versions/v19/projects/sdcorejs-angular/components/table/src/table.component.html` và chỉ khi test buộc cần `table.component.scss`/`table.component.ts` — chỉ instantiate `MatSortHeader` trên title host khi table sort bật và leaf column sortable; host sinh `aria-sort` phải có semantic columnheader; path còn lại là plain title không focus/no icon/no aria-sort. Giữ Material arrow ẩn, custom icon duy nhất, filter/resize là sibling ngoài sort button; nếu Axe từ chối nested role, dùng semantic bridge nội bộ đáp ứng cùng contract, không suppress và không chuyển directive lên toàn `<th>`.
9. **VERIFY** focused Karma GREEN — chạy lại toàn bộ date/table a11y matrix, sau đó refactor tối thiểu khi vẫn green; xác nhận computed style qua Chrome cho cả custom icon và Material arrow ở none/asc/desc.

### Phase 4 - Documentation, sync và release artifacts

10. **EDIT** `sd-date-range.md`, `sd-table.md` và `CHANGELOG.md` — ghi rõ autocomplete hợp lệ, semantic sort, disabled behavior, custom icon không đổi; thêm section `2.4` ngày release và exact package versions `19.2.4`/`20.2.4`/`21.2.4`.
11. **VERIFY/GENERATE** root sync flow — chạy `npm run sync`, review diff generated v20/v21, chạy `npm run check:sync`, build v19 rồi `npm run build:page -- --suffix 2.4`; không hand-edit mirrors hoặc generated page.

### Phase 5 - Full verification và independent review

12. **VERIFY** repository gates — chạy full Karma trên Angular 19/20/21 (v19 có coverage thresholds), lint release/phase, build cả ba major, root script tests, sync parity và v20 `npm pack`; inspect tarball để xác nhận component output đúng, `axe-core` không nằm trong runtime dependencies/bundle, không có Portal/node_modules patch/Axe suppression. Sau đó chạy independent code review, repair findings trong scope và chạy lại mọi evidence bị invalidated.

### Phase 6 - Commit, PR, tag và npm verification

13. **VERIFY/EDIT** Git/release state — hoàn tất artifact closure, commit explicit paths, push feature branch, mở PR vào `main`, chờ checks và merge; fetch main mới, xác minh release version/tag vẫn trống, tag đúng merged main bằng `v2.4`, push tag, theo dõi publish workflow đến khi cả ba matrix publish và docs job hoàn tất. Cuối cùng chạy `npm view @sdcorejs/angular@20.2.4 version`, `npm pack @sdcorejs/angular@20.2.4` trong thư mục tạm và inspect registry tarball/DOM template/dependencies. Không ghi thêm file sau final branch-ready gate.

## Acceptance mapping

- AC-001, AC-002 -> tasks 3, 6, 7, 9
- AC-003, AC-004 -> tasks 4, 6, 8, 9
- AC-005, AC-006 -> tasks 4, 6, 8, 9
- AC-007 -> tasks 4, 8, 9, 12
- AC-008, AC-009 -> tasks 4, 8, 9
- AC-010 -> tasks 4, 8, 9
- AC-011, AC-012, AC-013 -> tasks 4, 8, 9
- AC-014 -> tasks 5, 6, 9, 12
- AC-015 -> tasks 3-9
- AC-016, AC-017 -> tasks 1, 8, 12, 13
- AC-018 -> tasks 11, 12
- AC-019, AC-020 -> tasks 10-13

## Verification

- Focused RED/GREEN: `npm --prefix versions/v19 test -- --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/forms/date-range/src/date-range.component.spec.ts --include=projects/sdcorejs-angular/components/table/src/table.component.a11y.spec.ts`
- Full v19 release suite: `npm --prefix versions/v19 run test:ci`
- Full generated-major suites: `npm --prefix versions/v20 test -- --watch=false --browsers=ChromeHeadlessCI` và tương tự v21, sau dependency install không ghi lockfile.
- Lint/typecheck/build: `npm run lint:release`, `npm run lint:phase:release`, `npm --prefix versions/v19 run build`, `npm --prefix versions/v20 run build` và `npm --prefix versions/v21 run build`.
- Sync/scripts/page: `npm run sync`, `npm run check:sync`, `npm run test:scripts`, `npm run build:page -- --suffix 2.4`.
- Package: v20 `npm pack` trước tag; sau publish dùng `npm view @sdcorejs/angular@20.2.4 version` và registry `npm pack @sdcorejs/angular@20.2.4`.
- UI accessibility: real ChromeHeadless DOM/computed-style + Axe WCAG 2.1 A/AA; không dựa vào snapshot HTML thuần.

## Review decisions

- Không chuyển `mat-sort-header` lên toàn `<th>` vì nó sẽ biến cả filter/resize thành nội dung của sort button và thay đổi tâm của custom background icon.
- Test double-icon kiểm tra cả số lượng host/arrow và computed style qua Chrome ở ba trạng thái sort.
- Toàn bộ ba Angular line chạy full suite để tăng độ tin cậy cho generated mirror; v19 vẫn là release coverage gate chính thức.
- `axe-core` được duyệt ở mức dev/test dependency; library runtime manifest, public API và tarball không được phụ thuộc vào nó.

## Decisions captured during review

- Approved as drafted.
- The approval explicitly includes `axe-core` as a development/test-only dependency and full Angular 19/20/21 regression suites.

## Skill provenance

sdcorejs-plan (approved on attempt 1 / 3)
