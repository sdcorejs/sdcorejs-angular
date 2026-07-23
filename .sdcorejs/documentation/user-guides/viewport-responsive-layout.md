---
module: viewport-responsive-layout
title: Viewport signals và responsive layout
tracks: [angular]
generated_at: 2026-07-23T02:35:00+07:00
git_head: cc31df58253569ad19b2c90bf4e34f1077c7d954
routes:
  - { path: /v/latest/services/viewport/examples, screen: showcase-viewport, permission: null }
  - { path: /v/latest/modules-integrations/layout/examples, screen: showcase-layout, permission: null }
permissions: []
entities: []
screens: [showcase-viewport, showcase-layout]
spec_refs: []
prd_refs: []
coverage: { total: 7, met: 7, partial: 0, missing: 0 }
---

# Viewport signals và responsive layout - Hướng dẫn sử dụng

## Tổng quan

`SdViewportService` cung cấp một nguồn Angular signals dùng chung cho kích thước viewport và trạng thái `mobile`/`tablet`/`desktop`. Ứng dụng không cần tự đăng ký `window.resize`, tự cleanup listener hoặc dùng user-agent detection.

`SdLayout` dùng cùng nguồn này qua compatibility adapter, nên sidebar V1/V2/V3 chuyển desktop/mobile ngay khi resize mà không reload hoặc điều hướng lại.

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

## SSR và test

Trên server, viewport source là `null`; service không đọc browser globals và trả desktop state ổn định. Test có thể provide `SD_VIEWPORT` bằng adapter có `innerWidth`, `innerHeight` tùy chọn và `addEventListener`/`removeEventListener`. Provider legacy qua `SD_LAYOUT_VIEWPORT` vẫn hoạt động vì hai token là cùng một alias.

## Bảng quyền

Viewport service không tự áp permission code. Quyền hiển thị/điều hướng vẫn do component, route guard và permission layer của ứng dụng host quyết định.

| Permission code | Tác vụ                        | Vai trò                   |
| --------------- | ----------------------------- | ------------------------- |
| -               | Đọc responsive signals/layout | Do ứng dụng host quy định |

## Coverage so với yêu cầu

> Không có spec/PRD riêng; bảng đối chiếu best-effort từ frozen release contract, implementation plan, code và tests Task 7.

|   # | Tính năng                                       | Trạng thái | Bằng chứng                                 |
| --: | ----------------------------------------------- | ---------- | ------------------------------------------ |
|   1 | Width/height signals reactive                   | met        | viewport service transition spec           |
|   2 | Mobile/tablet/desktop và current breakpoint     | met        | boundary transition specs                  |
|   3 | Breakpoint defaults và custom config            | met        | default/custom/invalid config specs        |
|   4 | SSR-safe, không truy cập browser khi thiếu host | met        | null-viewport SSR spec                     |
|   5 | Một listener và cleanup deterministic           | met        | listener count/destroy specs               |
|   6 | Legacy service/token/provider compatibility     | met        | responsive adapter regression specs        |
|   7 | V1/V2/V3 đổi desktop/mobile khi resize          | met        | layout composition specs và Showcase build |

## Danh sách ảnh minh họa

- [ ] `images/viewport-responsive-showcase.png` - trang demo live signals và breakpoints.

Chưa chèn ảnh vì Showcase chưa được khởi động để capture trong bước này. Khi Showcase đang chạy, dùng:

```bash
SDCOREJS_DOCS_BASE_URL=http://localhost:4200 node .sdcorejs/documentation/user-guides/capture-screenshots.playwright.mjs
```
