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
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserUtilities } from '@sdcorejs/utils/fns';
import { Color } from '@sdcorejs/utils/models';
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
  // Mobile: mặc định ẩn nav (sidebar TOC chiếm chỗ trên màn hình hẹp).
  // Consumer truyền `[hideNav]="false"` để buộc hiển thị trên mobile.
  hideNav = input(BrowserUtilities.isMobile(), { transform: booleanAttribute });
  // Màu highlight active nav (text + icon + vertical bar). Default 'primary'.
  color = input<Color>('primary');

  activeSectionId = signal<string>('');

  #initialized = false;
  #isClickScrolling = false;
  #clickScrollSubscription: Subscription | null = null;
  #intersectionObserver: IntersectionObserver | null = null;
  #visibleSections = new Set<Element>();
  #timeoutId: ReturnType<typeof setTimeout> | null = null;

  #timeoutScrollFallback = 200;

  constructor() {
    afterNextRender(() => {
      this.#initialized = true;
      if (!this.hideNav()) {
        this.#registerIntersectionObserver();
      }
    });

    // Lắng nghe thay đổi sections để đăng ký lại observer cho từng section.
    effect(() => {
      this.sections();
      if (!this.hideNav() && this.#initialized) {
        untracked(() => this.#registerIntersectionObserver());
      }
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
    for (const section of this.sections()) {
      this.#intersectionObserver.observe(section.elementRef.nativeElement);
    }
  }

  scrollSectionByClick(idSectionTarget: string): void {
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

    wrapperEl.scrollTo({ top: scrollTop, behavior: 'smooth' });
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
    this.#cleanScrollSectionByClickObserver();
    this.#cleanIntersectionObserver();
  }
}
