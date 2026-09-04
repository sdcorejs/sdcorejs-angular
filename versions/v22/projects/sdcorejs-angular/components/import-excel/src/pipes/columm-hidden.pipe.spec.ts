import { ColumnHiddenPipe } from './columm-hidden.pipe';
import { SdUploadExcelColumn } from '../import-excel.model';

describe('ColumnHiddenPipe', () => {
  let pipe: ColumnHiddenPipe;

  const col = (hidden: SdUploadExcelColumn['hidden']): SdUploadExcelColumn =>
    ({ field: 'f', title: 't', type: 'string', hidden }) as SdUploadExcelColumn;

  beforeEach(() => {
    pipe = new ColumnHiddenPipe();
  });

  it('returns true when hidden is undefined (column visible by default)', () => {
    expect(pipe.transform(col(undefined))).toBe(true);
  });

  it('returns true when hidden boolean is false', () => {
    expect(pipe.transform(col(false))).toBe(true);
  });

  it('returns false when hidden boolean is true', () => {
    expect(pipe.transform(col(true))).toBe(false);
  });

  it('returns true when hidden function returns false', () => {
    expect(pipe.transform(col(() => false))).toBe(true);
  });

  it('returns false when hidden function returns true', () => {
    expect(pipe.transform(col(() => true))).toBe(false);
  });

  it('invokes hidden function each call (no caching)', () => {
    const spy = jasmine.createSpy('hidden').and.returnValues(true, false);
    const c = col(spy);
    expect(pipe.transform(c)).toBe(false);
    expect(pipe.transform(c)).toBe(true);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
