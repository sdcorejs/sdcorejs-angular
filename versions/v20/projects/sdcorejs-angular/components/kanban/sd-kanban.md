# `<sd-kanban>`

**Type**: Standalone component
**Selector**: `sd-kanban`
**Import path**: `@sdcorejs/angular/components/kanban` (or barrel: `@sdcorejs/angular/components`)
**Classes**: `SdKanban`, `SdKanbanCardTemplateDirective`, `SdKanbanCardActionsTemplateDirective`, `SdKanbanColumnTemplateDirective`, `SdKanbanColumnActionsTemplateDirective`
**Change detection**: `OnPush`

## Purpose

A status board: columns in a fixed order, cards in each column, and moving a card to another column (and, when you allow it, to another position). Cards are `SdKanbanCard<T>` objects: `id`, `columnId`, `title` and your own DTO in `data`. They come from `items` you already hold, or from `option.dataSource.onLoad`, which the board calls per column with a cursor.

Moving is optional. Without `option.move` there is no drag, no movement menu and no `Alt` + arrow keys. With it, the board calls your `onMove`, waits, and changes its own data only when you accept. It never writes to your backend.

## Import

```ts
import { SdKanban } from '@sdcorejs/angular/components/kanban';
```

## Quick start

```ts
import { SdKanban, type SdKanbanCard, type SdKanbanColumn, type SdKanbanOption } from '@sdcorejs/angular/components/kanban';

interface Ticket { key: string; state: string; subject: string; }

@Component({
  imports: [SdKanban],
  template: `<sd-kanban ariaLabel="Tickets" [columns]="columns" [items]="cards()" [option]="option" (sdSelect)="open($event)" />`,
})
export class TicketBoard {
  readonly columns: readonly SdKanbanColumn[] = [
    { id: 'open', label: 'Open', color: 'info' },
    { id: 'doing', label: 'In progress', color: 'warning' },
    { id: 'done', label: 'Done', color: 'success' },
  ];
  // Map once, outside the template: a new array reference replaces the board's data (see Items).
  readonly cards = computed<readonly SdKanbanCard<Ticket>[]>(() =>
    this.tickets().map(ticket => ({ id: ticket.key, columnId: ticket.state, title: ticket.subject, data: ticket })),
  );
  readonly option: SdKanbanOption<Ticket> = {
    move: {
      droppable: ({ from, to }) => this.canTransition(from.id, to.id),
      onMove: async request => {
        await this.api.moveTicket(request.card.id, request.to.columnId, request.signal);
        return true;
      },
    },
  };
}
```

A board that only shows cards passes `option: {}`.

## API

### Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `columns` | `readonly SdKanbanColumn[]` | required | `id`, `label`, semantic `color` (default `secondary`), `prefixIcon`, `disabled`, `summary` (second line under the label). Shown in this order. |
| `option` | `SdKanbanOption<T>` | required | `dataSource`, `pageSize` (20), `loadMore` (`'button'`), `move`. A new object reloads every column (data source) and cancels a pending move. |
| `items` | `readonly SdKanbanCard<T>[] \| undefined` | `undefined` | Cards on the client. Ignored, with a dev-mode warning, while `option.dataSource` is set. |
| `selectedId` | `string \| null` | `null` | Two-way. Back to `null` when that card is no longer in the data (checked once the data is there). |
| `keyword` | `string` | `''` | Two-way search text. Works without `searchable` (your own search box). |
| `searchable` | `boolean` | `false` | Shows the board search (shared `sd-search-field`, size sm, 280px). |
| `collapsible` | `boolean` | `true` | Collapse buttons in the column headers. |
| `collapsedColumns` | `readonly string[]` | `[]` | Two-way ids of collapsed columns. A collapsed column keeps its cards. |
| `disabled` | `boolean` | `false` | No move, selection, search or collapse; the card name buttons are disabled. |
| `readonly` | `boolean` | `false` | No move. Selection, search, collapse and "Show more" work. |
| `ariaLabel` | `string \| null \| undefined` | "Board" | Name of the board region. |
| `autoId` | `string \| null \| undefined` | — | E2E scope, see E2E hooks. |

