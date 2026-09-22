import { NumberUtilities, Utilities } from '@sdcorejs/utils/fns';
import { EMPTY_STR } from '@sdcorejs/utils/constants';
import type {
  SdTableAggregateContext,
  SdTableAggregateDefinition,
  SdTableAggregateOperation,
  SdTableAggregateResult,
  SdTableAggregateTemplateContext,
} from '../models/table-aggregate.model';
import type { SdTableColumnNormal } from '../models/table-column.model';
import type { SdTableOptionTree } from '../models/table-option-tree.model';
import type { SdTableOption } from '../models/table-option.model';
import type { TemplateRef } from '@angular/core';
import { getChildrenFromData, getVisibleChildrenData, isLazyTree } from './tree/tree.util';

/** Presence, deliberately independent of column type, formatting and dictionary hydration. */
export function hasAggregateValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.length > 0;
  if (value instanceof Date) return Number.isFinite(value.getTime());
  return true;
}

export function aggregateDefinition<T>(column: SdTableColumnNormal<T>): SdTableAggregateDefinition<T> | undefined {
  const aggregate = column.aggregate;
  if (aggregate === undefined) return undefined;
  if (typeof aggregate === 'string' || typeof aggregate === 'function') return { calculate: aggregate };
  if (!aggregate || (!aggregate.calculate && !aggregate.templateRef))
    throw new Error('[sd-table] aggregate requires calculate or templateRef.');
  return aggregate;
}

export function calculateAggregate<T>(
  items: readonly T[],
  context: SdTableAggregateContext<T>,
  definition: SdTableAggregateDefinition<T>
): SdTableAggregateResult {
  const calculate = definition.calculate;
  if (typeof calculate === 'function') {
    const result = calculate(items, context);
    if (result != null && typeof result === 'object' && !(result instanceof Date)) {
      throw new Error('[sd-table] aggregate callback must return a synchronous scalar or Date.');
    }
    return result;
  }
  if (!calculate) return undefined;
  validateOperation(context.column, calculate);
  if (!context.isComplete) return undefined;
  const values = items.map(item => Utilities.getNestedValue(item, context.column.field) as unknown);
  if (calculate === 'COUNT') return values.filter(hasAggregateValue).length;
  if (context.column.type === 'date' || context.column.type === 'datetime') {
    // Same accepted shapes/timezone semantics as local sorting: Date, native-parsable string, epoch milliseconds.
    const times = values
      .map(value =>
        value instanceof Date
          ? value.getTime()
          : (typeof value === 'string' && value.trim() !== '') || typeof value === 'number'
            ? new Date(value as string | number).getTime()
            : NaN
      )
      .filter(Number.isFinite);
    if (!times.length) return null;
    return new Date(times.reduce((best, value) => (calculate === 'MIN' ? Math.min(best, value) : Math.max(best, value))));
  }
  // Preserve the formatter's numeric-string convention, but never coerce booleans, blanks or locale-formatted currency.
  const numbers = values
    .filter(
      value =>
        (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) &&
        NumberUtilities.isNumber(value) &&
        Number.isFinite(Number(value))
    )
    .map(Number);
  if (!numbers.length) return calculate === 'SUM' ? 0 : null;
  if (calculate === 'MIN' || calculate === 'MAX')
    return numbers.reduce((best, value) => (calculate === 'MIN' ? Math.min(best, value) : Math.max(best, value)));
  const sum = numbers.reduce((total, value) => total + value, 0);
  return calculate === 'AVERAGE' ? sum / numbers.length : sum;
}

function validateOperation<T>(column: SdTableColumnNormal<T>, operation: SdTableAggregateOperation): void {
  const supported =
    column.type === 'number'
      ? ['SUM', 'AVERAGE', 'COUNT', 'MIN', 'MAX']
      : column.type === 'date' || column.type === 'datetime'
        ? ['COUNT', 'MIN', 'MAX']
        : ['COUNT'];
  if (!supported.includes(operation)) throw new Error(`[sd-table] aggregate ${operation} is not supported for ${column.type}.`);
}

export interface AggregateTreeSelection<T> {
  items: T[];
  isComplete: boolean;
}

/** Walk raw children, not expanded/formatted rows. A shared visited set prevents duplicate descendants and cycles. */
export function selectAggregateTreeItems<T>(
  roots: readonly T[],
  option: SdTableOptionTree<T>,
  mode: 'roots' | 'leaves' | 'all',
  loaded: ReadonlySet<T>,
  predicate?: (data: T) => boolean,
  excluded?: T
): AggregateTreeSelection<T> {
  const items: T[] = [];
  const visited = new Set<T>();
  if (excluded !== undefined) visited.add(excluded);
  let isComplete = true;
  const walk = (data: T): void => {
    if (visited.has(data)) return;
    visited.add(data);
    if (mode === 'roots') {
      items.push(data);
      return;
    }
    const rawChildren = getChildrenFromData(data, option);
    const unresolved = isLazyTree(option) && !rawChildren.length && !loaded.has(data) && option.hasChildren?.(data) !== false;
    if (unresolved) isComplete = false;
    const children = getVisibleChildrenData(data, option, predicate);
    // Filtering descendants out does not turn a known parent into a leaf.
    if (mode === 'all' || (!rawChildren.length && !unresolved)) items.push(data);
    for (const child of children) walk(child);
  };
  for (const root of roots) walk(root);
  return { items, isComplete };
}

