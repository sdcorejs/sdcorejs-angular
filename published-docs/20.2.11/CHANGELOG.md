# @sdcorejs/angular 20.2.11

Release tag `v2.11`, published 2026-09-15.

Release suffix `2.11` targets `19.2.11`, `20.2.11`, `21.2.11`, and `22.2.11`.

### Added

- Add `size` to `sd-checkbox` using the shared `Size` type and `data-size` pattern from `sd-switch`: `sm` / `md` / `lg` (default `md`), with proportional box/icons and label spacing, retained touch targets, and showcase examples.

- Tree: optional `showLines` boolean attribute and option for visible parent/child connectors; stronger parent titles and neutral expansion icons.
- Button: declarative `sd-button-item` / `sd-button-item-divider` Action Popover, keyboard/focus support and dynamic children.
- Button: optional `openOnHover` boolean attribute (default false), with delayed pointer exit and preserved keyboard navigation.

### Changed

- Pills tabs use a light active background with consistent accent text on hover/focus; text avatars use light backgrounds and darker initials while retaining name colors and image behavior.
- Tree: reuse the shared Button Action Popover for node commands, retaining command metadata and node callbacks.
- Button: omit the Action Popover chevron for icon-only triggers or triggers with `suffixIcon`; table commands and overflow actions reuse this rule.
- Table: reuse Button Action Popover for desktop command children, selection actions and export menus; retain consumer models and current row/selection context.

### Fixed

- Preserve checkbox size-specific label spacing with Angular Material 22 markup and keep unlabeled table-configuration checkboxes centered.

- Make disabled secondary icon-only text buttons visibly dimmer while preserving enabled, loading and labeled-button styles.

- Inset the `sd-table` selection message/action toolbar by 8px on both sides so it does not touch the table edges.

## Compare with the previous release

- Previous documented release: [20.2.10](https://sdcorejs.github.io/sdcorejs-angular/docs/20.2.10/index.json)
- Source diff: https://github.com/sdcorejs/sdcorejs-angular/compare/v2.10...v2.11
