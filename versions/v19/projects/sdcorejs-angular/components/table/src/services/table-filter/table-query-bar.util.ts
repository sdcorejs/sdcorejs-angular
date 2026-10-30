import { isSignal, Signal } from '@angular/core';
import type { SdQuery, SdQueryField } from '@sdcorejs/angular/components/query-bar';
import { Utilities } from '@sdcorejs/utils/fns';
import { Filter, Operator } from '@sdcorejs/utils/models';
import { SdTableColumnAnyRow } from '../../models/table-column.model';
import { leafColumns } from '../column-leaf.util';
import { isDefaultControlFilter, isNoDataColumnOperator } from './table-filter-operator.util';
import type { SdTableExternalFilter, SdTableOptionFilterQueryBar, TableFilterValue } from './table-filter.model';
import type { SdTableOptionQuickSearch, SdTableQuickSearchFilter } from './table-quick-search.model';

// Adapter of `filter.mode: 'query-bar'` (handoff table-query-bar, section 3–5). The bar is a view over
// `TableFilterValue`: these pure functions translate between the raw record and the bar's `SdQuery`, so
// `items()`, the cache and `SdConvertToPagingReq` see exactly what the default-mode controls store.

export type SdTableQuerySourceKind = 'quick' | 'external' | 'column';

/**
 * How a chip value is stored in the raw record.
 * - `scalar`: one value; `multi`: an array (chip `IN`); `range`: `{ from, to }` (chip `BETWEEN`);
 * - `boolean`: `true` / `false` (external boolean); `flag`: `'1'` / `'0'` (column boolean select).
 */
export type SdTableQueryShape = 'scalar' | 'multi' | 'range' | 'boolean' | 'flag';

/** Field of the bar → the filter it edits. */
export interface SdTableQuerySource {
  /** `${source}:${field}` — the bar's `SdQueryField.key`. Never reaches filterReq, pagingReq or the cache. */
  key: string;
  source: SdTableQuerySourceKind;
  /** Field of the raw record. */
  field: string;
  column?: SdTableColumnAnyRow;
  external?: SdTableExternalFilter;
  quick?: SdTableQuickSearchFilter;
  shape: SdTableQueryShape;
  /** Operator of a chip with a value when the raw record holds no operator for it. */
  operator: Operator;
  /**
   * What reaches `columnOperator`: nothing (`none`), the chip operator (`chip`, a column whose operator the user
   * picks), or only `NULL` / `NOT_NULL` (`no-data`, a column whose chip operator `IN` / `BETWEEN` / `EQUAL` is
   * implied by the value shape).
   */
  operatorMode: 'none' | 'chip' | 'no-data';
}

export interface SdTableQueryFields {
  /** Fields of the bar, in order: quick filters, external filters, leaf columns. */
  fields: SdQueryField[];
  sources: Map<string, SdTableQuerySource>;
  /** Filters the bar cannot edit. Their raw values stay as they are and are still sent. */
  excluded: { field: string; reason: string }[];
  /** Column fields hidden behind an external filter of the same field. Their raw value is always cleared. */
  covered: string[];
  /** Column field → bar key its header icon opens (`column:<field>`, or `external:<field>` when covered). */
  columnKeys: Map<string, string>;
  /** The bar shows the search box (bound to `quickSearch.term`). */
  search: boolean;
  /** The table has quick search: the patch carries `quickSearch`. */
  quickSearch: boolean;
}

export interface SdTableQueryContext extends SdTableQueryFields {
  /** Column operators of the table defaults — restored when a `NULL` / `NOT_NULL` chip goes away. */
  defaultColumnOperator?: Record<string, Operator>;
}

/** A field whose raw value or column operator the bar changed — the table runs that filter's callbacks. */
export interface SdTableQueryChange {
  key: string;
  /** New raw value (the stored one when only the operator changed). */
  value: unknown;
  valueChanged: boolean;
  /** New column operator, when it changed. */
  operator?: Operator;
}

