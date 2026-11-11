import { TestBed, fakeAsync, flushMicrotasks, type ComponentFixture } from '@angular/core/testing';
import {
  centerOf,
  clickWithJitter,
  deferred,
  mouse,
  mouseDrag,
  pointer,
  press,
  type Deferred,
  type Point,
} from '../../../testing/schedule-testing';
import { SdCalendar } from './calendar.component';
import type { SdCalendarCreateArgs, SdCalendarEvent, SdCalendarMoveError, SdCalendarMoveRequest, SdCalendarOption } from './calendar.model';
import { configureCalendar, createWith, q, qa, text, weekEvents, type CalendarDto } from './calendar.testing';

type Event = SdCalendarEvent<CalendarDto>;
type MoveResult = boolean | 'cancel' | void;

interface Mounted {
  readonly fixture: ComponentFixture<SdCalendar<CalendarDto>>;
  readonly calendar: SdCalendar<CalendarDto>;
  readonly host: HTMLElement;
  readonly store: { events: Event[] };
  readonly moved: SdCalendarMoveRequest<CalendarDto>[];
  readonly errors: SdCalendarMoveError<CalendarDto>[];
  readonly selected: Event[];
  settle(): void;
}

/** Mounts the week of 19–25/10/2026 with `create` and `move`; the store changes only when a test says so. */
function mount(
  option: (store: { events: Event[] }) => Partial<SdCalendarOption<CalendarDto>> = () => ({}),
  inputs: Record<string, unknown> = {}
): Mounted {
  configureCalendar();
  const store = { events: weekEvents() };
  const base: SdCalendarOption<CalendarDto> = { dataSource: { onLoad: () => store.events } };
  const fixture = createWith(SdCalendar<CalendarDto>, { option: { ...base, ...option(store) }, date: '2026/10/22', ...inputs });
  const host = fixture.nativeElement as HTMLElement;
  host.style.height = '640px';
  host.style.width = '960px';
  const moved: SdCalendarMoveRequest<CalendarDto>[] = [];
  const errors: SdCalendarMoveError<CalendarDto>[] = [];
  const selected: Event[] = [];
  fixture.componentInstance.sdMove.subscribe(request => moved.push(request));
  fixture.componentInstance.sdMoveError.subscribe(error => errors.push(error));
  fixture.componentInstance.sdSelect.subscribe(event => selected.push(event));
  const settle = (): void => {
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
  };
  settle();
  return { fixture, calendar: fixture.componentInstance, host, store, moved, errors, selected, settle };
}

const block = (host: HTMLElement, id: string): HTMLElement | null => q(host, `[data-event-id="${id}"]`);
const column = (host: HTMLElement, day: string): HTMLElement | null => q(host, `[data-day-column][data-date="${day}"]`);
const grid = (host: HTMLElement): HTMLElement | null => q(host, '[data-region="time-grid"]');
const live = (host: HTMLElement): string => text(q(host, '[role="status"]'));
const band = (host: HTMLElement): HTMLElement | null => q(host, '[data-band="move-error"]');
/** Client point of `minutes` in the column of `day`. */
const at = (host: HTMLElement, day: string, minutes: number): Point => {
  const rect = column(host, day)?.getBoundingClientRect() ?? new DOMRect();
  return { x: rect.left + rect.width / 2, y: rect.top + (minutes / 60) * 48 + 2 };
};

/** Sweeps the column of `day` from `from` to `to` minutes with the mouse. */
function sweep(host: HTMLElement, day: string, from: number, to: number, settle: () => void, beforeRelease?: () => void): void {
  const target = column(host, day);
  expect(target).withContext(`column ${day}`).not.toBeNull();
  if (!target) return;
  pointer(target, 'pointerdown', at(host, day, from));
  settle();
  pointer(target, 'pointermove', at(host, day, to));
  settle();
  beforeRelease?.();
  pointer(target, 'pointerup', at(host, day, to));
  settle();
}

function moveSpy(result: MoveResult | (() => MoveResult | Promise<MoveResult>) = true): jasmine.Spy {
  return jasmine.createSpy('onMove').and.callFake(typeof result === 'function' ? result : () => result);
}

