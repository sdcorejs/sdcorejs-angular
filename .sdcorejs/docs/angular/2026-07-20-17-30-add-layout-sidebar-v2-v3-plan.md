# Plan - Bổ sung Sidebar V2/V3 cho Layout Module - 2026-07-20 17:30

## Scope

Thực thi approved spec cho Layout Module: giữ public contract V1, thay cơ chế nhận diện device tĩnh bằng responsive state theo viewport, bổ sung V2 Rail/Flyout + Bottom Navigation/Bottom Sheet và V3 Unified Drawer + Global Search/Pinned/Recent. Shared navigation state phải migrate storage V1 an toàn, lọc permission trước search/render và giữ UI state riêng theo version.

Mọi source/test/docs được làm tại `versions/v19` trước, sau đó root sync tạo mirror v20/v21. Không thêm dependency, không sửa package manifest/lockfile, không bump version, publish, tag hoặc deploy trong execution này.

## Execution context

- Track: `angular`
- Target root kind: `target-project`
- Stack profile: `core-ui-angular`
- Coverage approach: `TDD` RED-first theo bốn slice: shared foundation, V2, V3, Showcase/docs.
- Approved spec: `.sdcorejs/specs/angular/2026-07-20-17-26-add-layout-sidebar-v2-v3.md`
- Approved spec SHA-256: `7539a4b40d54e95f77706c4e9c029d02ca1056618f4c304a5e2aaecd1c2fdf2c`
- Source of truth: `versions/v19`; v20/v21 là generated mirrors qua root sync.
- Parallel candidates: chỉ các focused tests/build theo Angular major sau rollout; implementation giữ tuần tự vì config, storage, shared components và `layout-main` là coordination paths.
- Working tree: đang có dirty context/status files của task trước và hai spec artifacts vừa tạo; execution phải chạy dirty-tree gate trước mọi source edit.

