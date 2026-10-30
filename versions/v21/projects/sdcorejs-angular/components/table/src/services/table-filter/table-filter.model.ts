import { TemplateRef } from '@angular/core';
import type { SdSearch } from '@sdcorejs/angular/forms/models';
import { ɵSD_LOCAL_DATE_TIME, type SdDateTimeService } from '@sdcorejs/angular/services/date-time';
import { DateUtilities } from '@sdcorejs/utils/fns';
import { Filter, NestedKeyOf, Operator, Order, PagingReq } from '@sdcorejs/utils/models';
import { Observable } from 'rxjs';
import { SdTableColumn, SdTableColumnAnyRow } from '../../models/table-column.model';
import { SdTableOptionQuickSearch, SdTableQuickSearchValue } from './table-quick-search.model';
import { quickSearchConditions } from './table-quick-search.util';
import { isNoDataColumnOperator } from './table-filter-operator.util';
import { leafColumns } from '../column-leaf.util';
export type {
  SdTableOptionQuickSearch,
  SdTableQuickSearchFilter,
  SdTableQuickSearchFilterValue,
  SdTableQuickSearchValue,
} from './table-quick-search.model';

export interface SdTableQuickFilter {
  code: string;
  columnFilter: Record<string, any>;
  externalFilter: Record<string, any>;
}

export interface TableFilterConfiguration {
  // selectedQuickFilter: string;
  // quickFilters: SdGridMaterialQuickFilter[];
  // columnFilter?: Record<string, any>; // Giá trị filter column
  inlineExternal: Record<string, boolean>; // Ẩn hiện filter external
  // externalFilter?: Record<string, any>; // Giá trị filter external
}

export interface TableFilterValue {
  quickSearch?: SdTableQuickSearchValue;
  columnOperator?: Record<string, Operator>;

  columnFilter?: Record<string, any>; // Giá trị filter column

  externalFilter?: Record<string, any>; // Giá trị filter external

  notReload?: boolean; // Để nhận biết là chỉ set giá trị, không trigger change

  filtered?: boolean; // Để nhận biết là có đang lọc hay không
}

export interface SdTableFilterRequest<T = unknown> {
  /** Applied quick-search keyword and dropdown values; omitted when quick search is disabled. */
  quickSearch?: SdTableQuickSearchValue;
  columnOperator: Record<NestedKeyOf<T>, Operator>;
  rawColumnFilter: Record<NestedKeyOf<T>, any>;
  rawExternalFilter: Record<string, any>;
  pageNumber: number;
  pageSize: number;
  orderBy?: string;
  orderDirection?: Order['direction'];
  isExported?: boolean;
  visibledColumns?: SdTableColumn[];
}

export interface SdTableOptionFilter<T = unknown> {
  /** Optional compact search row above the table. */
  quickSearch?: SdTableOptionQuickSearch;
  /** Key định danh nếu muốn lưu cache */
  key?: string;

  /** Có bật cache giá trị filter hay không */
  cacheable?: boolean;

  /** Vô hiệu toàn bộ filter */
  disabled?: boolean;

  /** Ẩn tất cả inline filter (chỉ còn external), nếu chọn auto thì sẽ ẩn khi total row <= 10, phù hợp cho các màn detail có ít dữ liệu */
  hideInlineFilter?: boolean | 'auto';

  /** Hàm xử lý khi đổi Operator của filter column */
  operatorChange?: (column?: SdTableColumn, operator?: Operator) => void;

  /** Danh sách external filter */
  externalFilters?: SdTableExternalFilter[];

  /** Số lượng cột external filter trên mỗi hàng (mặc định: 6) */
  externalFilterPerRow?: 4 | 6;

  /** Chế độ thủ công: phải nhấn nút áp dụng mới gửi filter */
  manualFilter?: boolean;

  /** Có thể thu gọn bộ lọc hay không */
  collapsible?: boolean;

  /**
   * Trạng thái thu gọn ban đầu của external filter. Không đặt thì bảng chính của `sd-page-list` thu gọn khi màn
   * thấp (`compact`), các bảng khác mở. Bỏ qua khi `collapsible` là `false`.
   */
  externalFilterCollapsed?: boolean;

  /** Ẩn toolbar (xóa bộ lọc, thiết lập) của external filter, khi có ít external filter user không cần chức năng này */
  hideExternalFilterToolbar?: boolean;

  /** Hàm xử lý khi trigger clear filter từ external filter */
  onClearFilter?: () => void;

  /**
   * Giao diện lọc. `'query-bar'`: quick search, external filter và filter dưới cột gộp vào một `sd-query-bar` ở đầu
   * bảng; giá trị lọc, cache và `pagingReq` giữ nguyên như `'default'`. Mobile luôn dùng giao diện `'default'`.
   * @defaultValue 'default'
   */
  mode?: 'default' | 'query-bar';

