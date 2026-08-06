# @sdcorejs/angular 19.1.2

Release tag `v1.2`, published 2026-07-11.

Release suffix `1.2` publishes `19.1.2`, `20.1.2`, and `21.1.2` as a stable patch across the maintained Angular lines.

### Fixed

- **`sd-table` hidden-paginator height** - contained Material's 48px footer-action touch targets without forcing extra height when no action is rendered, preventing the table host from gaining a redundant outer vertical scrollbar for short data sets. The fix is synchronized across Angular 19/20/21 and avoids relational selectors for compatibility with the supported browser baseline. (#6)

## Compare with the previous release

- Previous documented release: [19.1.1](https://sdcorejs.github.io/sdcorejs-angular/docs/19.1.1/index.json)
- Source diff: https://github.com/sdcorejs/sdcorejs-angular/compare/v1.1...v1.2
