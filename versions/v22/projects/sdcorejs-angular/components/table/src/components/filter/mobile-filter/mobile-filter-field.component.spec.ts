import { OverlayContainer } from '@angular/cdk/overlay';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SdCheckbox } from '@sdcorejs/angular/forms/checkbox';
import { SdDate } from '@sdcorejs/angular/forms/date';
import { SdDatetime } from '@sdcorejs/angular/forms/datetime';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdRadio } from '@sdcorejs/angular/forms/radio';
import type { SdTableColumnAnyRow } from '../../../models/table-column.model';
import type { SdTableExternalFilter, TableFilterValue } from '../../../services/table-filter/table-filter.model';
import { type SdTableMobileFilterItem, sdTableMobileFilterItems } from '../../../services/table-filter/table-mobile-filter.util';
import { type SdTableQueryContext, sdTableQueryFields } from '../../../services/table-filter/table-query-bar.util';
import { ColumnFilterComponent } from '../column-filter/column-filter.component';
import { SdTableMobileFilterFieldComponent } from './mobile-filter-field.component';

const STATUSES = Array.from({ length: 10 }, (_, index) => ({ id: `s${index}`, name: `Status ${index}` }));
const WAREHOUSES = [
  { id: 'HN', name: 'Hà Nội' },
  { id: 'HCM', name: 'Hồ Chí Minh' },
];

