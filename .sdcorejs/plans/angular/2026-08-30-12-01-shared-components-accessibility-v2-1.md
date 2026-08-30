---
allowed_paths:
  - .sdcorejs/docs/angular/2026-08-30-11-42-shared-components-accessibility-v2-1-spec.md
  - .sdcorejs/specs/angular/2026-08-30-11-42-shared-components-accessibility-v2-1.md
  - .sdcorejs/docs/angular/2026-08-30-12-01-shared-components-accessibility-v2-1-plan.md
  - .sdcorejs/plans/angular/2026-08-30-12-01-shared-components-accessibility-v2-1.md
  - versions/v19/projects/sdcorejs-angular/components/section/**
  - versions/v19/projects/sdcorejs-angular/components/badge/**
  - versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/**
  - versions/v19/projects/sdcorejs-angular/modules/layout/sd-layout.md
  - versions/v19/projects/sdcorejs-angular/i18n/src/*.ts
  - versions/v19/SYNC-STATUS.md
  - versions/v20/projects/sdcorejs-angular/components/section/**
  - versions/v20/projects/sdcorejs-angular/components/badge/**
  - versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/**
  - versions/v20/projects/sdcorejs-angular/modules/layout/sd-layout.md
  - versions/v20/projects/sdcorejs-angular/i18n/src/*.ts
  - versions/v20/SYNC-STATUS.md
  - versions/v21/projects/sdcorejs-angular/components/section/**
  - versions/v21/projects/sdcorejs-angular/components/badge/**
  - versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/**
  - versions/v21/projects/sdcorejs-angular/modules/layout/sd-layout.md
  - versions/v21/projects/sdcorejs-angular/i18n/src/*.ts
  - versions/v21/SYNC-STATUS.md
  - showcase/src/app/docs/generated/*.generated.ts
  - published-pages/2.1/**
  - published-pages/pages.json
  - CHANGELOG.md
approval_source: explicit-user-choice
approved_at: '2026-08-30T05:10:35.728Z'
approved_by: null
approved_spec_hash: sha256:v1:282fbf72b526746f833dde06849fb1c93b2ab339c54069b3065be5dfe198afcd
approved_spec_reference:
  approval_hash: sha256:v1:282fbf72b526746f833dde06849fb1c93b2ab339c54069b3065be5dfe198afcd
  artifact_id: spec-sdcorejs-angular-shared-accessibility-v2-1-r1
  repository_id: github.com/sdcorejs/sdcorejs-angular
  repository_relative_path: .sdcorejs/specs/angular/2026-08-30-11-42-shared-components-accessibility-v2-1.md
  revision: 120c9f875defe361b783f86b64920581c9841377
artifact_id: plan-sdcorejs-angular-shared-accessibility-v2-1-r1
artifact_kind: plan
change_control:
  change_reason: null
  revision: 1
  supersedes: null
change_ref: sdcorejs-angular-shared-accessibility-v2-1
commit_policy: with-change
contract_id: sdcorejs-angular-shared-accessibility-v2-1
dependency_changes:
  approval_required: false
  packages: []
  required: false
dependency_order:
  - sdcorejs-angular
description: Executable RED-first plan for shared component accessibility and the exact v2.1 multi-major release.
env_changes:
  approval_required: false
  files: []
  required: false
execution_host_repository_id: github.com/sdcorejs/sdcorejs-angular
gitlink_updates_in_scope: false
integration_owner_repository_id: github.com/sdcorejs/sdcorejs-angular
migration_changes:
  approval_required: false
  description: null
  required: false
name: shared-components-accessibility-v2-1
owner: sdcorejs-plan
owner_module_id: shared-components
owner_repository_id: github.com/sdcorejs/sdcorejs-angular
owner_repository_role: library
parent_references:
  - approval_hash: sha256:v1:282fbf72b526746f833dde06849fb1c93b2ab339c54069b3065be5dfe198afcd
    artifact_id: spec-sdcorejs-angular-shared-accessibility-v2-1-r1
    artifact_kind: spec
    repository_id: github.com/sdcorejs/sdcorejs-angular
    revision: 120c9f875defe361b783f86b64920581c9841377
parent_repository_id: null
phase_count: 6
prohibited_paths:
  - enterprise-portal/**
  - node_modules/**
  - versions/*/node_modules/**
  - node_modules/.patches/**
  - package.json
  - package-lock.json
  - versions/*/package.json
  - versions/*/package-lock.json
  - versions/*/projects/sdcorejs-angular/package.json
  - .github/**
  - scripts/**
  - published-docs/**
repository_relative_path: .sdcorejs/plans/angular/2026-08-30-12-01-shared-components-accessibility-v2-1.md
requirement_id: REQ-SDANGULAR-A11Y-2-1
schema_version: 1
sourceSpecPath: .sdcorejs/specs/angular/2026-08-30-11-42-shared-components-accessibility-v2-1.md
source_plan: none
source_revision: 120c9f875defe361b783f86b64920581c9841377
source_spec: .sdcorejs/specs/angular/2026-08-30-11-42-shared-components-accessibility-v2-1.md
stack_profile: core-ui-angular
supersedes: null
target_root_kind: target-project
task_count: 10
track: angular
verification_strategy:
  broad_checks:
    - 4825-test baseline is not regressed and coverage thresholds pass
    - all maintained workspaces lint/build and remain sync-identical
    - repo scripts and published page build pass
    - release tag SHA and three exact npm versions match
  commands_planned:
    - focused Karma specs with --include for each RED/GREEN cycle
    - npm run sync and npm run check:sync
    - npm run test:scripts
    - npm run lint:release
    - npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage in versions/v19
    - npm run build in versions/v19, versions/v20 and versions/v21
    - npm run build:page -- --suffix 2.1
    - GitHub Actions publish-npm.yml and exact npm registry reads
  commands_skipped:
    - standalone typecheck script: no such script exists; ng-packagr build is the repository's declared published-surface typecheck gate
    - enterprise-portal E2E: repository and module are explicitly prohibited by the approved spec
  focused_checks:
    - three component spec files fail before and pass after their owner implementation
    - success and warning badge default pairs prove the previous contrast defect and all six colors prove >= 4.5 after the fix
    - no li remains under MatTree and hidden sidebar tree is inert
  package_manager: npm
  scripts_detected:
    - sync
    - check:sync
    - lint:release
    - test:scripts
    - build:page
    - versions/v19:test
    - versions/v19:test:ci
    - versions/v19:lint
    - versions/v19:build
    - versions/v19:check:i18n-parity
approval_hash: sha256:v1:ab1fd96f8b62ed1abc6cde4f8b5d0dadfb8ab30e7892a55e7b9328d9ec240552
approved_plan_hash: sha256:v1:ab1fd96f8b62ed1abc6cde4f8b5d0dadfb8ab30e7892a55e7b9328d9ec240552
---

# Shared Components Accessibility v2.1 - Approved Plan

> Snapshot of what the user approved at the `sdcorejs-plan` gate. Do not edit by hand; re-author through `sdcorejs-plan` if the contract changes.

## Approved contract

# Shared Components Accessibility v2.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Multi-agent dispatch is disabled for this contract because RED evidence, generated mirrors, changelog and release state are sequentially coupled.

**Goal:** Remove the five reported accessibility failure groups at the `@sdcorejs/angular` component roots while preserving public contracts and publish exact versions `19.2.1`, `20.2.1`, and `21.2.1`.

**Architecture:** Extend the existing standalone components in the Angular 19 source-of-truth: a dedicated native collapse button in `SdSection`, valid link/button/tree semantics in Sidebar v1, and computed naming plus dark-on-light theme tokens in `SdBadge`. Keep the existing signals, outputs and navigation behavior, then generate Angular 20/21 through the repository sync script.

**Tech Stack:** Angular 19 standalone components, signals, OnPush, Angular Material/CDK tree, Jasmine/Karma, SCSS theme tokens, npm workspaces/scripts, GitHub Actions trusted npm publishing.

---

## Scope

Implement the approved spec for `SdSection`, Sidebar v1 and `SdBadge`; cover `aria-hidden-focus`, `button-name`, `link-name`, `color-contrast`, and invalid `list`/`listitem` semantics with RED-first tests. Update owned docs/changelog, sync maintained Angular lines, run every release gate, publish suffix `v2.1`, and make no change to `enterprise-portal`.

## Execution context

- Track: `angular`
- Target root kind: `target-project`
- Stack profile: `core-ui-angular`
- Coverage approach: `TDD`
- Parallel candidates: no; each production edit must follow recorded RED evidence, and sync/release artifacts are shared sequential resources.

```yaml
plan_context:
  source: sdcorejs-plan
  contract_id: sdcorejs-angular-shared-accessibility-v2-1
  requirement_id: REQ-SDANGULAR-A11Y-2-1
  approved_spec_path: .sdcorejs/specs/angular/2026-08-30-11-42-shared-components-accessibility-v2-1.md
  approved_spec_hash: sha256:v1:282fbf72b526746f833dde06849fb1c93b2ab339c54069b3065be5dfe198afcd
  approved_spec_reference:
    repository_id: github.com/sdcorejs/sdcorejs-angular
    repository_relative_path: .sdcorejs/specs/angular/2026-08-30-11-42-shared-components-accessibility-v2-1.md
    artifact_id: spec-sdcorejs-angular-shared-accessibility-v2-1-r1
    revision: 120c9f875defe361b783f86b64920581c9841377
    approval_hash: sha256:v1:282fbf72b526746f833dde06849fb1c93b2ab339c54069b3065be5dfe198afcd
  approved_plan_path: ''
  approved_plan_hash: ''
  supersedes: null
  target_root: .
  target_root_kind: target-project
  owner_repository_id: github.com/sdcorejs/sdcorejs-angular
  owner_repository_role: library
  owner_module_id: shared-components
  execution_host_repository_id: github.com/sdcorejs/sdcorejs-angular
  integration_owner_repository_id: github.com/sdcorejs/sdcorejs-angular
  dependency_order:
    - sdcorejs-angular
  gitlink_updates_in_scope: false
  track: angular
  stack_profile: core-ui-angular
  task_count: 10
  phase_count: 6
  allowed_paths:
    - .sdcorejs/docs/angular/2026-08-30-11-42-shared-components-accessibility-v2-1-spec.md
    - .sdcorejs/specs/angular/2026-08-30-11-42-shared-components-accessibility-v2-1.md
    - .sdcorejs/docs/angular/2026-08-30-12-01-shared-components-accessibility-v2-1-plan.md
    - .sdcorejs/plans/angular/2026-08-30-12-01-shared-components-accessibility-v2-1.md
    - versions/v19/projects/sdcorejs-angular/components/section/**
    - versions/v19/projects/sdcorejs-angular/components/badge/**
    - versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/**
    - versions/v19/projects/sdcorejs-angular/modules/layout/sd-layout.md
    - versions/v19/projects/sdcorejs-angular/i18n/src/*.ts
    - versions/v19/SYNC-STATUS.md
    - versions/v20/projects/sdcorejs-angular/components/section/**
    - versions/v20/projects/sdcorejs-angular/components/badge/**
    - versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/**
    - versions/v20/projects/sdcorejs-angular/modules/layout/sd-layout.md
    - versions/v20/projects/sdcorejs-angular/i18n/src/*.ts
    - versions/v20/SYNC-STATUS.md
    - versions/v21/projects/sdcorejs-angular/components/section/**
    - versions/v21/projects/sdcorejs-angular/components/badge/**
    - versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/**
    - versions/v21/projects/sdcorejs-angular/modules/layout/sd-layout.md
    - versions/v21/projects/sdcorejs-angular/i18n/src/*.ts
    - versions/v21/SYNC-STATUS.md
    - showcase/src/app/docs/generated/*.generated.ts
    - published-pages/2.1/**
    - published-pages/pages.json
    - CHANGELOG.md
  prohibited_paths:
    - enterprise-portal/**
    - node_modules/**
    - versions/*/node_modules/**
    - node_modules/.patches/**
    - package.json
    - package-lock.json
    - versions/*/package.json
    - versions/*/package-lock.json
    - versions/*/projects/sdcorejs-angular/package.json
    - .github/**
    - scripts/**
    - published-docs/**
  generated_artifacts:
    - versions/v20/projects/sdcorejs-angular/components/section/**
    - versions/v20/projects/sdcorejs-angular/components/badge/**
    - versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/**
    - versions/v20/projects/sdcorejs-angular/modules/layout/sd-layout.md
    - versions/v20/projects/sdcorejs-angular/i18n/src/*.ts
    - versions/v21/projects/sdcorejs-angular/components/section/**
    - versions/v21/projects/sdcorejs-angular/components/badge/**
    - versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/**
    - versions/v21/projects/sdcorejs-angular/modules/layout/sd-layout.md
    - versions/v21/projects/sdcorejs-angular/i18n/src/*.ts
    - versions/v*/SYNC-STATUS.md
    - showcase/src/app/docs/generated/*.generated.ts
    - published-pages/2.1/**
    - published-pages/pages.json
    - versions/v*/dist/**
    - versions/v19/coverage/**
    - showcase/dist/**
  docs_artifacts:
    - versions/v19/projects/sdcorejs-angular/components/section/sd-section.md
    - versions/v19/projects/sdcorejs-angular/components/badge/sd-badge.md
    - versions/v19/projects/sdcorejs-angular/modules/layout/sd-layout.md
    - CHANGELOG.md
    - .sdcorejs/docs/angular/2026-08-30-11-42-shared-components-accessibility-v2-1-spec.md
    - .sdcorejs/specs/angular/2026-08-30-11-42-shared-components-accessibility-v2-1.md
    - .sdcorejs/docs/angular/2026-08-30-12-01-shared-components-accessibility-v2-1-plan.md
    - .sdcorejs/plans/angular/2026-08-30-12-01-shared-components-accessibility-v2-1.md
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
      component_style: Angular standalone components, signals/model/input/output, OnPush where already declared, native control flow with cached @let reads
      folder_convention: component source/template/style/spec/docs colocated under the existing package entry point; layout internals remain under modules/layout/components/sidebar-v1
      state_convention: component-owned signals/computed state; no new store or facade
      service_data_access_convention: existing Router, I18nService, layout storage and navigation-state services only; no data-access change
      registration_provider_convention: standalone component imports; built-in i18n catalog entries; no new provider
      public_api_barrel_convention: existing index.ts exports remain byte-for-byte unchanged
      test_convention: colocated Jasmine specs executed by Karma/ChromeHeadlessCI
      evidence_inspected:
        - versions/v19/angular.json
        - versions/v19/package.json
        - versions/v19/projects/sdcorejs-angular/components/section/src/section.component.*
        - versions/v19/projects/sdcorejs-angular/components/badge/src/badge.component.*
        - versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.*
        - versions/v19/projects/sdcorejs-angular/i18n/src/*.ts
        - .github/workflows/ci.yml
        - .github/workflows/publish-npm.yml
    component_tree:
      - SdSection -> header projection + dedicated native collapse trigger + conditional body + footer projection
      - SdSidebarV1 -> SdSidebarV1Panel -> home link + group buttons + MatTree(treeitem -> navigation link/pin button or expand button -> group)
      - SdBadge -> round/tag/icon visual root with conditional role=button and computed accessible name
    reuse_decisions:
      - extend SdSection in components/section; keep selector, inputs, model and slots
      - extend SdSidebarV1Panel in modules/layout/components/sidebar-v1; reuse Router, MatTree roles, SdTranslatePipe and inert
      - extend SdBadge in components/badge; reuse existing public color tokens and click EventEmitter
      - extend built-in i18n catalogs with section expand/collapse labels; do not add a public input
    file_decisions:
      - section component files: edit trigger semantics, event boundary, focus styling and regression tests
      - sidebar-v1 panel files: edit native controls/link href/tree group structure and regression tests
      - badge component files: edit computed name and dark foreground token mapping with regression tests
      - component docs and CHANGELOG: edit owned behavior/release documentation
      - v20/v21 mirrors and published-pages/2.1: generate only through repository scripts
    responsibilities:
      - SdSection owns collapsed state and prevents projected interactive descendants from toggling it
      - SdSidebarV1Panel owns group selection, tree expansion, safe route/external navigation, pin state and focus isolation
      - SdBadge owns presentation color, optional click activation and fallback accessible naming
    state_owners:
      - SdSection.collapsed model owns open/closed state
      - SdSidebarV1Panel signals and NestedTreeControl own sidebar/tree state
      - SdBadge inputs/computed values own effective color and accessible label
    service_boundaries:
      - symbol: Router
        scope: component
      - symbol: I18nService and SdTranslatePipe
        scope: app
      - symbol: SdLayoutStorageService and SdLayoutNavigationStateService
        scope: app
    data_flow:
      - public inputs -> existing component signals/computed values -> semantic template attributes -> existing outputs/router actions
    declarations_and_registration:
      - SdTranslatePipe added to SdSection standalone imports; all other declarations stay at current entry points
      - five built-in locale catalogs receive the same two section keys
      - no barrel/export/provider/route change
    public_exports:
      - none added or removed; existing SdSection, SdBadge and layout exports remain unchanged
    tests:
      - section DOM/event boundary/name/focus exposure contract
      - sidebar real-template name/link/tree/group/inert contract plus existing navigation unit tests
      - badge conditional interaction/name and token contrast contract
      - sync parity and package build contract across Angular 19/20/21
    decomposition_rationale:
      - accessibility behavior belongs to the three existing root owners
      - template-local controls stay inline because they have no independent state or reuse boundary
      - no service, directive or shared naming helper is introduced for three short owner-specific rules
  agent_architecture:
    required: false
    not_applicable_reason: no AI-agent runtime or tool contract is in scope
    schema_version: 1
  verification_strategy:
    package_manager: npm
    scripts_detected:
      - sync
      - check:sync
      - lint:release
      - test:scripts
      - build:page
      - versions/v19:test
      - versions/v19:test:ci
      - versions/v19:lint
      - versions/v19:build
      - versions/v19:check:i18n-parity
    commands_planned:
      - focused Karma specs with --include for each RED/GREEN cycle
      - npm run sync and npm run check:sync
      - npm run test:scripts
      - npm run lint:release
      - npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage in versions/v19
      - npm run build in versions/v19, versions/v20 and versions/v21
      - npm run build:page -- --suffix 2.1
      - GitHub Actions publish-npm.yml and exact npm registry reads
    commands_skipped:
      - standalone typecheck script: no such script exists; ng-packagr build is the repository's declared published-surface typecheck gate
      - enterprise-portal E2E: repository and module are explicitly prohibited by the approved spec
    focused_checks:
      - three component spec files fail before and pass after their owner implementation
      - success and warning badge default pairs prove the previous contrast defect and all six colors prove >= 4.5 after the fix
      - no li remains under MatTree and hidden sidebar tree is inert
    broad_checks:
      - 4825-test baseline is not regressed and coverage thresholds pass
      - all maintained workspaces lint/build and remain sync-identical
      - repo scripts and published page build pass
      - release tag SHA and three exact npm versions match
  parallel_candidates:
    allowed: false
    frozen_contract:
      path: .sdcorejs/specs/angular/2026-08-30-11-42-shared-components-accessibility-v2-1.md
      hash: sha256:v1:282fbf72b526746f833dde06849fb1c93b2ab339c54069b3065be5dfe198afcd
      revision: 1
      derived_from_approved_plan_hash: null
      supersedes: null
    units: []
    shared_files:
      - versions/v19 i18n catalogs are shared by Section and Sidebar; Section task is the single owner
      - CHANGELOG.md and generated v20/v21 mirrors are single-owner release tasks
    conflict_risks:
      - parallel edits could erase RED-first ordering or race the sync mirror
  repository_plan:
    schema_version: 1
    integration_owner_repository_id: github.com/sdcorejs/sdcorejs-angular
    gitlink_updates_in_scope: false
    dependency_order:
      - sdcorejs-angular
    repositories:
      - repository_id: github.com/sdcorejs/sdcorejs-angular
        role: library
        module_id: shared-components
        plan_artifact_id: plan-sdcorejs-angular-shared-accessibility-v2-1-r1
    steps:
      - id: preflight
        action: VERIFY
        semantic_scope: repository
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        depends_on: []
      - id: red-tests
        action: EDIT
        semantic_scope: repository
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        git_roots: [github.com/sdcorejs/sdcorejs-angular]
        allowed_paths:
          - versions/v19/projects/sdcorejs-angular/components/section/src/section.component.spec.ts
          - versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.spec.ts
          - versions/v19/projects/sdcorejs-angular/components/badge/src/badge.component.spec.ts
        prohibited_paths: [enterprise-portal/**, node_modules/**, versions/*/node_modules/**]
        depends_on: [preflight]
      - id: root-components
        action: EDIT
        semantic_scope: repository
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        git_roots: [github.com/sdcorejs/sdcorejs-angular]
        allowed_paths:
          - versions/v19/projects/sdcorejs-angular/components/section/**
          - versions/v19/projects/sdcorejs-angular/components/badge/**
          - versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/**
          - versions/v19/projects/sdcorejs-angular/modules/layout/sd-layout.md
          - versions/v19/projects/sdcorejs-angular/i18n/src/*.ts
        prohibited_paths: [enterprise-portal/**, node_modules/**, versions/*/node_modules/**]
        depends_on: [red-tests]
      - id: release-artifacts
        action: VERIFY-THEN-EDIT
        semantic_scope: repository
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        git_roots: [github.com/sdcorejs/sdcorejs-angular]
        allowed_paths:
          - CHANGELOG.md
          - versions/v*/SYNC-STATUS.md
          - versions/v20/projects/sdcorejs-angular/**
          - versions/v21/projects/sdcorejs-angular/**
          - showcase/src/app/docs/generated/*.generated.ts
          - published-pages/2.1/**
          - published-pages/pages.json
        prohibited_paths: [enterprise-portal/**, node_modules/**, versions/*/node_modules/**, published-docs/**]
        depends_on: [root-components]
      - id: verify
        action: VERIFY
        semantic_scope: repository
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        depends_on: [release-artifacts]
      - id: publish
        action: VERIFY
        semantic_scope: repository
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        depends_on: [verify]
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

## Frontend architecture plan

### Project conventions detected

- Components are standalone and colocate `.ts`, `.html`, `.scss`, `.spec.ts`; signals/model inputs own local state.
- v19 is canonical. v20/v21 are generated, never hand-edited.
- Public entry-point barrels already export the owners; no export change is needed.
- Jasmine/Karma tests are colocated and CI uses `ChromeHeadlessCI` with coverage.

### Reuse decisions

| Need | Existing symbol/path | Decision | Reason and compatibility | Ownership |
| --- | --- | --- | --- | --- |
| Collapsible region | `SdSection` | extend | Root owner already controls header/body/model | public |
| Navigation tree | `SdSidebarV1Panel` + `MatTree` | extend/reuse | Keeps Router, pin and tree state intact | feature-private |
| Status indicator | `SdBadge` | extend | Existing click observation and color tokens remain canonical | public |
| Localized collapse names | `SdTranslatePipe` + built-in catalogs | reuse/extend | Avoids a new public label input | shared internal |

### Component tree

```text
SdSection
  header (projected left/right content)
    native collapse button
  conditional body
  footer

SdSidebarV1
  SdSidebarV1Panel
    home anchor
    menu-group buttons
    MatTree [role=tree]
      mat-nested-tree-node [role=treeitem]
        leaf anchor + optional pin button
        OR branch button + child [role=group]

SdBadge
  round | tag | icon root
    visible title/description/icon
```

### Responsibility, state and data flow

No state changes owner. Inputs flow into existing signals/computed values, templates expose correct native/ARIA semantics, and events continue through the current `collapsed`, `click`, Router, pin and layout outputs. No service, provider, route or API boundary changes.

### Declarations, exports and decomposition

`SdSection` adds `SdTranslatePipe` to its standalone imports. Five locale files gain identical keys. No barrel changes. All controls remain inline with their current owner because none has independent state or reuse justification.

## Tasks

### Phase 1 - Guarded preflight

### Task 1: Verify immutable inputs, clean scope and release vacancy

**Files:** Verify only; no source edit.

- [ ] Run `git status --short`, `git diff --stat`, `git diff --cached --stat`, `git branch --show-current`, and `git rev-parse HEAD`. Continue only with the two approved `.sdcorejs` artifacts dirty; otherwise use the three-choice dirty-tree gate from `plan_context`.
- [ ] Re-run `verifyApprovedArtifactGraph` for `spec-sdcorejs-angular-shared-accessibility-v2-1-r1`; require hash `sha256:v1:282fbf72b526746f833dde06849fb1c93b2ab339c54069b3065be5dfe198afcd`.
- [ ] Confirm `origin/main` still contains the current base or record that integration/rebase will be required before final verification.
- [ ] Confirm `refs/tags/v2.1` is absent locally/remotely and `npm view` does not already contain `19.2.1`, `20.2.1`, or `21.2.1`. Existing versions or tag are a hard release blocker.

### Phase 2 - SdSection RED → GREEN

### Task 2: Write and prove failing SdSection regressions

**Files:**

- Modify: `versions/v19/projects/sdcorejs-angular/components/section/src/section.component.spec.ts`

- [ ] Extend the slot host tests with assertions equivalent to:

```ts
const trigger = getSectionEl(slotFixture).querySelector('.sd-section-collapse-toggle') as HTMLButtonElement;
expect(trigger?.tagName).toBe('BUTTON');
expect(trigger.getAttribute('aria-label')?.trim()).toBeTruthy();
expect(trigger.getAttribute('aria-expanded')).toBe('true');

const projectedAction = getSectionEl(slotFixture).querySelector('[sdHeaderRight]') as HTMLButtonElement;
projectedAction.click();
slotFixture.detectChanges();
expect(slotFixture.componentInstance.collapsed).toBeFalse();

trigger.click();
slotFixture.detectChanges();
expect(slotFixture.componentInstance.collapsed).toBeTrue();
expect(getSectionEl(slotFixture).querySelector('[aria-hidden="true"] button, [aria-hidden="true"] [tabindex]')).toBeNull();
```

- [ ] Assert a non-collapsible header has no role/tabindex and no collapse trigger; assert collapsed body focusables are removed rather than hidden under `aria-hidden`.
- [ ] From `versions/v19`, run `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/components/section/src/section.component.spec.ts`. Expected RED: `.sd-section-collapse-toggle` is missing and clicking the projected action bubbles to the current header toggle.

### Task 3: Implement dedicated Section control and return the spec to GREEN

**Files:**

- Modify: `versions/v19/projects/sdcorejs-angular/components/section/src/section.component.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/components/section/src/section.component.html`
- Modify: `versions/v19/projects/sdcorejs-angular/components/section/src/section.component.scss`
- Modify: `versions/v19/projects/sdcorejs-angular/i18n/src/{vi,en,ja,ko,zh}.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/components/section/sd-section.md`

- [ ] Keep `toggleCollapse` and `onHeaderKeydown` public for declaration compatibility. Add protected event-boundary handlers with the following behavior:

```ts
const SECTION_INTERACTIVE_SELECTOR =
  'a[href], button, input, select, textarea, [role="button"], [role="link"], [contenteditable="true"], [tabindex]';

protected onHeaderClick = (event: MouseEvent): void => {
  const target = event.target;
  if (target instanceof Element && target.closest(SECTION_INTERACTIVE_SELECTOR)) return;
  this.toggleCollapse();
};

protected onCollapseButtonClick = (event: MouseEvent): void => {
  event.stopPropagation();
  this.toggleCollapse();
};
```
- [ ] Replace header `role=button`/`tabindex` with a dedicated native button:

```html
<button
  type="button"
  class="sd-section-collapse-toggle"
  [attr.aria-label]="
    (_collapsed ? 'core.component.section.expand' : 'core.component.section.collapse')
      | sdTranslate: { title: _title || '' }
  "
  [attr.aria-expanded]="!_collapsed"
  [attr.aria-controls]="bodyId"
  (click)="onCollapseButtonClick($event)">
  <sd-icon aria-hidden="true" [name]="_collapsed ? 'expand_more' : 'expand_less'"></sd-icon>
</button>
```

- [ ] Move focus-ring/reset styles to `.sd-section-collapse-toggle`, keep the header pointer only when collapsible, and preserve classes/slots/body conditional rendering.
- [ ] Add localized `core.component.section.expand` / `.collapse` strings with `{title}` in all five catalogs; run `npm run check:i18n-parity` in v19.
- [ ] Update the Section accessibility docs to describe the dedicated trigger, projected-control click isolation and absence of hidden focusables.
- [ ] Re-run `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/components/section/src/section.component.spec.ts` from `versions/v19`. Expected GREEN with all existing section tests retained.

### Phase 3 - Sidebar v1 RED → GREEN

### Task 4: Write and prove failing Sidebar naming/link/tree regressions

**Files:**

- Modify: `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.spec.ts`

- [ ] Add a real-template Jasmine describe (no template override) with the existing Router/storage/navigation-state test doubles and `NoopAnimationsModule`.
- [ ] Add this naming-source helper and assert every rendered control/link is named:

```ts
function accessibleNameSource(element: HTMLElement): string {
  return element.getAttribute('aria-label')?.trim() || element.textContent?.trim() || '';
}

for (const control of root.querySelectorAll<HTMLElement>('button, a[href], [role="button"]')) {
  expect(accessibleNameSource(control)).withContext(control.outerHTML).not.toBe('');
}
```

- [ ] Assert the home anchor has `/layout/home`, never `javascript:`, and every menu leaf is an `a[href]` whose name contains its title.
- [ ] Assert `.c-menu-tree-container li` is empty, `mat-tree` exposes `role=tree`, every Material nested node exposes `role=treeitem`, and each branch child container exposes `role=group`.
- [ ] Set `isShowSidebar=false`; assert `.c-menu-tree` has `inert`, is not under `aria-hidden=true`, and cannot expose a focusable descendant outside that inert boundary. Set true and assert inert is removed.
- [ ] From `versions/v19`, run `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.spec.ts`. Expected RED: group icon buttons have no name, home href is `javascript:`, leaves are role-divs instead of links, and `li` elements remain under custom tree-node hosts.

### Task 5: Implement valid Sidebar native controls and tree grouping

**Files:**

- Modify: `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.html`
- Modify: `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.scss`
- Modify: `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.spec.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/modules/layout/sd-layout.md`

- [ ] Keep existing public handlers. Add Router-backed href generation and a click bridge without changing `navigate`:

```ts
menuNodeHref = (node: { path: string; queryParams?: Params }): string => {
  if (sdIsExternalHttpUrl(node.path)) return node.path;
  return this.#router.serializeUrl(
    this.#router.createUrlTree([node.path.split('?')[0]], {
      queryParams: node.queryParams ?? {},
    }),
  );
};

onMenuNodeClick = (event: MouseEvent, node: { path: string; queryParams?: Params }): void => {
  event.preventDefault();
  this.navigate({ path: node.path, queryParams: node.queryParams ?? {} });
};
```
- [ ] Change the home URL to `/layout/home`; add `type="button"` and explicit labels to pinned/menu-group buttons:

```html
<a href="/layout/home" [attr.aria-label]="'core.module.layout.home.tab-name' | sdTranslate"
   (click)="$event.preventDefault(); openHomePage()">…</a>

<button type="button" [attr.aria-label]="nodeMenuGroup.tooltipTitle || nodeMenuGroup.title">…</button>
```

- [ ] Replace the leaf title role-div with `a.c-menu-node-description-content[href]`; replace the branch role-div with `button[type=button].c-menu-node-description`. Preserve `aria-current`, `aria-expanded`, click behavior, pin sibling and keyboard activation.
- [ ] Replace both inner `li` wrappers with neutral `div`s and the nested `ul` with `<div class="c-menu-node-group" role="group">`; do not override Material's `tree`/`treeitem` hosts.
- [ ] Update SCSS selectors from `ul` nesting to `.c-menu-node-group`, reset native anchor/button chrome without changing layout, and retain visible focus rings plus collapsed `.c-menu-tree[inert]` behavior.
- [ ] Update layout docs with native link/button/tree/group semantics and focus isolation. Re-run `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.spec.ts` from `versions/v19`; expected GREEN with existing navigation/pin tests unchanged.

### Phase 4 - SdBadge RED → GREEN

### Task 6: Write and prove failing Badge name and contrast regressions

**Files:**

- Modify: `versions/v19/projects/sdcorejs-angular/components/badge/src/badge.component.spec.ts`

- [ ] Add interactive-name cases for title, title+description, tooltip-only and icon-only badges. Bind the existing click output, trigger change detection, and require non-empty `aria-label`; leave non-interactive roots without button role/tabindex/ARIA name.
- [ ] Add pure WCAG relative-luminance/contrast helpers in the spec and six default palette cases. Use these helpers, configure the fixture CSS variables, query computed foreground/background, and require the `*-dark` foreground and ratio `>= 4.5`:

```ts
function relativeLuminance([red, green, blue]: readonly number[]): number {
  const channels = [red, green, blue].map(value => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground: readonly number[], background: readonly number[]): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

const palette = [
  ['primary', '#005cbb', 14], ['secondary', '#5c6270', 12],
  ['info', '#006a6a', 14], ['success', '#2e7d32', 14],
  ['warning', '#a66300', 14], ['error', '#ba1a1a', 14],
] as const;

expect(contrastRatio(computedForeground, computedBackground))
  .withContext(color)
  .toBeGreaterThanOrEqual(4.5);
```

- [ ] Keep explicit assertions that no badge variant carries `aria-hidden` and icon-only interactive badges remain keyboard activatable.
- [ ] From `versions/v19`, run `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/components/badge/src/badge.component.spec.ts`. Expected RED: interactive roots have no `aria-label`; success (`~4.26`) and warning (`~3.97`) base-on-light pairs fail, and computed CSS uses base rather than dark tokens.

### Task 7: Implement Badge naming and dark foreground tokens

**Files:**

- Modify: `versions/v19/projects/sdcorejs-angular/components/badge/src/badge.component.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/components/badge/src/badge.component.html`
- Modify: `versions/v19/projects/sdcorejs-angular/components/badge/src/badge.component.scss`
- Modify: `versions/v19/projects/sdcorejs-angular/components/badge/sd-badge.md`

- [ ] Add this computed accessible name without adding an input, preserving numeric `0` and the existing click EventEmitter contract:

```ts
accessibleName = computed(() => {
  const visibleText = [this.title(), this.description()]
    .filter(value => value !== undefined && value !== null && String(value).trim() !== '')
    .map(value => String(value).trim())
    .join(' ');
  if (visibleText) return visibleText;

  const tooltip = this.tooltip()?.trim();
  if (tooltip) return tooltip;

  return (this.icon() || this.defaultIcon).replace(/[_-]+/g, ' ').trim();
});
```
- [ ] Add `[attr.aria-label]="isPointer ? accessibleName() : null"` to all three visual roots; keep `role`, `tabindex`, Enter/Space and `stopPropagation` conditional on `click.observed`.
- [ ] Map round/tag foreground and border to `primary-dark`, `secondary-dark`, `info-dark`, `success-dark`, `warning-dark`, and `error-dark`; map standalone icon foregrounds to the same dark tokens. Keep every background on its existing `*-light` token and keep CSS variables overridable.
- [ ] Update Badge docs with naming precedence and dark-on-light token contract. Re-run `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/components/badge/src/badge.component.spec.ts` from `versions/v19`; expected GREEN for all old and new cases.

### Phase 5 - Generated mirrors, docs and full verification

### Task 8: Cut release documentation and generate maintained artifacts

**Files:**

- Modify: `CHANGELOG.md`
- Generate: `versions/v20/**`, `versions/v21/**`, `versions/v*/SYNC-STATUS.md`
- Generate: `showcase/src/app/docs/generated/*.generated.ts`, `published-pages/2.1/**`, `published-pages/pages.json`

- [ ] Convert the current `## [Unreleased]` to a new empty `Unreleased` followed by this release header and a concise `Fixed` entry covering the five groups, backward compatibility and exact versions:

```markdown
## [Unreleased]

## [2.1] - 2026-08-30

Release suffix `2.1` publishes `19.2.1`, `20.2.1`, and `21.2.1`.

### Fixed

- `SdSection`, Sidebar v1 and `SdBadge` now expose named native controls/links,
  isolate collapsed focus, use valid tree/group markup, and use contrast-safe badge tokens
  without changing their public inputs, outputs or selectors.
```
- [ ] Run `npm run sync`, inspect the diff, and require only v19-derived component/docs/i18n changes plus generated `SYNC-STATUS.md`; stop if package manifests, lockfiles or unrelated components change.
- [ ] Run `npm run check:sync`.
- [ ] Run `npm run build:page -- --suffix 2.1`; inspect generated tracked artifacts and do not hand-edit `published-pages`.

### Task 9: Run broad gates, review the diff and establish branch readiness

**Files:** Verify all allowed paths; no new source behavior.

- [ ] If v20/v21 dependencies are absent, run their detected npm installs with `--legacy-peer-deps --package-lock=false`; never retain a lockfile diff.
- [ ] Run `npm run test:scripts`, `npm run lint:release`, and `npm run check:sync` from the repository root.
- [ ] In v19 run `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage`; require all tests and configured coverage thresholds to pass.
- [ ] Run `npm run build` in `versions/v19`, `versions/v20`, and `versions/v21`. These ng-packagr builds are the repository's declared typecheck for the published surface.
- [ ] Run `git diff --check`; search the diff and repository config for new axe suppressions/allowlists/severity overrides, `node_modules` patches, `aria-hidden` focus containers, `href="javascript:"`, and invalid Sidebar `li` markup.
- [ ] Run the read-only `sdcorejs-review`, then the verification/ship gates. Confirm no `enterprise-portal`, manifest, lockfile, workflow, script or `published-docs` path is present in the commit candidate.

### Phase 6 - Commit, push, tag and exact publication proof

### Task 10: Publish the verified release and return immutable identifiers

**Files:** Git/npm external state only after the release commit; no source writes after final branch-ready.

- [ ] Stage only approved paths and commit once with `fix(a11y): harden shared component semantics`. Record the full SHA.
- [ ] Fetch `origin`. If `origin/main` advanced, rebase the release commit, rerun Task 9 completely, and record the new SHA. Otherwise proceed.
- [ ] Push `fix/shared-accessibility`, then fast-forward the verified commit to `origin/main` according to the repository release ritual. If direct main push is protected, create and merge the branch PR, then verify `origin/main` resolves to the release commit before tagging.
- [ ] Wait for the `main` CI run for that SHA to pass. Do not tag a red or mismatched commit.
- [ ] Create annotated or lightweight tag `v2.1` at the exact `origin/main` release SHA and push it. Wait for `publish-npm.yml` (including sync, coverage, all three publish jobs and docs job) with a successful conclusion.
- [ ] Query the npm registry independently and require exact results `19.2.1`, `20.2.1`, `21.2.1`; verify `git rev-parse v2.1^{commit}` equals the recorded release SHA.
- [ ] Final response contains only that commit SHA and the three exact `@sdcorejs/angular` versions, as requested.

## Acceptance mapping

- AC-001, AC-002, AC-003 -> Tasks 2-3
- AC-004, AC-005, AC-006, AC-007 -> Tasks 4-5
- AC-008, AC-009 -> Tasks 6-7
- AC-010 -> Tasks 3, 5, 7, 9
- AC-011 -> Tasks 2, 4, 6, 9
- AC-012 -> Tasks 8-9
- AC-013 -> Tasks 1, 9-10
- AC-014 -> Task 10

## Verification

- Focused RED/GREEN: Karma `--include` for Section, Sidebar v1 panel and Badge specs.
- Root: `npm run check:sync`, `npm run test:scripts`, `npm run lint:release`, `npm run build:page -- --suffix 2.1`.
- v19: exact CI test command with `ChromeHeadlessCI` and coverage, plus ng-packagr build.
- v20/v21: ng-packagr build after generated sync; their lint is included in `lint:release`.
- Release: successful GitHub Actions run for tag `v2.1`, exact tag SHA match, and exact npm registry values for all three maintained Angular majors.

## Decisions captured during review
- (approved as drafted)

## Skill provenance
sdcorejs-plan (approved on attempt 1 / 3)
