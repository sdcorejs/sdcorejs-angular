import { Injectable, inject, signal } from '@angular/core';
import { SdExcelColumn, SdExcelService } from '@sdcorejs/angular/services';
import { SdExcelSheet } from '@sdcorejs/angular/services/excel';
import { Utilities } from '@sdcorejs/utils/fns';
import { DateUtilities } from '@sdcorejs/angular/utilities/extensions';
import { SdTableColumn } from '../../models/table-column.model';
import { ConfiguredTableResult } from '../../models/table-option-config.model';
import { SdTableOptionExportColumn } from '../../models/table-option-export.model';
import { SdTableOption } from '../../models/table-option.model';
import { SdTableFilterRequest } from '../table-filter/table-filter.model';

export interface SdTableExportContext<T = any> {
  option: SdTableOption<T>;
  configuration?: ConfiguredTableResult;
  total: number;
  cacheObjValues: Record<string, Record<string, string>>;

  // Hàm callback để Service gọi ngược lại Component xin dữ liệu từng trang
  fetchChunk: (
    pageNumber: number,
    pageSize: number
  ) => Promise<
    | T[]
    | {
        items: any[];
        total: number;
      }
  >;

  // Dành cho custom export
  getFilterInfo: () => SdTableFilterRequest;
}

@Injectable()
export class TableExportService {
  #excelService = inject(SdExcelService);

  // ==========================================
  // SIGNAL STATE (Component sẽ bind trực tiếp vào đây)
  // ==========================================
  exporting = signal(false);
  exportTitle = signal('Export');

  // ==========================================
  // PUBLIC METHODS
  // ==========================================

  exportExcel = (context: SdTableExportContext, columns?: SdExcelColumn[]) => {
    return this.#processExport(context, { columns, isCSV: false });
  };

  exportCSV = (context: SdTableExportContext, columns?: SdExcelColumn[]) => {
    return this.#processExport(context, { columns, isCSV: true });
  };

  exportCustom = (context: SdTableExportContext) => {
    const { option, getFilterInfo } = context;
    if (option?.export?.type === 'custom') {
      this.exporting.set(true);
      option.export
        .onExport(getFilterInfo())
        .catch(err => {
          console.error(err);
          throw err;
        })
        .finally(() => {
          this.exporting.set(false);
        });
    }
  };

  // ==========================================
  // PRIVATE LOGIC
  // ==========================================

  async #processExport(context: SdTableExportContext, args: { columns?: SdExcelColumn[]; isCSV?: boolean }) {
    const { option, total, fetchChunk, cacheObjValues } = context;

    // `type` là optional trên SdTableOptionExportDefault — undefined cũng coi như 'default'.
    // Chỉ chặn nhánh 'custom' (đã có exportCustom xử lý riêng).
    if (option.export?.type === 'custom') return;

