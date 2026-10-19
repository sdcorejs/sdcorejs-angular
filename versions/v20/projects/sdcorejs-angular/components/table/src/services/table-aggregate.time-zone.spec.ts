import { TestBed } from '@angular/core/testing';
import { SD_CORE_CONFIGURATION, type SdTimeZone } from '@sdcorejs/angular/configurations';
import { SdDateTimeService } from '@sdcorejs/angular/services/date-time';
import type { SdTableAggregateContext, SdTableAggregateOperation } from '../models/table-aggregate.model';
import type { SdTableColumnNormal } from '../models/table-column.model';
import type { SdTableOption } from '../models/table-option.model';
import { buildAggregateSnapshot, calculateAggregate } from './table-aggregate.util';

// Aggregate MIN/MAX under ISdCoreConfiguration.timeZone: zone-less row values are wall clock in
// the zone. '1960/05/20 08:00:00' is 1960-05-20T00:00:00Z in Asia/Ho_Chi_Minh (+08 in 1960), so it
// is earlier than '1960-05-20T00:30:00Z' only when read in that zone.

interface Row {
  value: unknown;
}

const service = (timeZone: SdTimeZone): SdDateTimeService => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: SD_CORE_CONFIGURATION, useValue: { timeZone } }] });
  return TestBed.inject(SdDateTimeService);
};

const column: SdTableColumnNormal<Row> = { field: 'value', type: 'datetime', title: 'Value' };
const context: SdTableAggregateContext<Row> = { column, kind: 'total', scope: 'page', isComplete: true };
const values = ['1960/05/20 08:00:00', '1960-05-20T00:30:00Z', '', null];
const items = values.map(value => ({ value }));
const calculate = (op: SdTableAggregateOperation, dateTime?: SdDateTimeService) =>
  calculateAggregate(items, context, { calculate: op }, dateTime);

describe('table aggregate with ISdCoreConfiguration.timeZone', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('reads zone-less values as wall clock in the zone', () => {
    const dateTime = service('Asia/Ho_Chi_Minh');
    expect(calculate('MIN', dateTime)).toEqual(new Date('1960-05-20T00:00:00Z'));
    expect(calculate('MAX', dateTime)).toEqual(new Date('1960-05-20T00:30:00Z'));
  });

  it('passes the zone through the aggregate snapshot', () => {
    const dateTime = service('Asia/Ho_Chi_Minh');
    const snapshot = buildAggregateSnapshot({
      columns: [{ ...column, aggregate: 'MIN' }],
      roots: items,
      option: { type: 'local', items: () => items, columns: [] } as unknown as SdTableOption<Row>,
      complete: true,
      loadedChildren: new Set<Row>(),
      format: value => (value instanceof Date ? value.toISOString() : String(value)),
      diagnose: error => {
        throw error;
      },
      dateTime,
    });
    expect(snapshot.total?.cells.get('value')?.text).toBe('1960-05-20T00:00:00.000Z');
  });

  it("matches the result without a service when the zone is 'local'", () => {
    const dateTime = service('local');
    for (const op of ['MIN', 'MAX'] as const) {
      expect(calculate(op, dateTime)).toEqual(calculate(op));
    }
  });
});
