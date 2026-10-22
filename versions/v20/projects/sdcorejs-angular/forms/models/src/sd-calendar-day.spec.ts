import { ɵsdNormalizeCalendarDay } from './sd-calendar-day';

// Shared calendar-day reading of <sd-date> and <sd-chip-calendar> (chip-calendar handoff 4.7).
describe('ɵsdNormalizeCalendarDay', () => {
  it('reads canonical days, Dates, timestamps, ISO and RFC-1123 strings without a zone', () => {
    expect(ɵsdNormalizeCalendarDay('2026/10/05')).toBe('2026/10/05');
    expect(ɵsdNormalizeCalendarDay(new Date(2026, 9, 5, 23, 30))).toBe('2026/10/05');
    expect(ɵsdNormalizeCalendarDay(new Date(2026, 9, 5).getTime())).toBe('2026/10/05');
    expect(ɵsdNormalizeCalendarDay(new Date(2026, 9, 5, 12).toISOString())).toBe('2026/10/05');
    expect(ɵsdNormalizeCalendarDay(new Date(2026, 9, 5, 12).toUTCString())).toBe('2026/10/05');
  });

  it('returns null for empty and unreadable values', () => {
    for (const value of [null, undefined, '', 'not a date', {}]) {
      expect(ɵsdNormalizeCalendarDay(value)).withContext(String(value)).toBeNull();
    }
  });

  it('asks the zone for the day of an instant when a zone is configured', () => {
    const zone = { timeZone: 'America/New_York', toFormat: jasmine.createSpy('toFormat').and.returnValue('2026/10/04') };
    expect(ɵsdNormalizeCalendarDay('2026-10-05T02:00:00.000Z', zone)).toBe('2026/10/04');
    expect(zone.toFormat).toHaveBeenCalledWith('2026-10-05T02:00:00.000Z', 'yyyy/MM/dd');
  });

  it('ignores a local zone', () => {
    const zone = { timeZone: 'local', toFormat: jasmine.createSpy('toFormat') };
    expect(ɵsdNormalizeCalendarDay('2026/10/05', zone)).toBe('2026/10/05');
    expect(zone.toFormat).not.toHaveBeenCalled();
  });
});
