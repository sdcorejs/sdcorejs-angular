import { NestedKeyOf } from '@sdcorejs/utils/models';
import { SdTableFilterRequest } from '../services/table-filter/table-filter.model';

export type SdTableOptionExport<T = any> = SdTableOptionExportDefault<T> | SdTableOptionExportCustom;

export interface SdTableOptionExportDefault<T = any> {
  type?: 'default';
  key?: string;
  visible?: 'ALL' | 'EXCEL' | 'CSV'; // Mặc định là ALL
  enableUpload?: boolean;
  fileName?: string;
  /**
   * Số dòng tối đa được phép export (Excel/CSV). Khi tổng số dòng — tổng của server, số dòng local sau
   * lọc, hoặc tổng/số dòng mà `items` trả về trong lúc export — vượt `max`, export bị chặn: không ghi
   * file, hiện cảnh báo `core.component.table.export-max-exceeded`. Chỉ số dương hữu hạn mới là giới
   * hạn; bỏ trống thì không giới hạn.
   */
  max?: number;
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
