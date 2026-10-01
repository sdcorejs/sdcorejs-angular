---
artifact_id: architecture-icon-shape-option-r2-draft
artifact_kind: architecture
contract_id: icon-shape-option
change_ref: icon-shape-option
owner: sdcorejs-architecture
owner_repository_id: sdcorejs-angular
owner_repository_role: library
owner_module_id: null
execution_host_repository_id: sdcorejs-angular
integration_owner_repository_id: sdcorejs-angular
track: angular
stack_profile: core-ui-angular
source_spec: .sdcorejs/specs/angular/2026-10-01-15-39-icon-shape-option.md
source_plan: none
commit_policy: with-change
status: draft
approved: false
revision: 2
supersedes: architecture-icon-shape-option-r1
supersedes_path: .sdcorejs/architecture/angular/2026-10-01-15-55-icon-shape-option.md
---

# Architecture — Tuỳ chọn hình nền icon (iconShape) (bản sửa 2)

- **Nguồn:** spec đã duyệt `spec-icon-shape-option-r1` (`sha256:v1:4cab2660…`).
- **Thay thế:** `architecture-icon-shape-option-r1` (`sha256:v1:d1f01a82…`).
- **Trạng thái:** bản nháp, chưa duyệt. Chỉ ghi quyết định mà năm consumer phải làm giống nhau; thứ tự file và task thuộc về plan.

## Thay đổi so với bản 1

- Trigger rationale chép đúng nguyên văn `architecture_gate.rationale` của spec đã duyệt. Bản 1 diễn đạt lại câu này nên `validateArchitecturePrePlanHandoff` báo `TRIGGER_IDENTITY_MISMATCH`.
- Quyết định, invariant, hợp đồng, ranh giới và nghĩa vụ kiểm chứng giữ nguyên.

## Trigger và owner

- Gate: **required**. Signal: `public-api-contract`.
- Owner, integration owner, execution host: `sdcorejs-angular` (library). Không có tích hợp cross-repository.

## Quyết định kiến trúc

- **D-007** — Logic chọn shape đặt ở đâu? Inline trong từng consumer: `iconShape() ?? config.defaultShape` (config = `inject(SD_ICON_CONFIGURATION)`). `resolveSdIconConfig` là nơi duy nhất giữ mặc định `square`. Không thêm helper, directive hay component chung. _Lý do:_ biểu thức một dòng; helper dùng chung sẽ thành public API thừa của entrypoint icon.
- **D-008** — Gắn shape vào DOM thế nào? Ô icon mang `[attr.data-icon-shape]`. Rule SCSS gốc của ô là `square` (`border-radius: var(--sd-icon-shape-radius, var(--sd-radius-8, 8px))`); `[data-icon-shape='circle']` đặt 50%; `[data-icon-shape='none']` đặt `background: transparent`, giữ width/height. Rule shape đặt **sau** rule tone/state và có specificity **không thấp hơn** rule tone/state mạnh nhất của cùng ô (data-state `.sd-data-state[data-state=…] .sd-data-state__symbol` và toast `:host([data-type=…]) .sd-toast__icon` đều cao hơn một selector attribute đơn), để `none` trong suốt ở mọi tone/state. Variant tip của inform (specificity cao hơn) vẫn thắng mọi shape. _Lý do:_ một hook ổn định cho test, SCSS và consumer; không đổi class sẵn có.
- **D-009** — Toast và dialog resolve ở đâu? Service chỉ chuyển `iconShape` của option vào `ToastData` / `DialogData`; `ToastComponent` và `DialogConfirmComponent` inject `SD_ICON_CONFIGURATION` rồi resolve như D-007. Nhánh buffer `warning`/`error` dùng option của lời gọi cuối (luật hiện có của `title`/`duration`); lời gọi cuối không có `iconShape` thì dùng app default. `ToastComponent.data` là `@Input` thường, nên resolve trong getter/template chứ không qua `computed()`. _Lý do:_ service không cần cấu hình icon; một luật resolve cho cả năm consumer.

Các quyết định D-001…D-006 của spec giữ nguyên và tính là đã áp dụng.

## Invariants

| ID | Điều phải luôn đúng | Cách chứng minh |
| --- | --- | --- |
| INV-001 | Không đổi sd-button, avatar, dot, spinner, stepper, nút close/clear/remove, file-explorer, home-page demo, autoid-inspector. | `git diff --name-only` chỉ chứa file trong danh sách plan. |
| INV-002 | `circle` render giống hệt trước thay đổi (50%, cùng nền). | getComputedStyle: radius 50%, cùng background-color với `square` cùng tone. |
| INV-003 | API cũ tương thích ngược; code không truyền `iconShape` vẫn compile. | Spec cũ giữ nguyên vẫn xanh; build lib + showcase exit 0. |
| INV-004 | v20/v21/v22 chỉ đổi qua `npm run sync`. | `npm run check:sync` exit 0. |
| INV-005 | Chỉ `resolveSdIconConfig` định nghĩa mặc định `square`; ưu tiên luôn là instance > `SD_ICON_CONFIGURATION.defaultShape`. | Test AC-001 + test ba trường hợp ở mỗi consumer; grep không có fallback hardcode trong TS consumer. |
| INV-006 | Mọi ô icon trong phạm vi có `data-icon-shape` với đúng một trong `square`, `circle`, `none`. | Test AC-002…AC-006. |

## Hợp đồng public

