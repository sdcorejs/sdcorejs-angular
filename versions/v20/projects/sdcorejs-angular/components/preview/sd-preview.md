# `<sd-preview-image>`

**Type**: Component
**Selector**: `sd-preview-image`
**Import path**: `@sdcorejs/angular/components/preview` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdPreviewImage`
**Standalone**: yes (default)
**Change detection**: `OnPush` (signal-driven)

---

## One-line purpose
Dark-themed, fullscreen-capable image gallery viewer â€” a self-contained surface that **sizes to its container** (`width: 100%; height: 100%;`, like `<sd-table>`). The consumer decides whether to embed it inline, wrap it in `<sd-modal>`, `<sd-side-drawer>`, or hand it a full page. The component itself has zero knowledge of the chrome around it.

## When to use
- "Xem áº£nh" preview launched from a list / table / attachment row (consumer wraps in `<sd-modal>`)
- Inline image gallery in a CRUD detail panel (just drop into a sized container)
- Inside an `<sd-side-drawer>` for compare-view workflows
- Full-page lightbox route (`/preview/:id`) â€” pass the whole `<router-outlet>` area
- Previewing image `File` objects the user just selected (before upload)
- Single-image lightbox (use `thumbnailPosition="none"`)
- Carousel with dots indicator for â‰¤ 8 images (use `thumbnailPosition="dots"`)

## When NOT to use
- For PDFs, Word, Excel, or other non-image documents â†’ not supported (non-image `File`s are silently dropped)
- When you need annotation / cropping â†’ this is a passive viewer
- When you need to show > 200 images at once â†’ component loads each in parallel; consider lazy pagination upstream
- For inline embeds where you only need ONE image with no chrome â†’ just use a plain `<img>`

## Sizing â€” the most important rule

The component renders `display: block; width: 100%; height: 100%; min-height: 320px;`. **Its parent must give it a height** (explicit `height`, flexbox `flex: 1`, grid row, or `<sd-modal>` body which already provides one). If the parent has no height and no flex constraint, the component falls back to its `min-height: 320px` floor â€” usable but cramped.

In fullscreen mode (`toggleFullscreen()` or `f` key) the component requests the browser Fullscreen API on **its own host element** and grows to `100vw Ã— 100vh` with square corners.

## Inputs

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `autoId` | `string \| null \| undefined` | `undefined` | E2E test hook. Computed prefix `components-preview-image-{autoId}`. Derived child autoIds: `-prev`, `-next`, `-zoom-in`, `-zoom-out`, `-fit`, `-rotate`, `-download`, `-fullscreen`, `-retry`, `-thumb-{i}`, `-dot-{i}`. |
| `items` | `PreviewItem[]` | `[]` | **Signal input â€” declarative.** Each change normalizes the list (fetches strings â†’ blob, filters non-image `File`s, builds internal `NormalizedImage[]`). Re-entrant: old blob URLs are revoked before re-loading. |
| `startIndex` | `number` | `0` | Which slot to focus first on a fresh `items` push. Clamped to `[0, items.length-1]`. |
| `title` | `string \| undefined` | `undefined` | Optional override shown only in the simplified header on empty state. The normal header always shows the active image's filename. |
| `thumbnailPosition` | `'bottom' \| 'right' \| 'left' \| 'top' \| 'dots' \| 'none'` | `'bottom'` | Where the navigator sits. `dots` swaps the strip for compact dot indicators (â‰¤ 8 images). `none` removes the navigator entirely. |
| `showToolbar` | `boolean` | `true` | Bottom floating toolbar (zoom %, rotate, fit, download, fullscreen). |
| `downloadable` | `boolean` | `true` | Show the download button + bind `d` key. |
| `zoomable` | `boolean` | `true` | Enable wheel-zoom, pinch-zoom, `+` / `-` / `0` keys, and the zoom buttons. |
| `loop` | `boolean` | `true` | Whether â†/â†’ wraps at the ends. |
| `theme` | `'dark' \| 'light'` | `'dark'` | Color scheme. Drives `[data-theme]` on the host element; SCSS swaps token values via `:host([data-theme="light"])`. The light variant inherits `--sd-primary`, `--sd-error`, `--sd-success` from consumer theme tokens (falls back to sensible defaults when those vars are undefined). |

> All inputs use signal inputs (`input(...)`); read them as `myComponent.thumbnailPosition()` from outside.
> Theme switching is purely declarative â€” toggling `theme()` re-paints via CSS variables; no runtime style mutation. Per-instance overrides still work by writing the same `--sd-preview-*` custom properties on a wrapping element.

## Outputs

| Name | Type | Notes |
| --- | --- | --- |
| `close` | `void` | Emitted when the consumer programmatically calls `requestClose()` (e.g. from their own dismiss button). The component does NOT bind `Esc` to this output â€” when wrapped in `<sd-modal>` the modal already handles Esc; for standalone embeds the consumer wires their own dismiss control. **The component never closes itself** â€” it just emits this intent. |
| `activeIndexChange` | `number` | Emitted whenever the active slide changes (nav arrow, thumbnail, swipe, â† / â†’). |
| `download` | `{ index: number; item: NormalizedImage }` | Emitted after `downloadCurrent()` triggers the download anchor click. |
| `imageError` | `{ index: number; reason: string }` | Emitted when an image renders broken (404, CORS, malformed blob). The stage automatically switches to the error artboard. |

## Public methods (called via template ref / `viewChild`)

| Method | Signature | Notes |
| --- | --- | --- |
| `onClickThumbnailImage` | `(index: number) => void` | Jump to a specific slide. |
| `updateCurrentImage` | `(direction: 1 \| -1) => void` | Step forward / backward (wraps when `loop` is true). |
| `zoomIn` / `zoomOut` | `() => void` | Â±10% per call, clamped to [25%, 400%]. |
| `fitToScreen` | `() => void` | Reset zoom + rotation + pan. |
| `rotate` | `(direction: 'left' \| 'right') => void` | Â±90Â° per call. |
| `downloadCurrent` | `() => void` | Download the active image via an `<a download>` anchor. |
| `toggleFullscreen` | `() => void` | Browser Fullscreen API **on the component host element**. |
| `retryActive` | `() => Promise<void>` | Re-fetch the active image from its CDN URL (Artboard G's "Thá»­ láº¡i" button). |
| `requestClose` | `() => void` | Programmatic equivalent of clicking the X â€” just emits the `close` output. |

> The old imperative `open(items, options?)` method **has been removed**. Push items via the `[items]` signal input instead.

## `PreviewItem` shape

```ts
type PreviewItem =
  | string                      // CDN / HTTP URL
  | File                        // image/* only â€” non-image files are dropped silently
  | {
      url?: string;
      file?: File;
      name?: string;            // override filename shown in header
      caption?: string;         // optional caption below image
      alt?: string;             // a11y override
      mime?: string;            // hint for filtering / icon
    };
