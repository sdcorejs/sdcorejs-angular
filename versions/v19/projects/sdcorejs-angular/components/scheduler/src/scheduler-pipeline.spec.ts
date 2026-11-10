import { TestBed, discardPeriodicTasks, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { centerOf, deferred, mouseDrag, pointer, press, q, qa, text, type Point } from '../../../testing/schedule-testing';
import type { SdSchedulerMoveError, SdSchedulerMoveRequest, SdSchedulerOption } from './scheduler.model';
import { bookings, clientOption, renderScheduler, rooms, type Booking, type Events, type Rendered, type Room } from './scheduler.testing';

type OnMove = NonNullable<SdSchedulerOption<Booking, Room>['move']>['onMove'];
type MoveOption = NonNullable<SdSchedulerOption<Booking, Room>['move']>;

const run = (body: () => void): (() => void) =>
  fakeAsync(() => {
    body();
    discardPeriodicTasks();
  });

const block = (host: HTMLElement, id: string): HTMLElement | null => q(host, `[data-event-id="${id}"]`);
const track = (host: HTMLElement, resourceId: string): HTMLElement => q(host, `[data-track][data-resource-id="${resourceId}"]`)!;
const row = (host: HTMLElement, resourceId: string): HTMLElement => q(host, `[role="row"][data-resource-id="${resourceId}"]`)!;
const status = (host: HTMLElement): string => text(q(host, '[role="status"]'));
const rowOf = (host: HTMLElement, id: string): string | null =>
  block(host, id)?.closest('[data-track]')?.getAttribute('data-resource-id') ?? null;

/** Middle of a row's track, at the height of `ofBlock` shifted by `dx` px along the inline axis. */
function onRow(host: HTMLElement, resourceId: string, ofBlock: string, dx = 0): Point {
  const rect = track(host, resourceId).getBoundingClientRect();
  return { x: centerOf(block(host, ofBlock)!).x + dx, y: rect.top + rect.height / 2 };
}

function render(
  move: Partial<MoveOption> & { onMove?: OnMove },
  inputs: Record<string, unknown> = {},
  events: () => Events = bookings
): Rendered & {
  moves: SdSchedulerMoveRequest<Booking, Room>[];
  errors: SdSchedulerMoveError<Booking, Room>[];
} {
  const onMove: OnMove = move.onMove ?? (() => true);
  const rendered = renderScheduler({ option: { ...clientOption(events), move: { ...move, onMove } }, ...inputs });
  const moves: SdSchedulerMoveRequest<Booking, Room>[] = [];
  const errors: SdSchedulerMoveError<Booking, Room>[] = [];
  rendered.scheduler.sdMove.subscribe(request => moves.push(request));
  rendered.scheduler.sdMoveError.subscribe(error => errors.push(error));
  return { ...rendered, moves, errors };
}

function drag(rendered: Rendered, id: string, to: Point, beforeRelease?: () => void): void {
  mouseDrag(block(rendered.host, id)!, to, { step: () => rendered.fixture.detectChanges(), beforeRelease });
  rendered.settle();
}

const recurring = (): Events =>
  bookings().map(event =>
    event.id === 'client' ? { ...event, occurrence: { seriesId: 'weekly', originalStart: '2026/11/09 10:00:00' } } : event
  );

describe('SdScheduler · move pipeline', () => {
  afterEach(() => TestBed.resetTestingModule());

  describe('drag on two axes (§9.3)', () => {
    it(
      '[SCH-C-06] moves to another row: request with both resources, the event gets its new resourceId',
      run(() => {
        const onMove = jasmine.createSpy('onMove').and.returnValue(true);
        const rendered = render({ onMove });
        const { host } = rendered;
        drag(rendered, 'client', onRow(host, 'hue', 'client'));
        expect(onMove).toHaveBeenCalledTimes(1);
        const request = onMove.calls.mostRecent().args[0] as SdSchedulerMoveRequest<Booking, Room>;
        expect(request.from).toEqual({ start: '2026/11/09 10:00:00', end: '2026/11/09 11:30:00', allDay: false, resourceId: 'hoi-an' });
        expect(request.to).toEqual({ start: '2026/11/09 10:00:00', end: '2026/11/09 11:30:00', allDay: false, resourceId: 'hue' });
        expect(request.resource.id).toBe('hue');
        expect(request.source).toBe('drag');
        expect(request.scope).toBeNull();
        expect(rowOf(host, 'client')).toBe('hue');
        expect(rendered.moves.length).toBe(1);
        expect(status(host)).toBe('Đã chuyển sang Phòng Huế, 10:00');
      })
    );

    it(
      '[SCH-C-06] shows the target row, the proposal and its floating label while dragging; shifts the time',
      run(() => {
        const onMove = jasmine.createSpy('onMove').and.returnValue(true);
        const rendered = render({ onMove });
        const { host, fixture } = rendered;
        mouseDrag(block(host, 'client')!, onRow(host, 'hue', 'client', 80), {
          step: () => fixture.detectChanges(),
          beforeRelease: () => {
            fixture.detectChanges();
            expect(row(host, 'hue').dataset['drop']).toBe('ok');
            expect(block(host, 'client')!.dataset['dragging']).toBe('true');
            const proposal = q(track(host, 'hue'), '[data-drag-proposal]')!;
            expect(text(q(proposal, '[data-drag-label]'))).toBe('Phòng Huế · 11:00 – 12:30');
          },
        });
        rendered.settle();
        const request = onMove.calls.mostRecent().args[0] as SdSchedulerMoveRequest<Booking, Room>;
        expect([request.to.start, request.to.end, request.to.resourceId]).toEqual(['2026/11/09 11:00:00', '2026/11/09 12:30:00', 'hue']);
        expect(q(host, '[data-drag-proposal]')).toBeNull();
      })
    );

    it(
      '[SCH-C-06] moves by whole days along the week columns, keeping the time',
      run(() => {
        const onMove = jasmine.createSpy('onMove').and.returnValue(true);
        const rendered = render({ onMove }, { view: 'week' });
        const { host } = rendered;
        const width = track(host, 'can-tho').getBoundingClientRect().width / 7;
        drag(rendered, 'tuesday', onRow(host, 'can-tho', 'tuesday', width));
        expect(onMove).withContext('onMove ran').toHaveBeenCalled();
        const request = onMove.calls.mostRecent().args[0] as SdSchedulerMoveRequest<Booking, Room>;
        expect([request.to.start, request.to.end]).toEqual(['2026/11/11 09:00:00', '2026/11/11 10:00:00']);
      })
    );

    it(
      '[SCH-C-07] fades a row droppable refuses while dragging; dropping there calls nothing and says why',
      run(() => {
        const onMove = jasmine.createSpy('onMove').and.returnValue(true);
        const droppable = jasmine
          .createSpy('droppable')
          .and.callFake(({ resource }: { resource: { id: string } }) => resource.id !== 'can-tho');
        const rendered = render({ onMove, droppable });
        const { host, fixture } = rendered;
        mouseDrag(block(host, 'client')!, onRow(host, 'can-tho', 'client'), {
          step: () => fixture.detectChanges(),
          beforeRelease: () => {
            fixture.detectChanges();
            expect(row(host, 'can-tho').dataset['drop']).toBe('blocked');
            expect(row(host, 'can-tho').dataset['blocked']).toBe('true');
          },
        });
        rendered.settle();
        expect(onMove).not.toHaveBeenCalled();
        expect(rowOf(host, 'client')).toBe('hoi-an');
        expect(status(host)).toBe('Không chuyển sang Phòng Cần Thơ được');
        const calls = droppable.calls.count();
        expect(calls).withContext('remembered per resource and slot within one drag').toBeLessThan(6);
      })
    );

    it(
      '[SCH-C-07] cancels a drop on a group row, outside the grid and after Escape',
      run(() => {
        const onMove = jasmine.createSpy('onMove').and.returnValue(true);
        const rendered = render({ onMove });
        const { host } = rendered;
        const group = q(host, '[data-group="Tầng 5"]')!.getBoundingClientRect();
        drag(rendered, 'client', { x: centerOf(block(host, 'client')!).x, y: group.top + group.height / 2 });
        drag(rendered, 'client', { x: centerOf(block(host, 'client')!).x, y: -500 });
        drag(rendered, 'client', onRow(host, 'hue', 'client'), () => press(document, 'Escape'));
        expect(onMove).not.toHaveBeenCalled();
        expect(rowOf(host, 'client')).toBe('hoi-an');
      })
    );

    it(
      "[SCH-C-08] axis 'time' keeps the row; axis 'resource' keeps the time and has no end handle",
      run(() => {
        const onMove = jasmine.createSpy('onMove').and.returnValue(true);
        const time = render({ onMove, axis: 'time' });
        drag(time, 'client', onRow(time.host, 'hue', 'client', 80));
        expect(onMove).withContext('onMove ran').toHaveBeenCalled();
        let request = onMove.calls.mostRecent().args[0] as SdSchedulerMoveRequest<Booking, Room>;
        expect([request.to.resourceId, request.to.start]).toEqual(['hoi-an', '2026/11/09 11:00:00']);
        let result: boolean | undefined;
        void time.scheduler.move('client', { start: '2026/11/09 10:00:00', resourceId: 'hue' }).then(value => (result = value));
        flushMicrotasks();
        expect(result).withContext('move() against axis time').toBeFalse();
        expect(q(time.host, '[data-event-id="review"] [data-resize-handle]')).not.toBeNull();
        TestBed.resetTestingModule();

        onMove.calls.reset();
        const resource = render({ onMove, axis: 'resource' });
        drag(resource, 'client', onRow(resource.host, 'hue', 'client', 80));
        request = onMove.calls.mostRecent().args[0] as SdSchedulerMoveRequest<Booking, Room>;
        expect([request.to.resourceId, request.to.start]).toEqual(['hue', '2026/11/09 10:00:00']);
        expect(qa(resource.host, '[data-resize-handle]').length).toBe(0);
        void resource.scheduler.move('client', { start: '2026/11/09 12:00:00' }).then(value => (result = value));
        flushMicrotasks();
        expect(result).withContext('move() against axis resource').toBeFalse();
      })
    );

    it(
      '[SCH-C-09] opens a collapsed group when the accepted target is one of its resources',
      run(() => {
        const rendered = render({});
        const { host, scheduler, settle } = rendered;
        q<HTMLButtonElement>(host, '[data-group="Tầng 5"] button')!.click();
        settle();
        expect(row(host, 'can-tho')).toBeNull();
        let result: boolean | undefined;
        void scheduler.move('client', { start: '2026/11/09 10:00:00', resourceId: 'can-tho' }).then(value => (result = value));
        settle();
        expect(result).toBeTrue();
        expect(row(host, 'can-tho')).not.toBeNull();
        expect(rowOf(host, 'client')).toBe('can-tho');
      })
    );

    it(
      '[SCH-C-10] resizes the end on the day view; in the week only all-day events have a handle',
      run(() => {
        const onMove = jasmine.createSpy('onMove').and.returnValue(true);
        const rendered = render({ onMove });
        const { host, scheduler, settle } = rendered;
        const handle = q(block(host, 'client')!, '[data-resize-handle]')!;
        expect(handle).withContext('the end handle').not.toBeNull();
        const from = centerOf(handle);
        pointer(handle, 'pointerdown', from);
        pointer(handle, 'pointermove', { x: from.x + 80, y: from.y });
        rendered.fixture.detectChanges();
        expect(block(host, 'client')!.style.inlineSize).toContain('* 2.5');
        pointer(handle, 'pointerup', { x: from.x + 80, y: from.y });
        settle();
        let request = onMove.calls.mostRecent().args[0] as SdSchedulerMoveRequest<Booking, Room>;
        expect([request.source, request.to.start, request.to.end]).toEqual(['resize', '2026/11/09 10:00:00', '2026/11/09 12:30:00']);
        expect(status(host)).toBe('Đã đổi Hẹn khách: An Phát thành 10:00 – 12:30');

        scheduler.view.set('week');
        settle();
        expect(q(block(host, 'tuesday')!, '[data-resize-handle]'))
          .withContext('timed')
          .toBeNull();
        const allDay = q(block(host, 'workshop')!, '[data-resize-handle]')!;
        const start = centerOf(allDay);
        const column = track(host, 'hall').getBoundingClientRect().width / 7;
        pointer(allDay, 'pointerdown', start);
        pointer(allDay, 'pointermove', { x: start.x + column * 2, y: start.y });
        pointer(allDay, 'pointerup', { x: start.x + column * 2, y: start.y });
        settle();
        request = onMove.calls.mostRecent().args[0] as SdSchedulerMoveRequest<Booking, Room>;
        expect([request.to.start, request.to.end, request.to.allDay]).toEqual(['2026/11/09', '2026/11/12', true]);
      })
    );

    it(
      '[SCH-C-06] asks the scope of an occurrence, also across rows, and reloads after following / all',
      run(() => {
        const onMove = jasmine.createSpy('onMove').and.returnValue(true);
        const onLoad = jasmine.createSpy('onLoad').and.callFake(() => recurring());
        const rendered = renderScheduler({ option: { dataSource: { onLoad }, move: { onMove } } });
        const { host, settle } = rendered;
        drag(rendered, 'client', onRow(host, 'hue', 'client'));
        const bar = q(host, '[role="alertdialog"]')!;
        expect(text(bar)).toContain('“Hẹn khách: An Phát” là sự kiện lặp');
        expect(document.activeElement?.getAttribute('data-scope')).toBe('this');
        expect(block(host, 'client')!.dataset['pending']).toBe('true');
        const loads = onLoad.calls.count();
        q<HTMLButtonElement>(bar, '[data-scope="following"]')!.click();
        settle();
        const request = onMove.calls.mostRecent().args[0] as SdSchedulerMoveRequest<Booking, Room>;
        expect([request.scope, request.to.resourceId]).toEqual(['following', 'hue']);
        expect(onLoad.calls.count()).toBe(loads + 1);
      })
    );

    it(
      '[SCH-C-06] Cancel on the scope bar puts the occurrence back without onMove',
      run(() => {
        const onMove = jasmine.createSpy('onMove');
        const rendered = renderScheduler({ option: { dataSource: { onLoad: () => recurring() }, move: { onMove } } });
        const { host, settle } = rendered;
        drag(rendered, 'client', onRow(host, 'hue', 'client'));
        expect(q(host, '[role="alertdialog"]')).withContext('the scope bar').not.toBeNull();
        press(q(host, '[role="alertdialog"]')!, 'Escape');
        settle();
        expect(onMove).not.toHaveBeenCalled();
        expect(rowOf(host, 'client')).toBe('hoi-an');
        expect(status(host)).toBe('Đã huỷ thay đổi');
      })
    );
  });

  describe('onMove results (SC-09 … SC-13)', () => {
    const cases: readonly { code: string; label: string; answer: () => ReturnType<OnMove> }[] = [
      { code: 'SCH-SC-09', label: 'true', answer: () => true },
      { code: 'SCH-SC-09', label: 'Promise true', answer: () => Promise.resolve(true) },
      { code: 'SCH-SC-10', label: 'nothing', answer: () => undefined },
      { code: 'SCH-SC-10', label: 'Promise of nothing', answer: () => Promise.resolve() },
    ];
    for (const { code, label, answer } of cases) {
      it(
        `[${code}] accepts ${label}: data, DOM, sdMove and the live region follow`,
        run(() => {
          const rendered = render({ onMove: answer });
          const { host, scheduler, settle } = rendered;
          let result: boolean | undefined;
          void scheduler.move('client', { start: '2026/11/09 14:00:00', resourceId: 'hue' }).then(value => (result = value));
          settle();
          expect(result).toBeTrue();
          expect(rowOf(host, 'client')).toBe('hue');
          expect(block(host, 'client')!.dataset['start']).toBe('2026/11/09 14:00:00');
          expect(rendered.moves.length).toBe(1);
          expect(rendered.errors.length).toBe(0);
          expect(status(host)).toBe('Đã chuyển sang Phòng Huế, 14:00');
        })
      );
    }

    const failures: readonly {
      code: string;
      label: string;
      answer: () => ReturnType<OnMove>;
      reason: 'rejected' | 'error';
      message: string;
    }[] = [
      { code: 'SCH-SC-11', label: 'false', answer: () => false, reason: 'rejected', message: 'Không dời được sự kiện.' },
      {
        code: 'SCH-SC-11',
        label: 'Promise false',
        answer: () => Promise.resolve(false),
        reason: 'rejected',
        message: 'Không dời được sự kiện.',
      },
      {
        code: 'SCH-SC-13',
        label: 'a throw',
        answer: () => {
          throw new Error('SECRET');
        },
        reason: 'error',
        message: 'Không lưu được thay đổi.',
      },
      {
        code: 'SCH-SC-13',
        label: 'a rejection',
        answer: () => Promise.reject(new Error('SECRET')),
        reason: 'error',
        message: 'Không lưu được thay đổi.',
      },
    ];
    for (const { code, label, answer, reason, message } of failures) {
      it(
        `[${code}] fails on ${label}: back in place, failed state, band, sdMoveError`,
        run(() => {
          const rendered = render({ onMove: answer });
          const { host, scheduler, settle } = rendered;
          let result: boolean | undefined;
          void scheduler.move('client', { start: '2026/11/09 14:00:00', resourceId: 'hue' }).then(value => (result = value));
          settle();
          expect(result).toBeFalse();
          expect(rowOf(host, 'client')).toBe('hoi-an');
          expect(block(host, 'client')!.dataset['failed']).toBe('true');
          expect(text(q(host, '[data-band="move-error"]'))).toContain(message);
          expect(status(host)).toBe(message);
          expect(rendered.errors.map(error => error.reason)).toEqual([reason]);
          expect(rendered.moves.length).toBe(0);
          expect(host.textContent).not.toContain('SECRET');
        })
      );
    }

    for (const [label, answer] of [
      ['cancel', () => 'cancel' as const],
      ['Promise cancel', () => Promise.resolve('cancel' as const)],
    ] as const) {
      it(
        `[SCH-SC-12] takes ${label} back to the old row and time without an error`,
        run(() => {
          const rendered = render({ onMove: answer });
          const { host, scheduler, settle } = rendered;
          let result: boolean | undefined;
          void scheduler.move('client', { start: '2026/11/09 14:00:00', resourceId: 'hue' }).then(value => (result = value));
          settle();
          expect(result).toBeFalse();
          expect(rowOf(host, 'client')).toBe('hoi-an');
          expect(block(host, 'client')!.dataset['start']).toBe('2026/11/09 10:00:00');
          expect(block(host, 'client')!.hasAttribute('data-failed')).toBeFalse();
          expect(q(host, '[data-band="move-error"]')).toBeNull();
          expect(rendered.errors.length + rendered.moves.length).toBe(0);
          expect(status(host)).toBe('Đã huỷ thay đổi');
        })
      );
    }

    it(
      '[SCH-SC-16] never shows the text of a move error',
      run(() => {
        const rendered = render({
          onMove: () => {
            throw new Error('SECRET');
          },
        });
        void rendered.scheduler.move('client', { start: '2026/11/09 14:00:00' });
        rendered.settle();
        expect(rendered.host.innerHTML).not.toContain('SECRET');
      })
    );
  });

  describe('contract', () => {
    it(
      '[SCH-SC-02] keeps the data reference of the moved event',
      run(() => {
        const events = bookings();
        const rendered = render({}, {}, () => events);
        void rendered.scheduler.move('client', { start: '2026/11/09 14:00:00', resourceId: 'hue' });
        rendered.settle();
        expect(rendered.moves.length).withContext('sdMove').toBe(1);
        expect(rendered.moves[0].event.data).toBe(events.find(event => event.id === 'client')!.data);
        const moved = rendered.moves[0];
        expect(moved.event.data).toBe(moved.event.data);
      })
    );

    it(
      '[SCH-SC-03] moves events of deep-frozen data',
      run(() => {
        const frozen = Object.freeze(bookings().map(event => Object.freeze({ ...event, data: Object.freeze({ ...event.data! }) })));
        const rendered = render({}, { resources: Object.freeze(rooms()) }, () => frozen);
        let result: boolean | undefined;
        void rendered.scheduler.move('client', { start: '2026/11/09 14:00:00', resourceId: 'hue' }).then(value => (result = value));
        rendered.settle();
        expect(result).toBeTrue();
      })
    );

    it(
      '[SCH-SC-06] evaluates movable and droppable again right before onMove',
      run(() => {
        let movable = true;
        let droppable = true;
        const onMove = jasmine.createSpy('onMove').and.returnValue(true);
        const rendered = render({ onMove, movable: () => movable, droppable: () => droppable });
        const { host, fixture } = rendered;
        expect(block(host, 'client')!.dataset['movable']).toBe('true');
        mouseDrag(block(host, 'client')!, onRow(host, 'hue', 'client'), {
          step: () => fixture.detectChanges(),
          beforeRelease: () => (movable = false),
        });
        rendered.settle();
        expect(onMove).withContext('movable').not.toHaveBeenCalled();
        movable = true;
        let result: boolean | undefined;
        void rendered.scheduler.move('client', { start: '2026/11/09 14:00:00' }).then(value => (result = value));
        rendered.settle();
        expect(result).toBeTrue();
        droppable = false;
        void rendered.scheduler.move('client', { start: '2026/11/09 15:00:00' }).then(value => (result = value));
        rendered.settle();
        expect(result).withContext('droppable').toBeFalse();
        expect(onMove).toHaveBeenCalledTimes(1);
      })
    );

    it(
      '[SCH-SC-07] has no drag, no handle and no move() without option.move',
      run(() => {
        const { host, scheduler, settle } = renderScheduler();
        expect(qa(host, '[data-movable]').length).toBe(0);
        expect(qa(host, '[data-resize-handle]').length).toBe(0);
        let result: boolean | undefined;
        void scheduler.move('client', { start: '2026/11/09 14:00:00' }).then(value => (result = value));
        settle();
        expect(result).toBeFalse();
      })
    );

    it(
      '[SCH-SC-08] droppable false stops a drag and move() before onMove',
      run(() => {
        const onMove = jasmine.createSpy('onMove').and.returnValue(true);
        const rendered = render({ onMove, droppable: ({ to }) => to.resourceId !== 'hue' });
        drag(rendered, 'client', onRow(rendered.host, 'hue', 'client'));
        let result: boolean | undefined;
        void rendered.scheduler.move('client', { start: '2026/11/09 10:00:00', resourceId: 'hue' }).then(value => (result = value));
        rendered.settle();
        expect(result).toBeFalse();
        expect(onMove).not.toHaveBeenCalled();
        expect(status(rendered.host)).toBe('Không chuyển sang Phòng Huế được');
      })
    );

    it(
      '[SCH-SC-14] refuses a second move while onMove waits',
      run(() => {
        const wait = deferred<boolean>();
        const onMove = jasmine.createSpy('onMove').and.returnValue(wait.promise);
        const rendered = render({ onMove });
        const results: boolean[] = [];
        void rendered.scheduler.move('client', { start: '2026/11/09 14:00:00' }).then(value => results.push(value));
        rendered.settle();
        expect(block(rendered.host, 'client')!.dataset['pending']).toBe('true');
        expect(q(block(rendered.host, 'client')!, 'sd-icon[name="sync"]')).not.toBeNull();
        void rendered.scheduler.move('review', { start: '2026/11/09 15:00:00' }).then(value => results.push(value));
        drag(rendered, 'training', onRow(rendered.host, 'hue', 'training'));
        rendered.settle();
        expect(onMove).toHaveBeenCalledTimes(1);
        expect(results).toEqual([false]);
        wait.resolve(true);
        rendered.settle();
        expect(results).toEqual([false, true]);
      })
    );

    for (const trigger of ['range', 'resources', 'option', 'reload', 'readonly', 'disabled', 'destroy'] as const) {
      it(
        `[SCH-SC-15] aborts a waiting move on ${trigger}; its late answer changes nothing`,
        run(() => {
          const wait = deferred<boolean>();
          let request: SdSchedulerMoveRequest<Booking, Room> | null = null;
          const rendered = render({
            onMove: next => {
              request = next;
              return wait.promise;
            },
          });
          const { fixture, host, scheduler, settle } = rendered;
          void scheduler.move('client', { start: '2026/11/09 14:00:00', resourceId: 'hue' });
          settle();
          if (trigger === 'range') q<HTMLButtonElement>(host, '[data-action="next"]')!.click();
          if (trigger === 'resources') fixture.componentRef.setInput('resources', rooms());
          if (trigger === 'option') fixture.componentRef.setInput('option', { ...clientOption(), move: { onMove: () => true } });
          if (trigger === 'reload') scheduler.reload();
          if (trigger === 'readonly') fixture.componentRef.setInput('readonly', true);
          if (trigger === 'disabled') fixture.componentRef.setInput('disabled', true);
          if (trigger === 'destroy') fixture.destroy();
          else settle();
          expect(request).withContext('onMove ran').not.toBeNull();
          expect(request!.signal.aborted).toBeTrue();
          wait.resolve(true);
          flushMicrotasks();
          expect(rendered.moves.length).toBe(0);
          if (trigger !== 'destroy' && trigger !== 'range' && trigger !== 'resources') {
            fixture.detectChanges();
            expect(rowOf(host, 'client')).toBe('hoi-an');
          }
        })
      );
    }

    it(
      '[SCH-SC-17] resolves move() true only when accepted, false for every refusal',
      run(() => {
        const rendered = render({ movable: event => event.id !== 'review' });
        const { scheduler, settle } = rendered;
        const results: Record<string, boolean> = {};
        const attempt = (name: string, id: string, to: Parameters<typeof scheduler.move>[1]): void => {
          void scheduler.move(id, to).then(value => (results[name] = value));
          settle();
        };
        attempt('unknown id', 'nope', { start: '2026/11/09 14:00:00' });
        attempt('unknown resource', 'client', { start: '2026/11/09 14:00:00', resourceId: 'nope' });
        attempt('movable false', 'review', { start: '2026/11/09 14:00:00' });
        attempt('same place', 'client', { start: '2026/11/09 10:00:00' });
        attempt('unreadable', 'client', { start: 'not a date' });
        attempt('accepted', 'client', { start: '2026/11/09 14:00:00' });
        expect(results).toEqual({
          'unknown id': false,
          'unknown resource': false,
          'movable false': false,
          'same place': false,
          unreadable: false,
          accepted: true,
        });
      })
    );

    it(
      '[SCH-SC-18] undoes an accepted move with move(id, from, api) without the scope bar or the focus',
      run(() => {
        const rendered = renderScheduler({ option: { dataSource: { onLoad: () => recurring() }, move: { onMove: () => true } } });
        const { host, scheduler, settle } = rendered;
        const moves: SdSchedulerMoveRequest<Booking, Room>[] = [];
        scheduler.sdMove.subscribe(request => moves.push(request));
        void scheduler.move('client', { start: '2026/11/09 14:00:00', resourceId: 'hue' });
        settle();
        expect(q(host, '[role="alertdialog"]')).withContext('api: scope "this"').toBeNull();
        const outside = document.createElement('button');
        document.body.appendChild(outside);
        outside.focus();
        expect(moves.length).withContext('the first move was accepted').toBe(1);
        const { from } = moves[0];
        void scheduler.move('client', { start: from.start, end: from.end, resourceId: from.resourceId });
        settle();
        expect(rowOf(host, 'client')).toBe('hoi-an');
        expect(block(host, 'client')!.dataset['start']).toBe('2026/11/09 10:00:00');
        expect(document.activeElement).toBe(outside);
        outside.remove();
      })
    );

    it(
      '[SCH-SC-31] does not take the focus for move(…, api)',
      run(() => {
        const rendered = render({});
        const outside = document.createElement('button');
        document.body.appendChild(outside);
        outside.focus();
        void rendered.scheduler.move('client', { start: '2026/11/09 14:00:00' });
        rendered.settle();
        expect(document.activeElement).toBe(outside);
        outside.remove();
      })
    );

    it(
      '[SCH-C-06] moves to a day outside the range and follows it',
      run(() => {
        const rendered = render({});
        let result: boolean | undefined;
        void rendered.scheduler.move('client', { start: '2026/11/10 09:00:00' }).then(value => (result = value));
        rendered.settle();
        expect(result).toBeTrue();
        expect(rendered.scheduler.date()).toBe('2026/11/10');
        expect(rendered.ranges[rendered.ranges.length - 1]).toEqual({ from: '2026/11/10', to: '2026/11/10', view: 'day' });
      })
    );

    it(
      '[SCH-SC-17] refuses a move past maxDate and says why',
      run(() => {
        const onMove = jasmine.createSpy('onMove').and.returnValue(true);
        const rendered = render({ onMove }, { maxDate: '2026/11/09' });
        let result: boolean | undefined;
        void rendered.scheduler.move('client', { start: '2026/11/10 09:00:00' }).then(value => (result = value));
        rendered.settle();
        expect(result).toBeFalse();
        expect(onMove).not.toHaveBeenCalled();
        expect(status(rendered.host)).toBe('Ngoài khoảng cho phép.');
      })
    );

    it(
      '[SCH-SC-08] refuses the target when droppable throws, with one dev-mode warning',
      run(() => {
        const warn = spyOn(console, 'warn');
        const onMove = jasmine.createSpy('onMove').and.returnValue(true);
        const rendered = render({
          onMove,
          droppable: () => {
            throw new Error('broken rule');
          },
        });
        let result: boolean | undefined;
        void rendered.scheduler.move('client', { start: '2026/11/09 10:00:00', resourceId: 'hue' }).then(value => (result = value));
        rendered.settle();
        void rendered.scheduler.move('client', { start: '2026/11/09 14:00:00' });
        rendered.settle();
        expect(result).toBeFalse();
        expect(onMove).not.toHaveBeenCalled();
        expect(status(rendered.host)).toBe('Không chuyển sang Phòng Hội An được');
        const messages = warn.calls.allArgs().map(args => String(args[0]));
        expect(messages.filter(message => message.includes('move.droppable threw for event "client"')).length).toBe(1);
      })
    );
  });

  describe('gesture edges', () => {
    it(
      '[SCH-SC-26] does not select the block on the click that ends its drag; the next click does',
      run(() => {
        const rendered = render({});
        const { host, scheduler, settle } = rendered;
        const selected: string[] = [];
        scheduler.sdSelect.subscribe(event => selected.push(event.id));
        drag(rendered, 'client', onRow(host, 'hue', 'client'));
        expect(rowOf(host, 'client')).toBe('hue');
        block(host, 'client')!.click();
        settle();
        expect(scheduler.selectedId()).toBeNull();
        block(host, 'client')!.click();
        settle();
        expect(scheduler.selectedId()).toBe('client');
        expect(selected).toEqual(['client']);
      })
    );

    it(
      '[SCH-C-10] drops a live resize on Escape and on pointercancel without onMove',
      run(() => {
        const onMove = jasmine.createSpy('onMove').and.returnValue(true);
        const rendered = render({ onMove });
        const { host, fixture, settle } = rendered;
        const resize = (finish: () => void): void => {
          const handle = q(block(host, 'client')!, '[data-resize-handle]')!;
          const from = centerOf(handle);
          pointer(handle, 'pointerdown', from);
          pointer(handle, 'pointermove', { x: from.x + 80, y: from.y });
          fixture.detectChanges();
          expect(block(host, 'client')!.style.inlineSize).toContain('* 2.5');
          finish();
          fixture.detectChanges();
          expect(block(host, 'client')!.style.inlineSize).withContext('back to its size').not.toContain('* 2.5');
          pointer(handle, 'pointerup', { x: from.x + 80, y: from.y });
          settle();
        };
        resize(() => press(document, 'Escape'));
        resize(() => pointer(q(block(host, 'client')!, '[data-resize-handle]')!, 'pointercancel', { x: 0, y: 0 }));
        expect(onMove).not.toHaveBeenCalled();
        expect(block(host, 'client')!.dataset['end']).toBe('2026/11/09 11:30:00');
      })
    );

    it(
      '[SCH-C-10] widens an all-day block by whole columns while resizing in the week',
      run(() => {
        const rendered = render({}, { view: 'week' });
        const { host, fixture } = rendered;
        const handle = q(block(host, 'workshop')!, '[data-resize-handle]')!;
        const from = centerOf(handle);
        const column = track(host, 'hall').getBoundingClientRect().width / 7;
        pointer(handle, 'pointerdown', from);
        pointer(handle, 'pointermove', { x: from.x + column * 2, y: from.y });
        fixture.detectChanges();
        // Monday and Tuesday, two more columns: four of the seven.
        expect(block(host, 'workshop')!.style.inlineSize).toContain('57.14');
        expect(text(q(host, '[data-resize-label]'))).toBe('09/11 – 12/11');
        pointer(handle, 'pointercancel', from);
        fixture.detectChanges();
        expect(q(host, '[data-resize-label]')).toBeNull();
      })
    );

    it(
      '[SCH-B-30] [SCH-C-10] shows the floating label while resizing, before the block when the day has no room after it',
      run(() => {
        const rendered = render({});
        const { host, fixture, scheduler, settle } = rendered;
        const resize = (id: string): HTMLElement | null => {
          const handle = q(block(host, id)!, '[data-resize-handle]')!;
          const from = centerOf(handle);
          pointer(handle, 'pointerdown', from);
          pointer(handle, 'pointermove', { x: from.x + 80, y: from.y });
          fixture.detectChanges();
          const label = q(host, '[data-resize-label]');
          expect(label?.closest('[data-track]')?.getAttribute('data-resource-id')).withContext('in the row of the block').toBe('hoi-an');
          pointer(handle, 'pointercancel', from);
          fixture.detectChanges();
          return label;
        };
        let label = resize('client');
        expect(text(label)).toBe('10:00 – 12:30');
        expect(label!.hasAttribute('data-flip')).toBeFalse();
        void scheduler.move('client', { start: '2026/11/09 21:00:00' });
        settle();
        label = resize('client');
        expect(text(label)).toBe('21:00 – 23:30');
        expect(label!.dataset['flip']).withContext('40px left after 23:30').toBe('true');
      })
    );

    it(
      '[SCH-B-31] [SCH-C-06] puts the drag label before the proposal in the last column of the week',
      run(() => {
        const rendered = render({}, { view: 'week' });
        const { host, fixture } = rendered;
        const width = track(host, 'can-tho').getBoundingClientRect().width / 7;
        let flip: string | undefined;
        let label = '';
        mouseDrag(block(host, 'tuesday')!, onRow(host, 'can-tho', 'tuesday', width * 5), {
          step: () => fixture.detectChanges(),
          beforeRelease: () => {
            fixture.detectChanges();
            const element = q(host, '[data-drag-label]')!;
            label = text(element);
            flip = element.dataset['flip'];
          },
        });
        rendered.settle();
        expect(label).toBe('09:00 – 10:00');
        expect(flip).toBe('true');
      })
    );
  });
});