  /** Chỉ dùng khi `mode` là `'query-bar'`. */
  queryBar?: SdTableOptionFilterQueryBar;
}

/** Tuỳ chọn của `filter.mode: 'query-bar'`. */
export interface SdTableOptionFilterQueryBar {
  /**
   * Cách sửa chip: control ngay trên thanh (`sd-query-bar` mode `'inline'`) hoặc popover. `sd-query-bar` đứng riêng
   * vẫn mặc định `'popover'`.
   * @defaultValue 'inline'
   */
  editor?: 'popover' | 'inline';
  /**
   * Thay danh sách chip ghim mặc định (quick filter đang hiện, external đang hiện inline hoặc `required`). Phần tử là
   * `field` của `quickSearch.filters` / `externalFilters` / `columns`. Field `required` luôn được ghim.
   */
  pinned?: string[];
  /** Field không đưa vào thanh; giá trị đang có vẫn được gửi đi. */
  exclude?: string[];
}

type FilterDates = Pick<SdDateTimeService, 'begin' | 'end' | 'beginOfNextDay' | 'parse'>;

/**
 * Machine-zone date math, exactly the payload sent before time zones: the local bounds of
 * `SdDateTimeService`, and a datetime still read by `new Date(value)`.
 */
const LOCAL_FILTER_DATES: FilterDates = { ...ɵSD_LOCAL_DATE_TIME, parse: value => new Date(value as string | number | Date) };

const hasFilterValue = (value: unknown): boolean => value !== undefined && value !== null && value !== '';

