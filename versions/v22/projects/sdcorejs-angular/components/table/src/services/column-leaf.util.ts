import type { SdTableColumn, SdTableColumnNormal } from '../models/table-column.model';

/**
 * Leaf columns: each grouped header (`type: 'children'`) is replaced by its children. Filtering, sorting and the
 * filter defaults work on leaves — a grouped header has no value of its own.
 */
export const leafColumns = <T>(columns: readonly SdTableColumn<T>[] | null | undefined): SdTableColumnNormal<T>[] =>
  (columns ?? []).flatMap(column => (column.type === 'children' ? column.children : [column]));
