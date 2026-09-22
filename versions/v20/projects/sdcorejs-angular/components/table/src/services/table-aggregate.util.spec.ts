import type { SdTableAggregateContext, SdTableAggregateOperation } from '../models/table-aggregate.model';
import type { SdTableColumn, SdTableColumnNormal } from '../models/table-column.model';
import {
  aggregateDefinition,
  buildAggregateSnapshot,
  calculateAggregate,
  hasAggregateValue,
  selectAggregateTreeItems,
} from './table-aggregate.util';
import type { SdTableOption } from '../models/table-option.model';
import type { TemplateRef } from '@angular/core';
import type { SdTableAggregateTemplateContext } from '../models/table-aggregate.model';

interface Row {
  value: unknown;
  children?: Row[];
}
const column: SdTableColumnNormal<Row> = { field: 'value', type: 'number', title: 'Value' };
const context: SdTableAggregateContext<Row> = { column, kind: 'total', scope: 'page', isComplete: true };
const calculate = (values: unknown[], op: SdTableAggregateOperation, ctx = context) =>
  calculateAggregate(
    values.map(value => ({ value })),
    ctx,
    { calculate: op }
  );

describe('table aggregate calculation', () => {
  it('COUNT distinguishes presence from truthiness and counts arrays once', () => {
    const excluded = [null, undefined, '', ' \t ', [], NaN, Infinity, -Infinity, new Date('invalid')];
    const included = [0, false, {}, [null], [1, 2], '0', 'invalid date', true, new Date(0)];
    excluded.forEach(value => expect(hasAggregateValue(value)).toBeFalse());
    included.forEach(value => expect(hasAggregateValue(value)).toBeTrue());
    expect(calculate([...excluded, ...included], 'COUNT')).toBe(included.length);
  });
  it('calculates valid numbers with a numeric denominator, not COUNT', () => {
    const values = [0, 10, '20', false, '', ' ', '1.200.000 đ', {}, null, NaN, Infinity];
    expect(calculate(values, 'SUM')).toBe(30);
    expect(calculate(values, 'AVERAGE')).toBe(10);
    expect(calculate(values, 'MIN')).toBe(0);
    expect(calculate(values, 'MAX')).toBe(20);
  });
  it('distinguishes successful emptiness from incomplete data', () => {
    for (const op of ['SUM', 'COUNT', 'AVERAGE', 'MIN', 'MAX'] as const) {
      expect(calculate([], op)).toBe(op === 'SUM' || op === 'COUNT' ? 0 : null);
      expect(calculate([10], op, { ...context, isComplete: false })).toBeUndefined();
    }
  });
  it('compares dates as instants, preserving timezone offsets', () => {
    const dateContext: SdTableAggregateContext<Row> = { ...context, column: { title: 'Date', field: 'value', type: 'datetime' } };
    const values = ['2026-01-01T08:00:00+07:00', '2026-01-01T02:00:00Z', new Date('invalid'), '', false];
    expect(calculate(values, 'MIN', dateContext)).toEqual(new Date('2026-01-01T01:00:00Z'));
    expect(calculate(values, 'MAX', dateContext)).toEqual(new Date('2026-01-01T02:00:00Z'));
  });
  it('passes exact raw objects/context to callbacks, including incomplete scopes', () => {
    const items: Row[] = [{ value: null }];
    const ctx = { ...context, isComplete: false };
    const callback = jasmine.createSpy().and.returnValue('partial');
    expect(calculateAggregate(items, ctx, { calculate: callback })).toBe('partial');
    expect(callback).toHaveBeenCalledOnceWith(items, ctx);
    expect(calculateAggregate(items, context, {})).toBeUndefined();
  });
  it('rejects invalid operations and empty definitions at runtime', () => {
    expect(() => calculate([1], 'MAX', { ...context, column: { title: 'Time', field: 'value', type: 'time' } })).toThrowError(
      /not supported/
    );
    expect(() => aggregateDefinition({ ...column, aggregate: {} } as SdTableColumnNormal<Row>)).toThrowError(/requires/);
  });
  it('COUNT has the same raw presence semantics for every data column type', () => {
    for (const type of ['string', 'boolean', 'number', 'date', 'datetime', 'time', 'values', 'lazy-values'] as const) {
      const ctx = { ...context, column: { ...column, type } as SdTableColumnNormal<Row> };
      expect(calculate([null, undefined, '', ' ', [], NaN, Infinity, new Date('invalid'), 0, false, {}, [null]], 'COUNT', ctx)).toBe(4);
    }
  });
  it('rejects async callback results at runtime', () => {
    expect(() => calculateAggregate([], context, { calculate: (() => Promise.resolve(1)) as never })).toThrowError(/synchronous/);
  });
  it('uses epoch and Date values for date MIN/MAX without parsing locale display numbers', () => {
    const ctx = { ...context, column: { ...column, type: 'date' } as SdTableColumnNormal<Row> };
    expect(calculate([new Date(1000), 0, 'invalid', null], 'MIN', ctx)).toEqual(new Date(0));
    expect(calculate([null, 'invalid', new Date('invalid')], 'MAX', ctx)).toBeNull();
  });
});

