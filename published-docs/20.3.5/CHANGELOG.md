# @sdcorejs/angular 20.3.5

Release tag `v3.5`, published 2026-11-05.

Packages `19.3.5` · `20.3.5` · `21.3.5` · `22.3.5`, validated against `*.3.4`.

> [!IMPORTANT]
> **Before upgrading:** the table query bar (`filter.mode: 'query-bar'`) now edits chips inline on the bar; set `filter.queryBar.editor: 'popover'` (per table or in `SD_TABLE_CONFIGURATION`) to keep the popover chips. The table settings modal gets a **Bộ lọc** tab where users can switch between the filter panel and the query bar; set `filter.modeSelectable: false` to keep `filter.mode` fixed. Default client XLSX export writes untransformed `date`, `datetime` and `time` columns as Excel date/time cells instead of date strings. On phones, table cards get a new frame, the filter drawer becomes a bottom sheet with filter chips, **⋮** (Tools) moves to the top row and pull to refresh replaces Reload; E2E tests that use `-mobile-tool-filter`, `-mobile-tool-sort-<field>` or `-mobile-tool-reload` must use the chips, the sort sheet and the reload button, and tests that use the filter drawer ids `-mobile-filter-ext-<field>`, `-mobile-filter-col-<field>` or `-mobile-filter-def-<field>` must open the filter's page first.

**Highlights**

- Table phone cards from `mobile.template`, filter chips, bottom sheets for filters and sorting, a redesigned Tools sheet, and pull to refresh
- Table settings: a filter tab with a saved choice between the filter panel and query bar, plus inline query-bar chip editing
- Excel export: typed date/time cells and `SdExcelColumn.numFmt` for numeric and date values
- Modal accessibility: dialogs and bottom sheets use their heading as their accessible name

### Changed (BREAKING for consumers)

#### Table

- `filter.queryBar.editor` defaults to `'inline'` (was `'popover'`): each chip's operator and value are edited directly on the bar. A standalone `sd-query-bar` still defaults to `'popover'`.
  - The header filter icon focuses the field's chip, or starts building one when the field has none. Its `aria-haspopup` follows what opens: `menu` with the popover editor; with the inline editor nothing for a field with a chip, else `menu` (operator menu), `listbox` (value picker) or `dialog` (date picker).
  - **Migration:** to keep the previous look, set the editor per table or for every table.

    ```diff
      filter: {
        mode: 'query-bar',
    +   queryBar: { editor: 'popover' },
      },
    ```

- Default client XLSX export now writes untransformed `date`, `datetime` and `time` columns as Excel numeric date/time cells, displayed as `dd/MM/yyyy`, `dd/MM/yyyy HH:mm:ss` and `HH:mm:ss`.
  - **Migration:** code reading these XLSX files must accept numeric/date cells instead of the previous date strings. Existing transforms still take priority; their strings remain text. CSV retains its existing string formats.
  - Configured timezone, column selection, export limits and unknown-total paging are preserved. Invalid values remain blank; valid dates outside 1900–9999 stay formatted text.

- Phone **Tools** sheet: Filter, Sort and Reload are gone (they moved to the chip row, the sort sheet and pull to refresh), so the autoIds `{autoId}-mobile-tool-filter`, `{autoId}-mobile-tool-sort-<field>` and `{autoId}-mobile-tool-reload` no longer exist. `{autoId}-mobile-tools` is now the **⋮** button in the top row (same accessible name), not a labelled button in the footer.
  - **Migration:** open the filters with `{autoId}-mobile-filter` (all) or `{autoId}-mobile-filter-<field>` (one), sort with `{autoId}-mobile-sort`, reload with `{autoId}-mobile-reload` (or pull the card list down).
- Phone filter drawer: the controls no longer sit in one list, so `{autoId}-mobile-filter-ext-<field>`, `{autoId}-mobile-filter-col-<field>`, `{autoId}-mobile-filter-col` and `{autoId}-mobile-filter-def-<field>` no longer exist; `{autoId}-mobile-filter-apply` and `-cancel` keep their names. The `autoId` an external `custom` filter template gets is `{autoId}-mobile-filter-<field>` (was `{autoId}-mobile-filter-ext-<field>`).
  - **Migration:** open a filter's page with `{autoId}-mobile-filter-row-<field>`, then use `{autoId}-mobile-filter-<field>-value` (one box), `-<field>-from` / `-<field>-to` (ranges), `-<field>-option-<n>` (checkboxes), `-<field>-options` (radio list), `-<field>-operator` and `-<field>-search`; **Xong** is `{autoId}-mobile-filter-done`.

