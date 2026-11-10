import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, signal } from '@angular/core';
import { TestBed, discardPeriodicTasks, fakeAsync, flushMicrotasks, tick, type ComponentFixture } from '@angular/core/testing';
import { FakeResizeObserver, deferred, type Deferred } from '../../../testing/schedule-testing';
import { SdCalendar } from './calendar.component';
import type { SdCalendarEvent, SdCalendarLoadArgs, SdCalendarOption, SdCalendarView, SdCalendarVisibleRange } from './calendar.model';
import {
  SdCalendarAgendaItemTemplateDirective,
  SdCalendarDayCellTemplateDirective,
  SdCalendarEmptyTemplateDirective,
  SdCalendarEventTemplateDirective,
} from './calendar.templates';
import {
  clientOption,
  configureCalendar,
  createWith,
  q,
  qa,
  text,
  weekEvents,
  type CalendarDto,
  type CalendarSetup,
} from './calendar.testing';

type Events = readonly SdCalendarEvent<CalendarDto>[];

interface Rendered {
  readonly fixture: ComponentFixture<SdCalendar<CalendarDto>>;
  readonly calendar: SdCalendar<CalendarDto>;
  readonly host: HTMLElement;
  readonly ranges: SdCalendarVisibleRange[];
  readonly loadErrors: unknown[];
  readonly setNow: (next: string) => void;
  /** Change detection, then pending microtasks (resolved `onLoad` promises), then change detection again. */
  settle(): void;
}

/** Renders `<sd-calendar>` on 22/10/2026 with the week fixture; call inside `fakeAsync`. */
function render(inputs: Record<string, unknown> = {}, setup: CalendarSetup = {}, height = '640px'): Rendered {
  const { setNow } = configureCalendar(setup);
  const fixture = createWith(SdCalendar<CalendarDto>, { option: clientOption(), date: '2026/10/22', ...inputs });
  const host = fixture.nativeElement as HTMLElement;
  host.style.height = height;
  host.style.width = '960px';
  const ranges: SdCalendarVisibleRange[] = [];
  const loadErrors: unknown[] = [];
  fixture.componentInstance.sdRangeChange.subscribe(range => ranges.push(range));
  fixture.componentInstance.sdLoadError.subscribe(error => loadErrors.push(error));
  const settle = (): void => {
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
  };
  settle();
  return { fixture, calendar: fixture.componentInstance, host, ranges, loadErrors, setNow, settle };
}

/** An option whose `onLoad` records its arguments and answers with a deferred per call. */
function deferredOption(): { option: SdCalendarOption<CalendarDto>; calls: SdCalendarLoadArgs[]; pending: Deferred<Events>[] } {
  const calls: SdCalendarLoadArgs[] = [];
  const pending: Deferred<Events>[] = [];
  const option: SdCalendarOption<CalendarDto> = {
    dataSource: {
      onLoad: args => {
        calls.push(args);
        const next = deferred<Events>();
        pending.push(next);
        return next.promise;
      },
    },
  };
  return { option, calls, pending };
}

function spyOption(events: () => Events = weekEvents): { option: SdCalendarOption<CalendarDto>; onLoad: jasmine.Spy } {
  const onLoad = jasmine.createSpy('onLoad').and.callFake(() => events());
  return { option: { dataSource: { onLoad } }, onLoad };
}

const columns = (host: HTMLElement): string[] => qa(host, '[data-day-column]').map(column => column.dataset['date']!);
const block = (host: HTMLElement, id: string): HTMLElement | null => q(host, `[data-event-id="${id}"]`);
const viewButtons = (host: HTMLElement): HTMLButtonElement[] => qa<HTMLButtonElement>(host, '[data-view-option]');
const action = (host: HTMLElement, name: string): HTMLButtonElement => q<HTMLButtonElement>(host, `button[data-action="${name}"]`)!;

