import { inject, untracked } from '@angular/core';
import { ɵSdQueryChipLabels, ɵsdQueryChipValueText } from '@sdcorejs/angular/components/query-bar';
import { ɵsdOperatorResolver } from '@sdcorejs/angular/components/operator';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdDateTimeService } from '@sdcorejs/angular/services/date-time';
import type { Operator } from '@sdcorejs/utils/models';
import { sdTableMobileFilterChip, type SdTableMobileFilterItem } from '../../../services/table-filter/table-mobile-filter.util';
import type { TableFilterValue } from '../../../services/table-filter/table-filter.model';

const NO_DATA: readonly Operator[] = ['NULL', 'NOT_NULL'];

/**
 * Summary of a phone filter for a raw record, the same string the query bar shows for that chip (handoff table-mobile
 * 3.3): one value → its label, several → `first +n`, ranges as on the bar. A `string` / `number` value gets its operator
 * in front (`Chứa abc`); `NULL` / `NOT_NULL` show the operator name. Empty when the filter is not active or custom.
 *
 * Call in an injection context. `labels` resolves values the table does not hold (lazy-values, items functions).
 */
export function sdTableMobileFilterSummary(): (
  item: SdTableMobileFilterItem,
  value: TableFilterValue,
  labels: ɵSdQueryChipLabels
) => string {
  const i18n = inject(I18nService);
  const dateTime = inject(SdDateTimeService);
  const operators = ɵsdOperatorResolver();
  return (item, value, labels) => {
    const chip = sdTableMobileFilterChip(item, value);
    const field = item.field;
    if (!chip?.active || !field) return '';
    const operator = chip.filter.operator as Operator;
    if (NO_DATA.includes(operator)) return operators.label(operator);
    // why: callers are computeds; the lookup runs consumer code (views / search) that may write signals.
    untracked(() => labels.resolve(chip.filter, field));
    const text = ɵsdQueryChipValueText(chip.filter, field, {
      t: (key, params) => i18n.t(key, params),
      toFormat: (raw, format) => dateTime.toFormat(raw, format),
      labels: labels.get(field.key as string),
    });
    const scalar = item.source?.shape === 'scalar' && (field.type === 'string' || field.type === 'number');
    return scalar ? `${operators.label(operator)} ${text}`.trim() : text;
  };
}
