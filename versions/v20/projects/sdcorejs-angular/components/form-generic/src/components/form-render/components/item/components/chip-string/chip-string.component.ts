import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdChip } from '@sdcorejs/angular/forms';
import type { SdFormGenericChipString } from '../../../../../../models/form-generic-field.model';
import { ComponentViewedPipe } from '../../../../../../pipes';
import { FormRenderContext } from '../../../../form-render.context';

@Component({
  selector: 'lib-chip-string',
  templateUrl: './chip-string.component.html',
  styleUrl: './chip-string.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdChip, SdView, ComponentViewedPipe],
})
export class ChipStringComponent {
  readonly field = input.required<SdFormGenericChipString>();
  readonly form = input.required<FormGroup>();
  readonly disabled = input(false);
  readonly required = input(false);

  readonly #context = inject(FormRenderContext);
  readonly labelPlacement = this.#context.labelPlacement;
  readonly viewed = computed(() => this.#context.viewed() || !!this.field().viewed);
  readonly value = computed(() => this.#context.value()[this.field().key] as string[] | null | undefined);

  setValue(value: unknown): void {
    this.#context.patch({ [this.field().key]: value });
  }
}
