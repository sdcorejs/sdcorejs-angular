import { NestedKeyOf } from '@sdcorejs/utils/models';
import { SdTableFilterRequest } from '../services/table-filter/table-filter.model';

export type SdTableOptionExport<T = any> = SdTableOptionExportDefault<T> | SdTableOptionExportCustom;

export interface SdTableOptionExportDefault<T = any> {
  type?: 'default';
  key?: string;
  visible?: 'ALL' | 'EXCEL' | 'CSV'; // Mặc định là ALL
  enableUpload?: boolean;
  fileName?: string;
  max?: number; // Số dòng dữ liệu tối đa cho phép export
  maxItemsPerRequest?: number; // Page size, default: 1000
  batch?: number; // Số lượng request mỗi lần gọi, default: 1
  items?: (filterRequest: SdTableFilterRequest) => T[] | Promise<T[]> | Promise<{ items: any[]; total: number }>;
  // Trong trường hợp có xử lý logic và số dòng render <> số dòng trả về
  mapping?: (items: T[], fileName?: string) => T[] | Promise<T[]>;
  columns?: SdTableOptionExportColumn<T>[];
  sheets?: SdTableOptionExportSheet[];
}

export interface SdTableOptionExportCustom {
  type: 'custom';
  onExport: (filterRequest: SdTableFilterRequest) => Promise<void>;
}

export interface SdTableOptionExportColumn<T = any> {
  field: NestedKeyOf<T>;
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
  headers: { value: NestedKeyOf<T>; display: string }[];
}
