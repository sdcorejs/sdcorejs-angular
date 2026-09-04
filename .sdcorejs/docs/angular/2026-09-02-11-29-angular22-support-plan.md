---
artifact_id: plan-draft-sdcorejs-angular-angular22-support-r1
artifact_kind: plan
schema_version: 1
change_ref: angular22-support
source_spec: .sdcorejs/specs/angular/2026-09-02-angular22-support-design.md
source_plan: none
commit_policy: with-change
owner: sdcorejs-plan
---

# Angular 22 Multi-Line Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `sdcorejs-execute-plan` to execute this approved plan task-by-task; use `test-driven-development` for every behavior change, `sdcorejs-test` for the RED/GREEN evidence, `sdcorejs-ship` before either release gate, and `sdcorejs-git` for commits, pull requests, merges, and tags.

**Goal:** Add a production-ready Angular 22 package line without weakening the Angular 19–21 contracts, release the compatible datetime dependency first, and prepare the exact Core UI `2.5` four-line release.

**Architecture:** Work dependency-first across two independent Git repositories. `@sdcorejs/angular-material-datetime` widens only its Angular peer range and proves a strict Angular 22 packed-consumer build. Core UI keeps `versions/v19` canonical, derives v20/v21/v22 through the root sync contract, uses v21 only as the one-time v22 workspace skeleton, and publishes four prebuilt immutable tarballs through one sequential trusted-publishing job.

**Tech Stack:** Angular 19/20/21/22, Angular Material/CDK, TypeScript 5.7/5.8/5.9/6.0, ng-packagr, Karma/Jasmine, Jest, Node `22.22.3`, npm/Changesets, GitHub Actions, npm trusted publishing, PowerShell and Node ESM release tooling.

---

## Scope and execution context

- Track: `angular`
- Target root kind: `target-project`
- Stack profile: `core-ui-angular`
- Coverage approach: RED-first TDD plus exact registry-baseline and packed-consumer verification
- Approved spec: `.sdcorejs/specs/angular/2026-09-02-angular22-support-design.md`
- Approved spec hash: `sha256:v1:f669cfee9cc63a78d097757fc8ecb2d090dc4692f087b3c2c7a90cb8c658ee63`
- Integration owner: `github.com/sdcorejs/sdcorejs-angular`
- Dependency order: `github.com/sdcorejs/angular-material-datetime` then `github.com/sdcorejs/sdcorejs-angular`
- Release gates: datetime Changesets release PR, then Core UI `v2.5` tag/publish
- No Git submodule or gitlink changes
- No Enterprise Portal, Knowledge module, `@sd-angular/core`, or `@sdcorejs/utils` re-export work

