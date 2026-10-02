---
{
  "acceptance_criteria_count": 8,
  "approval_source": "explicit-user-choice",
  "approved_at": "2026-10-01T08:42:28.059Z",
  "approved_by": "user",
  "artifact_id": "spec-icon-shape-option-r1",
  "artifact_kind": "spec",
  "change_control": {
    "change_reason": null,
    "revision": 1,
    "supersedes": null
  },
  "change_ref": "icon-shape-option",
  "commit_policy": "with-change",
  "contract_id": "icon-shape-option",
  "description": "Icon tile shape option (square default with 8px radius, circle, none) for sd-section, sd-inform, sd-data-state, notify toast and confirm dialog, with app-level default via provideSdIcon.",
  "manual_criteria_count": 0,
  "name": "icon-shape-option",
  "owner": "sdcorejs-spec",
  "owner_module_id": null,
  "owner_repository_id": "sdcorejs-angular",
  "owner_repository_role": "library",
  "parent_references": [],
  "parent_repository_id": null,
  "profile_confidence": "high",
  "redaction_applied": false,
  "repository_relative_path": ".sdcorejs/specs/angular/2026-10-01-15-39-icon-shape-option.md",
  "requirement_id": "icon-shape-option",
  "schema_version": 1,
  "sourceDraftPath": ".sdcorejs/docs/angular/2026-10-01-15-39-icon-shape-option-spec.md",
  "source_plan": "none",
  "source_revision": "23857013381215b07f497842427e03477365536d",
  "source_spec": "none",
  "stack_profile": "core-ui-angular",
  "supersedes": null,
  "target_root_kind": "target-project",
  "track": "angular",
  "approval_hash": "sha256:v1:4cab2660432a0991011bca189113a28dc10ed796c29f63b380faed7e1dc140ef"
}
---

# Tuỳ chọn hình nền icon (iconShape) - Approved Spec

> Snapshot of what the user approved at the `sdcorejs-spec` gate. Do not edit by hand; re-author through `sdcorejs-spec` if the contract changes.

## Approved contract

# Spec - Tuỳ chọn hình nền icon (iconShape) - 2026-10-01 15:39

