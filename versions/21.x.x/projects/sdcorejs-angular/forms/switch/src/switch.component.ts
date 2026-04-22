/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @angular-eslint/no-input-rename */
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { AsyncValidatorFn, FormGroup, FormsModule, NgForm, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import { SdFormControl } from '@sdcorejs/angular/forms/models';
import { SdColor, SdSize } from '@sdcorejs/angular/utilities/models';
import { Subscription } from 'rxjs';
import * as uuid from 'uuid';

@Component({
  selector: 'sd-switch',
  templateUrl: './switch.component.html',
  styleUrl: './switch.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ReactiveFormsModule, MatSlideToggleModule, MatFormFieldModule, SdLabel],
})
export class SdSwitch implements OnInit, AfterViewInit, OnDestroy {
  id = `I${uuid.v4()}`;
  autoId?: string;
  @Input('autoId') set _autoId(val: string | undefined | null) {
    if (!val) {
      return;
    }
    this.autoId = `forms-switch-${val}`;
  }
  #name = uuid.v4();
  @Input('name') set _name(val: string | undefined) {
    if (val) {
      this.#name = val;
    }
  }
  @Input() size: SdSize = 'md';
  #form?: FormGroup;
  @Input() set form(val: NgForm | FormGroup | undefined | null) {
    if (val) {
      if (val instanceof NgForm) {
        this.#form = val.form;
      } else {
        this.#form = val;
      }
    }
  }
  label?: string;
  @Input('label') set _label(val: string | undefined) {
    this.label = val;
  }
  color?: SdColor;
  @Input('color') set _color(val: SdColor | undefined | null) {
    this.color = val || 'primary';
  }
  @Input() set disabled(val: boolean | '' | undefined | null) {
    val = val === '' || !!val;
    if (val) {
      this.formControl.disable();
    } else {
      this.formControl.enable();
    }
  }
  #model?: boolean | null = false;
  @Input() set model(value: boolean | undefined | null) {
    if (this.#model !== value) {
      this.#model = value;
      this.formControl.setValue(value, {
        emitEvent: false,
      });
    }
  }
  @Output() modelChange = new EventEmitter();

  hideInlineError = false;
  @Input('hideInlineError') set _hideInlineError(val: boolean | '') {
    this.hideInlineError = val === '' || val;
  }
  required = false;
  @Input('required') set _required(val: boolean | '' | undefined | null) {
    this.required = val === '' || !!val;
    this.#updateValidator();
  }

  @Output() sdChange = new EventEmitter();
  formControl = new SdFormControl();
  #subscription = new Subscription();
  constructor(private ref: ChangeDetectorRef) {}

  ngOnInit() {
    this.#subscription.add(
      this.formControl.sdChanges.subscribe(() => {
        this.ref.markForCheck();
      })
    );
  }

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
    this.formControl.clearAsyncValidators();
    const validators: ValidatorFn[] = [];
    const asyncValidators: AsyncValidatorFn[] = [];
    if (this.required) {
      validators.push(Validators.required);
    }
    this.formControl.setValidators(validators);
    this.formControl.setAsyncValidators(asyncValidators);
    this.formControl.updateValueAndValidity();
  };
}

