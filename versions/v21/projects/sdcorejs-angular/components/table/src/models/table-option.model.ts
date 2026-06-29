import { PagingReq } from '@sdcorejs/utils/models';
import { SdTableFilterRequest, SdTableOptionFilter } from '../services/table-filter/table-filter.model';
import { SdTableColumn } from './table-column.model';
import { SdTableCommand, SdTableCommandOption } from './table-command.model';
import { TableOptionConfig } from './table-option-config.model';
import { SdTableOptionExpand } from './table-option-expand.model';
import { SdTableOptionExport } from './table-option-export.model';
import { SdTableOptionGroup } from './table-option-group.model';
import { SdTableOptionPaginate } from './table-option-paginate.model';
import { SdTableOptionReload } from './table-option-reload.model';
import { SdTableOptionSelector } from './table-option-selector.model';
import { SdTableOptionSort } from './table-option-sort.model';
import { SdTableOptionStyle } from './table-option-style.model';
import { SdTableOptionTree } from './table-option-tree.model';

export type SdTableOption<T = any> = SdTableLocalOption<T> | SdTableServerOption<T>;

interface SdTableBaseOption<T = any> {
  /**
   * Key định danh của table option.
   * Thường dùng khi một số tính năng con cần lưu trạng thái riêng theo table,
   * ví dụ các option có hỗ trợ cache/config theo key.
   */
  key?: string;
  /**
   * Cấu hình hiển thị/phục hồi config của table.
   * Xem thêm kiểu chi tiết tại `TableOptionConfig`.
   */
  config?: TableOptionConfig;
  /**
   * Cấu hình chọn dòng (checkbox selector, action theo selection, pre-select...).
   * Xem thêm tại `SdTableOptionSelector`.
   */
  selector?: SdTableOptionSelector<T>;
  /**
   * Cấu hình expand row.
   * Xem thêm tại `SdTableOptionExpand` để biết cách disable, expand nhiều dòng,
   * hoặc luôn hiển thị vùng expand.
   */
  expand?: SdTableOptionExpand<T>;
  /**
   * Bật/tắt sorting ở cấp table.
   * Xem thêm tại `SdTableOptionSort`.
   */
  sort?: SdTableOptionSort;
  /**
   * Cấu hình phân trang.
   * Xem thêm tại `SdTableOptionPaginate`.
   */
  paginate?: SdTableOptionPaginate;
  /**
   * Cấu hình hành vi reload dữ liệu.
   * Xem thêm tại `SdTableOptionReload`.
   */
  reload?: SdTableOptionReload<T>;
  /**
   * Cấu hình export dữ liệu.
   * Xem thêm tại `SdTableOptionExport` để biết mode `default`/`custom`, mapping,
   * sheet export và giới hạn số dòng.
   */
  export?: SdTableOptionExport<T>;
  /**
   * Cấu hình group dữ liệu theo nhiều field.
   * Xem thêm tại `SdTableOptionGroup`.
   */
  group?: SdTableOptionGroup<T>;
  /**
   * Cấu hình tree rows — render children inline dưới parent.
   * Xem thêm tại `SdTableOptionTree`.
   */
  tree?: SdTableOptionTree<T>;
  /**
   * Cấu hình filter của table.
   * Xem thêm tại `SdTableOptionFilter` để biết filter inline, external filter,
   * manual filter, cacheable và callback clear filter.
   */
  filter?: SdTableOptionFilter;
  /**
   * Cấu hình cột đánh số thứ tự (STT) ở đầu mỗi dòng.
   * Khi enabled = true, table render thêm 1 cột STT (sticky đầu, sau selector).
   * Số thứ tự tính theo global index (pageIndex * pageSize + i + 1) để tương thích phân trang.
   */
  index?: {
    /** Bật/tắt cột STT. */
    enabled?: boolean;
    /** Tiêu đề header (mặc định '#'). */
    title?: string;
    /** Width của cột (mặc định '50px'). */
    width?: string;
  };
  /**
   * Bật cột filler ở cuối row để hấp thụ leftover width khi tổng width các cột data < container.
   * Khi enabled = true, các cột utility (selection / STT / command) không bị browser stretch trên màn rộng.
   * Mặc định off — table tự stretch cột data theo `width: 100%` như cũ.
   */
  filler?: {
    /** Bật/tắt cột filler. */
    enabled?: boolean;
  };
  /**
   * Cấu hình kéo-thả đổi thứ tự dòng.
   * Chỉ bật khi table cho phép reorder dữ liệu phía client.
   */
  rowReorder?: {
    /** Bật/tắt tính năng reorder row. */
    enabled?: boolean;
    /**
     * Callback sau khi reorder xong.
     * `newRows` là mảng sau khi đã đổi vị trí ở UI,
     * `movedItem` là item vừa được kéo,
     * `fromIndex` và `toIndex` là vị trí cũ/mới.
     */
    onChange?: (newRows: T[], movedItem: T, fromIndex: number, toIndex: number) => void;
    /**
     * Tên icon hiển thị cho drag handle.
     * Nếu không truyền thì table dùng icon reorder mặc định của Material.
     * Nếu truyền custom icon, nên dùng tên glyph của Material Icons:
     * https://fonts.google.com/icons
     */
    icon?: string;
    /**
     * Disable khả năng reorder theo từng dòng.
     * Trả về `true` để chặn kéo-thả dòng tương ứng.
     */
    disabled?: (row: T, index: number) => boolean;
  };
  /**
   * Danh sách command thao tác theo từng dòng.
   * Xem thêm tại `SdTableCommand`.
   */
  commands?: SdTableCommand<T>[];
  /**
   * Cấu hình vùng command tập trung.
   * Dùng khi cần set thêm alignment hoặc bọc danh sách command trong object option.
   * Xem thêm tại `SdTableCommandOption`.
   */
  command?: SdTableCommandOption<T>;
  /**
   * Danh sách cột hiển thị của table.
   * Đây là phần bắt buộc. Xem thêm tại `SdTableColumn` để cấu hình field, filter,
   * sort, transform, template và export của từng cột.
   */
  columns: SdTableColumn<T>[];
  /**
   * Cấu hình style/layout chung của table.
   * Xem thêm tại `SdTableOptionStyle`.
   */
  style?: SdTableOptionStyle<T>;
}