```yaml
spec_context:
  source: sdcorejs-spec
  decision_coverage:
    schema_version: 1
    revision: 1
    records:
      - id: R-001
        type: requirement
        statement: >-
          `@sdcorejs/angular/modules/icon` export type `SdIconShape = 'square' | 'circle' | 'none'`;
          `ISdIconConfiguration` có field tuỳ chọn `defaultShape?: SdIconShape`, `resolveSdIconConfig`
          resolve field này với mặc định `'square'`, nên `provideSdIcon({ defaultShape })` đổi mặc định toàn app.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/icon
        task_refs: []
      - id: R-002
        type: requirement
        statement: >-
          `sd-section` có input `iconShape: SdIconShape | null | undefined`; ô icon header render theo
          shape đã resolve (instance > app default > 'square').
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: components/section
        task_refs: []
      - id: R-003
        type: requirement
        statement: >-
          `sd-inform` có input `iconShape`; ô icon render theo shape đã resolve. Variant `tip` vẫn không
          có nền như hiện tại, bất kể shape.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: components/inform
        task_refs: []
      - id: R-004
        type: requirement
        statement: >-
          `sd-data-state` có input `iconShape`; ô symbol render theo shape đã resolve ở cả layout
          thường và `compact`.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: components/data-state
        task_refs: []
      - id: R-005
        type: requirement
        statement: >-
          `NotifyOption` có field `iconShape?: SdIconShape`; `success`, `info`, `warning`, `error` của
          `SdNotifyService` truyền shape xuống toast, kể cả nhánh buffer của `warning`/`error`; ô icon
          toast render theo shape đã resolve.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: services/notify
        task_refs: []
      - id: R-006
        type: requirement
        statement: >-
          Option của cả sáu method `SdConfirmService` (`confirm`, `withInput`, `withRadio`, `withSelect`,
          `withDate`, `withDatetime`) có field `iconShape?: SdIconShape`; ô icon của dialog confirm render
          theo shape đã resolve.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: services/confirm
        task_refs: []
      - id: R-007
        type: requirement
        statement: >-
          Hiển thị: `square` giữ màu nền, `border-radius: var(--sd-icon-shape-radius, var(--sd-radius-8, 8px))`;
          `circle` giữ đúng giao diện hiện tại (50%); `none` bỏ nền, icon giữ màu, kích thước ô không đổi.
          Mỗi ô icon mang attribute `data-icon-shape` bằng shape đã resolve.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: null
        task_refs: []
      - id: R-008
        type: requirement
        statement: >-
          Tài liệu `sd-icon.md`, `sd-section.md`, `sd-inform.md`, `sd-data-state.md`, `sd-notify.md`,
          `sd-confirm.md` mô tả option mới; root `CHANGELOG.md` có mục `## [Unreleased]` ghi đổi mặc định
          và cách lấy lại kiểu tròn; showcase có demo ba shape; v20/v21/v22 dẫn xuất bằng `npm run sync`.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: null
        task_refs: []
      - id: AC-001
        type: acceptance-criterion
        statement: Cấu hình icon resolve `defaultShape` đúng.
        behavior: >-
          Gọi `resolveSdIconConfig()` và `resolveSdIconConfig({ defaultShape: 'circle' })`.
        expected_result: >-
          Lần đầu trả `defaultShape: 'square'`; lần sau trả `'circle'`; `SD_ICON_CONFIGURATION` không
          provider cũng trả `'square'`.
        verification_kind: automated
        blocking: true
        requirement_refs: [R-001]
        task_refs: []
      - id: AC-002
        type: acceptance-criterion
        statement: Ô icon header của `sd-section` theo thứ tự ưu tiên shape.
        behavior: >-
          Render `sd-section` có `icon` với (a) không input, không provider; (b) provider
          `defaultShape: 'circle'`; (c) provider `'circle'` và input `iconShape="none"`.
        expected_result: >-
          `.sd-section-header-icon` có `data-icon-shape` lần lượt `square`, `circle`, `none`.
        verification_kind: automated
        blocking: true
        requirement_refs: [R-002, R-007]
        task_refs: []
      - id: AC-003
        type: acceptance-criterion
        statement: Ô icon của `sd-inform` theo thứ tự ưu tiên shape; tip không có nền.
        behavior: >-
          Render `sd-inform` với ba trường hợp như AC-002, rồi render `sd-inform` variant tip với
          `iconShape="square"`.
        expected_result: >-
          `.c-inform-icon-tile` có `data-icon-shape` lần lượt `square`, `circle`, `none`; ở tip,
          computed `background-color` của ô là trong suốt.
        verification_kind: automated
        blocking: true
        requirement_refs: [R-003, R-007]
        task_refs: []
      - id: AC-004
        type: acceptance-criterion
        statement: Ô symbol của `sd-data-state` theo thứ tự ưu tiên shape ở cả hai layout.
        behavior: Render `sd-data-state` với ba trường hợp như AC-002, mỗi trường hợp có và không có `compact`.
        expected_result: >-
          `.sd-data-state__symbol` có `data-icon-shape` lần lượt `square`, `circle`, `none` ở cả hai layout.
        verification_kind: automated
        blocking: true
        requirement_refs: [R-004, R-007]
        task_refs: []
      - id: AC-005
        type: acceptance-criterion
        statement: Toast nhận `iconShape` từ option hoặc app default.
        behavior: >-
          Gọi `success('x', { iconShape: 'circle' })`, `info('x')` và `error('x', { iconShape: 'none' })`
          (chờ hết debounce buffer) trên service có provider `defaultShape` mặc định.
        expected_result: >-
          `.sd-toast__icon` của từng toast có `data-icon-shape` lần lượt `circle`, `square`, `none`.
        verification_kind: automated
        blocking: true
        requirement_refs: [R-005, R-007]
        task_refs: []
      - id: AC-006
        type: acceptance-criterion
        statement: Dialog confirm nhận `iconShape` từ mọi method.
        behavior: >-
          Mở dialog qua từng method trong sáu method với `iconShape: 'circle'`, và mở `confirm` không có
          `iconShape`.
        expected_result: >-
          `data` của dialog chứa đúng `iconShape`; `.sd-dialog-confirm__icon` có `data-icon-shape="circle"`
          khi truyền và `"square"` khi không truyền.
        verification_kind: automated
        blocking: true
        requirement_refs: [R-006, R-007]
        task_refs: []
      - id: AC-007
        type: acceptance-criterion
        statement: Ba shape hiển thị đúng hình học và nền.
        behavior: >-
          Trong Karma (Chrome thật), đọc `getComputedStyle` của ô icon từng component ở `square`,
          `circle`, `none`.
        expected_result: >-
          `square` có `border-radius` 8px và nền khác trong suốt; `circle` có `border-radius` 50% và nền
          như hiện tại; `none` có nền trong suốt, `width`/`height` bằng `square`; đặt
          `--sd-icon-shape-radius: 4px` thì `square` có radius 4px.
        verification_kind: automated
        blocking: true
        requirement_refs: [R-007]
        task_refs: []
      - id: AC-008
        type: acceptance-criterion
        statement: Tài liệu, changelog, showcase và rollout đồng bộ.
        behavior: >-
          Grep sáu file doc và `CHANGELOG.md`; chạy `npm run check:sync`; build showcase sau khi build lib.
        expected_result: >-
          Sáu doc nhắc `iconShape` (doc icon nhắc `defaultShape` và `SdIconShape`); `## [Unreleased]` có
          mục đổi mặc định kèm `provideSdIcon({ defaultShape: 'circle' })`; `check:sync` exit 0; showcase
          build exit 0 và có demo dùng cả ba shape.
        verification_kind: automated
        blocking: true
        requirement_refs: [R-008]
        task_refs: []
      - id: A-001
        type: assumption
        statement: >-
          Đổi mặc định từ tròn sang vuông là thay đổi giao diện, không phá API: không input nào bị đổi tên
          hay xoá, nên release suffix bump minor và changelog ghi ở `### Changed`, không phải
          `### Changed (BREAKING for consumers)`.
        source: explicit
        confidence: high
        status: confirmed
        blocking: false
        evidence_refs: [user-answer-2026-10-01-default-square]
        consequence_if_wrong: Consumer nâng cấp ngạc nhiên vì giao diện đổi mà không có cảnh báo breaking.
        validation_method: Changelog nêu rõ đổi mặc định và một dòng cấu hình để lấy lại kiểu tròn.
        owner: sdcorejs-angular maintainer
        rationale: User chọn mặc định vuông và chấp nhận đổi giao diện cho mọi consumer.
        impacted_refs: [R-001, R-008]
      - id: A-002
        type: assumption
        statement: >-
          Toast vẽ icon bằng SVG inline chứ không dùng `sd-icon`; option vẫn áp cho ô nền bao SVG đó.
        source: explicit
        confidence: high
        status: confirmed
        blocking: false
        evidence_refs: [services/notify/src/components/toast/toast.component.html]
        consequence_if_wrong: Toast lệch shape so với các component còn lại.
        validation_method: AC-005 và AC-007 kiểm tra trên `.sd-toast__icon`.
        owner: sdcorejs-angular maintainer
        rationale: User nêu đích danh sd notify trong phạm vi.
        impacted_refs: [R-005]
      - id: D-001
        type: decision
        statement: Đặt tên API là `iconShape`, `SdIconShape`, `defaultShape`.
        question: Tên thuộc tính và type cho hình nền icon?
        selected_value: >-
          Input/option `iconShape`; type `SdIconShape`; field app-level `defaultShape` trong `provideSdIcon`.
        source: explicit-user
        status: approved
        blocking: true
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: Khớp cặp `icon`/`iconColor` sẵn có ở `sd-section` và `defaultFontSet` của `provideSdIcon`.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: true
          category: naming
        downstream_refs: [R-001, R-002, R-003, R-004, R-005, R-006]
        task_refs: []
      - id: D-002
        type: decision
        statement: Mặc định là `square` với radius 8px, chỉnh được qua `--sd-icon-shape-radius`.
        question: Shape và radius mặc định?
        selected_value: "'square', radius var(--sd-icon-shape-radius, var(--sd-radius-8, 8px))"
        source: explicit-user
        status: approved
        blocking: true
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: User chọn 8px và muốn đồng nhất bo vuông nhẹ.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs: [R-001, R-007, AC-001, AC-007]
        task_refs: []
      - id: D-003
        type: decision
        statement: Thứ tự ưu tiên là instance > app default > 'square'.
        question: Khi nhiều nguồn cùng đặt shape, nguồn nào thắng?
        selected_value: instance (`iconShape`) > `provideSdIcon({ defaultShape })` > `'square'`
        source: explicit-user
        status: approved
        blocking: true
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: Cho phép đổi một chỗ toàn app mà vẫn ghi đè từng instance.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs: [AC-002, AC-003, AC-004, AC-005, AC-006]
        task_refs: []
      - id: D-004
        type: decision
        statement: '`none` giữ nguyên kích thước ô.'
        question: Shape `none` có thu nhỏ ô icon không?
        selected_value: Giữ width/height, chỉ bỏ nền.
        source: explicit-user
        status: approved
        blocking: true
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: Đổi shape không làm xê dịch title/message bên cạnh.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs: [R-007, AC-007]
        task_refs: []
      - id: D-005
        type: decision
        statement: Phạm vi chỉ gồm năm ô icon trang trí.
        question: Component nào nhận option?
        selected_value: sd-section header, sd-inform, sd-data-state, toast của notify, dialog confirm.
        source: explicit-user
        status: approved
        blocking: true
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: User giới hạn ở icon hiển thị kiểu sd-icon tile; không đụng sd-button.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs: [R-002, R-003, R-004, R-005, R-006, INV-001]
        task_refs: []
      - id: D-006
        type: decision
        statement: Mọi tiêu chí kiểm chứng tự động; xem showcase bằng mắt là UAT tuỳ chọn ngoài gate.
        question: Kiểm chứng giao diện thế nào?
        selected_value: Karma + getComputedStyle; manual_criteria_count = 0.
        source: approved-spec
        status: approved
        blocking: true
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: Delivery convergence không nhận evidence thủ công.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs: [AC-007, AC-008]
        task_refs: []
      - id: INV-001
        type: invariant
        statement: >-
          Không đổi `sd-button`, avatar, dot, spinner, stepper, nút close/clear/remove, file-explorer,
          home-page demo, autoid-inspector.
        protected_refs: [R-007, D-005]
        task_refs: []
        evidence_refs: []
      - id: INV-002
        type: invariant
        statement: '`circle` render giống hệt giao diện trước thay đổi (radius 50%, cùng màu nền).'
        protected_refs: [R-007, AC-007]
        task_refs: []
        evidence_refs: []
      - id: INV-003
        type: invariant
        statement: >-
          API cũ tương thích ngược: không input/option nào bị đổi tên hay xoá; code không truyền
          `iconShape` vẫn compile.
        protected_refs: [R-002, R-003, R-004, R-005, R-006, A-001]
        task_refs: []
        evidence_refs: []
      - id: INV-004
        type: invariant
        statement: v20/v21/v22 chỉ thay đổi qua `npm run sync`; `npm run check:sync` xanh.
        protected_refs: [R-008, AC-008]
        task_refs: []
        evidence_refs: []
    history:
      - revision: 1
        active:
          - { id: R-001, type: requirement }
          - { id: R-002, type: requirement }
          - { id: R-003, type: requirement }
          - { id: R-004, type: requirement }
          - { id: R-005, type: requirement }
          - { id: R-006, type: requirement }
          - { id: R-007, type: requirement }
          - { id: R-008, type: requirement }
          - { id: AC-001, type: acceptance-criterion }
          - { id: AC-002, type: acceptance-criterion }
          - { id: AC-003, type: acceptance-criterion }
          - { id: AC-004, type: acceptance-criterion }
          - { id: AC-005, type: acceptance-criterion }
          - { id: AC-006, type: acceptance-criterion }
          - { id: AC-007, type: acceptance-criterion }
          - { id: AC-008, type: acceptance-criterion }
          - { id: A-001, type: assumption }
          - { id: A-002, type: assumption }
          - { id: D-001, type: decision }
          - { id: D-002, type: decision }
          - { id: D-003, type: decision }
          - { id: D-004, type: decision }
          - { id: D-005, type: decision }
          - { id: D-006, type: decision }
          - { id: INV-001, type: invariant }
          - { id: INV-002, type: invariant }
          - { id: INV-003, type: invariant }
          - { id: INV-004, type: invariant }
        tombstones: []
  goal_backward_review:
    schema_version: 1
    mode: "sdcorejs-plan:goal-backward"
    stage: spec
    future_gaps: []
  architecture_gate:
    valid: true
    required: true
    status: required
    signals:
      - public-api-contract
    bypass: null
    rationale: >-
      Thêm type export, field cấu hình app-level, input trên ba component và field option trên hai service
      công khai của @sdcorejs/angular, cộng một CSS custom property công khai.
  contract_id: icon-shape-option
  requirement_id: icon-shape-option
  approved_spec_path: ""
  approved_spec_hash: ""
  supersedes: null
  target_root: .
  target_root_kind: target-project
  owner_repository_id: sdcorejs-angular
  owner_repository_role: library
  owner_module_id: null
  execution_host_repository_id: sdcorejs-angular
  track: angular
  stack_profile: core-ui-angular
  profile_confidence: high
  source_requirement_context: icon-shape-option (brainstorming 2026-10-01, user chọn "1")
  acceptance_criteria_count: 8
  manual_criteria_count: 0
  non_goals:
    - sd-button (mọi type)
    - avatar, dot, spinner, số bước stepper, swatch màu, ngày calendar
    - nút close/clear/remove/toggle tự vẽ
    - file-explorer brand icon, home-page demo, autoid-inspector
  risks:
    - Đổi mặc định làm mọi consumer thấy ô icon vuông sau khi nâng cấp.
    - Toast/confirm render ngoài cây component của app, phải lấy app default từ đúng injector.
  assumptions:
    - A-001 đổi mặc định là thay đổi giao diện, không phá API.
    - A-002 toast dùng SVG inline, option áp cho ô nền.
  redaction_applied: false
  approval:
    approved: false
    approved_at: null
    approval_source: explicit-user-choice
  change_control:
    revision: 1
    supersedes: null
    change_reason: null
