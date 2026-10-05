# Design decisions — SdKanban / SdSegmentedComponent visual refinement

Naming (user-approved 2026-10-04, before any release): the choice control is `sd-segmented` /
`SdSegmentedComponent` at `@sdcorejs/angular/forms/segmented`, display name "Segmented control". The name avoids
confusion with routing "segments" and matches common design-system usage. It is unreleased, so no alias is kept.
This artifact keeps its historical `kanban-segment-refinement` filename and IDs.

Authority: user approval in the Claude Code transcript of 2026-10-04 ("Chốt, giao opus làm nha") for the
bounded design and architecture recorded below. No separate spec/plan artifact or workflow ID exists; none
is invented here. Scope is the `@sdcorejs/angular` library (canonical `versions/v19`) plus the showcase demos.
It is not a portal or domain module.

Source revision: `b016e478a874923ae1a1b536b41020b7c17883ec` (branch `feat/kanban-segment`, uncommitted
reviewed implementation on top). Visual reference (look only, not an API source):
`review-output/Core-UI/design-review-2026-10-04/A2F7D7A4-21DC-4740-A050-B0C59CBF7879.jpeg`, outside this repo.

## Frontend design plan

### Subject

- Subject: generic ordered status board (`SdKanban<T>`) and compact choice control (`SdSegmentedComponent`).
- Audience: back-office operators who scan, triage and move records. The developers who adopt the library are
  a secondary audience.
- Single job: see each card's status at a glance and move it safely. Segmented control: choose one or more parallel views or values.

### Visual direction

- Concept: calm, dense work surface. Pastel status lanes hold white, title-first cards. Controls stay quiet until needed.
- Rationale: the reference shows that a tinted lane and a light card read faster than the current grey lanes with a
  3px top stripe. Title-first hierarchy matches how operators scan.
- Existing evidence: `assets/THEME.md` token tiers; `assets/scss/themes/default.scss` light/dark palettes;
  current `kanban.component.scss` / `segmented.component.scss`; SdButton `type` vocabulary
  (`fill | light | outline | text`).

### Tokens (existing only; no new token)

| Token/source reference                           | Role                                                                        | Intended use                                                                    |
| ------------------------------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `--sd-{color}-light` (6 palette families)        | Tinted background; in dark mode it mixes with `--sd-surface`                | Kanban lane background; segmented-control `light`/`outline` selection tint      |
| `--sd-{color}` / `--sd-{color}-contrast`         | Solid accent plus its 4.5-checked text                                      | Segmented-control `fill` selection                                              |
| `--sd-{color}-dark`                              | Strong text on a tint                                                       | Segmented-control `light`/`outline` selected text                               |
| `--sd-surface`, `--sd-surface-muted`             | Raised and inset surfaces                                                   | Kanban card, count chip; segmented-control neutral track and raised active item |
| `--sd-text`, `--sd-text-secondary`               | Primary and secondary text (4.5 on surface and surface-muted, theme-tested) | Titles, metadata, quiet icons                                                   |
| `--sd-border`, `--sd-border-strong`              | Separation and outline                                                      | Card border; segmented-control `outline` track                                  |
| `--sd-status-error-bg/fg`, `--sd-border-danger`  | Error role (4.5-checked pair)                                               | Card-anchored move failure                                                      |
| `--sd-focus-ring-color/width`                    | Focus                                                                       | Unchanged focus rings                                                           |
| `--sd-radius-*`, `--sd-shadow-xs`, `--sd-font-*` | Scales                                                                      | Radii, card lift, type                                                          |

A new component token (`--sd-kanban-*` / `--sd-segmented-*`) was considered and rejected. Palette and semantic
roles cover every need. A component token would need registry and test changes in
`_component-tokens.scss` plus `scripts/theme-token-list.test.mjs` with no visual gain.

### Type

System stack inherited from the host. Card title uses `--sd-font-weight-semibold` at 14px. Code and subtitle use
12px `--sd-text-secondary`. Count uses 12px. No new font.

### Layout

- Desktop: lanes 280px (`flex: 1 0 280px`), 12px gap, 8px inner padding, 12px radius lane, 8px radius card.
  Card grid: body (title first) | top-end quiet tools (drag handle, movement menu). The consumer actions
  template sits on its own end-aligned row only when supplied.
- Tablet: same; the board scrolls horizontally.
- Mobile (<600px): unchanged horizontal scrolling lanes (260px). No one-column selector or responsive
  mode. Coarse pointers get 40px tool targets (24px minimum everywhere).

