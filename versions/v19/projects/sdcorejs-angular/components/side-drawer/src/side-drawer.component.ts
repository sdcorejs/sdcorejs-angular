import { CdkTrapFocus } from '@angular/cdk/a11y';
import { CdkPortal, DomPortalOutlet, PortalModule } from '@angular/cdk/portal';
import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ApplicationRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  EmbeddedViewRef,
  Injector,
  ViewContainerRef,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { SdLoadingService } from '@sdcorejs/angular/services';
import { Utilities } from '@sdcorejs/utils/fns';
import { fromEvent, merge, Observable, Subject } from 'rxjs';
import { map, takeUntil, startWith, distinctUntilChanged } from 'rxjs/operators';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdBodyScrollLockService } from './body-scroll-lock.service';

export type SdSideDrawerBeforeClose = () => boolean | Promise<boolean>;

/** Element a drawer opens inside — see `SdSideDrawer.container`. */
export type SdSideDrawerContainer = HTMLElement | ElementRef<HTMLElement>;

@Component({
  selector: 'sd-side-drawer',
  templateUrl: './side-drawer.component.html',
  styleUrl: './side-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CdkTrapFocus, SdIcon, CommonModule, PortalModule, SdTranslatePipe],
})
export class SdSideDrawer {
  id = `I${Utilities.generateUuid()}`;

  portal = viewChild.required(CdkPortal);

  title = input<string>('');
  width = input<string>('480px');
  hideClose = input<boolean, boolean | ''>(false, { transform: booleanAttribute });
  disableBackdropClose = input<boolean, boolean | ''>(false, { transform: booleanAttribute });
  beforeClose = input<SdSideDrawerBeforeClose | undefined>(undefined);

  /**
   * Element the drawer opens inside, for example a template reference: `[container]="area"`.
   * Panel and backdrop then cover only that element and page scroll stays unlocked; a statically
   * positioned container becomes `position: relative` while the drawer lives in it.
   * `null` (default): the drawer covers the viewport.
   */
  container = input<SdSideDrawerContainer | null | undefined>(null);

  // Custom CSS class added to the root side-drawer container
  drawerClass = input<any>('');

  readonly autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  readonly autoId = computed(() => (this.autoIdInput() ? `components-side-drawer-${this.autoIdInput()}` : undefined));

  sdClosed = output<void>();
  sdCloseError = output<unknown>();

  #embeddedViewRef!: EmbeddedViewRef<any>;

