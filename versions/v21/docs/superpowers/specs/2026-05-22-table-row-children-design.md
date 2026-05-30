# Table Row Children (Tree Rows) â€” Design Spec

**Date:** 2026-05-22  
**Component:** `@sd-angular/components/table` (SdTable)  
**Status:** Approved (awaiting user spec review â†’ implementation plan)

## 1. Goal

ThÃªm tÃ­nh nÄƒng **tree rows** cho `sd-table`: má»—i row cÃ³ thá»ƒ cÃ³ danh sÃ¡ch child rows, render inline dÆ°á»›i parent vá»›i expand/collapse, há»— trá»£ Ä‘á»‡ quy nhiá»u cáº¥p (giá»›i háº¡n bá»Ÿi `maxDepth`).

YÃªu cáº§u Ä‘Ã£ xÃ¡c nháº­n:

| Quyáº¿t Ä‘á»‹nh | Lá»±a chá»n |
|---|---|
| Loáº¡i | Tree table â€” má»—i row cÃ³ children |
| Key children | Cáº¥u hÃ¬nh Ä‘Æ°á»£c, máº·c Ä‘á»‹nh `"children"` |
| Äá»™ sÃ¢u | `maxDepth` cáº¥u hÃ¬nh Ä‘Æ°á»£c |
| Expand ban Ä‘áº§u | `defaultExpanded`: `boolean \| number` |
| Nguá»“n data | Embedded máº·c Ä‘á»‹nh + lazy load qua callback |
| Pagination (server) | Chá»‰ paginate root rows; `total` = sá»‘ root |

Docs hiá»‡n táº¡i ghi rÃµ table **chÆ°a** há»— trá»£ recursive tree â€” spec nÃ y bá»• sung capability Ä‘Ã³.

## 2. Public API

### 2.1 `SdTableOptionTree<T>`

File má»›i: `projects/sdcorejs-angular/components/table/src/models/table-option-tree.model.ts`

```typescript
export interface SdTableOptionTree<T = any> {
  /**
   * Key trÃªn object row chá»©a máº£ng children.
   * Máº·c Ä‘á»‹nh: 'children'
   */
  childrenKey?: string;

  /**
   * Giá»›i háº¡n Ä‘á»™ sÃ¢u cÃ¢y.
   * 1 = chá»‰ 1 cáº¥p con trá»±c tiáº¿p.
   * undefined = khÃ´ng giá»›i háº¡n.
   */
  maxDepth?: number;

  /**
   * Tráº¡ng thÃ¡i expand ban Ä‘áº§u sau má»—i láº§n load/reload.
   * - false â†’ thu gá»n háº¿t
   * - true â†’ má»Ÿ háº¿t (trong pháº¡m vi maxDepth)
   * - number â†’ má»Ÿ tá»›i cáº¥p N (0 = root only visible)
   */
  defaultExpanded?: boolean | number;

  /**
   * Lazy load children khi row chÆ°a cÃ³ data embedded táº¡i childrenKey.
   * Káº¿t quáº£ Ä‘Æ°á»£c cache vÃ o row[childrenKey] sau láº§n fetch Ä‘áº§u.
   */
  onExpandChildren?: (rowData: T) => Promise<T[]> | T[];

  /**
   * Pixel indent má»—i cáº¥p depth trong cá»™t sdTreeToggle.
   * Máº·c Ä‘á»‹nh: 20
   */
  indentSize?: number;
}
```

### 2.2 ThÃªm vÃ o `SdTableOption`

```typescript
// table-option.model.ts â€” SdTableBaseOption
tree?: SdTableOptionTree<T>;
```

### 2.3 Meta má»Ÿ rá»™ng trÃªn `SdTableItem`

```typescript
// table-item.model.ts
export interface SdTableMetaTree {
  level: number;           // 0 = root
  hasChildren: boolean;
  isExpanded: boolean;
  isExpanding?: boolean;   // lazy load in progress
  parentId?: string;       // meta.id cá»§a parent row
}

export interface SdTableMeta<T> {
  // ...existing fields
  tree?: SdTableMetaTree;
}
```

