# Handoff: `<sd-preview-pdf>` — New PDF Document Viewer Component

## Overview

This handoff covers a **new component `<sd-preview-pdf>`** to be added to the `sd-angular` design system library, alongside the existing `<sd-preview-image>`. It is a modal PDF viewer with multi-page navigation, thumbnail/outline sidebar, in-document search, zoom/rotate/print/download, and continuous-scroll mode.

**Target codebase**: `sd-angular` — Angular 19+ standalone components, OnPush, the design system's own `<sd-modal>` and `<sd-button>` primitives, `TranslatePipe` for i18n, SCSS module styles.

**Module location**:
```
sd-angular/components/preview/src/preview-pdf/
  preview-pdf.component.ts
  preview-pdf.component.html
  preview-pdf.component.scss
  preview-pdf.types.ts
sd-angular/components/preview/index.ts    ← add: export * from './src/preview-pdf/preview-pdf.component';
sd-angular/components/preview/sd-preview.md  ← extend with sd-preview-pdf section
```

## About the Design Files

The files in this bundle are **design references created in HTML/React** — interactive prototypes showing the intended look, layout, and behavior. **They are NOT production code to copy directly.** Your task is to **recreate these designs as an Angular standalone component** in the `sd-angular` codebase, following its established patterns (TypeScript, OnPush, `<sd-modal>` host, `<sd-button>` for actions, `TranslatePipe`, SCSS module styles).

The React/JSX code in `sd-preview-pdf.jsx` exists only because the prototype is an HTML artifact. **Do not port it as React** — port the visual design to Angular templates + SCSS.

## Fidelity

**High-fidelity.** All colors, spacing, typography, radii, shadows, and interactions are final. Match them pixel-for-pixel.

## Reference Files in This Bundle

| File | Purpose |
| --- | --- |
| `Preview PDF UI.html` | Interactive design canvas — open in any browser to pan/zoom between 9 artboards + the API proposal card |
| `sd-preview-pdf.jsx` | React mockup source (read for exact styling values; do **not** port as React) |
| `design-canvas.jsx` | Canvas framework — only needed to make the HTML run; ignore for implementation |
| `sibling-component/` | Reference snapshot of the existing `<sd-preview-image>` v1 — useful to see file structure, imports, `<sd-modal>` usage pattern, and i18n key conventions to mirror |

Open `Preview PDF UI.html` in a browser to see all 9 mockup states.

## Engine Choice

The component needs a PDF parsing + rendering library. **Recommended: `pdfjs-dist`** (the Mozilla PDF.js core, used by Firefox).

- ~1.2 MB gzipped; lazy-load it via dynamic `import()` so the bundle isn't penalized on routes that never open PDFs.
- Requires a web worker — register the worker URL via `pdfjsLib.GlobalWorkerOptions.workerSrc`. Ship the worker file under the library's `assets/` and reference it via `assets/sd-angular/pdf.worker.min.mjs` or similar.
- All UI shell (header, sidebar, toolbar, search bar) is **your own** — don't use PDF.js's built-in viewer chrome; it's incompatible with the Material/sd-angular styling.

Alternative if `pdfjs-dist` direct integration is too much work: `ngx-extended-pdf-viewer` provides Angular bindings but bakes in its own UI — you'd have to hide most of its chrome and override styles, which is fragile. Prefer direct `pdfjs-dist`.

## Sibling Component Pattern

Mirror the `<sd-preview-image>` v1 component for file structure, lifecycle, and integration patterns:

```ts
@Component({
  selector: 'sd-preview-pdf',
  standalone: true,
  imports: [CommonModule, SdModal, SdButton, TranslatePipe, /* ... */],
  templateUrl: './preview-pdf.component.html',
  styleUrl: './preview-pdf.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdPreviewPdf {
  @ViewChild(SdModal) modal!: SdModal;
  @Output() close = new EventEmitter<void>();
  // ... see API section below
}
```

The `<sd-modal>` host handles backdrop / close button / focus trap; the PDF component renders into the modal body.

## Public API

