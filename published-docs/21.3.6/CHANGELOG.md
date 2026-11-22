# @sdcorejs/angular 21.3.6

Release tag `v3.6`, published 2026-11-22.

Packages `19.3.6` · `20.3.6` · `21.3.6` · `22.3.6`, validated against `*.3.5`.

> [!IMPORTANT]
> **Before upgrading:** `sd-tab-router-outlet` now identifies a tab by its path only — the same path with another query or fragment reuses the open tab and its component instead of opening a new tab; screens that read their own query params must subscribe to `ActivatedRoute.queryParamMap`; a standalone `sd-card` (outside `sd-card-group`) is now `static` and no longer toggles — add `behavior="select"` to keep the toggle; `@sdcorejs/angular/components/history` (`sd-history`) is removed — move to `sd-timeline`; the panels of `sd-query-bar` are no longer `mat-menu` — selectors such as `.mat-mdc-menu-panel` must move to the `sd-query-panel` classes or the new `data-autoid` values, and the `sd-table` header filter icon announces `aria-haspopup="dialog"` with the popover editor; a `required` query-bar field now behaves as pinned and keeps its value; custom i18n catalogs must drop `core.component.query-bar.swap-field`; `sd-kanban` takes `SdKanbanCard<T>` cards through `items` or `option.dataSource` instead of `[(model)]` with mapping functions, and `option.move` becomes `{ movable, droppable, reorder, onMove }` — follow the conversion table in `sd-kanban.md`; `@sdcorejs/angular/services/confirm` no longer exports `DialogConfirmComponent` and `DialogData` — open confirm prompts through `SdConfirmService`; an `sd-tree` selection action without `color` is now `secondary` (was `primary`), and from the third action on it is an entry of "More" with a new `data-autoid`; the external filter settings menu of `sd-table` no longer has the `…-external-setting-menu` and `…-external-setting-<field>-checkbox` autoIds — its entries are `menuitemcheckbox` items.

**Highlights**

- `syncQueryParams` on `sd-table`, `sd-tab-group` and `sd-anchor`: filters, sort, page, selected tab and current section go into the URL, so a copied link opens the same state
- `sd-card` gets `behavior` (`static`, `link`, `select`) and five content layouts (`stat`, `option`, `entity`, `file`, `shortcut`) with shared `loading`, `error` and `size`; the score cards of `modules/pattern` use `layout: 'stat'`
- `sd-timeline` (`@sdcorejs/angular/components/timeline`): activity timeline with comment, change and event layouts, day groups and cursor paging; it replaces `sd-history`
- `sd-calendar` (`@sdcorejs/angular/components/calendar`): month, week, day and agenda views with `dataSource.onLoad`, create by click/sweep/Enter and move by drag, edge or `Alt` + arrows through `onMove` (which can also answer `'cancel'`)
- `sd-scheduler` (`@sdcorejs/angular/components/scheduler`): resource rows (rooms, vehicles, people) in day, week and month views, collapsible groups, create by sweeping a row, and move on two axes with `droppable` and `axis` through the same `onMove` pipeline as `sd-calendar`
- `sd-kanban` new API: cards as `SdKanbanCard<T>`, a data source per column with cursor paging, totals and summaries, `droppable` checked while dragging, card selection and dragging by the whole card
- `sd-query-bar`: one panel frame (the `sd-button` Action Popover) for the field picker, the chip popover and saved filters instead of `mat-menu`; saved filters with Undo and empty / error states; required fields always keep a chip and a value; an **Add condition** box in inline mode; `sd-table` saves its query-bar filters with `filter.queryBar.savedFilters`
- `sd-tree` navigation mode for tree-detail screens: an open node (`activeId`) revealed from the URL, server search with `tree.onSearch`, counts on items, keyboard access to row commands, and the selection bar of `sd-table`

### Changed (BREAKING for consumers)

#### Card

- A standalone `sd-card` (outside `sd-card-group`) is `static` by default: no role, no focus, its native click passes through, it no longer toggles `selected()` and it never emits `(click)`. Cards inside a group still default to `select` and look and behave as before.
  - **Migration:** add `behavior="select"` to a standalone card that must toggle.

    ```diff
    - <sd-card #card="sdCard" value="participating" (click)="onToggle(card.selected())">…</sd-card>
    + <sd-card #card="sdCard" behavior="select" value="participating" (click)="onToggle(card.selected())">…</sd-card>
    ```

- `value` is optional (`NonNullable<T> | undefined`). It is still required for a `select` card inside a group: without it the card logs a dev-mode error and ignores clicks. `SdCard<T>` infers `T` from `[value]` only when it is bound.

#### Confirm

- `@sdcorejs/angular/services/confirm` no longer exports `DialogConfirmComponent` and the `DialogData` interface. The component is an internal detail of `SdConfirmService`; it now also runs inside a bottom sheet, so its `dialogRef` can be absent.
  - **Migration:** open confirm prompts through `SdConfirmService` instead of `MatDialog.open(DialogConfirmComponent, …)`.

    ```diff
    - import { DialogConfirmComponent } from '@sdcorejs/angular/services/confirm';
    - this.dialog.open(DialogConfirmComponent, { data: { title, message, yesTitle, noTitle } });
    + import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
    + await this.confirm.confirm(message, { title, yesTitle, noTitle });
    ```

#### History

- `@sdcorejs/angular/components/history` is removed: `SdHistoryItem` (`sd-history`), `ViewDateTimePipe` (`viewDateTime`), the i18n key `core.component.history.by` and the tokens `--sd-history-line`, `--sd-history-meta`, `--sd-history-meta-strong`. Use `sd-timeline` with `layout: 'event'`; `groupBy="none"` keeps the full `HH:mm dd/MM/yyyy` time of the old list.
  - **Migration:**

    | `SdHistoryItemType` | `SdTimelineItem` |
    | --- | --- |
    | — | `id` (new, required) |
    | — | `content.layout: 'event'` |
    | `title` | `content.data.title` |
    | `status { title, color, icon }` | `content.data.badge` (`SdBadgeData`); `icon` can become the entry `icon` |
    | `date` | `at` (required) |
    | `actor` (username) | `actor.name` (display name; no "By @" prefix) |
    | `source` | `source` |
    | `description` | `content.data.note` |

    ```diff
    - <sd-history [items]="history" />
    + <sd-timeline groupBy="none" [items]="timeline" />
    ```

#### Kanban

- Cards are `SdKanbanCard<T>` (`id: string`, `columnId`, `title`, `searchText?`, `data?: T`) passed through `items`, or loaded per column by `option.dataSource`. Removed: the `model` input and `modelChange`, `sdChange`, the `loading` and `error` inputs, `sdRetry`, the type `SdKanbanId` and `option.getId`, `getColumnId`, `getTitle`, `getSearchText`, `withColumn`, `filter`, `canMove`, `searchable`, `collapsible`.
  - A new `items` reference replaces the board's copy and cancels a pending move: build the array once (a `computed`), never in the template.
  - Ids are strings; `1` and `'1'` are no longer different cards.
