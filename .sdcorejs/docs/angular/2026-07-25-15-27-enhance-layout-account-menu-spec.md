# Spec - Nâng cấp Layout Account Menu - 2026-07-25 15:27

```yaml
spec_context:
  source: sdcorejs-spec
  contract_id: sdcorejs-angular-layout-account-menu-v2
  requirement_id: layout-account-menu-20260725
  approved_spec_path: .sdcorejs/specs/angular/2026-07-25-16-14-enhance-layout-account-menu.md
  approved_spec_hash: 7104ac488b22c4a7968e149ae11851df3eacc8cde1cd18a4fd789b0e30a44e37
  supersedes: null
  target_root: C:/Users/nghiatt15_onemount/Documents/sdcorejs/sdcorejs-angular
  target_root_kind: target-project
  track: angular
  stack_profile: core-ui-angular
  profile_confidence: high
  source_requirement_context: layout-account-experience-v2
  acceptance_criteria_count: 15
  manual_criteria_count: 1
  non_goals:
    - Tự triển khai side drawer, route hoặc trang hồ sơ/thông báo trong thư viện
    - Thay đổi contract signout và changePassword hiện có
    - Thêm backend notification, polling, websocket hoặc state store
    - Commit, push, publish hoặc release package
  risks:
    - Mở rộng public API có thể tạo contract khó duy trì nếu action quá tổng quát
    - Observable notification có thể rò rỉ subscription nếu không cleanup đúng
    - Refactor V1 sang shared presentation có thể làm thay đổi vị trí popup hoặc collapse control
    - I18n mock của Showcase có thể tiếp tục hiển thị raw key nếu thiếu message mapping
  assumptions:
    - Cấu hình action dùng đúng tên updateProfile, setting và notification
    - role là metadata tùy chọn nằm trong SdLayoutUserInfo
    - Notification badge ẩn khi count bằng 0 và hiển thị 99+ khi count lớn hơn 99
    - Action callback do consumer tự mở side drawer hoặc navigate route
    - Coverage giữ standard và thực hiện TDD RED-first
  redaction_applied: false
  approval:
    approved: true
    approved_at: 2026-07-25T16:14:36+07:00
    approval_source: explicit-user-choice
  change_control:
    revision: 1
    supersedes: null
    change_reason: null
```

## Problem & Goals

Layout V1 còn dùng account popup riêng, khiến thông tin avatar/tên/email và nút
đăng xuất khác V2/V3. Showcase hiện mock i18n bằng cách trả lại nguyên key nên
V1 hiển thị `core.module.layout.user.logout` thay vì nhãn đã dịch.

Consumer cũng chưa có contract chuẩn để:

- hiển thị chức vụ/role tùy chọn của người dùng;
- mở luồng cập nhật hồ sơ;
- mở phần thiết lập tài khoản;
- hiển thị số lượng thông báo dạng reactive và xử lý khi người dùng nhấn vào.

Mục tiêu là dùng một presentation account menu thống nhất cho V1/V2/V3, mở
rộng public API theo hướng typed và backward-compatible, đồng thời để consumer
toàn quyền quyết định side drawer hoặc route được mở bởi từng callback.

## Non-goals

- Không cung cấp side drawer, route, form cập nhật hồ sơ hoặc trang thông báo
  mặc định.
- Không kết nối API, polling, websocket hoặc notification store.
- Không loại bỏ `signout`, `changePassword`, các field `userInfo` hiện có hoặc
  đổi selector public.
- Không hỗ trợ action array tổng quát trong lần mở rộng này.
- Không thay đổi thuật toán menu, pin, search, recent hoặc responsive breakpoint.
- Không commit, push, bump version, publish hoặc deploy.

## Architecture

### Public configuration contract

`ISdLayoutConfiguration` được mở rộng bằng ba callback/configuration tùy chọn:

```ts
updateProfile?: () => void | Promise<void>;
setting?: () => void | Promise<void>;
notification?: {
  count: number | Signal<number> | Observable<number>;
  action: () => void | Promise<void>;
};
```

`SdLayoutUserInfo` được mở rộng bằng metadata tùy chọn:

```ts
role?: {
  text: string;
  icon?: string;
  color?: string;
};
```

`role` không được render khi object thiếu, `text` rỗng sau khi trim, hoặc giá trị
là `null`/`undefined`. `icon` dùng tên icon tương thích `SdIcon`; `color` áp
dụng cho role icon/text và fallback về màu secondary của theme khi không có.

`updateProfile`, `setting` và `notification` là tên public chính xác theo lựa
chọn của consumer. Callback không nhận tham số; consumer tự mở side drawer,
dialog hoặc navigate route.

### Reactive notification count

`notification.count` hỗ trợ:

- `number` cho count tĩnh;
- Angular `Signal<number>` cho state signal-native;
- RxJS `Observable<number>` cho stream hiện có của consumer.

Component normalize count thành số nguyên không âm. Badge ẩn khi count bằng 0,
hiển thị số từ 1 đến 99 và hiển thị `99+` khi lớn hơn 99. Notification action
vẫn hiển thị khi count bằng 0 để consumer có thể mở trung tâm thông báo.
Observable phải được unsubscribe theo lifecycle component.

### Shared account presentation

`SdLayoutUserMenuComponent` tiếp tục là presentation nội bộ dùng chung:

- Desktop disclosure: trigger avatar; popup có identity row ngang và danh sách
  action.
- Mobile: identity và signout nằm cùng hàng; các action tùy chọn nằm trong
  action row/list phía dưới để không ép nhỏ tên/email.
- V1 desktop/mobile dùng lại shared presentation thay cho account markup riêng;
  wrapper V1 chỉ còn chịu trách nhiệm toggle/collapse rail và các output legacy.
- V2/V3 giữ geometry hiện tại nhưng nhận role và action mới qua cùng component.

Identity block đặt avatar bên trái, tên/email/role bên phải. Role nằm dưới
email, có icon/color khi được cấu hình. Khi sidebar compact, trigger chỉ hiển
thị avatar; popup vẫn hiển thị đầy đủ identity.

### Actions and i18n

Thứ tự action thống nhất:

1. `updateProfile`
2. `setting`
3. `notification`
4. `changePassword`
5. `signout`

Action chỉ render khi callback/configuration tương ứng tồn tại. Signout có icon
`logout`, màu error/đỏ và hover state giống V2/V3. Các nhãn user-facing dùng
i18n keys cho toàn bộ locale hiện có; Showcase mock trả về nhãn đọc được thay
vì raw key.

Các control dùng semantic `button`, có accessible name, keyboard focus rõ và
giữ điều hướng ArrowUp/ArrowDown/Home/End/Escape của popup.

### Multi-version rollout

`versions/v19` là canonical source. Sau khi test v19 xanh, root sync sinh
v20/v21 và `check:sync` xác nhận parity. Không hand-edit mirror.

## Stack profile and technology assumptions

- Track: Angular.
- Stack profile: `core-ui-angular`.
- Profile evidence:
  - `versions/v19/angular.json`.
  - source package `@sdcorejs/angular`.
  - Layout dùng `SdAvatar`, `SdIcon`, Angular signals và RxJS.
- Technology assumptions:
  - Angular 19/20/21 đều hỗ trợ `Signal` và lifecycle cleanup cần dùng.
  - RxJS là dependency hiện có; không thêm package.
  - `MaybeAsync` không được dùng cho count vì notification cần stream lâu dài,
    không chỉ resolve một giá trị đầu tiên.

## File structure

