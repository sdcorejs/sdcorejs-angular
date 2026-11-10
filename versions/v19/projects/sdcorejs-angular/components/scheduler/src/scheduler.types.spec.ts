import type { SdCalendarState } from '@sdcorejs/angular/components/calendar';
import type { SdSchedulerEvent, SdSchedulerMoveRequest, SdSchedulerOption, SdSchedulerResource } from './scheduler.model';
import {
  SdSchedulerCellTemplateDirective,
  SdSchedulerEmptyTemplateDirective,
  SdSchedulerEventTemplateDirective,
  SdSchedulerResourceTemplateDirective,
  type SdSchedulerCellView,
} from './scheduler.templates';

interface Booking {
  people: number;
}

interface Room {
  seats: number;
}

// Type contract (TESTING.md §3.7): this file only has to compile; each `@ts-expect-error` proves a rejection.
describe('sd-scheduler types', () => {
  it('[SCH-SC-09] types onMove: true, nothing, false and "cancel" compile; any other value does not (TESTING §3.7)', () => {
    const accept: SdSchedulerOption<Booking, Room>['move'] = { onMove: () => true };
    const nothing: SdSchedulerOption<Booking, Room>['move'] = { onMove: () => undefined };
    const cancel: SdSchedulerOption<Booking, Room>['move'] = { onMove: async () => 'cancel' as const };
    const seats: SdSchedulerOption<Booking, Room>['move'] = {
      axis: 'resource',
      droppable: ({ event, resource }) => (resource.data?.seats ?? 0) >= (event.data?.people ?? 0),
      onMove: async (request: SdSchedulerMoveRequest<Booking, Room>) => request.to.resourceId !== request.from.resourceId,
    };
    // @ts-expect-error 'canceled' is not a result of onMove
    const typo: SdSchedulerOption<Booking, Room>['move'] = { onMove: () => 'canceled' };
    // @ts-expect-error 'x' is not an axis
    const axis: SdSchedulerOption<Booking, Room>['move'] = { axis: 'x', onMove: () => true };
    expect([accept, nothing, cancel, seats, typo, axis].length).toBe(6);
  });

  it('[SCH-SC-22] types onLoad, resources and the capability flags by their context (TESTING §3.7)', () => {
    const option: SdSchedulerOption<Booking, Room> = {
      dataSource: {
        onLoad: args => [
          { id: 'a', title: 'A', resourceId: args.resourceIds[0], start: '2026/11/09 09:00:00', end: '2026/11/09 10:00:00', data: { people: 4 } },
        ],
      },
      create: { creatable: context => (context.resource.data?.seats ?? 0) > 2, onCreate: () => undefined },
      move: { movable: event => event.resourceId !== 'x', onMove: () => true },
    };
    // @ts-expect-error an event needs its resourceId
    const event: SdSchedulerEvent<Booking> = { id: 'a', title: 'A', start: 0 };
    // @ts-expect-error a resource id is a string
    const resource: SdSchedulerResource<Room> = { id: 7, title: 'Huế' };
    // @ts-expect-error data must match R
    const room: SdSchedulerResource<Room> = { id: 'hue', title: 'Huế', data: { floor: 3 } };
    const flag: SdCalendarState<SdSchedulerEvent<Booking>> = item => item.resourceId !== 'x';
    expect([option, event, resource, room, flag].length).toBe(5);
  });

  it('[SCH-C-12] gives every template directive a typed context', () => {
    const context: unknown = { $implicit: {}, event: {}, resource: {}, range: {}, events: [] };
    const eventTemplate = {} as SdSchedulerEventTemplateDirective<Booking, Room>;
    if (SdSchedulerEventTemplateDirective.ngTemplateContextGuard(eventTemplate, context)) {
      const people: number | undefined = context.event.data?.people;
      const seats: number | undefined = context.resource.data?.seats;
      const target: string = context.range.resourceId;
      // @ts-expect-error the event title is a string
      const wrong: number = context.$implicit.title;
      expect([people, seats, target, wrong]).toBeDefined();
    }
    const resourceTemplate = {} as SdSchedulerResourceTemplateDirective<Room>;
    if (SdSchedulerResourceTemplateDirective.ngTemplateContextGuard(resourceTemplate, context)) {
      const seats: number | undefined = context.$implicit.data?.seats;
      const group: string | null = context.group;
      expect([seats, group]).toBeDefined();
    }
    const cellTemplate = {} as SdSchedulerCellTemplateDirective<Booking, Room>;
    if (SdSchedulerCellTemplateDirective.ngTemplateContextGuard(cellTemplate, context)) {
      const day: string = context.$implicit;
      const people: (number | undefined)[] = context.events.map(item => item.data?.people);
      const off: boolean = context.off;
      expect([day, people, off]).toBeDefined();
    }
    const emptyTemplate = {} as SdSchedulerEmptyTemplateDirective;
    if (SdSchedulerEmptyTemplateDirective.ngTemplateContextGuard(emptyTemplate, context)) {
      const from: string = context.$implicit.from;
      expect(from).toBeUndefined();
    }
    const views: SdSchedulerCellView[] = ['week', 'month'];
    // @ts-expect-error the day view always draws blocks
    const day: SdSchedulerCellView = 'day';
    expect([views, day]).toBeDefined();
  });
});
