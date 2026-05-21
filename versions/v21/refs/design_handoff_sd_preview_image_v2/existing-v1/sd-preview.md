# `<sd-preview-image>`

**Type**: Component
**Selector**: `sd-preview-image`
**Import path**: `@sdcorejs/angular/components/preview` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdPreviewImage`
**Standalone**: yes (default)
**Change detection**: `OnPush`
**Library version**: `@sdcorejs/angular@19.0.0-beta.86`

## One-line purpose
Modal image gallery viewer â€” opens a `<sd-modal>` showing a main image plus a side strip of thumbnails so the user can flip through a list of files / URLs (uploaded images, attachments, CDN-hosted photos, ...).

## When to use
- "Xem áº£nh" preview launched from a list/table/attachment row
- Showing already-uploaded images during a CRUD detail screen
- Previewing image `File` objects the user just selected (before upload)
- Showing a CDN-hosted gallery (URL strings) with prev/next navigation
- As a reusable popup â€” keep ONE instance in the page and call `open(...)` with different arrays

## When NOT to use
- For PDFs, Word, Excel, or other non-image documents â†’ not supported (component filters non-image File types out)
- For inline embeds in the page body â†’ just use a plain `<img>` or `<sd-document-builder>` viewer instead
- When you need annotation, zoom, crop â†’ this is a passive viewer only
- For single-image lightbox without thumbnails â†’ still works, but feels heavy; an `<sd-modal>` with a plain `<img>` is simpler

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| _none as `@Input`_ | â€” | â€” | Image list is passed at runtime via the `open(urlOrFiles)` method (see API). |

> Internal fields `title` (`'Xem áº£nh'`), `thumbnailPosition` (`'right'`), `activeIndex` (`0`), `images` are public on the class but are not Angular `@Input`s â€” they are not bound from the template.

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `close` | `EventEmitter<void>` | Fires when the underlying `<sd-modal>` is closed (either by close button or backdrop). Use to reset selection state in the parent. |

## Public API (called via `@ViewChild`)
| Method | Signature | Notes |
| --- | --- | --- |
| `open` | `(urlOrFiles: (string \| File)[] \| undefined \| null) => Promise<void>` | Loads images and opens the modal. URL strings are fetched as blobs; File items must have `type` starting with `image/` (others are silently filtered). Resets `activeIndex` to 0. |
| `onClickThumbnailImage` | `(index: number) => void` | Programmatically focus a thumbnail. |
| `updateCurrentImage` | `(direction: 1 \| -1) => void` | Step forward / backward through the images, wrapping around. Also auto-scrolls thumbnail strip into view. |

## Content projection
None. The modal's title is fixed to `'Xem áº£nh'` and the gallery layout is not customizable through slots.

## Visual cues (helps agent map screenshots â†’ component)
- Sits inside an `<sd-modal>` (centered, full-page modal with header bar and close button)
- Two-column layout when images exist:
  - Left/right strip (`thumbnail-container`) of square thumbnails, each ~50â€“60px, scrollable vertically; the active thumbnail has a 2px solid `#2962ff` (blue) border, others have no border
  - Main pane (`main-image-container`) showing the active image, scaled to fit (`fill`), with two overlay nav buttons:
    - `arrow_back_ios_new` icon button on the left (`back-icon`)
    - `arrow_forward_ios` icon button on the right (`next-icon`)
- Empty state: vertically-centered `icon-no-image` glyph + label "KhÃ´ng cÃ³ thÃ´ng tin áº£nh"
- 8px gap between thumbnail strip and main image; outer padding `p-16`

## Examples

### 1. Preview a list of CDN URLs
```html
<sd-preview-image #imagePreview (close)="onPreviewClosed()"></sd-preview-image>

<sd-button
  type="link" color="primary" prefixIcon="image"
  title="Xem áº£nh"
  (click)="imagePreview.open(row.attachmentUrls)">
</sd-button>
```

### 2. Preview just-selected `File` objects from an upload input
```html
<sd-preview-image #preview></sd-preview-image>

<input type="file" multiple accept="image/*"
  (change)="preview.open($any($event.target).files ? Array.from($any($event.target).files) : [])" />
```

### 3. Preview a single image triggered by row action
```html
<sd-preview-image #preview></sd-preview-image>

<sd-quick-action>
  <sd-button sdAction
    type="link" color="primary" prefixIcon="visibility"
    tooltip="Xem áº£nh Ä‘áº¡i diá»‡n"
    (click)="preview.open([row.avatarUrl])">
  </sd-button>
</sd-quick-action>
```

### 4. Reset state on close
```ts
@ViewChild('preview') preview!: SdPreviewImage;

openGallery(urls: string[]) {
  this.preview.open(urls);
}

onPreviewClosed() {
  this.selectedRow = null;
}
```

## Anti-patterns
- âŒ Creating a new `<sd-preview-image>` per row â€” declare ONE in the template and call `.open(...)` per click
- âŒ Passing PDF / non-image URLs â€” `fetch` will succeed but rendering as `<img>` produces a broken icon
- âŒ Mixing `File` and `string` items where some files are `application/pdf` â€” non-image Files are dropped silently, so the user sees fewer items than expected
- âŒ Trying to bind `[images]` directly â€” there is no input; always use `open(...)`
- âŒ Forgetting to revoke the `URL.createObjectURL` blobs â€” the component does not revoke them; for short-lived previews this is acceptable, but if you open many large galleries, expect memory growth

## Related
- `<sd-modal>` â€” the underlying modal shell this component opens
- `<sd-document-builder>` â€” for PDFs / Word / Excel previews
- `<sd-button>` â€” used internally for the prev/next nav buttons

