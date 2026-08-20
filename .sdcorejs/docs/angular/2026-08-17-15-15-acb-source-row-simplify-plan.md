# Plan - Đơn giản hoá hàng Nguồn giá trị + copy/paste JSON - 2026-08-17 15:15

## Scope

Hàng `Nguồn giá trị` của `<sd-api-contract-builder>` đổi thành: `Lấy từ nguồn` = **một** dropdown, `Giá trị tĩnh` = control khớp type, `Nâng cao` = ô biểu thức thô cho template ghép. Hàng mapping được căn thẳng cột với các hàng grid. Step 6 thành editor JSON đọc-ghi để copy/paste, tự format.

Contract đầy đủ ở approved spec — plan này chỉ nói **how**, thứ tự, và lệnh verify.

## Execution context

- Track: `angular`
- Target root kind: `target-project`
- Stack profile: `core-ui-angular`
- Coverage approach: **TDD** (bắt buộc theo `versions/v19/CLAUDE.md` cho `components/`)
- Parallel candidates: **không** — cả ba slice logic đều sửa cùng một file `api-contract-source-editor.component.ts`, ghi song song là xung đột chắc chắn.

### Delta so với approved spec (plan preflight phát hiện)

Spec liệt kê file thiếu ba mắt xích của showcase. Bổ sung vào plan, **không** mở rộng scope hành vi:

1. Thêm section demo làm lệch `demoSectionCount: 6` trong `showcase/src/app/docs/core/documentation.registry.ts`.
2. `documentation.registry.spec.ts:27` khoá **tổng** `demoSectionCount` = `335`; và `:51` khẳng định `page.examples` có size bằng `demoSectionCount`.
3. `page.examples` đọc từ `showcase/src/app/docs/generated/example-*.generated.ts` — file **committed**, sinh bằng `npm run generate:showcase-examples`. Không sửa tay.

Lệnh verify cũng chỉnh: dùng `npm run test:ci` của `versions/v19` (đã mang `--code-coverage`) thay cho `npx ng test …` viết trong spec. Không có cờ đó thì threshold trong `karma.conf.js` (statements 78 / branches 67 / functions 75 / lines 78) **không** được đánh giá.

