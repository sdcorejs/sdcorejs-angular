import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChildren,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, auditTime, debounceTime, filter, fromEvent, map, take } from 'rxjs';

import { SdAnchorVerticalList } from '../anchor-vertical/anchor-vertical-list.component';
import { SdAnchorItem } from '../anchor-item/anchor-item.component';

@Component({
  selector: 'sd-anchor',
  templateUrl: './anchor.component.html',
  styleUrls: ['./anchor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SdAnchorVerticalList],
  standalone: true,
})
export class SdAnchor implements OnDestroy {
  wrapper = viewChild.required<ElementRef>('wrapper');
  sections = contentChildren(SdAnchorItem);

  readonly autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  readonly autoId = computed(() => (this.autoIdInput() ? `components-anchor-${this.autoIdInput()}` : undefined));
  // Derive autoId cho từng item theo `key` (nếu consumer không truyền key → undefined, không bind).
  readonly itemAutoId = (key: string | undefined): string | undefined =>
    this.autoId() && key ? `${this.autoId()}-${key}` : undefined;

  type = input<'vertical' | 'horizontal'>('vertical');
  sidebarWidth = input<string>('200px');
  ellipsis = input(false, { transform: booleanAttribute });
  isOverscroll = input(false, { transform: booleanAttribute });
  isHiddenAnchorList = input(false, { transform: booleanAttribute });

  activeSectionId = signal<string>('');

  #scrollSubscription = new Subscription();
  #clickScrollSubscription = new Subscription();
  #delay = 100;
  #currentScrollTop = 0;
  #timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    afterNextRender(() => {
      if (!this.isHiddenAnchorList()) {
        this.activeSectionId.set(this.sections()[0]?.id ?? '');
        this.#registerScrollSubscription();
      }
    });
  }

  #registerScrollSubscription = (): void => {
    this.#disposeResources();
    const wrapperEl = this.wrapper().nativeElement;
    this.#scrollSubscription = fromEvent<UIEvent>(wrapperEl, 'scroll')
      .pipe(auditTime(50))
      .subscribe((event: UIEvent) => {
        const el = event.target as HTMLElement;
        this.#currentScrollTop = this.#updateCurrentScroll(el);
        for (const section of this.sections()) {
          const rect = section.elementRef.nativeElement;
          const rectTop = rect.offsetTop;
          const rectBottom = rectTop + rect.offsetHeight;
          if (this.#currentScrollTop >= rectTop && this.#currentScrollTop < rectBottom) {
            this.activeSectionId.set(section.id);
            break;
          }
        }
      });
  };

  scrollSectionByClick(idSectionTarget: string): void {
    this.activeSectionId.set(idSectionTarget);
    const targetSection = this.sections().find(s => s.id === idSectionTarget)?.elementRef;
    if (!targetSection) return;

    this.#disposeResources();
    const wrapperEl = this.wrapper().nativeElement;
    const targetElement = targetSection.nativeElement;
    const prevScrollTop = this.#currentScrollTop;

    this.#clickScrollSubscription = fromEvent<UIEvent>(wrapperEl, 'scroll')
      .pipe(
        auditTime(this.#delay),
        map((event: UIEvent) => {
          const el = event.target as HTMLElement;
          this.#currentScrollTop = this.#updateCurrentScroll(el);
          const wrapperTop = wrapperEl.getBoundingClientRect().top;
          const targetRect = targetElement.getBoundingClientRect();
          const isVisible = targetRect.top >= 0 && targetRect.bottom <= window.innerHeight;
          return Math.abs(targetRect.top - wrapperTop) < 1 || isVisible;
        }),
        filter(Boolean),
        debounceTime(this.#delay + 100),
        take(1)
      )
      .subscribe(() => this.#registerScrollSubscription());

    this.#timeoutId = setTimeout(() => {
      if (prevScrollTop === this.#currentScrollTop) {
        this.#registerScrollSubscription();
      }
    }, this.#delay + 100);

    wrapperEl.scrollTo({ top: targetElement.offsetTop, behavior: 'smooth' });
  }

  #updateCurrentScroll(el: HTMLElement): number {
    const style = getComputedStyle(el);
    return el.scrollTop + parseFloat(style.paddingTop) + parseFloat(style.borderTopWidth);
  }

  #disposeResources = (): void => {
    if (this.#timeoutId) clearTimeout(this.#timeoutId);
    this.#scrollSubscription?.unsubscribe();
    this.#clickScrollSubscription?.unsubscribe();
  };

  ngOnDestroy(): void {
    this.#disposeResources();
  }
}
