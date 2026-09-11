import { DestroyRef, Directive, ElementRef, inject, Renderer2, HostListener, OnInit, OnChanges, SimpleChanges, input } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { DomPortal } from '@angular/cdk/portal';
import { BrowserUtilities } from '@sdcorejs/utils/fns';
import { I18nService } from '@sdcorejs/angular/i18n';

@Directive({
  selector: '[sdHoverCopy]',
})
export class SdHoverCopyDirective implements OnInit, OnChanges {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  readonly copyText = input.required<string>({ alias: 'sdHoverCopy' });
  readonly sdHoverCopyDisabled = input(false);

  readonly #i18n = inject(I18nService);
  readonly #destroyRef = inject(DestroyRef);
  readonly #overlay = inject(Overlay);
  readonly #document = inject(DOCUMENT);

  #copyButton: HTMLElement | null = null;
  #tooltip!: HTMLElement;
  #tooltipOverlay: OverlayRef | null = null;
  #unlistenCopy: (() => void) | null = null;
  readonly #onScroll = () => this.#hideTooltip();
  #hideTooltipTimer: ReturnType<typeof setTimeout> | null = null;
  get #defaultTooltip(): string {
    return this.#i18n.t('core.directive.hover-copy.tooltip');
  }
  // why: tooltip mặc định đã đi qua I18nService từ trước, riêng phản hồi sau khi copy vẫn cứng
  // 'Copied' — cùng một tooltip mà hai ngôn ngữ. Đọc lúc hiển thị để bám ngôn ngữ hiện tại.
  get #copiedTooltip(): string {
    return this.#i18n.t('core.directive.hover-copy.copied');
  }

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    // why: timeout 1s ẩn tooltip trước đây không được lưu lại cũng không huỷ, mà directive lại
    // không có teardown nào. Host bị destroy trong vòng 1s đó thì callback vẫn chạy và ghi style
    // lên node đã tháo khỏi DOM (timer sống lâu hơn view).
    this.#destroyRef.onDestroy(() => this.#removeCopyButton());
  }

  // https://onemount.atlassian.net/browse/SM-2287
  // Hiện tại khi sdHoverCopyDisabled = true, directive chỉ dùng opacity: 0 và pointerEvents: 'none' để ẩn nút, nhưng điều này không hoàn toàn ngăn chặn được việc click trong một số trường hợp.
  // Giải pháp: Remove khỏi DOM nếu column không được enable
  ngOnInit(): void {
    if (!this.sdHoverCopyDisabled()) {
      this.#createAndAppendCopyButton();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sdHoverCopyDisabled']) {
      if (!this.sdHoverCopyDisabled()) {
        // Enable - create and show button if not exists
        if (!this.#copyButton) {
          this.#createAndAppendCopyButton();
        }
      } else {
        // Disable - remove button from DOM
        this.#removeCopyButton();
      }
    }
  }

  #createAndAppendCopyButton(): void {
    // why: ngOnChanges có thể tạo nút trước ngOnInit; chỉ giữ một nút và một overlay owner.
    if (this.#copyButton) return;
    const parent = this.el.nativeElement;
    this.renderer.setStyle(parent, 'position', 'relative');

    // Create button
    this.#copyButton = this.renderer.createElement('button');
    this.renderer.setStyle(this.#copyButton, 'position', 'absolute');
    this.renderer.setStyle(this.#copyButton, 'top', '50%');
    this.renderer.setStyle(this.#copyButton, 'transform', 'translateY(-50%)');
    this.renderer.setStyle(this.#copyButton, 'right', '4px');
    this.renderer.setStyle(this.#copyButton, 'display', 'none');
    this.renderer.setStyle(this.#copyButton, 'z-index', '10');
    this.renderer.setStyle(this.#copyButton, 'background', 'transparent');
    this.renderer.setStyle(this.#copyButton, 'border', 'none');
    this.renderer.setStyle(this.#copyButton, 'cursor', 'pointer');
    this.renderer.setStyle(this.#copyButton, 'padding', '1px');
    this.renderer.setStyle(this.#copyButton, 'border-radius', '3px');
    this.renderer.setStyle(this.#copyButton, 'padding', '5px');
    this.renderer.setStyle(this.#copyButton, 'line-height', '1');
    this.renderer.setStyle(this.#copyButton, 'background-color', 'var(--sd-surface-muted)');

    // Add inline SVG icon
    const svg = this.renderer.createElement('svg', 'svg');
    this.renderer.addClass(svg, 'text-secondary');
    this.renderer.setAttribute(svg, 'width', '14');
    this.renderer.setAttribute(svg, 'height', '14');
    this.renderer.setAttribute(svg, 'viewBox', '0 0 24 24');
    this.renderer.setAttribute(svg, 'fill', 'none');
    this.renderer.setAttribute(svg, 'xmlns', 'http://www.w3.org/2000/svg');

    const path = this.renderer.createElement('path', 'svg');
    this.renderer.setAttribute(
      path,
      'd',
      'M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM20 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H20C21.1 23 22 22.1 22 21V7C22 5.9 21.1 5 20 5ZM20 21H8V7H20V21Z'
    );
    this.renderer.setAttribute(path, 'fill', 'currentColor');
    this.renderer.appendChild(svg, path);
    this.renderer.appendChild(this.#copyButton, svg);

    // Tooltip
    this.#tooltip = this.renderer.createElement('span');
    this.renderer.setAttribute(this.#tooltip, 'role', 'tooltip');
    this.renderer.setProperty(this.#tooltip, 'innerText', this.#defaultTooltip);
    this.renderer.setStyle(this.#tooltip, 'display', 'none');
    this.renderer.setStyle(this.#tooltip, 'background', '#333');
    this.renderer.setStyle(this.#tooltip, 'color', '#fff');
    this.renderer.setStyle(this.#tooltip, 'padding', '2px 6px');
    this.renderer.setStyle(this.#tooltip, 'borderRadius', '4px');
    this.renderer.setStyle(this.#tooltip, 'fontSize', '12px');
    this.renderer.setStyle(this.#tooltip, 'whiteSpace', 'nowrap');
    this.renderer.setStyle(this.#tooltip, 'opacity', '0');
    this.renderer.setStyle(this.#tooltip, 'transition', 'opacity 0.2s');
    this.renderer.setStyle(this.#tooltip, 'pointerEvents', 'none');
    this.renderer.setStyle(this.#tooltip, 'userSelect', 'none');

    this.renderer.appendChild(this.#copyButton, this.#tooltip);
    this.renderer.appendChild(parent, this.#copyButton);

    // Listen click
    this.#unlistenCopy = this.renderer.listen(this.#copyButton, 'click', () => {
      const copyText = this.copyText();
      if (copyText && !this.sdHoverCopyDisabled()) {
        BrowserUtilities.copyToClipboard(String(copyText));
        this.#showTooltip(this.#copiedTooltip);
        this.#clearHideTooltipTimer();
        this.#hideTooltipTimer = setTimeout(() => {
          this.#hideTooltipTimer = null;
          this.#hideTooltip();
        }, 1000);
      }
    });
  }

  #clearHideTooltipTimer(): void {
    if (this.#hideTooltipTimer === null) return;
    clearTimeout(this.#hideTooltipTimer);
    this.#hideTooltipTimer = null;
  }

  #removeCopyButton(): void {
    this.#clearHideTooltipTimer();
    this.#document.removeEventListener('scroll', this.#onScroll, true);
    this.#tooltipOverlay?.dispose();
    this.#tooltipOverlay = null;
    this.#unlistenCopy?.();
    this.#unlistenCopy = null;
    if (this.#copyButton) {
      this.renderer.removeChild(this.el.nativeElement, this.#copyButton);
      this.#copyButton = null;
    }
  }

  #showTooltip(message: string) {
    if (!this.#copyButton) return;
    if (!this.#tooltipOverlay) {
      // why: portal thoát khỏi overflow/stacking context của table cell và modal body.
      this.#tooltipOverlay = this.#overlay.create({
        positionStrategy: this.#overlay
          .position()
          .flexibleConnectedTo(this.#copyButton)
          .withPositions([
            { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -4 },
            { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 4 },
          ])
          .withFlexibleDimensions(false)
          .withViewportMargin(8)
          .withPush(true),
      });
    }
    this.renderer.setProperty(this.#tooltip, 'innerText', message);
    this.renderer.setStyle(this.#tooltip, 'display', 'block');
    this.renderer.setStyle(this.#tooltip, 'opacity', '1');
    if (!this.#tooltipOverlay.hasAttached()) {
      this.#tooltipOverlay.attach(new DomPortal(this.#tooltip));
    }
    this.renderer.setStyle(this.#tooltipOverlay.overlayElement, 'pointerEvents', 'none');
    this.#tooltipOverlay.updatePosition();
    // why: capture bắt cả scroll ở ancestor không khai cdkScrollable, tránh tooltip trôi khỏi cell.
    this.#document.addEventListener('scroll', this.#onScroll, true);
  }

  #hideTooltip() {
    this.#clearHideTooltipTimer();
    this.#document.removeEventListener('scroll', this.#onScroll, true);
    this.#tooltipOverlay?.detach();
    this.renderer.setProperty(this.#tooltip, 'innerText', this.#defaultTooltip);
    this.renderer.setStyle(this.#tooltip, 'opacity', '0');
    this.renderer.setStyle(this.#tooltip, 'display', 'none');
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    if (!this.sdHoverCopyDisabled() && this.#copyButton) {
      this.renderer.setStyle(this.#copyButton, 'display', 'block');
    }
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    if (this.#copyButton) {
      this.renderer.setStyle(this.#copyButton, 'display', 'none');
      this.#hideTooltip();
    }
  }
}
