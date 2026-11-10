# `<sd-scheduler>`

**Type**: Standalone component
**Selector**: `sd-scheduler`
**Import path**: `@sdcorejs/angular/components/scheduler` (or barrel: `@sdcorejs/angular/components`)
**Classes**: `SdScheduler`, `SdSchedulerEventTemplateDirective`, `SdSchedulerResourceTemplateDirective`, `SdSchedulerCellTemplateDirective`, `SdSchedulerEmptyTemplateDirective`
**Change detection**: `OnPush`

## Purpose

A resource scheduler: one row per resource (a room, a vehicle, a person) and time along the row, as one day on an hour axis or a week or a month on a day axis. Use it for room bookings, vehicle plans, leave and timesheets. Events come from `option.dataSource.onLoad` for the range and the resources on screen. Two optional capabilities switch interaction on: `option.create` (sweep, click, tap or Enter on an empty slot of a row) and `option.move` (drag on two axes, drag the end handle, `Alt` + arrow keys). Without a capability its UI does not exist: no dashed block, no handle, no keys.

It is built on [`sd-calendar`](../calendar/sd-calendar.md): the same event model, configuration, colour tokens, date handling and move pipeline. Like the calendar, it never writes to your backend. It calls your callback, waits, and changes its own data only when you accept.

Compared with `sd-calendar`:

- Rows are resources (`resources`, required) and every event has exactly one `resourceId`.
- Views are `day` (the default), `week` and `month`. There is no agenda, no hour axis in the week and no all-day row.
- The month shows day 1 to its last day only. With `hideWeekends`, `from`/`to` still span the whole week or month.
- `option.move` adds `axis` and `droppable`; `move()` takes a `resourceId`.
- A cell template draws one cell per resource and day (a timesheet) and emits `sdCellSelect`.
- The compact layout keeps every view: `onLoad` always receives the view on screen, and there is no swipe.
- `scrollTime` puts that time at the start of the visible time area (the calendar opens half an hour above).

## Import

```ts
import { SdScheduler } from '@sdcorejs/angular/components/scheduler';
```

Types shared with the calendar (`SdCalendarState`, `SdCalendarWorkingHours`, `SdCalendarHoliday`, `SdCalendarMoveSource`, `SdCalendarMoveScope`, `SD_CALENDAR_CONFIGURATION`) are imported from `@sdcorejs/angular/components/calendar`; the scheduler entry point does not re-export them.

## Quick start

```ts
import {
  SdScheduler,
  type SdSchedulerEvent,
  type SdSchedulerOption,
  type SdSchedulerResource,
  type SdSchedulerView,
} from '@sdcorejs/angular/components/scheduler';

@Component({
  imports: [SdScheduler],
  template: `<sd-scheduler [option]="option" [resources]="rooms" [(view)]="view" [(date)]="date" (sdSelect)="open($event)" />`,
})
export class RoomBookingPage {
  readonly #api = inject(BookingApi);
  view: SdSchedulerView = 'day';
  date: string | undefined;

  readonly rooms: SdSchedulerResource<RoomDto>[] = [
    { id: 'hall', title: 'Main hall', icon: 'groups', data: { seats: 120 } },
    { id: 'hue', title: 'Hue room', description: '8 seats', icon: 'meeting_room', group: 'Floor 3', data: { seats: 8 } },
  ];

  readonly option: SdSchedulerOption<BookingDto, RoomDto> = {
    dataSource: {
      // Server: ask for the range and the rows on screen, and pass the signal on.
      onLoad: ({ from, to, resourceIds, signal }) =>
        firstValueFrom(this.#api.list({ from, to, rooms: resourceIds }, { signal })).then(rows => rows.map(toEvent)),
    },
    create: {
      // Open your own form. Return the new event, or nothing when the user cancels.
      onCreate: ({ start, end, allDay, resourceId }) => this.drawer.create({ start, end, allDay, roomId: resourceId }),
    },
    move: {
      // Synchronous, no API call: a room smaller than the meeting refuses the drop.
      droppable: ({ event, resource }) => (resource.data?.seats ?? 0) >= (event.data?.people ?? 0),
      onMove: request => firstValueFrom(this.#api.reschedule(request.event.id, request.to)).then(() => true),
    },
  };
}

const toEvent = (row: BookingDto): SdSchedulerEvent<BookingDto> => ({
  id: row.id,
  title: row.subject,
  resourceId: row.roomId, // one of the ids in `resources`
  start: row.startsAt,
  end: row.endsAt,
  color: row.color, // a Color ('primary', 'success'…) or any CSS colour
  data: row, // kept by reference, never serialized
});
```

Client data works the same way: return the whole array from `onLoad` and the scheduler keeps what falls in the range. An event whose `resourceId` is not in `resources` is left out with a dev-mode warning, so filter by `resourceIds` when you pass a subset of your resources.

```ts
readonly option: SdSchedulerOption = { dataSource: { onLoad: () => this.events() } };
```

## API

### Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `option` | `SdSchedulerOption<T, R>` | required | Data source and capabilities. A new object loads again; changes inside the same object do not. |
| `resources` | `readonly SdSchedulerResource<R>[]` | required | The rows (see Resources and groups). A new array loads again and clears the grid until the result; an empty array shows the empty state and does not call `onLoad`. |
| `view` | `SdSchedulerView` | `'day'` | Two-way (`[(view)]`). A view outside `views` shows the first of `views`. |
| `date` | `Date \| string \| number \| null \| undefined` | today in the zone | Two-way anchor day. The scheduler writes back `'yyyy/MM/dd'` (never transformed). |
| `selectedId` | `string \| null` | `null` | Two-way. Back to `null` when the event is no longer loaded. |
| `views` | `readonly SdSchedulerView[]` | `['day', 'week', 'month']` | Order of the switcher. An empty array offers all three. |
| `resourceLabel` | `string \| null` | "Resources" | Text of the corner cell, followed by "· {number of resources}". |
| `step` | `number` | configuration ?? `30` | Minutes of one slot of the day view: 5, 10, 15, 20, 30 or 60; another value uses 30 and warns in dev mode. Dragging and `Alt` + arrows use `min(step, 15)`. |
| `firstDayOfWeek` | `number` | configuration ?? `1` | 0–6, 0 is Sunday. First column of the week view. |
| `hideWeekends` | `boolean` | `false` | Hides the Saturday and Sunday columns of week and month. `from`/`to` still span the whole week or month. |
| `workingHours` | `SdCalendarWorkingHours \| null` | configuration ?? Mon–Fri 08:00–12:00, 13:00–17:30 | `null`: no off-hours shading and no day off by weekday. A resource's own `workingHours` wins. A broken range is ignored with a dev-mode warning. |
| `holidays` | `readonly SdCalendarHoliday[]` | configuration ?? `[]` | `off` shades the whole day on every row; `observance` only names the day (the `title` of its column header, a dot in month). |
| `minDate`, `maxDate` | `Date \| string \| number \| 'TODAY'` | — | Calendar days in the zone. Previous and Next stop at them; nothing can be created on or moved to a day outside. Those days are shaded on every row, as days off. |
| `scrollTime` | `string` (`'HH:mm'`) | configuration ?? earliest working hour of the resources ?? `'08:00'` | Where the day view opens on the hour axis. |
| `dimPast` | `boolean` | `false` | Fades events that have ended. |
| `transform` | `'ISOString' \| 'UTCString'` | — | Serialization of the values the scheduler emits (see Date values). |
| `disabled` | `boolean` | `false` | No create, move or selection of events; events leave the tab order. Navigation works. |
| `readonly` | `boolean` | `false` | No create or move. Selection and navigation work. |
| `ariaLabel` | `string \| null` | "Resource schedule" | Name of the region. The grid is named "{ariaLabel}, {title of the range}". |
| `autoId` | `string \| null` | — | E2E scope, see E2E hooks. |

### Outputs

| Output | Payload | When |
| --- | --- | --- |
| `sdSelect` | `SdSchedulerEvent<T>` | Click, tap, Enter or Space on an event (also sets `selectedId`). Not on the click that ends a drag, never while `disabled`. |
| `sdRangeChange` | `SdSchedulerVisibleRange` | Once on init, then whenever `from`, `to` or the view on screen changes; never twice for the same range, and not when only `resources` changes. |
| `sdMove` | `SdSchedulerMoveRequest<T, R>` | `onMove` accepted and the data changed. |
| `sdMoveError` | `SdSchedulerMoveError<T, R>` | `onMove` returned `false` (`reason: 'rejected'`) or threw (`'error'`). |
| `sdLoadError` | `unknown` | `onLoad` threw or rejected. Never for an aborted load. |
| `sdCellSelect` | `SdSchedulerCellSelect<T, R>` | Cell template only: click, tap, Enter or Space on a cell that holds at least one event. Does not set `selectedId`. Like a selection: while `readonly`, never while `disabled`. |

### Methods

- `reload(): void` — aborts the running load and a waiting move (not a waiting create), then calls `onLoad` again for the range and the resources on screen. The events stay until the result arrives. With no resources nothing is called.
- `move(eventId, to: { start; end?; allDay?; resourceId? }, source = 'api'): Promise<boolean>` — runs the move pipeline (see Moving). Resolves `true` only when `onMove` accepts. `false` without `option.move`, while locked or while another create/move waits, on a view drawn by a cell template, for an unknown event id, an unreadable `to`, a `resourceId` that is not in `resources`, a move against `axis`, a refused `movable` or `droppable`, the same time on the same resource, a target outside `minDate`/`maxDate`, `false`, `'cancel'` or an error. Without `end` the duration is kept; without `resourceId` the event keeps its resource. `'api'` never asks for the scope of a recurring event (`scope: 'this'`) and never moves the focus.

### Configuration

The scheduler reads the calendar's token; there is no scheduler token.

