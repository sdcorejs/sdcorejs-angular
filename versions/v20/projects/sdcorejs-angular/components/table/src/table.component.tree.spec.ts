/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tree-row regression tests cho SdTable.
 *
 * Má»¥c tiÃªu: lock hÃ nh vi cá»§a cÃ¡c API public liÃªn quan tá»›i tree (onTreeToggle,
 * rowStyle, isReorderDisabled, reorderSortPredicate, dataItems/selectedItems,
 * onClearSelection, treeRevision) trÆ°á»›c khi re-structor Ä‘á»ƒ trÃ¡nh regress.
 *
 * Strategy: trÃ¡nh cháº¡y full reload pipeline (effect + paginator + sort +
 * format service), set tháº³ng signal `tableOption` + `items` rá»“i gá»i method
 * public. Pre-format childItems Ä‘á»ƒ bá» qua TableFormatService.
 */
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';

import { SdTable } from './table.component';
import { MapToSdTableItem, SdTableItem } from './models/table-item.model';
import { SdTableOption } from './models/table-option.model';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SD_TABLE_CONFIGURATION } from './configurations';

interface Node {
  id: number;
  name: string;
  children?: Node[];
}

const i18nStub = {
  t: (k: string) => k,
  instant: (k: string) => k,
  get: (k: string) => k,
};

const makeItem = (
  data: Node,
  tree: Partial<NonNullable<SdTableItem<Node>['meta']['tree']>> = {}
): SdTableItem<Node> => {
  const it = MapToSdTableItem(data);
  it.meta.tree = { level: 0, hasChildren: false, isExpanded: false, isExpanding: false, ...tree };
  it.meta.selector = { isSelected: false, selectable: true, actions: [] };
  return it;
};

const baseOption = (over: Partial<SdTableOption<Node>> = {}): SdTableOption<Node> => ({
  type: 'local',
  items: () => [],
  columns: [
    { field: 'name', title: 'Name', type: 'string' } as any,
  ],
  tree: { childrenKey: 'children' },
  ...over,
} as SdTableOption<Node>);

const createTable = (): SdTable<Node> => {
  TestBed.configureTestingModule({
    imports: [NoopAnimationsModule],
    providers: [
      { provide: I18nService, useValue: i18nStub },
      { provide: SD_TABLE_CONFIGURATION, useValue: null },
    ],
  });
  // KHÃ”NG detectChanges: trÃ¡nh trigger required-input error (option input bá» qua),
  // signal `tableOption` set tháº³ng Ä‘á»ƒ test cÃ´ láº­p tree logic.
  const fixture = TestBed.createComponent(SdTable<Node>);
  return fixture.componentInstance;
};

