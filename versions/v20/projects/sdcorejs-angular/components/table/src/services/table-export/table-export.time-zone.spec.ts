import { TestBed } from '@angular/core/testing';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { SdExcelService, SdNotifyService } from '@sdcorejs/angular/services';
import { SdTableOption } from '../../models/table-option.model';
import { SdTableExportContext, TableExportService } from './table-export.service';

// CSV keeps wall-clock text; XLSX uses numeric date/time cells in the same zone.

describe('TableExportService with ISdCoreConfiguration.timeZone', () => {
  const option = {
    columns: [
      { field: 'created', title: 'Created', type: 'date' },
      { field: 'updated', title: 'Updated', type: 'datetime' },
      { field: 'at', title: 'At', type: 'time' },
      { field: 'plain', title: 'Plain', type: 'datetime' },
    ],
    export: { type: 'default', fileName: 'report' },
  } as unknown as SdTableOption;
  const row = {
    created: '1960-05-19T16:00:00Z',
    updated: '1960-05-19T16:00:00Z',
    at: '1960-05-19T16:00:00Z',
    plain: '1960/05/20 08:00:00',
  };

  const exportRow = async (timeZone?: string, xlsx = false): Promise<Record<string, unknown>> => {
    const excel = { export: jasmine.createSpy('export').and.resolveTo(), exportCSV: jasmine.createSpy('exportCSV').and.resolveTo() };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        TableExportService,
        { provide: SdExcelService, useValue: excel },
        { provide: SdNotifyService, useValue: { warning: jasmine.createSpy('warning') } },
        ...(timeZone ? [{ provide: SD_CORE_CONFIGURATION, useValue: { timeZone } }] : []),
      ],
    });
    const context: SdTableExportContext = {
      option,
      total: 1,
      cacheObjValues: {},
      fetchChunk: async () => [row],
      getFilterInfo: () => ({ filters: [] }) as never,
    };
    const service = TestBed.inject(TableExportService);
    await (xlsx ? service.exportExcel : service.exportCSV)(context);
    return (xlsx ? excel.export : excel.exportCSV).calls.mostRecent().args[0].items[0];
  };

  afterEach(() => TestBed.resetTestingModule());

  it('writes cells in Asia/Ho_Chi_Minh', async () => {
    expect(await exportRow('Asia/Ho_Chi_Minh')).toEqual(
      jasmine.objectContaining({ created: '1960/05/20', updated: '1960/05/20 00:00:00', at: '00:00:00', plain: '1960/05/20 08:00:00' })
    );
  });

  it('writes cells in Asia/Bangkok', async () => {
    expect(await exportRow('Asia/Bangkok')).toEqual(
      jasmine.objectContaining({ created: '1960/05/19', updated: '1960/05/19 23:00:00', at: '23:00:00', plain: '1960/05/20 08:00:00' })
    );
  });

  it('writes typed XLSX values in historical Ho Chi Minh time (AC-004)', async () => {
    const result = await exportRow('Asia/Ho_Chi_Minh', true);
    expect(result['created']).toBe(22056);
    expect(result['updated']).toBe(22056);
    expect(result['at']).toBe(0);
    expect(result['plain'] as number).toBeCloseTo(22056 + 8 / 24, 9);
  });

  it('writes typed XLSX values in historical Bangkok time (AC-004)', async () => {
    const result = await exportRow('Asia/Bangkok', true);
    expect(result['created']).toBe(22055);
    expect(result['updated'] as number).toBeCloseTo(22055 + 23 / 24, 9);
    expect(result['at'] as number).toBeCloseTo(23 / 24, 12);
    expect(result['plain'] as number).toBeCloseTo(22056 + 8 / 24, 9);
  });
});
