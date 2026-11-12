---
schema_version: 1
artifact_id: "execution-confirm-mobile-bottom-sheet-core-ui-r1"
artifact_kind: "execution-doc"
change_ref: "confirm-mobile-bottom-sheet-core-ui"
source_spec: ".sdcorejs/specs/angular/2026-11-12-11-36-confirm-mobile-bottom-sheet.md"
source_plan: ".sdcorejs/plans/angular/2026-11-12-11-40-confirm-mobile-bottom-sheet.md"
commit_policy: "with-change"
owner: "sdcorejs-execute-plan"
owner_repository_id: "sdcorejs-angular"
owner_repository_role: "library"
owner_module_id: "services/confirm"
repository_relative_path: ".sdcorejs/docs/angular/2026-11-12-confirm-mobile-bottom-sheet-execution.md"
source_revision: "7051ec8e18aaf242b6a4c03d8da6d69735d71895"
track: "angular"
stack_profile: "core-ui-angular"
status: "executed-uncommitted"
---

# Execution record - Confirm dùng bottom sheet trên mobile và cờ enableBackdropClose (Core UI)

Ngày thực thi: 2026-11-12. Nhánh `main`, HEAD `7051ec8e18aaf242b6a4c03d8da6d69735d71895`. Thay đổi nằm trong working tree, **chưa commit**.

- Plan: `.sdcorejs/plans/angular/2026-11-12-11-40-confirm-mobile-bottom-sheet.md` (`sha256:v1:9c533a073484117434e3550f554b406f165d1b39d09cf3a0ef815098e999d72f`)
- Thẩm quyền: delegated-session-scope. Người dùng chọn "Giao mình làm trọn" cho phần port; họ không đọc duyệt spec, kiến trúc hay plan.
- Executor: thực thi tuần tự trong phiên điều phối (generic harness của `sdcorejs-execute-plan`), vì đây là mã nguồn của chính thư viện Core UI.

## Preflight

| Mục | Kết quả |
| --- | --- |
| Working tree trước khi sửa | Sạch |
| Node | `v24.22.1` portable (zip chính thức từ nodejs.org, SHA-256 khớp `SHASUMS256.txt`), đặt trong thư mục tạm của phiên, chỉ dùng cho repo này. Node mặc định của máy là v26.13.0 và không bị đổi |
| Dependency | `versions/v19/node_modules` có sẵn; không chạy `npm ci` |
| Baseline spec confirm + modal (v19) | 140/140 pass |

## Task

| Task | Trạng thái | Ghi chú |
| --- | --- | --- |
| TASK-001 | Xong | Test mới trong `confirm.service.spec.ts`. Chạy trước khi sửa service: 74 ca fail đúng lý do |
| TASK-002 | Xong | Sáu method đi qua `#open`; thêm `view`, `enableBackdropClose`; `disableBackdropClose` gắn `@deprecated`; cấu hình dialog cũ giữ nguyên; `#settleOnClose` dùng lại cho `afterDismissed` |
| TASK-003 | Xong | Test mới trong `dialog-confirm.component.spec.ts`, gồm 3 ca trên `MatBottomSheet` thật. Chạy trước khi sửa component: file không biên dịch được |
| TASK-004 | Xong | Ref/data tùy chọn cho dialog hoặc bottom sheet; phần đầu và trường nhập dùng chung một template; nhánh sheet không dùng `mat-dialog-*`; nút `block` + `size="lg"`; điều kiện disable nút Có chuyển thành getter `acceptDisabled` dùng cho cả hai nhánh |
| TASK-005 | Xong | Test mới trong `modal.component.spec.ts`: bảng 9 dòng cờ × 2 kiểu hiển thị, mặc định, 3 ca với `beforeClose`. Chạy trước khi sửa: file không biên dịch được |
| TASK-006 | Xong | Input `enableBackdropClose`; `#backdropCloseAllowed()` dùng cho `disableClose` và điều kiện gắn guard `beforeClose` |
| TASK-007 | Xong | Bỏ export `DialogConfirmComponent`/`DialogData`; cập nhật `sd-confirm.md`, `sd-modal.md`; CHANGELOG dưới `[Unreleased]`: mục BREAKING, Added, Changed, Deprecated (section mới) và một mệnh đề trong "Before upgrading" |
| TASK-008 | Xong | `npm run sync`. Nội dung thay đổi ở v20, v21, v22 đúng 11 file tương ứng + `SYNC-STATUS.md` mỗi dòng |
| TASK-009 | Xong | File này |

## Thay đổi nội dung (49 file sửa, 1 file tạo)

- `versions/v19/projects/sdcorejs-angular/`: `services/confirm/src/lib/confirm.service.ts`, `confirm.service.spec.ts`, `components/dialog-confirm/dialog-confirm.component.{ts,html,scss,spec.ts}`, `services/confirm/src/public-api.ts`, `services/confirm/sd-confirm.md`, `components/modal/src/modal.component.ts`, `modal.component.spec.ts`, `components/modal/sd-modal.md` (11 file).
- `versions/v20`, `v21`, `v22`: 11 file tương ứng mỗi dòng, sinh bởi `npm run sync`.
- `versions/v19..v22/SYNC-STATUS.md`: dòng "Updated At" do script sync ghi (4 file). Plan chỉ liệt kê v20-v22; script cũng ghi v19.
- `CHANGELOG.md`.
- Tạo mới: file này.

## Lệnh đã chạy (Node v24.22.1)

