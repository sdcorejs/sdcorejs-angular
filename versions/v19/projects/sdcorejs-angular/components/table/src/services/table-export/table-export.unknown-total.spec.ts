import { TestBed } from '@angular/core/testing';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdExcelService, SdNotifyService } from '@sdcorejs/angular/services';
import { SdTableOption } from '../../models/table-option.model';
import { SdTableExportContext, TableExportService } from './table-export.service';

describe('TableExportService with paginate.total "unknown"', () => {
  let service: TableExportService;
  let excel: { export: jasmine.Spy; exportCSV: jasmine.Spy };
  let notify: { warning: jasmine.Spy };
  const rows = (from: number, count: number) => Array.from({ length: count }, (_, index) => ({ id: from + index }));
  const option = (extra: Record<string, unknown> = {}) =>
    ({
      type: 'server',
      paginate: { total: 'unknown' },
      columns: [{ field: 'id', title: 'Id', type: 'number' }],
      export: { type: 'default', maxItemsPerRequest: 2, ...extra },
    }) as unknown as SdTableOption;
  const context = (fetchChunk: SdTableExportContext['fetchChunk'], extra: Record<string, unknown> = {}): SdTableExportContext => ({
    option: option(extra),
    total: undefined,
    cacheObjValues: {},
    fetchChunk,
    getFilterInfo: () => ({}) as never,
  });

  beforeEach(() => {
    notify = { warning: jasmine.createSpy('warning') };
    excel = { export: jasmine.createSpy('export').and.resolveTo(), exportCSV: jasmine.createSpy('exportCSV').and.resolveTo() };
    TestBed.configureTestingModule({
      providers: [TableExportService, { provide: SdExcelService, useValue: excel }, { provide: SdNotifyService, useValue: notify }],
    });
    service = TestBed.inject(TableExportService);
  });

  it('fetches chunks until the loader reports hasMore false, without a total', async () => {
    const fetchChunk = jasmine
      .createSpy('fetchChunk')
      .and.callFake(async (pageNumber: number) => ({ items: rows(pageNumber * 2 + 1, pageNumber < 2 ? 2 : 1), hasMore: pageNumber < 2 }));

    await service.exportExcel(context(fetchChunk));

    expect(fetchChunk.calls.allArgs()).toEqual([
      [0, 2],
      [1, 2],
      [2, 2],
    ]);
    expect(excel.export.calls.mostRecent().args[0].items.map((item: { id: number }) => item.id)).toEqual([1, 2, 3, 4, 5]);
    expect(service.exporting()).toBeFalse();
    expect(service.exportTitle()).toBe(TestBed.inject(I18nService).t('core.component.table.export'));
  });

  it('stops at an empty chunk even when hasMore is still true', async () => {
    const fetchChunk = jasmine
      .createSpy('fetchChunk')
      .and.callFake(async (pageNumber: number) => (pageNumber === 0 ? { items: rows(1, 2), hasMore: true } : { items: [], hasMore: true }));

    await service.exportCSV(context(fetchChunk));

    expect(fetchChunk).toHaveBeenCalledTimes(2);
    expect(excel.exportCSV.calls.mostRecent().args[0].items.length).toBe(2);
  });

  it('probes array chunks until a short chunk instead of trusting a full one', async () => {
    const fetchChunk = jasmine.createSpy('fetchChunk').and.callFake(async (pageNumber: number) => (pageNumber === 0 ? rows(1, 2) : []));

    await service.exportExcel(context(fetchChunk));

    expect(fetchChunk).toHaveBeenCalledTimes(2);
    expect(excel.export.calls.mostRecent().args[0].items.length).toBe(2);
  });

  it('stops after a chunk longer than the page: the source ignores paging and sent everything', async () => {
    const fetchChunk = jasmine.createSpy('fetchChunk').and.callFake(async () => rows(1, 5));

    await service.exportExcel(context(fetchChunk));

    expect(fetchChunk).toHaveBeenCalledTimes(1);
    expect(excel.export.calls.mostRecent().args[0].items.length).toBe(5);
  });

  it('caps an endless source at one Excel sheet of rows when export.max is not set', async () => {
    const huge = new Array(1_048_576).fill({ id: 1 });
    const fetchChunk = jasmine.createSpy('fetchChunk').and.callFake(async () => ({ items: huge, hasMore: true }));

    await service.exportExcel(context(fetchChunk, { maxItemsPerRequest: 1_048_576 }));

    expect(fetchChunk).toHaveBeenCalledTimes(1);
    expect(excel.export).not.toHaveBeenCalled();
    expect(notify.warning).toHaveBeenCalledOnceWith(
      TestBed.inject(I18nService).t('core.component.table.export-max-exceeded', { max: 1_048_575, total: 1_048_576 })
    );
  });

  it('ignores chunks fetched in the same batch after the last page', async () => {
    const fetchChunk = jasmine
      .createSpy('fetchChunk')
      .and.callFake(async (pageNumber: number) =>
        pageNumber === 0 ? { items: rows(1, 1), hasMore: false } : { items: rows(9, 2), hasMore: true }
      );

    await service.exportExcel(context(fetchChunk, { batch: 3 }));

    expect(fetchChunk).toHaveBeenCalledTimes(3);
    expect(excel.export.calls.mostRecent().args[0].items.map((item: { id: number }) => item.id)).toEqual([1]);
  });

  it('still enforces export.max on the rows fetched so far', async () => {
    const fetchChunk = jasmine.createSpy('fetchChunk').and.callFake(async () => ({ items: rows(1, 2), hasMore: true }));

    await service.exportExcel(context(fetchChunk, { max: 3 }));

    expect(fetchChunk).toHaveBeenCalledTimes(2);
    expect(excel.export).not.toHaveBeenCalled();
    expect(notify.warning).toHaveBeenCalledOnceWith(
      TestBed.inject(I18nService).t('core.component.table.export-max-exceeded', { max: 3, total: 4 })
    );
  });
});
