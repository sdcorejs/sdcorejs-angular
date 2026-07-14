---
name: integrate-angular-material-datetime
description: Execute the approved dependency-backed SdDatetime integration across Angular 19, 20 and 21.
approvedAt: 2026-07-14T15:32:22+07:00
approvedBy: session-user
track: angular
sourceSpecPath: .sdcorejs/specs/angular/2026-07-14-14-55-integrate-angular-material-datetime.md
taskCount: 9
phaseCount: 5
target_root_kind: target-project
stack_profile: core-ui-angular
approved_spec_hash: 4f49f83227b30cb83202f5dea999f9e64c157051a81c49aec67e913ee24eeaa9
allowed_paths:
  - versions/v19/package.json
  - versions/v19/package-lock.json
  - versions/v19/projects/sdcorejs-angular/package.json
  - versions/v19/projects/sdcorejs-angular/ng-package.json
  - versions/v19/projects/sdcorejs-angular/forms/datetime/**
  - versions/v20/package.json
  - versions/v20/package-lock.json
  - versions/v20/projects/sdcorejs-angular/package.json
  - versions/v20/projects/sdcorejs-angular/ng-package.json
  - versions/v20/projects/sdcorejs-angular/forms/datetime/**
  - versions/v21/package.json
  - versions/v21/package-lock.json
  - versions/v21/projects/sdcorejs-angular/package.json
  - versions/v21/projects/sdcorejs-angular/ng-package.json
  - versions/v21/projects/sdcorejs-angular/forms/datetime/**
  - versions/v19/SYNC-STATUS.md
  - versions/v20/SYNC-STATUS.md
  - versions/v21/SYNC-STATUS.md
  - .sdcorejs/docs/angular/*angular-material-datetime*.md
  - .sdcorejs/docs/angular/*sd-datetime*.md
  - .sdcorejs/documentation/technical-docs/*datetime*.md
  - .sdcorejs/documentation/user-guides/*datetime*.md
  - .sdcorejs/tasks/angular.md
prohibited_paths:
  - .sdcorejs/tasks/current-session.md
  - .sdcorejs/specs/**
  - .sdcorejs/plans/**
  - .github/**
  - package.json
  - package-lock.json
  - scripts/**
  - images/**
  - versions/v19/projects/showcase/**
  - versions/v20/projects/showcase/**
  - versions/v21/projects/showcase/**
  - published-docs/**
  - '**/.env*'
  - C:/Users/nghiatt15_onemount/Documents/sdcorejs/angular-material-datetime/**
dependency_changes:
  required: true
  approval_required: true
env_changes:
  required: false
  approval_required: false
migration_changes:
  required: true
  approval_required: true
approved_plan_hash: 3ce1aa102d178c14ab1b2b09c21b7b3cbbd5f7fdfa4f8975222b2d1919af39e4
supersedes: null
change_control:
  revision: 1
  supersedes: null
  change_reason: null
---

# Tích hợp angular-material-datetime vào sd-datetime - Approved Plan

> Snapshot of what the user approved at the `sdcorejs-plan` gate. Do not edit by hand; re-author through `sdcorejs-plan` if the contract changes.

## Approved contract

# Plan - Tích hợp angular-material-datetime vào sd-datetime - 2026-07-14 14:57

## Scope

Thay bản picker vendored bên trong `SdDatetime` bằng runtime dependency `@sdcorejs/angular-material-datetime@1.0.2`, giữ nguyên public API và hành vi wrapper. Thực hiện trên v19 source of truth, rollout tương thích sang v20/v21, cập nhật lockfile riêng và chứng minh bằng integration tests cùng production builds.

## Execution context

- Track: `angular`
- Target root kind: `target-project`
- Stack profile: `core-ui-angular`
- Coverage approach: `post-hoc`
- Parallel candidates: có, nhưng chỉ cho test/build độc lập theo workspace sau khi source, manifest và lockfile đã rollout xong.
- Working tree: đang dirty bởi showcase/branding trên branch `feat/showcase-release-branding`; execution phải giữ nguyên content diff của các path ngoài scope.

```yaml
plan_context:
  source: sdcorejs-plan
  contract_id: datetime-material-package-1
  requirement_id: datetime-external-package
  approved_spec_path: .sdcorejs/specs/angular/2026-07-14-14-55-integrate-angular-material-datetime.md
  approved_spec_hash: 4f49f83227b30cb83202f5dea999f9e64c157051a81c49aec67e913ee24eeaa9
  approved_plan_path: .sdcorejs/plans/angular/2026-07-14-15-32-integrate-angular-material-datetime.md
  approved_plan_hash: 3ce1aa102d178c14ab1b2b09c21b7b3cbbd5f7fdfa4f8975222b2d1919af39e4
  supersedes: null
  target_root: C:/Users/nghiatt15_onemount/Documents/sdcorejs/sdcorejs-angular
  target_root_kind: target-project
  track: angular
  stack_profile: core-ui-angular
  task_count: 9
  phase_count: 5
  allowed_paths:
    - versions/v19/package.json
    - versions/v19/package-lock.json
    - versions/v19/projects/sdcorejs-angular/package.json
    - versions/v19/projects/sdcorejs-angular/ng-package.json
    - versions/v19/projects/sdcorejs-angular/forms/datetime/**
    - versions/v20/package.json
    - versions/v20/package-lock.json
    - versions/v20/projects/sdcorejs-angular/package.json
    - versions/v20/projects/sdcorejs-angular/ng-package.json
    - versions/v20/projects/sdcorejs-angular/forms/datetime/**
    - versions/v21/package.json
    - versions/v21/package-lock.json
    - versions/v21/projects/sdcorejs-angular/package.json
    - versions/v21/projects/sdcorejs-angular/ng-package.json
    - versions/v21/projects/sdcorejs-angular/forms/datetime/**
    - versions/v19/SYNC-STATUS.md
    - versions/v20/SYNC-STATUS.md
    - versions/v21/SYNC-STATUS.md
    - .sdcorejs/docs/angular/*angular-material-datetime*.md
    - .sdcorejs/docs/angular/*sd-datetime*.md
    - .sdcorejs/documentation/technical-docs/*datetime*.md
    - .sdcorejs/documentation/user-guides/*datetime*.md
    - .sdcorejs/tasks/angular.md
  prohibited_paths:
    - .sdcorejs/tasks/current-session.md
    - .sdcorejs/specs/**
    - .sdcorejs/plans/**
    - .github/**
    - package.json
    - package-lock.json
    - scripts/**
    - images/**
    - versions/v19/projects/showcase/**
    - versions/v20/projects/showcase/**
    - versions/v21/projects/showcase/**
    - published-docs/**
    - '**/.env*'
    - C:/Users/nghiatt15_onemount/Documents/sdcorejs/angular-material-datetime/**
  generated_artifacts:
    - versions/v19/node_modules/**
    - versions/v20/node_modules/**
    - versions/v21/node_modules/**
    - versions/v19/dist/**
    - versions/v20/dist/**
    - versions/v21/dist/**
    - versions/v19/coverage/**
    - versions/v20/coverage/**
    - versions/v21/coverage/**
    - versions/v19/.angular/**
    - versions/v20/.angular/**
    - versions/v21/.angular/**
    - versions/v19/SYNC-STATUS.md
    - versions/v20/SYNC-STATUS.md
    - versions/v21/SYNC-STATUS.md
  docs_artifacts:
    - versions/v19/projects/sdcorejs-angular/forms/datetime/sd-datetime.md
    - versions/v20/projects/sdcorejs-angular/forms/datetime/sd-datetime.md
    - versions/v21/projects/sdcorejs-angular/forms/datetime/sd-datetime.md
    - .sdcorejs/docs/angular/*angular-material-datetime*.md
    - .sdcorejs/documentation/technical-docs/*datetime*.md
    - .sdcorejs/documentation/user-guides/*datetime*.md
  dependency_changes:
    required: true
    packages:
      - '@sdcorejs/angular-material-datetime@1.0.2'
    approval_required: true
  env_changes:
    required: false
    files: []
    approval_required: false
  migration_changes:
    required: true
    description: Replace the vendored picker source with an exact runtime dependency without changing the SdDatetime contract.
    approval_required: true
  verification_strategy:
    package_manager: npm
    scripts_detected:
      - name: versions/v19 test:ci
      - name: versions/v19 build
      - name: root sync
      - name: root check:sync
    commands_planned:
      - command_or_script: npm --prefix versions/v19 run test:ci -- --include=projects/sdcorejs-angular/forms/datetime/src/datetime.component.spec.ts
        reason: Verify the wrapper/package integration seam on Angular 19.
      - command_or_script: npm --prefix versions/v20 run test:ci -- --include=projects/sdcorejs-angular/forms/datetime/src/datetime.component.spec.ts
        reason: Verify the same seam on Angular 20.
      - command_or_script: npm --prefix versions/v21 run test:ci -- --include=projects/sdcorejs-angular/forms/datetime/src/datetime.component.spec.ts
        reason: Verify the same seam on Angular 21.
      - command_or_script: npm --prefix versions/v19 run build
        reason: Verify ng-packagr and published metadata on Angular 19.
      - command_or_script: npm --prefix versions/v20 run build
        reason: Verify ng-packagr and published metadata on Angular 20.
      - command_or_script: npm --prefix versions/v21 run build
        reason: Verify ng-packagr and published metadata on Angular 21.
      - command_or_script: npm run check:sync
        reason: Prove v20/v21 library and showcase content remain synchronized from v19.
      - command_or_script: npm --prefix versions/v19 ls @sdcorejs/angular-material-datetime --depth=0
        reason: Prove the exact dependency resolves in v19; repeat for v20/v21.
      - command_or_script: git diff --check
        reason: Catch whitespace and patch-integrity defects before handoff.
    commands_skipped:
      - command_or_probe: full workspace lint
        reason: No focused lint script exists and the workspace has unrelated dirty showcase files; TypeScript compilation, focused tests and diff checks cover the approved source scope.
      - command_or_probe: manual visual redesign review
        reason: The approved spec has zero manual criteria and package 1.0.2 is source-equivalent to the vendored UI; automated overlay integration tests cover the seam.
    focused_checks:
      - No import or buildable reference to forms/datetime/src/material-datetime remains.
      - Picker creation has no DI error without app-level provider configuration.
      - Enabled/disabled open, Apply, Cancel, Now, min/max, seconds normalization and overlay cleanup pass.
      - Scoped source diff preserves the SdDatetime public entrypoint and wrapper API.
    broad_checks:
      - Production library builds pass for Angular 19, 20 and 21.
      - Dependency trees resolve exactly 1.0.2 without a duplicate Angular major.
      - Repository sync parity and final diff integrity pass.
      - Content diff of pre-existing showcase/branding paths is unchanged from the preflight baseline.
  parallel_candidates:
    allowed: true
    units:
      - id: verify-v19
        title: Run focused tests and production build for v19.
        allowed_paths:
          - versions/v19/coverage/**
          - versions/v19/dist/**
          - versions/v19/.angular/**
        dependencies:
          - rollout-complete
      - id: verify-v20
        title: Run focused tests and production build for v20.
        allowed_paths:
          - versions/v20/coverage/**
          - versions/v20/dist/**
          - versions/v20/.angular/**
        dependencies:
          - rollout-complete
      - id: verify-v21
        title: Run focused tests and production build for v21.
        allowed_paths:
          - versions/v21/coverage/**
          - versions/v21/dist/**
          - versions/v21/.angular/**
        dependencies:
          - rollout-complete
    shared_files:
      - path: versions/v19/package.json and versions/v19/package-lock.json
        coordination_strategy: parent-owned
      - path: versions/v19/projects/sdcorejs-angular/**
        coordination_strategy: sequential
      - path: versions/v20/package-lock.json and versions/v21/package-lock.json
        coordination_strategy: parent-owned
      - path: versions/v19/SYNC-STATUS.md, versions/v20/SYNC-STATUS.md and versions/v21/SYNC-STATUS.md
        coordination_strategy: parent-owned
    conflict_risks:
      - The sync command mirrors broad workspace content while showcase/branding files are already dirty.
      - Concurrent npm installs could contend for shared cache even though workspace node_modules directories are separate.
      - Verification agents must not edit source or package manifests.
  finish_tail:
    docs_before_final_branch_ready: true
    branch_ready_final_gate: true
  approval:
    approved: true
    approved_at: 2026-07-14T15:32:22+07:00
  change_control:
    revision: 1
    supersedes: null
    change_reason: null
```

## Tasks

### Phase 1 - Preflight and scope protection

1. VERIFY repo root with `git status --short`, staged/unstaged diffstat, untracked files, branch, HEAD and per-path baseline hashes - require the execution-time dirty-tree choice, confirm approved spec hash, and abort if any scoped datetime/manifest file has an unexpected pre-existing edit.

### Phase 2 - v19 dependency-backed implementation

2. EDIT `versions/v19/package.json`, `versions/v19/package-lock.json`, `versions/v19/projects/sdcorejs-angular/package.json` and `versions/v19/projects/sdcorejs-angular/ng-package.json` - install and declare exact runtime dependency `@sdcorejs/angular-material-datetime@1.0.2`, including the ng-packagr allow-list.
3. EDIT `versions/v19/projects/sdcorejs-angular/forms/datetime/src/datetime.component.ts` and `sd-datetime.md`; DELETE `versions/v19/projects/sdcorejs-angular/forms/datetime/src/material-datetime/` - switch all picker/adapter/token imports atomically, retain component-scoped providers and wrapper API, and correct dependency/adapter documentation.
4. EDIT `versions/v19/projects/sdcorejs-angular/forms/datetime/src/datetime.component.spec.ts` - add post-hoc integration regressions for package resolution/DI, enabled and disabled open, Apply/Cancel/Now, seconds normalization, min/max propagation and overlay cleanup without duplicating the package's internal unit suite.

### Phase 3 - Multi-version rollout

5. RUN root `sync` and workspace npm installs against `versions/v20/package-lock.json` and `versions/v21/package-lock.json` - mirror the approved v19 source/manifest/deletion into v20/v21, install exact 1.0.2 in each workspace, and prove the before/after content diff of prohibited showcase/branding paths is unchanged.

### Phase 4 - Verification

6. RUN focused `datetime.component.spec.ts` Karma suites in v19, v20 and v21 - execute independent workspace checks, optionally in parallel only after task 5 completes, and require zero failures.
7. RUN `sdcorejs-angular` production builds in v19, v20 and v21 - execute independent ng-packagr builds, optionally in parallel, and require exit code 0 with the external package resolved.
8. VERIFY repo root and all three workspaces with dependency-tree checks, source-reference search, `check:sync`, `git diff --check`, scoped status/diff review and public-entrypoint inspection - prove AC-001 through AC-010 and confirm no unrelated dirty content changed.

### Phase 5 - Mandatory finish tail

9. RUN the SDCoreJS finish tail in order - `sdcorejs-test`, `sdcorejs-review`, `sdcorejs-repair-loop` for verified findings, automatic code documentation, Angular UI-impact check, optional technical/user documentation only if approved at its gate, auto-docs, auto-task-tracker, relevant memory review, `sdcorejs-ship` verify-before-done, then `sdcorejs-ship` branch-ready as the final read-only gate; perform no write after branch-ready.

## Acceptance mapping

- AC-001 -> tasks 3, 5, 8
- AC-002 -> tasks 3, 5, 8
- AC-003 -> tasks 2, 5, 8
- AC-004 -> tasks 3, 4, 6, 7, 8
- AC-005 -> tasks 3, 4, 6
- AC-006 -> tasks 4, 6
- AC-007 -> tasks 4, 6
- AC-008 -> tasks 4, 6, 7
- AC-009 -> tasks 3, 5, 8
- AC-010 -> tasks 1, 5, 6, 7, 8, 9

## Verification

- `npm --prefix versions/v19 run test:ci -- --include=projects/sdcorejs-angular/forms/datetime/src/datetime.component.spec.ts`, lặp lại cho v20/v21.
- `npm --prefix versions/v19 run build`, lặp lại cho v20/v21.
- `npm --prefix versions/v19 ls @sdcorejs/angular-material-datetime --depth=0`, lặp lại cho v20/v21.
- `npm run check:sync`.
- Source-reference search phải không tìm thấy import/path vendored còn sót lại.
- `git diff --check` và scoped before/after diff phải giữ nguyên content của showcase/branding ngoài scope.
- Manual: không yêu cầu; approved spec có `manual_criteria_count: 0`.

## Execution-time dirty-tree gate

Trước mọi edit, do worktree có thay đổi ngoài scope, `sdcorejs-execute-plan` phải hỏi đúng một lựa chọn:

1. Tiếp tục nhưng chỉ sửa các path đã được plan cho phép.
2. Tiếp tục và cho phép chạm thêm các dirty path được người dùng chỉ rõ.
3. Dừng để người dùng clean hoặc stash trước.

Khuyến nghị lựa chọn 1; riêng `SYNC-STATUS.md` là generated coordination path đã được plan cho phép. `projects/showcase/**`, root `package.json`, `.github/**`, scripts branding và `.sdcorejs/tasks/current-session.md` vẫn bị cấm thay đổi content.

## Decisions captured during review

- (approved as drafted)

## Skill provenance

sdcorejs-plan (approved on attempt 1 / 3)

