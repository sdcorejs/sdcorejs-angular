import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdNotifyService } from '../notify.service';
import { ToastData } from '../notify.model';
import { ToastContainerComponent } from './toast-container.component';

describe('ToastContainerComponent', () => {
  beforeEach(() => {
    // why: SdNotifyService constructor attaches a real toast-container to body —
    // here we test the container directly, so we don't bootstrap the service.
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, ToastContainerComponent],
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
});