- `option.move` is `{ movable?, droppable?, reorder?, onMove }`. Without it nothing moves (the old local mode committed moves at once; accept locally with `onMove: () => true`). `reorder` defaults to `false`: a drop only changes the column.
  - `SdKanbanMoveRequest<T>` is `{ card, from: { columnId, index }, to: { columnId, index, beforeId }, source, signal }`; `to.index` and `to.beforeId` are `null` without `reorder`, and `beforeId: null` means after the last loaded card. `previousItems` and `nextItems` are gone.
  - `move(itemId, toColumnId, toIndex?, source?)` becomes `move(cardId, { columnId, beforeId? }, source?)`.
- `sdMove` emits after the board's data changed; read the new place from the request.
- `pendingId` is a read-only signal (it was a writable `signal`); the board alone sets it.
- `searchable` is an input and defaults to `false` (the option defaulted to `true`); `collapsible` is an input.
- The drag handle is gone: the whole card drags (400ms press on touch), and the card's name is a button that is the tab stop and the keyboard target. The card template renders inside that button, so controls belong in `sdKanbanCardActionsTemplate`. Card template context: `item` becomes `card` (your object is `card.data`); column template context: `count` becomes `total` (`null` while unknown).
- The narrow layout follows the host width under 600px (`data-compact`) instead of `@media (max-width: 599px)`.
- `data-autoid` tokens of cards and columns are `encodeURIComponent(id)` (was `` `${typeof id}-${encodeURIComponent(id)}` ``).
- i18n: `core.component.kanban.move-card` is removed; `instructions` no longer mentions a handle; `invalid-data` no longer mentions mappings.
  - **Migration:** map your domain objects once and replace the option. `portal-template` (`src/modules/component/features/kanban`, its e2e and `docs/core-demo-coverage.md`) uses the old API and needs this when it upgrades.

    ```diff
    - readonly option: SdKanbanOption<Ticket> = {
    -   getId: item => item.key,
    -   getColumnId: item => item.state,
    -   getTitle: item => item.subject,
    -   withColumn: (item, columnId) => ({ ...item, state: String(columnId) }),
    -   canMove: request => this.canTransition(request.fromColumnId, request.toColumnId),
    -   move: request => this.api.moveTicket(request.itemId, request.toColumnId, request.signal),
    - };
    + readonly cards = computed(() => this.tickets().map(t => ({ id: t.key, columnId: t.state, title: t.subject, data: t })));
    + readonly option: SdKanbanOption<Ticket> = {
    +   move: {
    +     droppable: ({ from, to }) => this.canTransition(from.id, to.id),
    +     onMove: request => this.api.moveTicket(request.card.id, request.to.columnId, request.signal),
    +   },
    + };
    ```

    ```diff
    - <sd-kanban [columns]="columns" [option]="option" [(model)]="tickets" [loading]="loading()" [error]="error()" (sdRetry)="load()">
    -   <ng-template [sdKanbanCardTemplate]="option" let-ticket>{{ ticket.subject }}</ng-template>
    + <sd-kanban [columns]="columns" [option]="option" [items]="cards()" searchable (sdMove)="saved($event)">
    +   <ng-template [sdKanbanCardTemplate]="option" let-card>{{ card.data?.subject }}</ng-template>
      </sd-kanban>
    ```

    The full before/after table is in `sd-kanban.md` ("Migration from the previous API").

#### Query bar

- The field picker, the chip popover and saved filters are no longer `mat-menu` panels: they open in a CDK Overlay with the frame of the `sd-button` Action Popover (`assets/scss/core/_popover-panel.scss`, shared with it pixel for pixel). Selectors such as `.mat-mdc-menu-panel`, `button[mat-menu-item]` or `[matMenuTriggerFor]` no longer match anything in the bar.
  - **Migration:** use the panel classes `sd-query-panel` (`--list` / `--form`) with `c-field-picker-menu`, `c-chip-popover`, `c-saved-filters-menu`, or the new `data-autoid` values (see Added).

    ```diff
    - page.locator('.mat-mdc-menu-panel button[mat-menu-item]', { hasText: 'Trạng thái' })
    + page.locator('[data-autoid="orders-panel-field-picker"] [role="option"]', { hasText: 'Trạng thái' })
    ```

- `required` now implies `pinned`: the bar adds the chip of a required field when it is missing, the chip has no × and is left out of the field picker, its value cannot be emptied once set, and `clearAll()` keeps it. A host no longer needs to add required chips itself; a field that must stay removable cannot be `required`.
- The i18n key `core.component.query-bar.swap-field` is removed from the five locales (the bar never offered changing the field of a chip).
  - **Migration:** custom catalogs typed as `I18nCatalog` must drop the key.

#### Table

- Query-bar mode with `queryBar.editor: 'popover'`: the header filter icon announces `aria-haspopup="dialog"` (was `menu`), since the chip popover is a dialog.
  - **Migration:** E2E selectors that match `aria-haspopup="menu"` on the header icon must match `dialog`.
- The settings menu of the external filters is an `sd-button` Action Popover of toggle entries (see Changed). The autoId of the entries (`…-external-setting-<field>`) is kept, now on a `button[role="menuitemcheckbox"]` with `aria-checked`; the `…-external-setting-menu` autoId of the old `mat-menu` element and the `…-external-setting-<field>-checkbox` autoId of the `sd-checkbox` inside each entry are gone.
  - **Migration:** open the menu with the settings button, then click the entry and read `aria-checked` instead of the checkbox.

    ```diff
    - page.locator('[data-autoid="orders-external-setting-salary-checkbox"] input').check()
    + page.locator('[data-autoid="orders-external-setting-salary"]').click()
    + await expect(page.locator('[data-autoid="orders-external-setting-salary"]')).toHaveAttribute('aria-checked', 'true')
    ```

#### Tab router

