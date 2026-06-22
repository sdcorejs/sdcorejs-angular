import { MapToSdTableItem, SdTableItem } from '../../models/table-item.model';
import { canSortReorder, isReorderDisabled, reorderTableItems, sameReorderGroup, toReorderItemsIndex } from './table-reorder.util';

interface ReorderRow {
  id: number;
  name: string;
}

const item = (id: number, meta: Partial<SdTableItem<ReorderRow>['meta']> = {}): SdTableItem<ReorderRow> => {
  const row = MapToSdTableItem<ReorderRow>({ id, name: `Row ${id}` });
  row.meta = {
    ...row.meta,
    ...meta,
    tree: {
      level: 0,
      hasChildren: false,
      isExpanded: false,
      isExpanding: false,
      ...meta.tree,
    },
  };
  return row;
};

const groupHeader = (id: number, children: SdTableItem<ReorderRow>[] = []): SdTableItem<ReorderRow> =>
  item(id, {
    group: {
      isGroupHeader: true,
      items: children,
    },
  });

describe('table-reorder.util', () => {
  it('disables child rows and delegates root rows to the rowReorder callback', () => {
    const child = item(2, { tree: { level: 1, hasChildren: false, isExpanded: false } });
    const root = item(1);
    const disabled = jasmine.createSpy('disabled').and.returnValue(true);

    expect(isReorderDisabled(child, { disabled }, 5)).toBeTrue();
    expect(isReorderDisabled(root, { disabled }, 5)).toBeTrue();
    expect(disabled).toHaveBeenCalledOnceWith(root.data, 5);
  });

  it('does not call the disabled callback for synthetic group headers', () => {
    const header = groupHeader(10, [item(1)]);
    const disabled = jasmine.createSpy('disabled').and.returnValue(true);

    expect(isReorderDisabled(header, { disabled }, 0)).toBeFalse();
    expect(disabled).not.toHaveBeenCalled();
  });

  it('detects whether two rows belong to the same rendered group segment', () => {
    const a = item(1);
    const b = item(2);
    const c = item(3);
    const allItems = [groupHeader(10, [a, b]), a, b, groupHeader(20, [c]), c];

    expect(sameReorderGroup(a, b, allItems)).toBeTrue();
    expect(sameReorderGroup(a, c, allItems)).toBeFalse();
  });

  it('accepts reorder only for root rows and optionally within the same group', () => {
    const a = item(1);
    const b = item(2);
    const c = item(3);
    const child = item(4, { tree: { level: 1, hasChildren: false, isExpanded: false } });
    const allItems = [groupHeader(10, [a, b]), a, b, groupHeader(20, [c]), c];

    expect(canSortReorder({ enabled: false, index: 1, dragItem: a, allItems })).toBeFalse();
    expect(canSortReorder({ enabled: true, index: 0, dragItem: a, allItems })).toBeFalse();
    expect(canSortReorder({ enabled: true, index: 1, dragItem: child, allItems })).toBeFalse();
    expect(canSortReorder({ enabled: true, index: 2, dragItem: a, allItems, hasGroup: true })).toBeTrue();
    expect(canSortReorder({ enabled: true, index: 4, dragItem: a, allItems, hasGroup: true })).toBeFalse();
  });

  it('maps rendered drop indexes to reorderable root item indexes', () => {
    const root = item(1);
    const child = item(2, { tree: { level: 1, hasChildren: false, isExpanded: false } });
    const nextRoot = item(3);

    expect(toReorderItemsIndex([groupHeader(10, [root]), root, child, nextRoot], 3)).toBe(1);
  });

  it('moves root items and mirrors the new order into localItems by original positions', () => {
    const a = item(1);
    const b = item(2);
    const c = item(3);
    const before = item(0);
    const after = item(4);

    const result = reorderTableItems({
      items: [a, b, c],
      renderedItems: [a, b, c],
      previousRenderedIndex: 0,
      currentRenderedIndex: 2,
      localItems: [before, a, b, c, after],
    });

    expect(result.fromIndex).toBe(0);
    expect(result.toIndex).toBe(2);
    expect(result.items).toEqual([b, c, a]);
    expect(result.localItems).toEqual([before, b, c, a, after]);
  });
});
