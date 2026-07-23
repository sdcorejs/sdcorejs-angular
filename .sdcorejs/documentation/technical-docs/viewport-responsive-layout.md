---
title: Viewport foundation và layout compatibility architecture
track: angular
status: implemented-in-v19
updated_at: 2026-07-23
source_of_truth: versions/v19/projects/sdcorejs-angular/services/viewport
---

# Viewport foundation và layout compatibility architecture

## Mục đích

Task 7 hợp nhất responsive state vào `SdViewportService`: một root service, một injected viewport source và một resize listener. `SdLayout` tiếp tục hỗ trợ các symbol/provider cũ thông qua adapter để tránh breaking behavior trong V1/V2/V3 và test hosts.

Chỉ workspace v19 được sửa; rollout sang v20/v21 nằm ở Task 14.

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

## Showcase và documentation registry

Trang `/v/latest/services/viewport/examples` có ba section: live state, default breakpoints và boolean signals. Registry đánh dấu local pre-release page với `publishedDocId: null`; Task 14 cập nhật published doc mapping sau rollout.

Generator tạo 268 example entries và 1336 route-shell definitions cho registry 87 pages.

## Verification evidence

Evidence ngày 2026-07-23:

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

Full release Karma gate không được suy ra từ focused evidence trên. Baseline source-only sau Task 6 còn 15 failures/9 skipped và function coverage dưới threshold; release vẫn phải repair ở Task 15.

## Source files chính

| Path                                                             | Trách nhiệm                            |
| ---------------------------------------------------------------- | -------------------------------------- |
| `services/viewport/src/viewport.model.ts`                        | Public types và viewport adapter       |
| `services/viewport/src/viewport.tokens.ts`                       | Browser/config tokens và normalization |
| `services/viewport/src/viewport.service.ts`                      | Signal graph, listener và cleanup      |
| `modules/layout/services/responsive/responsive.service.ts`       | Legacy compatibility adapter           |
| `modules/layout/components/layout-main/layout-main.component.ts` | V1/V2/V3 responsive composition        |
| `projects/showcase/src/app/pages/services/viewport/**`           | Live demo và focused spec              |

## Open items

- Rollout v20/v21 và published doc IDs ở Task 14.
- Browser visual smoke ở desktop/tablet/mobile trong Task 15.
- Full-suite baseline failures và coverage threshold vẫn là release blocker riêng.
