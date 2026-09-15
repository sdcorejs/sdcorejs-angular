---
artifact_id: execution-action-popover-r1
artifact_kind: execution-doc
change_ref: angular-action-popover-20260914
owner: sdcorejs-angular
source_spec: .sdcorejs/specs/angular/2026-09-14-action-popover.md
source_plan: .sdcorejs/plans/angular/2026-09-14-action-popover.md
commit_policy: with-change
---

# Action Popover — implementation và verification

## Kết quả

SdButton tự bật action mode bằng signal content query khi có SdButtonItem. SdButtonItemDivider không tự bật action mode. Primitive nội bộ SdActionPopover dùng CDK Overlay, FlexibleConnectedPositionStrategy và TemplatePortal; mỗi button sở hữu lifecycle riêng, tạo overlay khi mở và dispose khi đóng/destroy. Không có dependency hoặc singleton mới.

Public export mới: SdButtonItem và SdButtonItemDivider từ `@sdcorejs/angular/components/button`. Item dùng chính SdButtonColor, prefixIcon/suffixIcon và SdIcon/SdIconSet hiện có; hỗ trợ disabled, tooltip, autoId và click Event. Divider có title tùy chọn cho heading nhóm. Destructive dùng error; HTML type vẫn là htmlType.

Projected label là fallback cho title. Angular có thể project cả khối @if nhiều root vào default slot, nên sau render Button đưa các marker host ẩn do hai definition components tạo ra vào container definitions ngoài native trigger. Angular vẫn sở hữu views và TemplateRef label; native menuitems chỉ render trong portal. Không clone label hoặc render button tương tác bên trong trigger. Cách này cũng tránh cảnh báo selective projection NG8011 cho consumer khai báo nhiều children trong một @if.

Menu đóng trước khi phát item click; callback mở dialog không bị kéo focus lại. Normal button giữ click throttle, loading/disabled, submit/reset và size defaults. Action trigger không phát normal click/submit và không ghi đè suffixIcon.

DesktopCommand và SelectorAction chỉ map model hiện có sang definitions; icon cũ map sang prefixIcon. Callback đọc row/selection hiện tại. Khi thay cả row wrapper, resolver async dựng lại command và đóng menu cũ; mở lại dùng row mới. Mobile modal, filter menus và permission/eligibility resolvers giữ luồng hiện có.

## Các file chính

Đường dẫn thư viện dưới `versions/v19/projects/sdcorejs-angular/`:

- Thêm `components/button/src/action-popover.ts` và `action-popover.scss`: overlay, positioning, keyboard/focus, cleanup và presentation dùng token.
- Thêm `components/button/src/button-item.component.ts`, `button-item-divider.component.ts`.
- Sửa `components/button/index.ts`, `components/button/src/button.component.ts`, `.html`, `.scss`.
- Thêm `components/button/src/button-action-popover.spec.ts`.
- Sửa `components/table/src/components/command/desktop-command.component.ts`, `.html`, `.scss`, `.spec.ts`.
- Sửa `components/table/src/components/selector-action/selector-action.component.ts`, `.html`, `.scss`, `selector-action-layout.component.spec.ts`.
- Sửa `components/table/src/table.component.ts`, `.html`: export Excel/CSV dùng popover, bỏ MatMenuModule tại Table.
- Xóa `components/table/src/components/action-menu/action-menu.ts` và `action-menu.scss`; không còn directive SdTableMenuButtonDirective hay popup stylesheet riêng trong flow đã migrate.
- Cập nhật `components/button/sd-button.md`, `components/table/sd-table.md`.

Showcase/repo:

- Thêm `showcase/src/app/pages/components/button/examples/button-action-popover.example.ts`, `.html`.
- Sửa `showcase/src/app/pages/components/button/button-demo.component.ts` và `showcase/src/app/docs/core/documentation.registry.ts`.
- Sửa `showcase/src/app/docs/core/documentation.registry.spec.ts`, `showcase/src/app/docs/pages/page/docs-page.component.spec.ts`: số lượng và thứ tự demo hiện tại.
- Cập nhật `CHANGELOG.md` và generate lại `showcase/src/app/docs/generated/{changelog,example-manifest,example-sources}.generated.ts`.
- Mirror v20/v21/v22 và SYNC-STATUS bằng `npm run sync`; không hand-edit source dẫn xuất.
- Lưu bộ spec/architecture/plan đã được người dùng duyệt và xác minh approval graph bằng helper của skill.

Các sửa trước về checkbox size, disabled secondary text icon, padding selection 8px và hai Table children demos được giữ lại. Danh sách trên mô tả change Action Popover; working tree còn có các thay đổi từ yêu cầu trước.

## Kiểm tra đã chạy

Node 22.22.3, ChromeHeadless trên Windows.

