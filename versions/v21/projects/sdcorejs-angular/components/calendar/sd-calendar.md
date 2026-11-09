# `<sd-calendar>`

**Type**: Standalone component
**Selector**: `sd-calendar`
**Import path**: `@sdcorejs/angular/components/calendar` (or barrel: `@sdcorejs/angular/components`)
**Classes**: `SdCalendar`, `SdCalendarEventTemplateDirective`, `SdCalendarDayCellTemplateDirective`, `SdCalendarAgendaItemTemplateDirective`, `SdCalendarEmptyTemplateDirective`
**Change detection**: `OnPush`

## Purpose

A calendar with four views — month, week, day and agenda — for meetings, appointments, leave and the timesheet of one person. Events come from `option.dataSource.onLoad` for the range on screen. Two optional capabilities switch interaction on: `option.create` (click, sweep, tap or Enter on an empty slot) and `option.move` (drag, drag the bottom edge, `Alt` + arrow keys). Without a capability its UI does not exist: no dashed block, no handle, no keys.

The calendar never writes to your backend. It calls your callback, waits, and changes its own data only when you accept.

## Import

```ts
import { SdCalendar } from '@sdcorejs/angular/components/calendar';
```

## Quick start

```ts
import { SdCalendar, type SdCalendarEvent, type SdCalendarOption, type SdCalendarView } from '@sdcorejs/angular/components/calendar';

@Component({
  imports: [SdCalendar],
  template: `<sd-calendar [option]="option" [(view)]="view" [(date)]="date" (sdSelect)="open($event)" />`,
})
export class MeetingsPage {
  readonly #api = inject(MeetingApi);
  view: SdCalendarView = 'week';
  date: string | undefined;

  readonly option: SdCalendarOption<MeetingDto> = {
    dataSource: {
      // Server: ask for the range on screen and pass the signal on.
      onLoad: ({ from, to, signal }) => firstValueFrom(this.#api.list(from, to, { signal })).then(rows => rows.map(toEvent)),
    },
    create: {
      // Open your own form (a drawer, a dialog). Return the new event, or nothing when the user cancels.
      onCreate: ({ start, end }) => this.drawer.create({ start, end }),
    },
    move: {
      movable: event => !event.data?.locked,
      onMove: request => firstValueFrom(this.#api.reschedule(request.event.id, request.to)).then(() => true),
    },
  };
}

const toEvent = (row: MeetingDto): SdCalendarEvent<MeetingDto> => ({
  id: row.id,
  title: row.subject,
  start: row.startsAt,
  end: row.endsAt,
  color: row.roomColor, // a Color ('primary', 'success'…) or any CSS colour
  data: row, // kept by reference, never serialized
});
```

Client data works the same way: return the whole array from `onLoad` and the calendar keeps what falls in the range.

```ts
readonly option: SdCalendarOption = { dataSource: { onLoad: () => this.events() } };
```

## API

### Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `option` | `SdCalendarOption<T>` | required | Data source and capabilities. A new object loads again; changes inside the same object do not. |
| `view` | `SdCalendarView` | `'week'` | Two-way (`[(view)]`). A view outside `views` shows the first of `views`. |
| `date` | `Date \| string \| number \| null \| undefined` | today in the zone | Two-way anchor day. The calendar writes back `'yyyy/MM/dd'` (never transformed). |
| `selectedId` | `string \| null` | `null` | Two-way. Back to `null` when the event is no longer loaded. |
| `views` | `readonly SdCalendarView[]` | `['month', 'week', 'day', 'agenda']` | Order of the switcher. |
| `step` | `number` | configuration ?? `30` | Minutes of one slot: 5, 10, 15, 20, 30 or 60; another value uses 30 and warns in dev mode. |
| `firstDayOfWeek` | `number` | configuration ?? `1` | 0–6, 0 is Sunday. |
| `hideWeekends` | `boolean` | `false` | Hides Saturday and Sunday in week and month. |
| `workingHours` | `SdCalendarWorkingHours \| null` | configuration ?? Mon–Fri 08:00–12:00, 13:00–17:30 | `null`: no off-hours shading and no day off by weekday. |
| `holidays` | `readonly SdCalendarHoliday[]` | configuration ?? `[]` | `off` shades the whole day; `observance` only shows its name. |
| `minDate`, `maxDate` | `Date \| string \| number \| 'TODAY'` | — | Calendar days in the zone. Days outside are shaded and cannot be created on or moved to. |
| `scrollTime` | `string` (`'HH:mm'`) | configuration ?? earliest working hour ?? `'08:00'` | Where week and day open (half an hour above). |
| `agendaDays` | `number` | `14` | 1–62. |
| `dimPast` | `boolean` | `false` | Fades events that have ended. |
| `transform` | `'ISOString' \| 'UTCString'` | — | Serialization of the values the calendar emits (see Date values). |
| `disabled` | `boolean` | `false` | No create, move or selection; events leave the tab order. Navigation works. |
| `readonly` | `boolean` | `false` | No create or move. Selection and navigation work. |
| `ariaLabel` | `string \| null` | "Calendar" | Name of the region. |
| `autoId` | `string \| null` | — | E2E scope, see E2E hooks. |

