import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdSuffixDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdCustomValidator } from '@sdcorejs/angular/forms/models';
import { I18nService } from '@sdcorejs/angular/i18n';
import type { SdFormGenericNumber } from '../../../../../../models/form-generic-field.model';
import { ComponentViewedPipe } from '../../../../../../pipes';
import { sdNumberPrecision, sdNumberSubtype, sdNumberSuffix, sdValidateNumberPreset } from '../../../../../../presets/form-generic-presets';
import { SD_FORM_GENERIC_DEFAULT_PRECISION } from '../../../../../../rules/form-generic-display';
import { FormRenderContext } from '../../../../form-render.context';

@Component({
  selector: 'lib-number',
  templateUrl: './number.component.html',
  styleUrl: './number.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdInputNumber, SdSuffixDefDirective, SdView, ComponentViewedPipe],
})
export class NumberComponent {
  readonly field = input.required<SdFormGenericNumber>();
  readonly form = input.required<FormGroup>();
  readonly disabled = input(false);
  readonly required = input(false);

  readonly #context = inject(FormRenderContext);
  readonly #i18n = inject(I18nService);

  readonly labelPlacement = this.#context.labelPlacement;
  readonly viewed = computed(() => this.#context.viewed() || !!this.field().viewed);
  readonly value = computed(() => this.#context.value()[this.field().key] as number | null | undefined);
  /** Số chữ số thập phân — cùng mặc định với chế độ xem (`sdDisplayValue`). */
  readonly precision = computed(() => sdNumberPrecision(this.field()) ?? SD_FORM_GENERIC_DEFAULT_PRECISION);
  readonly suffix = computed(() => sdNumberSuffix(this.field()));
  readonly min = computed(() => (typeof this.field().validation?.min === 'number' ? (this.field().validation?.min as number) : undefined));
  readonly max = computed(() => (typeof this.field().validation?.max === 'number' ? (this.field().validation?.max as number) : undefined));
  /** Bàn phím số trên mobile chỉ khi preset biết chắc không có số âm. */
  readonly inputmode = computed(() => {
    const min = this.min();
    if (!sdNumberSubtype(this.field()) || min === undefined || min < 0) return undefined;
    return this.precision() === 0 ? 'numeric' : 'decimal';
  });

  readonly presetValidator: SdCustomValidator = value => {
    const error = sdValidateNumberPreset(this.field(), value);
    return error ? this.#i18n.t(error.key, error.params) : '';
  };
  readonly effectiveValidator = computed<SdCustomValidator | undefined>(() =>
    sdNumberSubtype(this.field()) ? this.presetValidator : undefined
  );

  setValue(value: unknown): void {
    this.#context.patch({ [this.field().key]: value });
  }
}
