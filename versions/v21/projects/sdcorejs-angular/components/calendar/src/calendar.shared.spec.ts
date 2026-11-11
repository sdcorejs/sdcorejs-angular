import { ApplicationRef, Component, Injector, NgZone } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { clockFor } from '../../../testing/schedule-testing';
import { SdCalendarEdgeScroller, sdCalendarEdgeSpeed } from './calendar-edge-scroll';
import {
  sdCalendarDateText,
  sdCalendarFormats,
  sdCalendarMovedText,
  sdCalendarTitle,
  sdCalendarUtcDay,
  sdCalendarWeekdayLong,
} from './calendar-format';
import { SdCalendarHostWidth, SdCalendarMinuteTimer, SdCalendarReporter, sdCalendarIsRtl } from './calendar-host';
import {
  SdCalendarAnnouncer,
  SdCalendarCreateRunner,
  SdCalendarFocusKeeper,
  SdCalendarMoveRunner,
  SdCalendarOperation,
  SdCalendarScopeBar,
} from './calendar-move';
import {
  sdCalendarBoundDay,
  sdCalendarBrokenWeekdays,
  sdCalendarCarrierDay,
  sdCalendarColor,
  sdCalendarCssEscape,
  sdCalendarDaysBetween,
  sdCalendarHolidayMap,
  sdCalendarInvalidItems,
  sdCalendarIsOffDay,
  sdCalendarLastDayOf,
  sdCalendarOutOfRange,
  sdCalendarPointOf,
  sdCalendarRangeKey,
  sdCalendarResolveFirstDayOfWeek,
  sdCalendarResolveStep,
  sdCalendarResolveWorkingHours,
  sdCalendarSameList,
  sdCalendarMoveTarget,
  sdCalendarSelectionGone,
  sdCalendarShiftDays,
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

    it('[CAL-C-23] words an accepted move as resized or moved', () => {
      const en = sdCalendarFormats('en-US', 'en');
      const target = { allDay: false, startDay: '2026/11/09', startMinutes: 600, endMinutes: 660 };
      const from = { start: '2026/11/09 09:00:00', end: '2026/11/09 10:00:00' };
      expect(sdCalendarMovedText('A', target, from, { start: '2026/11/09 10:00:00', end: '2026/11/09 11:00:00' }, 'drag', en, t)).toBe(
        'core.component.calendar.moved|{"title":"A","weekday":"Monday","date":"Nov 9","time":"10:00"}'
      );
      expect(sdCalendarMovedText('A', target, from, { start: from.start, end: '2026/11/09 11:00:00' }, 'keyboard', en, t)).toContain(
        'resized'
      );
      expect(sdCalendarMovedText('A', target, from, from, 'resize', en, t)).toContain('resized');
      expect(
        sdCalendarMovedText('A', { ...target, allDay: true }, from, { start: '2026/11/10', end: '2026/11/10' }, 'drag', en, t)
      ).toContain('"time":"core.component.calendar.all-day|{}"');
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

  describe('data checks', () => {
    it('[CAL-C-23] refuses bad ids and titles, names colours, finds days off, broken hours and a gone selection', () => {
      expect(sdCalendarInvalidItems([{ id: 'a', title: 'A' }])).toBeFalse();
      expect(
        sdCalendarInvalidItems([
          { id: 'a', title: 'A' },
          { id: 'a', title: 'B' },
        ])
      ).toBeTrue();
      expect(sdCalendarInvalidItems([{ id: '', title: 'A' }])).toBeTrue();
      expect(sdCalendarInvalidItems([{ id: 7, title: 'A' }])).toBeTrue();
      expect(sdCalendarInvalidItems([{ id: 'a', title: '  ' }])).toBeTrue();
      expect(sdCalendarInvalidItems([{ id: 'a', title: 9 }])).toBeTrue();
      expect(sdCalendarColor(undefined)).toEqual({ color: 'primary', customColor: null });
      expect(sdCalendarColor('warning')).toEqual({ color: 'warning', customColor: null });
      expect(sdCalendarColor('rebeccapurple')).toEqual({ color: 'custom', customColor: 'rebeccapurple' });
      const hours = { 1: [{ from: '08:00', to: '17:00' }], 2: [{ from: '10:00', to: '09:00' }] };
      expect(sdCalendarIsOffDay('2026/11/09', null, hours)).toBeFalse();
      expect(sdCalendarIsOffDay('2026/11/14', null, hours))
        .withContext('Saturday has no hours')
        .toBeTrue();
      expect(sdCalendarIsOffDay('2026/11/09', { date: '2026/11/09', label: 'Lễ', type: 'off' }, hours)).toBeTrue();
      expect(sdCalendarIsOffDay('2026/11/09', { date: '2026/11/09', label: 'Lễ', type: 'observance' }, hours)).toBeFalse();
      expect(sdCalendarIsOffDay('2026/11/14', undefined, null))
        .withContext('null hours: no days off')
        .toBeFalse();
      expect(sdCalendarBrokenWeekdays(hours)).toEqual([2]);
      expect(sdCalendarBrokenWeekdays(null)).toEqual([]);
      expect(sdCalendarBrokenWeekdays(undefined)).toEqual([]);
      expect(sdCalendarBrokenWeekdays({ 3: undefined })).toEqual([]);
      expect(sdCalendarSelectionGone('a', 'idle', [{ id: 'b' }])).toBeTrue();
      expect(sdCalendarSelectionGone('a', 'idle', [{ id: 'a' }])).toBeFalse();
      expect(sdCalendarSelectionGone('a', 'loading', [])).toBeFalse();
      expect(sdCalendarSelectionGone(null, 'idle', [])).toBeFalse();
    });
  });

  describe('move targets', () => {
    it('[CAL-C-23] reads the target of move() and shifts by whole days', () => {
      const clock = clockFor('Asia/Ho_Chi_Minh');
      const timed = { firstDay: '2026/11/09', lastDay: '2026/11/09', startInstant: 0, endInstant: 90 * 60_000 };
      expect(sdCalendarMoveTarget(timed, { start: '2026/11/10 23:00:00' }, false, clock)).toEqual({
        allDay: false,
        startDay: '2026/11/10',
        startMinutes: 1380,
        endDay: '2026/11/11',
        endMinutes: 30,
      });
      expect(sdCalendarMoveTarget(timed, { start: '2026/11/10 09:00:00', end: '2026/11/10 10:00:00' }, false, clock)?.endMinutes).toBe(600);
      expect(sdCalendarMoveTarget(timed, { start: '2026/11/10 09:00:00', end: '2026/11/10 08:00:00' }, false, clock)).toBeNull();
      expect(sdCalendarMoveTarget(timed, { start: 'nope' }, false, clock)).toBeNull();
      const days = { firstDay: '2026/11/09', lastDay: '2026/11/10', startInstant: 0, endInstant: 0 };
      expect(sdCalendarMoveTarget(days, { start: '2026/11/12' }, true, clock)).toEqual({
        allDay: true,
        startDay: '2026/11/12',
        startMinutes: 0,
        endDay: '2026/11/13',
        endMinutes: 1440,
      });
      expect(sdCalendarMoveTarget(days, { start: '2026/11/12', end: '2026/11/12', allDay: true }, false, clock)?.endDay).toBe('2026/11/12');
      expect(sdCalendarMoveTarget(days, { start: '2026/11/12', end: '2026/11/11' }, true, clock)).toBeNull();
      expect(sdCalendarMoveTarget(days, { start: 'nope' }, true, clock)).toBeNull();
      expect(
        sdCalendarShiftDays({ allDay: true, startDay: '2026/11/09', startMinutes: 0, endDay: '2026/11/10', endMinutes: 1440 }, 3)
      ).toEqual({
        allDay: true,
        startDay: '2026/11/12',
        startMinutes: 0,
        endDay: '2026/11/13',
        endMinutes: 1440,
      });
    });
  });

  describe('host', () => {
    it('[CAL-C-23] reads the host width once, reports once per key, ticks every minute and reads the direction', fakeAsync(() => {
      const zone = TestBed.inject(NgZone);
      const element = document.createElement('div');
      element.style.width = '320px';
      document.body.appendChild(element);
      try {
        const width = new SdCalendarHostWidth(element, zone);
        expect(width.width()).toBeNull();
        width.measureOnce();
        expect(width.width()).toBe(320);
        width.measureOnce();
        width.disconnect();
        element.dir = 'rtl';
        expect(sdCalendarIsRtl(element)).toBeTrue();
      } finally {
        element.remove();
      }
      const warn = spyOn(console, 'warn');
      const reporter = new SdCalendarReporter('[sd-test]');
      reporter.report('warn', 'a', 'first');
      reporter.report('warn', 'a', 'again');
      expect(warn.calls.allArgs()).toEqual([['[sd-test] first']]);
      const onTick = jasmine.createSpy('onTick');
      const timer = new SdCalendarMinuteTimer(zone, onTick);
      timer.run(true);
      timer.run(true);
      tick(60_000);
      expect(onTick).toHaveBeenCalledTimes(1);
      timer.run(false);
      tick(60_000);
      expect(onTick).toHaveBeenCalledTimes(1);
      timer.stop();
    }));
  });

  describe('move runner', () => {
    it('[CAL-SC-14] refuses a move while another operation waits, without calling anything', async () => {
      const operation = new SdCalendarOperation<'create' | 'move'>();
      operation.begin('create');
      const show = jasmine.createSpy('show');
      const runner = new SdCalendarMoveRunner({
        operation,
        announcer: new SdCalendarAnnouncer(),
        focus: new SdCalendarFocusKeeper(document.body, TestBed.inject(Injector), id => `#${id}`, '.scope'),
        t: key => key,
        ask: () => Promise.resolve(null),
        band: () => undefined,
        reload: () => undefined,
      });
      const onMove = jasmine.createSpy('onMove');
      const result = await runner.run({
        id: 'a',
        title: 'A',
        recurring: false,
        source: 'api',
        keyboard: false,
        allowed: () => true,
        request: (scope, signal) => ({ scope, signal }),
        onMove,
        show,
        accept: () => '',
        fail: () => undefined,
      });
      expect(result).toBeFalse();
      expect(onMove).not.toHaveBeenCalled();
      expect(show).not.toHaveBeenCalled();
    });
  });

  describe('create runner', () => {
    function creator(operation = new SdCalendarOperation<'create' | 'move'>()) {
      const announcer = new SdCalendarAnnouncer();
      const band = jasmine.createSpy('band');
      const runner = new SdCalendarCreateRunner({ operation, announcer, t: key => key, band });
      return { runner, operation, announcer, band };
    }

    it('[CAL-SC-19] shows the waiting block, passes the args with a signal, then inserts the answer', async () => {
      const { runner, operation, band } = creator();
      const shown: boolean[] = [];
      const accept = jasmine.createSpy('accept');
      const onCreate = jasmine.createSpy('onCreate').and.callFake(() => {
        expect(operation.busy()).withContext('one waiting operation').toBeTrue();
        return Promise.resolve({ id: 'new' });
      });
      await runner.run({ args: { start: 'a' }, onCreate, show: waiting => shown.push(waiting), accept });
      expect(onCreate.calls.mostRecent().args[0].start).toBe('a');
      expect(onCreate.calls.mostRecent().args[0].signal.aborted).toBeFalse();
      expect(shown).toEqual([true, false]);
      expect(band.calls.allArgs()).toEqual([[null]]);
      expect(accept).toHaveBeenCalledWith({ id: 'new' });
      expect(operation.busy()).toBeFalse();
    });

    it('[CAL-SC-20] removes the block without inserting when onCreate returns nothing', async () => {
      const { runner } = creator();
      const accept = jasmine.createSpy('accept');
      const show = jasmine.createSpy('show');
      await runner.run({ args: {}, onCreate: () => undefined, show, accept });
      expect(show.calls.allArgs()).toEqual([[true], [false]]);
      expect(accept).not.toHaveBeenCalled();
    });

    it('[CAL-SC-21] shows the create error without its text when onCreate throws', async () => {
      const { runner, announcer, band, operation } = creator();
      await runner.run({
        args: {},
        onCreate: () => Promise.reject(new Error('SECRET')),
        show: () => undefined,
        accept: () => undefined,
      });
      expect(band).toHaveBeenCalledWith({ id: null, message: 'core.component.calendar.create-error' });
      expect(announcer.text()).toBe('core.component.calendar.create-error');
      expect(operation.busy()).toBeFalse();
    });

    it('[CAL-SC-15] drops the late answer or error of an aborted create; [CAL-SC-14] refuses a second one', async () => {
      const { runner, operation, band } = creator();
      for (const answer of [() => Promise.resolve({ id: 'late' }), () => Promise.reject(new Error('late'))]) {
        band.calls.reset();
        const accept = jasmine.createSpy('accept');
        const show = jasmine.createSpy('show');
        const done = runner.run({
          args: {},
          onCreate: () => {
            operation.abort(['create']);
            return answer();
          },
          show,
          accept,
        });
        await done;
        expect(accept).not.toHaveBeenCalled();
        expect(show.calls.allArgs())
          .withContext('the block is left to the abort')
          .toEqual([[true]]);
        expect(band.calls.allArgs()).toEqual([[null]]);
      }
      operation.begin('move');
      const onCreate = jasmine.createSpy('onCreate');
      await runner.run({ args: {}, onCreate, show: () => undefined, accept: () => undefined });
      expect(onCreate).not.toHaveBeenCalled();
    });
  });

  describe('scope bar', () => {
    it('[CAL-C-13] asks, focuses the first answer, answers once, and closes on Escape', async () => {
      @Component({
        standalone: true,
        template: '<div role="alertdialog"><button data-scope="this">This</button></div>',
      })
      class Host {}
      const fixture = TestBed.createComponent(Host);
      const host = fixture.nativeElement as HTMLElement;
      document.body.appendChild(host);
      const bar = new SdCalendarScopeBar(host, TestBed.inject(Injector));
      bar.answer('this');
      expect(bar.asking()).withContext('nothing to answer').toBeNull();
      const first = bar.ask('Stand-up');
      expect(bar.asking()?.title).toBe('Stand-up');
      fixture.detectChanges();
      TestBed.inject(ApplicationRef).tick();
      expect(document.activeElement?.getAttribute('data-scope')).toBe('this');
      bar.answer('all');
      bar.answer('this');
      expect(await first).toBe('all');
      expect(bar.asking()).toBeNull();

      const second = bar.ask('Stand-up');
      const other = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
      bar.onKeydown(other);
      expect(other.defaultPrevented).toBeFalse();
      const escape = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
      bar.onKeydown(escape);
      expect(escape.defaultPrevented).toBeTrue();
      expect(await second).toBeNull();
      host.remove();
    });

    it('[CAL-SC-15] answers Cancel and closes when the signal of its operation aborts', async () => {
      const bar = new SdCalendarScopeBar(document.createElement('div'), TestBed.inject(Injector));
      const first = new AbortController();
      const asked = bar.ask('Stand-up', first.signal);
      first.abort();
      expect(await asked).toBeNull();
      expect(bar.asking()).toBeNull();

      const aborted = new AbortController();
      aborted.abort();
      expect(await bar.ask('Stand-up', aborted.signal))
        .withContext('already aborted')
        .toBeNull();
      expect(bar.asking()).toBeNull();

      const old = new AbortController();
      const answered = bar.ask('Stand-up', old.signal);
      bar.answer('this');
      expect(await answered).toBe('this');
      void bar.ask('Review');
      old.abort();
      expect(bar.asking()?.title).withContext('an old signal does not close a newer question').toBe('Review');
    });

    it('[CAL-C-23] sdCalendarOutOfRange compares with each bound that is set', () => {
      expect(sdCalendarOutOfRange('2026/11/09', null, null)).toBeFalse();
      expect(sdCalendarOutOfRange('2026/11/09', '2026/11/10', null)).toBeTrue();
      expect(sdCalendarOutOfRange('2026/11/10', '2026/11/10', '2026/11/10')).toBeFalse();
      expect(sdCalendarOutOfRange('2026/11/11', null, '2026/11/10')).toBeTrue();
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

  describe('focus watch', () => {
    it('[CAL-SC-30] keeps the focus the user moved elsewhere, even after it falls back to body', () => {
      @Component({
        standalone: true,
        template: '<button data-id="a">A</button><div class="scope"><button data-scope>S</button></div>',
      })
      class Host {}
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      document.body.appendChild(host);
      const keeper = new SdCalendarFocusKeeper(host, TestBed.inject(Injector), id => `[data-id="${id}"]`, '.scope');
      const item = host.querySelector<HTMLElement>('[data-id="a"]')!;
      const outside = document.createElement('input');
      document.body.appendChild(outside);

      item.focus();
      const kept = keeper.track(item);
      host.querySelector<HTMLElement>('[data-scope]')!.focus();
      expect(kept.abandoned()).withContext('the scope bar belongs to the component').toBeFalse();
      outside.focus();
      outside.remove();
      expect(document.activeElement).toBe(document.body);
      expect(kept.abandoned()).toBeTrue();
      keeper.restore('a', item, kept);
      kept.stop();
      fixture.detectChanges();
      TestBed.inject(ApplicationRef).tick();
      expect(document.activeElement).withContext('SC-30').toBe(document.body);

      item.focus();
      const fresh = keeper.track(item);
      item.blur();
      item.focus();
      item.blur();
      keeper.restore('a', item, fresh);
      fresh.stop();
      TestBed.inject(ApplicationRef).tick();
      expect(document.activeElement).withContext('a fall back to body alone does not abandon').toBe(item);
      host.remove();
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