### Added

#### Excel

- `SdExcelColumn.numFmt` sets an Excel number format for numeric or `Date` data cells in `SdExcelService.export()`. Strings are never parsed as dates. Omitted or empty formats preserve integer `0` / decimal General defaults; templates, CSV and additional sheets retain their existing behavior.

#### Modal

- `closeOnNavigation` input (default `true`, Material's name): `false` keeps the dialog or sheet open on a browser history change, so the content can handle Back itself.

#### Table

- `mobile.template` builds phone cards without a template: `{ layout?: 'card', data: (item, { index, selected }) => SdTableMobileCardData<T> }` with `title`, `subtitle`, `badge`, `highlight`, `fields` and `maxFields` (default 4, then a "{n} more fields" button), or a `TemplateRef`; `false` keeps the desktop table on phones.
  - Types `SdTableMobileTemplate`, `SdTableMobileData`, `SdTableMobileCardData`, `SdTableMobileDataContext`, `SdTableMobileDataFn`, `SdTableMobileField` and `SdTableMobileText` from `@sdcorejs/angular/components/table`. Fields are `NestedKeyOf<T>` and checked again at run time: an unknown field drops its slot, a badge field without `useBadge` shows as text, an unknown layout draws a card, each with one dev warning per table.
  - Priority: `sdTableRowMobileDef` → `mobile.template` → `autoTemplate` → desktop table. `data` runs again only when the rows are read again, `table.detectChanges()` runs, or the row's index or selection changes; a row whose `data` throws uses the card derived from the columns.

  ```ts
  mobile: {
    rowLabel: row => row.code,
    template: { data: row => ({ title: 'code', subtitle: 'customerName', badge: 'status', highlight: 'total', fields: ['createdAt', 'warehouse'] }) },
  },
  ```

- `SD_TABLE_CONFIGURATION.mobile.autoTemplate` (default `false`): tables without a card body get phone cards derived from their visible columns.
- Phone filter chips under the table search: **Bộ lọc** with the number of active filters, a sort chip, then one chip per filter with the same summary as the query bar chip. A chip opens the sheet of that filter (Clear, Cancel, Apply).
- Phone sort sheet: **Ascending | Descending** and one column, `invisible` and settings-hidden columns included, with **Bỏ sắp xếp**.
- Pull to refresh on the phone card list (with `reload.visible`; the browser's own pull to refresh is held during the pull), and a reload button for keyboards and screen readers that shows when focused.
- New i18n keys `core.component.table.mobile.more-fields`, `show-less`, `filter-open`, `filter-count`, `clear-field`, `search-options`, `date-from`, `date-to`, `done`, `sort-clear`, `sort-asc`, `sort-desc`, `sort-active`, `refresh-pull`, `refresh-release`, `tools-export`, `tools-table`, `export-excel-hint`, `export-csv-hint`, `export-custom-hint`, `exporting`, `config-hint` and `config-custom` in all five languages.
- The settings modal gets a **Bộ lọc** tab next to **Cột**, with one footer for both: Apply stores both tabs, Skip drops both, **Khôi phục mặc định** resets both.
  - **Kiểu lọc:** two radio cards, **Khung bộ lọc** and **Thanh bộ lọc**, to pick the filter mode (hidden with `filter.modeSelectable: false`).
  - **Bộ lọc hiển thị:** one switch row per external filter: shown in the panel, or pinned as a chip on the bar. Required filters are locked; on the bar, a filter the bar cannot show is off and locked, and `queryBar.pinned` locks the list. With the bar picked, a warning says that filters not on the bar still filter by their value.
  - **Thanh bộ lọc** is disabled, with a note naming them, while a `required` external filter cannot go on the bar.
  - The tab shows on desktop when filtering is on and the table has a filter. New i18n keys `core.component.table.config.tab-columns`, `filter-kind`, `mode-default`, `mode-default-hint`, `mode-query-bar`, `mode-query-bar-hint`, `filter-list`, `filters-hint-panel`, `filters-hint-bar`, `filters-hint-pinned`, `filter-required`, `filter-off-bar`, `mode-query-bar-blocked`, `filters-off-bar-warning` and `fixed-hint` in all five languages.
- The filter mode can be a user setting: `TableFilterConfiguration.mode` stores the mode the user picks, next to the inline external filters, and wins over `filter.mode`.
  - `filter.modeSelectable` (default `true`, also in `SD_TABLE_CONFIGURATION.filter`): `false` always uses `filter.mode` and ignores a stored choice.
  - The stored mode turns on the dot of the settings button while it differs from `filter.mode`, and **Khôi phục mặc định** clears it. Mobile still renders the default controls.
  - With `filter.key` the choice survives reloads; without it, it lasts until the table gets a new option object (as `inlineExternal`).

### Changed

#### Layout

- Performance: the account menu's document Escape and outside-pointer listeners are active only while the menu is open; closing or destroying it removes both listeners.

#### Modal

- The dialog or bottom sheet is named by its heading: the default title, or the first heading (`h1`–`h6`, `role="heading"`) of a projected `[sdHeaderLeft]`, instead of the whole header-left cell with its buttons. The name follows a heading that is swapped while the modal is open; a header-left without a heading still names it as a whole.

#### Query bar

- The chip value text moved to the shared `ɵsdQueryChipValueText` / `ɵSdQueryChipLabels`, which the phone table filters use too. The text is unchanged.

#### Select

- Performance: the read-error retry keyboard listener runs outside Angular only while the select panel is open. Closing the panel, replacing the inner select or destroying the component removes it, so closed selects in editable grids do not process document key events.

#### Table

- Phone card frame: the selector sits in a 44px left column (no longer over the top-right border), ⋯ in the top-right corner, and **Chi tiết** is the last line of the card, above the details it opens; the "Chi tiết · ⋯" row is gone. Cards are 12px rounded and 8px apart on a low surface.
- The phone filter side drawer is a bottom sheet with two levels (the list of filters with their summary → the page of one filter), also when a phone shows the desktop table. The list has no ✕ (Cancel closes it). Controls are 44px, a date range has floating **Từ ngày** / **Đến ngày** labels, operators are a text button, values lists are checkboxes with a search box above 8 options. Apply writes every filter and reads once; on the list, Cancel, the scrim, a swipe down and Back drop the edits, and on a page, ←, **Xong**, Escape and Back return to the list. Each open level adds a browser history entry, except when the table sits in a dialog or a sheet. A column hidden through the settings keeps its filter while it still filters.
- Phone footer: only the paginator. **⋮** (Tools) moved to the top row next to the search.
- Phone Tools sheet: the exports are tiles with their file kind (Excel `.xlsx`, CSV `.csv`), which show the progress while an export runs and close the sheet when it is done; the table settings are a row marked **Đã tùy chỉnh** while the table uses a setup of its own. The sheet has a handle and no ✕ like the other phone sheets; its autoIds are unchanged.
- Phone sheets start with focus on their title, so **Bỏ chọn**, **Bỏ sắp xếp** and **Xóa tất cả** look the same when a sheet opens.
- Phone selection bar: the count uses the primary light color (was the success fill) and the bar sits 12px off both screen edges.
- Phone cards scroll with the page: the table is no scroll box of its own (`sd-table--cards`: `height: auto; overflow: visible`) and drops the `sd-page-list` fill mode while it shows cards, so the page scrolls once instead of the cards scrolling in a short box (and inside the page on short screens). The phone footer is at least 48px, so the paginator's touch targets no longer made the table scroll by 2px. `style.maxHeight` still applies.
- `filterRegister.configuration.set()` keeps the fields it is not given (it used to replace the whole filter setup): setting only `inlineExternal` keeps the mode, and `mode: undefined` clears it.
- The **Cố định khi cuộn ngang** and **Rút gọn nội dung dài** options of an open row in the settings modal are rows with the label and a description on the left and an `sd-switch` on the right (were checkboxes); the description no longer pushes the other option out of line.

### Fixed

#### Table

- Apply in the settings modal no longer reads the data again when the column setup did not change, for example when only the **Bộ lọc** tab changed or nothing changed at all; a read in flight keeps going and renders. A column set back to its original value counts as unchanged.
  - A changed column setup (shown, hidden, reordered, renamed, resized, fixed or truncated columns) still reads once, as does **Khôi phục mặc định**; both drop a read in flight.

## Compare with the previous release

- Previous documented release: [20.3.4](https://sdcorejs.github.io/sdcorejs-angular/docs/20.3.4/index.json)
- Source diff: https://github.com/sdcorejs/sdcorejs-angular/compare/v3.4...v3.5
