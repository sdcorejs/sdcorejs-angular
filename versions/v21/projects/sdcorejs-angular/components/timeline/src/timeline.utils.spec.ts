import { TestBed } from '@angular/core/testing';
import { SD_CORE_CONFIGURATION, type ISdCoreConfiguration } from '@sdcorejs/angular/configurations';
import { SdDateTimeService } from '@sdcorejs/angular/services/date-time';
import type { SdTimelineChange, SdTimelineContent, SdTimelineItem } from './timeline.model';
import { sdTimelineChangeRows, sdTimelineDayLabel, sdTimelineGroupByDay, sdTimelineTime } from './timeline.utils';

const event = (id: string, at: string): SdTimelineItem => ({ id, at, content: { layout: 'event', data: { title: id } } });
const keys = (items: SdTimelineItem[], clock: SdDateTimeService): (string | null)[] =>
  sdTimelineGroupByDay(items, clock).map(group => group.key);

describe('timeline utils', () => {
  let clock: SdDateTimeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: SD_CORE_CONFIGURATION, useValue: { timeZone: 'Asia/Ho_Chi_Minh' } as ISdCoreConfiguration }],
    });
    clock = TestBed.inject(SdDateTimeService);
  });

  describe('sdTimelineGroupByDay', () => {
    it('groups consecutive items of one day, newest first', () => {
      const groups = sdTimelineGroupByDay(
        [event('a', '2026-11-08T09:00:00Z'), event('b', '2026-11-08T02:00:00Z'), event('c', '2026-11-07T09:00:00Z')],
        clock
      );
      expect(groups.map(group => group.key)).toEqual(['2026-11-08', '2026-11-07']);
      expect(groups[0].items.map(item => item.id)).toEqual(['a', 'b']);
    });

    it('keeps the given order, oldest first or shuffled, and starts a group at every day change', () => {
      expect(
        keys([event('a', '2026-11-06T09:00:00Z'), event('b', '2026-11-07T09:00:00Z'), event('c', '2026-11-07T10:00:00Z')], clock)
      ).toEqual(['2026-11-06', '2026-11-07']);
      expect(
        keys([event('a', '2026-11-07T09:00:00Z'), event('b', '2026-11-06T09:00:00Z'), event('c', '2026-11-07T10:00:00Z')], clock)
      ).toEqual(['2026-11-07', '2026-11-06', '2026-11-07']);
    });

    it('reads the day in the configured zone: 23:30Z is the next day in Asia/Ho_Chi_Minh', () => {
      expect(keys([event('a', '2026-11-07T23:30:00Z')], clock)).toEqual(['2026-11-08']);
    });

    it('keeps an unreadable date at the end of the current group', () => {
      const groups = sdTimelineGroupByDay([event('a', '2026-11-08T09:00:00Z'), event('b', 'not a date')], clock);
      expect(groups.length).toBe(1);
      expect(groups[0].items.map(item => item.id)).toEqual(['a', 'b']);
    });
  });

  describe('sdTimelineTime', () => {
    const now = Date.parse('2026-11-08T05:00:00Z'); // 12:00 in Ho Chi Minh City

    it('says just now under one minute and N minutes under one hour today', () => {
      expect(sdTimelineTime('2026-11-08T04:59:30Z', 'day', now, clock).kind).toBe('just-now');
      const twelve = sdTimelineTime('2026-11-08T04:48:00Z', 'day', now, clock);
      expect(twelve.kind).toBe('minutes');
      expect(twelve.minutes).toBe(12);
    });

    it('switches to HH:mm from 61 minutes and for yesterday', () => {
      expect(sdTimelineTime('2026-11-08T03:59:00Z', 'day', now, clock)).toEqual(
        jasmine.objectContaining({ kind: 'clock', clock: '10:59' })
      );
      expect(sdTimelineTime('2026-11-07T04:59:30Z', 'day', now, clock)).toEqual(
        jasmine.objectContaining({ kind: 'clock', clock: '11:59' })
      );
    });

    it('uses HH:mm dd/MM/yyyy without day groups', () => {
      expect(sdTimelineTime('2026-11-08T04:59:30Z', 'none', now, clock)).toEqual(
        jasmine.objectContaining({ kind: 'full', full: '11:59 08/11/2026' })
      );
    });

    it('marks an unreadable date as invalid', () => {
      expect(sdTimelineTime('not a date', 'day', now, clock).kind).toBe('invalid');
    });
  });

  describe('sdTimelineDayLabel', () => {
    it('names today and yesterday and formats older days in the configured zone', () => {
      const now = Date.parse('2026-11-07T18:30:00Z'); // 01:30 on 08/11 in Ho Chi Minh City
      expect(sdTimelineDayLabel('2026-11-08', now, clock)).toEqual({ kind: 'today', text: '08/11/2026' });
      expect(sdTimelineDayLabel('2026-11-07', now, clock)).toEqual({ kind: 'yesterday', text: '07/11/2026' });
      expect(sdTimelineDayLabel('2026-11-01', now, clock)).toEqual({ kind: 'date', text: '01/11/2026' });
    });
  });

  describe('sdTimelineChangeRows', () => {
    const changes = (count: number): SdTimelineChange[] => Array.from({ length: count }, (_, index) => ({ label: `f${index}`, to: index }));

    it('shows three rows without a toggle', () => {
      expect(sdTimelineChangeRows(changes(3), false)).toEqual({ rows: changes(3), hidden: 0 });
    });

    it('folds rows from the fourth on into "+N"', () => {
      const result = sdTimelineChangeRows(changes(5), false);
      expect(result.rows.length).toBe(3);
      expect(result.hidden).toBe(2);
      expect(sdTimelineChangeRows(changes(5), true).rows.length).toBe(5);
    });
  });

  describe('content types', () => {
    it('rejects data that does not match the layout at compile time', () => {
      // @ts-expect-error comment data has text, not a title
      const comment: SdTimelineContent = { layout: 'comment', data: { title: 'x' } };
      // @ts-expect-error change data needs changes
      const change: SdTimelineContent = { layout: 'change', data: { title: 'x' } };
      // @ts-expect-error event data has a title, not text
      const eventContent: SdTimelineContent = { layout: 'event', data: { text: 'x' } };
      expect([comment, change, eventContent].length).toBe(3);
    });
  });
});