```

## Visual cues (helps agent map screenshots â†’ component)

The component has **8 distinct visual states** (Artboards Aâ€“H from the design handoff):

| Artboard | State | Visual signature |
| --- | --- | --- |
| **A** | Default (`thumbnailPosition: 'bottom'`) | Dark `#0d0e10` shell. 68px header with `image` icon + filename + counter pill (centered). Stage with checkerboard pattern, 48px round nav arrows, floating bottom toolbar. 116px horizontal thumb strip on `#17191c`. |
| **B** | Zoomed (`zoom > 100%`) | Same as A but image has `transform: scale(...)`, cursor changes to `grab` / `grabbing`. Zoom readout in toolbar shows current %. |
| **C** | Right vertical strip (`thumbnailPosition: 'right'`) | Two-column layout, stage left, 152px-wide column of thumbs on the right. Each thumb shows filename overlay in a bottom gradient. |
| **D** | Dots indicator (`thumbnailPosition: 'dots'`) | No thumb strip. Stage is full-height. Dot row absolute at `bottom: 24px`. Active dot grows to a 24Ã—8 pill. |
| **E** | Minimal (`thumbnailPosition: 'none'`, `showToolbar: false`) | Single-image lightbox. No thumb strip, no bottom toolbar. Just header + stage. |
| **F** | Loading (`stage = 'loading'`) | 56Ã—56 circular spinner + "Äang táº£i áº£nh..." label. |
| **G** | Broken image (per-image error) | **Inline placeholder INSIDE the image area** â€” 96Ã—96 rounded-24 danger tile with `broken_image` icon + "KhÃ´ng táº£i Ä‘Æ°á»£c áº£nh" + retry button (`refresh` icon, accent background). Nav arrows, dots, thumbnails, and the floating toolbar **stay visible and interactive** so the user can navigate to another image. Thumbs of broken items show a small `broken_image` icon on a translucent red background. |
| **H** | Empty (`images.length === 0`) | 96Ã—96 rounded-24 muted tile with `image_not_supported` icon + "KhÃ´ng cÃ³ thÃ´ng tin áº£nh". Header simplified. |

