/* eslint-disable @typescript-eslint/no-explicit-any */
import { Filter, PagingReq } from '@sdcorejs/utils/models';
import { SdConvertToPagingReq, SdTableExternalFilter, SdTableFilterRequest } from './table-filter.model';
import { SdTableColumn } from '../../models/table-column.model';

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests for the pure mapper SdConvertToPagingReq(filterRequest, args) -> PagingReq.
// Covers: external + column branches per field type, fieldMapping, orders, and the
// empty-value skip. Date branches assert operator + field + that `data` is the
// expected shape (ISO string / { from, to }) without pinning the exact timestamp,
// since DateUtilities.begin/end resolve to local-midnight → UTC (timezone-dependent).
// ─────────────────────────────────────────────────────────────────────────────

/** Build a filter request with sensible empty defaults. */
function makeReq(partial: Partial<SdTableFilterRequest> = {}): SdTableFilterRequest {
  return {
    columnOperator: {} as any,
    rawColumnFilter: {} as any,
    rawExternalFilter: {},
    pageNumber: 0,
    pageSize: 20,
    ...partial,
  } as SdTableFilterRequest;
}

/** Pull the first filter for `field` out of the result (filters are flat single-level). */
function byField(req: PagingReq, field: string): any[] {
  return (req.filters || []).filter((f: any) => f.field === field);
}

