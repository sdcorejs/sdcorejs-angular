import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
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
import { MatChipsModule } from '@angular/material/chips';
import { ErrorStateMatcher, MatNativeDateModule } from '@angular/material/core';
import { MatCalendar, MatDatepickerModule } from '@angular/material/datepicker';
import { FloatLabelType, MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdLabelDefDirective, SdViewDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import { SdFormControl } from '@sdcorejs/angular/forms/models';
import { DateUtilities, SdSize } from '@sdcorejs/angular/utilities';
import { Subscription } from 'rxjs';
import * as uuid from 'uuid';
import { SdRemovableChipPipe } from './pipes';

class SdChipCalendarErrorStateMatcher implements ErrorStateMatcher {
  constructor(private formControl: FormControl) {}
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(this.formControl?.invalid && (this.formControl?.dirty || this.formControl?.touched || isSubmitted));
  }
}

@Component({
  selector: 'sd-chip-calendar',
  templateUrl: './chip-calendar.component.html',
  styleUrls: ['./chip-calendar.component.scss'],
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatMenuModule,
    SdLabel,
    SdView,
    SdRemovableChipPipe,
  ],
})
export class SdChipCalendar implements AfterViewInit {
  #ref = inject(ChangeDetectorRef);
  #subscription = new Subscription();
  #name = uuid.v4();
  #form?: FormGroup;
  #isBlurring = false;

  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;
  @ViewChild(MatCalendar) calendar!: MatCalendar<Date>;

  autoId = input<string | undefined>();
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
  disabled = input(false, { transform: booleanAttribute });
  viewed = input(false, { transform: booleanAttribute });
  hyperlink = input<string | null | undefined>();

  modelChange = output<any[]>();
  sdChange = output<any[]>();

  @ViewChild('input') input!: ElementRef<HTMLInputElement>;
  sdViewDef = contentChild(SdViewDefDirective);
  sdLabelDef = contentChild(SdLabelDefDirective);
  sdLabelTemplate = contentChild<TemplateRef<any>>('sdLabel');
  sdValueTemplate = contentChild<TemplateRef<any>>('sdValue');

  isFocused = false;
  #inputControl = new FormControl();
  #formControl = new SdFormControl();
  #matcher!: SdChipCalendarErrorStateMatcher;
  readonly separatorKeysCodes = [ENTER, COMMA];

  constructor() {
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

    effect(() => {
      this.required();
      this.min();
      this.max();
      this.#updateValidator();
    });

    effect(() => {
      const values = this.model();
      if (Array.isArray(values)) {
        this.#formControl.setValue(values);
      }
    });

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

    this.#matcher = new SdChipCalendarErrorStateMatcher(this.#formControl);
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

    if (errors['required']) return 'Vui lÃƒÂ²ng nhÃ¡ÂºÂ­p thÃƒÂ´ng tin';
    if (errors['minlength']) return `Vui lÃƒÂ²ng nhÃ¡ÂºÂ­p ÃƒÂ­t nhÃ¡ÂºÂ¥t ${this.min()} giÃƒÂ¡ trÃ¡Â»â€¹`;
    if (errors['maxlength']) return `Vui lÃƒÂ²ng nhÃ¡ÂºÂ­p tÃ¡Â»â€˜i Ã„â€˜a ${this.max()} giÃƒÂ¡ trÃ¡Â»â€¹`;
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

  #clickChip = (event: Event, item: any) => {
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (!this.#formControl.disabled) {
      this.#focus();
    }
  };

  #remove = (item: string): void => {
    const values: string[] = this.#formControl.value ?? [];
    if (typeof item === 'string') {
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

  #clear = (evt?: any) => {
    evt?.stopPropagation();
    this.#inputControl.setValue('');
    this.#formControl.setValue([]);
    this.modelChange.emit(this.#formControl.value);
    this.sdChange.emit(this.#formControl.value);
    this.#ref.detectChanges();
  };

  #selectDate = (date: Date | null) => {
    const value = DateUtilities.toFormat(date, 'yyyy/MM/dd');
    const values: (string | number)[] = this.#formControl.value ?? [];
    if (value) {
      if (!values.includes(value)) {
        values.push(value);
        this.#formControl.setValue(values);
        this.modelChange.emit(this.#formControl.value);
        this.sdChange.emit(this.#formControl.value);
      } else {
        this.#formControl.setValue(values.filter(date => value !== date));
        this.modelChange.emit(this.#formControl.value);
        this.sdChange.emit(this.#formControl.value);
      }
      this.calendar.updateTodaysDate();
      this.#ref.markForCheck();
    }
  };

  #closeCalendar = () => {
    this.isFocused = false;
    this.input.nativeElement.blur();
  };

  #dateClass = (cellDate: Date) => {
    const dates: string[] = this.#formControl.value || [];
    if (Array.isArray(dates)) {
      const selected = dates.some(date => date === DateUtilities.toFormat(cellDate, 'yyyy/MM/dd'));
      return selected ? 'sd-chip-calendar-selected-date' : '';
    }
    return '';
  };

  onClickChip = (event: Event, item: any) => this.#clickChip(event, item);
  onRemove = (item: string) => this.#remove(item);
  onSelect = (event: MatAutocompleteSelectedEvent) => this.#select(event);
  onClick = () => this.#onClick();
  onClear = (evt?: any) => this.#clear(evt);
  onSelectDate = (date: Date | null) => this.#selectDate(date);
  onCloseCalendar = () => this.#closeCalendar();
  dateClass = (cellDate: Date) => this.#dateClass(cellDate);
}


