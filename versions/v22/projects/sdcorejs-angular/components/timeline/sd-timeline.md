# `<sd-timeline>`

**Type**: Standalone component
**Selector**: `sd-timeline`
**Import path**: `@sdcorejs/angular/components/timeline` (or barrel: `@sdcorejs/angular/components`)
**Classes**: `SdTimeline`, `SdTimelineItemContentDirective`, `SdTimelineItemActionsDirective`, `SdTimelineEmptyDirective`
**Change detection**: `OnPush`

## Purpose

A vertical timeline for the activity of one record: comments, field changes and events. Every entry shares one frame — a marker, then "actor · action · time" — and its body comes from `content: { layout, data }` with three layouts: `comment`, `change`, `event`. Entries come from `items`, or page by page from `option.dataSource.onLoad` with a cursor.

`sd-timeline` replaces `sd-history`, which was removed. The comment box, the All / Comments / Changes filter and @mentions belong to the activity pattern, not to this component.

## Import

```ts
import { SdTimeline, type SdTimelineItem } from '@sdcorejs/angular/components/timeline';
```

## Quick start

```ts
readonly activity: SdTimelineItem[] = [
  { id: 'c1', at: '2026-11-08T03:00:00Z', actor: { name: 'Lê Minh' }, content: { layout: 'comment', data: { text: 'Khách hẹn nhận sau 14h.' } } },
  {
    id: 'ch1',
    at: '2026-11-08T01:00:00Z',
    actor: { name: 'Trần Thu Hà' },
    content: {
      layout: 'change',
      data: {
        title: 'đổi trạng thái',
        changes: [{ label: 'Trạng thái', from: { badge: { title: 'Chờ xác nhận', color: 'warning' } }, to: { badge: { title: 'Đang giao', color: 'info' } } }],
      },
    },
  },
  { id: 'e1', at: '2026-11-02T03:02:00Z', icon: 'close', color: 'error', content: { layout: 'event', data: { title: 'từ chối', note: 'Thiếu chứng từ.' } } },
];
```

```html
<sd-timeline autoId="order-activity" [items]="activity" />
```

## API

| Input          | Type                                       | Default         | Notes                                                                                         |
| -------------- | ------------------------------------------ | --------------- | --------------------------------------------------------------------------------------------- |
| `items`        | `readonly SdTimelineItem<T>[] \| undefined` | `undefined`     | Entries to show. Ignored when `option` is set (dev-mode warning when both are set).           |
| `option`       | `SdTimelineOption<T> \| undefined`          | `undefined`     | Cursor-paged data source; the timeline manages loading and errors.                            |
| `groupBy`      | `'day' \| 'none'`                           | `'day'`         | `day`: a heading at every day change. `none`: the full date on each entry.                    |
| `size`         | `'md' \| 'sm'`                              | `'md'`          | `sm` for side columns and drawers: 24px markers, 13px text, no source.                        |
| `emptyText`    | `string \| undefined`                       | i18n `empty`    | Text of the empty state.                                                                      |
| `ariaLabel`    | `string \| undefined`                       | i18n `label`    | Accessible name of the region.                                                                |
| `autoId`       | `string \| null \| undefined`               | `undefined`     | `data-autoid="components-timeline-<value>"`; also prefixes the entry label ids.               |
| `headingLevel` | `2 \| 3 \| 4`                               | `3`             | `aria-level` of the day headings, to fit the heading outline of the page.                     |

| Output        | Payload   | When                                              |
| ------------- | --------- | ------------------------------------------------- |
| `sdLoadError` | `unknown` | `onLoad` threw, on the first load or a later page. |

| Method       | Notes                                                                                                                         |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `reload()`   | Aborts the running load and calls `onLoad` with `cursor: null`. The shown entries stay under a progress bar until the result. |
| `loadMore()` | Loads the next page; ignored while a load runs or when `nextCursor` is `null`.                                                |

### Model

```ts
interface SdTimelineItem<T = unknown> {
  id: string;
  at: string | number | Date; // read through SdDateTimeService in the configured zone
  actor?: { name: string; avatar?: string }; // marker is an avatar; without it the marker is an icon
  icon?: string; // overrides the layout icon (comment → chat_bubble, change → edit, event → circle)
  color?: SdColor; // ring of the icon marker; neutral by default
  source?: string; // "Web", "API"…; hidden at size sm
  content: SdTimelineContent;
  data?: T; // original DTO for templates, kept by reference
}

type SdTimelineContent =
  | { layout: 'comment'; data: { text: string; edited?: boolean } }
  | { layout: 'change'; data: { title: string; changes: readonly SdTimelineChange[]; badge?: SdBadgeData; note?: string } }
  | { layout: 'event'; data: { title: string; badge?: SdBadgeData; note?: string } };

interface SdTimelineChange {
  label: string;
  from?: SdTimelineValue;
  to?: SdTimelineValue;
}
type SdTimelineValue = string | number | null | { badge: SdBadgeData };
```

## Layouts

- **`comment`**: plain text written by a user, in a grey frame — the only framed layout. Line breaks are kept; the text is clamped to three lines with "Show more" / "Show less", shown only when the text is really clamped (measured after render and when the width changes). `edited: true` adds "· edited" after the time. The action reads "commented".
- **`change`**: one row per field, "label: old → new". Old text is struck through, empty values (`null`, `undefined`, `''`) show "—", `{ badge }` shows an `sd-badge`, numbers use the locale. Three rows show; the rest fold into "+N more changes". `note` sits under the rows.
- **`event`**: only the first line, plus an optional `note` in plain text (no frame, three-line clamp). Without `actor` it is a system event with an icon marker.