### Recurring elements

- **Header counter pill**: rounded, `tabular-nums`, absolutely centered between left meta and right close
- **Nav arrows**: 48Ã—48 round, `rgba(20,20,22,0.6)` + `backdrop-filter: blur(10px)`, disabled state at 35% opacity
- **Floating toolbar**: pill-shaped container, 6Ã—8 padding, divider lines between zoom group / fit / rotate / download+fullscreen group
- **Active thumbnail**: `outline: 2px solid #3b82f6` + inset shadow (uses outline so the thumb doesn't resize on activate)
- **Keyboard hint**: top-left of stage, `<kbd>`-style chips for â† â†’
- **Caption**: when `PreviewItem.caption` is set, a rounded pill `rgba(15,17,20,0.7)` above the bottom toolbar

## Interactions

### Keyboard (host-scoped, not document)

The component host has `tabindex="0"` and listens to `keydown` via `@HostListener`. Shortcuts only fire when the component (or any descendant) has focus â€” they will **not** "leak" into the rest of the app when the viewer is offscreen.

| Key | Action |
| --- | --- |
| `â†` | Previous image |
| `â†’` | Next image |
| `+` / `=` | Zoom in (when `zoomable`) |
| `-` | Zoom out (when `zoomable`) |
| `0` | Fit to screen |
| `r` | Rotate right |
| `R` (Shift+r) | Rotate left |
| `f` | Toggle fullscreen |
| `d` | Download (when `downloadable`) |

The host auto-focuses itself on first render (`afterNextRender`) so keyboard shortcuts work immediately when the component appears, even when **not** wrapped in a modal.

### Mouse / Pointer

- **Wheel** on stage: zoom in / out (anchored on cursor, Â±10% per tick).
- **Click + drag** when zoomed > 100%: pan via `transform: translate(...)`.
- **Click + drag** when zoom â‰¤ 100%: horizontal swipe â‰¥ 40 px â†’ next / previous slide.
- **Double-click** on stage: toggle between 100% and 200%.
- **Two-finger pinch**: pinch-zoom (touch + trackpad).
- **Click thumbnail**: jump to slide; the strip auto-scrolls to keep the active thumb in view.

### Memory

Every blob URL created by the component is tracked in an internal `Set<string>` and revoked on:
1. `items()` input change (before populating new entries)
2. `ngOnDestroy` / `DestroyRef.onDestroy`

CDN strings passed in by the caller are NOT revoked â€” the component owns only the blobs it itself created via `URL.createObjectURL`.

## Examples

### 1. Inline gallery inside a page section (consumer provides a height)

```html
<div class="image-gallery-section" style="height: 600px;">
  <sd-preview-image
    [items]="myImages()"
    thumbnailPosition="bottom"
    (close)="onClose()">
  </sd-preview-image>
</div>
```

### 2. Wrapped in a modal â€” consumer drives open/close

```html
<sd-modal #modal [title]="'Xem áº£nh'" width="92vw" height="86vh">
  <sd-preview-image
    [items]="modalImages()"
    (close)="modal.close()">
  </sd-preview-image>
</sd-modal>

<sd-button (click)="modalImages.set(row.attachments); modal.open()">
  Xem áº£nh
</sd-button>
```

```ts
readonly modalImages = signal<PreviewItem[]>([]);
```

### 3. Single-image lightbox inline (no chrome)

```html
<sd-preview-image
  [items]="[singleImageUrl]"
  thumbnailPosition="none"
  [showToolbar]="false">
</sd-preview-image>
```

### 4. From an upload input â€” preview before submit

```html
<input
  type="file"
  multiple
  accept="image/*"
  (change)="onFiles($event)" />

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

### 5. Full-page route â€” `/preview` takes the whole viewport

```html
<!-- preview.page.html -->
<sd-preview-image
  [items]="route.images()"
  [thumbnailPosition]="'bottom'"
  (close)="router.navigate(['../'], { relativeTo: route })">
</sd-preview-image>
```

```scss
:host { display: block; height: 100vh; }
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

- DON'T forget to give the parent container a height â€” without it the component collapses to `min-height: 320px`.
- DON'T pass PDF / non-image URLs â€” fetched as `<img>` they show as broken; non-image `File`s are dropped silently.
- DON'T try to call an `open()` method â€” it no longer exists. Set `[items]` to a non-empty array instead.
- DON'T `close.emit()` and expect the component to hide itself â€” the component never owns its own visibility. Consumer must react to the `close` output (set a signal, call `modal.close()`, navigate away).
- DON'T mix `thumbnailPosition="dots"` with > 20 images â€” dots become illegible. Switch to `bottom`.
- DON'T mount one `<sd-preview-image>` per row in a list â€” declare ONE in the page and swap `[items]`.

## Related
- `<sd-modal>` â€” optional chrome host when you want overlay + focus trap
- `<sd-side-drawer>` â€” alternative chrome host for compare-style workflows
- `<sd-preview-pdf>` â€” sibling component for PDF documents (see below)
- `<sd-document-builder>` â€” for Word / Excel previews
- `<sd-button>` â€” typically used by callers to update `items()`

---

# `<sd-preview-pdf>`

**Type**: Component
**Selector**: `sd-preview-pdf`
**Import path**: `@sdcorejs/angular/components/preview` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdPreviewPdf`
**Standalone**: yes
**Change detection**: `OnPush` (signal-driven)

## One-line purpose
Dark-themed PDF document viewer â€” same self-contained surface contract as `<sd-preview-image>`: sizes to its container, the consumer decides whether to wrap it in a modal, drawer, or page section. Loads via the `[source]` signal input (URL / `File` / `Blob` / `ArrayBuffer` / `Uint8Array` / options-object) and renders pages to a `<canvas>` using `pdfjs-dist` 4.x.

## When to use
- Preview a contract / invoice / report from a list, table, or attachment row
- Inline document viewer in a CRUD detail panel
- Inside an `<sd-side-drawer>` for compare-view workflows
- Full-page lightbox route (`/preview-pdf/:id`)
- Previewing a user-selected `File` before upload

## When NOT to use
- For images â†’ use `<sd-preview-image>`
- For Word / Excel â†’ not supported (use `<sd-document-builder>`)
- For password-protected PDFs that need an inline password prompt â€” this commit emits `loadError({ reason: 'password' })` only; consumer must render their own password dialog
- For very large PDFs (> 1000 pages) â€” single-page rendering scales but thumbnails render placeholders; full thumb rendering is a follow-up

## Sizing
Same as `<sd-preview-image>` â€” `display: block; width: 100%; height: 100%; min-height: 320px`. Parent must give it a height (explicit `height`, flex `flex: 1`, grid row, or `<sd-modal>` body). Falls back to 320px floor otherwise.

## Inputs

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `autoId` | `string \| null \| undefined` | `undefined` | E2E test hook. Computed prefix `components-preview-pdf-{autoId}`. Derived child autoIds: `-first`, `-prev`, `-next`, `-last`, `-page-input`, `-zoom-in`, `-zoom-out`, `-zoom-readout`, `-fit-page`, `-fit-width`, `-rotate`, `-scroll-mode`, `-search`, `-download`, `-fullscreen`, `-sidebar-toggle`, `-tab-{thumbnails\|outline\|search}`, `-search-{input\|next\|prev\|case\|whole\|close}`, `-retry`, `-thumb-{i}`, `-result-{i}`. |
| `source` | `PdfSource \| null` | `null` | URL string, `File`, `Blob`, `ArrayBuffer`, `Uint8Array`, `{url, httpHeaders?, withCredentials?}`, or `{data}`. Setting a new source destroys the previous doc + revokes blob URLs. |
| `title` | `string \| undefined` | `undefined` | Overrides the header filename (otherwise inferred from URL / `File.name`). |
| `startPage` | `number` | `1` | Initial page on load. Clamped to `[1, numPages]`. |
| `initialZoom` | `PdfZoomMode` | `'page-fit'` | Number (1 = 100%), `'page-fit'`, `'page-width'`, `'page-actual'`. |
| `sidebar` | `PdfSidebarMode` | `'thumbnails'` | `'thumbnails'` (implemented), `'outline'` / `'search'` (deferred â€” show placeholder), `'none'` (collapse). |
| `sidebarOpen` | `boolean` | `true` | Whether the sidebar is initially expanded. User can toggle via the hamburger button. |
| `scrollMode` | `PdfScrollMode` | `'page'` | `'page'` (implemented), `'continuous'` (DEFERRED â€” falls back to single-page with a console warning). |
| `showToolbar` | `boolean` | `true` | Bottom floating toolbar visibility. |
| `downloadable` | `boolean` | `true` | Show download button + accept programmatic `downloadFile()`. |
| `password` | `string \| undefined` | `undefined` | Forwarded to pdfjs when set. If still wrong, fires `loadError({ reason: 'password' })`. |
| `httpHeaders` | `Record<string, string> \| undefined` | `undefined` | Auth headers for URL sources. Object-form source's `httpHeaders` wins. |
| `theme` | `'dark' \| 'light'` | `'dark'` | Color scheme. Drives `[data-theme]` on the host element; SCSS swaps token values via `:host([data-theme="light"])`. The light variant inherits `--sd-primary`, `--sd-error`, `--sd-success` from consumer theme tokens (falls back to sensible defaults when those vars are undefined). Search-highlight tokens stay yellow across both themes to remain readable on the white PDF page. |

## Outputs

| Name | Type | Notes |
| --- | --- | --- |
| `close` | `void` | Fires only when the consumer calls `requestClose()` programmatically. **The component has no built-in close button and does NOT auto-close on Esc** â€” wrap it in a modal or page section that owns its own dismiss control. |
| `loaded` | `{ totalPages, meta }` | Fires once per successful load. |
| `pageChange` | `number` | New active page number. |
| `zoomChange` | `number` | New numeric zoom after a render. |
| `download` | `{ filename }` | After `downloadFile()` triggers the anchor click. |
| `loadError` | `{ reason, message? }` | `reason` is one of `'invalid' \| 'password' \| 'network' \| 'unknown'`. |
| `searchChange` | `{ term, total, current }` | Fires whenever `search()`, `searchNext()`, `searchPrev()`, or `clearSearch()` updates the state. `current` is 1-based and `0` when no result is focused. |

## Public methods (called via template ref / `viewChild`)

| Method | Notes |
| --- | --- |
| `goToPage(n)` / `nextPage()` / `prevPage()` / `firstPage()` / `lastPage()` | Page navigation. Clamped to `[1, numPages]`. |
| `zoomIn()` / `zoomOut()` | Â±10% per call, clamped to `[25%, 400%]`. |
| `setZoom(mode)` | Accepts a number or `'page-fit'` / `'page-width'` / `'page-actual'`. |
| `rotate('left' \| 'right')` | Â±90Â° per call, wraps at 360. |
| `toggleSidebar()` / `setSidebarMode(mode)` | Sidebar UI. |
| `setScrollMode(mode)` | DEFERRED â€” `'continuous'` warns + no-ops. |
| `downloadFile()` | Triggers a browser download of the active source. |
| `toggleFullscreen()` | Browser Fullscreen API on the host element. |
| `requestClose()` | Programmatic dismiss â€” emits `close`. There is no built-in UI button bound to this; consumer owns its own dismiss control. |
| `retryLoad()` | Re-runs the active source through `getDocument` (used by the error state retry button). |
| `search(term, { caseSensitive?, wholeWord? })` | Full-document text search. Resolves to the result count. Re-emits `searchChange`. |
| `searchNext()` / `searchPrev()` | Cycle through results; wrap at boundaries. Jumps the page automatically. |
| `clearSearch()` | Reset search state. Re-emits `searchChange` with `total: 0`. |
| `openSearch()` / `closeSearch()` | Toggle the search bar; `closeSearch()` also clears results. |
| `toggleSearchCaseSensitive()` / `toggleSearchWholeWord()` | Flip the matching options. Re-runs the active term automatically. |
| `printFile()` | **DEFERRED** â€” no-op + console warning. |

## Keyboard (host-scoped via `@HostListener`)

| Key | Action |
| --- | --- |
| `â†` / `PageUp` | `prevPage()` |
| `â†’` / `PageDown` | `nextPage()` |
| `Home` / `End` | `firstPage()` / `lastPage()` |
| `+` / `=` | `zoomIn()` |
| `-` | `zoomOut()` |
| `0` | `setZoom('page-fit')` |
| `r` / `R` | `rotate('right' / 'left')` |
| `f` | `toggleFullscreen()` |
| `Ctrl/Cmd + F` | `openSearch()` â€” focuses the search bar input |
| `Enter` / `F3` (search input focused) | `searchNext()` |
| `Shift+Enter` / `Shift+F3` (search input focused) | `searchPrev()` |
| `Esc` | Closes the search bar when open (and clears results). Otherwise **no-op** â€” the component never emits `close` from a keystroke. |

The host has `tabindex="0"` and auto-focuses on first render so keyboard works immediately.

## Mouse / wheel

- **Ctrl/Cmd + wheel** on stage: zoom in/out anchored at cursor.
- **Plain wheel**: native scroll (the stage scrolls when zoomed in).
- **Page input** in the toolbar: type a number + Enter to jump. Invalid / out-of-range values snap back to the current page on blur.

## Deferred features (DO NOT rely on these yet)

| Feature | Status | Notes |
| --- | --- | --- |
| `outline` sidebar tab | UI placeholder | `pdfDoc.getOutline()` integration deferred. |
| Continuous scroll mode | Falls back to single-page | Virtualization (Â±1 page render window) deferred. |
| `printFile()` (and `Ctrl+P`) | No-op + warn | `@media print` CSS deferred. |
| Inline password prompt | Not present | Component emits `loadError({ reason: 'password' })`; consumer renders its own dialog. |
| Pinch zoom | Not present | Desktop wheel-zoom only for now. |
| Annotation layer (clickable links inside PDF) | Not rendered | `page.getAnnotations()` integration deferred. |

Each deferred feature is marked with a `// TODO(preview-pdf): ...` comment in the source.

## PDF.js worker setup

The component imports pdfjs-dist ESM and registers the worker via:

```ts
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();
```

This works with modern bundlers (esbuild / webpack / vite) that understand `import.meta.url`-based asset references. If your bundler can't resolve the worker, **set `workerSrc` manually before the first source is loaded**:

```ts
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/pdf.worker.min.mjs';
```

The worker is also exposed as a DI token (`SD_PDFJS_LIB`) for unit tests â€” see the `*.spec.ts` for the mock pattern.

## Examples

### 1. Simple URL preview inline

```html
<div style="height: 600px;">
  <sd-preview-pdf
    [source]="row.contractUrl"
    (close)="onClose()"
    (loaded)="trackOpen($event)">
  </sd-preview-pdf>
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
<sd-modal #modal title="Xem há»£p Ä‘á»“ng" width="92vw" height="86vh">
  <sd-preview-pdf
    [source]="modalSrc()"
    (close)="modal.close()">
  </sd-preview-pdf>
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

- DON'T forget to give the parent a height â€” the component will fall back to `min-height: 320px` (cramped).
- DON'T expect `Esc` to close â€” bind your own dismiss if you embed without a modal.
- DON'T pass non-PDF sources â€” they'll resolve to a `loadError({ reason: 'invalid' })`.
- DON'T mount one viewer per row in a list â€” declare ONE per page and swap `[source]`.
- DON'T rely on search / outline / continuous scroll yet â€” they are deferred. Use the `loaded` event's `meta` for outline information manually if you must.

## Related

- `<sd-preview-image>` â€” sibling component for images
- `<sd-modal>` / `<sd-side-drawer>` â€” optional chrome hosts
- `<sd-document-builder>` â€” for non-PDF documents (Word / Excel)

