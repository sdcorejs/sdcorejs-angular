import { CdkDrag } from '@angular/cdk/drag-drop';
import { TestBed, fakeAsync, flushMicrotasks, tick, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { findCssRule } from '../../../testing';
import { FakeResizeObserver, centerOf, pointer, touch } from '../../../testing/schedule-testing';
import { SdCalendar } from './calendar.component';
import type { SdCalendarLoadArgs, SdCalendarVisibleRange } from './calendar.model';
import { configureCalendar, createWith, q, qa, text, weekEvents, type CalendarDto } from './calendar.testing';

interface Mounted {
  readonly fixture: ComponentFixture<SdCalendar<CalendarDto>>;
  readonly calendar: SdCalendar<CalendarDto>;
  readonly host: HTMLElement;
  readonly onLoad: jasmine.Spy;
  readonly onMove: jasmine.Spy;
  readonly ranges: SdCalendarVisibleRange[];
  settle(): void;
}

function mount(inputs: Record<string, unknown> = {}, width = '960px'): Mounted {
  configureCalendar();
  const onLoad = jasmine.createSpy('onLoad').and.callFake(() => weekEvents());
  const onMove = jasmine.createSpy('onMove').and.returnValue('cancel');
  const fixture = createWith(SdCalendar<CalendarDto>, {
    option: { dataSource: { onLoad }, move: { onMove } },
    date: '2026/10/22',
    ...inputs,
  });
  const host = fixture.nativeElement as HTMLElement;
  host.style.height = '640px';
  host.style.width = width;
  const ranges: SdCalendarVisibleRange[] = [];
  fixture.componentInstance.sdRangeChange.subscribe(range => ranges.push(range));
  const settle = (): void => {
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
  };
  settle();
  return { fixture, calendar: fixture.componentInstance, host, onLoad, onMove, ranges, settle };
}

const root = (host: HTMLElement): HTMLElement | null => q(host, '[role="region"]');

describe('SdCalendar · compact, touch and print', () => {
  let restore: () => void = () => undefined;
  beforeEach(() => (restore = FakeResizeObserver.install()));
  afterEach(() => {
    restore();
    TestBed.resetTestingModule();
  });

  it('[CAL-SC-32] turns compact under 600px of host width and back from 600px', fakeAsync(() => {
    const { host, settle } = mount();
    FakeResizeObserver.trigger(599);
    settle();
    expect(root(host)?.hasAttribute('data-compact')).toBeTrue();
    FakeResizeObserver.trigger(600);
    settle();
    expect(root(host)?.hasAttribute('data-compact')).toBeFalse();
  }));

  it('[CAL-SC-32] runs without ResizeObserver and never turns compact', fakeAsync(() => {
    restore();
    restore = FakeResizeObserver.install(null);
    const { host } = mount({}, '400px');
    expect(root(host)?.hasAttribute('data-compact')).toBeFalse();
    expect(qa(host, '[data-day-column]').length).toBe(7);
  }));

  it('[CAL-B-03] measures a narrow host before the first load: one onLoad and one sdRangeChange (R1-N1)', fakeAsync(() => {
    const { onLoad, ranges } = mount({}, '400px');
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect((onLoad.calls.mostRecent().args[0] as SdCalendarLoadArgs).view).toBe('day');
    expect(ranges).toEqual([{ from: '2026/10/22', to: '2026/10/22', view: 'day' }]);
  }));

  it('[CAL-C-18] shows the week as a day with a 7-day strip, three view buttons and the month title', fakeAsync(() => {
    const { host, calendar, settle } = mount({}, '390px');
    expect(qa(host, '[data-day-column]').map(column => column.dataset['date'])).toEqual(['2026/10/22']);
    expect(calendar.view()).toBe('week');
    const strip = qa<HTMLButtonElement>(host, '[data-day-strip] button');
    expect(strip.length).toBe(7);
    expect(strip.find(button => button.getAttribute('aria-current') === 'date')?.dataset['date']).toBe('2026/10/22');
    expect(q(host, '[data-day-strip] button[data-date="2026/10/23"] [data-dot]')).not.toBeNull();
    expect(q(host, '[data-day-strip] button[data-date="2026/10/24"] [data-dot]')).toBeNull();
    expect(qa(host, '[data-view-option]').map(text)).toEqual(['Tháng', 'Ngày', 'Danh sách']);
    expect(text(q(host, '[data-title]'))).toBe('Tháng 10, 2026');
    strip[4].click();
    settle();
    expect(calendar.date()).toBe('2026/10/23');
  }));

  it('[CAL-B-12] marks "Ngày" pressed when a narrow week is drawn as a day (§12, §15, R2 A-24)', fakeAsync(() => {
    const { host, calendar } = mount({}, '390px');
    expect(calendar.view()).toBe('week');
    const pressed = qa(host, '[data-view-option]').filter(button => button.getAttribute('aria-pressed') === 'true');
    expect(pressed.map(button => button.dataset['viewOption'])).toEqual(['day']);
  }));

  it('[CAL-B-13] puts the title first on the first row of the narrow toolbar (§12, R2 A-20)', fakeAsync(() => {
    const { host } = mount({}, '390px');
    const title = (q(host, '[data-title]') ?? host).getBoundingClientRect();
    const today = (q(host, 'button[data-action="today"]') ?? host).getBoundingClientRect();
    expect(title.left).toBeLessThan(today.left);
    expect(Math.abs(title.top + title.height / 2 - (today.top + today.height / 2))).toBeLessThan(today.height / 2);
  }));

  it('[CAL-C-18] starts a touch drag only after a 400ms hold', fakeAsync(() => {
    const { fixture, host, settle } = mount({}, '390px');
    const drag = fixture.debugElement.query(By.css('[data-event-id="client"]')).injector.get(CdkDrag);
    expect(drag.dragStartDelay).toEqual({ touch: 400, mouse: 0 });
    const block = q(host, '[data-event-id="client"]') ?? host;
    const from = centerOf(block);
    const to = { x: from.x, y: from.y + 60 };
    touch(block, 'touchstart', from);
    tick(399);
    touch(document, 'touchmove', { x: from.x, y: from.y + 10 }, block);
    touch(document, 'touchmove', to, block);
    settle();
    expect(q(host, '[data-drag-proposal]')).toBeNull();
    touch(document, 'touchend', to, block);
    settle();
    touch(block, 'touchstart', from);
    tick(400);
    touch(document, 'touchmove', { x: from.x, y: from.y + 10 }, block);
    touch(document, 'touchmove', to, block);
    touch(document, 'touchmove', to, block);
    settle();
    expect(q(host, '[data-drag-proposal]')).not.toBeNull();
    touch(document, 'touchend', to, block);
    settle();
  }));

  it('[CAL-B-06] removes the document Esc listener after a swipe, a cancelled press and on destroy (R2 A-05, A-17)', fakeAsync(() => {
    const added = spyOn(document, 'addEventListener').and.callThrough();
    const removed = spyOn(document, 'removeEventListener').and.callThrough();
    const escListeners = (spy: jasmine.Spy): unknown[] =>
      spy.calls
        .allArgs()
        .filter(([type, , capture]) => type === 'keydown' && capture === true)
        .map(([, listener]) => listener as unknown);
    const leaked = (): unknown[] => {
      const gone = escListeners(removed);
      return escListeners(added).filter(listener => !gone.includes(listener));
    };
    const { fixture, host, settle } = mount({}, '390px');
    const grid = q(host, '[data-day-column]') ?? host;
    const from = centerOf(grid);
    pointer(grid, 'pointerdown', from, 'touch');
    pointer(grid, 'pointermove', { x: from.x - 80, y: from.y + 5 }, 'touch');
    pointer(grid, 'pointerup', { x: from.x - 80, y: from.y + 5 }, 'touch');
    settle();
    expect(escListeners(added).length).withContext('swipe adds the listener').toBeGreaterThan(0);
    expect(leaked()).withContext('swipe').toEqual([]);
    const column = q(host, '[data-day-column]') ?? host;
    pointer(column, 'pointerdown', centerOf(column), 'mouse');
    pointer(column, 'pointercancel', centerOf(column), 'mouse');
    settle();
    expect(leaked()).withContext('pointercancel').toEqual([]);
    pointer(column, 'pointerdown', centerOf(column), 'mouse');
    fixture.destroy();
    expect(leaked()).withContext('destroy').toEqual([]);
    expect(FakeResizeObserver.instances.length).toBeGreaterThan(0);
    expect(FakeResizeObserver.instances.every(observer => observer.disconnected)).withContext('ResizeObserver').toBeTrue();
  }));

  it('[CAL-C-18] swipes the day grid and the strip by at least 60px to change day and week', fakeAsync(() => {
    const { host, calendar, settle } = mount({}, '390px');
    // The day column covers the whole grid; a finger always lands on it (or on a block inside it).
    const grid = (): HTMLElement => q(host, '[data-day-column]') ?? host;
    const swipe = (target: HTMLElement, dx: number): void => {
      const from = centerOf(target);
      pointer(target, 'pointerdown', from, 'touch');
      pointer(target, 'pointermove', { x: from.x + dx, y: from.y + 5 }, 'touch');
      pointer(target, 'pointerup', { x: from.x + dx, y: from.y + 5 }, 'touch');
      settle();
    };
    swipe(grid(), -80);
    expect(calendar.date()).toBe('2026/10/23');
    swipe(grid(), 50);
    expect(calendar.date()).toBe('2026/10/23');
    swipe(grid(), 80);
    expect(calendar.date()).toBe('2026/10/22');
    swipe(q(host, '[data-day-strip]') ?? host, -80);
    expect(calendar.date()).toBe('2026/10/29');
  }));

  it('[CAL-C-18] draws month cells with up to three colour dots and no chips', fakeAsync(() => {
    const { host } = mount({ view: 'month' }, '390px');
    const cell = q(host, '[role="gridcell"][data-date="2026/10/22"]') ?? host;
    expect(qa(cell, '[data-event-id]').length).toBe(0);
    expect(qa(cell, '[data-dot]').length).toBe(3);
    expect(q(cell, '[data-holiday]')).toBeNull();
  }));

  it('[CAL-SC-34] stops motion under prefers-reduced-motion', fakeAsync(() => {
    mount();
    expect(findCssRule(/sd-calendar__sync/, /prefers-reduced-motion/)?.getPropertyValue('animation-name')).toBe('none');
    expect(findCssRule(/sd-calendar__progress-bar/, /prefers-reduced-motion/)).toBeUndefined();
    expect(findCssRule(/sd-calendar__event/, /prefers-reduced-motion/)?.getPropertyValue('transition-property')).toBe('none');
  }));

  it('[CAL-SC-35] uses CanvasText frames and Highlight for selected, pending and now under forced-colors', fakeAsync(() => {
    mount();
    expect(
      findCssRule(/sd-calendar__event/, /forced-colors/)
        ?.getPropertyValue('border-color')
        .toLowerCase()
    ).toBe('canvastext');
    expect(
      findCssRule(/data-selected/, /forced-colors/)
        ?.getPropertyValue('border-color')
        .toLowerCase()
    ).toBe('highlight');
    expect(
      findCssRule(/data-pending/, /forced-colors/)
        ?.getPropertyValue('border-color')
        .toLowerCase()
    ).toBe('highlight');
    expect(
      findCssRule(/sd-calendar__now/, /forced-colors/)
        ?.getPropertyValue('background-color')
        .toLowerCase()
    ).toBe('highlight');
  }));

  it('[CAL-C-18] prints the view without navigation and only the working hours', fakeAsync(() => {
    const { host } = mount();
    expect(findCssRule(/sd-calendar__nav/, /print/)?.getPropertyValue('display')).toBe('none');
    expect(findCssRule(/sd-calendar__views/, /print/)?.getPropertyValue('display')).toBe('none');
    expect(findCssRule(/sd-calendar__scroller/, /print/)?.getPropertyValue('overflow')).toBe('visible');
    expect(findCssRule(/sd-calendar__event/, /print/)?.getPropertyValue('break-inside')).toBe('avoid');
    const scroller = q(host, '[data-region="scroller"]');
    expect(scroller?.style.getPropertyValue('--sd-calendar-print-start')).toBe('8');
    expect(scroller?.style.getPropertyValue('--sd-calendar-print-hours')).toBe('9.5');
  }));
});
