# Handoff: `<sd-preview-image>` v2 â€” Modernized Image Gallery Viewer

## Overview

This handoff covers a **v2 redesign of the `<sd-preview-image>` component** in the `sd-angular` design system library (`@sdcorejs/angular/components/preview`). The existing v1 implementation is functional but visually dated and missing modern image-viewer affordances. v2 aims to bring the component up to par with viewers like Google Photos / Apple Preview while keeping the existing call sites working.

**Target codebase**: `sd-angular` â€” Angular 19+ standalone components, OnPush change detection, Material/CDK underlay, the design system's own `<sd-modal>` / `<sd-button>` primitives.

## About the Design Files

The files in this bundle are **design references created in HTML/React** â€” interactive prototypes showing the intended look, layout, and behavior. **They are NOT production code to copy directly.** Your task is to **recreate these designs as an Angular standalone component** in the `sd-angular` codebase, following its established patterns (TypeScript, OnPush, the `<sd-modal>` host, `<sd-button>` for actions, `TranslatePipe` for i18n, SCSS module styles, etc.).

The React/JSX code in `sd-preview-image.jsx` exists only because the prototype is an HTML artifact. **Do not port it as React** â€” port the visual design to Angular templates + SCSS.

## Fidelity

**High-fidelity.** All colors, spacing, typography, radii, and shadows below are final. Match them pixel-for-pixel. Hover/focus states, transitions, and interactions are also documented and final.

## Reference Files in This Bundle

| File | Purpose |
| --- | --- |
| `Preview Image UI.html` | Interactive design canvas â€” open in any browser to pan/zoom between artboards |
| `sd-preview-image.jsx` | React mockup source (read for exact styling values; do **not** port as React) |
| `design-canvas.jsx` | Canvas framework â€” only needed to make the HTML run; ignore for implementation |
| `existing-v1/` | Snapshot of the current `preview-image.component.{ts,html,scss}` + the `sd-preview.md` doc â€” read this first to understand the current API surface |

Open `Preview Image UI.html` in a browser to see all 8 mockup states + the API proposal card.

## Existing Implementation (v1) â€” Read This First

The current component lives at:
```
sd-angular/components/preview/src/preview-image/preview-image.component.{ts,html,scss}
sd-angular/components/preview/sd-preview.md   â† doc
```

**Keep these v1 behaviors** for backward compatibility:
- Selector: `sd-preview-image`
- Standalone, OnPush
- Hosted inside `<sd-modal>` (the modal handles the open/close lifecycle)
- Public method: `open(urlOrFiles: (string | File)[] | null | undefined): Promise<void>` â€” fetch URLs as blobs, filter non-image Files, reset `activeIndex = 0`, then `modal.open()`
- Public method: `onClickThumbnailImage(index: number)` and `updateCurrentImage(direction: 1 | -1)`
- Output: `(close)` EventEmitter
- Imports: `SdModal`, `SdButton`, `TranslatePipe`

**v1 problems v2 must fix**:
1. White modal background â€” bad for viewing dark/colorful images
2. Nav arrow icons (`arrow_back_ios_new` / `arrow_forward_ios`) are pure black-on-image â€” invisible on dark photos, no hit-area
3. No image counter ("3 / 12"), filename, or dimensions shown
4. No zoom, rotate, download, or fullscreen
5. No keyboard navigation (â†/â†’/Esc)
6. No swipe / pinch-zoom on touch
7. `URL.createObjectURL` blobs are never revoked â€” memory leak on repeated open
8. `NgOptimizedImage` is used for blob URLs and won't survive zoom/rotate transforms â€” drop it, use plain `<img>`
9. Title is hardcoded to `'Xem áº£nh'` (`core.component.preview-image.title`) â€” should accept override
10. Active thumbnail uses `2px solid #2962ff` border, which resizes the thumb when it activates â€” use `outline` instead

## v2 â€” New Public API

