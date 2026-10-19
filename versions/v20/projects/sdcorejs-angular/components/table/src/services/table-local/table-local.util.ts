import { DateUtilities } from '@sdcorejs/utils/fns';
import { NumberUtilities, Utilities } from '@sdcorejs/utils/fns';
import { Operator } from '@sdcorejs/utils/models';
import { SdTableColumn, SdTableColumnLazyValues, SdTableColumnValues } from '../../models/table-column.model';
import { SdTableItem } from '../../models/table-item.model';
import { SdTableOptionTree } from '../../models/table-option-tree.model';
import { SdTableFilterRequest, SdTableOptionFilter } from '../table-filter/table-filter.model';
import { matchesQuickSearch, quickSearchConditions } from '../table-filter/table-quick-search.util';
import { resolveFieldValue } from '../field-value.util';
import { subtreeMatches } from '../tree/tree.util';
import { compareLocalValues } from './table-local-sort.util';

export interface FilterLocalItemsOption<T> {
  type: 'local' | 'server';
  columns: SdTableColumn<T>[];
  tree?: SdTableOptionTree<T>;
  filter?: SdTableOptionFilter;
}

export interface FilterLocalItemsResult<T, TItem> {
  items: TItem[];
  filteredItems: TItem[];
  total: number;
  treeSearchPredicate?: (data: T) => boolean;
}

type LocalFilterItem<T> = SdTableItem<T> | T;

const isTableItem = <T>(item: LocalFilterItem<T>): item is SdTableItem<T> =>
  !!item && typeof item === 'object' && 'data' in item && 'meta' in item;

const resolveItemData = <T>(item: LocalFilterItem<T>): T => (isTableItem(item) ? item.data : (item as T));

const hasValue = (value: unknown): boolean => value !== undefined && value !== null && value !== '';

export const hasActiveColumnFilter = <T>(rawColumnFilter: Partial<Record<string, any>> = {}, columns: SdTableColumn<T>[] = []): boolean =>
  columns.some(col => {
    const v = rawColumnFilter[col.field];
    if (Array.isArray(v)) return v.length > 0;
    // why: biên 0 của split-number là giá trị, không phải đầu trống.
    if (v && typeof v === 'object') return hasValue(v.from) || hasValue(v.to);
    return hasValue(v);
  });

// why: cùng fallback với SdConvertToPagingReq để bảng local lọc giống bảng server.
const resolveOperator = <T>(column: SdTableColumn<T>, columnOperator: Partial<Record<string, Operator>>): Operator | undefined =>
  columnOperator[column.field] || column.filter?.operator?.default;

// Hai vế đã trim + lowercase; không có operator thì giữ CONTAIN như trước.
const matchesText = (value: string, operator: Operator | undefined, operand: string): boolean => {
  switch (operator) {
    case 'EQUAL':
      return value === operand;
    case 'NOT_EQUAL':
      return value !== operand;
    case 'NOT_CONTAIN':
      return !value.includes(operand);
    case 'START_WITH':
      return value.startsWith(operand);
    case 'NOT_START_WITH':
      return !value.startsWith(operand);
    case 'END_WITH':
      return value.endsWith(operand);
    case 'NOT_END_WITH':
      return !value.endsWith(operand);
    default:
      return value.includes(operand);
  }
};

const NUMBER_PREFIX_OPERATORS: Record<string, Operator> = {
  '>=': 'GREATER_OR_EQUAL',
  '<=': 'LESS_OR_EQUAL',
  '>': 'GREATER_THAN',
  '<': 'LESS_THAN',
};

const compareNumber = (value: number, operator: Operator | undefined, operand: number): boolean => {
  switch (operator) {
    case 'NOT_EQUAL':
      return value !== operand;
    case 'GREATER_THAN':
      return value > operand;
    case 'GREATER_OR_EQUAL':
      return value >= operand;
    case 'LESS_THAN':
      return value < operand;
    case 'LESS_OR_EQUAL':
      return value <= operand;
    default:
      return value === operand;
  }
};

const toFiniteNumber = (value: unknown): number | null => NumberUtilities.parseFiniteNumber(value, { trim: true });

const matchesNumberFilter = (rawValue: unknown, filter: any, operator: Operator | undefined): boolean => {
  // why: filter split-number phát ra `{ from, to }`; thiếu đầu nào thì đầu đó mở.
  if (filter && typeof filter === 'object' && !Array.isArray(filter)) {
    const from = toFiniteNumber(filter.from);
    const to = toFiniteNumber(filter.to);
    if (from === null && to === null) return true;
    const value = toFiniteNumber(rawValue);
    return value !== null && (from === null || value >= from) && (to === null || value <= to);
  }
  // why: prefix gõ tay như `>=5` là ý định tường minh nên thắng operator trên dropdown.
  const prefixed = typeof filter === 'string' ? /^\s*(>=|<=|>|<)(.*)$/.exec(filter) : null;
  const operand = toFiniteNumber(prefixed ? prefixed[2] : filter);
  if (operand === null) return true;
  const value = toFiniteNumber(rawValue);
  return value !== null && compareNumber(value, prefixed ? NUMBER_PREFIX_OPERATORS[prefixed[1]] : operator, operand);
};

