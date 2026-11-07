import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { SdTableOption } from './models/table-option.model';
import { SdTableFilterRequest } from './services/table-filter/table-filter.model';
import { SdTable } from './table.component';

interface Row {
  id: number;
  name: string;
  amount: number;
}
type ServerOption = Extract<SdTableOption<Row>, { type: 'server' }>;

const loader = jasmine.createSpy<ServerOption['items']>('items');
let hostOption: () => ServerOption = () => serverOption();

const serverOption = (paginate: ServerOption['paginate'] = { pageSize: 10, pages: [10, 50] }): ServerOption => ({
  type: 'server',
  items: loader,
  columns: [
    { field: 'name', title: 'Name', type: 'string', filter: {} },
    { field: 'amount', title: 'Amount', type: 'number', sortable: true, filter: {} },
  ],
  paginate,
  sort: { enable: true },
});

@Component({
  standalone: true,
  selector: 'sd-table-sync-host',
  imports: [SdTable],
  template: `<sd-table autoId="customers" [syncQueryParams]="sync()" [option]="option"></sd-table>`,
})
class TableSyncHost {
  readonly sync = signal(true);
  readonly option = hostOption();
}

@Component({ standalone: true, selector: 'sd-table-sync-blank', template: '' })
class BlankPage {}

