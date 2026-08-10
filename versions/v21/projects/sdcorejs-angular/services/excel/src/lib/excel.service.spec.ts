/**
 * SdExcelService spec
 *
 * Nguyên tắc: MỌI test dưới đây chạy code thật của service.
 *
 * Ranh giới duy nhất bị stub là `BrowserUtilities.downloadBlob` /
 * `BrowserUtilities.upload` — hai hàm này kích hoạt download thật / hộp thoại
 * chọn file của HĐH nên không thể chạy trong Karma. Spy chỉ dùng để BẮT LẤY
 * `Blob` mà service tạo ra; nội dung Blob sau đó được nạp lại bằng exceljs thật
 * và assert từng ô. exceljs KHÔNG bị mock.
 *
 * Lịch sử: bản trước của file này `spyOn(service, 'parse' | 'generateTemplate' | 'export')`
 * rồi `callFake` lại chính logic đó — 6 `it()` không chạy một dòng code thư viện nào.
 * Đừng quay lại pattern đó: nếu một nhánh khó test, hãy tách helper thuần rồi test helper.
 */

import { TestBed } from '@angular/core/testing';
import { BrowserUtilities } from '@sdcorejs/utils/fns';
import { SdExcelService } from './excel.service';
import { SdExcelExportOption, SdExcelTemplate } from './excel.model';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeColumn(overrides: Partial<{ field: string; title: string; description: string; required: boolean }> = {}) {
  return { field: 'code', title: 'Code', ...overrides };
}

function makeTemplate(overrides: Partial<SdExcelTemplate> = {}): SdExcelTemplate {
  return {
    fileName: 'test.xlsx',
    columns: [makeColumn()],
    ...overrides,
  };
}

function makeExportOption(overrides: Partial<SdExcelExportOption> = {}): SdExcelExportOption {
  return {
    columns: [makeColumn()],
    items: [{ code: 'A1' }],
    fileName: 'export.xlsx',
    ...overrides,
  };
}

/**
 * exceljs là CJS; bundler có thể đặt `Workbook` ở `mod.Workbook` hoặc `mod.default.Workbook`.
 * Helper này dùng CHUNG cách chuẩn hoá với service để fixture và code thật nói cùng ngôn ngữ.
 */
async function loadWorkbookCtor(): Promise<new () => import('exceljs').Workbook> {
  const mod: any = await import('exceljs');
  return mod.Workbook ?? mod.default?.Workbook;
}

/** Nạp lại Blob do service ghi ra bằng exceljs thật để assert từng ô. */
async function readWorkbook(blob: Blob): Promise<import('exceljs').Workbook> {
  const Workbook = await loadWorkbookCtor();
  const wb = new Workbook();
  await wb.xlsx.load(await blob.arrayBuffer());
  return wb;
}

/** Dựng một .xlsx thật bằng exceljs (fixture generator — KHÔNG phải code under test). */
async function buildXlsxFile(
  name: string,
  build: (sheet: import('exceljs').Worksheet, workbook: import('exceljs').Workbook) => void
): Promise<File> {
  const Workbook = await loadWorkbookCtor();
  const wb = new Workbook();
  const sheet = wb.addWorksheet('fixture');
  build(sheet, wb);
  const buffer = await wb.xlsx.writeBuffer();
  return new File([buffer], name, { type: XLSX_MIME });
}

