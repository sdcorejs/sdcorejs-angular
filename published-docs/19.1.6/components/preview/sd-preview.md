# `<sd-preview-image>`

**Type**: Component
**Selector**: `sd-preview-image`
**Import path**: `@sdcorejs/angular/components/preview` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdPreviewImage`
**Standalone**: yes (default)
**Change detection**: `OnPush` (signal-driven)

---

## One-line purpose

Dark-themed, fullscreen-capable image gallery viewer — a self-contained surface that **sizes to its container** (`width: 100%; height: 100%;`, like `<sd-table>`). The consumer decides whether to embed it inline, wrap it in `<sd-modal>`, `<sd-side-drawer>`, or hand it a full page. The component itself has zero knowledge of the chrome around it.

## When to use

- "Xem ảnh" preview launched from a list / table / attachment row (consumer wraps in `<sd-modal>`)
- Inline image gallery in a CRUD detail panel (just drop into a sized container)
- Inside an `<sd-side-drawer>` for compare-view workflows
- Full-page lightbox route (`/preview/:id`) — pass the whole `<router-outlet>` area
- Previewing image `File` objects the user just selected (before upload)
- Single-image lightbox (use `thumbnailPosition="none"`)
- Carousel with dots indicator for ≤ 8 images (use `thumbnailPosition="dots"`)

## When NOT to use

- For PDFs, Word, Excel, or other non-image documents → not supported (non-image `File`s are silently dropped)
- When you need annotation / cropping → this is a passive viewer
- When you need to show > 200 images at once → component loads each in parallel; consider lazy pagination upstream
- For inline embeds where you only need ONE image with no chrome → just use a plain `<img>`

## Sizing — the most important rule

The component renders `display: block; width: 100%; height: 100%; min-height: 320px;`. **Its parent must give it a height** (explicit `height`, flexbox `flex: 1`, grid row, or `<sd-modal>` body which already provides one). If the parent has no height and no flex constraint, the component falls back to its `min-height: 320px` floor — usable but cramped.

In fullscreen mode (`toggleFullscreen()` or `f` key) the component requests the browser Fullscreen API on **its own host element** and grows to `100vw × 100vh` with square corners.

## Inputs

| Name                | Type                                                         | Default     | Notes                                                                                                                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autoId`            | `string \| null \| undefined`                                | `undefined` | E2E test hook. Computed prefix `components-preview-image-{autoId}`. Derived child autoIds: `-prev`, `-next`, `-zoom-in`, `-zoom-out`, `-fit`, `-rotate`, `-download`, `-fullscreen`, `-retry`, `-thumb-{i}`, `-dot-{i}`.                                                                |
| `items`             | `PreviewItem[]`                                              | `[]`        | **Signal input — declarative.** Each change normalizes the list (fetches strings → blob, filters non-image `File`s, builds internal `NormalizedImage[]`). Re-entrant: old blob URLs are revoked before re-loading.                                                                      |
| `startIndex`        | `number`                                                     | `0`         | Which slot to focus first on a fresh `items` push. Clamped to `[0, items.length-1]`.                                                                                                                                                                                                    |
| `title`             | `string \| undefined`                                        | `undefined` | Optional override shown only in the simplified header on empty state. The normal header always shows the active image's filename.                                                                                                                                                       |
| `thumbnailPosition` | `'bottom' \| 'right' \| 'left' \| 'top' \| 'dots' \| 'none'` | `'bottom'`  | Where the navigator sits. `dots` swaps the strip for compact dot indicators (≤ 8 images). `none` removes the navigator entirely.                                                                                                                                                        |
| `showToolbar`       | `boolean`                                                    | `true`      | Bottom floating toolbar (zoom %, rotate, fit, download, fullscreen).                                                                                                                                                                                                                    |
| `downloadable`      | `boolean`                                                    | `true`      | Show the download button + bind `d` key.                                                                                                                                                                                                                                                |
| `zoomable`          | `boolean`                                                    | `true`      | Enable wheel-zoom, pinch-zoom, `+` / `-` / `0` keys, and the zoom buttons.                                                                                                                                                                                                              |
| `loop`              | `boolean`                                                    | `true`      | Whether ←/→ wraps at the ends.                                                                                                                                                                                                                                                          |
| `theme`             | `'dark' \| 'light'`                                          | `'dark'`    | Color scheme. Drives `[data-theme]` on the host element; SCSS swaps token values via `:host([data-theme="light"])`. The light variant inherits `--sd-primary`, `--sd-error`, `--sd-success` from consumer theme tokens (falls back to sensible defaults when those vars are undefined). |

> All inputs use signal inputs (`input(...)`); read them as `myComponent.thumbnailPosition()` from outside.
> Theme switching is purely declarative — toggling `theme()` re-paints via CSS variables; no runtime style mutation. Per-instance overrides still work by writing the same `--sd-preview-*` custom properties on a wrapping element.

## Outputs

| Name                | Type                                       | Notes                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `close`             | `void`                                     | Emitted when the consumer programmatically calls `requestClose()` (e.g. from their own dismiss button). The component does NOT bind `Esc` to this output — when wrapped in `<sd-modal>` the modal already handles Esc; for standalone embeds the consumer wires their own dismiss control. **The component never closes itself** — it just emits this intent. |
| `activeIndexChange` | `number`                                   | Emitted whenever the active slide changes (nav arrow, thumbnail, swipe, ← / →).                                                                                                                                                                                                                                                                               |
| `download`          | `{ index: number; item: NormalizedImage }` | Emitted after `downloadCurrent()` triggers the download anchor click.                                                                                                                                                                                                                                                                                         |
| `imageError`        | `{ index: number; reason: string }`        | Emitted when an image renders broken (404, CORS, malformed blob). The stage automatically switches to the error artboard.                                                                                                                                                                                                                                     |

## Public methods (called via template ref / `viewChild`)