interface SdTableLocalOption<T = any> extends SdTableBaseOption<T> {
  /** Dùng dữ liệu local tại client. */
  type: 'local';
  /**
   * Hàm trả dữ liệu local cho table.
   * Table sẽ tự gọi hàm này để lấy mảng item nguồn.
   * Có thể trả về đồng bộ hoặc `Promise<T[]>`.
   */
  items: () => T[] | Promise<T[]>;
}

interface SdTableServerOption<T = any> extends SdTableBaseOption<T> {
  /** Dùng dữ liệu từ server, có paging/filter/sort theo request của table. */
  type: 'server';
  /**
   * Hàm lấy dữ liệu từ server.
   * `filterRequest` chứa trạng thái filter/sort/visible columns ở dạng của table.
   * `pagingReq` là dữ liệu paging đã được chuẩn hóa để dễ map sang API backend.
   * Hàm cần trả về `{ items, total }` để table render và tính phân trang.
   */
  items: (filterRequest: SdTableFilterRequest<T>, pagingReq: PagingReq<T>) => Promise<{ items: T[]; total: number }>;
  /**
   * Hook chạy khi table phát sinh filter request.
   * Dùng để can thiệp thêm trước/sau khi gọi API, ví dụ sync external state,
   * theo dõi trạng thái valid của external filter, hoặc ghi log request filter hiện tại.
   */
  onFilter?: (
    filterRequest: SdTableFilterRequest<T>,
    args: {
      /** Cho biết toàn bộ external filter hiện tại có hợp lệ để trigger filter hay không. */
      externalFilterValid: boolean;
    }
  ) => void;
}