| Kiểm tra | Kết quả cuối |
|---|---|
| Red test trước implementation | Fail vì chưa export SdButtonItem/SdButtonItemDivider, đúng thiếu API |
| `npm --prefix versions/v19 test -- --watch=false --browsers=ChromeHeadless` | 5.435 pass |
| `npm --prefix showcase test` | 206 pass |
| `npm run test:scripts` | 160 pass |
| `npm run lint:release` | v19/v20/v21/v22 đều pass |
| `npm --prefix versions/v{19,20,21,22} run build` (từng line riêng) | Cả bốn pass, gồm Angular template/type checking |
| `npm --prefix showcase run build` | Pass |
| `npm run check:sync` | Pass, v20/v21/v22 khớp canonical v19 |
| `git diff --check` | Pass |

Showcase không có lint script riêng; không báo một kết quả Showcase lint riêng. Build Showcase còn cảnh báo CommonJS của dependency có sẵn. Không có số phần trăm coverage được xác nhận trong lần chạy này.

## Kiểm tra UI thật

- Button popover: mở menu, semantic prefix/suffix icons và disabled item; End + Enter bỏ qua item disabled và chạy action đúng, menu đóng.
- Dynamic: chọn “Ẩn tất cả item” đóng menu; trigger về normal mode và phát normal click. DOM kiểm tra không có `button sd-button-item` hoặc `button button`.
- Desktop screenshot: menu flip lên trên khi trigger gần đáy, layout compact, màu success/error nằm trên icon.
- Viewport 375×700: menu nằm gọn, align end với offset 4px. Resize khi mở sang 320×480: menu reposition và vẫn nằm trong viewport; Escape trả focus trigger.
- Command Table: “Kiểm kho” ở SP-001 trả `12`, sau đó ở SP-002 trả `8`; không stale row.
- Selection Action: “Kiểm kho” trả danh sách chọn hiện tại `SP-001`.
- Quick search export: menu Excel/CSV dùng popover; chọn CSV đóng menu, console không có lỗi trong lần kiểm tra. Không khẳng định đã đối chiếu nội dung file tải về.

Unit tests bổ sung bao phủ normal submit, toggle, outside click, Escape/Tab/arrows/Home/End, disabled, dynamic zero/add, theme token, document scroll reposition, viewport flip, dispose/multiple triggers và row/selection thay đổi khi menu đang mở. Mobile regression được chạy trong full library suite; không thay implementation mobile modal.

## Mở demo

- Button: `http://127.0.0.1:4200/v/latest/components/button/examples#components-button-example-action-popover`
- Command: `http://127.0.0.1:4200/v/latest/components/table/examples#components-table-example-lenh-dong-co-menu-con`
- Selection Action: `http://127.0.0.1:4200/v/latest/components/table/examples#components-table-example-action-da-chon-co-menu-con`

Không tạo npm release, tag hoặc Pages archive trong change này.

## Follow-up: openOnHover (2026-09-14)

User approved adding the previously proposed booleanAttribute input, default false. Reuses the component-local popover owner; pointer entry opens without moving focus, 150ms exit timer bridges the panel gap, keyboard focus cancels hover dismissal. Timers are disposed with the overlay; touch remains click-only.

Changed canonical button.component.ts/html, action-popover.ts, button-action-popover.spec.ts and sd-button.md; synced derived versions. Updated the existing showcase example, generated catalogs and CHANGELOG.md.

Verification: canonical v19 full Karma suite 5438 SUCCESS, script suites 160 passed, v19 lint/build and check:sync passed. Three new regression cases cover coercion/default, touch, focus, pointer transition/timers, keyboard takeover, click, disabled/loading, option changes and destruction.

Showcase production build passed after serializing library linking and server startup. Preview is running on port 4200; browser verified the new button, ArrowDown navigation and action callback. Hover pointer timing is verified in Karma using PointerEvent/fakeAsync; no manual browser hover claim.

## Follow-up: conditional chevron (2026-09-15)

Chevron is rendered only when the action trigger is not icon-only and has no suffixIcon. Icon-only action triggers use the existing square button footprint. Desktop table commands retain 24px width; selection overflow uses more_horiz as its suffix. Labeled action groups retain the default chevron.

Projected text changes are observed locally with MutationObserver and disposal cleanup; tests wait for observer delivery before checking the resulting class/indicator. No new consumer option or table model field. Updated Button/Table docs, CHANGELOG and the existing Action Popover showcase, including a new icon-only example.

Final follow-up checks: 5439 library tests SUCCESS (single run, seed 5048), 160 script tests passed, v19 lint/build and check:sync passed. Showcase development compilation passed and port 4200 is serving. In-app browser verification was unavailable due ERR_NETWORK_CHANGED/navigation timeout; no new manual UI verification claimed.
