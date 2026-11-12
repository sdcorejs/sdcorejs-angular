---
approval_hash: "sha256:v1:5d11628e8f8bba1ab23f864950f4634f9cbb7006ed81d697f73deb5f2dd1f263"
approval_source: "delegated-session-scope"
approved_at: "2026-11-12T04:38:00.000Z"
approved_by: "user"
artifact_id: "architecture-confirm-mobile-bottom-sheet-core-ui-r1"
artifact_kind: "architecture"
change_control:
  revision: 1
  supersedes: null
change_ref: "confirm-mobile-bottom-sheet-core-ui"
commit_policy: "with-change"
contract_id: "confirm-mobile-bottom-sheet-core-ui"
document_review_performed: false
execution_host_repository_id: "portal-ops"
instruction_reference: "Hội thoại 2026-11-12: người dùng chọn \"Giao mình làm trọn\" cho phần port sang sdcorejs-angular (ủy quyền tự viết, tự rà soát spec/kiến trúc/plan theo các quyết định đã chốt rồi triển khai)"
integration_owner_repository_id: "sdcorejs-angular"
owner: "sdcorejs-architecture"
owner_module_id: "services/confirm"
owner_repository_id: "sdcorejs-angular"
owner_repository_role: "library"
parent_references:
  - approval_hash: "sha256:v1:547100c7b4945e65e0291c8c26d46ea9f1383a8340fd5bde5298df456ebde3d7"
    artifact_id: "spec-confirm-mobile-bottom-sheet-core-ui-r1"
    artifact_kind: "spec"
    repository_id: "sdcorejs-angular"
    revision: "7051ec8e18aaf242b6a4c03d8da6d69735d71895"
parent_repository_id: "sdcorejs-angular"
profile_confidence: "high"
repository_relative_path: ".sdcorejs/architecture/angular/2026-11-12-11-38-confirm-mobile-bottom-sheet.md"
requirement_id: "R-001"
schema_version: 1
sourceDraftPath: ".sdcorejs/docs/architecture/2026-11-12-11-37-confirm-mobile-bottom-sheet-architecture.md"
source_plan: "none"
source_revision: "7051ec8e18aaf242b6a4c03d8da6d69735d71895"
source_spec: ".sdcorejs/specs/angular/2026-11-12-11-36-confirm-mobile-bottom-sheet.md"
stack_profile: "core-ui-angular"
status: "approved"
supersedes: null
target_root_kind: "target-project"
track: "angular"
---
# Confirm dùng bottom sheet trên mobile (Core UI) - Approved Architecture

> Bản chụp được lập theo ủy quyền trong phiên (delegated-session-scope). Người dùng KHÔNG đọc duyệt tài liệu này; họ ủy quyền cho agent tự viết và tự rà soát theo các quyết định đã chốt ở bản Core Legacy. Không sửa trực tiếp; thay đổi thì tạo revision mới.

## Approved contract

# Kiến trúc - Confirm dùng bottom sheet trên mobile và cờ enableBackdropClose (Core UI)

Đặc tả: `.sdcorejs/specs/angular/2026-11-12-11-36-confirm-mobile-bottom-sheet.md`. Lập theo ủy quyền trong phiên; người dùng không đọc duyệt tài liệu này. Thiết kế lặp lại kiến trúc đã duyệt ở Core Legacy, điều chỉnh cho những điểm Core UI khác.

## Ranh giới

**BND-001 - Một đường mở trong `SdConfirmService`.** Sáu method chỉ khác nhau ở data và `autoFocus`. Cả sáu gọi chung một hàm private làm ba việc: chọn kiểu hiển thị (`option.view`, không có thì `bottom-sheet` khi mobile, ngược lại `dialog`); tính quyền đóng theo bảng quy tắc cờ; mở overlay rồi đưa `afterClosed()` hoặc `afterDismissed()` vào `#settleOnClose` hiện có. Cấu hình dialog hiện có (`width`, `panelClass: 'sd-confirm-panel'`, `maxWidth`, `maxHeight`, `autoFocus`) giữ nguyên từng giá trị.

**BND-002 - `DialogConfirmComponent` không phụ thuộc cứng vào dialog.** Component lấy ref và data của `MatDialog` hoặc `MatBottomSheet` theo kiểu tùy chọn, dùng cái đang có. Có `MatBottomSheetRef` nghĩa là đang ở bottom sheet: đóng bằng `dismiss(result)` và dùng nhánh template riêng không có directive `mat-dialog-*`. Phần đầu (icon, tiêu đề, message) và các trường nhập dùng chung một template cho cả hai nhánh.

