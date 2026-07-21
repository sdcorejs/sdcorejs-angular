---
name: add-layout-sidebar-v2-v3
description: Approved contract for responsive V1 compatibility and new V2/V3 desktop/mobile sidebar variants.
contract_id: sdcorejs-angular-layout-sidebar-v2-v3-v1
requirement_id: layout-sidebar-v2-v3-20260720
approvedAt: 2026-07-20T17:26:37+07:00
approvedBy: nghiatt15@onemount.com
approval_source: explicit-user-choice
track: angular
target_root_kind: target-project
stack_profile: core-ui-angular
profile_confidence: high
sourceDraftPath: .sdcorejs/docs/angular/2026-07-20-17-21-add-layout-sidebar-v2-v3-spec.md
approved_spec_hash: 7539a4b40d54e95f77706c4e9c029d02ca1056618f4c304a5e2aaecd1c2fdf2c
acceptance_criteria_count: 20
manual_criteria_count: 1
redaction_applied: false
supersedes: null
change_control:
  revision: 1
  supersedes: null
  change_reason: null
---

# Bổ sung Sidebar V2/V3 cho Layout Module - Approved Spec

> Snapshot of what the user approved at the `sdcorejs-spec` gate. Do not edit by hand; re-author through `sdcorejs-spec` if the contract changes.

## Approved contract

# Spec - Bổ sung Sidebar V2/V3 cho Layout Module - 2026-07-20 17:21

```yaml
spec_context:
  source: sdcorejs-spec
  contract_id: sdcorejs-angular-layout-sidebar-v2-v3-v1
  requirement_id: layout-sidebar-v2-v3-20260720
  approved_spec_path: .sdcorejs/specs/angular/2026-07-20-17-26-add-layout-sidebar-v2-v3.md
  approved_spec_hash: 7539a4b40d54e95f77706c4e9c029d02ca1056618f4c304a5e2aaecd1c2fdf2c
  supersedes: null
  target_root: C:/Users/nghiatt15_onemount/Documents/sdcorejs/sdcorejs-angular
  target_root_kind: target-project
  track: angular
  stack_profile: core-ui-angular
  profile_confidence: high
  source_requirement_context: layout-sidebar-v2-v3-20260720
  acceptance_criteria_count: 20
  manual_criteria_count: 1
  non_goals:
    - Thay đổi backend menu, permission model hoặc route contract của ứng dụng
    - Redesign brand/theme tổng thể ngoài các sidebar mới
    - Bump version, publish package, tạo tag hoặc release
  risks:
    - Responsive động làm thay đổi behavior V1 đã tồn tại
    - Storage cũ chứa menu object có thể không tương thích với key-based state mới
    - Hover-lock có thể gây lỗi accessibility hoặc overlay bị kẹt
    - Full Karma hiện có 15 baseline failures không thuộc feature này
  assumptions:
    - versions/v19 là source of truth và v20/v21 chỉ nhận rollout qua root sync
    - Recent của V3 bật mặc định và lưu tối đa 5 menu
    - Showcase có preview tương tác cho V1/V2/V3 ở desktop và mobile
    - Menu id là định danh ưu tiên; path và vị trí cây chỉ là fallback tương thích
  redaction_applied: false
  approval:
    approved: true
    approved_at: 2026-07-20T17:26:37+07:00
    approval_source: explicit-user-choice
  change_control:
    revision: 1
    supersedes: null
    change_reason: null
```

## Problem & Goals

Layout Module hiện chỉ hỗ trợ `SidebarConfigurationV1`. Desktop V1 dùng rail kết hợp tree làm thay đổi chiều rộng content khi sidebar mở hoặc khóa; mobile V1 dùng topbar và full-screen overlay. Việc xác định mobile dựa vào `BrowserUtilities.isMobile()` tại thời điểm khởi tạo nên layout không phản ứng khi viewport thay đổi.

Mục tiêu là giữ tương thích V1, bổ sung hai cặp sidebar mới và chuẩn hóa responsive state dùng chung:

