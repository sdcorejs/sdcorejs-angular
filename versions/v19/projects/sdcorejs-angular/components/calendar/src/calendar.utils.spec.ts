import { clockFor } from '../../../testing/schedule-testing';
import type { SdCalendarEvent } from './calendar.model';
import {
  SD_CALENDAR_STEPS,
  sdCalendarAddDays,
  sdCalendarAddMonths,
  sdCalendarAddMonthsKeepDay,
  sdCalendarAllDayLayout,
  sdCalendarClampAgendaDays,
  sdCalendarClockText,
  sdCalendarDay,
  sdCalendarDayDiff,
  sdCalendarDayParts,
  sdCalendarInitialScroll,
  sdCalendarIsWeekend,
  sdCalendarMonthWeeks,
  sdCalendarMoveStep,
  sdCalendarNormalizeStep,
  sdCalendarOffSegments,
  sdCalendarPlace,
  sdCalendarRangeOf,
  sdCalendarReadDay,
  sdCalendarReadWallClock,
  sdCalendarResizeEnd,
  sdCalendarSerialize,
  sdCalendarShiftDate,
  sdCalendarSlot,
  sdCalendarSnapMove,
  sdCalendarStack,
  sdCalendarStartOfWeek,
  sdCalendarSweep,
  sdCalendarTimeToMinutes,
  sdCalendarVisibleDays,
  sdCalendarVisibleRange,
  sdCalendarWeekday,
  sdCalendarWorkingRanges,
  type SdCalendarRangeInput,
} from './calendar.utils';

const input = (patch: Partial<SdCalendarRangeInput>): SdCalendarRangeInput => ({
  view: 'week',
  date: '2026/10/22',
  firstDayOfWeek: 1,
  hideWeekends: false,
  agendaDays: 14,
  ...patch,
});

const event = (patch: Partial<SdCalendarEvent>): SdCalendarEvent => ({ id: 'e', title: 'Event', start: '2026/10/22 09:00:00', ...patch });

