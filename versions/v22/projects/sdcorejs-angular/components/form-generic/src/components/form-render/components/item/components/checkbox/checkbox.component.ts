import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdCheckbox } from '@sdcorejs/angular/forms/checkbox';
import type { SdFormGenericCheckbox } from '../../../../../../models/form-generic-field.model';
import { FormRenderContext } from '../../../../form-render.context';

@Component({
  selector: 'lib-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdCheckbox],
})
export class CheckboxComponent {
  readonly field = input.required<SdFormGenericCheckbox>();
  readonly form = input.required<FormGroup>();
  readonly disabled = input(false);
  readonly required = input(false);

  readonly #context = inject(FormRenderContext);
  readonly viewed = computed(() => this.#context.viewed() || !!this.field().viewed);
  readonly value = computed(() => this.#context.value()[this.field().key] as boolean | null | undefined);

  setValue(value: unknown): void {
    this.#context.patch({ [this.field().key]: value });
  }
}