```

## Problem & Goals

Ô nền tròn quanh icon trạng thái (header `sd-section`, `sd-inform`, `sd-data-state`, toast, dialog confirm) nhìn không hợp với phần còn lại của thư viện, vốn bo góc 4–8px. Mục tiêu: mặc định chuyển sang ô vuông bo 8px, đồng thời cho consumer chọn `square`, `circle` hoặc `none` theo từng instance hoặc một lần cho cả app.

Thành công khi: nâng cấp xong, mọi ô icon trong năm chỗ trên là vuông bo 8px; một dòng `provideSdIcon({ defaultShape: 'circle' })` trả lại giao diện cũ; từng chỗ ghi đè được bằng `iconShape`.

## Requirements

- R-001 - Type `SdIconShape` và `defaultShape` trong `provideSdIcon`, mặc định `'square'`. Nguồn: user. Owner: `modules/icon`.
- R-002 - `sd-section` input `iconShape`. Owner: `components/section`.
- R-003 - `sd-inform` input `iconShape`; variant tip vẫn không nền. Owner: `components/inform`.
- R-004 - `sd-data-state` input `iconShape`, cả layout thường và compact. Owner: `components/data-state`.
- R-005 - `NotifyOption.iconShape` cho cả bốn method, kể cả nhánh buffer. Owner: `services/notify`.
- R-006 - `iconShape` trong option của sáu method confirm. Owner: `services/confirm`.
- R-007 - Hình học từng shape, token `--sd-icon-shape-radius`, attribute `data-icon-shape` trên ô icon.
- R-008 - Doc, changelog, demo showcase, rollout v20/v21/v22 bằng sync.

## Decisions

- D-001 - Tên `iconShape` / `SdIconShape` / `defaultShape`. Nguồn: user chọn đề xuất. Lý do: khớp `icon`/`iconColor` và `defaultFontSet`.
- D-002 - Mặc định `square`, radius `var(--sd-icon-shape-radius, var(--sd-radius-8, 8px))`. Nguồn: user chọn 8px.
- D-003 - Ưu tiên instance > app default > `'square'`.
- D-004 - `none` giữ kích thước ô, chỉ bỏ nền.
- D-005 - Phạm vi năm ô icon trang trí; không đụng `sd-button`.
- D-006 - Kiểm chứng tự động hoàn toàn; xem showcase bằng mắt là UAT tuỳ chọn.

## Assumptions

- A-001 - Đổi mặc định là thay đổi giao diện, không phá API → changelog `### Changed`, không phải BREAKING. Độ tin cậy cao, đã xác nhận, không chặn.
- A-002 - Toast vẽ icon bằng SVG inline; option áp cho ô nền bao SVG. Xác nhận từ code, không chặn.