const NO_DATA: readonly Operator[] = ['NULL', 'NOT_NULL'];
/** Column operators the raw record cannot hold for one value. */
const NOT_SCALAR: readonly Operator[] = ['BETWEEN', 'IN', 'NOT_IN'];
const SINGLE_VALUE: readonly Operator[] = ['EQUAL', 'NOT_EQUAL', 'NULL', 'NOT_NULL'];

const hasValue = (value: unknown): boolean => value !== undefined && value !== null && value !== '';
const isNoData = (operator: Operator | undefined): operator is 'NULL' | 'NOT_NULL' => !!operator && NO_DATA.includes(operator);
const read = <T>(value: T | Signal<T> | undefined): T | undefined => (isSignal(value) ? value() : value);
/** `selection: 'MULTIPLE' | 'MULTIPLEAUTOCOMPLETE'` — the controls that store an array. */
const isMultiple = (selection: string | undefined): boolean => !!selection && selection.includes('MULTIPLE');

const toArray = (value: unknown): unknown[] => (Array.isArray(value) ? [...value] : hasValue(value) ? [value] : []);
const toRange = (value: unknown): { from: unknown; to: unknown } => {
  if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
    const range = value as { from?: unknown; to?: unknown };
    return { from: hasValue(range.from) ? range.from : null, to: hasValue(range.to) ? range.to : null };
  }
  // why: một ngày đơn trên cột khoảng ngày — converter lọc cả ngày đó, đúng như khoảng [v, v].
  return hasValue(value) ? { from: value, to: value } : { from: null, to: null };
};
/** Same truthiness as `SdConvertToPagingReq` for boolean filters. */
const toBoolean = (value: unknown): boolean | null => {
  if (value === true || value === 1 || value === 'true' || value === '1') return true;
  if (value === false || value === 0 || value === 'false' || value === '0') return false;
  return null;
};

const stringify = (value: unknown): string => {
  try {
    return Utilities.canonicalStringify(value);
  } catch {
    return String(value);
  }
};

/** The value in the comparable form of its shape: equivalent raw values compare equal. */
const normalize = (shape: SdTableQueryShape, value: unknown): unknown => {
  switch (shape) {
    case 'multi':
      return toArray(value);
    case 'range':
      return toRange(value);
    case 'boolean':
    case 'flag':
      return toBoolean(value);
    default:
      return hasValue(value) ? value : null;
  }
};

const sameRaw = (shape: SdTableQueryShape, left: unknown, right: unknown): boolean =>
  stringify(normalize(shape, left)) === stringify(normalize(shape, right));

const titleOf = (column: SdTableColumnAnyRow): string =>
  (typeof column.title === 'string' ? column.title : column.title?.title) || column.field;

/** `values` / `lazy-values` field options; lazy `items` (an `SdSearch`) becomes the bar's `option.search`. */
const valuesField = (
  type: 'values' | 'lazy-values',
  option: { items: unknown; valueField: string; displayField: string; views?: unknown },
  items: unknown = option.items
): Pick<SdQueryField, 'type'> & { option: Record<string, unknown> } =>
  type === 'lazy-values'
    ? {
        type,
        option: {
          search: option.items,
          valueField: option.valueField,
          displayField: option.displayField,
          ...(option.views ? { views: option.views } : {}),
        },
      }
    : { type, option: { items, valueField: option.valueField, displayField: option.displayField } };

/**
 * Why the query bar cannot show an external filter, or `undefined` when it can. Also tells the settings modal which
 * filters are "not on the bar".
 */
export const sdTableExternalOffBar = (
  item: SdTableExternalFilter,
  args: { exclude: ReadonlySet<string>; filterDefs: ReadonlySet<string> }
): string | undefined => {
  if (item.type === 'custom') return 'custom external filter';
  if (args.filterDefs.has(item.field)) return 'sdTableFilterDef template';
  if (args.exclude.has(item.field)) return 'listed in filter.queryBar.exclude';
  if (
    (item.type === 'date' || item.type === 'datetime') &&
    item.defaultOperator !== 'GREATER_OR_EQUAL' &&
    item.defaultOperator !== 'LESS_OR_EQUAL'
  ) {
    return 'date external filter without defaultOperator GREATER_OR_EQUAL or LESS_OR_EQUAL (sends no condition)';
  }
  return undefined;
};

