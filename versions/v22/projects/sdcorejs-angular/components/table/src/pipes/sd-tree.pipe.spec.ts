import { MapToSdTableItem } from '../models/table-item.model';
import { SdTreePipe } from './sd-tree.pipe';

describe('SdTreePipe', () => {
  const pipe = new SdTreePipe();

  it('returns items unchanged when no tree option', () => {
    const items = [MapToSdTableItem({ id: 1 })];
    expect(pipe.transform(items, undefined, 0)).toBe(items);
  });

  it('returns flattened rows when tree option set', () => {
    const child = MapToSdTableItem({ id: 2 });
    child.meta.tree = { level: 1, hasChildren: false, isExpanded: false };
    const root = MapToSdTableItem({ id: 1 });
    root.meta.tree = { level: 0, hasChildren: true, isExpanded: true, childItems: [child] };
    const result = pipe.transform([root], { loadType: 'static', childrenKey: 'children' }, 1);
    expect(result.length).toBe(2);
  });
});
