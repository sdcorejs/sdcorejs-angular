import { SdGroupPipe } from './sd-group.pipe';
import { MapToSdTableItem, SdTableItem } from '../models/table-item.model';
import { SdTableOption } from '../models/table-option.model';

interface Row {
  id: number;
  group: string;
  value: number;
}

function mk(items: Row[]): SdTableItem<Row>[] {
  return items.map(i => MapToSdTableItem(i));
}

describe('SdGroupPipe', () => {
  let pipe: SdGroupPipe;

  beforeEach(() => {
    pipe = new SdGroupPipe();
  });

  it('không group khi option.group không có', () => {
    const items = mk([{ id: 1, group: 'A', value: 10 }]);
    const opt = { type: 'local', items: () => [], columns: [] } as any as SdTableOption;
    expect(pipe.transform(items, opt)).toBe(items);
  });

  it('không group khi option.tree được set (ưu tiên tree)', () => {
    const items = mk([{ id: 1, group: 'A', value: 10 }]);
    const opt = {
      type: 'local',
      items: () => [],
      columns: [],
      tree: { loadType: 'static', childrenKey: 'children' },
      group: { fields: ['group'] },
    } as any as SdTableOption;
    expect(pipe.transform(items, opt)).toBe(items);
  });

  it('group theo field đơn — sinh group header + children theo từng nhóm', () => {
    const items = mk([
      { id: 1, group: 'A', value: 10 },
      { id: 2, group: 'A', value: 20 },
      { id: 3, group: 'B', value: 30 },
    ]);
    const opt = {
      type: 'local',
      items: () => [],
      columns: [],
      group: { fields: ['group'] },
    } as any as SdTableOption;

    const out = pipe.transform(items, opt);
    // 2 group headers + 3 children = 5
    expect(out.length).toBe(5);

    const headers = out.filter(i => i.meta.group?.isGroupHeader);
    expect(headers.length).toBe(2);

    const groupA = headers.find(h => h.meta.group?.values?.['group'] === 'A')!;
    expect(groupA.meta.group?.items?.length).toBe(2);
    expect(groupA.meta.group?.key).toBeTruthy();

    const groupB = headers.find(h => h.meta.group?.values?.['group'] === 'B')!;
    expect(groupB.meta.group?.items?.length).toBe(1);
  });

  it('group header có selectable = false (selection xử lý riêng qua template checkbox)', () => {
    const items = mk([{ id: 1, group: 'A', value: 10 }]);
    const opt = {
      type: 'local',
      items: () => [],
      columns: [],
      group: { fields: ['group'] },
    } as any as SdTableOption;
    const out = pipe.transform(items, opt);
    const header = out.find(i => i.meta.group?.isGroupHeader)!;
    expect(header.meta.selector?.selectable).toBe(false);
  });

  it('collapsible + defaultCollapsed=true → header xuất hiện, children bị filter', () => {
    const items = mk([
      { id: 1, group: 'A', value: 10 },
      { id: 2, group: 'A', value: 20 },
    ]);
    const opt = {
      type: 'local',
      items: () => [],
      columns: [],
      group: { fields: ['group'], collapsible: true, defaultCollapsed: true },
    } as any as SdTableOption;
    const out = pipe.transform(items, opt);
    expect(out.length).toBe(1);
    expect(out[0].meta.group?.isGroupHeader).toBe(true);
    expect(out[0].meta.group?.isExpanded).toBe(false);
  });

  it('collapsible mặc định (defaultCollapsed không set) → header expanded + children render', () => {
    const items = mk([
      { id: 1, group: 'A', value: 10 },
      { id: 2, group: 'A', value: 20 },
    ]);
    const opt = {
      type: 'local',
      items: () => [],
      columns: [],
      group: { fields: ['group'], collapsible: true },
    } as any as SdTableOption;
    const out = pipe.transform(items, opt);
    expect(out.length).toBe(3); // 1 header + 2 children
    expect(out[0].meta.group?.isExpanded).toBe(true);
  });

  it('expand state persist qua external Map<key,bool> arg — toggle false → transform lần sau giữ false', () => {
    const items = mk([
      { id: 1, group: 'A', value: 10 },
      { id: 2, group: 'A', value: 20 },
    ]);
    const opt = {
      type: 'local',
      items: () => [],
      columns: [],
      group: { fields: ['group'], collapsible: true },
    } as any as SdTableOption;
    const expandState = new Map<string, boolean>();

    // Initial transform — expanded
    let out = pipe.transform(items, opt, expandState);
    expect(out.length).toBe(3);
    const header = out[0];
    const key = header.meta.group!.key!;
    // Toggle qua Map (mô phỏng component gọi toggleGroupExpand)
    expandState.set(key, false);
    // Re-transform — pipe đọc Map → biết group đã collapse
    out = pipe.transform(items, opt, expandState);
    expect(out.length).toBe(1);
    expect(out[0].meta.group?.isExpanded).toBe(false);
  });

  it('field dot-notation → resolve nested value qua Utilities.getNestedValue', () => {
    interface Nested {
      id: number;
      customer: { id: number; name: string };
    }
    const nest: Nested[] = [
      { id: 1, customer: { id: 10, name: 'A' } },
      { id: 2, customer: { id: 10, name: 'A' } },
      { id: 3, customer: { id: 20, name: 'B' } },
    ];
    const items = nest.map(i => MapToSdTableItem(i)) as unknown as SdTableItem<Row>[];
    const opt = {
      type: 'local',
      items: () => [],
      columns: [],
      group: { fields: ['customer.id'] },
    } as any as SdTableOption;
    const out = pipe.transform(items, opt);
    const headers = out.filter(i => i.meta.group?.isGroupHeader);
    expect(headers.length).toBe(2);
    expect(headers.map(h => h.meta.group?.values?.['customer.id']).sort()).toEqual([10, 20]);
  });

  it('group theo nhiều field → key kết hợp', () => {
    const items = mk([
      { id: 1, group: 'A', value: 10 },
      { id: 2, group: 'A', value: 20 },
      { id: 3, group: 'B', value: 10 },
    ]);
    const opt = {
      type: 'local',
      items: () => [],
      columns: [],
      group: { fields: ['group', 'value'] },
    } as any as SdTableOption;
    const out = pipe.transform(items, opt);
    const headers = out.filter(i => i.meta.group?.isGroupHeader);
    // 3 groups: A-10, A-20, B-10
    expect(headers.length).toBe(3);
  });
});