```yaml
plan_context:
  source: sdcorejs-plan
  contract_id: sdcorejs-angular-layout-sidebar-v2-v3-v1
  requirement_id: layout-sidebar-v2-v3-20260720
  approved_spec_path: .sdcorejs/specs/angular/2026-07-20-17-26-add-layout-sidebar-v2-v3.md
  approved_spec_hash: 7539a4b40d54e95f77706c4e9c029d02ca1056618f4c304a5e2aaecd1c2fdf2c
  approved_plan_path: .sdcorejs/plans/angular/2026-07-20-18-06-add-layout-sidebar-v2-v3.md
  approved_plan_hash: 591b88faf717f76622906a79bb5e2fcab0ae3fa602aa9550e942df6724167ce7
  supersedes: null
  target_root: C:/Users/nghiatt15_onemount/Documents/sdcorejs/sdcorejs-angular
  target_root_kind: target-project
  track: angular
  stack_profile: core-ui-angular
  task_count: 14
  phase_count: 7
  allowed_paths:
    - versions/v19/projects/sdcorejs-angular/modules/layout/**
    - versions/v19/projects/showcase/src/app/pages/modules/layout/**
    - versions/v19/projects/showcase/src/app/docs/core/documentation.registry.ts
    - versions/v19/projects/showcase/src/app/docs/core/documentation.registry.spec.ts
    - versions/v19/projects/showcase/src/app/docs/generated/example-sources.generated.ts
    - versions/v20/projects/sdcorejs-angular/modules/layout/**
    - versions/v20/projects/showcase/src/app/pages/modules/layout/**
    - versions/v20/projects/showcase/src/app/docs/core/documentation.registry.ts
    - versions/v20/projects/showcase/src/app/docs/core/documentation.registry.spec.ts
    - versions/v20/projects/showcase/src/app/docs/generated/example-sources.generated.ts
    - versions/v21/projects/sdcorejs-angular/modules/layout/**
    - versions/v21/projects/showcase/src/app/pages/modules/layout/**
    - versions/v21/projects/showcase/src/app/docs/core/documentation.registry.ts
    - versions/v21/projects/showcase/src/app/docs/core/documentation.registry.spec.ts
    - versions/v21/projects/showcase/src/app/docs/generated/example-sources.generated.ts
    - versions/v19/SYNC-STATUS.md
    - versions/v20/SYNC-STATUS.md
    - versions/v21/SYNC-STATUS.md
    - .sdcorejs/docs/angular/*layout-sidebar-v2-v3*.md
    - .sdcorejs/documentation/technical-docs/*layout-sidebar*.md
    - .sdcorejs/documentation/user-guides/*layout-sidebar*.md
    - .sdcorejs/tasks/angular.md
  prohibited_paths:
    - .sdcorejs/summary.md
    - .sdcorejs/tasks/current-session.md
    - .sdcorejs/specs/**
    - .sdcorejs/plans/**
    - .github/**
    - package.json
    - package-lock.json
    - scripts/**
    - published-docs/**
    - README.md
    - docs/npm-README.md
    - versions/v19/package.json
    - versions/v19/package-lock.json
    - versions/v20/package.json
    - versions/v20/package-lock.json
    - versions/v21/package.json
    - versions/v21/package-lock.json
    - versions/*/projects/sdcorejs-angular/package.json
    - versions/*/projects/showcase/src/app/layout/**
    - versions/*/projects/sdcorejs-angular/**/node_modules/**
    - '**/.env*'
  generated_artifacts:
    - versions/v20/projects/sdcorejs-angular/modules/layout/**
    - versions/v20/projects/showcase/src/app/pages/modules/layout/**
    - versions/v20/projects/showcase/src/app/docs/core/documentation.registry.ts
    - versions/v20/projects/showcase/src/app/docs/core/documentation.registry.spec.ts
    - versions/v20/projects/showcase/src/app/docs/generated/example-sources.generated.ts
    - versions/v21/projects/sdcorejs-angular/modules/layout/**
    - versions/v21/projects/showcase/src/app/pages/modules/layout/**
    - versions/v21/projects/showcase/src/app/docs/core/documentation.registry.ts
    - versions/v21/projects/showcase/src/app/docs/core/documentation.registry.spec.ts
    - versions/v21/projects/showcase/src/app/docs/generated/example-sources.generated.ts
    - versions/v19/SYNC-STATUS.md
    - versions/v20/SYNC-STATUS.md
    - versions/v21/SYNC-STATUS.md
    - versions/*/dist/**
    - versions/*/coverage/**
    - versions/*/.angular/**
  docs_artifacts:
    - versions/v19/projects/sdcorejs-angular/modules/layout/sd-layout.md
    - versions/v20/projects/sdcorejs-angular/modules/layout/sd-layout.md
    - versions/v21/projects/sdcorejs-angular/modules/layout/sd-layout.md
    - .sdcorejs/docs/angular/*layout-sidebar-v2-v3*.md
    - .sdcorejs/documentation/technical-docs/*layout-sidebar*.md
    - .sdcorejs/documentation/user-guides/*layout-sidebar*.md
  dependency_changes:
    required: false
    packages: []
    approval_required: false
  env_changes:
    required: false
    files: []
    approval_required: false
  migration_changes:
    required: true
    description: Lazy local-storage migration from legacy pinned menu objects to stable menu keys while preserving readable V1 data.
    approval_required: true
  verification_strategy:
    package_manager: npm
    scripts_detected:
      - name: root sync
      - name: root check:sync
      - name: root lint:release
      - name: root test:showcase-generators
      - name: versions/v19 test
      - name: versions/v19 test:ci
      - name: versions/v19 test:showcase
      - name: versions/v19 build
      - name: versions/v19 build:showcase
      - name: versions/v20 test
      - name: versions/v20 build
      - name: versions/v21 test
      - name: versions/v21 build
    commands_planned:
      - command_or_script: npm --prefix versions/v19 run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless --code-coverage=false --include=projects/sdcorejs-angular/modules/layout/**/*.spec.ts
        reason: Drive each v19 RED-to-GREEN layout slice without the known global coverage threshold blocker.
      - command_or_script: npm --prefix versions/v19 run test:showcase -- --include=projects/showcase/src/app/pages/modules/layout/**/*.spec.ts --include=projects/showcase/src/app/docs/core/documentation.registry.spec.ts
        reason: Verify the interactive Layout Showcase and registry integration.
      - command_or_script: npm run test:showcase-generators
        reason: Verify generated example sources and documentation registry consistency.
      - command_or_script: npm run sync
        reason: Roll the v19 source of truth into Angular 20 and 21 mirrors.
      - command_or_script: npm run check:sync
        reason: Prove cross-version source and Showcase parity.
      - command_or_script: npm --prefix versions/v19 run test:ci
        reason: Compare the broad Karma result with the recorded 3198 pass, 15 fail, 9 skip baseline and require zero new touched-path failures.
      - command_or_script: npm run lint:release
        reason: Run the detected release lint for all three Angular majors.
      - command_or_script: npm --prefix versions/v19 run build
        reason: Verify the v19 published Angular library compiles.
      - command_or_script: npm --prefix versions/v20 run build
        reason: Verify the v20 mirror compiles.
      - command_or_script: npm --prefix versions/v21 run build
        reason: Verify the v21 mirror compiles.
      - command_or_script: npm --prefix versions/v19 run build:showcase
        reason: Verify the Layout preview and generated docs compile in the Showcase application.
      - command_or_script: git diff --check
        reason: Catch whitespace and patch-integrity defects.
    commands_skipped:
      - command_or_probe: npm install or dependency audit
        reason: The approved spec adds no dependency and prohibits package manifest or lockfile changes.
      - command_or_probe: external E2E runner or browser installation
        reason: No E2E script is detected; the one manual browser criterion uses the existing local Showcase and installed browser.
      - command_or_probe: require full Karma exit code 0 as the sole gate
        reason: The recorded baseline has 15 failures and coverage below threshold; focused GREEN suites plus zero new broad-run regressions are the approved evidence.
    focused_checks:
      - Public V1/V2/V3 configuration compile contract and breakpoint normalization.
      - Responsive listener cleanup and live V1/V2/V3 switching.
      - V2 click and hover-lock state machines, primary-menu fallback, search and pin behavior.
      - V3 collapsed preference, Global Search, Pinned/Recent and permission filtering.
      - Legacy storage migration, stale-key cleanup and per-version UI state namespace.
      - Showcase version/viewport selector and registry loader.
    broad_checks:
      - Focused layout suites pass on Angular 19, 20 and 21 after rollout.
      - Library builds pass on Angular 19, 20 and 21.
      - Showcase generator tests and v19 production Showcase build pass.
      - Release lint, sync parity and diff integrity pass.
      - Full Karma introduces zero new failure attributable to touched paths.
  parallel_candidates:
    allowed: true
    units:
      - id: verify-v19
        title: Run v19 focused tests and library build after rollout.
        allowed_paths:
          - versions/v19/dist/**
          - versions/v19/coverage/**
          - versions/v19/.angular/**
        dependencies:
          - rollout-complete
      - id: verify-v20
        title: Run v20 focused tests and library build after rollout.
        allowed_paths:
          - versions/v20/dist/**
          - versions/v20/coverage/**
          - versions/v20/.angular/**
        dependencies:
          - rollout-complete
      - id: verify-v21
        title: Run v21 focused tests and library build after rollout.
        allowed_paths:
          - versions/v21/dist/**
          - versions/v21/coverage/**
          - versions/v21/.angular/**
        dependencies:
          - rollout-complete
    shared_files:
      - path: versions/v19/projects/sdcorejs-angular/modules/layout/**
        coordination_strategy: sequential
      - path: versions/v19/projects/showcase/src/app/docs/core/documentation.registry.ts
        coordination_strategy: parent-owned
      - path: versions/v19/SYNC-STATUS.md, versions/v20/SYNC-STATUS.md and versions/v21/SYNC-STATUS.md
        coordination_strategy: parent-owned
      - path: .sdcorejs/summary.md and .sdcorejs/tasks/current-session.md
        coordination_strategy: prohibited
    conflict_risks:
      - Shared config, navigation state and layout-main are dependencies of both V2 and V3.
      - Root sync writes broad mirror paths and three already-dirty SYNC-STATUS files.
      - Concurrent Angular builds can contend for CPU/memory and generated caches.
      - Verification workers must never edit source or approved plan/spec artifacts.
  finish_tail:
    docs_before_final_branch_ready: true
    branch_ready_final_gate: true
  approval:
    approved: true
    approved_at: 2026-07-20T18:06:46+07:00
  change_control:
    revision: 1
    supersedes: null
    change_reason: null
```

