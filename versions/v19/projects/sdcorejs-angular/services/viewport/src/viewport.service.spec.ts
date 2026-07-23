import { TestBed } from '@angular/core/testing';
import { SdViewport, SdViewportBreakpoints } from './viewport.model';
import { SD_VIEWPORT, SD_VIEWPORT_BREAKPOINTS, SD_VIEWPORT_DEFAULT_BREAKPOINTS } from './viewport.tokens';
import { SdViewportService } from './viewport.service';

class FakeViewport implements SdViewport {
  readonly listeners = new Set<EventListenerOrEventListenerObject>();
  addCount = 0;
  removeCount = 0;

  constructor(
    public innerWidth = 767,
    public innerHeight = 600
  ) {}

  addEventListener(_type: 'resize', listener: EventListenerOrEventListenerObject): void {
    this.addCount += 1;
    this.listeners.add(listener);
  }

  removeEventListener(_type: 'resize', listener: EventListenerOrEventListenerObject): void {
    this.removeCount += 1;
    this.listeners.delete(listener);
  }

  resizeTo(width: number, height: number): void {
    this.innerWidth = width;
    this.innerHeight = height;
    for (const listener of [...this.listeners]) {
      if (typeof listener === 'function') listener(new Event('resize'));
      else listener.handleEvent(new Event('resize'));
    }
  }
}

describe('SdViewportService', () => {
  afterEach(() => TestBed.resetTestingModule());

  function configure(viewport: SdViewport | null, breakpoints?: SdViewportBreakpoints): SdViewportService {
    TestBed.configureTestingModule({
      providers: [
        { provide: SD_VIEWPORT, useValue: viewport },
        ...(breakpoints ? [{ provide: SD_VIEWPORT_BREAKPOINTS, useValue: breakpoints }] : []),
      ],
    });
    return TestBed.inject(SdViewportService);
  }

  it('tracks width, height and default breakpoint transitions reactively', () => {
    const viewport = new FakeViewport();
    const service = configure(viewport);

    expect(service.breakpoints).toEqual({ mobile: 0, tablet: 768, desktop: 1024 });
    expect(service.width()).toBe(767);
    expect(service.height()).toBe(600);
    expect(service.currentBreakpoint()).toBe('mobile');
    expect(service.isMobile()).toBeTrue();
    expect(service.isTablet()).toBeFalse();
    expect(service.isDesktop()).toBeFalse();

    viewport.resizeTo(768, 700);
    expect(service.width()).toBe(768);
    expect(service.height()).toBe(700);
    expect(service.currentBreakpoint()).toBe('tablet');
    expect(service.isTablet()).toBeTrue();

    viewport.resizeTo(1024, 800);
    expect(service.currentBreakpoint()).toBe('desktop');
    expect(service.isDesktop()).toBeTrue();
  });

  it('uses an ordered custom breakpoint configuration', () => {
    const viewport = new FakeViewport(599, 500);
    const service = configure(viewport, { mobile: 320, tablet: 600, desktop: 1200 });

    expect(service.breakpoints).toEqual({ mobile: 320, tablet: 600, desktop: 1200 });
    expect(service.currentBreakpoint()).toBe('mobile');

    viewport.resizeTo(600, 500);
    expect(service.currentBreakpoint()).toBe('tablet');

    viewport.resizeTo(1200, 500);
    expect(service.currentBreakpoint()).toBe('desktop');
  });

  it('falls back atomically when custom breakpoints are invalid or unordered', () => {
    const service = configure(new FakeViewport(), { mobile: 0, tablet: 1200, desktop: 900 });

    expect(service.breakpoints).toEqual(SD_VIEWPORT_DEFAULT_BREAKPOINTS);
  });

  it('registers only one viewport listener for the root service instance', () => {
    const viewport = new FakeViewport();
    const first = configure(viewport);
    const second = TestBed.inject(SdViewportService);

    expect(second).toBe(first);
    expect(viewport.addCount).toBe(1);
    expect(viewport.listeners.size).toBe(1);
  });

  it('removes its resize listener when the injection context is destroyed', () => {
    const viewport = new FakeViewport();
    configure(viewport);

    TestBed.resetTestingModule();

    expect(viewport.removeCount).toBe(1);
    expect(viewport.listeners.size).toBe(0);
  });

  it('is SSR-safe and defaults to a stable desktop state without a viewport', () => {
    const service = configure(null);

    expect(service.width()).toBe(Number.MAX_SAFE_INTEGER);
    expect(service.height()).toBe(Number.MAX_SAFE_INTEGER);
    expect(service.currentBreakpoint()).toBe('desktop');
    expect(service.isDesktop()).toBeTrue();
  });
});