```ts
type PreviewItem = string | File | {
  url?: string;
  file?: File;
  name?: string;          // override filename shown in header
  caption?: string;       // optional caption below image
  alt?: string;           // a11y
  mime?: string;          // hint for filtering / icon
};

@Component({ selector: 'sd-preview-image', /* standalone, OnPush */ })
export class SdPreviewImage {
  // Existing â€” KEEP
  @Output() close = new EventEmitter<void>();

  // New @Input()s (all have sensible defaults, optional)
  @Input() title?: string;                                    // override "Xem áº£nh"
  @Input() thumbnailPosition: 'bottom' | 'right' | 'left' | 'top' | 'dots' | 'none' = 'bottom';
  @Input() showToolbar = true;                                // bottom floating toolbar
  @Input() allowDownload = true;
  @Input() allowZoom = true;
  @Input() backdrop: 'dark' | 'light' = 'dark';
  @Input() loop = true;                                        // wrap â†/â†’ at ends

  // New outputs
  @Output() activeIndexChange = new EventEmitter<number>();
  @Output() download = new EventEmitter<{ index: number; item: PreviewItem }>();
  @Output() imageError = new EventEmitter<{ index: number; reason: string }>();

  // Existing public method â€” extended signature
  open(
    items: PreviewItem[] | null | undefined,
    options?: { startIndex?: number }
  ): Promise<void>;

  // Existing public methods â€” keep
  onClickThumbnailImage(index: number): void;
  updateCurrentImage(direction: 1 | -1): void;

  // New public methods
  zoomIn(): void;
  zoomOut(): void;
  fitToScreen(): void;
  rotate(direction: 'left' | 'right'): void;
  downloadCurrent(): void;
  toggleFullscreen(): void;
}
```

**Backwards compatibility**: every existing call site (`open(urls)`, `open(files)`, `(close)` binding) must continue to work without changes.

## Screens / Views (Mockup Artboards)

There is **one component** with multiple visual states. Each artboard in the design canvas shows the same component under different conditions.

### Artboard A â€” Default layout (`thumbnailPosition: 'bottom'`)

**Layout** (top to bottom, flexbox column inside the modal body):
1. **Header bar** â€” height `~68px`, bg `rgba(15, 17, 20, 0.92)` with `backdrop-filter: blur(12px)`, 1px bottom border `rgba(255,255,255,0.08)`. Layout: left-aligned image icon + filename/dimensions+size stack, absolutely centered counter pill, right-aligned close button.
2. **Stage** â€” fills available space. Bg `#0d0e10` with a subtle 24px checkerboard pattern (rgba whites at 2%). Centers the image with `object-fit: contain`. Contains nav arrows (absolute, left/right edge, vertical center) and the floating bottom toolbar.
3. **Thumbnail strip** â€” height `116px`, bg `#17191c`, padding `12px`, horizontal scrolling row of 120Ã—76 thumbnails with 8px gap.

**Header bar**:
- Left cluster (`gap: 12px`): `image` Material icon outlined, 20px, color `rgba(255,255,255,0.6)`. Then a stack: filename in `T14M` white, then dimensions + file size in `12px`/`rgba(255,255,255,0.6)` separated by ` Â· `. Filename truncates at `max-width: 360px`.
- Center pill: `1 / 12` style counter. `13px / 500`, color `rgba(255,255,255,0.6)`, bg `rgba(255,255,255,0.08)`, `padding: 4px 12px`, `border-radius: 999px`, `font-variant-numeric: tabular-nums`.
- Right: "ÄÃ³ng" button â€” text + `close` icon, 36px tall, 8px radius. Hover background `rgba(239,68,68,0.18)`, hover text `#fca5a5`.

