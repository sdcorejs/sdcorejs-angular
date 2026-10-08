---
artifact_id: plan-section-item-item-left-r1
artifact_kind: plan
schema_version: 1
change_ref: section-item-item-left
source_spec: .sdcorejs/specs/angular/2026-10-08-16-37-section-item-item-left.md
source_architecture: .sdcorejs/architecture/angular/2026-10-08-16-37-section-item-item-left.md
source_plan: none
commit_policy: with-change
owner: sdcorejs-plan
name: section-item-item-left
description: 'TDD plan: port the sd-section-item [itemLeft] slot and optional label to @sdcorejs/angular v19, docs, showcase, CHANGELOG [Unreleased], sync v20-v22 (NSP-5634).'
contract_id: section-item-item-left
requirement_id: NSP-5634
approved_at: '2026-10-08T09:55:34.641Z'
approved_by: nghiatt15_onemount
approval_source: explicit-user-choice
track: angular
sourceSpecPath: .sdcorejs/specs/angular/2026-10-08-16-37-section-item-item-left.md
approved_spec_reference:
  repository_id: sdcorejs-angular
  repository_relative_path: .sdcorejs/specs/angular/2026-10-08-16-37-section-item-item-left.md
  artifact_id: spec-section-item-item-left-r1
  revision: 59f6c3eba545108744b37c004867b8bfa10ea685
  approval_hash: sha256:v1:43b9950a325feba4e829f61a346e793810367725e1d8278c26713239b704fb38
approved_architecture_reference:
  repository_id: sdcorejs-angular
  repository_relative_path: .sdcorejs/architecture/angular/2026-10-08-16-37-section-item-item-left.md
  artifact_id: architecture-section-item-item-left-r1
  revision: 59f6c3eba545108744b37c004867b8bfa10ea685
  approval_hash: sha256:v1:99a943f9d9db8af8014e5d9f56f9e84828628c93f172de8fce3b510e79c6d80d
parent_repository_id: null
parent_references:
  - repository_id: sdcorejs-angular
    artifact_id: architecture-section-item-item-left-r1
    artifact_kind: architecture
    revision: 59f6c3eba545108744b37c004867b8bfa10ea685
    approval_hash: sha256:v1:99a943f9d9db8af8014e5d9f56f9e84828628c93f172de8fce3b510e79c6d80d
owner_repository_id: sdcorejs-angular
owner_repository_role: library
owner_module_id: null
execution_host_repository_id: sdcorejs-angular
integration_owner_repository_id: sdcorejs-angular
repository_relative_path: .sdcorejs/plans/angular/2026-10-08-16-37-section-item-item-left.md
source_revision: 59f6c3eba545108744b37c004867b8bfa10ea685
dependency_order:
  - sdcorejs-angular
gitlink_updates_in_scope: false
task_count: 6
phase_count: 5
target_root_kind: target-project
stack_profile: core-ui-angular
approved_spec_hash: sha256:v1:43b9950a325feba4e829f61a346e793810367725e1d8278c26713239b704fb38
approved_architecture_hash: sha256:v1:99a943f9d9db8af8014e5d9f56f9e84828628c93f172de8fce3b510e79c6d80d
allowed_paths:
  - versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts
  - versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.ts
  - versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.html
  - versions/v19/projects/sdcorejs-angular/components/section/sd-section.md
  - showcase/src/app/pages/components/section/section-demo.component.ts
  - showcase/src/app/docs/core/documentation.registry.ts
  - showcase/src/app/docs/core/documentation.registry.spec.ts
  - showcase/src/app/docs/generated/example-sources.generated.ts
  - showcase/src/app/docs/generated/example-manifest.generated.ts
  - CHANGELOG.md
  - versions/v19/SYNC-STATUS.md
  - versions/v20/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts
  - versions/v20/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.ts
  - versions/v20/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.html
  - versions/v20/projects/sdcorejs-angular/components/section/sd-section.md
  - versions/v20/SYNC-STATUS.md
  - versions/v21/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts
  - versions/v21/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.ts
  - versions/v21/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.html
  - versions/v21/projects/sdcorejs-angular/components/section/sd-section.md
  - versions/v21/SYNC-STATUS.md
  - versions/v22/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts
  - versions/v22/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.ts
  - versions/v22/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.html
  - versions/v22/projects/sdcorejs-angular/components/section/sd-section.md
  - versions/v22/SYNC-STATUS.md
  - .sdcorejs/docs/angular/2026-10-08-16-37-section-item-item-left-spec.md
  - .sdcorejs/specs/angular/2026-10-08-16-37-section-item-item-left.md
  - .sdcorejs/docs/architecture/2026-10-08-16-37-section-item-item-left-architecture.md
  - .sdcorejs/architecture/angular/2026-10-08-16-37-section-item-item-left.md
  - .sdcorejs/docs/angular/2026-10-08-16-37-section-item-item-left-plan.md
  - .sdcorejs/plans/angular/2026-10-08-16-37-section-item-item-left.md
  - .sdcorejs/docs/angular/2026-10-08-16-37-section-item-item-left-execution.md
