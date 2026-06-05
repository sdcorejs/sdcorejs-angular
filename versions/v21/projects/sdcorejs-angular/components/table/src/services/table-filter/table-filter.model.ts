/* eslint-disable @typescript-eslint/no-explicit-any */
import { TemplateRef } from '@angular/core';
import { SdSearch } from '@sdcorejs/angular/forms';
import { DateUtilities } from '@sdcorejs/angular/utilities';
import { Filter, NestedKeyOf, Operator, Order, PagingReq } from '@sdcorejs/utils/models';
import { Observable } from 'rxjs';
import { SdTableColumn } from '../../models/table-column.model';

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
  columnOperator?: Record<string, Operator>;

  columnFilter?: Record<string, any>; // Giá trị filter column

  externalFilter?: Record<string, any>; // Giá trị filter external

  notReload?: boolean; // Để nhận biết là chỉ set giá trị, không trigger change

  filtered?: boolean; // Để nhận biết là có đang lọc hay không
}

export interface SdTableFilterRequest<T = any> {
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

export interface SdTableOptionFilter<T = any> {
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
  collapsable?: boolean;

  /** Ẩn toolbar (xóa bộ lọc, thiết lập) của external filter, khi có ít external filter user không cần chức năng này */
  hideExternalFilterToolbar?: boolean;

  /** Hàm xử lý khi trigger clear filter từ external filter */
  onClearFilter?: () => void;
}

export const SdConvertToPagingReq = (
  filterRequest: SdTableFilterRequest,
  args: {
    columns?: SdTableColumn[];
    externalFilters?: SdTableExternalFilter[];
    fieldMapping?: Record<string, string>;
    orders?: Order[];
  }
): PagingReq => {
  const { externalFilters, columns, fieldMapping } = args;
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
        filters!.push({
          field,
          operator: externalFilter.defaultOperator || 'CONTAIN',
          data: value,
        } as Filter);
      } else if (externalFilter.type === 'boolean') {
        filters!.push({
          field,
          operator: 'EQUAL',
          data: value === true || value === 1 || value === 'true' || value === '1',
        });
      } else if (externalFilter.type === 'date') {
        if (typeof value === 'object' && 'from' in value && 'to' in value) {
          if (value?.from) {
            filters!.push({
              field,
              operator: 'GREATER_OR_EQUAL',
              data: DateUtilities.begin(value?.from)!.toISOString(),
            });
          }
          if (value?.to) {
            filters!.push({
              field,
              operator: 'LESS_THAN',
              data: DateUtilities.begin(DateUtilities.addDays(value?.to, 1))!.toISOString(),
            });
          }
        } else {
          if (DateUtilities.isDate(value)) {
            if (externalFilter.defaultOperator === 'GREATER_OR_EQUAL') {
              filters!.push({
                field,
                operator: 'GREATER_OR_EQUAL',
                data: DateUtilities.begin(value)!.toISOString(),
              });
            }
            if (externalFilter.defaultOperator === 'LESS_OR_EQUAL') {
              filters!.push({
                field,
                operator: 'LESS_THAN',
                data: DateUtilities.begin(DateUtilities.addDays(value, 1))!.toISOString(),
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
  // Xử lý column filter
  for (const column of columns || []) {
    const value = rawColumnFilter?.[column.field];
    const field = fieldMapping?.[column.field] || column.field;
    const operator = columnOperator?.[column.field] || column.filter?.operator?.default;
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
                from: DateUtilities.begin(value?.from)!.toISOString(),
                to: DateUtilities.end(value?.to)!.toISOString(),
              },
            });
          } else if (value?.from) {
            filters!.push({
              field,
              operator: 'GREATER_OR_EQUAL',
              data: DateUtilities.begin(value?.from)!.toISOString(),
            });
          } else if (value?.to) {
            filters!.push({
              field,
              operator: 'LESS_THAN',
              data: DateUtilities.begin(DateUtilities.addDays(value?.to, 1))!.toISOString(),
            });
          }
        } else {
          if (DateUtilities.isDate(value)) {
            filters!.push({
              field,
              operator: 'BETWEEN',
              data: {
                from: DateUtilities.begin(value)!.toISOString(),
                to: DateUtilities.end(value)!.toISOString(),
              },
            });
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
  // Xử lý orders
  if (orderBy && orderDirection) {
    req.orders!.push({
      field: orderBy,
      direction: orderDirection,
    });
  }
  return req;
};

export declare type SdTableExternalFilter<TData = any> =
  | TextFilter<TData>
  | DateFilter<TData>
  | DateTimeFilter<TData>
  | DateRangeFilter<TData>
  | NumberFilter<TData>
  | ValuesFilter<TData>
  | LazyValuesFilter<TData>
  | BooleanFilter<TData>
  | CustomFilter<TData>;

interface BaseFilter<TData = any> {
  field: string;
  title: string;
  defaultShowing?: boolean;
  required?: boolean; // Bật lên nếu bắt buộc phải có giá trị- mới thực hiện gọi API filter
  hidden?: boolean; // Ẩn filter
  defaultOperator?: Operator; // Đôi lúc cột string nhưng lại muốn tìm kiếm chính xác
  data?: TData; // Các tham số muốn truyền thêm để đánh dấu/nhận biết ..., ví dụ mappingField
  onChange?: (value: any) => void;
}

interface TextFilter<TData = any> extends BaseFilter<TData> {
  type: 'string';
  default?: string;
}

interface DateFilter<TData = any> extends BaseFilter<TData> {
  type: 'date';
  default?: Date | string;
  minDate?: string | number | Date;
  maxDate?: string | number | Date;
}

interface DateTimeFilter<TData = any> extends BaseFilter<TData> {
  type: 'datetime';
  default?: Date | string;
  minDate?: string | number | Date;
  maxDate?: string | number | Date;
}

interface DateRangeFilter<TData = any> extends BaseFilter<TData> {
  type: 'daterange';
  enableTime?: boolean;
  minDate?: string | number | Date;
  maxDate?: string | number | Date;
  default?: {
    from?: Date | string;
    to?: Date | string;
  };
}

interface NumberFilter<TData = any> extends BaseFilter<TData> {
  type: 'number';
  default?: number;
}

interface ValuesFilter<TData = any> extends BaseFilter<TData> {
  type: 'values';
  option: {
    valueField: string;
    displayField: string;
    items: any[] | (() => Promise<any[]>);
    selection?: 'AUTOCOMPLETE' | 'MULTIPLE' | 'MULTIPLEAUTOCOMPLETE';
  };
  default?: string | string[];
}

interface LazyValuesFilter<TData = any> extends BaseFilter<TData> {
  type: 'lazy-values';
  option: {
    valueField: string;
    displayField: string;
    items: SdSearch; // Filter
    selection?: 'MULTIPLE';
  };
  default?: string | string[];
}

interface BooleanFilter<TData = any> extends BaseFilter<TData> {
  type: 'boolean';
  option?: {
    displayOnTrue?: string;
    displayOnFalse?: string;
  };
  default?: boolean;
}

interface CustomFilter<TData = any> extends BaseFilter<TData> {
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
  };
}