- A tab is identified by its path only (the URL before `?` and `#`); the key was a hash of the path and the query params, and a fragment without a query also split tabs.
  - Navigating to the path of an open tab — from a link, a menu, the back button or a component writing its query — activates that tab and keeps its component instance; only `state.forceReload: true` still recreates it. The tab stores the latest `queryParams` (a new `SdTabRouterTab` descriptor, so a function `name` sees them), and clicking the tab later goes back to that query.
  - `SdTabActivated` fires when a tab goes from the background to active; a query change on the tab that is already open does not fire it again.
  - The `ActivatedRoute` injected inside a tab is now a live proxy (`instanceof ActivatedRoute` still holds): when the tab is opened again it follows the new route of the path, so `queryParamMap`, `queryParams`, `paramMap`, `fragment`, `data` and `snapshot` show the latest values. Before, a subscription made by the tab component stopped emitting after the user switched away and back.
  - **Migration:** a screen that reads a query param of its own must subscribe and update; reading `route.snapshot.queryParamMap` once in the constructor or `ngOnInit` keeps the first value. When each record needs its own tab, put the identity in the path.

    ```diff
    - readonly id = inject(ActivatedRoute).snapshot.queryParamMap.get('id');
    + readonly id = toSignal(inject(ActivatedRoute).queryParamMap.pipe(map(params => params.get('id'))));
    ```

    ```diff
    - { path: 'orders/detail', component: OrderDetailPage }   // /orders/detail?id=5 and ?id=6 now share one tab
    + { path: 'orders/detail/:id', component: OrderDetailPage } // one tab per order
    ```

#### Tree

- An action of the selection bar without `color` follows `sd-button` and is `secondary`, as in `sd-table`; it was `primary`.
  - **Migration:** set `color: 'primary'` on the actions that must stay primary.

    ```diff
    - { icon: 'drive_file_move', title: 'Chuyển', click: move }
    + { icon: 'drive_file_move', title: 'Chuyển', color: 'primary', click: move }
    ```

- Up to two selection actions are buttons; from the third action on, an action is an entry of "More". Its `data-autoid` is `components-tree-<autoId>-selection-action-<index>` (it was `components-button-components-tree-<autoId>-selection-action-<index>`), on a menu item that exists only while the menu is open. The first two actions and the clear button keep their autoIds.
  - **Migration:** E2E tests open "More" first, then match the entry without the `components-button-` prefix.

### Added

#### Anchor

- `syncQueryParams` (`booleanAttribute`, default `false`): writes the current section to the query param `anchor-<autoId>` (the `key` of `sd-anchor-item`, or its 0-based position without a key) once the section has stayed active for 300ms, and scrolls to that section when the link is opened or the param changes (a key whose section renders later waits for it). The first section removes the param. Needs `autoId`.

#### Assets

- Opt-in `h-dvh`, `h-svh`, `min-h-dvh` and `min-h-svh` sizing utilities with `vh` fallbacks. `h-screen` and `min-h-screen` keep their existing meaning. See `assets/STYLE-GUIDE.md#83-mobile-viewport` for browser support, keyboard limitations and physical-device checks.

#### Button

- `checked` on `sd-button-item` (`boolean | null | undefined`, default `undefined`): `true` / `false` makes the entry a toggle — `role="menuitemcheckbox"` with `aria-checked`, a check box before the label (muted when off, primary when on) — and the mouse, Enter and Space emit `click` without closing the menu, with focus kept on the entry. `null` / `undefined` keeps a plain `menuitem`.

#### Calendar

- `sd-calendar` (`@sdcorejs/angular/components/calendar`, `SdCalendar<T>`): month, week, day and agenda views of `SdCalendarEvent<T>` (`id`, `title`, `start`, `end`, `allDay`, `color`, `occurrence`, `data`).
  - `option.dataSource.onLoad({ from, to, view, signal })` per range, with abort of late results, `reload()`, a load-error band with Retry and the `sdLoadError` output.
  - `option.create = { creatable?, onCreate }`: click, sweep, tap or `Enter` on an empty slot; the dashed block waits for `onCreate`.
  - `option.move = { movable?, onMove }`: drag, bottom edge and `Alt` + arrows; `onMove` answers `true`/nothing (accept), `false` (reject), `'cancel'` (silent) or throws; `sdMove`, `sdMoveError` and the public `move(eventId, to, source)` for undo. `request.source` is `'drag'`, `'resize'` (bottom edge or `Alt` + `Shift` + ↑ ↓), `'keyboard'` or `'api'`; a block that has the focus keeps it after its move.
  - Recurring occurrences ask for the scope (`this`, `following`, `all`) before `onMove`.
  - Two-way `view`, `date`, `selectedId`; `step`, `firstDayOfWeek`, `hideWeekends`, `workingHours`, `holidays`, `minDate`/`maxDate`, `scrollTime`, `agendaDays`, `dimPast`, `transform`, `readonly`, `disabled`; `SD_CALENDAR_CONFIGURATION`.
  - Compact layout under 600px of host width, 44px targets on a coarse pointer at every width, touch, print, forced colors and reduced motion; dates in `ISdCoreConfiguration.timeZone`.
- Theme tokens `--sd-calendar-line`, `--sd-calendar-line-half`, `--sd-calendar-off-hours`, `--sd-calendar-now`, `--sd-calendar-today`, and the i18n keys `core.component.calendar.*` in the five locales.

#### Card

- `behavior: 'static' | 'link' | 'select'` (`SdCardBehavior`): resolves to `select` inside `sd-card-group` and to `static` elsewhere.
  - `link` wraps the card in one `<a class="sd-card__link">`: `RouterLink` from `link` + `queryParams`, or `href` + `target` (`_blank` adds `rel="noopener noreferrer"`); `link` wins over `href` with a dev-mode warning. `(click)` emits after navigation started. A disabled link has no `href`, `aria-disabled="true"` and `tabindex="-1"`; the focus ring is drawn on the card.
  - A group ignores cards whose behavior is not `select`, so a read-only card can sit in a filter group.
- `content: SdCardContent` renders a built-in layout (`{ layout, data }`), checked at compile time per layout; without it the card projects `ng-content` as before.
  - `stat` (`SdCardStatData`): label, value, delta chip, context line, optional icon. `format` is `number` (with `precision`), `compact` (`86,4 triệu` in Vietnamese, `86.4M` elsewhere; `SD_CARD_CONFIGURATION.compactDisplay` overrides), `percent` (a ratio) or `text`, in the active i18n locale. `null` shows `—`; the full number goes into `title` and the accessible name. A `link` stat whose value is `0` renders static.
  - `option` (`SdCardOptionData`, `select` only): icon tile, title, description, badge and a check mark. A single group of option cards becomes `role="radiogroup"` with one tab stop and arrow-key selection; a multiple group uses checkboxes.
  - `entity` (`SdCardEntityData`): avatar (text, image or icon), title, subtitle, badge and up to three meta fields; `sm` is one row.
  - `file` (`SdCardFileData`): thumbnail or a type icon (pdf, sheet, doc, image, other) from the MIME type or extension, a two-line name and "TYPE · size".
  - `shortcut` (`SdCardShortcutData`, `link` only): icon, label, description; `sm` is one row.
  - An invalid behavior for a layout (for example `option` with `link`) logs a dev-mode error and renders static.
