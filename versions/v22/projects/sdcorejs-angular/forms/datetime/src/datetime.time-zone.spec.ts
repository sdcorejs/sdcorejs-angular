import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { SdDateAdapter } from '@sdcorejs/angular-material-datetime';
import { SdDatetime } from './datetime.component';

// Expected values do not depend on the host time zone.
const VN = 'Asia/Ho_Chi_Minh';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdDatetime],
  template: `<sd-datetime
    name="at"
    [form]="fg"
    [transform]="transform"
    [min]="min"
    [model]="model"
    (modelChange)="model = $event"></sd-datetime>`,
})
class Host {
  @ViewChild(SdDatetime) datetime!: SdDatetime;
  fg = new FormGroup({});
  transform: 'ISOString' | 'UTCString' | undefined = undefined;
  min: unknown = undefined;
  model: unknown = undefined;
}

describe('SdDatetime with ISdCoreConfiguration.timeZone', () => {
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
  const enter = (display: string) => {
    host.datetime.formControl.setValue(display);
    fixture.detectChanges();
  };
  const fields = (value: Date | null) =>
    value && [value.getFullYear(), value.getMonth() + 1, value.getDate(), value.getHours(), value.getMinutes()];

  afterEach(() => jasmine.clock().uninstall());

  it('serializes the entered wall clock in the zone with transform', async () => {
    await setup(VN);
    host.transform = 'ISOString';
    fixture.detectChanges();
    enter('20/05/1960 08:00');
    expect(host.model).toBe('1960-05-20T00:00:00.000Z');
    expect(host.fg.get('at')!.value).toBe('1960-05-20T00:00:00.000Z');
  });

  it('emits the zone-less wall clock without transform and registers it in the parent form', async () => {
    await setup(VN);
    enter('20/05/1960 08:00');
    expect(host.model).toBe('1960/05/20 08:00:00');
    expect(host.fg.get('at')!.value).toBe('1960/05/20 08:00:00');
  });

  it('keeps the display string in the parent form without a zone', async () => {
    await setup();
    enter('20/05/1960 08:00');
    expect(host.model).toBe('1960/05/20 08:00:00');
    expect(host.fg.get('at')!.value).toBe('20/05/1960 08:00');
  });

  it('shows an instant model as the wall clock of the zone', async () => {
    await setup(VN);
    host.transform = 'ISOString';
    host.model = '1960-05-20T00:00:00Z';
    fixture.detectChanges();
    expect(host.datetime.formControl.value).toBe('20/05/1960 08:00');
    expect(fields(host.datetime.viewedDate())).toEqual([1960, 5, 20, 8, 0]);
  });

  it('reads an instant min as a wall-clock carrier in the zone', async () => {
    await setup(VN);
    host.min = '2026-08-14T17:00:00Z';
    fixture.detectChanges();
    expect(fields(host.datetime.resolvedMin())).toEqual([2026, 8, 15, 0, 0]);
  });

  it('resolves TODAY and the Now button to the wall clock of the zone', async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-08-14T17:30:00Z'));
    await setup(VN);
    host.min = 'TODAY';
    fixture.detectChanges();
    expect(fields(host.datetime.resolvedMin())).toEqual([2026, 8, 15, 0, 30]);
    const adapter = fixture.debugElement.query(By.directive(SdDatetime)).injector.get(SdDateAdapter) as SdDateAdapter<Date>;
    expect(fields(adapter.today())).toEqual([2026, 8, 15, 0, 30]);
  });
});
