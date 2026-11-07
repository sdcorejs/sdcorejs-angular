import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Color } from '@sdcorejs/utils/models';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { ɵsdQueryParamState } from '@sdcorejs/angular/services/query-params';
import { Subscription, fromEvent, take } from 'rxjs';
import { AnchorNav } from '../anchor-nav/anchor-nav.component';
import { SdAnchorItem } from '../anchor-item/anchor-item.component';

@Component({
  selector: 'sd-anchor',
  templateUrl: './anchor.component.html',
  styleUrl: './anchor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, AnchorNav],
  standalone: true,
})
export class SdAnchor implements OnDestroy {
  wrapper = viewChild.required<ElementRef>('wrapper');
  sections = contentChildren(SdAnchorItem);

  readonly autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  readonly autoId = computed(() => (this.autoIdInput() ? `components-anchor-${this.autoIdInput()}` : undefined));

  sidebarWidth = input<string>('200px');
  ellipsis = input(false, { transform: booleanAttribute });
  overScroll = input(false, { transform: booleanAttribute });
  // why: default cũ là `BrowserUtilities.isMobile()` — đọc UA ngay lúc class được KHỞI TẠO
  // (module evaluation). Trên SSR không có `navigator` nên giá trị server khác client → hydration
  // lệch; và vì là hằng số nên resize/xoay máy không bao giờ đánh giá lại. Giờ `hideNav` chỉ còn
  // là cờ ép ẩn thủ công (default false), còn trạng thái mobile lấy từ SdViewportService — signal
  // SSR-safe, tự cập nhật theo breakpoint khi resize.
  hideNav = input(false, { transform: booleanAttribute });
  // why: giữ lại đường thoát cũ (`[hideNav]="false"` để buộc hiện TOC trên mobile) dưới dạng input
  // riêng, vì `hideNav=false` giờ là default nên không còn phân biệt được "không set" và "set false".
  hideNavOnMobile = input(true, { transform: booleanAttribute });
  // Màu highlight active nav (text + icon + vertical bar). Default 'primary'.
  color = input<Color>('primary');
  /**
   * Ghi mục đang xem lên query param `anchor-<autoId>` (giá trị `key` của `sd-anchor-item`, mục không có `key` dùng vị
   * trí 0-based) và cuộn tới mục đó khi mở link. Cần `autoId`. Mục đầu tiên thì param bị xoá. Mặc định tắt.
   */
  readonly syncQueryParams = input(false, { transform: booleanAttribute });

