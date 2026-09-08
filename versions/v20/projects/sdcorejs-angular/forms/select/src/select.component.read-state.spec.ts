import { TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdSelect } from './select.component';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('SdSelect read channels', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SdSelect, NoopAnimationsModule] }));

  function setup(loader: jasmine.Spy, value?: string | string[], inline = false) {
    const f = TestBed.createComponent(SdSelect);
    f.componentRef.setInput('items', loader);
    f.componentRef.setInput('valueField', 'id');
    f.componentRef.setInput('displayField', 'name');
    f.componentRef.setInput('model', value);
    f.componentRef.setInput('viewed', inline ? 'inline' : false);
    if (Array.isArray(value)) {
      f.componentRef.setInput('multiple', true);
      f.componentRef.setInput('limit', 1);
    }
    const comp = f.componentInstance;
    comp.focused.set(true);
    const changes = jasmine.createSpy('read change');
    const selection = jasmine.createSpy('selection');
    comp.sdReadStateChange.subscribe(changes);
    comp.sdChange.subscribe(selection);
    f.detectChanges();
    tick(600);
    f.detectChanges();
    return { f, comp, changes, selection };
  }

  for (const operation of ['VALUE', 'SEARCH'] as const) {
    for (const result of [[], [{ id: '1', name: 'Resolved' }]]) {
      it(`retries ${operation} exactly once to ${result.length ? 'ready' : 'empty'}`, fakeAsync(() => {
        let fail = true;
        const pending = deferred<{ id: string; name: string }[]>();
        const error = new Error('private');
        const loader = jasmine.createSpy('loader').and.callFake(req => {
          if (req.type !== operation) return Promise.resolve([]);
          return fail ? Promise.reject(error) : pending.promise;
        });
        const { f, comp, changes, selection } = setup(loader, operation === 'VALUE' ? '1' : undefined);
        expect(comp.readState().status).toBe('error');
        expect(comp.readState().operation).toBe(operation);
        expect(comp.readState().channels[operation]).toEqual({ status: 'error', operation, error });
        const before = loader.calls.allArgs().filter(([req]) => req.type === operation);
        expect(before.length).toBe(1);
        fail = false;
        comp.retryRead();
        comp.retryRead();
        expect(loader.calls.allArgs().filter(([req]) => req.type === operation).length).toBe(2);
        expect(loader.calls.mostRecent().args).toEqual(before[0]);
        pending.resolve(result);
        flushMicrotasks();
        f.detectChanges();
        expect(comp.readState().channels[operation].status).toBe(result.length ? 'ready' : 'empty');
        expect(comp.loading()).toBeFalse();
        expect(comp.valueModel()).toBe(operation === 'VALUE' ? '1' : undefined);
        expect(selection).not.toHaveBeenCalled();
        expect(changes).toHaveBeenCalled();
        f.destroy();
      }));
    }
  }

  for (const inline of [false, true]) {
    it(`shows only loading while SEARCH is pending over a VALUE error (inline=${inline})`, fakeAsync(() => {
      const pending = deferred<unknown[]>();
      const loader = jasmine
        .createSpy('loader')
        .and.callFake(req => (req.type === 'VALUE' ? Promise.reject('value error') : pending.promise));
      const { f, comp, selection } = setup(loader, '1', inline);
      comp.open();
      tick(600);
      f.detectChanges();
      const panel = comp.selectRef()!.panel.nativeElement as HTMLElement;
      expect(comp.readState().channels.VALUE.status).toBe('error');
      expect(comp.readState().channels.SEARCH.status).toBe('loading');
      expect(comp.loading()).toBeTrue();
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
      expect(selection).not.toHaveBeenCalled();
      f.destroy();
    }));
  }

  it('hides a SEARCH error during VALUE retry and restores the remaining error afterward', fakeAsync(() => {
    const loader = jasmine.createSpy('loader').and.callFake(() => Promise.reject('failed'));
    const { f, comp } = setup(loader, '1');
    comp.open();
    tick(600);
    f.detectChanges();
    const pending = deferred<unknown[]>();
    loader.and.returnValue(pending.promise);
    comp.retryRead();
    f.detectChanges();
    const panel = comp.selectRef()!.panel.nativeElement as HTMLElement;
    expect(comp.readState().channels.VALUE.status).toBe('loading');
    expect(comp.readState().channels.SEARCH.status).toBe('error');
    expect(panel.querySelector('mat-spinner')).not.toBeNull();
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

  it('keeps VALUE error while SEARCH succeeds and panel opens', fakeAsync(() => {
    const loader = jasmine
      .createSpy('loader')
      .and.callFake(req => (req.type === 'VALUE' ? Promise.reject('value error') : Promise.resolve([{ id: '2', name: 'Other' }])));
    const { f, comp } = setup(loader, '1');
    comp.open();
    tick(600);
    f.detectChanges();
    expect(comp.readState().operation).toBe('VALUE');
    expect(comp.readState().status).toBe('error');
    expect(comp.readState().channels.SEARCH.status).toBe('ready');
    expect(document.querySelector('.sd-select-panel sd-data-state [role="alert"]')).not.toBeNull();
    expect(loader.calls.allArgs().filter(([req]) => req.type === 'VALUE').length).toBe(1);
    f.destroy();
  }));

  it('centers a narrow error panel below retained multiple selections', fakeAsync(() => {
    const loader = jasmine
      .createSpy('loader')
      .and.callFake(req => (req.type === 'VALUE' ? Promise.resolve([{ id: '1', name: 'Selected item' }]) : Promise.reject('failed')));
    const { f, comp, selection } = setup(loader, ['1']);
    f.componentRef.setInput('minWidthPanel', '180px');
    f.detectChanges();
    comp.open();
    tick(600);
    f.detectChanges();
    const panel = comp.selectRef()!.panel.nativeElement as HTMLElement;
    const option = panel.querySelector<HTMLElement>('mat-option:not(.sd-read-state-anchor)')!;
    const state = panel.querySelector<HTMLElement>('.sd-data-state')!;
    expect(option.compareDocumentPosition(state) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(getComputedStyle(state).textAlign).toBe('center');
    expect(state.scrollWidth).toBeLessThanOrEqual(panel.clientWidth);
    expect(comp.valueModel()).toEqual(['1']);
    expect(selection).not.toHaveBeenCalled();
    f.destroy();
  }));

  it('retains all selected items plus the unselected limit after SEARCH retry', fakeAsync(() => {
    const selected = [
      { id: '1', name: 'One' },
      { id: '2', name: 'Two' },
    ];
    const loader = jasmine
      .createSpy('loader')
      .and.callFake(req => (req.type === 'VALUE' ? Promise.resolve(selected) : Promise.reject('failed')));
    const { f, comp } = setup(loader, ['1', '2']);
    loader.and.returnValue(
      Promise.resolve([
        { id: '3', name: 'Three' },
        { id: '4', name: 'Four' },
      ])
    );
    comp.retryRead();
    flushMicrotasks();
    expect(comp.filteredItems().map(item => comp.itemValue(item))).toEqual(['1', '2', '3']);
    expect(comp.valueModel()).toEqual(['1', '2']);
    f.destroy();
  }));

  it('ignores an old SEARCH continuation after replacing the loader', fakeAsync(() => {
    const old = deferred<unknown[]>();
    const loader = jasmine
      .createSpy('old')
      .and.callFake(req => (req.type === 'VALUE' ? Promise.resolve([{ id: '1', name: 'Old' }]) : old.promise));
    const { f, comp } = setup(loader, '1');
    const replacement = jasmine.createSpy('new').and.returnValue(Promise.resolve([{ id: '1', name: 'Newest' }]));
    f.componentRef.setInput('items', replacement);
    f.detectChanges();
    tick(600);
    old.resolve([{ id: '2', name: 'Stale' }]);
    flushMicrotasks();
    expect(comp.readState().channels.VALUE.status).toBe('ready');
    expect(comp.loading()).toBeFalse();
    expect(comp.display()).toBe('Newest');
    expect(loader.calls.count()).toBe(2);
    f.destroy();
  }));

  it('retries each simultaneous error on its own channel without clearing the other', fakeAsync(() => {
    const loader = jasmine.createSpy('loader').and.callFake(req => Promise.reject(req.type));
    const { f, comp } = setup(loader, '1');
    expect(comp.readState().channels.VALUE.status).toBe('error');
    expect(comp.readState().channels.SEARCH.status).toBe('error');
    loader.and.returnValue(Promise.resolve([{ id: '1', name: 'Resolved' }]));
    comp.retryRead();
    expect(loader.calls.mostRecent().args[0].type).toBe('VALUE');
    flushMicrotasks();
    expect(comp.readState().operation).toBe('SEARCH');
    expect(comp.readState().status).toBe('error');
    comp.retryRead();
    expect(loader.calls.mostRecent().args[0].type).toBe('SEARCH');
    flushMicrotasks();
    expect(comp.readState().channels.VALUE.status).toBe('ready');
    expect(comp.readState().channels.SEARCH.status).toBe('ready');
    expect(comp.valueModel()).toBe('1');
    f.destroy();
  }));

  for (const staleFails of [true, false]) {
    it(`ignores stale SEARCH ${staleFails ? 'error' : 'success'} after the latest search`, fakeAsync(() => {
      const old = deferred<unknown[]>();
      const loader = jasmine.createSpy('loader').and.returnValue(old.promise);
      const { f, comp } = setup(loader);
      loader.and.returnValue(Promise.resolve([{ id: 'new', name: 'Newest' }]));
      comp.inputControl.setValue('new');
      tick(600);
      if (staleFails) old.reject('stale');
      else old.resolve([{ id: 'old', name: 'Old' }]);
      flushMicrotasks();
      expect(comp.filteredItems()).toEqual([{ id: 'new', name: 'Newest' }]);
      expect(comp.readState().status).toBe('ready');
      expect(comp.loading()).toBeFalse();
      f.destroy();
    }));
  }

  it('supports Tab and retry in the panel without selection or submission', fakeAsync(() => {
    const loader = jasmine.createSpy('loader').and.callFake(() => Promise.reject('failed'));
    const { f, comp, selection } = setup(loader);
    comp.open();
    tick(600);
    f.detectChanges();
    const trigger = f.nativeElement.querySelector('mat-select') as HTMLElement;
    trigger.focus();
    expect(comp.readState().status).withContext('before Tab state').toBe('error');
    expect(comp.selectRef()!.panelOpen).withContext('before Tab panel').toBeTrue();
    expect(document.querySelector('.sd-select-panel .sd-read-state-region button')).withContext('before Tab button').not.toBeNull();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, bubbles: true, cancelable: true }));
    const button = document.querySelector<HTMLButtonElement>('.sd-select-panel .sd-read-state-region button')!;
    expect(document.activeElement).toBe(button);
    expect(button.closest('mat-option')).toBeNull();
    expect(button.type).toBe('button');
    const pending = deferred<unknown[]>();
    loader.and.returnValue(pending.promise);
    const count = loader.calls.count();
    button.click();
    flushMicrotasks();
    f.detectChanges();
    expect(loader.calls.count()).toBe(count + 1);
    expect(comp.selectRef()!.panelOpen).toBeTrue();
    expect(selection).not.toHaveBeenCalled();
    pending.resolve([]);
    flushMicrotasks();
    f.destroy();
  }));

  it('invalidates the failed VALUE request on model changes', fakeAsync(() => {
    const loader = jasmine
      .createSpy('loader')
      .and.callFake(req => (req.type === 'VALUE' ? Promise.reject(req.value) : Promise.resolve([])));
    const { f, comp } = setup(loader, '1');
    const before = loader.calls.count();
    f.componentRef.setInput('model', '2');
    comp.retryRead();
    expect(loader.calls.count()).toBe(before);
    f.detectChanges();
    tick(600);
    expect(
      loader.calls
        .allArgs()
        .filter(([req]) => req.type === 'VALUE')
        .map(([req]) => req.value)
    ).toEqual(['1', '2']);
    f.destroy();
  }));

  it('does not turn sync failures into empty or stop later search', fakeAsync(() => {
    const loader = jasmine.createSpy('loader').and.callFake(() => {
      throw new Error('sync');
    });
    const { f, comp } = setup(loader);
    expect(comp.readState().status).toBe('error');
    f.componentRef.setInput('hideReadError', true);
    comp.open();
    tick(600);
    f.detectChanges();
    expect(document.querySelector('.sd-select-panel sd-data-state')).toBeNull();
    expect(document.querySelector('.sd-select-panel .sd-empty')).toBeNull();
    loader.and.returnValue(Promise.resolve([{ id: '2', name: 'New' }]));
    comp.inputControl.setValue('new');
    tick(600);
    f.detectChanges();
    expect(comp.readState().status).toBe('ready');
    f.destroy();
  }));

  for (const staleFails of [true, false]) {
    it(`guards stale VALUE ${staleFails ? 'error' : 'success'} and preserves the new label`, fakeAsync(() => {
      const old = deferred<{ id: string; name: string }[]>();
      const loader = jasmine
        .createSpy('loader')
        .and.callFake(req =>
          req.type === 'SEARCH' ? Promise.resolve([]) : req.value === '1' ? old.promise : Promise.resolve([{ id: '2', name: 'Newest' }])
        );
      const { f, comp } = setup(loader, '1');
      f.componentRef.setInput('model', '2');
      f.detectChanges();
      tick(600);
      if (staleFails) old.reject('stale');
      else old.resolve([{ id: '1', name: 'Old' }]);
      flushMicrotasks();
      expect(comp.selectedItems()[0]).toEqual({ id: '2', name: 'Newest' });
      expect(comp.display()).toBe('Newest');
      expect(comp.readState().channels.VALUE.status).toBe('ready');
      f.destroy();
    }));
  }
});
