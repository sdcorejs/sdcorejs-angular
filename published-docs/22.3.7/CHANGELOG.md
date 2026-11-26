# @sdcorejs/angular 22.3.7

Release tag `v3.7`, published 2026-11-25.

Packages `19.3.7` · `20.3.7` · `21.3.7` · `22.3.7`, validated against `*.3.6`.

> [!IMPORTANT]
> **Before upgrading:** Update integrations that access `SdTime.menuTrigger`, add the three date-range messages to custom `I18nCatalog` providers, and opt in to size limits if you use the popover panel Sass mixin directly.

**Highlights**

- Configure section dividers and open a customer's Record 360 overview or printable sheet.
- Date and time pickers share calendar navigation and themed panels. The range picker announces the end date and shows the inclusive day count.

### Changed (BREAKING for consumers)

#### i18n

- Add `core.form.date-range.pick-end`, `core.form.date-range.summary-day`, and `core.form.date-range.summary-days` to exhaustive custom catalogs. Translate the end-date prompt and keep the `{count}` placeholder in both day-count messages.

#### Popover styles

- If your Sass uses the exported popover panel mixin and relies on its width, height or scrolling limits, change `@include popover.panel;` to `@include popover.panel($constrained: true);`.

#### Time

- `sd-time` now uses a CDK connected overlay with `role="dialog"`. Replace direct calls to the removed Material menu trigger with the component methods below. Tests that inspect the open state can read `aria-expanded` on `[data-time-picker-trigger]` and find the picker through `.sd-time-panel[role="dialog"]`. The component exposes no equivalent to the Material menu's open and close event streams.

  ```diff
  - time.menuTrigger()?.openMenu();
  + time.open();
  - time.menuTrigger()?.closeMenu();
  + time.cancelPicker();
  ```

### Added

#### Date Range

- The calendar announces when to choose the end date and shows the selected period with its inclusive day count.

#### Page

- The table of contents links to a section by its host ID and restores that position when a link opens.

#### Pattern

- Open a customer's Record 360 overview, filter overdue invoices from a metric, or print the one-page customer sheet.

#### Section

- Choose header and footer rules with `dividers`, the frame with `appearance`, and horizontal padding with `--sd-section-padding-inline`.
- Set `labelWidth="auto"` on a section item to give the label the remaining space and align its values to the end.

#### Tab

- Use `badgeColor` for an individual tab and `ariaLabel` to describe its count.

#### Table

- Use `sdTableQueryParams()` to link to a table with filters, sort and page size applied.

### Changed

#### Button and Query Bar

- Action Popover and query panels share the control panel's 10px corners, themed border and medium shadow. List rows have 6px corners.

#### Date, Datetime and Time

- Date and range pickers use the chip calendar's month navigation and day states, including in touch dialogs. Datetime adds the same navigation above its time controls and actions.
- The time field opens an anchored dialog with its hour input focused. Press Alt+Down to open, Escape to cancel, or Confirm to apply.

### Fixed

#### Section

- Elevated and outlined sections keep a visible frame in forced-colors mode.

#### Table

- Inline filters show disabled placeholders in headers without a filter control. Empty values chips in the query bar show a clickable value prompt.

## Compare with the previous release

- Previous documented release: [22.3.6](https://sdcorejs.github.io/sdcorejs-angular/docs/22.3.6/index.json)
- Source diff: https://github.com/sdcorejs/sdcorejs-angular/compare/v3.6...v3.7