- **V2 - Navigation Rail + Context Flyout:** desktop giữ rail cố định và mở flyout phủ trên content; mobile dùng tối đa ba primary menu cùng nút **Thêm** và bottom sheet.
- **V3 - Unified Drawer + Search First:** desktop dùng một drawer có thể thu gọn thành rail; mobile dùng drawer; cả hai ưu tiên Global Search, Pinned và Recent.
- V1, V2 và V3 chuyển desktop/mobile theo viewport theo thời gian thực, không reload hoặc tự điều hướng.
- Public API là discriminated union theo `version`; mỗi version cố định cặp desktop/mobile tương ứng.
- Feature được phát triển và kiểm thử tại v19, sau đó rollout sang v20/v21.

Thành công nghĩa là consumer hiện dùng `version: 1` vẫn compile và giữ các action hiện có, consumer có thể chọn `version: 2 | 3`, responsive switching hoạt động ổn định, state được lưu đúng phạm vi, menu không làm lộ mục thiếu permission, và ba Angular workspace giữ parity.

## Non-goals

- Không thay đổi cấu trúc route, backend cung cấp menu, permission codes hoặc cơ chế `MenuPipe` lọc permission.
- Không yêu cầu `id` trên `SdLayoutMenu` trở thành bắt buộc, vì đây sẽ là breaking type change.
- Không thay đổi selector `sd-layout`, contract `menus`, `userInfo`, `signout`, `changePassword` hoặc projected content.
- Không redesign Home/Forbidden/Not Found modules hay Showcase shell chung.
- Không thêm UI framework hoặc runtime dependency mới; Angular Material/CDK và Core UI hiện có là baseline.
- Không bump package version, tạo release branch/tag, publish npm hoặc deploy Showcase.

## Architecture

### Public configuration contract

`ISdSidebarConfiguration` trở thành discriminated union của `SidebarConfigurationV1 | SidebarConfigurationV2 | SidebarConfigurationV3`. Các thuộc tính chung hiện có (`brandColor`, `brandLightColor`, `logoUrl`, `defaultTitle`, `pin`) được gom vào một base contract nội bộ nhưng tên và semantics công khai của V1 không đổi.

`ISdLayoutConfiguration` bổ sung `mobileBreakpoint?: number`, mặc định `1024`. Viewport `< mobileBreakpoint` dùng mobile component; viewport từ breakpoint trở lên dùng desktop component. Giá trị không hợp lệ phải fallback về mặc định thay vì làm layout không render.

V2 bổ sung:

```ts
interface SidebarConfigurationV2 extends SidebarConfigurationBase {
  version: 2;
  interaction?: "click" | "hover-lock";
  primaryMenuIds?: string[];
}
```

- `interaction` mặc định `click`.
- `primaryMenuIds` nhận tối đa ba ID duy nhất. ID không tồn tại hoặc trùng bị bỏ qua; danh sách được bù theo thứ tự top-level menu cho đủ tối đa ba mục.

V3 bổ sung:

```ts
interface SidebarConfigurationV3 extends SidebarConfigurationBase {
  version: 3;
  defaultCollapsed?: boolean;
  recent?: {
    enabled?: boolean;
    maxItems?: number;
  };
}
```

- `defaultCollapsed` mặc định `false` và chỉ áp dụng khi chưa có lựa chọn đã lưu.
- `recent.enabled` mặc định `true`; `recent.maxItems` mặc định `5`, được chuẩn hóa về một giới hạn dương an toàn.

### Responsive composition

`SdLayoutComponent` là composition root standalone, đọc một responsive signal dùng chung và render đúng cặp component theo `sidebar.version`. Responsive primitive phải test được, dọn listener khi destroy và guard môi trường không có `window`; không tiếp tục dùng user-agent như nguồn quyết định layout.

V1 desktop/mobile hiện tại được giữ làm compatibility pair nhưng mọi nhánh layout-specific trong subtree phải nhận cùng responsive state. Khi đi qua breakpoint, layout đổi component mà không reload trang, không phát sinh navigation và không để lại overlay/listener.

