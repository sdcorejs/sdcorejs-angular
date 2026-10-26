import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  forwardRef,
  inject,
  InjectionToken,
  Injector,
  input,
  isDevMode,
  signal,
  type Signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import type { SdBadgeData } from '@sdcorejs/angular/components/badge';
import { SD_TABLE_LAYOUT, type SdTableLayout } from '@sdcorejs/angular/components/table';
import { SdPageComponent, type SdPageBackLink, type SdPageWidth } from '../page/page.component';

/**
 * Cách mở chi tiết (route con của danh sách): thay danh sách bằng một trang, drawer đè lên danh sách, hoặc `'none'`:
 * `sd-page-list` không đặt router-outlet, route con hiện trong outlet do màn tự đặt trong thân (chia đôi).
 */
export type SdPageListDetail = 'page' | 'drawer' | 'none';

/** Trạng thái `sd-page-list` mà nội dung bên trong (score card, route con…) đọc qua `SD_PAGE_LIST`. */
export interface SdPageListContext {
  /** Màn thấp (viewport cao < 720px) và `autoCompact` bật: vùng phụ nên chuyển sang dạng gọn. */
  readonly compact: Signal<boolean>;
  /** Đang có route con (chi tiết, tạo, cập nhật). */
  readonly childActive: Signal<boolean>;
  readonly detail: Signal<SdPageListDetail>;
}

export const SD_PAGE_LIST = new InjectionToken<SdPageListContext>('SD_PAGE_LIST');

const SHORT_VIEWPORT = '(max-height: 719px)';

interface SavedScroll {
  readonly el: Element;
  readonly top: number;
  readonly left: number;
}

@Component({
  selector: 'sd-page-list',
  templateUrl: './page-list.component.html',
  styleUrl: './page-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdPageComponent, RouterOutlet],
  host: { '[class.sd-page-list--child-page]': 'hidesList()' },
  providers: [
    { provide: SD_PAGE_LIST, useExisting: forwardRef(() => SdPageList) },
    { provide: SD_TABLE_LAYOUT, useExisting: forwardRef(() => SdPageList) },
  ],
})
export class SdPageList implements SdPageListContext, SdTableLayout {
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly #injector = inject(Injector);
  readonly #destroyRef = inject(DestroyRef);

  title = input<string>('');
  description = input<string>('');
  backLink = input<SdPageBackLink | null | undefined>();
  badges = input<readonly SdBadgeData[] | null | undefined>();
  width = input<SdPageWidth | null | undefined>();
  /** Chi tiết là route con: `page` thay danh sách bằng trang con, `drawer` giữ danh sách và mở drawer. */
  detail = input<SdPageListDetail>('page');
  /** Tự thu gọn vùng phụ khi viewport thấp. Tắt thì vùng phụ luôn đầy đủ và thân trang cuộn khi thiếu chỗ. */
  autoCompact = input(true, { transform: booleanAttribute });

  readonly #shortViewport = signal(false);
  readonly compact = computed(() => this.autoCompact() && this.#shortViewport());
  readonly childActive = signal(false);
  /** Bảng chính: `[sdPageListMain]`, hoặc `sd-table` con trực tiếp cuối cùng của thân trang. */
  readonly fillTarget = signal<Element | null>(null);
  readonly externalFilterCollapsed = this.compact;
  protected readonly hidesList = computed(() => this.childActive() && this.detail() === 'page');

  #savedScroll: readonly SavedScroll[] = [];
  #returnFocus: HTMLElement | null = null;

  constructor() {
    const media = typeof matchMedia === 'function' ? matchMedia(SHORT_VIEWPORT) : null;
    if (media) {
      this.#shortViewport.set(media.matches);
      const onChange = (event: MediaQueryListEvent): void => this.#shortViewport.set(event.matches);
      media.addEventListener('change', onChange);
      this.#destroyRef.onDestroy(() => media.removeEventListener('change', onChange));
    }

    afterNextRender(() => {
      const content = this.#content();
      if (!content) return;
      this.#syncMain(content);
      // why: bảng có thể nằm trong @if của feature; nội dung đổi thì chọn lại bảng chính.
      const observer = new MutationObserver(() => this.#syncMain(content));
      observer.observe(content, { childList: true });
      this.#destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected onActivate(): void {
    const active = document.activeElement;
    const list = this.#list();
    // why: một route con thay route con khác (chi tiết → cập nhật) thì phần tử đang focus nằm trong route con cũ;
    // giữ phần tử của danh sách đã mở route con đầu tiên, và vị trí cuộn ghi lúc danh sách còn hiện.
    const opener = active instanceof HTMLElement && list?.contains(active) ? active : null;
    this.#returnFocus = opener ?? this.#returnFocus;
    // why: display:none làm mất vị trí cuộn; ghi lại trước khi ẩn danh sách để trả về khi quay lại.
    const scroll = this.detail() === 'page' && list ? this.#captureScroll(list) : [];
    this.#savedScroll = scroll.length ? scroll : this.#savedScroll;
    this.childActive.set(true);
  }

  protected onDeactivate(): void {
    this.childActive.set(false);
    afterNextRender(
      () => {
        // Route con khác đã mở ngay sau (đổi route con): danh sách vẫn ẩn, giữ focus và vị trí cuộn cho lúc quay về.
        if (this.childActive()) return;
        for (const saved of this.#savedScroll) {
          saved.el.scrollTop = saved.top;
          saved.el.scrollLeft = saved.left;
        }
        this.#savedScroll = [];
        if (this.#returnFocus?.isConnected) this.#returnFocus.focus();
        this.#returnFocus = null;
      },
      { injector: this.#injector }
    );
  }

  #list(): HTMLElement | null {
    return this.#host.querySelector(':scope > sd-page');
  }

  #content(): HTMLElement | null {
    return this.#host.querySelector(':scope > sd-page > .c-page-wrapper > .c-page-content');
  }

  #syncMain(content: HTMLElement): void {
    const children = [...content.children];
    const marked = children.filter(child => child.hasAttribute('sdPageListMain'));
    if (isDevMode() && marked.length > 1) {
      console.warn('[sd-page-list] Chỉ một phần tử được gắn sdPageListMain; dùng phần tử đầu tiên.');
    }
    const main = marked[0] ?? children.filter(child => child.tagName === 'SD-TABLE').at(-1) ?? null;
    if (main !== this.fillTarget()) this.fillTarget.set(main);
  }

  #captureScroll(root: HTMLElement): SavedScroll[] {
    const saved: SavedScroll[] = [];
    for (const el of [root, ...root.querySelectorAll('*')]) {
      if (el.scrollTop || el.scrollLeft) saved.push({ el, top: el.scrollTop, left: el.scrollLeft });
    }
    return saved;
  }
}
