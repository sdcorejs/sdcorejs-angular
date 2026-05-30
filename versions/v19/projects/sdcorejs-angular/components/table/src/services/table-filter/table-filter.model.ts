/* eslint-disable @typescript-eslint/no-explicit-any */
import { TemplateRef } from '@angular/core';
import { SdSearch } from '@sdcorejs/angular/forms';
import { DateUtilities } from '@sdcorejs/angular/utilities';
import { NestedKeyOf, Operator, Order, PagingReq } from '@sdcorejs/utils/models';
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
  // columnFilter?: Record<string, any>; // GiÃ¡ trá»‹ filter column
  inlineExternal: Record<string, boolean>; // áº¨n hiá»‡n filter external
  // externalFilter?: Record<string, any>; // GiÃ¡ trá»‹ filter external
}

export interface TableFilterValue {
  columnOperator?: Record<string, Operator>;

  columnFilter?: Record<string, any>; // GiÃ¡ trá»‹ filter column

  externalFilter?: Record<string, any>; // GiÃ¡ trá»‹ filter external

  notReload?: boolean; // Äá»ƒ nháº­n biáº¿t lÃ  chá»‰ set giÃ¡ trá»‹, khÃ´ng trigger change

  filtered?: boolean; // Äá»ƒ nháº­n biáº¿t lÃ  cÃ³ Ä‘ang lá»c hay khÃ´ng
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
  /** Key Ä‘á»‹nh danh náº¿u muá»‘n lÆ°u cache */
  key?: string;

  /** CÃ³ báº­t cache giÃ¡ trá»‹ filter hay khÃ´ng */
  cacheable?: boolean;

  /** VÃ´ hiá»‡u toÃ n bá»™ filter */
  disabled?: boolean;

  /** áº¨n táº¥t cáº£ inline filter (chá»‰ cÃ²n external), náº¿u chá»n auto thÃ¬ sáº½ áº©n khi total row <= 10, phÃ¹ há»£p cho cÃ¡c mÃ n detail cÃ³ Ã­t dá»¯ liá»‡u */
  hideInlineFilter?: boolean | 'auto';

  /** HÃ m xá»­ lÃ½ khi Ä‘á»•i Operator cá»§a filter column */
  operatorChange?: (column?: SdTableColumn, operator?: Operator) => void;

  /** Danh sÃ¡ch external filter */
  externalFilters?: SdTableExternalFilter[];

  /** Sá»‘ lÆ°á»£ng cá»™t external filter trÃªn má»—i hÃ ng (máº·c Ä‘á»‹nh: 6) */
  externalFilterPerRow?: 4 | 6;

  /** Cháº¿ Ä‘á»™ thá»§ cÃ´ng: pháº£i nháº¥n nÃºt Ã¡p dá»¥ng má»›i gá»­i filter */
  manualFilter?: boolean;

  /** CÃ³ thá»ƒ thu gá»n bá»™ lá»c hay khÃ´ng */
  collapsable?: boolean;

  /** áº¨n toolbar (xÃ³a bá»™ lá»c, thiáº¿t láº­p) cá»§a external filter, khi cÃ³ Ã­t external filter user khÃ´ng cáº§n chá»©c nÄƒng nÃ y */
  hideExternalFilterToolbar?: boolean;

  /** HÃ m xá»­ lÃ½ khi trigger clear filter tá»« external filter */
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
  // Xá»­ lÃ½ external filter
  for (const externalFilter of externalFilters || []) {
    const value = rawExternalFilter?.[externalFilter.field];
    const field = fieldMapping?.[externalFilter.field] || externalFilter.field;
    // Náº¿u cÃ³ giÃ¡ trá»‹ thÃ¬ má»›i xá»­ lÃ½ filter
    if (value !== undefined && value !== null && value !== '') {
      if (externalFilter.type === 'string') {
        filters!.push({
          field,
          operator: externalFilter.defaultOperator || 'CONTAIN',
          data: value,
        });
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
          });
        }
      }
    }
  }
  // Xá»­ lÃ½ column filter
  for (const column of columns || []) {
    const value = rawColumnFilter?.[column.field];
    const field = fieldMapping?.[column.field] || column.field;
    const operator = columnOperator?.[column.field] || column.filter?.operator?.default;
    // Náº¿u cÃ³ giÃ¡ trá»‹ thÃ¬ má»›i xá»­ lÃ½ filter
    if (value !== undefined && value !== null && value !== '') {
      if (column.type === 'string') {
        filters!.push({
          field,
          operator: operator || 'CONTAIN',
          data: value,
        });
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
          });
        }
      }
    }
  }
  // Xá»­ lÃ½ orders
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
  required?: boolean; // Báº­t lÃªn náº¿u báº¯t buá»™c pháº£i cÃ³ giÃ¡ trá»‹- má»›i thá»±c hiá»‡n gá»i API filter
  hidden?: boolean; // áº¨n filter
  defaultOperator?: Operator; // ÄÃ´i lÃºc cá»™t string nhÆ°ng láº¡i muá»‘n tÃ¬m kiáº¿m chÃ­nh xÃ¡c
  data?: TData; // CÃ¡c tham sá»‘ muá»‘n truyá»n thÃªm Ä‘á»ƒ Ä‘Ã¡nh dáº¥u/nháº­n biáº¿t ..., vÃ­ dá»¥ mappingField
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