describe('SdCalendar · rendering and data source', () => {
  afterEach(() => TestBed.resetTestingModule());

  describe('views', () => {
    it('[CAL-C-01] renders week, day, month and agenda from the view buttons', fakeAsync(() => {
      const { host, calendar, settle } = render();
      expect(q(host, '[role="region"]')?.dataset['view']).toBe('week');
      expect(columns(host)).toEqual(['2026/10/19', '2026/10/20', '2026/10/21', '2026/10/22', '2026/10/23', '2026/10/24', '2026/10/25']);
      expect(viewButtons(host).map(text)).toEqual(['Tháng', 'Tuần', 'Ngày', 'Danh sách']);

      viewButtons(host)[0].click();
      settle();
      expect(calendar.view()).toBe('month');
      expect(q(host, '[role="grid"]')).not.toBeNull();
      expect(qa(host, '[role="gridcell"]').length).toBe(35);

      viewButtons(host)[2].click();
      settle();
      expect(columns(host)).toEqual(['2026/10/22']);

      viewButtons(host)[3].click();
      settle();
      expect(qa(host, '[data-agenda-day]').map(day => day.dataset['date'])).toEqual(['2026/10/22', '2026/10/23']);
    }));

    it('[CAL-C-01] filters and orders the view buttons by views and falls back to the first one', fakeAsync(() => {
      const { host } = render({ views: ['agenda', 'day'] });
      expect(viewButtons(host).map(text)).toEqual(['Danh sách', 'Ngày']);
      expect(q(host, '[role="region"]')?.dataset['view']).toBe('agenda');
      expect(qa(host, '[data-agenda-day]').length).toBe(2);
    }));
  });

  describe('data source', () => {
    it('[CAL-C-02] calls onLoad once on init with from, to, view and a live signal', fakeAsync(() => {
      const { option, onLoad } = spyOption();
      render({ option });
      expect(onLoad).toHaveBeenCalledTimes(1);
      const args = onLoad.calls.mostRecent().args[0] as SdCalendarLoadArgs;
      expect({ from: args.from, to: args.to, view: args.view }).toEqual({ from: '2026/10/19', to: '2026/10/25', view: 'week' });
      expect(args.signal instanceof AbortSignal).toBeTrue();
      expect(args.signal.aborted).toBeFalse();
    }));

    it('[CAL-C-03] loads again on previous/next, today, a view change and firstDayOfWeek, not when the range stays', fakeAsync(() => {
      const { option, onLoad } = spyOption();
      const { host, fixture, calendar, settle } = render({ option });
      const last = (): Pick<SdCalendarLoadArgs, 'from' | 'to' | 'view'> => {
        const { from, to, view } = onLoad.calls.mostRecent().args[0] as SdCalendarLoadArgs;
        return { from, to, view };
      };
      action(host, 'next').click();
      settle();
      expect(last()).toEqual({ from: '2026/10/26', to: '2026/11/01', view: 'week' });
      action(host, 'prev').click();
      settle();
      expect(last()).toEqual({ from: '2026/10/19', to: '2026/10/25', view: 'week' });
      action(host, 'today').click();
      settle();
      expect(calendar.date()).toBe('2026/11/09');
      expect(last()).toEqual({ from: '2026/11/09', to: '2026/11/15', view: 'week' });
      fixture.componentRef.setInput('date', '2026/10/21');
      settle();
      fixture.componentRef.setInput('firstDayOfWeek', 0);
      settle();
      expect(last()).toEqual({ from: '2026/10/18', to: '2026/10/24', view: 'week' });
      viewButtons(host)[0].click();
      settle();
      expect(last()).toEqual({ from: '2026/09/27', to: '2026/10/31', view: 'month' });
      const count = onLoad.calls.count();
      fixture.componentRef.setInput('date', '2026/10/05');
      settle();
      fixture.componentRef.setInput('views', ['month', 'week']);
      settle();
      expect(onLoad.calls.count()).toBe(count);
    }));

    it('[CAL-C-04] shows only the events of the range when the client returns everything', fakeAsync(() => {
      const { host } = render();
      expect(block(host, 'client')).not.toBeNull();
      expect(block(host, 'old')).toBeNull();
    }));

    it('[CAL-C-05] loads again for a new option object, not for a change inside the same object', fakeAsync(() => {
      const { option, onLoad } = spyOption();
      const { fixture, settle } = render({ option });
      fixture.componentRef.setInput('option', { ...option });
      settle();
      expect(onLoad).toHaveBeenCalledTimes(2);
      const replaced = jasmine.createSpy('replaced').and.returnValue([]);
      option.dataSource.onLoad = replaced;
      settle();
      expect(onLoad).toHaveBeenCalledTimes(2);
      expect(replaced).not.toHaveBeenCalled();
    }));

    it('[CAL-C-06] emits sdRangeChange with onLoad, never twice for the same range', fakeAsync(() => {
      const { option, onLoad } = spyOption();
      const { host, fixture, calendar, ranges, settle } = render({ option });
      expect(ranges).toEqual([{ from: '2026/10/19', to: '2026/10/25', view: 'week' }]);
      fixture.componentRef.setInput('option', { ...option });
      settle();
      calendar.reload();
      settle();
      fixture.componentRef.setInput('date', '2026/10/21');
      settle();
      expect(ranges.length).toBe(1);
      expect(onLoad).toHaveBeenCalledTimes(3);
      action(host, 'next').click();
      settle();
      expect(ranges).toEqual([
        { from: '2026/10/19', to: '2026/10/25', view: 'week' },
        { from: '2026/10/26', to: '2026/11/01', view: 'week' },
      ]);
    }));

    it('[CAL-C-06] loads and emits one day as view "day" while the week is compact', fakeAsync(() => {
      const restore = FakeResizeObserver.install();
      try {
        const { option, onLoad } = spyOption();
        const { ranges, settle } = render({ option, date: '2026/10/22' });
        FakeResizeObserver.trigger(599);
        settle();
        expect(ranges[ranges.length - 1]).toEqual({ from: '2026/10/22', to: '2026/10/22', view: 'day' });
        expect((onLoad.calls.mostRecent().args[0] as SdCalendarLoadArgs).view).toBe('day');
        FakeResizeObserver.trigger(600);
        settle();
        expect(ranges[ranges.length - 1]).toEqual({ from: '2026/10/19', to: '2026/10/25', view: 'week' });
      } finally {
        restore();
      }
    }));

    it('[CAL-C-03] disables previous/next when that range lies wholly outside minDate/maxDate and shades days outside them', fakeAsync(() => {
      const { host, fixture, settle } = render({ minDate: '2026/10/19', maxDate: '2026-10-23T03:00:00Z' });
      expect(action(host, 'prev').disabled).toBeTrue();
      expect(action(host, 'next').disabled).toBeTrue();
      expect(qa(host, '[data-day-column][data-out-of-range]').map(column => column.dataset['date'])).toEqual(['2026/10/24', '2026/10/25']);
      fixture.componentRef.setInput('minDate', 'TODAY');
      fixture.componentRef.setInput('maxDate', null);
      settle();
      expect(action(host, 'prev').disabled).toBeTrue();
      expect(action(host, 'next').disabled).toBeFalse();
      expect(qa(host, '[data-day-column][data-out-of-range]').length).toBe(7);
      fixture.componentRef.setInput('date', '2026/11/09');
      settle();
      expect(action(host, 'prev').disabled).toBeTrue();
      expect(qa(host, '[data-day-column][data-out-of-range]').length).toBe(0);
    }));

    it('[CAL-C-07] labels the time column with the offset of the configured zone', fakeAsync(() => {
      const { host, fixture, settle } = render();
      expect(text(q(host, '[data-zone]'))).toBe('GMT+7');
      fixture.componentRef.setInput('view', 'day');
      settle();
      expect(text(q(host, '[data-zone]'))).toBe('GMT+7');
    }));

    it('[CAL-C-07] places an instant on the calendar day of the configured zone', fakeAsync(() => {
      const events = [{ id: 'h', title: 'Hist', start: '1960-05-19T16:00:00Z', end: '1960-05-19T17:00:00Z' }];
      const { host } = render({ option: clientOption(() => events), view: 'day', date: '1960/05/20' });
      expect(columns(host)).toEqual(['1960/05/20']);
      expect(block(host, 'h')?.closest<HTMLElement>('[data-day-column]')?.dataset['date']).toBe('1960/05/20');
      expect(block(host, 'h')?.dataset['start']).toBe('1960/05/20 00:00:00');
    }));
  });

  describe('loading and errors', () => {
    it('[CAL-SC-22] passes a signal and aborts it when the range changes; a late result is dropped', fakeAsync(() => {
      const { option, calls, pending } = deferredOption();
      const { host, settle } = render({ option });
      action(host, 'next').click();
      settle();
      expect(calls.length).toBe(2);
      expect(calls[0].signal.aborted).toBeTrue();
      pending[0].resolve(weekEvents());
      settle();
      expect(block(host, 'client')).toBeNull();
      pending[1].resolve([{ id: 'next', title: 'Next', start: '2026/10/27 09:00:00', end: '2026/10/27 10:00:00' }]);
      settle();
      expect(block(host, 'next')).not.toBeNull();
    }));

    it('[CAL-SC-23] reload() aborts a running load and keeps the events on screen until the result arrives', fakeAsync(() => {
      const { option, calls, pending } = deferredOption();
      const { host, calendar, settle } = render({ option });
      pending[0].resolve(weekEvents());
      settle();
      expect(block(host, 'client')).not.toBeNull();
      calendar.reload();
      settle();
      calendar.reload();
      settle();
      expect(calls.length).toBe(3);
      expect(calls[1].signal.aborted).toBeTrue();
      expect({ from: calls[2].from, to: calls[2].to }).toEqual({ from: '2026/10/19', to: '2026/10/25' });
      expect(block(host, 'client')).not.toBeNull();
      pending[2].resolve([weekEvents()[0]]);
      settle();
      expect(block(host, 'client')).toBeNull();
      expect(block(host, 'standup')).not.toBeNull();
    }));

    it('[CAL-SC-22] aborts a running load when the option changes and when the calendar is destroyed', fakeAsync(() => {
      const { option, calls, pending } = deferredOption();
      const { host, fixture, settle } = render({ option });
      fixture.componentRef.setInput('option', { ...option });
      settle();
      expect(calls.length).toBe(2);
      expect(calls[0].signal.aborted).toBeTrue();
      pending[0].resolve(weekEvents());
      settle();
      expect(block(host, 'client')).toBeNull();
      fixture.destroy();
      expect(calls[1].signal.aborted).toBeTrue();
    }));

    it('[CAL-SC-24] shows the load error with a retry button and emits sdLoadError once', fakeAsync(() => {
      const { option, calls, pending } = deferredOption();
      const { host, loadErrors, settle } = render({ option });
      const error = new Error('down');
      pending[0].reject(error);
      settle();
      const band = q(host, '[data-band="load-error"]');
      expect(text(band)).toContain('Không tải được lịch.');
      expect(loadErrors).toEqual([error]);
      q<HTMLButtonElement>(band!, 'button[data-action="retry"]')!.click();
      settle();
      expect(calls.length).toBe(2);
      expect({ from: calls[1].from, to: calls[1].to }).toEqual({ from: calls[0].from, to: calls[0].to });
      expect(q(host, '[data-band="load-error"]')).toBeNull();
    }));

    it('[CAL-B-01] clears the events when a reload fails (calendar.md §13, R1-G1)', fakeAsync(() => {
      const { option, pending } = deferredOption();
      const { host, calendar, settle } = render({ option });
      pending[0].resolve(weekEvents());
      settle();
      expect(block(host, 'client')).not.toBeNull();
      calendar.reload();
      settle();
      expect(block(host, 'client')).not.toBeNull();
      pending[1].reject(new Error('down'));
      settle();
      expect(q(host, '[data-band="load-error"]')).not.toBeNull();
      expect(qa(host, '[data-event-id]').length).toBe(0);
    }));

    it('[CAL-SC-24] does not emit sdLoadError for an aborted load', fakeAsync(() => {
      const { option, pending } = deferredOption();
      const { host, loadErrors, settle } = render({ option });
      action(host, 'next').click();
      settle();
      pending[0].reject(new Error('late'));
      settle();
      expect(loadErrors).toEqual([]);
      expect(q(host, '[data-band="load-error"]')).toBeNull();
    }));

    it('[CAL-SC-16] never shows the text of a load error', fakeAsync(() => {
      const thrown = render({
        option: {
          dataSource: {
            onLoad: () => {
              throw new Error('SECRET');
            },
          },
        },
      });
      expect(thrown.host.textContent).not.toContain('SECRET');
      expect(q(thrown.host, '[data-band="load-error"]')).not.toBeNull();
      TestBed.resetTestingModule();
      const rejected = render({ option: { dataSource: { onLoad: () => Promise.reject('SECRET') } } });
      expect(rejected.host.textContent).not.toContain('SECRET');
      expect(rejected.loadErrors).toEqual(['SECRET']);
    }));

    it('[CAL-C-19] marks the grid busy, shows the progress bar and a skeleton on the first load only', fakeAsync(() => {
      const { option, pending } = deferredOption();
      const { host, settle } = render({ option });
      const grid = (): HTMLElement => q(host, '[data-region="time-grid"]')!;
      expect(grid().getAttribute('aria-busy')).toBe('true');
      expect(q(host, '[role="progressbar"]')).not.toBeNull();
      expect(qa(host, '[data-skeleton]').length).toBeGreaterThan(0);
      pending[0].resolve(weekEvents());
      settle();
      expect(grid().hasAttribute('aria-busy')).toBeFalse();
      expect(q(host, '[role="progressbar"]')).toBeNull();
      expect(qa(host, '[data-skeleton]').length).toBe(0);
      action(host, 'next').click();
      settle();
      expect(q(host, '[role="progressbar"]')).not.toBeNull();
      expect(qa(host, '[data-skeleton]').length).toBe(0);
      expect(qa(host, '[data-event-id]').length).toBe(0);
    }));
  });

  describe('data checks', () => {
    it('[CAL-SC-01] shows the invalid-data state for a duplicate or empty id', fakeAsync(() => {
      const duplicate = render({ option: clientOption(() => [...weekEvents(), { ...weekEvents()[0] }]) });
      expect(text(q(duplicate.host, 'sd-data-state'))).toContain('Dữ liệu lịch không hợp lệ.');
      expect(columns(duplicate.host)).toEqual([]);
      TestBed.resetTestingModule();
      const empty = render({ option: clientOption(() => [{ ...weekEvents()[0], id: '' }]) });
      expect(q(empty.host, 'sd-data-state')).not.toBeNull();
    }));

    it('[CAL-C-16] shows the invalid-data state for an empty title and skips an unreadable event with one warning', fakeAsync(() => {
      const untitled = render({ option: clientOption(() => [{ ...weekEvents()[0], title: ' ' }]) });
      expect(q(untitled.host, 'sd-data-state')).not.toBeNull();
      TestBed.resetTestingModule();
      const warn = spyOn(console, 'warn');
      const broken = { id: 'broken', title: 'Hỏng', start: 'not a date', end: '2026/10/22 10:00:00' };
      const { host, calendar, settle } = render({ option: clientOption(() => [...weekEvents(), broken]) });
      expect(q(host, 'sd-data-state')).toBeNull();
      expect(block(host, 'broken')).toBeNull();
      expect(block(host, 'client')).not.toBeNull();
      calendar.reload();
      settle();
      expect(warn.calls.allArgs().filter(args => String(args[0]).includes('"broken"')).length).toBe(1);
    }));
  });

  describe('states', () => {
    it('[CAL-C-17] keeps navigation in readonly and disabled; disabled takes events out of the tab order', fakeAsync(() => {
      const { option, onLoad } = spyOption();
      const { host, fixture, settle } = render({ option, readonly: true });
      expect(block(host, 'client')?.getAttribute('tabindex')).toBe('0');
      expect(q(host, '[data-region="time-grid"]')?.hasAttribute('aria-disabled')).toBeFalse();
      action(host, 'next').click();
      settle();
      expect(onLoad).toHaveBeenCalledTimes(2);
      fixture.componentRef.setInput('readonly', false);
      fixture.componentRef.setInput('disabled', true);
      action(host, 'prev').click();
      settle();
      expect(onLoad).toHaveBeenCalledTimes(3);
      expect(q(host, '[data-region="time-grid"]')?.getAttribute('aria-disabled')).toBe('true');
      expect(block(host, 'client')?.getAttribute('tabindex')).toBe('-1');
    }));

    it('[CAL-C-20] dims past events only with dimPast', fakeAsync(() => {
      const plain = render();
      expect(qa(plain.host, '[data-event-id][data-past]').length).toBe(0);
      TestBed.resetTestingModule();
      const { host } = render({ dimPast: true });
      const blocks = qa(host, '[data-event-id]');
      expect(blocks.length).toBeGreaterThan(0);
      expect(qa(host, '[data-event-id][data-past]').length).toBe(blocks.length);
    }));

    it('[CAL-C-20] hides weekends, shades days off and holidays, and turns shading off with workingHours null', fakeAsync(() => {
      const holidays = [
        { date: '2026/10/20', label: 'Ngày Phụ nữ Việt Nam', type: 'observance' as const },
        { date: '2026/10/21', label: 'Nghỉ bù', type: 'off' as const },
      ];
      const { host, fixture, settle } = render({ holidays });
      const column = (day: string): HTMLElement => q(host, `[data-day-column][data-date="${day}"]`)!;
      const header = (day: string): HTMLElement => q(host, `[data-day-header][data-date="${day}"]`)!;
      expect(column('2026/10/24').dataset['off']).toBe('true');
      expect(column('2026/10/21').dataset['off']).toBe('true');
      expect(column('2026/10/20').dataset['off']).toBeUndefined();
      expect(qa(column('2026/10/19'), '[data-off-hours]').length).toBe(3);
      expect(text(q(header('2026/10/21'), '[data-holiday]'))).toBe('Nghỉ bù');
      expect(q(header('2026/10/21'), '[data-holiday]')?.dataset['holiday']).toBe('off');
      expect(text(q(header('2026/10/20'), '[data-holiday]'))).toBe('Ngày Phụ nữ Việt Nam');
      expect(q(header('2026/10/20'), '[data-holiday]')?.getAttribute('title')).toBe('Ngày Phụ nữ Việt Nam');

      fixture.componentRef.setInput('workingHours', null);
      settle();
      expect(qa(host, '[data-off-hours]').length).toBe(0);
      expect(column('2026/10/24').dataset['off']).toBeUndefined();
      expect(column('2026/10/21').dataset['off']).toBe('true');

      fixture.componentRef.setInput('hideWeekends', true);
      settle();
      expect(columns(host)).toEqual(['2026/10/19', '2026/10/20', '2026/10/21', '2026/10/22', '2026/10/23']);
    }));

    it('[CAL-C-20] scrolls to the earliest working hour, or scrollTime, half an hour above', fakeAsync(() => {
      const scroller = (host: HTMLElement): HTMLElement => q(host, '[data-region="scroller"]')!;
      const plain = render();
      expect(scroller(plain.host).scrollTop).toBe(360);
      TestBed.resetTestingModule();
      const custom = render({ scrollTime: '13:00' });
      expect(scroller(custom.host).scrollTop).toBe(600);
    }));

    it('[CAL-C-20] falls back to a 30-minute step and warns once for a step that does not divide an hour', fakeAsync(() => {
      const warn = spyOn(console, 'warn');
      const { fixture, settle } = render({ step: 7 });
      fixture.componentRef.setInput('date', '2026/10/29');
      settle();
      expect(warn.calls.allArgs().filter(args => String(args[0]).includes('step 7')).length).toBe(1);
    }));

    it('[CAL-C-20] uses the calendar configuration under the inputs', fakeAsync(() => {
      const { option, onLoad } = spyOption();
      const { host, fixture, settle } = render({ option }, { configuration: { firstDayOfWeek: 0, workingHours: null } });
      expect((onLoad.calls.mostRecent().args[0] as SdCalendarLoadArgs).from).toBe('2026/10/18');
      expect(qa(host, '[data-off-hours]').length).toBe(0);
      fixture.componentRef.setInput('firstDayOfWeek', 1);
      settle();
      expect((onLoad.calls.mostRecent().args[0] as SdCalendarLoadArgs).from).toBe('2026/10/19');
    }));

    it('[CAL-C-21] draws the current time only in the today column and moves it every 60 seconds', fakeAsync(() => {
      const { host, fixture, setNow } = render({ date: '2026/11/09' });
      const lines = qa(host, '[data-now]');
      expect(lines.length).toBe(1);
      const column = lines[0].closest<HTMLElement>('[data-day-column]')!;
      expect(column.dataset['date']).toBe('2026/11/09');
      const offset = (): number => lines[0].getBoundingClientRect().top - column.getBoundingClientRect().top;
      const before = offset();
      expect(Math.abs(before - 512)).toBeLessThanOrEqual(2);
      setNow('2026/11/09 10:41');
      tick(60_000);
      fixture.detectChanges();
      expect(offset() - before).toBeCloseTo(0.8, 1);
      fixture.componentRef.setInput('date', '2026/10/22');
      fixture.detectChanges();
      flushMicrotasks();
      fixture.detectChanges();
      expect(qa(host, '[data-now]').length).toBe(0);
      discardPeriodicTasks();
    }));
  });

  describe('titles and navigation', () => {
    const title = (host: HTMLElement): string => text(q(host, '[data-title]'));

    it('[CAL-C-01] titles every view in Vietnamese', fakeAsync(() => {
      const { host, fixture, settle } = render();
      expect(title(host)).toBe('19 – 25 tháng 10, 2026');
      fixture.componentRef.setInput('date', '2026/09/30');
      settle();
      expect(title(host)).toBe('28/09 – 04/10/2026');
      fixture.componentRef.setInput('date', '2026/12/30');
      settle();
      expect(title(host)).toBe('28/12/2026 – 03/01/2027');
      fixture.componentRef.setInput('date', '2026/10/22');
      fixture.componentRef.setInput('view', 'day');
      settle();
      expect(title(host)).toBe('Thứ Năm, 22 tháng 10, 2026');
      fixture.componentRef.setInput('view', 'month');
      settle();
      expect(title(host)).toBe('Tháng 10, 2026');
      fixture.componentRef.setInput('view', 'agenda');
      settle();
      expect(title(host)).toBe('22/10 – 04/11/2026');
      expect(action(host, 'prev').getAttribute('aria-label')).toBe('14 ngày trước');
    }));

    it('[CAL-C-01] titles and labels in English', fakeAsync(() => {
      const { host, fixture, settle } = render({}, { language: 'en' });
      expect(title(host)).toBe('Oct 19 – 25, 2026');
      expect(block(host, 'client')?.getAttribute('aria-label')).toBe('Hẹn khách: Công ty An Phát, Thursday Oct 22, 09:30 to 10:30');
      expect(action(host, 'next').getAttribute('aria-label')).toBe('Next week');
      fixture.componentRef.setInput('date', '2026/09/30');
      settle();
      expect(title(host)).toBe('Sep 28 – Oct 4, 2026');
      fixture.componentRef.setInput('date', '2026/10/22');
      fixture.componentRef.setInput('view', 'day');
      settle();
      expect(title(host)).toBe('Thursday, October 22, 2026');
      expect(action(host, 'next').getAttribute('aria-label')).toBe('Next day');
      fixture.componentRef.setInput('view', 'month');
      settle();
      expect(title(host)).toBe('October 2026');
      fixture.componentRef.setInput('view', 'agenda');
      settle();
      expect(title(host)).toBe('Oct 22 – Nov 4, 2026');
    }));

    it('[CAL-C-01] opens the day view from a day number and from +N of the all-day row', fakeAsync(() => {
      const crowded = [
        ...weekEvents(),
        ...[1, 2, 3, 4].map(index => ({ id: `extra-${index}`, title: `Cả ngày ${index}`, start: '2026/10/20', allDay: true })),
      ];
      const { host, calendar, settle } = render({ option: clientOption(() => crowded) });
      const more = q<HTMLButtonElement>(host, '[data-more][data-date="2026/10/20"]');
      expect(text(more)).toBe('+1');
      more?.click();
      settle();
      expect([calendar.view(), calendar.date()]).toEqual(['day', '2026/10/20']);
      calendar.view.set('week');
      settle();
      q<HTMLButtonElement>(host, '[data-day-header][data-date="2026/10/21"] button')?.click();
      settle();
      expect([calendar.view(), calendar.date()]).toEqual(['day', '2026/10/21']);
    }));
  });

  describe('month lines', () => {
    const cell = (host: HTMLElement, day: string): HTMLElement => q(host, `[role="gridcell"][data-date="${day}"]`)!;
    const timed = (id: string, day: string, hour: number): SdCalendarEvent<CalendarDto> => ({
      id,
      title: id,
      start: `${day} ${String(hour).padStart(2, '0')}:00:00`,
      end: `${day} ${String(hour).padStart(2, '0')}:45:00`,
    });

    it('[CAL-C-14] shows three lines, or two and "+N khác", or one and "+N khác" under a holiday', fakeAsync(() => {
      const events = [
        ...[8, 9, 10, 11].map(hour => timed(`a${hour}`, '2026/10/14', hour)),
        ...[8, 9, 10].map(hour => timed(`b${hour}`, '2026/10/15', hour)),
        ...[8, 9, 10].map(hour => timed(`c${hour}`, '2026/10/16', hour)),
      ];
      const holidays = [{ date: '2026/10/15', label: 'Lễ', type: 'observance' as const }];
      const { host, calendar, settle } = render({ view: 'month', holidays, option: clientOption(() => events) });
      expect(qa(cell(host, '2026/10/14'), '[data-event-id]').length).toBe(2);
      expect(text(q(cell(host, '2026/10/14'), '[data-more]'))).toBe('+2 khác');
      expect(qa(cell(host, '2026/10/15'), '[data-event-id]').length).toBe(1);
      expect(text(q(cell(host, '2026/10/15'), '[data-more]'))).toBe('+2 khác');
      expect(text(q(cell(host, '2026/10/15'), '[data-holiday]'))).toBe('Lễ');
      expect(cell(host, '2026/10/15').getAttribute('aria-label')).toBe('Thứ Năm 15/10, Lễ, 3 sự kiện');
      expect(qa(cell(host, '2026/10/16'), '[data-event-id]').length).toBe(3);
      expect(q(cell(host, '2026/10/16'), '[data-more]')).toBeNull();
      q<HTMLButtonElement>(cell(host, '2026/10/14'), '[data-more]')?.click();
      settle();
      expect([calendar.view(), calendar.date()]).toEqual(['day', '2026/10/14']);
    }));

    it('[CAL-C-14] joins an all-day bar across days and titles only its first segment of the week', fakeAsync(() => {
      const { host } = render({ view: 'month' });
      const first = q(cell(host, '2026/10/22'), '[data-event-id="leave"]');
      const second = q(cell(host, '2026/10/23'), '[data-event-id="leave"]');
      expect(first?.hasAttribute('data-join-end')).toBeTrue();
      expect(first?.hasAttribute('data-join-start')).toBeFalse();
      expect(second?.hasAttribute('data-join-start')).toBeTrue();
      expect(text(first)).toBe('Nghỉ phép · Lan');
      expect(text(second)).toBe('');
      expect(qa(cell(host, '2026/10/22'), '[data-event-id]').map(chip => chip.dataset['eventId'])).toEqual(['leave', 'night']);
      expect(text(q(cell(host, '2026/10/22'), '[data-more]'))).toBe('+2 khác');
      expect(qa(cell(host, '2026/10/23'), '[data-event-id]').length).toBe(3);
      expect(cell(host, '2026/10/22').getAttribute('aria-label')).toBe('Thứ Năm 22/10, 4 sự kiện');
    }));
  });

  describe('agenda', () => {
    it('[CAL-C-15] keeps a day that only has a holiday', fakeAsync(() => {
      const holidays = [{ date: '2026/10/30', label: 'Nghỉ bù', type: 'off' as const }];
      const { host } = render({ view: 'agenda', holidays });
      expect(qa(host, '[data-agenda-day]').map(day => day.dataset['date'])).toEqual(['2026/10/22', '2026/10/23', '2026/10/30']);
      expect(text(q(host, '[data-agenda-day][data-date="2026/10/30"] [data-holiday]'))).toBe('Nghỉ bù');
    }));

    it('[CAL-C-15] lists only days with events and shows the empty state', fakeAsync(() => {
      const { host } = render({ view: 'agenda' });
      expect(qa(host, '[data-agenda-day]').map(day => day.dataset['date'])).toEqual(['2026/10/22', '2026/10/23']);
      expect(text(q(host, '[data-agenda-day][data-date="2026/10/22"]'))).toContain('Hẹn khách: Công ty An Phát');
      TestBed.resetTestingModule();
      const empty = render({ view: 'agenda', option: clientOption(() => []) });
      expect(text(q(empty.host, '[data-empty]'))).toBe('Không có sự kiện trong 14 ngày này.');
    }));
  });

  describe('accessibility and e2e hooks', () => {
    it('[CAL-C-19] labels blocks, navigation and the pressed view button', fakeAsync(() => {
      const { host } = render();
      expect(block(host, 'client')?.getAttribute('aria-label')).toBe('Hẹn khách: Công ty An Phát, Thứ Năm 22/10, 09:30 đến 10:30');
      expect(block(host, 'leave')?.getAttribute('aria-label')).toBe('Nghỉ phép · Lan, cả ngày, 22/10 đến 23/10');
      expect(block(host, 'client')?.getAttribute('role')).toBe('button');
      expect(action(host, 'prev').getAttribute('aria-label')).toBe('Tuần trước');
      expect(action(host, 'next').getAttribute('aria-label')).toBe('Tuần sau');
      expect(viewButtons(host).map(button => button.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false', 'false']);
      expect(text(q(host, '[data-title]'))).toBe('19 – 25 tháng 10, 2026');
      expect(q(host, '[role="group"][aria-label="Chế độ xem"]')).not.toBeNull();
      expect(q(host, '[role="region"]')?.getAttribute('aria-label')).toBe('Lịch');
    }));

    it('[CAL-SC-33] has exactly one polite, atomic status region', fakeAsync(() => {
      const { host } = render();
      const live = qa(host, '[aria-live]');
      expect(live.length).toBe(1);
      expect(live[0].getAttribute('role')).toBe('status');
      expect(live[0].getAttribute('aria-live')).toBe('polite');
      expect(live[0].getAttribute('aria-atomic')).toBe('true');
    }));

    it('[CAL-B-02] puts data-autoid only on the first segment of a multi-day event (R1-G5)', fakeAsync(() => {
      const { host, fixture, settle } = render({ view: 'month', autoId: 'team' });
      const id = 'components-calendar-team-event-leave';
      const segments = qa(host, '[data-event-id="leave"]');
      expect(segments.length).toBe(2);
      expect(qa(host, `[data-autoid="${id}"]`).length).toBe(1);
      expect(segments[0].dataset['autoid']).toBe(id);
      fixture.componentRef.setInput('view', 'agenda');
      settle();
      expect(qa(host, '[data-event-id="leave"]').length).toBe(2);
      expect(qa(host, `[data-autoid="${id}"]`).length).toBe(1);
      expect(q(host, '[data-agenda-day][data-date="2026/10/22"] [data-event-id="leave"]')?.dataset['autoid']).toBe(id);
    }));

    it('[CAL-SC-38] emits data-autoid only with autoId, with the event id URI-encoded', fakeAsync(() => {
      const odd = { id: 'a b/1', title: 'Odd', start: '2026/10/20 09:00:00', end: '2026/10/20 10:00:00' };
      const without = render({ option: clientOption(() => [odd]) });
      expect(qa(without.host, '[data-autoid^="components-calendar"]').length).toBe(0);
      TestBed.resetTestingModule();
      const { host } = render({ option: clientOption(() => [odd]), autoId: 'team' });
      const root = q(host, '[role="region"]')!;
      expect(root.dataset['autoid']).toBe('components-calendar-team');
      expect(root.dataset['from']).toBe('2026/10/19');
      expect(root.dataset['to']).toBe('2026/10/25');
      expect(q(host, '[data-autoid="components-calendar-team-event-a%20b%2F1"]')).not.toBeNull();
    }));
  });
});

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [
    SdCalendar,
    SdCalendarEventTemplateDirective,
    SdCalendarDayCellTemplateDirective,
    SdCalendarAgendaItemTemplateDirective,
    SdCalendarEmptyTemplateDirective,
  ],
  template: `
    <sd-calendar style="height: 640px; width: 960px" [option]="option()" [view]="view()" date="2026/10/22">
      <ng-template sdCalendarEventTemplate let-event let-range="range" let-view="view" let-compact="compact" let-pending="pending">
        <span class="event-probe" [attr.data-probe]="event.id + '|' + range.start + '|' + view + '|' + compact + '|' + pending">{{
          event.data?.room
        }}</span>
      </ng-template>
      <ng-template
        sdCalendarDayCellTemplate
        let-date
        let-events="events"
        let-holiday="holiday"
        let-today="today"
        let-inMonth="inMonth"
        let-off="off">
        <span
          class="cell-probe"
          [attr.data-probe]="date + '|' + events.length + '|' + (holiday?.label ?? '') + '|' + today + '|' + inMonth + '|' + off"></span>
      </ng-template>
      <ng-template sdCalendarAgendaItemTemplate let-event>
        <span class="agenda-probe">{{ event.data?.room }}</span>
      </ng-template>
      <ng-template sdCalendarEmptyTemplate let-range>
        <p class="empty-probe">{{ range.from }}–{{ range.to }}</p>
      </ng-template>
    </sd-calendar>
  `,
})
class TemplateHost {
  readonly option = signal<SdCalendarOption<CalendarDto>>(clientOption());
  readonly view = signal<SdCalendarView>('week');
}

