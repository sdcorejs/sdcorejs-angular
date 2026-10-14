import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdTime } from '@sdcorejs/angular/forms/time';
import type { SdFormGenericTime } from '../../../../../../models/form-generic-field.model';
import { sdIsTimeValue } from '../../../../../../rules/form-generic-validation';
import { FormRenderContext } from '../../../../form-render.context';

@Component({
  selector: 'lib-time',
  templateUrl: './time.component.html',
  styleUrl: './time.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdTime],
})
export class TimeComponent {
  readonly field = input.required<SdFormGenericTime>();
  readonly form = input.required<FormGroup>();
  readonly disabled = input(false);
  readonly required = input(false);

  readonly #context = inject(FormRenderContext);
  readonly viewed = computed(() => this.#context.viewed() || !!this.field().viewed);
  readonly value = computed(() => this.#context.value()[this.field().key] as string | null | undefined);
  // why: a viewed field is not validated (see LibItemComponent); only canonical HH:mm boundaries reach sd-time.
  readonly min = computed(() => (this.viewed() ? undefined : this.#boundary(this.field().validation?.min)));
  readonly max = computed(() => (this.viewed() ? undefined : this.#boundary(this.field().validation?.max)));

  setValue(value: unknown): void {
    this.#context.patch({ [this.field().key]: value });
  }

  #boundary(value: unknown): string | undefined {
    return sdIsTimeValue(value) ? value : undefined;
  }
}
