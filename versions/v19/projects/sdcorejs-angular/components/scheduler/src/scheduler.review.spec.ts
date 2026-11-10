import { TestBed, discardPeriodicTasks, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { findCssRule } from '../../../testing';
import { FakeResizeObserver, centerOf, deferred, mouse, mouseDrag, press, q, qa, text } from '../../../testing/schedule-testing';
import type { SdSchedulerEvent, SdSchedulerOption } from './scheduler.model';
import { bookings, clientOption, renderScheduler, type Booking, type Events, type Room } from './scheduler.testing';
import { sdSchedulerLanes } from './scheduler.utils';

// Regression tests of the fixes after the independent review R2 (reviews/scheduler-R2-*.md).

const run = (body: () => void): (() => void) =>
  fakeAsync(() => {
    body();
    discardPeriodicTasks();
  });

const block = (host: HTMLElement, id: string): HTMLElement | null => q(host, `[data-event-id="${id}"]`);
const status = (host: HTMLElement): string => text(q(host, '[role="status"]'));
const recurring = (): Events =>
  bookings().map(event =>
    event.id === 'client' ? { ...event, occurrence: { seriesId: 'weekly', originalStart: '2026/11/09 10:00:00' } } : event
  );

describe('SdScheduler · R2 fixes (tests)', () => {
  afterEach(() => TestBed.resetTestingModule());

  for (const flag of ['movable', 'droppable'] as const) {
    it(
      `[SCH-B-40] [SCH-SC-06] evaluates ${flag} again after the scope bar answers, right before onMove`,
      run(() => {
        let allowed = true;
        const onMove = jasmine.createSpy('onMove').and.returnValue(true);
        const move: NonNullable<SdSchedulerOption<Booking, Room>['move']> =
          flag === 'movable' ? { onMove, movable: () => allowed } : { onMove, droppable: () => allowed };
        const { host, settle } = renderScheduler({ option: { dataSource: { onLoad: () => recurring() }, move } });
        block(host, 'client')!.focus();
        press(block(host, 'client')!, 'ArrowDown', { alt: true });
        settle();
        expect(q(host, '[role="alertdialog"]')).withContext('the scope bar').not.toBeNull();
        allowed = false;
        q<HTMLButtonElement>(host, '[data-scope="this"]')!.click();
        settle();
        expect(onMove).not.toHaveBeenCalled();
        expect(block(host, 'client')!.dataset['resourceId']).toBe('hoi-an');
        expect(block(host, 'client')!.hasAttribute('data-pending')).toBeFalse();
      })
    );
  }

  it(
    '[SCH-B-41] [SCH-SC-17] refuses move() and Alt + arrows while readonly, disabled, loading or after a load error',
    run(() => {
      const onMove = jasmine.createSpy('onMove').and.returnValue(true);
      let answer: () => Events | Promise<Events> = bookings;
      const option: SdSchedulerOption<Booking, Room> = { dataSource: { onLoad: () => answer() }, move: { onMove } };
      const { fixture, host, scheduler, settle } = renderScheduler({ option });
      const results: boolean[] = [];
      const attempt = (): void => {
        void scheduler.move('client', { start: '2026/11/09 14:00:00' }).then(value => results.push(value));
        settle();
        const element = block(host, 'client');
        if (element) press(element, 'ArrowRight', { alt: true });
        settle();
      };
      for (const input of ['readonly', 'disabled'] as const) {
        fixture.componentRef.setInput(input, true);
        settle();
        attempt();
        fixture.componentRef.setInput(input, false);
        settle();
      }
      const wait = deferred<Events>();
      answer = () => wait.promise;
      scheduler.reload();
      settle();
      attempt();
      wait.resolve(bookings());
      settle();
      answer = () => Promise.reject(new Error('down'));
      scheduler.reload();
      settle();
      expect(q(host, '[data-band="load-error"]')).withContext('the load failed').not.toBeNull();
      attempt();
      expect(results).toEqual([false, false, false, false]);
      expect(onMove).not.toHaveBeenCalled();
    })
  );

  it(
    '[SCH-B-42] [SCH-C-07] remembers droppable per resource and slot, not per resource, during one drag',
    run(() => {
      const droppable = jasmine
        .createSpy('droppable')
        .and.callFake(
          ({ to }: { to: { resourceId: string; start: unknown } }) => to.resourceId !== 'hue' || String(to.start) < '2026/11/09 11:00:00'
        );
      const { host, fixture, settle } = renderScheduler({ option: { ...clientOption(), move: { droppable, onMove: () => true } } });
      const hue = (): string | undefined => q(host, '[role="row"][data-resource-id="hue"]')!.dataset['drop'];
      const source = block(host, 'client')!;
      const from = centerOf(source);
      const row = q(host, '[data-track][data-resource-id="hue"]')!.getBoundingClientRect();
      const y = row.top + row.height / 2;
      mouse(source, 'mousedown', from);
      mouse(document, 'mousemove', { x: from.x, y: from.y + 3 });
      // why: the move that crosses the threshold only starts the drag; CDK reports positions from the next one on.
      mouse(document, 'mousemove', { x: from.x, y });
      mouse(document, 'mousemove', { x: from.x, y });
      fixture.detectChanges();
      expect(hue()).withContext('Phòng Huế at 10:00').toBe('ok');
      mouse(document, 'mousemove', { x: from.x + 80, y });
      fixture.detectChanges();
      expect(hue()).withContext('Phòng Huế at 11:00').toBe('blocked');
      mouse(document, 'mousemove', { x: from.x, y });
      fixture.detectChanges();
      expect(hue()).withContext('back at 10:00').toBe('ok');
      const calls = droppable.calls.count();
      mouse(document, 'mousemove', { x: from.x + 80, y });
      fixture.detectChanges();
      expect(droppable.calls.count()).withContext('11:00 is remembered').toBe(calls);
      mouse(document, 'mouseup', { x: from.x + 80, y });
      settle();
    })
  );

  it(
    '[SCH-B-43] [SCH-SC-32] renders without ResizeObserver: no error, the wide layout',
    run(() => {
      const restore = FakeResizeObserver.install(null);
      try {
        const { host } = renderScheduler({}, {}, { width: 390, height: 640 });
        expect(q(host, '[role="region"]')!.hasAttribute('data-compact')).toBeFalse();
        expect(qa(host, '[role="row"][data-resource-id]').length).toBe(5);
      } finally {
        restore();
      }
    })
  );

  for (const [label, change] of [
    ['an empty id', { id: '' }],
    ['an empty title', { title: '  ' }],
  ] as const) {
    it(
      `[SCH-B-44] [SCH-SC-01] shows the invalid data state for an event with ${label}`,
      run(() => {
        const events = bookings().map(event => (event.id === 'client' ? { ...event, ...change } : event));
        const { host } = renderScheduler({ option: clientOption(() => events) });
        expect(q(host, '.sd-scheduler__invalid')).not.toBeNull();
        expect(qa(host, '[data-event-id]').length).toBe(0);
      })
    );
  }

  it(
    '[SCH-B-45] [SCH-SC-26] selects a block on a tap',
    run(() => {
      const { host, scheduler, settle } = renderScheduler();
      const element = block(host, 'client')!;
      element.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true }));
      element.click();
      settle();
      expect(scheduler.selectedId()).toBe('client');
    })
  );

  it(
    '[SCH-B-46] [SCH-SC-29] puts the focus back on the block after a failed keyboard move and after Cancel on the scope bar',
    run(() => {
      const failing = renderScheduler({
        option: {
          ...clientOption(),
          move: {
            onMove: () => {
              throw new Error('down');
            },
          },
        },
      });
      block(failing.host, 'client')!.focus();
      press(block(failing.host, 'client')!, 'ArrowDown', { alt: true });
      failing.settle();
      flushMicrotasks();
      failing.settle();
      expect(q(failing.host, '[data-band="move-error"]')).not.toBeNull();
      expect(document.activeElement?.getAttribute('data-event-id')).withContext('after the error').toBe('client');
      TestBed.resetTestingModule();

      const asking = renderScheduler({ option: { dataSource: { onLoad: () => recurring() }, move: { onMove: () => true } } });
      block(asking.host, 'client')!.focus();
      press(block(asking.host, 'client')!, 'ArrowDown', { alt: true });
      asking.settle();
      expect(document.activeElement?.getAttribute('data-scope')).withContext('the scope bar has the focus').toBe('this');
      press(q(asking.host, '[role="alertdialog"]')!, 'Escape');
      asking.settle();
      expect(status(asking.host)).toBe('Đã huỷ thay đổi');
      expect(document.activeElement?.getAttribute('data-event-id')).withContext('after Cancel').toBe('client');
    })
  );
});

