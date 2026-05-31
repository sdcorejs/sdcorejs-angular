# `<sd-preview-image>`

**Type**: Component
**Selector**: `sd-preview-image`
**Import path**: `@sdcorejs/angular/components/preview` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdPreviewImage`
**Standalone**: yes (default)
**Change detection**: `OnPush` (signal-driven)
**Library version**: `@sdcorejs/angular@19.0.0-beta.93`

---

## One-line purpose
Dark-themed, fullscreen-capable image gallery viewer — opens a modal showing a stage image with zoom / rotate / download, plus a flexible thumbnail strip (bottom / right / left / top / dots / none) so users can flip through a list of files or CDN URLs.

## When to use
- "Xem ảnh" preview launched from a list / table / attachment row
- Showing already-uploaded images on a CRUD detail screen
- Previewing image `File` objects the user just selected (before upload)
- Single-image lightbox (use `thumbnailPosition="none"`)
- Carousel-style preview for ≤ 8 images (use `thumbnailPosition="dots"`)

## When NOT to use
- For PDFs, Word, Excel, or other non-image documents → not supported (non-image `File`s are silently dropped)
- For inline embeds in the page body → just use a plain `<img>` or `<sd-document-builder>`
- When you need annotation / cropping → this is a passive viewer
- When you need to show > 200 images at once → the component loads each in parallel; consider lazy pagination upstream

## Inputs

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | `string \| undefined` | `undefined` | Optional override shown only in the simplified header on empty state. The normal header always shows the active image's filename. |
| `thumbnailPosition` | `'bottom' \| 'right' \| 'left' \| 'top' \| 'dots' \| 'none'` | `'bottom'` | Where the navigator sits. `dots` swaps the strip for compact dot indicators (≤ 8 images). `none` removes the navigator entirely. |
| `showToolbar` | `boolean` | `true` | Bottom floating toolbar (zoom %, rotate, fit, download, fullscreen). |
| `allowDownload` | `boolean` | `true` | Show the download button + bind `d` key. |
| `allowZoom` | `boolean` | `true` | Enable wheel-zoom, pinch-zoom, `+` / `-` / `0` keys, and the zoom buttons. |
| `backdrop` | `'dark' \| 'light'` | `'dark'` | Dark = photo-viewer default. Light = embed inside a brighter context. |
| `loop` | `boolean` | `true` | Whether ←/→ wraps at the ends. |

> All inputs use signal inputs (`input(...)`); read them as `myComponent.thumbnailPosition()` from outside.

## Outputs

| Name | Type | Notes |
| --- | --- | --- |
| `close` | `void` | Emitted after the underlying modal closes AND blob URLs have been revoked. |
| `activeIndexChange` | `number` | Emitted whenever the active slide changes (nav arrow, thumbnail, swipe, ← / →). |
| `download` | `{ index: number; item: NormalizedImage }` | Emitted after `downloadCurrent()` triggers the download anchor click. |
| `imageError` | `{ index: number; reason: string }` | Emitted when an image renders broken (404, CORS, malformed blob). The stage automatically switches to the error artboard. |

## Public API (called via template ref / `viewChild`)

| Method | Signature | Notes |
| --- | --- | --- |
| `open` | `(items: PreviewItem[] \| null \| undefined, options?: { startIndex?: number }) => Promise<void>` | Loads items, opens the modal, resets transform. Re-entrant: revokes previously-created blob URLs first. |
| `onClickThumbnailImage` | `(index: number) => void` | Jump to a specific slide. |
| `updateCurrentImage` | `(direction: 1 \| -1) => void` | Step forward / backward (wraps when `loop` is true). |
| `zoomIn` / `zoomOut` | `() => void` | ±10% per call, clamped to [25%, 400%]. |
| `fitToScreen` | `() => void` | Reset zoom + rotation + pan. |
| `rotate` | `(direction: 'left' \| 'right') => void` | ±90° per call. |
| `downloadCurrent` | `() => void` | Download the active image via an `<a download>` anchor. |
| `toggleFullscreen` | `() => void` | Browser Fullscreen API on the viewer shell. |
| `retryActive` | `() => Promise<void>` | Re-fetch the active image from its CDN URL (Artboard G's "Thử lại" button). |

## `PreviewItem` shape

```ts
type PreviewItem =
  | string                      // CDN / HTTP URL
  | File                        // image/* only — non-image files are dropped silently
  | {
      url?: string;
      file?: File;
      name?: string;            // override filename shown in header
      caption?: string;         // optional caption below image
      alt?: string;             // a11y override
      mime?: string;            // hint for filtering / icon
    };
```

## Visual cues (helps agent map screenshots → component)

The component has **8 distinct visual states** (Artboards A–H from the design handoff):

| Artboard | State | Visual signature |
| --- | --- | --- |
| **A** | Default (`thumbnailPosition: 'bottom'`) | Dark `#0d0e10` shell. 68px header with `image` icon + filename + counter pill + close button. Stage with checkerboard pattern, 48px round nav arrows (`chevron_left` / `chevron_right`), floating bottom toolbar. 116px horizontal thumb strip on `#17191c`. |
| **B** | Zoomed (`zoom > 100%`) | Same as A but image has `transform: scale(...)`, cursor changes to `grab` / `grabbing`. Zoom readout in toolbar shows current %. |
| **C** | Right vertical strip (`thumbnailPosition: 'right'`) | Two-column layout, stage left, 152px-wide column of thumbs on the right. Each thumb shows filename overlay in a bottom gradient. |
| **D** | Dots indicator (`thumbnailPosition: 'dots'`) | No thumb strip. Stage is full-height. Dot row absolute at `bottom: 24px`. Active dot grows to a 24×8 pill. |
| **E** | Minimal (`thumbnailPosition: 'none'`, `showToolbar: false`) | Single-image lightbox. No thumb strip, no bottom toolbar. Just header + stage. |
| **F** | Loading (`stage = 'loading'`) | 56×56 circular spinner + "Đang tải ảnh..." label. |
| **G** | Error (`stage = 'error'`) | 96×96 rounded-24 danger tile with `broken_image` icon + "Không tải được ảnh" + retry button (`refresh` icon, accent background). |
| **H** | Empty (`images.length === 0`) | 96×96 rounded-24 muted tile with `image_not_supported` icon + "Không có thông tin ảnh". Header simplified. |

