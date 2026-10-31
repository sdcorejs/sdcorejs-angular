import { DestroyRef, Injectable, inject } from '@angular/core';
// import hash from 'object-hash';
import { SdStorageService, SdStorageWithDefault } from '@sdcorejs/angular/services';
import { Utilities } from '@sdcorejs/utils/fns';
import { Operator } from '@sdcorejs/utils/models';
import { map } from 'rxjs/operators';
import { SdTableFilterDefDirective } from '../../directives/sd-table-filter-def.directive';
import { SdTableColumnAnyRow } from '../../models/table-column.model';
import {
  SdTableExternalFilter,
  SdTableOptionFilter,
  SdTableOptionQuickSearch,
  TableFilterConfiguration,
  TableFilterRegister,
  TableFilterValue,
} from './table-filter.model';
import { hasQuickSearchValue, initialQuickSearchValue } from './table-quick-search.util';
import { leafColumns } from '../column-leaf.util';

/** Giá trị `mode` hợp lệ của thiết lập bộ lọc; giá trị lạ trong storage (bản cũ, sửa tay) bị bỏ. */
const isFilterMode = (value: unknown): value is NonNullable<SdTableOptionFilter['mode']> => value === 'default' || value === 'query-bar';

@Injectable()
export class SdTableFilterService {
  private storageService = inject(SdStorageService);
  readonly #destroyRef = inject(DestroyRef);

  #filterConfiguration = 'GRID-FILTER-CONFIGURATION';
  #filterValue = 'GRID-FILTER-VALUE';
  #cache: Record<string, TableFilterRegister> = {};
  readonly #storageHandles = new Map<
    string,
    {
      configuration: SdStorageWithDefault<TableFilterConfiguration>;
      value: SdStorageWithDefault<TableFilterValue>;
    }
  >();

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {
    this.#destroyRef.onDestroy(() => {
      for (const key of [...this.#storageHandles.keys()]) this.#destroyStorageHandles(key);
    });
  }

