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
import { SdEditorEngine, SdEditorImportDiagnostic, SdEditorSurface } from '@sdcorejs/angular/components/editor-engine';
import { ISdEditorConfiguration, SD_EDITOR_CONFIGURATION, SdEditorUploadFileFuncUpload } from './configurations';
import { SdNotifyService } from '@sdcorejs/angular/services';
import { I18nService } from '@sdcorejs/angular/i18n';
import { sdIsEmpty } from '@sdcorejs/angular/utilities/data-state';
import { sdSanitizeEditorHtml } from '@sdcorejs/angular/utilities/extensions';
import { SdEditorOption } from './models';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { countTextLength } from './plugins/image-upload/utils/style.utils';
import { SdEditorUploadManager } from './upload-manager';
import { HandleSdCustomValidator, SdCustomValidator, SdFormControl, ɵsdFormControlConnector } from '@sdcorejs/angular/forms/models';

@Component({
  selector: 'sd-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdIcon, SdEditorSurface, SdLabel, MatFormFieldModule, MatTooltipModule],
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
})
export class SdEditor {
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

  readonly sdImportWarning = output<readonly SdEditorImportDiagnostic[]>();
  readonly #diagnostics = signal<readonly SdEditorImportDiagnostic[]>([]);
  readonly importDiagnostics = this.#diagnostics.asReadonly();
  readonly surfaceContent = signal('');
  readonly uploadEnabled = computed(() => !!this.#buildUploadFn());
  readonly descriptionId = computed(() => `sd-editor-description-${Utilities.generateUuid()}`);
  #engine?: SdEditorEngine;
  #uploads?: SdEditorUploadManager;
  #timer?: ReturnType<typeof setTimeout>;
  #pending?: string;
  #deadline?: number;
  #composing = false;
  #destroyed = false;

  constructor() {
    this.#validateDuplicateConfigKeys();
    effect(() => {
      const disabled = this.disabled();
      if (disabled) this.formControl.disable({ emitEvent: false });
      else this.formControl.enable({ emitEvent: false });
      if (disabled) this.#cancelWork();
    });
    effect(() => {
      if (this.readonly()) this.#cancelWork();
    });
    effect(() => this.#setExternalContent(this.valueModel() ?? ''));
    effect(() => {
      this.required();
      this.maxlength();
      this.inlineError();
      this.validator();
      this.#updateValidators();
    });
    this.formControl.valueChanges.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((value: string) => {
      const normalized = value ?? '';
      this.#setExternalContent(normalized);
      this.valueModel.set(normalized);
    });
    this.formControl.statusChanges.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
      if (this.formControl.disabled) this.#cancelWork();
      this.#cdRef.markForCheck();
    });
    this.formControl.sdChanges.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => this.#cdRef.markForCheck());
    this.#destroyRef.onDestroy(() => {
      this.#destroyed = true;
      this.#cancelCadence();
      this.#uploads?.destroy();
      this.#engine = undefined; // Surface owns engine destruction exactly once.
    });
  }

  onEngineReady(engine: SdEditorEngine): void {
    this.#cancelCadence();
    this.#composing = false;
    this.#uploads?.destroy();
    this.#engine = engine;
    this.#uploads = new SdEditorUploadManager(
      engine,
      () => ({ ...this.option().imageConfig, uploadFn: this.#buildUploadFn() }),
      message => this.#notifyService.warning(message),
      this.#i18n
    );
  }
  onSourceChange(): void {
    this.#cancelCadence();
    if (this.formControl.disabled || this.readonly()) this.#uploads?.invalidateWork();
    else this.#uploads?.invalidateSource();
  }
  onSurfaceChange(value: string): void {
    if (this.#destroyed || this.formControl.disabled || this.readonly()) return;
    this.#uploads?.pruneRemoved();
    this.#clearTimer();
    this.#pending = value;
    // Composition pauses an existing deadline; its final document replaces only
    // the pending value. An ordinary edit starts a new 100ms debounce deadline.
    if (!this.#composing || this.#deadline === undefined) this.#deadline = Date.now() + 100;
    if (!this.#composing) this.#schedulePending();
  }
  onCompositionChange(composing: boolean): void {
    this.#composing = composing;
    this.#clearTimer();
    if (!composing) this.#schedulePending();
  }
  #schedulePending(): void {
    if (this.#pending === undefined || this.#deadline === undefined || this.#composing || this.#destroyed) return;
    this.#timer = setTimeout(
      () => {
        this.#timer = undefined;
        const value = this.#pending;
        this.#pending = undefined;
        this.#deadline = undefined;
        if (value !== undefined && !this.#destroyed && !this.#composing && !this.formControl.disabled && !this.readonly())
          this.#onEditorUserInput(value);
      },
      Math.max(0, this.#deadline - Date.now())
    );
  }
  onSurfaceFocus(event: FocusEvent): void {
    this.sdFocus.emit(event);
  }
  onSurfaceBlur(event: FocusEvent): void {
    this.sdBlur.emit(event);
    this.formControl.markAsTouched();
    this.#cdRef.markForCheck();
  }
  onDiagnostics(diagnostics: readonly SdEditorImportDiagnostic[]): void {
    this.#diagnostics.set(diagnostics);
    this.sdImportWarning.emit(diagnostics);
  }
  async onFilesSelected(files: File[]): Promise<void> {
    if (this.formControl.disabled || this.readonly()) return;
    await this.#uploads?.selectFiles(files);
  }
  focusEditor = (): void => {
    if (!this.formControl.disabled) this.#engine?.focus();
  };
  upload = async (): Promise<string> => {
    if ((this.option().imageConfig?.uploadMode ?? 'deferred') === 'deferred') {
      if (!this.#buildUploadFn()) throw new Error('No upload function configured for image upload');
      await this.#uploads?.upload();
    }
    return this.#engine?.getHtml() ?? '';
  };
  #clearTimer(): void {
    if (this.#timer !== undefined) clearTimeout(this.#timer);
    this.#timer = undefined;
  }
  #cancelCadence(): void {
    this.#clearTimer();
    this.#pending = undefined;
    this.#deadline = undefined;
  }
  #cancelWork(): void {
    this.#cancelCadence();
    this.#uploads?.invalidateWork();
  }
  #setExternalContent(value: string): void {
    if (this.formControl.value !== value) this.formControl.setValue(value, { emitEvent: false });
    this._textLength.set(countTextLength(value));
    this.formControl.updateValueAndValidity({ emitEvent: false });
    if (this.#isCurrentContent(value)) return;
    this.#cancelCadence();
    this.#uploads?.invalidateSource();
    this.surfaceContent.set(value);
    this.#engine?.setContent(value);
  }
  #isCurrentContent(value: string): boolean {
    if (!this.#engine) return value === this.surfaceContent();
    try {
      return value === this.#engine.getContent();
    } catch {
      return false;
    }
  }
  #onEditorUserInput(rawHtml: string): void {
    const value = sdSanitizeEditorHtml(rawHtml);
    this._textLength.set(countTextLength(value));
    if (this.formControl.value !== value) {
      this.formControl.setValue(value, { emitEvent: false });
      if (value !== rawHtml) this.formControl.markAsDirty();
    }
    this.formControl.updateValueAndValidity({ emitEvent: false });
    this.formControl.sdChanges.next(true);
    this.valueModel.set(value);
    this.sdChange.emit(value);
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
