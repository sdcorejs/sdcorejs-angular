import { CommonModule } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { Utilities } from '@sdcorejs/utils/fns';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
  ɵsdFormControlConnector,
  ɵSdFormControlParent,
} from '@sdcorejs/angular/forms/models';
import { Color } from '@sdcorejs/utils/models';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';

@Component({
  selector: 'sd-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss',
  standalone: true,
  // why: component 100% signal-driven (input()/model()/computed() + sdFormControlState) nên mọi
  // thay đổi đều tự mark view dirty. Thiếu OnPush khiến subtree bị dirty-check mỗi tick CD của
  // toàn app — vô ích, và lệch với mọi control khác trong forms/**.
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatCheckboxModule, SdTranslatePipe],
})
export class SdCheckbox {
  id = `I${Utilities.generateUuid()}`;
  readonly #defaultName = Utilities.generateUuid();
  formControl = new FormControl();

  // Inputs — all accept null|undefined at the boundary, transform to canonical shape
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

  readonly #formConnector = ɵsdFormControlConnector<unknown, unknown>({
    form: this.form,
    name: computed(() => this.name() || this.#defaultName),
    control: computed(() => this.formControl),
    model: this.model,
    writeModel: value => {
      this.model.set(value);
      this.sdChange.emit(value);
    },
    validators: computed(() => (this.inlineError() ? SdInlineErrorValidator : null)),
    disabled: this.disabled,
    controlEquals: (controlValue, modelValue) =>
      ((controlValue === null || controlValue === undefined) && (modelValue === null || modelValue === undefined)) ||
      Object.is(controlValue, modelValue),
  });
}
