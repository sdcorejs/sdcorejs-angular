import type { Operator } from '@sdcorejs/utils/models';
import type { SdTableQuickSearchValue } from '../table-filter/table-quick-search.model';

/**
 * State của `sd-table` được ghi lên query param `table-<autoId>` khi bật `syncQueryParams`. Nội bộ.
 *
 * Format JSON, khoá ngắn, thứ tự cố định, chỉ phần khác mặc định:
 * `{"q":{"t":term,"f":{field:value}},"c":{field:value},"o":{field:operator},"e":{field:value},"s":[field,"asc"|"desc"],"p":page(1-based),"z":pageSize}`.
 * Giá trị `null` nghĩa là "đã xoá" (khác mặc định). `Date` ghi ISO và được đọc lại thành `Date`.
 */
export interface SdTableUrlState {
  quickSearch?: SdTableQuickSearchValue;
  columnOperator: Record<string, Operator>;
  columnFilter: Record<string, unknown>;
  externalFilter: Record<string, unknown>;
  sort: { active: string; direction: 'asc' | 'desc' | '' };
  /** 0-based. */
  pageIndex: number;
  pageSize: number;
}

export interface SdTableUrlStateContext {
  defaults: {
    /** `undefined` khi bảng không có quick search. */
    quickSearch?: SdTableQuickSearchValue;
    columnOperator: Record<string, Operator>;
    columnFilter: Record<string, unknown>;
    externalFilter: Record<string, unknown>;
    pageSize: number;
  };
  /** Field được phép đọc từ URL — URL là input không tin cậy, field lạ bị bỏ. */
  fields: {
    /** Cột có filter đang bật. */
    column: ReadonlySet<string>;
    /** Cột bật chọn operator → các operator của cột đó (`filter.operator.list`). */
    operator: ReadonlyMap<string, ReadonlySet<string>>;
    external: ReadonlySet<string>;
    quickSearch: ReadonlySet<string>;
    sort: ReadonlySet<string>;
  };
  pageSizes: readonly number[];
  /** `false` với bảng không có tổng (`paginate.total: 'unknown'`): không ghi/đọc trang. */
  pageIndex: boolean;
}

const OPERATORS: ReadonlySet<string> = new Set<Operator>([
  'EQUAL',
  'NOT_EQUAL',
  'CONTAIN',
  'NOT_CONTAIN',
  'IN',
  'NOT_IN',
  'START_WITH',
  'NOT_START_WITH',
  'END_WITH',
  'NOT_END_WITH',
  'GREATER_THAN',
  'LESS_THAN',
  'GREATER_OR_EQUAL',
  'LESS_OR_EQUAL',
  'BETWEEN',
  'NULL',
  'NOT_NULL',
]);

