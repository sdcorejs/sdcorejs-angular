import { CdkPortal, DomPortalOutlet, PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import {
  ApplicationRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EmbeddedViewRef,
  Injector,
  ViewContainerRef,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { SdLoadingService } from '@sdcorejs/angular/services';
import { Utilities } from '@sdcorejs/utils/fns';
import { fromEvent, merge, Observable, Subject } from 'rxjs';
import { map, takeUntil, startWith, distinctUntilChanged } from 'rxjs/operators';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

@Component({
  selector: 'sd-side-drawer',
  templateUrl: './side-drawer.component.html',
  styleUrl: './side-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [SdIcon, CommonModule, PortalModule],
})
export class SdSideDrawer {
  id = `I${Utilities.generateUuid()}`;

  portal = viewChild.required(CdkPortal);

  title = input<string>('');
  width = input<string>('480px');
  hideClose = input<boolean, boolean | ''>(false, { transform: booleanAttribute });
  disableBackdropClose = input<boolean, boolean | ''>(false, { transform: booleanAttribute });

  // Custom CSS class added to the root side-drawer container
  drawerClass = input<any>('');

  readonly autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  readonly autoId = computed(() => (this.autoIdInput() ? `components-side-drawer-${this.autoIdInput()}` : undefined));

  sdClosed = output<void>();

  #embeddedViewRef!: EmbeddedViewRef<any>;

  readonly #isOpenedSignal = signal(false);
  readonly #isLoadingSignal = signal(false);
  readonly isOpened = this.#isOpenedSignal.asReadonly();
  readonly isLoading = this.#isLoadingSignal.asReadonly();
  readonly dataOpened = computed(() => (this.#isOpenedSignal() ? 'true' : 'false'));
  readonly dataLoading = computed(() => (this.#isLoadingSignal() ? 'true' : 'false'));

  isHovered$!: Observable<boolean>;
  #destroy$ = new Subject<void>();
  #previousBodyOverflow: string | null = null;

  #viewContainerRef = inject(ViewContainerRef);
  #ar = inject(ApplicationRef);
  #injector = inject(Injector);
  #ref = inject(ChangeDetectorRef);
  #loadingService = inject(SdLoadingService);
  #destroyRef = inject(DestroyRef);

  constructor() {
    // Thay thế ngAfterViewInit, tự động chạy nội dung này khi DOM sẵn sàng để render
    afterNextRender(() => {
      // 1. Gắn portal vào body và lưu lại EmbeddedViewRef
      const outlet = new DomPortalOutlet(document.body, this.#ar, this.#injector);
      this.#embeddedViewRef = outlet.attachTemplatePortal(this.portal());

      // 2. Setup sự kiện hover ngay sau khi DOM thật đã được in ra
      this.#setupHoverSubscription();
    });

    // Thay thế ngOnDestroy bằng logic destroy trực tiếp
    this.#destroyRef.onDestroy(() => {
      this.#destroy$.next();
      this.#destroy$.complete();

      if (this.#embeddedViewRef) {
        this.#embeddedViewRef.destroy();
      }

      if (this.#isOpenedSignal()) {
        if (this.#previousBodyOverflow !== null) {
          document.body.style.overflow = this.#previousBodyOverflow;
        } else {
          document.body.style.overflow = '';
        }
      }
    });
  }

  open = () => {
    this.#ref.markForCheck();
    this.#isOpenedSignal.set(true);

    // Chặn scroll ở document body
    this.#previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  };

  close = () => {
    this.#ref.markForCheck();
    this.#isOpenedSignal.set(false);
    this.sdClosed.emit();
    this.stopLoading();

    // Khôi phục lại scroll ở document body
    if (this.#previousBodyOverflow !== null) {
      document.body.style.overflow = this.#previousBodyOverflow;
      this.#previousBodyOverflow = null;
    } else {
      document.body.style.overflow = '';
    }
  };

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