`MapToSdTableItem` khá»Ÿi táº¡o:

```typescript
tree: {
  level: 0,
  hasChildren: false,
  isExpanded: false,
  isExpanding: false,
}
```

### 2.4 VÃ­ dá»¥ sá»­ dá»¥ng

**Embedded (máº·c Ä‘á»‹nh):**

```typescript
option: SdTableOption<Department> = {
  type: 'local',
  tree: {
    childrenKey: 'children',
    maxDepth: 3,
    defaultExpanded: 1,
  },
  items: () => [
    {
      id: 1,
      name: 'PhÃ²ng IT',
      children: [
        { id: 11, name: 'Team Frontend' },
        {
          id: 12,
          name: 'Team Backend',
          children: [{ id: 121, name: 'Sub-team API' }],
        },
      ],
    },
  ],
  columns: [/* ... */],
};
```

**Lazy load:**

```typescript
tree: {
  onExpandChildren: (row) => this.api.getChildren(row.id),
}
```

**Server mode (paginate root only):**

```typescript
option: SdTableOption<OrgUnit> = {
  type: 'server',
  tree: { maxDepth: 2, defaultExpanded: false },
  items: async (filterReq, pagingReq) => {
    const res = await this.api.getOrgUnits(pagingReq);
    // res.items: root rows, má»—i row cÃ³ thá»ƒ embed children táº¡i key 'children'
    return { items: res.items, total: res.total }; // total = root count
  },
  columns: [/* ... */],
};
```

## 3. Kiáº¿n trÃºc

### 3.1 Approach (Ä‘Ã£ chá»n)

**Tree Pipe + cá»™t toggle riÃªng (`sdTreeToggle`)** â€” theo pattern `sdGroup` pipe hiá»‡n cÃ³.

```
items (root SdTableItem[])
  â†’ sdTree pipe (flatten theo expand state + maxDepth)
  â†’ sdGroup pipe (náº¿u group enabled â€” xem Â§5.1)
  â†’ mat-table dataSource
```

### 3.2 Luá»“ng dá»¯ liá»‡u

```
#load / #render
  â””â”€ items.set(rootItems)          // chá»‰ root rows tá»« server/local
  â””â”€ initTreeMeta(rootItems)       // set level=0, hasChildren, defaultExpanded

Template
  â””â”€ groupedItems = items | sdTree:treeOption | sdGroup:tableOption
  â””â”€ mat-table [dataSource]="groupedItems"

onTreeToggle(row)
  â””â”€ toggle row.meta.tree.isExpanded
  â””â”€ náº¿u lazy && chÆ°a cÃ³ children â†’ onExpandChildren â†’ cache vÃ o row.data[childrenKey]
  â””â”€ trigger CD â†’ sdTree pipe re-flatten
```

### 3.3 Tree utilities

File má»›i: `services/tree/tree.util.ts`

| Function | Má»¥c Ä‘Ã­ch |
|---|---|
| `getChildrenKey(option)` | Resolve key, default `'children'` |
| `getChildren(data, key)` | Äá»c máº£ng children tá»« row data |
| `resolveDefaultExpanded(level, option)` | TÃ­nh isExpanded ban Ä‘áº§u theo `defaultExpanded` |
| `initTreeMeta(items, option, parent?)` | Walk root items, set meta.tree |
| `flattenTree(items, option, visited?)` | DFS flatten visible rows; guard circular ref báº±ng `Set<meta.id>` |
| `hasLazyChildren(row, option)` | Row khÃ´ng cÃ³ embedded children nhÆ°ng cÃ³ `onExpandChildren` |

### 3.4 SdTreePipe

File má»›i: `pipes/sd-tree.pipe.ts`

```typescript
@Pipe({ name: 'sdTree', pure: true })
export class SdTreePipe implements PipeTransform {
  transform(items: SdTableItem[], treeOption?: SdTableOptionTree): SdTableItem[] {
    if (!treeOption) return items;
    return flattenTree(items, treeOption);
  }
}
```

