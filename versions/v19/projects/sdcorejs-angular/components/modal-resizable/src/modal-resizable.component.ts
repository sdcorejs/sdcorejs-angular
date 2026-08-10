import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EmbeddedViewRef,
  afterNextRender,
  booleanAttribute,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Utilities } from '@sdcorejs/utils/fns';
import { CdkPortal, DomPortalOutlet, PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { SdLoadingService } from '@sdcorejs/angular/services';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdModalResizableRegistry } from './modal-resizable.registry';

@Component({
  selector: 'sd-modal-resizable',
  templateUrl: './modal-resizable.component.html',
  styleUrl: './modal-resizable.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [SdIcon, CommonModule, MatDialogModule, MatButtonModule, PortalModule],
})
export class SdModalResizable {
  readonly id = `I${Utilities.generateUuid()}`;
  readonly portal = viewChild.required(CdkPortal);
  readonly editable = input<boolean, boolean | ''>(false, { transform: booleanAttribute });
  readonly width = input<string>('480px');
  readonly editingChanged = output<boolean>();
  #embeddedViewRef!: EmbeddedViewRef<any>;
  readonly #ref = inject(ChangeDetectorRef);
  readonly #loadingService = inject(SdLoadingService);
  readonly #destroyRef = inject(DestroyRef);
  readonly #registry = inject(SdModalResizableRegistry);
  // why: open/close/#arrangePanels đều hẹn setTimeout thao tác DOM. Gom id vào một set để
  // onDestroy clear sạch, tránh callback chạy trên portal đã tháo (element không còn, hoặc tệ
  // hơn: element của instance khác vừa tái sử dụng id).
  readonly #timers = new Set<ReturnType<typeof setTimeout>>();
  readonly isEditing = signal(false);
  readonly isOpened = signal(false);
  readonly isHover = signal(false);
  readonly isLoading = signal(false);
  readonly isMinimum = signal(false);
  readonly isMaximum = signal(false);

  constructor() {
    this.#registry.register(this.id);

    afterNextRender(() => {
      // why: attachTemplatePortal tạo embedded view từ VCR của chính CdkPortal →
      // KHÔNG cần appRef/injector/document. Chỉ truyền outletElement để tương thích
      // mọi CDK (19 còn slot ComponentFactoryResolver, 20/21 đã bỏ → tránh lệch arg).
      const outlet = new DomPortalOutlet(document.body);
      this.#embeddedViewRef = outlet.attachTemplatePortal(this.portal());
      this.#detectChanges();
    });

    this.#destroyRef.onDestroy(() => {
      this.#registry.unregister(this.id);
      for (const timer of this.#timers) clearTimeout(timer);
      this.#timers.clear();
      this.#embeddedViewRef?.destroy();
    });
  }

  /** setTimeout có theo dõi — huỷ được hàng loạt trong onDestroy. */
  #schedule(callback: () => void, delay: number): void {
    const timer = setTimeout(() => {
      this.#timers.delete(timer);
      callback();
    }, delay);
    this.#timers.add(timer);
  }

  open = () => {
    this.isOpened.set(true);
    this.#detectChanges();

    const element = this.#getElement();
    if (element && !element.classList.contains('c-minium')) {
      this.#schedule(() => {
        const maximumWidth = element.offsetWidth;
        if (maximumWidth > 0) {
          element.dataset['width'] = maximumWidth.toString();
        }
        element.classList.remove('c-closed');
      }, 100);
    }

    this.maximize();
  };

  close = () => {
    this.isOpened.set(false);
    this.#detectChanges();
    this.#schedule(() => {
      const element = this.#getElement();
      element?.style.setProperty('width', '0px');
      element?.style.setProperty('right', '0px');
      element?.classList.remove('c-minium');
      element?.classList.add('c-closed');
    }, 100);
    this.stopLoading();

    this.#arrangePanels();
  };

  minimize = () => {
    this.isMinimum.set(true);
    this.#detectChanges();
    this.#arrangePanels();
  };

  maximize = () => {
    this.isMinimum.set(false);
    this.#detectChanges();
    this.#arrangePanels();
  };

  toggleMaximum = () => {
    this.isMaximum.update(isMaximum => !isMaximum);
    this.#detectChanges();
    this.#arrangePanels();
  };

  startLoading = () => {
    this.isLoading.set(true);
    this.#detectChanges();
    this.#loadingService.stop(`#${this.id}`);
    this.#loadingService.start(`#${this.id}`);
  };

  stopLoading = () => {
    this.isLoading.set(false);
    this.#detectChanges();
    this.#loadingService.stop(`#${this.id}`);
  };

  toggleEditable() {
    this.isEditing.update(isEditing => !isEditing);
    this.#detectChanges();
    this.editingChanged.emit(this.isEditing());
  }

  onFocus = () => {
    this.isHover.set(true);
  };

  onBlur = () => {
    this.isHover.set(false);
  };

  #arrangePanels = () => {
    this.#schedule(() => {
      let totalRight = 0;
      const minimumWidth = 300;
      // why: chỉ xếp chỗ các panel do <sd-modal-resizable> đang sống sở hữu (registry), KHÔNG
      // querySelectorAll('.modal-resizable') toàn document — query đó ghi đè inline width/right
      // lên mọi phần tử trùng class, kể cả markup của component khác không liên quan.
      this.#registry.panels().forEach(item => {
        if (item.classList.contains('c-minium')) {
          item.style.setProperty('width', `${minimumWidth}px`);
          item.style.setProperty('right', `${totalRight}px`);
          totalRight += minimumWidth + 8;
          return;
        }

        if (item.classList.contains('c-closed')) {
          return;
        }

        const expandedWidth = Number.parseInt(item.dataset['width'] || '', 10);
        if (Number.isNaN(expandedWidth)) {
          return;
        }

        if (item.classList.contains('c-fullscreen')) {
          item.style.setProperty('width', 'calc(100% - 16px)');
          item.style.setProperty('right', '8px');
        } else {
          item.style.setProperty('width', `${expandedWidth}px`);
          item.style.setProperty('right', `${totalRight}px`);
        }
        totalRight += expandedWidth + 8;
      });
    }, 200);
  };

  #getElement() {
    return document.getElementById(this.id);
  }

  #detectChanges() {
    this.#ref.markForCheck();
    this.#embeddedViewRef?.detectChanges();
  }
}
