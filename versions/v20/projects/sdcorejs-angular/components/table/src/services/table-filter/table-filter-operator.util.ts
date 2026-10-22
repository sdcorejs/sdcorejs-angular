import { Operator } from '@sdcorejs/utils/models';

/** Kiểu cột mà column-filter render control mặc định (nhận chip operator — thiết kế đợt 2 · G). */
const CONTROL_FILTER_TYPES: ReadonlySet<string> = new Set([
  'string',
  'number',
  'boolean',
  'values',
  'lazy-values',
  'date',
  'datetime',
  'time',
]);

interface FilterColumn {
  readonly type: string;
  readonly filter?: unknown;
}

/**
 * Cột lọc bằng control mặc định: không có template `filterDef`, không phải `split-number` / `split-date` (hai ô).
 * Chỉ ở đây operator nằm trong control và control khoá ô khi chọn `NULL` / `NOT_NULL`.
 */
export const isDefaultControlFilter = (column: FilterColumn): boolean => {
  const filter = column.filter as { filterDef?: unknown; type?: string } | undefined;
  return CONTROL_FILTER_TYPES.has(column.type) && !filter?.filterDef && filter?.type !== 'split-number' && filter?.type !== 'split-date';
};

/**
 * `NULL` / `NOT_NULL` trên control mặc định: ô bị khoá và để trống, nên filter có hiệu lực mà không cần giá trị.
 * Template custom và filter split giữ cách cũ (chỉ lọc khi có giá trị).
 */
export const isNoDataColumnOperator = (column: FilterColumn, operator: Operator | null | undefined): operator is 'NULL' | 'NOT_NULL' =>
  (operator === 'NULL' || operator === 'NOT_NULL') && isDefaultControlFilter(column);
