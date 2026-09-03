import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SdScrollDirective } from './sd-scroll.directive';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdScrollDirective],
  template: `<div sdScroll data-testid="scroll-host" style="width:100px;overflow:hidden;">content</div>`,
})
class HostComponent {
  @ViewChild(SdScrollDirective) directive!: SdScrollDirective;
}

describe('SdScrollDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement.querySelector('[data-testid="scroll-host"]') as HTMLElement;
  });

  describe('creation', () => {
    it('should create the host component', () => {
      expect(host).toBeTruthy();
    });

    it('should attach the directive to the host element', () => {
      expect(host.directive).toBeTruthy();
    });
  });

  describe('ngOnInit — initial styles', () => {
    it('should set overflow-x to hidden on init', () => {
      expect(el.style.overflowX).toBe('hidden');
    });

    it('should set overflow-y to auto on init', () => {
      expect(el.style.overflowY).toBe('auto');
    });

    it('should set -webkit-transform to a translate3d value on init', () => {
      // Chrome normalises translate3d(0,0,0) → translate3d(0px, 0px, 0px)
      expect(el.style.webkitTransform).toMatch(/translate3d\(/);
    });
  });

  describe('mouseover event', () => {
    it('should set overflow-x to auto when mouse enters the host', () => {
      el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      fixture.detectChanges();

      expect(el.style.overflowX).toBe('auto');
    });

    it('should not change overflow-y on mouseover', () => {
      el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      fixture.detectChanges();

      expect(el.style.overflowY).toBe('auto');
    });
  });

  describe('mouseout event', () => {
    it('should restore overflow-x to hidden when mouse leaves the host', () => {
      // First trigger mouseover so overflowX = 'auto'
      el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      fixture.detectChanges();
      expect(el.style.overflowX).toBe('auto');

      // Now trigger mouseout
      el.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
      fixture.detectChanges();

      expect(el.style.overflowX).toBe('hidden');
    });

    it('should not change overflow-y on mouseout', () => {
      el.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
      fixture.detectChanges();

      expect(el.style.overflowY).toBe('auto');
    });
  });

  describe('scrollTop() method', () => {
    it('should expose a scrollTop method on the directive instance', () => {
      expect(typeof host.directive.scrollTop).toBe('function');
    });

    it('should assign scrollTop = 0 on nativeElement after a 1ms delay', fakeAsync(() => {
      // In a headless test DOM the element has no scrollable content so el.scrollTop
      // is always clamped to 0. Verify the assignment is made via a property spy.
      let assignedValue: number | undefined;
      Object.defineProperty(el, 'scrollTop', {
        get: () => assignedValue ?? 0,
        set: (v: number) => {
          assignedValue = v;
        },
        configurable: true,
      });

      host.directive.scrollTop();
      // Before tick: assignment has not happened yet
      expect(assignedValue).toBeUndefined();

      tick(1);
      expect(assignedValue).toBe(0);
    }));
  });
});