| ID | Loại | Hợp đồng | Tương thích |
| --- | --- | --- | --- |
| C-001 | api | `SdIconShape`; `ISdIconConfiguration.defaultShape?`; `resolveSdIconConfig` trả `defaultShape` (mặc định `square`). | Bổ sung. `ISdIconResolvedConfiguration` thêm field bắt buộc `defaultShape`; object dựng tay không qua `resolveSdIconConfig` phải thêm field. Doc và showcase chỉ dùng `resolveSdIconConfig`. |
| C-002 | api | Input `iconShape` trên `sd-section`, `sd-inform`, `sd-data-state`. | Bổ sung, tuỳ chọn. |
| C-003 | api | `NotifyOption.iconShape?`; `iconShape?` trong option của sáu method `SdConfirmService`. | Bổ sung, tuỳ chọn. |
| C-004 | api | Styling hook `data-icon-shape` và CSS custom property `--sd-icon-shape-radius`. | Mặc định đổi từ tròn sang vuông 8px; `provideSdIcon({ defaultShape: 'circle' })` giữ kiểu cũ. |

## Ranh giới, phụ thuộc, nơi sở hữu state

- **B-001:** chỉ sửa code ở `versions/v19` và `showcase`; v20–v22 qua `npm run sync`.
- **B-002:** chỉ năm ô icon đọc shape; không component nào khác dùng `SdIconShape`.
- **Phụ thuộc:** section, inform, data-state, notify, confirm → `@sdcorejs/angular/modules/icon` (`SdIconShape`, `SD_ICON_CONFIGURATION`). Bốn trong năm đã import entrypoint này; notify thêm import mới, không có vòng phụ thuộc vì icon không import ngược.
- **State:** shape mặc định toàn app thuộc `SD_ICON_CONFIGURATION`; shape từng instance thuộc input/option của lời gọi.
- **Phạm vi injector:** `provideSdIcon` trả `EnvironmentProviders`, dùng ở app hoặc route. Section, inform, data-state thấy cả provider route và provider component dạng `{ provide: SD_ICON_CONFIGURATION, useValue: resolveSdIconConfig(...) }`. Toast (`EnvironmentInjector` root) và dialog (`MatDialog` root, không truyền injector) chỉ thấy provider cấp app.

## Validation obligations

| ID | Bằng chứng mong đợi | Invariant | AC |
| --- | --- | --- | --- |
| VAL-001 | Test resolve config và ba trường hợp ưu tiên ở mỗi consumer; grep không có fallback hardcode. | INV-005, INV-006 | AC-001…AC-006 |
| VAL-002 | getComputedStyle cho ba shape ở từng ô, token radius, tip của inform trong suốt; `none` trong suốt ở mọi tone/state: section 6 tone, inform 6 tone, data-state error/forbidden/loading, toast 4 type, confirm 5 tone. | INV-002 | AC-003, AC-007 |
| VAL-003 | Full suite v19 xanh; build lib + showcase exit 0; `git diff --name-only` khớp plan. | INV-001, INV-003 | AC-008 |
| VAL-004 | `npm run check:sync` exit 0; grep doc + CHANGELOG theo AC-008. | INV-004 | AC-008 |

Mọi nghĩa vụ chứng minh bằng test hoặc lệnh tự động (D-006).

## Profile frontend, giả định, quyết định hoãn

- `frontend_architecture_ref`: `plan_context.frontend_architecture`, conformance INV-005, INV-006.
- Giả định được tham chiếu: A-001, A-002. Quyết định hoãn: không có.
- Decision coverage: revision 2 (thêm D-007…D-009, INV-005, INV-006 trên revision 1 của spec).

## Review kiến trúc

Lượt review riêng, chỉ đọc (subagent) trên bản nháp đầu: không BLOCKER, 2 MAJOR, 2 MINOR. Đã xử lý:

1. MAJOR — data-state: rule state `.sd-data-state[data-state='error'] .sd-data-state__symbol` (`data-state.component.scss:35-37`, `:47-48`) mạnh hơn selector attribute đơn, nên `none` vẫn còn nền. → D-008 bắt rule shape có specificity không thấp hơn rule tone/state mạnh nhất; VAL-002 kiểm `none` ở error/forbidden/loading.
2. MAJOR — toast: `:host([data-type=…]) .sd-toast__icon` (`toast.component.scss:125-130`) mạnh hơn, nên `none` vẫn còn nền. → như trên; VAL-002 kiểm 4 type.
3. MINOR — section `.text-<tone>` và confirm `[data-tone]` hoà specificity, nên thứ tự quyết định. → D-008 yêu cầu rule shape đặt sau vòng `@each`; VAL-002 kiểm mọi tone.
4. MINOR — `provideSdIcon` trả `EnvironmentProviders`, không đặt được trong `providers` của component. → Sửa mục phạm vi injector.
5. INFO — buffer notify: lời gọi cuối thắng. → D-009 ghi rõ. `ToastComponent.data` là `@Input` thường. → D-009 ghi resolve trong getter/template.
6. INFO — đã xác nhận: import, không vòng phụ thuộc; chỉ `SD_ICON_DEFAULT_CONFIG` và `resolveSdIconConfig` dựng resolved config; tip của inform (0,5,0) thắng shape; không còn chỗ render nào khác.

## Appendix — architecture_context (machine-readable)

Đã kiểm bằng `validateArchitectureContext` với decision coverage revision 2. Hash của snapshot đã duyệt được điền sau khi bạn duyệt.

<details><summary>architecture_context JSON</summary>

