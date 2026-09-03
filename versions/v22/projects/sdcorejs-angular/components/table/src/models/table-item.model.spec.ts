import { MapToSdTableItem, resolveTableItemId } from './table-item.model';

interface Row {
  id?: number | string | null;
  name: string;
  user?: { id: number };
}

describe('resolveTableItemId / MapToSdTableItem — row identity', () => {
  describe('KHÔNG suy ra id từ nội dung', () => {
    it('2 row TRÙNG nội dung vẫn có id KHÁC nhau', () => {
      // why: id cũ là Utilities.hash({ data }) nên 2 dòng cùng nội dung dùng chung 1 id →
      // trackBy của mat-table tái dùng nhầm view, `#treeExpandState` / preserved-selection
      // đụng key, và flattenTree (visited Set theo id) NUỐT dòng thứ hai.
      const a = MapToSdTableItem<Row>({ name: 'Alice' });
      const b = MapToSdTableItem<Row>({ name: 'Alice' });

      expect(a.meta.id).not.toBe(b.meta.id);
    });

    it('nhiều group header rỗng ({}) nhận id khác nhau', () => {
      const ids = new Set([0, 1, 2, 3].map(() => MapToSdTableItem({}).meta.id));
      expect(ids.size).toBe(4);
    });

    it('đổi nội dung của row KHÔNG làm đổi id (id không bám content)', () => {
      const data: Row = { name: 'Alice' };
      const item = MapToSdTableItem(data);
      const before = item.meta.id;

      data.name = 'Bob';

      expect(resolveTableItemId(data)).toBe(before);
    });
  });

  describe('fallback theo identity của object data', () => {
    it('wrap lại CÙNG một object data trả về CÙNG id', () => {
      // why: tree re-format children và filter local dựng SdTableItem mới quanh cùng
      // object data — id phải ổn định để trạng thái bung / selection không mất.
      const data: Row = { name: 'Alice' };

      expect(MapToSdTableItem(data).meta.id).toBe(MapToSdTableItem(data).meta.id);
    });

    it('object data khác nhau → id khác nhau', () => {
      expect(MapToSdTableItem<Row>({ name: 'A' }).meta.id).not.toBe(MapToSdTableItem<Row>({ name: 'A' }).meta.id);
    });

    it('data nguyên thuỷ có id ỔN ĐỊNH theo giá trị', () => {
      // why: giá trị nguyên thuỷ không vào được WeakMap. Nếu sinh id mới mỗi lần `format()` thì
      // `trackBy`, `#treeExpandState` và preserved-selection churn sau MỖI lần reload. Với một
      // primitive thì nội dung CHÍNH LÀ identity — khác hẳn hash nội dung của một object.
      expect(resolveTableItemId('same')).toBe(resolveTableItemId('same'));
      expect(resolveTableItemId(7)).toBe(resolveTableItemId(7));
    });

    it('phân biệt primitive khác kiểu nhưng cùng biểu diễn chuỗi', () => {
      expect(resolveTableItemId(7)).not.toBe(resolveTableItemId('7'));
    });
  });

  describe('rowKey do caller cung cấp', () => {
    it('id = giá trị của field rowKey', () => {
      expect(MapToSdTableItem<Row>({ id: 42, name: 'Alice' }, 'id').meta.id).toBe('42');
    });

    it('rowKey hỗ trợ dot-notation', () => {
      expect(MapToSdTableItem<Row>({ name: 'Alice', user: { id: 7 } }, 'user.id').meta.id).toBe('7');
    });

    it('2 object khác nhau nhưng cùng rowKey → CÙNG id (sống qua re-fetch của server)', () => {
      const first = MapToSdTableItem<Row>({ id: 5, name: 'Alice' }, 'id');
      const refetched = MapToSdTableItem<Row>({ id: 5, name: 'Alice (đã đổi tên)' }, 'id');

      expect(refetched.meta.id).toBe(first.meta.id);
    });

    it('rowKey trỏ vào giá trị rỗng/null/undefined → rơi về id sinh tự động', () => {
      expect(MapToSdTableItem<Row>({ id: null, name: 'A' }, 'id').meta.id).toMatch(/^sd-row-\d+$/);
      expect(MapToSdTableItem<Row>({ name: 'A' }, 'id').meta.id).toMatch(/^sd-row-\d+$/);
      expect(MapToSdTableItem<Row>({ id: '', name: 'A' }, 'id').meta.id).toMatch(/^sd-row-\d+$/);
    });

    it('id = 0 vẫn là giá trị hợp lệ', () => {
      expect(MapToSdTableItem<Row>({ id: 0, name: 'A' }, 'id').meta.id).toBe('0');
    });

    it('rowKey trỏ vào object/array → BỎ QUA, không stringify thành "[object Object]"', () => {
      // why: `String({})` cho `'[object Object]'` với MỌI row → trùng key trackBy (CDK tái dùng
      // view sai) và `visited` Set trong flattenTree gộp cả cây thành một row.
      const objectKey = MapToSdTableItem<Row>({ id: { nested: 1 } as never, name: 'A' }, 'id').meta.id;
      const arrayKey = MapToSdTableItem<Row>({ id: [1, 2] as never, name: 'B' }, 'id').meta.id;

      expect(objectKey).not.toContain('[object');
      expect(objectKey).toMatch(/^sd-row-\d+$/);
      expect(arrayKey).toMatch(/^sd-row-\d+$/);
      expect(objectKey).not.toBe(arrayKey);
    });
  });

  it('`array.map(MapToSdTableItem)` KHÔNG được dùng — index sẽ bị nhận nhầm thành rowKey', () => {
    // Guard cho đúng cái bẫy đã sửa trong TableFormatService.format.
    const rows: Row[] = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ];
    const safe = rows.map(row => MapToSdTableItem(row, 'id'));

    expect(safe.map(i => i.meta.id)).toEqual(['1', '2']);
  });
});
