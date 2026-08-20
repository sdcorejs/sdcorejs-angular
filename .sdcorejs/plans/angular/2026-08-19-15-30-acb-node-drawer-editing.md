---
artifact_id: plan-acb-node-drawer-editing-r2
artifact_kind: plan
schema_version: 1
change_ref: acb-node-drawer-editing
source_spec: .sdcorejs/specs/angular/2026-08-19-14-06-acb-node-drawer-editing.md
source_plan: none
commit_policy: with-change
owner: sdcorejs-plan
name: acb-node-drawer-editing
description: "TDD plan: summary row, drawer shell with commit-once, object drill-down, layer rewire dropping the grid, then v20/v21 rollout."
contract_id: acb-node-drawer-editing
requirement_id: acb-node-drawer-editing
approved_at: 2026-08-19T08:30:34.173Z
approved_by: nghiatt15_onemount
approval_source: explicit-user-choice
track: angular
sourceSpecPath: .sdcorejs/specs/angular/2026-08-19-14-06-acb-node-drawer-editing.md
sourceDraftPath: .sdcorejs/docs/angular/2026-08-19-14-12-acb-node-drawer-editing-plan.md
approved_spec_reference: 
  approval_hash: "sha256:v1:cc11deec8ea91560753dafa01021b3ece43c7fb2d4be19c35fe70494d87a850c"
  artifact_id: spec-acb-node-drawer-editing-r1
  repository_id: github.com/sdcorejs/sdcorejs-angular
  repository_relative_path: .sdcorejs/specs/angular/2026-08-19-14-06-acb-node-drawer-editing.md
  revision: a73ac65b0731d794a613326ddd4924497424b3d6
parent_repository_id: github.com/sdcorejs/sdcorejs-angular
parent_references: 
  - 
      approval_hash: "sha256:v1:cc11deec8ea91560753dafa01021b3ece43c7fb2d4be19c35fe70494d87a850c"
      artifact_id: spec-acb-node-drawer-editing-r1
      artifact_kind: spec
      repository_id: github.com/sdcorejs/sdcorejs-angular
      revision: a73ac65b0731d794a613326ddd4924497424b3d6
owner_repository_id: github.com/sdcorejs/sdcorejs-angular
owner_repository_role: library
owner_module_id: api-contract-builder
execution_host_repository_id: github.com/sdcorejs/sdcorejs-angular
integration_owner_repository_id: github.com/sdcorejs/sdcorejs-angular
repository_relative_path: .sdcorejs/plans/angular/2026-08-19-15-30-acb-node-drawer-editing.md
source_revision: a73ac65b0731d794a613326ddd4924497424b3d6
dependency_order: 
  - acb-summary
  - acb-drawer-shell
  - acb-drilldown
  - acb-rewire-layers
  - acb-source-cleanup
  - acb-i18n
  - acb-docs-showcase
  - acb-rollout
