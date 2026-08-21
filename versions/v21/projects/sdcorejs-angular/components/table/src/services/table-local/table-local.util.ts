import { DateUtilities } from '@sdcorejs/utils/fns';
import { Utilities } from '@sdcorejs/utils/fns';
import { SdTableColumn, SdTableColumnLazyValues, SdTableColumnValues } from '../../models/table-column.model';
import { SdTableItem } from '../../models/table-item.model';
import { SdTableOptionTree } from '../../models/table-option-tree.model';
import { SdTableFilterRequest } from '../table-filter/table-filter.model';
import { subtreeMatches } from '../tree/tree.util';

export interface FilterLocalItemsOption<T> {
  type: 'local' | 'server';
  columns: SdTableColumn<T>[];
  tree?: SdTableOptionTree<T>;
}

export interface FilterLocalItemsResult<T, TItem> {
  items: TItem[];
  total: number;
  treeSearchPredicate?: (data: T) => boolean;
}

type LocalFilterItem<T> = SdTableItem<T> | T;

const isTableItem = <T>(item: LocalFilterItem<T>): item is SdTableItem<T> =>
  !!item && typeof item === 'object' && 'data' in item && 'meta' in item;

const resolveItemData = <T>(item: LocalFilterItem<T>): T => (isTableItem(item) ? item.data : (item as T));

export const hasActiveColumnFilter = <T>(rawColumnFilter: Partial<Record<string, any>> = {}, columns: SdTableColumn<T>[] = []): boolean =>
  columns.some(col => {
    const v = rawColumnFilter[col.field];
    if (Array.isArray(v)) return v.length > 0;
    if (v && typeof v === 'object') return !!v.from || !!v.to;
    return v !== undefined && v !== null && v !== '';
  });

export const matchesColumnFilter = <T>(
  data: T,
  columns: SdTableColumn<T>[] = [],
  rawColumnFilter: Partial<Record<string, any>> = {}
): boolean => {
  for (const column of columns) {
    const { field, type } = column;
    const filterValue: string = (rawColumnFilter[field] || '').toString().trim().toLowerCase();
    const rawColVal = Utilities.getNestedValue(data, field);
    const columnValue: string = (rawColVal || '').toString().trim().toLowerCase();

    if (filterValue) {
      if (!columnValue && type !== 'datetime' && type !== 'date' && type !== 'time') {
        return false;
      }
      if (type === 'string') {
        if (columnValue.indexOf(filterValue) === -1) {
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
      } else if (type === 'number') {
        const fValue = +filterValue.replace('>=', '').replace('<=', '').replace('>', '').replace('<', '');
        const cValue = +columnValue;
        if (fValue || fValue === 0) {
          if (!cValue && cValue !== 0) {
            return false;
          }
          if (filterValue.indexOf('>=') > -1 && cValue < fValue) {
            return false;
          } else if (filterValue.indexOf('<=') > -1 && cValue > fValue) {
            return false;
          } else if (filterValue.indexOf('<') > -1 && cValue >= fValue) {
            return false;
          } else if (filterValue.indexOf('>') > -1 && cValue <= fValue) {
            return false;
          } else if (cValue !== fValue) {
            return false;
          }
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
  const matchesData = (data: T) => matchesColumnFilter(data, columns, rawColumnFilter);
  const treeOpt = option.tree;
  const treeSearch = option.type === 'local' && treeOpt?.loadType === 'static' && hasActiveColumnFilter(rawColumnFilter, columns);
  const treeSearchPredicate = treeSearch ? matchesData : undefined;

  const items = treeSearch
    ? localItems.filter(item => subtreeMatches(resolveItemData<T>(item), matchesData, treeOpt))
    : localItems.filter(item => matchesData(resolveItemData<T>(item)));

  if (orderBy && orderDirection) {
    const column = columns.find(e => e.field === orderBy);
    if (column) {
      const { type, field } = column;
      items.sort((tableItemCurrent, tableItemNext) => {
        const dataVal = Utilities.getNestedValue(resolveItemData<T>(tableItemCurrent), field);
        const nextVal = Utilities.getNestedValue(resolveItemData<T>(tableItemNext), field);

        if (type === 'number') {
          return (dataVal || 0) - (nextVal || 0);
        }
        if (type === 'date' || type === 'datetime' || type === 'time') {
          const d1 = new Date(dataVal || '').getTime();
          const d2 = new Date(nextVal || '').getTime();
          return d1 - d2;
        }
        const s1 = (dataVal || '').toString();
        const s2 = (nextVal || '').toString();
        if (s1 > s2) {
          return 1;
        }
        if (s1 < s2) {
          return -1;
        }
        return 0;
      });
      if (orderDirection === 'DESC') {
        items.reverse();
      }
    }
  }

  return {
    items: items.filter((item, index) => index >= pageNumber * pageSize && index < (pageNumber + 1) * pageSize),
    total: items.length,
    treeSearchPredicate,
  };
};
