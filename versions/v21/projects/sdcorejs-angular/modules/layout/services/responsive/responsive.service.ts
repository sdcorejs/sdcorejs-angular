import { Injectable, inject } from '@angular/core';
import { SD_VIEWPORT, SdViewport, SdViewportService } from '@sdcorejs/angular/services/viewport';
import { normalizeLayoutMobileBreakpoint } from '../../configurations';

export type SdLayoutViewport = SdViewport;
export const SD_LAYOUT_VIEWPORT = SD_VIEWPORT;

/** @deprecated Prefer `SdViewportService` from `@sdcorejs/angular/services/viewport`. */
@Injectable({ providedIn: 'root' })
export class SdLayoutResponsiveService {
  readonly #viewport = inject(SdViewportService);
  readonly viewportWidth = this.#viewport.width;

  isMobile(breakpoint: number): boolean {
    return this.viewportWidth() < normalizeLayoutMobileBreakpoint(breakpoint);
  }
}
