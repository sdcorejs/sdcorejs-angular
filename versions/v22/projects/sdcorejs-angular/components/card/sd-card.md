# `<sd-card>` and `<sd-card-group>`

**Type**: Standalone components
**Selectors**: `sd-card`, `sd-card-group`
**Import path**: `@sdcorejs/angular/components/card` (or barrel: `@sdcorejs/angular/components`)
**Classes**: `SdCard`, `SdCardGroup`
**Change detection**: `OnPush`

## Purpose

`SdCard` is an accessible selectable shell for arbitrary consumer content. Put cards inside `SdCardGroup` for a controlled single- or multiple-selection model, or use a card by itself for a small internal toggle.

The components do not own application layout or content. Each template contains one generic projection region, and the consumer decides the grid, spacing, icon, title, description, and inner markup.

## Import

```ts
import { SdCard, SdCardGroup, type SdCardCompareWith } from '@sdcorejs/angular/components/card';
```

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

| Name       | Type                   | Default            | Notes                                                                                                                   |
| ---------- | ---------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `value`    | non-null `T`           | required           | Identity stored by the nearest group. `null` is reserved for no selection.                                              |
| `disabled` | `boolean`              | `false`            | Disables this card; group disabled state also applies.                                                                  |
| `color`    | `SdColor \| undefined` | `undefined`        | Overrides group color. Precedence is card → group → `'primary'`.                                                        |
| `autoId`   | `string \| null`       | `undefined`        | Emits `data-autoid="components-card-<value>"` for stable inspection and E2E selection.                                  |
| `selected` | `Signal<boolean>`      | `false` standalone | Read-only state. Use `card.selected()` through `exportAs="sdCard"`; there is no `[selected]` input or `selectedChange`. |
| `click`    | `Event`                | —                  | Leading-edge 300 ms throttle; emits after state changes. Disabled activation is suppressed.                             |

`SdCard` uses `role="button"`, `aria-pressed`, `aria-disabled`, and a disabled-aware `tabindex`. Enter and Space use the same activation path as pointer clicks; Space prevents page scrolling. Native click bubbling is isolated so a consumer receives one custom `(click)` event.

## Standalone card

An enabled standalone card owns a private boolean signal and toggles it on each accepted click. The selected state is readable, not bindable.

```ts
readonly standaloneSelected = signal(false);

readonly handleStandaloneClick = (selected: boolean): void => {
  this.standaloneSelected.set(selected);
};
```

```html
<sd-card #card="sdCard" value="participating" autoId="participating" (click)="handleStandaloneClick(card.selected())">
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

The selected styling remains visible when an external model contains a disabled card. Consumers should apply grid/flex classes to the group themselves; `SdCardGroup` never chooses columns, width, or gap.

## Anti-patterns

- Do not add `[selected]` or `(selectedChange)`; grouped state comes from `model`, and standalone state is internal.
- Do not bind `[(model)]="selectedStatus()"`; two-way signal binding takes the signal field.
- Use `(sdChange)` for application effects; the framework-owned two-way binding channel is not an application event.
- Do not use `JSON.stringify` as an object comparator; pass a stable business-key `compareWith`.
- Do not expect the group to create a grid. Layout belongs to the consumer.