- `size: 'md' | 'sm'` (`SdCardSize`); without it a card turns `sm` while the new `SD_CARD_LAYOUT` token reports `compact()`. `sd-page-list` provides it. `option` and `file` stay `md`.
- `loading` (skeleton, `aria-busy`, no activation, same height) and `error` with the `sdRetry` output (Retry never triggers the card behavior); both need `content`.
- `SdCardActionsDirective` (`<ng-template sdCardActions>`): an action area for `entity` (md) and `file`, outside the anchor of a link card; clicks inside it never select or navigate.
- Global classes `sd-card-grid` (auto-fit columns of at least 200px, 12px gap) and `sd-card-grid--sm` (wrapping row, 8px gap).
- i18n keys `core.component.card.{error,retry,delta-unchanged,delta-up,delta-down,loading}` in the five locales.

#### Confirm

- `view?: 'dialog' | 'bottom-sheet'` on every `SdConfirmService` method (`confirm`, `withInput`, `withRadio`, `withSelect`, `withDate`, `withDatetime`) forces the presentation; omitted, it follows the device. Same name and values as the `view` input of `sd-modal`.
- `enableBackdropClose?: boolean` on every method: `true` lets a backdrop click or the Esc key close the prompt (the promise rejects with `'CANCEL'`). Omitted = `false`. When passed, it decides and `disableBackdropClose` is ignored.

#### Kanban

- `option.dataSource.onLoad({ columnId, cursor, pageSize, keyword, signal })` loads each column on its own, with `pageSize` (20) and `loadMore: 'button' | 'auto'`.
  - Per column: three skeleton blocks on the first load, "Show {count} more" or an `IntersectionObserver` feed, first-page and later-page errors with Retry, `sdLoadError({ columnId, error })`, `reload(columnId?)` and `loadMore(columnId)`.
  - `total` and `summary` of the first page set the header count and a summary line under the label (`SdKanbanColumn.summary` without a data source). The count shows "n+" while more pages exist and "–" before a collapsed column first loads; collapsed columns load when expanded.
  - `keyword` reloads the loaded columns after 300ms; a new `option` reloads every column; a new `columns` loads only the new ones. Late results, cards of another column, cards without a title and duplicate ids are dropped (dev-mode warning).
  - An accepted move updates both columns and their totals without calling `onLoad` again. A column without its first page (collapsed and never opened, loading, failed) is not a destination until it loads, and the cards of a column that loads its first page again cannot move until it is back.
- `option.move.droppable({ card, from, to })` runs when a drag starts: refused lanes fade, get `data-blocked` and `aria-disabled`, and refuse the drop ("Can't move to {column}" is announced). The menu disables those destinations and `Alt` + `←` `→` skips them.
- `option.move.onMove` may return `'cancel'`: the card goes back without an error or `sdMoveError`, and "Change cancelled" is announced.
- Card selection: `selectedId` (two-way, back to `null` when the card leaves the data) and `sdSelect`, from a click, tap, `Enter` or `Space`; `Esc` clears it. The selected card has a primary outline and `aria-current="true"`; the card template context has `selected`.
- With `reorder` off the old place of a dragged card stays drawn at 40% instead of a drop slot; the cursor is `grabbing` while dragging.
- E2E hooks: `data-status`, `data-blocked`, `data-summary`, `data-selected`, `data-pending`, `data-movable`, `data-kanban-card-main`, `data-kanban-menu`, `data-skeleton`, `data-load-error`, `data-load-more`, `data-action="retry"`, `data-compact`, and a `data-autoid` on each column.
- i18n keys `core.component.kanban.{load-more,loading,load-error,drop-blocked,cancelled,instructions-column,selected}` in the five locales; Retry and Dismiss use `core.common.retry` and `core.common.dismiss`.

#### Modal

- `enableBackdropClose` input on `sd-modal`: `true` lets a backdrop click or the Esc key close the modal, `false` blocks both. Not passed (`undefined`/`null`), `disableBackdropClose` decides as before; when passed, `enableBackdropClose` decides. A bare attribute means `true`. With `beforeClose`, an allowed backdrop click or Esc still goes through the guard.

#### Query bar

- Inline mode: an **Add condition** box (`core.component.query-bar.add-condition`, `role="combobox"`) at the end of the chips replaces the **+** button and drives the field list (`aria-expanded`, `aria-controls`, `aria-activedescendant`). It opens on a click in the box or on the empty part of the chip row, on typing, ↓ or Alt+↓ — not when Tab only focuses it. Typing filters (accents ignored) and points at the first match; Enter picks it and empties the box; Enter on an empty box with the list closed applies like Search; Escape closes and empties; Backspace on an empty box focuses the last chip, a second Backspace removes it (never a required or pinned chip); a finished chip sends focus back to the box. Disabled when every field is used. Popover mode keeps **+**. `data-autoid` `<autoId>-add-condition`.
- `data-autoid` for the search box (`<autoId>-search`, `-search-clear`), the panels (`-panel-field-picker`, `-panel-chip`, `-panel-saved-filters`) and saved filters (`-saved-filters`, `-saved-filter-<i>`, `-saved-filter-<i>-delete`, `-saved-filters-save`).
- `SdQueryBar.canSaveFilter()` and `isLocked(field)`.
- i18n keys `core.component.query-bar.{saved-filters.heading,saved-filters.deleted,saved-filters.undo,saved-filters.read-error,saved-filters.write-error,search-clear,add-condition,required-min-one,remove-filter}` in the five locales.

#### Scheduler

- `sd-scheduler` (`@sdcorejs/angular/components/scheduler`, `SdScheduler<T, R>`): one row per `SdSchedulerResource<R>` (`id`, `title`, `description`, `group`, `icon`, `avatar`, `workingHours`, `data`), a day on the hour axis or a week or a month on the day axis, for `SdSchedulerEvent<T>` (the calendar event plus `resourceId`).
  - `option.dataSource.onLoad({ from, to, view, resourceIds, signal })` per range; a `resources` array with other ids loads again (the same ids only redraw the rows), an empty one shows the empty state without a load.
  - Resource groups (`group`) that collapse and stay collapsed across ranges; per-resource `workingHours`.
  - `option.create = { creatable?, onCreate }`: sweep on one row, click, tap or `Enter`; the context carries `resource` and `resourceId`.
  - `option.move = { movable?, droppable?, axis?, onMove }`: drag on two axes (row and time), the end handle and `Alt` + arrows (`Alt` + ↑ ↓ to the nearest resource `droppable` allows); `droppable({ event, to, resource })` is checked while dragging and for `move()`; `axis: 'time' | 'resource'` locks one axis. `onMove`, the recurring scope bar, `sdMove`, `sdMoveError` and `move(eventId, to, source)` behave as in `sd-calendar`.
  - Templates: `sdSchedulerEventTemplate`, `sdSchedulerResourceTemplate`, `sdSchedulerEmptyTemplate` and `sdSchedulerCellTemplate` (week and month cells instead of blocks, with `sdCellSelect`).
  - The grid is one tab stop with a cursor (`aria-activedescendant`); compact layout under 600px of host width, 44px targets on a coarse pointer at every width, touch, forced colors and reduced motion. It reuses `SD_CALENDAR_CONFIGURATION` and the `--sd-calendar-*` tokens; the size variables `--sd-scheduler-*` take `px`.