  readonly #viewport = inject(SdViewportService);
  // Trạng thái ẩn/hiện thực tế của nav: ép ẩn thủ công HOẶC đang ở breakpoint mobile.
  readonly navHidden = computed(() => this.hideNav() || (this.hideNavOnMobile() && this.#viewport.isMobile()));

  activeSectionId = signal<string>('');

  #initialized = false;
  #isClickScrolling = false;
  #clickScrollSubscription: Subscription | null = null;
  #intersectionObserver: IntersectionObserver | null = null;
  #visibleSections = new Set<Element>();
  #timeoutId: ReturnType<typeof setTimeout> | null = null;

  #timeoutScrollFallback = 200;

  // syncQueryParams: mục active sau khi đứng yên — cuộn qua nhiều mục không ghi URL liên tục.
  readonly #settledSectionId = signal('');
  readonly #rendered = signal(false);
  #settleTimer: ReturnType<typeof setTimeout> | null = null;
  #urlScrolled = false;
  readonly #settleDelay = 300;

  constructor() {
    afterNextRender(() => {
      this.#initialized = true;
      if (!this.navHidden()) {
        this.#registerIntersectionObserver();
      }
      this.#rendered.set(true);
    });

    effect(() => {
      const id = this.activeSectionId();
      if (!this.syncQueryParams()) return;
      untracked(() => {
        if (this.#settleTimer) clearTimeout(this.#settleTimer);
        this.#settleTimer = setTimeout(() => {
          this.#settleTimer = null;
          this.#settledSectionId.set(id);
        }, this.#settleDelay);
      });
    });

    ɵsdQueryParamState({
      selector: 'sd-anchor',
      prefix: 'anchor',
      enabled: this.syncQueryParams,
      autoId: this.autoIdInput,
      ready: () => this.#rendered() && this.sections().length > 0,
      state: () => {
        const sections = this.sections();
        const index = sections.findIndex(section => section.id === this.#settledSectionId());
        if (index <= 0) return null;
        return sections[index].key() || String(index);
      },
      apply: value => {
        const sections = this.sections();
        const target = sections.find(section => section.key() === value) ?? (/^\d+$/.test(value) ? sections[Number(value)] : undefined);
        // Mục chưa render (đến sau) hoặc key đã bỏ: giữ param, áp dụng khi mục xuất hiện hoặc tới khi người dùng đổi mục.
        if (!target) return false;
        // Lần đầu (mở link) nhảy thẳng tới mục; các lần sau cuộn mượt như bấm mục lục.
        this.#scrollToSection(target.id, this.#urlScrolled ? 'smooth' : 'instant');
        this.#urlScrolled = true;
        if (this.#settleTimer) clearTimeout(this.#settleTimer);
        this.#settledSectionId.set(target.id);
        return true;
      },
    });

    // Lắng nghe thay đổi sections để đăng ký lại observer cho từng section.
    // why: navHidden() phụ thuộc breakpoint nên effect chạy lại khi viewport đổi — phải
    // disconnect observer lúc nav bị ẩn, nếu không observer treo lại trên DOM đã tháo.
    effect(() => {
      this.sections();
      const hidden = this.navHidden();
      if (!this.#initialized) return;
      untracked(() => (hidden ? this.#cleanIntersectionObserver() : this.#registerIntersectionObserver()));
    });
  }

  #registerIntersectionObserver(): void {
    this.#cleanIntersectionObserver();
    const wrapperEl = this.wrapper().nativeElement;

    // Browser API IntersectionObserver hỗ trợ xác định section đang hiển thị trong wrapperEl.
    this.#intersectionObserver = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // Nếu section mới đi vào vùng nhìn thấy thì thêm vào set.
            this.#visibleSections.add(entry.target);
          } else {
            // Nếu section đã đi ra khỏi vùng nhìn thấy thì xóa khỏi set.
            this.#visibleSections.delete(entry.target);
          }
        }

        // Nếu đang scroll do click section thì không cần quét section đang active.
        if (this.#isClickScrolling) {
          return;
        }

        for (const section of this.sections()) {
          // Kiểm tra DOM của section nào đang nằm trong danh sách nhìn thấy để active chính xác.
          if (this.#visibleSections.has(section.elementRef.nativeElement)) {
            if (this.activeSectionId() !== section.id) {
              this.activeSectionId.set(section.id);
            }
            break;
          }
        }
      },
      { root: wrapperEl, threshold: 0 }
    );

    // Đăng ký theo dõi từng section có trong anchor.
    const sections = this.sections();
    for (const section of sections) {
      this.#intersectionObserver.observe(section.elementRef.nativeElement);
    }

    // why: activeSectionId chỉ được ghi bởi callback của IntersectionObserver và bởi
    // scrollSectionByClick — chưa cuộn thì không callback nào ghi, nên TOC mở ra không có mục nào
    // sáng. Cùng lỗi đó tái diễn khi resize mobile→desktop: nav vừa hiện lại đã trắng cho tới khi
    // người dùng cuộn. Seed ngay tại đây (nơi DUY NHẤT observer được dựng) về section đầu tiên.
    // Chỉ seed khi giá trị hiện tại KHÔNG còn trỏ vào section nào đang sống — vừa xử lý '' ban
    // đầu, vừa xử lý section bị gỡ, mà không đạp lên lựa chọn hợp lệ của người dùng.
    const active = this.activeSectionId();
    if (sections.length > 0 && !sections.some(section => section.id === active)) {
      this.activeSectionId.set(sections[0].id);
    }
  }

  scrollSectionByClick(idSectionTarget: string): void {
    this.#scrollToSection(idSectionTarget, 'smooth');
  }

  #scrollToSection(idSectionTarget: string, behavior: ScrollBehavior): void {
    this.activeSectionId.set(idSectionTarget);
    const targetSection = this.sections().find(s => s.id === idSectionTarget)?.elementRef;
    if (!targetSection) {
      return;
    }
    this.#cleanScrollSectionByClickObserver();
    this.#isClickScrolling = true;

    const wrapperEl = this.wrapper().nativeElement;
    const targetElement = targetSection.nativeElement;

    const prevScrollTop = wrapperEl.scrollTop; // Lưu lại vị trí cuộn hiện tại của container.
    const scrollTop = prevScrollTop + targetElement.getBoundingClientRect().top - wrapperEl.getBoundingClientRect().top; // Vị trí section cần scroll tới.

    // Đăng ký sự kiện khi scroll hoàn tất.
    this.#clickScrollSubscription = fromEvent(wrapperEl, 'scrollend')
      .pipe(take(1))
      .subscribe(() => {
        this.#isClickScrolling = false;
      });

    // Nếu sectionTarget đã ở đúng vị trí (click nhưng không scroll) thì kích hoạt lại IntersectionObserver sau timeout.
    this.#timeoutId = setTimeout(() => {
      if (wrapperEl.scrollTop === prevScrollTop) {
        this.#isClickScrolling = false;
        this.#clickScrollSubscription?.unsubscribe();
      }
    }, this.#timeoutScrollFallback);

    wrapperEl.scrollTo({ top: scrollTop, behavior });
  }

  #cleanScrollSectionByClickObserver = (): void => {
    if (this.#timeoutId) {
      clearTimeout(this.#timeoutId);
    }
    this.#clickScrollSubscription?.unsubscribe();
  };

  #cleanIntersectionObserver = (): void => {
    this.#intersectionObserver?.disconnect();
    this.#visibleSections.clear();
  };

  ngOnDestroy(): void {
    if (this.#settleTimer) clearTimeout(this.#settleTimer);
    this.#cleanScrollSectionByClickObserver();
    this.#cleanIntersectionObserver();
  }
}