// why: `columns` nhận `SdTableColumnAnyRow[]` (= `SdTableColumn<never>[]`). Hàm chỉ đọc
// `field` / `type` / `filter.operator.default` — không bao giờ chạm dữ liệu hàng — nên không cần generic
// theo `T`; `never` ở vị trí contravariant khiến mọi `SdTableColumn<T>` vẫn truyền vào được sau khi
// default generic siết từ `any` sang `unknown`.
export const SdConvertToPagingReq = (
  filterRequest: SdTableFilterRequest,
  args: {
    columns?: SdTableColumnAnyRow[];
    externalFilters?: SdTableExternalFilter[];
    quickSearch?: SdTableOptionQuickSearch;
    fieldMapping?: Record<string, string>;
    orders?: Order[];
    /**
     * `inject(SdDateTimeService)` makes date filters follow `ISdCoreConfiguration.timeZone`: a day is
     * [its first instant, the first instant of the next calendar day) in the zone, and a zone-less
     * datetime is wall clock there. Omitted or `'local'`: the machine zone, as before.
     */
    dateTime?: Pick<SdDateTimeService, 'timeZone' | 'begin' | 'end' | 'beginOfNextDay' | 'parse'>;
  }
): PagingReq => {
  const { externalFilters, columns, fieldMapping } = args;
  const dates: FilterDates = args.dateTime && args.dateTime.timeZone !== 'local' ? args.dateTime : LOCAL_FILTER_DATES;
  const req: PagingReq = {
    filters: [],
    orders: args?.orders || [],
    pageNumber: filterRequest.pageNumber,
    pageSize: filterRequest.pageSize,
  };
  const { filters } = req;
  const { rawExternalFilter, rawColumnFilter, columnOperator, orderBy, orderDirection } = filterRequest;
  // Xử lý external filter
  for (const externalFilter of externalFilters || []) {
    const value = rawExternalFilter?.[externalFilter.field];
    const field = fieldMapping?.[externalFilter.field] || externalFilter.field;
    // Nếu có giá trị thì mới xử lý filter
    if (value !== undefined && value !== null && value !== '') {
      if (externalFilter.type === 'string') {
        if (externalFilter.defaultOperator === 'EQUAL' && typeof value === 'string' && value.includes(',')) {
          filters!.push({
            field,
            operator: 'IN',
            data: value.split(',').map(val => val.trim()),
          });
        } else {
          filters!.push({
            field,
            operator: externalFilter.defaultOperator || 'CONTAIN',
            data: value,
          } as Filter);
        }
      } else if (externalFilter.type === 'boolean') {
        filters!.push({
          field,
          operator: 'EQUAL',
          data: value === true || value === 1 || value === 'true' || value === '1',
        });
      } else if (externalFilter.type === 'daterange') {
        if (typeof value === 'object' && 'from' in value && 'to' in value) {
          if (value?.from) {
            filters!.push({
              field,
              operator: 'GREATER_OR_EQUAL',
              data: dates.begin(value?.from)!.toISOString(),
            });
          }
          if (value?.to) {
            filters!.push({
              field,
              operator: 'LESS_THAN',
              data: dates.beginOfNextDay(value?.to)!.toISOString(),
            });
          }
        }
      } else if (externalFilter.type === 'date' || externalFilter.type === 'datetime') {
        if (typeof value === 'object' && 'from' in value && 'to' in value) {
          if (value?.from) {
            filters!.push({
              field,
              operator: 'GREATER_OR_EQUAL',
              data: dates.begin(value?.from)!.toISOString(),
            });
          }
          if (value?.to) {
            filters!.push({
              field,
              operator: 'LESS_THAN',
              data: dates.beginOfNextDay(value?.to)!.toISOString(),
            });
          }
        } else if (DateUtilities.isDate(value)) {
          if (externalFilter.type === 'date') {
            if (externalFilter.defaultOperator === 'GREATER_OR_EQUAL') {
              filters!.push({
                field,
                operator: 'GREATER_OR_EQUAL',
                data: dates.begin(value)!.toISOString(),
              });
            }
            if (externalFilter.defaultOperator === 'LESS_OR_EQUAL') {
              filters!.push({
                field,
                operator: 'LESS_THAN',
                data: dates.beginOfNextDay(value)!.toISOString(),
              });
            }
          } else {
            if (externalFilter.defaultOperator === 'GREATER_OR_EQUAL') {
              filters!.push({
                field,
                operator: 'GREATER_OR_EQUAL',
                data: dates.parse(value)!.toISOString(),
              });
            }
            if (externalFilter.defaultOperator === 'LESS_OR_EQUAL') {
              filters!.push({
                field,
                operator: 'LESS_OR_EQUAL',
                data: dates.parse(value)!.toISOString(),
              });
            }
          }
        }
      } else {
        if (Array.isArray(value)) {
          if (value.length) {
            filters!.push({
              field,
              operator: 'IN',
              data: value,
            });
          }
        } else if (typeof value === 'object' && 'from' in value && 'to' in value) {
          if (value?.from) {
            filters!.push({
              field,
              operator: 'GREATER_OR_EQUAL',
              data: dates.begin(value?.from)!.toISOString(),
            });
          }
          if (value?.to) {
            filters!.push({
              field,
              operator: 'LESS_THAN',
              data: dates.beginOfNextDay(value?.to)!.toISOString(),
            });
          }
        } else {
          filters!.push({
            field,
            operator: externalFilter.defaultOperator || 'EQUAL',
            data: value,
          } as Filter);
        }
      }
    }
  }
  // Xử lý column filter — cột lá: cột con của header nhóm có filter riêng, header nhóm thì không.
  for (const column of leafColumns(columns)) {
    const value = rawColumnFilter?.[column.field];
    const field = fieldMapping?.[column.field] || column.field;
    const operator = columnOperator?.[column.field] || column.filter?.operator?.default;
    // why: NULL / NOT_NULL trên control mặc định — ô bị khoá và để trống — là filter không cần giá trị.
    if (isNoDataColumnOperator(column, operator)) {
      filters!.push({ field, operator });
      continue;
    }
    // Nếu có giá trị thì mới xử lý filter
    if (value !== undefined && value !== null && value !== '') {
      if (column.type === 'string') {
        filters!.push({
          field,
          operator: operator || 'CONTAIN',
          data: value,
        } as Filter);
      } else if (column.type === 'boolean') {
        filters!.push({
          field,
          operator: 'EQUAL',
          data: value === true || value === 1 || value === 'true' || value === '1',
        });
      } else if (column.type === 'date' || column.type === 'datetime') {
        if (typeof value === 'object' && 'from' in value && 'to' in value) {
          if (value?.from && value?.to) {
            filters!.push({
              field,
              operator: 'BETWEEN',
              data: {
                from: dates.begin(value?.from)!.toISOString(),
                to: dates.end(value?.to)!.toISOString(),
              },
            });
          } else if (value?.from) {
            filters!.push({
              field,
              operator: 'GREATER_OR_EQUAL',
              data: dates.begin(value?.from)!.toISOString(),
            });
          } else if (value?.to) {
            filters!.push({
              field,
              operator: 'LESS_THAN',
              data: dates.beginOfNextDay(value?.to)!.toISOString(),
            });
          }
        } else {
          if (DateUtilities.isDate(value)) {
            filters!.push({
              field,
              operator: 'BETWEEN',
              data: {
                from: dates.begin(value)!.toISOString(),
                to: dates.end(value)!.toISOString(),
              },
            });
          }
        }
      } else if (column.type === 'number' && typeof value === 'object' && !Array.isArray(value) && ('from' in value || 'to' in value)) {
        // why: the split-number filter emits an inclusive `{ from, to }`; a missing end leaves that side open, and 0 is a bound.
        const hasFrom = hasFilterValue(value.from);
        const hasTo = hasFilterValue(value.to);
        if (hasFrom && hasTo) {
          filters!.push({
            field,
            operator: 'BETWEEN',
            data: { from: value.from, to: value.to },
          });
        } else if (hasFrom) {
          filters!.push({
            field,
            operator: 'GREATER_OR_EQUAL',
            data: value.from,
          });
        } else if (hasTo) {
          filters!.push({
            field,
            operator: 'LESS_OR_EQUAL',
            data: value.to,
          });
        }
      } else {
        if (Array.isArray(value)) {
          if (value.length) {
            filters!.push({
              field,
              operator: 'IN',
              data: value,
            });
          }
        } else {
          filters!.push({
            field,
            operator: operator || 'EQUAL',
            data: value,
          } as Filter);
        }
      }
    }
  }
  filters!.push(...quickSearchConditions(args.quickSearch, filterRequest.quickSearch, fieldMapping));
  // Xử lý orders
  if (orderBy && orderDirection) {
    req.orders!.push({
      field: orderBy,
      direction: orderDirection,
    });
  }
  return req;
};

