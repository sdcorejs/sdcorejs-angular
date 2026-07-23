import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@sdcorejs/angular/i18n';
import {
  PdfErrorEvent,
  PdfErrorReason,
  PdfLoadEvent,
  PdfMeta,
  PdfOutlineItem,
  PdfScrollMode,
  PdfSearchResult,
  PdfSearchState,
  PdfSidebarMode,
  PdfSource,
  PdfStage,
  PdfZoomMode,
  PreviewTheme,
} from './preview-pdf.types';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SD_PDF_BROWSER_ADAPTER } from './preview-pdf.browser';
import { SD_PDF_PRINT_ADAPTER, SdPdfPrintJob } from './preview-pdf.print';
import {
  SD_PDFJS_LIB,
  SdPdfDocumentProxy,
  SdPdfDocumentSpec,
  SdPdfLoadingTask,
  SdPdfPageProxy,
  SdPdfRawOutlineItem,
  SdPdfReference,
  SdPdfRenderTask,
  SdPdfViewport,
} from './preview-pdf.pdfjs';

export { SD_PDFJS_LIB } from './preview-pdf.pdfjs';
export type { SdPdfJsLib } from './preview-pdf.pdfjs';

let nextPdfPreviewInstanceId = 0;

interface PdfOutlineRow {
  readonly item: PdfOutlineItem;
  readonly level: number;
  readonly parentId: string | null;
}

interface PdfOutlineTraversal {
  nodes: number;
}

interface PdfPageTextScan {
  readonly snapshot: ReadonlyMap<number, string>;
  readonly staged: Map<number, string>;
}

interface PdfSearchRequest {
  readonly token: number;
  readonly doc: SdPdfDocumentProxy;
  readonly expression: RegExp;
  readonly resolve: (resultCount: number) => void;
}

type PdfThumbnailSlotState = 'new' | 'queued' | 'active' | 'released';

interface PdfThumbnailWork {
  readonly loadToken: number;
  cancelled: boolean;
  renderTask: SdPdfRenderTask | null;
  slotState: PdfThumbnailSlotState;
  resumeSlot: ((acquired: boolean) => void) | null;
}

class PdfHeightIndex {
  readonly #gap: number;
  #tree: number[] = [0];
  #values: number[] = [];

  constructor(gap: number) {
    this.#gap = gap;
  }

