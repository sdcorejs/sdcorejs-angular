import { MapToSdTableItem, SdTableItem } from '../../models/table-item.model';
import { SdTableOptionTree } from '../../models/table-option-tree.model';
import {
  collectFormattedTreeRows,
  flattenDataTree,
  flattenTree,
  flattenTreeAll,
  getChildrenFromData,
  getChildrenKey,
  hasLazyChildren,
  resolveDefaultExpanded,
  resolveHasChildren,
} from './tree.util';

interface Node {
  id: number;
  name: string;
  children?: Node[];
}

const opt = (over: Partial<SdTableOptionTree<Node>> = {}): SdTableOptionTree<Node> => ({
  childrenKey: 'children',
  ...over,
});

const item = (data: Node, tree: Partial<NonNullable<SdTableItem<Node>['meta']['tree']>> = {}): SdTableItem<Node> => {
  const row = MapToSdTableItem(data);
  row.meta.tree = { level: 0, hasChildren: false, isExpanded: false, ...tree };
  return row;
};

describe('tree.util', () => {
  it('getChildrenKey defaults to children', () => {
    expect(getChildrenKey(undefined)).toBe('children');
    expect(getChildrenKey({ childrenKey: 'items' })).toBe('items');
  });

  it('resolveDefaultExpanded boolean/number', () => {
    expect(resolveDefaultExpanded(0, { defaultExpanded: false })).toBe(false);
    expect(resolveDefaultExpanded(1, { defaultExpanded: true })).toBe(true);
    expect(resolveDefaultExpanded(0, { defaultExpanded: 2 })).toBe(true);
    expect(resolveDefaultExpanded(1, { defaultExpanded: 2 })).toBe(true);
    expect(resolveDefaultExpanded(2, { defaultExpanded: 2 })).toBe(false);
    expect(resolveDefaultExpanded(3, { defaultExpanded: 2 })).toBe(false);
  });

  it('resolveHasChildren embedded vs lazy', () => {
    const embedded = item({ id: 1, name: 'a', children: [{ id: 2, name: 'b' }] });
    expect(resolveHasChildren(embedded, opt())).toBe(true);
    const lazy = item({ id: 1, name: 'a' });
    expect(resolveHasChildren(lazy, opt({ onExpandChildren: () => [] }))).toBe(true);
    const leaf = item({ id: 1, name: 'a', children: [] });
    expect(resolveHasChildren(leaf, opt())).toBe(false);
  });

  it('hasLazyChildren when no embedded data', () => {
    const lazy = item({ id: 1, name: 'a' });
    expect(hasLazyChildren(lazy, opt({ onExpandChildren: () => [] }))).toBe(true);
    const embedded = item({ id: 1, name: 'a', children: [{ id: 2, name: 'b' }] });
    expect(hasLazyChildren(embedded, opt({ onExpandChildren: () => [] }))).toBe(false);
  });

  it('flattenTree collapsed shows roots only', () => {
    const root = item({ id: 1, name: 'root', children: [{ id: 2, name: 'child' }] }, { hasChildren: true, isExpanded: false });
    root.meta.tree!.childItems = [item({ id: 2, name: 'child' }, { level: 1, hasChildren: false })];
    expect(flattenTree([root], opt()).length).toBe(1);
  });

  it('flattenTree expanded shows children', () => {
    const child = item({ id: 2, name: 'child' }, { level: 1, hasChildren: false });
    const root = item({ id: 1, name: 'root' }, { hasChildren: true, isExpanded: true, childItems: [child] });
    const flat = flattenTree([root], opt());
    expect(flat.map(r => r.data.id)).toEqual([1, 2]);
  });

  it('flattenTree respects maxDepth', () => {
    const grand = item({ id: 3, name: 'g' }, { level: 2, hasChildren: false });
    const child = item({ id: 2, name: 'c' }, { level: 1, hasChildren: true, isExpanded: true, childItems: [grand] });
    const root = item({ id: 1, name: 'r' }, { hasChildren: true, isExpanded: true, childItems: [child] });
    expect(flattenTree([root], opt({ maxDepth: 1 })).map(r => r.data.id)).toEqual([1, 2]);
  });

  it('flattenTree populates indexPath theo sibling-index (1-based) — root [1], [2]', () => {
    const r1 = item({ id: 1, name: 'r1' }, { hasChildren: false });
    const r2 = item({ id: 2, name: 'r2' }, { hasChildren: false });
    const flat = flattenTree([r1, r2], opt());
    expect(flat[0].meta.tree?.indexPath).toEqual([1]);
    expect(flat[1].meta.tree?.indexPath).toEqual([2]);
  });

  it('flattenTree indexPath nested: root [1], children [1,1] [1,2], grandchild [1,2,1]', () => {
    const grand = item({ id: 4, name: 'g' }, { level: 2, hasChildren: false });
    const c1 = item({ id: 2, name: 'c1' }, { level: 1, hasChildren: false });
    const c2 = item({ id: 3, name: 'c2' }, { level: 1, hasChildren: true, isExpanded: true, childItems: [grand] });
    const root = item({ id: 1, name: 'r' }, { hasChildren: true, isExpanded: true, childItems: [c1, c2] });
    const flat = flattenTree([root], opt());
    const pathOf = (id: number) => flat.find(r => r.data.id === id)!.meta.tree!.indexPath;
    expect(pathOf(1)).toEqual([1]);
    expect(pathOf(2)).toEqual([1, 1]);
    expect(pathOf(3)).toEqual([1, 2]);
    expect(pathOf(4)).toEqual([1, 2, 1]);
  });

  it('flattenTree indexPath join "." → STT hierarchical: "1", "1.1", "1.2", "1.2.1"', () => {
    const grand = item({ id: 4, name: 'g' }, { level: 2, hasChildren: false });
    const c1 = item({ id: 2, name: 'c1' }, { level: 1, hasChildren: false });
    const c2 = item({ id: 3, name: 'c2' }, { level: 1, hasChildren: true, isExpanded: true, childItems: [grand] });
    const root = item({ id: 1, name: 'r' }, { hasChildren: true, isExpanded: true, childItems: [c1, c2] });
    const flat = flattenTree([root], opt());
    const labels = flat.map(r => r.meta.tree!.indexPath!.join('.'));
    expect(labels).toEqual(['1', '1.1', '1.2', '1.2.1']);
  });

  it('flattenTree skips circular refs', () => {
    const a = item({ id: 1, name: 'a' }, { hasChildren: true, isExpanded: true });
    const b = item({ id: 2, name: 'b' }, { level: 1, hasChildren: false });
    a.meta.tree!.childItems = [b];
    b.meta.id = a.meta.id;
    expect(flattenTree([a], opt()).length).toBe(1);
  });

  it('collectFormattedTreeRows walks nested childItems', () => {
    const grand = item({ id: 3, name: 'g' }, { level: 2, hasChildren: false });
    const child = item({ id: 2, name: 'c' }, { level: 1, hasChildren: true, childItems: [grand] });
    const root = item({ id: 1, name: 'r' }, { hasChildren: true, childItems: [child] });
    expect(collectFormattedTreeRows([root]).map(r => r.data.id)).toEqual([1, 2, 3]);
  });

  it('getChildrenFromData reads custom key', () => {
    expect(getChildrenFromData({ id: 1, items: [{ id: 2 }] } as any, { childrenKey: 'items' })).toEqual([{ id: 2 }] as any);
  });

  it('getChildrenFromData defaults to children and returns [] khi không phải array', () => {
    expect(getChildrenFromData({ id: 1, children: [{ id: 2 }] } as any)).toEqual([{ id: 2 }] as any);
    expect(getChildrenFromData({ id: 1, children: null } as any)).toEqual([]);
    expect(getChildrenFromData({ id: 1 } as any)).toEqual([]);
  });

  it('resolveHasChildren = false khi không có embedded data và không có lazy loader', () => {
    const lazy = item({ id: 1, name: 'a' });
    expect(resolveHasChildren(lazy, opt())).toBe(false);
  });

  it('resolveDefaultExpanded fallback false khi option undefined', () => {
    expect(resolveDefaultExpanded(0, undefined)).toBe(false);
  });

  it('hasLazyChildren = false khi không có loader', () => {
    const lazy = item({ id: 1, name: 'a' });
    expect(hasLazyChildren(lazy, opt())).toBe(false);
  });

  it('flattenTree không có option trả nguyên roots', () => {
    const roots = [item({ id: 1, name: 'a' })];
    expect(flattenTree(roots)).toBe(roots);
  });

  it('flattenTree dừng descend khi hasChildren=false dù isExpanded=true', () => {
    const child = item({ id: 2, name: 'c' }, { level: 1, hasChildren: false });
    const root = item({ id: 1, name: 'r' }, { hasChildren: false, isExpanded: true, childItems: [child] });
    expect(flattenTree([root], opt()).length).toBe(1);
  });

  it('flattenTree đa root vẫn flatten đúng thứ tự depth-first', () => {
    const c1 = item({ id: 11, name: 'c1' }, { level: 1, hasChildren: false });
    const c2 = item({ id: 21, name: 'c2' }, { level: 1, hasChildren: false });
    const r1 = item({ id: 1, name: 'r1' }, { hasChildren: true, isExpanded: true, childItems: [c1] });
    const r2 = item({ id: 2, name: 'r2' }, { hasChildren: true, isExpanded: true, childItems: [c2] });
    expect(flattenTree([r1, r2], opt()).map(r => r.data.id)).toEqual([1, 11, 2, 21]);
  });

  describe('flattenTreeAll', () => {
    it('trả nguyên roots khi option undefined', () => {
      const roots = [item({ id: 1, name: 'a' })];
      expect(flattenTreeAll(roots)).toBe(roots);
    });

    it('flatten ALL bất kể isExpanded', () => {
      const grand = item({ id: 3, name: 'g' }, { level: 2 });
      const child = item({ id: 2, name: 'c' }, { level: 1, hasChildren: true, isExpanded: false, childItems: [grand] });
      const root = item({ id: 1, name: 'r' }, { hasChildren: true, isExpanded: false, childItems: [child] });
      expect(flattenTreeAll([root], opt()).map(r => r.data.id)).toEqual([1, 2, 3]);
    });

    it('respect maxDepth', () => {
      const grand = item({ id: 3, name: 'g' }, { level: 2 });
      const child = item({ id: 2, name: 'c' }, { level: 1, childItems: [grand] });
      const root = item({ id: 1, name: 'r' }, { childItems: [child] });
      expect(flattenTreeAll([root], opt({ maxDepth: 1 })).map(r => r.data.id)).toEqual([1, 2]);
    });

    it('skip circular by id', () => {
      const a = item({ id: 1, name: 'a' });
      const b = item({ id: 2, name: 'b' }, { level: 1 });
      a.meta.tree!.childItems = [b];
      b.meta.id = a.meta.id;
      expect(flattenTreeAll([a], opt()).length).toBe(1);
    });
  });

  describe('flattenDataTree', () => {
    it('trả nguyên roots khi option undefined', () => {
      const roots = [{ id: 1, name: 'a' }];
      expect(flattenDataTree(roots)).toBe(roots);
    });

    it('flatten dữ liệu thô theo childrenKey mặc định', () => {
      const data: Node[] = [
        { id: 1, name: 'r', children: [{ id: 2, name: 'c', children: [{ id: 3, name: 'g' }] }] },
      ];
      expect(flattenDataTree(data, opt()).map(d => d.id)).toEqual([1, 2, 3]);
    });

    it('flatten theo childrenKey tuỳ biến', () => {
      const data: any[] = [{ id: 1, items: [{ id: 2, items: [{ id: 3 }] }] }];
      expect(flattenDataTree(data, opt({ childrenKey: 'items' }) as any).map((d: any) => d.id)).toEqual([1, 2, 3]);
    });

    it('respect maxDepth ở data tree', () => {
      const data: Node[] = [
        { id: 1, name: 'r', children: [{ id: 2, name: 'c', children: [{ id: 3, name: 'g' }] }] },
      ];
      expect(flattenDataTree(data, opt({ maxDepth: 1 })).map(d => d.id)).toEqual([1, 2]);
    });

    it('skip khi cùng object reference (visited)', () => {
      const shared: Node = { id: 99, name: 'shared' };
      const data: Node[] = [
        { id: 1, name: 'a', children: [shared] },
        { id: 2, name: 'b', children: [shared] },
      ];
      expect(flattenDataTree(data, opt()).map(d => d.id)).toEqual([1, 99, 2]);
    });
  });
});