- i18n keys `core.component.scheduler.*` in the five locales.

#### Search field

- The internal search primitive (`sd-search-field`, `ɵSdSearchField`) gets size `xs`: 28px high, padding `0 4px 0 8px`, 6px gap, 13px text, 16px icon, 20px clear button; touch sizes as the other sizes. Used by `sd-query-bar` at `density: 'compact'`.

#### Tab

- `sd-tab-group` `syncQueryParams` (`booleanAttribute`, default `false`): writes the selected tab index to the query param `tab-<autoId>` and selects it again when the link is opened or the param changes. The tab selected when the group opened removes the param; an index on a disabled tab is ignored, and an index past the last tab waits for that tab to render. Needs `autoId`.

#### Table

- `syncQueryParams` (`booleanAttribute`, default `false`): writes quick search, column filters and operators, external filters, sort, page and page size to the query param `table-<autoId>` as compact JSON (`{"q","c","o","e","s","p","z"}`, only what differs from the default; the default state removes the param), and reads them back. Needs `autoId`.
  - A link wins over the cached filters and goes into the first read, so the table reads once; a param changed from outside is applied with one more read; a param that disappears is written back from the current state; malformed values, unknown fields, disabled column filters, operators outside the column's `filter.operator.list` and page sizes outside `paginate.pages` are ignored.
  - `paginate.total: 'unknown'` restores the page size only.
- `filter.queryBar.savedFilters: { key }` (query-bar mode, desktop): turns on the saved filters of the bar, stored in this browser under `sd-query-bar:savedFilters:sd-table:<key>`. A saved filter holds the chips, the AND/OR logic and the search term (not sort, columns or page size); applying one reads once and drops fields the table no longer has. Read from the table option only — `SD_TABLE_CONFIGURATION.filter.queryBar` cannot set it.
- Default operator lists for `string` and `number` columns: a column with `filter.operator.enable` and no `filter.operator.list` falls back to a list built into the library when `SD_TABLE_CONFIGURATION.filter.operator.list` has none for its type. It used to show no operator.
  - `string`: `CONTAIN`, `NOT_CONTAIN`, `EQUAL`, `NOT_EQUAL`, `START_WITH`, `END_WITH`, `NULL`, `NOT_NULL`, preselected `CONTAIN`. `number`: `EQUAL`, `NOT_EQUAL`, `GREATER_THAN`, `GREATER_OR_EQUAL`, `LESS_THAN`, `LESS_OR_EQUAL`, `NULL`, `NOT_NULL`, preselected `EQUAL`. Other column types have no built-in list.
  - The application configuration wins per column type, and an empty array turns the operators of that type off. Columns and applications that declare their own list keep their behavior, including no preselected operator without a `default`.
  - Such columns start showing the operator chip (and the operators in query-bar mode): the backend must support the listed operators, or the application narrows the list.
- Configuration by key, for portals whose modules call different backends: `SD_TABLE_CONFIGURATION` takes one configuration or several (an array in `useValue`, or `multi: true`), each with an optional `key`, like `SD_UPLOAD_FILE_CONFIGURATION` and `SD_PERMISSION_CONFIGURATION`; a table picks one with the new `option.configurationKey`.
  - The keyed configuration is merged field by field over the configuration without a `key` (the portal default), so a module declares only what differs, for example its own `filter.operator.list`. Arrays are replaced as a whole.
  - A missing or unknown `configurationKey` uses the portal default; two configurations with the same `key` throw. Applications that provide a single configuration are unchanged.

#### Timeline

- New entry point `@sdcorejs/angular/components/timeline` with `SdTimeline<T>` (`sd-timeline`).
  - Entries (`SdTimelineItem<T>`: `id`, `at`, `actor`, `icon`, `color`, `source`, `data`) take a body from `content: { layout, data }`: `comment` (framed text clamped to three lines with show more/less, `edited`), `change` (rows "label: old → new" with struck-through old text, dashes for empty values, badges, "+N more changes", `note`) and `event` (`badge`, `note`).
  - Marker: `sd-avatar` for an actor, otherwise the layout icon or `icon` in a neutral or `color` ring; `--sd-timeline-line` colours the connector.
  - `groupBy: 'day' | 'none'` (day headings "Today", "Yesterday", `dd/MM/yyyy` in the zone of `SdDateTimeService`, entries never reordered), `size: 'md' | 'sm'`, `emptyText`, `ariaLabel`, `autoId`, `headingLevel`.
  - `option.dataSource.onLoad({ cursor, pageSize, signal })` with `pageSize` (20) and `loadMore: 'button' | 'auto'`: skeleton, load-more button or `IntersectionObserver` feed, first-load and load-more errors with Retry, `sdLoadError`, `reload()` (aborts the running load) and `loadMore()`.
  - Relative times ("just now", "N min ago") within the last hour of today; `<time datetime>` with a zone title.
  - Templates `sdTimelineItemContent`, `sdTimelineItemActions`, `sdTimelineEmpty`; i18n keys `core.component.timeline.*` in five locales.

#### Tree

- `option.navigation` (default `false`): navigation mode for a tree-detail screen. A row click or Enter opens the node; the open node gets the selected background, a primary icon and `aria-selected`; a ticked checkbox no longer paints the row in this mode.
  - `activeId` (model on the component) holds the open node; `activeChange` and `option.onActivate` fire each time the user opens a node.
  - `reveal(id)` opens every ancestor and scrolls to the node with `scrollTop` without taking focus; lazy trees use the new `tree.onResolvePath`. Setting `activeId` from outside reveals the node; a newer change or a row click aborts the reveal in flight.
  - `expandedIds` (model on the component): when defined it is the source of the open state, both ways.
  - `reloadNode(id)`, `expand(id)`, `collapse(id)`, `focusNode(id)`.
- `count` on tree items: a number after the label, grouped by the active locale and read as "{label}, {count}".
- The row command trigger shows on focus, on the open node and always on touch screens; Shift+F10 or the ContextMenu key opens the menu of the focused row in navigation mode, and closing it returns focus to the row. i18n key `core.component.tree.open-menu`.
- `tree.onSearch` (lazy): `filter(text)` searches on the server (300ms debounce, the previous request is aborted) and shows the merged result paths in place of the tree, with nodes that are only on the way to a match muted. Clearing the text restores the previous open state. Selection made before or during the search is kept.
- The matching part of a label is highlighted while filtering, in static and lazy trees.
- Root states: an empty tree shows `core.component.tree.empty`, a search without a match shows `core.component.tree.no-match`, both inside `role="status"` (with `aria-busy` while the next server search runs); `sdTreeEmptyDef` (`SdTreeEmptyDefDirective`) replaces both with a template that receives `{ searching, text }`.

