/* eslint-disable @typescript-eslint/no-explicit-any */
import { Signal, TemplateRef } from '@angular/core';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdSearch } from '@sdcorejs/angular/forms';
import { SdNestedKeyOf, SdOperator } from '@sdcorejs/angular/utilities';
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

// 1. DÃ nh cho cÃ¡c cá»™t bÃ¬nh thÆ°á»ng (KhÃ´ng cÃ³ items)
type UseBadgeFunc<T = any> = (value: any, rowData: T) => Badge;
// 2. DÃ nh cho cá»™t cÃ³ items (values / lazy-values)
// ThÃªm Generic K Ä‘áº¡i diá»‡n cho kiá»ƒu cá»§a 1 item trong danh sÃ¡ch
type UseBadgeValuesFunc<T = any, K = any> = (
  value: any,
  rowData: T,
  items: K[] // <-- Tráº£ vá» máº£ng dá»¯ liá»‡u Ä‘Ã£ load Ä‘á»ƒ tiá»‡n tra cá»©u
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
  hidden?: boolean; // áº¨n hoÃ n toÃ n
  invisible?: boolean; // Máº·c Ä‘á»‹nh áº©n
  fixed?: boolean; // Cá»‘ Ä‘á»‹nh cá»™t
  align?: 'right';
  htmlTemplate?: (value: any, rowData: T) => string;
  transform?: SdTableColumnTransformFunc<T>;
  tooltip?: (value: any, rowData: T) => string;
  click?: (value: any, rowData: T) => void;
  sortable?: boolean;
  filter?: {
    disabled?: boolean;
    default?: any;
    // Chá»‰ dÃ nh cho filter inline column
    operator?: {
      default?: SdOperator;
      enable?: boolean;
      list?: SdOperator[];
    };
    filterDef?: TemplateRef<any>
  };
  export?: {
    disabled?: boolean;
    description?: string;
  };
}

interface SdTableColumnText<T = any> extends SdTableColumnBase<T> {
  field: SdNestedKeyOf<T>;
  type: 'string';
  useBadge?: UseBadgeFunc<T>;
}

interface SdTableColumnNumber<T = any> extends SdTableColumnBase<T> {
  field: SdNestedKeyOf<T>;
  type: 'number';
  useBadge?: UseBadgeFunc<T>;
  filter?: SdTableColumnBase['filter'] & { type?: 'split-number' };
}

interface SdTableColumnBool<T = any> extends SdTableColumnBase<T> {
  field: SdNestedKeyOf<T>;
  type: 'boolean';
  useBadge?: UseBadgeFunc<T>;
  option?: {
    displayOnTrue?: string;
    displayOnFalse?: string;
  };
}

interface SdTableColumnDate<T = any> extends SdTableColumnBase<T> {
  field: SdNestedKeyOf<T>;
  type: 'date' | 'datetime' | 'time';
  useBadge?: UseBadgeFunc<T>;
  filter?: SdTableColumnBase['filter'] & { type?: 'daterange' | 'date' | 'split-date' };
}

// ThÃªm Generic K (máº·c Ä‘á»‹nh lÃ  any hoáº·c Record<string, any> Ä‘á»ƒ khÃ´ng lá»—i code cÅ©)
export interface SdTableColumnValues<T = any, K = Record<string, any>> extends SdTableColumnBase<T> {
  field: SdNestedKeyOf<T>;
  type: 'values';
  useBadge?: UseBadgeValuesFunc<T, K>;
  option: {
    // items bÃ¢y giá» sáº½ nháº­n máº£ng kiá»ƒu K
    items: K[] | Signal<K[]> | (() => Promise<K[]>);
    // Ã‰p kiá»ƒu: Chá»‰ Ä‘Æ°á»£c phÃ©p nháº­p cÃ¡c key cá»§a K (lÃ  chuá»—i)
    valueField: SdNestedKeyOf<K>;
    displayField: SdNestedKeyOf<K>;
    selection?: 'MULTIPLE';
  };
}

export interface SdTableColumnLazyValues<T = any, K = Record<string, any>> extends SdTableColumnBase<T> {
  field: SdNestedKeyOf<T>;
  type: 'lazy-values';
  useBadge?: UseBadgeFunc<T>;
  option: {
    // items (Filter) sáº½ tráº£ vá» dá»¯ liá»‡u kiá»ƒu K
    items: SdSearch<K>;
    // Ã‰p kiá»ƒu: Chá»‰ Ä‘Æ°á»£c nháº­p cÃ¡c key cÃ³ trong K
    valueField: SdNestedKeyOf<K>;
    displayField: SdNestedKeyOf<K>;
    // views (Hiá»ƒn thá»‹) cÅ©ng pháº£i tráº£ vá» máº£ng cÃ¡c object kiá»ƒu K
    // Náº¿u khÃ´ng cÃ³ tranform hay htmlTemplate cáº§n khai bÃ¡o views
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

