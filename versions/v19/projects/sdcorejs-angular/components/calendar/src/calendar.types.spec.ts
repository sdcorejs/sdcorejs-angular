import type { SdCalendarEvent, SdCalendarMoveRequest, SdCalendarOption, SdCalendarState } from './calendar.model';
import {
  SdCalendarAgendaItemTemplateDirective,
  SdCalendarDayCellTemplateDirective,
  SdCalendarEmptyTemplateDirective,
  SdCalendarEventTemplateDirective,
} from './calendar.templates';

interface Booking {
  room: string;
}

// Type contract (TESTING.md §3.7): this file only has to compile; each `@ts-expect-error` proves a rejection.
describe('sd-calendar types', () => {
  it('[CAL-SC-09] types onMove: true, nothing, false and "cancel" compile; any other value does not (TESTING §3.7)', () => {
    const accept: SdCalendarOption<Booking>['move'] = { onMove: () => true };
    const nothing: SdCalendarOption<Booking>['move'] = { onMove: () => undefined };
    const cancel: SdCalendarOption<Booking>['move'] = { onMove: async () => 'cancel' as const };
    const rejected: SdCalendarOption<Booking>['move'] = {
      onMove: async (request: SdCalendarMoveRequest<Booking>) => request.scope === null,
    };
    // @ts-expect-error 'canceled' is not a result of onMove
    const typo: SdCalendarOption<Booking>['move'] = { onMove: () => 'canceled' };
    expect([accept, nothing, cancel, rejected, typo].length).toBe(5);
  });

  it('[CAL-SC-22] types onLoad results and the capability flags by their context (TESTING §3.7)', () => {
    const option: SdCalendarOption<Booking> = {
      dataSource: {
        onLoad: () => [{ id: 'a', title: 'A', start: '2026/10/22 09:00:00', end: '2026/10/22 10:00:00', data: { room: 'Huế' } }],
      },
      create: { creatable: range => !range.allDay, onCreate: () => undefined },
      move: { movable: event => event.data?.room !== 'Huế', onMove: () => true },
    };
    const wrong: SdCalendarOption<Booking> = {
      // @ts-expect-error id must be a string
      dataSource: { onLoad: () => [{ id: 1, title: 'A', start: '2026/10/22' }] },
    };
    // @ts-expect-error data must match T
    const event: SdCalendarEvent<Booking> = { id: 'a', title: 'A', start: 0, data: { floor: 3 } };
    const flag: SdCalendarState<SdCalendarEvent<Booking>> = item => item.id !== 'x';
    expect([option, wrong, event, flag].length).toBe(4);
  });

  it('[CAL-C-22] gives every template directive a typed context', () => {
    const context: unknown = { $implicit: {}, event: {}, events: [] };
    const eventTemplate = {} as SdCalendarEventTemplateDirective<Booking>;
    if (SdCalendarEventTemplateDirective.ngTemplateContextGuard(eventTemplate, context)) {
      const room: string | undefined = context.event.data?.room;
      const compact: boolean = context.compact;
      // @ts-expect-error the event title is a string
      const wrong: number = context.$implicit.title;
      expect([room, compact, wrong]).toBeDefined();
    }
    const cellTemplate = {} as SdCalendarDayCellTemplateDirective<Booking>;
    if (SdCalendarDayCellTemplateDirective.ngTemplateContextGuard(cellTemplate, context)) {
      const day: string = context.$implicit;
      const rooms: (string | undefined)[] = context.events.map(item => item.data?.room);
      expect([day, rooms]).toBeDefined();
    }
    const agendaTemplate = {} as SdCalendarAgendaItemTemplateDirective<Booking>;
    if (SdCalendarAgendaItemTemplateDirective.ngTemplateContextGuard(agendaTemplate, context)) {
      // @ts-expect-error the agenda row has no compact flag
      const compact: boolean = context.compact;
      expect(compact).toBeUndefined();
    }
    const emptyTemplate = {} as SdCalendarEmptyTemplateDirective;
    if (SdCalendarEmptyTemplateDirective.ngTemplateContextGuard(emptyTemplate, context)) {
      const from: string = context.$implicit.from;
      expect(from).toBeUndefined();
    }
  });
});