export const matchesColumnFilter = <T>(
  data: T,
  columns: SdTableColumn<T>[] = [],
  rawColumnFilter: Partial<Record<string, any>> = {},
  columnOperator: Partial<Record<string, Operator>> = {}
): boolean => {
  for (const column of columns) {
    const { field, type } = column;
    const rawColVal = resolveFieldValue(data, field);
    // why: cột number đi riêng vì bước chuẩn hoá text bên dưới coi giá trị 0 (filter hoặc dòng) là rỗng.
    if (type === 'number') {
      if (!matchesNumberFilter(rawColVal, rawColumnFilter[field], resolveOperator(column, columnOperator))) {
        return false;
      }
      continue;
    }
    const filterValue: string = (rawColumnFilter[field] || '').toString().trim().toLowerCase();
    const columnValue: string = (rawColVal || '').toString().trim().toLowerCase();

    if (filterValue) {
      if (!columnValue && type !== 'datetime' && type !== 'date' && type !== 'time') {
        return false;
      }
      if (type === 'string') {
        if (!matchesText(columnValue, resolveOperator(column, columnOperator), filterValue)) {
          return false;
        }
      } else if (type === 'values' || type === 'lazy-values') {
        const columnType = column as SdTableColumnValues<T> | SdTableColumnLazyValues<T>;
        // why: chọn nhánh theo HÌNH DẠNG GIÁ TRỊ, không theo `option.selection`. Inline filter dropdown
        // multiple luôn phát ra mảng, còn dữ liệu hàng thường là scalar; trước đây nhánh lại chọn theo
        // array-ness của DỮ LIỆU HÀNG nên scalar row rơi xuống so sánh `===` với `['A','B'].toString()`
        // = 'a,b' và không bao giờ khớp (chọn 1 giá trị thì vô tình đúng, chọn từ 2 là mất hết dòng).
        const rawFilterValue = rawColumnFilter[field];
        const filterValues: string[] = (Array.isArray(rawFilterValue) ? rawFilterValue : [rawFilterValue])
          .map((v: any) => (v ?? '').toString().trim().toLowerCase())
          .filter(v => !!v);
        const columnValues: string[] = Array.isArray(rawColVal)
          ? rawColVal.map((i: any) => (Utilities.getNestedValue(i, columnType.option.valueField) ?? '').toString().trim().toLowerCase())
          : [columnValue];
        // why: nhiều giá trị = OR, khớp đúng operator `IN` mà SdConvertToPagingReq gửi cho server.
        if (filterValues.length && !filterValues.some(fv => columnValues.includes(fv))) {
          return false;
        }
      } else if (type === 'boolean') {
        if ((filterValue === '1' || filterValue === 'true') && columnValue !== '1' && columnValue !== 'true') {
          return false;
        } else if ((filterValue === '0' || filterValue === 'false') && columnValue !== '0' && columnValue !== 'false') {
          return false;
        }
      } else if (type === 'datetime' || type === 'date' || type === 'time') {
        const from = rawColumnFilter[field]?.from ?? rawColumnFilter[field];
        const to = rawColumnFilter[field]?.to ?? rawColumnFilter[field];
        const fromDate = DateUtilities.begin(from);
        const toDate = DateUtilities.end(to);
        if (fromDate || toDate) {
          if (!columnValue) {
            return false;
          }

          const columnTime = new Date(columnValue).getTime();
          const fromDateTime = fromDate?.getTime() || null;
          const toDateTime = toDate?.getTime() || null;

          if (fromDateTime && fromDateTime > columnTime) {
            return false;
          }
          if (toDateTime && columnTime > toDateTime) {
            return false;
          }
        }
      }
    }
  }
  return true;
};

export const filterLocalItems = <T, TItem extends LocalFilterItem<T>>(
  localItems: TItem[],
  option: FilterLocalItemsOption<T>,
  filterInfo: SdTableFilterRequest<T>
): FilterLocalItemsResult<T, TItem> => {
  const { columns } = option;
  const { rawColumnFilter, orderBy, orderDirection, pageSize, pageNumber } = filterInfo;
  const quickSearch = option.filter?.disabled ? undefined : option.filter?.quickSearch;
  const matchesData = (data: T) =>
    matchesColumnFilter(data, columns, rawColumnFilter, filterInfo.columnOperator) &&
    matchesQuickSearch(data, quickSearch, filterInfo.quickSearch);
  const treeOpt = option.tree;
  const treeSearch =
    option.type === 'local' &&
    treeOpt?.loadType === 'static' &&
    (hasActiveColumnFilter(rawColumnFilter, columns) || quickSearchConditions(quickSearch, filterInfo.quickSearch).length > 0);
  const treeSearchPredicate = treeSearch ? matchesData : undefined;

  const items = treeSearch
    ? localItems.filter(item => subtreeMatches(resolveItemData<T>(item), matchesData, treeOpt))
    : localItems.filter(item => matchesData(resolveItemData<T>(item)));

  if (orderBy && orderDirection) {
    const column = columns.find(e => e.field === orderBy);
    if (column) {
      const { type, field } = column;
      items.sort((tableItemCurrent, tableItemNext) => {
        const dataVal = resolveFieldValue(resolveItemData<T>(tableItemCurrent), field);
        const nextVal = resolveFieldValue(resolveItemData<T>(tableItemNext), field);

        return compareLocalValues(dataVal, nextVal, type, orderDirection);
      });
    }
  }

  return {
    filteredItems: items,
    items: items.filter((item, index) => index >= pageNumber * pageSize && index < (pageNumber + 1) * pageSize),
    total: items.length,
    treeSearchPredicate,
  };
};