/**
 * Fields of the query bar for a table (handoff section 3): keys, groups, pinned chips, operators, and the filters
 * left out. Order: `quickSearch.filters`, `externalFilters`, then the leaf columns given (children flattened).
 */
export const sdTableQueryFields = (args: {
  /** Leaf columns on screen, after `SD_TABLE_CONFIGURATION.filter.operator` was merged in. */
  columns: SdTableColumnAnyRow[];
  externalFilters?: SdTableExternalFilter[];
  quickSearch?: SdTableOptionQuickSearch;
  /** `TableFilterConfiguration.inlineExternal`: external filters shown inline are pinned by default. */
  inlineExternal: Record<string, boolean>;
  queryBar?: SdTableOptionFilterQueryBar;
  /** `hideInlineFilter === true`: no column goes on the bar. */
  hideColumns: boolean;
  labels: { filters: string; columns: string };
  /** Fields with an `sdTableFilterDef` template. */
  filterDefs?: string[];
  /** Items the table loaded for `values` columns whose `items` is a function. */
  cacheValues?: Record<string, unknown[]>;
}): SdTableQueryFields => {
  const { labels } = args;
  const exclude = new Set(args.queryBar?.exclude ?? []);
  const filterDefs = new Set(args.filterDefs ?? []);
  const pinnedList = args.queryBar?.pinned ? new Set(args.queryBar.pinned) : undefined;
  const result: SdTableQueryFields = {
    fields: [],
    sources: new Map(),
    excluded: [],
    covered: [],
    columnKeys: new Map(),
    search: !!args.quickSearch,
    quickSearch: !!args.quickSearch,
  };
  const add = (source: SdTableQuerySource, field: Record<string, unknown>): void => {
    result.sources.set(source.key, source);
    result.fields.push({ ...field, key: source.key, defaultOperator: source.operator } as SdQueryField);
  };
  const skip = (key: string, reason: string): void => {
    result.excluded.push({ field: key, reason });
  };
  const pin = (field: string, byDefault: boolean, required: boolean): boolean =>
    required || (pinnedList ? pinnedList.has(field) : byDefault);

  for (const item of args.quickSearch?.filters ?? []) {
    const key = `quick:${item.field}`;
    if (read(item.hidden)) {
      skip(key, 'hidden quick filter (its value and required check still apply)');
      continue;
    }
    if (exclude.has(item.field)) {
      skip(key, 'listed in filter.queryBar.exclude');
      continue;
    }
    const multi = isMultiple(item.option.selection);
    const operator: Operator = multi ? 'IN' : item.defaultOperator || 'EQUAL';
    add(
      { key, source: 'quick', field: item.field, quick: item, shape: multi ? 'multi' : 'scalar', operator, operatorMode: 'none' },
      {
        ...valuesField(item.type, item.option),
        label: item.title,
        operators: [operator],
        group: labels.filters,
        pinned: pin(item.field, true, !!item.required),
        required: !!item.required,
        disabled: !!read(item.disabled),
      }
    );
  }

  const externalKeys = new Set<string>();
  for (const item of args.externalFilters ?? []) {
    const key = `external:${item.field}`;
    const offBar = sdTableExternalOffBar(item, { exclude, filterDefs });
    if (offBar) {
      skip(key, offBar);
      continue;
    }
    const base = {
      label: item.title,
      group: labels.filters,
      pinned: pin(item.field, !!args.inlineExternal[item.field], !!item.required),
      required: !!item.required,
    };
    const source = { key, source: 'external' as const, field: item.field, external: item, operatorMode: 'none' as const };
    switch (item.type) {
      case 'string': {
        const operator: Operator = item.defaultOperator || 'CONTAIN';
        add({ ...source, shape: 'scalar', operator }, { ...base, type: 'string', operators: [operator] });
        break;
      }
      case 'number': {
        const operator: Operator = item.defaultOperator || 'EQUAL';
        add({ ...source, shape: 'scalar', operator }, { ...base, type: 'number', operators: [operator] });
        break;
      }
      case 'boolean':
        add(
          { ...source, shape: 'boolean', operator: 'EQUAL' },
          { ...base, type: 'boolean', operators: ['EQUAL'], trueLabel: item.option?.displayOnTrue, falseLabel: item.option?.displayOnFalse }
        );
        break;
      case 'date':
      case 'datetime':
        add(
          { ...source, shape: 'scalar', operator: item.defaultOperator! },
          { ...base, type: item.type, operators: [item.defaultOperator!], min: item.minDate, max: item.maxDate }
        );
        break;
      case 'daterange':
        // why: control cũ (sd-date-range) chỉ chọn ngày và converter cắt về đầu/cuối ngày, kể cả với `enableTime`.
        add(
          { ...source, shape: 'range', operator: 'BETWEEN' },
          { ...base, type: 'date', operators: ['BETWEEN'], min: item.minDate, max: item.maxDate }
        );
        break;
      case 'values':
      case 'lazy-values': {
        const multi = isMultiple(item.option.selection);
        const operator: Operator = multi ? 'IN' : item.defaultOperator || 'EQUAL';
        add(
          { ...source, shape: multi ? 'multi' : 'scalar', operator },
          { ...base, ...valuesField(item.type, item.option), operators: [operator] }
        );
        break;
      }
    }
    if (result.sources.has(key)) externalKeys.add(item.field);
  }

  if (args.hideColumns) return result;

  for (const column of leafColumns(args.columns)) {
    const key = `column:${column.field}`;
    if (externalKeys.has(column.field)) {
      result.covered.push(column.field);
      result.columnKeys.set(column.field, `external:${column.field}`);
      continue;
    }
    const filter = column.filter;
    const reason = column.hidden
      ? 'hidden column'
      : column.type === 'time'
        ? 'time column'
        : filter?.disabled
          ? 'filter.disabled'
          : filter?.filterDef || filterDefs.has(column.field)
            ? 'filterDef template'
            : exclude.has(column.field)
              ? 'listed in filter.queryBar.exclude'
              : undefined;
    if (reason) {
      skip(key, reason);
      continue;
    }

    const operator = filter?.operator;
    const enabled = !!operator?.enable;
    const list = enabled ? (operator?.list ?? []) : [];
    // why: NULL / NOT_NULL chỉ có nghĩa trên control mặc định (converter: isNoDataColumnOperator).
    const noData = enabled && isDefaultControlFilter(column) ? list.filter(op => NO_DATA.includes(op)) : [];
    const base = { label: titleOf(column), group: labels.columns, pinned: pin(column.field, false, false) };
    const source = { key, source: 'column' as const, field: column.field, column };
    switch (column.type) {
      case 'string':
      case 'number': {
        if (column.type === 'number' && column.filter?.type === 'split-number') {
          add(
            { ...source, shape: 'range', operator: 'BETWEEN', operatorMode: 'none' },
            { ...base, type: 'number', operators: ['BETWEEN'] }
          );
          break;
        }
        const fallback: Operator = operator?.default ?? (column.type === 'string' ? 'CONTAIN' : 'EQUAL');
        const choices = list.filter(op => !NOT_SCALAR.includes(op));
        add(
          { ...source, shape: 'scalar', operator: fallback, operatorMode: enabled ? 'chip' : 'none' },
          { ...base, type: column.type, operators: choices.length ? choices : [fallback] }
        );
        break;
      }
      case 'boolean':
        add(
          { ...source, shape: 'flag', operator: 'EQUAL', operatorMode: enabled ? 'no-data' : 'none' },
          {
            ...base,
            type: 'boolean',
            operators: ['EQUAL', ...noData],
            trueLabel: column.option?.displayOnTrue,
            falseLabel: column.option?.displayOnFalse,
          }
        );
        break;
      case 'values':
      case 'lazy-values': {
        const option = column.option as { items: unknown; valueField: string; displayField: string; views?: unknown; selection?: string };
        const items =
          column.type === 'values' && typeof option.items === 'function' && !isSignal(option.items)
            ? (args.cacheValues?.[column.field] ?? option.items)
            : option.items;
        const field = valuesField(column.type, option, items);
        if (isMultiple(option.selection)) {
          add(
            { ...source, shape: 'multi', operator: 'IN', operatorMode: enabled ? 'no-data' : 'none' },
            { ...base, ...field, operators: ['IN', ...noData] }
          );
          break;
        }
        const fallback: Operator = operator?.default ?? 'EQUAL';
        const choices = list.filter(op => SINGLE_VALUE.includes(op));
        add(
          { ...source, shape: 'scalar', operator: fallback, operatorMode: enabled ? 'chip' : 'none' },
          { ...base, ...field, operators: choices.length ? choices : [fallback] }
        );
        break;
      }
      case 'date':
      case 'datetime':
        // why: control cũ chỉ chọn ngày (sd-date / sd-date-range) và converter lọc theo cả ngày, nên field là `date`.
        if (column.filter?.type === 'date') {
          add(
            { ...source, shape: 'scalar', operator: 'EQUAL', operatorMode: enabled ? 'no-data' : 'none' },
            { ...base, type: 'date', operators: ['EQUAL', ...noData] }
          );
        } else {
          add(
            { ...source, shape: 'range', operator: 'BETWEEN', operatorMode: enabled ? 'no-data' : 'none' },
            { ...base, type: 'date', operators: ['BETWEEN', ...noData] }
          );
        }
        break;
    }
    if (result.sources.has(key)) result.columnKeys.set(column.field, key);
  }
  return result;
};