/** Handoff table-mobile 4–5: the controls of one filter on the page of the filter sheet and in the sheet of one chip. */
describe('SdTableMobileFilterFieldComponent', () => {
  let fixture: ComponentFixture<SdTableMobileFilterFieldComponent>;
  let component: SdTableMobileFilterFieldComponent;
  let changed: jasmine.Spy;

  const model = (args: {
    columns?: SdTableColumnAnyRow[];
    externalFilters?: SdTableExternalFilter[];
    defaultColumnOperator?: SdTableQueryContext['defaultColumnOperator'];
  }): { ctx: SdTableQueryContext; items: SdTableMobileFilterItem[] } => {
    const columns = args.columns ?? [];
    const fields = sdTableQueryFields({
      columns,
      externalFilters: args.externalFilters,
      inlineExternal: {},
      hideColumns: false,
      labels: { filters: 'Filters', columns: 'Columns' },
    });
    const ctx: SdTableQueryContext = { ...fields, defaultColumnOperator: args.defaultColumnOperator };
    return { ctx, items: sdTableMobileFilterItems({ ctx, columns, externalFilters: args.externalFilters }) };
  };

  /** Renders the one item of `args` with the working copy `value`. */
  const mount = (args: Parameters<typeof model>[0], value: TableFilterValue = {}): TableFilterValue => {
    const { ctx, items } = model(args);
    expect(items.length).withContext('one filter per mount').toBe(1);
    fixture = TestBed.createComponent(SdTableMobileFilterFieldComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('item', items[0]);
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('ctx', ctx);
    fixture.componentRef.setInput('autoId', 'f');
    changed = jasmine.createSpy('changed');
    component.changed.subscribe(changed);
    fixture.detectChanges();
    return value;
  };

  const count = (type: Parameters<typeof By.directive>[0]): number => fixture.debugElement.queryAll(By.directive(type)).length;
  const query = (selector: string): HTMLElement | null => fixture.nativeElement.querySelector(selector);

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SdTableMobileFilterFieldComponent], providers: [provideNoopAnimations()] });
  });

  describe('controls by filter type', () => {
    it('lists the values of a multiple values column as checkboxes', () => {
      mount({
        columns: [
          {
            field: 'warehouse',
            type: 'values',
            title: 'Kho',
            option: { items: WAREHOUSES, valueField: 'id', displayField: 'name', selection: 'MULTIPLE' },
          },
        ],
      });

      expect(component.kind()).toBe('options');
      expect(component.multiple()).toBeTrue();
      expect(count(SdCheckbox)).toBe(2);
      expect(query('.sd-mobile-field-list')?.getAttribute('aria-label')).toBe('Kho');
    });

    it('shows a single values column as a radio list', () => {
      mount({
        columns: [
          { field: 'warehouse', type: 'values', title: 'Kho', option: { items: WAREHOUSES, valueField: 'id', displayField: 'name' } },
        ],
      });

      expect(component.multiple()).toBeFalse();
      expect(count(SdRadio)).toBe(1);
      expect(count(SdCheckbox)).toBe(0);
    });

    it('offers yes / no with the labels of a boolean column, stored as 1 / 0', () => {
      mount({ columns: [{ field: 'paid', type: 'boolean', title: 'Paid', option: { displayOnTrue: 'Paid', displayOnFalse: 'Unpaid' } }] });

      expect(component.kind()).toBe('boolean');
      expect(component.booleanOptions()).toEqual([
        { value: '1', label: 'Paid' },
        { value: '0', label: 'Unpaid' },
      ]);
    });

    it('stores true / false for a boolean external filter, with the default labels', () => {
      mount({ externalFilters: [{ field: 'paid', type: 'boolean', title: 'Paid' }] });

      const options = component.booleanOptions();
      expect(options.map(option => option.value)).toEqual([true, false]);
      expect(options.every(option => !!option.label)).toBeTrue();
    });

    it('shows two dates for a date column and two numbers for a split number column', () => {
      mount({ columns: [{ field: 'createdAt', type: 'date', title: 'Created' }] });
      expect(component.kind()).toBe('date-range');
      expect(count(SdDate)).toBe(2);

      mount({ columns: [{ field: 'total', type: 'number', title: 'Total', filter: { type: 'split-number' } }] });
      expect(component.kind()).toBe('number-range');
      expect(count(SdInputNumber)).toBe(2);
    });

    it('shows one box for a date, datetime, number or string filter', () => {
      mount({ externalFilters: [{ field: 'at', type: 'date', title: 'At', defaultOperator: 'GREATER_OR_EQUAL' }] });
      expect(component.kind()).toBe('date');
      expect(count(SdDate)).toBe(1);

      mount({ externalFilters: [{ field: 'at', type: 'datetime', title: 'At', defaultOperator: 'LESS_OR_EQUAL' }] });
      expect(component.kind()).toBe('datetime');
      expect(count(SdDatetime)).toBe(1);

      mount({ externalFilters: [{ field: 'qty', type: 'number', title: 'Qty' }] });
      expect(component.kind()).toBe('number');
      expect(count(SdInputNumber)).toBe(1);

      mount({ columns: [{ field: 'code', type: 'string', title: 'Code' }] });
      expect(component.kind()).toBe('text');
      expect(count(SdInput)).toBe(1);
    });

    it('keeps a box for a date or datetime external filter the bar leaves out, writing the raw value', () => {
      const value = mount({ externalFilters: [{ field: 'day', type: 'date', title: 'Day' }] });
      expect(component.kind()).toBe('custom');
      expect(count(SdDate)).toBe(1);

      component.setExternal('day', '2026/10/01');
      expect(value.externalFilter?.['day']).toBe('2026/10/01');
      expect(changed).toHaveBeenCalledTimes(1);

      mount({ externalFilters: [{ field: 'at', type: 'datetime', title: 'At', defaultOperator: 'EQUAL' }] });
      expect(count(SdDatetime)).toBe(1);
    });

    it('renders the column filter of a column the bar cannot read, and passes its edits on', () => {
      mount({ columns: [{ field: 'at', type: 'time', title: 'At' } as SdTableColumnAnyRow] }, { columnFilter: {}, columnOperator: {} });

      expect(component.kind()).toBe('custom');
      expect(count(ColumnFilterComponent)).toBe(1);
      expect(query('.sd-mobile-field-operator, .sd-mobile-field-operator-text')).toBeNull();

      query('.sd-mobile-field-custom')!.dispatchEvent(new Event('change'));
      expect(changed).toHaveBeenCalledTimes(1);
    });
  });

  describe('operator', () => {
    const code: SdTableColumnAnyRow = {
      field: 'code',
      type: 'string',
      title: 'Code',
      filter: { operator: { enable: true, list: ['CONTAIN', 'EQUAL'] } },
    };
    const status = (operatorDefault?: 'IN'): SdTableColumnAnyRow => ({
      field: 'status',
      type: 'values',
      title: 'Status',
      option: { items: STATUSES, valueField: 'id', displayField: 'name', selection: 'MULTIPLE' },
      filter: { operator: { enable: true, list: ['NULL', 'NOT_NULL'], ...(operatorDefault ? { default: operatorDefault } : {}) } },
    });

    it('shows the operator as text when the filter offers one', () => {
      mount({ columns: [{ field: 'code', type: 'string', title: 'Code' }] });

      expect(query('button.sd-mobile-field-operator')).toBeNull();
      expect(query('.sd-mobile-field-operator-text')?.textContent?.trim()).toBe(component.operatorLabel());
      expect(component.operatorLabel()).toBeTruthy();
    });

    it('opens a menu of the operators and stores the one picked', () => {
      const value = mount({ columns: [code] });
      const trigger = query('[data-autoid="f-operator"]') as HTMLButtonElement;
      expect(trigger).not.toBeNull();

      trigger.click();
      fixture.detectChanges();
      const entries = TestBed.inject(OverlayContainer)
        .getContainerElement()
        .querySelectorAll<HTMLButtonElement>('.sd-table-mobile-operator-menu [mat-menu-item]');
      expect(entries.length).toBe(2);
      entries[1].click();
      fixture.detectChanges();

      expect(value.columnOperator?.['code']).toBe('EQUAL');
      expect(component.operator()).toBe('EQUAL');
      expect(changed).toHaveBeenCalledTimes(1);
    });

    it('hides the controls and empties the value for NULL / NOT_NULL', () => {
      const value = mount({ columns: [status()] }, { columnFilter: { status: ['s1'] } });
      expect(count(SdCheckbox)).toBe(10);

      component.setOperator('NULL');
      fixture.detectChanges();

      expect(value.columnOperator?.['status']).toBe('NULL');
      expect(value.columnFilter?.['status']).toEqual([]);
      expect(component.noData()).toBeTrue();
      expect(count(SdCheckbox)).toBe(0);
    });

    it('empties a range or a single value in its own shape', () => {
      const range = mount(
        { columns: [{ field: 'createdAt', type: 'date', title: 'Created', filter: { operator: { enable: true, list: ['NOT_NULL'] } } }] },
        { columnFilter: { createdAt: { from: '2026/10/01', to: null } } }
      );
      component.setOperator('NOT_NULL');
      expect(range.columnFilter?.['createdAt']).toEqual({ from: null, to: null });

      const single = mount(
        {
          columns: [
            {
              field: 'warehouse',
              type: 'values',
              title: 'Kho',
              option: { items: WAREHOUSES, valueField: 'id', displayField: 'name' },
              filter: { operator: { enable: true, list: ['EQUAL', 'NULL'] } },
            },
          ],
        },
        { columnFilter: { warehouse: 'HN' } }
      );
      component.setOperator('NULL');
      expect(single.columnFilter?.['warehouse']).toBeNull();
    });

    it('leaving NULL restores the table default, then the column default, else drops the operator', () => {
      const tableDefault = mount({ columns: [status()], defaultColumnOperator: { status: 'IN' } }, { columnOperator: { status: 'NULL' } });
      component.setOperator('IN');
      expect(tableDefault.columnOperator?.['status']).toBe('IN');

      const columnDefault = mount({ columns: [status('IN')] }, { columnOperator: { status: 'NULL' } });
      component.setOperator('IN');
      expect(columnDefault.columnOperator?.['status']).toBe('IN');

      const none = mount({ columns: [status()] }, { columnOperator: { status: 'NULL' } });
      component.setOperator('IN');
      expect('status' in (none.columnOperator ?? {})).toBeFalse();
      expect(changed).toHaveBeenCalledTimes(1);
    });

    it('never restores a NULL / NOT_NULL default', () => {
      const value = mount({ columns: [status()], defaultColumnOperator: { status: 'NOT_NULL' } }, { columnOperator: { status: 'NULL' } });

      component.setOperator('IN');

      expect('status' in (value.columnOperator ?? {})).toBeFalse();
    });

    it('ignores an operator for a filter without an operator choice', () => {
      const external = mount({ externalFilters: [{ field: 'customer', type: 'string', title: 'Customer' }] });
      component.setOperator('EQUAL');
      expect(external.columnOperator).toBeUndefined();

      const plain = mount({ columns: [{ field: 'code', type: 'string', title: 'Code' }] });
      component.setOperator('EQUAL');
      expect(plain.columnOperator).toBeUndefined();
      expect(changed).not.toHaveBeenCalled();
    });
  });

  describe('values', () => {
    it('adds a search box above 8 options and filters the list by label', () => {
      mount({
        columns: [
          {
            field: 'status',
            type: 'values',
            title: 'Status',
            option: { items: STATUSES, valueField: 'id', displayField: 'name', selection: 'MULTIPLE' },
          },
        ],
      });
      expect(component.showSearch()).toBeTrue();
      expect(query('.sd-mobile-field-search')).not.toBeNull();

      component.onSearch('  STATUS 3 ');
      fixture.detectChanges();

      expect(component.shownOptions().map(option => option.value)).toEqual(['s3']);
      expect(count(SdCheckbox)).toBe(1);

      component.onSearch(null as unknown as string);
      expect(component.shownOptions().length).toBe(10);
    });

    it('has no search box up to 8 options', () => {
      mount({
        columns: [
          { field: 'warehouse', type: 'values', title: 'Kho', option: { items: WAREHOUSES, valueField: 'id', displayField: 'name' } },
        ],
      });

      expect(component.showSearch()).toBeFalse();
      expect(query('.sd-mobile-field-search')).toBeNull();
    });

    it('reads options from a signal', () => {
      const items = signal(WAREHOUSES);
      mount({
        columns: [
          {
            field: 'warehouse',
            type: 'values',
            title: 'Kho',
            option: { items, valueField: 'id', displayField: 'name' },
          } as SdTableColumnAnyRow,
        ],
      });
      expect(component.options().length).toBe(2);

      items.set([...WAREHOUSES, { id: 'DN', name: 'Đà Nẵng' }]);

      expect(component.options().map(option => option.label)).toEqual(['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng']);
    });

    it('loads options from a function once', fakeAsync(() => {
      const items = jasmine.createSpy('items').and.resolveTo(WAREHOUSES);
      mount({ columns: [{ field: 'warehouse', type: 'values', title: 'Kho', option: { items, valueField: 'id', displayField: 'name' } }] });
      expect(component.options()).toEqual([]);

      flushMicrotasks();
      fixture.detectChanges();

      expect(items).toHaveBeenCalledTimes(1);
      expect(component.options().map(option => option.value)).toEqual(['HN', 'HCM']);
    }));

    it('shows no options when the function fails or returns no list', fakeAsync(() => {
      mount({
        columns: [
          {
            field: 'warehouse',
            type: 'values',
            title: 'Kho',
            option: { items: () => Promise.reject(new Error('down')), valueField: 'id', displayField: 'name' },
          },
        ],
      });
      flushMicrotasks();
      expect(component.options()).toEqual([]);

      mount({
        columns: [
          {
            field: 'warehouse',
            type: 'values',
            title: 'Kho',
            option: { items: () => Promise.resolve(null as any), valueField: 'id', displayField: 'name' },
          },
        ],
      });
      flushMicrotasks();
      expect(component.options()).toEqual([]);
    }));

    it('toggles checkboxes in the working copy without duplicates', () => {
      const value = mount({
        columns: [
          {
            field: 'status',
            type: 'values',
            title: 'Status',
            option: { items: STATUSES, valueField: 'id', displayField: 'name', selection: 'MULTIPLE' },
          },
        ],
      });

      component.toggle('s1', true);
      component.toggle('s2', true);
      component.toggle('s1', true);
      expect(value.columnFilter?.['status']).toEqual(['s2', 's1']);
      expect(component.isChecked('s1')).toBeTrue();

      component.toggle('s2', false);
      expect(value.columnFilter?.['status']).toEqual(['s1']);
      expect(changed).toHaveBeenCalledTimes(4);
    });

    it('writes an external filter into externalFilter', () => {
      const value = mount({
        externalFilters: [
          {
            field: 'channel',
            type: 'values',
            title: 'Channel',
            option: { items: WAREHOUSES, valueField: 'id', displayField: 'name', selection: 'MULTIPLE' },
          },
        ],
      });

      component.toggle('HN', true);

      expect(value.externalFilter?.['channel']).toEqual(['HN']);
      expect(value.columnFilter).toBeUndefined();
    });

    it('treats a single stored value as a selection of one', () => {
      mount(
        {
          columns: [
            { field: 'warehouse', type: 'values', title: 'Kho', option: { items: WAREHOUSES, valueField: 'id', displayField: 'name' } },
          ],
        },
        { columnFilter: { warehouse: 'HN' } }
      );

      expect(component.isChecked('HN')).toBeTrue();
      expect(component.isChecked('HCM')).toBeFalse();
    });
  });

  describe('lazy values', () => {
    const owner = (items: jasmine.Spy): SdTableColumnAnyRow =>
      ({
        field: 'owner',
        type: 'lazy-values',
        title: 'Owner',
        option: { items, valueField: 'id', displayField: 'name', selection: 'MULTIPLE' },
      }) as SdTableColumnAnyRow;

    it('loads the first page, then searches 300 ms after typing', fakeAsync(() => {
      const search = jasmine
        .createSpy('search')
        .and.callFake((args: { searchText?: string }) =>
          Promise.resolve([{ id: `u-${args.searchText || 'all'}`, name: `User ${args.searchText || 'all'}` }])
        );
      mount({ columns: [owner(search)] });
      flushMicrotasks();

      expect(search).toHaveBeenCalledOnceWith({ type: 'SEARCH', searchText: '' });
      expect(component.showSearch()).toBeTrue();
      expect(component.options().map(option => option.value)).toEqual(['u-all']);

      component.onSearch('a');
      tick(100);
      component.onSearch('an');
      tick(299);
      expect(search).toHaveBeenCalledTimes(1);
      tick(1);
      flushMicrotasks();

      expect(search).toHaveBeenCalledTimes(2);
      expect(search.calls.mostRecent().args[0]).toEqual({ type: 'SEARCH', searchText: 'an' });
      // why: the search runs on the server, so the list is not filtered again by label.
      expect(component.shownOptions().map(option => option.value)).toEqual(['u-an']);
    }));

    it('keeps the answer of the last search only', fakeAsync(() => {
      const answers: ((list: unknown[]) => void)[] = [];
      const search = jasmine.createSpy('search').and.callFake(() => new Promise<unknown[]>(resolve => answers.push(resolve)));
      mount({ columns: [owner(search)] });
      flushMicrotasks();
      component.onSearch('b');
      tick(300);
      flushMicrotasks();

      answers[1]([{ id: 'b', name: 'B' }]);
      flushMicrotasks();
      answers[0]([{ id: 'stale', name: 'Stale' }]);
      flushMicrotasks();

      expect(component.options().map(option => option.value)).toEqual(['b']);
    }));

    it('shows nothing found when the search fails', fakeAsync(() => {
      const search = jasmine.createSpy('search').and.callFake(() => Promise.reject(new Error('down')));
      mount({ columns: [owner(search)] });
      flushMicrotasks();

      expect(component.options()).toEqual([]);
    }));

    it('lists the selected values first, labelled once their lookup lands', fakeAsync(() => {
      const search = jasmine
        .createSpy('search')
        .and.callFake((args: { type: string }) =>
          Promise.resolve(args.type === 'VALUE' ? [{ id: 'u9', name: 'User 9' }] : [{ id: 'u1', name: 'User 1' }])
        );
      mount({ columns: [owner(search)] }, { columnFilter: { owner: ['u9', 'u1'] } });

      expect(component.options().map(option => option.label)).toEqual(['u9', 'u1']);
      flushMicrotasks();

      expect(search).toHaveBeenCalledWith({ type: 'VALUE', value: ['u9', 'u1'] });
      expect(component.options().map(option => [option.value, option.label])).toEqual([
        ['u9', 'User 9'],
        ['u1', 'User 1'],
      ]);
    }));

    it('drops a pending search when destroyed', fakeAsync(() => {
      const search = jasmine.createSpy('search').and.resolveTo([]);
      mount({ columns: [owner(search)] });
      flushMicrotasks();
      component.onSearch('x');

      fixture.destroy();
      tick(300);

      expect(search).toHaveBeenCalledTimes(1);
    }));
  });

  describe('ranges and the working copy', () => {
    it('sets one end of a range and keeps the other', () => {
      const value = mount({ columns: [{ field: 'total', type: 'number', title: 'Total', filter: { type: 'split-number' } }] });

      component.setRange('from', 5);
      expect(value.columnFilter?.['total']).toEqual({ from: 5, to: null });
      component.setRange('to', 9);
      expect(value.columnFilter?.['total']).toEqual({ from: 5, to: 9 });
      component.setRange('from', undefined);
      expect(value.columnFilter?.['total']).toEqual({ from: null, to: 9 });
    });

    it('re-reads the working copy when the owner bumps the revision', () => {
      const value = mount({ columns: [{ field: 'code', type: 'string', title: 'Code' }] }, { columnFilter: { code: 'A' } });
      expect(component.raw()).toBe('A');

      value.columnFilter!['code'] = 'B';
      expect(component.raw()).toBe('A');
      fixture.componentRef.setInput('revision', 1);

      expect(component.raw()).toBe('B');
    });
  });
});