## Tasks

Trong Phase 2-4, các path bắt đầu bằng `configurations/`, `services/` hoặc `components/` được resolve dưới `versions/v19/projects/sdcorejs-angular/modules/layout/`. Trong Phase 5, các path bắt đầu bằng `projects/` được resolve dưới `versions/v19/`; v20/v21 chỉ nhận mirror qua task 11.

### Phase 1 - Preflight and approved-input mapping

1. **VERIFY** repo root, target-root guard, branch, HEAD, upstream status, `git status --short`, staged/unstaged diffstat, untracked files, approved-spec path/hash and allowed/prohibited paths before edits. Show the execution-time dirty-tree choice; capture exact hashes/content for `.sdcorejs/summary.md`, `.sdcorejs/tasks/current-session.md` and all three `SYNC-STATUS.md`; abort on unexpected pre-existing edits under v19 Layout or the planned Showcase paths. Prohibited dirty context files must remain byte-identical; the three allowed status files may change only through root sync and must retain their prior task information plus the new generated rollout metadata.

2. **ANALYZE** the approved visual companion and existing V1 through the Angular `input-analysis.md` gate - produce an ephemeral Core UI reuse/decomposition map for rail, tree, user menu, overlay, responsive composition and route-active behavior; confirm every CREATE path below is absent and every EDIT path exists; map all ACs to automated or manual evidence before creating test bones. Do not copy the response-only mockup into project source.

