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
  // Mobile: default ?n nav (sidebar TOC chi?m ch? trên màn hình h?p).
  // Consumer truy?n `[hideNav]="false"` d? force hi?n trên mobile.
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

    // L?ng nghe thay d?i sections d? dang ký l?i observe section
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

    // Brower API IntersectionObserver s? h? tr? khi nào 1 section du?c hi?n ra trong wrapperEl
    this.#intersectionObserver = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // N?u section m?i di vào vùng nhìn th?y -> add vào set
            this.#visibleSections.add(entry.target);
          } else {
            // N?u section dã di ra kh?i vùng nhìn th?y -> xóa kh?i Set
            this.#visibleSections.delete(entry.target);
          }
        }

        // N?u dang scroll b?i click section thì return luôn, k ph?i quét qua tìm vùng section du?c active
        if (this.#isClickScrolling) {
          return;
        }

        for (const section of this.sections()) {
          // Ki?m tra xem DOM c?a section nào dang n?m trong danh sách dang nhìn th?y d? active chính xác
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

    // Ðang ký theo dõi t?ng section có trong anchor
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

    const prevScrollTop = wrapperEl.scrollTop; // Luu l?i v? trí cu?n hi?n t?i c?a container
    const scrollTop = prevScrollTop + targetElement.getBoundingClientRect().top - wrapperEl.getBoundingClientRect().top; // V? trí section c?n scroll t?i

    // Ðang ký s? ki?n n?u dã du?c scroll xong
    this.#clickScrollSubscription = fromEvent(wrapperEl, 'scrollend')
      .pipe(take(1))
      .subscribe(() => {
        this.#isClickScrolling = false;
      });

    // N?u sectionTarget dã ? dúng v? trí (click nhung không scroll) thì sau #timeoutScrollFallback kích ho?t l?i IntersectionObserver
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
