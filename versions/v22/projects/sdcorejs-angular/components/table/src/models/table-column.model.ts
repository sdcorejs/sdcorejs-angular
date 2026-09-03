import { Signal, TemplateRef } from '@angular/core';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import type { SdSearch } from '@sdcorejs/angular/forms/models';
import { NestedKeyOf, Operator } from '@sdcorejs/utils/models';
import { SdUnwrapSignal } from '@sdcorejs/angular/utilities/models';

export type SdTableColumn<T = unknown> =
  | SdTableColumnText<T>
  | SdTableColumnNumber<T>
  | SdTableColumnBool<T>
  | SdTableColumnDate<T>
  | SdTableColumnValues<T>
  | SdTableColumnLazyValues<T>
  | SdTableColumnChildren<T>;

/**
 * Cột bảng dùng ở các API **không quan tâm kiểu hàng** — chúng chỉ đọc `field` / `type` / `hidden` /
 * `filter` và không bao giờ chạm vào dữ liệu hàng (service filter, `SdConvertToPagingReq`, …).
 *
 * why: `SdTableColumn<T>` **bất biến (invariant)** theo `T`, vì `T` xuất hiện ở CẢ HAI chiều:
 * - covariant — `field: NestedKeyOf<T>`;
 * - contravariant — `transform` / `tooltip` / `click` / `useBadge` / `htmlTemplate` đều nhận `rowData: T`.
 *
 * Vì bất biến nên KHÔNG tồn tại siêu kiểu chung: `SdTableColumn<unknown>` hỏng ở chiều contravariant,
 * `SdTableColumn<never>` hỏng ở chiều covariant (`field` co về `never`). Trước đây default generic là
 * `any` nên mọi thứ gán được cho nhau — không phải vì kiểu đúng, mà vì `any` tắt kiểm tra hai chiều.
 *
 * Public default đã siết sang `unknown` (consumer viết `SdTableColumn<User>` sẽ được suy luận thật và
 * báo lỗi khi dùng sai). Riêng vài vị trí tham số NỘI BỘ row-agnostic dưới đây vẫn cần một escape
 * hatch: alias này khoanh vùng `any` vào đúng một chỗ có tài liệu, thay vì rải `any` khắp API công khai.
 */
export type SdTableColumnAnyRow = SdTableColumn<any>;

export type SdTableColumnTransformFunc<T = unknown> = (
  value: any,
  rowData: T,
  args?: {
    isExport?: boolean;
  }
) => string | Promise<string>;

interface Badge {
  type?: SdUnwrapSignal<SdBadge['type']>;
  color?: SdUnwrapSignal<SdBadge['color']>;
  icon?: SdUnwrapSignal<SdBadge['icon']>;
  title?: SdUnwrapSignal<SdBadge['title']>;
}

// 1. Dành cho các cột bình thường (Không có items)
type UseBadgeFunc<T = unknown> = (value: any, rowData: T) => Badge;
// 2. Dành cho cột có items (values / lazy-values)
// Thêm Generic K đại diện cho kiểu của 1 item trong danh sách
type UseBadgeValuesFunc<T = unknown, K = unknown> = (
  value: any,
  rowData: T,
  items: K[] // <-- Trả về mảng dữ liệu đã load để tiện tra cứu
) => Badge;

interface ColumnTitleOption {
  title: string;
  templateRef?: TemplateRef<any>;
}

interface ColumnCellOption {
  templateRef?: TemplateRef<any>;
  copiable?: boolean;
  truncate?: {
    enable?: boolean;
    type?: 'more' | 'tooltip';
  };
}

interface SdTableColumnBase<T = unknown> {
  title: string | ColumnTitleOption;
  cell?: ColumnCellOption;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  hidden?: boolean; // Ẩn hoàn toàn
  invisible?: boolean; // Mặc định ẩn
  fixed?: boolean; // Cố định cột
  align?: 'right';
  htmlTemplate?: (value: any, rowData: T) => string;
  transform?: SdTableColumnTransformFunc<T>;
  tooltip?: (value: any, rowData: T) => string;
  click?: (value: any, rowData: T) => void;
  sortable?: boolean;
  filter?: {
    disabled?: boolean;
    default?: any;
    onChange?: (value: any, column?: SdTableColumn<T>, columnFilter?: Record<string, any>) => void;
    // Chỉ dành cho filter inline column
    operator?: {
      default?: Operator;
      enable?: boolean;
      list?: Operator[];
    };
    filterDef?: TemplateRef<any>;
  };
  export?: {
    disabled?: boolean;
    description?: string;
  };
}

interface SdTableColumnText<T = unknown> extends SdTableColumnBase<T> {
  field: NestedKeyOf<T>;
  type: 'string';
  useBadge?: UseBadgeFunc<T>;
}

interface SdTableColumnNumber<T = unknown> extends SdTableColumnBase<T> {
  field: NestedKeyOf<T>;
  type: 'number';
  useBadge?: UseBadgeFunc<T>;
  filter?: SdTableColumnBase<T>['filter'] & { type?: 'split-number' };
}

interface SdTableColumnBool<T = unknown> extends SdTableColumnBase<T> {
  field: NestedKeyOf<T>;
  type: 'boolean';
  useBadge?: UseBadgeFunc<T>;
  option?: {
    displayOnTrue?: string;
    displayOnFalse?: string;
  };
}

interface SdTableColumnDate<T = unknown> extends SdTableColumnBase<T> {
  field: NestedKeyOf<T>;
  type: 'date' | 'datetime' | 'time';
  useBadge?: UseBadgeFunc<T>;
  filter?: SdTableColumnBase<T>['filter'] & { type?: 'daterange' | 'date' | 'split-date' };
}

// Thêm Generic K (mặc định là any hoặc Record<string, any> để không lỗi code cũ)
export interface SdTableColumnValues<T = unknown, K = Record<string, any>> extends SdTableColumnBase<T> {
  field: NestedKeyOf<T>;
  type: 'values';
  useBadge?: UseBadgeValuesFunc<T, K>;
  option: {
    // items bây giờ sẽ nhận mảng kiểu K
    items: K[] | Signal<K[]> | (() => Promise<K[]>);
    // Ép kiểu: Chỉ được phép nhập các key của K (là chuỗi)
    valueField: NestedKeyOf<K>;
    displayField: NestedKeyOf<K>;
    selection?: 'MULTIPLE';
  };
}

export interface SdTableColumnLazyValues<T = unknown, K = Record<string, any>> extends SdTableColumnBase<T> {
  field: NestedKeyOf<T>;
  type: 'lazy-values';
  useBadge?: UseBadgeFunc<T>;
  option: {
    // items (Filter) sẽ trả về dữ liệu kiểu K
    items: SdSearch<K>;
    // Ép kiểu: Chỉ được nhập các key có trong K
    valueField: NestedKeyOf<K>;
    displayField: NestedKeyOf<K>;
    // views (Hiển thị) cũng phải trả về mảng các object kiểu K
    // Nếu không có tranform hay htmlTemplate cần khai báo views
    views?: (values: string[]) => Promise<K[]>;
    selection?: 'MULTIPLE';
  };
}

export type SdTableColumnNormal<T = unknown> = Exclude<SdTableColumn<T>, SdTableColumnChildren<T>>;

export interface SdTableColumnChildren<T = unknown> extends SdTableColumnBase<T> {
  field: string;
  type: 'children';
  children: SdTableColumnNormal<T>[];
}