### Phase 2 - Shared responsive/navigation foundation (TDD)

3. **CREATE/RUN RED** `configurations/layout.configuration.spec.ts`, `services/responsive/responsive.service.spec.ts`, `services/menu/menu.utils.spec.ts`, `services/navigation-state/navigation-state.service.spec.ts`, `services/storage/storage.service.spec.ts`, `components/layout-main/layout-main.component.spec.ts` and `components/sidebar-v1/main.component.spec.ts` before behavior implementation. Cover discriminated-union/default normalization, live breakpoint updates/cleanup, stable keys/search/primary selection, shared versus namespaced state, lazy V1 storage migration, permission/stale filtering and V1 composition. First run may be compile RED while new symbols are absent; after minimal compile shells exist, require exactly 20 named shared assertions RED.

4. **CREATE/EDIT/RUN GREEN** `services/responsive/responsive.service.ts`, `services/menu/menu.utils.ts`, `services/navigation-state/navigation-state.service.ts`, `configurations/layout.configuration.ts`, `services/storage/storage.service.ts`, `services/index.ts`, `components/layout-main/{layout-main.component.ts,layout-main.component.html,layout-main.component.scss}`, `components/sidebar-v1/{main.component.ts,main.component.html}`, `components/sidebar-v1/components/sidebar/{sidebar.component.ts,sidebar.component.html}` - implement guarded viewport signals, config normalization, key-based navigation/storage migration and V1 live responsive compatibility without changing V1 selector/actions. Flip the 20 shared assertions GREEN and confirm legacy V1 configuration still compiles.

### Phase 3 - Sidebar V2 RED -> GREEN

5. **CREATE/RUN RED** specs for `components/shared/menu-tree/menu-tree.component.spec.ts`, `components/shared/user-menu/user-menu.component.spec.ts`, `components/sidebar-v2/main.component.spec.ts` and `components/sidebar-mobile-v2/main.component.spec.ts`. Cover click and hover-lock state machines, keyboard/outside/Escape/navigation close, content-width stability contract, contextual search/pin, primary ID dedupe/fallback, **Thêm** coverage and overlay cleanup. Require exactly 16 newly named V2/shared-component assertions RED.

