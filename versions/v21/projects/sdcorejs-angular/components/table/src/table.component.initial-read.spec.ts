import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdApiService } from '@sdcorejs/angular/services/api';
import { delay, firstValueFrom } from 'rxjs';
import { SdTableOption } from './models/table-option.model';
import { ConfigService } from './services/config.service';
import { TableFormatService } from './services/table-format/table-format.service';
import { SdTableFilterService } from './services/table-filter/table-filter.service';
import { SdTable } from './table.component';

interface Row {
  id: number;
  name: string;
  status?: number;
}
type ServerOption = Extract<SdTableOption<Row>, { type: 'server' }>;
type Transport = 'http' | 'api-default' | 'api-no-dedupe';

describe('SdTable initial read lifecycle with real HTTP loaders', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<SdTable<Row>>;
  let table: SdTable<Row>;
  let loader: jasmine.Spy<ServerOption['items']>;
  let loadValues: jasmine.Spy<TableFormatService['loadValues']>;
  let option: ServerOption;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SdTable, NoopAnimationsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    fixture?.destroy();
    http.verify();
  });

  function prepare(transport: Transport = 'api-no-dedupe') {
    const client = TestBed.inject(HttpClient);
    const api = TestBed.inject(SdApiService);
    loader = jasmine.createSpy<ServerOption['items']>('paging loader').and.callFake((_filter, paging) => {
      if (transport === 'http') return firstValueFrom(client.post<{ items: Row[]; total: number }>('/table/paging', paging));
      if (transport === 'api-default') return api.post('/table/paging', paging);
      return api.post('/table/paging', paging, { dedupe: false });
    });
    option = {
      type: 'server',
      items: loader,
      columns: [{ field: 'name', title: 'Name', type: 'string', filter: {} }],
      paginate: { pageSize: 10 },
      sort: { enable: true },
    };
    fixture = TestBed.createComponent(SdTable<Row>);
    table = fixture.componentInstance;
    loadValues = spyOn(fixture.debugElement.injector.get(TableFormatService), 'loadValues').and.callThrough();
  }

  function start() {
    fixture.componentRef.setInput('option', option);
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
  }

  function paging(): TestRequest {
    const request = http.expectOne('/table/paging');
    expect(request.request.method).toBe('POST');
    return request;
  }

  function respond(request: TestRequest, name = 'Current') {
    request.flush({ items: [{ id: 1, name }], total: 30 });
    flushMicrotasks();
    fixture.detectChanges();
  }

  function initial() {
    start();
    tick(250);
    respond(paging());
    tick(1000);
    expect(loader).toHaveBeenCalledTimes(1);
    http.expectNone('/table/paging');
  }

  for (const transport of ['http', 'api-default', 'api-no-dedupe'] as const) {
    for (const slow of [false, true]) {
      it(`reads once through ${transport} with a ${slow ? 'slow' : 'fast'} initial response`, fakeAsync(() => {
        prepare(transport);
        start();
        expect(loadValues).toHaveBeenCalledTimes(1);
        tick(slow ? 1200 : 250);
        expect(loader).toHaveBeenCalledTimes(1);
        respond(paging());
        tick(1200);
        expect(loader).toHaveBeenCalledTimes(1);
        http.expectNone('/table/paging');
        expect(table.readState().status).toBe('ready');
        expect(table.loading()).toBeFalse();
      }));
    }
  }

  it('waits for async lookup before hydrating filters and making the only initial read', fakeAsync(() => {
    prepare();
    const client = TestBed.inject(HttpClient);
    option.columns.push({
      field: 'status',
      title: 'Status',
      type: 'values',
      filter: { default: 2 },
      option: { valueField: 'id', displayField: 'name', items: () => firstValueFrom(client.get<Row[]>('/table/statuses')) },
    });
    start();
    tick(1500);
    expect(loader).not.toHaveBeenCalled();
    http.expectNone('/table/paging');
    const lookup = http.expectOne('/table/statuses');
    lookup.flush([{ id: 2, name: 'Active' }]);
    flushMicrotasks();
    fixture.detectChanges();
    tick(1000);
    const request = paging();
    expect(request.request.body.filters).toContain(jasmine.objectContaining({ field: 'status', data: 2 }));
    respond(request);
    expect(loadValues).toHaveBeenCalledTimes(1);
    expect(loader).toHaveBeenCalledTimes(1);
  }));

  it('does not synthesize an early read before async configuration emits', fakeAsync(() => {
    prepare();
    const service = fixture.debugElement.injector.get(ConfigService);
    const init = service.init;
    spyOn(service, 'init').and.callFake(opt => {
      const storage = init(opt);
      return { ...storage, observer: storage.observer.pipe(delay(900)) };
    });
    start();
    tick(800);
    expect(loadValues).not.toHaveBeenCalled();
    expect(loader).not.toHaveBeenCalled();
    tick(1500);
    respond(paging());
    expect(loadValues).toHaveBeenCalledTimes(1);
    expect(loader).toHaveBeenCalledTimes(1);
  }));

  it('only commits the latest configuration and lookup when hydration resolves out of order', fakeAsync(() => {
    prepare();
    const client = TestBed.inject(HttpClient);
    option.columns.push({
      field: 'status',
      title: 'Original',
      type: 'values',
      option: { valueField: 'id', displayField: 'name', items: () => firstValueFrom(client.get<Row[]>('/table/statuses')) },
    });
    const config = spyOn(fixture.debugElement.injector.get(ConfigService), 'init').and.callThrough();
    start();
    const old = http.expectOne('/table/statuses');
    const storage = config.calls.first().returnValue;
    storage.set({ columns: storage.get().columns!.map(column => ({ ...column, title: 'Latest' })) });
    const latest = http.expectOne('/table/statuses');
    latest.flush([{ id: 2, name: 'Latest lookup' }]);
    flushMicrotasks();
    fixture.detectChanges();
    tick(1000);
    respond(paging());
    old.flush([{ id: 1, name: 'Stale lookup' }]);
    flushMicrotasks();
    tick(1000);
    expect(table.configuration()?.firstColumns[0].title).toBe('Latest');
    expect(table.cacheValues['status']).toEqual([{ id: 2, name: 'Latest lookup' }]);
    expect(loader).toHaveBeenCalledTimes(1);
    http.expectNone('/table/paging');
  }));

  for (const destroy of [false, true]) {
    it(`ignores pending lookup after ${destroy ? 'destroy' : 'option/scope replacement'}`, fakeAsync(() => {
      prepare();
      const client = TestBed.inject(HttpClient);
      option.columns.push({
        field: 'status',
        title: 'Status',
        type: 'values',
        option: { valueField: 'id', displayField: 'name', items: () => firstValueFrom(client.get<Row[]>('/table/statuses')) },
      });
      start();
      const old = http.expectOne('/table/statuses');
      if (destroy) fixture.destroy();
      else {
        option = { ...option, columns: [{ field: 'name', title: 'New scope', type: 'string' }] };
        start();
        tick(1000);
        respond(paging());
      }
      old.flush([{ id: 1, name: 'Stale lookup' }]);
      flushMicrotasks();
      tick(1000);
      expect(table.cacheValues['status']).toBeUndefined();
      expect(loader).toHaveBeenCalledTimes(destroy ? 0 : 1);
      http.expectNone('/table/paging');
    }));
  }

  it('reports lookup errors and allows retry to complete hydration once', fakeAsync(() => {
    prepare();
    const client = TestBed.inject(HttpClient);
    option.columns.push({
      field: 'status',
      title: 'Status',
      type: 'values',
      option: { valueField: 'id', displayField: 'name', items: () => firstValueFrom(client.get<Row[]>('/table/statuses')) },
    });
    start();
    http.expectOne('/table/statuses').flush('Failed', { status: 500, statusText: 'Failed' });
    flushMicrotasks();
    expect(table.readState().status).toBe('error');
    expect(table.loading()).toBeFalse();
    expect(loader).not.toHaveBeenCalled();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('sd-data-state')).not.toBeNull();
    fixture.componentRef.setInput('hideReadError', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('sd-data-state')).toBeNull();
    fixture.componentRef.setInput('hideReadError', false);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[data-state-retry] button') as HTMLButtonElement).click();
    http.expectOne('/table/statuses').flush([{ id: 1, name: 'Recovered' }]);
    flushMicrotasks();
    fixture.detectChanges();
    tick(1000);
    respond(paging());
    expect(loader).toHaveBeenCalledTimes(1);
    expect(table.loadError()).toBeFalse();
  }));

  it('folds explicit refresh during pending lookup into the initial read', fakeAsync(() => {
    prepare();
    const client = TestBed.inject(HttpClient);
    option.columns.push({
      field: 'status',
      title: 'Status',
      type: 'values',
      option: { valueField: 'id', displayField: 'name', items: () => firstValueFrom(client.get<Row[]>('/table/statuses')) },
    });
    start();
    const refresh = table.reload();
    http.expectOne('/table/statuses').flush([{ id: 1, name: 'Ready' }]);
    flushMicrotasks();
    respond(paging());
    let refreshed = false;
    refresh.then(() => (refreshed = true));
    flushMicrotasks();
    tick(1000);
    expect(refreshed).toBeTrue();
    expect(loader).toHaveBeenCalledTimes(1);
    http.expectNone('/table/paging');
  }));

  for (const saved of [false, true]) {
    it(`hydrates ${saved ? 'saved' : 'default / URL-derived'} filters in the first payload`, fakeAsync(() => {
      prepare();
      option.columns[0].filter = { default: 'URL name' };
      option.filter = {
        key: `initial-filter-${Math.random()}`,
        cacheable: true,
        externalFilters: [{ field: 'region', title: 'Region', type: 'string', default: 'URL region' }],
        quickSearch: { containFields: ['name'], filters: [] },
      };
      if (saved) {
        const register = fixture.debugElement.injector.get(SdTableFilterService).register(option.filter, {
          id: 'previous-instance',
          columns: option.columns,
          externalFilters: option.filter.externalFilters,
          filterDefs: [],
        });
        register.value.set({
          columnFilter: { name: 'Saved name' },
          externalFilter: { region: 'Saved region' },
          quickSearch: { term: 'Saved term', filters: {} },
        });
      }
      initial();
      const request = loader.calls.first().args[0];
      expect(request.rawColumnFilter['name']).toBe(saved ? 'Saved name' : 'URL name');
      expect(request.rawExternalFilter['region']).toBe(saved ? 'Saved region' : 'URL region');
      expect(request.quickSearch?.term).toBe(saved ? 'Saved term' : '');
    }));
  }

  it('coalesces consecutive filters, including a change before the initial read starts', fakeAsync(() => {
    prepare();
    start();
    table.filterRegister.value.set({ columnFilter: { name: 'First' } });
    tick(100);
    table.filterRegister.value.set({ columnFilter: { name: 'Latest' } });
    tick(1000);
    const request = paging();
    expect(request.request.body.filters).toContain(jasmine.objectContaining({ field: 'name', data: 'Latest' }));
    respond(request);
    expect(loader).toHaveBeenCalledTimes(1);
    table.filterRegister.value.set({ columnFilter: { name: 'Next' } });
    tick(300);
    table.filterRegister.value.set({ columnFilter: { name: 'Final' } });
    tick(1000);
    respond(paging());
    expect(loader).toHaveBeenCalledTimes(2);
    expect(loader.calls.mostRecent().args[0].rawColumnFilter['name']).toBe('Final');
  }));

  it('includes a silent URL filter commit without cancelling the initial read', fakeAsync(() => {
    prepare();
    start();
    table.filterRegister.value.set({ columnFilter: { name: 'First' } });
    tick(100);
    table.filterRegister.value.set({ columnFilter: { name: 'From URL' }, notReload: true });
    tick(1000);
    const request = paging();
    expect(request.request.body.filters).toContain(jasmine.objectContaining({ field: 'name', data: 'From URL' }));
    respond(request);
    expect(loader).toHaveBeenCalledTimes(1);
  }));

  it('blocks a required external filter until it has a valid applied value', fakeAsync(() => {
    prepare();
    option.filter = { externalFilters: [{ field: 'tenantId', title: 'Tenant', type: 'string', required: true, defaultShowing: true }] };
    start();
    tick(1000);
    expect(loader).not.toHaveBeenCalled();
    table.externalFilter()!.externalFilter.set({ tenantId: 'Valid tenant' });
    fixture.detectChanges();
    table.externalFilter()!.onSubmit();
    tick(1000);
    respond(paging());
    expect(loader).toHaveBeenCalledTimes(1);
  }));

  it('keeps manual drafts and notReload commits silent, then submits and resets normally', fakeAsync(() => {
    prepare();
    option.filter = { manualFilter: true, externalFilters: [{ field: 'region', title: 'Region', type: 'string', default: 'Default' }] };
    initial();
    const external = table.externalFilter()!;
    table.columnFilter!['name'] = 'Inline draft';
    table.onFilterCommit();
    external.externalFilter.set({ region: 'Draft' });
    external.onFilter(option.filter.externalFilters![0]);
    tick(1000);
    expect(loader).toHaveBeenCalledTimes(1);
    http.expectNone('/table/paging');
    external.onSubmit();
    tick(1000);
    respond(paging());
    expect(loader.calls.mostRecent().args[0].rawExternalFilter['region']).toBe('Draft');
    table.filterRegister.value.remove();
    tick(1000);
    respond(paging());
    expect(loader.calls.mostRecent().args[0].rawExternalFilter['region']).toBe('Default');
    expect(loader).toHaveBeenCalledTimes(3);
  }));

  it('blocks a missing required tenant and ignores responses from the previous tenant', fakeAsync(() => {
    prepare();
    const tenant = signal<number | null>(null);
    option.filter = {
      quickSearch: {
        filters: [
          {
            field: 'tenantId',
            title: 'Tenant',
            type: 'values',
            required: true,
            default: tenant,
            option: {
              valueField: 'id',
              displayField: 'name',
              items: [
                { id: 1, name: 'One' },
                { id: 2, name: 'Two' },
              ],
            },
          },
        ],
      },
    };
    start();
    tick(1000);
    expect(loader).not.toHaveBeenCalled();
    http.expectNone('/table/paging');
    tenant.set(1);
    fixture.detectChanges();
    tick(1000);
    const old = paging();
    tenant.set(2);
    fixture.detectChanges();
    old.flush({ items: [{ id: 1, name: 'Stale tenant' }], total: 99 });
    flushMicrotasks();
    expect(table.items()).toEqual([]);
    tick(1000);
    const current = paging();
    expect(current.request.body.filters).toContain(jasmine.objectContaining({ field: 'tenantId', data: 2 }));
    respond(current, 'Current tenant');
    expect(table.items()[0].data.name).toBe('Current tenant');
    expect(loader).toHaveBeenCalledTimes(2);
  }));

  it('sends every explicit refresh, cancels pending automatic reads and retries a failed read', fakeAsync(() => {
    prepare();
    initial();
    table.filterRegister.value.set({ columnFilter: { name: 'Changed' } });
    tick(550);
    table.reload();
    flushMicrotasks();
    const refreshed = paging();
    const body = refreshed.request.body;
    respond(refreshed);
    tick(1000);
    expect(loader).toHaveBeenCalledTimes(2);
    http.expectNone('/table/paging');
    table.reload();
    flushMicrotasks();
    const failed = paging();
    expect(failed.request.body).toEqual(body);
    failed.flush('Unavailable', { status: 503, statusText: 'Unavailable' });
    flushMicrotasks();
    expect(table.readState().status).toBe('error');
    expect(table.loading()).toBeFalse();
    expect(table.items()[0].data.name).toBe('Current');
    table.retryRead();
    flushMicrotasks();
    const retry = paging();
    expect(retry.request.body).toEqual(body);
    respond(retry, 'Recovered');
    expect(loader).toHaveBeenCalledTimes(4);
    expect(table.readState().status).toBe('ready');
  }));

  for (const staleFails of [false, true]) {
    it(`allows refresh during an active identical POST and ignores its stale ${staleFails ? 'error' : 'success'}`, fakeAsync(() => {
      prepare();
      start();
      tick(250);
      const old = paging();
      table.reload();
      flushMicrotasks();
      const refreshed = paging();
      expect(refreshed.request.body).toEqual(old.request.body);
      respond(refreshed, 'Refreshed');
      if (staleFails) old.flush('Old error', { status: 500, statusText: 'Failed' });
      else old.flush({ items: [{ id: 2, name: 'Old response' }], total: 99 });
      flushMicrotasks();
      tick(1000);
      expect(loader).toHaveBeenCalledTimes(2);
      expect(table.items()[0].data.name).toBe('Refreshed');
      expect(table.readState().status).toBe('ready');
      expect(table.loading()).toBeFalse();
      http.expectNone('/table/paging');
    }));
  }

  it('abandons a refresh waiting on lookup when its option is replaced before the next effect', fakeAsync(() => {
    prepare();
    const client = TestBed.inject(HttpClient);
    option.columns.push({
      field: 'status',
      title: 'Status',
      type: 'values',
      option: { valueField: 'id', displayField: 'name', items: () => firstValueFrom(client.get<Row[]>('/table/statuses')) },
    });
    start();
    const lookup = http.expectOne('/table/statuses');
    let settled = false;
    table.reload().then(() => (settled = true));
    option = { ...option, columns: [{ field: 'name', title: 'New option', type: 'string' }] };
    fixture.componentRef.setInput('option', option);
    lookup.flush([{ id: 1, name: 'Old lookup' }]);
    flushMicrotasks();
    expect(settled).toBeTrue();
    fixture.detectChanges();
    tick(1000);
    respond(paging());
    expect(loader).toHaveBeenCalledTimes(1);
    expect(table.cacheValues['status']).toBeUndefined();
  }));

  it('keeps paging and sort reads, and drops a response after destroy', fakeAsync(() => {
    prepare();
    initial();
    table.paginator()!.pageIndex = 2;
    table.paginator()!.page.emit({ pageIndex: 2, pageSize: 10, length: 30 });
    tick(250);
    const page = paging();
    expect(page.request.body.pageNumber).toBe(2);
    respond(page);
    table.sort()!.sort({ id: 'name', start: 'desc', disableClear: false });
    tick(250);
    const sorted = paging();
    expect(sorted.request.body.orders).toEqual([{ field: 'name', direction: 'DESC' }]);
    fixture.destroy();
    sorted.flush({ items: [{ id: 2, name: 'Destroyed' }], total: 99 });
    flushMicrotasks();
    expect(table.items()[0].data.name).toBe('Current');
    expect(loader).toHaveBeenCalledTimes(3);
  }));

  it('emits each hydrated filter snapshot once to every new subscriber', fakeAsync(() => {
    prepare();
    initial();
    const service = fixture.debugElement.injector.get(SdTableFilterService);
    const register = service.register(undefined, { id: 'single-snapshot', columns: [], externalFilters: [], filterDefs: [] });
    const values = jasmine.createSpy('values');
    const configuration = jasmine.createSpy('configuration');
    const valueSub = register.value.observer.subscribe(values);
    const configSub = register.configuration.observer.subscribe(configuration);
    expect(values).toHaveBeenCalledTimes(1);
    expect(configuration).toHaveBeenCalledTimes(1);
    register.value.set({ columnFilter: { name: 'Changed' } });
    expect(values).toHaveBeenCalledTimes(2);
    valueSub.unsubscribe();
    configSub.unsubscribe();
  }));
});
