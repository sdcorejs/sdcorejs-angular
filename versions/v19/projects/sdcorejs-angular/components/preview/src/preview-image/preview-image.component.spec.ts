import { Component, DebugElement, ViewChild } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { DOCUMENT, IMAGE_LOADER } from '@angular/common';
import { SdPreviewImage } from './preview-image.component';

// ---------------------------------------------------------------------------
// NOTE on source-code drift
// ---------------------------------------------------------------------------
// Remote added a comprehensive spec written against the OLD imperative API:
//   - `await component.open([file])`
//   - `component.images[0]` (plain array)
//   - `component.onClose()`
// Local refactor migrated SdPreviewImage to a declarative signal-input API:
//   - `[items]` signal input drives normalization + auto-load
//   - `images` is a readonly Signal<NormalizedImage[]>
//   - `close` is an OutputEmitterRef, no `onClose()` helper
// This spec is rewritten to match the CURRENT source. The original navigation
// tests (updateCurrentImage / onClickThumbnailImage) still apply because those
// public methods survived the refactor.
// ---------------------------------------------------------------------------

function makeImageFile(name = 'photo.png', type = 'image/png'): File {
  const blob = new Blob(['fake-image-bytes'], { type });
  return new File([blob], name, { type });
}

function makeNonImageFile(name = 'doc.pdf', type = 'application/pdf'): File {
  const blob = new Blob(['%PDF-1.4'], { type });
  return new File([blob], name, { type });
}

// ---------------------------------------------------------------------------
// Host component — drives [items] signal input
// ---------------------------------------------------------------------------

@Component({
  standalone: true,
  imports: [SdPreviewImage],
  template: ` <sd-preview-image #previewRef [items]="items" (close)="onClose()"></sd-preview-image> `,
})
class HostComponent {
  @ViewChild('previewRef') previewRef!: SdPreviewImage;
  items: (string | File)[] = [];
  closedCount = 0;
  onClose(): void {
    this.closedCount++;
  }
}

