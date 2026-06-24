import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  booleanAttribute,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  OnDestroy,
  output,
} from '@angular/core';
import { Utilities } from '@sdcorejs/utils/fns';
import { FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { sdIsEmpty, sdSerializeDataValue } from '@sdcorejs/angular/utilities/data-state';
import {
  sdFormControlState,
  SdInlineErrorValidator,
  SdViewed,
  SdViewedInput,
  sdViewedInline,
  sdViewedTransform,
} from '@sdcorejs/angular/forms/models';
import { Color } from '@sdcorejs/utils/models';
import { TranslatePipe } from '@sdcorejs/angular/i18n';
import { Subscription } from 'rxjs';

@Component({
  selector: 'sd-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss',
  standalone: true,
  host: {
    // why: host class .sd-c-<x> + default sd-c-primary cho fallback. Thay data-sd-color
    // để tránh edge case host-attr-binding không reactive trong vài cảnh build pipeline.
    '[class.sd-c-primary]': "color() === 'primary'",
    '[class.sd-c-secondary]': "color() === 'secondary'",
    '[class.sd-c-info]': "color() === 'info'",
    '[class.sd-c-success]': "color() === 'success'",
    '[class.sd-c-warning]': "color() === 'warning'",
    '[class.sd-c-error]': "color() === 'error'",
  },
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatCheckboxModule, TranslatePipe],
})
export class SdCheckbox implements OnDestroy, AfterViewInit {
  readonly #ref = inject(ChangeDetectorRef);

  id = `I${Utilities.generateUuid()}`;
  #name = Utilities.generateUuid();
  formControl = new FormControl();
  #subscription = new Subscription();
  #model: unknown;

  // Inputs — all accept null|undefined at the boundary, transform to canonical shape
  readonly autoIdInput = input<string | undefined, string | null | undefined>(undefined, {
    alias: 'autoId',
    transform: (v): string | undefined => v ?? undefined,
  });
  readonly name = input<string | undefined, string | null | undefined>(undefined, {
    transform: (v): string | undefined => v ?? undefined,
  });
  // why: parent may bind NgForm (template-driven), FormGroup (reactive), or a wrapper with `.form`.
  // Transform once at the input boundary so the rest of the component only deals with FormGroup.
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
  // why: full Color enum, áp dụng qua [data-sd-color] + SCSS override MDC vars.
  readonly color = input<Color, Color | null | undefined>('primary', {
    transform: (v): Color => v || 'primary',
  });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Display mode: `false` edit · `true` static view · `'inline'` interactive (disabled `'inline'` → static). */
  readonly viewed = input<SdViewed, SdViewedInput>(false, { transform: sdViewedTransform });

  // why: tri-state viewed — `'inline'` keeps the checkbox interactive; disabled `'inline'` → static.
  readonly #viewedState = sdViewedInline(this.viewed, undefined, this.disabled);
  /** `true` when the static read-only view should render. */
  readonly isViewed = this.#viewedState.isViewed;
  readonly inlineError = input<string, string | null | undefined>('', {
    transform: (v): string => v ?? '',
  });

  // Two-way model
  readonly model = model<unknown>(undefined);

  // Outputs (sdChange is in addition to auto-generated modelChange from `model` signal)
  readonly sdChange = output<unknown>();

  // Computed (template bindings)
  readonly autoId = computed(() => (this.autoIdInput() ? `forms-checkbox-${this.autoIdInput()}` : undefined));
  readonly #state = sdFormControlState(computed(() => this.formControl));
  readonly dataDisabled = computed(() => (this.#state().disabled ? 'true' : 'false'));
  readonly dataEmpty = computed(() => (sdIsEmpty(this.#state().value) ? 'true' : 'false'));
  readonly dataValue = computed(() => sdSerializeDataValue(this.#state().value));

  constructor() {
    // why: external [name] override falls back to generated uuid only when truthy
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
      // touch dependency so validator re-attaches when inlineError changes
      this.inlineError();
      this.#updateValidator();
    });
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

  #onChange = (value: unknown) => {
    this.#model = value;
    this.model.set(value);
    this.sdChange.emit(value);
  };

  #updateValidator = () => {
    this.formControl.clearValidators();
    const validators: ValidatorFn[] = [];

    if (this.inlineError()) {
      validators.push(SdInlineErrorValidator);
    }
    this.formControl.setValidators(validators);
    this.formControl.updateValueAndValidity();
  };
}
