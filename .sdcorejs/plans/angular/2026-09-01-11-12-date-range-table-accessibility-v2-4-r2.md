---
artifact_id: plan-sdcorejs-angular-date-range-table-accessibility-v2-4-r2
artifact_kind: plan
schema_version: 1
change_ref: sdcorejs-angular-date-range-table-accessibility-v2-4
source_spec: .sdcorejs/specs/angular/2026-09-01-08-03-date-range-table-accessibility-v2-4.md
source_plan: none
commit_policy: with-change
owner: sdcorejs-plan
name: date-range-table-accessibility-v2-4-r2
description: Approved review-repair revision for the SdDateRange and SdTable accessibility release v2.4.
contract_id: sdcorejs-angular-date-range-table-accessibility-v2-4
requirement_id: REQ-SDANGULAR-A11Y-2-4
approved_at: "2026-09-01T04:12:23.328Z"
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
parent_references: []
owner_repository_id: github.com/sdcorejs/sdcorejs-angular
owner_repository_role: library
owner_module_id: date-range-table-accessibility
execution_host_repository_id: github.com/sdcorejs/sdcorejs-angular
integration_owner_repository_id: github.com/sdcorejs/sdcorejs-angular
repository_relative_path: .sdcorejs/plans/angular/2026-09-01-11-12-date-range-table-accessibility-v2-4-r2.md
source_revision: 08091a93f162afa0768de5e932890e4098c89bc9
dependency_order:
  - sdcorejs-angular
gitlink_updates_in_scope: false
task_count: 6
phase_count: 2
target_root_kind: target-project
stack_profile: core-ui-angular
approved_spec_hash: "sha256:v1:2d3f657ef97ac716144afcfb17443562943fa59784e4a681863391a61e32f4d6"
allowed_paths:
  - .sdcorejs/docs/angular/2026-09-01-07-42-date-range-table-accessibility-v2-4-spec.md
  - .sdcorejs/specs/angular/2026-09-01-08-03-date-range-table-accessibility-v2-4.md
  - .sdcorejs/docs/angular/2026-09-01-08-07-date-range-table-accessibility-v2-4-plan.md
  - .sdcorejs/plans/angular/2026-09-01-08-07-date-range-table-accessibility-v2-4.md
  - .sdcorejs/docs/angular/2026-09-01-11-12-date-range-table-accessibility-v2-4-plan-r2.md
  - .sdcorejs/plans/angular/2026-09-01-11-12-date-range-table-accessibility-v2-4-r2.md
  - versions/v19/package.json
  - versions/v19/package-lock.json
  - versions/v19/projects/sdcorejs-angular/forms/date-range/src/date-range.component.html
  - versions/v19/projects/sdcorejs-angular/forms/date-range/src/date-range.component.spec.ts
  - versions/v19/projects/sdcorejs-angular/forms/date-range/sd-date-range.md
  - versions/v19/projects/sdcorejs-angular/components/table/src/table.component.html
  - versions/v19/projects/sdcorejs-angular/components/table/src/table.component.scss
  - versions/v19/projects/sdcorejs-angular/components/table/src/table.component.ts
  - versions/v19/projects/sdcorejs-angular/components/table/src/table.component.spec.ts
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
    - focused Karma date/table matrix on Angular 19, 20 and 21
    - full Karma Angular 19 and 20 plus disclosed Angular 21 baseline
    - lint and build Angular 19, 20 and 21
    - sync parity and root script suite
    - pack and npm registry verification
approval_hash: "sha256:v1:55b061ebcf2ef98ce0c9117209010f7c4499e2e1d8c33767680044ce2e51e479"
supersedes: .sdcorejs/plans/angular/2026-09-01-08-07-date-range-table-accessibility-v2-4.md
change_control:
  revision: 2
  supersedes: .sdcorejs/plans/angular/2026-09-01-08-07-date-range-table-accessibility-v2-4.md
  change_reason: Independent review found the existing canonical table spec missing from the revision 1 allowlist; revision 2 also binds the approved test-hardening repairs.
---

# SdDateRange and SdTable accessibility release 2.4 — Approved Plan Revision 2

> Immutable replacement for revision 1. The approved product contract and release target are unchanged.

## Approved contract delta

- Permit the required assertion update in `versions/v19/projects/sdcorejs-angular/components/table/src/table.component.spec.ts` so omitted sorting has no `aria-sort` or focusable sort control.
- Remove unnecessary filter-host propagation blockers; filter remains a sibling of the title-only sort control and retains an explicit no-sort regression test.
- Cover custom titles and resize behavior under both disabled and omitted sorting.
- Replace the Axe fixture's real 850 ms delay with deterministic Angular virtual-time settling.

## Tasks

1. EDIT the canonical v19 table template and test files listed in `allowed_paths`.
2. VERIFY the focused v19 table suite before generating mirrors.
3. GENERATE v20/v21 only with the repository sync script and verify parity.
4. VERIFY the combined date/table matrix on all three supported Angular lines.
5. VERIFY all release test, lint, build, script, page and package gates invalidated by this repair.
6. Run independent re-review, then return to ship and branch-ready before Git/release artifacts.

## Decisions captured during review

- User selection `1` approved applying all review hardening after explicitly requiring extremely thorough tests.
- No public API, Portal, Material arrow, consumer syntax or release version decision changed.

## Skill provenance

sdcorejs-plan (approved revision 2 on attempt 2 / 3)
