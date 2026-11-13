import { Component, NgZone, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SdScrollDirective } from './sd-scroll.directive';

// why: lấy bản addEventListener (đã được zone.js vá) trước khi spy, để test AC-005 gọi lại được hàm thật.
const nativeAddEventListener = EventTarget.prototype.addEventListener;

// why: media query thật của Chrome headless phụ thuộc máy chạy test; giả lập để mỗi case chọn rõ chế độ cảm ứng/chuột.
interface FakeMediaQueryList {
  matches: boolean;
  media: string;
  addEventListener: jasmine.Spy;
  removeEventListener: jasmine.Spy;
  emit(matches: boolean): void;
}

function createFakeMediaQueryList(matches: boolean): FakeMediaQueryList {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mql: FakeMediaQueryList = {
    matches,
    media: '',
    addEventListener: jasmine
      .createSpy('addEventListener')
      .and.callFake((_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener)),
    removeEventListener: jasmine
      .createSpy('removeEventListener')
      .and.callFake((_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener)),
    emit(next: boolean) {
      mql.matches = next;
      listeners.forEach(listener => listener({ matches: next } as MediaQueryListEvent));
    },
  };
  return mql;
}

@Component({
  standalone: true,
  imports: [SdScrollDirective],
  template: `<div sdScroll data-testid="scroll-host" style="width:100px;overflow:hidden;">
    <span data-testid="child">content</span>
  </div>`,
})
class HostComponent {
  @ViewChild(SdScrollDirective) directive!: SdScrollDirective;
}

@Component({
  standalone: true,
  imports: [SdScrollDirective],
  template: `<div sdScroll class="host">a</div>
    <div sdScroll class="host">b</div>
    <div sdScroll class="host">c</div>`,
})
class MultiHostComponent {
  @ViewChildren(SdScrollDirective) directives!: QueryList<SdScrollDirective>;
}

/** Số listener `type` đang gắn trên `target`, đếm qua spy trên EventTarget.prototype. */
function activeListeners(add: jasmine.Spy, remove: jasmine.Spy, target: EventTarget, type: string): number {
  const count = (spy: jasmine.Spy) => spy.calls.all().filter(call => call.object === target && call.args[0] === type).length;
  return count(add) - count(remove);
}