### Outputs

| Output | Payload | When |
| --- | --- | --- |
| `sdSelect` | `SdKanbanCard<T>` | Click (the pointer moved less than 5px), tap, `Enter` or `Space` on a card. Also sets `selectedId`. Selecting the selected card emits again. |
| `sdMove` | `SdKanbanMoveRequest<T>` | `onMove` accepted and the board's data changed. |
| `sdMoveError` | `SdKanbanMoveError<T>` | `onMove` returned `false` (`reason: 'rejected'`) or threw (`reason: 'error'`). Never for `'cancel'`. |
| `sdLoadError` | `SdKanbanLoadError` | `onLoad` threw or rejected, for the first page or a later one (`{ columnId, error }`). Never for an aborted load. |

### Methods and read-only state

| Member | Notes |
| --- | --- |
| `move(cardId, { columnId, beforeId? }, source = 'api'): Promise<boolean>` | Runs the move pipeline below. `beforeId` is ignored while `reorder` is off. Resolves `false` when the move is blocked or not accepted. Undo: `move(request.card.id, { columnId: request.from.columnId })` puts the card back in its column; with `items` and `reorder` off it also gets its old place, with `reorder` on it goes after the last loaded card unless you pass the `beforeId` you kept, and with a data source and `reorder` off it goes to the top. |
| `reload(columnId?)` | Data source only: aborts the column's (or every column's) load and calls `onLoad` again from `cursor: null`. The cards on screen stay until the result arrives. |
| `loadMore(columnId)` | Data source only: the next page of that column. Ignored while it loads or when `nextCursor` is `null`. |
| `pendingId` | `Signal<string \| null>`: id of the card whose move waits for `onMove`. |

## Items

- The board keeps its own copy of `items`. **A new array reference replaces that copy** and cancels a pending move, so build the array once (a `computed`, a store selector) and never with a method or `.map()` in the template: each change detection would hand the board a new reference.
- The order of the array is the order inside each column.
- `keyword` filters by `searchText ?? title`, lower-cased in the locale, "contains". The header shows `visible/total` while cards are hidden.
- An accepted move replaces the card with `{ ...card, columnId }` (same `data` reference). With `reorder` off the card keeps its place in the array; with `reorder` on it goes before `beforeId`, or after the last card of the target column.
- Invalid data shows an error state and blocks moves: an empty or duplicate card id, an unknown `columnId`, an empty `title`, a duplicate column id or an empty `label`.

## Data source

```ts
readonly option: SdKanbanOption<Order> = {
  pageSize: 20,
  dataSource: {
    onLoad: async ({ columnId, cursor, pageSize, keyword, signal }) => {
      const page = await this.api.orders({ status: columnId, cursor, pageSize, q: keyword }, signal);
      return {
        items: page.rows.map(order => ({ id: order.code, columnId, title: order.code, data: order })),
        nextCursor: page.next, // null when there is no next page
        total: page.total, // read from the first page only
        summary: this.money(page.sum), // overrides column.summary; first page only
      };
    },
  },
};
```

