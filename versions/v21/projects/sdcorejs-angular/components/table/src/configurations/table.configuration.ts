import { InjectionToken } from '@angular/core';
import { SdTableOptionPaginate } from '../models/table-option-paginate.model';
import { SdTableOptionFilter } from '../services/table-filter/table-filter.model';
import { Operator } from '@sdcorejs/utils/models';
import { SdTableColumn, SdTableOptionLoading } from '../models';

export interface ISdTableConfiguration {
  /**
   * Khoá của cấu hình, dùng khi một portal có nhiều module với backend khác nhau. Bảng chọn bằng
   * `option.configurationKey`. Không khai `key`: cấu hình mặc định của portal, áp cho mọi bảng và là nền cho các cấu
   * hình có `key` (gộp theo từng field).
   */
  key?: string;
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

    /** Giao diện lọc mặc định cho mọi bảng; `option.filter.mode` thắng. Mặc định là `'default'`. */
    mode?: SdTableOptionFilter['mode'];

    /** Cho người dùng chọn giao diện lọc trong modal Thiết lập; `option.filter.modeSelectable` thắng. Mặc định là `true`. */
    modeSelectable?: SdTableOptionFilter['modeSelectable'];

    /**
     * Tuỳ chọn mặc định của mode `'query-bar'`; gộp theo từng field với `option.filter.queryBar`. Không có `savedFilters`:
     * khoá bộ lọc đã lưu phải riêng từng bảng.
     */
    queryBar?: Omit<NonNullable<SdTableOptionFilter['queryBar']>, 'savedFilters'>;

    /**
     * Operator của ô lọc theo cột, theo `type` của cột; chỉ áp cho cột bật `filter.operator.enable`.
     * - `list`: danh sách operator khi cột không khai `filter.operator.list`. Type không khai ở đây dùng bộ mặc định của
     *   thư viện (`DEFAULT_TABLE_CONFIG`: `string`, `number`); khai mảng rỗng để type đó không có operator.
     * - `default`: operator chọn sẵn; `filter.operator.default` của cột thắng.
     */
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
  /** Lớp hiển thị khi đang tải cho mọi bảng; `option.loading` của từng bảng thắng theo từng field. */
  loading?: SdTableOptionLoading;
  mobile?: {
    /**
     * Phone cards for tables without a card body (`sdTableRowMobileDef` or `mobile.template`): the card is built from
     * the visible columns. `mobile.template: false` opts a table out. Mặc định là `false`.
     */
    autoTemplate?: boolean;
  };
}

export const DEFAULT_TABLE_CONFIG: ISdTableConfiguration = {
  paginate: {
    pageSize: 20,
    pages: [20, 50, 100, 200],
  },
  filter: {
    // why: chỉ `string` và `number` có bộ mặc định — đó là hai type mà bảng thật sự dùng operator đã chọn, cả khi gửi
    // server (SdConvertToPagingReq) lẫn khi lọc local. boolean / date / datetime / time / values / lazy-values gửi
    // operator cố định (EQUAL / BETWEEN / IN) nên một danh sách chọn ở đó sẽ không có tác dụng.
    operator: {
      list: {
        string: ['CONTAIN', 'NOT_CONTAIN', 'EQUAL', 'NOT_EQUAL', 'START_WITH', 'END_WITH', 'NULL', 'NOT_NULL'],
        number: ['EQUAL', 'NOT_EQUAL', 'GREATER_THAN', 'GREATER_OR_EQUAL', 'LESS_THAN', 'LESS_OR_EQUAL', 'NULL', 'NOT_NULL'],
      },
      default: {
        string: 'CONTAIN',
        number: 'EQUAL',
      },
    },
  },
};

/** Operator áp cho một cột bật `filter.operator.enable`. */
export interface SdTableColumnOperatorDefaults {
  /** Danh sách của cột nếu cột tự khai, không thì theo type. Luôn là bản sao: bảng gán thẳng vào `column.filter.operator.list`. */
  list: Operator[];
  default?: Operator;
}

