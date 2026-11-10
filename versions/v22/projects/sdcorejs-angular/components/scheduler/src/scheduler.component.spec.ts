import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, signal } from '@angular/core';
import { TestBed, discardPeriodicTasks, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { q, qa, text } from '../../../testing/schedule-testing';
import { SdScheduler } from './scheduler.component';
import type { SdSchedulerLoadArgs, SdSchedulerResource, SdSchedulerView } from './scheduler.model';
import {
  SdSchedulerEmptyTemplateDirective,
  SdSchedulerEventTemplateDirective,
  SdSchedulerResourceTemplateDirective,
} from './scheduler.templates';
import {
  bookings,
  clientOption,
  configureScheduler,
  deferredOption,
  renderScheduler,
  rooms,
  type Events,
  type Room,
} from './scheduler.testing';

/** `fakeAsync` that drops the one-minute timer of the now line (the default date is today). */
const run = (body: () => void): (() => void) =>
  fakeAsync(() => {
    body();
    discardPeriodicTasks();
  });

const rowIds = (host: HTMLElement): string[] => qa(host, '[role="row"][data-resource-id]').map(row => row.dataset['resourceId']!);
const groupRows = (host: HTMLElement): string[] => qa(host, '[data-group]').map(row => row.dataset['group']!);
const block = (host: HTMLElement, id: string): HTMLElement | null => q(host, `[data-event-id="${id}"]`);
const viewButtons = (host: HTMLElement): HTMLButtonElement[] => qa<HTMLButtonElement>(host, '[data-view-option]');
const action = (host: HTMLElement, name: string): HTMLButtonElement => q<HTMLButtonElement>(host, `button[data-action="${name}"]`)!;
const axisDays = (host: HTMLElement): string[] => qa(host, '[data-axis-day]').map(cell => cell.dataset['date']!);
const scroller = (host: HTMLElement): HTMLElement => q(host, '[data-region="scroller"]')!;
const spyOption = (events: () => Events = bookings) => {
  const onLoad = jasmine.createSpy('onLoad').and.callFake(() => events());
  return { option: { dataSource: { onLoad } }, onLoad };
};
const lastArgs = (onLoad: jasmine.Spy): SdSchedulerLoadArgs => onLoad.calls.mostRecent().args[0] as SdSchedulerLoadArgs;
const deepFreeze = <V>(value: V): V => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) deepFreeze((value as Record<string, unknown>)[key]);
  }
  return value;
};

