import type {
  SdKanbanCard,
  SdKanbanCardTemplateContext,
  SdKanbanColumnTemplateContext,
  SdKanbanLoadResult,
  SdKanbanMoveRequest,
  SdKanbanOption,
  SdKanbanState,
} from './kanban.model';
import {
  SdKanbanCardActionsTemplateDirective,
  SdKanbanCardTemplateDirective,
  SdKanbanColumnActionsTemplateDirective,
  SdKanbanColumnTemplateDirective,
} from './kanban.templates';

interface Order {
  readonly amount: number;
}

// Compile-time contract (TESTING §3.7): the file only has to compile; the runtime checks are light.
describe('sd-kanban types', () => {
  it('accepts the four onMove answers and refuses others', () => {
    const answers: SdKanbanOption<Order>[] = [
      { move: { onMove: () => true } },
      { move: { onMove: () => undefined } },
      { move: { onMove: () => 'cancel' } },
      { move: { onMove: () => Promise.resolve(false) } },
    ];
    // @ts-expect-error 'canceled' is not an answer of onMove
    const misspelled: SdKanbanOption<Order> = { move: { onMove: () => 'canceled' } };
    // @ts-expect-error onMove is required in the move group
    const noCallback: SdKanbanOption<Order> = { move: { reorder: true } };
    expect(answers.length + [misspelled, noCallback].length).toBe(6);
  });

  it('types cards, flags, load results and requests by the DTO', () => {
    const card: SdKanbanCard<Order> = { id: 'o-1', columnId: 'new', title: 'DH-1', data: { amount: 5 } };
    // @ts-expect-error a card needs a columnId and a title
    const incomplete: SdKanbanCard<Order> = { id: 'o-2' };
    // @ts-expect-error ids are strings only
    const numeric: SdKanbanCard<Order> = { id: 1, columnId: 'new', title: 'DH-1' };
    // @ts-expect-error data must be the DTO
    const wrongData: SdKanbanCard<Order> = { id: 'o-3', columnId: 'new', title: 'DH-3', data: { amount: '5' } };
    const flag: SdKanbanState<SdKanbanCard<Order>> = candidate => (candidate.data?.amount ?? 0) > 0;
    const page: SdKanbanLoadResult<Order> = { items: [card], nextCursor: null, total: 1, summary: '5 ₫' };
    const amount = (request: SdKanbanMoveRequest<Order>): number | undefined => request.card.data?.amount;
    expect([incomplete, numeric, wrongData].length).toBe(3);
    expect(typeof flag === 'function' && flag(card)).toBeTrue();
    expect(page.items[0]).toBe(card);
    expect(amount).toBeDefined();
  });

  it('gives every template directive a typed context', () => {
    const cardGuard: (directive: SdKanbanCardTemplateDirective<Order>, context: unknown) => context is SdKanbanCardTemplateContext<Order> =
      SdKanbanCardTemplateDirective.ngTemplateContextGuard;
    const actionsGuard: (
      directive: SdKanbanCardActionsTemplateDirective<Order>,
      context: unknown
    ) => context is SdKanbanCardTemplateContext<Order> = SdKanbanCardActionsTemplateDirective.ngTemplateContextGuard;
    const columnGuard: (directive: SdKanbanColumnTemplateDirective, context: unknown) => context is SdKanbanColumnTemplateContext =
      SdKanbanColumnTemplateDirective.ngTemplateContextGuard;
    const columnActionsGuard: (
      directive: SdKanbanColumnActionsTemplateDirective,
      context: unknown
    ) => context is SdKanbanColumnTemplateContext = SdKanbanColumnActionsTemplateDirective.ngTemplateContextGuard;
    const context: SdKanbanCardTemplateContext<Order> = {
      $implicit: { id: 'o-1', columnId: 'new', title: 'DH-1', data: { amount: 5 } },
      card: { id: 'o-1', columnId: 'new', title: 'DH-1', data: { amount: 5 } },
      column: { id: 'new', label: 'Mới' },
      index: 0,
      pending: false,
      selected: true,
    };
    const amount: number | undefined = context.card.data?.amount;
    const column: SdKanbanColumnTemplateContext = {
      $implicit: context.column,
      column: context.column,
      total: null,
      visibleCount: 0,
      summary: null,
      collapsed: false,
    };
    const total: number | null = column.total;
    expect([cardGuard, actionsGuard, columnGuard, columnActionsGuard].every(guard => typeof guard === 'function')).toBeTrue();
    expect(amount).toBe(5);
    expect(total).toBeNull();
  });
});
