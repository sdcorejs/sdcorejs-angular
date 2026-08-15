import { collectRowActionKeys, resolveSelectAllVisible } from './selection-action.util';
import { MapToSdTableItem, SdTableItem } from '../../models/table-item.model';
import { SdTableAction, SdTableOptionSelector } from '../../models/table-option-selector.model';

interface Row {
  id: number;
  status: string;
}

const noop = () => undefined;

const mk = (rows: Row[]): SdTableItem<Row>[] => rows.map(r => MapToSdTableItem(r));

const sel = (actions: SdTableAction<Row>[], over: Partial<SdTableOptionSelector<Row>> = {}): SdTableOptionSelector<Row> => ({
  visible: true,
  actions,
  ...over,
});

describe('collectRowActionKeys', () => {
  it('ghi in-place vào mảng caller cấp (không cấp phát mảng mới)', () => {
    const item = MapToSdTableItem<Row>({ id: 1, status: 'DRAFT' });
    const actions: string[] = [];
    const grouped: string[] = [];

    collectRowActionKeys(item, sel([{ title: 'Duyệt', click: noop }]), actions, grouped);

    expect(actions.length).toBe(1);
    expect(grouped.length).toBe(0);
  });

  it('tách riêng key của action isGrouped', () => {
    const item = MapToSdTableItem<Row>({ id: 1, status: 'DRAFT' });
    const actions: string[] = [];
    const grouped: string[] = [];

    collectRowActionKeys(
      item,
      sel([
        { title: 'Gộp', isGrouped: true, click: noop },
        { title: 'Xoá', click: noop },
      ]),
      actions,
      grouped
    );

    expect(actions.length).toBe(2);
    expect(grouped.length).toBe(1);
    expect(actions).toContain(grouped[0]);
  });

  it('bỏ qua action bị hidden theo predicate của row', () => {
    const done = MapToSdTableItem<Row>({ id: 1, status: 'DONE' });
    const actions: string[] = [];

    collectRowActionKeys(done, sel([{ title: 'Duyệt', hidden: (row?: Row) => row?.status === 'DONE', click: noop }]), actions, []);

    expect(actions.length).toBe(0);
  });

  it('action cha chỉ vào danh sách khi có child hiển thị', () => {
    const item = MapToSdTableItem<Row>({ id: 1, status: 'DRAFT' });
    const visible: string[] = [];
    const hiddenOnly: string[] = [];

    collectRowActionKeys(item, sel([{ title: 'Nhóm', children: [{ title: 'Duyệt', click: noop }] }]), visible, []);
    collectRowActionKeys(item, sel([{ title: 'Nhóm', children: [{ title: 'Duyệt', hidden: true, click: noop }] }]), hiddenOnly, []);

    expect(visible.length).toBe(2); // child + parent
    expect(hiddenOnly.length).toBe(0);
  });
});

describe('resolveSelectAllVisible', () => {
  it('false khi selector.single', () => {
    expect(resolveSelectAllVisible(mk([{ id: 1, status: 'DRAFT' }]), sel([], { single: true }))).toBe(false);
  });

  it('false khi không có row nào', () => {
    expect(resolveSelectAllVisible([], sel([{ title: 'Duyệt', click: noop }]))).toBe(false);
  });

  it('true khi selector không cấu hình action', () => {
    expect(resolveSelectAllVisible(mk([{ id: 1, status: 'DRAFT' }]), { visible: true })).toBe(true);
  });

  it('false khi có bất kỳ action isGrouped nào (kể cả trong children)', () => {
    const items = mk([{ id: 1, status: 'DRAFT' }]);
    expect(resolveSelectAllVisible(items, sel([{ title: 'Gộp', isGrouped: true, click: noop }]))).toBe(false);
    expect(resolveSelectAllVisible(items, sel([{ title: 'Nhóm', children: [{ title: 'Gộp', isGrouped: true, click: noop }] }]))).toBe(
      false
    );
  });

  it('KHÔNG phụ thuộc meta.selector.actions đã được pipe khác điền trước', () => {
    // why: đây chính là lỗi mà `await setTimeout(500)` trong pipe cũ che đi — header
    // render TRƯỚC body nên `meta.selector.actions` còn rỗng ở pass đầu tiên.
    const items = mk([
      { id: 1, status: 'DRAFT' },
      { id: 2, status: 'DRAFT' },
    ]);
    items.forEach(i => expect(i.meta.selector!.actions!.length).toBe(0));

    expect(resolveSelectAllVisible(items, sel([{ title: 'Duyệt', click: noop }]))).toBe(true);
  });

  it('true khi mọi row còn action đều chia sẻ ít nhất 1 action chung', () => {
    const items = mk([
      { id: 1, status: 'DRAFT' },
      { id: 2, status: 'DONE' },
    ]);
    const selection = sel([
      { title: 'Chung', click: noop },
      { title: 'Chỉ DRAFT', hidden: (row?: Row) => row?.status !== 'DRAFT', click: noop },
    ]);

    expect(resolveSelectAllVisible(items, selection)).toBe(true);
  });

  it('false khi không có action nào chung cho mọi row còn action', () => {
    const items = mk([
      { id: 1, status: 'DRAFT' },
      { id: 2, status: 'DONE' },
    ]);
    const selection = sel([
      { title: 'Chỉ DRAFT', hidden: (row?: Row) => row?.status !== 'DRAFT', click: noop },
      { title: 'Chỉ DONE', hidden: (row?: Row) => row?.status !== 'DONE', click: noop },
    ]);

    expect(resolveSelectAllVisible(items, selection)).toBe(false);
  });

  it('false khi không row nào có action khả dụng', () => {
    const items = mk([{ id: 1, status: 'DONE' }]);
    expect(resolveSelectAllVisible(items, sel([{ title: 'Duyệt', hidden: true, click: noop }]))).toBe(false);
  });

  it('trả boolean ĐỒNG BỘ (không Promise, không timer)', () => {
    const result = resolveSelectAllVisible(mk([{ id: 1, status: 'DRAFT' }]), sel([{ title: 'Duyệt', click: noop }]));
    expect(typeof result).toBe('boolean');
    expect((result as unknown as Promise<boolean>)?.then).toBeUndefined();
  });
});
