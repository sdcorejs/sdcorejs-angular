import type { TemplateRef } from '@angular/core';
import type { SdTableColumnNormal } from './table-column.model';

/** Numeric columns support every operation; date/datetime support COUNT/MIN/MAX; other data columns support COUNT. */
export type SdTableAggregateOperation = 'SUM' | 'AVERAGE' | 'COUNT' | 'MIN' | 'MAX';

/** Synchronous aggregate output. Strings render as text; HTML requires a template. Missing results render the table placeholder. */
export type SdTableAggregateResult = string | number | boolean | Date | null | undefined;

/** Metadata for the existing combined-field row group, never a synthetic data item. */
export interface SdTableAggregateGroup {
  /** Stable key used by the table's group collapse state. */
  readonly key: string;
  /** Raw values of the fields that identify this group. */
  readonly values: Readonly<Record<string, unknown>>;
}

/** Calculation metadata shared by callbacks and templates. Completeness is relative to the requested scope, not the database. */
export interface SdTableAggregateContext<T = unknown> {
  /** Leaf data column whose raw field is aggregated; functional and parent header columns are excluded. */
  readonly column: SdTableColumnNormal<T>;
  /** Grand total, row-group subtotal, or descendants of a tree parent. */
  readonly kind: 'total' | 'group' | 'tree';
  /** Requested page or locally filtered dataset; never silently changed for server tables. */
  readonly scope: 'page' | 'filtered';
  /** Combined-field group metadata, present only for group subtotals. */
  readonly group?: SdTableAggregateGroup;
  /** Original parent data item, present only for tree subtotals; it is excluded from subtotal items. */
  readonly parent?: T;
  /** False during loading/error, unsupported server filtered scope, or when required lazy children are missing. A loaded server page can be complete. */
  readonly isComplete: boolean;
}

/** Context for `TemplateRef`, including raw items and the optional calculated result. */
export interface SdTableAggregateTemplateContext<T = unknown, R = SdTableAggregateResult> extends SdTableAggregateContext<T> {
  /** Implicit raw item array, identical to `items`; excludes group headers and summary rows. */
  readonly $implicit: readonly T[];
  /** Raw data in the requested scope. May be partial when `isComplete` is false. Never mutate it or its items. */
  readonly items: readonly T[];
  /** Calculation result; undefined for template-only configurations or incomplete built-ins. */
  readonly value: R | undefined;
}

/**
 * Pure synchronous calculation on original consumer data. Do not mutate items or call APIs.
 * @param items Raw rows in scope, including available partial rows when context.isComplete is false.
 * @param context Scope, column, group/tree metadata and completeness.
 * @returns A synchronous display value. Promise/Observable results are unsupported. Strings are escaped.
 * @example `aggregate: items => items.length` counts rows, unlike COUNT which counts nonempty field values.
 */
export type SdTableAggregateCallback<T = unknown, R extends SdTableAggregateResult = SdTableAggregateResult> = (
  items: readonly T[],
  context: SdTableAggregateContext<T>
) => R;

