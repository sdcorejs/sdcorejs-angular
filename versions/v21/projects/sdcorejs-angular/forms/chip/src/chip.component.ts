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
  output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
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
import { SdFormControl } from '@sdcorejs/angular/forms/models';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdSize } from '@sdcorejs/angular/utilities';
import { Subscription } from 'rxjs';
import * as uuid from 'uuid';
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
export class SdChip implements AfterViewInit {
  #ref = inject(ChangeDetectorRef);
  readonly #i18n = inject(I18nService);
  #subscription = new Subscription();
  #name = uuid.v4();
  #form?: FormGroup;

  // Signals - inputs
  autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  autoId = computed(() => (this.autoIdInput() ? `forms-chip-${this.autoIdInput()}` : undefined));
  name = input<string | undefined>();
  appearance = input<MatFormFieldAppearance>('outline');
  floatLabel = input<FloatLabelType>('auto');
  size = input<SdSize>('md');
  form = input<NgForm | FormGroup | undefined>();
  label = input('');
  placeholder = input<string | undefined>();
  removable = input<boolean | ((item: any) => boolean)>(true);
  hideInlineError = input(false, { transform: booleanAttribute });
  model = input<(string | number)[] | undefined>();
  required = input(false, { transform: booleanAttribute });
  min = input<number>(0);
  max = input<number>(0);
  addable = input(true, { transform: booleanAttribute });
  disabled = input(false, { transform: booleanAttribute });
  viewed = input(false, { transform: booleanAttribute });
  hyperlink = input<string | null | undefined>();

  // Signals - outputs
  modelChange = output<any[]>();
  sdChange = output<any[]>();

  // Template properties
  @ViewChild('input') input!: ElementRef<HTMLInputElement>;
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
    // Update form reference
    effect(() => {
      const formInput = this.form();
      if (formInput) {
        if (formInput instanceof NgForm) {
          this.#form = formInput.form;
        } else {
          this.#form = formInput;
        }
      }
    });

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

  get errorTooltipMessage(): string | undefined {
    const errors = this.#formControl.errors;
    if (!errors) return undefined;

    if (errors['required']) return this.#i18n.t('core.form.chip.required');
    if (errors['minlength']) return this.#i18n.t('core.form.chip.minlength', { min: this.min() });
    if (errors['maxlength']) return this.#i18n.t('core.form.chip.maxlength', { max: this.max() });
    return undefined;
  }

  get matcher() {
    return this.#matcher;
  }

  ngAfterViewInit() {
    this.#subscription.add(
      this.#formControl.sdChanges.subscribe(() => {
        this.#ref.markForCheck();
      })
    );
    this.#form?.addControl(this.#name, this.#formControl);
  }

  ngOnDestroy() {
    this.#form?.removeControl(this.#name);
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
      this.modelChange.emit(this.#formControl.value);
      this.sdChange.emit(this.#formControl.value);
    }
    this.input.nativeElement.value = '';
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
      this.modelChange.emit(this.#formControl.value);
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
          this.modelChange.emit(this.#formControl.value);
          this.sdChange.emit(this.#formControl.value);
        }
      }
      this.input.nativeElement.value = '';
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
        this.input?.nativeElement?.focus();
      }
    }, 100);
  };

  #clear = ($event?: any) => {
    $event?.stopPropagation();
    this.#inputControl.setValue('');
    this.#formControl.setValue([]);
    this.modelChange.emit(this.#formControl.value);
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

