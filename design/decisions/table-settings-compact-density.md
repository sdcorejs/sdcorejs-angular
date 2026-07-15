# Design Decision - Contextual Ultra-Compact Switches

## Status

Concept accepted in the design session on 2026-07-15. The user selected the third visual option and subsequently approved the full-dialog density and technical boundary. The written handoff remains at `reviewed` until the user reviews the generated files.

## Context

The table-settings dialog combines default Angular Material switches (`52×32px` track in the Angular 19 M3 tokens), `40px` default inputs and footer buttons separated by both an `8px` modal flex gap and legacy `mr-8` child margins. The result is visually loose and makes the switches dominate otherwise compact rows.

`SdSwitch` documentation reserves a `size` input, but the current component API/template does not implement size-dependent geometry. Adding `size="sm"` to the dialog alone would therefore have no visual effect.

## Decision

- Use compact table rows (`40px`) and existing `SdInput size="sm"` fields (`32px`).
- Render only the table-config switches with a `32×18px` visual track, `14px` thumb and `32×40px` interaction box.
- Implement the switch geometry with a contextual class and Angular Material’s official slide-toggle override mixin.
- Keep the change local to table config; do not modify the global `SdSwitch` API or global Material density.
- Remove legacy button margins and rely on the modal’s existing `8px` right-footer gap.

## Alternatives Considered

### Keep the default switch

Lowest implementation scope, but it leaves a `52×32px` control that remains visually dominant after inputs and rows become compact.

### Use a balanced `40×22–24px` switch

This is the lowest-risk compact geometry and was initially recommended. The user preferred a smaller visual footprint after reviewing side-by-side mockups.

### Add a reusable `SdSwitch size="sm"` API

This would be appropriate if multiple product areas need compact switches. It expands the public component API, docs and cross-version regression surface, so it is deferred from this table-dialog polish.

### Use `transform: scale()` or global density

Rejected. Scaling can misalign ripple/focus geometry and shrink effective targets. Angular Material M3 density does not provide the required visual switch sizing and would create global risk.

## Consequences

- The dialog gains the approved dense appearance without affecting other consumers.
- The implementation needs correlated switch track/thumb/icon/state-layer overrides and focused cross-version visual verification.
- The `32px` target width is smaller than the preferred `40–44px` comfort target but remains above the WCAG 2.2 `24px` minimum; the `40px` height improves clickability in the compact row.
- A future global size API must not silently depend on this contextual class.
