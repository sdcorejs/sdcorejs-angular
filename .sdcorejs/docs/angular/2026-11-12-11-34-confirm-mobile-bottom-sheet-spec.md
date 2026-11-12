---
artifact_id: "draft-spec-confirm-mobile-bottom-sheet-core-ui-r1"
artifact_kind: "execution-doc"
change_ref: "confirm-mobile-bottom-sheet-core-ui"
commit_policy: "with-change"
owner: "sdcorejs-spec"
owner_module_id: "services/confirm"
owner_repository_id: "sdcorejs-angular"
owner_repository_role: "library"
repository_relative_path: ".sdcorejs/docs/angular/2026-11-12-11-34-confirm-mobile-bottom-sheet-spec.md"
schema_version: 1
source_plan: "none"
source_revision: "7051ec8e18aaf242b6a4c03d8da6d69735d71895"
source_spec: "none"
stack_profile: "core-ui-angular"
status: "draft"
track: "angular"
---

# Spec - Confirm dùng bottom sheet trên mobile và cờ enableBackdropClose (Core UI) - 2026-11-12 11:34

Đây là bản port sang `@sdcorejs/angular` của thay đổi đã triển khai ở Core Legacy (`lib-core-angular`, contract `confirm-mobile-bottom-sheet`). Các quyết định do người dùng chốt ở bản Legacy và được áp dụng lại ở đây theo ủy quyền trong phiên; người dùng không đọc duyệt tài liệu này.

- contract_id: `confirm-mobile-bottom-sheet-core-ui`
- Track / profile: angular / core-ui-angular (độ tin cậy cao: thư viện phát hành dưới tên `@sdcorejs/angular`)
- Chủ sở hữu: repo `sdcorejs-angular`, module `services/confirm` (kèm `components/modal`)
- Bản đầy đủ của `decision_coverage` (đã qua kiểm tra ở stage `spec`) nằm ở phụ lục.

## Problem & Goals

`SdConfirmService` của Core UI luôn mở `MatDialog`. Dialog đã có CSS thu hẹp dưới 600px, nhưng trên điện thoại nó vẫn là hộp thoại giữa màn hình, trong khi `sd-modal` cùng thư viện tự chuyển sang bottom sheet. Tên cờ `disableBackdropClose` (mặc định `true`) là phủ định kép. `DialogConfirmComponent` đang được export dù tài liệu ghi là nội bộ.

Mục tiêu: confirm trên mobile dùng bottom sheet với nút dễ bấm; có cờ positive `enableBackdropClose` cho `SdConfirmService` và `sd-modal`; component nội bộ không còn là API công khai. Bốn dòng Angular (v19 đến v22) giữ cùng public API.

Khác với Core Legacy: Promise ở đây đã luôn settle (`#settleOnClose`), nên không có yêu cầu nào về phần đó ngoài việc giữ nguyên.

## Requirements

- **R-001** - Sáu method (`confirm`, `withInput`, `withRadio`, `withSelect`, `withDate`, `withDatetime`) mở `MatBottomSheet` trên mobile và `MatDialog` trên desktop; chữ ký, kiểu trả về, icon, `autoFocus` và hợp đồng settle hiện có không đổi.
- **R-002** - Mỗi method nhận option `view?: 'dialog' | 'bottom-sheet'`.
- **R-003** - `SdConfirmService` nhận `enableBackdropClose` (không truyền = `false`); `disableBackdropClose` giữ dạng `@deprecated`; truyền cả hai thì `enableBackdropClose` quyết định.
- **R-004** - `sd-modal` nhận input `enableBackdropClose` với cùng quy tắc, áp dụng nhất quán cho cả nhánh có `beforeClose`.
- **R-005** - Trong bottom sheet: hai nút full-width cao tối thiểu 44px xếp dọc, nút chính ở trên, Hủy ở dưới; dialog giữ giao diện hiện có.
- **R-006** - `DialogConfirmComponent` và `DialogData` không còn được export từ `@sdcorejs/angular/services/confirm`; ghi BREAKING trong CHANGELOG.
- **R-007** - Sửa ở `versions/v19` rồi rollout bằng `npm run sync`; cập nhật `sd-confirm.md`, `sd-modal.md` và CHANGELOG `[Unreleased]`; test, build và guard đồng bộ pass.