**Nav arrows** (one each side, absolute):
- 48Ã—48 round, no border
- Default bg `rgba(20,20,22,0.6)` with `backdrop-filter: blur(10px)` and `box-shadow: 0 4px 16px rgba(0,0,0,0.3)`
- Hover bg `rgba(255,255,255,0.18)`
- Disabled (first/last image without loop): bg `rgba(255,255,255,0.04)`, opacity 0.35, `cursor: not-allowed`
- Icon: `chevron_left` / `chevron_right` Material, 28px, white
- Position: 16px from edge, vertically centered

**Bottom floating toolbar** (absolute, bottom 24px, horizontally centered):
- Container: bg `rgba(15, 17, 20, 0.92)` + `backdrop-filter: blur(14px)`, 1px border `rgba(255,255,255,0.08)`, `border-radius: 12px`, `padding: 6px 8px`, shadow `0 8px 30px rgba(0,0,0,0.4)`.
- Order (left â†’ right): `zoom_out` button Â· zoom % readout (min-width 56px, `tabular-nums`, white 13px/500) Â· `zoom_in` button Â· vertical 1px divider Â· `fit_screen` button labeled "Vá»«a khung" Â· `rotate_right` button Â· vertical 1px divider Â· `download` button Â· `fullscreen` button.
- Each button: 36px square (or wider if it has a label), `border-radius: 8px`. Hover bg `rgba(255,255,255,0.1)`. Icons 20px, outlined variant of Material Icons.

**Thumbnail strip**:
- Each thumbnail: 120Ã—76, `border-radius: 8px`, `outline: 1px solid rgba(255,255,255,0.08)`, opacity 0.7. On hover (inactive only): opacity 1.0.
- **Active thumbnail**: `outline: 2px solid #3b82f6`, `outline-offset: -2px`, opacity 1.0. Plus an inset shadow `inset 0 0 0 2px #3b82f6` as a pointer-events-none overlay (gives the impression of a thicker accent edge). Using `outline` not `border` so dimensions don't change on activate.
- Top-right corner: number badge â€” `(i+1)`, bg `rgba(0,0,0,0.7)`, white 10px/600, `padding: 1px 5px`, `border-radius: 4px`.
- Inside: `<img src cover>` filling the thumb.

**Keyboard hint** (top-left of stage, when not minimal):
- Row of small `<kbd>`-like chips showing `â† â†’ Â· chuyá»ƒn áº£nh Â· Esc Â· Ä‘Ã³ng`
- Each chip: min-width 20px, height 20px, 5px horizontal padding, 4px radius, border `rgba(255,255,255,0.08)`, bg `rgba(255,255,255,0.04)`, color `rgba(255,255,255,0.6)`, 11px monospace
- Plain text in between is `rgba(255,255,255,0.4)`

### Artboard B â€” Zoomed view (`zoom > 100%`)

Same as A but the `<img>` has a CSS `transform: scale(1.8)` (or width-overridden to 180%) and `cursor: grab` (changes to `grabbing` while dragging). The zoom % in the toolbar reads `180%`. Mouse-wheel adjusts zoom; drag pans (`transform: translate(...)`); double-click toggles between 100% and fit.

### Artboard C â€” Right vertical thumbnails (`thumbnailPosition: 'right'`)

Same component, but the stage and thumbnail strip lay out as a row. Strip is `width: 132px`, vertical column of `108Ã—76` thumbnails. Each thumbnail shows filename overlaid at the bottom via a `linear-gradient(to top, rgba(0,0,0,0.85), transparent)` band. Used for galleries where users want to see filenames at a glance.

### Artboard D â€” Dots indicator (`thumbnailPosition: 'dots'`)

For galleries with â‰¤ 8 images. Replaces the thumbnail strip entirely. Stage becomes full-height. Dots row absolutely positioned at `bottom: 24px`, centered horizontally:
- Inactive dot: 8Ã—8 circle, bg `rgba(255,255,255,0.3)`
- Active dot: 24Ã—8 pill, bg `#f5f6f7`
- 6px gap between dots
- 180ms transition for the width/color change

### Artboard E â€” Minimal (`thumbnailPosition: 'none'`, `showToolbar: false`)