### V2 behavior

Desktop V2 giữ rail luôn hiện diện. Flyout có chiều rộng độc lập và phủ lên content để content không đổi margin khi mở hoặc khóa.

- Với `click`, click/Enter/Space trên rail item mở hoặc đổi flyout; click lại, click backdrop, `Escape` hoặc navigation thành công sẽ đóng.
- Với `hover-lock`, pointer enter/focus mở preview; click khóa flyout; pointer leave chỉ đóng khi chưa khóa; `Escape` đóng và bỏ khóa. Keyboard không phụ thuộc hover.
- Search chỉ tìm trong nhóm đang mở, trên cây menu đã lọc permission. Pinned dùng chung dữ liệu với V1/V3.

Mobile V2 hiển thị các primary group đã chuẩn hóa và nút **Thêm**. Group có children mở bottom sheet theo ngữ cảnh; leaf menu điều hướng trực tiếp; **Thêm** hiển thị các nhóm còn lại. Sheet đóng khi backdrop/`Escape`/navigation, giữ focus hợp lệ và không che content sau khi đổi breakpoint.

### V3 behavior

Desktop V3 dùng một drawer thống nhất, mở rộng mặc định và cho phép thu thành icon rail. User preference đã lưu ưu tiên hơn `defaultCollapsed`. Thu gọn/mở rộng không làm mất route active, Pinned, Recent hoặc query hiện tại.

Mobile V3 dùng drawer overlay có search sticky, Pinned, Recent và menu tree. Drawer đóng khi backdrop/`Escape`/navigation và khôi phục focus về trigger.

Global Search tạo index từ menu đã qua permission filter, tìm không phân biệt hoa thường trên title/tooltip phù hợp và trả về leaf routes có thể điều hướng. Recent ghi nhận tối đa số lượng đã cấu hình, loại trùng theo stable key và đưa route mới nhất lên đầu.

### Navigation identity and persistence

Stable key ưu tiên `menu.id`, sau đó `path`; fallback cuối cùng chỉ phục vụ menu group legacy và không được làm API `id` trở thành required. State không còn tham chiếu lâu dài tới menu object đã stale.

- Pinned và Recent là dữ liệu dùng chung giữa V1/V2/V3.
- Trạng thái UI như collapsed, active group, locked flyout hoặc drawer-open được namespace theo version; transient overlay-open state không phục hồi sau reload.
- Storage V1 dạng menu object được đọc tương thích và migrate lười sang stable keys. Entry không còn tồn tại hoặc không còn permission bị bỏ qua an toàn.
- Không lưu user info, permission payload, search query hoặc dữ liệu nhạy cảm mới.

### Compatibility, permissions and accessibility

`version: 1` cùng toàn bộ cấu hình hiện hữu vẫn type-check. User menu, sign out, change password, logo/title/brand và projected content xuất hiện ở cả ba version. Search, Pinned, Recent và bottom navigation chỉ sử dụng menu sau permission filtering.

Rail items, drawer controls, search result, pin actions và overlay phải dùng semantic button/link phù hợp; có accessible name, focus-visible, `aria-expanded`/`aria-current` khi áp dụng, thứ tự Tab hợp lý và `Escape` behavior nhất quán. Motion tôn trọng `prefers-reduced-motion`.

### Showcase and documentation

`sd-layout.md` mô tả union config, migration/compatibility V1, behavior desktop/mobile, storage và ví dụ cấu hình V1/V2/V3. Showcase cung cấp preview tương tác có selector version và desktop/mobile viewport để kiểm tra navigation anatomy mà không thay Showcase shell toàn cục.

## Stack profile and technology assumptions