```yaml
plan_context:
  source: sdcorejs-plan
  contract_id: sdcorejs-angular-angular22-support
  requirement_id: REQ-SDANGULAR-ANGULAR22
  approved_spec_path: .sdcorejs/specs/angular/2026-09-02-angular22-support-design.md
  approved_spec_hash: sha256:v1:f669cfee9cc63a78d097757fc8ecb2d090dc4692f087b3c2c7a90cb8c658ee63
  approved_spec_reference:
    repository_id: github.com/sdcorejs/sdcorejs-angular
    repository_relative_path: .sdcorejs/specs/angular/2026-09-02-angular22-support-design.md
    artifact_id: spec-sdcorejs-angular-angular22-support-r1
    revision: 3ce0544d3754b42f46a274178066756f017af8b3
    approval_hash: sha256:v1:f669cfee9cc63a78d097757fc8ecb2d090dc4692f087b3c2c7a90cb8c658ee63
  approved_plan_path: ''
  approved_plan_hash: ''
  supersedes: null
  target_root: .
  target_root_kind: target-project
  owner_repository_id: github.com/sdcorejs/sdcorejs-angular
  owner_repository_role: library
  owner_module_id: multi-version-release
  commit_policy: with-change
  execution_host_repository_id: github.com/sdcorejs/sdcorejs-angular
  integration_owner_repository_id: github.com/sdcorejs/sdcorejs-angular
  dependency_order:
    - github.com/sdcorejs/angular-material-datetime
    - github.com/sdcorejs/sdcorejs-angular
  gitlink_updates_in_scope: false
  track: angular
  stack_profile: core-ui-angular
  task_count: 18
  phase_count: 9
  allowed_paths:
    - .sdcorejs/docs/angular/2026-09-02-11-18-angular22-support-spec.md
    - .sdcorejs/specs/angular/2026-09-02-angular22-support-design.md
    - .sdcorejs/docs/angular/2026-09-02-11-29-angular22-support-plan.md
    - .sdcorejs/plans/angular/*angular22-support*.md
    - .github/workflows/ci.yml
    - .github/workflows/publish-npm.yml
    - package.json
    - README.md
    - README.npm.md
    - AGENTS.md
    - CLAUDE.md
    - CHANGELOG.md
    - scripts/supported-versions.test.mjs
    - scripts/check-version-sync.mjs
    - scripts/check-version-sync.test.mjs
    - scripts/sync-multi-version-workspaces.ps1
    - scripts/sync-from-vn-angular.ps1
    - scripts/deploy.ps1
    - scripts/lint-phase.mjs
    - scripts/collect-docs.mjs
    - scripts/collect-docs.test.mjs
    - scripts/collect-release-docs.mjs
    - scripts/generate-showcase-changelog.mjs
    - scripts/generate-showcase-changelog.test.mjs
    - scripts/generate-showcase-route-shells.mjs
    - scripts/generate-showcase-route-shells.test.mjs
    - scripts/release-package-contract.mjs
    - scripts/release-package-contract.test.mjs
    - scripts/publish-npm-workflow.test.mjs
    - scripts/build-published-page.test.mjs
    - scripts/fixtures/package-consumer/**
    - versions/v19/package.json
    - versions/v19/package-lock.json
    - versions/v19/README.md
    - versions/v19/SYNC-STATUS.md
    - versions/v19/projects/sdcorejs-angular/package.json
    - versions/v19/projects/sdcorejs-angular/README.md
    - versions/v19/projects/sdcorejs-angular/forms/datetime/sd-datetime.md
    - versions/v20/package.json
    - versions/v20/package-lock.json
    - versions/v20/README.md
    - versions/v20/SYNC-STATUS.md
    - versions/v20/projects/sdcorejs-angular/package.json
    - versions/v20/projects/sdcorejs-angular/README.md
    - versions/v20/projects/sdcorejs-angular/forms/datetime/sd-datetime.md
    - versions/v21/package.json
    - versions/v21/package-lock.json
    - versions/v21/README.md
    - versions/v21/SYNC-STATUS.md
    - versions/v21/projects/sdcorejs-angular/package.json
    - versions/v21/projects/sdcorejs-angular/README.md
    - versions/v21/projects/sdcorejs-angular/forms/datetime/sd-datetime.md
    - versions/v22/**
    - showcase/package.json
    - showcase/package-lock.json
    - showcase/src/app/docs/core/docs-version.utils.ts
    - showcase/src/app/docs/core/docs-version.utils.spec.ts
    - showcase/src/app/docs/core/docs-version.service.spec.ts
    - showcase/src/app/docs/shared/version-selector.component.spec.ts
    - showcase/src/app/docs/pages/about/about.component.ts
    - showcase/src/app/docs/pages/about/about.component.spec.ts
    - showcase/src/app/docs/pages/changelog/changelog.component.ts
    - showcase/src/app/docs/pages/changelog/changelog.component.spec.ts
    - showcase/src/app/docs/pages/getting-started/getting-started.component.ts
    - showcase/src/app/docs/pages/getting-started/getting-started.component.spec.ts
    - showcase/src/app/docs/pages/home/docs-home.component.ts
    - showcase/src/app/docs/pages/home/docs-home.component.spec.ts
    - showcase/src/app/docs/generated/changelog.generated.ts
    - published-docs/19.2.5/**
    - published-docs/20.2.5/**
    - published-docs/21.2.5/**
    - published-docs/22.2.5/**
    - published-docs/versions.json
    - published-docs/catalog.json
    - published-pages/2.5/**
    - published-pages/2.0/**
    - published-pages/pages.json
  prohibited_paths:
    - enterprise-portal/**
    - Knowledge/**
    - node_modules/**
    - versions/*/node_modules/**
    - versions/v19/projects/sdcorejs-angular/utilities/**
    - versions/v19/projects/sdcorejs-angular/**/index.ts
    - versions/v19/projects/sdcorejs-angular/**/public-api.ts
    - versions/v19/projects/sdcorejs-angular/components/**/*.ts
    - versions/v19/projects/sdcorejs-angular/components/**/*.html
    - versions/v19/projects/sdcorejs-angular/components/**/*.scss
    - versions/v19/projects/sdcorejs-angular/forms/**/*.ts
    - versions/v19/projects/sdcorejs-angular/forms/**/*.html
    - versions/v19/projects/sdcorejs-angular/forms/**/*.scss
    - versions/v19/projects/sdcorejs-angular/services/**/*.ts
    - dist/**
    - coverage/**
    - .angular/**
  generated_artifacts:
    - versions/v19/package-lock.json
    - versions/v19/projects/sdcorejs-angular/README.md
    - versions/v20/package-lock.json
    - versions/v21/package-lock.json
    - versions/v20/projects/sdcorejs-angular/package.json
    - versions/v20/projects/sdcorejs-angular/README.md
    - versions/v20/projects/sdcorejs-angular/forms/datetime/sd-datetime.md
    - versions/v21/projects/sdcorejs-angular/package.json
    - versions/v21/projects/sdcorejs-angular/README.md
    - versions/v21/projects/sdcorejs-angular/forms/datetime/sd-datetime.md
    - versions/v*/SYNC-STATUS.md
    - versions/v22/**
    - showcase/package-lock.json
    - showcase/src/app/docs/generated/changelog.generated.ts
    - published-docs/19.2.5/**
    - published-docs/20.2.5/**
    - published-docs/21.2.5/**
    - published-docs/22.2.5/**
    - published-docs/versions.json
    - published-docs/catalog.json
    - published-pages/2.5/**
    - published-pages/2.0/**
    - published-pages/pages.json
  docs_artifacts:
    - .sdcorejs/docs/angular/2026-09-02-11-18-angular22-support-spec.md
    - .sdcorejs/specs/angular/2026-09-02-angular22-support-design.md
    - .sdcorejs/docs/angular/2026-09-02-11-29-angular22-support-plan.md
    - .sdcorejs/plans/angular/*angular22-support*.md
    - README.md
    - README.npm.md
    - AGENTS.md
    - CLAUDE.md
    - CHANGELOG.md
  dependency_changes:
    required: true
    approval_required: true
    packages:
      - '@sdcorejs/angular-material-datetime: expected 1.0.4 after exact collision check'
      - '@angular/*, @angular/cdk, @angular/material: reviewed 22.1 minor trains in v22 only'
      - 'typescript: ~6.0.3 in v22 only'
      - 'typescript-eslint: 8.60.0 in v22 only, verified for TypeScript >=4.8.4 <6.1.0'
      - 'zone.js: ~0.16.2 in v22 only'
      - 'angular-eslint: ~22.1.0 in v22 only'
      - 'ng-packagr: ~22.1.1 in v22 only'
  env_changes:
    required: true
    approval_required: false
    files:
      - '.github/workflows/ci.yml: pin cross-major/runtime work to Node 22.22.3'
      - '.github/workflows/publish-npm.yml: pin release work to Node 22.22.3 and npm >=11.5.1'
      - 'angular-material-datetime/.github/workflows/ci.yml: pin the Angular 22 consumer leg to Node 22.22.3'
      - 'angular-material-datetime/.github/workflows/release.yml: pin release verification to Node 22.22.3'
  migration_changes:
    required: false
    approval_required: false
    description: No consumer syntax or runtime API migration.
  frontend_architecture:
    required: true
    not_applicable_reason: null
    project_conventions:
      component_style: Existing standalone OnPush showcase components with signals and Angular block control flow.
      folder_convention: Existing docs core/shared/pages folders with colocated component specs; generated data stays under docs/generated.
      state_convention: DocsVersionService remains the sole manifest/selection/fallback state owner.
      service_data_access_convention: Existing published-doc manifest loading remains unchanged.
      registration_provider_convention: Existing routes and providers remain unchanged.
      public_api_barrel_convention: No Core UI public barrel or secondary entry point changes.
      test_convention: Colocated Jasmine showcase specs plus Node built-in script contract tests.
      evidence_inspected:
        - showcase/src/app/layout/shell.component.ts
        - showcase/src/app/layout/shell.component.html
        - showcase/src/app/app.routes.ts
        - showcase/src/app/docs/core/docs-version.utils.ts
        - showcase/src/app/docs/core/docs-version.service.ts
        - showcase/src/app/docs/shared/version-selector.component.ts
        - showcase/src/app/docs/pages/about/about.component.ts
        - showcase/src/app/docs/pages/changelog/changelog.component.ts
        - showcase/src/app/docs/pages/getting-started/getting-started.component.ts
        - showcase/src/app/docs/pages/home/docs-home.component.ts
        - scripts/generate-showcase-changelog.mjs
        - scripts/generate-showcase-route-shells.mjs
        - scripts/sync-multi-version-workspaces.ps1
        - .github/workflows/ci.yml
        - .github/workflows/publish-npm.yml
    component_tree:
      - ShellComponent -> Header tools -> VersionSelectorComponent
      - ShellComponent -> RouterOutlet -> top-level Home | About | versioned routes
      - versioned routes -> Home | Changelog | Getting Started | category/page routes
      - root CHANGELOG.md -> showcase changelog generator -> changelog.generated.ts -> Home and Changelog
    reuse_decisions:
      - Reuse DocsVersionService for manifest, selection and grouping; no new state service.
      - Reuse docs-version.utils.ts for the minimum-version rule and add only the v22 inception value.
      - Reuse existing About, Changelog, Getting Started and Home components; change only version copy/filter data.
      - Reuse existing generator and route-shell contracts; do not create a second version registry.
    file_decisions:
      - 'showcase/src/app/docs/core/docs-version.utils.ts: EDIT minimum v22 version only'
      - 'showcase/src/app/docs/core/docs-version.service.ts: NO EDIT; behavior is manifest-driven'
      - 'showcase/src/app/docs/shared/version-selector.component.ts: NO EDIT; optgroups are manifest-driven'
      - 'showcase/src/app/docs/pages/{about,changelog,getting-started,home}: EDIT existing copy/filter data and specs'
      - 'scripts/generate-showcase-changelog.mjs: EDIT release-major derivation'
      - 'scripts/generate-showcase-route-shells.mjs: EDIT v22 inception/canonical major'
    responsibilities:
      - 'DocsVersionService: load version manifest, resolve requested version, persist selection and expose groups'
      - 'docs-version.utils.ts: validate/sort/group supported manifest versions and enforce showcase minima'
      - 'generate-showcase-changelog.mjs: map one release suffix to only the Angular majors that existed then'
      - 'generate-showcase-route-shells.mjs: choose one canonical pre-rendered version for a release page'
    state_owners:
      - DocsVersionService owns runtime manifest, selected version, loading/error and invalid-version state.
      - ChangelogComponent owns only its local major filter signal.
      - Release generator inputs own historical major availability; UI components do not duplicate it.
    service_boundaries:
      - symbol: DocsVersionService
        scope: app
      - symbol: docs-version.utils.ts
        scope: pure_function
      - symbol: release generator functions
        scope: pure_function
    data_flow:
      - published-docs/versions.json -> DocsVersionService -> grouped versions -> VersionSelectorComponent and routed pages
      - CHANGELOG.md -> generate-showcase-changelog.mjs -> changelog.generated.ts -> Home/Changelog presentation
      - release suffix 2.5 -> route-shell generator -> canonical /v/22.2.5 route shells
    declarations_and_registration:
      - No new Angular declaration, provider or route registration.
      - Existing standalone component imports remain unchanged.
    public_exports:
      - No new or changed package exports; exact baseline checks enforce this.
    tests:
      - v22 begins at 22.2.5 and no prior release gains fabricated v22 history.
      - Version service and selector expose groups 22/21/20/19 from manifest data.
      - About, Changelog, Getting Started and Home render the four-line contract.
      - Selected v22 routes produce the v22 install command and links.
    decomposition_rationale:
      - Keep version rules in existing pure utilities/generators because they already own this policy.
      - Keep UI edits inline because no new responsibility or reusable component is introduced.
      - Keep release-package validation in Node tooling, outside Angular runtime/public API.
  agent_architecture:
    required: false
    not_applicable_reason: No AI-agent runtime or contract work.
    schema_version: 1
  verification_strategy:
    package_manager: npm
    scripts_detected:
      - 'datetime: test, test:coverage, lint, build:all, test:package, test:consumer, test:release-workflow, pack:datetime'
      - 'Core root: sync, check:sync, test:scripts, lint:release, collect-release-docs, build:page'
      - 'Core workspaces: lint, build, test:ci, pack, check:i18n, check:i18n-parity, check:pdf-worker'
      - 'showcase: link:library, test, build:prod'
    commands_planned:
      - 'datetime npm ci plus full lint/Jest/build/APF/baseline/consumer/pack matrix'
      - 'Core npm run sync, check:sync, test:scripts and lint:release'
      - 'Core installs and builds for v19/v20/v21/v22 under Node 22.22.3'
      - 'Core full Karma coverage for v19 then v22'
      - 'showcase clean install, link, full test and production build'
      - 'release-package-contract exact 2.4 baseline, strict consumers and four staged 2.5 tarballs'
      - 'postpublish npm view/npm pack/integrity/SHA-256/provenance and generated docs/page checks'
    commands_skipped:
      - 'v20/v21 full Karma: canonical v19 plus new-major v22 are the approved runtime suites; v20/v21 retain lint/build gates'
      - 'v22 npm install --legacy-peer-deps or --force: prohibited because it would hide peer incompatibility'
      - 'npm dist-tag add: trusted OIDC does not authorize the intended promotion path; v22 publishes directly with latest'
      - 'local npm publish: Core release is owned by the pinned GitHub trusted-publishing workflow'
    red_first:
      - datetime workflow Node/artifact assertions fail before workflow edits
      - datetime Angular 22 packed consumer fails normal peer resolution before peer widening
      - Core supported-version/sync/release tests fail on the three-line topology
      - showcase specs fail before the Angular 22 inception/copy changes
    focused_checks:
      - datetime strict Angular 22 packed consumer and exact 1.0.3 public-surface baseline
      - Core four-line topology, exact v22 overrides and sync normalization
      - showcase v22 inception at 22.2.5 with no fabricated earlier history
      - immutable four-artifact release topology, repository metadata and OIDC invariants
    broad_checks:
      - datetime lint, Jest coverage, all builds, APF, all packed consumers and pack
      - Core root script tests and sync parity
      - Core lint/build for v19-v22
      - full Karma coverage for v19 and v22, run sequentially locally
      - full showcase tests and production build
      - exact tarball/export/declaration/consumer verification
    postpublish_checks:
      - exact npm versions, dist-tags, integrity, shasum, SHA-256 and provenance
      - generated 2.5 docs/pages only after registry verification
  parallel_candidates:
    allowed: true
    frozen_contract:
      path: .sdcorejs/plans/angular/2026-09-02-11-29-angular22-support.md
      hash: null
      revision: 1
      derived_from_approved_plan_hash: null
      supersedes: null
    units:
      - id: core-workspace
        depends_on: []
        allowed_paths:
          - scripts/sync-multi-version-workspaces.ps1
          - scripts/check-version-sync.mjs
          - scripts/check-version-sync.test.mjs
          - scripts/lint-phase.mjs
          - scripts/collect-docs.mjs
          - scripts/collect-docs.test.mjs
          - scripts/collect-release-docs.mjs
          - scripts/sync-from-vn-angular.ps1
          - versions/v22/**
        prohibited_paths: [.github/**, showcase/**, package.json, README.md, README.npm.md, CHANGELOG.md]
        exclusive_resources: [versions/v22/package-lock.json, root-sync-writer]
        result_type: working-tree-diff
        verification_command: node --test --test-name-pattern="^\[workspace\]" scripts/supported-versions.test.mjs scripts/check-version-sync.test.mjs scripts/collect-docs.test.mjs
      - id: core-showcase
        depends_on: []
        allowed_paths:
          - scripts/generate-showcase-changelog.mjs
          - scripts/generate-showcase-changelog.test.mjs
          - scripts/generate-showcase-route-shells.mjs
          - scripts/generate-showcase-route-shells.test.mjs
          - showcase/src/app/docs/core/docs-version.utils.ts
          - showcase/src/app/docs/core/docs-version.utils.spec.ts
          - showcase/src/app/docs/core/docs-version.service.spec.ts
          - showcase/src/app/docs/shared/version-selector.component.spec.ts
          - showcase/src/app/docs/pages/about/about.component.ts
          - showcase/src/app/docs/pages/about/about.component.spec.ts
          - showcase/src/app/docs/pages/changelog/changelog.component.ts
          - showcase/src/app/docs/pages/changelog/changelog.component.spec.ts
          - showcase/src/app/docs/pages/getting-started/getting-started.component.ts
          - showcase/src/app/docs/pages/getting-started/getting-started.component.spec.ts
          - showcase/src/app/docs/pages/home/docs-home.component.ts
          - showcase/src/app/docs/pages/home/docs-home.component.spec.ts
          - showcase/src/app/docs/generated/changelog.generated.ts
        prohibited_paths: [.github/**, versions/**, package.json, README.md, README.npm.md, CHANGELOG.md]
        exclusive_resources: [showcase/src/app/docs/generated/changelog.generated.ts]
        result_type: working-tree-diff
        verification_command: npm run test:showcase-angular22-contract
      - id: core-release-workflow
        depends_on: []
        allowed_paths:
          - .github/workflows/ci.yml
          - .github/workflows/publish-npm.yml
          - scripts/deploy.ps1
          - scripts/release-package-contract.mjs
          - scripts/release-package-contract.test.mjs
          - scripts/publish-npm-workflow.test.mjs
          - scripts/build-published-page.test.mjs
          - scripts/fixtures/package-consumer/**
        prohibited_paths: [versions/**, showcase/**, package.json, README.md, README.npm.md, CHANGELOG.md]
        exclusive_resources: [.github/workflows/publish-npm.yml]
        result_type: working-tree-diff
        verification_command: node --test scripts/release-package-contract.test.mjs scripts/publish-npm-workflow.test.mjs scripts/build-published-page.test.mjs
    shared_files:
      - Root package.json, README files, CHANGELOG and canonical v19 manifests are integration-owner only.
      - The integration owner registers `test:showcase-angular22-contract` before dispatch; the showcase unit invokes but never edits root package.json.
      - npm run sync and all generated workspace/lock output have one sequential integration owner.
      - Karma and memory-heavy builds run sequentially in a shared worktree.
    conflict_risks:
      - Gate A must complete before any Core v22 install or lock generation.
      - Sync can overwrite direct edits in derived workspaces.
      - Workflow and release-contract tests must land together before final GREEN.
      - Before dispatch, execution must replace both null frozen-contract hashes with the immutable approved plan approval hash.
  repository_plan:
    schema_version: 1
    integration_owner_repository_id: github.com/sdcorejs/sdcorejs-angular
    gitlink_updates_in_scope: false
    dependency_order: [core-artifact-freeze, datetime-red-green-pr, datetime-release-gate, core-red-green-pr, core-release-gate]
    repositories:
      - repository_id: github.com/sdcorejs/angular-material-datetime
        role: library
        module_id: angular22-peer-compatibility
        plan_artifact_id: plan-sdcorejs-angular-angular22-support-r1
      - repository_id: github.com/sdcorejs/sdcorejs-angular
        role: library
        module_id: multi-version-release
        plan_artifact_id: plan-sdcorejs-angular-angular22-support-r1
    steps:
      - id: core-artifact-freeze
        action: VERIFY-THEN-EDIT
        semantic_scope: repository
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        git_roots: [github.com/sdcorejs/sdcorejs-angular]
        allowed_paths: [.sdcorejs/docs/angular/2026-09-02-11-18-angular22-support-spec.md, .sdcorejs/specs/angular/2026-09-02-angular22-support-design.md, .sdcorejs/docs/angular/2026-09-02-11-29-angular22-support-plan.md, .sdcorejs/plans/angular/2026-09-02-11-29-angular22-support.md]
        content_write_paths: [.sdcorejs/plans/angular/2026-09-02-11-29-angular22-support.md]
        immutable_content_paths: [.sdcorejs/docs/angular/2026-09-02-11-18-angular22-support-spec.md, .sdcorejs/specs/angular/2026-09-02-angular22-support-design.md, .sdcorejs/docs/angular/2026-09-02-11-29-angular22-support-plan.md]
        prohibited_paths: [.sdcorejs/summary.md, .sdcorejs/tasks/**, .sdcorejs/memories/**]
        depends_on: []
      - id: datetime-red-green-pr
        action: VERIFY-THEN-EDIT
        semantic_scope: repository
        owner_repository_id: github.com/sdcorejs/angular-material-datetime
        git_roots: [github.com/sdcorejs/angular-material-datetime]
        allowed_paths: [.changeset/add-angular-22-support.md, .github/workflows/ci.yml, .github/workflows/release.yml, package.json, package-lock.json, README.md, projects/datetime/package.json, projects/datetime/README.md, projects/demo/src/app/sections/hero.component.ts, projects/demo/src/app/sections/footer.component.ts, tools/consumer-smoke.mjs, tools/compare-package-baseline.mjs, tools/compare-package-baseline.test.mjs, tools/publish-datetime.mjs, tools/publish-datetime.test.mjs, tools/release-workflow.test.mjs, tools/verify-package.mjs]
        prohibited_paths: [projects/datetime/src/**, projects/moment-adapter/**, projects/date-fns-adapter/**, node_modules/**]
        depends_on: [core-artifact-freeze]
      - id: datetime-release-gate
        action: VERIFY-THEN-EDIT
        semantic_scope: repository
        owner_repository_id: github.com/sdcorejs/angular-material-datetime
        git_roots: [github.com/sdcorejs/angular-material-datetime]
        allowed_paths: [projects/datetime/package.json, projects/datetime/CHANGELOG.md, package-lock.json, .changeset/**]
        prohibited_paths: [projects/datetime/src/**, projects/moment-adapter/**, projects/date-fns-adapter/**]
        depends_on: [datetime-red-green-pr]
      - id: core-red-green-pr
        action: VERIFY-THEN-EDIT
        semantic_scope: repository
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        git_roots: [github.com/sdcorejs/sdcorejs-angular]
        allowed_paths: [.github/workflows/ci.yml, .github/workflows/publish-npm.yml, package.json, README.md, README.npm.md, AGENTS.md, CLAUDE.md, CHANGELOG.md, scripts/supported-versions.test.mjs, scripts/check-version-sync.mjs, scripts/check-version-sync.test.mjs, scripts/sync-multi-version-workspaces.ps1, scripts/sync-from-vn-angular.ps1, scripts/deploy.ps1, scripts/lint-phase.mjs, scripts/collect-docs.mjs, scripts/collect-docs.test.mjs, scripts/collect-release-docs.mjs, scripts/generate-showcase-changelog.mjs, scripts/generate-showcase-changelog.test.mjs, scripts/generate-showcase-route-shells.mjs, scripts/generate-showcase-route-shells.test.mjs, scripts/release-package-contract.mjs, scripts/release-package-contract.test.mjs, scripts/publish-npm-workflow.test.mjs, scripts/build-published-page.test.mjs, scripts/fixtures/package-consumer/**, versions/v19/package.json, versions/v19/package-lock.json, versions/v19/README.md, versions/v19/SYNC-STATUS.md, versions/v19/projects/sdcorejs-angular/package.json, versions/v19/projects/sdcorejs-angular/README.md, versions/v19/projects/sdcorejs-angular/forms/datetime/sd-datetime.md, versions/v20/package.json, versions/v20/package-lock.json, versions/v20/README.md, versions/v20/SYNC-STATUS.md, versions/v20/projects/sdcorejs-angular/package.json, versions/v20/projects/sdcorejs-angular/README.md, versions/v20/projects/sdcorejs-angular/forms/datetime/sd-datetime.md, versions/v21/package.json, versions/v21/package-lock.json, versions/v21/README.md, versions/v21/SYNC-STATUS.md, versions/v21/projects/sdcorejs-angular/package.json, versions/v21/projects/sdcorejs-angular/README.md, versions/v21/projects/sdcorejs-angular/forms/datetime/sd-datetime.md, versions/v22/**, showcase/package.json, showcase/package-lock.json, showcase/src/app/docs/core/docs-version.utils.ts, showcase/src/app/docs/core/docs-version.utils.spec.ts, showcase/src/app/docs/core/docs-version.service.spec.ts, showcase/src/app/docs/shared/version-selector.component.spec.ts, showcase/src/app/docs/pages/about/about.component.ts, showcase/src/app/docs/pages/about/about.component.spec.ts, showcase/src/app/docs/pages/changelog/changelog.component.ts, showcase/src/app/docs/pages/changelog/changelog.component.spec.ts, showcase/src/app/docs/pages/getting-started/getting-started.component.ts, showcase/src/app/docs/pages/getting-started/getting-started.component.spec.ts, showcase/src/app/docs/pages/home/docs-home.component.ts, showcase/src/app/docs/pages/home/docs-home.component.spec.ts, showcase/src/app/docs/generated/changelog.generated.ts]
        prohibited_paths: [enterprise-portal/**, Knowledge/**, node_modules/**, versions/*/node_modules/**]
        depends_on: [datetime-release-gate]
      - id: core-release-gate
        action: VERIFY-THEN-EDIT
        semantic_scope: repository
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        git_roots: [github.com/sdcorejs/sdcorejs-angular]
        allowed_paths: [published-docs/19.2.5/**, published-docs/20.2.5/**, published-docs/21.2.5/**, published-docs/22.2.5/**, published-docs/versions.json, published-docs/catalog.json, published-pages/2.5/**, published-pages/2.0/**, published-pages/pages.json]
        prohibited_paths: [enterprise-portal/**, Knowledge/**, versions/*/projects/sdcorejs-angular/**]
        depends_on: [core-red-green-pr]
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
artifact_context:
  schema_version: 1
  change_ref: angular22-support
  source_spec: .sdcorejs/specs/angular/2026-09-02-angular22-support-design.md
  source_plan: .sdcorejs/plans/angular/2026-09-02-11-29-angular22-support.md
  required_with_change:
    - path: .sdcorejs/docs/angular/2026-09-02-11-18-angular22-support-spec.md
      kind: spec
      reason: human-readable approved design record for this change
    - path: .sdcorejs/specs/angular/2026-09-02-angular22-support-design.md
      kind: spec
      reason: immutable approved specification contract
    - path: .sdcorejs/docs/angular/2026-09-02-11-29-angular22-support-plan.md
      kind: plan
      reason: human-readable implementation plan for this change
    - path: .sdcorejs/plans/angular/2026-09-02-11-29-angular22-support.md
      kind: plan
      reason: immutable approved plan snapshot created after approval
  shared_owned: []
  conditional: []
  local_only:
    - path: OS temporary execution logs and RED-GREEN evidence
      kind: diagnostic
      reason: runtime evidence is summarized but never committed
    - path: OS temporary registry baselines and release tarballs
      kind: diagnostic
      reason: immutable package evidence remains outside Git
    - path: OS temporary portable Node runtime and consumer projects
      kind: diagnostic
      reason: disposable environment state
    - path: dist/**, coverage/**, .angular/** and node_modules/**
      kind: diagnostic
      reason: generated build, coverage and dependency output
  unrelated_observed: []
```