6. **CREATE/EDIT/RUN GREEN** `components/shared/menu-tree/{menu-tree.component.ts,menu-tree.component.html,menu-tree.component.scss}`, `components/shared/user-menu/{user-menu.component.ts,user-menu.component.html,user-menu.component.scss}`, `components/sidebar-v2/{main.component.ts,main.component.html,main.component.scss}` and `components/sidebar-mobile-v2/{main.component.ts,main.component.html,main.component.scss}`; edit `components/index.ts` and `layout-main` composition as needed. Reuse the shared filtered tree/user actions, keep flyout overlay above fixed-width content, implement bottom navigation/sheet focus management and flip all 16 V2 assertions GREEN.

### Phase 4 - Sidebar V3 RED -> GREEN

7. **CREATE/RUN RED** `components/sidebar-v3/main.component.spec.ts` and `components/sidebar-mobile-v3/main.component.spec.ts` before V3 implementation. Cover default/persisted collapsed state, global permitted-menu search, Recent ordering/limit/dedupe/disable, shared Pinned state, active route, mobile backdrop/Escape/navigation close, focus restore and scroll cleanup. Require exactly 12 newly named V3 assertions RED.

8. **CREATE/EDIT/RUN GREEN** `components/sidebar-v3/{main.component.ts,main.component.html,main.component.scss}` and `components/sidebar-mobile-v3/{main.component.ts,main.component.html,main.component.scss}`; update `components/index.ts` and `layout-main` composition. Reuse shared navigation state/tree/user menu, implement desktop collapsed rail and mobile drawer, flip all 12 V3 assertions GREEN and rerun the shared/V2 suites to catch cross-version regressions.

### Phase 5 - Showcase and documentation RED -> GREEN

9. **CREATE/EDIT/RUN RED** `projects/showcase/src/app/pages/modules/layout/layout-demo.component.spec.ts` and `projects/showcase/src/app/docs/core/documentation.registry.spec.ts` before the demo/registry implementation. Assert a Layout page loader, V1/V2/V3 selector, desktop/mobile preview fixtures and error-free variant rendering; require exactly 4 newly named Showcase assertions RED.

10. **CREATE/EDIT/RUN GREEN** `projects/showcase/src/app/pages/modules/layout/layout-demo.component.ts`, `projects/showcase/src/app/docs/core/documentation.registry.ts`, `projects/sdcorejs-angular/modules/layout/sd-layout.md` and generated `projects/showcase/src/app/docs/generated/example-sources.generated.ts` via the detected generator. Document compile-ready V1/V2/V3 examples, defaults, migration/storage/accessibility behavior; flip the 4 Showcase assertions GREEN and run `test:showcase-generators`.

### Phase 6 - Multi-version rollout and verification

11. **RUN/VERIFY** root `npm run sync`, review its scoped generated diff, then run `npm run check:sync`. Mirror only the approved v19 Layout/Showcase/docs changes into v20/v21, let the script update the three `SYNC-STATUS.md` files, preserve prohibited dirty files byte-for-byte and reject any package/lockfile, Showcase shell, unrelated module or published-doc drift.

12. **RUN** automated verification: focused Layout tests on v19/v20/v21; focused Showcase tests and generator tests; `npm run lint:release`; production library builds on v19/v20/v21; v19 Showcase production build; public V1/V2/V3 type-surface checks; `git diff --check`; scoped status/diff review. Run broad v19 `test:ci`, compare with the recorded 3.198 pass/15 fail/9 skip baseline and require zero new failure in touched paths even if the existing global coverage/baseline gate remains non-zero.

13. **RUN/MANUAL** local v19 Showcase smoke at `/v/21.1.2/modules-integrations/layout/overview` with desktop widths above the configured breakpoint and representative mobile widths below it. Exercise V1 responsive switch, V2 click/hover-lock/flyout/bottom sheet, V3 collapse/search/Pinned/Recent/drawer, keyboard focus/Escape/reduced-motion and console/runtime errors; verify no content jump/overflow or locked scroll remains, then stop the server and keep runtime artifacts outside Git.

### Phase 7 - Mandatory finish tail