export interface AggregateCell<T> {
  context: SdTableAggregateTemplateContext<T>;
  templateRef?: TemplateRef<SdTableAggregateTemplateContext<T>>;
  text: string;
}

export interface AggregateRow<T> {
  key: string;
  cells: ReadonlyMap<string, AggregateCell<T>>;
}

export interface AggregateSnapshot<T> {
  total?: AggregateRow<T>;
  groups: ReadonlyMap<string, AggregateRow<T>>;
  branches: ReadonlyMap<T, AggregateRow<T>>;
}

/** One snapshot per data/configuration revision. Renderers consume cached text/context only. */
export function buildAggregateSnapshot<T>(args: {
  columns: readonly SdTableColumnNormal<T>[];
  roots: readonly T[];
  option: SdTableOption<T>;
  complete: boolean;
  loadedChildren: ReadonlySet<T>;
  predicate?: (data: T) => boolean;
  format: (value: SdTableAggregateResult, column: SdTableColumnNormal<T>, operation?: SdTableAggregateOperation) => string;
  diagnose: (error: unknown) => void;
}): AggregateSnapshot<T> {
  const { option, roots, loadedChildren, predicate } = args;
  const columns = args.columns.filter(column => column.aggregate !== undefined);
  const snapshot: AggregateSnapshot<T> = { groups: new Map(), branches: new Map() };
  if (!columns.length) return snapshot;
  const scope = option.aggregate?.scope ?? 'page';
  const scopeComplete = args.complete && !(scope === 'filtered' && option.type === 'server');
  if (scope === 'filtered' && option.type === 'server')
    args.diagnose(new Error('[sd-table] aggregate scope filtered requires local data; server results are incomplete.'));
  const tree = option.tree;
  const mode = option.aggregate?.tree?.items ?? 'leaves';
  const selected = tree ? selectAggregateTreeItems(roots, tree, mode, loadedChildren, predicate) : { items: [...roots], isComplete: true };
  const build = (
    key: string,
    items: readonly T[],
    complete: boolean,
    context: Pick<SdTableAggregateContext<T>, 'kind' | 'group' | 'parent'>
  ): AggregateRow<T> => {
    const cells = new Map<string, AggregateCell<T>>();
    for (const column of columns) {
      const cellContext: SdTableAggregateTemplateContext<T> = {
        ...context,
        column,
        scope,
        isComplete: scopeComplete && complete,
        items,
        $implicit: items,
        value: undefined,
      };
      try {
        const definition = aggregateDefinition(column)!;
        const value = calculateAggregate(items, cellContext, definition);
        const resolved = { ...cellContext, value };
        const operation = typeof definition.calculate === 'string' ? definition.calculate : undefined;
        cells.set(column.field, { context: resolved, templateRef: definition.templateRef, text: args.format(value, column, operation) });
      } catch (error) {
        args.diagnose(error);
        cells.set(column.field, { context: { ...cellContext, isComplete: false }, text: EMPTY_STR });
      }
    }
    return { key, cells };
  };
  snapshot.total = build('total', selected.items, selected.isComplete, { kind: 'total' });
  // Grouping is a combined-field bucket in the existing table. Tree takes precedence over grouping.
  if (!tree && option.aggregate?.group && option.group?.fields.length) {
    const buckets = new Map<string, { values: Record<string, unknown>; items: T[] }>();
    for (const item of roots) {
      const values: Record<string, unknown> = {};
      for (const field of option.group.fields) values[field] = Utilities.getNestedValue(item, field);
      const key = Utilities.hash(values);
      if (!buckets.has(key)) buckets.set(key, { values, items: [] });
      buckets.get(key)!.items.push(item);
    }
    const groups = new Map<string, AggregateRow<T>>();
    for (const [key, bucket] of buckets)
      groups.set(key, build(`group-${key}`, bucket.items, true, { kind: 'group', group: { key, values: bucket.values } }));
    snapshot.groups = groups;
  }
  if (tree && option.aggregate?.tree?.subtotal) {
    const all = selectAggregateTreeItems(roots, tree, 'all', loadedChildren, predicate).items;
    const branches = new Map<T, AggregateRow<T>>();
    for (const parent of all) {
      const children = getVisibleChildrenData(parent, tree, predicate);
      const unknownChildren =
        isLazyTree(tree) &&
        !getChildrenFromData(parent, tree).length &&
        !loadedChildren.has(parent) &&
        tree.hasChildren?.(parent) !== false;
      if (!children.length && !unknownChildren) continue;
      const descendants = selectAggregateTreeItems(children, tree, mode, loadedChildren, predicate, parent);
      // Even roots mode needs the direct children of this parent to have been loaded.
      branches.set(
        parent,
        build(`tree-${branches.size}`, descendants.items, descendants.isComplete && !unknownChildren, { kind: 'tree', parent })
      );
    }
    snapshot.branches = branches;
  }
  return snapshot;
}