## Architecture gate classification

- Status: required
- Signals: `public-api-contract`
- Rationale: thêm type export, field cấu hình app-level, input trên ba component, field option trên hai service và một CSS custom property công khai.

## Non-goals

- `sd-button` (mọi type, kể cả icon-only).
- Avatar, dot, spinner, số bước stepper, swatch màu, ngày được chọn của calendar.
- Nút close/clear/remove/toggle tự vẽ (modal, drawer, tab-router, quick-search, chip, upload, tree toggle).
- File-explorer brand icon, home-page demo, autoid-inspector.

## Architecture

- `SdIconShape` sống cạnh `SdIconSet` trong `modules/icon/src/icon.model.ts`; `defaultShape` đi qua `resolveSdIconConfig`, nên `SD_ICON_CONFIGURATION` (factory `providedIn: 'root'`) luôn có giá trị.
- Mỗi component inject `SD_ICON_CONFIGURATION` và tính shape = `iconShape() ?? config.defaultShape`, gắn vào ô icon qua `[attr.data-icon-shape]`.
- Notify: `ToastData` mang `iconShape` từ option (cả `#addImmediate` và `#flushBuffer`); toast tự resolve với app default. Confirm: `DialogData` mang `iconShape`; dialog tự resolve.
- SCSS mỗi component dùng selector `[data-icon-shape='circle'|'none']` trên ô icon; mặc định của rule gốc là `square`. Radius `square` đọc token `--sd-icon-shape-radius` với fallback `--sd-radius-8`.
- Showcase tiêu thụ lib đã build, nên demo cập nhật sau khi build lib.

