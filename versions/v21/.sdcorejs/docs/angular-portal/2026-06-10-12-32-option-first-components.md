# Option-first component API

## Scope

Refactored the newer Core UI components toward a single `[option]` API, aligned with the `sd-table` style:

- `sd-org-chart`
- `sd-query-bar`
- `sd-query-builder`
- `sd-tree`
- `sd-splitter`

## Changes

- Added public option models:
  - `SdOrgChartOption`
  - `SdQueryBarOption`
  - `SdQueryBuilderOption`
  - `SdTreeComponentOption` as the full component option
  - `SdTreeOption` for static/lazy tree loading config
  - `SdSplitterOption`
- Moved callback hooks into option objects while keeping existing outputs/model APIs as a migration bridge.
- Kept imperative consumer APIs where they are genuinely useful:
  - `SdTree.filter(searchText)`
  - `SdSplitterComponent.getLayout()`, `setLayout()`, `resetLayout()`, `collapse()`, `expand()`, `toggle()`, `resizePanel()`
- Updated tree showcase and tree docs to use only `[option]`.
- Updated component docs with option-first notes for org-chart, query-bar, query-builder, tree, and splitter.

## Verification

- `npm run build` passed for `sd-angular`.
- Focused tree/org-chart/splitter specs passed: `TOTAL: 43 SUCCESS`.
- Focused query-bar/query-builder specs passed: `TOTAL: 125 SUCCESS`.
- Showcase development build passed. Existing Sass deprecation warnings from `_grid.scss` remain unrelated.