const CACHE_KEY = 'qp-sync-cache-spec';
const clearCache = () => {
  for (const key of Object.keys(localStorage)) if (key.includes(CACHE_KEY)) localStorage.removeItem(key);
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const param = (value: object | string) => encodeURIComponent(typeof value === 'string' ? value : JSON.stringify(value));
const firstArg = (index: number): SdTableFilterRequest => loader.calls.argsFor(index)[0] as SdTableFilterRequest;

describe('SdTable syncQueryParams', () => {
  let router: Router;

  beforeEach(() => {
    loader.calls.reset();
    loader.and.callFake(async () => ({ items: [{ id: 1, name: 'A', amount: 1 }], total: 300 }));
    hostOption = () => serverOption();
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [
        provideRouter([
          { path: 'p', component: TableSyncHost },
          { path: 'blank', component: BlankPage },
        ]),
      ],
    });
    router = TestBed.inject(Router);
    clearCache();
  });

  afterEach(clearCache);

  const settle = async (harness: RouterTestingHarness, ms = 0): Promise<void> => {
    for (let i = 0; i < 3; i++) {
      harness.fixture.detectChanges();
      await harness.fixture.whenStable();
      if (ms) await wait(ms);
    }
    harness.fixture.detectChanges();
    await harness.fixture.whenStable();
  };

  const open = async (url: string) => {
    const harness = await RouterTestingHarness.create(url);
    // Initial read waits 200ms after the configuration is ready.
    await settle(harness, 150);
    const table = harness.fixture.debugElement.query(By.directive(SdTable)).componentInstance as SdTable<Row>;
    return { harness, table, host: harness.routeDebugElement!.componentInstance as TableSyncHost };
  };

  const tableParam = () => router.parseUrl(router.url).queryParamMap.get('table-customers');

  it('restores filter, sort, page and page size from the URL with a single read', async () => {
    await open(`/p?table-customers=${param({ c: { name: 'An' }, s: ['amount', 'desc'], p: 3, z: 50 })}`);

    expect(loader).toHaveBeenCalledTimes(1);
    const request = firstArg(0);
    expect(request.rawColumnFilter).toEqual(jasmine.objectContaining({ name: 'An' }));
    expect(request.orderBy).toBe('amount');
    expect(request.orderDirection).toBe('DESC');
    expect(request.pageNumber).toBe(2);
    expect(request.pageSize).toBe(50);
    expect(tableParam()).toBe('{"c":{"name":"An"},"s":["amount","desc"],"p":3,"z":50}');
  });

  it('writes filter changes and removes the param when the state is back to default', async () => {
    const { harness, table } = await open('/p');
    expect(tableParam()).toBeNull();

    table.setFilter({ columnFilter: { name: 'Bo' } });
    await settle(harness, 300);
    expect(tableParam()).toBe('{"c":{"name":"Bo"}}');

    table.clearFilter();
    await settle(harness, 300);
    expect(tableParam()).toBeNull();
  });

  it('writes sort and page changes', async () => {
    const { harness, table } = await open('/p');
    table.sort()!.sort({ id: 'amount', start: 'desc', disableClear: false });
    await settle(harness, 150);
    expect(tableParam()).toBe('{"s":["amount","desc"]}');

    const paginator = table.paginator()!;
    paginator.pageIndex = 1;
    paginator.page.emit({ pageIndex: 1, previousPageIndex: 0, pageSize: 10, length: 300 });
    await settle(harness, 150);
    expect(tableParam()).toBe('{"s":["amount","desc"],"p":2}');
  });

  it('applies a param changed from outside with one more read, and keeps the state when the param disappears', async () => {
    const { harness } = await open('/p');
    const reads = loader.calls.count();

    await router.navigateByUrl(`/p?table-customers=${param({ c: { name: 'Cu' } })}`);
    await settle(harness, 150);
    expect(loader.calls.count()).toBe(reads + 1);
    expect(firstArg(reads).rawColumnFilter).toEqual(jasmine.objectContaining({ name: 'Cu' }));

    await router.navigateByUrl('/p');
    await settle(harness, 150);
    expect(tableParam()).toBe('{"c":{"name":"Cu"}}');
    expect(loader.calls.count()).toBe(reads + 1);
  });

  it('ignores a malformed param and writes the current state back', async () => {
    await open(`/p?table-customers=${param('{oops')}`);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(firstArg(0).rawColumnFilter['name']).toBeFalsy();
    expect(tableParam()).toBeNull();
  });

  it('lets the link win over cached filters (filter.key + cacheable)', async () => {
    hostOption = () => ({ ...serverOption(), filter: { key: CACHE_KEY, cacheable: true } });
    const { harness, table } = await open('/p');
    table.setFilter({ columnFilter: { name: 'Cached' } });
    await settle(harness, 300);

    await router.navigateByUrl('/blank');
    await settle(harness);
    loader.calls.reset();
    await router.navigateByUrl(`/p?table-customers=${param({ c: { name: 'Linked' } })}`);
    await settle(harness, 150);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(firstArg(0).rawColumnFilter).toEqual(jasmine.objectContaining({ name: 'Linked' }));
  });

  it('writes the cached filters to the URL when the link has none', async () => {
    hostOption = () => ({ ...serverOption(), filter: { key: CACHE_KEY, cacheable: true } });
    const { harness, table } = await open('/p');
    table.setFilter({ columnFilter: { name: 'Cached' } });
    await settle(harness, 300);

    await router.navigateByUrl('/blank');
    await settle(harness);
    await router.navigateByUrl('/p');
    await settle(harness, 150);
    expect(tableParam()).toBe('{"c":{"name":"Cached"}}');
  });

  it('ignores filters on a column whose filter is disabled', async () => {
    hostOption = () => {
      const option = serverOption();
      option.columns = [{ field: 'name', title: 'Name', type: 'string', filter: { disabled: true } }, ...option.columns.slice(1)];
      return option;
    };
    await open(`/p?table-customers=${param({ c: { name: 'Hidden', amount: 5 } })}`);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(firstArg(0).rawColumnFilter['name']).toBeFalsy();
    expect(firstArg(0).rawColumnFilter['amount']).toBe(5);
  });

  it('restores only the page size when the table has no total', async () => {
    loader.and.callFake(async () => ({ items: [{ id: 1, name: 'A', amount: 1 }], hasMore: true }));
    hostOption = () => serverOption({ total: 'unknown', pageSize: 10, pages: [10, 20] });
    await open(`/p?table-customers=${param({ p: 3, z: 20 })}`);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(firstArg(0).pageNumber).toBe(0);
    expect(firstArg(0).pageSize).toBe(20);
    expect(tableParam()).toBe('{"z":20}');
  });

  it('is off by default', async () => {
    @Component({
      standalone: true,
      selector: 'sd-table-sync-default-host',
      imports: [SdTable],
      template: `<sd-table autoId="customers" [option]="option"></sd-table>`,
    })
    class DefaultHost {
      readonly option = serverOption();
    }
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [provideRouter([{ path: 'p', component: DefaultHost }])],
    });
    const harness = await RouterTestingHarness.create(`/p?table-customers=${param({ c: { name: 'An' } })}`);
    await settle(harness, 150);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(firstArg(0).rawColumnFilter['name']).toBeFalsy();
    const table = harness.fixture.debugElement.query(By.directive(SdTable)).componentInstance as SdTable<Row>;
    table.setFilter({ columnFilter: { name: 'Bo' } });
    await settle(harness, 300);
    expect(TestBed.inject(Router).parseUrl(TestBed.inject(Router).url).queryParamMap.get('table-customers')).toBe('{"c":{"name":"An"}}');
  });
});
