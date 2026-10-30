import { TestBed } from '@angular/core/testing';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { SdExcelColumn, SdExcelExportOption, SdExcelService } from '@sdcorejs/angular/services/excel';
import { BrowserUtilities } from '@sdcorejs/utils/fns';
import JSZip from 'jszip';
import { SdTableColumn } from '../../models/table-column.model';
import { SdTableOption } from '../../models/table-option.model';
import { TableExportService, SdTableExportContext } from './table-export.service';

describe('TableExportService typed XLSX dates', () => {
  let service: TableExportService;
  let excel: jasmine.SpyObj<SdExcelService>;

  function setup(timeZone = 'UTC', realWriter = false) {
    TestBed.resetTestingModule();
    excel = jasmine.createSpyObj<SdExcelService>('excel', ['export', 'exportCSV']);
    excel.export.and.resolveTo();
    excel.exportCSV.and.resolveTo();
    TestBed.configureTestingModule({
      providers: [
        TableExportService,
        { provide: SD_CORE_CONFIGURATION, useValue: { timeZone } },
        ...(realWriter ? [] : [{ provide: SdExcelService, useValue: excel }]),
      ],
    });
    service = TestBed.inject(TableExportService);
  }

  function context(
    rows: Record<string, unknown>[],
    columns: SdTableColumn[] = [
      { field: 'date', title: 'Date', type: 'date' },
      { field: 'datetime', title: 'Datetime', type: 'datetime' },
      { field: 'time', title: 'Time', type: 'time' },
    ]
  ): SdTableExportContext {
    return {
      option: { type: 'local', items: () => [], columns } as SdTableOption,
      total: rows.length,
      cacheObjValues: {},
      fetchChunk: async () => rows,
      getFilterInfo: () => ({ columnOperator: {}, rawColumnFilter: {}, rawExternalFilter: {}, pageNumber: 0, pageSize: 100 }),
    };
  }

  async function exportValue(value: unknown) {
    await service.exportExcel(context([{ date: value, datetime: value, time: value }]));
    return excel.export.calls.mostRecent().args[0];
  }

  function formats(result: SdExcelExportOption) {
    // Intersection permits behavioral RED before the optional public property exists.
    return result.columns.map(column => (column as SdExcelColumn & { numFmt?: string }).numFmt);
  }

  beforeEach(() => setup());
  afterEach(() => TestBed.resetTestingModule());

  it('exports typed date, datetime and time with second precision (AC-001..003)', async () => {
    const result = await exportValue('2026-10-28T14:05:09.987Z');
    expect(typeof result.items[0].datetime).toBe('number');
    expect(typeof result.items[0].time).toBe('number');
    expect(result.items[0].date).toBe(46323);
    expect(result.items[0].datetime).toBeCloseTo(46323 + 50709 / 86400, 9);
    expect(result.items[0].time).toBeCloseTo(50709 / 86400, 12);
    expect(formats(result)).toEqual(['dd/mm/yyyy', 'dd/mm/yyyy hh:mm:ss', 'hh:mm:ss']);
  });

  for (const [value, serial] of [
    ['1900-01-01T00:00:00Z', 1],
    ['1900-02-28T00:00:00Z', 59],
    ['1900-03-01T00:00:00Z', 61],
    ['1960-05-20T00:00:00Z', 22056],
    ['2024-02-29T00:00:00Z', 45351],
    ['9999-12-31T23:59:59Z', 2958465],
  ] as const) {
    it(`preserves the Excel calendar for ${value} (AC-004)`, async () => {
      const row = (await exportValue(value)).items[0];
      expect(row.date).toBe(serial);
      expect(typeof row.datetime).toBe('number');
      expect(row.datetime).toBeCloseTo(serial + (value.includes('23:59:59') ? 86399 / 86400 : 0), 9);
    });
  }

  for (const [value, date, datetime] of [
    ['1899-12-31T23:59:59Z', '31/12/1899', '31/12/1899 23:59:59'],
    [new Date('+010000-01-01T00:00:00Z'), '01/01/10000', '01/01/10000 00:00:00'],
  ]) {
    it(`keeps out-of-range calendar data as text: ${value} (AC-004)`, async () => {
      const row = (await exportValue(value)).items[0];
      expect(row.date).toBe(date);
      expect(row.datetime).toBe(datetime);
      expect(typeof row.time).toBe('number');
      expect(row.time).toBeCloseTo(date === '31/12/1899' ? 86399 / 86400 : 0, 12);
    });
  }

  for (const value of [null, undefined, '', 'not a date', '+010000-01-01T00:00:00Z', new Date(NaN), NaN, Infinity]) {
    it(`leaves parser-invalid or absent values blank: ${String(value)} (AC-004)`, async () => {
      expect((await exportValue(value)).items[0]).toEqual({ date: '', datetime: '', time: '' });
    });
  }

  for (const value of [0, new Date(0), '1970-01-01T07:00:00+07:00', '1970/01/01 00:00:00']) {
    it(`accepts epoch/Date/offset/zoneless input: ${String(value)} (AC-004)`, async () => {
      expect((await exportValue(value)).items[0]).toEqual({ date: 25569, datetime: 25569, time: 0 });
    });
  }

  it('keeps the two repeated DST instants at the same wall clock (AC-004)', async () => {
    setup('America/New_York');
    const first = (await exportValue('2026-11-01T05:30:00Z')).items[0];
    const second = (await exportValue('2026-11-01T06:30:00Z')).items[0];
    expect(first).toEqual(second);
    expect(first.time).toBeCloseTo(1.5 / 24, 12);
    expect(first.date).toBe(46327);
  });

  it('crosses the spring DST gap without shifting the configured wall clock (AC-004)', async () => {
    setup('America/New_York');
    expect((await exportValue('2026-03-08T06:59:59Z')).items[0].time).toBeCloseTo(7199 / 86400, 12);
    expect((await exportValue('2026-03-08T07:00:00Z')).items[0].time).toBeCloseTo(3 / 24, 12);
  });

  it('uses local calendar fields when configured local (AC-004)', async () => {
    setup('local');
    const value = new Date(2026, 9, 28, 14, 5, 9, 987);
    expect((await exportValue(value)).items[0]).toEqual({ date: 46323, datetime: 46323 + 50709 / 86400, time: 50709 / 86400 });
  });

  it('preserves transforms, their priority, async results and nullish results (AC-005)', async () => {
    const columnTransform = jasmine.createSpy('columnTransform').and.returnValue('column');
    const exportedTransform = jasmine.createSpy('exportedTransform').and.returnValue('28/10/2026');
    const ctx = context(
      [{ date: 'ignored', datetime: 'ignored', time: 'ignored' }],
      [
        { field: 'date', title: 'Date', type: 'date', transform: columnTransform },
        { field: 'datetime', title: 'Datetime', type: 'datetime', transform: async () => '28/10/2026 14:05:09' },
        { field: 'time', title: 'Time', type: 'time', transform: () => undefined as unknown as string },
      ]
    );
    ctx.option.export = { type: 'default', columns: [{ field: 'date', title: 'Override', transform: exportedTransform }] };
    await service.exportExcel(ctx);
    const result = excel.export.calls.mostRecent().args[0];
    expect(result.items[0]).toEqual({ date: '28/10/2026', datetime: '28/10/2026 14:05:09', time: '' });
    expect(columnTransform).not.toHaveBeenCalled();
    expect(exportedTransform).toHaveBeenCalledWith('ignored', jasmine.any(Object));
    expect(formats(result).every(format => format === undefined)).toBeTrue();
  });

  it('preserves legacy transform resolution when export.type is omitted (AC-005)', async () => {
    const ignored = jasmine.createSpy('ignored').and.returnValue('override');
    const ctx = context([{ date: '2026-10-28T00:00:00Z' }], [{ field: 'date', title: 'Date', type: 'date' }]);
    ctx.option.export = { columns: [{ field: 'date', title: 'Duplicate', transform: ignored }] };
    await service.exportExcel(ctx);
    expect(ignored).not.toHaveBeenCalled();
    expect(excel.export.calls.mostRecent().args[0].items[0].date).toBe(46323);
    expect(formats(excel.export.calls.mostRecent().args[0])).toEqual(['dd/mm/yyyy', 'dd/mm/yyyy']);
  });

  it('does not attach a date format when only the export-column transform handles a field (AC-005)', async () => {
    const ctx = context([{ date: '2026-10-28' }], [{ field: 'date', title: 'Date', type: 'date' }]);
    const exportedColumn = Object.freeze({ field: 'date', title: 'Export date', transform: () => '28/10/2026' });
    ctx.option.export = { type: 'default', columns: [exportedColumn] };
    await service.exportExcel(ctx);
    const result = excel.export.calls.mostRecent().args[0];
    expect(result.items[0].date).toBe('28/10/2026');
    expect(formats(result)).toEqual([undefined, undefined]);
    expect(result.columns[1]).not.toBe(exportedColumn);
  });

  it('maps rows before normalization without mutating source options or rows (AC-004/005)', async () => {
    const row = Object.freeze({ date: '2026-10-27T23:00:00Z' });
    const column = Object.freeze({ field: 'date', title: 'Date', type: 'date' as const });
    const ctx = context([row], [column]);
    ctx.option.export = { mapping: async rows => rows.map(item => ({ ...item, date: '2026-10-28T01:00:00Z' })) };
    Object.freeze(ctx.option.columns);
    Object.freeze(ctx.option.export);
    Object.freeze(ctx.option);
    await service.exportExcel(ctx);
    expect(excel.export.calls.mostRecent().args[0].items).toEqual([{ date: 46323 }]);
    expect(row.date).toBe('2026-10-27T23:00:00Z');
    expect(Object.keys(column)).toEqual(['field', 'title', 'type']);
  });

  it('keeps nested/disabled/configured selection and export-only fields (AC-005)', async () => {
    const ctx = context(
      [{ nested: { date: '2026-10-28' }, disabled: 'ignore', hidden: 'ignore', extra: 'text', count: 12 }],
      [
        {
          field: 'group',
          title: 'Group',
          type: 'children',
          children: [
            { field: 'nested.date', title: 'Date', type: 'date' },
            { field: 'disabled', title: 'Disabled', type: 'date', export: { disabled: true } },
          ],
        },
        { field: 'hidden', title: 'Hidden', type: 'date', hidden: true },
        { field: 'count', title: 'Count', type: 'number' },
      ]
    );
    ctx.option.export = {
      type: 'default',
      columns: [
        { field: 'extra', title: 'Extra' },
        { field: 'off', title: 'Off', export: { disabled: true } },
      ],
    };
    ctx.configuration = { firstColumns: [{ field: 'group' }, { field: 'count' }], secondColumns: [] } as unknown as NonNullable<
      SdTableExportContext['configuration']
    >;
    await service.exportExcel(ctx, [
      { field: 'nested.date', title: 'Ignored explicit title' },
      { field: 'extra', title: 'Extra' },
    ]);
    const result = excel.export.calls.mostRecent().args[0];
    expect(result.columns.map(c => [c.field, c.title])).toEqual([
      ['nested.date', 'Date'],
      ['extra', 'Extra'],
    ]);
    expect(result.items[0]).toEqual({ 'nested.date': 46323, extra: 'text' });
    expect(formats(result)).toEqual(['dd/mm/yyyy', undefined]);
  });

  it('preserves CSV and other column values (AC-005)', async () => {
    const ctx = context([
      { date: '2026-10-28T14:05:09Z', datetime: '2026-10-28T14:05:09Z', time: '2026-10-28T14:05:09Z', count: 0, text: '=1+1' },
    ]);
    ctx.option.columns.push({ field: 'count', title: 'Count', type: 'number' }, { field: 'text', title: 'Text', type: 'string' });
    await service.exportCSV(ctx);
    const csv = excel.exportCSV.calls.mostRecent().args[0];
    expect(csv.items[0]).toEqual({ date: '2026/10/28', datetime: '2026/10/28 14:05:09', time: '14:05:09', count: 0, text: '=1+1' });
    expect(formats(csv).every(format => format === undefined)).toBeTrue();
    await service.exportExcel(ctx);
    expect(excel.export.calls.mostRecent().args[0].items[0]).toEqual(jasmine.objectContaining({ count: 0, text: '=1+1' }));
  });

  it('normalizes dates across unknown-total pages without changing the paging contract', async () => {
    const ctx = context([], [{ field: 'date', title: 'Date', type: 'date' }]);
    ctx.total = undefined;
    ctx.option.export = { type: 'default', maxItemsPerRequest: 1 };
    const fetchChunk = jasmine.createSpy('fetchChunk').and.callFake(async (page: number) => ({
      items: [{ date: page === 0 ? '2026-10-28' : '2026-10-29' }],
      hasMore: page === 0,
    }));
    ctx.fetchChunk = fetchChunk;

    await service.exportExcel(ctx);

    expect(fetchChunk.calls.allArgs()).toEqual([
      [0, 1],
      [1, 1],
    ]);
    const result = excel.export.calls.mostRecent().args[0];
    expect(result.items).toEqual([{ date: 46323 }, { date: 46324 }]);
    expect(formats(result)).toEqual(['dd/mm/yyyy']);
    expect(service.exporting()).toBeFalse();
  });

  it('leaves custom export on its existing callback and ignores default export (AC-005)', async () => {
    const callback = jasmine.createSpy('onExport').and.resolveTo();
    const ctx = context([]);
    ctx.option.export = { type: 'custom', onExport: callback };
    await service.exportExcel(ctx);
    await service.exportCSV(ctx);
    service.exportCustom(ctx);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(callback).toHaveBeenCalledWith(ctx.getFilterInfo());
    expect(excel.export).not.toHaveBeenCalled();
    expect(excel.exportCSV).not.toHaveBeenCalled();
    expect(service.exporting()).toBeFalse();
  });

  it('resets progress and propagates writer failure (AC-005)', async () => {
    excel.export.and.rejectWith(new Error('writer failed'));
    await expectAsync(exportValue('2026-10-28')).toBeRejectedWithError('writer failed');
    expect(service.exporting()).toBeFalse();
    expect(service.exportTitle()).not.toContain('%');
  });

  it('writes numeric calendar serials and formats in the actual XLSX (AC-006)', async () => {
    setup('UTC', true);
    const download = spyOn(BrowserUtilities, 'downloadBlob');
    const ctx = context([
      { date: '1900-01-01', datetime: '2026-10-28T14:05:09.999Z', time: '2026-10-28T00:00:00Z' },
      { date: '1900-02-28', datetime: '2026-10-28T00:00:00Z', time: '2026-10-28T23:59:59Z' },
      { date: '1900-03-01', datetime: null, time: null },
    ]);
    await service.exportExcel(ctx);
    const blob = download.calls.mostRecent().args[0];
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const xml = new DOMParser().parseFromString(await zip.file('xl/worksheets/sheet1.xml')!.async('string'), 'application/xml');
    const styles = await zip.file('xl/styles.xml')!.async('string');
    for (const [address, value] of [
      ['A3', 1],
      ['A4', 59],
      ['A5', 61],
      ['B3', 46323 + 50709 / 86400],
      ['C3', 0],
      ['C4', 86399 / 86400],
    ] as const) {
      const cell = xml.querySelector('c[r="' + address + '"]')!;
      expect(cell.getAttribute('t')).not.toBe('s');
      expect(Number(cell.querySelector('v')!.textContent)).toBeCloseTo(value, 10);
    }
    expect(styles).toContain('dd/mm/yyyy');
    expect(styles).toContain('dd/mm/yyyy hh:mm:ss');
    // hh:mm:ss is Excel's built-in format 21 and need not appear as a custom format.
    const mod = await import('exceljs');
    const workbook = new (mod.Workbook ?? (mod as unknown as { default: typeof mod }).default.Workbook)();
    await workbook.xlsx.load(await blob.arrayBuffer());
    const sheet = workbook.worksheets[0];
    expect(sheet.getCell('B3').numFmt).toBe('dd/mm/yyyy hh:mm:ss');
    expect(sheet.getCell('C3').numFmt).toBe('hh:mm:ss');
    expect(workbook.properties.date1904).toBeFalsy();
  });
});