```yaml
plan_context:
  source: sdcorejs-plan
  contract_id: acb-source-row-simplify
  requirement_id: acb-source-row-simplify
  approved_spec_path: .sdcorejs/specs/angular/2026-08-17-14-59-acb-source-row-simplify.md
  approved_spec_hash: 'sha256:v1:decedf65e42b700239784544b52159fd2dcd8b3be42156f27d422d7d02e2a462'
  approved_spec_reference:
    repository_id: github.com/sdcorejs/sdcorejs-angular
    repository_relative_path: .sdcorejs/specs/angular/2026-08-17-14-59-acb-source-row-simplify.md
    artifact_id: spec-acb-source-row-simplify-r1
    revision: a73ac65b0731d794a613326ddd4924497424b3d6
    approval_hash: 'sha256:v1:decedf65e42b700239784544b52159fd2dcd8b3be42156f27d422d7d02e2a462'
  approved_plan_path: .sdcorejs/plans/angular/2026-08-17-15-15-acb-source-row-simplify.md
  approved_plan_hash: 'sha256:v1:76ef18b2e1750ef33dce763b81a452786a69e0889360fb8d97e5bfda48d68645'
  supersedes: null
  target_root: C:\Users\nghiatt15_onemount\Documents\sdcorejs\sdcorejs-angular
  target_root_kind: target-project
  owner_repository_id: github.com/sdcorejs/sdcorejs-angular
  owner_repository_role: library
  owner_module_id: api-contract-builder
  execution_host_repository_id: github.com/sdcorejs/sdcorejs-angular
  integration_owner_repository_id: github.com/sdcorejs/sdcorejs-angular
  dependency_order:
    - acb-source-editor
    - acb-builder-paste
    - acb-i18n
    - acb-docs-showcase
    - acb-rollout
  gitlink_updates_in_scope: false
  track: angular
  stack_profile: core-ui-angular
  task_count: 20
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
    - .sdcorejs/docs/angular/**
    - .sdcorejs/plans/angular/**
  prohibited_paths:
    - versions/v20/**
    - versions/v21/**
    - showcase/src/app/docs/generated/**
    - sandbox/**
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
      component_style: Angular 19 standalone, signals-first, OnPush, input()/model()/output()/computed(); native control flow; @let caching for signals read 2+ times
      folder_convention: one secondary entry point per component - components/<name>/{index.ts,ng-package.json,src/}; feature-private children under src/components/
      state_convention: signal()/computed() only; builder holds a deep-cloned #draft and never writes into the parent object
      service_data_access_convention: none - the component performs no I/O by design; env catalog arrives through SD_API_CONTRACT_CONFIGURATION
      registration_provider_convention: standalone imports array; SD_API_CONTRACT_CONFIGURATION provided at bootstrap/route/component
      public_api_barrel_convention: components/api-contract-builder/index.ts re-exports src/* explicitly; feature-private children are NOT exported
      test_convention: colocated *.spec.ts beside the unit, Karma + Jasmine, ChromeHeadless
      evidence_inspected:
        - versions/v19/CLAUDE.md
        - components/api-contract-builder/index.ts
        - src/components/api-contract-source-editor.component.ts
        - src/components/api-contract-node-editor.component.{ts,html,scss}
        - src/api-contract-builder.component.{ts,html}
        - src/api-contract.expression.ts
        - forms/{input,input-number,date,datetime,select}/src/*.component.ts
        - components/code-editor/src/code-editor.component.ts
    component_tree:
      - 'SdApiContractBuilder (existing root, unchanged)'
      - '  SdApiContractDiagnosticList (existing, unchanged)'
      - '  SdApiContractRecordEditor (existing, unchanged)'
      - '    SdApiContractNodeEditor (existing; recursive via ng-template, unchanged)'
      - '      SdApiContractSourceEditor (existing - THE ONLY component whose internals change)'
      - '  SdCodeEditor (existing shared; step 6 flips from viewed to editable)'
    reuse_decisions:
      - need: chọn nguồn bằng một control
        candidate: versions/v19/projects/sdcorejs-angular/forms/select
        decision: reuse
        reason: SdSelect đã dùng cho mode picker trong cùng hàng; suggestionOptions() đã sẵn items
      - need: nhập số tĩnh
        candidate: versions/v19/projects/sdcorejs-angular/forms/input-number
        decision: reuse
        reason: thay `<sd-input type="number">` bằng control số thật, có parse/format riêng
      - need: nhập date / datetime tĩnh
        candidate: versions/v19/projects/sdcorejs-angular/forms/{date,datetime}
        decision: reuse
        reason: entry point sẵn có trong cùng lib, `sdChange` + `[model]` khớp pattern đang dùng
      - need: nhập literal object/array tĩnh
        candidate: versions/v19/projects/sdcorejs-angular/components/code-editor
        decision: reuse
        reason: đã JSON.parse chiều vào và JSON.stringify(...,null,2) chiều ra; builder đã import sẵn
      - need: copy/paste toàn bộ contract JSON
        candidate: components/code-editor (instance step 6 đang có)
        decision: extend
        reason: bỏ [viewed]="true" và bắt modelChange; nút Copy đã có trong component
      - need: control tĩnh theo type
        candidate: none
        decision: keep_inline
        reason: '@switch trong SdApiContractSourceEditor; tách child mỗi control là wrapper vô nghĩa và nhân số lần emit - đúng cái bẫy node editor đã tránh bằng ng-template'
    file_decisions:
      - path: src/components/api-contract-source-editor.component.ts
        decision: edit
        symbols: SdApiContractValueMode, mode, modeOptions, sourceOptions, setMode, setSource, setStaticScalar, setStaticJson
        reason: toàn bộ thay đổi hành vi của hàng nằm ở đây
      - path: src/components/api-contract-source-editor.component.spec.ts
        decision: create
        symbols: specs cho AC-001..AC-007
        reason: component này chưa có spec riêng, chỉ được test gián tiếp qua builder
      - path: src/api-contract-builder.component.{ts,html}
        decision: edit
        symbols: applyPastedJson, json
        reason: chiều dán JSON vào ở step 6
    responsibilities:
      - symbol: SdApiContractSourceEditor
        responsibility: sở hữu duy nhất việc chọn mode và biên tập source/value của MỘT node
        inputs: node, suggestions, disabled, autoId
        outputs: nodeChange (đúng một lần mỗi hành động người dùng)
      - symbol: SdApiContractBuilder
        responsibility: sở hữu draft contract, validate, phát diagnostics; nay thêm nạp contract từ JSON dán vào
        inputs: model, mode, disabled, autoId
        outputs: model, diagnosticsChange, validChange
    state_owners:
      - 'SdApiContractBuilder.#draft - bản nháp contract (chủ sở hữu duy nhất)'
      - 'SdApiContractSourceEditor - không giữ state của contract; mode suy ra từ node.source/node.value'
    service_boundaries:
      - symbol: I18nService
        scope: app
      - symbol: SD_API_CONTRACT_CONFIGURATION
        scope: component
    data_flow:
      - 'node (input) -> mode computed qua parseSdApiContractTemplate -> template nhánh theo mode -> nodeChange -> node editor -> builder #draft -> validate -> diagnostics'
      - 'step 6: #draft -> serializeSdApiContract -> string vào SdCodeEditor; modelChange -> parse/guard -> #draft -> validate'
    declarations_and_registration:
      - 'SdInputNumber, SdDate, SdDatetime, SdCodeEditor -> thêm vào imports của SdApiContractSourceEditor (feature-private, KHÔNG export ra index.ts)'
      - 'SdApiContractValueMode -> giữ nguyên mức export hiện tại của source editor'
    public_exports:
      - 'không thêm export mới - SdApiContractValueMode đã có sẵn; children vẫn feature-private'
    tests:
      - 'source editor: suy mode theo kind (exact/interpolated/literal), một dropdown ở mode source, ghi đè không nối chuỗi, control đúng theo type, guard JSON dở'
      - 'builder: paste hợp lệ thay contract + re-format, paste sai giữ nguyên + contract.invalid, paste verbatim không tự thêm trường'
    decomposition_rationale:
      - 'Biên giới đúng đã tồn tại: source editor sở hữu hàng giá trị. Thay đổi nằm trong nó, không sinh component mới.'
      - 'Control tĩnh giữ inline vì mỗi nhánh chỉ là một control + một handler; tách ra là wrapper thuần.'
      - 'Không thêm facade/store: không có state nào cần chủ sở hữu mới, #draft vẫn là chủ duy nhất.'
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
      - 'cd versions/v19 && npm run test:ci -- chứng minh 12 AC tự động; mang --code-coverage nên threshold karma mới gate'
      - 'cd versions/v19 && npm run build -- typecheck thật của lib qua ng-packagr'
      - 'cd versions/v19 && npm run check:i18n && npm run check:i18n-parity -- sửa 5 catalog thì phải chứng minh còn parity'
      - 'npm run generate:showcase-examples -- sinh lại example-*.generated.ts sau khi demo đổi'
      - 'npm run test:showcase-examples -- guard index.json khớp documentation.registry'
      - 'cd showcase && npm test -- documentation.registry.spec.ts khoá demoSectionCount và tổng 335'
      - 'npm run sync && npm run check:sync -- rollout v20/v21 và chứng minh không lệch'
    commands_skipped:
      - 'npm run test:check-i18n -- test cho chính script checker, không phải cho thay đổi này'
      - 'cd versions/v19 && npm run lint -- không có luật lint nào liên quan tới thay đổi này; test:ci + build đã là cổng thật'
      - 'npm run build:page -- page chỉ dựng lúc release, không phải mỗi change'
      - 'cd showcase && npm run build -- test:ci của showcase đã compile cùng cây source; build lại tốn ~2 phút mà không thêm bằng chứng'
    focused_checks:
      - 'ng test với --include cho riêng 2 spec file trong lúc vòng TDD chạy'
    broad_checks:
      - 'test:ci toàn suite + build + check:sync trước khi coi là xong'
  parallel_candidates:
    allowed: false
    frozen_contract: null
    units: []
    shared_files:
      - 'src/components/api-contract-source-editor.component.ts - một chủ sở hữu, sửa tuần tự qua 3 slice'
      - 'src/components/api-contract-source-editor.component.spec.ts - cùng chủ sở hữu với file trên'
      - 'showcase/src/app/docs/core/documentation.registry.ts - shared, coordination-risk'
    conflict_risks:
      - 'Ba slice logic cùng ghi một file component - buộc tuần tự'
      - 'documentation.registry.ts và spec của nó là file dùng chung cho mọi doc page'
  repository_plan:
    schema_version: 1
    integration_owner_repository_id: github.com/sdcorejs/sdcorejs-angular
    gitlink_updates_in_scope: false
    dependency_order:
      - acb-source-editor
      - acb-builder-paste
      - acb-i18n
      - acb-docs-showcase
      - acb-rollout
    repositories:
      - repository_id: github.com/sdcorejs/sdcorejs-angular
        role: library
        module_id: api-contract-builder
        plan_artifact_id: plan-acb-source-row-simplify-r1
    steps:
      - id: preflight
        action: VERIFY
        semantic_scope: repository
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        git_roots: [github.com/sdcorejs/sdcorejs-angular]
        allowed_paths: []
        prohibited_paths: []
        depends_on: []
      - id: acb-source-editor
        action: CREATE
        semantic_scope: module
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        git_roots: [github.com/sdcorejs/sdcorejs-angular]
        allowed_paths: [versions/v19/projects/sdcorejs-angular/components/api-contract-builder/**]
        prohibited_paths: [versions/v20/**, versions/v21/**]
        depends_on: [preflight]
      - id: acb-builder-paste
        action: EDIT
        semantic_scope: module
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        git_roots: [github.com/sdcorejs/sdcorejs-angular]
        allowed_paths: [versions/v19/projects/sdcorejs-angular/components/api-contract-builder/**]
        prohibited_paths: [versions/v20/**, versions/v21/**]
        depends_on: [acb-source-editor]
      - id: acb-i18n
        action: EDIT
        semantic_scope: module
        owner_repository_id: github.com/sdcorejs/sdcorejs-angular
        git_roots: [github.com/sdcorejs/sdcorejs-angular]
        allowed_paths: [versions/v19/projects/sdcorejs-angular/i18n/src/**]
        prohibited_paths: [versions/v20/**, versions/v21/**]
        depends_on: [acb-source-editor]
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
        depends_on: [acb-builder-paste, acb-i18n]
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
    approved_at: 2026-08-17T08:17:17.286Z
  change_control:
    revision: 1
    supersedes: null
    change_reason: null
```

