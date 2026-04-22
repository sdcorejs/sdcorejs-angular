import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { PreviewFile } from '../../services';
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'preview',
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdModal, SdButton, CommonModule, MatIcon],
})
export class PreviewComponent {
  @ViewChild(SdModal) modal!: SdModal;
  @Output() download = new EventEmitter<PreviewFile>();
  @Output() close = new EventEmitter<void>();

  title: string = 'Xem áº£nh';
  thumbnailPosition: 'right' | 'left' | 'bottom' | 'top' = 'right';
  activeIndex = 0;
  previewFiles: PreviewFile[] = [];
  constructor(private cd: ChangeDetectorRef) {}

  // NÃªn sá»­ dá»¥ng urlOrFiles á»Ÿ tham sá»‘ khi open thay vÃ¬ dÃ¹ng @Input Ä‘á»ƒ component sá»­ dá»¥ng sáº½ chá»‰ cáº§n map á»Ÿ hÃ m khi gá»i open thay vÃ¬ pháº£i máº¥t cÃ´ng map má»i lÃºc Ä‘á»ƒ binding vÃ o @Input
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