## Stack profile and technology assumptions

- Track: angular
- Stack profile: core-ui-angular (repo chính là thư viện `@sdcorejs/angular`)
- Profile evidence: `versions/v19/projects/sdcorejs-angular`, signal inputs, `SD_ICON_CONFIGURATION`, Karma + Jasmine.
- Technology assumptions: Angular 19 signal `input()`, SCSS, Karma với `ChromeHeadlessCI` (explicit từ repo).

## File structure

- `versions/v19/projects/sdcorejs-angular/modules/icon/src/icon.model.ts` - edit: type `SdIconShape`, field `defaultShape`, default config.
- `versions/v19/projects/sdcorejs-angular/modules/icon/src/icon.provider.ts` - edit: resolve `defaultShape`.
- `versions/v19/projects/sdcorejs-angular/modules/icon/src/index.ts` - edit nếu cần export type.
- `versions/v19/projects/sdcorejs-angular/components/section/src/section.component.{ts,html,scss,spec.ts}` - edit.
- `versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.{ts,html,scss,spec.ts}` - edit.
- `versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.{ts,html,scss,spec.ts}` - edit.
- `versions/v19/projects/sdcorejs-angular/services/notify/src/{notify.model.ts,notify.service.ts,notify.service.spec.ts}` và `components/toast/toast.component.{ts,html,scss,spec.ts}` - edit.
- `versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.ts`, `confirm.service.spec.ts`, `components/dialog-confirm/dialog-confirm.component.{ts,html,scss,spec.ts}` - edit.
- Sáu file doc `sd-icon.md`, `sd-section.md`, `sd-inform.md`, `sd-data-state.md`, `sd-notify.md`, `sd-confirm.md` - edit.
- `CHANGELOG.md` - edit `## [Unreleased]`.
- `showcase/src/app/pages/components/{section,inform,data-state}/*-demo.component.ts`, `showcase/src/app/pages/services/{notify,confirm}/*-demo.component.ts` - edit: demo ba shape.
- `versions/v20/**`, `versions/v21/**`, `versions/v22/**` - chỉ sinh bởi `npm run sync`.

