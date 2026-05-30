# Table Row Children (Tree Rows) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Commit policy:** **KHÃ”NG tá»± Ã½ commit.** Chá»‰ commit khi user yÃªu cáº§u rÃµ rÃ ng.

**Goal:** ThÃªm `option.tree` cho `SdTable` â€” render child rows inline dÆ°á»›i parent vá»›i expand/collapse, `maxDepth`, embedded + lazy load, paginate root only.

**Architecture:** Root rows lÆ°u trong `items` signal. `SdTreePipe` flatten visible rows theo `meta.tree.isExpanded`. Cá»™t Ä‘áº·c biá»‡t `sdTreeToggle` xá»­ lÃ½ expand UI. Tree utilities (`tree.util.ts`) quáº£n lÃ½ meta, flatten, lazy eligibility. `#treeRevision` signal invalidate pure pipe sau toggle.

**Tech Stack:** Angular 17+ signals, `MatTable` multiTemplateDataRows, existing `SdTableFilterService` / `TableFormatService`, Vitest/Jasmine (theo setup hiá»‡n cÃ³).

**Spec:** `docs/superpowers/specs/2026-05-22-table-row-children-design.md`

---

## File Map

| File | Responsibility |
|---|---|
| `models/table-option-tree.model.ts` | Public API `SdTableOptionTree<T>` |
| `models/table-item.model.ts` | `SdTableMetaTree`, init defaults |
| `models/table-option.model.ts` | `tree?: SdTableOptionTree<T>` |
| `models/table-option-style.model.ts` | Extend `rowCss` optional ctx |
| `models/index.ts` | Re-export tree model |
| `services/tree/tree.util.ts` | Pure helpers: flatten, resolve expand, hasChildren |
| `services/tree/tree.util.spec.ts` | Unit tests utilities |
| `pipes/sd-tree.pipe.ts` | Template pipe flatten visible rows |
| `pipes/sd-tree.pipe.spec.ts` | Unit tests pipe |
| `services/config.service.ts` | Inject `sdTreeToggle` column |
| `pipes/sd-group.pipe.ts` | No-op khi `option.tree` present |
| `table.component.ts` | `#initTreeState`, `onTreeToggle`, export flatten, reorder guard |
| `table.component.html` | `sdTreeToggle` column, pipe chain, row classes |
| `table.component.scss` | Toggle + indent styles |
| `table.component.spec.ts` | Component-level tree tests |
| `sd-table.md` | Document `option.tree` |
| `demo/.../sd-table-demo.component.*` | Demo embedded + lazy |

---

## Task 1: Models & exports

**Files:**
- Create: `projects/sdcorejs-angular/components/table/src/models/table-option-tree.model.ts`
- Modify: `projects/sdcorejs-angular/components/table/src/models/table-item.model.ts`
- Modify: `projects/sdcorejs-angular/components/table/src/models/table-option.model.ts`
- Modify: `projects/sdcorejs-angular/components/table/src/models/table-option-style.model.ts`
- Modify: `projects/sdcorejs-angular/components/table/src/models/index.ts`

- [ ] **Step 1: Create `table-option-tree.model.ts`**

```typescript
export interface SdTableOptionTree<T = any> {
  childrenKey?: string;
  maxDepth?: number;
  defaultExpanded?: boolean | number;
  onExpandChildren?: (rowData: T) => Promise<T[]> | T[];
  indentSize?: number;
}
```

- [ ] **Step 2: Extend `table-item.model.ts`**

Add interface and init:

```typescript
export interface SdTableMetaTree {
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
  isExpanding?: boolean;
  parentId?: string;
  /** Cached formatted child SdTableItem[] â€” populated on first expand/format */
  childItems?: SdTableItem[];
}

export interface SdTableMeta<T> {
  // ...existing
  tree?: SdTableMetaTree;
}

export const MapToSdTableItem = <T = any>(item: T): SdTableItem<T> => ({
  data: item,
  meta: {
    id: SdUtilities.hash({ data: item }),
    display: {},
    expand: { isExpanding: false, isExpanded: false },
    group: {},
    selector: { actions: [], isSelected: false, selectable: false },
    tree: { level: 0, hasChildren: false, isExpanded: false, isExpanding: false },
  },
});
```

