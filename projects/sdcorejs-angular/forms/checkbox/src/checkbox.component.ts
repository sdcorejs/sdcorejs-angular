import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Subscription } from 'rxjs';
import * as uuid from 'uuid';

@Component({
  selector: 'sd-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatCheckboxModule],
})
export class SdCheckbox implements OnDestroy, OnInit, AfterViewInit {
  id = `I${uuid.v4()}`;
  #name = uuid.v4();

  autoId?: string;
  @Input('autoId') set _autoId(val: string | undefined | null) {
    if (val) {
      this.autoId = `forms-checkbox-${val}`;
    }
  }
  @Input() set name(val: string) {
    if (val) {
      this.#name = val;
    }
  }
  #form?: FormGroup;
  @Input() set form(val: NgForm | FormGroup) {
    if (val) {
      if (val instanceof NgForm) {
        this.#form = val.form;
      } else {
        this.#form = val;
      }
    }
  }
  formControl = new FormControl();
  #subscription = new Subscription();
  @Input() label?: string;
  @Input() color: 'primary' | 'warn' = 'primary';
  @Input() set disabled(val: boolean | '' | undefined | null) {
    val = val === '' || !!val;
    if (val) {
      this.formControl.disable();
    } else {
      this.formControl.enable();
    }
  }
  #model: any;
  @Input() set model(value: any) {
    if (this.#model !== value) {
      this.#model = value;
      this.formControl.setValue(value, {
        emitEvent: false,
      });
    }
  }
  inlineError?: string;
  @Input('inlineError') set _inlineError(val: string) {
    this.inlineError = val;
    this.#updateValidator();
  }

  @Output() modelChange = new EventEmitter();
  @Output() sdChange = new EventEmitter<any>();
  constructor(private ref: ChangeDetectorRef) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.#subscription.add(this.formControl.valueChanges.subscribe(this.#onChange));
    this.#form?.addControl(this.#name, this.formControl);
    this.ref.detectChanges();
  }

  ngOnDestroy() {
    this.#form?.removeControl(this.#name);
    this.#subscription.unsubscribe();
  }

  #onChange = (value: any) => {
    this.modelChange.emit(value);
    this.sdChange.emit(value);
  };
  #updateValidator = () => {
    this.formControl.clearValidators();
    const validators: ValidatorFn[] = [];

    if (this.inlineError) {
      validators.push(this.customInlineErrorValidator());
    }
    this.formControl.setValidators(validators);
    this.formControl.updateValueAndValidity();
  };
  // Hàm tạo Validators tùy chỉnh cho inlineError
  customInlineErrorValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      return { inlineError: true };
    };
  }
}