  #hasOwnValue = (values: Record<string, unknown> | undefined, field: string): boolean => {
    return !!values && Object.prototype.hasOwnProperty.call(values, field);
  };

  #resolveKey = (
    filter: SdTableOptionFilter | undefined,
    args: {
      id: string;
      columns: SdTableColumnAnyRow[] | undefined;
      externalFilters: SdTableExternalFilter[] | undefined;
      quickSearch?: SdTableOptionQuickSearch;
    }
  ) => {
    const { id, columns, externalFilters } = args;
    const tempKey = Utilities.hash({
      id,
      columns: columns?.map(e => e.field).filter(field => !!field) || [],
      externalFilters: externalFilters?.map(e => e.field).filter(field => !!field) || [],
      ...(args.quickSearch
        ? {
            quickSearch: {
              containFields: args.quickSearch.containFields,
              equalFields: args.quickSearch.equalFields,
              filters: args.quickSearch.filters?.map(item => item.field),
            },
          }
        : {}),
    });
    return {
      tempKey,
      key: filter?.key || tempKey,
      cacheSession: !filter?.key,
    };
  };

  // why: `columns` khai báo `SdTableColumnAnyRow[]` (= `SdTableColumn<never>[]`) chứ không phải
  // `SdTableColumn[]`. Service filter chỉ đọc `field`/`type`/`filter` trên cột, không bao giờ chạm dữ
  // liệu hàng; sau khi default generic siết `any → unknown` thì `SdTableColumn<T>` hết tự khớp với
  // `SdTableColumn<unknown>` (T ở vị trí contravariant), nên đây là kiểu đúng thay vì quay lại `any`.
  register = (
    filter: SdTableOptionFilter | undefined,
    args: {
      id: string;
      columns: SdTableColumnAnyRow[] | undefined;
      externalFilters: SdTableExternalFilter[] | undefined;
      filterDefs: SdTableFilterDefDirective[] | undefined;
      columnOperator?: Record<string, Operator>;
      quickSearch?: SdTableOptionQuickSearch;
      force?: boolean;
    }
  ) => {
    args = { ...args, quickSearch: filter?.disabled ? undefined : (args.quickSearch ?? filter?.quickSearch) };
    const { key, tempKey, cacheSession } = this.#resolveKey(filter, args);
    if (args.force) {
      this.#destroyStorageHandles(key);
      delete this.#cache[key];
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
      let filterValue: SdStorageWithDefault<TableFilterValue> | undefined;
      try {
        // Lấy giá trị configuration merge với giá trị defaultShowing của args nếu như args có thay đổi
        filterConfiguration.set(this.#initConfiguration(args, filterConfiguration.get()));
        // Setting của filter value
        filterValue = this.storageService.create<TableFilterValue>(
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
      } catch (error: unknown) {
        filterValue?.destroy();
        filterConfiguration.destroy();
        throw error;
      }
      const activeFilterValue = filterValue;
      this.#storageHandles.set(key, { configuration: filterConfiguration, value: activeFilterValue });
      this.#cache[key] = {
        configuration: {
          get: (): TableFilterConfiguration => {
            return filterConfiguration.get();
          },
          set: (configuration: Partial<TableFilterConfiguration>): TableFilterConfiguration => {
            // why: mỗi nơi chỉ ghi phần của mình (external filter ghi inlineExternal, modal Thiết lập ghi mode) — phần
            // không truyền giữ nguyên; `mode: undefined` truyền tường minh thì xoá lựa chọn.
            const current = filterConfiguration.get();
            const mode = 'mode' in configuration ? configuration.mode : current?.mode;
            const next: TableFilterConfiguration = {
              inlineExternal: configuration.inlineExternal ?? current?.inlineExternal ?? {},
              ...(isFilterMode(mode) ? { mode } : {}),
            };
            filterConfiguration.set(next);
            return next;
          },
          remove: () => {
            filterConfiguration.set(this.#defaultConfiguration(args));
          },
          observer: filterConfiguration.observer.pipe(
            // Sử dụng mặc định nếu bị reset
            map(configuration => configuration || this.#defaultConfiguration(args))
          ),
        },
        value: {
          get: (): TableFilterValue => {
            return activeFilterValue.get();
          },
          set: (value: Partial<TableFilterValue>): TableFilterValue => {
            const keys = Object.keys(value || {});
            const current = activeFilterValue.get();
            const { columnOperator, columnFilter, externalFilter } = current;
            const updatedFilter = {
              // Filter column
              columnOperator: keys.includes('columnOperator') ? value?.columnOperator || {} : columnOperator,
              columnFilter: keys.includes('columnFilter') ? value?.columnFilter || {} : columnFilter,
              // Filter external
              externalFilter: keys.includes('externalFilter') ? value?.externalFilter || {} : externalFilter,
              ...(args.quickSearch
                ? {
                    quickSearch: keys.includes('quickSearch')
                      ? value.quickSearch || initialQuickSearchValue(args.quickSearch)
                      : current.quickSearch,
                  }
                : {}),
              // Force
              notReload: !!value?.notReload,
            };
            activeFilterValue.set({
              ...updatedFilter,
              // Kiểm tra có đang lọc hay không
              filtered: this.#filtered(updatedFilter),
            });
            return updatedFilter;
          },
          remove: () => {
            activeFilterValue.set(this.#defaultValue(args));
          },
          default: () => {
            const value = this.#defaultValue(args);
            // why: `#defaultValue` trả về chính object `args.columnOperator` (dùng chung với bảng) — tách ra để người
            // đọc không sửa nhầm vào đó.
            return { ...value, columnOperator: { ...value.columnOperator } };
          },
          observer: activeFilterValue.observer.pipe(
            // Sử dụng mặc định nếu bị reset
            map(value => value || this.#defaultValue(args))
          ),
        },
      };
    }
    return this.#cache[key];
  };

  #destroyStorageHandles = (key: string): void => {
    const handles = this.#storageHandles.get(key);
    if (!handles) return;
    this.#storageHandles.delete(key);
    handles.configuration.destroy();
    handles.value.destroy();
  };

  #filtered = (filterReq: Partial<TableFilterValue>): boolean => {
    const { columnFilter, externalFilter } = filterReq;
    if (filterReq.quickSearch?.term?.trim() || Object.values(filterReq.quickSearch?.filters || {}).some(hasQuickSearchValue)) return true;
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
    columns: SdTableColumnAnyRow[] | undefined;
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
    columns: SdTableColumnAnyRow[] | undefined;
    externalFilters: SdTableExternalFilter[] | undefined;
    columnOperator?: Record<string, Operator>;
    quickSearch?: SdTableOptionQuickSearch;
  }): TableFilterValue => {
    const columnFilter: Record<string, unknown> = {};
    const externalFilter: Record<string, unknown> = {};
    const columnOperator: Record<string, Operator> = args.columnOperator || {};
    const { columns, externalFilters } = args;
    // Filter column — cột lá, kể cả cột con của header nhóm.
    for (const item of leafColumns(columns)) {
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
      columnFilter,
      externalFilter,
      columnOperator,
      ...(args.quickSearch ? { quickSearch: initialQuickSearchValue(args.quickSearch) } : {}),
    };
  };

  #initConfiguration = (
    args: {
      columns: SdTableColumnAnyRow[] | undefined;
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
    const mode = configuration?.mode;
    return {
      // Filter external
      inlineExternal,
      ...(isFilterMode(mode) ? { mode } : {}),
    };
  };

  #initValue = (
    args: {
      columns: SdTableColumnAnyRow[] | undefined;
      externalFilters: SdTableExternalFilter[] | undefined;
      filterDefs: SdTableFilterDefDirective[] | undefined;
      columnOperator?: Record<string, Operator>;
      quickSearch?: SdTableOptionQuickSearch;
    },
    value: TableFilterValue
  ): TableFilterValue => {
    const columnFilter: Record<string, unknown> = {};
    const externalFilter: Record<string, unknown> = {};
    const columnOperator: Record<string, Operator> = args.columnOperator || {};
    const { columns, externalFilters } = args;
    // Filter column — cột lá, kể cả cột con của header nhóm.
    for (const item of leafColumns(columns)) {
      // why: null is a deliberate cached clear from SD controls; only a missing key should fall back to default.
      columnFilter[item.field] = this.#hasOwnValue(value?.columnFilter, item.field)
        ? value?.columnFilter?.[item.field]
        : item?.filter?.default;
      if (item?.filter?.operator?.enable && item?.filter?.operator?.default) {
        columnOperator[item.field] = item.filter.operator.default;
      }
    }
    // Filter external
    for (const item of externalFilters || []) {
      const hasExternalValue = this.#hasOwnValue(value?.externalFilter, item.field);
      if (item.type === 'daterange') {
        externalFilter[item.field] = {
          from: hasExternalValue ? value?.externalFilter?.[item.field]?.from : item.default?.from,
          to: hasExternalValue ? value?.externalFilter?.[item.field]?.to : item.default?.to,
        };
      } else {
        externalFilter[item.field] = hasExternalValue ? value?.externalFilter?.[item.field] : item?.default;
      }
    }
    return {
      columnFilter,
      externalFilter,
      columnOperator,
      ...(args.quickSearch ? { quickSearch: initialQuickSearchValue(args.quickSearch, value?.quickSearch) } : {}),
    };
  };
}