## Repository ownership and write boundaries

Every mutable step below has exactly one repository owner. Before editing, resolve each local Git root with `git rev-parse --show-toplevel`; never run a Core UI sync command from the datetime repository or vice versa.

### Repository A — `github.com/sdcorejs/angular-material-datetime`

Allowed paths:

- `.changeset/add-angular-22-support.md`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
- `package.json`
- `package-lock.json`
- `README.md`
- `projects/datetime/package.json`
- `projects/datetime/README.md`
- `projects/datetime/CHANGELOG.md` only for the Changesets-generated new `1.0.4` entry; existing entries remain immutable
- `projects/demo/src/app/sections/hero.component.ts`
- `projects/demo/src/app/sections/footer.component.ts`
- `tools/consumer-smoke.mjs`
- `tools/compare-package-baseline.mjs`
- `tools/compare-package-baseline.test.mjs`
- `tools/publish-datetime.mjs`
- `tools/publish-datetime.test.mjs`
- `tools/release-workflow.test.mjs`
- `tools/verify-package.mjs`
- temporary build/pack/coverage output ignored by Git

Prohibited paths:

- `projects/datetime/src/**` except existing read-only verification
- `projects/moment-adapter/**`
- `projects/date-fns-adapter/**`
- historical entries already present in `projects/datetime/CHANGELOG.md`
- `node_modules/**`, patches, vendored packages, or committed temporary consumer folders
- unrelated pull requests or release artifacts

### Repository B — `github.com/sdcorejs/sdcorejs-angular`

Required change artifacts, commit-only after approval:

- `.sdcorejs/docs/angular/2026-09-02-11-18-angular22-support-spec.md`
- `.sdcorejs/specs/angular/2026-09-02-angular22-support-design.md`
- `.sdcorejs/docs/angular/2026-09-02-11-29-angular22-support-plan.md`
- the approved plan snapshot created from this draft after plan approval

The approved spec and approved plan snapshot are immutable/read-only contracts. Once the plan is approved, implementation may verify and commit these four artifacts but may not edit any of their contents; a contract change must return through the matching spec/plan approval workflow.

Allowed authored implementation paths:

- `.github/workflows/ci.yml`
- `.github/workflows/publish-npm.yml` without renaming the workflow file
- `package.json`
- `README.md`
- `README.npm.md`
- `AGENTS.md`
- `CLAUDE.md`
- `CHANGELOG.md`
- `scripts/supported-versions.test.mjs`
- `scripts/check-version-sync.mjs`
- `scripts/check-version-sync.test.mjs`
- `scripts/sync-multi-version-workspaces.ps1`
- `scripts/sync-from-vn-angular.ps1`
- `scripts/deploy.ps1`
- `scripts/lint-phase.mjs`
- `scripts/collect-docs.mjs`
- `scripts/collect-docs.test.mjs`
- `scripts/collect-release-docs.mjs`
- `scripts/generate-showcase-changelog.mjs`
- `scripts/generate-showcase-changelog.test.mjs`
- `scripts/generate-showcase-route-shells.mjs`
- `scripts/generate-showcase-route-shells.test.mjs`
- `scripts/release-package-contract.mjs`
- `scripts/release-package-contract.test.mjs`
- `scripts/publish-npm-workflow.test.mjs`
- `scripts/build-published-page.test.mjs`
- `scripts/fixtures/package-consumer/fixture.component.ts`
- `scripts/fixtures/package-consumer/tsconfig.json`
- `versions/v19/package.json`
- `versions/v19/package-lock.json`
- `versions/v19/README.md`
- `versions/v19/projects/sdcorejs-angular/package.json`
- `versions/v19/projects/sdcorejs-angular/forms/datetime/sd-datetime.md`
- `showcase/package.json`
- `showcase/package-lock.json`
- `showcase/src/app/docs/core/docs-version.utils.ts`
- `showcase/src/app/docs/core/docs-version.utils.spec.ts`
- `showcase/src/app/docs/core/docs-version.service.spec.ts`
- `showcase/src/app/docs/shared/version-selector.component.spec.ts`
- `showcase/src/app/docs/pages/about/about.component.ts`
- `showcase/src/app/docs/pages/about/about.component.spec.ts`
- `showcase/src/app/docs/pages/changelog/changelog.component.ts`
- `showcase/src/app/docs/pages/changelog/changelog.component.spec.ts`
- `showcase/src/app/docs/pages/getting-started/getting-started.component.ts`
- `showcase/src/app/docs/pages/getting-started/getting-started.component.spec.ts`
- `showcase/src/app/docs/pages/home/docs-home.component.ts`
- `showcase/src/app/docs/pages/home/docs-home.component.spec.ts`

Allowed generated, checked-in paths:

- `versions/v19/SYNC-STATUS.md`
- `versions/v20/package.json`, `versions/v20/package-lock.json`, `versions/v20/README.md`, `versions/v20/SYNC-STATUS.md`, and the sync-generated package manifest/README/datetime doc under `versions/v20/projects/sdcorejs-angular/`
- `versions/v21/package.json`, `versions/v21/package-lock.json`, `versions/v21/README.md`, `versions/v21/SYNC-STATUS.md`, and the sync-generated package manifest/README/datetime doc under `versions/v21/projects/sdcorejs-angular/`
- all new `versions/v22/**`, including its independently generated `package-lock.json`
- `showcase/src/app/docs/generated/changelog.generated.ts`
- after successful registry verification only: `published-docs/19.2.5/**`, `published-docs/20.2.5/**`, `published-docs/21.2.5/**`, `published-docs/22.2.5/**`, `published-docs/versions.json`, and `published-docs/catalog.json`
- after successful registry verification only: new `published-pages/2.5/**`, regenerated `published-pages/pages.json`, and deletion of `published-pages/2.0/**` required by the existing five-suffix-per-leading-digit retention policy

Prohibited paths:

- `enterprise-portal/**`
- `Knowledge/**`
- any `@sd-angular/core` package or publication path
- authored semantic changes to any `versions/*/projects/sdcorejs-angular/utilities/**`, `index.ts`, or `public-api.ts`; byte-identical sync/bootstrap copies into generated v20/v21/v22 workspaces are allowed and expected
- any new utils re-export or public barrel/export-map change
- authored canonical v19 shared component/form/service implementation changes; generated byte-identical v20/v21/v22 copies and the explicitly tested v22 three-argument `DomPortalOutlet` side-drawer compatibility shim inherited from the v21 skeleton are allowed
- existing historical `published-docs/**` or `published-pages/**` outside the new 2.5 versions and their registries, except the explicitly tested retention deletion of `published-pages/2.0/**`
- `node_modules/**`, `versions/*/node_modules/**`, `dist/**`, `.angular/**`, `coverage/**`, or generated `.tgz` files in Git
- npm allowlists, peer overrides, `--force`, v22 `--legacy-peer-deps`, and `node_modules` patches
- workflow identity rename of `.github/workflows/publish-npm.yml`
- unrelated open pull requests

## Frontend architecture record

`frontend_architecture.required` is true because the public showcase changes its supported-version presentation, but no new routed feature, service, component, provider, or state store is introduced.

- Component tree remains: `ShellComponent` renders the header tools (`VersionSelectorComponent`) and a sibling `RouterOutlet`; that outlet renders top-level Home/About or the existing versioned Home, Changelog, Getting Started and category/page routes.
- `DocsVersionService` remains the single owner of manifest loading, selected version, fallback state and grouped versions.
- `docs-version.utils.ts` remains the owner of minimum supported showcase versions; Angular 22 begins at exactly `22.2.5`.
- `generate-showcase-changelog.mjs` derives the major list per release suffix, so historical releases remain 19/20/21 and suffix `2.5` starts 19/20/21/22.
- `generate-showcase-route-shells.mjs` remains the route-shell owner; it emits the canonical v22 shell only for suffix 2.5 or later.
- Existing standalone, OnPush, signal and colocated Jasmine conventions remain unchanged.
- Generic `DocsVersionService` and `VersionSelectorComponent` production code is not edited. If either new regression demonstrates a genuine implementation gap, pause and revise the approved path scope before changing it.
- No public barrel or package entry point changes.

## Phase 1 — Establish immutable baselines and runtime

### Task 1 — VERIFY/COMMIT: Preflight both repositories, freeze execution artifacts and verify exact versions

**Owner:** cross-repository read-only audit first; Core integration owner for the artifact commit; each worktree/branch substep is owned separately below.

- [ ] In each repository root, run the complete working-tree preflight below before any edit: resolve the authoring root, inspect status, staged/unstaged diffstats, untracked inventory, branch and HEAD, then compare every dirty path with that repository's allowed/prohibited scope. Abort if `git rev-parse --show-toplevel` is not the intended Git root.
- [ ] If unrelated dirty files exist, stop and ask the exact choice: `1` continue while restricting edits to approved plan-scoped files; `2` allow touching only user-selected dirty files and revise the write scope first; `3` stop so the user can clean/stash. Never silently choose option 2, move/stash another owner's changes, or broaden scope from a dirty tree.
- [ ] After that preflight, run `.sdcorejs` artifact closure and commit exactly the four `artifact_context.required_with_change` paths on `feat/angular22-support` as `docs(plan): approve Angular 22 support execution`. This makes the existing worktree clean before synchronization with `origin/main`; do not edit the immutable approved spec/snapshot, push this commit yet, or include unrelated files.
- [ ] Repository A owner: fetch datetime `main`, record its SHA, verify no unowned local change overlaps Repository A's allowed paths, and create isolated branch/worktree `feat/angular22-peer-support` from that fetched SHA.
- [ ] Repository B owner: fetch Core UI `main`, record its SHA and use the existing isolated `feat/angular22-support` worktree. Rebase onto `origin/main` only if the feature branch has never been pushed; if a remote feature branch already exists, merge `origin/main` instead. Never force-push.
- [ ] Run `node --version` and require exact `v22.22.3` for Angular 22 work. If it is unavailable locally, use the portable bootstrap below; if the official archive/checksum cannot be downloaded or verified, stop rather than claiming local v22 verification under another runtime.
- [ ] Create the non-global portable runtime in a task-specific OS temporary directory. Verify the official SHA-256 before extraction, prepend only that extracted directory to the current process `PATH`, and leave system Node/install settings unchanged.
- [ ] Run `npm view @sdcorejs/angular-material-datetime@1.0.4 version --json`, `npm view @sdcorejs/angular@19.2.5 version --json`, the equivalent 20/21/22 queries, and—only from Repository B—`git ls-remote --tags origin refs/tags/v2.5` immediately before implementation begins. Reconfirm `typescript-eslint@8.60.0` peers include TypeScript 6.0. Expected: npm `E404` for every intended exact version and no Core remote `v2.5` tag.
- [ ] If any intended version/tag already exists, stop and revise the approved release numbering; never reuse or overwrite it.
- [ ] Pack exact registry baselines into OS temporary directories: datetime `1.0.3` and Core UI `19.2.4`, `20.2.4`, `21.2.4`. Record each `dist.integrity`, `dist.shasum`, SHA-256 and unpacked file inventory outside Git.
- [ ] Confirm `@sd-angular/core` is absent from both release manifests/workflows and record that no Portal or Knowledge repository is in either Git diff.

Commands:

```powershell
git rev-parse --show-toplevel
git status --short
git diff --cached --stat
git diff --stat
git ls-files --others --exclude-standard
git branch --show-current
git rev-parse HEAD
git fetch origin main --prune
git rev-parse origin/main
node --version
npm view @sdcorejs/angular-material-datetime@1.0.4 version --json
npm view @sdcorejs/angular@19.2.5 version --json
npm view @sdcorejs/angular@20.2.5 version --json
npm view @sdcorejs/angular@21.2.5 version --json
npm view @sdcorejs/angular@22.2.5 version --json
npm view typescript-eslint@8.60.0 version peerDependencies --json
git ls-remote --tags origin refs/tags/v2.5
```

Portable runtime bootstrap when `node --version` is not `v22.22.3`:

```powershell
$nodeRuntimeDir = Join-Path ([System.IO.Path]::GetTempPath()) 'sdcorejs-node-22.22.3-runtime'
$nodeArchive = Join-Path $nodeRuntimeDir 'node-v22.22.3-win-x64.zip'
$nodeChecksums = Join-Path $nodeRuntimeDir 'SHASUMS256.txt'
New-Item -ItemType Directory -Force -Path $nodeRuntimeDir | Out-Null
Invoke-WebRequest 'https://nodejs.org/dist/v22.22.3/node-v22.22.3-win-x64.zip' -OutFile $nodeArchive
Invoke-WebRequest 'https://nodejs.org/dist/v22.22.3/SHASUMS256.txt' -OutFile $nodeChecksums
$checksumLine = Get-Content -LiteralPath $nodeChecksums | Where-Object { $_ -match '\snode-v22\.22\.3-win-x64\.zip$' }
if (@($checksumLine).Count -ne 1) { throw 'Official Node checksum entry is missing or ambiguous.' }
$expectedNodeHash = ($checksumLine -split '\s+')[0].ToLowerInvariant()
$actualNodeHash = (Get-FileHash -LiteralPath $nodeArchive -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actualNodeHash -ne $expectedNodeHash) { throw 'Portable Node SHA-256 mismatch.' }
Expand-Archive -LiteralPath $nodeArchive -DestinationPath $nodeRuntimeDir -Force
$nodeBinDir = Join-Path $nodeRuntimeDir 'node-v22.22.3-win-x64'
$env:Path = "$nodeBinDir;$env:Path"
node --version
```

The stable extracted runtime directory is diagnostic local state, not a machine installation. At the start of Tasks 2, 4, 12 and 17, and after any user-authorization pause or new shell/session, run the activation snippet below in the same persistent PTY/session as the ensuing commands. If the directory no longer exists, repeat the verified bootstrap. Every fresh command session that performs a v22 install/build must reactivate and assert the runtime; never fall back silently to the host's `22.22.2`.

