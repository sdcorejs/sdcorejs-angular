import { Utilities } from '@sdcorejs/utils/fns';

import {
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  input,
  model,
  OnDestroy,
  OnInit,
  output,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import { TranslatePipe } from '@sdcorejs/angular/i18n';
import {
  SdFormControl,
  sdFormControlState,
  SdViewed,
  SdViewedInput,
  sdViewedInline,
  sdViewedTransform,
  ɵsdFormControlConnector,
  ɵSdFormControlParent,
} from '@sdcorejs/angular/forms/models';
import { sdIsEmpty, sdSerializeDataValue } from '@sdcorejs/angular/utilities/data-state';
import { Color } from '@sdcorejs/utils/models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'sd-switch',
  templateUrl: './switch.component.html',
  styleUrl: './switch.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // why: dùng host class .sd-c-<x> (thay vì data-attr) để reactivity host-binding với
    // signal chắc chắn áp dụng + có default fallback `sd-c-primary` khi color() là 'primary'.
    // Test cũ assert data-sd-color đã được thay bằng class assert tương ứng.
    '[class.sd-c-primary]': "color() === 'primary'",
    '[class.sd-c-secondary]': "color() === 'secondary'",
    '[class.sd-c-info]': "color() === 'info'",
    '[class.sd-c-success]': "color() === 'success'",
    '[class.sd-c-warning]': "color() === 'warning'",
    '[class.sd-c-error]': "color() === 'error'",
  },
  imports: [FormsModule, ReactiveFormsModule, MatSlideToggleModule, MatFormFieldModule, SdLabel, TranslatePipe],
})
export class SdSwitch implements OnInit, OnDestroy {
  readonly #ref = inject(ChangeDetectorRef);

  id = `I${Utilities.generateUuid()}`;
  readonly #defaultName = Utilities.generateUuid();
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
  readonly form = input<ɵSdFormControlParent>(undefined);
  readonly label = input<string | undefined, string | null | undefined>(undefined, {
    transform: (v): string | undefined => v ?? undefined,
  });
  // why: legacy callers pass `null` to mean "fallback to primary" — keep that contract
  readonly color = input<Color, Color | null | undefined>('primary', {
    transform: (v): Color => v || 'primary',
  });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Display mode: `false` edit · `true` static view · `'inline'` interactive (disabled `'inline'` → static). */
  readonly viewed = input<SdViewed, SdViewedInput>(false, { transform: sdViewedTransform });

  // why: tri-state viewed — `'inline'` keeps the switch interactive; disabled `'inline'` → static.
  readonly #viewedState = sdViewedInline(this.viewed, undefined, this.disabled);
  /** `true` when the static read-only view should render. */
  readonly isViewed = this.#viewedState.isViewed;
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

  readonly #formConnector = ɵsdFormControlConnector<boolean | null | undefined, boolean | null | undefined>({
    form: this.form,
    name: computed(() => this.name() || this.#defaultName),
    control: computed(() => this.formControl),
    model: this.model,
    writeModel: value => {
      this.model.set(value);
      this.sdChange.emit(value);
    },
    validators: computed(() => (this.required() ? Validators.required : null)),
    disabled: this.disabled,
    controlEquals: (controlValue, modelValue) => (controlValue === null && modelValue === false) || Object.is(controlValue, modelValue),
  });

  ngOnInit() {
    this.#subscription.add(
      this.formControl.sdChanges.subscribe(() => {
        this.#ref.markForCheck();
      })
    );
  }

  ngOnDestroy() {
    this.#subscription.unsubscribe();
  }
}