const readRaw = (source: SdTableQuerySource, value: TableFilterValue): unknown => {
  if (source.source === 'quick') return value.quickSearch?.filters?.[source.field];
  if (source.source === 'external') return value.externalFilter?.[source.field];
  return value.columnFilter?.[source.field];
};

/** Chip of a source for a raw record: operator, data and whether it filters anything. */
const chipOf = (source: SdTableQuerySource, value: TableFilterValue): { operator: Operator; data: unknown; active: boolean } => {
  const columnOperator = source.source === 'column' ? value.columnOperator?.[source.field] : undefined;
  if (source.operatorMode !== 'none' && isNoData(columnOperator) && isNoDataColumnOperator(source.column!, columnOperator)) {
    return { operator: columnOperator, data: null, active: true };
  }
  const raw = readRaw(source, value);
  const operator = source.operatorMode === 'chip' ? (columnOperator ?? source.operator) : source.operator;
  switch (source.shape) {
    case 'multi': {
      const data = toArray(raw);
      return { operator, data, active: data.length > 0 };
    }
    case 'range': {
      const data = toRange(raw);
      return { operator, data, active: hasValue(data.from) || hasValue(data.to) };
    }
    case 'boolean':
    case 'flag': {
      const data = toBoolean(raw);
      return { operator, data, active: data !== null };
    }
    default: {
      const data = hasValue(raw) ? raw : null;
      return { operator, data, active: data !== null };
    }
  }
};

