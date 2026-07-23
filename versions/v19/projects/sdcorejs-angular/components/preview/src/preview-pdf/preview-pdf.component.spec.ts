import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SD_PDFJS_LIB, SdPdfJsLib, SdPreviewPdf } from './preview-pdf.component';
import { SD_PDF_BROWSER_ADAPTER, SdPdfBrowserAdapter, SdPdfIntersectionEntry } from './preview-pdf.browser';
import { SD_PDF_PRINT_ADAPTER, SdPdfPrintAdapter, SdPdfPrintJob } from './preview-pdf.print';
import { SdPdfDocumentProxy, SdPdfDocumentSpec, SdPdfRawOutlineItem, SdPdfReference } from './preview-pdf.pdfjs';

interface Deferred<T> {
  readonly promise: Promise<T>;
  resolve(value: T): void;
  reject(reason: unknown): void;
}

function deferred<T>(): Deferred<T> {
  let resolvePromise: (value: T) => void = () => undefined;
  let rejectPromise: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return { promise, resolve: resolvePromise, reject: rejectPromise };
}

// ============================================================================
// Mock pdfjs library
//
// pdfjs is injected via SD_PDFJS_LIB. We provide a fake `getDocument()` that
// returns a controllable loading task — tests drive the promise to resolve or
// reject as needed. The "document" is itself a fake with `numPages`, `getPage`,
// `getMetadata`, and `destroy`.
// ============================================================================
interface FakePageRecord {
  rendered: number;
  cleaned: number;
  cancelled: number;
}

function makeFakePage(records?: FakePageRecord): {
  page: ReturnType<typeof getPage>;
  records: FakePageRecord;
} {
  const rec: FakePageRecord = records ?? { rendered: 0, cleaned: 0, cancelled: 0 };
  function getPage() {
    return {
      getViewport: (_: { scale: number; rotation?: number }) => ({ width: 612, height: 792 }),
      render: (_: unknown) => {
        rec.rendered++;
        return {
          promise: Promise.resolve(),
          cancel: () => {
            rec.cancelled++;
          },
        };
      },
      getTextContent: () => Promise.resolve({}),
      cleanup: () => {
        rec.cleaned++;
      },
    };
  }
  return { page: getPage(), records: rec };
}

function makeFakeDoc(
  numPages: number,
  opts?: {
    destroyTracker?: { calls: number };
    pageTexts?: Record<number, string>;
    metadata?: Promise<{ info?: { Title?: string; Author?: string; Subject?: string } }>;
    data?: Uint8Array;
    outline?: readonly SdPdfRawOutlineItem[];
    destinations?: Record<string, readonly unknown[]>;
    pageIndices?: Record<number, number>;
    cachedPages?: Record<number, number>;
  }
) {
  const pageRecords = new Map<number, FakePageRecord>();
  const destroyTracker = opts?.destroyTracker ?? { calls: 0 };
  const texts = opts?.pageTexts ?? {};
  return {
    numPages,
    getPage: (n: number) => {
      let rec = pageRecords.get(n);
      if (!rec) {
        rec = { rendered: 0, cleaned: 0, cancelled: 0 };
        pageRecords.set(n, rec);
      }
      const { page } = makeFakePage(rec);
      // Override getTextContent to return predictable items for search tests.
      const pageText = texts[n] ?? '';
      page.getTextContent = () =>
        Promise.resolve({
          items: pageText
            ? pageText
                .split(/\s+/)
                .filter(Boolean)
                .map(str => ({ str }))
            : [],
        });
      return Promise.resolve(page);
    },
    getMetadata: () =>
      opts?.metadata ??
      Promise.resolve({
        info: { Title: 'Hello PDF', Author: 'Tester', Subject: 'Subj' },
      }),
    getOutline: () => Promise.resolve(opts?.outline ?? []),
    getDestination: (name: string) => Promise.resolve(opts?.destinations?.[name] ?? null),
    getPageIndex: (ref: SdPdfReference) => Promise.resolve(opts?.pageIndices?.[ref.num] ?? 0),
    cachedPageNumber: (ref: SdPdfReference) => opts?.cachedPages?.[ref.num] ?? null,
    getData: () => Promise.resolve(new Uint8Array(opts?.data ?? [0x25, 0x50, 0x44, 0x46])),
    destroy: () => {
      destroyTracker.calls++;
      return Promise.resolve();
    },
    _pageRecords: pageRecords,
    _destroyTracker: destroyTracker,
  };
}

interface FakeTask {
  promise: Promise<SdPdfDocumentProxy>;
  onProgress?: (p: { loaded: number; total: number }) => void;
  destroy: () => Promise<void>;
  destroyCalls: number;
}

function makeFakePdfLib(): SdPdfJsLib & {
  // exposed test helpers:
  resolveNext: (doc: SdPdfDocumentProxy) => void;
  rejectNext: (err: unknown) => void;
  emitProgress: (loaded: number, total: number) => void;
  lastSpec: () => unknown;
  callCount: () => number;
  taskAt: (index: number) => FakeTask;
  resolveAt: (index: number, doc: SdPdfDocumentProxy) => void;
  rejectAt: (index: number, err: unknown) => void;
} {
  let pendingTask: FakeTask | null = null;
  let lastSpec: unknown = null;
  let calls = 0;
  const tasks: {
    task: FakeTask;
    resolve: (value: SdPdfDocumentProxy) => void;
    reject: (reason: unknown) => void;
  }[] = [];
  const lib: SdPdfJsLib = {
    GlobalWorkerOptions: { workerSrc: '' },
    getDocument: (spec: SdPdfDocumentSpec) => {
      calls++;
      lastSpec = spec;
      const loading = deferred<SdPdfDocumentProxy>();
      const task: FakeTask = {
        promise: loading.promise,
        destroyCalls: 0,
        destroy: () => {
          task.destroyCalls++;
          return Promise.resolve();
        },
      };
      tasks.push({ task, resolve: loading.resolve, reject: loading.reject });
      pendingTask = task;
      return task;
    },
  };
  return Object.assign(lib, {
    resolveNext: (doc: SdPdfDocumentProxy) => {
      const pending = tasks[tasks.length - 1];
      pending?.resolve(doc);
    },
    rejectNext: (err: unknown) => {
      const pending = tasks[tasks.length - 1];
      pending?.reject(err);
    },
    emitProgress: (loaded: number, total: number) => {
      pendingTask?.onProgress?.({ loaded, total });
    },
    lastSpec: () => lastSpec,
    callCount: () => calls,
    taskAt: (index: number) => tasks[index].task,
    resolveAt: (index: number, doc: SdPdfDocumentProxy) => tasks[index].resolve(doc),
    rejectAt: (index: number, err: unknown) => tasks[index].reject(err),
  });
}

class FakeBrowserAdapter implements SdPdfBrowserAdapter {
  isBrowser = true;
  canDownloadUrl = true;
  canDownloadBlob = true;
  canFullscreen = true;
  readonly downloads: { href: string; filename: string }[] = [];
  readonly createdUrls: string[] = [];
  readonly revokedUrls: string[] = [];
  fullscreenListener: ((active: boolean) => void) | null = null;
  intersectionListener: ((entries: readonly SdPdfIntersectionEntry[]) => void) | null = null;
  resizeListener: (() => void) | null = null;
  frameId = 0;
  fullscreenToggles = 0;
  fullscreenFailure: Error | null = null;

  isFile(value: unknown): value is File {
    return typeof File === 'function' && value instanceof File;
  }

  isBlob(value: unknown): value is Blob {
    return typeof Blob === 'function' && value instanceof Blob;
  }

  createPdfBlob(data: Uint8Array): Blob | null {
    return new Blob([new Uint8Array(data)], { type: 'application/pdf' });
  }

  createObjectUrl(_blob: Blob): string | null {
    const url = `blob:fake-${this.createdUrls.length + 1}`;
    this.createdUrls.push(url);
    return url;
  }

  revokeObjectUrl(url: string): void {
    this.revokedUrls.push(url);
  }

  download(href: string, filename: string): boolean {
    this.downloads.push({ href, filename });
    return true;
  }

  createElement<K extends keyof HTMLElementTagNameMap>(tagName: K): HTMLElementTagNameMap[K] | null {
    return document.createElement(tagName);
  }

  createImage(): HTMLImageElement | null {
    return document.createElement('img');
  }

  listenFullscreen(_host: HTMLElement, listener: (active: boolean) => void): () => void {
    this.fullscreenListener = listener;
    return () => {
      this.fullscreenListener = null;
    };
  }

  toggleFullscreen(_host: HTMLElement): Promise<void> {
    this.fullscreenToggles++;
    return this.fullscreenFailure ? Promise.reject(this.fullscreenFailure) : Promise.resolve();
  }

  observeResize(_element: Element, listener: () => void): () => void {
    this.resizeListener = listener;
    return () => {
      this.resizeListener = null;
    };
  }

  observeIntersections(
    _elements: readonly Element[],
    listener: (entries: readonly SdPdfIntersectionEntry[]) => void,
    _options?: IntersectionObserverInit
  ): () => void {
    this.intersectionListener = listener;
    return () => {
      this.intersectionListener = null;
    };
  }

  scheduleFrame(callback: FrameRequestCallback): number | null {
    const id = ++this.frameId;
    queueMicrotask(() => callback(id));
    return id;
  }

  cancelFrame(_handle: number | null): void {}
}

class FakePrintAdapter implements SdPdfPrintAdapter {
  isSupported = true;
  readonly jobs: {
    data: Uint8Array;
    filename: string;
    job: SdPdfPrintJob;
    finish: () => void;
    cancelCounter: { calls: number };
  }[] = [];

  start(data: Uint8Array, filename: string): SdPdfPrintJob | null {
    const completion = deferred<void>();
    const cancelCounter = { calls: 0 };
    const job: SdPdfPrintJob = {
      finished: completion.promise,
      cancel: () => {
        cancelCounter.calls++;
        completion.resolve();
      },
    };
    this.jobs.push({ data: new Uint8Array(data), filename, job, finish: () => completion.resolve(), cancelCounter });
    return job;
  }
}

// Custom named exception classes so #classifyError sniffs by `.name`.
class PasswordException extends Error {
  override name = 'PasswordException';
}
class InvalidPDFException extends Error {
  override name = 'InvalidPDFException';
}
class MissingPDFException extends Error {
  override name = 'MissingPDFException';
}
class UnexpectedResponseException extends Error {
  override name = 'UnexpectedResponseException';
}