- Every column has its own state: cards, cursor, `total`, `summary`, status (`idle`, `loading`, `loading-more`, `error`).
- On init every column that is not collapsed loads in parallel. A collapsed column loads when it is expanded the first time; until then its count is "–".
- A new `columns` reference loads the new columns, aborts the removed ones and keeps the state of columns with the same id.
- `keyword` changes wait 300ms, abort every load and reload every loaded column from `cursor: null`. The server filters; the board does not. "Show more" and the Retry of a later page send the keyword of the column's first page with its cursor, also during those 300ms.
- A new `option` reference reloads every column. Results of an aborted load are dropped.
- A card whose `columnId` differs from `args.columnId`, or with an empty `title`, is dropped with a dev-mode warning. A card id already loaded (another page or another column) keeps the first one, with a warning. A column that loads its first page again does not count: its old page is about to go, so a card that changed column on the server moves to the column that answers with it.
- The count is `total` when known, otherwise the loaded cards with "+" while there is a next page. Screen readers hear "{n} cards" only when `total` is known; "–" and "n+" are read as shown.
- A column without its first page (collapsed and never opened, loading it, or failed it) is not a move destination yet: its "Move to" entry is disabled, `Alt` + `←` `→` skips it, a drag fades it, and `move()` resolves `false`. Open or retry it first. While a column loads its first page again (`reload`, a new `keyword` or `option`), its cards stay on screen but cannot move: no drag, the movement menu button is disabled and `Alt` + arrows do nothing.
- First load: three skeleton blocks and `aria-busy` on the list. First-page error: a message and Retry in place of the cards (the count goes back to "–" and the summary of the server is dropped). Later-page error: a message and Retry in place of "Show more".
- An empty column says "No matching cards" while `keyword` is set, "No cards" otherwise.
- A `selectedId` given with the board (a link to one card) is kept until the first pages of the open columns are in; it goes back to `null` only if the card is not there.
- "Show more {count}" closes each loaded list; `count` is `min(pageSize, total − loaded)`, or `pageSize` without `total`. `loadMore: 'auto'` loads the next page when the button comes within 200px of the lane's view (`IntersectionObserver`; without it the button stays).
- An accepted move removes the card from the source column (`total` − 1) and adds it to the target column (`total` + 1): at the top with `reorder` off, before `beforeId` with `reorder` on. `onLoad` is not called again.

## Moving

```ts
move: {
  movable: card => card.data?.locked !== true, // default true
  droppable: ({ card, from, to }) => this.flow[from.id].includes(to.id), // default true; synchronous
  reorder: false, // default: only change column
  onMove: request => this.save(request), // see the results below
}
```

- `movable` decides whether a card can be dragged and whether its menu entries are enabled. It runs when the board renders and again before `onMove`.
- `droppable` runs when a drag starts (lanes that refuse get `data-blocked`, fade, and refuse the drop), when the movement menu opens, for `Alt` + `←` `→`, and again before `onMove`. It is skipped when the card stays in its column. Do not call your API from `movable` or `droppable`.
- With `reorder` off the request has `to.index: null` and `to.beforeId: null`, a drop into the source column does nothing, there is no dashed slot (the old place fades instead), and there are no "Move up"/"Move down" entries.
- With `reorder` on, `to.index` is the index in the loaded cards of the target column without the moved card, and `to.beforeId` is the card right after the drop point. **`beforeId: null` means after the last loaded card**: the end of the column when every page is loaded; otherwise the server decides where the card goes.
- One move waits at a time for the whole board (`pendingId`). The card shows "Saving move…".

| `onMove` result | Data | Screen | Output | Announced |
| --- | --- | --- | --- | --- |
| `true` or nothing | changed (Items / Data source above) | card in its new place, focus follows it | `sdMove(request)` after the change | moved |
| `false` | unchanged | back in place, error on the card with Dismiss | `sdMoveError({ request, reason: 'rejected' })` | rejected |
| `'cancel'` | unchanged | back in place, no error | — | cancelled |
| throw / reject | unchanged | as `false` | `sdMoveError({ request, reason: 'error', error })` | error |

Return `'cancel'` when the user stops your own flow, for example closes the dialog that asks for a reason. The error band of the board shows only when the failed card is not on screen (filtered out, collapsed).

`request.signal` aborts, and the result is ignored, when `items`, `option` or `columns` get a new reference, when the source or target column reloads (data source; "Show more" does not count), when the board becomes `disabled` or `readonly`, and on destroy. Abort cannot undo a write your backend already made: reconcile your data and enforce permissions on the server.

## Selection

Click, tap, `Enter` or `Space` on a card selects it (`selectedId`, `sdSelect`). A press that moves 5px or more starts a drag and does not select. `Esc` inside a card clears the selection. The selected card has a primary outline and `aria-current="true"`. Use `sdSelect` to open a drawer; set `selectedId` back to `null` when the drawer closes if you do not want the card to stay marked.

## Keyboard

The card's name button is its tab stop.