| Method                  | Signature                                | Notes                                                                       |
| ----------------------- | ---------------------------------------- | --------------------------------------------------------------------------- |
| `onClickThumbnailImage` | `(index: number) => void`                | Jump to a specific slide.                                                   |
| `updateCurrentImage`    | `(direction: 1 \| -1) => void`           | Step forward / backward (wraps when `loop` is true).                        |
| `zoomIn` / `zoomOut`    | `() => void`                             | ±10% per call, clamped to [25%, 400%].                                      |
| `fitToScreen`           | `() => void`                             | Reset zoom + rotation + pan.                                                |
| `rotate`                | `(direction: 'left' \| 'right') => void` | ±90° per call.                                                              |
| `downloadCurrent`       | `() => void`                             | Download the active image via an `<a download>` anchor.                     |
| `toggleFullscreen`      | `() => void`                             | Browser Fullscreen API **on the component host element**.                   |
| `retryActive`           | `() => Promise<void>`                    | Re-fetch the active image from its CDN URL (Artboard G's "Thử lại" button). |
| `requestClose`          | `() => void`                             | Programmatic equivalent of clicking the X — just emits the `close` output.  |

> The old imperative `open(items, options?)` method **has been removed**. Push items via the `[items]` signal input instead.

## `PreviewItem` shape

```ts
type PreviewItem =
  | string // CDN / HTTP URL
  | File // image/* only — non-image files are dropped silently
  | {
      url?: string;
      file?: File;
      name?: string; // override filename shown in header
      caption?: string; // optional caption below image
      alt?: string; // a11y override
      mime?: string; // hint for filtering / icon
    };
```

## Visual cues (helps agent map screenshots → component)

The component has **8 distinct visual states** (Artboards A–H from the design handoff):

| Artboard | State                                                       | Visual signature                                                                                                                                                                                                                                                                                                                                                                                            |
| -------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A**    | Default (`thumbnailPosition: 'bottom'`)                     | Dark `#0d0e10` shell. 68px header with `image` icon + filename + counter pill (centered). Stage with checkerboard pattern, 48px round nav arrows, floating bottom toolbar. 116px horizontal thumb strip on `#17191c`.                                                                                                                                                                                       |
| **B**    | Zoomed (`zoom > 100%`)                                      | Same as A but image has `transform: scale(...)`, cursor changes to `grab` / `grabbing`. Zoom readout in toolbar shows current %.                                                                                                                                                                                                                                                                            |
| **C**    | Right vertical strip (`thumbnailPosition: 'right'`)         | Two-column layout, stage left, 152px-wide column of thumbs on the right. Each thumb shows filename overlay in a bottom gradient.                                                                                                                                                                                                                                                                            |
| **D**    | Dots indicator (`thumbnailPosition: 'dots'`)                | No thumb strip. Stage is full-height. Dot row absolute at `bottom: 24px`. Active dot grows to a 24×8 pill.                                                                                                                                                                                                                                                                                                  |
| **E**    | Minimal (`thumbnailPosition: 'none'`, `showToolbar: false`) | Single-image lightbox. No thumb strip, no bottom toolbar. Just header + stage.                                                                                                                                                                                                                                                                                                                              |
| **F**    | Loading (`stage = 'loading'`)                               | 56×56 circular spinner + "Đang tải ảnh..." label.                                                                                                                                                                                                                                                                                                                                                           |
| **G**    | Broken image (per-image error)                              | **Inline placeholder INSIDE the image area** — 96×96 rounded-24 danger tile with `broken_image` icon + "Không tải được ảnh" + retry button (`refresh` icon, accent background). Nav arrows, dots, thumbnails, and the floating toolbar **stay visible and interactive** so the user can navigate to another image. Thumbs of broken items show a small `broken_image` icon on a translucent red background. |
| **H**    | Empty (`images.length === 0`)                               | 96×96 rounded-24 muted tile with `image_not_supported` icon + "Không có thông tin ảnh". Header simplified.                                                                                                                                                                                                                                                                                                  |

### Recurring elements

- **Header counter pill**: rounded, `tabular-nums`, absolutely centered between left meta and right close
- **Nav arrows**: 48×48 round, `rgba(20,20,22,0.6)` + `backdrop-filter: blur(10px)`, disabled state at 35% opacity
- **Floating toolbar**: pill-shaped container, 6×8 padding, divider lines between zoom group / fit / rotate / download+fullscreen group
- **Active thumbnail**: `outline: 2px solid var(--sd-preview-primary)` + inset shadow (uses outline so the thumb doesn't resize on activate)
- **Keyboard hint**: top-left of stage, `<kbd>`-style chips for ← →
- **Caption**: when `PreviewItem.caption` is set, a rounded pill `rgba(15,17,20,0.7)` above the bottom toolbar

## Interactions

### Keyboard (host-scoped, not document)

The component host has `tabindex="0"` and listens to `keydown` via `@HostListener`. Shortcuts only fire when the component (or any descendant) has focus — they will **not** "leak" into the rest of the app when the viewer is offscreen.

| Key           | Action                         |
| ------------- | ------------------------------ |
| `←`           | Previous image                 |
| `→`           | Next image                     |
| `+` / `=`     | Zoom in (when `zoomable`)      |
| `-`           | Zoom out (when `zoomable`)     |
| `0`           | Fit to screen                  |
| `r`           | Rotate right                   |
| `R` (Shift+r) | Rotate left                    |
| `f`           | Toggle fullscreen              |
| `d`           | Download (when `downloadable`) |

The host auto-focuses itself on first render (`afterNextRender`) so keyboard shortcuts work immediately when the component appears, even when **not** wrapped in a modal.

### Mouse / Pointer

- **Wheel** on stage: zoom in / out (anchored on cursor, ±10% per tick).
- **Click + drag** when zoomed > 100%: pan via `transform: translate(...)`.
- **Click + drag** when zoom ≤ 100%: horizontal swipe ≥ 40 px → next / previous slide.
- **Double-click** on stage: toggle between 100% and 200%.
- **Two-finger pinch**: pinch-zoom (touch + trackpad).
- **Click thumbnail**: jump to slide; the strip auto-scrolls to keep the active thumb in view.

### Memory

Every blob URL created by the component is tracked in an internal `Set<string>` and revoked on:

1. `items()` input change (before populating new entries)
2. `ngOnDestroy` / `DestroyRef.onDestroy`

CDN strings passed in by the caller are NOT revoked — the component owns only the blobs it itself created via `URL.createObjectURL`.

## Examples

### 1. Inline gallery inside a page section (consumer provides a height)

```html
<div class="image-gallery-section" style="height: 600px;">
  <sd-preview-image [items]="myImages()" thumbnailPosition="bottom" (close)="onClose()"> </sd-preview-image>
</div>
```

### 2. Wrapped in a modal — consumer drives open/close

```html
<sd-modal #modal [title]="'Xem ảnh'" width="92vw" height="86vh">
  <sd-preview-image [items]="modalImages()" (close)="modal.close()"> </sd-preview-image>
</sd-modal>

<sd-button (click)="modalImages.set(row.attachments); modal.open()"> Xem ảnh </sd-button>
```

```ts
readonly modalImages = signal<PreviewItem[]>([]);
```

### 3. Single-image lightbox inline (no chrome)

```html
<sd-preview-image [items]="[singleImageUrl]" thumbnailPosition="none" [showToolbar]="false"> </sd-preview-image>
```

### 4. From an upload input — preview before submit

```html
<input type="file" multiple accept="image/*" (change)="onFiles($event)" />

<div style="height: 480px;">
  <sd-preview-image [items]="selectedFiles()"></sd-preview-image>
</div>
```

```ts
readonly selectedFiles = signal<PreviewItem[]>([]);

onFiles(e: Event) {
  const input = e.target as HTMLInputElement;
  this.selectedFiles.set(input.files ? Array.from(input.files) : []);
}
```

### 5. Full-page route — `/preview` takes the whole viewport

```html
<!-- preview.page.html -->
<sd-preview-image [items]="route.images()" [thumbnailPosition]="'bottom'" (close)="router.navigate(['../'], { relativeTo: route })">
</sd-preview-image>
```

```scss
:host {
  display: block;
  height: 100vh;
}
```

### 6. React to navigation / error / download events

```html
<sd-preview-image
  [items]="gallery()"
  (activeIndexChange)="onSlideChanged($event)"
  (imageError)="logBrokenImage($event)"
  (download)="trackDownload($event)">
</sd-preview-image>
```

## Anti-patterns

- DON'T forget to give the parent container a height — without it the component collapses to `min-height: 320px`.
- DON'T pass PDF / non-image URLs — fetched as `<img>` they show as broken; non-image `File`s are dropped silently.
- DON'T try to call an `open()` method — it no longer exists. Set `[items]` to a non-empty array instead.
- DON'T `close.emit()` and expect the component to hide itself — the component never owns its own visibility. Consumer must react to the `close` output (set a signal, call `modal.close()`, navigate away).
- DON'T mix `thumbnailPosition="dots"` with > 20 images — dots become illegible. Switch to `bottom`.
- DON'T mount one `<sd-preview-image>` per row in a list — declare ONE in the page and swap `[items]`.

## Related

- `<sd-modal>` — optional chrome host when you want overlay + focus trap
- `<sd-side-drawer>` — alternative chrome host for compare-style workflows
- `<sd-preview-pdf>` — sibling component for PDF documents (see below)
- `<sd-document-builder>` — for Word / Excel previews
- `<sd-button>` — typically used by callers to update `items()`

---

# `<sd-preview-pdf>`

**Type**: Component
**Selector**: `sd-preview-pdf`
**Import path**: `@sdcorejs/angular/components/preview` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdPreviewPdf`
**Standalone**: yes
**Change detection**: `OnPush` (signal-driven)

## One-line purpose

Dark-themed PDF document viewer — same self-contained surface contract as `<sd-preview-image>`: sizes to its container, the consumer decides whether to wrap it in a modal, drawer, or page section. Loads via the `[source]` signal input (URL / `File` / `Blob` / `ArrayBuffer` / `Uint8Array` / options-object) and renders pages to a `<canvas>` using `pdfjs-dist` 4.x.

## When to use

- Preview a contract / invoice / report from a list, table, or attachment row
- Inline document viewer in a CRUD detail panel
- Inside an `<sd-side-drawer>` for compare-view workflows
- Full-page lightbox route (`/preview-pdf/:id`)
- Previewing a user-selected `File` before upload

## When NOT to use

- For images → use `<sd-preview-image>`
- For Word / Excel → not supported (use `<sd-document-builder>`)
- For password-protected PDFs that need an inline password prompt — this commit emits `loadError({ reason: 'password' })` only; consumer must render their own password dialog

## Sizing

Same as `<sd-preview-image>` — `display: block; width: 100%; height: 100%; min-height: 320px`. Parent must give it a height (explicit `height`, flex `flex: 1`, grid row, or `<sd-modal>` body). Falls back to 320px floor otherwise.

## Inputs

| Name           | Type                                  | Default        | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------- | ------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `autoId`       | `string \| null \| undefined`         | `undefined`    | E2E test hook. Computed prefix `components-preview-pdf-{autoId}`. Derived child autoIds: `-first`, `-prev`, `-next`, `-last`, `-page-input`, `-zoom-in`, `-zoom-out`, `-zoom-readout`, `-fit-page`, `-fit-width`, `-rotate`, `-scroll-mode`, `-search`, `-print`, `-download`, `-fullscreen`, `-sidebar-toggle`, `-tab-{thumbnails\|outline\|search}`, `-search-{input\|next\|prev\|case\|whole\|close}`, `-retry`, `-thumb-{i}`, `-result-{i}`. |
| `source`       | `PdfSource \| null`                   | `null`         | URL string, `File`, `Blob`, `ArrayBuffer`, `Uint8Array`, `{url, httpHeaders?, withCredentials?}`, or `{data}`. Setting a new source destroys the previous document and revokes viewer-created object URLs; caller-owned source URLs are never revoked.                                                                                                                                                                                           |
| `title`        | `string \| undefined`                 | `undefined`    | Overrides the header filename (otherwise inferred from URL / `File.name`).                                                                                                                                                                                                                                                                                                                                                                       |
| `startPage`    | `number`                              | `1`            | Initial page on load. Clamped to `[1, numPages]`.                                                                                                                                                                                                                                                                                                                                                                                                |
| `initialZoom`  | `PdfZoomMode`                         | `'page-fit'`   | Number (1 = 100%), `'page-fit'`, `'page-width'`, `'page-actual'`.                                                                                                                                                                                                                                                                                                                                                                                |
| `sidebar`      | `PdfSidebarMode`                      | `'thumbnails'` | `'thumbnails'`, recursive document `'outline'`, full-document `'search'`, or `'none'` (collapse).                                                                                                                                                                                                                                                                                                                                                |
| `sidebarOpen`  | `boolean`                             | `true`         | Whether the sidebar is initially expanded. User can toggle via the hamburger button.                                                                                                                                                                                                                                                                                                                                                             |
| `scrollMode`   | `PdfScrollMode`                       | `'page'`       | `'page'` or virtualized `'continuous'`. Continuous mode renders the visible pages plus a one-page buffer.                                                                                                                                                                                                                                                                                                                                        |
| `showToolbar`  | `boolean`                             | `true`         | Bottom floating toolbar visibility.                                                                                                                                                                                                                                                                                                                                                                                                              |
| `downloadable` | `boolean`                             | `true`         | Show download when supported. `downloadFile()` is the void UI wrapper; `downloadFileAsync()` is awaitable.                                                                                                                                                                                                                                                                                                                                       |
| `password`     | `string \| undefined`                 | `undefined`    | Forwarded to pdfjs when set. If still wrong, fires `loadError({ reason: 'password' })`.                                                                                                                                                                                                                                                                                                                                                          |
| `httpHeaders`  | `Record<string, string> \| undefined` | `undefined`    | Auth headers for URL sources. Object-form source's `httpHeaders` wins.                                                                                                                                                                                                                                                                                                                                                                           |
| `theme`        | `'dark' \| 'light'`                   | `'dark'`       | Color scheme. Drives `[data-theme]` on the host element; SCSS swaps token values via `:host([data-theme="light"])`. The light variant inherits `--sd-primary`, `--sd-error`, `--sd-success` from consumer theme tokens (falls back to sensible defaults when those vars are undefined). Search-highlight tokens stay yellow across both themes to remain readable on the white PDF page.                                                         |

## Outputs

| Name           | Type                                  | Notes                                                                                                                                                                                                                       |
| -------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `close`        | `void`                                | Fires only when the consumer calls `requestClose()` programmatically. **The component has no built-in close button and does NOT auto-close on Esc** — wrap it in a modal or page section that owns its own dismiss control. |
| `loaded`       | `{ totalPages, meta }`                | Fires once per successful load.                                                                                                                                                                                             |
| `pageChange`   | `number`                              | New active page number.                                                                                                                                                                                                     |
| `zoomChange`   | `number`                              | New numeric zoom after a render.                                                                                                                                                                                            |
| `download`     | `{ filename }`                        | After `downloadFile()` triggers the anchor click.                                                                                                                                                                           |
| `loadError`    | `{ reason, message? }`                | `reason` is one of `'invalid' \| 'password' \| 'network' \| 'unknown'`.                                                                                                                                                     |
| `searchChange` | `{ term, total, current, truncated }` | Fires whenever search state changes. `current` is 1-based and `0` when no result is focused; `truncated` reports the bounded-result cap.                                                                                    |

## Public methods (called via template ref / `viewChild`)

| Method                                                                     | Notes                                                                                                                                                                                                                                                   |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `goToPage(n)` / `nextPage()` / `prevPage()` / `firstPage()` / `lastPage()` | Page navigation. Clamped to `[1, numPages]`.                                                                                                                                                                                                            |
| `zoomIn()` / `zoomOut()`                                                   | ±10% per call, clamped to `[25%, 400%]`.                                                                                                                                                                                                                |
| `setZoom(mode)`                                                            | Accepts a number or `'page-fit'` / `'page-width'` / `'page-actual'`.                                                                                                                                                                                    |
| `rotate('left' \| 'right')`                                                | ±90° per call, wraps at 360.                                                                                                                                                                                                                            |
| `toggleSidebar()` / `setSidebarMode(mode)`                                 | Sidebar UI.                                                                                                                                                                                                                                             |
| `setScrollMode(mode)`                                                      | Switch between single-page and virtualized continuous rendering.                                                                                                                                                                                        |
| `downloadFile()` / `downloadFileAsync()`                                   | Download the active source. Public URLs require anchor-download support; byte sources and authenticated/options URLs also require Blob/object-URL support. Generated object URLs are revoked on the next safe frame. Repeated requests are latest-wins. |
| `activateSearchResult(index)`                                              | Activate and navigate to a sidebar search result, update its counter/style, and emit `searchChange`.                                                                                                                                                    |
| `toggleFullscreen()`                                                       | Browser Fullscreen API on the host element.                                                                                                                                                                                                             |
| `requestClose()`                                                           | Programmatic dismiss — emits `close`. There is no built-in UI button bound to this; consumer owns its own dismiss control.                                                                                                                              |
| `retryLoad()`                                                              | Re-runs the active source through `getDocument` (used by the error state retry button).                                                                                                                                                                 |
| `search(term, { caseSensitive?, wholeWord? })`                             | NFC-normalized, Unicode-aware full-document search. Resolves to the bounded count and exposes `searchTruncated()`; superseded calls are serialized and coalesced to the latest pending query.                                                           |
| `searchNext()` / `searchPrev()`                                            | Cycle through results; wrap at boundaries. Jumps the page automatically.                                                                                                                                                                                |
| `clearSearch()`                                                            | Reset search state. Re-emits `searchChange` with `total: 0`.                                                                                                                                                                                            |
| `openSearch()` / `closeSearch()`                                           | Toggle the search bar; `closeSearch()` also clears results.                                                                                                                                                                                             |
| `toggleSearchCaseSensitive()` / `toggleSearchWholeWord()`                  | Flip the matching options. Re-runs the active term automatically.                                                                                                                                                                                       |
| `printFile()` / `print()`                                                  | Start a managed browser print job from cloned PDF bytes. A replacement source, repeated print, or component destruction cancels the active job.                                                                                                         |

## Keyboard (host-scoped via `@HostListener`)

| Key                                               | Action                                                                                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `←` / `PageUp`                                    | `prevPage()`                                                                                                                    |
| `→` / `PageDown`                                  | `nextPage()`                                                                                                                    |
| `Home` / `End`                                    | `firstPage()` / `lastPage()`                                                                                                    |
| `+` / `=`                                         | `zoomIn()`                                                                                                                      |
| `-`                                               | `zoomOut()`                                                                                                                     |
| `0`                                               | `setZoom('page-fit')`                                                                                                           |
| `r` / `R`                                         | `rotate('right' / 'left')`                                                                                                      |
| `f`                                               | `toggleFullscreen()`                                                                                                            |
| `Ctrl/Cmd + F`                                    | `openSearch()` — focuses the search bar input                                                                                   |
| `Ctrl/Cmd + P`                                    | Starts the managed print flow when a document is ready.                                                                         |
| `Enter` / `F3` (search input focused)             | `searchNext()`                                                                                                                  |
| `Shift+Enter` / `Shift+F3` (search input focused) | `searchPrev()`                                                                                                                  |
| `Esc`                                             | Closes the search bar when open (and clears results). Otherwise **no-op** — the component never emits `close` from a keystroke. |

The host has `tabindex="0"` and auto-focuses on first render so keyboard works immediately.

## Mouse / wheel

- **Ctrl/Cmd + wheel** on stage: zoom in/out anchored at cursor.
- **Plain wheel**: native scroll (the stage scrolls when zoomed in).
- **Page input** in the toolbar: type a number + Enter to jump. Invalid / out-of-range values snap back to the current page on blur.

## Browser integration and lifecycle

All browser capabilities live behind injectable adapters. `SD_PDF_BROWSER_ADAPTER` owns DOM, fullscreen, resize/intersection observation, object URLs, and animation frames. `SD_PDF_PRINT_ADAPTER` owns the hidden print frame and its `afterprint`, error, timeout, and cancellation cleanup. Printing requires both object-URL creation and revocation; cleanup steps are isolated so a host exception cannot prevent the print job from settling. Override either token in tests or a non-standard host without changing viewer logic.

Every source change invalidates active load, metadata, outline, search, download, thumbnail, page-render, continuous-render, and print work. Typed-array inputs and print/download bytes are cloned before crossing an async boundary. Server-side rendering returns the empty state without resolving PDF.js or touching browser globals. Unsupported print, download, and fullscreen actions are omitted and their public methods remain inert. URL-download and Blob/object-URL capabilities are detected independently so a plain public URL can remain downloadable on a platform that cannot synthesize a Blob URL.

Continuous mode keeps estimated heights in a Fenwick index: point measurements, prefix offsets, and offset-to-page lookups remain logarithmic instead of rebuilding every page offset. Only the visible range plus one page on either side is mounted. Measured heights replace estimates without losing the viewport anchor. The viewport midpoint determines `activePage`, and page-change output is de-duplicated.

Thumbnail rendering is virtualized to a 48-row window, so even a 10,000-page document has bounded sidebar DOM. Its PNG LRU retains at most 96 entries, while a four-slot scheduler bounds unresolved page acquisition and rendering across rapid window changes; queued work is pruned to mounted pages (`thumbnailWorkCount()` exposes the current diagnostic size). Search stores at most 1,000 matches and keeps at most 128 page-text entries in its LRU (`pageTextCacheSize()` exposes the current diagnostic size). Only one page-text scan may extract at a time, and repeated live-search calls coalesce to the newest pending query. Each scan uses bounded snapshot/staging maps and commits only after successful completion, avoiding sequential eviction cascades without retaining every page. Search reports `truncated` in the signal, state snapshot, event, counter, and localized status. The sidebar and search disclosure buttons expose `aria-expanded` plus stable `aria-controls` targets. Canvas backing stores are capped at 8,192 pixels per dimension and 16,777,216 pixels total while CSS preserves the logical page size.

Outline destinations support direct page indices, named destinations, and PDF reference objects. Traversal detects cycles against the current ancestor path, allowing a shared DAG node to appear beneath each parent, while globally capping depth at 64 and rendered nodes at 10,000. It preserves safe partial rows when destinations are invalid. The exported `PdfOutlineItem` remains recursive; the UI exposes ARIA tree semantics and standard arrow-key expand/collapse navigation. Only `http`, `https`, and `mailto` external URLs are rendered as links.

## Current limitations

| Feature                                             | Status       | Notes                                                                                 |
| --------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------- |
| Inline password prompt                              | Not present  | Component emits `loadError({ reason: 'password' })`; consumer renders its own dialog. |
| Pinch zoom                                          | Not present  | Desktop wheel-zoom only for now.                                                      |
| Annotation layer (clickable links inside PDF pages) | Not rendered | Document-outline links are available; page annotation widgets are not.                |

## Examples

### 1. Inline gallery inside a page section (consumer provides a height)

```html
<div class="image-gallery-section" style="height: 600px;">
  <sd-preview-image [items]="myImages()" thumbnailPosition="bottom" (close)="onClose()"> </sd-preview-image>
</div>
```

### 2. Wrapped in a modal — consumer drives open/close

```html
<sd-modal #modal [title]="'Xem ảnh'" width="92vw" height="86vh">
  <sd-preview-image [items]="modalImages()" (close)="modal.close()"> </sd-preview-image>
</sd-modal>

<sd-button (click)="modalImages.set(row.attachments); modal.open()"> Xem ảnh </sd-button>
```

```ts
readonly modalImages = signal<PreviewItem[]>([]);
```

### 3. Single-image lightbox inline (no chrome)

```html
<sd-preview-image [items]="[singleImageUrl]" thumbnailPosition="none" [showToolbar]="false"> </sd-preview-image>
```

### 4. From an upload input — preview before submit

```html
<input type="file" multiple accept="image/*" (change)="onFiles($event)" />

<div style="height: 480px;">
  <sd-preview-image [items]="selectedFiles()"></sd-preview-image>
</div>
```

```ts
readonly selectedFiles = signal<PreviewItem[]>([]);

onFiles(e: Event) {
  const input = e.target as HTMLInputElement;
  this.selectedFiles.set(input.files ? Array.from(input.files) : []);
}
```

### 5. Full-page route — `/preview` takes the whole viewport

```html
<!-- preview.page.html -->
<sd-preview-image [items]="route.images()" [thumbnailPosition]="'bottom'" (close)="router.navigate(['../'], { relativeTo: route })">
</sd-preview-image>
```

```scss
:host {
  display: block;
  height: 100vh;
}
```

### 6. React to navigation / error / download events

```html
<sd-preview-image
  [items]="gallery()"
  (activeIndexChange)="onSlideChanged($event)"
  (imageError)="logBrokenImage($event)"
  (download)="trackDownload($event)">
</sd-preview-image>
```

## Anti-patterns

- DON'T forget to give the parent container a height — without it the component collapses to `min-height: 320px`.
- DON'T pass PDF / non-image URLs — fetched as `<img>` they show as broken; non-image `File`s are dropped silently.
- DON'T try to call an `open()` method — it no longer exists. Set `[items]` to a non-empty array instead.
- DON'T `close.emit()` and expect the component to hide itself — the component never owns its own visibility. Consumer must react to the `close` output (set a signal, call `modal.close()`, navigate away).
- DON'T mix `thumbnailPosition="dots"` with > 20 images — dots become illegible. Switch to `bottom`.
- DON'T mount one `<sd-preview-image>` per row in a list — declare ONE in the page and swap `[items]`.

## Related

- `<sd-modal>` — optional chrome host when you want overlay + focus trap
- `<sd-side-drawer>` — alternative chrome host for compare-style workflows
- `<sd-preview-pdf>` — sibling component for PDF documents (see below)
- `<sd-document-builder>` — for Word / Excel previews
- `<sd-button>` — typically used by callers to update `items()`

---

# `<sd-preview-pdf>`

**Type**: Component
**Selector**: `sd-preview-pdf`
**Import path**: `@sdcorejs/angular/components/preview` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdPreviewPdf`
**Standalone**: yes
**Change detection**: `OnPush` (signal-driven)

## One-line purpose

Dark-themed PDF document viewer — same self-contained surface contract as `<sd-preview-image>`: sizes to its container, the consumer decides whether to wrap it in a modal, drawer, or page section. Loads via the `[source]` signal input (URL / `File` / `Blob` / `ArrayBuffer` / `Uint8Array` / options-object) and renders pages to a `<canvas>` using `pdfjs-dist` 4.x.

## When to use

- Preview a contract / invoice / report from a list, table, or attachment row
- Inline document viewer in a CRUD detail panel
- Inside an `<sd-side-drawer>` for compare-view workflows
- Full-page lightbox route (`/preview-pdf/:id`)
- Previewing a user-selected `File` before upload

## When NOT to use

- For images → use `<sd-preview-image>`
- For Word / Excel → not supported (use `<sd-document-builder>`)
- For password-protected PDFs that need an inline password prompt — this commit emits `loadError({ reason: 'password' })` only; consumer must render their own password dialog

## Sizing

Same as `<sd-preview-image>` — `display: block; width: 100%; height: 100%; min-height: 320px`. Parent must give it a height (explicit `height`, flex `flex: 1`, grid row, or `<sd-modal>` body). Falls back to 320px floor otherwise.

## Inputs

| Name           | Type                                  | Default        | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------- | ------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `autoId`       | `string \| null \| undefined`         | `undefined`    | E2E test hook. Computed prefix `components-preview-pdf-{autoId}`. Derived child autoIds: `-first`, `-prev`, `-next`, `-last`, `-page-input`, `-zoom-in`, `-zoom-out`, `-zoom-readout`, `-fit-page`, `-fit-width`, `-rotate`, `-scroll-mode`, `-search`, `-print`, `-download`, `-fullscreen`, `-sidebar-toggle`, `-tab-{thumbnails\|outline\|search}`, `-search-{input\|next\|prev\|case\|whole\|close}`, `-retry`, `-thumb-{i}`, `-result-{i}`. |
| `source`       | `PdfSource \| null`                   | `null`         | URL string, `File`, `Blob`, `ArrayBuffer`, `Uint8Array`, `{url, httpHeaders?, withCredentials?}`, or `{data}`. Setting a new source destroys the previous document and revokes viewer-created object URLs; caller-owned source URLs are never revoked.                                                                                                                                                                                           |
| `title`        | `string \| undefined`                 | `undefined`    | Overrides the header filename (otherwise inferred from URL / `File.name`).                                                                                                                                                                                                                                                                                                                                                                       |
| `startPage`    | `number`                              | `1`            | Initial page on load. Clamped to `[1, numPages]`.                                                                                                                                                                                                                                                                                                                                                                                                |
| `initialZoom`  | `PdfZoomMode`                         | `'page-fit'`   | Number (1 = 100%), `'page-fit'`, `'page-width'`, `'page-actual'`.                                                                                                                                                                                                                                                                                                                                                                                |
| `sidebar`      | `PdfSidebarMode`                      | `'thumbnails'` | `'thumbnails'`, recursive document `'outline'`, full-document `'search'`, or `'none'` (collapse).                                                                                                                                                                                                                                                                                                                                                |
| `sidebarOpen`  | `boolean`                             | `true`         | Whether the sidebar is initially expanded. User can toggle via the hamburger button.                                                                                                                                                                                                                                                                                                                                                             |
| `scrollMode`   | `PdfScrollMode`                       | `'page'`       | `'page'` or virtualized `'continuous'`. Continuous mode renders the visible pages plus a one-page buffer.                                                                                                                                                                                                                                                                                                                                        |
| `showToolbar`  | `boolean`                             | `true`         | Bottom floating toolbar visibility.                                                                                                                                                                                                                                                                                                                                                                                                              |
| `downloadable` | `boolean`                             | `true`         | Show download when supported. `downloadFile()` is the void UI wrapper; `downloadFileAsync()` is awaitable.                                                                                                                                                                                                                                                                                                                                       |
| `password`     | `string \| undefined`                 | `undefined`    | Forwarded to pdfjs when set. If still wrong, fires `loadError({ reason: 'password' })`.                                                                                                                                                                                                                                                                                                                                                          |
| `httpHeaders`  | `Record<string, string> \| undefined` | `undefined`    | Auth headers for URL sources. Object-form source's `httpHeaders` wins.                                                                                                                                                                                                                                                                                                                                                                           |
| `theme`        | `'dark' \| 'light'`                   | `'dark'`       | Color scheme. Drives `[data-theme]` on the host element; SCSS swaps token values via `:host([data-theme="light"])`. The light variant inherits `--sd-primary`, `--sd-error`, `--sd-success` from consumer theme tokens (falls back to sensible defaults when those vars are undefined). Search-highlight tokens stay yellow across both themes to remain readable on the white PDF page.                                                         |

## Outputs

| Name           | Type                                  | Notes                                                                                                                                                                                                                       |
| -------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `close`        | `void`                                | Fires only when the consumer calls `requestClose()` programmatically. **The component has no built-in close button and does NOT auto-close on Esc** — wrap it in a modal or page section that owns its own dismiss control. |
| `loaded`       | `{ totalPages, meta }`                | Fires once per successful load.                                                                                                                                                                                             |
| `pageChange`   | `number`                              | New active page number.                                                                                                                                                                                                     |
| `zoomChange`   | `number`                              | New numeric zoom after a render.                                                                                                                                                                                            |
| `download`     | `{ filename }`                        | After `downloadFile()` triggers the anchor click.                                                                                                                                                                           |
| `loadError`    | `{ reason, message? }`                | `reason` is one of `'invalid' \| 'password' \| 'network' \| 'unknown'`.                                                                                                                                                     |
| `searchChange` | `{ term, total, current, truncated }` | Fires whenever search state changes. `current` is 1-based and `0` when no result is focused; `truncated` reports the bounded-result cap.                                                                                    |

## Public methods (called via template ref / `viewChild`)

| Method                                                                     | Notes                                                                                                                                                                                                                                                   |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `goToPage(n)` / `nextPage()` / `prevPage()` / `firstPage()` / `lastPage()` | Page navigation. Clamped to `[1, numPages]`.                                                                                                                                                                                                            |
| `zoomIn()` / `zoomOut()`                                                   | ±10% per call, clamped to `[25%, 400%]`.                                                                                                                                                                                                                |
| `setZoom(mode)`                                                            | Accepts a number or `'page-fit'` / `'page-width'` / `'page-actual'`.                                                                                                                                                                                    |
| `rotate('left' \| 'right')`                                                | ±90° per call, wraps at 360.                                                                                                                                                                                                                            |
| `toggleSidebar()` / `setSidebarMode(mode)`                                 | Sidebar UI.                                                                                                                                                                                                                                             |
| `setScrollMode(mode)`                                                      | Switch between single-page and virtualized continuous rendering.                                                                                                                                                                                        |
| `downloadFile()` / `downloadFileAsync()`                                   | Download the active source. Public URLs require anchor-download support; byte sources and authenticated/options URLs also require Blob/object-URL support. Generated object URLs are revoked on the next safe frame. Repeated requests are latest-wins. |
| `activateSearchResult(index)`                                              | Activate and navigate to a sidebar search result, update its counter/style, and emit `searchChange`.                                                                                                                                                    |
| `toggleFullscreen()`                                                       | Browser Fullscreen API on the host element.                                                                                                                                                                                                             |
| `requestClose()`                                                           | Programmatic dismiss — emits `close`. There is no built-in UI button bound to this; consumer owns its own dismiss control.                                                                                                                              |
| `retryLoad()`                                                              | Re-runs the active source through `getDocument` (used by the error state retry button).                                                                                                                                                                 |
| `search(term, { caseSensitive?, wholeWord? })`                             | NFC-normalized, Unicode-aware full-document search. Resolves to the bounded count and exposes `searchTruncated()`; superseded calls are serialized and coalesced to the latest pending query.                                                           |
| `searchNext()` / `searchPrev()`                                            | Cycle through results; wrap at boundaries. Jumps the page automatically.                                                                                                                                                                                |
| `clearSearch()`                                                            | Reset search state. Re-emits `searchChange` with `total: 0`.                                                                                                                                                                                            |
| `openSearch()` / `closeSearch()`                                           | Toggle the search bar; `closeSearch()` also clears results.                                                                                                                                                                                             |
| `toggleSearchCaseSensitive()` / `toggleSearchWholeWord()`                  | Flip the matching options. Re-runs the active term automatically.                                                                                                                                                                                       |
| `printFile()` / `print()`                                                  | Start a managed browser print job from cloned PDF bytes. A replacement source, repeated print, or component destruction cancels the active job.                                                                                                         |

## Keyboard (host-scoped via `@HostListener`)

| Key                                               | Action                                                                                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `←` / `PageUp`                                    | `prevPage()`                                                                                                                    |
| `→` / `PageDown`                                  | `nextPage()`                                                                                                                    |
| `Home` / `End`                                    | `firstPage()` / `lastPage()`                                                                                                    |
| `+` / `=`                                         | `zoomIn()`                                                                                                                      |
| `-`                                               | `zoomOut()`                                                                                                                     |
| `0`                                               | `setZoom('page-fit')`                                                                                                           |
| `r` / `R`                                         | `rotate('right' / 'left')`                                                                                                      |
| `f`                                               | `toggleFullscreen()`                                                                                                            |
| `Ctrl/Cmd + F`                                    | `openSearch()` — focuses the search bar input                                                                                   |
| `Ctrl/Cmd + P`                                    | Starts the managed print flow when a document is ready.                                                                         |
| `Enter` / `F3` (search input focused)             | `searchNext()`                                                                                                                  |
| `Shift+Enter` / `Shift+F3` (search input focused) | `searchPrev()`                                                                                                                  |
| `Esc`                                             | Closes the search bar when open (and clears results). Otherwise **no-op** — the component never emits `close` from a keystroke. |

The host has `tabindex="0"` and auto-focuses on first render so keyboard works immediately.

## Mouse / wheel

- **Ctrl/Cmd + wheel** on stage: zoom in/out anchored at cursor.
- **Plain wheel**: native scroll (the stage scrolls when zoomed in).
- **Page input** in the toolbar: type a number + Enter to jump. Invalid / out-of-range values snap back to the current page on blur.

## Browser integration and lifecycle

All browser capabilities live behind injectable adapters. `SD_PDF_BROWSER_ADAPTER` owns DOM, fullscreen, resize/intersection observation, object URLs, and animation frames. `SD_PDF_PRINT_ADAPTER` owns the hidden print frame and its `afterprint`, error, timeout, and cancellation cleanup. Printing requires both object-URL creation and revocation; cleanup steps are isolated so a host exception cannot prevent the print job from settling. Override either token in tests or a non-standard host without changing viewer logic.

Every source change invalidates active load, metadata, outline, search, download, thumbnail, page-render, continuous-render, and print work. Typed-array inputs and print/download bytes are cloned before crossing an async boundary. Server-side rendering returns the empty state without resolving PDF.js or touching browser globals. Unsupported print, download, and fullscreen actions are omitted and their public methods remain inert. URL-download and Blob/object-URL capabilities are detected independently so a plain public URL can remain downloadable on a platform that cannot synthesize a Blob URL.

Continuous mode keeps estimated heights in a Fenwick index: point measurements, prefix offsets, and offset-to-page lookups remain logarithmic instead of rebuilding every page offset. Only the visible range plus one page on either side is mounted. Measured heights replace estimates without losing the viewport anchor. The viewport midpoint determines `activePage`, and page-change output is de-duplicated.

Thumbnail rendering is virtualized to a 48-row window, so even a 10,000-page document has bounded sidebar DOM. Its PNG LRU retains at most 96 entries, while a four-slot scheduler bounds unresolved page acquisition and rendering across rapid window changes; queued work is pruned to mounted pages (`thumbnailWorkCount()` exposes the current diagnostic size). Search stores at most 1,000 matches and keeps at most 128 page-text entries in its LRU (`pageTextCacheSize()` exposes the current diagnostic size). Only one page-text scan may extract at a time, and repeated live-search calls coalesce to the newest pending query. Each scan uses bounded snapshot/staging maps and commits only after successful completion, avoiding sequential eviction cascades without retaining every page. Search reports `truncated` in the signal, state snapshot, event, counter, and localized status. The sidebar and search disclosure buttons expose `aria-expanded` plus stable `aria-controls` targets. Canvas backing stores are capped at 8,192 pixels per dimension and 16,777,216 pixels total while CSS preserves the logical page size.

Outline destinations support direct page indices, named destinations, and PDF reference objects. Traversal detects cycles against the current ancestor path, allowing a shared DAG node to appear beneath each parent, while globally capping depth at 64 and rendered nodes at 10,000. It preserves safe partial rows when destinations are invalid. The exported `PdfOutlineItem` remains recursive; the UI exposes ARIA tree semantics and standard arrow-key expand/collapse navigation. Only `http`, `https`, and `mailto` external URLs are rendered as links.

## Current limitations

| Feature                                             | Status       | Notes                                                                                 |
| --------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------- |
| Inline password prompt                              | Not present  | Component emits `loadError({ reason: 'password' })`; consumer renders its own dialog. |
| Pinch zoom                                          | Not present  | Desktop wheel-zoom only for now.                                                      |
| Annotation layer (clickable links inside PDF pages) | Not rendered | Document-outline links are available; page annotation widgets are not.                |

## PDF.js worker setup

The component imports pdfjs-dist ESM and registers the worker via:

```ts
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
```

This works with modern bundlers (esbuild / webpack / vite) that understand `import.meta.url`-based asset references. If your bundler can't resolve the worker, **set `workerSrc` manually before the first source is loaded**:

```ts
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/pdf.worker.min.mjs';
```

The worker is also exposed as a DI token (`SD_PDFJS_LIB`) for unit tests — see the `*.spec.ts` for the mock pattern.

## Examples

### 1. Simple URL preview inline

```html
<div style="height: 600px;">
  <sd-preview-pdf [source]="row.contractUrl" (close)="onClose()" (loaded)="trackOpen($event)"> </sd-preview-pdf>
</div>
```

### 2. From a file picker

```html
<input type="file" accept="application/pdf" (change)="onPick($event)" />

<div style="height: 600px;">
  <sd-preview-pdf [source]="picked()"></sd-preview-pdf>
</div>
```

```ts
readonly picked = signal<PdfSource | null>(null);
onPick(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0] ?? null;
  this.picked.set(f);
}
```

### 3. Auth-gated URL with custom headers

```html
<sd-preview-pdf [source]="secureSrc()"></sd-preview-pdf>
```

```ts
readonly secureSrc = signal<PdfSource | null>(null);

open(id: string) {
  this.secureSrc.set({
    url: `/api/documents/${id}/download`,
    httpHeaders: { Authorization: `Bearer ${this.token}` },
    withCredentials: true,
  });
}
```

### 4. Wrapped in a modal

```html
<sd-modal #modal title="Xem hợp đồng" width="92vw" height="86vh">
  <sd-preview-pdf [source]="modalSrc()" (close)="modal.close()"> </sd-preview-pdf>
</sd-modal>
```

### 5. Listen to events

```html
<sd-preview-pdf
  [source]="src()"
  (loaded)="onLoaded($event)"
  (pageChange)="trackPage($event)"
  (download)="logDownload($event)"
  (loadError)="onErr($event)">
</sd-preview-pdf>
```

## Anti-patterns

- DON'T forget to give the parent a height — the component will fall back to `min-height: 320px` (cramped).
- DON'T expect `Esc` to close — bind your own dismiss if you embed without a modal.
- DON'T pass non-PDF sources — they'll resolve to a `loadError({ reason: 'invalid' })`.
- DON'T mount one viewer per row in a list — declare ONE per page and swap `[source]`.
- DON'T intercept `Ctrl/Cmd+P` globally while the focused viewer is ready — the component owns that shortcut and cancels its managed print job on replacement or teardown.

## Related

- `<sd-preview-image>` — sibling component for images
- `<sd-modal>` / `<sd-side-drawer>` — optional chrome hosts
- `<sd-document-builder>` — for non-PDF documents (Word / Excel)
