import { TestBed } from '@angular/core/testing';
import { SD_CORE_CONFIGURATION, type SdTimeZone } from '@sdcorejs/angular/configurations';
import { SdDateTimeService } from '@sdcorejs/angular/services/date-time';
import { SdTableColumn } from '../../models/table-column.model';
import { SdTableFilterRequest } from '../table-filter/table-filter.model';
import { compareLocalValues } from './table-local-sort.util';
import { filterLocalItems, matchesColumnFilter } from './table-local.util';

// Client-side filter and sort under ISdCoreConfiguration.timeZone. Row values without an offset are
// wall clock in the zone; the expectations hold on any machine zone (Bangkok locally, UTC in CI).

interface Row {
  id: number;
  at: string;
}

const service = (timeZone: SdTimeZone): SdDateTimeService => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: SD_CORE_CONFIGURATION, useValue: { timeZone } }] });
  return TestBed.inject(SdDateTimeService);
};

const columns = (type: 'date' | 'datetime'): SdTableColumn<Row>[] => [{ field: 'at', type, title: 'At' } as SdTableColumn<Row>];

const request = (partial: Partial<SdTableFilterRequest<Row>>): SdTableFilterRequest<Row> =>
  ({
    columnOperator: {},
    rawColumnFilter: {},
    rawExternalFilter: {},
    pageNumber: 0,
    pageSize: 50,
    ...partial,
  }) as SdTableFilterRequest<Row>;

const rows: Row[] = [
  { id: 1, at: '1960-05-19T16:00:00Z' }, // 20/05/1960 00:00 in Asia/Ho_Chi_Minh
  { id: 2, at: '1960/05/20 23:30:00' }, // zone-less: 20/05/1960 23:30 in the zone
  { id: 3, at: '1960-05-20T16:00:00Z' }, // 21/05/1960 00:00 in the zone
  { id: 4, at: '1960-05-19T15:59:59Z' }, // 19/05/1960 23:59:59 in the zone
];

describe('table local filter and sort with ISdCoreConfiguration.timeZone', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('keeps the rows of the filtered calendar day in the zone', () => {
    const dateTime = service('Asia/Ho_Chi_Minh');
    for (const type of ['date', 'datetime'] as const) {
      const result = filterLocalItems(
        rows,
        { type: 'local', columns: columns(type), dateTime },
        request({ rawColumnFilter: { at: '1960/05/20' } as never })
      );
      expect(result.items.map(row => row.id))
        .withContext(type)
        .toEqual([1, 2]);
    }
  });

  it('filters a range by the zone day bounds', () => {
    const dateTime = service('Asia/Ho_Chi_Minh');
    const filter = { at: { from: '1960/05/20', to: '1960/05/21' } };
    expect(rows.filter(row => matchesColumnFilter(row, columns('date'), filter, dateTime)).map(row => row.id)).toEqual([1, 2, 3]);
  });

  it('sorts zone-less values as wall clock in the zone', () => {
    const dateTime = service('Asia/Ho_Chi_Minh');
    const zoneLess = { id: 1, at: '1960/05/20 08:00:00' }; // 1960-05-20T00:00:00Z in the zone
    const instant = { id: 2, at: '1960-05-20T00:30:00Z' };
    expect(compareLocalValues(zoneLess.at, instant.at, 'datetime', 'ASC', dateTime)).toBeLessThan(0);
    const result = filterLocalItems(
      [instant, zoneLess],
      { type: 'local', columns: columns('datetime'), dateTime },
      request({ orderBy: 'at', orderDirection: 'ASC' } as never)
    );
    expect(result.items.map(row => row.id)).toEqual([1, 2]);
  });

  it("matches the result without a service when the zone is 'local'", () => {
    const dateTime = service('local');
    const filter = { at: { from: new Date(1960, 4, 20), to: new Date(1960, 4, 20) } };
    for (const row of rows) {
      expect(matchesColumnFilter(row, columns('date'), filter, dateTime)).toBe(matchesColumnFilter(row, columns('date'), filter));
    }
    const sorted = filterLocalItems(
      rows,
      { type: 'local', columns: columns('datetime'), dateTime },
      request({ orderBy: 'at', orderDirection: 'DESC' } as never)
    );
    const baseline = filterLocalItems(
      rows,
      { type: 'local', columns: columns('datetime') },
      request({ orderBy: 'at', orderDirection: 'DESC' } as never)
    );
    expect(sorted.items.map(row => row.id)).toEqual(baseline.items.map(row => row.id));
  });
});
