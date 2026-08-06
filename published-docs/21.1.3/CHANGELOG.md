# @sdcorejs/angular 21.1.3

Release tag `v1.3`, published 2026-07-18.

Release suffix `1.3` publishes `19.1.3`, `20.1.3`, and `21.1.3` as a stable release across the maintained Angular lines.

### Added

- **Opt-in clearable controls** - added `clearable` support to text, number, color, date, and datetime controls, and enabled clear actions for inline-column and external table filters. Existing behavior remains unchanged unless the option is enabled. (1176664)
- **Shared datetime picker integration** - replaced the remaining vendored datetime picker implementation with `@sdcorejs/angular-material-datetime@1.0.3`, synchronized the integration across Angular 19/20/21, and preserved model refresh behavior with focused regression coverage. (f66de9c)
- **Showcase release discovery** - added SDCoreJS branding, social metadata, indexable GitHub Pages route shells, and a version-aware documentation experience across the maintained workspaces. (#8, 8f334f6)

### Changed (BREAKING for consumers)

- **Removed the AuthOM integration** - deleted `@sdcorejs/angular/modules/authom` and all related Showcase and published-document references, with no compatibility stub. **Migration:** remove AuthOM imports and migrate each use case to the supported `auth`, `keycloak`, `permission`, `layout`, or `icon` entry point as appropriate. (dfced07)

### Changed

- **Type-only barrel exports** - marked 46 type-only wildcard re-exports explicitly with `export type *` while preserving all public type names and runtime value exports across Angular 19/20/21. (#12)
- **Showcase documentation navigation** - refreshed maintainer attribution and navigation while preserving legacy routes and stable fragment IDs. (#9)

### Fixed

- **Loading overlays on duplicate hosts** - loading start, stop, and state checks now update every matching host, including duplicated router-tab hosts. (#11)
- **Table selection and tab reload behavior** - select-all skips disabled rows and keeps header state synchronized; forced tab reload recreates existing tabs even for same-URL navigation. (43dfed1)
- **Form-builder drag/drop feedback** - stabilized palette previews and live placeholder movement so only one preview is rendered and drops follow the active CDK position. (2b7d644, 7b774f5, 2468118)

## Compare with the previous release

- Previous documented release: [21.1.2](https://sdcorejs.github.io/sdcorejs-angular/docs/21.1.2/index.json)
- Source diff: https://github.com/sdcorejs/sdcorejs-angular/compare/v1.2...v1.3