/** Raw value a chip stores; no chip stores the empty value of the shape. */
const rawOf = (source: SdTableQuerySource, chip: Filter | undefined): unknown => {
  if (!chip) return source.shape === 'range' ? { from: null, to: null } : null;
  if (isNoData(chip.operator as Operator)) return null;
  const data = (chip as { data?: unknown }).data;
  switch (source.shape) {
    case 'multi':
      return toArray(data);
    case 'range':
      // why: popover BETWEEN chỉ điền một đầu thì data thiếu hẳn khoá kia (`{ from }`); converter của daterange cần đủ
      // cả `from` lẫn `to`.
      return toRange(data);
    case 'boolean':
      return toBoolean(data);
    case 'flag': {
      const flag = toBoolean(data);
      return flag === null ? null : flag ? '1' : '0';
    }
    default:
      return hasValue(data) ? data : null;
  }
};

/** Column operator after the edit; `undefined` removes the key. */
const operatorOf = (
  source: SdTableQuerySource,
  chip: Filter | undefined,
  current: Operator | undefined,
  ctx: SdTableQueryContext
): Operator | undefined => {
  const operator = chip?.operator as Operator | undefined;
  if (isNoData(operator)) return operator;
  if (chip && source.operatorMode === 'chip') return operator;
  // why: không còn chip, hoặc toán tử của chip suy từ dạng giá trị (IN / BETWEEN): chỉ rời khỏi NULL / NOT_NULL mới
  // đổi columnOperator, về toán tử mặc định của cột.
  return isNoData(current) ? (ctx.defaultColumnOperator?.[source.field] ?? source.column?.filter?.operator?.default) : current;
};

