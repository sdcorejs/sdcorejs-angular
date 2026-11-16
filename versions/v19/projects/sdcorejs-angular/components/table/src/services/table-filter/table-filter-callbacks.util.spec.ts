/* eslint-disable @typescript-eslint/no-explicit-any */
import { SdTableColumn } from '../../models/table-column.model';
import { cloneTableFilterValue, runTableFilterCallbacks } from './table-filter-callbacks.util';
import { SdTableExternalFilter } from './table-filter.model';

describe('cloneTableFilterValue', () => {
  it('keeps Date instances as Dates (a JSON copy turns them into strings)', () => {
    const day = new Date(2026, 10, 16);
    const source = { externalFilter: { from: day, range: { from: day, to: null } } };
    const copy = cloneTableFilterValue(source);
    expect(copy.externalFilter.from instanceof Date).toBeTrue();
    expect(copy.externalFilter.from.getTime()).toBe(day.getTime());
    expect(copy.externalFilter.range.from instanceof Date).toBeTrue();
    expect(copy.externalFilter.from).not.toBe(day);
  });

  it('copies nested objects and arrays so edits do not reach the source', () => {
    const source = { externalFilter: { status: ['A'], range: { from: 1, to: 2 } } };
    const copy = cloneTableFilterValue(source);
    copy.externalFilter.status.push('B');
    copy.externalFilter.range.to = 9;
    expect(source.externalFilter.status).toEqual(['A']);
    expect(source.externalFilter.range.to).toBe(2);
  });

  it('keeps undefined values and returns {} for nullish input', () => {
    expect(cloneTableFilterValue({ a: undefined })).toEqual({ a: undefined });
    expect('a' in cloneTableFilterValue({ a: undefined })).toBeTrue();
    expect(cloneTableFilterValue(undefined as any)).toEqual({});
    expect(cloneTableFilterValue(null as any)).toEqual({});
  });
});

describe('runTableFilterCallbacks', () => {
  const external = (field: string, type: SdTableExternalFilter['type'] = 'values', onChange?: (v: any) => void) =>
    ({ field, title: field, type, onChange, option: { items: [], valueField: 'id', displayField: 'name' } }) as any as SdTableExternalFilter;

  it('calls onChange of every external filter whose value changed, with the new value', () => {
    const project = jasmine.createSpy('project');
    const status = jasmine.createSpy('status');
    runTableFilterCallbacks({
      previous: { externalFilter: { project: 'P1', status: 'A' } },
      next: { externalFilter: { project: 'P2', status: 'A' } },
      externalFilters: [external('project', 'values', project), external('status', 'values', status)],
    });
    expect(project).toHaveBeenCalledOnceWith('P2');
    expect(status).not.toHaveBeenCalled();
  });

  it('treats a default value that was not touched as unchanged (Date kept as Date)', () => {
    const onChange = jasmine.createSpy('onChange');
    const day = new Date(2026, 10, 16);
    const previous = { externalFilter: { createdDate: day } };
    runTableFilterCallbacks({
      previous,
      next: cloneTableFilterValue(previous),
      externalFilters: [external('createdDate', 'date', onChange)],
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('fires when a default value is cleared or a date range end changes', () => {
    const cleared = jasmine.createSpy('cleared');
    const range = jasmine.createSpy('range');
    runTableFilterCallbacks({
      previous: { externalFilter: { status: 'A', period: { from: new Date(2026, 0, 1), to: null } } },
      next: { externalFilter: { status: null, period: { from: new Date(2026, 0, 1), to: new Date(2026, 0, 31) } } },
      externalFilters: [external('status', 'values', cleared), external('period', 'daterange', range)],
    });
    expect(cleared).toHaveBeenCalledOnceWith(null);
    expect(range).toHaveBeenCalledTimes(1);
  });

  it('skips custom external filters (their template owns the events)', () => {
    const onChange = jasmine.createSpy('onChange');
    runTableFilterCallbacks({
      previous: { externalFilter: { code: 'a' } },
      next: { externalFilter: { code: 'b' } },
      externalFilters: [external('code', 'custom', onChange)],
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('calls operatorChange for a column whose operator changed', () => {
    const operatorChange = jasmine.createSpy('operatorChange');
    const name = { field: 'name', title: 'Name', type: 'string' } as SdTableColumn;
    const age = { field: 'age', title: 'Age', type: 'number' } as SdTableColumn;
    runTableFilterCallbacks({
      previous: { columnOperator: { name: 'CONTAIN', age: 'EQUAL' } },
      next: { columnOperator: { name: 'EQUAL', age: 'EQUAL' } },
      columns: [name, age],
      operatorChange,
    });
    expect(operatorChange).toHaveBeenCalledOnceWith(name, 'EQUAL');
  });

  it('calls column filter.onChange only when columnOnChange is on', () => {
    const onChange = jasmine.createSpy('onChange');
    const name = { field: 'name', title: 'Name', type: 'string', filter: { onChange } } as SdTableColumn;
    const args = {
      previous: { columnFilter: { name: 'a' } },
      next: { columnFilter: { name: 'b' } },
      columns: [name],
    };
    runTableFilterCallbacks(args);
    expect(onChange).not.toHaveBeenCalled();
    runTableFilterCallbacks({ ...args, columnOnChange: column => column.field === 'name' });
    expect(onChange).toHaveBeenCalledOnceWith('b', name, { name: 'b' });
  });

  it('keeps calling the next callbacks when one throws', () => {
    const second = jasmine.createSpy('second');
    const consoleError = spyOn(console, 'error');
    runTableFilterCallbacks({
      previous: { externalFilter: { a: 1, b: 1 } },
      next: { externalFilter: { a: 2, b: 2 } },
      externalFilters: [
        external('a', 'values', () => {
          throw new Error('boom');
        }),
        external('b', 'values', second),
      ],
    });
    expect(second).toHaveBeenCalledOnceWith(2);
    expect(consoleError).toHaveBeenCalled();
  });
});
