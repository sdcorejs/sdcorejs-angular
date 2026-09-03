import {
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { Utilities } from '@sdcorejs/utils/fns';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncValidatorFn, FormGroup, NgForm, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import {
  Alignment,
  Bold,
  ClassicEditor,
  Essentials,
  FontColor,
  FontSize,
  Italic,
  List,
  Paragraph,
  Underline,
  Undo,
  Widget,
} from 'ckeditor5';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ISdEditorConfiguration, SD_EDITOR_CONFIGURATION, SdEditorUploadFileFuncUpload } from './configurations';
import { SdNotifyService } from '@sdcorejs/angular/services';
import { I18nService } from '@sdcorejs/angular/i18n';
import { sdIsEmpty } from '@sdcorejs/angular/utilities/data-state';
import { EditorImageUploadPlugin } from './plugins/image-upload/image-upload.plugin';
import { EditorOption, SdEditorOption } from './models';
import { HandleSdCustomValidator, SdCustomValidator, SdFormControl, ɵsdFormControlConnector } from '@sdcorejs/angular/forms/models';
import { SdCKEditorStyles } from '@sdcorejs/angular/components/ckeditor-styles';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import {
  applyReplacementsToEditor,
  countTextLength,
  filterActivePendingFiles,
  getActiveBlobUrls,
  getBatchConfig,
  imageClassesToInlineStyles,
  imageInlineStylesToClasses,
  runBatchUploads,
} from './plugins/image-upload/utils';

@Component({
  selector: 'sd-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdIcon, CKEditorModule, SdLabel, SdCKEditorStyles, MatFormFieldModule, MatTooltipModule],
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss', './plugins/image-upload/image-upload.plugin.scss'],
})
export class SdEditor {
  // Injected
  readonly #destroyRef = inject(DestroyRef);
  readonly #cdRef = inject(ChangeDetectorRef);
  readonly #uploadConfig = inject<ISdEditorConfiguration | ISdEditorConfiguration[]>(SD_EDITOR_CONFIGURATION, { optional: true });
  readonly #notifyService = inject(SdNotifyService);
  readonly #i18n = inject(I18nService);

  // Input
  readonly option = input<SdEditorOption>({});
  readonly height = input<string>('250px'); // Chiều dài height hiển thị mặc định
  readonly maxHeight = input<string>('250px'); // Chiều dài tối đa mở rộng nếu nội dung vượt quá height mặc định
  readonly maxlength = input<number | undefined>(undefined);
  readonly label = input<string | undefined>();
  readonly helperText = input<string | undefined>();
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly hideInlineError = input(false, { transform: booleanAttribute });
  readonly inlineError = input<string | undefined>();
  readonly placeholder = input<string | undefined>();
  readonly validator = input<SdCustomValidator | undefined>();
  readonly form = input<FormGroup | undefined, any>(undefined, {
    transform: (val: any): FormGroup | undefined => {
      if (!val) return undefined;
      if (val instanceof NgForm) return val.form;
      if (val instanceof FormGroup) return val;
      if (val?.form instanceof FormGroup) return val.form;
      return undefined;
    },
  });
  readonly key = input<string | undefined>(undefined);
  readonly autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  readonly autoId = computed(() => (this.autoIdInput() ? `components-editor-${this.autoIdInput()}` : undefined));
  readonly dataDisabled = computed(() => (this.disabled() ? 'true' : 'false'));
  readonly dataEmpty = computed(() => (sdIsEmpty(this.valueModel()) ? 'true' : 'false'));
  readonly name = input<string>(Utilities.generateUuid());
  readonly valueModel = model<string>('', { alias: 'model' });

  // Output
  readonly sdChange = output<string>();
  readonly sdBlur = output<FocusEvent>();
  readonly sdFocus = output<FocusEvent>();

