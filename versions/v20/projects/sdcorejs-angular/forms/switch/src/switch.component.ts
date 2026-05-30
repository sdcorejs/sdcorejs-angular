/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  OnDestroy,
  OnInit,
  output,
} from '@angular/core';
import { AsyncValidatorFn, FormGroup, FormsModule, NgForm, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import { TranslatePipe } from '@sdcorejs/angular/i18n';
import { SdFormControl, sdFormControlState } from '@sdcorejs/angular/forms/models';
import { sdIsEmpty, sdSerializeDataValue } from '@sdcorejs/angular/utilities/data-state';
import { Color } from '@sdcorejs/utils/models';
import { Subscription } from 'rxjs';
import * as uuid from 'uuid';

@Component({
  selector: 'sd-switch',
  templateUrl: './switch.component.html',
  styleUrl: './switch.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // why: dÃ¹ng host class .sd-c-<x> (thay vÃ¬ data-attr) Ä‘á»ƒ reactivity host-binding vá»›i
    // signal cháº¯c cháº¯n Ã¡p dá»¥ng + cÃ³ default fallback `sd-c-primary` khi color() lÃ  'primary'.
    // Test cÅ© assert data-sd-color Ä‘Ã£ Ä‘Æ°á»£c thay báº±ng class assert tÆ°Æ¡ng á»©ng.
    '[class.sd-c-primary]': "color() === 'primary'",
    '[class.sd-c-secondary]': "color() === 'secondary'",
    '[class.sd-c-info]': "color() === 'info'",
    '[class.sd-c-success]': "color() === 'success'",
    '[class.sd-c-warning]': "color() === 'warning'",
    '[class.sd-c-error]': "color() === 'error'",
  },
  imports: [FormsModule, ReactiveFormsModule, MatSlideToggleModule, MatFormFieldModule, SdLabel, TranslatePipe],
})
export class SdSwitch implements OnInit, AfterViewInit, OnDestroy {
  readonly #ref = inject(ChangeDetectorRef);

  id = `I${uuid.v4()}`;
  #name = uuid.v4();
  #model: boolean | null | undefined = false;
  formControl = new SdFormControl();
  #subscription = new Subscription();

  // Inputs â€” accept null|undefined at boundary, transform to canonical
  readonly autoIdInput = input<string | undefined, string | null | undefined>(undefined, {
    alias: 'autoId',
    transform: (v): string | undefined => v ?? undefined,
  });
  readonly name = input<string | undefined, string | null | undefined>(undefined, {
    transform: (v): string | undefined => v ?? undefined,
  });
  readonly form = input<FormGroup | undefined, any>(undefined, {
    transform: (val: any): FormGroup | undefined => {
      if (!val) return undefined;
      if (val instanceof NgForm) return val.form;
      if (val instanceof FormGroup) return val;
      if (val?.form instanceof FormGroup) return val.form;
      return undefined;
    },
  });
  readonly label = input<string | undefined, string | null | undefined>(undefined, {
    transform: (v): string | undefined => v ?? undefined,
  });
  // why: legacy callers pass `null` to mean "fallback to primary" â€” keep that contract
  readonly color = input<Color, Color | null | undefined>('primary', {
    transform: (v): Color => v || 'primary',
  });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly viewed = input(false, { transform: booleanAttribute });
  readonly hideInlineError = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });

  // Two-way model
  readonly model = model<boolean | null | undefined>(false);

  // Outputs
  readonly sdChange = output<unknown>();

  // Computed (template bindings)
  readonly autoId = computed(() => (this.autoIdInput() ? `forms-switch-${this.autoIdInput()}` : undefined));
  readonly #state = sdFormControlState(computed(() => this.formControl));
  readonly dataDisabled = computed(() => (this.#state().disabled ? 'true' : 'false'));
  readonly dataEmpty = computed(() => (sdIsEmpty(this.#state().value) ? 'true' : 'false'));
  readonly dataValue = computed(() => sdSerializeDataValue(this.#state().value));
  readonly dataRequired = computed(() => (this.required() ? 'true' : 'false'));

  constructor() {
    effect(() => {
      const val = this.name();
      if (val) this.#name = val;
    });

    effect(() => {
      if (this.disabled()) this.formControl.disable();
      else this.formControl.enable();
    });

    effect(() => {
      const value = this.model();
      if (this.#model !== value) {
        this.#model = value;
        this.formControl.setValue(value, { emitEvent: false });
      }
    });

    effect(() => {
      this.required();
      this.#updateValidator();
    });
  }

  ngOnInit() {
    this.#subscription.add(
      this.formControl.sdChanges.subscribe(() => {
        this.#ref.markForCheck();
      })
    );
  }

  ngAfterViewInit() {
    this.#subscription.add(this.formControl.valueChanges.subscribe(this.#onChange));
    this.form()?.addControl(this.#name, this.formControl);
    this.#ref.detectChanges();
  }

  ngOnDestroy() {
    this.form()?.removeControl(this.#name);
    this.#subscription.unsubscribe();
  }

  #onChange = (value: any) => {
    this.#model = value;
    this.model.set(value);
    this.sdChange.emit(value);
  };

  #updateValidator = () => {
    this.formControl.clearValidators();
    this.formControl.clearAsyncValidators();
    const validators: ValidatorFn[] = [];
    const asyncValidators: AsyncValidatorFn[] = [];
    if (this.required()) {
      validators.push(Validators.required);
    }
    this.formControl.setValidators(validators);
    this.formControl.setAsyncValidators(asyncValidators);
    this.formControl.updateValueAndValidity();
  };
}

