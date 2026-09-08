import { TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdTable } from './table.component';
import { SdTableOption } from './models/table-option.model';
import { TableFormatService } from './services/table-format/table-format.service';

interface Row {
  id: number;
  name: string;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('SdTable server read state', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SdTable, NoopAnimationsModule] }));

  function setup(loader: Extract<SdTableOption<Row>, { type: 'server' }>['items']) {
    const f = TestBed.createComponent(SdTable<Row>);
    const option: SdTableOption<Row> = {
      type: 'server',
      items: loader,
      columns: [{ field: 'name', type: 'string', title: 'Name' }],
      paginate: { pageSize: 10 },
    };
    f.componentRef.setInput('option', option);
    const changes: string[] = [];
    f.componentInstance.sdReadStateChange.subscribe(state => changes.push(state.status));
    f.detectChanges();
    tick(250);
    f.detectChanges();
    return { f, table: f.componentInstance, changes, option };
  }

  for (const result of [[], [{ id: 1, name: 'Loaded' }]]) {
    it(`retries the exact failed request once to ${result.length ? 'ready' : 'empty'}`, fakeAsync(() => {
      const first = deferred<{ items: Row[]; total: number }>();
      const retry = deferred<{ items: Row[]; total: number }>();
      const loader = jasmine.createSpy('loader').and.returnValues(first.promise, retry.promise);
      const { f, table, changes } = setup(loader);
      const error = new Error('private response');
      first.reject(error);
      flushMicrotasks();
      f.detectChanges();
      expect(table.readState()).toEqual({ status: 'error', operation: 'TABLE', error });
      expect(changes).not.toContain('empty');
      expect(table.total()).toBeUndefined();
      expect(f.nativeElement.querySelector('sd-data-state [role="alert"]')).not.toBeNull();
      expect(f.nativeElement.querySelector('.c-no-data-row')).toBeNull();
      expect(f.nativeElement.textContent).not.toContain('private response');
      const originalArgs = loader.calls.first().args;
      table.retryRead();
      table.retryRead();
      expect(loader.calls.count()).toBe(2);
      expect(loader.calls.mostRecent().args).toEqual(originalArgs);
      retry.resolve({ items: result, total: result.length });
      flushMicrotasks();
      tick();
      f.detectChanges();
      expect(table.readState()).toEqual({ status: result.length ? 'ready' : 'empty', operation: 'TABLE' });
      expect(table.loading()).toBeFalse();
      expect(table.items().map(item => item.data)).toEqual(result);
      f.destroy();
    }));
  }

  it('keeps successful rows/total after failure and allows repeated retries', fakeAsync(() => {
    const loader = jasmine.createSpy('loader').and.returnValue(Promise.resolve({ items: [{ id: 1, name: 'Old' }], total: 20 }));
    const { f, table } = setup(loader);
    loader.and.callFake(() => {
      throw new Error('sync');
    });
    table.reload();
    flushMicrotasks();
    expect(table.readState().status).toBe('error');
    expect(table.total()).toBe(20);
    expect(table.items()[0].data.name).toBe('Old');
    table.retryRead();
    flushMicrotasks();
    expect(table.readState().status).toBe('error');
    table.retryRead();
    flushMicrotasks();
    expect(loader.calls.count()).toBe(4);
    f.destroy();
  }));

  it('does not let a stale asynchronous formatter write into active caches', fakeAsync(() => {
    const response = deferred<{ items: Row[]; total: number }>();
    const formatting = deferred<void>();
    const loader = jasmine.createSpy('loader').and.returnValue(response.promise);
    const { f, table } = setup(loader);
    const format = spyOn(f.debugElement.injector.get(TableFormatService), 'format').and.callFake(async (_rows, _columns, values) => {
      await formatting.promise;
      values['stale'] = ['stale'];
      return [];
    });
    response.resolve({ items: [{ id: 1, name: 'Old' }], total: 1 });
    flushMicrotasks();
    format.and.returnValue(Promise.resolve([]));
    loader.and.returnValue(Promise.resolve({ items: [], total: 0 }));
    table.reload();
    flushMicrotasks();
    formatting.resolve();
    flushMicrotasks();
    expect(table.cacheValues['stale']).toBeUndefined();
    expect(table.readState().status).toBe('empty');
    f.destroy();
  }));

  it('replays an immutable filter, paging and sort snapshot even if the loader mutates its arguments', fakeAsync(() => {
    const loader = jasmine.createSpy('loader').and.returnValue(Promise.resolve({ items: [], total: 0 }));
    const { f, table } = setup(loader);
    const filter = {
      ...table.getFilterRequest(),
      rawExternalFilter: { date: new Date('2026-09-01'), nested: { codes: ['A'] } },
      pageNumber: 3,
      pageSize: 25,
      orderBy: 'name',
      orderDirection: 'DESC' as const,
    };
    spyOn(table, 'getFilterRequest').and.returnValue(filter);
    const captured: unknown[] = [];
    loader.and.callFake((args, paging) => {
      captured.push({ args: JSON.parse(JSON.stringify(args)), paging: JSON.parse(JSON.stringify(paging)) });
      args.rawExternalFilter.date.setFullYear(2000);
      args.rawExternalFilter.nested.codes.push('mutated');
      paging.pageNumber = 99;
      throw new Error('failed');
    });
    table.reload();
    flushMicrotasks();
    table.retryRead();
    flushMicrotasks();
    expect(captured.length).toBe(2);
    expect(captured[1]).toEqual(captured[0]);
    expect(filter.rawExternalFilter.date.getFullYear()).toBe(2026);
    expect(filter.rawExternalFilter.nested.codes).toEqual(['A']);
    expect(table.readState().status).toBe('error');
    f.destroy();
  }));

  it('accepts a pending response after a presentation-only column resize', fakeAsync(() => {
    const pending = deferred<{ items: Row[]; total: number }>();
    const loader = jasmine.createSpy('loader').and.returnValue(pending.promise);
    const { f, table } = setup(loader);
    const conf = table.configuration()!;
    table.configuration.set({ ...conf, firstColumns: conf.firstColumns.map(column => ({ ...column, width: '150px' })) });
    pending.resolve({ items: [{ id: 1, name: 'Loaded' }], total: 1 });
    flushMicrotasks();
    tick();
    expect(table.readState().status).toBe('ready');
    expect(table.loading()).toBeFalse();
    expect(table.items().length).toBe(1);
    f.destroy();
  }));

  it('invalidates retry on paging/context and hides only the error UI', fakeAsync(() => {
    const loader = jasmine.createSpy('loader').and.callFake(() => Promise.reject('failed'));
    const { f, table } = setup(loader);
    f.componentRef.setInput('hideReadError', true);
    f.detectChanges();
    expect(table.readState().status).toBe('error');
    expect(f.nativeElement.querySelector('sd-data-state')).toBeNull();
    expect(f.nativeElement.querySelector('.c-no-data-row')).toBeNull();
    table.paginator()!.pageIndex = 2;
    table.retryRead();
    flushMicrotasks();
    expect(loader.calls.count()).toBe(1);
    f.destroy();
  }));

  for (const staleFails of [false, true]) {
    it(`ignores stale ${staleFails ? 'error' : 'success'} after a newer request`, fakeAsync(() => {
      const old = deferred<{ items: Row[]; total: number }>();
      const latest = deferred<{ items: Row[]; total: number }>();
      const loader = jasmine.createSpy('loader').and.returnValues(old.promise, latest.promise);
      const { f, table } = setup(loader);
      table.reload();
      latest.resolve({ items: [{ id: 2, name: 'Newest' }], total: 1 });
      flushMicrotasks();
      if (staleFails) old.reject('old');
      else old.resolve({ items: [], total: 0 });
      flushMicrotasks();
      tick();
      expect(table.readState().status).toBe('ready');
      expect(table.items()[0].data.name).toBe('Newest');
      expect(table.total()).toBe(1);
      expect(table.loading()).toBeFalse();
      f.destroy();
    }));
  }
});
