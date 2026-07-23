import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild, inject, output } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { PreviewFile } from '../../services';
import { MatIcon } from '@angular/material/icon';
import { I18nService, TranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

@Component({
  selector: 'preview',
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdIcon, SdModal, SdButton, CommonModule, MatIcon, TranslatePipe],
})
export class PreviewComponent {
  private cd = inject(ChangeDetectorRef);

  @ViewChild(SdModal) modal!: SdModal;
  readonly download = output<PreviewFile>();
  readonly close = output<void>();

  readonly #i18n = inject(I18nService);
  title: string = this.#i18n.t('core.component.upload-file.preview-title');
  thumbnailPosition: 'right' | 'left' | 'bottom' | 'top' = 'right';
  activeIndex = 0;
  previewFiles: PreviewFile[] = [];

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {}

  // Nên sử dụng urlOrFiles ở tham số khi open thay vì dùng @Input để component sử dụng sẽ chỉ cần map ở hàm khi gọi open thay vì phải mất công map mọi lúc để binding vào @Input
  open = async (previewFiles: PreviewFile[] | undefined | null, index?: number) => {
    if (!Array.isArray(previewFiles) || previewFiles.length === 0) {
      return;
    }
    this.previewFiles = previewFiles;
    this.activeIndex = index || 0;
    this.modal?.open();
    this.cd.markForCheck();
  };

  onClickThumbnailImage = (index: number) => {
    this.activeIndex = index;
    this.cd.markForCheck();
  };

  updateCurrentImage = (direction: 1 | -1) => {
    this.activeIndex = (this.activeIndex + direction + this.previewFiles.length) % this.previewFiles.length;
    this.#scrollView(this.activeIndex, direction === 1 ? 'start' : 'end');
    this.cd.markForCheck();
  };

  onClose = () => {
    this.close.emit();
  };

  #scrollView = (index: number, type?: 'center' | 'end' | 'nearest' | 'start') => {
    const nameId: string = 'thumbnailImage' + index;
    const element = document.getElementById(nameId);
    if (!element) {
      return;
    }
    const blockType: ScrollLogicalPosition = type || 'start';
    element.scrollIntoView({ behavior: 'smooth', block: blockType });
  };

  onDownload = (previewFile: PreviewFile) => {
    this.download.emit(previewFile);
    this.cd.markForCheck();
  };
}
