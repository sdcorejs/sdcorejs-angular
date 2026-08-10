import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  TemplateRef,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatBottomSheet, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { BrowserUtilities } from '@sdcorejs/utils/fns';
import { Color, Size } from '@sdcorejs/utils/models';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { Observable } from 'rxjs';

export type SdModalBeforeClose = () => boolean | Promise<boolean>;

interface SdModalDismissRef {
  backdropClick?: () => Observable<MouseEvent>;
  keydownEvents?: () => Observable<KeyboardEvent>;
}

@Component({
  selector: 'sd-modal',
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [SdIcon, CommonModule, MatBottomSheetModule, MatDialogModule, MatDividerModule, MatButtonModule],
})
export class SdModal implements OnDestroy {
  static index = signal(0);

  templateRef = viewChild.required<TemplateRef<any>>('templateRef');
  modal = viewChild<ElementRef>('modal');

  // autoId prefix `modal-`. Lưu ý: footer/body buttons render qua <ng-content> nên consumer phải
  // tự đặt [attr.data-autoId] cho các nút đó. Component chỉ tự bind autoId cho NÚT ĐÓNG (X icon).
  readonly autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  readonly autoId = computed(() => (this.autoIdInput() ? `components-modal-${this.autoIdInput()}` : undefined));
  readonly closeButtonAutoId = computed(() => (this.autoId() ? `${this.autoId()}-close` : undefined));
  readonly dataOpened = computed(() => (this.isOpened() ? 'true' : 'false'));

  title = input<string, string | null | undefined>('', { transform: v => v ?? '' });
  color = input<Color, Color | null | undefined>('primary', { transform: v => v ?? 'primary' });
  width = input<Size | string, Size | string | null | undefined>('md', { transform: v => v ?? 'md' });
  height = input<string, string | null | undefined>('auto', { transform: v => v ?? 'auto' });
  view = input<'dialog' | 'bottom-sheet' | undefined, 'dialog' | 'bottom-sheet' | null | undefined>(undefined, {
    transform: v => v ?? undefined,
  });
  modalClass = input<string | string[] | Record<string, boolean>, string | string[] | Record<string, boolean> | null | undefined>('', {
    transform: v => v ?? '',
  });
  lazyLoadContent = input(true, { transform: booleanAttribute });
  hideClose = input<boolean, boolean | ''>(false, { transform: booleanAttribute });
  disableBackdropClose = input<boolean, boolean | ''>(true, { transform: booleanAttribute }); // default to true to keep backward compatibility
  beforeClose = input<SdModalBeforeClose | undefined>(undefined);

  sdClosed = output<void>();
  sdCloseError = output<unknown>();

  isOpened = signal(false);
  alreadyOpened = signal(false);

  #isMobile = false;
  #resolvedWidth = 'md';
  #bottomSheetRef!: MatBottomSheetRef<any>;
  #dialogRef!: MatDialogRef<any>;
  #closeRequest?: Promise<boolean>;

  #dialog = inject(MatDialog);
  #bottomSheet = inject(MatBottomSheet);
  #destroyRef = inject(DestroyRef);

  constructor() {
    this.#isMobile = BrowserUtilities.isMobile();
  }