```ts
// preview-pdf.types.ts
export type PdfSource =
  | string                                            // CDN/internal URL
  | File
  | Blob
  | ArrayBuffer
  | Uint8Array
  | { url: string; httpHeaders?: Record<string, string>; withCredentials?: boolean }
  | { data: ArrayBuffer | Uint8Array };

export type PdfZoomMode = number | 'page-fit' | 'page-width' | 'page-actual';
export type PdfSidebarMode = 'thumbnails' | 'outline' | 'search' | 'none';
export type PdfScrollMode = 'page' | 'continuous' | 'horizontal';

export interface PdfMeta {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creationDate?: Date;
  modificationDate?: Date;
  numPages: number;
}

export interface PdfOutlineNode {
  id: string;
  label: string;
  page: number;
  children?: PdfOutlineNode[];
}

export interface PdfSearchResult {
  page: number;
  before: string;
  term: string;
  after: string;
}
```

```ts
@Component(/* ... */)
export class SdPreviewPdf {
  // Inputs
  @Input() title?: string;                                    // override filename in header
  @Input() startPage = 1;
  @Input() initialZoom: PdfZoomMode = 'page-fit';
  @Input() sidebar: PdfSidebarMode = 'thumbnails';
  @Input() sidebarOpen = true;
  @Input() scrollMode: PdfScrollMode = 'page';
  @Input() showToolbar = true;
  @Input() showSearch = true;
  @Input() allowDownload = true;
  @Input() allowPrint = true;
  @Input() password?: string;                                 // for encrypted PDFs
  @Input() httpHeaders?: Record<string, string>;              // for auth-gated URLs

  // Outputs
  @Output() close = new EventEmitter<void>();
  @Output() loaded = new EventEmitter<{ totalPages: number; meta: PdfMeta }>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() zoomChange = new EventEmitter<number>();
  @Output() download = new EventEmitter<{ filename: string }>();
  @Output() print = new EventEmitter<void>();
  @Output() loadError = new EventEmitter<{ reason: 'invalid' | 'password' | 'network' | 'unknown'; message?: string }>();
  @Output() searchChange = new EventEmitter<{ term: string; total: number; current: number }>();

  // Public API (called via @ViewChild)
  open(
    source: PdfSource | null | undefined,
    options?: {
      startPage?: number;
      initialZoom?: PdfZoomMode;
      title?: string;
    }
  ): Promise<void>;

  goToPage(page: number): void;
  nextPage(): void;
  prevPage(): void;
  firstPage(): void;
  lastPage(): void;

  zoomIn(): void;
  zoomOut(): void;
  setZoom(z: PdfZoomMode): void;
  rotate(direction: 'left' | 'right'): void;

  toggleSidebar(): void;
  setSidebar(mode: PdfSidebarMode): void;
  setScrollMode(mode: PdfScrollMode): void;

  search(term: string, options?: { caseSensitive?: boolean; wholeWord?: boolean }): Promise<number>;
  searchNext(): void;
  searchPrev(): void;
  clearSearch(): void;

  downloadFile(): void;
  printFile(): void;
  toggleFullscreen(): void;
}
```

### Backwards considerations

This is a NEW component, so there are no breaking changes. However:
- Mirror the lifecycle pattern of `<sd-preview-image>` (call `.open(src)`, listen to `(close)`) so consumers can use both interchangeably without learning two patterns.
- Keep one shared component instance per page where possible (anti-pattern: one per row).

## Screens / Views (Mockup Artboards)

There is **one component** with multiple visual states. Each artboard in `Preview PDF UI.html` shows the same component under different conditions.

### Artboard A — Default (`sidebarOpen: true, sidebar: 'thumbnails'`)

**Top-level layout** (column inside the modal body):
1. **Header bar** — top, full-width
2. **Body** — flex row: sidebar on the left, stage on the right
3. The bottom floating page-toolbar lives **inside the stage** absolutely positioned, not in this column

**Header bar** (height ~57px):
- bg `rgba(20, 22, 25, 0.94)` with `backdrop-filter: blur(12px)`
- 1px bottom border `rgba(255, 255, 255, 0.08)`
- Left cluster (flex row, gap 8px): hamburger menu button (toggles sidebar — active state when sidebar open), then a 1px vertical divider, then a 32×32 red PDF file icon tile, then a stack: filename in 14px/500 white (truncates at max-width 320px), and below it `{totalPages} trang · {fileSize}` in 11px/`rgba(255,255,255,0.6)`.
- Right cluster (flex row, gap 4px): `search` button (active state when search open), `print`, `download`, `fullscreen`, vertical divider, then a "Đóng" button with `close` icon (danger hover: bg `rgba(239,68,68,0.18)`, text `#fca5a5`).
- All toolbar buttons share a common style: 32×32 (square) or 32px tall + label (8px left + 10px right padding). Icon 18px outlined. Border-radius 6px. Hover bg `rgba(255,255,255,0.1)`. Active state bg `rgba(59, 130, 246, 0.2)` with icon color `#3b82f6`.

