import { InjectionToken } from '@angular/core';
import { SdTableOptionPaginate } from '../models/table-option-paginate.model';
import { SdTableOptionFilter } from '../services/table-filter/table-filter.model';
import { Operator } from '@sdcorejs/utils/models';
import { SdTableColumn } from '../models';

export interface ISdTableConfiguration {
  paginate?: {
    /** Số dòng mỗi trang. */
    pageSize?: SdTableOptionPaginate['pageSize'];

    /** Danh sách các tuỳ chọn số dòng/trang mà người dùng có thể chọn. */
    pages?: SdTableOptionPaginate['pages'];

    showFirstLastButtons?: SdTableOptionPaginate['showFirstLastButtons'];
  };
  filter?: {
    /** Ẩn bộ lọc dưới cột, nếu không cấu hình thì giá trị mặc định là false */
    hideInlineFilter?: SdTableOptionFilter['hideInlineFilter'];

    /** Số lượng external filter mỗi dòng, mặc định là 6 */
    externalFilterPerRow?: SdTableOptionFilter['externalFilterPerRow'];

    /**  Kích hoạt chế độ lọc thủ công, hiển thị nút áp dụng, mặc định là false */
    manualFilter?: SdTableOptionFilter['manualFilter'];

    /** Ẩn toolbar (xóa bộ lọc, thiết lập) của external filter, khi có ít external filter user không cần chức năng này, mặc định là false */
    hideExternalFilterToolbar?: SdTableOptionFilter['hideExternalFilterToolbar'];

    operator?: {
      list?: Partial<Record<SdTableColumn['type'], Operator[]>>;
      default?: Partial<Record<SdTableColumn['type'], Operator>>;
    };
  };
  images?: {
    filterRequired?: string; // Link ảnh cho table ở trạng thái cần nhập filter
    dataEmpty?: string; // Link ảnh cho table ở trạng thái không có dữ liệu
    filterEmpty?: string; // Link ảnh cho table ở trạng thái filter không có dữ liệu
  };
}

export const DEFAULT_TABLE_CONFIG: ISdTableConfiguration = {
  paginate: {
    pageSize: 20,
    pages: [20, 50, 100, 200],
  },
};

export const SD_TABLE_CONFIGURATION = new InjectionToken<ISdTableConfiguration>('sd-table.configuration');