```powershell
$nodeBinDir = Join-Path ([System.IO.Path]::GetTempPath()) 'sdcorejs-node-22.22.3-runtime\node-v22.22.3-win-x64'
if (-not (Test-Path -LiteralPath (Join-Path $nodeBinDir 'node.exe'))) { throw 'Portable Node runtime is absent; repeat the verified bootstrap.' }
$env:Path = "$nodeBinDir;$env:Path"
if ((node --version).Trim() -ne 'v22.22.3') { throw 'Exact Node v22.22.3 is required.' }
```

Expected: exact Node runtime, unused intended versions/tag, and clean isolated branches. The npm collision queries are repeated at the later irreversible gates because this result expires.

## Phase 2 — Release the datetime compatibility dependency

### Task 2 — CREATE/EDIT TESTS: Add datetime Angular 22 regressions and capture RED

**Owner:** `github.com/sdcorejs/angular-material-datetime`.

**Files:** edit the test harness `tools/consumer-smoke.mjs`, `tools/release-workflow.test.mjs`, `tools/publish-datetime.test.mjs`; create `tools/compare-package-baseline.test.mjs`.

- [ ] Reactivate and assert the exact portable Node `v22.22.3` runtime before `npm ci` or any Angular consumer command.
- [ ] Extend the consumer harness whitelist/default matrix from 19/20/21 to 19/20/21/22 and materialize Angular 22 with framework/CDK/Material/compiler `~22.1.4`, CLI/build tooling `~22.1.6`, TypeScript `~6.0.3`, and Zone.js `~0.16.2`.
- [ ] Keep `strict: true`, `strictTemplates: true`, `skipLibCheck: false`, normal `npm install`, the packed local artifact, FESM resolution probe and production build.
- [ ] Add a `--tarball $verifiedTarball` option to the consumer test harness. When supplied, it must consume that resolved absolute file without repacking; the no-argument developer command may still pack once into its own temporary directory.
- [ ] Add workflow assertions requiring the Angular 22 consumer leg and release job to use Node `22.22.3`.
- [ ] Add publisher assertions requiring `npm publish $verifiedTarball --access public`, where `$verifiedTarball` is the exact absolute filename returned by the preceding pack/checksum step; never allow a second pack, a second build or a source-directory publish after verification.
- [ ] Write baseline-comparator tests first. They require comparison of root export-map keys, `module`, `typings`, and sorted public `.d.ts` path/symbol inventory; they accept only version/peer/description metadata changes and reject an export or declaration drift.
- [ ] Run `node --test tools/compare-package-baseline.test.mjs` before creating the comparator module. Expected RED: the production comparator module/export is absent.
- [ ] Run the workflow test before editing workflows. Expected RED: Node 22.22.3/artifact-publication assertions fail.
- [ ] Build with the old `<22.0.0` peer range, then run the Angular 22 consumer. Expected RED: normal npm install rejects the packed package with `ERESOLVE`; no bypass flag is present.
- [ ] Save the commands, exit codes and decisive failure lines in the execution log before touching production metadata/workflows.

Commands:

```powershell
npm ci
node --test tools/compare-package-baseline.test.mjs
npm run test:release-workflow
npm run build:datetime
npm run test:consumer -- --angular=22
```

### Task 3 — CREATE/EDIT: Implement the minimal datetime compatibility change

**Owner:** `github.com/sdcorejs/angular-material-datetime`.

**Files:** edit `projects/datetime/package.json`, root `package.json`, `package-lock.json`, both workflows, `tools/verify-package.mjs`, `tools/publish-datetime.mjs`, README/demo copy; create `tools/compare-package-baseline.mjs` and `.changeset/add-angular-22-support.md`.

- [ ] Widen only the five Angular/CDK/Material peers in `projects/datetime/package.json` from `>=19.0.0 <22.0.0` to `>=19.0.0 <23.0.0`; retain RxJS and all source/public exports.
- [ ] Implement the tested baseline comparator and add `--tarball $verifiedTarball` to `verify-package.mjs`; both consume the same packed file and neither repacks it.
- [ ] Do not manually change `projects/datetime/package.json` version; add one patch changeset for `@sdcorejs/angular-material-datetime` so Changesets proposes the next unused exact patch, expected `1.0.4`.
- [ ] Pin the CI consumer leg and release workflow to Node `22.22.3`; that one consumer leg must run both the Angular 19 baseline and Angular 22 fixture. A Node 20 job may remain only as an additional legacy unit/lint/build check and must not own either required packed-consumer proof.
- [ ] In the release job, build once, pack `dist/datetime` once into `$RUNNER_TEMP/datetime-release`, generate SHA-256 plus npm pack integrity metadata, then pass that same absolute `.tgz` to APF verification, baseline comparison and the 19–22 strict consumer matrix before uploading it as an artifact. Export the resolved tarball path and SHA-256 as named step outputs and bind those exact values to `SD_DATETIME_RELEASE_TARBALL` and `SD_DATETIME_RELEASE_SHA256` on the Changesets publish step; do not rediscover a filename by glob.
- [ ] Register `test:package-baseline` exactly as the comparator unit test followed by its default 1.0.3 baseline CLI (`node --test tools/compare-package-baseline.test.mjs && node tools/compare-package-baseline.mjs`). Change root `release` so Changesets calls only the checksum-aware publisher using `SD_DATETIME_RELEASE_TARBALL` and `SD_DATETIME_RELEASE_SHA256` from the preceding workflow step; all build, pack and verification commands remain earlier workflow steps and cannot run again inside `release`.
- [ ] Preserve the existing exact-version lookup/idempotency behavior; an unexpected registry response remains a hard failure. Existing same-version content may be treated as already published only after its registry integrity equals the retained artifact.
- [ ] Retain Repository A's existing `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` Changesets authentication; migrating this dependency repository to trusted publishing is outside scope. The no-`NODE_AUTH_TOKEN` invariant applies to Repository B's Core UI workflow only.
- [ ] Regenerate only `package-lock.json` workspace metadata with `npm install --package-lock-only --ignore-scripts`, then prove `npm ci` succeeds.
- [ ] Update Angular 19–21 compatibility prose to 19–22 in root/package READMEs and the demo hero/footer. Do not rewrite historical changelog entries.

The changeset body is exactly scoped to Angular 22 peer and packed-consumer compatibility; it does not claim runtime API changes.

### Task 4 — VERIFY: Turn datetime RED to GREEN and compare the package surface

**Owner:** `github.com/sdcorejs/angular-material-datetime`.

- [ ] Reactivate and assert the exact portable Node `v22.22.3` runtime before rerunning the matrix.
- [ ] Rerun the exact RED commands and require them all to pass.
- [ ] Run all existing tests, coverage thresholds, lint, all library builds, APF verification, baseline comparison, the full 19–22 consumer matrix and a dry-run pack.
- [ ] Inspect the emitted package manifest and declaration/export inventory; the only allowed baseline differences are version/description/peer metadata.
- [ ] Verify the Angular 22 temp consumer lock contains Angular 22, TypeScript 6.0 and Zone 0.16, and contains no peer override or Angular 21 framework resolution.
- [ ] Exercise the exact release-artifact path once: pack `dist/datetime` once into a fresh OS temporary directory, calculate SHA-256, then pass that same absolute tarball to APF verification, the `1.0.3` baseline comparator and each strict Angular 19/20/21/22 consumer leg. None of those consumers may repack.
- [ ] Verify Git has no temp consumer, tarball, dist, coverage or `node_modules` changes.

Commands:

```powershell
npm ci
npm run test:release-workflow
npm run lint
npm run test:coverage
npm run build:all
npm run test:package
npm run test:package-baseline
npm run test:consumer -- --angular=22
npm run test:consumer
npm run pack:datetime
$datetimeStage = Join-Path ([System.IO.Path]::GetTempPath()) "sdcorejs-datetime-1.0.4-preflight-$PID"
New-Item -ItemType Directory -Path $datetimeStage | Out-Null
$packResult = npm pack .\dist\datetime --json --pack-destination $datetimeStage | ConvertFrom-Json
$verifiedTarball = Join-Path $datetimeStage $packResult[0].filename
$verifiedSha256 = (Get-FileHash -LiteralPath $verifiedTarball -Algorithm SHA256).Hash.ToLowerInvariant()
node tools/verify-package.mjs --tarball $verifiedTarball
node tools/compare-package-baseline.mjs --tarball $verifiedTarball --baseline @sdcorejs/angular-material-datetime@1.0.3
node tools/consumer-smoke.mjs --tarball $verifiedTarball --angular=19
node tools/consumer-smoke.mjs --tarball $verifiedTarball --angular=20
node tools/consumer-smoke.mjs --tarball $verifiedTarball --angular=21
node tools/consumer-smoke.mjs --tarball $verifiedTarball --angular=22
npx changeset status
git diff --check
git status --short
```

Expected: all GREEN, patch changeset detected, and no source/public declaration drift from `1.0.3`.

### Task 5 — VERIFY/COMMIT: Review, commit, push and merge the datetime implementation PR

**Owner:** `github.com/sdcorejs/angular-material-datetime`.

- [ ] Commit RED tests separately as `test(datetime): cover Angular 22 packed consumers` after preserving RED evidence.
- [ ] Commit implementation/docs/changeset as `feat(datetime): support Angular 22 consumers`.
- [ ] Run an independent code/release review and repair only findings within Repository A's allowed paths.
- [ ] Before the first push, rebase onto current `origin/main` if needed. Then push `feat/angular22-peer-support`, open a focused PR to `main`, wait for all checks, and use only a normal merge from later `origin/main` updates. Never rebase after the first push and never force-push; rerun invalidated checks, then merge only this scoped implementation PR.
- [ ] Confirm the Changesets workflow creates the version-package PR proposing exactly `@sdcorejs/angular-material-datetime@1.0.4` and that no adapter package is included.
- [ ] Stop. Report the implementation commit/PR, green evidence, release-workflow artifact contract, release PR and fresh collision result. Request explicit authorization to merge the Changesets release PR and let that workflow build, verify and publish one exact `1.0.4` tarball in a single run.

### Release Gate A: Datetime publication

This gate is not authorized by design or plan approval.

- [ ] After explicit user authorization, fetch current `main`, ensure the release PR contains only the expected version/changelog outputs, and re-run the exact `1.0.4` collision check.
- [ ] Merge that release PR only while its checks are green; monitor the repository release workflow through terminal state.
- [ ] If workflow state or registry response is uncertain, query exact `1.0.4` before any retry. Never unpublish, overwrite or blindly rerun.
- [ ] Verify `npm view`, `npm pack`, checksum/integrity, manifest peers, exports/declarations and a clean Angular 22 strict consumer using registry `1.0.4`.
- [ ] Record the immutable datetime release evidence. Only then may Core UI replace `1.0.3`.

Commands after authorization:

```powershell
npm view @sdcorejs/angular-material-datetime@1.0.4 version peerDependencies dist.integrity dist.shasum --json
$datetimeEvidenceDir = Join-Path ([System.IO.Path]::GetTempPath()) 'sdcorejs-datetime-1.0.4-verify'
New-Item -ItemType Directory -Force -Path $datetimeEvidenceDir | Out-Null
npm pack @sdcorejs/angular-material-datetime@1.0.4 --json --pack-destination $datetimeEvidenceDir
```

## Phase 3 — Add Core UI RED contracts

### Task 6 — CREATE/EDIT TESTS: Add the four-line repository and sync contract tests