- Track: `angular`.
- Stack profile: `core-ui-angular`.
- Profile evidence: package `@sdcorejs/angular`; Angular workspaces v19/v20/v21; standalone Layout components; Angular Material/CDK và signals đã được dùng trong source.
- Source of truth: `versions/v19`; rollout dùng root `npm run sync`, parity dùng `npm run check:sync`.
- Architecture mode: standalone-first; không thêm NgModule ownership mới ngoài entrypoint hiện hữu.
- Coverage approach: TDD RED-first cho responsive/config/storage/search/interaction; CSS và visual behavior được browser smoke sau khi automated behavior tests GREEN.
- Baseline test note: full Karma gần nhất có 3.198 pass, 15 fail và 9 skip; feature không được tuyên bố sửa các baseline failures ngoài scope, nhưng không được tạo regression mới.

## Functional requirements

- Consumer chọn đúng layout pair bằng `sidebar.version` mà không cấu hình desktop/mobile riêng.
- Tất cả version phản ứng khi viewport đi qua breakpoint đã cấu hình.
- V2 hỗ trợ cả `click` và `hover-lock`, với `click` là mặc định.
- V2 mobile chuẩn hóa tối đa ba primary groups và luôn có đường vào phần menu còn lại.
- V3 hỗ trợ persisted collapsed preference, global search, Pinned và Recent.
- Shared navigation state giữ cùng user preference qua các version nhưng không trộn UI state không tương đương.
- Active route được thể hiện đúng sau navigation, reload và responsive switch.
- User actions và permission filtering giữ nguyên contract hiện tại.

## API, data, security and dependency implications

- Public type surface thêm V2/V3 và optional `mobileBreakpoint`; không xóa hoặc đổi tên V1 symbols.
- Không thêm backend API, persistence server, permission code hoặc network call.
- Local storage chỉ lưu stable menu keys và UI preferences; stale/unauthorized keys không được render hoặc xuất hiện trong search.
- Không thêm dependency mới hoặc nâng Angular/Material/CDK/RxJS.
- Sync-generated v20/v21 source phải tương đương v19, ngoại trừ shim Angular-major đã được script quản lý.

## UI/UX constraints

- V2 desktop không làm content đổi width khi flyout mở/khóa.
- V2 mobile giữ tối đa bốn bottom-nav targets gồm tối đa ba primary groups và **Thêm**.
- V3 desktop mở rộng mặc định; collapsed rail vẫn hiển thị tooltip/accessible label.
- V3 mobile drawer dùng chiều rộng responsive có giới hạn, không khóa scroll/focus sau khi đóng.
- Brand color, logo và title dùng cùng fallback semantics như V1.
- Empty search, menu rỗng, missing icon/logo và danh sách Recent/Pinned rỗng có trạng thái hiển thị rõ ràng, không throw.

## File structure

