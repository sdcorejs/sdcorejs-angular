import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { SD_VIEWPORT, SdViewport } from '@sdcorejs/angular/services/viewport';
import { SdAnchor } from './anchor.component';
import { SdAnchorItem } from '../anchor-item/anchor-item.component';

// ---------------------------------------------------------------------------
// IntersectionObserver mock
// ---------------------------------------------------------------------------
// why: `jasmine.createSpy(...)` returns a function that is NOT reliably
// constructable across jasmine versions — `new IntersectionObserver(cb)` in
// anchor.component.ts then throws "target is not a constructor". Use a real
// constructor function with a top-level `callCount` counter for assertions.
let capturedIOCallback: IntersectionObserverCallback | null = null;
let ioConstructorCallCount = 0;

function MockIntersectionObserver(this: any, callback: IntersectionObserverCallback): void {
  capturedIOCallback = callback;
  ioConstructorCallCount += 1;
  this.observe = (_target: Element) => undefined;
  this.disconnect = () => undefined;
  this.unobserve = (_target: Element) => undefined;
  this.takeRecords = () => [];
  this.root = null;
  this.rootMargin = '';
  this.thresholds = [];
}

function mockIntersectionObserver(): void {
  capturedIOCallback = null;
  ioConstructorCallCount = 0;
  (window as any).IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
}

function triggerIntersection(entries: Partial<IntersectionObserverEntry>[]): void {
  capturedIOCallback?.(entries as IntersectionObserverEntry[], {} as IntersectionObserver);
}

// ---------------------------------------------------------------------------
// Viewport double
// ---------------------------------------------------------------------------
// why: SdAnchor lấy trạng thái mobile từ SdViewportService, mà service này đọc `window.innerWidth`
// thật — trong Karma iframe chiều rộng đó không xác định. Mọi suite dưới đây cắm một viewport giả
// cỡ desktop để nav luôn hiển thị một cách tất định; suite riêng về breakpoint tự cắm cỡ mobile.

class FakeViewport implements SdViewport {
  innerWidth: number;
  innerHeight = 800;
  readonly #listeners = new Set<EventListenerOrEventListenerObject>();

  constructor(innerWidth: number) {
    this.innerWidth = innerWidth;
  }

  addEventListener(_type: 'resize', listener: EventListenerOrEventListenerObject): void {
    this.#listeners.add(listener);
  }

  removeEventListener(_type: 'resize', listener: EventListenerOrEventListenerObject): void {
    this.#listeners.delete(listener);
  }

  get listenerCount(): number {
    return this.#listeners.size;
  }

  resizeTo(innerWidth: number): void {
    this.innerWidth = innerWidth;
    this.#listeners.forEach(listener =>
      typeof listener === 'function' ? listener(new Event('resize')) : listener.handleEvent(new Event('resize'))
    );
  }
}

function desktopViewportProvider(): { provide: typeof SD_VIEWPORT; useValue: SdViewport } {
  return { provide: SD_VIEWPORT, useValue: new FakeViewport(1440) };
}

// ---------------------------------------------------------------------------
// Host components
// ---------------------------------------------------------------------------
@Component({
  standalone: true,
  imports: [SdAnchor, SdAnchorItem],
  template: `
    <div style="height: 400px">
      <sd-anchor [hideNav]="hidden">
        <sd-anchor-item [title]="'Section 1'">
          <div style="height: 200px">Section 1 content</div>
        </sd-anchor-item>
        <sd-anchor-item [title]="'Section 2'">
          <div style="height: 200px">Section 2 content</div>
        </sd-anchor-item>
        <sd-anchor-item [title]="'Section 3'">
          <div style="height: 200px">Section 3 content</div>
        </sd-anchor-item>
      </sd-anchor>
    </div>
  `,
})
class HostComponent {
  hidden = false;
}

@Component({
  standalone: true,
  imports: [SdAnchor, SdAnchorItem],
  template: `
    <div style="height: 400px">
      <sd-anchor [hideNav]="true">
        <sd-anchor-item [title]="'Section 1'">
          <div>content</div>
        </sd-anchor-item>
      </sd-anchor>
    </div>
  `,
})
class HiddenHost {}

@Component({
  imports: [SdAnchor, SdAnchorItem],
  template: `
    <div style="height: 400px">
      <sd-anchor>
        <sd-anchor-item title="Section 1"><div style="height: 200px">x</div></sd-anchor-item>
      </sd-anchor>
    </div>
  `,
})
class HostDefaultComponent {}

@Component({
  imports: [SdAnchor, SdAnchorItem],
  template: `
    <div style="height: 400px">
      <sd-anchor [hideNavOnMobile]="false">
        <sd-anchor-item title="Section 1"><div style="height: 200px">x</div></sd-anchor-item>
      </sd-anchor>
    </div>
  `,
})
class MobileNavHost {}

