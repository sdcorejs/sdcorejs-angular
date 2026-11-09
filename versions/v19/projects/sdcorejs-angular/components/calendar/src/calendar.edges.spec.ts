import { TestBed, fakeAsync, flushMicrotasks, tick, type ComponentFixture } from '@angular/core/testing';
import { findCssRule } from '../../../testing';
import { centerOf, mouse, mouseDrag, pointer, press } from '../../../testing/schedule-testing';
import { SdCalendar } from './calendar.component';
import type { SdCalendarEvent, SdCalendarMoveRequest, SdCalendarOption } from './calendar.model';
import { configureCalendar, createWith, q, text, weekEvents, type CalendarDto } from './calendar.testing';

type Event = SdCalendarEvent<CalendarDto>;

interface Mounted {
  readonly fixture: ComponentFixture<SdCalendar<CalendarDto>>;
  readonly calendar: SdCalendar<CalendarDto>;
  readonly host: HTMLElement;
  settle(): void;
}

function mount(
  option: Partial<SdCalendarOption<CalendarDto>>,
  inputs: Record<string, unknown> = {},
  events: () => Event[] = weekEvents
): Mounted {
  configureCalendar();
  const fixture = createWith(SdCalendar<CalendarDto>, {
    option: { dataSource: { onLoad: events }, ...option },
    date: '2026/10/22',
    ...inputs,
  });
  const host = fixture.nativeElement as HTMLElement;
  host.style.height = '640px';
  host.style.width = '960px';
  const settle = (): void => {
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
  };
  settle();
  return { fixture, calendar: fixture.componentInstance, host, settle };
}

const block = (host: HTMLElement, id: string): HTMLElement => q(host, `[data-event-id="${id}"]`) ?? host;
const column = (host: HTMLElement, day: string): HTMLElement => q(host, `[data-day-column][data-date="${day}"]`) ?? host;
const live = (host: HTMLElement): string => text(q(host, '[role="status"]'));
const at = (host: HTMLElement, day: string, minutes: number): { x: number; y: number } => {
  const rect = column(host, day).getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + (minutes / 60) * 48 + 2 };
};

