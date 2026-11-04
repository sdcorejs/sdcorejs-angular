import type { TemplateRef } from '@angular/core';
import type { SdBadgeData } from '@sdcorejs/angular/components/badge';
import type { NestedKeyOf } from '@sdcorejs/utils/models';
import type { SdTableRowMobileDefContext } from '../directives/sd-table-row-mobile-def.directive';

/** A leaf column of the table, by its `field`. Checked at build time (`NestedKeyOf<T>`) and at run time (leaf column). */
export type SdTableMobileField<T> = NestedKeyOf<T>;

/** A column value, or fixed text shown as is. */
export type SdTableMobileText<T> = SdTableMobileField<T> | { text: string };

/** Slots every mobile layout has. */
export interface SdTableMobileData<T> {
  /** First line, 15px medium. A missing or unknown field falls back to `mobile.rowLabel`, then `rowKey`. */
  title: SdTableMobileText<T>;
  /** Second line, one line cut with "…". */
  subtitle?: SdTableMobileText<T>;
  /** After the title. A field must be a column with `useBadge` (checked at run time), otherwise it shows as text. */
  badge?: SdTableMobileField<T> | SdBadgeData;
  /** Grid cells with the column title as label, in this order. */
  fields?: SdTableMobileField<T>[];
}

/** Data of a `card` (the only layout so far). */
export interface SdTableMobileCardData<T> extends SdTableMobileData<T> {
  /** First grid cell, medium weight. */
  highlight?: SdTableMobileField<T>;
  /**
   * Grid cells shown before the "{n} more fields" button, `highlight` included.
   * @defaultValue 4
   */
  maxFields?: number;
  /**
   * Not a card slot. why: TypeScript does not report excess properties of an object returned by an arrow function,
   * so `never` is what rejects `trailing` (a slot of the future `list` layout) on a card.
   */
  trailing?: never;
}

/** Second argument of `mobile.template.data`. */
export interface SdTableMobileDataContext {
  /** Zero-based data-row position on the current page, as in `SdTableRowMobileDefContext`. */
  index: number;
  selected: boolean;
}

/**
 * Builds the slots of one row. Called again when the rows are read again or `detectChanges()` runs, and when the index
 * or the selection of the row changes.
 */
export type SdTableMobileDataFn<T, D> = (item: T, context: SdTableMobileDataContext) => D;

/**
 * Body of the phone card: a consumer template, or slots built from the row (`data`). `layout` is fixed per table;
 * leaving it out means `'card'`.
 */
export type SdTableMobileTemplate<T> =
  | TemplateRef<SdTableRowMobileDefContext<T>>
  | { layout?: 'card'; data: SdTableMobileDataFn<T, SdTableMobileCardData<T>> };
