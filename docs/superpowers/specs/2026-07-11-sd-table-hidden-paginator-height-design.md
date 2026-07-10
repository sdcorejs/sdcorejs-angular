# SdTable Hidden Paginator Height Fix

## Problem

When a table has fewer rows than its configured page size, `mat-paginator` is hidden. The table footer can then collapse to the 42px height of its visible action buttons. Angular Material keeps a 48px touch target around those buttons, so the touch target extends 3px below the footer and increases the `sd-table` scroll height.

The supplied CRM snapshot reproduced the issue with these measurements:

- `sd-table`: `clientHeight = 1068`, `scrollHeight = 1071`
- `.c-paginator`: rendered height `42px`, scroll height `45px`
- Material button touch target: `48px`

This creates a redundant outer scrollbar while `.c-table` already owns the intended data-area scrolling.

## Desired Behavior

- A hidden paginator must not make the `sd-table` host vertically scrollable.
- Footer actions must retain Angular Material's 48px accessible touch target.
- Tables without footer action buttons must not gain an empty 48px footer.
- Visible paginator behavior, the compact row summary, and table actions must remain unchanged.

## Design

In the v19 table stylesheet, use `.c-paginator:has(.c-action sd-button)` to give the footer a `min-height` of `48px` only when `.c-action` contains an `sd-button`. The condition keeps the rule scoped to the layout that can contain a Material touch target. It does not reserve extra footer space when the action area is empty. Angular 19's supported modern browsers provide the required `:has()` support.

The change belongs in `table.component.scss`; no component API, template data flow, or pagination logic changes are required.

The rule will be written in the existing nested SCSS structure and include a short comment explaining that the minimum height contains Material's touch target and prevents scroll-height propagation.

## Alternatives Considered

### Reduce the Material touch target

This would keep the 42px footer but reduce the accessible click/tap area. It is rejected because the visual density does not justify weakening accessibility.

### Hide or clip overflow

Applying `overflow: hidden` or `overflow: clip` would suppress the scrollbar but could clip the button touch target. It treats the symptom instead of making the footer contain its children.

### Give every paginator footer a 48px minimum height

This removes the overflow but adds blank height to tables with no footer actions. The conditional rule has a smaller behavioral footprint.

## Testing

Add a focused v19 regression fixture with:

- a fixed-height table container;
- a short data set whose paginator is hidden;
- at least one footer action button;
- an assertion that the `sd-table` host and `.c-container` have no vertical overflow;
- an assertion that the action-bearing paginator footer is at least 48px high.

The test must fail before the stylesheet change and pass afterward. Then run the focused table spec and the v19 production library build.

## Rollout

After v19 verification passes, use the repository's v19-to-v20/v21 sync workflow. Run the version-sync guard and review the generated diff so the same library CSS and regression coverage reach all supported Angular majors.

## Scope

This fix is limited to `SdTable` footer sizing and its regression coverage. It does not change `SdPage`, tab-router scrolling, paginator visibility rules, table row sizing, or unrelated modal styles.