**BND-003 - Style bottom sheet thuộc về confirm.** Sheet mở với `panelClass: 'sd-confirm-bottom-sheet'`, `ariaLabel` lấy từ tiêu đề dạng text và cùng `autoFocus` như dialog. Nút dùng `block` và `size="lg"` của `sd-button`. Không sửa style của `sd-modal` hay `sd-button`.

**BND-004 - `sd-modal` tính quyền đóng ở một chỗ.** `closeAllowed = enableBackdropClose đã truyền ? enableBackdropClose : !disableBackdropClose`. `disableClose = !closeAllowed || có beforeClose` (như hiện tại, guard vẫn chiếm quyền đóng). Guard chỉ được gắn vào nền/Esc khi `closeAllowed`. Mọi luồng khác không đổi.

## Hợp đồng public

- **API-001** - Sáu method nhận thêm `view?: 'dialog' | 'bottom-sheet'` và `enableBackdropClose?: boolean`; `disableBackdropClose` gắn `@deprecated`. JSDoc ghi cờ quyết định cả nền lẫn Esc; `width` chỉ áp dụng cho dialog. Kiểu option dùng chung khai báo một lần trong file service, không export.
- **API-002** - `sd-modal` thêm input `enableBackdropClose`, mặc định `undefined`, nhận attribute không giá trị; `undefined`/`null` nghĩa là không truyền. `disableBackdropClose` gắn `@deprecated`.
- **API-003** - `services/confirm/src/public-api.ts` chỉ còn export service. BREAKING, ghi trong CHANGELOG mục `Changed (BREAKING for consumers)`.

## API consistency (theo AGENTS.md)

- `view` dùng đúng tên, kiểu và nghĩa của input `view` ở `sd-modal`.
- `enableBackdropClose` đặt cạnh `disableBackdropClose` hiện có, cùng kiểu boolean; ở `sd-modal` khai báo bằng `input()` với transform như các input boolean khác nhưng giữ được trạng thái không truyền. Lý do khác convention `booleanAttribute` thuần: phải phân biệt không truyền với `false`.
- `sd-side-drawer` cũng có `disableBackdropClose` (mặc định `false`); không thêm cờ mới ở đó theo quyết định D-003. Hệ quả: hai component có `enableBackdropClose`, một component chưa có. Ghi nhận là khác biệt có chủ đích.
- Bốn dòng Angular: chỉ sửa v19 rồi `npm run sync`.
- Independent review: chưa thực hiện (pending).

## Frontend profile cho plan

Không tạo component, route, store hay provider mới. Dùng lại `MatBottomSheet`, `#settleOnClose`, `sd-button`. Test service bằng fake overlay; test bố cục bằng bottom sheet thật. Liên kết INV-001.

## Invariant và nghĩa vụ kiểm chứng

INV-001 giữ nguyên từ spec.

| Nghĩa vụ | Bằng chứng | AC |
| --- | --- | --- |
| VAL-001 | Chọn đúng kiểu hiển thị và `disableClose` cho sáu method | AC-001, AC-002, AC-003 |
| VAL-002 | Bảng cờ của `sd-modal`, có và không có `beforeClose` | AC-004 |
| VAL-003 | Bố cục và đóng trong bottom sheet thật; kiểm thủ công bàn phím ảo | AC-005, AC-008 |
| VAL-004 | Không còn export; full suite, sync guard, script tests pass | AC-006, AC-007 |

## Lựa chọn và giới hạn

- Một component cho cả hai kiểu hiển thị, thay vì component bottom sheet riêng.
- Inject tùy chọn cả hai loại ref, thay vì token trung gian.
- Không gom logic chọn kiểu hiển thị của confirm với `sd-modal` vào helper chung.
- Phạm vi repository: chỉ `sdcorejs-angular`; phiên portal-ops là nơi điều phối.

## Review

Tự rà soát: hash spec cha hợp lệ; chủ sở hữu và gate khớp spec; tham chiếu R/AC/A/D/INV hợp lệ; cả 8 tiêu chí gắn với một nghĩa vụ kiểm chứng. `approved_architecture_path` và `approved_architecture_hash` trong context dưới đây là `null` vì được điền sau khi chụp.

## Architecture context