| Keys | Action |
| --- | --- |
| `Enter`, `Space` | Select. |
| `Esc` | Clear the selection. |
| `Alt` + `←` `→` | Move to the next column that accepts the card: skips disabled, collapsed and `droppable`-refused columns. Reversed in RTL. |
| `Alt` + `↑` `↓` | With `reorder` on only: one place up or down in the loaded cards. |

Every card also has a "⋯" movement menu ("Move up", "Move down" with `reorder`, then "Move to {column}" for each other column), the touch and keyboard alternative to dragging. On touch, a 400ms press starts a drag; a tap selects; a horizontal swipe scrolls the board.

## Templates

| Directive | Context | Replaces |
| --- | --- | --- |
| `ng-template[sdKanbanCardTemplate]="option"` | `$implicit`/`card`, `column`, `index`, `pending`, `selected` | The content of the card's name button (default: the bold title). |
| `ng-template[sdKanbanCardActionsTemplate]="option"` | same | An end-aligned row of actions under the card body. |
| `ng-template[sdKanbanColumnTemplate]` | `$implicit`/`column`, `total` (`null` while unknown), `visibleCount`, `summary`, `collapsed` | The column label. |
| `ng-template[sdKanbanColumnActionsTemplate]` | same | Extra header controls before the collapse button. |

Pass `option` to the card directives so `card.data` is typed. **The card template is rendered inside a `<button>`**: no buttons, links, inputs, selects, textareas or `[tabindex]` there (dev mode warns once when it finds one). Put controls in `sdKanbanCardActionsTemplate`; honour `pending` and your permissions there. Card metadata (codes, dates, badges, avatars) belongs in the card template, with existing components such as `sd-badge` and `sd-avatar`.

```html
<sd-kanban [columns]="columns" [items]="cards()" [option]="option">
  <ng-template [sdKanbanCardTemplate]="option" let-card>
    <strong>{{ card.title }}</strong>
    <span>{{ card.data?.key }}</span>
  </ng-template>
  <ng-template [sdKanbanCardActionsTemplate]="option" let-card let-pending="pending">
    <sd-button type="text" size="sm" title="Details" [disabled]="pending" (click)="open(card)" />
  </ng-template>
</sd-kanban>
```

Card content is clipped to the card (`contain: paint`, which keeps hit testing and repaints cheap while dragging a large board). Menus, tooltips and popovers must render in an overlay, as Core UI ones do.

## Layout

The board scrolls horizontally inside its container. Lanes are 280px (`flex: 1 0 280px`). Under 600px of **host** width (`ResizeObserver`, so a board in a narrow column of a desktop page counts) the board is compact: lanes of 260px (collapsed 64px); the root gets `data-compact`. There is no single-column mode. With a coarse pointer the "⋯" button, Dismiss, Retry and "Show more" are at least 40px high.

Each lane has the neutral `--sd-kanban-lane-bg`; the column `color` marks an 8px dot before the label, or tints `prefixIcon`. The header shows the label, the `summary` line under it (12px, secondary, cut with an ellipsis) and the count. While dragging, the cursor is `grabbing`, only the lane under the pointer is highlighted, and lanes refused by `droppable` fade to 45% with a not-allowed cursor. With `reorder` off the old place of the card stays drawn at 40%. Cards use `--sd-surface` with a `--sd-kanban-card-border` outline and no shadow. The "⋯" button is transparent with a mouse until the card is hovered or focused, pending, failed or its menu is open; on touch it is always shown. The six `--sd-kanban-*` tokens are listed in `assets/THEME.md`.

## Accessibility

- A region named by `ariaLabel`; one polite status region announces selection, pending, moved, rejected, errors, cancelled and refused drops. The board's error band is plain text read through that region.
- Lanes are labelled by their heading. A refused lane's list has `aria-disabled="true"` while dragging; a list loading its first page has `aria-busy="true"`.
- The card name button is described by the hidden instructions (which depend on `reorder`) and, after a failure, by the error on the card.
- `forced-colors`: lanes get a `CanvasText` border and the selected card a `Highlight` outline. `prefers-reduced-motion` stops transitions.