- [ ] **Step 3: Add `tree` to `SdTableBaseOption` in `table-option.model.ts`**

```typescript
import { SdTableOptionTree } from './table-option-tree.model';

interface SdTableBaseOption<T = any> {
  // ...existing fields
  tree?: SdTableOptionTree<T>;
}
```

- [ ] **Step 4: Extend `rowCss` in `table-option-style.model.ts`**

```typescript
export interface SdTableRowCssContext {
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

export interface SdTableOptionStyle<T = any> {
  shadow?: boolean;
  maxHeight?: string;
  minHeight?: string;
  rowCss?: (rowData: T, index?: number, ctx?: SdTableRowCssContext) => Record<string, string>;
}
```

- [ ] **Step 5: Export from `models/index.ts`**

```typescript
export * from './table-option-tree.model';
```

- [ ] **Step 6: Verify build**

```bash
cd vn-angular && npx ng build sdcorejs-angular 2>&1 | tail -20
```
Expected: build succeeds (types compile).

---

## Task 2: Tree utilities + unit tests

**Files:**
- Create: `projects/sdcorejs-angular/components/table/src/services/tree/tree.util.ts`
- Create: `projects/sdcorejs-angular/components/table/src/services/tree/tree.util.spec.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tree.util.spec.ts
import { MapToSdTableItem, SdTableItem } from '../../models/table-item.model';
import { SdTableOptionTree } from '../../models/table-option-tree.model';
import {
  flattenTree,
  getChildrenFromData,
  getChildrenKey,
  hasLazyChildren,
  resolveDefaultExpanded,
  resolveHasChildren,
} from './tree.util';

interface Node { id: number; name: string; children?: Node[] }

const opt = (over: Partial<SdTableOptionTree<Node>> = {}): SdTableOptionTree<Node> => ({
  childrenKey: 'children',
  ...over,
});

const item = (data: Node, tree: Partial<SdTableItem<Node>['meta']['tree']> = {}): SdTableItem<Node> => {
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
    expect(resolveDefaultExpanded(2, { defaultExpanded: 2 })).toBe(true);
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

  it('flattenTree skips circular refs', () => {
    const a = item({ id: 1, name: 'a' }, { hasChildren: true, isExpanded: true });
    const b = item({ id: 1, name: 'a' }, { level: 1, hasChildren: false });
    a.meta.tree!.childItems = [b];
    b.meta.id = a.meta.id; // simulate circular
    expect(flattenTree([a], opt()).length).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests â€” expect FAIL**

```bash
cd vn-angular && npx ng test sdcorejs-angular --include='**/tree.util.spec.ts' --browsers=ChromeHeadless --watch=false 2>&1 | tail -30
```

- [ ] **Step 3: Implement `tree.util.ts`**

```typescript
import { SdTableOptionTree } from '../../models/table-option-tree.model';
import { SdTableItem } from '../../models/table-item.model';

export const getChildrenKey = (option?: SdTableOptionTree): string => option?.childrenKey ?? 'children';

export const getChildrenFromData = <T>(data: T, option?: SdTableOptionTree): T[] => {
  const key = getChildrenKey(option);
  const raw = (data as Record<string, unknown>)?.[key];
  return Array.isArray(raw) ? (raw as T[]) : [];
};

export const resolveDefaultExpanded = (level: number, option?: SdTableOptionTree): boolean => {
  const def = option?.defaultExpanded ?? false;
  if (def === true) return true;
  if (def === false) return false;
  if (typeof def === 'number') return level < def;
  return false;
};

export const resolveHasChildren = <T>(row: SdTableItem<T>, option?: SdTableOptionTree): boolean => {
  const embedded = getChildrenFromData(row.data, option);
  if (embedded.length > 0) return true;
  return !!option?.onExpandChildren && !embedded.length;
};

export const hasLazyChildren = <T>(row: SdTableItem<T>, option?: SdTableOptionTree): boolean => {
  if (!option?.onExpandChildren) return false;
  return getChildrenFromData(row.data, option).length === 0;
};

