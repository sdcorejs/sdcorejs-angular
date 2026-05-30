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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncValidatorFn, FormGroup, NgForm, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
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
import * as uuid from 'uuid';
import { ISdEditorConfiguration, SD_EDITOR_CONFIGURATION, SdEditorUploadFileFuncUpload } from './configurations';
import { SdNotifyService } from '@sdcorejs/angular/services';
import { I18nService } from '@sdcorejs/angular/i18n';
import { sdIsEmpty } from '@sdcorejs/angular/utilities/data-state';
import { EditorImageUploadPlugin } from './plugins/image-upload/image-upload.plugin';
import { EditorOption, SdEditorOption } from './models';
import { HandleSdCustomValidator, SdCustomValidator, SdFormControl } from '@sdcorejs/angular/forms/models';
import { SdCKEditorStyles } from '@sdcorejs/angular/components/ckeditor-styles';
import { SdLabel } from '@sdcorejs/angular/forms/label';
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
  imports: [CKEditorModule, SdLabel, SdCKEditorStyles, MatFormFieldModule, MatIconModule, MatTooltipModule],
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
  readonly height = input<string>('250px'); // Chiá»u dÃ i height hiá»ƒn thá»‹ máº·c Ä‘á»‹nh
  readonly maxHeight = input<string>('250px'); // Chiá»u dÃ i tá»‘i Ä‘a má»Ÿ rá»™ng náº¿u ná»™i dung vÆ°á»£t quÃ¡ height máº·c Ä‘á»‹nh
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
  readonly name = input<string>(uuid.v4());
  readonly valueModel = model<string>('', { alias: 'model' });

  // Output
  readonly sdChange = output<string>();
  readonly sdBlur = output<FocusEvent>();
  readonly sdFocus = output<FocusEvent>();

  // State
  readonly _textLength = signal(0);
  readonly formControl = new SdFormControl();
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
        // Truyá»n i18n service xuá»‘ng CKEditor plugin (ngoÃ i DI tree) Ä‘á»ƒ dá»‹ch warning messages
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
   * Xá»­ lÃ½ táº£i lÃªn cÃ¡c file vÃ  tráº£ vá» ná»™i dung dá»¯ liá»‡u cuá»‘i cÃ¹ng.
   * * @description
   * - Äá»‘i vá»›i cÃ¡c file upload cháº¿ Ä‘á»™ 'deferred' (chá»‰ xá»­ lÃ½ khi submit), cáº§n @ViewChild component vÃ  gá»i hÃ m upload() nÃ y.
   * - Há»— trá»£ two-way binding.
   * - HÃ m há»— trá»£ tráº£ ra data cuá»‘i cÃ¹ng.
   * * @returns {Promise<string>} Ná»™i dung cuá»‘i cÃ¹ng Ä‘Æ°á»£c trÃ­ch xuáº¥t tá»« sd-editor.
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

  // Normalize HTML tá»« bÃªn ngoÃ i -> format CKEditor.
  #normalizeHtmlForEditor = (html: string): string => {
    if (!html) {
      return '';
    }

    let result = html;
    result = imageInlineStylesToClasses(result);
    return result;
  };

  // Normalize HTML tá»« CKEditor â†’ format HTML.
  #normalizeEditorToHtml = (html: string): string => {
    if (!html) {
      return '';
    }

    let result = html;
    result = imageClassesToInlineStyles(result);
    return result;
  };

  // Xá»­ lÃ½ binding 2 chiá»u
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

  // Xá»­ lÃ½ khi user soáº¡n tháº£o
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

  // Xá»­ lÃ½ náº¿u dev sá»­ dá»¥ng form vÃ  set trá»±c tiáº¿p data
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
    // Láº¯ng nghe disabled
    effect(() => {
      this.disabled() ? this.formControl.disable({ emitEvent: false }) : this.formControl.enable({ emitEvent: false });
    });

    // Láº¯ng nghe readonly
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

    // Láº¯ng nghe binÄ‘ing 2 chiá»u model
    effect(() => this.#onModelSignalChange(this.valueModel()));

    // Láº¯ng nghe name form
    effect(() => this.form()?.addControl(this.name(), this.formControl));

    // Láº¯ng nghe validators
    effect(() => {
      this.required();
      this.maxlength();
      this.inlineError();
      this.validator();
      this.#updateValidators();
    });
  }

  #setupSubscriptions(): void {
    // ÄÄƒng kÃ½ náº¿u dev sá»­ dá»¥ng form Ä‘á»ƒ set data trá»±c tiáº¿p tá»« bÃªn ngoÃ i vÃ o
    this.formControl.valueChanges
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((val: string) => this.#onFormGroupExternalChange(val));

    this.formControl.sdChanges.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => this.#cdRef.markForCheck());

    // ÄÄƒng kÃ½ user gÃµ trong editor
    this.#contentChangeSubject
      .pipe(debounceTime(100), takeUntilDestroyed(this.#destroyRef))
      .subscribe(rawHtml => this.#onEditorUserInput(rawHtml));
  }

  #setupDestroy(): void {
    this.#destroyRef.onDestroy(() => {
      this.form()?.removeControl(this.name());
      this.#editor?.destroy?.();
    });
  }

  // Helpers
  #uploadImages = async (): Promise<void> => {
    const uploadMode = this.option()?.imageConfig?.uploadMode ?? 'deferred';
    // Early return náº¿u khÃ´ng pháº£i 'deferred' mode.
    // Náº¿u trÆ°á»›c Ä‘Ã³ lÃ  mode "deferred" mÃ  mong muá»‘n chuyá»ƒn sang mode "immediate", dev chÆ°a cáº§n refactor code phÃ­a caller mÃ  khÃ´ng áº£nh hÆ°á»Ÿng Ä‘áº¿n logic.
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

    // Capture trÆ°á»›c await Ä‘á»ƒ trÃ¡nh race condition: áº£nh Ä‘Æ°á»£c chÃ¨n trong lÃºc chá» API
    const processedBlobUrls = new Set(toUpload.map(([blobUrl]) => blobUrl));
    const { replacements, failedBatches } = await runBatchUploads(toUpload, uploadFn, batchSize, maxConcurrent);

    if (this.#editor) {
      const lazyLoad = this.option()?.imageConfig?.lazyLoad ?? true;
      for (const detail of replacements.values()) {
        plugin.setMeta(detail.cdn, { name: detail.name, idOrKey: detail.idOrKey, lazyLoad });
      }
      applyReplacementsToEditor(this.#editor, replacements);
    }

    // Chá»‰ xÃ³a Ä‘Ãºng cÃ¡c entries Ä‘Ã£ Ä‘Æ°á»£c xá»­ lÃ½
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