#### General

- i18n keys `core.common.retry` and `core.common.dismiss` in the five locales, shared by the Retry and Dismiss buttons of `sd-calendar`, `sd-scheduler` and `sd-kanban`.
- i18n keys `core.form.date.invalid-date` ("Ngày không hợp lệ") and `core.form.datetime.invalid-date` ("Ngày giờ không hợp lệ") in the five locales, for text that matches the format of `sd-date` / `sd-datetime` but names a day or a time that does not exist. Custom catalogs fall back to the key until they add them.
- The three `syncQueryParams` inputs share one behavior: the URL is updated with `replaceUrl` (no history entry per change), writes from several components in one turn go out as one navigation, other query params and the fragment are kept, a component whose route is not on screen (a background router tab, a page being left) does not write, and nothing happens without Angular routes. Without `autoId` nothing is synced and a warning is logged once.

### Changed

#### Confirm

- On mobile (`BrowserUtilities.isMobile()`, read once when the service is created — the source `sd-modal` uses) every `SdConfirmService` method opens a Material bottom sheet instead of a dialog. The two actions are full-width, 48px tall and stacked, with the accept button on top. Desktop keeps the dialog unchanged. Pass `view: 'dialog'` to keep the dialog on mobile.
  - The bottom sheet uses the panel class `sd-confirm-bottom-sheet`, takes its accessible name from the title as plain text, and keeps each method's initial focus target.
  - `width` of `confirm()` applies to the dialog only; the bottom sheet is always full-width.

#### Date

- `sd-date` no longer changes its value while a date is being edited, and no longer clears text that is not a date.
  - Text that is not a finished `dd/MM/yyyy` date, including a field that was just emptied, used to put `null` in the form control, `model` and `sdChange` on the first keystroke. The last committed date now stays until the text is a finished date (committed on that keystroke).
  - Leaving the field with unfinished text (`19/1`) or with a day that does not exist (`31/02/2026`) used to empty the field and commit `null`. The text now stays as typed, the committed value does not change, nothing is emitted, and the control carries a `date` error — "Sai định dạng" for unfinished text, the new "Ngày không hợp lệ" for a day that does not exist (raised as soon as it is typed in full) — so the parent form is invalid until the text is corrected. Enter reports the same error and commits nothing.
  - `null` is committed only when the **empty** field is left, on Enter over an empty field, or by the clear button.
  - While an existing date is being edited the form value is no longer `null` and `required` is not reported; it appears once the emptied field is left. Screens that relied on an invalid entry resetting the value to `null` must now check the control's validity. See [date](versions/v19/projects/sdcorejs-angular/forms/date/sd-date.md#typing-behaviour).

#### Datetime