function getComponent(fixture: ComponentFixture<HostComponent>): SdPreviewImage {
  const de: DebugElement = fixture.debugElement.query(By.directive(SdPreviewImage));
  if (!de) throw new Error('SdPreviewImage not found in fixture');
  return de.componentInstance as SdPreviewImage;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('SdPreviewImage', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let component: SdPreviewImage;

  let createObjectURLSpy: jasmine.Spy;
  let revokeObjectURLSpy: jasmine.Spy;

  beforeEach(async () => {
    createObjectURLSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:mock-url');
    revokeObjectURLSpy = spyOn(URL, 'revokeObjectURL').and.stub();

    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
      providers: [{ provide: IMAGE_LOADER, useValue: (config: { src: string }) => config.src }],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    component = getComponent(fixture);
  });

  // -------------------------------------------------------------------------
  // Creation & rendering
  // -------------------------------------------------------------------------

  describe('creation & rendering', () => {
    it('creates the component', () => {
      expect(component).toBeTruthy();
    });

    it('renders sd-preview-image element in the host template', () => {
      const el = fixture.nativeElement.querySelector('sd-preview-image');
      expect(el).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  describe('initial state', () => {
    it('starts with an empty images signal', () => {
      expect(component.images().length).toBe(0);
    });

    it('starts with activeIndex signal = 0', () => {
      expect(component.activeIndex()).toBe(0);
    });

    it('defaults title input to undefined', () => {
      expect(component.title()).toBeUndefined();
    });

    it('defaults thumbnailPosition input to "bottom"', () => {
      expect(component.thumbnailPosition()).toBe('bottom');
    });
  });

  // -------------------------------------------------------------------------
  // [items] signal input — load / filter / reset behaviors
  // -------------------------------------------------------------------------

  describe('[items] input', () => {
    it('keeps images empty when items is an empty array', fakeAsync(() => {
      host.items = [];
      fixture.detectChanges();
      tick();
      expect(component.images().length).toBe(0);
    }));

    it('loads a single image File', fakeAsync(() => {
      host.items = [makeImageFile('cat.jpg', 'image/jpeg')];
      fixture.detectChanges();
      tick();
      expect(component.images().length).toBe(1);
    }));

    it('exposes the file name on the loaded image', fakeAsync(() => {
      host.items = [makeImageFile('kitty.png', 'image/png')];
      fixture.detectChanges();
      tick();
      expect(component.images()[0].name).toBe('kitty.png');
    }));

    it('calls URL.createObjectURL for a File input', fakeAsync(() => {
      const file = makeImageFile();
      host.items = [file];
      fixture.detectChanges();
      tick();
      expect(createObjectURLSpy).toHaveBeenCalledWith(file);
    }));

    it('filters out non-image Files (e.g. application/pdf)', fakeAsync(() => {
      const imageFile = makeImageFile('img.png', 'image/png');
      const pdfFile = makeNonImageFile('doc.pdf', 'application/pdf');
      host.items = [imageFile, pdfFile];
      fixture.detectChanges();
      tick();
      expect(component.images().length).toBe(1);
      expect(component.images()[0].name).toBe('img.png');
    }));
  });

  // -------------------------------------------------------------------------
  // onClickThumbnailImage() — public navigation method
  // -------------------------------------------------------------------------

  describe('onClickThumbnailImage()', () => {
    beforeEach(fakeAsync(() => {
      host.items = [makeImageFile('a.png'), makeImageFile('b.png'), makeImageFile('c.png')];
      fixture.detectChanges();
      tick();
    }));

    it('sets activeIndex to the given index', () => {
      component.onClickThumbnailImage(2);
      fixture.detectChanges();
      expect(component.activeIndex()).toBe(2);
    });

    it('sets activeIndex to 0 when clicking first thumbnail', () => {
      component.onClickThumbnailImage(1);
      component.onClickThumbnailImage(0);
      fixture.detectChanges();
      expect(component.activeIndex()).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // updateCurrentImage() — wraps around when loop=true (default)
  // -------------------------------------------------------------------------

  describe('updateCurrentImage()', () => {
    beforeEach(fakeAsync(() => {
      host.items = [makeImageFile('a.png'), makeImageFile('b.png'), makeImageFile('c.png')];
      fixture.detectChanges();
      tick();
    }));

    it('moves forward by 1 when direction is +1', () => {
      component.updateCurrentImage(1);
      fixture.detectChanges();
      expect(component.activeIndex()).toBe(1);
    });

    it('moves backward by 1 when direction is -1', () => {
      component.onClickThumbnailImage(2);
      component.updateCurrentImage(-1);
      fixture.detectChanges();
      expect(component.activeIndex()).toBe(1);
    });

    it('wraps around forward: last + 1 → 0 (loop default)', () => {
      component.onClickThumbnailImage(2); // last index
      component.updateCurrentImage(1);
      fixture.detectChanges();
      expect(component.activeIndex()).toBe(0);
    });

    it('wraps around backward: 0 - 1 → last index (loop default)', () => {
      component.updateCurrentImage(-1);
      fixture.detectChanges();
      expect(component.activeIndex()).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // Output: close — emitted only via requestClose() programmatic API
  // -------------------------------------------------------------------------

  describe('output: close', () => {
    it('emits close event when requestClose() is called', () => {
      let emitted = false;
      component.close.subscribe(() => (emitted = true));
      component.requestClose();
      expect(emitted).toBeTrue();
    });

    it('host receives close event via (close) binding when requestClose() runs', () => {
      component.requestClose();
      expect(host.closedCount).toBe(1);
    });
  });
});

// ---------------------------------------------------------------------------
// theme input — signal input + [data-theme] host binding
// ---------------------------------------------------------------------------

describe('SdPreviewImage — theme input', () => {
  let fixture: ComponentFixture<SdPreviewImage>;
  let comp: SdPreviewImage;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdPreviewImage, NoopAnimationsModule],
      providers: [{ provide: IMAGE_LOADER, useValue: (config: { src: string }) => config.src }],
    }).compileComponents();
    fixture = TestBed.createComponent(SdPreviewImage);
    comp = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('defaults theme to "dark"', () => {
    fixture.detectChanges();
    expect(comp.theme()).toBe('dark');
  });

  it('sets [data-theme="dark"] on the host element by default', () => {
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('data-theme')).toBe('dark');
  });

  it('updates [data-theme] to "light" when theme input flips', () => {
    fixture.detectChanges();
    fixture.componentRef.setInput('theme', 'light');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('data-theme')).toBe('light');
  });

  it('restores [data-theme="dark"] when reverted', () => {
    fixture.detectChanges();
    fixture.componentRef.setInput('theme', 'light');
    fixture.detectChanges();
    fixture.componentRef.setInput('theme', 'dark');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('data-theme')).toBe('dark');
  });
});

// ---------------------------------------------------------------------------
// autoId — namespaced prefix + derived child IDs
// ---------------------------------------------------------------------------

describe('SdPreviewImage — autoId', () => {
  let fixture: ComponentFixture<SdPreviewImage>;
  let comp: SdPreviewImage;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdPreviewImage, NoopAnimationsModule],
      providers: [{ provide: IMAGE_LOADER, useValue: (config: { src: string }) => config.src }],
    }).compileComponents();
    fixture = TestBed.createComponent(SdPreviewImage);
    comp = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('returns undefined when autoId input is not provided', () => {
    fixture.detectChanges();
    expect(comp.autoId()).toBeUndefined();
    expect(comp.autoIdPrev()).toBeUndefined();
    expect(comp.autoIdThumb(0)).toBeUndefined();
  });

  it('prefixes autoId with "components-preview-image-"', () => {
    fixture.componentRef.setInput('autoId', 'gallery');
    fixture.detectChanges();
    expect(comp.autoId()).toBe('components-preview-image-gallery');
  });

  it('derives 9 named child autoIds', () => {
    fixture.componentRef.setInput('autoId', 'gallery');
    fixture.detectChanges();
    expect(comp.autoIdPrev()).toBe('components-preview-image-gallery-prev');
    expect(comp.autoIdNext()).toBe('components-preview-image-gallery-next');
    expect(comp.autoIdZoomIn()).toBe('components-preview-image-gallery-zoom-in');
    expect(comp.autoIdZoomOut()).toBe('components-preview-image-gallery-zoom-out');
    expect(comp.autoIdFit()).toBe('components-preview-image-gallery-fit');
    expect(comp.autoIdRotate()).toBe('components-preview-image-gallery-rotate');
    expect(comp.autoIdDownload()).toBe('components-preview-image-gallery-download');
    expect(comp.autoIdFullscreen()).toBe('components-preview-image-gallery-fullscreen');
    expect(comp.autoIdRetry()).toBe('components-preview-image-gallery-retry');
  });

  it('derives indexed thumb/dot autoIds', () => {
    fixture.componentRef.setInput('autoId', 'gallery');
    fixture.detectChanges();
    expect(comp.autoIdThumb(0)).toBe('components-preview-image-gallery-thumb-0');
    expect(comp.autoIdThumb(3)).toBe('components-preview-image-gallery-thumb-3');
    expect(comp.autoIdDot(1)).toBe('components-preview-image-gallery-dot-1');
  });
});

// ---------------------------------------------------------------------------
// describe: SSR-safe document access
// ---------------------------------------------------------------------------
// why: constructor đọc biến global `document` nên component ném `document is not defined`
// khi render trên server. Spec dùng một Proxy quanh document thật, cấp qua token DOCUMENT:
// nếu component đi qua token thì listener 'fullscreenchange' phải xuất hiện trong bản ghi.

interface RecordedDocumentListener {
  type: string;
  listener: EventListenerOrEventListenerObject;
}

function createRecordingDocument(): {
  documentProxy: Document;
  added: RecordedDocumentListener[];
  removed: RecordedDocumentListener[];
} {
  const added: RecordedDocumentListener[] = [];
  const removed: RecordedDocumentListener[] = [];
  const documentProxy = new Proxy(document, {
    get(target: Document, property: string | symbol) {
      if (property === 'addEventListener') {
        return (type: string, listener: EventListenerOrEventListenerObject, options?: unknown) => {
          added.push({ type, listener });
          return target.addEventListener(type, listener, options as AddEventListenerOptions);
        };
      }
      if (property === 'removeEventListener') {
        return (type: string, listener: EventListenerOrEventListenerObject, options?: unknown) => {
          removed.push({ type, listener });
          return target.removeEventListener(type, listener, options as EventListenerOptions);
        };
      }
      const value = Reflect.get(target, property) as unknown;
      return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(target) : value;
    },
  }) as Document;
  return { documentProxy, added, removed };
}

describe('SdPreviewImage document injection', () => {
  let fixture: ComponentFixture<HostComponent>;
  let added: RecordedDocumentListener[];
  let removed: RecordedDocumentListener[];

  beforeEach(async () => {
    spyOn(URL, 'createObjectURL').and.returnValue('blob:mock-url');
    spyOn(URL, 'revokeObjectURL').and.stub();

    const recording = createRecordingDocument();
    added = recording.added;
    removed = recording.removed;

    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
      providers: [
        { provide: DOCUMENT, useValue: recording.documentProxy },
        { provide: IMAGE_LOADER, useValue: (config: { src: string }) => config.src },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  function fullscreenListeners(entries: RecordedDocumentListener[]): RecordedDocumentListener[] {
    return entries.filter(entry => entry.type === 'fullscreenchange');
  }

  it('binds fullscreenchange through the injected DOCUMENT, not the global one', () => {
    expect(fullscreenListeners(added).length).toBe(1);
  });

  it('removes the fullscreenchange listener from the injected DOCUMENT on destroy', () => {
    const bound = fullscreenListeners(added)[0];
    expect(bound).toBeDefined();

    fixture.destroy();

    expect(fullscreenListeners(removed).some(entry => entry.listener === bound.listener)).toBeTrue();
  });
});