describe('SdTable â€” tree row API', () => {
  describe('onTreeToggle', () => {
    let cmp: SdTable<Node>;
    let root: SdTableItem<Node>;
    let child: SdTableItem<Node>;

    beforeEach(() => {
      cmp = createTable();
      cmp.tableOption.set(baseOption());

      child = makeItem({ id: 2, name: 'c' }, { level: 1, hasChildren: false });
      root = makeItem(
        { id: 1, name: 'r', children: [{ id: 2, name: 'c' }] },
        { level: 0, hasChildren: true, isExpanded: false, childItems: [child] }
      );
      cmp.items.set([root]);
    });

    it('expand row â†’ set isExpanded = true vÃ  tÄƒng treeRevision', async () => {
      const beforeRev = cmp.treeRevision();
      await cmp.onTreeToggle(root);
      expect(root.meta.tree!.isExpanded).toBe(true);
      expect(cmp.treeRevision()).toBeGreaterThan(beforeRev);
    });

    it('collapse row Ä‘Ã£ expand â†’ set isExpanded = false', async () => {
      root.meta.tree!.isExpanded = true;
      await cmp.onTreeToggle(root);
      expect(root.meta.tree!.isExpanded).toBe(false);
    });

    it('no-op khi hasChildren = false', async () => {
      root.meta.tree!.hasChildren = false;
      const beforeRev = cmp.treeRevision();
      await cmp.onTreeToggle(root);
      expect(root.meta.tree!.isExpanded).toBe(false);
      expect(cmp.treeRevision()).toBe(beforeRev);
    });

    it('no-op khi Ä‘ang isExpanding', async () => {
      root.meta.tree!.isExpanding = true;
      await cmp.onTreeToggle(root);
      expect(root.meta.tree!.isExpanded).toBe(false);
    });

    it('lazy load â€” gá»i onExpandChildren, ghi raw data vÃ o childrenKey rá»“i expand', async () => {
      const lazyRoot = makeItem({ id: 10, name: 'lazy' }, { level: 0, hasChildren: true, isExpanded: false });
      const loader = jasmine
        .createSpy('onExpandChildren')
        .and.returnValue(Promise.resolve([{ id: 11, name: 'lazy-child' }]));
      cmp.tableOption.set(baseOption({ tree: { childrenKey: 'children', onExpandChildren: loader } } as any));
      cmp.items.set([lazyRoot]);
      // Format service khÃ´ng cÃ³ format tháº­t â†’ stub trá»±c tiáº¿p childItems sau khi loader cháº¡y.
      // Chá»‰ test contract: loader Ä‘Æ°á»£c gá»i, isExpanded = true, data.children Ä‘Æ°á»£c ghi.
      await cmp.onTreeToggle(lazyRoot);

      expect(loader).toHaveBeenCalledOnceWith(jasmine.objectContaining({ id: 10 }));
      expect((lazyRoot.data as any).children).toEqual([{ id: 11, name: 'lazy-child' }]);
      // childItems do TableFormatService format â€” khÃ´ng assert chi tiáº¿t format,
      // chá»‰ check isExpanded chuyá»ƒn true khi loader tráº£ non-empty.
      expect(lazyRoot.meta.tree!.isExpanded).toBe(true);
    });

    it('lazy load tráº£ máº£ng rá»—ng â†’ hasChildren tá»± set false vÃ  khÃ´ng expand', async () => {
      const lazyRoot = makeItem({ id: 20, name: 'empty' }, { level: 0, hasChildren: true });
      const loader = jasmine.createSpy().and.returnValue(Promise.resolve([]));
      cmp.tableOption.set(baseOption({ tree: { childrenKey: 'children', onExpandChildren: loader } } as any));
      cmp.items.set([lazyRoot]);
      await cmp.onTreeToggle(lazyRoot);
      expect(lazyRoot.meta.tree!.hasChildren).toBe(false);
      expect(lazyRoot.meta.tree!.isExpanded).toBe(false);
    });
  });

  describe('rowStyle', () => {
    it('tráº£ null khi style.rowCss khÃ´ng cáº¥u hÃ¬nh', () => {
      const cmp = createTable();
      cmp.tableOption.set(baseOption());
      const row = makeItem({ id: 1, name: 'r' });
      expect(cmp.rowStyle(row, 0)).toBeNull();
    });

    it('truyá»n ctx { level, hasChildren, isExpanded } khi cÃ³ tree option', () => {
      const cmp = createTable();
      const rowCss = jasmine.createSpy('rowCss').and.returnValue({ color: 'red' });
      cmp.tableOption.set(baseOption({ style: { rowCss } as any }));
      const row = makeItem({ id: 1, name: 'r' }, { level: 2, hasChildren: true, isExpanded: true });
      const result = cmp.rowStyle(row, 5);
      expect(result).toEqual({ color: 'red' });
      expect(rowCss).toHaveBeenCalledWith(row.data, 5, { level: 2, hasChildren: true, isExpanded: true });
    });

    it('khÃ´ng truyá»n ctx khi tree option undefined', () => {
      const cmp = createTable();
      const rowCss = jasmine.createSpy().and.returnValue(null);
      cmp.tableOption.set(baseOption({ tree: undefined, style: { rowCss } as any }));
      const row = makeItem({ id: 1, name: 'r' }, { level: 1, hasChildren: true });
      cmp.rowStyle(row, 0);
      expect(rowCss).toHaveBeenCalledWith(row.data, 0, undefined);
    });
  });

  describe('isReorderDisabled', () => {
    it('luÃ´n true khi level > 0 (child row khÃ´ng Ä‘Æ°á»£c drag)', () => {
      const cmp = createTable();
      cmp.tableOption.set(baseOption({ rowReorder: { enabled: true } as any }));
      const child = makeItem({ id: 2, name: 'c' }, { level: 1, hasChildren: false });
      expect(cmp.isReorderDisabled(child)).toBe(true);
    });

    it('false cho root row khi rowReorder khÃ´ng cÃ³ disabled callback', () => {
      const cmp = createTable();
      cmp.tableOption.set(baseOption({ rowReorder: { enabled: true } as any }));
      const root = makeItem({ id: 1, name: 'r' });
      cmp.items.set([root]);
      expect(cmp.isReorderDisabled(root)).toBe(false);
    });
  });

  describe('reorderSortPredicate', () => {
    it('reject khi rowReorder khÃ´ng enabled', () => {
      const cmp = createTable();
      cmp.tableOption.set(baseOption());
      const drop = { data: [makeItem({ id: 1, name: 'r' })] } as unknown as CdkDropList<SdTableItem<Node>[]>;
      const drag = { data: makeItem({ id: 1, name: 'r' }) } as unknown as CdkDrag<SdTableItem<Node>>;
      expect(cmp.reorderSortPredicate(0, drag, drop)).toBe(false);
    });

    it('reject khi drag tá»« child row (level > 0)', () => {
      const cmp = createTable();
      cmp.tableOption.set(baseOption({ rowReorder: { enabled: true } as any }));
      const target = makeItem({ id: 1, name: 'r' });
      const child = makeItem({ id: 2, name: 'c' }, { level: 1, hasChildren: false });
      const drop = { data: [target] } as unknown as CdkDropList<SdTableItem<Node>[]>;
      const drag = { data: child } as unknown as CdkDrag<SdTableItem<Node>>;
      expect(cmp.reorderSortPredicate(0, drag, drop)).toBe(false);
    });

    it('reject khi target lÃ  child row (level > 0)', () => {
      const cmp = createTable();
      cmp.tableOption.set(baseOption({ rowReorder: { enabled: true } as any }));
      const target = makeItem({ id: 2, name: 'c' }, { level: 1, hasChildren: false });
      const drag = makeItem({ id: 1, name: 'r' });
      const drop = { data: [target] } as unknown as CdkDropList<SdTableItem<Node>[]>;
      expect(cmp.reorderSortPredicate(0, { data: drag } as any, drop)).toBe(false);
    });

    it('accept root â†’ root khi khÃ´ng cÃ³ group', () => {
      const cmp = createTable();
      cmp.tableOption.set(baseOption({ rowReorder: { enabled: true } as any }));
      const r1 = makeItem({ id: 1, name: 'a' });
      const r2 = makeItem({ id: 2, name: 'b' });
      const drop = { data: [r1, r2] } as unknown as CdkDropList<SdTableItem<Node>[]>;
      expect(cmp.reorderSortPredicate(1, { data: r1 } as any, drop)).toBe(true);
    });
  });

  describe('dataItems / selectedItems', () => {
    it('dataItems map vá» raw data', () => {
      const cmp = createTable();
      cmp.tableOption.set(baseOption());
      const a = makeItem({ id: 1, name: 'a' });
      const b = makeItem({ id: 2, name: 'b' });
      cmp.items.set([a, b]);
      expect(cmp.dataItems).toEqual([{ id: 1, name: 'a' }, { id: 2, name: 'b' }] as any);
    });

    it('selectedItems chá»‰ tráº£ nhá»¯ng item Ä‘Ã£ isSelected', () => {
      const cmp = createTable();
      cmp.tableOption.set(baseOption());
      const a = makeItem({ id: 1, name: 'a' });
      const b = makeItem({ id: 2, name: 'b' });
      a.meta.selector!.isSelected = true;
      cmp.selectedTableItems.set([a]);
      expect(cmp.selectedItems).toEqual([{ id: 1, name: 'a' }] as any);
      expect(cmp.selectedItems.length).toBe(1);
      expect(b.meta.selector!.isSelected).toBe(false);
    });
  });

  describe('onClearSelection', () => {
    it('reset isSelected = false trÃªn má»i item truyá»n vÃ o vÃ  táº¯t isSelectAll', () => {
      const cmp = createTable();
      cmp.tableOption.set(baseOption());
      const a = makeItem({ id: 1, name: 'a' });
      const b = makeItem({ id: 2, name: 'b' });
      a.meta.selector!.isSelected = true;
      b.meta.selector!.isSelected = true;
      cmp.items.set([a, b]);
      cmp.isSelectAll.set(true);

      cmp.onClearSelection();

      expect(a.meta.selector!.isSelected).toBe(false);
      expect(b.meta.selector!.isSelected).toBe(false);
      expect(cmp.isSelectAll()).toBe(false);
    });

    it('default vá» this.items() khi khÃ´ng truyá»n argument', () => {
      const cmp = createTable();
      cmp.tableOption.set(baseOption());
      const a = makeItem({ id: 1, name: 'a' });
      a.meta.selector!.isSelected = true;
      cmp.items.set([a]);
      cmp.onClearSelection();
      expect(a.meta.selector!.isSelected).toBe(false);
    });
  });

  describe('trackBy', () => {
    it('tráº£ meta.id á»•n Ä‘á»‹nh cho row', () => {
      const cmp = createTable();
      const item = makeItem({ id: 1, name: 'a' });
      expect(cmp.trackBy(0, item)).toBe(item.meta.id);
    });
  });
});