## E2E hooks

With `autoId` the root has `data-autoid="components-kanban-{autoId}"`, a lane `…-column-{token}` and a card `…-card-{token}`, where `token` is `encodeURIComponent(id)`.

Always present (with or without `autoId`):

| Element | Attributes |
| --- | --- |
| Root | `data-compact` |
| Lane (`section`) | `data-column-id` (token), `data-color`, `data-status` (data source: `idle`, `loading`, `loading-more`, `error`), `data-blocked` (refused while dragging) |
| Lane header | `data-summary` on the summary line |
| Card (`article`) | `data-card-id` (token), `data-selected`, `data-pending`, `data-movable` |
| Card name button | `data-kanban-card-main` (token): the element to click, focus or drag |
| Movement menu button | `data-kanban-menu` (token) |
| Lists | `data-skeleton` (first load), `data-load-error` (first page or a later page), `data-load-more` (token of the column) |
| Buttons | `data-action="retry"` |
| While dragging | `data-dragging` on the board (`.sd-kanban__board`); `data-origin`: the faded old place with `reorder` off |

## Migration from the previous API

The new API is a breaking change without aliases.

| Before | Now |
| --- | --- |
| `[(model)]="tickets"` with `option.getId`, `getColumnId`, `getTitle`, `withColumn` | `[items]="cards"`: map once to `SdKanbanCard<T>` (`{ id, columnId, title, data: ticket }`). Update your own array from `sdMove` when you need it. |
| `SdKanbanId` (`string \| number`; `1` and `'1'` differ) | `string` |
| `option.getSearchText` | `card.searchText` (default `title`) |
| `option.filter` | Filter the `items` you pass, or on the server with `dataSource`. |
| `option.searchable` (default `true`) | Input `searchable` (default `false`). |
| `option.collapsible` | Input `collapsible`. |
| No `option.move`: local moves, committed at once | No `option.move`: no moving. Accept locally with `onMove: () => true`. |
| `option.canMove(request)` | `option.move.movable(card)` and `option.move.droppable({ card, from, to })` |
| `option.move(request)` | `option.move.onMove(request)`, which may also return `'cancel'` |
| Reordering inside a column always on | `option.move.reorder` (default `false`: column change only) |
| Request `item`, `itemId`, `fromColumnId`, `toColumnId`, `fromIndex`, `toIndex`, `previousItems`, `nextItems` | `card`, `card.id`, `from.columnId`, `to.columnId`, `from.index`, `to.index` (`null` without `reorder`), `to.beforeId`; no data arrays |
| `move(itemId, toColumnId, toIndex?, source?)` | `move(cardId, { columnId, beforeId? }, source?)` |
| `[loading]`, `[error]`, `(sdRetry)` | Per column with `option.dataSource`: skeleton, error with Retry, `sdLoadError` |
| `modelChange`, `sdChange` | `sdMove`, emitted after the data changed |
| Card template context `item` | `card` (`$implicit` is the card; your object is `card.data`), plus `selected` |
| Column template context `count` | `total` (`null` while unknown) |
| Drag handle on the card | The whole card is dragged; the name button is the tab stop and the keyboard target. |
| autoId token `` `${typeof id}-${encodeURIComponent(id)}` `` | `encodeURIComponent(id)` |
| Narrow layout under 600px of viewport (`@media`) | Under 600px of host width (`data-compact`) |

## Limits (this release)

- No swimlanes, realtime transport, WIP limits, card CRUD or sorting by a field of `data`.
- No virtual scrolling. Rendering grows with the number of cards and the weight of the card template; page long columns with `dataSource` and `pageSize`.

## Anti-patterns

- Do NOT pass `items` from a method call or a `.map()` in the template: every change detection is a new reference, which replaces the data and cancels a pending move.
- Do NOT mutate `items`, the cards, or what `onLoad` returned; pass a new array, a new `option`, or call `reload()`.
- Do NOT call your API from `movable` or `droppable`: they run while rendering and dragging. Decide in `onMove`.
- Do NOT put controls in the card template; use the actions template.