**PDF file icon tile** (the red square next to filename):
- 32×32, border-radius 6px
- bg `rgba(239, 68, 68, 0.15)`, border `1px solid rgba(239, 68, 68, 0.3)`
- Centered text "PDF" — 10px/700, color `#f87171`, monospace font

**Sidebar** (width 240px, full height of body):
- bg `#22252a`, 1px right border
- Top: 3 segmented tabs (Trang / Mục lục / Tìm) — each tab is `flex: 1`, 32px tall, 6px radius, gap 4px between. Inactive: `rgba(255,255,255,0.6)`. Active: bg `rgba(59, 130, 246, 0.2)`, color `#3b82f6`. Icons: `view_carousel`, `list`, `search` — 14px.
- Bottom: scrollable content area, padding 12px (thumbnails) or 6px (outline/search).

**Thumbnails sidebar content**:
- Vertical column of thumbnails, 12px gap
- Each thumbnail: a white 612:792 aspect-ratio page (152px wide) with `outline: 1px solid rgba(255,255,255,0.08)`, outline-offset -1px, border-radius 2px, shadow `0 2px 6px rgba(0,0,0,0.3)`, padding 14px showing miniaturized page content (text bars / table grid).
- Active: `outline: 2px solid #3b82f6`, outline-offset -2px.
- Below each: page number in 11px, color `#3b82f6` 600 if active else `rgba(255,255,255,0.6)` 400, tabular-nums.

**Stage** (the right side, flex 1):
- bg `#1a1c1f` with subtle 24px checkerboard pattern (rgba whites at 1.5% — even more subtle than the image viewer because the white pages provide their own contrast)
- Padding: `32px 24px 96px` (extra bottom for floating toolbar)
- `display: flex; justify-content: center` so the page is centered horizontally
- Pages are 612×792 (US Letter at 72 DPI) scaled to ~78% in single-page mode at 100% zoom
- Each page: solid white, border-radius 2px, shadow `0 4px 16px rgba(0,0,0,0.4)`, contains rendered PDF content (text, headings, tables, etc.) at the appropriate scale