/** Đúng định dạng `Date#toJSON` — chỉ chuỗi này được đọc lại thành `Date`. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);

/** Chuẩn hoá để so sánh/ghi: rỗng → null, Date → ISO, khoá object theo thứ tự chữ cái, bỏ `undefined`. */
const canonical = (value: unknown): unknown => {
  if (value === undefined || value === null || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toJSON();
  if (Array.isArray(value)) return value.length ? value.map(item => canonical(item)) : null;
  if (isPlainObject(value)) {
    const entries = Object.keys(value)
      .sort()
      .map(key => [key, canonical(value[key])] as const);
    // Khoảng ngày không có đầu nào là rỗng.
    if (('from' in value || 'to' in value) && entries.every(([, item]) => item === null)) return null;
    return Object.fromEntries(entries);
  }
  return value;
};

const same = (a: unknown, b: unknown): boolean => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

/** Phần của `current` khác `defaults`; giá trị rỗng ghi `null`. */
const diff = (current: Record<string, unknown>, defaults: Record<string, unknown>): Record<string, unknown> | undefined => {
  const keys = [...new Set([...Object.keys(current), ...Object.keys(defaults)])].sort();
  const changed = keys.filter(key => !same(current[key], defaults[key]));
  return changed.length ? Object.fromEntries(changed.map(key => [key, canonical(current[key])])) : undefined;
};

export const serializeTableQueryState = (state: SdTableUrlState, context: SdTableUrlStateContext): string | null => {
  const { defaults } = context;
  const encoded: Record<string, unknown> = {};
  if (defaults.quickSearch && state.quickSearch) {
    const quick: Record<string, unknown> = {};
    if (!same(state.quickSearch.term, defaults.quickSearch.term)) quick['t'] = canonical(state.quickSearch.term);
    const filters = diff(state.quickSearch.filters || {}, defaults.quickSearch.filters || {});
    if (filters) quick['f'] = filters;
    if (Object.keys(quick).length) encoded['q'] = quick;
  }
  const columnFilter = diff(state.columnFilter, defaults.columnFilter);
  if (columnFilter) encoded['c'] = columnFilter;
  const columnOperator = diff(state.columnOperator, defaults.columnOperator);
  if (columnOperator) encoded['o'] = columnOperator;
  const externalFilter = diff(state.externalFilter, defaults.externalFilter);
  if (externalFilter) encoded['e'] = externalFilter;
  if (state.sort.active && state.sort.direction) encoded['s'] = [state.sort.active, state.sort.direction];
  if (context.pageIndex && state.pageIndex > 0) encoded['p'] = state.pageIndex + 1;
  if (state.pageSize !== defaults.pageSize) encoded['z'] = state.pageSize;
  return Object.keys(encoded).length ? JSON.stringify(encoded) : null;
};

const isPrimitive = (value: unknown): boolean =>
  value === null || value instanceof Date || ['string', 'number', 'boolean'].includes(typeof value);

/** Chỉ nhận dạng giá trị mà control lọc tạo ra: primitive, mảng primitive, khoảng `{ from, to }`. */
const isFilterValue = (value: unknown): boolean => {
  if (isPrimitive(value)) return true;
  if (Array.isArray(value)) return value.every(isPrimitive);
  if (isPlainObject(value)) {
    const keys = Object.keys(value);
    return keys.length > 0 && keys.every(key => (key === 'from' || key === 'to') && isPrimitive(value[key]));
  }
  return false;
};

const pick = (
  source: unknown,
  allowed: { has(key: string): boolean },
  accept: (value: unknown, key: string) => boolean,
  target: Record<string, unknown>
): Record<string, unknown> => {
  if (!isPlainObject(source)) return target;
  for (const [key, value] of Object.entries(source)) {
    if (allowed.has(key) && accept(value, key)) target[key] = value;
  }
  return target;
};

const clone = <T>(value: T): T => (value === undefined ? value : structuredClone(value));

/** Đọc giá trị param. `undefined` khi không phải JSON object; field lạ / sai dạng bị bỏ, phần thiếu lấy mặc định. */
export const parseTableQueryState = (raw: string, context: SdTableUrlStateContext): SdTableUrlState | undefined => {
  let encoded: unknown;
  try {
    encoded = JSON.parse(raw, (_, value) => (typeof value === 'string' && ISO_DATE.test(value) ? new Date(value) : value));
  } catch {
    return undefined;
  }
  if (!isPlainObject(encoded)) return undefined;
  const { defaults, fields } = context;

  let quickSearch: SdTableQuickSearchValue | undefined;
  if (defaults.quickSearch) {
    quickSearch = clone(defaults.quickSearch);
    const quick = encoded['q'];
    if (isPlainObject(quick)) {
      if (typeof quick['t'] === 'string') quickSearch.term = quick['t'];
      pick(quick['f'], fields.quickSearch, isFilterValue, quickSearch.filters as Record<string, unknown>);
    }
  }

  const sort: SdTableUrlState['sort'] = { active: '', direction: '' };
  const encodedSort = encoded['s'];
  if (
    Array.isArray(encodedSort) &&
    encodedSort.length === 2 &&
    typeof encodedSort[0] === 'string' &&
    fields.sort.has(encodedSort[0]) &&
    (encodedSort[1] === 'asc' || encodedSort[1] === 'desc')
  ) {
    sort.active = encodedSort[0];
    sort.direction = encodedSort[1];
  }

  const page = encoded['p'];
  const size = encoded['z'];
  return {
    quickSearch,
    columnFilter: pick(encoded['c'], fields.column, isFilterValue, clone(defaults.columnFilter)),
    columnOperator: pick(
      encoded['o'],
      fields.operator,
      (value, key) => typeof value === 'string' && OPERATORS.has(value) && !!fields.operator.get(key)?.has(value),
      clone(defaults.columnOperator)
    ) as Record<string, Operator>,
    externalFilter: pick(encoded['e'], fields.external, isFilterValue, clone(defaults.externalFilter)),
    sort,
    pageIndex: context.pageIndex && Number.isInteger(page) && (page as number) >= 1 ? (page as number) - 1 : 0,
    pageSize: Number.isInteger(size) && context.pageSizes.includes(size as number) ? (size as number) : defaults.pageSize,
  };
};