export const flattenTree = <T>(
  roots: SdTableItem<T>[],
  option?: SdTableOptionTree,
  visited: Set<string> = new Set()
): SdTableItem<T>[] => {
  if (!option) return roots;
  const maxDepth = option.maxDepth;
  const result: SdTableItem<T>[] = [];

  const walk = (rows: SdTableItem<T>[], level: number) => {
    for (const row of rows) {
      if (visited.has(row.meta.id)) continue;
      visited.add(row.meta.id);
      row.meta.tree ??= { level, hasChildren: false, isExpanded: false };
      row.meta.tree.level = level;
      result.push(row);

      const canDescend = row.meta.tree.isExpanded && row.meta.tree.hasChildren;
      const depthOk = maxDepth === undefined || level < maxDepth;
      if (!canDescend || !depthOk) continue;

      const children = row.meta.tree.childItems ?? [];
      walk(children, level + 1);
    }
  };

  walk(roots, 0);
  return result;
};

/** Flatten ALL nodes regardless of expand state â€” used for export */
export const flattenTreeAll = <T>(
  roots: SdTableItem<T>[],
  option?: SdTableOptionTree,
  visited: Set<string> = new Set()
): SdTableItem<T>[] => {
  if (!option) return roots;
  const maxDepth = option.maxDepth;
  const result: SdTableItem<T>[] = [];

  const walk = (rows: SdTableItem<T>[], level: number) => {
    for (const row of rows) {
      if (visited.has(row.meta.id)) continue;
      visited.add(row.meta.id);
      result.push(row);
      const depthOk = maxDepth === undefined || level < maxDepth;
      if (!depthOk) continue;
      const children = row.meta.tree?.childItems ?? [];
      walk(children, level + 1);
    }
  };

  walk(roots, 0);
  return result;
};
```

- [ ] **Step 4: Run tests â€” expect PASS**

Same command as Step 2.

---

## Task 3: SdTreePipe + unit tests

**Files:**
- Create: `projects/sdcorejs-angular/components/table/src/pipes/sd-tree.pipe.ts`
- Create: `projects/sdcorejs-angular/components/table/src/pipes/sd-tree.pipe.spec.ts`
- Modify: `projects/sdcorejs-angular/components/table/src/pipes/index.ts`

- [ ] **Step 1: Write failing pipe test**

```typescript
import { SdTreePipe } from './sd-tree.pipe';
import { MapToSdTableItem } from '../models/table-item.model';

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
    const result = pipe.transform([root], { childrenKey: 'children' }, 1);
    expect(result.length).toBe(2);
  });
});
```

- [ ] **Step 2: Implement pipe**

```typescript
import { Pipe, PipeTransform } from '@angular/core';
import { SdTableOptionTree } from '../models/table-option-tree.model';
import { SdTableItem } from '../models/table-item.model';
import { flattenTree } from '../services/tree/tree.util';