    const { isCSV } = args;
    try {
      const columns = this.#getExportColumns(context, args.columns);
      const pageSize = option.export?.maxItemsPerRequest || 1000;
      const batch = option.export?.batch || 1;

      let pageNumber = 0;
      let exportItems: any[] = [];
      let currentTotal = total; // Biến cục bộ để track total trả về từ fetchChunk

      this.exporting.set(true);
      const items: any[] = [];
      let promises: Promise<any[] | { items: any[]; total: number }>[] = [];

      const handleData = async () => {
        const results = await Promise.all(promises);
        promises = [];
        exportItems = [];

        for (const result of results) {
          if (result && 'items' in result) {
            exportItems = [...exportItems, ...result.items];
            currentTotal = result.total;
          } else if (Array.isArray(result)) {
            exportItems = [...exportItems, ...result];
          }
        }

        if (option.export?.type !== 'custom' && option.export?.mapping) {
          const mappedResults = option.export.mapping(exportItems);
          exportItems = mappedResults instanceof Promise ? await mappedResults : mappedResults;
        }

        const totalPage = Math.max(1, currentTotal / pageSize);
        const percent = Math.round(((pageNumber - 1) * 100.0) / totalPage);
        // Đảm bảo percent không vượt quá 100
        this.exportTitle.set(`Exporting...${Math.min(percent, 100)}%`);

        const allColumns = this.#allColumns(option);
        const allExportedColumns = this.#allExportedColumns(option);

        for (const item of exportItems) {
          const obj: any = {};

          const handle = async (exportColumn: SdExcelColumn) => {
            obj[exportColumn.field] = Utilities.getNestedValue(item, exportColumn.field);

            const column = allColumns.find(e => e.field === exportColumn.field);
            const exportedColumn = allExportedColumns.find(e => e.field === exportColumn.field);

            if (exportedColumn?.transform) {
              obj[exportedColumn.field] = exportedColumn.transform(Utilities.getNestedValue(item, exportedColumn.field), item);
              return;
            }
            if (!column) return;

            if (column.type === 'children') {
              column?.children?.forEach(childColumn =>
                handle({
                  field: childColumn.field,
                  title: typeof childColumn.title === 'string' ? childColumn.title : childColumn.title?.title,
                  width: childColumn.width,
                })
              );
              return;
            }
            if (!columns.some(e => e.field === column.field)) return;

            const itemValue = Utilities.getNestedValue(item, column.field as string);
            const fieldStr = column.field as string;

            if (column.transform) {
              const transform = column.transform(itemValue, item, { isExport: true });
              obj[fieldStr] = transform instanceof Promise ? await transform : transform;
              obj[fieldStr] = obj[fieldStr] ?? '';
            } else if (itemValue === undefined || itemValue === null || itemValue === '') {
              obj[fieldStr] = '';
            } else if (column.type === 'string' || column.type === 'number') {
              obj[fieldStr] = itemValue;
            } else if (column.type === 'boolean') {
              if (itemValue) {
                obj[fieldStr] = column.option?.displayOnTrue || 'True';
              } else if (obj[fieldStr] !== undefined && obj[fieldStr] !== null) {
                obj[fieldStr] = column.option?.displayOnFalse || 'False';
              }
            } else if (column.type === 'date') {
              obj[fieldStr] = DateUtilities.toFormat(itemValue, 'yyyy/MM/dd');
            } else if (column.type === 'datetime') {
              obj[fieldStr] = DateUtilities.toFormat(itemValue, 'yyyy/MM/dd HH:mm:ss');
            } else if (column.type === 'time') {
              obj[fieldStr] = DateUtilities.toFormat(itemValue, 'HH:mm:ss');
            } else if (column.type === 'values' || column.type === 'lazy-values') {
              const vals = (Array.isArray(itemValue) ? itemValue : [itemValue]).filter(e => !!e?.toString());
              obj[fieldStr] = vals.map(val => cacheObjValues[fieldStr]?.[val]?.[column.option.displayField as any] || val)?.join(', ');
            } else {
              obj[fieldStr] = itemValue;
            }
          };

          for (const exportColumn of columns) {
            await handle(exportColumn);
          }
          items.push(obj);
        }
      };

      // Vòng lặp lấy dữ liệu
      while (pageNumber * pageSize < currentTotal) {
        promises.push(fetchChunk(pageNumber, pageSize));
        pageNumber++;
        if (promises.length < batch) continue;
        await handleData();
      }

      if (promises.length > 0) {
        await handleData();
      }

      // Xuất file
      if (isCSV) {
        await this.#excelService.exportCSV({
          columns,
          items,
          fileName: option.export?.fileName,
        });
        return;
      }

      const sheets: SdExcelSheet[] = [];
      if (Array.isArray(option.export?.sheets)) {
        for (const sheet of option.export.sheets) {
          if (sheet.name && sheet.items && sheet.headers) {
            sheets.push({
              name: sheet.name,
              items: Array.isArray(sheet.items) ? sheet.items : await sheet.items(),
              headers: sheet.headers,
            });
          }
        }
      }

      await this.#excelService.export({
        columns,
        items,
        fileName: option.export?.fileName,
        sheets,
      });
    } finally {
      this.exporting.set(false);
      this.exportTitle.set('Export');
    }
  }

  #getExportColumns(context: SdTableExportContext, explicitColumns?: SdExcelColumn[]): SdExcelColumn[] {
    const { option, configuration } = context;
    let tableColumns: SdExcelColumn[] = [];

    option.columns
      .filter(e => !e.export?.disabled)
      .forEach(column => {
        if (column.type === 'children') {
          column.children
            ?.filter(e => !e.export?.disabled)
            .forEach(childColumn => {
              tableColumns.push({
                field: childColumn.field as string,
                title: typeof childColumn.title === 'string' ? childColumn.title : childColumn.title?.title,
                description: childColumn.export?.description,
                width: childColumn.width,
              });
            });
          return;
        }
        tableColumns.push({
          field: column.field as string,
          title: typeof column.title === 'string' ? column.title : column.title?.title,
          description: column.export?.description,
          width: column.width,
        });
      });

    if (configuration) {
      const displayColumns = [...configuration.firstColumns, ...configuration.secondColumns].reduce<SdTableColumn[]>((first, next) => {
        const column = option.columns.find(e => e.field === next.field);
        if (!column) return first;
        if (column.type !== 'children') return [...first, column];
        return [...first, ...column.children];
      }, []);

      tableColumns = displayColumns
        .map(e => ({ ...e, data: tableColumns.find(e1 => e1.field === e.field) }))
        .filter(e => !!e.data)
        .map(e => e.data!);
    }

    const columnFields = explicitColumns?.map(e => e.field) || [];

    if (option.export?.type !== 'custom') {
      return [...tableColumns, ...(option.export?.columns?.filter(e => !e.export?.disabled) || [])].filter(
        column => !columnFields?.length || columnFields.includes(column.field)
      );
    } else {
      return tableColumns.filter(column => !columnFields?.length || columnFields.includes(column.field));
    }
  }

  #allColumns(option: SdTableOption): SdTableColumn[] {
    const columns: SdTableColumn[] = [];
    option.columns
      ?.filter(e => !e.export?.disabled)
      .forEach(column => {
        if (column.type === 'children') {
          column.children?.filter(e => !e.export?.disabled).forEach(childColumn => columns.push(childColumn));
          return;
        }
        columns.push(column);
      });
    return columns;
  }

  #allExportedColumns(option: SdTableOption): SdTableOptionExportColumn[] {
    if (option.export?.type !== 'default') return [];
    return option.export?.columns?.filter(e => !e.export?.disabled) || [];
  }
}
