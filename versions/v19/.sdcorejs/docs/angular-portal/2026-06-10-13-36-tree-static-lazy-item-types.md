# `sd-tree` static/lazy item contracts

Refined `sd-tree` type contracts so item metadata matches the configured load mode:

- Added `SdTreeItemStatic<T>` for static mode. Static items own `children?: SdTreeItemStatic<T>[]` and do not expose `hasChildren`.
- Added `SdTreeItemLazy<T>` for lazy mode. Lazy items own `hasChildren?: boolean` and do not expose `children`.
- Kept `SdTreeItem<T>` as the union for internal node/context compatibility.
- Renamed the static/lazy config union to `SdTreeOption<T>`.
- Added `SdTreeComponentOption<T>` as the full component input option so `option.items` follows `tree.loadType`.
- Updated lazy loading to cache loaded children inside component state instead of writing to `treeItem.children`.
- Updated specs, showcase, `sd-tree.md`, and the generated user guide.

Verification:

- `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/tree/src/tree.component.spec.ts --progress=false` -> `TOTAL: 14 SUCCESS`
- `npm run build` -> pass
- `npx ng build showcase --configuration=development --progress=false` -> pass, with pre-existing Sass deprecation warnings from `dist/sdcorejs-angular/assets/scss/core/utilities/_grid.scss`