/**
 * Raw record → bar query (handoff section 5). Chips: every pinned field, then unpinned fields that filter something,
 * in the order of `prev` and then declaration order. A chip whose operator and data equal the one in `prev` is that
 * same object — sd-query-bar tracks chips by identity.
 */
export const tableFilterToQuery = (value: TableFilterValue, ctx: SdTableQueryContext, prev: Filter[] = []): SdQuery => {
  const previous = new Map<string, Filter>();
  const order = new Map<string, number>();
  prev.forEach((filter, index) => {
    const key = (filter as { field?: string }).field;
    if (key === undefined || previous.has(key)) return;
    previous.set(key, filter);
    order.set(key, index);
  });
  const pinned: Filter[] = [];
  const rest: Filter[] = [];
  for (const field of ctx.fields) {
    const key = field.key as string;
    const source = ctx.sources.get(key);
    if (!source) continue;
    const chip = chipOf(source, value);
    if (!field.pinned && !chip.active) continue;
    const before = previous.get(key);
    const next =
      // why: so theo dạng chuẩn — popover gửi khoảng một đầu là `{ from }`, raw dựng lại là `{ from, to: null }`; coi là một
      // chip để không dựng lại DOM (và mất focus) ngay sau khi menu trả focus về chip.
      before && before.operator === chip.operator && sameRaw(source.shape, (before as { data?: unknown }).data, chip.data)
        ? before
        : ({ field: key, operator: chip.operator, data: chip.data } as Filter);
    (field.pinned ? pinned : rest).push(next);
  }
  const rank = (filter: Filter): number => order.get((filter as { field: string }).field) ?? Number.MAX_SAFE_INTEGER;
  // why: chip thêm giữ thứ tự người dùng thêm trong phiên (thứ tự trên thanh); chip mới đến từ raw xếp sau.
  const ordered = rest
    .map((filter, index) => ({ filter, index }))
    .sort((a, b) => rank(a.filter) - rank(b.filter) || a.index - b.index)
    .map(entry => entry.filter);
  return {
    filters: [...pinned, ...ordered],
    logic: 'AND',
    ...(ctx.search ? { search: value.quickSearch?.term ?? '' } : {}),
  };
};

/** Keys of the bar fields whose applied value filters something — header icons show them as filtering. */
export const sdTableActiveQueryKeys = (value: TableFilterValue, ctx: SdTableQueryContext): Set<string> => {
  const keys = new Set<string>();
  for (const [key, source] of ctx.sources) if (chipOf(source, value).active) keys.add(key);
  return keys;
};

/**
 * Folds a change of the applied state into a bar that holds unapplied edits (manualFilter, or a chip edited while the
 * state changed). A key whose applied chip did not change between `before` and `after` keeps its draft — edited,
 * added or removed by the user. A key that changed takes the applied chip: the outside change wins for that field.
 * New applied chips go after the draft ones.
 */
