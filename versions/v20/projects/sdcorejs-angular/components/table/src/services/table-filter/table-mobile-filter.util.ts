import type { SdQueryField } from '@sdcorejs/angular/components/query-bar';
import type { Filter, Operator } from '@sdcorejs/utils/models';
import type { SdTableFilterDefDirective } from '../../directives/sd-table-filter-def.directive';
import type { SdTableColumnAnyRow } from '../../models/table-column.model';
import { leafColumns } from '../column-leaf.util';
import type { SdTableExternalFilter, TableFilterValue } from './table-filter.model';
import { type SdTableQueryContext, type SdTableQuerySource, sdTableQueryChipOf } from './table-query-bar.util';

/**
 * One filter of the phone UI (chip row and filter sheet).
 * - `source` + `field`: a filter the query-bar model can read — it gets a chip, a summary and the built-in controls.
 * - `custom`: a filter only its own control can edit (a template, a time column, an external filter the bar leaves
 *   out). It has a row in the filter sheet that opens that control, but no chip and no summary.
 */
export interface SdTableMobileFilterItem {
  /** `external:<field>` / `column:<field>` as on the query bar, `custom-*:<field>` otherwise. */
  key: string;
  label: string;
  source?: SdTableQuerySource;
  field?: SdQueryField;
  custom?:
    | { kind: 'column'; column: SdTableColumnAnyRow }
    | { kind: 'external'; external: SdTableExternalFilter }
    | { kind: 'def'; def: SdTableFilterDefDirective };
}

const titleOf = (column: SdTableColumnAnyRow): string =>
  (typeof column.title === 'string' ? column.title : column.title?.title) || column.field;

/**
 * Filters in the fixed phone order: external filters, then `sdTableFilterDef` templates, then columns (handoff 3, 5).
 * `ctx` comes from `sdTableQueryFields` over the same columns and external filters.
 */
export const sdTableMobileFilterItems = (args: {
  ctx: SdTableQueryContext;
  columns: readonly SdTableColumnAnyRow[];
  externalFilters?: readonly SdTableExternalFilter[];
  filterDefs?: readonly SdTableFilterDefDirective[];
}): SdTableMobileFilterItem[] => {
  const { ctx } = args;
  const fieldByKey = new Map(ctx.fields.map(field => [field.key as string, field]));
  const columns = leafColumns(args.columns);
  const defs = args.filterDefs ?? [];
  const defFields = new Set(defs.map(def => def.sdTableFilterDef()));
  const items: SdTableMobileFilterItem[] = [];
  const known = (key: string, label: string): boolean => {
    const source = ctx.sources.get(key);
    if (!source) return false;
    items.push({ key, label, source, field: fieldByKey.get(key) });
    return true;
  };

  for (const external of args.externalFilters ?? []) {
    if (known(`external:${external.field}`, external.title) || defFields.has(external.field)) continue;
    // why: a `custom` filter without a template has no control to open (the side drawer showed nothing either).
    if (external.type === 'custom' && !external.filterDef) continue;
    items.push({ key: `custom-external:${external.field}`, label: external.title, custom: { kind: 'external', external } });
  }
  for (const def of defs) {
    const field = def.sdTableFilterDef();
    const owner = columns.find(column => column.field === field);
    const external = args.externalFilters?.find(item => item.field === field);
    items.push({ key: `custom-def:${field}`, label: owner ? titleOf(owner) : (external?.title ?? field), custom: { kind: 'def', def } });
  }
  for (const column of columns) {
    if (known(`column:${column.field}`, titleOf(column))) continue;
    if (column.hidden || column.filter?.disabled || defFields.has(column.field) || ctx.covered.includes(column.field)) continue;
    items.push({ key: `custom-column:${column.field}`, label: titleOf(column), custom: { kind: 'column', column } });
  }
  return items;
};

const filled = (value: unknown): boolean => {
  if (value === null || value === undefined || value === '') return false;
  if (Array.isArray(value)) return value.some(filled);
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).some(filled);
  return true;
};

/** The chip of an item for a raw record, or `undefined` for a custom item. */
export const sdTableMobileFilterChip = (
  item: SdTableMobileFilterItem,
  value: TableFilterValue
): { filter: Filter; active: boolean } | undefined => (item.source ? sdTableQueryChipOf(item.source, value) : undefined);

/**
 * Whether an item filters something. A custom column counts when its raw value has content; templates write keys
 * the table cannot know, so they never count.
 */
export const sdTableMobileFilterActive = (item: SdTableMobileFilterItem, value: TableFilterValue): boolean => {
  if (item.source) return sdTableQueryChipOf(item.source, value).active;
  if (item.custom?.kind === 'column') return filled(value.columnFilter?.[item.custom.column.field]);
  if (item.custom?.kind === 'external') return filled(value.externalFilter?.[item.custom.external.field]);
  return false;
};

const NO_DATA: readonly Operator[] = ['NULL', 'NOT_NULL'];

/**
 * The raw record with one item cleared: no value, and a `NULL` / `NOT_NULL` column operator back to the default.
 * Custom template items are left alone (their keys are unknown).
 */
export const sdTableMobileFilterClear = (
  item: SdTableMobileFilterItem,
  value: TableFilterValue,
  ctx: SdTableQueryContext
): TableFilterValue => {
  const source = item.source;
  const column = source?.source === 'column' ? source.field : item.custom?.kind === 'column' ? item.custom.column.field : undefined;
  const external = source?.source === 'external' ? source.field : item.custom?.kind === 'external' ? item.custom.external.field : undefined;
  const next: TableFilterValue = {
    ...value,
    columnFilter: { ...value.columnFilter },
    columnOperator: { ...value.columnOperator },
    externalFilter: { ...value.externalFilter },
  };
  const empty = source?.shape === 'range' ? { from: null, to: null } : source?.shape === 'multi' ? [] : null;
  if (column !== undefined) {
    next.columnFilter![column] = item.custom ? undefined : empty;
    const operator = next.columnOperator![column];
    if (operator && NO_DATA.includes(operator)) {
      const fallback = ctx.defaultColumnOperator?.[column] ?? source?.column?.filter?.operator?.default;
      if (fallback) next.columnOperator![column] = fallback;
      else delete next.columnOperator![column];
    }
  }
  if (external !== undefined) next.externalFilter![external] = item.custom ? undefined : empty;
  return next;
};
