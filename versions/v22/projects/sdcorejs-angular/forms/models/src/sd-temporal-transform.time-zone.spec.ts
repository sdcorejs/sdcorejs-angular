import { TestBed } from '@angular/core/testing';
import { DateAdapter } from '@angular/material/core';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { provideSdStrictDateFnsAdapter } from './sd-strict-date-adapter';
import { sdParseTransformedTemporal, ɵsdParseTransformedInstant } from './sd-temporal-transform';
import { enUS } from 'date-fns/locale';
import { MAT_DATE_LOCALE } from '@angular/material/core';

describe('ɵsdParseTransformedInstant', () => {
  it('returns instants for the wire formats that carry a zone', () => {
    expect(ɵsdParseTransformedInstant('Thu, 19 May 1960 16:00:00 GMT')?.toISOString()).toBe('1960-05-19T16:00:00.000Z');
    expect(ɵsdParseTransformedInstant('1960-05-19 16:00:00Z')?.toISOString()).toBe('1960-05-19T16:00:00.000Z');
    expect(ɵsdParseTransformedInstant(' 1960-05-19T16:00:00+0000 ')?.toISOString()).toBe('1960-05-19T16:00:00.000Z');
  });

  it('returns null for zone-less matches so they are never converted twice', () => {
    expect(ɵsdParseTransformedInstant('1960-05-20')).toBeNull();
    expect(ɵsdParseTransformedInstant('1960-05-20T08:00:00')).toBeNull();
    expect(ɵsdParseTransformedInstant('1960-05-20 08:00')).toBeNull();
    expect(ɵsdParseTransformedInstant(42)).toBeNull();
  });

  it('leaves the public sdParseTransformedTemporal unchanged', () => {
    expect(sdParseTransformedTemporal('1960-05-20')?.getTime()).toBe(new Date(1960, 4, 20).getTime());
  });
});

describe('SdStrictDateFnsAdapter.today with ISdCoreConfiguration.timeZone', () => {
  afterEach(() => jasmine.clock().uninstall());

  const adapterWith = (timeZone?: string): DateAdapter<Date> => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: MAT_DATE_LOCALE, useValue: enUS },
        ...provideSdStrictDateFnsAdapter({
          parse: { dateInput: 'dd/MM/yyyy' },
          display: { dateInput: 'dd/MM/yyyy', monthYearLabel: 'MMM yyyy', dateA11yLabel: 'PP', monthYearA11yLabel: 'MMMM yyyy' },
        }),
        ...(timeZone ? [{ provide: SD_CORE_CONFIGURATION, useValue: { timeZone } }] : []),
      ],
    });
    return TestBed.inject(DateAdapter) as DateAdapter<Date>;
  };

  it('returns today in the zone (calendar today marker)', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-08-14T17:30:00Z'));
    const today = adapterWith('Asia/Ho_Chi_Minh').today();
    expect([today.getFullYear(), today.getMonth() + 1, today.getDate()]).toEqual([2026, 8, 15]);
  });

  it('keeps the base adapter today() without a zone', () => {
    jasmine.clock().install();
    const reference = new Date(2026, 7, 15, 9, 30);
    jasmine.clock().mockDate(reference);
    expect(adapterWith().today().getTime()).toBe(reference.getTime());
  });
});