## Tasks

### Phase 0 - Preflight

1. **VERIFY** working tree + write scope — `git status --short`, staged/unstaged diffstat, untracked, branch, HEAD, đối chiếu `allowed_paths` / `prohibited_paths`, guard `target_root_kind`.
   **Đã biết trước là dirty và KHÔNG thuộc contract này:** `showcase/angular.json`, `showcase/package.json`, `showcase/projects/`, `sandbox/` (workspace sandbox dựng hôm nay). Hỏi user 3 lựa chọn trước khi sửa gì:
   `1.` chỉ sửa file trong scope plan · `2.` cho phép chạm một số file dirty đã chọn · `3.` dừng để user clean/stash.

### Phase 1 - Slice A: mode `advanced` + suy mode (RED → GREEN)

2. **CREATE** `versions/v19/…/api-contract-builder/src/components/api-contract-source-editor.component.spec.ts` — RED cho AC-003 / AC-004 / AC-005: `${input.keyword}` → mode `source`; `Bearer ${env.token}` → mode `advanced` giữ nguyên chuỗi; `${input.khongTonTai}` → vẫn `source`.
3. **EDIT** `…/src/components/api-contract-source-editor.component.ts` — GREEN: `SdApiContractValueMode` thêm `'advanced'`; `mode` computed dùng `parseSdApiContractTemplate(node.source).kind`; `#scalarModes` / `#objectModes` / `#arrayModes` thêm mục `advanced`; nhánh template `advanced` giữ `<sd-input>` biểu thức thô (autoId `-advanced`).