### Outputs

| Output | Payload | When |
| --- | --- | --- |
| `sdSelect` | `SdCalendarEvent<T>` | Click, tap, Enter or Space on an event (also sets `selectedId`). |
| `sdRangeChange` | `SdCalendarVisibleRange` | Once on init, then whenever `from`, `to` or the view on screen changes; never twice for the same range. |
| `sdMove` | `SdCalendarMoveRequest<T>` | `onMove` accepted and the data changed. |
| `sdMoveError` | `SdCalendarMoveError<T>` | `onMove` returned `false` (`reason: 'rejected'`) or threw (`'error'`). |
| `sdLoadError` | `unknown` | `onLoad` threw or rejected. Never for an aborted load. |

### Methods

- `reload(): void` — aborts the running load and a waiting move, then calls `onLoad` again for the range on screen. The events stay until the result arrives.
- `move(eventId, to: { start; end?; allDay? }, source = 'api'): Promise<boolean>` — runs the move pipeline. Resolves `true` only when `onMove` accepts. `false` without `option.move`, while locked or while another create/move waits, for an unknown id, a refused `movable`, the same position, a target outside `minDate`/`maxDate`, `false`, `'cancel'` or an error. Without `end` the duration is kept. `'api'` never asks for the scope of a recurring event (`scope: 'this'`) and never moves the focus.

### Configuration

```ts
providers: [{ provide: SD_CALENDAR_CONFIGURATION, useValue: { firstDayOfWeek: 1, step: 15, holidays, workingHours } }];
```

`ISdCalendarConfiguration` has `firstDayOfWeek`, `step`, `workingHours`, `holidays`, `scrollTime`. An input wins over the configuration, which wins over the defaults.

## Data source

`dataSource.onLoad({ from, to, view, signal })` is called on init, when the range changes, when `option` is a new object and on `reload()`. `from`/`to` are `'yyyy/MM/dd'`, both included.

- A newer call aborts `signal`; a late result is dropped.
- First load: progress bar, skeleton, `aria-busy`. Later loads: progress bar only. A new range empties the grid until the result; `reload()` and a new `option` for the same range keep the events.
- Throw or reject: a band with Retry and `sdLoadError`. The grid stays, without events. The text of the error is never shown.
- Duplicate or empty `id`, or an empty `title`: the data is refused (`invalid-data` state). An event with an unreadable date, or a timed event that does not end after it starts (or has no `end`), is skipped with one dev-mode warning.
- While any load runs, create and move are locked; navigation is not.

`option` is the signal to load again: when your filters change, assign a new object (or call `reload()`).

## Creating

With `option.create`, on week and day:

- Sweep with the mouse: `[min, max + step]`, inside the day, up to 24:00. A click or a tap creates one slot. `Enter` or `Space` on the grid creates the slot under the cursor.
- `creatable(range)` is checked while sweeping (a refused sweep is drawn grey) and again right before `onCreate`.
- While `onCreate` runs the dashed block stays with a sync icon, and no other create or move starts.
- Return the event to insert and select it (`selectedId`, no `sdSelect`). Return nothing when the user cancels. Throw for the `create-error` band.

## Moving

With `option.move`, on week and day: drag (5px threshold, a 400ms hold on touch), drag the bottom edge to change the end, `Alt` + arrows. `movable(event)` removes the handle and is checked again right before `onMove`.

1. A target outside `minDate`/`maxDate` is refused before `onMove` ("Outside the allowed range").
2. A recurring occurrence asks for the scope first (see Recurring events).
3. The block waits at the proposal, dashed, with a sync icon. Data does not change yet.
4. `onMove(request)` decides:

| Result | Data | Screen | Output | Announced |
| --- | --- | --- | --- | --- |
| `true` or nothing | replaced by a new object `{ ...event, start, end, allDay }` (same `data` reference) | normal | `sdMove(request)` after the change | moved / resized |
| `false` | unchanged | back in place, error outline, band with Dismiss | `sdMoveError({ request, reason: 'rejected' })` | rejected |
| `'cancel'` | unchanged | back in place, no outline, no band | — | cancelled |
| throw / reject | unchanged | as `false` | `sdMoveError({ request, reason: 'error', error })` | error |

