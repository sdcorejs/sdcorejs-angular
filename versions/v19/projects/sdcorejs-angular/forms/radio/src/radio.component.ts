/* eslint-disable @angular-eslint/no-input-rename */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  ContentChild,
  EventEmitter,
  Input,
  input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormGroup, NgForm, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import * as uuid from 'uuid';

import { SdLabelDefDirective, SdSuffixDefDirective, SdViewDefDirective } from '@sdcorejs/angular/forms/directives';

import { SdFormControl } from '@sdcorejs/angular/forms/models';
import { TranslatePipe } from '@sdcorejs/angular/i18n';
import { SdEmptyPipe } from '@sdcorejs/angular/pipes';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import { SdHrefDirective } from "@sdcorejs/angular/directives";

@Component({
  selector: 'sd-radio',
  templateUrl: './radio.component.html',
  styleUrls: ['./radio.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTooltipModule, MatFormFieldModule, MatIconModule, MatRadioModule, SdLabel, SdEmptyPipe, SdHrefDirective, TranslatePipe],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class SdRadio implements OnInit, AfterViewInit, OnDestroy {
  id = `I${uuid.v4()}`;
  readonly autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  readonly autoId = computed(() => (this.autoIdInput() ? `forms-radio-${this.autoIdInput()}` : undefined));

  #name = uuid.v4();
  @Input() set name(val: string | undefined) {
    if (val) {
      this.#name = val;
    }
  }
  formControl = new SdFormControl();
  // get isNumber() {
  //   if (this.#model || this.#model === 0) {
  //     return typeof (this.#model) === 'number';
  //   }
  //   if (this.items?.length) {
  //     if (this.valueField) {
  //       return typeof (this.items[0][this.valueField]) === 'number';
  //     } else {
  //       return typeof (this.items[0]) === 'number';
  //     }
  //   }
  //   return false;
  // }
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
  @Input() label?: string;
  @Input() placeholder?: string;
  display: 'row' | 'column' = 'row';
  @Input('display') set _display(display: 'row' | 'column' | undefined | null) {
    this.display = display || 'row';
  }
  // Model
  @Input() set model(value: number | string | boolean) {
    if (value !== this.formControl.value) {
      this.formControl.setValue(value, {
        emitEvent: false,
      });
    }
  }
  // Items
  items: any[] = [];
  @Input('items') set pItems(items: any[] | undefined) {
    if (!Array.isArray(items)) {
      this.items = [];
    } else {
      this.items = items;
    }
  }
  @Input({ required: true }) valueField!: string;
  @Input({ required: true }) displayField!: string;

  // Validator
  required = false;
  @Input('required') set _required(val: boolean | '' | undefined | null) {
    this.required = val === '' || !!val;
    this.#updateValidator();
  }

  inlineError?: string;
  @Input('inlineError') set _inlineError(val: string) {
    this.inlineError = val;
    this.#updateValidator();
  }

  // Optional
  @Input() set disabled(val: boolean | '' | undefined | null) {
    val = val === '' || val;
    if (val) {
      this.formControl.disable();
    } else {
      this.formControl.enable();
    }
  }

  viewed = false;
  @Input('viewed') set _viewed(val: boolean | '' | undefined | null) {
    this.viewed = val === '' || !!val;
  }
  @Input() hyperlink?: string | null;

  @ContentChild(SdSuffixDefDirective) sdSuffixDef?: SdSuffixDefDirective;
  @ContentChild(SdLabelDefDirective) sdLabelDef?: SdLabelDefDirective;
  @ContentChild(SdViewDefDirective) sdViewDef?: SdViewDefDirective;

  @Output() modelChange = new EventEmitter();
  @Output() sdChange = new EventEmitter();
  @Output() sdSelection = new EventEmitter<{
    value: any | any[];
    item?: any;
  }>();
  #subscription = new Subscription();
  constructor(public ref: ChangeDetectorRef) {}

  get viewedText() {
    return this.items?.find(e => this.formControl?.value?.toString() === e?.[this.valueField]?.toString()) ?? '';
  }

  ngOnInit() {
    this.#subscription.add(
      this.formControl.sdChanges.subscribe(() => {
        // this.formControl.updateValueAndValidity();
        this.ref.markForCheck();
      })
    );
  }

  ngAfterViewInit() {
    this.#subscription.add(
      this.formControl.valueChanges.subscribe(value => {
        const val = value;
        // if (this.isNumber && Number.isNumber(value)) {
        //   val = +value;
        // }
        this.modelChange.emit(val);
        this.sdChange.emit(val);
        this.sdSelection.emit({
          value: val,
          item: this.items?.find(e => val?.toString() === e?.[this.valueField]?.toString()),
        });
      })
    );
    this.#form?.addControl(this.#name, this.formControl);
  }

  ngOnDestroy() {
    this.#subscription.unsubscribe();
    this.#form?.removeControl(this.#name);
  }

  #updateValidator = () => {
    this.formControl.clearValidators();
    const validators: ValidatorFn[] = [];
    if (this.required) {
      validators.push(Validators.required);
    }
    if (this.inlineError) {
      validators.push(this.customInlineErrorValidator());
    }
    this.formControl.setValidators(validators);
    this.formControl.updateValueAndValidity();
  };

  // HÃ m táº¡o Validators tÃ¹y chá»‰nh cho inlineError
  customInlineErrorValidator(): ValidatorFn {
    return (): Record<string, any> | null => {
      return { inlineError: true };
    };
  }

  reValidate = () => {
    this.formControl.updateValueAndValidity({ emitEvent: true });
  };
}

