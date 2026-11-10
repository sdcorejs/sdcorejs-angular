import { isDevMode, signal, untracked, type NgZone } from '@angular/core';

// Host plumbing shared by sd-calendar and sd-scheduler through the ɵ exports of the entry point: the width of the host
// (compact layout, SC-32), the one-minute clock of the now line, and the dev-mode diagnostics.

/** Width of the host from a `ResizeObserver` (SC-32); `null` until known, and always without `ResizeObserver` (SSR, tests). */
export class SdCalendarHostWidth {
  readonly #width = signal<number | null>(null);
  readonly width = this.#width.asReadonly();
  readonly #observer: ResizeObserver | null;

  constructor(
    private readonly host: HTMLElement,
    zone: NgZone
  ) {
    this.#observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(entries => {
            const width = entries[entries.length - 1]?.contentRect.width;
            if (width !== undefined && width !== untracked(this.#width)) zone.run(() => this.#width.set(width));
          });
    this.#observer?.observe(host);
  }

  /** Width before the first observer callback, so the first render already fits a narrow host. */
  measureOnce(): void {
    if (untracked(this.#width) !== null || typeof ResizeObserver === 'undefined') return;
    const width = this.host.getBoundingClientRect().width;
    if (width > 0) this.#width.set(width);
  }

  disconnect(): void {
    this.#observer?.disconnect();
  }
}

/**
 * Calls `tick` every minute while running, outside the zone so the timer does not run change detection; `tick` itself
 * enters the zone.
 */
export class SdCalendarMinuteTimer {
  #timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly zone: NgZone,
    private readonly tick: () => void
  ) {}

  /** Starts or stops the timer. */
  run(active: boolean): void {
    if (!active) return this.stop();
    if (this.#timer !== null) return;
    this.#timer = this.zone.runOutsideAngular(() => setInterval(() => this.zone.run(this.tick), 60_000));
  }

  stop(): void {
    if (this.#timer !== null) clearInterval(this.#timer);
    this.#timer = null;
  }
}

/** Logs a dev-mode diagnostic once per instance and key, with the component's prefix (`[sd-calendar]`). */
export class SdCalendarReporter {
  readonly #reported = new Set<string>();

  constructor(private readonly prefix: string) {}

  report(level: 'error' | 'warn', key: string, message: string): void {
    if (!isDevMode() || this.#reported.has(key)) return;
    this.#reported.add(key);
    console[level](`${this.prefix} ${message}`);
  }
}

/** The element is laid out right-to-left. */
export function sdCalendarIsRtl(element: Element): boolean {
  return getComputedStyle(element).direction === 'rtl';
}