describe('SdScheduler · R2 fixes', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('[SCH-B-01] orders timed blocks of one day by their start time in the week (lanes and DOM), R2 #1', () => {
    const layout = sdSchedulerLanes([
      { start: 1, end: 2, allDay: false, at: 30 },
      { start: 1, end: 2, allDay: false, at: 10 },
      { start: 1, end: 2, allDay: false, at: 20 },
    ]);
    expect(layout.order.map(item => item.index)).toEqual([1, 2, 0]);
    expect(layout.order.map(item => item.lane)).toEqual([0, 1, 2]);
  });

  it(
    '[SCH-B-01] draws the 09:00 block above the 11:00 and 13:30 ones of the same day whatever the onLoad order',
    run(() => {
      const day = (id: string, start: string, end: string): SdSchedulerEvent<Booking> => ({
        id,
        title: id,
        resourceId: 'hue',
        start: `2026/11/10 ${start}:00`,
        end: `2026/11/10 ${end}:00`,
      });
      const events = [day('late', '13:30', '15:00'), day('early', '09:00', '10:00'), day('mid', '11:00', '12:00')];
      const { host } = renderScheduler({ view: 'week', option: clientOption(() => events) });
      const row = q(host, '[data-track][data-resource-id="hue"]')!;
      const ids = qa(row, '[data-event-id]').map(element => element.dataset['eventId']);
      expect(ids).toEqual(['early', 'mid', 'late']);
      const top = (id: string): number => parseFloat(block(host, id)!.style.top);
      expect(top('early')).toBeLessThan(top('mid'));
      expect(top('mid')).toBeLessThan(top('late'));
    })
  );

  it(
    '[SCH-B-02] opens the day of a narrow host at scrollTime with the compact hour width, R2 #2',
    run(() => {
      const { host } = renderScheduler({ scrollTime: '08:00' }, {}, { width: 390, height: 640 });
      expect(q(host, '[role="region"]')!.dataset['compact']).toBe('true');
      expect(q(host, '[data-region="scroller"]')!.scrollLeft).toBe(8 * 64);
    })
  );

  it(
    '[SCH-B-02] brings today next to the compact resource column in a narrow week',
    run(() => {
      // Friday 06/11 to Thursday 12/11: today is the fourth column, hidden at 390px.
      const { host } = renderScheduler({ view: 'week', firstDayOfWeek: 5 }, {}, { width: 390, height: 640 });
      const scroller = q(host, '[data-region="scroller"]')!;
      const today = q(host, '[data-axis-day][data-today]')!;
      const area = scroller.getBoundingClientRect();
      expect(Math.round(today.getBoundingClientRect().left - area.left))
        .withContext('right after the 120px column')
        .toBe(120);
    })
  );

  it(
    '[SCH-B-03] keeps a selected block under the sticky resource column while scrolling, R2 #3',
    run(() => {
      const { host, settle } = renderScheduler({ selectedId: 'client', scrollTime: '00:00' });
      settle();
      expect(block(host, 'client')!.dataset['selected']).toBe('true');
      const scroller = q(host, '[data-region="scroller"]')!;
      // 10:00 is at 800px of the time area: scrolled by 900px it starts 140px from the start, under the 240px column.
      scroller.scrollLeft = 900;
      const header = q(host, '[role="row"][data-resource-id="hoi-an"] [role="rowheader"]')!;
      const box = block(host, 'client')!.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + 20, box.top + box.height / 2);
      expect(header.contains(hit)).withContext('the resource cell, not the block').toBeTrue();
    })
  );

  it(
    '[SCH-B-04] draws the proposal with the colour, dot and title of the dragged block, R2 #4',
    run(() => {
      const { host, fixture, settle } = renderScheduler({ option: { ...clientOption(), move: { onMove: () => true } } });
      let proposal: HTMLElement | null = null;
      const from = block(host, 'client')!.getBoundingClientRect();
      const row = q(host, '[data-track][data-resource-id="hue"]')!.getBoundingClientRect();
      mouseDrag(
        block(host, 'client')!,
        { x: from.left + from.width / 2, y: row.top + row.height / 2 },
        {
          step: () => fixture.detectChanges(),
          beforeRelease: () => {
            fixture.detectChanges();
            proposal = q(host, '[data-drag-proposal]');
            expect(proposal?.dataset['color']).toBe(block(host, 'client')!.dataset['color']);
            expect(proposal?.classList.contains('sd-scheduler__event')).toBeTrue();
            expect(q(proposal!, '.sd-scheduler__dot')).not.toBeNull();
            expect(text(q(proposal!, '.sd-scheduler__event-title'))).toBe('Hẹn khách: An Phát');
            expect(getComputedStyle(proposal!).overflow).withContext('the label is not clipped').toBe('visible');
          },
        }
      );
      settle();
      expect(proposal).withContext('a proposal was drawn').not.toBeNull();
    })
  );

  it(
    '[SCH-B-05] wraps the title of a narrow scheduler instead of cutting the date, R2 #5',
    run(() => {
      const { host } = renderScheduler({}, {}, { width: 390, height: 640 });
      expect(getComputedStyle(q(host, '[data-title]')!).whiteSpace).toBe('normal');
    })
  );

  it(
    '[SCH-B-07] gives the band buttons and the week day numbers 44px touch targets when compact, R2 #7',
    run(() => {
      const failing = { dataSource: { onLoad: () => Promise.reject(new Error('down')) } };
      const { host } = renderScheduler({ view: 'week', option: failing }, {}, { width: 390, height: 640 });
      expect(q(host, '[data-action="retry"]')!.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
      const number = q(host, '[data-axis-day] .sd-scheduler__day-number')!;
      const after = getComputedStyle(number, '::after');
      expect(number.getBoundingClientRect().height - 2 * parseFloat(after.top)).toBe(44);
    })
  );

  it(
    '[SCH-B-16] says nothing for Alt + ↓ on the last resource, R2 #16',
    run(() => {
      const events = bookings().map(event => (event.id === 'client' ? { ...event, resourceId: 'da-lat' } : event));
      const onMove = jasmine.createSpy('onMove').and.returnValue(true);
      const { host, settle } = renderScheduler({ option: { ...clientOption(() => events), move: { onMove } } });
      const status = text(q(host, '[role="status"]'));
      press(block(host, 'client')!, 'ArrowDown', { alt: true });
      settle();
      expect(onMove).not.toHaveBeenCalled();
      expect(text(q(host, '[role="status"]'))).toBe(status);
    })
  );

  it(
    '[SCH-B-47] does not select text while sweeping or dragging on a row, R2 recheck M1',
    run(() => {
      const { host } = renderScheduler();
      expect(getComputedStyle(q(host, '[data-track]')!).userSelect).toBe('none');
    })
  );

  it(
    '[SCH-B-48] keeps "13:30–15:30" in reading order in right-to-left, R2 recheck notes',
    run(() => {
      const { host } = renderScheduler();
      host.setAttribute('dir', 'rtl');
      const time = q(block(host, 'workshop')!, '.sd-scheduler__event-time');
      expect(time).withContext('a block wide enough for its time').not.toBeNull();
      const style = getComputedStyle(time!);
      expect([style.direction, style.unicodeBidi]).toEqual(['ltr', 'isolate']);
    })
  );

  it(
    '[SCH-B-23] frames the colour dot and today in forced colors, R2 #23',
    run(() => {
      renderScheduler();
      expect(
        findCssRule(/sd-scheduler__dot/, /forced-colors/)
          ?.getPropertyValue('border-top-color')
          .toLowerCase()
      ).toBe('canvastext');
      expect(
        findCssRule(/\[data-today\] \.sd-scheduler__day-number/, /forced-colors/)
          ?.getPropertyValue('outline-color')
          .toLowerCase()
      ).toBe('highlight');
    })
  );
});