// Helper: trigger source effect by setting input + waiting for microtasks.
// #loadDocument chains many awaits (normalize / getDoc / getMetadata / render).
// Drive both microtasks and a macrotask so any setTimeout/zone work clears.
async function flush(fixture: ComponentFixture<unknown>, rounds = 4): Promise<void> {
  for (let i = 0; i < rounds; i++) {
    fixture.detectChanges();
    await fixture.whenStable();
    // Microtask flush — chase the await chain inside the component.
    for (let m = 0; m < 8; m++) await Promise.resolve();
    // Single macrotask hop in case anything used setTimeout(0).
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  }
  fixture.detectChanges();
}

describe('SdPreviewPdf', () => {
  let fixture: ComponentFixture<SdPreviewPdf>;
  let comp: SdPreviewPdf;
  let lib: ReturnType<typeof makeFakePdfLib>;
  let browser: FakeBrowserAdapter;
  let print: FakePrintAdapter;

  beforeEach(async () => {
    lib = makeFakePdfLib();
    browser = new FakeBrowserAdapter();
    print = new FakePrintAdapter();
    await TestBed.configureTestingModule({
      imports: [SdPreviewPdf, NoopAnimationsModule],
      providers: [
        { provide: SD_PDFJS_LIB, useValue: lib },
        { provide: SD_PDF_BROWSER_ADAPTER, useValue: browser },
        { provide: SD_PDF_PRINT_ADAPTER, useValue: print },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SdPreviewPdf);
    comp = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  // ==========================================================================
  // Empty state
  // ==========================================================================
  describe('empty state', () => {
    it('starts in empty stage with no source', () => {
      fixture.detectChanges();
      expect(comp.stage()).toBe('empty');
      expect(comp.numPages()).toBe(0);
    });

    it('renders empty title from i18n', () => {
      fixture.detectChanges();
      const title = fixture.nativeElement.querySelector('.sd-preview-pdf-status__title');
      expect(title?.textContent).toContain('Không có');
    });
  });

  // ==========================================================================
  // Loading state
  // ==========================================================================
  describe('loading state', () => {
    it('moves to loading when source is set', async () => {
      fixture.componentRef.setInput('source', 'https://example.com/a.pdf');
      await flush(fixture);
      expect(comp.stage()).toBe('loading');
    });

    it('updates loadPercent from onProgress callback', async () => {
      fixture.componentRef.setInput('source', 'https://example.com/a.pdf');
      await flush(fixture);
      lib.emitProgress(50, 100);
      await flush(fixture);
      expect(comp.loadPercent()).toBe(50);
    });

    it('exposes determinate progress semantics while loading', async () => {
      fixture.componentRef.setInput('source', 'https://example.com/a.pdf');
      await flush(fixture);
      lib.emitProgress(25, 100);
      await flush(fixture);
      const progress = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement | null;
      expect(progress?.getAttribute('aria-valuemin')).toBe('0');
      expect(progress?.getAttribute('aria-valuemax')).toBe('100');
      expect(progress?.getAttribute('aria-valuenow')).toBe('25');
      expect(progress?.getAttribute('aria-label')).toBeTruthy();
    });
  });

  // ==========================================================================
  // Successful load
  // ==========================================================================
  describe('loaded state', () => {
    let loadedEvents: { totalPages: number }[];

    beforeEach(async () => {
      loadedEvents = [];
      comp.loaded.subscribe(e => loadedEvents.push(e));
      fixture.componentRef.setInput('source', 'https://example.com/a.pdf');
      await flush(fixture);
      lib.resolveNext(makeFakeDoc(3));
      await flush(fixture);
    });

    it('reports ready stage', () => {
      expect(comp.stage()).toBe('ready');
    });

    it('emits loaded with numPages + meta', () => {
      expect(loadedEvents.length).toBe(1);
      expect(loadedEvents[0].totalPages).toBe(3);
    });

    it('exposes numPages from meta', () => {
      expect(comp.numPages()).toBe(3);
    });

    it('renders the page canvas', () => {
      const canvas = fixture.nativeElement.querySelector('canvas.sd-preview-pdf-page');
      expect(canvas).not.toBeNull();
    });
  });

  // ==========================================================================
  // Page navigation
  // ==========================================================================
  describe('page navigation', () => {
    let pageEvents: number[];

    beforeEach(async () => {
      pageEvents = [];
      comp.pageChange.subscribe(p => pageEvents.push(p));
      fixture.componentRef.setInput('source', 'https://example.com/a.pdf');
      await flush(fixture);
      lib.resolveNext(makeFakeDoc(5));
      await flush(fixture);
      pageEvents.length = 0; // ignore the initial pageChange emission
    });

    it('nextPage advances and emits', () => {
      comp.nextPage();
      expect(comp.activePage()).toBe(2);
      expect(pageEvents).toContain(2);
    });

    it('prevPage at page 1 is a no-op', () => {
      comp.prevPage();
      expect(comp.activePage()).toBe(1);
      expect(pageEvents.length).toBe(0);
    });

    it('prevPage from page 3 decrements to 2', () => {
      comp.goToPage(3);
      pageEvents.length = 0;
      comp.prevPage();
      expect(comp.activePage()).toBe(2);
    });

    it('firstPage jumps to 1', () => {
      comp.goToPage(4);
      comp.firstPage();
      expect(comp.activePage()).toBe(1);
    });

    it('lastPage jumps to numPages', () => {
      comp.lastPage();
      expect(comp.activePage()).toBe(5);
    });

    it('goToPage clamps over numPages', () => {
      comp.goToPage(99);
      expect(comp.activePage()).toBe(5);
    });

    it('goToPage clamps below 1', () => {
      comp.goToPage(0);
      expect(comp.activePage()).toBe(1);
    });
  });

  // ==========================================================================
  // Zoom
  // ==========================================================================
  describe('zoom', () => {
    beforeEach(async () => {
      fixture.componentRef.setInput('source', 'https://example.com/a.pdf');
      await flush(fixture);
      lib.resolveNext(makeFakeDoc(2));
      await flush(fixture);
    });

    it('zoomIn increases zoom by a step', () => {
      const before = comp.zoom();
      comp.zoomIn();
      expect(comp.zoom()).toBeGreaterThan(before);
    });

    it('zoomOut decreases zoom by a step', () => {
      comp.setZoom(2);
      const before = comp.zoom();
      comp.zoomOut();
      expect(comp.zoom()).toBeLessThan(before);
    });

    it('clamps to MIN_ZOOM', () => {
      for (let i = 0; i < 40; i++) comp.zoomOut();
      expect(comp.zoom()).toBeGreaterThanOrEqual(SdPreviewPdf.MIN_ZOOM);
    });

    it('clamps to MAX_ZOOM', () => {
      for (let i = 0; i < 60; i++) comp.zoomIn();
      expect(comp.zoom()).toBeLessThanOrEqual(SdPreviewPdf.MAX_ZOOM);
    });

    it('setZoom("page-fit") updates zoomMode', () => {
      comp.setZoom('page-fit');
      expect(comp.zoomMode()).toBe('page-fit');
    });

    it('setZoom(1.5) updates numeric zoom', () => {
      comp.setZoom(1.5);
      expect(comp.zoom()).toBeCloseTo(1.5, 5);
    });

    it('emits zoomChange after a render', async () => {
      const events: number[] = [];
      comp.zoomChange.subscribe(z => events.push(z));
      comp.setZoom(1.2);
      // wait for #renderActivePage's promise chain
      await flush(fixture);
      await flush(fixture);
      expect(events.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Rotate
  // ==========================================================================
  describe('rotate', () => {
    beforeEach(async () => {
      fixture.componentRef.setInput('source', 'https://example.com/a.pdf');
      await flush(fixture);
      lib.resolveNext(makeFakeDoc(2));
      await flush(fixture);
    });

    it('rotate("right") adds 90', () => {
      comp.rotate('right');
      expect(comp.rotation()).toBe(90);
    });

    it('rotate("right") wraps past 360', () => {
      comp.rotate('right');
      comp.rotate('right');
      comp.rotate('right');
      comp.rotate('right');
      expect(comp.rotation()).toBe(0);
    });

    it('rotate("left") wraps below 0', () => {
      comp.rotate('left');
      expect(comp.rotation()).toBe(270);
    });
  });

  // ==========================================================================
  // Sidebar
  // ==========================================================================
  describe('sidebar', () => {
    beforeEach(async () => {
      fixture.componentRef.setInput('source', 'https://example.com/a.pdf');
      await flush(fixture);
      lib.resolveNext(makeFakeDoc(2));
      await flush(fixture);
    });

    it('toggleSidebar flips openness', () => {
      const before = comp.isSidebarOpen();
      comp.toggleSidebar();
      expect(comp.isSidebarOpen()).toBe(!before);
    });

    it('setSidebarMode("outline") switches tab', () => {
      comp.setSidebarMode('outline');
      expect(comp.sidebarMode()).toBe('outline');
    });

    it('setSidebarMode("search") switches tab', () => {
      comp.setSidebarMode('search');
      expect(comp.sidebarMode()).toBe('search');
    });

    it('does not show a placeholder for an empty outline', async () => {
      comp.setSidebarMode('outline');
      await flush(fixture);
      const el = fixture.nativeElement.querySelector('.sd-preview-pdf-sidebar__message');
      expect(el).toBeNull();
    });

    it('links tabs to the active panel with selected semantics', () => {
      const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLElement>;
      const panel = fixture.nativeElement.querySelector('[role="tabpanel"]') as HTMLElement | null;
      expect(tabs[0].getAttribute('aria-selected')).toBe('true');
      expect(tabs[1].getAttribute('aria-selected')).toBe('false');
      expect(tabs[0].getAttribute('aria-controls')).toBe(panel?.id ?? null);
      expect(panel?.getAttribute('aria-labelledby')).toBe(tabs[0].id);
    });

    it('exposes sidebar and search disclosure state with controlled targets', async () => {
      fixture.componentRef.setInput('autoId', 'disclosures');
      await flush(fixture);

      const sidebarToggle = fixture.nativeElement.querySelector(`[data-autoId="${comp.autoIdSidebarToggle()}"]`) as HTMLButtonElement;
      const searchToggle = fixture.nativeElement.querySelector(`[data-autoId="${comp.autoIdSearchToggle()}"]`) as HTMLButtonElement;
      const sidebarPanel = fixture.nativeElement.querySelector('[role="tabpanel"]') as HTMLElement;
      const document = fixture.nativeElement.ownerDocument as Document;

      expect(sidebarToggle.getAttribute('aria-expanded')).toBe('true');
      const sidebarControls = sidebarToggle.getAttribute('aria-controls');
      const sidebarTarget = document.getElementById(sidebarControls ?? '');
      expect(sidebarTarget).not.toBeNull();
      expect(sidebarTarget?.hidden).toBeFalse();
      expect(sidebarPanel).not.toBeNull();
      expect(searchToggle.getAttribute('aria-expanded')).toBe('false');
      const searchControls = searchToggle.getAttribute('aria-controls');
      expect(searchControls).toBeTruthy();
      const collapsedSearchTarget = document.getElementById(searchControls ?? '');
      expect(collapsedSearchTarget).not.toBeNull();
      expect(collapsedSearchTarget?.hidden).toBeTrue();

      searchToggle.click();
      await flush(fixture);
      const searchBar = fixture.nativeElement.querySelector('[role="search"]') as HTMLElement;
      expect(searchToggle.getAttribute('aria-expanded')).toBe('true');
      expect(searchBar.id).toBe(searchControls ?? '');
      expect(document.getElementById(searchControls ?? '')).toBe(collapsedSearchTarget);
      expect(searchBar.hidden).toBeFalse();

      sidebarToggle.click();
      await flush(fixture);
      expect(sidebarToggle.getAttribute('aria-expanded')).toBe('false');
      expect(document.getElementById(sidebarControls ?? '')).toBe(sidebarTarget);
      expect(sidebarTarget?.hidden).toBeTrue();
    });

    it('uses arrow, Home, and End keys for roving tab focus with automatic activation', async () => {
      const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;

      tabs[0].focus();
      tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await flush(fixture);
      expect(comp.sidebarMode()).toBe('outline');
      expect(document.activeElement).toBe(tabs[1]);
      expect(tabs[1].tabIndex).toBe(0);
      expect(tabs[0].tabIndex).toBe(-1);
      expect(comp.activePage()).toBe(1);

      tabs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      await flush(fixture);
      expect(comp.sidebarMode()).toBe('search');
      expect(document.activeElement).toBe(tabs[2]);

      tabs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      await flush(fixture);
      expect(comp.sidebarMode()).toBe('thumbnails');
      expect(document.activeElement).toBe(tabs[0]);

      tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      await flush(fixture);
      expect(comp.sidebarMode()).toBe('search');
      expect(document.activeElement).toBe(tabs[2]);
    });
  });

  describe('canvas resource limits', () => {
    it('clamps backing dimensions and pixel area while preserving logical CSS size', async () => {
      fixture.componentRef.setInput('initialZoom', 'page-actual');
      fixture.componentRef.setInput('source', 'https://example.com/oversized.pdf');
      await flush(fixture);
      const doc = makeFakeDoc(1);
      const oversized = makeFakePage().page;
      oversized.getViewport = ({ scale }: { scale: number }) => ({ width: 20_000 * scale, height: 10_000 * scale });
      doc.getPage = () => Promise.resolve(oversized);
      lib.resolveNext(doc);
      await flush(fixture);
      comp.setZoom('page-actual');
      await flush(fixture);

      const canvas = fixture.nativeElement.querySelector('canvas.sd-preview-pdf-page') as HTMLCanvasElement;
      expect(canvas.width).toBeLessThanOrEqual(SdPreviewPdf.MAX_CANVAS_DIMENSION);
      expect(canvas.height).toBeLessThanOrEqual(SdPreviewPdf.MAX_CANVAS_DIMENSION);
      expect(canvas.width * canvas.height).toBeLessThanOrEqual(SdPreviewPdf.MAX_CANVAS_PIXELS);
      expect(parseFloat(canvas.style.width)).toBe(20_000);
      expect(parseFloat(canvas.style.height)).toBe(10_000);
    });
  });

  describe('recursive outline', () => {
    const outline: readonly SdPdfRawOutlineItem[] = [
      {
        title: 'Chapter 1',
        dest: [0],
        items: [
          {
            title: 'Section 1.1',
            dest: 'section-one',
            items: [{ title: 'Deep topic', dest: [{ num: 9, gen: 0 }] }],
          },
        ],
      },
      { title: 'Project website', url: 'https://example.com/docs' },
      { title: 'Unsafe link', url: 'javascript:alert(1)' },
    ];

    async function loadOutlinedDocument(): Promise<void> {
      fixture.componentRef.setInput('source', 'https://example.com/outlined.pdf');
      await flush(fixture);
      lib.resolveNext(
        makeFakeDoc(6, {
          outline,
          destinations: { 'section-one': [1] },
          pageIndices: { 9: 3 },
        })
      );
      await flush(fixture);
      comp.setSidebarMode('outline');
      await flush(fixture);
    }

    it('projects three-level items and resolves direct, named, and reference destinations', async () => {
      await loadOutlinedDocument();

      const tree = comp.outline();
      expect(tree[0].page).toBe(1);
      expect(tree[0].children[0].page).toBe(2);
      expect(tree[0].children[0].children[0].page).toBe(4);
      expect(tree[1].url).toBe('https://example.com/docs');
      expect(tree[2].url).toBeUndefined();

      const externalLink = fixture.nativeElement.querySelector('a[href="https://example.com/docs"]') as HTMLAnchorElement;
      expect(externalLink.target).toBe('_blank');
      expect(externalLink.rel).toContain('noopener');
      expect(fixture.nativeElement.querySelector('a[href^="javascript:"]')).toBeNull();
    });

    it('renders tree semantics, tracks the current page, and supports tree keyboard navigation', async () => {
      await loadOutlinedDocument();

      const tree = fixture.nativeElement.querySelector('[role="tree"]') as HTMLElement;
      expect(tree).not.toBeNull();
      let items = tree.querySelectorAll<HTMLElement>('[role="treeitem"]');
      expect(Array.from(items).map(item => item.getAttribute('aria-level'))).toEqual(['1', '2', '3', '1', '1']);
      expect(items[0].getAttribute('aria-expanded')).toBe('true');
      expect(items[0].getAttribute('aria-current')).toBe('page');

      items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      await flush(fixture);
      items = tree.querySelectorAll<HTMLElement>('[role="treeitem"]');
      expect(items.length).toBe(3);
      expect(items[0].getAttribute('aria-expanded')).toBe('false');

      items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await flush(fixture);
      items = tree.querySelectorAll<HTMLElement>('[role="treeitem"]');
      items[0].focus();
      items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await flush(fixture);
      expect(document.activeElement?.textContent).toContain('Section 1.1');

      (document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(comp.activePage()).toBe(2);
      await flush(fixture);
      expect(tree.querySelectorAll<HTMLElement>('[role="treeitem"]')[1].getAttribute('aria-current')).toBe('page');
    });

    it('bounds cyclic and excessively deep outline graphs while preserving safe partial rows', async () => {
      const root = { title: 'Root', dest: [0], items: [] as SdPdfRawOutlineItem[] };
      root.items.push(root);
      fixture.componentRef.setInput('source', 'https://example.com/cyclic-outline.pdf');
      await flush(fixture);
      lib.resolveNext(makeFakeDoc(2, { outline: [root] }));
      await flush(fixture);

      expect(comp.stage()).toBe('ready');
      expect(comp.outline().map(item => item.title)).toEqual(['Root']);
      expect(comp.outline()[0].children).toEqual([]);
    });

    it('renders a shared DAG node beneath every parent while still stopping ancestor cycles', async () => {
      const shared: SdPdfRawOutlineItem = { title: 'Shared section', dest: [1] };
      const first: SdPdfRawOutlineItem = { title: 'First parent', dest: [0], items: [shared] };
      const second: SdPdfRawOutlineItem = { title: 'Second parent', dest: [0], items: [shared] };
      fixture.componentRef.setInput('source', 'https://example.com/dag-outline.pdf');
      await flush(fixture);
      lib.resolveNext(makeFakeDoc(2, { outline: [first, second] }));
      await flush(fixture);

      expect(comp.outline().map(item => item.children.map(child => child.title))).toEqual([['Shared section'], ['Shared section']]);
      expect(comp.outline()[0].children[0].id).not.toBe(comp.outline()[1].children[0].id);
    });

    it('keeps invalid or rejected destinations as non-navigable partial outline items', async () => {
      const doc = makeFakeDoc(2, {
        outline: [
          { title: 'Before start', dest: [-1] },
          { title: 'Past end', dest: [99] },
          { title: 'Rejected named target', dest: 'broken' },
        ],
      });
      doc.getDestination = () => Promise.reject(new Error('bad destination'));
      fixture.componentRef.setInput('source', 'https://example.com/invalid-destinations.pdf');
      await flush(fixture);
      lib.resolveNext(doc);
      await flush(fixture);

      expect(comp.outline().map(item => item.page)).toEqual([null, null, null]);
      expect(comp.stage()).toBe('ready');
    });

    it('discards a named destination that resolves after source replacement', async () => {
      const destination = deferred<readonly unknown[] | null>();
      const staleTracker = { calls: 0 };
      const stale = makeFakeDoc(2, {
        destroyTracker: staleTracker,
        outline: [{ title: 'Stale target', dest: 'later' }],
      });
      stale.getDestination = () => destination.promise;
      fixture.componentRef.setInput('source', 'https://example.com/stale-outline.pdf');
      await flush(fixture);
      lib.resolveAt(0, stale);
      await flush(fixture, 1);

      fixture.componentRef.setInput('source', 'https://example.com/current.pdf');
      await flush(fixture);
      lib.resolveAt(1, makeFakeDoc(1, { outline: [{ title: 'Current', dest: [0] }] }));
      await flush(fixture);
      destination.resolve([1]);
      await flush(fixture);

      expect(comp.outline().map(item => item.title)).toEqual(['Current']);
      expect(staleTracker.calls).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Keyboard
  // ==========================================================================
  describe('keyboard', () => {
    beforeEach(async () => {
      fixture.componentRef.setInput('source', 'https://example.com/a.pdf');
      await flush(fixture);
      lib.resolveNext(makeFakeDoc(5));
      await flush(fixture);
    });

    function key(k: string): void {
      const ev = new KeyboardEvent('keydown', { key: k, bubbles: true });
      comp.onKeyDown(ev);
    }

    it('ArrowRight advances page', () => {
      key('ArrowRight');
      expect(comp.activePage()).toBe(2);
    });

    it('ArrowLeft goes back', () => {
      comp.goToPage(3);
      key('ArrowLeft');
      expect(comp.activePage()).toBe(2);
    });

    it('Home jumps to first page', () => {
      comp.goToPage(4);
      key('Home');
      expect(comp.activePage()).toBe(1);
    });

    it('End jumps to last page', () => {
      key('End');
      expect(comp.activePage()).toBe(5);
    });

    it('+ zooms in', () => {
      const before = comp.zoom();
      key('+');
      expect(comp.zoom()).toBeGreaterThan(before);
    });

    it('0 sets page-fit mode', () => {
      key('0');
      expect(comp.zoomMode()).toBe('page-fit');
    });

    it('r rotates right', () => {
      key('r');
      expect(comp.rotation()).toBe(90);
    });

    it('Esc does NOT emit close (per new pattern)', () => {
      let closes = 0;
      comp.close.subscribe(() => closes++);
      key('Escape');
      expect(closes).toBe(0);
    });

    it('ignores keys when target is an INPUT', () => {
      const input = document.createElement('input');
      const ev = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      Object.defineProperty(ev, 'target', { value: input });
      comp.onKeyDown(ev);
      expect(comp.activePage()).toBe(1);
    });
  });

  // ==========================================================================
  // Error states
  // ==========================================================================
  describe('error states', () => {
    async function triggerError(err: unknown): Promise<{ reason: string }> {
      const errors: { reason: string }[] = [];
      comp.loadError.subscribe(e => errors.push(e));
      fixture.componentRef.setInput('source', 'https://example.com/a.pdf');
      await flush(fixture);
      lib.rejectNext(err);
      await flush(fixture);
      await flush(fixture);
      return errors[0];
    }

    it('classifies PasswordException → password', async () => {
      const e = await triggerError(new PasswordException('locked'));
      expect(e.reason).toBe('password');
      expect(comp.stage()).toBe('error');
    });

    it('classifies InvalidPDFException → invalid', async () => {
      const e = await triggerError(new InvalidPDFException('bad'));
      expect(e.reason).toBe('invalid');
    });

    it('classifies MissingPDFException → network', async () => {
      const e = await triggerError(new MissingPDFException('404'));
      expect(e.reason).toBe('network');
    });

    it('classifies UnexpectedResponseException → network', async () => {
      const e = await triggerError(new UnexpectedResponseException('500'));
      expect(e.reason).toBe('network');
    });

    it('classifies generic Error → unknown', async () => {
      const e = await triggerError(new Error('weird'));
      expect(e.reason).toBe('unknown');
    });

    it('announces the error state as an alert', async () => {
      await triggerError(new InvalidPDFException('bad'));
      const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement | null;
      expect(alert).not.toBeNull();
      expect(alert?.getAttribute('aria-live')).toBe('assertive');
    });

    it('retryLoad triggers another getDocument call', async () => {
      await triggerError(new Error('first try'));
      const before = lib.callCount();
      comp.retryLoad();
      await flush(fixture);
      expect(lib.callCount()).toBe(before + 1);
    });
  });

  // ==========================================================================
  // Source variants
  // ==========================================================================
  describe('source variants', () => {
    it('accepts a string URL', async () => {
      fixture.componentRef.setInput('source', 'https://example.com/abc.pdf');
      await flush(fixture);
      const spec = lib.lastSpec() as { url?: string };
      expect(spec.url).toBe('https://example.com/abc.pdf');
    });

    it('accepts an object {url, httpHeaders}', async () => {
      fixture.componentRef.setInput('source', {
        url: 'https://example.com/secure.pdf',
        httpHeaders: { Authorization: 'Bearer x' },
      });
      await flush(fixture);
      const spec = lib.lastSpec() as { url?: string; httpHeaders?: Record<string, string> };
      expect(spec.url).toContain('secure.pdf');
      expect(spec.httpHeaders?.['Authorization']).toBe('Bearer x');
    });

    it('accepts a File and passes {data}', async () => {
      const file = new File([new Uint8Array([1, 2, 3])], 'doc.pdf', { type: 'application/pdf' });
      fixture.componentRef.setInput('source', file);
      await flush(fixture);
      await flush(fixture);
      const spec = lib.lastSpec() as { data?: Uint8Array };
      expect(spec.data).toBeInstanceOf(Uint8Array);
      expect(comp.filename()).toBe('doc.pdf');
    });

    it('accepts a Uint8Array', async () => {
      const u8 = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
      fixture.componentRef.setInput('source', u8);
      await flush(fixture);
      const spec = lib.lastSpec() as { data?: Uint8Array };
      expect(spec.data).not.toBe(u8);
      expect(spec.data).toEqual(u8);
    });

    it('accepts an ArrayBuffer', async () => {
      const buf = new ArrayBuffer(8);
      fixture.componentRef.setInput('source', buf);
      await flush(fixture);
      const spec = lib.lastSpec() as { data?: Uint8Array };
      expect(spec.data).toBeInstanceOf(Uint8Array);
    });

    it('accepts {data} object', async () => {
      const data = new Uint8Array(4);
      fixture.componentRef.setInput('source', { data });
      await flush(fixture);
      const spec = lib.lastSpec() as { data?: Uint8Array };
      expect(spec.data).not.toBe(data);
      expect(spec.data).toEqual(data);
    });

    it('threads [httpHeaders] input into the spec', async () => {
      fixture.componentRef.setInput('httpHeaders', { 'X-Test': '1' });
      fixture.componentRef.setInput('source', 'https://example.com/a.pdf');
      await flush(fixture);
      const spec = lib.lastSpec() as { httpHeaders?: Record<string, string> };
      expect(spec.httpHeaders?.['X-Test']).toBe('1');
    });
  });

  // ==========================================================================
  // Reentrancy
  // ==========================================================================
  describe('reentrancy', () => {
    it('destroys an unresolved loading task when the source changes', async () => {
      fixture.componentRef.setInput('source', 'https://example.com/a.pdf');
      await flush(fixture);

      fixture.componentRef.setInput('source', 'https://example.com/b.pdf');
      await flush(fixture);

      expect(lib.taskAt(0).destroyCalls).toBe(1);
    });

    it('observes an asynchronous loading-task destroy rejection', async () => {
      fixture.componentRef.setInput('source', 'https://example.com/a.pdf');
      await flush(fixture);
      const task = lib.taskAt(0);
      task.destroy = () => {
        task.destroyCalls++;
        return Promise.reject(new Error('worker teardown failed'));
      };

      fixture.componentRef.setInput('source', 'https://example.com/b.pdf');
      await flush(fixture);

      expect(task.destroyCalls).toBe(1);
    });

    it('prevents stale metadata from replacing the newer document', async () => {
      const metadataA = deferred<{ info?: { Title?: string } }>();
      fixture.componentRef.setInput('source', 'https://example.com/a.pdf');
      await flush(fixture);
      const docA = makeFakeDoc(9, { metadata: metadataA.promise });
      lib.resolveAt(0, docA);
      await flush(fixture, 1);

      fixture.componentRef.setInput('source', 'https://example.com/b.pdf');
      await flush(fixture);
      lib.resolveAt(1, makeFakeDoc(2));
      await flush(fixture);
      expect(comp.numPages()).toBe(2);

      metadataA.resolve({ info: { Title: 'stale' } });
      await flush(fixture);

      expect(comp.numPages()).toBe(2);
      expect(docA._destroyTracker.calls).toBeGreaterThan(0);
    });

    it('invalidates an old search continuation after source replacement', async () => {
      const text = deferred<{ items: { str: string }[] }>();
      const docA = makeFakeDoc(1);
      const page = makeFakePage().page;
      page.getTextContent = () => text.promise;
      docA.getPage = () => Promise.resolve(page);
      fixture.componentRef.setInput('source', 'https://example.com/a.pdf');
      await flush(fixture);
      lib.resolveAt(0, docA);
      await flush(fixture);

      const searching = comp.search('stale');
      await Promise.resolve();
      fixture.componentRef.setInput('source', 'https://example.com/b.pdf');
      await flush(fixture);
      lib.resolveAt(1, makeFakeDoc(2));
      await flush(fixture);
      text.resolve({ items: [{ str: 'stale' }] });
      await searching;
      await flush(fixture);

      expect(comp.searchTotal()).toBe(0);
      expect(comp.activePage()).toBe(1);
    });

    it('cleans a stale thumbnail page without updating the new document cache', async () => {
      const pageDeferred = deferred<ReturnType<typeof makeFakePage>['page']>();
      const pageState = makeFakePage();
      const docA = makeFakeDoc(1);
      docA.getPage = () => pageDeferred.promise;
      fixture.componentRef.setInput('source', 'https://example.com/a.pdf');
      await flush(fixture);
      lib.resolveAt(0, docA);
      await flush(fixture);

      const rendering = comp.renderThumbnailForPage(1);
      fixture.componentRef.setInput('source', 'https://example.com/b.pdf');
      await flush(fixture);
      lib.resolveAt(1, makeFakeDoc(1));
      await flush(fixture);
      pageDeferred.resolve(pageState.page);
      await rendering;
      await flush(fixture);

      expect(pageState.records.cleaned).toBeGreaterThan(0);
      expect(comp.thumbCache()[1]).toBeUndefined();
    });

    it('destroys previous doc when source changes', async () => {
      fixture.componentRef.setInput('source', 'https://example.com/a.pdf');
      await flush(fixture);
      const destroyA = { calls: 0 };
      lib.resolveNext(makeFakeDoc(1, { destroyTracker: destroyA }));
      await flush(fixture);

      fixture.componentRef.setInput('source', 'https://example.com/b.pdf');
      await flush(fixture);
      lib.resolveNext(makeFakeDoc(2));
      await flush(fixture);

      expect(destroyA.calls).toBeGreaterThan(0);
    });

    it('keeps render token monotonic across source changes', async () => {
      // Two sequential loads — second one's token must invalidate the first.
      fixture.componentRef.setInput('source', 'https://example.com/a.pdf');
      await flush(fixture);
      lib.resolveNext(makeFakeDoc(3));
      await flush(fixture);
      expect(comp.numPages()).toBe(3);

      // New source — must replace state cleanly.
      fixture.componentRef.setInput('source', 'https://example.com/b.pdf');
      await flush(fixture);
      lib.resolveNext(makeFakeDoc(7));
      await flush(fixture);
      expect(comp.numPages()).toBe(7);
    });
  });

  // ==========================================================================
  // Cleanup
  // ==========================================================================
  describe('cleanup', () => {
    it('cancels loading and destroys a document that resolves after component destruction', async () => {
      const loaded: number[] = [];
      comp.loaded.subscribe(event => loaded.push(event.totalPages));
      fixture.componentRef.setInput('source', 'https://example.com/a.pdf');
      await flush(fixture);
      const stale = makeFakeDoc(4);

      fixture.destroy();
      lib.resolveAt(0, stale);
      await Promise.resolve();
      await Promise.resolve();

      expect(lib.taskAt(0).destroyCalls).toBe(1);
      expect(stale._destroyTracker.calls).toBe(1);
      expect(loaded).toEqual([]);
    });

    it('does not call pdfjs while the browser adapter reports SSR', async () => {
      browser.isBrowser = false;
      fixture.componentRef.setInput('source', 'https://example.com/server.pdf');
      await flush(fixture);

      expect(lib.callCount()).toBe(0);
      expect(comp.stage()).toBe('empty');
    });

    it('destroys the pdfDoc on component destroy', async () => {
      fixture.componentRef.setInput('source', 'https://example.com/a.pdf');
      await flush(fixture);
      const tracker = { calls: 0 };
      lib.resolveNext(makeFakeDoc(2, { destroyTracker: tracker }));
      await flush(fixture);
      fixture.destroy();
      // Microtask flush after destroy
      await Promise.resolve();
      expect(tracker.calls).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Download
  // ==========================================================================
  describe('download', () => {
    it('revokes an owned object URL when the source changes', async () => {
      fixture.componentRef.setInput('source', new Blob([new Uint8Array([1, 2, 3])], { type: 'application/pdf' }));
      await flush(fixture);
      lib.resolveNext(makeFakeDoc(1));
      await flush(fixture);

      comp.downloadFile();
      expect(browser.createdUrls).toEqual(['blob:fake-1']);
      expect(browser.downloads[0]?.href).toBe('blob:fake-1');

      fixture.componentRef.setInput('source', null);
      await flush(fixture);
      expect(browser.revokedUrls).toEqual(['blob:fake-1']);
    });

    it('emits download event for URL source', async () => {
      fixture.componentRef.setInput('source', 'https://example.com/test.pdf');
      await flush(fixture);
      lib.resolveNext(makeFakeDoc(1));
      await flush(fixture);

      const events: { filename: string }[] = [];
      comp.download.subscribe(e => events.push(e));
      // Stub anchor click to avoid navigation in test runner.
      spyOn(HTMLAnchorElement.prototype, 'click').and.stub();
      comp.downloadFile();
      expect(events.length).toBe(1);
      expect(events[0].filename).toContain('.pdf');
    });

    it('no-ops when downloadable=false', async () => {
      fixture.componentRef.setInput('downloadable', false);
      fixture.componentRef.setInput('source', 'https://example.com/test.pdf');
      await flush(fixture);
      lib.resolveNext(makeFakeDoc(1));
      await flush(fixture);

      const events: { filename: string }[] = [];
      comp.download.subscribe(e => events.push(e));
      spyOn(HTMLAnchorElement.prototype, 'click').and.stub();
      comp.downloadFile();
      expect(events.length).toBe(0);
    });

    it('downloads {data} sources through the awaitable helper', async () => {
      fixture.componentRef.setInput('source', { data: new Uint8Array([1, 2, 3]) });
      await flush(fixture);
      lib.resolveNext(makeFakeDoc(1));
      await flush(fixture);

      expect(await comp.downloadFileAsync()).toBeTrue();
      expect(browser.downloads[0]?.href).toBe('blob:fake-1');
    });

    it('uses loaded document bytes for authenticated URL descriptors and only lets the latest request win', async () => {
      const first = deferred<Uint8Array>();
      const second = deferred<Uint8Array>();
      let calls = 0;
      const doc = makeFakeDoc(1);
      doc.getData = () => (calls++ === 0 ? first.promise : second.promise);
      const source = { url: 'https://example.com/private.pdf', httpHeaders: { Authorization: 'Bearer secret' } };
      fixture.componentRef.setInput('source', source);
      await flush(fixture);
      lib.resolveNext(doc);
      await flush(fixture);

      const older = comp.downloadFileAsync();
      const latest = comp.downloadFileAsync();
      second.resolve(new Uint8Array([2]));
      expect(await latest).toBeTrue();
      first.resolve(new Uint8Array([1]));
      expect(await older).toBeFalse();
      expect(browser.downloads.length).toBe(1);
    });

    it('invalidates an authenticated download waiting on bytes when the source changes', async () => {
      const data = deferred<Uint8Array>();
      const doc = makeFakeDoc(1);
      doc.getData = () => data.promise;
      fixture.componentRef.setInput('source', { url: 'https://example.com/private.pdf', withCredentials: true });
      await flush(fixture);
      lib.resolveNext(doc);
      await flush(fixture);

      const pending = comp.downloadFileAsync();
      fixture.componentRef.setInput('source', null);
      await flush(fixture);
      data.resolve(new Uint8Array([1]));

      expect(await pending).toBeFalse();
      expect(browser.downloads).toEqual([]);
    });

    it('promptly revokes generated URLs and keeps active URL ownership bounded under repetition', async () => {
      fixture.componentRef.setInput('source', { data: new Uint8Array([1, 2, 3]) });
      await flush(fixture);
      lib.resolveNext(makeFakeDoc(1));
      await flush(fixture);

      for (let index = 0; index < 1000; index++) {
        expect(await comp.downloadFileAsync()).toBeTrue();
        await Promise.resolve();
        expect(browser.createdUrls.length - browser.revokedUrls.length).toBeLessThanOrEqual(1);
      }
      await Promise.resolve();
      expect(browser.revokedUrls.length).toBe(browser.createdUrls.length);
    });
  });

  // ==========================================================================
  // Fullscreen
  // ==========================================================================
  describe('fullscreen', () => {
    it('delegates fullscreen toggling to the browser adapter', () => {
      comp.toggleFullscreen();
      expect(browser.fullscreenToggles).toBe(1);
    });

    it('reflects the adapter fullscreen listener', () => {
      browser.fullscreenListener?.(true);
      expect(comp.isFullscreen()).toBe(true);
      browser.fullscreenListener?.(false);
      expect(comp.isFullscreen()).toBe(false);
    });

    it('observes a rejected fullscreen request without leaking an unhandled rejection', async () => {
      browser.fullscreenFailure = new Error('fullscreen denied');
      comp.toggleFullscreen();
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      expect(browser.fullscreenToggles).toBe(1);
    });
  });

  // ==========================================================================
  // requestClose
  // ==========================================================================
  describe('requestClose', () => {
    it('emits the close output', () => {
      let count = 0;
      comp.close.subscribe(() => count++);
      comp.requestClose();
      expect(count).toBe(1);
    });
  });

  // ==========================================================================
  // Public mode and print compatibility
  // ==========================================================================
  describe('public compatibility methods', () => {
    it('printFile stays inert until a document is ready', () => {
      comp.printFile();
      expect(print.jobs).toEqual([]);
    });

    it('setScrollMode("continuous") updates the public mode without warnings', () => {
      comp.setScrollMode('continuous');
      expect(comp.scrollModeCurrent()).toBe('continuous');
    });

    it('does not let the input-sync effect revert a programmatic mode change', async () => {
      fixture.detectChanges();
      await flush(fixture);
      comp.setScrollMode('continuous');
      await flush(fixture);

      expect(comp.scrollModeCurrent()).toBe('continuous');
    });
  });

  describe('browser capabilities', () => {
    it('publishes honest capability signals and hides unsupported actions', async () => {
      browser.canDownloadUrl = false;
      browser.canDownloadBlob = false;
      browser.canFullscreen = false;
      print.isSupported = false;
      fixture.componentRef.setInput('autoId', 'capabilities');
      fixture.componentRef.setInput('source', 'https://example.com/a.pdf');
      await flush(fixture);
      lib.resolveNext(makeFakeDoc(1));
      await flush(fixture);

      expect(comp.canDownload()).toBeFalse();
      expect(comp.canFullscreen()).toBeFalse();
      expect(comp.canPrint()).toBeFalse();
      expect(fixture.nativeElement.querySelector(`[data-autoId="${comp.autoIdDownload()}"]`)).toBeNull();
      expect(fixture.nativeElement.querySelector(`[data-autoId="${comp.autoIdFullscreen()}"]`)).toBeNull();
      expect(fixture.nativeElement.querySelector(`[data-autoId="${comp.autoIdPrint()}"]`)).toBeNull();

      comp.downloadFile();
      comp.toggleFullscreen();
      comp.printFile();
      await Promise.resolve();
      expect(browser.downloads).toEqual([]);
      expect(browser.fullscreenToggles).toBe(0);
      expect(print.jobs).toEqual([]);
    });

    it('distinguishes public URL downloads from sources that require Blob/object-URL support', async () => {
      browser.canDownloadUrl = true;
      browser.canDownloadBlob = false;
      fixture.componentRef.setInput('source', 'https://example.com/public.pdf');
      await flush(fixture);
      expect(comp.canDownload()).toBeTrue();

      fixture.componentRef.setInput('source', { data: new Uint8Array([1, 2, 3]) });
      await flush(fixture);
      expect(comp.canDownload()).toBeFalse();
      expect(await comp.downloadFileAsync()).toBeFalse();
    });

    it('hides authenticated error-state download when bytes and Blob support are unavailable', async () => {
      browser.canDownloadUrl = true;
      browser.canDownloadBlob = false;
      fixture.componentRef.setInput('source', {
        url: 'https://example.com/private.pdf',
        httpHeaders: { Authorization: 'Bearer secret' },
      });
      await flush(fixture);
      lib.rejectNext(new Error('network failed'));
      await flush(fixture);

      expect(comp.stage()).toBe('error');
      expect(comp.canDownload()).toBeFalse();
      expect(fixture.nativeElement.querySelector('.sd-preview-pdf-status__actions .sd-preview-pdf-btn-secondary')).toBeNull();
    });

    it('leaves native Ctrl/Cmd+P untouched when the ready viewer cannot print', async () => {
      print.isSupported = false;
      fixture.componentRef.setInput('source', 'https://example.com/no-print.pdf');
      await flush(fixture);
      lib.resolveNext(makeFakeDoc(1));
      await flush(fixture);

      const event = new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, cancelable: true });
      comp.onKeyDown(event);

      expect(event.defaultPrevented).toBeFalse();
      expect(print.jobs).toEqual([]);
    });
  });

  describe('search accessibility', () => {
    it('names the search input and exposes pressed state on search option toggles', async () => {
      fixture.componentRef.setInput('autoId', 'search-a11y');
      fixture.componentRef.setInput('source', 'https://example.com/search-a11y.pdf');
      await flush(fixture);
      lib.resolveNext(makeFakeDoc(1));
      await flush(fixture);
      comp.openSearch();
      await flush(fixture);

      const input = fixture.nativeElement.querySelector('.sd-preview-pdf-searchbar__input') as HTMLInputElement;
      const caseToggle = fixture.nativeElement.querySelector(`[data-autoId="${comp.autoIdSearchCase()}"]`) as HTMLButtonElement;
      const wholeToggle = fixture.nativeElement.querySelector(`[data-autoId="${comp.autoIdSearchWhole()}"]`) as HTMLButtonElement;
      expect(input.getAttribute('aria-label')).toBeTruthy();
      expect([caseToggle.getAttribute('aria-pressed'), wholeToggle.getAttribute('aria-pressed')]).toEqual(['false', 'false']);

      caseToggle.click();
      wholeToggle.click();
      await flush(fixture);
      expect([caseToggle.getAttribute('aria-pressed'), wholeToggle.getAttribute('aria-pressed')]).toEqual(['true', 'true']);
    });
  });

  // ==========================================================================
  // Header (no close button)
  // ==========================================================================
  describe('header (no close button)', () => {
    beforeEach(async () => {
      fixture.componentRef.setInput('source', 'https://example.com/a.pdf');
      await flush(fixture);
      lib.resolveNext(makeFakeDoc(2));
      await flush(fixture);
    });

    it('header does NOT contain a close button anymore', () => {
      const closeBtn = fixture.nativeElement.querySelector('.sd-preview-pdf-iconbtn--close');
      expect(closeBtn).toBeNull();
    });

    it('requestClose() still emits the close output (programmatic dismiss)', () => {
      let count = 0;
      comp.close.subscribe(() => count++);
      comp.requestClose();
      expect(count).toBe(1);
    });
  });

  // ==========================================================================
  // Search feature
  // ==========================================================================
  describe('search', () => {
    let searchEvents: { term: string; total: number; current: number }[];

    beforeEach(async () => {
      searchEvents = [];
      comp.searchChange.subscribe(e => searchEvents.push(e));
      fixture.componentRef.setInput('source', 'https://example.com/a.pdf');
      await flush(fixture);
      lib.resolveNext(
        makeFakeDoc(3, {
          pageTexts: {
            1: 'The quick brown Foo jumps over the lazy foo dog',
            2: 'A cat sat on the category mat with a dog',
            3: 'Hợp đồng thanh toán đặt cọc bằng đồng việt nam',
          },
        })
      );
      await flush(fixture);
      searchEvents.length = 0;
    });

    it('search("foo") finds 2 matches across pages and emits searchChange', async () => {
      const n = await comp.search('foo');
      expect(n).toBe(2);
      expect(comp.searchTotal()).toBe(2);
      expect(searchEvents.length).toBeGreaterThan(0);
      const last = searchEvents[searchEvents.length - 1];
      expect(last.term).toBe('foo');
      expect(last.total).toBe(2);
    });

    it('search("") clears results and emits total=0', async () => {
      await comp.search('foo');
      searchEvents.length = 0;
      await comp.search('');
      expect(comp.searchTotal()).toBe(0);
      expect(searchEvents[searchEvents.length - 1].total).toBe(0);
    });

    it('case-sensitive: search("Foo", { caseSensitive: true }) finds only the capitalized one', async () => {
      const n = await comp.search('Foo', { caseSensitive: true });
      expect(n).toBe(1);
    });

    it('whole-word: search("cat", { wholeWord: true }) does NOT match "category"', async () => {
      const n = await comp.search('cat', { wholeWord: true });
      expect(n).toBe(1);
    });

    it('normalizes the query to NFC and applies Unicode whole-word boundaries', async () => {
      fixture.componentRef.setInput('source', 'https://example.com/unicode.pdf');
      await flush(fixture);
      lib.resolveNext(
        makeFakeDoc(1, {
          pageTexts: { 1: '\u0111\u1eb7t \u0111\u1eb7t_c\u1ecdc kh\u00f4ng\u0111\u1eb7t' },
        })
      );
      await flush(fixture);

      const nfdQuery = '\u0111a\u0323\u0306t';
      expect(await comp.search(nfdQuery, { wholeWord: true })).toBe(1);
      expect(comp.searchResults()[0].term).toBe('\u0111\u1eb7t');
    });

    it('caps pathological result sets and exposes truncation honestly', async () => {
      fixture.componentRef.setInput('source', 'https://example.com/many-hits.pdf');
      await flush(fixture);
      lib.resolveNext(makeFakeDoc(1, { pageTexts: { 1: Array.from({ length: 1500 }, () => 'hit').join(' ') } }));
      await flush(fixture);

      expect(await comp.search('hit')).toBe(SdPreviewPdf.MAX_SEARCH_RESULTS);
      expect(comp.searchTotal()).toBe(SdPreviewPdf.MAX_SEARCH_RESULTS);
      expect(comp.searchTruncated()).toBeTrue();
      expect(comp.searchState().truncated).toBeTrue();
    });

    it('searchNext() advances activeIndex and wraps at end', async () => {
      await comp.search('foo');
      expect(comp.searchActiveIndex()).toBe(0);
      comp.searchNext();
      expect(comp.searchActiveIndex()).toBe(1);
      comp.searchNext();
      // wraps to 0
      expect(comp.searchActiveIndex()).toBe(0);
    });

    it('activates a clicked sidebar result, updates its style/counter, navigates, and emits', async () => {
      await comp.search('foo');
      comp.setSidebarMode('search');
      await flush(fixture);
      searchEvents.length = 0;

      const buttons = fixture.nativeElement.querySelectorAll('.sd-preview-pdf-search-result') as NodeListOf<HTMLButtonElement>;
      buttons[1].click();
      await flush(fixture);

      expect(comp.searchActiveIndex()).toBe(1);
      expect(comp.searchCurrent()).toBe(2);
      expect(buttons[1].classList.contains('sd-preview-pdf-search-result--active')).toBeTrue();
      expect(comp.activePage()).toBe(comp.searchResults()[1].page);
      expect(searchEvents[searchEvents.length - 1].current).toBe(2);
    });

    it('bounds the page-text LRU after a no-hit whole-document search', async () => {
      fixture.componentRef.setInput('source', 'https://example.com/search-cache.pdf');
      await flush(fixture);
      lib.resolveNext(makeFakeDoc(300));
      await flush(fixture);

      expect(await comp.search('definitely-not-present')).toBe(0);
      const cacheSize = (comp as unknown as { pageTextCacheSize(): number }).pageTextCacheSize();
      expect(cacheSize).toBeLessThanOrEqual(128);
    });

    it('does not cascade-evict the 128-page LRU during a repeated 129-page sequential scan', async () => {
      const doc = makeFakeDoc(129);
      fixture.componentRef.setInput('source', 'https://example.com/search-cache-boundary.pdf');
      await flush(fixture);
      lib.resolveNext(doc);
      await flush(fixture);
      const getPage = spyOn(doc, 'getPage').and.callThrough();

      expect(await comp.search('not-present')).toBe(0);
      expect(getPage.calls.count()).toBe(129);
      expect(comp.pageTextCacheSize()).toBe(SdPreviewPdf.MAX_PAGE_TEXT_CACHE_PAGES);

      expect(await comp.search('still-not-present')).toBe(0);
      expect(getPage.calls.count()).toBe(130);
      expect(comp.pageTextCacheSize()).toBe(SdPreviewPdf.MAX_PAGE_TEXT_CACHE_PAGES);
    });

    it('reuses recently cached page text on an immediate repeated search', async () => {
      const doc = makeFakeDoc(1, { pageTexts: { 1: 'reusable text' } });
      fixture.componentRef.setInput('source', 'https://example.com/search-cache-reuse.pdf');
      await flush(fixture);
      lib.resolveNext(doc);
      await flush(fixture);
      const getPage = spyOn(doc, 'getPage').and.callThrough();

      await comp.search('reusable');
      const callsAfterFirstSearch = getPage.calls.count();
      await comp.search('text');

      expect(getPage.calls.count()).toBe(callsAfterFirstSearch);
    });

    it('coalesces superseded searches while page-text extraction is pending', async () => {
      const doc = makeFakeDoc(1);
      fixture.componentRef.setInput('source', 'https://example.com/search-coalescing.pdf');
      await flush(fixture);
      lib.resolveNext(doc);
      await flush(fixture);

      const extractions: Deferred<{ items: { str: string }[] }>[] = [];
      doc.getPage = () => {
        const page = makeFakePage().page;
        const extraction = deferred<{ items: { str: string }[] }>();
        extractions.push(extraction);
        page.getTextContent = () => extraction.promise;
        return Promise.resolve(page);
      };

      const first = comp.search('first');
      const superseded = comp.search('superseded');
      const latest = comp.search('latest');
      for (let microtask = 0; microtask < 12; microtask++) await Promise.resolve();

      expect(extractions.length).toBe(1);
      extractions[0].resolve({ items: [{ str: 'latest' }] });
      for (let microtask = 0; microtask < 12; microtask++) await Promise.resolve();
      expect(extractions.length).toBe(2);

      for (const extraction of extractions.slice(1)) extraction.resolve({ items: [{ str: 'latest' }] });
      expect(await first).toBe(0);
      expect(await superseded).toBe(0);
      expect(await latest).toBe(1);
      expect(comp.searchTerm()).toBe('latest');
      expect(comp.searchTotal()).toBe(1);
    });

    it('searchPrev() retreats and wraps at start', async () => {
      await comp.search('foo');
      // active is 0 — prev wraps to last (idx 1)
      comp.searchPrev();
      expect(comp.searchActiveIndex()).toBe(1);
      comp.searchPrev();
      expect(comp.searchActiveIndex()).toBe(0);
    });

    it('Ctrl+F opens the search bar', () => {
      expect(comp.searchBarOpen()).toBe(false);
      const ev = new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true });
      comp.onKeyDown(ev);
      expect(comp.searchBarOpen()).toBe(true);
    });

    it('Esc when search is open closes search and does NOT emit close output', async () => {
      comp.openSearch();
      await comp.search('foo');
      let closes = 0;
      comp.close.subscribe(() => closes++);
      const ev = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      comp.onKeyDown(ev);
      expect(comp.searchBarOpen()).toBe(false);
      expect(closes).toBe(0);
      expect(comp.searchTotal()).toBe(0);
    });

    it('Vietnamese diacritic match: search("đặt") finds "đặt cọc"', async () => {
      const n = await comp.search('đặt');
      expect(n).toBe(1);
      expect(comp.searchResults()[0].page).toBe(3);
    });

    it('clearSearch() resets state and emits searchChange with total=0', async () => {
      await comp.search('foo');
      searchEvents.length = 0;
      comp.clearSearch();
      expect(comp.searchTotal()).toBe(0);
      expect(comp.searchActiveIndex()).toBe(-1);
      expect(comp.searchTerm()).toBe('');
      expect(searchEvents[searchEvents.length - 1].total).toBe(0);
    });
  });

  // ==========================================================================
  // Thumbnails
  // ==========================================================================
  describe('thumbnails', () => {
    beforeEach(async () => {
      fixture.componentRef.setInput('source', 'https://example.com/a.pdf');
      await flush(fixture);
      lib.resolveNext(makeFakeDoc(4));
      await flush(fixture);
    });

    it('pageNumbers() returns [1..numPages] after load', () => {
      expect(comp.pageNumbers()).toEqual([1, 2, 3, 4]);
    });

    it('clicking a thumbnail calls goToPage', async () => {
      // sidebar is open + thumbnails tab by default → buttons are present.
      const buttons = fixture.nativeElement.querySelectorAll('.sd-preview-pdf-thumb') as NodeListOf<HTMLButtonElement>;
      expect(buttons.length).toBe(4);
      buttons[2].click();
      expect(comp.activePage()).toBe(3);
    });

    it('exposes one canvas per page in the sidebar', async () => {
      const canvases = fixture.nativeElement.querySelectorAll('canvas.sd-preview-pdf-thumb__canvas');
      expect(canvases.length).toBe(4);
    });

    it('renderThumbnailForPage(n) invokes the page render with the right page', async () => {
      const doc = makeFakeDoc(2);
      // Replace the internal doc state by re-loading.
      fixture.componentRef.setInput('source', 'https://example.com/b.pdf');
      await flush(fixture);
      lib.resolveNext(doc);
      await flush(fixture);

      const spy = spyOn(doc, 'getPage').and.callThrough();
      await comp.renderThumbnailForPage(2);
      expect(spy).toHaveBeenCalledWith(2);
    });

    it('keeps the thumbnail DOM bounded for a 10k-page document and virtualizes on scroll', async () => {
      fixture.componentRef.setInput('source', 'https://example.com/huge.pdf');
      await flush(fixture);
      lib.resolveNext(makeFakeDoc(10_000));
      await flush(fixture);

      expect(comp.pageNumbers().length).toBeLessThanOrEqual(SdPreviewPdf.THUMBNAIL_WINDOW_SIZE);
      expect(fixture.nativeElement.querySelectorAll('.sd-preview-pdf-thumb').length).toBeLessThanOrEqual(
        SdPreviewPdf.THUMBNAIL_WINDOW_SIZE
      );

      const content = fixture.nativeElement.querySelector('.sd-preview-pdf-sidebar__content') as HTMLElement;
      Object.defineProperty(content, 'clientHeight', { configurable: true, value: 500 });
      Object.defineProperty(content, 'scrollTop', {
        configurable: true,
        writable: true,
        value: SdPreviewPdf.THUMBNAIL_ITEM_HEIGHT * 5000,
      });
      content.dispatchEvent(new Event('scroll', { bubbles: true }));
      await flush(fixture);
      expect(comp.pageNumbers()[0]).toBeGreaterThan(4900);
    });

    it('bounds the PNG cache with LRU eviction and re-renders an evicted thumbnail on revisit', async () => {
      fixture.componentRef.setInput('source', 'https://example.com/thumbnail-cache.pdf');
      await flush(fixture);
      const doc = makeFakeDoc(10_000);
      lib.resolveNext(doc);
      await flush(fixture);
      const getPage = spyOn(doc, 'getPage').and.callThrough();
      const content = fixture.nativeElement.querySelector('.sd-preview-pdf-sidebar__content') as HTMLElement;
      Object.defineProperty(content, 'scrollTop', { configurable: true, writable: true, value: 0 });

      const renderWindow = async (firstVisiblePage: number): Promise<void> => {
        content.scrollTop = (firstVisiblePage - 1) * SdPreviewPdf.THUMBNAIL_ITEM_HEIGHT;
        content.dispatchEvent(new Event('scroll', { bubbles: true }));
        await flush(fixture);
        const canvases = Array.from(
          fixture.nativeElement.querySelectorAll('canvas.sd-preview-pdf-thumb__canvas') as NodeListOf<HTMLCanvasElement>
        );
        browser.intersectionListener?.(canvases.map(target => ({ target, isIntersecting: true })));
        await flush(fixture);
      };

      await renderWindow(1);
      await renderWindow(200);
      await renderWindow(400);
      expect(Object.keys(comp.thumbCache()).length).toBeLessThanOrEqual(96);

      await renderWindow(1);
      expect(getPage.calls.allArgs().filter(([page]) => page === 1).length).toBe(2);
    });

    it('keeps unresolved thumbnail page acquisition bounded during rapid traversal', async () => {
      const requests: {
        readonly pageNumber: number;
        readonly pageDone: Deferred<ReturnType<typeof makeFakePage>['page']>;
        readonly pageState: ReturnType<typeof makeFakePage>;
      }[] = [];
      const doc = makeFakeDoc(10_000);
      let servedMainPage = false;
      doc.getPage = (pageNumber: number) => {
        if (!servedMainPage) {
          servedMainPage = true;
          return Promise.resolve(makeFakePage().page);
        }
        const pageDone = deferred<ReturnType<typeof makeFakePage>['page']>();
        const pageState = makeFakePage();
        requests.push({ pageNumber, pageDone, pageState });
        return pageDone.promise;
      };

      fixture.componentRef.setInput('source', 'https://example.com/thumbnail-work.pdf');
      await flush(fixture);
      lib.resolveNext(doc);
      await flush(fixture);
      const content = fixture.nativeElement.querySelector('.sd-preview-pdf-sidebar__content') as HTMLElement;
      Object.defineProperty(content, 'scrollTop', { configurable: true, writable: true, value: 0 });

      for (let windowIndex = 0; windowIndex < 10; windowIndex++) {
        content.scrollTop = windowIndex * 90 * SdPreviewPdf.THUMBNAIL_ITEM_HEIGHT;
        content.dispatchEvent(new Event('scroll', { bubbles: true }));
        fixture.detectChanges();
        for (let microtask = 0; microtask < 4; microtask++) await Promise.resolve();
        const canvases = Array.from(
          fixture.nativeElement.querySelectorAll('canvas.sd-preview-pdf-thumb__canvas') as NodeListOf<HTMLCanvasElement>
        );
        browser.intersectionListener?.(canvases.map(target => ({ target, isIntersecting: true })));
        for (let microtask = 0; microtask < 4; microtask++) await Promise.resolve();
      }

      expect(requests.length).toBeLessThanOrEqual(4);
      const workCount = (comp as unknown as { thumbnailWorkCount(): number }).thumbnailWorkCount();
      expect(workCount).toBeLessThanOrEqual(SdPreviewPdf.THUMBNAIL_WINDOW_SIZE);

      fixture.destroy();
      for (const request of requests) request.pageDone.resolve(request.pageState.page);
      for (let microtask = 0; microtask < 12; microtask++) await Promise.resolve();
      expect(requests.every(request => request.pageState.records.cleaned === 1)).toBeTrue();
    });

    it('cancels and cleans a deferred thumbnail render when its source is destroyed', async () => {
      const renderDone = deferred<void>();
      const records: FakePageRecord = { rendered: 0, cleaned: 0, cancelled: 0 };
      const deferredPage = makeFakePage(records).page;
      deferredPage.render = () => {
        records.rendered++;
        return {
          promise: renderDone.promise,
          cancel: () => {
            records.cancelled++;
          },
        };
      };
      const doc = makeFakeDoc(1);
      let servedMainPage = false;
      doc.getPage = () => {
        if (!servedMainPage) {
          servedMainPage = true;
          return Promise.resolve(makeFakePage().page);
        }
        return Promise.resolve(deferredPage);
      };
      fixture.componentRef.setInput('source', 'https://example.com/thumbnail-destroy.pdf');
      await flush(fixture);
      lib.resolveNext(doc);
      await flush(fixture);

      const rendering = comp.renderThumbnailForPage(1);
      for (let microtask = 0; microtask < 4; microtask++) await Promise.resolve();
      fixture.componentRef.setInput('source', 'https://example.com/replacement.pdf');
      await flush(fixture);
      lib.resolveNext(makeFakeDoc(1));
      await flush(fixture);
      renderDone.resolve();
      await rendering;

      expect(records.cancelled).toBe(1);
      expect(records.cleaned).toBe(1);
      expect(comp.thumbCache()[1]).toBeUndefined();
    });
  });

  describe('continuous rendering', () => {
    async function loadContinuous(pageCount: number, startPage = 1): Promise<ReturnType<typeof makeFakeDoc>> {
      fixture.componentRef.setInput('scrollMode', 'continuous');
      fixture.componentRef.setInput('initialZoom', 1);
      fixture.componentRef.setInput('startPage', startPage);
      fixture.componentRef.setInput('source', 'https://example.com/large.pdf');
      await flush(fixture);
      const stage = fixture.nativeElement.querySelector('.sd-preview-pdf-stage') as HTMLElement;
      Object.defineProperty(stage, 'clientHeight', { configurable: true, value: 600 });
      Object.defineProperty(stage, 'scrollTop', { configurable: true, writable: true, value: 0 });
      spyOn(stage, 'getBoundingClientRect').and.returnValue({
        width: 900,
        height: 600,
        top: 0,
        right: 900,
        bottom: 600,
        left: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });
      const doc = makeFakeDoc(pageCount);
      lib.resolveNext(doc);
      await flush(fixture);
      return doc;
    }

    it('renders only the initial viewport window and one-page buffer', async () => {
      const doc = await loadContinuous(100);
      const pageSpy = spyOn(doc, 'getPage').and.callThrough();
      browser.resizeListener?.();
      await flush(fixture);

      expect(comp.continuousPages()).toEqual([1, 2]);
      expect(comp.continuousTopSpacer()).toBe(0);
      expect(comp.continuousBottomSpacer()).toBeGreaterThan(0);
      expect(fixture.nativeElement.querySelector('canvas.sd-preview-pdf-page')).toBeNull();
      expect(fixture.nativeElement.querySelectorAll('canvas.sd-preview-pdf-continuous-page').length).toBe(2);
      expect(pageSpy.calls.count()).toBeLessThan(10);
    });

    it('includes every visible page plus a one-page buffer at middle and end boundaries', async () => {
      await loadContinuous(100);
      const stage = fixture.nativeElement.querySelector('.sd-preview-pdf-stage') as HTMLElement;

      stage.scrollTop = 49 * 816;
      comp.onStageScroll();
      await flush(fixture);
      expect(comp.continuousPages()[0]).toBeLessThanOrEqual(50);
      expect(comp.continuousPages()).toContain(50);
      expect(comp.continuousTopSpacer()).toBeGreaterThan(0);
      expect(comp.continuousBottomSpacer()).toBeGreaterThan(0);

      stage.scrollTop = 100 * 816;
      comp.onStageScroll();
      await flush(fixture);
      expect(comp.continuousPages()).toContain(100);
      expect(comp.continuousPages()[0]).toBeGreaterThanOrEqual(98);
      expect(comp.continuousBottomSpacer()).toBe(0);
    });

    it('derives the active page from the viewport midpoint and avoids duplicate emissions', async () => {
      await loadContinuous(100);
      const stage = fixture.nativeElement.querySelector('.sd-preview-pdf-stage') as HTMLElement;
      const events: number[] = [];
      comp.pageChange.subscribe(page => events.push(page));

      stage.scrollTop = 9 * 816;
      comp.onStageScroll();
      comp.onStageScroll();
      expect(comp.activePage()).toBe(10);
      expect(events).toEqual([10]);

      comp.goToPage(50);
      expect(comp.activePage()).toBe(50);
      expect(stage.scrollTop).toBeGreaterThan(0);
      expect(events).toEqual([10, 50]);
    });

    it('anchors middle and end startPage loads to the active continuous window', async () => {
      const target = 100;
      await loadContinuous(100, target);
      const stage = fixture.nativeElement.querySelector('.sd-preview-pdf-stage') as HTMLElement;

      expect(comp.activePage()).toBe(target);
      expect(stage.scrollTop).toBeGreaterThan(0);
      expect(comp.continuousPages()).toContain(target);
      expect(comp.continuousBottomSpacer()).toBe(0);
    });

    it('anchors page-to-continuous switches and repositions on same-page navigation', async () => {
      fixture.componentRef.setInput('scrollMode', 'page');
      fixture.componentRef.setInput('initialZoom', 1);
      fixture.componentRef.setInput('startPage', 50);
      fixture.componentRef.setInput('source', 'https://example.com/switch.pdf');
      await flush(fixture);
      const stage = fixture.nativeElement.querySelector('.sd-preview-pdf-stage') as HTMLElement;
      Object.defineProperty(stage, 'clientHeight', { configurable: true, value: 600 });
      Object.defineProperty(stage, 'scrollTop', { configurable: true, writable: true, value: 0 });
      lib.resolveNext(makeFakeDoc(100));
      await flush(fixture);

      comp.setScrollMode('continuous');
      await flush(fixture);
      expect(comp.scrollModeCurrent()).toBe('continuous');
      expect(comp.continuousPages()).toContain(50);
      expect(stage.scrollTop).toBeGreaterThan(0);

      stage.scrollTop = 0;
      comp.goToPage(50);
      expect(stage.scrollTop).toBeGreaterThan(0);
      expect(comp.continuousPages()).toContain(50);
    });

    it('schedules replacement renders after invalidation without duplicating pending page work', async () => {
      const doc = await loadContinuous(20);
      const pageSpy = spyOn(doc, 'getPage').and.callThrough();

      comp.setZoom(1.25);
      await flush(fixture);

      expect(pageSpy).toHaveBeenCalled();
      const requested = pageSpy.calls.allArgs().map(([page]) => page);
      expect(new Set(requested).size).toBe(requested.length);
    });

    it('cleans a page that resolves after continuous cancellation and never renders it', async () => {
      fixture.componentRef.setInput('scrollMode', 'continuous');
      fixture.componentRef.setInput('initialZoom', 1);
      fixture.componentRef.setInput('source', 'https://example.com/race.pdf');
      await flush(fixture);
      const stage = fixture.nativeElement.querySelector('.sd-preview-pdf-stage') as HTMLElement;
      Object.defineProperty(stage, 'clientHeight', { configurable: true, value: 600 });
      Object.defineProperty(stage, 'scrollTop', { configurable: true, writable: true, value: 0 });
      const pendingPage = deferred<ReturnType<typeof makeFakePage>['page']>();
      const stalePage = makeFakePage();
      const doc = makeFakeDoc(2);
      doc.getPage = () => pendingPage.promise;
      lib.resolveNext(doc);
      for (let index = 0; index < 12; index++) await Promise.resolve();
      fixture.detectChanges();
      for (let index = 0; index < 12; index++) await Promise.resolve();

      fixture.destroy();
      pendingPage.resolve(stalePage.page);
      for (let index = 0; index < 20; index++) await Promise.resolve();

      expect(stalePage.records.cleaned).toBeGreaterThan(0);
      expect(stalePage.records.rendered).toBe(0);
    });
  });

  describe('managed print', () => {
    async function loadPrintableDocument(): Promise<void> {
      fixture.componentRef.setInput('autoId', 'print-test');
      fixture.componentRef.setInput('source', 'https://example.com/printable.pdf');
      await flush(fixture);
      lib.resolveNext(makeFakeDoc(2, { data: new Uint8Array([1, 2, 3, 4]) }));
      await flush(fixture);
    }

    it('shows a header print action and delegates cloned bytes to the print adapter', async () => {
      await loadPrintableDocument();
      const button = fixture.nativeElement.querySelector(`[data-autoId="${comp.autoIdPrint()}"]`) as HTMLButtonElement | null;
      expect(button).not.toBeNull();

      const pending = comp.print();
      await Promise.resolve();
      await Promise.resolve();
      expect(print.jobs.length).toBe(1);
      expect(Array.from(print.jobs[0].data)).toEqual([1, 2, 3, 4]);
      print.jobs[0].finish();
      await pending;
    });

    it('cancels the previous job before repeated print and on source replacement', async () => {
      await loadPrintableDocument();
      void comp.print();
      await Promise.resolve();
      await Promise.resolve();
      void comp.print();
      await Promise.resolve();
      await Promise.resolve();
      expect(print.jobs.length).toBe(2);
      expect(print.jobs[0].cancelCounter.calls).toBe(1);

      fixture.componentRef.setInput('source', 'https://example.com/replacement.pdf');
      await flush(fixture);
      expect(print.jobs[1].cancelCounter.calls).toBe(1);
    });

    it('assigns print request generation before getData so a late older request cannot start', async () => {
      fixture.componentRef.setInput('source', 'https://example.com/print-race.pdf');
      await flush(fixture);
      const first = deferred<Uint8Array>();
      const second = deferred<Uint8Array>();
      let calls = 0;
      const doc = makeFakeDoc(1);
      doc.getData = () => (calls++ === 0 ? first.promise : second.promise);
      lib.resolveNext(doc);
      await flush(fixture);

      const older = comp.print();
      const latest = comp.print();
      second.resolve(new Uint8Array([2]));
      for (let index = 0; index < 8; index++) await Promise.resolve();
      expect(print.jobs.length).toBe(1);
      expect(Array.from(print.jobs[0].data)).toEqual([2]);
      first.resolve(new Uint8Array([1]));
      await older;
      expect(print.jobs.length).toBe(1);
      print.jobs[0].finish();
      await latest;
    });

    it('invalidates a print request waiting on bytes when the source changes', async () => {
      fixture.componentRef.setInput('source', 'https://example.com/print-stale.pdf');
      await flush(fixture);
      const data = deferred<Uint8Array>();
      const doc = makeFakeDoc(1);
      doc.getData = () => data.promise;
      lib.resolveNext(doc);
      await flush(fixture);

      const pending = comp.print();
      fixture.componentRef.setInput('source', null);
      await flush(fixture);
      data.resolve(new Uint8Array([1]));
      await pending;

      expect(print.jobs).toEqual([]);
    });

    it('cancels an active job when the component is destroyed', async () => {
      await loadPrintableDocument();
      void comp.print();
      await Promise.resolve();
      await Promise.resolve();
      fixture.destroy();
      expect(print.jobs[0].cancelCounter.calls).toBe(1);
    });

    it('handles Ctrl/Cmd+P only while a document is ready', async () => {
      const beforeReady = new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, cancelable: true });
      comp.onKeyDown(beforeReady);
      expect(beforeReady.defaultPrevented).toBeFalse();
      expect(print.jobs.length).toBe(0);

      await loadPrintableDocument();
      const ready = new KeyboardEvent('keydown', { key: 'p', metaKey: true, cancelable: true });
      comp.onKeyDown(ready);
      await Promise.resolve();
      await Promise.resolve();
      expect(ready.defaultPrevented).toBeTrue();
      expect(print.jobs.length).toBe(1);
      print.jobs[0].finish();
    });
  });

  // ==========================================================================
  // Theme — [data-theme] host attribute (drives SCSS token swap)
  // ==========================================================================
  describe('theme input', () => {
    it('defaults to dark', () => {
      fixture.detectChanges();
      expect(comp.theme()).toBe('dark');
      const host = fixture.nativeElement as HTMLElement;
      expect(host.getAttribute('data-theme')).toBe('dark');
    });

    it('flips data-theme attribute to light when set to "light"', () => {
      fixture.detectChanges();
      fixture.componentRef.setInput('theme', 'light');
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      expect(host.getAttribute('data-theme')).toBe('light');
    });

    it('restores data-theme="dark" when reverted', () => {
      fixture.detectChanges();
      fixture.componentRef.setInput('theme', 'light');
      fixture.detectChanges();
      fixture.componentRef.setInput('theme', 'dark');
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      expect(host.getAttribute('data-theme')).toBe('dark');
    });
  });

  // ==========================================================================
  // autoId — prefix + derived child autoIds
  // ==========================================================================
  describe('autoId', () => {
    it('returns undefined when input is not provided', () => {
      fixture.detectChanges();
      expect(comp.autoId()).toBeUndefined();
      expect(comp.autoIdNext()).toBeUndefined();
      expect(comp.autoIdThumb(0)).toBeUndefined();
    });

    it('prefixes autoId with "components-preview-pdf-"', () => {
      fixture.componentRef.setInput('autoId', 'viewer');
      fixture.detectChanges();
      expect(comp.autoId()).toBe('components-preview-pdf-viewer');
    });

    it('derives top-level button autoIds', () => {
      fixture.componentRef.setInput('autoId', 'viewer');
      fixture.detectChanges();
      expect(comp.autoIdFirst()).toBe('components-preview-pdf-viewer-first');
      expect(comp.autoIdPrev()).toBe('components-preview-pdf-viewer-prev');
      expect(comp.autoIdNext()).toBe('components-preview-pdf-viewer-next');
      expect(comp.autoIdLast()).toBe('components-preview-pdf-viewer-last');
      expect(comp.autoIdZoomIn()).toBe('components-preview-pdf-viewer-zoom-in');
      expect(comp.autoIdZoomOut()).toBe('components-preview-pdf-viewer-zoom-out');
      expect(comp.autoIdFitPage()).toBe('components-preview-pdf-viewer-fit-page');
      expect(comp.autoIdFitWidth()).toBe('components-preview-pdf-viewer-fit-width');
      expect(comp.autoIdRotate()).toBe('components-preview-pdf-viewer-rotate');
      expect(comp.autoIdDownload()).toBe('components-preview-pdf-viewer-download');
      expect(comp.autoIdFullscreen()).toBe('components-preview-pdf-viewer-fullscreen');
      expect(comp.autoIdSearchInput()).toBe('components-preview-pdf-viewer-search-input');
    });

    it('derives indexed thumb/result autoIds', () => {
      fixture.componentRef.setInput('autoId', 'viewer');
      fixture.detectChanges();
      expect(comp.autoIdThumb(0)).toBe('components-preview-pdf-viewer-thumb-0');
      expect(comp.autoIdResult(2)).toBe('components-preview-pdf-viewer-result-2');
    });
  });
});