```ts
providers: [{ provide: SD_CALENDAR_CONFIGURATION, useValue: { firstDayOfWeek: 1, step: 15, holidays, workingHours } }];
```

`ISdCalendarConfiguration` has `firstDayOfWeek`, `step`, `workingHours`, `holidays`, `scrollTime`; one provider configures every `sd-calendar` and `sd-scheduler` below it. An input wins over the configuration, which wins over the defaults.

## Model

```ts
interface SdSchedulerOption<T = unknown, R = unknown> {
  dataSource: {
    onLoad: (args: SdSchedulerLoadArgs) => readonly SdSchedulerEvent<T>[] | Promise<readonly SdSchedulerEvent<T>[]>;
  };
  create?: {
    creatable?: SdCalendarState<SdSchedulerCreateContext<R>>; // default true
    onCreate: (args: SdSchedulerCreateArgs<R>) => SdSchedulerEvent<T> | void | Promise<SdSchedulerEvent<T> | void>;
  };
  move?: {
    movable?: SdCalendarState<SdSchedulerEvent<T>>; // default true
    axis?: SdSchedulerMoveAxis; // default 'both'
    droppable?: SdCalendarState<SdSchedulerDropContext<T, R>>; // default true
    onMove: (request: SdSchedulerMoveRequest<T, R>) => boolean | 'cancel' | void | Promise<boolean | 'cancel' | void>;
  };
}
```

`SdCalendarState<C>` is `boolean | ((context: C) => boolean)`.