function getAnchor(fixture: ComponentFixture<unknown>): SdAnchor {
  const de = fixture.debugElement.query(By.directive(SdAnchor));
  if (!de) throw new Error('SdAnchor not found in fixture');
  return de.componentInstance as SdAnchor;
}

// ---------------------------------------------------------------------------
// Main suite
// ---------------------------------------------------------------------------
describe('SdAnchor', () => {
  let fixture: ComponentFixture<HostComponent>;
  let anchor: SdAnchor;

  beforeEach(async () => {
    mockIntersectionObserver();
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
      providers: [desktopViewportProvider()],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    anchor = getAnchor(fixture);
  });

  // -------------------------------------------------------------------------
  describe('creation', () => {
    it('creates the SdAnchor component', () => {
      expect(anchor).toBeTruthy();
    });

    it('picks up 3 sd-anchor-item children via contentChildren', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      expect(anchor.sections().length).toBe(3);
    }));

    it('activeSectionId starts as empty string before any intersection fires', () => {
      expect(anchor.activeSectionId()).toBe('');
    });

    it('activeSectionId is set when first section becomes intersecting', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      const sections = anchor.sections();
      triggerIntersection([{ isIntersecting: true, target: sections[0].elementRef.nativeElement }]);
      expect(anchor.activeSectionId()).toBe(sections[0].id);
    }));
  });

  // -------------------------------------------------------------------------
  describe('scroll-spy (IntersectionObserver)', () => {
    it('activates the topmost visible section in document order', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      const sections = anchor.sections();
      // sections[1] and sections[2] both visible → first in order wins
      triggerIntersection([
        { isIntersecting: true, target: sections[1].elementRef.nativeElement },
        { isIntersecting: true, target: sections[2].elementRef.nativeElement },
      ]);
      expect(anchor.activeSectionId()).toBe(sections[1].id);
    }));

    it('switches active section when a new section scrolls into view', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      const sections = anchor.sections();
      triggerIntersection([{ isIntersecting: true, target: sections[0].elementRef.nativeElement }]);
      expect(anchor.activeSectionId()).toBe(sections[0].id);

      triggerIntersection([
        { isIntersecting: false, target: sections[0].elementRef.nativeElement },
        { isIntersecting: true, target: sections[1].elementRef.nativeElement },
      ]);
      expect(anchor.activeSectionId()).toBe(sections[1].id);
    }));

    it('does not update activeSectionId while click-scrolling is in progress', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      const sections = anchor.sections();
      anchor.scrollSectionByClick(sections[2].id);
      expect(anchor.activeSectionId()).toBe(sections[2].id);

      // Intersection fires mid-scroll animation — must be ignored
      triggerIntersection([{ isIntersecting: true, target: sections[0].elementRef.nativeElement }]);
      expect(anchor.activeSectionId()).toBe(sections[2].id);

      tick(200); // flush fallback timeout
    }));

    it('resumes scroll-spy after scrollend fires', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      const sections = anchor.sections();
      anchor.scrollSectionByClick(sections[1].id);

      anchor.wrapper().nativeElement.dispatchEvent(new Event('scrollend'));
      tick();

      triggerIntersection([{ isIntersecting: true, target: sections[0].elementRef.nativeElement }]);
      expect(anchor.activeSectionId()).toBe(sections[0].id);

      tick(200); // flush pending fallback timeout
    }));

    it('resumes scroll-spy via 200ms timeout fallback when scroll position is unchanged', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      const sections = anchor.sections();
      anchor.scrollSectionByClick(sections[0].id);

      tick(200); // fallback fires → #isClickScrolling = false

      triggerIntersection([{ isIntersecting: true, target: sections[2].elementRef.nativeElement }]);
      expect(anchor.activeSectionId()).toBe(sections[2].id);
    }));
  });

  // -------------------------------------------------------------------------
  describe('scrollSectionByClick', () => {
    it('immediately sets activeSectionId to the target section id', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      const secondId = anchor.sections()[1]?.id ?? '';
      expect(secondId).toBeTruthy();

      anchor.scrollSectionByClick(secondId);
      expect(anchor.activeSectionId()).toBe(secondId);
      tick(200);
    }));

    it('handles an unknown / non-existent section id without throwing', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      expect(() => anchor.scrollSectionByClick('nonexistent-uuid')).not.toThrow();
      // activeSectionId is still set even when the element is not found
      expect(anchor.activeSectionId()).toBe('nonexistent-uuid');
      tick(200);
    }));

    it('updates activeSectionId when called with a third section', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      const thirdId = anchor.sections()[2]?.id ?? '';
      anchor.scrollSectionByClick(thirdId);
      expect(anchor.activeSectionId()).toBe(thirdId);
      tick(200);
    }));
  });

  // -------------------------------------------------------------------------
  describe('cleanup on destroy', () => {
    it('calls ngOnDestroy without throwing', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      expect(() => fixture.destroy()).not.toThrow();
    }));

    it('subscriptions are disposed after destroy (no double-dispose error)', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      const firstId = anchor.sections()[0]?.id ?? '';
      anchor.scrollSectionByClick(firstId);
      tick(200);
      expect(() => fixture.destroy()).not.toThrow();
    }));
  });

  // -------------------------------------------------------------------------
  describe('autoId', () => {
    it('returns undefined when autoId input is not provided', () => {
      expect(anchor.autoId()).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  describe('other inputs', () => {
    it('sidebarWidth defaults to "200px"', () => {
      expect(anchor.sidebarWidth()).toBe('200px');
    });

    it('ellipsis defaults to false', () => {
      expect(anchor.ellipsis()).toBe(false);
    });

    it('overScroll defaults to false', () => {
      expect(anchor.overScroll()).toBe(false);
    });

    it('hideNav reflects bound value (host binds hidden=false)', () => {
      expect(anchor.hideNav()).toBe(false);
    });

    it('color defaults to "primary"', () => {
      expect(anchor.color()).toBe('primary');
    });
  });
});

// ---------------------------------------------------------------------------
// hideNav default = false (không còn phụ thuộc UA lúc khởi tạo class)
// ---------------------------------------------------------------------------
describe('SdAnchor (hideNav default)', () => {
  let fixture: ComponentFixture<HostDefaultComponent>;
  let anchor: SdAnchor;

  beforeEach(async () => {
    mockIntersectionObserver();
    await TestBed.configureTestingModule({
      imports: [HostDefaultComponent],
      providers: [desktopViewportProvider()],
    }).compileComponents();
    fixture = TestBed.createComponent(HostDefaultComponent);
    fixture.detectChanges();
    anchor = fixture.debugElement.query(By.directive(SdAnchor)).componentInstance;
  });

  it('hideNav() mặc định false — chỉ là cờ ép ẩn thủ công', () => {
    expect(anchor.hideNav()).toBe(false);
  });

  it('hideNavOnMobile() mặc định true — auto-ẩn theo breakpoint vẫn giữ nguyên', () => {
    expect(anchor.hideNavOnMobile()).toBe(true);
  });

  it('viewport desktop (mặc định của TestBed) → navHidden false → nav hiển thị', () => {
    expect(anchor.navHidden()).toBe(false);
    expect(fixture.nativeElement.querySelector('.c-anchor-list')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// hideNav = true
// ---------------------------------------------------------------------------
describe('SdAnchor (hideNav=true)', () => {
  let fixture: ComponentFixture<HiddenHost>;
  let anchor: SdAnchor;

  beforeEach(async () => {
    mockIntersectionObserver();
    await TestBed.configureTestingModule({
      imports: [HiddenHost, NoopAnimationsModule],
      providers: [desktopViewportProvider()],
    }).compileComponents();

    fixture = TestBed.createComponent(HiddenHost);
    fixture.detectChanges();
    anchor = getAnchor(fixture);
  });

  it('does not register IntersectionObserver when hideNav=true', fakeAsync(() => {
    tick();
    fixture.detectChanges();
    expect(ioConstructorCallCount).toBe(0);
  }));

  it('activeSectionId remains empty string when hideNav=true', fakeAsync(() => {
    tick();
    fixture.detectChanges();
    expect(anchor.activeSectionId()).toBe('');
  }));

  it('hideNav() returns true', () => {
    expect(anchor.hideNav()).toBe(true);
  });

  it('destroys cleanly when hidden', fakeAsync(() => {
    tick();
    fixture.detectChanges();
    expect(() => fixture.destroy()).not.toThrow();
  }));
});

// ---------------------------------------------------------------------------
// hideNavOnMobile = false → giữ nav trên mobile
// ---------------------------------------------------------------------------
// why: trước đây đường thoát là `[hideNav]="false"`; giờ `hideNav` mặc định false nên không phân
// biệt được "không set" và "set false" — đường thoát chuyển sang input riêng.
describe('SdAnchor (hideNavOnMobile=false)', () => {
  let fixture: ComponentFixture<MobileNavHost>;

  beforeEach(async () => {
    mockIntersectionObserver();
    await TestBed.configureTestingModule({
      imports: [MobileNavHost, NoopAnimationsModule],
      providers: [{ provide: SD_VIEWPORT, useValue: new FakeViewport(375) }],
    }).compileComponents();
    fixture = TestBed.createComponent(MobileNavHost);
    fixture.detectChanges();
  });

  it('navHidden() stays false on a mobile viewport', () => {
    expect(getAnchor(fixture).navHidden()).toBe(false);
  });

  it('renders the nav column on a mobile viewport', () => {
    expect(fixture.nativeElement.querySelector('.c-anchor-list')).not.toBeNull();
  });
});
