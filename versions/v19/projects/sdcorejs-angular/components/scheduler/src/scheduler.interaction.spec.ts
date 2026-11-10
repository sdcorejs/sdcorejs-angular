import { TestBed, discardPeriodicTasks, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { clickWithJitter, deferred, pointer, press, q, qa, text, type Point } from '../../../testing/schedule-testing';
import type { SdSchedulerCreateArgs, SdSchedulerCreateContext, SdSchedulerEvent, SdSchedulerOption } from './scheduler.model';
import { bookings, clientOption, renderScheduler, rooms, type Booking, type Rendered, type Room } from './scheduler.testing';

const run = (body: () => void): (() => void) =>
  fakeAsync(() => {
    body();
    discardPeriodicTasks();
  });

const track = (host: HTMLElement, resourceId: string): HTMLElement => q(host, `[data-track][data-resource-id="${resourceId}"]`)!;
const block = (host: HTMLElement, id: string): HTMLElement | null => q(host, `[data-event-id="${id}"]`);
const ghost = (host: HTMLElement): HTMLElement | null => q(host, '[data-create-ghost]');

/** A point on the hour axis of a row (day view): `minutes` from midnight, in the middle of the row's height. */
function atMinutes(host: HTMLElement, resourceId: string, minutes: number): Point {
  const rect = track(host, resourceId).getBoundingClientRect();
  return { x: rect.left + (minutes / 60) * 80 + 2, y: rect.top + rect.height - 6 };
}

/** A point in a column of a row (week and month views). */
function atColumn(host: HTMLElement, resourceId: string, column: number, columns = 7): Point {
  const rect = track(host, resourceId).getBoundingClientRect();
  return { x: rect.left + (column + 0.5) * (rect.width / columns), y: rect.top + rect.height - 6 };
}

/** Sweep on a row with a mouse: down, past the 5px threshold, to `to`, up. */
function sweep(rendered: Rendered, resourceId: string, from: Point, to: Point, leaveRow = false): void {
  const element = track(rendered.host, resourceId);
  pointer(element, 'pointerdown', from);
  pointer(element, 'pointermove', { x: from.x + 6, y: from.y });
  pointer(element, 'pointermove', leaveRow ? { x: to.x, y: to.y + 200 } : to);
  rendered.fixture.detectChanges();
}

function creating(onCreate: NonNullable<SdSchedulerOption<Booking, Room>['create']>['onCreate']): SdSchedulerOption<Booking, Room> {
  return { ...clientOption(), create: { onCreate } };
}

describe('SdScheduler · selection and create', () => {
  afterEach(() => TestBed.resetTestingModule());

  describe('create (§9.2)', () => {
    it(
      '[SCH-C-05] sweeps on one row, keeps the row when the pointer leaves it, and creates with the resource',
      run(() => {
        const onCreate = jasmine.createSpy('onCreate').and.returnValue(undefined);
        const creatable = jasmine.createSpy('creatable').and.returnValue(true);
        const rendered = renderScheduler({ option: { ...clientOption(), create: { creatable, onCreate } } });
        const { host } = rendered;
        sweep(rendered, 'hoi-an', atMinutes(host, 'hoi-an', 600), atMinutes(host, 'hoi-an', 690), true);
        const dashed = ghost(host)!;
        expect(dashed.closest('[data-track]')!.getAttribute('data-resource-id')).toBe('hoi-an');
        expect(qa(dashed, 'span').map(text)).toEqual(['Sự kiện mới', '10:00–12:00']);
        const context = creatable.calls.mostRecent().args[0] as SdSchedulerCreateContext<Room>;
        expect(context.resource.id).toBe('hoi-an');
        pointer(track(host, 'hoi-an'), 'pointerup', atMinutes(host, 'hoi-an', 690));
        rendered.settle();
        const args = onCreate.calls.mostRecent().args[0] as SdSchedulerCreateArgs<Room>;
        expect({ start: args.start, end: args.end, allDay: args.allDay, resourceId: args.resourceId }).toEqual({
          start: '2026/11/09 10:00:00',
          end: '2026/11/09 12:00:00',
          allDay: false,
          resourceId: 'hoi-an',
        });
        expect(args.resource.data?.seats).toBe(6);
        expect(args.signal.aborted).toBeFalse();
        expect(ghost(host)).withContext('void: the dashed block goes').toBeNull();
      })
    );

    it(
      '[SCH-C-05] creates one step on a click and one all-day span on a week sweep',
      run(() => {
        const onCreate = jasmine.createSpy('onCreate').and.returnValue(undefined);
        const rendered = renderScheduler({ option: creating(onCreate), step: 15 });
        const { host, scheduler, settle } = rendered;
        const at = atMinutes(host, 'hall', 615);
        pointer(track(host, 'hall'), 'pointerdown', at);
        pointer(track(host, 'hall'), 'pointerup', at);
        settle();
        let args = onCreate.calls.mostRecent().args[0] as SdSchedulerCreateArgs<Room>;
        expect([args.start, args.end]).toEqual(['2026/11/09 10:15:00', '2026/11/09 10:30:00']);

        scheduler.view.set('week');
        settle();
        sweep(rendered, 'hue', atColumn(host, 'hue', 1), atColumn(host, 'hue', 3));
        pointer(track(host, 'hue'), 'pointerup', atColumn(host, 'hue', 3));
        settle();
        args = onCreate.calls.mostRecent().args[0] as SdSchedulerCreateArgs<Room>;
        expect({ start: args.start, end: args.end, allDay: args.allDay }).toEqual({ start: '2026/11/10', end: '2026/11/12', allDay: true });
      })
    );

    it(
      '[SCH-C-05] has no slot on a group row: pressing it toggles the group',
      run(() => {
        const onCreate = jasmine.createSpy('onCreate');
        const { host, settle } = renderScheduler({ option: creating(onCreate) });
        const group = q(host, '[data-group="Tầng 3"]')!;
        expect(group.querySelector('[data-track]')).toBeNull();
        group.querySelector<HTMLButtonElement>('button')!.click();
        settle();
        expect(onCreate).not.toHaveBeenCalled();
      })
    );

    it(
      '[SCH-SC-06] evaluates creatable while sweeping and again right before onCreate',
      run(() => {
        let allow = true;
        const onCreate = jasmine.createSpy('onCreate');
        const rendered = renderScheduler({ option: { ...clientOption(), create: { creatable: () => allow, onCreate } } });
        const { host } = rendered;
        sweep(rendered, 'hue', atMinutes(host, 'hue', 780), atMinutes(host, 'hue', 840));
        expect(ghost(host)!.hasAttribute('data-blocked')).toBeFalse();
        allow = false;
        pointer(track(host, 'hue'), 'pointerup', atMinutes(host, 'hue', 840));
        rendered.settle();
        expect(onCreate).not.toHaveBeenCalled();
        sweep(rendered, 'hue', atMinutes(host, 'hue', 780), atMinutes(host, 'hue', 840));
        expect(ghost(host)!.hasAttribute('data-blocked')).withContext('refused while sweeping').toBeTrue();
        expect(track(host, 'hue').classList).toContain('sd-scheduler__track--blocked');
      })
    );

    it(
      '[SCH-SC-07] draws no dashed block and calls nothing without option.create',
      run(() => {
        const rendered = renderScheduler();
        const { host } = rendered;
        sweep(rendered, 'hue', atMinutes(host, 'hue', 780), atMinutes(host, 'hue', 840));
        expect(ghost(host)).toBeNull();
        pointer(track(host, 'hue'), 'pointerup', atMinutes(host, 'hue', 840));
        rendered.settle();
        expect(ghost(host)).toBeNull();
      })
    );

    it(
      '[SCH-SC-14] creates once while onCreate waits',
      run(() => {
        const wait = deferred<SdSchedulerEvent<Booking> | void>();
        const onCreate = jasmine.createSpy('onCreate').and.returnValue(wait.promise);
        const rendered = renderScheduler({ option: creating(onCreate) });
        const { host, settle } = rendered;
        const at = atMinutes(host, 'hall', 780);
        pointer(track(host, 'hall'), 'pointerdown', at);
        pointer(track(host, 'hall'), 'pointerup', at);
        settle();
        expect(ghost(host)!.dataset['pending']).toBe('true');
        pointer(track(host, 'hue'), 'pointerdown', atMinutes(host, 'hue', 900));
        pointer(track(host, 'hue'), 'pointerup', atMinutes(host, 'hue', 900));
        settle();
        expect(onCreate).toHaveBeenCalledTimes(1);
        wait.resolve();
        settle();
        expect(ghost(host)).toBeNull();
      })
    );

    it(
      '[SCH-SC-15] aborts a waiting create on a new option, new resources and destroy; drops its late result',
      run(() => {
        const calls: SdSchedulerCreateArgs<Room>[] = [];
        const waits: ReturnType<typeof deferred<SdSchedulerEvent<Booking> | void>>[] = [];
        const onCreate = (args: SdSchedulerCreateArgs<Room>): Promise<SdSchedulerEvent<Booking> | void> => {
          calls.push(args);
          const next = deferred<SdSchedulerEvent<Booking> | void>();
          waits.push(next);
          return next.promise;
        };
        const option = creating(onCreate);
        const { fixture, host, settle } = renderScheduler({ option });
        const click = (): void => {
          const at = atMinutes(host, 'hall', 780);
          pointer(track(host, 'hall'), 'pointerdown', at);
          pointer(track(host, 'hall'), 'pointerup', at);
          settle();
        };
        click();
        fixture.componentRef.setInput('option', { ...option });
        settle();
        expect(calls[0].signal.aborted).withContext('option').toBeTrue();
        expect(ghost(host)).toBeNull();
        waits[0].resolve({ id: 'late', title: 'Muộn', resourceId: 'hall', start: '2026/11/09 13:00:00', end: '2026/11/09 13:30:00' });
        settle();
        expect(block(host, 'late')).withContext('late result').toBeNull();
        click();
        fixture.componentRef.setInput('resources', rooms());
        settle();
        expect(calls[1].signal.aborted).withContext('resources').toBeTrue();
        click();
        fixture.destroy();
        expect(calls[2].signal.aborted).withContext('destroy').toBeTrue();
      })
    );

    it(
      '[SCH-SC-19] inserts the created event and selects it without sdSelect',
      run(() => {
        const created: SdSchedulerEvent<Booking> = {
          id: 'new',
          title: 'Mới',
          resourceId: 'hall',
          start: '2026/11/09 13:00:00',
          end: '2026/11/09 13:30:00',
        };
        const rendered = renderScheduler({ option: creating(async () => created) });
        const { host, scheduler, settle } = rendered;
        const selected = jasmine.createSpy('sdSelect');
        scheduler.sdSelect.subscribe(selected);
        const at = atMinutes(host, 'hall', 780);
        pointer(track(host, 'hall'), 'pointerdown', at);
        pointer(track(host, 'hall'), 'pointerup', at);
        settle();
        expect(block(host, 'new')).not.toBeNull();
        expect(scheduler.selectedId()).toBe('new');
        expect(block(host, 'new')!.dataset['selected']).toBe('true');
        expect(selected).not.toHaveBeenCalled();
      })
    );

    it(
      '[SCH-SC-20] removes the dashed block without a message when onCreate returns nothing',
      run(() => {
        const rendered = renderScheduler({ option: creating(async () => undefined) });
        const { host, settle } = rendered;
        const at = atMinutes(host, 'hall', 780);
        pointer(track(host, 'hall'), 'pointerdown', at);
        pointer(track(host, 'hall'), 'pointerup', at);
        settle();
        expect(ghost(host)).toBeNull();
        expect(q(host, '[data-band="move-error"]')).toBeNull();
        expect(text(q(host, '[role="status"]'))).toBe('');
      })
    );

    it(
      '[SCH-SC-21] shows the create error when onCreate throws, without its text',
      run(() => {
        const rendered = renderScheduler({
          option: creating(async () => {
            throw new Error('SECRET');
          }),
        });
        const { host, settle } = rendered;
        const at = atMinutes(host, 'hall', 780);
        pointer(track(host, 'hall'), 'pointerdown', at);
        pointer(track(host, 'hall'), 'pointerup', at);
        settle();
        expect(ghost(host)).toBeNull();
        expect(text(q(host, '[data-band="move-error"]'))).toContain('Không tạo được sự kiện.');
        expect(text(q(host, '[role="status"]'))).toBe('Không tạo được sự kiện.');
        expect(host.textContent).not.toContain('SECRET');
        q<HTMLButtonElement>(host, '[data-action="dismiss"]')!.click();
        settle();
        expect(q(host, '[data-band="move-error"]')).toBeNull();
      })
    );

    it(
      '[SCH-C-05] cancels a sweep with Escape and refuses a create outside minDate / maxDate',
      run(() => {
        const onCreate = jasmine.createSpy('onCreate');
        const rendered = renderScheduler({ option: creating(onCreate) });
        const { fixture, host, settle } = rendered;
        sweep(rendered, 'hue', atMinutes(host, 'hue', 780), atMinutes(host, 'hue', 840));
        press(document, 'Escape');
        fixture.detectChanges();
        expect(ghost(host)).toBeNull();
        pointer(track(host, 'hue'), 'pointerup', atMinutes(host, 'hue', 840));
        settle();
        expect(onCreate).not.toHaveBeenCalled();
        fixture.componentRef.setInput('maxDate', '2026/11/08');
        settle();
        const at = atMinutes(host, 'hue', 780);
        pointer(track(host, 'hue'), 'pointerdown', at);
        pointer(track(host, 'hue'), 'pointerup', at);
        settle();
        expect(onCreate).not.toHaveBeenCalled();
        expect(text(q(host, '[role="status"]'))).toBe('Ngoài khoảng cho phép.');
      })
    );
  });

  describe('selection (§9.1)', () => {
    it(
      '[SCH-SC-26] selects on a click, a click with a 3px jitter, Enter and Space; Esc clears',
      run(() => {
        const { host, scheduler, settle } = renderScheduler();
        const selected: string[] = [];
        scheduler.sdSelect.subscribe(event => selected.push(event.id));
        block(host, 'review')!.click();
        settle();
        expect(scheduler.selectedId()).toBe('review');
        expect(block(host, 'review')!.dataset['selected']).toBe('true');
        clickWithJitter(block(host, 'client')!);
        settle();
        expect(scheduler.selectedId()).toBe('client');
        press(block(host, 'training')!, 'Enter');
        settle();
        press(block(host, 'standup')!, ' ');
        settle();
        expect(selected).toEqual(['review', 'client', 'training', 'standup']);
        block(host, 'standup')!.focus();
        press(block(host, 'standup')!, 'Escape');
        settle();
        expect(scheduler.selectedId()).toBeNull();
        expect(document.activeElement).toBe(q(host, '[role="grid"]'));
      })
    );

    it(
      '[SCH-SC-26] clears the selection on a press of an empty slot',
      run(() => {
        const { host, scheduler, settle } = renderScheduler();
        block(host, 'review')!.click();
        settle();
        const at = atMinutes(host, 'hall', 1200);
        pointer(track(host, 'hall'), 'pointerdown', at);
        pointer(track(host, 'hall'), 'pointerup', at);
        settle();
        expect(scheduler.selectedId()).toBeNull();
      })
    );

    it(
      '[SCH-SC-27] sets selectedId back to null when the event is no longer loaded',
      run(() => {
        let events = bookings();
        const { scheduler, settle } = renderScheduler({ option: clientOption(() => events), selectedId: 'review' });
        expect(scheduler.selectedId()).toBe('review');
        events = events.filter(event => event.id !== 'review');
        scheduler.reload();
        settle();
        flushMicrotasks();
        expect(scheduler.selectedId()).toBeNull();
      })
    );

    it(
      '[SCH-SC-28] selects while readonly, not while disabled',
      run(() => {
        const { fixture, host, scheduler, settle } = renderScheduler({ readonly: true });
        block(host, 'review')!.click();
        settle();
        expect(scheduler.selectedId()).toBe('review');
        fixture.componentRef.setInput('readonly', false);
        fixture.componentRef.setInput('disabled', true);
        scheduler.selectedId.set(null);
        settle();
        block(host, 'review')!.click();
        settle();
        expect(scheduler.selectedId()).toBeNull();
        expect(qa(host, '[data-event-id]').every(element => element.getAttribute('tabindex') === '-1')).toBeTrue();
      })
    );
  });
});
