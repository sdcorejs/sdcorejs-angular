import * as scheduler from '../index';
import type { SdSchedulerEvent, SdSchedulerOption, SdSchedulerResource } from '../index';
import { ɵsdCalendarAddDays, type SdCalendarEvent } from '@sdcorejs/angular/components/calendar';
import { sdSchedulerVisibleDays } from './scheduler.utils';

describe('sd-scheduler entry point', () => {
  it('[SCH-C-18] exports its own API and builds on the calendar instead of copying it', () => {
    for (const directive of [
      scheduler.SdSchedulerEventTemplateDirective,
      scheduler.SdSchedulerResourceTemplateDirective,
      scheduler.SdSchedulerCellTemplateDirective,
      scheduler.SdSchedulerEmptyTemplateDirective,
    ]) {
      expect(typeof directive).toBe('function');
    }
    // The calendar's types, token and helpers are imported from the calendar entry point, never re-exported here.
    const names = Object.keys(scheduler);
    expect(names.filter(name => /calendar/i.test(name))).toEqual([]);
    // A scheduler event is a calendar event, so the shared pipeline takes it as is.
    const event: SdSchedulerEvent = { id: 'a', title: 'A', resourceId: 'r', start: '2026/11/09 09:00:00', end: '2026/11/09 10:00:00' };
    const asCalendar: SdCalendarEvent = event;
    const resource: SdSchedulerResource = { id: 'r', title: 'Huế' };
    const option: SdSchedulerOption = { dataSource: { onLoad: () => [event] } };
    expect([asCalendar, resource, option].length).toBe(3);
    // The week of the scheduler is made of the calendar's day arithmetic.
    expect(sdSchedulerVisibleDays('week', '2026/11/09', 1)[6]).toBe(ɵsdCalendarAddDays('2026/11/09', 6));
  });
});
