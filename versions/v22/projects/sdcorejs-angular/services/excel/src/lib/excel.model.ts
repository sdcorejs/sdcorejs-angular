export interface SdExcelTemplate {
  fileName?: string;
  columns: SdExcelTemplateColumn[];
  sheets?: SdExcelSheet[];
}
export interface SdExcelColumn {
  field: string;
  title: string;
  description?: string;
  width?: string;
  /**
   * Excel number-format code for numeric or `Date` data cells written by
   * {@link SdExcelService.export}, for example `'dd/mm/yyyy'`,
   * `'dd/mm/yyyy hh:mm:ss'`, `'hh:mm:ss'` or `'0.00'`.
   *
   * Defaults to no override: omitted, `undefined` and `''` preserve the existing
   * writer behavior. Any nonempty string is passed to ExcelJS without semantic
   * validation; use Excel format codes, not DateUtilities formatting tokens.
   * Formatting changes display only, never the value or timezone. Strings are
   * kept as text (with the usual formula neutralization), even if they look like
   * dates. Headers, descriptions, additional sheets, `generateTemplate()` and
   * `exportCSV()` ignore this property.
   *
   * For a time without a date, supply seconds since midnight divided by 86400.
   * Calendar serials use the Excel 1900 date system, including its leap-year
   * compatibility rule. The caller owns calendar conversion and valid ranges;
   * this service does not parse date strings or convert configured timezones.
   *
   * @example
   * ```ts
   * import { SdExcelColumn } from '@sdcorejs/angular/services/excel';
   * const column: SdExcelColumn = {
   *   field: 'day', title: 'Day', numFmt: 'dd/mm/yyyy',
   * };
   * // With excel.export({ columns: [column], items: [{ day: 46323 }] }),
   * // Excel displays 28/10/2026 as a date. The string '28/10/2026' stays text.
   * ```
   */
  numFmt?: string;
}

export interface SdExcelTemplateColumn extends SdExcelColumn {
  required?: boolean;
  color?: string;
  fontColor?: string;
  fill?: string;
}

export interface SdExcelSheet<T = any> {
  name: string;
  items: T[];
  headers: {
    value: Extract<keyof T, string>; // Trường muốn hiển thị
    display: string; // Label hiển thị
  }[];
}

export interface SdExcelExportOption<T = any> {
  columns: SdExcelTemplateColumn[];
  items: T[];
  fileName?: string;
  sheets?: SdExcelSheet[];
}