describe('SdCalendar · edge cases', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('[CAL-C-08] cancels a sweep with Esc and with pointercancel', fakeAsync(() => {
    const onCreate = jasmine.createSpy('onCreate');
    const { host, settle } = mount({ create: { onCreate } });
    const target = column(host, '2026/10/21');
    pointer(target, 'pointerdown', at(host, '2026/10/21', 600));
    pointer(target, 'pointermove', at(host, '2026/10/21', 700));
    settle();
    expect(q(host, '[data-create-ghost]')).not.toBeNull();
    press(document, 'Escape');
    settle();
    expect(q(host, '[data-create-ghost]')).toBeNull();
    pointer(target, 'pointerup', at(host, '2026/10/21', 700));
    pointer(target, 'pointerdown', at(host, '2026/10/21', 600));
    pointer(target, 'pointermove', at(host, '2026/10/21', 700));
    pointer(target, 'pointercancel', at(host, '2026/10/21', 700));
    settle();
    expect(q(host, '[data-create-ghost]')).toBeNull();
    expect(onCreate).not.toHaveBeenCalled();
  }));

  it('[CAL-C-08] announces out-of-range for Enter on a slot before minDate', fakeAsync(() => {
    const onCreate = jasmine.createSpy('onCreate');
    const { host, settle } = mount({ create: { onCreate } }, { minDate: '2026/10/23' });
    const grid = q(host, '[data-region="time-grid"]') ?? host;
    grid.focus();
    press(grid, 'Enter');
    settle();
    expect(onCreate).not.toHaveBeenCalled();
    expect(live(host)).toBe('Ngoài khoảng cho phép.');
  }));

  it('[CAL-C-11] cancels a resize with Esc', fakeAsync(() => {
    const onMove = jasmine.createSpy('onMove');
    const { host, settle } = mount({ move: { onMove } });
    const handle = q(block(host, 'review'), '[data-resize-handle]') ?? host;
    const start = centerOf(handle);
    pointer(handle, 'pointerdown', start);
    pointer(handle, 'pointermove', { x: start.x, y: start.y + 48 });
    settle();
    press(document, 'Escape');
    pointer(handle, 'pointerup', { x: start.x, y: start.y + 48 });
    settle();
    expect(onMove).not.toHaveBeenCalled();
  }));

  it('[CAL-C-10] auto-scrolls near the bottom edge while dragging and ignores the click after a drop', fakeAsync(() => {
    const onMove = jasmine.createSpy('onMove').and.returnValue('cancel');
    const onSelect = jasmine.createSpy('sdSelect');
    const { host, calendar, settle } = mount({ move: { onMove } });
    calendar.sdSelect.subscribe(onSelect);
    const scroller = q(host, '[data-region="scroller"]') ?? host;
    const before = scroller.scrollTop;
    const bottom = scroller.getBoundingClientRect().bottom - 5;
    const review = block(host, 'review');
    const from = { x: centerOf(review).x, y: review.getBoundingClientRect().top + 5 };
    mouseDrag(review, { x: from.x, y: bottom }, { from, step: settle, release: false });
    tick(16);
    tick(16);
    settle();
    expect(scroller.scrollTop).toBeGreaterThan(before);
    mouse(document, 'mouseup', { x: from.x, y: bottom });
    settle();
    mouse(review, 'click', from);
    settle();
    expect(onSelect).not.toHaveBeenCalled();
    tick(16);
  }));

  it('[CAL-C-12] refuses a keyboard move outside maxDate with out-of-range', fakeAsync(() => {
    const onMove = jasmine.createSpy('onMove');
    const { host, settle } = mount({ move: { onMove } }, { maxDate: '2026/10/21' });
    press(block(host, 'review'), 'ArrowRight', { alt: true });
    settle();
    expect(onMove).not.toHaveBeenCalled();
    expect(live(host)).toBe('Ngoài khoảng cho phép.');
    press(block(host, 'leave'), 'ArrowUp', { alt: true });
    settle();
    expect(onMove).not.toHaveBeenCalled();
  }));

  it('[CAL-SC-06] checks movable once more after the scope question', fakeAsync(() => {
    let allow = true;
    const onMove = jasmine.createSpy('onMove');
    const events = (): Event[] =>
      weekEvents().map(event => (event.id === 'review' ? { ...event, occurrence: { seriesId: 's', originalStart: event.start } } : event));
    const { host, settle } = mount({ move: { onMove, movable: () => allow } }, {}, events);
    press(block(host, 'review'), 'ArrowDown', { alt: true });
    settle();
    allow = false;
    q<HTMLButtonElement>(host, '[data-scope="this"]')?.click();
    settle();
    expect(onMove).not.toHaveBeenCalled();
  }));

  it('[CAL-SC-17] reads move() targets: all-day without end, timed without end, ending at 24:00, unreadable start', fakeAsync(() => {
    const onMove = jasmine.createSpy('onMove').and.returnValue('cancel');
    const { calendar, settle } = mount({ move: { onMove } }, { maxDate: '2026/10/25' });
    const run = (id: string, to: Parameters<SdCalendar['move']>[1]): SdCalendarMoveRequest['to'] | null => {
      const count = onMove.calls.count();
      void calendar.move(id, to);
      settle();
      return onMove.calls.count() > count ? (onMove.calls.mostRecent().args[0] as SdCalendarMoveRequest).to : null;
    };
    expect(run('leave', { start: '2026/10/24' })).toEqual({ start: '2026/10/24', end: '2026/10/25', allDay: true });
    expect(run('leave', { start: '2026/10/25', end: '2026/10/24' })).toBeNull();
    expect(run('review', { start: '2026/10/20 23:00:00' })).toEqual({
      start: '2026/10/20 23:00:00',
      end: '2026/10/21 00:30:00',
      allDay: false,
    });
    expect(run('review', { start: '2026/10/25 22:30:00', end: '2026/10/26 00:00:00' })).toEqual({
      start: '2026/10/25 22:30:00',
      end: '2026/10/26 00:00:00',
      allDay: false,
    });
    expect(run('review', { start: 'nope' })).toBeNull();
    expect(run('review', { start: 'nope', allDay: true })).toBeNull();
    expect(run('review', { start: '2026/10/21 10:00:00', end: 'nope' })).toBeNull();
  }));

  it('[CAL-C-19] clamps the cursor, crosses to the previous range and ignores other keys', fakeAsync(() => {
    const { host, calendar, settle } = mount({}, { date: '2026/10/19', scrollTime: '00:00' });
    const grid = q(host, '[data-region="time-grid"]') ?? host;
    grid.focus();
    settle();
    const label = (): string | null =>
      q(host, `#${grid.getAttribute('aria-activedescendant') ?? 'none'}`)?.getAttribute('aria-label') ?? null;
    press(grid, 'x');
    settle();
    expect(label()).toBe('Thứ Hai 19/10, 08:00');
    for (let index = 0; index < 20; index++) press(grid, 'ArrowUp');
    settle();
    expect(label()).toBe('Thứ Hai 19/10, 00:00');
    press(grid, 'ArrowLeft');
    settle();
    expect(calendar.date()).toBe('2026/10/12');
    expect(label()).toBe('Chủ Nhật 18/10, 00:00');
    press(grid, 'PageUp');
    settle();
    expect(label()).toBe('Chủ Nhật 11/10, 00:00');
  }));

  it('[CAL-B-04] does not select text while sweeping or dragging in the grid (E2E screenshot)', fakeAsync(() => {
    mount({});
    expect(findCssRule(/sd-calendar__columns/)?.getPropertyValue('user-select')).toBe('none');
    expect(findCssRule(/sd-calendar__all-day-grid/)?.getPropertyValue('user-select')).toBe('none');
  }));

  it('[CAL-B-11] lays blocks and chevrons out from the inline start in right-to-left (R2 A-16)', fakeAsync(() => {
    const { host, settle } = mount({});
    const gaps = (): { start: number; end: number } => {
      const day = column(host, '2026/10/21').getBoundingClientRect();
      const review = block(host, 'review').getBoundingClientRect();
      return { start: Math.round(review.left - day.left), end: Math.round(day.right - review.right) };
    };
    const ltr = gaps();
    host.setAttribute('dir', 'rtl');
    settle();
    // The inline start is the right edge: the gaps of left-to-right are mirrored, the reserve is on the left.
    expect(gaps()).toEqual({ start: ltr.end, end: ltr.start });
    expect(ltr.end).toBeGreaterThan(ltr.start);
    expect(getComputedStyle(q(host, 'button[data-action="prev"] sd-icon') ?? host).transform).not.toBe('none');
  }));

  it('[CAL-B-14] shows the not-allowed cursor while a sweep is refused by creatable (§9.2, R2 A-19)', fakeAsync(() => {
    const onCreate = jasmine.createSpy('onCreate');
    const { host, settle } = mount({ create: { onCreate, creatable: () => false } });
    const target = column(host, '2026/10/21');
    expect(getComputedStyle(target).cursor).toBe('cell');
    pointer(target, 'pointerdown', at(host, '2026/10/21', 600));
    pointer(target, 'pointermove', at(host, '2026/10/21', 700));
    settle();
    expect(q(host, '[data-create-ghost][data-blocked]')).not.toBeNull();
    expect(getComputedStyle(target).cursor).toBe('not-allowed');
    pointer(target, 'pointerup', at(host, '2026/10/21', 700));
    settle();
    expect(getComputedStyle(target).cursor).toBe('cell');
    expect(onCreate).not.toHaveBeenCalled();
  }));

  it('[CAL-C-20] warns once for a working-hours range it has to ignore', fakeAsync(() => {
    const warn = spyOn(console, 'warn');
    mount({}, { workingHours: { 1: [{ from: '17:00', to: '08:00' }], 2: [{ from: '08:00', to: '17:00' }] } });
    expect(warn.calls.allArgs().filter(args => String(args[0]).includes('workingHours[1]')).length).toBe(1);
    expect(warn.calls.allArgs().some(args => String(args[0]).includes('workingHours[2]'))).toBeFalse();
  }));
});