**Owner:** `github.com/sdcorejs/sdcorejs-angular`.

**Files:** create `scripts/supported-versions.test.mjs`, `scripts/check-version-sync.test.mjs`; edit `scripts/collect-docs.test.mjs`; edit root `package.json` only to register all planned contract-test commands.

- [ ] Assert the exact ordered set `[19, 20, 21, 22]` across workspace directories, root lint scripts, sync targets/status text, deploy targets, lint-phase validation, docs collectors, CI matrices, publish targets and package generation.
- [ ] Extend `scripts/collect-docs.test.mjs` with a `[workspace]` case for exact `22.2.5` → `v2.5`, and make the supported-version test prove `collect-release-docs` iterates all four majors.
- [ ] Add root scripts `test:supported-versions`, `test:version-sync-contract`, `test:release-package-contract`, and `test:publish-npm-workflow`, then append all four to the existing `test:scripts` chain without removing or reordering its current generator, branding, docs, published-page or i18n tests; the broad gate must fail if any planned or existing script is omitted.
- [ ] Assert `versions/v22/package.json` has the exact reviewed minor trains and engine union; assert its package manifest has v22-only Angular peers while v19-v21 retain `^19 || ^20 || ^21`.
- [ ] Assert the v22 lock resolves Angular framework/CDK/Material/compiler 22, CLI/build 22, angular-eslint 22, exact `typescript-eslint@8.60.0`, TypeScript 6.0, Zone 0.16 and datetime 1.0.4; reject Angular 21 framework/build resolutions, old `typescript-eslint@8.26.0`, npm overrides, local `file:` specs and Git dependencies.
- [ ] Write a test that imports the future sync-check normalization/compare helpers without running the CLI, and specifies the exact approved v22 override keys: package version, Angular/toolchain/datetime dependency versions (including `typescript-eslint@8.60.0`), public Angular peers, Node engines and the known side-drawer constructor shim. Do not change `check-version-sync.mjs` before capturing RED.
- [ ] Assert any additional source file drift, public-barrel drift or unlisted manifest field still fails sync.
- [ ] Prefix independently runnable workspace/sync/manifest/lock cases in these two files with `[workspace]`; prefix cases that inspect later CI/publish integration with `[release]`. The normal scripts still run every case, but Task 12 may select only `[workspace]` without pretending the later release contracts are GREEN.
- [ ] Run the two tests against the current three-line repository. Expected RED includes missing `versions/v22`, missing v22 scripts/matrices and missing normalization contract.

Command:

```powershell
node --test scripts/supported-versions.test.mjs scripts/check-version-sync.test.mjs scripts/collect-docs.test.mjs
```

### Task 7 — CREATE/EDIT TESTS: Add release-transaction and package-consumer RED contracts

**Owner:** `github.com/sdcorejs/sdcorejs-angular`.

**Files:** create only `scripts/release-package-contract.test.mjs`, `scripts/publish-npm-workflow.test.mjs`, and the strict consumer fixture files; edit `scripts/build-published-page.test.mjs`. `scripts/release-package-contract.mjs` is intentionally absent until the GREEN implementation in Task 15.

- [ ] Specify `releaseTargets(suffix)` in the test as returning exact versions in order 19/20/21/22, with recovery tags `angular19`, `angular20`, `angular21` and final tag `latest` for stable v22.
- [ ] Specify manifest validation in the test for expected name/version, v19-v21 peers, v22-only peers, v22 Node engine, exact published datetime dependency and absence of unexpected exports/files.
- [ ] Require packed `repository.type === "git"` and `repository.url === "git+https://github.com/sdcorejs/sdcorejs-angular.git"`; reject a missing/different repository or an unexpected `repository.directory` claim before trusted publication.
- [ ] Specify bundle validation in the test as requiring all four `.tgz`, SHA-256, npm integrity/shasum and one source SHA before any publish plan can be returned.
- [ ] Specify baseline comparison against exact 2.4 export maps and normalized public declaration inventories: 19/20/21 compare with their matching `19.2.4`/`20.2.4`/`21.2.4` packages, and v22 compares with `21.2.4` as the closest prior generated line after normalizing only approved framework/release metadata. Allow no source, export or public declaration change.
- [ ] Create one unchanged strict consumer source that imports representative stable Core UI entry points and direct `@sdcorejs/utils/fns`, `/models`, `/constants`; never import utils through `@sdcorejs/angular/utilities`.
- [ ] Make that fixture exact and syntax-stable: import standalone `SdButton` from `@sdcorejs/angular/components/button` and `SdDateRange` from `@sdcorejs/angular/forms/date-range`; import `Utilities`, `Color` and `EMPTY_STR` directly from the three utils subpaths; render `<sd-button [color]="color">Save</sd-button><sd-date-range />`; expose `color: Color = 'primary'`, `empty = EMPTY_STR` and a value reference to `Utilities`. Compile this identical source with `strict: true`, `strictTemplates: true` and `skipLibCheck: false` against each matching Angular 19/20/21/22 tarball.
- [ ] Make each generated consumer `package.json` declare direct exact `@sdcorejs/utils` equal to the candidate package's declared dependency; reject a missing/transitive-only utils dependency so hoisting cannot create a false pass.
- [ ] Add workflow assertions for build-all-before-publish, artifact download without rebuild, per-version registry collision/integrity handling, sequential recovery tags, a single final `latest`, postpublish verification, GitHub-hosted runners, exact `npm@11.5.1`, provenance and absence of `NODE_AUTH_TOKEN`. Assert no broad workflow permission: build/verify are read-only, only publisher has `id-token: write`, and only postpublish docs has `contents: write` with no OIDC permission.
- [ ] Assert the successful postpublish job materializes the verified v19 tarball and clean-installs Showcase before it runs `npm run build:page -- --suffix 2.5`, verifies `published-pages/2.5`, and stages both `published-docs` and `published-pages`; the deploy-pages workflow remains build-free.
- [ ] Add a page-retention regression proving the pre-release set `2.0`–`2.4` plus new `2.5` prunes exactly `published-pages/2.0/**`, retains `2.1`–`2.5`, and writes `latest: "2.5"` without touching the 1.x group.
- [ ] Run tests before creating the production contract or changing the workflow. Expected RED: the contract module is missing; the workflow also has only three targets, interleaves build/publish and lacks v22/final-only-latest guarantees.

Command:

```powershell
node --test scripts/release-package-contract.test.mjs scripts/publish-npm-workflow.test.mjs scripts/build-published-page.test.mjs
```

### Task 8 — EDIT TESTS: Add showcase Angular 22 inception regressions

**Owner:** `github.com/sdcorejs/sdcorejs-angular`.

**Files:** edit root `package.json`, the generator specs and the seven existing showcase specs listed in the allowed paths.

- [ ] Make changelog tests expect 19/20/21 for all historical releases and 19/20/21/22 only for suffix `2.5` onward.
- [ ] Make route-shell tests expect canonical `22.2.5` for suffix `2.5`, reject `22.1.x` as fabricated history and keep lower-major deep links client-routable.
- [ ] Make version utility/service/selector tests expect group order 22/21/20/19, v22 selection/fallback and first supported v22 `22.2.5`.
- [ ] Make About, Changelog, Getting Started and Home specs expect Angular 19–22 copy, the Angular 22 filter/link and `npm install @sdcorejs/angular@^22` when a v22 route is selected.
- [ ] Register root `test:showcase-angular22-contract` as the exact fail-fast chain: the two Node generator tests; clean v19 install with `--legacy-peer-deps`; v19 build; clean Showcase install with `--legacy-peer-deps`; library link; then the seven focused Jasmine `--include` paths below. This is the parallel showcase unit's complete verification command and is not appended to the lightweight root `test:scripts` chain.
- [ ] Run script tests before production generator changes. Expected RED: v22 is missing or appears with the wrong inception.
- [ ] Build the current v19 library, link it into showcase, then run the focused showcase specs. Expected RED: existing production copy/filter/fallback still says 19–21.

Commands:

```powershell
node --test scripts/generate-showcase-changelog.test.mjs scripts/generate-showcase-route-shells.test.mjs
npm --prefix versions/v19 ci --legacy-peer-deps
npm --prefix versions/v19 run build
npm --prefix showcase ci --legacy-peer-deps
npm --prefix showcase run link:library
npm --prefix showcase run test -- --include=src/app/docs/core/docs-version.utils.spec.ts --include=src/app/docs/core/docs-version.service.spec.ts --include=src/app/docs/shared/version-selector.component.spec.ts --include=src/app/docs/pages/about/about.component.spec.ts --include=src/app/docs/pages/changelog/changelog.component.spec.ts --include=src/app/docs/pages/getting-started/getting-started.component.spec.ts --include=src/app/docs/pages/home/docs-home.component.spec.ts
```

### Task 9 — VERIFY/COMMIT: Commit the Core RED baseline

**Owner:** `github.com/sdcorejs/sdcorejs-angular`.

- [ ] Confirm the RED failures are caused only by the intentionally missing Angular 22 support, not syntax, fixture or environment errors.
- [ ] Commit the new/updated regressions as `test(release): define the Angular 22 support contract`.
- [ ] Do not push a red-only branch to `main`; continue immediately to the GREEN implementation on the same feature branch.

## Phase 4 — Bootstrap and synchronize the Angular 22 workspace

### Task 10 — EDIT: Consume the verified datetime release and update canonical metadata

**Owner:** `github.com/sdcorejs/sdcorejs-angular`.

**Files:** edit v19 root/library manifests, showcase manifests/locks and canonical descriptions/README sources.

- [ ] Reconfirm registry `@sdcorejs/angular-material-datetime@1.0.4` peers include Angular 22 and its tarball matches Release Gate A evidence.
- [ ] Replace exact `1.0.3` with exact `1.0.4` in `versions/v19/package.json`, `versions/v19/projects/sdcorejs-angular/package.json` and `showcase/package.json`.
- [ ] Update the canonical library description and README compatibility copy from Angular 19–21 to 19–22 while preserving existing v19-v21 public peer ranges.
- [ ] Update `versions/v19/projects/sdcorejs-angular/forms/datetime/sd-datetime.md` from exact datetime `1.0.3` to `1.0.4`, then let root sync generate the v20/v21/v22 copies.
- [ ] Regenerate v19 and showcase lock entries with `npm --prefix versions/v19 install --package-lock-only --ignore-scripts --legacy-peer-deps` and `npm --prefix showcase install --package-lock-only --ignore-scripts --legacy-peer-deps`. These existing historical workspaces may use that documented route; v22 never may.
- [ ] Verify the locks resolve registry `1.0.4`, not a local path, Git URL or override.

### Task 11 — CREATE/EDIT: Implement four-line sync and one-time v22 bootstrap

**Owner:** `github.com/sdcorejs/sdcorejs-angular`.

**Files:** edit root `package.json`, sync/check/lint/docs/deploy scripts; generate `versions/v22/**`.

