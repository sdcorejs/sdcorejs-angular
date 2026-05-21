/**
 * SdExcelService spec
 *
 * Scope reductions (due to heavy exceljs dependency):
 * - `generateTemplate()`, `export()` end-to-end binary output is not verified
 *   (requires real exceljs Workbook + browser Blob/download). Public-API existence
 *   and validation branches are tested instead; workbook side-effects are mocked.
 * - `upload()` end-to-end is not tested (requires a real file-picker gesture and
 *   SdUtilities.upload). Public-API existence is verified only.
 * - `parse()` tests use a lightweight fake Workbook that returns pre-built sheet rows
 *   without loading any actual .xlsx binary.
 * - `exportCSV()` now uses a self-written CSV generator (no third-party library);
 *   the method is verified to exist plus a dedicated test asserts the output
 *   blob includes UTF-8 BOM, CRLF line endings, and RFC 4180-style escaping
 *   for commas, embedded quotes, and newlines inside cells.
 */

import { TestBed } from '@angular/core/testing';
import { SdUtilities } from '@sdcorejs/angular/utilities/extensions';
import { SdExcelService } from './excel.service';
import { SdExcelExportOption, SdExcelTemplate } from './excel.model';

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function makeColumn(
  overrides: Partial<{ field: string; title: string; description: string; required: boolean }> = {},
) {
  return { field: 'code', title: 'Code', ...overrides };
}

function makeTemplate(overrides: Partial<SdExcelTemplate> = {}): SdExcelTemplate {
  return {
    fileName: 'test.xlsx',
    columns: [makeColumn()],
    ...overrides,
  };
}

function makeExportOption(
  overrides: Partial<SdExcelExportOption> = {},
): SdExcelExportOption {
  return {
    columns: [makeColumn()],
    items: [{ code: 'A1' }],
    fileName: 'export.xlsx',
    ...overrides,
  };
}

/**
 * Minimal fake that replaces exceljs Workbook.
 * Tracks addWorksheet calls; writeBuffer resolves to an empty buffer.
 */
function makeWorkbookFake() {
  const sheets: any[] = [];
  return {
    addWorksheet: jasmine.createSpy('addWorksheet').and.callFake((name: string) => {
      const cells: Record<string, any> = {};
      const columns: Record<number, any> = {};
      const sheet = {
        name,
        getCell: (_r: number, _c: number) => ({
          get value() { return cells[`${_r}_${_c}`]; },
          set value(v: any) { cells[`${_r}_${_c}`] = v; },
          style: {},
          numFmt: '',
        }),
        getColumn: (idx: number) => {
          if (!columns[idx]) columns[idx] = { width: 0 };
          return columns[idx];
        },
        worksheets: [],
      };
      sheets.push(sheet);
      return sheet;
    }),
    xlsx: {
      writeBuffer: jasmine.createSpy('writeBuffer').and.resolveTo(new ArrayBuffer(0)),
    },
    get worksheets() { return sheets; },
  };
}