  // State
  readonly _textLength = signal(0);
  readonly formControl = new SdFormControl();
  readonly #formConnector = ɵsdFormControlConnector<unknown, unknown>({
    form: this.form,
    name: this.name,
    control: computed(() => this.formControl),
  });
  readonly isOverLimit = computed(() => {
    const max = this.maxlength();
    return max !== undefined && this._textLength() > max;
  });

  get errorMessage(): string | undefined {
    const errors = this.formControl.errors;
    if (!errors) return undefined;
    if (errors['required']) return this.#i18n.t('core.component.editor.required');
    if (errors['maxlength']) return this.#i18n.t('core.component.editor.maxlength', { max: this.maxlength() ?? 0 });
    if (errors['customValidator']) return errors['customValidator'] as string;
    if (errors['inlineError']) return this.inlineError();
    return undefined;
  }

  readonly Editor = ClassicEditor;
  #editor: ClassicEditor | undefined;
  readonly #contentChangeSubject = new Subject<string>();

  readonly editorConfig = computed<EditorOption>(() => {
    const opt = this.option();
    const uploadFn = this.#buildUploadFn();
    const enableImageUpload = !!uploadFn;

    const plugins: any[] = [Essentials, FontColor, FontSize, Paragraph, Bold, Italic, Underline, List, Undo, Widget, Alignment];
    if (enableImageUpload) plugins.push(EditorImageUploadPlugin);

    const toolbarItems = [
      'bold',
      'italic',
      'underline',
      '|',
      'fontSize',
      'fontColor',
      '|',
      'alignment:left',
      'alignment:center',
      'alignment:right',
      'alignment:justify',
      '|',
      'bulletedList',
      'numberedList',
    ];
    if (enableImageUpload) toolbarItems.push('|', 'uploadImage');

    const config: EditorOption = {
      licenseKey: 'GPL',
      getOption: () => ({
        ...opt,
        uploadFn,
        onWarning: (msg: string) => this.#notifyService.warning(msg),
        // Truyền i18n service xuống CKEditor plugin (ngoài DI tree) để dịch warning messages
        _i18n: this.#i18n,
      }),
      plugins,
      toolbar: { items: toolbarItems, shouldNotGroupWhenFull: true },
      placeholder: this.placeholder(),
      fontColor: { columns: 5, documentColors: 10, colorPicker: { format: 'hex' } },
      fontSize: { options: [10, 11, 12, 14, 16, 18, 20], supportAllValues: true },
    };

    if (enableImageUpload) {
      config.image = {
        resizeUnit: '%',
        resizeOptions: [
          { name: 'resizeImage:100', value: '100', label: '100%' },
          { name: 'resizeImage:75', value: '75', label: '75%' },
          { name: 'resizeImage:50', value: '50', label: '50%' },
          { name: 'resizeImage:25', value: '25', label: '25%' },
          { name: 'resizeImage:original', value: null, label: 'Original' },
        ],
        toolbar: ['resizeImage', '|', 'imageStyle:alignBlockLeft', 'imageStyle:alignCenter', 'imageStyle:alignBlockRight'],
      };
    }

    return config;
  });

  constructor() {
    this.#validateDuplicateConfigKeys();
    this.#setupEffects();
    this.#setupSubscriptions();
    this.#setupDestroy();
  }

  onReady = (editor: ClassicEditor) => {
    this.#editor = editor;

    const currentValue = this.valueModel();
    if (currentValue) {
      this.#setToEditor(currentValue);
    }
    if (this.formControl.disabled) {
      editor.enableReadOnlyMode('sd-editor');
    }
    if (this.readonly()) {
      editor.enableReadOnlyMode('sd-editor-readonly');
    }

    editor.model.document.registerPostFixer(writer => {
      let changed = false;
      for (const change of editor.model.document.differ.getChanges()) {
        if (change.type === 'insert' && (change.name === 'imageBlock' || change.name === 'imageInline')) {
          const element = (change as any).position.nodeAfter;
          if (element && !element.hasAttribute('resizedWidth')) {
            writer.setAttribute('resizedWidth', '100%', element);
            changed = true;
          }
        }
      }
      return changed;
    });

    editor.model.document.on('change:data', () => this.#contentChangeSubject.next(editor.getData()));
    editor.editing.view.document.on('focus', evt => this.sdFocus.emit((evt as any).domEvent as FocusEvent));
    editor.editing.view.document.on('blur', evt => {
      this.sdBlur.emit((evt as any).domEvent as FocusEvent);
      this.formControl.markAsTouched();
      this.#cdRef.markForCheck();
    });
  };

  focusEditor = () => this.#editor?.editing?.view?.focus?.();

  /**
   * Xử lý tải lên các file và trả về nội dung dữ liệu cuối cùng.
   * * @description
   * - Đối với các file upload chế độ 'deferred' (chỉ xử lý khi submit), cần @ViewChild component và gọi hàm upload() này.
   * - Hỗ trợ two-way binding.
   * - Hàm hỗ trợ trả ra data cuối cùng.
   * * @returns {Promise<string>} Nội dung cuối cùng được trích xuất từ sd-editor.
   */
  upload = async (): Promise<string> => {
    await this.#uploadImages();
    return this.#getFromEditor();
  };

  // Editor Content
  #setToEditor(html: string): void {
    this.#editor?.setData?.(this.#normalizeHtmlForEditor(html));
  }

  #getFromEditor(): string {
    return this.#editor ? this.#normalizeEditorToHtml(this.#editor.getData()) : '';
  }

  // Normalize HTML từ bên ngoài -> format CKEditor.
  #normalizeHtmlForEditor = (html: string): string => {
    if (!html) {
      return '';
    }

    let result = html;
    result = imageInlineStylesToClasses(result);
    return result;
  };

  // Normalize HTML từ CKEditor → format HTML.
  #normalizeEditorToHtml = (html: string): string => {
    if (!html) {
      return '';
    }

    let result = html;
    result = imageClassesToInlineStyles(result);
    return result;
  };

  // Xử lý binding 2 chiều
  #onModelSignalChange(html: string): void {
    const v = html ?? '';
    if (this.formControl.value === v) {
      return;
    }
    this.formControl.setValue(v, { emitEvent: false });
    this._textLength.set(countTextLength(v));
    if (this.#editor) {
      this.#setToEditor(v);
    }
  }

  // Xử lý khi user soạn thảo
  #onEditorUserInput(rawHtml: string): void {
    const out = imageClassesToInlineStyles(rawHtml);
    this._textLength.set(countTextLength(out));
    if (this.formControl.value !== out) {
      this.formControl.setValue(out, { emitEvent: false });
    }
    this.formControl.updateValueAndValidity({ emitEvent: false });
    this.formControl.sdChanges.next(true);
    this.valueModel.set(out);
    this.sdChange.emit(out);
  }

  // Xử lý nếu dev sử dụng form và set trực tiếp data
  #onFormGroupExternalChange(html: string): void {
    const v = html ?? '';
    this.valueModel.set(v);
    this._textLength.set(countTextLength(v));
    if (this.#editor) {
      this.#setToEditor(v);
    }
  }

  // Validators
  #requiredValidator(): ValidatorFn {
    return (): ValidationErrors | null => (this._textLength() ? null : { required: true });
  }

  #maxLengthValidator(): ValidatorFn {
    return (): ValidationErrors | null => {
      const max = this.maxlength()!;
      const len = this._textLength();
      return len > max ? { maxlength: { requiredLength: max, actualLength: len } } : null;
    };
  }

  #inlineErrorValidator(): ValidatorFn {
    return (): ValidationErrors | null => ({ inlineError: true });
  }

  #updateValidators(): void {
    const validators: ValidatorFn[] = [];
    const asyncValidators: AsyncValidatorFn[] = [];

    if (this.required()) {
      validators.push(this.#requiredValidator());
    }
    if (this.maxlength() !== undefined) {
      validators.push(this.#maxLengthValidator());
    }
    if (this.inlineError()) {
      validators.push(this.#inlineErrorValidator());
    }

    const val = this.validator();
    if (val) {
      asyncValidators.push(HandleSdCustomValidator(val));
    }

    this.formControl.setValidators(validators.length ? validators : null);
    this.formControl.setAsyncValidators(asyncValidators.length ? asyncValidators : null);
    this.formControl.updateValueAndValidity({ emitEvent: false });
  }

  // Setup
  #setupEffects(): void {
    // Lắng nghe disabled
    effect(() => {
      if (this.disabled()) {
        this.formControl.disable({ emitEvent: false });
      } else {
        this.formControl.enable({ emitEvent: false });
      }
    });

    // Lắng nghe readonly
    effect(() => {
      if (!this.#editor) {
        return;
      }
      if (this.readonly()) {
        this.#editor.enableReadOnlyMode('sd-editor-readonly');
      } else {
        this.#editor.disableReadOnlyMode('sd-editor-readonly');
      }
    });

    // Lắng nghe binđing 2 chiều model
    effect(() => this.#onModelSignalChange(this.valueModel()));

    // Lắng nghe validators
    effect(() => {
      this.required();
      this.maxlength();
      this.inlineError();
      this.validator();
      this.#updateValidators();
    });
  }

  #setupSubscriptions(): void {
    // Đăng ký nếu dev sử dụng form để set data trực tiếp từ bên ngoài vào
    this.formControl.valueChanges
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((val: string) => this.#onFormGroupExternalChange(val));

    this.formControl.sdChanges.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => this.#cdRef.markForCheck());

    // Đăng ký user gõ trong editor
    this.#contentChangeSubject
      .pipe(debounceTime(100), takeUntilDestroyed(this.#destroyRef))
      .subscribe(rawHtml => this.#onEditorUserInput(rawHtml));
  }

  #setupDestroy(): void {
    this.#destroyRef.onDestroy(() => {
      this.#editor?.destroy?.();
    });
  }

  // Helpers
  #uploadImages = async (): Promise<void> => {
    const uploadMode = this.option()?.imageConfig?.uploadMode ?? 'deferred';
    // Early return nếu không phải 'deferred' mode.
    // Nếu trước đó là mode "deferred" mà mong muốn chuyển sang mode "immediate", dev chưa cần refactor code phía caller mà không ảnh hưởng đến logic.
    if (uploadMode !== 'deferred') return;

    const uploadFn = this.#buildUploadFn();
    if (!uploadFn) {
      throw new Error('No upload function configured for image upload');
    }

    const plugin = this.#editor?.plugins?.get(EditorImageUploadPlugin) as EditorImageUploadPlugin | undefined;
    if (!plugin || plugin.pendingFiles.size === 0) return;

    const { batchSize, maxConcurrent } = getBatchConfig(this.option());
    const activeBlobUrls = this.#editor ? getActiveBlobUrls(this.#editor) : new Set<string>();
    const toUpload = filterActivePendingFiles(plugin.pendingFiles, activeBlobUrls);

    // Capture trước await để tránh race condition: ảnh được chèn trong lúc chờ API
    const processedBlobUrls = new Set(toUpload.map(([blobUrl]) => blobUrl));
    const { replacements, failedBatches } = await runBatchUploads(toUpload, uploadFn, batchSize, maxConcurrent);

    if (this.#editor) {
      const lazyLoad = this.option()?.imageConfig?.lazyLoad ?? true;
      for (const detail of replacements.values()) {
        plugin.setMeta(detail.cdn, { name: detail.name, idOrKey: detail.idOrKey, lazyLoad });
      }
      applyReplacementsToEditor(this.#editor, replacements);
    }

    // Chỉ xóa đúng các entries đã được xử lý
    for (const blobUrl of processedBlobUrls) {
      plugin.pendingFiles.delete(blobUrl);
    }

    for (const [blobUrl, file] of failedBatches.flat()) {
      plugin.pendingFiles.set(blobUrl, file);
    }

    if (failedBatches.length > 0) {
      throw new Error(`Upload failed for ${failedBatches.flat().length} image(s)`);
    }
  };

  #getConfigurations = (): ISdEditorConfiguration[] => {
    const config = this.#uploadConfig;
    if (!config) {
      return [];
    }
    return Array.isArray(config) ? config : [config];
  };

  #validateDuplicateConfigKeys = (): void => {
    const config = this.#uploadConfig;
    if (!config) {
      return;
    }
    const configurations = Array.isArray(config) ? config : [config];
    const seen = new Set<string>();
    for (const cfg of configurations) {
      const normalizedKey = cfg.key === undefined ? '__undefined__' : cfg.key;
      if (seen.has(normalizedKey)) {
        const label = cfg.key === undefined ? 'undefined' : cfg.key;
        throw new Error(`[sd-editor] Duplicate upload configuration key detected: ${label}`);
      }
      seen.add(normalizedKey);
    }
  };

  #getSelectedConfig = (): ISdEditorConfiguration | undefined => {
    const configurations = this.#getConfigurations();
    if (!configurations.length) {
      return undefined;
    }

    return configurations.find(cfg => cfg.key === this.key());
  };

  #buildUploadFn = (): SdEditorUploadFileFuncUpload | undefined => {
    return this.option()?.imageConfig?.uploadFn ?? this.#getSelectedConfig()?.upload;
  };
}