/**
 * Operator của một cột. Cột tự khai `filter.operator.list` thì dùng danh sách đó; không thì lấy theo `type`: cấu hình của ứng dụng (`SD_TABLE_CONFIGURATION`) thắng theo từng type, type không khai
 * thì dùng bộ mặc định của thư viện. Mảng rỗng trong cấu hình nghĩa là type đó không có operator.
 *
 * Operator chọn sẵn của thư viện chỉ đi cùng danh sách mặc định của thư viện. Cột hay ứng dụng tự khai danh sách mà
 * không khai `default` thì giữ như trước: không operator nào được chọn sẵn.
 */
export const resolveTableColumnOperators = (
  type: SdTableColumn['type'],
  configuration?: ISdTableConfiguration | null,
  columnList?: readonly Operator[] | null
): SdTableColumnOperatorDefaults => {
  const configured = configuration?.filter?.operator;
  const builtIn = DEFAULT_TABLE_CONFIG.filter?.operator;
  const declared = columnList?.length ? columnList : configured?.list?.[type];
  const list = [...(declared ?? builtIn?.list?.[type] ?? [])];
  return { list, default: configured?.default?.[type] ?? (declared ? undefined : builtIn?.default?.[type]) };
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

// why: gộp theo từng field để module chỉ khai phần khác với portal. Mảng (danh sách operator, `pages`) và giá trị không
// phải object thuần được thay nguyên khối — nối hai danh sách operator sẽ đưa lại operator mà backend của module không hỗ trợ.
const mergeConfiguration = <T>(base: T, override: T): T => {
  if (override === undefined) return base;
  if (!isPlainObject(base) || !isPlainObject(override)) return override;
  const result: Record<string, unknown> = { ...base };
  for (const [field, value] of Object.entries(override)) {
    result[field] = mergeConfiguration(result[field], value);
  }
  return result as T;
};

/**
 * Cấu hình áp cho một bảng. `SD_TABLE_CONFIGURATION` nhận một cấu hình hoặc một mảng (`multi: true`), giống
 * `SD_UPLOAD_FILE_CONFIGURATION` và `SD_PERMISSION_CONFIGURATION`:
 * - cấu hình không `key` là mặc định của portal;
 * - cấu hình có `key` trùng `option.configurationKey` được gộp lên trên mặc định của portal, theo từng field;
 * - `key` không khớp cấu hình nào thì dùng mặc định của portal.
 *
 * Hai cấu hình trùng `key` (kể cả hai cấu hình không `key`) là lỗi khai báo: ném lỗi thay vì âm thầm chọn một.
 */
export const resolveTableConfiguration = (
  source?: ISdTableConfiguration | readonly ISdTableConfiguration[] | null,
  key?: string | null
): ISdTableConfiguration | null => {
  const configurations = (Array.isArray(source) ? source : [source]).filter(
    (configuration): configuration is ISdTableConfiguration => !!configuration
  );
  const seen = new Set<string | undefined>();
  for (const configuration of configurations) {
    if (seen.has(configuration.key)) {
      throw new Error(`[sd-table] Duplicate table configuration key: ${configuration.key === undefined ? 'undefined' : configuration.key}`);
    }
    seen.add(configuration.key);
  }

  const portal = configurations.find(configuration => configuration.key === undefined);
  const keyed = key == null ? undefined : configurations.find(configuration => configuration.key === key);
  if (!keyed) return portal ?? null;
  return portal ? mergeConfiguration(portal, keyed) : keyed;
};

/**
 * Một cấu hình (`useValue`) hoặc nhiều cấu hình (`multi: true`, mỗi cấu hình một `key`). Xem `resolveTableConfiguration`.
 */
export const SD_TABLE_CONFIGURATION = new InjectionToken<ISdTableConfiguration>('sd-table.configuration');
