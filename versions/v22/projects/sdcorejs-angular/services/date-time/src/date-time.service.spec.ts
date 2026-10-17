import { TestBed } from '@angular/core/testing';
import { SD_CORE_CONFIGURATION, type ISdCoreConfiguration } from '@sdcorejs/angular/configurations';
import { DateUtilities } from '@sdcorejs/utils/fns';
import { SdDateTimeService, ɵSD_LOCAL_DATE_TIME } from './date-time.service';

// Expected values do not depend on the host time zone (CI runs in UTC, developers in Asia/Bangkok).
// Asia/Ho_Chi_Minh was +08 from 1959-12-31 to 1975-06-13 (local), +07 before and after.
const VN = 'Asia/Ho_Chi_Minh';
const BKK = 'Asia/Bangkok';

const serviceWith = (configuration?: ISdCoreConfiguration): SdDateTimeService => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: configuration ? [{ provide: SD_CORE_CONFIGURATION, useValue: configuration }] : [],
  });
  return TestBed.inject(SdDateTimeService);
};

const localFields = (value: Date | null) =>
  value && [value.getFullYear(), value.getMonth() + 1, value.getDate(), value.getHours(), value.getMinutes(), value.getSeconds()];

describe('SdDateTimeService', () => {
  afterEach(() => jasmine.clock().uninstall());

  describe('configuration', () => {
    it('defaults to local without SD_CORE_CONFIGURATION or timeZone', () => {
      expect(serviceWith().timeZone).toBe('local');
      expect(serviceWith({ language: 'en' }).timeZone).toBe('local');
      expect(serviceWith({ timeZone: 'local' }).timeZone).toBe('local');
    });

    it('reports the configured IANA zone', () => {
      expect(serviceWith({ timeZone: VN }).timeZone).toBe(VN);
    });

    for (const invalid of ['+07:00', 'Mars/Base', 'GMT+7', '']) {
      it(`throws a clear error for ${JSON.stringify(invalid)}`, () => {
        expect(() => serviceWith({ timeZone: invalid })).toThrowError(
          `[@sdcorejs/angular] Invalid ISdCoreConfiguration.timeZone "${invalid}": use an IANA time zone id such as "Asia/Ho_Chi_Minh", or "local".`
        );
      });
    }

    it('resolves the zone once from the root injector', () => {
      const service = serviceWith({ timeZone: VN });
      expect(TestBed.inject(SdDateTimeService)).toBe(service);
    });
  });

  describe('with a fixed zone', () => {
    it('formats instants as the wall clock of the zone', () => {
      expect(serviceWith({ timeZone: VN }).toFormat('1960-05-19T16:00:00Z', 'dd/MM/yyyy')).toBe('20/05/1960');
      expect(serviceWith({ timeZone: BKK }).toFormat('1960-05-19T16:00:00Z', 'dd/MM/yyyy')).toBe('19/05/1960');
      expect(serviceWith({ timeZone: VN }).toFormat('not a date', 'dd/MM/yyyy')).toBe('');
    });

    it('parses zone-less values as wall clock in the zone', () => {
      const service = serviceWith({ timeZone: VN });
      expect(service.parse('1960/05/20 08:00:00')?.toISOString()).toBe('1960-05-20T00:00:00.000Z');
      expect(service.parse('1960-05-19T16:00:00Z')?.toISOString()).toBe('1960-05-19T16:00:00.000Z');
      expect(service.parse('nope')).toBeNull();
      expect(service.parseFrom('20/05/1960', 'dd/MM/yyyy')?.toISOString()).toBe('1960-05-19T16:00:00.000Z');
    });

    it('computes calendar-day bounds in the zone', () => {
      const service = serviceWith({ timeZone: VN });
      expect(service.begin('1975/06/12')?.toISOString()).toBe('1975-06-11T16:00:00.000Z');
      expect(service.end('1975/06/12')?.toISOString()).toBe('1975-06-12T16:59:59.999Z');
      expect(service.beginOfNextDay('1975/06/12')?.toISOString()).toBe('1975-06-12T17:00:00.000Z');
      expect(service.beginOfNextDay('1960/05/20')?.toISOString()).toBe('1960-05-20T16:00:00.000Z');
      expect(service.beginOfNextDay('nope')).toBeNull();
    });

    it('converts between instants and wall-clock carriers', () => {
      const service = serviceWith({ timeZone: VN });
      expect(localFields(service.toWallClock('1960-05-20T00:00:00Z'))).toEqual([1960, 5, 20, 8, 0, 0]);
      expect(localFields(service.toWallClock('1960/05/20 08:00:00'))).toEqual([1960, 5, 20, 8, 0, 0]);
      expect(service.toWallClock('nope')).toBeNull();
      expect(service.fromWallClock(new Date(1960, 4, 20, 8, 0)).toISOString()).toBe('1960-05-20T00:00:00.000Z');
      expect(
        serviceWith({ timeZone: BKK })
          .fromWallClock(new Date(1960, 4, 20, 8, 0))
          .toISOString()
      ).toBe('1960-05-20T01:00:00.000Z');
    });

    it('takes today and now from the clock in the zone', () => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2026-08-14T17:30:00Z'));
      for (const timeZone of [VN, BKK]) {
        const service = serviceWith({ timeZone });
        expect(localFields(service.today())).toEqual([2026, 8, 15, 0, 0, 0]);
        expect(localFields(service.now())).toEqual([2026, 8, 15, 0, 30, 0]);
      }
      expect(localFields(serviceWith({ timeZone: 'UTC' }).today())).toEqual([2026, 8, 14, 0, 0, 0]);
    });
  });

  describe('in local mode', () => {
    const values: unknown[] = [
      '1960-05-19T16:00:00Z',
      '1960/05/20',
      '2026/08/15 08:30:00',
      Date.UTC(2026, 7, 15),
      new Date(2026, 7, 15, 9),
    ];

    it('returns exactly what DateUtilities returns without options', () => {
      const service = serviceWith();
      for (const value of values) {
        expect(service.toFormat(value, 'yyyy/MM/dd HH:mm:ss')).toBe(DateUtilities.toFormat(value, 'yyyy/MM/dd HH:mm:ss'));
        expect(service.parse(value)?.getTime()).toBe(DateUtilities.parse(value)?.getTime());
        expect(service.begin(value)?.getTime()).toBe(DateUtilities.begin(value)?.getTime());
        expect(service.end(value)?.getTime()).toBe(DateUtilities.end(value)?.getTime());
        expect(service.beginOfNextDay(value)?.getTime()).toBe(DateUtilities.begin(DateUtilities.addDays(value, 1))?.getTime());
        expect(service.toWallClock(value)?.getTime()).toBe(DateUtilities.parse(value)?.getTime());
      }
      expect(service.parseFrom('20/05/1960', 'dd/MM/yyyy')?.getTime()).toBe(DateUtilities.parseFrom('20/05/1960', 'dd/MM/yyyy')?.getTime());
      const carrier = new Date(1960, 4, 20, 8, 0);
      expect(service.fromWallClock(carrier).getTime()).toBe(carrier.getTime());
    });

    it('matches ɵSD_LOCAL_DATE_TIME, the injector-free local fallback', () => {
      const service = serviceWith();
      expect(ɵSD_LOCAL_DATE_TIME.timeZone).toBe('local');
      for (const value of values) {
        expect(ɵSD_LOCAL_DATE_TIME.toFormat(value, 'yyyy/MM/dd HH:mm:ss')).toBe(service.toFormat(value, 'yyyy/MM/dd HH:mm:ss'));
        expect(ɵSD_LOCAL_DATE_TIME.parse(value)?.getTime()).toBe(service.parse(value)?.getTime());
        expect(ɵSD_LOCAL_DATE_TIME.begin(value)?.getTime()).toBe(service.begin(value)?.getTime());
        expect(ɵSD_LOCAL_DATE_TIME.end(value)?.getTime()).toBe(service.end(value)?.getTime());
        expect(ɵSD_LOCAL_DATE_TIME.beginOfNextDay(value)?.getTime()).toBe(service.beginOfNextDay(value)?.getTime());
      }
    });

    it('takes today and now from the host clock', () => {
      jasmine.clock().install();
      const reference = new Date(2026, 7, 15, 0, 30, 0);
      jasmine.clock().mockDate(reference);
      const service = serviceWith();
      expect(service.today().getTime()).toBe(new Date(2026, 7, 15).getTime());
      expect(service.now().getTime()).toBe(reference.getTime());
    });
  });
});
