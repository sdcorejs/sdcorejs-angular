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
  viewChildren,
} from '@angular/core';
import { FormGroup, NgForm, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { SdLabelDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import { SdFormControl, sdFormControlState } from '@sdcorejs/angular/forms/models';
import { SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { SdConfirmService, SdNotifyService } from '@sdcorejs/angular/services';
import { BrowserUtilities, Utilities } from '@sdcorejs/utils/fns';
import { sdIsEmpty } from '@sdcorejs/angular/utilities/data-state';
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
import { I18nService, TranslatePipe } from '@sdcorejs/angular/i18n';

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
    TranslatePipe,
  ],
})
export class SdUploadFile<TArgs = any> {
  // ─── Injected Services ────────────────────────────────────────────────
  readonly #notifyService = inject(SdNotifyService);
  readonly #confirmService = inject(SdConfirmService);
  readonly #configuration = inject<ISdUploadFileConfiguration | ISdUploadFileConfiguration[]>(SD_UPLOAD_FILE_CONFIGURATION, {
    optional: true,
  });
  readonly #uploadFileService = inject(UploadFileService);
  readonly #destroyRef = inject(DestroyRef);
  readonly #i18n = inject(I18nService);

  // ─── Internal State ───────────────────────────────────────────────────
  readonly id = `I${Utilities.generateUuid()}`;
  readonly #isMobileOrTablet = BrowserUtilities.isMobile();
  readonly #canvas1 = `C${Utilities.generateUuid()}`;
  readonly #canvas2 = `C${Utilities.generateUuid()}`;
  #name = Utilities.generateUuid();
  #formGroup?: FormGroup;

  readonly formControl = new SdFormControl();

  // why: component là OnPush nhưng template đọc formControl.touched/errors như thuộc tính
  // THƯỜNG (không reactive). Khi cha submit (markAllAsTouched) hoặc validator gắn lỗi, không
  // có gì markForCheck → view không re-render → message lỗi required không hiện. sdFormControlState
  // bọc formControl thành signal tick mỗi control event (value/status/touched) → showRequiredError
  // (computed) đọc signal này → template đọc computed → OnPush tự refresh khi state đổi.
  readonly #state = sdFormControlState(computed(() => this.formControl));
  /** Hiển thị message "vui lòng upload": không disabled + đã touched + còn lỗi required. */
  readonly showRequiredError = computed<boolean>(() => {
    void this.#state(); // phụ thuộc control events để re-eval (OnPush refresh)
    return !this.formControl.disabled && this.formControl.touched && !!this.formControl.errors?.['required'];
  });

  // ─── Signals (state) ──────────────────────────────────────────────────
  readonly previewFiles = signal<PreviewFile[]>([]);
  readonly selectedFile = signal<PreviewFile | null | undefined>(undefined);

  // ─── Query Signals ────────────────────────────────────────────────────
  readonly previewFileComponent = viewChild(PreviewComponent);
  readonly dropElements = viewChildren<ElementRef>('dropElement');
  readonly sdLabelDef = contentChild(SdLabelDefDirective);

  // ─── Input Signals ────────────────────────────────────────────────────
  // autoId prefix `upload-file-`. Mỗi nút remove dùng index-based suffix để ổn định khi filename trùng nhau.
  readonly autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  readonly autoId = computed(() => (this.autoIdInput() ? `components-upload-file-${this.autoIdInput()}` : undefined));
  readonly removeAutoId = (index: number): string | undefined => (this.autoId() ? `${this.autoId()}-remove-${index}` : undefined);

  // ─── E2E data attributes ──────────────────────────────────────────────
  readonly dataDisabled = computed(() => (this.disabled() ? 'true' : 'false'));
  readonly dataEmpty = computed(() => (sdIsEmpty(this.previewFiles()) ? 'true' : 'false'));
  readonly dataCount = computed(() => String(this.previewFiles()?.length ?? 0));

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

  // ─── Inputs with transform (null/undefined → default value) ─────────
  form = input<FormGroup | undefined, any>(undefined, {
    transform: (val: any): FormGroup | undefined => {
      if (!val) return undefined;
      // Nếu cha truyền vào NgForm (template-driven) -> Bóc lấy FormGroup bên trong
      if (val instanceof NgForm) return val.form;
      // Nếu cha truyền sẵn FormGroup (reactive) -> Lấy luôn
      if (val instanceof FormGroup) return val;
      // Fallback an toàn phòng trường hợp cha truyền 1 object chứa form
      if (val?.form instanceof FormGroup) return val.form;
      return undefined;
    },
  });

  readonly nameInput = input<string, string | undefined>(Utilities.generateUuid(), {
    alias: 'name',
    transform: (val): string => val || Utilities.generateUuid(),
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

  // ─── Computed ─────────────────────────────────────────────────────────
  readonly generatedDescription = computed(() => {
    const desc = this.description();
    if (desc) return desc;
    const exts = this.extensions();
    const maxSz = this.maxSize();
    if (exts.length && maxSz) {
      return this.#i18n.t('core.component.upload-file.desc-format-and-size', { exts: exts.join(', '), maxSize: maxSz });
    } else if (exts.length) {
      return this.#i18n.t('core.component.upload-file.desc-format', { exts: exts.join(', ') });
    } else if (maxSz) {
      return this.#i18n.t('core.component.upload-file.desc-max-size', { maxSize: maxSz });
    }
    return undefined;
  });

  // ─── Output Signals ───────────────────────────────────────────────────
  readonly loaded = output<PreviewFile[]>();
  readonly filesChanged = output<(string | File)[]>();

  // ─── Model Signal (two-way binding support: [(model)]) ────────────────
  readonly model = model<(string | number)[]>([]);

  constructor() {
    this.#validateDuplicateConfigurationKeys();

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

    // why: required() là signal input — phải đăng ký validator qua effect để bắt thay
    // đổi runtime. Validators.required nhận biết array rỗng (length === 0) là empty
    // nên file array hoạt động đúng. updateValueAndValidity để chip lỗi xuất hiện
    // ngay khi required toggle true mà chưa upload file nào.
    effect(() => {
      if (this.required()) {
        this.formControl.setValidators(Validators.required);
      } else {
        this.formControl.clearValidators();
      }
      this.formControl.updateValueAndValidity({ emitEvent: false });
    });

    // Cleanup on destroy
    this.#destroyRef.onDestroy(() => {
      this.#revokePreviewBlobURLs();
      this.#formGroup?.removeControl(this.#name);
    });
  }

  // ─── Drop container setup ─────────────────────────────────────────────
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

  // ─── Private Methods ──────────────────────────────────────────────────
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

  #validateDuplicateConfigurationKeys = (): void => {
    const configurations = this.#getConfigurations();
    if (!configurations.length) {
      return;
    }

    const seen = new Set<string>();
    for (const configuration of configurations) {
      const key = configuration.key;
      const normalizedKey = key === undefined ? '__undefined__' : key;
      if (seen.has(normalizedKey)) {
        const label = key === undefined ? 'undefined' : key;
        throw new Error(`[sd-upload-file] Duplicate upload configuration key detected: ${label}`);
      }
      seen.add(normalizedKey);
    }
  };

  #getSelectedConfiguration = (): ISdUploadFileConfiguration | undefined => {
    const configurations = this.#getConfigurations();
    if (!configurations.length) {
      return undefined;
    }
    const key = this.key();
    return configurations.find(configuration => configuration.key === key);
  };

  #getUploadHandler = (): SdUploadFileFuncUpload<any> | undefined => {
    return this.uploadInput() || this.#getSelectedConfiguration()?.upload;
  };

  #getDetailsHandler = (): SdUploadFileFuncDetails<any> | undefined => {
    return this.details() || this.#getSelectedConfiguration()?.details;
  };

  #getDownloadHandler = (): SdUploadFileFuncDownload<any> | undefined => {
    return this.downloadInput() || this.#getSelectedConfiguration()?.download;
  };

  #validate = async (file: File): Promise<string | null> => {
    if (this.type() === 'image') {
      if (file.type.split('/')[0] !== 'image') {
        return this.#i18n.t('core.component.upload-file.not-image', { name: file.name });
      }
    }
    const exts = this.extensions();
    if (exts?.length) {
      const lastDot = file.name.lastIndexOf('.');
      const extension = file.name.substring(lastDot + 1);
      if (!exts.some(e => e.toUpperCase() === extension.toUpperCase())) {
        return this.#i18n.t('core.component.upload-file.invalid-format', { name: file.name, exts: exts.join(', ') });
      }
    }
    const maxSz = this.maxSize();
    if (maxSz) {
      if (maxSz * 1024 * 1024 < file.size) {
        return this.#i18n.t('core.component.upload-file.size-exceeded', { name: file.name, maxSize: maxSz });
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
        previewFile.isPreviewImage = previewFile.file?.type.split('/')[0] === 'image' && previewFile.file?.type !== 'image/tiff';
        // trigger signal update
        this.previewFiles.set([...this.previewFiles()]);
      };
      reader.readAsDataURL(previewFile.file!);
    }
  };

  // ─── Public Event Handlers ────────────────────────────────────────────
  onUpload = () => {
    BrowserUtilities.upload({
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
        this.#notifyService.error(error?.message || this.#i18n.t('core.component.upload-file.upload-failed'));
      });
  };

  #uploadFile = async (originFiles: File[]) => {
    const currentModel = [...(this.model() || [])];
    if (originFiles.length + currentModel.length > this.max()) {
      this.#notifyService.warning(this.#i18n.t('core.component.upload-file.too-many-files'));
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
        .confirm(this.#i18n.t('core.component.upload-file.confirm-delete-message'), {
          title: this.#i18n.t('core.component.upload-file.confirm-delete-title'),
          yesTitle: this.#i18n.t('core.component.upload-file.confirm-yes'),
          noTitle: this.#i18n.t('core.component.upload-file.confirm-no'),
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

  // ─── Resize ───────────────────────────────────────────────────────────
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

  // ─── Public API ───────────────────────────────────────────────────────
  /**
   * Lấy danh sách các File từ previewFiles (chưa upload).
   */
  getFiles = async () => {
    const items = this.previewFiles()?.filter(val => !!val) || [];
    return items.map(e => e?.file).filter(file => !!file);
  };

  /**
   * Thực hiện upload các file và gán giá trị, output trả ra mảng idOrKeys.
   * HÀM NÀY BẮT BUỘC PHẢI GỌI TRƯỚC KHI GỌI VỀ SERVER.
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
            ? this.#i18n.t('core.component.upload-file.no-configuration')
            : this.#i18n.t('core.component.upload-file.no-configuration-key', { key })
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
   * Mở popup preview ảnh.
   */
  preview = async () => {
    this.previewFileComponent()?.open(this.previewFiles());
  };

  /**
   * Tải xuống một tệp tin dựa trên đối tượng PreviewFile.
   *
   * Ưu tiên:
   * 1. Nếu consumer CÓ implement hàm download (input `download` hoặc configuration) VÀ file có
   *    `idOrKey` (file đã lưu trên server) → LUÔN gọi hàm download. KHÔNG mở `src` (URL lấy từ detail).
   *    Dùng cho trường hợp tải file qua API có xác thực thay vì truy cập trực tiếp URL.
   * 2. Ngược lại (không có hàm download, hoặc file local chưa upload nên chưa có `idOrKey`) →
   *    tải trực tiếp từ `file` (blob) hoặc `src` (URL).
   *
   * @param previewFile Đối tượng PreviewFile chứa thông tin tệp tin.
   */
  onDownload = (previewFile: PreviewFile) => {
    const downloadHandler = this.#getDownloadHandler();

    // (1) Có hàm download + file đã lưu (idOrKey) → luôn trigger hàm download, bỏ qua URL từ detail.
    if (downloadHandler && previewFile.idOrKey) {
      downloadHandler(previewFile.idOrKey, this.args());
      return;
    }

    // (2) Không có hàm download (hoặc file local chưa có idOrKey) → tải trực tiếp từ blob/URL.
    if (previewFile.file || previewFile.src) {
      BrowserUtilities.download(previewFile.file! || previewFile.src!, previewFile.fileName);
      return;
    }

    console.error('Invalid preview file (no download handler / file / src)', previewFile);
  };

  isLastVisibleOverlay(fileIndex: number): boolean {
    return this.formControl.disabled && fileIndex === this.maxOfImage() - 1 && this.previewFiles().length > this.maxOfImage();
  }

  // ─── Details ──────────────────────────────────────────────────────────
  /**
   * Khi binding model, đầu vào thường là id/key/cdn,
   * cần render ra ảnh/tệp tương ứng.
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

  // ─── Helpers ──────────────────────────────────────────────────────────
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
   * Giải phóng các URL blob đã tạo để tránh rò rỉ bộ nhớ.
   * Chỉ nên gọi khi không còn sử dụng previewFiles nữa.
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
