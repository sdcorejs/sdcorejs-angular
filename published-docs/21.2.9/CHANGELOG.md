# @sdcorejs/angular 21.2.9

Release tag `v2.9`, published 2026-09-11.

Release suffix `2.9` targets `19.2.9`, `20.2.9`, `21.2.9`, and `22.2.9`.

### Changed (BREAKING for consumers)

- Remove `@sdcorejs/angular/components/chart` and its `SdLineChartComponent`, `SdBarChartComponent`, `SdPieChartComponent`, and `SdDoughnutChartComponent` exports (also removed from the root/components barrels). Chart.js is no longer a Core UI dependency; consumers choose, install, and configure their own chart library. `sd-org-chart` remains available.

  Migration: remove the Core UI chart imports and replace `<sd-line-chart>`, `<sd-bar-chart>`, `<sd-pie-chart>`, and `<sd-doughnut-chart>` in consumer templates. If retaining Chart.js, declare `chart.js` as a direct application dependency and own its canvas lifecycle and registration:

  ```diff
  - import { SdLineChartComponent } from '@sdcorejs/angular/components/chart';
  - // Component imports: [SdLineChartComponent]
  + import { Chart, registerables } from 'chart.js'; // installed by the consumer
  + Chart.register(...registerables);
  + // Create a Chart on the application's canvas and destroy it during teardown.
  ```

### Added

- `sd-switch` supports `size="sm | md | lg"` (default `md`) with matching track, handle, icon and focus-layer dimensions. Switches rendered inside `sd-table`, including consumer cell templates, use the compact `sm` appearance automatically.
- Sidebar V3 supports independent expand/collapse of menu groups at every depth, with keyboard-accessible disclosure buttons. Group state survives search and sidebar rail toggles; navigation opens the active branch, and selecting a group icon in the rail opens that group.
- Form builder groups support `properties.collapsible` (default `false`), matching `sd-section`. Enable it to expand/collapse groups in preview and form render while preserving child values and validation. Group conditions remain limited to visibility; disabled-when rules belong to child fields.

### Fixed

- `sd-table` hydrates configuration, asynchronous lookups and filters before one initial read. Remove duplicate initial BehaviorSubject emissions and coordinate subsequent reads through one cancellable scheduler. Preserve manual/notReload filters, required tenant, quick search, inline/saved/URL filters, paging/sort, explicit refresh/retry and loading/error states; discard stale scope/destroy responses. POST caching and deduplication remain opt-in. Real-table HTTP regressions count both loader calls and requests with dedupe disabled.

- Table row-command children and selection-action menus use a compact white CDK menu with 36px rows, 18px icons and 8px corners. Preserve child filtering, disabled commands, callbacks, keyboard navigation, focus restoration and overlay placement outside clipped cells; touch targets remain 44px.
- Side drawer, dialog and bottom-sheet headers/footers share a white background and use compact 12px vertical and 16px horizontal padding. Body content also uses `12px 16px` padding on desktop and mobile, including its own top spacing below the separate header surface; mobile safe-area spacing and touch targets remain supported.
- Tab group pills clip hover/ripple effects to their rounded shape and retain the active fill on hover. Segmented tabs have a 4px gap so adjacent hover backgrounds remain separate.
- Hover-copy confirmation tooltips render in a CDK overlay above table rows and outside clipped cells. Scrolling, disabling and teardown clean up the overlay; initial rendering creates only one copy button.
- Query builder's add-condition/group menu renders outside ancestor overflow, keeping both actions visible in short modal bodies. Backdrop/Escape dismissal and focus restoration keep the surrounding modal open.

### Consumer upgrade

- Enterprise Console: after `20.2.9` is published and verified, update Core and the lockfile, then remove only the temporary patch that suppresses duplicate initial table reads/paging. Remove POST dedupe only where it was added solely to mask this duplication; explicit refresh/retry must still send a new request. Rebase remaining Core patches independently and verify loader/request counts after a clean install.

## Compare with the previous release

- Previous documented release: [21.2.8](https://sdcorejs.github.io/sdcorejs-angular/docs/21.2.8/index.json)
- Source diff: https://github.com/sdcorejs/sdcorejs-angular/compare/v2.8...v2.9
