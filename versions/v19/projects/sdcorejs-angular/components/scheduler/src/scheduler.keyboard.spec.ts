import { TestBed, discardPeriodicTasks, fakeAsync } from '@angular/core/testing';
import { deferred, press, q, qa, text } from '../../../testing/schedule-testing';
import type { SdSchedulerCreateArgs, SdSchedulerMoveRequest, SdSchedulerOption, SdSchedulerResource } from './scheduler.model';
import { clientOption, renderScheduler, type Booking, type Rendered, type Room } from './scheduler.testing';

type MoveOption = NonNullable<SdSchedulerOption<Booking, Room>['move']>;

const run = (body: () => void): (() => void) =>
  fakeAsync(() => {
    body();
    discardPeriodicTasks();
  });

const grid = (host: HTMLElement): HTMLElement => q(host, '[role="grid"]')!;
const block = (host: HTMLElement, id: string): HTMLElement | null => q(host, `[data-event-id="${id}"]`);
const rowOf = (host: HTMLElement, id: string): string | null =>
  block(host, id)?.closest('[data-track]')?.getAttribute('data-resource-id') ?? null;
const status = (host: HTMLElement): string => text(q(host, '[role="status"]'));
/** Label of the element `aria-activedescendant` points to. */
const active = (host: HTMLElement): string => {
  const id = grid(host).getAttribute('aria-activedescendant');
  const element = id ? document.getElementById(id) : null;
  // A group row header takes its name from its button.
  return element?.getAttribute('aria-label') ?? element?.querySelector('[aria-label]')?.getAttribute('aria-label') ?? '';
};

function focusGrid(rendered: Rendered): void {
  grid(rendered.host).focus();
  rendered.fixture.detectChanges();
}

function key(rendered: Rendered, name: string, modifiers: Parameters<typeof press>[2] = {}, target?: HTMLElement): KeyboardEvent {
  const event = press(target ?? grid(rendered.host), name, modifiers);
  rendered.settle();
  return event;
}

function withMove(move: Partial<MoveOption>, inputs: Record<string, unknown> = {}): Rendered & { onMove: jasmine.Spy } {
  const onMove = jasmine.createSpy('onMove').and.callFake(move.onMove ?? (() => true));
  const rendered = renderScheduler({ option: { ...clientOption(), move: { ...move, onMove } }, ...inputs });
  return { ...rendered, onMove };
}