| Lệnh | Exit | Kết quả |
| --- | --- | --- |
| Spec riêng confirm + modal (`versions/v19`) | 0 | 277/277 pass (baseline 140) |
| `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage` (`versions/v19`) | 0 | 9933/9933 pass; coverage Statements 88.94%, Branches 80.74%, Functions 88.16%, Lines 91.21%; threshold đạt |
| `npm run build` (`versions/v19`) | 0 | Build xong; không file `.d.ts` nào của `services/confirm` trong public entry còn export component |
| ESLint trên 8 file `.ts`/`.html` đã sửa (`versions/v19`) | 0 | 0 lỗi, 0 cảnh báo |
| `npm run sync` | 0 | Đồng bộ v19 sang v20, v21, v22 |
| `npm run check:sync` | 0 | "v20, v21, v22 match v19" (chạy lại sau khi dọn line ending, vẫn pass) |
| `npm run test:scripts` | 0 | fail 0 |

Không chạy: cài đặt, build và test ở v20, v21, v22; showcase; `lint:release`; `deploy.ps1`; publish. **Ba dòng dẫn xuất chưa được build hay test trong phiên này**; chỉ có guard đồng bộ nguồn.

## Tiêu chí chấp nhận

| AC | Trạng thái | Bằng chứng |
| --- | --- | --- |
| AC-001 | Đạt | Sáu method: mobile mở `MatBottomSheet`; desktop mở `MatDialog` với `width`, `panelClass`, `maxWidth`, `maxHeight`, `autoFocus` như cũ |
| AC-002 | Đạt | `view` ép kiểu hiển thị cho sáu method |
| AC-003 | Đạt | Bảng 6 dòng cờ × 6 method × 2 kiểu hiển thị |
| AC-004 | Đạt | Bảng 9 dòng cờ × 2 kiểu hiển thị; với `beforeClose`: `disableClose` luôn true, nền chỉ tới guard khi được phép |
| AC-005 | Đạt | Bottom sheet thật: 2 nút cao >= 44px, rộng bằng vùng nút, nút Có ở trên; bấm nút trả `{ action, value }`; dialog giữ markup và thứ tự nút |
| AC-006 | Đạt | `public-api.ts` chỉ export service; không còn import hai symbol ngoài `services/confirm/src/lib`; CHANGELOG có mục BREAKING kèm diff hướng dẫn |
| AC-007 | Đạt | Các lệnh ở bảng trên; không thêm spec bị bỏ qua |
| AC-008 | **Chờ người dùng** | Chưa kiểm trên điện thoại thật |

## Điểm khác với dự kiến và điều cần biết

- **Line ending sau sync.** `versions/v22` có thuộc tính Git `eol=lf`, còn v19 trên máy Windows này là CRLF. `npm run sync` (robocopy) chép CRLF sang v22 nên Git báo 1631 file "đã sửa" dù nội dung không đổi. Đã trả đúng 1631 file đó về bản trong index bằng `git checkout` (đã kiểm từng file không có khác biệt nội dung trước khi trả). Sau đó working tree còn đúng 49 file sửa và `check:sync` vẫn pass.
- **`showcase/src/app/docs/generated/changelog.generated.ts` có thể đã cũ** so với `CHANGELOG.md` vừa sửa. Không sinh lại vì `showcase/**` nằm ngoài phạm vi; `npm run test:scripts` vẫn pass.
- **Kiểu của `acceptDisabled`.** Biểu thức disable nút Có trước đây nằm trong template; nay là getter trong component với cùng logic, dùng cho cả dialog và bottom sheet.
- **Nhận diện mobile theo user agent**, đọc một lần khi service được tạo; thu nhỏ cửa sổ desktop không chuyển sang bottom sheet.
- **API consistency (AGENTS.md).** `view` cùng tên, kiểu và nghĩa với input `view` của `sd-modal`. `enableBackdropClose` có ở confirm và `sd-modal`, chưa có ở `sd-side-drawer` (theo quyết định D-003). Independent review: chưa thực hiện.
- **Không có demo confirm trong showcase** nên không có thay đổi showcase.

## Ảnh bằng chứng

- Ảnh chụp từ showcase (`/v/latest/services/confirm/examples`) bằng Chrome headless, lưu ở `.sdcorejs/handoff/screenshots/confirm-mobile-bottom-sheet/`: bốn ảnh mobile (viewport 390x844, user agent iPhone) cho `confirm`, xác nhận xóa, `withInput`, `withRadio` dạng dọc; hai ảnh desktop cho dialog giữ nguyên.
- Kích thước nút đo được khi chụp: 358x48px mỗi nút trên bottom sheet mobile; dialog desktop giữ nút cao 32px.
- Để chụp ảnh đã chạy `npm --prefix showcase ci --legacy-peer-deps` và `npm --prefix showcase run link:library` (theo AGENTS.md) rồi `ng serve showcase`. Không file nào của `showcase/` được Git theo dõi bị đổi. Trong ảnh, nền trang có khối "Published examples could not be loaded" vì showcase chạy cục bộ không tải được tài liệu đã publish; không liên quan thay đổi này.

## Chưa làm

- Chưa commit, push, tag, bump version hay publish. Repo dùng nhánh `main`; AGENTS.md yêu cầu hỏi người dùng trước khi push.
- Chưa cắt release: heading `[Unreleased]` giữ nguyên.
- Chưa build/test v20, v21, v22 và showcase.
- Chưa chạy cổng `sdcorejs-ship`.
- AC-008 chờ người dùng kiểm thủ công.
