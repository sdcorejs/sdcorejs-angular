import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  ElementRef,
  contentChild,
  effect,
  inject,
  input,
  model,
  output,
  TemplateRef,
  viewChild,
  OnDestroy,
} from '@angular/core';
import { Utilities } from '@sdcorejs/utils/fns';
import {
  AsyncValidatorFn,
  FormControl,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  NgForm,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { ErrorStateMatcher } from '@angular/material/core';
import { FloatLabelType, MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdLabelDefDirective, SdViewDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import {
  SdFormControl,
  sdFormControlState,
  SdViewed,
  SdViewedInput,
  sdViewedInline,
  sdViewedTransform,
} from '@sdcorejs/angular/forms/models';
import { I18nService } from '@sdcorejs/angular/i18n';
import { sdIsEmpty, sdSerializeDataValue } from '@sdcorejs/angular/utilities/data-state';
import { Size } from '@sdcorejs/utils/models';
import { Subscription } from 'rxjs';
import { SdRemovableChipPipe } from './pipes';

class SdChipErrorStateMatcher implements ErrorStateMatcher {
  constructor(private formControl: FormControl) {}
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(this.formControl?.invalid && (this.formControl?.dirty || this.formControl?.touched || isSubmitted));
  }
}

@Component({
  selector: 'sd-chip',
  templateUrl: './chip.component.html',
  styleUrls: ['./chip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  host: { '[class.sd-has-label]': '!!label()', '[class.sd-viewed]': 'isViewed()' },
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    SdLabel,
    SdView,
    SdRemovableChipPipe,
  ],
})
export class SdChip implements AfterViewInit, OnDestroy {
  #ref = inject(ChangeDetectorRef);
  readonly #i18n = inject(I18nService);
  #subscription = new Subscription();
  #name = Utilities.generateUuid();

  // Signals - inputs (accept null|undefined at boundary, transform to canonical)
  autoIdInput = input<string | undefined, string | null | undefined>(undefined, {
    alias: 'autoId',
    transform: (v): string | undefined => v ?? undefined,
  });
  autoId = computed(() => (this.autoIdInput() ? `forms-chip-${this.autoIdInput()}` : undefined));
  readonly #state = sdFormControlState(computed(() => this.formControl));
  readonly dataDisabled = computed(() => (this.#state().disabled ? 'true' : 'false'));
  readonly dataEmpty = computed(() => (sdIsEmpty(this.#state().value) ? 'true' : 'false'));
  readonly dataValue = computed(() => sdSerializeDataValue(this.#state().value));
  readonly dataCount = computed(() => {
    const v = this.#state().value;
    return String(Array.isArray(v) ? v.length : 0);
  });

  readonly dataRequired = computed(() => (this.required() ? 'true' : 'false'));
  readonly dataErrorMessage = computed(() => {
    void this.#state();
    const msg = this.errorMessage();
    return msg && msg.length > 0 ? msg : null;
  });
  name = input<string | undefined, string | null | undefined>(undefined, {
    transform: (v): string | undefined => v ?? undefined,
  });
  appearance = input<MatFormFieldAppearance, MatFormFieldAppearance | null | undefined>('outline', {
    transform: (v): MatFormFieldAppearance => v || 'outline',
  });
  floatLabel = input<FloatLabelType, FloatLabelType | null | undefined>('auto', {
    transform: (v): FloatLabelType => v || 'auto',
  });
  size = input<Size, Size | null | undefined>('md', {
    transform: (v): Size => v || 'md',
  });
  // why: parent may bind NgForm (template-driven), FormGroup (reactive), or a wrapper with `.form`.
  // Transform once at the input boundary so the rest of the component only deals with FormGroup.
  form = input<FormGroup | undefined, any>(undefined, {
    transform: (val: any): FormGroup | undefined => {
      if (!val) return undefined;
      if (val instanceof NgForm) return val.form;
      if (val instanceof FormGroup) return val;
      if (val?.form instanceof FormGroup) return val.form;
      return undefined;
    },
  });
  label = input<string, string | null | undefined>('', {
    transform: (v): string => v ?? '',
  });
  placeholder = input<string | undefined, string | null | undefined>(undefined, {
    transform: (v): string | undefined => v ?? undefined,
  });
  removable = input<boolean | ((item: any) => boolean), boolean | ((item: any) => boolean) | null | undefined>(true, {
    transform: (v): boolean | ((item: any) => boolean) => v ?? true,
  });
  hideInlineError = input(false, { transform: booleanAttribute });
  required = input(false, { transform: booleanAttribute });
  min = input<number, number | null | undefined>(0, {
    transform: (v): number => v ?? 0,
  });
  max = input<number, number | null | undefined>(0, {
    transform: (v): number => v ?? 0,
  });
  addable = input(true, { transform: booleanAttribute });
  disabled = input(false, { transform: booleanAttribute });
  /** Display mode: `false` edit · `true` static view · `'inline'` interactive (disabled `'inline'` → static). */
  viewed = input<SdViewed, SdViewedInput>(false, { transform: sdViewedTransform });

  // why: tri-state viewed — `'inline'` keeps the chip interactive; disabled `'inline'` falls back to static.
  readonly #viewedState = sdViewedInline(this.viewed, undefined, this.disabled);
  /** `true` when the static view should render (`viewed===true`, or disabled `'inline'`). */
  readonly isViewed = this.#viewedState.isViewed;
  hyperlink = input<string | undefined, string | null | undefined>(undefined, {
    transform: (v): string | undefined => v ?? undefined,
  });

  // Two-way model
  model = model<(string | number)[] | undefined>(undefined);

  // Signals - outputs (modelChange auto-generated by model() signal)
  sdChange = output<any[]>();

  // Template properties
  input = viewChild<ElementRef<HTMLInputElement>>('input');
  sdViewDef = contentChild(SdViewDefDirective);
  sdLabelDef = contentChild(SdLabelDefDirective);
  sdLabelTemplate = contentChild<TemplateRef<any>>('sdLabel');
  sdValueTemplate = contentChild<TemplateRef<any>>('sdValue');

  // Local states
  #isBlurring = false;
  isFocused = false;
  #inputControl = new FormControl();
  #formControl = new SdFormControl();
  #matcher!: SdChipErrorStateMatcher;
  readonly separatorKeysCodes = [ENTER, COMMA];
  readonly selectable = true;

  constructor() {
    // Update validators
    effect(() => {
      this.required();
      this.min();
      this.max();
      this.#updateValidator();
    });

    // Update model
    effect(() => {
      const values = this.model();
      if (Array.isArray(values)) {
        this.#formControl.setValue(values);
      }
    });

    // Handle disabled state
    effect(() => {
      const isDisabled = this.disabled();
      if (isDisabled) {
        this.#formControl.disable();
        this.#inputControl.disable();
      } else {
        this.#formControl.enable();
        this.#inputControl.enable();
      }
    });

    effect(() => {
      const nameVal = this.name();
      if (nameVal) {
        this.#name = nameVal;
      }
    });

    this.#matcher = new SdChipErrorStateMatcher(this.#formControl);
  }

  get formControl() {
    return this.#formControl;
  }

  get inputControl() {
    return this.#inputControl;
  }

  readonly errorMessage = computed<string | undefined>(() => {
    void this.#state();
    const errors = this.#formControl.errors;
    if (!errors) return undefined;

    if (errors['required']) return this.#i18n.t('core.form.chip.required');
    if (errors['minlength']) return this.#i18n.t('core.form.chip.minlength', { min: this.min() });
    if (errors['maxlength']) return this.#i18n.t('core.form.chip.maxlength', { max: this.max() });
    return undefined;
  });

  get matcher() {
    return this.#matcher;
  }

  ngAfterViewInit() {
    this.#subscription.add(
      this.#formControl.sdChanges.subscribe(() => {
        this.#ref.markForCheck();
      })
    );
    this.form()?.addControl(this.#name, this.#formControl);
  }

  ngOnDestroy() {
    this.form()?.removeControl(this.#name);
    this.#subscription.unsubscribe();
  }

  #updateValidator = () => {
    this.#formControl.clearValidators();
    this.#formControl.clearAsyncValidators();
    const validators: ValidatorFn[] = [];
    const asyncValidators: AsyncValidatorFn[] = [];
    if (this.required()) {
      validators.push(Validators.required);
    }
    if (this.min() > 0) {
      validators.push(Validators.minLength(this.min()));
    }
    if (this.max() > 0) {
      validators.push(Validators.maxLength(this.max()));
    }
    this.#formControl.setValidators(validators);
    this.#formControl.setAsyncValidators(asyncValidators);
    this.#formControl.updateValueAndValidity();
  };

  #add = (event: MatChipInputEvent): void => {
    const value = (event.value ?? '').toString().trim();
    const values: (string | number)[] = this.#formControl.value ?? [];
    if (value && this.addable() && !values.includes(value)) {
      values.push(value);
      this.#formControl.setValue(values);
      this.model.set(this.#formControl.value);
      this.sdChange.emit(this.#formControl.value);
    }
    const inputEl = this.input();
    if (inputEl) inputEl.nativeElement.value = '';
    this.#inputControl.setValue('');
  };

  #clickChip = ($event: Event, item: any) => {
    $event.stopPropagation();
    $event.stopImmediatePropagation();
    if (!this.#formControl.disabled) {
      this.#focus();
    }
  };

  #remove = (item: any): void => {
    const values: (string | number)[] = this.#formControl.value ?? [];
    if (typeof item === 'string' || typeof item === 'number') {
      this.#formControl.setValue(values.filter(value => item !== value));
      this.model.set(this.#formControl.value);
      this.sdChange.emit(this.#formControl.value);
    }
    this.#inputControl.setValue('');
    this.#focus();
  };

  #select = (event: MatAutocompleteSelectedEvent) => {
    const item = event.option.value;
    const values: (string | number)[] = this.#formControl.value ?? [];
    if (item) {
      if (typeof item === 'string' || typeof item === 'number') {
        if (!values.includes(item)) {
          values.push(item);
          this.#formControl.setValue(values);
          this.model.set(this.#formControl.value);
          this.sdChange.emit(this.#formControl.value);
        }
      }
      const inputEl = this.input();
      if (inputEl) inputEl.nativeElement.value = '';
      this.#inputControl.setValue('', {
        emitEvent: false,
      });
    }
  };

  #onFocus = () => {
    this.isFocused = true;
    this.#isBlurring = false;
    this.#inputControl.setValue('');
  };

  #onBlur = () => {
    this.#isBlurring = true;
    setTimeout(() => {
      if (this.#isBlurring) {
        this.isFocused = false;
        this.#inputControl.setValue('', {
          emitEvent: false,
        });
        this.#ref.detectChanges();
      }
    }, 150);
  };

  #onClick = () => {
    if (this.sdViewDef()?.templateRef) {
      if (!this.#formControl.disabled && !this.isFocused) {
        this.#focus();
      }
    }
  };

  #focus = () => {
    this.isFocused = true;
    this.#isBlurring = false;
    setTimeout(() => {
      if (this.isFocused) {
        this.input()?.nativeElement?.focus();
      }
    }, 100);
  };

  #clear = ($event?: any) => {
    $event?.stopPropagation();
    this.#inputControl.setValue('');
    this.#formControl.setValue([]);
    this.model.set(this.#formControl.value);
    this.sdChange.emit(this.#formControl.value);
    this.#ref.detectChanges();
  };

  // Public method to expose private methods for template
  onAdd = (event: MatChipInputEvent) => this.#add(event);
  onClickChip = (event: Event, item: any) => this.#clickChip(event, item);
  onRemove = (item: any) => this.#remove(item);
  onSelect = (event: MatAutocompleteSelectedEvent) => this.#select(event);
  onFocus = () => this.#onFocus();
  onBlur = () => this.#onBlur();
  onClick = () => this.#onClick();
  focus = () => this.#focus();
  onClear = ($event?: any) => this.#clear($event);
}