Return `'cancel'` when the user closes a dialog of yours (a reason, a confirmation): nothing failed, so nothing is reported.

`request.signal` is aborted when the range changes, on `reload()`, for a new `option`, when `disabled` or `readonly` turns on and on destroy; a late answer is ignored. Aborting is cooperative: it does not undo a backend change that already happened. Only one create or move waits at a time.

A move started from the keyboard returns the focus to the block afterwards, even when `Alt` + `←`/`→` moved it into the next range; a focus the user moved elsewhere meanwhile stays there.

**Undo** (pattern S1): after `sdMove`, show a toast with an Undo action that calls `calendar.move(request.event.id, request.from, 'api')`.

## Recurring events

The calendar does not expand rules (no RRULE). Return each occurrence from `onLoad` with its own `id` and `occurrence: { seriesId, originalStart }`. An occurrence shows a repeat icon and "repeats" in its label. Moving it by drag, edge or keyboard opens a bar — "This event / This and following events / All events / Cancel" — with the focus on the first answer. Esc and Cancel put the block back. The answer goes into `request.scope`; after an accepted `following` or `all` the calendar reloads to fetch the changed series.

## Date values

Values are read through `SdDateTimeService`, in `ISdCoreConfiguration.timeZone`: an instant shows as the wall clock of the zone, a zone-less string keeps its digits.

- Timed events: `end` is exclusive. One that ends after midnight of its start day goes to the all-day row with its start time ("22:00 Night shift"); one that ends exactly at midnight stays in the grid until 24:00.
- All-day events: `end` is the last day, inclusive; without `end` one day.
- Emitted values (`onCreate` args, `request.from`/`to`, moved events): without `transform`, `'yyyy/MM/dd HH:mm:ss'` and `'yyyy/MM/dd'` for all-day; with `transform`, the instant of the wall clock in the zone (`ISOString`/`UTCString`, all-day = start of the day). `request.from` is re-serialized the same way, so `from` and `to` always match.
- The grid is 24 wall-clock hours; a 23- or 25-hour DST day never shifts the next day.

## Views

- **Week** (default): day headers (click a number for its day), all-day row (three rows, then "+N" per day), hour lines, off hours, holidays, the current time in today's column (updated every minute).
- **Day**: one column; multi-day bars show the dates they span.
- **Month**: up to three lines per day ("+N more" past three, two with a holiday). Click a day or "+N more" for its day. No drag in month.
- **Agenda**: `agendaDays` days, days without events or holidays left out, an empty state.

## Compact layout

Under 600px of **host** width (`ResizeObserver`, not a media query — the calendar can sit in a narrow column of a desktop page; the other screens of the app switch at 768px of viewport, which is intended): a two-row toolbar with 44px targets, the week drawn as a day with a 7-day strip (swipe it for another week), the time grid swipes by day (60px), month cells show up to three colour dots, and the agenda is one column. `view` stays `'week'` while the week is drawn as a day; `onLoad` and `sdRangeChange` then receive `view: 'day'` and one day.

### URL sync

Keep `?view=` in sync with the `view` model and `?date=` with the `date` model:

```html
<sd-calendar [option]="option" [view]="view()" (viewChange)="setQuery({ view: $event })" [date]="date()" (dateChange)="setQuery({ date: $event })" />
```

Do not write `?view=` from `sdRangeChange`: in the compact layout it reports `'day'` for a week. Setting `view`/`date` back from the URL does not emit `sdRangeChange` again when the range is the same.

## Templates

| Directive | Context | Replaces |
| --- | --- | --- |
| `ng-template[sdCalendarEventTemplate]` | `$implicit`/`event`, `range`, `view`, `compact` (block under 34px), `pending` | The content of a timed block; frame, colour, dot, handle and states stay. |
| `ng-template[sdCalendarDayCellTemplate]` | `$implicit`/`date` (`'yyyy/MM/dd'`), `events`, `holiday`, `today`, `inMonth`, `off` | The part of a month cell under the day number (a timesheet code). |
| `ng-template[sdCalendarAgendaItemTemplate]` | as the event template, without `compact` | A place column of agenda rows, shown from 720px of width. |
| `ng-template[sdCalendarEmptyTemplate]` | `$implicit: SdCalendarVisibleRange` | The empty agenda. |

## Keyboard

