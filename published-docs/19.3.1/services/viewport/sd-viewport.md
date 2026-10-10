# SdViewportService

- **Type:** root Angular service using signals
- **Import path:** `@sdcorejs/angular/services/viewport`
- **Browser dependency:** injected through `SD_VIEWPORT`; SSR uses a stable desktop fallback

## Purpose

`SdViewportService` exposes viewport width, height and the current mobile/tablet/desktop breakpoint without requiring each consumer to own a resize listener. Use it for responsive application behavior that cannot be expressed with CSS alone. Prefer CSS media/container queries for purely visual layout changes.

## Public API

```ts
interface SdViewportBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

type SdViewportBreakpoint = 'mobile' | 'tablet' | 'desktop';

class SdViewportService {
  readonly breakpoints: Readonly<SdViewportBreakpoints>;
  readonly width: Signal<number>;
  readonly height: Signal<number>;
  readonly currentBreakpoint: Signal<SdViewportBreakpoint>;
  readonly isMobile: Signal<boolean>;
  readonly isTablet: Signal<boolean>;
  readonly isDesktop: Signal<boolean>;
}
```

Defaults use min-width semantics:

| Breakpoint | Minimum width |
| ---------- | ------------: |
| `mobile`   |           `0` |
| `tablet`   |         `768` |
| `desktop`  |        `1024` |

At `767px` the current breakpoint is `mobile`; at `768px` it becomes `tablet`; at `1024px` it becomes `desktop`.

## Basic usage

```ts
import { Component, computed, inject } from '@angular/core';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';

@Component({
  selector: 'app-toolbar',
  template: `@if (compact()) {
    <button type="button">Menu</button>
  }`,
})
export class ToolbarComponent {
  readonly viewport = inject(SdViewportService);
  readonly compact = computed(() => !this.viewport.isDesktop());
}
```

Signals are read-only. The root service registers one `resize` listener and removes it when its injection context is destroyed.

## Custom breakpoints

Override all three ordered min-width values at application bootstrap:

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

Values are floored to integers. The configuration must be finite, non-negative and strictly ordered (`mobile < tablet < desktop`). If any member is invalid, the entire set falls back to the defaults so consumers always share one coherent contract.

## SSR and test adapters

The browser source is injected through `SD_VIEWPORT`. On the server it resolves to `null`; width and height use `Number.MAX_SAFE_INTEGER`, which produces a deterministic desktop state and avoids direct access to browser globals.

Tests or embedded hosts can provide a small adapter:

```ts
const viewport = {
  innerWidth: 900,
  innerHeight: 700,
  addEventListener: (_type: 'resize', listener: EventListenerOrEventListenerObject) => listeners.add(listener),
  removeEventListener: (_type: 'resize', listener: EventListenerOrEventListenerObject) => listeners.delete(listener),
};

TestBed.configureTestingModule({
  providers: [{ provide: SD_VIEWPORT, useValue: viewport }],
});
```

## Layout compatibility

`SdLayout` keeps consuming `SdLayoutResponsiveService` so existing service overrides remain valid, while that compatibility service delegates its width to `SdViewportService`. The existing `mobileBreakpoint` rule is unchanged: widths strictly below the configured layout breakpoint render the mobile V1/V2/V3 pair. The layout-specific `SD_LAYOUT_VIEWPORT` token is an alias of `SD_VIEWPORT`, so existing providers continue to work without a second listener. Legacy viewport adapters may omit `innerHeight`; the new height signal then uses the same stable fallback as SSR.

## Anti-patterns

- Do not register another global resize listener just to derive the same breakpoints.
- Do not mutate or replace values returned by the service; configure the DI token during bootstrap.
- Do not use user-agent detection as a responsive substitute.
- Do not treat `mobileBreakpoint` from `SdLayout` as the global tablet threshold; it is a compatibility layout switch and can be configured independently.
