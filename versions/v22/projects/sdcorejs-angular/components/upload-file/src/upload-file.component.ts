import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
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
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { SdLabelDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import { SdFormControl, sdFormControlState, ɵsdFormControlConnector } from '@sdcorejs/angular/forms/models';
import { SdConfirmService, SdNotifyService } from '@sdcorejs/angular/services';
import { BrowserUtilities, Utilities } from '@sdcorejs/utils/fns';
import { FilePickerCancelledError } from '@sdcorejs/utils/errors';
import { sdIsEmpty } from '@sdcorejs/angular/utilities/data-state';
import { SdUtilities } from '@sdcorejs/angular/utilities/extensions';
import { PreviewComponent } from './components/preview/preview.component';
import { SdUploadFileTypeIcon } from './components/file-type-icon/file-type-icon.component';
import {
  ISdUploadFileConfiguration,
  SD_UPLOAD_FILE_CONFIGURATION,
  SdUploadFileDetail,
  SdUploadFileFuncDownload,
  SdUploadFileFuncDetails,
  SdUploadFileFuncUpload,
} from './configurations';
import { FilterDocumentPipe, FilterImagePipe, SdUploadFileMetaPipe, SdUploadFileReasonPipe } from './pipes';
import { IsImage, PreviewFile, UploadFileService } from './services';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

/** File bị từ chối khi chọn hoặc thả (đợt 3 · 4c): giữ `File` và lý do, không nằm trong giá trị. */
export interface SdUploadFileFailure {
  id: number;
  file: File;
  fileName: string;
  reason: string;
}

// https://stackoverflow.com/questions/4459379/preview-an-image-before-it-is-uploaded
@Component({
  selector: 'sd-upload-file',
  templateUrl: './upload-file.component.html',
  styleUrl: './upload-file.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SdIcon,
    CommonModule,
    MatButtonModule,
    DragDropModule,
    SdLabel,
    PreviewComponent,
    FilterImagePipe,
    FilterDocumentPipe,
    SdUploadFileMetaPipe,
    SdUploadFileReasonPipe,
    SdUploadFileTypeIcon,
    MatProgressSpinner,
    SdTranslatePipe,
  ],
  host: {
    class: 'sd-upload-file',
    '[class.sd-upload-file--dragging]': 'dragging()',
    '(dragenter)': 'onDragEnter($event)',
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'onDragLeave()',
    '(drop)': 'onDropFiles($event)',
  },
})
export class SdUploadFile<TArgs = unknown> {
  // ─── Injected Services ────────────────────────────────────────────────
  readonly #notifyService = inject(SdNotifyService);
  readonly #confirmService = inject(SdConfirmService);
  readonly #configuration = inject<ISdUploadFileConfiguration | ISdUploadFileConfiguration[]>(SD_UPLOAD_FILE_CONFIGURATION, {
    optional: true,
  });
  readonly #uploadFileService = inject(UploadFileService);
  readonly #destroyRef = inject(DestroyRef);
  readonly #i18n = inject(I18nService);
  /** Locale hiện tại cho dung lượng file (`2,4 MB` ở vi). */
  readonly locale = this.#i18n.locale;

  // ─── Internal State ───────────────────────────────────────────────────
  readonly id = `I${Utilities.generateUuid()}`;
  readonly #isMobileOrTablet = BrowserUtilities.isMobile();
  readonly #canvas1 = `C${Utilities.generateUuid()}`;
  readonly #canvas2 = `C${Utilities.generateUuid()}`;
  #uploadPromise?: Promise<void>;
  #destroyed = false;
  readonly #localFiles = new Map<string, File>();
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
  /** @deprecated Đợt 3 · 4c: chạm ô ảnh trên màn cảm ứng mở popup, không còn chọn ô. Không còn đọc ở đâu. */
  readonly selectedFile = signal<PreviewFile | null | undefined>(undefined);
  /** Đang kéo tệp từ máy vào component: ô tải lên / vùng thả đổi trạng thái. */
  readonly dragging = signal(false);
  /**
   * File bị từ chối khi chọn hoặc thả (sai định dạng, quá dung lượng, không phải ảnh…): giữ trong danh sách cùng lý do tới
   * khi người dùng xoá. Không nằm trong `model` hay giá trị form.
   */
  readonly failures = signal<SdUploadFileFailure[]>([]);
  /** Khoá trong `model` của các file local đang được `upload()` gửi lên. */
  readonly uploadingKeys = signal<ReadonlySet<string | number>>(new Set());
  /** Khoá của các file local mà lần `upload()` gần nhất thất bại (vẫn trong `model`, thử lại được). */
  readonly uploadFailedKeys = signal<ReadonlySet<string | number>>(new Set());
  // why: PreviewFile không mang khoá của model; nhớ khoá từng PreviewFile để biết ô nào đang tải lên / lỗi.
  readonly #previewKeys = new WeakMap<PreviewFile, string | number>();
  #dragDepth = 0;
  #nextFailureId = 0;

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
  readonly previewWidth = input<string>('72px');
  readonly previewHeight = input<string>('72px');
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

  /** Số file trong giá trị (`model`), không tính file bị từ chối. */
  readonly count = computed(() => {
    const model = this.model();
    return Array.isArray(model) ? model.filter(value => value !== null && value !== undefined && value !== '').length : 0;
  });
  /** Bộ đếm `{n} / {max}` cạnh nhãn: chỉ khi có nhãn, được chọn nhiều file và field không disabled. */
  readonly showCounter = computed(() => (!!this.label() || !!this.sdLabelDef()?.templateRef) && this.max() > 1 && !this.disabled());
  /** Còn thêm được file: chưa đủ `max` và không disabled. */
  readonly canAdd = computed(() => {
    void this.#state();
    return this.previewFiles().length < this.max() && !this.formControl.disabled;
  });

  // ─── Output Signals ───────────────────────────────────────────────────
  readonly loaded = output<PreviewFile[]>();
  readonly filesChanged = output<(string | File)[]>();

  // ─── Model Signal (two-way binding support: [(model)]) ────────────────
  readonly model = model<(string | number)[]>([]);
  readonly #formConnector = ɵsdFormControlConnector<unknown, unknown>({
    form: this.form,
    name: this.nameInput,
    control: computed(() => this.formControl),
  });

  constructor() {
    this.#validateDuplicateConfigurationKeys();

    // Reactive sync for model changes
    effect(onCleanup => {
      const modelValue = this.model();
      const values = modelValue || [];
      let active = true;
      let cancelReaders: (() => void) | undefined;
      // why: model có thể đổi trước lần effect kế tiếp; cleanup thôi chưa chặn được
      // Promise cũ resolve trong khoảng đó. Destroy cũng phải chặn mọi emit/ghi state.
      const isCurrent = () => active && !this.#destroyed && this.model() === modelValue;
      onCleanup(() => {
        active = false;
        cancelReaders?.();
      });
      this.formControl.setValue(values);

      if (Array.isArray(values)) {
        this.#details(values).then(previewFiles => {
          if (!isCurrent()) return;
          this.previewFiles.set(previewFiles);
          this.filesChanged.emit(
            this.previewFiles()
              .map(e => e.file || e.idOrKey || e.src)
              .filter(val => !!val) as (string | File)[]
          );
          // why: consumer của filesChanged có thể đổi model hoặc destroy đồng bộ.
          if (isCurrent()) cancelReaders = this.#preview(isCurrent);
        });
      } else {
        this.#localFiles.clear();
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
      this.#destroyed = true;
      this.#localFiles.clear();
      this.#revokePreviewBlobURLs();
    });
  }

  // ─── Kéo tệp từ máy vào ───────────────────────────────────────────────
  // why: host listener (Angular tự gỡ khi huỷ) thay cho 4 addEventListener tự quản trên ô tải lên. Đếm enter/leave để
  // trạng thái không nháy khi rê qua phần tử con. Chỉ xử lý khi đang kéo tệp (`Files`) và còn thêm được file.
  onDragEnter = (event: DragEvent): void => {
    if (!this.#acceptsDrag(event)) return;
    event.preventDefault();
    this.#dragDepth++;
    this.dragging.set(true);
  };

  onDragOver = (event: DragEvent): void => {
    if (!this.#acceptsDrag(event)) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    this.dragging.set(true);
  };

  onDragLeave = (): void => {
    if (!this.dragging()) return;
    this.#dragDepth = Math.max(0, this.#dragDepth - 1);
    if (this.#dragDepth === 0) this.dragging.set(false);
  };

  onDropFiles = async (event: DragEvent): Promise<void> => {
    if (!this.#acceptsDrag(event)) return;
    event.preventDefault();
    this.#dragDepth = 0;
    this.dragging.set(false);
    const files = Array.from(event.dataTransfer?.files ?? []);
    if (files.length) await this.#uploadFile(files);
  };

  #acceptsDrag = (event: DragEvent): boolean => {
    if (this.#destroyed || !this.canAdd()) return false;
    const types = event.dataTransfer?.types;
    // why: không có dataTransfer (sự kiện tự tạo) thì coi như kéo tệp; có thì chỉ nhận khi trong đó có tệp.
    return !types || Array.from(types).includes('Files');
  };

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

  #preview = (isCurrent: () => boolean) => {
    const readers: FileReader[] = [];
    for (const previewFile of this.previewFiles().filter(e => e.file)) {
      const reader = new FileReader();
      reader.onload = evt => {
        if (!isCurrent()) return;
        previewFile.previewSrc = evt.target!.result;
        previewFile.isPreviewImage = previewFile.file?.type.split('/')[0] === 'image' && previewFile.file?.type !== 'image/tiff';
        // trigger signal update
        this.previewFiles.set([...this.previewFiles()]);
      };
      readers.push(reader);
      reader.readAsDataURL(previewFile.file!);
    }
    return () => {
      for (const reader of readers) {
        reader.onload = null;
        if (reader.readyState === FileReader.LOADING) reader.abort();
      }
    };
  };

  // ─── Public Event Handlers ────────────────────────────────────────────
  onUpload = () => {
    // why: đợt 3 · 4c — picker chỉ lọc theo đuôi (`accept`), không tự kiểm dung lượng / đuôi: `#validate` của component
    // kiểm từng file để file lỗi nằm trong danh sách cùng lý do, file hợp lệ trong cùng lần chọn vẫn được thêm.
    const extensions = this.extensions();
    BrowserUtilities.upload({
      accept: extensions.length ? extensions.map(extension => '.' + extension.replace(/^\./, '')).join(',') : undefined,
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
        // why: từ `@sdcorejs/utils` 1.2, huỷ/timeout hộp chọn file reject `FilePickerCancelledError`;
        // huỷ là thao tác bình thường của user, không được hiện toast lỗi.
        if (error instanceof FilePickerCancelledError) return;
        console.error(error);
        this.#notifyService.error(error?.message || this.#i18n.t('core.component.upload-file.upload-failed'));
      });
  };

  #uploadFile = async (originFiles: File[]) => {
    const pickedFiles = new Map<string, File>();
    const pickedKeys: string[] = [];
    const rejected: SdUploadFileFailure[] = [];
    if (originFiles.length + (this.model() || []).length > this.max()) {
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
        // why: lỗi của một file không làm mất các file hợp lệ trước/sau nó trong cùng lần chọn.
        rejected.push({ id: this.#nextFailureId++, file, fileName: file.name, reason: message });
        continue;
      }
      const hashedKey = this.#uploadFileService.add(file);
      if (hashedKey) {
        pickedFiles.set(hashedKey, file);
        pickedKeys.push(hashedKey);
      }
    }
    if (this.#destroyed) return;
    if (rejected.length) this.failures.update(failures => [...failures, ...rejected]);
    if (!pickedKeys.length) return;
    // why: resize/validate có await; upload(), xoá, sắp xếp hoặc lần chọn khác có thể đã đổi model.
    // Nối batch vào model MỚI NHẤT, không ghi lại bản chụp cũ làm mất ID vừa upload hay file vừa chọn.
    const currentModel = [...(this.model() || []), ...pickedKeys];
    if (currentModel.length > this.max()) {
      this.#notifyService.warning(this.#i18n.t('core.component.upload-file.too-many-files'));
      return;
    }
    // why: giữ batch riêng qua từng await validate/resize; cache chung và effect của
    // model cũ có thể mất hash trước khi picker hoàn tất. Chỉ nhận ownership khi commit.
    for (const [key, file] of pickedFiles) this.#localFiles.set(key, file);
    this.#snapshotFiles(currentModel);
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

  /** Huỷ một file đang tải lên: bỏ khỏi `model` ngay (không hỏi xác nhận); lô đang chạy không ghi lại nó. */
  onCancel = (file: PreviewFile) => {
    const files = this.previewFiles();
    const idx = files.indexOf(file);
    if (idx < 0) return;
    this.previewFiles.set(files.filter((_, i) => i !== idx));
    const currentModel = [...(this.model() || [])];
    currentModel.splice(idx, 1);
    this.model.set(currentModel);
    this.#touch();
  };

  /** Bỏ một file bị từ chối khỏi danh sách (file đó chưa từng vào giá trị). */
  removeFailure = (failure: SdUploadFileFailure) => {
    this.failures.update(failures => failures.filter(item => item !== failure));
  };

  /** Thử lại lần `upload()` thất bại với các File đã giữ. Lỗi lần này vẫn hiện trên ô / hàng, không toast. */
  retryUpload = () => {
    this.upload().catch(() => undefined);
  };

  isUploading = (file: PreviewFile): boolean => this.#hasKey(this.uploadingKeys(), file);

  hasUploadFailed = (file: PreviewFile): boolean => !this.isUploading(file) && this.#hasKey(this.uploadFailedKeys(), file);

  #hasKey = (keys: ReadonlySet<string | number>, file: PreviewFile): boolean => {
    const key = this.#previewKeys.get(file);
    return key !== undefined && keys.has(key);
  };

  /**
   * Kéo đổi thứ tự trong lưới ảnh (`group: 'image'`, mặc định) hoặc trong danh sách tài liệu (`'document'`).
   * why: `model` là một mảng chung theo thứ tự thêm. Kéo trong một nhóm chỉ hoán vị các vị trí thuộc nhóm đó, vị trí của
   * nhóm kia giữ nguyên. Bản cũ lấy index trong nhóm ảnh áp thẳng vào mảng trộn.
   */
  onDrop = (event: Pick<CdkDragDrop<unknown>, 'previousIndex' | 'currentIndex'>, group: 'image' | 'document' = 'image') => {
    if (event.previousIndex === event.currentIndex) return;
    const files = this.previewFiles();
    const members = (group === 'image' ? new FilterImagePipe() : new FilterDocumentPipe()).transform(files);
    const positions = members.map(file => files.indexOf(file));
    if (!positions.length || positions.some(position => position < 0)) return;
    const currentModel = [...(this.model() || [])];
    const values = positions.map(position => currentModel[position]);
    const reordered = [...members];
    moveItemInArray(values, event.previousIndex, event.currentIndex);
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);
    const previews = [...files];
    positions.forEach((position, i) => {
      currentModel[position] = values[i];
      previews[position] = reordered[i];
    });
    this.previewFiles.set(previews);
    this.model.set(currentModel);
    this.#touch();
  };

  onImgError = (previewFile: PreviewFile) => {
    previewFile.isImgError = true;
    this.previewFiles.set([...this.previewFiles()]);
  };

  /** @deprecated Đợt 3 · 4c: chạm ô ảnh mở popup. Giữ để không đổi API của class. */
  onSelect = (file: PreviewFile) => {
    if (!this.#isMobileOrTablet) {
      return;
    }
    this.selectedFile.set(this.selectedFile() !== file ? file : null);
  };

  // why: template cần biết có phải thiết bị cảm ứng không để chỉ khi đó mới gắn
  // role="button"/tabindex lên khung ảnh (onSelect là no-op trên desktop — thêm điểm dừng tab
  // ở đó chỉ làm phiền người dùng bàn phím).
  readonly isTouchDevice = this.#isMobileOrTablet;

  // why: drop zone giờ là role="button" + tabindex="0" nên Enter/Space phải mở hộp thoại chọn tệp
  // y hệt click. preventDefault để Space không cuộn trang.
  onUploadKeydown = (event: Event) => {
    event.preventDefault();
    this.onUpload();
  };

  // why: khung ảnh bọc các nút (xoá / phóng to). Chỉ xử lý phím khi CHÍNH khung đang giữ focus,
  // nếu không Enter trên nút xoá sẽ vừa xoá vừa toggle chọn ảnh.
  onSelectKeydown = (file: PreviewFile, event: KeyboardEvent) => {
    if (!this.#isMobileOrTablet) return;
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    this.onSelect(file);
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
   * Upload the local files referenced by the model, then replace their temporary
   * keys with server IDs. Call and await this method before submitting the model.
   *
   * Files are read from the model and local snapshots/cache, so pending or failed metadata
   * requests do not omit files. Each distinct local key is uploaded once per
   * batch; duplicate occurrences retain their positions and share the returned ID.
   * Server IDs and URLs are preserved even when they have no preview metadata.
   *
   * Concurrent calls share the active batch. Changes made while it is pending
   * are preserved: removed keys stay removed, reordering is retained, and newly
   * added local keys remain pending for a subsequent call. After destruction, no
   * new upload starts and an in-flight upload cannot update the model.
   *
   * @returns A promise resolving to void after the batch finishes. The preview
   * metadata refresh may still be pending. With no local files this is a no-op.
   * A missing upload handler displays the configuration error and resolves
   * without changing the model or cache.
   * @throws The upload handler's error, without changing the model or cache.
   * @throws Error if the handler does not return exactly one non-empty string ID
   * per distinct local key; the model and cache are retained in that case.
   *
   * @example
   * import { SdUploadFile } from '@sdcorejs/angular/components/upload-file';
   *
   * async function submit(control: SdUploadFile) {
   *   await control.upload();
   *   return control.model(); // Server IDs/URLs for the uploaded batch.
   * }
   */
  upload = (): Promise<void> => {
    if (this.#destroyed) return Promise.resolve();
    if (!this.#uploadPromise) {
      // why: hai lần submit đồng thời phải dùng chung batch, tránh upload trùng File.
      this.#uploadPromise = this.#uploadPendingFiles().finally(() => {
        this.#uploadPromise = undefined;
      });
    }
    return this.#uploadPromise;
  };

  #uploadPendingFiles = async (): Promise<void> => {
    const pending = [
      ...new Map(
        this.#snapshotFiles(this.model())
          .filter(entry => entry.file)
          .map(entry => [entry.key, entry] as const)
      ).values(),
    ];
    if (!pending.length) return;
    const uploadHandler = this.#getUploadHandler();
    if (!uploadHandler) {
      const key = this.key();
      this.#notifyService.error(
        key === undefined
          ? this.#i18n.t('core.component.upload-file.no-configuration')
          : this.#i18n.t('core.component.upload-file.no-configuration-key', { key })
      );
      return;
    }
    const pendingKeys = new Set<string | number>(pending.map(entry => entry.key));
    this.uploadingKeys.set(pendingKeys);
    this.uploadFailedKeys.update(keys => new Set([...keys].filter(key => !pendingKeys.has(key))));
    let idOrKeys: string[];
    try {
      idOrKeys = await uploadHandler(
        pending.map(entry => entry.file!),
        this.args()
      );
      if (
        !Array.isArray(idOrKeys) ||
        idOrKeys.length !== pending.length ||
        pending.some((_, index) => typeof idOrKeys[index] !== 'string' || !idOrKeys[index])
      ) {
        throw new Error('[sd-upload-file] Upload must return one non-empty string ID per file.');
      }
    } catch (error) {
      // why: lô lỗi thì cả lô thành ô / hàng lỗi (file vẫn trong `model` và cache, thử lại được); `upload()` vẫn reject.
      if (!this.#destroyed) {
        this.uploadingKeys.set(new Set());
        this.uploadFailedKeys.update(keys => new Set([...keys, ...pendingKeys]));
      }
      throw error;
    }
    this.uploadingKeys.set(new Set());
    const replacements = new Map(pending.map((entry, index) => [entry.key, idOrKeys[index]]));
    for (const entry of pending) {
      this.#uploadFileService.remove(entry.key.toString());
      this.#localFiles.delete(entry.key.toString());
    }
    if (this.#destroyed) return;
    // why: thay đúng hash trên model MỚI NHẤT, không phục hồi file đã xoá hoặc
    // ghi đè các thao tác thêm/sắp xếp trong lúc upload đang chờ.
    const values = this.model();
    if (Array.isArray(values)) {
      this.model.set(values.map(key => replacements.get(key) ?? key));
    }
  };

  /**
   * Mở popup xem tệp, tại `file` khi có (mặc định file đầu).
   */
  preview = async (file?: PreviewFile) => {
    const files = this.previewFiles();
    this.previewFileComponent()?.open(files, file ? Math.max(0, files.indexOf(file)) : 0);
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
      // why: `BrowserUtilities.download` của @sdcorejs/utils gán mọi chuỗi vào `<a href>` rồi click, và mở
      // link http bằng `target="_blank"` không có `noopener`. `SdUtilities.download` chặn scheme không an
      // toàn (`sdIsSafeResourceUrl`) và mở link ngoài qua `sdOpenExternal`.
      SdUtilities.download(previewFile.file! || previewFile.src!, previewFile.fileName);
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
    const entries = this.#snapshotFiles(keys);
    if (!entries.length) {
      return [];
    }
    const idOrKeys = entries.filter(entry => !this.#isCdn(entry.key) && !entry.file).map(entry => entry.key);
    let detailsList: SdUploadFileDetail[] = [];
    const detailsHandler = this.#getDetailsHandler();
    if (idOrKeys.length && detailsHandler) {
      try {
        detailsList = await detailsHandler(idOrKeys, this.args());
      } catch (error) {
        console.error(error);
      }
    }
    const results: PreviewFile[] = [];
    const remember = (key: string | number, preview: PreviewFile) => {
      this.#previewKeys.set(preview, key);
      results.push(preview);
    };
    for (const { key, file } of entries) {
      if (this.#isCdn(key)) {
        const cdn = key?.toString();
        const extension = this.#getExtension(cdn);
        const isPreviewImage = this.type() === 'image' || IsImage(extension);
        remember(key, {
          idOrKey: cdn,
          fileName: cdn,
          file: null,
          previewSrc: null,
          src: cdn,
          isPreviewImage,
          extension,
        });
      } else if (file) {
        const lastDot = file.name.lastIndexOf('.');
        const extension = file.name.substring(lastDot + 1);
        const isPreviewImage = (file.type.split('/')[0] === 'image' && file.type !== 'image/tiff') || IsImage(extension);
        remember(key, {
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
          remember(key, {
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

  #snapshotFiles = (keys: (string | number)[]) => {
    const values = Array.isArray(keys) ? keys : [];
    const activeKeys = new Set(values);
    for (const key of this.#localFiles.keys()) {
      if (!activeKeys.has(key)) this.#localFiles.delete(key);
    }
    // why: cache có thể bị upload xoá trong lúc chờ details; giữ File theo snapshot
    // của từng ô và request, kể cả khi ô khác upload cùng hash rồi xoá cache chung.
    return values
      .filter(key => !!key)
      .map(key => {
        let file: File | null = null;
        if (typeof key === 'string' && !this.#isCdn(key)) {
          file = this.#localFiles.get(key) ?? this.#uploadFileService.get(key);
          if (file) this.#localFiles.set(key, file);
        }
        return { key, file };
      });
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
