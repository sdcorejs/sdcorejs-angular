import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  InjectionToken,
  OnDestroy,
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
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@sdcorejs/angular/i18n';
import {
  PdfErrorEvent,
  PdfErrorReason,
  PdfLoadEvent,
  PdfMeta,
  PdfScrollMode,
  PdfSearchResult,
  PdfSearchState,
  PdfSidebarMode,
  PdfSource,
  PdfStage,
  PdfZoomMode,
  PreviewTheme,
} from './preview-pdf.types';

// pdfjs-dist 4.x ESM build. We import the whole namespace so we can both call
// getDocument() and assign GlobalWorkerOptions.workerSrc once at module load.
//
// WHY this concrete import (and the .mjs worker URL strategy): pdfjs ships an
// ESM build that ng-packagr understands as a regular dependency. Worker
// registration uses `new URL(..., import.meta.url)` so bundlers (esbuild /
// webpack / vite) emit and rewrite the asset automatically. If a downstream
// app's bundler can't resolve the worker via import.meta.url, the consumer
// must point pdfjsLib.GlobalWorkerOptions.workerSrc to their own copy.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import * as pdfjsLib from 'pdfjs-dist';

/**
 * Minimal pdfjs surface the component depends on. We wrap pdfjs in a DI token
 * so unit tests can supply a hand-rolled mock without going through
 * jasmine.createSpyObj on the real module (which is harder with ESM).
 */
export interface SdPdfJsLib {
  getDocument: (spec: unknown) => {
    promise: Promise<unknown>;
    onProgress?: (p: { loaded: number; total: number }) => void;
  };
  GlobalWorkerOptions: { workerSrc: string };
}

export const SD_PDFJS_LIB = new InjectionToken<SdPdfJsLib>('SD_PDFJS_LIB', {
  providedIn: 'root',
  factory: (): SdPdfJsLib => {
    // Try the worker URL one time at first-injection. Guarded so the
    // component still imports cleanly in environments (tests, SSR) where
    // import.meta.url can't be resolved or the worker bundle isn't shipped.
    try {
      if (pdfjsLib?.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          'pdfjs-dist/build/pdf.worker.min.mjs' as any,
          import.meta.url,
        ).toString();
      }
    } catch {
      // Consumer app must set workerSrc manually (documented in sd-preview.md).
    }
    return pdfjsLib as unknown as SdPdfJsLib;
  },
});

// Minimal local typing to avoid leaking pdfjs types from our public surface.
// We only use a small subset of PDFDocumentProxy / PDFPageProxy / RenderTask.
interface PdfRenderTask {
  promise: Promise<void>;
  cancel: () => void;
}
interface PdfViewport {
  width: number;
  height: number;
}
// pdfjs TextContent.items is heterogeneous (text + marked-content markers);
// we narrow to the text-bearing entries we actually use for search.
interface PdfTextItem { str: string; }
interface PdfTextContent { items: Array<PdfTextItem | unknown> }
interface PdfPageProxy {
  getViewport(p: { scale: number; rotation?: number }): PdfViewport;
  render(p: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfViewport;
  }): PdfRenderTask;
  getTextContent(): Promise<PdfTextContent | unknown>;
  cleanup(): void;
}
interface PdfDocumentProxy {
  numPages: number;
  getPage(n: number): Promise<PdfPageProxy>;
  getMetadata(): Promise<{
    info?: { Title?: string; Author?: string; Subject?: string };
  }>;
  destroy(): Promise<void>;
}