describe('sd-calendar utils', () => {
  const hcm = clockFor('Asia/Ho_Chi_Minh');
  const newYork = clockFor('America/New_York');

  describe('days', () => {
    it('[CAL-U-01] reads, builds and shifts calendar days without a time zone', () => {
      expect(sdCalendarDayParts('2026/10/22')).toEqual({ year: 2026, month: 10, day: 22 });
      expect(sdCalendarDayParts('2026-10-22')).toBeNull();
      expect(sdCalendarDayParts('2026/02/30')).toBeNull();
      expect(sdCalendarDay(2026, 13, 1)).toBe('2027/01/01');
      expect(sdCalendarDay(476, 1, 1)).toBe('0476/01/01');
      expect(sdCalendarAddDays('2026/10/31', 1)).toBe('2026/11/01');
      expect(sdCalendarAddDays('2026/03/01', -1)).toBe('2026/02/28');
      expect(sdCalendarAddMonths('2026/01/31', 1)).toBe('2026/02/01');
      expect(sdCalendarAddMonths('2026/01/15', -1)).toBe('2025/12/01');
      expect(sdCalendarAddMonthsKeepDay('2026/10/31', 1)).toBe('2026/11/30');
      expect(sdCalendarAddMonthsKeepDay('2024/02/29', 12)).toBe('2025/02/28');
      expect(sdCalendarAddMonthsKeepDay('2026/11/30', -12)).toBe('2025/11/30');
      expect(sdCalendarWeekday('2026/10/22')).toBe(4);
      expect(sdCalendarWeekday('2026/11/08')).toBe(0);
      expect(sdCalendarDayDiff('2026/10/22', '2026/11/04')).toBe(13);
      expect(sdCalendarDayDiff('2026/11/04', '2026/10/22')).toBe(-13);
      expect(sdCalendarIsWeekend('2026/10/24')).toBeTrue();
      expect(sdCalendarIsWeekend('2026/10/25')).toBeTrue();
      expect(sdCalendarIsWeekend('2026/10/23')).toBeFalse();
      expect(() => sdCalendarAddDays('2026-10-22', 1)).toThrowError(/invalid day/);
    });
  });

  describe('visible range', () => {
    it('[CAL-U-01] gives the range of month, week, day and agenda for an anchor day', () => {
      expect(sdCalendarVisibleRange(input({ view: 'week' }))).toEqual({ from: '2026/10/19', to: '2026/10/25', view: 'week' });
      expect(sdCalendarVisibleRange(input({ view: 'day' }))).toEqual({ from: '2026/10/22', to: '2026/10/22', view: 'day' });
      expect(sdCalendarVisibleRange(input({ view: 'month' }))).toEqual({ from: '2026/09/28', to: '2026/11/01', view: 'month' });
      expect(sdCalendarVisibleRange(input({ view: 'agenda' }))).toEqual({ from: '2026/10/22', to: '2026/11/04', view: 'agenda' });
      expect(sdCalendarVisibleDays(input({ view: 'week' }))).toEqual([
        '2026/10/19',
        '2026/10/20',
        '2026/10/21',
        '2026/10/22',
        '2026/10/23',
        '2026/10/24',
        '2026/10/25',
      ]);
      expect(sdCalendarVisibleDays(input({ view: 'day' }))).toEqual(['2026/10/22']);
      expect(sdCalendarVisibleDays(input({ view: 'agenda', agendaDays: 3 }))).toEqual(['2026/10/22', '2026/10/23', '2026/10/24']);
    });

    it('[CAL-U-01] steps back and forth by one week, one day, one month (to day 1) and agendaDays days', () => {
      expect(sdCalendarShiftDate(input({ view: 'week' }), 1)).toBe('2026/10/29');
      expect(sdCalendarShiftDate(input({ view: 'week' }), -1)).toBe('2026/10/15');
      expect(sdCalendarShiftDate(input({ view: 'day' }), 1)).toBe('2026/10/23');
      expect(sdCalendarShiftDate(input({ view: 'month' }), 1)).toBe('2026/11/01');
      expect(sdCalendarShiftDate(input({ view: 'month' }), -1)).toBe('2026/09/01');
      expect(sdCalendarShiftDate(input({ view: 'month', date: '2026/12/31' }), 1)).toBe('2027/01/01');
      expect(sdCalendarShiftDate(input({ view: 'agenda' }), 1)).toBe('2026/11/05');
      expect(sdCalendarShiftDate(input({ view: 'agenda', agendaDays: 0 }), -1)).toBe('2026/10/21');
    });

    it('[CAL-U-02] starts the week on firstDayOfWeek 0, 1 and 6', () => {
      expect(sdCalendarVisibleRange(input({ firstDayOfWeek: 0 }))).toEqual({ from: '2026/10/18', to: '2026/10/24', view: 'week' });
      expect(sdCalendarVisibleRange(input({ firstDayOfWeek: 1 }))).toEqual({ from: '2026/10/19', to: '2026/10/25', view: 'week' });
      expect(sdCalendarVisibleRange(input({ firstDayOfWeek: 6 }))).toEqual({ from: '2026/10/17', to: '2026/10/23', view: 'week' });
      expect(sdCalendarStartOfWeek('2026/10/19', 1)).toBe('2026/10/19');
      expect(sdCalendarStartOfWeek('2026/10/25', 1)).toBe('2026/10/19');
      expect(sdCalendarStartOfWeek('2026/10/17', 6)).toBe('2026/10/17');
      expect(sdCalendarVisibleRange(input({ view: 'month', firstDayOfWeek: 0 }))).toEqual({
        from: '2026/09/27',
        to: '2026/10/31',
        view: 'month',
      });
    });

    it('[CAL-U-03] hides Saturday and Sunday in week and month, not in day', () => {
      for (const firstDayOfWeek of [0, 1, 6]) {
        expect(sdCalendarVisibleRange(input({ firstDayOfWeek, hideWeekends: true }))).toEqual({
          from: '2026/10/19',
          to: '2026/10/23',
          view: 'week',
        });
        expect(sdCalendarVisibleDays(input({ firstDayOfWeek, hideWeekends: true }))).toEqual([
          '2026/10/19',
          '2026/10/20',
          '2026/10/21',
          '2026/10/22',
          '2026/10/23',
        ]);
      }
      expect(sdCalendarVisibleRange(input({ view: 'month', hideWeekends: true }))).toEqual({
        from: '2026/09/28',
        to: '2026/10/30',
        view: 'month',
      });
      const weeks = sdCalendarMonthWeeks(input({ view: 'month', hideWeekends: true }));
      expect(weeks.length).toBe(5);
      expect(weeks.every(week => week.length === 5 && week.every(day => !sdCalendarIsWeekend(day)))).toBeTrue();
      expect(sdCalendarVisibleRange(input({ view: 'day', date: '2026/10/24', hideWeekends: true }))).toEqual({
        from: '2026/10/24',
        to: '2026/10/24',
        view: 'day',
      });
    });

    it('[CAL-U-04] builds months of 4, 5 and 6 rows (02/2026, 11/2026, 08/2026)', () => {
      const feb = input({ view: 'month', date: '2026/02/14', firstDayOfWeek: 0 });
      const nov = input({ view: 'month', date: '2026/11/09', firstDayOfWeek: 0 });
      const aug = input({ view: 'month', date: '2026/08/01', firstDayOfWeek: 0 });
      expect(sdCalendarMonthWeeks(feb).length).toBe(4);
      expect(sdCalendarMonthWeeks(nov).length).toBe(5);
      expect(sdCalendarMonthWeeks(aug).length).toBe(6);
      expect(sdCalendarVisibleRange(feb)).toEqual({ from: '2026/02/01', to: '2026/02/28', view: 'month' });
      expect(sdCalendarVisibleRange(nov)).toEqual({ from: '2026/11/01', to: '2026/12/05', view: 'month' });
      expect(sdCalendarVisibleRange(aug)).toEqual({ from: '2026/07/26', to: '2026/09/05', view: 'month' });
      expect(sdCalendarMonthWeeks(aug).every(week => week.length === 7)).toBeTrue();
      expect(sdCalendarVisibleDays(feb).length).toBe(28);
    });

    it('[CAL-U-05] shows agendaDays days and clamps 0 to 1 and 63 to 62', () => {
      expect(sdCalendarVisibleRange(input({ view: 'agenda', agendaDays: 1 }))).toEqual({
        from: '2026/10/22',
        to: '2026/10/22',
        view: 'agenda',
      });
      expect(sdCalendarVisibleRange(input({ view: 'agenda', agendaDays: 14 }))).toEqual({
        from: '2026/10/22',
        to: '2026/11/04',
        view: 'agenda',
      });
      expect(sdCalendarVisibleRange(input({ view: 'agenda', agendaDays: 62 }))).toEqual({
        from: '2026/10/22',
        to: '2026/12/22',
        view: 'agenda',
      });
      expect(sdCalendarVisibleRange(input({ view: 'agenda', agendaDays: 0 }))).toEqual({
        from: '2026/10/22',
        to: '2026/10/22',
        view: 'agenda',
      });
      expect(sdCalendarVisibleRange(input({ view: 'agenda', agendaDays: 63 }))).toEqual({
        from: '2026/10/22',
        to: '2026/12/22',
        view: 'agenda',
      });
      expect(sdCalendarClampAgendaDays(Number.NaN)).toBe(14);
      expect(sdCalendarClampAgendaDays(7.6)).toBe(7);
    });
  });

  describe('overlap layout', () => {
    it('[CAL-U-06] keeps events that do not overlap in one full-width column', () => {
      expect(
        sdCalendarStack([
          { start: 540, end: 600 },
          { start: 720, end: 780 },
        ])
      ).toEqual([
        { index: 0, column: 0, columns: 1 },
        { index: 1, column: 0, columns: 1 },
      ]);
    });

    it('[CAL-U-07] splits two overlapping events into two columns', () => {
      expect(
        sdCalendarStack([
          { start: 600, end: 720 },
          { start: 540, end: 660 },
        ])
      ).toEqual([
        { index: 1, column: 0, columns: 2 },
        { index: 0, column: 1, columns: 2 },
      ]);
    });

    it('[CAL-U-08] keeps a transitive chain of three in one cluster and reuses a freed column', () => {
      expect(
        sdCalendarStack([
          { start: 540, end: 600 },
          { start: 570, end: 660 },
          { start: 630, end: 720 },
        ])
      ).toEqual([
        { index: 0, column: 0, columns: 2 },
        { index: 1, column: 1, columns: 2 },
        { index: 2, column: 0, columns: 2 },
      ]);
      expect(
        sdCalendarStack([
          { start: 540, end: 720 },
          { start: 560, end: 600 },
          { start: 610, end: 650 },
          { start: 600, end: 700 },
        ])
      ).toEqual([
        { index: 0, column: 0, columns: 3 },
        { index: 1, column: 1, columns: 3 },
        { index: 3, column: 1, columns: 3 },
        { index: 2, column: 2, columns: 3 },
      ]);
    });

    it('[CAL-U-09] puts the longer event first when two start together', () => {
      expect(
        sdCalendarStack([
          { start: 540, end: 600 },
          { start: 540, end: 720 },
        ])
      ).toEqual([
        { index: 1, column: 0, columns: 2 },
        { index: 0, column: 1, columns: 2 },
      ]);
    });

    it('[CAL-U-10] does not treat an end that touches the next start as an overlap', () => {
      expect(
        sdCalendarStack([
          { start: 540, end: 600 },
          { start: 600, end: 660 },
        ])
      ).toEqual([
        { index: 0, column: 0, columns: 1 },
        { index: 1, column: 0, columns: 1 },
      ]);
      expect(sdCalendarStack([])).toEqual([]);
    });
  });

  describe('all-day rows', () => {
    const week = sdCalendarVisibleDays(input({}));

    it('[CAL-U-11] orders bars by first day then length, and reuses a row once it is free', () => {
      const layout = sdCalendarAllDayLayout(
        [
          { firstDay: '2026/10/19', lastDay: '2026/10/21' },
          { firstDay: '2026/10/20', lastDay: '2026/10/20' },
          { firstDay: '2026/10/22', lastDay: '2026/10/23' },
          { firstDay: '2026/10/19', lastDay: '2026/10/19' },
        ],
        week
      );
      expect(layout.bars).toEqual([
        { index: 0, row: 0, from: 0, to: 2, clippedStart: false, clippedEnd: false },
        { index: 3, row: 1, from: 0, to: 0, clippedStart: false, clippedEnd: false },
        { index: 1, row: 1, from: 1, to: 1, clippedStart: false, clippedEnd: false },
        { index: 2, row: 0, from: 3, to: 4, clippedStart: false, clippedEnd: false },
      ]);
      expect(layout.rows).toBe(2);
      expect(layout.more).toEqual([0, 0, 0, 0, 0, 0, 0]);
    });

    it('[CAL-U-12] clips bars to the visible days and flags the clipped sides', () => {
      const layout = sdCalendarAllDayLayout(
        [
          { firstDay: '2026/10/15', lastDay: '2026/10/20' },
          { firstDay: '2026/10/24', lastDay: '2026/10/28' },
        ],
        week
      );
      expect(layout.bars).toEqual([
        { index: 0, row: 0, from: 0, to: 1, clippedStart: true, clippedEnd: false },
        { index: 1, row: 0, from: 5, to: 6, clippedStart: false, clippedEnd: true },
      ]);
      const weekdays = sdCalendarVisibleDays(input({ hideWeekends: true }));
      const hidden = sdCalendarAllDayLayout(
        [
          { firstDay: '2026/10/24', lastDay: '2026/10/25' },
          { firstDay: '2026/10/23', lastDay: '2026/10/26' },
          { firstDay: '2026/10/17', lastDay: '2026/10/19' },
        ],
        weekdays
      );
      expect(hidden.bars).toEqual([
        { index: 2, row: 0, from: 0, to: 0, clippedStart: true, clippedEnd: false },
        { index: 1, row: 0, from: 4, to: 4, clippedStart: false, clippedEnd: true },
      ]);
    });

    it('[CAL-U-13] shows at most three rows and counts the rest per day as +N', () => {
      const day = '2026/10/21';
      const layout = sdCalendarAllDayLayout(
        [
          { firstDay: day, lastDay: day },
          { firstDay: day, lastDay: day },
          { firstDay: day, lastDay: day },
          { firstDay: day, lastDay: day },
          { firstDay: day, lastDay: '2026/10/22' },
          { firstDay: '2026/10/22', lastDay: '2026/10/22' },
        ],
        week
      );
      expect(layout.rows).toBe(3);
      expect(layout.bars.map(bar => bar.index)).toEqual([4, 0, 1, 5]);
      expect(layout.bars.every(bar => bar.row < 3)).toBeTrue();
      expect(layout.more).toEqual([0, 0, 2, 0, 0, 0, 0]);
      const spanning = sdCalendarAllDayLayout(
        [
          { firstDay: '2026/10/20', lastDay: day },
          { firstDay: '2026/10/20', lastDay: day },
          { firstDay: day, lastDay: '2026/10/23' },
        ],
        week,
        2
      );
      expect(spanning.rows).toBe(2);
      expect(spanning.more).toEqual([0, 0, 1, 1, 1, 0, 0]);
      expect(sdCalendarAllDayLayout([{ firstDay: day, lastDay: day }], [])).toEqual({ bars: [], rows: 0, more: [] });
    });
  });

  describe('rounding and clamping', () => {
    it('[CAL-U-14] snaps a sweep and a single click to step 5, 15, 30 and 60', () => {
      expect(SD_CALENDAR_STEPS).toEqual([5, 10, 15, 20, 30, 60]);
      expect(sdCalendarSlot(877, 5)).toEqual({ start: 875, end: 880 });
      expect(sdCalendarSlot(877, 15)).toEqual({ start: 870, end: 885 });
      expect(sdCalendarSlot(877, 30)).toEqual({ start: 870, end: 900 });
      expect(sdCalendarSlot(877, 60)).toEqual({ start: 840, end: 900 });
      expect(sdCalendarSlot(1439, 60)).toEqual({ start: 1380, end: 1440 });
      expect(sdCalendarSweep(840, 920, 30)).toEqual({ start: 840, end: 930 });
      expect(sdCalendarSweep(920, 840, 30)).toEqual({ start: 840, end: 930 });
      expect(sdCalendarSweep(840, 845, 5)).toEqual({ start: 840, end: 850 });
      expect(sdCalendarSweep(1430, 1439, 15)).toEqual({ start: 1425, end: 1440 });
      expect(sdCalendarSweep(-20, 30, 60)).toEqual({ start: 0, end: 60 });
      expect(sdCalendarNormalizeStep(15)).toBe(15);
      expect(sdCalendarNormalizeStep(7)).toBeNull();
      expect(sdCalendarNormalizeStep(Number.NaN)).toBeNull();
    });

    it('[CAL-U-15] moves by moveStep = min(step, 15) and keeps the original offset', () => {
      expect(sdCalendarMoveStep(5)).toBe(5);
      expect(sdCalendarMoveStep(15)).toBe(15);
      expect(sdCalendarMoveStep(30)).toBe(15);
      expect(sdCalendarMoveStep(60)).toBe(15);
      expect(sdCalendarSnapMove(540, 37, 60, 15)).toBe(570);
      expect(sdCalendarSnapMove(540, -8, 60, 15)).toBe(525);
      expect(sdCalendarSnapMove(547, 16, 60, 15)).toBe(562);
      expect(sdCalendarSnapMove(540, 7, 60, 5)).toBe(545);
    });

    it('[CAL-U-16] clamps a moved block to [00:00, 24:00 − duration]', () => {
      expect(sdCalendarSnapMove(1400, 60, 60, 15)).toBe(1380);
      expect(sdCalendarSnapMove(30, -60, 60, 15)).toBe(0);
      expect(sdCalendarSnapMove(0, 0, 1440, 15)).toBe(0);
    });

    it('[CAL-U-17] keeps a resized end at least 15 minutes (or one step under 15) after the start and at most 24:00', () => {
      expect(sdCalendarResizeEnd(540, 600, 22, 30)).toBe(615);
      expect(sdCalendarResizeEnd(540, 600, -60, 30)).toBe(555);
      expect(sdCalendarResizeEnd(540, 600, -60, 5)).toBe(545);
      expect(sdCalendarResizeEnd(540, 600, -60, 10)).toBe(550);
      expect(sdCalendarResizeEnd(540, 1400, 120, 30)).toBe(1440);
    });
  });

  describe('reading events', () => {
    it('[CAL-U-18] puts a timed event that crosses midnight in the all-day row with its start time', () => {
      const placement = sdCalendarPlace(event({ start: '2026/10/22 22:00:00', end: '2026/10/23 06:00:00' }), hcm);
      expect(placement).toEqual(
        jasmine.objectContaining({
          allDay: false,
          inGrid: false,
          startDay: '2026/10/22',
          startMinutes: 1320,
          endDay: '2026/10/23',
          endMinutes: 360,
          firstDay: '2026/10/22',
          lastDay: '2026/10/23',
        })
      );
      expect(sdCalendarClockText(placement?.startMinutes ?? -1)).toBe('22:00');
      const twoNights = sdCalendarPlace(event({ start: '2026/10/22 22:00:00', end: '2026/10/24 00:00:00' }), hcm);
      expect(twoNights).toEqual(jasmine.objectContaining({ inGrid: false, firstDay: '2026/10/22', lastDay: '2026/10/23' }));
    });

    it('[CAL-U-19] keeps an event that ends exactly at 24:00 in the grid', () => {
      const placement = sdCalendarPlace(event({ start: '2026/10/22 22:00:00', end: '2026/10/23 00:00:00' }), hcm);
      expect(placement).toEqual(
        jasmine.objectContaining({
          inGrid: true,
          startDay: '2026/10/22',
          startMinutes: 1320,
          endDay: '2026/10/22',
          endMinutes: 1440,
          lastDay: '2026/10/22',
        })
      );
      expect(sdCalendarClockText(1440)).toBe('24:00');
      expect(sdCalendarClockText(545)).toBe('09:05');
    });

    it('[CAL-U-18] reads all-day events as inclusive days, one day when the end is missing', () => {
      expect(sdCalendarPlace(event({ start: '2026/10/22', allDay: true }), hcm)).toEqual(
        jasmine.objectContaining({
          allDay: true,
          inGrid: false,
          firstDay: '2026/10/22',
          lastDay: '2026/10/22',
          startMinutes: 0,
          endMinutes: 1440,
        })
      );
      expect(sdCalendarPlace(event({ start: '2026/10/21', end: '2026/10/23', allDay: true }), hcm)).toEqual(
        jasmine.objectContaining({ firstDay: '2026/10/21', lastDay: '2026/10/23', endDay: '2026/10/23' })
      );
      // An instant reads as the calendar day of the zone.
      expect(sdCalendarPlace(event({ start: '2026-10-21T17:00:00.000Z', allDay: true }), hcm)?.firstDay).toBe('2026/10/22');
    });

    it('[CAL-C-16] drops events with an unreadable date or an end that is not after the start', () => {
      expect(sdCalendarPlace(event({ start: 'not a date', end: '2026/10/22 10:00:00' }), hcm)).toBeNull();
      expect(sdCalendarPlace(event({ start: '2026/10/22 10:00:00', end: '2026/10/22 10:00:00' }), hcm)).toBeNull();
      expect(sdCalendarPlace(event({ start: '2026/10/22 10:00:00', end: '2026/10/22 09:00:00' }), hcm)).toBeNull();
      expect(sdCalendarPlace(event({ start: '2026/10/22 10:00:00' }), hcm)).toBeNull();
      expect(sdCalendarPlace(event({ start: '2026/10/22', end: '2026/10/21', allDay: true }), hcm)).toBeNull();
      expect(sdCalendarPlace(event({ start: 'x', allDay: true }), hcm)).toBeNull();
      expect(sdCalendarReadDay('TODAY', hcm)).toBeNull();
      expect(sdCalendarReadWallClock('2026-10-22T07:05:00Z', hcm)).toEqual({ day: '2026/10/22', minutes: 845 });
      expect(sdCalendarReadWallClock('', hcm)).toBeNull();
      // 'local' reads in the browser zone; a zone-less value keeps its digits wherever the test runs.
      expect(sdCalendarPlace(event({ start: '2026/10/22 09:00:00', end: '2026/10/22 10:30:00' }), clockFor('local'))).toEqual(
        jasmine.objectContaining({ startDay: '2026/10/22', startMinutes: 540, endMinutes: 630 })
      );
      expect(sdCalendarReadDay(new Date(Date.UTC(1960, 4, 19, 16)), hcm)).toBe('1960/05/20');
    });

    it('[CAL-U-20] keeps days and wall clock positions right over DST in America/New_York', () => {
      const spring = input({ date: '2026/03/08' });
      expect(sdCalendarVisibleDays(spring)).toEqual([
        '2026/03/02',
        '2026/03/03',
        '2026/03/04',
        '2026/03/05',
        '2026/03/06',
        '2026/03/07',
        '2026/03/08',
      ]);
      expect(sdCalendarVisibleRange(input({ date: sdCalendarShiftDate(spring, 1) }))).toEqual({
        from: '2026/03/09',
        to: '2026/03/15',
        view: 'week',
      });
      expect(sdCalendarVisibleRange(input({ date: '2026/11/01' }))).toEqual({ from: '2026/10/26', to: '2026/11/01', view: 'week' });

      const at = (start: string, end: string) => sdCalendarPlace(event({ start, end }), newYork);
      expect(at('2026-03-08T06:30:00Z', '2026-03-08T07:30:00Z')).toEqual(
        jasmine.objectContaining({ startDay: '2026/03/08', startMinutes: 90 })
      );
      expect(at('2026-03-08T08:00:00Z', '2026-03-08T09:00:00Z')).toEqual(
        jasmine.objectContaining({ startDay: '2026/03/08', startMinutes: 240, endMinutes: 300 })
      );
      expect(at('2026-03-09T13:00:00Z', '2026-03-09T14:00:00Z')).toEqual(
        jasmine.objectContaining({ startDay: '2026/03/09', startMinutes: 540 })
      );
      // The 23-hour and the 25-hour day end at 24:00 of the same day, not in the all-day row.
      expect(at('2026-03-08T05:00:00Z', '2026-03-09T04:00:00Z')).toEqual(
        jasmine.objectContaining({ inGrid: true, startMinutes: 0, endMinutes: 1440 })
      );
      expect(at('2026-11-01T04:00:00Z', '2026-11-02T05:00:00Z')).toEqual(
        jasmine.objectContaining({ inGrid: true, startMinutes: 0, endMinutes: 1440 })
      );
      expect(at('2026-11-01T05:30:00Z', '2026-11-01T06:00:00Z')).toEqual(
        jasmine.objectContaining({ startDay: '2026/11/01', startMinutes: 90 })
      );
      expect(at('2026-11-01T06:30:00Z', '2026-11-01T07:00:00Z')).toEqual(
        jasmine.objectContaining({ startDay: '2026/11/01', startMinutes: 90 })
      );
      expect(at('2026-11-02T14:00:00Z', '2026-11-02T15:00:00Z')).toEqual(
        jasmine.objectContaining({ startDay: '2026/11/02', startMinutes: 540 })
      );

      expect(sdCalendarSerialize('2026/03/06', 540, newYork, 'ISOString')).toBe('2026-03-06T14:00:00.000Z');
      expect(sdCalendarSerialize('2026/03/09', 540, newYork, 'ISOString')).toBe('2026-03-09T13:00:00.000Z');
      expect(sdCalendarSerialize('2026/11/02', 540, newYork, 'ISOString')).toBe('2026-11-02T14:00:00.000Z');
    });
  });

  describe('writing values', () => {
    it('[CAL-U-21] serializes without a transform as yyyy/MM/dd HH:mm:ss and yyyy/MM/dd', () => {
      expect(sdCalendarSerialize('2026/10/22', 840, hcm, undefined)).toBe('2026/10/22 14:00:00');
      expect(sdCalendarSerialize('2026/10/22', 1440, hcm, null)).toBe('2026/10/23 00:00:00');
      expect(sdCalendarSerialize('2026/10/22', null, hcm, undefined)).toBe('2026/10/22');
      expect(sdCalendarSerialize('2026/10/22', 840, clockFor('local'), undefined)).toBe('2026/10/22 14:00:00');
    });

    it('[CAL-U-21] serializes ISOString and UTCString as the instant of the wall clock in the zone', () => {
      expect(sdCalendarSerialize('2026/10/22', 840, hcm, 'ISOString')).toBe('2026-10-22T07:00:00.000Z');
      expect(sdCalendarSerialize('2026/10/22', 840, hcm, 'UTCString')).toBe('Thu, 22 Oct 2026 07:00:00 GMT');
      expect(sdCalendarSerialize('2026/10/22', null, hcm, 'ISOString')).toBe('2026-10-21T17:00:00.000Z');
      expect(sdCalendarSerialize('1960/05/20', 0, hcm, 'ISOString')).toBe('1960-05-19T16:00:00.000Z');
      expect(sdCalendarSerialize('2026/10/22', 1440, hcm, 'ISOString')).toBe('2026-10-22T17:00:00.000Z');
      expect(sdCalendarSerialize('2026/10/22', 840, clockFor('local'), 'ISOString')).toBe(new Date(2026, 9, 22, 14, 0, 0, 0).toISOString());
    });

    it('[CAL-U-21] re-serializes the current span of an event the same way as a new one', () => {
      const timed = sdCalendarPlace(event({ start: '2026-10-22T07:00:00Z', end: '2026-10-22T08:30:00Z' }), hcm)!;
      expect(sdCalendarRangeOf(timed, hcm, undefined)).toEqual({ start: '2026/10/22 14:00:00', end: '2026/10/22 15:30:00', allDay: false });
      expect(sdCalendarRangeOf(timed, hcm, 'ISOString')).toEqual({
        start: '2026-10-22T07:00:00.000Z',
        end: '2026-10-22T08:30:00.000Z',
        allDay: false,
      });
      const night = sdCalendarPlace(event({ start: '2026/10/22 22:00:00', end: '2026/10/23 00:00:00' }), hcm)!;
      expect(sdCalendarRangeOf(night, hcm, undefined).end).toBe('2026/10/23 00:00:00');
      const allDay = sdCalendarPlace(event({ start: '2026/10/22', end: '2026/10/23', allDay: true }), hcm)!;
      expect(sdCalendarRangeOf(allDay, hcm, undefined)).toEqual({ start: '2026/10/22', end: '2026/10/23', allDay: true });
      expect(sdCalendarRangeOf(allDay, hcm, 'ISOString')).toEqual({
        start: '2026-10-21T17:00:00.000Z',
        end: '2026-10-22T17:00:00.000Z',
        allDay: true,
      });
    });
  });

  describe('working hours and scroll', () => {
    it('[CAL-C-20] reads working hours per weekday; null means no shading', () => {
      const hours = {
        1: [
          { from: '08:00', to: '12:00' },
          { from: '13:00', to: '17:30' },
        ],
        2: [{ from: '09:00', to: '24:00' }],
        3: [],
        4: [
          { from: '12:00', to: '10:00' },
          { from: null, to: '10:00' },
        ],
      };
      expect(sdCalendarWorkingRanges(hours, 1)).toEqual([
        { start: 480, end: 720 },
        { start: 780, end: 1050 },
      ]);
      expect(sdCalendarWorkingRanges(hours, 2)).toEqual([{ start: 540, end: 1440 }]);
      expect(sdCalendarWorkingRanges(hours, 3)).toEqual([]);
      expect(sdCalendarWorkingRanges(hours, 4)).toEqual([]);
      expect(sdCalendarWorkingRanges(hours, 0)).toEqual([]);
      expect(sdCalendarWorkingRanges(null, 1)).toBeNull();
      expect(
        sdCalendarOffSegments([
          { start: 480, end: 720 },
          { start: 780, end: 1050 },
        ])
      ).toEqual([
        { start: 0, end: 480 },
        { start: 720, end: 780 },
        { start: 1050, end: 1440 },
      ]);
      expect(sdCalendarOffSegments([])).toEqual([{ start: 0, end: 1440 }]);
      expect(sdCalendarOffSegments([{ start: 0, end: 1440 }])).toEqual([]);
      expect(sdCalendarOffSegments(null)).toEqual([]);
      expect(sdCalendarTimeToMinutes('08:30')).toBe(510);
      expect(sdCalendarTimeToMinutes('24:00')).toBe(1440);
      expect(sdCalendarTimeToMinutes('25:00')).toBeNull();
      expect(sdCalendarTimeToMinutes(undefined)).toBeNull();
    });

    it('[CAL-C-20] scrolls to scrollTime minus 30 minutes, never above the top', () => {
      expect(sdCalendarInitialScroll(480, 48)).toBe(360);
      expect(sdCalendarInitialScroll(15, 48)).toBe(0);
    });
  });
});
