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

      expect(calendar.dateClass(new Date(1960, 4, 20))).toBe('sd-chip-calendar-selected-date');
      calendar.onSelectDate(new Date(1975, 5, 12));
      expect(calendar.model()).toEqual(['1960/05/20', '1975/06/12']);
    });
  }
});