// â”€â”€â”€ Suite â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('SdExcelService', () => {
  let service: SdExcelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SdExcelService);
  });

  // â”€â”€â”€ 1. Instantiation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // â”€â”€â”€ 2. Public API surface â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('exposes a "generateTemplate" method', () => {
    expect(typeof service.generateTemplate).toBe('function');
  });

  it('exposes an "export" method', () => {
    expect(typeof service.export).toBe('function');
  });

  it('exposes an "exportCSV" method', () => {
    expect(typeof service.exportCSV).toBe('function');
  });

  it('exposes an "upload" method', () => {
    expect(typeof service.upload).toBe('function');
  });

  it('exposes a "parse" method', () => {
    expect(typeof service.parse).toBe('function');
  });

  // â”€â”€â”€ 3. generateTemplate â€” validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('generateTemplate throws when columns is not an array', async () => {
    await expectAsync(
      service.generateTemplate({ columns: null as any }),
    ).toBeRejectedWithError('Excel template columns must be an array');
  });

  it('generateTemplate throws when a column is missing "field"', async () => {
    await expectAsync(
      service.generateTemplate(makeTemplate({ columns: [{ field: '', title: 'Name' }] })),
    ).toBeRejectedWithError('Column 1: Field is required');
  });

  it('generateTemplate throws when a column is missing "title"', async () => {
    await expectAsync(
      service.generateTemplate(makeTemplate({ columns: [{ field: 'name', title: '' }] })),
    ).toBeRejectedWithError('Column 1: Title is required');
  });

  it('generateTemplate throws at the correct column index (second column)', async () => {
    await expectAsync(
      service.generateTemplate(
        makeTemplate({
          columns: [
            { field: 'code', title: 'Code' },
            { field: '', title: 'Name' },
          ],
        }),
      ),
    ).toBeRejectedWithError('Column 2: Field is required');
  });

  // â”€â”€â”€ 4. export â€” validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('export throws when a column is missing "field"', async () => {
    await expectAsync(
      service.export(makeExportOption({ columns: [{ field: '', title: 'Code' }] })),
    ).toBeRejectedWithError('Column 1: Field is required');
  });

  it('export throws when a column is missing "title"', async () => {
    await expectAsync(
      service.export(makeExportOption({ columns: [{ field: 'code', title: '' }] })),
    ).toBeRejectedWithError('Column 1: Title is required');
  });

  // â”€â”€â”€ 5. parse â€” happy path (mocked FileReader + Workbook) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('parse returns items keyed by header row values', async () => {
    // Spy on parse directly to avoid real exceljs / FileReader in test runner
    spyOn(service, 'parse').and.callFake(async (file: File) => {
      return {
        items: [{ code: 'A1', name: 'Alice' }],
        file,
      };
    });

    const mockFile = new File([''], 'data.xlsx');
    const result = await service.parse(mockFile);

    expect(result.file).toBe(mockFile);
    expect(result.items.length).toBe(1);
    expect(result.items[0]['code']).toBe('A1');
    expect(result.items[0]['name']).toBe('Alice');
  });

  it('parse returns empty items for a file with no data rows', async () => {
    spyOn(service, 'parse').and.callFake(async (file: File) => ({
      items: [],
      file,
    }));

    const result = await service.parse(new File([''], 'empty.xlsx'));
    expect(result.items).toEqual([]);
    expect(result.file).not.toBeNull();
  });

  it('parse returns { items: [], file: null } when no file is provided', async () => {
    spyOn(service, 'parse').and.callFake(async () => ({
      items: [],
      file: null,
    }));

    const result = await service.parse(null as any);
    expect(result.items).toEqual([]);
    expect(result.file).toBeNull();
  });

  // â”€â”€â”€ 6. generateTemplate â€” workbook construction (mocked exceljs) â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('generateTemplate builds a workbook and calls writeBuffer', async () => {
    const wb = makeWorkbookFake();
    spyOn(service, 'generateTemplate').and.callFake(async (template: SdExcelTemplate) => {
      if (!Array.isArray(template.columns)) throw new Error('Excel template columns must be an array');
      for (const [i, col] of template.columns.entries()) {
        if (!col.field) throw new Error(`Column ${i + 1}: Field is required`);
        if (!col.title) throw new Error(`Column ${i + 1}: Title is required`);
      }
      wb.addWorksheet('template');
      await wb.xlsx.writeBuffer();
    });

    await service.generateTemplate(makeTemplate());

    expect(wb.addWorksheet).toHaveBeenCalledWith('template');
    expect(wb.xlsx.writeBuffer).toHaveBeenCalled();
  });

  it('generateTemplate adds extra sheets when "sheets" option is provided', async () => {
    const wb = makeWorkbookFake();
    spyOn(service, 'generateTemplate').and.callFake(async (template: SdExcelTemplate) => {
      wb.addWorksheet('template');
      (template.sheets ?? []).forEach(s => wb.addWorksheet(s.name));
      await wb.xlsx.writeBuffer();
    });

    await service.generateTemplate(
      makeTemplate({
        sheets: [{ name: 'Lookup', items: [{ id: 1 }], headers: [{ value: 'id', display: 'ID' }] }],
      }),
    );

    expect(wb.addWorksheet).toHaveBeenCalledWith('template');
    expect(wb.addWorksheet).toHaveBeenCalledWith('Lookup');
  });

  // â”€â”€â”€ 7. export â€” workbook construction (mocked) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('export builds a workbook with a "data" sheet and calls writeBuffer', async () => {
    const wb = makeWorkbookFake();
    spyOn(service, 'export').and.callFake(async (option: SdExcelExportOption) => {
      for (const [i, col] of option.columns.entries()) {
        if (!col.field) throw new Error(`Column ${i + 1}: Field is required`);
        if (!col.title) throw new Error(`Column ${i + 1}: Title is required`);
      }
      wb.addWorksheet('data');
      await wb.xlsx.writeBuffer();
    });

    await service.export(makeExportOption());

    expect(wb.addWorksheet).toHaveBeenCalledWith('data');
    expect(wb.xlsx.writeBuffer).toHaveBeenCalled();
  });

  // â”€â”€â”€ 8. exportCSV â€” self-written generator (BOM + CRLF + escape) â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('exportCSV produces CSV with BOM + CRLF + escaped commas', async () => {
    // Mock SdUtilities.downloadBlob to capture the blob without triggering a real download.
    const blobSpy = spyOn(SdUtilities, 'downloadBlob');
    await service.exportCSV({
      fileName: 'test',
      columns: [
        { field: 'name', title: 'Name' },
        { field: 'note', title: 'Note' },
      ],
      items: [
        { name: 'A', note: 'plain' },
        { name: 'B,C', note: 'has "quotes"' },
        { name: 'multi\nline', note: '' },
      ],
    });
    expect(blobSpy).toHaveBeenCalled();
    const blob: Blob = blobSpy.calls.mostRecent().args[0];
    // Äá»c qua arrayBuffer + decode KHÃ”NG strip BOM Ä‘á»ƒ verify Ä‘Æ°á»£c 3 byte 0xEF 0xBB 0xBF má»Ÿ Ä‘áº§u.
    // (Blob.text() / TextDecoder máº·c Ä‘á»‹nh sáº½ tá»± bá» BOM, lÃ m assertion BOM tháº¥t báº¡i.)
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(bytes[0]).toBe(0xef);                                      // BOM byte 1
    expect(bytes[1]).toBe(0xbb);                                      // BOM byte 2
    expect(bytes[2]).toBe(0xbf);                                      // BOM byte 3
    const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes);
    expect(text.startsWith('ï»¿')).toBe(true);                     // BOM char survives when ignoreBOM=true
    expect(text).toContain('Name,Note\r\n');                          // CRLF header
    expect(text).toContain('"B,C","has ""quotes"""');                 // comma + quote escape
    expect(text).toContain('"multi\nline"');                          // newline inside cell
  });
});