@Component({
  selector: 'sd-preview-pdf',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslatePipe],
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
export class SdPreviewPdf implements OnDestroy {
  // ==========================================
  // CONSTANTS
  // ==========================================
  // Dải zoom hữu dụng cho viewer PDF. Dưới 25% chữ thành chấm, trên 400% là
  // raster bị pixelated nặng (canvas + DPR vẫn có giới hạn). Trùng dải của
  // preview-image để consumer làm quen với 1 spec duy nhất.
  static readonly MIN_ZOOM = 0.25;
  static readonly MAX_ZOOM = 4;
  static readonly ZOOM_STEP = 0.1;

  // ==========================================
  // DI
  // ==========================================
  readonly #hostEl = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #destroyRef = inject(DestroyRef);
  readonly #pdfjs = inject(SD_PDFJS_LIB);

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
  // Every thumbnail <canvas> in the sidebar — populated when sidebar is open +
  // mode==='thumbnails'. We feed these to the IntersectionObserver below so a
  // thumb only renders when it scrolls into the viewport (lazy fill).
  protected readonly thumbCanvases =
    viewChildren<ElementRef<HTMLCanvasElement>>('thumbCanvas');

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
  readonly searchChange = output<{ term: string; total: number; current: number }>();

  // ==========================================
  // STATE (signals)
  // ==========================================
  readonly #stage = signal<PdfStage>('empty');
  readonly #pdfDoc = signal<PdfDocumentProxy | null>(null);
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

  // Thumbnail cache: page number → data URL of mini-render. Lazy-populated as
  // the user opens the sidebar / scrolls thumbnails into view.
  readonly #thumbCache = signal<Record<number, string>>({});

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
  // -1 sentinel means "no result focused yet" (e.g. right after clearSearch
  // or before the first searchNext). Highlight rendering uses this to skip
  // the `--active` class altogether.
  readonly #searchActiveIndex = signal(-1);
  // Page-text cache: pageNum → fully-joined plain text. We pay the
  // `getTextContent()` cost once per page per document, then reuse across
  // re-runs (e.g. toggling case-sensitive). Cleared on every source change.
  readonly #pageTextCache = new Map<number, string>();
  // Token to abort an in-flight `search()` call when a newer one supersedes it
  // — same pattern as #loadToken / #renderToken upstream.
  #searchToken = 0;
  // The IntersectionObserver instance that drives lazy thumb rendering. Lives
  // for the component's lifetime; we just rebind to the latest canvas refs
  // when the sidebar tab switches.
  #thumbObserver: IntersectionObserver | null = null;
  // Pages currently being rendered as thumbs — guards against double work
  // when a thumb scrolls in/out/in rapidly.
  readonly #thumbsRendering = new Set<number>();

  // Cached resolved source object that getDocument actually consumed — used
  // for download fallback when caller passed a non-URL source.
  #lastBlobUrl: string | null = null;
  // Track ALL blob URLs we created so we can revoke on source change + destroy.
  readonly #ownedBlobUrls = new Set<string>();

  // Race guards mirror preview-image's #loadToken pattern.
  #loadToken = 0;
  #currentRenderTask: PdfRenderTask | null = null;
  #renderToken = 0;

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
  readonly isSidebarOpen = computed(
    () => this.#sidebarOpenInternal() && this.#sidebarModeInternal() !== 'none',
  );
  readonly pageList = computed(() => {
    const n = this.numPages();
    return n > 0 ? Array.from({ length: n }, (_, i) => i + 1) : [];
  });
  // Alias used by the template's thumbnail @for — keeps the JSX-y `pageNumbers`
  // name from the design handoff while reusing the same computed.
  readonly pageNumbers = this.pageList;

  // Search readonly accessors for the template + tests. Read-only by design;
  // mutations go through `search()` / `searchNext()` etc.
  readonly searchBarOpen = this.#searchBarOpen.asReadonly();
  readonly searchTerm = this.#searchTerm.asReadonly();
  readonly searchResults = this.#searchResults.asReadonly();
  readonly searchActiveIndex = this.#searchActiveIndex.asReadonly();
  readonly searchCaseSensitive = this.#searchCaseSensitive.asReadonly();
  readonly searchWholeWord = this.#searchWholeWord.asReadonly();
  readonly searchTotal = computed(() => this.#searchResults().length);
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
      // 'outline' + 'search' are deferred — selecting them through the input
      // is allowed (we still toggle the tab UI) but the body shows the deferred
      // placeholder. Don't force-fallback to 'thumbnails' so the input value
      // is honored visibly.
      this.#sidebarModeInternal.set(m);
    });
    effect(() => {
      const m = this.scrollMode();
      // Continuous scroll is deferred — warn once if requested but keep the
      // input value so consumer code is forward-compatible.
      if (m === 'continuous') {
        console.warn(
          // eslint-disable-next-line max-len
          '[sd-preview-pdf] scrollMode="continuous" is deferred; falling back to single-page rendering.', // @i18n-ignore
        );
      }
      this.#scrollModeInternal.set(m);
    });
    effect(() => {
      // Reset zoom mode when initialZoom input changes — only fires when the
      // input itself updates (not when user clicks zoom +/-).
      this.#zoomMode.set(this.initialZoom());
    });

    // Sync fullscreen state from the browser (works with Esc, F11, programmatic exit).
    const onFullscreenChange = () => {
      this.#isFullscreen.set(document.fullscreenElement === this.#hostEl.nativeElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    this.#destroyRef.onDestroy(() => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
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
      this.#cancelRender();
      this.#destroyDoc();
      this.#revokeAllBlobs();
      this.#thumbObserver?.disconnect();
      this.#thumbObserver = null;
      this.#thumbsRendering.clear();
      this.#pageTextCache.clear();
      if (document.fullscreenElement === this.#hostEl.nativeElement) {
        document.exitFullscreen?.().catch(() => undefined);
      }
    });
  }

  ngOnDestroy(): void {
    // Cleanup logic dời vào DestroyRef.onDestroy ở constructor — giữ hook để
    // tương thích với `implements OnDestroy` (giúp test code `spyOn(comp, 'ngOnDestroy')`).
  }

  // ==========================================
  // PUBLIC API
  // ==========================================

  goToPage(page: number): void {
    const n = this.numPages();
    if (n <= 0) return;
    const target = Math.max(1, Math.min(page, n));
    if (target === this.#activePage()) return;
    this.#activePage.set(target);
    this.pageChange.emit(target);
    this.#renderActivePage();
  }

  nextPage(): void { this.goToPage(this.#activePage() + 1); }
  prevPage(): void { this.goToPage(this.#activePage() - 1); }
  firstPage(): void { this.goToPage(1); }
  lastPage(): void { this.goToPage(this.numPages()); }

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
      // Fit modes recompute against stage size + page natural size — done in
      // #renderActivePage which reads zoomMode().
      this.#renderActivePage();
    }
  }

  rotate(direction: 'left' | 'right'): void {
    const delta = direction === 'right' ? 90 : -90;
    this.#rotation.update(r => ((r + delta) % 360 + 360) % 360);
    this.#renderActivePage();
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

  // TODO(preview-pdf): setScrollMode is signature-only; continuous + horizontal
  // layout deferred. Currently this just updates internal state + emits a
  // warning when consumer asks for the deferred 'continuous' mode.
  setScrollMode(mode: PdfScrollMode): void {
    if (mode === 'continuous') {
      console.warn(
        // eslint-disable-next-line max-len
        '[sd-preview-pdf] setScrollMode("continuous") is deferred; staying in single-page mode.', // @i18n-ignore
      );
    }
    this.#scrollModeInternal.set(mode);
  }

  downloadFile(): void {
    if (!this.downloadable()) return;
    const src = this.source();
    const filename = this.#filename();

    // Strategy: if caller passed a URL, anchor download honors server's
    // Content-Disposition; for File/Blob/buffer sources we re-emit the blob.
    let href: string | null = null;
    if (typeof src === 'string') {
      href = src;
    } else if (src instanceof File || src instanceof Blob) {
      href = URL.createObjectURL(src);
      this.#ownedBlobUrls.add(href);
    } else if (this.#lastBlobUrl) {
      href = this.#lastBlobUrl;
    } else if (src && typeof src === 'object' && 'url' in src && typeof src.url === 'string') {
      href = src.url;
    } else if (src instanceof ArrayBuffer || src instanceof Uint8Array) {
      const blob = new Blob([src as BlobPart], { type: 'application/pdf' });
      href = URL.createObjectURL(blob);
      this.#ownedBlobUrls.add(href);
    }

    if (!href) return;
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.download.emit({ filename });
  }

  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      this.#hostEl.nativeElement.requestFullscreen?.().catch(() => undefined);
    } else {
      document.exitFullscreen?.().catch(() => undefined);
    }
  }

  /** Programmatic equivalent of clicking the X — emits the close output. */
  requestClose(): void {
    this.close.emit();
  }

  /** Retry the active load attempt (called from the error state retry button). */
  retryLoad(): void {
    this.#loadDocument(this.source());
  }

  // TODO(preview-pdf): printFile + scroll-mode continuous remain deferred.
  // Search is now implemented below.
  printFile(): void {
    console.warn(
      '[sd-preview-pdf] printFile() is deferred to a follow-up commit.', // @i18n-ignore
    );
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
  async search(
    term: string,
    options?: { caseSensitive?: boolean; wholeWord?: boolean },
  ): Promise<number> {
    const token = ++this.#searchToken;
    const cleanTerm = (term ?? '').trim();
    if (options?.caseSensitive !== undefined) {
      this.#searchCaseSensitive.set(options.caseSensitive);
    }
    if (options?.wholeWord !== undefined) {
      this.#searchWholeWord.set(options.wholeWord);
    }
    this.#searchTerm.set(cleanTerm);

    if (!cleanTerm) {
      this.#searchResults.set([]);
      this.#searchActiveIndex.set(-1);
      this.#emitSearchChange();
      return 0;
    }

    const doc = this.#pdfDoc();
    if (!doc) {
      this.#searchResults.set([]);
      this.#searchActiveIndex.set(-1);
      this.#emitSearchChange();
      return 0;
    }

    const re = this.#buildSearchRegex(
      cleanTerm,
      this.#searchCaseSensitive(),
      this.#searchWholeWord(),
    );
    if (!re) {
      this.#searchResults.set([]);
      this.#searchActiveIndex.set(-1);
      this.#emitSearchChange();
      return 0;
    }

    const results: PdfSearchResult[] = [];
    for (let p = 1; p <= doc.numPages; p++) {
      if (token !== this.#searchToken) return 0; // newer search superseded us
      const text = await this.#getPageText(doc, p);
      if (token !== this.#searchToken) return 0;
      // re is /g — must be re-created or `lastIndex` reset between pages.
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        const start = m.index;
        const matched = m[0];
        const end = start + matched.length;
        const before = text.slice(Math.max(0, start - 30), start);
        const after = text.slice(end, end + 30);
        results.push({ page: p, before, term: matched, after });
        // Defensive: zero-length match would loop forever.
        if (matched.length === 0) re.lastIndex++;
      }
    }

    if (token !== this.#searchToken) return 0;
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

  clearSearch(): void {
    this.#searchToken++;
    this.#searchTerm.set('');
    this.#searchResults.set([]);
    this.#searchActiveIndex.set(-1);
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
  onSearchInput(value: string): void {
    void this.search(value);
  }

  // ==========================================
  // KEYBOARD — bound to HOST (not document)
  // ==========================================
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const isSearchInput =
      !!target && target === this.searchInputRef()?.nativeElement;
    const isOtherEditable =
      !!target &&
      !isSearchInput &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable);

    // Ctrl/Cmd+F: open the search bar from anywhere (even when input has
    // focus, e.g. re-focus the search bar from the page input). Handled
    // before the input-target guard so it always works.
    if ((event.ctrlKey || event.metaKey) && (event.key === 'f' || event.key === 'F')) {
      event.preventDefault();
      this.openSearch();
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

  async #loadDocument(src: PdfSource | null | undefined): Promise<void> {
    const token = ++this.#loadToken;
    this.#cancelRender();
    await this.#destroyDoc();
    this.#revokeAllBlobs();
    this.#thumbCache.set({});
    this.#pageTextCache.clear();
    this.#thumbsRendering.clear();
    // Reset search state — results are per-document, but keep the term so a
    // newly-loaded source with the same term gets re-indexed automatically
    // on the next user keystroke. Active index resets unconditionally.
    this.#searchResults.set([]);
    this.#searchActiveIndex.set(-1);
    this.#loadError.set(null);
    this.#loadProgress.set({ loaded: 0, total: 0 });

    if (!src) {
      this.#stage.set('empty');
      this.#pdfDoc.set(null);
      this.#meta.set(null);
      this.#activePage.set(1);
      return;
    }

    this.#stage.set('loading');

    let spec: Record<string, unknown>;
    try {
      spec = await this.#normalizeSource(src);
    } catch (err) {
      if (token !== this.#loadToken) return;
      this.#emitError(this.#classifyError(err), this.#errorMessage(err));
      return;
    }
    if (this.password()) {
      spec['password'] = this.password();
    }

    let task: { promise: Promise<unknown>; onProgress?: (p: { loaded: number; total: number }) => void };
    try {
      task = this.#pdfjs.getDocument(spec) as unknown as typeof task;
      // pdfjs's loadingTask exposes onProgress as an assignable property.
      task.onProgress = (p: { loaded: number; total: number }) => {
        if (token !== this.#loadToken) return;
        this.#loadProgress.set({ loaded: p.loaded ?? 0, total: p.total ?? 0 });
      };
    } catch (err) {
      this.#emitError(this.#classifyError(err), this.#errorMessage(err));
      return;
    }

    let pdfDoc: PdfDocumentProxy;
    try {
      pdfDoc = (await task.promise) as PdfDocumentProxy;
    } catch (err) {
      if (token !== this.#loadToken) return;
      this.#emitError(this.#classifyError(err), this.#errorMessage(err));
      return;
    }
    if (token !== this.#loadToken) {
      // A newer source replaced us mid-load. Cleanup this stale doc.
      try { await pdfDoc.destroy(); } catch { /* ignore */ }
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

    this.#pdfDoc.set(pdfDoc);
    this.#meta.set(meta);
    this.#activePage.set(Math.max(1, Math.min(this.startPage(), pdfDoc.numPages)));
    this.#stage.set('ready');
    this.#zoom.set(1);
    this.#rotation.set(0);
    this.#zoomMode.set(this.initialZoom());

    this.loaded.emit({ totalPages: pdfDoc.numPages, meta });
    this.pageChange.emit(this.#activePage());

    await this.#renderActivePage();
  }

  async #renderActivePage(): Promise<void> {
    const pdfDoc = this.#pdfDoc();
    if (!pdfDoc) return;
    const token = ++this.#renderToken;
    const pageNum = this.#activePage();
    let page: PdfPageProxy;
    try {
      page = await pdfDoc.getPage(pageNum);
    } catch {
      return;
    }
    if (token !== this.#renderToken) return;

    const canvas = this.pageCanvasRef()?.nativeElement;
    if (!canvas) return;

    // Resolve scale from current zoom mode.
    const rotation = this.#rotation();
    const baseViewport = page.getViewport({ scale: 1, rotation });
    const scale = this.#resolveScale(baseViewport);
    this.#zoom.set(scale);
    const viewport = page.getViewport({ scale, rotation });

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    this.#cancelRender();
    const renderTask = page.render({ canvasContext: ctx, viewport });
    this.#currentRenderTask = renderTask;
    try {
      await renderTask.promise;
    } catch {
      // Cancelled mid-flight when user navigated to a new page — fine.
      return;
    } finally {
      if (this.#currentRenderTask === renderTask) {
        this.#currentRenderTask = null;
      }
    }

    page.cleanup();
    this.zoomChange.emit(scale);
  }

  #resolveScale(baseViewport: PdfViewport): number {
    const mode = this.#zoomMode();
    if (typeof mode === 'number') {
      return Math.min(
        SdPreviewPdf.MAX_ZOOM,
        Math.max(SdPreviewPdf.MIN_ZOOM, mode),
      );
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

  #cancelRender(): void {
    if (this.#currentRenderTask) {
      try { this.#currentRenderTask.cancel(); } catch { /* ignore */ }
      this.#currentRenderTask = null;
    }
  }

  async #destroyDoc(): Promise<void> {
    const doc = this.#pdfDoc();
    if (!doc) return;
    this.#pdfDoc.set(null);
    try { await doc.destroy(); } catch { /* ignore */ }
  }

  #setZoom(value: number): void {
    const clamped = Math.min(
      SdPreviewPdf.MAX_ZOOM,
      Math.max(SdPreviewPdf.MIN_ZOOM, value),
    );
    this.#zoom.set(clamped);
    this.#renderActivePage();
  }

  async #normalizeSource(src: PdfSource): Promise<Record<string, unknown>> {
    if (typeof src === 'string') {
      this.#filename.set(this.#guessName(src));
      const headers = this.httpHeaders();
      const spec: Record<string, unknown> = { url: src };
      if (headers) spec['httpHeaders'] = headers;
      return spec;
    }
    if (src instanceof File) {
      this.#filename.set(src.name);
      this.#fileSize.set(src.size);
      const buf = await src.arrayBuffer();
      return { data: new Uint8Array(buf) };
    }
    if (src instanceof Blob) {
      this.#filename.set('document.pdf');
      this.#fileSize.set(src.size);
      const buf = await src.arrayBuffer();
      return { data: new Uint8Array(buf) };
    }
    if (src instanceof ArrayBuffer) {
      this.#filename.set('document.pdf');
      this.#fileSize.set(src.byteLength);
      return { data: new Uint8Array(src) };
    }
    if (src instanceof Uint8Array) {
      this.#filename.set('document.pdf');
      this.#fileSize.set(src.byteLength);
      return { data: src };
    }
    if (src && typeof src === 'object') {
      if ('url' in src && typeof src.url === 'string') {
        this.#filename.set(this.#guessName(src.url));
        const spec: Record<string, unknown> = { url: src.url };
        // Caller-provided headers win over the [httpHeaders] input.
        const headers = src.httpHeaders ?? this.httpHeaders();
        if (headers) spec['httpHeaders'] = headers;
        if (src.withCredentials) spec['withCredentials'] = true;
        return spec;
      }
      if ('data' in src && (src.data instanceof ArrayBuffer || src.data instanceof Uint8Array)) {
        this.#filename.set('document.pdf');
        const data =
          src.data instanceof ArrayBuffer ? new Uint8Array(src.data) : src.data;
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
      URL.revokeObjectURL(url);
    }
    this.#ownedBlobUrls.clear();
    this.#lastBlobUrl = null;
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
    const pattern = wholeWord ? `\\b${escaped}\\b` : escaped;
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
  async #getPageText(doc: PdfDocumentProxy, pageNum: number): Promise<string> {
    const cached = this.#pageTextCache.get(pageNum);
    if (cached !== undefined) return cached;
    let page: PdfPageProxy;
    try {
      page = await doc.getPage(pageNum);
    } catch {
      return '';
    }
    let text = '';
    try {
      const tc = (await page.getTextContent()) as PdfTextContent;
      const items = Array.isArray(tc?.items) ? tc.items : [];
      const parts: string[] = [];
      for (const it of items) {
        const str = (it as PdfTextItem)?.str;
        if (typeof str === 'string') parts.push(str);
      }
      // Space-join so multi-word matches across textItem boundaries work.
      text = parts.join(' ').normalize('NFC');
    } catch {
      text = '';
    }
    this.#pageTextCache.set(pageNum, text);
    return text;
  }

  #emitSearchChange(): void {
    this.searchChange.emit({
      term: this.#searchTerm(),
      total: this.#searchResults().length,
      current: this.#searchActiveIndex() + 1, // 1-based; 0 when no active
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

    const pageHits = results
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r.page === activePage);
    if (pageHits.length === 0) return;

    const overlay = document.createElement('div');
    overlay.className = 'sd-pdf-search-overlay';
    for (const { r, i } of pageHits) {
      const m = document.createElement('mark');
      m.className =
        i === activeIdx ? 'sd-pdf-search-hi sd-pdf-search-hi--active' : 'sd-pdf-search-hi';
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

  // ==========================================
  // THUMBNAIL HELPERS
  // ==========================================

  /**
   * Rebind the IntersectionObserver to whatever set of thumbnail canvases is
   * currently mounted. Called from an effect that tracks `thumbCanvases()`.
   */
  #syncThumbObserver(canvases: HTMLCanvasElement[]): void {
    // Disconnect prior observer — refs are stale once the @for re-renders.
    this.#thumbObserver?.disconnect();
    if (canvases.length === 0) {
      this.#thumbObserver = null;
      return;
    }
    // Lazily create an IntersectionObserver scoped to the sidebar scroll
    // container so we only render thumbs the user can actually see. Falls
    // back to "render everything" when IntersectionObserver isn't available
    // (very old runtime / SSR shim).
    if (typeof IntersectionObserver !== 'function') {
      for (const c of canvases) {
        const n = Number(c.getAttribute('data-page'));
        if (Number.isFinite(n)) void this.#renderThumbnail(n, c);
      }
      return;
    }
    this.#thumbObserver = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const c = entry.target as HTMLCanvasElement;
          const n = Number(c.getAttribute('data-page'));
          if (!Number.isFinite(n)) continue;
          this.#thumbObserver?.unobserve(c); // one-shot — cached after first paint
          void this.#renderThumbnail(n, c);
        }
      },
      { rootMargin: '120px 0px 120px 0px', threshold: 0.01 },
    );
    for (const c of canvases) this.#thumbObserver.observe(c);
  }

  /**
   * Render a single page into a sidebar thumbnail canvas at ~140px width.
   * Cached via `#thumbsRendering` so rapid scroll bounces don't double-render.
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
    if (this.#thumbsRendering.has(pageNum)) return;
    if (this.#thumbCache()[pageNum]) {
      // Already cached → just blit the dataURL onto the canvas.
      this.#paintCachedThumb(canvas, this.#thumbCache()[pageNum]);
      return;
    }
    this.#thumbsRendering.add(pageNum);
    try {
      const page = await doc.getPage(pageNum);
      // Target ~140px wide for sidebar thumbs (handoff says 152px, leave a
      // small margin so the canvas itself can fit inside the page wrapper's
      // outline). PDF page viewport at scale=1 ≈ 612 wide; pick scale so the
      // result lands near 140px.
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = 140 / Math.max(1, baseViewport.width);
      const viewport = page.getViewport({ scale });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const renderTask = page.render({ canvasContext: ctx, viewport });
      try {
        await renderTask.promise;
      } catch {
        return; // cancelled / failed silently — keep the blank thumb
      }
      try {
        const dataUrl = canvas.toDataURL('image/png');
        this.#thumbCache.update(prev => ({ ...prev, [pageNum]: dataUrl }));
      } catch {
        // Tainted canvas (e.g. dev mock) — just skip caching, keep visual.
      }
      page.cleanup();
    } catch {
      // Page load failed — leave the thumb blank rather than throwing.
    } finally {
      this.#thumbsRendering.delete(pageNum);
    }
  }

  /**
   * Paint a previously-rendered dataURL onto a freshly-mounted canvas so the
   * mini-page reappears without re-rasterizing.
   */
  #paintCachedThumb(canvas: HTMLCanvasElement, dataUrl: string): void {
    const img = new Image();
    img.onload = () => {
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