describe('table-filter.model › SdConvertToPagingReq', () => {
  it('passes paging through and yields no filters when nothing is set', () => {
    const req = SdConvertToPagingReq(makeReq({ pageNumber: 2, pageSize: 50 }), {});
    expect(req.pageNumber).toBe(2);
    expect(req.pageSize).toBe(50);
    expect(req.filters).toEqual([]);
    expect(req.orders).toEqual([]);
  });

  it('forwards supplied orders and appends orderBy/orderDirection', () => {
    const req = SdConvertToPagingReq(makeReq({ orderBy: 'name', orderDirection: 'ASC' as any }), {
      orders: [{ field: 'createdAt', direction: 'DESC' } as any],
    });
    expect(req.orders).toEqual([
      { field: 'createdAt', direction: 'DESC' },
      { field: 'name', direction: 'ASC' },
    ] as any);
  });

  it('does NOT append an order when only orderBy or only direction is present', () => {
    const a = SdConvertToPagingReq(makeReq({ orderBy: 'name' }), {});
    const b = SdConvertToPagingReq(makeReq({ orderDirection: 'ASC' as any }), {});
    expect(a.orders).toEqual([]);
    expect(b.orders).toEqual([]);
  });

  // ── external filters ───────────────────────────────────────────────────────

  describe('external filters', () => {
    const ext = (f: Partial<SdTableExternalFilter>): SdTableExternalFilter => ({ title: '', ...(f as any) });

    it('string → CONTAIN by default, defaultOperator overrides', () => {
      const r1 = SdConvertToPagingReq(makeReq({ rawExternalFilter: { name: 'abc' } }), {
        externalFilters: [ext({ field: 'name', type: 'string' })],
      });
      expect(byField(r1, 'name')[0]).toEqual({ field: 'name', operator: 'CONTAIN', data: 'abc' });

      const r2 = SdConvertToPagingReq(makeReq({ rawExternalFilter: { code: 'X1' } }), {
        externalFilters: [ext({ field: 'code', type: 'string', defaultOperator: 'EQUAL' })],
      });
      expect(byField(r2, 'code')[0]).toEqual({ field: 'code', operator: 'EQUAL', data: 'X1' });
    });

    it('string EQUAL with comma-separated value → IN list, matching the table component mapper', () => {
      const req = SdConvertToPagingReq(makeReq({ rawExternalFilter: { code: 'A, B,C' } }), {
        externalFilters: [ext({ field: 'code', type: 'string', defaultOperator: 'EQUAL' })],
      });

      expect(byField(req, 'code')[0]).toEqual({ field: 'code', operator: 'IN', data: ['A', 'B', 'C'] });
    });

    it('boolean → EQUAL with a real boolean (coerces 1 / "true" / "1")', () => {
      for (const v of [true, 1, 'true', '1']) {
        const r = SdConvertToPagingReq(makeReq({ rawExternalFilter: { active: v } }), {
          externalFilters: [ext({ field: 'active', type: 'boolean' })],
        });
        expect(byField(r, 'active')[0]).toEqual({ field: 'active', operator: 'EQUAL', data: true });
      }
      const rf = SdConvertToPagingReq(makeReq({ rawExternalFilter: { active: 'false' } }), {
        externalFilters: [ext({ field: 'active', type: 'boolean' })],
      });
      expect(byField(rf, 'active')[0].data).toBe(false);
    });

    it('date range { from, to } → GREATER_OR_EQUAL + LESS_THAN, ISO data', () => {
      const r = SdConvertToPagingReq(makeReq({ rawExternalFilter: { createdAt: { from: '2025-01-01', to: '2025-01-31' } } }), {
        externalFilters: [ext({ field: 'createdAt', type: 'date' })],
      });
      const fs = byField(r, 'createdAt');
      expect(fs.map(f => f.operator).sort()).toEqual(['GREATER_OR_EQUAL', 'LESS_THAN']);
      fs.forEach(f => expect(typeof f.data).toBe('string'));
    });

    it('daterange external filter → GREATER_OR_EQUAL + LESS_THAN, ISO data', () => {
      const req = SdConvertToPagingReq(makeReq({ rawExternalFilter: { period: { from: '2025-01-01', to: '2025-01-31' } } }), {
        externalFilters: [ext({ field: 'period', type: 'daterange' })],
      });

      const filters = byField(req, 'period');
      expect(filters.map(f => f.operator).sort()).toEqual(['GREATER_OR_EQUAL', 'LESS_THAN']);
      filters.forEach(f => expect(typeof f.data).toBe('string'));
    });

    it('single date honours defaultOperator GREATER_OR_EQUAL / LESS_OR_EQUAL', () => {
      const ge = SdConvertToPagingReq(makeReq({ rawExternalFilter: { d: '2025-06-15' } }), {
        externalFilters: [ext({ field: 'd', type: 'date', defaultOperator: 'GREATER_OR_EQUAL' })],
      });
      expect(byField(ge, 'd')[0].operator).toBe('GREATER_OR_EQUAL');

      const le = SdConvertToPagingReq(makeReq({ rawExternalFilter: { d: '2025-06-15' } }), {
        externalFilters: [ext({ field: 'd', type: 'date', defaultOperator: 'LESS_OR_EQUAL' })],
      });
      // LESS_OR_EQUAL is emitted as LESS_THAN of (date + 1 day)
      expect(byField(le, 'd')[0].operator).toBe('LESS_THAN');
    });

    it('single datetime honours GREATER_OR_EQUAL / LESS_OR_EQUAL without day-boundary conversion', () => {
      const value = '2025-06-15T08:30:00.000Z';
      const ge = SdConvertToPagingReq(makeReq({ rawExternalFilter: { at: value } }), {
        externalFilters: [ext({ field: 'at', type: 'datetime', defaultOperator: 'GREATER_OR_EQUAL' })],
      });
      const le = SdConvertToPagingReq(makeReq({ rawExternalFilter: { at: value } }), {
        externalFilters: [ext({ field: 'at', type: 'datetime', defaultOperator: 'LESS_OR_EQUAL' })],
      });

      expect(byField(ge, 'at')[0]).toEqual({ field: 'at', operator: 'GREATER_OR_EQUAL', data: value });
      expect(byField(le, 'at')[0]).toEqual({ field: 'at', operator: 'LESS_OR_EQUAL', data: value });
    });

    it('values: array → IN, scalar → EQUAL (override via defaultOperator)', () => {
      const arr = SdConvertToPagingReq(makeReq({ rawExternalFilter: { status: ['A', 'B'] } }), {
        externalFilters: [ext({ field: 'status', type: 'values' } as any)],
      });
      expect(byField(arr, 'status')[0]).toEqual({ field: 'status', operator: 'IN', data: ['A', 'B'] });

      const scalar = SdConvertToPagingReq(makeReq({ rawExternalFilter: { status: 'A' } }), {
        externalFilters: [ext({ field: 'status', type: 'values' } as any)],
      });
      expect(byField(scalar, 'status')[0]).toEqual({ field: 'status', operator: 'EQUAL', data: 'A' });
    });

    it('empty array IN is dropped', () => {
      const r = SdConvertToPagingReq(makeReq({ rawExternalFilter: { status: [] } }), {
        externalFilters: [ext({ field: 'status', type: 'values' } as any)],
      });
      expect(byField(r, 'status')).toEqual([]);
    });

    it('skips undefined / null / empty-string values', () => {
      const r = SdConvertToPagingReq(makeReq({ rawExternalFilter: { a: undefined, b: null, c: '' } }), {
        externalFilters: [ext({ field: 'a', type: 'string' }), ext({ field: 'b', type: 'string' }), ext({ field: 'c', type: 'string' })],
      });
      expect(req_filters(r)).toEqual([]);
    });

    it('applies fieldMapping to the emitted filter field', () => {
      const r = SdConvertToPagingReq(makeReq({ rawExternalFilter: { name: 'abc' } }), {
        externalFilters: [ext({ field: 'name', type: 'string' })],
        fieldMapping: { name: 'fullName' },
      });
      expect(byField(r, 'fullName')[0]).toEqual({ field: 'fullName', operator: 'CONTAIN', data: 'abc' });
    });
  });

  // ── column filters ───────────────────────────────────────────────────────

  describe('column filters', () => {
    const col = (f: Partial<SdTableColumn>): SdTableColumn => ({ ...(f as any) });

    it('string → CONTAIN by default, columnOperator overrides', () => {
      const r1 = SdConvertToPagingReq(makeReq({ rawColumnFilter: { name: 'abc' } as any }), {
        columns: [col({ field: 'name', type: 'string' })],
      });
      expect(byField(r1, 'name')[0]).toEqual({ field: 'name', operator: 'CONTAIN', data: 'abc' });

      const r2 = SdConvertToPagingReq(makeReq({ rawColumnFilter: { name: 'abc' } as any, columnOperator: { name: 'EQUAL' } as any }), {
        columns: [col({ field: 'name', type: 'string' })],
      });
      expect(byField(r2, 'name')[0].operator).toBe('EQUAL');
    });

    it('boolean → EQUAL boolean', () => {
      const r = SdConvertToPagingReq(makeReq({ rawColumnFilter: { active: '1' } as any }), {
        columns: [col({ field: 'active', type: 'boolean' })],
      });
      expect(byField(r, 'active')[0]).toEqual({ field: 'active', operator: 'EQUAL', data: true });
    });

    it('date { from, to } → BETWEEN with { from, to } ISO payload', () => {
      const r = SdConvertToPagingReq(makeReq({ rawColumnFilter: { d: { from: '2025-01-01', to: '2025-01-31' } } as any }), {
        columns: [col({ field: 'd', type: 'date' })],
      });
      const f = byField(r, 'd')[0];
      expect(f.operator).toBe('BETWEEN');
      expect(typeof f.data.from).toBe('string');
      expect(typeof f.data.to).toBe('string');
    });

    it('date from-only → GREATER_OR_EQUAL, to-only → LESS_THAN', () => {
      const from = SdConvertToPagingReq(makeReq({ rawColumnFilter: { d: { from: '2025-01-01', to: null } } as any }), {
        columns: [col({ field: 'd', type: 'date' })],
      });
      expect(byField(from, 'd')[0].operator).toBe('GREATER_OR_EQUAL');

      const to = SdConvertToPagingReq(makeReq({ rawColumnFilter: { d: { from: null, to: '2025-01-31' } } as any }), {
        columns: [col({ field: 'd', type: 'date' })],
      });
      expect(byField(to, 'd')[0].operator).toBe('LESS_THAN');
    });

    it('single date value → BETWEEN (whole day)', () => {
      const r = SdConvertToPagingReq(makeReq({ rawColumnFilter: { d: '2025-06-15' } as any }), {
        columns: [col({ field: 'd', type: 'datetime' })],
      });
      const f = byField(r, 'd')[0];
      expect(f.operator).toBe('BETWEEN');
      expect(f.data.from).toBeTruthy();
      expect(f.data.to).toBeTruthy();
    });

    it('values: array → IN, scalar → EQUAL', () => {
      const arr = SdConvertToPagingReq(makeReq({ rawColumnFilter: { status: ['A', 'B'] } as any }), {
        columns: [col({ field: 'status', type: 'values' } as any)],
      });
      expect(byField(arr, 'status')[0]).toEqual({ field: 'status', operator: 'IN', data: ['A', 'B'] });

      const scalar = SdConvertToPagingReq(makeReq({ rawColumnFilter: { n: 5 } as any }), {
        columns: [col({ field: 'n', type: 'number' } as any)],
      });
      expect(byField(scalar, 'n')[0]).toEqual({ field: 'n', operator: 'EQUAL', data: 5 });
    });

    it('uses column.filter.operator.default when columnOperator has no entry', () => {
      const r = SdConvertToPagingReq(makeReq({ rawColumnFilter: { name: 'abc' } as any }), {
        columns: [col({ field: 'name', type: 'string', filter: { operator: { default: 'EQUAL' } } } as any)],
      });
      expect(byField(r, 'name')[0].operator).toBe('EQUAL');
    });

    it('applies fieldMapping to column filters too', () => {
      const r = SdConvertToPagingReq(makeReq({ rawColumnFilter: { name: 'abc' } as any }), {
        columns: [col({ field: 'name', type: 'string' })],
        fieldMapping: { name: 'fullName' },
      });
      expect(byField(r, 'fullName')[0].field).toBe('fullName');
    });
  });

  it('combines external + column filters in one request', () => {
    const r = SdConvertToPagingReq(makeReq({ rawExternalFilter: { q: 'hello' }, rawColumnFilter: { status: ['A'] } as any }), {
      externalFilters: [{ field: 'q', title: '', type: 'string' } as any],
      columns: [{ field: 'status', type: 'values' } as any],
    });
    expect((r.filters as Filter[]).length).toBe(2);
    expect(byField(r, 'q')[0].operator).toBe('CONTAIN');
    expect(byField(r, 'status')[0].operator).toBe('IN');
  });
});

/** Helper used above — total emitted filters. */
function req_filters(req: PagingReq): any[] {
  return req.filters || [];
}
