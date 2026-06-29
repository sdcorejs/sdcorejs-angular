import { Utilities } from '@sdcorejs/utils/fns';

import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  OnDestroy,
  OnInit,
  output,
} from '@angular/core';
import { FormGroup, NgForm, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';

import { SdLabelDefDirective, SdSuffixDefDirective, SdViewDefDirective } from '@sdcorejs/angular/forms/directives';

import {
  SdFormControl,
  SdInlineErrorValidator,
  sdFormControlState,
  SdViewed,
  SdViewedInput,
  sdViewedInline,
  sdViewedTransform,
} from '@sdcorejs/angular/forms/models';
import { sdIsEmpty, sdSerializeDataValue } from '@sdcorejs/angular/utilities/data-state';
import { Color } from '@sdcorejs/utils/models';
import { TranslatePipe } from '@sdcorejs/angular/i18n';
import { SdEmptyPipe } from '@sdcorejs/angular/pipes';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import { SdHrefDirective } from '@sdcorejs/angular/directives';

@Component({
  selector: 'sd-radio',
  templateUrl: './radio.component.html',
  styleUrl: './radio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatIconModule,
    MatRadioModule,
    SdLabel,
    SdEmptyPipe,
    SdHrefDirective,
    TranslatePipe,
  ],
})
export class SdRadio implements OnInit, AfterViewInit, OnDestroy {
  readonly #ref = inject(ChangeDetectorRef);

  id = `I${Utilities.generateUuid()}`;
  #name = Utilities.generateUuid();
  formControl = new SdFormControl();
  #subscription = new Subscription();

  // Inputs — accept null|undefined at boundary, transform to canonical
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
  readonly placeholder = input<string | undefined, string | null | undefined>(undefined, {
    transform: (v): string | undefined => v ?? undefined,
  });
  readonly display = input<'row' | 'column', 'row' | 'column' | null | undefined>('row', {
    transform: (v): 'row' | 'column' => v || 'row',
  });
  readonly items = input<any[], any[] | null | undefined>([], {
    transform: (v): any[] => (Array.isArray(v) ? v : []),
  });
  readonly valueField = input.required<string>();
  readonly displayField = input.required<string>();
  readonly required = input(false, { transform: booleanAttribute });
  readonly inlineError = input<string | undefined, string | null | undefined>(undefined, {
    transform: (v): string | undefined => v ?? undefined,
  });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Display mode: `false` edit · `true` static view · `'inline'` interactive (disabled `'inline'` → static). */
  readonly viewed = input<SdViewed, SdViewedInput>(false, { transform: sdViewedTransform });

  // why: tri-state viewed — `'inline'` keeps the radio group interactive; disabled `'inline'` → static.
  readonly #viewedState = sdViewedInline(this.viewed, undefined, this.disabled);
  /** `true` when the static read-only view should render. */
  readonly isViewed = this.#viewedState.isViewed;
  // why: legacy callers pass `null` → fallback to 'primary'. Color enum mở rộng hơn ThemePalette,
  // áp dụng qua host attr [data-sd-color] + SCSS override MDC token vars (mat [color] không nhận 'success'/'info'/...).
  readonly color = input<Color, Color | null | undefined>('primary', {
    transform: (v): Color => v || 'primary',
  });
  readonly hyperlink = input<string | undefined, string | null | undefined>(undefined, {
    transform: (v): string | undefined => v ?? undefined,
  });

  // Two-way model
  readonly model = model<number | string | boolean | undefined | null>(undefined);

  // Content children
  readonly sdSuffixDef = contentChild(SdSuffixDefDirective);
  readonly sdLabelDef = contentChild(SdLabelDefDirective);
  readonly sdViewDef = contentChild(SdViewDefDirective);

  // Outputs (modelChange auto-generated by model() signal)
  readonly sdChange = output<unknown>();
  readonly sdSelection = output<{ value: any | any[]; item?: any }>();

  // Computed (template bindings)
  readonly autoId = computed(() => (this.autoIdInput() ? `forms-radio-${this.autoIdInput()}` : undefined));
  // Kept for back-compat with templates that read `normalizedItems()` — alias of items()
  readonly normalizedItems = computed(() => this.items());
  readonly #state = sdFormControlState(computed(() => this.formControl));
  readonly dataDisabled = computed(() => (this.#state().disabled ? 'true' : 'false'));
  readonly dataEmpty = computed(() => (sdIsEmpty(this.#state().value) ? 'true' : 'false'));
  readonly dataValue = computed(() => sdSerializeDataValue(this.#state().value));
  readonly dataRequired = computed(() => (this.required() ? 'true' : 'false'));

  readonly viewedText = computed(() => {
    const items = this.items();
    const vField = this.valueField();
    const dField = this.displayField();
    // why: tìm item match value rồi trả về string ở `displayField`, không trả nguyên object (sẽ in [object Object]).
    const match = items.find(e => this.formControl?.value?.toString() === e?.[vField]?.toString());
    return match?.[dField] ?? '';
  });

  constructor() {
    effect(() => {
      const val = this.name();
      if (val) this.#name = val;
    });

    effect(() => {
      const value = this.model();
      if (value !== this.formControl.value) {
        this.formControl.setValue(value, { emitEvent: false });
      }
    });

    effect(() => {
      if (this.disabled()) this.formControl.disable();
      else this.formControl.enable();
    });

    effect(() => {
      this.required();
      this.inlineError();
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
    this.#subscription.add(
      this.formControl.valueChanges.subscribe(value => {
        const vField = this.valueField();
        this.model.set(value);
        this.sdChange.emit(value);
        this.sdSelection.emit({
          value,
          item: this.items().find(e => value?.toString() === e?.[vField]?.toString()),
        });
      })
    );
    this.form()?.addControl(this.#name, this.formControl);
  }

  ngOnDestroy() {
    this.#subscription.unsubscribe();
    this.form()?.removeControl(this.#name);
  }

  #updateValidator = () => {
    this.formControl.clearValidators();
    const validators: ValidatorFn[] = [];
    if (this.required()) {
      validators.push(Validators.required);
    }
    if (this.inlineError()) {
      validators.push(SdInlineErrorValidator);
    }
    this.formControl.setValidators(validators);
    this.formControl.updateValueAndValidity();
  };

  reValidate = () => {
    this.formControl.updateValueAndValidity({ emitEvent: true });
  };
}
