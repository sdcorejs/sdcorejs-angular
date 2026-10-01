import { inject, Pipe, PipeTransform } from '@angular/core';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import type { SdFormGenericField } from '../models/form-generic-field.model';
import { sdDisplayValue } from '../rules/form-generic-display';

/** Chuỗi hiển thị của giá trị field ở chế độ chỉ xem (cùng định dạng với `viewEntities`). */
@Pipe({
  name: 'componentViewed',
  standalone: true,
})
export class ComponentViewedPipe implements PipeTransform {
  readonly #core = inject(SD_CORE_CONFIGURATION, { optional: true });

  transform(value: unknown, field: SdFormGenericField, labels?: Readonly<Record<string, string>>): string {
    return sdDisplayValue(field, value, { labels, numberFormat: this.#core?.format?.number });
  }
}
