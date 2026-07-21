import { DestroyRef, Injectable, InjectionToken, inject, signal } from '@angular/core';
import { normalizeLayoutMobileBreakpoint } from '../../configurations';

export interface SdLayoutViewport {
  innerWidth: number;
  addEventListener(type: 'resize', listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: 'resize', listener: EventListenerOrEventListenerObject): void;
}

export const SD_LAYOUT_VIEWPORT = new InjectionToken<SdLayoutViewport | null>('sd.layout.viewport', {
  providedIn: 'root',
  factory: () => (typeof window === 'undefined' ? null : window),
});

@Injectable({ providedIn: 'root' })
export class SdLayoutResponsiveService {
  readonly #viewport = inject(SD_LAYOUT_VIEWPORT);
  readonly #destroyRef = inject(DestroyRef);
  readonly viewportWidth = signal(this.#viewport?.innerWidth ?? Number.MAX_SAFE_INTEGER);

  constructor() {
    if (!this.#viewport) return;

    const onResize = (): void => this.viewportWidth.set(this.#viewport?.innerWidth ?? Number.MAX_SAFE_INTEGER);
    this.#viewport.addEventListener('resize', onResize);
    this.#destroyRef.onDestroy(() => this.#viewport?.removeEventListener('resize', onResize));
  }

  isMobile(breakpoint: number): boolean {
    return this.viewportWidth() < normalizeLayoutMobileBreakpoint(breakpoint);
  }
}
