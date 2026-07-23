import { TestBed } from '@angular/core/testing';
import { SD_VIEWPORT, SdViewportService } from '../../../../services/viewport';
import { SD_LAYOUT_VIEWPORT, SdLayoutResponsiveService, SdLayoutViewport } from './responsive.service';

class FakeViewport implements SdLayoutViewport {
  innerWidth = 1280;
  readonly listeners = new Set<EventListenerOrEventListenerObject>();

  addEventListener(_type: 'resize', listener: EventListenerOrEventListenerObject): void {
    this.listeners.add(listener);
  }

  removeEventListener(_type: 'resize', listener: EventListenerOrEventListenerObject): void {
    this.listeners.delete(listener);
  }

  resizeTo(width: number): void {
    this.innerWidth = width;
    for (const listener of this.listeners) {
      if (typeof listener === 'function') listener(new Event('resize'));
      else listener.handleEvent(new Event('resize'));
    }
  }
}

describe('SdLayoutResponsiveService', () => {
  let viewport: FakeViewport;
  let service: SdLayoutResponsiveService;

  beforeEach(() => {
    viewport = new FakeViewport();
    TestBed.configureTestingModule({ providers: [{ provide: SD_LAYOUT_VIEWPORT, useValue: viewport }] });
    service = TestBed.inject(SdLayoutResponsiveService);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('derives its initial state from viewport width', () => {
    expect(service.viewportWidth()).toBe(1280);
    expect(service.isMobile(1024)).toBeFalse();
  });

  it('keeps the legacy token and service as aliases over the shared viewport foundation', () => {
    const viewportService = TestBed.inject(SdViewportService);

    expect(SD_LAYOUT_VIEWPORT).toBe(SD_VIEWPORT);
    expect(service.viewportWidth).toBe(viewportService.width);
    expect(viewport.listeners.size).toBe(1);
  });

  it('updates the responsive signal when the viewport crosses a breakpoint', () => {
    viewport.resizeTo(768);

    expect(service.viewportWidth()).toBe(768);
    expect(service.isMobile(1024)).toBeTrue();
    expect(TestBed.inject(SdViewportService).currentBreakpoint()).toBe('tablet');
  });

  it('removes its resize listener when the injection context is destroyed', () => {
    const removeListener = spyOn(viewport, 'removeEventListener').and.callThrough();

    TestBed.resetTestingModule();

    expect(removeListener).toHaveBeenCalledWith('resize', jasmine.any(Function));
    expect(viewport.listeners.size).toBe(0);
  });
});
