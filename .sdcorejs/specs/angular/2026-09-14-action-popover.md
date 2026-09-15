---
{
  "approval_source": "explicit-user-choice",
  "approved_at": "2026-09-14T09:21:09.511Z",
  "approved_by": "user",
  "artifact_id": "spec-action-popover-r1",
  "artifact_kind": "spec",
  "change_ref": "angular-action-popover-20260914",
  "commit_policy": "with-change",
  "contract_id": "angular-action-popover-20260914",
  "owner": "sdcorejs-spec",
  "owner_module_id": null,
  "owner_repository_id": "sdcorejs-angular",
  "owner_repository_role": "library",
  "parent_references": [],
  "parent_repository_id": null,
  "repository_relative_path": ".sdcorejs/specs/angular/2026-09-14-action-popover.md",
  "requirement_id": "R-001",
  "schema_version": 1,
  "sourceDraftPath": ".sdcorejs/docs/angular/2026-09-14-action-popover-spec.md",
  "source_revision": "864789c8d1d76f393dcc834a4dab872c6eb18278",
  "stack_profile": "core-ui-angular",
  "supersedes": null,
  "track": "angular",
  "approval_hash": "sha256:v1:5077f0a98a6f39fc30b75c41a62c764a5b53021ac46ed098261dc37cd086dd68"
}
---

# Spec — Action Popover cho SdButton

Yêu cầu nguồn: tài liệu Action Popover người dùng đính kèm; ngày 2026-09-14 người dùng cho phép soạn spec và kế hoạch. Đây là bản dự thảo để duyệt, chưa phải phê duyệt implementation. Architecture và plan đi kèm cũng là dự thảo để có thể review cả phương án trong một lượt.

## Vấn đề và mục tiêu

Button chưa hỗ trợ khai báo action con. Desktop Command và Selection Action Table có menu CDK và stylesheet riêng; menu export của Table còn dùng Material menu. Cần một Action Popover chung, kích hoạt tự động từ children của SdButton, giữ API và dữ liệu của consumer hiện tại.

## Yêu cầu và quyết định

| ID | Hợp đồng cần thực hiện | Nguồn / chủ sở hữu |
|---|---|---|
| R-001 | Không có item: giữ defaults, click throttle 300ms, disabled/loading, icon và submit như hiện tại; không tạo overlay/chevron. | Yêu cầu B/N; Button |
| R-002 | Có ít nhất một `sd-button-item`: tự bật action mode; click toggle, không phát action click thông thường của trigger, không submit. Divider đơn độc không kích hoạt. | B/M/O; Button |
| R-003 | Public standalone `SdButtonItem`, `SdButtonItemDivider`; item có projected label, `color`, `prefixIcon`, `suffixIcon`, `fontSet`, `disabled`, `tooltip`, output `click: Event`. Không thêm `icon`, `theme` hay color type mới. | C–G; Button |
| R-004 | Query children phản ứng với @if/@for; thứ tự item/divider giữ nguyên; cập nhật label/icon/color/disabled; về zero item đóng overlay và trở lại normal. | M; Button |
| R-005 | Một implementation CDK Overlay/Portal chung chịu positioning, keyboard/focus, outside click và cleanup; không biết row/selection/permission. | H/I/R; primitive |
| R-006 | Popover compact dùng token surface/text/border; item cao ít nhất 40px, coarse pointer 44px; icon 18–20px, gap 8px, padding ngang 12px; min-width 160px giới hạn theo viewport. | J; primitive |
| R-007 | Table chỉ map model hiện tại sang item; giữ hidden, disabled, tooltip, htmlTemplate, màu, fontSet, autoId và callback/context hiện tại. | P/Q; Table |
| R-008 | Docs, demo, test và source mirror đủ bốn Angular major; không sửa archive release bằng tay. | T/U/W; repo |

Quyết định D-001: tái sử dụng chính xác `SdButtonColor = Color | 'black'`; destructive dùng `error`, không thêm alias `danger`. Nguồn: button.component.ts và mục D/V trong yêu cầu. Trạng thái: đề xuất để duyệt.

Quyết định D-002: submit dùng `htmlType`, còn `type` giữ `fill | light | outline | text`. Có item thì native trigger dùng type button. Normal submit/reset giữ nguyên. Nguồn: API thực tế và mục O. Trạng thái: đề xuất để duyệt.

Quyết định D-003: `title` tiếp tục hoạt động và ưu tiên khi được truyền; projected trigger label dùng khi không có title. Action definitions được project riêng ngoài native button. Chevron cuối cùng không ghi đè suffixIcon. Nguồn: backward compatibility và mục G/K. Trạng thái: đề xuất để duyệt.

Quyết định D-004: Table model hiện có `icon`, không có suffixIcon; giữ model, map icon → prefixIcon. Không tự thêm disabled vào bulk-action model vốn chỉ có hidden. Permission tiếp tục do resolver/conditional render hiện có xử lý. Nguồn: table-command.model.ts, table-option-selector.model.ts. Trạng thái: đề xuất để duyệt.

Quyết định D-005: migrate popup desktop Command, Selection Action (children/overflow) và menu export Excel/CSV. Filter configuration menu không thuộc action flow này. Mobile row-action modal giữ luồng hiện có (busy/error/close-before-run); đó là modal responsive, không tạo implementation Action Popover thứ hai. Nguồn: code hiện tại và yêu cầu giữ responsive behavior. Trạng thái: đề xuất phạm vi để duyệt rõ.