- `versions/v19/projects/sdcorejs-angular/modules/layout/configurations/layout.configuration.ts`
  - mở rộng typed public contract cho role và ba action.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/user-menu/**`
  - thống nhất identity/actions, reactive count, i18n và accessibility.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/user/**`
  - chuyển V1 desktop wrapper sang shared presentation.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/user/**`
  - chuyển V1 mobile wrapper sang shared presentation.
- `versions/v19/projects/sdcorejs-angular/i18n/src/{vi,en,ja,ko,zh}.ts`
  - thêm nhãn update profile, setting và notification nếu chưa có.
- `versions/v19/projects/showcase/src/app/pages/modules/layout/layout-demo.component.ts`
  - fixture role, action callbacks và reactive notification count.
- Các spec cạnh source và Showcase spec
  - regression contract, reactive cleanup, action visibility/click và V1/V2/V3.
- `versions/v19/projects/sdcorejs-angular/modules/layout/sd-layout.md`
  - cập nhật public configuration example và behavior.
- `versions/v20/**`, `versions/v21/**`
  - generated mirror từ canonical v19.

## Acceptance criteria

- AC-001 - V1 không còn hiển thị raw translation key; nhãn đăng xuất đọc được
  theo locale/Showcase fixture.
- AC-002 - Signout V1 có icon `logout`, màu error/đỏ và hover/focus state đồng
  nhất V2/V3.
- AC-003 - Identity V1 desktop/mobile đặt avatar bên trái và tên/email bên phải
  theo cùng alignment với V2/V3.
- AC-004 - `SdLayoutUserInfo.role` hiển thị trên V1/V2/V3 khi có `text` hợp lệ,
  hỗ trợ `icon` và `color`.
- AC-005 - Role bị ẩn hoàn toàn khi `role` hoặc `role.text` là
  `null`/`undefined`/rỗng.
- AC-006 - Action `updateProfile` chỉ xuất hiện khi callback được cấu hình và
  gọi callback đúng một lần khi click/keyboard activate.
- AC-007 - Action `setting` chỉ xuất hiện khi callback được cấu hình và gọi
  callback đúng một lần khi click/keyboard activate.
- AC-008 - `notification` chỉ xuất hiện khi configuration tồn tại và gọi
  `notification.action` đúng một lần khi activate.
- AC-009 - Notification count tĩnh, Signal và Observable đều render đúng; thay
  đổi Signal/Observable cập nhật UI mà không remount Layout.
- AC-010 - Notification badge ẩn ở count 0, normalize số âm/không hữu hạn về 0,
  hiển thị 1-99 và `99+` khi vượt 99.
- AC-011 - Observable notification được cleanup khi component destroy và không
  tạo subscription trùng.
- AC-012 - Mobile V1/V2/V3 giữ identity + signout cùng hàng; các action tùy
  chọn không làm co hoặc tràn tên/email.
- AC-013 - Desktop popup V1/V2/V3 giữ thứ tự action đã định, hỗ trợ
  ArrowUp/ArrowDown/Home/End/Escape và focus restoration.
- AC-014 - Consumer không cấu hình API mới vẫn giữ hành vi cũ của `userInfo`,
  `changePassword` và `signout`; không có action trống.
- AC-015 (manual) - Showcase của cả ba version ở desktop/mobile thể hiện role,
  update profile, setting và notification badge rõ ràng, không overflow ở
  preview 390px.

## Risks & mitigations

- **Risk:** public action contract tiếp tục phình theo từng nhu cầu.
  **Mitigation:** chỉ thêm ba field semantic đã xác nhận, không thêm generic
  action array.
- **Risk:** Signal là function và có thể bị nhầm với callback/provider factory.
  **Mitigation:** đặt count trong object `notification` và dùng `isSignal`
  trước khi xử lý Observable/value.
- **Risk:** Observable rò rỉ hoặc subscription nhiều lần.
  **Mitigation:** normalize một lần trong injection context, dùng lifecycle
  cleanup và regression spec kiểm tra unsubscribe.
- **Risk:** V1 popup bị lệch sau khi bỏ legacy MatMenu markup.
  **Mitigation:** giữ wrapper/rail ownership của V1, thêm browser geometry UAT
  cho expanded/collapsed desktop.
- **Risk:** hardcoded nhãn làm sai locale.
  **Mitigation:** shared presentation dùng i18n keys và thêm coverage trên locale
  registry/Showcase mock.

## Out of scope (deferred)

- Generic `userActions[]` - chỉ xem xét khi có action thứ tư ngoài ba semantic
  action đã xác nhận.
- Notification fetch/polling/websocket - consumer sở hữu data source.
- Side drawer/profile/settings/notification pages - consumer sở hữu UI và
  navigation.
- Badge animation, sound hoặc desktop notification permission - cần feature
  notification riêng.