14. **RUN** the mandatory finish-tail order after implementation verification: `sdcorejs-test` evidence review; `sdcorejs-review`; `sdcorejs-repair-loop` for verified findings; automatic `sdcorejs-documentation` code documentation; Angular UI-impact check; documentation gate and technical docs if approved; auto-docs; user guide if approved; auto-task-tracker; relevant memory review; `sdcorejs-ship` verify-before-done; finally `sdcorejs-ship` branch-ready as the final read-only gate. Rerun affected focused/broad checks after every repair, perform no write after final branch-ready, and do not commit/push/tag/publish without separate authorization.

## Acceptance mapping

- AC-001 -> tasks 3, 4, 11, 12
- AC-002 -> tasks 3, 4, 12
- AC-003 -> tasks 3, 4, 11, 12, 13
- AC-004 -> tasks 5, 6, 13
- AC-005 -> tasks 5, 6, 12, 13
- AC-006 -> tasks 5, 6, 12, 13
- AC-007 -> tasks 5, 6, 12, 13
- AC-008 -> tasks 3, 4, 5, 6, 12
- AC-009 -> tasks 7, 8, 12, 13
- AC-010 -> tasks 7, 8, 12, 13
- AC-011 -> tasks 3, 4, 7, 8, 12
- AC-012 -> tasks 3, 4, 7, 8, 12
- AC-013 -> tasks 3, 4, 6, 8, 12
- AC-014 -> tasks 3, 4, 12
- AC-015 -> tasks 3, 4, 5, 6, 7, 8, 12, 13
- AC-016 -> tasks 5, 6, 7, 8, 12, 13
- AC-017 -> tasks 10, 11, 12
- AC-018 -> tasks 9, 10, 12, 13
- AC-019 -> tasks 3-12, 14
- AC-020 -> tasks 2, 13

## Verification

### Focused RED -> GREEN commands

```powershell
npm --prefix versions/v19 run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless --code-coverage=false --include=projects/sdcorejs-angular/modules/layout/**/*.spec.ts

npm --prefix versions/v19 run test:showcase -- `
  --include=projects/showcase/src/app/pages/modules/layout/**/*.spec.ts `
  --include=projects/showcase/src/app/docs/core/documentation.registry.spec.ts
```

Run the first command after each shared/V2/V3 RED slice and after its GREEN implementation. After rollout, repeat the focused Layout command for `versions/v20` and `versions/v21`.

### Rollout and broad automated checks

```powershell
npm run test:showcase-generators
npm run sync
npm run check:sync
npm run lint:release

npm --prefix versions/v19 run build
npm --prefix versions/v20 run build
npm --prefix versions/v21 run build
npm --prefix versions/v19 run build:showcase

npm --prefix versions/v19 run test:ci
git diff --check
```

`test:ci` broad run is diagnostic against the recorded baseline, not permission to ignore new failures: any new failure attributable to Layout/Showcase touched paths blocks completion.

### Manual browser criterion

```powershell
npm --prefix versions/v19 run showcase -- --host 127.0.0.1 --port 4200
```

Open `http://127.0.0.1:4200/v/21.1.2/modules-integrations/layout/overview`, perform task 13, then stop the server. Generated source changes from the detected Showcase pre-script must remain within the approved generated path.

## Path conflicts and execution-time dirty-tree gate

- All planned EDIT paths exist; all planned CREATE roots/files checked before drafting are absent.
- Current branch is `chore/prepare-1.4` at `70bf98f50ed967acff91d483c59a33a58897de71`.
- `.sdcorejs/summary.md` and `.sdcorejs/tasks/current-session.md` are unrelated dirty files and prohibited from modification.
- `versions/v19|v20|v21/SYNC-STATUS.md` are already dirty from prior rollout and are approved coordination-risk paths. Execution must hash them before sync and accept only script-generated metadata changes that preserve prior information.
- Approved spec and approved plan snapshots are immutable and prohibited from execution edits.

Before any source edit, present exactly one choice:

1. Continue but restrict edits to approved plan-scoped files. **[Recommended]**
2. Continue and allow touching only additional dirty paths explicitly selected by the user.
3. Stop so the user can clean or stash changes first.

No implementation, generated mirror, documentation or checkpoint write may occur until this gate is answered.
