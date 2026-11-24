import { FilterUtilities } from '@sdcorejs/utils/fns';
import type { Filter, MatchOptions, Order, PagingRes } from '@sdcorejs/utils/models';
import { PatternMockError, type PatternMockQuery } from './mock-api.model';

const parseJson = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new PatternMockError(400, { message: 'Tham số truy vấn không hợp lệ.' });
  }
};

const valueAt = (record: unknown, path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>((value, key) => (value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined), record);

const compare = (left: unknown, right: unknown): number => {
  if (left === right) return 0;
  if (left === null || left === undefined || left === '') return 1;
  if (right === null || right === undefined || right === '') return -1;
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  return String(left).localeCompare(String(right), 'vi', { numeric: true });
};

/** Shared filter, sort and paging rules for collection and customer relation requests. */
export function pageMockRecords<T>(
  source: readonly T[],
  query: PatternMockQuery,
  fieldTypes?: MatchOptions['fieldTypes'],
  defaultPageSize = 20
): PagingRes<T> {
  const filters = parseJson<Filter[]>(query.get('filters'), []);
  const orders = parseJson<Order[]>(query.get('orders'), []);
  const pageNumber = Math.max(0, Number(query.get('pageNumber') ?? 0) || 0);
  const pageSize = Math.max(1, Number(query.get('pageSize') ?? defaultPageSize) || defaultPageSize);
  const matched = source.filter(record => FilterUtilities.match(filters, record, { fieldTypes }));
  const sorted = orders.length
    ? [...matched].sort((left, right) => {
        for (const order of orders) {
          const result = compare(valueAt(left, String(order.field)), valueAt(right, String(order.field)));
          if (result) return order.direction === 'DESC' ? -result : result;
        }
        return 0;
      })
    : matched;
  const rawLimit = query.get('limit');
  const limit = rawLimit === null ? pageSize : Number(rawLimit);
  if (!Number.isSafeInteger(limit) || limit < 0) throw new PatternMockError(400, { message: 'Giới hạn số dòng không hợp lệ.' });
  const offset = pageNumber * pageSize;
  return { items: sorted.slice(offset, offset + Math.min(limit, pageSize)), total: matched.length };
}