- [ ] Extend the ordered version set to v19 → v20 → v21 → v22 and update all status/help/error text accordingly.
- [ ] Add root `lint:v22` as `npm --prefix versions/v22 run lint` and extend `lint:release` to run v19, v20, v21 and v22 exactly once in order; preserve every existing root script not explicitly changed by Tasks 6 or 11.
- [ ] When `versions/v22` is absent, copy the complete v21 workspace skeleton while excluding `package-lock.json`, caches, build output, demos and legacy per-workspace release/sync orchestrators.
- [ ] For v22, mirror shared `projects/sdcorejs-angular` source from canonical v19 and copy exactly the required helper scripts: `check-i18n.mjs`, `check-i18n-parity.mjs`, and `generate-pdf-worker-inline.mjs`.
- [ ] Treat `versions/v19/README.md` as a managed root workspace file and copy it to v22 on every sync so the new workspace cannot retain stale v21 wording.
- [ ] Preserve the v21-derived compiler/workspace structure and use the three-argument `DomPortalOutlet` shim at `versions/v22/projects/sdcorejs-angular/components/side-drawer/src/side-drawer.component.ts`. This file is generated only through the reviewed bootstrap/sync transform; add no further shim unless the Angular 22 strict build produces evidence for it.
- [ ] Transform v22 root dependencies to framework/CDK/Material/compiler/adapters `~22.1.4`, CLI/build-angular `~22.1.6`, ng-packagr `~22.1.1`, TypeScript `~6.0.3`, Zone.js `~0.16.2`, angular-eslint `~22.1.0`, exact `typescript-eslint@8.60.0`, and the verified datetime exact version. Keep v19-v21 on their existing typescript-eslint lines.
- [ ] Set the v22 root and published package Node engine to `^22.22.3 || ^24.15.0 || ^26.0.0`.
- [ ] Treat that engine union as an intentional approved contract. Do not widen its Node 26 arm to `>=26.0.0` without revising the approved spec and plan.
- [ ] Transform the v22 published manifest peer values for `@angular/animations`, `@angular/cdk`, `@angular/common`, `@angular/core`, `@angular/forms`, `@angular/material`, `@angular/material-date-fns-adapter`, `@angular/platform-browser`, and `@angular/router` to exactly `^22.0.0`; keep RxJS `^7.8.0`. Leave those nine Angular peers in v19-v21 on the existing shared `^19.0.0 || ^20.0.0 || ^21.0.0` contract.
- [ ] Refactor `check-version-sync.mjs` so tested normalization/compare helpers are importable without executing its CLI, then extend only the exact normalization contract specified in Task 6. Keep any source/public-barrel difference fatal.
- [ ] Extend lint phase, docs collectors and legacy recovery copy/status text to recognize v22. Keep root scripts authoritative; do not create v22-local deploy/sync orchestrators.
- [ ] Refactor `deploy.ps1` into a four-line reversible staging/checksum/collision preflight with an explicit `-OutputPath`. `-DryRun` must be non-interactive, must install/build/pack all four lines, must write bundle metadata to that output, and must restore every temporarily stamped package version in `finally`. Core publication remains GitHub trusted-publishing only; the local script must never call `npm publish`.

### Task 12 — VERIFY: Generate the v22 lock cleanly and turn workspace tests GREEN

**Owner:** `github.com/sdcorejs/sdcorejs-angular`.

- [ ] Reactivate and assert the exact portable Node `v22.22.3` runtime before sync, lock generation or `npm ci`.
- [ ] In `versions/v22`, generate `package-lock.json` from the v22 manifest under Node `22.22.3` using normal npm resolution and no `--legacy-peer-deps`, `--force`, overrides, local tarballs or Git dependencies.
- [ ] Refresh the checked-in v19/v20/v21 lockfiles for exact datetime `1.0.4`; the existing historical lines may use their documented `--legacy-peer-deps` lock-only route, but their resolved dependency must come from npm and their Angular-major contents must not be broadened as part of this task.
- [ ] Run `npm ci` in v22 and require no peer/engine warning for the Core UI package or datetime dependency.
- [ ] Assert the lock contains Angular 22, angular-eslint 22, `typescript-eslint@8.60.0` with its TypeScript `<6.1.0` peer satisfied, TypeScript 6.0, Zone 0.16 and datetime 1.0.4, with no Angular 21 framework/build package or `typescript-eslint@8.26.0`.
- [ ] Run root sync a second time and require idempotence: only deterministic `SYNC-STATUS.md` timestamp fields may differ; then run the sync checker.
- [ ] Rerun only the `[workspace]` cases from Task 6 and require GREEN. The `[release]` cases in `supported-versions.test.mjs` plus all Task 7 release/workflow tests intentionally remain RED until Tasks 14–16; record that expected state instead of claiming premature GREEN.

Commands:

```powershell
npm run sync
npm --prefix versions/v19 install --package-lock-only --ignore-scripts --legacy-peer-deps
npm --prefix versions/v20 install --package-lock-only --ignore-scripts --legacy-peer-deps
npm --prefix versions/v21 install --package-lock-only --ignore-scripts --legacy-peer-deps
npm --prefix versions/v22 install --package-lock-only --ignore-scripts
npm --prefix versions/v22 ci
npm run sync
npm run check:sync
node --test --test-name-pattern="^\[workspace\]" scripts/supported-versions.test.mjs scripts/check-version-sync.test.mjs scripts/collect-docs.test.mjs
```

Expected: real v22 workspace and lock, exact four-line parity, zero unapproved normalization, and no claim that the still-unimplemented release workflow is GREEN.

## Phase 5 — Update showcase, documentation and history

### Task 13 — EDIT: Implement Angular 22 inception and user-facing support copy

**Owner:** `github.com/sdcorejs/sdcorejs-angular`.

- [ ] Add the v22 minimum `22.2.5` to route and runtime version utilities.
- [ ] Make changelog generation choose majors by suffix: releases before `2.5` remain 19/20/21; release `2.5` emits 19/20/21/22.
- [ ] Add the Angular 22 Changelog filter and update About, Getting Started and Home copy/fallback to 19–22.
- [ ] Leave `DocsVersionService` and `VersionSelectorComponent` production code unchanged; a failure there pauses execution for a reviewed plan revision instead of an unapproved edit.
- [ ] Add a root `CHANGELOG.md` entry for suffix `[2.5]` dated `2026-09-02`, describing Angular 22 support, dependency-first compatibility and the unchanged public API. Do not edit earlier entries.
- [ ] Update `README.md`, `README.npm.md`, `AGENTS.md`, `CLAUDE.md` and `versions/v19/README.md` with the four-line source/sync/test/release model, v22 inception and normal-resolution requirement.
- [ ] Remove stale prose saying three packages/matrices or v21 is the canonical latest line; retain historical statements when explicitly dated.
- [ ] Regenerate `showcase/src/app/docs/generated/changelog.generated.ts`, then run `npm run test:showcase-angular22-contract` to GREEN.
- [ ] Run `npm run sync` after canonical README/package metadata changes and review all generated v20/v21/v22 diffs.

## Phase 6 — Make CI and publication transaction-safe

### Task 14 — EDIT: Extend CI to canonical v19 plus Angular 20/21/22 compatibility

**Owner:** `github.com/sdcorejs/sdcorejs-angular`.

**File:** `.github/workflows/ci.yml`.

- [ ] Pin every Angular workspace install/lint/build/test job, including canonical v19 and the v20/v21/v22 compatibility jobs, to Node `22.22.3`. Node 20 may remain only for root script-only jobs that do not install or execute an Angular workspace.
- [ ] Keep `verify-version-sync` and root script tests.
- [ ] Keep canonical v19 install/lint/build/full Karma coverage.
- [ ] Add isolated compatibility matrix jobs for v20, v21 and v22 lint/build; use the existing historical install route only for v20/v21, and clean `npm ci` with no peer bypass for v22.
- [ ] Use artifact/CI install commands exactly: `npm ci --legacy-peer-deps` for v19/v20/v21 and `npm ci` for v22. Do not use `npm install` in any Angular build/test job now that the checked-in locks are refreshed.
- [ ] Run the full v22 Karma suite as the new-major runtime compatibility gate.
- [ ] Keep each runner workspace isolated. Locally and in any shared job, run v19 and v22 Karma sequentially because both use port 9876.

### Task 15 — CREATE/EDIT: Refactor the release workflow to immutable four-package artifacts

**Owner:** `github.com/sdcorejs/sdcorejs-angular`.

**File:** `.github/workflows/publish-npm.yml`.

- [ ] Create `scripts/release-package-contract.mjs` to satisfy Task 7's RED API and CLI tests; its CLI emits deterministic JSON containing the four validated targets, artifact filenames, hashes, source SHA and allowed publish order.
- [ ] Preserve the workflow filename and trusted-publisher identity.
- [ ] Pin every release build, package verification and publish job to Node `22.22.3`; install exact `npm@11.5.1` before the trusted-publishing step and configure `actions/setup-node` with `registry-url: https://registry.npmjs.org`.
- [ ] Resolve and validate suffix once, emitting exact four-target JSON and source SHA.
- [ ] Require `npm run check:sync`, script/release-contract tests and canonical v19 coverage before package jobs. Do not execute the Windows/robocopy-based `npm run sync` on an Ubuntu runner; sync idempotence is proven in the Windows/local Task 12 gate.
- [ ] In four build/pack matrix jobs, install with exact commands (`npm ci --legacy-peer-deps` for v19/v20/v21; `npm ci` for v22), lint and build each line. Never use `npm install` in an artifact-producing job. Write the exact release version into a job-local checkout before building.
- [ ] Pack each built `dist/sdcorejs-angular` exactly once. Retain `.tgz`, npm pack JSON (`integrity`, `shasum`, file list), SHA-256 and target metadata in uniquely named uploaded artifacts.
- [ ] Add one verification job that downloads all four artifacts, checks hashes/source SHA/completeness, package names/versions/peers/engines/dependencies, APF files, absence of specs/source/caches, exact v19-v21 2.4 public-surface baselines and strict v19-v22 consumer compilation.
- [ ] Perform registry preflight for all four versions before publishing any. Existing same-integrity versions are accepted only in explicit recovery; different-integrity collision is fatal.
- [ ] Use one non-matrix publish job. Download and re-hash artifacts; publish 19/20/21 sequentially under `angular19`/`angular20`/`angular21`; verify each exact registry version and assert `latest` remains unchanged after each.
- [ ] Publish the already verified v22 tarball last with `latest`. Do not rebuild and do not call `npm dist-tag add`.
- [ ] On uncertain response, query exact version/integrity before any bounded retry. Stop on mismatch and report immutable successes.
- [ ] Postpublish, compare registry versions/integrity/shasum/downloaded SHA-256, assert recovery tags, `latest === 22.2.5`, and verify provenance/attestation metadata.
- [ ] Only after postpublish succeeds, download and re-verify the retained v19 tarball, extract its package contents into `versions/v19/dist/sdcorejs-angular`, and run `npm --prefix showcase ci --legacy-peer-deps` before generating all four published-doc archives and running `npm run build:page -- --suffix 2.5`. Verify new `published-pages/2.5`, the expected retention deletion of `published-pages/2.0`, and `pages.json` retaining exactly 2.1–2.5; then stage/commit both `published-docs` and the complete `published-pages` change to `main`. `.github/workflows/deploy-pages.yml` remains a pure deployer of committed output and is not changed into a builder.
- [ ] Set workflow/default permissions to `{}` (or omit any broad grant) and declare exact job permissions: all verification/build jobs `contents: read`; the publisher only `contents: read` plus `id-token: write`; the postpublish docs job `contents: write` with no `id-token`. No other job receives write or OIDC permission. Keep GitHub-hosted runners, exact `npm@11.5.1`, automatic provenance and no `NODE_AUTH_TOKEN`.

### Task 16 — VERIFY: Turn workflow tests GREEN and exercise reversible release preflight

**Owner:** `github.com/sdcorejs/sdcorejs-angular`.