```json
{
 "schema_version": 1,
 "source": "sdcorejs-architecture",
 "contract_id": "icon-shape-option",
 "requirement_id": "R-001",
 "approved_spec_reference": {
  "repository_id": "sdcorejs-angular",
  "artifact_id": "spec-icon-shape-option-r1",
  "artifact_kind": "spec",
  "revision": "23857013381215b07f497842427e03477365536d",
  "approval_hash": "sha256:v1:4cab2660432a0991011bca189113a28dc10ed796c29f63b380faed7e1dc140ef"
 },
 "approved_architecture_path": ".sdcorejs/architecture/angular/2026-10-01-16-44-icon-shape-option.md",
 "approved_architecture_hash": "(filled after approval)",
 "owner_repository_id": "sdcorejs-angular",
 "owner_module_id": null,
 "execution_host_repository_id": "sdcorejs-angular",
 "integration_owner_repository_id": "sdcorejs-angular",
 "trigger": {
  "required": true,
  "signals": [
   "public-api-contract"
  ],
  "rationale": "Thêm type export, field cấu hình app-level, input trên ba component và field option trên hai service công khai của @sdcorejs/angular, cộng một CSS custom property công khai."
 },
 "invariants": [
  {
   "id": "INV-001",
   "statement": "Không đổi `sd-button`, avatar, dot, spinner, stepper, nút close/clear/remove, file-explorer, home-page demo, autoid-inspector.",
   "scope": "Mọi component ngoài năm ô icon trong phạm vi",
   "owner": "sdcorejs-angular",
   "rationale": "User giới hạn phạm vi ở icon tile, không đụng sd-button.",
   "verification_method": "Lệnh tự động: `git diff --name-only` của nhánh chỉ chứa file trong danh sách plan; không file nào thuộc button, avatar, stepper, modal, side-drawer, tab-router, file-explorer, autoid-inspector, home-page.",
   "requirement_refs": [
    "R-007"
   ],
   "decision_refs": [
    "D-005"
   ]
  },
  {
   "id": "INV-002",
   "statement": "`circle` render giống hệt giao diện trước thay đổi (radius 50%, cùng màu nền).",
   "scope": "SCSS ô icon của năm consumer",
   "owner": "sdcorejs-angular",
   "rationale": "Consumer chọn `circle` phải lấy lại đúng giao diện cũ.",
   "verification_method": "Test getComputedStyle: `circle` có border-radius 50% và cùng background-color với `square` của cùng tone.",
   "requirement_refs": [
    "R-007"
   ],
   "decision_refs": [
    "D-002",
    "D-008"
   ]
  },
  {
   "id": "INV-003",
   "statement": "API cũ tương thích ngược: không input/option nào bị đổi tên hay xoá; code không truyền `iconShape` vẫn compile.",
   "scope": "Public API của section, inform, data-state, notify, confirm, icon",
   "owner": "sdcorejs-angular",
   "rationale": "Thêm option không được phá code consumer đang có.",
   "verification_method": "Spec hiện có giữ nguyên vẫn xanh; build lib và showcase (demo cũ không truyền iconShape) exit 0.",
   "requirement_refs": [
    "R-002",
    "R-003",
    "R-004",
    "R-005",
    "R-006"
   ],
   "decision_refs": [
    "D-001"
   ]
  },
  {
   "id": "INV-004",
   "statement": "v20/v21/v22 chỉ thay đổi qua `npm run sync`; `npm run check:sync` xanh.",
   "scope": "versions/v20, versions/v21, versions/v22",
   "owner": "sdcorejs-angular",
   "rationale": "Luật rollout của repo.",
   "verification_method": "`npm run check:sync` exit 0.",
   "requirement_refs": [
    "R-008"
   ],
   "decision_refs": [
    "D-001"
   ]
  },
  {
   "id": "INV-005",
   "statement": "Chỉ `resolveSdIconConfig` định nghĩa mặc định `square`; không consumer nào hardcode shape mặc định, và thứ tự ưu tiên luôn là instance > `SD_ICON_CONFIGURATION.defaultShape`.",
   "scope": "modules/icon và năm consumer",
   "owner": "sdcorejs-angular",
   "rationale": "Một nguồn duy nhất cho giá trị mặc định.",
   "verification_method": "Test AC-001; test mỗi consumer không provider ra `square`, provider `circle` ra `circle`; lệnh grep không có literal `square`/`circle` làm fallback trong TS của năm consumer.",
   "requirement_refs": [
    "R-001"
   ],
   "decision_refs": [
    "D-003",
    "D-007"
   ]
  },
  {
   "id": "INV-006",
   "statement": "Mọi ô icon trong phạm vi luôn có `data-icon-shape` với đúng một trong ba giá trị `square`, `circle`, `none`.",
   "scope": "Template ô icon của năm consumer",
   "owner": "sdcorejs-angular",
   "rationale": "Hook DOM ổn định cho CSS, test và consumer.",
   "verification_method": "Test AC-002…AC-006 đọc `data-icon-shape` trên từng ô.",
   "requirement_refs": [
    "R-007"
   ],
   "decision_refs": [
    "D-008"
   ]
  }
 ],
 "boundaries": [
  {
   "id": "B-001",
   "statement": "Chỉ sửa code ở versions/v19 và showcase; v20–v22 qua npm run sync.",
   "invariant_refs": [
    "INV-004"
   ]
  },
  {
   "id": "B-002",
   "statement": "Chỉ năm ô icon (section header, inform, data-state symbol, toast icon, confirm icon) đọc shape; không component nào khác dùng SdIconShape.",
   "invariant_refs": [
    "INV-001",
    "INV-006"
   ]
  }
 ],
 "dependency_directions": [
  {
   "from": "components/section, components/inform, components/data-state",
   "to": "modules/icon (SdIconShape, SD_ICON_CONFIGURATION)",
   "rationale": "Ba component đã import SdIcon từ entrypoint này; không thêm entrypoint mới.",
   "invariant_refs": [
    "INV-005"
   ]
  },
  {
   "from": "services/notify, services/confirm",
   "to": "modules/icon (SdIconShape, SD_ICON_CONFIGURATION)",
   "rationale": "Toast và dialog resolve shape; confirm đã import SdIcon.",
   "invariant_refs": [
    "INV-005"
   ]
  }
 ],
 "data_state_owners": [
  {
   "subject": "Shape mặc định toàn app",
   "owner_repository_id": "sdcorejs-angular",
   "owner": "SD_ICON_CONFIGURATION (resolveSdIconConfig, provideSdIcon)",
   "invariant_refs": [
    "INV-005"
   ]
  },
  {
   "subject": "Shape của một instance",
   "owner_repository_id": "sdcorejs-angular",
   "owner": "Input iconShape của component, hoặc option của lời gọi notify/confirm",
   "invariant_refs": [
    "INV-005",
    "INV-006"
   ]
  }
 ],
 "public_contracts": [
  {
   "id": "C-001",
   "kind": "api",
   "statement": "`SdIconShape` type; `ISdIconConfiguration.defaultShape?: SdIconShape`; `resolveSdIconConfig` trả `defaultShape` (mặc định `square`).",
   "owner": "sdcorejs-angular/modules/icon",
   "compatibility": "Bổ sung. `ISdIconResolvedConfiguration` có thêm field bắt buộc `defaultShape`: object dựng tay không qua `resolveSdIconConfig` phải thêm field (doc và showcase chỉ dùng `resolveSdIconConfig`).",
   "migration": "Không cần; changelog nhắc dùng `resolveSdIconConfig` khi tự provide token.",
   "invariant_refs": [
    "INV-003",
    "INV-005"
   ]
  },
  {
   "id": "C-002",
   "kind": "api",
   "statement": "Input `iconShape: SdIconShape | null | undefined` trên `sd-section`, `sd-inform`, `sd-data-state`.",
   "owner": "sdcorejs-angular",
   "compatibility": "Bổ sung, tuỳ chọn.",
   "migration": "Không cần.",
   "invariant_refs": [
    "INV-003",
    "INV-006"
   ]
  },
  {
   "id": "C-003",
   "kind": "api",
   "statement": "`NotifyOption.iconShape?: SdIconShape`; `iconShape?: SdIconShape` trong option của sáu method `SdConfirmService`.",
   "owner": "sdcorejs-angular",
   "compatibility": "Bổ sung, tuỳ chọn.",
   "migration": "Không cần.",
   "invariant_refs": [
    "INV-003",
    "INV-006"
   ]
  },
  {
   "id": "C-004",
   "kind": "api",
   "statement": "Styling hook: attribute `data-icon-shape` trên ô icon và CSS custom property `--sd-icon-shape-radius` (mặc định `var(--sd-radius-8, 8px)`).",
   "owner": "sdcorejs-angular",
   "compatibility": "Mặc định đổi từ tròn sang vuông bo 8px (thay đổi giao diện, không đổi API).",
   "migration": "`provideSdIcon({ defaultShape: 'circle' })` để giữ kiểu tròn.",
   "invariant_refs": [
    "INV-002",
    "INV-006"
   ]
  }
 ],
 "security_trust_boundaries": [],
 "cross_repository_integration": [],
 "adopted_decision_refs": [
  "D-001",
  "D-002",
  "D-003",
  "D-004",
  "D-005",
  "D-006",
  "D-007",
  "D-008",
  "D-009"
 ],
 "deferred_decision_refs": [],
 "assumption_refs": [
  "A-001",
  "A-002"
 ],
 "validation_obligations": [
  {
   "id": "VAL-001",
   "expected_proof": "Test resolveSdIconConfig/SD_ICON_CONFIGURATION và test mỗi consumer theo ba trường hợp ưu tiên; lệnh grep không có fallback hardcode trong consumer.",
   "owner": "sdcorejs-execute-plan",
   "invariant_refs": [
    "INV-005",
    "INV-006"
   ],
   "acceptance_criterion_refs": [
    "AC-001",
    "AC-002",
    "AC-003",
    "AC-004",
    "AC-005",
    "AC-006"
   ]
  },
  {
   "id": "VAL-002",
   "expected_proof": "Test getComputedStyle cho ba shape ở từng ô, token radius, tip của inform trong suốt; `none` trong suốt ở mọi tone/state: section 6 tone, inform 6 tone, data-state error/forbidden/loading, toast 4 type, confirm 5 tone.",
   "owner": "sdcorejs-execute-plan",
   "invariant_refs": [
    "INV-002"
   ],
   "acceptance_criterion_refs": [
    "AC-003",
    "AC-007"
   ]
  },
  {
   "id": "VAL-003",
   "expected_proof": "Full suite v19 xanh, build lib + showcase exit 0, `git diff --name-only` khớp danh sách plan.",
   "owner": "sdcorejs-execute-plan",
   "invariant_refs": [
    "INV-001",
    "INV-003"
   ],
   "acceptance_criterion_refs": [
    "AC-008"
   ]
  },
  {
   "id": "VAL-004",
   "expected_proof": "`npm run check:sync` exit 0; grep doc và CHANGELOG theo AC-008.",
   "owner": "sdcorejs-execute-plan",
   "invariant_refs": [
    "INV-004"
   ],
   "acceptance_criterion_refs": [
    "AC-008"
   ]
  }
 ],
 "profile_sections": {
  "frontend_architecture_ref": {
   "reference": "plan_context.frontend_architecture",
   "conformance_invariant_refs": [
    "INV-005",
    "INV-006"
   ]
  },
  "agent_architecture_ref": null
 },
 "change_control": {
  "revision": 2,
  "supersedes": "architecture-icon-shape-option-r1",
  "change_reason": "Trigger rationale chép đúng nguyên văn architecture_gate.rationale của spec đã duyệt (r1 diễn đạt lại nên validateArchitecturePrePlanHandoff báo TRIGGER_IDENTITY_MISMATCH). Nội dung kiến trúc không đổi."
 }
}
```

