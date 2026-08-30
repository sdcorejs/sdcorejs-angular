# Spec - Accessibility cho shared components gốc, release v2.1 - 2026-08-30 11:42

```yaml
spec_context:
  source: sdcorejs-spec
  contract_id: sdcorejs-angular-shared-accessibility-v2-1
  requirement_id: REQ-SDANGULAR-A11Y-2-1
  approved_spec_path: .sdcorejs/specs/angular/2026-08-30-11-42-shared-components-accessibility-v2-1.md
  approved_spec_hash: sha256:v1:282fbf72b526746f833dde06849fb1c93b2ab339c54069b3065be5dfe198afcd
  supersedes: null
  target_root: .
  target_root_kind: target-project
  owner_repository_id: github.com/sdcorejs/sdcorejs-angular
  owner_repository_role: library
  owner_module_id: shared-components
  execution_host_repository_id: github.com/sdcorejs/sdcorejs-angular
  track: angular
  stack_profile: core-ui-angular
  profile_confidence: high
  source_requirement_context: user request and approved approach 1, 2026-08-30
  acceptance_criteria_count: 14
  manual_criteria_count: 0
  non_goals:
    - Chỉnh sửa enterprise-portal hoặc module Knowledge
    - Thay đổi public API hiện tại của SdSection, Sidebar v1 hoặc SdBadge
    - Suppress hoặc allowlist axe, hạ severity, hay patch node_modules
    - Sửa Sidebar v2, Sidebar v3, mobile sidebar hoặc component ngoài phạm vi
    - Nâng dependency hoặc xử lý npm audit ngoài phạm vi accessibility này
  risks:
    - Thay đổi semantic DOM có thể ảnh hưởng selector CSS hoặc test của consumer
    - Thay wrapper tương tác bằng native control có thể làm click bị phát hai lần nếu không chặn bubbling
    - Token màu tùy biến của consumer có thể khác theme mặc định
    - Release một suffix tạo đồng thời ba exact version cho Angular 19, 20 và 21
  assumptions:
    - origin không có nhánh dev; origin/main là nguồn code mới nhất được phép dùng
    - Release suffix tiếp theo là v2.1, tương ứng 19.2.1, 20.2.1 và 21.2.1
    - Các màn filters/ranking là consumer evidence; fix phải nằm tại shared component gốc
  redaction_applied: false
  approval:
    approved: true
    approved_at: 2026-08-30T04:51:52.855Z
    approval_source: explicit-user-choice
  change_control:
    revision: 1
    supersedes: null
    change_reason: null
```

## Problem & Goals

Các consumer như filters/ranking đang nhận lỗi accessibility từ semantic và styling của shared components gốc. Phạm vi lỗi gồm `aria-hidden-focus`, `button-name`, `link-name`, `color-contrast`, và quan hệ `list`/`listitem` không hợp lệ. Sửa tại consumer sẽ nhân đôi workaround và gây xung đột với module Knowledge; vì vậy thay đổi phải nằm trong package `@sdcorejs/angular` tại `SdSection`, Sidebar v1 và `SdBadge`.

Mục tiêu:

1. Mọi interactive control do ba component render có semantic native hoặc ARIA tương đương, accessible name ổn định và trạng thái focus hợp lệ.
2. Nội dung bị thu gọn không còn lộ focusable descendant cho accessibility tree.
3. Sidebar v1 có cấu trúc tree/group/treeitem hợp lệ, không dùng `li` ngoài list container.
4. `SdBadge` dùng cặp foreground/background token có độ tương phản đạt chuẩn trên theme mặc định.
5. Giữ nguyên selector component, inputs, outputs, kiểu TypeScript và hành vi click/navigation công khai.
6. Phát hành suffix `v2.1`, tạo đúng ba phiên bản `@sdcorejs/angular@19.2.1`, `20.2.1`, `21.2.1`.

## Non-goals

- Không chỉnh `enterprise-portal`, kể cả filters/ranking hoặc module Knowledge.
- Không đổi public API, không thêm breaking input/output và không đổi tên selector.
- Không sửa Sidebar v2/v3/mobile hoặc các component không cần thiết để đóng năm nhóm lỗi.
- Không dùng axe suppression, allowlist, severity override, skip rule hay patch trong `node_modules`.
- Không nâng package phụ thuộc, chạy `npm audit fix`, hoặc xử lý vulnerability tồn tại từ baseline.
- Không thay đổi branding của theme ngoài việc chọn đúng foreground/background token hiện có.

## Architecture

### SdSection

