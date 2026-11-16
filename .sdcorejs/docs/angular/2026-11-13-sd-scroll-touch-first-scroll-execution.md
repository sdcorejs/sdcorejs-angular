---
artifact_id: "execution-sd-scroll-touch-first-scroll-core-ui-r1"
artifact_kind: "execution-doc"
change_ref: "sd-scroll-touch-first-scroll-core-ui"
commit_policy: "with-change"
owner: "sdcorejs-execute-plan"
owner_module_id: "directives/sd-scroll"
owner_repository_id: "sdcorejs-angular"
owner_repository_role: "library"
repository_relative_path: ".sdcorejs/docs/angular/2026-11-13-sd-scroll-touch-first-scroll-execution.md"
schema_version: 1
source_plan: ".sdcorejs/plans/angular/2026-11-13-10-34-sd-scroll-touch-first-scroll.md"
source_spec: ".sdcorejs/specs/angular/2026-11-13-10-26-sd-scroll-touch-first-scroll.md"
stack_profile: "core-ui-angular"
status: "executed"
track: "angular"
---

# Execution record - sdScroll cuộn ngang được ngay lần chạm đầu (Core UI) - 2026-11-13

## Contract

| Mục | Giá trị |
| --- | --- |
| Spec đã duyệt | `.sdcorejs/specs/angular/2026-11-13-10-26-sd-scroll-touch-first-scroll.md` (`sha256:v1:82b5789a4acbf603b43929222d517ca594248b7ffd6e618e1208f250b2c091de`) |
| Plan đã duyệt | `.sdcorejs/plans/angular/2026-11-13-10-34-sd-scroll-touch-first-scroll.md` (`sha256:v1:731ebdd7a2a9a2c150a544d7191658966bf96889fe0c7cfd02bf8b3ee00cef53`) |
| Architecture gate | not-applicable (`bounded-bug-fix`) |
| `prepareExecution` | hợp lệ (strict-v2, not-applicable), chạy trên HEAD `184e557f` trước khi đổi branch; mọi đường dẫn ghi qua `authorizePlanWrite`; working tree sạch |
| Branch | `fix/sd-scroll-touch-first-scroll` tách từ `origin/main` `ff1e5d60` (sau `git fetch`) |
| Executor | parent, tuần tự (`execution_policy: sequential`); không dùng executor sinh màn hình vì thay đổi nằm trong mã nguồn thư viện |
| Node | v24.22.1 portable có sẵn từ phiên trước, đặt đầu PATH chỉ cho lệnh của repo này; Node mặc định v26.13.0 không đổi |

## Tasks

| Task | Kết quả |
| --- | --- |
| TASK-001 | `versions/v19/.../sd-scroll.directive.spec.ts` (cùng 19 case với bản Legacy). RED: 15 fail, 4 pass trên code cũ. |
| TASK-002 | Tạo `versions/v19/.../sd-scroll-pointer.service.ts` (`SdScrollPointerService` root, một listener `change`; không export). |
| TASK-003 | Sửa `versions/v19/.../sd-scroll.directive.ts` (cùng thiết kế với Legacy; giữ `private elementRef`/`renderer` qua `inject()` và overload `constructor(...args: unknown[])`). GREEN: 19/19. |
| TASK-004 | `versions/v19/.../sd-scroll.md` (cùng nội dung bản Legacy, import path `@sdcorejs/angular/directives`). |
| TASK-005 | `CHANGELOG.md` `[Unreleased]` > `### Fixed` > `#### Scroll`. |
| TASK-006 | `npm run sync` sang v20, v21, v22. |
| TASK-007 | Kiểm chứng (dưới đây) và file này. |

## Lệnh đã chạy (Node v24.22.1)

| Lệnh | Exit | Kết quả |
| --- | --- | --- |
| `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts` (RED, `versions/v19`) | 1 | 15 FAILED, 4 SUCCESS |
| Cùng lệnh (GREEN) | 0 | 19 SUCCESS |
| `npm run sync` (root) | 0 | v19, v20, v21, v22 synchronized |
| `npm run check:sync` (root) | 0 | "v20, v21, v22 match v19" |
| `npm run test:scripts` (root) | 0 | pass |
| `npx eslint` trên 3 file `.ts` của v19 | 0 | 0 lỗi, 0 cảnh báo |
| `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage` (`versions/v19`) | 0 | 9945/9945 SUCCESS, seed 5664; coverage Statements 88.95%, Branches 80.76%, Functions 88.18%, Lines 91.22%; threshold đạt |
| `npm run build` (`versions/v19`) | 0 | build thư viện xong (84s) |
| So `dist/sdcorejs-angular/directives/index.d.ts` và `src/sd-scroll.directive.d.ts` trước/sau | - | `index.d.ts` giống hệt; d.ts của directive cùng thành viên và chữ ký (chỉ đổi thứ tự, thêm JSDoc); service không có trong index |
| Quét mojibake file đã sửa | - | 0 |

## AC-008 (thủ công)

Đã kiểm trên showcase của Core Legacy (cùng code directive). Ở chế độ điện thoại 375x812, `sd-table` có `overflow-x: auto` ngay khi tải và cuộn ngang được lần đầu mà không cần bấm trước (`scrollLeft` 0 -> 500); ở desktop vẫn ẩn khi nghỉ và hiện khi rê chuột. Chưa chạy showcase của Core UI. Cử chỉ vuốt thật chưa kiểm được bằng công cụ trình duyệt; cần người dùng xác nhận.

## Ghi chú và sai lệch

- **Branch confirm đã merge:** plan ghi `feat/confirm-mobile-bottom-sheet` chưa merge và có thể phải gộp `[Unreleased]` của CHANGELOG. Sau khi duyệt plan, `git fetch` cho thấy nó đã được squash-merge vào `main` thành `ff1e5d60` (#149). Bước tách branch từ `origin/main` giữ nguyên; rủi ro gộp CHANGELOG không còn. `directives` và `CHANGELOG.md` giống hệt giữa `184e557f` và `ff1e5d60`.
- **Line ending sau sync:** như lần trước, `npm run sync` làm Git báo 1639 file v22 "đã sửa" chỉ vì khác ký tự xuống dòng (`versions/v22/.gitattributes` có `eol=lf`). Đã kiểm bằng `git diff --ignore-cr-at-eol` rằng không file nào khác nội dung, rồi trả đúng 1639 file đó về bản trong index bằng `git checkout --pathspec-from-file`. Một `index.lock` rỗng do lệnh `git diff` bị dừng của chính phiên này được xoá sau khi xác nhận không còn tiến trình git nào chạy. Working tree còn đúng 17 file sửa và 4 file service mới (v19-v22) cùng artifact `.sdcorejs/`.
- Không build/test v20, v21, v22 và showcase Core UI (thuộc release ritual).
- Không commit, push hay tạo PR.
