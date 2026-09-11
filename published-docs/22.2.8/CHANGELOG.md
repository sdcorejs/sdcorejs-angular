# @sdcorejs/angular 22.2.8

Release tag `v2.8`, published 2026-09-11.

Release suffix `2.8` targets `19.2.8`, `20.2.8`, `21.2.8`, and `22.2.8`.

### Fixed

- Table settings use compact rows with centered checkboxes and share the modal footer gutters, removing the extra content inset.
- Small form controls center their resting floating labels consistently with the focused placeholder and value, including select, input, date/time and textarea controls.
- Loading service overlay CSS now requires `.sd-loading[data-sd-loading-overlay]`; its spinner rules are scoped to the overlay's direct child. Loading `SdButton` hosts keep their header position and size, Material spinner and click protection. Existing classes, API, reference ownership, stylesheet sharing and synchronous cleanup remain unchanged. Chrome rendering regressions cover page/drawer headers, close-button hit testing, unrelated class names and overlapping refs/services.

### Consumer upgrade

- Enterprise Console: after `20.2.8` is published and verified, pin `@sdcorejs/angular` to `20.2.8`, update the lockfile and rebase `patch-package`. Remove only the `fesm2022/sdcorejs-angular-services-loading.mjs` diff block introduced by Console commit `4a36177`. Retain the configuration/layout token and tab-router hunks, rename the patch to `@sdcorejs+angular+20.2.8.patch`, and update the exact-version guard in `scripts/apply-core-ui-patches.mjs` to describe the remaining layout/tab-router patches. Verify clean install, Console loading-layout/shell regressions and the production bundle budget before deploying.

### Changed

- **Sidebar V3:** match V1 navigation density and compact search, show menu icons only at the first level, and use text, ancestor rails and a current-route marker for deeper levels. Flat search/Pinned/Recent shortcuts are text-only; preserve collapse, route, pin, storage and mobile behavior.

- Table now contains quick search, rows and pagination in one white surface with 6px outer corners and 8px quick-search padding. Consumers no longer need an extra presentation wrapper; scrolling and sticky headers stay on the existing table scroll area.

### Changed (BREAKING for consumers)

- Restore the compact `sd-upload-file` tile (default 50x50px) for table cells. Remove the expanded dropzone and `appearance` input; file drag/drop, keyboard access, preview and sorting remain supported.

  ```diff
  - <sd-upload-file appearance="compact" ...></sd-upload-file>
  + <sd-upload-file ...></sd-upload-file>
  ```

  Remove `appearance="dropzone"` or `[appearance]` bindings in the same way. `previewWidth` and `previewHeight` size the tile and thumbnails.

## Compare with the previous release

- Previous documented release: [22.2.7](https://sdcorejs.github.io/sdcorejs-angular/docs/22.2.7/index.json)
- Source diff: https://github.com/sdcorejs/sdcorejs-angular/compare/v2.7...v2.8
