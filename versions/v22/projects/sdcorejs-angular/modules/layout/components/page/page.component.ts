import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  DestroyRef,
  effect,
  ElementRef,
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
import { SdSection } from '@sdcorejs/angular/components/section';
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
})
export class SdPageComponent {
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

  // why: signal query không chạy trên field #private (NG1053).
  private readonly sections = contentChildren(SdSection, { descendants: true });
  private readonly sectionElements = contentChildren(SdSection, { descendants: true, read: ElementRef });
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
      const sections = this.sections();
      const elements = this.sectionElements();
      const titles = sections.map(section => section.title());
      afterNextRender(() => this.tocItems.set(enabled ? this.#collectToc(titles, elements) : []), { injector: this.#injector });
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
        if (this.backLink() && !this.noHeader() && !this.titleBlock()) {
          console.warn('[sd-page] backLink bị bỏ qua vì headerLeft/sdHeaderLeft đã thay cả vùng trái của header.');
        }
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

  #collectToc(titles: readonly (string | null | undefined)[], elements: readonly ElementRef[]): SdPageTocItem[] {
    const host = this.el.nativeElement as HTMLElement;
    return titles.flatMap((title, index) => {
      const el = elements[index]?.nativeElement as HTMLElement | undefined;
      // why: chỉ lấy section ngoài cùng; section lồng bên trong là một phần của section cha.
      const outer = el?.parentElement?.closest('sd-section');
      return el && title && !(outer && host.contains(outer)) ? [{ title, el }] : [];
    });
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
