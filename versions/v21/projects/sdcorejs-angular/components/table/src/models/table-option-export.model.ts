import { SdNestedKeyOf } from '@sdcorejs/angular/utilities';
import { SdTableFilterRequest } from '../services/table-filter/table-filter.model';

export type SdTableOptionExport<T = any> = SdTableOptionExportDefault<T> | SdTableOptionExportCustom;

export interface SdTableOptionExportDefault<T = any> {
  type?: 'default';
  key?: string;
  visible?: 'ALL' | 'EXCEL' | 'CSV'; // Máº·c Ä‘á»‹nh lÃ  ALL
  enableUpload?: boolean;
  fileName?: string;
  max?: number; // Sá»‘ dÃ²ng dá»¯ liá»‡u tá»‘i Ä‘a cho phÃ©p export
  maxItemsPerRequest?: number; // Page size, default: 1000
  batch?: number; // Sá»‘ lÆ°á»£ng request má»—i láº§n gá»i, default: 1
  items?: (filterRequest: SdTableFilterRequest) => T[] | Promise<T[]> | Promise<{ items: any[]; total: number }>;
  // Trong trÆ°á»ng há»£p cÃ³ xá»­ lÃ½ logic vÃ  sá»‘ dÃ²ng render <> sá»‘ dÃ²ng tráº£ vá»
  mapping?: (items: T[], fileName?: string) => T[] | Promise<T[]>;
  columns?: SdTableOptionExportColumn<T>[];
  sheets?: SdTableOptionExportSheet[];
}

export interface SdTableOptionExportCustom {
  type: 'custom';
  onExport: (filterRequest: SdTableFilterRequest) => Promise<void>;
}

export interface SdTableOptionExportColumn<T = any> {
  field: SdNestedKeyOf<T>;
  title: string;
  description?: string;
  width?: string;
  transform?: (value: any, rowData: T) => string;
  export?: {
    disabled: boolean;
  };
}

export interface SdTableOptionExportSheet<T = any> {
  name: string;
  items: T[] | (() => T[] | Promise<T[]>);
  headers: { value: SdNestedKeyOf<T>; display: string }[];
}