gitlink_updates_in_scope: false
task_count: 22
phase_count: 9
target_root_kind: target-project
stack_profile: core-ui-angular
profile_confidence: high
approved_spec_hash: "sha256:v1:cc11deec8ea91560753dafa01021b3ece43c7fb2d4be19c35fe70494d87a850c"
allowed_paths: 
  - versions/v19/projects/sdcorejs-angular/components/api-contract-builder/**
  - versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts
  - versions/v19/projects/sdcorejs-angular/i18n/src/en.ts
  - versions/v19/projects/sdcorejs-angular/i18n/src/ja.ts
  - versions/v19/projects/sdcorejs-angular/i18n/src/ko.ts
  - versions/v19/projects/sdcorejs-angular/i18n/src/zh.ts
  - showcase/src/app/pages/components/api-contract-builder/**
  - showcase/src/app/docs/core/documentation.registry.ts
  - showcase/src/app/docs/core/documentation.registry.spec.ts
  - CHANGELOG.md
  - sandbox/**
  - .sdcorejs/docs/angular/**
  - .sdcorejs/plans/angular/**
prohibited_paths: 
  - versions/v20/**
  - versions/v21/**
  - showcase/src/app/docs/generated/**
  - showcase/projects/**
  - showcase/angular.json
  - showcase/package.json
  - "**/package.json"
  - "**/package-lock.json"
  - published-pages/**
  - published-docs/**
  - .github/**
generated_artifacts: 
  - versions/v20/**
  - versions/v21/**
  - showcase/src/app/docs/generated/**
dependency_changes: 
  approval_required: false
  required: false
env_changes: 
  approval_required: false
  required: false
migration_changes: 
  approval_required: false
  required: false
verification_strategy: 
  commands_planned: 
    - cd versions/v19 && npm run test:ci
    - cd versions/v19 && npm run build
    - cd versions/v19 && npm run check:i18n-parity
    - cd versions/v19 && npm run check:i18n (baseline comparison, not a pass/fail gate)
    - npm run generate:showcase-examples
    - npm run test:showcase-examples
    - cd showcase && npm test (baseline 7 FAILED / 196 SUCCESS)
    - npm run sync
    - npm run check:sync
  package_manager: npm
parallel_allowed: true
finish_tail: 
  branch_ready_final_gate: true
  docs_before_final_branch_ready: true
  no_writes_after_branch_ready: true
  verify_before_done: true
approval_hash: "sha256:v1:efe10524761a43972c85200c202b0a96261bcfd3a41c2b78e134d9db9fce1ae0"
approved_plan_hash: "sha256:v1:efe10524761a43972c85200c202b0a96261bcfd3a41c2b78e134d9db9fce1ae0"
supersedes: .sdcorejs/plans/angular/2026-08-19-14-12-acb-node-drawer-editing.md
change_control: 
  change_reason: "Execution preflight: user approved touching dirty dev-tool files. Scope widened MINIMALLY - only sandbox/** moved to allowed_paths for AC-015; showcase/angular.json and showcase/package.json stay prohibited because no task needs them."
  revision: 2
  supersedes: .sdcorejs/plans/angular/2026-08-19-14-12-acb-node-drawer-editing.md
---

# Biên tập node bằng side-drawer, danh sách thu gọn - Approved Plan

> Snapshot of what the user approved at the `sdcorejs-plan` gate. Do not edit by hand; re-author through `sdcorejs-plan` if the contract changes.

## Approved contract

# Plan - Biên tập node bằng side-drawer, danh sách thu gọn - 2026-08-19 14:12

## Scope

Biên tập node chuyển vào `<sd-side-drawer>` và chốt sổ một lần khi `Lưu`. Danh sách mỗi layer thu về hàng read-only dạng viewed, click để mở drawer. Object drill-down trong cùng drawer kèm breadcrumb. Cây ngoài drawer mất hết control, nên grid bảy cột + container query của hàng node bị bỏ.

Hợp đồng đầy đủ ở approved spec — plan này chỉ nói **how**, thứ tự, và lệnh verify.

## Execution context

- Track: `angular`
- Target root kind: `target-project`
- Stack profile: `core-ui-angular`
- Coverage approach: **TDD** (bắt buộc theo `versions/v19/CLAUDE.md` cho `components/`)
- Parallel candidates: **có, hai unit** — `acb-summary` và `acb-drawer-shell` là hai file mới không giao nhau. Phần còn lại tuần tự vì cùng ghi `api-contract-node-editor.*` và `api-contract-builder.*`.

### Ba sự thật baseline — KHÔNG phải hồi quy do change này

Đo trong ngày, ở `a73ac65b`:

1. `cd versions/v19 && npm run check:i18n` **đã đỏ** cho `api-contract-record-editor.component.ts` (3 hit) và `modules/icon/icon.component.ts` (5 hit). Change này chỉ được phép **không thêm** file mới vào danh sách.
2. `cd showcase && npm test` **đã đỏ** ở mức **7 FAILED / 196 SUCCESS**. Cùng con số ở HEAD sạch. Chỉ được phép không tăng.
3. Lỗi `Error: load failed` từ `modules/permission/.../permission.guard.spec.ts` là log của một ca âm bản có chủ ý; `test:ci` vẫn exit 0.

### Working tree đang bẩn theo HAI loại khác nhau

Đây là điểm phải hỏi user trước khi sửa gì, và nó khác preflight thông thường:

- **Cùng contract trước, chưa commit** — 21 file (`versions/v19`, `showcase`, `CHANGELOG.md`) + 28 file `v20`/`v21` do sync sinh. Contract này sửa **đúng một số file trong đó**, nên phải xây tiếp lên trên, không được checkout về HEAD.
- **Không liên quan** — `sandbox/`, `showcase/projects/`, `showcase/angular.json`, `showcase/package.json`. Đồ dev-tool của phiên, nằm trong `prohibited_paths`.

```yaml
plan_context:
  source: sdcorejs-plan
  contract_id: acb-node-drawer-editing
  requirement_id: acb-node-drawer-editing
  approved_spec_path: .sdcorejs/specs/angular/2026-08-19-14-06-acb-node-drawer-editing.md
  approved_spec_hash: 'sha256:v1:cc11deec8ea91560753dafa01021b3ece43c7fb2d4be19c35fe70494d87a850c'
  approved_spec_reference:
    repository_id: github.com/sdcorejs/sdcorejs-angular
    repository_relative_path: .sdcorejs/specs/angular/2026-08-19-14-06-acb-node-drawer-editing.md
    artifact_id: spec-acb-node-drawer-editing-r1
    revision: a73ac65b0731d794a613326ddd4924497424b3d6
    approval_hash: 'sha256:v1:cc11deec8ea91560753dafa01021b3ece43c7fb2d4be19c35fe70494d87a850c'
  approved_plan_path: .sdcorejs/plans/angular/2026-08-19-14-12-acb-node-drawer-editing.md
  approved_plan_hash: 'sha256:v1:db114b8e8be9325c6921914bd290a4feed2a91754ab56bb806854b59d26b4c91'
  supersedes: null
  target_root: C:\Users\nghiatt15_onemount\Documents\sdcorejs\sdcorejs-angular
  target_root_kind: target-project
  owner_repository_id: github.com/sdcorejs/sdcorejs-angular
  owner_repository_role: library
  owner_module_id: api-contract-builder
  execution_host_repository_id: github.com/sdcorejs/sdcorejs-angular
  integration_owner_repository_id: github.com/sdcorejs/sdcorejs-angular
  dependency_order:
    - acb-summary
    - acb-drawer-shell
    - acb-drilldown
    - acb-rewire-layers
    - acb-source-cleanup
    - acb-i18n
    - acb-docs-showcase
    - acb-rollout
  gitlink_updates_in_scope: false
  track: angular
  stack_profile: core-ui-angular
  task_count: 22
  phase_count: 9
  allowed_paths:
    - versions/v19/projects/sdcorejs-angular/components/api-contract-builder/**
    - versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts
    - versions/v19/projects/sdcorejs-angular/i18n/src/en.ts
    - versions/v19/projects/sdcorejs-angular/i18n/src/ja.ts
    - versions/v19/projects/sdcorejs-angular/i18n/src/ko.ts
    - versions/v19/projects/sdcorejs-angular/i18n/src/zh.ts
    - showcase/src/app/pages/components/api-contract-builder/**
    - showcase/src/app/docs/core/documentation.registry.ts
    - showcase/src/app/docs/core/documentation.registry.spec.ts
    - CHANGELOG.md
    - sandbox/**
    - .sdcorejs/docs/angular/**
    - .sdcorejs/plans/angular/**
  prohibited_paths:
    - versions/v20/**
    - versions/v21/**
    - showcase/src/app/docs/generated/**
    - showcase/projects/**
    - showcase/angular.json
    - showcase/package.json
    - '**/package.json'
    - '**/package-lock.json'
    - published-pages/**
    - published-docs/**
    - .github/**
  generated_artifacts:
    - versions/v20/**
    - versions/v21/**
    - showcase/src/app/docs/generated/**
  docs_artifacts:
    - versions/v19/projects/sdcorejs-angular/components/api-contract-builder/sd-api-contract-builder.md
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
      component_style: Angular 19 standalone, signals-first, OnPush; input()/model()/output()/computed()/linkedSignal(); native control flow; @let caching for signals read 2+ times
      folder_convention: one secondary entry point per component under components/<name>/ with index.ts + ng-package.json + src/; feature-private children under src/components/
      state_convention: signals only; the builder deep-clones the parent contract into #draft and never writes into the parent object
      service_data_access_convention: none by design - the component performs no I/O; the env catalog arrives through SD_API_CONTRACT_CONFIGURATION
      registration_provider_convention: standalone imports array; SD_API_CONTRACT_CONFIGURATION provided at bootstrap, route or component level
      public_api_barrel_convention: components/api-contract-builder/index.ts re-exports src/* explicitly; children under src/components/ are NOT exported
      test_convention: colocated *.spec.ts beside the unit, Karma + Jasmine, ChromeHeadless, driven through a typed internals interface
      evidence_inspected:
        - versions/v19/CLAUDE.md
        - components/api-contract-builder/index.ts
        - components/api-contract-builder/src/components/api-contract-node-editor.component.{ts,html,scss}
        - components/api-contract-builder/src/components/api-contract-record-editor.component.ts
        - components/api-contract-builder/src/components/api-contract-source-editor.component.ts
        - components/api-contract-builder/src/api-contract-builder.component.{ts,html}
        - components/side-drawer/src/side-drawer.component.ts
        - components/side-drawer/sd-side-drawer.md
    component_tree:
      - 'SdApiContractBuilder (existing root; now also owns exactly ONE drawer instance)'
      - '  SdApiContractDiagnosticList (existing, unchanged)'
      - '  SdApiContractRecordEditor (existing; layer for req.path / req.query / req.headers / res.headers)'
      - '    SdApiContractNodeSummary × n (NEW, read-only row)'
      - '  SdApiContractNodeEditor (existing; layer for input.schema / req.body / res.body / output.schema)'
      - '    SdApiContractNodeSummary × n (NEW, read-only row)'
      - '  SdApiContractNodeDrawer (NEW, single instance)'
      - '    sd-side-drawer (existing shared component)'
      - '      node field controls: name, type, required, label, description, temporal transform'
      - '      SdApiContractSourceEditor (existing, MOVED here from the row)'
      - '      child list + breadcrumb, rendered when the staged node is an object'
      - '  SdCodeEditor (existing; step 6 JSON, unchanged)'
    reuse_decisions:
      - need: khung drawer, guard đóng khi bẩn, footer Lưu/Huỷ
        candidate: versions/v19/projects/sdcorejs-angular/components/side-drawer
        decision: reuse
        reason: beforeClose là guard cho draft bẩn, forceClose là nhánh Save thành công, sdFooterRight cho hai nút - không cần dựng gì
      - need: biên tập mapping trong drawer
        candidate: src/components/api-contract-source-editor.component.ts
        decision: reuse
        reason: giữ nguyên hành vi, chỉ đổi chỗ đặt; trong drawer nó rộng nên bỏ được gutter 36px
      - need: hàng thu gọn read-only
        candidate: none
        decision: create_feature_local
        reason: chưa có component nào tóm tắt một node contract; nó có trách nhiệm riêng và được test riêng
      - need: drawer sở hữu draft + drill-down
        candidate: none
        decision: create_feature_local
        reason: staging + ngăn xếp đường dẫn là state thật, không phải wrapper
      - need: badge bắt buộc trên hàng thu gọn
        candidate: versions/v19/projects/sdcorejs-angular/components/badge
        decision: keep_inline
        reason: một span có class là đủ; kéo cả sd-badge vào chỉ để hiện một chữ là thêm phụ thuộc không cần
    file_decisions:
      - path: src/components/api-contract-node-summary.component.ts
        decision: create
        symbols: SdApiContractNodeSummary, mappingSummary
        reason: hàng read-only, phát edit và remove
      - path: src/components/api-contract-node-drawer.component.ts
        decision: create
        symbols: SdApiContractNodeDrawer, draft, path stack, canSave, commit
        reason: chủ sở hữu draft và cổng chặn Save
      - path: src/components/api-contract-node-editor.component.{ts,html,scss}
        decision: edit
        symbols: đổi vai thành danh sách summary + nút thêm; bỏ grid bảy cột và container query
        reason: cây ngoài drawer thành read-only
      - path: src/components/api-contract-record-editor.component.ts
        decision: edit
        symbols: render summary, phát yêu cầu mở drawer
        reason: cùng lý do, cho layer record
      - path: src/api-contract-builder.component.{ts,html}
        decision: edit
        symbols: một instance drawer, applyNodeCommit
        reason: một chủ sở hữu drawer duy nhất, tránh N drawer và N draft
    responsibilities:
      - symbol: SdApiContractNodeSummary
        responsibility: tóm tắt MỘT node ở dạng đọc; không giữ state, không sửa gì
        inputs: name, node, autoId, readonly
        outputs: edit, remove
      - symbol: SdApiContractNodeDrawer
        responsibility: sở hữu draft của một subtree, điều hướng drill-down, chặn Save khi node tự nó sai
        inputs: node, name, siblingNames, allowTransform, suggestions, autoId
        outputs: nodeCommit, sdClosed
      - symbol: SdApiContractBuilder
        responsibility: sở hữu contract đã commit, áp nodeCommit, phát diagnostics - không đổi
        inputs: model, mode, disabled, autoId
        outputs: model, diagnosticsChange, validChange
    state_owners:
      - 'SdApiContractBuilder.#draft - contract đã commit (chủ sở hữu duy nhất)'
      - 'SdApiContractNodeDrawer.#draft + #path - subtree đang biên tập và vị trí drill-down (chủ sở hữu duy nhất khi drawer mở)'
      - 'SdApiContractNodeSummary - không giữ state'
    service_boundaries:
      - symbol: I18nService
        scope: app
      - symbol: SD_API_CONTRACT_CONFIGURATION
        scope: component
    data_flow:
      - 'contract #draft -> layer list -> SdApiContractNodeSummary (đọc)'
      - 'click hàng -> builder mở drawer với clone sâu của node -> drawer #draft'
      - 'drawer #draft -> Lưu -> nodeCommit -> builder áp bằng helper bất biến -> đúng một modelChange -> validate -> diagnostics'
    declarations_and_registration:
      - 'SdApiContractNodeSummary, SdApiContractNodeDrawer -> thêm vào imports của các component cha (feature-private, KHÔNG export ra index.ts)'
      - 'SdSideDrawer -> thêm vào imports của SdApiContractNodeDrawer'
    public_exports:
      - 'không thêm export mới; hai component mới là feature-private'
    tests:
      - 'summary: tóm tắt reference / literal / object count / chưa gán; badge bắt buộc; phát edit và remove; readonly ẩn hành động'
      - 'drawer: Lưu phát đúng một nodeCommit; huỷ khi bẩn đi qua beforeClose; Lưu đi qua forceClose; chặn tên rỗng và tên trùng; drill-down một drawer duy nhất kèm breadcrumb; Lưu ngoài cùng mang cả subtree'
      - 'builder: danh sách không chứa control sửa được nào (AC-012); mode view và disabled không mở drawer; round-trip contract ngoài không đổi'
    decomposition_rationale:
      - 'Hai component mới có trách nhiệm phân biệt rõ: một cái ĐỌC (summary), một cái GHI (drawer). Đó là biên giới thật, không phải wrapper.'
      - 'Một instance drawer do builder sở hữu, không phải mỗi hàng một drawer: chỉ có một draft sống tại một thời điểm, và đó là điều kiện để AC-012 (cây read-only) đúng được.'
      - 'Field controls giữ INLINE trong drawer, không tách thêm component: mỗi cái chỉ là một control cộng một handler.'
      - 'Không thêm facade/store: chủ sở hữu state vẫn là hai signal, mỗi cái một phạm vi rõ.'
  agent_architecture:
    required: false
    not_applicable_reason: Không phải AI-agent track; component không gọi model hay tool nào.
  verification_strategy:
    package_manager: npm
    scripts_detected:
      - 'versions/v19: test:ci, build, check:i18n, check:i18n-parity, lint'
      - 'root: sync, check:sync, generate:showcase-examples, test:showcase-examples'
      - 'showcase: test, build'
    commands_planned:
      - 'cd versions/v19 && npm run test:ci -- cổng tự động cho 14 AC; mang --code-coverage nên threshold karma mới gate'
      - 'cd versions/v19 && npm run build -- typecheck thật của lib qua ng-packagr'
      - 'cd versions/v19 && npm run check:i18n-parity -- sửa 5 catalog thì phải chứng minh còn parity'
      - 'cd versions/v19 && npm run check:i18n -- KHÔNG phải cổng pass/fail (đã đỏ ở baseline); chạy để chứng minh không thêm file mới vào danh sách'
      - 'npm run generate:showcase-examples -- sinh lại example-*.generated.ts sau khi demo đổi'
      - 'npm run test:showcase-examples -- guard index.json khớp documentation.registry'
      - 'cd showcase && npm test -- so với baseline 7 FAILED / 196 SUCCESS, không được tăng số fail'
      - 'npm run sync && npm run check:sync -- rollout v20/v21 và chứng minh không lệch'
    commands_skipped:
      - 'npm run test:check-i18n -- test cho chính script checker, không liên quan change này'
      - 'cd versions/v19 && npm run lint -- không có luật lint nào liên quan; test:ci + build đã là cổng thật'
      - 'npm run build:page -- page chỉ dựng lúc release'
      - 'cd showcase && npm run build -- npm test của showcase đã compile cùng cây source'
    focused_checks:
      - 'ng test với --include cho riêng 4 spec file của api-contract-builder trong vòng TDD'
    broad_checks:
      - 'test:ci toàn suite + build + check:sync trước khi coi là xong'
  parallel_candidates:
    allowed: true
    frozen_contract:
      path: embedded
      hash: 'sha256:v1:cc11deec8ea91560753dafa01021b3ece43c7fb2d4be19c35fe70494d87a850c'
      revision: 1
      derived_from_approved_plan_hash: pending-approval
      supersedes: null
    units:
      - id: acb-summary
        depends_on: []
        allowed_paths:
          - versions/v19/projects/sdcorejs-angular/components/api-contract-builder/src/components/api-contract-node-summary.component.ts
          - versions/v19/projects/sdcorejs-angular/components/api-contract-builder/src/components/api-contract-node-summary.component.spec.ts
        prohibited_paths: [versions/v20/**, versions/v21/**]
        exclusive_resources: []
        result_type: working-tree-diff
        verification_command: "cd versions/v19 && npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='**/api-contract-node-summary.component.spec.ts'"
      - id: acb-drawer-shell
        depends_on: []
        allowed_paths:
          - versions/v19/projects/sdcorejs-angular/components/api-contract-builder/src/components/api-contract-node-drawer.component.ts
          - versions/v19/projects/sdcorejs-angular/components/api-contract-builder/src/components/api-contract-node-drawer.component.spec.ts
        prohibited_paths: [versions/v20/**, versions/v21/**]
        exclusive_resources: []
        result_type: working-tree-diff
        verification_command: "cd versions/v19 && npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='**/api-contract-node-drawer.component.spec.ts'"
    shared_files:
      - 'api-contract-node-editor.component.{ts,html,scss} - một chủ sở hữu, chỉ sửa ở phase rewire'
      - 'api-contract-builder.component.{ts,html,spec.ts} - một chủ sở hữu, chỉ sửa ở phase rewire'
      - 'showcase/src/app/docs/core/documentation.registry.ts - file dùng chung cho mọi doc page'
    conflict_risks:
      - 'Từ phase rewire trở đi mọi task đều ghi vào hai file dùng chung ở trên - buộc tuần tự'
      - 'i18n 5 catalog là 5 file riêng nhưng parity check là toàn cục - sửa trong một task'
  repository_plan:
    schema_version: 1
    integration_owner_repository_id: github.com/sdcorejs/sdcorejs-angular
    gitlink_updates_in_scope: false
    dependency_order:
      - acb-summary
      - acb-drawer-shell
      - acb-drilldown
      - acb-rewire-layers
      - acb-source-cleanup
      - acb-i18n
      - acb-docs-showcase
      - acb-rollout
    repositories:
      - repository_id: github.com/sdcorejs/sdcorejs-angular
        role: library
        module_id: api-contract-builder
        plan_artifact_id: plan-acb-node-drawer-editing-r1
    steps:
      - id: preflight
        action: VERIFY
        semantic_scope: repository
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        git_roots: [github.com/sdcorejs/sdcorejs-angular]
        allowed_paths: []
        prohibited_paths: []
        depends_on: []
      - id: acb-summary
        action: CREATE
        semantic_scope: module
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        git_roots: [github.com/sdcorejs/sdcorejs-angular]
        allowed_paths: [versions/v19/projects/sdcorejs-angular/components/api-contract-builder/**]
        prohibited_paths: [versions/v20/**, versions/v21/**]
        depends_on: [preflight]
      - id: acb-drawer-shell
        action: CREATE
        semantic_scope: module
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        git_roots: [github.com/sdcorejs/sdcorejs-angular]
        allowed_paths: [versions/v19/projects/sdcorejs-angular/components/api-contract-builder/**]
        prohibited_paths: [versions/v20/**, versions/v21/**]
        depends_on: [preflight]
      - id: acb-drilldown
        action: EDIT
        semantic_scope: module
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        git_roots: [github.com/sdcorejs/sdcorejs-angular]
        allowed_paths: [versions/v19/projects/sdcorejs-angular/components/api-contract-builder/**]
        prohibited_paths: [versions/v20/**, versions/v21/**]
        depends_on: [acb-drawer-shell]
      - id: acb-rewire-layers
        action: EDIT
        semantic_scope: module
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        git_roots: [github.com/sdcorejs/sdcorejs-angular]
        allowed_paths: [versions/v19/projects/sdcorejs-angular/components/api-contract-builder/**]
        prohibited_paths: [versions/v20/**, versions/v21/**]
        depends_on: [acb-summary, acb-drilldown]
      - id: acb-source-cleanup
        action: EDIT
        semantic_scope: module
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        git_roots: [github.com/sdcorejs/sdcorejs-angular]
        allowed_paths: [versions/v19/projects/sdcorejs-angular/components/api-contract-builder/**]
        prohibited_paths: [versions/v20/**, versions/v21/**]
        depends_on: [acb-rewire-layers]
      - id: acb-i18n
        action: EDIT
        semantic_scope: module
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        git_roots: [github.com/sdcorejs/sdcorejs-angular]
        allowed_paths: [versions/v19/projects/sdcorejs-angular/i18n/src/**]
        prohibited_paths: [versions/v20/**, versions/v21/**]
        depends_on: [acb-drawer-shell]
      - id: acb-docs-showcase
        action: EDIT
        semantic_scope: repository
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        git_roots: [github.com/sdcorejs/sdcorejs-angular]
        allowed_paths:
          - versions/v19/projects/sdcorejs-angular/components/api-contract-builder/sd-api-contract-builder.md
          - showcase/src/app/pages/components/api-contract-builder/**
          - showcase/src/app/docs/core/documentation.registry.ts
          - showcase/src/app/docs/core/documentation.registry.spec.ts
          - CHANGELOG.md
        prohibited_paths: [showcase/src/app/docs/generated/**]
        depends_on: [acb-source-cleanup, acb-i18n]
      - id: acb-rollout
        action: VERIFY
        semantic_scope: repository
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        git_roots: [github.com/sdcorejs/sdcorejs-angular]
        allowed_paths: []
        prohibited_paths: [versions/v20/**, versions/v21/**]
        depends_on: [acb-docs-showcase]
  finish_tail:
    docs_before_final_branch_ready: true
    verify_before_done: true
    branch_ready_final_gate: true
    no_writes_after_branch_ready: true
  approval:
    approved: true
    approved_at: 2026-08-19T07:14:00.000Z
  change_control:
    revision: 2
    supersedes: .sdcorejs/plans/angular/2026-08-19-14-12-acb-node-drawer-editing.md
    change_reason: User approved touching dirty dev-tool files at the execution preflight. Scope widened MINIMALLY - only sandbox/** moves to allowed_paths, because AC-015 is verified by opening the sandbox. showcase/angular.json and showcase/package.json stay prohibited: no task needs them.
```

## Tasks

### Phase 0 - Preflight

1. **VERIFY** working tree + write scope — `git status --short`, staged/unstaged diffstat, untracked, branch, HEAD, đối chiếu `allowed_paths` / `prohibited_paths`.
   **Phải phân biệt hai loại bẩn** (xem "Execution context" ở trên) và hỏi user, vì contract này sửa đúng một số file mà contract trước đã sửa và chưa commit:
   `1.` chỉ sửa file trong scope plan, xây tiếp lên công việc chưa commit · `2.` cho phép chạm thêm một số file dirty đã chọn · `3.` dừng để user commit hoặc stash trước.
   Ghi lại baseline `check:i18n` đỏ 2 file và showcase 7 FAILED / 196 SUCCESS để cuối phiên so sánh, **không** coi là hồi quy.

### Phase 1 - Hàng thu gọn (RED → GREEN)

2. **CREATE** `…/src/components/api-contract-node-summary.component.spec.ts` — RED cho AC-006 / AC-007: tóm tắt `← input.keyword` cho reference, `= "v2"` cho literal, `4 trường` cho object bốn con, `chưa gán` khi không có `source` lẫn `value`; badge bắt buộc chỉ khi `required === true`; phát `edit` và `remove`; `readonly` ẩn hành động.
3. **CREATE** `…/src/components/api-contract-node-summary.component.ts` — GREEN: component read-only, `mappingSummary` computed dùng `parseSdApiContractTemplate` để phân biệt reference với template ghép, `autoId` cho hàng và cho nút xoá.

### Phase 2 - Khung drawer + chốt sổ (RED → GREEN)

4. **CREATE** `…/src/components/api-contract-node-drawer.component.spec.ts` — RED cho AC-001 / AC-002 / AC-003 / AC-004 / AC-010: mở với form trống không emit; `Lưu` phát đúng một `nodeCommit`; đóng khi bẩn đi qua `beforeClose`; `Lưu` đi qua `forceClose()`; tên rỗng và tên trùng làm `Lưu` disabled và không emit.
5. **CREATE** `…/src/components/api-contract-node-drawer.component.ts` — GREEN: bọc `<sd-side-drawer>`, `#draft` là clone sâu của node vào, field controls + `<sd-api-contract-source-editor>`, footer `Lưu`/`Huỷ` ở `[sdFooterRight]`, `canSave` computed, `beforeClose` so draft với seed.

### Phase 3 - Drill-down trong cùng drawer (RED → GREEN)

6. **EDIT** drawer spec — RED cho AC-008 / AC-009: node `object` liệt kê con; click con thì drill-down trong cùng drawer kèm breadcrumb; **đúng một** `sd-side-drawer` trong DOM; sửa con rồi `Lưu` ngoài cùng phát một `nodeCommit` mang cả subtree.
7. **EDIT** drawer component — GREEN: `#path` là ngăn xếp pointer vào `#draft`, breadcrumb dựng từ `#path`, `enter(child)` / `back(index)`, `Lưu` luôn commit từ gốc `#draft`.

### Phase 4 - Rewire các layer (RED → GREEN)

8. **EDIT** `…/src/api-contract-builder.component.spec.ts` — RED cho AC-005 / AC-011 / AC-012 / AC-013 / AC-014: click hàng mở drawer seed đúng giá trị; `Lưu` node có reference sai vẫn thành công và vẫn báo `mapping.reference.missing`; danh sách không có `sd-input` / `sd-select` / `sd-code-editor`; `mode="view"` và `disabled` không mở drawer và không render nút thêm/xoá; round-trip contract ngoài không đổi.
9. **EDIT** `…/src/components/api-contract-node-editor.component.{ts,html,scss}` — GREEN: đổi vai thành danh sách summary + nút thêm; **xoá** grid bảy cột, container query, và mọi field control; giữ đệ quy chỉ ở mức dữ liệu nếu còn cần cho `items` của array.
10. **EDIT** `…/src/components/api-contract-record-editor.component.ts` — GREEN: render `<sd-api-contract-node-summary>` cho từng entry, phát yêu cầu mở drawer thay vì render node editor.
11. **EDIT** `…/src/api-contract-builder.component.{ts,html}` — GREEN: một instance `<sd-api-contract-node-drawer>` do builder sở hữu, `openNodeDrawer(pointer)` và `applyNodeCommit(node)` áp bằng helper bất biến đang có.

### Phase 5 - Dọn source editor

12. **EDIT** `…/src/components/api-contract-source-editor.component.ts` — bỏ `.sd-acb-source__gutter` và các ràng buộc bề rộng của hàng; trong drawer nó là một cột dọc. Hành vi mode/mapping **không đổi**.
13. **EDIT** `…/src/components/api-contract-source-editor.component.spec.ts` — bỏ assertion về gutter và về việc thẳng cột với hàng grid; giữ toàn bộ assertion về mode, dropdown nguồn, control tĩnh.

### Phase 6 - i18n

14. **EDIT** `versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts` — thêm 8 key: `drawer.add-title`, `drawer.edit-title`, `drawer.save`, `drawer.cancel`, `drawer.discard-confirm`, `summary.unmapped`, `summary.field-count`, `node.name-required`.
15. **EDIT** `i18n/src/{en,ja,ko,zh}.ts` — cùng 8 key, giữ parity. Xoá key nào không còn dùng sau rewire (kiểm bằng grep, không đoán).

### Phase 7 - Docs + showcase

16. **EDIT** `…/sd-api-contract-builder.md` — mô hình biên tập mới, bảng hàng thu gọn, thời điểm validate, ghi rõ guarantee "một emit mỗi hành động" vẫn đúng với `Lưu` là hành động.
17. **EDIT** showcase demo — section cho luồng drawer: thêm mới, sửa, drill-down object, chặn Save khi tên trùng.
18. **EDIT** `showcase/src/app/docs/core/documentation.registry.ts` — `demoSectionCount` theo số section thật.
19. **EDIT** `showcase/src/app/docs/core/documentation.registry.spec.ts` — bump tổng theo delta.
20. **VERIFY-THEN-EDIT** `showcase/src/app/docs/generated/example-*.generated.ts` — sinh lại bằng `npm run generate:showcase-examples`. **Không sửa tay.**
21. **EDIT** `CHANGELOG.md` — cập nhật entry `## [Unreleased]` của component: mô hình biên tập mới thay cho phần layout hàng đã ghi trước đó trong cùng entry.

### Phase 8 - Verify + rollout

22. **VERIFY** theo thứ tự, dừng ở lỗi đầu tiên:
    - `cd versions/v19 && npm run test:ci`
    - `cd versions/v19 && npm run build`
    - `cd versions/v19 && npm run check:i18n-parity`
    - `cd versions/v19 && npm run check:i18n` — so với baseline 2 file, **không** được thêm file mới
    - `npm run generate:showcase-examples` rồi `npm run test:showcase-examples`
    - `cd showcase && npm test` — so với baseline 7 FAILED / 196 SUCCESS, không được tăng
    - `npm run sync` rồi `npm run check:sync`
    - Manual AC-015: mở sandbox, kiểm một layer mười trường đọc được trong một màn hình và drawer đủ rộng cho node lồng ba cấp
    - Manual AC-016: quét mojibake trên toàn bộ prose tiếng Việt đã sửa

## Acceptance mapping

| AC | Tasks |
| --- | --- |
| AC-001 mở drawer không emit | 4, 5 |
| AC-002 Lưu phát đúng một modelChange | 4, 5, 11 |
| AC-003 đóng khi bẩn đi qua beforeClose | 4, 5 |
| AC-004 Lưu đi qua forceClose | 4, 5 |
| AC-005 click hàng mở drawer đã seed | 8, 10, 11 |
| AC-006 tóm tắt mapping đúng 4 dạng | 2, 3 |
| AC-007 badge bắt buộc | 2, 3 |
| AC-008 drill-down một drawer + breadcrumb | 6, 7 |
| AC-009 Lưu ngoài cùng mang cả subtree | 6, 7 |
| AC-010 chặn tên rỗng và tên trùng | 4, 5 |
| AC-011 reference sai vẫn Lưu được | 8, 11 |
| AC-012 danh sách không có control sửa được | 8, 9, 10 |
| AC-013 view / disabled không mở drawer | 8, 9, 10, 11 |
| AC-014 round-trip contract ngoài | 8, 11 |
| AC-015 *(manual)* đọc được trong một màn hình | 9, 10, 22 |
| AC-016 *(manual)* mojibake sạch | 14, 15, 16, 17, 22 |

## Verification

- `cd versions/v19 && npm run test:ci`
- `cd versions/v19 && npm run build`
- `cd versions/v19 && npm run check:i18n-parity`
- `cd versions/v19 && npm run check:i18n` — so baseline, không phải cổng pass/fail
- `npm run generate:showcase-examples` · `npm run test:showcase-examples`
- `cd showcase && npm test` — so baseline 7 FAILED / 196 SUCCESS
- `npm run sync` · `npm run check:sync`
- Manual: đọc được trong một màn hình (AC-015); quét mojibake (AC-016)

Trong vòng TDD, chạy hẹp cho nhanh:
`cd versions/v19 && npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='**/api-contract-node-summary.component.spec.ts' --include='**/api-contract-node-drawer.component.spec.ts' --include='**/api-contract-builder.component.spec.ts' --include='**/api-contract-source-editor.component.spec.ts'`


## Decisions captured during review

- Builder sở hữu ĐÚNG MỘT instance drawer, không phải mỗi hàng một drawer. Đó là điều kiện để AC-012 (cây ngoài drawer read-only) đúng được: chỉ một draft sống tại một thời điểm.
- check:i18n được xử lý là SO SÁNH BASELINE, không phải cổng pass/fail, vì nó đã đỏ ở a73ac65b cho api-contract-record-editor.component.ts (3 hit) và modules/icon/icon.component.ts (5 hit). Điều kiện đạt: không thêm file mới vào danh sách.
- Showcase suite cũng là so sánh baseline ở mức 7 FAILED / 196 SUCCESS, đã đo bằng cách restore 5 file showcase về HEAD rồi chạy lại.
- Song song được chấp nhận cho hai unit acb-summary và acb-drawer-shell (hai file mới, không giao nhau). Từ phase rewire trở đi buộc tuần tự vì cùng ghi api-contract-node-editor và api-contract-builder.
- Preflight phải phân biệt HAI loại dirty: công việc chưa commit của contract trước (acb-source-row-simplify, cùng một số file — phải xây tiếp lên trên, KHÔNG checkout về HEAD) và đồ dev-tool không liên quan (sandbox/, showcase/projects/, hai file showcase/ — nằm trong prohibited_paths).
- derived_from_approved_plan_hash để pending-approval trong body vì nó tự tham chiếu chính hash của plan này; giá trị thật nằm ở frontmatter.
- Duyệt nguyên trạng bản draft, không sửa step nào trong lúc review.

## Skill provenance

sdcorejs-plan (revision 2, approved at the execution preflight)