```json
{
 "architecture_context": {
  "schema_version": 1,
  "source": "sdcorejs-architecture",
  "contract_id": "confirm-mobile-bottom-sheet-core-ui",
  "requirement_id": "R-001",
  "approved_spec_reference": {
   "repository_id": "sdcorejs-angular",
   "artifact_id": "spec-confirm-mobile-bottom-sheet-core-ui-r1",
   "artifact_kind": "spec",
   "revision": "7051ec8e18aaf242b6a4c03d8da6d69735d71895",
   "approval_hash": "sha256:v1:547100c7b4945e65e0291c8c26d46ea9f1383a8340fd5bde5298df456ebde3d7"
  },
  "approved_architecture_path": null,
  "approved_architecture_hash": null,
  "owner_repository_id": "sdcorejs-angular",
  "owner_repository_role": "library",
  "owner_module_id": "services/confirm",
  "execution_host_repository_id": "portal-ops",
  "integration_owner_repository_id": "sdcorejs-angular",
  "trigger": {
   "required": true,
   "signals": [
    "public-api-contract"
   ],
   "rationale": "Thêm option public view và enableBackdropClose cho SdConfirmService, input enableBackdropClose cho sd-modal (kể cả tương tác với beforeClose), và bỏ export DialogConfirmComponent/DialogData khỏi entry point công khai."
  },
  "invariants": [
   {
    "id": "INV-001",
    "statement": "Mọi call hiện có không truyền view hay enableBackdropClose giữ nguyên chữ ký, kiểu trả về, kết quả resolve/reject, icon, autoFocus và khả năng đóng bằng nền; dialog desktop và hành vi beforeClose của sd-modal không đổi.",
    "scope": "SdConfirmService, DialogConfirmComponent, SdModal",
    "owner": "sdcorejs-angular",
    "rationale": "Consumer nâng version mà không phải sửa code, trừ thay đổi BREAKING đã công bố (bỏ export).",
    "verification_method": "Spec hiện có của confirm và modal vẫn pass; spec mới phủ bảng cờ, hai kiểu hiển thị và nhánh beforeClose.",
    "requirement_refs": [
     "R-001",
     "R-003",
     "R-004",
     "R-007"
    ],
    "decision_refs": [
     "D-003"
    ]
   }
  ],
  "boundaries": [
   {
    "id": "BND-001",
    "statement": "SdConfirmService có một đường mở duy nhất cho sáu method: chọn kiểu hiển thị, tính disableClose, mở overlay và settle Promise bằng #settleOnClose hiện có.",
    "invariant_refs": [
     "INV-001"
    ]
   },
   {
    "id": "BND-002",
    "statement": "DialogConfirmComponent nhận ref/data của MatDialog hoặc MatBottomSheet theo kiểu tùy chọn và dùng cái đang có; trong bottom sheet không dùng directive mat-dialog-*.",
    "invariant_refs": [
     "INV-001"
    ]
   },
   {
    "id": "BND-003",
    "statement": "Bottom sheet của confirm dùng panelClass riêng (sd-confirm-bottom-sheet); style nằm trong component confirm, không sửa style của sd-modal.",
    "invariant_refs": [
     "INV-001"
    ]
   },
   {
    "id": "BND-004",
    "statement": "sd-modal tính quyền đóng ở một chỗ (closeAllowed) và dùng giá trị đó cho cả disableClose lẫn điều kiện gắn guard beforeClose; luồng mở/đóng khác không đổi.",
    "invariant_refs": [
     "INV-001"
    ]
   }
  ],
  "dependency_directions": [
   {
    "from": "SdConfirmService",
    "to": "MatDialog, MatBottomSheet, DialogConfirmComponent",
    "rationale": "Service mở overlay và truyền data; component không biết về Promise hay quy tắc cờ.",
    "invariant_refs": [
     "INV-001"
    ]
   },
   {
    "from": "SdConfirmService, SdModal",
    "to": "BrowserUtilities.isMobile",
    "rationale": "Cùng một nguồn nhận diện mobile; hai nơi không phụ thuộc lẫn nhau.",
    "invariant_refs": [
     "INV-001"
    ]
   }
  ],
  "data_state_owners": [
   {
    "subject": "Kiểu hiển thị, quyền đóng bằng nền/Esc, việc settle Promise",
    "owner_repository_id": "sdcorejs-angular",
    "owner_symbol": "SdConfirmService",
    "invariant_refs": [
     "INV-001"
    ]
   },
   {
    "subject": "Giá trị đang nhập và cờ required",
    "owner_repository_id": "sdcorejs-angular",
    "owner_symbol": "DialogConfirmComponent",
    "invariant_refs": [
     "INV-001"
    ]
   }
  ],
  "public_contracts": [
   {
    "id": "API-001",
    "kind": "api",
    "signature": "SdConfirmService.<6 method>(message, option?: { ...; view?: 'dialog' | 'bottom-sheet'; enableBackdropClose?: boolean; /** @deprecated */ disableBackdropClose?: boolean })",
    "owner": "SdConfirmService / sdcorejs-angular",
    "compatibility": "Hai option mới tùy chọn; không truyền thì desktop như cũ, mobile tự dùng bottom sheet. width chỉ áp dụng cho dialog.",
    "migration": "Không bắt buộc. Khuyến nghị thay disableBackdropClose: false bằng enableBackdropClose: true.",
    "invariant_refs": [
     "INV-001"
    ]
   },
   {
    "id": "API-002",
    "kind": "api",
    "signature": "SdModal: enableBackdropClose = input<boolean | undefined>(undefined); closeAllowed = enableBackdropClose ?? !disableBackdropClose; disableClose = !closeAllowed || !!beforeClose",
    "owner": "SdModal / sdcorejs-angular",
    "compatibility": "Không truyền thì theo disableBackdropClose như hiện tại; nhận attribute không giá trị.",
    "migration": "Không bắt buộc; disableBackdropClose gắn @deprecated, không xóa.",
    "invariant_refs": [
     "INV-001"
    ]
   },
   {
    "id": "API-003",
    "kind": "api",
    "signature": "@sdcorejs/angular/services/confirm: bỏ export DialogConfirmComponent và DialogData",
    "owner": "services/confirm / sdcorejs-angular",
    "compatibility": "BREAKING cho consumer import hai symbol này.",
    "migration": "Dùng SdConfirmService; component là chi tiết nội bộ. Ghi trong CHANGELOG mục Changed (BREAKING for consumers).",
    "invariant_refs": [
     "INV-001"
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
   "D-006"
  ],
  "deferred_decision_refs": [],
  "assumption_refs": [
   "A-001",
   "A-002"
  ],
  "validation_obligations": [
   {
    "id": "VAL-001",
    "owner": "sdcorejs-angular",
    "expected_proof": "Spec service: chọn đúng dialog/bottom sheet theo thiết bị và view cho sáu method; disableClose đúng bảng quy tắc.",
    "invariant_refs": [
     "INV-001"
    ],
    "acceptance_criterion_refs": [
     "AC-001",
     "AC-002",
     "AC-003"
    ]
   },
   {
    "id": "VAL-002",
    "owner": "sdcorejs-angular",
    "expected_proof": "Spec sd-modal: bảng cờ ở hai kiểu hiển thị, có và không có beforeClose.",
    "invariant_refs": [
     "INV-001"
    ],
    "acceptance_criterion_refs": [
     "AC-004"
    ]
   },
   {
    "id": "VAL-003",
    "owner": "sdcorejs-angular",
    "expected_proof": "Spec component trên MatBottomSheet thật: bố cục nút và đóng trả kết quả; kiểm thủ công bàn phím ảo được ghi lại.",
    "invariant_refs": [
     "INV-001"
    ],
    "acceptance_criterion_refs": [
     "AC-005",
     "AC-008"
    ]
   },
   {
    "id": "VAL-004",
    "owner": "sdcorejs-angular",
    "expected_proof": "Build v19 không còn export; full suite, sync, check:sync, test:scripts pass; ESLint sạch trên dòng đã đổi.",
    "invariant_refs": [
     "INV-001"
    ],
    "acceptance_criterion_refs": [
     "AC-006",
     "AC-007"
    ]
   }
  ],
  "profile_sections": {
   "frontend_architecture_ref": {
    "reference": "plan_context.frontend_architecture",
    "conformance_invariant_refs": [
     "INV-001"
    ]
   },
   "agent_architecture_ref": null
  },
  "change_control": {
   "revision": 1,
   "supersedes": null
  }
 }
}
```

## Authority and review provenance

- Hội thoại 2026-11-12: người dùng chọn "Giao mình làm trọn" cho phần port sang sdcorejs-angular (ủy quyền tự viết, tự rà soát spec/kiến trúc/plan theo các quyết định đã chốt rồi triển khai).
- Người dùng chưa đọc toàn văn tài liệu (document_review_performed: false).
- Tự rà soát: spec cha xác minh đúng hash; context hợp lệ ngoài hai trường path/hash được điền sau khi chụp.

## Skill provenance

sdcorejs-architecture (self-review attempt 1 / 3; authority: delegated-session-scope)
