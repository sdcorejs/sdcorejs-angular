import * as calendar from '../index';
import type {
  ISdCalendarConfiguration,
  SdCalendarDateInput,
  SdCalendarEvent,
  SdCalendarHoliday,
  SdCalendarMoveScope,
  SdCalendarMoveSource,
  SdCalendarRange,
  SdCalendarState,
  SdCalendarWorkingHours,
} from '../index';

describe('sd-calendar entry point', () => {
  it('[CAL-C-23] exports the types, token and helpers sd-scheduler builds on', () => {
    const range: SdCalendarRange = { start: '2026/10/22 09:00:00', end: '2026/10/22 10:00:00', allDay: false };
    const input: SdCalendarDateInput = range.start;
    const source: SdCalendarMoveSource = 'api';
    const scope: SdCalendarMoveScope = 'this';
    const hours: SdCalendarWorkingHours = { 1: [{ from: '08:00', to: '17:00' }] };
    const holiday: SdCalendarHoliday = { date: input, label: 'Tết', type: 'off' };
    const event: SdCalendarEvent = { id: 'a', title: 'A', start: input };
    const state: SdCalendarState<SdCalendarEvent> = true;
    const configuration: ISdCalendarConfiguration = { workingHours: hours, holidays: [holiday] };
    expect([source, scope, event, state, configuration].length).toBe(5);

    expect(calendar.SD_CALENDAR_CONFIGURATION.toString()).toContain('sd-calendar.configuration');
    expect(calendar.ɵSD_CALENDAR_DEFAULTS.step).toBe(30);
    for (const helper of [
      calendar.ɵsdCalendarVisibleRange,
      calendar.ɵsdCalendarVisibleDays,
      calendar.ɵsdCalendarShiftDate,
      calendar.ɵsdCalendarStack,
      calendar.ɵsdCalendarSnapMove,
      calendar.ɵsdCalendarResizeEnd,
      calendar.ɵsdCalendarSweep,
      calendar.ɵsdCalendarSlot,
      calendar.ɵsdCalendarPlace,
      calendar.ɵsdCalendarSerialize,
      calendar.ɵsdCalendarRangeOf,
      calendar.ɵsdCalendarReadDay,
      calendar.ɵsdCalendarWorkingRanges,
    ]) {
      expect(typeof helper).toBe('function');
    }
    expect(
      calendar.ɵsdCalendarVisibleRange({ view: 'day', date: '2026/10/22', firstDayOfWeek: 1, hideWeekends: false, agendaDays: 14 })
    ).toEqual({
      from: '2026/10/22',
      to: '2026/10/22',
      view: 'day',
    });
  });
});
