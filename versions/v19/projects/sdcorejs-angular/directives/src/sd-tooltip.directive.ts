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
import { Overlay, OverlayRef, ConnectionPositionPair } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { NgTemplateOutlet } from '@angular/common';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

// Component dùng để instance cho overlay
@Component({
  selector: 'sd-tooltip-container',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    <div class="c-sd-tooltip-container" [style.background-color]="color()">
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
          0 2px 4px -1px #0003,
          0 4px 5px #00000024,
          0 1px 10px #0000001f;
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
  color = input<string>('#616161');

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

// Directive
@Directive({
  selector: '[sdTooltip]',
  standalone: true,
})
export class SdTooltipDirective {
  content = input.required<string | TemplateRef<any>>({ alias: 'sdTooltip' });
  sdTooltipPosition = input<TooltipPosition>('bottom');
  sdTooltipDelay = input<number>(100);
  sdTooltipColor = input<string>('#616161');

  private static activeTooltip: SdTooltipDirective | null = null;

  private readonly elementRef = inject(ElementRef);
  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);

  private overlayRef: OverlayRef | null = null;
  private tooltipComponentRef: ComponentRef<SdTooltipComponent> | null = null;
  private tooltipInstance: SdTooltipComponent | null = null;

  private showTimeout: ReturnType<typeof setTimeout> | undefined;
  private hideTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.#cleanup();
    });
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    if (SdTooltipDirective.activeTooltip && SdTooltipDirective.activeTooltip !== this) {
      SdTooltipDirective.activeTooltip.forceHide();
    }
    SdTooltipDirective.activeTooltip = this;

    this.#clearTimeouts();
    this.showTimeout = setTimeout(() => {
      this.#show();
    }, this.sdTooltipDelay());
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.#clearTimeouts();
    this.hideTimeout = setTimeout(() => {
      this.#hide();
    }, 300);
  }

  forceHide = (): void => {
    this.#clearTimeouts();
    this.#hide();
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
    }

    if (this.tooltipComponentRef && this.tooltipInstance) {
      this.tooltipComponentRef.setInput('content', currentContent);
      this.tooltipComponentRef.setInput('color', this.sdTooltipColor());
      this.tooltipInstance.triggerChangeDetection();
    }
  };

  #hide = (): void => {
    if (this.tooltipInstance && this.overlayRef?.hasAttached()) {
      this.overlayRef.detach();
      this.tooltipInstance = null;
      this.tooltipComponentRef = null;
    }
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
