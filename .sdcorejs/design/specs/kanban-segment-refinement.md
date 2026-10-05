# Design Spec — Kanban / Segmented control refinement

Naming: the choice control was renamed before release to `sd-segmented` / `SdSegmentedComponent`, display name
"Segmented control" (user-approved, 2026-10-04). This artifact keeps its historical `kanban-segment-refinement`
filename and IDs.

## Source

- Approval: Claude Code transcript, 2026-10-04 (user: "Chốt, giao opus làm nha"). Bounded library scope.
- PRD / user stories / acceptance criteria: none as `.sdcorejs/product/**` artifacts. The approved design text
  in the transcript is the requirement source. Its items are numbered 1–4 below as AC-1…AC-4.
- Decisions and critique: `.sdcorejs/design/decisions/kanban-segment-refinement.md`.

## Screens

| Screen                     | Route                           | Purpose                                      | AC               |
| -------------------------- | ------------------------------- | -------------------------------------------- | ---------------- |
| Kanban showcase            | `/v/:version/components/kanban` | Local, CMS and async boards                  | AC-1, AC-2, AC-4 |
| Segmented control showcase | `/v/:version/forms/segmented`   | Types, sizes, colours, multiple, form states | AC-3             |

## Layout

```text
Kanban lane (280px, --sd-{color}-light)        Card (--sd-surface, border, radius 8)
+--------------------------------------+       +-------------------------------+
| Label            [count] [act] [v]   |       | Title (semibold)      [::][…] |
| +----------------------------------+ |       | CODE-123 (12px secondary)     |
| | card                             | |       | (High)                        |
| +----------------------------------+ |       | (A)  [] 2            12/09   |
| | card (pending)                   | |       |                    [Details]  |  <- actions template row
| |  ~ Saving move…                  | |       | ~ Saving move…  | ! error [Dismiss]
| +----------------------------------+ |       +-------------------------------+
+--------------------------------------+
Segmented light:   [ ( Design ) Preview  Schema ]   neutral track, raised active item
Segmented fill:    [ [#Design#] Preview  Schema ]   solid accent active item
Segmented outline: | [ Design ] Preview  Schema |   outlined track, tinted + bordered active item
```

## Components

| Need          | Preferred component                      | Notes                          |
| ------------- | ---------------------------------------- | ------------------------------ |
| Card priority | `sd-badge type="round"` + `color`        | Showcase template only         |
| Assignee      | `sd-avatar [src]="name"` (initials)      | Showcase only; no image assets |
| Details       | `sd-button type="text" size="sm"`        | Card actions template          |
| Comments/date | `sd-icon` (existing Material set) + text | Showcase only                  |
| Pending/error | Built into `sd-kanban` card              | Existing i18n keys             |

## Implementation Component Map

| UI region                                | Component                         | Classification    | Path                                                                | State owner            | Status    |
| ---------------------------------------- | --------------------------------- | ----------------- | ------------------------------------------------------------------- | ---------------------- | --------- |
| Board, lanes, card chrome, pending/error | `SdKanban`                        | design-system     | `versions/v19/projects/sdcorejs-angular/components/kanban/src/*`    | `SdKanban` signals     | confirmed |
| Card content                             | consumer `sdKanbanCardTemplate`   | consumer template | `showcase/src/app/pages/components/kanban/kanban-demo.component.ts` | showcase               | confirmed |
| Choice control                           | `SdSegmentedComponent` (+ `type`) | design-system     | `versions/v19/projects/sdcorejs-angular/forms/segmented/src/*`      | `SdSegmentedComponent` | confirmed |

## Data and Interaction Map

| Component              | Receives                                     | Emits                                                                     | Loading/error owner                                             | Status    |
| ---------------------- | -------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------- | --------- |
| `SdKanban`             | `model`, `columns`, `option`, existing flags | `modelChange`, `sdChange`, `sdMove`, `sdMoveError`, `sdRetry` (unchanged) | load: consumer `loading/error`; move: component (card-anchored) | confirmed |
| `SdSegmentedComponent` | existing inputs + `type`                     | `modelChange`, `sdChange` (unchanged)                                     | consumer `loading`/`inlineError`                                | confirmed |

## States

| Screen            | State                                         | Behavior                                                                                                                                          |
| ----------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kanban            | move pending                                  | Card border primary + status row "Saving move…"; handle/menu disabled board-wide (unchanged)                                                      |
| Kanban            | move rejected / error                         | Inline error row on the card + Dismiss (returns focus to that card's handle); handle `aria-describedby` includes the message; polite announcement |
| Kanban            | failed/pending card not rendered              | Board-level alert / toolbar text fallback (previous behavior)                                                                                     |
| Kanban            | load error / loading / empty / filtered-empty | Unchanged `sd-data-state` / empty text                                                                                                            |
| Segmented control | each `type` × disabled/readonly/loading/error | Existing behavior; type only changes appearance                                                                                                   |

## Responsive Rules

Horizontal lane scroll at every width. Lanes are 280px (260px under 600px), and collapsed lanes are 64px. Tool
targets are 28px, or 40px on coarse pointers. There is no one-column mode.

## Accessibility

Focus rings use the existing `--sd-focus-ring-color/width/offset` tokens. Kanban rings are unchanged. Segmented-control
items use an outward ring (`outline-offset: var(--sd-focus-ring-offset)`, 2px + 2px). It sits on the neutral
(light/fill) or transparent (outline) track, where `focus-ring-color` vs `surface`/`surface-muted` is theme-tested
at >= 3:1. The earlier inset ring was invisible on a `fill` selection of the same hue (browser evidence
`visual-opus-2026-10-04`, about 1:1, all six colours under 3, light and dark). The 4px block / 5px inline track padding
(the extra inline pixel absorbs Chrome's RTL scroll-limit rounding) and 4px gap hold the ring, so first, last, vertical and stretched items are not clipped by the scrolling track. Text pairs use theme-tested roles. The error state is
not colour-only (icon, text, border). The segmented-control selection is not colour-only (`aria-checked`, weight, ring
or border). Forced colours keep the outlines. Keyboard, menu and touch paths are unchanged. Logical properties
support RTL.

## Validation handoff

- Executor (this session, file tools only): source + focused specs. No shell was available, so sync, the generator,
  Karma, lint and the build are NOT RUN by the executor.
- Coordinator: `npm run sync`, `npm run generate:showcase-examples`, focused/full Karma, lint, `check:scss-hex`,
  build, root script tests, and real desktop (1440) / mobile (320–390) light/dark visual and a11y acceptance.

## Open Questions

- None blocking. Dark-mode card/lane elevation needs real-browser confirmation.