  reset(heights: readonly number[]): void {
    this.#values = heights.map((height, index) => height + (index < heights.length - 1 ? this.#gap : 0));
    this.#tree = Array.from({ length: this.#values.length + 1 }, () => 0);
    for (let index = 1; index < this.#tree.length; index++) {
      this.#tree[index] += this.#values[index - 1];
      const parent = index + (index & -index);
      if (parent < this.#tree.length) this.#tree[parent] += this.#tree[index];
    }
  }

  updateHeight(index: number, height: number): void {
    if (index < 0 || index >= this.#values.length) return;
    const next = height + (index < this.#values.length - 1 ? this.#gap : 0);
    const delta = next - this.#values[index];
    this.#values[index] = next;
    for (let cursor = index + 1; cursor < this.#tree.length; cursor += cursor & -cursor) this.#tree[cursor] += delta;
  }

  offsetAt(index: number): number {
    let sum = 0;
    for (let cursor = Math.max(0, Math.min(index, this.#values.length)); cursor > 0; cursor -= cursor & -cursor) {
      sum += this.#tree[cursor];
    }
    return sum;
  }

  total(): number {
    return this.offsetAt(this.#values.length);
  }

  indexAt(offset: number): number {
    if (this.#values.length === 0) return 0;
    const bounded = Math.max(0, Math.min(offset, this.total()));
    let index = 0;
    let prefix = 0;
    let bit = 1;
    while (bit * 2 < this.#tree.length) bit *= 2;
    for (; bit > 0; bit >>= 1) {
      const next = index + bit;
      if (next < this.#tree.length && prefix + this.#tree[next] <= bounded) {
        index = next;
        prefix += this.#tree[next];
      }
    }
    return Math.min(index, this.#values.length - 1);
  }
}

type PdfSidebarTabMode = Exclude<PdfSidebarMode, 'none'>;

@Component({
  selector: 'sd-preview-pdf',
  standalone: true,
  imports: [SdIcon, CommonModule, FormsModule, TranslatePipe],
  templateUrl: './preview-pdf.component.html',
  styleUrl: './preview-pdf.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // WHY tabindex='0': host phải focusable để @HostListener('keydown') nhận event
  // mà không cần bind document. Mirror the preview-image pattern — consumer
  // (modal/drawer/page) chỉ cần thả component vào DOM.
  host: {
    tabindex: '0',
    class: 'sd-preview-pdf-host',
    // WHY data-theme attribute: SCSS uses :host([data-theme="light"]) to swap
    // CSS custom properties — declarative, devtools-visible, no class-name
    // collision with consumer styling.
    '[attr.data-theme]': 'theme()',
    '[class.sd-preview-pdf-host--fullscreen]': 'isFullscreen()',
  },
})
export class SdPreviewPdf {
  // ==========================================
  // CONSTANTS
  // ==========================================
  // Dải zoom hữu dụng cho viewer PDF. Dưới 25% chữ thành chấm, trên 400% là
  // raster bị pixelated nặng (canvas + DPR vẫn có giới hạn). Trùng dải của
  // preview-image để consumer làm quen với 1 spec duy nhất.
  static readonly MIN_ZOOM = 0.25;
  static readonly MAX_ZOOM = 4;
  static readonly ZOOM_STEP = 0.1;
  static readonly OUTLINE_MAX_DEPTH = 64;
  static readonly OUTLINE_MAX_NODES = 10_000;
  static readonly MAX_SEARCH_RESULTS = 1000;
  static readonly MAX_PAGE_TEXT_CACHE_PAGES = 128;
  static readonly THUMBNAIL_WINDOW_SIZE = 48;
  static readonly THUMBNAIL_ITEM_HEIGHT = 220;
  static readonly MAX_THUMBNAIL_CACHE_ENTRIES = 96;
  private static readonly MAX_CONCURRENT_THUMBNAIL_WORK = 4;
  static readonly MAX_CANVAS_DIMENSION = 8192;
  static readonly MAX_CANVAS_PIXELS = 16_777_216;

  // ==========================================
  // DI
  // ==========================================
  readonly #hostEl = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #destroyRef = inject(DestroyRef);
  readonly #pdfjs = inject(SD_PDFJS_LIB);
  readonly #browser = inject(SD_PDF_BROWSER_ADAPTER);
  readonly #printAdapter = inject(SD_PDF_PRINT_ADAPTER);
  readonly #instanceId = `sd-preview-pdf-${++nextPdfPreviewInstanceId}`;

  // ==========================================
  // VIEW CHILDREN
  // WHY `protected readonly` (not `#private`): Angular's `viewChild()` query
  // function emits a decorator-equivalent metadata that the compiler can't
  // see through ES private fields (NG1053). `protected` keeps them invisible
  // to consumers but accessible to the template.
  // ==========================================
  protected readonly pageCanvasRef = viewChild<ElementRef<HTMLCanvasElement>>('pageCanvas');
  protected readonly stageEl = viewChild<ElementRef<HTMLElement>>('stageRef');
  protected readonly pageInputRef = viewChild<ElementRef<HTMLInputElement>>('pageInput');
  protected readonly searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  protected readonly sidebarContentRef = viewChild<ElementRef<HTMLElement>>('sidebarContent');
  protected readonly outlineItemRefs = viewChildren<ElementRef<HTMLElement>>('outlineItem');
  protected readonly sidebarTabRefs = viewChildren<ElementRef<HTMLButtonElement>>('sidebarTab');
  protected readonly continuousCanvases = viewChildren<ElementRef<HTMLCanvasElement>>('continuousCanvas');
  // Every thumbnail <canvas> in the sidebar — populated when sidebar is open +
  // mode==='thumbnails'. We feed these to the IntersectionObserver below so a
  // thumb only renders when it scrolls into the viewport (lazy fill).
  protected readonly thumbCanvases = viewChildren<ElementRef<HTMLCanvasElement>>('thumbCanvas');

  // ==========================================
  // INPUTS (signal-based, Angular 19 style)
  // ==========================================
  // autoId prefix `preview-pdf-`. Per-element child autoIds derive `${autoId}-{suffix}`.
  readonly autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  readonly autoId = computed(() => (this.autoIdInput() ? `components-preview-pdf-${this.autoIdInput()}` : undefined));

  readonly #childAutoId = (suffix: string): string | undefined => {
    return this.autoId() ? `${this.autoId()}-${suffix}` : undefined;
  };

  // Page navigation
  readonly autoIdFirst = computed(() => this.#childAutoId('first'));
  readonly autoIdPrev = computed(() => this.#childAutoId('prev'));
  readonly autoIdNext = computed(() => this.#childAutoId('next'));
  readonly autoIdLast = computed(() => this.#childAutoId('last'));
  readonly autoIdPageInput = computed(() => this.#childAutoId('page-input'));
  // Zoom
  readonly autoIdZoomIn = computed(() => this.#childAutoId('zoom-in'));
  readonly autoIdZoomOut = computed(() => this.#childAutoId('zoom-out'));
  readonly autoIdZoomReadout = computed(() => this.#childAutoId('zoom-readout'));
  // Modes
  readonly autoIdFitPage = computed(() => this.#childAutoId('fit-page'));
  readonly autoIdFitWidth = computed(() => this.#childAutoId('fit-width'));
  readonly autoIdRotate = computed(() => this.#childAutoId('rotate'));
  readonly autoIdScrollMode = computed(() => this.#childAutoId('scroll-mode'));
  // Header actions
  readonly autoIdSearchToggle = computed(() => this.#childAutoId('search'));
  readonly autoIdPrint = computed(() => this.#childAutoId('print'));
  readonly autoIdDownload = computed(() => this.#childAutoId('download'));
  readonly autoIdFullscreen = computed(() => this.#childAutoId('fullscreen'));
  readonly autoIdSidebarToggle = computed(() => this.#childAutoId('sidebar-toggle'));
  // Sidebar tabs
  readonly autoIdTabThumbnails = computed(() => this.#childAutoId('tab-thumbnails'));
  readonly autoIdTabOutline = computed(() => this.#childAutoId('tab-outline'));
  readonly autoIdTabSearch = computed(() => this.#childAutoId('tab-search'));
  readonly sidebarPanelId = computed(() => this.#childAutoId('sidebar-panel') ?? `${this.#instanceId}-sidebar-panel`);
  readonly sidebarRegionId = computed(() => this.#childAutoId('sidebar') ?? `${this.#instanceId}-sidebar`);
  readonly searchBarId = computed(() => this.#childAutoId('searchbar') ?? `${this.#instanceId}-searchbar`);
  readonly tabThumbnailsId = computed(() => this.#childAutoId('tab-thumbnails') ?? `${this.#instanceId}-tab-thumbnails`);
  readonly tabOutlineId = computed(() => this.#childAutoId('tab-outline') ?? `${this.#instanceId}-tab-outline`);
  readonly tabSearchId = computed(() => this.#childAutoId('tab-search') ?? `${this.#instanceId}-tab-search`);
  readonly sidebarActiveTabId = computed(() => {
    switch (this.#sidebarModeInternal()) {
      case 'outline':
        return this.tabOutlineId();
      case 'search':
        return this.tabSearchId();
      default:
        return this.tabThumbnailsId();
    }
  });
  // Search bar
  readonly autoIdSearchInput = computed(() => this.#childAutoId('search-input'));
  readonly autoIdSearchNext = computed(() => this.#childAutoId('search-next'));
  readonly autoIdSearchPrev = computed(() => this.#childAutoId('search-prev'));
  readonly autoIdSearchCase = computed(() => this.#childAutoId('search-case'));
  readonly autoIdSearchWhole = computed(() => this.#childAutoId('search-whole'));
  readonly autoIdSearchClose = computed(() => this.#childAutoId('search-close'));
  // Retry (error state)
  readonly autoIdRetry = computed(() => this.#childAutoId('retry'));
  // Per-index helpers (thumb + search result)
  readonly autoIdThumb = (i: number): string | undefined => this.#childAutoId(`thumb-${i}`);
  readonly autoIdResult = (i: number): string | undefined => this.#childAutoId(`result-${i}`);

  readonly source = input<PdfSource | null>(null);
  readonly title = input<string | undefined>(undefined);
  readonly startPage = input(1);
  readonly initialZoom = input<PdfZoomMode>('page-fit');
  readonly sidebar = input<PdfSidebarMode>('thumbnails');
  readonly sidebarOpen = input(true);
  readonly scrollMode = input<PdfScrollMode>('page');
  readonly showToolbar = input(true);
  readonly downloadable = input(true);
  readonly password = input<string | undefined>(undefined);
  readonly httpHeaders = input<Record<string, string> | undefined>(undefined);
  // Theme variant — drives [data-theme] host attribute. Default 'dark'
  // preserves the original visual contract; 'light' flips token set via SCSS.
  readonly theme = input<PreviewTheme>('dark');

  // ==========================================
  // OUTPUTS
  // ==========================================
  readonly close = output<void>();
  readonly loaded = output<PdfLoadEvent>();
  readonly pageChange = output<number>();
  readonly zoomChange = output<number>();
  readonly download = output<{ filename: string }>();
  readonly loadError = output<PdfErrorEvent>();
  // Fired whenever the search term, results, or active index changes — gives
  // the consumer a stable hook for analytics / sticky highlight bars without
  // poking at the internal state signal.
  readonly searchChange = output<{ term: string; total: number; current: number; truncated: boolean }>();

  // ==========================================
  // STATE (signals)
  // ==========================================
  readonly #stage = signal<PdfStage>('empty');
  readonly #pdfDoc = signal<SdPdfDocumentProxy | null>(null);
  readonly #meta = signal<PdfMeta | null>(null);
  readonly #activePage = signal(1);
  readonly #zoom = signal(1);
  readonly #zoomMode = signal<PdfZoomMode>('page-fit');
  readonly #rotation = signal(0);
  readonly #sidebarOpenInternal = signal(true);
  readonly #sidebarModeInternal = signal<PdfSidebarMode>('thumbnails');
  readonly #scrollModeInternal = signal<PdfScrollMode>('page');
  readonly #loadProgress = signal({ loaded: 0, total: 0 });
  readonly #loadError = signal<PdfErrorEvent | null>(null);
  readonly #isFullscreen = signal(false);
  readonly #filename = signal('document.pdf');
  readonly #fileSize = signal(0);
  readonly #continuousPages = signal<number[]>([]);
  readonly #continuousTopSpacer = signal(0);
  readonly #continuousBottomSpacer = signal(0);
  readonly #continuousHeightVersion = signal(0);
  readonly #thumbnailWindowStart = signal(0);
  readonly #outline = signal<readonly PdfOutlineItem[]>([]);
  readonly #outlineExpanded = signal<ReadonlySet<string>>(new Set<string>());
  readonly #outlineFocusId = signal<string | null>(null);

  // Thumbnail cache: page number → data URL of mini-render. Lazy-populated as
  // the user opens the sidebar / scrolls thumbnails into view.
  readonly #thumbCache = signal<Record<number, string>>({});
  readonly #thumbnailCacheLru = new Map<number, string>();

  // ==========================================
  // SEARCH STATE
  // ==========================================
  // Whether the search bar (between header + body) is visible. Toggled via
  // Ctrl+F, the sidebar tab, or `openSearch()` / `closeSearch()`. Independent
  // from the sidebar's `'search'` tab — the bar can stay open with the
  // sidebar closed (Ctrl+F flow), and the tab can be open without the bar.
  readonly #searchBarOpen = signal(false);
  // Persisted across `clearSearch()` so user toggles don't reset on each new
  // term — mirrors Acrobat / Chrome's "Find in page" behaviour.
  readonly #searchCaseSensitive = signal(false);
  readonly #searchWholeWord = signal(false);
  readonly #searchTerm = signal('');
  readonly #searchResults = signal<PdfSearchResult[]>([]);
  readonly #searchTruncated = signal(false);
  // -1 sentinel means "no result focused yet" (e.g. right after clearSearch
  // or before the first searchNext). Highlight rendering uses this to skip
  // the `--active` class altogether.
  readonly #searchActiveIndex = signal(-1);
  // Page-text cache: pageNum → fully-joined plain text. We pay the
  // `getTextContent()` cost once per page per document, then reuse across
  // re-runs (e.g. toggling case-sensitive). Cleared on every source change.
  readonly #pageTextCache = new Map<number, string>();
  readonly #pageTextCacheSize = signal(0);
  // Token to abort an in-flight `search()` call when a newer one supersedes it
  // — same pattern as #loadToken / #renderToken upstream.
  #searchToken = 0;
  #searchWorkerActive = false;
  #queuedSearchRequest: PdfSearchRequest | null = null;
  // The IntersectionObserver instance that drives lazy thumb rendering. Lives
  // for the component's lifetime; we just rebind to the latest canvas refs
  // when the sidebar tab switches.
  #thumbObserverCleanup: (() => void) | null = null;
  // Pages currently being rendered as thumbs — guards against double work
  // when a thumb scrolls in/out/in rapidly.
  readonly #thumbnailWork = new Map<number, PdfThumbnailWork>();
  readonly #thumbnailWorkCount = signal(0);
  readonly #thumbnailSlotQueue: PdfThumbnailWork[] = [];
  #activeThumbnailSlots = 0;
  readonly #continuousTasks = new Map<number, SdPdfRenderTask>();
  readonly #continuousReservations = new Map<number, { readonly generation: number }>();
  #continuousFrame: number | null = null;
  #layoutGeneration = 0;
  #pageHeights: number[] = [];
  readonly #heightIndex = new PdfHeightIndex(24);

  // Cached resolved source object that getDocument actually consumed — used
  // for download fallback when caller passed a non-URL source.
  // Track ALL blob URLs we created so we can revoke on source change + destroy.
  readonly #ownedBlobUrls = new Set<string>();

  // Race guards mirror preview-image's #loadToken pattern.
  #loadToken = 0;
  #currentLoadingTask: SdPdfLoadingTask | null = null;
  #currentRenderTask: SdPdfRenderTask | null = null;
  #currentPrintJob: SdPdfPrintJob | null = null;
  #printGeneration = 0;
  #downloadGeneration = 0;
  #renderToken = 0;
  #destroyed = false;

  // ==========================================
  // COMPUTED (template-readable)
  // ==========================================
  readonly stage = this.#stage.asReadonly();
  readonly activePage = this.#activePage.asReadonly();
  readonly zoom = this.#zoom.asReadonly();
  readonly zoomMode = this.#zoomMode.asReadonly();
  readonly rotation = this.#rotation.asReadonly();
  readonly sidebarMode = this.#sidebarModeInternal.asReadonly();
  readonly scrollModeCurrent = this.#scrollModeInternal.asReadonly();
  readonly isFullscreen = this.#isFullscreen.asReadonly();
  readonly meta = this.#meta.asReadonly();
  readonly filename = this.#filename.asReadonly();
  readonly fileSize = this.#fileSize.asReadonly();
  readonly loadError$ = this.#loadError.asReadonly();
  readonly thumbCache = this.#thumbCache.asReadonly();
  readonly thumbnailWorkCount = this.#thumbnailWorkCount.asReadonly();
  readonly pageTextCacheSize = this.#pageTextCacheSize.asReadonly();
  readonly continuousPages = this.#continuousPages.asReadonly();
  readonly continuousTopSpacer = this.#continuousTopSpacer.asReadonly();
  readonly continuousBottomSpacer = this.#continuousBottomSpacer.asReadonly();
  readonly continuousPageHeights = computed<Record<number, number>>(() => {
    this.#continuousHeightVersion();
    return Object.fromEntries(this.#continuousPages().map(page => [page, this.#pageHeights[page - 1] ?? 1]));
  });
  readonly outline = this.#outline.asReadonly();
  readonly outlineFocusId = this.#outlineFocusId.asReadonly();
  readonly visibleOutline = computed<readonly PdfOutlineRow[]>(() => {
    const rows: PdfOutlineRow[] = [];
    const expanded = this.#outlineExpanded();
    const visit = (items: readonly PdfOutlineItem[], level: number, parentId: string | null): void => {
      for (const item of items) {
        rows.push({ item, level, parentId });
        if (item.children.length > 0 && expanded.has(item.id)) visit(item.children, level + 1, item.id);
      }
    };
    visit(this.#outline(), 1, null);
    return rows;
  });

  readonly numPages = computed(() => this.#meta()?.numPages ?? 0);
  readonly canPrev = computed(() => this.#activePage() > 1);
  readonly canNext = computed(() => {
    const n = this.numPages();
    return n > 0 && this.#activePage() < n;
  });
  readonly zoomPercent = computed(() => Math.round(this.#zoom() * 100));
  readonly loadPercent = computed(() => {
    const p = this.#loadProgress();
    if (p.total <= 0) return 0;
    return Math.min(100, Math.round((p.loaded / p.total) * 100));
  });
  readonly isSidebarOpen = computed(() => this.#sidebarOpenInternal() && this.#sidebarModeInternal() !== 'none');
  readonly canDownload = computed(() => {
    const source = this.source();
    if (!this.downloadable() || !source) return false;
    if (this.#requiresLoadedDocumentBytes(source)) {
      return this.#browser.canDownloadBlob && this.#stage() === 'ready' && this.#pdfDoc() !== null;
    }
    if (typeof source === 'string' || ('url' in source && typeof source.url === 'string')) {
      return this.#browser.canDownloadUrl;
    }
    return this.#browser.canDownloadBlob;
  });
  readonly canFullscreen = computed(() => this.#browser.canFullscreen);
  readonly canPrint = computed(() => this.#printAdapter.isSupported && this.#stage() === 'ready' && this.#pdfDoc() !== null);
  readonly pageList = computed(() => {
    const n = this.numPages();
    return n > 0 ? Array.from({ length: n }, (_, i) => i + 1) : [];
  });
  // Alias used by the template's thumbnail @for — keeps the JSX-y `pageNumbers`
  // name from the design handoff while reusing the same computed.
  readonly pageNumbers = computed(() => {
    const count = this.numPages();
    const start = Math.max(0, Math.min(this.#thumbnailWindowStart(), Math.max(0, count - SdPreviewPdf.THUMBNAIL_WINDOW_SIZE)));
    const length = Math.min(SdPreviewPdf.THUMBNAIL_WINDOW_SIZE, count - start);
    return Array.from({ length }, (_, index) => start + index + 1);
  });
  readonly thumbnailTopSpacer = computed(() => this.#thumbnailWindowStart() * SdPreviewPdf.THUMBNAIL_ITEM_HEIGHT);
  readonly thumbnailBottomSpacer = computed(() => {
    const renderedEnd = this.#thumbnailWindowStart() + this.pageNumbers().length;
    return Math.max(0, this.numPages() - renderedEnd) * SdPreviewPdf.THUMBNAIL_ITEM_HEIGHT;
  });

  // Search readonly accessors for the template + tests. Read-only by design;
  // mutations go through `search()` / `searchNext()` etc.
  readonly searchBarOpen = this.#searchBarOpen.asReadonly();
  readonly searchTerm = this.#searchTerm.asReadonly();
  readonly searchResults = this.#searchResults.asReadonly();
  readonly searchActiveIndex = this.#searchActiveIndex.asReadonly();
  readonly searchCaseSensitive = this.#searchCaseSensitive.asReadonly();
  readonly searchWholeWord = this.#searchWholeWord.asReadonly();
  readonly searchTotal = computed(() => this.#searchResults().length);
  readonly searchTruncated = this.#searchTruncated.asReadonly();
  // 1-based "X of N" indicator for the search bar counter. Reads 0 when
  // there are no results so the template can hide / dim the counter.
  readonly searchCurrent = computed(() => {
    const idx = this.#searchActiveIndex();
    return idx < 0 ? 0 : idx + 1;
  });
  // Currently-active hit (or null when nothing is focused) — drives the
  // in-page `<mark class="--active">` highlight + auto-scroll effect below.
  readonly searchActiveResult = computed<PdfSearchResult | null>(() => {
    const idx = this.#searchActiveIndex();
    const results = this.#searchResults();
    return idx >= 0 && idx < results.length ? results[idx] : null;
  });
  // Snapshot of the full search state — handed to consumer via
  // `getSearchState()` for parity with `searchChange` event shape.
  readonly searchState = computed<PdfSearchState>(() => ({
    term: this.#searchTerm(),
    caseSensitive: this.#searchCaseSensitive(),
    wholeWord: this.#searchWholeWord(),
    results: this.#searchResults(),
    activeIndex: this.#searchActiveIndex(),
    truncated: this.#searchTruncated(),
  }));

  // ==========================================
  // CONSTRUCTOR — declarative wiring
  // ==========================================
  constructor() {
    // Initialize internal mirrors from inputs once. WHY mirrors: user actions
    // (toggleSidebar / setSidebarMode / setZoom) must modify state that the
    // template reads; signal inputs are read-only.
    effect(() => {
      this.#sidebarOpenInternal.set(this.sidebarOpen());
    });
    effect(() => {
      const m = this.sidebar();
      this.#sidebarModeInternal.set(m);
    });
    let previousScrollModeInput: PdfScrollMode | undefined;
    effect(() => {
      const m = this.scrollMode();
      if (m === previousScrollModeInput) return;
      previousScrollModeInput = m;
      this.#scrollModeInternal.set(m);
      queueMicrotask(() => this.#onScrollModeChanged());
    });
    effect(() => {
      // Reset zoom mode when initialZoom input changes — only fires when the
      // input itself updates (not when user clicks zoom +/-).
      this.#zoomMode.set(this.initialZoom());
    });

    const removeFullscreenListener = this.#browser.listenFullscreen(this.#hostEl.nativeElement, active => {
      if (!this.#destroyed) this.#isFullscreen.set(active);
    });

    // React to source changes — destroy previous doc, load new one.
    // WHY untracked-via-queueMicrotask: `effect()` tracks every signal READ
    // sync-ly inside the callback. `#loadDocument` reads internal signals
    // (#pdfDoc via #destroyDoc, plus #zoom on the cleanup path). Letting the
    // effect track those would re-fire whenever we updated them inside the
    // load flow → infinite loop. Reading only `source()` here and deferring
    // the actual load to a microtask scopes the tracking to ONLY `source()`.
    effect(() => {
      const src = this.source();
      queueMicrotask(() => this.#loadDocument(src));
    });

    // Auto-focus host after first render so keyboard works immediately.
    afterNextRender(() => {
      if (!this.#browser.isBrowser || this.#destroyed) return;
      try {
        this.#hostEl.nativeElement.focus({ preventScroll: true });
      } catch {
        // ignore — focus() can throw on detached elements.
      }
    });

    // Drive lazy thumbnail rendering — every time the list of thumbnail
    // <canvas> refs changes (sidebar opens, mode flips, doc reloads) we
    // disconnect any prior observer and start watching the new set.
    // WHY effect (not afterNextRender): viewChildren() emits a signal that
    // updates whenever the template's @for collection mutates.
    effect(() => {
      const refs = this.thumbCanvases();
      this.#syncThumbObserver(refs.map(r => r.nativeElement));
    });

    effect(() => {
      const refs = this.continuousCanvases();
      this.#scheduleContinuousRenders(refs.map(ref => ref.nativeElement));
    });

    effect(onCleanup => {
      const stage = this.stageEl()?.nativeElement;
      if (!stage) return;
      const cleanup = this.#browser.observeResize(stage, () => {
        if (this.#destroyed || this.#stage() !== 'ready') return;
        if (this.#scrollModeInternal() === 'continuous') this.#invalidateContinuousLayout();
        else void this.#renderActivePage();
      });
      onCleanup(cleanup);
    });

    // Re-apply highlights when the rendered page changes OR when the search
    // term / active hit changes. WHY a separate effect: text-layer overlay
    // doesn't exist in this commit, so we hook the page canvas wrapper and
    // sprinkle `<mark>` siblings via DOM. Effect re-runs are cheap; the
    // helper is a no-op when there's nothing to highlight.
    effect(() => {
      // Track these signals so the effect re-fires:
      this.#searchTerm();
      this.#searchActiveIndex();
      this.activePage();
      // Defer to a microtask so the canvas render finished writing — keeps
      // us out of the page render's await chain.
      queueMicrotask(() => this.#applyHighlightsForActivePage());
    });

    // Cleanup on destroy.
    this.#destroyRef.onDestroy(() => {
      this.#destroyed = true;
      this.#loadToken++;
      this.#searchToken++;
      this.#cancelQueuedSearch();
      this.#downloadGeneration++;
      this.#renderToken++;
      this.#cancelLoadingTask();
      this.#cancelRender();
      this.#cancelContinuousRenders();
      this.#cancelThumbnailRenders();
      this.#cancelPrint();
      this.#destroyDoc();
      this.#revokeAllBlobs();
      this.#thumbObserverCleanup?.();
      this.#thumbObserverCleanup = null;
      this.#thumbnailCacheLru.clear();
      this.#clearPageTextCache();
      removeFullscreenListener();
    });
  }

  // ==========================================
  // PUBLIC API
  // ==========================================

  goToPage(page: number): void {
    const n = this.numPages();
    if (n <= 0) return;
    const target = Math.max(1, Math.min(page, n));
    const changed = target !== this.#activePage();
    if (changed) {
      this.#activePage.set(target);
      this.pageChange.emit(target);
    }
    this.#ensureThumbnailPageVisible(target);
    if (this.#scrollModeInternal() === 'continuous') {
      this.#positionContinuousPage(target);
    } else if (changed) {
      void this.#renderActivePage();
    }
  }

  nextPage(): void {
    this.goToPage(this.#activePage() + 1);
  }
  prevPage(): void {
    this.goToPage(this.#activePage() - 1);
  }
  firstPage(): void {
    this.goToPage(1);
  }
  lastPage(): void {
    this.goToPage(this.numPages());
  }

  zoomIn(): void {
    this.#zoomMode.set(this.#zoom() + SdPreviewPdf.ZOOM_STEP);
    this.#setZoom(this.#zoom() + SdPreviewPdf.ZOOM_STEP);
  }

  zoomOut(): void {
    this.#zoomMode.set(this.#zoom() - SdPreviewPdf.ZOOM_STEP);
    this.#setZoom(this.#zoom() - SdPreviewPdf.ZOOM_STEP);
  }

  setZoom(mode: PdfZoomMode): void {
    this.#zoomMode.set(mode);
    if (typeof mode === 'number') {
      this.#setZoom(mode);
    } else {
      if (this.#scrollModeInternal() === 'continuous') this.#invalidateContinuousLayout();
      else void this.#renderActivePage();
    }
  }

  rotate(direction: 'left' | 'right'): void {
    const delta = direction === 'right' ? 90 : -90;
    this.#rotation.update(r => (((r + delta) % 360) + 360) % 360);
    if (this.#scrollModeInternal() === 'continuous') this.#invalidateContinuousLayout();
    else void this.#renderActivePage();
  }

  toggleSidebar(): void {
    this.#sidebarOpenInternal.update(v => !v);
  }

  setSidebarMode(mode: PdfSidebarMode): void {
    this.#sidebarModeInternal.set(mode);
    if (mode !== 'none' && !this.#sidebarOpenInternal()) {
      this.#sidebarOpenInternal.set(true);
    }
    // Selecting the 'search' tab implicitly opens the search bar so the user
    // can start typing right away — matches Acrobat's flyout behaviour.
    if (mode === 'search') {
      this.openSearch();
    }
  }

  onSidebarTabKeyDown(event: KeyboardEvent, currentMode: PdfSidebarTabMode): void {
    const modes: readonly PdfSidebarTabMode[] = ['thumbnails', 'outline', 'search'];
    const currentIndex = modes.indexOf(currentMode);
    let targetIndex: number;
    switch (event.key) {
      case 'ArrowRight':
        targetIndex = (currentIndex + 1) % modes.length;
        break;
      case 'ArrowLeft':
        targetIndex = (currentIndex - 1 + modes.length) % modes.length;
        break;
      case 'Home':
        targetIndex = 0;
        break;
      case 'End':
        targetIndex = modes.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
    const target = modes[targetIndex];
    this.setSidebarMode(target);
    queueMicrotask(() => {
      const tab = this.sidebarTabRefs().find(ref => ref.nativeElement.dataset['sidebarMode'] === target);
      tab?.nativeElement.focus();
    });
  }

  onThumbnailSidebarScroll(event: Event): void {
    if (this.#sidebarModeInternal() !== 'thumbnails') return;
    const element = event.currentTarget as HTMLElement | null;
    if (!element) return;
    const firstVisible = Math.floor(element.scrollTop / SdPreviewPdf.THUMBNAIL_ITEM_HEIGHT);
    const start = Math.max(0, Math.min(firstVisible - 8, Math.max(0, this.numPages() - SdPreviewPdf.THUMBNAIL_WINDOW_SIZE)));
    this.#thumbnailWindowStart.set(start);
  }

  setScrollMode(mode: PdfScrollMode): void {
    if (this.#scrollModeInternal() === mode) return;
    this.#scrollModeInternal.set(mode);
    this.#onScrollModeChanged();
  }

  downloadFile(): void {
    void this.downloadFileAsync();
  }

  async downloadFileAsync(): Promise<boolean> {
    const generation = ++this.#downloadGeneration;
    if (!this.canDownload() || this.#destroyed) return false;
    const src = this.source();
    if (!src) return false;
    const filename = this.#filename();
    const doc = this.#pdfDoc();

    let href: string | null = null;
    let temporaryHref: string | null = null;
    if (this.#requiresLoadedDocumentBytes(src)) {
      if (!doc) return false;
      let data: Uint8Array;
      try {
        data = new Uint8Array(await doc.getData());
      } catch {
        return false;
      }
      if (!this.#isCurrentDownload(generation, src, doc)) return false;
      const blob = this.#browser.createPdfBlob(data);
      href = blob ? this.#browser.createObjectUrl(blob) : null;
      temporaryHref = this.#trackTemporaryDownloadUrl(href);
    } else if (typeof src === 'string') {
      href = src;
    } else if (this.#browser.isFile(src) || this.#browser.isBlob(src)) {
      href = this.#browser.createObjectUrl(src);
      temporaryHref = this.#trackTemporaryDownloadUrl(href);
    } else if (src && typeof src === 'object' && 'url' in src && typeof src.url === 'string') {
      href = src.url;
    } else if (src instanceof ArrayBuffer || src instanceof Uint8Array || (src && typeof src === 'object' && 'data' in src)) {
      const raw = src instanceof ArrayBuffer || src instanceof Uint8Array ? src : src.data;
      const data = raw instanceof Uint8Array ? new Uint8Array(raw) : new Uint8Array(raw.slice(0));
      const blob = this.#browser.createPdfBlob(data);
      href = blob ? this.#browser.createObjectUrl(blob) : null;
      temporaryHref = this.#trackTemporaryDownloadUrl(href);
    }

    if (!href || !this.#isCurrentDownload(generation, src, doc)) {
      if (temporaryHref) this.#scheduleTemporaryDownloadUrlRelease(temporaryHref);
      return false;
    }
    const downloaded = this.#browser.download(href, filename);
    if (temporaryHref) this.#scheduleTemporaryDownloadUrlRelease(temporaryHref);
    if (downloaded && !this.#destroyed) this.download.emit({ filename });
    return downloaded;
  }

  toggleFullscreen(): void {
    if (!this.canFullscreen()) return;
    void this.#browser.toggleFullscreen(this.#hostEl.nativeElement).catch(() => undefined);
  }

  /** Programmatic equivalent of clicking the X — emits the close output. */
  requestClose(): void {
    this.close.emit();
  }

  /** Retry the active load attempt (called from the error state retry button). */
  retryLoad(): void {
    this.#loadDocument(this.source());
  }

  printFile(): void {
    void this.print();
  }

  async print(): Promise<void> {
    const generation = ++this.#printGeneration;
    this.#cancelPrintJob();
    const doc = this.#pdfDoc();
    if (!doc || this.#destroyed || !this.canPrint()) return;
    const loadToken = this.#loadToken;
    let data: Uint8Array;
    try {
      data = new Uint8Array(await doc.getData());
    } catch {
      return;
    }
    if (generation !== this.#printGeneration || !this.#isActiveLoad(loadToken) || this.#pdfDoc() !== doc) return;
    const job = this.#printAdapter.start(data, this.#filename());
    if (!job) return;
    this.#currentPrintJob = job;
    try {
      await job.finished;
    } catch {
      job.cancel();
    } finally {
      if (this.#currentPrintJob === job) this.#currentPrintJob = null;
    }
  }

  isOutlineExpanded(id: string): boolean {
    return this.#outlineExpanded().has(id);
  }

  toggleOutlineItem(id: string, event?: Event): void {
    event?.stopPropagation();
    const item = this.#findOutlineItem(id);
    if (!item || item.children.length === 0) {
      this.#outlineFocusId.set(id);
      return;
    }
    this.#outlineExpanded.update(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    this.#outlineFocusId.set(id);
  }

  focusOutlineItem(id: string): void {
    this.#outlineFocusId.set(id);
  }

  activateOutlineItem(id: string): void {
    const item = this.#findOutlineItem(id);
    if (!item) return;
    this.#outlineFocusId.set(id);
    if (item.page !== null) {
      this.goToPage(item.page);
      return;
    }
    if (item.children.length > 0) this.toggleOutlineItem(id);
  }

  onOutlineKeyDown(event: KeyboardEvent, id: string): void {
    const rows = this.visibleOutline();
    const index = rows.findIndex(row => row.item.id === id);
    if (index < 0) return;
    const row = rows[index];
    const item = row.item;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.#focusOutlineRow(rows[Math.min(rows.length - 1, index + 1)].item.id);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.#focusOutlineRow(rows[Math.max(0, index - 1)].item.id);
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (item.children.length === 0) break;
        if (!this.isOutlineExpanded(id)) this.toggleOutlineItem(id);
        else this.#focusOutlineRow(item.children[0].id);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (item.children.length > 0 && this.isOutlineExpanded(id)) this.toggleOutlineItem(id);
        else if (row.parentId) this.#focusOutlineRow(row.parentId);
        break;
      case 'Home':
        event.preventDefault();
        this.#focusOutlineRow(rows[0].item.id);
        break;
      case 'End':
        event.preventDefault();
        this.#focusOutlineRow(rows[rows.length - 1].item.id);
        break;
      case 'Enter':
      case ' ':
        if (item.url && item.page === null) break;
        event.preventDefault();
        this.activateOutlineItem(id);
        break;
      default:
        break;
    }
  }

  /**
   * Run a full-document search for `term`. Returns the result count.
   *
   * Options:
   * - `caseSensitive`: default off; matches independent of capitalisation.
   * - `wholeWord`: default off; requires Unicode word-boundary on both sides
   *   so `cat` does NOT match `category` (uses `/\b...\b/u` so Vietnamese
   *   diacritic-bearing letters still participate as word characters).
   *
   * Implementation: iterate every page once (cached), build a flat plain-text
   * string per page (joining textItem.str), and slice ~30 chars of context
   * around each match. We deliberately use plain JS regex rather than
   * pdf.js's `pdfFindController` — it's <40 lines, fully testable, and
   * sidesteps the find-controller's dependency on a real text layer (which
   * we don't render).
   */
  async search(term: string, options?: { caseSensitive?: boolean; wholeWord?: boolean }): Promise<number> {
    const token = ++this.#searchToken;
    const cleanTerm = (term ?? '').trim().normalize('NFC');
    if (options?.caseSensitive !== undefined) {
      this.#searchCaseSensitive.set(options.caseSensitive);
    }
    if (options?.wholeWord !== undefined) {
      this.#searchWholeWord.set(options.wholeWord);
    }
    this.#searchTerm.set(cleanTerm);
    this.#searchTruncated.set(false);

    if (!cleanTerm) {
      this.#cancelQueuedSearch();
      this.#searchResults.set([]);
      this.#searchActiveIndex.set(-1);
      this.#emitSearchChange();
      return 0;
    }

    const doc = this.#pdfDoc();
    if (!doc) {
      this.#cancelQueuedSearch();
      this.#searchResults.set([]);
      this.#searchActiveIndex.set(-1);
      this.#emitSearchChange();
      return 0;
    }

    const re = this.#buildSearchRegex(cleanTerm, this.#searchCaseSensitive(), this.#searchWholeWord());
    if (!re) {
      this.#cancelQueuedSearch();
      this.#searchResults.set([]);
      this.#searchActiveIndex.set(-1);
      this.#emitSearchChange();
      return 0;
    }

    return new Promise<number>(resolve => {
      this.#enqueueSearchRequest({ token, doc, expression: re, resolve });
    });
  }

  async #executeSearchRequest(request: PdfSearchRequest): Promise<number> {
    const { token, doc, expression } = request;
    const results: PdfSearchResult[] = [];
    const textScan: PdfPageTextScan = {
      snapshot: new Map(this.#pageTextCache),
      staged: new Map<number, string>(),
    };
    pageLoop: for (let p = 1; p <= doc.numPages; p++) {
      if (token !== this.#searchToken) return 0; // newer search superseded us
      const text = await this.#getPageText(doc, p, token, textScan);
      if (token !== this.#searchToken) return 0;
      // re is /g — must be re-created or `lastIndex` reset between pages.
      expression.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = expression.exec(text)) !== null) {
        const start = m.index;
        const matched = m[0];
        const end = start + matched.length;
        const before = text.slice(Math.max(0, start - 30), start);
        const after = text.slice(end, end + 30);
        if (results.length >= SdPreviewPdf.MAX_SEARCH_RESULTS) {
          this.#searchTruncated.set(true);
          break pageLoop;
        }
        results.push({ page: p, before, term: matched, after });
        // Defensive: zero-length match would loop forever.
        if (matched.length === 0) expression.lastIndex++;
      }
    }

    if (token !== this.#searchToken) return 0;
    this.#commitPageTextScan(textScan);
    this.#searchResults.set(results);
    // Activate the first result so the user sees something immediately;
    // tests can assert this via `searchActiveIndex()`. Skip when empty.
    this.#searchActiveIndex.set(results.length > 0 ? 0 : -1);
    if (results.length > 0) {
      // Auto-jump to the first hit's page.
      this.goToPage(results[0].page);
    }
    this.#emitSearchChange();
    return results.length;
  }

  #enqueueSearchRequest(request: PdfSearchRequest): void {
    if (this.#searchWorkerActive) {
      this.#queuedSearchRequest?.resolve(0);
      this.#queuedSearchRequest = request;
      return;
    }
    this.#searchWorkerActive = true;
    void this.#drainSearchRequests(request);
  }

  async #drainSearchRequests(initial: PdfSearchRequest): Promise<void> {
    let request: PdfSearchRequest | null = initial;
    while (request) {
      let resultCount = 0;
      try {
        resultCount = await this.#executeSearchRequest(request);
      } catch {
        resultCount = 0;
      }
      request.resolve(resultCount);
      request = this.#queuedSearchRequest;
      this.#queuedSearchRequest = null;
    }
    this.#searchWorkerActive = false;
  }

  #cancelQueuedSearch(): void {
    this.#queuedSearchRequest?.resolve(0);
    this.#queuedSearchRequest = null;
  }

  searchNext(): void {
    const results = this.#searchResults();
    if (results.length === 0) return;
    const next = (this.#searchActiveIndex() + 1) % results.length;
    this.#searchActiveIndex.set(next);
    this.goToPage(results[next].page);
    this.#emitSearchChange();
  }

  searchPrev(): void {
    const results = this.#searchResults();
    if (results.length === 0) return;
    const cur = this.#searchActiveIndex();
    const prev = cur <= 0 ? results.length - 1 : cur - 1;
    this.#searchActiveIndex.set(prev);
    this.goToPage(results[prev].page);
    this.#emitSearchChange();
  }

  activateSearchResult(index: number): void {
    const result = this.#searchResults()[index];
    if (!result) return;
    this.#searchActiveIndex.set(index);
    this.goToPage(result.page);
    this.#emitSearchChange();
  }

  clearSearch(): void {
    this.#searchToken++;
    this.#cancelQueuedSearch();
    this.#searchTerm.set('');
    this.#searchResults.set([]);
    this.#searchActiveIndex.set(-1);
    this.#searchTruncated.set(false);
    this.#emitSearchChange();
  }

  /** Open the search bar and focus its input. Idempotent. */
  openSearch(): void {
    this.#searchBarOpen.set(true);
    // Defer focus a tick so the *ngIf-rendered input exists in the DOM.
    queueMicrotask(() => {
      this.searchInputRef()?.nativeElement?.focus();
      this.searchInputRef()?.nativeElement?.select();
    });
  }

  /** Close the search bar AND clear results (mirrors Acrobat behaviour). */
  closeSearch(): void {
    this.#searchBarOpen.set(false);
    this.clearSearch();
  }

  toggleSearchCaseSensitive(): void {
    this.#searchCaseSensitive.update(v => !v);
    // Re-run with the persisted term so the result set reflects the new flag.
    if (this.#searchTerm()) {
      void this.search(this.#searchTerm());
    }
  }

  toggleSearchWholeWord(): void {
    this.#searchWholeWord.update(v => !v);
    if (this.#searchTerm()) {
      void this.search(this.#searchTerm());
    }
  }

  /** Live binding from the search bar's `(input)` event. */
  onSearchInput(event: Event): void {
    const target = event.target;
    if (!target || typeof target !== 'object' || !('value' in target) || typeof target.value !== 'string') return;
    void this.search(target.value);
  }

  // ==========================================
  // KEYBOARD — bound to HOST (not document)
  // ==========================================
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const isSearchInput = !!target && target === this.searchInputRef()?.nativeElement;
    const isOtherEditable =
      !!target && !isSearchInput && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

    // Ctrl/Cmd+F: open the search bar from anywhere (even when input has
    // focus, e.g. re-focus the search bar from the page input). Handled
    // before the input-target guard so it always works.
    if ((event.ctrlKey || event.metaKey) && (event.key === 'f' || event.key === 'F')) {
      event.preventDefault();
      this.openSearch();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && (event.key === 'p' || event.key === 'P') && this.canPrint()) {
      event.preventDefault();
      this.printFile();
      return;
    }

    // Keys while the search input is focused: Enter / Shift+Enter, F3 / Shift+F3
    // cycle results; Esc closes the bar. Everything else (typing) passes through.
    if (isSearchInput) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.closeSearch();
        // Re-focus the host so subsequent shortcuts work without a click.
        this.#hostEl.nativeElement.focus();
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        if (event.shiftKey) {
          this.searchPrev();
        } else {
          this.searchNext();
        }
        return;
      }
      if (event.key === 'F3') {
        event.preventDefault();
        if (event.shiftKey) {
          this.searchPrev();
        } else {
          this.searchNext();
        }
        return;
      }
      return; // typing → let it pass through
    }

    // Other editable targets (page-number input etc.) shouldn't trigger
    // viewer shortcuts — but Esc should still close an open search bar.
    if (isOtherEditable) {
      if (event.key === 'Escape' && this.#searchBarOpen()) {
        event.preventDefault();
        this.closeSearch();
      }
      return;
    }

    // F3 outside the search input still cycles results (matches browser
    // Find-in-page convention). Only meaningful when the bar is open OR
    // there are stale results — we keep it ungated for parity.
    if (event.key === 'F3') {
      event.preventDefault();
      if (event.shiftKey) {
        this.searchPrev();
      } else {
        this.searchNext();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowLeft':
      case 'PageUp':
        event.preventDefault();
        this.prevPage();
        break;
      case 'ArrowRight':
      case 'PageDown':
        event.preventDefault();
        this.nextPage();
        break;
      case 'Home':
        event.preventDefault();
        this.firstPage();
        break;
      case 'End':
        event.preventDefault();
        this.lastPage();
        break;
      case '+':
      case '=':
        event.preventDefault();
        this.zoomIn();
        break;
      case '-':
        event.preventDefault();
        this.zoomOut();
        break;
      case '0':
        event.preventDefault();
        this.setZoom('page-fit');
        break;
      case 'r':
        event.preventDefault();
        this.rotate('right');
        break;
      case 'R':
        event.preventDefault();
        this.rotate('left');
        break;
      case 'f':
        event.preventDefault();
        this.toggleFullscreen();
        break;
      case 'Escape':
        // Esc closes the search bar (when open). NEVER emits `close` on the
        // component — that remains the consumer's responsibility per the
        // standalone-embed pattern.
        if (this.#searchBarOpen()) {
          event.preventDefault();
          this.closeSearch();
        }
        break;
      default:
        break;
    }
  }

  // ==========================================
  // TEMPLATE HANDLERS
  // ==========================================

  onPageInputEnter(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);
    if (Number.isFinite(value)) {
      this.goToPage(value);
    }
    // Snap input back to the actual current page after clamping.
    input.value = String(this.#activePage());
  }

  onPageInputBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = String(this.#activePage());
  }

  onWheel(event: WheelEvent): void {
    // Ctrl/Cmd + wheel = zoom (mirrors PDF readers + most image viewers).
    // Plain wheel = let browser scroll the stage (especially when zoomed in).
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1 + SdPreviewPdf.ZOOM_STEP : 1 - SdPreviewPdf.ZOOM_STEP;
      this.#zoomMode.set(this.#zoom() * factor);
      this.#setZoom(this.#zoom() * factor);
    }
  }

  trackByPage(_i: number, page: number): number {
    return page;
  }

  // ==========================================
  // INTERNALS
  // ==========================================

  #findOutlineItem(id: string, items: readonly PdfOutlineItem[] = this.#outline()): PdfOutlineItem | null {
    for (const item of items) {
      if (item.id === id) return item;
      const nested = this.#findOutlineItem(id, item.children);
      if (nested) return nested;
    }
    return null;
  }

  #focusOutlineRow(id: string): void {
    this.#outlineFocusId.set(id);
    queueMicrotask(() => {
      if (this.#destroyed) return;
      const ref = this.outlineItemRefs().find(candidate => candidate.nativeElement.dataset['outlineId'] === id);
      ref?.nativeElement.focus();
    });
  }

  #setOutline(items: readonly PdfOutlineItem[]): void {
    const expanded = new Set<string>();
    const collect = (nodes: readonly PdfOutlineItem[]): void => {
      for (const item of nodes) {
        if (item.children.length > 0) expanded.add(item.id);
        collect(item.children);
      }
    };
    collect(items);
    this.#outline.set(items);
    this.#outlineExpanded.set(expanded);
    this.#outlineFocusId.set(items[0]?.id ?? null);
  }

  async #loadOutline(doc: SdPdfDocumentProxy, token: number): Promise<readonly PdfOutlineItem[] | null> {
    let rawItems: readonly SdPdfRawOutlineItem[] | null;
    try {
      rawItems = await doc.getOutline();
    } catch {
      return this.#isActiveLoad(token) ? [] : null;
    }
    if (!this.#isActiveLoad(token)) return null;
    return this.#resolveOutlineItems(doc, rawItems ?? [], token, [], 0, { nodes: 0 }, new Set<object>());
  }

  async #resolveOutlineItems(
    doc: SdPdfDocumentProxy,
    rawItems: readonly SdPdfRawOutlineItem[],
    token: number,
    parentPath: readonly number[],
    depth: number,
    traversal: PdfOutlineTraversal,
    ancestors: ReadonlySet<object>
  ): Promise<readonly PdfOutlineItem[] | null> {
    const items: PdfOutlineItem[] = [];
    if (depth >= SdPreviewPdf.OUTLINE_MAX_DEPTH) return items;
    for (let index = 0; index < rawItems.length; index++) {
      if (!this.#isActiveLoad(token)) return null;
      const raw = rawItems[index];
      if (!raw || typeof raw !== 'object' || ancestors.has(raw)) continue;
      if (traversal.nodes >= SdPreviewPdf.OUTLINE_MAX_NODES) break;
      traversal.nodes++;
      const path = [...parentPath, index];
      const page = await this.#resolveOutlinePage(doc, raw, token);
      if (!this.#isActiveLoad(token)) return null;
      const rawChildren = Array.isArray(raw.items) ? raw.items : [];
      const childAncestors = new Set(ancestors);
      childAncestors.add(raw);
      const children = await this.#resolveOutlineItems(doc, rawChildren, token, path, depth + 1, traversal, childAncestors);
      if (!children || !this.#isActiveLoad(token)) return null;
      const safeUrl = this.#safeOutlineUrl(raw.url);
      items.push({
        id: `outline-${path.join('-')}`,
        title: raw.title?.trim() || `Page ${page ?? ''}`.trim(),
        page,
        ...(safeUrl ? { url: safeUrl } : {}),
        children,
      });
    }
    return items;
  }

  async #resolveOutlinePage(doc: SdPdfDocumentProxy, item: SdPdfRawOutlineItem, token: number): Promise<number | null> {
    let destination = item.dest;
    if (typeof destination === 'string') {
      try {
        destination = await doc.getDestination(destination);
      } catch {
        return null;
      }
    }
    if (!this.#isActiveLoad(token) || !Array.isArray(destination) || destination.length === 0) return null;
    const target: unknown = destination[0];
    if (typeof target === 'number') return this.#validOutlinePage(Math.floor(target) + 1, doc.numPages);
    if (!this.#isPdfReference(target)) return null;
    const cached = doc.cachedPageNumber(target);
    if (cached !== null) return this.#validOutlinePage(cached, doc.numPages);
    try {
      const index = await doc.getPageIndex(target);
      return this.#isActiveLoad(token) ? this.#validOutlinePage(index + 1, doc.numPages) : null;
    } catch {
      return null;
    }
  }

  #isPdfReference(value: unknown): value is SdPdfReference {
    return (
      !!value &&
      typeof value === 'object' &&
      'num' in value &&
      'gen' in value &&
      typeof value.num === 'number' &&
      typeof value.gen === 'number'
    );
  }

  #validOutlinePage(page: number, pageCount: number): number | null {
    return Number.isInteger(page) && page >= 1 && page <= pageCount ? page : null;
  }

  #safeOutlineUrl(url: string | null | undefined): string | undefined {
    const value = url?.trim();
    return value && /^(?:https?:\/\/|mailto:)/i.test(value) ? value : undefined;
  }

  async #loadDocument(src: PdfSource | null | undefined): Promise<void> {
    const token = ++this.#loadToken;
    this.#searchToken++;
    this.#cancelQueuedSearch();
    this.#downloadGeneration++;
    this.#cancelLoadingTask();
    this.#cancelRender();
    this.#cancelContinuousRenders();
    this.#cancelThumbnailRenders();
    this.#cancelPrint();
    await this.#destroyDoc();
    if (!this.#isActiveLoad(token)) return;
    this.#revokeAllBlobs();
    this.#thumbnailCacheLru.clear();
    this.#thumbCache.set({});
    this.#setOutline([]);
    this.#clearPageTextCache();
    // Reset search state — results are per-document, but keep the term so a
    // newly-loaded source with the same term gets re-indexed automatically
    // on the next user keystroke. Active index resets unconditionally.
    this.#searchResults.set([]);
    this.#searchActiveIndex.set(-1);
    this.#searchTruncated.set(false);
    this.#loadError.set(null);
    this.#loadProgress.set({ loaded: 0, total: 0 });

    if (!src || !this.#browser.isBrowser) {
      this.#stage.set('empty');
      this.#pdfDoc.set(null);
      this.#meta.set(null);
      this.#activePage.set(1);
      return;
    }

    this.#stage.set('loading');

    let spec: SdPdfDocumentSpec;
    try {
      spec = await this.#normalizeSource(src);
    } catch (err) {
      if (!this.#isActiveLoad(token)) return;
      this.#emitError(this.#classifyError(err), this.#errorMessage(err));
      return;
    }
    if (!this.#isActiveLoad(token)) return;
    if (this.password()) {
      spec.password = this.password();
    }

    let task: SdPdfLoadingTask;
    try {
      task = this.#pdfjs.getDocument(spec);
      this.#currentLoadingTask = task;
      task.onProgress = (p: { loaded: number; total: number }) => {
        if (!this.#isActiveLoad(token) || this.#currentLoadingTask !== task) return;
        this.#loadProgress.set({ loaded: p.loaded ?? 0, total: p.total ?? 0 });
      };
    } catch (err) {
      if (this.#isActiveLoad(token)) this.#emitError(this.#classifyError(err), this.#errorMessage(err));
      return;
    }

    let pdfDoc: SdPdfDocumentProxy;
    try {
      pdfDoc = await task.promise;
    } catch (err) {
      if (this.#currentLoadingTask === task) this.#currentLoadingTask = null;
      if (!this.#isActiveLoad(token)) return;
      this.#emitError(this.#classifyError(err), this.#errorMessage(err));
      return;
    }
    if (this.#currentLoadingTask === task) this.#currentLoadingTask = null;
    if (!this.#isActiveLoad(token)) {
      await this.#destroyDocument(pdfDoc);
      return;
    }

    let meta: PdfMeta;
    try {
      const m = await pdfDoc.getMetadata();
      const info = m?.info ?? {};
      meta = {
        title: info.Title,
        author: info.Author,
        subject: info.Subject,
        numPages: pdfDoc.numPages,
      };
    } catch {
      meta = { numPages: pdfDoc.numPages };
    }
    if (!this.#isActiveLoad(token)) {
      await this.#destroyDocument(pdfDoc);
      return;
    }

    const outline = await this.#loadOutline(pdfDoc, token);
    if (!outline || !this.#isActiveLoad(token)) {
      await this.#destroyDocument(pdfDoc);
      return;
    }

    this.#pdfDoc.set(pdfDoc);
    this.#meta.set(meta);
    this.#setOutline(outline);
    this.#activePage.set(Math.max(1, Math.min(this.startPage(), pdfDoc.numPages)));
    this.#ensureThumbnailPageVisible(this.#activePage());
    this.#stage.set('ready');
    this.#zoom.set(1);
    this.#rotation.set(0);
    this.#zoomMode.set(this.initialZoom());
    this.#resetContinuousLayout(pdfDoc.numPages);

    if (!this.#destroyed) {
      this.loaded.emit({ totalPages: pdfDoc.numPages, meta });
      this.pageChange.emit(this.#activePage());
    }

    if (this.#scrollModeInternal() === 'continuous') {
      this.#positionContinuousPage(this.#activePage());
    } else {
      await this.#renderActivePage();
    }
  }

  async #renderActivePage(): Promise<void> {
    const pdfDoc = this.#pdfDoc();
    if (!pdfDoc) return;
    const token = ++this.#renderToken;
    const pageNum = this.#activePage();
    let page: SdPdfPageProxy;
    try {
      page = await pdfDoc.getPage(pageNum);
    } catch {
      return;
    }
    if (token !== this.#renderToken || this.#destroyed || this.#pdfDoc() !== pdfDoc) {
      page.cleanup();
      return;
    }

    const canvas = this.pageCanvasRef()?.nativeElement;
    if (!canvas) {
      page.cleanup();
      return;
    }

    const rotation = this.#rotation();
    const baseViewport = page.getViewport({ scale: 1, rotation });
    const scale = this.#resolveScale(baseViewport);
    this.#zoom.set(scale);
    const { logicalViewport, renderViewport } = this.#canvasViewports(page, scale, rotation);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      page.cleanup();
      return;
    }

    canvas.width = Math.floor(renderViewport.width);
    canvas.height = Math.floor(renderViewport.height);
    canvas.style.width = `${logicalViewport.width}px`;
    canvas.style.height = `${logicalViewport.height}px`;

    this.#cancelRender();
    const renderTask = page.render({ canvasContext: ctx, viewport: renderViewport });
    this.#currentRenderTask = renderTask;
    let completed = false;
    try {
      await renderTask.promise;
      completed = token === this.#renderToken && !this.#destroyed && this.#pdfDoc() === pdfDoc;
    } catch {
      completed = false;
    } finally {
      if (this.#currentRenderTask === renderTask) {
        this.#currentRenderTask = null;
      }
      page.cleanup();
    }

    if (completed) this.zoomChange.emit(scale);
  }

  #resolveScale(baseViewport: SdPdfViewport): number {
    const mode = this.#zoomMode();
    if (typeof mode === 'number') {
      return Math.min(SdPreviewPdf.MAX_ZOOM, Math.max(SdPreviewPdf.MIN_ZOOM, mode));
    }
    if (mode === 'page-actual') return 1;
    const stage = this.stageEl()?.nativeElement;
    if (!stage) return 1;
    const stageRect = stage.getBoundingClientRect();
    // 32px horizontal + 96px bottom padding lives in the SCSS — subtract it so
    // the page fits without overlapping the floating toolbar.
    const availW = Math.max(80, stageRect.width - 48);
    const availH = Math.max(80, stageRect.height - 120);
    if (mode === 'page-width') {
      return availW / baseViewport.width;
    }
    // page-fit
    return Math.min(availW / baseViewport.width, availH / baseViewport.height);
  }

  #canvasViewports(
    page: SdPdfPageProxy,
    scale: number,
    rotation?: number
  ): { logicalViewport: SdPdfViewport; renderViewport: SdPdfViewport } {
    const logicalViewport = page.getViewport({ scale, rotation });
    const width = Math.max(1, logicalViewport.width);
    const height = Math.max(1, logicalViewport.height);
    const factor = Math.min(
      1,
      SdPreviewPdf.MAX_CANVAS_DIMENSION / width,
      SdPreviewPdf.MAX_CANVAS_DIMENSION / height,
      Math.sqrt(SdPreviewPdf.MAX_CANVAS_PIXELS / (width * height))
    );
    return {
      logicalViewport,
      renderViewport: factor < 1 ? page.getViewport({ scale: scale * factor, rotation }) : logicalViewport,
    };
  }

  #cancelRender(): void {
    if (this.#currentRenderTask) {
      try {
        this.#currentRenderTask.cancel();
      } catch {
        /* ignore */
      }
      this.#currentRenderTask = null;
    }
  }

  onStageScroll(): void {
    if (this.#scrollModeInternal() === 'continuous') this.#updateContinuousWindow(true);
  }

  #cancelLoadingTask(): void {
    const task = this.#currentLoadingTask;
    this.#currentLoadingTask = null;
    if (!task?.destroy) return;
    try {
      void Promise.resolve(task.destroy()).catch(() => undefined);
    } catch {
      return;
    }
  }

  #cancelPrint(): void {
    this.#printGeneration++;
    this.#cancelPrintJob();
  }

  #cancelPrintJob(): void {
    const job = this.#currentPrintJob;
    this.#currentPrintJob = null;
    job?.cancel();
  }

  #isActiveLoad(token: number): boolean {
    return !this.#destroyed && token === this.#loadToken;
  }

  #isCurrentDownload(generation: number, source: PdfSource | null, doc: SdPdfDocumentProxy | null): boolean {
    return !this.#destroyed && generation === this.#downloadGeneration && this.source() === source && this.#pdfDoc() === doc;
  }

  async #destroyDocument(doc: SdPdfDocumentProxy): Promise<void> {
    try {
      await doc.destroy();
    } catch {
      return;
    }
  }

  async #destroyDoc(): Promise<void> {
    const doc = this.#pdfDoc();
    if (!doc) return;
    this.#pdfDoc.set(null);
    await this.#destroyDocument(doc);
  }

  #setZoom(value: number): void {
    const clamped = Math.min(SdPreviewPdf.MAX_ZOOM, Math.max(SdPreviewPdf.MIN_ZOOM, value));
    this.#zoom.set(clamped);
    if (this.#scrollModeInternal() === 'continuous') this.#invalidateContinuousLayout();
    else void this.#renderActivePage();
  }

  async #normalizeSource(src: PdfSource): Promise<SdPdfDocumentSpec> {
    if (typeof src === 'string') {
      this.#filename.set(this.#guessName(src));
      const headers = this.httpHeaders();
      const spec: SdPdfDocumentSpec = { url: src };
      if (headers) spec.httpHeaders = headers;
      return spec;
    }
    if (this.#browser.isFile(src)) {
      this.#filename.set(src.name);
      this.#fileSize.set(src.size);
      const buf = await src.arrayBuffer();
      return { data: new Uint8Array(buf) };
    }
    if (this.#browser.isBlob(src)) {
      this.#filename.set('document.pdf');
      this.#fileSize.set(src.size);
      const buf = await src.arrayBuffer();
      return { data: new Uint8Array(buf) };
    }
    if (src instanceof ArrayBuffer) {
      this.#filename.set('document.pdf');
      this.#fileSize.set(src.byteLength);
      return { data: new Uint8Array(src.slice(0)) };
    }
    if (src instanceof Uint8Array) {
      this.#filename.set('document.pdf');
      this.#fileSize.set(src.byteLength);
      return { data: new Uint8Array(src) };
    }
    if (src && typeof src === 'object') {
      if ('url' in src && typeof src.url === 'string') {
        this.#filename.set(this.#guessName(src.url));
        const spec: SdPdfDocumentSpec = { url: src.url };
        // Caller-provided headers win over the [httpHeaders] input.
        const headers = src.httpHeaders ?? this.httpHeaders();
        if (headers) spec.httpHeaders = headers;
        if (src.withCredentials) spec.withCredentials = true;
        return spec;
      }
      if ('data' in src && (src.data instanceof ArrayBuffer || src.data instanceof Uint8Array)) {
        this.#filename.set('document.pdf');
        const data = src.data instanceof ArrayBuffer ? new Uint8Array(src.data.slice(0)) : new Uint8Array(src.data);
        this.#fileSize.set(data.byteLength);
        return { data };
      }
    }
    throw new Error('Unsupported PDF source');
  }

  #guessName(url: string): string {
    const path = url.split('?')[0];
    const last = path.substring(path.lastIndexOf('/') + 1);
    return last || 'document.pdf';
  }

  /** Map any thrown value into a {reason} we can render. */
  #classifyError(err: unknown): PdfErrorReason {
    if (!err) return 'unknown';
    // pdfjs throws named exception classes — we sniff by name to avoid
    // importing the constructors (keeps the bundle smaller).
    const name = (err as { name?: string }).name;
    if (name === 'PasswordException') return 'password';
    if (name === 'InvalidPDFException') return 'invalid';
    if (name === 'MissingPDFException' || name === 'UnexpectedResponseException') {
      return 'network';
    }
    if (err instanceof Error && /network|fetch|cors/i.test(err.message)) {
      return 'network';
    }
    return 'unknown';
  }

  #errorMessage(err: unknown): string | undefined {
    if (err instanceof Error) return err.message;
    return undefined;
  }

  #emitError(reason: PdfErrorReason, message?: string): void {
    const ev: PdfErrorEvent = { reason, message };
    this.#loadError.set(ev);
    this.#stage.set('error');
    this.loadError.emit(ev);
  }

  #revokeAllBlobs(): void {
    for (const url of this.#ownedBlobUrls) {
      this.#browser.revokeObjectUrl(url);
    }
    this.#ownedBlobUrls.clear();
  }

  #requiresLoadedDocumentBytes(source: PdfSource): boolean {
    if (typeof source === 'string') return !!this.httpHeaders();
    if (!('url' in source) || typeof source.url !== 'string') return false;
    return !!source.httpHeaders || !!source.withCredentials || !!this.httpHeaders();
  }

  #trackTemporaryDownloadUrl(url: string | null): string | null {
    if (url) this.#ownedBlobUrls.add(url);
    return url;
  }

  #scheduleTemporaryDownloadUrlRelease(url: string): void {
    const release = (): void => {
      if (!this.#ownedBlobUrls.delete(url)) return;
      this.#browser.revokeObjectUrl(url);
    };
    if (this.#browser.scheduleFrame(() => release()) === null) queueMicrotask(release);
  }

  // ==========================================
  // SEARCH HELPERS
  // ==========================================

  /**
   * Build the search regex. We escape every metachar so the term is matched
   * literally (so `foo.bar` doesn't treat `.` as "any char"). Unicode flag
   * `u` makes `\b` understand Vietnamese diacritic-bearing letters as word
   * characters — without it `\b` would split `đ` at the d, breaking
   * whole-word matches on Vietnamese terms.
   */
  #buildSearchRegex(term: string, caseSensitive: boolean, wholeWord: boolean): RegExp | null {
    if (!term) return null;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flags = (caseSensitive ? 'g' : 'gi') + 'u';
    const wordCharacter = '[\\p{L}\\p{M}\\p{N}\\p{Pc}]';
    const pattern = wholeWord ? '(?<!' + wordCharacter + ')' + escaped + '(?!' + wordCharacter + ')' : escaped;
    try {
      return new RegExp(pattern, flags);
    } catch {
      return null;
    }
  }

  /**
   * Fetch (and cache) the plain text of a single page. We normalize to NFC
   * so the same Vietnamese letter encoded as composed vs decomposed sequences
   * (NFD) matches the same search term — pdfjs has been seen to return NFD
   * in some PDFs.
   */
  async #getPageText(doc: SdPdfDocumentProxy, pageNum: number, searchToken: number, scan: PdfPageTextScan): Promise<string> {
    const cached = scan.staged.get(pageNum) ?? scan.snapshot.get(pageNum);
    if (cached !== undefined) {
      this.#stagePageText(scan, pageNum, cached);
      return cached;
    }
    let page: SdPdfPageProxy;
    try {
      page = await doc.getPage(pageNum);
    } catch {
      return '';
    }
    let text = '';
    try {
      const content = await page.getTextContent();
      const items = content && typeof content === 'object' && 'items' in content && Array.isArray(content.items) ? content.items : [];
      const parts: string[] = [];
      for (const it of items) {
        if (it && typeof it === 'object' && 'str' in it && typeof it.str === 'string') parts.push(it.str);
      }
      // Space-join so multi-word matches across textItem boundaries work.
      text = parts.join(' ').normalize('NFC');
    } catch {
      text = '';
    } finally {
      page.cleanup();
    }
    if (searchToken === this.#searchToken && this.#pdfDoc() === doc && !this.#destroyed) {
      this.#stagePageText(scan, pageNum, text);
    }
    return text;
  }

  #stagePageText(scan: PdfPageTextScan, pageNum: number, text: string): void {
    scan.staged.delete(pageNum);
    scan.staged.set(pageNum, text);
    while (scan.staged.size > SdPreviewPdf.MAX_PAGE_TEXT_CACHE_PAGES) {
      const oldestPage = scan.staged.keys().next().value as number | undefined;
      if (oldestPage === undefined) break;
      scan.staged.delete(oldestPage);
    }
  }

  #commitPageTextScan(scan: PdfPageTextScan): void {
    for (const [pageNum, text] of scan.staged) this.#cachePageText(pageNum, text);
  }

  #cachePageText(pageNum: number, text: string): void {
    this.#pageTextCache.delete(pageNum);
    this.#pageTextCache.set(pageNum, text);
    while (this.#pageTextCache.size > SdPreviewPdf.MAX_PAGE_TEXT_CACHE_PAGES) {
      const oldestPage = this.#pageTextCache.keys().next().value as number | undefined;
      if (oldestPage === undefined) break;
      this.#pageTextCache.delete(oldestPage);
    }
    this.#pageTextCacheSize.set(this.#pageTextCache.size);
  }

  #clearPageTextCache(): void {
    this.#pageTextCache.clear();
    this.#pageTextCacheSize.set(0);
  }

  #emitSearchChange(): void {
    this.searchChange.emit({
      term: this.#searchTerm(),
      total: this.#searchResults().length,
      current: this.#searchActiveIndex() + 1, // 1-based; 0 when no active
      truncated: this.#searchTruncated(),
    });
  }

  /**
   * Paint highlight marks over the current page's canvas wrapper. WHY DOM
   * append (not text layer): rendering the proper pdf.js text layer is a
   * larger change — out-of-scope here. Instead we drop floating `<mark>`
   * pills near the top of the page; they're a visual cue that the page
   * contains a hit + which one is active, even when we can't place them
   * pixel-accurately. The result-list cards still drive precise navigation.
   *
   * Tradeoff documented in sd-preview.md.
   */
  #applyHighlightsForActivePage(): void {
    const wrap = this.#hostEl.nativeElement.querySelector('.sd-preview-pdf-page-wrap');
    if (!wrap) return;
    // Clear prior overlay.
    const prior = wrap.querySelector('.sd-pdf-search-overlay');
    if (prior) prior.remove();

    const term = this.#searchTerm();
    const results = this.#searchResults();
    const activeIdx = this.#searchActiveIndex();
    const activePage = this.activePage();
    if (!term || results.length === 0) return;

    const pageHits = results.map((r, i) => ({ r, i })).filter(({ r }) => r.page === activePage);
    if (pageHits.length === 0) return;

    const overlay = this.#browser.createElement('div');
    if (!overlay) return;
    overlay.className = 'sd-pdf-search-overlay';
    for (const { r, i } of pageHits) {
      const m = this.#browser.createElement('mark');
      if (!m) continue;
      m.className = i === activeIdx ? 'sd-pdf-search-hi sd-pdf-search-hi--active' : 'sd-pdf-search-hi';
      m.textContent = r.term;
      overlay.appendChild(m);
    }
    wrap.appendChild(overlay);

    // Scroll the active mark into view if it lives on this page.
    if (activeIdx >= 0 && results[activeIdx]?.page === activePage) {
      const activeMark = overlay.querySelector('.sd-pdf-search-hi--active') as HTMLElement | null;
      try {
        activeMark?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } catch {
        // older Safari throws on smooth — fall back silently
      }
    }
  }

  #onScrollModeChanged(): void {
    if (this.#destroyed || this.#stage() !== 'ready') return;
    if (this.#scrollModeInternal() === 'continuous') {
      this.#cancelRender();
      this.#resetContinuousLayout(this.numPages());
      this.#positionContinuousPage(this.#activePage());
      return;
    }
    this.#cancelContinuousRenders();
    this.#continuousPages.set([]);
    this.#continuousTopSpacer.set(0);
    this.#continuousBottomSpacer.set(0);
    void this.#renderActivePage();
  }

  #estimatedContinuousHeight(): number {
    const rotated = this.#rotation() % 180 !== 0;
    const baseViewport: SdPdfViewport = rotated ? { width: 792, height: 612 } : { width: 612, height: 792 };
    return Math.max(1, baseViewport.height * this.#resolveScale(baseViewport));
  }

  #resetContinuousLayout(pageCount: number): void {
    const estimatedHeight = this.#estimatedContinuousHeight();
    this.#pageHeights = Array.from({ length: pageCount }, () => estimatedHeight);
    this.#heightIndex.reset(this.#pageHeights);
    this.#continuousHeightVersion.update(version => version + 1);
  }

  #continuousPageIndexAt(offset: number): number {
    return this.#heightIndex.indexAt(offset);
  }

  #updateContinuousWindow(updateActivePage: boolean): void {
    const stage = this.stageEl()?.nativeElement;
    const pageCount = this.#pageHeights.length;
    if (!stage || pageCount === 0 || this.#scrollModeInternal() !== 'continuous') return;
    const viewportHeight = Math.max(1, stage.clientHeight || stage.getBoundingClientRect().height || 1);
    const firstVisible = this.#continuousPageIndexAt(stage.scrollTop);
    const lastVisible = this.#continuousPageIndexAt(stage.scrollTop + viewportHeight - 1);
    const first = Math.max(0, firstVisible - 1);
    const last = Math.min(pageCount - 1, lastVisible + 1);
    const pages = Array.from({ length: last - first + 1 }, (_, index) => first + index + 1);
    this.#continuousPages.set(pages);
    this.#continuousTopSpacer.set(this.#heightIndex.offsetAt(first));
    const renderedEnd = this.#heightIndex.offsetAt(last) + this.#pageHeights[last];
    this.#continuousBottomSpacer.set(Math.max(0, this.#heightIndex.total() - renderedEnd));

    const retained = new Set(pages);
    for (const [pageNumber, task] of this.#continuousTasks) {
      if (retained.has(pageNumber)) continue;
      task.cancel();
      this.#continuousTasks.delete(pageNumber);
    }

    if (!updateActivePage) return;
    const midpointPage = this.#continuousPageIndexAt(stage.scrollTop + viewportHeight / 2) + 1;
    if (midpointPage === this.#activePage()) return;
    this.#activePage.set(midpointPage);
    if (!this.#destroyed) this.pageChange.emit(midpointPage);
  }

  #positionContinuousPage(pageNumber: number): void {
    const stage = this.stageEl()?.nativeElement;
    if (stage) stage.scrollTop = this.#heightIndex.offsetAt(pageNumber - 1);
    this.#updateContinuousWindow(false);
    this.#rescheduleContinuousRenders();
  }

  #invalidateContinuousLayout(): void {
    const stage = this.stageEl()?.nativeElement;
    const anchorIndex = stage ? this.#continuousPageIndexAt(stage.scrollTop) : 0;
    const oldHeight = this.#pageHeights[anchorIndex] || 1;
    const oldOffset = this.#heightIndex.offsetAt(anchorIndex);
    const anchorRatio = stage ? Math.max(0, Math.min(1, (stage.scrollTop - oldOffset) / oldHeight)) : 0;
    this.#cancelContinuousRenders();
    this.#resetContinuousLayout(this.numPages());
    if (stage) stage.scrollTop = this.#heightIndex.offsetAt(anchorIndex) + this.#pageHeights[anchorIndex] * anchorRatio;
    this.#updateContinuousWindow(false);
    this.#rescheduleContinuousRenders();
  }

  #rescheduleContinuousRenders(): void {
    queueMicrotask(() => {
      if (this.#destroyed || this.#scrollModeInternal() !== 'continuous') return;
      this.#scheduleContinuousRenders(this.continuousCanvases().map(ref => ref.nativeElement));
    });
  }

  #scheduleContinuousRenders(canvases: HTMLCanvasElement[]): void {
    if (this.#continuousFrame !== null) this.#browser.cancelFrame(this.#continuousFrame);
    if (canvases.length === 0 || this.#scrollModeInternal() !== 'continuous') {
      this.#continuousFrame = null;
      return;
    }
    this.#continuousFrame = this.#browser.scheduleFrame(() => {
      this.#continuousFrame = null;
      for (const canvas of canvases) void this.#renderContinuousCanvas(canvas);
    });
  }

  async #renderContinuousCanvas(canvas: HTMLCanvasElement): Promise<void> {
    const pageNumber = Number(canvas.getAttribute('data-page'));
    const doc = this.#pdfDoc();
    const generation = this.#layoutGeneration;
    if (
      !doc ||
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      this.#continuousTasks.has(pageNumber) ||
      this.#continuousReservations.has(pageNumber)
    )
      return;
    const reservation = { generation };
    this.#continuousReservations.set(pageNumber, reservation);
    let page: SdPdfPageProxy | null = null;
    try {
      page = await doc.getPage(pageNumber);
      if (!this.#isCurrentContinuousPage(doc, generation, pageNumber)) return;
      const rotation = this.#rotation();
      const baseViewport = page.getViewport({ scale: 1, rotation });
      const scale = this.#resolveScale(baseViewport);
      const { logicalViewport, renderViewport } = this.#canvasViewports(page, scale, rotation);
      const context = canvas.getContext('2d');
      if (!context) return;
      canvas.width = Math.floor(renderViewport.width);
      canvas.height = Math.floor(renderViewport.height);
      canvas.style.width = `${logicalViewport.width}px`;
      canvas.style.height = `${logicalViewport.height}px`;
      const task = page.render({ canvasContext: context, viewport: renderViewport });
      this.#continuousTasks.set(pageNumber, task);
      try {
        await task.promise;
      } catch {
        return;
      } finally {
        if (this.#continuousTasks.get(pageNumber) === task) this.#continuousTasks.delete(pageNumber);
      }
      if (!this.#isCurrentContinuousPage(doc, generation, pageNumber)) return;
      this.#updateContinuousMeasurement(pageNumber, logicalViewport.height);
      this.#zoom.set(scale);
      this.zoomChange.emit(scale);
    } finally {
      if (this.#continuousReservations.get(pageNumber) === reservation) this.#continuousReservations.delete(pageNumber);
      page?.cleanup();
    }
  }

  #isCurrentContinuousPage(doc: SdPdfDocumentProxy, generation: number, pageNumber: number): boolean {
    return (
      !this.#destroyed && this.#pdfDoc() === doc && this.#layoutGeneration === generation && this.#continuousPages().includes(pageNumber)
    );
  }

  #updateContinuousMeasurement(pageNumber: number, height: number): void {
    const index = pageNumber - 1;
    if (!Number.isFinite(height) || height <= 0 || Math.abs((this.#pageHeights[index] ?? 0) - height) < 0.5) return;
    const stage = this.stageEl()?.nativeElement;
    const anchorIndex = stage ? this.#continuousPageIndexAt(stage.scrollTop) : 0;
    const anchorDelta = stage ? stage.scrollTop - this.#heightIndex.offsetAt(anchorIndex) : 0;
    this.#pageHeights[index] = height;
    this.#heightIndex.updateHeight(index, height);
    this.#continuousHeightVersion.update(version => version + 1);
    if (stage) stage.scrollTop = this.#heightIndex.offsetAt(anchorIndex) + anchorDelta;
    this.#updateContinuousWindow(false);
  }

  #cancelContinuousRenders(): void {
    this.#layoutGeneration++;
    if (this.#continuousFrame !== null) {
      this.#browser.cancelFrame(this.#continuousFrame);
      this.#continuousFrame = null;
    }
    for (const task of this.#continuousTasks.values()) task.cancel();
    this.#continuousTasks.clear();
    this.#continuousReservations.clear();
  }

  // ==========================================
  // THUMBNAIL HELPERS
  // ==========================================

  /**
   * Rebind the IntersectionObserver to whatever set of thumbnail canvases is
   * currently mounted. Called from an effect that tracks `thumbCanvases()`.
   */
  #syncThumbObserver(canvases: HTMLCanvasElement[]): void {
    this.#thumbObserverCleanup?.();
    this.#thumbObserverCleanup = null;
    const currentPages = new Set(canvases.map(canvas => Number(canvas.getAttribute('data-page'))).filter(page => Number.isFinite(page)));
    this.#cancelThumbnailWorkOutside(currentPages);
    if (canvases.length === 0) {
      return;
    }
    this.#thumbObserverCleanup = this.#browser.observeIntersections(
      canvases,
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const canvas = canvases.find(candidate => candidate === entry.target);
          if (!canvas) continue;
          const n = Number(canvas.getAttribute('data-page'));
          if (!Number.isFinite(n)) continue;
          void this.#renderThumbnail(n, canvas);
        }
      },
      { rootMargin: '120px 0px 120px 0px', threshold: 0.01 }
    );
  }

  #ensureThumbnailPageVisible(pageNumber: number): void {
    const start = this.#thumbnailWindowStart();
    const end = start + SdPreviewPdf.THUMBNAIL_WINDOW_SIZE;
    if (pageNumber > start && pageNumber <= end) return;
    const centered = pageNumber - 1 - Math.floor(SdPreviewPdf.THUMBNAIL_WINDOW_SIZE / 2);
    const next = Math.max(0, Math.min(centered, Math.max(0, this.numPages() - SdPreviewPdf.THUMBNAIL_WINDOW_SIZE)));
    this.#thumbnailWindowStart.set(next);
    queueMicrotask(() => {
      const content = this.sidebarContentRef()?.nativeElement;
      if (content && this.#sidebarModeInternal() === 'thumbnails') {
        content.scrollTop = next * SdPreviewPdf.THUMBNAIL_ITEM_HEIGHT;
      }
    });
  }

  /**
   * Render a single page into a sidebar thumbnail canvas at ~140px width.
   * Reserved in `#thumbnailWork` before getPage() so rapid scroll bounces
   * cannot start duplicate work for the same mounted page.
   *
   * Visible for testing — tests can stub `getPage()` on the fake doc to
   * assert this method calls `render(...)` with the right page argument.
   */
  async renderThumbnailForPage(pageNum: number): Promise<void> {
    const canvas = this.thumbCanvases()
      .map(r => r.nativeElement)
      .find(c => Number(c.getAttribute('data-page')) === pageNum);
    if (!canvas) return;
    return this.#renderThumbnail(pageNum, canvas);
  }

  async #renderThumbnail(pageNum: number, canvas: HTMLCanvasElement): Promise<void> {
    const doc = this.#pdfDoc();
    if (!doc) return;
    if (this.#thumbnailWork.has(pageNum)) return;
    const cachedThumbnail = this.#getCachedThumbnail(pageNum);
    if (cachedThumbnail) {
      this.#paintCachedThumb(canvas, cachedThumbnail, this.#loadToken);
      return;
    }
    const loadToken = this.#loadToken;
    const work: PdfThumbnailWork = {
      loadToken,
      cancelled: false,
      renderTask: null,
      slotState: 'new',
      resumeSlot: null,
    };
    this.#thumbnailWork.set(pageNum, work);
    this.#thumbnailWorkCount.set(this.#thumbnailWork.size);
    let page: SdPdfPageProxy | null = null;
    let acquiredSlot = false;
    try {
      acquiredSlot = await this.#acquireThumbnailSlot(work);
      if (!acquiredSlot || !this.#isThumbnailWorkActive(pageNum, work, doc)) return;
      page = await doc.getPage(pageNum);
      if (!this.#isThumbnailWorkActive(pageNum, work, doc)) return;
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = 140 / Math.max(1, baseViewport.width);
      const { logicalViewport, renderViewport } = this.#canvasViewports(page, scale);
      canvas.width = Math.floor(renderViewport.width);
      canvas.height = Math.floor(renderViewport.height);
      canvas.style.width = `${logicalViewport.width}px`;
      canvas.style.height = `${logicalViewport.height}px`;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const renderTask = page.render({ canvasContext: ctx, viewport: renderViewport });
      work.renderTask = renderTask;
      try {
        await renderTask.promise;
      } catch {
        return;
      }
      if (!this.#isThumbnailWorkActive(pageNum, work, doc)) return;
      try {
        const dataUrl = canvas.toDataURL('image/png');
        this.#cacheThumbnail(pageNum, dataUrl);
      } catch {
        return;
      }
    } catch {
      return;
    } finally {
      if (acquiredSlot) this.#releaseThumbnailSlot(work);
      if (this.#thumbnailWork.get(pageNum) === work) {
        this.#thumbnailWork.delete(pageNum);
        this.#thumbnailWorkCount.set(this.#thumbnailWork.size);
      }
      page?.cleanup();
    }
  }

  #isThumbnailWorkActive(pageNum: number, work: PdfThumbnailWork, doc: SdPdfDocumentProxy): boolean {
    return (
      !work.cancelled &&
      work.loadToken === this.#loadToken &&
      this.#isActiveLoad(work.loadToken) &&
      this.#pdfDoc() === doc &&
      this.#thumbnailWork.get(pageNum) === work &&
      this.pageNumbers().includes(pageNum)
    );
  }

  #getCachedThumbnail(pageNum: number): string | undefined {
    const cached = this.#thumbnailCacheLru.get(pageNum);
    if (cached === undefined) return undefined;
    this.#thumbnailCacheLru.delete(pageNum);
    this.#thumbnailCacheLru.set(pageNum, cached);
    return cached;
  }

  #cacheThumbnail(pageNum: number, dataUrl: string): void {
    this.#thumbnailCacheLru.delete(pageNum);
    this.#thumbnailCacheLru.set(pageNum, dataUrl);
    while (this.#thumbnailCacheLru.size > SdPreviewPdf.MAX_THUMBNAIL_CACHE_ENTRIES) {
      const oldestPage = this.#thumbnailCacheLru.keys().next().value as number | undefined;
      if (oldestPage === undefined) break;
      this.#thumbnailCacheLru.delete(oldestPage);
    }
    this.#thumbCache.set(Object.fromEntries(this.#thumbnailCacheLru));
  }

  #cancelThumbnailRenders(): void {
    for (const work of this.#thumbnailWork.values()) this.#cancelThumbnailWork(work);
    this.#thumbnailWork.clear();
    this.#thumbnailWorkCount.set(0);
  }

  #cancelThumbnailWorkOutside(currentPages: ReadonlySet<number>): void {
    for (const [pageNumber, work] of this.#thumbnailWork) {
      if (currentPages.has(pageNumber)) continue;
      this.#cancelThumbnailWork(work);
      this.#thumbnailWork.delete(pageNumber);
    }
    this.#thumbnailWorkCount.set(this.#thumbnailWork.size);
  }

  #cancelThumbnailWork(work: PdfThumbnailWork): void {
    work.cancelled = true;
    if (work.slotState === 'queued') {
      const queueIndex = this.#thumbnailSlotQueue.indexOf(work);
      if (queueIndex >= 0) this.#thumbnailSlotQueue.splice(queueIndex, 1);
      work.slotState = 'released';
      const resume = work.resumeSlot;
      work.resumeSlot = null;
      resume?.(false);
    }
    try {
      work.renderTask?.cancel();
    } catch {
      // Cancellation is best-effort; the identity guard still blocks late cache writes.
    }
  }

  #acquireThumbnailSlot(work: PdfThumbnailWork): Promise<boolean> {
    if (work.cancelled || this.#destroyed) return Promise.resolve(false);
    if (this.#activeThumbnailSlots < SdPreviewPdf.MAX_CONCURRENT_THUMBNAIL_WORK) {
      this.#activeThumbnailSlots++;
      work.slotState = 'active';
      return Promise.resolve(true);
    }
    work.slotState = 'queued';
    return new Promise<boolean>(resolve => {
      work.resumeSlot = resolve;
      this.#thumbnailSlotQueue.push(work);
    });
  }

  #releaseThumbnailSlot(work: PdfThumbnailWork): void {
    if (work.slotState !== 'active') return;
    work.slotState = 'released';
    this.#activeThumbnailSlots = Math.max(0, this.#activeThumbnailSlots - 1);
    while (this.#thumbnailSlotQueue.length > 0) {
      const next = this.#thumbnailSlotQueue.shift()!;
      if (next.cancelled || next.slotState !== 'queued') {
        const resumeCancelled = next.resumeSlot;
        next.resumeSlot = null;
        next.slotState = 'released';
        resumeCancelled?.(false);
        continue;
      }
      this.#activeThumbnailSlots++;
      next.slotState = 'active';
      const resume = next.resumeSlot;
      next.resumeSlot = null;
      resume?.(true);
      break;
    }
  }

  /**
   * Paint a previously-rendered dataURL onto a freshly-mounted canvas so the
   * mini-page reappears without re-rasterizing.
   */
  #paintCachedThumb(canvas: HTMLCanvasElement, dataUrl: string, loadToken: number): void {
    const img = this.#browser.createImage();
    if (!img) return;
    img.onload = () => {
      if (!this.#isActiveLoad(loadToken)) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.style.width = `${img.naturalWidth}px`;
      canvas.style.height = `${img.naturalHeight}px`;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
  }
}
