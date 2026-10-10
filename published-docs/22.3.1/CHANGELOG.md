# @sdcorejs/angular 22.3.1

Release tag `v3.1`, published 2026-10-10.

### Added

- Kanban: generic status columns and immutable mappings, card/header/action templates, search/filter/count/collapse, drag/menu/keyboard moves, consumer-confirmed asynchronous transitions and stale-response protection. Columns retain horizontal mobile scrolling.
- Segmented control: single/multiple model choices, light/fill/outline variants, semantic colors/sizes, templates/icons and accessible keyboard navigation that scrolls its own track.
- File Explorer: optional generic `Item<T>.data`, typed projected metadata columns, additive `dataSource` and grouped capability callbacks, `onClick` action aliases with legacy `click` retained, and consumer-controlled moves through drag, an accessible destination picker or `moveFiles()`. Legacy callable root callbacks remain supported.
- File Explorer: selection actions and per-item file/folder commands, ordered flat or one-level grouped definitions, current hidden/disabled/loading eligibility and compact viewport action drawers. Explicit action arrays retain consumer order; omitted action arrays can supply Move/Share/Download from configured callbacks.
- Form Generic: optional schema tabs/linear steps, serialized guarded transitions, renderer keyboard navigation, active builder page synchronization and model/FormGroup support with legacy schemas retained. Builder page create/remove/reorder, transition rules, undo and preview share the same schema.
- Section item: optional `label` defaults to an empty string; projected `[itemLeft]` content occupies the existing left column and keeps consumer-owned typography.

### Changed

- Button outline: neutral border and semantic foreground roles, light/dark overrides, subtle hover/pressed states, full-opacity loading and forced-colors support. Existing inputs/outputs, Material shape and other variants are retained.
- Confirm dialog content padding is 20px desktop and 16px up to600px; existing mobile safe-area handling and service API are retained.
- Compact Explorer controls and mobile Form footer use actual Core `sm` buttons (32px visual, 48px touch target). Selection Move is inside the selection band. Form renderer owns internal gaps; the page/dialog consumer owns outer gutter and safe-area.

### Changed (BREAKING for consumers)

- Action-mode selection requires a usable configured action. Explicit empty or statically fully hidden actions suppress file checkboxes, select-all and the band; withdrawing actions clears selection. Dynamic `hidden` predicates affect current action visibility while retaining checkboxes and intermediate selections, including actions that require exactly two files. For an intentional actionless picker, migrate `selector: {}` to `selector: { mode: 'picker' }`. Omitted mode with legacy `onSelect`/`onSelectAll` callbacks preserves callback-owned picker behavior. Disabled/loading actions retain selection affordances.
- Custom typed i18n catalogs must add the new selection/action/loading/item-actions, move/availability, and sixteen Form layout/transition keys present in the built-in catalogs.

### Fixed

- Legacy Explorer `SdFileExplorerActionLeaf` and `SdFileExplorerActionGroup` retain callable `click` interfaces; additive definition types accept canonical `onClick` callbacks throughout the actual action component.
- Compact touch error folder rows keep wrapping when commands are present; a long destination picker stays inside consumer-supplied short Explorer hosts and retains a scrollable footer.
- Form navigation reacquires owned controls after consumer replacement/removal while validation is pending and checks cancellation before touching replacement schema controls. Global validation configuration includes fields from every page; page changes dismiss stale delete Undo toasts, and page metadata edits seal history through Core `sdBlur`.
- Explorer destination-picker Tab/Shift+Tab ownership, dark surfaces, current selection/search move eligibility, changed-provider stale-response rejection and accepted-move cache refresh.
- Per-item Move rows permit the full Core48px touch span without clipping; filenames keep ellipsis and narrow rows can wrap without overlapping touch targets. Retry controls retain readable labels on narrow layouts.
- Form builder/page-strip scrolling reveals selected/focused long labels. Dynamic helper/error heights, radio label wrapping, renderer tab scrolling/focus and blocked linear navigation remain usable on narrow screens and enlarged text.

### Release tooling

- The reviewed3.1 contract compares exact same-major3.0 npm packages. The existing four-artifact OIDC transaction, immutable integrity checks, strict consumers and postpublish-only docs/page workflow remain release gates.
- Explicit Form signal types keep v19 declarations stable across repeated builds without changing their accepted values or weakening the package fingerprint guard.

## Compare with the previous release

- Previous documented release: [22.3.0](https://sdcorejs.github.io/sdcorejs-angular/docs/22.3.0/index.json)
- Source diff: https://github.com/sdcorejs/sdcorejs-angular/compare/v3.0...v3.1
