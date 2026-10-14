import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EmbeddedViewRef,
  ElementRef,
  OnDestroy,
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT, NgClass } from '@angular/common';
import { CdkPortal, DomPortalOutlet, PortalModule } from '@angular/cdk/portal';
import { Utilities } from '@sdcorejs/utils/fns';
import { SdLoadingService, type SdLoadingRef } from '@sdcorejs/angular/services/loading';
import { SdButton } from '@sdcorejs/angular/components/button';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdWindowRegistry } from './window.registry';

export type SdWindowBeforeClose = () => boolean | Promise<boolean>;

/**
 * Nonmodal record window. The deprecated selector/import share this exact component identity.
 * Use SdModal for blocking dialogs; this window intentionally leaves the page reachable.
 * Minimize/restore/fullscreen are supported; dragging and pointer resizing are not.
 * See ../sd-window.md for the public contract and compatible alias migration.
 */
@Component({
  selector: 'sd-window, sd-modal-resizable',
  templateUrl: './window.component.html',
  styleUrl: './window.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [SdButton, PortalModule, NgClass],
})
export class SdWindow implements OnDestroy {
  readonly id = `I${Utilities.generateUuid()}`;
  readonly titleId = `${this.id}-title`;
  readonly portal = viewChild.required(CdkPortal);
  readonly editable = input<boolean, boolean | ''>(false, { transform: booleanAttribute });
  readonly width = input<string, string | null | undefined>('480px', { transform: value => value ?? '480px' });
  /** Fallback for the existing projected [sdTitle] slot. */
  readonly title = input<string, string | null | undefined>('', { transform: value => value ?? '' });
  readonly hideClose = input<boolean, boolean | ''>(false, { transform: booleanAttribute });
  readonly beforeClose = input<SdWindowBeforeClose | undefined>(undefined);
  readonly windowClass = input<string | string[] | Record<string, boolean>, string | string[] | Record<string, boolean> | null | undefined>(
    '',
    {
      transform: value => value ?? '',
    }
  );
  readonly ariaDescribedBy = input<string | undefined>(undefined);
  /** Escape dismissal is opt-in to preserve the existing close contract. */
  readonly disableEscapeClose = input<boolean, boolean | ''>(true, { transform: booleanAttribute });
  readonly autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  readonly autoId = computed(() =>
    this.autoIdInput() ? `components-${this.#legacyHost ? 'modal-resizable' : 'window'}-${this.autoIdInput()}` : undefined
  );
  readonly sdClosed = output<void>();
  readonly sdCloseError = output<unknown>();
  readonly editingChanged = output<boolean>();
  // why: giữ nguyên signal public của API cũ; không đổi thành readonly trong bản sửa tương thích.
  readonly isEditing = signal(false);
  readonly isOpened = signal(false);
  readonly isHover = signal(false);
  readonly isLoading = signal(false);
  /** @deprecated Read isMinimized; use minimize()/restore() for lifecycle changes. */
  readonly isMinimum = signal(false);
  /** @deprecated Read isFullscreen; use toggleFullscreen() for lifecycle changes. */
  readonly isMaximum = signal(false);
  readonly isMinimized = this.isMinimum.asReadonly();
  readonly isFullscreen = this.isMaximum.asReadonly();
  readonly dataOpened = computed(() => (this.isOpened() ? 'true' : 'false'));
  readonly dataLoading = computed(() => (this.isLoading() ? 'true' : 'false'));
  protected readonly minimizedAtTop = signal(false);

  readonly #legacyHost = inject(ElementRef<HTMLElement>).nativeElement?.tagName?.toLowerCase() === 'sd-modal-resizable';