**Floating page-toolbar** (absolute, bottom 20px, horizontally centered):
- bg `rgba(20, 22, 25, 0.94)` with `backdrop-filter: blur(14px)`
- border `1px solid rgba(255,255,255,0.08)`, border-radius 10px, padding `5px 6px`
- shadow `0 8px 30px rgba(0,0,0,0.4)`
- Order (left → right):
  1. `first_page` button
  2. `chevron_left` button (prev)
  3. Page indicator: a number `<input>` (36×24, bg `rgba(255,255,255,0.08)`, border `1px solid rgba(255,255,255,0.08)`, 4px radius, centered text, tabular-nums) showing current page → user can type to jump; followed by ` / 24` in `rgba(255,255,255,0.6)`
  4. `chevron_right` button (next)
  5. `last_page` button
  6. Vertical 1px divider
  7. `remove` button (zoom out)
  8. Zoom % display: 64px-min-width pill (bg `rgba(255,255,255,0.08)`, 4px radius, 24px tall) showing "100%" + a small `arrow_drop_down` — clickable, opens a menu with preset zooms (50/75/100/125/150/200/page-fit/page-width/page-actual)
  9. `add` button (zoom in)
  10. Vertical divider
  11. "Vừa trang" button with `fit_screen` icon (active when zoomMode === 'page-fit')
  12. "Vừa rộng" button with `swap_horiz` icon (active when zoomMode === 'page-width')
  13. Vertical divider
  14. `rotate_right` button
  15. "Từng trang" / "Cuộn liên tục" toggle button — icon `description` when single-page, `view_day` when continuous — label updates to reflect the *current* mode (so the user reads what mode they're in, click toggles).

**Important text-wrapping rule**: all buttons that show text labels in the toolbars (header right cluster has none with labels except "Đóng"; floating toolbar has "Vừa trang", "Vừa rộng", "Từng trang"/"Cuộn liên tục"; sidebar tabs have "Trang", "Mục lục", "Tìm"; search toolbar has "Aa", "Từ nguyên") MUST have `white-space: nowrap` and `flex-shrink: 0` to prevent ugly wrapping when the container shrinks. This was a real bug discovered during design review.

### Artboard B — Outline sidebar (`sidebar: 'outline'`)

Same as A but the sidebar shows a hierarchical table of contents:
- Each outline entry is a button: padding `7px 8px` + `(depth * 16px)` left for nesting; 6px radius
- Inactive: color `#f5f6f7`, transparent bg
- Active (the section whose page range contains the current page): bg `rgba(59, 130, 246, 0.2)`, color `#3b82f6`, font-weight 500
- Label on the left (truncates), page number on the right in 11px `rgba(255,255,255,0.6)` tabular-nums

Outline data shape (matches `pdfDoc.getOutline()` output, recursively):
```ts
{ id, label, page, children?: PdfOutlineNode[] }
```

### Artboard C — Sidebar hidden (`sidebarOpen: false`)

Sidebar collapses entirely; the stage takes the full body width. Hamburger button in header is no longer in active state. Page sits more comfortably in the center.

### Artboard D — Continuous scroll (`scrollMode: 'continuous'`)

The stage renders pages stacked vertically with 24px gap. The "current page" is the one at the top of the viewport (or the most visible one). Each rendered page has a circular page-number badge in the gutter to the left (`top: 8px, left: -36px` relative to the page; 28×28 round, accent bg when active, muted bg otherwise).

When the user scrolls, `pageChange` fires once per page boundary crossed. The page input in the floating toolbar shows the current page.

**Virtualization**: only render pages within ±1 of the viewport. Other pages are placeholder boxes with the same aspect ratio (so scroll position is stable) — render the canvas lazily on intersection.

### Artboard E — Zoom 150%, fit width (`zoom: 150, zoomMode: 'page-width'`)

Same component, sidebar hidden, page is wide enough to overflow horizontally (which is allowed — the stage scrolls). The zoom indicator in the toolbar shows "150%", and the "Vừa rộng" button is in active state (accent color). Mouse wheel + Ctrl/Cmd zooms in/out, anchored at cursor position.

### Artboard F — Search active

When the user clicks the `search` button in the header, OR presses `Ctrl+F`:
- A **search bar appears below the header** (between header and body, not floating): height ~46px, bg `rgba(20, 22, 25, 0.94)`, 1px bottom border. Contains:
  - 16px `search` icon (muted)
  - Input field — bg `rgba(255,255,255,0.06)`, 1px border, 6px radius, 30px tall, max-width 360px. Placeholder "Tìm trong tài liệu...". On its right edge, a counter "1 / 18" in tabular-nums muted.
  - `keyboard_arrow_up` and `keyboard_arrow_down` buttons (prev/next result)
  - Vertical divider
  - "Aa" toggle button (case sensitive) — uses `match_case` icon
  - "Từ nguyên" toggle button (whole word) — uses `text_fields` icon
  - Spacer
  - `close` button to dismiss the search bar
- The sidebar automatically switches to `'search'` mode, listing all results grouped by page. Each result button: bg `rgba(59, 130, 246, 0.2)` for the active one, snippet of context with the matching term wrapped in a `<mark>` (bg `rgba(250, 204, 21, 0.55)`, color black, 2px radius, 0–2px padding).
- On the **rendered page itself**, all matches are highlighted as yellow `<mark>`s. The currently-active match is brighter (`rgba(250, 204, 21, 0.9)`) so the user can see where they are.
- Pressing Enter / `F3` / clicking down arrow advances to the next match (cross-page navigation if needed).
- `Esc` closes the search bar and clears highlights.

### Artboard G — Loading state (`state: 'loading'`)

Header is hidden (we don't know filename/page count yet). Sidebar is hidden. Stage shows a centered column:
1. 56×56 spinner — `border: 3px solid rgba(255,255,255,0.08)`, top-color `#3b82f6`, rotating 0.9s linear infinite
2. Text "Đang tải tài liệu... 62%" — 13px, muted, tabular-nums
3. Progress bar — 240×4px, bg `rgba(255,255,255,0.08)`, fill `#3b82f6` to current %
4. Secondary line "Đang xử lý trang 11 / 24" — 11px, very subtle (`rgba(255,255,255,0.4)`)

The progress represents:
- 0–30%: fetching the file
- 30–60%: parsing the PDF structure (pdfjs `getDocument()` resolves)
- 60–100%: rendering the first few pages (so the initial view is ready)

### Artboard H — Error state (`state: 'error'`)

Sidebar hidden. Stage shows a centered column with max-width 380px:
- 96×96 rounded-24px tile, bg `rgba(239,68,68,0.1)`, border `1px solid rgba(239,68,68,0.3)`, 48px `error_outline` icon in `#ef4444`
- Title "Không tải được tài liệu" — 16px/500, white
- Subtitle "File PDF có thể bị hỏng, mật khẩu bảo vệ hoặc đường dẫn không hợp lệ. Vui lòng kiểm tra lại." — 13px, muted, centered
- Two buttons side by side, 8px gap:
  - Primary "Thử lại" — bg `#3b82f6`, white, with `refresh` icon
  - Secondary "Tải file gốc" — transparent, 1px divider border, with `download` icon

The error reason determines copy:
| reason | title | subtitle |
| --- | --- | --- |
| `invalid` | "Không tải được tài liệu" | "File PDF có thể bị hỏng. Vui lòng kiểm tra lại file." |
| `password` | "Tài liệu được bảo vệ" | "File PDF này yêu cầu mật khẩu để mở. Vui lòng cung cấp mật khẩu." |
| `network` | "Không kết nối được" | "Không thể tải file từ máy chủ. Vui lòng thử lại sau." |
| `unknown` | "Đã có lỗi xảy ra" | "Vui lòng thử lại hoặc tải file gốc về để xem." |

### Artboard I — Empty state (no source given)

Stage shows centered:
- 96×96 rounded-24px tile, bg `rgba(255,255,255,0.05)`, border `1px solid rgba(255,255,255,0.08)`, 48px `picture_as_pdf` icon in `rgba(255,255,255,0.4)`
- Title "Không có tài liệu" — 16px/500, white
- Subtitle "Chưa có file PDF nào để hiển thị" — 13px, muted

Header is hidden (no filename to show). Sidebar is hidden.

## Interactions & Behavior

### Keyboard shortcuts (bind via `@HostListener` on `document` while modal is open)

| Key | Action |
| --- | --- |
| `ArrowLeft` / `PageUp` | `prevPage()` |
| `ArrowRight` / `PageDown` / `Space` | `nextPage()` |
| `Home` | `firstPage()` |
| `End` | `lastPage()` |
| `+` or `=` (with or without Shift) | `zoomIn()` |
| `-` | `zoomOut()` |
| `0` | `setZoom('page-fit')` |
| `Ctrl/Cmd + F` | open search bar, focus its input |
| `F3` / `Enter` (when search focused) | `searchNext()` |
| `Shift + F3` / `Shift + Enter` | `searchPrev()` |
| `r` | `rotate('right')` |
| `R` (Shift+r) | `rotate('left')` |
| `Ctrl/Cmd + P` | `printFile()` |
| `Ctrl/Cmd + S` | `downloadFile()` |
| `f` | `toggleFullscreen()` |
| `Esc` | If search open → close search. Else → close modal. |

Remove all listeners on modal close.

### Mouse / pointer

- **Click on sidebar thumbnail / outline entry**: `goToPage(n)`.
- **Click page input in toolbar + type a number + Enter**: `goToPage(n)`.
- **Click zoom pill**: open a dropdown menu with preset zoom options + custom %.
- **Wheel scroll on stage**:
  - Default: scroll the stage (between pages in continuous mode, within a page when zoomed).
  - With Ctrl/Cmd held: zoom in/out anchored at the cursor position.
- **Pinch zoom on touch**: track two pointers, compute distance ratio; same as Ctrl+wheel.
- **Touch swipe horizontal** (≥ 40px): in single-page mode, switch page; in continuous mode, no-op (vertical scroll instead).
- **Text selection on rendered pages**: standard browser selection. Use `pdfjs-dist`'s text layer for proper extraction. Selected text is copy-able with Ctrl/Cmd+C.

### Page rendering

For each visible page:
1. Call `pdfDoc.getPage(n)` to get a `PDFPageProxy`.
2. Compute the viewport at current zoom and rotation via `page.getViewport({ scale, rotation })`.
3. Render to a `<canvas>` sized to the viewport's CSS pixel dimensions × DPR.
4. Render the **text layer** to a sibling `<div>` for selection / search highlights (`page.getTextContent()` + `pdfjs.renderTextLayer()`).
5. Render the **annotation layer** for clickable links (`page.getAnnotations()` + `pdfjs.AnnotationLayer.render()`).

Apply rotation via `getViewport({ rotation: 0|90|180|270 })`, NOT via CSS transform — this keeps text and links properly aligned.

### Search implementation

Use PDF.js's `pdfFindController`:
```ts
const findController = new pdfjsViewer.PDFFindController({
  linkService,
  eventBus,
  updateMatchesCountOnProgress: true,
});
findController.executeCommand('find', {
  query: term,
  caseSensitive,
  entireWord: wholeWord,
  highlightAll: true,
});
```
- Search runs in the worker; results stream back via the event bus.
- Highlight rendering is done by the text-layer rendering; the controller annotates which match is "current" so you can style it differently.
- Properly handles Vietnamese diacritics if you pass `phraseSearch: true` and accept the default normalization.

### Memory & lifecycle

- Call `pdfDoc.destroy()` and clear all canvases when the modal closes.
- Revoke blob URLs created from `File` / `Blob` sources.
- Use `pdfjsLib.GlobalWorkerOptions.workerSrc` to point at the worker file once at app startup (or in the component's static initializer).

### Reentrancy

If `open(newSource)` is called while a document is already loaded:
1. Cancel any in-flight render tasks (`renderTask.cancel()`).
2. Destroy the previous `pdfDoc`.
3. Reset state (page, zoom, search, sidebar mode).
4. Start fresh.

### Focus & a11y

- Modal traps focus (handled by `<sd-modal>`).
- Initial focus: the close button.
- Each interactive element has a translated `aria-label` (search input, prev/next, page input).
- Page numbers and zoom % use `aria-live="polite"` regions so screen readers announce changes.
- Text on rendered pages is selectable AND in the accessibility tree (the text layer is a real DOM, not just visual).

## Design Tokens

Use these exact values (declare as SCSS variables or `:host` custom properties):

```scss
// Surfaces
--sd-pdf-shell-bg:    #1a1c1f;     // outer modal shell
--sd-pdf-sidebar-bg:  #22252a;     // sidebar surface
--sd-pdf-toolbar-bg:  rgba(20, 22, 25, 0.94);  // header + bottom toolbar + search bar
--sd-pdf-page-bg:     #ffffff;     // PDF page background
--sd-pdf-page-shadow: 0 4px 16px rgba(0,0,0,0.4);
--sd-pdf-divider:     rgba(255, 255, 255, 0.08);

// Foreground
--sd-pdf-fg:          #f5f6f7;
--sd-pdf-fg-muted:    rgba(255, 255, 255, 0.6);
--sd-pdf-fg-subtle:   rgba(255, 255, 255, 0.4);

// Accent
--sd-pdf-accent:      #3b82f6;
--sd-pdf-accent-soft: rgba(59, 130, 246, 0.2);

// Search highlights
--sd-pdf-search-hi:        rgba(250, 204, 21, 0.55);  // all matches
--sd-pdf-search-hi-active: rgba(250, 204, 21, 0.9);   // currently active match

// Status
--sd-pdf-danger:      #ef4444;
--sd-pdf-success:     #22c55e;
```

**Typography**: reuse `T14M`, `T14R`, `T12R` design system classes where possible. Filename in header is 14px/500. File metadata (page count, size) is 11px/400. Counter pills are 13px/500 with `font-variant-numeric: tabular-nums`. Toolbar button labels are 13px/500.

**Radii**: 4px (input fields, zoom pill, page corner), 6px (toolbar buttons, outline entries), 8px (action buttons in error state), 10px (floating toolbar), 12px (outer shell), 24px (status icon tiles), 2px (thumbnail page).

**Spacing**: 4 / 6 / 8 / 10 / 12 / 14 / 16 / 20 / 24 / 32 px scale. Don't invent in-betweens.

**Shadows**:
- Outer shell: `0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)`
- Floating toolbar: `0 8px 30px rgba(0,0,0,0.4)`
- PDF page: `0 4px 16px rgba(0,0,0,0.4)`
- Thumbnail: `0 2px 6px rgba(0,0,0,0.3)`

**Stage checkerboard** (subtle pattern behind pages):
```css
background-image:
  linear-gradient(45deg, rgba(255,255,255,0.015) 25%, transparent 25%),
  linear-gradient(-45deg, rgba(255,255,255,0.015) 25%, transparent 25%),
  linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.015) 75%),
  linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.015) 75%);
background-size: 24px 24px;
background-position: 0 0, 0 12px, 12px -12px, -12px 0;
```
Lighter than the image viewer's `0.02` because the white pages provide their own contrast.

## Icons (Material Icons Outlined)

| Icon | Use |
| --- | --- |
| `menu` | toggle sidebar |
| `view_carousel` | sidebar tab — Trang |
| `list` | sidebar tab — Mục lục |
| `search` | sidebar tab — Tìm + header search button |
| `close` | header close button + search close |
| `print` | header — in tài liệu |
| `download` | header — tải xuống |
| `fullscreen` | header — toàn màn hình |
| `first_page` / `chevron_left` / `chevron_right` / `last_page` | page nav |
| `add` / `remove` | zoom in / out |
| `arrow_drop_down` | zoom % dropdown |
| `fit_screen` | "Vừa trang" |
| `swap_horiz` | "Vừa rộng" |
| `rotate_right` | rotate |
| `description` / `view_day` | scroll mode toggle (single / continuous) |
| `keyboard_arrow_up` / `keyboard_arrow_down` | search prev / next |
| `match_case` | search case toggle "Aa" |
| `text_fields` | search whole-word toggle "Từ nguyên" |
| `error_outline` | error state icon |
| `picture_as_pdf` | empty state icon |
| `refresh` | error retry |

## i18n Keys

Add to `sd-angular/i18n/src/{vi,en,ja,ko,zh}.ts`:

```ts
// Generic
'core.component.preview-pdf.title':                'Xem tài liệu',
'core.component.preview-pdf.close':                'Đóng',
'core.component.preview-pdf.pages-count':          '{{count}} trang',

// Sidebar tabs
'core.component.preview-pdf.tab.thumbnails':       'Trang',
'core.component.preview-pdf.tab.outline':          'Mục lục',
'core.component.preview-pdf.tab.search':           'Tìm',

// Toolbar
'core.component.preview-pdf.first-page':           'Trang đầu',
'core.component.preview-pdf.prev-page':            'Trang trước',
'core.component.preview-pdf.next-page':            'Trang tiếp',
'core.component.preview-pdf.last-page':            'Trang cuối',
'core.component.preview-pdf.zoom-in':              'Phóng to',
'core.component.preview-pdf.zoom-out':             'Thu nhỏ',
'core.component.preview-pdf.fit-page':             'Vừa trang',
'core.component.preview-pdf.fit-width':            'Vừa rộng',
'core.component.preview-pdf.actual-size':          'Kích thước thật',
'core.component.preview-pdf.rotate':               'Xoay',
'core.component.preview-pdf.scroll-page':          'Từng trang',
'core.component.preview-pdf.scroll-continuous':    'Cuộn liên tục',

// Header
'core.component.preview-pdf.search':               'Tìm kiếm',
'core.component.preview-pdf.print':                'In',
'core.component.preview-pdf.download':             'Tải xuống',
'core.component.preview-pdf.fullscreen':           'Toàn màn hình',

// Search bar
'core.component.preview-pdf.search-placeholder':   'Tìm trong tài liệu...',
'core.component.preview-pdf.search-case':          'Phân biệt hoa thường',
'core.component.preview-pdf.search-whole':         'Từ nguyên',
'core.component.preview-pdf.search-no-results':    'Không tìm thấy',
'core.component.preview-pdf.search-results-count': '{{count}} kết quả cho "{{term}}"',

// Empty / Loading / Error
'core.component.preview-pdf.empty.title':          'Không có tài liệu',
'core.component.preview-pdf.empty.subtitle':       'Chưa có file PDF nào để hiển thị',
'core.component.preview-pdf.loading':              'Đang tải tài liệu...',
'core.component.preview-pdf.loading.page':         'Đang xử lý trang {{current}} / {{total}}',
'core.component.preview-pdf.error.invalid.title':  'Không tải được tài liệu',
'core.component.preview-pdf.error.invalid.body':   'File PDF có thể bị hỏng. Vui lòng kiểm tra lại file.',
'core.component.preview-pdf.error.password.title': 'Tài liệu được bảo vệ',
'core.component.preview-pdf.error.password.body':  'File PDF này yêu cầu mật khẩu để mở.',
'core.component.preview-pdf.error.network.title':  'Không kết nối được',
'core.component.preview-pdf.error.network.body':   'Không thể tải file từ máy chủ. Vui lòng thử lại sau.',
'core.component.preview-pdf.error.unknown.title':  'Đã có lỗi xảy ra',
'core.component.preview-pdf.error.unknown.body':   'Vui lòng thử lại hoặc tải file gốc về để xem.',
'core.component.preview-pdf.error.retry':          'Thử lại',
'core.component.preview-pdf.error.download-raw':   'Tải file gốc',
```

Vietnamese strings above are the source of truth — translate to en/ja/ko/zh.

## Usage Examples (for the doc + smoke tests)

### 1. Simple URL preview
```html
<sd-preview-pdf #pdf></sd-preview-pdf>

<sd-button
  type="link" color="primary" prefixIcon="picture_as_pdf"
  title="Xem hợp đồng"
  (click)="pdf.open(row.contractUrl)">
</sd-button>
```

### 2. From file picker
```html
<sd-preview-pdf #pdf></sd-preview-pdf>

<input type="file" accept="application/pdf"
  (change)="pdf.open($any($event.target).files[0])" />
```

### 3. Auth-gated URL with custom headers
```ts
@ViewChild('pdf') pdf!: SdPreviewPdf;

openSecure(id: string) {
  this.pdf.open({
    url: `/api/documents/${id}/download`,
    httpHeaders: { Authorization: `Bearer ${this.token}` },
    withCredentials: true,
  }, { startPage: 1, title: 'Hợp đồng nội bộ' });
}
```

### 4. Listening to events
```html
<sd-preview-pdf
  #pdf
  (loaded)="onLoaded($event)"
  (pageChange)="trackPage($event)"
  (download)="logDownload($event)"
  (loadError)="onLoadError($event)"
  (close)="onClosed()">
</sd-preview-pdf>
```

## Files to Create / Modify

```
sd-angular/components/preview/src/preview-pdf/
  preview-pdf.component.ts            CREATE
  preview-pdf.component.html          CREATE
  preview-pdf.component.scss          CREATE
  preview-pdf.types.ts                CREATE
  preview-pdf.component.spec.ts       CREATE (basic render + open + close tests)
sd-angular/components/preview/
  index.ts                            MODIFY  — add export
  sd-preview.md                       MODIFY  — add sd-preview-pdf section
sd-angular/i18n/src/{vi,en,ja,ko,zh}.ts  MODIFY — add new keys
sd-angular/assets/pdf.worker.min.mjs   ADD    — bundled PDF.js worker
sd-angular/package.json                MODIFY  — add pdfjs-dist dep
```

## Implementation Order Suggested

1. **Setup**: add `pdfjs-dist` dep, ship the worker as an asset, register `GlobalWorkerOptions.workerSrc` in the component's static initializer or a forRoot provider.
2. **Types & API skeleton**: `preview-pdf.types.ts` + class shape with all `@Input()`/`@Output()` and stub methods.
3. **Static layout**: recreate artboards A, C, E (default + variants) — sidebar + stage + toolbar + header — no PDF engine yet, just static UI.
4. **Engine wiring**: hook `open()` → `pdfjs.getDocument()` → render first page to canvas + text layer.
5. **Page nav**: prev/next/jump/keyboard, page input.
6. **Zoom & rotate**: setZoom modes, mouse wheel + Ctrl, pinch gesture.
7. **Sidebar — thumbnails**: render mini-canvases lazily.
8. **Sidebar — outline**: `pdfDoc.getOutline()` → recursive tree.
9. **Search**: `pdfFindController` wiring, search bar UI, sidebar result list, highlight active match.
10. **Continuous scroll mode**: virtualized rendering.
11. **Download / print / fullscreen / annotations / link clicks**.
12. **States**: loading progress, error variants (invalid / password / network), empty.
13. **i18n + a11y polish**.
14. **Document `sd-preview.md`** + add the four usage examples above.

## Definition of Done

- All 9 artboards (A–I) reproduced visually in the running Angular component.
- All public API methods work as documented.
- Outputs fire at the right moments.
- Keyboard, wheel-zoom, pinch-zoom, swipe, text-selection all functional.
- Search highlights Vietnamese text correctly (test with diacritics like "thanh toán" / "đặt cọc").
- Continuous scroll virtualizes properly (only ±1 page rendered around viewport).
- Memory clean on close (verify `pdfDoc.destroy()` is called; no growing canvas count).
- No PDF.js worker errors in console.
- OnPush change detection respected (use signals).
- Doc `sd-preview.md` updated with the new section.

---

**Questions to ask if anything below is unclear**:
- Should `pdfjs-dist` be a peer dependency (consumer apps install it) or a regular dependency (we bundle a specific version)?
- Where should the PDF.js worker file be served from in production builds? Library asset, or app-level asset?
- Is there an existing print-styling convention in the design system to follow for `@media print`?
- Should password-protected PDFs prompt inline (in the component) or always emit `loadError` and let the host show a password modal?
