---
module: viewport-responsive-layout
title: Viewport signals, responsive layout và account menu
tracks: [angular]
generated_at: 2026-07-26T22:01:46+07:00
git_head: 7bef5e95ca4ebd048acdbff83ad1f64d1da5428d
routes:
  - { path: /v/latest/services/viewport/examples, screen: showcase-viewport, permission: null }
  - { path: /v/latest/modules-integrations/layout/examples, screen: showcase-layout, permission: null }
permissions: []
entities: []
screens: [showcase-viewport, showcase-layout]
spec_refs: [.sdcorejs/specs/angular/2026-07-25-16-14-enhance-layout-account-menu.md]
prd_refs: []
coverage: { total: 22, met: 22, partial: 0, missing: 0 }
---

# Viewport signals, responsive layout và account menu - Hướng dẫn sử dụng

## Tổng quan

`SdViewportService` cung cấp một nguồn Angular signals dùng chung cho kích thước viewport và trạng thái `mobile`/`tablet`/`desktop`. Ứng dụng không cần tự đăng ký `window.resize`, tự cleanup listener hoặc dùng user-agent detection.

`SdLayout` dùng cùng nguồn này qua compatibility adapter, nên sidebar V1/V2/V3 chuyển desktop/mobile ngay khi resize mà không reload hoặc điều hướng lại.

Ba phiên bản Layout dùng chung account menu. Người dùng có thể xem avatar,
tên/email, chức vụ và các tác vụ do ứng dụng host cấu hình mà không cần học cách
tương tác khác nhau giữa V1, V2 và V3.

## Xem trạng thái viewport - `/v/latest/services/viewport/examples`

Trang demo hiển thị trực tiếp:

- `width()` và `height()`;
- `currentBreakpoint()`;
- `isMobile()`, `isTablet()` và `isDesktop()`;
- ba breakpoint đang được cấu hình.

Thay đổi chiều rộng cửa sổ để kiểm tra transitions mặc định:

| Chiều rộng | `currentBreakpoint()` |
| ---------- | --------------------- |
| `< 768`    | `mobile`              |
| `768–1023` | `tablet`              |
| `>= 1024`  | `desktop`             |

## Dùng trong component

```ts
import { Component, computed, inject } from '@angular/core';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';

@Component({
  selector: 'app-orders-toolbar',
  template: `@if (compact()) {
    <button type="button">Bộ lọc</button>
  }`,
})
export class OrdersToolbarComponent {
  readonly viewport = inject(SdViewportService);
  readonly compact = computed(() => !this.viewport.isDesktop());
}
```

Các signal là read-only. Chỉ dùng service khi responsive state ảnh hưởng behavior hoặc composition; giao diện thuần túy nên ưu tiên CSS media/container queries.

## Cấu hình breakpoint

Ba giá trị dùng min-width semantics và phải tăng nghiêm ngặt:

```ts
import { ApplicationConfig } from '@angular/core';
import { SD_VIEWPORT_BREAKPOINTS } from '@sdcorejs/angular/services/viewport';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: SD_VIEWPORT_BREAKPOINTS,
      useValue: { mobile: 0, tablet: 640, desktop: 1200 },
    },
  ],
};
```

Nếu có giá trị âm, không hữu hạn hoặc thứ tự không hợp lệ, cả cấu hình fallback về `{ mobile: 0, tablet: 768, desktop: 1024 }` để mọi consumer dùng một contract nhất quán.

## Tích hợp với `SdLayout`

`ISdLayoutConfiguration.mobileBreakpoint` vẫn là switch riêng của layout, mặc định `1024`: width nhỏ hơn ngưỡng render mobile pair, từ ngưỡng trở lên render desktop pair. Nó không thay thế global tablet breakpoint.

```ts
{
  provide: SD_LAYOUT_CONFIGURATION,
  useValue: {
    mobileBreakpoint: 900,
    sidebar: { version: 2 },
    userInfo: { fullName: 'Demo User' },
    signout: () => undefined,
  },
}
```

V1, V2 và V3 đều dùng cùng rule và chuyển live. `SdLayoutResponsiveService`/`SD_LAYOUT_VIEWPORT` vẫn tồn tại cho code cũ; không cần migration bắt buộc trong release này.

## Dùng account menu

Mở `/v/latest/modules-integrations/layout/examples` để kiểm tra độc lập từng
Showcase V1, V2 và V3. Mỗi Showcase có nút chuyển Desktop/Mobile.

Trên desktop:

1. Chọn avatar ở cuối sidebar để mở account menu.
2. Kiểm tra avatar, tên, email và chức vụ nằm cùng một identity row.
3. Chọn một tác vụ được ứng dụng cung cấp: cập nhật hồ sơ, thiết lập, thông báo,
   đổi mật khẩu hoặc đăng xuất.
4. Có thể dùng `ArrowUp`, `ArrowDown`, `Home`, `End` để di chuyển và `Escape` để
   đóng menu.

Trên mobile, profile và nút đăng xuất nằm cùng hàng. Các tác vụ tùy chọn nằm
phía dưới và không yêu cầu mở thêm một disclosure. Nút pin/unpin của menu luôn
hiển thị trên mobile.

