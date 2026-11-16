import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, Signal, inject, signal } from '@angular/core';

/** Thiết bị khớp media query này được coi là màn hình cảm ứng: cuộn ngang luôn bật, không phụ thuộc hover. */
export const SD_SCROLL_TOUCH_MEDIA_QUERY = '(hover: none), (any-pointer: coarse)';

/**
 * Nội bộ của `SdScrollDirective` (không export khỏi entry point `directives`).
 *
 * why: mỗi `sdScroll` tự gọi `matchMedia` thì trang có N bảng sẽ có N listener `change`. Service root giữ đúng
 * một `MediaQueryList` và một listener cho cả ứng dụng; directive chỉ đọc signal `touch`.
 */
@Injectable({ providedIn: 'root' })
export class SdScrollPointerService {
  readonly #touch = signal(false);

  /** `true` khi thiết bị khớp `SD_SCROLL_TOUCH_MEDIA_QUERY`; `false` khi không khớp hoặc không có `matchMedia` (SSR, test). */
  readonly touch: Signal<boolean> = this.#touch.asReadonly();

  constructor() {
    const view = inject(DOCUMENT).defaultView;
    if (typeof view?.matchMedia !== 'function') {
      return;
    }
    const query = view.matchMedia(SD_SCROLL_TOUCH_MEDIA_QUERY);
    this.#touch.set(query.matches);
    const onChange = (event: MediaQueryListEvent) => this.#touch.set(event.matches);
    query.addEventListener('change', onChange);
    // why: gỡ listener khi root injector bị huỷ (đóng ứng dụng, hoặc sau mỗi test của TestBed).
    inject(DestroyRef).onDestroy(() => query.removeEventListener('change', onChange));
  }
}