## Giả định

- A-001: không cần submenu nhiều tầng; children của Table chuyển thành action phẳng hoặc nhóm có heading/divider trong cùng panel. Nguồn: model hiện tại và mục V; độ tin cậy cao; kiểm tra bằng table integration tests.
- A-002: projected label là nội dung trình bày, không chứa input/link/button tương tác. Nguồn: menuitem pattern và mục G; ghi rõ trong docs; kiểm tra native DOM không lồng button.
- A-003: các sửa đổi trước về disabled icon, padding selection 8px và showcase đang chưa commit phải được giữ. Nguồn: working tree; kiểm tra diff và regression tests.

## Architecture gate

Required: public API mới, dependency Button/Table và state/lifecycle ownership cần thống nhất. Dự thảo chi tiết: `../architecture/2026-09-14-action-popover-architecture.md`. Không có dependency hoặc backend/data-access mới.

## Acceptance criteria

| ID | Điều kiện nghiệm thu | Evidence dự kiến |
|---|---|---|
| AC-001 | Normal button không overlay/chevron; click throttle, disabled/loading và submit/reset không đổi. | Button regression tests |
| AC-002 | Một item tự kích hoạt, click mở/đóng; action trigger không submit hay gọi normal click. | Host fixture có form |
| AC-003 | Item click phát đúng một lần, đóng menu; disabled không chạy, không focus. | Unit + keyboard tests |
| AC-004 | Prefix, suffix, cả hai, fontSet/provider và toàn bộ vocabulary màu dùng API Core; default text neutral, semantic accent rõ. | Render tests + browser |
| AC-005 | Divider đúng thứ tự, không focus/click; chỉ divider vẫn là normal button. | Unit tests |
| AC-006 | Trigger label và item definitions không tạo nested interactive HTML; item buttons chỉ tồn tại khi overlay mở. | DOM tests |
| AC-007 | Dynamic add/remove, zero↔nonzero, disabled/color/icon/label update đúng ngay khi mở. | Signal host tests |
| AC-008 | ARIA menu/menuitem, haspopup/expanded/controls đúng; icon-only trigger có accessible name từ tooltip hoặc title. | Accessibility DOM tests |
| AC-009 | Enter/Space, Up/Down, Home/End, Escape đầy đủ; skip disabled/divider; Escape phục hồi focus; Tab đóng và tiếp tục thứ tự tab hợp lý, không trap. | Keyboard + browser |
| AC-010 | Mở dưới align end; flip trên; fallback ngang; margin 8px, offset 4px; không tràn viewport, scroll/resize reposition. | Position tests + browser ở cạnh viewport |
| AC-011 | Outside click đóng; không giành focus khỏi mục tiêu vừa click; destroy/disable/loading đóng và dọn overlay/subscription; nhiều trigger không nhầm menu. | Lifecycle/integration tests |
| AC-012 | Command giữ hidden async, disabled theo row, htmlTemplate, icon/color/fontSet, primary command và autoId. | DesktopCommand tests |
| AC-013 | Mở row A rồi B, thay row object/reuse view, action gọi đúng data hiện tại; không giữ closure row cũ. | Table integration tests |
| AC-014 | Bulk actions giữ eligibility theo mọi selected row, nhóm/overflow và callback selection mới nhất, kể cả preserveSelection xuyên trang. | SelectorAction tests |
| AC-015 | Export Excel/CSV chạy đúng callback qua popover mới; responsive/mobile modal và padding 8px không đổi. | Table regression + browser |
| AC-016 | Không còn popup implementation riêng cho các flow đã migrate; bộ demo đủ các case mục U, có status callback để kiểm tra. | Reference search + Showcase |
| AC-017 | Lint, unit/integration, generator/sync guards và build thật đạt; public export sử dụng được ở cả bốn line. | Các lệnh trong plan |

## Rủi ro và cách hạn chế

- Focus khi callback mở dialog: đóng popover trước, không restore focus sau khi callback đã chuyển focus.
- Query content lẫn action con của button khác: chỉ nhận definitions thuộc chính trigger; kiểm tra ownership bằng fixture nhiều button.
- Native button đổi khi type thay đổi: dispose/rebind origin và ARIA; kiểm tra khi đang mở.
- Theme CSS trong portal không còn ancestor của trigger: dùng token theo theme hiện có, tránh selector phụ thuộc Table; kiểm tra theme override.
- Layout row command đang compact 24px: giữ footprint/hit-area hiện có bằng adapter style được giới hạn phạm vi; kiểm tra mật độ và overflow.

## Ngoài phạm vi

Menu framework nhiều tầng, global menu manager, dependency mới, permission framework, thay API Table, chỉnh filter menus, publish npm/Pages/tag release. Không đổi size defaults hay các behavior ngoài action mode.

## File structure và kiểm tra

Canonical source: `versions/v19/projects/sdcorejs-angular/components/button/` và `components/table/`. Public export từ button/index.ts; demo ở `showcase/src/app/pages/components/{button,table}/`. Mirror v20–v22 bằng sync; các đường dẫn và thứ tự thao tác nằm trong plan đi kèm.

Tự review: 8 nhóm yêu cầu ánh xạ 17 AC; khác biệt giữa examples yêu cầu và API thực tế đã ghi thành D-001/D-002/D-004; mobile boundary D-005 được nêu rõ để duyệt. Chưa có test implementation nào được thực thi cho feature này.
