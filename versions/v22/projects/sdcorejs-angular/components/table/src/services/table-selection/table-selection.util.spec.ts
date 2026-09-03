import { MapToSdTableItem, SdTableItem } from '../../models/table-item.model';
import { SdTableOptionTree } from '../../models/table-option-tree.model';
import {
  applyDefaultSelected,
  getSelectedRowData,
  getSelectionRows,
  resolveSelectAllState,
  restorePreservedSelection,
  syncPreservedSelection,
} from './table-selection.util';

interface SelectionRow {
  id: number;
  name: string;
  children?: SelectionRow[];
}

const item = (
  data: SelectionRow,
  tree: Partial<NonNullable<SdTableItem<SelectionRow>['meta']['tree']>> = {}
): SdTableItem<SelectionRow> => {
  const row = MapToSdTableItem(data);
  row.meta.selector = { isSelected: false, selectable: true, actions: [] };
  row.meta.tree = {
    level: 0,
    hasChildren: false,
    isExpanded: false,
    isExpanding: false,
    ...tree,
  };
  return row;
};

const treeOpt: SdTableOptionTree<SelectionRow> = { loadType: 'static', childrenKey: 'children' };

describe('table-selection.util', () => {
  it('returns flattened visible rows for tree selection', () => {
    const child = item({ id: 2, name: 'child' }, { level: 1 });
    const root = item({ id: 1, name: 'root' }, { hasChildren: true, isExpanded: true, childItems: [child] });

    expect(getSelectionRows([root], treeOpt)).toEqual([root, child]);
    expect(getSelectionRows([root], undefined)).toEqual([root]);
  });

  it('maps selected rows to raw data and resolves select-all state', () => {
    const a = item({ id: 1, name: 'a' });
    const b = item({ id: 2, name: 'b' });
    a.meta.selector!.isSelected = true;

    expect(getSelectedRowData([a, b])).toEqual([a.data]);
    expect(resolveSelectAllState([a, b])).toBeFalse();

    b.meta.selector!.isSelected = true;
    expect(resolveSelectAllState([a, b])).toBeTrue();
    expect(resolveSelectAllState([])).toBeFalse();
  });

  it('resolves select-all from selectable rows only', () => {
    const selected = item({ id: 1, name: 'selected' });
    const disabled = item({ id: 2, name: 'disabled' });
    selected.meta.selector!.isSelected = true;
    disabled.meta.selector!.selectable = false;

    expect(resolveSelectAllState([selected, disabled])).toBeTrue();
  });

  it('keeps select-all false when no row is selectable', () => {
    const disabled = item({ id: 1, name: 'disabled' });
    disabled.meta.selector!.selectable = false;

    expect(resolveSelectAllState([disabled])).toBeFalse();
  });

  it('applies default selection to collected tree rows', () => {
    const child = item({ id: 2, name: 'child' }, { level: 1 });
    const root = item({ id: 1, name: 'root' }, { hasChildren: true, childItems: [child] });

    applyDefaultSelected([root], treeOpt, row => row.id === 2);

    expect(root.meta.selector!.isSelected).toBeFalse();
    expect(child.meta.selector!.isSelected).toBeTrue();
  });

  it('restores preserved selection and updates map references', () => {
    const oldItem = item({ id: 1, name: 'old' });
    const freshItem = item({ id: 1, name: 'fresh' });
    freshItem.meta.id = oldItem.meta.id;
    const preserved = new Map<string, SdTableItem<SelectionRow>>([[oldItem.meta.id, oldItem]]);

    restorePreservedSelection([freshItem], preserved);

    expect(freshItem.meta.selector!.isSelected).toBeTrue();
    expect(preserved.get(oldItem.meta.id)).toBe(freshItem);
  });

  it('syncs visible selection into preserved map and keeps off-page entries', () => {
    const offPage = item({ id: 99, name: 'off-page' });
    const selected = item({ id: 1, name: 'selected' });
    const deselected = item({ id: 2, name: 'deselected' });
    selected.meta.selector!.isSelected = true;
    deselected.meta.selector!.isSelected = false;
    const preserved = new Map<string, SdTableItem<SelectionRow>>([
      [offPage.meta.id, offPage],
      [deselected.meta.id, deselected],
    ]);

    const result = syncPreservedSelection([selected, deselected], preserved);

    expect(preserved.has(offPage.meta.id)).toBeTrue();
    expect(preserved.get(selected.meta.id)).toBe(selected);
    expect(preserved.has(deselected.meta.id)).toBeFalse();
    expect(result).toEqual([offPage, selected]);
  });
});
