# @sdcorejs/angular 19.1.1

Release tag `v1.1`, published 2026-07-10.

Release suffix `1.1` publishes `19.1.1`, `20.1.1`, and `21.1.1` as a hotfix across the maintained Angular lines.

### Added

- **Release sync guard** - added `npm run check:sync` and wired it into the publish workflow plus local deploy script so release fails before npm publish if `v20` or `v21` drifts from the `v19` source workspace.

### Fixed

- **Footer right projection alignment** - restored the v19 `margin-left: auto` behavior in v20/v21 for `sd-section`, `sd-side-drawer`, and `sd-modal` right-only footers, with matching regression assertions.

## Compare with the previous release

- Previous documented release: [19.1.0](https://sdcorejs.github.io/sdcorejs-angular/docs/19.1.0/index.json)
- Source diff: https://github.com/sdcorejs/sdcorejs-angular/compare/v1.0...v1.1