describe('SdCalendar · templates', () => {
  afterEach(() => TestBed.resetTestingModule());

  function host(
    view: SdCalendarView,
    events: () => Events = weekEvents
  ): { element: HTMLElement; fixture: ComponentFixture<TemplateHost> } {
    configureCalendar();
    const fixture = TestBed.createComponent(TemplateHost);
    fixture.componentInstance.view.set(view);
    fixture.componentInstance.option.set(clientOption(events));
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
    return { element: fixture.nativeElement as HTMLElement, fixture };
  }

  it('[CAL-C-22] replaces the content of a block but keeps its frame, colour and role', fakeAsync(() => {
    const { element } = host('week');
    const client = q(element, '[data-event-id="client"]')!;
    expect(client.getAttribute('role')).toBe('button');
    expect(client.dataset['color']).toBe('success');
    expect(q(client, '.event-probe')?.dataset['probe']).toBe('client|2026/10/22 09:30:00|week|false|false');
    expect(text(q(client, '.event-probe'))).toBe('Cúc');
    expect(q(q(element, '[data-event-id="one-on-one"]')!, '.event-probe')?.dataset['probe']).toBe(
      'one-on-one|2026/10/22 10:00:00|week|true|false'
    );
  }));

  it('[CAL-C-22] gives the month cell template the day, its events and its flags', fakeAsync(() => {
    const { element } = host('month');
    const probe = (day: string): string | undefined => q(element, `[role="gridcell"][data-date="${day}"] .cell-probe`)?.dataset['probe'];
    expect(probe('2026/10/22')).toBe('2026/10/22|4||false|true|false');
    expect(probe('2026/10/25')).toBe('2026/10/25|0||false|true|true');
    expect(probe('2026/09/28')).toBe('2026/09/28|0||false|false|false');
  }));

  it('[CAL-C-15] shows the agenda item template as a place column from 720px wide only', fakeAsync(() => {
    const restore = FakeResizeObserver.install();
    try {
      const { element, fixture } = host('agenda');
      FakeResizeObserver.trigger(720);
      fixture.detectChanges();
      expect(qa(element, '[data-agenda-place] .agenda-probe').map(text)).toContain('Cúc');
      FakeResizeObserver.trigger(719);
      fixture.detectChanges();
      expect(qa(element, '.agenda-probe').length).toBe(0);
    } finally {
      restore();
    }
  }));

  it('[CAL-C-15] replaces the empty agenda with the empty template', fakeAsync(() => {
    const { element } = host('agenda', () => []);
    expect(text(q(element, '.empty-probe'))).toBe('2026/10/22–2026/11/04');
    expect(q(element, '[data-empty]')).toBeNull();
  }));
});
