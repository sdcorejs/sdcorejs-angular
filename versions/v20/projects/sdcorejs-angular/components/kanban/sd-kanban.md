# sd-kanban

`SdKanban<T>` displays an ordered status board using consumer-owned data. It maps arbitrary domain fields through `option` and supports drag, movement menus, keyboard alternatives, custom templates, search/filter, counts, collapse, and asynchronous confirmation. It owns presentation and move proposals; the application owns persistence, permissions, and card content/actions.

```ts
import { SdKanban, SdKanbanColumn, SdKanbanOption } from '@sdcorejs/angular/components/kanban';

interface Ticket { key: string; state: string; subject: string; }
readonly columns: readonly SdKanbanColumn[] = [
  { id: 'open', label: 'Open', color: 'info' },
  { id: 'doing', label: 'In progress', color: 'warning' },
  { id: 'done', label: 'Done', color: 'success' },
];
readonly option: SdKanbanOption<Ticket> = {
  getId: item => item.key,
  getColumnId: item => item.state,
  getTitle: item => item.subject,
  withColumn: (item, columnId) => ({ ...item, state: String(columnId) }),
};
```

```html
<sd-kanban ariaLabel="Tickets" [columns]="columns" [option]="option" [(model)]="tickets" />
```

The order of `columns` is displayed unchanged. Within each column, the order of `model` is the card order. IDs are stable strings or finite numbers, unique in their respective card and column collections; `1` and `'1'` differ. Indexes are never used as identities. Card titles and column labels must be non-empty accessible strings. Unknown column IDs, duplicate IDs, invalid IDs, or failed mapping display a configuration error and block moves. Inputs, option callbacks, and arrays must be immutable; `withColumn` returns a new item with the same ID and the target column.

| Input              | Type                        | Default            | Purpose                                                            |
| ------------------ | --------------------------- | ------------------ | ------------------------------------------------------------------ |
| `model`            | `readonly T[]`              | `[]`               | Complete dataset, including cards hidden by search/filter.         |
| `columns`          | `readonly SdKanbanColumn[]` | `[]`               | ID, label, semantic `color`, optional `prefixIcon` and `disabled`. |
| `option`           | `SdKanbanOption<T>`         | required           | Domain mapping, optional filter and move persistence.              |
| `keyword`          | `string`                    | `''`               | Two-way search state.                                              |
| `collapsedColumns` | `readonly SdKanbanId[]`     | `[]`               | Two-way collapsed column IDs.                                      |
| `disabled`         | `boolean`                   | `false`            | Blocks moves, search, and collapse.                                |
| `readonly`         | `boolean`                   | `false`            | Blocks moves while preserving browsing/search/collapse.            |
| `loading`          | `boolean`                   | `false`            | Loading state; blocks moves.                                       |
| `error`            | `string`                    | —                  | Consumer load error with retry output.                             |
| `ariaLabel`        | `string`                    | localized fallback | Accessible board name.                                             |
| `autoId`           | `string`                    | —                  | Stable automation prefix.                                          |

`option.searchable` and `option.collapsible` default to `true`. `getSearchText` defaults to `getTitle`. `filter(item)` is an additional consumer predicate; it does not remove items from the model. Headers show the complete count and, when filtered, the visible count. Clearing search restores the complete order.

## Move contract

All movement paths call `move(itemId, toColumnId, toIndex?, source?)`, returning `Promise<boolean>`. Omitting `toIndex` appends. A move into a disabled column, a no-op, malformed index, locked state, or failed `canMove` returns `false` without persistence/events. The entire board serializes moves while one confirmation is pending.

`SdKanbanMoveRequest<T>` carries `item`, stable `itemId`, `fromColumnId`, `toColumnId`, `fromIndex`, `toIndex`, `previousItems`, `nextItems`, `source`, and an `AbortSignal`. Both indexes refer to the **complete column**; `toIndex` is the insertion index after removing the source card. Search/filter drag uses a stable visible anchor to resolve the full-data insertion position, preserving hidden cards. Dropping back into the same visible slot in the same column is a no-op, including when hidden cards surround that slot; it does not call persistence or emit changes.

Local mode omits `option.move` and commits the proposal immediately. Async mode is pessimistic:

