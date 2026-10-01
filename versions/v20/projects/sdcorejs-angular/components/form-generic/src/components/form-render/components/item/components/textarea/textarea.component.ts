import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';
import type { SdFormGenericTextarea } from '../../../../../../models/form-generic-field.model';
import { FormRenderContext } from '../../../../form-render.context';

@Component({
  selector: 'lib-textarea',
  templateUrl: './textarea.component.html',
  styleUrl: './textarea.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdTextarea],
})
export class TextareaComponent {
  readonly field = input.required<SdFormGenericTextarea>();
  readonly form = input.required<FormGroup>();
  readonly disabled = input(false);
  readonly required = input(false);

  readonly #context = inject(FormRenderContext);
  readonly labelPlacement = this.#context.labelPlacement;
  readonly viewed = computed(() => this.#context.viewed() || !!this.field().viewed);
  readonly value = computed(() => this.#context.value()[this.field().key] as string | null | undefined);

  setValue(value: unknown): void {
    this.#context.patch({ [this.field().key]: value });
  }
}
