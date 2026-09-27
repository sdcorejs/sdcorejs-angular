import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import {
  Directive,
  ElementRef,
  HostListener,
  TemplateRef,
  ViewContainerRef,
  inject,
  input,
  DestroyRef,
  ComponentRef,
  Component,
  ChangeDetectorRef,
  computed,
} from '@angular/core';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { Overlay, OverlayRef, ConnectionPositionPair } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/** Nền mặc định: token `--sd-tooltip-bg`, fallback là màu cũ để không đổi giao diện khi chưa có theme. */
const SD_TOOLTIP_DEFAULT_COLOR = 'var(--sd-tooltip-bg, #616161)';

// Component dùng để instance cho overlay
@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  selector: 'sd-tooltip-container',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    <div class="c-sd-tooltip-container" role="tooltip" [attr.id]="tooltipId() || null" [style.background-color]="color()">
      @if (isTemplate()) {
        <ng-container [ngTemplateOutlet]="templateContent()"></ng-container>
      } @else {
        <span class="c-sd-tooltip-text">{{ textContent() }}</span>
      }
    </div>
  `,
  styles: [
    `
      .c-sd-tooltip-container {
        padding: 6px 8px;
        border-radius: 4px;
        color: white;
        font-size: 12px;
        font-family: Roboto, 'Helvetica Neue', sans-serif;
        box-shadow:
          0 2px 4px -1px rgba(0, 0, 0, 0.2),
          0 4px 5px rgba(0, 0, 0, 0.14),
          0 1px 10px rgba(0, 0, 0, 0.12);
        max-width: 250px;
        word-wrap: break-word;
        pointer-events: auto;
        user-select: text;
      }
    `,
  ],
  host: {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
  },
})
class SdTooltipComponent {
  private cdr = inject(ChangeDetectorRef);

  content = input.required<string | TemplateRef<any>>();
  color = input<string>(SD_TOOLTIP_DEFAULT_COLOR);
  tooltipId = input<string>('');

  isTemplate = computed(() => this.content() instanceof TemplateRef);
  templateContent = computed(() => (this.isTemplate() ? (this.content() as TemplateRef<any>) : null));
  textContent = computed(() => (!this.isTemplate() ? (this.content() as string) : ''));
  onMouseEnterCb?: () => void;
  onMouseLeaveCb?: () => void;

  onMouseEnter() {
    this.onMouseEnterCb?.();
  }

  onMouseLeave() {
    this.onMouseLeaveCb?.();
  }

  triggerChangeDetection() {
    this.cdr.detectChanges();
  }
}
// End

let nextTooltipId = 0;

// Directive
@Directive({
  selector: '[sdTooltip]',
  standalone: true,
})
export class SdTooltipDirective {
  content = input.required<string | TemplateRef<any>>({ alias: 'sdTooltip' });
  sdTooltipPosition = input<TooltipPosition>('bottom');
  sdTooltipDelay = input<number>(100);
  sdTooltipColor = input<string>(SD_TOOLTIP_DEFAULT_COLOR);

  private static activeTooltip: SdTooltipDirective | null = null;

  private readonly elementRef = inject(ElementRef);
  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);

  private overlayRef: OverlayRef | null = null;
  private tooltipComponentRef: ComponentRef<SdTooltipComponent> | null = null;
  private tooltipInstance: SdTooltipComponent | null = null;

  private showTimeout: ReturnType<typeof setTimeout> | undefined;
  private hideTimeout: ReturnType<typeof setTimeout> | undefined;

  /** Id của bubble, dùng cho `aria-describedby` của host. */
  readonly #tooltipId = `sd-tooltip-${nextTooltipId++}`;
  // why: hover và focus là hai trigger độc lập (WCAG 1.4.13 "persistent"): rời một trigger mà trigger
  // kia còn giữ thì tooltip phải còn hiện.
  #hovered = false;
  #focused = false;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.#cleanup();
    });
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    this.#hovered = true;
    this.#activate();
    this.#clearTimeouts();
    this.showTimeout = setTimeout(() => {
      this.#show();
    }, this.sdTooltipDelay());
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.#hovered = false;
    this.#clearTimeouts();
    if (this.#focused) return;
    this.hideTimeout = setTimeout(() => {
      this.#hide();
    }, 300);
  }

  /**
   * why: tooltip trước đây chỉ mở bằng chuột, người dùng bàn phím không bao giờ đọc được nội dung.
   * Dùng `focusin`/`focusout` (có nổi bọt) để phủ cả trường hợp host bọc một phần tử focus được.
   * Hiện ngay, không chờ delay, để `aria-describedby` đã có khi screen reader đọc phần tử vừa focus.
   */
  @HostListener('focusin')
  onFocusIn() {
    this.#focused = true;
    this.#activate();
    this.#clearTimeouts();
    this.#show();
  }

  @HostListener('focusout', ['$event'])
  onFocusOut(event: FocusEvent) {
    const next = event.relatedTarget as Node | null;
    if (next && (this.elementRef.nativeElement as HTMLElement).contains(next)) return;
    this.#focused = false;
    if (this.#hovered) return;
    this.#clearTimeouts();
    this.#hide();
  }

  forceHide = (): void => {
    this.#clearTimeouts();
    this.#hide();
  };

  #activate = (): void => {
    if (SdTooltipDirective.activeTooltip && SdTooltipDirective.activeTooltip !== this) {
      SdTooltipDirective.activeTooltip.forceHide();
    }
    SdTooltipDirective.activeTooltip = this;
  };

  #show = (): void => {
    const currentContent = this.content();

    if (!currentContent) return;

    if (!this.overlayRef) {
      this.#createOverlay();
    }

    if (this.overlayRef && !this.overlayRef.hasAttached()) {
      const portal = new ComponentPortal(SdTooltipComponent, this.viewContainerRef);
      this.tooltipComponentRef = this.overlayRef.attach(portal);
      this.tooltipInstance = this.tooltipComponentRef.instance;

      this.#setupTooltipInstance();
      this.#addDescribedBy();
      // why: listener chỉ sống trong lúc tooltip hiện, để phím Escape của trang không bị đụng tới.
      this.document.addEventListener('keydown', this.#onDocumentKeydown, true);
    }

    if (this.tooltipComponentRef && this.tooltipInstance) {
      this.tooltipComponentRef.setInput('content', currentContent);
      this.tooltipComponentRef.setInput('color', this.sdTooltipColor());
      this.tooltipComponentRef.setInput('tooltipId', this.#tooltipId);
      this.tooltipInstance.triggerChangeDetection();
    }
  };

  #hide = (): void => {
    this.document.removeEventListener('keydown', this.#onDocumentKeydown, true);
    this.#removeDescribedBy();
    if (this.tooltipInstance && this.overlayRef?.hasAttached()) {
      this.overlayRef.detach();
      this.tooltipInstance = null;
      this.tooltipComponentRef = null;
    }
  };

  /**
   * why: WCAG 1.4.13 yêu cầu đóng được tooltip mà không dời chuột/focus. Pha capture để chạy trước
   * handler Escape của dialog/drawer bên dưới; chỉ chặn lan sự kiện khi thực sự vừa ẩn một tooltip,
   * nên lần Escape kế tiếp vẫn tới đích như bình thường.
   */
  #onDocumentKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' && event.key !== 'Esc') return;
    if (!this.overlayRef?.hasAttached()) return;
    this.forceHide();
    event.stopPropagation();
  };

  #addDescribedBy = (): void => {
    const host = this.elementRef.nativeElement as HTMLElement;
    const ids = (host.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    if (!ids.includes(this.#tooltipId)) host.setAttribute('aria-describedby', [...ids, this.#tooltipId].join(' '));
  };

  // why: chỉ gỡ đúng id của mình — id do consumer/component khác đặt vào `aria-describedby` giữ nguyên.
  #removeDescribedBy = (): void => {
    const host = this.elementRef.nativeElement as HTMLElement;
    const current = host.getAttribute('aria-describedby');
    if (current == null) return;
    const ids = current.split(/\s+/).filter(id => id && id !== this.#tooltipId);
    if (ids.length) host.setAttribute('aria-describedby', ids.join(' '));
    else host.removeAttribute('aria-describedby');
  };

  #createOverlay = (): void => {
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.elementRef)
      .withPositions(this.#getPositions())
      .withViewportMargin(8)
      .withPush(false);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close(),
      panelClass: 'c-sd-tooltip-panel',
    });
  };

  #setupTooltipInstance = (): void => {
    if (!this.tooltipInstance) return;

    this.tooltipInstance.onMouseEnterCb = () => {
      clearTimeout(this.hideTimeout);
    };

    this.tooltipInstance.onMouseLeaveCb = () => {
      if (this.#focused) return;
      this.hideTimeout = setTimeout(() => {
        this.#hide();
      }, 200);
    };
  };

  #clearTimeouts = (): void => {
    clearTimeout(this.showTimeout);
    clearTimeout(this.hideTimeout);
  };

  #cleanup = (): void => {
    this.#clearTimeouts();
    this.document.removeEventListener('keydown', this.#onDocumentKeydown, true);
    this.#removeDescribedBy();

    if (SdTooltipDirective.activeTooltip === this) {
      SdTooltipDirective.activeTooltip = null;
    }

    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }

    // Xóa mọi tham chiếu
    this.tooltipInstance = null;
    this.tooltipComponentRef = null;
  };

  #getPositions = (): ConnectionPositionPair[] => {
    const offset = 8;
    const topPos: ConnectionPositionPair = { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -offset };
    const bottomPos: ConnectionPositionPair = {
      originX: 'center',
      originY: 'bottom',
      overlayX: 'center',
      overlayY: 'top',
      offsetY: offset,
    };
    const leftPos: ConnectionPositionPair = { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -offset };
    const rightPos: ConnectionPositionPair = { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: offset };

    switch (this.sdTooltipPosition()) {
      case 'top':
        return [topPos, bottomPos, rightPos, leftPos];
      case 'bottom':
        return [bottomPos, topPos, rightPos, leftPos];
      case 'left':
        return [leftPos, rightPos, topPos, bottomPos];
      case 'right':
        return [rightPos, leftPos, topPos, bottomPos];
      default:
        return [bottomPos, topPos];
    }
  };
}
// End