| Where | Keys |
| --- | --- |
| Time grid (one tab stop, `aria-activedescendant`) | `↑` `↓` slot, `←` `→` day (next range at the edge, reversed in RTL), `Home`/`End` working hours, `PageUp`/`PageDown` range, `T` today, `Enter`/`Space` create |
| Event | `Enter`/`Space` select, `Esc` clear and back to the grid, `Alt` + `↑` `↓` move by `min(step, 15)`, `Alt` + `Shift` + `↑` `↓` change the end, `Alt` + `←` `→` one day (all-day bars: `←` `→` only). Arrows without `Alt` do nothing. |
| Month (roving tabindex) | `←` `→` day, `↑` `↓` week, `Home`/`End` row, `PageUp`/`PageDown` month, `Shift` + those for a year, `Enter`/`Space` open the day |
| Agenda row | `Enter`/`Space` select |

## Accessibility

- A region named by `ariaLabel`, one polite status region for the cursor, saving, moved, resized, cancelled, rejected, errors, out of range and load errors.
- Events are buttons named "{title}, {weekday} {date}, {start} to {end}[, repeats]"; month cells "{weekday} {date}[, {holiday}], {count} events".
- The scope bar is an `alertdialog`. `prefers-reduced-motion` stops transitions and the sync icon; `forced-colors` uses `CanvasText` frames and `Highlight` for selected, pending and the now line.
- Hover only adds visuals; everything works with the keyboard and with `pointer: coarse`.

## Theming

Five colour tokens: `--sd-calendar-line`, `--sd-calendar-line-half`, `--sd-calendar-off-hours`, `--sd-calendar-now`, `--sd-calendar-today` (see `THEME.md`). Sizes on the host: `--sd-calendar-hour-height` (48px), `--sd-calendar-gutter-width` (56px, 48px compact), `--sd-calendar-event-radius`. The host has `display: block`; give it a height, or the grid scrolls inside 620px.

Printing shows the current view without navigation, only the working hours of the days on screen. The calendar does not set `@page`.

## E2E hooks

With `autoId` the root has `data-autoid="components-calendar-{autoId}"`, and an event `…-event-{encodeURIComponent(id)}` (on its first segment only when a multi-day event repeats in month cells or agenda days). Toolbar buttons: `…-today`, `…-prev`, `…-next`, `…-view-{view}`, bands: `…-retry`, `…-dismiss`, scope bar: `…-scope-{this|following|all|cancel}`.

Always present (with or without `autoId`):

| Element | Attributes |
| --- | --- |
| Root | `data-view`, `data-display` (what is drawn: a narrow week is `day`), `data-from`, `data-to`, `data-compact` |
| Block (time grid) | `data-event-id`, `data-start`, `data-end`, `data-all-day`, `data-pending`, `data-selected`, `data-failed`, `data-past`, `data-color`, `data-size`, `data-movable`, `data-dragging`; its resize handle `data-resize-handle` |
| All-day bar | `data-event-id`, `data-start`, `data-end`, `data-all-day`, `data-pending`, `data-selected`, `data-failed`, `data-past`, `data-color`, `data-clipped-start`, `data-clipped-end` |
| Month chip | `data-event-id`, `data-color`, `data-past`, `data-selected` |
| Agenda row | `data-event-id`, `data-color`, `data-past`, `data-pending`, `data-selected`; the place column `data-agenda-place` |
| Transient | `data-create-ghost` (with `data-pending`, `data-blocked`), `data-drag-proposal`, `data-now`, `data-skeleton` |
| Time grid | `data-region="time-grid"`, day columns `data-day-column` + `data-date`, `data-off`, `data-today`, `data-out-of-range`; headers `data-day-header` |
| Month cell | `role="gridcell"` + `data-date` |
| Agenda day | `data-agenda-day` + `data-date` |
| Toolbar | `data-title`, `data-zone`, narrow day strip `data-day-strip` |
| Buttons | `data-action` (`today`, `prev`, `next`, `retry`, `dismiss`), `data-view-option`, `data-more`, `data-scope` |
| Bands | `data-band="load-error"`, `data-band="move-error"` |

## Limits (this release)

- No client-side RRULE expansion, no `.ics` export, no drag in month, no drag of all-day bars or between the all-day row and the grid.
- No built-in event form: use `onCreate` and `sdSelect` with your own drawer or dialog.
- No virtual scrolling; around 500 events in a week stay smooth.

## Anti-patterns

- Do NOT mutate the array or the events you returned from `onLoad`; give a new `option` or call `reload()`.
- Do NOT call your API from `movable` or `creatable`: they run while rendering. Decide in `onMove`/`onCreate`.
- Do NOT parse or format the emitted values with `new Date(value)`; read them with `SdDateTimeService` or send them as they are.
