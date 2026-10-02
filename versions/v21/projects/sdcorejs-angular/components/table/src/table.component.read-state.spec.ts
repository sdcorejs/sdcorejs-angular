import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { I18nService } from '@sdcorejs/angular/i18n';
import { DateUtilities } from '@sdcorejs/utils/fns';
import { SdTable } from './table.component';
import { SD_TABLE_CONFIGURATION } from './configurations';
import { SdTableColumn } from './models/table-column.model';
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
    return setupColumns(loader, [{ field: 'name', type: 'string', title: 'Name' }]);
  }

  function setupColumns(loader: Extract<SdTableOption<Row>, { type: 'server' }>['items'], columns: SdTableColumn<Row>[]) {
    const f = TestBed.createComponent(SdTable<Row>);
    const option: SdTableOption<Row> = {
      type: 'server',
      items: loader,
      columns,
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

  it('clears rows/total after a failed refresh so rows never sit beside the error, and allows repeated retries', fakeAsync(() => {
    const loader = jasmine.createSpy('loader').and.returnValue(Promise.resolve({ items: [{ id: 1, name: 'Old' }], total: 20 }));
    const { f, table } = setup(loader);
    expect(f.nativeElement.querySelectorAll('tr.c-row').length).toBe(1);
    loader.and.callFake(() => {
      throw new Error('sync');
    });
    table.reload();
    flushMicrotasks();
    f.detectChanges();
    expect(table.readState().status).toBe('error');
    expect(table.total()).toBeUndefined();
    expect(table.items()).toEqual([]);
    expect(table.selectedTableItems()).toEqual([]);
    expect(f.nativeElement.querySelectorAll('tr.c-row').length).toBe(0);
    expect(f.nativeElement.querySelector('sd-data-state [role="alert"]')).not.toBeNull();
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

  describe('display callbacks (NSP-4877)', () => {
    const rows: Row[] = [
      { id: 1, name: 'Raw A' },
      { id: 2, name: 'Raw B' },
    ];
    const fail = (): never => {
      throw new Error('display broke');
    };
    const cases: [string, Partial<SdTableColumn<Row>>][] = [
      ['transform throws', { transform: fail }],
      ['transform rejects', { transform: () => Promise.reject(new Error('lookup broke')) }],
      ['htmlTemplate throws', { htmlTemplate: fail }],
      ['tooltip throws', { tooltip: fail }],
      ['useBadge throws', { useBadge: fail }],
    ];

    for (const [name, callbacks] of cases) {
      it(`keeps a successful read ready and shows raw values when ${name}`, fakeAsync(() => {
        const consoleError = spyOn(console, 'error');
        const { f, table } = setupColumns(jasmine.createSpy('loader').and.resolveTo({ items: rows, total: 2 }), [
          { field: 'name', type: 'string', title: 'Name', ...callbacks } as SdTableColumn<Row>,
        ]);
        expect(table.readState().status).toBe('ready');
        expect(f.nativeElement.querySelectorAll('tr.c-row').length).toBe(2);
        expect(f.nativeElement.querySelector('sd-data-state')).toBeNull();
        expect(f.nativeElement.textContent).toContain('Raw A');
        expect(f.nativeElement.textContent).toContain('Raw B');
        // why: một lần log cho mỗi cột mỗi lượt format, không spam theo từng dòng.
        expect(consoleError).toHaveBeenCalledTimes(1);
        f.destroy();
      }));
    }

    it('keeps a successful read ready when lazy-values views throws synchronously', fakeAsync(() => {
      spyOn(console, 'error');
      const { f, table } = setupColumns(jasmine.createSpy('loader').and.resolveTo({ items: rows, total: 2 }), [
        {
          field: 'name',
          type: 'lazy-values',
          title: 'Name',
          option: { items: () => Promise.resolve([]), valueField: 'id', displayField: 'name', views: fail },
        } as SdTableColumn<Row>,
      ]);
      expect(table.readState().status).toBe('ready');
      expect(f.nativeElement.textContent).toContain('Raw A');
      expect(f.nativeElement.querySelector('sd-data-state')).toBeNull();
      f.destroy();
    }));
  });

  it('renders backend microsecond timestamps in date columns instead of "--"', fakeAsync(() => {
    interface Stamped {
      id: number;
      createdAt: string;
      approvedAt: string;
    }
    const f = TestBed.createComponent(SdTable<Stamped>);
    f.componentRef.setInput('option', {
      type: 'server',
      items: () =>
        Promise.resolve({
          items: [{ id: 1, createdAt: '2026-07-09T08:49:29.851409Z', approvedAt: '2026-07-09T15:49:29.851+0700' }],
          total: 1,
        }),
      columns: [
        { field: 'createdAt', type: 'date', title: 'Created' },
        { field: 'approvedAt', type: 'datetime', title: 'Approved' },
      ],
      paginate: { pageSize: 10 },
    } as SdTableOption<Stamped>);
    f.detectChanges();
    tick(250);
    f.detectChanges();
    const expected = DateUtilities.toFormat('2026-07-09T08:49:29.851Z', 'dd/MM/yyyy');
    const display = f.componentInstance.items()[0].meta.display;
    expect(display['createdAt'].data).toBe(expected);
    expect(String(display['approvedAt'].data)).toContain(expected);
    expect(f.nativeElement.querySelector('tr.c-row')?.textContent).toContain(expected);
    f.destroy();
  }));

  it('renders rows when a column field is not a valid @sdcorejs/utils path (NSP-5745)', fakeAsync(() => {
    // why: import-result tables build columns from backend header codes such as "Số phòng ngủ";
    // utils 1.2 rejects whitespace in property paths and used to turn this read into an error.
    type ImportRow = Record<string, string | number>;
    const f = TestBed.createComponent(SdTable<ImportRow>);
    f.componentRef.setInput('option', {
      type: 'server',
      items: () => Promise.resolve({ items: [{ id: 1, 'Số phòng ngủ': '2PN', 'Loại sản phẩm*': 'Cao tầng' }], total: 1 }),
      columns: [
        { field: 'Số phòng ngủ', type: 'string', title: 'Số phòng ngủ' },
        { field: 'Loại sản phẩm*', type: 'string', title: 'Loại sản phẩm' },
      ],
      paginate: { pageSize: 10 },
    } as SdTableOption<ImportRow>);
    f.detectChanges();
    tick(250);
    f.detectChanges();

    expect(f.componentInstance.readState().status).toBe('ready');
    expect(f.nativeElement.querySelector('sd-data-state [role="alert"]')).toBeNull();
    const rowText = f.nativeElement.querySelector('tr.c-row')?.textContent ?? '';
    expect(rowText).toContain('2PN');
    expect(rowText).toContain('Cao tầng');
    f.destroy();
  }));

  describe('empty states (NSP-5551)', () => {
    const empty = () => jasmine.createSpy('loader').and.resolveTo({ items: [], total: 0 });
    const t = (key: string) => TestBed.inject(I18nService).t(key);

    function noDataRow(f: ComponentFixture<SdTable<Row>>) {
      const row: HTMLElement | null = f.nativeElement.querySelector('.c-no-data-row');
      return { row, image: row?.querySelector('img'), text: row?.textContent ?? '' };
    }

    it('shows the data-empty illustration and message for an unfiltered empty read', fakeAsync(() => {
      const { f, table } = setup(empty());
      expect(table.readState().status).toBe('empty');
      const { row, image, text } = noDataRow(f);
      expect(row).not.toBeNull();
      expect(image?.getAttribute('alt')).toBe('data-empty');
      expect(text).toContain(t('core.component.table.no-data'));
      expect(f.nativeElement.querySelector('sd-data-state')).toBeNull();
      f.destroy();
    }));

    it('shows the filter-empty illustration and hint when a filtered read is empty', fakeAsync(() => {
      const { f, table } = setup(empty());
      spyOn(table, 'getFilterRequest').and.returnValue({ ...table.getFilterRequest(), rawColumnFilter: { name: 'missing' } });
      table.reload();
      flushMicrotasks();
      tick();
      f.detectChanges();
      expect(table.readState().status).toBe('empty');
      const { image, text } = noDataRow(f);
      expect(image?.getAttribute('alt')).toBe('filter-empty');
      expect(text).toContain(t('core.component.table.no-results'));
      expect(text).toContain(t('core.component.table.no-results-hint'));
      expect(f.nativeElement.querySelector('sd-data-state')).toBeNull();
      f.destroy();
    }));

    it('shows the filter-required illustration when a required external filter has no value', fakeAsync(() => {
      const f = TestBed.createComponent(SdTable<Row>);
      f.componentRef.setInput('option', {
        type: 'server',
        items: empty(),
        columns: [{ field: 'name', type: 'string', title: 'Name' }],
        filter: { externalFilters: [{ field: 'code', type: 'string', title: 'Code', required: true }] },
        paginate: { pageSize: 10 },
      } as SdTableOption<Row>);
      f.detectChanges();
      tick(250);
      f.detectChanges();
      const { image, text } = noDataRow(f);
      expect(image?.getAttribute('alt')).toBe('filter-required');
      expect(text).toContain(t('core.component.table.choose-filter-hint'));
      expect(f.nativeElement.querySelector('sd-data-state')).toBeNull();
      f.destroy();
    }));

    it('uses the images configured through SD_TABLE_CONFIGURATION', fakeAsync(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: SD_TABLE_CONFIGURATION, useValue: { images: { dataEmpty: 'assets/custom-empty.svg' } } }],
      });
      const { f } = setup(empty());
      expect(noDataRow(f).image?.getAttribute('src')).toBe('assets/custom-empty.svg');
      f.destroy();
    }));
  });

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
