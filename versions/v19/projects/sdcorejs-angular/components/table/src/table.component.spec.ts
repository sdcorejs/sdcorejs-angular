import { buildColumnWidthMap } from './services/column-width.util';

describe('buildColumnWidthMap', () => {
  it('trả map field → width cho mọi field có width', () => {
    const result = buildColumnWidthMap({
      name: { width: '120px' },
      age: { width: '80px' },
    });
    expect(result).toEqual({ name: '120px', age: '80px' });
  });

  it('loại bỏ field có width undefined', () => {
    const result = buildColumnWidthMap({
      col1: { width: '100px' },
      col2: {},
      col3: { width: '200px' },
    });
    expect(result).toEqual({ col1: '100px', col3: '200px' });
  });

  it('trả object rỗng khi tất cả field đều không có width', () => {
    const result = buildColumnWidthMap({
      col1: {},
      col2: {},
    });
    expect(result).toEqual({});
  });

  it('trả object rỗng khi input là undefined', () => {
    expect(buildColumnWidthMap(undefined)).toEqual({});
  });

  it('trả object rỗng khi input là null', () => {
    expect(buildColumnWidthMap(null)).toEqual({});
  });

  it('trả object rỗng khi input là object rỗng', () => {
    expect(buildColumnWidthMap({})).toEqual({});
  });

  it('coi width chuỗi rỗng là missing và bỏ qua', () => {
    const result = buildColumnWidthMap({
      col1: { width: '' },
      col2: { width: '100px' },
    });
    expect(result).toEqual({ col2: '100px' });
  });
});
