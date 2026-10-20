import { signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { PagingReq } from '@sdcorejs/utils/models';
import { SdTableUnknownTotalPaginator } from './components/unknown-total-paginator/unknown-total-paginator.component';
import { SdTableOption, SdTableServerHasMoreResult } from './models/table-option.model';
import { SdTableFilterRequest } from './services/table-filter/table-filter.model';
import { SdTable } from './table.component';

interface Row {
  id: number;
  name: string;
}

const rows = (from: number, count: number): Row[] =>
  Array.from({ length: count }, (_, index) => ({ id: from + index, name: `Row ${from + index}` }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Offset/limit source that fetches one lookahead row, like the documented consumer. */
function lookahead(source: () => Row[]) {
  return async (_filter: SdTableFilterRequest<Row>, paging: PagingReq<Row>): Promise<SdTableServerHasMoreResult<Row>> => {
    const size = paging.pageSize!;
    const offset = paging.pageNumber! * size;
    const slice = source().slice(offset, offset + size + 1);
    return { items: slice.slice(0, size), hasMore: slice.length > size };
  };
}

/** Loader whose responses the test settles one by one, in any order. */
function manualServer() {
  const calls: { filter: SdTableFilterRequest<Row>; paging: PagingReq<Row>; reply: ReturnType<typeof deferred<unknown>> }[] = [];
  const loader = jasmine.createSpy('loader').and.callFake((filter: SdTableFilterRequest<Row>, paging: PagingReq<Row>) => {
    const reply = deferred<unknown>();
    calls.push({ filter, paging, reply });
    return reply.promise;
  });
  return { loader, calls };
}

describe('SdTable paginate.total "unknown"', () => {
  // why: the Karma frame is narrower than the mobile breakpoint; pin desktop unless a test opts into mobile.
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [SdTable, NoopAnimationsModule],
      providers: [{ provide: SdViewportService, useValue: { isMobile: signal(false) } }],
    })
  );

  function setup(loader: jasmine.Spy, extra: Partial<SdTableOption<Row>> = {}) {
    const f = TestBed.createComponent(SdTable<Row>);
    const option = {
      type: 'server',
      items: loader,
      columns: [{ field: 'name', type: 'string', title: 'Name', sortable: true }],
      paginate: { total: 'unknown', pageSize: 3, pages: [3, 5] },
      sort: { enable: true },
      ...extra,
    } as SdTableOption<Row>;
    f.componentRef.setInput('option', option);
    f.componentRef.setInput('autoId', 'events');
    f.detectChanges();
    settle(f);
    return { f, table: f.componentInstance };
  }

  /** Let the scheduled read start (200 ms), resolve microtasks and render. */
  function settle(f: ComponentFixture<SdTable<Row>>) {
    tick(250);
    flushMicrotasks();
    tick();
    f.detectChanges();
  }

  function view(f: ComponentFixture<SdTable<Row>>) {
    const host = f.nativeElement as HTMLElement;
    const pager = host.querySelector('sd-table-unknown-total-paginator') as HTMLElement | null;
    return {
      host,
      pager,
      range: pager?.querySelector('.mat-mdc-paginator-range-label')?.textContent?.trim() ?? null,
      previous: pager?.querySelector('.mat-mdc-paginator-navigation-previous') as HTMLButtonElement,
      next: pager?.querySelector('.mat-mdc-paginator-navigation-next') as HTMLButtonElement,
      rowCount: host.querySelectorAll('tr.c-row').length,
      error: host.querySelector('sd-data-state [role="alert"]') as HTMLElement | null,
      empty: host.querySelector('.c-no-data-row') as HTMLElement | null,
      summary: host.querySelector('.c-summary')?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
    };
  }

  const disabled = (button: HTMLButtonElement) => button.getAttribute('aria-disabled') === 'true';
  const ids = (table: SdTable<Row>) => table.items().map(item => item.data.id);
  const pager = (f: ComponentFixture<SdTable<Row>>) =>
    f.debugElement.query(By.directive(SdTableUnknownTotalPaginator)).componentInstance as SdTableUnknownTotalPaginator;

  describe('navigation', () => {
    it('loads the first page by offset and shows only the rows it received, without a total', fakeAsync(() => {
      const loader = jasmine.createSpy('loader').and.callFake(lookahead(() => rows(1, 7)));
      const { f, table } = setup(loader);
      const v = view(f);

      expect(loader.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ pageNumber: 0, pageSize: 3 }));
      expect(loader.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({ pageNumber: 0, pageSize: 3 }));
      expect(ids(table)).toEqual([1, 2, 3]);
      expect(v.range).toBe('1-3');
      expect(v.host.querySelector('mat-paginator')).toBeNull();
      expect(v.pager!.querySelector('.mat-mdc-paginator-navigation-last')).toBeNull();
      expect(v.pager!.textContent).not.toContain('/');
      expect(table.total()).toBeUndefined();
      expect(disabled(v.previous)).toBeTrue();
      expect(disabled(v.next)).toBeFalse();
      f.destroy();
    }));

    it('walks Next/Previous with offset pageNumber * pageSize and an honest short last page', fakeAsync(() => {
      const loader = jasmine.createSpy('loader').and.callFake(lookahead(() => rows(1, 7)));
      const { f, table } = setup(loader);

      view(f).next.click();
      settle(f);
      expect(ids(table)).toEqual([4, 5, 6]);
      expect(view(f).range).toBe('4-6');
      expect(table.pageOffset()).withContext('row numbers follow the shown page').toBe(3);
      expect(disabled(view(f).previous)).toBeFalse();

      view(f).next.click();
      settle(f);
      expect(ids(table)).toEqual([7]);
      expect(view(f).range).toBe('7-7');
      expect(disabled(view(f).next))
        .withContext('hasMore false')
        .toBeTrue();

      view(f).previous.click();
      settle(f);
      expect(view(f).range).toBe('4-6');
      expect(loader.calls.allArgs().map(([, paging]) => paging.pageNumber)).toEqual([0, 1, 2, 1]);
      f.destroy();
    }));

    it('disables Next on a full page when the loader says hasMore false', fakeAsync(() => {
      const loader = jasmine.createSpy('loader').and.callFake(lookahead(() => rows(1, 6)));
      const { f } = setup(loader);
      view(f).next.click();
      settle(f);
      expect(view(f).range).toBe('4-6');
      expect(disabled(view(f).next)).toBeTrue();
      view(f).next.click();
      settle(f);
      expect(loader).toHaveBeenCalledTimes(2);
      f.destroy();
    }));

    it('ignores duplicate clicks and out-of-range page requests while a page is pending', fakeAsync(() => {
      const loader = jasmine.createSpy('loader').and.callFake(lookahead(() => rows(1, 20)));
      const { f, table } = setup(loader);
      const next = view(f).next;
      next.click();
      next.click();
      f.detectChanges();
      expect(disabled(next)).toBeTrue();
      expect(view(f).pager!.getAttribute('aria-busy')).toBe('true');
      next.click();
      table.onUnknownTotalPage({ pageIndex: 5, pageSize: 3 });
      settle(f);
      expect(loader.calls.allArgs().map(([, paging]) => paging.pageNumber)).toEqual([0, 1]);
      table.onUnknownTotalPage({ pageIndex: 5, pageSize: 3 });
      settle(f);
      expect(loader).toHaveBeenCalledTimes(2);
      expect(view(f).range).toBe('4-6');
      f.destroy();
    }));

    it('keeps keyboard focus on Next while the page loads', fakeAsync(() => {
      const loader = jasmine.createSpy('loader').and.callFake(lookahead(() => rows(1, 20)));
      const { f } = setup(loader);
      const next = view(f).next;
      next.focus();
      next.click();
      f.detectChanges();
      expect(document.activeElement).toBe(next);
      expect(next.getAttribute('tabindex')).toBe('-1');
      settle(f);
      expect(document.activeElement).toBe(next);
      expect(disabled(next)).toBeFalse();
      expect(next.getAttribute('tabindex')).not.toBe('-1');
      f.destroy();
    }));

    it('hides the paginator when the first page is the only page and summarises without a total', fakeAsync(() => {
      const { f } = setup(jasmine.createSpy('loader').and.callFake(lookahead(() => rows(1, 2))));
      expect(view(f).pager).toBeNull();
      expect(view(f).summary).toContain('1-2');
      expect(view(f).summary).not.toContain('/');
      f.destroy();
    }));

    it('shows the empty state without a range for an empty first page', fakeAsync(() => {
      const { f, table } = setup(jasmine.createSpy('loader').and.resolveTo({ items: [], hasMore: false }));
      expect(table.readState().status).toBe('empty');
      expect(view(f).pager).toBeNull();
      expect(view(f).summary).toBeNull();
      expect(view(f).empty).not.toBeNull();
      f.destroy();
    }));

    it('drops a lookahead row returned past pageSize and treats it as a next page', fakeAsync(() => {
      const { f, table } = setup(jasmine.createSpy('loader').and.resolveTo({ items: rows(1, 4), hasMore: false }));
      expect(ids(table)).toEqual([1, 2, 3]);
      expect(view(f).range).toBe('1-3');
      expect(disabled(view(f).next)).toBeFalse();
      f.destroy();
    }));

    it('stops on an empty page after the source shrank, without a range or an endless Next', fakeAsync(() => {
      let source = rows(1, 6);
      const loader = jasmine.createSpy('loader').and.callFake(lookahead(() => source));
      const { f, table } = setup(loader);
      source = rows(1, 3);
      view(f).next.click();
      settle(f);
      expect(ids(table)).toEqual([]);
      expect(view(f).range).toBe('');
      expect(view(f).empty).not.toBeNull();
      expect(disabled(view(f).next)).toBeTrue();
      expect(disabled(view(f).previous)).toBeFalse();
      view(f).next.click();
      settle(f);
      expect(loader).toHaveBeenCalledTimes(2);

      view(f).previous.click();
      settle(f);
      expect(ids(table)).toEqual([1, 2, 3]);
      expect(view(f).pager).withContext('page 1 is now the only page').toBeNull();
      expect(view(f).summary).toContain('1-3');
      f.destroy();
    }));

    it('fails the read instead of guessing when the loader omits hasMore', fakeAsync(() => {
      const { f, table } = setup(jasmine.createSpy('loader').and.resolveTo({ items: rows(1, 3), total: 3 }));
      expect(table.readState().status).toBe('error');
      expect(table.items()).toEqual([]);
      expect(view(f).error).not.toBeNull();
      f.destroy();
    }));
  });

  describe('resets to the first page', () => {
    function onSecondPage() {
      const loader = jasmine.createSpy('loader').and.callFake(lookahead(() => rows(1, 20)));
      const ctx = setup(loader);
      view(ctx.f).next.click();
      settle(ctx.f);
      expect(view(ctx.f).range).toBe('4-6');
      return { ...ctx, loader };
    }

    it('on page size change and commits the new size only after the page loads', fakeAsync(() => {
      const { f, table, loader } = onSecondPage();
      const pending = deferred<SdTableServerHasMoreResult<Row>>();
      loader.and.returnValue(pending.promise);
      pager(f).changePageSize(5);
      f.detectChanges();
      tick(250);
      f.detectChanges();
      expect(loader.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({ pageNumber: 0, pageSize: 5 }));
      expect(view(f).range).withContext('old rows stay labelled as the old page while loading').toBe('4-6');
      expect(table.pageOffset()).toBe(3);
      pending.resolve({ items: rows(1, 5), hasMore: true });
      settle(f);
      expect(view(f).range).toBe('1-5');
      expect(table.pageOffset()).toBe(0);
      f.destroy();
    }));

    it('on filter change, keeps the page size and blocks paging of the old query during the debounce', fakeAsync(() => {
      const { f, table, loader } = onSecondPage();
      table.filterRegister.value.set({ columnFilter: { name: 'Row' } });
      f.detectChanges();
      expect(disabled(view(f).next)).toBeTrue();
      expect(disabled(view(f).previous)).toBeTrue();
      tick(800);
      flushMicrotasks();
      tick();
      f.detectChanges();
      const [filter, paging] = loader.calls.mostRecent().args;
      expect(paging).toEqual(jasmine.objectContaining({ pageNumber: 0, pageSize: 3 }));
      expect(filter.rawColumnFilter).toEqual({ name: 'Row' });
      expect(view(f).range).toBe('1-3');
      f.destroy();
    }));

    it('on sort change', fakeAsync(() => {
      const { f, table, loader } = onSecondPage();
      table.sort()!.sort({ id: 'name', start: 'desc', disableClear: false });
      settle(f);
      const [filter, paging] = loader.calls.mostRecent().args;
      expect(paging.pageNumber).toBe(0);
      expect(filter.orderBy).toBe('name');
      expect(view(f).range).toBe('1-3');
      f.destroy();
    }));
  });

  describe('errors, retry and stale responses', () => {
    function firstPageShown() {
      const server = manualServer();
      const ctx = setup(server.loader);
      server.calls[0].reply.resolve({ items: rows(1, 3), hasMore: true });
      settle(ctx.f);
      expect(view(ctx.f).range).toBe('1-3');
      return { ...ctx, ...server };
    }

    function goTo(f: ComponentFixture<SdTable<Row>>, button: HTMLButtonElement) {
      button.click();
      f.detectChanges();
      tick(250);
      f.detectChanges();
    }

    it('keeps rows and range of the shown page while Next loads, and locks every control', fakeAsync(() => {
      const { f, table, calls } = firstPageShown();
      goTo(f, view(f).next);
      expect(table.loading()).toBeTrue();
      expect(calls[1].paging).toEqual(jasmine.objectContaining({ pageNumber: 1, pageSize: 3 }));
      expect(view(f).rowCount).toBe(3);
      expect(view(f).range).toBe('1-3');
      expect(disabled(view(f).next)).toBeTrue();
      expect(disabled(view(f).previous)).toBeTrue();
      expect(view(f).pager!.querySelector('mat-select')!.getAttribute('aria-disabled')).toBe('true');
      calls[1].reply.resolve({ items: rows(4, 3), hasMore: false });
      settle(f);
      expect(view(f).range).toBe('4-6');
      f.destroy();
    }));

    it('a failed Next never labels page-1 rows as page 2: rows clear, range hides, retry asks for page 2 again', fakeAsync(() => {
      const { f, table, calls } = firstPageShown();
      goTo(f, view(f).next);
      calls[1].reply.reject(new Error('timeout'));
      flushMicrotasks();
      f.detectChanges();

      expect(table.readState().status).toBe('error');
      expect(table.items()).toEqual([]);
      expect(view(f).rowCount).toBe(0);
      expect(view(f).range).toBe('');
      expect(view(f).error).not.toBeNull();
      expect(view(f).error!.compareDocumentPosition(view(f).pager!) & Node.DOCUMENT_POSITION_FOLLOWING)
        .withContext('error and retry sit in the table area, above the paginator')
        .toBeTruthy();
      expect(disabled(view(f).previous)).toBeFalse();
      expect(disabled(view(f).next)).toBeTrue();

      table.retryRead();
      table.retryRead();
      flushMicrotasks();
      expect(calls.length).toBe(3);
      expect(calls[2].paging).toEqual(calls[1].paging);
      expect(calls[2].filter).toEqual(calls[1].filter);
      calls[2].reply.resolve({ items: rows(4, 2), hasMore: false });
      settle(f);
      expect(table.readState().status).toBe('ready');
      expect(view(f).range).toBe('4-5');
      expect(disabled(view(f).next)).toBeTrue();
      f.destroy();
    }));

    it('Previous after a failed Next returns to the page before the failed one', fakeAsync(() => {
      const { f, calls } = firstPageShown();
      goTo(f, view(f).next);
      calls[1].reply.reject(new Error('timeout'));
      flushMicrotasks();
      f.detectChanges();
      goTo(f, view(f).previous);
      expect(calls[2].paging).toEqual(jasmine.objectContaining({ pageNumber: 0, pageSize: 3 }));
      calls[2].reply.resolve({ items: rows(1, 3), hasMore: true });
      settle(f);
      expect(view(f).range).toBe('1-3');
      expect(disabled(view(f).next)).toBeFalse();
      f.destroy();
    }));

    it('a failed Previous stays on its target and retries it', fakeAsync(() => {
      const { f, table, calls } = firstPageShown();
      goTo(f, view(f).next);
      calls[1].reply.resolve({ items: rows(4, 3), hasMore: true });
      settle(f);
      goTo(f, view(f).previous);
      calls[2].reply.reject(new Error('offline'));
      flushMicrotasks();
      f.detectChanges();
      expect(view(f).range).toBe('');
      expect(disabled(view(f).previous))
        .withContext('the failed target is the first page')
        .toBeTrue();
      expect(disabled(view(f).next)).toBeTrue();
      table.retryRead();
      flushMicrotasks();
      expect(calls[3].paging).toEqual(jasmine.objectContaining({ pageNumber: 0, pageSize: 3 }));
      calls[3].reply.resolve({ items: rows(1, 3), hasMore: true });
      settle(f);
      expect(view(f).range).toBe('1-3');
      f.destroy();
    }));

    it('a failed page size change keeps the requested size for retry and labels no rows', fakeAsync(() => {
      const { f, table, calls } = firstPageShown();
      pager(f).changePageSize(5);
      f.detectChanges();
      tick(250);
      calls[1].reply.reject(new Error('500'));
      flushMicrotasks();
      f.detectChanges();
      expect(table.unknownTotalPager()).toEqual(jasmine.objectContaining({ pageIndex: 0, pageSize: 5, range: undefined, hasNext: false }));
      table.retryRead();
      flushMicrotasks();
      expect(calls[2].paging).toEqual(jasmine.objectContaining({ pageNumber: 0, pageSize: 5 }));
      calls[2].reply.resolve({ items: rows(1, 5), hasMore: true });
      settle(f);
      expect(view(f).range).toBe('1-5');
      f.destroy();
    }));

    for (const staleFails of [false, true]) {
      it(`ignores a stale ${staleFails ? 'error' : 'page'} that arrives after a newer filter read`, fakeAsync(() => {
        const { f, table, calls } = firstPageShown();
        goTo(f, view(f).next);
        table.filterRegister.value.set({ columnFilter: { name: 'x' } });
        tick(800);
        f.detectChanges();
        expect(calls[2].paging).toEqual(jasmine.objectContaining({ pageNumber: 0, pageSize: 3 }));
        calls[2].reply.resolve({ items: rows(10, 2), hasMore: false });
        settle(f);
        if (staleFails) calls[1].reply.reject(new Error('late'));
        else calls[1].reply.resolve({ items: rows(4, 3), hasMore: true });
        settle(f);
        expect(table.readState().status).toBe('ready');
        expect(table.loading()).toBeFalse();
        expect(ids(table)).toEqual([10, 11]);
        expect(view(f).pager).withContext('the newer single page decides the paginator').toBeNull();
        expect(view(f).summary).toContain('1-2');
        f.destroy();
      }));
    }

    it('reload() refreshes the current page and keeps its position', fakeAsync(() => {
      const { f, table, calls } = firstPageShown();
      goTo(f, view(f).next);
      calls[1].reply.resolve({ items: rows(4, 3), hasMore: true });
      settle(f);
      table.reload();
      flushMicrotasks();
      expect(calls[2].paging).toEqual(jasmine.objectContaining({ pageNumber: 1, pageSize: 3 }));
      calls[2].reply.resolve({ items: rows(4, 1), hasMore: false });
      settle(f);
      expect(view(f).range).toBe('4-4');
      f.destroy();
    }));
  });

  describe('compatibility', () => {
    it('keeps known-total server tables on mat-paginator with the total range', fakeAsync(() => {
      const loader = jasmine.createSpy('loader').and.resolveTo({ items: rows(1, 3), total: 7 });
      const { f, table } = setup(loader, { paginate: { pageSize: 3, pages: [3, 5] } });
      const host = f.nativeElement as HTMLElement;
      expect(host.querySelector('sd-table-unknown-total-paginator')).toBeNull();
      const paginator = host.querySelector('mat-paginator') as HTMLElement;
      expect(paginator.classList.contains('d-none')).toBeFalse();
      expect(paginator.querySelector('.mat-mdc-paginator-range-label')?.textContent?.trim()).toBe('1-3/7');
      expect(table.total()).toBe(7);
      f.destroy();
    }));

    it('ignores paginate.total "unknown" on a local table', fakeAsync(() => {
      const f = TestBed.createComponent(SdTable<Row>);
      f.componentRef.setInput('option', {
        type: 'local',
        items: () => rows(1, 7),
        columns: [{ field: 'name', type: 'string', title: 'Name' }],
        paginate: { total: 'unknown', pageSize: 3 },
      } as SdTableOption<Row>);
      f.detectChanges();
      settle(f);
      const host = f.nativeElement as HTMLElement;
      expect(host.querySelector('sd-table-unknown-total-paginator')).toBeNull();
      expect(host.querySelector('mat-paginator .mat-mdc-paginator-range-label')?.textContent?.trim()).toBe('1-3/7');
      expect(f.componentInstance.total()).toBe(7);
      f.destroy();
    }));

    it('respects paginate.hidden', fakeAsync(() => {
      const { f } = setup(jasmine.createSpy('loader').and.callFake(lookahead(() => rows(1, 7))), {
        paginate: { total: 'unknown', pageSize: 3, hidden: true },
      });
      expect(view(f).pager).toBeNull();
      expect(view(f).summary).toBeNull();
      f.destroy();
    }));

    it('uses the compact mobile paginator: no page size and no First button', fakeAsync(() => {
      TestBed.overrideProvider(SdViewportService, { useValue: { isMobile: signal(true) } });
      const { f } = setup(jasmine.createSpy('loader').and.callFake(lookahead(() => rows(1, 7))), {
        paginate: { total: 'unknown', pageSize: 3, pages: [3, 5], showFirstLastButtons: true },
      });
      expect(view(f).pager).not.toBeNull();
      expect(view(f).pager!.querySelector('.mat-mdc-paginator-page-size')).toBeNull();
      expect(view(f).pager!.querySelector('.mat-mdc-paginator-navigation-first')).toBeNull();
      expect(view(f).range).toBe('1-3');
      f.destroy();
    }));

    it('offers First (but never Last) on desktop when showFirstLastButtons is set', fakeAsync(() => {
      const loader = jasmine.createSpy('loader').and.callFake(lookahead(() => rows(1, 20)));
      const { f } = setup(loader, { paginate: { total: 'unknown', pageSize: 3, showFirstLastButtons: true } });
      view(f).next.click();
      settle(f);
      view(f).next.click();
      settle(f);
      const first = view(f).pager!.querySelector('.mat-mdc-paginator-navigation-first') as HTMLButtonElement;
      expect(view(f).pager!.querySelector('.mat-mdc-paginator-navigation-last')).toBeNull();
      first.click();
      settle(f);
      expect(loader.calls.mostRecent().args[1].pageNumber).toBe(0);
      expect(view(f).range).toBe('1-3');
      f.destroy();
    }));
  });

  describe('reads that never happen', () => {
    it('points the paginator back at the shown page when a filter commit cancels the scheduled filter read', fakeAsync(() => {
      const loader = jasmine.createSpy('loader').and.callFake(lookahead(() => rows(1, 20)));
      const { f, table } = setup(loader);
      view(f).next.click();
      settle(f);
      expect(view(f).range).toBe('4-6');
      table.filterRegister.value.set({ columnFilter: { name: 'Row' } });
      f.detectChanges();
      expect(disabled(view(f).next)).toBeTrue();
      // setFilter + notReload: commit without reading (documented pattern); it cancels the scheduled filter read.
      table.filterRegister.value.set({ columnFilter: { name: 'Row' }, notReload: true });
      tick(800);
      f.detectChanges();
      expect(loader).toHaveBeenCalledTimes(2);
      expect(view(f).range).toBe('4-6');
      expect(table.unknownTotalPager()).toEqual(jasmine.objectContaining({ pageIndex: 1, busy: false, hasNext: true, hasPrevious: true }));
      expect(disabled(view(f).next)).toBeFalse();
      expect(disabled(view(f).previous)).toBeFalse();
      f.destroy();
    }));

    it('releases loading when a commit without reload drops the response in flight', fakeAsync(() => {
      const server = manualServer();
      const { f, table } = setup(server.loader);
      server.calls[0].reply.resolve({ items: rows(1, 3), hasMore: true });
      settle(f);
      view(f).next.click();
      f.detectChanges();
      tick(250);
      expect(table.loading()).toBeTrue();
      table.filterRegister.value.set({ columnFilter: { name: 'x' }, notReload: true });
      server.calls[1].reply.resolve({ items: rows(4, 3), hasMore: true });
      flushMicrotasks();
      f.detectChanges();
      expect(table.loading()).toBeFalse();
      expect(table.readState().status).toBe('idle');
      expect(view(f).range).withContext('the dropped page never labels the rows').toBe('1-3');
      expect(table.unknownTotalPager()).toEqual(jasmine.objectContaining({ pageIndex: 0, busy: false, hasNext: true }));
      view(f).next.click();
      settle(f);
      expect(server.calls.length).toBe(3);
      expect(server.calls[2].filter.rawColumnFilter.name).toBe('x');
      f.destroy();
    }));

    it('warns once when a known-total loader resolves hasMore without a total', fakeAsync(() => {
      const warn = spyOn(console, 'warn');
      const { f, table } = setup(jasmine.createSpy('loader').and.resolveTo({ items: rows(1, 3), hasMore: true }), {
        paginate: { pageSize: 3 },
      });
      table.reload();
      flushMicrotasks();
      tick();
      expect(warn).toHaveBeenCalledOnceWith(jasmine.stringMatching(/paginate: \{ total: 'unknown' \}/));
      expect(table.total()).toBe(0);
      f.destroy();
    }));

    for (const [name, count, filters] of [
      ['hides', 2, 0],
      ['keeps', 20, 1],
    ] as const) {
      it(`${name} inline filters with hideInlineFilter "auto" when the first page ${count < 3 ? 'is' : 'is not'} the whole result`, fakeAsync(() => {
        const { f } = setup(jasmine.createSpy('loader').and.callFake(lookahead(() => rows(1, count))), {
          filter: { hideInlineFilter: 'auto' },
        });
        expect((f.nativeElement as HTMLElement).querySelectorAll('thead column-filter').length).toBe(filters);
        f.destroy();
      }));
    }
  });
});
