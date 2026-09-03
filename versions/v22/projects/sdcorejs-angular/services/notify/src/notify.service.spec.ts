import { ApplicationRef, EnvironmentInjector, createEnvironmentInjector } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdNotifyService } from './notify.service';

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('SdNotifyService', () => {
  let service: SdNotifyService;
  let appendChildSpy: jasmine.Spy;

  beforeEach(() => {
    // Prevent the toast container div from actually being added to the DOM.
    // We spy on body.appendChild BEFORE the service is constructed.
    appendChildSpy = spyOn(document.body, 'appendChild').and.stub();

    TestBed.configureTestingModule({
      providers: [
        SdNotifyService,
        {
          provide: I18nService,
          useValue: {
            t: (key: string) =>
              ({
                'core.notify.type.error': 'Error',
                'core.notify.type.warning': 'Warning',
              })[key] ?? key,
          },
        },
      ],
    });

    // Spy on ApplicationRef.attachView so the fake hostView is never
    // registered with the real change-detection machinery.
    const appRef = TestBed.inject(ApplicationRef);
    spyOn(appRef, 'attachView').and.stub();

    service = TestBed.inject(SdNotifyService);
  });

  afterEach(() => {
    // Cancel any pending debounce timers so they don't bleed into the next test.
    service.clearAll();
  });

  // ─── 1. Instantiation ───────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should append the toast container to body during construction', () => {
    expect(appendChildSpy).toHaveBeenCalled();
  });

  it('should initialise toasts signal as empty array', () => {
    expect(service.toasts()).toEqual([]);
  });

  // ─── 2. success() ───────────────────────────────────────────────────────────

  it('success() should add one toast of type "success" immediately', () => {
    service.success('Saved successfully');
    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].message).toBe('Saved successfully');
  });

  it('success() should use default duration 3000 ms when no option given', () => {
    service.success('ok');
    expect(service.toasts()[0].duration).toBe(3000);
  });

  it('success() should respect custom duration from option', () => {
    service.success('ok', { duration: 8000 });
    expect(service.toasts()[0].duration).toBe(8000);
  });

  it('success() should pass title through to the toast', () => {
    service.success('ok', { title: 'Done' });
    expect(service.toasts()[0].title).toBe('Done');
  });

  // ─── 3. info() ──────────────────────────────────────────────────────────────

  it('info() should add one toast of type "info" immediately', () => {
    service.info('File uploaded');
    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('info');
    expect(toasts[0].message).toBe('File uploaded');
  });

  it('info() should use default duration 3000 ms', () => {
    service.info('hello');
    expect(service.toasts()[0].duration).toBe(3000);
  });

  // ─── 4. error() — buffered ──────────────────────────────────────────────────

  it('error() should flush a single buffered message after 500 ms debounce', fakeAsync(() => {
    service.error('Something went wrong');
    expect(service.toasts().length).toBe(0); // not yet flushed

    tick(500);

    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('error');
    expect(toasts[0].message).toBe('Something went wrong');
  }));

  it('error() should use default duration 5000 ms for buffered toasts', fakeAsync(() => {
    service.error('oops');
    tick(500);
    expect(service.toasts()[0].duration).toBe(5000);
  }));

  it('error() should group multiple messages into one toast with count in title', fakeAsync(() => {
    service.error('Error A');
    service.error('Error B');
    tick(500);

    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].title).toBe('Error (2)');
    expect(Array.isArray(toasts[0].message)).toBeTrue();
    expect((toasts[0].message as string[]).length).toBe(2);
  }));

  it('error() should dedup identical messages in the buffer', fakeAsync(() => {
    service.error('Duplicate error');
    service.error('Duplicate error');
    tick(500);

    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    // deduped → single string; title has no count suffix
    expect(toasts[0].message).toBe('Duplicate error');
    expect(toasts[0].title).toBe('Error');
  }));

  it('error() should reset the debounce timer on each new call', fakeAsync(() => {
    service.error('First');
    tick(400); // nearly flushed
    service.error('Second'); // resets the timer
    tick(400); // original timer would have fired — but was reset
    expect(service.toasts().length).toBe(0); // still debouncing

    tick(100); // now 500 ms since last call
    expect(service.toasts().length).toBe(1);
  }));

  // ─── 5. warning() — buffered ────────────────────────────────────────────────

  it('warning() should flush a single buffered message after 500 ms debounce', fakeAsync(() => {
    service.warning('Low disk space');
    tick(500);

    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('warning');
  }));

  it('warning() with array input should include all messages', fakeAsync(() => {
    service.warning(['Warn A', 'Warn B', 'Warn C']);
    tick(500);

    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].title).toBe('Warning (3)');
    expect(Array.isArray(toasts[0].message)).toBeTrue();
  }));

  // ─── 6. remove() ────────────────────────────────────────────────────────────

  it('remove() should delete a toast by its id', () => {
    service.success('A');
    service.success('B');
    // Newest is at index 0 (B), so index 1 is A
    const id = service.toasts()[1].id;
    service.remove(id);

    expect(service.toasts().every(t => t.id !== id)).toBeTrue();
    expect(service.toasts().length).toBe(1);
  });

  it('remove() with unknown id should leave the list unchanged', () => {
    service.success('A');
    service.remove('non-existent-id');
    expect(service.toasts().length).toBe(1);
  });

  // ─── 7. clearAll() ──────────────────────────────────────────────────────────

  it('clearAll() should empty the toasts array', () => {
    service.success('A');
    service.info('B');
    service.clearAll();
    expect(service.toasts()).toEqual([]);
  });

  it('clearAll() should cancel pending buffered timers', fakeAsync(() => {
    service.error('pending error');
    service.clearAll(); // cancels the timer
    tick(500); // timer fires but buffer was already cleared → no-op

    expect(service.toasts().length).toBe(0);
  }));

  // ─── 8. clearByType() ───────────────────────────────────────────────────────

  it('clearByType() should remove only toasts of the given type', () => {
    service.success('keep this');
    service.info('remove this');
    service.clearByType('info');

    const toasts = service.toasts();
    expect(toasts.every(t => t.type !== 'info')).toBeTrue();
    expect(toasts.some(t => t.type === 'success')).toBeTrue();
  });

  // ─── 9. MAX_TOASTS cap ──────────────────────────────────────────────────────

  it('should cap visible toasts at 5 (MAX_TOASTS)', () => {
    for (let i = 0; i < 7; i++) {
      service.success(`Toast ${i}`);
    }
    expect(service.toasts().length).toBe(5);
  });

  it('newest toast should be first (prepended) when cap is exceeded', () => {
    for (let i = 0; i < 6; i++) {
      service.success(`Toast ${i}`);
    }
    expect(service.toasts()[0].message).toBe('Toast 5');
  });

  // ─── 10. actionLabel + onAction passthrough ─────────────────────────────────

  it('should pass actionLabel and onAction through to the ToastData', () => {
    const handler = jasmine.createSpy('onAction');
    service.success('With action', { actionLabel: 'Undo', onAction: handler });

    const toast = service.toasts()[0];
    expect(toast.actionLabel).toBe('Undo');
    expect(toast.onAction).toBe(handler);
  });

  // ─── 11. toasts signal reactivity ───────────────────────────────────────────

  it('toasts signal should reflect changes reactively', () => {
    expect(service.toasts().length).toBe(0);
    service.success('reactive');
    expect(service.toasts().length).toBe(1);
    service.clearAll();
    expect(service.toasts().length).toBe(0);
  });
});