Nguồn của mọi yêu cầu: người dùng. Chủ: `services/confirm`, riêng R-004 là `components/modal`.

Quy tắc cờ đóng bằng nền (cũng quyết định phím Esc):

| `enableBackdropClose` | `disableBackdropClose` | Cho phép đóng bằng nền/Esc |
| --- | --- | --- |
| không truyền | không truyền | Không (như hiện tại) |
| không truyền | `false` | Có (như hiện tại) |
| không truyền | `true` | Không (như hiện tại) |
| `true` | bất kỳ | Có |
| `false` | bất kỳ | Không |

Với `sd-modal` có `beforeClose`: Material luôn bị chặn tự đóng (như hiện tại); khi bảng trên cho phép đóng thì bấm nền/Esc đi qua guard, ngược lại thì không làm gì.

## Decisions

- **D-001** - Mobile tự chuyển sang bottom sheet, không cần opt-in.
- **D-002** - Thêm option `view` để ép kiểu hiển thị.
- **D-003** - Cờ tên `enableBackdropClose` cho `SdConfirmService` và `sd-modal`; `disableBackdropClose` giữ `@deprecated`; `enableBackdropClose` thắng; `sd-side-drawer` không đổi.
- **D-004** - Nút trên bottom sheet xếp dọc, full-width, cao tối thiểu 44px, nút chính trên.
- **D-005** - Bỏ export `DialogConfirmComponent` và `DialogData`, ghi BREAKING trong CHANGELOG.
- **D-006** - Sửa `versions/v19` rồi `npm run sync`; không sửa tay v20-v22; không đổi showcase; không bump version, commit, push, tag hay publish.

Tất cả ở trạng thái approved, nguồn là lựa chọn trực tiếp của người dùng trong hội thoại.

## Assumptions

- **A-001** - Nhận diện mobile bằng `BrowserUtilities.isMobile()`, đọc một lần, giống `sd-modal`. Đã xác nhận; không chặn.
- **A-002** - Bàn phím ảo không che ô nhập của `withInput` trong bottom sheet. Suy ra; hoãn, không chặn; kiểm thủ công theo AC-008.

## Invariants

- **INV-001** - Mọi call hiện có không truyền `view` hay `enableBackdropClose` giữ nguyên chữ ký, kiểu trả về, kết quả resolve/reject, icon, `autoFocus` và khả năng đóng bằng nền; dialog desktop và hành vi `beforeClose` của `sd-modal` không đổi.

## Architecture gate classification

- Status: required.
- Signals: public-api-contract.
- Rationale: Thêm option public view và enableBackdropClose cho SdConfirmService, input enableBackdropClose cho sd-modal (kể cả tương tác với beforeClose), và bỏ export DialogConfirmComponent/DialogData khỏi entry point công khai.

## Non-goals

- Không đổi `sd-side-drawer`, không đổi giao diện dialog desktop, không xóa `disableBackdropClose`.
- Không thêm dependency. Không thêm thao tác vuốt để đóng.
- Không đổi `showcase/`, `published-docs/`, `published-pages/`, script release hay workflow.
- Không cắt release: không đổi heading `[Unreleased]`, không bump version, không commit, push, tag hay publish.

## Architecture

`SdConfirmService` là nơi duy nhất quyết định kiểu hiển thị và quyền đóng; sáu method hiện lặp cùng một đoạn `dialog.open` và phải đi qua một đường mở chung. `DialogConfirmComponent` chỉ hiển thị và trả `{ action, value }`; hiện inject thẳng `MatDialogRef` và `MAT_DIALOG_DATA` nên chưa chạy được trong bottom sheet. `sd-modal` chỉ đổi cách tính quyền đóng, kể cả điều kiện gắn guard `beforeClose`. Chi tiết do bước architecture chốt.

Trên bottom sheet, `width` của `confirm` không áp dụng.

## Stack profile and technology assumptions

- Track: angular. Stack profile: core-ui-angular.
- Evidence: `versions/v19/projects/sdcorejs-angular`, import `@sdcorejs/angular/*`, `AGENTS.md` (v19 là nguồn, v20-v22 dẫn xuất).
- Công cụ: Node đúng `24.22.1` (AGENTS.md); Karma `ChromeHeadlessCI`; `npm run sync`, `npm run check:sync`, `npm run test:scripts`.

