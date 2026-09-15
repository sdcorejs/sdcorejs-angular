---
artifact_id: architecture-action-popover-r1-draft
artifact_kind: architecture
contract_id: angular-action-popover-20260914
change_ref: angular-action-popover-20260914
owner: sdcorejs-architecture
owner_repository_id: sdcorejs-angular
owner_repository_role: library
track: angular
source_spec: .sdcorejs/docs/angular/2026-09-14-action-popover-spec.md
source_plan: none
commit_policy: with-change
status: draft
approved: false
revision: 1
---

# Architecture — Action Popover

Dự thảo đồng bộ với spec r1, trình duyệt chung theo yêu cầu người dùng. Chưa phải approved snapshot; không có approval hash được tự tạo.

## Component và dependency

```text
DesktopCommand / SelectorAction / Table export
  → SdButton (native trigger, content query, normal button contract)
    → internal action-popover (CDK Overlay + TemplatePortal, lifecycle/focus)
    → SdButtonItem / SdButtonItemDivider (declarative definitions)
      → SdIcon (renderer/provider có sẵn)
```

Table phụ thuộc public button entrypoint. Button/primitive không import Table. Types được tái sử dụng bằng type-only import nếu cần để tránh runtime cycle. Primitive không export public; chỉ export hai declarative components mới qua button barrel. Không root singleton/provider mới, không thay package manifest.

## Frontend architecture

| Đơn vị | Trách nhiệm và state | Lifetime / đăng ký | Kiểm chứng |
|---|---|---|---|
| SdButton | Inputs hiện có, query definitions, hasActions, trigger content và ARIA; điều phối mở/đóng | Standalone OnPush, signal queries; một instance/trigger | AC-001/002/006/007/008 |
| SdButtonItem | Inputs và click output, TemplateRef của projected label; không render native button tại chỗ | Standalone, marker host ẩn; được consumer import từ button | AC-003/004/006 |
| SdButtonItemDivider | Marker phân cách trong ordered query; không hành vi | Standalone, cùng token definition nội bộ | AC-005 |
| Internal popover | OverlayRef/Portal, vị trí, active item, listeners/subscriptions, focus | Một owner gắn lifetime SdButton; tạo overlay lười khi mở | AC-009/010/011 |
| Table adapters | Resolve hidden/disabled/icon/title/context như hiện có; map sang definitions | Lifetime row/selection component; không cache row trong primitive | AC-012–015 |

Không cần route mới, store, facade, network call hay data-access service. Showcase chỉ bổ sung example component theo convention hiện có.

## Content projection và API

Definition item/divider được query theo một token nội bộ chung để giữ thứ tự. Slots item/divider nằm ngoài native trigger; slot mặc định chỉ render label khi không có title. Mỗi item giữ label TemplateRef; native menuitem được primitive render trong portal. Không chuyển/mutate consumer DOM bằng tay.

Trigger có prefix/suffix hiện tại và chevron nội bộ ở cuối. Chevron không thay input suffixIcon. Icon-only action trigger có accessible label; width của action mode phải tính thêm chevron, không ép c-square gây clip. Table adapter giới hạn style để giữ density row hiện tại.

Menuitem có projected label, SdButtonColor, prefixIcon/suffixIcon string nullable theo Button, SdIconSet, disabled booleanAttribute, tooltip và click Event. FontSet không truyền tiếp tục theo configured SdIcon provider. Consumer dùng @if/permission directive hiện có để ẩn item; không thêm visible/permission/loading APIs vào item ở revision này.

## Invariants

- INV-001 (R-001/002): zero items không tạo OverlayRef; action mode không chạy normal click throttle/submit. Kiểm chứng AC-001/002/007.
- INV-002 (R-003/005): chỉ một popup implementation, không phụ thuộc Table; public color/icon vocabulary giữ nguyên. Kiểm chứng AC-004/016 và dependency review.
- INV-003 (R-004/007): event chạy context hiện tại, không lưu row trong overlay; remove definition không để action cũ khả dụng. Kiểm chứng AC-007/013/014.
- INV-004 (R-005): overlay owner dispose khi destroy; close không cướp focus sau khi action mở dialog. Kiểm chứng AC-009/011.
- INV-005 (R-003): marker không chứa native menuitem trong trigger DOM; không focus divider/disabled. Kiểm chứng AC-003/005/006.

## Position, keyboard và close contract

FlexibleConnectedPositionStrategy: end/bottom → end/top; end/top → end/bottom; start/bottom → start/top; start/top → start/bottom. Offset ±4px, viewport margin 8px, max-width min(320px, viewport minus 16px), max-height theo viewport; reposition scroll strategy. Dùng CDK focus/key utilities khi phù hợp, không tự tạo global event manager.

Open bằng click/Enter/Space/ArrowDown focus first enabled; ArrowUp focus last. Trong menu, Up/Down wrap, Home/End chọn biên, Enter/Space kích hoạt; divider/disabled bỏ qua. Tab đóng rồi tiếp tục native focus traversal từ trigger; Escape đóng/restore nếu trigger còn connected. Outside click đóng không restore. Item activation đóng trước khi emit để callback có thể mở dialog an toàn. Khi item đang focus bị xóa/disable, chuyển focus tới enabled item còn lại hoặc container.

Listeners dùng lifecycle cleanup. Thay native trigger do đổi type đóng/dispose hoặc cập nhật origin an toàn. Khi mở một trigger khác, outside-pointer handling của CDK đóng panel cũ mà không làm sai context; không thêm singleton.

## Table và trust boundary

Giữ resolver hiện có cho command.hidden async, command.disabled và selection eligibility. `icon` trong Table map sang `prefixIcon`; htmlTemplate giữ Angular sanitization hiện tại, không dùng bypassSecurityTrustHtml mới. Item callback đọc row/selection hiện tại. Group overflow giữ nhãn nhóm dễ đọc; không mở submenu mới.

Desktop children/selection overflow và export là flow migrate. Mobile modal hiện có giữ busy/error/closeBeforeRun; không thêm popup riêng vào mobile. Filter configuration menu ngoài phạm vi. Thiết kế không thay security/permission ownership.

## Review và bằng chứng cần có

Đã đối chiếu button component/barrel, command models/resolvers, selector action resolver/template, mobile action component và export menu. Boundary một chiều và owner overlay thống nhất; chưa có dependency mới. Cần chạy AC-001–017 trong plan sau khi duyệt; không coi đọc source là bằng chứng runtime.