describe('aggregate snapshot', () => {
  function snapshot(roots: Row[], option: Partial<SdTableOption<Row>> = {}) {
    return buildAggregateSnapshot({
      roots,
      option: { type: 'local', items: () => roots, columns: [], ...option } as SdTableOption<Row>,
      columns: [{ field: 'value', title: '', type: 'number', aggregate: 'SUM' }],
      complete: true,
      loadedChildren: new Set<Row>(),
      format: value => String(value),
      diagnose: error => {
        throw error;
      },
    });
  }
  it('does not put the parent into its own subtotal when a graph cycles back', () => {
    const parent: Row = { value: 100 };
    const child: Row = { value: 40, children: [parent] };
    parent.children = [child];
    const result = snapshot([parent], { tree: { loadType: 'static' }, aggregate: { tree: { items: 'all', subtotal: true } } });
    expect(result.total!.cells.get('value')!.context.value).toBe(140);
    expect(result.branches.get(parent)!.cells.get('value')!.context.items).toEqual([child]);
  });
  it('keeps root totals complete but marks an unloaded direct-child subtotal incomplete', () => {
    const root = { value: 100 };
    const result = snapshot([root], {
      tree: { loadType: 'lazy', onExpandChildren: async () => [] },
      aggregate: { tree: { items: 'roots', subtotal: true } },
    });
    expect(result.total!.cells.get('value')!.context.value).toBe(100);
    expect(result.branches.get(root)!.cells.get('value')!.context.isComplete).toBeFalse();
    expect(result.branches.get(root)!.cells.get('value')!.context.value).toBeUndefined();
  });
});

describe('aggregate tree selection', () => {
  const left: Row = { value: 40 },
    right: Row = { value: 60 };
  const root: Row = { value: 100, children: [left, right] };
  it('selects roots/leaves/all without including parents twice', () => {
    for (const [mode, expected] of [
      ['roots', [root]],
      ['leaves', [left, right]],
      ['all', [root, left, right]],
    ] as const) {
      const result = selectAggregateTreeItems([root], { loadType: 'static' }, mode, new Set());
      expect(result.items).toEqual([...expected]);
      expect(result.isComplete).toBeTrue();
    }
  });
  it('tracks lazy completeness, including an empty loaded branch', () => {
    const pending = { value: 90 };
    const option = { loadType: 'lazy' as const, onExpandChildren: async () => [] };
    expect(selectAggregateTreeItems([pending], option, 'leaves', new Set())).toEqual({ items: [], isComplete: false });
    expect(selectAggregateTreeItems([pending], option, 'roots', new Set())).toEqual({ items: [pending], isComplete: true });
    expect(selectAggregateTreeItems([pending], option, 'leaves', new Set([pending]))).toEqual({ items: [pending], isComplete: true });
  });
  it('deduplicates shared descendants and handles cycles', () => {
    const cyclic: Row = { value: 0 };
    cyclic.children = [cyclic, left];
    expect(selectAggregateTreeItems([cyclic, left], { loadType: 'static' }, 'all', new Set()).items).toEqual([cyclic, left]);
  });
  it('does not reinterpret a filtered parent as a leaf', () => {
    expect(selectAggregateTreeItems([root], { loadType: 'static' }, 'leaves', new Set(), data => data === root).items).toEqual([]);
    expect(selectAggregateTreeItems([root], { loadType: 'static' }, 'leaves', new Set(), data => data === left).items).toEqual([left]);
  });
});

// These declarations are compiled by the normal test typecheck; expected errors are part of the public contract.
const validCount: SdTableColumn<Row> = { title: '', field: 'value', type: 'string', aggregate: 'COUNT' };
// @ts-expect-error SUM is not valid for string columns.
const invalidSum: SdTableColumn<Row> = { title: '', field: 'value', type: 'string', aggregate: 'SUM' };
// @ts-expect-error time is deliberately COUNT-only.
const invalidTime: SdTableColumn<Row> = { title: '', field: 'value', type: 'time', aggregate: 'MAX' };
// @ts-expect-error Empty configuration has neither calculate nor templateRef.
const invalidEmpty: SdTableColumn<Row> = { title: '', field: 'value', type: 'number', aggregate: {} };
void [validCount, invalidSum, invalidTime, invalidEmpty];
// @ts-expect-error AVERAGE is not valid for booleans, including object syntax.
const invalidAverage: SdTableColumn<Row> = { title: '', field: 'value', type: 'boolean', aggregate: { calculate: 'AVERAGE' } };
// @ts-expect-error Parent headers cannot aggregate.
const invalidParent: SdTableColumn<Row> = { title: '', field: 'parent', type: 'children', children: [], aggregate: 'COUNT' };
// @ts-expect-error Callback must be synchronous.
const invalidAsync: SdTableColumn<Row> = { title: '', field: 'value', type: 'number', aggregate: async () => 1 };
const numericTemplate = null as unknown as TemplateRef<SdTableAggregateTemplateContext<Row, number>>;
const typedTemplate: SdTableColumn<Row> = {
  title: '',
  field: 'value',
  type: 'number',
  aggregate: { calculate: 'SUM', templateRef: numericTemplate },
};
const oldDateConfig: SdTableColumn<Row> = { title: '', field: 'value', type: 'time', filter: { type: 'date' } };
void [invalidAverage, invalidParent, invalidAsync, typedTemplate, oldDateConfig];