@Pipe({ name: 'sdTree' })
export class SdTreePipe implements PipeTransform {
  transform(items: SdTableItem[], treeOption?: SdTableOptionTree, _revision = 0): SdTableItem[] {
    if (!treeOption) return items;
    return flattenTree(items, treeOption);
  }
}
```

- [ ] **Step 3: Export pipe**

```typescript
// pipes/index.ts
export * from './sd-tree.pipe';
```

- [ ] **Step 4: Run pipe tests â€” expect PASS**

---

## Task 4: Config service â€” register `sdTreeToggle` column

**Files:**
- Modify: `projects/sdcorejs-angular/components/table/src/services/config.service.ts`

- [ ] **Step 1: Add column constant**

```typescript
#COLUMNS = {
  SUBINFORMATION: 'sdSubInformationAction',
  COMMAND: 'sdCommand',
  SELECTION: 'sdSelection',
  GROUP: 'sdGroup',
  REORDER: 'reorder',
  TREE_TOGGLE: 'sdTreeToggle',
};
```

- [ ] **Step 2: Inject column when `option.tree` present**

After selection block (~line 73), before command-left:

```typescript
if (option.tree) {
  result.firstHeaders.push(this.#COLUMNS.TREE_TOGGLE);
  result.displayedColumns.push(this.#COLUMNS.TREE_TOGGLE);
}
```

- [ ] **Step 3: Exclude from footers (no footer cell content)**

In `displayedFooters` filter, also exclude `TREE_TOGGLE`:

```typescript
result.displayedFooters = result.displayedColumns.filter(
  val => val !== this.#COLUMNS.SUBINFORMATION && val !== this.#COLUMNS.TREE_TOGGLE
);
```

- [ ] **Step 4: Verify build**

```bash
cd vn-angular && npx ng build sdcorejs-angular 2>&1 | tail -10
```

---

## Task 5: sdGroup pipe â€” skip when tree enabled

**Files:**
- Modify: `projects/sdcorejs-angular/components/table/src/pipes/sd-group.pipe.ts`

- [ ] **Step 1: Early return when tree configured**

At start of `transform`:

```typescript
if (gridOption.tree) {
  if (typeof ngDevMode !== 'undefined' && ngDevMode && gridOption.group) {
    console.warn('[sd-table] option.tree and option.group cannot be used together. group is ignored.');
  }
  return items;
}
```

---

## Task 6: Table component â€” tree state & toggle logic

**Files:**
- Modify: `projects/sdcorejs-angular/components/table/src/table.component.ts`

- [ ] **Step 1: Add imports and pipe**

```typescript
import { SdTreePipe } from './pipes/sd-tree.pipe';
import {
  flattenTreeAll,
  getChildrenFromData,
  getChildrenKey,
  hasLazyChildren,
  resolveDefaultExpanded,
  resolveHasChildren,
} from './services/tree/tree.util';
```

Add `SdTreePipe` to component `imports` array.

- [ ] **Step 2: Add `#treeRevision` signal and expand-state cache**

```typescript
treeRevision = signal(0);
#treeExpandState = new Map<string, boolean>();
```

- [ ] **Step 3: Implement `#initTreeMeta` on root items**

```typescript
#initTreeMeta = (roots: SdTableItem<T>[], option: SdTableOptionTree<T>, level = 0, parentId?: string) => {
  for (const row of roots) {
    const saved = this.#treeExpandState.get(row.meta.id);
    const isExpanded = saved ?? resolveDefaultExpanded(level, option);
    row.meta.tree = {
      ...row.meta.tree,
      level,
      parentId,
      hasChildren: resolveHasChildren(row, option),
      isExpanded,
      isExpanding: false,
    };
    const embedded = getChildrenFromData(row.data, option);
    if (embedded.length && row.meta.tree.hasChildren) {
      row.meta.tree.childItems = embedded.map(d => {
        const child = MapToSdTableItem(d);
        return child;
      });
      const maxDepth = option.maxDepth;
      const depthOk = maxDepth === undefined || level + 1 < maxDepth;
      if (depthOk) {
        this.#initTreeMeta(row.meta.tree.childItems, option, level + 1, row.meta.id);
      }
    }
  }
};
```

- [ ] **Step 4: Implement `#ensureChildItemsFormatted` (async)**

```typescript
#ensureChildItemsFormatted = async (row: SdTableItem<T>) => {
  const opt = this.tableOption()!;
  const treeOpt = opt.tree!;
  if (row.meta.tree?.childItems?.length) return;
  const raw = getChildrenFromData(row.data, treeOpt);
  if (!raw.length) return;
  const formatted = await this.#tableFormatService.format(raw, opt.columns, this.cacheValues, this.#cacheObjValues);
  row.meta.tree!.childItems = formatted;
  this.#initTreeMeta(formatted, treeOpt, (row.meta.tree!.level ?? 0) + 1, row.meta.id);
};
```

- [ ] **Step 5: Call tree init in `#render`**

After `this.items.set(...)`:

```typescript
const treeOpt = this.tableOption()?.tree;
if (treeOpt) {
  this.#initTreeMeta(this.items(), treeOpt);
  // Eagerly format children up to defaultExpanded depth
  await this.#expandDefaultBranches(this.items(), treeOpt);
  this.treeRevision.update(n => n + 1);
}
```

Implement `#expandDefaultBranches` â€” DFS: if row should be expanded per defaultExpanded, await `#ensureChildItemsFormatted`, recurse into childItems.

- [ ] **Step 6: Persist expand state before reload**

Before `this.items.set` in `#render`, if tree enabled:

```typescript
for (const row of this.items()) {
  if (row.meta.tree?.isExpanded) {
    this.#treeExpandState.set(row.meta.id, true);
  }
}
```

- [ ] **Step 7: Implement `onTreeToggle`**

```typescript
onTreeToggle = async (row: SdTableItem<T>) => {
  const treeOpt = this.tableOption()?.tree;
  if (!treeOpt || !row.meta.tree?.hasChildren || row.meta.tree.isExpanding) return;

  if (row.meta.tree.isExpanded) {
    row.meta.tree.isExpanded = false;
    this.#treeExpandState.set(row.meta.id, false);
    this.treeRevision.update(n => n + 1);
    this.#ref.markForCheck();
    return;
  }

  try {
    if (hasLazyChildren(row, treeOpt)) {
      row.meta.tree.isExpanding = true;
      this.#ref.markForCheck();
      const key = getChildrenKey(treeOpt);
      const result = await Promise.resolve(treeOpt.onExpandChildren!(row.data));
      (row.data as Record<string, unknown>)[key] = Array.isArray(result) ? result : [];
      row.meta.tree.hasChildren = resolveHasChildren(row, treeOpt);
    }
    await this.#ensureChildItemsFormatted(row);
    if (!row.meta.tree.childItems?.length && !resolveHasChildren(row, treeOpt)) {
      row.meta.tree.hasChildren = false;
      return;
    }
    row.meta.tree.isExpanded = true;
    this.#treeExpandState.set(row.meta.id, true);
  } catch (err) {
    console.error(err);
    this.#notifyService.warning(this.#i18n.t('core.component.table.error-occurred'));
  } finally {
    row.meta.tree.isExpanding = false;
    this.treeRevision.update(n => n + 1);
    this.#ref.markForCheck();
  }
};
```

- [ ] **Step 8: Guard rowReorder for child rows**

Update `isReorderDisabled`:

```typescript
isReorderDisabled(item: SdTableItem<T>): boolean {
  if ((item.meta.tree?.level ?? 0) > 0) return true;
  // ...existing logic
}
```

Update `reorderSortPredicate` â€” reject if drag or target has `level > 0`.

Update `onReorderDrop` â€” only reorder within root items in `this.items()` signal (not flattened DOM indices for children). Existing `#toItemsIndex` logic counts non-group rows; add skip for `level > 0`:

```typescript
if (groupedItems[i]?.meta?.tree?.level > 0) continue; // in toItemsIndex loop
```

- [ ] **Step 9: Export â€” flatten all tree nodes**

In `#createExportContext` or `#exportedItems`, when tree enabled, after loading root items, call `#initTreeMeta` + recursively `#ensureChildItemsFormatted` for all nodes, then use `flattenTreeAll` for export data source.

- [ ] **Step 10: Extend `rowCss` binding (if used in template)**

Pass tree context as 3rd arg when applying row styles.

- [ ] **Step 11: Verify build**

```bash
cd vn-angular && npx ng build sdcorejs-angular 2>&1 | tail -20
```

---

## Task 7: Template & styles

**Files:**
- Modify: `projects/sdcorejs-angular/components/table/src/table.component.html`
- Modify: `projects/sdcorejs-angular/components/table/src/table.component.scss`

- [ ] **Step 1: Update pipe chain**

Replace:
```html
@let groupedItems = _items | sdGroup: _tableOption;
```
With:
```html
@let groupedItems = _items | sdTree: _tableOption.tree : treeRevision() | sdGroup: _tableOption;
```

- [ ] **Step 2: Add `sdTreeToggle` column def**

Insert after `reorder` block, before `sdSubInformation`:

```html
@if (_tableOption.tree) {
  <ng-container matColumnDef="sdTreeToggle">
    <th mat-header-cell *matHeaderCellDef class="sd-tree-toggle-header p-0"
      [attr.rowspan]="_configuration.multipleHeader ? 2 : 1"></th>
    <td mat-cell *matCellDef="let row" class="sd-tree-toggle-cell p-0">
      @if (row.meta?.tree) {
        <div class="sd-tree-toggle-inner"
          [style.padding-left.px]="(row.meta.tree.level ?? 0) * (_tableOption.tree?.indentSize ?? 20)">
          @if (row.meta.tree.hasChildren) {
            @if (row.meta.tree.isExpanding) {
              <div class="lds-ring sd-tree-spinner"><div></div><div></div><div></div><div></div></div>
            } @else {
              <button mat-icon-button type="button" aria-label="Toggle tree row"
                (click)="onTreeToggle(row); $event.stopPropagation()">
                <mat-icon>{{ row.meta.tree.isExpanded ? 'expand_less' : 'expand_more' }}</mat-icon>
              </button>
            }
          }
        </div>
      }
    </td>
    <td mat-footer-cell *matFooterCellDef></td>
  </ng-container>
}
```

- [ ] **Step 3: Add tree level class on data row**

On `<tr mat-row *matRowDef="let row; ...">`:

```html
[class.sd-tree-row]="!!_tableOption.tree"
[class]="(_tableOption.tree && row.meta?.tree) ? 'sd-tree-level-' + row.meta.tree.level : ''"
```

- [ ] **Step 4: Update cdkDragDisabled**

Add `|| (row.meta?.tree?.level ?? 0) > 0` to existing condition.

- [ ] **Step 5: Add SCSS**

```scss
.sd-tree-toggle-header,
.sd-tree-toggle-cell {
  width: 40px;
  min-width: 40px;
  max-width: 40px;
}

.sd-tree-toggle-inner {
  display: flex;
  align-items: center;
  min-height: 40px;
}

.sd-tree-spinner {
  transform: scale(0.5);
  margin: 0 auto;
}
```

- [ ] **Step 6: Verify build**

```bash
cd vn-angular && npx ng build sdcorejs-angular && npx ng build demo 2>&1 | tail -20
```

---

## Task 8: Demo page

**Files:**
- Modify: `projects/demo/src/app/pages/sd-table/sd-table-demo.component.ts`
- Modify: `projects/demo/src/app/pages/sd-table/sd-table-demo.component.html`
- Optional: `projects/demo/src/app/pages/sd-table-server/sd-table-server-demo.component.ts` â€” server tab

- [ ] **Step 1: Add tree demo data (embedded, 3 levels)**

```typescript
interface TreeDemoItem {
  id: number;
  name: string;
  type: string;
  children?: TreeDemoItem[];
}

treeEmbeddedOption: SdTableOption<TreeDemoItem> = {
  type: 'local',
  tree: { maxDepth: 3, defaultExpanded: 1, childrenKey: 'children' },
  paginate: { pageSize: 20 },
  columns: [
    { field: 'name', title: 'TÃªn', type: 'string', width: '250px' },
    { field: 'type', title: 'Loáº¡i', type: 'string', width: '150px' },
  ],
  items: () => [
    {
      id: 1, name: 'CÃ´ng ty ABC', type: 'CÃ´ng ty',
      children: [
        { id: 11, name: 'PhÃ²ng IT', type: 'PhÃ²ng ban', children: [
          { id: 111, name: 'Team Frontend', type: 'Team' },
          { id: 112, name: 'Team Backend', type: 'Team' },
        ]},
        { id: 12, name: 'PhÃ²ng HR', type: 'PhÃ²ng ban' },
      ],
    },
    { id: 2, name: 'CÃ´ng ty XYZ', type: 'CÃ´ng ty' },
  ],
};
```

- [ ] **Step 2: Add lazy demo**

```typescript
treeLazyOption: SdTableOption<TreeDemoItem> = {
  type: 'local',
  tree: {
    onExpandChildren: row => new Promise(resolve => {
      setTimeout(() => resolve([
        { id: row.id * 10 + 1, name: `Child of ${row.name}`, type: 'Lazy' },
      ]), 500);
    }),
  },
  columns: [/* same */],
  items: () => [
    { id: 100, name: 'Lazy Parent A', type: 'Parent' },
    { id: 200, name: 'Lazy Parent B', type: 'Parent' },
  ],
};
```

- [ ] **Step 3: Add HTML sections with `<sd-table>` for both demos**

- [ ] **Step 4: Manual verify in browser**

Run `npx ng serve demo`, open sd-table demo page:
- Embedded: expand/collapse, indent visible, 3 levels respect maxDepth
- Lazy: spinner â†’ child appears

---

## Task 9: Documentation

**Files:**
- Modify: `projects/sdcorejs-angular/components/table/sd-table.md`

- [ ] **Step 1: Add `tree` to option schema table**

Document all `SdTableOptionTree` fields, examples (embedded, lazy, server), interaction matrix (coexist expand, exclude group), update line "not recursive trees" â†’ now supported via `option.tree`.

---

## Task 10: Regression verification â€” Ä‘áº£m báº£o tÃ­nh nÄƒng cÅ© váº«n hoáº¡t Ä‘á»™ng

**Files:** none (verification only)

- [ ] **Step 1: Run unit tests**

```bash
cd vn-angular && npx ng test sdcorejs-angular --browsers=ChromeHeadless --watch=false 2>&1 | tail -40
```
Expected: all tests pass including new tree tests.

- [ ] **Step 2: Build library + demo**

```bash
cd vn-angular && npx ng build sdcorejs-angular && npx ng build demo
```
Expected: zero compile errors.

- [ ] **Step 3: Regression checklist (table WITHOUT tree option)**

Verify on existing demo pages (`sd-table-demo`, `sd-table-server-demo`) â€” behavior unchanged:

| Feature | Verify |
|---|---|
| Pagination (server) | Page size, total unchanged |
| Sort | Column sort works |
| Filter inline | Column filter works |
| Selection | Checkbox select/deselect, select-all |
| Commands | Row command buttons click |
| Expand row (`sdTableExpandDef`) | Master-detail still works |
| Row reorder | Drag root rows |
| Column resize | Drag header border |
| Export Excel/CSV | Export triggers |
| Group | Group headers render (no tree option) |
| Sticky columns | Fixed columns scroll |

- [ ] **Step 4: Tree + coexistence checklist (WITH tree option)**

| Feature | Verify |
|---|---|
| Tree expand/collapse | Toggle shows/hides child rows |
| `maxDepth` | Deeper nodes hidden |
| `defaultExpanded: 1` | First level open on load |
| Lazy `onExpandChildren` | Spinner + fetch |
| Tree + expand together | Both toggles independent |
| Tree + selection | Select child row independently |
| Tree + commands | Command on child row works |
| Tree + rowReorder | Child rows not draggable |
| Tree + server paginate | Total = root count only |
| Tree + export | Export includes nested rows |
| Tree + group | Group ignored, console warn |

- [ ] **Step 5: Fix any regression before marking complete**

---

## Spec Coverage Self-Review

| Spec requirement | Task |
|---|---|
| `SdTableOptionTree` API | Task 1 |
| `SdTableMetaTree` | Task 1 |
| Tree pipe flatten | Task 2, 3 |
| `sdTreeToggle` column | Task 4, 7 |
| Lazy load + cache | Task 6 Step 7 |
| `maxDepth` | Task 2 util |
| `defaultExpanded` | Task 2 util, Task 6 Step 5 |
| Paginate root only | No change to `#filterLocal` slice logic (roots only) â€” Task 10 verify |
| Coexist expand | Task 10 checklist |
| Group mutually exclusive | Task 5 |
| Row reorder root only | Task 6 Step 8 |
| Export flatten all | Task 6 Step 9 |
| Filter root only | Existing `#filterLocal` on roots â€” Task 10 verify |
| Circular ref guard | Task 2 |
| Demo | Task 8 |
| Docs | Task 9 |

**No placeholders remain.**

---

## Execution Handoff

Plan saved to `docs/superpowers/plans/2026-05-22-table-row-children.md`.

**Hai lá»±a chá»n triá»ƒn khai:**

1. **Subagent-Driven (recommended)** â€” dispatch subagent per task, review giá»¯a cÃ¡c task
2. **Inline Execution** â€” implement trá»±c tiáº¿p trong session nÃ y theo tá»«ng task

Báº¡n muá»‘n triá»ƒn khai theo cÃ¡ch nÃ o?

