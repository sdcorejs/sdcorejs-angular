import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import * as uuid from 'uuid';
import { I18nService, TranslatePipe } from '@sdcorejs/angular/i18n';

interface Image {
  id: string;
  // Vì NgOptimizedImage không thể sử dụng với blobSrc nên đối với url từ cdn sẽ vẫn lưu ở src
  blobSrc: string;
  src?: string;
  name: string;
  size: number;
}

@Component({
  selector: 'sd-preview-image',
  imports: [SdModal, SdButton, CommonModule, NgOptimizedImage, TranslatePipe],
  templateUrl: './preview-image.component.html',
  styleUrl: './preview-image.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdPreviewImage {
  @ViewChild(SdModal) modal!: SdModal;
  @Output() close = new EventEmitter<void>();

  readonly #i18n = inject(I18nService);
  title: string = this.#i18n.t('core.component.preview-image.title');
  thumbnailPosition: 'right' | 'left' | 'bottom' | 'top' = 'right';
  activeIndex = 0;
  images: Image[] = [];
  constructor(private cd: ChangeDetectorRef) {}

  #loadImages = async (urlOrFiles: (string | File)[]) => {
    urlOrFiles = urlOrFiles.filter(url => !!url);
    // Xử lý nếu là url thì thực hiện fetch lấy blob rồi từ blob => file
    const promises = urlOrFiles.map<Promise<Image | null>>(async urlOrFile => {
      if (typeof urlOrFile === 'string') {
        return fetch(urlOrFile)
          .then(async r => {
            const blob = await r.blob();
            // Lấy filename dựa vào url src
            const baseSrc = urlOrFile.split('?')[0];
            const filename = baseSrc.substring(baseSrc.lastIndexOf('/') + 1);
            const file = new File([blob], filename);
            const image: Image = {
              id: uuid.v4(),
              blobSrc: URL.createObjectURL(file!),
              src: urlOrFile,
              name: file!.name,
              size: file!.size,
            };
            return image;
          })
          .catch(err => {
            console.error(err);
            return null;
          });
      } else {
        if (urlOrFile.type.split('/')[0] === 'image') {
          const image: Image = {
            id: uuid.v4(),
            blobSrc: URL.createObjectURL(urlOrFile),
            name: urlOrFile.name,
            size: urlOrFile.size,
          };
          return image;
        }
        return null;
      }
    });
    this.images = (await Promise.all(promises)).filter(image => image !== null);
  };

  // Nên sử dụng urlOrFiles ở tham số khi open thay vì dùng @Input để component sử dụng sẽ chỉ cần map ở hàm khi gọi open thay vì phải mất công map mọi lúc để binding vào @Input
  open = async (urlOrFiles: (string | File)[] | undefined | null) => {
    if (!Array.isArray(urlOrFiles)) {
      return;
    }
    await this.#loadImages(urlOrFiles);
    this.#reset();
    this.modal?.open();
    this.cd.markForCheck();
  };

  onClickThumbnailImage = (index: number) => {
    this.activeIndex = index;
    this.cd.markForCheck();
  };

  updateCurrentImage = (direction: 1 | -1) => {
    this.activeIndex = (this.activeIndex + direction + this.images.length) % this.images.length;
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

  #reset = () => {
    this.activeIndex = 0;
  };
}
