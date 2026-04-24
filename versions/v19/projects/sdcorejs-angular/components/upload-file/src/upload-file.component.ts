/* eslint-disable @angular-eslint/no-input-rename */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
  viewChildren
} from '@angular/core';
import { FormGroup, NgForm } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { SdLabelDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import { SdFormControl } from '@sdcorejs/angular/forms/models';
import { SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { SdConfirmService, SdNotifyService } from '@sdcorejs/angular/services';
import { SdUtilities } from '@sdcorejs/angular/utilities/extensions';
import * as uuid from 'uuid';
import { PreviewComponent } from './components/preview/preview.component';
import {
  ISdUploadFileConfiguration,
  SD_UPLOAD_FILE_CONFIGURATION,
  SdUploadFileDetail,
  SdUploadFileFuncDownload,
  SdUploadFileFuncDetails,
  SdUploadFileFuncUpload,
} from './configurations';
import { FilterDocumentPipe, FilterImagePipe } from './pipes';
import { IsImage, PreviewFile, UploadFileService } from './services';

// https://stackoverflow.com/questions/4459379/preview-an-image-before-it-is-uploaded
@Component({
  selector: 'sd-upload-file',
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    DragDropModule,
    SdLabel,
    PreviewComponent,
    FilterImagePipe,
    FilterDocumentPipe,
    SdFormatNumberPipe,
    MatProgressSpinner,
  ],
})
export class SdUploadFile<TArgs = any> {
  // â”€â”€â”€ Injected Services â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  readonly #notifyService = inject(SdNotifyService);
  readonly #confirmService = inject(SdConfirmService);
  readonly #configuration = inject<ISdUploadFileConfiguration | ISdUploadFileConfiguration[]>(
    SD_UPLOAD_FILE_CONFIGURATION,
    { optional: true }
  );
  readonly #uploadFileService = inject(UploadFileService);
  readonly #destroyRef = inject(DestroyRef);

  // â”€â”€â”€ Internal State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  readonly id = `I${uuid.v4()}`;
  readonly #isMobileOrTablet = SdUtilities.isMobile();
  readonly #canvas1 = `C${uuid.v4()}`;
  readonly #canvas2 = `C${uuid.v4()}`;
  #name = uuid.v4();
  #formGroup?: FormGroup;

  readonly formControl = new SdFormControl();

  // â”€â”€â”€ Signals (state) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  readonly previewFiles = signal<PreviewFile[]>([]);
  readonly selectedFile = signal<PreviewFile | null | undefined>(undefined);

  // â”€â”€â”€ Query Signals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  readonly previewFileComponent = viewChild(PreviewComponent);
  readonly dropElements = viewChildren<ElementRef>('dropElement');
  readonly sdLabelDef = contentChild(SdLabelDefDirective);

  // â”€â”€â”€ Input Signals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  readonly args = input<TArgs>();
  readonly label = input<string>();
  readonly key = input<string | undefined>(undefined);
  readonly description = input<string>();
  readonly previewWidth = input<string>('50px');
  readonly previewHeight = input<string>('50px');
  readonly align = input<'left' | 'center'>('left');
  readonly uploadInput = input<SdUploadFileFuncUpload<any> | undefined>(undefined, { alias: 'upload' });
  readonly details = input<SdUploadFileFuncDetails<any>>();
  readonly downloadInput = input<SdUploadFileFuncDownload<any> | undefined>(undefined, { alias: 'download' });
  readonly imageValidator = input<(image: HTMLImageElement) => string>();
  readonly maxSize = input<number>();
  readonly maxWidth = input<number>();
  readonly maxHeight = input<number>();
  readonly scaleToPixel = input<number>();

  // â”€â”€â”€ Inputs with transform (null/undefined â†’ default value) â”€â”€â”€â”€â”€â”€â”€â”€â”€
  form = input<FormGroup | undefined, any>(undefined, {
    transform: (val: any): FormGroup | undefined => {
      if (!val) return undefined;
      // Náº¿u cha truyá»n vÃ o NgForm (template-driven) -> BÃ³c láº¥y FormGroup bÃªn trong
      if (val instanceof NgForm) return val.form;
      // Náº¿u cha truyá»n sáºµn FormGroup (reactive) -> Láº¥y luÃ´n
      if (val instanceof FormGroup) return val;
      // Fallback an toÃ n phÃ²ng trÆ°á»ng há»£p cha truyá»n 1 object chá»©a form
      if (val?.form instanceof FormGroup) return val.form;
      return undefined;
    },
  });

  readonly nameInput = input<string, string | undefined>(uuid.v4(), {
    alias: 'name',
    transform: (val): string => val || uuid.v4(),
  });

  readonly required = input<boolean, boolean | '' | undefined | null>(false, {
    alias: 'required',
    transform: (val): boolean => val === '' || !!val,
  });

  readonly type = input<'image' | 'document' | 'file', 'image' | 'document' | 'file' | undefined | null>('file', {
    alias: 'type',
    transform: (val): 'image' | 'document' | 'file' => val || 'file',
  });

  readonly helperText = input<string | undefined>(undefined, { alias: 'helperText' });

  readonly max = input<number, number | undefined | null>(10, {
    alias: 'max',
    transform: (val): number => val ?? 10,
  });

  readonly maxOfImage = input<number, number | undefined | null>(3, {
    alias: 'maxOfImage',
    transform: (val): number => val ?? 3,
  });

  readonly extensions = input<string[], string[] | undefined | null>([], {
    alias: 'extensions',
    transform: (val): string[] => val?.filter(Boolean) ?? [],
  });

  readonly disabled = input<boolean, boolean | '' | undefined | null>(false, {
    alias: 'disabled',
    transform: (val): boolean => val === '' || !!val,
  });

  // â”€â”€â”€ Computed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  readonly generatedDescription = computed(() => {
    const desc = this.description();
    if (desc) return desc;
    const exts = this.extensions();
    const maxSz = this.maxSize();
    if (exts.length && maxSz) {
      return `Äá»‹nh dáº¡ng: ${exts.join(', ')} vÃ  tá»‘i Ä‘a: ${maxSz}MB`;
    } else if (exts.length) {
      return `Äá»‹nh dáº¡ng: ${exts.join(', ')}`;
    } else if (maxSz) {
      return `Tá»‘i Ä‘a: ${maxSz}MB`;
    }
    return undefined;
  });

  // â”€â”€â”€ Output Signals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  readonly loaded = output<PreviewFile[]>();
  readonly filesChanged = output<(string | File)[]>();

  // â”€â”€â”€ Model Signal (two-way binding support: [(model)]) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  readonly model = model<(string | number)[]>([]);

  constructor() {
    this.#validateDuplicateConfigKeys();

    // Sync form group & register form control
    afterNextRender(() => {
      this.#formGroup = this.form();
      this.#name = this.nameInput();
      this.#formGroup?.addControl(this.#name, this.formControl);

      // Drag & drop setup
      if (!this.#isMobileOrTablet) {
        this.#setupDropContainer();
      }
    });

    // Reactive sync for model changes
    effect(() => {
      const values = this.model() || [];
      this.formControl.setValue(values);

      if (Array.isArray(values)) {
        this.#details(values).then(previewFiles => {
          this.previewFiles.set(previewFiles);
          this.filesChanged.emit(
            this.previewFiles()
              .map(e => e.file || e.idOrKey || e.src)
              .filter(val => !!val) as (string | File)[]
          );
          this.#preview();
        });
      } else {
        this.previewFiles.set([]);
      }
    });

    // Reactive disabled state via effect (runs whenever disabled input changes)
    effect(() => {
      if (this.disabled()) {
        this.formControl.disable();
      } else {
        this.formControl.enable();
      }
    });

    // Cleanup on destroy
    this.#destroyRef.onDestroy(() => {
      this.#revokePreviewBlobURLs();
      this.#formGroup?.removeControl(this.#name);
    });
  }


  // â”€â”€â”€ Drop container setup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  #setupDropContainer() {
    const dropEls = this.dropElements();
    if (dropEls?.length > 0) {
      const dropContainer = dropEls[0].nativeElement;
      this.#bindDropEvents(dropContainer);
    }
  }

  #bindDropEvents(dropContainer: HTMLElement) {
    dropContainer.addEventListener('dragover', (evt: Event) => {
      evt.preventDefault();
      (dropContainer as any).style.opacity = 0.9;
      dropContainer.style.border = '2px solid grey';
    });
    dropContainer.addEventListener('dragenter', (evt: Event) => {
      evt.preventDefault();
    });
    dropContainer.addEventListener('dragleave', () => {
      (dropContainer as any).style.opacity = 0.6;
      dropContainer.style.border = '2px dashed grey';
    });
    dropContainer.addEventListener('drop', async (evt: DragEvent) => {
      evt.preventDefault();
      (dropContainer as any).style.opacity = 0.6;
      dropContainer.style.border = '2px dashed grey';
      const files: File[] = [];
      for (const file of evt.dataTransfer?.files || []) {
        files.push(file);
      }
      await this.#uploadFile(files);
    });
  }

  // â”€â”€â”€ Private Methods â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  #touch = () => {
    this.formControl.markAsTouched();
    this.formControl.setValue(this.model() || []);
  };

  #getConfigurations = (): ISdUploadFileConfiguration[] => {
    const config = this.#configuration;
    if (!config) {
      return [];
    }
    return Array.isArray(config) ? config : [config];
  };

  #validateDuplicateConfigKeys = (): void => {
    const configurations = this.#getConfigurations();
    if (!configurations.length) {
      return;
    }

    const seen = new Set<string>();
    for (const cfg of configurations) {
      const key = cfg.key;
      const normalizedKey = key === undefined ? '__undefined__' : key;
      if (seen.has(normalizedKey)) {
        const label = key === undefined ? 'undefined' : key;
        throw new Error(`[sd-upload-file] Duplicate upload configuration key detected: ${label}`);
      }
      seen.add(normalizedKey);
    }
  };

  #getSelectedConfig = (): ISdUploadFileConfiguration | undefined => {
    const configurations = this.#getConfigurations();
    if (!configurations.length) {
      return undefined;
    }

    const key = this.key();
    return configurations.find(cfg => cfg.key === key);
  };

  #getUploadHandler = (): SdUploadFileFuncUpload<any> | undefined => {
    return this.uploadInput() || this.#getSelectedConfig()?.upload;
  };

  #getDetailsHandler = (): SdUploadFileFuncDetails<any> | undefined => {
    return this.details() || this.#getSelectedConfig()?.details;
  };

  #getDownloadHandler = (): SdUploadFileFuncDownload<any> | undefined => {
    return this.downloadInput() || this.#getSelectedConfig()?.download;
  };

  // #updateValidator = () => {
  //   this.formControl.clearValidators();
  //   this.formControl.clearAsyncValidators();
  //   const validators: ValidatorFn[] = [];
  //   const asyncValidators: AsyncValidatorFn[] = [];
  //   if (this.required()) {
  //     validators.push(Validators.required);
  //   }
  //   this.formControl.setValidators(validators);
  //   this.formControl.setAsyncValidators(asyncValidators);
  //   this.formControl.updateValueAndValidity();
  // };


  #validate = async (file: File): Promise<string | null> => {
    if (this.type() === 'image') {
      if (file.type.split('/')[0] !== 'image') {
        return `[${file.name}] Tá»‡p táº£i lÃªn khÃ´ng pháº£i lÃ  áº£nh`;
      }
    }
    const exts = this.extensions();
    if (exts?.length) {
      const lastDot = file.name.lastIndexOf('.');
      const extension = file.name.substring(lastDot + 1);
      if (!exts.some(e => e.toUpperCase() === extension.toUpperCase())) {
        return `[${file.name}] Tá»‡p táº£i lÃªn khÃ´ng Ä‘Ãºng Ä‘á»‹nh dáº¡ng: ${exts.join(', ')}`;
      }
    }
    const maxSz = this.maxSize();
    if (maxSz) {
      if (maxSz * 1024 * 1024 < file.size) {
        return `[${file.name}] KÃ­ch thÆ°á»›c tá»‡p tá»‘i Ä‘a: ${maxSz} MB`;
      }
    }
    if (this.type() === 'image' && (this.maxWidth() || this.maxHeight() || this.imageValidator())) {
      const message: string | null = await new Promise(resolve => {
        const URL = window.URL || window.webkitURL;
        const img = new Image();
        img.onload = () => {
          const mw = this.maxWidth();
          const mh = this.maxHeight();
          const imgVal = this.imageValidator();
          if (mw && img.width > mw) {
            resolve(`[${file.name}] Max image width ${mw}px`);
            return;
          }
          if (mh && img.height > mh) {
            resolve(`[${file.name}] Max image height ${mh}px`);
            return;
          }
          if (imgVal) {
            resolve(imgVal(img));
            return;
          }
          resolve(null);
        };
        img.src = URL.createObjectURL(file);
      });
      if (message) {
        return message;
      }
    }
    return null;
  };

  #preview = () => {
    for (const previewFile of this.previewFiles().filter(e => e.file)) {
      const reader = new FileReader();
      reader.onload = evt => {
        previewFile.previewSrc = evt.target!.result;
        previewFile.isPreviewImage =
          previewFile.file?.type.split('/')[0] === 'image' && previewFile.file?.type !== 'image/tiff';
        // trigger signal update
        this.previewFiles.set([...this.previewFiles()]);
      };
      reader.readAsDataURL(previewFile.file!);
    }
  };

  // â”€â”€â”€ Public Event Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  onUpload = () => {
    SdUtilities.upload({
      maxSizeInMb: this.maxSize(),
      extensions: this.extensions(),
      multiple: this.max() > 1,
    })
      .then(async result => {
        if (result) {
          if (Array.isArray(result)) {
            await this.#uploadFile(result);
          } else {
            await this.#uploadFile([result]);
          }
        }
      })
      .catch(error => {
        console.error(error);
        this.#notifyService.error(error?.message || 'CÃ³ lá»—i xáº£y ra trong quÃ¡ trÃ¬nh táº£i lÃªn tá»‡p');
      });
  };

  #uploadFile = async (originFiles: File[]) => {
    const currentModel = [...(this.model() || [])];
    if (originFiles.length + currentModel.length > this.max()) {
      this.#notifyService.warning(`Báº¡n Ä‘Ã£ chá»n quÃ¡ nhiá»u file. Vui lÃ²ng kiá»ƒm tra láº¡i sá»‘ lÆ°á»£ng`);
      return;
    }
    for (let file of originFiles) {
      const isImage = file.type.split('/')[0] === 'image' && file.type !== 'image/tiff';
      if (isImage && (this.scaleToPixel() ?? 0) > 0) {
        file = await this.#resize(file!);
      }
      const message = await this.#validate(file!);
      if (message) {
        this.#notifyService.warning(message);
        return;
      }
      const hashedKey = this.#uploadFileService.add(file);
      if (hashedKey) {
        currentModel.push(hashedKey);
      }
    }
    this.model.set(currentModel);
    this.#touch();
  };

  onRemove = (file: PreviewFile) => {
    const files = this.previewFiles();
    const idx = files.indexOf(file);
    if (idx >= 0) {
      this.#confirmService
        .confirm('Báº¡n cÃ³ muá»‘n xÃ³a file nÃ y khÃ´ng? Thao tÃ¡c nÃ y khÃ´ng thá»ƒ hoÃ n tÃ¡c', {
          title: 'XÃ¡c nháº­n xÃ³a?',
          yesTitle: 'XÃ¡c nháº­n',
          noTitle: 'Há»§y',
          yesButtonColor: 'primary',
          noButtonColor: 'primary',
        })
        .then(() => {
          const updated = [...files];
          updated.splice(idx, 1);
          this.previewFiles.set(updated);
          const currentModel = [...(this.model() || [])];
          currentModel.splice(idx, 1);
          this.model.set(currentModel);
          this.filesChanged.emit(
            this.previewFiles()
              .map(e => e.file || e.idOrKey || e.src)
              .filter(val => !!val) as (string | File)[]
          );
          this.#touch();
        });
    }
  };

  onDrop = (event: CdkDragDrop<string[]>) => {
    const currentModel = [...(this.model() || [])];
    moveItemInArray(currentModel, event.previousIndex, event.currentIndex);
    this.model.set(currentModel);
    this.#touch();
  };

  onImgError = (previewFile: PreviewFile) => {
    previewFile.isImgError = true;
    this.previewFiles.set([...this.previewFiles()]);
  };

  onSelect = (file: PreviewFile) => {
    if (!this.#isMobileOrTablet) {
      return;
    }
    this.selectedFile.set(this.selectedFile() !== file ? file : null);
  };

  // â”€â”€â”€ Resize â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  #resize = async (file: File): Promise<File> => {
    if (!this.scaleToPixel()) {
      return file;
    }
    const lastDot = file.name.lastIndexOf('.');
    if (lastDot === -1) {
      return file;
    }
    return await new Promise((resolve, reject) => {
      const URL = window.URL || window.webkitURL;
      const img = new Image();
      img.onload = () => {
        try {
          if (img.width * img.height <= this.scaleToPixel()!) {
            return resolve(file);
          }
          const canvas1 = document.createElement('canvas');
          canvas1.setAttribute('id', this.#canvas1);
          const ctx1 = canvas1.getContext('2d');
          const { width, height } = this.#scale(img.width, img.height, this.scaleToPixel()!);
          canvas1.width = width;
          canvas1.height = height;

          const canvas2 = document.createElement('canvas');
          canvas2.setAttribute('id', this.#canvas2);
          const ctx2 = canvas2.getContext('2d');
          canvas2.width = width;
          canvas2.height = height;
          ctx2!.drawImage(img, 0, 0, canvas2.width, canvas2.height);
          ctx2!.drawImage(canvas2, 0, 0, canvas2.width * 0.5, canvas2.height * 0.5);
          ctx1!.drawImage(canvas2, 0, 0, canvas2.width * 0.5, canvas2.height * 0.5, 0, 0, canvas1.width, canvas1.height);
          canvas1.toBlob(blob => {
            resolve(this.#blobToFile(blob!, `${file.name.substring(0, lastDot)}.png`));
          });
        } catch (err) {
          reject(err);
        } finally {
          document.getElementById(this.#canvas1)?.remove();
          document.getElementById(this.#canvas2)?.remove();
        }
      };
      img.src = URL.createObjectURL(file);
    });
  };

  #scale = (width: number, height: number, scaleToPixcel: number) => {
    if (!width || !height || !scaleToPixcel) {
      return { width, height };
    }
    const ratio = width / height;
    for (let i = 0; i < width; i++) {
      width -= i;
      height = Math.trunc(width / ratio);
      if (width * height <= scaleToPixcel) {
        break;
      }
    }
    return { width, height };
  };

  #blobToFile = (blob: Blob, fileName: string): File => {
    const temp: any = blob;
    temp.lastModifiedDate = new Date();
    temp.name = fileName;
    return blob as File;
  };

  // â”€â”€â”€ Public API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  /**
   * Láº¥y danh sÃ¡ch cÃ¡c File tá»« previewFiles (chÆ°a upload).
   */
  getFiles = async () => {
    const items = this.previewFiles()?.filter(val => !!val) || [];
    return items.map(e => e?.file).filter(file => !!file);
  };

  /**
   * Thá»±c hiá»‡n upload cÃ¡c file vÃ  gÃ¡n giÃ¡ trá»‹, output tráº£ ra máº£ng idOrKeys.
   * HÃ€M NÃ€Y Báº®T BUá»˜C PHáº¢I Gá»ŒI TRÆ¯á»šC KHI Gá»ŒI Vá»€ SERVER.
   */
  upload = async () => {
    const items = this.previewFiles()?.filter(val => !!val) || [];
    if (!Array.isArray(items)) {
      this.model.set([]);
      return;
    }
    const results: (string | number)[] = [];
    const uploadedFiles = items.map(e => e?.file).filter(file => !!file);
    let idOrKeys: string[] = [];
    if (uploadedFiles.length) {
      const uploadHandler = this.#getUploadHandler();
      if (uploadHandler) {
        idOrKeys = await uploadHandler(uploadedFiles, this.args()).then(results => {
          for (const uploadedFile of uploadedFiles) {
            this.#uploadFileService.remove(uploadedFile);
          }
          return results;
        });
      } else {
        const key = this.key();
        this.#notifyService.error(
          key === undefined
            ? 'Vui lÃ²ng inject SD_UPLOAD_FILE_CONFIGURATION hoáº·c truyá»n [upload] trá»±c tiáº¿p vÃ o component'
            : `KhÃ´ng tÃ¬m tháº¥y upload configuration theo key='${key}'. Vui lÃ²ng kiá»ƒm tra providers hoáº·c truyá»n [upload] trá»±c tiáº¿p`
        );
      }
    }
    let idx = 0;
    for (const item of items) {
      if (!item.file) {
        if (item.idOrKey) {
          results.push(item.idOrKey);
        }
      } else {
        if (idOrKeys?.[idx]) {
          results.push(idOrKeys[idx]);
          idx++;
        }
      }
    }
    this.model.set(results);
  };

  /**
   * Má»Ÿ popup preview áº£nh.
   */
  preview = async () => {
    this.previewFileComponent()?.open(this.previewFiles());
  };

  /**
   * Táº£i xuá»‘ng má»™t tá»‡p tin dá»±a trÃªn Ä‘á»‘i tÆ°á»£ng PreviewFile.
   * * Æ¯u tiÃªn:
   * 1. Táº£i xuá»‘ng tá»« thuá»™c tÃ­nh `file`.
   * 2. Táº£i xuá»‘ng tá»« thuá»™c tÃ­nh `src`.
   * 3. Gá»i hÃ m download dá»±a vÃ o `idOrKey`.
   *
   * @param previewFile Äá»‘i tÆ°á»£ng PreviewFile chá»©a thÃ´ng tin tá»‡p tin.
   */
  onDownload = (previewFile: PreviewFile) => {
    if (previewFile.file || previewFile.src) {
      SdUtilities.download(previewFile.file! || previewFile.src!, previewFile.fileName);
      return;
    }
    if (previewFile.idOrKey) {
      this.#getDownloadHandler()?.(previewFile.idOrKey, this.args());
      return;
    }
    console.error('Invalid preview file', previewFile);
  };

  isLastVisibleOverlay(fileIndex: number): boolean {
    return this.formControl.disabled && fileIndex === this.maxOfImage() - 1 && this.previewFiles().length > this.maxOfImage();
  }

  // â”€â”€â”€ Details â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  /**
   * Khi binding model, Ä‘áº§u vÃ o thÆ°á»ng lÃ  id/key/cdn,
   * cáº§n render ra áº£nh/tá»‡p tÆ°Æ¡ng á»©ng.
   */
  #details = async (keys: (string | number)[]) => {
    if (!Array.isArray(keys) || !keys.length) {
      return [];
    }
    const idOrKeys = keys.filter(key => !!key && !this.#isCdn(key) && !this.#isHashedKey(key)) as (string | number)[];
    let detailsList: SdUploadFileDetail[] = [];
    const detailsHandler = this.#getDetailsHandler();
    if (idOrKeys.length && detailsHandler) {
      detailsList = await detailsHandler(idOrKeys, this.args()).catch(error => {
        console.error(error);
        return [];
      });
    }
    const results: PreviewFile[] = [];
    for (const key of keys.filter(val => !!val)) {
      if (this.#isCdn(key)) {
        const cdn = key?.toString();
        const extension = this.#getExtension(cdn);
        const isPreviewImage = this.type() === 'image' || IsImage(extension);
        results.push({
          idOrKey: cdn,
          fileName: cdn,
          file: null,
          previewSrc: null,
          src: cdn,
          isPreviewImage,
          extension,
        });
      } else if (this.#isHashedKey(key)) {
        const hashedKey = key?.toString();
        const file = this.#uploadFileService.get(hashedKey)!;
        const lastDot = file.name.lastIndexOf('.');
        const extension = file.name.substring(lastDot + 1);
        const isPreviewImage = (file.type.split('/')[0] === 'image' && file.type !== 'image/tiff') || IsImage(extension);
        results.push({
          file,
          isPreviewImage,
          previewSrc: null,
          src: null,
          fileName: file.name,
          fileSize: file.size,
          extension,
        });
      } else {
        const detail = detailsList.find(e => e.idOrKey === key);
        if (detail) {
          const { idOrKey, cdn, name, size } = detail;
          const extension = detail.extension || this.#getExtension(name) || this.#getExtension(cdn);
          const isPreviewImage = this.type() === 'image' || IsImage(extension);
          results.push({
            idOrKey: idOrKey || cdn,
            fileName: name,
            fileSize: size,
            file: null,
            previewSrc: null,
            src: cdn,
            isPreviewImage,
            extension,
          });
        }
      }
    }
    return results;
  };

  // â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  #isCdn = (idOrKey: string | number) => {
    if (typeof idOrKey !== 'string') return false;
    return idOrKey.startsWith('http');
  };

  #isHashedKey = (idOrKey: string | number) => {
    if (typeof idOrKey !== 'string') return false;
    return this.#uploadFileService.isHashedKey(idOrKey);
  };

  #getExtension = (cdn: string | undefined) => {
    if (!cdn) return undefined;
    const baseSrc = cdn?.split?.('?')?.[0];
    const lastDot = baseSrc?.lastIndexOf?.('.');
    if (lastDot > 0) {
      return baseSrc.substring(lastDot + 1);
    }
    return undefined;
  };

  /**
   * Giáº£i phÃ³ng cÃ¡c URL blob Ä‘Ã£ táº¡o Ä‘á»ƒ trÃ¡nh rÃ² rá»‰ bá»™ nhá»›.
   * Chá»‰ nÃªn gá»i khi khÃ´ng cÃ²n sá»­ dá»¥ng previewFiles ná»¯a.
   */
  #revokePreviewBlobURLs = (): void => {
    const files = this.previewFiles();
    if (!Array.isArray(files) || !files?.length) return;
    files.forEach(p => {
      if (typeof p?.previewSrc === 'string' && p?.previewSrc?.startsWith('blob')) {
        URL.revokeObjectURL(p.previewSrc);
      }
      if (typeof p?.src === 'string' && p?.src?.startsWith('blob')) {
        URL.revokeObjectURL(p.src);
      }
    });
  };
}

