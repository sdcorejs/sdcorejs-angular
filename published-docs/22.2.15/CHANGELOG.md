# @sdcorejs/angular 22.2.15

Release tag `v2.15`, published 2026-09-25.

Release suffix `2.15` targets `19.2.15`, `20.2.15`, `21.2.15`, and `22.2.15`.

### Added
- File explorer: add `SdFileExplorer` (`@sdcorejs/angular/components/file-explorer`), a storage-agnostic Google-Drive-like browser in one element — lazy folder tree, breadcrumb, list/grid, debounced search in the current folder, a file detail drawer (images, on-demand PDF viewer, fallback, metadata, download, share link), multi-file upload with drag-and-drop and a 3-slot queue, downloads, cancel/retry transfer queue, folder creation and a compact layout below 720 px of its own width. Configured through `SdFileExplorerOption` callbacks (`list`, optional `search`, `preview`, `download`, `share`, `upload`, `createFolder`); UI for an absent callback is hidden, and `(open)` emits once per opened file. The file detail reuses `sd-side-drawer`, opened in the explorer item area (right of the folder tree, below the header) through the new `container` input, so search, upload, the folder tree and the transfer queue stay usable. File-type icons come from an embedded 45-icon SVG set (136 extensions, compound suffixes, dot-files and MIME fallbacks) that needs no consumer asset configuration; maintainers regenerate it with `npm run generate:file-explorer-icons`, guarded by `npm run test:scripts`. Ships JSDoc, API documentation and an interactive showcase with an in-memory drive.
- Icon: add default Lucide aliases for `folder_open`, `format_list_bulleted`, `grid_view` and `swap_vert`.
- Side drawer: add `container` (`HTMLElement | ElementRef<HTMLElement>`) to open the drawer inside an element instead of over the viewport. Panel and backdrop stay within that element, page scroll stays unlocked, a static container becomes the positioning context while the drawer lives in it, and the narrow layout follows the container width. `null` (default) keeps the current behaviour.

### Fixed
- Button: icon-only buttons use `tooltip` as their accessible name (`aria-label`), so screen readers no longer announce them as unnamed buttons.
- Preview PDF: draw the light-theme "PDF" file tile label in the danger colour; it used the pale error tint and was nearly invisible.

## Compare with the previous release

- Previous documented release: [22.2.14](https://sdcorejs.github.io/sdcorejs-angular/docs/22.2.14/index.json)
- Source diff: https://github.com/sdcorejs/sdcorejs-angular/compare/v2.14...v2.15
