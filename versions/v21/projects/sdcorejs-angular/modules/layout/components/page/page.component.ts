import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  isDevMode,
  NgZone,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SdBadge, type SdBadgeData } from '@sdcorejs/angular/components/badge';
import { SD_SECTION_REGISTRY, type SdSection, type SdSectionRegistry } from '@sdcorejs/angular/components/section';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

/** Bề rộng cột nội dung: `full` không giới hạn · `wide` 1200px · `medium` 960px · `narrow` 720px. */
export type SdPageWidth = 'full' | 'wide' | 'medium' | 'narrow';

/** Đích của nút ←: URL hoặc router commands như `routerLink`. */
export type SdPageBackLink = string | readonly unknown[];

/** Vị trí cột phụ `[sdAside]` khi đủ chỗ đặt cạnh nội dung. */
export type SdPageAside = 'end' | 'start';

const SD_PAGE_MAX_BADGES = 2;

// why: một component cho cả ba selector, mặc định khác nhau theo tên thẻ host.
const SD_PAGE_DEFAULT_WIDTH: Record<string, SdPageWidth> = {
  'sd-page': 'full',
  'sd-page-detail': 'wide',
  'sd-page-form': 'medium',
};

interface SdPageTocItem {
  readonly title: string;
  readonly el: HTMLElement;
}

@Component({
  selector: 'sd-page, sd-page-detail, sd-page-form',
  templateUrl: './page.component.html',
  styleUrl: './page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SdBadge, SdIcon, SdTranslatePipe],
  host: {
    '[class.sd-page--wide]': "resolvedWidth() === 'wide'",
    '[class.sd-page--medium]': "resolvedWidth() === 'medium'",
    '[class.sd-page--narrow]': "resolvedWidth() === 'narrow'",
    '[class.sd-page--aside-start]': "aside() === 'start'",
  },
  providers: [{ provide: SD_SECTION_REGISTRY, useExisting: forwardRef(() => SdPageComponent) }],
})
export class SdPageComponent implements SdSectionRegistry {
  private el = inject(ElementRef);
  readonly #zone = inject(NgZone);
  readonly #destroyRef = inject(DestroyRef);
  readonly #injector = inject(Injector);
  readonly #defaultWidth = SD_PAGE_DEFAULT_WIDTH[(this.el.nativeElement as HTMLElement).tagName.toLowerCase()] ?? 'full';

  title = input<string>('', { alias: 'title' });
  description = input<string>('', { alias: 'description' });
  noHeader = input(false, { transform: booleanAttribute, alias: 'noHeader' });

  /** Hiện nút ← trước title; title, description và badges vẫn lấy từ input. */
  backLink = input<SdPageBackLink | null | undefined>();
  /** Tối đa 2 badge cạnh title: trạng thái trước, thuộc tính sau. Badge không có `title` bị bỏ qua. */
  badges = input<readonly SdBadgeData[] | null | undefined>();
  /** `null` / không truyền thì lấy mặc định theo selector: `sd-page` full · `sd-page-detail` wide · `sd-page-form` medium. */
  width = input<SdPageWidth | null | undefined>();
  /** Cột phụ ở cuối (mặc định) hay ở đầu. Viewport < 1200px thì cột phụ luôn xuống dưới nội dung. */
  aside = input<SdPageAside | null | undefined>();
  /** Mục lục ở cột phụ, liệt kê các `sd-section` có `title` ở cấp ngoài cùng của thân trang. */
  toc = input(false, { transform: booleanAttribute });