- `versions/v19/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.ts` - mở rộng public discriminated union và optional responsive/V2/V3 config.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/layout-main/*` - composition root responsive cho ba version và regression tests mới.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/**` và `sidebar-mobile-v1/**` - nhận responsive state dùng chung nhưng giữ V1 contract/UX.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/**` - tạo desktop rail/flyout cùng focused tests.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/**` - tạo bottom navigation/bottom sheet cùng focused tests.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/**` - tạo unified desktop drawer cùng focused tests.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/**` - tạo unified mobile drawer cùng focused tests.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/**` - tạo/reuse menu tree, search result và accessible navigation primitives dùng chung khi tránh duplication.
- `versions/v19/projects/sdcorejs-angular/modules/layout/services/**` - thêm responsive/navigation-state abstraction, mở rộng storage migration và tests.
- `versions/v19/projects/sdcorejs-angular/modules/layout/{components,services}/index.ts` - cập nhật internal exports cần thiết.
- `versions/v19/projects/sdcorejs-angular/modules/layout/sd-layout.md` - tài liệu API, compatibility và ví dụ ba version.
- `versions/v19/projects/showcase/src/app/pages/modules/layout/**` - tạo preview tương tác và tests cho desktop/mobile V1/V2/V3.
- `versions/v19/projects/showcase/src/app/docs/core/documentation.registry.ts` và `.spec.ts` - nối Layout page với preview và cập nhật registry expectations.
- `versions/v20/**` và `versions/v21/**` tương ứng - rollout từ v19 bằng root sync; không hand-edit shared implementation.
- `versions/v19|v20|v21/SYNC-STATUS.md` - cập nhật metadata rollout mà không ghi đè thay đổi ngoài scope.

## Acceptance criteria

- AC-001 - `ISdSidebarConfiguration` là union của V1/V2/V3; consumer code hợp lệ dùng `version: 1` trước thay đổi vẫn type-check mà không cần thêm property.
- AC-002 - `mobileBreakpoint` mặc định `1024`; viewport `< 1024` render mobile pair và viewport `>= 1024` render desktop pair. Breakpoint hợp lệ do consumer truyền được áp dụng; giá trị không hợp lệ fallback an toàn.
- AC-003 - V1, V2 và V3 chuyển layout theo thay đổi viewport trong runtime mà không reload, không phát navigation và không để lại listener/overlay sau component destroy.
- AC-004 - V2 desktop luôn giữ rail; mở, khóa hoặc đổi flyout không làm đổi content width/margin và chỉ hiển thị menu thuộc group đang active.
- AC-005 - V2 `click` mode đóng/mở bằng pointer, Enter/Space, outside click, `Escape` và navigation đúng contract; đây là mode mặc định khi không cấu hình.
- AC-006 - V2 `hover-lock` mở preview khi hover/focus, khóa bằng click, chỉ đóng unlocked preview khi pointer leave và luôn có keyboard/Escape fallback.
- AC-007 - V2 mobile hiển thị tối đa ba primary groups duy nhất theo `primaryMenuIds`, bỏ ID invalid/trùng, bù theo menu order và dùng **Thêm** để truy cập các group còn lại.
- AC-008 - V2 search chỉ trả menu thuộc context flyout/sheet hiện tại sau permission filter; Pin/Unpin cập nhật shared Pinned state và không duplicate entry.
- AC-009 - V3 desktop mở rộng mặc định; `defaultCollapsed` áp dụng lần đầu và persisted user preference ưu tiên ở các lần sau, kể cả khi responsive switch.
- AC-010 - V3 mobile drawer đóng qua backdrop, `Escape` hoặc navigation, trap/restore focus đúng và không để body scroll bị khóa sau khi đóng/destroy.
- AC-011 - V3 Global Search tìm trên toàn bộ permitted leaf menus, không phân biệt hoa thường, điều hướng đúng result và không hiển thị menu thiếu permission hoặc stale.
- AC-012 - V3 Recent bật mặc định, giới hạn 5 item khi không cấu hình, loại trùng theo stable key, sắp mới nhất trước và tôn trọng `enabled/maxItems` hợp lệ.
- AC-013 - Pinned/Recent được dùng chung giữa V1/V2/V3; collapsed/active/locked state được namespace theo version và transient overlay state không tự phục hồi sau reload.
- AC-014 - Storage V1 dạng menu object được đọc/migrate không throw; missing/stale/unauthorized entry bị loại và dữ liệu Pinned hợp lệ hiện có vẫn truy cập được sau migration.
- AC-015 - Route active, logo/title/brand, user info, sign out, change password và projected content hoạt động ở cả ba version; navigation đóng overlay nhưng không làm mất route state.
- AC-016 - Rail, drawer, search, pin và overlay controls có semantic role/name, focus-visible, `aria-expanded`/`aria-current` phù hợp, thứ tự Tab hợp lý và reduced-motion support.
- AC-017 - `sd-layout.md` tài liệu hóa đầy đủ V1/V2/V3, config defaults, responsive behavior, storage semantics, compatibility và ví dụ consumer compile được.
- AC-018 - Showcase Layout có selector V1/V2/V3 và desktop/mobile preview; mỗi variant render được với menu/user fixture và không phát console/runtime error.
- AC-019 - TDD tests cho config/responsive/storage/search/interaction được quan sát RED trước implementation và GREEN sau implementation; focused library/Showcase specs, v19/v20/v21 library build, `npm run lint:release` và `npm run check:sync` đều exit code 0. Full Karma không có regression mới so với 15 baseline failures đã ghi nhận.
- AC-020 (manual) - Browser smoke ở các viewport đại diện xác nhận V2 không làm content jump, V2 bottom sheet và V3 drawer không overflow, focus/keyboard behavior hoạt động, và visual hierarchy khớp mockup đã duyệt mà không yêu cầu redesign brand cuối.

## Test and verification expectations

- RED-first focused specs cho responsive source, config normalization, V2 interactions, V2 primary menus, V3 search/recent, storage migration và permission filtering.
- Component tests dùng viewport/media-query stub có cleanup assertion; không phụ thuộc user-agent máy chạy test.
- Showcase tests xác nhận registry/demo loader và fixtures cho cả ba version.
- Focused v19 tests phải GREEN trước rollout; sau sync chạy focused tests/build phù hợp ở v20/v21 để bắt Angular-major incompatibility.
- Bắt buộc chạy `npm run sync`, `npm run check:sync`, `npm run lint:release`, library build v19/v20/v21 và `git diff --check`.
- Full Karma được chạy và so sánh với baseline 3.198 pass/15 fail/9 skip; mọi failure mới thuộc touched paths phải được sửa, baseline ngoài scope được báo cáo riêng.
- AC-020 là manual browser criterion; các AC còn lại phải có automated evidence hoặc compile/build evidence tương ứng.

## Risks & mitigations

- **Risk:** Responsive động thay behavior V1 và có thể destroy/recreate subtree khi resize. -> **Mitigation:** shared responsive signal, focused V1 regression tests và smoke qua breakpoint không navigation/reload.
- **Risk:** Existing storage lưu full menu object trong khi menu title/order có thể đổi. -> **Mitigation:** lazy migration sang stable key, giữ read compatibility và loại stale entries fail-safe.
- **Risk:** `hover-lock` không dùng được bằng keyboard/touch hoặc flyout bị kẹt. -> **Mitigation:** click/focus/Escape parity, explicit lock state machine và cleanup tests.
- **Risk:** Global search/Recent làm lộ menu không còn permission. -> **Mitigation:** index từ output đã permission-filter, revalidate key khi đọc storage và test negative cases.
- **Risk:** Large menu tree làm search/flyout chậm. -> **Mitigation:** computed flattened index theo menu input, không rebuild theo từng keystroke và giới hạn Recent.
- **Risk:** Root sync ghi đè v20/v21 hoặc các `SYNC-STATUS.md` đang có thay đổi. -> **Mitigation:** snapshot dirty paths, chỉ sửa v19 source, review scoped sync diff và bảo toàn thay đổi ngoài scope.
- **Risk:** Full Karma baseline không GREEN gây khó đánh giá feature. -> **Mitigation:** TDD focused suites + build/lint/sync là blocking evidence; full run được diff với baseline và mọi regression mới phải bằng 0.

## Out of scope (deferred)

- Container-query hoặc per-instance media-query string - chỉ xem xét nếu numeric global breakpoint không đủ cho consumer thực tế.
- Cho phép ghép độc lập desktop version và mobile version - cần spec mới vì làm tăng public API/test matrix.
- Bắt buộc `SdLayoutMenu.id` hoặc đổi menu schema backend - chỉ thực hiện trong breaking release có migration guide.
- Đồng nhất Global Search/Recent vào V1/V2 - defer tới khi có feedback sau khi V3 được sử dụng.
- Sửa 15 Karma baseline failures ngoài touched paths - tách thành debugging task riêng.
- Bump version, changelog release, package publish, tag và deploy Showcase - thực hiện qua release workflow sau khi implementation được review.


## Decisions captured during review

- Người dùng duyệt nguyên draft ở lần 1.
- Giữ V1 và bổ sung đồng thời V2/V3; responsive động áp dụng cho cả ba version.
- TDD theo behavior, v19 là source of truth và rollout sang v20/v21.

## Skill provenance

sdcorejs-spec (approved on attempt 1 / 3)
