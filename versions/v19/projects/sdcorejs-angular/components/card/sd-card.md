# `<sd-card>` and `<sd-card-group>`

**Type**: Standalone components
**Selectors**: `sd-card`, `sd-card-group`, `ng-template[sdCardActions]`
**Import path**: `@sdcorejs/angular/components/card` (or barrel: `@sdcorejs/angular/components`)
**Classes**: `SdCard`, `SdCardGroup`, `SdCardActionsDirective`
**Change detection**: `OnPush`

## Purpose

`SdCard` is one card surface with three behaviors and five built-in content layouts:

- `behavior` decides how the card reacts: `static` (read-only surface), `link` (the whole card is one `<a>`) or `select` (toggles, or drives the nearest `SdCardGroup` model).
- `content` picks a layout (`stat`, `option`, `entity`, `file`, `shortcut`) and its data. Without `content` the card projects `ng-content` and the consumer owns the markup.
- `loading`, `error` (with `sdRetry`) and `size` are card-level states shared by every layout.

Put cards inside `SdCardGroup` for a controlled single- or multiple-selection model. There is no separate stat-card component: a KPI tile is `<sd-card [content]="{ layout: 'stat', data }">`.

## Import

```ts
import {
  SdCard,
  SdCardActionsDirective,
  SdCardGroup,
  type SdCardCompareWith,
  type SdCardContent,
} from '@sdcorejs/angular/components/card';
```

## Behavior

`behavior` resolves to the input when set, otherwise to `select` inside `sd-card-group` and to `static` everywhere else.

|              | `static`                                  | `link`                                     | `select`                                                |
| ------------ | ----------------------------------------- | ------------------------------------------ | ------------------------------------------------------- |
| Role on host | none (`group` with a label for layouts)   | none                                       | `button`; `option` cards: `radio` or `checkbox`         |
| Focus        | none                                      | the inner `<a class="sd-card__link">`      | the host (`tabindex` 0, -1 when disabled)               |
| Click        | native click passes through, no `(click)` | the anchor navigates, then `(click)` emits | toggles, then `(click)` emits (300 ms leading throttle) |
| Keyboard     | none                                      | Enter on the anchor                        | Enter and Space; arrow keys in a radiogroup             |

`link` renders `RouterLink` from `link` + `queryParams`, or a plain `href` + `target` for external files. When both `link` and `href` are set, `link` wins and a dev-mode warning is logged. A disabled link has no `href`, `aria-disabled="true"` and `tabindex="-1"`.

Inside a group, a card whose resolved behavior is not `select` is ignored by the group: it is never selected and never toggles the model. A `select` card inside a group needs `value`; without it the card logs a dev-mode error and ignores clicks.

Layouts restrict the behaviors they accept. An invalid combination logs a dev-mode error and renders as `static`:

| Layout            | Valid behaviors      |
| ----------------- | -------------------- |
| projected content | static, link, select |
| `stat`            | static, link, select |
| `option`          | select               |
| `entity`          | static, link, select |
| `file`            | static, link, select |
| `shortcut`        | link                 |

## Group API

| Name          | Type                   | Default     | Notes                                                                                                  |
| ------------- | ---------------------- | ----------- | ------------------------------------------------------------------------------------------------------ |
| `model`       | `T \| T[] \| null`     | `null`      | Signal model; supports `[(model)]`.                                                                    |
| `multiple`    | `boolean`              | `false`     | Uses `booleanAttribute`; a bare `multiple` attribute is valid.                                         |
| `disabled`    | `boolean`              | `false`     | Disables every descendant card.                                                                        |
| `color`       | `SdColor`              | `'primary'` | Default semantic color inherited by cards.                                                             |
| `autoId`      | `string \| null`       | `undefined` | Emits `data-autoid="components-card-group-<value>"` for stable inspection and E2E selection.           |
| `compareWith` | `SdCardCompareWith<T>` | `Object.is` | Compares object values by a consumer-owned key when needed.                                            |
| `sdChange`    | `T \| T[] \| null`     | —           | Emits once after an accepted user interaction changes the model. External model writes do not emit it. |

`model()` supplies Angular's two-way binding machinery automatically. Use `(sdChange)` for reload/filter side effects.

In multiple mode updates are immutable. If an external value has the wrong shape, it is left alone until the next interaction, which normalizes it to the selected mode without throwing or emitting a synthetic change.

