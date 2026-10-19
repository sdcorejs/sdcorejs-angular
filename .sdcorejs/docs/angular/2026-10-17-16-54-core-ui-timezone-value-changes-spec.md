# Spec - form.valueChanges khi bật timeZone hoặc transform - 2026-10-17 16:54

```yaml
spec_context: {
  "source": "sdcorejs-spec",
  "decision_coverage": {
    "schema_version": 1,
    "revision": 1,
    "records": [
      {
        "id": "R-001",
        "type": "requirement",
        "statement": "While a model-facing control is active (timeZone configured or transform set), a user edit that changes the model of sd-date, sd-datetime or sd-date-range makes the registered control and the parent form emit valueChanges exactly once with the model value, and form.value then equals the model; a user edit that leaves the model unchanged emits nothing.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "forms/models"
      },
      {
        "id": "R-002",
        "type": "requirement",
        "statement": "Model writes from the parent [model] / [(model)] binding stay silent (no valueChanges), as in local mode; writes through the registered control (form.patchValue, setValue) keep Angular semantics and never emit a second time.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "forms/models"
      },
      {
        "id": "R-003",
        "type": "requirement",
        "statement": "Local mode without transform is unchanged: the editor control stays the registered control and the existing specs pass without edits.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "forms/models"
      },
      {
        "id": "R-004",
        "type": "requirement",
        "statement": "The Showcase services/date-time demo reads form.value from form.valueChanges (no sdChange/focusout/setTimeout workaround) and the e2e stays green in both browser zones.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": "showcase"
      },
      {
        "id": "R-005",
        "type": "requirement",
        "statement": "The sd-date, sd-datetime, sd-date-range and sd-date-time docs and the CHANGELOG Unreleased entry state that with timeZone or transform form.valueChanges emits once per user edit that changes the model, with the model value; v20-v22 come only from npm run sync.",
        "source": "explicit-user",
        "status": "active",
        "owner_repository_id": "sdcorejs-angular",
        "owner_module_id": null
      },
      {
        "id": "AC-001",
        "type": "acceptance-criterion",
        "statement": "With the helper on an editor FormControl, change the source so the model changes, then change it so the model stays the same -> the registered control emits valueChanges exactly once with the model value and the parent FormGroup emits once; the unchanged-model edit emits nothing",
        "behavior": "With the helper on an editor FormControl, change the source so the model changes, then change it so the model stays the same",
        "expected_result": "the registered control emits valueChanges exactly once with the model value and the parent FormGroup emits once; the unchanged-model edit emits nothing",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-001"
        ]
      },
      {
        "id": "AC-002",
        "type": "acceptance-criterion",
        "statement": "With the helper, set the model from outside (not through the source) -> the registered control takes the value and emits no valueChanges",
        "behavior": "With the helper, set the model from outside (not through the source)",
        "expected_result": "the registered control takes the value and emits no valueChanges",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-002"
        ]
      },
      {
        "id": "AC-003",
        "type": "acceptance-criterion",
        "statement": "With the helper, call setValue on the registered control -> writeModel is called once and valueChanges is emitted exactly once (by that setValue)",
        "behavior": "With the helper, call setValue on the registered control",
        "expected_result": "writeModel is called once and valueChanges is emitted exactly once (by that setValue)",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-002"
        ]
      },
      {
        "id": "AC-004",
        "type": "acceptance-criterion",
        "statement": "With timeZone 'Asia/Ho_Chi_Minh', commit 20/05/1960 in sd-date, 20/05/1960 08:00 in sd-datetime and 12/06/1975 to 12/06/1975 in sd-date-range; repeat without a zone but with transform ISOString -> the parent form emits valueChanges with '1960/05/20', '1960/05/20 08:00:00' and the range model; the transform variants emit the matching ISO strings",
        "behavior": "With timeZone 'Asia/Ho_Chi_Minh', commit 20/05/1960 in sd-date, 20/05/1960 08:00 in sd-datetime and 12/06/1975 to 12/06/1975 in sd-date-range; repeat without a zone but with transform ISOString",
        "expected_result": "the parent form emits valueChanges with '1960/05/20', '1960/05/20 08:00:00' and the range model; the transform variants emit the matching ISO strings",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-001"
        ]
      },
      {
        "id": "AC-005",
        "type": "acceptance-criterion",
        "statement": "With a zone, change [model] from the host -> the parent form emits no valueChanges",
        "behavior": "With a zone, change [model] from the host",
        "expected_result": "the parent form emits no valueChanges",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-002"
        ]
      },
      {
        "id": "AC-006",
        "type": "acceptance-criterion",
        "statement": "Run every existing forms spec in local mode -> they pass without edits",
        "behavior": "Run every existing forms spec in local mode",
        "expected_result": "they pass without edits",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-003"
        ]
      },
      {
        "id": "AC-007",
        "type": "acceptance-criterion",
        "statement": "Switch the demo to form.valueChanges and run npm --prefix showcase run e2e -> 14 passed in the asia-bangkok and utc projects",
        "behavior": "Switch the demo to form.valueChanges and run npm --prefix showcase run e2e",
        "expected_result": "14 passed in the asia-bangkok and utc projects",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-004"
        ]
      },
      {
        "id": "AC-008",
        "type": "acceptance-criterion",
        "statement": "Read the three form docs, sd-date-time.md and the CHANGELOG; run npm run sync and npm run check:sync -> they describe the valueChanges behavior and the sync check passes",
        "behavior": "Read the three form docs, sd-date-time.md and the CHANGELOG; run npm run sync and npm run check:sync",
        "expected_result": "they describe the valueChanges behavior and the sync check passes",
        "verification_kind": "automated",
        "blocking": true,
        "requirement_refs": [
          "R-005"
        ]
      },
      {
        "id": "A-001",
        "type": "assumption",
        "statement": "FormControl.setValue with default options propagates valueChanges to the parent FormGroup.",
        "source": "inferred",
        "confidence": "high",
        "status": "confirmed",
        "blocking": false,
        "evidence_refs": [],
        "consequence_if_wrong": "The parent form would stay silent.",
        "validation_method": "AC-001.",
        "owner": "sdcorejs-angular maintainers",
        "rationale": "Angular reactive forms contract.",
        "impacted_refs": [
          "R-001"
        ]
      },
      {
        "id": "A-002",
        "type": "assumption",
        "statement": "Every user edit reaches the editor control as a valueChanges emission (Material inputs and pickers call setValue with events).",
        "source": "inferred",
        "confidence": "medium",
        "status": "proposed",
        "blocking": false,
        "evidence_refs": [],
        "consequence_if_wrong": "Some edit path would still not emit.",
        "validation_method": "AC-004 and the e2e of AC-007.",
        "owner": "sdcorejs-angular maintainers",
        "rationale": "The connector writes the model from that same subscription.",
        "impacted_refs": [
          "R-001",
          "R-004"
        ]
      },
      {
        "id": "D-001",
        "type": "decision",
        "statement": "When the parent form emits valueChanges under a model-facing control: Only when a user edit changes the model; parent [(model)] writes stay silent; also in transform mode",
        "question": "When the parent form emits valueChanges under a model-facing control",
        "selected_value": "Only when a user edit changes the model; parent [(model)] writes stay silent; also in transform mode",
        "source": "explicit-user",
        "status": "approved",
        "blocking": true,
        "scope": "repository",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Matches local mode and avoids loops for consumers that sync the model in valueChanges.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-001",
          "R-002",
          "AC-001",
          "AC-005"
        ]
      },
      {
        "id": "D-002",
        "type": "decision",
        "statement": "How the helper knows an edit came from the user: A source valueChanges marks a pending user edit; the next model-to-control sync (effect or a microtask flush, whichever runs first) writes the model with emitEvent true; every other sync stays silent",
        "question": "How the helper knows an edit came from the user",
        "selected_value": "A source valueChanges marks a pending user edit; the next model-to-control sync (effect or a microtask flush, whichever runs first) writes the model with emitEvent true; every other sync stays silent",
        "source": "approved-spec",
        "status": "approved",
        "blocking": true,
        "scope": "repository",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "The connector writes the model synchronously in its editor subscription but subscribes after the model-facing control, so the emission must follow the model update in either order.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-001",
          "AC-001",
          "AC-003"
        ]
      },
      {
        "id": "D-003",
        "type": "decision",
        "statement": "Where the fix lives: Only the shared helper forms/models/src/sd-model-facing-control.ts; the three components use it unchanged",
        "question": "Where the fix lives",
        "selected_value": "Only the shared helper forms/models/src/sd-model-facing-control.ts; the three components use it unchanged",
        "source": "approved-spec",
        "status": "approved",
        "blocking": true,
        "scope": "repository",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "One behavior, one place.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-001",
          "R-003"
        ]
      },
      {
        "id": "D-004",
        "type": "decision",
        "statement": "Coverage approach: TDD: helper unit spec and component specs (zone and transform) first, failing, then the fix",
        "question": "Coverage approach",
        "selected_value": "TDD: helper unit spec and component specs (zone and transform) first, failing, then the fix",
        "source": "approved-spec",
        "status": "approved",
        "blocking": true,
        "scope": "repository",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Repository default for behavior changes.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "AC-001",
          "AC-004"
        ]
      },
      {
        "id": "D-005",
        "type": "decision",
        "statement": "Browser proof: The Showcase demo switches to form.valueChanges so the existing e2e (AC-001 to AC-003 of the e2e contract) proves the fix end to end",
        "question": "Browser proof",
        "selected_value": "The Showcase demo switches to form.valueChanges so the existing e2e (AC-001 to AC-003 of the e2e contract) proves the fix end to end",
        "source": "approved-spec",
        "status": "approved",
        "blocking": true,
        "scope": "repository",
        "owner_repository_id": "sdcorejs-angular",
        "rationale": "Reuses the e2e added in the same PR.",
        "supersedes": null,
        "revisit_condition": null,
        "convention_impact": {
          "candidate": false,
          "category": null
        },
        "downstream_refs": [
          "R-004",
          "AC-007"
        ]
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
          }
        ],
        "tombstones": []
      }
    ]
  },
  "goal_backward_review": {
    "schema_version": 1,
    "mode": "sdcorejs-plan:goal-backward",
    "stage": "spec",
    "future_gaps": [
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-001.task_refs",
        "record_id": "AC-001",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-002.task_refs",
        "record_id": "AC-002",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-003.task_refs",
        "record_id": "AC-003",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-004.task_refs",
        "record_id": "AC-004",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-005.task_refs",
        "record_id": "AC-005",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-006.task_refs",
        "record_id": "AC-006",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-007.task_refs",
        "record_id": "AC-007",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "AC_PLAN_COVERAGE_MISSING",
        "path": "records.AC-008.task_refs",
        "record_id": "AC-008",
        "message": "an acceptance criterion must map to at least one planned task"
      },
      {
        "code": "REQUIREMENT_PLAN_COVERAGE_MISSING",
        "path": "records.R-001.task_refs",
        "record_id": "R-001",
        "message": "a requirement must map to at least one planned task"
      },
      {
        "code": "REQUIREMENT_PLAN_COVERAGE_MISSING",
        "path": "records.R-002.task_refs",
        "record_id": "R-002",
        "message": "a requirement must map to at least one planned task"
      },
      {
        "code": "REQUIREMENT_PLAN_COVERAGE_MISSING",
        "path": "records.R-003.task_refs",
        "record_id": "R-003",
        "message": "a requirement must map to at least one planned task"
      },
      {
        "code": "REQUIREMENT_PLAN_COVERAGE_MISSING",
        "path": "records.R-004.task_refs",
        "record_id": "R-004",
        "message": "a requirement must map to at least one planned task"
      },
      {
        "code": "REQUIREMENT_PLAN_COVERAGE_MISSING",
        "path": "records.R-005.task_refs",
        "record_id": "R-005",
        "message": "a requirement must map to at least one planned task"
      }
    ]
  },
  "architecture_gate": {
    "valid": true,
    "required": false,
    "status": "not-applicable",
    "signals": [],
    "bypass": {
      "kind": "bounded-bug-fix",
      "rationale": "One shared internal helper restores the local-mode event semantics for model-facing controls; no public signature, data model or dependency changes."
    },
    "rationale": "One shared internal helper restores the local-mode event semantics for model-facing controls; no public signature, data model or dependency changes."
  },
  "contract_id": "core-ui-timezone-value-changes",
  "requirement_id": "REQ-core-ui-timezone-value-changes",
  "approved_spec_path": "",
  "approved_spec_hash": "",
  "supersedes": null,
  "parent_references": [],
  "related_contract": "core-ui-fixed-timezone (PR #84); finding 2 of .sdcorejs/docs/test/2026-10-17-15-55-core-ui-fixed-timezone-e2e-execution.md",
  "target_root": ".",
  "target_root_kind": "target-project",
  "owner_repository_id": "sdcorejs-angular",
  "owner_repository_role": "library",
  "owner_module_id": "forms/models",
  "execution_host_repository_id": "sdcorejs-angular",
  "track": "angular",
  "stack_profile": "core-ui-angular",
  "profile_confidence": "high",
  "source_requirement_context": "brainstorming 2026-10-17: valueChanges must fire on user edits under timeZone/transform (user chose: only user edits)",
  "acceptance_criteria_count": 8,
  "manual_criteria_count": 0,
  "non_goals": [
    "Core Legacy port",
    "valueChanges on parent [(model)] writes",
    "data-value attribute",
    "Showcase dev-server double library load"
  ],
  "risks": [
    "double emission",
    "consumer loops",
    "transform apps now receive valueChanges"
  ],
  "assumptions": [
    "A-001 FormControl.setValue with default options propagates valueChanges to the parent FormGroup.",
    "A-002 Every user edit reaches the editor control as a valueChanges emission (Material inputs and pickers call setValue with events)."
  ],
  "redaction_applied": false,
  "approval": {
    "approved": false,
    "approved_at": null,
    "approval_source": "explicit-user-choice"
  },
  "change_control": {
    "revision": 1,
    "supersedes": null,
    "change_reason": null
  }
}
```

