import { Injector } from '@angular/core';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { SdDateTimeService } from '@sdcorejs/angular/services/date-time';
import { I18N_MESSAGES } from '../i18n/src/i18n.messages';

// Test helpers shared by sd-calendar, sd-scheduler and sd-kanban (handoff schedule-kanban, TESTING.md §3).
// Spec-only: nothing in the library imports this file.

/** A promise whose outcome the test decides. */
export interface Deferred<T> {
  readonly promise: Promise<T>;
  resolve(value: T): void;
  reject(error: unknown): void;
}

export function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Stand-in for `window.ResizeObserver`; `trigger(width)` reports a new content width to every observer. */
export class FakeResizeObserver implements ResizeObserver {
  static readonly instances: FakeResizeObserver[] = [];
  readonly targets = new Set<Element>();
  disconnected = false;

  constructor(private readonly callback: ResizeObserverCallback) {
    FakeResizeObserver.instances.push(this);
  }

  /** Replaces `window.ResizeObserver` until the returned function runs. `null` removes it (SSR-like). */
  static install(kind: 'fake' | null = 'fake'): () => void {
    const original = Object.getOwnPropertyDescriptor(window, 'ResizeObserver');
    FakeResizeObserver.instances.length = 0;
    Object.defineProperty(window, 'ResizeObserver', {
      configurable: true,
      writable: true,
      value: kind === 'fake' ? FakeResizeObserver : undefined,
    });
    return () => {
      if (original) Object.defineProperty(window, 'ResizeObserver', original);
      FakeResizeObserver.instances.length = 0;
    };
  }

  /** Reports `width` × `height` for every observed element of every live observer. */
  static trigger(width: number, height = 600): void {
    for (const observer of FakeResizeObserver.instances) observer.trigger(width, height);
  }

  observe(target: Element): void {
    this.targets.add(target);
  }

  unobserve(target: Element): void {
    this.targets.delete(target);
  }

  disconnect(): void {
    this.disconnected = true;
    this.targets.clear();
  }

  trigger(width: number, height = 600): void {
    if (this.disconnected) return;
    const size: ResizeObserverSize = { inlineSize: width, blockSize: height };
    const entries: ResizeObserverEntry[] = [...this.targets].map(target => ({
      target,
      contentRect: new DOMRectReadOnly(0, 0, width, height),
      borderBoxSize: [size],
      contentBoxSize: [size],
      devicePixelContentBoxSize: [size],
    }));
    if (entries.length) this.callback(entries, this);
  }
}

/** Stand-in for `window.IntersectionObserver`; `intersect(target)` reports the target as visible. */
export class FakeIntersectionObserver implements IntersectionObserver {
  static readonly instances: FakeIntersectionObserver[] = [];
  readonly root = null;
  readonly rootMargin = '0px';
  readonly thresholds = [0];
  readonly targets = new Set<Element>();
  disconnected = false;

  constructor(private readonly callback: IntersectionObserverCallback) {
    FakeIntersectionObserver.instances.push(this);
  }

  /** Replaces `window.IntersectionObserver` until the returned function runs. `null` removes it. */
  static install(kind: 'fake' | null = 'fake'): () => void {
    const original = Object.getOwnPropertyDescriptor(window, 'IntersectionObserver');
    FakeIntersectionObserver.instances.length = 0;
    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      writable: true,
      value: kind === 'fake' ? FakeIntersectionObserver : undefined,
    });
    return () => {
      if (original) Object.defineProperty(window, 'IntersectionObserver', original);
      FakeIntersectionObserver.instances.length = 0;
    };
  }

  observe(target: Element): void {
    this.targets.add(target);
  }

  unobserve(target: Element): void {
    this.targets.delete(target);
  }

  disconnect(): void {
    this.disconnected = true;
    this.targets.clear();
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  intersect(target: Element, isIntersecting = true): void {
    if (this.disconnected || !this.targets.has(target)) return;
    const rect = new DOMRectReadOnly();
    const entry: IntersectionObserverEntry = {
      target,
      isIntersecting,
      intersectionRatio: isIntersecting ? 1 : 0,
      boundingClientRect: rect,
      intersectionRect: rect,
      rootBounds: null,
      time: 0,
    };
    this.callback([entry], this);
  }
}