| Type | Fields |
| --- | --- |
| `SdSchedulerResource<R>` | `id` (unique, not empty), `title` (not empty, read by screen readers), `description?`, `group?`, `icon?` (Material Symbols name, ignored with `avatar`), `avatar?` (image URL), `workingHours?: SdCalendarWorkingHours \| null`, `data?: R` (kept by reference) |
| `SdSchedulerEvent<T>` | Every field of `SdCalendarEvent<T>` (`id`, `title`, `start`, `end?`, `allDay?`, `color?`, `occurrence?`, `data?`) plus `resourceId` |
| `SdSchedulerRange` | `start`, `end`, `allDay`, `resourceId`: a span on one resource in the emitted form (see Date values) |
| `SdSchedulerVisibleRange` | `from`, `to` (`'yyyy/MM/dd'`, both included), `view` |
| `SdSchedulerLoadArgs` | `from`, `to`, `view`, `resourceIds` (ids of `resources` in order, collapsed groups included), `signal` |
| `SdSchedulerCreateContext<R>` | `start`, `end`, `allDay`, `resourceId`, `resource`: the context of `creatable` |
| `SdSchedulerCreateArgs<R>` | The create context plus `signal` (aborted when `option` or `resources` changes, or on destroy) |
| `SdSchedulerDropContext<T, R>` | `event`, `to: SdSchedulerRange`, `resource` (the target): the context of `droppable` |
| `SdSchedulerMoveRequest<T, R>` | `event`, `from`, `to` (both `SdSchedulerRange`), `resource` (the target; the event's own when only the time changes), `source` (`'drag' \| 'resize' \| 'keyboard' \| 'api'`), `scope` (`null` unless the event is an occurrence), `signal` |
| `SdSchedulerMoveError<T, R>` | `request`, `reason: 'rejected' \| 'error'`, `error?` |
| `SdSchedulerCellSelect<T, R>` | `resource`, `date` (`'yyyy/MM/dd'`), `events` |
| `SdSchedulerView` | `'day' \| 'week' \| 'month'` |
| `SdSchedulerMoveAxis` | `'both' \| 'time' \| 'resource'` |

`T` is your event DTO and `R` your resource DTO; both reach every callback and template with their type.

## Resources and groups

- One row per resource, in the order of `resources`. Resources without `group` come first, without a group row. Then each group gets a group row followed by its resources; groups keep the order of their first resource. The same string is the same group.
- The resource cell shows the `avatar` (`sd-avatar`, 28px; the initials of `title` when the image fails) or the `icon` in a 32px frame, the `title`, and the `description` on a second line. Each line is cut with an ellipsis; the cell's `title` attribute holds the full name.
- `workingHours` on a resource replaces the component's for that row, `null` included: off-hours shading, days off, `Home`/`End` and the first cursor position follow it. An `off` holiday shades every row.
- A new `resources` array loads again, even with the same ids, and clears the grid until the result. It does not emit `sdRangeChange` and it aborts a waiting create or move. Changes inside the same array are not seen.
- An empty array shows "No resources" (or `sdSchedulerEmptyTemplate`) under the time axis. `onLoad` is not called, and nothing can be created or moved.
- A duplicate or empty `id`, or an empty `title`, refuses the data (`invalid-data` state).

Group rows:

- A chevron, the group name and "· {count} resources" (i18n `core.component.scheduler.group-count`). The row header is a `button` with `aria-expanded`; a click or `Alt` + `Enter` collapses or expands it.
- A collapsed group keeps only its group row. Its events still load (`resourceIds` lists its resources). The collapsed state is kept across ranges and views and lost on destroy; a new `resources` array without the group drops it, so the group comes back expanded.
- A group row has no slots: nothing is created on it and a drop on it cancels. A move accepted into a resource of a collapsed group opens the group.

Lanes: overlapping events of one row stack in lanes. They are sorted by start, all-day first on a tie, then the longer first, and each takes the first lane that is free at its start; there is no lane limit. On week and month a timed event fills its whole start day. A row is `max(48, 8 + 32 × lanes)` px tall; blocks sit at 10px with one lane, at `6 + 32 × lane` px from two lanes. A block that waits for `onMove` is drawn in lane 0, above the others.

## Data source

`dataSource.onLoad({ from, to, view, resourceIds, signal })` is called on init, when the range changes, when `option` is a new object, when `resources` is a new array and on `reload()`. `from`/`to` are `'yyyy/MM/dd'`, both included; a week with `hideWeekends` still spans seven days.

- A newer call aborts `signal`; a late result is dropped.
- First load: progress bar, `aria-busy`, the resource column at once and a static skeleton on the first three rows. Later loads: progress bar only. A new range or a new `resources` array empties the grid until the result; `reload()` and a new `option` for the same range keep the events.
- Throw or reject: a band with Retry and `sdLoadError`. The grid stays, without events. The text of the error is never shown.
- Duplicate or empty `id`, or an empty `title`, in the events or in `resources`: the data is refused (`invalid-data` state). An event whose `resourceId` is not in `resources`, with an unreadable date, or a timed event that does not end after it starts (or has no `end`) is left out with one dev-mode warning.
- While any load runs, create and move are locked; navigation is not.
- No resources: `onLoad` is not called and the events are cleared.

`option` is the signal to load again: when your filters change, assign a new object (or call `reload()`).

## Selecting

As the calendar: a click, tap, `Enter` or `Space` on a block selects it (`selectedId`) and emits `sdSelect`; `Esc` on a block clears the selection and puts the focus back on the grid. A 3px jitter still counts as a click; the click that ends a drag does not select. Selection works while `readonly`, not while `disabled`.

A press on an empty slot clears the selection, and creates there with `option.create`. With a cell template, cells emit `sdCellSelect` instead (see Templates).

## Creating

With `option.create`, on every view, on one resource row:

- Sweep with the mouse along the row. The row stays the one pressed, even when the pointer leaves it. Day view: rounded to `step` as in the calendar (`[min, max + step]`, inside the day, up to 24:00). Week and month: whole days `[min, max]` with `allDay: true`.
- A click or a tap creates one slot: one `step` on the day view, one day on week and month. `Enter` or `Space` on the grid creates the slot under the cursor.
- `creatable({ start, end, allDay, resourceId, resource })` is checked while sweeping (a refused sweep is drawn grey, with the `not-allowed` cursor) and again right before `onCreate`. A span outside `minDate`/`maxDate` is refused ("Outside the allowed range.").
- `Esc` cancels a sweep; a sweep the browser takes away (`pointercancel`) is dropped. On touch there is no sweep: a one-finger move scrolls.
- While `onCreate` runs the dashed block stays with a sync icon, and no other create or move starts.
- Return the event to insert and select it (`selectedId`, no `sdSelect`). Return nothing when the user cancels. Throw for the `create-error` band ("The event could not be created."); the text of the error is never shown.
- `args.signal` is aborted when `option` or `resources` changes and on destroy; a late result is dropped. A range change or `reload()` does not abort a create.

## Moving

With `option.move`, on every view not drawn by a cell template: drag a block on two axes (5px threshold, a 400ms hold on touch), drag its end handle, use `Alt` + arrow keys, or call `move()`. `movable(event)` removes the drag and the handle and is checked again right before `onMove`.

### Dragging

- Time (inline axis): the day view moves by `min(step, 15)` minutes and keeps the block inside the day on screen. Week and month move by whole columns, keep the start time and the duration, and keep the block inside the range on screen; hidden weekend columns are skipped. On the day view an all-day event or one that crosses midnight keeps its time: only its resource changes.
- Resource (block axis): the resource row under the pointer.
- The block stays in its lane as a faded dashed frame. The proposal is drawn on the target row with a floating label: "{resource} · 10:00 – 11:30" on another row, "10:00 – 11:30" on the same row, dates for all-day events. The label sits 6px after the block, or before it when less than 160px of the row is left after it. The target row is tinted. A row that `droppable` refuses is striped, its resource cell faded and the cursor `not-allowed`.
- Over the sticky time axis or the sticky resource column, the last row and the last time are kept.
- Within 40px of an edge of the visible grid (the sticky parts left out) the grid scrolls on both axes, up to 16px a frame.
- Drop on a refused row: nothing is called and "Can't move to {resource}" is announced. Drop on a group row, outside the scroll area, or press `Esc`: the block goes back and nothing is called.

### `axis`

| `axis` | Drag | End handle | Keys | `move()` |
| --- | --- | --- | --- | --- |
| `'both'` (default) | time and resource | yes | every `Alt` + arrow | any target |
| `'time'` | the row stays; no vertical auto-scroll | yes | no `Alt` + `↑` `↓` | `false` for another resource |
| `'resource'` | the time stays; no horizontal auto-scroll | none | no `Alt` + `←` `→`, no `Alt` + `Shift` + `←` `→` | `false` for another time |

### `droppable`

`droppable({ event, to, resource })` says whether the event may land at `to` on `resource`. It is synchronous. It runs while dragging whenever the target row or slot changes (the answer is remembered per resource and start for one drag), for every `Alt` + arrow, for `move()` from any source, and again right before `onMove`. Return `false` to refuse. A throw also refuses and logs one dev-mode warning per event. Do not call an API here; `onMove` stays the final check.

`Alt` + `↑` `↓` skips the rows `droppable` refuses and lands on the nearest one it allows, collapsed groups included. With none left nothing moves and "Can't move to {resource}" is announced for the next row.

### End handle

- The 8px area at the inline end of a block, with the `ew-resize` cursor. Day view: timed events that stay in their day, by `min(step, 15)` minutes, at least `min(step, 15)` minutes long, up to 24:00. Week and month: all-day events only, by whole days, at least one day, up to the last day of the range; timed blocks have no handle.
- No handle with `axis: 'resource'` or a refused `movable`. On a coarse pointer only the selected block has it (see Compact layout and touch).
- While resizing, the block follows the pointer and a floating label shows the new span ("10:00 – 12:30", or the dates), placed as the drag label.
- `Esc` or a `pointercancel` drops a live resize; nothing is called. `request.source` is `'resize'`.

### Pipeline

1. Refused at once, nothing called: no `option.move`, locked, another create or move waiting, a cell template on the view, an unknown event, a target resource not in `resources`, a refused `movable`, a move against `axis`, or the same time on the same resource.
2. A target outside `minDate`/`maxDate` is refused ("Outside the allowed range.").
3. A target `droppable` refuses is refused ("Can't move to {resource}").
4. A recurring occurrence asks for the scope first (see Recurring events).
5. `movable` and `droppable` run once more; a refusal puts the block back without a message.
6. The block waits at the proposal, dashed, with a sync icon, and "Saving {title}" is announced. Data does not change yet.
7. `onMove(request)` decides, with the same results as the calendar ([Moving](../calendar/sd-calendar.md#moving)): `true` or nothing accepts, `false` rejects (error outline, band, `sdMoveError` with `'rejected'`), `'cancel'` goes back without an error, a throw is `'error'`. An accepted event is replaced by a new object `{ ...event, start, end, allDay, resourceId }` with the same `data` reference, then `sdMove(request)` is emitted.
8. After an accepted move, a target in a collapsed group opens the group, and a target day outside the range sets `date` to it (the range follows and loads). An accepted `following` or `all` reloads.

Announced after an accepted move:

| Move | Text (en) |
| --- | --- |
| To another resource | "Moved to {resource}, {start}": `{start}` is "10:00" on the day view, "{weekday} {date}, 10:00" on week and month, "{weekday} {date}" for an all-day event. |
| Same resource, new time | "Moved {title} to {weekday} {date}, {time}" |
| End handle, or only the end changed | "Changed {title} to {start} – {end}" |

`request.signal` is aborted when the range changes, when `resources` or `option` changes, on `reload()`, when `disabled` or `readonly` turns on and on destroy; a late answer is ignored. Aborting is cooperative: it does not undo a backend change that already happened. Only one create or move waits at a time.

Focus works as in the calendar: a move started from the keyboard returns the focus to the block afterwards, also after it changed row or range; a focus the user moved elsewhere meanwhile stays there; `move(…, 'api')` never takes the focus.

**Undo** (pattern S1): after `sdMove`, show a toast with an Undo action that calls `scheduler.move(request.event.id, request.from, 'api')`; `request.from` carries the old resource. Because `droppable` also runs for `move()`, an Undo resolves `false` (and says "Can't move to {resource}") when `droppable` refuses the old place.

## Recurring events

As the calendar ([Recurring events](../calendar/sd-calendar.md#recurring-events)): return each occurrence from `onLoad` with its own `id` and `occurrence`; a drag, the end handle or `Alt` + arrows open the scope bar, `move(…, 'api')` uses `'this'`, and an accepted `following` or `all` reloads. Moving an occurrence to another resource asks too.

## Date values

As the calendar ([Date values](../calendar/sd-calendar.md#date-values)): values are read through `SdDateTimeService` in the zone, a timed `end` is exclusive, an all-day `end` is the last day, inclusive, and the emitted values follow `transform`. Differences, since there is no all-day row:

- Day view: an all-day event covers 00:00–24:00 of its row. A timed event that crosses midnight is drawn at its times on each day it touches. A side that continues past the day or the range is square (`data-clipped-start`, `data-clipped-end`).
- Week and month: a timed event that stays in its day fills the column of its start day; all-day events and events that cross midnight span every column they cover.
- A create on week or month emits `allDay: true` with `start` and `end` as `'yyyy/MM/dd'` (the end included).

## Views

- **Day** (default): an hour axis from 00:00 to 24:00 (24 columns of `--sd-scheduler-hour-width`), hour and half-hour lines, the off hours of each resource shaded, and the current time on today as a line across every row, updated every minute. The day view scrolls to `scrollTime` when it opens (on init or from another view), not when only the day changes.
- **Week**: seven days from `firstDayOfWeek` (five with `hideWeekends`). A column header shows the weekday and the day number; click the number for its day. Days off of each resource (a weekday without working hours, an `off` holiday) are shaded; an `off` holiday's weekday is red. Columns are at least `--sd-scheduler-day-min-width` wide, otherwise they share the width; the grid scrolls sideways when they do not fit.
- **Month**: day 1 to the last day of the month (28–31 columns), no days of the months around it. Columns are at least `--sd-scheduler-month-day-min-width` wide. An `observance` holiday shows a dot under its number.
- Week and month open at their first column, then bring today's column next to the resource column when it is hidden. Previous and Next keep the horizontal scroll otherwise; the vertical scroll is kept across ranges and views.
- Navigation: Previous and Next move by one day, one week or one month (to day 1 of the month); Today goes to today; each navigation announces the new title.
- Block content by width: 120px and more shows the colour dot, the title and the time (the time on the day view only); 48–119px the dot and the title; under 48px the dot only. On week and month the start time leads the title of a timed block of at least 96px ("09:00 Weekly review"). Occurrences show a repeat icon. Colours as the calendar: a `Color` or any CSS colour.

## Compact layout and touch

Under 600px of **host** width (`ResizeObserver` on the host, not a media query, as in the [calendar](../calendar/sd-calendar.md#compact-layout)):

- The toolbar takes two rows (title and navigation, then the view switcher across the width) with 44px navigation buttons. Every view of `views` stays.
- The resource column is 120px wide: icon or avatar 24px, the title on up to two lines, no description. The resource template receives `compact: true`.
- `--sd-scheduler-hour-width` is 64px and `--sd-scheduler-day-min-width` 96px; the month keeps 28px. Group rows are 44px tall.
- The week stays a week: `view`, `onLoad` and `sdRangeChange` keep the view on screen. There is no swipe between days.

On touch:

- A one-finger move on the grid scrolls; there is no sweep. A tap on an empty slot creates one slot (one `step`, or one day).
- A block lifts after a 400ms press (with a short vibration where the device supports it), then drags on both axes.
- On a coarse pointer only the selected block shows the end handle, with a 24px target.

### URL sync

As the calendar ([URL sync](../calendar/sd-calendar.md#url-sync)): keep `?view=` in sync with the `view` model and `?date=` with the `date` model. Setting them back from the URL does not emit `sdRangeChange` again when the range is the same.

## Templates

| Directive | Context | Replaces |
| --- | --- | --- |
| `ng-template[sdSchedulerEventTemplate]` | `$implicit`/`event: SdSchedulerEvent<T>`, `range: SdSchedulerRange` (the proposed span while a move waits), `resource: SdSchedulerResource<R>`, `view: SdSchedulerView`, `compact: boolean` (block under 48px), `pending: boolean` | The content of a block; frame, colour dot, end handle, sync icon and states stay. |
| `ng-template[sdSchedulerResourceTemplate]` | `$implicit`/`resource: SdSchedulerResource<R>`, `group: string \| null`, `compact: boolean` (host under 600px) | The content of a resource cell; its frame, width and sticky position stay. Put totals or capacity here. |
| `ng-template[sdSchedulerCellTemplate]` | `$implicit`/`date: string` (`'yyyy/MM/dd'`), `resource`, `events: readonly SdSchedulerEvent<T>[]` (the events of the resource that touch that day), `holiday: SdCalendarHoliday \| null`, `today: boolean`, `off: boolean` (a day off for this resource) | The blocks of week and month, by one cell per resource and day (a timesheet). |
| `ng-template[sdSchedulerEmptyTemplate]` | `$implicit: SdSchedulerVisibleRange` | "No resources". |

Every directive has a typed context (`SdSchedulerEventTemplateContext`, `SdSchedulerResourceTemplateContext`, `SdSchedulerCellTemplateContext`, `SdSchedulerEmptyTemplateContext`).

The cell template applies to the views in its `views` input (`readonly SdSchedulerCellView[]`, that is `'week' | 'month'`; default `['week', 'month']`); the day view always draws blocks. On those views a row has no blocks, no drag, no end handle and no `Alt` keys, and `move()` resolves `false`. A row is one lane (48px) tall. A click, tap, `Enter` or `Space` on a cell with at least one event emits `sdCellSelect`; on an empty cell it creates one all-day day with `option.create`.

```html
<sd-scheduler [option]="option" [resources]="people" view="month" (sdCellSelect)="openDay($event)">
  <ng-template sdSchedulerCellTemplate let-events="events" let-off="off">
    {{ events.length ? events[0].data?.code : off ? '–' : '' }}
  </ng-template>
</sd-scheduler>
```

## Keyboard

| Where | Keys |
| --- | --- |
| Grid (one tab stop, `aria-activedescendant`) | The cursor starts on the first resource, on the anchor day (or the first column), at the start of its working hours. Each move is announced. |
| Grid | `←` `→` one step on the day view, one column on week and month; past the edge, the previous or next day or range. Reversed in RTL. |
| Grid | `↑` `↓` previous or next resource row: an open group row is skipped, a collapsed group row is a stop. `Ctrl`/`Cmd` + `Home`/`End` first or last resource. |
| Grid | `Home`/`End`: on the day view, the start of the working hours of the resource and the last slot before they end (the scheduler's hours on a group row; 08:00 and the last slot of the day without working hours); on week and month, the first and last column. |
| Grid | `PageUp`/`PageDown` range (week and month keep the column), `T` today. |
| Grid | `Enter`/`Space` create one step or one day on the resource under the cursor (a cell with events: `sdCellSelect`). `Alt` + `Enter` collapse the group of the resource under the cursor, or open the collapsed group under it. |
| Event | `Enter`/`Space` select, `Esc` clear and back to the grid. Arrows without `Alt` do nothing. |
| Event | `Alt` + `←` `→`: `min(step, 15)` minutes for a timed event of the day on the day view, otherwise one day (into the next range, which the view follows). Reversed in RTL. |
| Event | `Alt` + `Shift` + `←` `→` change the end where the end handle is: timed events of the day on the day view by `min(step, 15)` minutes, all-day events on week and month by one day. |
| Event | `Alt` + `↑` `↓` the nearest resource above or below that `droppable` allows, collapsed groups included. |

Group buttons and the day numbers of the axis have `tabindex="-1"`: they add no tab stop.

## States

| State | Display |
| --- | --- |
| First load | Progress bar, `aria-busy` on the grid, the resource column at once, a static skeleton block on each of the first three resource rows. |
| Later load | Progress bar. The events stay for `reload()` and a new `option`; the grid is empty for a new range or a new `resources` array. |
| Load error | Band "The calendar could not be loaded." with Retry, `sdLoadError`; the grid without events. |
| No resources | Under the time axis: an icon and "No resources", or `sdSchedulerEmptyTemplate`. `onLoad` is not called. |
| Invalid data | The grid is replaced by "The calendar data is invalid."; the toolbar stays. |
| Waiting | Create: the dashed block with a sync icon. Move: the block at the proposal, dashed, with a sync icon. |
| Failed | Band with Dismiss ("The event could not be created.", "The event could not be moved.", "The change could not be saved."); a failed move also outlines its block. |
| `readonly` | No create or move; selection and navigation work. |
| `disabled` | No create, move or event selection; events leave the tab order; navigation works. |

Create and move are locked while a load runs, after a load error, with invalid data, with no resources, and while `readonly` or `disabled`.

## Accessibility

- A region named by `ariaLabel`. The grid (`role="grid"`) is one tab stop named "{ariaLabel}, {title of the range}" and described by a hidden key hint. `aria-activedescendant` points at the cursor: the time area of a row (`role="gridcell"`, named by the cursor label), a cell of the cell template, or the header of a collapsed group.
- Axis cells are column headers. Each resource cell is a `rowheader`; the blocks of its row point at it with `aria-describedby`, together with a hidden key hint.
- Blocks are buttons named "{title}, {resource}, {weekday} {date}, {start} to {end}[, repeats]"; all-day: "{title}, {resource}, all day, {from} to {to}". A timed event that ends on another day reads the end date too.
- Group buttons have `aria-expanded`, the name "{group}, {count} resources" and the tooltip "Collapse {group}" / "Expand {group}". Day numbers are named "Open {weekday} {date}".
- One polite status region for the cursor, the title after navigation, saving, moved, moved to another resource, resized, cancelled, rejected, errors, "Can't move to {resource}", out of range and load errors. The drag proposal and its floating label are `aria-hidden`.
- The scope bar is an `alertdialog`. `prefers-reduced-motion` stops transitions, the sync icon and the progress animation; `forced-colors` uses `CanvasText` frames and `Highlight` for selected, pending and the now line.
- Hover only adds visuals; everything works with the keyboard and with `pointer: coarse`.

## Theming

Colours: the five tokens of the calendar, `--sd-calendar-line`, `--sd-calendar-line-half`, `--sd-calendar-off-hours`, `--sd-calendar-now`, `--sd-calendar-today` (see `THEME.md`), with the library's palette and surface tokens (`--sd-primary`, `--sd-surface`, `--sd-border`…). Each has its default light value as a fallback (`#dedee5`, `#efeef3`, `#f3f3f7`, `#ba1a1a`, `#005cbb` for the calendar tokens). The scheduler adds no colour token.

Sizes on the host:

| Variable | Default | Compact | Sets |
| --- | --- | --- | --- |
| `--sd-scheduler-resource-width` | `240px` | `120px` | The resource column and the corner. |
| `--sd-scheduler-hour-width` | `80px` | `64px` | One hour of the day view. |
| `--sd-scheduler-day-min-width` | `120px` | `96px` | The narrowest column of the week. |
| `--sd-scheduler-month-day-min-width` | `28px` | `28px` | The narrowest column of the month. |
| `--sd-scheduler-row-min-height` | `48px` | — | The CSS minimum height of a resource row. |
| `--sd-scheduler-lane-height` | `28px` | — | The height of a block, the dashed create block and the drag proposal. |
| `--sd-scheduler-group-height` | `32px` | `44px` | The height of a group row. |
| `--sd-scheduler-event-radius` | `var(--sd-radius-6, 6px)` | — | The corners of a block. |

**Set the four width variables in `px`.** The scheduler reads them with `getComputedStyle` to choose the content of a block, to turn pointer positions into minutes and columns, to skip the sticky column while dragging and to scroll to `scrollTime`. A value in `rem` is read as a number of pixels, and a `calc()` falls back to the default. They are read after the first render and when the compact layout turns on or off.

Under 600px the scheduler sets its compact values on its inner root, so host values of the variables with a compact value apply to the wide layout only. The row height and the lane positions are computed by the component (`max(48, 8 + 32 × lanes)` px), not by these variables.

The host has `display: block`; give it a height, or the scroll area is at most 640px tall. It never grows taller than its rows.

## E2E hooks

With `autoId` the root has `data-autoid="components-scheduler-{autoId}"`, a resource row `…-resource-{token}` and a block `…-event-{token}`, where the token is `encodeURIComponent(id)`. Toolbar buttons: `…-today`, `…-prev`, `…-next`, `…-view-{view}`; bands: `…-retry`, `…-dismiss`; scope bar: `…-scope-{this|following|all|cancel}`. Group rows and cells have no `data-autoid`: find a group row by `data-group`, a cell by `data-resource-id` and `data-date`.

Always present (with or without `autoId`):

| Element | Attributes |
| --- | --- |
| Root | `data-view`, `data-from`, `data-to`, `data-compact` |
| Toolbar | `data-title`; buttons `data-action` (`today`, `prev`, `next`) and `data-view-option` |
| Bands | `data-band="load-error"` with `data-action="retry"`, `data-band="move-error"` (also a failed create) with `data-action="dismiss"` |
| Scope bar | `role="alertdialog"`, buttons `data-scope` (`this`, `following`, `all`, `cancel`) |
| Scroll area and grid | `data-region="scroller"` (with `data-view`), `data-region="grid"` |
| Time axis | `data-corner`, `data-axis`; hours `data-axis-hour`; days `data-axis-day` + `data-date`, `data-today`, `data-holiday` (`off`, `observance`); the month holiday dot `data-holiday-dot` |
| Rows | Body `data-rows`. Resource row `role="row"` + `data-resource-id`, while dragging `data-drop` (`ok`, `blocked`) and `data-blocked`. Group row `role="row"` + `data-group`, `data-collapsed`. |
| Time area of a row | `data-track` + `data-resource-id`; shaded spans `data-off-hours` |
| Block | `data-event-id`, `data-resource-id`, `data-start`, `data-end`, `data-all-day`, `data-color`, `data-tier` (`lg`, `md`, `sm`), `data-past`, `data-pending`, `data-selected`, `data-failed`, `data-movable`, `data-dragging`, `data-clipped-start`, `data-clipped-end`; its end handle `data-resize-handle` |
| Cell (cell template) | `role="gridcell"` + `data-resource-id`, `data-date`, `data-off`, `data-today` |
| Transient | `data-create-ghost` (with `data-pending`, `data-blocked`), `data-drag-proposal` (with `data-blocked`) and its label `data-drag-label`, `data-cursor`, `data-now`, `data-skeleton`, `data-empty` |

## Limits (this release)

- No virtual scrolling: keep to about 150 resources.
- One event belongs to exactly one resource.
- No hour axis in the week, no agenda view, no custom range length (three days, two weeks).
- No drag of the start edge, no drag between two schedulers, no drag from a list outside.
- No column beside the resource column: put totals or capacity in `sdSchedulerResourceTemplate`.
- No client-side RRULE expansion, no print layout, no `.ics` or Excel export.
- No built-in event form: use `onCreate`, `sdSelect` and `sdCellSelect` with your own drawer or dialog.

## Anti-patterns

- Do NOT mutate `resources`, the array or the events you returned from `onLoad`; give a new array, a new `option` or call `reload()`.
- Do NOT call your API from `movable`, `creatable` or `droppable`: they run while rendering and dragging. Decide in `onMove`/`onCreate`.
- Do NOT throw from `droppable` to refuse a target; return `false`.
- Do NOT set the size variables in `rem`, `em`, `%` or `calc()`.
- Do NOT return events of resources that are not in `resources`.
- Do NOT parse or format the emitted values with `new Date(value)`; read them with `SdDateTimeService` or send them as they are.
