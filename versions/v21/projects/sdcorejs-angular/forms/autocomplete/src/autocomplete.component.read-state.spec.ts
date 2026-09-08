import { TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Observable, Subject, of, throwError } from 'rxjs';
import { SdAutocomplete } from './autocomplete.component';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('SdAutocomplete read requests', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SdAutocomplete, NoopAnimationsModule] }));
  function setup(loader: jasmine.Spy, value?: string) {
    const f = TestBed.createComponent(SdAutocomplete);
    f.componentRef.setInput('items', loader);
    f.componentRef.setInput('valueField', 'id');
    f.componentRef.setInput('displayField', 'name');
    if (value !== undefined) f.componentRef.setInput('model', value);
    const comp = f.componentInstance;
    const changes = jasmine.createSpy('changes');
    comp.sdReadStateChange.subscribe(changes);
    f.detectChanges();
    tick(600);
    f.detectChanges();
    return { f, comp, changes };
  }

  for (const failure of ['promise', 'observable', 'sync']) {
    for (const result of [[], [{ id: '1', name: 'Resolved' }]]) {
      it(`${failure} failure is retryable once to ${result.length ? 'ready' : 'empty'} without caching the error`, fakeAsync(() => {
        const error = new Error('private');
        const loader = jasmine.createSpy('loader').and.callFake(() => {
          if (failure === 'promise') return Promise.reject(error);
          if (failure === 'observable') return throwError(() => error);
          throw error;
        });
        const { f, comp, changes } = setup(loader);
        expect(comp.readState().status).toBe('error');
        expect(comp.readState().channels.SEARCH).toEqual({ status: 'error', operation: 'SEARCH', error });
        expect(comp.loading()).toBeFalse();
        const pending = deferred<typeof result>();
        loader.and.returnValue(pending.promise);
        const count = loader.calls.count();
        comp.retryRead();
        comp.retryRead();
        expect(loader.calls.count()).toBe(count + 1);
        expect(loader.calls.mostRecent().args).toEqual([{ type: 'SEARCH', searchText: '' }]);
        expect(comp.loading()).toBeTrue();
        pending.resolve(result);
        flushMicrotasks();
        f.detectChanges();
        expect(comp.readState().status).toBe(result.length ? 'ready' : 'empty');
        expect(comp.loading()).toBeFalse();
        expect(comp.filteredItems()).toEqual(result);
        expect(changes).toHaveBeenCalled();
        f.destroy();
      }));
    }
  }

  it('shows only loading while SEARCH is pending over a VALUE error', fakeAsync(() => {
    const pending = deferred<unknown[]>();
    const loader = jasmine
      .createSpy('loader')
      .and.callFake(req => (req.type === 'VALUE' ? Promise.reject('value error') : pending.promise));
    const { f, comp } = setup(loader, '1');
    comp.autocompleteTrigger()!.openPanel();
    f.detectChanges();
    const panel = comp.autocompleteTrigger()!.autocomplete.panel!.nativeElement as HTMLElement;
    expect(comp.readState().channels.VALUE.status).toBe('error');
    expect(comp.readState().channels.SEARCH.status).toBe('loading');
    expect(panel.querySelector('mat-spinner')).not.toBeNull();
    expect(panel.querySelector('.sd-read-state-region')).toBeNull();
    pending.resolve([]);
    flushMicrotasks();
    f.detectChanges();
    expect(comp.loading()).toBeFalse();
    expect(comp.readState().channels.VALUE.status).toBe('error');
    expect(panel.querySelector('mat-spinner')).toBeNull();
    expect(panel.querySelector('.sd-read-state-region')).not.toBeNull();
    expect(comp.valueModel()).toBe('1');
    f.destroy();
  }));

  it('hides a SEARCH error during VALUE retry and restores it after loading', fakeAsync(() => {
    const loader = jasmine.createSpy('loader').and.callFake(() => Promise.reject('failed'));
    const { f, comp } = setup(loader, '1');
    comp.autocompleteTrigger()!.openPanel();
    f.detectChanges();
    const pending = deferred<unknown[]>();
    loader.and.returnValue(pending.promise);
    comp.retryRead();
    f.detectChanges();
    const panel = comp.autocompleteTrigger()!.autocomplete.panel!.nativeElement as HTMLElement;
    expect(comp.readState().channels.VALUE.status).toBe('loading');
    expect(comp.readState().channels.SEARCH.status).toBe('error');
    expect(comp.loading()).toBeTrue();
    expect(panel.querySelector('.sd-read-state-region')).toBeNull();
    pending.resolve([{ id: '1', name: 'Selected' }]);
    flushMicrotasks();
    f.detectChanges();
    expect(comp.loading()).toBeFalse();
    expect(comp.readState().channels.SEARCH.status).toBe('error');
    expect(panel.querySelector('mat-spinner')).toBeNull();
    expect(panel.querySelector('.sd-read-state-region')).not.toBeNull();
    expect(comp.valueModel()).toBe('1');
    f.destroy();
  }));

  it('centers errors below retained autocomplete results without overflowing a narrow panel', fakeAsync(() => {
    const loader = jasmine
      .createSpy('loader')
      .and.callFake(req => (req.type === 'VALUE' ? Promise.reject('failed') : Promise.resolve([{ id: '2', name: 'Available item' }])));
    const { f, comp } = setup(loader, '1');
    comp.autocompleteTrigger()!.openPanel();
    f.detectChanges();
    const panel = comp.autocompleteTrigger()!.autocomplete.panel!.nativeElement as HTMLElement;
    panel.style.width = '180px';
    const option = panel.querySelector<HTMLElement>('mat-option:not(.sd-read-state-anchor)')!;
    const state = panel.querySelector<HTMLElement>('.sd-data-state')!;
    expect(option.compareDocumentPosition(state) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(getComputedStyle(state).textAlign).toBe('center');
    expect(state.scrollWidth).toBeLessThanOrEqual(panel.clientWidth);
    expect(comp.valueModel()).toBe('1');
    f.destroy();
  }));

  it('caches successful empty responses and keeps search alive after error', fakeAsync(() => {
    const loader = jasmine.createSpy('loader').and.returnValue(of([]));
    const { f, comp } = setup(loader);
    comp.inputControl.setValue('empty');
    tick(600);
    const count = loader.calls.count();
    comp.inputControl.setValue('empty');
    tick(600);
    expect(loader.calls.count()).toBe(count);
    loader.and.returnValue(throwError(() => 'failed'));
    comp.inputControl.setValue('fail');
    tick(600);
    expect(comp.readState().status).toBe('error');
    loader.and.returnValue(of([{ id: '2', name: 'Next' }]));
    comp.inputControl.setValue('next');
    tick(600);
    expect(comp.readState().status).toBe('ready');
    f.destroy();
  }));

  it('retains an error and retry when focus repeats the same search text', fakeAsync(() => {
    const loader = jasmine.createSpy('loader').and.returnValue(throwError(() => 'failed'));
    const { f, comp } = setup(loader);
    const count = loader.calls.count();
    comp.onFocus();
    tick(600);
    expect(loader.calls.count()).toBe(count);
    expect(comp.readState().status).toBe('error');
    loader.and.returnValue(of([]));
    comp.retryRead();
    expect(loader.calls.count()).toBe(count + 1);
    expect(comp.readState().status).toBe('empty');
    f.destroy();
  }));

  it('cancels a queued same-text debounce when explicit retry starts', fakeAsync(() => {
    const loader = jasmine.createSpy('loader').and.returnValue(throwError(() => 'failed'));
    const { f, comp } = setup(loader);
    comp.inputControl.setValue('query');
    tick(600);
    comp.inputControl.setValue('query');
    const pending = deferred<unknown[]>();
    loader.and.returnValue(pending.promise);
    const count = loader.calls.count();
    comp.retryRead();
    tick(600);
    expect(loader.calls.count()).toBe(count + 1);
    expect(comp.loading()).toBeTrue();
    pending.resolve([]);
    flushMicrotasks();
    expect(comp.readState().status).toBe('empty');
    expect(comp.loading()).toBeFalse();
    f.destroy();
  }));

  for (const reset of ['blur', 'select']) {
    it(`clears pending SEARCH loading on ${reset} without accepting its result`, fakeAsync(() => {
      const pending = deferred<unknown[]>();
      const loader = jasmine.createSpy('loader').and.returnValue(of([]));
      const { f, comp } = setup(loader);
      loader.and.returnValue(pending.promise);
      comp.inputControl.setValue('pending');
      tick(600);
      expect(comp.loading()).toBeTrue();
      if (reset === 'blur') comp.onBlur();
      else comp.onSelect({ id: '1', name: 'Chosen' });
      expect(comp.loading()).toBeFalse();
      pending.resolve([{ id: 'old', name: 'Stale' }]);
      flushMicrotasks();
      expect(comp.readState().channels.SEARCH.status).toBe('idle');
      expect(comp.filteredItems()).toEqual([]);
      f.destroy();
    }));
  }

  it('offers retry from input Tab without changing text, selecting or closing the panel', fakeAsync(() => {
    const loader = jasmine.createSpy('loader').and.returnValue(throwError(() => 'failed'));
    const { f, comp } = setup(loader);
    const input = comp.inputRef()!.nativeElement;
    input.focus();
    comp.inputControl.setValue('keep this query');
    tick(600);
    f.detectChanges();
    comp.autocompleteTrigger()!.openPanel();
    f.detectChanges();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, bubbles: true, cancelable: true }));
    const button = document.querySelector<HTMLButtonElement>('.sd-autocomplete-panel .sd-read-state-region button')!;
    expect(document.activeElement).toBe(button);
    expect(comp.inputControl.value).toBe('keep this query');
    expect(comp.autocompleteTrigger()!.panelOpen).toBeTrue();
    const count = loader.calls.count();
    const pending = deferred<unknown[]>();
    loader.and.returnValue(pending.promise);
    button?.click();
    f.detectChanges();
    expect(loader.calls.count()).toBe(count + 1);
    expect(loader.calls.mostRecent().args).toEqual([{ type: 'SEARCH', searchText: 'keep this query' }]);
    expect(comp.valueModel()).toBeUndefined();
    expect(document.activeElement).toBe(input);
    pending.resolve([]);
    flushMicrotasks();
    f.destroy();
  }));

  it('invalidates retries immediately when text or loader changes', fakeAsync(() => {
    const loader = jasmine.createSpy('loader').and.returnValue(throwError(() => 'failed'));
    const { f, comp } = setup(loader);
    const count = loader.calls.count();
    comp.inputControl.setValue('new');
    comp.retryRead();
    expect(loader.calls.count()).toBe(count);
    tick(600);
    const replacement = jasmine.createSpy('replacement').and.returnValue(of([]));
    f.componentRef.setInput('items', replacement);
    comp.retryRead();
    expect(loader.calls.count()).toBe(count + 1);
    f.detectChanges();
    tick(600);
    expect(comp.readState().status).toBe('empty');
    f.destroy();
  }));

  for (const staleFails of [true, false]) {
    it(`ignores replaced Promise ${staleFails ? 'error' : 'success'} and retains current loading`, fakeAsync(() => {
      const old = deferred<unknown[]>();
      const latest = deferred<unknown[]>();
      const loader = jasmine.createSpy('loader').and.returnValues(old.promise, latest.promise);
      const { f, comp } = setup(loader);
      comp.inputControl.setValue('new');
      tick(600);
      if (staleFails) old.reject('stale');
      else old.resolve([{ id: 'old' }]);
      flushMicrotasks();
      expect(comp.loading()).toBeTrue();
      expect(comp.readState().status).toBe('loading');
      latest.resolve([{ id: 'new', name: 'Newest' }]);
      flushMicrotasks();
      expect(comp.loading()).toBeFalse();
      expect(comp.filteredItems()).toEqual([{ id: 'new', name: 'Newest' }]);
      f.destroy();
    }));
  }

  it('does not surface a stale error after the newest request succeeds or after destroy', fakeAsync(() => {
    const old = deferred<unknown[]>();
    const loader = jasmine.createSpy('loader').and.returnValue(old.promise);
    const { f, comp, changes } = setup(loader);
    loader.and.returnValue(of([{ id: 'new', name: 'Newest' }]));
    comp.inputControl.setValue('new');
    tick(600);
    old.reject('stale');
    flushMicrotasks();
    expect(comp.readState().status).toBe('ready');
    const pending = deferred<unknown[]>();
    loader.and.returnValue(pending.promise);
    comp.inputControl.setValue('pending');
    tick(600);
    f.destroy();
    const count = changes.calls.count();
    pending.reject('after destroy');
    flushMicrotasks();
    expect(changes.calls.count()).toBe(count);
  }));

  it('shows no empty UI before interaction or while typing and preserves the model across failure', fakeAsync(() => {
    const loader = jasmine.createSpy('loader').and.returnValue(of([]));
    const { f, comp } = setup(loader);
    comp.autocompleteTrigger()!.openPanel();
    f.detectChanges();
    expect(document.querySelector('.sd-autocomplete-panel [data-state="empty"]')).toBeNull();
    f.componentRef.setInput('model', '1');
    f.detectChanges();
    tick(600);
    const change = jasmine.createSpy('change');
    comp.sdChange.subscribe(change);
    loader.and.returnValue(throwError(() => 'failed'));
    comp.inputControl.setValue('query');
    f.detectChanges();
    expect(document.querySelector('.sd-autocomplete-panel [data-state="empty"]')).toBeNull();
    tick(600);
    comp.autocompleteTrigger()!.openPanel();
    f.detectChanges();
    expect(document.querySelector('.sd-autocomplete-panel [data-state="error"]')).not.toBeNull();
    expect(comp.valueModel()).toBe('1');
    expect(change).not.toHaveBeenCalled();
    f.destroy();
  }));

  it('unsubscribes replaced Observables without disabling the current spinner', fakeAsync(() => {
    const values = new Subject<unknown[]>();
    const cleanup = jasmine.createSpy('cleanup');
    const loader = jasmine.createSpy('loader').and.returnValues(new Observable(() => cleanup), values);
    const { f, comp } = setup(loader);
    comp.inputControl.setValue('new');
    tick(600);
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(comp.loading()).toBeTrue();
    values.next([]);
    values.complete();
    expect(comp.loading()).toBeFalse();
    f.destroy();
  }));
});