Pipe **pure** â€” re-run khi reference `items` signal thay Ä‘á»•i hoáº·c sau toggle (trigger báº±ng shallow copy / detectChanges sau mutate meta).

## 4. UI

### 4.1 Cá»™t `sdTreeToggle`

ThÃªm vÃ o `ConfigService` (special column, khÃ´ng resize):

```
[ reorder? ] [ selection? ] [ sdTreeToggle ] [ command-left? ] [ data columns... ] [ command-right? ] [ expand? ]
```

Chá»‰ inject khi `option.tree` Ä‘Æ°á»£c khai bÃ¡o.

| Tráº¡ng thÃ¡i | Hiá»ƒn thá»‹ |
|---|---|
| `hasChildren === true` | `expand_more` / `expand_less`; spinner khi `isExpanding` |
| Leaf row | Spacer trá»‘ng (giá»¯ indent alignment) |
| Level N | `padding-left: level Ã— indentSize` |

Click icon â†’ `onTreeToggle(row)`.

Width cá»‘ Ä‘á»‹nh ~40px. Loáº¡i trá»« khá»i column resize (cÃ¹ng rule `sdSelection`, `reorder`, â€¦).

### 4.2 Row CSS

```html
<tr mat-row
  class="c-row sd-tree-row"
  [class]="'sd-tree-level-' + row.meta.tree?.level">
```

`option.style.rowCss` â€” má»Ÿ rá»™ng backward-compatible, thÃªm tham sá»‘ optional thá»© 3:

```typescript
rowCss?: (row: T, index: number, ctx?: { level: number; hasChildren: boolean; isExpanded: boolean }) => Record<string, string>;
```

### 4.3 Lazy load UX

1. User click expand trÃªn row chÆ°a cÃ³ embedded children
2. `isExpanding = true` â†’ spinner trong toggle cell
3. `await onExpandChildren(row.data)`
4. Success â†’ gÃ¡n `row.data[childrenKey] = result`, `isExpanded = true`, init meta cho children
5. Fail â†’ `isExpanding = false`, `SdNotifyService.warning(...)`, khÃ´ng expand

## 5. TÆ°Æ¡ng tÃ¡c vá»›i tÃ­nh nÄƒng hiá»‡n cÃ³

| TÃ­nh nÄƒng | HÃ nh vi v1 |
|---|---|
| `option.expand` (master-detail) | **Coexist** â€” tree toggle trÃ¡i, expand detail pháº£i |
| `option.group` | **Mutually exclusive** â€” náº¿u cÃ³ `tree`, ignore `group`; `console.warn` dev |
| `rowReorder` | Chá»‰ level 0 reorder; child rows `cdkDragDisabled` |
| `selector` | Selection Ä‘á»™c láº­p tá»«ng row; khÃ´ng cascade |
| `commands` | Hoáº¡t Ä‘á»™ng trÃªn má»i row (root + child) |
| Column resize | `sdTreeToggle` excluded |
| Sort (local) | Sort **root rows only**; children giá»¯ thá»© tá»± trong máº£ng `children` |
| Filter (local) | Filter trÃªn **root rows only** (v1); khÃ´ng deep-search trong children |
| Export | Flatten toÃ n bá»™ cÃ¢y (má»i levels, báº¥t ká»ƒ expand state) |
| Pagination (server) | `total` vÃ  page size chá»‰ tÃ­nh root rows |

### 5.1 Tree + Group

v1: khÃ´ng há»— trá»£ káº¿t há»£p. `sdTree` cháº¡y trÆ°á»›c; náº¿u `tree` present thÃ¬ `sdGroup` no-op.

### 5.2 Reload & expand state persistence

