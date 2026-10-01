import { ChangeDetectionStrategy, Component, computed, inject, output, signal, viewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdInput, SdSelect } from '@sdcorejs/angular/forms';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import type { Filter } from '@sdcorejs/utils/models';
import type {
  SdFormGenericAlert,
  SdFormGenericPageElement,
  SdFormGenericValidation,
  SdFormGenericVariable,
} from '../../../../models/form-generic-schema.model';
import { sdIsEmptyFilter } from '../../../../rules/form-generic-filter';
import { FormGenericService } from '../../../../services/form-generic.service';
import { AttributeExpression } from '../attribute-expression/attribute-expression.component';

/** Bản nháp trong dialog: validation Filter được phép chưa có điều kiện (bị bỏ khi lưu). */
type DraftValidation =
  | { type: 'filter'; filter?: Filter; message: string; alert: SdFormGenericAlert }
  | { type: 'function'; validator: string; alert: SdFormGenericAlert };

/** Validation cấp form: điều kiện `Filter` kèm câu thông báo, hoặc validator hàm của portal. */
@Component({
  selector: 'configure-validation',
  templateUrl: './configure-validation.component.html',
  styleUrl: './configure-validation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatMenuModule, SdModal, SdButton, SdInput, SdSelect, AttributeExpression, SdTranslatePipe],
})
export class ConfigureValidationComponent {
  readonly #i18n = inject(I18nService);
  readonly #formGeneric = inject(FormGenericService);
  readonly modal = viewChild(SdModal);
  readonly accept = output<SdFormGenericValidation[]>();

  readonly form = new FormGroup({});
  readonly validations = signal<DraftValidation[]>([]);
  readonly elements = signal<readonly SdFormGenericPageElement[]>([]);
  readonly variables = signal<readonly SdFormGenericVariable[]>([]);
  readonly validators = computed(() => this.#formGeneric.validators.map(validator => ({ value: validator.id, display: validator.label })));
  readonly alerts = computed(() => [
    { value: 'error', display: this.#i18n.t('core.component.form-builder.alert.error') },
    { value: 'warning', display: this.#i18n.t('core.component.form-builder.alert.warning') },
  ]);

  open(
    elements: readonly SdFormGenericPageElement[],
    variables: readonly SdFormGenericVariable[],
    validations: readonly SdFormGenericValidation[]
  ): void {
    this.elements.set(elements);
    this.variables.set(variables);
    this.validations.set(structuredClone([...validations]) as DraftValidation[]);
    this.modal()?.open();
  }

  add(type: DraftValidation['type']): void {
    const next: DraftValidation = type === 'filter' ? { type, alert: 'error', message: '' } : { type, alert: 'error', validator: '' };
    this.validations.set([...this.validations(), next]);
  }

  remove(index: number): void {
    this.validations.set(this.validations().filter((_, position) => position !== index));
  }

  patch(index: number, patch: Partial<DraftValidation>): void {
    this.validations.set(
      this.validations().map((validation, position) => (position === index ? ({ ...validation, ...patch } as DraftValidation) : validation))
    );
  }

  save(): void {
    // why: a filter validation whose condition holds but has no message would make validate() fail with
    // nothing to show — keep the dialog open and flag the required message instead of saving it.
    const missingMessage = this.validations().some(
      validation => validation.type === 'filter' && !sdIsEmptyFilter(validation.filter) && !validation.message?.trim()
    );
    if (missingMessage) {
      this.form.markAllAsTouched();
      return;
    }
    const complete = this.validations().filter(validation =>
      validation.type === 'filter' ? !sdIsEmptyFilter(validation.filter) : !!validation.validator
    ) as SdFormGenericValidation[];
    this.accept.emit(complete);
    this.modal()?.close();
  }
}