/** Shared options; use SdTableColumnAggregate to require a calculation or template. */
export interface SdTableAggregateDefinition<T = unknown, O extends SdTableAggregateOperation = SdTableAggregateOperation> {
  /**
   * Built-in or pure synchronous callback. Templates receive its result without replacing the calculation.
   * @defaultValue undefined (template-only value is undefined)
   * @remarks COUNT excludes null/undefined, blank strings, empty arrays, nonfinite numbers and invalid Dates;
   * it counts 0, false, {}, and [null], once per row. SUM/AVERAGE/MIN/MAX number use valid numeric values;
   * AVERAGE divides by their number, not COUNT. Successful empty SUM/COUNT = 0; other empty built-ins = null.
   * Numeric strings accepted by the existing number formatter are supported; booleans, blank strings,
   * nonfinite values and locale currency strings are excluded. Date MIN/MAX use Date, native-parsable
   * date strings (including timezone offsets) or epoch milliseconds, matching local sorting.
   * Results use table number/date formatters; COUNT uses integer formatting. Missing values display `--`.
   * Incomplete built-ins return undefined; callbacks inspect isComplete and may describe partial data.
   * @example `{ calculate: 'SUM' }`
   */
  calculate?: O | SdTableAggregateCallback<T>;
  /**
   * Custom aggregate HTML. Overrides rendering, not calculation; template-only value is undefined.
   * @defaultValue undefined (safe text rendered with the table formatters)
   * @remarks Read the query only after the template exists. The example uses a static query and initializes
   * table options in ngOnInit, avoiding an undefined TemplateRef in the column definition.
   * @example
   * ```ts
   * import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
   * import { DecimalPipe } from '@angular/common';
   * import { SdTable, SdTableOption, SdTableAggregateTemplateContext } from '@sdcorejs/angular/components/table';
   * interface Order { amount: number; }
   * @Component({
   *   selector: 'app-order-summary',
   *   imports: [SdTable, DecimalPipe],
   *   template: `
   *     <ng-template #summary let-items let-value="value" let-kind="kind" let-isComplete="isComplete">
   *       @if (isComplete) {
   *         <strong>{{ value | number:'1.0-2' }}</strong>
   *         <small>{{ kind }} · {{ items.length }} bản ghi</small>
   *       } @else { <span>Chưa đủ dữ liệu</span> }
   *     </ng-template>
   *     @if (option) { <sd-table [option]="option" /> }
   *   `,
   * })
   * export class OrderSummary implements OnInit {
   *   @ViewChild('summary', { static: true }) summary!: TemplateRef<SdTableAggregateTemplateContext<Order>>;
   *   option?: SdTableOption<Order>;
   *   ngOnInit(): void {
   *     this.option = {
   *       type: 'local', items: () => [{ amount: 40 }, { amount: 60 }],
   *       columns: [{ field: 'amount', title: 'Amount', type: 'number',
   *         aggregate: { calculate: 'SUM', templateRef: this.summary } }],
   *     };
   *   }
   * }
   * ```
   * Remove calculate for a template-only summary; then use items/context because value is undefined.
   */
  templateRef?: TemplateRef<SdTableAggregateTemplateContext<T>>;
}

/** Column shorthand or nonempty object. Number/date operation restrictions are supplied by the column discriminant. */
export type SdTableColumnAggregate<T = unknown, O extends SdTableAggregateOperation = SdTableAggregateOperation> =
  | O
  | SdTableAggregateCallback<T>
  | (SdTableAggregateDefinition<T, O> &
      // Disjoint object branches let TypeScript resolve property JSDoc on consumer object literals.
      (| Required<Pick<SdTableAggregateDefinition<T, O>, 'templateRef'>>
        | (Required<Pick<SdTableAggregateDefinition<T, O>, 'calculate'>> & { templateRef?: never })
      ));

/** Selects data scope and optional subtotals; any visible aggregate column automatically enables the total row. */
export interface SdTableOptionAggregate {
  /**
   * page = current page after filtering; filtered = all locally filtered rows before pagination.
   * @defaultValue 'page'
   * @remarks Server filtered scope is unsupported: diagnostic + incomplete value, never a page fallback or an API request.
   * @example For 50 matching local records with pageSize 10, page counts up to 10 values; filtered counts up to 50.
   */
  scope?: 'page' | 'filtered';
  /**
   * Show a subtotal after each expanded row group. Collapse never changes the grand total.
   * @defaultValue false
   * @example `{ scope: 'page', group: true }` summarizes only each group's rows on this page.
   */
  group?: boolean;
  /**
   * Tree aggregation policy; does not enable option.tree. Ignored on non-tree tables.
   * @defaultValue undefined (tree tables aggregate known leaves without branch subtotals)
   * @example `{ tree: { items: 'roots' } }` totals root rows without requiring lazy descendants.
   */
  tree?: {
    /**
     * roots = scope roots (subtotal: direct children); leaves = known descendant leaves;
     * all = every node (subtotal: all descendants). The parent is excluded from its subtotal.
     * @defaultValue 'leaves'
     * @example Parent 100 with children 40 and 60 gives total roots=100, leaves=100, all=200.
     * @remarks Missing lazy children make leaves/all incomplete; roots can remain complete. Never fetch children for aggregation.
     */
    items?: 'roots' | 'leaves' | 'all';
    /**
     * Render a subtotal at the end of each expanded branch, using the selected items policy.
     * @defaultValue false
     * @example `{ tree: { items: 'leaves', subtotal: true } }` summarizes descendants without double-counting parents.
     */
    subtotal?: boolean;
  };
}