```ts
readonly option: SdKanbanOption<Ticket> = {
  getId: item => item.key,
  getColumnId: item => item.state,
  getTitle: item => item.subject,
  withColumn: (item, columnId) => ({ ...item, state: String(columnId) }),
  canMove: request => this.canTransition(request.fromColumnId, request.toColumnId),
  move: async request => {
    await this.api.moveTicket({
      id: request.itemId,
      state: request.toColumnId,
      index: request.toIndex,
    }, request.signal);
    return true;
  },
};
```

The board stays in its previous order until the callback resolves `true` or `undefined`. While it waits, the affected card shows a saving status and a highlighted border. Resolving `false` rejects the move. Throwing or rejecting also keeps the old order. In both cases the affected card shows a localized failure message with a Dismiss button, and the move handle references that message. The board-level alert appears only when the card is not rendered: filtered out, in a collapsed column, or a configuration failure with no card. `sdMoveError` carries `{ request, reason: 'rejected' | 'error', error? }`. Raw exception text is not displayed. Nothing is retried or reordered automatically. The user can dismiss the failure and repeat the move by drag, menu or keyboard.

On acceptance, the component emits `modelChange`, `sdChange` with the complete array, then `sdMove` with the accepted request. `sdRetry` asks the consumer to reload after a load error. No model/change/success event occurs while pending or on rejection/cancellation.

Replacing `model`, `option`, or `columns`, locking the board, or destroying it aborts the request and invalidates its result. A callback that ignores abort still cannot overwrite newer data. A consumer that replaces data inside its callback must supply the authoritative updated array itself; the board discards that callback's now-stale proposal. Abort cannot undo a backend operation that already committed: the consumer must reconcile server data and enforce permissions on the server.

## Templates and accessibility

Import the relevant standalone directives:

- `SdKanbanCardTemplateDirective` / `sdKanbanCardTemplate`: `$implicit` and `item`, `column`, full-data `index`, `pending`.
- `SdKanbanCardActionsTemplateDirective` / `sdKanbanCardActionsTemplate`: the same context, outside the built-in movement controls.
- `SdKanbanColumnTemplateDirective` / `sdKanbanColumnTemplate`: `$implicit` and `column`, `count`, `visibleCount`, `collapsed`.
- `SdKanbanColumnActionsTemplateDirective` / `sdKanbanColumnActionsTemplate`: the same header context, outside the collapse button.

```html
<sd-kanban [columns]="columns" [option]="option" [(model)]="tickets">
  <ng-template [sdKanbanCardTemplate]="option" let-ticket>
    <strong>{{ ticket.subject }}</strong>
    <p>{{ ticket.key }}</p>
  </ng-template>
  <ng-template [sdKanbanCardActionsTemplate]="option" let-ticket let-pending="pending">
    <sd-button type="text" size="sm" title="Details" [disabled]="pending" (click)="open(ticket)" />
  </ng-template>
</sd-kanban>
```

Each column is tinted with its semantic `color` (`--sd-{color}-light`, default `secondary`). That token adapts to dark mode. Cards use `--sd-surface` with a border. The card body comes first; the drag handle and movement menu sit quietly at its top-end corner. The actions template renders on its own end-aligned row below the body. Card metadata such as badges, avatars, codes or dates belongs in the card template, using existing components like `sd-badge` and `sd-avatar`. The board has no domain-specific fields.

Custom card content/actions may contain consumer controls; they are kept separate from the drag handle and movement menu. Do not assume a custom button's click moves a card. Consumer actions must honor the provided `pending` state and the application's permissions.

The board scrolls horizontally within its container at every width; narrow screens keep compact horizontally scrolling columns rather than switching to a single-column mode. Every card has a movement menu with Move up/down and named destination columns, providing a touch and keyboard alternative to drag. Focus the drag handle and use Alt+Up/Down to reorder or Alt+Left/Right to move to adjacent enabled columns; horizontal keys respect RTL. Success, failure and pending states are announced through one polite live region. Pending and failure are also shown on the affected card. Collapsing a column retains its card data. Focus follows the moved card while its initiating interaction still owns focus, including temporary focus loss when a pending control is disabled or removed. Moving focus to another control or board during confirmation preserves that focus on completion. An API move in another board cannot take focus merely because card IDs match. Loading, empty columns, filtered-empty results, errors, disabled and readonly states use existing Core UI tokens and data-state UI.

The MVP does not include swimlanes, realtime transport, workflow design, or card CRUD. Applications compose those behaviors around the board. No additional runtime dependency is required; dragging uses the existing Angular CDK.
