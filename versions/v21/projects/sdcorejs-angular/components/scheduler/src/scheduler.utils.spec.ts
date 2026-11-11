import { ɵsdCalendarPlace, type ɵSdCalendarPlacement } from '@sdcorejs/angular/components/calendar';
import { clockFor } from '../../../testing/schedule-testing';
import type { SdSchedulerResource } from './scheduler.model';
import {
  sdSchedulerColumnBox,
  sdSchedulerColumns,
  sdSchedulerColumnSpan,
  sdSchedulerDayBox,
  sdSchedulerDaySpan,
  sdSchedulerGroups,
  sdSchedulerLanes,
  sdSchedulerLaneTop,
  sdSchedulerNextResource,
  sdSchedulerResizeLastDay,
  sdSchedulerRowAt,
  sdSchedulerRowHeight,
  sdSchedulerVisibleDays,
  sdSchedulerVisibleRange,
  type SdSchedulerLaneItem,
} from './scheduler.utils';

const zone = clockFor('Asia/Ho_Chi_Minh');
const place = (start: string, end?: string, allDay = false): ɵSdCalendarPlacement =>
  ɵsdCalendarPlace({ id: 'x', title: 'X', start, end, allDay }, zone)!;
const lanesOf = (items: SdSchedulerLaneItem[]): number[] => {
  const layout = sdSchedulerLanes(items);
  const lanes: number[] = [];
  for (const { index, lane } of layout.order) lanes[index] = lane;
  return lanes;
};
const timed = (start: number, end: number): SdSchedulerLaneItem => ({ start, end, allDay: false });