describe('SdCalendar · interaction', () => {
  afterEach(() => TestBed.resetTestingModule());

  describe('selection', () => {
    it('[CAL-SC-26] selects with a click, a click that moved 3px, Enter and Space; Esc clears and focuses the grid', fakeAsync(() => {
      const { host, calendar, selected, store, settle } = mount();
      block(host, 'client')?.click();
      settle();
      expect(calendar.selectedId()).toBe('client');
      expect(selected).toEqual([store.events[2]]);
      expect(block(host, 'client')?.hasAttribute('data-selected')).toBeTrue();
      const review = block(host, 'review');
      if (review) clickWithJitter(review);
      settle();
      expect(calendar.selectedId()).toBe('review');
      press(block(host, 'standup') ?? host, 'Enter');
      settle();
      expect(calendar.selectedId()).toBe('standup');
      press(block(host, 'leave') ?? host, ' ');
      settle();
      expect(calendar.selectedId()).toBe('leave');
      expect(selected.length).toBe(4);
      const leave = block(host, 'leave');
      leave?.focus();
      press(leave ?? host, 'Escape');
      settle();
      expect(calendar.selectedId()).toBeNull();
      expect(document.activeElement).toBe(grid(host));
    }));

    it('[CAL-SC-26] clears the selection with a click on an empty slot and selects agenda rows with Enter', fakeAsync(() => {
      const { host, fixture, calendar, settle } = mount();
      block(host, 'client')?.click();
      settle();
      const empty = column(host, '2026/10/20');
      if (empty) {
        pointer(empty, 'pointerdown', at(host, '2026/10/20', 600));
        pointer(empty, 'pointerup', at(host, '2026/10/20', 600));
        mouse(empty, 'click', at(host, '2026/10/20', 600));
      }
      settle();
      expect(calendar.selectedId()).toBeNull();
      fixture.componentRef.setInput('view', 'agenda');
      settle();
      press(block(host, 'client') ?? host, 'Enter');
      settle();
      expect(calendar.selectedId()).toBe('client');
    }));

    it('[CAL-SC-27] resets selectedId when the selected event is no longer loaded', fakeAsync(() => {
      const { calendar, store, settle } = mount();
      calendar.selectedId.set('client');
      settle();
      store.events = store.events.filter(event => event.id !== 'client');
      calendar.reload();
      settle();
      expect(calendar.selectedId()).toBeNull();
    }));

    it('[CAL-SC-28] lets readonly select and keeps disabled from selecting', fakeAsync(() => {
      const readonly = mount(() => ({}), { readonly: true });
      block(readonly.host, 'client')?.click();
      readonly.settle();
      expect(readonly.calendar.selectedId()).toBe('client');
      TestBed.resetTestingModule();
      const disabled = mount(() => ({}), { disabled: true });
      block(disabled.host, 'client')?.click();
      press(block(disabled.host, 'review') ?? disabled.host, 'Enter');
      disabled.settle();
      expect(disabled.calendar.selectedId()).toBeNull();
      expect(disabled.selected).toEqual([]);
    }));
  });

  describe('create', () => {
    function creating(result: () => Event | void | Promise<Event | void>, creatable?: () => boolean, inputs: Record<string, unknown> = {}) {
      const onCreate = jasmine.createSpy('onCreate').and.callFake(result);
      const mounted = mount(() => ({ create: { onCreate, ...(creatable ? { creatable } : {}) }, move: { onMove: moveSpy() } }), inputs);
      return { ...mounted, onCreate };
    }
    const args = (spy: jasmine.Spy): Pick<SdCalendarCreateArgs, 'start' | 'end' | 'allDay'> => {
      const { start, end, allDay } = (spy.calls.mostRecent()?.args[0] ?? {}) as SdCalendarCreateArgs;
      return { start, end, allDay };
    };

    it('[CAL-C-08] creates from a sweep, a click and Enter on the grid', fakeAsync(() => {
      const { host, onCreate, settle } = creating(() => undefined);
      sweep(host, '2026/10/21', 840, 910, settle);
      expect(args(onCreate)).toEqual({ start: '2026/10/21 14:00:00', end: '2026/10/21 15:30:00', allDay: false });
      expect((onCreate.calls.mostRecent().args[0] as SdCalendarCreateArgs).signal instanceof AbortSignal).toBeTrue();
      sweep(host, '2026/10/20', 610, 612, settle);
      expect(args(onCreate)).toEqual({ start: '2026/10/20 10:00:00', end: '2026/10/20 10:30:00', allDay: false });
      grid(host)?.focus();
      press(grid(host) ?? host, 'Enter');
      settle();
      expect(args(onCreate)).toEqual({ start: '2026/10/22 08:00:00', end: '2026/10/22 08:30:00', allDay: false });
      expect(onCreate).toHaveBeenCalledTimes(3);
    }));

    it('[CAL-C-08] does not create outside minDate or while locked', fakeAsync(() => {
      const outside = creating(() => undefined, undefined, { minDate: '2026/10/21' });
      sweep(outside.host, '2026/10/20', 600, 660, outside.settle);
      expect(outside.onCreate).not.toHaveBeenCalled();
      expect(live(outside.host)).toBe('Ngoài khoảng cho phép.');
      TestBed.resetTestingModule();
      const locked = creating(() => undefined, undefined, { readonly: true });
      sweep(locked.host, '2026/10/20', 600, 660, locked.settle);
      expect(q(locked.host, '[data-create-ghost]')).toBeNull();
      expect(locked.onCreate).not.toHaveBeenCalled();
    }));

    it('[CAL-C-09] keeps a pending dashed block and blocks other creates and moves while onCreate waits', fakeAsync(() => {
      const wait = deferred<Event | void>();
      const { host, calendar, onCreate, settle } = creating(() => wait.promise);
      sweep(host, '2026/10/21', 840, 900, settle);
      expect(q(host, '[data-create-ghost][data-pending]')).not.toBeNull();
      expect(q(host, '[data-create-ghost] sd-icon[name="sync"]')).not.toBeNull();
      sweep(host, '2026/10/20', 600, 660, settle);
      expect(onCreate).toHaveBeenCalledTimes(1);
      let accepted: boolean | null = null;
      void calendar.move('client', { start: '2026/10/22 11:00:00', end: '2026/10/22 12:00:00' }).then(value => (accepted = value));
      settle();
      expect(accepted).toBeFalse();
      wait.resolve();
      settle();
      expect(q(host, '[data-create-ghost]')).toBeNull();
    }));

    it('[CAL-B-08] ignores an onCreate answer that arrives after a new option or after destroy (SC-15, R2 B-1)', fakeAsync(() => {
      const late: Event = {
        id: 'late',
        title: 'Đến muộn',
        start: '2026/10/21 14:00:00',
        end: '2026/10/21 15:00:00',
        data: { room: 'Huế' },
      };
      for (const outcome of ['resolve', 'reject'] as const) {
        const wait = deferred<Event | void>();
        const { host, fixture, calendar, settle } = creating(() => wait.promise);
        sweep(host, '2026/10/21', 840, 900, settle);
        expect(q(host, '[data-create-ghost][data-pending]')).withContext(outcome).not.toBeNull();
        fixture.componentRef.setInput('option', { dataSource: { onLoad: () => weekEvents() } });
        settle();
        if (outcome === 'resolve') wait.resolve(late);
        else wait.reject(new Error('late'));
        settle();
        expect(block(host, 'late')).withContext(outcome).toBeNull();
        expect(calendar.selectedId()).withContext(outcome).toBeNull();
        expect(q(host, '[data-band]')).withContext(outcome).toBeNull();
        expect(q(host, '[data-create-ghost]')).withContext(outcome).toBeNull();
        TestBed.resetTestingModule();
      }
      const wait = deferred<Event | void>();
      const { host, fixture, calendar, settle } = creating(() => wait.promise);
      sweep(host, '2026/10/21', 840, 900, settle);
      fixture.destroy();
      wait.resolve(late);
      flushMicrotasks();
      expect(calendar.selectedId()).toBeNull();
    }));

    it('[CAL-SC-19] inserts the returned event and selects it without sdSelect', fakeAsync(() => {
      const created: Event = {
        id: 'new',
        title: 'Họp mới',
        start: '2026/10/21 14:00:00',
        end: '2026/10/21 15:00:00',
        data: { room: 'Huế' },
      };
      const { host, calendar, selected, onCreate, settle } = creating(() => Promise.resolve(created));
      sweep(host, '2026/10/21', 840, 850, settle);
      expect(onCreate).toHaveBeenCalledTimes(1);
      expect(block(host, 'new')).not.toBeNull();
      expect(calendar.selectedId()).toBe('new');
      expect(selected).toEqual([]);
      expect(q(host, '[data-create-ghost]')).toBeNull();
    }));

    it('[CAL-SC-20] drops the dashed block silently when onCreate returns nothing', fakeAsync(() => {
      const { host, settle } = creating(() => Promise.resolve());
      sweep(host, '2026/10/21', 840, 850, settle);
      expect(q(host, '[data-create-ghost]')).toBeNull();
      expect(band(host)).toBeNull();
      expect(qa(host, '[data-event-id]').length).toBe(7);
    }));

    it('[CAL-SC-21] drops the dashed block and shows create-error when onCreate throws', fakeAsync(() => {
      const { host, settle } = creating(() => {
        throw new Error('SECRET');
      });
      sweep(host, '2026/10/21', 840, 850, settle);
      expect(q(host, '[data-create-ghost]')).toBeNull();
      expect(text(band(host))).toContain('Không tạo được sự kiện.');
      expect(live(host)).toBe('Không tạo được sự kiện.');
      expect(host.textContent).not.toContain('SECRET');
    }));

    it('[CAL-SC-06] checks creatable again right before onCreate', fakeAsync(() => {
      let allow = true;
      const { host, onCreate, settle } = creating(
        () => undefined,
        () => allow
      );
      sweep(host, '2026/10/21', 840, 900, settle, () => {
        expect(q(host, '[data-create-ghost]')?.hasAttribute('data-blocked')).toBeFalse();
        allow = false;
      });
      expect(onCreate).not.toHaveBeenCalled();
    }));

    it('[CAL-SC-07] has no dashed block without option.create', fakeAsync(() => {
      const { host, calendar, settle } = mount();
      calendar.selectedId.set('client');
      sweep(host, '2026/10/21', 840, 900, settle, () => expect(q(host, '[data-create-ghost]')).toBeNull());
      expect(calendar.selectedId()).toBeNull();
    }));
  });

  describe('move outcomes', () => {
    function keyboardMove(result: () => MoveResult | Promise<MoveResult>, inputs: Record<string, unknown> = {}) {
      const onMove = moveSpy(result);
      const mounted = mount(() => ({ move: { onMove } }), inputs);
      const review = block(mounted.host, 'review');
      review?.focus();
      press(review ?? mounted.host, 'ArrowDown', { alt: true });
      mounted.settle();
      return { ...mounted, onMove };
    }

    for (const variant of ['sync', 'promise'] as const) {
      const wrap = (value: MoveResult): (() => MoveResult | Promise<MoveResult>) =>
        variant === 'sync' ? () => value : () => Promise.resolve(value);

      it(`[CAL-SC-09] accepts true (${variant}): data changes, then sdMove and "moved"`, fakeAsync(() => {
        const { host, moved, errors, onMove } = keyboardMove(wrap(true));
        expect(onMove).toHaveBeenCalledTimes(1);
        expect(block(host, 'review')?.dataset['start']).toBe('2026/10/21 14:15:00');
        expect(moved.length).toBe(1);
        expect(moved[0]?.to).toEqual({ start: '2026/10/21 14:15:00', end: '2026/10/21 15:45:00', allDay: false });
        expect(moved[0]?.from).toEqual({ start: '2026/10/21 14:00:00', end: '2026/10/21 15:30:00', allDay: false });
        expect([moved[0]?.source, moved[0]?.scope]).toEqual(['keyboard', null]);
        expect(errors).toEqual([]);
        expect(live(host)).toBe('Đã dời Review ngân sách Q4 sang Thứ Tư 21/10, 14:15');
        expect(block(host, 'review')?.hasAttribute('data-pending')).toBeFalse();
      }));

      it(`[CAL-SC-10] accepts nothing (${variant}) like true`, fakeAsync(() => {
        const { host, moved } = keyboardMove(wrap(undefined));
        expect(block(host, 'review')?.dataset['start']).toBe('2026/10/21 14:15:00');
        expect(moved.length).toBe(1);
      }));

      it(`[CAL-SC-11] rejects false (${variant}): back in place, failed outline, Dismiss band, sdMoveError rejected`, fakeAsync(() => {
        const { host, moved, errors, settle } = keyboardMove(wrap(false));
        expect(block(host, 'review')?.dataset['start']).toBe('2026/10/21 14:00:00');
        expect(block(host, 'review')?.hasAttribute('data-failed')).toBeTrue();
        expect(text(band(host))).toContain('Không dời được sự kiện.');
        expect(live(host)).toBe('Không dời được sự kiện.');
        expect(moved).toEqual([]);
        expect(errors.map(error => [error.reason, error.request.to.start])).toEqual([['rejected', '2026/10/21 14:15:00']]);
        q<HTMLButtonElement>(band(host) ?? host, 'button[data-action="dismiss"]')?.click();
        settle();
        expect(band(host)).toBeNull();
        expect(block(host, 'review')?.hasAttribute('data-failed')).toBeFalse();
      }));

      it(`[CAL-SC-12] cancels 'cancel' (${variant}): back in place without failure, band or output`, fakeAsync(() => {
        const { host, moved, errors } = keyboardMove(wrap('cancel'));
        expect(block(host, 'review')?.dataset['start']).toBe('2026/10/21 14:00:00');
        expect(block(host, 'review')?.hasAttribute('data-failed')).toBeFalse();
        expect(band(host)).toBeNull();
        expect(moved).toEqual([]);
        expect(errors).toEqual([]);
        expect(live(host)).toBe('Đã huỷ thay đổi');
      }));

      it(`[CAL-SC-13] reports a throw (${variant}) as reason error without its text`, fakeAsync(() => {
        const failure = new Error('SECRET');
        const result =
          variant === 'sync'
            ? (): MoveResult => {
                throw failure;
              }
            : (): Promise<MoveResult> => Promise.reject(failure);
        const { host, moved, errors } = keyboardMove(result);
        expect(block(host, 'review')?.dataset['start']).toBe('2026/10/21 14:00:00');
        expect(block(host, 'review')?.hasAttribute('data-failed')).toBeTrue();
        expect(text(band(host))).toContain('Không lưu được thay đổi.');
        expect(live(host)).toBe('Không lưu được thay đổi.');
        expect(moved).toEqual([]);
        expect(errors.map(error => [error.reason, error.error])).toEqual([['error', failure]]);
        expect(host.textContent).not.toContain('SECRET');
      }));
    }

    it('[CAL-SC-02] keeps the DTO reference after an accepted move', fakeAsync(() => {
      const { host, store, selected, settle } = keyboardMove(() => true);
      const dto = store.events[1].data;
      block(host, 'review')?.click();
      settle();
      expect(selected[0]?.data).toBe(dto);
      expect(selected[0]).not.toBe(store.events[1]);
    }));

    it('[CAL-SC-03] works on deeply frozen data', fakeAsync(() => {
      const frozen = Object.freeze(weekEvents().map(event => Object.freeze({ ...event, data: Object.freeze({ ...event.data! }) })));
      const onMove = moveSpy(true);
      const onCreate = jasmine
        .createSpy('onCreate')
        .and.returnValue({ id: 'new', title: 'Mới', start: '2026/10/20 09:00:00', end: '2026/10/20 10:00:00' });
      configureCalendar();
      const fixture = createWith(SdCalendar<CalendarDto>, {
        option: { dataSource: { onLoad: () => frozen }, move: { onMove }, create: { onCreate } },
        date: '2026/10/22',
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
      press(block(host, 'review') ?? host, 'ArrowDown', { alt: true });
      settle();
      sweep(host, '2026/10/20', 540, 545, settle);
      expect(onMove).toHaveBeenCalledTimes(1);
      expect(block(host, 'review')?.dataset['start']).toBe('2026/10/21 14:15:00');
      expect(block(host, 'new')).not.toBeNull();
    }));
  });

  describe('one pending operation and aborts', () => {
    function pendingMove(inputs: Record<string, unknown> = {}) {
      const waits: Deferred<MoveResult>[] = [];
      const onMove = moveSpy(() => {
        const wait = deferred<MoveResult>();
        waits.push(wait);
        return wait.promise;
      });
      const mounted = mount(() => ({ move: { onMove } }), inputs);
      press(block(mounted.host, 'review') ?? mounted.host, 'ArrowDown', { alt: true });
      mounted.settle();
      const request = (onMove.calls.mostRecent()?.args[0] ?? {}) as SdCalendarMoveRequest<CalendarDto>;
      return { ...mounted, onMove, waits, request };
    }

    it('[CAL-SC-14] ignores a second move by keyboard, drag or move() while one waits', fakeAsync(() => {
      const { host, calendar, onMove, settle } = pendingMove();
      expect(block(host, 'review')?.hasAttribute('data-pending')).toBeTrue();
      expect(live(host)).toBe('Đang lưu Review ngân sách Q4');
      press(block(host, 'client') ?? host, 'ArrowDown', { alt: true });
      settle();
      const standup = block(host, 'standup');
      if (standup) mouseDrag(standup, at(host, '2026/10/20', 600), { step: settle });
      let result: boolean | null = null;
      void calendar.move('client', { start: '2026/10/22 11:00:00', end: '2026/10/22 12:00:00' }).then(value => (result = value));
      settle();
      expect(onMove).toHaveBeenCalledTimes(1);
      expect(result).toBeFalse();
    }));

    const triggers: { name: string; run: (mounted: ReturnType<typeof pendingMove>) => void }[] = [
      { name: 'a range change', run: ({ host }) => q<HTMLButtonElement>(host, 'button[data-action="next"]')?.click() },
      { name: 'reload()', run: ({ calendar }) => calendar.reload() },
      { name: 'a new option', run: ({ fixture }) => fixture.componentRef.setInput('option', { ...fixture.componentInstance.option() }) },
      { name: 'readonly', run: ({ fixture }) => fixture.componentRef.setInput('readonly', true) },
      { name: 'disabled', run: ({ fixture }) => fixture.componentRef.setInput('disabled', true) },
    ];
    for (const trigger of triggers) {
      it(`[CAL-SC-15] aborts the request on ${trigger.name} and drops the late result`, fakeAsync(() => {
        const mounted = pendingMove();
        trigger.run(mounted);
        mounted.settle();
        expect(mounted.request.signal?.aborted).toBeTrue();
        mounted.waits[0].resolve(true);
        mounted.settle();
        expect(mounted.moved).toEqual([]);
        mounted.fixture.componentRef.setInput('readonly', false);
        mounted.fixture.componentRef.setInput('disabled', false);
        mounted.fixture.componentRef.setInput('date', '2026/10/21');
        mounted.settle();
        expect(block(mounted.host, 'review')?.dataset['start']).toBe('2026/10/21 14:00:00');
        expect(block(mounted.host, 'review')?.hasAttribute('data-pending')).toBeFalse();
      }));
    }

    it('[CAL-SC-15] aborts the request when the calendar is destroyed', fakeAsync(() => {
      const { fixture, request, waits, moved } = pendingMove();
      fixture.destroy();
      expect(request.signal?.aborted).toBeTrue();
      waits[0].resolve(true);
      flushMicrotasks();
      expect(moved).toEqual([]);
    }));
  });

  describe('move()', () => {
    it('[CAL-SC-17] resolves true only when accepted', fakeAsync(() => {
      let result: MoveResult = true;
      let allow = true;
      const onMove = moveSpy(() => result);
      const { calendar, settle } = mount(() => ({ move: { onMove, movable: (event: Event) => allow && event.id !== 'standup' } }));
      const run = (id: string, start: string, end: string): boolean | null => {
        let value: boolean | null = null;
        void calendar.move(id, { start, end }).then(answer => (value = answer));
        settle();
        return value;
      };
      expect(run('client', '2026/10/22 11:00:00', '2026/10/22 12:00:00')).toBeTrue();
      expect(run('missing', '2026/10/22 11:00:00', '2026/10/22 12:00:00')).toBeFalse();
      expect(run('standup', '2026/10/19 11:00:00', '2026/10/19 11:30:00')).toBeFalse();
      expect(run('client', '2026/10/22 11:00:00', '2026/10/22 12:00:00')).toBeFalse();
      result = false;
      expect(run('client', '2026/10/22 13:00:00', '2026/10/22 14:00:00')).toBeFalse();
      result = 'cancel';
      expect(run('client', '2026/10/22 13:00:00', '2026/10/22 14:00:00')).toBeFalse();
      onMove.and.callFake(() => {
        throw new Error('x');
      });
      expect(run('client', '2026/10/22 13:00:00', '2026/10/22 14:00:00')).toBeFalse();
      onMove.and.returnValue(true);
      allow = false;
      expect(run('client', '2026/10/22 13:00:00', '2026/10/22 14:00:00')).toBeFalse();
      expect(onMove).toHaveBeenCalledTimes(4);
    }));

    it('[CAL-SC-17] resolves false without option.move and while readonly', fakeAsync(() => {
      const plain = mount();
      let value: boolean | null = null;
      void plain.calendar.move('client', { start: '2026/10/22 11:00:00', end: '2026/10/22 12:00:00' }).then(answer => (value = answer));
      plain.settle();
      expect(value).toBeFalse();
      TestBed.resetTestingModule();
      const onMove = moveSpy(true);
      const locked = mount(() => ({ move: { onMove } }), { readonly: true });
      value = null;
      void locked.calendar.move('client', { start: '2026/10/22 11:00:00', end: '2026/10/22 12:00:00' }).then(answer => (value = answer));
      locked.settle();
      expect(value).toBeFalse();
      expect(onMove).not.toHaveBeenCalled();
    }));

    it('[CAL-SC-18] undoes an accepted move with move(id, request.from, "api") without asking or taking focus', fakeAsync(() => {
      const onMove = moveSpy(true);
      const { host, calendar, moved, settle } = mount(() => ({ move: { onMove } }));
      press(block(host, 'review') ?? host, 'ArrowDown', { alt: true });
      settle();
      const outside = q<HTMLButtonElement>(host, 'button[data-action="today"]');
      outside?.focus();
      let value: boolean | null = null;
      void calendar.move('review', moved[0]?.from ?? { start: '', end: '', allDay: false }, 'api').then(answer => (value = answer));
      settle();
      expect(value).toBeTrue();
      expect(block(host, 'review')?.dataset['start']).toBe('2026/10/21 14:00:00');
      expect((onMove.calls.mostRecent().args[0] as SdCalendarMoveRequest).source).toBe('api');
      expect(document.activeElement).toBe(outside);
    }));
  });

  describe('capabilities', () => {
    it('[CAL-SC-06] checks movable again right before onMove', fakeAsync(() => {
      let allow = true;
      const onMove = moveSpy(true);
      const { host, settle } = mount(() => ({ move: { onMove, movable: () => allow } }));
      expect(q(block(host, 'review') ?? host, '[data-resize-handle]')).not.toBeNull();
      allow = false;
      press(block(host, 'review') ?? host, 'ArrowDown', { alt: true });
      settle();
      expect(onMove).not.toHaveBeenCalled();
    }));

    it('[CAL-SC-07] has no handle, no drag, no Alt keys and no move() without option.move', fakeAsync(() => {
      const { host, settle } = mount();
      expect(qa(host, '[data-resize-handle]').length).toBe(0);
      expect(block(host, 'review')?.classList.contains('cdk-drag-disabled')).toBeTrue();
      press(block(host, 'review') ?? host, 'ArrowDown', { alt: true });
      settle();
      expect(block(host, 'review')?.dataset['start']).toBe('2026/10/21 14:00:00');
    }));

    it('[CAL-C-17] locks create and move in readonly and disabled; navigation stays', fakeAsync(() => {
      const onMove = moveSpy(true);
      const onCreate = jasmine.createSpy('onCreate');
      const { host, fixture, settle } = mount(() => ({ move: { onMove }, create: { onCreate } }), { readonly: true });
      expect(qa(host, '[data-resize-handle]').length).toBe(0);
      expect(block(host, 'review')?.classList.contains('cdk-drag-disabled')).toBeTrue();
      press(block(host, 'review') ?? host, 'ArrowDown', { alt: true });
      sweep(host, '2026/10/20', 600, 660, settle);
      fixture.componentRef.setInput('readonly', false);
      fixture.componentRef.setInput('disabled', true);
      settle();
      press(block(host, 'review') ?? host, 'ArrowDown', { alt: true });
      sweep(host, '2026/10/20', 600, 660, settle);
      expect(onMove).not.toHaveBeenCalled();
      expect(onCreate).not.toHaveBeenCalled();
    }));
  });

  describe('drag and resize', () => {
    it('[CAL-C-10] drags to another day and to another time; dropping outside or Esc cancels', fakeAsync(() => {
      const onMove = moveSpy(() => 'cancel');
      const { host, settle } = mount(() => ({ move: { onMove } }));
      const review = (): HTMLElement => block(host, 'review') ?? host;
      const grab = (): Point => ({ x: centerOf(review()).x, y: review().getBoundingClientRect().top + 10 });
      mouseDrag(review(), { x: at(host, '2026/10/22', 0).x, y: grab().y }, { from: grab(), step: settle, release: false });
      expect(q(host, '[data-drag-proposal]')).not.toBeNull();
      expect(review().hasAttribute('data-dragging')).toBeTrue();
      mouse(document, 'mouseup', { x: at(host, '2026/10/22', 0).x, y: grab().y });
      settle();
      let request = onMove.calls.mostRecent()?.args[0] as SdCalendarMoveRequest | undefined;
      expect(request?.to).toEqual({ start: '2026/10/22 14:00:00', end: '2026/10/22 15:30:00', allDay: false });
      expect(request?.source).toBe('drag');
      const from = grab();
      mouseDrag(review(), { x: from.x, y: from.y + 96 }, { from, step: settle });
      request = onMove.calls.mostRecent()?.args[0] as SdCalendarMoveRequest | undefined;
      expect(request?.to.start).toBe('2026/10/21 16:00:00');
      const count = onMove.calls.count();
      const outside = grid(host)?.getBoundingClientRect() ?? new DOMRect();
      mouseDrag(review(), { x: outside.right + 200, y: outside.top + 20 }, { from: grab(), step: settle });
      mouseDrag(review(), { x: from.x, y: from.y + 96 }, { from: grab(), step: settle, beforeRelease: () => press(document, 'Escape') });
      expect(onMove.calls.count()).toBe(count);
      expect(q(host, '[data-drag-proposal]')).toBeNull();
    }));

    it('[CAL-B-07] draws the drag proposal in the colour of the dragged event (§8.3, R2 A-11)', fakeAsync(() => {
      const onMove = moveSpy(() => 'cancel');
      const { host, settle } = mount(store => {
        store.events = store.events.map(event => (event.id === 'one-on-one' ? { ...event, color: 'rebeccapurple' } : event));
        return { move: { onMove } };
      });
      for (const [id, color] of [
        ['review', 'warning'],
        ['one-on-one', 'custom'],
      ] as const) {
        const source = block(host, id) ?? host;
        const from = { x: centerOf(source).x, y: source.getBoundingClientRect().top + 10 };
        mouseDrag(source, { x: from.x, y: from.y - 48 }, { from, step: settle, release: false });
        const proposal = q(host, '[data-drag-proposal]');
        expect(proposal?.dataset['color']).withContext(id).toBe(color);
        const tone = (element: Element | null): string =>
          element ? getComputedStyle(element).getPropertyValue('--sd-calendar-event-color').trim() : 'none';
        expect(tone(proposal))
          .withContext(id)
          .toBe(tone(block(host, id)));
        if (color === 'custom') expect(proposal ? getComputedStyle(proposal).borderTopColor : '').toBe('rgb(102, 51, 153)');
        mouse(document, 'mouseup', { x: from.x, y: from.y - 48 });
        settle();
      }
    }));

    it('[CAL-B-20] gives the drag proposal the colour dot of a block (§8.3, R2 recheck N-3)', fakeAsync(() => {
      const onMove = moveSpy(() => 'cancel');
      const { host, settle } = mount(() => ({ move: { onMove } }));
      const source = block(host, 'review') ?? host;
      const from = { x: centerOf(source).x, y: source.getBoundingClientRect().top + 10 };
      mouseDrag(source, { x: from.x, y: from.y - 48 }, { from, step: settle, release: false });
      const proposal = q(host, '[data-drag-proposal]');
      expect(q(proposal ?? host, ':scope > .sd-calendar__dot')).not.toBeNull();
      expect(q(proposal ?? host, '.sd-calendar__event-title')?.textContent?.trim()).toBe('Review ngân sách Q4');
      mouse(document, 'mouseup', { x: from.x, y: from.y - 48 });
      settle();
    }));

    it('[CAL-C-11] resizes the end by dragging the bottom edge, at least 15 minutes long', fakeAsync(() => {
      const onMove = moveSpy(() => 'cancel');
      const { host, settle } = mount(() => ({ move: { onMove } }));
      const handle = (): HTMLElement => q(block(host, 'review') ?? host, '[data-resize-handle]') ?? host;
      const resize = (dy: number): SdCalendarMoveRequest | undefined => {
        const start = centerOf(handle());
        pointer(handle(), 'pointerdown', start);
        settle();
        pointer(handle(), 'pointermove', { x: start.x, y: start.y + dy });
        settle();
        pointer(handle(), 'pointerup', { x: start.x, y: start.y + dy });
        settle();
        return onMove.calls.mostRecent()?.args[0] as SdCalendarMoveRequest | undefined;
      };
      const longer = resize(48);
      expect(longer?.to).toEqual({ start: '2026/10/21 14:00:00', end: '2026/10/21 16:30:00', allDay: false });
      expect(longer?.source).toBe('resize');
      expect(resize(-400)?.to.end).toBe('2026/10/21 14:15:00');
    }));
  });

  describe('keyboard', () => {
    it('[CAL-C-12] moves by moveStep with Alt, resizes with Alt+Shift and moves a day with Alt+←/→', fakeAsync(() => {
      const onMove = moveSpy(() => 'cancel');
      const { host, settle } = mount(() => ({ move: { onMove } }));
      const last = (): SdCalendarMoveRequest['to'] | undefined =>
        (onMove.calls.mostRecent()?.args[0] as SdCalendarMoveRequest | undefined)?.to;
      const source = (): string | undefined => (onMove.calls.mostRecent()?.args[0] as SdCalendarMoveRequest | undefined)?.source;
      const review = (): HTMLElement => block(host, 'review') ?? host;
      press(review(), 'ArrowDown');
      press(review(), 'ArrowRight');
      settle();
      expect(onMove).not.toHaveBeenCalled();
      press(review(), 'ArrowDown', { alt: true });
      settle();
      expect(last()).toEqual({ start: '2026/10/21 14:15:00', end: '2026/10/21 15:45:00', allDay: false });
      expect(source()).toBe('keyboard');
      press(review(), 'ArrowUp', { alt: true, shift: true });
      settle();
      expect(last()).toEqual({ start: '2026/10/21 14:00:00', end: '2026/10/21 15:15:00', allDay: false });
      // why: RX #2, like sd-scheduler: a change of the end is a 'resize', whichever input made it.
      expect(source()).toBe('resize');
      press(review(), 'ArrowRight', { alt: true });
      settle();
      expect(last()?.start).toBe('2026/10/22 14:00:00');
      press(block(host, 'leave') ?? host, 'ArrowLeft', { alt: true });
      settle();
      expect(last()).toEqual({ start: '2026/10/21', end: '2026/10/22', allDay: true });
      host.setAttribute('dir', 'rtl');
      press(review(), 'ArrowRight', { alt: true });
      settle();
      expect(last()?.start).toBe('2026/10/20 14:00:00');
    }));

    it('[CAL-C-12] follows the block into the next range after Alt+→ over the edge', fakeAsync(() => {
      const { host, calendar, settle } = mount(store => ({
        move: {
          onMove: request => {
            store.events = store.events.map(event =>
              event.id === request.event.id ? { ...event, start: request.to.start, end: request.to.end } : event
            );
            return true;
          },
        },
      }));
      const standup = block(host, 'standup');
      standup?.focus();
      press(standup ?? host, 'ArrowLeft', { alt: true });
      settle();
      expect(calendar.date()).toBe('2026/10/18');
      expect(q(host, '[role="region"]')?.dataset['from']).toBe('2026/10/12');
      expect((document.activeElement as HTMLElement | null)?.dataset['eventId']).toBe('standup');
    }));

    it('[CAL-SC-29] returns focus to the block after accept, reject and cancel started from the keyboard', fakeAsync(() => {
      for (const result of [true, false, 'cancel'] as const) {
        const { host, settle } = mount(() => ({ move: { onMove: moveSpy(() => Promise.resolve(result)) } }));
        const review = block(host, 'review');
        review?.focus();
        press(review ?? host, 'ArrowDown', { alt: true });
        settle();
        expect((document.activeElement as HTMLElement | null)?.dataset['eventId'])
          .withContext(String(result))
          .toBe('review');
        TestBed.resetTestingModule();
      }
    }));

    it('[CAL-SC-30] keeps a focus the user moved elsewhere while the move waited', fakeAsync(() => {
      const wait = deferred<MoveResult>();
      const { host, settle } = mount(() => ({ move: { onMove: moveSpy(() => wait.promise) } }));
      const review = block(host, 'review');
      review?.focus();
      press(review ?? host, 'ArrowDown', { alt: true });
      settle();
      const today = q<HTMLButtonElement>(host, 'button[data-action="today"]');
      today?.focus();
      wait.resolve(true);
      settle();
      expect(document.activeElement).toBe(today);
    }));

    it('[CAL-SC-31] does not take focus for move(…, "api")', fakeAsync(() => {
      const { host, calendar, settle } = mount(() => ({ move: { onMove: moveSpy(true) } }));
      const today = q<HTMLButtonElement>(host, 'button[data-action="today"]');
      today?.focus();
      void calendar.move('review', { start: '2026/10/21 16:00:00', end: '2026/10/21 17:30:00' }, 'api');
      settle();
      expect(document.activeElement).toBe(today);
      expect(block(host, 'review')?.dataset['start']).toBe('2026/10/21 16:00:00');
    }));

    it('[CAL-SC-31] keeps the focus on the block that move(…, "api") moves into another day (RX #6)', fakeAsync(() => {
      const { host, calendar, settle } = mount(() => ({ move: { onMove: moveSpy(true) } }));
      const review = block(host, 'review');
      review?.focus();
      void calendar.move('review', { start: '2026/10/22 16:00:00', end: '2026/10/22 17:30:00' }, 'api');
      settle();
      const moved = block(host, 'review');
      expect(moved?.dataset['start']).toBe('2026/10/22 16:00:00');
      expect(moved).withContext('the block of the new day is another element').not.toBe(review);
      expect(document.activeElement).toBe(moved);
    }));

    it('[CAL-SC-31] keeps the focus on the block a mouse drag moves when the block held it (RX #6)', fakeAsync(() => {
      const { host, settle } = mount(() => ({ move: { onMove: moveSpy(true) } }));
      const review = block(host, 'review')!;
      review.focus();
      const from = review.getBoundingClientRect();
      mouseDrag(review, { x: at(host, '2026/10/22', 0).x, y: from.top + 4 }, { from: { x: from.left + 8, y: from.top + 4 }, step: settle });
      settle();
      const moved = block(host, 'review');
      expect(moved?.dataset['start']?.startsWith('2026/10/22')).toBeTrue();
      expect(document.activeElement).toBe(moved);
    }));

    it('[CAL-C-19] moves a single grid cursor with aria-activedescendant and announces it', fakeAsync(() => {
      const onCreate = jasmine.createSpy('onCreate');
      const { host, calendar, settle } = mount(() => ({ create: { onCreate } }));
      const region = grid(host);
      region?.focus();
      settle();
      const cursor = (): HTMLElement | null => q(host, `#${region?.getAttribute('aria-activedescendant') ?? 'none'}`);
      expect(cursor()?.getAttribute('aria-label')).toBe('Thứ Năm 22/10, 08:00');
      press(region ?? host, 'ArrowDown');
      settle();
      expect(cursor()?.getAttribute('aria-label')).toBe('Thứ Năm 22/10, 08:30');
      expect(live(host)).toBe('Thứ Năm 22/10, 08:30');
      press(region ?? host, 'ArrowRight');
      press(region ?? host, 'End');
      settle();
      expect(cursor()?.getAttribute('aria-label')).toBe('Thứ Sáu 23/10, 17:00');
      press(region ?? host, 'Home');
      settle();
      expect(cursor()?.getAttribute('aria-label')).toBe('Thứ Sáu 23/10, 08:00');
      press(region ?? host, 'Enter');
      settle();
      expect((onCreate.calls.mostRecent()?.args[0] as SdCalendarCreateArgs | undefined)?.start).toBe('2026/10/23 08:00:00');
      press(region ?? host, 'PageDown');
      settle();
      expect(q(host, '[role="region"]')?.dataset['from']).toBe('2026/10/26');
      press(region ?? host, 't');
      settle();
      expect(calendar.date()).toBe('2026/11/09');
    }));

    it('[CAL-C-14] moves a roving focus over the month grid and opens the day with Enter', fakeAsync(() => {
      const { host, calendar, settle } = mount(() => ({}), { view: 'month' });
      const focused = (): string | undefined => (document.activeElement as HTMLElement | null)?.dataset['date'];
      const cell = (day: string): HTMLElement | null => q(host, `[role="gridcell"][data-date="${day}"]`);
      expect(qa(host, '[role="gridcell"][tabindex="0"]').map(item => item.dataset['date'])).toEqual(['2026/10/22']);
      cell('2026/10/22')?.focus();
      const key = (name: string, shift = false): void => {
        press(document.activeElement ?? host, name, { shift });
        settle();
      };
      key('ArrowRight');
      expect(focused()).toBe('2026/10/23');
      key('ArrowDown');
      expect(focused()).toBe('2026/10/30');
      key('Home');
      expect(focused()).toBe('2026/10/26');
      key('End');
      expect(focused()).toBe('2026/11/01');
      key('ArrowLeft');
      key('PageDown');
      expect(focused()).toBe('2026/11/30');
      expect(calendar.date()).toBe('2026/11/30');
      key('PageUp', true);
      expect(focused()).toBe('2025/11/30');
      key('Enter');
      expect([calendar.view(), calendar.date()]).toEqual(['day', '2025/11/30']);
    }));
  });
});
