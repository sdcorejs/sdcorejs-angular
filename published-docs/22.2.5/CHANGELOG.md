# @sdcorejs/angular 22.2.5

Release tag `v2.5`, published 2026-09-07.

Release suffix `2.5` publishes `19.2.5`, `20.2.5`, `21.2.5`, and `22.2.5`.

### Added

- **Angular 22 is now a first-class package line.** `22.2.5` is the inception release for that line; no earlier Angular 22 package history is implied. It is built from the same canonical v19 source as the generated v20 and v21 workspaces and is published as the stable `latest` target only after the three maintained recovery lines have been verified.

- **`sd-table` mobile row cards** via `SdTableRowMobileDefDirective<T>` and `SdTableRowMobileDefContext<T>`, with optional `mobile.rowLabel`, typed template binding, shared selection/filter/sort/page/expand state, row and bulk commands in one contained `SdQuickAction`, grouped More sheets, and independent interactive card content. Canonical docs, consumer compilation fixtures and showcase cover local/server data, selection preservation, group/tree and responsive controls. `SdQuickAction.contained` enables an action bar inside an owning scroll container. Mobile tools and row commands use clearly titled SdModal bottom sheets. Selection uses one compact QuickAction row with a highlighted count, fitting actions and clear; selector messages/page checkboxes are omitted. A small circular selector straddles the top-right card border, and command-header content is centered above the cards. Modal overlays are named from their live headings.

- **`<sd-card>` and `<sd-card-group>`** are available from `@sdcorejs/angular/components/card`. The standalone, generic-content card supports accessible pointer/keyboard toggle behavior, read-only `selected()` state, semantic Core UI colors, stable `autoId` selectors, disabled states, and the same 300 ms leading click throttle as `SdButton`. Groups provide single or immutable multiple selection through `[(model)]`, user-only `(sdChange)`, object-aware `compareWith`, direct nearest-group injection, and no imposed application layout.

### Changed

- **Release compatibility remains dependency-first and public-API compatible.** The Angular 22 line consumes `@sdcorejs/angular-material-datetime@1.0.4`, which is released and verified first for Angular 22 peer compatibility. The four `@sdcorejs/angular` packages keep the existing public API, entry points, selectors and consumer syntax; this release adds framework compatibility rather than a consumer migration.

### Fixed

- **OIDC publication avoids setup-node's placeholder token.** The publisher configures the public npm registry through `NPM_CONFIG_REGISTRY`, leaving setup-node token authentication disabled so the token-free release guard can reach trusted publishing.
- **Release package validation recognizes the reviewed 2.5 changes.** Per-line snapshots pin both the 2.4 baseline and the exact 2.5 exports, packed paths, declarations and authored sources, allowing the card/mobile-table additions and runtime fixes while still rejecting unreviewed drift. Artifact integrity, source-commit binding and strict consumer compilation remain required.
- **`sd-input-number` accepts pasted table amounts across both supported number formats.** Clipboard whitespace, including newlines, NBSP (`U+00A0`) and narrow NBSP (`U+202F`), is removed before parsing. Excess fractional digits are truncated toward zero to the configured `precision`; for example, `1.234.567,89` becomes 1234567 at precision 0. Ambiguous single-separator values prefer the configured format. Paste replaces the selected text and updates the model and `sdChange` through the normal input pipeline, retaining min/max validation without clamping. Invalid input remains blocked. Thousands groups require three digits, Cmd+V works like Ctrl+V, and ordinary typing keeps its precision checks.
- **`sd-table` local sorting keeps empty values last in both directions.** Null, undefined and empty strings, plus invalid numeric and date/time values for their corresponding column types, no longer produce inconsistent comparisons or change position unpredictably when switching ASC/DESC. Equal values keep their relative order, zero remains valid, and sorting runs before pagination. This applies to local `number`, `date`, `datetime`, `time` and `string` columns.

## Compare with the previous release

- First documented release for the `22` line; there is no earlier archive.