  readonly #isOpenedSignal = signal(false);
  readonly #isLoadingSignal = signal(false);
  readonly isOpened = this.#isOpenedSignal.asReadonly();
  readonly isLoading = this.#isLoadingSignal.asReadonly();
  readonly dataOpened = computed(() => (this.#isOpenedSignal() ? 'true' : 'false'));
  readonly dataLoading = computed(() => (this.#isLoadingSignal() ? 'true' : 'false'));

  readonly #containerElement = computed(() => {
    const container = this.container();
    return container instanceof ElementRef ? container.nativeElement : (container ?? null);
  });
  protected readonly contained = computed(() => this.#containerElement() !== null);

  isHovered$!: Observable<boolean>;
  #destroy$ = new Subject<void>();
  // Instance này có đang giữ 1 khoá scroll hay không — giữ cho lock/release luôn cân bằng
  // dù open()/close() bị gọi lặp.
  #holdsScrollLock = false;
  #closeRequest?: Promise<boolean>;
  // Lớp bọc do drawer tự tạo trong [container]; null khi drawer nằm ở body.
  #layer: HTMLElement | null = null;
  #placedIn: HTMLElement | null = null;
  #restoreContainerPosition: (() => void) | null = null;

  #viewContainerRef = inject(ViewContainerRef);
  #ar = inject(ApplicationRef);
  #injector = inject(Injector);
  #ref = inject(ChangeDetectorRef);
  #loadingService = inject(SdLoadingService);
  #destroyRef = inject(DestroyRef);
  #scrollLock = inject(SdBodyScrollLockService);
  #document = inject(DOCUMENT);

  constructor() {
    // Thay thế ngAfterViewInit, tự động chạy nội dung này khi DOM sẵn sàng để render
    afterNextRender(() => {
      // 1. Gắn portal vào body và lưu lại EmbeddedViewRef
      const outlet = new DomPortalOutlet(document.body, this.#viewContainerRef, this.#ar, this.#injector);
      this.#embeddedViewRef = outlet.attachTemplatePortal(this.portal());

      // 2. Có [container] thì chuyển DOM của drawer vào vùng chứa đó
      this.#place(this.#containerElement());

      // 3. Setup sự kiện hover ngay sau khi DOM thật đã được in ra
      this.#setupHoverSubscription();
    });

    // [container] đổi sau khi portal đã gắn: chuyển DOM sang vùng mới và cân lại khoá scroll body.
    effect(() => {
      const container = this.#containerElement();
      untracked(() => {
        if (this.#embeddedViewRef) this.#place(container);
        this.#syncScrollLock();
      });
    });

    // Thay thế ngOnDestroy bằng logic destroy trực tiếp
    this.#destroyRef.onDestroy(() => {
      this.#destroy$.next();
      this.#destroy$.complete();

      if (this.#embeddedViewRef) {
        this.#embeddedViewRef.destroy();
      }

      // Drawer trong [container]: gỡ lớp bọc và trả lại position ban đầu của vùng chứa.
      this.#layer?.remove();
      this.#restoreContainerPosition?.();

      // Destroy khi đang mở cũng phải nhả khoá, nếu không ref-count kẹt > 0 và trang khoá scroll mãi.
      this.#releaseScrollLock();
    });
  }

  open = () => {
    this.#ref.markForCheck();
    this.#isOpenedSignal.set(true);

    // Chặn scroll ở document body qua khoá ref-count dùng chung (stack-safe với drawer lồng nhau).
    // Drawer mở trong [container] không khoá: phần còn lại của trang vẫn dùng được.
    this.#syncScrollLock();
  };

  close = () => {
    if (this.beforeClose()) {
      void this.requestClose();
      return;
    }
    this.forceClose();
  };

  requestClose = (): Promise<boolean> => {
    const guard = this.beforeClose();
    if (!guard) {
      this.forceClose();
      return Promise.resolve(true);
    }
    if (this.#closeRequest) return this.#closeRequest;

    const request = Promise.resolve()
      .then(() => guard())
      .then(canClose => {
        if (!canClose) return false;
        this.forceClose();
        return true;
      })
      .catch((error: unknown) => {
        this.sdCloseError.emit(error);
        return false;
      });

    this.#closeRequest = request;
    void request.finally(() => {
      if (this.#closeRequest === request) this.#closeRequest = undefined;
    });
    return request;
  };

  forceClose = () => {
    this.#ref.markForCheck();
    this.#isOpenedSignal.set(false);
    this.sdClosed.emit();
    this.stopLoading();

    // Khôi phục lại scroll ở document body (chỉ thật sự khôi phục khi drawer cuối cùng nhả khoá)
    this.#releaseScrollLock();
  };

  #syncScrollLock(): void {
    if (this.#isOpenedSignal() && !this.contained()) this.#acquireScrollLock();
    else this.#releaseScrollLock();
  }

  #acquireScrollLock(): void {
    if (this.#holdsScrollLock) return;
    this.#holdsScrollLock = true;
    this.#scrollLock.lock();
  }

  #releaseScrollLock(): void {
    if (!this.#holdsScrollLock) return;
    this.#holdsScrollLock = false;
    this.#scrollLock.release();
  }

  /** Chuyển DOM của drawer vào `container`, hoặc về lại `<body>` khi `null`. */
  #place(container: HTMLElement | null): void {
    if (container === this.#placedIn) return;
    const nodes = this.#embeddedViewRef.rootNodes as Node[];
    this.#restoreContainerPosition?.();
    this.#restoreContainerPosition = null;
    this.#placedIn = container;
    if (!container) {
      for (const node of nodes) this.#document.body.appendChild(node);
      this.#layer?.remove();
      this.#layer = null;
      return;
    }
    this.#layer ??= this.#createLayer();
    container.appendChild(this.#layer);
    for (const node of nodes) this.#layer.appendChild(node);
    this.#restoreContainerPosition = this.#ensurePositioned(container);
  }

  #createLayer(): HTMLElement {
    const layer = this.#document.createElement('div');
    layer.className = 'sd-side-drawer-layer';
    // why: lớp bọc do code tạo, nằm ngoài view nên SCSS encapsulated không áp vào được — style inline.
    // Phủ đúng vùng chứa và cắt phần panel đang trượt (không đẩy thanh cuộn ngang ra trang).
    // `overflow: clip` chứ không phải `hidden`: CDK focus nút đóng ngay khi mở, lúc panel còn nằm ngoài
    // lớp bọc; `hidden` vẫn cho cuộn bằng code nên trình duyệt cuộn lớp bọc để lộ nút — backdrop trượt
    // từ trái sang và panel giật thay vì trượt vào từ phải. `hidden` đứng trước chỉ là fallback.
    // pointer-events: none để khi drawer đóng, nội dung bên dưới vẫn bấm được. `container` cho phép
    // SCSS co giãn theo bề rộng vùng chứa (@container sd-side-drawer) thay vì theo viewport.
    layer.style.cssText =
      'position: absolute; inset: 0; overflow: hidden; overflow: clip; pointer-events: none;' +
      ' z-index: var(--sd-side-drawer-contained-z-index, 100); container: sd-side-drawer / inline-size;';
    return layer;
  }

  /** Vùng chứa `static` được đặt `relative` để làm khung định vị cho lớp bọc; trả về hàm hoàn tác. */
  #ensurePositioned(container: HTMLElement): (() => void) | null {
    const view = this.#document.defaultView;
    if (!view || view.getComputedStyle(container).position !== 'static') return null;
    const previous = container.style.position;
    container.style.position = 'relative';
    return () => {
      container.style.position = previous;
    };
  }

  startLoading = () => {
    this.#isLoadingSignal.set(true);
    this.#loadingService.stop(`#${this.id}`);
    this.#loadingService.start(`#${this.id}`);
  };

  stopLoading = () => {
    this.#isLoadingSignal.set(false);
    this.#loadingService.stop(`#${this.id}`);
  };

  preventScroll = (event: Event) => {
    event.preventDefault();
  };

  #setupHoverSubscription(): void {
    if (!this.#embeddedViewRef) return;

    // 3. Lấy DOM element trực tiếp từ rootNodes của EmbeddedViewRef
    const rootNodes = this.#embeddedViewRef.rootNodes;
    const element = rootNodes.find(
      node => node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).classList?.contains('sd-side-drawer')
    );

    if (!element) {
      console.warn('SdSideDrawer: Cannot find sd-side-drawer element to attach hover event');
      return;
    }

    // 4. Gắn event listeners trực tiếp lên element thật
    const mouseEnter$ = fromEvent(element, 'mouseenter').pipe(map(() => true));
    const mouseLeave$ = fromEvent(element, 'mouseleave').pipe(map(() => false));

    this.isHovered$ = merge(mouseEnter$, mouseLeave$).pipe(startWith(false), distinctUntilChanged(), takeUntil(this.#destroy$));
  }
}