### Phase 2 - Slice B: một dropdown nguồn (RED → GREEN)

4. **EDIT** spec source editor — RED cho AC-001 / AC-002: mode `source` render đúng một `<sd-select>`, không còn `<sd-input>` biểu thức và không còn select `Chèn tham chiếu`; chọn một mục ghi đè `node.source` và phát đúng một `nodeChange`.
5. **EDIT** `…/api-contract-source-editor.component.ts` — GREEN: xoá nhánh `<sd-input>` expression + select insert + `insertReference()` + `insertToken`; thêm `<sd-select>` nguồn (`valueField="expression"`, `displayField="display"`, autoId `-source`); thêm option "phantom" dựng từ `node.source` khi path không có trong `suggestionOptions()` để không tự xoá giá trị đang lưu.

### Phase 3 - Slice C: control tĩnh theo type (RED → GREEN)

6. **EDIT** spec source editor — RED cho AC-006 / AC-007: `@switch` theo type render đúng control; static `object` nhận JSON hợp lệ ghi object đã parse, JSON dở **không** ghi gì.
7. **EDIT** `…/api-contract-source-editor.component.ts` — GREEN: `@switch (_node.type)` → `sd-input` / `sd-input-number` / `sd-select` / `sd-date` / `sd-datetime` / `sd-code-editor language="json"`; mở `static` cho `object` + `array` trong `modeOptions`; `setStaticJson()` bỏ qua khi editor bắn ra `string`; thêm 4 import vào `imports`; mọi control `size="sm" hideInlineError` + autoId; `// why:` cho guard JSON dở.

