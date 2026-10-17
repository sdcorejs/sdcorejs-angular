import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { SdDateRange, type SdDateRangeValue } from './date-range.component';

// Expected values do not depend on the host time zone.
const VN = 'Asia/Ho_Chi_Minh';
const BKK = 'Asia/Bangkok';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdDateRange],
  template: `<sd-date-range
    name="period"
    [form]="fg"
    [transform]="transform"
    [min]="min"
    [model]="model"
    (modelChange)="model = $event"></sd-date-range>`,
})
class Host {
  @ViewChild(SdDateRange) range!: SdDateRange;
  fg = new FormGroup({});
  transform: 'ISOString' | 'UTCString' | undefined = undefined;
  min: unknown = undefined;
  model: SdDateRangeValue | undefined = undefined;
}

describe('SdDateRange with ISdCoreConfiguration.timeZone', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const setup = async (timeZone?: string, transform?: 'ISOString') => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Host, NoopAnimationsModule],
      providers: timeZone ? [{ provide: SD_CORE_CONFIGURATION, useValue: { timeZone } }] : [],
    }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    host.transform = transform;
    fixture.detectChanges();
  };
  const pick = (from: Date, to: Date) => {
    host.range.control1.setValue(from);
    host.range.control2.setValue(to);
    host.range.onEndChange({} as never);
    fixture.detectChanges();
  };
  const fields = (value: Date | null) => value && [value.getFullYear(), value.getMonth() + 1, value.getDate()];

  afterEach(() => jasmine.clock().uninstall());

  it('serializes each end as 00:00 in the zone with transform', async () => {
    await setup(VN);
    host.transform = 'ISOString';
    fixture.detectChanges();
    pick(new Date(1960, 4, 20), new Date(2026, 7, 15));
    expect(host.model).toEqual({ from: '1960-05-19T16:00:00.000Z', to: '2026-08-14T17:00:00.000Z' });
    expect(host.fg.get('period')!.value).toEqual({ from: '1960-05-19T16:00:00.000Z', to: '2026-08-14T17:00:00.000Z' });
  });

  it('registers the range model in the parent form when a zone is set, even without transform', async () => {
    await setup(VN);
    pick(new Date(1960, 4, 20), new Date(1960, 4, 20));
    expect(host.fg.get('period')!.value).toEqual({ from: '1960/05/20', to: '1960/05/20' });
  });

  it('keeps the picker Dates in the parent form without a zone', async () => {
    await setup();
    pick(new Date(1960, 4, 20), new Date(1960, 4, 21));
    expect(host.fg.get('period')!.value).toEqual({ from: new Date(1960, 4, 20), to: new Date(1960, 4, 21) });
  });

  for (const [timeZone, expected] of [
    [VN, '20/05/1960 → 21/05/1960'],
    [BKK, '19/05/1960 → 20/05/1960'],
  ] as const) {
    it(`shows instant ends on their calendar days in ${timeZone} (read-only text)`, async () => {
      await setup(timeZone);
      host.model = { from: '1960-05-19T16:00:00Z', to: '1960-05-20T16:00:00Z' };
      fixture.detectChanges();
      expect(host.range.formatted()).toBe(expected);
      expect(fields(host.range.control1.value)).toEqual(timeZone === VN ? [1960, 5, 20] : [1960, 5, 19]);
    });
  }

  it('resolves TODAY in the zone', async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-08-14T17:30:00Z'));
    await setup(VN);
    host.min = 'TODAY';
    fixture.detectChanges();
    expect(fields(host.range.resolvedMin())).toEqual([2026, 8, 15]);
  });

  describe('form.valueChanges', () => {
    const changes = () => {
      const values: unknown[] = [];
      host.fg.valueChanges.subscribe(value => values.push(value));
      return values;
    };

    it('emits the range model once per pick with a zone', async () => {
      await setup(VN);
      const values = changes();
      pick(new Date(1975, 5, 12), new Date(1975, 5, 12));
      await fixture.whenStable();
      expect(values).toEqual([{ period: { from: '1975/06/12', to: '1975/06/12' } }]);
    });

    it('emits the transformed range once per pick with transform and no zone', async () => {
      await setup(undefined, 'ISOString');
      const values = changes();
      pick(new Date(1975, 5, 12), new Date(1975, 5, 13));
      await fixture.whenStable();
      expect(values).toEqual([{ period: { from: new Date(1975, 5, 12).toISOString(), to: new Date(1975, 5, 13).toISOString() } }]);
    });

    it('stays silent when the host writes [model]', async () => {
      await setup(VN);
      const values = changes();
      host.model = { from: '1960/05/20', to: '1960/05/21' };
      fixture.detectChanges();
      await fixture.whenStable();
      expect(values).toEqual([]);
      expect(host.fg.get('period')!.value).toEqual({ from: '1960/05/20', to: '1960/05/21' });
    });
  });
});