describe('SdScrollDirective', () => {
  let mql: FakeMediaQueryList;
  let matchMediaSpy: jasmine.Spy;
  let addSpy: jasmine.Spy;
  let removeSpy: jasmine.Spy;

  function setup(touch: boolean): { fixture: ComponentFixture<HostComponent>; el: HTMLElement; child: HTMLElement } {
    mql = createFakeMediaQueryList(touch);
    matchMediaSpy = spyOn(window, 'matchMedia').and.returnValue(mql as unknown as MediaQueryList);
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[data-testid="scroll-host"]') as HTMLElement;
    const child = fixture.nativeElement.querySelector('[data-testid="child"]') as HTMLElement;
    return { fixture, el, child };
  }

  beforeEach(async () => {
    addSpy = spyOn(EventTarget.prototype, 'addEventListener').and.callThrough();
    removeSpy = spyOn(EventTarget.prototype, 'removeEventListener').and.callThrough();
    await TestBed.configureTestingModule({
      imports: [HostComponent, MultiHostComponent],
    }).compileComponents();
  });

  describe('base styles', () => {
    it('should attach the directive and keep overflow-y auto and the translate3d hint', () => {
      const { fixture, el } = setup(false);
      expect(fixture.componentInstance.directive).toBeTruthy();
      expect(el.style.overflowY).toBe('auto');
      // Chrome chuẩn hoá translate3d(0,0,0) thành translate3d(0px, 0px, 0px)
      expect(el.style.webkitTransform).toMatch(/translate3d\(/);
    });
  });

  describe('touch devices (AC-001)', () => {
    it('should query "(hover: none), (any-pointer: coarse)"', () => {
      setup(true);
      expect(matchMediaSpy).toHaveBeenCalledOnceWith('(hover: none), (any-pointer: coarse)');
    });

    it('should set overflow-x to auto right after the first render', () => {
      const { el } = setup(true);
      expect(el.style.overflowX).toBe('auto');
    });

    it('should not attach mouse listeners on the host', () => {
      const { el } = setup(true);
      expect(activeListeners(addSpy, removeSpy, el, 'mouseenter')).toBe(0);
      expect(activeListeners(addSpy, removeSpy, el, 'mouseleave')).toBe(0);
      expect(activeListeners(addSpy, removeSpy, el, 'mouseover')).toBe(0);
      expect(activeListeners(addSpy, removeSpy, el, 'mouseout')).toBe(0);
    });

    it('should keep overflow-x auto when mouse events reach the host', () => {
      const { fixture, el } = setup(true);
      el.dispatchEvent(new MouseEvent('mouseleave'));
      el.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
      fixture.detectChanges();
      expect(el.style.overflowX).toBe('auto');
    });
  });

  describe('mouse devices (AC-002)', () => {
    it('should hide the horizontal scrollbar at rest', () => {
      const { el } = setup(false);
      expect(el.style.overflowX).toBe('hidden');
    });

    it('should show it on mouseenter and hide it on mouseleave', () => {
      const { el } = setup(false);
      el.dispatchEvent(new MouseEvent('mouseenter'));
      expect(el.style.overflowX).toBe('auto');
      el.dispatchEvent(new MouseEvent('mouseleave'));
      expect(el.style.overflowX).toBe('hidden');
    });

    it('should not write styles while the pointer moves between children', () => {
      const { fixture, el, child } = setup(false);
      el.dispatchEvent(new MouseEvent('mouseenter'));
      const setStyle = spyOn(fixture.componentInstance.directive['renderer'], 'setStyle').and.callThrough();

      child.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      child.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
      el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

      expect(setStyle).not.toHaveBeenCalled();
      expect(el.style.overflowX).toBe('auto');
    });

    it('should not rewrite overflow-x when the value does not change', () => {
      const { fixture, el } = setup(false);
      el.dispatchEvent(new MouseEvent('mouseenter'));
      const setStyle = spyOn(fixture.componentInstance.directive['renderer'], 'setStyle').and.callThrough();
      el.dispatchEvent(new MouseEvent('mouseenter'));
      expect(setStyle).not.toHaveBeenCalled();
    });
  });

  describe('shared media query listener (AC-003)', () => {
    function setupMulti(touch: boolean) {
      mql = createFakeMediaQueryList(touch);
      matchMediaSpy = spyOn(window, 'matchMedia').and.returnValue(mql as unknown as MediaQueryList);
      const fixture = TestBed.createComponent(MultiHostComponent);
      fixture.detectChanges();
      const hosts = Array.from(fixture.nativeElement.querySelectorAll('.host')) as HTMLElement[];
      return { fixture, hosts };
    }

    it('should create one MediaQueryList and one change listener for every instance', () => {
      const { hosts } = setupMulti(false);
      expect(hosts.length).toBe(3);
      expect(matchMediaSpy).toHaveBeenCalledTimes(1);
      expect(mql.addEventListener).toHaveBeenCalledTimes(1);
      expect(mql.addEventListener.calls.mostRecent().args[0]).toBe('change');
    });

    it('should switch every live instance when the media query changes', () => {
      const { fixture, hosts } = setupMulti(false);
      expect(hosts.map(h => h.style.overflowX)).toEqual(['hidden', 'hidden', 'hidden']);

      mql.emit(true);
      fixture.detectChanges();
      expect(hosts.map(h => h.style.overflowX)).toEqual(['auto', 'auto', 'auto']);
      hosts.forEach(h => expect(activeListeners(addSpy, removeSpy, h, 'mouseenter')).toBe(0));

      mql.emit(false);
      fixture.detectChanges();
      expect(hosts.map(h => h.style.overflowX)).toEqual(['hidden', 'hidden', 'hidden']);
      hosts.forEach(h => expect(activeListeners(addSpy, removeSpy, h, 'mouseenter')).toBe(1));
    });

    it('should remove the change listener when the root injector is destroyed', () => {
      setupMulti(false);
      const listener = mql.addEventListener.calls.mostRecent().args[1];
      TestBed.resetTestingModule();
      expect(mql.removeEventListener).toHaveBeenCalledWith('change', listener);
    });
  });

  describe('cleanup (AC-004)', () => {
    it('should remove the mouse listeners when the directive is destroyed', () => {
      const { fixture, el } = setup(false);
      expect(activeListeners(addSpy, removeSpy, el, 'mouseenter')).toBe(1);
      expect(activeListeners(addSpy, removeSpy, el, 'mouseleave')).toBe(1);

      fixture.destroy();

      expect(activeListeners(addSpy, removeSpy, el, 'mouseenter')).toBe(0);
      expect(activeListeners(addSpy, removeSpy, el, 'mouseleave')).toBe(0);
      el.dispatchEvent(new MouseEvent('mouseenter'));
      expect(el.style.overflowX).toBe('hidden');
    });

    it('should not attach duplicate mouse listeners across mode switches', () => {
      const { fixture, el } = setup(false);
      for (const touch of [true, false, true, false, false]) {
        mql.emit(touch);
        fixture.detectChanges();
      }
      expect(activeListeners(addSpy, removeSpy, el, 'mouseenter')).toBe(1);
      expect(activeListeners(addSpy, removeSpy, el, 'mouseleave')).toBe(1);
      el.dispatchEvent(new MouseEvent('mouseenter'));
      expect(el.style.overflowX).toBe('auto');
    });

    it('should cancel a pending scrollTop() when the directive is destroyed', fakeAsync(() => {
      const { fixture, el } = setup(false);
      const writes: number[] = [];
      Object.defineProperty(el, 'scrollTop', { get: () => 0, set: (v: number) => writes.push(v), configurable: true });

      fixture.componentInstance.directive.scrollTop();
      fixture.destroy();
      tick(1);

      expect(writes).toEqual([]);
    }));

    it('should keep only the latest pending scrollTop()', fakeAsync(() => {
      const { fixture, el } = setup(false);
      const writes: number[] = [];
      Object.defineProperty(el, 'scrollTop', { get: () => 0, set: (v: number) => writes.push(v), configurable: true });

      fixture.componentInstance.directive.scrollTop();
      fixture.componentInstance.directive.scrollTop();
      expect(writes).toEqual([]);
      tick(1);

      expect(writes).toEqual([0]);
    }));
  });

  describe('change detection (AC-005)', () => {
    it('should register the mouse listeners outside the Angular zone', () => {
      const zones: boolean[] = [];
      addSpy.and.callFake(function (this: EventTarget, ...args: Parameters<EventTarget['addEventListener']>) {
        if (args[0] === 'mouseenter' || args[0] === 'mouseleave') zones.push(NgZone.isInAngularZone());
        return nativeAddEventListener.apply(this, args);
      });
      setup(false);
      expect(zones.length).toBe(2);
      expect(zones.every(inZone => !inZone)).toBeTrue();
    });
  });

  describe('without matchMedia (AC-006)', () => {
    it('should keep the hover behaviour and not throw', () => {
      const original = window.matchMedia;
      (window as unknown as { matchMedia: unknown }).matchMedia = undefined;
      try {
        const fixture = TestBed.createComponent(HostComponent);
        expect(() => fixture.detectChanges()).not.toThrow();
        const el = fixture.nativeElement.querySelector('[data-testid="scroll-host"]') as HTMLElement;
        expect(el.style.overflowX).toBe('hidden');
        el.dispatchEvent(new MouseEvent('mouseenter'));
        expect(el.style.overflowX).toBe('auto');
        el.dispatchEvent(new MouseEvent('mouseleave'));
        expect(el.style.overflowX).toBe('hidden');
      } finally {
        window.matchMedia = original;
      }
    });
  });

  describe('scrollTop()', () => {
    it('should assign scrollTop = 0 on the host after a 1ms delay', fakeAsync(() => {
      const { fixture, el } = setup(false);
      let assignedValue: number | undefined;
      Object.defineProperty(el, 'scrollTop', {
        get: () => assignedValue ?? 0,
        set: (v: number) => {
          assignedValue = v;
        },
        configurable: true,
      });

      fixture.componentInstance.directive.scrollTop();
      expect(assignedValue).toBeUndefined();
      tick(1);
      expect(assignedValue).toBe(0);
    }));
  });
});
