import { Injectable } from '@angular/core';
// import hash from 'object-hash';
import { SdStorageService } from '@sdcorejs/angular/services';
import { Utilities } from '@sdcorejs/utils/fns';
import { Operator } from '@sdcorejs/utils/models';
import { map, startWith } from 'rxjs/operators';
import { SdTableFilterDefDirective } from '../../directives/sd-table-filter-def.directive';
import { SdTableColumn } from '../../models/table-column.model';
import {
  SdTableExternalFilter,
  SdTableOptionFilter,
  TableFilterConfiguration,
  TableFilterRegister,
  TableFilterValue,
} from './table-filter.model';

@Injectable()
export class SdTableFilterService {
  #filterConfiguration = 'GRID-FILTER-CONFIGURATION';
  #filterValue = 'GRID-FILTER-VALUE';
  #cache: Record<string, TableFilterRegister> = {};
  constructor(private storageService: SdStorageService) {}
  register = (
    filter: SdTableOptionFilter | undefined,
    args: {
      id: string;
      columns: SdTableColumn[] | undefined;
      externalFilters: SdTableExternalFilter[] | undefined;
      filterDefs: SdTableFilterDefDirective[] | undefined;
      columnOperator?: Record<string, Operator>;
    }
  ) => {
    let cacheSession = false;

    const { id, columns, externalFilters } = args;
    const tempKey = Utilities.hash({
      id,
      columns: columns?.map(e => e.field).filter(field => !!field) || [],
      externalFilters: externalFilters?.map(e => e.field).filter(field => !!field) || [],
    });
    const key = filter?.key || tempKey;
    if (!filter?.key) {
      cacheSession = true; // Nếu không có key thì chỉ lưu theo session
    }
    if (!this.#cache[key]) {
      // Setting của filter configuration
      const filterConfiguration = this.storageService.create<TableFilterConfiguration>(
        {
          prefix: this.#filterConfiguration,
          key,
        },
        {
          default: this.#defaultConfiguration(args),
          type: cacheSession ? 'session' : undefined,
        }
      );
      // Lấy giá trị configuration merge với giá trị defaultShowing của args nếu như args có thay đổi
      filterConfiguration.set(this.#initConfiguration(args, filterConfiguration.get()));
      // Setting của filter value
      const filterValue = this.storageService.create<TableFilterValue>(
        {
          prefix: this.#filterValue,
          key: !filter?.cacheable ? tempKey : key,
        },
        {
          default: this.#defaultValue(args),
          type: cacheSession || !filter?.cacheable ? 'session' : undefined,
        }
      );
      // Lấy giá trị value merge với giá trị default của args nếu như args có thay đổi
      filterValue.set(this.#initValue(args, filterValue.get()));
      this.#cache[key] = {
        configuration: {
          get: (): TableFilterConfiguration => {
            return filterConfiguration.get();
          },
          set: (configuration: Partial<TableFilterConfiguration>): TableFilterConfiguration => {
            const { inlineExternal } = configuration;
            filterConfiguration.set({
              inlineExternal: inlineExternal!,
            });
            return {
              inlineExternal: inlineExternal!,
            };
          },
          remove: () => {
            filterConfiguration.set(this.#defaultConfiguration(args));
          },
          observer: filterConfiguration.observer.pipe(
            startWith(filterConfiguration.get()),
            // Sử dụng mặc định nếu bị reset
            map(configuration => configuration || this.#defaultConfiguration(args))
          ),
        },
        value: {
          get: (): TableFilterValue => {
            return filterValue.get();
          },
          set: (value: Partial<TableFilterValue>): TableFilterValue => {
            const keys = Object.keys(value || {});
            const current = filterValue.get();
            const { columnOperator, columnFilter, externalFilter } = current;
            const updatedFilter = {
              // Filter column
              columnOperator: keys.includes('columnOperator') ? value?.columnOperator || {} : columnOperator,
              columnFilter: keys.includes('columnFilter') ? value?.columnFilter || {} : columnFilter,
              // Filter external
              externalFilter: keys.includes('externalFilter') ? value?.externalFilter || {} : externalFilter,
              // Force
              notReload: !!value?.notReload,
            };
            filterValue.set({
              ...updatedFilter,
              // Kiểm tra có đang lọc hay không
              filtered: this.#filtered(value),
            });
            return updatedFilter;
          },
          remove: () => {
            filterValue.set(this.#defaultValue(args));
          },
          observer: filterValue.observer.pipe(
            startWith(filterValue.get()),
            // Sử dụng mặc định nếu bị reset
            map(value => value || this.#defaultValue(args))
          ),
        },
      };
    }
    return this.#cache[key];
  };

  #filtered = (filterReq: Partial<TableFilterValue>): boolean => {
    const { columnFilter, externalFilter } = filterReq;
    if (
      Object.values({ ...columnFilter, ...externalFilter }).some(val => {
        // Nếu là mảng và mảng có phần tử thì xem như là có filter
        if (Array.isArray(val)) {
          return !!val.length;
        }
        // Nếu là object (date) và có from/to thì xem như là có filter
        if (val && typeof val === 'object') {
          if ('from' in val && !!val.from) {
            return true;
          }
          if ('to' in val && !!val.to) {
            return true;
          }
          return false;
        }
        return val !== undefined && val !== null && val !== '';
      })
    ) {
      return true;
    }
    return false;
  };

  #defaultConfiguration = (args: {
    columns: SdTableColumn[] | undefined;
    externalFilters: SdTableExternalFilter[] | undefined;
  }): TableFilterConfiguration => {
    const { externalFilters } = args;
    const inlineExternal: Record<string, boolean> = {};
    // Filter external
    for (const item of externalFilters || []) {
      inlineExternal[item.field] = !!item?.defaultShowing;
    }
    return {
      // Filter external
      inlineExternal,
    };
  };

  #defaultValue = (args: {
    columns: SdTableColumn[] | undefined;
    externalFilters: SdTableExternalFilter[] | undefined;
    columnOperator?: Record<string, Operator>;
  }): TableFilterValue => {
    const columnFilter: Record<string, any> = {};
    const externalFilter: Record<string, any> = {};
    const columnOperator: Record<string, Operator> = args.columnOperator || {};
    const { columns, externalFilters } = args;
    // Filter column
    for (const item of columns || []) {
      columnFilter[item.field] = item?.filter?.default;
      if (item?.filter?.operator?.enable && item?.filter?.operator?.default) {
        columnOperator[item.field] = item.filter.operator.default;
      }
    }
    // Filter external
    for (const item of externalFilters || []) {
      if (item.type === 'daterange') {
        externalFilter[item.field] = {
          from: item.default?.from,
          to: item.default?.to,
        };
      } else {
        externalFilter[item.field] = item?.default;
      }
      // externalFilter[item.field] = item?.default;
    }
    return {
      // Filter column
      columnFilter,
      // Filter external
      externalFilter,
      // columnOperator
      columnOperator,
    };
  };