Sau `reload()`:
- Row cÃ³ cÃ¹ng `meta.id` (hash data) â†’ giá»¯ `isExpanded`
- Row má»›i â†’ Ã¡p `defaultExpanded`
- Lazy-loaded children cache trÃªn `row.data[childrenKey]` Ä‘Æ°á»£c giá»¯ náº¿u row object cÃ²n tá»“n táº¡i

## 6. Edge Cases

| Case | Xá»­ lÃ½ |
|---|---|
| `children: []` | Leaf â€” khÃ´ng hiá»‡n toggle |
| `maxDepth` reached | KhÃ´ng descend dÃ¹ data cÃ³ children sÃ¢u hÆ¡n |
| Circular reference | `visited Set<meta.id>` khi flatten; skip node Ä‘Ã£ visit |
| `tree` + `group` | Ignore group, warn |
| Lazy load error | Warning notify, khÃ´ng expand |
| Empty `onExpandChildren` result | Treat as leaf sau fetch |
| `defaultExpanded: 0` | Chá»‰ hiá»‡n root, táº¥t cáº£ collapsed |

## 7. Files thay Ä‘á»•i

| File | Thay Ä‘á»•i |
|---|---|
| `models/table-option-tree.model.ts` | **Má»›i** |
| `models/table-item.model.ts` | `SdTableMetaTree`, init trong `MapToSdTableItem` |
| `models/table-option.model.ts` | `tree?: SdTableOptionTree<T>` |
| `models/index.ts` | Export |
| `pipes/sd-tree.pipe.ts` | **Má»›i** |
| `pipes/sd-tree.pipe.spec.ts` | **Má»›i** |
| `pipes/index.ts` | Export |
| `services/tree/tree.util.ts` | **Má»›i** |
| `services/config.service.ts` | Inject `sdTreeToggle` column |
| `table.component.ts` | `onTreeToggle`, `initTreeMeta`, imports |
| `table.component.html` | `sdTreeToggle` column, pipe chain, row classes |
| `table.component.scss` | Tree toggle + indent styles |
| `table.component.spec.ts` | Toggle + lazy tests |
| `sd-table.md` | Document `option.tree` |
| Demo page | Tab/section demo embedded + lazy |

## 8. Out of Scope v1

- Cascade selection parent â†” children
- Drag reorder child rows
- `tree` + `group` combined
- Custom template per level (`sdTableTreeDef`)
- Server-side paginated children (load children page-by-page)
- Deep filter (search trong children + auto-expand matched branch)

## 9. Testing Plan

### Unit â€” `sd-tree.pipe.spec.ts`

- Flatten embedded 2 levels: collapsed vs expanded
- `maxDepth: 1` â€” chá»‰ 1 cáº¥p con
- `defaultExpanded: 2` â€” má»Ÿ Ä‘Ãºng depth
- Circular reference guard
- Empty children array â†’ leaf

### Unit â€” `tree.util.spec.ts`

- `resolveDefaultExpanded` vá»›i boolean / number
- `hasLazyChildren` detection

### Component â€” `table.component.spec.ts`

- Toggle expand/collapse â†’ Ä‘Ãºng sá»‘ visible rows
- `onExpandChildren` Promise â†’ children render
- Lazy fail â†’ khÃ´ng expand, khÃ´ng crash

### Demo manual

- Local table: nested `children` 3 cáº¥p, `maxDepth: 3`
- Lazy tab: expand parent â†’ API fetch
- Server tab: verify paginator total = root count

### Build verification

```bash
cd vn-angular && npx ng build sdcorejs-angular && npx ng build demo
```

## 10. Decisions Log

| # | CÃ¢u há»i | Quyáº¿t Ä‘á»‹nh |
|---|---|---|
| 1 | Loáº¡i feature | A â€” Tree table |
| 2 | Depth | C â€” `maxDepth` configurable |
| 3 | Default expand | C â€” `defaultExpanded: boolean \| number` |
| 4 | Data source | C â€” Embedded default + lazy callback |
| 5 | Pagination | A â€” Root only |
| 6 | UI approach | 1 â€” Tree pipe + `sdTreeToggle` column |

