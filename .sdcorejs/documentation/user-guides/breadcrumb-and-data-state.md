---
module: breadcrumb-and-data-state
title: Breadcrumb và Data State
tracks: [angular]
generated_at: 2026-07-23T03:03:00+07:00
git_head: cc31df58253569ad19b2c90bf4e34f1077c7d954
routes:
  - { path: /v/latest/components/breadcrumb/examples, screen: showcase-breadcrumb, permission: null }
  - { path: /v/latest/components/data-state/examples, screen: showcase-data-state, permission: null }
permissions: []
entities: []
screens: [showcase-breadcrumb, showcase-data-state]
spec_refs: []
prd_refs: []
coverage: { total: 8, met: 8, partial: 0, missing: 0 }
---

# Breadcrumb và Data State - Hướng dẫn sử dụng

## Tổng quan

`SdBreadcrumb` chuẩn hóa đường dẫn điều hướng theo hai cách: truyền danh sách thủ công hoặc tự đọc `route.data.breadcrumb`. `SdDataState` chuẩn hóa các trạng thái loading, empty, error và forbidden; khi thành công, nội dung được hiển thị trực tiếp mà không có wrapper trình bày dư thừa.

## Breadcrumb thủ công

```ts
import { SdBreadcrumbItem } from '@sdcorejs/angular/components/breadcrumb';

readonly breadcrumbs: SdBreadcrumbItem[] = [
  { label: 'Trang chủ', icon: 'home', url: '/' },
  { label: 'Đơn hàng', url: ['/orders'] },
  { label: this.orderName$ },
];
```

```html
<sd-breadcrumb [items]="breadcrumbs" [maxItems]="4"></sd-breadcrumb>
```

Label chấp nhận chuỗi, Promise, Observable hoặc hàm resolver. Item có URL chuỗi là link; router-command array và action-only item dùng button native nên có thể focus và kích hoạt bằng bàn phím. Dùng `disabled: true` khi item chỉ để hiển thị.

## Breadcrumb từ Router

Không truyền `items` và khai báo metadata trên route:

```ts
{
  path: 'orders',
  data: { breadcrumb: { label: 'Đơn hàng', icon: 'receipt' } },
  children: [
    {
      path: ':id',
      component: OrderDetailPage,
      data: {
        breadcrumb: (route: ActivatedRouteSnapshot) => this.orders.getName(route.paramMap.get('id')),
      },
    },
  ],
}
```

Component chỉ đọc primary outlet, cập nhật sau `NavigationEnd` và tự cleanup subscription khi bị hủy. Observable trong danh sách thủ công không bị restart bởi navigation không liên quan.

## Data State mặc định

```html
@if (loading()) {
<sd-data-state state="loading" compact></sd-data-state>
} @else if (error()) {
<sd-data-state state="error" retryable (sdRetry)="reload()"></sd-data-state>
} @else if (rows().length === 0) {
<sd-data-state state="empty" actionLabel="Tạo đơn hàng" (sdAction)="createOrder()"></sd-data-state>
} @else {
<sd-data-state state="success">
  <app-orders-table [rows]="rows()"></app-orders-table>
</sd-data-state>
}
```

Text mặc định theo locale en/vi/ja/ko/zh. Có thể override `title`, `message`, `icon`, `retryLabel`; truyền `icon=""` để ẩn icon, còn null/undefined dùng icon mặc định của state. Chuỗi rỗng ở `title`/`message` được giữ nguyên để chủ động ẩn nội dung mặc định.

## Template tùy biến

```html
<sd-data-state state="empty" (sdAction)="createOrder()">
  <ng-template sdDataStateTemplate let-state let-action="action">
    <app-empty-orders [state]="state" (create)="action()"></app-empty-orders>
  </ng-template>
</sd-data-state>
```

Template nhận `state`, `retry()` và `action()`. Khi dùng template tùy biến, ứng dụng host chịu trách nhiệm về role, live announcement và accessible label.

## Chọn compact hay full-page

- `compact`: vùng trống nhỏ trong card, table hoặc panel.
- mặc định: vùng nội dung thông thường.
- `fullPage`: màn hình lỗi/forbidden độc lập; tránh đặt trực tiếp bên trong container đã có chiều cao viewport khác.

## Quyền truy cập

Hai component không tự kiểm tra permission. `forbidden` chỉ là presentation sau khi ứng dụng host xác định người dùng không có quyền.

| Permission code | Tác vụ                       | Vai trò                     |
| --------------- | ---------------------------- | --------------------------- |
| -               | Render breadcrumb/data state | Do ứng dụng host quyết định |

## Coverage so với yêu cầu

|   # | Tính năng                                 | Trạng thái | Bằng chứng                  |
| --: | ----------------------------------------- | ---------- | --------------------------- |
|   1 | Breadcrumb manual và router-aware         | met        | component/router specs      |
|   2 | Label sync/Promise/Observable/resolver    | met        | async label specs           |
|   3 | Icon, disabled, template, overflow        | met        | focused specs và Showcase   |
|   4 | Nav semantics và keyboard activation      | met        | native element assertions   |
|   5 | Cleanup navigation/async sources          | met        | observer/subscription specs |
|   6 | Năm trạng thái và success transparent     | met        | DataState specs             |
|   7 | Retry/action, override, compact/full-page | met        | focused specs và Showcase   |
|   8 | Custom template và accessibility defaults | met        | template/ARIA specs         |

## Ảnh minh họa

- [ ] `images/breadcrumb-showcase.png`
- [ ] `images/data-state-showcase.png`

Khi Showcase đang chạy:

```bash
SDCOREJS_DOCS_BASE_URL=http://localhost:4200 node .sdcorejs/documentation/user-guides/capture-screenshots.playwright.mjs
```
