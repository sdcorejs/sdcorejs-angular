import { signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { Filter, PagingReq } from '@sdcorejs/utils/models';
import { SD_TABLE_CONFIGURATION } from './configurations';
import { SdTableColumn } from './models/table-column.model';
import { SdTableOption } from './models/table-option.model';
import { SdTable } from './table.component';

// Two filter bugs of the default mode, found while building filter.mode 'query-bar':
// 1. a column under a grouped header (`type: 'children'`) was left out of the filter pipeline — its value was never
//    sent, its filter.default and SD_TABLE_CONFIGURATION operators were never applied;
// 2. clearing the filters of a table with a split-number / split-date column threw in the column filter template.

interface Order {
  id: number;
  code: string;
  owner: string;
  total: number;
  weight: number;
  shippedAt: string;
}

type ServerOption = Extract<SdTableOption<Order>, { type: 'server' }>;

describe('SdTable column filters (grouped headers, split filters)', () => {
  let fixture: ComponentFixture<SdTable<Order>>;
  let table: SdTable<Order>;
  let loader: jasmine.Spy;

  const configure = (providers: unknown[] = []) =>
    TestBed.configureTestingModule({
      imports: [SdTable, NoopAnimationsModule],
      providers: [{ provide: SdViewportService, useValue: { isMobile: signal(false) } }, ...(providers as never[])],
    });

  const settle = () => {
    fixture.detectChanges();
    tick(900);
    flush();
    fixture.detectChanges();
  };

  const mount = (columns: SdTableColumn<Order>[]) => {
    loader = jasmine.createSpy('items').and.callFake(() => Promise.resolve({ items: [], total: 0 }));
    fixture = TestBed.createComponent(SdTable<Order>);
    table = fixture.componentInstance;
    fixture.componentRef.setInput('autoId', 'orders');
    fixture.componentRef.setInput('option', { type: 'server', items: loader, columns } satisfies ServerOption);
    settle();
  };

  const lastFilters = (): Filter[] => (loader.calls.mostRecent().args[1] as PagingReq).filters ?? [];

  afterEach(() => fixture?.destroy());

  describe('grouped headers', () => {
    const grouped = (): SdTableColumn<Order>[] => [
      { field: 'code', title: 'Mã', type: 'string' },
      {
        field: 'delivery',
        title: 'Giao hàng',
        type: 'children',
        children: [
          { field: 'owner', title: 'Người giao', type: 'string', filter: { default: 'An' } },
          { field: 'total', title: 'Tổng tiền', type: 'number', filter: { operator: { enable: true } } },
        ],
      },
    ];

    it('sends the filter.default of a child column with the first request', fakeAsync(() => {
      configure();
      mount(grouped());
      expect(lastFilters()).toEqual([{ field: 'owner', operator: 'CONTAIN', data: 'An' }] as Filter[]);
    }));

    it('sends the value of a child column filter', fakeAsync(() => {
      configure();
      mount(grouped());
      table.setFilter({ columnFilter: { owner: 'Bình', total: 300 } });
      settle();
      expect(lastFilters()).toEqual([
        { field: 'owner', operator: 'CONTAIN', data: 'Bình' },
        { field: 'total', operator: 'EQUAL', data: 300 },
      ] as Filter[]);
    }));

    it('applies SD_TABLE_CONFIGURATION operators to a child column', fakeAsync(() => {
      configure([
        {
          provide: SD_TABLE_CONFIGURATION,
          useValue: { filter: { operator: { list: { number: ['EQUAL', 'GREATER_THAN'] }, default: { number: 'GREATER_THAN' } } } },
        },
      ]);
      mount(grouped());
      const total = (table.tableOption()!.columns[1] as { children: SdTableColumn[] }).children[1];
      expect(total.filter?.operator?.list).toEqual(['EQUAL', 'GREATER_THAN']);
      expect(table.columnOperator['total']).toBe('GREATER_THAN');
      table.setFilter({ columnFilter: { owner: null, total: 300 } });
      settle();
      expect(lastFilters()).toEqual([{ field: 'total', operator: 'GREATER_THAN', data: 300 }] as Filter[]);
    }));
  });

  describe('clearing split filters', () => {
    const split = (): SdTableColumn<Order>[] => [
      { field: 'code', title: 'Mã', type: 'string' },
      { field: 'weight', title: 'Cân nặng', type: 'number', filter: { type: 'split-number' } },
      { field: 'shippedAt', title: 'Ngày giao', type: 'date', filter: { type: 'split-date' } },
    ];

    it('clears a table with split-number and split-date filters without throwing', fakeAsync(() => {
      configure();
      mount(split());
      table.setFilter({ columnFilter: { weight: { from: 2, to: 5 }, shippedAt: { from: '2026/10/01', to: null } } });
      settle();
      // weight → BETWEEN 2..5; shippedAt chỉ có "từ" → GREATER_OR_EQUAL.
      expect(lastFilters().map(filter => [(filter as { field: string }).field, filter.operator])).toEqual([
        ['weight', 'BETWEEN'],
        ['shippedAt', 'GREATER_OR_EQUAL'],
      ]);

      table.clearFilter();
      expect(() => settle()).not.toThrow();
      expect(lastFilters()).toEqual([]);
      const inputs = fixture.nativeElement.querySelectorAll('thead input') as NodeListOf<HTMLInputElement>;
      expect([...inputs].every(input => input.value === '')).toBeTrue();
    }));

    it('filters by a split range typed after clearing', fakeAsync(() => {
      configure();
      mount(split());
      table.setFilter({ columnFilter: { weight: { from: 2, to: 5 } } });
      settle();
      table.clearFilter();
      settle();

      // why: đi đúng đường của ô "từ" trong header — modelChange ghi giá trị, sdChange báo bảng lọc lại.
      const from = fixture.debugElement.queryAll(By.css('thead sd-input-number'))[0];
      from.triggerEventHandler('modelChange', 3);
      from.triggerEventHandler('sdChange', 3);
      settle();
      expect(lastFilters()).toEqual([{ field: 'weight', operator: 'GREATER_OR_EQUAL', data: 3 }] as Filter[]);
    }));
  });
});
