# @sdcorejs/angular 19.2.4

Release tag `v2.4`, published 2026-09-01.

Release suffix `2.4` publishes `19.2.4`, `20.2.4`, and `21.2.4`.

### Fixed

- **`<sd-date-range>` now emits valid autocomplete metadata for both endpoints.** The end-date input no longer derives its `autocomplete` value from a generated component id; both start and end inputs use the valid HTML token `off`.
- **`<sd-table>` keeps sort state on semantic column headers without duplicating the design-system icon.** `aria-sort` now belongs only to the native `<th>`. A title-only internal sort control keeps inline filters and resize handles outside the sort activation target, delegates state and events to the existing `MatSort`, and renders exactly one custom indicator with no Angular Material arrow. When `option.sort.enable` is false or omitted, or a leaf column is not sortable, no sort control, `aria-sort`, sort focus target, or sort icon is created. Mouse, Enter/Space, custom titles, multi-row headers, server request ordering, filters and resize behavior remain compatible; enabled and disabled fixtures pass unsuppressed Axe WCAG 2.1 A/AA scans.

## Compare with the previous release

- Previous documented release: [19.2.3](https://sdcorejs.github.io/sdcorejs-angular/docs/19.2.3/index.json)
- Source diff: https://github.com/sdcorejs/sdcorejs-angular/compare/v2.3...v2.4