export declare type SdTableExternalFilter<TData = unknown> =
  | TextFilter<TData>
  | DateFilter<TData>
  | DateTimeFilter<TData>
  | DateRangeFilter<TData>
  | NumberFilter<TData>
  | ValuesFilter<TData>
  | LazyValuesFilter<TData>
  | BooleanFilter<TData>
  | CustomFilter<TData>;

interface BaseFilter<TData = unknown> {
  field: string;
  title: string;
  defaultShowing?: boolean;
  required?: boolean; // Bật lên nếu bắt buộc phải có giá trị- mới thực hiện gọi API filter
  hidden?: boolean; // Ẩn filter
  defaultOperator?: Operator; // Đôi lúc cột string nhưng lại muốn tìm kiếm chính xác
  data?: TData; // Các tham số muốn truyền thêm để đánh dấu/nhận biết ..., ví dụ mappingField
  onChange?: (value: any) => void;
}

interface TextFilter<TData = unknown> extends BaseFilter<TData> {
  type: 'string';
  default?: string;
}

interface DateFilter<TData = unknown> extends BaseFilter<TData> {
  type: 'date';
  default?: Date | string;
  minDate?: string | number | Date;
  maxDate?: string | number | Date;
}

interface DateTimeFilter<TData = unknown> extends BaseFilter<TData> {
  type: 'datetime';
  default?: Date | string;
  minDate?: string | number | Date;
  maxDate?: string | number | Date;
}

interface DateRangeFilter<TData = unknown> extends BaseFilter<TData> {
  type: 'daterange';
  enableTime?: boolean;
  minDate?: string | number | Date;
  maxDate?: string | number | Date;
  default?: {
    from?: Date | string;
    to?: Date | string;
  };
}

interface NumberFilter<TData = unknown> extends BaseFilter<TData> {
  type: 'number';
  default?: number;
}

interface ValuesFilter<TData = unknown> extends BaseFilter<TData> {
  type: 'values';
  option: {
    valueField: string;
    displayField: string;
    items: any[] | (() => Promise<any[]>);
    selection?: 'AUTOCOMPLETE' | 'MULTIPLE' | 'MULTIPLEAUTOCOMPLETE';
  };
  default?: string | string[];
}

interface LazyValuesFilter<TData = unknown> extends BaseFilter<TData> {
  type: 'lazy-values';
  option: {
    valueField: string;
    displayField: string;
    items: SdSearch; // Filter
    selection?: 'MULTIPLE';
  };
  default?: string | string[];
}

interface BooleanFilter<TData = unknown> extends BaseFilter<TData> {
  type: 'boolean';
  option?: {
    displayOnTrue?: string;
    displayOnFalse?: string;
  };
  default?: boolean;
}

interface CustomFilter<TData = unknown> extends BaseFilter<TData> {
  type: 'custom';
  // filterDef?: TemplateRef<SdTableFilterDefDirective>;
  filterDef?: TemplateRef<any>;
  default?: any;
}

export interface TableFilterRegister {
  configuration: {
    get: () => TableFilterConfiguration;
    set: (configuration: Partial<TableFilterConfiguration>) => TableFilterConfiguration;
    remove: () => void;
    observer: Observable<TableFilterConfiguration>;
  };
  value: {
    get: () => TableFilterValue;
    set: (value: Partial<TableFilterValue>) => TableFilterValue;
    remove: () => void;
    observer: Observable<TableFilterValue>;
    /** Giá trị mà `remove()` sẽ đặt — default của cột, external và quick search (signal đọc tại lúc gọi). Không ghi cache. */
    default?: () => TableFilterValue;
  };
}