Header tiếp tục nhận click để giữ tương thích hành vi, nhưng wrapper không còn giả làm button khi có thể chứa projected interactive controls. Trigger thu gọn là native `<button type="button">` riêng, có accessible name, `aria-expanded` và `aria-controls`. Click từ control được project vào header không được toggle section; click trigger không được bubble thành lần toggle thứ hai.

Body thu gọn phải bị loại khỏi DOM hoặc được vô hiệu hoá focus một cách chuẩn; không được đặt `aria-hidden="true"` lên container vẫn chứa control có thể focus. Section không collapsible không thêm tab stop hay button semantics.

### Sidebar v1

Các nút icon/group/pin/toggle có accessible name lấy từ text/i18n hiện hữu và trạng thái tương ứng. Home và navigation link có tên có thể tính được, không dùng URL `javascript:` và vẫn giữ router/external navigation hiện tại.

Cây menu dùng semantic `tree`/`treeitem`/`group` hợp lệ. Không render `li` nếu ancestor không phải `ul`, `ol` hoặc `menu`. Branch giữ `aria-expanded`; leaf và branch có focus/keyboard behavior hiện tại. Subtree bị đóng vẫn dùng focus isolation (`inert` hoặc bị loại khỏi DOM) để không tái tạo `aria-hidden-focus`.

### SdBadge

Badge chỉ có interactive semantics khi click output thực sự được bind, như API hiện tại. Khi interactive, accessible name được suy ra theo thứ tự từ nội dung hiển thị có nghĩa (`title`, `description`, tooltip) rồi tới fallback ổn định cho icon-only badge; khi không interactive, badge không nhận `role="button"` hay `tabindex`.

Các biến thể màu dùng token foreground đậm trên token background nhạt hiện có. Theme mặc định phải đạt contrast ratio tối thiểu `4.5:1` cho text thông thường; token vẫn là điểm tùy biến để consumer theme không mất khả năng override.

### Compatibility và version fan-out

Chỉ sửa source-of-truth trong `versions/v19`. `npm run sync` sinh cùng thay đổi cho v20/v21 và `npm run check:sync` xác nhận parity. Không đổi export barrel hoặc declaration public. Changelog và docs component được cập nhật cùng commit.

Tag release `v2.1` phải trỏ đúng commit đã push trên `main`; pipeline publish ba exact version nêu trên. Không dùng dist-tag hay semver range làm bằng chứng hoàn thành.

## Stack profile and technology assumptions

- Track: `angular`; stack profile: `core-ui-angular`.
- Angular 19 là source-of-truth; Angular 20/21 được đồng bộ bằng script repo.
- Component standalone, signals, OnPush và native control flow tiếp tục theo convention hiện tại.
- Không thêm dependency test hoặc runtime mới.
- Baseline tại `origin/main` (`120c9f875defe361b783f86b64920581c9841377`) có `4825` test thành công trước thay đổi.
- `origin` hiện chỉ có `main`, không có `dev`; triển khai bắt đầu từ latest `origin/main` theo lựa chọn đã duyệt.

## File structure

Sửa tại source-of-truth v19:

- `versions/v19/projects/sdcorejs-angular/components/section/src/section.component.{ts,html,scss}`
- `versions/v19/projects/sdcorejs-angular/components/section/src/section.component.spec.ts`
- `versions/v19/projects/sdcorejs-angular/components/section/sd-section.md`
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/main.component.{ts,html,scss}` khi cần cho shell-level names/focus
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/main.component.spec.ts`
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.{ts,html,scss}`
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.spec.ts`
- `versions/v19/projects/sdcorejs-angular/modules/layout/sd-layout.md`
- `versions/v19/projects/sdcorejs-angular/components/badge/src/badge.component.{ts,html,scss}`
- `versions/v19/projects/sdcorejs-angular/components/badge/src/badge.component.spec.ts`
- `versions/v19/projects/sdcorejs-angular/components/badge/sd-badge.md`
- `CHANGELOG.md`

Sinh bằng script, không sửa tay:

- `versions/v20/**`
- `versions/v21/**`

Không tạo hoặc sửa file trong `enterprise-portal` hay `node_modules`.

## Test strategy (RED-first)

Trước mỗi nhóm implementation, thêm regression test và chạy test đích để lưu bằng chứng fail vì hành vi cũ:

