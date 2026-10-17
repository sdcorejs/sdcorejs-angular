import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { SdDate } from './date.component';

// Expected values do not depend on the host time zone (CI: UTC, developers: Asia/Bangkok).
// Asia/Ho_Chi_Minh was +08 in 1960, +07 in 2026; Asia/Bangkok is always +07.
const VN = 'Asia/Ho_Chi_Minh';
const BKK = 'Asia/Bangkok';

@Component({
  standalone: true,
  imports: [SdDate],
  template: `<sd-date name="dob" [form]="fg" [transform]="transform" [min]="min" [model]="model" (modelChange)="model = $event"></sd-date>`,
})
class Host {
  @ViewChild(SdDate) date!: SdDate;
  fg = new FormGroup({});
  transform: 'ISOString' | 'UTCString' | undefined = undefined;
  min: unknown = undefined;
  model: unknown = undefined;
}

describe('SdDate with ISdCoreConfiguration.timeZone', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const setup = async (timeZone?: string) => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Host, NoopAnimationsModule],
      providers: timeZone ? [{ provide: SD_CORE_CONFIGURATION, useValue: { timeZone } }] : [],
    }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  };
  const pick = (value: Date) => {
    host.date.formControl.setValue(value);
    fixture.detectChanges();
  };
  const shown = () => (fixture.nativeElement.querySelector('input') as HTMLInputElement).value;
  const fields = (value: Date | null) => value && [value.getFullYear(), value.getMonth() + 1, value.getDate()];

  afterEach(() => jasmine.clock().uninstall());

  it('serializes the picked day as 00:00 in the zone with transform', async () => {
    await setup(VN);
    host.transform = 'ISOString';
    fixture.detectChanges();
    pick(new Date(1960, 4, 20));
    expect(host.model).toBe('1960-05-19T16:00:00.000Z');
    expect(host.fg.get('dob')!.value).toBe('1960-05-19T16:00:00.000Z');
    pick(new Date(2026, 7, 15));
    expect(host.model).toBe('2026-08-14T17:00:00.000Z');
  });

  for (const [timeZone, expected] of [
    [VN, '20/05/1960'],
    [BKK, '19/05/1960'],
  ] as const) {
    it(`shows an instant model on its calendar day in ${timeZone}`, async () => {
      await setup(timeZone);
      host.transform = 'ISOString';
      host.model = '1960-05-19T16:00:00Z';
      fixture.detectChanges();
      expect(shown()).toBe(expected);
    });
  }

  it('registers the model value in the parent form when a zone is set, even without transform', async () => {
    await setup(VN);
    pick(new Date(1960, 4, 20));
    expect(host.model).toBe('1960/05/20');
    expect(host.fg.get('dob')!.value).toBe('1960/05/20');
  });

  it('keeps the picker Date in the parent form without a zone', async () => {
    await setup();
    pick(new Date(1960, 4, 20));
    expect(host.model).toBe('1960/05/20');
    expect(host.fg.get('dob')!.value).toEqual(new Date(1960, 4, 20));
  });

  it('keeps a date-only model on the same day in every configuration', async () => {
    for (const timeZone of [VN, BKK, undefined]) {
      await setup(timeZone);
      host.model = '1960/05/20';
      fixture.detectChanges();
      expect(shown()).toBe('20/05/1960');
      expect(host.model).toBe('1960/05/20');
    }
  });

  it('reads an instant min as its calendar day in the zone', async () => {
    await setup(VN);
    host.min = '1960-05-19T16:00:00Z';
    fixture.detectChanges();
    expect(fields(host.date.resolvedMin())).toEqual([1960, 5, 20]);
  });

  it('resolves TODAY and the calendar today marker in the zone', async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-08-14T17:30:00Z'));
    await setup(VN);
    host.min = 'TODAY';
    fixture.detectChanges();
    expect(fields(host.date.resolvedMin())).toEqual([2026, 8, 15]);
    const adapter = fixture.debugElement.query(By.directive(SdDate)).injector.get(DateAdapter<Date>);
    expect(fields(adapter.today())).toEqual([2026, 8, 15]);
  });
});