  readonly #document = inject(DOCUMENT);
  readonly #ref = inject(ChangeDetectorRef);
  readonly #loadingService = inject(SdLoadingService);
  readonly #destroyRef = inject(DestroyRef);
  readonly #registry = inject(SdWindowRegistry);
  readonly #i18n = inject(I18nService);
  protected readonly labels = computed(() => {
    const prefix = this.#legacyHost ? 'core.component.modal-resizable' : 'core.component.window';
    return {
      title: this.#i18n.t(`${prefix}.title`),
      minimize: this.#i18n.t(`${prefix}.minimize`),
      restore: this.#i18n.t(`${prefix}.restore`),
      fullscreen: this.#i18n.t(`${prefix}.fullscreen`),
      exitFullscreen: this.#i18n.t(`${prefix}.exit-fullscreen`),
      loading: this.#i18n.t(`${prefix}.loading`),
      close: this.#i18n.t('core.common.close'),
    };
  });
  #embeddedViewRef?: EmbeddedViewRef<unknown>;
  #opener: HTMLElement | null = null;
  #destroyed = false;
  #removeResizeListener?: () => void;
  #removeFocusListener?: () => void;
  #loadingRef?: SdLoadingRef;
  #closeGeneration = 0;
  #closeRequest?: Promise<boolean>;

