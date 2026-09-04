import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { SdViewportBreakpoint } from './viewport.model';
import { SD_VIEWPORT, SD_VIEWPORT_BREAKPOINTS, sdNormalizeViewportBreakpoints } from './viewport.tokens';

/**
 * Exposes one SSR-safe, signal-based viewport state for the application.
 * Breakpoints use min-width semantics and can be configured through `SD_VIEWPORT_BREAKPOINTS`.
 */
@Injectable({ providedIn: 'root' })
export class SdViewportService {
  readonly #viewport = inject(SD_VIEWPORT);
  readonly #destroyRef = inject(DestroyRef);
  readonly #width = signal(this.#viewport?.innerWidth ?? Number.MAX_SAFE_INTEGER);
  readonly #height = signal(this.#viewport?.innerHeight ?? Number.MAX_SAFE_INTEGER);

  readonly breakpoints = sdNormalizeViewportBreakpoints(inject(SD_VIEWPORT_BREAKPOINTS));
  readonly width = this.#width.asReadonly();
  readonly height = this.#height.asReadonly();
  readonly currentBreakpoint = computed<SdViewportBreakpoint>(() => {
    const width = this.width();
    if (width >= this.breakpoints.desktop) return 'desktop';
    if (width >= this.breakpoints.tablet) return 'tablet';
    return 'mobile';
  });
  readonly isMobile = computed(() => this.currentBreakpoint() === 'mobile');
  readonly isTablet = computed(() => this.currentBreakpoint() === 'tablet');
  readonly isDesktop = computed(() => this.currentBreakpoint() === 'desktop');

  constructor() {
    if (!this.#viewport) return;

    const onResize = (): void => {
      this.#width.set(this.#viewport?.innerWidth ?? Number.MAX_SAFE_INTEGER);
      this.#height.set(this.#viewport?.innerHeight ?? Number.MAX_SAFE_INTEGER);
    };
    this.#viewport.addEventListener('resize', onResize);
    this.#destroyRef.onDestroy(() => this.#viewport?.removeEventListener('resize', onResize));
  }
}
