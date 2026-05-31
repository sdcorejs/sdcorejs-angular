/* eslint-disable @typescript-eslint/no-explicit-any */
import { Signal, TemplateRef } from '@angular/core';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdSearch } from '@sdcorejs/angular/forms';
import { NestedKeyOf, Operator } from '@sdcorejs/utils/models';
import { SdUnwrapSignal } from '@sdcorejs/angular/utilities/models';

export type SdTableColumn<T = any> =
  | SdTableColumnText<T>
  | SdTableColumnNumber<T>
  | SdTableColumnBool<T>
  | SdTableColumnDate<T>
  | SdTableColumnValues<T>
  | SdTableColumnLazyValues<T>
  | SdTableColumnChildren<T>;

export type SdTableColumnTransformFunc<T = any> = (
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
type UseBadgeFunc<T = any> = (value: any, rowData: T) => Badge;
// 2. Dành cho cột có items (values / lazy-values)
// Thêm Generic K đại diện cho kiểu của 1 item trong danh sách
type UseBadgeValuesFunc<T = any, K = any> = (
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
  }
}

interface SdTableColumnBase<T = any> {
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
    // Chỉ dành cho filter inline column
    operator?: {
      default?: Operator;
      enable?: boolean;
      list?: Operator[];
    };
    filterDef?: TemplateRef<any>
  };
  export?: {
    disabled?: boolean;
    description?: string;
  };
}

interface SdTableColumnText<T = any> extends SdTableColumnBase<T> {
  field: NestedKeyOf<T>;
  type: 'string';
  useBadge?: UseBadgeFunc<T>;
}

interface SdTableColumnNumber<T = any> extends SdTableColumnBase<T> {
  field: NestedKeyOf<T>;
  type: 'number';
  useBadge?: UseBadgeFunc<T>;
  filter?: SdTableColumnBase['filter'] & { type?: 'split-number' };
}

interface SdTableColumnBool<T = any> extends SdTableColumnBase<T> {
  field: NestedKeyOf<T>;
  type: 'boolean';
  useBadge?: UseBadgeFunc<T>;
  option?: {
    displayOnTrue?: string;
    displayOnFalse?: string;
  };
}

interface SdTableColumnDate<T = any> extends SdTableColumnBase<T> {
  field: NestedKeyOf<T>;
  type: 'date' | 'datetime' | 'time';
  useBadge?: UseBadgeFunc<T>;
  filter?: SdTableColumnBase['filter'] & { type?: 'daterange' | 'date' | 'split-date' };
}

// Thêm Generic K (mặc định là any hoặc Record<string, any> để không lỗi code cũ)
export interface SdTableColumnValues<T = any, K = Record<string, any>> extends SdTableColumnBase<T> {
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

export interface SdTableColumnLazyValues<T = any, K = Record<string, any>> extends SdTableColumnBase<T> {
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

export type SdTableColumnNormal<T = any> = Exclude<SdTableColumn<T>, SdTableColumnChildren<T>>;

export interface SdTableColumnChildren<T = any> extends SdTableColumnBase<T> {
  field: string;
  type: 'children';
  children: SdTableColumnNormal<T>[];
}