/** Đọc giá trị thô của một ô sau khi load lại (exceljs trả `null` cho ô rỗng). */
function cellValue(sheet: import('exceljs').Worksheet, row: number, col: number): any {
  return sheet.getCell(row, col).value;
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('SdExcelService', () => {
  let service: SdExcelService;
  /** Chặn download thật; giữ lại Blob + fileName để verify. */
  let downloadSpy: jasmine.Spy<typeof BrowserUtilities.downloadBlob>;

  /** Chạy code thật rồi trả về workbook đã ghi ra, đọc lại bằng exceljs thật. */
  async function writtenWorkbook(): Promise<import('exceljs').Workbook> {
    expect(downloadSpy).toHaveBeenCalled();
    return readWorkbook(downloadSpy.calls.mostRecent().args[0]);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SdExcelService);
    downloadSpy = spyOn(BrowserUtilities, 'downloadBlob');
  });

  // ─── 1. Instantiation ─────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── 2. generateTemplate — validation (real implementation) ───────────────

  it('generateTemplate throws when columns is not an array', async () => {
    await expectAsync(service.generateTemplate({ columns: null as any })).toBeRejectedWithError('Excel template columns must be an array');
    expect(downloadSpy).not.toHaveBeenCalled();
  });

  it('generateTemplate throws when a column is missing "field"', async () => {
    await expectAsync(service.generateTemplate(makeTemplate({ columns: [{ field: '', title: 'Name' }] }))).toBeRejectedWithError(
      'Column 1: Field is required'
    );
  });

  it('generateTemplate throws when a column is missing "title"', async () => {
    await expectAsync(service.generateTemplate(makeTemplate({ columns: [{ field: 'name', title: '' }] }))).toBeRejectedWithError(
      'Column 1: Title is required'
    );
  });

  it('generateTemplate throws at the correct column index (second column)', async () => {
    await expectAsync(
      service.generateTemplate(
        makeTemplate({
          columns: [
            { field: 'code', title: 'Code' },
            { field: '', title: 'Name' },
          ],
        })
      )
    ).toBeRejectedWithError('Column 2: Field is required');
  });

  // ─── 3. export — validation (real implementation) ─────────────────────────

  it('export throws when a column is missing "field"', async () => {
    await expectAsync(service.export(makeExportOption({ columns: [{ field: '', title: 'Code' }] }))).toBeRejectedWithError(
      'Column 1: Field is required'
    );
    expect(downloadSpy).not.toHaveBeenCalled();
  });

  it('export throws when a column is missing "title"', async () => {
    await expectAsync(service.export(makeExportOption({ columns: [{ field: 'code', title: '' }] }))).toBeRejectedWithError(
      'Column 1: Title is required'
    );
  });

  // ─── 4. generateTemplate — workbook thật ghi ra .xlsx thật ────────────────

  it('generateTemplate writes a real .xlsx blob with the requested file name', async () => {
    await service.generateTemplate(makeTemplate({ fileName: 'my-template.xlsx' }));

    expect(downloadSpy).toHaveBeenCalledTimes(1);
    const [blob, fileName] = downloadSpy.calls.mostRecent().args;
    expect(fileName).toBe('my-template.xlsx');
    expect(blob.type).toBe(XLSX_MIME);
    // .xlsx là ZIP -> 2 byte đầu phải là "PK". Chứng minh exceljs thật đã ghi, không phải buffer rỗng.
    const head = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
    expect(String.fromCharCode(head[0], head[1])).toBe('PK');
  });

  it('generateTemplate lays out field row 1 / title row 2 on a "template" sheet', async () => {
    await service.generateTemplate(
      makeTemplate({
        columns: [
          { field: 'code', title: 'Mã' },
          { field: 'name', title: 'Tên' },
        ],
      })
    );

    const wb = await writtenWorkbook();
    expect(wb.worksheets.map(s => s.name)).toEqual(['template']);

    const sheet = wb.getWorksheet('template')!;
    expect(cellValue(sheet, 1, 1)).toBe('code');
    expect(cellValue(sheet, 1, 2)).toBe('name');
    expect(cellValue(sheet, 2, 1)).toBe('Mã');
    expect(cellValue(sheet, 2, 2)).toBe('Tên');
    // Không có column nào khai description -> hàng 3 phải trống.
    expect(cellValue(sheet, 3, 1)).toBeNull();
  });

  it('generateTemplate emits the description row only when some column declares one', async () => {
    await service.generateTemplate(
      makeTemplate({
        columns: [
          { field: 'code', title: 'Mã', description: 'Bắt buộc, duy nhất' },
          { field: 'name', title: 'Tên' },
        ],
      })
    );

    const sheet = (await writtenWorkbook()).getWorksheet('template')!;
    expect(cellValue(sheet, 3, 1)).toBe('Bắt buộc, duy nhất');
  });

  it('generateTemplate converts a px width into an exceljs column width (px / 7)', async () => {
    await service.generateTemplate(
      makeTemplate({
        columns: [
          { field: 'code', title: 'Mã', width: '140px' },
          { field: 'name', title: 'Tên' },
        ],
      })
    );

    const sheet = (await writtenWorkbook()).getWorksheet('template')!;
    expect(sheet.getColumn(1).width).toBe(20); // 140 / 7
    expect(sheet.getColumn(2).width).toBeCloseTo(120 / 7, 5); // default 120px
  });

  it('generateTemplate marks required columns with the red field style', async () => {
    await service.generateTemplate(
      makeTemplate({
        columns: [
          { field: 'code', title: 'Mã', required: true },
          { field: 'name', title: 'Tên' },
        ],
      })
    );

    const sheet = (await writtenWorkbook()).getWorksheet('template')!;
    const requiredFill: any = sheet.getCell(1, 1).style.fill;
    const normalFill: any = sheet.getCell(1, 2).style.fill;
    expect(String(requiredFill.fgColor.argb).toUpperCase()).toContain('FF1744');
    expect(String(normalFill.fgColor.argb).toUpperCase()).toContain('FAFAFA');
  });

  it('generateTemplate honours per-column title fill + fontColor overrides', async () => {
    await service.generateTemplate(
      makeTemplate({
        columns: [{ field: 'code', title: 'Mã', fill: '112233', fontColor: 'AABBCC' }],
      })
    );

    const sheet = (await writtenWorkbook()).getWorksheet('template')!;
    const titleStyle = sheet.getCell(2, 1).style;
    expect(String((titleStyle.fill as any).fgColor.argb).toUpperCase()).toContain('112233');
    expect(String(titleStyle.font!.color!.argb).toUpperCase()).toContain('AABBCC');
  });

  it('generateTemplate neutralizes formula-injection payloads in field / title / description', async () => {
    await service.generateTemplate(
      makeTemplate({
        columns: [{ field: '=cmd|calc', title: '+SUM(A1)', description: '@evil' }],
      })
    );

    const sheet = (await writtenWorkbook()).getWorksheet('template')!;
    expect(cellValue(sheet, 1, 1)).toBe("'=cmd|calc");
    expect(cellValue(sheet, 2, 1)).toBe("'+SUM(A1)");
    expect(cellValue(sheet, 3, 1)).toBe("'@evil");
  });

  it('generateTemplate appends one worksheet per lookup sheet, with value + display header rows', async () => {
    await service.generateTemplate(
      makeTemplate({
        sheets: [
          {
            name: 'Lookup',
            items: [
              { id: 'A', label: 'Alpha' },
              { id: 'B', label: 'Beta' },
            ],
            headers: [
              { value: 'id', display: 'Mã' },
              { value: 'label', display: '' },
            ],
          },
        ],
      })
    );

    const wb = await writtenWorkbook();
    expect(wb.worksheets.map(s => s.name)).toEqual(['template', 'Lookup']);

    const lookup = wb.getWorksheet('Lookup')!;
    expect(cellValue(lookup, 1, 1)).toBe('id');
    expect(cellValue(lookup, 2, 1)).toBe('Mã');
    // display rỗng -> fallback về chính `value`.
    expect(cellValue(lookup, 2, 2)).toBe('label');
    expect(cellValue(lookup, 3, 1)).toBe('A');
    expect(cellValue(lookup, 4, 2)).toBe('Beta');
    expect(lookup.getColumn(1).width).toBe(30);
  });

  it('generateTemplate skips lookup sheets whose items / headers are not arrays', async () => {
    await service.generateTemplate(
      makeTemplate({
        sheets: [
          { name: 'Broken', items: null as any, headers: [{ value: 'id', display: 'ID' }] },
          { name: '', items: [], headers: [] },
        ],
      })
    );

    const wb = await writtenWorkbook();
    expect(wb.worksheets.map(s => s.name)).toEqual(['template']);
  });

  // ─── 5. export — workbook thật ────────────────────────────────────────────

  it('export writes field row, title row and item rows onto a "data" sheet', async () => {
    await service.export(
      makeExportOption({
        columns: [
          { field: 'code', title: 'Mã' },
          { field: 'name', title: 'Tên' },
        ],
        items: [
          { code: 'A1', name: 'Alice' },
          { code: 'B2', name: 'Bob' },
        ],
        fileName: 'people.xlsx',
      })
    );

    const [, fileName] = downloadSpy.calls.mostRecent().args;
    expect(fileName).toBe('people.xlsx');

    const wb = await writtenWorkbook();
    expect(wb.worksheets.map(s => s.name)).toEqual(['data']);

    const sheet = wb.getWorksheet('data')!;
    expect(cellValue(sheet, 1, 1)).toBe('code');
    expect(cellValue(sheet, 2, 1)).toBe('Mã');
    expect(cellValue(sheet, 3, 1)).toBe('A1');
    expect(cellValue(sheet, 3, 2)).toBe('Alice');
    expect(cellValue(sheet, 4, 1)).toBe('B2');
    expect(cellValue(sheet, 4, 2)).toBe('Bob');
  });

  it('export shifts item rows down to row 4 when any column has a description', async () => {
    await service.export(
      makeExportOption({
        columns: [{ field: 'code', title: 'Mã', description: 'Ghi chú' }],
        items: [{ code: 'A1' }],
      })
    );

    const sheet = (await writtenWorkbook()).getWorksheet('data')!;
    expect(cellValue(sheet, 3, 1)).toBe('Ghi chú');
    expect(cellValue(sheet, 4, 1)).toBe('A1');
  });

  it('export keeps numeric cells typed as numbers, not text', async () => {
    await service.export(
      makeExportOption({
        columns: [
          { field: 'code', title: 'Mã' },
          { field: 'qty', title: 'SL' },
          { field: 'numeric-string', title: 'Chuỗi số' },
        ],
        items: [{ code: 'A1', qty: 42, 'numeric-string': '42' }],
      })
    );

    const sheet = (await writtenWorkbook()).getWorksheet('data')!;
    expect(cellValue(sheet, 3, 2)).toBe(42);
    expect(typeof cellValue(sheet, 3, 2)).toBe('number');
    // Chuỗi "42" đi nhánh else -> vẫn là string, không bị ép sang number.
    expect(cellValue(sheet, 3, 3)).toBe('42');
    expect(typeof cellValue(sheet, 3, 3)).toBe('string');
  });

  it('export neutralizes formula-injection payloads in item cells but leaves numbers alone', async () => {
    await service.export(
      makeExportOption({
        columns: [
          { field: 'name', title: 'Tên' },
          { field: 'score', title: 'Điểm' },
        ],
        items: [{ name: "=cmd|' /C calc'!A0", score: -42 }],
      })
    );

    const sheet = (await writtenWorkbook()).getWorksheet('data')!;
    expect(cellValue(sheet, 3, 1)).toBe("'=cmd|' /C calc'!A0");
    expect(cellValue(sheet, 3, 2)).toBe(-42);
  });

  it('export marks required columns with the red title style and others with the blue one', async () => {
    await service.export(
      makeExportOption({
        columns: [
          { field: 'code', title: 'Mã', required: true },
          { field: 'name', title: 'Tên' },
        ],
        items: [],
      })
    );

    const sheet = (await writtenWorkbook()).getWorksheet('data')!;
    expect(String((sheet.getCell(2, 1).style.fill as any).fgColor.argb).toUpperCase()).toContain('FF1744');
    expect(String((sheet.getCell(2, 2).style.fill as any).fgColor.argb).toUpperCase()).toContain('143180');
  });

  it('export appends lookup sheets alongside the data sheet', async () => {
    await service.export(
      makeExportOption({
        sheets: [{ name: 'Ref', items: [{ id: 1 }], headers: [{ value: 'id', display: 'ID' }] }],
      })
    );

    const wb = await writtenWorkbook();
    expect(wb.worksheets.map(s => s.name)).toEqual(['data', 'Ref']);
    expect(cellValue(wb.getWorksheet('Ref')!, 3, 1)).toBe(1);
  });

  // ─── 6. parse — .xlsx thật, không mock ────────────────────────────────────

  it('parse round-trips a workbook produced by export()', async () => {
    await service.export(
      makeExportOption({
        columns: [
          { field: 'code', title: 'Mã' },
          { field: 'name', title: 'Tên' },
        ],
        items: [{ code: 'A1', name: 'Alice' }],
      })
    );
    const exported = downloadSpy.calls.mostRecent().args[0];
    const file = new File([exported], 'roundtrip.xlsx', { type: XLSX_MIME });

    const result = await service.parse(file);

    expect(result.file).toBe(file);
    // Hàng 1 của file export là dòng `field` -> parse() dùng nó làm key.
    // Hàng 2 (title) và hàng 3 (dữ liệu) đều trở thành item.
    expect(result.items).toEqual([
      { code: 'Mã', name: 'Tên' },
      { code: 'A1', name: 'Alice' },
    ]);
  });

  it('parse maps the header row to keys and trims string cells', async () => {
    const file = await buildXlsxFile('data.xlsx', sheet => {
      sheet.getCell(1, 1).value = '  code  ';
      sheet.getCell(1, 2).value = 'name';
      sheet.getCell(2, 1).value = '  A1  ';
      sheet.getCell(2, 2).value = 'Alice';
    });

    const result = await service.parse(file);

    expect(result.items.length).toBe(1);
    expect(result.items[0]).toEqual({ code: 'A1', name: 'Alice' });
  });

  it('parse translates SET_NULL / SET_EMPTY keywords and blanks into null / ""', async () => {
    const file = await buildXlsxFile('keywords.xlsx', sheet => {
      sheet.getCell(1, 1).value = 'a';
      sheet.getCell(1, 2).value = 'b';
      sheet.getCell(1, 3).value = 'c';
      sheet.getCell(2, 1).value = 'SET_NULL';
      sheet.getCell(2, 2).value = 'SET_EMPTY';
      sheet.getCell(2, 3).value = 'keep';
    });

    const result = await service.parse(file);

    expect(result.items[0]['a']).toBeNull();
    expect(result.items[0]['b']).toBe('');
    expect(result.items[0]['c']).toBe('keep');
  });

  it('parse fills columns with no cell value as null', async () => {
    const file = await buildXlsxFile('sparse.xlsx', sheet => {
      sheet.getCell(1, 1).value = 'a';
      sheet.getCell(1, 2).value = 'b';
      sheet.getCell(2, 1).value = 'only-a';
    });

    const result = await service.parse(file);

    expect(result.items.length).toBe(1);
    expect(result.items[0]['a']).toBe('only-a');
    expect(result.items[0]['b']).toBeNull();
  });

  it('parse ignores header columns with an empty header cell', async () => {
    const file = await buildXlsxFile('gap.xlsx', sheet => {
      sheet.getCell(1, 1).value = 'a';
      sheet.getCell(1, 3).value = 'c';
      sheet.getCell(2, 1).value = 'x';
      sheet.getCell(2, 2).value = 'orphan';
      sheet.getCell(2, 3).value = 'z';
    });

    const result = await service.parse(file);

    expect(Object.keys(result.items[0]).sort()).toEqual(['a', 'c']);
    expect(result.items[0]['a']).toBe('x');
    expect(result.items[0]['c']).toBe('z');
  });

  it('parse resolves richText, formula and hyperlink cell shapes to plain values', async () => {
    const file = await buildXlsxFile('shapes.xlsx', sheet => {
      sheet.getCell(1, 1).value = 'rich';
      sheet.getCell(1, 2).value = 'formula';
      sheet.getCell(1, 3).value = 'link';
      sheet.getCell(2, 1).value = { richText: [{ text: 'He' }, { text: 'llo' }] } as any;
      sheet.getCell(2, 2).value = { formula: 'SUM(1,2)', result: 3 } as any;
      sheet.getCell(2, 3).value = { text: 'Trang chủ', hyperlink: 'https://example.com' } as any;
    });

    const result = await service.parse(file);

    expect(result.items[0]['rich']).toBe('Hello');
    expect(result.items[0]['formula']).toBe(3);
    expect(result.items[0]['link']).toBe('Trang chủ');
  });

  it('parse returns an empty item list for a header-only sheet', async () => {
    const file = await buildXlsxFile('empty.xlsx', sheet => {
      sheet.getCell(1, 1).value = 'code';
    });

    const result = await service.parse(file);

    expect(result.items).toEqual([]);
    expect(result.file).toBe(file);
  });

  it('parse rejects when the file is not a readable workbook', async () => {
    const notXlsx = new File(['this is not a zip archive'], 'broken.xlsx', { type: XLSX_MIME });

    await expectAsync(service.parse(notXlsx)).toBeRejected();
  });

  // ─── 7. upload — picker bị stub, phần còn lại chạy thật ───────────────────

  it('upload parses the workbook returned by the file picker', async () => {
    const file = await buildXlsxFile('picked.xlsx', sheet => {
      sheet.getCell(1, 1).value = 'code';
      sheet.getCell(2, 1).value = 'A1';
    });
    const uploadSpy = spyOn(BrowserUtilities, 'upload').and.resolveTo(file);

    const result = await service.upload();

    expect(uploadSpy).toHaveBeenCalledWith({ extensions: ['xlsx'], maxSizeInMb: 10 });
    expect(result.file).toBe(file);
    expect(result.items).toEqual([{ code: 'A1' }]);
  });

  it('upload unwraps the first entry when the picker resolves an array', async () => {
    const file = await buildXlsxFile('multi.xlsx', sheet => {
      sheet.getCell(1, 1).value = 'code';
      sheet.getCell(2, 1).value = 'B2';
    });
    spyOn(BrowserUtilities, 'upload').and.resolveTo([file]);

    const result = await service.upload();

    expect(result.file).toBe(file);
    expect(result.items).toEqual([{ code: 'B2' }]);
  });

  it('upload returns an empty result when the picker is cancelled', async () => {
    spyOn(BrowserUtilities, 'upload').and.resolveTo(null);

    await expectAsync(service.upload()).toBeResolvedTo({ items: [], file: null });
  });

  it('upload propagates a picker rejection', async () => {
    spyOn(BrowserUtilities, 'upload').and.rejectWith(new Error('too big'));

    await expectAsync(service.upload()).toBeRejectedWithError('too big');
  });

  // ─── 8. exportCSV — self-written generator (BOM + CRLF + escape) ─────────

  it('exportCSV produces CSV with BOM + CRLF + escaped commas', async () => {
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
    expect(downloadSpy).toHaveBeenCalled();
    const blob: Blob = downloadSpy.calls.mostRecent().args[0];
    // Đọc qua arrayBuffer + decode KHÔNG strip BOM để verify được 3 byte 0xEF 0xBB 0xBF mở đầu.
    // (Blob.text() / TextDecoder mặc định sẽ tự bỏ BOM, làm assertion BOM thất bại.)
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(bytes[0]).toBe(0xef); // BOM byte 1
    expect(bytes[1]).toBe(0xbb); // BOM byte 2
    expect(bytes[2]).toBe(0xbf); // BOM byte 3
    const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes);
    expect(text.startsWith('﻿')).toBe(true); // BOM char survives when ignoreBOM=true
    expect(text).toContain('Name,Note\r\n'); // CRLF header
    expect(text).toContain('"B,C","has ""quotes"""'); // comma + quote escape
    expect(text).toContain('"multi\nline"'); // newline inside cell
  });

  it('exportCSV names the file with a timestamp suffix and the csv mime type', async () => {
    await service.exportCSV({
      fileName: 'bao-cao',
      columns: [{ field: 'name', title: 'Name' }],
      items: [{ name: 'A' }],
    });

    const [blob, fileName] = downloadSpy.calls.mostRecent().args;
    expect(blob.type).toBe('text/csv;charset=utf-8;');
    expect(fileName).toMatch(/^bao-cao_\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.csv$/);
  });

  it('exportCSV falls back to the "CSV" file name prefix', async () => {
    await service.exportCSV({ columns: [{ field: 'name', title: 'Name' }], items: [] });

    const [, fileName] = downloadSpy.calls.mostRecent().args;
    expect(fileName).toMatch(/^CSV_\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.csv$/);
  });

  it('exportCSV renders null and undefined cells as empty strings', async () => {
    await service.exportCSV({
      fileName: 'nulls',
      columns: [
        { field: 'a', title: 'A' },
        { field: 'b', title: 'B' },
        { field: 'c', title: 'C' },
      ],
      items: [{ a: null, b: undefined, c: 0 }],
    });

    const blob: Blob = downloadSpy.calls.mostRecent().args[0];
    const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(new Uint8Array(await blob.arrayBuffer()));
    expect(text.split('\r\n')[1]).toBe(',,0');
  });

  it('exportCSV neutralizes spreadsheet formula injection payloads in string cells', async () => {
    await service.exportCSV({
      fileName: 'security',
      columns: [
        { field: 'fullName', title: 'Full name' },
        { field: 'createdBy', title: 'Created by' },
        { field: 'score', title: 'Score' },
      ],
      items: [
        { fullName: "=cmd|' /C calc'!A0", createdBy: '+evil@example.com', score: -42 },
        { fullName: '@attacker', createdBy: '\t=cmd', score: '-text-value' },
      ],
    });

    const blob: Blob = downloadSpy.calls.mostRecent().args[0];
    const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(new Uint8Array(await blob.arrayBuffer()));

    expect(text).toContain("'=cmd|' /C calc'!A0");
    expect(text).toContain("'+evil@example.com");
    expect(text).toContain("'@attacker");
    expect(text).toContain("'\t=cmd");
    expect(text).toContain(',-42\r\n');
    expect(text).toContain("'-text-value");
  });
});
