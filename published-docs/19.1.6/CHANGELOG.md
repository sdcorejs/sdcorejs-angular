# @sdcorejs/angular 19.1.6

Release tag `v1.6`, published 2026-08-07.

Release suffix `1.6` publishes `19.1.6`, `20.1.6`, and `21.1.6` as a stable release across the maintained Angular lines.

### Added

- **`sd-date` auto-formats a typed date** - separators appear while you type (`22081991` becomes `22/08/1991`); non-digits are dropped and the input is capped at eight digits. Deleting never re-adds the separator you just removed.
- **Sidebar menu search matches routes and initials** - the menu filter now also matches a menu's route path (`product`) and the ordered initials of its label (`sp` finds `San pham`), on top of the existing accent-insensitive title match. `HighlightSearchPipe` marks each matched initial when there is no contiguous substring to highlight.
- **Tabs for the built-in `forbidden` and `not-found` pages** - both register a `@SdTabComponent` (icons `block` and `search_off`), so opening them in a tabbed shell shows a real icon and a translated label instead of an empty tab. New i18n keys `core.module.layout.{forbidden,not-found}.tab-name` in all five locales, plus a shared `resolveTabName()` helper that `home` now uses as well.

### Fixed

- **`sd-date` and `sd-date-range` accepted a half-typed date as a value** - typing `11/12/2` produced year 0002, `11/12/20` produced year 0020, and deleting back to `11` produced year 1100, with the error flag cleared so the field looked valid. Both inputs are bound to Angular Material date inputs, which re-parse the text after every keystroke; the stock date-fns adapter accepts a short year and falls back to `parseISO`, which reads `11` as a century. The new `SdStrictDateFnsAdapter` skips that fallback and requires the text to round-trip through the configured format, so a control only ever receives a date the user finished typing. `sd-datetime` is unaffected - its input is not `[matDatepicker]`-bound.
- **PDFs failed to open in production builds** - `<sd-preview-pdf>` pointed pdf.js at a worker file that esbuild never emitted, so every document ended in the "Setting up fake worker failed" network-error state after an AOT deploy while `ng serve` was fine. The worker bundle is now inlined and handed to pdf.js as a `blob:` URL, so consumer apps need no `angular.json` assets entry and no manual file copy. Requires a deployment CSP that allows `worker-src blob:`; `sd-preview.md` documents the manual `workerSrc` escape hatch.
- **`sd-table` export button label was hard-coded English** - the main Export button now goes through `I18nService` like the export-excel and export-csv menu items already did, so a Vietnamese user sees "Xuat du lieu". New keys `core.component.table.export` and `core.component.table.exporting` in all five locales.

### Changed (BREAKING for consumers)

- **`TableExportService.exportTitle` is no longer a `WritableSignal`** - it became a `computed()` over the current language plus export progress. Drive progress through the new `setExportProgress(percent | null)` instead of assigning to `exportTitle`. Nothing in the library assigned to it; only consumers that did need to migrate.

## Compare with the previous release

- Previous documented release: [19.1.5](https://sdcorejs.github.io/sdcorejs-angular/docs/19.1.5/index.json)
- Source diff: https://github.com/sdcorejs/sdcorejs-angular/compare/v1.5...v1.6