export const mergeQueryDraft = (draft: Filter[], before: Filter[], after: Filter[]): Filter[] => {
  const keyOf = (filter: Filter): string => (filter as { field: string }).field;
  const was = new Map(before.map(filter => [keyOf(filter), filter]));
  const now = new Map(after.map(filter => [keyOf(filter), filter]));
  const unchanged = (key: string): boolean => {
    const left = was.get(key);
    const right = now.get(key);
    if (!left || !right) return !left && !right;
    return (
      left.operator === right.operator && stringify((left as { data?: unknown }).data) === stringify((right as { data?: unknown }).data)
    );
  };
  const result: Filter[] = [];
  const seen = new Set<string>();
  for (const filter of draft) {
    const key = keyOf(filter);
    seen.add(key);
    if (unchanged(key)) result.push(filter);
    else if (now.has(key)) result.push(now.get(key)!);
  }
  for (const filter of after) if (!seen.has(keyOf(filter)) && !unchanged(keyOf(filter))) result.push(filter);
  return result;
};

/**
 * Bar query → raw record (handoff section 5). Every field of the bar is written: its chip, or the empty value when
 * it has none. Covered columns are cleared; excluded fields are left alone. A value equivalent to the stored one
 * (`[]` and `null`, `'1'` and `true`, …) keeps the stored representation, so a round trip changes nothing.
 */
export const queryToTableFilter = (
  query: SdQuery,
  ctx: SdTableQueryContext,
  current: TableFilterValue
): {
  patch: Pick<TableFilterValue, 'quickSearch' | 'externalFilter' | 'columnFilter' | 'columnOperator'>;
  changed: SdTableQueryChange[];
} => {
  const chips = new Map<string, Filter>();
  for (const filter of query.filters) {
    const key = (filter as { field?: string }).field;
    if (key !== undefined && !chips.has(key)) chips.set(key, filter);
  }
  const quickFilters: Record<string, unknown> = { ...current.quickSearch?.filters };
  const externalFilter: Record<string, unknown> = { ...current.externalFilter };
  const columnFilter: Record<string, unknown> = { ...current.columnFilter };
  const columnOperator: Record<string, Operator> = { ...current.columnOperator };
  const changed: SdTableQueryChange[] = [];

  for (const [key, source] of ctx.sources) {
    const chip = chips.get(key);
    const store = source.source === 'quick' ? quickFilters : source.source === 'external' ? externalFilter : columnFilter;
    const before = store[source.field];
    const next = rawOf(source, chip);
    const valueChanged = !sameRaw(source.shape, before, next);
    if (valueChanged) store[source.field] = next;

    let operator: Operator | undefined;
    let operatorChanged = false;
    if (source.source === 'column' && source.operatorMode !== 'none') {
      const stored = current.columnOperator?.[source.field];
      operator = operatorOf(source, chip, stored, ctx);
      if (operator !== stored) {
        operatorChanged = true;
        if (operator === undefined) delete columnOperator[source.field];
        else columnOperator[source.field] = operator;
      }
    }
    if (valueChanged || operatorChanged) {
      changed.push({ key, value: valueChanged ? next : before, valueChanged, ...(operatorChanged && operator ? { operator } : {}) });
    }
  }
  // why: cột bị external cùng field che không có control nào trên thanh; xoá để không còn điều kiện ẩn từ cache cũ.
  for (const field of ctx.covered) {
    columnFilter[field] = null;
    // why: NULL / NOT_NULL lọc cả khi không có giá trị — trả operator về mặc định, nếu không điều kiện vẫn gửi đi.
    if (isNoData(columnOperator[field])) {
      const fallback = ctx.defaultColumnOperator?.[field];
      if (fallback && !isNoData(fallback)) columnOperator[field] = fallback;
      else delete columnOperator[field];
    }
  }

  const term = ctx.search ? (query.search ?? '').trim() : (current.quickSearch?.term ?? '');
  return {
    patch: {
      ...(ctx.quickSearch
        ? { quickSearch: { term, filters: quickFilters as NonNullable<TableFilterValue['quickSearch']>['filters'] } }
        : {}),
      externalFilter,
      columnFilter,
      columnOperator,
    },
    changed,
  };
};
