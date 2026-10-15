import type { SdDataTypeIconKey } from '@sdcorejs/angular/modules/icon';
import type { SdGenericProperty } from '../models';

const STRING_FORMATS = new Set<SdDataTypeIconKey>(['email', 'phone', 'url', 'password']);
const NUMBER_FORMATS = new Set<SdDataTypeIconKey>(['integer', 'decimal', 'currency', 'percent']);

/**
 * Key of the shared data-type icon set (`@sdcorejs/angular/modules/icon`) for a property (INV-003).
 * `relation` and `file` keep one icon whether or not they hold several values; a format that does not belong
 * to the data type is ignored.
 */
export function sdGenericPropertyIconKey(property: Pick<SdGenericProperty, 'dataType' | 'format' | 'multiple'>): SdDataTypeIconKey {
  const format = property.format as SdDataTypeIconKey | undefined;
  switch (property.dataType) {
    case 'string':
      if (property.multiple) return 'string-list';
      return format && STRING_FORMATS.has(format) ? format : 'string';
    case 'number':
      return format && NUMBER_FORMATS.has(format) ? format : 'number';
    case 'enum':
      return property.multiple ? 'enum-multiple' : 'enum';
    default:
      return property.dataType;
  }
}
