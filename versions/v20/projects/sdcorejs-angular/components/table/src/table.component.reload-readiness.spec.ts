import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdTableOption } from './models/table-option.model';
import { ConfigService } from './services/config.service';
import { SdTable } from './table.component';

interface Row {
  id: number;
  name: string;
  status?: number;
}
type ServerOption = Extract<SdTableOption<Row>, { type: 'server' }>;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('SdTable reload readiness', () => {
  let fixture: ComponentFixture<SdTable<Row>>;
  let table: SdTable<Row>;
  let option: ServerOption;
  let loader: jasmine.Spy<ServerOption['items']>;
  let lookup: ReturnType<typeof deferred<Row[]>>;
  let lookupLoader: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SdTable, NoopAnimationsModule] });
    fixture = TestBed.createComponent(SdTable<Row>);
    table = fixture.componentInstance;
    lookup = deferred<Row[]>();
    lookupLoader = jasmine.createSpy('lookup').and.callFake(() => lookup.promise);
    loader = jasmine
      .createSpy<ServerOption['items']>('rows')
      .and.callFake(async () => ({ items: [{ id: 1, name: 'Ready', status: 2 }], total: 1 }));
    option = {
      type: 'server',
      items: loader,
      paginate: { pageSize: 10 },
      columns: [
        { field: 'name', title: 'Name', type: 'string' },
        {
          field: 'status',
          title: 'Status',
          type: 'values',
          filter: { default: 2 },
          option: { valueField: 'id', displayField: 'name', items: lookupLoader },
        },
      ],
    };
    fixture.componentRef.setInput('option', option);
  });

  afterEach(() => fixture.destroy());

  function start() {
    fixture.detectChanges();
    flushMicrotasks();
  }
  function ready() {
    lookup.resolve([{ id: 2, name: 'Active' }]);
    flushMicrotasks();
    fixture.detectChanges();
    tick(1000);
    fixture.detectChanges();
  }

  it('allows reload before the option effect runs without reading incomplete filters', fakeAsync(() => {
    let settled = false;
    table.reload().then(() => (settled = true));
    flushMicrotasks();
    expect(settled).toBeTrue();
    expect(loader).not.toHaveBeenCalled();
    start();
    ready();
    expect(table.items()[0].data.name).toBe('Ready');
  }));

  it('waits for lookup, retains default filters and replaces the pending initial read', fakeAsync(() => {
    start();
    let settled = false;
    table.reload().then(() => (settled = true));
    tick(1000);
    expect(settled).toBeFalse();
    expect(loader).not.toHaveBeenCalled();
    ready();
    expect(settled).toBeTrue();
    expect(loader).toHaveBeenCalledTimes(1);
    expect(loader.calls.first().args[0].rawColumnFilter['status']).toBe(2);
    expect(loader.calls.first().args[1].pageSize).toBe(10);
    expect(table.items()[0].data.name).toBe('Ready');
    expect(table.readState().status).toBe('ready');
  }));

  for (const fail of [false, true]) {
    it(`ignores a pending lookup ${fail ? 'failure' : 'success'} after destroy, including waiting reload`, fakeAsync(() => {
      start();
      let settled = false;
      table.reload().then(() => (settled = true));
      fixture.destroy();
      if (fail) lookup.reject(new Error('obsolete lookup'));
      else lookup.resolve([{ id: 2, name: 'Obsolete' }]);
      flushMicrotasks();
      tick(1000);
      expect(settled).toBeTrue();
      expect(loader).not.toHaveBeenCalled();
      expect(table.items()).toEqual([]);
      expect(table.cacheValues['status']).toBeUndefined();
      expect(table.configuration()).toBeUndefined();
      expect(table.readState().status).not.toBe('error');
      table.reload();
      flushMicrotasks();
      expect(loader).not.toHaveBeenCalled();
    }));
  }

  for (const runEffect of [false, true]) {
    it(`abandons old reload when the option changes ${runEffect ? 'after' : 'before'} the next effect`, fakeAsync(() => {
      start();
      let settled = false;
      table.reload().then(() => (settled = true));
      const nextLoader = jasmine.createSpy('next rows').and.resolveTo({ items: [{ id: 3, name: 'New scope' }], total: 1 });
      fixture.componentRef.setInput('option', { ...option, items: nextLoader, columns: [{ field: 'name', title: 'New', type: 'string' }] });
      if (runEffect) {
        fixture.detectChanges();
        flushMicrotasks();
      }
      lookup.resolve([{ id: 2, name: 'Obsolete' }]);
      flushMicrotasks();
      fixture.detectChanges();
      tick(1000);
      expect(settled).toBeTrue();
      expect(loader).not.toHaveBeenCalled();
      expect(nextLoader).toHaveBeenCalledTimes(1);
      expect(table.items()[0].data.name).toBe('New scope');
      expect(table.cacheValues['status']).toBeUndefined();
    }));
  }

  for (const retry of ['reload', 'retryRead'] as const) {
    it(`contains lookup rejection during reload and recovers through ${retry}`, fakeAsync(() => {
      start();
      let settled = false;
      table.reload().then(() => (settled = true));
      const error = new Error('lookup unavailable');
      lookup.reject(error);
      flushMicrotasks();
      fixture.detectChanges();
      tick(1000);
      expect(settled).toBeTrue();
      expect(loader).not.toHaveBeenCalled();
      expect(table.readState()).toEqual({ status: 'error', operation: 'TABLE', error });
      expect(table.loading()).toBeFalse();
      expect(fixture.nativeElement.querySelector('sd-data-state')).not.toBeNull();
      lookup = deferred<Row[]>();
      table[retry]();
      ready();
      expect(loader).toHaveBeenCalledTimes(1);
      expect(table.items()[0].data.name).toBe('Ready');
      expect(table.readState().status).toBe('ready');
    }));
  }

  it('contains a synchronous lookup error and permits a later reload', fakeAsync(() => {
    lookupLoader.and.throwError('sync lookup failure');
    start();
    expect(table.readState().status).toBe('error');
    expect(loader).not.toHaveBeenCalled();
    lookupLoader.and.callFake(() => lookup.promise);
    table.reload();
    ready();
    expect(table.readState().status).toBe('ready');
    expect(loader).toHaveBeenCalledTimes(1);
  }));

  it('waits for the newest configuration and never commits an older lookup cache', fakeAsync(() => {
    const init = spyOn(fixture.debugElement.injector.get(ConfigService), 'init').and.callThrough();
    start();
    const old = lookup;
    let settled = false;
    table.reload().then(() => (settled = true));
    lookup = deferred<Row[]>();
    const storage = init.calls.first().returnValue;
    storage.set({ columns: storage.get().columns!.map(column => ({ ...column, title: 'Latest' })) });
    old.resolve([{ id: 9, name: 'Old' }]);
    flushMicrotasks();
    tick(1000);
    expect(settled).toBeFalse();
    expect(loader).not.toHaveBeenCalled();
    ready();
    expect(settled).toBeTrue();
    expect(table.cacheValues['status']).toEqual([{ id: 2, name: 'Active' }]);
    expect(table.configuration()?.firstColumns[0].title).toBe('Latest');
    expect(loader).toHaveBeenCalledTimes(1);
  }));

  it('waits in local mode and retains force=false cache semantics after initialization', fakeAsync(() => {
    const local = jasmine.createSpy('local rows').and.resolveTo([{ id: 1, name: 'Local', status: 2 }]);
    fixture.componentRef.setInput('option', { ...option, type: 'local', items: local });
    start();
    table.reload();
    flushMicrotasks();
    expect(local).not.toHaveBeenCalled();
    ready();
    expect(local).toHaveBeenCalledTimes(1);
    expect(table.items()[0].data.name).toBe('Local');
    table.reload(false);
    flushMicrotasks();
    tick(1000);
    expect(local).toHaveBeenCalledTimes(1);
    expect(table.items()[0].data.name).toBe('Local');
  }));

  it('does not call the old loader when a ready table receives a new option before its effect', fakeAsync(() => {
    start();
    ready();
    loader.calls.reset();
    const nextLoader = jasmine.createSpy('next rows').and.resolveTo({ items: [{ id: 3, name: 'New scope' }], total: 1 });
    fixture.componentRef.setInput('option', { ...option, items: nextLoader });
    table.reload();
    flushMicrotasks();
    expect(loader).not.toHaveBeenCalled();
    expect(nextLoader).not.toHaveBeenCalled();
    fixture.detectChanges();
    tick(1000);
    expect(nextLoader).toHaveBeenCalledTimes(1);
    expect(table.items()[0].data.name).toBe('New scope');
  }));

  it('keeps ready reloads working with pending column edits and scrollTop=false', fakeAsync(() => {
    start();
    ready();
    loader.calls.reset();
    const scroll = spyOn(table.scroll()!, 'scrollTop');
    table.columnFilter!['name'] = 'Draft';
    let settled = false;
    table.reload(false, false).then(() => (settled = true));
    flushMicrotasks();
    tick(1000);
    expect(settled).toBeTrue();
    expect(loader).toHaveBeenCalledTimes(1);
    expect(loader.calls.first().args[0].rawColumnFilter['name']).toBe('Draft');
    expect(scroll).not.toHaveBeenCalled();
  }));
});