## File structure

Trong `versions/v19/projects/sdcorejs-angular/`:

- `services/confirm/src/lib/confirm.service.ts`, `confirm.service.spec.ts` - sửa.
- `services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.{ts,html,scss,spec.ts}` - sửa.
- `services/confirm/src/public-api.ts` - sửa (bỏ export component).
- `services/confirm/sd-confirm.md`, `components/modal/sd-modal.md` - sửa.
- `components/modal/src/modal.component.ts`, `modal.component.spec.ts` - sửa.

Ngoài v19: `CHANGELOG.md` (sửa), các file tương ứng ở `versions/v20`, `v21`, `v22` và `SYNC-STATUS.md` của chúng (chỉ qua `npm run sync`).

## Acceptance criteria

- **AC-001** (tự động, R-001) - Sáu method: mobile mở `MatBottomSheet`; desktop mở `MatDialog` với cấu hình hiện có.
- **AC-002** (tự động, R-002) - `view` ép kiểu hiển thị bất kể thiết bị.
- **AC-003** (tự động, R-003) - `disableClose` đúng bảng quy tắc ở cả hai kiểu hiển thị, cho sáu method.
- **AC-004** (tự động, R-004) - `sd-modal` đúng bảng quy tắc ở cả hai kiểu hiển thị, có và không có `beforeClose`.
- **AC-005** (tự động, R-005, R-001) - Trong `MatBottomSheet` thật: hai nút full-width, cao tối thiểu 44px, nút chính ở trên; bấm nút đóng sheet và trả `{ action, value }`; dialog giữ markup và thứ tự nút.
- **AC-006** (tự động, R-006) - Declaration của `services/confirm` không còn hai symbol; không còn import trong thư viện; CHANGELOG có mục BREAKING kèm hướng dẫn.
- **AC-007** (tự động, R-007) - Full suite v19 có coverage, build v19, `npm run sync`, `npm run check:sync`, `npm run test:scripts` pass; ESLint không có vấn đề trên dòng thêm hoặc sửa; không thêm spec bị bỏ qua.
- **AC-008** (thủ công, R-005) - Trên điện thoại thật, bàn phím ảo không che ô nhập và hai nút của `withInput`.

## Risks & mitigations

- **Risk:** Bỏ export làm vỡ consumer đang import component. -> **Mitigation:** mục BREAKING trong CHANGELOG kèm hướng dẫn; tài liệu vốn ghi component là nội bộ.
- **Risk:** Mọi confirm trên mobile đổi giao diện khi consumer nâng version. -> **Mitigation:** chủ đích (D-001); `view: 'dialog'` là đường lùi.
- **Risk:** Cờ mới lệch với nhánh `beforeClose` của `sd-modal`. -> **Mitigation:** một giá trị `closeAllowed` dùng cho cả hai chỗ; AC-004 phủ cả hai nhánh.
- **Risk:** v20-v22 lệch v19. -> **Mitigation:** chỉ rollout bằng `npm run sync`; `npm run check:sync` là guard.
- **Risk:** Chỉ build và test v19 trong phiên này. -> **Mitigation:** ghi rõ trong execution record; release ritual của repo build đủ bốn dòng.

## Out of scope (deferred)

- Demo confirm trong showcase - khi có yêu cầu.
- Build/test v20, v21, v22 và showcase - trong release ritual.
- Đổi tên cờ cho `sd-side-drawer` - khi có yêu cầu riêng.

## Phụ lục - decision_coverage