  readonly resolvedWidth = computed<SdPageWidth>(() => this.width() ?? this.#defaultWidth);
  protected readonly visibleBadges = computed(() =>
    (this.badges() ?? []).filter(badge => badge.title !== null && badge.title !== undefined && badge.title !== '')
  );
  /** Header có nút ← hoặc badge: title một dòng, cắt bằng dấu "…". Màn cũ giữ title xuống dòng như trước. */
  protected readonly hasLead = computed(() => !!this.backLink() || this.visibleBadges().length > 0);

  // why: section tự đăng ký qua SD_SECTION_REGISTRY, kể cả section nằm trong component con của thân trang (form
  // tách theo nhóm), điều mà contentChildren không thấy được.
  readonly #sections = signal<readonly { readonly section: SdSection; readonly el: HTMLElement }[]>([]);
  // why: section lồng được chèn vào section cha khi view của section cha render, tức sau template của sd-page,
  // nên danh sách tính lại sau mỗi lần render chứ không tính ngay trong computed.
  protected readonly tocItems = signal<readonly SdPageTocItem[]>([]);
  protected readonly activeTocIndex = signal(0);

  // why: fallback của slot headerLeft chỉ render khi không có headerLeft/sdHeaderLeft, nên vắng nó nghĩa là
  // vùng trái đã bị thay và backLink không có chỗ hiện.
  private readonly titleBlock = viewChild<ElementRef<HTMLElement>>('titleBlock');
  private readonly wrapper = viewChild.required<ElementRef<HTMLElement>>('wrapper');

  constructor() {
    effect(() => {
      if (this.title()) {
        this.el.nativeElement.removeAttribute('title');
      }
    });

    effect(() => {
      const enabled = this.toc();
      const entries = this.#sections().map(entry => ({ title: entry.section.title(), el: entry.el }));
      afterNextRender(() => this.tocItems.set(enabled ? this.#collectToc(entries) : []), { injector: this.#injector });
    });

    afterNextRender(() => {
      const wrapper = this.wrapper().nativeElement;
      const onScroll = (): void => this.#syncActiveToc();
      // why: scroll bắn liên tục; chỉ signal đổi mới cần render lại, không cần chạy change detection mỗi lần.
      this.#zone.runOutsideAngular(() => wrapper.addEventListener('scroll', onScroll, { passive: true }));
      this.#destroyRef.onDestroy(() => wrapper.removeEventListener('scroll', onScroll));
    });

    if (isDevMode()) {
      effect(() => {
        const badges = this.badges() ?? [];
        const types = badges.map(badge => badge.type ?? 'round');
        if (badges.length > SD_PAGE_MAX_BADGES || new Set(types).size !== types.length) {
          console.warn(
            `[sd-page] badges nhận tối đa ${SD_PAGE_MAX_BADGES} badge và không trùng type (mặc định 'round'): badge đầu là trạng thái, badge sau là thuộc tính. Đang có: ${JSON.stringify(types)}.`
          );
        }
      });
      effect(() => {
        const backLink = this.backLink();
        const noHeader = this.noHeader();
        // why: the effect of a routed page runs before its view exists, when titleBlock is still undefined; read it
        // after render, or every page with a backLink warns once.
        afterNextRender(
          () => {
            if (backLink && !noHeader && !this.titleBlock()) {
              console.warn('[sd-page] backLink bị bỏ qua vì headerLeft/sdHeaderLeft đã thay cả vùng trái của header.');
            }
          },
          { injector: this.#injector }
        );
      });
    }
  }

  /** Cuộn tới section của mục lục thứ `index`. */
  protected scrollToSection(index: number): void {
    const item = this.tocItems()[index];
    if (!item) return;
    this.activeTocIndex.set(index);
    const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    item.el.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  /** Thêm một section ngoài cùng của thân trang vào mục lục (gọi bởi `sd-section`). */
  register(section: SdSection, el: HTMLElement): () => void {
    this.#sections.update(entries => [...entries, { section, el }]);
    return () => this.#sections.update(entries => entries.filter(entry => entry.section !== section));
  }

  #collectToc(entries: readonly { readonly title: string | null | undefined; readonly el: HTMLElement }[]): SdPageTocItem[] {
    const content = (this.el.nativeElement as HTMLElement).querySelector(':scope > .c-page-wrapper > .c-page-content');
    return entries
      .filter((entry): entry is SdPageTocItem => !!entry.title && !!content?.contains(entry.el))
      .sort((left, right) => (left.el.compareDocumentPosition(right.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  }

  #syncActiveToc(): void {
    const items = this.tocItems();
    if (!items.length) return;
    const wrapper = this.wrapper().nativeElement;
    // why: cuộn tới đáy thì section cuối có thể không bao giờ chạm mép trên; khi đó nó là section đang đọc.
    if (wrapper.scrollTop + wrapper.clientHeight >= wrapper.scrollHeight - 1) {
      this.activeTocIndex.set(items.length - 1);
      return;
    }
    const top = wrapper.getBoundingClientRect().top;
    let active = 0;
    items.forEach((item, index) => {
      if (item.el.getBoundingClientRect().top - top <= 8) active = index;
    });
    this.activeTocIndex.set(active);
  }
}
