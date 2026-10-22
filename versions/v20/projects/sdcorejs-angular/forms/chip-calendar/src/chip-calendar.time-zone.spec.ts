import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { SdChipCalendar } from './chip-calendar.component';

// sd-chip-calendar only handles calendar days; a configured zone must never shift them.
describe('SdChipCalendar with ISdCoreConfiguration.timeZone', () => {
  for (const timeZone of ['Asia/Ho_Chi_Minh', 'Asia/Bangkok', undefined]) {
    it(`keeps calendar days unchanged (${timeZone ?? 'no zone'})`, async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [SdChipCalendar, NoopAnimationsModule],
        providers: timeZone ? [{ provide: SD_CORE_CONFIGURATION, useValue: { timeZone } }] : [],
      }).compileComponents();
      const fixture = TestBed.createComponent(SdChipCalendar);
      fixture.componentRef.setInput('model', ['1960/05/20']);
      fixture.detectChanges();
      const calendar = fixture.componentInstance;

      expect(calendar.dateClass(new Date(1960, 4, 20))).toContain('sd-chip-calendar-selected');
      calendar.onSelectDate(new Date(1975, 5, 12));
      expect(calendar.model()).toEqual(['1960/05/20', '1975/06/12']);
    });
  }

  // Design handoff step 1 (4.7): an instant takes its calendar day in the configured zone, like sd-date, and a
  // transform writes the start of the picked day in that zone.
  describe('instants and transform in a configured zone (America/New_York)', () => {
    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [SdChipCalendar, NoopAnimationsModule],
        providers: [{ provide: SD_CORE_CONFIGURATION, useValue: { timeZone: 'America/New_York' } }],
      }).compileComponents();
    });

    it('reads an ISO instant as its day in the zone', () => {
      const fixture = TestBed.createComponent(SdChipCalendar);
      // 02:00Z on 5 Oct is 22:00 on 4 Oct in New York (EDT, UTC-4).
      fixture.componentRef.setInput('model', ['2026-10-05T02:00:00.000Z', new Date(Date.UTC(2026, 9, 10, 2)).getTime()]);
      fixture.detectChanges();
      expect(fixture.componentInstance.formControl.value).toEqual(['2026/10/04', '2026/10/09']);
    });

    it('writes transform="ISOString" as the start of the day in the zone', () => {
      const fixture = TestBed.createComponent(SdChipCalendar);
      fixture.componentRef.setInput('model', []);
      fixture.componentRef.setInput('transform', 'ISOString');
      fixture.detectChanges();
      fixture.componentInstance.onSelectDate(new Date(2026, 9, 7));
      expect(fixture.componentInstance.model()).toEqual(['2026-10-07T04:00:00.000Z']);
    });
  });
});
