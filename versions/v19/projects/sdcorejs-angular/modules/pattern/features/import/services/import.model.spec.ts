import { guessMapping, IMPORT_SAMPLE, parseCsv } from './import.model';

describe('parseCsv', () => {
  it('reads a header and rows separated by commas or semicolons', () => {
    expect(parseCsv('Mã,Tên\nSP-1,"Sữa"\n\nSP-2,Bánh')).toEqual({
      columns: ['Mã', 'Tên'],
      rows: [
        { Mã: 'SP-1', Tên: 'Sữa' },
        { Mã: 'SP-2', Tên: 'Bánh' },
      ],
    });
    expect(parseCsv('code;name\r\nSP-1;Sữa;thừa\r\nSP-2').rows).toEqual([
      { code: 'SP-1', name: 'Sữa' },
      { code: 'SP-2', name: '' },
    ]);
  });

  it('reads nothing without a row under the header', () => {
    expect(parseCsv('')).toEqual({ columns: [], rows: [] });
    expect(parseCsv('code,name')).toEqual({ columns: [], rows: [] });
  });

  it('reads the sample with its six rows', () => {
    const source = parseCsv(IMPORT_SAMPLE);
    expect(source.columns.length).toBe(4);
    expect(source.rows.length).toBe(6);
  });
});

describe('guessMapping', () => {
  it('maps the columns by name, ignoring case and spaces, and skips the unknown fields', () => {
    expect(guessMapping([' MÃ ', 'Tên sản phẩm', 'Ghi chú'])).toEqual({ code: ' MÃ ', name: 'Tên sản phẩm', unit: null, price: null });
    expect(guessMapping(parseCsv(IMPORT_SAMPLE).columns)).toEqual({ code: 'Mã', name: 'Tên sản phẩm', unit: 'Đơn vị', price: 'Giá bán' });
  });
});
