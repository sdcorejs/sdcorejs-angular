# @sdcorejs/angular 19.1.5

Release tag `v1.5`, published 2026-07-28.

Release suffix `1.5` publishes `19.1.5`, `20.1.5`, and `21.1.5` as a stable release across the maintained Angular lines.

### Changed

- **Layout V2/V3 navigation polish** - centered compact account and drawer controls, removed the collapsed V3 fallback brand icon, and unified desktop/mobile menu search behind an internal Soft-pill presentation without changing public APIs or filtering behavior.
- **Layout account menu** - added optional profile, settings and notification actions plus role metadata to the shared V1/V2/V3 account presentation; consumers continue to own navigation, authorization and notification data.

### Fixed

- **Showcase published-doc versions** - derive every supported `1.2+` documentation release from `published-docs/versions.json`, so the version selector exposes the existing 1.3/1.4 archives and automatically accepts the 1.5 archives after publishing instead of canonicalizing every route to 1.2.
- **Layout mobile containment** - render the Layout, Mobile V2 and Mobile V3 custom-element hosts as blocks so full-height shells and the V3 topbar start inside consumer and Showcase containers instead of aligning below an inline baseline.

## Compare with the previous release

- Previous documented release: [19.1.4](https://sdcorejs.github.io/sdcorejs-angular/docs/19.1.4/index.json)
- Source diff: https://github.com/sdcorejs/sdcorejs-angular/compare/v1.4...v1.5
