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
  viewChild
} from '@angular/core';
import { SdBaseSecureComponent } from '@sdcorejs/angular/components/base';
import { SdLoadingService } from '@sdcorejs/angular/services';
import * as uuid from 'uuid';
import { fromEvent, merge, Observable, Subject } from 'rxjs';
import { map, takeUntil, startWith, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'sd-side-drawer',
  templateUrl: './side-drawer.component.html',
  styleUrls: ['./side-drawer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, PortalModule],
})
export class SdSideDrawer extends SdBaseSecureComponent {
  id = `I${uuid.v4()}`;
  
  portal = viewChild.required(CdkPortal);
  
  title = input<string>('');
  width = input<string>('480px');
  hideClose = input<boolean, boolean | ''>(false, { transform: booleanAttribute });
  disableBackdropClose = input<boolean, boolean | ''>(false, { transform: booleanAttribute });

  // Custom CSS class added to the root side-drawer container
  drawerClass = input<any>('');

  readonly autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  readonly autoId = computed(() =>
    this.autoIdInput() ? `components-side-drawer-${this.autoIdInput()}` : undefined
  );

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
    super();

    // Thay tháº¿ ngAfterViewInit, tá»± Ä‘á»™ng cháº¡y ná»™i dung nÃ y khi DOM sáºµn sÃ ng Ä‘á»ƒ render
    afterNextRender(() => {
      // 1. Gáº¯n portal vÃ o body vÃ  lÆ°u láº¡i EmbeddedViewRef
      const outlet = new DomPortalOutlet(document.body, this.#viewContainerRef, this.#ar, this.#injector);
      this.#embeddedViewRef = outlet.attachTemplatePortal(this.portal());
      
      // 2. Setup sá»± kiá»‡n hover ngay sau khi DOM tháº­t Ä‘Ã£ Ä‘Æ°á»£c in ra
      this.#setupHoverSubscription();
    });

    // Thay tháº¿ ngOnDestroy báº±ng logic destroy trá»±c tiáº¿p 
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

    // Cháº·n scroll á»Ÿ document body
    this.#previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  };

  close = () => {
    this.#ref.markForCheck();
    this.#isOpenedSignal.set(false);
    this.sdClosed.emit();
    this.stopLoading();
    
    // KhÃ´i phá»¥c láº¡i scroll á»Ÿ document body
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

    // 3. Láº¥y DOM element trá»±c tiáº¿p tá»« rootNodes cá»§a EmbeddedViewRef
    const rootNodes = this.#embeddedViewRef.rootNodes;
    const element = rootNodes.find(
      (node) => node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).classList?.contains('sd-side-drawer')
    );

    if (!element) {
      console.warn('SdSideDrawer: Cannot find sd-side-drawer element to attach hover event');
      return;
    }

    // 4. Gáº¯n event listeners trá»±c tiáº¿p lÃªn element tháº­t
    const mouseEnter$ = fromEvent(element, 'mouseenter').pipe(map(() => true));
    const mouseLeave$ = fromEvent(element, 'mouseleave').pipe(map(() => false));

    this.isHovered$ = merge(mouseEnter$, mouseLeave$).pipe(
      startWith(false),
      distinctUntilChanged(),
      takeUntil(this.#destroy$)
    );
  }
}