</details>

<details><summary>decision_coverage revision 2 (JSON)</summary>

```json
{
 "schema_version": 1,
 "revision": 2,
 "records": [
  {
   "id": "R-001",
   "type": "requirement",
   "statement": "`@sdcorejs/angular/modules/icon` export type `SdIconShape = 'square' | 'circle' | 'none'`; `ISdIconConfiguration` có field tuỳ chọn `defaultShape?: SdIconShape`, `resolveSdIconConfig` resolve field này với mặc định `'square'`, nên `provideSdIcon({ defaultShape })` đổi mặc định toàn app.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "modules/icon",
   "task_refs": []
  },
  {
   "id": "R-002",
   "type": "requirement",
   "statement": "`sd-section` có input `iconShape: SdIconShape | null | undefined`; ô icon header render theo shape đã resolve (instance > app default > 'square').",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "components/section",
   "task_refs": []
  },
  {
   "id": "R-003",
   "type": "requirement",
   "statement": "`sd-inform` có input `iconShape`; ô icon render theo shape đã resolve. Variant `tip` vẫn không có nền như hiện tại, bất kể shape.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "components/inform",
   "task_refs": []
  },
  {
   "id": "R-004",
   "type": "requirement",
   "statement": "`sd-data-state` có input `iconShape`; ô symbol render theo shape đã resolve ở cả layout thường và `compact`.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "components/data-state",
   "task_refs": []
  },
  {
   "id": "R-005",
   "type": "requirement",
   "statement": "`NotifyOption` có field `iconShape?: SdIconShape`; `success`, `info`, `warning`, `error` của `SdNotifyService` truyền shape xuống toast, kể cả nhánh buffer của `warning`/`error`; ô icon toast render theo shape đã resolve.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "services/notify",
   "task_refs": []
  },
  {
   "id": "R-006",
   "type": "requirement",
   "statement": "Option của cả sáu method `SdConfirmService` (`confirm`, `withInput`, `withRadio`, `withSelect`, `withDate`, `withDatetime`) có field `iconShape?: SdIconShape`; ô icon của dialog confirm render theo shape đã resolve.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "services/confirm",
   "task_refs": []
  },
  {
   "id": "R-007",
   "type": "requirement",
   "statement": "Hiển thị: `square` giữ màu nền, `border-radius: var(--sd-icon-shape-radius, var(--sd-radius-8, 8px))`; `circle` giữ đúng giao diện hiện tại (50%); `none` bỏ nền, icon giữ màu, kích thước ô không đổi. Mỗi ô icon mang attribute `data-icon-shape` bằng shape đã resolve.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": null,
   "task_refs": []
  },
  {
   "id": "R-008",
   "type": "requirement",
   "statement": "Tài liệu `sd-icon.md`, `sd-section.md`, `sd-inform.md`, `sd-data-state.md`, `sd-notify.md`, `sd-confirm.md` mô tả option mới; root `CHANGELOG.md` có mục `## [Unreleased]` ghi đổi mặc định và cách lấy lại kiểu tròn; showcase có demo ba shape; v20/v21/v22 dẫn xuất bằng `npm run sync`.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": null,
   "task_refs": []
  },
  {
   "id": "AC-001",
   "type": "acceptance-criterion",
   "statement": "Cấu hình icon resolve `defaultShape` đúng.",
   "behavior": "Gọi `resolveSdIconConfig()` và `resolveSdIconConfig({ defaultShape: 'circle' })`.",
   "expected_result": "Lần đầu trả `defaultShape: 'square'`; lần sau trả `'circle'`; `SD_ICON_CONFIGURATION` không provider cũng trả `'square'`.",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-001"
   ],
   "task_refs": []
  },
  {
   "id": "AC-002",
   "type": "acceptance-criterion",
   "statement": "Ô icon header của `sd-section` theo thứ tự ưu tiên shape.",
   "behavior": "Render `sd-section` có `icon` với (a) không input, không provider; (b) provider `defaultShape: 'circle'`; (c) provider `'circle'` và input `iconShape=\"none\"`.",
   "expected_result": "`.sd-section-header-icon` có `data-icon-shape` lần lượt `square`, `circle`, `none`.",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-002",
    "R-007"
   ],
   "task_refs": []
  },
  {
   "id": "AC-003",
   "type": "acceptance-criterion",
   "statement": "Ô icon của `sd-inform` theo thứ tự ưu tiên shape; tip không có nền.",
   "behavior": "Render `sd-inform` với ba trường hợp như AC-002, rồi render `sd-inform` variant tip với `iconShape=\"square\"`.",
   "expected_result": "`.c-inform-icon-tile` có `data-icon-shape` lần lượt `square`, `circle`, `none`; ở tip, computed `background-color` của ô là trong suốt.",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-003",
    "R-007"
   ],
   "task_refs": []
  },
  {
   "id": "AC-004",
   "type": "acceptance-criterion",
   "statement": "Ô symbol của `sd-data-state` theo thứ tự ưu tiên shape ở cả hai layout.",
   "behavior": "Render `sd-data-state` với ba trường hợp như AC-002, mỗi trường hợp có và không có `compact`.",
   "expected_result": "`.sd-data-state__symbol` có `data-icon-shape` lần lượt `square`, `circle`, `none` ở cả hai layout.",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-004",
    "R-007"
   ],
   "task_refs": []
  },
  {
   "id": "AC-005",
   "type": "acceptance-criterion",
   "statement": "Toast nhận `iconShape` từ option hoặc app default.",
   "behavior": "Gọi `success('x', { iconShape: 'circle' })`, `info('x')` và `error('x', { iconShape: 'none' })` (chờ hết debounce buffer) trên service có provider `defaultShape` mặc định.",
   "expected_result": "`.sd-toast__icon` của từng toast có `data-icon-shape` lần lượt `circle`, `square`, `none`.",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-005",
    "R-007"
   ],
   "task_refs": []
  },
  {
   "id": "AC-006",
   "type": "acceptance-criterion",
   "statement": "Dialog confirm nhận `iconShape` từ mọi method.",
   "behavior": "Mở dialog qua từng method trong sáu method với `iconShape: 'circle'`, và mở `confirm` không có `iconShape`.",
   "expected_result": "`data` của dialog chứa đúng `iconShape`; `.sd-dialog-confirm__icon` có `data-icon-shape=\"circle\"` khi truyền và `\"square\"` khi không truyền.",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-006",
    "R-007"
   ],
   "task_refs": []
  },
  {
   "id": "AC-007",
   "type": "acceptance-criterion",
   "statement": "Ba shape hiển thị đúng hình học và nền.",
   "behavior": "Trong Karma (Chrome thật), đọc `getComputedStyle` của ô icon từng component ở `square`, `circle`, `none`.",
   "expected_result": "`square` có `border-radius` 8px và nền khác trong suốt; `circle` có `border-radius` 50% và nền như hiện tại; `none` có nền trong suốt, `width`/`height` bằng `square`; đặt `--sd-icon-shape-radius: 4px` thì `square` có radius 4px.",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-007"
   ],
   "task_refs": []
  },
  {
   "id": "AC-008",
   "type": "acceptance-criterion",
   "statement": "Tài liệu, changelog, showcase và rollout đồng bộ.",
   "behavior": "Grep sáu file doc và `CHANGELOG.md`; chạy `npm run check:sync`; build showcase sau khi build lib.",
   "expected_result": "Sáu doc nhắc `iconShape` (doc icon nhắc `defaultShape` và `SdIconShape`); `## [Unreleased]` có mục đổi mặc định kèm `provideSdIcon({ defaultShape: 'circle' })`; `check:sync` exit 0; showcase build exit 0 và có demo dùng cả ba shape.",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-008"
   ],
   "task_refs": []
  },
  {
   "id": "A-001",
   "type": "assumption",
   "statement": "Đổi mặc định từ tròn sang vuông là thay đổi giao diện, không phá API: không input nào bị đổi tên hay xoá, nên release suffix bump minor và changelog ghi ở `### Changed`, không phải `### Changed (BREAKING for consumers)`.",
   "source": "explicit",
   "confidence": "high",
   "status": "confirmed",
   "blocking": false,
   "evidence_refs": [
    "user-answer-2026-10-01-default-square"
   ],
   "consequence_if_wrong": "Consumer nâng cấp ngạc nhiên vì giao diện đổi mà không có cảnh báo breaking.",
   "validation_method": "Changelog nêu rõ đổi mặc định và một dòng cấu hình để lấy lại kiểu tròn.",
   "owner": "sdcorejs-angular maintainer",
   "rationale": "User chọn mặc định vuông và chấp nhận đổi giao diện cho mọi consumer.",
   "impacted_refs": [
    "R-001",
    "R-008"
   ]
  },
  {
   "id": "A-002",
   "type": "assumption",
   "statement": "Toast vẽ icon bằng SVG inline chứ không dùng `sd-icon`; option vẫn áp cho ô nền bao SVG đó.",
   "source": "explicit",
   "confidence": "high",
   "status": "confirmed",
   "blocking": false,
   "evidence_refs": [
    "services/notify/src/components/toast/toast.component.html"
   ],
   "consequence_if_wrong": "Toast lệch shape so với các component còn lại.",
   "validation_method": "AC-005 và AC-007 kiểm tra trên `.sd-toast__icon`.",
   "owner": "sdcorejs-angular maintainer",
   "rationale": "User nêu đích danh sd notify trong phạm vi.",
   "impacted_refs": [
    "R-005"
   ]
  },
  {
   "id": "D-001",
   "type": "decision",
   "statement": "Đặt tên API là `iconShape`, `SdIconShape`, `defaultShape`.",
   "question": "Tên thuộc tính và type cho hình nền icon?",
   "selected_value": "Input/option `iconShape`; type `SdIconShape`; field app-level `defaultShape` trong `provideSdIcon`.",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "repository",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "Khớp cặp `icon`/`iconColor` sẵn có ở `sd-section` và `defaultFontSet` của `provideSdIcon`.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": true,
    "category": "naming"
   },
   "downstream_refs": [
    "R-001",
    "R-002",
    "R-003",
    "R-004",
    "R-005",
    "R-006"
   ],
   "task_refs": []
  },
  {
   "id": "D-002",
   "type": "decision",
   "statement": "Mặc định là `square` với radius 8px, chỉnh được qua `--sd-icon-shape-radius`.",
   "question": "Shape và radius mặc định?",
   "selected_value": "'square', radius var(--sd-icon-shape-radius, var(--sd-radius-8, 8px))",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "repository",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "User chọn 8px và muốn đồng nhất bo vuông nhẹ.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-001",
    "R-007",
    "AC-001",
    "AC-007"
   ],
   "task_refs": []
  },
  {
   "id": "D-003",
   "type": "decision",
   "statement": "Thứ tự ưu tiên là instance > app default > 'square'.",
   "question": "Khi nhiều nguồn cùng đặt shape, nguồn nào thắng?",
   "selected_value": "instance (`iconShape`) > `provideSdIcon({ defaultShape })` > `'square'`",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "repository",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "Cho phép đổi một chỗ toàn app mà vẫn ghi đè từng instance.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "AC-002",
    "AC-003",
    "AC-004",
    "AC-005",
    "AC-006"
   ],
   "task_refs": []
  },
  {
   "id": "D-004",
   "type": "decision",
   "statement": "`none` giữ nguyên kích thước ô.",
   "question": "Shape `none` có thu nhỏ ô icon không?",
   "selected_value": "Giữ width/height, chỉ bỏ nền.",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "repository",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "Đổi shape không làm xê dịch title/message bên cạnh.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-007",
    "AC-007"
   ],
   "task_refs": []
  },
  {
   "id": "D-005",
   "type": "decision",
   "statement": "Phạm vi chỉ gồm năm ô icon trang trí.",
   "question": "Component nào nhận option?",
   "selected_value": "sd-section header, sd-inform, sd-data-state, toast của notify, dialog confirm.",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "repository",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "User giới hạn ở icon hiển thị kiểu sd-icon tile; không đụng sd-button.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-002",
    "R-003",
    "R-004",
    "R-005",
    "R-006",
    "INV-001"
   ],
   "task_refs": []
  },
  {
   "id": "D-006",
   "type": "decision",
   "statement": "Mọi tiêu chí kiểm chứng tự động; xem showcase bằng mắt là UAT tuỳ chọn ngoài gate.",
   "question": "Kiểm chứng giao diện thế nào?",
   "selected_value": "Karma + getComputedStyle; manual_criteria_count = 0.",
   "source": "approved-spec",
   "status": "approved",
   "blocking": true,
   "scope": "repository",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "Delivery convergence không nhận evidence thủ công.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "AC-007",
    "AC-008"
   ],
   "task_refs": []
  },
  {
   "id": "D-007",
   "type": "decision",
   "statement": "Mỗi consumer tự resolve shape bằng `iconShape ?? SD_ICON_CONFIGURATION.defaultShape`; không thêm helper, directive hay component dùng chung.",
   "question": "Logic chọn shape đặt ở đâu?",
   "selected_value": "Inline trong từng component; `resolveSdIconConfig` là nơi duy nhất giữ giá trị mặc định `square`.",
   "source": "approved-spec",
   "status": "approved",
   "blocking": true,
   "scope": "repository",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "Biểu thức một dòng; helper dùng chung từ entrypoint icon sẽ thành public API thừa.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-001",
    "AC-001",
    "INV-005"
   ],
   "task_refs": []
  },
  {
   "id": "D-008",
   "type": "decision",
   "statement": "Hợp đồng DOM/CSS: ô icon mang `data-icon-shape=\"square|circle|none\"`; SCSS chọn theo attribute; radius `square` đọc `--sd-icon-shape-radius`.",
   "question": "Giao diện từng shape gắn vào DOM thế nào?",
   "selected_value": "Attribute `data-icon-shape` trên ô icon; rule gốc là `square`, override cho `circle` và `none`. Rule shape đặt sau rule tone/state và có specificity không thấp hơn rule tone/state mạnh nhất của cùng ô, để `none` luôn trong suốt ở mọi tone/state.",
   "source": "approved-spec",
   "status": "approved",
   "blocking": true,
   "scope": "repository",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "Một hook ổn định cho test, SCSS và consumer muốn chỉnh thêm; không đổi class sẵn có.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-007",
    "AC-007",
    "INV-006"
   ],
   "task_refs": []
  },
  {
   "id": "D-009",
   "type": "decision",
   "statement": "Notify và confirm chuyển nguyên `iconShape` của option vào `ToastData`/`DialogData`; toast và dialog tự resolve với `SD_ICON_CONFIGURATION`.",
   "question": "Service hay component resolve shape cho toast và dialog?",
   "selected_value": "Component resolve; service chỉ chuyển option. Nhánh buffer dùng option của lời gọi cuối (luật hiện có của `title`/`duration`); lời gọi cuối không có `iconShape` thì dùng app default.",
   "source": "approved-spec",
   "status": "approved",
   "blocking": true,
   "scope": "repository",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "Service không cần inject cấu hình icon; luật resolve giống ba component còn lại.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-005",
    "R-006",
    "AC-005",
    "AC-006"
   ],
   "task_refs": []
  },
  {
   "id": "INV-001",
   "type": "invariant",
   "statement": "Không đổi `sd-button`, avatar, dot, spinner, stepper, nút close/clear/remove, file-explorer, home-page demo, autoid-inspector.",
   "protected_refs": [
    "R-007",
    "D-005"
   ],
   "task_refs": [],
   "evidence_refs": []
  },
  {
   "id": "INV-002",
   "type": "invariant",
   "statement": "`circle` render giống hệt giao diện trước thay đổi (radius 50%, cùng màu nền).",
   "protected_refs": [
    "R-007",
    "AC-007"
   ],
   "task_refs": [],
   "evidence_refs": []
  },
  {
   "id": "INV-003",
   "type": "invariant",
   "statement": "API cũ tương thích ngược: không input/option nào bị đổi tên hay xoá; code không truyền `iconShape` vẫn compile.",
   "protected_refs": [
    "R-002",
    "R-003",
    "R-004",
    "R-005",
    "R-006",
    "A-001"
   ],
   "task_refs": [],
   "evidence_refs": []
  },
  {
   "id": "INV-004",
   "type": "invariant",
   "statement": "v20/v21/v22 chỉ thay đổi qua `npm run sync`; `npm run check:sync` xanh.",
   "protected_refs": [
    "R-008",
    "AC-008"
   ],
   "task_refs": [],
   "evidence_refs": []
  },
  {
   "id": "INV-005",
   "type": "invariant",
   "statement": "Chỉ `resolveSdIconConfig` định nghĩa mặc định `square`; không consumer nào hardcode shape mặc định, và thứ tự ưu tiên luôn là instance > `SD_ICON_CONFIGURATION.defaultShape`.",
   "protected_refs": [
    "R-001",
    "AC-001",
    "D-003",
    "D-007"
   ],
   "task_refs": [],
   "evidence_refs": []
  },
  {
   "id": "INV-006",
   "type": "invariant",
   "statement": "Mọi ô icon trong phạm vi luôn có `data-icon-shape` với đúng một trong ba giá trị `square`, `circle`, `none`.",
   "protected_refs": [
    "R-007",
    "AC-002",
    "AC-003",
    "AC-004",
    "AC-005",
    "AC-006",
    "D-008"
   ],
   "task_refs": [],
   "evidence_refs": []
  }
 ],
 "history": [
  {
   "revision": 1,
   "active": [
    {
     "id": "R-001",
     "type": "requirement"
    },
    {
     "id": "R-002",
     "type": "requirement"
    },
    {
     "id": "R-003",
     "type": "requirement"
    },
    {
     "id": "R-004",
     "type": "requirement"
    },
    {
     "id": "R-005",
     "type": "requirement"
    },
    {
     "id": "R-006",
     "type": "requirement"
    },
    {
     "id": "R-007",
     "type": "requirement"
    },
    {
     "id": "R-008",
     "type": "requirement"
    },
    {
     "id": "AC-001",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-002",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-003",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-004",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-005",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-006",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-007",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-008",
     "type": "acceptance-criterion"
    },
    {
     "id": "A-001",
     "type": "assumption"
    },
    {
     "id": "A-002",
     "type": "assumption"
    },
    {
     "id": "D-001",
     "type": "decision"
    },
    {
     "id": "D-002",
     "type": "decision"
    },
    {
     "id": "D-003",
     "type": "decision"
    },
    {
     "id": "D-004",
     "type": "decision"
    },
    {
     "id": "D-005",
     "type": "decision"
    },
    {
     "id": "D-006",
     "type": "decision"
    },
    {
     "id": "INV-001",
     "type": "invariant"
    },
    {
     "id": "INV-002",
     "type": "invariant"
    },
    {
     "id": "INV-003",
     "type": "invariant"
    },
    {
     "id": "INV-004",
     "type": "invariant"
    }
   ],
   "tombstones": []
  },
  {
   "revision": 2,
   "active": [
    {
     "id": "R-001",
     "type": "requirement"
    },
    {
     "id": "R-002",
     "type": "requirement"
    },
    {
     "id": "R-003",
     "type": "requirement"
    },
    {
     "id": "R-004",
     "type": "requirement"
    },
    {
     "id": "R-005",
     "type": "requirement"
    },
    {
     "id": "R-006",
     "type": "requirement"
    },
    {
     "id": "R-007",
     "type": "requirement"
    },
    {
     "id": "R-008",
     "type": "requirement"
    },
    {
     "id": "AC-001",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-002",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-003",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-004",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-005",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-006",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-007",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-008",
     "type": "acceptance-criterion"
    },
    {
     "id": "A-001",
     "type": "assumption"
    },
    {
     "id": "A-002",
     "type": "assumption"
    },
    {
     "id": "D-001",
     "type": "decision"
    },
    {
     "id": "D-002",
     "type": "decision"
    },
    {
     "id": "D-003",
     "type": "decision"
    },
    {
     "id": "D-004",
     "type": "decision"
    },
    {
     "id": "D-005",
     "type": "decision"
    },
    {
     "id": "D-006",
     "type": "decision"
    },
    {
     "id": "D-007",
     "type": "decision"
    },
    {
     "id": "D-008",
     "type": "decision"
    },
    {
     "id": "D-009",
     "type": "decision"
    },
    {
     "id": "INV-001",
     "type": "invariant"
    },
    {
     "id": "INV-002",
     "type": "invariant"
    },
    {
     "id": "INV-003",
     "type": "invariant"
    },
    {
     "id": "INV-004",
     "type": "invariant"
    },
    {
     "id": "INV-005",
     "type": "invariant"
    },
    {
     "id": "INV-006",
     "type": "invariant"
    }
   ],
   "tombstones": []
  }
 ]
}
```

</details>