- `sd-datetime` changes `model` / `sdChange` while typing only for a finished datetime: the text must match `dd/MM/yyyy HH:mm` or `dd/MM/yyyy HH:mm:ss` exactly. Before, every keystroke was parsed loosely, so retyping a month emitted January in between (`19/1/2026 10:30`), retyping an hour emitted 01:30, a three-digit year emitted year 202, and emptying the field emitted `null` at once. A field emptied while focused now keeps its value until it is left or Enter is pressed. Shorthand such as `1/2/2027 9:05` is still accepted on blur or Enter. Strings written to the control from code while the field is not focused are read as before. See [datetime](versions/v19/projects/sdcorejs-angular/forms/datetime/sd-datetime.md#typing-behaviour).
- `sd-datetime` reports a datetime that does not exist. Text such as `31/02/2026 10:30`, `29/02/2026 10:30`, `19/11/2026 25:30` or `19/11/2026 10:65` passed the format check on blur / Enter and was left in the field with no error, while the control stayed valid with the old value. It now raises the new "Ngày giờ không hợp lệ" error; the text and the committed value are kept. The `date` error clears as soon as the text becomes a real datetime, without waiting for blur.

#### Kanban

- On a coarse pointer the "⋯" button, Dismiss, Retry and "Show more" are at least 44px high (`--sd-control-height-coarse`, was 40px), as in `sd-calendar` and `sd-scheduler`.
- The card template and the card actions template render inside an `sd-kanban-card-outlet` element (`display: contents`, OnPush) with one context object per card, so a change of the board's own state (a saved move, a selection set through `selectedId`) checks only the cards it concerns. A style that reaches the template's root through a child combinator from `.sd-kanban__card-main` or `.sd-kanban__card-actions` must allow the extra element.
- The live region says "Saving {title}" while `onMove` runs (was "Moving {title}") and "Change cancelled" after `'cancel'`, the words of `sd-calendar`; "{title} moved to {column}, position {position}" keeps its own wording.

#### Pattern

- Drawers of `modules/pattern` open on the current screen instead of as child routes, so opening or closing one no longer changes the URL. Customer detail, create and update and category create and update are rendered with `@if` from a signal of the list; the 360° profile opens the update drawer over itself and shows the saved record.
  - Removed sample routes: `customer/create`, `customer/:id/detail`, `customer/:id/update`, `category/create?parent=`, `category/:id/update`. Only `customer/:id/360` stays a child route of the customer list.
  - Detail and update drawers take the record `id` and load it with `detail(id)` inside the drawer, showing loading and error with `sd-data-state` and a retry button. Detail switches to update by replacing the drawer, never stacking two.
  - The list routes and the profile route declare `canDeactivate: [sdPageFormLeaveGuard]`, so leaving with unsaved changes in a drawer still asks first.
  - `docs/drawer.md` describes the new rules; `docs/list.md`, the pattern README and the `/pattern` catalog follow.
- The score cards of the customer and order lists use `sd-card` with `layout: 'stat'`, `loading` until the counts arrive and automatic `sm` in compact mode; the order revenue tile is a `behavior="static"` card at the end of the group. The `.summary*` styles are gone; the group uses `sd-card-grid`. The compact row is 32px high (was 36px).
- The approval column of the order detail (`approval-steps`) uses `sd-timeline groupBy="none" size="sm"`: "created" with an `add` icon, submit (`send`, primary), approve (`check`, success, "Đã duyệt" badge) and reject (`close`, error, "Từ chối" badge, the reason as the note). It takes the new inputs `createdAt` and `creator`; the `.approval-steps*` styles are gone.
- Decision E14 in the pattern README: a screen that reads a query param of its own subscribes to `ActivatedRoute.queryParamMap` instead of reading the snapshot once (the tab router keeps the component when only the query changes), and table / tab / anchor state shared through links uses `syncQueryParams`. The order create and update pages follow it: they react to `?lines=sd-table` changing without being reopened.

#### Query bar

- The panels (see Changed (BREAKING)) open below the trigger, 4px away, flipping above without room; saved filters end-aligned. Escape, a click outside, Tab out and picking an item close them; focus returns to the trigger or to the `returnFocusTo` of `openField()` (a click on another focusable element keeps focus there). The chip popover commits its value on every way out. Opening a panel closes the other one. No backdrop: a click outside reaches the element under it.
  - Roles: field picker `listbox` (used fields `aria-disabled`), chip popover `dialog` named by the field label, saved filters `menu` (apply, delete and save buttons are `menuitem`). Triggers carry `aria-haspopup`, `aria-expanded`, `aria-controls`.
  - Field picker rows are 40px with 14px text (were 36px / 13px); group headings are 12px, not uppercase. Its find box (popover mode) appears from ten fields (was above eight) and is `sd-search-field` sm, a combobox: the arrows move `aria-activedescendant` while focus stays in it.
  - The find box reads "Tìm kiếm" / "Search" (`core.component.query-bar.find-field`, was "Tìm trường" / "Find field"). The listbox is named by what opens it — `core.component.query-bar.add-filter` in popover mode, `.add-condition` inline — instead of the find box label.
  - `openField()` called again for the chip whose popover is open closes it, as the menu backdrop did.
  - On a screen too short for the chip popover, its body scrolls and the header stays (the frame used to cut the content off).
- Saved filters: rows are an apply button and, beside it, a delete button (shown on hover or focus, always on a coarse pointer), with a heading, a divider and "Lưu bộ lọc hiện tại". Arrow keys move over the apply buttons and Save; → / Tab reach the delete button; Delete deletes. Deleting asks nothing and offers Undo in an `info` toast (back at its old index). Save is disabled when no chip has a value and the search box is empty. Empty, read-error (broken list; bad entries dropped one by one) and write-error states (the list is kept, an `error` toast, no exception text). Dates are read back as `Date`. The storage key is unchanged.
  - `core.component.query-bar.saved-filters.delete` takes `{name}` ("Xoá {name}").
- Required and pinned chips (see Changed (BREAKING)): a missing one is added empty (default operator), first and in field order, without emitting `(apply)`. A required chip with a value cannot be emptied: its operators drop `NULL` / `NOT_NULL` (`sdQueryAllowedOperators` too), a single select is required and not clearable, a multi select keeps its last values with a `required-min-one` line, and cleared text, number, date, date-time and `BETWEEN` values come back when the editor closes, in popover and inline mode. Required chips carry `aria-required="true"`.
- `clearAll()` keeps required chips as they are (pinned chips are emptied, others removed); the clear label does not count them, and with the built-in `clearAll()` the button is disabled when nothing is left to clear.
- With `applyOn: 'commit'`, the built-in clear button applies once after emptying the bar, with the search text applied last as a chip change does; before, a standalone bar kept filtering by the cleared chips because it has no Search button in this mode. A host `onClearAll`, `applyOn: 'search'` and `clearAll()` called from code still apply nothing.
- `onApplyFilter()` drops entries of unknown or disabled fields and keeps the current chip of a required or pinned field unless the saved filter has a value for it.
- The search box is `sd-search-field` (`xs` at compact density, `sm` at comfortable) with a clear button: clear or Escape with text empties it and applies once. The input is named by `searchPlaceholder`, else `core.component.query-bar.search`.

#### Table

- The icon cell of the selection bar uses the primary colours (`--sd-primary-light` / `--sd-primary`) instead of success. The bar now stacks below 600px of its own width instead of below a 600px viewport, so a table in a narrow column or drawer also gets the stacked layout.
- The settings menu of the external filter and the operator menu of the mobile filter page are Action Popovers (`sd-button` + `sd-button-item`) instead of `mat-menu`, with the same entries in the same order; the operator in use has a check. The settings menu uses toggle entries (`checked`): each one shows a check box, says whether its field is shown through `aria-checked`, and the mouse, Enter and Space toggle it without closing the menu, as the old menu did. Its autoIds are listed under Changed (BREAKING). The operator trigger keeps its `data-autoid`, now on the `sd-button` host, so the old selector still matches.
- Query-bar mode: the clear button keeps the values of `required` quick filters and external filters (hidden ones included), like `SdQueryBar.clearAll()`, and is no longer enabled by required values alone. The search box of the bar is `sd-search-field`.
- A required filter left empty is explained in the empty block of the table, where the rows will be, instead of a line under the query bar or the quick search row: that line pushed the table down and back up once the value was chosen. The block shows the filter-required image and "Chọn {label} để xem dữ liệu" (`core.component.query-bar.required`, the titles of the missing filters) in place of `core.component.table.choose-filter-hint`, and in place of "no results" when other filters hold values; the status region reads the same text.
  - Quick search names the missing filters too (it said "Chọn các bộ lọc bắt buộc trước khi tìm kiếm."), hidden ones included, and so does the phone layout, which had no hint.
  - Empty required chips and the disabled keyword input point `aria-describedby` at the new block. The elements `.sd-table-query-bar-hint` and `.sd-quick-search-hint` are gone; E2E tests read `.sd-table-required-hint`.

#### Theme

- The rest outline of box controls is lighter: `--sd-control-border` mixes 60% of `--sd-border-strong` into `--sd-surface` (was 82%). It applies to the outlined form fields (`sd-input`, `sd-select`, `sd-date`, `sd-datetime`, `sd-textarea`, `sd-autocomplete`, …), `sd-entity-picker` and the internal search fields (`sd-select` panel, `sd-table` quick search, `sd-kanban`).
  - Contrast on `surface`: 2.13–2.30:1 in every light preset (default 3.14 → 2.20) and 2.87:1 in dark (was 4.33). The outline stays darker than `--sd-border`, so an empty field still differs from a disabled one. Hover, focus, ring and disabled are unchanged; hover (`--sd-border-strong`) reaches at least 4:1.
  - To keep the 3:1 rest outline, set the previous value at the root:

    ```scss
    :root {
      --sd-control-border: color-mix(in srgb, var(--sd-border-strong) 82%, var(--sd-surface));
    }
    ```

#### Tree

- The root error state no longer shows `error.message`: it shows `core.component.tree.load-error` (now "The list couldn't be loaded.") with an error icon and an `sd-button` Retry. Read the error from `loadError` or `rootError()`.
- The selection bar is the bar of `sd-table` and sits inside the tree host, sticky at the bottom of the nearest scroll area, instead of a floating `sd-quick-action`; the host grows by the height of the bar, so the last row is not covered. Up to two actions are buttons and the rest go under "More" (colour and autoIds under Changed (BREAKING)). The classes `.c-bg-length`, `.c-length`, `.c-message` and `.sd-tree__qa-*` are gone.

### Deprecated

#### Confirm

- `disableBackdropClose` on every `SdConfirmService` method: use `enableBackdropClose` (the opposite meaning). It keeps working while `enableBackdropClose` is not passed.

#### Kanban

- `core.component.kanban.dismiss` is no longer read: Dismiss uses `core.common.dismiss`. The key stays in the five catalogs so a custom catalog that sets it still compiles; move an override to `core.common.dismiss`.

#### Modal

- `disableBackdropClose` on `sd-modal`: use `enableBackdropClose`. It keeps working while `enableBackdropClose` is not passed.

#### Table

- `core.component.table.quick-search.required` is no longer read: the quick search hint uses `core.component.query-bar.required` with the filter titles. The key stays in the five catalogs so a custom catalog that sets it still compiles.

#### Tree

- `SdTree.errorMessage()`: the tree no longer uses it for its own UI.
- `SdTree.selectionActionViews()`, `SdTree.clearSelectionAutoId()` and the `SdTreeSelectionActionView` type: the selection bar builds the autoIds of its buttons itself and the tree no longer reads them. Use `visibleSelectionActions()` for the actions left after `hidden`.

### Removed

#### Query bar

- The internal chip popover drops its `switchPickerMenu` input and `swapField` output, and the internal field picker its `currentKey` input: changing the field of a chip was not offered by the bar (remove the chip and add another). Its i18n key is listed under Changed (BREAKING).

### Fixed

#### Confirm

- Bottom sheets share a dynamic viewport height cap between their Material container and content host; only the content scrolls, with action padding that respects the bottom safe area.

#### Date

- `sd-date`: editing a typed date in the middle of the text (`19/11/2026` → `19/10/2026`) could empty the value when the field lost focus. While the text was being re-formatted the date picker kept reading the unformatted text, so its `change` event reported no date even though the field showed a complete one. The picker now reads the text that is shown.

#### Layout

- The mobile V1 shell uses dynamic viewport height with a `vh` fallback, so its content scrollport follows browser toolbar changes.

#### Modal

- Modal and side-drawer footer safe-area padding also applies in landscape beyond the narrow-layout breakpoint.

#### Query bar

- The × of the popover, inline and inline value chips read "Remove filter" in English in every language and did not say which filter. It is named by the new key `core.component.query-bar.remove-filter` with the field label (`{label}`): "Xoá bộ lọc Trạng thái", "Remove Trạng thái filter".
- Popover mode: the × of a chip was a `span[role=button]` inside the chip's `div[role=button]`, a button nested in a button. It is now a native `<button>` beside the trigger, in a `.c-chip-shell` wrapper, drawn over the end of the pill: the chip keeps its size and look, Space removes too, and `.c-chip` (the trigger) no longer contains `.c-chip-remove`.
  - E2E selectors that look for the × inside the chip must start from the chip host.

    ```diff
    - bar.locator('.c-chip[data-field="name"] .c-chip-remove')
    + bar.locator('sd-query-popover-chip:has(.c-chip[data-field="name"]) .c-chip-remove')
    ```

- The icon-only Search button had a tooltip but no `aria-label`, so it was read as its icon ligature "search". It now carries `core.component.query-bar.search` as `aria-label` too.
- The type label of each field in the field picker (11px) used `--sd-query-bar-text-muted`, 4.2:1 on the light panel of the default theme, under the 4.5:1 of WCAG AA. It uses `--sd-query-bar-text-secondary`: 5.9:1 light, 10.9:1 dark.

#### Scroll

- On a touch screen, `sdScroll` (the scroll area of `sd-table`) only scrolled horizontally after a first tap: `overflow-x` stayed `hidden` until an emulated `mouseover`, which the browser fires after a tap. A device that matches `(hover: none), (any-pointer: coarse)` now gets `overflow-x: auto` from the first render. Laptops with a touch screen match `any-pointer: coarse` and always show the horizontal scrollbar.
- Mouse devices keep the scrollbar hidden at rest. The toggle listens to `mouseenter`/`mouseleave` outside `NgZone` instead of `mouseover`/`mouseout`, so moving across table cells no longer runs change detection, and `overflow-x` is written only when it changes.
- One root service holds a single media query listener for every `sdScroll`. Mouse listeners and a pending `scrollTop()` are removed on destroy, and a new `scrollTop()` replaces a pending one.
- Code that dispatched synthetic `mouseover`/`mouseout` on the host to toggle the scrollbar should call `onMouseOver()`/`onMouseOut()`. Details in `sd-scroll.md`.

#### Select

- On the Angular 22 line, the filter box in the panel of `sd-select` sat 5px below its search icon, so the caret looked misaligned. Angular Material renders the panel as a popover inside `mat-select` there, and the `margin-top: 10px` that `core/form.scss` gives the control of an outline form field also matched the filter input. The rule now skips inputs and textareas inside `.mat-mdc-select-panel`.

#### Table

- Shared filter and sort sheet footer styles preserve bottom and side safe-area padding instead of overriding it with a fixed 16px inset.

- On the phone, the filter sheet and the one-filter chip sheet wrote their copy straight to the filter register on **Áp dụng**, so column `filter.onChange`, `filter.operatorChange` and external `onChange` never ran there. They now run after the write, once per filter whose value changed, like the query bar. Closing without applying calls nothing, an untouched `default` is not a change, external `custom` filters are skipped, and a `time` column edited through the column filter is not called twice.
- The copy is no longer made with `JSON`, so `Date` values in the filters (including `Date` defaults) stay `Date`s instead of turning into ISO strings after **Áp dụng**. Details in `sd-table.md` ("Callbacks on the phone").
- RTL: in the narrow selection bar (also used by `sd-tree`) the × sat in the start corner, next to the icon cell. It now sits at the inline end, and the message keeps its room on that side.

#### Tree

- RTL: child rows were not indented, because the indent was a left padding. The indent, the lines of `showLines`, the count and the row command trigger now use logical sides.
- ← on a leaf did not move to its parent when the leaf counted as open (`defaultExpanded: true`, or `expanded: true` on the item): it tried to close the leaf. A leaf is never open for ← now.
- Lazy trees: a child load still running when the tree reloads (`reload()`, new `items`) no longer opens the node of the new tree with no children once it ends. The chevron does nothing and `expand(id)` resolves `false`; open the node again to load it.

#### Upload file

- The preview pane owns dynamic viewport height in both orientations; its viewer fills the remaining shell space and avoids safe-area edges. Resizing preserves explicit image zoom and pan.

#### General

- Documentation search bounds the dialog at every viewport width and lets the results fill the remaining space, including landscape on phones.

## Compare with the previous release

- Previous documented release: [21.3.5](https://sdcorejs.github.io/sdcorejs-angular/docs/21.3.5/index.json)
- Source diff: https://github.com/sdcorejs/sdcorejs-angular/compare/v3.5...v3.6