// ─── Teardown (DestroyRef) ────────────────────────────────────────────────────
// why: SdNotifyService là providedIn:'root' nhưng root injector VẪN bị destroy (TestBed reset,
// mỗi request khi SSR, micro-frontend unmount). Các spec dưới đây chạy service trong một
// EnvironmentInjector con để destroy được tất định mà không phải tháo cả TestBed.

describe('SdNotifyService teardown', () => {
  let owned: EnvironmentInjector[] = [];

  beforeEach(() => {
    owned = [];
    TestBed.configureTestingModule({
      providers: [{ provide: I18nService, useValue: { t: (key: string) => key } }],
    });
  });

  afterEach(() => {
    // Dọn rác nếu một spec fail trước khi kịp destroy() — view đang attach vào
    // ApplicationRef của TestBed sẽ bám sang spec kế tiếp nếu bỏ qua bước này.
    owned.forEach(injector => injector.destroy());
    toastContainers().forEach(node => node.remove());
  });

  function createIsolatedService(): { service: SdNotifyService; destroy: () => void } {
    const injector = createEnvironmentInjector([SdNotifyService], TestBed.inject(EnvironmentInjector));
    owned.push(injector);
    return {
      service: injector.get(SdNotifyService),
      destroy: () => {
        injector.destroy();
        owned = owned.filter(item => item !== injector);
      },
    };
  }

  function toastContainers(): Element[] {
    return Array.from(document.body.querySelectorAll('toast-container'));
  }

  it('removes the toast container node from <body> when the owning injector is destroyed', () => {
    const before = toastContainers().length;
    const { destroy } = createIsolatedService();

    const created = toastContainers();
    expect(created.length).toBe(before + 1);
    const container = created[created.length - 1];
    expect(document.body.contains(container)).toBeTrue();

    destroy();

    expect(document.body.contains(container)).toBeFalse();
    expect(toastContainers().length).toBe(before);
  });

  it('detaches the container view from ApplicationRef on destroy', () => {
    const appRef = TestBed.inject(ApplicationRef);
    const detachSpy = spyOn(appRef, 'detachView').and.callThrough();
    const { destroy } = createIsolatedService();

    expect(detachSpy).not.toHaveBeenCalled();
    destroy();
    expect(detachSpy).toHaveBeenCalledTimes(1);
  });

  it('cancels pending debounce timers so a buffered flush cannot write to a destroyed service', fakeAsync(() => {
    const { service, destroy } = createIsolatedService();

    service.error('late error');
    expect(service.toasts().length).toBe(0);

    destroy();
    tick(500);

    expect(service.toasts().length).toBe(0);
  }));

  // why: 3 spec trên chạy trong EnvironmentInjector con nên appRef VẪN sống — chúng chỉ đi qua
  // nhánh `!this.appRef.destroyed`. Nhánh CÒN LẠI mới là nhánh chạy trên teardown root thật
  // (SSR mỗi request, micro-frontend unmount, TestBed reset): hook destroy của service chạy SAU
  // ApplicationRef.destroy(), lúc đó detachView chỉ log NG0406 nên bị bỏ qua cùng componentRef
  // .destroy(). Không có spec nào chạm vào nó thì "chỉ detach khi appRef còn sống" là niềm tin,
  // không phải sự thật đã kiểm chứng. Mô phỏng bằng cách ép getter `destroyed` trả true.
  it('skips detachView when ApplicationRef is already destroyed, but still removes the DOM node', () => {
    const appRef = TestBed.inject(ApplicationRef);
    const before = toastContainers().length;
    const { destroy } = createIsolatedService();

    const created = toastContainers();
    expect(created.length).toBe(before + 1);
    const container = created[created.length - 1];

    const detachSpy = spyOn(appRef, 'detachView').and.callThrough();
    spyOnProperty(appRef, 'destroyed', 'get').and.returnValue(true);

    expect(() => destroy()).not.toThrow();

    expect(detachSpy).not.toHaveBeenCalled();
    expect(document.body.contains(container)).toBeFalse();
    expect(toastContainers().length).toBe(before);
  });

  it('still stops buffered flushes when ApplicationRef is already destroyed', fakeAsync(() => {
    const appRef = TestBed.inject(ApplicationRef);
    const { service, destroy } = createIsolatedService();

    service.error('late error');
    spyOnProperty(appRef, 'destroyed', 'get').and.returnValue(true);

    destroy();
    tick(500);

    expect(service.toasts().length).toBe(0);
  }));
});