Danh sách file chính xác do plan chốt.

## Acceptance criteria

- AC-001 - `resolveSdIconConfig()` trả `defaultShape: 'square'`; truyền `'circle'` thì trả `'circle'`. Tự động.
- AC-002 - `sd-section`: `data-icon-shape` = `square` / `circle` / `none` theo ba trường hợp ưu tiên. Tự động.
- AC-003 - `sd-inform`: như AC-002; tip có nền trong suốt. Tự động.
- AC-004 - `sd-data-state`: như AC-002 ở cả hai layout. Tự động.
- AC-005 - Toast: option thắng app default, kể cả `error` qua buffer. Tự động.
- AC-006 - Confirm: sáu method truyền `iconShape`; mặc định `square`. Tự động.
- AC-007 - Computed style: `square` 8px (đổi được qua token), `circle` 50%, `none` nền trong suốt cùng kích thước. Tự động.
- AC-008 - Doc, changelog, `check:sync`, build showcase. Tự động.

## Risks & mitigations

- **Risk:** Consumer bất ngờ vì ô icon đổi sang vuông. -> **Mitigation:** Changelog nêu rõ và đưa dòng `provideSdIcon({ defaultShape: 'circle' })`.
- **Risk:** Toast/confirm tạo component ngoài cây app nên không thấy provider. -> **Mitigation:** Toast tạo từ `EnvironmentInjector` của root, dialog từ `MatDialog` của root; `SD_ICON_CONFIGURATION` cung cấp ở environment level, AC-005/AC-006 kiểm tra với provider.
- **Risk:** CRLF làm `npm run sync` đánh dấu hàng loạt file v22. -> **Mitigation:** Kiểm diff sau sync, chỉ giữ file thật sự đổi.

## Out of scope (deferred)

- Áp `iconShape` cho icon button và nút close/clear - defer cho đến khi có yêu cầu riêng về icon button.
- Bỏ segment `v/:version` hay thay đổi showcase khác - không liên quan.

## Decisions captured during review
- (approved as drafted) — người dùng chọn 1 (Duyệt) cho bản nháp `.sdcorejs/docs/angular/2026-10-01-15-39-icon-shape-option-spec.md`.

## Skill provenance
sdcorejs-spec (approved on attempt 1 / 3)