```json
{
 "schema_version": 1,
 "revision": 1,
 "records": [
  {
   "id": "R-001",
   "type": "requirement",
   "statement": "Sáu method của SdConfirmService (confirm, withInput, withRadio, withSelect, withDate, withDatetime) mở MatBottomSheet trên mobile và MatDialog trên desktop; chữ ký, kiểu trả về, icon, autoFocus và hợp đồng settle hiện có không đổi.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "services/confirm",
   "task_refs": []
  },
  {
   "id": "R-002",
   "type": "requirement",
   "statement": "Mỗi method nhận option view?: 'dialog' | 'bottom-sheet' để ép kiểu hiển thị bất kể thiết bị.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "services/confirm",
   "task_refs": []
  },
  {
   "id": "R-003",
   "type": "requirement",
   "statement": "SdConfirmService nhận option enableBackdropClose (không truyền = false); disableBackdropClose giữ lại dạng @deprecated; truyền cả hai thì enableBackdropClose quyết định.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "services/confirm",
   "task_refs": []
  },
  {
   "id": "R-004",
   "type": "requirement",
   "statement": "sd-modal nhận input enableBackdropClose với cùng quy tắc, áp dụng nhất quán cho cả nhánh có beforeClose; không truyền thì hành vi theo disableBackdropClose như hiện tại.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "components/modal",
   "task_refs": []
  },
  {
   "id": "R-005",
   "type": "requirement",
   "statement": "Khi confirm hiển thị bottom sheet: hai nút full-width cao tối thiểu 44px xếp dọc, nút chính ở trên, nút Hủy ở dưới; dialog giữ giao diện hiện có.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "services/confirm",
   "task_refs": []
  },
  {
   "id": "R-006",
   "type": "requirement",
   "statement": "DialogConfirmComponent và DialogData không còn được export từ @sdcorejs/angular/services/confirm; thay đổi được ghi là BREAKING trong CHANGELOG.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "services/confirm",
   "task_refs": []
  },
  {
   "id": "R-007",
   "type": "requirement",
   "statement": "Thay đổi làm ở versions/v19 rồi rollout sang v20, v21, v22 bằng npm run sync; tài liệu sd-confirm.md, sd-modal.md và CHANGELOG [Unreleased] được cập nhật; test, build và guard đồng bộ pass.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": "services/confirm",
   "task_refs": []
  },
  {
   "id": "AC-001",
   "type": "acceptance-criterion",
   "statement": "Gọi từng method trong sáu method khi BrowserUtilities.isMobile() là true rồi false, không truyền view -> mobile mở MatBottomSheet; desktop mở MatDialog với cấu hình hiện có (width, panelClass, autoFocus, maxWidth, maxHeight)",
   "behavior": "Gọi từng method trong sáu method khi BrowserUtilities.isMobile() là true rồi false, không truyền view",
   "expected_result": "mobile mở MatBottomSheet; desktop mở MatDialog với cấu hình hiện có (width, panelClass, autoFocus, maxWidth, maxHeight)",
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
   "statement": "Gọi từng method với view 'dialog' trên mobile và view 'bottom-sheet' trên desktop -> kiểu hiển thị theo view, không theo thiết bị",
   "behavior": "Gọi từng method với view 'dialog' trên mobile và view 'bottom-sheet' trên desktop",
   "expected_result": "kiểu hiển thị theo view, không theo thiết bị",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-002"
   ],
   "task_refs": []
  },
  {
   "id": "AC-003",
   "type": "acceptance-criterion",
   "statement": "Mở confirm với các tổ hợp cờ: không truyền; chỉ disableBackdropClose false/true; chỉ enableBackdropClose true; cả hai trái nhau -> disableClose đúng theo bảng quy tắc ở cả dialog và bottom sheet, cho cả sáu method",
   "behavior": "Mở confirm với các tổ hợp cờ: không truyền; chỉ disableBackdropClose false/true; chỉ enableBackdropClose true; cả hai trái nhau",
   "expected_result": "disableClose đúng theo bảng quy tắc ở cả dialog và bottom sheet, cho cả sáu method",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-003"
   ],
   "task_refs": []
  },
  {
   "id": "AC-004",
   "type": "acceptance-criterion",
   "statement": "Mở sd-modal với cùng bảng cờ ở cả dialog và bottom sheet, có và không có beforeClose -> không có beforeClose thì disableClose theo bảng quy tắc; có beforeClose thì disableClose luôn true và nền/Esc chỉ đi qua guard khi bảng quy tắc cho phép đóng",
   "behavior": "Mở sd-modal với cùng bảng cờ ở cả dialog và bottom sheet, có và không có beforeClose",
   "expected_result": "không có beforeClose thì disableClose theo bảng quy tắc; có beforeClose thì disableClose luôn true và nền/Esc chỉ đi qua guard khi bảng quy tắc cho phép đóng",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-004"
   ],
   "task_refs": []
  },
  {
   "id": "AC-005",
   "type": "acceptance-criterion",
   "statement": "Render confirm trong MatBottomSheet thật với đủ nút Có và Hủy, rồi bấm từng nút -> hai nút full-width, cao tối thiểu 44px, nút chính đứng trước nút Hủy theo chiều dọc; bấm nút đóng sheet và trả { action, value }; dialog giữ markup và thứ tự nút hiện có",
   "behavior": "Render confirm trong MatBottomSheet thật với đủ nút Có và Hủy, rồi bấm từng nút",
   "expected_result": "hai nút full-width, cao tối thiểu 44px, nút chính đứng trước nút Hủy theo chiều dọc; bấm nút đóng sheet và trả { action, value }; dialog giữ markup và thứ tự nút hiện có",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-005",
    "R-001"
   ],
   "task_refs": []
  },
  {
   "id": "AC-006",
   "type": "acceptance-criterion",
   "statement": "Build thư viện v19 sau khi bỏ export và tìm import DialogConfirmComponent/DialogData ngoài services/confirm -> index.d.ts của services/confirm không còn hai symbol; không còn import nào trong thư viện; CHANGELOG có mục BREAKING kèm hướng dẫn",
   "behavior": "Build thư viện v19 sau khi bỏ export và tìm import DialogConfirmComponent/DialogData ngoài services/confirm",
   "expected_result": "index.d.ts của services/confirm không còn hai symbol; không còn import nào trong thư viện; CHANGELOG có mục BREAKING kèm hướng dẫn",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-006"
   ],
   "task_refs": []
  },
  {
   "id": "AC-007",
   "type": "acceptance-criterion",
   "statement": "Chạy full suite v19 có coverage, build v19, npm run sync, npm run check:sync, npm run test:scripts và ESLint trên các file đã sửa -> tất cả pass; ESLint không có vấn đề trên dòng thêm hoặc sửa; không thêm spec bị bỏ qua",
   "behavior": "Chạy full suite v19 có coverage, build v19, npm run sync, npm run check:sync, npm run test:scripts và ESLint trên các file đã sửa",
   "expected_result": "tất cả pass; ESLint không có vấn đề trên dòng thêm hoặc sửa; không thêm spec bị bỏ qua",
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
   "statement": "Mở withInput dạng bottom sheet trên điện thoại thật và gõ vào ô nhập -> bàn phím ảo không che ô nhập và hai nút; kết quả kiểm thủ công được ghi lại",
   "behavior": "Mở withInput dạng bottom sheet trên điện thoại thật và gõ vào ô nhập",
   "expected_result": "bàn phím ảo không che ô nhập và hai nút; kết quả kiểm thủ công được ghi lại",
   "verification_kind": "manual",
   "blocking": true,
   "requirement_refs": [
    "R-005"
   ],
   "task_refs": []
  },
  {
   "id": "A-001",
   "type": "assumption",
   "statement": "BrowserUtilities.isMobile() là cách nhận diện mobile, đọc một lần khi service được tạo, giống sd-modal.",
   "source": "explicit",
   "confidence": "high",
   "status": "confirmed",
   "blocking": false,
   "evidence_refs": [
    "versions/v19/projects/sdcorejs-angular/components/modal/src/modal.component.ts"
   ],
   "consequence_if_wrong": "Confirm và sd-modal chọn kiểu hiển thị khác nhau trên cùng thiết bị.",
   "validation_method": "Spec chạy cả hai nhánh bằng cách stub isMobile trước khi tạo service.",
   "owner": "sdcorejs-angular executor",
   "rationale": "Người dùng xác nhận ở bản Core Legacy.",
   "impacted_refs": [
    "R-001"
   ]
  },
  {
   "id": "A-002",
   "type": "assumption",
   "statement": "Bàn phím ảo không che ô nhập của withInput trong bottom sheet.",
   "source": "inferred",
   "confidence": "medium",
   "status": "deferred",
   "blocking": false,
   "evidence_refs": [
    "AC-008"
   ],
   "consequence_if_wrong": "Người dùng mobile không thấy nội dung đang gõ hoặc không bấm được nút.",
   "validation_method": "Kiểm thủ công trên điện thoại thật theo AC-008.",
   "owner": "người dùng (chủ thư viện)",
   "rationale": "Không chứng minh được bằng Karma trên trình duyệt desktop.",
   "revisit_condition": "Kết quả kiểm thủ công AC-008 cho thấy ô nhập hoặc nút bị che.",
   "impacted_refs": [
    "AC-008"
   ]
  },
  {
   "id": "D-001",
   "type": "decision",
   "statement": "Tự chuyển sang bottom sheet theo thiết bị, không cần opt-in.",
   "question": "Confirm trên mobile hiển thị thế nào?",
   "selected_value": "Tự chuyển sang bottom sheet theo thiết bị, không cần opt-in.",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "public-contract",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "Người dùng chọn auto; áp dụng cho cả Core UI mới.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-001",
    "AC-001"
   ],
   "task_refs": []
  },
  {
   "id": "D-002",
   "type": "decision",
   "statement": "Có, thêm option view: 'dialog' | 'bottom-sheet'.",
   "question": "Có cho consumer ép kiểu hiển thị không?",
   "selected_value": "Có, thêm option view: 'dialog' | 'bottom-sheet'.",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "public-contract",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "Đồng bộ với input view của sd-modal.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-002",
    "AC-002"
   ],
   "task_refs": []
  },
  {
   "id": "D-003",
   "type": "decision",
   "statement": "enableBackdropClose cho SdConfirmService và sd-modal; disableBackdropClose giữ @deprecated; enableBackdropClose thắng khi truyền cả hai; sd-side-drawer không đổi.",
   "question": "Tên và quy tắc của cờ cho phép đóng bằng nền?",
   "selected_value": "enableBackdropClose cho SdConfirmService và sd-modal; disableBackdropClose giữ @deprecated; enableBackdropClose thắng khi truyền cả hai; sd-side-drawer không đổi.",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "public-contract",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "Người dùng chọn tên positive, đối xứng với tên cũ.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-003",
    "R-004",
    "AC-003",
    "AC-004",
    "INV-001"
   ],
   "task_refs": []
  },
  {
   "id": "D-004",
   "type": "decision",
   "statement": "Xếp dọc, full-width, cao tối thiểu 44px, nút chính trên, Hủy dưới.",
   "question": "Bố cục nút trên bottom sheet?",
   "selected_value": "Xếp dọc, full-width, cao tối thiểu 44px, nút chính trên, Hủy dưới.",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "public-contract",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "Người dùng chọn ở bản Core Legacy.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-005",
    "AC-005"
   ],
   "task_refs": []
  },
  {
   "id": "D-005",
   "type": "decision",
   "statement": "Không; bỏ export DialogConfirmComponent và DialogData, ghi BREAKING trong CHANGELOG.",
   "question": "DialogConfirmComponent có còn là API công khai không?",
   "selected_value": "Không; bỏ export DialogConfirmComponent và DialogData, ghi BREAKING trong CHANGELOG.",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "public-contract",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "Người dùng yêu cầu ở bản Legacy vì consumer không dùng; tài liệu vốn ghi component là nội bộ.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-006",
    "AC-006"
   ],
   "task_refs": []
  },
  {
   "id": "D-006",
   "type": "decision",
   "statement": "Sửa versions/v19 rồi npm run sync; không sửa tay v20-v22; không đổi showcase; không bump version, commit, push, tag hay publish.",
   "question": "Phạm vi giao hàng?",
   "selected_value": "Sửa versions/v19 rồi npm run sync; không sửa tay v20-v22; không đổi showcase; không bump version, commit, push, tag hay publish.",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "repository",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "Theo AGENTS.md của repo và phạm vi người dùng giao.",
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
   "id": "INV-001",
   "type": "invariant",
   "statement": "Mọi call hiện có không truyền view hay enableBackdropClose giữ nguyên chữ ký, kiểu trả về, kết quả resolve/reject, icon, autoFocus và khả năng đóng bằng nền; dialog desktop và hành vi beforeClose của sd-modal không đổi.",
   "protected_refs": [
    "R-001",
    "R-003",
    "R-004",
    "R-007",
    "AC-007"
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
    }
   ],
   "tombstones": []
  }
 ]
}
```
