import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SD_VIEWPORT, SdViewport } from '@sdcorejs/angular/services/viewport';
import { SdAnchor } from './anchor.component';
import { SdAnchorItem } from '../anchor-item/anchor-item.component';

// ---------------------------------------------------------------------------
// why: `hideNav` từng mặc định là `BrowserUtilities.isMobile()` — đọc UA ngay lúc class được khởi
// tạo. SSR không có `navigator` (markup server khác client → hydration lệch) và giá trị đó không
// bao giờ đánh giá lại khi resize. Suite này chỉ khẳng định DOM quan sát được theo breakpoint,
// KHÔNG chạm vào API mới, để nó là bằng chứng hồi quy độc lập.
// ---------------------------------------------------------------------------

// IntersectionObserver mock — `new IntersectionObserver(cb)` phải constructable.
function MockIntersectionObserver(this: any, _callback: IntersectionObserverCallback): void {
  this.observe = (_target: Element) => undefined;
  this.disconnect = () => undefined;
  this.unobserve = (_target: Element) => undefined;
  this.takeRecords = () => [];
  this.root = null;
  this.rootMargin = '';
  this.thresholds = [];
}

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

  resizeTo(innerWidth: number): void {
    this.innerWidth = innerWidth;
    const event = new Event('resize');
    this.#listeners.forEach(listener => (typeof listener === 'function' ? listener(event) : listener.handleEvent(event)));
  }
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdAnchor, SdAnchorItem],
  template: `
    <div style="height: 400px">
      <sd-anchor>
        <sd-anchor-item title="Section 1"><div style="height: 200px">x</div></sd-anchor-item>
      </sd-anchor>
    </div>
  `,
})
class ViewportHost {}

describe('SdAnchor viewport-driven nav visibility', () => {
  let fixture: ComponentFixture<ViewportHost>;
  // why: `window.IntersectionObserver` là state toàn cục của cả Karma bundle. Ghi đè mà không trả
  // lại thì stub này rò sang MỌI spec file chạy sau trong cùng bundle — spec đó tưởng đang dùng
  // IntersectionObserver thật nhưng lại nhận một stub không bao giờ bắn callback, và triệu chứng
  // phụ thuộc thứ tự file (gần như không debug nổi).
  let originalIntersectionObserver: typeof IntersectionObserver | undefined;

  beforeEach(() => {
    originalIntersectionObserver = (window as any).IntersectionObserver;
  });

  afterEach(() => {
    if (originalIntersectionObserver === undefined) {
      delete (window as any).IntersectionObserver;
      return;
    }
    (window as any).IntersectionObserver = originalIntersectionObserver;
  });

  async function setup(viewport: SdViewport | null): Promise<void> {
    (window as any).IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
    await TestBed.configureTestingModule({
      imports: [ViewportHost, NoopAnimationsModule],
      providers: [{ provide: SD_VIEWPORT, useValue: viewport }],
    }).compileComponents();
    fixture = TestBed.createComponent(ViewportHost);
    fixture.detectChanges();
  }

  function navElement(): Element | null {
    return fixture.nativeElement.querySelector('.c-anchor-list');
  }

  it('hides the TOC column on a mobile viewport without any consumer input', async () => {
    await setup(new FakeViewport(375));
    expect(navElement()).toBeNull();
  });

  it('shows the TOC column on a desktop viewport', async () => {
    await setup(new FakeViewport(1440));
    expect(navElement()).not.toBeNull();
  });

  it('re-evaluates on resize instead of freezing the value taken at construction', async () => {
    const viewport = new FakeViewport(375);
    await setup(viewport);
    expect(navElement()).toBeNull();

    viewport.resizeTo(1440);
    fixture.detectChanges();
    expect(navElement()).not.toBeNull();

    viewport.resizeTo(320);
    fixture.detectChanges();
    expect(navElement()).toBeNull();
  });

  it('treats an absent viewport (SSR) as desktop so server markup keeps the TOC', async () => {
    await setup(null);
    expect(navElement()).not.toBeNull();
  });
});
