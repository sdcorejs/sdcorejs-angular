import { Utilities } from '@sdcorejs/utils/fns';
import { Operator } from '@sdcorejs/utils/models';
import { SdTableColumn } from '../../models/table-column.model';
import { SdTableExternalFilter, TableFilterValue } from './table-filter.model';

/**
 * Deep copy of a filter value for a working copy (mobile filter drawer).
 * why: `JSON.parse(JSON.stringify())` biến `Date` thành chuỗi ISO và bỏ key `undefined`, nên giá trị default kiểu ngày
 * đổi kiểu sau khi Áp dụng và so sánh trước/sau luôn lệch. Object khác plain object/array (File, class) giữ tham chiếu.
 */
export const cloneTableFilterValue = <T extends object>(value: T | null | undefined): T => {
  if (value === null || value === undefined) return {} as T;
  return copy(value);
};

const copy = <T>(value: T): T => {
  if (value instanceof Date) return new Date(value.getTime()) as T;
  if (Array.isArray(value)) return value.map(item => copy(item)) as T;
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value)) result[key] = copy((value as Record<string, unknown>)[key]);
    return result as T;
  }
  return value;
};

const same = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  try {
    return Utilities.hash({ value: a }) === Utilities.hash({ value: b });
  } catch {
    return false;
  }
};

const safely = (callback: () => void): void => {
  try {
    callback();
  } catch (error) {
    // why: callback của app lỗi không được chặn các callback còn lại hay việc đóng drawer.
    console.error(error);
  }
};

/**
 * Callbacks of the filters a commit changed, for UIs that edit a working copy and write it once (mobile filter
 * drawer). The desktop controls call them on each change; here they run once per changed filter, after the write.
 * - external filter `onChange(value)` — every type except `custom` (its template owns its events);
 * - `filter.operatorChange(column, operator)` for a column whose operator changed;
 * - column `filter.onChange(value, column, columnFilter)` only when `columnOnChange(column)` says so (a control that
 *   already called it while editing, such as `column-filter`, must not call it twice).
 */
export const runTableFilterCallbacks = (args: {
  previous: TableFilterValue | undefined;
  next: TableFilterValue | undefined;
  externalFilters?: readonly SdTableExternalFilter[] | null;
  columns?: readonly SdTableColumn[] | null;
  operatorChange?: (column?: SdTableColumn, operator?: Operator) => void;
  columnOnChange?: (column: SdTableColumn) => boolean;
}): void => {
  const { previous, next } = args;
  for (const item of args.externalFilters ?? []) {
    if (item.type === 'custom' || !item.onChange) continue;
    const value = next?.externalFilter?.[item.field];
    if (same(previous?.externalFilter?.[item.field], value)) continue;
    safely(() => item.onChange!(value));
  }
  for (const column of args.columns ?? []) {
    const operator = next?.columnOperator?.[column.field];
    if (args.operatorChange && operator && !same(previous?.columnOperator?.[column.field], operator)) {
      safely(() => args.operatorChange!(column, operator));
    }
    const onChange = column.filter?.onChange;
    if (!onChange || !args.columnOnChange?.(column)) continue;
    const value = next?.columnFilter?.[column.field];
    if (same(previous?.columnFilter?.[column.field], value)) continue;
    safely(() => onChange(value, column, next?.columnFilter ?? {}));
  }
};
