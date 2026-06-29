import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SD_PDFJS_LIB, SdPdfJsLib, SdPreviewPdf } from './preview-pdf.component';

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

function makeFakeDoc(numPages: number, opts?: { destroyTracker?: { calls: number }; pageTexts?: Record<number, string> }) {
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
      Promise.resolve({
        info: { Title: 'Hello PDF', Author: 'Tester', Subject: 'Subj' },
      }),
    destroy: () => {
      destroyTracker.calls++;
      return Promise.resolve();
    },
    _pageRecords: pageRecords,
    _destroyTracker: destroyTracker,
  };
}

interface FakeTask {
  promise: Promise<unknown>;
  onProgress?: (p: { loaded: number; total: number }) => void;
}

function makeFakePdfLib(): SdPdfJsLib & {
  // exposed test helpers:
  resolveNext: (doc: unknown) => void;
  rejectNext: (err: unknown) => void;
  emitProgress: (loaded: number, total: number) => void;
  lastSpec: () => unknown;
  callCount: () => number;
} {
  let pendingResolve: ((v: unknown) => void) | null = null;
  let pendingReject: ((e: unknown) => void) | null = null;
  let pendingTask: FakeTask | null = null;
  let lastSpec: unknown = null;
  let calls = 0;
  const lib: SdPdfJsLib = {
    GlobalWorkerOptions: { workerSrc: '' },
    getDocument: (spec: unknown) => {
      calls++;
      lastSpec = spec;
      const task: FakeTask = {
        promise: new Promise((resolve, reject) => {
          pendingResolve = resolve;
          pendingReject = reject;
        }),
      };
      pendingTask = task;
      return task;
    },
  };
  return Object.assign(lib, {
    resolveNext: (doc: unknown) => {
      pendingResolve?.(doc);
      pendingResolve = null;
      pendingReject = null;
    },
    rejectNext: (err: unknown) => {
      pendingReject?.(err);
      pendingResolve = null;
      pendingReject = null;
    },
    emitProgress: (loaded: number, total: number) => {
      pendingTask?.onProgress?.({ loaded, total });
    },
    lastSpec: () => lastSpec,
    callCount: () => calls,
  });
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

  beforeEach(async () => {
    lib = makeFakePdfLib();
    await TestBed.configureTestingModule({
      imports: [SdPreviewPdf, NoopAnimationsModule],
      providers: [{ provide: SD_PDFJS_LIB, useValue: lib }],
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

    it('shows deferred placeholder for outline tab', async () => {
      comp.setSidebarMode('outline');
      await flush(fixture);
      const el = fixture.nativeElement.querySelector('.sd-preview-pdf-sidebar__deferred');
      expect(el).not.toBeNull();
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
      expect(spec.data).toBe(u8);
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
      expect(spec.data).toBe(data);
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
  });

  // ==========================================================================
  // Fullscreen
  // ==========================================================================
  describe('fullscreen', () => {
    it('requests fullscreen on host element', () => {
      const host = fixture.nativeElement as HTMLElement;
      const spy = spyOn(host, 'requestFullscreen').and.returnValue(Promise.resolve());
      // Pretend not in fullscreen
      Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true });
      comp.toggleFullscreen();
      expect(spy).toHaveBeenCalled();
    });

    it('reflects fullscreenchange event', () => {
      const host = fixture.nativeElement as HTMLElement;
      // Simulate browser saying we entered fullscreen on our host.
      Object.defineProperty(document, 'fullscreenElement', { value: host, configurable: true });
      document.dispatchEvent(new Event('fullscreenchange'));
      expect(comp.isFullscreen()).toBe(true);
      // Exit.
      Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true });
      document.dispatchEvent(new Event('fullscreenchange'));
      expect(comp.isFullscreen()).toBe(false);
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
  // Deferred features (no-op + warn)
  // ==========================================================================
  describe('deferred features', () => {
    it('printFile warns and returns undefined', () => {
      const spy = spyOn(console, 'warn');
      comp.printFile();
      expect(spy).toHaveBeenCalled();
    });

    it('setScrollMode("continuous") warns', () => {
      const spy = spyOn(console, 'warn');
      comp.setScrollMode('continuous');
      expect(spy).toHaveBeenCalled();
      expect(comp.scrollModeCurrent()).toBe('continuous');
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

    it('searchNext() advances activeIndex and wraps at end', async () => {
      await comp.search('foo');
      expect(comp.searchActiveIndex()).toBe(0);
      comp.searchNext();
      expect(comp.searchActiveIndex()).toBe(1);
      comp.searchNext();
      // wraps to 0
      expect(comp.searchActiveIndex()).toBe(0);
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