  #initConfiguration = (
    args: {
      columns: SdTableColumn[] | undefined;
      externalFilters: SdTableExternalFilter[] | undefined;
      filterDefs: SdTableFilterDefDirective[] | undefined;
    },
    configuration: TableFilterConfiguration
  ): TableFilterConfiguration => {
    const { externalFilters } = args;
    const inlineExternal: Record<string, boolean> = {};
    // Filter external
    for (const item of externalFilters || []) {
      inlineExternal[item.field] = configuration?.inlineExternal?.[item.field] ?? item?.defaultShowing;
    }
    return {
      // Filter external
      inlineExternal,
    };
  };

  #initValue = (
    args: {
      columns: SdTableColumn[] | undefined;
      externalFilters: SdTableExternalFilter[] | undefined;
      filterDefs: SdTableFilterDefDirective[] | undefined;
      columnOperator?: Record<string, Operator>;
    },
    value: TableFilterValue
  ): TableFilterValue => {
    const columnFilter: Record<string, any> = {};
    const externalFilter: Record<string, any> = {};
    const columnOperator: Record<string, Operator> = args.columnOperator || {};
    const { columns, externalFilters } = args;
    // Filter column
    for (const item of columns || []) {
      columnFilter[item.field] = value?.columnFilter?.[item.field] ?? item?.filter?.default;
      if (item?.filter?.operator?.enable && item?.filter?.operator?.default) {
        columnOperator[item.field] = item.filter.operator.default;
      }
    }
    // Filter external
    for (const item of externalFilters || []) {
      if (item.type === 'daterange') {
        externalFilter[item.field] = {
          from: value?.externalFilter?.[item.field]?.from ?? item.default?.from,
          to: value?.externalFilter?.[item.field]?.to ?? item.default?.to,
        };
      } else {
        externalFilter[item.field] = value?.externalFilter?.[item.field] ?? item?.default;
      }
    }
    return {
      // Filter column
      columnFilter,
      // Filter external
      externalFilter,
      // columnOperator
      columnOperator,
    };
  };
}