  constructor() {
    this.#registry.register(this.id);
    afterNextRender(() => {
      // why: chữ ký CDK chung cho 19–22; không truyền tham số đã đổi giữa các major.
      const outlet = new DomPortalOutlet(this.#document.body);
      this.#embeddedViewRef = outlet.attachTemplatePortal(this.portal());
      this.#detectChanges();
      this.#refreshLayout();
      if (this.isOpened()) this.#focusPanel();
      const window = this.#document.defaultView;
      window?.addEventListener('resize', this.#refreshLayout);
      this.#removeResizeListener = () => window?.removeEventListener('resize', this.#refreshLayout);
      this.#document.addEventListener('focusin', this.#revealPageFocus);
      this.#removeFocusListener = () => this.#document.removeEventListener('focusin', this.#revealPageFocus);
    });
    afterRenderEffect(() => {
      this.width();
      this.isOpened();
      this.isMinimum();
      this.isMaximum();
      if (this.#embeddedViewRef) this.#refreshLayout();
    });
    this.#destroyRef.onDestroy(() => {
      // why: ngOnDestroy đã đóng và emit trước output() cleanup; callback này chỉ gỡ tài nguyên.
      this.#removeResizeListener?.();
      this.#removeFocusListener?.();
      // why: service root giữ host/contribution; stop trước khi gỡ portal để không giữ DOM đã detach.
      this.#releaseLoading();
      this.#registry.unregister(this.id);
      this.#embeddedViewRef?.destroy();
    });
  }

  open = () => {
    if (this.#destroyed) return;
    if (this.isOpened()) {
      this.#registry.activate(this.id);
      if (!this.#getElement()?.contains(this.#document.activeElement)) this.#focusPanel();
      return;
    }
    this.#closeGeneration++;
    this.#closeRequest = undefined;
    this.#opener = this.#document.activeElement as HTMLElement | null;
    this.isOpened.set(true);
    this.isMinimum.set(false);
    this.minimizedAtTop.set(false);
    this.#detectChanges();
    this.#refreshLayout();
    this.#registry.activate(this.id);
    this.#getElement()?.focus({ preventScroll: true });
  };

  /** Core overlay contract: close synchronously unless an optional beforeClose guard owns dismissal. */
  close = (): void => {
    if (this.#destroyed) return;
    if (this.beforeClose()) {
      void this.requestClose();
      return;
    }
    this.forceClose();
  };

  /** Resolves the guard decision; it carries no business result payload. */
  requestClose = (): Promise<boolean> => {
    if (this.#destroyed || !this.isOpened()) return Promise.resolve(false);
    if (this.#closeRequest) return this.#closeRequest;
    const guard = this.beforeClose();
    if (!guard) {
      this.forceClose();
      return Promise.resolve(true);
    }
    const generation = this.#closeGeneration;
    const current = () => !this.#destroyed && this.isOpened() && generation === this.#closeGeneration;
    const request = Promise.resolve()
      .then(() => (current() ? guard() : false))
      .then(canClose => {
        if (canClose !== true || !current()) return false;
        this.forceClose();
        return true;
      })
      .catch((error: unknown) => {
        if (current()) this.sdCloseError.emit(error);
        return false;
      });
    this.#closeRequest = request;
    void request.then(() => {
      if (this.#closeRequest === request) this.#closeRequest = undefined;
    });
    return request;
  };

  forceClose = (): void => {
    if (this.#destroyed) return;
    this.#closeGeneration++;
    this.#closeRequest = undefined;
    this.#finishClose();
  };

  ngOnDestroy(): void {
    if (this.#destroyed) return;
    // why: output() listeners được gỡ trước DestroyRef callbacks; teardown phải báo đóng tại hook này.
    this.#destroyed = true;
    this.#closeGeneration++;
    this.#closeRequest = undefined;
    this.#finishClose();
  }

  #finishClose(): void {
    const wasOpened = this.isOpened();
    this.#restoreFocusIfOwned();
    this.#releaseLoading();
    this.isLoading.set(false);
    this.isOpened.set(false);
    this.isMinimum.set(false);
    this.isMaximum.set(false);
    this.minimizedAtTop.set(false);
    this.#detectChanges();
    const element = this.#getElement();
    element?.classList.remove('c-minium', 'c-fullscreen');
    element?.style.setProperty('width', '0px');
    element?.style.setProperty('right', '0px');
    this.#registry.arrange();
    // why: cleanup hoàn tất trước callback, để consumer mở lại trong sdClosed không bị teardown lần nữa.
    if (wasOpened) this.sdClosed.emit();
  }

  minimize = () => {
    if (this.#destroyed) return;
    this.#moveFocusOutOfContent();
    this.isMinimum.set(true);
    this.minimizedAtTop.set(false);
    this.#detectChanges();
    this.#registry.arrange();
    this.#revealPageFocus({ target: this.#document.activeElement });
  };

  restore = () => {
    if (this.#destroyed) return;
    this.isMinimum.set(false);
    this.minimizedAtTop.set(false);
    this.#detectChanges();
    this.#refreshLayout();
    this.#selectOpenWindow();
  };

  /** @deprecated Use restore(). */
  maximize = this.restore;

  toggleFullscreen = () => {
    if (this.#destroyed) return;
    this.isMinimum.set(false);
    this.minimizedAtTop.set(false);
    this.isMaximum.update(value => !value);
    this.#detectChanges();
    this.#refreshLayout();
    this.#selectOpenWindow();
  };

  /** @deprecated Use toggleFullscreen(). */
  toggleMaximum = this.toggleFullscreen;

  startLoading = () => {
    if (this.#destroyed) return;
    this.#releaseLoading();
    this.#moveFocusOutOfContent();
    this.isLoading.set(true);
    this.#detectChanges();
    this.#ensureLoading();
  };

  stopLoading = () => {
    if (this.#destroyed) return;
    this.#releaseLoading();
    this.isLoading.set(false);
    this.#detectChanges();
  };

  toggleEditable() {
    if (this.#destroyed) return;
    this.isEditing.update(value => !value);
    this.#detectChanges();
    this.editingChanged.emit(this.isEditing());
  }

  onFocus = () => {
    this.isHover.set(true);
  };

  protected activate(event?: PointerEvent): void {
    this.#registry.activate(this.id);
    if (event && !this.#getElement()?.contains(this.#document.activeElement)) this.#focusPanel();
  }

  onBlur = (event?: FocusEvent) => {
    const panel = this.#getElement();
    if (event?.relatedTarget && panel?.contains(event.relatedTarget as Node)) return;
    if (!event && panel?.contains(this.#document.activeElement)) return;
    this.isHover.set(false);
  };

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing || this.disableEscapeClose() || !this.isOpened()) return;
    // why: overlay CDK ở ngoài cây DOM; combobox inline phải xử lý Escape trước cửa sổ.
    if ((event.target as HTMLElement).closest?.('[role="combobox"][aria-expanded="true"]')) return;
    event.preventDefault();
    event.stopPropagation();
    this.close();
  }

  readonly #revealPageFocus = (event: Pick<FocusEvent, 'target'>) => {
    const panel = this.#getElement();
    const target = event.target as HTMLElement | null;
    if (!this.isOpened() || !panel || panel.contains(target) || !target?.getBoundingClientRect) return;
    const rect = target.getBoundingClientRect();
    const panels = this.#registry.panels();
    if (panels.some(owned => owned.contains(target))) return;
    const x = rect.x + rect.width / 2;
    const y = rect.y + rect.height / 2;
    const hit = this.#document.elementFromPoint(x, y);
    const ownRect = panel.getBoundingClientRect();
    // why: Tab về trang không được để focus ẩn sau cửa sổ; overlay con có hit target riêng nên không bị thu nhỏ.
    // why: xét mọi cửa sổ phủ cùng điểm để thứ tự listener không bỏ lại một cửa sổ phía sau.
    if (
      rect.width > 0 &&
      rect.height > 0 &&
      x >= ownRect.left &&
      x <= ownRect.right &&
      y >= ownRect.top &&
      y <= ownRect.bottom &&
      panels.some(owned => owned.contains(hit))
    ) {
      if (!this.isMinimum()) this.minimize();
      const strip = panel.getBoundingClientRect();
      const layoutHeight = this.#document.documentElement.clientHeight;
      const windowHeight = this.#document.defaultView?.innerHeight ?? layoutHeight;
      const viewportHeight = layoutHeight > 0 ? Math.min(layoutHeight, windowHeight) : windowHeight;
      const alternateTop = this.minimizedAtTop() ? viewportHeight - strip.height : 8;
      // why: thanh thu nhỏ cũng không được che focus ở cuối trang; chỉ đổi mép khi mép kia thật sự thoáng.
      if (
        x >= strip.left &&
        x <= strip.right &&
        y >= strip.top &&
        y <= strip.bottom &&
        (y < alternateTop || y > alternateTop + strip.height)
      ) {
        this.minimizedAtTop.update(value => !value);
        this.#detectChanges();
      }
    }
  };

  readonly #refreshLayout = (event?: Event) => {
    if (this.#destroyed) return;
    const element = this.#getElement();
    if (element && this.isOpened() && !this.isMinimum() && !this.isMaximum()) {
      // why: đo CSS width hiện tại, không dùng snapshot lần trước hoặc kích thước fullscreen.
      element.style.width = this.width();
      if (element.offsetWidth > 0) element.dataset['width'] = String(element.offsetWidth);
    }
    this.#registry.arrange();
    this.#ensureLoading();
    if (event?.type === 'resize') this.#revealPageFocus({ target: this.#document.activeElement });
  };

  #ensureLoading(): void {
    if (!this.isLoading() || (this.#loadingRef && !this.#loadingRef.closed) || !this.#getElement()?.querySelector('.modal-resizable__body'))
      return;
    // why: giữ ref riêng và chỉ phủ body; không dừng contribution của consumer cùng selector.
    this.#loadingRef = this.#loadingService.start(`#${this.id} .modal-resizable__body`);
  }

  #releaseLoading(): void {
    this.#loadingRef?.close();
    this.#loadingRef = undefined;
  }

  #focusPanel(): void {
    this.#getElement()?.focus({ preventScroll: true });
  }

  #selectOpenWindow(): void {
    if (!this.isOpened()) return;
    this.#registry.activate(this.id);
    // why: explicit size actions from page controls select the window instead of covering the same page focus.
    if (!this.#getElement()?.contains(this.#document.activeElement)) this.#focusPanel();
  }

  #moveFocusOutOfContent(): void {
    const element = this.#getElement();
    const active = this.#document.activeElement;
    if (
      active &&
      (element?.querySelector('.modal-resizable__body')?.contains(active) ||
        element?.querySelector('.modal-resizable__footer')?.contains(active))
    ) {
      // why: projected header actions may be disabled/hidden; choose an owned control before making content inert.
      element?.querySelector<HTMLButtonElement>('[data-sd-window-action="restore"] button')?.focus({ preventScroll: true });
      if (this.#document.activeElement === active) element?.focus({ preventScroll: true });
    }
  }

  #restoreFocusIfOwned(): void {
    // why: không giành focus nếu người dùng đã quay lại trang hoặc cửa sổ khác.
    if (this.#getElement()?.contains(this.#document.activeElement) && this.#opener?.isConnected && !this.#opener.closest('[inert]')) {
      this.#opener.focus({ preventScroll: true });
    }
  }

  #getElement(): HTMLElement | null {
    return this.#document.getElementById(this.id);
  }

  #detectChanges(): void {
    this.#ref.markForCheck();
    this.#embeddedViewRef?.detectChanges();
  }
}
