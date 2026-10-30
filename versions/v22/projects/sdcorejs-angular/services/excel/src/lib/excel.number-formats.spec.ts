import { TestBed } from '@angular/core/testing';
import type { SdExcelColumn as PublicExcelColumn, SdExcelExportOption as PublicExcelExportOption } from '@sdcorejs/angular/services/excel';
import { BrowserUtilities } from '@sdcorejs/utils/fns';
import JSZip from 'jszip';
import { SdExcelColumn } from './excel.model';
import { SdExcelService } from './excel.service';

describe('SdExcelService real XLSX number formats (AC-006/007)', () => {
  let service: SdExcelService;
  let download: jasmine.Spy<typeof BrowserUtilities.downloadBlob>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SdExcelService);
    download = spyOn(BrowserUtilities, 'downloadBlob');
  });

  async function readWorkbook() {
    const blob = download.calls.mostRecent().args[0];
    const mod = await import('exceljs');
    const Workbook = mod.Workbook ?? (mod as unknown as { default: typeof mod }).default.Workbook;
    const workbook = new Workbook();
    await workbook.xlsx.load(await blob.arrayBuffer());
    return { workbook, blob };
  }

  it('runs the documented example through public column/option types', async () => {
    const dayColumn: PublicExcelColumn = { field: 'day', title: 'Day', numFmt: 'dd/mm/yyyy' };
    const option: PublicExcelExportOption<{ day: number; at: number; label: string }> = {
      fileName: 'dates.xlsx',
      columns: [dayColumn, { field: 'at', title: 'At', numFmt: 'hh:mm:ss' }, { field: 'label', title: 'Label', numFmt: 'dd/mm/yyyy' }],
      items: [{ day: 46323, at: 50709 / 86400, label: '28/10/2026' }],
    };
    await service.export(option);
    const { workbook } = await readWorkbook();
    const sheet = workbook.worksheets[0];
    expect(sheet.getCell('A3').text).toContain('2026');
    expect(sheet.getCell('A3').numFmt).toBe('dd/mm/yyyy');
    expect(sheet.getCell('B3').numFmt).toBe('hh:mm:ss');
    expect(sheet.getCell('C3').value).toBe('28/10/2026');
  });

  it('preserves Core UI integer and decimal defaults when formats are absent or empty', async () => {
    await service.export({
      columns: [
        { field: 'zero', title: 'Zero' },
        { field: 'integer', title: 'Integer', numFmt: '' },
        { field: 'decimal', title: 'Decimal', numFmt: undefined },
        { field: 'override', title: 'Override', numFmt: '0.00' },
      ],
      items: [{ zero: 0, integer: -42, decimal: 42.25, override: 0 }],
    });
    const { workbook } = await readWorkbook();
    const sheet = workbook.worksheets[0];
    expect(sheet.getCell('A3').value).toBe(0);
    expect(sheet.getCell('A3').numFmt).toBe('0');
    expect(sheet.getCell('B3').value).toBe(-42);
    expect(sheet.getCell('B3').numFmt).toBe('0');
    expect(sheet.getCell('C3').value).toBe(42.25);
    expect(sheet.getCell('C3').numFmt).toBeUndefined();
    expect(sheet.getCell('D3').value).toBe(0);
    expect(sheet.getCell('D3').numFmt).toBe('0.00');
  });

  for (const description of [undefined, 'A date description']) {
    it('keeps explicit formats after styling, description=' + String(description), async () => {
      // Variable intersection allows a real behavioral RED before numFmt is added.
      const columns: (SdExcelColumn & { numFmt?: string })[] = [
        { field: 'day', title: 'Day', description, numFmt: 'dd/mm/yyyy' },
        { field: 'instant', title: 'Instant', numFmt: 'dd/mm/yyyy hh:mm:ss' },
        { field: 'time', title: 'Time', numFmt: 'hh:mm:ss' },
        { field: 'amount', title: 'Amount', numFmt: '0.00' },
        { field: 'text', title: 'Text', numFmt: 'dd/mm/yyyy' },
        { field: 'formula', title: 'Formula', numFmt: 'dd/mm/yyyy' },
        { field: 'empty', title: 'Empty', numFmt: 'dd/mm/yyyy' },
        { field: 'bool', title: 'Boolean', numFmt: 'dd/mm/yyyy' },
        { field: 'legacy', title: 'Legacy' },
        { field: 'emptyFormat', title: 'Empty format', numFmt: '' },
      ];
      const date = new Date('2026-10-28T14:05:09Z');
      await service.export({
        columns,
        items: [
          {
            day: 46323,
            instant: date,
            time: 0,
            amount: 12.5,
            text: '28/10/2026',
            formula: '=1+1',
            empty: null,
            bool: true,
            legacy: 42.25,
            emptyFormat: 42.25,
          },
        ],
        fileName: 'typed.xlsx',
        sheets: [{ name: 'lookup', headers: [{ value: 'label', display: 'Label' }], items: [{ label: '=unsafe()' }] }],
      });
      expect(download).toHaveBeenCalledTimes(1);
      expect(download.calls.mostRecent().args[1]).toBe('typed.xlsx');
      expect(date.toISOString()).toBe('2026-10-28T14:05:09.000Z');
      const { workbook, blob } = await readWorkbook();
      expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      const sheet = workbook.worksheets[0];
      const row = description ? 4 : 3;
      expect(sheet.getCell(row, 1).value).toEqual(new Date('2026-10-28T00:00:00Z'));
      expect(sheet.getCell(row, 1).numFmt).toBe('dd/mm/yyyy');
      expect(sheet.getCell(row, 2).value).toEqual(date);
      expect(sheet.getCell(row, 2).numFmt).toBe('dd/mm/yyyy hh:mm:ss');
      expect(sheet.getCell(row, 3).numFmt).toBe('hh:mm:ss');
      expect(sheet.getCell(row, 4).value).toBe(12.5);
      expect(sheet.getCell(row, 4).numFmt).toBe('0.00');
      expect(sheet.getCell(row, 5).value).toBe('28/10/2026');
      expect(sheet.getCell(row, 6).value).toBe("'=1+1");
      expect(sheet.getCell(row, 7).value).toBeNull();
      expect(sheet.getCell(row, 8).value).toBeTrue();
      for (const col of [5, 6, 7, 8, 9, 10]) expect(sheet.getCell(row, col).numFmt).toBeUndefined();
      expect(sheet.getCell(row, 9).value).toBe(42.25);
      expect(sheet.getCell(row, 10).value).toBe(42.25);
      expect(sheet.getCell(row, 1).alignment).toEqual(jasmine.objectContaining({ vertical: 'middle', wrapText: true }));
      expect(sheet.getCell('A1').value).toBe('day');
      expect(sheet.getCell('A2').value).toBe('Day');
      expect(sheet.getCell('A1').numFmt).toBeUndefined();
      expect(sheet.getCell('A2').numFmt).toBeUndefined();
      if (description) {
        expect(sheet.getCell('A3').value).toBe(description);
        expect(sheet.getCell('A3').numFmt).toBeUndefined();
        expect(sheet.getCell('A3').font.italic).toBeTrue();
      }
      expect(workbook.getWorksheet('lookup')!.getCell('A3').value).toBe("'=unsafe()");
      const zip = await JSZip.loadAsync(await blob.arrayBuffer());
      const xml = new DOMParser().parseFromString(await zip.file('xl/worksheets/sheet1.xml')!.async('string'), 'application/xml');
      const midnight = xml.querySelector('c[r="C' + row + '"]')!;
      expect(midnight.getAttribute('t')).not.toBe('s');
      expect(midnight.querySelector('v')!.textContent).toBe('0');
    });
  }

  it('passes a nonempty custom format through without parsing string values', async () => {
    const columns = [{ field: 'value', title: 'Value', numFmt: '0.000 "units"' }];
    await service.export({ columns, items: [{ value: 1.25 }, { value: '1.25' }] });
    const { workbook } = await readWorkbook();
    expect(workbook.worksheets[0].getCell('A3').numFmt).toBe('0.000 "units"');
    expect(workbook.worksheets[0].getCell('A4').value).toBe('1.25');
    expect(workbook.worksheets[0].getCell('A4').numFmt).toBeUndefined();
  });

  it('ignores column formats in CSV and template output', async () => {
    const columns = [{ field: 'date', title: 'Date', description: 'Description', numFmt: 'dd/mm/yyyy' }];
    await service.exportCSV({ columns, items: [{ date: '2026/10/28' }] });
    expect(await download.calls.mostRecent().args[0].text()).toBe('Date\r\n2026/10/28');
    await service.generateTemplate({ columns });
    const { workbook } = await readWorkbook();
    expect(workbook.worksheets[0].name).toBe('template');
    for (const address of ['A1', 'A2', 'A3']) {
      expect(workbook.worksheets[0].getCell(address).numFmt).toBeUndefined();
    }
  });

  it('allows empty rows and columns in the documented export contract', async () => {
    await service.export({ columns: [], items: [] });
    const { workbook } = await readWorkbook();
    expect(workbook.worksheets[0].name).toBe('data');
    expect(workbook.worksheets[0].rowCount).toBe(0);
  });

  it('rejects when the browser download trigger fails', async () => {
    download.and.throwError('download unavailable');
    await expectAsync(service.export({ columns: [], items: [] })).toBeRejectedWithError('download unavailable');
  });
});