`badge` (change and event) sits right after the action.

## Grouping and time

- `groupBy="day"`: consecutive entries of the same day in the zone of `SdDateTimeService` form a group under "Today", "Yesterday" or `dd/MM/yyyy`. Entries are never reordered, so newest-first and oldest-first lists both work; a page that starts on the last shown day joins that group.
- Times: within the last hour of today "just now" or "N min ago" (one timer per instance, outside the zone, writing only when a label changes), otherwise `HH:mm`. With `groupBy="none"` every entry shows `HH:mm dd/MM/yyyy` and the actor, time and source move to a second line.
- Every time is a `<time datetime>` whose `title` is `HH:mm dd/MM/yyyy (GMT+7)`.

## Data source

```ts
readonly option: SdTimelineOption<OrderEventDto> = {
  pageSize: 20,
  loadMore: 'button', // or 'auto'
  dataSource: {
    onLoad: ({ cursor, pageSize, signal }) => firstValueFrom(this.api.activity(this.orderId, { cursor, pageSize }, { signal })),
  },
};
```

- First load: three skeleton rows and `aria-busy="true"`.
- `loadMore: 'button'`: a "Show N more" text button under the list; `'auto'` also loads when a sentinel comes within 200px (`IntersectionObserver`) and the list becomes `role="feed"` with `aria-posinset` / `aria-setsize`.
- Loading more: a 16px spinner with "Loading…". No next page: nothing.
- First-load error: "Couldn't load activity." with a Retry button (`reload()`), never the empty text. Load-more error: the entries stay and an error row offers Retry with the same cursor. Both emit `sdLoadError`.
- With `items` there is only empty or data; wrap the timeline in `sd-data-state` for your own loading and error states.

## Templates

| Template                                     | Context                    | Notes                                                                 |
| -------------------------------------------- | -------------------------- | --------------------------------------------------------------------- |
| `<ng-template sdTimelineItemContent let-item>` | `{ $implicit: SdTimelineItem<T> }` | Replaces the body of every layout; marker and first line stay. |
| `<ng-template sdTimelineItemActions let-item>` | `{ $implicit: SdTimelineItem<T> }` | Action area at the end of the first line (for example edit/delete). Visible on hover and focus, always on coarse pointers; it keeps its room so the line never jumps. |
| `<ng-template sdTimelineEmpty>`              | none                       | Replaces the empty state.                                             |

```html
<sd-timeline [items]="activity">
  <ng-template sdTimelineItemActions let-item>
    @if (item.content.layout === 'comment') {
      <sd-button type="text" prefixIcon="edit" tooltip="Sửa" (click)="edit(item)" />
    }
  </ng-template>
</sd-timeline>
```

## Accessibility

- The root is `<section role="region">` named by `ariaLabel`; the list is an `<ol>`, each day group an `<li>` with a heading (`role="heading"`, `aria-level` from `headingLevel`) and a nested `<ol>`.
- Each entry is an `<article aria-labelledby>` whose label joins the actor, the action ("Comment by {name}" for comments), the badge and the full time.
- "Show more" and "+N more changes" carry `aria-expanded`; text buttons keep a 32px (44px coarse) hit area. Decorative icons are hidden from assistive technology.

## Theming

`--sd-timeline-line` (component token, `var(--sd-border)` by default) colours the connector. Markers use the palette: `<color>-light` ring and `<color>-dark` icon, neutral `surface-muted` / `text-secondary` by default. No `min-width`: the timeline shrinks to 240px without horizontal overflow. Print expands clamped texts and hides the buttons and actions; there is no animation under `prefers-reduced-motion`.

## Migration from `sd-history`

`@sdcorejs/angular/components/history` (`SdHistoryItem`, `sd-history`, `viewDateTime`) was removed.

| `SdHistoryItemType`             | `SdTimelineItem`                                                         |
| ------------------------------- | ------------------------------------------------------------------------ |
| —                               | `id` (new, required)                                                     |
| —                               | `content.layout: 'event'`                                                |
| `title`                         | `content.data.title`                                                     |
| `status { title, color, icon }` | `content.data.badge` (`SdBadgeData`); `icon` can become the entry `icon` |
| `date`                          | `at` (required)                                                          |
| `actor` (username)              | `actor.name` (display name; no "By @" prefix)                            |
| `source`                        | `source`                                                                 |
| `description`                   | `content.data.note`                                                      |

```ts
readonly timeline = computed<SdTimelineItem[]>(() =>
  this.history().map((entry, index) => ({
    id: String(index),
    at: entry.date!,
    actor: entry.actor ? { name: entry.actor } : undefined,
    source: entry.source,
    content: { layout: 'event', data: { title: entry.title, badge: entry.status, note: entry.description } },
  }))
);
```

```diff
- <sd-history [items]="history()" />
+ <sd-timeline groupBy="none" [items]="timeline()" />
```

## Anti-patterns

- Do not put a comment box or a filter inside the timeline; compose them around it.
- Do not sort entries to get day groups; pass them in the order you want shown.
- Do not frame event notes yourself; only comments are framed, so users can tell what people wrote from what the system logged.
- Do not use a layout for content it does not fit; use `sdTimelineItemContent`.