describe('SdScheduler · rendering and data source', () => {
  afterEach(() => TestBed.resetTestingModule());

  describe('views', () => {
    it(
      '[SCH-C-01] renders day, week and month from the view buttons',
      run(() => {
        const { host, scheduler, settle } = renderScheduler();
        const region = q(host, '[role="region"]')!;
        expect(region.dataset['view']).toBe('day');
        expect([region.dataset['from'], region.dataset['to']]).toEqual(['2026/11/09', '2026/11/09']);
        expect(qa(host, '[data-axis-hour]').length).toBe(24);
        expect(viewButtons(host).map(text)).toEqual(['Ngày', 'Tuần', 'Tháng']);
        expect(rowIds(host)).toEqual(['hall', 'hue', 'hoi-an', 'can-tho', 'da-lat']);

        viewButtons(host)[1].click();
        settle();
        expect(scheduler.view()).toBe('week');
        expect(axisDays(host)).toEqual(['2026/11/09', '2026/11/10', '2026/11/11', '2026/11/12', '2026/11/13', '2026/11/14', '2026/11/15']);
        expect(block(host, 'tuesday')).withContext('the week draws Tuesday').not.toBeNull();

        viewButtons(host)[2].click();
        settle();
        expect(axisDays(host).length).toBe(30);
        expect([region.dataset['from'], region.dataset['to']]).toEqual(['2026/11/01', '2026/11/30']);
      })
    );

    it(
      '[SCH-C-01] filters and orders the view buttons by views and falls back to the first one',
      run(() => {
        const { host } = renderScheduler({ views: ['month', 'week'], view: 'day' });
        expect(viewButtons(host).map(text)).toEqual(['Tháng', 'Tuần']);
        expect(q(host, '[role="region"]')?.dataset['view']).toBe('month');
      })
    );

    it(
      '[SCH-C-01] hides the weekend columns of a week and a month but keeps from/to',
      run(() => {
        const { host, ranges } = renderScheduler({ view: 'week', hideWeekends: true });
        expect(axisDays(host)).toEqual(['2026/11/09', '2026/11/10', '2026/11/11', '2026/11/12', '2026/11/13']);
        expect(ranges[ranges.length - 1]).toEqual({ from: '2026/11/09', to: '2026/11/15', view: 'week' });
      })
    );

    it(
      '[SCH-C-01] moves by a day, a week or a month, goes to today and opens a day from the axis',
      run(() => {
        const { host, scheduler, settle } = renderScheduler({ view: 'week' });
        action(host, 'next').click();
        settle();
        expect(scheduler.date()).toBe('2026/11/16');
        expect(text(q(host, '[data-title]'))).toContain('16');
        action(host, 'today').click();
        settle();
        expect(scheduler.date()).toBe('2026/11/09');
        q<HTMLButtonElement>(host, '[data-axis-day][data-date="2026/11/11"] button')!.click();
        settle();
        expect(scheduler.view()).toBe('day');
        expect(scheduler.date()).toBe('2026/11/11');
        action(host, 'prev').click();
        settle();
        expect(scheduler.date()).toBe('2026/11/10');
        scheduler.view.set('month');
        settle();
        action(host, 'next').click();
        settle();
        expect(scheduler.date()).toBe('2026/12/01');
      })
    );

    it(
      '[SCH-C-01] disables previous and next at minDate and maxDate',
      run(() => {
        const { host } = renderScheduler({ minDate: '2026/11/09', maxDate: '2026/11/09' });
        expect(action(host, 'prev').disabled).toBeTrue();
        expect(action(host, 'next').disabled).toBeTrue();
      })
    );
  });

  describe('data source', () => {
    it(
      '[SCH-C-02] calls onLoad with from, to, view, every resource id in order and a live signal',
      run(() => {
        const { option, onLoad } = spyOption();
        renderScheduler({ option });
        expect(onLoad).toHaveBeenCalledTimes(1);
        const args = lastArgs(onLoad);
        expect({ from: args.from, to: args.to, view: args.view }).toEqual({ from: '2026/11/09', to: '2026/11/09', view: 'day' });
        expect(args.resourceIds).toEqual(['hall', 'hue', 'hoi-an', 'can-tho', 'da-lat']);
        expect(args.signal.aborted).toBeFalse();
      })
    );

    it(
      '[SCH-C-02] loads again for a new resources array, without a range output, and not for no resources',
      run(() => {
        const { option, onLoad } = spyOption();
        const { fixture, host, ranges, settle } = renderScheduler({ option });
        expect(ranges.length).toBe(1);
        fixture.componentRef.setInput('resources', rooms().slice(0, 2));
        settle();
        expect(onLoad).toHaveBeenCalledTimes(2);
        expect(lastArgs(onLoad).resourceIds).toEqual(['hall', 'hue']);
        expect(ranges.length).withContext('the range did not change').toBe(1);
        fixture.componentRef.setInput('resources', []);
        settle();
        expect(onLoad).toHaveBeenCalledTimes(2);
        expect(text(q(host, '[data-empty] p'))).toBe('Không có tài nguyên nào');
        expect(rowIds(host)).toEqual([]);
      })
    );

    it(
      '[SCH-C-02] clears the grid until the events of new resources arrive, shows the skeleton on the first load',
      run(() => {
        const { option, pending } = deferredOption();
        const { fixture, host, settle } = renderScheduler({ option });
        expect(qa(host, '[data-skeleton]').length).withContext('three rows of skeleton').toBe(3);
        pending[0].resolve(bookings());
        settle();
        expect(qa(host, '[data-skeleton]').length).toBe(0);
        expect(block(host, 'review')).not.toBeNull();
        fixture.componentRef.setInput('resources', rooms());
        settle();
        expect(block(host, 'review')).withContext('Step 0 H7').toBeNull();
        expect(q(host, '[role="progressbar"]')).not.toBeNull();
        pending[1].resolve(bookings());
        settle();
        expect(block(host, 'review')).not.toBeNull();
      })
    );

    it(
      '[SCH-C-03] leaves out an event whose resource is unknown and warns once',
      run(() => {
        const warn = spyOn(console, 'warn');
        const events = (): Events => [
          ...bookings(),
          { id: 'ghost', title: 'Ma', resourceId: 'nowhere', start: '2026/11/09 09:00:00', end: '2026/11/09 10:00:00' },
        ];
        const { host, scheduler, settle } = renderScheduler({ option: clientOption(events) });
        expect(block(host, 'ghost')).toBeNull();
        expect(block(host, 'review')).not.toBeNull();
        scheduler.reload();
        settle();
        const ghost = warn.calls.allArgs().filter(args => String(args[0]).includes('"ghost"'));
        expect(ghost.length).toBe(1);
        expect(String(ghost[0][0])).toContain('resourceId');
      })
    );

    it(
      '[SCH-SC-22] passes a signal and takes an array or a promise',
      run(() => {
        const { host } = renderScheduler({ option: { dataSource: { onLoad: async () => bookings() } } });
        expect(block(host, 'review')).not.toBeNull();
      })
    );

    it(
      '[SCH-SC-15] aborts the load on a new range, resources, option, reload and destroy; drops a late result',
      run(() => {
        const { option, calls, pending } = deferredOption();
        const { fixture, host, scheduler, settle } = renderScheduler({ option });
        action(host, 'next').click();
        settle();
        expect(calls[0].signal.aborted).withContext('range').toBeTrue();
        fixture.componentRef.setInput('resources', rooms());
        settle();
        expect(calls[1].signal.aborted).withContext('resources').toBeTrue();
        fixture.componentRef.setInput('option', { ...option });
        settle();
        expect(calls[2].signal.aborted).withContext('option').toBeTrue();
        scheduler.reload();
        settle();
        expect(calls[3].signal.aborted).withContext('reload').toBeTrue();
        pending[0].resolve(bookings());
        settle();
        expect(block(host, 'review')).withContext('a late result is dropped').toBeNull();
        fixture.destroy();
        expect(calls[4].signal.aborted).withContext('destroy').toBeTrue();
      })
    );

    it(
      '[SCH-SC-23] keeps the events on screen while reload() runs',
      run(() => {
        const { option, pending } = deferredOption();
        const { host, scheduler, settle } = renderScheduler({ option });
        pending[0].resolve(bookings());
        settle();
        scheduler.reload();
        settle();
        expect(block(host, 'review')).not.toBeNull();
        expect(q(host, '[role="progressbar"]')).not.toBeNull();
        pending[1].resolve(bookings().filter(event => event.id !== 'review'));
        settle();
        expect(block(host, 'review')).toBeNull();
      })
    );

    it(
      '[SCH-SC-24] shows the load error with Retry and emits sdLoadError, not for an aborted load',
      run(() => {
        const { option, pending } = deferredOption();
        const { host, loadErrors, settle } = renderScheduler({ option });
        action(host, 'next').click();
        settle();
        pending[0].reject(new Error('aborted one'));
        settle();
        expect(loadErrors).withContext('aborted').toEqual([]);
        pending[1].reject(new Error('down'));
        settle();
        expect(q(host, '[data-band="load-error"]')).not.toBeNull();
        expect(loadErrors.length).toBe(1);
        expect(text(q(host, '[role="status"]'))).toBe('Không tải được lịch.');
        action(host, 'retry').click();
        settle();
        pending[2].resolve(bookings());
        settle();
        expect(q(host, '[data-band="load-error"]')).toBeNull();
      })
    );

    it(
      '[SCH-SC-16] never shows the text of a load error',
      run(() => {
        const { host, loadErrors } = renderScheduler({ option: { dataSource: { onLoad: () => Promise.reject('SECRET') } } });
        // R1 #3: the error branch ran, and still shows nothing of the error.
        expect(q(host, '[data-band="load-error"]')).withContext('the load error band').not.toBeNull();
        expect(loadErrors).toEqual(['SECRET']);
        expect(host.textContent).not.toContain('SECRET');
        expect(host.innerHTML).not.toContain('SECRET');
      })
    );
  });

  describe('resources and groups', () => {
    it(
      '[SCH-C-04] puts ungrouped resources first and each group in the order of its first resource',
      run(() => {
        const { host } = renderScheduler();
        expect(groupRows(host)).toEqual(['Tầng 3', 'Tầng 5']);
        const order = qa(host, '[data-rows] > [role="row"]').map(row => row.dataset['group'] ?? row.dataset['resourceId']);
        expect(order).toEqual(['hall', 'Tầng 3', 'hue', 'hoi-an', 'Tầng 5', 'can-tho', 'da-lat']);
        const group = q<HTMLButtonElement>(host, '[data-group="Tầng 3"] button')!;
        expect(text(group)).toContain('2 tài nguyên');
      })
    );

    it(
      '[SCH-C-04] collapses a group: its rows go, its events still load, it stays collapsed on another range',
      run(() => {
        const { option, onLoad } = spyOption();
        const { fixture, host, settle } = renderScheduler({ option });
        const toggle = (): HTMLButtonElement => q<HTMLButtonElement>(host, '[data-group="Tầng 5"] button')!;
        expect(toggle().getAttribute('aria-expanded')).toBe('true');
        toggle().click();
        settle();
        expect(toggle().getAttribute('aria-expanded')).toBe('false');
        expect(rowIds(host)).toEqual(['hall', 'hue', 'hoi-an']);
        expect(block(host, 'training')).toBeNull();
        action(host, 'next').click();
        settle();
        expect(lastArgs(onLoad).resourceIds).toContain('da-lat');
        expect(rowIds(host)).withContext('kept on another range').toEqual(['hall', 'hue', 'hoi-an']);
        fixture.componentRef.setInput(
          'resources',
          rooms().map(room => ({ ...room, group: room.group === 'Tầng 5' ? undefined : room.group }))
        );
        settle();
        fixture.componentRef.setInput('resources', rooms());
        settle();
        expect(rowIds(host)).withContext('the group was dropped, then came back expanded').toContain('da-lat');
      })
    );

    it(
      '[SCH-SC-01] refuses duplicate or empty resource ids, an empty title and duplicate event ids',
      run(() => {
        const { fixture, host, settle } = renderScheduler();
        const invalid = (): boolean => !!q(host, 'sd-data-state');
        expect(invalid()).toBeFalse();
        fixture.componentRef.setInput('resources', [...rooms(), { id: 'hue', title: 'Again' }]);
        settle();
        expect(invalid()).withContext('duplicate id').toBeTrue();
        fixture.componentRef.setInput('resources', [...rooms(), { id: 'x', title: '  ' }]);
        settle();
        expect(invalid()).withContext('empty title').toBeTrue();
        fixture.componentRef.setInput('resources', [...rooms(), { id: '', title: 'Nameless' }]);
        settle();
        expect(invalid()).withContext('empty id').toBeTrue();
        fixture.componentRef.setInput('resources', rooms());
        fixture.componentRef.setInput(
          'option',
          clientOption(() => [...bookings(), { ...bookings()[0] }])
        );
        settle();
        expect(invalid()).withContext('duplicate event id').toBeTrue();
      })
    );

    it(
      '[SCH-SC-01] leaves out an event with an unreadable date and warns once (R1 #4)',
      run(() => {
        const warn = spyOn(console, 'warn');
        const events = (): Events => [
          ...bookings(),
          { id: 'broken', title: 'Hỏng', resourceId: 'hue', start: 'not a date', end: '2026/11/09 10:00:00' },
        ];
        const { host, scheduler, settle } = renderScheduler({ option: clientOption(events) });
        expect(block(host, 'broken')).toBeNull();
        expect(q(host, 'sd-data-state')).withContext('not invalid data').toBeNull();
        scheduler.reload();
        settle();
        expect(warn.calls.allArgs().filter(args => String(args[0]).includes('"broken" has an unreadable date')).length).toBe(1);
      })
    );

    it(
      '[SCH-C-13] warns once for a step that is not a divisor of 60 and for broken working hours (R1 #4)',
      run(() => {
        const warn = spyOn(console, 'warn');
        const resources: SdSchedulerResource<Room>[] = [
          ...rooms(),
          { id: 'odd', title: 'Lệch', workingHours: { 2: [{ from: '18:00', to: '09:00' }] } },
        ];
        const { host } = renderScheduler({ step: 7, workingHours: { 1: [{ from: '08:00' } as never] }, resources });
        const messages = warn.calls.allArgs().map(args => String(args[0]));
        expect(messages.filter(message => message.includes('step 7'))).toEqual([
          '[sd-scheduler] step 7 is not one of 5, 10, 15, 20, 30, 60; 30 is used.',
        ]);
        expect(messages.filter(message => message.startsWith('[sd-scheduler] workingHours[1] has')))
          .withContext('component')
          .toHaveSize(1);
        expect(messages.filter(message => message.includes('workingHours[2] of resource "odd"')))
          .withContext('resource')
          .toHaveSize(1);
        expect(qa(host, '[data-axis-hour]').length).withContext('still renders').toBe(24);
      })
    );

    it(
      '[SCH-SC-03] renders deep-frozen resources and events',
      run(() => {
        const frozen = deepFreeze(bookings());
        const { host } = renderScheduler({ resources: deepFreeze(rooms()), option: deepFreeze(clientOption(() => frozen)) });
        expect(block(host, 'review')).not.toBeNull();
      })
    );
  });

  describe('layout', () => {
    it(
      '[SCH-U-06] stacks overlapping events in lanes and grows the row',
      run(() => {
        const { host } = renderScheduler();
        const hue = q(host, '[role="row"][data-resource-id="hue"]')!;
        expect(hue.style.height).toBe('72px');
        expect(block(host, 'standup')!.style.top).toBe('6px');
        expect(block(host, 'review')!.style.top).toBe('6px');
        expect(block(host, 'overlap')!.style.top).toBe('38px');
        expect(q(host, '[role="row"][data-resource-id="hoi-an"]')!.style.height).toBe('48px');
        expect(block(host, 'client')!.style.top).toBe('10px');
      })
    );

    it(
      '[SCH-C-13] shades the off hours of each resource, its own working hours first',
      run(() => {
        const resources: SdSchedulerResource<Room>[] = [
          ...rooms().slice(0, 2),
          { id: 'night', title: 'Ca đêm', workingHours: { 1: [{ from: '20:00', to: '24:00' }] } },
          { id: 'free', title: 'Tự do', workingHours: null },
        ];
        const { host } = renderScheduler({ resources });
        const shades = (id: string): number => qa(host, `[role="row"][data-resource-id="${id}"] [data-off-hours]`).length;
        expect(shades('hue')).withContext('00–08, 12–13, 17:30–24').toBe(3);
        expect(shades('night')).toBe(1);
        expect(shades('free')).toBe(0);
      })
    );

    it(
      '[SCH-C-13] shades days off in the week view and the whole day of an off holiday',
      run(() => {
        const { host, scheduler, settle } = renderScheduler({
          view: 'week',
          holidays: [
            { date: '2026/11/11', label: 'Nghỉ bù', type: 'off' },
            { date: '2026/11/12', label: 'Ngày Nhà giáo', type: 'observance' },
          ],
        });
        const hue = qa(host, '[role="row"][data-resource-id="hue"] [data-off-hours]');
        expect(hue.length).withContext('Wednesday, then the weekend').toBe(2);
        expect(parseFloat(hue[0].style.insetInlineStart)).toBeCloseTo((2 / 7) * 100, 2);
        expect(q(host, '[data-axis-day][data-date="2026/11/11"]')!.dataset['holiday']).toBe('off');
        scheduler.view.set('month');
        settle();
        expect(q(host, '[data-axis-day][data-date="2026/11/12"] [data-holiday-dot]')).not.toBeNull();
        scheduler.view.set('day');
        scheduler.date.set('2026/11/11');
        settle();
        expect(qa(host, '[role="row"][data-resource-id="hue"] [data-off-hours]').length).toBe(1);
      })
    );

    it(
      '[SCH-C-13] shades the days before minDate and after maxDate, as sd-calendar',
      run(() => {
        const { host, fixture, settle } = renderScheduler({ view: 'week', minDate: '2026/11/11' });
        const hue = (): HTMLElement[] => qa(host, '[role="row"][data-resource-id="hue"] [data-off-hours]');
        expect(hue().length).withContext('Monday and Tuesday, then the weekend').toBe(2);
        expect(parseFloat(hue()[0].style.insetInlineStart)).toBe(0);
        expect(parseFloat(hue()[0].style.inlineSize)).toBeCloseTo((2 / 7) * 100, 2);
        fixture.componentRef.setInput('minDate', undefined);
        fixture.componentRef.setInput('maxDate', '2026/11/12');
        settle();
        expect(hue().length).withContext('Friday to Sunday as one span').toBe(1);
        expect(parseFloat(hue()[0].style.insetInlineStart)).toBeCloseTo((4 / 7) * 100, 2);
        fixture.componentRef.setInput('view', 'day');
        fixture.componentRef.setInput('date', '2026/11/13');
        settle();
        expect(hue().length).withContext('the whole day').toBe(1);
      })
    );

    it(
      '[SCH-U-07] places day blocks on the hour axis and week blocks on the day columns',
      run(() => {
        const { host, scheduler, settle } = renderScheduler();
        const review = block(host, 'review')!;
        expect(review.style.insetInlineStart).toContain('* 9');
        expect(review.dataset['tier']).withContext('90 minutes: 117px').toBe('md');
        expect(text(review)).toBe('Review ngân sách Q4');
        const training = block(host, 'training')!;
        expect(training.dataset['tier']).toBe('lg');
        expect(text(training)).toBe('Đào tạo 13:00–17:00');
        expect(block(host, 'workshop')!.dataset['allDay']).toBe('true');
        scheduler.view.set('week');
        settle();
        const tuesday = block(host, 'tuesday')!;
        expect(parseFloat(/calc\(([\d.]+)%/.exec(tuesday.style.insetInlineStart)![1])).toBeCloseTo((1 / 7) * 100, 2);
        expect(text(tuesday)).withContext('the start time leads a wide timed block').toBe('09:00 Họp thứ Ba');
        expect(block(host, 'workshop')!.dataset['clippedEnd']).toBeUndefined();
      })
    );

    it(
      '[SCH-C-17] draws the now line on today in the day view only and moves it every minute',
      run(() => {
        const { host, scheduler, settle, setNow } = renderScheduler();
        const now = (): HTMLElement | null => q(host, '[data-now]');
        expect(now()!.style.getPropertyValue('--sd-scheduler-now-offset')).toContain(`${640 / 60}`);
        setNow('2026/11/09 11:10');
        tick(60_000);
        settle();
        expect(now()!.style.getPropertyValue('--sd-scheduler-now-offset')).toContain(`${670 / 60}`);
        scheduler.view.set('week');
        settle();
        expect(now()).toBeNull();
        scheduler.view.set('day');
        scheduler.date.set('2026/11/10');
        settle();
        expect(now()).toBeNull();
      })
    );

    it(
      '[SCH-C-17] scrolls the day view to scrollTime, then the earliest working hour',
      run(() => {
        const first = renderScheduler({ scrollTime: '10:00' });
        expect(scroller(first.host).scrollLeft).toBe(800);
        TestBed.resetTestingModule();
        const second = renderScheduler();
        expect(scroller(second.host).scrollLeft).toBe(640);
      })
    );
  });

  describe('a11y and hooks', () => {
    it(
      '[SCH-C-16] names rows and blocks: rowheader, group aria-expanded, the resource in the block label',
      run(() => {
        const { host } = renderScheduler();
        const header = q(host, '[role="row"][data-resource-id="hue"] [role="rowheader"]')!;
        expect(text(header)).toContain('Phòng Huế');
        const review = block(host, 'review')!;
        expect(review.getAttribute('aria-label')).toBe('Review ngân sách Q4, Phòng Huế, Thứ Hai 09/11, 09:00 đến 10:30');
        expect(review.getAttribute('aria-describedby')!.split(' ')).toContain(header.id);
        expect(block(host, 'workshop')!.getAttribute('aria-label')).toBe('Hội thảo, Hội trường, cả ngày, 09/11 đến 10/11');
        expect(q(host, '[data-group="Tầng 3"] button')!.getAttribute('aria-label')).toBe('Tầng 3, 2 tài nguyên');
      })
    );

    it(
      '[SCH-SC-33] has exactly one polite live region',
      run(() => {
        const { host } = renderScheduler();
        expect(qa(host, '[aria-live="polite"]').length).toBe(1);
      })
    );

    it(
      '[SCH-SC-38] writes data-autoid only with autoId, ids encoded',
      run(() => {
        const plain = renderScheduler();
        expect(qa(plain.host, '[data-autoid^="components-scheduler"]').length).toBe(0);
        TestBed.resetTestingModule();
        const resources: SdSchedulerResource<Room>[] = [{ id: 'p/1 a', title: 'Phòng 1' }];
        const events = (): Events => [
          { id: 'e 1', title: 'E', resourceId: 'p/1 a', start: '2026/11/09 09:00:00', end: '2026/11/09 10:00:00' },
        ];
        const { host } = renderScheduler({ autoId: 'rooms', resources, option: clientOption(events) });
        expect(q(host, '[role="region"]')!.dataset['autoid']).toBe('components-scheduler-rooms');
        expect(q(host, `[data-autoid="components-scheduler-rooms-resource-${encodeURIComponent('p/1 a')}"]`)).not.toBeNull();
        expect(q(host, `[data-autoid="components-scheduler-rooms-event-${encodeURIComponent('e 1')}"]`)).not.toBeNull();
        expect(q(host, '[data-autoid="components-scheduler-rooms-today"]')).not.toBeNull();
      })
    );
  });

  describe('templates', () => {
    @Component({
      changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
      standalone: true,
      imports: [SdScheduler, SdSchedulerEventTemplateDirective, SdSchedulerResourceTemplateDirective, SdSchedulerEmptyTemplateDirective],
      template: `
        <sd-scheduler [option]="option" [resources]="resources()" date="2026/11/09" [view]="view">
          <ng-template sdSchedulerResourceTemplate let-resource let-group="group" let-compact="compact">
            <span data-resource-template>{{ resource.title }}|{{ group }}|{{ compact }}|{{ resource.data?.seats }}</span>
          </ng-template>
          <ng-template sdSchedulerEventTemplate let-event let-resource="resource" let-range="range" let-view="view">
            <span data-event-template
              >{{ event.title }}|{{ resource.title }}|{{ range.resourceId }}|{{ view }}|{{ event.data?.people }}</span
            >
          </ng-template>
          <ng-template sdSchedulerEmptyTemplate let-range>
            <span data-empty-template>{{ range.from }}–{{ range.to }}</span>
          </ng-template>
        </sd-scheduler>
      `,
    })
    class TemplateHost {
      readonly option = clientOption();
      readonly resources = signal<readonly SdSchedulerResource<Room>[]>(rooms());
      view: SdSchedulerView = 'day';
    }

    it(
      '[SCH-C-12] gives the resource, event and empty templates their context',
      run(() => {
        configureScheduler();
        const fixture = TestBed.createComponent(TemplateHost);
        fixture.detectChanges();
        flushMicrotasks();
        fixture.detectChanges();
        const host = fixture.nativeElement as HTMLElement;
        expect(qa(host, '[data-resource-template]').map(text)).toContain('Phòng Huế|Tầng 3|false|8');
        expect(qa(host, '[data-resource-template]').map(text)).toContain('Hội trường||false|120');
        expect(text(q(host, '[data-event-id="review"] [data-event-template]'))).toBe('Review ngân sách Q4|Phòng Huế|hue|day|6');
        fixture.componentInstance.resources.set([]);
        fixture.detectChanges();
        expect(text(q(host, '[data-empty-template]'))).toBe('2026/11/09–2026/11/09');
      })
    );
  });
});