- [ ] Rerun `scripts/publish-npm-workflow.test.mjs`, `release-package-contract.test.mjs` and `build-published-page.test.mjs` together to GREEN.
- [ ] Run the commands below. The preflight must not prompt, must build/pack/checksum all four versions, must collision-check without publishing, and must restore the source manifests even on failure.
- [ ] Hash all four root manifests, library manifests and lockfiles before the dry run; require every hash to be byte-identical afterward. A `finally` restore that merely produces semantically equivalent JSON is insufficient.
- [ ] Add a `deploy.ps1 -InjectFailureAfterStamp <v19|v20|v21|v22>` regression hook that is rejected unless `-DryRun` is also present. After the happy-path preflight has produced build inputs, invoke a controlled `v20` mid-sequence failure with `-SkipInstall`; require a non-zero exit and byte-identical restoration of every manifest/lock hash. The production workflow never passes this test-only switch.
- [ ] Verify the dry-run leaves `npm view @sdcorejs/angular@22.2.5` absent and leaves `latest` unchanged.
- [ ] Confirm workflow source contains no `NODE_AUTH_TOKEN`, local path dependency, rebuild in publisher, direct dist-tag mutation or per-line publish before all artifacts are verified.

```powershell
$coreManifestPaths = @(
  'versions/v19/package.json', 'versions/v19/package-lock.json', 'versions/v19/projects/sdcorejs-angular/package.json',
  'versions/v20/package.json', 'versions/v20/package-lock.json', 'versions/v20/projects/sdcorejs-angular/package.json',
  'versions/v21/package.json', 'versions/v21/package-lock.json', 'versions/v21/projects/sdcorejs-angular/package.json',
  'versions/v22/package.json', 'versions/v22/package-lock.json', 'versions/v22/projects/sdcorejs-angular/package.json'
)
$coreManifestHashesBefore = @{}
foreach ($manifestPath in $coreManifestPaths) {
  $coreManifestHashesBefore[$manifestPath] = (Get-FileHash -LiteralPath $manifestPath -Algorithm SHA256).Hash
}
$coreReleaseStage = Join-Path ([System.IO.Path]::GetTempPath()) "sdcorejs-angular-2.5-preflight-$PID"
powershell -ExecutionPolicy Bypass -File .\scripts\deploy.ps1 -PatchVersion 2.5 -DryRun -OutputPath $coreReleaseStage
node scripts/release-package-contract.mjs --artifact-root $coreReleaseStage --suffix 2.5 --baseline-suffix 2.4 --datetime-version 1.0.4 --compile-consumers
foreach ($manifestPath in $coreManifestPaths) {
  $hashAfter = (Get-FileHash -LiteralPath $manifestPath -Algorithm SHA256).Hash
  if ($hashAfter -ne $coreManifestHashesBefore[$manifestPath]) { throw "DryRun changed $manifestPath" }
}
$failureOutput = Join-Path ([System.IO.Path]::GetTempPath()) "sdcorejs-angular-2.5-failure-$PID"
powershell -ExecutionPolicy Bypass -File .\scripts\deploy.ps1 -PatchVersion 2.5 -DryRun -SkipInstall -InjectFailureAfterStamp v20 -OutputPath $failureOutput
if ($LASTEXITCODE -eq 0) { throw 'Expected controlled DryRun failure did not occur.' }
foreach ($manifestPath in $coreManifestPaths) {
  $hashAfterFailure = (Get-FileHash -LiteralPath $manifestPath -Algorithm SHA256).Hash
  if ($hashAfterFailure -ne $coreManifestHashesBefore[$manifestPath]) { throw "Failure path changed $manifestPath" }
}
```

## Phase 7 — Full verification, review and Core implementation PR

### Task 17 — VERIFY: Run the complete prepublish matrix

**Owner:** `github.com/sdcorejs/sdcorejs-angular`.

Run builds and Karma sequentially in the shared local worktree. CI matrix parallelism is allowed only because GitHub runners are isolated.

Reactivate the recorded portable runtime in this shell first and require exact `v22.22.3` before the first install.

```powershell
node --version
npm --prefix versions/v19 ci --legacy-peer-deps
npm --prefix versions/v20 ci --legacy-peer-deps
npm --prefix versions/v21 ci --legacy-peer-deps
npm --prefix versions/v22 ci
npm --prefix showcase ci --legacy-peer-deps
npm --prefix versions/v19 exec -- ng version
npm --prefix versions/v20 exec -- ng version
npm --prefix versions/v21 exec -- ng version
npm --prefix versions/v22 exec -- ng version
npm run check:sync
npm run test:scripts
npm run lint:release
npm --prefix versions/v19 run build
npm --prefix versions/v20 run build
npm --prefix versions/v21 run build
npm --prefix versions/v22 run build
npm --prefix versions/v19 exec -- ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage
npm --prefix versions/v22 exec -- ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage
npm --prefix showcase run link:library
npm --prefix showcase run test
npm --prefix showcase run build:prod
$coreReleaseStage = Join-Path ([System.IO.Path]::GetTempPath()) "sdcorejs-angular-2.5-full-$PID"
powershell -ExecutionPolicy Bypass -File .\scripts\deploy.ps1 -PatchVersion 2.5 -DryRun -SkipInstall -OutputPath $coreReleaseStage
node scripts/release-package-contract.mjs --artifact-root $coreReleaseStage --suffix 2.5 --baseline-suffix 2.4 --datetime-version 1.0.4 --compile-consumers
git diff --check
git status --short
```

- [ ] Require lint/build GREEN for all four lines, full Karma/coverage GREEN for canonical v19 and compatibility v22, all root/showcase tests GREEN and clean strict consumers for 19–22.
- [ ] Before lint/build, assert the four `ng version` outputs resolve local Angular CLI/framework majors 19, 20, 21 and 22 respectively. Any shared/stale CLI resolution is a failure even if a later build happens to pass.
- [ ] Inspect all four exact staged tarballs: v19-v21 public declarations/exports equal their matching 2.4 baselines; v22 equals normalized `21.2.4`; only reviewed framework/release metadata differs; and no utils re-export appears.
- [ ] Reuse Task 16's manifest/lock hash set around this `-SkipInstall` dry run and again require byte-identical restoration.
- [ ] Confirm all generated source is synchronized and a second generator/sync pass creates no unexplained diff.
- [ ] Run an independent implementation/security/release review. Repair only selected findings within the approved paths and rerun every invalidated check.
- [ ] Preserve a release-evidence table with command, SHA, exit code, test count, coverage result, tarball filename, SHA-256, integrity and registry collision result.

### Task 18 — VERIFY/COMMIT: Commit, push, merge the Core implementation PR, then stop at Release Gate B

**Owner:** `github.com/sdcorejs/sdcorejs-angular`.

- [ ] Commit workspace/sync/dependency work as `feat(workspaces): add Angular 22 support`.
- [ ] Commit showcase/docs work as `docs(showcase): introduce the Angular 22 release line`.
- [ ] Commit CI/release transaction work as `ci(release): publish four immutable Angular lines`.
- [ ] Ensure the approved spec/plan artifacts are included according to `commit_policy: with-change` and no unrelated dirty file is staged.
- [ ] Fetch `origin/main`; before the branch's first push only, rebase if needed and rerun invalidated evidence. Then push `feat/angular22-support`, open the focused Core PR to `main`, wait for all checks and inspect the complete diff. After the first push, integrate later main changes only with a normal merge; never force-push.
- [ ] Merge only this scoped Core implementation PR after green checks; do not merge unrelated/dangling PRs.
- [ ] Fetch `main`, record the merge SHA and rerun any release evidence invalidated by the merge.
- [ ] Stop. Report the merge SHA, exact intended versions, four tarball identities, registry/tag collision state and current npm `latest`. Request explicit authorization for the `v2.5` tag/publish action.

## Phase 8 — Release Gate B: Core UI `v2.5`

This phase is intentionally blocked until the user separately authorizes the irreversible tag/publish action.

- [ ] Immediately after authorization, fetch `origin/main`, ensure all required checks still correspond to the target commit, recheck `v2.5` and all four exact versions are unused, and verify datetime `1.0.4` remains available.
- [ ] Create annotated tag `v2.5` at the approved green `origin/main` commit and push only that tag.
- [ ] Monitor `.github/workflows/publish-npm.yml` to terminal state; do not launch a duplicate run while status is unknown.
- [ ] Verify the workflow publishes `19.2.5`, `20.2.5`, `21.2.5` under recovery tags without moving `latest`, then `22.2.5` last with `latest`.
- [ ] Verify all exact npm manifests, peers, datetime dependency, engines, exports, declarations, integrity/shasum/provenance and downloaded tarball SHA-256; assert `npm view @sdcorejs/angular dist-tags.latest` equals `22.2.5`.
- [ ] Only after registry verification, allow the postpublish job in `publish-npm.yml` to generate/commit four `published-docs` archives, add `published-pages/2.5/**`, prune exactly `published-pages/2.0/**` under the existing retention contract, and update `published-pages/pages.json`; `deploy-pages.yml` only deploys that committed page. Never hand-edit generated output.
- [ ] Fetch the postrelease docs/page commit and rerun registry/page smoke checks. Do not report branch-ready yet; those writes invalidate every earlier readiness result.

## Phase 9 — Failure, recovery and finish tail

- A datetime RED/GREEN or release failure blocks all Core v22 dependency/lock work.
- A Core v22 normal-resolution, strict compile, test, lint, build, pack or baseline failure blocks all Core publication.
- A stale or conflicting worktree is resolved through normal commits/rebase/merge; never use destructive reset or overwrite user changes.
- If one of v19-v21 publishes succeeds and a later one fails, record immutable successes and stop before v22. `latest` remains unchanged.
- If v22 publish fails, leave `latest` unchanged and repair forward after exact registry queries and new authorization.
- If v22 publish succeeds but postpublish verification fails, do not unpublish or overwrite; report immutable state and request an approved forward-fix decision.
- Never use `npm dist-tag add` in the tokenless trusted-publishing workflow.
- On the successful path, clean only known temporary directories created by the task before the final readiness gate. Do not delete broad workspace paths.
- After all registry, docs, page, Git fetch and cleanup work is complete, run `sdcorejs-ship` one final time in read-only branch-ready mode against the exact postrelease `main` HEAD. Require clean working tree, complete `.sdcorejs` artifact closure, verified published-page retention diff, fresh registry evidence and no unresolved dependency/release finding.
- Once that final branch-ready gate passes, perform no further filesystem, Git, npm or workflow write. The final handoff is read-only and includes the dependency merge/release SHA, Core merge/release SHA, postrelease docs/page SHA, tag `v2.5`, exact package versions, workflow URLs, RED → GREEN evidence, full verification results and npm/package checksum evidence.

## Acceptance-criteria traceability

- Datetime AC 1–4: Tasks 1–5.
- Datetime release AC 5–7: Release Gate A.
- Core workspace/sync/package AC 8–19: Tasks 6–12 and 17.
- Showcase/docs AC 20–21: Tasks 8 and 13.
- Test/lint/build/consumer AC 22–24: Tasks 12 and 17.
- Immutable artifacts/OIDC/branch AC 25–27: Tasks 14–18.
- Core release AC 28–34: Release Gate B and Phase 9.

## Approval gate

This draft authorizes no code change or publication by itself. After explicit plan approval, create the immutable approved-plan snapshot under `.sdcorejs/plans/angular/`, execute Tasks 1–5, and stop at Release Gate A. After separate authorization and successful datetime verification, execute Tasks 6–18 and stop at Release Gate B. Release Gate A and Release Gate B each require their own later explicit authorization.