describe('SdScheduler · keyboard and a11y', () => {
  afterEach(() => TestBed.resetTestingModule());

  describe('grid cursor (§9.7)', () => {
    it(
      '[SCH-C-14] starts on the first resource at its working hour and moves on both axes',
      run(() => {
        const rendered = renderScheduler();
        focusGrid(rendered);
        expect(active(rendered.host)).toBe('Hội trường, Thứ Hai 09/11, 08:00');
        key(rendered, 'ArrowRight');
        expect(active(rendered.host)).toBe('Hội trường, Thứ Hai 09/11, 08:30');
        expect(status(rendered.host)).toBe('Hội trường, Thứ Hai 09/11, 08:30');
        key(rendered, 'ArrowDown');
        expect(active(rendered.host)).withContext('the open group row is skipped').toBe('Phòng Huế, Thứ Hai 09/11, 08:30');
        key(rendered, 'End', { ctrl: true });
        expect(active(rendered.host)).toBe('Phòng Đà Lạt, Thứ Hai 09/11, 08:30');
        key(rendered, 'Home', { ctrl: true });
        expect(active(rendered.host)).toBe('Hội trường, Thứ Hai 09/11, 08:30');
        key(rendered, 'End');
        expect(active(rendered.host)).toBe('Hội trường, Thứ Hai 09/11, 17:00');
        key(rendered, 'Home');
        expect(active(rendered.host)).toBe('Hội trường, Thứ Hai 09/11, 08:00');
        expect(q(rendered.host, '[data-cursor]')).not.toBeNull();
      })
    );

    it(
      '[SCH-C-14] crosses to the next day at the edge, pages and goes to today',
      run(() => {
        const rendered = renderScheduler({ step: 60 });
        const { scheduler } = rendered;
        focusGrid(rendered);
        key(rendered, 'End');
        for (let hour = 0; hour < 8; hour++) key(rendered, 'ArrowRight');
        expect(scheduler.date()).toBe('2026/11/10');
        expect(active(rendered.host)).toBe('Hội trường, Thứ Ba 10/11, 00:00');
        key(rendered, 'ArrowLeft');
        expect(scheduler.date()).toBe('2026/11/09');
        expect(active(rendered.host)).toBe('Hội trường, Thứ Hai 09/11, 23:00');
        key(rendered, 'PageDown');
        expect(scheduler.date()).toBe('2026/11/10');
        key(rendered, 't');
        expect(scheduler.date()).toBe('2026/11/09');
      })
    );

    it(
      '[SCH-C-14] moves by columns in the week, stops at a collapsed group, Alt + Enter collapses and opens',
      run(() => {
        const rendered = renderScheduler({ view: 'week' });
        const { host, scheduler } = rendered;
        focusGrid(rendered);
        expect(active(host)).toBe('Hội trường, Thứ Hai 09/11');
        key(rendered, 'ArrowRight');
        expect(active(host)).toBe('Hội trường, Thứ Ba 10/11');
        key(rendered, 'End');
        expect(active(host)).toBe('Hội trường, Chủ Nhật 15/11');
        key(rendered, 'ArrowRight');
        expect(scheduler.date()).toBe('2026/11/16');
        key(rendered, 'ArrowDown');
        key(rendered, 'Enter', { alt: true });
        expect(q(host, '[data-group="Tầng 3"]')!.dataset['collapsed']).toBe('true');
        expect(active(host)).toBe('Tầng 3, 2 tài nguyên');
        key(rendered, 'ArrowDown');
        key(rendered, 'ArrowUp');
        expect(active(host)).withContext('the collapsed group row is a stop').toBe('Tầng 3, 2 tài nguyên');
        key(rendered, 'Enter', { alt: true });
        expect(q(host, '[data-group="Tầng 3"]')!.hasAttribute('data-collapsed')).toBeFalse();
      })
    );

    it(
      '[SCH-C-14] week: crosses back from the first column, pages keeping the column, ignores other keys',
      run(() => {
        const rendered = renderScheduler({ view: 'week' });
        const { host, scheduler } = rendered;
        focusGrid(rendered);
        key(rendered, 'ArrowLeft');
        expect(scheduler.date()).toBe('2026/11/02');
        expect(active(host)).toBe('Hội trường, Chủ Nhật 08/11');
        key(rendered, 'PageDown');
        expect(active(host)).toBe('Hội trường, Chủ Nhật 15/11');
        key(rendered, 'PageUp');
        expect(active(host)).toBe('Hội trường, Chủ Nhật 08/11');
        key(rendered, 'Home');
        expect(active(host)).toBe('Hội trường, Thứ Hai 02/11');
        expect(key(rendered, 'x').defaultPrevented).withContext('not a grid key').toBeFalse();
        key(rendered, 'Enter', { alt: true });
        expect(qa(host, '[data-collapsed]').length).withContext('Hội trường has no group').toBe(0);
        expect(active(host)).toBe('Hội trường, Thứ Hai 02/11');
      })
    );

    it(
      '[SCH-C-13] Home / End on a collapsed group use the working hours of the scheduler',
      run(() => {
        const rendered = renderScheduler();
        const { host } = rendered;
        focusGrid(rendered);
        key(rendered, 'ArrowDown');
        key(rendered, 'Enter', { alt: true });
        expect(active(host)).toBe('Tầng 3, 2 tài nguyên');
        key(rendered, 'End');
        expect(active(host)).toBe('Tầng 3, 2 tài nguyên');
        key(rendered, 'ArrowDown');
        expect(active(host)).withContext('the last slot of 08:00–17:30').toBe('Phòng Cần Thơ, Thứ Hai 09/11, 17:00');
        key(rendered, 'ArrowUp');
        key(rendered, 'Home');
        key(rendered, 'ArrowDown');
        expect(active(host)).toBe('Phòng Cần Thơ, Thứ Hai 09/11, 08:00');
      })
    );

    it(
      '[SCH-C-14] reverses left and right in RTL',
      run(() => {
        const rendered = renderScheduler();
        rendered.host.setAttribute('dir', 'rtl');
        focusGrid(rendered);
        key(rendered, 'ArrowLeft');
        expect(active(rendered.host)).toBe('Hội trường, Thứ Hai 09/11, 08:30');
      })
    );

    it(
      '[SCH-C-14] creates one step with Enter on the cursor',
      run(() => {
        const onCreate = jasmine.createSpy('onCreate');
        const rendered = renderScheduler({ option: { ...clientOption(), create: { onCreate } } });
        focusGrid(rendered);
        key(rendered, 'ArrowDown');
        key(rendered, 'Enter');
        expect(onCreate).withContext('onCreate ran').toHaveBeenCalled();
        const args = onCreate.calls.mostRecent().args[0] as SdSchedulerCreateArgs<Room>;
        expect([args.resourceId, args.start, args.end]).toEqual(['hue', '2026/11/09 08:00:00', '2026/11/09 08:30:00']);
        rendered.scheduler.view.set('week');
        rendered.settle();
        key(rendered, ' ');
        const day = onCreate.calls.mostRecent().args[0] as SdSchedulerCreateArgs<Room>;
        expect([day.allDay, day.start, day.end]).toEqual([true, '2026/11/09', '2026/11/09']);
      })
    );

    it(
      '[SCH-C-13] starts and ends Home / End at the working hours of the resource',
      run(() => {
        const resources: SdSchedulerResource<Room>[] = [
          { id: 'late', title: 'Ca chiều', workingHours: { 1: [{ from: '13:00', to: '21:00' }] } },
        ];
        const rendered = renderScheduler({ resources, option: clientOption(() => []) });
        focusGrid(rendered);
        expect(active(rendered.host)).toBe('Ca chiều, Thứ Hai 09/11, 13:00');
        key(rendered, 'End');
        expect(active(rendered.host)).toBe('Ca chiều, Thứ Hai 09/11, 20:30');
      })
    );
  });

  describe('Alt + arrow keys on a block (§9.7)', () => {
    it(
      '[SCH-C-14] moves the time with Alt + ← →, the end with Alt + Shift + ← →, the resource with Alt + ↑ ↓',
      run(() => {
        const rendered = withMove({});
        const { host, onMove } = rendered;
        key(rendered, 'ArrowRight', { alt: true }, block(host, 'client')!);
        expect(onMove).withContext('onMove ran').toHaveBeenCalled();
        let request = onMove.calls.mostRecent().args[0] as SdSchedulerMoveRequest<Booking, Room>;
        expect([request.source, request.to.start, request.to.end]).toEqual(['keyboard', '2026/11/09 10:15:00', '2026/11/09 11:45:00']);
        key(rendered, 'ArrowRight', { alt: true, shift: true }, block(host, 'client')!);
        request = onMove.calls.mostRecent().args[0] as SdSchedulerMoveRequest<Booking, Room>;
        expect([request.source, request.to.end]).toEqual(['resize', '2026/11/09 12:00:00']);
        key(rendered, 'ArrowUp', { alt: true }, block(host, 'client')!);
        request = onMove.calls.mostRecent().args[0] as SdSchedulerMoveRequest<Booking, Room>;
        expect(request.to.resourceId).toBe('hue');
        expect(rowOf(host, 'client')).toBe('hue');
      })
    );

    it(
      '[SCH-SC-29] keeps the focus on the block after each result of a keyboard move',
      run(() => {
        for (const answer of [() => true, () => false, () => 'cancel' as const]) {
          const rendered = withMove({ onMove: answer });
          const { host } = rendered;
          block(host, 'client')!.focus();
          key(rendered, 'ArrowDown', { alt: true }, block(host, 'client')!);
          rendered.settle();
          expect(document.activeElement?.getAttribute('data-event-id')).toBe('client');
          TestBed.resetTestingModule();
        }
      })
    );

    it(
      '[SCH-SC-30] leaves the focus where the user put it while the move waits',
      run(() => {
        const wait = deferred<boolean>();
        const rendered = withMove({ onMove: () => wait.promise });
        const { host } = rendered;
        block(host, 'client')!.focus();
        key(rendered, 'ArrowDown', { alt: true }, block(host, 'client')!);
        const elsewhere = q<HTMLButtonElement>(host, '[data-action="today"]')!;
        elsewhere.focus();
        wait.resolve(true);
        rendered.settle();
        expect(document.activeElement).toBe(elsewhere);
      })
    );

    it(
      '[SCH-SC-08] skips the rows droppable refuses; with none left it says why',
      run(() => {
        const rendered = withMove({ droppable: ({ resource }) => resource.id !== 'can-tho' });
        const { host, onMove } = rendered;
        key(rendered, 'ArrowDown', { alt: true }, block(host, 'client')!);
        expect(onMove).withContext('onMove ran').toHaveBeenCalled();
        const request = onMove.calls.mostRecent().args[0] as SdSchedulerMoveRequest<Booking, Room>;
        expect(request.to.resourceId).withContext('Cần Thơ is skipped').toBe('da-lat');
        TestBed.resetTestingModule();
        const closed = withMove({ droppable: ({ resource }) => resource.id === 'hoi-an' });
        key(closed, 'ArrowDown', { alt: true }, block(closed.host, 'client')!);
        expect(closed.onMove).not.toHaveBeenCalled();
        expect(status(closed.host)).toBe('Không chuyển sang Phòng Cần Thơ được');
      })
    );

    it(
      '[SCH-C-09] moves with Alt + ↓ into a collapsed group and opens it',
      run(() => {
        const rendered = withMove({});
        const { host, settle } = rendered;
        q<HTMLButtonElement>(host, '[data-group="Tầng 5"] button')!.click();
        settle();
        key(rendered, 'ArrowDown', { alt: true }, block(host, 'client')!);
        expect(q(host, '[data-group="Tầng 5"]')!.hasAttribute('data-collapsed')).toBeFalse();
        expect(rowOf(host, 'client')).toBe('can-tho');
      })
    );

    it(
      "[SCH-C-08] has no Alt + ↑ ↓ with axis 'time' and no Alt + ← → with axis 'resource'",
      run(() => {
        const time = withMove({ axis: 'time' });
        key(time, 'ArrowDown', { alt: true }, block(time.host, 'client')!);
        expect(time.onMove).not.toHaveBeenCalled();
        TestBed.resetTestingModule();
        const resource = withMove({ axis: 'resource' });
        key(resource, 'ArrowRight', { alt: true }, block(resource.host, 'client')!);
        key(resource, 'ArrowRight', { alt: true, shift: true }, block(resource.host, 'client')!);
        expect(resource.onMove).not.toHaveBeenCalled();
      })
    );

    it(
      '[SCH-SC-07] does nothing on Alt + arrows without option.move',
      run(() => {
        const rendered = renderScheduler();
        const event = key(rendered, 'ArrowDown', { alt: true }, block(rendered.host, 'client')!);
        expect(event.defaultPrevented).toBeTrue();
        expect(rowOf(rendered.host, 'client')).toBe('hoi-an');
      })
    );

    it(
      '[SCH-SC-14] ignores a key move while another move waits',
      run(() => {
        const wait = deferred<boolean>();
        const rendered = withMove({ onMove: () => wait.promise });
        key(rendered, 'ArrowDown', { alt: true }, block(rendered.host, 'client')!);
        key(rendered, 'ArrowDown', { alt: true }, block(rendered.host, 'review')!);
        expect(rendered.onMove).toHaveBeenCalledTimes(1);
        wait.resolve(true);
        rendered.settle();
      })
    );

    it(
      '[SCH-C-10] moves an all-day end by one day with Alt + Shift + → in the week',
      run(() => {
        const rendered = withMove({}, { view: 'week' });
        key(rendered, 'ArrowRight', { alt: true, shift: true }, block(rendered.host, 'workshop')!);
        expect(rendered.onMove).withContext('onMove ran').toHaveBeenCalled();
        const request = rendered.onMove.calls.mostRecent().args[0] as SdSchedulerMoveRequest<Booking, Room>;
        expect([request.to.start, request.to.end]).toEqual(['2026/11/09', '2026/11/11']);
        key(rendered, 'ArrowRight', { alt: true }, block(rendered.host, 'tuesday')!);
        const shifted = rendered.onMove.calls.mostRecent().args[0] as SdSchedulerMoveRequest<Booking, Room>;
        expect(shifted.to.start).toBe('2026/11/11 09:00:00');
      })
    );
  });

  describe('a11y', () => {
    it(
      '[SCH-C-16] points aria-activedescendant at the cursor row and reads drop-blocked in the live region',
      run(() => {
        const rendered = withMove({ droppable: () => false });
        focusGrid(rendered);
        const id = grid(rendered.host).getAttribute('aria-activedescendant')!;
        expect(document.getElementById(id)?.getAttribute('role')).toBe('gridcell');
        key(rendered, 'ArrowDown', { alt: true }, block(rendered.host, 'client')!);
        expect(status(rendered.host)).toBe('Không chuyển sang Phòng Cần Thơ được');
        expect(rendered.onMove).not.toHaveBeenCalled();
      })
    );
  });
});
