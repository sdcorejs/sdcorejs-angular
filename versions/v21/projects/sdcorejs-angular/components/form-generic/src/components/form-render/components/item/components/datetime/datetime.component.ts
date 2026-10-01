import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdDate } from '@sdcorejs/angular/forms/date';
import { SdDatetime } from '@sdcorejs/angular/forms/datetime';
import type { SdFormGenericDatetime } from '../../../../../../models/form-generic-field.model';
import { FormRenderContext } from '../../../../form-render.context';

/**
 * Giới hạn min/max cho control. `'today'` của schema: với ngày là `'TODAY'` của sd-date; với ngày giờ
 * là ĐẦU ngày (min) hoặc CUỐI ngày (max) hôm nay. why: `'TODAY'` của sd-datetime là thời điểm control
 * render, nên `max: 'today'` chặn mọi giờ muộn hơn trong chính hôm nay. Ngày ISO giữ nguyên.
 */
const boundary = (value: unknown, subtype: 'date' | 'datetime', edge: 'min' | 'max'): string | undefined => {
  if (value === 'today') {
    if (subtype === 'date') return 'TODAY';
    const today = new Date();
    if (edge === 'min') today.setHours(0, 0, 0, 0);
    else today.setHours(23, 59, 59, 999);
    return today.toISOString();
  }
  return typeof value === 'string' && value !== '' ? value : undefined;
};

@Component({
  selector: 'lib-datetime',
  templateUrl: './datetime.component.html',
  styleUrl: './datetime.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdDate, SdDatetime],
})
export class DatetimeComponent {
  readonly field = input.required<SdFormGenericDatetime>();
  readonly form = input.required<FormGroup>();
  readonly disabled = input(false);
  readonly required = input(false);

  readonly #context = inject(FormRenderContext);
  readonly labelPlacement = this.#context.labelPlacement;
  readonly viewed = computed(() => this.#context.viewed() || !!this.field().viewed);
  readonly value = computed(() => this.#context.value()[this.field().key] as string | null | undefined);
  readonly subtype = computed(() => this.field().subtype || 'date');
  // why: a viewed field is not validated (see LibItemComponent), so it gets no min/max either.
  readonly min = computed(() => (this.viewed() ? undefined : boundary(this.field().validation?.min, this.subtype(), 'min')));
  readonly max = computed(() => (this.viewed() ? undefined : boundary(this.field().validation?.max, this.subtype(), 'max')));

  setValue(value: unknown): void {
    this.#context.patch({ [this.field().key]: value });
  }
}
