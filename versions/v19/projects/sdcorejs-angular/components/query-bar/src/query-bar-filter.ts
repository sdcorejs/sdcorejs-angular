import { Filter, Operator } from '@sdcorejs/utils/models';

import { SD_QUERY_NO_DATA_OPERATORS } from './query-bar.model';

const hasValue = (value: unknown): boolean => value !== null && value !== undefined && value !== '';

/**
 * A chip is "active" when it has a non-empty value OR a no-data operator (NULL / NOT_NULL). A BETWEEN range is active
 * when either end is set; `{ from: null, to: null }` is empty. Shared by the bar and the chip popover.
 *
 * Internal (`ɵ`): not exported from the entry point.
 */
export function ɵsdQueryFilterActive(filter: Filter): boolean {
  if (SD_QUERY_NO_DATA_OPERATORS.includes(filter.operator as Operator)) return true;
  const data = (filter as { data?: unknown }).data;
  if (data === null || data === undefined || data === '') return false;
  if (Array.isArray(data)) return data.length > 0;
  if (filter.operator === 'BETWEEN' && typeof data === 'object') {
    const range = data as { from?: unknown; to?: unknown };
    return hasValue(range.from) || hasValue(range.to);
  }
  return true;
}