### Copy voice

Existing i18n only: `core.component.kanban.saving` ("Saving move…"), `.rejected`, `.error`, `.dismiss`.
Five-language parity already exists, so no new keys are needed.

## Kanban states

- Pending: the affected card shows a status row (icon plus "Saving move…") and a primary border. The toolbar text
  remains only as a fallback when the pending card is not rendered (filtered out or in a collapsed lane).
- Rejected/error: the affected card shows an inline error row (icon, localized message, Dismiss) using the
  status-error role. Raw errors are never displayed. The polite global live region keeps the announcement.
  The board-wide `role="alert"` block is removed when the card is visible. It is kept as a fallback when the
  failed card is not rendered, or for configuration failures that have no card.
- Load error/retry, loading, empty, and filtered-empty use the existing `sd-data-state`, unchanged.
- Move semantics, ordering, cancellation/stale guards, outputs and focus restoration are unchanged (R1–R3).

## Segmented control `type`

Additive public input `type: SdSegmentedType = 'light' | 'fill' | 'outline'`, default `light`. It reflects as
host `data-type`, with the same idiom as `data-color` / `data-size`.

- `light`: neutral `--sd-surface-muted` track. The active item is raised on `--sd-surface` with `--sd-shadow-xs`
  and `--sd-{color}-dark` text. A 1px inset ring in the accent colour keeps it non-colour-only in forced colours.
- `fill`: same neutral track. The active item uses solid `--sd-{color}` with `--sd-{color}-contrast` text.
- `outline`: transparent track with a `--sd-border` outline. The active item gets a `--sd-{color}-light` tint, a
  1px `--sd-{color}` border, and `--sd-{color}-dark` text.
  Sizes, orientation, stretch, single/multiple, templates, loading/disabled/readonly/error, and light/dark all work
  through tokens. Keyboard focus on every type uses an outward ring: `--sd-focus-ring-width` plus
  `--sd-focus-ring-offset`, which fits in the track's 4px block / 5px inline padding and 4px gap (the extra inline pixel absorbs Chrome's
  RTL scroll-limit rounding). Keyboard navigation scrolls only the control's own track to reveal the focused choice
  and its ring. The ring is drawn against the track, not
  the selected item. The selected state is also carried by `aria-checked` and semibold weight. Forced colours keep
  the outline rule.

## Design critique

- Initial issue: the reference proposes `getAvatar/getSubtitle/getTags` option callbacks. Revision: rejected.
  Metadata stays consumer-owned through the existing typed card template. The showcase composes SdBadge,
  SdAvatar, SdButton and icons. Why: it avoids business fields in a generic library API.
- Initial issue: the reference has a "Retry" button on a failed card. Revision: not added. The approved scope
  forbids automatic retry. Manual retry stays the consumer's or user's action through drag, menu or keyboard,
  as documented. Dismiss remains.
- Initial issue: a pastel lane plus a white card in dark mode could invert elevation. Revision: in dark mode
  `-light` mixes with `--sd-surface`, so the card (`--sd-surface` plus `--sd-border`) reads as a bordered well
  on a tinted lane. This is a common dark-board pattern and needs no new token. Real dark rendering needs browser
  confirmation by the coordinator.
- Initial issue (post-code browser acceptance, 2026-10-04): the inset primary focus ring was invisible on a `fill`
  selection, under 3:1 for all six colours in light and dark. Revision: outward ring using the existing offset token.
  The colour and width tokens are unchanged, with no white-only ring and no new token.
- Initial issue: the segmented-control light/fill tracks used the same tint. Revision: the track is always neutral, so the
  colour only marks the selection.

## Mobile design plan

- Target surface: responsive mobile web inside existing Core UI pages.
- Context: quick status checks and occasional moves on a phone.
- Navigation: horizontal lane scroll (`overscroll-behavior-inline: contain`) is unchanged. The movement menu and
  Alt+arrow keyboard path are the gesture alternatives. Touch drag uses the handle (`touch-action: none`).
- Reachability: tools sit at the card's top-end. 40px targets on coarse pointers.
- States: pending and error are anchored on the card, so they stay visible in the scrolled lane. Zoom and
  long titles wrap (`overflow-wrap: anywhere`). Motion: the pending icon is static (no new animation), so
  reduced motion needs no special case.
- RTL: logical properties only (`margin-inline-*`, `inset-inline-*`). Keyboard RTL handling is unchanged.
