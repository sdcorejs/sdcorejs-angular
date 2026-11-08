import { InjectionToken } from '@angular/core';
import type { SdCalendarHoliday, SdCalendarWorkingHours } from './calendar.model';

/** App-wide defaults of `<sd-calendar>`. An input of the calendar wins over this configuration. */
export interface ISdCalendarConfiguration {
  /** 0–6, 0 is Sunday. Defaults to `1` (Monday). */
  firstDayOfWeek?: number;
  /** Minutes of one slot, a divisor of 60 (5, 10, 15, 20, 30, 60). Defaults to `30`. */
  step?: number;
  /** `null` turns the off-hours shading off. Defaults to Monday–Friday 08:00–12:00 and 13:00–17:30. */
  workingHours?: SdCalendarWorkingHours | null;
  /** Defaults to none. */
  holidays?: readonly SdCalendarHoliday[];
  /** `'HH:mm'` scrolled to when the week or day view opens. Defaults to the earliest working hour on screen. */
  scrollTime?: string;
}

export const SD_CALENDAR_CONFIGURATION = new InjectionToken<ISdCalendarConfiguration>('sd-calendar.configuration');

const WORKDAY = [
  { from: '08:00', to: '12:00' },
  { from: '13:00', to: '17:30' },
] as const;

/** @internal Built-in defaults, shared with `sd-scheduler`. Not covered by SemVer. */
export const ɵSD_CALENDAR_DEFAULTS = {
  firstDayOfWeek: 1,
  step: 30,
  agendaDays: 14,
  scrollTime: '08:00',
  workingHours: { 1: WORKDAY, 2: WORKDAY, 3: WORKDAY, 4: WORKDAY, 5: WORKDAY } as SdCalendarWorkingHours,
} as const;