### Recurring elements

- **Header counter pill**: rounded, `tabular-nums`, absolutely centered between left meta and right close
- **Nav arrows**: 48×48 round, `rgba(20,20,22,0.6)` + `backdrop-filter: blur(10px)`, `chevron_left` / `chevron_right` icons, disabled state at 35% opacity
- **Floating toolbar**: pill-shaped container, 6×8 padding, divider lines between zoom group / fit / rotate / download+fullscreen group
- **Active thumbnail**: `outline: 2px solid #3b82f6` + inset shadow (uses outline so the thumb doesn't resize on activate)
- **Keyboard hint**: top-left of stage, `<kbd>`-style chips for ← → Esc
- **Caption**: when `PreviewItem.caption` is set, a rounded pill `rgba(15,17,20,0.7)` above the bottom toolbar

## Interactions

### Keyboard (only when modal is open)

| Key | Action |
| --- | --- |
| `←` | Previous image |
| `→` | Next image |
| `Esc` | Close |
| `+` / `=` | Zoom in (when `allowZoom`) |
| `-` | Zoom out (when `allowZoom`) |
| `0` | Fit to screen |
| `r` | Rotate right |
| `R` (Shift+r) | Rotate left |
| `f` | Toggle fullscreen |
| `d` | Download (when `allowDownload`) |

### Mouse / Pointer

- **Wheel** on stage: zoom in / out (anchored on cursor, ±10% per tick).
- **Click + drag** when zoomed > 100%: pan via `transform: translate(...)`.
- **Click + drag** when zoom ≤ 100%: horizontal swipe ≥ 40 px → next / previous slide.
- **Double-click** on stage: toggle between 100% and 200%.
- **Two-finger pinch**: pinch-zoom (touch + trackpad).
- **Click thumbnail**: jump to slide; the strip auto-scrolls to keep the active thumb in view.

### Memory

Every blob URL created by the component is tracked in an internal `Set<string>` and revoked on:
1. `open()` re-entrancy (before populating new items)
2. Modal close
3. `ngOnDestroy`

CDN strings passed in by the caller are NOT revoked — the component owns only the blobs it itself created via `URL.createObjectURL`.

## Examples

### 1. Simple gallery from CDN URLs

```html
<sd-preview-image #preview (close)="onPreviewClosed()"></sd-preview-image>

<sd-button
  type="link" color="primary" prefixIcon="image"
  title="Xem ảnh"
  (click)="preview.open(row.attachmentUrls)">
</sd-button>
```

### 2. Single-image lightbox (no thumbnails, no toolbar)

```html
<sd-preview-image
  #preview
  thumbnailPosition="none"
  [showToolbar]="false">
</sd-preview-image>

<sd-button (click)="preview.open([row.avatarUrl])">Xem ảnh đại diện</sd-button>
```

### 3. Gallery with custom captions and starting index

```ts
const items: PreviewItem[] = projectPhotos.map(p => ({
  url: p.cdnUrl,
  name: p.fileName,
  caption: p.takenAt + ' · ' + p.locationName,
  alt: p.altText,
}));

this.preview.open(items, { startIndex: 2 });
```

### 4. From an upload input — preview before submit

```html
<sd-preview-image #preview></sd-preview-image>

<input
  type="file"
  multiple
  accept="image/*"
  (change)="preview.open($any($event.target).files ? Array.from($any($event.target).files) : [])" />
```

### 5. Carousel-style with dots indicator (≤ 8 images)

```html
<sd-preview-image
  #preview
  thumbnailPosition="dots"
  [loop]="true">
</sd-preview-image>

<sd-button (click)="preview.open(heroSlides)">Xem hero gallery</sd-button>
```

### 6. React to navigation / error / download events

```html
<sd-preview-image
  #preview
  (activeIndexChange)="onSlideChanged($event)"
  (imageError)="logBrokenImage($event)"
  (download)="trackDownload($event)">
</sd-preview-image>
```

## Anti-patterns

- ❌ Creating one `<sd-preview-image>` per row — declare ONE in the page and call `.open(...)` per click.
- ❌ Passing PDF / non-image URLs — fetched as `<img>` they show as broken; non-image `File`s are dropped silently.
- ❌ Trying to bind `[images]` directly — there is no `images` input, always use `open(...)`.
- ❌ Calling `open()` from inside `ngOnInit` of a component that may be destroyed before the modal opens — the in-flight blob fetches will still resolve and leak handles. Gate on user interaction.
- ❌ Reading `activeImage()` from outside the template — it's a computed signal; use the `activeIndexChange` output instead.
- ❌ Mixing `thumbnailPosition="dots"` with > 20 images — dots become illegible. Switch to `bottom`.

## Related
- `<sd-modal>` — chrome host (backdrop + focus trap + escape-to-close)
- `<sd-document-builder>` — for PDFs / Word / Excel previews
- `<sd-button>` — used by callers to trigger `.open(...)`