Single-image lightbox mode. No header bar (or compressed). No thumbnail strip. No bottom toolbar. Just the stage with nav arrows (which are disabled if only one image). Use for "view single avatar" type CTAs.

### Artboard F â€” Loading state (`state: 'loading'`)

Stage shows a centered column (gap 16px, color muted):
1. 56Ã—56 spinner â€” `border: 3px solid rgba(255,255,255,0.08)`, `border-top-color: #3b82f6`, `border-radius: 999px`, spinning 0.9s linear infinite
2. Text "Äang táº£i áº£nh... 62%" â€” 13px, `rgba(255,255,255,0.6)`, tabular-nums
3. Progress bar â€” 200Ã—4px, bg `rgba(255,255,255,0.08)`, rounded; fill `#3b82f6` to current %

Header bar still shows filename/counter; nav arrows stay visible but the image area is the loader.

### Artboard G â€” Error state (`state: 'error'`)

When an image fails to load (404, CORS, malformed blob):
- 96Ã—96 rounded-24px tile, bg `rgba(239,68,68,0.1)`, border `1px solid rgba(239,68,68,0.3)`, holding a 48px `broken_image` icon in `#ef4444`
- Title "KhÃ´ng táº£i Ä‘Æ°á»£c áº£nh" â€” 16px/500, white
- Subtitle "File áº£nh cÃ³ thá»ƒ Ä‘Ã£ bá»‹ xÃ³a hoáº·c Ä‘Æ°á»ng dáº«n khÃ´ng há»£p lá»‡" â€” 13px, muted, max-width 320px
- Primary button "Thá»­ láº¡i" with `refresh` icon â€” bg `#3b82f6`, white text, 36px height, 16px horizontal padding, 8px radius. Wires to re-fetch the failing item only.

### Artboard H â€” Empty state (`images.length === 0`)

Stage shows centered column:
- 96Ã—96 rounded-24px tile, bg `rgba(255,255,255,0.05)`, border `1px solid rgba(255,255,255,0.08)`, holding a 48px `image_not_supported` icon in `rgba(255,255,255,0.4)`
- Title "KhÃ´ng cÃ³ thÃ´ng tin áº£nh" â€” 16px/500, white
- Subtitle "ChÆ°a cÃ³ áº£nh nÃ o Ä‘á»ƒ hiá»ƒn thá»‹" â€” 13px, muted

Header bar hidden (no current image), thumbnail strip hidden. Just the close affordance via modal chrome.

## Interactions & Behavior

### Keyboard

Bind these on the modal host while open:

| Key | Action |
| --- | --- |
| `ArrowLeft` | `updateCurrentImage(-1)` |
| `ArrowRight` | `updateCurrentImage(+1)` |
| `Escape` | `modal.close()` |
| `+` / `=` | `zoomIn()` (`allowZoom` only) |
| `-` | `zoomOut()` (`allowZoom` only) |
| `0` | `fitToScreen()` |
| `r` | `rotate('right')` |
| `R` (shift+r) | `rotate('left')` |
| `f` | `toggleFullscreen()` |
| `d` | `downloadCurrent()` (`allowDownload` only) |

Use a `@HostListener` on the document while the modal is open. Remove the listener on close.

### Mouse / Pointer

- **Click nav arrows**: `updateCurrentImage(Â±1)`
- **Click thumbnail**: `onClickThumbnailImage(i)` + scroll into view (`block: 'nearest'`, `inline: 'center'`)
- **Mouse wheel on image** (when `allowZoom`): zoom in/out, anchored on cursor position. Use `transform-origin` set from the cursor's offset before each zoom step.
- **Click + drag on image** (when zoomed): pan via `transform: translate(...)`. Cursor `grab` / `grabbing`.
- **Double-click image**: toggle 100% / fit
- **Touch swipe**: horizontal swipe â‰¥ 40px triggers `updateCurrentImage(Â±1)`. Use `pointerdown/pointermove/pointerup` so it works for mouse + touch + pen uniformly.
- **Pinch zoom**: track two pointers in a `Map`, compute distance ratio between frames, multiply zoom.

