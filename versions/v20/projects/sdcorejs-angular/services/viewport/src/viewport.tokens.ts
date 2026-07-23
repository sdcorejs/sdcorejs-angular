import { InjectionToken } from '@angular/core';
import { SdViewport, SdViewportBreakpoints } from './viewport.model';

export const SD_VIEWPORT_DEFAULT_BREAKPOINTS: Readonly<SdViewportBreakpoints> = Object.freeze({
  mobile: 0,
  tablet: 768,
  desktop: 1024,
});

export const SD_VIEWPORT = new InjectionToken<SdViewport | null>('sd.viewport', {
  providedIn: 'root',
  factory: () => (typeof window === 'undefined' ? null : window),
});

export const SD_VIEWPORT_BREAKPOINTS = new InjectionToken<Readonly<SdViewportBreakpoints>>('sd.viewport.breakpoints', {
  providedIn: 'root',
  factory: () => SD_VIEWPORT_DEFAULT_BREAKPOINTS,
});

export function sdNormalizeViewportBreakpoints(value: Readonly<SdViewportBreakpoints>): Readonly<SdViewportBreakpoints> {
  const mobile = normalizeBreakpoint(value.mobile);
  const tablet = normalizeBreakpoint(value.tablet);
  const desktop = normalizeBreakpoint(value.desktop);

  if (mobile === undefined || tablet === undefined || desktop === undefined || mobile >= tablet || tablet >= desktop) {
    return SD_VIEWPORT_DEFAULT_BREAKPOINTS;
  }

  return Object.freeze({ mobile, tablet, desktop });
}

function normalizeBreakpoint(value: number): number | undefined {
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : undefined;
}
