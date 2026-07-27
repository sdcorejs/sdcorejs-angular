---
title: Viewport foundation và Layout compatibility architecture
track: angular
status: implemented-v19-v21
updated_at: 2026-07-26
source_of_truth:
  - versions/v19/projects/sdcorejs-angular/services/viewport
  - versions/v19/projects/sdcorejs-angular/modules/layout
---

# Viewport foundation và Layout compatibility architecture

## Mục đích

`SdViewportService` hợp nhất responsive state thành một root service, một
injected viewport source và một resize listener. `SdLayout` tiếp tục hỗ trợ các
symbol/provider cũ qua adapter, đồng thời dùng một account-menu presentation
chung cho V1/V2/V3. Source chuẩn nằm ở v19 và được đồng bộ sang v20/v21.

## Public surface

Entrypoint: `@sdcorejs/angular/services/viewport`.

```ts
export interface SdViewportBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

export type SdViewportBreakpoint = 'mobile' | 'tablet' | 'desktop';

export interface SdViewport {
  innerWidth: number;
  innerHeight?: number;
  addEventListener(type: 'resize', listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: 'resize', listener: EventListenerOrEventListenerObject): void;
}
```

Public runtime symbols:

- `SdViewportService`;
- `SD_VIEWPORT`;
- `SD_VIEWPORT_BREAKPOINTS`;
- `SD_VIEWPORT_DEFAULT_BREAKPOINTS`;
- `sdNormalizeViewportBreakpoints`.

`services/index.ts` re-export toàn bộ surface và package build tạo secondary entry độc lập.

## Signal graph và listener lifecycle

```text
SD_VIEWPORT (Window | injected adapter | null)
              |
              | one resize listener
              v
      private width/height WritableSignals
              |
              +--> public width / height read-only signals
              +--> currentBreakpoint computed
                         +--> isMobile / isTablet / isDesktop
```

Listener được đăng ký khi có viewport source và gỡ qua `DestroyRef`. Re-inject root service trả cùng instance, không đăng ký listener thứ hai.

## Breakpoint semantics

Default `{ mobile: 0, tablet: 768, desktop: 1024 }` dùng min-width semantics:

```ts
if (width >= desktop) return 'desktop';
if (width >= tablet) return 'tablet';
return 'mobile';
```

Normalizer floor số hữu hạn không âm và yêu cầu `mobile < tablet < desktop`. Validation là atomic: bất kỳ field không hợp lệ nào làm toàn bộ set fallback về default, tránh trạng thái consumer dùng các phần cấu hình khác nhau.

## SSR contract

Factory của `SD_VIEWPORT` dùng guard `typeof window === 'undefined'`. Khi source là `null`, width/height nhận `Number.MAX_SAFE_INTEGER`, tạo `desktop` state deterministic và giữ behavior SSR trước đây của layout.

`innerHeight` là optional để adapter legacy chỉ có `innerWidth` vẫn type-compatible; height fallback ổn định khi field vắng mặt.

## Layout compatibility

Dependency flow:

```text
SdLayoutComponent
  -> SdLayoutResponsiveService (legacy injection seam retained)
       -> SdViewportService.width
            -> SD_VIEWPORT
```

- `SdLayoutResponsiveService.viewportWidth` alias read-only signal `SdViewportService.width`.
- `isMobile(breakpoint)` giữ rule cũ và `normalizeLayoutMobileBreakpoint`.
- `SD_LAYOUT_VIEWPORT === SD_VIEWPORT`; provider cũ cấu hình đúng source mới.
- `SdLayoutViewport` alias sang `SdViewport`, với `innerHeight?` để không mở rộng yêu cầu bắt buộc.
- `SdLayoutComponent` vẫn inject compatibility service, nên consumer/test override cũ tiếp tục điều khiển composition.
- V1/V2/V3 dùng cùng `isMobile` computed và chuyển pair mà không navigation/reload.

## Account menu contract

Public contract nằm trong
`modules/layout/configurations/layout.configuration.ts`:

```ts
type SdLayoutAccountAction = () => void | Promise<void>;

interface SdLayoutUserRole {
  text: string;
  icon?: string;
  color?: string;
}

interface SdLayoutNotificationConfiguration {
  count: number | Signal<number> | Observable<number>;
  action: SdLayoutAccountAction;
}
```

`ISdLayoutConfiguration` giữ `signout` bắt buộc, `changePassword` tùy chọn và
thêm đúng ba semantic field: `updateProfile`, `setting`, `notification`.
Consumer sở hữu callback; Layout không phụ thuộc Router, drawer hay notification
service cụ thể.

`SdLayoutUserInfo.role` là display metadata. Component trim `role.text` và bỏ
toàn bộ role row khi text rỗng. `icon` được chuyển cho `SdIcon`; `color` được
bind qua Angular style binding.

## Shared account presentation