| Thông tin/tác vụ | Khi nào hiển thị                                       |
| ---------------- | ------------------------------------------------------ |
| Chức vụ/role     | Khi `role.text` có nội dung; icon và color là tùy chọn |
| Cập nhật hồ sơ   | Khi consumer cấu hình `updateProfile`                  |
| Thiết lập        | Khi consumer cấu hình `setting`                        |
| Thông báo        | Khi consumer cấu hình `notification`                   |
| Badge thông báo  | Ẩn ở 0, hiển thị 1-99 và `99+` khi vượt 99             |
| Đổi mật khẩu     | Khi consumer cấu hình `changePassword`                 |
| Đăng xuất        | Luôn theo callback `signout`, dùng icon và màu error   |

Account menu không tự mở trang hoặc drawer. Ứng dụng consumer sở hữu callback
và quyết định điều hướng hay mở panel tương ứng.

## SSR và test

Trên server, viewport source là `null`; service không đọc browser globals và trả desktop state ổn định. Test có thể provide `SD_VIEWPORT` bằng adapter có `innerWidth`, `innerHeight` tùy chọn và `addEventListener`/`removeEventListener`. Provider legacy qua `SD_LAYOUT_VIEWPORT` vẫn hoạt động vì hai token là cùng một alias.

## Bảng quyền

Viewport service không tự áp permission code. Quyền hiển thị/điều hướng vẫn do component, route guard và permission layer của ứng dụng host quyết định.

| Permission code | Tác vụ                        | Vai trò                   |
| --------------- | ----------------------------- | ------------------------- |
| -               | Đọc responsive signals/layout | Do ứng dụng host quy định |

## Core UI được sử dụng

| Core UI                        | Vai trò trong tính năng                                 |
| ------------------------------ | ------------------------------------------------------- |
| `SdLayoutComponent`            | Chọn V1/V2/V3 và desktop/mobile composition             |
| `SdLayoutUserMenuComponent`    | Thống nhất identity, role, action và notification badge |
| `SdAvatar`                     | Hiển thị avatar hoặc fallback từ thông tin người dùng   |
| `SdIcon`                       | Hiển thị icon role, action, pin và navigation           |
| `TranslatePipe`                | Dịch nhãn account action và accessible name             |
| `SdLayoutSearchFieldComponent` | Giữ search field nhất quán trong các sidebar            |
| `SdLayoutMenuTreeComponent`    | Render menu tree và pin/unpin action                    |

## Coverage so với yêu cầu

> Không có spec/PRD riêng; bảng đối chiếu best-effort từ frozen release contract, implementation plan, code và tests Task 7.

|   # | Tính năng                                          | Trạng thái | Bằng chứng                                 |
| --: | -------------------------------------------------- | ---------- | ------------------------------------------ |
|   1 | Width/height signals reactive                      | met        | viewport service transition spec           |
|   2 | Mobile/tablet/desktop và current breakpoint        | met        | boundary transition specs                  |
|   3 | Breakpoint defaults và custom config               | met        | default/custom/invalid config specs        |
|   4 | SSR-safe, không truy cập browser khi thiếu host    | met        | null-viewport SSR spec                     |
|   5 | Một listener và cleanup deterministic              | met        | listener count/destroy specs               |
|   6 | Legacy service/token/provider compatibility        | met        | responsive adapter regression specs        |
|   7 | V1/V2/V3 đổi desktop/mobile khi resize             | met        | layout composition specs và Showcase build |
|   8 | V1 không hiển thị raw translation key              | met        | Dùng account menu                          |
|   9 | Signout V1 có icon, màu error và interaction state | met        | Dùng account menu                          |
|  10 | Identity V1 thẳng hàng với V2/V3                   | met        | Dùng account menu                          |
|  11 | Role có text/icon/color trên cả ba version         | met        | Dùng account menu                          |
|  12 | Role rỗng không render                             | met        | Dùng account menu                          |
|  13 | `updateProfile` chỉ hiện khi được cấu hình         | met        | Dùng account menu                          |
|  14 | `setting` chỉ hiện khi được cấu hình               | met        | Dùng account menu                          |
|  15 | `notification` gọi đúng consumer action            | met        | Dùng account menu                          |
|  16 | Badge nhận number, Signal và Observable            | met        | Dùng account menu                          |
|  17 | Badge normalize 0, số âm, không hữu hạn và `99+`   | met        | Dùng account menu                          |
|  18 | Observable cleanup và không subscribe trùng        | met        | Dùng account menu                          |
|  19 | Mobile giữ profile + signout cùng hàng             | met        | Dùng account menu                          |
|  20 | Desktop có action order và keyboard navigation     | met        | Dùng account menu                          |
|  21 | Consumer cũ không dùng API mới vẫn tương thích     | met        | Tích hợp với `SdLayout`                    |
|  22 | Showcase 390px không overflow                      | met        | Dùng account menu                          |

## Danh sách ảnh minh họa

- [ ] `images/viewport-responsive-showcase.png` - trang demo live signals và breakpoints.
- [ ] `images/layout-account-menu-showcase.png` - account menu V1/V2/V3 ở desktop/mobile.

Chưa chèn ảnh vì Showcase chưa được khởi động để capture trong bước này. Khi Showcase đang chạy, dùng:

```bash
SDCOREJS_DOCS_BASE_URL=http://localhost:4200 node .sdcorejs/documentation/user-guides/capture-screenshots.playwright.mjs
```
