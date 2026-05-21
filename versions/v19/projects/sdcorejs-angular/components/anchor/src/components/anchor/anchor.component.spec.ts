import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { SdAnchor } from './anchor.component';
import { SdAnchorItem } from '../anchor-item/anchor-item.component';

// ---------------------------------------------------------------------------
// Host for main suite
// ---------------------------------------------------------------------------
@Component({
  standalone: true,
  imports: [SdAnchor, SdAnchorItem],
  template: `
    <div style="height: 400px">
      <sd-anchor [type]="type" [isHiddenAnchorList]="hidden">
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
  type: 'vertical' | 'horizontal' = 'vertical';
  hidden = false;
}

// ---------------------------------------------------------------------------
// Host for isHiddenAnchorList = true (separate describe avoids resetTestingModule)
// ---------------------------------------------------------------------------
@Component({
  standalone: true,
  imports: [SdAnchor, SdAnchorItem],
  template: `
    <div style="height: 400px">
      <sd-anchor [isHiddenAnchorList]="true">
        <sd-anchor-item [title]="'Section 1'">
          <div>content</div>
        </sd-anchor-item>
      </sd-anchor>
    </div>
  `,
})
class HiddenHost {}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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
  let host: HostComponent;
  let anchor: SdAnchor;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
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

    it('initialises activeSectionId to the first section id after first render', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      const firstId = anchor.sections()[0]?.id ?? '';
      expect(firstId).toBeTruthy();
      expect(anchor.activeSectionId()).toBe(firstId);
    }));
  });

  // -------------------------------------------------------------------------
  describe('type input', () => {
    it('defaults to "vertical"', () => {
      expect(anchor.type()).toBe('vertical');
    });

    it('reflects "horizontal" when set on host', () => {
      host.type = 'horizontal';
      fixture.detectChanges();
      expect(anchor.type()).toBe('horizontal');
    });

    it('reverts to "vertical" when reset', () => {
      host.type = 'horizontal';
      fixture.detectChanges();
      host.type = 'vertical';
      fixture.detectChanges();
      expect(anchor.type()).toBe('vertical');
    });
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
    }));

    it('handles an unknown / non-existent section id without throwing', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      expect(() => anchor.scrollSectionByClick('nonexistent-uuid')).not.toThrow();
      // activeSectionId is still set even when the element is not found
      expect(anchor.activeSectionId()).toBe('nonexistent-uuid');
    }));

    it('updates activeSectionId when called with a third section', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      const thirdId = anchor.sections()[2]?.id ?? '';
      anchor.scrollSectionByClick(thirdId);
      expect(anchor.activeSectionId()).toBe(thirdId);
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
      // Trigger a click first to register #clickScrollSubscription
      const firstId = anchor.sections()[0]?.id ?? '';
      anchor.scrollSectionByClick(firstId);
      expect(() => fixture.destroy()).not.toThrow();
    }));
  });

  // -------------------------------------------------------------------------
  describe('autoId', () => {
    it('returns undefined when autoId input is not provided', () => {
      expect(anchor.autoId()).toBeUndefined();
    });

    it('itemAutoId returns undefined when autoId is not set', () => {
      expect(anchor.itemAutoId('first')).toBeUndefined();
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

    it('isOverscroll defaults to false', () => {
      expect(anchor.isOverscroll()).toBe(false);
    });

    it('isHiddenAnchorList defaults to false', () => {
      expect(anchor.isHiddenAnchorList()).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Scroll-spy suite
// ---------------------------------------------------------------------------
describe('SdAnchor (scroll-spy)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let anchor: SdAnchor;
  let wrapperEl: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    anchor = getAnchor(fixture);
    wrapperEl = fixture.nativeElement.querySelector('.c-anchor-vertical');
  });

  /** Set offsetTop / offsetHeight on each section's native element. */
  function mockSectionOffsets(offsets: Array<{ top: number; height: number }>) {
    const sections = anchor.sections();
    offsets.forEach((o, i) => {
      Object.defineProperty(sections[i].elementRef.nativeElement, 'offsetTop', {
        value: o.top,
        configurable: true,
      });
      Object.defineProperty(sections[i].elementRef.nativeElement, 'offsetHeight', {
        value: o.height,
        configurable: true,
      });
    });
  }

  /**
   * Make getComputedStyle return zero padding/border so that
   * #updateCurrentScroll returns just scrollTop (no extra offsets).
   */
  function stubComputedStyle() {
    spyOn(window, 'getComputedStyle').and.returnValue({
      paddingTop: '0px',
      borderTopWidth: '0px',
    } as CSSStyleDeclaration);
  }

  it('updates activeSectionId when scroll enters second section', fakeAsync(() => {
    tick();
    fixture.detectChanges();
    stubComputedStyle();
    mockSectionOffsets([
      { top: 0, height: 400 },
      { top: 400, height: 400 },
      { top: 800, height: 400 },
    ]);

    Object.defineProperty(wrapperEl, 'scrollTop', { value: 450, configurable: true, writable: true });
    wrapperEl.dispatchEvent(new Event('scroll'));
    tick(50); // advance past auditTime(50)
    fixture.detectChanges();

    const sections = anchor.sections();
    expect(anchor.activeSectionId()).toBe(sections[1].id);
  }));

  it('updates activeSectionId when scroll enters third section', fakeAsync(() => {
    tick();
    fixture.detectChanges();
    stubComputedStyle();
    mockSectionOffsets([
      { top: 0, height: 400 },
      { top: 400, height: 400 },
      { top: 800, height: 400 },
    ]);

    Object.defineProperty(wrapperEl, 'scrollTop', { value: 850, configurable: true, writable: true });
    wrapperEl.dispatchEvent(new Event('scroll'));
    tick(50);
    fixture.detectChanges();

    const sections = anchor.sections();
    expect(anchor.activeSectionId()).toBe(sections[2].id);
  }));

  it('rate-limits rapid scroll events via auditTime(50)', fakeAsync(() => {
    tick();
    fixture.detectChanges();
    stubComputedStyle();
    mockSectionOffsets([
      { top: 0, height: 400 },
      { top: 400, height: 400 },
      { top: 800, height: 400 },
    ]);

    // dispatch three rapid events before auditTime fires
    Object.defineProperty(wrapperEl, 'scrollTop', { value: 100, configurable: true, writable: true });
    wrapperEl.dispatchEvent(new Event('scroll'));
    Object.defineProperty(wrapperEl, 'scrollTop', { value: 200, configurable: true, writable: true });
    wrapperEl.dispatchEvent(new Event('scroll'));
    Object.defineProperty(wrapperEl, 'scrollTop', { value: 450, configurable: true, writable: true });
    wrapperEl.dispatchEvent(new Event('scroll'));
    tick(50); // only the last value (450) should be processed
    fixture.detectChanges();

    const sections = anchor.sections();
    expect(anchor.activeSectionId()).toBe(sections[1].id);
  }));

  it('stays on last section when scrollTop exceeds all section bounds', fakeAsync(() => {
    tick();
    fixture.detectChanges();
    stubComputedStyle();
    mockSectionOffsets([
      { top: 0, height: 400 },
      { top: 400, height: 400 },
      { top: 800, height: 400 },
    ]);

    // scrollTop beyond last section's bottom → no section matched → activeSectionId unchanged
    const initialId = anchor.activeSectionId();
    Object.defineProperty(wrapperEl, 'scrollTop', { value: 1300, configurable: true, writable: true });
    wrapperEl.dispatchEvent(new Event('scroll'));
    tick(50);
    fixture.detectChanges();

    // activeSectionId should remain whatever it was before (first section id),
    // since no section range covers scrollTop=1300
    expect(anchor.activeSectionId()).toBe(initialId);
  }));
});

// ---------------------------------------------------------------------------
// Separate suite for isHiddenAnchorList = true
// ---------------------------------------------------------------------------
describe('SdAnchor (isHiddenAnchorList=true)', () => {
  let fixture: ComponentFixture<HiddenHost>;
  let anchor: SdAnchor;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HiddenHost, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HiddenHost);
    fixture.detectChanges();
    anchor = getAnchor(fixture);
  });

  it('does not set activeSectionId after first render when hidden', fakeAsync(() => {
    tick();
    fixture.detectChanges();
    // When isHiddenAnchorList=true, afterNextRender skips the activeSectionId.set() call
    expect(anchor.activeSectionId()).toBe('');
  }));

  it('isHiddenAnchorList() returns true', () => {
    expect(anchor.isHiddenAnchorList()).toBe(true);
  });

  it('destroys cleanly when hidden', fakeAsync(() => {
    tick();
    fixture.detectChanges();
    expect(() => fixture.destroy()).not.toThrow();
  }));
});
