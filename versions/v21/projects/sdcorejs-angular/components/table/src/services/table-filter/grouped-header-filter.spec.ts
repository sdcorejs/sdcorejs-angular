import { TestBed } from '@angular/core/testing';
import { Filter } from '@sdcorejs/utils/models';
import { SdTableColumn } from '../../models/table-column.model';
import { filterLocalItems } from '../table-local/table-local.util';
import { SdConvertToPagingReq, SdTableFilterRequest } from './table-filter.model';
import { SdTableFilterService } from './table-filter.service';

// Bug: the leaf columns under a grouped header (`type: 'children'`) were invisible to the filter pipeline — the
// request converter, local filtering / sorting and the filter service only walked the top level of `columns`, so
// a value typed in a child column's filter was never sent, never matched and never restored from the cache.

interface Order {
  id: number;
  code: string;
  owner: string;
  total: number;
  weight: number;
  shippedAt: string;
  payment: string;
}

const columns = (): SdTableColumn<Order>[] => [
  { field: 'code', title: 'Mã', type: 'string' },
  {
    field: 'money',
    title: 'Thanh toán',
    type: 'children',
    children: [
      {
        field: 'total',
        title: 'Tổng tiền',
        type: 'number',
        filter: { operator: { enable: true, default: 'EQUAL', list: ['EQUAL', 'GREATER_THAN'] } },
      },
      { field: 'weight', title: 'Cân nặng', type: 'number', filter: { type: 'split-number' } },
      {
        field: 'payment',
        title: 'Trạng thái',
        type: 'values',
        option: { items: [], valueField: 'id', displayField: 'name' },
        filter: { operator: { enable: true, list: ['EQUAL', 'NULL'] } },
      },
    ],
  },
  {
    field: 'delivery',
    title: 'Giao hàng',
    type: 'children',
    children: [
      { field: 'owner', title: 'Người giao', type: 'string', filter: { default: 'An' } },
      { field: 'shippedAt', title: 'Ngày giao', type: 'date' },
    ],
  },
];

const request = (partial: Partial<SdTableFilterRequest>): SdTableFilterRequest =>
  ({ columnOperator: {}, rawColumnFilter: {}, rawExternalFilter: {}, pageNumber: 0, pageSize: 20, ...partial }) as SdTableFilterRequest;

const rows: Order[] = [
  { id: 1, code: 'A', owner: 'An', total: 100, weight: 1, shippedAt: '2026/10/01', payment: 'paid' },
  { id: 2, code: 'B', owner: 'Bình', total: 300, weight: 5, shippedAt: '2026/10/05', payment: 'unpaid' },
  { id: 3, code: 'C', owner: 'An Nhiên', total: 200, weight: 9, shippedAt: '2026/10/09', payment: null as unknown as string },
];