### Phase 4 - Slice D: căn hàng

8. **EDIT** `…/api-contract-source-editor.component.ts` — thêm ô giữ chỗ 36px cuối `.sd-acb-source` (cùng idiom `.sd-acb-node__remove`) trong `styles` inline, để hàng mapping dừng thẳng cột với hàng grid.

### Phase 5 - Slice E: copy/paste JSON step 6 (RED → GREEN)

9. **EDIT** `…/src/api-contract-builder.component.spec.ts` — RED cho AC-008 / AC-009 / AC-010: paste hợp lệ thay contract + phát lại diagnostics + text format 2 space; paste sai cú pháp giữ nguyên contract + `contract.invalid`; paste contract thiếu trường nạp verbatim không tự thêm.
10. **EDIT** `…/src/api-contract-builder.component.ts` — GREEN: `applyPastedJson(value: unknown)` — object thì đi đúng luồng nạp contract ngoài đang có (clone → validate → emit), string thì giữ draft và phát `contract.invalid`.
11. **EDIT** `…/src/api-contract-builder.component.html` — bỏ `[viewed]="true"` ở editor step 6, bắt `(modelChange)="applyPastedJson($event)"`, giữ `[model]="json()"` là string để không mất thứ tự key của serializer.

### Phase 6 - i18n

