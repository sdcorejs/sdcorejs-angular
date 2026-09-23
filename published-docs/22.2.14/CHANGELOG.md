# @sdcorejs/angular 22.2.14

Release tag `v2.14`, published 2026-09-23.

Release suffix `2.14` targets `19.2.14`, `20.2.14`, `21.2.14`, and `22.2.14`.

### Changed (BREAKING for consumers)
- Core UI now owns its default colors instead of implicitly inheriting Material system colors. Core styles consume `--sd-*`; Material-only controls retain their own theme configuration.
- Apps relying on Material-owned Core colors must opt in after loading Core styles:

```diff
- @include sd.theme();
+ @include sd.theme($source: 'material');
```

  Existing `sd.theme((...))` overrides remain supported and take precedence over either source.

### Added
- Table: add typed column aggregates (SUM/AVERAGE/COUNT/MIN/MAX, raw-data callbacks and templates), local page/filtered scope, group/tree subtotals with lazy-data completeness, independent sticky total above existing footers, and shared mobile summaries. Include public JSDoc, complete consumer examples and an interactive showcase.
- Theme: add eight Core-owned light presets (`ocean`, `indigo`, `teal`, `copper`, `slate`, `forest`, `plum`, `rose`) through `sd.theme($preset: ...)`, with consumer override precedence, invalid-argument guards, palette contrast tests and complete style-guide usage/migration guidance. The default palette and existing mixin calls remain unchanged.
- Tab group: add per-instance `headerClass`, `headerStyle`, `bodyClass` and `bodyStyle` inputs with reactive cleanup and separate header/body styling.

### Fixed
- Tab router: isolate activation errors so subsequent menu navigation remains responsive.
- Table: stop reload from invoking the previous option's loader while an input change is waiting for its effect; cover early reload, pending lookups, stale responses, teardown and retry with regression tests.
- Layout: add regression coverage for focused V1 tree branches/routes and V2 route/pin controls to keep visible navigation outside `aria-hidden` ancestors. Existing runtime markup already meets this requirement.
- Table: use compact parent headers and vertically centered standalone titles, align filters in a separate sticky row for grouped columns, and apply automatic filter visibility consistently at both levels.
- Table: use fixed white backgrounds for quick search and pagination with square corners and no toolbar divider; balance toolbar spacing and retain compact stacking on narrow containers.

## Compare with the previous release

- Previous documented release: [22.2.13](https://sdcorejs.github.io/sdcorejs-angular/docs/22.2.13/index.json)
- Source diff: https://github.com/sdcorejs/sdcorejs-angular/compare/v2.13...v2.14