prohibited_paths:
  - package.json
  - package-lock.json
  - versions/*/package.json
  - versions/*/package-lock.json
  - showcase/package.json
  - showcase/package-lock.json
  - node_modules/**
  - versions/*/dist/**
  - published-docs/**
  - published-pages/**
  - showcase/src/app/docs/generated/changelog.generated.ts
  - versions/v19/projects/sdcorejs-angular/components/section/src/section.component.*
  - versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.scss
  - CLAUDE.md
  - AGENTS.md
dependency_changes:
  required: false
  approval_required: false
env_changes:
  required: false
  approval_required: false
migration_changes:
  required: false
  approval_required: false
verification_strategy:
  package_manager: npm
  commands_planned:
    - (versions/v19) npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts --include=projects/sdcorejs-angular/components/section/src/section.component.spec.ts
    - (versions/v19) npx ng build sdcorejs-angular
    - npm run generate:showcase-examples && npm run test:showcase-examples
    - npm run sync && npm run check:sync
    - npx eslint <changed ts/html files> (versions/v19)
    - mojibake scan of touched text files
supersedes: null
change_control:
  revision: 1
  supersedes: null
  change_reason: null
approval_hash: sha256:v1:ce2a33f5ca322d14420441ab6f99c877fbd652a350050efe4cc7b5aa4168b4b9
approved_plan_hash: sha256:v1:ce2a33f5ca322d14420441ab6f99c877fbd652a350050efe4cc7b5aa4168b4b9
---

# @sdcorejs/angular sd-section-item [itemLeft] slot and optional label (NSP-5634 port) - Approved Plan

> Snapshot of what the user approved at the `sdcorejs-plan` gate. Do not edit by hand; re-author through `sdcorejs-plan` if the contract changes.

## Approved contract

# Plan - @sdcorejs/angular sd-section-item [itemLeft] slot and optional label (NSP-5634 port) - 2026-10-08 16:37

Approved spec: `.sdcorejs/specs/angular/2026-10-08-16-37-section-item-item-left.md` (`sha256:v1:43b9950a325feba4e829f61a346e793810367725e1d8278c26713239b704fb38`).
Approved architecture: `.sdcorejs/architecture/angular/2026-10-08-16-37-section-item-item-left.md` (`sha256:v1:99a943f9d9db8af8014e5d9f56f9e84828628c93f172de8fce3b510e79c6d80d`).

## Scope

`sdcorejs-angular`, canonical workspace `versions/v19`, component `components/section`:
- `<sd-section-item>` gains the `[itemLeft]` content slot; `label` becomes optional (same API as `@sd-angular/core` `19.0.43`).
- Docs, showcase demo, registry count, generated example sources and `CHANGELOG.md` `[Unreleased]` ship in the same change.
- v20, v21 and v22 receive the change only through `npm run sync`.

## Execution context

- Track: angular. Stack profile: core-ui-angular (the library itself).
- Coverage: TDD. TASK-001 writes the failing specs before TASK-002 changes the component.
- Parallel: no (one component, sequential dependencies, repository-wide sync).
- Branch `feat/section-item-item-left` from `origin/main` `59f6c3eb`; working tree clean except the `.sdcorejs` artifacts of this change.
- Node `22.22.3` (fnm) for workspace builds.
- Test command (from `versions/v19`):

  ```text
  npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless \
    --include=projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts \
    --include=projects/sdcorejs-angular/components/section/src/section.component.spec.ts
  ```

## Frontend architecture plan

### Project conventions detected

- Standalone signal components, `input()`, native control flow; `versions/v19` is canonical.
- `sd-section.md` is the API contract and changes in the same commit.
- Showcase blocks use `<demo-section>` with a static `heading` and a `focusedSectionId` guard; `documentation.registry.ts` `demoSectionCount`, the registry spec totals and the generated example sources must match.
- Karma/Jasmine specs next to the component; host components for content projection.

Evidence inspected: `components/section/src/section-item/*`, `components/section/sd-section.md`, `showcase/src/app/pages/components/section/section-demo.component.ts`, `showcase/src/app/docs/core/documentation.registry{,.spec}.ts`, `scripts/generate-showcase-example-sources.mjs`, `scripts/sync-multi-version-workspaces.ps1`, repository `CLAUDE.md`, `CHANGELOG.md`.

### Component tree

```text
SdSection (unchanged)
  SdSectionItem
    .c-item-label (c-item-label T14R text-secondary, width = labelWidth)
      <ng-content select="[itemLeft]">{{ label() }}</ng-content>   (new)
    .c-item-content
      <ng-content>                                                  (unchanged)
```

### Decisions

- Reuse: `SdSectionItem` (extend). No new component, directive, service, style or entry point (INV-002).
- State: none; `label` is `input<string>('')`.
- Public exports: unchanged (`SdSectionItem` from `@sdcorejs/angular/components/section`).

```yaml
plan_context:
  schema_version: 2
  source: sdcorejs-plan
  architecture_gate:
    valid: true
    required: true
    status: required
    signals:
      - public-api-contract
    bypass: null
    rationale: Adds a content projection slot and relaxes the required-ness of an input on a published @sdcorejs/angular component on all four Angular lines; both are public API of the library.
  architecture_context:
    schema_version: 1
    source: sdcorejs-architecture
    contract_id: section-item-item-left
    requirement_id: R-001
    approved_spec_reference:
      repository_id: sdcorejs-angular
      artifact_id: spec-section-item-item-left-r1
      artifact_kind: spec
      revision: 59f6c3eba545108744b37c004867b8bfa10ea685
      approval_hash: sha256:v1:43b9950a325feba4e829f61a346e793810367725e1d8278c26713239b704fb38
    approved_architecture_path: .sdcorejs/architecture/angular/2026-10-08-16-37-section-item-item-left.md
    approved_architecture_hash: sha256:v1:99a943f9d9db8af8014e5d9f56f9e84828628c93f172de8fce3b510e79c6d80d
    owner_repository_id: sdcorejs-angular
    owner_module_id: null
    execution_host_repository_id: sdcorejs-angular
    integration_owner_repository_id: sdcorejs-angular
    trigger:
      required: true
      signals: [public-api-contract]
      rationale: Adds a content projection slot and relaxes the required-ness of an input on a published @sdcorejs/angular component on all four Angular lines; both are public API of the library.
    invariants:
      - {id: INV-001, statement: 'Consumers that pass only label render the same left column: c-item-label T14R text-secondary classes, labelWidth width and the label text.', scope: sd-section-item template API, owner: sdcorejs-angular, rationale: The slot is additive; every existing @sdcorejs/angular consumer on every Angular line must keep its current rendering without code changes., verification_method: 'section-item unit spec: label-only case asserts text, classes and width; value-slot case still projects.', requirement_refs: [R-001, R-003, R-004], decision_refs: [D-002, D-003]}
      - {id: INV-002, statement: 'No new dependency, entry point, service or style is added, and v20, v21 and v22 change only through npm run sync.', scope: '@sdcorejs/angular package surface on all four Angular lines', owner: sdcorejs-angular, rationale: 'An additive API change must not change the install footprint, and the version lines must stay derived from v19.', verification_method: npm run check:sync passes; diff review shows no package manifest or entry point change; v19 library build., requirement_refs: [R-005], decision_refs: [D-004]}
    boundaries: []
    dependency_directions: []
    data_state_owners: []
    public_contracts:
      - {id: PC-001, kind: api, statement: 'sd-section-item template API: optional input label (default empty string), input labelWidth (unchanged), content slot [itemLeft] that replaces the label text in the left column when present, default content slot for the value side.', owner: sdcorejs-angular, compatibility: 'Additive and backward compatible: label-only templates render unchanged; making label optional cannot break a valid template.', migration: None required. Consumers opt in by projecting an element marked itemLeft; same API as @sd-angular/core 19.0.43., invariant_refs: [INV-001]}
    security_trust_boundaries: []
    cross_repository_integration: []
    adopted_decision_refs:
      - D-001
      - D-002
      - D-003
      - D-004
      - D-005
    deferred_decision_refs: []
    assumption_refs:
      - A-001
      - A-002
    validation_obligations:
      - {id: VAL-001, expected_proof: 'section-item spec: label-only renders label with c-item-label T14R text-secondary and width; [itemLeft] renders the projected node and hides the label; slot-only without label creates; value slot still projects alongside [itemLeft].', owner: sdcorejs-angular, invariant_refs: [INV-001], acceptance_criterion_refs: [AC-001, AC-002, AC-003, AC-004]}
      - {id: VAL-002, expected_proof: 'v19 library build succeeds; npm run check:sync passes; package manifests unchanged; CHANGELOG [Unreleased] bullets; sd-section.md, showcase demo, registry count and generated example sources updated; mojibake scan clean.', owner: sdcorejs-angular, invariant_refs: [INV-002], acceptance_criterion_refs: [AC-005]}
    profile_sections:
      frontend_architecture_ref: {reference: plan_context.frontend_architecture, conformance_invariant_refs: [INV-001]}
      agent_architecture_ref: null
    change_control:
      revision: 1
      supersedes: null
  decision_coverage:
    schema_version: 1
    revision: 2
    records:
      - {id: R-001, type: requirement, statement: 'sd-section-item renders projected [itemLeft] content inside the left column (.c-item-label), which keeps the labelWidth width; [itemLeft] replaces the label text when present and the label renders as before when absent.', source: authoritative-contract, status: active, owner_repository_id: sdcorejs-angular, owner_module_id: null, task_refs: [TASK-001, TASK-002, TASK-006]}
      - {id: R-002, type: requirement, statement: label becomes an optional input defaulting to an empty string so slot-only usage no longer throws NG0950; existing label usages are unchanged., source: authoritative-contract, status: active, owner_repository_id: sdcorejs-angular, owner_module_id: null, task_refs: [TASK-001, TASK-002, TASK-006]}
      - {id: R-003, type: requirement, statement: 'The left column keeps its default c-item-label T14R text-secondary classes; projected [itemLeft] content controls its own typography and colour with its own classes.', source: authoritative-contract, status: active, owner_repository_id: sdcorejs-angular, owner_module_id: null, task_refs: [TASK-001, TASK-002, TASK-006]}
      - {id: R-004, type: requirement, statement: 'The default value slot in .c-item-content keeps working unchanged, including when [itemLeft] is used in the same item.', source: authoritative-contract, status: active, owner_repository_id: sdcorejs-angular, owner_module_id: null, task_refs: [TASK-001, TASK-002, TASK-006]}
      - {id: R-005, type: requirement, statement: 'The same change updates sd-section.md, adds an itemLeft showcase demo block with the registry count and regenerated example sources, adds CHANGELOG [Unreleased] Added and Changed bullets, and rolls the change out to v20, v21 and v22 only through npm run sync with check:sync passing.', source: authoritative-contract, status: active, owner_repository_id: sdcorejs-angular, owner_module_id: null, task_refs: [TASK-003, TASK-004, TASK-005, TASK-006]}
      - {id: AC-001, type: acceptance-criterion, statement: Label without slot., behavior: Render sd-section-item with only label and labelWidth., expected_result: The left column shows label with c-item-label T14R text-secondary and the labelWidth width., verification_kind: automated, blocking: true, requirement_refs: [R-001, R-003], task_refs: [TASK-001, TASK-002, TASK-006], evidence_refs: [EVIDENCE-001, EVIDENCE-002, EVIDENCE-006]}
      - {id: AC-002, type: acceptance-criterion, statement: Slot replaces label., behavior: 'Render sd-section-item with label and a projected span[itemLeft].T14M.', expected_result: 'The span renders inside the left column, the label text does not render, and labelWidth still applies.', verification_kind: automated, blocking: true, requirement_refs: [R-001, R-003], task_refs: [TASK-001, TASK-002, TASK-006], evidence_refs: [EVIDENCE-001, EVIDENCE-002, EVIDENCE-006]}
      - {id: AC-003, type: acceptance-criterion, statement: Optional label., behavior: 'Render sd-section-item without label but with [itemLeft] content.', expected_result: The component creates without error and label() is an empty string., verification_kind: automated, blocking: true, requirement_refs: [R-002], task_refs: [TASK-001, TASK-002, TASK-006], evidence_refs: [EVIDENCE-001, EVIDENCE-002, EVIDENCE-006]}
      - {id: AC-004, type: acceptance-criterion, statement: Value slot with itemLeft., behavior: 'Render sd-section-item with [itemLeft] and default value content.', expected_result: Both the left slot and the value content render in their columns., verification_kind: automated, blocking: true, requirement_refs: [R-004], task_refs: [TASK-001, TASK-002, TASK-006], evidence_refs: [EVIDENCE-001, EVIDENCE-002, EVIDENCE-006]}
      - {id: AC-005, type: acceptance-criterion, statement: 'Docs, showcase, changelog and rollout.', behavior: 'Inspect docs, showcase, registry, generated sources, CHANGELOG and v20-v22; run v19 section specs, the v19 library build, check:sync, the showcase example test, lint on changed files and the mojibake scan.', expected_result: 'Docs describe the slot, optional label, behaviour and an example; showcase has the demo block with demoSectionCount 9 and matching generated sources; CHANGELOG [Unreleased] has the bullets; specs, build, check:sync and the example test pass; lint adds no new errors; mojibake scan is clean.', verification_kind: automated, blocking: true, requirement_refs: [R-005], task_refs: [TASK-003, TASK-004, TASK-005, TASK-006], evidence_refs: [EVIDENCE-003, EVIDENCE-004, EVIDENCE-005, EVIDENCE-006]}
      - {id: A-001, type: assumption, statement: Angular 19 to 22 render ng-content default content only when no node matches the selector., source: explicit, confidence: high, status: confirmed, blocking: false, evidence_refs: [Angular 18+ ng-content default content feature, verified in @sd-angular/core 19.0.43], consequence_if_wrong: The label would disappear for every consumer., validation_method: A unit test without the slot asserts the label text., owner: nghiatt15_onemount, rationale: Documented framework behaviour since Angular 18., impacted_refs: [R-001]}
      - {id: A-002, type: assumption, statement: No consumer relies on the NG0950 error for a missing label., source: explicit, confidence: high, status: confirmed, blocking: false, evidence_refs: [every library and showcase usage passes label], consequence_if_wrong: A missing label renders an empty column instead of throwing., validation_method: Document the new behaviour in sd-section.md., owner: nghiatt15_onemount, rationale: Relaxing required-ness is additive for valid templates., impacted_refs: [R-002]}
      - {id: D-001, type: decision, statement: 'The slot selector is the attribute itemLeft, identical to @sd-angular/core 19.0.43.', question: Which selector does the slot use?, selected_value: '[itemLeft]', source: explicit-user, status: approved, blocking: true, scope: module, owner_repository_id: sdcorejs-angular, rationale: Same public API as @sd-angular/core; user asked for the same itemLeft on 2026-10-08., supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-001, AC-002], task_refs: [TASK-001, TASK-002]}
      - {id: D-002, type: decision, statement: 'label becomes input<string>('''') and the column falls back to label through ng-content default content, without a new contentChild or directive.', question: How does the fallback work?, selected_value: ng-content default content, source: explicit-user, status: approved, blocking: true, scope: module, owner_repository_id: sdcorejs-angular, rationale: Smallest change that keeps existing DOM for label-only consumers; mirrors @sd-angular/core 19.0.43., supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-001, R-002, AC-001, AC-003], task_refs: [TASK-001, TASK-002]}
      - {id: D-003, type: decision, statement: The .c-item-label div keeps c-item-label T14R text-secondary and the width; projected content overrides typography only on its own elements., question: What styling does the slot get?, selected_value: keep wrapper defaults, source: approved-spec, status: approved, blocking: true, scope: module, owner_repository_id: sdcorejs-angular, rationale: Backward compatible and lets consumers choose classes such as T14M., supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-003, AC-001, AC-002], task_refs: [TASK-001, TASK-002]}
      - {id: D-004, type: decision, statement: 'No version bump; the entry goes under CHANGELOG [Unreleased] and ships with the next maintainers release tag on all four lines.', question: How is it released?, selected_value: Unreleased changelog entry, source: explicit-user, status: approved, blocking: true, scope: module, owner_repository_id: sdcorejs-angular, rationale: 'Release suffixes are cut by the maintainers release ritual, not by feature PRs.', supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-005, AC-005], task_refs: [TASK-004]}
      - {id: D-005, type: decision, statement: 'Branch feat/section-item-item-left from origin/main 59f6c3eb, pull request into main, requirement reference NSP-5634.', question: Which branch and delivery path?, selected_value: feat/section-item-item-left, source: explicit-user, status: approved, blocking: true, scope: module, owner_repository_id: sdcorejs-angular, rationale: User asked for a branch from main and a PR into main on 2026-10-08., supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-005, AC-005], task_refs: [TASK-005, TASK-006]}
      - {id: D-006, type: decision, statement: 'No authorization, data or trust boundary is involved: the change is a presentational content slot in a UI library; proof is the section-item unit spec, the v19 library build, check:sync, the showcase generator test, lint and the mojibake scan.', question: Which validation boundary applies?, selected_value: none, source: approved-plan, status: approved, blocking: true, scope: module, owner_repository_id: sdcorejs-angular, rationale: Presentational component API only., supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-001, R-002, R-003, R-004, R-005, AC-001, AC-002, AC-003, AC-004, AC-005, INV-001, INV-002], task_refs: [TASK-006], validation_boundary: {kind: none, source_refs: [R-001, R-002, R-003, R-004, R-005, AC-001, AC-002, AC-003, AC-004, AC-005, INV-001, INV-002]}}
      - {id: INV-001, type: invariant, statement: 'Consumers that pass only label render the same left column: c-item-label T14R text-secondary classes, labelWidth width and the label text.', protected_refs: [R-001, R-003, AC-001], task_refs: [TASK-002], evidence_refs: [EVIDENCE-002]}
      - {id: INV-002, type: invariant, statement: 'No new dependency, entry point, service or style is added, and v20, v21 and v22 change only through npm run sync.', protected_refs: [R-005, AC-005], task_refs: [TASK-005], evidence_refs: [EVIDENCE-005]}
    history:
      - {revision: 1, active: [{id: R-001, type: requirement}, {id: R-002, type: requirement}, {id: R-003, type: requirement}, {id: R-004, type: requirement}, {id: R-005, type: requirement}, {id: AC-001, type: acceptance-criterion}, {id: AC-002, type: acceptance-criterion}, {id: AC-003, type: acceptance-criterion}, {id: AC-004, type: acceptance-criterion}, {id: AC-005, type: acceptance-criterion}, {id: A-001, type: assumption}, {id: A-002, type: assumption}, {id: D-001, type: decision}, {id: D-002, type: decision}, {id: D-003, type: decision}, {id: D-004, type: decision}, {id: D-005, type: decision}, {id: INV-001, type: invariant}, {id: INV-002, type: invariant}], tombstones: []}
      - {revision: 2, active: [{id: R-001, type: requirement}, {id: R-002, type: requirement}, {id: R-003, type: requirement}, {id: R-004, type: requirement}, {id: R-005, type: requirement}, {id: AC-001, type: acceptance-criterion}, {id: AC-002, type: acceptance-criterion}, {id: AC-003, type: acceptance-criterion}, {id: AC-004, type: acceptance-criterion}, {id: AC-005, type: acceptance-criterion}, {id: A-001, type: assumption}, {id: A-002, type: assumption}, {id: D-001, type: decision}, {id: D-002, type: decision}, {id: D-003, type: decision}, {id: D-004, type: decision}, {id: D-005, type: decision}, {id: D-006, type: decision}, {id: INV-001, type: invariant}, {id: INV-002, type: invariant}], tombstones: []}
  goal_backward_review:
    schema_version: 1
    mode: sdcorejs-plan:goal-backward
    decision_coverage:
      schema_version: 1
      revision: 2
      records: [{id: R-001, type: requirement, statement: 'sd-section-item renders projected [itemLeft] content inside the left column (.c-item-label), which keeps the labelWidth width; [itemLeft] replaces the label text when present and the label renders as before when absent.', source: authoritative-contract, status: active, owner_repository_id: sdcorejs-angular, owner_module_id: null, task_refs: [TASK-001, TASK-002, TASK-006]}, {id: R-002, type: requirement, statement: label becomes an optional input defaulting to an empty string so slot-only usage no longer throws NG0950; existing label usages are unchanged., source: authoritative-contract, status: active, owner_repository_id: sdcorejs-angular, owner_module_id: null, task_refs: [TASK-001, TASK-002, TASK-006]}, {id: R-003, type: requirement, statement: 'The left column keeps its default c-item-label T14R text-secondary classes; projected [itemLeft] content controls its own typography and colour with its own classes.', source: authoritative-contract, status: active, owner_repository_id: sdcorejs-angular, owner_module_id: null, task_refs: [TASK-001, TASK-002, TASK-006]}, {id: R-004, type: requirement, statement: 'The default value slot in .c-item-content keeps working unchanged, including when [itemLeft] is used in the same item.', source: authoritative-contract, status: active, owner_repository_id: sdcorejs-angular, owner_module_id: null, task_refs: [TASK-001, TASK-002, TASK-006]}, {id: R-005, type: requirement, statement: 'The same change updates sd-section.md, adds an itemLeft showcase demo block with the registry count and regenerated example sources, adds CHANGELOG [Unreleased] Added and Changed bullets, and rolls the change out to v20, v21 and v22 only through npm run sync with check:sync passing.', source: authoritative-contract, status: active, owner_repository_id: sdcorejs-angular, owner_module_id: null, task_refs: [TASK-003, TASK-004, TASK-005, TASK-006]}, {id: AC-001, type: acceptance-criterion, statement: Label without slot., behavior: Render sd-section-item with only label and labelWidth., expected_result: The left column shows label with c-item-label T14R text-secondary and the labelWidth width., verification_kind: automated, blocking: true, requirement_refs: [R-001, R-003], task_refs: [TASK-001, TASK-002, TASK-006], evidence_refs: [EVIDENCE-001, EVIDENCE-002, EVIDENCE-006]}, {id: AC-002, type: acceptance-criterion, statement: Slot replaces label., behavior: 'Render sd-section-item with label and a projected span[itemLeft].T14M.', expected_result: 'The span renders inside the left column, the label text does not render, and labelWidth still applies.', verification_kind: automated, blocking: true, requirement_refs: [R-001, R-003], task_refs: [TASK-001, TASK-002, TASK-006], evidence_refs: [EVIDENCE-001, EVIDENCE-002, EVIDENCE-006]}, {id: AC-003, type: acceptance-criterion, statement: Optional label., behavior: 'Render sd-section-item without label but with [itemLeft] content.', expected_result: The component creates without error and label() is an empty string., verification_kind: automated, blocking: true, requirement_refs: [R-002], task_refs: [TASK-001, TASK-002, TASK-006], evidence_refs: [EVIDENCE-001, EVIDENCE-002, EVIDENCE-006]}, {id: AC-004, type: acceptance-criterion, statement: Value slot with itemLeft., behavior: 'Render sd-section-item with [itemLeft] and default value content.', expected_result: Both the left slot and the value content render in their columns., verification_kind: automated, blocking: true, requirement_refs: [R-004], task_refs: [TASK-001, TASK-002, TASK-006], evidence_refs: [EVIDENCE-001, EVIDENCE-002, EVIDENCE-006]}, {id: AC-005, type: acceptance-criterion, statement: 'Docs, showcase, changelog and rollout.', behavior: 'Inspect docs, showcase, registry, generated sources, CHANGELOG and v20-v22; run v19 section specs, the v19 library build, check:sync, the showcase example test, lint on changed files and the mojibake scan.', expected_result: 'Docs describe the slot, optional label, behaviour and an example; showcase has the demo block with demoSectionCount 9 and matching generated sources; CHANGELOG [Unreleased] has the bullets; specs, build, check:sync and the example test pass; lint adds no new errors; mojibake scan is clean.', verification_kind: automated, blocking: true, requirement_refs: [R-005], task_refs: [TASK-003, TASK-004, TASK-005, TASK-006], evidence_refs: [EVIDENCE-003, EVIDENCE-004, EVIDENCE-005, EVIDENCE-006]}, {id: A-001, type: assumption, statement: Angular 19 to 22 render ng-content default content only when no node matches the selector., source: explicit, confidence: high, status: confirmed, blocking: false, evidence_refs: [Angular 18+ ng-content default content feature, verified in @sd-angular/core 19.0.43], consequence_if_wrong: The label would disappear for every consumer., validation_method: A unit test without the slot asserts the label text., owner: nghiatt15_onemount, rationale: Documented framework behaviour since Angular 18., impacted_refs: [R-001]}, {id: A-002, type: assumption, statement: No consumer relies on the NG0950 error for a missing label., source: explicit, confidence: high, status: confirmed, blocking: false, evidence_refs: [every library and showcase usage passes label], consequence_if_wrong: A missing label renders an empty column instead of throwing., validation_method: Document the new behaviour in sd-section.md., owner: nghiatt15_onemount, rationale: Relaxing required-ness is additive for valid templates., impacted_refs: [R-002]}, {id: D-001, type: decision, statement: 'The slot selector is the attribute itemLeft, identical to @sd-angular/core 19.0.43.', question: Which selector does the slot use?, selected_value: '[itemLeft]', source: explicit-user, status: approved, blocking: true, scope: module, owner_repository_id: sdcorejs-angular, rationale: Same public API as @sd-angular/core; user asked for the same itemLeft on 2026-10-08., supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-001, AC-002], task_refs: [TASK-001, TASK-002]}, {id: D-002, type: decision, statement: 'label becomes input<string>('''') and the column falls back to label through ng-content default content, without a new contentChild or directive.', question: How does the fallback work?, selected_value: ng-content default content, source: explicit-user, status: approved, blocking: true, scope: module, owner_repository_id: sdcorejs-angular, rationale: Smallest change that keeps existing DOM for label-only consumers; mirrors @sd-angular/core 19.0.43., supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-001, R-002, AC-001, AC-003], task_refs: [TASK-001, TASK-002]}, {id: D-003, type: decision, statement: The .c-item-label div keeps c-item-label T14R text-secondary and the width; projected content overrides typography only on its own elements., question: What styling does the slot get?, selected_value: keep wrapper defaults, source: approved-spec, status: approved, blocking: true, scope: module, owner_repository_id: sdcorejs-angular, rationale: Backward compatible and lets consumers choose classes such as T14M., supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-003, AC-001, AC-002], task_refs: [TASK-001, TASK-002]}, {id: D-004, type: decision, statement: 'No version bump; the entry goes under CHANGELOG [Unreleased] and ships with the next maintainers release tag on all four lines.', question: How is it released?, selected_value: Unreleased changelog entry, source: explicit-user, status: approved, blocking: true, scope: module, owner_repository_id: sdcorejs-angular, rationale: 'Release suffixes are cut by the maintainers release ritual, not by feature PRs.', supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-005, AC-005], task_refs: [TASK-004]}, {id: D-005, type: decision, statement: 'Branch feat/section-item-item-left from origin/main 59f6c3eb, pull request into main, requirement reference NSP-5634.', question: Which branch and delivery path?, selected_value: feat/section-item-item-left, source: explicit-user, status: approved, blocking: true, scope: module, owner_repository_id: sdcorejs-angular, rationale: User asked for a branch from main and a PR into main on 2026-10-08., supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-005, AC-005], task_refs: [TASK-005, TASK-006]}, {id: D-006, type: decision, statement: 'No authorization, data or trust boundary is involved: the change is a presentational content slot in a UI library; proof is the section-item unit spec, the v19 library build, check:sync, the showcase generator test, lint and the mojibake scan.', question: Which validation boundary applies?, selected_value: none, source: approved-plan, status: approved, blocking: true, scope: module, owner_repository_id: sdcorejs-angular, rationale: Presentational component API only., supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-001, R-002, R-003, R-004, R-005, AC-001, AC-002, AC-003, AC-004, AC-005, INV-001, INV-002], task_refs: [TASK-006], validation_boundary: {kind: none, source_refs: [R-001, R-002, R-003, R-004, R-005, AC-001, AC-002, AC-003, AC-004, AC-005, INV-001, INV-002]}}, {id: INV-001, type: invariant, statement: 'Consumers that pass only label render the same left column: c-item-label T14R text-secondary classes, labelWidth width and the label text.', protected_refs: [R-001, R-003, AC-001], task_refs: [TASK-002], evidence_refs: [EVIDENCE-002]}, {id: INV-002, type: invariant, statement: 'No new dependency, entry point, service or style is added, and v20, v21 and v22 change only through npm run sync.', protected_refs: [R-005, AC-005], task_refs: [TASK-005], evidence_refs: [EVIDENCE-005]}]
      history: [{revision: 1, active: [{id: R-001, type: requirement}, {id: R-002, type: requirement}, {id: R-003, type: requirement}, {id: R-004, type: requirement}, {id: R-005, type: requirement}, {id: AC-001, type: acceptance-criterion}, {id: AC-002, type: acceptance-criterion}, {id: AC-003, type: acceptance-criterion}, {id: AC-004, type: acceptance-criterion}, {id: AC-005, type: acceptance-criterion}, {id: A-001, type: assumption}, {id: A-002, type: assumption}, {id: D-001, type: decision}, {id: D-002, type: decision}, {id: D-003, type: decision}, {id: D-004, type: decision}, {id: D-005, type: decision}, {id: INV-001, type: invariant}, {id: INV-002, type: invariant}], tombstones: []}, {revision: 2, active: [{id: R-001, type: requirement}, {id: R-002, type: requirement}, {id: R-003, type: requirement}, {id: R-004, type: requirement}, {id: R-005, type: requirement}, {id: AC-001, type: acceptance-criterion}, {id: AC-002, type: acceptance-criterion}, {id: AC-003, type: acceptance-criterion}, {id: AC-004, type: acceptance-criterion}, {id: AC-005, type: acceptance-criterion}, {id: A-001, type: assumption}, {id: A-002, type: assumption}, {id: D-001, type: decision}, {id: D-002, type: decision}, {id: D-003, type: decision}, {id: D-004, type: decision}, {id: D-005, type: decision}, {id: D-006, type: decision}, {id: INV-001, type: invariant}, {id: INV-002, type: invariant}], tombstones: []}]
    goals:
      - {id: G-001, statement: '@sdcorejs/angular consumers can replace the sd-section-item label with their own [itemLeft] content, with label optional, on all four Angular lines.', task_refs: [TASK-001, TASK-002, TASK-003, TASK-004, TASK-005]}
      - {id: G-002, statement: 'Label-only consumers render unchanged and v19, v20, v21, v22, docs and showcase stay consistent.', task_refs: [TASK-002, TASK-005, TASK-006]}
    tasks:
      - {id: TASK-001, owner_repository_id: sdcorejs-angular, dependencies: [], planned_paths: [versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts], planned_evidence: [{id: EVIDENCE-001, record_refs: [R-001, R-002, R-003, R-004, AC-001, AC-002, AC-003, AC-004, D-001, D-002, D-003]}], justification_refs: [R-001, R-002, R-003, R-004, D-001, D-002, D-003], enforces_invariant_refs: []}
      - {id: TASK-002, owner_repository_id: sdcorejs-angular, dependencies: [TASK-001], planned_paths: [versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.ts, versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.html], planned_evidence: [{id: EVIDENCE-002, record_refs: [R-001, R-002, R-003, R-004, AC-001, AC-002, AC-003, AC-004, D-001, D-002, D-003, INV-001]}], justification_refs: [R-001, R-002, R-003, R-004, D-001, D-002, D-003], enforces_invariant_refs: [INV-001]}
      - {id: TASK-003, owner_repository_id: sdcorejs-angular, dependencies: [TASK-002], planned_paths: [versions/v19/projects/sdcorejs-angular/components/section/sd-section.md, showcase/src/app/pages/components/section/section-demo.component.ts, showcase/src/app/docs/core/documentation.registry.ts, showcase/src/app/docs/core/documentation.registry.spec.ts, showcase/src/app/docs/generated/example-sources.generated.ts, showcase/src/app/docs/generated/example-manifest.generated.ts], planned_evidence: [{id: EVIDENCE-003, record_refs: [R-005, AC-005]}], justification_refs: [R-005], enforces_invariant_refs: []}
      - {id: TASK-004, owner_repository_id: sdcorejs-angular, dependencies: [TASK-003], planned_paths: [CHANGELOG.md], planned_evidence: [{id: EVIDENCE-004, record_refs: [R-005, AC-005, D-004]}], justification_refs: [R-005, D-004], enforces_invariant_refs: []}
      - {id: TASK-005, owner_repository_id: sdcorejs-angular, dependencies: [TASK-004], planned_paths: [versions/v19/SYNC-STATUS.md, versions/v20/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts, versions/v20/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.ts, versions/v20/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.html, versions/v20/projects/sdcorejs-angular/components/section/sd-section.md, versions/v20/SYNC-STATUS.md, versions/v21/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts, versions/v21/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.ts, versions/v21/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.html, versions/v21/projects/sdcorejs-angular/components/section/sd-section.md, versions/v21/SYNC-STATUS.md, versions/v22/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts, versions/v22/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.ts, versions/v22/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.html, versions/v22/projects/sdcorejs-angular/components/section/sd-section.md, versions/v22/SYNC-STATUS.md], planned_evidence: [{id: EVIDENCE-005, record_refs: [R-005, AC-005, D-005, INV-002]}], justification_refs: [R-005, D-005], enforces_invariant_refs: [INV-002]}
      - {id: TASK-006, owner_repository_id: sdcorejs-angular, dependencies: [TASK-005], planned_paths: [versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.scss], planned_evidence: [{id: EVIDENCE-006, record_refs: [R-001, R-002, R-003, R-004, R-005, AC-001, AC-002, AC-003, AC-004, AC-005, D-005, D-006]}], justification_refs: [R-001, R-002, R-003, R-004, R-005, D-005, D-006], enforces_invariant_refs: []}
    repository_inventory:
      repositories: [{repository_id: sdcorejs-angular, existing_paths: [versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts, versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.ts, versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.html, versions/v19/projects/sdcorejs-angular/components/section/sd-section.md, showcase/src/app/pages/components/section/section-demo.component.ts, showcase/src/app/docs/core/documentation.registry.ts, showcase/src/app/docs/core/documentation.registry.spec.ts, showcase/src/app/docs/generated/example-sources.generated.ts, showcase/src/app/docs/generated/example-manifest.generated.ts, CHANGELOG.md, versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.scss, versions/v19/SYNC-STATUS.md, versions/v20/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts, versions/v20/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.ts, versions/v20/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.html, versions/v20/projects/sdcorejs-angular/components/section/sd-section.md, versions/v20/SYNC-STATUS.md, versions/v21/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts, versions/v21/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.ts, versions/v21/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.html, versions/v21/projects/sdcorejs-angular/components/section/sd-section.md, versions/v21/SYNC-STATUS.md, versions/v22/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts, versions/v22/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.ts, versions/v22/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.html, versions/v22/projects/sdcorejs-angular/components/section/sd-section.md, versions/v22/SYNC-STATUS.md], intended_new_paths: []}]
    critique_history:
      - {round: 1, checker_version: sdcorejs-plan:goal-backward:v1, blockers: [], resolved_blockers: [], unresolved_blockers: []}
  validation_map:
    - risk: section-item-slot
      boundary: {kind: none, approval_ref: D-006, source_refs: [R-001, R-002, R-003, R-004, R-005, AC-001, AC-002, AC-003, AC-004, AC-005, INV-001, INV-002]}
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
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts --include=projects/sdcorejs-angular/components/section/src/section.component.spec.ts
      requirement_id: R-001
      acceptance_criterion_id: AC-001
      invariant_refs: [INV-001]
      case_ids: [case-sdx-section-item-label-only]
      expected_proof: Label-only renders the label text with the labelWidth width.
      evidence_refs: [EVIDENCE-001, EVIDENCE-002, EVIDENCE-006]
    - risk: section-item-slot
      boundary: {kind: none, approval_ref: D-006, source_refs: [R-001, R-002, R-003, R-004, R-005, AC-001, AC-002, AC-003, AC-004, AC-005, INV-001, INV-002]}
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
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts --include=projects/sdcorejs-angular/components/section/src/section.component.spec.ts
      requirement_id: R-003
      acceptance_criterion_id: AC-001
      invariant_refs: [INV-001]
      case_ids: [case-sdx-section-item-label-only-classes]
      expected_proof: Label-only left column keeps c-item-label T14R text-secondary.
      evidence_refs: [EVIDENCE-001, EVIDENCE-002, EVIDENCE-006]
    - risk: section-item-slot
      boundary: {kind: none, approval_ref: D-006, source_refs: [R-001, R-002, R-003, R-004, R-005, AC-001, AC-002, AC-003, AC-004, AC-005, INV-001, INV-002]}
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
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts --include=projects/sdcorejs-angular/components/section/src/section.component.spec.ts
      requirement_id: R-001
      acceptance_criterion_id: AC-002
      invariant_refs: [INV-001]
      case_ids: [case-sdx-section-item-item-left-replaces-label]
      expected_proof: '[itemLeft] span renders in the left column, label text hidden, width kept.'
      evidence_refs: [EVIDENCE-001, EVIDENCE-002, EVIDENCE-006]
    - risk: section-item-slot
      boundary: {kind: none, approval_ref: D-006, source_refs: [R-001, R-002, R-003, R-004, R-005, AC-001, AC-002, AC-003, AC-004, AC-005, INV-001, INV-002]}
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
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts --include=projects/sdcorejs-angular/components/section/src/section.component.spec.ts
      requirement_id: R-003
      acceptance_criterion_id: AC-002
      invariant_refs: [INV-001]
      case_ids: [case-sdx-section-item-item-left-own-typography]
      expected_proof: Projected [itemLeft] element carries its own T14M class inside the left column.
      evidence_refs: [EVIDENCE-001, EVIDENCE-002, EVIDENCE-006]
    - risk: section-item-slot
      boundary: {kind: none, approval_ref: D-006, source_refs: [R-001, R-002, R-003, R-004, R-005, AC-001, AC-002, AC-003, AC-004, AC-005, INV-001, INV-002]}
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
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts --include=projects/sdcorejs-angular/components/section/src/section.component.spec.ts
      requirement_id: R-002
      acceptance_criterion_id: AC-003
      invariant_refs: [INV-001]
      case_ids: [case-sdx-section-item-optional-label]
      expected_proof: Slot-only usage without label creates; label() is empty.
      evidence_refs: [EVIDENCE-001, EVIDENCE-002, EVIDENCE-006]
    - risk: section-item-slot
      boundary: {kind: none, approval_ref: D-006, source_refs: [R-001, R-002, R-003, R-004, R-005, AC-001, AC-002, AC-003, AC-004, AC-005, INV-001, INV-002]}
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
      planned_command: npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts --include=projects/sdcorejs-angular/components/section/src/section.component.spec.ts
      requirement_id: R-004
      acceptance_criterion_id: AC-004
      invariant_refs: [INV-001]
      case_ids: [case-sdx-section-item-value-with-item-left]
      expected_proof: Value content and [itemLeft] both render in their columns.
      evidence_refs: [EVIDENCE-001, EVIDENCE-002, EVIDENCE-006]
    - risk: release
      boundary: {kind: none, approval_ref: D-006, source_refs: [R-001, R-002, R-003, R-004, R-005, AC-001, AC-002, AC-003, AC-004, AC-005, INV-001, INV-002]}
      authorization_boundary: false
      levels: [integration]
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
      planned_command: npm --prefix versions/v19 exec -- ng build sdcorejs-angular && npm run test:showcase-examples && npm run check:sync
      requirement_id: R-005
      acceptance_criterion_id: AC-005
      invariant_refs: [INV-002]
      case_ids: [case-sdx-section-item-docs-sync]
      expected_proof: v19 build, showcase generator test and check:sync pass; docs, showcase, registry, generated sources and CHANGELOG updated; manifests unchanged; mojibake scan clean.
      evidence_refs: [EVIDENCE-003, EVIDENCE-004, EVIDENCE-005, EVIDENCE-006]
  contract_id: section-item-item-left
  requirement_id: NSP-5634
  approved_spec_path: .sdcorejs/specs/angular/2026-10-08-16-37-section-item-item-left.md
  approved_spec_hash: sha256:v1:43b9950a325feba4e829f61a346e793810367725e1d8278c26713239b704fb38
  approved_spec_reference:
    immutable_identity:
      repository_id: sdcorejs-angular
      repository_relative_path: .sdcorejs/specs/angular/2026-10-08-16-37-section-item-item-left.md
      artifact_id: spec-section-item-item-left-r1
      revision: 59f6c3eba545108744b37c004867b8bfa10ea685
      approval_hash: sha256:v1:43b9950a325feba4e829f61a346e793810367725e1d8278c26713239b704fb38
  approved_architecture_path: .sdcorejs/architecture/angular/2026-10-08-16-37-section-item-item-left.md
  approved_architecture_hash: sha256:v1:99a943f9d9db8af8014e5d9f56f9e84828628c93f172de8fce3b510e79c6d80d
  approved_plan_path: ''
  approved_plan_hash: ''
  supersedes: null
  target_root: C:/Users/nghiatt15_onemount/Documents/sdcorejs/sdcorejs-angular
  target_root_kind: target-project
  owner_repository_id: sdcorejs-angular
  owner_repository_role: library
  owner_module_id: null
  execution_host_repository_id: sdcorejs-angular
  integration_owner_repository_id: sdcorejs-angular
  dependency_order:
    - sdcorejs-angular
  gitlink_updates_in_scope: false
  track: angular
  stack_profile: core-ui-angular
  task_count: 6
  phase_count: 5
  allowed_paths:
    - versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts
    - versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.ts
    - versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.html
    - versions/v19/projects/sdcorejs-angular/components/section/sd-section.md
    - showcase/src/app/pages/components/section/section-demo.component.ts
    - showcase/src/app/docs/core/documentation.registry.ts
    - showcase/src/app/docs/core/documentation.registry.spec.ts
    - showcase/src/app/docs/generated/example-sources.generated.ts
    - showcase/src/app/docs/generated/example-manifest.generated.ts
    - CHANGELOG.md
    - versions/v19/SYNC-STATUS.md
    - versions/v20/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts
    - versions/v20/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.ts
    - versions/v20/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.html
    - versions/v20/projects/sdcorejs-angular/components/section/sd-section.md
    - versions/v20/SYNC-STATUS.md
    - versions/v21/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts
    - versions/v21/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.ts
    - versions/v21/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.html
    - versions/v21/projects/sdcorejs-angular/components/section/sd-section.md
    - versions/v21/SYNC-STATUS.md
    - versions/v22/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts
    - versions/v22/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.ts
    - versions/v22/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.html
    - versions/v22/projects/sdcorejs-angular/components/section/sd-section.md
    - versions/v22/SYNC-STATUS.md
    - .sdcorejs/docs/angular/2026-10-08-16-37-section-item-item-left-spec.md
    - .sdcorejs/specs/angular/2026-10-08-16-37-section-item-item-left.md
    - .sdcorejs/docs/architecture/2026-10-08-16-37-section-item-item-left-architecture.md
    - .sdcorejs/architecture/angular/2026-10-08-16-37-section-item-item-left.md
    - .sdcorejs/docs/angular/2026-10-08-16-37-section-item-item-left-plan.md
    - .sdcorejs/plans/angular/2026-10-08-16-37-section-item-item-left.md
    - .sdcorejs/docs/angular/2026-10-08-16-37-section-item-item-left-execution.md
  prohibited_paths:
    - package.json
    - package-lock.json
    - versions/*/package.json
    - versions/*/package-lock.json
    - showcase/package.json
    - showcase/package-lock.json
    - node_modules/**
    - versions/*/dist/**
    - published-docs/**
    - published-pages/**
    - showcase/src/app/docs/generated/changelog.generated.ts
    - versions/v19/projects/sdcorejs-angular/components/section/src/section.component.*
    - versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.scss
    - CLAUDE.md
    - AGENTS.md
  generated_artifacts:
    - showcase/src/app/docs/generated/example-sources.generated.ts
    - showcase/src/app/docs/generated/example-manifest.generated.ts
    - versions/v19/SYNC-STATUS.md
    - versions/v20/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts
    - versions/v20/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.ts
    - versions/v20/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.html
    - versions/v20/projects/sdcorejs-angular/components/section/sd-section.md
    - versions/v20/SYNC-STATUS.md
    - versions/v21/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts
    - versions/v21/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.ts
    - versions/v21/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.html
    - versions/v21/projects/sdcorejs-angular/components/section/sd-section.md
    - versions/v21/SYNC-STATUS.md
    - versions/v22/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts
    - versions/v22/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.ts
    - versions/v22/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.html
    - versions/v22/projects/sdcorejs-angular/components/section/sd-section.md
    - versions/v22/SYNC-STATUS.md
  docs_artifacts:
    - .sdcorejs/docs/angular/2026-10-08-16-37-section-item-item-left-spec.md
    - .sdcorejs/specs/angular/2026-10-08-16-37-section-item-item-left.md
    - .sdcorejs/docs/architecture/2026-10-08-16-37-section-item-item-left-architecture.md
    - .sdcorejs/architecture/angular/2026-10-08-16-37-section-item-item-left.md
    - .sdcorejs/docs/angular/2026-10-08-16-37-section-item-item-left-plan.md
    - .sdcorejs/plans/angular/2026-10-08-16-37-section-item-item-left.md
    - .sdcorejs/docs/angular/2026-10-08-16-37-section-item-item-left-execution.md
    - versions/v19/projects/sdcorejs-angular/components/section/sd-section.md
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
    conventions:
      component_style: standalone signal components, input(), native control flow; versions/v19 is canonical and v20-v22 derive through npm run sync
      docs: sd-section.md in versions/v19 is the API contract and changes in the same commit
      showcase: demo-section blocks with a focusedSectionId guard and a static heading; documentation.registry demoSectionCount and the generated example sources must match
      tests: Karma + Jasmine next to the component; host components for content projection
      evidence: [versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.ts, versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.html, versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts, versions/v19/projects/sdcorejs-angular/components/section/sd-section.md, showcase/src/app/pages/components/section/section-demo.component.ts, showcase/src/app/docs/core/documentation.registry.ts, CLAUDE.md, CHANGELOG.md]
    reuse_decisions:
      - {need: custom left column, existing: SdSectionItem, decision: 'extend with [itemLeft] ng-content default content (same API as @sd-angular/core 19.0.43)', ownership: library public API}
    component_tree: SdSection (unchanged) > SdSectionItem > .c-item-label (c-item-label T14R text-secondary, labelWidth) > ng-content [itemLeft] with label fallback; .c-item-content > default ng-content
    responsibilities:
      - {unit: SdSectionItem, responsibility: 'render one label : value row; left column from [itemLeft] or label', state_owner: none (inputs only)}
    data_flow: inputs label/labelWidth + projected [itemLeft]/value content -> template
    registrations:
      - {symbol: SdSectionItem, scope: public, mechanism: existing components/section entry point (unchanged)}
    files:
      create: []
      extend: [versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.ts, versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.html, versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts, versions/v19/projects/sdcorejs-angular/components/section/sd-section.md, showcase/src/app/pages/components/section/section-demo.component.ts, showcase/src/app/docs/core/documentation.registry.ts, showcase/src/app/docs/core/documentation.registry.spec.ts, CHANGELOG.md]
      not_created: [directive, labelClass input, new entry point]
    tests:
      component: versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts
      provider_scope: not applicable
    decomposition_rationale: One presentational component gains one slot; no extraction is warranted.
  agent_architecture:
    required: false
    conformance_invariant_refs: []
    not_applicable_reason: Not an AI-agent change.
  verification_strategy:
    package_manager: npm
    commands_planned:
      - {command: (versions/v19) npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/section/src/section-item/section-item.component.spec.ts --include=projects/sdcorejs-angular/components/section/src/section.component.spec.ts, reason: 'baseline, RED after TASK-001, GREEN after TASK-002'}
      - {command: (versions/v19) npx ng build sdcorejs-angular, reason: library typecheck gate (AC-005)}
      - {command: npm run generate:showcase-examples && npm run test:showcase-examples, reason: generated example sources match the demo (AC-005)}
      - {command: npm run sync && npm run check:sync, reason: 'rollout v19 to v20-v22 and release guard (AC-005, INV-002)'}
      - {command: npx eslint <changed ts/html files> (versions/v19), reason: AC-005}
      - {command: mojibake scan of touched text files, reason: repository rule (AC-005)}
    commands_skipped:
      - {command: full v19 suite with --code-coverage, reason: release gate run by the maintainers release workflow; focused section specs cover this change}
      - {command: v20/v21/v22 library builds, reason: section-item has no per-major shim beyond the sync-applied v22 change detection; check:sync guards the rollout}
    checks: TDD on section-item; v19 library build; showcase generator test; check:sync; lint; mojibake scan; diff limited to planned paths
  parallel_candidates:
    allowed: false
    contract: 'Sequential: one component with dependent tasks and a repository-wide sync.'
    shared_files: []
  repository_plan:
    schema_version: 1
    integration_owner_repository_id: sdcorejs-angular
    dependency_order:
      - sdcorejs-angular
    contract: All tasks run in sdcorejs-angular on branch feat/section-item-item-left from origin/main; pull request into main; no tag or publish.
  finish_tail:
    contract: 'docs_before_final_branch_ready: execution record before the final verification rerun; verify_before_done then branch_ready; no_writes_after_branch_ready: true'
  approval:
    approved: false
    approved_at: null
  change_control:
    revision: 1
    supersedes: null
    change_reason: null
```

## Execution preflight

1. Working tree: only the new `.sdcorejs` artifacts of this change are untracked.
2. Baseline: run the section specs on `59f6c3eb` and record the result.

## Tasks

Paths are repository-relative. `S = versions/v19/projects/sdcorejs-angular/components/section`.

### Phase 1 - RED

1. **TASK-001 EDIT** `S/src/section-item/section-item.component.spec.ts`: specs for label-only rendering (classes, width, text), the slot replacing the label, the value slot alongside `[itemLeft]`, slot-only without `label`, and `label()` defaulting to `''`.

### Phase 2 - GREEN

2. **TASK-002 EDIT** `S/src/section-item/section-item.component.{ts,html}`: `label = input<string>('')`; `.c-item-label` wraps `<ng-content select="[itemLeft]">{{ label() }}</ng-content>`.

### Phase 3 - Docs, showcase and changelog

3. **TASK-003 EDIT**:
   - `S/sd-section.md`: `label` optional, a `<sd-section-item>` slots table, the fallback and `@if` behaviour, colour inheritance, an example;
   - `showcase/.../section-demo.component.ts`: one guarded demo block for `itemLeft`;
   - `documentation.registry.ts` section `demoSectionCount` 8 to 9, `documentation.registry.spec.ts` totals 403 to 404;
   - `npm run generate:showcase-examples` regenerates `example-sources.generated.ts` and `example-manifest.generated.ts`.
4. **TASK-004 EDIT** `CHANGELOG.md` `[Unreleased]`: one Added bullet (slot) and one Changed bullet (optional `label`).

### Phase 4 - Rollout

5. **TASK-005 RUN-WRITE** `npm run sync` from the repository root, then restore v22 paths whose blobs are unchanged (CRLF noise), then `npm run check:sync`. Expected writes: the four changed section files in v20, v21 and v22 plus each `SYNC-STATUS.md`.

### Phase 5 - Verification

6. **TASK-006 RUN** (no file change):
   - section specs in `versions/v19`;
   - `npx ng build sdcorejs-angular` in `versions/v19`;
   - `npm run test:showcase-examples`;
   - `npm run check:sync`;
   - `npx eslint` on the changed TypeScript/HTML files in `versions/v19` and the showcase demo;
   - mojibake scan on the touched text files;
   - `git diff --name-only` limited to the planned paths plus `.sdcorejs` artifacts.

## Integration

Commit on `feat/section-item-item-left` as `feat(section): ...`, push, open a pull request into `main`. No tag, publish, published-docs or published-pages change.

## Acceptance mapping

- AC-001 (R-001, R-003) -> TASK-001, TASK-002, TASK-006
- AC-002 (R-001, R-003) -> TASK-001, TASK-002, TASK-006
- AC-003 (R-002) -> TASK-001, TASK-002, TASK-006
- AC-004 (R-004) -> TASK-001, TASK-002, TASK-006
- AC-005 (R-005) -> TASK-003, TASK-004, TASK-005, TASK-006

## Verification

- Section specs (command above); v19 library build; `npm run test:showcase-examples`; `npm run check:sync`; `npx eslint <changed files>`; mojibake scan.
- Manual: none required.

## Decisions captured during review

- (approved as summarised with the spec and architecture, user choice 1 on 2026-10-08)

## Skill provenance

sdcorejs-plan (approved on attempt 1 / 3)
