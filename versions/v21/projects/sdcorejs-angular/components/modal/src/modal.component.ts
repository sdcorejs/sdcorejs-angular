import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatBottomSheet, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { BrowserUtilities } from '@sdcorejs/utils/fns';
import { Color, Size } from '@sdcorejs/utils/models';

@Component({
  selector: 'sd-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  // encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MatIconModule, MatBottomSheetModule, MatDialogModule, MatDividerModule, MatButtonModule],
})
export class SdModal {
  static index = signal(0);

  templateRef = viewChild.required<TemplateRef<any>>('templateRef');
  modal = viewChild<ElementRef>('modal');

  // autoId prefix `modal-`. Lưu ý: footer/body buttons render qua <ng-content> nên consumer phải
  // tự đặt [attr.data-autoId] cho các nút đó. Component chỉ tự bind autoId cho NÚT ĐÓNG (X icon).
  readonly autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  readonly autoId = computed(() => (this.autoIdInput() ? `components-modal-${this.autoIdInput()}` : undefined));
  readonly closeButtonAutoId = computed(() => (this.autoId() ? `${this.autoId()}-close` : undefined));
  readonly dataOpened = computed(() => (this.isOpened() ? 'true' : 'false'));

  title = input<string, string | null | undefined>('', { transform: (v) => v ?? '' });
  color = input<Color, Color | null | undefined>('primary', { transform: (v) => v ?? 'primary' });
  width = input<Size | string, Size | string | null | undefined>('md', { transform: (v) => v ?? 'md' });
  height = input<string, string | null | undefined>('auto', { transform: (v) => v ?? 'auto' });
  view = input<'dialog' | 'bottom-sheet' | undefined, 'dialog' | 'bottom-sheet' | null | undefined>(undefined, { transform: (v) => v ?? undefined });
  modalClass = input<string | string[] | Record<string, boolean>, string | string[] | Record<string, boolean> | null | undefined>('', { transform: (v) => v ?? '' });
  lazyLoadContent = input(true, { transform: booleanAttribute });
  hideClose = input<boolean, boolean | ''>(false, { transform: booleanAttribute });
  disableBackdropClose = input<boolean, boolean | ''>(true, { transform: booleanAttribute }); // default to true to keep backward compatibility

  sdClosed = output<void>();

  isOpened = signal(false);
  alreadyOpened = signal(false);

  #isMobile = false;
  #resolvedWidth = 'md';
  #bottomSheetRef!: MatBottomSheetRef<any>;
  #dialogRef!: MatDialogRef<any>;

  #dialog = inject(MatDialog);
  #bottomSheet = inject(MatBottomSheet);
  #destroyRef = inject(DestroyRef);

  constructor() {
    this.#isMobile = BrowserUtilities.isMobile();
  }

  #resolveWidth(): string {
    const w = this.width() || '80vw';
    if (this.#isMobile) return w;
    switch (w) {
      case 'lg': return '80vw';
      case 'md': return '60vw';
      case 'sm': return '40vw';
      case 'sx': return '20vw';
      default: return w;
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
        panelClass: this.modalClass() as string | string[],
        disableClose: this.disableBackdropClose()
      });
      this.#bottomSheetRef.afterDismissed()
        .pipe(takeUntilDestroyed(this.#destroyRef))
        .subscribe(() => {
          this.isOpened.set(false);
          this.sdClosed.emit();
        });
    } else {
      this.#dialogRef = this.#dialog.open(this.templateRef(), {
        width: this.#resolvedWidth,
        maxWidth: this.#resolvedWidth,
        panelClass: this.modalClass() as string | string[],
        disableClose: this.disableBackdropClose(),
      });
      this.#dialogRef.afterClosed()
        .pipe(takeUntilDestroyed(this.#destroyRef))
        .subscribe(() => {
          this.isOpened.set(false);
          this.sdClosed.emit();
        });
    }
  };

  close = (): void => {
    this.#bottomSheetRef?.dismiss();
    this.#dialogRef?.close();
  };
}
