import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SdNotifyService } from '../notify.service';
import { ToastData } from '../notify.model';
import { ToastContainerComponent } from './toast-container.component';

describe('ToastContainerComponent', () => {
  beforeEach(() => {
    // why: SdNotifyService constructor attaches a real toast-container to body —
    // here we test the container directly, so we don't bootstrap the service.
    TestBed.configureTestingModule({
      imports: [ToastContainerComponent],
      providers: [
        // why: child <toast> needs the service; minimal stub is enough since we
        // do not exercise close behaviour here.
        { provide: SdNotifyService, useValue: { remove: jasmine.createSpy('remove') } },
      ],
    });
  });

  it('creates with empty toasts list by default', () => {
    const fix = TestBed.createComponent(ToastContainerComponent);
    fix.detectChanges();
    expect(fix.componentInstance.toasts()).toEqual([]);
    // No child <toast> elements rendered when list empty
    expect(fix.nativeElement.querySelectorAll('toast').length).toBe(0);
  });

  it('renders one <toast> per item in the toasts signal', () => {
    const fix = TestBed.createComponent(ToastContainerComponent);
    fix.componentInstance.toasts.set([
      { id: 'a', type: 'success', message: 'A', duration: 1000 } as ToastData,
      { id: 'b', type: 'info', message: 'B', duration: 1000 } as ToastData,
      { id: 'c', type: 'warning', message: 'C', duration: 1000 } as ToastData,
    ]);
    fix.detectChanges();
    expect(fix.nativeElement.querySelectorAll('toast').length).toBe(3);
  });

  it('reactively updates the DOM when toasts signal grows', () => {
    const fix = TestBed.createComponent(ToastContainerComponent);
    fix.detectChanges();
    expect(fix.nativeElement.querySelectorAll('toast').length).toBe(0);

    fix.componentInstance.toasts.set([{ id: '1', type: 'success', message: 'hello', duration: 500 } as ToastData]);
    fix.detectChanges();
    expect(fix.nativeElement.querySelectorAll('toast').length).toBe(1);

    // add another
    fix.componentInstance.toasts.set([
      { id: '1', type: 'success', message: 'hello', duration: 500 } as ToastData,
      { id: '2', type: 'info', message: 'two', duration: 500 } as ToastData,
    ]);
    fix.detectChanges();
    expect(fix.nativeElement.querySelectorAll('toast').length).toBe(2);
  });

  it('host renders a .toast-container wrapper div', () => {
    const fix = TestBed.createComponent(ToastContainerComponent);
    fix.detectChanges();
    expect(fix.nativeElement.querySelector('.toast-container')).not.toBeNull();
  });

  it('tracks toasts by id so signal replacement reuses DOM nodes for stable ids', () => {
    const fix = TestBed.createComponent(ToastContainerComponent);
    const first: ToastData = { id: 'stay', type: 'success', message: 'x', duration: 100 } as any;
    fix.componentInstance.toasts.set([first]);
    fix.detectChanges();
    const before = fix.nativeElement.querySelectorAll('toast')[0];

    // update array but keep same id at same position
    fix.componentInstance.toasts.set([{ ...first }]);
    fix.detectChanges();
    const after = fix.nativeElement.querySelectorAll('toast')[0];

    // why: @for track toast.id means the same DOM element is reused
    expect(before).toBe(after);
  });
  // ─── Live regions (D-027) ──────────────────────────────────────────────────

  describe('live regions', () => {
    const region = (fix: { nativeElement: HTMLElement }, kind: 'polite' | 'assertive') =>
      fix.nativeElement.querySelector(`[data-autoid="services-notify-live-${kind}"]`) as HTMLElement;

    it('renders two persistent, visually hidden regions even with no toast', () => {
      const fix = TestBed.createComponent(ToastContainerComponent);
      fix.detectChanges();
      const polite = region(fix, 'polite');
      const assertive = region(fix, 'assertive');
      expect(polite.getAttribute('aria-live')).toBe('polite');
      expect(polite.getAttribute('role')).toBe('status');
      expect(assertive.getAttribute('aria-live')).toBe('assertive');
      expect(assertive.getAttribute('role')).toBe('alert');
      for (const el of [polite, assertive]) {
        expect(el.getAttribute('aria-atomic')).toBe('true');
        expect(el.textContent?.trim()).toBe('');
        expect(el.getBoundingClientRect().width).toBeLessThanOrEqual(1);
      }
    });

    it('announces polite and assertive messages in their own region', fakeAsync(() => {
      const fix = TestBed.createComponent(ToastContainerComponent);
      fix.detectChanges();

      fix.componentInstance.announce('polite', 'Saved');
      fix.componentInstance.announce('assertive', 'Failed');
      tick(100);
      fix.detectChanges();

      expect(region(fix, 'polite').textContent?.trim()).toBe('Saved');
      expect(region(fix, 'assertive').textContent?.trim()).toBe('Failed');
    }));

    it('clears the region first so the same message is announced again', fakeAsync(() => {
      const fix = TestBed.createComponent(ToastContainerComponent);
      fix.detectChanges();
      fix.componentInstance.announce('polite', 'Saved');
      tick(100);
      fix.detectChanges();

      fix.componentInstance.announce('polite', 'Saved');
      fix.detectChanges();
      expect(region(fix, 'polite').textContent?.trim()).toBe('');
      tick(100);
      fix.detectChanges();
      expect(region(fix, 'polite').textContent?.trim()).toBe('Saved');
    }));

    it('keeps aria-live off the toasts themselves', () => {
      const fix = TestBed.createComponent(ToastContainerComponent);
      fix.componentInstance.toasts.set([{ id: 'a', type: 'error', message: 'A', duration: 1000 } as ToastData]);
      fix.detectChanges();
      expect(fix.nativeElement.querySelector('toast').hasAttribute('aria-live')).toBeFalse();
      expect(fix.nativeElement.querySelectorAll('.toast-container [aria-live]').length).toBe(0);
    });
  });
});
