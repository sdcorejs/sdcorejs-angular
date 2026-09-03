import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SdNotifyService } from '../../notify.service';
import { ToastData } from '../../notify.model';
import { ToastComponent } from './toast.component';

const TOAST_EXIT_ANIMATION_MS = 200;

function makeData(over: Partial<ToastData> = {}): ToastData {
  return {
    id: 'tid',
    type: 'success',
    message: 'hello',
    duration: 1000,
    ...over,
  };
}

describe('ToastComponent', () => {
  let fix: ComponentFixture<ToastComponent>;
  let notify: jasmine.SpyObj<SdNotifyService>;

  beforeEach(() => {
    notify = jasmine.createSpyObj<SdNotifyService>('SdNotifyService', ['remove']);

    TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [{ provide: SdNotifyService, useValue: notify }],
    });

    fix = TestBed.createComponent(ToastComponent);
  });

  function init(data: ToastData) {
    fix.componentRef.setInput('data', data);
    fix.detectChanges();
  }

  it('creates', () => {
    init(makeData());
    expect(fix.componentInstance).toBeTruthy();
  });

  // ─── E2E data-* attributes (read by sd-autoid-inspector) ──────────────────

  it('host exposes data-autoid = services-notify-toast-<type>', () => {
    init(makeData({ type: 'success' }));
    expect(fix.nativeElement.getAttribute('data-autoid')).toBe('services-notify-toast-success');
  });

  it('host exposes data-type and a type-scoped data-autoid', () => {
    init(makeData({ type: 'error' }));
    expect(fix.nativeElement.getAttribute('data-type')).toBe('error');
    expect(fix.nativeElement.getAttribute('data-autoid')).toBe('services-notify-toast-error');
  });

  it('host exposes the custom title via data-title', () => {
    init(makeData({ title: 'Đã lưu' }));
    expect(fix.nativeElement.getAttribute('data-title')).toBe('Đã lưu');
  });

  it('host exposes data-message = the string message', () => {
    init(makeData({ message: 'hello' }));
    expect(fix.nativeElement.getAttribute('data-message')).toBe('hello');
  });

  it('host joins an array message into data-message with " | "', () => {
    init(makeData({ message: ['a', 'b'] }));
    expect(fix.nativeElement.getAttribute('data-message')).toBe('a | b');
  });

  // ─── icon / type rendering ────────────────────────────────────────────────

  it('renders success icon/colour classes when type=success', () => {
    init(makeData({ type: 'success' }));
    expect(fix.nativeElement.querySelector('.sd-toast__bar.bg-success')).not.toBeNull();
    expect(fix.nativeElement.querySelector('.sd-toast__icon.text-success')).not.toBeNull();
  });

  it('renders info colour classes when type=info', () => {
    init(makeData({ type: 'info' }));
    expect(fix.nativeElement.querySelector('.sd-toast__bar.bg-info')).not.toBeNull();
    expect(fix.nativeElement.querySelector('.sd-toast__icon.text-info')).not.toBeNull();
  });

  it('renders warning colour classes when type=warning', () => {
    init(makeData({ type: 'warning' }));
    expect(fix.nativeElement.querySelector('.sd-toast__bar.bg-warning')).not.toBeNull();
  });

  it('renders error colour classes when type=error', () => {
    init(makeData({ type: 'error' }));
    expect(fix.nativeElement.querySelector('.sd-toast__bar.bg-error')).not.toBeNull();
  });

  it('renders an svg icon for each type', () => {
    init(makeData({ type: 'success' }));
    expect(fix.nativeElement.querySelector('.sd-toast__icon svg')).not.toBeNull();
  });

  // ─── title ────────────────────────────────────────────────────────────────

  it('renders custom title when provided', () => {
    init(makeData({ title: 'My Title' }));
    const titleEl = fix.nativeElement.querySelector('.sd-toast__title');
    expect(titleEl.textContent.trim()).toBe('My Title');
  });

  // ─── single message body ──────────────────────────────────────────────────

  it('renders a single message in the body', () => {
    init(makeData({ message: 'just one' }));
    const body = fix.nativeElement.querySelector('.sd-toast__body');
    expect(body.textContent).toContain('just one');
  });

  it('isMultiMessage is false when message is a string', () => {
    init(makeData({ message: 'x' }));
    expect(fix.componentInstance.isMultiMessage).toBeFalse();
  });

  // ─── multi-message body ───────────────────────────────────────────────────

  it('isMultiMessage is true when message is an array', () => {
    init(makeData({ message: ['a', 'b'] }));
    expect(fix.componentInstance.isMultiMessage).toBeTrue();
  });

  it('renders a <ul> with one <li> per message when multi', () => {
    init(makeData({ message: ['a', 'b'] }));
    const items = fix.nativeElement.querySelectorAll('.msg-list li');
    expect(items.length).toBe(2);
  });

  it('displayMessages slices to MAX_SHOW (2) when collapsed', () => {
    init(makeData({ message: ['a', 'b', 'c', 'd'] }));
    expect(fix.componentInstance.displayMessages.length).toBe(2);
    expect(fix.componentInstance.hasMore).toBeTrue();
    expect(fix.componentInstance.restCount).toBe(2);
  });

  it('toggleExpand expands then collapses displayMessages', () => {
    init(makeData({ message: ['a', 'b', 'c', 'd'] }));
    expect(fix.componentInstance.isExpanded()).toBeFalse();
    fix.componentInstance.toggleExpand();
    expect(fix.componentInstance.isExpanded()).toBeTrue();
    expect(fix.componentInstance.displayMessages.length).toBe(4);
    fix.componentInstance.toggleExpand();
    expect(fix.componentInstance.isExpanded()).toBeFalse();
    expect(fix.componentInstance.displayMessages.length).toBe(2);
  });

  it('renders show-more / show-less toggle button only when hasMore', () => {
    init(makeData({ message: ['a', 'b'] }));
    expect(fix.nativeElement.querySelector('.toggle-more')).toBeNull();
    // now with 3 messages
    fix.componentRef.setInput('data', makeData({ message: ['a', 'b', 'c'] }));
    fix.detectChanges();
    expect(fix.nativeElement.querySelector('.toggle-more')).not.toBeNull();
  });

  it('messages getter returns the array form', () => {
    init(makeData({ message: ['x', 'y'] }));
    expect(fix.componentInstance.messages).toEqual(['x', 'y']);
  });

  // ─── message rendering: text default / sanitized HTML opt-in (XSS hardening) ──

  it('default (no html flag): renders message as ESCAPED TEXT, not HTML', () => {
    init(makeData({ message: '<b>x</b>' }));
    const body = fix.nativeElement.querySelector('.sd-toast__body');
    expect(body.querySelector('b')).toBeNull();
    expect(body.textContent).toContain('<b>x</b>');
  });

  it('html:true: renders trusted HTML (formatting element present)', () => {
    init(makeData({ message: '<b>bold</b>', html: true }));
    const body = fix.nativeElement.querySelector('.sd-toast__body');
    expect(body.querySelector('b')).not.toBeNull();
    expect(body.textContent).toContain('bold');
  });

  it('html:true: sanitizes — strips <script> + event handlers', () => {
    init(makeData({ message: '<img src="x" onerror="alert(1)"><script>alert(2)</script>ok', html: true }));
    const body = fix.nativeElement.querySelector('.sd-toast__body');
    expect(body.querySelector('script')).toBeNull();
    const img = body.querySelector('img');
    if (img) expect(img.getAttribute('onerror')).toBeNull();
    expect(body.textContent).toContain('ok');
  });

  it('multi-message default: escapes HTML in each item', () => {
    init(makeData({ message: ['<i>a</i>', 'b'] }));
    const body = fix.nativeElement.querySelector('.sd-toast__body');
    expect(body.querySelector('i')).toBeNull();
    expect(body.textContent).toContain('<i>a</i>');
  });

  it('multi-message html:true: renders HTML in each item', () => {
    init(makeData({ message: ['<i>a</i>', 'b'], html: true }));
    const body = fix.nativeElement.querySelector('.sd-toast__body');
    expect(body.querySelector('i')).not.toBeNull();
  });

  // ─── close / action ───────────────────────────────────────────────────────

  it('close() marks closing then removes after the CSS exit duration', fakeAsync(() => {
    init(makeData({ id: 'abc' }));
    fix.componentInstance.close();
    fix.detectChanges();

    expect(fix.nativeElement.classList.contains('sd-toast--closing')).toBeTrue();
    expect(notify.remove).not.toHaveBeenCalled();

    tick(TOAST_EXIT_ANIMATION_MS);
    expect(notify.remove).toHaveBeenCalledWith('abc');
  }));

  it('clicking the close button triggers delayed remove', fakeAsync(() => {
    init(makeData({ id: 'def' }));
    const btn = fix.nativeElement.querySelector('.sd-toast__close') as HTMLButtonElement;
    btn.click();
    tick(TOAST_EXIT_ANIMATION_MS);
    expect(notify.remove).toHaveBeenCalledWith('def');
  }));

  it('close() is idempotent while the exit animation is running', fakeAsync(() => {
    init(makeData({ id: 'same' }));
    fix.componentInstance.close();
    fix.componentInstance.close();
    tick(TOAST_EXIT_ANIMATION_MS);
    expect(notify.remove).toHaveBeenCalledOnceWith('same');
  }));

  it('renders action button when actionLabel is set; clicking invokes onAction', () => {
    const action = jasmine.createSpy('onAction');
    init(makeData({ actionLabel: 'Undo', onAction: action }));
    const btn = fix.nativeElement.querySelector('.btn-action') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    btn.click();
    expect(action).toHaveBeenCalled();
  });

  it('onActionClick is a no-op when onAction is not provided', () => {
    init(makeData({ actionLabel: 'X' }));
    expect(() => fix.componentInstance.onActionClick()).not.toThrow();
  });

  it('does not render action button when actionLabel is absent', () => {
    init(makeData());
    expect(fix.nativeElement.querySelector('.btn-action')).toBeNull();
  });

  // ─── auto-dismiss timer ───────────────────────────────────────────────────

  it('auto-dismisses after data.duration ms (calls notify.remove)', fakeAsync(() => {
    init(makeData({ duration: 1000, id: 'auto' }));
    expect(notify.remove).not.toHaveBeenCalled();
    tick(1000);
    expect(notify.remove).not.toHaveBeenCalled();
    tick(TOAST_EXIT_ANIMATION_MS);
    expect(notify.remove).toHaveBeenCalledWith('auto');
  }));

  it('pauseTimer / resumeTimer correctly pause+resume the auto-dismiss', fakeAsync(() => {
    init(makeData({ duration: 1000, id: 'pause' }));
    tick(300); // 300ms elapsed
    fix.componentInstance.pauseTimer();
    tick(2000); // would have fired but is paused
    expect(notify.remove).not.toHaveBeenCalled();
    fix.componentInstance.resumeTimer();
    // 1000 - 300 = 700 remaining
    tick(700);
    expect(notify.remove).not.toHaveBeenCalled();
    tick(TOAST_EXIT_ANIMATION_MS);
    expect(notify.remove).toHaveBeenCalledWith('pause');
  }));

  it('resumeTimer is a no-op when remaining is 0 or below', fakeAsync(() => {
    init(makeData({ duration: 100, id: 'gone' }));
    tick(100); // auto-fired
    expect(notify.remove).not.toHaveBeenCalled();
    // try to resume — should not schedule another timer (remaining drops below 0 over time but timer is null)
    fix.componentInstance.resumeTimer();
    tick(TOAST_EXIT_ANIMATION_MS);
    expect(notify.remove).toHaveBeenCalledTimes(1);
  }));

  it('ngOnDestroy clears the timer to prevent late firing', fakeAsync(() => {
    init(makeData({ duration: 5000, id: 'destroy' }));
    fix.destroy();
    tick(10000);
    expect(notify.remove).not.toHaveBeenCalled();
  }));

  it('ngOnDestroy clears a pending close animation timer', fakeAsync(() => {
    init(makeData({ duration: 5000, id: 'closing-destroy' }));
    fix.componentInstance.close();
    fix.destroy();
    tick(TOAST_EXIT_ANIMATION_MS);
    expect(notify.remove).not.toHaveBeenCalled();
  }));

  it('pauseTimer is a no-op when no timer is running', () => {
    init(makeData({ duration: 1000 }));
    fix.componentInstance.pauseTimer(); // pauses
    // calling again with no timer — must not throw
    expect(() => fix.componentInstance.pauseTimer()).not.toThrow();
  });
});