1. `aria-hidden-focus`: projected focusable control của `SdSection`, subtree Sidebar v1 bị thu gọn và clickable `SdBadge` không nằm dưới ancestor `aria-hidden`; subtree ẩn không thể focus.
2. `button-name`: mọi button/role-button do ba component render có computed-name source không rỗng; gồm trigger section, group/pin/toggle Sidebar và icon-only interactive badge.
3. `link-name`: home/navigation anchors của Sidebar có text hoặc ARIA naming source không rỗng và href không phải `javascript:`.
4. `color-contrast`: test cặp token mặc định tính contrast ratio và yêu cầu `>= 4.5`; template/SCSS phải tham chiếu đúng foreground token.
5. `list/listitem`: DOM Sidebar không chứa `li` ngoài `ul`/`ol`/`menu`; treeitem/group nesting và `aria-expanded` hợp lệ.

Sau RED, thay đổi production nhỏ nhất để GREEN, rồi chạy lại suite component. Không cấu hình axe để bỏ rule và không biến warning thành pass.

## Acceptance criteria

- **AC-001** — `SdSection` collapsible có đúng một native trigger mang accessible name không rỗng, `aria-expanded` đúng trạng thái và `aria-controls` trỏ tới body tồn tại khi mở.
- **AC-002** — Click header trống vẫn toggle như trước; click projected button/link không toggle; click trigger chỉ toggle đúng một lần; Enter/Space hoạt động theo native button.
- **AC-003** — Khi section đóng, không có focusable descendant nằm dưới `aria-hidden`; section không collapsible không thêm tab stop hoặc button role.
- **AC-004** — Mọi control icon/group/pin/toggle do Sidebar v1 render có accessible name không rỗng và state ARIA phù hợp.
- **AC-005** — Home và menu links của Sidebar v1 có accessible name không rỗng, không dùng `javascript:` URL, và giữ nguyên internal/external navigation contract.
- **AC-006** — Sidebar v1 không render `li` có parent semantic không hợp lệ; menu thể hiện quan hệ `tree` → `treeitem` → `group` và branch công bố `aria-expanded`.
- **AC-007** — Subtree Sidebar v1 bị đóng không thể nhận focus và không tạo `aria-hidden-focus`; mở lại khôi phục keyboard navigation hiện tại.
- **AC-008** — `SdBadge` có click binding là focusable/keyboard-activatable, có accessible name kể cả icon-only; badge không có click binding vẫn không interactive.
- **AC-009** — Mọi biến thể màu mặc định của `SdBadge` dùng foreground/background token đạt contrast ratio tối thiểu `4.5:1`; custom CSS variables vẫn override được.
- **AC-010** — Selector, input/output, exported TypeScript symbols và event/navigation behavior công khai của ba component không đổi.
- **AC-011** — Có RED-first regression evidence cho đủ năm nhóm lỗi; không có axe suppression/allowlist/severity override và không có patch trong `node_modules`.
- **AC-012** — `npm run sync` và `npm run check:sync` xác nhận v19/v20/v21 đồng nhất; full test, lint, typecheck và build của release đều xanh.
- **AC-013** — Commit release không chứa thay đổi ngoài repo `sdcorejs-angular`, không chứa `enterprise-portal`, và được push lên nhánh release phù hợp rồi tích hợp vào `main` theo workflow repo.
- **AC-014** — Tag `v2.1` trỏ đúng commit trên `origin/main`; registry trả về chính xác `@sdcorejs/angular@19.2.1`, `@sdcorejs/angular@20.2.1`, `@sdcorejs/angular@21.2.1` sau publish.

## Risks & mitigations

- **Semantic DOM làm vỡ CSS/consumer selector.** Giữ nguyên host selectors/classes khi có thể; thêm DOM-shape regression assertions và build cả ba major.
- **Double toggle do event bubbling.** Test riêng header, projected interactive control và native trigger; trigger dừng propagation tại boundary component.
- **Accessible fallback trở thành nhãn khó hiểu.** Ưu tiên visible text/tooltip/i18n; fallback chỉ dành cho icon-only state và được test ổn định.
- **Contrast chỉ đúng với theme mặc định.** Khóa regression bằng token mặc định chính thức, đồng thời giữ CSS variables để consumer chịu trách nhiệm cho custom palette.
- **Publish ba major từ một tag.** Xác minh tag/commit trước push, theo dõi pipeline và kiểm tra từng exact version trên npm registry.

## Out of scope (deferred)

- Audit toàn bộ accessibility của Sidebar v2/v3/mobile và component khác.
- Thay đổi UX hoặc visual redesign của filters/ranking.
- Tự động điều chỉnh màu tùy biến do consumer cung cấp.
- Dependency upgrades và remediation cho audit findings của baseline.