describe('grouped header columns in the filter pipeline', () => {
  describe('SdConvertToPagingReq', () => {
    it('sends the filter of a column under a grouped header', () => {
      const req = SdConvertToPagingReq(request({ rawColumnFilter: { owner: 'An' } as never }), { columns: columns() });
      expect(req.filters).toEqual([{ field: 'owner', operator: 'CONTAIN', data: 'An' }] as Filter[]);
    });

    it('uses the column operator and the default operator of a child column', () => {
      const withOperator = SdConvertToPagingReq(
        request({ rawColumnFilter: { total: 200 } as never, columnOperator: { total: 'GREATER_THAN' } as never }),
        {
          columns: columns(),
        }
      );
      expect(withOperator.filters).toEqual([{ field: 'total', operator: 'GREATER_THAN', data: 200 }] as Filter[]);
      const byDefault = SdConvertToPagingReq(request({ rawColumnFilter: { total: 200 } as never }), { columns: columns() });
      expect(byDefault.filters).toEqual([{ field: 'total', operator: 'EQUAL', data: 200 }] as Filter[]);
    });

    it('sends a split-number range, a date range and a NULL operator of child columns', () => {
      const req = SdConvertToPagingReq(
        request({
          rawColumnFilter: { weight: { from: 0, to: null }, shippedAt: { from: '2026/10/01', to: '2026/10/05' }, payment: null } as never,
          columnOperator: { payment: 'NULL' } as never,
        }),
        { columns: columns() }
      );
      const fields = (req.filters ?? []).map(filter => [(filter as { field: string }).field, filter.operator]);
      expect(fields).toEqual([
        ['weight', 'GREATER_OR_EQUAL'],
        ['payment', 'NULL'],
        ['shippedAt', 'BETWEEN'],
      ]);
    });

    it('maps a child field through fieldMapping', () => {
      const req = SdConvertToPagingReq(request({ rawColumnFilter: { owner: 'An' } as never }), {
        columns: columns(),
        fieldMapping: { owner: 'delivery.ownerName' },
      });
      expect(req.filters).toEqual([{ field: 'delivery.ownerName', operator: 'CONTAIN', data: 'An' }] as Filter[]);
    });

    it('sends nothing for the grouped header itself and keeps flat columns as before', () => {
      const req = SdConvertToPagingReq(request({ rawColumnFilter: { money: 'x', code: 'A' } as never }), { columns: columns() });
      expect(req.filters).toEqual([{ field: 'code', operator: 'CONTAIN', data: 'A' }] as Filter[]);
    });
  });

  describe('filterLocalItems', () => {
    const local = (filter: Partial<SdTableFilterRequest>) =>
      filterLocalItems(rows, { type: 'local', columns: columns() } as never, request(filter)).items.map(row => (row as Order).id);

    it('filters local rows by a child column', () => {
      expect(local({ rawColumnFilter: { owner: 'an' } as never })).toEqual([1, 3]);
      expect(local({ rawColumnFilter: { total: 200 } as never, columnOperator: { total: 'GREATER_THAN' } as never })).toEqual([2]);
      expect(local({ rawColumnFilter: { weight: { from: 5, to: null } } as never })).toEqual([2, 3]);
    });

    it('applies a NULL operator of a child column', () => {
      expect(local({ rawColumnFilter: { payment: null } as never, columnOperator: { payment: 'NULL' } as never })).toEqual([3]);
    });

    it('sorts local rows by a child column', () => {
      expect(local({ orderBy: 'total', orderDirection: 'DESC' })).toEqual([2, 3, 1]);
      expect(local({ orderBy: 'owner', orderDirection: 'ASC' })).toEqual([1, 3, 2]);
    });
  });

  describe('SdTableFilterService', () => {
    afterEach(() => TestBed.resetTestingModule());

    const register = (id: string) => {
      TestBed.configureTestingModule({ providers: [SdTableFilterService] });
      return TestBed.inject(SdTableFilterService).register(
        { key: id, cacheable: true },
        { id, columns: columns() as never, externalFilters: [], filterDefs: [] }
      );
    };

    it('starts a child column at its filter.default and its operator default', () => {
      const id = `grouped-default-${Date.now()}`;
      const value = register(id).value.get();
      expect(value.columnFilter?.['owner']).toBe('An');
      expect(value.columnOperator?.['total']).toBe('EQUAL');
    });

    it('restores the cached value of a child column', () => {
      const id = `grouped-cache-${Date.now()}`;
      register(id).value.set({ columnFilter: { owner: 'Bình', weight: { from: 2, to: 4 } } });
      TestBed.resetTestingModule();
      const restored = register(id).value.get();
      expect(restored.columnFilter?.['owner']).toBe('Bình');
      expect(restored.columnFilter?.['weight']).toEqual({ from: 2, to: 4 });
    });

    it('resets a child column to its default on remove()', () => {
      const id = `grouped-remove-${Date.now()}`;
      const registered = register(id);
      registered.value.set({ columnFilter: { owner: 'Bình' } });
      registered.value.remove();
      expect(registered.value.get().columnFilter?.['owner']).toBe('An');
    });
  });
});