### Transitions

- Image entry between slides: `opacity 180ms ease, transform 180ms ease` â€” fade + slight x-translate (8px) in the direction of travel
- Zoom changes: `transform 200ms ease` (only when not actively dragging)
- Rotation: `transform 200ms ease`
- Thumbnail active state: `opacity 120ms`, `outline-color 120ms`
- Dot indicator: `width 180ms, background 180ms`
- Nav arrow hover: `background 120ms`

### Loading lifecycle (per image)

In `open()`:
1. Reset state (`activeIndex = options?.startIndex ?? 0`, clear current zoom/rotation)
2. Map each input to `PreviewItem` normalized shape. Open modal **immediately** (don't await all fetches).
3. For each item, set `loading: true`. Start fetch in parallel.
4. On success: create blob URL, store in image record, emit progress.
5. On failure: mark item with `error: true`, emit `imageError`.
6. The active image's loading/error state drives the stage. Thumbnails for still-loading items show a small skeleton (rgba(255,255,255,0.05) shimmer).

### `open()` reentrancy

If `open()` is called while the modal is already open, revoke previous blob URLs **before** populating new images. Always revoke all blob URLs on `(close)`.

### Focus & a11y

- Trap focus inside the modal (`<sd-modal>` should already do this)
- Initial focus: the close button
- Each nav button has an `aria-label` ("áº¢nh trÆ°á»›c" / "áº¢nh tiáº¿p theo")
- Each thumbnail button has `aria-label` of filename + counter ("áº¢nh 3 trong 12: phong-hop-tang-12.jpg")
- Image has `alt` from `PreviewItem.alt || PreviewItem.name`
- Counter has `aria-live="polite"` so screen readers announce slide changes

## State Management

Internal component signals (use Angular `signal()` for new fields):

```ts
private readonly _activeIndex = signal(0);
private readonly _images = signal<NormalizedImage[]>([]);
private readonly _zoom = signal(1);
private readonly _rotation = signal(0);     // degrees, multiple of 90
private readonly _pan = signal({ x: 0, y: 0 });
private readonly _stage = signal<'ready' | 'loading' | 'error' | 'empty'>('empty');
private readonly _isFullscreen = signal(false);
```

Where `NormalizedImage` is:
```ts
interface NormalizedImage {
  id: string;                 // uuid
  url?: string;               // CDN url if from string input
  blobUrl: string;            // always for display
  name: string;
  size: number;
  caption?: string;
  alt?: string;
  loading: boolean;
  error: boolean;
}
```

The active item is derived: `computed(() => this._images()[this._activeIndex()])`.

## Design Tokens

Use these exact values. Define them as SCSS variables at the top of the component's `.scss` file or as CSS custom properties on `:host`:

```scss
// Surfaces
--sd-preview-shell-bg:    #0d0e10;
--sd-preview-shell-bg-2:  #17191c;   // thumbnail strip
--sd-preview-panel-bg:    rgba(15, 17, 20, 0.92);  // header + bottom toolbar
--sd-preview-divider:     rgba(255, 255, 255, 0.08);

// Foreground
--sd-preview-fg:          #f5f6f7;
--sd-preview-fg-muted:    rgba(255, 255, 255, 0.6);
--sd-preview-fg-subtle:   rgba(255, 255, 255, 0.4);

// Accent
--sd-preview-accent:      #3b82f6;
--sd-preview-accent-soft: rgba(59, 130, 246, 0.2);

// Status
--sd-preview-danger:      #ef4444;
--sd-preview-success:     #22c55e;

// Backdrop (when wrapped by sd-modal)
--sd-preview-backdrop:    rgba(15, 23, 42, 0.55);  // overlay behind shell
```

**Typography** â€” reuse the design system's `T14M`, `T14R`, `T16M`, `T16R`, `T12R` classes from `assets/scss/core/utilities/_typography.scss` where they apply. The header filename is `T14M`, dimensions+size are 12px/400, counter is 13px/500. Bottom toolbar labels are 13px/500.

**Radii**: 8px (buttons, thumbnails), 12px (floating toolbar, outer shell), 999px (counter pill, nav arrows, dots), 24px (status icon tiles).

**Spacing**: 4 / 6 / 8 / 12 / 16 / 20 / 24 px scale. Don't invent in-betweens.

**Shadows**:
- Outer shell: `0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)`
- Floating toolbar: `0 8px 30px rgba(0,0,0,0.4)`
- Nav arrow: `0 4px 16px rgba(0,0,0,0.3)`

**Stage checkerboard pattern** (subtle, gives sense of scale on small images):
```css
background-image:
  linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%),
  linear-gradient(-45deg, rgba(255,255,255,0.02) 25%, transparent 25%),
  linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.02) 75%),
  linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.02) 75%);
background-size: 24px 24px;
background-position: 0 0, 0 12px, 12px -12px, -12px 0;
```

## Icons

All icons are **Material Icons (outlined)** matching the rest of `sd-angular`. Required names:
- `image` (header)
- `close` (header close button)
- `chevron_left` / `chevron_right` (nav arrows â€” note: replace v1's `arrow_back_ios_new` / `arrow_forward_ios`)
- `zoom_in` / `zoom_out` / `fit_screen`
- `rotate_right` (and optionally `rotate_left`)
- `download`
- `fullscreen` / `fullscreen_exit`
- `refresh` (error retry)
- `broken_image` (error state)
- `image_not_supported` (empty state)

Use the existing `<sd-button prefixIcon="...">` wrapper, or `<mat-icon>` directly inside `<button mat-icon-button>` if `<sd-button>` doesn't render compactly enough for the floating toolbar.

## i18n Keys

Add/keep these translation keys in `sd-angular/i18n/src/{vi,en,ja,ko,zh}.ts`:

```ts
'core.component.preview-image.title':           'Xem áº£nh',
'core.component.preview-image.no-image':        'KhÃ´ng cÃ³ thÃ´ng tin áº£nh',
'core.component.preview-image.no-image-hint':   'ChÆ°a cÃ³ áº£nh nÃ o Ä‘á»ƒ hiá»ƒn thá»‹',
'core.component.preview-image.load-error':      'KhÃ´ng táº£i Ä‘Æ°á»£c áº£nh',
'core.component.preview-image.load-error-hint': 'File áº£nh cÃ³ thá»ƒ Ä‘Ã£ bá»‹ xÃ³a hoáº·c Ä‘Æ°á»ng dáº«n khÃ´ng há»£p lá»‡',
'core.component.preview-image.retry':           'Thá»­ láº¡i',
'core.component.preview-image.close':           'ÄÃ³ng',
'core.component.preview-image.prev':            'áº¢nh trÆ°á»›c',
'core.component.preview-image.next':            'áº¢nh tiáº¿p theo',
'core.component.preview-image.zoom-in':         'PhÃ³ng to',
'core.component.preview-image.zoom-out':        'Thu nhá»',
'core.component.preview-image.fit':             'Vá»«a khung',
'core.component.preview-image.rotate':          'Xoay',
'core.component.preview-image.download':        'Táº£i xuá»‘ng',
'core.component.preview-image.fullscreen':      'ToÃ n mÃ n hÃ¬nh',
'core.component.preview-image.loading':         'Äang táº£i áº£nh...',
'core.component.preview-image.counter':         '{{current}} / {{total}}',
'core.component.preview-image.kbd-hint-nav':    'chuyá»ƒn áº£nh',
'core.component.preview-image.kbd-hint-close':  'Ä‘Ã³ng',
```

The Vietnamese strings in this README are the source of truth â€” translate the others.

## Memory Management

The v1 `URL.createObjectURL(...)` calls are never revoked. v2 **must** revoke on:
1. `open()` reentrancy â€” before populating the new image list
2. Modal `(close)` event â€” iterate previous images, `URL.revokeObjectURL(img.blobUrl)`
3. Component `ngOnDestroy` â€” final cleanup

Track which blob URLs the component created (not the original input `string` URLs from CDN â€” those aren't blob: URLs).

## Backwards Compatibility Checklist

Before merging v2, verify these v1 call sites still work without modification:

```html
<!-- Should still work: simple array of CDN URLs -->
<sd-preview-image #p></sd-preview-image>
<sd-button (click)="p.open(row.attachmentUrls)"></sd-button>

<!-- Should still work: File[] from file input -->
<sd-preview-image #p></sd-preview-image>
<input type="file" multiple accept="image/*"
       (change)="p.open(Array.from($any($event.target).files))" />

<!-- Should still work: (close) output -->
<sd-preview-image #p (close)="onClosed()"></sd-preview-image>

<!-- Should still work: filtering non-image File items silently -->
<!-- (a Word doc + a PNG in the same array â†’ only the PNG is shown) -->
```

## Files to Create / Modify

```
sd-angular/components/preview/src/preview-image/
  preview-image.component.ts          MODIFY  â€” new inputs/outputs, new state, public methods
  preview-image.component.html        REWRITE â€” new layout per artboards Aâ€“H
  preview-image.component.scss        REWRITE â€” dark tokens, new structure
  preview-image.types.ts              CREATE  â€” PreviewItem, NormalizedImage interfaces
sd-angular/components/preview/
  sd-preview.md                       UPDATE  â€” re-document v2 API
sd-angular/i18n/src/{vi,en,ja,ko,zh}.ts  UPDATE â€” new translation keys
```

Existing tests (`preview-image.component.spec.ts` if present) will need to be updated to cover the new outputs, keyboard handling, and the new `PreviewItem` object shape.

## Implementation Order Suggested

1. **Types & API skeleton** â€” `preview-image.types.ts` + class shape with all new `@Input()`/`@Output()` and stub methods
2. **Layout & styling (static)** â€” recreate artboards A, C, D, E (default + variants) from the HTML reference, no logic yet
3. **State machine** â€” wire `_stage`, `_activeIndex`, `_zoom`, etc; render correct state per artboard F/G/H
4. **`open()` + blob lifecycle** â€” async fetch, normalize, revoke
5. **Keyboard handling** â€” `@HostListener` on document for keys above
6. **Mouse/touch** â€” wheel zoom + drag pan + swipe + pinch
7. **Toolbar actions** â€” zoom/rotate/download/fullscreen
8. **i18n + a11y polish** â€” labels, aria-live counter, focus management
9. **Update doc** `sd-preview.md` + run prettier / lint

## Definition of Done

- All 8 artboards (Aâ€“H) reproduced visually in the running Angular component (verify in a Storybook story or test harness page)
- All v1 call sites still compile and work
- Keyboard, mouse-wheel, drag-pan, swipe, pinch-zoom all functional
- No console warnings, no `NgOptimizedImage` errors with blob URLs
- Blob URLs are revoked on close (verify in DevTools: open/close 5Ã— and confirm `URL` count doesn't grow)
- All copy uses `TranslatePipe`, no hardcoded Vietnamese strings in the template
- OnPush change detection still respected (use signals, not direct mutation)
- The doc `sd-preview.md` is updated to match the new API

---

**Questions to ask if anything below is unclear** before starting implementation:
- Should v2 ship as a new component (`<sd-preview-image-v2>`) for staged rollout, or in-place replace v1?
- Is there an existing fullscreen helper in `sd-angular`, or should the component use the browser Fullscreen API directly?
- Does the design system have a pre-existing "dark surface" token set that should be used instead of the literal colors in this README?