## Problem & Goals

`sd-date`, `sd-datetime` và `sd-date-range` đăng ký vào form cha một control "model-facing" khi có `transform` hoặc khi app cấu hình `ISdCoreConfiguration.timeZone` (PR #84). Control này nhận model bằng `setValue(…, { emitEvent: false })`, nên khi người dùng chọn hoặc gõ ngày, form cha **không phát `valueChanges`**. Ở chế độ local (không zone, không transform) control editor được đăng ký và form cha vẫn phát. E2E của PR #84 phát hiện điều này: app đang nghe `form.valueChanges` để phản ứng theo ngày sẽ mất sự kiện khi bật `timeZone`.

Mục tiêu: khi người dùng sửa và model đổi, form cha phát `valueChanges` đúng một lần với giá trị model — như chế độ local — mà không gây vòng lặp và không phát khi cha ghi model từ ngoài.

## Requirements

- R-001 - Khi control model-facing đang hoạt động (có `timeZone` hoặc `transform`), một lần người dùng sửa làm model của `sd-date` / `sd-datetime` / `sd-date-range` đổi thì control đăng ký và form cha phát `valueChanges` đúng một lần, với giá trị model; `form.value` lúc đó bằng model. Người dùng sửa mà model không đổi thì không phát. (explicit-user, active, owner `sdcorejs-angular` / `forms/models`)
- R-002 - Ghi model từ cha qua `[model]` / `[(model)]` vẫn im lặng (không `valueChanges`), như chế độ local. Ghi qua control đã đăng ký (`form.patchValue`, `setValue`) giữ nguyên ngữ nghĩa Angular (phát trừ khi `emitEvent: false`) và không phát lần thứ hai. (explicit-user, active)
- R-003 - Chế độ local không có transform không đổi: control editor vẫn là control được đăng ký; spec cũ pass không sửa. (explicit-user, active)
- R-004 - Demo `services/date-time` của Showcase đọc `form.value` từ `form.valueChanges` (bỏ cách làm tạm `sdChange` + `focusout` + `setTimeout`); e2e vẫn xanh ở hai múi giờ trình duyệt. (explicit-user, active, owner `showcase`)
- R-005 - Doc của `sd-date`, `sd-datetime`, `sd-date-range`, `sd-date-time.md` và CHANGELOG `[Unreleased]` nói rõ: khi có `timeZone` hoặc `transform`, `form.valueChanges` phát một lần mỗi lần người dùng sửa làm model đổi, với giá trị model; v20–v22 chỉ đến từ `npm run sync`. (explicit-user, active)

## Decisions

- D-001 - Khi nào phát: chỉ khi người dùng sửa làm model đổi; ghi từ `[(model)]` của cha vẫn im lặng; áp cho cả chế độ `transform`. (explicit-user)
- D-002 - Cơ chế: control model-facing đánh dấu "người dùng vừa sửa" khi control editor (`source`) phát `valueChanges`; lần đồng bộ model → control kế tiếp (effect hoặc một microtask flush, cái nào tới trước) ghi model với `emitEvent: true`; mọi lần đồng bộ khác vẫn `emitEvent: false`. Không đổi từng component. (approved-spec; lý do: connector ghi model đồng bộ trong subscription của editor nhưng đăng ký sau control model-facing, nên phải phát sau khi model đã cập nhật; cờ đảm bảo đúng thứ tự dù effect hay microtask chạy trước)
- D-003 - Phạm vi: chỉ sửa helper dùng chung `forms/models/src/sd-model-facing-control.ts`; ba component dùng helper này nên không phải sửa. (approved-spec)
- D-004 - Cách viết: TDD — spec đơn vị cho helper và spec component (zone và transform) viết trước, đỏ, rồi mới sửa. (approved-spec)
- D-005 - Bằng chứng trình duyệt: demo Showcase chuyển sang `form.valueChanges`, e2e hiện có (AC-001…AC-003) thành bằng chứng end-to-end. (approved-spec)

## Assumptions

- A-001 - `FormControl.setValue(value)` (emitEvent mặc định) lan `valueChanges` lên `FormGroup` cha. (inferred, high, confirmed; nếu sai: form cha vẫn im lặng; kiểm bằng AC-001)
- A-002 - Mọi lần người dùng sửa đều tới control editor dưới dạng một lần phát `valueChanges` (input Material và picker gọi `setValue` có sự kiện). (inferred, medium, proposed; nếu sai: một đường sửa nào đó không phát; kiểm bằng AC-004 và e2e AC-007)

## Architecture gate classification

- Status: not-applicable
- Signals: none
- Rationale/bypass: `bounded-bug-fix` — một helper nội bộ dùng chung, khôi phục ngữ nghĩa sự kiện của chế độ local cho control model-facing; không đổi chữ ký public, mô hình dữ liệu hay dependency.

## Non-goals

- Port sang Core Legacy (contract kế tiếp).
- Phát `valueChanges` khi cha ghi `[(model)]`.
- Sửa thuộc tính `data-value` (vẫn phản ánh control editor) và lỗi dev server Showcase nạp thư viện hai lần.

## Architecture

- `ɵsdModelFacingControl` thêm một subscription vào `source().valueChanges` (trong effect, dọn khi đổi source) đặt cờ `#userEdit` và lên lịch một microtask flush.
- Effect model → control: nếu giá trị khác, `setValue(model, { emitEvent: userEdit })` rồi xoá cờ.
- Flush: nếu cờ còn, xoá cờ; nếu control chưa bằng model thì `setValue(model)` (phát).
- Subscription control → model (ghi qua form) giữ nguyên; `modelEquals` chặn vòng lặp.

## Stack profile and technology assumptions

- Track: angular
- Stack profile: core-ui-angular
- Profile evidence: `versions/v19/projects/sdcorejs-angular/forms/models/src/sd-model-facing-control.ts`, `sd-form-control-connector.ts`.
- Technology assumptions: Angular 19 signals + reactive forms (explicit).

## File structure

- `versions/v19/projects/sdcorejs-angular/forms/models/src/sd-model-facing-control.ts` - sửa: phát khi người dùng sửa.
- `versions/v19/projects/sdcorejs-angular/forms/models/src/sd-model-facing-control.spec.ts` - tạo: spec đơn vị.
- `versions/v19/projects/sdcorejs-angular/forms/{date,datetime,date-range}/src/*.time-zone.spec.ts` - sửa: thêm case `valueChanges` (zone, transform, `[model]` im lặng).
- `versions/v19/projects/sdcorejs-angular/forms/{date,datetime,date-range}/sd-*.md`, `services/date-time/sd-date-time.md` - sửa doc.
- `showcase/src/app/pages/services/date-time/date-time-demo.component.ts` - sửa demo; manifest/sources sinh lại.
- `CHANGELOG.md` - sửa.
- mirror v20–v22 và `SYNC-STATUS.md` do `npm run sync`.

## Acceptance criteria

- AC-001 - Helper với source là FormControl editor: đổi giá trị source làm model đổi -> control đăng ký phát `valueChanges` đúng một lần với giá trị model và `FormGroup` cha phát một lần; đổi source mà model không đổi -> không phát.
- AC-002 - Helper: set model từ ngoài (không qua source) -> control cập nhật giá trị, không phát `valueChanges`.
- AC-003 - Helper: consumer gọi `setValue` trên control đăng ký -> `writeModel` được gọi một lần và `valueChanges` phát đúng một lần (của chính lệnh `setValue`).
- AC-004 - Với `timeZone: 'Asia/Ho_Chi_Minh'`, commit 20/05/1960 trong `sd-date`, `20/05/1960 08:00` trong `sd-datetime`, 12/06/1975–12/06/1975 trong `sd-date-range`; lặp lại không có zone nhưng có `transform="ISOString"` -> form cha phát `valueChanges` với `'1960/05/20'`, `'1960/05/20 08:00:00'`, range model; bản transform phát chuỗi ISO tương ứng.
- AC-005 - Với zone, host đổi `[model]` -> form cha không phát `valueChanges`.
- AC-006 - Chạy mọi spec form hiện có (local) -> pass không sửa.
- AC-007 - Demo dùng `form.valueChanges`; `npm --prefix showcase run e2e` -> 14 passed ở hai project.
- AC-008 - Doc ba form + `sd-date-time.md` + CHANGELOG nói về `valueChanges`; `npm run sync` và `npm run check:sync` pass.

## Risks & mitigations

- **Risk:** phát hai lần (effect + flush). -> **Mitigation:** cờ dùng một lần; AC-001 và AC-003 đếm đúng một.
- **Risk:** consumer cập nhật model trong `valueChanges` gây vòng lặp. -> **Mitigation:** ghi từ `[(model)]` im lặng (R-002); `modelEquals` chặn ghi ngược.
- **Risk:** app dùng `transform` nay nhận thêm sự kiện. -> **Mitigation:** ghi trong CHANGELOG (Changed).

## Out of scope (deferred)

- Port Legacy - defer until contract port Legacy.
