import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { DateUtilities } from '@sdcorejs/utils/fns';
import { SdFormatDatePipe } from './format-date.pipe';
import { SdFormatDatetimePipe } from './format-datetime.pipe';
import { SdTimeDifferentPipe } from './time-different.pipe';

// Expected values do not depend on the host time zone.
const VN = 'Asia/Ho_Chi_Minh';
const BKK = 'Asia/Bangkok';
const INSTANT = '1960-05-19T16:00:00Z';

const configure = (timeZone?: string) => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: timeZone ? [{ provide: SD_CORE_CONFIGURATION, useValue: { timeZone } }] : [],
  });
};
const inContext = <T>(create: () => T): T => runInInjectionContext(TestBed.inject(EnvironmentInjector), create);

describe('date pipes with ISdCoreConfiguration.timeZone', () => {
  for (const [timeZone, date, datetime] of [
    [VN, '20/05/1960', '20/05/1960 00:00:00'],
    [BKK, '19/05/1960', '19/05/1960 23:00:00'],
  ] as const) {
    it(`show an instant as the wall clock of ${timeZone}`, async () => {
      configure(timeZone);
      expect(TestBed.inject(SdFormatDatePipe).transform(INSTANT)).toBe(date);
      expect(TestBed.inject(SdFormatDatetimePipe).transform(INSTANT)).toBe(datetime);
      const timeDifferent = inContext(() => new SdTimeDifferentPipe());
      expect(await firstValueFrom(timeDifferent.transform(INSTANT, 'dd/MM/yyyy', 'day'))).toBe(date);
      expect(await firstValueFrom(timeDifferent.transform(INSTANT, 'dd/MM/yyyy', undefined as never))).toBe(date);
    });
  }

  it('keep the digits of zone-less and date-only values in every zone', () => {
    for (const timeZone of [VN, BKK]) {
      configure(timeZone);
      expect(TestBed.inject(SdFormatDatePipe).transform('1960/05/20')).toBe('20/05/1960');
      expect(TestBed.inject(SdFormatDatetimePipe).transform('1960/05/20 08:00:00')).toBe('20/05/1960 08:00:00');
    }
  });

  it('keep the local behavior when created with new outside an injection context', () => {
    configure(VN);
    for (const value of [INSTANT, '1960/05/20', new Date(1960, 4, 20, 8)]) {
      expect(new SdFormatDatePipe().transform(value)).toBe(DateUtilities.toFormat(value, 'dd/MM/yyyy'));
      expect(new SdFormatDatetimePipe().transform(value)).toBe(DateUtilities.toFormat(value, 'dd/MM/yyyy HH:mm:ss'));
    }
  });

  it('follow the zone when created with new inside an injection context', () => {
    configure(VN);
    expect(inContext(() => new SdFormatDatePipe()).transform(INSTANT)).toBe('20/05/1960');
  });

  it('surface an invalid zone instead of silently falling back to local', () => {
    configure('+07:00');
    expect(() => TestBed.inject(SdFormatDatePipe)).toThrowError(/Invalid ISdCoreConfiguration\.timeZone "\+07:00"/);
  });

  it('match DateUtilities without options when no zone is configured', () => {
    configure();
    for (const value of [INSTANT, '1960/05/20', '2026/08/15 08:30:00']) {
      expect(TestBed.inject(SdFormatDatePipe).transform(value)).toBe(DateUtilities.toFormat(value, 'dd/MM/yyyy'));
      expect(TestBed.inject(SdFormatDatetimePipe).transform(value)).toBe(DateUtilities.toFormat(value, 'dd/MM/yyyy HH:mm:ss'));
    }
  });
});
