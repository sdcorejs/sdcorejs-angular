import { TestBed } from '@angular/core/testing';
import { SD_CORE_CONFIGURATION, type SdTimeZone } from '@sdcorejs/angular/configurations';
import { SdDateTimeService } from '@sdcorejs/angular/services/date-time';
import { PagingReq } from '@sdcorejs/utils/models';
import { SdTableColumn } from '../../models/table-column.model';
import { SdConvertToPagingReq, SdTableExternalFilter, SdTableFilterRequest } from './table-filter.model';

// Server filters under ISdCoreConfiguration.timeZone. Every expected instant is pinned, so the
// result must not depend on the zone of the machine running the test (Bangkok locally, UTC in CI).
// Asia/Ho_Chi_Minh was +08 from 1959-12-31 to 1975-06-13, and 1975-06-12 lasted 25 hours.

const service = (timeZone: SdTimeZone): SdDateTimeService => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: SD_CORE_CONFIGURATION, useValue: { timeZone } }] });
  return TestBed.inject(SdDateTimeService);
};

const request = (partial: Partial<SdTableFilterRequest>): SdTableFilterRequest =>
  ({ columnOperator: {}, rawColumnFilter: {}, rawExternalFilter: {}, pageNumber: 0, pageSize: 20, ...partial }) as SdTableFilterRequest;

const external = (field: string, type: string, defaultOperator?: string): SdTableExternalFilter =>
  ({ field, type, title: field, defaultOperator }) as unknown as SdTableExternalFilter;

const column = (field: string, type: 'date' | 'datetime'): SdTableColumn => ({ field, type, title: field }) as SdTableColumn;

const filtersOf = (req: PagingReq): Record<string, unknown>[] => (req.filters ?? []).map(filter => ({ ...filter }));

describe('SdConvertToPagingReq with ISdCoreConfiguration.timeZone', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('bounds a date filter by the calendar day in the zone', () => {
    const req = SdConvertToPagingReq(request({ rawExternalFilter: { createdAt: { from: '1960/05/20', to: '1960/05/20' } } }), {
      externalFilters: [external('createdAt', 'date')],
      dateTime: service('Asia/Ho_Chi_Minh'),
    });
    expect(filtersOf(req)).toEqual([
      { field: 'createdAt', operator: 'GREATER_OR_EQUAL', data: '1960-05-19T16:00:00.000Z' },
      { field: 'createdAt', operator: 'LESS_THAN', data: '1960-05-20T16:00:00.000Z' },
    ]);
  });

  it('uses the begin of the next calendar day as the exclusive bound on the 25-hour day', () => {
    const req = SdConvertToPagingReq(request({ rawExternalFilter: { period: { from: '1975/06/12', to: '1975/06/12' } } }), {
      externalFilters: [external('period', 'daterange')],
      dateTime: service('Asia/Ho_Chi_Minh'),
    });
    expect(filtersOf(req)).toEqual([
      { field: 'period', operator: 'GREATER_OR_EQUAL', data: '1975-06-11T16:00:00.000Z' },
      { field: 'period', operator: 'LESS_THAN', data: '1975-06-12T17:00:00.000Z' },
    ]);
  });

  it('bounds a single date by its default operator', () => {
    const dateTime = service('Asia/Ho_Chi_Minh');
    const req = SdConvertToPagingReq(request({ rawExternalFilter: { from: '1960/05/20', to: '1960/05/20' } }), {
      externalFilters: [external('from', 'date', 'GREATER_OR_EQUAL'), external('to', 'date', 'LESS_OR_EQUAL')],
      dateTime,
    });
    expect(filtersOf(req)).toEqual([
      { field: 'from', operator: 'GREATER_OR_EQUAL', data: '1960-05-19T16:00:00.000Z' },
      { field: 'to', operator: 'LESS_THAN', data: '1960-05-20T16:00:00.000Z' },
    ]);
  });

  it('reads a zone-less datetime as wall clock in the zone and keeps an instant', () => {
    const req = SdConvertToPagingReq(request({ rawExternalFilter: { after: '1960/05/20 08:00:00', before: '1960-05-20T00:30:00Z' } }), {
      externalFilters: [external('after', 'datetime', 'GREATER_OR_EQUAL'), external('before', 'datetime', 'LESS_OR_EQUAL')],
      dateTime: service('Asia/Ho_Chi_Minh'),
    });
    expect(filtersOf(req)).toEqual([
      { field: 'after', operator: 'GREATER_OR_EQUAL', data: '1960-05-20T00:00:00.000Z' },
      { field: 'before', operator: 'LESS_OR_EQUAL', data: '1960-05-20T00:30:00.000Z' },
    ]);
  });

  it('bounds a range of another filter type by the zone', () => {
    const req = SdConvertToPagingReq(request({ rawExternalFilter: { custom: { from: '1960/05/20', to: '1960/05/21' } } }), {
      externalFilters: [external('custom', 'custom')],
      dateTime: service('Asia/Ho_Chi_Minh'),
    });
    expect(filtersOf(req)).toEqual([
      { field: 'custom', operator: 'GREATER_OR_EQUAL', data: '1960-05-19T16:00:00.000Z' },
      { field: 'custom', operator: 'LESS_THAN', data: '1960-05-21T16:00:00.000Z' },
    ]);
  });

  it('bounds column filters by the zone', () => {
    const req = SdConvertToPagingReq(
      request({
        rawColumnFilter: {
          day: '1960/05/20',
          range: { from: '1975/06/12', to: '1975/06/12' },
          until: { from: null, to: '1975/06/12' },
        } as never,
      }),
      { columns: [column('day', 'date'), column('range', 'datetime'), column('until', 'date')], dateTime: service('Asia/Ho_Chi_Minh') }
    );
    expect(filtersOf(req)).toEqual([
      { field: 'day', operator: 'BETWEEN', data: { from: '1960-05-19T16:00:00.000Z', to: '1960-05-20T15:59:59.999Z' } },
      { field: 'range', operator: 'BETWEEN', data: { from: '1975-06-11T16:00:00.000Z', to: '1975-06-12T16:59:59.999Z' } },
      { field: 'until', operator: 'LESS_THAN', data: '1975-06-12T17:00:00.000Z' },
    ]);
  });

  it('gives each zone its own calendar day', () => {
    const req = SdConvertToPagingReq(request({ rawExternalFilter: { createdAt: { from: '1960/05/20', to: '1960/05/20' } } }), {
      externalFilters: [external('createdAt', 'date')],
      dateTime: service('Asia/Bangkok'),
    });
    expect(filtersOf(req).map(filter => filter['data'])).toEqual(['1960-05-19T17:00:00.000Z', '1960-05-20T17:00:00.000Z']);
  });

  it("matches the result without a service when the zone is 'local'", () => {
    const raw = {
      rawExternalFilter: {
        range: { from: new Date(2026, 7, 15), to: new Date(2026, 7, 16) },
        day: new Date(2026, 7, 15),
        at: '2026/08/15 08:00:00',
      },
      rawColumnFilter: { col: new Date(2026, 7, 15), colRange: { to: new Date(2026, 7, 16) } } as never,
    };
    const args = {
      externalFilters: [
        external('range', 'daterange'),
        external('day', 'date', 'LESS_OR_EQUAL'),
        external('at', 'datetime', 'GREATER_OR_EQUAL'),
      ],
      columns: [column('col', 'date'), column('colRange', 'datetime')],
    };
    const local = SdConvertToPagingReq(request(raw), { ...args, dateTime: service('local') });
    expect(filtersOf(local)).toEqual(filtersOf(SdConvertToPagingReq(request(raw), args)));
  });
});