describe('sd-scheduler utils', () => {
  describe('lanes (§8.4)', () => {
    it('[SCH-U-01] keeps separate events in one lane', () => {
      const layout = sdSchedulerLanes([timed(540, 600), timed(660, 720), timed(780, 840)]);
      expect(layout.count).toBe(1);
      expect(layout.order.map(entry => entry.lane)).toEqual([0, 0, 0]);
      expect(sdSchedulerLanes([]).count).withContext('an empty row still has one lane').toBe(1);
    });

    it('[SCH-U-02] opens a lane for an overlap of two and of a chain of three', () => {
      expect(lanesOf([timed(540, 660), timed(600, 720)])).toEqual([0, 1]);
      // 09:00–10:00 and 10:00–11:00 both overlap 09:30–10:30; the third reuses lane 0.
      const chain = sdSchedulerLanes([timed(540, 600), timed(570, 630), timed(600, 660)]);
      expect(chain.count).toBe(2);
      expect(lanesOf([timed(540, 600), timed(570, 630), timed(600, 660)])).toEqual([0, 1, 0]);
      expect(lanesOf([timed(540, 720), timed(570, 630), timed(600, 660)])).toEqual([0, 1, 2]);
    });

    it('[SCH-U-03] puts an all-day event first on the same start, then the longer one', () => {
      const items = [timed(0, 60), { start: 0, end: 1440, allDay: true }, timed(0, 120)];
      const layout = sdSchedulerLanes(items);
      expect(layout.order.map(entry => entry.index))
        .withContext('DOM order')
        .toEqual([1, 2, 0]);
      expect(lanesOf(items)).toEqual([2, 0, 1]);
    });

    it('[SCH-U-04] does not overlap an event that ends when the next one starts', () => {
      expect(lanesOf([timed(540, 600), timed(600, 660)])).toEqual([0, 0]);
    });

    it('[SCH-U-05] counts a timed event as one day in the week and month views', () => {
      const columns = ['2026/11/09', '2026/11/10', '2026/11/11'];
      const morning = sdSchedulerColumnSpan(place('2026/11/09 08:00:00', '2026/11/09 09:00:00'), columns)!;
      const evening = sdSchedulerColumnSpan(place('2026/11/09 18:00:00', '2026/11/09 19:00:00'), columns)!;
      const tomorrow = sdSchedulerColumnSpan(place('2026/11/10 08:00:00', '2026/11/10 09:00:00'), columns)!;
      expect(morning).toEqual({ from: 0, to: 0, clippedStart: false, clippedEnd: false });
      const items = [morning, evening, tomorrow].map(span => ({ start: span.from, end: span.to + 1, allDay: false }));
      expect(lanesOf(items)).toEqual([0, 1, 0]);
    });

    it('[SCH-U-06] sizes a row max(48, 8 + 32 × lanes) and tops blocks by lane', () => {
      expect(sdSchedulerRowHeight(0)).toBe(48);
      expect(sdSchedulerRowHeight(1)).toBe(48);
      expect(sdSchedulerRowHeight(2)).toBe(72);
      expect(sdSchedulerRowHeight(3)).toBe(104);
      expect(sdSchedulerLaneTop(0, 1)).toBe(10);
      expect(sdSchedulerLaneTop(0, 2)).toBe(6);
      expect(sdSchedulerLaneTop(1, 2)).toBe(38);
      expect(sdSchedulerLaneTop(2, 3)).toBe(70);
    });
  });

  describe('hour axis (§8.2)', () => {
    const day = '2026/11/09';

    it('[SCH-U-07] places a block in its day, clips it at both ends, covers all-day and keeps 12px', () => {
      const inDay = sdSchedulerDaySpan(place('2026/11/09 10:00:00', '2026/11/09 11:30:00'), day)!;
      expect(inDay).toEqual({ start: 600, end: 690, clippedStart: false, clippedEnd: false });
      expect(sdSchedulerDayBox(inDay, 80)).toEqual({ left: 801, width: 117 });
      expect(sdSchedulerDaySpan(place('2026/11/08 22:00:00', '2026/11/09 02:00:00'), day)).toEqual({
        start: 0,
        end: 120,
        clippedStart: true,
        clippedEnd: false,
      });
      expect(sdSchedulerDaySpan(place('2026/11/09 22:00:00', '2026/11/10 06:00:00'), day)).toEqual({
        start: 1320,
        end: 1440,
        clippedStart: false,
        clippedEnd: true,
      });
      expect(sdSchedulerDaySpan(place('2026/11/08 22:00:00', '2026/11/10 06:00:00'), day))
        .withContext('across the whole day')
        .toEqual({
          start: 0,
          end: 1440,
          clippedStart: true,
          clippedEnd: true,
        });
      expect(sdSchedulerDaySpan(place('2026/11/09 23:00:00', '2026/11/10 00:00:00'), day))
        .withContext('ends at 24:00')
        .toEqual({
          start: 1380,
          end: 1440,
          clippedStart: false,
          clippedEnd: false,
        });
      expect(sdSchedulerDaySpan(place('2026/11/08 23:00:00', '2026/11/09 00:00:00'), day))
        .withContext('ended at 00:00')
        .toBeNull();
      expect(sdSchedulerDaySpan(place('2026/11/10 09:00:00', '2026/11/10 10:00:00'), day)).toBeNull();
      expect(sdSchedulerDaySpan(place('2026/11/09', undefined, true), day)).toEqual({
        start: 0,
        end: 1440,
        clippedStart: false,
        clippedEnd: false,
      });
      expect(sdSchedulerDaySpan(place('2026/11/08', '2026/11/10', true), day)).toEqual({
        start: 0,
        end: 1440,
        clippedStart: true,
        clippedEnd: true,
      });
      expect(sdSchedulerDayBox({ start: 600, end: 605 }, 80))
        .withContext('at least 12px')
        .toEqual({ left: 801, width: 12 });
    });

    it('[SCH-U-10] keeps the hour axis on the wall clock on 23- and 25-hour days', () => {
      const newYork = clockFor('America/New_York');
      // 2026/03/08: clocks jump from 02:00 to 03:00 (23 hours); 2026/11/01: 01:00–02:00 happens twice (25 hours).
      const spring = ɵsdCalendarPlace({ id: 's', title: 'S', start: '2026/03/08 01:00:00', end: '2026/03/08 04:00:00' }, newYork)!;
      const springSpan = sdSchedulerDaySpan(spring, '2026/03/08')!;
      expect(springSpan).toEqual({ start: 60, end: 240, clippedStart: false, clippedEnd: false });
      expect(sdSchedulerDayBox(springSpan, 80)).toEqual({ left: 81, width: 237 });
      const fall = ɵsdCalendarPlace({ id: 'f', title: 'F', start: '2026/11/01 00:30:00', end: '2026/11/01 02:30:00' }, newYork)!;
      expect(sdSchedulerDaySpan(fall, '2026/11/01')).toEqual({ start: 30, end: 150, clippedStart: false, clippedEnd: false });
    });
  });

  describe('day axis (§8.2)', () => {
    it('[SCH-U-08] maps spans to columns with hideWeekends, 28/30/31-day months and clipped bars', () => {
      const week = sdSchedulerVisibleDays('week', '2026/11/11', 1);
      expect(week).toEqual(['2026/11/09', '2026/11/10', '2026/11/11', '2026/11/12', '2026/11/13', '2026/11/14', '2026/11/15']);
      const workdays = sdSchedulerColumns(week, 'week', true);
      expect(workdays.length).toBe(5);
      expect(sdSchedulerColumns(week, 'week', false).length).toBe(7);
      expect(sdSchedulerColumns(['2026/11/14'], 'day', true))
        .withContext('the day view ignores hideWeekends')
        .toEqual(['2026/11/14']);
      expect(sdSchedulerVisibleRange('week', '2026/11/11', 1)).toEqual({ from: '2026/11/09', to: '2026/11/15', view: 'week' });
      expect(sdSchedulerVisibleRange('week', '2026/11/11', 0).from).toBe('2026/11/08');
      expect(sdSchedulerVisibleDays('month', '2026/02/14', 1).length).toBe(28);
      expect(sdSchedulerVisibleDays('month', '2026/11/09', 1).length).toBe(30);
      expect(sdSchedulerVisibleDays('month', '2026/12/31', 1).length).toBe(31);
      expect(sdSchedulerVisibleRange('month', '2026/11/09', 1)).toEqual({ from: '2026/11/01', to: '2026/11/30', view: 'month' });
      expect(sdSchedulerVisibleRange('day', '2026/11/09', 1)).toEqual({ from: '2026/11/09', to: '2026/11/09', view: 'day' });

      // A Saturday event is not drawn with hideWeekends; a Friday–Monday leave shows its Friday, clipped at the end.
      expect(sdSchedulerColumnSpan(place('2026/11/14 09:00:00', '2026/11/14 10:00:00'), workdays)).toBeNull();
      expect(sdSchedulerColumnSpan(place('2026/11/13', '2026/11/16', true), workdays)).toEqual({
        from: 4,
        to: 4,
        clippedStart: false,
        clippedEnd: true,
      });
      expect(sdSchedulerColumnSpan(place('2026/11/05', '2026/11/10', true), workdays)).toEqual({
        from: 0,
        to: 1,
        clippedStart: true,
        clippedEnd: false,
      });
      expect(sdSchedulerColumnSpan(place('2026/11/10 22:00:00', '2026/11/12 06:00:00'), workdays))
        .withContext('across midnight')
        .toEqual({
          from: 1,
          to: 3,
          clippedStart: false,
          clippedEnd: false,
        });
      expect(sdSchedulerColumnSpan(place('2026/11/14', '2026/11/15', true), workdays))
        .withContext('only weekend days')
        .toBeNull();
      expect(sdSchedulerColumnSpan(place('2026/12/01', undefined, true), workdays)).toBeNull();
      expect(sdSchedulerColumnSpan(place('2026/11/09', undefined, true), [])).toBeNull();
      expect(sdSchedulerColumnBox({ from: 1, to: 3 }, 5)).toEqual({ start: 0.2, size: 0.6 });
    });
  });

  describe('keyboard and pointer', () => {
    it('[SCH-U-09] finds the next resource for Alt + ↑ ↓, past refused rows and into collapsed groups', () => {
      // Group rows are not resources; a collapsed group keeps its resources in the order (Step 0 H4).
      const ids = ['a', 'b', 'c', 'd'];
      const refused = new Set(['b']);
      const accept = (id: string): boolean => !refused.has(id);
      expect(sdSchedulerNextResource(ids, 'a', 1, accept)).toBe('c');
      expect(sdSchedulerNextResource(ids, 'c', -1, accept)).toBe('a');
      expect(sdSchedulerNextResource(ids, 'd', 1, accept)).toBeNull();
      expect(sdSchedulerNextResource(ids, 'a', -1, accept)).toBeNull();
      expect(sdSchedulerNextResource(['a', 'b'], 'a', 1, () => false)).toBeNull();
    });

    it('[SCH-C-04] orders resources: ungrouped first, then groups by first appearance', () => {
      const resource = (id: string, group?: string): SdSchedulerResource => ({ id, title: id, group });
      const { ungrouped, groups } = sdSchedulerGroups([
        resource('r1', 'Tầng 3'),
        resource('r2'),
        resource('r3', 'Tầng 5'),
        resource('r4', 'Tầng 3'),
        resource('r5', ''),
      ]);
      expect(ungrouped.map(item => item.id)).toEqual(['r2', 'r5']);
      expect(groups.map(group => [group.name, group.resources.map(item => item.id)])).toEqual([
        ['Tầng 3', ['r1', 'r4']],
        ['Tầng 5', ['r3']],
      ]);
    });

    it('[SCH-C-10] ends an all-day resize between its first day and the last day on screen', () => {
      const week = sdSchedulerVisibleDays('week', '2026/11/09', 1);
      const span = (firstDay: string, lastDay: string): { firstDay: string; lastDay: string } => ({ firstDay, lastDay });
      expect(sdSchedulerResizeLastDay(span('2026/11/10', '2026/11/11'), week, 2)).toBe('2026/11/13');
      expect(sdSchedulerResizeLastDay(span('2026/11/10', '2026/11/11'), week, -5)).toBe('2026/11/10');
      expect(sdSchedulerResizeLastDay(span('2026/11/10', '2026/11/11'), week, 9)).toBe('2026/11/15');
      expect(sdSchedulerResizeLastDay(span('2026/11/10', '2026/11/11'), week, 0)).toBe('2026/11/11');
    });

    it('[SCH-C-10] moves an all-day end along the columns on screen: hideWeekends skips the weekend', () => {
      const weekdays = sdSchedulerColumns(sdSchedulerVisibleDays('month', '2026/11/09', 1), 'month', true);
      // Thursday + 2 columns is Monday, not Saturday.
      expect(sdSchedulerResizeLastDay({ firstDay: '2026/11/12', lastDay: '2026/11/12' }, weekdays, 2)).toBe('2026/11/16');
      expect(sdSchedulerResizeLastDay({ firstDay: '2026/11/13', lastDay: '2026/11/13' }, weekdays, 1)).toBe('2026/11/16');
      expect(sdSchedulerResizeLastDay({ firstDay: '2026/11/12', lastDay: '2026/11/17' }, weekdays, -2)).toBe('2026/11/13');
    });

    it('[SCH-C-10] has no all-day resize when the last day has no column: cut by the range or on a hidden day', () => {
      const week = sdSchedulerVisibleDays('week', '2026/11/09', 1);
      // Ends next Wednesday: the end is past the range, a resize must not pull it back to Sunday.
      expect(sdSchedulerResizeLastDay({ firstDay: '2026/11/13', lastDay: '2026/11/18' }, week, 0)).toBeNull();
      expect(sdSchedulerResizeLastDay({ firstDay: '2026/11/13', lastDay: '2026/11/18' }, week, 1)).toBeNull();
      const weekdays = sdSchedulerColumns(week, 'week', true);
      // Ends on Saturday, hidden: the block ends at Friday on screen.
      expect(sdSchedulerResizeLastDay({ firstDay: '2026/11/12', lastDay: '2026/11/14' }, weekdays, 0)).toBeNull();
      expect(sdSchedulerResizeLastDay({ firstDay: '2026/11/01', lastDay: '2026/11/02' }, week, 1)).toBeNull();
    });

    it('[SCH-C-06] finds the row and the column under the pointer', () => {
      const rows = [
        { key: 'g:a', resourceId: null, top: 0, bottom: 32 },
        { key: 'r:1', resourceId: '1', top: 32, bottom: 80 },
        { key: 'r:2', resourceId: '2', top: 80, bottom: 152 },
      ];
      expect(sdSchedulerRowAt(rows, 10)?.key).toBe('g:a');
      expect(sdSchedulerRowAt(rows, 32)?.key).toBe('r:1');
      expect(sdSchedulerRowAt(rows, 151)?.key).toBe('r:2');
      expect(sdSchedulerRowAt(rows, 152)).toBeNull();
      expect(sdSchedulerRowAt(rows, -1)).toBeNull();
      expect(sdSchedulerRowAt([], 5)).toBeNull();
    });
  });
});