## Card API

| Name          | Type                           | Default     | Notes                                                                                                            |
| ------------- | ------------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| `value`       | `NonNullable<T> \| undefined`  | `undefined` | Identity stored by the nearest group. Required for `select` inside a group. `null` is reserved for no selection. |
| `behavior`    | `SdCardBehavior \| undefined`  | `undefined` | `'static' \| 'link' \| 'select'`; see [Behavior](#behavior).                                                     |
| `content`     | `SdCardContent \| undefined`   | `undefined` | Built-in layout and data; without it the card projects `ng-content`.                                             |
| `size`        | `SdCardSize \| undefined`      | `undefined` | `'md' \| 'sm'`; see [Size](#size).                                                                               |
| `loading`     | `boolean`                      | `false`     | Skeleton state; needs `content`.                                                                                 |
| `error`       | `boolean`                      | `false`     | Failed state with a Retry button; needs `content`.                                                               |
| `link`        | `string \| readonly unknown[]` | `undefined` | Router commands for `behavior="link"`.                                                                           |
| `queryParams` | `Params`                       | `undefined` | Goes with `link`.                                                                                                |
| `href`        | `string`                       | `undefined` | External URL or file download for `behavior="link"`.                                                             |
| `target`      | `string`                       | `undefined` | Only applies to `href`; `_blank` adds `rel="noopener noreferrer"`.                                               |
| `disabled`    | `boolean`                      | `false`     | Disables this card; group disabled state also applies.                                                           |
| `color`       | `SdColor \| undefined`         | `undefined` | Overrides group color. Precedence is card → group → `'primary'`.                                                 |
| `autoId`      | `string \| null`               | `undefined` | Emits `data-autoid="components-card-<value>"` for stable inspection and E2E selection.                           |
| `selected`    | `Signal<boolean>`              | `false`     | Read-only; always `false` unless the card behaves as `select`. Read it through `exportAs="sdCard"`.              |
| `click`       | `Event`                        | —           | `select`: after the state changed. `link`: after navigation started. Never emitted by `static` cards.            |
| `sdRetry`     | `void`                         | —           | The user pressed Retry in the error state. The card's behavior is not triggered.                                 |

A `select` card uses `role="button"` and `aria-pressed` (`option` cards: `radio`/`checkbox` and `aria-checked`), `aria-disabled` and a disabled-aware `tabindex`. Enter and Space use the same activation path as pointer clicks; Space prevents page scrolling. Native click bubbling is isolated so a consumer receives one custom `(click)` event.

## Standalone card

A standalone card is `static` unless you set `behavior`. With `behavior="select"` it owns a private boolean signal and toggles it on each accepted click. The selected state is readable, not bindable.

```ts
readonly standaloneSelected = signal(false);

readonly handleStandaloneClick = (selected: boolean): void => {
  this.standaloneSelected.set(selected);
};
```

```html
<sd-card #card="sdCard" behavior="select" value="participating" autoId="participating" (click)="handleStandaloneClick(card.selected())">
  <div class="card-content">Consumer-defined icon and content</div>
</sd-card>
```

## Single selection

Bind a `WritableSignal` by name—`[(model)]="selectedStatus"`, not `selectedStatus()`.

```ts
interface Status {
  code: string;
  name: string;
}

readonly statuses: Status[] = [
  { code: 'active', name: 'Đang hoạt động' },
  { code: 'paused', name: 'Tạm dừng' },
];
readonly selectedStatus = signal<Status | null>(null);
```

```html
<sd-card-group class="status-grid" autoId="status-single" [(model)]="selectedStatus" (sdChange)="reloadListing($event)">
  @for (status of statuses; track status.code) {
  <sd-card #card="sdCard" [value]="status" [autoId]="'status-single-' + status.code">
    <span>{{ status.name }}</span>
    <span>{{ card.selected() ? 'Đã chọn' : 'Chọn' }}</span>
  </sd-card>
  }
</sd-card-group>
```

Clicking the selected card again clears the single model to `null`.

## Multiple selection

```ts
readonly selectedStatuses = signal<Status[]>([]);
```

```html
<sd-card-group class="status-grid" autoId="status-multiple" multiple [(model)]="selectedStatuses" (sdChange)="reloadListing($event)">
  @for (status of statuses; track status.code) {
  <sd-card [value]="status" [autoId]="'status-multiple-' + status.code">{{ status.name }}</sd-card>
  }
</sd-card-group>
```

## Object values and `compareWith`

Use a stable comparator when the model and card options can contain different object references representing the same business item.

```ts
readonly selectedStatus = signal<Status | null>({ code: 'active', name: 'External reference' });
readonly compareStatus: SdCardCompareWith<Status> = (a, b) => a.code === b.code;
```

```html
<sd-card-group autoId="status-compare" [(model)]="selectedStatus" [compareWith]="compareStatus" (sdChange)="reloadListing($event)">
  @for (status of statuses; track status.code) {
  <sd-card [value]="status" [autoId]="'status-compare-' + status.code">{{ status.name }}</sd-card>
  }
</sd-card-group>
```

## Disabled and color states

```html
<sd-card-group autoId="status-colors" color="info" [(model)]="selectedStatus">
  <sd-card value="inherited" autoId="status-inherited">Inherits info</sd-card>
  <sd-card value="override" autoId="status-override" color="warning">Overrides with warning</sd-card>
  <sd-card value="locked" autoId="status-locked" disabled>Can remain visibly selected when supplied by the model</sd-card>
</sd-card-group>

<sd-card-group autoId="status-unavailable" disabled aria-label="Unavailable choices">
  <sd-card value="unavailable" autoId="status-unavailable-card">Whole group disabled</sd-card>
</sd-card-group>
```

The selected styling remains visible when an external model contains a disabled card. `SdCardGroup` never chooses columns, width, or gap; apply `sd-card-grid` or your own grid/flex classes to the group.

## Layouts

Every layout renders its own padding; the host keeps only border, radius and background. Single-line text ends with an ellipsis and carries the full string in `title`. Numbers use tabular figures.

### `stat`

```ts
readonly revenue: SdCardContent = {
  layout: 'stat',
  data: { label: 'Doanh thu', value: 86_400_000, format: 'compact', context: 'Tháng này', delta: { value: 0.064, positive: 'up' } },
};
```

```html
<sd-card behavior="link" link="/reports/revenue" [content]="revenue" />
```

| `format`  | Output                                                                                                                                  |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `number`  | Default. `Intl.NumberFormat` with `precision` fraction digits (default 0).                                                              |
| `compact` | `86,4 triệu` and `1,82 tỷ` in Vietnamese (long words), `86.4M` in other locales; override with `SD_CARD_CONFIGURATION.compactDisplay`. |
| `percent` | `value` is a ratio: `0.427` → `42,7%`.                                                                                                  |
| `text`    | The string as is.                                                                                                                       |

`null` renders `—`. A string value with a numeric format renders as is and logs a dev-mode warning. The full number (never compact) goes into `title` and the accessible name. The locale follows the active `I18nService` language.

The delta chip shows the absolute delta in the same format with an arrow. It is green when `value > 0` with `positive: 'up'` (default) or `value < 0` with `positive: 'down'`, red otherwise, and neutral with "No change" at 0. `contextColor` colors the context line with the dark shade of that color. The value is accent-colored for `link` and `select`. A `link` stat whose value is `0` renders as `static`, so it never opens an empty list. `sm` keeps the label and the value only.

### `option`

A choice tile for a selection group: icon tile, title, description, optional `badge` and a check mark. Only `select` is valid, and there is no `sm` variant.

```html
<sd-card-group aria-label="Gói dịch vụ" [(model)]="plan">
  @for (option of plans; track option.code) {
  <sd-card [value]="option.code" [content]="{ layout: 'option', data: option }" />
  }
</sd-card-group>
```

When every card of a single-selection group is an `option`, the group becomes `role="radiogroup"` and the cards `role="radio"`. The group has one tab stop (the selected card, else the first enabled one), and arrow keys move focus and selection, wrapping and skipping disabled cards. In a `multiple` group the cards are checkboxes. One card of another kind keeps `role="group"`.

### `entity`

A record summary: avatar (`text`, `src` or `icon`), title, subtitle, `badge` and up to three `meta` fields. The title is accent-colored for `link`. `sm` is one row with avatar, title and subtitle, plus a check mark when selected.

```ts
readonly customer: SdCardContent = {
  layout: 'entity',
  data: {
    title: 'Nguyễn Văn An',
    subtitle: 'an.nguyen@example.com',
    avatar: { text: 'Nguyễn Văn An' },
    badge: { title: 'VIP', color: 'warning' },
    meta: [
      { label: 'Đơn', value: '12' },
      { label: 'Chi tiêu', value: '18,4 triệu' },
    ],
  },
};
```

### `file`

A file tile: `thumbnail` (lazy, empty `alt`) or an icon by type, a two-line name and "TYPE · size". The type comes from `type` (MIME or extension) or from the extension of `name`: pdf, sheet (xls, xlsx, csv), doc (doc, docx, txt, rtf), image, other. Sizes use base 1024 with one fraction digit below 10 units. `md` only. Downloading or previewing through `href` is up to the consumer.

```html
<sd-card behavior="link" target="_blank" [href]="file.url" [content]="{ layout: 'file', data: { name: file.name, size: file.size } }">
  <ng-template sdCardActions>
    <button mat-icon-button aria-label="Tác vụ" [matMenuTriggerFor]="menu"><mat-icon>more_vert</mat-icon></button>
  </ng-template>
</sd-card>
```

### `shortcut`

A navigation tile: icon, label, optional description. Only `link` is valid. `sm` is one row with the icon and the label.

```html
<sd-card behavior="link" link="/orders/new" [content]="{ layout: 'shortcut', data: { label: 'Tạo đơn', icon: 'add_shopping_cart' } }" />
```

### Actions (`sdCardActions`)

`<ng-template sdCardActions>` adds an action area (for example a ⋯ menu) to the top-right corner of `entity` (md) and `file` cards. It renders outside the anchor of a link card, and clicks inside it never select, navigate or reach the card's listeners. Other layouts log a dev-mode warning and render nothing. Give the buttons an accessible name; the area keeps a 32×32px hit target (44×44px on coarse pointers).

## States

- `loading`: grey blocks replace the text (the `stat` label stays), `aria-busy="true"`, activation is blocked while the colors stay normal, and the card height does not change when loading ends. No effect without `content`.
- `error`: a `stat` shows `—` and "Couldn't load · Retry"; other layouts show an error row with a Retry button. Retry emits `sdRetry` and never triggers the card's behavior. A failed `link` card renders no anchor. A failed card never shows `0`. No effect without `content`.
- `disabled`: as before; for `link` see [Behavior](#behavior).

## Size

`size` resolves to the input when set, otherwise to `sm` while the surrounding layout is compact and to `md` elsewhere. `sd-page-list` provides the `SD_CARD_LAYOUT` token, so cards inside it turn `sm` with the page list's compact mode. `option` and `file` always render `md`.

The global classes `sd-card-grid` (auto-fit columns of at least 200px, 12px gap) and `sd-card-grid--sm` (a wrapping row with an 8px gap) lay out a card group:

```html
<sd-card-group class="sd-card-grid" [class.sd-card-grid--sm]="compact()" [(model)]="status">…</sd-card-group>
```

## Configuration

```ts
providers: [{ provide: SD_CARD_CONFIGURATION, useValue: { compactDisplay: 'short' } satisfies SdCardConfiguration }];
```

## Migration from 3.5

Standalone cards (outside a group) used to toggle. They are `static` now; add `behavior="select"` to keep the toggle:

```html
<!-- before -->
<sd-card #card="sdCard" value="participating">…</sd-card>
<!-- after -->
<sd-card #card="sdCard" behavior="select" value="participating">…</sd-card>
```

`value` is optional now, so `SdCard<T>` infers `T` from `[value]` only when it is bound.

## Anti-patterns

- Do not add `[selected]` or `(selectedChange)`; grouped state comes from `model`, and standalone state is internal.
- Do not bind `[(model)]="selectedStatus()"`; two-way signal binding takes the signal field.
- Use `(sdChange)` for application effects; the framework-owned two-way binding channel is not an application event.
- Do not use `JSON.stringify` as an object comparator; pass a stable business-key `compareWith`.
- Do not expect the group to create a grid. Use `sd-card-grid` or your own layout.
- Do not build KPI tiles from projected markup when `layout: 'stat'` fits; it already handles formatting, loading, error and compact size.
- Do not put buttons inside a `link` card's projected content; use `sdCardActions` so they sit outside the anchor.
