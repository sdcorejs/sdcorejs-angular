import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  booleanAttribute,
  contentChildren,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, auditTime, debounceTime, filter, fromEvent, map, take } from 'rxjs';

import { SdAnchorVerticalListV2 } from '../anchor-vertical-v2/anchor-vertical-list-v2.component';
import { SdAnchorItemV2 } from '../anchor-item-v2/anchor-item-v2.component';

@Component({
  selector: 'sd-anchor-v2',
  templateUrl: './anchor-v2.component.html',
  styleUrls: ['./anchor-v2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SdAnchorVerticalListV2],
  standalone: true,
})
export class SdAnchorV2 implements OnDestroy {
  wrapper = viewChild.required<ElementRef>('wrapper');
  sections = contentChildren(SdAnchorItemV2);

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
