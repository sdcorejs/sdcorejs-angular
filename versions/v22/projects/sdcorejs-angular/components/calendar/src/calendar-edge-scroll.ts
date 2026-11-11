import type { NgZone } from '@angular/core';

// Auto-scroll while dragging (calendar.md §9.3, scheduler.md §9.3), shared with sd-scheduler through the ɵ exports of
// the entry point: sd-calendar scrolls its time grid vertically, sd-scheduler scrolls both axes.

/** Distance (px) from an edge of the visible area where auto-scroll starts, and the top speed (px per frame). */
const EDGE = 40;
const EDGE_SPEED = 16;

/** Part of the scroll area that shows content, in client coordinates (the sticky header and column left out). */
export interface SdCalendarEdgeArea {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
}

/** Speed (px per frame) on one axis: negative within 40px of the start edge, positive within 40px of the end edge. */
export function sdCalendarEdgeSpeed(position: number, start: number, end: number): number {
  const before = position - start;
  const after = end - position;
  if (before >= 0 && before < EDGE) return -Math.ceil(((EDGE - before) / EDGE) * EDGE_SPEED);
  if (after >= 0 && after < EDGE) return Math.ceil(((EDGE - after) / EDGE) * EDGE_SPEED);
  return 0;
}

/**
 * One `requestAnimationFrame` loop outside the zone. `update` is called on every pointer move of a drag; while the
 * pointer stays near an edge the loop scrolls and calls `onFrame` (inside the zone) after each step.
 */
export class SdCalendarEdgeScroller {
  #frame = 0;

  constructor(private readonly zone: NgZone) {}

  update(
    scroller: HTMLElement | null | undefined,
    area: SdCalendarEdgeArea | null,
    pointer: { readonly x: number; readonly y: number } | null,
    axes: { readonly x: boolean; readonly y: boolean },
    onFrame: () => void
  ): void {
    if (!scroller || !area || !pointer) return this.stop();
    const dy = axes.y ? sdCalendarEdgeSpeed(pointer.y, area.top, area.bottom) : 0;
    const dx = axes.x ? sdCalendarEdgeSpeed(pointer.x, area.left, area.right) : 0;
    if (!dx && !dy) return this.stop();
    if (this.#frame || typeof requestAnimationFrame === 'undefined') return;
    const frame = (): void => {
      this.#frame = 0;
      scroller.scrollTop += dy;
      scroller.scrollLeft += dx;
      this.zone.run(onFrame);
    };
    this.#frame = this.zone.runOutsideAngular(() => requestAnimationFrame(frame));
  }

  stop(): void {
    if (this.#frame && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(this.#frame);
    this.#frame = 0;
  }
}