/** A real `SdDateTimeService` for `timeZone`, without TestBed. */
export function clockFor(timeZone: string): SdDateTimeService {
  const injector = Injector.create({
    providers: [{ provide: SD_CORE_CONFIGURATION, useValue: { timeZone } }, { provide: SdDateTimeService }],
  });
  return injector.get(SdDateTimeService);
}

/** Default "now" of the schedule specs: Monday 2026/11/09 10:40 in Asia/Ho_Chi_Minh. */
export const SCHEDULE_TEST_NOW = '2026/11/09 10:40';
export const SCHEDULE_TEST_ZONE = 'Asia/Ho_Chi_Minh';

/** Pins `now()` and `today()` of the service to the wall clock `'yyyy/MM/dd HH:mm'`. Returns a setter to move it. */
export function stubNow(service: SdDateTimeService, wallClock = SCHEDULE_TEST_NOW): (next: string) => void {
  let current = wallClock;
  const carrier = (): Date => {
    const [, y, mo, d, h, mi] = /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2})$/.exec(current)!.map(Number);
    return new Date(y, mo - 1, d, h, mi, 0, 0);
  };
  spyOn(service, 'now').and.callFake(() => carrier());
  spyOn(service, 'today').and.callFake(() => {
    const now = carrier();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  return next => (current = next);
}

const KEY_CODES: Record<string, string> = { ' ': 'Space', Enter: 'Enter', Escape: 'Escape', Tab: 'Tab' };

/** Dispatches a `keydown` with matching `key` and `code` on `element`; returns the event. */
export function press(
  element: EventTarget,
  key: string,
  modifiers: { alt?: boolean; shift?: boolean; ctrl?: boolean; meta?: boolean } = {}
): KeyboardEvent {
  const code = KEY_CODES[key] ?? (key.length === 1 ? `Key${key.toUpperCase()}` : key);
  const event = new KeyboardEvent('keydown', {
    key,
    code,
    altKey: !!modifiers.alt,
    shiftKey: !!modifiers.shift,
    ctrlKey: !!modifiers.ctrl,
    metaKey: !!modifiers.meta,
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(event);
  return event;
}

const placeholders = (text: string): string[] => [...new Set([...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]))].sort();

/**
 * Problems of the `prefix` keys across the five catalogs (TESTING.md §3.8): every `vi` key exists, is not empty and
 * uses the same `{placeholders}` in `en`, `ja`, `ko`, `zh`. A key listed in `flexible` may use any subset of the
 * names given for it instead (date titles whose wording differs per language).
 */
export function i18nParityProblems(prefix: string, flexible: Readonly<Record<string, readonly string[]>> = {}): string[] {
  const problems: string[] = [];
  const reference = I18N_MESSAGES.vi;
  const keys = Object.keys(reference).filter(key => key.startsWith(prefix));
  if (!keys.length) problems.push(`no key starts with ${prefix}`);
  for (const language of ['vi', 'en', 'ja', 'ko', 'zh'] as const) {
    const catalog = I18N_MESSAGES[language];
    for (const key of Object.keys(catalog).filter(name => name.startsWith(prefix) && !(name in reference))) {
      problems.push(`${language}: ${key} is not in vi`);
    }
    for (const key of keys) {
      const text = catalog[key];
      if (text === undefined) {
        problems.push(`${language}: missing ${key}`);
        continue;
      }
      if (!text.trim()) problems.push(`${language}: empty ${key}`);
      const allowed = flexible[key.slice(prefix.length)];
      const found = placeholders(text);
      if (allowed) {
        const extra = found.filter(name => !allowed.includes(name));
        if (extra.length) problems.push(`${language}: ${key} uses {${extra.join('}, {')}}`);
      } else if (found.join() !== placeholders(reference[key]).join()) {
        problems.push(`${language}: ${key} placeholders {${found.join('}, {')}} differ from vi`);
      }
    }
  }
  return problems;
}