12. **EDIT** `versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts` — thêm `…mapping.mode.advanced` = `Nâng cao`, `…review.paste-invalid` = `JSON không hợp lệ, contract giữ nguyên`; xoá `…mapping.insert`.
13. **EDIT** `i18n/src/{en,ja,ko,zh}.ts` — cùng 2 key thêm, cùng 1 key xoá, giữ parity.

### Phase 7 - Docs + showcase

14. **EDIT** `…/api-contract-builder/sd-api-contract-builder.md` — bảng mode (thêm `advanced`), bảng control static theo type, mục copy/paste JSON, cập nhật known limitations.
15. **EDIT** `showcase/src/app/pages/components/api-contract-builder/api-contract-builder-demo.component.ts` — thêm section cho 3 mode, section static theo type, section paste JSON; mỗi `<demo-section>` có `heading` + `[props]` badge có `value`.
16. **EDIT** `showcase/src/app/docs/core/documentation.registry.ts` — bump `demoSectionCount` của `api-contract-builder` theo số section thật.
17. **EDIT** `showcase/src/app/docs/core/documentation.registry.spec.ts` — bump tổng `335` ở dòng 27 theo delta.
18. **VERIFY-THEN-EDIT** `showcase/src/app/docs/generated/example-*.generated.ts` — sinh lại bằng `npm run generate:showcase-examples`. **Không sửa tay.**
19. **EDIT** `CHANGELOG.md` — entry dưới `## [Unreleased]`; ghi rõ xoá key i18n `mapping.insert` là breaking cho ai override catalog.

### Phase 8 - Verify + rollout

20. **VERIFY** theo thứ tự, dừng ở lỗi đầu tiên:
    - `cd versions/v19 && npm run test:ci`
    - `cd versions/v19 && npm run build`
    - `cd versions/v19 && npm run check:i18n` rồi `npm run check:i18n-parity`
    - `npm run test:showcase-examples`
    - `cd showcase && npm test`
    - `npm run sync` rồi `npm run check:sync`
    - Manual AC-011: mở sandbox (`npm --prefix sandbox start`, cổng 4500) kiểm hàng thẳng cột ở desktop và <900px
    - Manual AC-012: quét mojibake trên toàn bộ prose tiếng Việt đã sửa (5 catalog, `.md`, demo)

## Acceptance mapping

| AC | Tasks |
| --- | --- |
| AC-001 một dropdown ở mode source | 4, 5 |
| AC-002 chọn nguồn ghi đè, một nodeChange | 4, 5 |
| AC-003 `Bearer ${env.token}` → advanced, round-trip | 2, 3 |
| AC-004 `${input.keyword}` → source đã chọn đúng | 2, 3 |
| AC-005 reference trỏ sai vẫn ở source + vẫn báo lỗi | 2, 3, 5 |
| AC-006 control static theo type | 6, 7 |
| AC-007 static object: JSON dở không ghi | 6, 7 |
| AC-008 paste hợp lệ thay contract + format | 9, 10, 11 |
| AC-009 paste sai giữ contract + `contract.invalid` | 9, 10, 11 |
| AC-010 paste verbatim không tự thêm trường | 9, 10 |
| AC-011 *(manual)* căn hàng 2 breakpoint | 8, 20 |
| AC-012 *(manual)* mojibake sạch | 12, 13, 14, 15, 20 |

## Verification

- `cd versions/v19 && npm run test:ci`
- `cd versions/v19 && npm run build`
- `cd versions/v19 && npm run check:i18n` · `npm run check:i18n-parity`
- `npm run test:showcase-examples`
- `cd showcase && npm test`
- `npm run sync` · `npm run check:sync`
- Manual: căn hàng ở desktop + <900px (AC-011); quét mojibake (AC-012)

Trong vòng TDD, chạy hẹp cho nhanh:
`cd versions/v19 && npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='**/api-contract-source-editor.component.spec.ts' --include='**/api-contract-builder.component.spec.ts'`