  // why: PHẢI là ngOnDestroy, KHÔNG phải #destroyRef.onDestroy. Angular chạy executeOnDestroys
  // (ngOnDestroy) TRƯỚC processCleanups (mọi callback DestroyRef.onDestroy). `sdClosed = output()`
  // tự đăng ký một DestroyRef.onDestroy trong constructor của OutputEmitterRef ngay lúc khởi tạo
  // field — tức TRƯỚC hook nào đăng ký trong constructor của component. Đăng ký ở constructor thì
  // tới lượt mình chạy, emitter đã `destroyed = true` và `emit()` chỉ log cảnh báo rồi thoát.
  ngOnDestroy(): void {
    // why: overlay của MatDialog/MatBottomSheet sống trong CDK overlay container ở <body>,
    // KHÔNG nằm trong view của <sd-modal>. Host bị destroy (điều hướng route, @if tắt nhánh…)
    // mà không close ref thì overlay + backdrop ở lại mồ côi, che và chặn click cả trang.
    // Dùng forceClose (không qua beforeClose) vì đã destroy thì không thể huỷ việc đóng.
    //
    // Emit TRƯỚC khi forceClose: afterClosed()/afterDismissed() bắn BẤT ĐỒNG BỘ, mà subscription
    // của chúng dùng takeUntilDestroyed(#destroyRef) nên đã bị gỡ trước khi tới lượt. Không emit
    // ở đây thì destroy một modal đang mở sẽ đóng overlay mà KHÔNG bao giờ báo (sdClosed).
    this.#markClosed();
    this.forceClose();
  }

  // why: idempotent — chốt trên isOpened(). Đường destroy emit trước, nếu sau đó
  // afterClosed()/afterDismissed() vẫn kịp bắn thì lần thứ hai là no-op, không double-emit.
  #markClosed = (): void => {
    if (!this.isOpened()) return;
    this.isOpened.set(false);
    this.#closeRequest = undefined;
    this.sdClosed.emit();
  };

  #resolveWidth(): string {
    const w = this.width() || '80vw';
    if (this.#isMobile) return w;
    switch (w) {
      case 'lg':
        return '80vw';
      case 'md':
        return '60vw';
      case 'sm':
        return '40vw';
      case 'sx':
        return '20vw';
      default:
        return w;
    }
  }

  open = (): void => {
    if (this.isOpened()) {
      return;
    }
    this.alreadyOpened.set(true);
    this.isOpened.set(true);
    this.#resolvedWidth = this.#resolveWidth();

    if ((!this.view() && this.#isMobile) || this.view() === 'bottom-sheet') {
      this.#bottomSheetRef = this.#bottomSheet.open(this.templateRef(), {
        panelClass: this.#resolvePanelClass('sd-modal-bottom-sheet-panel'),
        disableClose: this.disableBackdropClose() || !!this.beforeClose(),
      });
      this.#bindGuardedDismiss(this.#bottomSheetRef);
      this.#bottomSheetRef.afterDismissed().pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(this.#markClosed);
    } else {
      this.#dialogRef = this.#dialog.open(this.templateRef(), {
        width: this.#resolvedWidth,
        maxWidth: this.#resolvedWidth,
        panelClass: this.#resolvePanelClass('sd-modal-panel'),
        disableClose: this.disableBackdropClose() || !!this.beforeClose(),
      });
      this.#bindGuardedDismiss(this.#dialogRef);
      this.#dialogRef.afterClosed().pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(this.#markClosed);
    }
  };

  close = (): void => {
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

  forceClose = (): void => {
    this.#bottomSheetRef?.dismiss();
    this.#dialogRef?.close();
  };

  #bindGuardedDismiss(ref: MatDialogRef<any> | MatBottomSheetRef<any>): void {
    if (!this.beforeClose() || this.disableBackdropClose()) return;

    const dismissRef = ref as SdModalDismissRef;
    dismissRef
      .backdropClick?.()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(() => this.close());
    dismissRef
      .keydownEvents?.()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((event: KeyboardEvent) => {
        if (event.key === 'Escape') this.close();
      });
  }

  #resolvePanelClass(baseClass: string): string[] {
    const customClass = this.modalClass();
    const classes = [baseClass];

    if (typeof customClass === 'string') {
      classes.push(...customClass.split(/\s+/).filter(Boolean));
      return classes;
    }

    if (Array.isArray(customClass)) {
      classes.push(...customClass.filter(Boolean));
      return classes;
    }

    if (customClass && typeof customClass === 'object') {
      Object.entries(customClass).forEach(([className, enabled]) => {
        if (enabled) classes.push(className);
      });
    }

    return classes;
  }
}
