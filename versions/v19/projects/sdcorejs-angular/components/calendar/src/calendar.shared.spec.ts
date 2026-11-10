import { Component, Injector, NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { clockFor } from '../../../testing/schedule-testing';
import { SdCalendarEdgeScroller, sdCalendarEdgeSpeed } from './calendar-edge-scroll';
import { sdCalendarDateText, sdCalendarFormats, sdCalendarTitle, sdCalendarUtcDay, sdCalendarWeekdayLong } from './calendar-format';
import { SdCalendarAnnouncer, SdCalendarFocusKeeper } from './calendar-move';
import {
  sdCalendarBoundDay,
  sdCalendarCarrierDay,
  sdCalendarCssEscape,
  sdCalendarDaysBetween,
  sdCalendarHolidayMap,
  sdCalendarLastDayOf,
  sdCalendarPointOf,
  sdCalendarRangeKey,
  sdCalendarResolveFirstDayOfWeek,
  sdCalendarResolveStep,
  sdCalendarResolveWorkingHours,
  sdCalendarSameList,
  sdCalendarTargetOf,
} from './calendar.utils';

// Pieces sd-calendar shares with sd-scheduler through the ɵ exports (scheduler.md §1, Step 0 H1).

const t = (key: string, params: Record<string, string | number> = {}): string => `${key}|${JSON.stringify(params)}`;

describe('sd-calendar shared pieces', () => {
  describe('formats', () => {
    it('[CAL-C-23] names days the same way in numeric and named languages', () => {
      const vi = sdCalendarFormats('vi-VN', 'vi');
      const en = sdCalendarFormats('en-US', 'en');
      expect(vi.named).toBeFalse();
      expect(en.named).toBeTrue();
      expect(sdCalendarUtcDay('2026/11/09').toISOString()).toBe('2026-11-09T12:00:00.000Z');
      expect(sdCalendarWeekdayLong(en, '2026/11/09')).toBe('Monday');
      expect(sdCalendarDateText(vi, '2026/11/09', false)).toBe('09/11');
      expect(sdCalendarDateText(vi, '2026/11/09', true)).toBe('09/11/2026');
      expect(sdCalendarDateText(en, '2026/11/09', true)).toBe('Nov 9, 2026');
    });

    it('[CAL-C-23] builds the four titles from one span', () => {
      const en = sdCalendarFormats('en-US', 'en');
      expect(sdCalendarTitle('month', { anchor: '2026/11/09', from: '2026/11/01', to: '2026/11/30' }, en, t)).toBe(
        'core.component.calendar.title-month|{"month":11,"monthName":"November","year":2026}'
      );
      expect(sdCalendarTitle('day', { anchor: '2026/11/09', from: '2026/11/09', to: '2026/11/09' }, en, t)).toContain(
        '"weekday":"Monday","day":9'
      );
      expect(sdCalendarTitle('week', { anchor: '2026/11/09', from: '2026/11/09', to: '2026/11/15' }, en, t)).toContain('title-week');
      expect(sdCalendarTitle('week', { anchor: '2026/10/29', from: '2026/10/26', to: '2026/11/01' }, en, t)).toContain('title-range');
      expect(sdCalendarTitle('range', { anchor: '2026/12/30', from: '2026/12/30', to: '2027/01/02' }, en, t)).toBe(
        'core.component.calendar.title-range|{"from":"Dec 30, 2026","to":"Jan 2, 2027"}'
      );
    });
  });

  describe('configuration', () => {
    it('[CAL-C-23] resolves input, then configuration, then the defaults', () => {
      expect(sdCalendarResolveStep(15, { step: 60 })).toBe(15);
      expect(sdCalendarResolveStep(undefined, { step: 60 })).toBe(60);
      expect(sdCalendarResolveStep(undefined, null)).toBe(30);
      expect(sdCalendarResolveStep(7, null)).toBe(30);
      expect(sdCalendarResolveFirstDayOfWeek(0, null)).toBe(0);
      expect(sdCalendarResolveFirstDayOfWeek(undefined, { firstDayOfWeek: 6 })).toBe(6);
      expect(sdCalendarResolveFirstDayOfWeek(9, null)).toBe(1);
      const hours = { 1: [{ from: '09:00', to: '17:00' }] };
      expect(sdCalendarResolveWorkingHours(null, { workingHours: hours })).toBeNull();
      expect(sdCalendarResolveWorkingHours(undefined, { workingHours: null })).toBeNull();
      expect(sdCalendarResolveWorkingHours(undefined, { workingHours: hours })).toBe(hours);
      expect(sdCalendarResolveWorkingHours(undefined, null)?.[1]?.length).toBe(2);
    });

    it('[CAL-C-23] maps holidays by day and reads minDate / maxDate', () => {
      const clock = clockFor('Asia/Ho_Chi_Minh');
      const map = sdCalendarHolidayMap(
        [
          { date: '2026/11/20', label: 'A', type: 'observance' },
          { date: '2026/11/20', label: 'B', type: 'off' },
          { date: 'not a day', label: 'C', type: 'off' },
        ],
        null,
        clock
      );
      expect([...map.keys()]).toEqual(['2026/11/20']);
      expect(map.get('2026/11/20')?.label).toBe('A');
      expect(sdCalendarHolidayMap(undefined, { holidays: [{ date: '2026/01/01', label: 'Tết', type: 'off' }] }, clock).size).toBe(1);
      expect(sdCalendarHolidayMap(undefined, null, clock).size).toBe(0);
      expect(sdCalendarBoundDay('TODAY', '2026/11/09', clock)).toBe('2026/11/09');
      expect(sdCalendarBoundDay('2026/12/01', '2026/11/09', clock)).toBe('2026/12/01');
      expect(sdCalendarBoundDay('', '2026/11/09', clock)).toBeNull();
      expect(sdCalendarBoundDay(null, '2026/11/09', clock)).toBeNull();
      expect(sdCalendarBoundDay(undefined, '2026/11/09', clock)).toBeNull();
    });
  });

  describe('small helpers', () => {
    it('[CAL-C-23] targets, days, keys, points and escapes', () => {
      const target = { allDay: false, startDay: '2026/11/09', startMinutes: 1320, endDay: '2026/11/10', endMinutes: 0 };
      expect(sdCalendarTargetOf({ ...target, extra: 1 } as typeof target)).toEqual(target);
      expect(sdCalendarLastDayOf(target)).toBe('2026/11/09');
      expect(sdCalendarLastDayOf({ ...target, endMinutes: 60 })).toBe('2026/11/10');
      expect(sdCalendarLastDayOf({ ...target, allDay: true })).toBe('2026/11/10');
      expect(sdCalendarLastDayOf({ ...target, endDay: '2026/11/09' })).toBe('2026/11/09');
      expect(sdCalendarDaysBetween('2026/10/30', '2026/11/02')).toEqual(['2026/10/30', '2026/10/31', '2026/11/01', '2026/11/02']);
      expect(sdCalendarCarrierDay(new Date(2026, 10, 9, 23, 30))).toBe('2026/11/09');
      expect(sdCalendarRangeKey({ view: 'day', from: '2026/11/09', to: '2026/11/09' })).toBe('day|2026/11/09|2026/11/09');
      expect(sdCalendarSameList(['a', 'b'], ['a', 'b'])).toBeTrue();
      expect(sdCalendarSameList(['a', 'b'], ['a'])).toBeFalse();
      expect(sdCalendarSameList(['a', 'b'], ['a', 'c'])).toBeFalse();
      expect(sdCalendarPointOf(new MouseEvent('mousedown', { clientX: 3, clientY: 4 }))).toEqual({ x: 3, y: 4 });
      const finger = new Touch({ identifier: 1, target: document.body, clientX: 5, clientY: 6 });
      expect(sdCalendarPointOf(new TouchEvent('touchstart', { touches: [finger] }))).toEqual({ x: 5, y: 6 });
      expect(sdCalendarPointOf(new TouchEvent('touchend', { changedTouches: [finger] }))).toEqual({ x: 5, y: 6 });
      expect(sdCalendarPointOf(new TouchEvent('touchend'))).toBeNull();
      expect(sdCalendarCssEscape('a"b')).toBe(CSS.escape('a"b'));
      const escape = CSS.escape;
      try {
        (CSS as { escape?: unknown }).escape = undefined;
        expect(sdCalendarCssEscape('a"b\\c')).toBe('a\\"b\\\\c');
      } finally {
        CSS.escape = escape;
      }
    });
  });

  describe('live region and focus', () => {
    it('[CAL-C-23] reads the same text twice with a trailing no-break space', () => {
      const announcer = new SdCalendarAnnouncer();
      announcer.announce('Saved');
      expect(announcer.text()).toBe('Saved');
      announcer.announce('Saved');
      expect(announcer.text()).toBe('Saved\xa0');
      announcer.announce('Other');
      expect(announcer.text()).toBe('Other');
    });

    it('[CAL-C-23] focuses the item once it renders, unless the user moved the focus', () => {
      @Component({
        standalone: true,
        template: '<button data-id="a">A</button><button data-other>B</button><div class="scope"><button data-scope>S</button></div>',
      })
      class Host {}
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      const keeper = new SdCalendarFocusKeeper(host, TestBed.inject(Injector), id => `[data-id="${id}"]`, '.scope');
      keeper.pending();
      const other = host.querySelector<HTMLElement>('[data-other]')!;
      other.focus();
      keeper.restore('a', null);
      fixture.detectChanges();
      expect(document.activeElement).withContext('the user moved the focus').toBe(other);
      keeper.restore('a', other);
      fixture.detectChanges();
      expect(document.activeElement?.getAttribute('data-id')).toBe('a');
      host.querySelector<HTMLElement>('[data-scope]')!.focus();
      keeper.restore('missing', null);
      fixture.detectChanges();
      expect(document.activeElement?.hasAttribute('data-scope')).withContext('not rendered yet').toBeTrue();
    });
  });

  describe('edge scroll', () => {
    it('[CAL-C-23] scrolls faster closer to an edge, on the axes asked for', () => {
      expect(sdCalendarEdgeSpeed(100, 0, 500)).toBe(0);
      expect(sdCalendarEdgeSpeed(0, 0, 500)).toBe(-16);
      expect(sdCalendarEdgeSpeed(20, 0, 500)).toBe(-8);
      expect(sdCalendarEdgeSpeed(500, 0, 500)).toBe(16);
      expect(sdCalendarEdgeSpeed(-1, 0, 500)).toBe(0);

      const frames: FrameRequestCallback[] = [];
      spyOn(window, 'requestAnimationFrame').and.callFake(callback => frames.push(callback));
      const cancel = spyOn(window, 'cancelAnimationFrame');
      const scroller = document.createElement('div');
      const scrolled = { top: 0, left: 0 };
      Object.defineProperty(scroller, 'scrollTop', { get: () => scrolled.top, set: value => (scrolled.top = value) });
      Object.defineProperty(scroller, 'scrollLeft', { get: () => scrolled.left, set: value => (scrolled.left = value) });
      const edge = new SdCalendarEdgeScroller(TestBed.inject(NgZone));
      const area = { top: 0, bottom: 400, left: 0, right: 600 };
      const onFrame = jasmine.createSpy('onFrame');
      edge.update(scroller, area, { x: 590, y: 5 }, { x: true, y: true }, onFrame);
      edge.update(scroller, area, { x: 590, y: 5 }, { x: true, y: true }, onFrame);
      expect(frames.length).withContext('one frame at a time').toBe(1);
      frames.shift()!(0);
      expect(scrolled).toEqual({ top: -14, left: 12 });
      expect(onFrame).toHaveBeenCalledTimes(1);
      edge.update(scroller, area, { x: 590, y: 5 }, { x: true, y: false }, onFrame);
      frames.shift()!(0);
      expect(scrolled).toEqual({ top: -14, left: 24 });
      edge.update(scroller, area, { x: 300, y: 200 }, { x: true, y: true }, onFrame);
      expect(cancel).not.toHaveBeenCalled();
      edge.update(scroller, area, { x: 590, y: 5 }, { x: true, y: true }, onFrame);
      edge.update(null, area, { x: 590, y: 5 }, { x: true, y: true }, onFrame);
      expect(cancel).toHaveBeenCalledTimes(1);
      edge.update(scroller, null, null, { x: true, y: true }, onFrame);
      edge.stop();
    });
  });
});
