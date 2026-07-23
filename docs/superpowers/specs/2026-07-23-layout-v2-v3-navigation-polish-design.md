# Layout V2/V3 Navigation Polish Design

**Date:** 2026-07-23
**Status:** Approved for implementation planning
**Track:** Angular library and Showcase
**Coverage approach:** TDD for DOM behavior regressions, followed by browser
visual verification

## Context

The new Layout V2 rail and Layout V3 collapsible drawer preserve the shared
account menu and search behavior, but their compact presentation has three
visual defects:

1. The shared account-menu chevron remains visible beside the avatar in compact
   mode. It displaces the avatar in V2 and overflows the narrower trigger in
   collapsed V3.
2. The V3 header continues to show its brand block, including the fallback
   `apps` icon, beside the expand control after the drawer collapses.
3. Menu search fields use the default Material outlined form appearance, which
   is visually heavier than the surrounding navigation.

The selected visual direction for menu search is **A — Soft pill**.

## Goals

- Make compact V2 and V3 navigation visually centered and free of overflow.
- Keep the account popup, search filtering, navigation state and responsive
  behavior unchanged.
- Present menu search as a soft gray pill with a search affordance and a clear
  keyboard focus state.
- Share the search presentation across V2/V3 desktop and mobile without
  duplicating Material overrides.
- Preserve the public Layout and `SdInput` APIs.

## Non-goals

- Redesign Layout V1.
- Change menu filtering, routing, pinned/recent state, storage or permissions.
- Change account actions or popup keyboard behavior.
- Add a public `SdInput` variant or a new exported Layout API.
- Redesign mobile navigation anatomy beyond the search-field presentation.

## Design

### Compact account menu

`SdLayoutUserMenuComponent` remains the shared account disclosure for V2 and
V3. Its expanded presentation is unchanged: avatar, identity text and the
`expand_more`/`expand_less` indicator remain visible.

When `compact()` is true:

- render only the 32px avatar inside the trigger;
- do not render the disclosure chevron;
- apply a compact trigger class that centers the avatar and removes spacing
  intended for identity text;
- keep the entire trigger clickable;
- preserve `aria-haspopup`, `aria-expanded`, focus restoration and popup
  behavior.

This applies to the permanently compact V2 desktop rail and collapsed V3
desktop drawer. Mobile V2/V3 and expanded V3 continue to use the full account
presentation.

### Collapsed V3 header

Expanded V3 continues to show the configured logo or fallback `apps` icon,
title and collapse control.

When V3 is collapsed:

- do not render the brand block, including both consumer logo and fallback
  `apps` icon;
- render only the expand control in the header;
- center the expand control within the 72px drawer;
- keep its current accessible name, expanded state and click behavior.

The collapsed menu items and projected-content offset remain unchanged.

### Shared Layout search field

Add an internal standalone `SdLayoutSearchFieldComponent` under the Layout
shared components. It wraps `SdInput` and `SdIcon`; it is not exported from the
public Layout entrypoint.

Its internal API mirrors only what the four Layout consumers need:

- `model: string`;
- `placeholder: string`;
- `autoId: string`;
- `sdChange: string`.

Data flow stays one-way:

```text
parent searchText signal
  -> model input
  -> shared Layout search field
  -> SdInput
  -> sdChange output
  -> parent searchText.set(value)
```

The component owns a single pill surface around the icon and `SdInput`.
Material outline variables are overridden only within this wrapper, so other
`SdInput` instances retain their existing appearance.

### Soft-pill visual contract

- Minimum control height: 38px.
- Surface: `var(--sd-black100)`.
- Shape: `rounded-full` / 9999px radius.
- Border: none in idle and hover states.
- Search icon: left aligned, decorative, using the current Layout icon system.
- Placeholder and icon color: `var(--sd-black400)`.
- Text color: existing `SdInput` text token.
- Horizontal spacing: 12px outer padding with an 8px icon-to-input gap.
- Focus: visible 2px primary-colored ring on the pill via `:focus-within`.
- Width: fill the current search region without changing sidebar geometry.
- Motion: no new animation.

The wrapper is used in exactly four places:

1. V2 desktop contextual flyout search.
2. V2 mobile sheet search.
3. V3 desktop global search.
4. V3 mobile drawer global search.

Placeholder text, `autoId` values and filtering semantics remain unchanged.

## Component boundaries

- `SdLayoutUserMenuComponent` owns only full-versus-compact account disclosure.
- `SdSidebarV3Component` owns whether its brand block exists in expanded or
  collapsed mode.
- `SdLayoutSearchFieldComponent` owns search presentation and delegates input
  value behavior to `SdInput`.
- Each sidebar continues to own its search signal and filtering logic.

No navigation service, storage service, configuration type or public export
needs to change.

## Testing

### RED-first DOM regressions

- Shared user-menu spec proves compact mode omits the disclosure icon while the
  trigger and avatar remain present and clickable.
- V2 desktop spec proves the compact account trigger is used.
- V3 desktop spec proves collapsed mode omits the brand block and fallback
  `apps` icon, retains one expand control and uses compact account presentation.
- Expanded V3 regression proves brand, title and account chevron remain.

### Shared search-field behavior

- Renders the search icon and configured placeholder.
- Passes the configured `autoId` to `SdInput`.
- Reflects its `model` value.
- Emits the same string through `sdChange`.
- Uses a single shared component at all four V2/V3 call sites.

### Verification

- Focused Layout tests on canonical Angular 19.
- `npm run sync` and `npm run check:sync`.
- Focused Layout tests on Angular 20 and 21 mirrors.
- Release lint and library builds for Angular 19/20/21.
- Showcase production build.
- Browser smoke for V2 desktop, V3 expanded/collapsed, and V2/V3 mobile,
  including keyboard focus and search filtering.
- `git diff --check`.

Pure CSS appearance is verified in the browser; DOM tests cover state-dependent
presence, event flow and regression-prone structure.

## Documentation and release notes

- Add an Unreleased Layout improvement entry to `CHANGELOG.md`.
- Update `sd-layout.md` to describe compact account/header presentation and
  the shared soft-pill menu search.
- Keep the Showcase demo behavior unchanged; use it for visual verification.
- Roll canonical v19 changes into v20/v21 through the repository sync workflow.

## Acceptance criteria

1. V2 desktop shows a centered avatar without a neighboring account chevron.
2. Collapsed V3 shows no brand logo or fallback `apps` icon in its header.
3. Collapsed V3 centers the expand control in the 72px drawer.
4. Collapsed V3 shows a centered account avatar without overflow or chevron.
5. Expanded V3 and mobile account menus retain avatar, identity and disclosure
   indicator behavior.
6. All four V2/V3 menu searches use the Soft-pill appearance and search icon.
7. Search placeholders, `autoId` values, filtering results and signal flow are
   unchanged.
8. Keyboard focus is visibly indicated on the account trigger, drawer control
   and search pill.
9. Layout V1 and all public APIs remain unchanged.
10. Angular 19/20/21 source stays synchronized and the defined tests, lint,
    builds and browser checks pass.

## Risks and mitigations

- **Material internal styling drift:** keep overrides in one internal wrapper
  and prefer inherited MDC custom properties over global selectors.
- **Compact hit-target regression:** retain the full trigger/control surface
  and verify it in DOM and browser tests.
- **Cross-version divergence:** edit canonical v19 only, then use root sync and
  parity checks.
- **Visual-only false confidence:** pair browser checks with state-specific DOM
  regressions for every conditional element.