```text
SD_LAYOUT_CONFIGURATION / component inputs
                 |
                 v
       SdLayoutUserMenuComponent
        |                     |
        | disclosure          | mobile / mobile-inline
        v                     v
 desktop popup          static identity + signout row
 ordered actions        optional actions below
```

- V1 desktop/mobile wrapper chỉ giữ rail toggle và legacy outputs.
- V2/V3 giữ geometry riêng nhưng render cùng shared component.
- Desktop action order: `updateProfile`, `setting`, `notification`,
  `changePassword`, `signout`.
- Mobile đặt identity + signout cùng hàng; các action còn lại ở list phía dưới.
- Compact desktop trigger chỉ render avatar, còn popup luôn render identity đầy
  đủ.

## Notification lifecycle

`notification.count` được resolve theo thứ tự number, Signal, Observable:

- number đọc trực tiếp;
- Signal được đọc trong `computed`, nên Angular tự theo dõi dependency;
- Observable có đúng một current subscription trong `effect`; cleanup callback
  unsubscribe khi source đổi hoặc component destroy.

Count hữu hạn dương được floor. Mọi giá trị khác normalize về 0. Badge ẩn ở 0,
hiển thị `1..99`, và cap thành `99+`; action thông báo vẫn hiện ở 0.

## Accessibility và i18n

- Trigger dùng native button với `aria-haspopup="menu"` và `aria-expanded`.
- Popup hỗ trợ `ArrowUp`, `ArrowDown`, `Home`, `End`, `Escape`, focus entry và
  focus restoration.
- V1 rail toggle có localized `aria-label` qua
  `core.module.layout.sidebar.toggle`.
- Account labels dùng `TranslatePipe`; năm locale en/vi/ja/ko/zh giữ parity.
- Focus ring rõ ràng và motion được tắt khi `prefers-reduced-motion: reduce`.

## Showcase và documentation registry

Trang `/v/latest/services/viewport/examples` có ba section: live state, default breakpoints và boolean signals. Registry đánh dấu local pre-release page với `publishedDocId: null`; Task 14 cập nhật published doc mapping sau rollout.

Generator tạo 268 example entries và 1336 route-shell definitions cho registry 87 pages.

## Verification evidence

Evidence account-menu ngày 2026-07-26:

- v19 Layout suite: 105/105;
- focused v20 và v21: 40/40 ở mỗi workspace;
- V1 repair regression: 4/4;
- i18n parity: 521 keys × 5 locale;
- targeted ESLint: pass;
- v19 library build và Showcase build: pass;
- `npm run sync` và `npm run check:sync`: pass;
- browser UAT: V1/V2/V3 desktop/mobile, role, actions, badge, V1 expand/collapse,
  inline mobile signout và preview 390px đều pass.

Evidence viewport ngày 2026-07-23:

- RED ban đầu: missing viewport modules/exports;
- library GREEN trước review: 20/20;
- review repair RED: legacy viewport thiếu `innerHeight` compile fail; layout provider override contract được khóa bằng divergent source;
- repair GREEN: compatibility slice 8/8;
- final focused library: 20/20;
- Showcase viewport + registry: 8/8;
- generator suites: 27/27;
- `npm run lint`: pass;
- `npm run build`: pass, gồm `@sdcorejs/angular/services/viewport` và layout entrypoint;
- `npm run build:showcase`: pass với 268 example entries.

## Source files chính

| Path                                                             | Trách nhiệm                                          |
| ---------------------------------------------------------------- | ---------------------------------------------------- |
| `services/viewport/src/viewport.model.ts`                        | Public types và viewport adapter                     |
| `services/viewport/src/viewport.tokens.ts`                       | Browser/config tokens và normalization               |
| `services/viewport/src/viewport.service.ts`                      | Signal graph, listener và cleanup                    |
| `modules/layout/services/responsive/responsive.service.ts`       | Legacy compatibility adapter                         |
| `modules/layout/components/layout-main/layout-main.component.ts` | V1/V2/V3 responsive composition                      |
| `modules/layout/configurations/layout.configuration.ts`          | Account action, role và notification public contract |
| `modules/layout/components/shared/user-menu/*`                   | Shared desktop/mobile account presentation           |
| `modules/layout/components/sidebar-v1/components/user/*`         | V1 desktop compatibility wrapper                     |
| `modules/layout/components/sidebar-mobile-v1/components/user/*`  | V1 mobile compatibility wrapper                      |
| `projects/showcase/src/app/pages/services/viewport/**`           | Live demo và focused spec                            |
| `projects/showcase/src/app/pages/modules/layout/**`              | Independent V1/V2/V3 live showcases                  |

## Giới hạn

- Layout không fetch notification, không mở profile/settings pages và không xử
  lý authorization cho account action; consumer sở hữu các concern này.
- Contract cố ý không có generic `userActions[]`; chỉ ba semantic extension đã
  được phê duyệt.
- Showcase dev server `:4200` hiện có một baseline compile overlay không thuộc
  Layout ở entity-picker; built Showcase `:4300` được dùng cho visual UAT.
