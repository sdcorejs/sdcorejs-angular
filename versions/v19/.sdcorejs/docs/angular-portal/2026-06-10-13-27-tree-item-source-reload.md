# `sd-tree` item source + reload refinement

Updated `sd-tree` after visual/API feedback:

- Replaced raw root data + key resolvers with wrapped tree items (`id`, `label`, optional `icon`, `data`, and mode-specific metadata).
- Removed the separate leaf icon concept from the API. A branch without `icon` uses default folder icons; a leaf without `icon` renders no icon.
- Added `SdTreeDataSource` so `option.items` can be an array, a signal, a sync loader, or an async loader.
- Added public `reload()` to manually rerun loader sources.
- Moved per-row icon, selection, command, auto-id, and template context resolution into a signal-backed view model; the template no longer calls row resolver helpers during rendering.
- Removed border radius from selected rows so adjacent selected rows share one continuous background.
- Tightened command menu alignment with centered icon/text and a shorter gap.

Verification:

- `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/tree/src/tree.component.spec.ts --progress=false` -> `TOTAL: 14 SUCCESS`
- `npm run build` -> pass
- `npx ng build showcase --configuration=development --progress=false` -> pass, with pre-existing Sass deprecation warnings from `dist/sdcorejs-angular/assets/scss/core/utilities/_grid.scss`
